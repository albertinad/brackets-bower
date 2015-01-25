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

    var PreferencesManager = brackets.getModule("preferences/PreferencesManager"),
        ProjectManager     = brackets.getModule("project/ProjectManager"),
        AppInit            = brackets.getModule("utils/AppInit"),
        ConfigurationFile  = require("src/bower/ConfigurationFile"),
        Event              = require("src/events/Events"),
        EventEmitter       = require("src/events/EventEmitter"),
        FileUtils          = require("src/utils/FileUtils");

    var _configurationFile    = null,
        _defaultConfiguration = {};

    function createConfiguration(path) {
        _configurationFile = new ConfigurationFile(path, _defaultConfiguration);

        return _configurationFile.create();
    }

    function removeConfiguration() {
        var deferred = new $.Deferred();

        if (_configurationFile !== null) {
            _configurationFile.remove()
                .done(deferred.resolve);
        } else {
            deferred.resolve();
        }

        return deferred;
    }

    function open() {
        if (_configurationFile !== null) {
            _configurationFile.open();
        }
    }

    function getConfiguration() {
        var config;

        if (_configurationFile !== null) {
            config = _configurationFile.getValue();
        } else {
            config = _defaultConfiguration;
        }

        return config;
    }

    /**
     * Checks if the file exists in the given directory. If the directory
     * is not set, the root project directory is taken as the default directory.
     * @param {string=} path
     * @return {Promise}
     */
    function findConfiguration(path) {
        if (!path) {
            path = ProjectManager.getProjectRoot().fullPath;
        }

        path += ".bowerrc";

        return FileUtils.exists(path);
    }

    function _loadConfiguration(path) {
        _configurationFile = new ConfigurationFile(path, _defaultConfiguration);
    }

    /**
     * Creates the default configuration based on those settings defined
     * in brackets preferences.
     */
    function _setUpDefaultConfiguration() {
        var proxy = PreferencesManager.get("proxy");

        if (proxy) {
            _defaultConfiguration.proxy = proxy;
            _defaultConfiguration.httpsProxy = proxy;
        }
    }

    /**
     * Callback when the default preferences change. If the "proxy" preference has changed,
     * create the default configuration with the new value.
     * @param {Array} preferencesChanged Array of preferences keys that could have changed.
     */
    function _onPreferencesChange(preferencesChanged) {
        if (!_defaultConfiguration) {
            return;
        }

        var indexProxy = preferencesChanged.indexOf("proxy");

        if (indexProxy !== -1) {
            var proxy = PreferencesManager.get("proxy");

            if (_defaultConfiguration.proxy !== proxy) {
                _setUpDefaultConfiguration();

                if (_configurationFile !== null) {
                    _configurationFile.setDefaults(_defaultConfiguration);
                }
            }
        }
    }

    function _onConfigurationChanged() {
        if (_configurationFile === null) {
            return;
        }

        _configurationFile.reload()
            .then(function () {
                _configurationFile.setDefaults(_defaultConfiguration);
            });
    }

    function _init() {
        _setUpDefaultConfiguration();

        AppInit.appReady(function () {
            // search for the configuration file if it exists
            var defaultPath = ProjectManager.getProjectRoot().fullPath;

            findConfiguration(defaultPath).then(function () {
                _loadConfiguration(defaultPath);
            });
        });

        EventEmitter.on(Event.BOWER_BOWERRC_CHANGE, _onConfigurationChanged);
        EventEmitter.on(Event.BOWER_BOWERRC_DELETE, _onConfigurationChanged);

        PreferencesManager.on("change", function (event, data) {
            _onPreferencesChange(data.ids);
        });
    }



    _init();

    exports.createConfiguration = createConfiguration;
    exports.removeConfiguration = removeConfiguration;
    exports.getConfiguration    = getConfiguration;
    exports.findConfiguration   = findConfiguration;
    exports.open                = open;
});
