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

    var ProjectManager = brackets.getModule("project/ProjectManager"),
        FileUtils      = require("src/utils/FileUtils");

    /**
     * Bower file constructor.
     * @param {string} fileName
     * @param {path=} path
     */
    function BowerFile(fileName, path) {
        if (!path || path.trim() === "") {
            path = ProjectManager.getProjectRoot().fullPath;
        }

        this._absolutePath = path + fileName;
    }

    Object.defineProperty(BowerFile.prototype, "AbsolutePath", {
        get: function () {
            return this._absolutePath;
        }
    });

    /**
     * Create the file for the given path. If the path is not provided, it will
     * take the current directory path as default.
     * @return {Promise}
     */
    BowerFile.prototype.create = function () {
        return FileUtils.createFile(this._absolutePath, this.content());
    }

    /**
     * Delete the file.
     * @return {Promise}
     */
    BowerFile.prototype.remove = function () {
        return FileUtils.deleteFile(this._absolutePath);
    }

    /**
     * Open the file in the editor.
     */
    BowerFile.prototype.open = function () {
        FileUtils.openInEditor(this._absolutePath);
    }

    /**
     * Subclasses should implement this.
     */
    BowerFile.prototype.content = function () {
        return "";
    };

    return BowerFile;
});
