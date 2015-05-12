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

    var EventDispatcher      = brackets.getModule("utils/EventDispatcher"),
        Bower                = require("src/bower/Bower"),
        ProjectManager       = require("src/bower/ProjectManager"),
        PackageFactory       = require("src/bower/PackageFactory"),
        ConfigurationManager = require("src/bower/ConfigurationManager"),
        BowerJsonManager     = require("src/bower/BowerJsonManager"),
        ErrorUtils           = require("src/utils/ErrorUtils");

    var PRODUCTION_DEPENDENCY = 0,
        DEVELOPMENT_DEPENDENCY = 1,
        VersionOptions = {
            TILDE: 0,
            CARET: 1,
            FIXED: 2
        };

    var TILDE = "~",
        CARET = "^";

    EventDispatcher.makeEventDispatcher(exports);

    /**
     * @param {string} options
     * @param {number} type
     * @private
     */
    function _getVersion(version, type) {
        var fullVersion;

        if (version && (version.trim() !== "")) {
            fullVersion += "#";

            switch (type) {
            case VersionOptions.TILDE:
                fullVersion += TILDE;
                break;
            case VersionOptions.CARET:
                fullVersion += CARET;
                break;
            }

            fullVersion += type;
        }

        return fullVersion;
    }

    /**
     * Get detailed information about the given package.
     * @param {string} name Package name to get detailed information.
     * @return {$.Deferred}
     */
    function info(name) {
        var deferred = new $.Deferred(),
            config = ConfigurationManager.getConfiguration();

        Bower.info(name, config).then(function (result) {
            var packageInfo = PackageFactory.createInfo(result),
                project = ProjectManager.getProject();

            if (project) {
                packageInfo.isInstalled = project.hasPackage(name);
            }

            deferred.resolve(packageInfo);
        }).fail(function (error) {
            deferred.reject(error);
        });

        return deferred;
    }

    /**
     * Install the given package and udpate the project model.
     * @param {string} name The package name to install.
     * @param {data} options Options to install the package.
     *      version {string|null}: The package version.
     *      versionType {number}: The version type to use, following semver conventions.
     *      type {number}: Specify if the package to install is a dependency or devDependency.
     *      save {boolean}: Save or not the package to the bower.json file.
     * @return {$.Deferred}
     */
    function install(name, data) {
        var deferred = new $.Deferred(),
            config = ConfigurationManager.getConfiguration(),
            project = ProjectManager.getProject(),
            packageName = name,
            options = {},
            version,
            isProduction;

        if (!project) {
            return deferred.reject(ErrorUtils.createError(ErrorUtils.NO_PROJECT));
        }

        data = data || {};

        // prepare default values when needed
        if (typeof data.type !== "number") {
            data.type = PRODUCTION_DEPENDENCY;
        }

        if (typeof data.save !== "boolean") {
            data.save = false;
        }

        // prepare package name with version if any
        version = _getVersion(data.version, data.versionType);

        if (version) {
            packageName += version;
        }

        // setup options
        isProduction = (data.type === PRODUCTION_DEPENDENCY);

        if (isProduction) {
            options.save = data.save;
        } else {
            options.saveDev = data.save;
        }

        // install the given package
        Bower.installPackage(packageName, options, config).then(function (result) {
            if (result.count !== 0) {
                // get only the direct dependency
                var data = result.packages[name],
                    pkg = PackageFactory.createPackage(name, data, !isProduction);

                info(name).then(function (packageInfo) {
                    // update the package latestVersion
                    pkg.latestVersion = packageInfo.latestVersion;
                }).always(function () {
                    project.addPackages([pkg]);

                    deferred.resolve(pkg);
                });
            } else {
                deferred.resolve(null);
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
    function installFromBowerJson() {
        var deferred = new $.Deferred(),
            existsBowerJson = BowerJsonManager.existsBowerJson(),
            project = ProjectManager.getProject(),
            config;

        if (!project) {
            return deferred.reject(ErrorUtils.createError(ErrorUtils.NO_PROJECT));
        }

        if (!existsBowerJson) {
            return deferred.reject(ErrorUtils.createError(ErrorUtils.NO_BOWER_JSON));
        }

        config = ConfigurationManager.getConfiguration();

        Bower.install(config).then(function (result) {
            // create the package model for the packages list
            PackageFactory.createTrackedPackages(result.packages).then(function (packagesArray) {

                project.addPackages(packagesArray);

                deferred.resolve(packagesArray);
            }).fail(function (error) {
                deferred.reject(error);
            });

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
            existsBowerJson = BowerJsonManager.existsBowerJson(),
            project = ProjectManager.getProject(),
            config;

        if (!project) {
            return deferred.reject(ErrorUtils.createError(ErrorUtils.NO_PROJECT));
        }

        if (!existsBowerJson) {
            return deferred.reject(ErrorUtils.createError(ErrorUtils.NO_BOWER_JSON));
        }

        config = ConfigurationManager.getConfiguration();

        Bower.prune(config).then(function (uninstalled) {
            var pkgNames = Object.keys(uninstalled);

            project.removePackages(pkgNames);

            deferred.resolve(pkgNames);
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
    function uninstall(name, force) {
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
            var pkg = project.removePackages(Object.keys(uninstalled));

            deferred.resolve(pkg);
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
     * Update the given package to the given version if any, otherwise it will update it
     * to the latest available version.
     * @param {string} name Name of the package to update.
     * @param {version=} version Version to update to. If empty, it will update it to the latest version.
     * @return {$.Deferred}
     */
    function update(name, version) {
        var deferred = new $.Deferred(),
            config = ConfigurationManager.getConfiguration(),
            project = ProjectManager.getProject(),
            pkg = project.getPackageByName(name),
            bowerJson;

        if (!project) {
            return deferred.reject(ErrorUtils.createError(ErrorUtils.NO_PROJECT));
        }

        // force bower.json to exists before updating
        if (!BowerJsonManager.existsBowerJson()) {
            return deferred.reject(ErrorUtils.createError(ErrorUtils.NO_BOWER_JSON));
        }

        // check if the selected package exists
        if (!pkg) {
            return deferred.reject(ErrorUtils.createError(ErrorUtils.PKG_NOT_INSTALLED));
        }

        bowerJson = BowerJsonManager.getBowerJson();

        version = TILDE + (version || pkg.latestVersion);

        bowerJson.updatePackageVersion(name, version).then(function () {

            return Bower.update(name, config);
        }).then(function (result) {
            // update model
            var rawData = result[name],
                updatedPkg = PackageFactory.createPackage(name, rawData, pkg.isDevDependency);

            project.updatePackage(updatedPkg);

            deferred.resolve(updatedPkg);
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

    /**
     * Get the current installed packages and updates if they have, using
     * the current configuration.
     * @return {$.Deferred}
     */
    function list() {
        return Bower.list(ConfigurationManager.getConfiguration());
    }

    /**
     * Load the packages for the current project.
     * @return {$.Deferred}
     */
    function loadProjectDependencies() {
        var deferred = new $.Deferred(),
            config = ConfigurationManager.getConfiguration(),
            project = ProjectManager.getProject();

        if (!project) {
            return deferred.reject(ErrorUtils.createError(ErrorUtils.NO_PROJECT));
        }

        config.offline = true;

        Bower.list(config).then(function (result) {

            // create the package model
            var packagesArray = PackageFactory.createPackages(result.dependencies);

            project.setPackages(packagesArray);

            deferred.resolve(packagesArray);
        }).fail(function (error) {
            deferred.reject(error);
        });

        return deferred;
    }

    /**
     * Check for packages updates based on the current installed packages.
     * If the packages have upates, update the information from the current
     * project installed packages.
     * @return {$.Deferred}
     */
    function checkForUpdates() {
        var deferred = new $.Deferred(),
            project = ProjectManager.getProject();

        if (!project) {
            return deferred.reject(ErrorUtils.createError(ErrorUtils.NO_PROJECT));
        }

        list().then(function (result) {

            var packagesArray = PackageFactory.createPackages(result.dependencies);

            project.setPackages(packagesArray);

            deferred.resolve(packagesArray);
        }).fail(function (error) {
            deferred.reject(error);
        });

        return deferred;
    }

    exports.install                 = install;
    exports.uninstall               = uninstall;
    exports.installFromBowerJson    = installFromBowerJson;
    exports.prune                   = prune;
    exports.update                  = update;
    exports.info                    = info;
    exports.search                  = search;
    exports.listCache               = listCache;
    exports.list                    = list;
    exports.loadProjectDependencies = loadProjectDependencies;
    exports.checkForUpdates         = checkForUpdates;
    exports.PRODUCTION_DEPENDENCY   = PRODUCTION_DEPENDENCY;
    exports.DEVELOPMENT_DEPENDENCY  = DEVELOPMENT_DEPENDENCY;
    exports.VersionOptions          = VersionOptions;
});
