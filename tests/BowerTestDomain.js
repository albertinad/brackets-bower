/*
 * Copyright (c) 2013 Narciso Jaramillo. All rights reserved.
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
maxerr: 50, node: true */

(function () {
    "use strict";

    var DOMAIN_NAME = "bower-test";

    var errorMessage = "BowerTestDomain error message";

    var defaultCommandExecution = {
        resultType: "success",
        bowerRcExists: false,
        bowerJsonExists: true,
    };

    var commandExecution;

    function _setTestData(data) {
        commandExecution = data;
    }

    function _resetTestData() {
        commandExecution = undefined;
    }

    function _cmdGetPackages(config, cb) {
        var resultType,
            result;

        if (commandExecution && commandExecution.search) {
            var search = commandExecution.search;

            resultType = search.resultType;
            result = search.result;
        } else {
            resultType = defaultCommandExecution.resultType;
            // let node to cache the value, since this file must not change on runtime
            result = require("./data/search.json");
        }

        if (resultType === "success") {
            cb(null, result);
        } else {
            cb(errorMessage, null);
        }
    }

    function _cmdGetPackagesFromCache(config, cb) {
        var resultType,
            result;

        if (commandExecution && commandExecution.cacheList) {
            var cacheList = commandExecution.cacheList;

            resultType = cacheList.resultType;
            result = cacheList.result;
        } else {
            resultType = defaultCommandExecution.resultType;
            // let node to cache the value, since this file must not change on runtime
            result = require("./data/cache.list.json");
        }

        if (resultType === "success") {
            cb(null, result);
        } else {
            cb(null, []);
        }
    }

    function _cmdInstall(path, names, save, config, cb) {
        var resultType,
            result,
            bowerJsonExists,
            data = {};

        if (commandExecution && commandExecution.install) {
            var install = commandExecution.install;

            resultType = install.resultType;
            bowerJsonExists = install.bowerJsonExists;
        } else {
            resultType = defaultCommandExecution.resultType;
            bowerJsonExists = defaultCommandExecution.bowerJsonExists;
        }

        if (resultType === "success") {
            if (names && names.length === 1) {
                result = require("./data/install.package.json");

                var installedPackage = result[names[0]];

                data.installationDir = installedPackage.canonicalDir;
                data.count = 1;
            } else {
                result = require("./data/install.packages.json");

                data.installationDir = path;
                data.count = Object.keys(result).length;
            }

            data.packages = result;

            cb(null, data);
        } else {
            cb(errorMessage, null);
        }
    }

    function _cmdPrune(path, config, cb) {
        var resultType,
            result,
            bowerJsonExists;

        if (commandExecution && commandExecution.prune) {
            var prune = commandExecution.prune;

            resultType = prune.resultType;
            bowerJsonExists = prune.bowerJsonExists;
            result = prune.result;
        } else {
            resultType = defaultCommandExecution.resultType;
            bowerJsonExists = defaultCommandExecution.bowerJsonExists;
            result = true;
        }

        if (resultType === "success" && bowerJsonExists) {
            cb(null, result);
        } else {
            cb(errorMessage, null);
        }
    }

    function _cmdList(path, config, cb) {}

    function init(domainManager) {
        if (!domainManager.hasDomain(DOMAIN_NAME)) {
            domainManager.registerDomain(DOMAIN_NAME, {
                major: 0,
                minor: 1
            });
        }

        domainManager.registerCommand(
            DOMAIN_NAME,
            "getPackages",
            _cmdGetPackages,
            true
        );

        domainManager.registerCommand(
            DOMAIN_NAME,
            "getPackagesFromCache",
            _cmdGetPackagesFromCache,
            true
        );

        domainManager.registerCommand(
            DOMAIN_NAME,
            "install",
            _cmdInstall,
            true
        );

        domainManager.registerCommand(
            DOMAIN_NAME,
            "prune",
            _cmdPrune,
            true
        );

        domainManager.registerCommand(
            DOMAIN_NAME,
            "list",
            _cmdList,
            true
        );

        // test APIs

        domainManager.registerCommand(
            DOMAIN_NAME,
            "setTestData",
            _setTestData,
            false
        );

        domainManager.registerCommand(
            DOMAIN_NAME,
            "resetTestData",
            _resetTestData,
            false
        );
    }

    exports.init = init;
}());
