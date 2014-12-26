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

define(function (require, exports) {
    "use strict";

    var configurationTemplate = require("text!../templates/configuration.html"),
        Strings               = require("../strings"),
        BowerConfiguration    = require("src/bower/Configuration");

    var $panelSection;

    function render($container) {
        $panelSection = $container;

        // callbacks

        function _onDeleteClick (event) {
            event.stopPropagation();

            /*jshint validthis:true */
            var path = $(this).data("bower-config");

            BowerConfiguration.remove(path)
                .done(function () {
                    _refreshUi();
                })
                .fail(function (error) {
                    // TODO warn the user
                });
        }

        function _onCreateClick() {
            BowerConfiguration.create()
                .done(function (path) {
                    if(path) {
                        BowerConfiguration.open(path);
                        _refreshUi();
                    }
                });
        }

        function _onConfigListClick () {
            /*jshint validthis:true */
            var path = $(this).data("bower-config");

            BowerConfiguration.open(path);
        }

        $panelSection
            .on("click", "[data-bower-config-action='delete']", _onDeleteClick)
            .on("click", "[data-bower-config-action='create']", _onCreateClick)
            .on("click", "[data-bower-config]", _onConfigListClick);
    }

    function _getViewData () {
        return {
            Strings: Strings,
            bowerrc: []
        };
    }

    function showConfiguration() {
        var data = _getViewData(),
            sectionHtml;

        BowerConfiguration.exists()
            .done(function (path) {
                data.bowerrc.push({ path: path });
            })
            .always(function () {
                sectionHtml = Mustache.render(configurationTemplate, data);

                $panelSection.append(sectionHtml);
            });
    }

    function _refreshUi() {
        $panelSection.empty();

        showConfiguration();
    }

    function hide () {
        $panelSection.empty();
    }

    exports.render = render;
    exports.show   = showConfiguration;
    exports.hide   = hide;
});
