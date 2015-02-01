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
/*global $, define, brackets */

define(function (require, exports) {
    "use strict";

    var templateHtml = require("text!../../templates/status-bar.html");

    /**
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

    StatusBarView.prototype.initialize = function () {
        this._$statusInfo = $("#status-info");
        this._$statusBar = $(templateHtml);

        this._$statusInfo.append(this._$statusBar);
        this._$infoSection = this._$statusBar.find(".status-information");
        this._$progressSection = this._$statusBar.find(".status-progress");
        this._$progressInfo = this._$progressSection.find(".info");
    };

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

    StatusBarView.prototype._updateStatus = function (id, newStatus, oldStatus) {
        var $statusEntry = this._$statusBar.find("[data-bower-status-id='" + id + "']"),
            statusTypes;

        $statusEntry.text(newStatus.Text);

        if (newStatus.Type !== oldStatus.Type) {
            statusTypes = this._controller.statusTypes();

            if (newStatus.Type === statusTypes.INFO) {
                this._$infoSection.append($statusEntry);
            } else {
                this._$progressInfo.append($statusEntry);
                this._progressCount += 1;
                this._toggleProgressSectionIfNeeded();
            }
        }
    };

    StatusBarView.prototype._removeStatus = function (id, status) {
        var $statusEntry = this._$statusBar.find("[data-bower-status-id='" + id + "']");

        function remove() {
            $statusEntry.remove();
        }

        if ($statusEntry) {
            this._progressCount -= 1;
            this._toggleProgressSectionIfNeeded();

            window.setTimeout(remove.bind(this), 3000);
        }
    };

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

    StatusBarView.prototype.onStatusAdded = function (id, status) {
        this._addStatus(id, status);
    };

    StatusBarView.prototype.onStatusUpdated = function (id, newStatus, oldStatus) {
        this._updateStatus(id, newStatus, oldStatus);
    };

    StatusBarView.prototype.onStatusRemoved = function (id) {
        this._removeStatus(id);
    };

    return StatusBarView;
});
