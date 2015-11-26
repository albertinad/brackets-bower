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

    var BowerErrors  = require("src/bower/BowerErrors"),
        CommandsTask = require("src/bower/CommandsTask");

    var bowerDomain,
        commandsTask = new CommandsTask();

    /**
     * @param {NodeDomain} domain
     */
    function setDomain(domain) {
        bowerDomain = domain;
    }

    /**
     * @param {string} packageName
     * @param {object} options
     * @param {object} config
     */
    function installPackage(packageName, options, config) {
        var deferred = new $.Deferred(),
            taskPromise,
            args;

        options = options || {};

        args = ["install", [packageName], options, config];

        taskPromise = commandsTask.addTask(bowerDomain.exec, args, bowerDomain);

        taskPromise.then(function (installedPackages) {
            var result = {
                count: Object.keys(installedPackages).length,
                packages: installedPackages
            };
            deferred.resolve(result);
        }).fail(function (error) {
            var err = BowerErrors.getError(error);
            console.warn("[brackets-bower] Error installing package " + packageName, JSON.stringify(err, null, 2), options);
            deferred.reject(err);
        });

        return deferred.promise();
    }

    /**
     * @param {object} config
     */
    function install(config) {
        var deferred = new $.Deferred(),
            taskPromise = commandsTask.addTask(bowerDomain.exec, ["install", null, {}, config], bowerDomain);

        taskPromise.then(function (installedPackages) {
            var result = {
                count: Object.keys(installedPackages).length,
                packages: installedPackages
            };

            deferred.resolve(result);
        }).fail(function (error) {
            var err = BowerErrors.getError(error);
            console.warn("[brackets-bower] Error installing from bower.json", JSON.stringify(err, null, 2));
            deferred.reject(err);
        });

        return deferred.promise();
    }

    /**
     * @param {object} config
     */
    function prune(config) {
        var deferred = new $.Deferred(),
            taskPromise = commandsTask.addTask(bowerDomain.exec, ["prune", config], bowerDomain);

        taskPromise.then(function (result) {
            deferred.resolve(result);
        }).fail(function (error) {
            deferred.reject(BowerErrors.getError(error));
        });

        return deferred.promise();
    }

    /**
     * @param {string|array} names
     * @param {object} options
     * @param {object} config
     */
    function uninstall(names, options, config) {
        var deferred = new $.Deferred(),
            taskPromise;

        options = options || {};

        if (!Array.isArray(names)) {
            names = [names];
        }

        taskPromise = commandsTask.addTask(bowerDomain.exec, ["uninstall", names, options, config], bowerDomain);

        taskPromise.then(function (result) {
            deferred.resolve(result);
        }).fail(function (error) {
            deferred.reject(BowerErrors.getError(error));
        });

        return deferred.promise();
    }

    /**
     * @param {string|array} names
     * @param {object} config
     */
    function update(names, config) {
        var deferred = new $.Deferred(),
            taskPromise;

        if (!Array.isArray(names)) {
            names = [names];
        }

        taskPromise = commandsTask.addTask(bowerDomain.exec, ["update", names, config], bowerDomain);

        taskPromise.then(function (result) {
            deferred.resolve(result);
        }).fail(function (error) {
            deferred.reject(BowerErrors.getError(error));
        });

        return deferred.promise();
    }

    /**
     * @param {object} config
     */
    function list(config) {
        var deferred = new $.Deferred();

        bowerDomain.exec("list", config).then(function (result) {
            deferred.resolve(result);
        }).fail(function (error) {
            deferred.reject(BowerErrors.getError(error));
        });

        return deferred.promise();
    }

    /**
     * Get the packages information from the bower cache.
     * @param {object} config
     */
    function listCache(config) {
        var deferred = new $.Deferred();

        bowerDomain.exec("listCache", config).then(function (pkgs) {
            // the packages returned from "bower cache list" doesn't have
            // the "name" property, so we added it
            pkgs.forEach(function (item) {
                var name = item.pkgMeta.name;

                item.name = name;
            });

            deferred.resolve(pkgs);
        }).fail(function (error) {
            deferred.reject(BowerErrors.getError(error));
        });

        return deferred.promise();
    }

    /**
     * @param {string} name
     * @param {object} config
     */
    function info(name, config) {
        var deferred = new $.Deferred();

        bowerDomain.exec("info", name, config).then(function (result) {
            deferred.resolve(result);
        }).fail(function (error) {
            deferred.reject(BowerErrors.getError(error));
        });

        return deferred.promise();
    }

    /**
     * @param {object} config
     */
    function search(config) {
        var deferred = new $.Deferred();

        bowerDomain.exec("search", config).then(function (result) {
            deferred.resolve(result);
        }).fail(function (error) {
            deferred.reject(BowerErrors.getError(error));
        });

        return deferred.promise();
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
    exports.info             = info;
    exports.search           = search;
    exports.listCache        = listCache;
});
