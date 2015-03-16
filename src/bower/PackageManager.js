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

    var Bower          = require("src/bower/Bower"),
        ProjectManager = require("src/bower/ProjectManager"),
        PackageFactory = require("src/bower/PackageFactory");

    var _packages  = [];

    function install(packageName) {
        var deferred = new $.Deferred(),
            config = ProjectManager.getConfiguration();

        Bower.installPackage(packageName, config).then(function (result) {
            deferred.resolve(result);
        }).fail(function (error) {
            deferred.reject(error);
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

        Bower.prune(config)
            .then(function () {
                deferred.resolve();
            })
            .fail(function () {
                deferred.reject();
            });

        return deferred;
    }

    function uninstall(name) {
        var deferred = new $.Deferred(),
            config = ProjectManager.getConfiguration();

        Bower.uninstall(name, config).then(function (uninstalled) {
            deferred.resolve(uninstalled);
        }).fail(function (err) {
            deferred.reject(err);
        });

        return deferred;
    }

    function getInstalledDependencies() {
        var deferred = new $.Deferred(),
            config = ProjectManager.getConfiguration();

        Bower.list(config).then(function (result) {
            _packages = PackageFactory.create(result.dependencies);

            deferred.resolve(_packages);
        }).fail(function (err) {
            deferred.reject(err);
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

    exports.install                  = install;
    exports.uninstall                = uninstall;
    exports.installFromBowerJson     = installFromBowerJson;
    exports.prune                    = prune;
    exports.search                   = search;
    exports.listCache                = listCache;
    exports.list                     = list;
    exports.getInstalledDependencies = getInstalledDependencies;
});
