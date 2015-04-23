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

    var Dialogs    = brackets.getModule("widgets/Dialogs"),
        Strings    = require("strings"),
        dialogHTML = require("text!templates/error-dialog.html");

    var errorSeverity = {
        WARNING: "warning"
    };

    var BTN_OK    = "ok",
        BTN_CLOSE = "close";

    /**
     * @param {string} summary
     * @param {string} highlight
     */
    function showWarning(summary, highlight) {
        var dialog,
            dialogTemplate = Mustache.render(dialogHTML, {
                severity: errorSeverity.WARNING,
                title: Strings.TITLE_WARNING,
                summary: summary,
                highlight: highlight,
                buttons: [{ id: BTN_CLOSE, text: Strings.TEXT_CLOSE }]
            });

        dialog = Dialogs.showModalDialogUsingTemplate(dialogTemplate);

        dialog.done();
    }

    /**
     * @param {string}
     */
    function showError(highlight) {
        var dialog,
            dialogTemplate = Mustache.render(dialogHTML, {
                title: Strings.TITLE_ERROR,
                summary: Strings.SUMMARY_ERROR,
                highlight: highlight,
                buttons: [{ id: BTN_CLOSE, text: Strings.TEXT_CLOSE }]
            });

        dialog = Dialogs.showModalDialogUsingTemplate(dialogTemplate);

        dialog.done();
    }

    /**
     * @param {string} title
     * @param {object} options
     * @return {Dialog}
     */
    function showOkCancel(title, options) {
        var dialogTemplate,
            templateOptions = {
                title: title,
                summary: options.summary || null,
                description: options.description || null,
                highlight: options.highlight || null,
                note: options.note || null
            };

        if (options.buttons) {
            templateOptions.buttons = options.buttons;
        } else {
            // default buttons
            templateOptions.buttons = [
                { id: BTN_CLOSE, text: Strings.TEXT_CLOSE },
                { id: BTN_OK, text: Strings.TEXT_OK }
            ];
        }

        dialogTemplate = Mustache.render(dialogHTML, templateOptions);

        return Dialogs.showModalDialogUsingTemplate(dialogTemplate);
    }

    exports.showWarning  = showWarning;
    exports.showError    = showError;
    exports.showOkCancel = showOkCancel;
    exports.BTN_CLOSE    = BTN_CLOSE;
    exports.BTN_OK       = BTN_OK;
});
