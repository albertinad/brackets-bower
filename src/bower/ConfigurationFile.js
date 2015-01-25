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

    var BowerFile = require("src/bower/BowerFile"),
        Bower     = require("src/bower/Bower");

    /**
     * Configuration file constructor.
     * @param {string} path
     * @param {object=} defaultConfiguration
     * @constructor
     */
    function ConfigurationFile(path, defaultConfiguration) {
        BowerFile.call(this, ".bowerrc", path);

        this._cacheConfig = defaultConfiguration || {};
    }

    ConfigurationFile.prototype = Object.create(BowerFile.prototype);
    ConfigurationFile.prototype.constructor = ConfigurationFile;
    ConfigurationFile.prototype.parentClass = BowerFile.prototype;

    /**
     * Gets the default configuration. If the configuration is not cached, it
     * creates it and then return it.
     * @returns {Object} Configuration object
     */
    ConfigurationFile.prototype.getValue = function () {
        return this._cacheConfig;
    };

    ConfigurationFile.prototype.content = function () {
        var defaultConfiguration = {
            directory: "bower_components/",
            interactive: false
        };

        return JSON.stringify(defaultConfiguration, null, 4);
    };

    ConfigurationFile.prototype.setDefaults = function (defaults) {
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
    ConfigurationFile.prototype.reload = function () {
        var that = this,
            deferred = new $.Deferred();

        // TODO: Expose a reload configuration API from bower module
        Bower.getConfiguration(this.AbsolutePath).done(function (configuration) {
            that._cacheConfig = configuration;

            deferred.resolve();
        });

        return deferred;
    };

    return ConfigurationFile;
});
