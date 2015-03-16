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

    var _activePath;

    function getActivePath() {
        return _activePath;
    }

    function existsBowerJson() {
        var bowerJson = BowerJsonManager.getBowerJson();

        return (bowerJson !== null);
    }

    function getConfiguration() {
        var config = ConfigurationManager.getConfiguration(),
            bowerJson = BowerJsonManager.getBowerJson(),
            path;

        if (bowerJson !== null) {
            path = bowerJson.ProjectPath;
        } else {
            path = getActivePath();
        }

        config.cwd = path;

        return config;
    }

    function _projectOpen() {
        var project = ProjectManager.getProjectRoot();

        _activePath = (project) ? project.fullPath : null;

        ConfigurationManager.loadBowerRc(project);
        BowerJsonManager.loadBowerJson(project);

        FileSystemHandler.startListenToFileSystem();
    }

    function initialize() {
        _projectOpen();

        ProjectManager.on("projectOpen", _projectOpen);

        ProjectManager.on("projectClose", function () {
            FileSystemHandler.stopListenToFileSystem();
        });
    }

    exports.initialize       = initialize;
    exports.getActivePath    = getActivePath;
    exports.existsBowerJson  = existsBowerJson;
    exports.getConfiguration = getConfiguration;
});
