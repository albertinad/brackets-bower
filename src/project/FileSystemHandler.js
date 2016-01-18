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
/*global define, brackets */

define(function (require, exports) {
    "use strict";

    var FileSystem      = brackets.getModule("filesystem/FileSystem"),
        ProjectManager  = brackets.getModule("project/ProjectManager"),
        EventDispatcher = brackets.getModule("utils/EventDispatcher");

    var _bowerRcFile,
        _bowerJsonFile,
        _projectPathRegex,
        _bowerConfigRegex,
        _bowerJsonRegex;

    /**
     * Events definition for the extension.
     */
    var BOWERRC_CREATED    = "bowerrcCreated",
        BOWERRC_CHANGED    = "bowerrcChanged",
        BOWERRC_DELETED    = "bowerrcDeleted",
        BOWER_JSON_CREATED = "bowerjsonCreated",
        BOWER_JSON_CHANGED = "bowerjsonChanged",
        BOWER_JSON_DELETED = "bowerjsonDeleted";

    var namespace = ".albertinad.bracketsbower";

    var Events = {
        BOWER_BOWERRC_CREATED: BOWERRC_CREATED + namespace,
        BOWER_BOWERRC_CHANGED: BOWERRC_CHANGED + namespace,
        BOWER_BOWERRC_DELETED: BOWERRC_DELETED + namespace,
        BOWER_JSON_CREATED: BOWER_JSON_CREATED + namespace,
        BOWER_JSON_CHANGED: BOWER_JSON_CHANGED + namespace,
        BOWER_JSON_DELETED: BOWER_JSON_DELETED + namespace
    };

    EventDispatcher.makeEventDispatcher(exports);

    /**
     * Check if the given path to the file is available in the the given files array.
     * @param {Array} filesArray
     * @param {string} filePath
     * @private
     */
    function _isFileByPathInArray(filesArray, filePath) {
        var result;

        filesArray.some(function (file, index) {
            result = file.fullPath.match(filePath);

            return result;
        });

        return result;
    }

    /**
     * When file system changes, check if the files changes belongs to the current project
     * and check if those changes were related to the bower files. If that is the case,
     * trigger an event according to the modification: "change", "create" and "delete".
     * @private
     */
    function _onFileSystemChange(event, entry, added, removed) {
        if (!entry || !ProjectManager.isWithinProject(entry)) {
            return;
        }

        if (entry.isFile) {

            if (entry.fullPath.match(_bowerConfigRegex)) {
                exports.trigger(BOWERRC_CHANGED);

            } else if (entry.fullPath.match(_bowerJsonRegex)) {
                exports.trigger(BOWER_JSON_CHANGED);
            }
        } else if (entry.isDirectory && entry.fullPath.match(_projectPathRegex)) {

            // added files
            if (added && added.length !== 0) {

                if (_isFileByPathInArray(added, _bowerRcFile)) {
                    exports.trigger(BOWERRC_CREATED);
                }

                if (_isFileByPathInArray(added, _bowerJsonFile)) {
                    exports.trigger(BOWER_JSON_CREATED);
                }
            }

            // removed files
            if (removed && removed.length !== 0) {

                if (_isFileByPathInArray(removed, _bowerRcFile)) {
                    exports.trigger(BOWERRC_DELETED);
                }

                if (_isFileByPathInArray(removed, _bowerJsonFile)) {
                    exports.trigger(BOWER_JSON_DELETED);
                }
            }
        }
    }

    /**
     * Stop listen to file system changes and clean up current state.
     */
    function stopListenToFileSystem() {
        FileSystem.off("change.bower", _onFileSystemChange);

        _bowerRcFile = null;
        _bowerJsonFile = null;
        _projectPathRegex = null;
        _bowerConfigRegex = null;
        _bowerJsonRegex = null;
    }

    /**
     * Start listen to file system changes for the given project to detect changes related to
     * bower.json and .bowerrc metadata files.
     * @param {BowerProject} bowerProject
     */
    function startListenToFileSystem(bowerProject) {
        stopListenToFileSystem();

        if (bowerProject) {
            var path = bowerProject.getPath();

            _bowerRcFile = path + ".bowerrc";
            _bowerJsonFile = path + "bower.json";

            _projectPathRegex = new RegExp(path);
            _bowerConfigRegex = new RegExp(_bowerRcFile);
            _bowerJsonRegex = new RegExp(_bowerJsonFile);

            FileSystem.on("change.bower", _onFileSystemChange);
        }
    }

    exports.startListenToFileSystem = startListenToFileSystem;
    exports.stopListenToFileSystem  = stopListenToFileSystem;
    exports.Events                  = Events;
});
