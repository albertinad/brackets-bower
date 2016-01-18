/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 - 2016 Intel Corporation
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4,
maxerr: 50, browser: true */
/*global define */

/**
 * Preferences handles all the settings and defaults values for the extension. All modules
 * and components that needs to interact with the underline PreferenceManager and brackets
 * preferences for the extension, should require this module.
 */
define(function (require, exports, module) {
    "use strict";

    var _key          = "reloadRegistryTime",
        _preferenceId = "RELOAD_REGISTRY_TIME",
        _type         = "number",
        _defaultValue = 10,
        _minValue     = 3;

    function validate(value, preferences) {
        if (typeof value !== _type) {
            if (value === undefined || value === null) {
                value = _defaultValue;
            } else {
                value = parseInt(value, 0);

                if (isNaN(value)) {
                    value = _defaultValue;
                }
            }

            preferences.set(_key, value);
        } else if (value < _minValue) {
            preferences.set(_key, _defaultValue);
        }
    }

    function key() {
        return _key;
    }

    function preferenceId() {
        return _preferenceId;
    }

    function type() {
        return _type;
    }

    function defaultValue() {
        return _defaultValue;
    }

    function minValue() {
        return _minValue;
    }

    // API required by Preferences module

    exports.key          = key;
    exports.preferenceId = preferenceId;
    exports.type         = type;
    exports.defaultValue = defaultValue;
    exports.minValue     = minValue;
    exports.validate     = validate;
});
