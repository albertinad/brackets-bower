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

define(function (require, exports, module) {
    "use strict";

    var BowerMetadata  = require("src/bower/metadata/BowerMetadata"),
        DependencyType = require("src/bower/PackageOptions").DependencyType;

    /**
     * Bower json file constructor.
     * @param {path} path
     * @constructor
     */
    function BowerJson(path, appName) {
        BowerMetadata.call(this, "bower.json", path);

        /** @private */
        this._appName = appName;
        /** @private*/
        this._dependencies = null;
    }

    BowerJson.prototype = Object.create(BowerMetadata.prototype);
    BowerJson.prototype.constructor = BowerJson;
    BowerJson.prototype.parentClass = BowerMetadata.prototype;

    BowerJson.prototype.create = function (data) {
        var deferred = new $.Deferred(),
            pkgMeta = (Array.isArray(data)) ? this._createPackageMetadata(data) : this._getDefaultData(),
            content = JSON.stringify(pkgMeta, null, 4);

        this.saveContent(content).then(function () {
            deferred.resolve();
        }).fail(function (error) {
            deferred.reject(error);
        });

        return deferred;
    };

    /**
     * Get the dependencies and devDependencies defined in the bower.json.
     * @param {$.Deferred}
     */
    BowerJson.prototype.getAllDependencies = function () {
        var deferred = new $.Deferred();

        this.read().then(function (result) {

            var content,
                deps = {
                    dependencies: {},
                    devDependencies: {}
                };

            try {
                content = JSON.parse(result);

                if (content.dependencies) {
                    deps.dependencies = content.dependencies;
                }

                if (content.dependencies) {
                    deps.devDependencies = content.devDependencies;
                }

                deferred.resolve(deps);
            } catch (error) {
                deferred.reject(error);
            }
        }).fail(function (error) {
            deferred.reject(error);
        });

        return deferred.promise();
    };

    /**
     * Update the given package data: version and/or dependency type.
     * @param {object} data Key-value object containing the package data to update.
     * @return {$.Deferred}
     */
    BowerJson.prototype.updatePackageInfo = function (name, data) {
        var that = this,
            deferred = new $.Deferred(),
            version,
            dependencyType;

        if (!data) {
            // there's nothing to update
            return deferred.reject();
        }

        version = data.version;
        dependencyType = data.dependencyType;

        if (!version && (typeof dependencyType !== "number")) {
            // there's nothing to update
            return deferred.reject();
        }

        this.read().then(function (result) {

            var content = JSON.parse(result),
                deps = content.dependencies,
                devDeps = content.devDependencies,
                currentDeps,
                newContent;

            // get the current dependencies object where the package belongs
            if (deps && deps[name]) {
                currentDeps = deps;
            } else if (devDeps && devDeps[name]) {
                currentDeps = devDeps;
            }

            if (currentDeps) {
                // update version
                if (version) {
                    currentDeps[name] = version;
                }

                // update dependency type
                that._updateDependencyType(name, dependencyType, content, currentDeps);

                newContent = JSON.stringify(content, null, 4);

                return that.saveContent(newContent);
            } else {
                deferred.reject();
            }
        }).then(function () {

            deferred.resolve();
        }).fail(function (error) {

            deferred.reject(error);
        });

        return deferred;
    };

    /**
     * @private
     */
    BowerJson.prototype._updateDependencyType = function (name, type, content, currentDeps) {

        if (type === DependencyType.PRODUCTION) {

            if (content.dependencies && content.dependencies[name]) {
                // the package is already a production dependency
                return;
            }

            if (!content.dependencies) {
                content.dependencies = {};
            }

            content.dependencies[name] = currentDeps[name];

            delete currentDeps[name];
        } else if (type === DependencyType.DEVELOPMENT) {

            if (content.devDependencies && content.devDependencies[name]) {
                // the package is already a development dependency
                return;
            }

            if (!content.devDependencies) {
                content.devDependencies = {};
            }

            content.devDependencies[name] = currentDeps[name];

            delete currentDeps[name];
        }
    };

    /**
     * Create the bower.json file content using the current project dependencies.
     * @param {Array} packages
     * @return {object}
     */
    BowerJson.prototype._createPackageMetadata = function (packages) {
        var pkgMeta = {
            name: this._appName,
            dependencies: {}
        };

        function addToDevDeps(name, version) {
            if (!pkgMeta.devDependencies) {
                pkgMeta.devDependencies = {};
            }

            pkgMeta.devDependencies[name] = version;
        }

        packages.forEach(function (pkg) {
            var name = pkg.name,
                version = pkg.version;

            if (pkg.isProductionDependency()) {
                pkgMeta.dependencies[name] = version;
            } else {
                addToDevDeps(name, version);
            }

        });

        return pkgMeta;
    };

    /**
     * Create the default bower.json content.
     * @return {object}
     */
    BowerJson.prototype._getDefaultData = function () {
        return {
            name: this._appName || "your-app-name",
            dependencies: {},
            devDependencies: {}
        };
    };

    module.exports = BowerJson;
});
