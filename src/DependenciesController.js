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
 * LIABILITY, WHETHER IN AN ACTIONre OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 *
 */


/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4,
maxerr: 50, browser: true */

define(function (require, exports, module) {
    "use strict";

    var PackageManager   = require("src/bower/PackageManager"),
        BowerJsonManager = require("src/bower/BowerJsonManager"),
        DependenciesView = require("src/views/DependenciesView");

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
        var that = this,
            BowerJsonEvents = BowerJsonManager.Events,
            PackageManagerEvents = PackageManager.Events;

        this._view = new DependenciesView(this);

        this._view.initialize($section);

        BowerJsonManager.on(BowerJsonEvents.BOWER_JSON_RELOADED, function () {
            that._onBowerJsonReloadedCallback();
        });

        PackageManager.on(PackageManagerEvents.CMD_INSTALL_BOWER_JSON_READY, function () {
            if (that._isPanelActive()) {
                that.loadProjectPackages();
            }
        });

        PackageManager.on(PackageManagerEvents.CMD_PRUNE_READY, function () {
            if (that._isPanelActive()) {
                that.loadProjectPackages();
            }
        });
    };

    /**
     * Show the Dependencies panel view. Get the installed packages for the current project
     * and the bower.json file if it exists. Then show the view.
     */
    DependenciesController.prototype.show = function () {
        this._isVisible = true;

        this._view.show(BowerJsonManager.getBowerJson());
    };

    /**
     * Hide the Dependencies panel view.
     */
    DependenciesController.prototype.hide = function () {
        this._isVisible = false;

        this._view.hide();
    };

    DependenciesController.prototype.loadProjectPackages = function () {
        var that = this,
            data = null;

        PackageManager.getInstalledDependencies()
            .done(function (dependencies) {
                data = dependencies;
            })
            .always(function () {
                that._refreshPackagesUi(data);
            });
    };

    /**
     * Create the bower.json file.
     */
    DependenciesController.prototype.createBowerJson = function () {
        var that = this;

        BowerJsonManager.createBowerJson().done(function () {
            var bowerJson = BowerJsonManager.getBowerJson();

            that._view.onBowerJsonCreated(bowerJson);
        });
    };

    /**
     * Delete the bower.json file.
     */
    DependenciesController.prototype.deleteBowerJson = function () {
        BowerJsonManager.removeBowerJson().done(this._refreshBowerJsonUi.bind(this));
    };

    /**
     * Open the current bower.json file in the editor.
     */
    DependenciesController.prototype.openBowerJson = function () {
        BowerJsonManager.open();
    };

    DependenciesController.prototype.uninstall = function (name) {
        var that = this;

        PackageManager.uninstall(name).then(function () {
            that._view.onDependecyRemoved(name);
        }).fail(function (error) {
            // TODO warn the user
            console.log(error);
        });
    };

    /**
     * Callback for when the bower.json file is created or deleted.
     */
    DependenciesController.prototype._onBowerJsonReloadedCallback = function () {
        if (this._isPanelActive()) {
            this._refreshBowerJsonUi();
        }
    };

    /**
     * @private
     */
    DependenciesController.prototype._refreshBowerJsonUi = function () {
        this._view.reloadBowerJson(BowerJsonManager.getBowerJson());
    };

    /**
     * @private
     * @param {Array} packages
     */
    DependenciesController.prototype._refreshPackagesUi = function (packages) {
        this._view.reloadPackages(packages);
    };

    /**
     * Checks if the current panel is the active one and it is visible.
     * @private
     */
    DependenciesController.prototype._isPanelActive = function () {
        return (this._panelController.isPanelActive() && this._isVisible);
    };

    module.exports = DependenciesController;
});
