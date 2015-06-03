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

    var _             = brackets.getModule("thirdparty/lodash"),
        ProjectStatus = require("src/project/ProjectStatus"),
        PackageUtils  = require("src/bower/PackageUtils"),
        ErrorUtils    = require("src/utils/ErrorUtils");

    /**
     * @constructor
     */
    function BowerProject(name, rootPath, projectManager) {
        /** @private */
        this._name = name;
        /** @private */
        this._rootPath = rootPath;
        /** @private */
        this._projectManager = projectManager;
        /** @private */
        this._activeDir = null;
        /** @private */
        this._shortActiveDir = null;
        /** @private */
        this._packages = {};

        /** @private */
        this._activeBowerJson = null;
        /** @private */
        this._activeBowerRc = null;

        /** @private */
        this._status = new ProjectStatus(this);
    }

    Object.defineProperty(BowerProject.prototype, "name", {
        get: function () {
            return this._name;
        }
    });

    Object.defineProperty(BowerProject.prototype, "rootPath", {
        get: function () {
            return this._rootPath;
        }
    });

    Object.defineProperty(BowerProject.prototype, "activeDir", {
        set: function (activeDir) {
            this._activeDir = activeDir;

            // calculate shortPath
            if (this._activeDir === this._rootPath) {
                this._shortActiveDir = "";
            } else {
                this._shortActiveDir = this._activeDir.slice(this._rootPath.length);
            }
        },
        get: function () {
            return this._activeDir;
        }
    });

    Object.defineProperty(BowerProject.prototype, "shortActiveDir", {
        get: function () {
            return this._shortActiveDir;
        }
    });

    Object.defineProperty(BowerProject.prototype, "activeBowerJson", {
        set: function (activeBowerJson) {
            this._activeBowerJson = activeBowerJson;
        },
        get: function () {
            return this._activeBowerJson;
        }
    });

    Object.defineProperty(BowerProject.prototype, "activeBowerRc", {
        set: function (activeBowerRc) {
            this._activeBowerRc = activeBowerRc;
        },
        get: function () {
            return this._activeBowerRc;
        }
    });

    /**
     * Get the bower project working directory, either the active directory
     * if any or the projet root.
     * @return {string}
     */
    BowerProject.prototype.getPath = function () {
        return (this._activeDir || this._rootPath);
    };

    /**
     * Get the current project status object.
     * @return {ProjectStatus}
     */
    BowerProject.prototype.getStatus = function () {
        return this._status;
    };

    /**
     * Set the packages.
     * @param {Array} packagesArray
     */
    BowerProject.prototype.setPackages = function (packagesArray) {
        this._packages = {};

        this.addPackages(packagesArray);
    };

    /**
     * Add project packages.
     * @param {Array} packagesArray
     */
    BowerProject.prototype.addPackages = function (packagesArray) {
        var that = this,
            packagesInstalled = [],
            packagesUpdated = [],
            result;

        packagesArray.forEach(function (pkg) {
            var name = pkg.name,
                currentPkg = that._packages[name];

            if (currentPkg && currentPkg.isInstalled()) {
                packagesUpdated.push(pkg);
            } else {
                packagesInstalled.push(pkg);
            }

            that._packages[name] = pkg;
        });

        result = {
            installed: packagesInstalled,
            updated: packagesUpdated
        };

        this._status.checkCurrentStatus();

        this._projectManager.notifyDependenciesAdded(result);

        return result;
    };

    /**
     * Remove packages by its name.
     * @param {Array} names
     * @return {object}
     */
    BowerProject.prototype.removePackages = function (names) {
        var that = this,
            packages = [];

        names.forEach(function (name) {
            var pkg = that._packages[name];

            if (pkg) {
                packages.push(pkg);

                delete that._packages[name];
            }
        });

        this._status.checkCurrentStatus();

        this._projectManager.notifyDependenciesRemoved(packages);

        return packages;
    };

    /**
     * Get the current packages.
     * @return {object}
     */
    BowerProject.prototype.getPackages = function () {
        return this._packages;
    };

    /**
     * Get the package by the given name;
     * @param {string} name
     * @return {object}
     */
    BowerProject.prototype.getPackageByName = function (name) {
        return this._packages[name];
    };

    /**
     * Get the current packages array.
     * @private
     * @returns {Array} packages
     */
    BowerProject.prototype.getPackagesArray = function () {
        var packagesArray = [];

        _.forEach(this._packages, function (pkg) {
            if (pkg.isProjectDependency) {
                packagesArray.push(pkg);
            }
        });

        return packagesArray;
    };

    /**
     * Get the current packages dependencies array.
     * @private
     * @returns {Array} packages
     */
    BowerProject.prototype.getPackagesDependenciesArray = function () {
        var packagesArray = [];

        _.forEach(this._packages, function (pkg) {
            if (!pkg.isProjectDependency) {
                packagesArray.push(pkg);
            }
        });

        return packagesArray;
    };

    /**
     * Update the given package.
     * @param {Package} pkg
     */
    BowerProject.prototype.updatePackage = function (pkg) {
        this._packages[pkg.name] = pkg;

        this._projectManager.notifyDependencyUpdated(pkg);
    };

    BowerProject.prototype.updatePackages = function (pkgs) {
        pkgs.forEach(function (pkg) {
            this._packages[pkg.name] = pkg;
        });

        this._status.checkCurrentStatus();

        this._projectManager.notifyDependencyUpdated(pkgs);
    };

    /**
     * Check if the project has dependencies.
     * @return {boolean}
     */
    BowerProject.prototype.hasPackages = function () {
        return (Object.keys(this._packages).length !== 0);
    };

    /**
     * Check if the given package is installed for the project.
     * @return {boolean}
     */
    BowerProject.prototype.hasPackage = function (name) {
        var pkg = this._packages[name];

        return (pkg && pkg.isInstalled()); // TODO only project packages?
    };

    /**
     * Check if there is some not installed package. An uninstalled package
     * is the one that is defined in the bower.json but is not installed
     * in the libraries folder.
     * @return {boolean}
     */
    BowerProject.prototype.hasNotInstalledPackages = function () {
        var hasNotInstalled = _.some(this._packages, function (pkg) {
            return pkg.isMissing();
        });

        return hasNotInstalled;
    };

    /**
     * Check if there is some extraneous package. An extraneous package is the
     * one that is installed (available at the libraries folder) but is not
     * defined in the bower.json file.
     * @return {boolean}
     */
    BowerProject.prototype.hasExtraneousPackages = function () {
        var hasExtraneous = _.some(this._packages, function (pkg) {
            return pkg.isNotTracked();
        });

        return hasExtraneous;
    };

    /**
     * Get the project uninstalled packages.
     * @return {Array}
     */
    BowerProject.prototype.getNotInstalledPackages = function () {
        return _.filter(this._packages, function (pkg) {
            return pkg.isMissing();
        });
    };

    /**
     * Get the project extraneous packages.
     * @return {Array}
     */
    BowerProject.prototype.getExtraneousPackages = function () {
        return _.filter(this._packages, function (pkg) {
            return pkg.isNotTracked();
        });
    };

    /**
     * @param {string} name
     */
    BowerProject.prototype.updatePackageDependencyToProject = function (name) {
        var pkg = this._packages[name];

        if (pkg) {
            pkg.isProjectPackage = true;
        }
    };

    /**
     * @param {string} name Package name.
     * @return {$.Deferred}
     */
    BowerProject.prototype.trackPackage = function (name) {
        var pkg = this.getPackageByName(name),
            version;

        if (!this.hasBowerJson()) {
            return (new $.Deferred()).reject(ErrorUtils.createError(ErrorUtils.NO_BOWER_JSON));
        }

        if (!pkg) {
            return (new $.Deferred()).reject(ErrorUtils.createError(ErrorUtils.NO_BOWER_JSON));
        }

        version = PackageUtils.getVersion(pkg.version, PackageUtils.VersionOptions.TILDE);

        return this._activeBowerJson.addDependencyToProduction(pkg.name, version);
    };

    /**
     * @param {string} name Package name.
     */
    BowerProject.prototype.untrackPackage = function (name) {
        var pkg = this.getPackageByName(name);

        if (!this.hasBowerJson()) {
            (new $.Deferred()).reject(ErrorUtils.createError(ErrorUtils.NO_BOWER_JSON));
        }

        if (!pkg) {
            (new $.Deferred()).reject(ErrorUtils.createError(ErrorUtils.NO_BOWER_JSON));
        }

        return this._activeBowerJson.removeDependency(pkg.name);
    };

    /**
     * @param {object}
     */
    BowerProject.prototype.syncWithCurrentPackages = function () {
        if (this.hasBowerJson()) {
            var packages = this._status.getStatusSummary();

            return this._activeBowerJson.syncDependencies(packages);
        } else {
            return (new $.Deferred()).reject(ErrorUtils.createError(ErrorUtils.NO_BOWER_JSON));
        }
    };

    /**
     * @param {object}
     */
    BowerProject.prototype.syncWithBowerJson = function () {
        if (this.hasBowerJson()) {
            var existsExtraneous,
                existsMissing;

            if (this._status.isSynced()) {
                return (new $.Deferred()).reject(ErrorUtils.createError(ErrorUtils.ESYNC_NOTHING_TO_SYNC));
            }

            existsExtraneous = this.hasExtraneousPackages();
            existsMissing = this.hasNotInstalledPackages();

            return this._projectManager.syncDependenciesWithBowerJson(existsExtraneous, existsMissing);
        } else {
            return (new $.Deferred()).reject(ErrorUtils.createError(ErrorUtils.NO_BOWER_JSON));
        }
    };

    /**
     * Check if the project has an active BowerJson.
     * @return {boolean}
     */
    BowerProject.prototype.hasBowerJson = function () {
        return (this._activeBowerJson !== null);
    };

    /**
     * Check if the project has an ative BowerRc.
     * @return {boolean}
     */
    BowerProject.prototype.hasBowerRc = function () {
        return (this._activeBowerRc !== null);
    };

    /**
     * Check if the given path is the current active BowerJson.
     * @param {string} bowerJsonPath The absolute path of the potential active bower.json file.
     * @return {boolean}
     */
    BowerProject.prototype.isActiveBowerJson = function (bowerJsonPath) {
        var isCurrentBowerJson;

        if (this.hasBowerJson()) {
            isCurrentBowerJson = (this._activeBowerJson.AbsolutePath === bowerJsonPath);
        } else {
            isCurrentBowerJson = false;
        }

        return isCurrentBowerJson;
    };

    BowerProject.prototype.bowerJsonLoaded = function (bowerJson) {
        this._activeBowerJson = bowerJson;

        this.notifyBowerJsonChanged();
    };

    /**
     * Remove the current active BowerJson if any.
     * @return {$.Deferred}
     */
    BowerProject.prototype.removeBowerJson = function () {
        var that = this,
            deferred = new $.Deferred();

        if (this._activeBowerJson === null) {
            return deferred.resolve();
        }

        this._activeBowerJson.remove().always(function () {
            that._activeBowerJson = null;

            that.bowerJsonChanged();

            deferred.resolve();
        });

        return deferred.promise();
    };

    BowerProject.prototype.bowerJsonChanged = function () {
        var that = this,
            currentPackages = that.getPackagesArray();

        this._projectManager.listProjectDependencies().then(function (packagesArray) {
            var isAnyModification;

            if (currentPackages.length !== packagesArray.length) {
                that.setPackages(packagesArray);
            } else {
                isAnyModification = _.some(packagesArray, function (pkg) {
                    var projectPkg = that.getPackageByName(pkg.name);

                    return !projectPkg.isEqualTo(pkg);
                });

                if (isAnyModification) {
                    that.setPackages(packagesArray);
                }
            }
        });
    };

    /**
     * Remove the current active BowerRc if any.
     * @return {$.Deferred}
     */
    BowerProject.prototype.removeBowerRc = function () {
        var that = this,
            deferred = new $.Deferred();

        if (this._activeBowerRc === null) {
            return deferred.resolve();
        }

        this._activeBowerRc.remove().always(function () {
            that._activeBowerRc = null;

            deferred.resolve();
        });

        return deferred.promise();
    };

    BowerProject.prototype.onBowerJsonChanged = function () {
        if (this.hasBowerJson()) {
            this._activeBowerJson.onContentChanged();
        }
    };

    BowerProject.prototype.onBowerRcChanged = function () {
        if (this.hasBowerRc()) {
            this._activeBowerRc.onContentChanged();
        }
    };

    BowerProject.prototype.onStatusChanged = function (status) {
        if (this.hasBowerJson()) {
            this._projectManager.notifyProjectStatusChanged(status);
        }
    };

    module.exports = BowerProject;
});
