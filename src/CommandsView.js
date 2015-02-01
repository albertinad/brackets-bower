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
/*global define, Mustache */

define(function (require, exports) {
    "use strict";

    var StringUtils         = brackets.getModule("utils/StringUtils"),
        template            = require("text!../templates/commands.html"),
        Strings             = require("strings"),
        DependenciesManager = require("src/bower/DependenciesManager"),
        StatusBarController = require("src/status/StatusBarController").Controller;

    var $commandsToolbar,
        _statusId;

    function _onCommandSelected() {
        /*jshint validthis:true */
        var cmdKey = $(this).data("bower-cmd-key"),
            commandFn,
            resultMessage;

        if (cmdKey === "install") {
            commandFn = DependenciesManager.installFromBowerJson;
            resultMessage = Strings.STATUS_SUCCESS_INSTALLING;
        } else {
            commandFn = DependenciesManager.prune;
            resultMessage = StringUtils.format(Strings.STATUS_SUCCESS_EXECUTING_COMMAND, cmdKey);
        }

        $commandsToolbar.find(".bower-btn").prop("disabled", true);

        _statusId = StatusBarController.post(StringUtils.format(Strings.STATUS_EXECUTING_COMMAND, cmdKey), true);

        commandFn().then(function (result) {

            if (result && result.count === 0) {
                resultMessage = Strings.STATUS_NO_PACKAGES_INSTALLED;
            }

        }).fail(function () {

           resultMessage = StringUtils.format(Strings.STATUS_ERROR_EXECUTING_COMMAND, cmdKey);

        }).always(function () {

            StatusBarController.update(_statusId, resultMessage, false);
            StatusBarController.remove(_statusId);

            $commandsToolbar.find(".bower-btn").prop("disabled", false);
        });
    }

    function init($container) {
        $commandsToolbar = $container;

        var viewModel = {
                Strings: Strings
            },
            commandsHtml = Mustache.render(template, viewModel);

        $commandsToolbar.append(commandsHtml);

        $commandsToolbar.on("click", "[data-bower-cmd-key]", _onCommandSelected);
    }

    exports.init = init;
});
