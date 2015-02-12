/*
 * Copyright (c) 2013 - 2015 Narciso Jaramillo. All rights reserved.
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
/*global $, define, brackets, Mustache */

define(function (require, exports, module) {
    "use strict";

    var Dialogs     = brackets.getModule("widgets/Dialogs"),
        StringUtils = brackets.getModule("utils/StringUtils"),
        Preferences = require("src/Preferences"),
        Strings     = require("strings"),
        dialogHTML  = require("text!templates/settings-dialog.html");

    var _$dialog,
        _settings,
        _isError = false;

    function _prepareSettings() {
        _settings = {
            reloadRegistryTime: Preferences.get(Preferences.settings.RELOAD_REGISTRY_TIME),
            quickInstallSave: Preferences.get(Preferences.settings.QUICK_INSTALL_SAVE)
        };
    }

    function _clear() {
        _$dialog = null;
        _settings = null;
        _isError = false;
    }

    function _applyChanges() {
        var reloadTime   = _$dialog.find("[data-bower-setting='quick-install-time']").val(),
            savePackages = _$dialog.find("[data-bower-setting='save-packages']").prop("checked");

        Preferences.set(Preferences.settings.RELOAD_REGISTRY_TIME, parseInt(reloadTime, 0));
        Preferences.set(Preferences.settings.QUICK_INSTALL_SAVE, savePackages);

        _clear();
    }

    function _reloadDefaults() {
        var $installTime = _$dialog.find("[data-bower-setting='quick-install-time']"),
            $savePackages = _$dialog.find("[data-bower-setting='save-packages']");

        $installTime.val(Preferences.getDefaultBySetting(Preferences.settings.RELOAD_REGISTRY_TIME));
        $savePackages.prop("checked", Preferences.getDefaultBySetting(Preferences.settings.QUICK_INSTALL_SAVE));
    }

    function _onCloseDialog(buttonId) {
        if (buttonId === "save") {
            _applyChanges();
        } else if (buttonId === "cancel") {
            _clear();
        }
    }

    function bindEvents() {
        var $error = _$dialog.find("[data-bower-setting-error='quick-install-time']");

        // validate input value
        $("input[data-bower-setting='quick-install-time']", _$dialog).on("input", function () {
            var value = $(this).val(),
                hasClass;

            value = parseInt(value, 0);
            hasClass = $error.hasClass("hide");

            if ((value < 3) || isNaN(value)) {
                $error.text(StringUtils.format(Strings.ERROR_RELOAD_TIME_VALUE, 3));

                if (hasClass) {
                    $error.removeClass("hide");
                    _isError = true;
                }

            } else if (!hasClass) {
                $error.addClass("hide");
                _isError = false;
            }
        });

        // check for errors before apply
        $("button[data-button-id='save']", _$dialog).on("click", function (event) {
            if (_isError) {
                event.stopPropagation();
            }
        });

        // reload defaults
        $("button[data-button-id='default']", _$dialog).on("click", function (event) {
            event.stopPropagation();

            _reloadDefaults();
        });
    }

    function _getTemplateData() {
        return {
            Strings: Strings,
            settings: _settings
        };
    }

    function show() {
        _prepareSettings();

        var dialogTemplate = Mustache.render(dialogHTML, _getTemplateData()),
            dialog = Dialogs.showModalDialogUsingTemplate(dialogTemplate);

        _$dialog = dialog.getElement();

        bindEvents();

        dialog.done(_onCloseDialog);
    }

    exports.show = show;
});
