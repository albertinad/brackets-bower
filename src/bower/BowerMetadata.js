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
/*global $, define */

define(function (require, exports) {
    "use strict";

    var FileUtils = require("src/utils/FileUtils");

    /**
     * Bower file constructor.
     * @param {string} fileName
     * @param {string} projectPath
     */
    function BowerMetadata(fileName, projectPath) {
        /** @private */
        this._projectPath = projectPath;
        /** @private */
        this._absolutePath = projectPath + fileName;
    }

    Object.defineProperty(BowerMetadata.prototype, "AbsolutePath", {
        get: function () {
            return this._absolutePath;
        }
    });

    Object.defineProperty(BowerMetadata.prototype, "ProjectPath", {
        get: function () {
            return this._projectPath;
        }
    });

    /**
     * Create the file for the given path. If the path is not provided, it will
     * take the current directory path as default.
     * @return {Promise}
     */
    BowerMetadata.prototype.create = function () {
        var that = this,
            deferred = new $.Deferred();

        this.content()
            .then(function (content) {
                return FileUtils.createFile(that._absolutePath, content);
            })
            .then(deferred.resolve)
            .fail(deferred.reject);

        return deferred;
    };

    /**
     * Delete the file.
     * @return {Promise}
     */
    BowerMetadata.prototype.remove = function () {
        return FileUtils.deleteFile(this._absolutePath);
    };

    /**
     * Open the file in the editor.
     */
    BowerMetadata.prototype.open = function () {
        FileUtils.openInEditor(this._absolutePath);
    };

    /**
     * The file content to write to disk must be placed here. The result must
     * be returned as a promise. Subclasses should implement this function.
     */
    BowerMetadata.prototype.content = function () {
        throw "Function 'content' not implemented yet.";
    };

    return BowerMetadata;
});
