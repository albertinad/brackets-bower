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

define(function (require, exports) {
    "use strict";

    var NodeDomain           = brackets.getModule("utils/NodeDomain"),
        Preferences          = require("src/preferences/Preferences"),
        ConfigurationManager = require("src/bower/ConfigurationManager");

    var bowerDomain;

    function init(domainPath) {
        bowerDomain = new NodeDomain("bower", domainPath);
    }

    function installPackage(path, packageName) {
        var deferred = new $.Deferred(),
            config = ConfigurationManager.getConfiguration(),
            save = Preferences.get(Preferences.settings.QUICK_INSTALL_SAVE);

        bowerDomain.exec("install", path, [packageName], save, config).then(function (installedPackages) {
            var installedPackage = installedPackages[packageName],
                result = {
                    installationDir: installedPackage.canonicalDir,
                    count: 1,
                    packages: installedPackages
                };

            deferred.resolve(result);
        }).fail(function (error) {
            deferred.reject(error);
        });

        return deferred.promise();
    }

    function install(path) {
        var deferred = new $.Deferred(),
            config = ConfigurationManager.getConfiguration();

        bowerDomain.exec("install", path, null, null, config).then(function (installedPackages) {
            var result = {
                installationDir: path,
                count: Object.keys(installedPackages).length,
                packages: installedPackages
            };

            deferred.resolve(result);
        }).fail(function (error) {
            deferred.reject(error);
        });

        return deferred.promise();
    }

    function prune(path) {
        var config = ConfigurationManager.getConfiguration();

        return bowerDomain.exec("prune", path, config);
    }

    function list(path) {
        var config = ConfigurationManager.getConfiguration();

        return bowerDomain.exec("list", path, config);
    }

    function search() {
        var config = ConfigurationManager.getConfiguration();

        return bowerDomain.exec("getPackages", config);
    }

    /**
     * Get the packages information from the bower cache.
     */
    function listCache() {
        var config = ConfigurationManager.getConfiguration(),
            promise = bowerDomain.exec("getPackagesFromCache", config);

        // the packages returned from "bower cache list" doesn't have
        // the "name" property, so we added it
        promise.then(function (pkgs) {
            pkgs.forEach(function (item) {
                var name = item.pkgMeta.name;

                item.name = name;
            });

            return pkgs;
        });

        return promise;
    }

    function getConfiguration(path) {
        return bowerDomain.exec("getConfiguration", path);
    }

    function executeCommand(cmd, args) {
        return bowerDomain.exec("execCommand", cmd, args);
    }

    /**
     * Use this function only in tests.
     */
    function _setBower(nodeDomain) {
        bowerDomain = nodeDomain;
    }

    exports.init             = init;
    exports.install          = install;
    exports.installPackage   = installPackage;
    exports.prune            = prune;
    exports.list             = list;
    exports.search           = search;
    exports.listCache        = listCache;
    exports.getConfiguration = getConfiguration;
    exports.executeCommand   = executeCommand;

    // API for testing

    exports._setBower        = _setBower;
});
