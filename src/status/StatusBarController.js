/*
 * Copyright (c) 2013 Narciso Jaramillo. All rights reserved.
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
/*global define, brackets */

define(function (require, exports) {
    "use strict";

    var AppInit       = brackets.getModule("utils/AppInit"),
        StatusBarView = require("src/status/StatusBarView");

    /**
     * Status model.
     * @param{number} id Id of the status.
     * @param{string} text Message of the status.
     * @param{number} type Type of the status, it can be one of the following values:
     * Status.type.INFO for information type of status and Status.type.PROGRESS for
     * progress type of status.
     * @constructor
     */
    function Status(id, text, type) {
        /** @private */
        this._id = id;
        /** @private */
        this._text = text;
        /** @private */
        this._type = type;
    }

    Status.type = {
        INFO: 0,
        PROGRESS: 1
    };

    Object.defineProperty(Status.prototype, "Id", {
        get: function () {
            return this._id;
        }
    });

    Object.defineProperty(Status.prototype, "Text", {
        get: function () {
            return this._text;
        },
        set: function (text) {
            this._text = text;
        }
    });

    Object.defineProperty(Status.prototype, "Type", {
        get: function () {
            return this._type;
        },
        set: function (type) {
            this._type = type;
        }
    });

    /**
     * StatusBar controller. Enables the panels and components to display status on the status bar
     * defined for bower.
     * @constructor
     */
    function StatusBarController() {
        /** @private */
        this._view = null;
        /** @private */
        this._statusMap = {};
        /** @private */
        this._statusCount = 0;
        /** @private */
        this._id = 0;
    }

    /**
     * Initialize the status bar controller, creates the view and also initializes it.
     */
    StatusBarController.prototype.initialize = function () {
        this._view = new StatusBarView(this);
        this._view.initialize();
    };

    /**
     * Post a new status on the status bar. A status instance is created with the given
     * text and progress type, after the creation, it is displayed on the status bar.
     * @param {string} text Message to show as the status text.
     * @param {number} progress Status progress type. Can be one of the following values:
     *                 Status.type.PROGRESS or Status.type.INFO.
     * @return {number} id Id for the new status created that is being displayed on the status bar.
     */
    StatusBarController.prototype.post = function (text, progress) {
        var id = this._nextId(),
            type = (progress) ? Status.type.PROGRESS : Status.type.INFO,
            status = new Status(id, text, type);

        this._statusMap[id] = status;
        this._statusCount += 1;

        this._notifyStatusAdded(id, status);

        return id;
    };

    /**
     * Update the text and/or progress for the current status displayed that has the id passed through
     * parameters.
     * @param {number} statusId The id of the status to modify.
     * @param {string} text The new message to update to the status.
     * @param {number} progress progress Status progress type. Can be one of the following values:
     *                 Status.type.PROGRESS or Status.type.INFO.
     */
    StatusBarController.prototype.update = function (statusId, text, progress) {
        var status = this._statusMap[statusId],
            oldStatus;

        if (status) {
            oldStatus = new Status(status.Id, status.Text, status.Type);

            status.Text = text;
            status.Type = (progress) ? Status.type.PROGRESS : Status.type.INFO;

            this._notifyStatusUpdated(statusId, status, oldStatus);
        }
    };

    /**
     * Delete the status from the status bar by the id passed through paremeters.
     * @param {number} statusId The id of the status to remove.
     */
    StatusBarController.prototype.remove = function (statusId) {
        var status = this._statusMap[statusId];

        if (status) {
            delete this._statusMap[statusId];
            this._statusCount -= 1;

            this._notifyStatusRemoved(statusId);
        }
    };

    /**
     * Get the available status type.
     * @return {Object}
     */
    StatusBarController.prototype.statusTypes = function () {
        return Status.type;
    };

    /**
     * Notify to the view that a new status is added.
     * @param {id} id The id of the recently created status.
     * @param {Status} status The Status instance created.
     * @private
     */
    StatusBarController.prototype._notifyStatusAdded = function (id, status) {
        this._view.onStatusAdded(id, status);
    };

    /**
     * Notify to the view that a status has changed.
     * @param {id} id The id of the status that has been updated.
     * @param {Status} newStatus Updated status.
     * @param {Status} oldStatus Status before being updated.
     * @private
     */
    StatusBarController.prototype._notifyStatusUpdated = function (id, newStatus, oldStatus) {
        this._view.onStatusUpdated(id, newStatus, oldStatus);
    };

    /**
     * Notify to the view that a status has being deleted.
     * @param {id} id The id of the status that has been deleted.
     * @private
     */
    StatusBarController.prototype._notifyStatusRemoved = function (id) {
        this._view.onStatusRemoved(id);
    };

    /**
     * Get the next id for the status.
     * @return {number} id The next available id.
     * @private
     */
    StatusBarController.prototype._nextId = function () {
        if (this._statusCount === 0) {
            this._id = 0;
        }

        this._id++;

        return this._id;
    };

    var statusBarController = new StatusBarController();

    AppInit.htmlReady(function () {
        statusBarController.initialize();
    });

    // public API

    exports.Controller = statusBarController;
});
