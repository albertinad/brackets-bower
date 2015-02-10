/*
 * Copyright (c) 2013-2015 Narciso Jaramillo. All rights reserved.
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

define(function (require, exports) {
    "use strict";

    var StringUtils         = brackets.getModule("utils/StringUtils"),
        CommandsView        = require("src/views/CommandsView"),
        DependenciesManager = require("src/bower/DependenciesManager"),
        StatusBarController = require("src/StatusBarController").Controller,
        Strings             = require("strings");

    /**
     * CommandsController constructor function.
     * CommandsController constructor. Controller for the bower commands view.
     * @param {PanelController} controller PanelController instance.
     * @constructor
     */
    function CommandsController(controller) {
        /** @private */
        this._panelController = controller;
        /** @private */
        this._view = null;
        /** @private */
        this._isVisible = true;
    }

    /**
     * Initialize the commands controller instance.
     * @param {jQuery} $section jQuery representation of the HTML Element where the
     * view should render.
     */
    CommandsController.prototype.initialize = function ($section) {
        this._view = new CommandsView(this);

        this._view.initialize($section);
    };

    /**
     * Show the commands controller toolbar.
     */
    CommandsController.prototype.show = function () {
        if (!this._isVisible) {
            this._isVisible = true;

            this._view.show();
        }
    };

    /**
     * Hide the commands controller toolbar.
     */
    CommandsController.prototype.hide = function () {
        if (this._isVisible) {
            this._isVisible = false;

            this._view.hide();
        }
    };

    /**
     * Execute the bower command by the given key. Notifies the view when the
     * command has finished executing.
     * @param {string} commandKey The key of the bower command to execute.
     */
    CommandsController.prototype.executeCommand = function (commandKey) {
        var that = this,
            commandFn,
            resultMessage;

        if (commandKey === "install") {
            commandFn = DependenciesManager.installFromBowerJson;
            resultMessage = Strings.STATUS_SUCCESS_INSTALLING;
        } else {
            commandFn = DependenciesManager.prune;
            resultMessage = StringUtils.format(Strings.STATUS_SUCCESS_EXECUTING_COMMAND, commandKey);
        }

        var statusId = StatusBarController.post(StringUtils.format(Strings.STATUS_EXECUTING_COMMAND, commandKey), true);

        commandFn().then(function (result) {

            if (result && result.count === 0) {
                resultMessage = Strings.STATUS_NO_PACKAGES_INSTALLED;
            }

        }).fail(function () {

            resultMessage = StringUtils.format(Strings.STATUS_ERROR_EXECUTING_COMMAND, commandKey);

        }).always(function () {

            StatusBarController.update(statusId, resultMessage, false);
            StatusBarController.remove(statusId);

            that._view.onCommandExecuted();
        });
    };

    return CommandsController;
});
