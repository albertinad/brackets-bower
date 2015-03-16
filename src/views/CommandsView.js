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

define(function (require, exports, module) {
    "use strict";

    var template = require("text!templates/commands.html"),
        Strings  = require("strings");

    /**
     * CommandsView constructor function.
     * @param {CommandsController} controller CommandsController instance.
     * @contructor
     */
    function CommandsView(controller) {
        /** @private */
        this._controller = controller;
        /** @private */
        this._$container = null;
    }

    /**
     * Initializes the commands view.
     * @param {jQuery} $container jQuery object representing the HTML Element container for
     * the commands view to render.
     */
    CommandsView.prototype.initialize = function ($container) {
        this._$container = $container;

        var that = this,
            commandsHtml = Mustache.render(template, {
                Strings: Strings
            });

        this._$container.append(commandsHtml);

        this._$container.on("click", "[data-bower-cmd-key]", function () {
            /*jshint validthis:true */
            that._onCommandSelected($(this).data("bower-cmd-key"));
        });
    };

    /**
     * Callback for when a command is selected, notify the controller to
     * start the command execution.
     * @param {string} commandKey
     */
    CommandsView.prototype._onCommandSelected = function (commandKey) {
        this._$container.find(".bower-btn").prop("disabled", true);

        this._controller.executeCommand(commandKey);
    };

    /**
     * Callback for when the command finishes its execution.
     */
    CommandsView.prototype.onCommandExecuted = function () {
        this._$container.find(".bower-btn").prop("disabled", false);
    };

    module.exports = CommandsView;
});
