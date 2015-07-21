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
        Package        = require("src/project/Package");

    /**
     * Package short information constructor function.
     * @param {string} name Package name.
     * @param {string} version Package semver version.
     * @param {string=} source Source repository.
     * @constructor
     */
    function PackageSummary(name, version, source) {
        /** @private */
        this._name = name;
        /** @private */
        this._version = version;
        /** @private */
        this._source = source || null;
    }

    Object.defineProperties(PackageSummary.prototype, {
        "name": {
            get: function () {
                return this._name;
            }
        },
        "version": {
            get: function () {
                return this._version;
            }
        },
        "source": {
            get: function () {
                return this._source;
            }
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
     * @param {Package}
     * @return {PackageSummary}
     */
    function createPackageDependant(pkg) {
        var name = pkg.name,
            source = pkg.source;

        return new PackageSummary(name, null, source);
    }

    /**
     * Create package from raw data.
     * @param {string} name
     * @param {object} data
     * @return {Package} pkg
     * @private
     */
    function _packageFromRawData(name, data) {
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

        if (data.endpoint && data.endpoint.target) {
            pkg.bowerJsonVersion = data.endpoint.target;
        }

        if (data.canonicalDir) {
            pkg.installationDir = data.canonicalDir;
        }

        if (data.update && data.update.latest) {
            pkg.latestVersion = data.update.latest;
        }

        if (data.missing) {
            pkg.status = Package.Status.MISSING;
        } else if (data.extraneous) {
            pkg.status = Package.Status.NOT_TRACKED;
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

                pkg.addDependency(new PackageSummary(name, version, source));
            });
        }

        return pkg;
    }

    /**
     * @param {string} name
     * @param {data} data
     * @param {object} deps
     */
    function _packageFromRawDataUsingBowerJson(name, data, deps) {
        var pkg = _packageFromRawData(name, data),
            bowerJsonVersion = null,
            dependencyType;

        if (deps) {
            if (deps.dependencies && deps.dependencies[name]) {
                bowerJsonVersion = deps.dependencies[name];
                dependencyType = Package.DependencyType.PRODUCTION;
            } else if (deps.devDependencies && deps.devDependencies[name]) {
                bowerJsonVersion = deps.devDependencies[name];
                dependencyType = Package.DependencyType.DEVELOPMENT;
            } else {
                dependencyType = Package.DependencyType.UNKNOWN;
            }
        } else {
            // assume production
            dependencyType = Package.DependencyType.PRODUCTION;
        }

        pkg.bowerJsonVersion = bowerJsonVersion;
        pkg.dependencyType = dependencyType;
        pkg.isProjectDependency = Package.isProjectDirectDependency(name, pkg.status, deps);

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
        _.forEach(packages, function (rawPkg, name) {
            var pkgDeps;

            if (!pkgs[name]) {
                pkgDeps = rawPkg.dependencies;

                pkgs[name] = _packageFromRawDataUsingBowerJson(name, rawPkg, deps);

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
                var dependencies = pkg.getDependenciesNames(),
                    dependant = createPackageDependant(pkg);

                // iterate over the package dependencies to set up dependants
                dependencies.forEach(function (depName) {
                    var currentPkg = pkgsData[depName];

                    // find the dependency package and add a dependant for that package
                    if (currentPkg) {
                        currentPkg.addDependant(dependant);
                    }
                });
            }
        });
    }

    /**
     * Create an array of Package instances from the raw data given as arguments, using the
     * content defined in the BowerJson to determine the dependencyType, bowerJsonVersion and to check
     * if it is a project direct dependency.
     * @param {object} packages
     * @return {Array}
     */
    function createPackagesWithBowerJson(packages) {
        if (!packages) {
            return [];
        }

        var deps = _getBowerJsonDependencies(),
            pkgsData = {};

        _.forEach(packages, function (rawPkg, name) {
            var pkg = _packageFromRawDataUsingBowerJson(name, rawPkg, deps);

            pkgsData[name] = pkg;
        });

        _prepareDependants(pkgsData);

        return _.values(pkgsData);
    }

    /**
     * Create an array of Package instances from the raw data given as arguments. The information in the
     * projectPackages array is used to complete the package dependencyType and defines a package as a project
     * direct dependency.
     * @param {object} data Packages information to use to create the Package array.
     * @param {Array} projectPackages Project package's minimum information to use for completing the
     * creation of Packages.
     * @return {Array}
     */
    function createPackages(data, projectPackages) {
        if (!data) {
            return [];
        }

        var pkgsData = {};

        _.forEach(data, function (rawPkg, name) {
            var pkg = _packageFromRawData(name, rawPkg);

            pkgsData[name] = pkg;
        });

        projectPackages.forEach(function (data) {
            var pkg = pkgsData[data.name];
            pkg.dependencyType = data.dependencyType;
            pkg.isProjectDependency = true;
        });

        _prepareDependants(pkgsData);

        return _.values(pkgsData);
    }

    /**
     * Create an object of Package instances from the raw data given as arguments.
     * @param {object} packages
     * @return {Array}
     */
    function createPackagesRecursive(packages) {
        var deps = _getBowerJsonDependencies(),
            pkgsData = {};

        _parsePackagesRecursive(packages, deps, pkgsData);

        _prepareDependants(pkgsData);

        return pkgsData;
    }

    /**
     * Create a PackageInfo instance from the raw data.
     * @param {object} data
     * @return {PackageInfo}
     */
    function createPackageInfo(data) {
        if (!data) {
            return null;
        }

        var latest = data.latest,
            latestVersion = latest.version,
            pkg = new PackageInfo(data.name, latestVersion, data.versions);

        _.forEach(latest.dependencies, function (version, name) {
            pkg.addDependency(new PackageSummary(name, version));
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
     * @param {array} packagesData
     * @return {array}
     */
    function getPackagesName(packagesData) {
        var names = [];

        packagesData.forEach(function (data) {
            var meta = data.pkgMeta;

            if (meta && meta.name) {
                names.push(meta.name);
            }
        });

        return names;
    }

    exports.createPackagesWithBowerJson = createPackagesWithBowerJson;
    exports.createPackages              = createPackages;
    exports.createPackagesRecursive     = createPackagesRecursive;
    exports.createPackageInfo           = createPackageInfo;
    exports.createPackageDependant      = createPackageDependant;
    exports.getPackagesName             = getPackagesName;
});
