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

define(function (require, exports, module) {
    "use strict";

    var DependenciesManager = require("src/bower/DependenciesManager"),
        Bower               = require("src/bower/Bower"),
        DependenciesView    = require("src/views/DependenciesView");

    /**
     * @constructor
     * @param{PanelController} controller Main application controller.
     */
    function DependenciesController(controller) {
        /** @private */
        this._panelController = controller;
        /** @private */
        this._view = null;
        /** @private */
        this._isVisible = false;
    }

    DependenciesController.prototype.initialize = function ($section) {
        this._view = new DependenciesView(this);

        this._view.initialize($section);
    };

    DependenciesController.prototype.show = function () {
        this._isVisible = true;

        this._view.show();
    };

    DependenciesController.prototype.hide = function () {
        this._isVisible = false;

        this._view.hide();
    };

    DependenciesController.prototype._refreshUi = function (dependencies) {
        this._view.reload(dependencies);
    };

    DependenciesController.prototype.onLoad = function () {
        var data = {};

        DependenciesManager.getDependencies()
            .done(function (file) {
                data.dependencies = file;
            })
            .always(function () {
                that._refreshUi(data);
            });
    };

    DependenciesController.prototype.onUninstall = function (name) {
        // TODO encapsulate in depsmanager
        var path = DependenciesManager.findBowerJsonLocation(),
            that = this;

        Bower.uninstall(path, name).then(function () {
            return DependenciesManager.getDependencies()
        }).done(function (file) {
            that._refreshUi({ dependencies: file });
        }).fail(function (error) {
            // TODO warn the user
            console.log('error unistall');
            console.log(error);
        });
    };

    module.exports = DependenciesController;
});
