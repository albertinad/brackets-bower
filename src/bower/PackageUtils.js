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
/*global define */

define(function (require, exports, module) {
    "use strict";

    var DependencyType = {
        DEVELOPMENT: 0,
        PRODUCTION: 1,
        UNKNOWN: 2
    };

    var VersionOptions = {
        TILDE: 0,
        CARET: 1,
        FIXED: 2
    };

    var Status = {
        INSTALLED: 0,
        MISSING: 1,
        NOT_TRACKED: 2
    };

    var TILDE = "~",
        CARET = "^";

    /**
     * @param {number} type
     * @return {boolean}
     */
    function isValidDependencyType(type) {
        return (type === DependencyType.DEVELOPMENT || type === DependencyType.PRODUCTION);
    }

    /**
     * @param {number} type
     * @return {boolean}
     */
    function isValidVersion(version) {
        return (version === VersionOptions.TILDE || version === VersionOptions.CARET ||
                version === VersionOptions.FIXED);
    }

    /**
     * @param {number} type
     * @return {boolean}
     */
    function isValidStatus(status) {
        return (status === Status.INSTALLED || status === Status.MISSING ||
                status === Status.NOT_TRACKED);
    }

    /**
     * @param {string} version
     * @param {number} type
     * @private
     */
    function getVersion(version, type) {
        var fullVersion;

        if (version && (version.trim() !== "")) {
            switch (type) {
            case VersionOptions.TILDE:
                fullVersion = TILDE + version;
                break;
            case VersionOptions.CARET:
                fullVersion = CARET + version;
                break;
            default:
                fullVersion = version;
            }
        }

        return fullVersion;
    }

    /**
     * Get the default semver version for the given version.
     * @param {string} version
     * @return {string}
     */
    function getDefaultSemverVersion(version) {
        var semverVersion;

        if (version) {
            semverVersion = getVersion(version, VersionOptions.TILDE);
        } else {
            semverVersion = "*";
        }

        return semverVersion;
    }

    /**
     * @param {string} name
     * @param {string} version
     * @param {number} type
     * @return {string} packageName
     * @private
     */
    function getPackageVersionToInstall(name, version, type) {
        // prepare package name with version if any
        var packageVersion = getVersion(version, type),
            packageName = name;

        if (version) {
            packageName += "#" + packageVersion;
        }

        return packageName;
    }

    /**
     * @param {Package} pkg
     * @param {object} data Values to update the package properties.
     *      version {string|null}: Version to update to. If empty, it will update it to the latest version.
     *      versionType {number}: The version type to use, following semver conventions.
     *      type {number}: update the package type: dependency or devDependency.
     * @private
     */
    function getUpdateDataForPackage(pkg, data) {
        var updateData,
            updateVersion,
            dependencyType;

        if (!data) {
            data = {};
        }

        dependencyType = data.type;

        function addToUpdateData(dataKey, value) {
            if (!updateData) {
                updateData = {};
            }

            updateData[dataKey] = value;
        }

        updateVersion = getVersion(data.version, data.versionType);

        if (!updateVersion && pkg.latestVersion) {
            // if any specific version was requested, update to the latest available version
            updateVersion = TILDE + pkg.latestVersion;
        }

        // version
        if (updateVersion && (pkg.version !== updateVersion)) {
            addToUpdateData("version", updateVersion);
        }

        // dependency type
        if (isValidDependencyType(dependencyType) && pkg.dependencyType !== dependencyType) {
            addToUpdateData("dependencyType", dependencyType);
        }

        return updateData;
    }

    /**
     * @param {object} data
     * @private
     */
    function getInstallOptions(data) {
        var options = {};

        // prepare default values when needed
        if (typeof data.type !== "number") {
            data.type = DependencyType.PRODUCTION;
        }

        if (typeof data.save !== "boolean") {
            data.save = false;
        }

        // setup options
        if (data.type === DependencyType.PRODUCTION) {
            options.save = data.save;
        } else {
            options.saveDev = data.save;
        }

        return options;
    }

    exports.getVersion                 = getVersion;
    exports.getDefaultSemverVersion    = getDefaultSemverVersion;
    exports.getPackageVersionToInstall = getPackageVersionToInstall;
    exports.getInstallOptions          = getInstallOptions;
    exports.getUpdateDataForPackage    = getUpdateDataForPackage;
    exports.isValidDependencyType      = isValidDependencyType;
    exports.isValidVersion             = isValidVersion;
    exports.isValidStatus              = isValidStatus;
    exports.DependencyType             = DependencyType;
    exports.VersionOptions             = VersionOptions;
    exports.Status                     = Status;
});
