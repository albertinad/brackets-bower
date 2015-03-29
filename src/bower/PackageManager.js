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

    EventDispatcher.makeEventDispatcher(exports);

    function install(packageName) {
        var deferred = new $.Deferred(),
            config = ConfigurationManager.getConfiguration(),
            project = ProjectManager.getProject();

        Bower.installPackage(packageName, config).then(function (result) {
            var packagesArray = PackageFactory.create(result.packages);

            project.addPackages(packagesArray);

            deferred.resolve(result);
        }).fail(function (error) {
            deferred.reject(error);
        });

        return deferred;
    }

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
            var packagesArray = PackageFactory.create(result.packages);

            project.addPackages(packagesArray);

            deferred.resolve(result);
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

        Bower.prune(config).then(function (removedPackages) {
            project.removePackages(Object.keys(removedPackages));

            deferred.resolve(removedPackages);
        }).fail(function () {
            deferred.reject();
        });

        return deferred;
    }

    function uninstall(name) {
        var deferred = new $.Deferred(),
            config = ConfigurationManager.getConfiguration(),
            project = ProjectManager.getProject();

        Bower.uninstall(name, config).then(function (uninstalled) {
            project.removePackages(Object.keys(uninstalled));

            deferred.resolve(uninstalled);
        }).fail(function (err) {
            deferred.reject(err);
        });

        return deferred;
    }

    function loadProjectDependencies() {
        var deferred = new $.Deferred(),
            config = ConfigurationManager.getConfiguration(),
            project = ProjectManager.getProject();

        Bower.list(config).then(function (result) {
            var packagesArray = PackageFactory.create(result.dependencies);

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
            // TODO update model
            return Bower.update(name, config);
        }).then(function () {

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
    exports.search                  = search;
    exports.listCache               = listCache;
    exports.list                    = list;
    exports.loadProjectDependencies = loadProjectDependencies;
});
