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
/*global brackets, $, define */

define(function (require, exports) {
    "use strict";

    var _                    = brackets.getModule("thirdparty/lodash"),
        EventDispatcher      = brackets.getModule("utils/EventDispatcher"),
        Bower                = require("src/bower/Bower"),
        ProjectManager       = require("src/project/ProjectManager"),
        PackageFactory       = require("src/project/PackageFactory"),
        Package              = require("src/project/Package"),
        ConfigurationManager = require("src/configuration/ConfigurationManager"),
        ErrorUtils           = require("src/utils/ErrorUtils"),
        Strings              = require("strings");

    EventDispatcher.makeEventDispatcher(exports);

    /**
     * Creates and return a function based on the given function that turn off the external metadata
     * modifications after the function is executed, and then, turn it on.
     * This function should only be used to wrap those actions that can potentially modify external
     * configuration files.
     * @param {Function} fn A function to wrap. It must return a $.Promise object.
     * @return {Function}
     * @private
     */
    function _wrapChangesProcessing(fn) {
        return function () {
            var project = ProjectManager.getProject(),
                promiseResult = fn.apply(null, arguments);

            project.disableChangesProcessing();

            promiseResult.always(function () {
                project.enableChangesProcessing();
            });

            return promiseResult;
        };
    }

    /**
     * @param {Package} pkg
     * @param {object} data Values to update the package properties.
     *        {string|null} data.version Version to update to. If empty, it will update it to the latest version.
     *        {number} data.versionType The version type to use, following semver conventions.
     *        {number} data.type Update the package type: dependency or devDependency.
     * @private
     */
    function _updateOptionsForPackage(pkg, data) {
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

        updateVersion = Package.getVersion(data.version, data.versionType);

        // version
        if (updateVersion && (pkg.bowerJsonVersion !== updateVersion)) {
            addToUpdateData("version", updateVersion);
        }

        // dependency type
        if (Package.isValidDependencyType(dependencyType) && pkg.dependencyType !== dependencyType) {
            addToUpdateData("dependencyType", dependencyType);
        }

        return updateData;
    }

    /**
     * @param {object} data
     * @return {object} options
     *         {boolean} options.save Install as production dependency and update bower.json file.
     *         {boolean} options.saveDev Install as development dependency and update the bower.json file.
     * @private
     */
    function _getInstallOptions(data) {
        var options = {},
            dependencyType = Package.getValidDependencyType(data.type);

        if (typeof data.save !== "boolean") {
            data.save = false;
        }

        // setup options
        if (dependencyType === Package.DependencyType.PRODUCTION) {
            options.save = data.save;
        } else {
            options.saveDev = data.save;
        }

        return options;
    }
    /**
     * Get detailed information about the given package.
     * @param {string} name Package name to get detailed information.
     * @return {$.Deferred}
     */
    function infoByName(name) {
        var deferred = new $.Deferred(),
            config = ConfigurationManager.getConfiguration();

        Bower.info(name, config).then(function (result) {
            var packageInfo = PackageFactory.createPackageInfo(result),
                project = ProjectManager.getProject();

            if (project && project.hasPackage(name)) {
                packageInfo.installedPackage = project.getPackageByName(name);
            }

            deferred.resolve(packageInfo);
        }).fail(function (error) {
            deferred.reject(error);
        });

        return deferred;
    }

    /**
     * Get the current installed packages and updates if they have, using
     * the current configuration.
     * @param {boolean=} offline True if offline mode is enabled, otherwhise false.
     * @return {$.Deferred}
     */
    function list(offline) {
        var config = ConfigurationManager.getConfiguration();

        if (typeof offline === "boolean") {
            config.offline = offline;
        }

        return Bower.list(config);
    }

    /**
     * @param {Array=} pkgsNames
     * @return {Array}
     * @private
     */
    function listWithVersions(pkgsNames) {
        var deferred = new $.Deferred();

        list().then(function (result) {

            return PackageFactory.createPackagesRecursive(result.dependencies);
        }).then(function (packagesData) {
            var packagesArray;

            if (pkgsNames) {
                packagesArray = [];

                pkgsNames.forEach(function (name) {
                    var updatedPkg = packagesData[name];

                    if (updatedPkg) {
                        packagesArray.push(updatedPkg);
                    }
                });

                deferred.resolve(packagesArray);
            } else {
                packagesArray = _.values(packagesData);

                deferred.resolve(packagesArray);
            }
        }).fail(function (error) {
            deferred.reject(error);
        });

        return deferred;
    }

    /**
     * Install the given package and udpate the project model.
     * @param {string} name The package name to install.
     * @param {data} options Options to install the package.
     *      {string|null} options.version The package version.
     *      {number} options.versionType The version type to use, following semver conventions.
     *      {number} options.type Specify if the package to install is a dependency or devDependency.
     *      {boolean} options.save Save or not the package to the bower.json file.
     * @return {$.Deferred}
     */
    function installByName(name, data) {
        var deferred = new $.Deferred(),
            config = ConfigurationManager.getConfiguration(),
            project = ProjectManager.getProject(),
            packageName = name,
            options;

        if (!project) {
            return deferred.reject(ErrorUtils.createError(ErrorUtils.NO_PROJECT));
        }

        if (!data) {
            data = {};
        }

        // prepare package name with version if any
        if (data.version) {
            packageName += "#" + Package.getVersion(data.version, data.versionType);
        }

        options = _getInstallOptions(data);

        // install the given package
        Bower.installPackage(packageName, options, config).then(function (result) {
            var pkg;

            if (result.count !== 0) {
                var rawPkgInstalled = {
                    name: name,
                    dependencyType: data.type
                };
                var pkgs = PackageFactory.createPackages(result.packages, [rawPkgInstalled]);

                // find the direct installed package
                pkg = _.find(pkgs, function (pkgObject) {
                    return (pkgObject.name === name);
                });

                infoByName(name).then(function (packageInfo) {

                    pkg.updateVersionInfo(packageInfo);
                }).always(function () {
                    project.addPackages(pkgs);

                    deferred.resolve(pkg);
                });
            } else {
                // check if it is a previous installed package as a package dependency
                pkg = project.getPackageByName(name);

                if (pkg && !pkg.isProjectDependency) {
                    project.updatePackageDependencyToProject(name);

                    deferred.resolve(pkg);
                } else {
                    deferred.reject(ErrorUtils.createError(ErrorUtils.EINSTALL_NO_PKG_INSTALLED, {
                        message: Strings.ERROR_MSG_NO_PACKAGE_INSTALLED
                    }));
                }
            }
        }).fail(function (error) {
            deferred.reject(error);
        });

        return deferred;
    }

    /**
     * Install all the defined packages in the bower.json file.
     * First checks if the bower.json file is available for the
     * current project, if so, it continues with the dependencies
     * installation, otherwhise, it rejects the promise.
     * @return {$.Deferred}
     */
    function install() {
        var deferred = new $.Deferred(),
            project = ProjectManager.getProject(),
            config;

        if (!project) {
            return deferred.reject(ErrorUtils.createError(ErrorUtils.NO_PROJECT));
        }

        if (!project.hasBowerJson()) {
            return deferred.reject(ErrorUtils.createError(ErrorUtils.NO_BOWER_JSON, {
                message: Strings.ERROR_NO_BOWER_JSON
            }));
        }

        config = ConfigurationManager.getConfiguration();

        Bower.install(config).then(function (result) {
            var total = result.count,
                resultPackages = result.packages,
                packagesNames,
                packagesArray;

            if (total !== 0) {
                packagesNames = Object.keys(resultPackages);

                // try to get packages with "latestVersion" for the installed packages
                listWithVersions(packagesNames).then(function (packagesWithUpdate) {
                    packagesArray = packagesWithUpdate;

                }).fail(function () {

                    packagesArray = PackageFactory.createPackagesWithBowerJson(resultPackages);
                }).always(function () {

                    var installResult = project.addPackages(packagesArray);
                    installResult.total = total;

                    deferred.resolve(installResult);
                });
            } else {
                deferred.resolve({ total: total, installed: [], updated: [] });
            }

        }).fail(function (error) {
            deferred.reject(error);
        });

        return deferred;
    }

    /**
     * Remove extraneous packages according to the bower.json packages definition.
     * @return {$.Deferred}
     */
    function prune() {
        var deferred = new $.Deferred(),
            project = ProjectManager.getProject(),
            config;

        if (!project) {
            return deferred.reject(ErrorUtils.createError(ErrorUtils.NO_PROJECT));
        }

        if (!project.hasBowerJson()) {
            return deferred.reject(ErrorUtils.createError(ErrorUtils.NO_BOWER_JSON, {
                message: Strings.ERROR_NO_BOWER_JSON
            }));
        }

        config = ConfigurationManager.getConfiguration();

        Bower.prune(config).then(function (uninstalled) {
            var result = project.removePackages(Object.keys(uninstalled));

            deferred.resolve(result);
        }).fail(function (error) {
            deferred.reject(error);
        });

        return deferred;
    }

    /**
     * Uninstall the given package by its name. To force uninstalling the package,
     * true must be passed as the second parameter.
     * @param {string} name Existent package to uninstall.
     * @param {boolean} force Force uninstalling the given package.
     * @return {$.Deferred}
     */
    function uninstallByName(name, force) {
        var deferred = new $.Deferred(),
            config = ConfigurationManager.getConfiguration(),
            project = ProjectManager.getProject(),
            options = {
                save: true,
                saveDev: true
            };

        if (!project) {
            return deferred.reject(ErrorUtils.createError(ErrorUtils.NO_PROJECT));
        }

        config.force = (typeof force === "boolean") ? force : false;

        Bower.uninstall(name, options, config).then(function (uninstalled) {
            var pkgs = project.removePackages(Object.keys(uninstalled));

            deferred.resolve(pkgs);
        }).fail(function (error) {
            // check if there's a conflict error when uninstalling, in that case
            // parse the data to get an array of packages names in conflict
            if (error.code === ErrorUtils.CONFLICT) {
                var originalError = error.originalError,
                    data = (originalError || originalError.data) ? originalError.data : null,
                    dependants;

                if (data && data.dependants) {
                    dependants = PackageFactory.getPackagesName(data.dependants);
                } else {
                    dependants = [];
                }

                error.dependants = dependants;
            }

            deferred.reject(error);
        });

        return deferred;
    }

    /**
     * @param {string} name Package name tu update.
     * @private
     */
    function _updateByName(name) {
        var deferred = new $.Deferred(),
            project = ProjectManager.getProject(),
            config = ConfigurationManager.getConfiguration();

        Bower.update(name, config).then(function (result) {
            if (Object.keys(result).length !== 0) {
                var pkgs = PackageFactory.createPackagesWithBowerJson(result),
                    updatedPkg;

                // find the direct updated package
                updatedPkg = _.find(pkgs, function (pkgObject) {
                    return (pkgObject.name === name);
                });

                infoByName(name).then(function (packageInfo) {
                    // update the package latestVersion
                    updatedPkg.updateVersionInfo(packageInfo);
                }).always(function () {
                    project.updatePackages(pkgs);

                    deferred.resolve(updatedPkg);
                });
            } else {
                deferred.reject(ErrorUtils.createError(ErrorUtils.EUPDATE_NO_PKG_UPDATED, {
                    message: Strings.ERROR_MSG_NO_PACKAGE_UPDATED
                }));
            }
        });

        return deferred.promise();
    }

    /**
     * Update the package to the specified version and/or dependency type.
     * @param {string} name Name of the package to update.
     * @param {data} options Options to install the package.
     *      {string|null} options.version Version to update to. If null, it will update it to the latest version.
     *      {number} options.versionType The version type to use, following semver conventions.
     *      {number} options.type Update the package type: dependency or devDependency.
     * @return {$.Deferred}
     */
    function updateByName(name, data) {
        var deferred = new $.Deferred(),
            project = ProjectManager.getProject(),
            pkg,
            bowerJson,
            updateData;

        if (!project) {
            return deferred.reject(ErrorUtils.createError(ErrorUtils.NO_PROJECT));
        }

        // force bower.json to exists before updating
        if (!project.hasBowerJson()) {
            return deferred.reject(ErrorUtils.createError(ErrorUtils.NO_BOWER_JSON, {
                message: Strings.ERROR_NO_BOWER_JSON
            }));
        }

        pkg = project.getPackageByName(name);
        bowerJson = project.activeBowerJson;

        // check if the selected package exists
        if (!pkg) {
            return deferred.reject(ErrorUtils.createError(ErrorUtils.PKG_NOT_INSTALLED, {
                message: Strings.ERROR_MSG_NO_PACKAGE_INSTALLED
            }));
        }

        // get package data to update
        updateData = _updateOptionsForPackage(pkg, data);

        if (!updateData || Object.keys(updateData) === 0) {
            return deferred.reject(ErrorUtils.createError(ErrorUtils.EUPDATE_NO_DATA, {
                message: Strings.ERROR_MSG_NO_UPDATE_DATA
            }));
        }

        bowerJson.updatePackageInfo(name, updateData).then(function () {

            if (updateData.version !== undefined) {

                return _updateByName(name);
            } else {
                // dependencyType was an updated property only
                pkg.dependencyType = updateData.dependencyType;

                project.updatePackages([pkg]);

                return pkg;
            }
        }).then(function (result) {

            deferred.resolve(result);
        }).fail(function (error) {

            deferred.reject(error);
        });

        return deferred;
    }

    /**
     * Search the registry for packages using the current configuration.
     * @return {$.Deferred}
     */
    function search() {
        return Bower.search(ConfigurationManager.getConfiguration());
    }

    /**
     * Get the cached packages using the current configuration.
     * @return {$.Deferred}
     */
    function listCache() {
        return Bower.listCache(ConfigurationManager.getConfiguration());
    }

    exports.installByName    = _wrapChangesProcessing(installByName);
    exports.uninstallByName  = _wrapChangesProcessing(uninstallByName);
    exports.updateByName     = _wrapChangesProcessing(updateByName);
    exports.infoByName       = infoByName;
    exports.install          = install;
    exports.prune            = prune;
    exports.search           = search;
    exports.listCache        = listCache;
    exports.list             = list;
    exports.listWithVersions = listWithVersions;
    exports.VersionOptions   = Package.VersionOptions;
    exports.DependencyType   = Package.DependencyType;
});
