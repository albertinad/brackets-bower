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
/*global define, brackets */

define(function (require, exports) {
    "use strict";

    var _                    = brackets.getModule("thirdparty/lodash"),
        ProjectManager       = brackets.getModule("project/ProjectManager"),
        EventDispatcher      = brackets.getModule("utils/EventDispatcher"),
        PackageManager       = require("src/bower/PackageManager"),
        FileSystemHandler    = require("src/bower/FileSystemHandler"),
        BowerJsonManager     = require("src/bower/BowerJsonManager"),
        ConfigurationManager = require("src/bower/ConfigurationManager");

    var _bowerProject;

    var namespace            = ".albertinad.bracketsbower",
        PROJECT_LOADING      = "bowerProjectLoading",
        PROJECT_READY        = "bowerProjectReady",
        DEPENDENCIES_ADDED   = "bowerProjectDepsAdded",
        DEPENDENCIES_REMOVED = "bowerProjectDepsRemoved",
        DEPENDENCY_UPDATED   = "bowerProjectDepUpdated",
        ACTIVE_PATH_CHANGED  = "bowerActivePathChanged";

    var Events = {
        PROJECT_LOADING: PROJECT_LOADING + namespace,
        PROJECT_READY: PROJECT_READY + namespace,
        DEPENDENCIES_ADDED: DEPENDENCIES_ADDED + namespace,
        DEPENDENCIES_REMOVED: DEPENDENCIES_REMOVED + namespace,
        DEPENDENCY_UPDATED: DEPENDENCY_UPDATED + namespace,
        ACTIVE_PATH_CHANGED: ACTIVE_PATH_CHANGED + namespace
    };

    EventDispatcher.makeEventDispatcher(exports);

    /**
     * @constructor
     */
    function BowerProject(name, rootPath) {
        /** @private */
        this._name = name;
        /** @private */
        this._rootPath = rootPath;
        /** @private */
        this._activePath = null;
        /** @private */
        this._shortActivePath = null;
        /** @private */
        this._packages = {};
    }

    Object.defineProperty(BowerProject.prototype, "name", {
        get: function () {
            return this._name;
        }
    });

    Object.defineProperty(BowerProject.prototype, "rootPath", {
        get: function () {
            return this._rootPath;
        }
    });

    Object.defineProperty(BowerProject.prototype, "activePath", {
        set: function (activePath) {
            this._activePath = activePath;

            // calculate shortPath
            if (this._activePath === this._rootPath) {
                this._shortActivePath = "";
            } else {
                this._shortActivePath = this._activePath.slice(this._rootPath.length);
            }
        },
        get: function () {
            return this._activePath;
        }
    });

    Object.defineProperty(BowerProject.prototype, "shortActivePath", {
        get: function () {
            return this._shortActivePath;
        }
    });

    BowerProject.prototype.getPath = function () {
        return (this._activePath || this._rootPath);
    };

    /**
     * Set the packages.
     * @param {Array} packagesArray
     */
    BowerProject.prototype.setPackages = function (packagesArray) {
        this._packages = {};

        this.addPackages(packagesArray);
    };

    /**
     * Add project packages.
     * @param {Array} packagesArray
     */
    BowerProject.prototype.addPackages = function (packagesArray) {
        var that = this;

        packagesArray.forEach(function (pkg) {
            that._packages[pkg.name] = pkg;
        });

        exports.trigger(DEPENDENCIES_ADDED);
    };

    /**
     * Remove packages by its name.
     * @param {Array} names
     */
    BowerProject.prototype.removePackages = function (names) {
        var that = this,
            removedPkgs = [];

        names.forEach(function (name) {
            var pkg = that._packages[name];

            if (pkg) {
                removedPkgs.push(pkg);

                delete that._packages[name];
            }
        });

        exports.trigger(DEPENDENCIES_REMOVED, removedPkgs);
    };

    /**
     * Get the package by the given name;
     * @param {string} name
     * @return {object}
     */
    BowerProject.prototype.getPackageByName = function (name) {
        return this._packages[name];
    };

    /**
     * Get the current packages array.
     * @private
     * @returns {Array} packages
     */
    BowerProject.prototype.getPackagesArray = function () {
        var packagesArray = [];

        _.forEach(this._packages, function (pkg, pkgName) {
            packagesArray.push(pkg);
        });

        return packagesArray;
    };

    /**
     * Update the current version of the given package by name.
     * @param {string} name The package name of the package to update.
     * @param {string} version The new version of the package.
     */
    BowerProject.prototype.updatePackageVersion = function (name, version) {
        var pkg = this.getPackageByName(name);

        pkg.version = version;

        exports.trigger(DEPENDENCY_UPDATED, pkg);
    };

    /**
     * Check if the project has dependencies.
     * @return {boolean}
     */
    BowerProject.prototype.hasPackages = function () {
        return (Object.keys(this._packages).length !== 0);
    };

    /**
     * Check if the given package is installed for the project.
     * @return {boolean}
     */
    BowerProject.prototype.hasPackage = function (name) {
        var pkg = this._packages[name];

        return (pkg && pkg.isInstalled);
    };

    /**
     * Check if there is some uninstalled package. An uninstalled package
     * is the one that is defined in the bower.json but is not installed
     * in the libraries folder.
     * @return {boolean}
     */
    BowerProject.prototype.hasUninstalledPackages = function () {
        var hasUninstalled = _.some(this._packages, function (pkg) {
            return pkg.isInstalled;
        });

        return hasUninstalled;
    };

    /**
     * Check if there is some extraneous package. An extraneous package is the
     * one that is installed (available at the libraries folder) but is not
     * defined in the bower.json file.
     * @return {boolean}
     */
    BowerProject.prototype.hasExtraPackages = function () {
        var hasExtraneous = _.some(this._packages, function (pkg) {
            return pkg.extraneous;
        });

        return hasExtraneous;
    };

    /**
     * Get the project uninstalled packages.
     * @return {Array}
     */
    BowerProject.prototype.getUninstalledPackages = function () {
        return _.filter(this._packages, function (pkg) {
            return !pkg.isInstalled;
        });
    };

    /**
     * Get the project extraneous packages.
     * @return {Array}
     */
    BowerProject.prototype.getExtraneousPackages = function () {
        return _.filter(this._packages, function (pkg) {
            return pkg.extraneous;
        });
    };

    /**
     * Create a BowerProject instance as a proxy of the current project.
     * @param {object} project Current active project.
     */
    function _createBowerProject(project) {
        var name = project.name,
            rootPath = project.fullPath;

        return new BowerProject(name, rootPath);
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
        ConfigurationManager.loadBowerRc(_bowerProject);

        // load bower.json if any
        BowerJsonManager.loadBowerJson(_bowerProject).always(function () {

            // start loading project dependencies
            PackageManager.loadProjectDependencies().always(function () {

                FileSystemHandler.startListenToFileSystem(_bowerProject);

                // notify bower project is ready
                exports.trigger(PROJECT_READY);

                // try to get check for dependencies updates
                PackageManager.checkForUpdates().fail(function () {
                    // TODO: handle situations when it fails not because network errors
                });
            });
        });
    }

    /**
     * Update the BwerProject instance active path. Reload ConfigurationManager,
     * BowerJsonManager and FileSystemHandler to be aware of this changes.
     * @param {string} activePath Full path.
     */
    function updateCwdToSelection() {
        if (_bowerProject === null) {
            return;
        }

        var selectedItem = ProjectManager.getSelectedItem(),
            activePath;

        // get the cwd according to selection
        if (selectedItem.isDirectory) {
            activePath = selectedItem.fullPath;
        } else {
            activePath = selectedItem.parentPath;
        }

        // TODO exclude bower_components and node_modules folders

        _bowerProject.activePath = activePath;

        exports.trigger(ACTIVE_PATH_CHANGED, activePath, _bowerProject.shortActivePath);

        _configureBowerProject();
    }

    function _projectOpen() {
        // get the current/active project
        var project = ProjectManager.getProjectRoot();

        _bowerProject = (project) ? _createBowerProject(project) : null;

        _configureBowerProject();

        // by default on project open, the default active path is set to project root path
        exports.trigger(ACTIVE_PATH_CHANGED, "", "");
    }

    function initialize() {
        _projectOpen();

        ProjectManager.on("projectOpen", _projectOpen);

        ProjectManager.on("projectClose", function () {
            FileSystemHandler.stopListenToFileSystem();
        });
    }

    exports.initialize             = initialize;
    exports.getProject             = getProject;
    exports.getProjectDependencies = getProjectDependencies;
    exports.updateCwdToSelection   = updateCwdToSelection;
    exports.Events                 = Events;
});
