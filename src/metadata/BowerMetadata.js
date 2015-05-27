/*
 * Copyright (c) 2014-2015 Narciso Jaramillo. All rights reserved.
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
/*global define */

define(function (require, exports, module) {
    "use strict";

    var FileUtils = require("src/utils/FileUtils");

    /**
     * Bower metadata  file constructor.
     * @param {string} fileName
     * @param {string} projectPath
     * @param {BowerProject} project
     */
    function BowerMetadata(fileName, projectPath, project) {
        /** @private */
        this._projectPath = projectPath;
        /** @private */
        this._project = project;
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

    Object.defineProperty(BowerMetadata.prototype, "Project", {
        get: function () {
            return this._project;
        }
    });

    /**
     * Create the file with content.
     * @param {object=} data
     * @return {$.Deferred}
     */
    BowerMetadata.prototype.create = function (data) {
        throw "Function 'create' not implemented yet.";
    };

    /**
     * Save the given content in the file.
     * @param {object} content JSON object to save to the file.
     * @return {$.Deferred}
     */
    BowerMetadata.prototype.saveContent = function (content) {
        return FileUtils.writeContent(this._absolutePath, content);
    };

    /**
     * Read the current content from the file.
     * @return {$.Deferred}
     */
    BowerMetadata.prototype.read = function () {
        return FileUtils.readFile(this._absolutePath);
    };

    /**
     * Delete the file.
     * @return {$.Deferred}
     */
    BowerMetadata.prototype.remove = function () {
        return FileUtils.deleteFile(this._absolutePath);
    };

    module.exports = BowerMetadata;
});
