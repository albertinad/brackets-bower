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

    var PreferencesManager = brackets.getModule("preferences/PreferencesManager"),
        ProjectManager = brackets.getModule("project/ProjectManager"),
        ConfigurationFile = require("src/bower/ConfigurationFile"),
        Event = require("src/events/Events"),
        EventEmitter = require("src/events/EventEmitter"),
        FileUtils = require("src/utils/FileUtils");

    function ConfigurationManager() {
        this._configurationFile = null;
        this._defaultConfiguration = {};

        this._setUpDefaultConfiguration();

        var that = this;

        PreferencesManager.on("change", function (event, data) {
            that._onPreferencesChange(data.ids);
        });
    }

    ConfigurationManager.prototype.create = function (path) {
        this._configurationFile = new ConfigurationFile(path);

        return this._configurationFile.create();
    };

    ConfigurationManager.prototype.remove = function () {
        var deferred = new $.Deferred();

        if(this._configurationFile !== null) {
            this._configurationFile.remove()
                .done(deferred.resolve);
        } else {
            deferred.resolve();
        }

        return deferred;
    };

    ConfigurationManager.prototype.open = function () {
        if(this._configurationFile !== null) {
            this._configurationFile.open();
        }
    };

    ConfigurationManager.prototype.getConfiguration = function () {
        var config;

        if(this._configurationFile !== null) {
            config = this._configurationFile.getValue();
        } else {
            config = this._defaultConfiguration;
        }

        return config;
    };

    /**
     * Creates the default configuration based on those settings defined
     * in brackets preferences.
     */
    ConfigurationManager.prototype._setUpDefaultConfiguration = function () {
        var proxy = PreferencesManager.get("proxy");

        if (proxy) {
            this._defaultConfiguration.proxy = proxy;
            this._defaultConfiguration.httpsProxy = proxy;
        }
    };

    /**
     * Callback when the default preferences change. If the "proxy" preference has changed,
     * create the default configuration with the new value.
     * @param {Array} preferencesChanged Array of preferences keys that could have changed.
     */
    ConfigurationManager.prototype._onPreferencesChange = function (preferencesChanged) {
        if (!this._defaultConfiguration) {
            return;
        }

        var indexProxy = preferencesChanged.indexOf("proxy");

        if (indexProxy !== -1) {
            var proxy = PreferencesManager.get("proxy");

            if (this._defaultConfiguration.proxy !== proxy) {
                this._setUpDefaultConfiguration(cacheConfig);

                if(this._configurationFile !== null) {
                    this._configurationFile.setDefaults(this._defaultConfiguration);
                }
            }
        }
    };

    /**
     * Checks if the file exists in the given directory. If the directory
     * is not set, the root project directory is taken as the default directory.
     * @param {string=} path
     * @return {Promise}
     */
    ConfigurationManager.prototype.findConfiguration = function (path) {
        if(!path) {
            path = ProjectManager.getProjectRoot().fullPath;
        }

        path += ".bowerrc";

        return FileUtils.exists(path);
    };

    ConfigurationManager.prototype._reload = function () {
        if(this._configurationFile === null) {
            return;
        }

        var that = this;

        this._configurationFile.reload()
            .then(function () {
                that._configurationFile.setDefaults(that._defaultConfiguration);
            });
    };

    ConfigurationManager.prototype.bindEvents = function () {
        EventEmitter.on(Event.BOWER_BOWERRC_CHANGE, this._reload.bind(this));
        EventEmitter.on(Event.BOWER_BOWERRC_DELETE, this._reload.bind(this));
    };

    var configuration = new ConfigurationManager();

    return configuration;
});
