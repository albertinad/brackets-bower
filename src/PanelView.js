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

    var Resizer           = brackets.getModule("utils/Resizer"),
        WorkspaceManager  = brackets.getModule("view/WorkspaceManager"),
        CommandManager    = brackets.getModule("command/CommandManager");

    var Strings             = require("../strings"),
        ConfigurationView   = require("./ConfigurationView"),
        BowerJsonView       = require("./BowerJsonView"),
        SettingsDialog      = require("./dialogs/SettingsDialog"),
        DependenciesManager = require("./bower/DependenciesManager"),
        Preferences         = require("./Preferences"),
        panelTemplate       = require("text!../templates/panel.html");

    var $panel,
        $header,
        $bowerIcon,
        _isVisible = false,
        _currentPanelView = null,
        _currentPanelKey = null,
        bowerStatus = {
            DEFAULT: "default",
            ACTIVE: "active",
            WARNING: "warning"
        },
        _currentStatusClass = bowerStatus.DEFAULT;

    /**
     * Updates the bower icon class according to the status.
     * @param {string} status The status css class to set.
     */
    function _setBowerIconStatus(status) {
        var statusArray = [],
            availableStatus;

        for (availableStatus in bowerStatus) {
            if (bowerStatus.hasOwnProperty(availableStatus)) {
                statusArray.push(bowerStatus[availableStatus]);
            }
        }

        $bowerIcon.removeClass(statusArray.join(" "));
        $bowerIcon.addClass(status);
    }

    /**
     * Toggle the main panel.
     */
    function toggle() {
        if (_isVisible) {
            Resizer.hide($panel);

            _setBowerIconStatus(_currentStatusClass);

            _currentPanelView.hide();
        } else {
            Resizer.show($panel);

            _setBowerIconStatus(bowerStatus.ACTIVE);

            _currentPanelView.show();
        }

        _isVisible = !_isVisible;

        Preferences.set(Preferences.settings.EXTENSION_VISIBLE, _isVisible);
    }

    /**
     * Set the current status.
     * @param {string} status The new css status class to set.
     */
    function setStatus(status) {
        _currentStatusClass = status;

        _setBowerIconStatus(status);
    }

    function _onPanelOptionSelected() {
        /*jshint validthis:true */
        var $panelBtn = $(this),
            $previousPanelBtn,
            panelKey = $panelBtn.data("bower-panel-key");

        if (_currentPanelKey === panelKey) {
            return;
        }

        $previousPanelBtn = $header.find("[data-bower-panel-key='" + _currentPanelKey + "']");
        $previousPanelBtn.removeClass("active");

        _currentPanelKey = panelKey;

        _currentPanelView.hide();

        if (panelKey === "config") {
            _currentPanelView = ConfigurationView;
        } else {
            _currentPanelView = BowerJsonView;
        }

        $panelBtn.addClass("active");

        _currentPanelView.show();
    }

    function _onCommandSelected() {
        /*jshint validthis:true */
        var cmdKey = $(this).data("bower-cmd-key");

        if (cmdKey === "install") {
            DependenciesManager.installFromBowerJson();
        } else {
            DependenciesManager.prune();
        }
    }

    function _showExtensionSettings() {
        SettingsDialog.show();
    }

    /**
     * @param {string} extensionName The extension name.
     * @param {string} command The command name to toggle the panel.
     */
    function init(extensionName, command) {
        var panelHTML = Mustache.render(panelTemplate, { Strings: Strings }),
            $panelSection;

        WorkspaceManager.createBottomPanel(extensionName, $(panelHTML), 100);

        $panel = $("#brackets-bower-panel");
        $panelSection = $panel.find("#brackets-bower-active-panel");
        $header = $panel.find(".bower-panel-header");

        $header
            .on("click", ".close", toggle)
            .on("click", "[data-bower-panel-key]", _onPanelOptionSelected)
            .on("click", "[data-bower-btn-id='settings']", _showExtensionSettings)
            .on("click", "[data-bower-cmd-key]", _onCommandSelected);

        // right panel button
        $bowerIcon = $("<a id='bower-config-icon' href='#' title='" + Strings.TITLE_BOWER + "'></a>");

        $bowerIcon.appendTo("#main-toolbar .buttons");

        $bowerIcon.on("click", function () {
            CommandManager.execute(command);
        });

        BowerJsonView.init($panelSection);
        ConfigurationView.init($panelSection);

        // set the BowerJsonView as the default/current panelView
        _currentPanelView = BowerJsonView;
        _currentPanelKey = "bower-json";
    }

    exports.init        = init;
    exports.toggle      = toggle;
    exports.setStatus   = setStatus;
    exports.bowerStatus = bowerStatus;
});
