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
/*global define, brackets, Mustache */

define(function (require, exports, module) {
    "use strict";

    var Dialogs     = brackets.getModule("widgets/Dialogs"),
        Preferences = require("src/Preferences"),
        Strings     = require("strings"),
        dialogHTML  = require("text!templates/settings-dialog.html");

    var _$dialog;

    function _getViewData() {
        return {
            reloadRegistryTime: Preferences.get(Preferences.settings.RELOAD_REGISTRY_TIME),
            quickInstallSave: Preferences.get(Preferences.settings.QUICK_INSTALL_SAVE)
        };
    }

    function _applyChanges() {
        var reloadTime   = _$dialog.find("[data-bower-setting='quick-install-time']").val(),
            savePackages = _$dialog.find("[data-bower-setting='save-packages']").prop("checked");

        Preferences.set(Preferences.settings.RELOAD_REGISTRY_TIME, parseInt(reloadTime, 0));
        Preferences.set(Preferences.settings.QUICK_INSTALL_SAVE, savePackages);
    }

    function _bindEvents() {
        // TODO implement reloading default configuration
        /*_$dialog.on("click", "[data-button-id='default']", function (event) {
            event.stopPropagation();
            event.preventDefault();
        });*/
    }

    function _onCloseDialog(buttonId) {
        if (buttonId === "save") {
            _applyChanges();
        }
    }

    function show() {
        var dialog,
            options = {
                Strings: Strings,
                settings: _getViewData()
            },
            dialogTemplate = Mustache.render(dialogHTML, options);

        dialog = Dialogs.showModalDialogUsingTemplate(dialogTemplate);
        _$dialog = dialog.getElement();

        _bindEvents();

        dialog.done(_onCloseDialog);
    }

    exports.show = show;
});
