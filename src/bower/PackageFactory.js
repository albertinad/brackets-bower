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

    var _                = brackets.getModule("thirdparty/lodash"),
        BowerJsonManager = require("src/bower/BowerJsonManager"),
        PackageOptions   = require("src/bower/PackageOptions");

    var DependencyType   = PackageOptions.DependencyType;

    /**
     * Package dependency constructor function.
     * @controller
     */
    function PackageDependency(name, version, source, homepage) {
        /** @private */
        this._name = name;
        /** @private */
        this._version = version;
        /** @private */
        this._source = source;
        /** @private */
        this._homepage = homepage;
    }

    Object.defineProperty(PackageDependency.prototype, "name", {
        get: function () {
            return this._name;
        }
    });

    Object.defineProperty(PackageDependency.prototype, "version", {
        get: function () {
            return this._version;
        }
    });

    Object.defineProperty(PackageDependency.prototype, "source", {
        get: function () {
            return this._source;
        }
    });

    Object.defineProperty(PackageDependency.prototype, "homepage", {
        get: function () {
            return this._homepage;
        }
    });

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
        this._versions = [];
        /** @private */
        this._status = PackageOptions.Status.INSTALLED;
        /** @private */
        this._dependencyType = DependencyType.PRODUCTION;
        /** @private */
        this._dependencies = [];
        /** @private */
        this._description = null;
        /** @private */
        this._homepage = null;
        /** @private */
        this._source = null;
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

    Object.defineProperty(Package.prototype, "versions", {
        set: function (versions) {
            this._versions = versions;
        },
        get: function () {
            return this._versions;
        }
    });

    Object.defineProperty(Package.prototype, "status", {
        set: function (status) {
            this._status = status;
        },
        get: function () {
            return this._status;
        }
    });

    Object.defineProperty(Package.prototype, "dependencyType", {
        set: function (dependencyType) {
            this._dependencyType = dependencyType;
        },
        get: function () {
            return this._dependencyType;
        }
    });

    Object.defineProperty(Package.prototype, "dependencies", {
        set: function (dependencies) {
            this._dependencies = dependencies;
        },
        get: function () {
            return this._dependencies;
        }
    });

    Object.defineProperty(Package.prototype, "description", {
        set: function (description) {
            this._description = description;
        },
        get: function () {
            return this._description;
        }
    });

    Object.defineProperty(Package.prototype, "homepage", {
        set: function (homepage) {
            this._homepage = homepage;
        },
        get: function () {
            return this._homepage;
        }
    });

    Object.defineProperty(Package.prototype, "source", {
        set: function (source) {
            this._source = source;
        },
        get: function () {
            return this._source;
        }
    });

    /**
     * @param {PackageDependency} dependency
     */
    Package.prototype.addDependency = function (dependency) {
        if (dependency) {
            this._dependencies.push(dependency);
        }
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
     * @return {boolean}
     */
    Package.prototype.isDevDependency = function () {
        return (this._dependencyType === DependencyType.DEVELOPMENT);
    };

    /**
     * @return {boolean}
     */
    Package.prototype.isProductionDependency = function () {
        return (this._dependencyType === DependencyType.PRODUCTION);
    };

    /**
     * @return {boolean}
     */
    Package.prototype.isInstalled = function () {
        return (this._status === PackageOptions.Status.INSTALLED);
    };

    /**
     * @return {boolean}
     */
    Package.prototype.isMissing = function () {
        return (this._status === PackageOptions.Status.MISSING);
    };

    /**
     * @return {boolean}
     */
    Package.prototype.isNotTracked = function () {
        // bower "extraneous" definition
        return (this._status === PackageOptions.Status.NOT_TRACKED);
    };

    /**
     * @param {Package} pkg
     */
    Package.prototype.isEqualTo = function (pkg) {
        return (this._dependencyType === pkg.dependencyType && this._status === pkg.status);
    };

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

        if (meta) {
            if (meta.version) {
                pkg.version = meta.version;
            }

            if (meta._source) {
                pkg.source = meta._source;
            }

            if (meta.homepage) {
                pkg.homepage = meta.homepage;
            }

            if (meta.description) {
                pkg.description = meta.description;
            }
        }

        if (data.update && data.update.latest) {
            pkg.latestVersion = data.update.latest;
        }

        if (data.missing) {
            pkg.status = PackageOptions.Status.MISSING;
        } else if (data.extraneous) {
            pkg.status = PackageOptions.Status.NOT_TRACKED;
        }

        if (data.dependencies) {
            _.forEach(data.dependencies, function (dependency, name) {
                var endpoint = dependency.endpoint,
                    version = (endpoint !== undefined) ? endpoint.target : "",
                    metadata = dependency.pkgMeta,
                    source;

                if (metadata && metadata._source) {
                    source = metadata._source;
                } else {
                    source = "";
                }

                pkg.addDependency(new PackageDependency(name, version, source));
            });
        }

        if (bowerJsonDeps && bowerJsonDeps.devDependencies &&
                bowerJsonDeps.devDependencies[name]) {
            pkg.dependencyType = DependencyType.DEVELOPMENT;
        }

        if (data.versions && data.versions.length !== 0) {
            pkg.versions = data.versions;
        }

        return pkg;
    };

    /**
     * Check if the given dependency name is defined in bower json dependencies.
     * @param {string} name
     * @param {object} bowerJsonDependencies
     */
    Package.isInBowerJsonDeps = function (name, bowerJsonDependencies) {
        if (!bowerJsonDependencies) {
            return false;
        }

        if (bowerJsonDependencies.dependencies &&
                bowerJsonDependencies.dependencies[name]) {
            return true;
        }

        if (bowerJsonDependencies.devDependencies &&
                bowerJsonDependencies.devDependencies[name]) {
            return true;
        }

        return false;
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
        /** @private */
        this._installedPackage = null;
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

    Object.defineProperty(PackageInfo.prototype, "installedPackage", {
        /** @param {Package} */
        set: function (installedPackage) {
            this._installedPackage = installedPackage;
        },
        get: function () {
            return this._installedPackage;
        }
    });

    PackageInfo.prototype.isInstalled = function () {
        return (this._installedPackage !== null && this._installedPackage !== undefined);
    };

    /**
     * @param {PackageDependency} dependency
     */
    PackageInfo.prototype.addDependency = function (dependency) {
        if (dependency) {
            this._dependencies.push(dependency);
        }
    };

    /**
     * @param {object} rawData
     * @return {PackageInfo}
     */
    PackageInfo.fromRawData = function (rawData) {
        var latest = rawData.latest,
            latestVersion = latest.version,
            pkg = new PackageInfo(rawData.name, latestVersion, rawData.versions);

        _.forEach(latest.dependencies, function (version, name) {
            // TODO get homepage?
            pkg.addDependency(new PackageDependency(name, version, ""));
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
    };

    /**
     * Create an array of Package instances from the raw data given as arguments.
     * @param {object} packages
     * @return {Array}
     */
    function createPackages(packages) {
        var deps = BowerJsonManager.getDependencies(),
            pkgsName = Object.keys(packages),
            pkgs = [];

        pkgsName.forEach(function (name) {
            var pkgRawData = packages[name],
                pkg = Package.fromRawData(name, pkgRawData, deps);

            pkgs.push(pkg);
        });

        return pkgs;
    }

    /**
     * Create an array of Packages instances that are tracked in the bower.json file.
     * @param {object} packages
     * @return {Array}
     */
    function createTrackedPackages(packages) {
        var deps = BowerJsonManager.getDependencies(),
            pkgsName = Object.keys(packages),
            pkgs = [];

        pkgsName.forEach(function (name) {
            var pkg,
                pkgRawData;

            if (Package.isInBowerJsonDeps(name, deps)) {
                pkgRawData = packages[name];

                pkg = Package.fromRawData(name, pkgRawData, deps);

                pkgs.push(pkg);
            }
        });

        return pkgs;
    }

    /**
     * Create an instance of Package from the raw data given as arguments.
     * @param {string} packageName
     * @param {object} rawData
     * @param {number} dependencyType
     * @return {Package}
     */
    function createPackage(packageName, rawData, dependencyType) {
        if (!rawData) {
            return null;
        }

        var pkg = Package.fromRawData(packageName, rawData);

        if (PackageOptions.isValidDependencyType(dependencyType)) {
            pkg.dependencyType = dependencyType;
        }

        return pkg;
    }

    /**
     * Create a PackageInfo instance from the raw data.
     * @param {object} rawData
     * @return {PackageInfo}
     */
    function createInfo(rawData) {
        if (!rawData) {
            return null;
        }

        return PackageInfo.fromRawData(rawData);
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

    exports.createPackages        = createPackages;
    exports.createPackage         = createPackage;
    exports.createTrackedPackages = createTrackedPackages;
    exports.createInfo            = createInfo;
    exports.getPackagesName       = getPackagesName;

    // tests
    exports._Package           = Package;
    exports._PackageDependency = PackageDependency;
    exports._PackageInfo       = PackageInfo;
});
