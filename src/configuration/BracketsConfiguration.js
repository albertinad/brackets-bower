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

    var _                  = brackets.getModule("thirdparty/lodash"),
        PreferencesManager = brackets.getModule("preferences/PreferencesManager"),
        EventDispatcher    = brackets.getModule("utils/EventDispatcher");

    var _configuration = {},
        namespace = ".albertinad.bracketsbower.bracketsconfig",
        CHANGED = "changed",
        Events = {
            CHANGED: CHANGED + namespace
        };

    EventDispatcher.makeEventDispatcher(exports);

    /**
     * Creates the configuration based on those settings defined
     * in brackets preferences.
     */
    function _setUpConfiguration() {
        var proxy = PreferencesManager.get("proxy");

        if (proxy) {
            _configuration.proxy = proxy;
            _configuration.httpsProxy = proxy;
        } else {
            _configuration = {};
        }
    }

    /**
     * Callback when the default preferences change. If the "proxy" preference has changed,
     * create the default configuration with the new value.
     * @param {Array} preferencesChanged Array of preferences keys that could have changed.
     */
    function _onPreferencesChange(preferencesChanged) {
        if (!_configuration) {
            return;
        }

        var indexProxy = preferencesChanged.indexOf("proxy"),
            proxy;

        if (indexProxy !== -1) {
            proxy = PreferencesManager.get("proxy");

            if (_configuration.proxy !== proxy) {
                _setUpConfiguration();

                exports.trigger(CHANGED, _configuration);
            }
        }
    }

    function getConfiguration() {
        return _.clone(_configuration, true);
    }

    function init() {
        _setUpConfiguration();

        PreferencesManager.on("change", function (event, data) {
            _onPreferencesChange(data.ids);
        });
    }

    exports.init             = init;
    exports.getConfiguration = getConfiguration;
    exports.Events           = Events;
});
