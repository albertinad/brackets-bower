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
     * @param{number} id
     * @param{string} text
     * @param{number} type
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
     * StatusBar controller.
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

    StatusBarController.prototype.initialize = function () {
        this._view = new StatusBarView(this);
        this._view.initialize();
    };

    StatusBarController.prototype.post = function (text, progress) {
        var id = this._nextId(),
            type = (progress) ? Status.type.PROGRESS : Status.type.INFO,
            status = new Status(id, text, type);

        this._statusMap[id] = status;
        this._statusCount += 1;

        this._notifyStatusAdded(id, status);

        return id;
    };

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

    StatusBarController.prototype.remove = function (statusId) {
        var status = this._statusMap[statusId];

        if (status) {
            delete this._statusMap[statusId];
            this._statusCount -= 1;

            this._notifyStatusRemoved(statusId);
        }
    };

    StatusBarController.prototype.statusTypes = function () {
        return Status.type;
    };

    StatusBarController.prototype._notifyStatusAdded = function (id, status) {
        this._view.onStatusAdded(id, status);
    };

    StatusBarController.prototype._notifyStatusUpdated = function (id, newStatus, oldStatus) {
        this._view.onStatusUpdated(id, newStatus, oldStatus);
    };

    StatusBarController.prototype._notifyStatusRemoved = function (id) {
        this._view.onStatusRemoved(id);
    };

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
