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
/*global define, brackets */

define(function (require, exports, module) {
    "use strict";

    var StringUtils        = brackets.getModule("utils/StringUtils"),
        ProjectManager     = require("src/project/ProjectManager"),
        PackageManager     = require("src/bower/PackageManager"),
        BowerJsonManager   = require("src/project/BowerJsonManager"),
        DependenciesView   = require("src/panel/views/DependenciesView"),
        ErrorUtils         = require("src/utils/ErrorUtils"),
        NotificationDialog = require("src/dialogs/NotificationDialog"),
        Strings            = require("strings");

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
            Events = ProjectManager.Events;

        this._view = new DependenciesView(this);

        this._view.initialize($section);

        BowerJsonManager.on(BowerJsonManager.Events.BOWER_JSON_RELOADED, function () {
            that._onBowerJsonReloadedCallback();
        });

        ProjectManager.on(Events.DEPENDENCIES_ADDED, function () {
            if (that._isPanelActive()) {
                that.loadProjectPackages();
            }
        });

        ProjectManager.on(Events.DEPENDENCY_UPDATED, function () {
            if (that._isPanelActive()) {
                that.loadProjectPackages();
            }
        });

        ProjectManager.on(Events.DEPENDENCIES_REMOVED, function (event, packages) {
            if (that._isPanelActive()) {
                packages.forEach(function (pkg) {
                    if (pkg.isProjectDependency) {
                        that._view.onDependecyRemoved(pkg.name);
                    }
                });
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
        var data = ProjectManager.getProjectDependencies();

        this._refreshPackagesUi(data);
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

    /**
     * Uninstall the selected package.
     * @param {string} name
     * @param {boolean=} force
     */
    DependenciesController.prototype.uninstall = function (name, force) {
        var that = this;

        if (typeof force !== "boolean") {
            force = false;
        }

        PackageManager.uninstall(name, force).fail(function (error) {
            that._onUninstallFailed(name, error);
        });
    };

    /**
     * @private
     */
    DependenciesController.prototype._onUninstallFailed = function (name, error) {
        var that = this;

        if (error.code === ErrorUtils.CONFLICT) {
            var dependants = error.dependants,
                dataList = [],
                dialog;

            dependants.forEach(function (name) {
                dataList.push("# " + name);
            });

            var options = {
                summary: StringUtils.format(Strings.SUMMARY_ERROR_UNINSTALLING_DEPENDANTS, name),
                highlight: dataList.join("\n"),
                note: Strings.NOTE_QUESTION_CONTINUE_UNINSTALLING
            };

            dialog = NotificationDialog.showOkCancel(Strings.TITLE_ERROR_UNINSTALLING, options);

            dialog.done(function (buttonId) {
                if (buttonId === NotificationDialog.BTN_OK) {
                    // force uninstalling
                    that.uninstall(name, true);
                }
            });
        }
    };

    /**
     * Update the selected package.
     */
    DependenciesController.prototype.update = function (name) {
        PackageManager.update(name).fail(function (error) {
            NotificationDialog.showError(error.message);
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
