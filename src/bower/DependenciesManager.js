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

    var ProjectManager = brackets.getModule("project/ProjectManager"),
        FileSystem     = brackets.getModule("filesystem/FileSystem"),
        AppInit        = brackets.getModule("utils/AppInit"),
        EventEmitter   = require("src/events/EventEmitter"),
        Event          = require("src/events/Events"),
        FileUtils      = require("src/utils/FileUtils"),
        BowerJson      = require("src/bower/BowerJson"),
        Bower          = require("src/bower/Bower");

    var _bowerJson = null,
        _reloadedCallback;

    /**
     * Create the bower.json file at the given absolute path. If any path is provided,
     * it use the current active project as the default absolute path.
     * @param {string} path The absolute path where to create the bower.json file.
     */
    function createBowerJson(path) {
        var appName;

        if (!path || path.trim() === "") {
            var currentProject = ProjectManager.getProjectRoot();

            if (currentProject) {
                path = currentProject.fullPath;
                appName = currentProject.name;
            } else {
                var promise = new $.Deferred();
                promise.reject();

                return promise;
            }
        }

        _bowerJson = new BowerJson(path, appName);

        return _bowerJson.create();
    }

    /**
     * Deletes the active bower.json file if it exists.
     */
    function removeBowerJson() {
        var deferred = new $.Deferred();

        if (_bowerJson !== null) {
            _bowerJson.remove().done(function () {
                _bowerJson = null;

                deferred.resolve();
            });
        } else {
            deferred.resolve();
        }

        return deferred;
    }

    /**
     * Get the current active BowerJson object. Null means there's
     * no BowerJson for the project.
     * @returns {BowerJson} Current active BowerJson object.
     */
    function getBowerJson() {
        return _bowerJson;
    }

    /**
     * Open the bower.json in the editor, it it exists.
     */
    function open() {
        if (_bowerJson !== null) {
            _bowerJson.open();
        }
    }

    /**
     * Checks if the file exists in the given directory. If the directory
     * is not set, the root project directory is taken as the default directory.
     * @param {string= path
     * @return {Promise}
     */
    function findBowerJson(path) {
        if (!path) {
            var promise = new $.Deferred();
            promise.reject();

            return promise;
        }

        path += "bower.json";

        return FileUtils.exists(path);
    }

    function installFromBowerJson() {
        var deferred = new $.Deferred();

        if (_bowerJson === null) {
            deferred.reject();

            return deferred;
        }

        Bower.install(_bowerJson.ProjectPath).then(function () {
            // TODO improve this...
            window.setTimeout(function () {
                ProjectManager.showInTree(FileSystem.getDirectoryForPath(_bowerJson.ProjectPath));
            }, 1000);

            deferred.resolve();
        }).fail(function () {
            deferred.reject();
        });

        return deferred;
    }

    function prune() {
        var deferred = new $.Deferred();

        if (_bowerJson === null) {
            deferred.reject();

            return deferred;
        }

        Bower.prune(_bowerJson.ProjectPath)
            .then(function () {
                // TODO improve this...
                window.setTimeout(function () {
                    ProjectManager.showInTree(FileSystem.getDirectoryForPath(_bowerJson.ProjectPath));
                }, 1000);

                deferred.resolve();
            })
            .fail(function () {
                deferred.reject();
            });

        return deferred;
    }

    function onBowerJsonReloaded(callback) {
        _reloadedCallback = callback;
    }

    function _notifyBowerJsonReloaded() {
        if (typeof _reloadedCallback === "function") {
            _reloadedCallback();
        }
    }

    function _loadBowerJsonAtCurrentProject() {
        // search for the bower.json file if it exists
        var project = ProjectManager.getProjectRoot(),
            path,
            name;

        if (project) {
            path = project.fullPath;
            name = project.name;
        }

        findBowerJson(path).then(function () {
            _bowerJson = new BowerJson(path, name);
        }).fail(function () {
            _bowerJson = null;
        }).always(function () {
            _notifyBowerJsonReloaded();
        });
    }

    AppInit.appReady(function () {
        _loadBowerJsonAtCurrentProject();

        EventEmitter.on(Event.PROJECT_CHANGE, _loadBowerJsonAtCurrentProject);
    });

    exports.getBowerJson         = getBowerJson;
    exports.createBowerJson      = createBowerJson;
    exports.removeBowerJson      = removeBowerJson;
    exports.findBowerJson        = findBowerJson;
    exports.open                 = open;
    exports.installFromBowerJson = installFromBowerJson;
    exports.prune                = prune;
    exports.onBowerJsonReloaded  = onBowerJsonReloaded;
});
