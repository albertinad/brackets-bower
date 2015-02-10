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

    var statusStyles = {
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
        this._$bowerIcon = null;

        /** @private */
        this._currentStatusClass = "default";
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
        this._$header = this._$panel.find(".bower-panel-header");
        this._$bowerIcon = $("<a id='bower-config-icon' href='#' title='" + Strings.TITLE_BOWER + "'></a>");

        this._$bowerIcon.appendTo("#main-toolbar .buttons");

        this._$header
            .on("click", ".close", this._onClose.bind(this))
            .on("click", "[data-bower-btn-id='settings']", this._onSettingsSelected.bind(this))
            .on("click", "[data-bower-panel-key]", function () {
                /*jshint validthis:true */
                var key = $(this).data("bower-panel-key");

                that._onPanelSelected(key);
            });

        this._$bowerIcon.on("click", this._onClose.bind(this));
    };

    /**
     * Show the panel view.
     */
    PanelView.prototype.show = function () {
        Resizer.show(this._$panel);

        this.updateIconStatus(statusStyles.ACTIVE);
    };

    /**
     * Hide the panel view. Update the bower icon from the extension panel with the current status.
     */
    PanelView.prototype.hide = function () {
        Resizer.hide(this._$panel);

        this.updateIconStatus(this._currentStatusClass);
    };

    /**
     * Get the panel section where the sub panels can be rendered.
     * @return {jQuery} jQuery object encapsulating the panel section HTML Element for the sub panels.
     */
    PanelView.prototype.getPanelSection = function () {
        return this._$panel.find("#brackets-bower-active-panel");
    };

    /**
     * Updates the bower icon class according to the status.
     * @param {string} status The status css class to set.
     */
    PanelView.prototype.updateIconStatus = function (status) {
        var statusArray = [],
            availableStatus;

        for (availableStatus in statusStyles) {
            if (statusStyles.hasOwnProperty(availableStatus)) {
                statusArray.push(statusStyles[availableStatus]);
            }
        }

        this._$bowerIcon.removeClass(statusArray.join(" "));
        this._$bowerIcon.addClass(status);
    };

    /**
     * Update the status selection of the panels buttons toolbar.
     * @param {string} panelKey
     * @param {string} previousPanelKey
     */
    PanelView.prototype.selectPanelButton = function (panelKey, previousPanelkey) {
        var $previousPanelBtn = this._$header.find("[data-bower-panel-key='" + previousPanelkey + "']"),
            $panelBtn = this._$header.find("[data-bower-panel-key='" + panelKey + "']");

        $previousPanelBtn.removeClass("active");
        $panelBtn.addClass("active");
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

    return PanelView;
});
