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
/*global define, $, brackets */

define(function (require, exports, module) {
    "use strict";

    var _                = brackets.getModule("thirdparty/lodash"),
        BowerJsonManager = require("src/bower/BowerJsonManager");

    /**
     * Constructor function for Bower package instances.
     * @param {string} name
     * @constructor
     */
    function Package(name) {
        /** @private */
        this._name = name;
        /** @private */
        this._version = null;
        /** @private */
        this._latestVersion = null;
        /** @private */
        this._extraneous = false;
        /** @private */
        this._isInstalled = true;
        /** @private */
        this._isDevDependency = false;
    }

    Object.defineProperty(Package.prototype, "name", {
        get: function () {
            return this._name;
        }
    });

    Object.defineProperty(Package.prototype, "version", {
        set: function (version) {
            this._version = version;
        },
        get: function () {
            return this._version;
        }
    });

    Object.defineProperty(Package.prototype, "latestVersion", {
        set: function (latestVersion) {
            this._latestVersion = latestVersion;
        },
        get: function () {
            return this._latestVersion;
        }
    });

    Object.defineProperty(Package.prototype, "extraneous", {
        set: function (extraneous) {
            this._extraneous = extraneous;
        },
        get: function () {
            return this._extraneous;
        }
    });

    Object.defineProperty(Package.prototype, "isInstalled", {
        set: function (isInstalled) {
            this._isInstalled = isInstalled;
        },
        get: function () {
            return this._isInstalled;
        }
    });

    Object.defineProperty(Package.prototype, "isDevDependency", {
        set: function (isDevDependency) {
            this._isDevDependency = isDevDependency;
        },
        get: function () {
            return this._isDevDependency;
        }
    });

    /**
     * Create package from raw data.
     * @param {string} name
     * @param {object} data
     * @param {object=} bowerJsonDeps
     * @return {Package} pkg
     */
    Package.fromRawData = function (name, data, bowerJsonDeps) {
        var pkg = new Package(name),
            meta = data.pkgMeta;

        if (meta && meta.version !== undefined) {
            pkg.version = meta.version;
        }

        if (data.update && data.update.latest) {
            pkg.latestVersion = data.update.latest;
        }

        if (data.missing) {
            pkg.isInstalled = false;
        }

        if (data.extraneous) {
            pkg.extraneous = true;
        }

        if (bowerJsonDeps && bowerJsonDeps.devDependencies &&
                bowerJsonDeps.devDependencies[name]) {
            pkg.isDevDependency = true;
        }

        return pkg;
    };

    /**
     * Check if the current package version has latest versions.
     * @return {boolean} isLatest True if it has latest version, otherwhise, false.
     */
    Package.prototype.hasUpdates = function () {
        if (!this._version || !this._latestVersion) {
            return false;
        }

        var current = this._version.split("."),
            latest = this._latestVersion.split("."),
            hasLatest = false;

        current.some(function (value, index) {
            var numberValue = parseInt(value, 0),
                numberLatest = parseInt(latest[index], 0);

            hasLatest = (numberLatest > numberValue);

            return hasLatest;
        });

        return hasLatest;
    };

    /**
     * Constructor function for Bower package information instances.
     * @constructor
     */
    function PackageInfo(name, latestVersion, versions) {
        /** @private */
        this._name = name;
        /** @private */
        this._latestVersion = latestVersion;
        /** @private */
        this._versions = versions;
        /** @private */
        this._dependencies = [];
        /** @private */
        this._keywords = [];
        /** @private */
        this._homepage = "";
        /** @private */
        this._description = "";
    }

    Object.defineProperty(PackageInfo.prototype, "name", {
        get: function () {
            return this._name;
        }
    });

    Object.defineProperty(PackageInfo.prototype, "latestVersion", {
        get: function () {
            return this._latestVersion;
        }
    });

    Object.defineProperty(PackageInfo.prototype, "versions", {
        get: function () {
            return this._versions;
        }
    });

    Object.defineProperty(PackageInfo.prototype, "dependencies", {
        set: function (dependencies) {
            this._dependencies = dependencies;
        },
        get: function () {
            return this._dependencies;
        }
    });

    Object.defineProperty(PackageInfo.prototype, "keywords", {
        set: function (keywords) {
            this._keywords = keywords;
        },
        get: function () {
            return this._keywords;
        }
    });

    Object.defineProperty(PackageInfo.prototype, "homepage", {
        set: function (homepage) {
            this._homepage = homepage;
        },
        get: function () {
            return this._homepage;
        }
    });

    Object.defineProperty(PackageInfo.prototype, "description", {
        set: function (description) {
            this._description = description;
        },
        get: function () {
            return this._description;
        }
    });

    /**
     * Create an array of Package instances from the raw data given as arguments.
     * @param {object} packages
     * @return {Array}
     */
    function createPackages(packages) {
        var deferred = new $.Deferred(),
            pkgsName = Object.keys(packages),
            pkgs = [],
            deps = null;

        // get all the dependencies defined in bower.json if any
        BowerJsonManager.getDependencies().then(function (data) {

            deps = data;
        }).always(function () {

            pkgsName.forEach(function (name) {
                var pkg = Package.fromRawData(name, packages[name], deps);

                pkgs.push(pkg);
            });

            deferred.resolve(pkgs);
        });

        return deferred;
    }

    /**
     * Create an instance of Package from the raw data given as arguments.
     * @param {string} packageName
     * @param {object} rawData
     * @param {boolean} isDev
     * @return {Package}
     */
    function createPackage(packageName, rawData, isDev) {
        var pkg = Package.fromRawData(packageName, rawData);

        pkg.isDevDependency = isDev;

        return pkg;
    }

    /**
     * Create a PackageInfo instance from the raw data.
     * @param {object} infoData
     * @return {PackageInfo}
     */
    function createInfo(infoData) {
        var latest = infoData.latest,
            latestVersion = latest.version,
            pkg = new PackageInfo(infoData.name, latestVersion, infoData.versions);

        _.forEach(latest.dependencies, function (version, name) {
            pkg.dependencies.push({ name: name, version: version });
        });

        if (latest.keywords) {
            pkg.keywords = latest.keywords;
        }

        if (latest.homepage) {
            pkg.homepage = latest.homepage;
        }

        if (latest.description) {
            pkg.description = latest.description;
        }

        return pkg;
    }

    /**
     * Parse the given raw packages array and returns an array of packages names.
     * @param {array} rawPackagesArray
     * @return {array}
     */
    function getPackagesName(rawPackagesArray) {
        var names = [];

        rawPackagesArray.forEach(function (rawPackage) {
            var meta = rawPackage.pkgMeta;

            if (meta && meta.name) {
                names.push(meta.name);
            }
        });

        return names;
    }

    exports.createPackages  = createPackages;
    exports.createPackage   = createPackage;
    exports.createInfo      = createInfo;
    exports.getPackagesName = getPackagesName;
    // tests
    exports._Package        = Package;
});
