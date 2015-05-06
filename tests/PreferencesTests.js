/*
 * Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
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

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, describe, it, expect */

define(function (require, exports, module) {
    "use strict";

    describe("BracketsBower - Preferences", function () {
        var Preferences = require("src/preferences/Preferences");

        it("should get as default value '10' for 'RELOAD_REGISTRY_TIME'", function () {
            var value = Preferences.getDefaultBySetting(Preferences.settings.RELOAD_REGISTRY_TIME);

            expect(value).toBe(10);
        });

        it("should get as default value 'true' for 'QUICK_INSTALL_SAVE'", function () {
            var value = Preferences.getDefaultBySetting(Preferences.settings.QUICK_INSTALL_SAVE);

            expect(value).toBe(true);
        });

        it("should get as default value 'false' for 'EXTENSION_VISIBLE'", function () {
            var value = Preferences.getDefaultBySetting(Preferences.settings.EXTENSION_VISIBLE);

            expect(value).toBe(false);
        });

        it("should get as minimum value '3' for 'RELOAD_REGISTRY_TIME'", function () {
            var value = Preferences.getMinValueForSetting(Preferences.settings.RELOAD_REGISTRY_TIME);

            expect(value).toBe(3);
        });

        it("should throw an exception when trying to get the minimum value for 'QUICK_INSTALL_SAVE'", function () {
            var fn = function () {
                Preferences.getMinValueForSetting(Preferences.settings.QUICK_INSTALL_SAVE);
            };

            expect(fn).toThrow();
        });

        it("should throw an exception when trying to get the minimum value for 'EXTENSION_VISIBLE'", function () {
            var fn = function () {
                Preferences.getMinValueForSetting(Preferences.settings.EXTENSION_VISIBLE);
            };

            expect(fn).toThrow();
        });

        it("should validate and change the preference 'RELOAD_REGISTRY_TIME' with a string value of '60000' to a number value", function () {
            var key = Preferences.settings.RELOAD_REGISTRY_TIME;

            Preferences.set(key, "6000");

            expect(Preferences.get(key)).toBe(6000);
        });

        it("should validate and change the preference 'RELOAD_REGISTRY_TIME' with a string value of 'abc' to the default number value for the preference", function () {
            var key = Preferences.settings.RELOAD_REGISTRY_TIME,
                defaults = Preferences.getDefaults();

            Preferences.set(key, "abc");

            expect(Preferences.get(key)).toBe(defaults.reloadRegistryTime);
        });

        it("should validate and change the preference 'RELOAD_REGISTRY_TIME' with a 'null' value to the default number value for the preference", function () {
            var key = Preferences.settings.RELOAD_REGISTRY_TIME,
                defaults = Preferences.getDefaults();

            Preferences.set(key, null);

            expect(Preferences.get(key)).toBe(defaults.reloadRegistryTime);
        });

        it("should validate and change the preference 'RELOAD_REGISTRY_TIME' with an 'undefined' value to the default number value for the preference", function () {
            var key = Preferences.settings.RELOAD_REGISTRY_TIME,
                defaults = Preferences.getDefaults();

            Preferences.set(key, undefined);

            expect(Preferences.get(key)).toBe(defaults.reloadRegistryTime);
        });

        it("should validate and change the preference 'RELOAD_REGISTRY_TIME' with a number value less than the minimum value, like '2' minutes, to the default number value for the preference", function () {
            var key = Preferences.settings.RELOAD_REGISTRY_TIME,
                defaults = Preferences.getDefaults();

            Preferences.set(key, 2);

            expect(Preferences.get(key)).toBe(defaults.reloadRegistryTime);
        });

        it("should validate and change the preference 'RELOAD_REGISTRY_TIME' with a number value less than the minimum value, like '-10' minutes, to the default number value for the preference", function () {
            var key = Preferences.settings.RELOAD_REGISTRY_TIME,
                defaults = Preferences.getDefaults();

            Preferences.set(key, -10);

            expect(Preferences.get(key)).toBe(defaults.reloadRegistryTime);
        });

        it("should validate and not change the preference 'RELOAD_REGISTRY_TIME' with a number value of '6000'", function () {
            var key = Preferences.settings.RELOAD_REGISTRY_TIME;

            Preferences.set(key, 100000);

            expect(Preferences.get(key)).toBe(100000);
        });

        it("should validate and change the preference 'QUICK_INSTALL_SAVE' with a string value of 'abc' to the default boolean value", function () {
            var key = Preferences.settings.QUICK_INSTALL_SAVE,
                defaults = Preferences.getDefaults();

            Preferences.set(key, "abc");

            expect(Preferences.get(key)).toBe(defaults.quickInstallSavePackages);
        });

        it("should validate and change the preference 'QUICK_INSTALL_SAVE' with a number value of '60000' to the default boolean value", function () {
            var key = Preferences.settings.QUICK_INSTALL_SAVE,
                defaults = Preferences.getDefaults();

            Preferences.set(key, 60000);

            expect(Preferences.get(key)).toBe(defaults.quickInstallSavePackages);
        });

        it("should validate and change the preference 'QUICK_INSTALL_SAVE' with a 'null' value to the default boolean value", function () {
            var key = Preferences.settings.QUICK_INSTALL_SAVE,
                defaults = Preferences.getDefaults();

            Preferences.set(key, null);

            expect(Preferences.get(key)).toBe(defaults.quickInstallSavePackages);
        });

        it("should validate and change the preference 'QUICK_INSTALL_SAVE' with an 'undefined' value to the default boolean value", function () {
            var key = Preferences.settings.QUICK_INSTALL_SAVE,
                defaults = Preferences.getDefaults();

            Preferences.set(key, undefined);

            expect(Preferences.get(key)).toBe(defaults.quickInstallSavePackages);
        });

        it("should validate and not change the preference 'QUICK_INSTALL_SAVE' with a boolean value of 'true'", function () {
            var key = Preferences.settings.QUICK_INSTALL_SAVE;

            Preferences.set(key, true);

            expect(Preferences.get(key)).toBe(true);
        });

        it("should validate and not change the preference 'QUICK_INSTALL_SAVE' with a boolean value of 'false'", function () {
            var key = Preferences.settings.QUICK_INSTALL_SAVE;

            Preferences.set(key, false);

            expect(Preferences.get(key)).toBe(false);
        });

        it("should validate and change the preference 'EXTENSION_VISIBLE' with a string value of 'abc' to the default boolean value", function () {
            var key = Preferences.settings.EXTENSION_VISIBLE,
                defaults = Preferences.getDefaults();

            Preferences.set(key, "abc");

            expect(Preferences.get(key)).toBe(defaults.show);
        });

        it("should validate and change the preference 'EXTENSION_VISIBLE' with a number value of '60000' to the default boolean value", function () {
            var key = Preferences.settings.EXTENSION_VISIBLE,
                defaults = Preferences.getDefaults();

            Preferences.set(key, 60000);

            expect(Preferences.get(key)).toBe(defaults.show);
        });

        it("should validate and change the preference 'EXTENSION_VISIBLE' with a null value to the default boolean value", function () {
            var key = Preferences.settings.EXTENSION_VISIBLE,
                defaults = Preferences.getDefaults();

            Preferences.set(key, null);

            expect(Preferences.get(key)).toBe(defaults.show);
        });

        it("should validate and change the preference 'EXTENSION_VISIBLE' with an undefined value to the default boolean value", function () {
            var key = Preferences.settings.EXTENSION_VISIBLE,
                defaults = Preferences.getDefaults();

            Preferences.set(key, undefined);

            expect(Preferences.get(key)).toBe(defaults.show);
        });

        it("should validate and not change the preference 'EXTENSION_VISIBLE' with a boolean value of 'true'", function () {
            var key = Preferences.settings.EXTENSION_VISIBLE;

            Preferences.set(key, true);

            expect(Preferences.get(key)).toBe(true);
        });

        it("should validate and not change the preference 'EXTENSION_VISIBLE' with a boolean value of 'false'", function () {
            var key = Preferences.settings.EXTENSION_VISIBLE;

            Preferences.set(key, false);

            expect(Preferences.get(key)).toBe(false);
        });
    });
});
