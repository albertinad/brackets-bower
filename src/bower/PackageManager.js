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
/*global brackets, $, define, _ */

define(function (require, exports) {
    "use strict";

    var EventDispatcher = brackets.getModule("utils/EventDispatcher"),
        Bower           = require("src/bower/Bower"),
        ProjectManager  = require("src/bower/ProjectManager"),
        PackageFactory  = require("src/bower/PackageFactory"),
        BowerJsonManager = require("src/bower/BowerJsonManager");

    /**
     * Events definition for the bower PackageManager.
     */
    var namespace                    = ".albertinad.bracketsbower",
        CMD_INSTALL_READY            = "cmdInstallReady",
        CMD_INSTALL_BOWER_JSON_READY = "cmdInstallBowerJsonReady",
        CMD_UNINSTALL_READY          = "cmdUninstallReady",
        CMD_PRUNE_READY              = "cmdPruneReady";

    var Events = {
        CMD_INSTALL_READY: CMD_INSTALL_READY + namespace,
        CMD_INSTALL_BOWER_JSON_READY: CMD_INSTALL_BOWER_JSON_READY + namespace,
        CMD_UNINSTALL_READY: CMD_UNINSTALL_READY + namespace,
        CMD_PRUNE_READY: CMD_PRUNE_READY + namespace
    };

    var _packages  = {};

    EventDispatcher.makeEventDispatcher(exports);

    /**
     * Set the packages.
     * @private
     * @param {Array} packagesArray
     */
    function _setPackages(packagesArray) {
        _packages = {};

        packagesArray.forEach(function (pkg) {
            _packages[pkg.name] = pkg;
        });
    }

    /**
     * Remove a package by its name.
     * @private
     * @param {string} name
     */
    function _removePackage(name) {
        if (_packages[name]) {
            delete _packages[name];
        }
    }

    /**
     * Remove packages by its name.
     * @private
     * @param {Array} names
     */
    function _removePackages(names) {
        names.forEach(function (name) {
            _removePackage(name);
        });
    }

    function _getPackageByName(name) {
        return _packages[name];
    }

    /**
     * Get the current packages array.
     * @private
     * @returns {Array} packages
     */
    function _getPackagesArray() {
        var packagesArray = [];

        _.forEach(_packages, function (pkg, pkgName) {
            packagesArray.push(pkg);
        });

        return packagesArray;
    }

    function install(packageName) {
        var deferred = new $.Deferred(),
            config = ProjectManager.getConfiguration();

        Bower.installPackage(packageName, config).then(function (result) {
            deferred.resolve(result);
        }).fail(function (error) {
            deferred.reject(error);
        }).always(function () {
            exports.trigger(CMD_INSTALL_READY);
        });

        return deferred;
    }

    function installFromBowerJson() {
        var deferred = new $.Deferred(),
            existsBowerJson = ProjectManager.existsBowerJson(),
            config;

        if (!existsBowerJson) {
            return deferred.reject();
        }

        config = ProjectManager.getConfiguration();

        Bower.install(config).then(function (result) {
            deferred.resolve(result);
        }).fail(function () {
            deferred.reject();
        }).always(function () {
            exports.trigger(CMD_INSTALL_BOWER_JSON_READY);
        });

        return deferred;
    }

    function prune() {
        var deferred = new $.Deferred(),
            existsBowerJson = ProjectManager.existsBowerJson(),
            config;

        if (!existsBowerJson) {
            return deferred.reject();
        }

        config = ProjectManager.getConfiguration();

        Bower.prune(config).then(function (removedPackages) {
            var names = Object.keys(removedPackages);

            _removePackages(names);

            deferred.resolve(_getPackagesArray());
        }).fail(function () {
            deferred.reject();
        }).always(function () {
            exports.trigger(CMD_PRUNE_READY);
        });

        return deferred;
    }

    function uninstall(name) {
        var deferred = new $.Deferred(),
            config = ProjectManager.getConfiguration();

        Bower.uninstall(name, config).then(function (uninstalled) {
            _removePackage(name);

            deferred.resolve(uninstalled);
        }).fail(function (err) {
            deferred.reject(err);
        }).always(function () {
            exports.trigger(CMD_UNINSTALL_READY);
        });

        return deferred;
    }

    function getProjectDependencies() {
        var deferred = new $.Deferred(),
            config = ProjectManager.getConfiguration();

        Bower.list(config).then(function (result) {
            var packagesArray = PackageFactory.create(result.dependencies);

            _setPackages(packagesArray);

            deferred.resolve(packagesArray);
        }).fail(function (err) {
            deferred.reject(err);
        });

        return deferred;
    }

    function update(name) {
        var deferred = new $.Deferred(),
            config = ProjectManager.getConfiguration(),
            pkg = _getPackageByName(name),
            version,
            bowerJson;

        // force bower.json to exists before updating
        if (!ProjectManager.existsBowerJson()) {
            return deferred.reject();
        }

        // check if the selected package exists
        if (!pkg) {
            return deferred.reject();
        }

        bowerJson = BowerJsonManager.getBowerJson();
        version = pkg.latestVersion;

        bowerJson.updatePackageVersion(name, version).then(function () {

            return Bower.update(name, config);
        }).then(function () {

            deferred.resolve();
        }).fail(function (error) {

            deferred.reject(error);
        });

        return deferred;
    }

    function search() {
        var config = ProjectManager.getConfiguration();

        return Bower.search(config);
    }

    function listCache() {
        var config = ProjectManager.getConfiguration();

        return Bower.listCache(config);
    }

    function list() {
        var config = ProjectManager.getConfiguration();

        return Bower.list(config);
    }

    exports.install                = install;
    exports.uninstall              = uninstall;
    exports.installFromBowerJson   = installFromBowerJson;
    exports.prune                  = prune;
    exports.update                 = update;
    exports.search                 = search;
    exports.listCache              = listCache;
    exports.list                   = list;
    exports.getProjectDependencies = getProjectDependencies;
    exports.Events                 = Events;
});
