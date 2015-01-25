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

    var FileSystem      = brackets.getModule("filesystem/FileSystem"),
        CommandManager  = brackets.getModule("command/CommandManager"),
        Commands        = brackets.getModule("command/Commands"),
        EditorManager   = brackets.getModule("editor/EditorManager"),
        MainViewManager = brackets.getModule("view/MainViewManager");

    /**
     * Checks if the bowerrc json file exists in the given directory. If the directory
     * is not set, the root project directory is taken as the default directory.
     * @param {path=} path
     * @return {Promise}
     */
    function exists(path) {
        var result = new $.Deferred();

        FileSystem.resolve(path, function (error, item, stat) {
            var fileExists = (error) ? false : stat.isFile;

            if (fileExists) {
                result.resolve(path);
            } else {
                result.reject(error);
            }
        });

        return result;
    }

    /**
     * Create a new file by giving the absolute path and the content.
     * @param {string} path The absolute path.
     * @param {string} content Content to write to the file.
     * @return {Promise}
     */
    function createFile(path, content) {
        var promise = new $.Deferred(),
            file;

        file = FileSystem.getFileForPath(path);

        if (!file) {
            promise.reject();
        }

        file.write(content, function (error, result) {
            if (error) {
                promise.reject(error);
            } else {
                promise.resolve(path);
            }
        });

        return promise;
    }

    /**
     * Permanently delete the given file.
     * @param {string} path The absolute path of the file to remove.
     */
    function deleteFile(path) {
        var promise = new $.Deferred(),
            file = FileSystem.getFileForPath(path);

        function onDeleted(error) {
            if (error) {
                promise.reject(error);
            } else {
                promise.resolve();
            }
        }

        file.unlink(onDeleted);

        return promise;
    }

    /**
     * Open the given file in the Editor and set focus.
     * @param {string} filePath The absolute path of the file to open in the editor.
     */
    function openInEditor(filePath) {

        CommandManager.execute(Commands.FILE_OPEN, {
            fullPath: filePath
        }).done(function () {
            EditorManager.getCurrentFullEditor().setCursorPos(0, 0, true);

            MainViewManager.focusActivePane();
        });
    }

    exports.exists       = exists;
    exports.createFile   = createFile;
    exports.deleteFile   = deleteFile;
    exports.openInEditor = openInEditor;
});
