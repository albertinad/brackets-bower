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
/*global $, define, brackets */

define(function (require, exports) {
    "use strict";

    var ProjectManager       = brackets.getModule("project/ProjectManager"),
        Bower                = require("src/bower/Bower"),
        BowerJsonManager     = require("src/bower/BowerJsonManager"),
        ConfigurationManager = require("src/bower/ConfigurationManager"),
        PackageFactory       = require("src/bower/PackageFactory");

    var _packages  = [];

    function installFromBowerJson() {
        var deferred = new $.Deferred(),
            bowerJson = BowerJsonManager.getBowerJson(),
            config;

        if (bowerJson === null) {
            return deferred.reject();
        }

        config = _getConfiguration(true);

        Bower.install(config).then(function (result) {
            deferred.resolve(result);
        }).fail(function () {
            deferred.reject();
        });

        return deferred;
    }

    function prune() {
        var deferred = new $.Deferred(),
            bowerJson = BowerJsonManager.getBowerJson(),
            config;

        if (bowerJson === null) {
            return deferred.reject();
        }

        config = _getConfiguration(true);

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
            config = _getConfiguration();

        Bower.uninstall(name, config).then(function (uninstalled) {
            deferred.resolve(uninstalled);
        }).fail(function (err) {
            deferred.reject(err);
        });

        return deferred;
    }

    function getInstalledDependencies() {
        var deferred = new $.Deferred(),
            config = _getConfiguration();

        Bower.list(config).then(function (result) {
            _packages = PackageFactory.create(result.dependencies);

            deferred.resolve(_packages);
        }).fail(function (err) {
            deferred.reject(err);
        });

        return deferred;
    }

    // TODO move to configmanager
    /**
     * @param {string} path
     * @private
     */
    function _getConfiguration(forceBowerJson) {
        var config = ConfigurationManager.getConfiguration(),
            bowerJson = BowerJsonManager.getBowerJson(),
            path;

        if (forceBowerJson) {
            path = bowerJson.ProjectPath;
        } else {
            if (bowerJson !== null) {
                path = bowerJson.ProjectPath;
            } else {
                path = ProjectManager.getProjectRoot().fullPath;
            }
        }

        config.cwd = path;

        return config;
    }

    exports.installFromBowerJson = installFromBowerJson;
    exports.uninstall            = uninstall;
    exports.prune                = prune;
    exports.getInstalledDependencies = getInstalledDependencies;
});
