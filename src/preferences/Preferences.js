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
/*global define, brackets */

/**
 * Preferences handles all the settings and defaults values for the extension. All modules
 * and components that needs to interact with the underline PreferenceManager and brackets
 * preferences for the extension, should require this module.
 */
define(function (require, exports, module) {
    "use strict";

    var PreferencesManager = brackets.getModule("preferences/PreferencesManager"),
        preferences        = PreferencesManager.getExtensionPrefs("brackets-bower");

    var settingsKey = {},
        settings    = {};

    /**
     * @private
     */
    function _isValidProp(prop) {
        return (prop !== undefined && prop !== null);
    }

    function get(key) {
        return preferences.get(key);
    }

    function set(key, value) {
        preferences.set(key, value);
        preferences.save();
    }

    function getDefaults() {
        var defaults = {},
            key;

        for (key in settings) {
            if (settings.hasOwnProperty(key)) {
                defaults[key] = settings[key].defaultValue;
            }
        }

        return defaults;
    }

    function getDefaultBySetting(key) {
        var setting = settings[key];

        if (!setting) {
            throw "Setting with the preference key '" + key + "' doesn't exists.";
        }

        return setting.defaultValue;
    }

    function getMinValueForSetting(key) {
        var setting = settings[key];

        if (!setting) {
            throw "Setting with the preference key '" + key + "' doesn't exists.";
        }

        if (!_isValidProp(setting.minValue)) {
            throw "The setting '" + key + "' has not a minimum value defined.";
        }

        return setting.minValue;
    }

    /**
     * @private
     */
    function _validatePrefValue(key) {
        var settingItem = settings[key],
            validatorFn = settingItem.validate;

        if (typeof validatorFn === "function") {
            validatorFn.call(settingItem, preferences.get(key), exports);
        } else if (typeof preferences.get(key) !== settingItem.type) {
            // default validation
            preferences.set(settingItem.key, settingItem.defaultValue);
        }
    }

    /**
     * @private
     */
    function _onPreferencesChange(event, data) {
        var prefs = data.ids;

        prefs.forEach(function (preferenceKey) {
            _validatePrefValue(preferenceKey);
        });
    }

    /**
     * @private
     */
    function _init() {
        var data = require("./preferencesData");

        data.forEach(function (prefData) {
            if (!_isValidProp(prefData.key)) {
                throw "The property 'key' must be defined.";
            }
            if (!_isValidProp(prefData.type)) {
                throw "The property 'type' must be defined.";
            }
            if (!_isValidProp(prefData.defaultValue)) {
                throw "The property 'defaultValue' must be defined.";
            }

            settings[prefData.key] = prefData;
            settingsKey[prefData.preferenceId] = prefData.key;

            preferences.definePreference(prefData.key, prefData.type, prefData.defaultValue);
        });

        preferences.on("change", _onPreferencesChange);
    }

    _init();

    exports.set                   = set;
    exports.get                   = get;
    exports.settings              = settingsKey;
    exports.getDefaults           = getDefaults;
    exports.getDefaultBySetting   = getDefaultBySetting;
    exports.getMinValueForSetting = getMinValueForSetting;
});
