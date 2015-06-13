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

    var Resizer          = brackets.getModule("utils/Resizer"),
        WorkspaceManager = brackets.getModule("view/WorkspaceManager"),
        Strings          = require("strings"),
        panelTemplate    = require("text!templates/panel.html");

    var StatusStyles = {
        DEFAULT: "default",
        ACTIVE: "active",
        WARNING: "warning"
    };

    /**
     * PanelView constructor function. It represents the main view for the extension panel.
     * @param {PanelController} controller The instance of the panel controller.
     * @constructor
     */
    function PanelView(controller) {
        /** @private */
        this._controller = controller;
        /** @private */
        this._$panel = null;
        /** @private */
        this._$header = null;
        /** @private */
        this._$commands = null;
        /** @private */
        this._$bowerIcon = null;
        /** @private */
        this._$activePanelSection = null;
        /** @private */
        this._$loading = null;
        /** @private */
        this._$activeDirLabel = null;
        /** @private */
        this._$statusSection = null;

        /** @private */
        this._currentStatusClass = StatusStyles.DEFAULT;
    }

    /**
     * Initializes the panel view. It creates a bottom panel, set up the bower icon for the
     * extensions panel and binds the events handlers for the supported events.
     * @param {string} extensionName The name of the extension.
     */
    PanelView.prototype.initialize = function (extensionName) {
        var that = this,
            panelHTML = Mustache.render(panelTemplate, { Strings: Strings });

        WorkspaceManager.createBottomPanel(extensionName, $(panelHTML), 100);

        this._$panel = $("#brackets-bower-panel");
        this._$activePanelSection = $("#brackets-bower-active-panel");
        this._$loading = $("#brackets-bower-panel-loading");
        this._$header = this._$panel.find(".bower-panel-header");
        this._$commands = this._$header.find(".bower-commands-group");
        this._$activeDirLabel = $("#bower-active-path");
        this._$statusSection = $("#bower-sync");
        this._$bowerIcon = $("<a id='bower-config-icon' href='#' title='" + Strings.TITLE_BOWER + "'></a>");

        this._$bowerIcon.appendTo("#main-toolbar .buttons");

        this._$header
            .on("click", ".close", this._onClose.bind(this))
            .on("click", "[data-bower-btn-id='settings']", this._onSettingsSelected.bind(this))
            .on("click", "[data-bower-panel-key]", function () {
                that._onPanelSelected($(this).data("bower-panel-key"));
            })
            .on("click", "[data-bower-sync]", function () {
                that._onSyncOptionSelected($(this).data("bower-sync"));
            });

        this._$commands.on("click", "[data-bower-cmd-key]", function () {
            that._onCommandSelected($(this).data("bower-cmd-key"));
        });

        this._$bowerIcon.on("click", this._onClose.bind(this));
    };

    /**
     * @const
     */
    PanelView.StatusStyles = StatusStyles;

    /**
     * Show the panel view.
     */
    PanelView.prototype.show = function () {
        var status;

        Resizer.show(this._$panel);

        if (this._currentStatusClass === StatusStyles.DEFAULT) {
            status = StatusStyles.ACTIVE;
        } else {
            status = this._currentStatusClass;
        }

        this._internalUpdateIconStatus(status);
    };

    /**
     * Hide the panel view. Update the bower icon from the extension panel with the current status.
     */
    PanelView.prototype.hide = function () {
        Resizer.hide(this._$panel);

        this._internalUpdateIconStatus(this._currentStatusClass);
    };

    /**
     * Enable the view to receive inputs from the user.
     */
    PanelView.prototype.enable = function () {
        this._enableButton(this._$header.find("button.bower-btn"));
        this._$activePanelSection.show();
        this._$loading.hide();
    };

    /**
     * Disable the view to receive inputs from the user.
     */
    PanelView.prototype.disable = function () {
        this._disableButton(this._$header.find("button.bower-btn"));
        this._$activePanelSection.hide();
        this._$loading.show();
    };

    /**
     * Get the panel section where the sub panels can be rendered.
     * @return {jQuery} jQuery object encapsulating the panel section HTML Element for the sub panels.
     */
    PanelView.prototype.getPanelSection = function () {
        return this._$activePanelSection;
    };

    /**
     * Updates the bower icon class according to the status and save
     * the given status as current one.
     * @param {string} status The status css class to set.
     */
    PanelView.prototype.updateIconStatus = function (status) {
        this._currentStatusClass = status;

        if (this._controller.isPanelActive() && this._currentStatusClass === StatusStyles.DEFAULT) {
            // clients requests to update the panel icon when the panel is visible and in the default state
            // replace the requested state by the active one.
            status = StatusStyles.ACTIVE;
        }

        this._internalUpdateIconStatus(status);
    };

    /**
     * Updates the bower icon class according to the status.
     * @param {string} status The status css class to set.
     * @private
     */
    PanelView.prototype._internalUpdateIconStatus = function (status) {
        var statusArray = [],
            availableStatus;

        for (availableStatus in StatusStyles) {
            if (StatusStyles.hasOwnProperty(availableStatus)) {
                statusArray.push(StatusStyles[availableStatus]);
            }
        }

        this._$bowerIcon.removeClass(statusArray.join(" "));
        this._$bowerIcon.addClass(status);
    };
    /**
     * Update the status selection of the panels buttons toolbar.
     * @param {string} panelKey
     */
    PanelView.prototype.selectPanelButton = function (panelKey) {
        var $previousPanelBtn = this._$header.find("[data-bower-panel-key].active"),
            $panelBtn = this._$header.find("[data-bower-panel-key='" + panelKey + "']");

        $previousPanelBtn.removeClass("active");
        $panelBtn.addClass("active");
    };

    /**
     * @param {string} shortPath
     */
    PanelView.prototype.onActiveDirChanged = function (shortPath) {
        this._$activeDirLabel.text(shortPath);
    };

    /**
     * @param {ProjectStatus} projectStatus
     */
    PanelView.prototype.projectStatusChanged = function (projectStatus) {
        var $message = this._$statusSection.find("[data-bower-status='message']"),
            $btns = this._$statusSection.find("[data-bower-sync]"),
            statusTypeClass;

        if (projectStatus) {
            StatusStyles = PanelView.StatusStyles;

            if (projectStatus.isOutOfSync()) {
                statusTypeClass = StatusStyles.WARNING;

                $message.text(Strings.PROJECT_OUT_OF_SYNC_MESSAGE);

                this._enableButton($btns);
            } else {
                statusTypeClass = StatusStyles.DEFAULT;

                $message.text("");

                this._disableButton($btns);
            }

            this.updateIconStatus(statusTypeClass);
        }
    };

    /**
     * Callback for when the command finishes its execution.
     */
    PanelView.prototype.onCommandExecuted = function () {
        this._enableButton(this._$commands.find(".bower-btn"));
    };

    /**
     * Callback for when the synchronization fails. Enable the synchronization
     * options buttons.
     */
    PanelView.prototype.syncFailed = function () {
        var $btns = this._$statusSection.find("[data-bower-sync]");

        this._enableButton($btns);
    };

    /**
     * Callback for when a command is selected, notify the controller to
     * start the command execution.
     * @param {string} commandKey
     */
    PanelView.prototype._onCommandSelected = function (commandKey) {
        this._disableButton(this._$commands.find(".bower-btn"));

        this._controller.executeCommand(commandKey);
    };

    /**
     * Callback for when a sub panel has been selected.
     * @param {string} key The key of the selected panel.
     * @private
     */
    PanelView.prototype._onPanelSelected = function (key) {
        this._controller.panelSelected(key);
    };

    /**
     * Callback for when the settings dialog is displayed.
     * @private
     */
    PanelView.prototype._onSettingsSelected = function () {
        this._controller.showExtensionSettings();
    };

    /**
     * Callback for when the extension panel is closed.
     * @private
     */
    PanelView.prototype._onClose = function () {
        this._controller.toggle();
    };

    /**
     * @param {string} option
     * @private
     */
    PanelView.prototype._onSyncOptionSelected = function (option) {
        var $btns = this._$statusSection.find("[data-bower-sync]");

        this._disableButton($btns);

        this._controller.syncProject(option);
    };

    /**
     * Helper function to enable a given jQuery button object.
     * @private
     * @param {jQuery} $btn
     */
    PanelView.prototype._enableButton = function ($btn) {
        $btn.prop("disabled", false);
    };

    /**
     * Helper function to disable a given jQuery button object.
     * @private
     * @param {jQuery} $btn
     */
    PanelView.prototype._disableButton = function ($btn) {
        $btn.prop("disabled", true);
    };

    module.exports = PanelView;
});
