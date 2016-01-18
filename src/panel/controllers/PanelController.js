/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 - 2016 Intel Corporation
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4,
maxerr: 50, browser: true */
/*global brackets, define */

define(function (require, exports, module) {
    "use strict";

    var StringUtils         = brackets.getModule("utils/StringUtils"),
        CommandManager      = brackets.getModule("command/CommandManager"),
        Menus               = brackets.getModule("command/Menus"),
        PanelView           = require("src/panel/views/PanelView"),
        StatusBarController = require("src/panel/controllers/StatusBarController").Controller,
        SettingsDialog      = require("src/dialogs/SettingsDialog"),
        ProjectManager      = require("src/project/ProjectManager"),
        PackageManager      = require("src/bower/PackageManager"),
        Preferences         = require("src/preferences/Preferences"),
        ErrorUtils          = require("src/utils/ErrorUtils"),
        Strings             = require("strings");

    var CMD_PANEL = ".togglePanel";

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
        /** @private */
        this._cmdPanel = null;
    }

    PanelController.STATUS_WARNING = PanelView.StatusStyles.WARNING;

    /**
     * Initialize the main controller. Instantiate the panel view and initializes the
     * registered controllers for the panels section. Check the saved state for the extension,
     * if it was opened before closing brackets, it will be displayed.
     * @param {string} extensionName Name of the extension.
     */
    PanelController.prototype.initialize = function (extensionName, controllers) {
        var Events = ProjectManager.Events;

        this._view = new PanelView(this);

        this._view.initialize(extensionName);

        var $section = this._view.getPanelSection(),
            cmdName = extensionName + CMD_PANEL,
            viewMenu = Menus.getMenu(Menus.AppMenuBar.VIEW_MENU),
            key,
            controllerData,
            ConstructorFn,
            controllerInstance;

        // add menu entry to toggle panel
        this._cmdPanel = CommandManager.register(Strings.TITLE_BOWER, cmdName, this.toggle.bind(this));

        viewMenu.addMenuItem(this._cmdPanel);

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
        ProjectManager.on(Events.ACTIVE_DIR_CHANGED, this._onActiveDirChanged.bind(this));
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

        this._cmdPanel.setChecked(this._isActive);

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
    PanelController.prototype.updateStatus = function (status, projectStatus) {
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
            commandFn = PackageManager.install;
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
                ErrorUtils.handleError(error);
            }

        }).always(function () {

            StatusBarController.update(statusId, resultMessage, false);
            StatusBarController.remove(statusId);

            that._view.onCommandExecuted();
        });
    };

    /**
     * @param {string} option
     */
    PanelController.prototype.syncProject = function (option) {
        var that = this,
            syncOption;

        if (option === "file") {
            syncOption = ProjectManager.SyncOptions.MATCH_BOWER_JSON;
        } else {
            syncOption = ProjectManager.SyncOptions.MATCH_PROJECT_FOLDER;
        }

        var statusId = StatusBarController.post(Strings.SYNC_PROJECT_MESSAGE, true);

        ProjectManager.synchronizeProject(syncOption).then(function () {

            StatusBarController.update(statusId, Strings.SYNC_PROJECT_SUCCESS_MESSAGE, false);
        }).fail(function (error) {

            that._view.syncFailed();

            if (error) {
                ErrorUtils.handleError(error);
            }
        }).always(function () {

            StatusBarController.remove(statusId);
        });
    };

    /**
     * @private
     */
    PanelController.prototype._onProjectStatusChanged = function (event, projectStatus) {
        this._view.projectStatusChanged(projectStatus);
    };

    /**
     * @private
     */
    PanelController.prototype._onActiveDirChanged = function (event, fullPath, shortPath) {
        var projectStatus = ProjectManager.getProjectStatus();

        this._view.onActiveDirChanged(shortPath);
        this._view.projectStatusChanged(projectStatus);
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
