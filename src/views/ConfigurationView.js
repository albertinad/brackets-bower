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

    var template = require("text!templates/configuration.html"),
        Strings  = require("strings");

    /**
     * Configuration view.
     * @constructor
     * @param{ConfigurationController} controller
     */
    function ConfigurationView(controller) {
        /** @private */
        this._controller = controller;
        /** @private */
        this._$panel = null;
    }

    ConfigurationView.prototype.initialize = function ($container) {
        this._$panel = $container;

        this._$panel
            .on("click", "[data-bower-config-action='delete']", this._onDelete.bind(this))
            .on("click", "[data-bower-config-action='create']", this._onCreate.bind(this))
            .on("click", "[data-bower-config]", this._onSelect.bind(this));
    };

    ConfigurationView.prototype.show = function (bowerRc) {
        var data = {
                Strings: Strings,
                bowerRc: bowerRc
            },
            sectionHtml = Mustache.render(template, data);

        this._$panel.append(sectionHtml);
    };

    ConfigurationView.prototype.hide = function () {
        this._$panel.empty();
    };

    /**
     * @param{BowerRc} bowerRc
     */
    ConfigurationView.prototype.reload = function (bowerRc) {
        this._$panel.empty();

        this.show(bowerRc);
    };

    ConfigurationView.prototype._onCreate = function (event) {
        event.stopPropagation();

        this._controller.onCreate();
    };

    ConfigurationView.prototype._onDelete = function (event) {
        event.stopPropagation();

        this._controller.onDelete();
    };

    ConfigurationView.prototype._onSelect = function () {
        this._controller.onSelected();
    };

    return ConfigurationView;
});
