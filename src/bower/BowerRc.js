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

    var BowerMetadata = require("src/bower/BowerMetadata"),
        Bower         = require("src/bower/Bower");

    /**
     * Configuration file constructor.
     * @param {string} path
     * @param {object=} defaultConfiguration
     * @constructor
     */
    function BowerRc(path, defaultConfiguration) {
        BowerMetadata.call(this, ".bowerrc", path);

        this._cacheConfig = defaultConfiguration || {};
    }

    BowerRc.prototype = Object.create(BowerMetadata.prototype);
    BowerRc.prototype.constructor = BowerRc;
    BowerRc.prototype.parentClass = BowerMetadata.prototype;

    Object.defineProperty(BowerRc.prototype, "Data", {
        get: function () {
            return this._cacheConfig;
        },
        set: function (data) {
            this._cacheConfig = data;
        }
    });

    BowerRc.prototype.content = function () {
        var defaultConfiguration = {
            directory: "bower_components/",
            interactive: false
        };

        return JSON.stringify(defaultConfiguration, null, 4);
    };

    BowerRc.prototype.setDefaults = function (defaults) {
        var configKey;

        if (!this._cacheConfig) {
            this._cacheConfig = {};
        }

        for (configKey in defaults) {
            if (defaults.hasOwnProperty(configKey)) {
                this._cacheConfig[configKey] = defaults[configKey];
            }
        }
    };

    /**
     * Reload the configuration.
     * @param {string} configFilePath The absolute path root directory.
     */
    BowerRc.prototype.reload = function () {
        var that = this,
            deferred = new $.Deferred();

        // TODO: Expose a reload configuration API from bower module
        Bower.getConfiguration(this.AbsolutePath).done(function (configuration) {
            that._cacheConfig = configuration;

            deferred.resolve();
        });

        return deferred;
    };

    return BowerRc;
});
