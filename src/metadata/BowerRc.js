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

define(function (require, exports, module) {
    "use strict";

    var _             = brackets.getModule("thirdparty/lodash"),
        BowerMetadata = require("src/metadata/BowerMetadata"),
        Bower         = require("src/bower/Bower"),
        FileUtils     = require("src/utils/FileUtils");

    /**
     * Configuration file constructor.
     * @param {BowerProject} project
     * @constructor
     */
    function BowerRc(project) {
        BowerMetadata.call(this, ".bowerrc", project);

        /** @private */
        this._data = {};
    }

    BowerRc.prototype = Object.create(BowerMetadata.prototype);
    BowerRc.prototype.constructor = BowerRc;
    BowerRc.prototype.parentClass = BowerMetadata.prototype;

    Object.defineProperty(BowerRc.prototype, "Data", {
        get: function () {
            return _.clone(this._data, true);
        },
        set: function (data) {
            this._data = data;
        }
    });

    BowerRc.prototype.create = function () {
        var content = this._defaultContent();

        return this.saveContent(content);
    };

    BowerRc.prototype.loadConfiguration = function () {
        var that = this,
            deferred = new $.Deferred();

        Bower.getConfiguration(this.AbsolutePath)
            .then(function (configuration) {
                that.Data = configuration;

                deferred.resolve();
            })
            .fail(function (error) {
                deferred.reject(error);
            });

        return deferred.promise();
    };

    BowerRc.prototype.onContentChanged = function () {
        return this.loadConfiguration();
    };

    /**
     * @private
     */
    BowerRc.prototype._defaultContent = function () {
        var defaultConfiguration = {
            directory: "bower_components/",
            interactive: false
        };

        return JSON.stringify(defaultConfiguration, null, 4);
    };

    /**
     * Checks if the file exists in the given directory. If the directory
     * is not set, the root project directory is taken as the default directory.
     * @param {string} path
     * @return {Promise}
     */
    BowerRc.findInPath = function (path) {
        return FileUtils.exists(path + ".bowerrc");
    };

    module.exports = BowerRc;
});
