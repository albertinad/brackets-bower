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

    var ProjectManager       = brackets.getModule("project/ProjectManager"),
        FileSystemHandler    = require("src/bower/FileSystemHandler"),
        BowerJsonManager     = require("src/bower/BowerJsonManager"),
        ConfigurationManager = require("src/bower/ConfigurationManager");

    var _bowerProject;

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

    BowerProject.create = function (project) {
        var name = project.name,
            rootPath = project.fullPath;

        return new BowerProject(name, rootPath);
    };

    function existsBowerJson() {
        var bowerJson = BowerJsonManager.getBowerJson();

        return (bowerJson !== null);
    }

    function getConfiguration() {
        var config = ConfigurationManager.getConfiguration();

        config.cwd = (_bowerProject !== null) ? _bowerProject.getPath() : null;

        return config;
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

    function _projectOpen() {
        // get the current/active project
        var project = ProjectManager.getProjectRoot();

        _bowerProject = (project) ? BowerProject.create(project) : null;

        ConfigurationManager.loadBowerRc(_bowerProject);
        BowerJsonManager.loadBowerJson(_bowerProject);

        FileSystemHandler.startListenToFileSystem(_bowerProject);
    }

    function initialize() {
        _projectOpen();

        ProjectManager.on("projectOpen", _projectOpen);

        ProjectManager.on("projectClose", function () {
            FileSystemHandler.stopListenToFileSystem();
        });
    }

    exports.initialize       = initialize;
    exports.getProject       = getProject;
    exports.setActivePath    = setActivePath;
    exports.existsBowerJson  = existsBowerJson;
    exports.getConfiguration = getConfiguration;
});
