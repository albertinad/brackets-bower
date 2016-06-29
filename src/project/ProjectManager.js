/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 - 2016 Intel Corporation
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4,
maxerr: 50, browser: true */
/*global define, brackets, $ */

define(function (require, exports) {
    "use strict";

    var _                    = brackets.getModule("thirdparty/lodash"),
        AppInit              = brackets.getModule("utils/AppInit"),
        Async                = brackets.getModule("utils/Async"),
        ProjectManager       = brackets.getModule("project/ProjectManager"),
        EventDispatcher      = brackets.getModule("utils/EventDispatcher"),
        DocumentManager      = brackets.getModule("document/DocumentManager"),
        PackageManager       = require("src/bower/PackageManager"),
        PackageFactory       = require("src/project/PackageFactory"),
        FileSystemHandler    = require("src/project/FileSystemHandler"),
        BowerProject         = require("src/project/Project"),
        BowerJson            = require("src/metadata/BowerJson"),
        BowerRc              = require("src/metadata/BowerRc"),
        FileUtils            = require("src/utils/FileUtils"),
        ErrorUtils           = require("src/utils/ErrorUtils");

    var namespace               = ".albertinad.bracketsbower",
        PROJECT_LOADING         = "bowerProjectLoading",
        PROJECT_READY           = "bowerProjectReady",
        PROJECT_STATUS_CHANGED  = "bowerProjectStatusChanged",
        DEPENDENCIES_ADDED      = "bowerProjectDepsAdded",
        DEPENDENCIES_REMOVED    = "bowerProjectDepsRemoved",
        DEPENDENCY_UPDATED      = "bowerProjectDepUpdated",
        ACTIVE_DIR_CHANGED      = "bowerActiveDirChanged",
        BOWER_JSON_RELOADED     = "bowerjsonReloaded",
        BOWERRC_RELOADED        = "bowerrcReloaded",
        PROJECT_PKS_DIR_CHANGED = "bowerProjectPkgsChanged";

    var Events = {
        PROJECT_LOADING: PROJECT_LOADING + namespace,
        PROJECT_READY: PROJECT_READY + namespace,
        PROJECT_STATUS_CHANGED: PROJECT_STATUS_CHANGED + namespace,
        DEPENDENCIES_ADDED: DEPENDENCIES_ADDED + namespace,
        DEPENDENCIES_REMOVED: DEPENDENCIES_REMOVED + namespace,
        DEPENDENCY_UPDATED: DEPENDENCY_UPDATED + namespace,
        ACTIVE_DIR_CHANGED: ACTIVE_DIR_CHANGED + namespace,
        BOWER_JSON_RELOADED: BOWER_JSON_RELOADED + namespace,
        BOWERRC_RELOADED: BOWERRC_RELOADED + namespace,
        PROJECT_PKS_DIR_CHANGED: PROJECT_PKS_DIR_CHANGED + namespace
    };

    var REGEX_NODE_MODULES     = /node_modules/,
        REGEX_BOWER_COMPONENTS = /bower_components/;

    var SyncOptions = {
        MATCH_BOWER_JSON: 0,
        MATCH_PROJECT_FOLDER: 1
    };

    var _bowerProject;

    EventDispatcher.makeEventDispatcher(exports);

    /**
     * Wrap a function to validate first if a BowerProject instance is available.
     * @param {function} fn Function to wrap to add validation. It must return a
     * promise.
     * @return {$.Deferred}
     * @private
     */
    function _wrap(fn) {
        return function () {
            if (!_bowerProject) {
                return (new $.Deferred()).reject(ErrorUtils.createError(ErrorUtils.NO_PROJECT));
            }

            return fn.apply(null, arguments);
        };
    }

    function listProjectDependencies() {
        return PackageManager.list(true).then(function (result) {
            // create the package model
            return PackageFactory.createPackagesRecursive(result.dependencies);
        }).then(function (packages) {
            return _.values(packages);
        });
    }

    /**
     * Create the bower.json file.
     */
    function createBowerJson() {
        var bowerJson = new BowerJson(_bowerProject);

        return bowerJson.create(_bowerProject.getProjectPackages()).then(function () {
            _bowerProject.activeBowerJson = bowerJson;
        }).fail(function (error) {
            _bowerProject.activeBowerJson = null;
        });
    }

    /**
     * Deletes the active bower.json file if it exists.
     */
    function removeBowerJson() {
        return _bowerProject.removeBowerJson();
    }

    /**
     * Get the current active BowerJson object. Null means there's
     * no BowerJson for the project.
     * @return {BowerJson} Current active BowerJson object.
     */
    function getBowerJson() {
        return _bowerProject ? _bowerProject.activeBowerJson : null;
    }

    /**
     * Open the bower.json in the editor, if it exists.
     */
    function openBowerJson() {
        var bowerJson;

        if (_bowerProject && _bowerProject.activeBowerJson) {
            bowerJson = _bowerProject.activeBowerJson;

            FileUtils.openInEditor(bowerJson.AbsolutePath);
        }
    }

    /**
     * Notify when the bower.json was reloaded: created, modified or deleted.
     * @private
     */
    function _notifyBowerJsonReloaded() {
        exports.trigger(BOWER_JSON_RELOADED);
    }

    /**
     * @private
     */
    function _loadBowerJson() {
        var bowerJson;

        return BowerJson.findInPath(_bowerProject.getPath()).then(function () {
            bowerJson = new BowerJson(_bowerProject);

            return bowerJson.loadAllDependencies();
        }).then(function () {
            _bowerProject.activeBowerJson = bowerJson;
        }).fail(function (error) {
            if (!error || error.code !== ErrorUtils.EMALFORMED_BOWER_JSON) {
                bowerJson = null;
            }
            _bowerProject.activeBowerJson = bowerJson;
        }).always(function () {
            _notifyBowerJsonReloaded();
        });
    }

    /**
     * @private
     */
    function _loadAddedBowerJson() {
        return BowerJson.findInPath(_bowerProject.getPath()).then(function () {
            var bowerJson = new BowerJson(_bowerProject);

            _bowerProject.activeBowerJson = bowerJson;

            return bowerJson.loadAllDependencies();
        }).then(function () {
            // start loading project dependencies
            return listProjectDependencies().then(function (packagesArray) {
                _bowerProject.setPackages(packagesArray);

                PackageManager.listWithVersions().then(function (packagesArray) {
                    if (_bowerProject) {
                        _bowerProject.setPackages(packagesArray);
                    }
                });
            });
        }).fail(function (error) {
            // show the error
            ErrorUtils.handleError(error);
        });
    }

    /**
     * @private
     */
    function _loadAddedBowerRc() {
        return BowerRc.findInPath(_bowerProject.getPath()).then(function () {
            _bowerProject.activeBowerRc = new BowerRc(_bowerProject);

            _bowerProject.onBowerRcChanged();
        }).fail(function (error) {
            // show the error
            ErrorUtils.handleError(error);
        });
    }

    /**
     * Create the .bowerrc file for the current project.
     */
    function createBowerRc() {
        var bowerRc = new BowerRc(_bowerProject);

        return bowerRc.create().then(function () {
            _bowerProject.activeBowerRc = bowerRc;
        }).fail(function (error) {
            _bowerProject.activeBowerRc = null;
        });
    }

    /**
     * Remove the current .bowerrc file of the current project.
     */
    function removeBowerRc() {
        return _bowerProject.removeBowerRc();
    }

    function getBowerRc() {
        return _bowerProject ? _bowerProject.activeBowerRc : null;
    }

    function openBowerRc() {
        var bowerRc;

        if (_bowerProject && _bowerProject.activeBowerRc) {
            bowerRc = _bowerProject.activeBowerRc;

            FileUtils.openInEditor(bowerRc.AbsolutePath);
        }
    }

    /**
     * @private
     */
    function _notifyBowerRcReloaded() {
        exports.trigger(BOWERRC_RELOADED);
    }

    /**
     * @private
     */
    function _loadBowerRc() {
        var bowerRc;

        return BowerRc.findInPath(_bowerProject.getPath()).then(function () {
            bowerRc = new BowerRc(_bowerProject);

            return bowerRc.loadConfiguration();
        }).then(function () {
            _bowerProject.activeBowerRc = bowerRc;
        }).fail(function (error) {
            _bowerProject.activeBowerRc = null;
        }).always(function () {
            _notifyBowerRcReloaded();
        });
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
        return _bowerProject ? _bowerProject.getProjectPackages() : [];
    }

    /**
     * @return {object}
     */
    function getPackagesSummary() {
        return _bowerProject ? _bowerProject.getPackagesSummary() : [];
    }

    /**
     * Initialization sequence when the project changes. Notifies that the
     * BowerProject instance is loading. Load the current project dependencies
     * if any, the configuration for the project and bower.json if any. After
     * loading the current project infomartation, notifies that the bower project
     * is ready.
     * @return {$.Promise}
     */
    function _configureBowerProject() {
        var deferred = new $.Deferred(),
            loadPromises;

        // notify bower project is being loaded
        exports.trigger(PROJECT_LOADING);

        if (!_bowerProject) {
            exports.trigger(PROJECT_READY);

            return deferred.reject(ErrorUtils.createError(ErrorUtils.NO_PROJECT));
        }

        loadPromises = [_loadBowerRc(), _loadBowerJson()];

        Async.waitForAll(loadPromises).then(function () {
            // start loading project dependencies
            listProjectDependencies().then(function (packagesArray) {
                _bowerProject.setPackages(packagesArray);

                // check for dependencies updates
                PackageManager.listWithVersions().then(function (packagesArray) {
                    if (_bowerProject) {
                        _bowerProject.setPackages(packagesArray);
                    }
                });
            }).always(function () {
                FileSystemHandler.startListenToFileSystem(_bowerProject);

                // notify bower project is ready
                exports.trigger(PROJECT_READY);

                deferred.resolve();
            });
        });

        return deferred.promise();
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

        _configureBowerProject().then(function () {
            exports.trigger(ACTIVE_DIR_CHANGED, path, _bowerProject.shortActiveDir);
        });
    }

    /**
     * Update the BowerProject instance active path when it is selected from the Project Tree.
     * Reload BowerProject instance and FileSystemHandler to be aware of this changes.
     * @param {string} activeDir Full path.
     */
    function updateActiveDirToSelection() {
        if (_bowerProject === null) {
            return;
        }

        // get the cwd according to selection
        var selectedItem = ProjectManager.getSelectedItem(),
            activeDir = selectedItem.isDirectory ? selectedItem.fullPath : selectedItem.parentPath;

        _setActiveDir(activeDir);
    }

    /**
     * Check the status of current project packages and validate it against
     * the definition in bower.json file if any.
     * @return {object}
     */
    function getProjectStatus() {
        return _bowerProject ? _bowerProject.getStatus() : null;
    }

    /**
     * Synchronize project packages.
     * - MATCH_BOWER_JSON: Install the missing packages defined in bower.json file and uninstall
     * those packages that are not tracked in the bower.json.
     * - MATCH_PROJECT_FOLDER: Add to bower.json file the extraneous installed packages and remove the
     * missing packages from dependencies and devDependencies in bower.json file.
     * @return {$.Promise}
     */
    function synchronizeProject(syncOption) {
        if (syncOption === SyncOptions.MATCH_PROJECT_FOLDER) {
            return _bowerProject.syncWithCurrentPackages();
        } else {
            // default match bower.json
            return _bowerProject.syncWithBowerJson();
        }
    }

    /**
     * Synchronized the project dependencies with current bower.json by executing prune or install
     * following the current status.
     * NOTE: This function shouldn't be called from ProjectManager.
     * @param {boolean} existsExtraneous
     * @param {boolean} existsMissing
     */
    function syncDependenciesWithBowerJson(existsExtraneous, existsBowerJsonChanges) {
        var deferredCmds = [],
            packages = {},
            syncError;

        function removeExtraneous() {
            return PackageManager.prune().then(function (removedPackages) {
                // save the uninstalled package
                packages.removed = removedPackages;
            }).fail(function (error) {
                syncError = error;

                console.log("[bower-sync] \"prune\" error.", syncError);

                return $.Deferred().reject(syncError);
            });
        }

        function install() {
            return PackageManager.install().then(function (result) {
                if (result.installed.length !== 0) {
                    packages.installed = result.installed;
                }

                if (result.updated.length !== 0) {
                    packages.updated = result.updated;
                }
            }).fail(function (error) {
                syncError = error;

                console.log("[bower-sync] \"install\" error.", syncError);

                return $.Deferred().reject(syncError);
            });
        }

        if (existsExtraneous) {
            // uninstall untracked packages
            deferredCmds.push(removeExtraneous);
        }

        if (existsBowerJsonChanges) {
            // install missing packages
            deferredCmds.push(install);
        }

        function onNextCmd(cmdFn) {
            return cmdFn();
        }

        return Async.doSequentially(deferredCmds, onNextCmd, true).then(function () {
            return packages;
        }).fail(function () {
            return $.Deferred().reject(syncError);
        });
    }

    /**
     * @param {string} name Project package name.
     * @param {number=} dependencyType Package dependency type: production or development.
     */
    function trackPackage(name, dependencyType) {
        return _bowerProject.trackPackage(name, dependencyType);
    }

    /**
     * @param {string} name Project package name.
     */
    function untrackPackage(name) {
        return _bowerProject.untrackPackage(name);
    }

    /**
     * Callback for when the project is opened. Gets the current project, create
     * a BowerProject instance as a proxy of the current project and starts
     * applying the configuration for Bower.
     */
    function _projectOpen() {
        // get the current/active project
        var project = ProjectManager.getProjectRoot(),
            name,
            rootPath;

        if (project) {
            name = project.name;
            rootPath = project.fullPath;

            _bowerProject = new BowerProject(name, rootPath, exports);
        } else {
            _bowerProject = null;
        }

        _configureBowerProject();

        // by default on project open, the default active path is set to project root path
        exports.trigger(ACTIVE_DIR_CHANGED, "", "");
    }

    /**
     * Initialization function. It must be called only once. It configures the current project
     * if any and setup the event listeners for ProjectManager and DocumentManager events.
     */
    function initialize() {
        _projectOpen();

        ProjectManager.on("projectOpen", _projectOpen);

        ProjectManager.on("projectClose", function () {
            FileSystemHandler.stopListenToFileSystem();
        });

        DocumentManager.on("fileNameChange", function (event, oldName, newName) {
            if (_bowerProject && _bowerProject.activeDir === oldName) {
                // the active folder was renamed, update it
                _setActiveDir(newName);
            }
        });

        DocumentManager.on("pathDeleted", function (event, fullPath) {
            if (_bowerProject && _bowerProject.activeDir === fullPath) {
                _setActiveDir(_bowerProject.rootPath);
            }
        });
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

    function notifyProjectStatusChanged(projectStatus) {
        exports.trigger(PROJECT_STATUS_CHANGED, projectStatus);
    }

    function notifyPackagesDirectoryChanged(oldDirectoryPath, newDirectoryPath) {
        exports.trigger(PROJECT_PKS_DIR_CHANGED, oldDirectoryPath, newDirectoryPath);
    }

    AppInit.appReady(function () {
        var Events = FileSystemHandler.Events;

        // bower.json

        FileSystemHandler.on(Events.BOWER_JSON_CREATED, function () {
            if (_bowerProject) {
                _loadAddedBowerJson().always(function () {
                    _notifyBowerJsonReloaded();
                });
            }
        });

        FileSystemHandler.on(Events.BOWER_JSON_DELETED, function () {
            if (_bowerProject) {
                _bowerProject.removeBowerJson().always(function () {
                    _notifyBowerJsonReloaded();
                });
            }
        });

        FileSystemHandler.on(Events.BOWER_JSON_CHANGED, function () {
            if (_bowerProject) {
                _bowerProject.onBowerJsonChanged();
            }
        });

        // bowerrc

        FileSystemHandler.on(Events.BOWER_BOWERRC_CREATED, function () {
            if (_bowerProject) {
                _loadAddedBowerRc().always(function () {
                    _notifyBowerRcReloaded();
                });
            }
        });

        FileSystemHandler.on(Events.BOWER_BOWERRC_DELETED, function () {
            if (_bowerProject) {
                _bowerProject.removeBowerRc().always(function () {
                    _notifyBowerRcReloaded();
                });
            }
        });

        FileSystemHandler.on(Events.BOWER_BOWERRC_CHANGED, function () {
            if (_bowerProject) {
                _bowerProject.onBowerRcChanged();
            }
        });
    });

    exports.initialize                 = initialize;
    exports.getProject                 = getProject;
    exports.getProjectDependencies     = getProjectDependencies;
    exports.getPackagesSummary         = getPackagesSummary;
    exports.updateActiveDirToSelection = updateActiveDirToSelection;
    exports.getProjectStatus           = getProjectStatus;
    exports.listProjectDependencies    = _wrap(listProjectDependencies);
    exports.synchronizeProject         = _wrap(synchronizeProject);
    exports.trackPackage               = _wrap(trackPackage);
    exports.untrackPackage             = _wrap(untrackPackage);
    exports.createBowerJson            = _wrap(createBowerJson);
    exports.removeBowerJson            = _wrap(removeBowerJson);
    exports.createBowerRc              = _wrap(createBowerRc);
    exports.removeBowerRc              = _wrap(removeBowerRc);
    exports.getBowerJson               = getBowerJson;
    exports.getBowerRc                 = getBowerRc;
    exports.openBowerJson              = openBowerJson;
    exports.openBowerRc                = openBowerRc;
    exports.SyncOptions                = SyncOptions;
    exports.Events                     = Events;

    exports.notifyDependenciesAdded        = notifyDependenciesAdded;
    exports.notifyDependenciesRemoved      = notifyDependenciesRemoved;
    exports.notifyDependencyUpdated        = notifyDependencyUpdated;
    exports.notifyProjectStatusChanged     = notifyProjectStatusChanged;
    exports.notifyPackagesDirectoryChanged = notifyPackagesDirectoryChanged;
    exports.syncDependenciesWithBowerJson  = syncDependenciesWithBowerJson;
});
