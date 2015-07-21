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

define(function (require, exports, module) {
    "use strict";

    var _              = brackets.getModule("thirdparty/lodash"),
        BowerMetadata  = require("src/metadata/BowerMetadata"),
        Package        = require("src/project/Package"),
        FileUtils      = require("src/utils/FileUtils");

    var DependencyType = Package.DependencyType;

    /**
     * Bower json file constructor.
     * @param {string} path
     * @param {string} appName
     * @param {Project} project
     * @constructor
     */
    function BowerJson(project) {
        BowerMetadata.call(this, "bower.json", project);

        /** @private */
        this._appName = this._project.name;
        /** @private*/
        this._deps = {};
    }

    BowerJson.prototype = Object.create(BowerMetadata.prototype);
    BowerJson.prototype.constructor = BowerJson;
    BowerJson.prototype.parentClass = BowerMetadata.prototype;

    BowerJson.prototype.create = function (data) {
        var that = this,
            deferred = new $.Deferred(),
            pkgMeta = (Array.isArray(data)) ? this._createPackageMetadata(data) : this._getDefaultData();

        this.saveContent(this._serialize(pkgMeta)).then(function () {
            // cache the dependencies
            that._updateCacheDependencies(pkgMeta);

            deferred.resolve();
        }).fail(function (error) {
            deferred.reject(error);
        });

        return deferred;
    };

    /**
     * Get the dependencies and devDependencies defined in the bower.json.
     * @return {object}
     */
    BowerJson.prototype.getAllDependencies = function () {
        return this._deps;
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
                currentDeps;

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

                return that.saveContent(that._serialize(content)).then(function () {
                    if (that._hasDependenciesChanged(content)) {
                        that._updateCacheDependencies(content);
                    }
                });
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
     * @param {string} name
     * @param {string} version
     */
    BowerJson.prototype.addDependencyToProduction = function (name, version) {
        return this._addDependency(name, version, true);
    };

    /**
     * @param {string} name
     * @param {string} version
     */
    BowerJson.prototype.addDependencyToDevelopment = function (name, version) {
        return this._addDependency(name, version, false);
    };

    /**
     * @param {string} name
     */
    BowerJson.prototype.removeDependency = function (name) {
        var that = this,
            deferred = new $.Deferred();

        this.read().then(function (result) {

            var content = JSON.parse(result),
                deps = content.dependencies,
                devDeps = content.devDependencies;

            if (deps && deps[name]) {
                delete deps[name];
            } else if (devDeps && devDeps[name]) {
                delete devDeps[name];
            }

            return that.saveContent(that._serialize(content));

        }).then(function () {

            deferred.resolve();
        }).fail(function (error) {

            deferred.reject(error);
        });

        return deferred;
    };

    /**
     * @param {object}
     *        missing: packages to remove from bower.json
     *        untracked: packages to add to bower.json to production dependencies.
     *        versionOutOfSync: packages to update version in bower.json.
     */
    BowerJson.prototype.syncDependencies = function (packagesData) {
        var that = this,
            deferred = new $.Deferred(),
            missing,
            untracked,
            versionOutOfSync;

        if (!packagesData) {
            // there's nothing to sync
            return deferred.reject();
        }

        missing = packagesData.missing;
        untracked = packagesData.untracked;
        versionOutOfSync = packagesData.versionOutOfSync;

        if (missing.length === 0 && untracked.length === 0 && versionOutOfSync.length === 0) {
            // there's nothing to update
            return deferred.reject();
        }

        this.read().then(function (result) {

            var content = JSON.parse(result),
                deps = content.dependencies,
                devDeps = content.devDependencies;

            missing.forEach(function (pkg) {
                var name = pkg.name;

                if (deps && deps[name]) {
                    delete deps[name];
                } else if (devDeps && devDeps[name]) {
                    delete devDeps[name];
                }
            });

            untracked.forEach(function (pkg) {
                var name = pkg.name;

                if (!deps) {
                    content.dependencies = {};
                    deps = content.dependencies;
                }

                if (!deps[name]) {
                    deps[name] = Package.getDefaultSemverVersion(pkg.version);
                }
            });

            versionOutOfSync.forEach(function (pkg) {
                var name = pkg.name,
                    deps;

                if (pkg.isProductionDependency()) {
                    if (!content.dependencies) {
                        content.dependencies = {};
                    }

                    deps = content.dependencies;
                } else {
                    if (!content.devDependencies) {
                        content.devDependencies = {};
                    }

                    deps = content.devDependencies;
                }

                deps[name] = Package.getDefaultSemverVersion(pkg.version);
            });

            return that.saveContent(that._serialize(content));

        }).then(function () {

            deferred.resolve();
        }).fail(function (error) {

            deferred.reject(error);
        });

        return deferred;
    };

    BowerJson.prototype.onContentChanged = function () {
        var that = this;

        this._loadAllDependencies().then(function (updated) {
            if (updated) {
                that._notifyBowerJsonChanged();
            }
        }).fail(function () {
            // do nothing
        });
    };

    /**
     * @param {string} name
     * @param {string} version
     * @param {boolean} isProduction
     * @private
     */
    BowerJson.prototype._addDependency = function (name, version, isProduction) {
        var that = this,
            deferred = new $.Deferred();

        this.read().then(function (result) {

            var content = JSON.parse(result),
                deps;

            if (isProduction) {
                if (!content.dependencies) {
                    content.dependencies = {};
                }

                deps = content.dependencies;
            } else {
                if (!content.devDependencies) {
                    content.devDependencies = {};
                }

                deps = content.devDependencies;
            }

            deps[name] = version;

            return that.saveContent(that._serialize(content));

        }).then(function () {

            deferred.resolve();
        }).fail(function (error) {

            deferred.reject(error);
        });

        return deferred;
    };

    /**
     * Get the dependencies and devDependencies defined in the bower.json.
     * @param {$.Deferred}
     * @private
     */
    BowerJson.prototype._loadAllDependencies = function () {
        var that = this,
            deferred = new $.Deferred();

        this.read().then(function (result) {
            var content,
                hasChanged;

            try {
                content = JSON.parse(result);
                hasChanged = that._hasDependenciesChanged(content);

                if (hasChanged) {
                    that._updateCacheDependencies(content);
                }

                deferred.resolve(hasChanged);
            } catch (error) {
                that._deps = {};

                deferred.reject(error);
            }
        }).fail(function (error) {
            deferred.reject(error);
        });

        return deferred.promise();
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
     * @private
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
     * @private
     */
    BowerJson.prototype._getDefaultData = function () {
        return {
            name: this._appName || "your-app-name",
            dependencies: {},
            devDependencies: {}
        };
    };

    /**
     * Check if exists any different between the given depenencies object and the current.
     * @param {object} meta Object with the new dependencies and devDependencies configuration.
     * @return {boolean} true if exists any difference, otherwise false.
     * @private
     */
    BowerJson.prototype._hasDependenciesChanged = function (meta) {
        var isProdNotEqual = !_.isEqual(meta.dependencies, this._deps.dependencies),
            isDevNotEqual = !_.isEqual(meta.devDependencies, this._deps.devDependencies);

        return (isProdNotEqual || isDevNotEqual);
    };

    /**
     * Update the cached dependencies object with the given by parameters.
     * @param {object} meta Object with the new dependencies and devDependencies configuration.
     * @private
     */
    BowerJson.prototype._updateCacheDependencies = function (meta) {
        this._deps = {};

        if (meta.dependencies) {
            this._deps.dependencies = meta.dependencies;
        } else {
            this._deps.dependencies = {};
        }

        if (meta.devDependencies) {
            this._deps.devDependencies = meta.devDependencies;
        } else {
            this._deps.devDependencies = {};
        }
    };

    /**
     * @private
     */
    BowerJson.prototype._notifyBowerJsonChanged = function () {
        this._project.bowerJsonChanged();
    };

    /**
     * @private
     */
    BowerJson.prototype._serialize = function (data) {
        return JSON.stringify(data, null, 4);
    };

    /**
     * Checks if the file exists in the given directory. If the directory
     * is not set, the root project directory is taken as the default directory.
     * @param {string} path
     * @return {$.Deferred}
     */
    BowerJson.findInPath = function (path) {
        return FileUtils.exists(path + "bower.json");
    };

    module.exports = BowerJson;
});
