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
/*global define */

define(function (require, exports) {
    "use strict";

    var BowerJsonView       = require("src/views/BowerJsonView"),
        DependenciesManager = require("src/bower/DependenciesManager");

    /**
     * BowerJsonController constructor. Controller for the bower json view.
     * @constructor
     * @param{PanelController} controller Main application controller.
     */
    function BowerJsonController(controller) {
        /** @private */
        this._panelController = controller;
        /** @private */
        this._view = null;
        /** @private */
        this._isVisible = false;
    }

    BowerJsonController.prototype.initialize = function ($section) {
        this._view = new BowerJsonView(this);

        this._view.initialize($section);

        DependenciesManager.onBowerJsonReloaded(this._onBowerJsonReloadedCallback.bind(this));
    };

    BowerJsonController.prototype.show = function () {
        this._isVisible = true;

        this._view.show(DependenciesManager.getBowerJson());
    };

    BowerJsonController.prototype.hide = function () {
        this._isVisible = false;

        this._view.hide();
    };

    BowerJsonController.prototype._refreshUi = function () {
        this._view.reload(DependenciesManager.getBowerJson());
    };

    BowerJsonController.prototype._onBowerJsonReloadedCallback = function () {
        if (this._panelController.isPanelActive() && this._isVisible) {
            this._refreshUi();
        }
    };

    BowerJsonController.prototype.onCreate = function () {
        var that = this;

        DependenciesManager.createBowerJson().done(function () {
            var bowerJson = DependenciesManager.getBowerJson();

            if (bowerJson) {
                DependenciesManager.open();
            }

            that._view.onBowerJsonCreated(bowerJson);
        });
    };

    BowerJsonController.prototype.onDelete = function () {
        var that = this;

        DependenciesManager.removeBowerJson().done(function () {
            that._refreshUi();
        });
    };

    BowerJsonController.prototype.onSelected = function () {
        DependenciesManager.open();
    };

    return BowerJsonController;
});
