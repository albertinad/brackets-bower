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
/*global $, define, brackets */

define(function (require, exports) {
    "use strict";

    var ProjectManager  = brackets.getModule("project/ProjectManager"),
        FileSystem      = brackets.getModule("filesystem/FileSystem"),
        CommandManager  = brackets.getModule("command/CommandManager"),
        Commands        = brackets.getModule("command/Commands"),
        EditorManager   = brackets.getModule("editor/EditorManager"),
        MainViewManager = brackets.getModule("view/MainViewManager");

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
        var result = new $.Deferred();

        path = (path || _getDefaultDirectory()) + FILE_NAME;

        FileSystem.resolve(path, function (error, item, stat) {
            var fileExists = error ? false : stat.isFile;

            if (fileExists) {
                result.resolve(path);
            } else {
                result.reject(error);
            }
        });

        return result;
    }

    /**
     * Create the ".bowerrc" file for the given path. If the path is not provided, it will
     * take the current directory path as default.
     * @param {string=} path
     * @return {Promise}
     */
    function create(path) {
        var promise = new $.Deferred(),
            file;

        path = (path || _getDefaultDirectory()) + FILE_NAME;

        file = FileSystem.getFileForPath(path);

        if(!file) {
            promise.reject();
        }

        file.write("", function (error, result) {
            if(error) {
                promise.reject(error);
            } else {
                promise.resolve(path);
            }
        });

        return promise;
    }

    function openInEditor(configFilePath) {
        CommandManager.execute(Commands.FILE_OPEN, {
            fullPath: configFilePath
        }).done(function () {
            EditorManager.getCurrentFullEditor().setCursorPos(0, 0, true);

            MainViewManager.focusActivePane();
        });
    }

    exports.exists = exists;
    exports.create = create;
    exports.open   = openInEditor;
});
