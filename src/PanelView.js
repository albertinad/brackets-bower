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

    var Strings           = require("../strings"),
        ConfigurationView = require("./ConfigurationView"),
        DependenciesView  = require("./DependenciesView"),
        panelTemplate     = require("text!../templates/panel.html");

    var $panel,
        $bowerIcon,
        isVisible = false,
        bowerStatus = {
            DEFAULT: "default",
            ACTIVE: "active",
            WARNING: "warning"
        },
        _currentStatusClass = bowerStatus.DEFAULT;

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

    function toggle() {
        if (isVisible) {
            Resizer.hide($panel);

            _setBowerIconStatus(_currentStatusClass);

            ConfigurationView.hide();
        } else {
            Resizer.show($panel);

            _setBowerIconStatus(bowerStatus.ACTIVE);

            ConfigurationView.show();
        }

        isVisible = !isVisible;
    }

    function setStatus(status) {
        _currentStatusClass = status;

        _setBowerIconStatus(status);
    }

    function _onPanelOptionSelected() {
        /*jshint validthis:true */
        var panel = $(this).data("bower-panel-btn");

        if (panel === "config") {
            ConfigurationView.show();
            DependenciesView.hide();
        } else {
            DependenciesView.show();
            ConfigurationView.hide();
        }
    }

    /**
     * @param {String} extensionName
     */
    function init(extensionName, commandToActive) {
        var panelHTML = Mustache.render(panelTemplate, { Strings: Strings }),
            $header;

        WorkspaceManager.createBottomPanel(extensionName, $(panelHTML), 100);

        $panel = $("#brackets-bower-panel");
        $header = $panel.find(".bower-panel-header");

        $header
            .on("click", ".close", toggle)
            .on("click", "[data-bower-panel-btn]", _onPanelOptionSelected);

        // right panel button
        $bowerIcon = $("<a id='bower-config-icon' href='#' title='" + Strings.TITLE_BOWER + "'></a>");

        $bowerIcon.appendTo("#main-toolbar .buttons");

        $bowerIcon.on("click", function () {
            CommandManager.execute(commandToActive);
        });

        ConfigurationView.render($("#brackets-bower-config"));
        DependenciesView.render($("#brackets-bower-dependencies"));
    }

    exports.init        = init;
    exports.toggle      = toggle;
    exports.setStatus   = setStatus;
    exports.bowerStatus = bowerStatus;
});
