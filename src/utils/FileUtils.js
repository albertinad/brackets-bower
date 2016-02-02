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
/*global $, define, brackets */

define(function (require, exports) {
    "use strict";

    var FileSystem      = brackets.getModule("filesystem/FileSystem"),
        FileSystemError = brackets.getModule("filesystem/FileSystemError"),
        FileUtils       = brackets.getModule("file/FileUtils"),
        CommandManager  = brackets.getModule("command/CommandManager"),
        Commands        = brackets.getModule("command/Commands"),
        EditorManager   = brackets.getModule("editor/EditorManager"),
        MainViewManager = brackets.getModule("view/MainViewManager"),
        StringUtils     = brackets.getModule("utils/StringUtils"),
        ErrorUtils      = require("src/utils/ErrorUtils"),
        Strings         = require("strings");

    /**
     * Checks if the given file exists.
     * @param {string} path
     * @return {$.Deferred}
     */
    function exists(path) {
        var result = new $.Deferred();

        FileSystem.resolve(path, function (error, item, stat) {
            var fileExists = (error) ? false : stat.isFile;

            if (fileExists) {
                result.resolve(path);
            } else {
                var err = ErrorUtils.createError(ErrorUtils.EFILESYSTEM_ACTION, {
                    message: StringUtils.format(Strings.ERROR_MSG_FS_EXISTS_ACTION, path),
                    originalMessage: error
                });
                result.reject(err);
            }
        });

        return result;
    }

    /**
     * Create a new file by giving the absolute path and the content.
     * @param {string} path The absolute path.
     * @param {string} content Content to write to the file.
     * @return {$.Deferred}
     */
    function writeContent(path, content) {
        var deferred = new $.Deferred(),
            file = FileSystem.getFileForPath(path);

        if (!file) {
            deferred.reject();
        }

        file.write(content, function (error, result) {
            if (error) {
                var err = ErrorUtils.createError(ErrorUtils.EFILESYSTEM_ACTION, {
                    message: StringUtils.format(Strings.ERROR_MSG_FS_WRITE_ACTION, path),
                    originalMessage: error
                });
                deferred.reject(err);
            } else {
                deferred.resolve(path);
            }
        });

        return deferred;
    }

    /**
     * Permanently delete the given file.
     * @param {string} path The absolute path of the file to remove.
     * @return {$.Deferred}
     */
    function deleteFile(path) {
        var deferred = new $.Deferred(),
            file = FileSystem.getFileForPath(path);

        function onDeleted(error) {
            if (error) {
                var err = ErrorUtils.createError(ErrorUtils.EFILESYSTEM_ACTION, {
                    message: StringUtils.format(Strings.ERROR_MSG_FS_DELETE_ACTION, path),
                    originalMessage: error
                });
                deferred.reject(err);
            } else {
                deferred.resolve();
            }
        }

        file.unlink(onDeleted);

        return deferred;
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

    /**
     * Read and get the content of the file with the give name.
     * @param {string} filePath The absolute path of the file to open in the editor.
     * @return {$.Deferred}
     */
    function readFile(path) {
        var deferred = new $.Deferred(),
            file = FileSystem.getFileForPath(path);

        if (!file) {
            deferred.reject();
        }

        file.read(function (error, result) {
            if (error) {
                var err = ErrorUtils.createError(ErrorUtils.EFILESYSTEM_ACTION, {
                    message: StringUtils.format(Strings.ERROR_MSG_FS_READ_ACTION, path),
                    originalMessage: error
                });
                deferred.reject(err);
            } else {
                deferred.resolve(result);
            }
        });

        return deferred;
    }

    /**
     * @return {$.Promise}
     * @private
     */
    function _createDirIfNeeded(directory) {
        var deferred = new $.Deferred();

        directory.exists(function (error, exists) {
            if (error) {
                var err = ErrorUtils.createError(ErrorUtils.EFILESYSTEM_ACTION, {
                    message: StringUtils.format(Strings.ERROR_MSG_FS_EXISTS_DIR_ACTION,
                                                directory.fullPath),
                    originalMessage: error
                });
                deferred.reject(err);
            } else if (!exists) {
                // let's create it
                directory.create(function (error) {
                    if (error) {
                        var message;
                        if (error === FileSystemError.AlreadyExists) {
                            message = Strings.ERROR_MSG_FS_DIR_ALREADY_EXISTS;
                        } else {
                            message = Strings.ERROR_MSG_PKGS_DIRECTORY_UNKNOWN;
                        }
                        var err = ErrorUtils.createError(ErrorUtils.EFILESYSTEM_ACTION, {
                            message: StringUtils.format(Strings.ERROR_MSG_FS_DIR_UNKNOWN,
                                                        directory.fullPath),
                            originalMessage: error
                        });
                        deferred.reject(err);
                    } else {
                        deferred.resolve();
                    }
                });
            } else {
                // directory exists
                deferred.resolve();
            }
        });

        return deferred.promise();
    }

    /**
     * @return {$.Promise}
     */
    function renameDirectory(oldPath, newPath) {
        var deferred = new $.Deferred(),
            directory = FileSystem.getDirectoryForPath(oldPath),
            parentPath = FileUtils.getDirectoryPath(newPath),
            parentDirectory;

        if (parentPath === newPath) {
            parentPath = FileUtils.getParentPath(newPath);
        }

        parentDirectory = FileSystem.getDirectoryForPath(parentPath);

        _createDirIfNeeded(parentDirectory).then(function (fileSystemError) {
            directory.rename(newPath, function (fileSystemError) {
                if (fileSystemError) {
                    var err = ErrorUtils.createError(ErrorUtils.EFILESYSTEM_ACTION, {
                        message: StringUtils.format(Strings.ERROR_MSG_FS_DIR_UNKNOWN, newPath),
                        originalMessage: fileSystemError
                    });
                    deferred.reject(err);
                } else {
                    deferred.resolve();
                }
            });
        }).fail(function (error) {
            deferred.reject(error);
        });

        return deferred.promise();
    }

    exports.exists          = exists;
    exports.writeContent    = writeContent;
    exports.deleteFile      = deleteFile;
    exports.readFile        = readFile;
    exports.renameDirectory = renameDirectory;
    exports.openInEditor    = openInEditor;
});
