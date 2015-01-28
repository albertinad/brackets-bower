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

    var configurationTemplate = require("text!../templates/configuration.html"),
        Strings               = require("../strings"),
        ConfigurationManager  = require("src/bower/ConfigurationManager");

    var $panelSection;

    function show() {
        var viewModel = {
                Strings: Strings,
                bowerRc: ConfigurationManager.getBowerRc()
            },
            sectionHtml = Mustache.render(configurationTemplate, viewModel);

        $panelSection.append(sectionHtml);
    }

    function _refreshUi() {
        $panelSection.empty();

        show();
    }

    function _onDeleteClick(event) {
        event.stopPropagation();

        ConfigurationManager.removeConfiguration()
            .done(_refreshUi);
    }

    function _onCreateClick() {
        ConfigurationManager.createConfiguration()
            .done(function (path) {
                if (path) {
                    ConfigurationManager.open(path);
                    _refreshUi();
                }
        });
    }

    function _onConfigListClick() {
        ConfigurationManager.open();
    }

    function init($container) {
        $panelSection = $container;

        $panelSection
            .on("click", "[data-bower-config-action='delete']", _onDeleteClick)
            .on("click", "[data-bower-config-action='create']", _onCreateClick)
            .on("click", "[data-bower-config]", _onConfigListClick);
    }

    function hide() {
        $panelSection.empty();
    }

    exports.init = init;
    exports.show = show;
    exports.hide = hide;
});
