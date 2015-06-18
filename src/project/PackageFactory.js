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

    var _              = brackets.getModule("thirdparty/lodash"),
        ProjectManager = require("src/project/ProjectManager"),
        Package        = require("src/project/Package"),
        PackageUtils   = require("src/bower/PackageUtils");

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

    PackageInfo.prototype.addDependency = function (dependency) {
        if (dependency) {
            this._dependencies.push(dependency);
        }
    };

    /**
     * Check if the given dependency name is defined in bower json dependencies.
     * @param {string} name
     * @param {object} bowerJsonDependencies
     * @return {string}
     */
    function _getBowerJsonVersion(name, bowerJsonDependencies) {
        var version = null;

        if (!bowerJsonDependencies) {
            return version;
        }

        if (bowerJsonDependencies.dependencies &&
                bowerJsonDependencies.dependencies[name]) {

            version = bowerJsonDependencies.dependencies[name];
        } else if (bowerJsonDependencies.devDependencies &&
                bowerJsonDependencies.devDependencies[name]) {

            version = bowerJsonDependencies.devDependencies[name];
        }

        return version;
    }

    /**
     * Create package from raw data.
     * @param {string} name
     * @param {object} data
     * @param {object=} bowerJsonDeps
     * @return {Package} pkg
     */
    function _packageFromRawData(name, data, bowerJsonDeps) {
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

        if (data.canonicalDir) {
            pkg.installationDir = data.canonicalDir;
        }

        if (data.update && data.update.latest) {
            pkg.latestVersion = data.update.latest;
        }

        if (data.missing) {
            pkg.status = PackageUtils.Status.MISSING;
        } else if (data.extraneous) {
            pkg.status = PackageUtils.Status.NOT_TRACKED;
        }

        pkg.isProjectDependency = Package.isProjectDirectDependency(name, pkg.status, bowerJsonDeps);

        pkg.bowerJsonVersion = _getBowerJsonVersion(name, bowerJsonDeps);

        if (bowerJsonDeps) {
            if (bowerJsonDeps.dependencies && bowerJsonDeps.dependencies[name]) {
                pkg.dependencyType = PackageUtils.DependencyType.PRODUCTION;
            } else if (bowerJsonDeps.devDependencies && bowerJsonDeps.devDependencies[name]) {
                pkg.dependencyType = PackageUtils.DependencyType.DEVELOPMENT;
            } else {
                pkg.dependencyType = PackageUtils.DependencyType.UNKNOWN;
            }
        }

        if (data.dependencies) {
            _.forEach(data.dependencies, function (dependencyData, name) {
                var endpoint = dependencyData.endpoint,
                    version = (endpoint !== undefined) ? endpoint.target : "",
                    metadata = dependencyData.pkgMeta,
                    source;

                if (metadata && metadata._source) {
                    source = metadata._source;
                } else {
                    source = "";
                }

                pkg.addDependency(new PackageDependency(name, version, source));
            });
        }

        return pkg;
    }

    /**
     * @param {object} rawData
     * @return {PackageInfo}
     * @private
     */
    function _packageInfoFromRawData(rawData) {
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
    }

    /**
     * @private
     */
    function _getBowerJsonDependencies() {
        var bowerJson = ProjectManager.getBowerJson();

        return (bowerJson) ? bowerJson.getAllDependencies() : null;
    }

    /**
     * @private
     */
    function _parsePackagesRecursive(packages, deps, pkgs) {
        var pkgsName = Object.keys(packages);

        pkgsName.forEach(function (name) {
            var pkgRawData = packages[name],
                pkgDeps;

            if (!pkgs[name]) {
                pkgDeps = pkgRawData.dependencies;

                pkgs[name] = _packageFromRawData(name, pkgRawData, deps);

                if (pkgDeps && Object.keys(pkgDeps).length !== 0) {
                    _parsePackagesRecursive(pkgDeps, deps, pkgs);
                }
            }
        });
    }

    /**
     * @private
     */
    function _prepareDependants(pkgsData) {
        _.forEach(pkgsData, function (pkg, name) {

            if (pkg.hasDependencies()) {
                var dependencies = pkg.getDependenciesNames();

                // iterate over the package dependencies to set up dependants
                dependencies.forEach(function (depName) {
                    var currentPkg = pkgsData[depName];

                    // find the dependency package and add a dependant for that package
                    if (currentPkg) {
                        currentPkg.addDependant(pkg.name);
                    }
                });
            }
        });
    }

    /**
     * Create an array of Package instances from the raw data given as arguments.
     * @param {object} packages
     * @return {Array}
     */
    function createPackages(packages) {
        if (!packages) {
            return [];
        }

        var deps = _getBowerJsonDependencies(),
            pkgsName = Object.keys(packages),
            pkgsData = {};

        pkgsName.forEach(function (name) {
            var pkgRawData = packages[name],
                pkg = _packageFromRawData(name, pkgRawData, deps);

            pkgsData[pkg.name] = pkg;
        });

        _prepareDependants(pkgsData);

        return _.values(pkgsData);
    }

    /**
     * Create an object of Package instances from the raw data given as arguments.
     * @param {object} packages
     * @return {Array}
     */
    function createPackagesDeep(packages) {
        var deps = _getBowerJsonDependencies(),
            pkgsData = {};

        _parsePackagesRecursive(packages, deps, pkgsData);

        _prepareDependants(pkgsData);

        return pkgsData;
    }

    /**
     * Create an array of Package instances from the raw data given as arguments.
     * @param {object} packages
     * @return {Array}
     */
    function createPackagesDeepArray(packages) {
        var pkgsData = createPackagesDeep(packages);

        return _.values(pkgsData);
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

        var pkg = _packageFromRawData(packageName, rawData);

        if (PackageUtils.isValidDependencyType(dependencyType)) {
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

        return _packageInfoFromRawData(rawData);
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

    exports.createPackages          = createPackages;
    exports.createPackagesDeep      = createPackagesDeep;
    exports.createPackagesDeepArray = createPackagesDeepArray;
    exports.createPackage           = createPackage;
    exports.createInfo              = createInfo;
    exports.getPackagesName         = getPackagesName;

    // tests
    exports._PackageDependency        = PackageDependency;
    exports._PackageInfo              = PackageInfo;
});
