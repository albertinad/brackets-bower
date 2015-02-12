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
/*global $, define */

define(function (require, exports, module) {
    "use strict";

    var templateHtml = require("text!../../templates/status-bar.html");

    /**
     * StatusBar view constructor function.
     * @param {StatusBarController} controller StatusBarController instance.
     * @constructor
     */
    function StatusBarView(controller) {
        /** @private */
        this._controller = controller;
        /** @private */
        this._$statusInfo = null;
        /** @private */
        this._$statusBar = null;
        /** @private */
        this._$infoSection = null;
        /** @private */
        this._$progressSection = null;
        /** @private */
        this._$progressInfo = null;
        /** @private */
        this._progressCount = 0;
    }

    /**
     * Initializes the status bar view.
     */
    StatusBarView.prototype.initialize = function () {
        this._$statusInfo = $("#status-info");
        this._$statusBar = $(templateHtml);

        this._$statusInfo.append(this._$statusBar);
        this._$infoSection = this._$statusBar.find(".status-information");
        this._$progressSection = this._$statusBar.find(".status-progress");
        this._$progressInfo = this._$progressSection.find(".info");
    };

    /**
     * Add a new status to the status bar view. The status is inserted into the DOM in the section
     * according to the status type: progress or information.
     * @param {number} id Id of the status to add.
     * @param {Status} status The recently created status to display in the status bar view.
     * @private
     */
    StatusBarView.prototype._addStatus = function (id, status) {
        var statusHtml = "<span class='status' data-bower-status-id='" + id + "'>" + status.Text + "</span>",
            statusType = this._controller.statusTypes();

        if(status.Type === statusType.INFO) {
            this._$infoSection.append(statusHtml);
        } else {
            this._$progressInfo.append(statusHtml);
            this._progressCount += 1;
            this._toggleProgressSectionIfNeeded();
        }
    };

    /**
     * Update the status being displayed.
     * @param {number} id Id of the status that was updated.
     * @param {Status} newStatus The updated status instance.
     * @param {Status} oldStatus The status instance previous to be modified.
     * @private
     */
    StatusBarView.prototype._updateStatus = function (id, newStatus, oldStatus) {
        var $statusEntry = this._$statusBar.find("[data-bower-status-id='" + id + "']"),
            statusTypes;

        $statusEntry.text(newStatus.Text);

        if (newStatus.Type !== oldStatus.Type) {
            statusTypes = this._controller.statusTypes();

            if (newStatus.Type === statusTypes.INFO) {
                this._$infoSection.append($statusEntry);
                this._progressCount -= 1;
            } else {
                this._$progressInfo.append($statusEntry);
                this._progressCount += 1;
            }

            this._toggleProgressSectionIfNeeded();
        }
    };

    /**
     * Delete the status from the DOM.
     * @param {number} id The id of the status to remove.
     * @private
     */
    StatusBarView.prototype._removeStatus = function (id, status) {
        var $statusEntry = this._$statusBar.find("[data-bower-status-id='" + id + "']");

        function remove() {
            $statusEntry.remove();

            /*jshint validthis:true */
            var statusTypes = this._controller.statusTypes();

            if (status.Type === statusTypes.PROGRESS) {
                /*jshint validthis:true */
                this._progressCount -= 1;
                /*jshint validthis:true */
                this._toggleProgressSectionIfNeeded();
            }
        }

        if ($statusEntry) {
            window.setTimeout(remove.bind(this), 2000);
        }
    };

    /**
     * Show or hide the status bar progress section when it has status for the PROGRESS type
     * to be displayed or it doesn't have status to display.
     * @private
     */
    StatusBarView.prototype._toggleProgressSectionIfNeeded = function () {
        var hideClass = "hide",
            hasClass = this._$progressSection.hasClass(hideClass);

        if(this._progressCount === 0) {
            if(!hasClass) {
                this._$progressSection.addClass(hideClass);
            }
        } else {
            if(hasClass) {
                this._$progressSection.removeClass(hideClass);
            }
        }
    };

    // controller interface

    /**
     * Controller interface: the view is notified when a new status is posted.
     * @param {number} id The id of the status to add.
     * @param {Status} status The status instance.
     */
    StatusBarView.prototype.onStatusAdded = function (id, status) {
        this._addStatus(id, status);
    };

    /**
     * Controller interface: the view is notified when a status is updated.
     * @param {number} id The id of the status updated.
     * @param {Status} newStatus The updated status instance.
     * @param {Status} oldStatus The status intsance previous to be modified.
     */
    StatusBarView.prototype.onStatusUpdated = function (id, newStatus, oldStatus) {
        this._updateStatus(id, newStatus, oldStatus);
    };

    /**
     * Controller interface: the view is notified when a status is deleted.
     * @param {number} id The id of the status that was deleted.
     */
    StatusBarView.prototype.onStatusRemoved = function (id, status) {
        this._removeStatus(id, status);
    };

    // tests API

    StatusBarView.prototype.progressStatusCount = function () {
        return this._progressCount;
    };

    StatusBarView.prototype.hasActiveProgressStatus = function () {
        return this._$progressInfo[0].hasChildNodes();
    };

    StatusBarView.prototype.hasActiveInfoStatus = function () {
        return this._$infoSection[0].hasChildNodes();
    };

    return StatusBarView;
});
