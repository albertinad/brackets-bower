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

    var namespace = ".albertinad.bracketsbower",
        PROJECT_LOADING = "bowerProjectLoading",
        PROJECT_READY = "bowerProjectReady",
        DEPENDENCIES_UPDATED = "bowerProjectDepsUpdated";

    var Events = {
        PROJECT_LOADING: PROJECT_LOADING + namespace,
        PROJECT_READY: PROJECT_READY + namespace,
        DEPENDENCIES_UPDATED: DEPENDENCIES_UPDATED + namespace
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
        },
        get: function () {
            return this._activePath;
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

        exports.trigger(DEPENDENCIES_UPDATED);
    };

    /**
     * Remove packages by its name.
     * @param {Array} names
     */
    BowerProject.prototype.removePackages = function (names) {
        var that = this;

        names.forEach(function (name) {
            if (that._packages[name]) {
                delete that._packages[name];
            }
        });

        exports.trigger(DEPENDENCIES_UPDATED);
    };

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

    function _createBowerProject(project) {
        var name = project.name,
            rootPath = project.fullPath;

        return new BowerProject(name, rootPath);
    }

    function getProject() {
        return _bowerProject;
    }

    function setActivePath(activePath) {
        if (_bowerProject !== null) {
            _bowerProject.activePath = activePath;

            ConfigurationManager.loadBowerRc(_bowerProject);
            BowerJsonManager.loadBowerJson(_bowerProject);
            FileSystemHandler.startListenToFileSystem(_bowerProject);
        }
    }

    function getProjectDependencies() {
        return (_bowerProject) ? _bowerProject.getPackagesArray() : [];
    }

    function _loadBowerProject() {
        // notify bower project is being loaded
        exports.trigger(PROJECT_LOADING);

        ConfigurationManager.loadBowerRc(_bowerProject);

        PackageManager.loadProjectDependencies().always(function () {

            return BowerJsonManager.loadBowerJson(_bowerProject);
        }).always(function () {

            FileSystemHandler.startListenToFileSystem(_bowerProject);

            exports.trigger(PROJECT_READY);
        });
    }

    function _projectOpen() {
        // get the current/active project
        var project = ProjectManager.getProjectRoot();

        _bowerProject = (project) ? _createBowerProject(project) : null;

        _loadBowerProject();
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
    exports.setActivePath          = setActivePath;
    exports.getProjectDependencies = getProjectDependencies;
    exports.Events                 = Events;
});
