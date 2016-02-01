/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 - 2016 Intel Corporation
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4,
maxerr: 50, browser: true */
/*global define, $, brackets */

define(function (require, exports, module) {
    "use strict";

    var _              = brackets.getModule("thirdparty/lodash"),
        FileUtils      = brackets.getModule("file/FileUtils"),
        ProjectStatus  = require("src/project/ProjectStatus"),
        PackageFactory = require("src/project/PackageFactory"),
        Package        = require("src/project/Package"),
        ErrorUtils     = require("src/utils/ErrorUtils"),
        BowerFileUtils = require("src/utils/FileUtils"),
        BowerRc        = require("src/metadata/BowerRc"),
        Strings        = require("strings");

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
        this._processChanges = true;
        /** @private */
        this._hasChanges = false;

        /** @private */
        this._status = new ProjectStatus(this);
        /** @private */
        this._packagesDirectory = ""; // root
        /** @private */
        this._packagesDirectoryName = BowerRc.Defaults.directory;
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

            this._updatePackagesDirectory();
        },
        get: function () {
            return this._activeBowerRc;
        }
    });

    Object.defineProperty(BowerProject.prototype, "packagesDirectory", {
        get: function () {
            return this._packagesDirectory;
        }
    });

    Object.defineProperty(BowerProject.prototype, "packagesDirectoryName", {
        get: function () {
            return this._packagesDirectoryName;
        }
    });

    /**
     * Get the bower components directory.
     * @return {string}
     */
    BowerProject.prototype.getPackagesDirectory = function () {
        return (this._packagesDirectory + this._packagesDirectoryName);
    };

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
     * @return {number}
     */
    BowerProject.prototype.packagesCount = function () {
        return (this._packages) ? Object.keys(this._packages).length : 0;
    };

    /**
     * Set the packages.
     * @param {Array} packagesArray
     */
    BowerProject.prototype.setPackages = function (packagesArray) {
        this._keepVersionsIfNeeded(packagesArray);

        this._packages = {};

        return this._addPackages(packagesArray, false);
    };

    /**
     * Add project packages.
     * @param {Array} packagesArray
     */
    BowerProject.prototype.addPackages = function (packagesArray) {
        this._keepVersionsIfNeeded(packagesArray);

        return this._addPackages(packagesArray, true);
    };

    /**
     * @param {Array} packagesArray
     * @param {boolean} updateDependants
     * @private
     */
    BowerProject.prototype._addPackages = function (packagesArray, updateDependants) {
        var packagesInstalled = [],
            packagesUpdated = [],
            result;

        packagesArray.forEach(function (pkg) {
            var name = pkg.name,
                currentPkg = this._packages[name];

            if (currentPkg && currentPkg.isInstalled()) {
                packagesUpdated.push(pkg);
            } else {
                packagesInstalled.push(pkg);
            }

            this._packages[name] = pkg;

            if (updateDependants) {
                // update dependants
                this._addPackageDependants(pkg);
            }
        }.bind(this));

        result = {
            installed: packagesInstalled,
            updated: packagesUpdated
        };

        this._status.checkCurrentStatus();

        this._projectManager.notifyDependenciesAdded(result);

        return result;
    };

    /**
     * @param {Array} packagesArray
     * @private
     */
    BowerProject.prototype._keepVersionsIfNeeded = function (packagesArray) {
        packagesArray.forEach(function (pkg) {
            pkg.updateVersionInfo(this.getPackageByName(pkg.name));
        }.bind(this));
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

        // update dependants for removed packages
        // if a package that has it as a dependant was removed also, this won't updated because
        // it will look for it in the updated packages.
        packages.forEach(function (pkg) {
            that._removePackageDependants(pkg);
        });

        this._status.checkCurrentStatus();

        this._projectManager.notifyDependenciesRemoved(packages);

        return packages;
    };

    /**
     * Update packages dependencies dependant's according for the given package. If the
     * the package has dependencies, look for those dependencies and remove the given package
     * as a dependant package.
     * @param {Package} pkg
     * @private
     */
    BowerProject.prototype._removePackageDependants = function (pkg) {
        var that = this,
            name = pkg.name,
            pkgDeps;

        if (pkg.hasDependencies()) {
            pkgDeps = pkg.dependencies;

            _.forEach(pkgDeps, function (dependency) {
                var depPkg = that._packages[dependency.name];

                if (depPkg) {
                    depPkg.removeDependant(name);
                }
            });
        }
    };

    /**
     * Update packages dependencies dependant's according for the given package. If the
     * the package has dependencies, look for those dependencies and add the given package
     * as a dependant package if it wasn't added.
     * @param {Package} pkg
     * @private
     */
    BowerProject.prototype._addPackageDependants = function (pkg) {
        var that = this,
            dependant,
            pkgDeps;

        if (pkg.hasDependencies()) {
            pkgDeps = pkg.dependencies;
            dependant = PackageFactory.createPackageDependant(pkg);

            _.forEach(pkgDeps, function (dependency) {
                var depPkg = that._packages[dependency.name];

                if (depPkg) {
                    depPkg.addDependant(dependant);
                }
            });
        }
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
     * @return {Array} packages
     */
    BowerProject.prototype.getProjectPackages = function () {
        var packagesArray = [];

        _.forEach(this._packages, function (pkg) {
            if (pkg.isProjectDependency) {
                packagesArray.push(pkg);
            }
        });

        return packagesArray;
    };

    /**
     * @return {object}
     */
    BowerProject.prototype.getPackagesSummary = function () {
        var packages = {
            total: this.packagesCount(),
            production: [],
            development: [],
            dependenciesOnly: []
        };

        _.forEach(this._packages, function (pkg) {
            if (pkg.isProjectDependency) {
                switch (pkg.dependencyType) {
                case Package.DependencyType.PRODUCTION:
                case Package.DependencyType.UNKNOWN:
                    packages.production.push(pkg);
                    break;
                default:
                    packages.development.push(pkg);
                }
            } else {
                packages.dependenciesOnly.push(pkg);
            }
        });

        return packages;
    };

    /**
     * Get the current packages dependencies array.
     * @private
     * @return {Array} packages
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
     * @param {Array<Package>} pkgs
     */
    BowerProject.prototype.updatePackages = function (pkgs) {
        pkgs.forEach(function (pkg) {
            this._packages[pkg.name] = pkg;
        }.bind(this));

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

        return (pkg && pkg.isInstalled());
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
     * Check if there is some installed package with a different version defined
     * in the bower.json file.
     * @return {boolean} True if some package is found, false otherwhise.
     */
    BowerProject.prototype.hasPackagesVersionOutOfSync = function () {
        var hasVersionOutOfSync = false;

        if (this.hasBowerJson()) {
            hasVersionOutOfSync = _.some(this._packages, function (pkg) {
                return (pkg.isInstalled() && !pkg.isVersionInSync());
            });
        }

        return hasVersionOutOfSync;
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
            pkg.isProjectDependency = true;
        }
    };

    /**
     * @param {string} name Package name.
     * @param {number=} dependencyType Package dependency type: production or development.
     * @return {$.Deferred}
     */
    BowerProject.prototype.trackPackage = function (name, dependencyType) {
        var pkg = this.getPackageByName(name),
            version,
            addDependencyFn;

        if (!this.hasBowerJson()) {
            return (new $.Deferred()).reject(ErrorUtils.createError(ErrorUtils.NO_BOWER_JSON, {
                message: Strings.ERROR_NO_BOWER_JSON
            }));
        }

        if (!pkg) {
            return (new $.Deferred()).reject(ErrorUtils.createError(ErrorUtils.PKG_NOT_INSTALLED, {
                message: Strings.ERROR_MSG_NO_PACKAGE_INSTALLED
            }));
        }

        version = Package.getVersion(pkg.version, Package.DEFAULT_VERSION_TYPE);
        dependencyType = Package.getValidDependencyType(dependencyType);

        if (Package.DependencyType.PRODUCTION === dependencyType) {
            addDependencyFn = this._activeBowerJson.addDependencyToProduction;
        } else {
            addDependencyFn = this._activeBowerJson.addDependencyToDevelopment;
        }

        return addDependencyFn.call(this._activeBowerJson, pkg.name, version);
    };

    /**
     * @param {string} name Package name.
     */
    BowerProject.prototype.untrackPackage = function (name) {
        var pkg = this.getPackageByName(name);

        if (!this.hasBowerJson()) {
            (new $.Deferred()).reject(ErrorUtils.createError(ErrorUtils.NO_BOWER_JSON, {
                message: Strings.ERROR_NO_BOWER_JSON
            }));
        }

        if (!pkg) {
            (new $.Deferred()).reject(ErrorUtils.createError(ErrorUtils.PKG_NOT_INSTALLED, {
                message: Strings.ERROR_MSG_NO_PACKAGE_INSTALLED
            }));
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
            return (new $.Deferred()).reject(ErrorUtils.createError(ErrorUtils.NO_BOWER_JSON, {
                message: Strings.ERROR_NO_BOWER_JSON
            }));
        }
    };

    /**
     * @param {object}
     */
    BowerProject.prototype.syncWithBowerJson = function () {
        if (this.hasBowerJson()) {
            var existsExtraneous,
                existsBowerJsonChanges;

            if (this._status.isSynced()) {
                return (new $.Deferred()).reject(ErrorUtils.createError(ErrorUtils.ESYNC_NOTHING_TO_SYNC, {
                    message: String.ERROR_MSG_NOTHING_TO_SYNC
                }));
            }

            existsExtraneous = this.hasExtraneousPackages();
            existsBowerJsonChanges = this.hasNotInstalledPackages() || this.hasPackagesVersionOutOfSync();

            return this._projectManager.syncDependenciesWithBowerJson(existsExtraneous, existsBowerJsonChanges);
        } else {
            return (new $.Deferred()).reject(ErrorUtils.createError(ErrorUtils.NO_BOWER_JSON, {
                message: Strings.ERROR_NO_BOWER_JSON
            }));
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
        var isCurrentBowerJson = false;

        if (this.hasBowerJson()) {
            isCurrentBowerJson = (this._activeBowerJson.AbsolutePath === bowerJsonPath);
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
        var deferred = new $.Deferred();

        if (this._activeBowerJson === null) {
            return deferred.resolve();
        }

        this._activeBowerJson.remove().always(function () {
            this._activeBowerJson = null;

            this._packagesChanged();

            deferred.resolve();
        }.bind(this));

        return deferred.promise();
    };

    BowerProject.prototype.disableChangesProcessing = function () {
        this._processChanges = false;
    };

    /**
     * Turn on packages changes processing and process changes if any was required while
     * processing was disabled.
     */
    BowerProject.prototype.enableChangesProcessing = function () {
        this._processChanges = true;

        this._processPackagesChanges();
    };

    /**
     * BowerJson content has changed so project can start processing it.
     * @return {$.Promise}
     * @private
     */
    BowerProject.prototype._packagesChanged = function () {
        this._hasChanges = true;

        if (this._processChanges) {
            return this._processPackagesChanges();
        } else {
            return (new $.Deferred()).resolve();
        }
    };

    /**
     * @return {$.Promise}
     * @private
     */
    BowerProject.prototype._processPackagesChanges = function () {
        if (!this._hasChanges) {
            return;
        }

        this._hasChanges = false;

        return this._projectManager.listProjectDependencies().then(function (packagesArray) {
            var isAnyModification;

            if (this.packagesCount() !== packagesArray.length) {
                this.setPackages(packagesArray);
            } else {
                isAnyModification = _.some(packagesArray, function (pkg) {
                    var currentPkg = this.getPackageByName(pkg.name);

                    return (currentPkg) ? !currentPkg.isEqualTo(pkg) : true;
                }.bind(this));

                if (isAnyModification) {
                    this.setPackages(packagesArray);
                }
            }
        }.bind(this));
    };

    /**
     * Remove the current active BowerRc if any.
     * @return {$.Deferred}
     */
    BowerProject.prototype.removeBowerRc = function () {
        var deferred = new $.Deferred();

        if (this._activeBowerRc === null) {
            return deferred.resolve();
        }

        this._activeBowerRc.remove().always(function () {
            this._activeBowerRc = null;

            this._packagesChanged();

            deferred.resolve();
        }.bind(this));

        return deferred.promise();
    };

    BowerProject.prototype.onBowerJsonChanged = function () {
        if (this.hasBowerJson()) {
            this._activeBowerJson.onContentChanged().then(function (updated) {
                if (updated) {
                    this._packagesChanged();
                }
            }.bind(this)).fail(function (error) {
                if (error && error.code === ErrorUtils.EMALFORMED_BOWER_JSON) {
                    ErrorUtils.handleError(error);
                }
            });
        }
    };

    BowerProject.prototype.onBowerRcChanged = function () {
        if (this.hasBowerRc()) {
            this._activeBowerRc.onContentChanged().then(function (changed) {
                if (changed && changed.indexOf("directory") !== -1) {
                    var oldDir = this.getPath() + this.getPackagesDirectory();

                    this._updatePackagesDirectory();

                    var newDir = this.getPath() + this.getPackagesDirectory();

                    return BowerFileUtils.renameDirectory(oldDir, newDir);
                }
            }.bind(this)).then(function () {
                this._packagesChanged();
            }.bind(this)).fail(function (error) {
                if (error && error.code === ErrorUtils.EMALFORMED_BOWERRC) {
                    ErrorUtils.handleError(error);
                }
            });
        }
    };

    BowerProject.prototype.onStatusChanged = function () {
        this._projectManager.notifyProjectStatusChanged(this._status);
    };

    /**
     * @private
     */
    BowerProject.prototype._updatePackagesDirectory = function () {
        if (this.hasBowerRc()) {
            var dir = this._activeBowerRc.Data.directory,
                packagesDir;
            if (dir) {
                packagesDir = FileUtils.getDirectoryPath(dir);
                if (packagesDir === dir) {
                    packagesDir = FileUtils.getParentPath(dir);
                }
                this._packagesDirectory = packagesDir;
                this._packagesDirectoryName = FileUtils.getBaseName(dir);
            }
        }
    };

    module.exports = BowerProject;
});
