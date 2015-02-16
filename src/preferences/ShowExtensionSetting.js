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
/*global define */

/**
 * Preferences handles all the settings and defaults values for the extension. All modules
 * and components that needs to interact with the underline PreferenceManager and brackets
 * preferences for the extension, should require this module.
 */
define(function (require, exports, module) {
    "use strict";

    var _key          = "show",
        _preferenceId = "EXTENSION_VISIBLE",
        _type         = "boolean",
        _defaultValue = false;

    function validate(value, preferences) {
        if (typeof value !== _type) {
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

    // API required by Preferences module

    exports.key          = key;
    exports.preferenceId = preferenceId;
    exports.type         = type;
    exports.defaultValue = defaultValue;
    exports.validate     = validate;
});
