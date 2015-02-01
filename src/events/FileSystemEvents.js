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

    var FileSystem     = brackets.getModule("filesystem/FileSystem"),
        ProjectManager = brackets.getModule("project/ProjectManager"),
        Event          = require("src/events/Events"),
        EventEmitter   = require("src/events/EventEmitter");

    var _bowerRcFile,
        _bowerJsonFile,
        _projectPathRegex,
        _bowerConfigRegex,
        _bowerJsonRegex;

    function _isFileByPathInArray(filesArray, filePath) {
        var result;

        filesArray.some(function (file, index) {
            result = file.fullPath.match(filePath);

            return result;
        });

        return result;
    }

    /**
     * When file system changes, check if the files changes belongs
     * to the current project and check if those changes were related
     * to the bower files. If that is the case, trigger an event
     * according to the modification: "change", "create" and "delete".
     */
    function _onFileSystemChange(event, entry, added, removed) {
        if (!entry) {
            return;
        }

        if (entry.isFile) {

            if (entry.fullPath.match(_bowerConfigRegex)) {

                EventEmitter.trigger(Event.BOWER_BOWERRC_CHANGE);

            } else if (entry.fullPath.match(_bowerJsonRegex)) {

                EventEmitter.trigger(Event.BOWER_JSON_CHANGE);
            }
        } else if (entry.isDirectory && entry.fullPath.match(_projectPathRegex)) {

            // added files
            if (added && added.length !== 0) {

                if (_isFileByPathInArray(added, _bowerRcFile)) {

                    EventEmitter.trigger(Event.BOWER_BOWERRC_CREATE);
                }

                if (_isFileByPathInArray(added, _bowerJsonFile)) {

                    EventEmitter.trigger(Event.BOWER_JSON_CREATE);
                }
            }

            // removed files
            if (removed && removed.length !== 0) {

                if (_isFileByPathInArray(removed, _bowerRcFile)) {

                    EventEmitter.trigger(Event.BOWER_BOWERRC_DELETE);
                }

                if (_isFileByPathInArray(removed, _bowerJsonFile)) {

                    EventEmitter.trigger(Event.BOWER_JSON_DELETE);
                }
            }
        }
    }

    function _setUpEventHandler() {
        var currentProject = ProjectManager.getProjectRoot();

        if (currentProject) {
            var projectPath = currentProject.fullPath;

            _bowerRcFile = projectPath + ".bowerrc";
            _bowerJsonFile = projectPath + "bower.json";

            _projectPathRegex = new RegExp(projectPath);
            _bowerConfigRegex = new RegExp(_bowerRcFile);
            _bowerJsonRegex = new RegExp(_bowerJsonFile);

            FileSystem.on("change.bower", _onFileSystemChange);
        }
    }

    function _onProjectClose() {
        FileSystem.off("change.bower", _onFileSystemChange);

        _bowerRcFile = null;
        _bowerJsonFile = null;
        _projectPathRegex = null;
        _bowerConfigRegex = null;
        _bowerJsonRegex = null;
    }

    function _onProjectOpen() {
        _setUpEventHandler();
    }

    function init() {
        _setUpEventHandler();

        ProjectManager.on("projectClose", _onProjectClose);
        ProjectManager.on("projectOpen", _onProjectOpen);
    }

    exports.init = init;
});
