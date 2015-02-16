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

/**
 * Preferences handles all the settings and defaults values for the extension. All modules
 * and components that needs to interact with the underline PreferenceManager and brackets
 * preferences for the extension, should require this module.
 */
define(function (require, exports, module) {
    "use strict";

    var PreferencesManager    = brackets.getModule("preferences/PreferencesManager"),
        preferences           = PreferencesManager.getExtensionPrefs("brackets-bower"),
        reloadRegistrySetting = require("src/preferences/ReloadRegistryTimeSetting"),
        savePackageSetting    = require("src/preferences/SavePackagesSetting"),
        showExtensionSetting  = require("src/preferences/ShowExtensionSetting");

    var settingsKey = {},
        settings    = {};

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

        for(key in settings) {
            if (settings.hasOwnProperty(key)) {
                defaults[key] = settings[key].defaultValue();
            }
        }

        return defaults;
    }

    function getDefaultBySetting(key) {
        var setting = settings[key];

        if (!setting) {
            throw "Setting with the preference key '" + key + "' doesn't exists.";
        }

        return setting.defaultValue();
    }

    function getMinValueForSetting(key) {
        var setting = settings[key];

        if (!setting) {
            throw "Setting with the preference key '" + key + "' doesn't exists.";
        }

        if (typeof setting.minValue !== "function") {
            throw "The setting '" + key + "' has not a minimum value defined.";
        }

        return setting.minValue();
    }

    function _validatePrefValue(key) {
        var validatorFn = settings[key].validate;

        if (validatorFn) {
            validatorFn(preferences.get(key), exports);
        }
    }

    function _onPreferencesChange(event, data) {
        var prefs = data.ids;

        prefs.forEach(function (preferenceKey) {
            _validatePrefValue(preferenceKey);
        });
    }

    function _init() {
        var key;

        settings[reloadRegistrySetting.key()] = reloadRegistrySetting;
        settings[savePackageSetting.key()] = savePackageSetting;
        settings[showExtensionSetting.key()] = showExtensionSetting;

        for(key in settings) {
            if (settings.hasOwnProperty(key)) {
                var setting = settings[key];

                preferences.definePreference(key, setting.type(), setting.defaultValue());

                settingsKey[setting.preferenceId()] = key;
            }
        }

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
