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
/*global define, brackets */

define(function (require, exports, module) {
    "use strict";

    var _ = brackets.getModule("thirdparty/lodash");

    /**
     * @param {BowerProject} bowerProject
     * @constructor
     */
    function ProjectStatus(bowerProject) {
        /** @private */
        this._bowerProject = bowerProject;
        /** @private */
        this._status = ProjectStatus.Status.UNKNOWN;
    }

    /**
     * @const
     */
    ProjectStatus.Status = {
        SYNCED: 0,
        OUT_OF_SYNC: 1,
        UNKNOWN: 2
    };

    /**
     * Get the current bower project status.
     * @return {number}
     */
    ProjectStatus.prototype.status = function () {
        /** @private */
        return this._status;
    };

    /**
     * @return {boolean}
     */
    ProjectStatus.prototype.isSynced = function () {
        return (this._status === ProjectStatus.Status.SYNCED);
    };

    /**
     * @return {boolean}
     */
    ProjectStatus.prototype.isOutOfSync = function () {
        return (this._status === ProjectStatus.Status.OUT_OF_SYNC);
    };

    /**
     * @return {boolean}
     */
    ProjectStatus.prototype.isUnknown = function () {
        return (this._status === ProjectStatus.Status.UNKNOWN);
    };

    /**
     * @private
     */
    ProjectStatus.prototype.checkCurrentStatus = function () {
        var hasMissingPkgs = this._bowerProject.hasNotInstalledPackages(),
            hasExtraPkgs = this._bowerProject.hasExtraneousPackages(),
            versionsOutOfSync = this._bowerProject.hasPackagesVersionOutOfSync(),
            currentStatus;

        if (hasMissingPkgs || hasExtraPkgs || versionsOutOfSync) {
            currentStatus = ProjectStatus.Status.OUT_OF_SYNC;
        } else {
            currentStatus = ProjectStatus.Status.SYNCED;
        }

        this._udpateStatusIfNeeded(currentStatus);
    };

    /**
     * @return {object}
     */
    ProjectStatus.prototype.getStatusSummary = function () {
        var packages = this._bowerProject.getPackages(),
            missing,
            untracked,
            versionOutOfSync,
            status;

        _.forEach(packages, function (pkg) {
            if (pkg.isNotTracked()) {

                untracked.push(pkg);
            } else if (pkg.isMissing()) {

                missing.push(pkg);
            } else if (!pkg.isVersionInSync()) {

                versionOutOfSync.push(pkg);
            }
        });

        if (untracked.length !== 0 || missing.length !== 0 || versionOutOfSync.length !== 0) {
            status = ProjectStatus.Status.OUT_OF_SYNC;
        } else {
            status = ProjectStatus.Status.SYNCED;
        }

        this._udpateStatusIfNeeded(status);

        var result = {
            status: this._status,
            untracked: untracked,
            missing: missing,
            versionOutOfSync: versionOutOfSync
        };

        return result;
    };

    /**
     * Check if the status has changed and notify.
     * @privates
     */
    ProjectStatus.prototype._udpateStatusIfNeeded = function (newStatus) {
        if (this._status !== newStatus) {
            this._status = newStatus;

            this._notifyStatusChanged();
        }
    };

    /**
     * Notify that the current status has changed.
     * @private
     */
    ProjectStatus.prototype._notifyStatusChanged = function () {
        this._bowerProject.onStatusChanged(this._status);
    };

    module.exports = ProjectStatus;
});
