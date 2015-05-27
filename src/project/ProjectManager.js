/*
 * Copyright (c) 2014 Narciso Jaramillo. All rights reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 *
 */

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4,
maxerr: 50, browser: true */
/*global define, brackets, $ */

define(function (require, exports) {
    "use strict";

    var ProjectManager       = brackets.getModule("project/ProjectManager"),
        EventDispatcher      = brackets.getModule("utils/EventDispatcher"),
        DocumentManager      = brackets.getModule("document/DocumentManager"),
        PackageManager       = require("src/bower/PackageManager"),
        PackageFactory       = require("src/project/PackageFactory"),
        FileSystemHandler    = require("src/project/FileSystemHandler"),
        BowerJsonManager     = require("src/project/BowerJsonManager"),
        ConfigurationManager = require("src/configuration/ConfigurationManager"),
        BowerProject         = require("src/project/Project"),
        ErrorUtils           = require("src/utils/ErrorUtils");

    var _bowerProject;

    var namespace            = ".albertinad.bracketsbower",
        PROJECT_LOADING      = "bowerProjectLoading",
        PROJECT_READY        = "bowerProjectReady",
        DEPENDENCIES_ADDED   = "bowerProjectDepsAdded",
        DEPENDENCIES_REMOVED = "bowerProjectDepsRemoved",
        DEPENDENCY_UPDATED   = "bowerProjectDepUpdated",
        ACTIVE_DIR_CHANGED   = "bowerActiveDirChanged";

    var Events = {
        PROJECT_LOADING: PROJECT_LOADING + namespace,
        PROJECT_READY: PROJECT_READY + namespace,
        DEPENDENCIES_ADDED: DEPENDENCIES_ADDED + namespace,
        DEPENDENCIES_REMOVED: DEPENDENCIES_REMOVED + namespace,
        DEPENDENCY_UPDATED: DEPENDENCY_UPDATED + namespace,
        ACTIVE_DIR_CHANGED: ACTIVE_DIR_CHANGED + namespace
    };

    var REGEX_NODE_MODULES     = /node_modules/,
        REGEX_BOWER_COMPONENTS = /bower_components/;

    EventDispatcher.makeEventDispatcher(exports);

    /**
     * Create a BowerProject instance as a proxy of the current project.
     * @param {object} project Current active project.
     */
    function _createBowerProject(project) {
        var name = project.name,
            rootPath = project.fullPath;

        return new BowerProject(name, rootPath, exports);
    }

    /**
     * Get the current BowerProject instance.
     * @return {object} bowerProject
     */
    function getProject() {
        return _bowerProject;
    }

    /**
     * Get the current project dependencies.
     * @return {Array}
     */
    function getProjectDependencies() {
        return (_bowerProject) ? _bowerProject.getPackagesArray() : [];
    }

    function listProjectDependencies() {
        var deferred = new $.Deferred();

        if (!_bowerProject) {
            return deferred.reject(ErrorUtils.createError(ErrorUtils.NO_PROJECT));
        }

        PackageManager.list(true).then(function (result) {
            // create the package model
            return PackageFactory.createPackagesDeep(result.dependencies);
        }).then(function (packagesArray) {
            deferred.resolve(packagesArray);
        }).fail(function (error) {
            deferred.reject(error);
        });

        return deferred;
    }

    /**
     * Check for packages updates based on the current installed packages.
     * If the packages have upates, update the information from the current
     * project installed packages.
     * @return {$.Deferred}
     */
    function checkForUpdates() {
        var deferred = new $.Deferred();

        if (!_bowerProject) {
            return deferred.reject(ErrorUtils.createError(ErrorUtils.NO_PROJECT));
        }

        PackageManager.list().then(function (result) {

            return PackageFactory.createPackagesDeep(result.dependencies);
        }).then(function (packagesArray) {
            _bowerProject.setPackages(packagesArray);

            deferred.resolve(packagesArray);
        }).fail(function (error) {
            deferred.reject(error);
        });

        return deferred;
    }
    /**
     * Initialization sequence when the project changes. Notifies that the
     * BowerProject instance is loading. Load the current project dependencies
     * if any, the configuration for the project and bower.json if any. After
     * loading the current project infomartation, notifies that the bower project
     * is ready.
     */
    function _configureBowerProject() {
        // notify bower project is being loaded
        exports.trigger(PROJECT_LOADING);

        // load bowerrc if any
        ConfigurationManager.loadBowerRc(_bowerProject).always(function () {
            // load bower.json if any
            BowerJsonManager.loadBowerJson(_bowerProject).always(function () {

                if (_bowerProject !== null) {
                    // start loading project dependencies
                    listProjectDependencies().then(function (packagesArray) {

                        _bowerProject.setPackages(packagesArray);

                        // try to get check for dependencies updates
                        checkForUpdates().fail(function () {
                            // TODO: handle when it fails not because network errors
                        });
                    }).fail(function () {
                        // do not handle failure
                    }).always(function () {

                        FileSystemHandler.startListenToFileSystem(_bowerProject);

                        // notify bower project is ready
                        exports.trigger(PROJECT_READY);
                    });
                } else {
                    FileSystemHandler.stopListenToFileSystem();
                    // notify bower project is ready
                    exports.trigger(PROJECT_READY);
                }
            });
        });
    }

    /**
     * Set the current active path to the BowerProject instance. Exclude node_modules
     * and bower_components folders.
     * @param {string} path The active path to set.
     */
    function _setActiveDir(path) {
        // exclude bower_components and node_modules folders
        if (path.match(REGEX_NODE_MODULES) || path.match(REGEX_BOWER_COMPONENTS)) {
            // do not set it as active path
            return;
        }

        _bowerProject.activeDir = path;

        exports.trigger(ACTIVE_DIR_CHANGED, path, _bowerProject.shortActiveDir);

        _configureBowerProject();
    }

    /**
     * Update the BowerProject instance active path when it is selected from the Project Tree.
     * Reload ConfigurationManager, BowerJsonManager and FileSystemHandler to be aware of this changes.
     * @param {string} activeDir Full path.
     */
    function updateActiveDirToSelection() {
        if (_bowerProject === null) {
            return;
        }

        var selectedItem = ProjectManager.getSelectedItem(),
            activeDir;

        // get the cwd according to selection
        if (selectedItem.isDirectory) {
            activeDir = selectedItem.fullPath;
        } else {
            activeDir = selectedItem.parentPath;
        }

        _setActiveDir(activeDir);
    }

    function notifyDependenciesAdded(result) {
        exports.trigger(DEPENDENCIES_ADDED, result);
    }

    function notifyDependenciesRemoved(removedPkgs) {
        exports.trigger(DEPENDENCIES_REMOVED, removedPkgs);
    }

    function notifyDependencyUpdated(pkg) {
        exports.trigger(DEPENDENCY_UPDATED, pkg);
    }

    /**
     * Callback for when the project is opened. Gets the current project and starts
     * applying the configuration for Bower.
     */
    function _projectOpen() {
        // get the current/active project
        var project = ProjectManager.getProjectRoot();

        _bowerProject = (project) ? _createBowerProject(project) : null;

        _configureBowerProject();

        // by default on project open, the default active path is set to project root path
        exports.trigger(ACTIVE_DIR_CHANGED, "", "");
    }

    /**
     * @private
     */
    function _projectClose() {
        FileSystemHandler.stopListenToFileSystem();
    }

    /**
     * @private
     */
    function _fileNameChange(event, oldName, newName) {
        if (_bowerProject && _bowerProject.activeDir === oldName) {
            // the active folder was renamed, update it
            _setActiveDir(newName);
        }
    }

    /**
     * @private
     */
    function _pathDeleted(event, fullPath) {
        if (_bowerProject && _bowerProject.activeDir === fullPath) {
            _setActiveDir(_bowerProject.rootPath);
        }
    }

    /**
     * Check the status of current project packages and validate it against
     * the definition in bower.json file if any. Get the summary of missing
     * packages and not tracked packages.
     * @return {object}
     */
    function checkProjectStatus() {
        var packages,
            missing = [],
            untracked = [],
            status = 0; // TODO sync

        if (!_bowerProject) {
            ErrorUtils.createError(ErrorUtils.NO_PROJECT);
        }

        if (!_bowerProject.hasBowerJson()) {
            ErrorUtils.createError(ErrorUtils.NO_BOWER_JSON);
        }

        // TODO

        packages = _bowerProject.getPackagesArray();

        packages.forEach(function (pkg) {
            if (pkg.isNotTracked()) {
                untracked.push(pkg);
            } else if (pkg.isMissing()) {
                missing.push(pkg);
            }
        });

        if (untracked.length !== 0 || missing.length !== 0) {
            status = 1; // TODO out of sync
        }

        var result = {
            status: status,
            untracked: untracked,
            missing: missing
        };

        return result;
    }

    /**
     * Install the missing packages defined in bower.json file and uninstall
     * those packages that are not tracked in the bower.json.
     * @return {$.Promise}
     */
    function synchronizeWithBowerJson() {
        var deferred = new $.Deferred(),
            status = checkProjectStatus();

        // uninstall untracked packages
        PackageManager.prune().then(function () {

            // install missing packages
            if (status.missing.length !== 0) {
                PackageManager.installFromBowerJson().then(function () {
                    deferred.resolve();
                });
            } else {
                deferred.resolve();
            }

        }).fail(function (error) {
            deferred.reject(error);
        });

        return deferred.promise();
    }

    /**
     * Add to bower.json file the extraneous installed packages and remove the
     * missing packages from dependencies and devDependencies in bower.json file.
     * @return {$.Promise}
     */
    function synchronizeWithProject() {
        var status = checkProjectStatus(),
            packages = {
                untracked: status.untracked,
                missing: status.missing
            };

        return _bowerProject.syncWithCurrentPackages(packages);
    }

    /**
     * Initialization function. It must be called only once. It configures the current project
     * if any and setup the event listeners for ProjectManager and DocumentManager events.
     */
    function initialize() {
        _projectOpen();

        ProjectManager.on("projectOpen", _projectOpen);
        ProjectManager.on("projectClose", _projectClose);

        DocumentManager.on("fileNameChange", _fileNameChange);
        DocumentManager.on("pathDeleted", _pathDeleted);
    }

    exports.initialize                 = initialize;
    exports.getProject                 = getProject;
    exports.getProjectDependencies     = getProjectDependencies;
    exports.updateActiveDirToSelection = updateActiveDirToSelection;
    exports.listProjectDependencies    = listProjectDependencies;
    exports.checkForUpdates            = checkForUpdates;
    exports.checkProjectStatus         = checkProjectStatus;
    exports.synchronizeWithBowerJson   = synchronizeWithBowerJson;
    exports.synchronizeWithProject     = synchronizeWithProject;
    exports.notifyDependenciesAdded    = notifyDependenciesAdded;
    exports.notifyDependenciesRemoved  = notifyDependenciesRemoved;
    exports.notifyDependencyUpdated    = notifyDependencyUpdated;
    exports.Events                     = Events;

    window.projectManager = exports;
});
