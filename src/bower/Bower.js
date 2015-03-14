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
/*global $, define */

define(function (require, exports) {
    "use strict";

    var Preferences = require("src/preferences/Preferences");

    var bowerDomain;

    /**
     * @param {NodeDomain} domain
     */
    function setDomain(domain) {
        bowerDomain = domain;
    }

    /**
     * @param {string} packageName
     * @param {object} config
     */
    function installPackage(packageName, config) {
        var deferred = new $.Deferred(),
            save = Preferences.get(Preferences.settings.QUICK_INSTALL_SAVE);

        bowerDomain.exec("install", [packageName], save, config).then(function (installedPackages) {
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

    /**
     * @param {object} config
     */
    function install(config) {
        var deferred = new $.Deferred();

        bowerDomain.exec("install", null, null, config).then(function (installedPackages) {
            var result = {
                installationDir: config.cwd,
                count: Object.keys(installedPackages).length,
                packages: installedPackages
            };

            deferred.resolve(result);
        }).fail(function (error) {
            deferred.reject(error);
        });

        return deferred.promise();
    }

    /**
     * @param {object} config
     */
    function prune(config) {
        return bowerDomain.exec("prune", config);
    }

    /**
     * @param {object} config
     */
    function list(config) {
        return bowerDomain.exec("list", config);
    }

    /**
     * @param {string|array} names
     * @param {object} config
     */
    function uninstall(names, config) {
        if (!Array.isArray(names)) {
            names = [names];
        }

        // TODO save should be stored in Preferences
        return bowerDomain.exec("uninstall", names, true, config);
    }

    /**
     * @param {string|array} names
     * @param {object} config
     */
    function update(names, config) {
        if (!Array.isArray(names)) {
            names = [names];
        }

        return bowerDomain.exec("update", names, config);
    }

    /**
     * @param {object} config
     */
    function search(config) {
        return bowerDomain.exec("search", config);
    }

    /**
     * Get the packages information from the bower cache.
     * @param {object} config
     */
    function listCache(config) {
        var promise = bowerDomain.exec("listCache", config);

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

    /**
     * @param {string} path
     */
    function getConfiguration(path) {
        return bowerDomain.exec("getConfiguration", path);
    }

    exports.setDomain        = setDomain;
    exports.getConfiguration = getConfiguration;
    exports.install          = install;
    exports.installPackage   = installPackage;
    exports.prune            = prune;
    exports.list             = list;
    exports.uninstall        = uninstall;
    exports.update           = update;
    exports.search           = search;
    exports.listCache        = listCache;
});
