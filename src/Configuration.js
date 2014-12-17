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

    var PreferencesManager = brackets.getModule("preferences/PreferencesManager");

    var cacheConfig = null;

    /**
     * Creates the default configuration based on those settings defined
     * in brackets preferences.
     */
    function _createDefaultConfiguration() {
        var proxy = PreferencesManager.get("proxy");

        cacheConfig = {};

        if (proxy) {
            cacheConfig.proxy = proxy;
            cacheConfig.httpsProxy = proxy;
        }
    }

    /**
     * Gets the default configuration. If the configuration is not cached, it
     * creates it and then return it.
     * @returns {Object} Configuration object
     */
    function getDefaultConfiguration() {
        if (!cacheConfig) {
            _createDefaultConfiguration();
        }

        return cacheConfig;
    }

    /**
     * Callback when the default preferences change. If the "proxy" preference has changed,
     * create the default configuration with the new value.
     * @param {Array} preferencesChanged Array of preferences keys that could have changed.
     */
    function _onPreferencesChange(preferencesChanged) {
        if (!cacheConfig) {
            return;
        }

        var indexProxy = preferencesChanged.indexOf("proxy");

        if (indexProxy !== -1) {
            var proxy = PreferencesManager.get("proxy");

            if (cacheConfig.proxy !== proxy) {
                _createDefaultConfiguration();
            }
        }
    }

    function _init() {

        PreferencesManager.on("change", function (event, data) {
            _onPreferencesChange(data.ids);
        });
    }

    _init();

    exports.getDefaultConfiguration = getDefaultConfiguration;
});
