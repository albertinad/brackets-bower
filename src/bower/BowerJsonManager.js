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

    var ProjectManager   = brackets.getModule("project/ProjectManager"),
        FileSystem       = brackets.getModule("filesystem/FileSystem"),
        AppInit          = brackets.getModule("utils/AppInit"),
        FileSystemEvents = require("src/events/FileSystemEvents"),
        FileUtils        = require("src/utils/FileUtils"),
        BowerJson        = require("src/bower/metadata/BowerJson");

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
                return $.Deferred().reject();
            }
        }

        _bowerJson = new BowerJson(path, appName);

        return _bowerJson.createWithCurrentData();
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

    function openBowerComponentsFolder() {
        var path;

        if (_bowerJson) {
            path = _bowerJson.ProjectPath;
        } else {
            path = ProjectManager.getProjectRoot().fullPath;
        }
         // TODO improve this...
        window.setTimeout(function () {
            ProjectManager.showInTree(FileSystem.getDirectoryForPath(path));
        }, 1000);
    }

    /**
     * Checks if the file exists in the given directory. If the directory
     * is not set, the root project directory is taken as the default directory.
     * @param {string= path
     * @return {Promise}
     */
    function findBowerJson(path) {
        if (!path) {
            return new $.Deferred().reject();
        }

        path += "bower.json";

        return FileUtils.exists(path);
    }

    function _notifyBowerJsonReloaded() {
        if (typeof _reloadedCallback === "function") {
            _reloadedCallback();
        }
    }

    function loadBowerJsonAtCurrentProject() {
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

    function _onBowerJsonCreated() {
        if (_bowerJson !== null) {
            return;
        }

        var project = ProjectManager.getProjectRoot(),
            path,
            name;

        if (project) {
            path = project.fullPath;
            name = project.name;
        }

        _bowerJson = new BowerJson(path, name);

        _bowerJson.createWithCurrentData().fail(function () {
            _bowerJson = null;
        }).always(function () {
            _notifyBowerJsonReloaded();
        });
    }

    function onBowerJsonReloaded(callback) {
        _reloadedCallback = callback;
    }

    function _onBowerJsonDeleted() {
        _bowerJson = null;
        _notifyBowerJsonReloaded();
    }

    AppInit.appReady(function () {
        var Events = FileSystemEvents.Events;

        loadBowerJsonAtCurrentProject();

        FileSystemEvents.on(Events.BOWER_JSON_CREATE, _onBowerJsonCreated);
        FileSystemEvents.on(Events.BOWER_JSON_DELETE, _onBowerJsonDeleted);
    });

    exports.getBowerJson        = getBowerJson;
    exports.createBowerJson     = createBowerJson;
    exports.removeBowerJson     = removeBowerJson;
    exports.findBowerJson       = findBowerJson;
    exports.open                = open;
    exports.onBowerJsonReloaded = onBowerJsonReloaded;
    exports.openBowerComponentsFolder = openBowerComponentsFolder;
});
