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

define(function (require, exports) {
    "use strict";

    var ProjectManager = brackets.getModule("project/ProjectManager"),
        FileUtils      = require("src/utils/FileUtils"),
        Event          = require("src/events/Events"),
        EventEmitter   = require("src/events/EventEmitter");

    var FILE_NAME = ".bowerrc";

    function _getDefaultDirectory(path) {
        if (!path) {
            path = ProjectManager.getProjectRoot().fullPath;
        }

        return path;
    }

    /**
     * Checks if the bowerrc json file exists in the given directory. If the directory
     * is not set, the root project directory is taken as the default directory.
     * @param {path=} path
     * @return {Promise}
     */
    function exists(path) {
        path = (path || _getDefaultDirectory()) + FILE_NAME;

        return FileUtils.exists(path);
    }

    /**
     * Create the ".bowerrc" file for the given path. If the path is not provided, it will
     * take the current directory path as default.
     * @param {string=} path
     * @return {Promise}
     */
    function create(path) {
        var defaultConfiguration = {
            directory: "bower_components/",
            interactive: false
        };
        var content = JSON.stringify(defaultConfiguration, null, 4),

        path = (path || _getDefaultDirectory()) + FILE_NAME;

        return FileUtils.createFile(path, content);
    }

    /**
     * Delete the ".bowerrc" located at the given path. If the path is not provided, it will
     * delete the ".bowerrc" file from the root project.
     * @param {string=} path
     * @return {Promise}
     */
    function remove(path) {
        path = (path || _getDefaultDirectory()) + FILE_NAME;

        return FileUtils.deleteFile(path);
    }

    /**
     * Open the ".bowerrc" file in the editor.
     * @param {string} configFilePath The absolute path of the configuration file.
     */
    function open(configFilePath) {
        FileUtils.openInEditor(configFilePath);
    }

    function _init () {
        EventEmitter.on(Event.BOWER_BOWERRC_CHANGE, function () {
            console.log("bowerrc change! should reload config");
        });
    }

    _init();

    exports.exists = exists;
    exports.create = create;
    exports.remove = remove;
    exports.open   = open;
});
