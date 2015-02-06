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
/*global $, define, brackets, Mustache */

define(function (require, exports, module) {
    "use strict";

    var PanelView      = require("src/views/PanelView"),
        CommandsView   = require("src/CommandsView"),
        SettingsDialog = require("src/dialogs/SettingsDialog"),
        Preferences    = require("src/Preferences");

    /**
     * PanelController constructor.
     * @constructor
     */
    function PanelController() {
        /** @private */
        this._view = null;
        /** @private */
        this._isActive = false;

        /** @private */
        this._controllersMap = {};
        /** @private */
        this._activePanelController = null;
        /** @private */
        this._activePanelkey = null;
    }

    PanelController.STATUS_WARNING = "warning";

    PanelController.prototype.initialize = function (extensionName) {
        this._view = new PanelView(this);

        this._view.initialize(extensionName);

        var $section = this._view.getPanelSection();

        for (var controller in this._controllersMap) {
            this._controllersMap[controller].initialize($section);
        }

        CommandsView.init($("#bower-commands"));

        if (Preferences.get(Preferences.settings.EXTENSION_VISIBLE)) {
            this.toggle();
        }
    };

    PanelController.prototype.toggle = function () {
        if (this._isActive) {
            this._view.hide();
            this._activePanelController.hide();
        } else {
            this._view.show();
            this._activePanelController.show();
        }

        this._isActive = !this._isActive;

        Preferences.set(Preferences.settings.EXTENSION_VISIBLE, this._isActive);
    };

    /**
     * @param{string} key
     */
    PanelController.prototype.panelSelected = function (key) {
        // validate if the panel to show is the current active one
        if (this._activePanelkey === key) {
            return;
        }

        this._activePanelController.hide();

        this._activePanelController = this._getPanelControllerByKey(key);

        this._view.selectPanelButton(key, this._activePanelkey);

        this._activePanelkey = key;

        this._activePanelController.show();
    };

    PanelController.prototype.isPanelActive = function () {
        return this._isActive;
    };

    PanelController.prototype.showExtensionSettings = function () {
        SettingsDialog.show();
    };

    /**
     * Set the status to warning.
     */
    PanelController.prototype.updateStatus = function (status) {
        this._view.updateIconStatus(status);
    };

    /**
     * @param{string} key
     * @param{Object} controller
     */
    PanelController.prototype.registerController = function (key, controller, isDefault) {
        this._controllersMap[key] = controller;

        if (isDefault) {
            this._activePanelkey = key;
            this._activePanelController = controller;
        }
    };

    /**
     * @param{string} key
     */
    PanelController.prototype._getPanelControllerByKey = function (key) {
        var controller = this._controllersMap[key];

        if (!controller) {
            throw "Controller with the key '" + key + "' is not registered.";
        }

        return controller;
    };

    return PanelController;
});
