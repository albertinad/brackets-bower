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
/*global $, define, Mustache */

define(function (require, exports, module) {
    "use strict";

    var template = require("text!templates/bower-json.html"),
        Strings  = require("strings");

    /**
     * Bower json view.
     * @constructor
     * @param{BowerJsonController} controller
     */
    function BowerJsonView(controller) {
        /** @private */
        this._controller = controller;
        /** @private */
        this._$panel = null;
        /** @private */
        this._$btnCreate = null;
    }

    BowerJsonView.prototype.initialize = function ($container) {
        var that = this;

        this._$panel = $container;

        this._$panel
            .on("click", "[data-bower-json-action='create']", function (event) {
                event.stopPropagation();

                that._disableButton($(this));

                that._controller.onCreate();
            })
            .on("click", "[data-bower-json-action='delete']", function (event) {
                event.stopPropagation();

                that._controller.onDelete();
            })
            .on("click", "[data-bower-json]", function () {
                that._controller.onSelected();
            });
    };

    /**
     * @param{Object} bowerJson
     */
    BowerJsonView.prototype.show = function (bowerJson) {
        var data = {
            Strings: Strings,
            bowerJson: bowerJson
        };

        var sectionHtml = Mustache.render(template, data);

        this._$panel.append(sectionHtml);
    };

    BowerJsonView.prototype.hide = function () {
        this._$panel.empty();
    };

    /**
     * @param{BowerJson} bowerJson
     */
    BowerJsonView.prototype.reload = function (bowerJson) {
        this._$panel.empty();

        this.show(bowerJson);
    };

    /**
     * @param{BowerJson} bowerJson
     */
    BowerJsonView.prototype.onBowerJsonCreated = function (bowerJson) {
        var $btnCreate = this._$panel.find("[data-bower-json-action='create']");

        this._enableButton($btnCreate);

        this.reload(bowerJson);
    };

    /**
     * @private
     * @param {jQuery} $btn
     */
    BowerJsonView.prototype._enableButton = function ($btn) {
        $btn.prop("disabled", false);
    };

    /**
     * @private
     * @param {jQuery} $btn
     */
    BowerJsonView.prototype._disableButton = function ($btn) {
        $btn.prop("disabled", true);
    };

    module.exports = BowerJsonView;
});
