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
/*global brackets, define */

define(function (require, exports, module) {
    "use strict";

    var StringUtils         = brackets.getModule("utils/StringUtils"),
        PanelView           = require("src/panel/views/PanelView"),
        StatusBarController = require("src/panel/controllers/StatusBarController").Controller,
        SettingsDialog      = require("src/dialogs/SettingsDialog"),
        ProjectManager      = require("src/project/ProjectManager"),
        PackageManager      = require("src/bower/PackageManager"),
        Preferences         = require("src/preferences/Preferences"),
        NotificationDialog  = require("src/dialogs/NotificationDialog"),
        ErrorUtils          = require("src/utils/ErrorUtils"),
        Strings             = require("strings");

    /**
     * PanelController constructor. Main controller for the bower extension view.
     * @constructor
     */
    function PanelController() {
        /** @private */
        this._view = null;
        /** @private */
        this._isActive = false;

        /** @private */
        this._panelsControllersMap = {};
        /** @private */
        this._activePanelController = null;
        /** @private */
        this._activePanelkey = null;
    }

    PanelController.STATUS_WARNING = PanelView.StatusStyles.WARNING;

    /**
     * Initialize the main controller. Instantiate the panel view and initializes the
     * registered controllers for the panels section. Check the saved state for the extension,
     * if it was opened before closing brackets, it will be displayed.
     * @param {string} extensionName Name of the extension.
     */
    PanelController.prototype.initialize = function (extensionName, controllers) {
        var that = this,
            Events = ProjectManager.Events;

        this._view = new PanelView(this);

        this._view.initialize(extensionName);

        var $section = this._view.getPanelSection(),
            key,
            controllerData,
            ConstructorFn,
            controllerInstance;

        // initializes and register the sub panels controllers
        for (key in controllers) {
            if (controllers.hasOwnProperty(key)) {
                controllerData = controllers[key];
                ConstructorFn = controllerData.constructor;

                controllerInstance = new ConstructorFn(this);
                controllerInstance.initialize($section);

                this.registerController(key, controllerInstance, controllerData.isActive);
            }
        }

        ProjectManager.on(Events.PROJECT_LOADING, this._disable.bind(this));
        ProjectManager.on(Events.PROJECT_READY, this._enable.bind(this));
        ProjectManager.on(Events.PROJECT_STATUS_CHANGED, this._onProjectStatusChanged.bind(this));

        ProjectManager.on(Events.ACTIVE_DIR_CHANGED, function (event, fullPath, shortPath) {
            that._view.onActiveDirChanged(shortPath);
        });
    };

    PanelController.prototype.showIfNeeded = function () {
        if (Preferences.get(Preferences.settings.EXTENSION_VISIBLE)) {
            this.toggle();
        }
    };

    /**
     * Show or hide the main panel. Keep track of the active state and updates
     * the extension visibility key in the preferences.
     */
    PanelController.prototype.toggle = function () {
        if (this._isActive) {
            this._view.hide();
            this._activePanelController.hide();
        } else {
            this._view.show();
            this._view.selectPanelButton(this._activePanelkey);
            this._activePanelController.show();
        }

        this._isActive = !this._isActive;

        Preferences.set(Preferences.settings.EXTENSION_VISIBLE, this._isActive);
    };

    /**
     * Callback for when a sub panel is selected. If the panel selected is not the current active
     * panel, hides the current active panel, select the new one and updates the view.
     * It store the current active panel in a variable to keep track of the current active sub panel.
     * @param{string} key The selected panel key.
     */
    PanelController.prototype.panelSelected = function (key) {
        // validate if the panel to show is the current active one
        if (this._activePanelkey === key) {
            return;
        }

        this._activePanelController.hide();

        this._activePanelController = this._getPanelControllerByKey(key);

        this._view.selectPanelButton(key);

        this._activePanelkey = key;

        this._activePanelController.show();
    };

    /**
     * Check the current state of the main panel. It returns "true" if the panel is active,
     * otherwise, it returns "false".
     * @return {boolean} isActive
     */
    PanelController.prototype.isPanelActive = function () {
        return this._isActive;
    };

    /**
     * Display the settings dialog.
     */
    PanelController.prototype.showExtensionSettings = function () {
        SettingsDialog.show();
    };

    /**
     * Set the status to warning status type.
     * @param {string} status
     */
    PanelController.prototype.updateStatus = function (status) {
        this._view.updateIconStatus(status);
    };

    /**
     * Register the controller for the sub panel view in a key-value map.
     * The main panel controller manages all the controllers for the sub panels.
     * @param{string} key The unique identifier for the controller to register.
     * @param{Function} controller The constructor function of the controller to register.
     * @param{boolean=} isDefault Boolean to indicate if the current sub panel controller
     * to register is the default active panel.
     */
    PanelController.prototype.registerController = function (key, controller, isDefault) {
        this._panelsControllersMap[key] = controller;

        if (isDefault) {
            this._activePanelkey = key;
            this._activePanelController = controller;
        }
    };

    /**
     * Execute the bower command by the given key. Notifies the view when the
     * command has finished executing.
     * @param {string} commandKey The key of the bower command to execute.
     */
    PanelController.prototype.executeCommand = function (commandKey) {
        var that = this,
            commandFn,
            resultMessage;

        if (commandKey === "install") {
            commandFn = PackageManager.installFromBowerJson;
            resultMessage = Strings.STATUS_SUCCESS_INSTALLING;
        } else {
            commandFn = PackageManager.prune;
            resultMessage = StringUtils.format(Strings.STATUS_SUCCESS_EXECUTING_COMMAND, commandKey);
        }

        var statusId = StatusBarController.post(StringUtils.format(Strings.STATUS_EXECUTING_COMMAND, commandKey), true);

        commandFn().then(function (result) {

            if (!result) {
                resultMessage = Strings.STATUS_NO_PACKAGES_INSTALLED;
            }

        }).fail(function (error) {

            if (error.code === ErrorUtils.NO_BOWER_JSON) {
                resultMessage = StringUtils.format(Strings.STATUS_ERROR_EXECUTING_COMMAND, commandKey);
            } else {
                NotificationDialog.showError(error.message);
            }

        }).always(function () {

            StatusBarController.update(statusId, resultMessage, false);
            StatusBarController.remove(statusId);

            that._view.onCommandExecuted();
        });
    };

    /**
     * @private
     */
    PanelController.prototype._onProjectStatusChanged = function () {
        var project = ProjectManager.getProject(),
            projectStatus,
            statusType,
            StatusStyles;

        if (project) {
            StatusStyles = PanelView.StatusStyles;
            projectStatus = project.getStatus();

            if (projectStatus.isSynced()) {
                statusType = StatusStyles.DEFAULT;
            } else {
                statusType = StatusStyles.WARNING;
            }

            this.updateStatus(statusType);
        }
    };

    /**
     * @private
     */
    PanelController.prototype._enable = function () {
        this._view.enable();
    };

    /**
     * @private
     */
    PanelController.prototype._disable = function () {
        this._view.disable();

        // clean up previews states
        this.updateStatus(PanelView.StatusStyles.DEFAULT);
    };

    /**
     * Get the panel controller by the given key.
     * @param{string} key The key of the sub panel controller registered.
     * @private
     */
    PanelController.prototype._getPanelControllerByKey = function (key) {
        var controller = this._panelsControllersMap[key];

        if (!controller) {
            throw "Controller with the key '" + key + "' is not registered.";
        }

        return controller;
    };

    module.exports = PanelController;
});
