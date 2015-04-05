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
        BowerJsonManager     = require("src/bower/BowerJsonManager");

    var PRODUCTION_DEPENDENCY = 0,
        DEVELOPMENT_DEPENDENCY = 1;

    EventDispatcher.makeEventDispatcher(exports);

    function info(name) {
        var deferred = new $.Deferred(),
            config = ConfigurationManager.getConfiguration();

        Bower.info(name, config).then(function (result) {
            deferred.resolve(PackageFactory.createInfo(result));
        }).fail(function (err) {
            deferred.reject(err);
        });

        return deferred;
    }

    /**
     * Install the given package and udpate the project model.
     * @param {string} name The package name to install.
     * @param {string|null} version The package version.
     * @param {number} type Specify if the package to install is a dependency or devDependency.
     * @param {boolean} save Save or not the package to the bower.json file.
     */
    function install(name, version, type, save) {
        var deferred = new $.Deferred(),
            config = ConfigurationManager.getConfiguration(),
            project = ProjectManager.getProject(),
            packageName = name,
            options = {};

        if (version && (version.trim() !== "")) {
            packageName += "#" + version;
        }

        // prepare default values when needed
        if (type === undefined || type === null) {
            type = PRODUCTION_DEPENDENCY;
        }

        if (save === undefined || type === null) {
            save = false;
        }

        if (type === PRODUCTION_DEPENDENCY) {
            options.save = save;
        } else if (type === DEVELOPMENT_DEPENDENCY) {
            options.saveDev = save;
        }

        // install the given package
        Bower.installPackage(packageName, options, config).then(function (result) {
            // get only the direct dependency
            var rawPkg = {};

            rawPkg[name] = result.packages[name];

            // create the package model
            PackageFactory.create(rawPkg).then(function (packages) {

                return info(name).then(function (packageInfo) {
                    // update the package latestVersion
                    packages[0].latestVersion = packageInfo.latestVersion;
                }).always(function () {
                    project.addPackages(packages);

                    deferred.resolve(result);
                });

            }).fail(function () {
                deferred.reject();
            });

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
     */
    function installFromBowerJson() {
        var deferred = new $.Deferred(),
            existsBowerJson = BowerJsonManager.existsBowerJson(),
            config,
            project;

        if (!existsBowerJson) {
            return deferred.reject();
        }

        config = ConfigurationManager.getConfiguration();
        project = ProjectManager.getProject();

        Bower.install(config).then(function (result) {
            // create the package model
            PackageFactory.create(result.packages).then(function (packagesArray) {

                project.addPackages(packagesArray);

                deferred.resolve(result);
            }).fail(function () {
                deferred.reject();
            });

        }).fail(function () {
            deferred.reject();
        });

        return deferred;
    }

    function prune() {
        var deferred = new $.Deferred(),
            existsBowerJson = BowerJsonManager.existsBowerJson(),
            project = ProjectManager.getProject(),
            config;

        if (!existsBowerJson) {
            return deferred.reject();
        }

        config = ConfigurationManager.getConfiguration();

        Bower.prune(config).then(function (uninstalled) {
            var pkgNames = Object.keys(uninstalled);

            project.removePackages(pkgNames);

            deferred.resolve(pkgNames);
        }).fail(function () {
            deferred.reject();
        });

        return deferred;
    }

    function uninstall(name) {
        var deferred = new $.Deferred(),
            config = ConfigurationManager.getConfiguration(),
            project = ProjectManager.getProject(),
            options = {
                save: true,
                saveDev: true
            };

        Bower.uninstall(name, options, config).then(function (uninstalled) {
            var pkgNames = Object.keys(uninstalled);

            project.removePackages(pkgNames);

            deferred.resolve(pkgNames);
        }).fail(function (err) {
            deferred.reject(err);
        });

        return deferred;
    }

    function loadProjectDependencies() {
        var deferred = new $.Deferred(),
            config = ConfigurationManager.getConfiguration(),
            project = ProjectManager.getProject();

        config.offline = true;

        Bower.list(config).then(function (result) {

            // create the package model
            return PackageFactory.create(result.dependencies);
        }).then(function (packagesArray) {

            project.setPackages(packagesArray);

            deferred.resolve(packagesArray);
        }).fail(function (err) {
            deferred.reject(err);
        });

        return deferred;
    }

    function update(name) {
        var deferred = new $.Deferred(),
            config = ConfigurationManager.getConfiguration(),
            project = ProjectManager.getProject(),
            pkg = project.getPackageByName(name),
            version,
            bowerJson;

        // force bower.json to exists before updating
        // check if the selected package exists
        if (!BowerJsonManager.existsBowerJson() || !pkg) {
            return deferred.reject();
        }

        bowerJson = BowerJsonManager.getBowerJson();
        version = pkg.latestVersion;

        bowerJson.updatePackageVersion(name, version).then(function () {
            return Bower.update(name, config);
        }).then(function () {
            // update model
            project.updatePackageVersion(name, version);

            deferred.resolve();
        }).fail(function (error) {

            deferred.reject(error);
        });

        return deferred;
    }

    function search() {
        var config = ConfigurationManager.getConfiguration();

        return Bower.search(config);
    }

    function listCache() {
        var config = ConfigurationManager.getConfiguration();

        return Bower.listCache(config);
    }

    function list() {
        var config = ConfigurationManager.getConfiguration();

        return Bower.list(config);
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
    exports.PRODUCTION_DEPENDENCY   = PRODUCTION_DEPENDENCY;
    exports.DEVELOPMENT_DEPENDENCY  = DEVELOPMENT_DEPENDENCY;
});
