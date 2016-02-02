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

    var bowerDomain;

    /**
     * @param {NodeDomain} domain
     */
    function setDomain(domain) {
        bowerDomain = domain;
    }

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
                            message = Strings.ERROR_MSG_FS_DIR_UNKNOWN;
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
     * @param {string} source
     * @param {string} destination
     * @return {$.Promies}
     */
    function copyDir(source, destination) {
        var deferred = new $.Deferred();

        bowerDomain.exec("copyDir", source, destination).then(function () {
            deferred.resolve();
        }).fail(function (error) {
            var err = ErrorUtils.createError(ErrorUtils.EFILESYSTEM_ACTION, {
                message: StringUtils.format(Strings.ERROR_MSG_FS_COPY_DIR_ACTION, source, destination),
                originalMessage: (error && error.message) ? error.message : null
            });
            deferred.reject(err);
        });

        return deferred.promise();
    }

    /**
     * @param {string} destination
     * @param {string} source
     * @private
     */
    function _copyAndRemoveDir(source, destination) {
        var deferred = new $.Deferred();

        copyDir(source, destination).then(function () {
            var sourceDir = FileSystem.getDirectoryForPath(source);

            sourceDir.moveToTrash(function (error) {
                if (error) {
                    var err = ErrorUtils.createError(ErrorUtils.EFILESYSTEM_ACTION, {
                        message: StringUtils.format(Strings.ERROR_MSG_FS_DELETE_DIR_ACTION, source),
                        originalMessage: error
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

    /**
     * @param {FileEntry} fileEntry
     * @return {$.Promise} A promise that is always resolved.
     * @private
     */
    function _existsFileEntry(fileEntry) {
        var deferred = new $.Deferred();

        fileEntry.exists(function (error, exists) {
            deferred.resolve((!error && exists));
        });

        return deferred.promise();
    }

    /**
     * @private
     */
    function _createDirAndRename(source, destination) {
        var deferred = new $.Deferred(),
            parentPath = FileUtils.getDirectoryPath(destination),
            parentDirectory;

        if (parentPath === destination) {
            parentPath = FileUtils.getParentPath(destination);
        }

        parentDirectory = FileSystem.getDirectoryForPath(parentPath);

        _createDirIfNeeded(parentDirectory).then(function () {
            var directory = FileSystem.getDirectoryForPath(source);

            directory.rename(destination, function (fileSystemError) {
                if (fileSystemError) {
                    var message;
                    if (fileSystemError === FileSystemError.ALREADY_EXISTS) {
                        message = Strings.ERROR_MSG_FS_DIR_ALREADY_EXISTS;
                    } else {
                        message = Strings.ERROR_MSG_FS_DIR_UNKNOWN;
                    }

                    var err = ErrorUtils.createError(ErrorUtils.EFILESYSTEM_ACTION, {
                        message: StringUtils.format(message, destination),
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
    /**
     * @param {string} source
     * @param {string} destination
     * @param {boolean=} overwriteDestination
     * @return {$.Promise}
     */
    function moveDirectory(source, destination, overwriteDestination) {
        var deferred = new $.Deferred(),
            sourceDir = FileSystem.getDirectoryForPath(source),
            destiantionDir = FileSystem.getDirectoryForPath(destination);

        overwriteDestination = !!overwriteDestination;

        // check if the source directory exists
        _existsFileEntry(sourceDir)
            .then(function (sourceExists) {
                if (sourceExists) {
                    // check if the destination directory exists
                    return _existsFileEntry(destiantionDir);
                } else {
                    // directory may not exists, there's nothing to copy/rename
                    deferred.resolve();
                }
            })
            .then(function (destinationExists) {
                if (destinationExists) {
                    if (overwriteDestination) {
                        // move the content to the destination and remove
                        // the source folder
                        return _copyAndRemoveDir(source, destination);
                    } else {
                        var err = ErrorUtils.createError(ErrorUtils.EFILESYSTEM_ACTION, {
                            message: StringUtils.format(Strings.ERROR_MSG_FS_DIR_TO_MOVE_EXISTS, source, destination)
                        });
                        deferred.reject(err);
                    }
                } else {
                    // check for parent folders and create it if needed
                    // rename the source directory into the destination directory
                    return _createDirAndRename(source, destination);
                }
            })
            .fail(function (error) {
                deferred.reject(error);
            });

        return deferred.promise();
    }

    exports.setDomain     = setDomain;
    exports.exists        = exists;
    exports.writeContent  = writeContent;
    exports.copyDir       = copyDir;
    exports.deleteFile    = deleteFile;
    exports.readFile      = readFile;
    exports.moveDirectory = moveDirectory;
    exports.openInEditor  = openInEditor;
});
