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

    var bowerError;

    var defaultCommandExecution = {
        resultType: "success",
        bowerRcExists: false,
        bowerJsonExists: true
    };

    var commandExecution;

    function _setTestData(data) {
        commandExecution = data;
    }

    function _resetTestData() {
        commandExecution = undefined;
    }

    function _cmdSearch(config, cb) {
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
            cb(bowerError, null);
        }
    }

    function _cmdListCache(config, cb) {
        var resultType,
            result;

        if (commandExecution && commandExecution.listCache) {
            var listCache = commandExecution.listCache;

            resultType = listCache.resultType;
            result = listCache.result;
        } else {
            resultType = defaultCommandExecution.resultType;
            // let node to cache the value, since this file must not change on runtime
            result = require("./data/list.cache.json");
        }

        if (resultType === "success") {
            cb(null, result);
        } else {
            cb(null, []);
        }
    }

    function _cmdInstall(names, options, config, cb) {
        var resultType,
            result,
            bowerJsonExists;

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
            } else {
                result = require("./data/install.packages.json");
            }

            cb(null, result);
        } else {
            cb(bowerError, null);
        }
    }

    function _cmdUninstall(names, options, config, cb) {
        var resultType,
            packagesExists,
            result = {};

        if (commandExecution && commandExecution.uninstall) {
            var uninstall = commandExecution.uninstall;

            resultType = uninstall.resultType;
            packagesExists = uninstall.packagesExists;
        } else {
            resultType = defaultCommandExecution.resultType;
            packagesExists = true;
        }

        if (resultType === "success" && packagesExists) {
            names.forEach(function (name) {
                result[name] = "/bowertestuser/bower_components/" + name;
            });

            cb(null, result);
        } else {
            cb(bowerError, null);
        }
    }

    function _cmdPrune(config, cb) {
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
            cb(bowerError, null);
        }
    }

    function _cmdList(config, cb) {
        var resultType,
            result;

        if (commandExecution && commandExecution.list) {
            var list = commandExecution.list;

            resultType = list.resultType;
            result = list.result;
        } else {
            resultType = defaultCommandExecution.resultType;
            // let node to cache the value, since this file must not change on runtime
            result = require("./data/list.json");
        }

        if (resultType === "success") {
            cb(null, result);
        } else {
            cb(bowerError, null);
        }
    }

    function _cmdInfo(name, config, cb) {
        var resultType,
            result;

        if (commandExecution && commandExecution.info) {
            var info = commandExecution.info;

            resultType = info.resultType;
            result = info.result;
        } else {
            resultType = defaultCommandExecution.resultType;
            // let node to cache the value, since this file must not change on runtime
            result = require("./data/info.json");
        }

        if (resultType === "success" && name) {
            cb(null, result);
        } else {
            cb(bowerError, null);
        }
    }

    function init(domainManager) {
        if (!domainManager.hasDomain(DOMAIN_NAME)) {
            domainManager.registerDomain(DOMAIN_NAME, {
                major: 0,
                minor: 1
            });
        }

        domainManager.registerCommand(DOMAIN_NAME, "search", _cmdSearch, true);
        domainManager.registerCommand(DOMAIN_NAME, "listCache", _cmdListCache, true);
        domainManager.registerCommand(DOMAIN_NAME, "install", _cmdInstall, true);
        domainManager.registerCommand(DOMAIN_NAME, "uninstall", _cmdUninstall, true);
        domainManager.registerCommand(DOMAIN_NAME, "prune", _cmdPrune, true);
        domainManager.registerCommand(DOMAIN_NAME, "list", _cmdList, true);
        domainManager.registerCommand(DOMAIN_NAME, "info", _cmdInfo, true);

        // test APIs

        domainManager.registerCommand(DOMAIN_NAME, "setTestData", _setTestData, false);
        domainManager.registerCommand(DOMAIN_NAME, "resetTestData", _resetTestData, false);

        bowerError = new Error("BowerDomainMock error message");
        bowerError.code = "BOWER_DOMAIN_MOCK_ERROR";
        bowerError.error = new Error("BowerDomainMock wrapped error");
        bowerError.error.code = "BOWER_DOMAIN_MOCK_ERROR";
        bowerError.error.message = "BowerDomain mock error message";
    }

    exports.init = init;
}());
