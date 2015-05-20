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

    var AppInit           = brackets.getModule("utils/AppInit"),
        EventDispatcher   = brackets.getModule("utils/EventDispatcher"),
        FileUtils         = require("src/utils/FileUtils"),
        ProjectManager    = require("src/bower/ProjectManager"),
        FileSystemHandler = require("src/bower/FileSystemHandler"),
        BowerJson         = require("src/bower/metadata/BowerJson");

    var namespace = ".albertinad.bracketsbower",
        BOWER_JSON_RELOADED = "bowerjsonReloaded";

    var Events = {
        BOWER_JSON_RELOADED: BOWER_JSON_RELOADED + namespace
    };

    EventDispatcher.makeEventDispatcher(exports);

    /**
     * Create the bower.json file at the given absolute path. If any path is provided,
     * it use the current active project as the default absolute path.
     */
    function createBowerJson() {
        var deferred = new $.Deferred(),
            project = ProjectManager.getProject(),
            bowerJson,
            appName,
            path;

        if (!project) {
            return deferred.reject();
        }

        appName = project.name;
        path = project.getPath();

        bowerJson = new BowerJson(path, appName, project);

        bowerJson.create().always(function () {
            // create bowerJson file with existent data,
            // if not, use the default configuration
            return bowerJson.create(project.getPackagesArray());
        }).then(function () {
            project.activeBowerJson = bowerJson;

            deferred.resolve(bowerJson);
        }).fail(function (error) {
            bowerJson = null;

            deferred.reject(error);
        });

        return deferred;
    }

    /**
     * Deletes the active bower.json file if it exists.
     */
    function removeBowerJson() {
        var deferred = new $.Deferred(),
            project = ProjectManager.getProject(),
            bowerJson;

        if (!project) {
            return deferred.reject();
        }

        bowerJson = project.activeBowerJson;

        if (bowerJson === null) {
            return deferred.resolve();
        }

        bowerJson.remove().always(function () {
            project.activeBowerJson = null;

            deferred.resolve();
        });

        return deferred;
    }

    /**
     * Get the current active BowerJson object. Null means there's
     * no BowerJson for the project.
     * @returns {BowerJson} Current active BowerJson object.
     */
    function getBowerJson() {
        var project = ProjectManager.getProject();

        return (project) ? project.activeBowerJson : null;
    }

    /**
     * @returns {boolean}
     */
    function existsBowerJson() {
        var project = ProjectManager.getProject();

        return (project &&  project.activeBowerJson !== null);
    }

    /**
     * Open the bower.json in the editor, if it exists.
     */
    function open() {
        var project = ProjectManager.getProject(),
            bowerJson;

        if (project && project.activeBowerJson) {
            bowerJson = project.activeBowerJson;

            FileUtils.openInEditor(bowerJson.AbsolutePath);
        }
    }

    /**
     * Checks if the file exists in the given directory. If the directory
     * is not set, the root project directory is taken as the default directory.
     * @param {string} path
     * @return {$.Deferred}
     */
    function _findBowerJson(path) {
        return FileUtils.exists(path + "bower.json");
    }

    /**
     * Notify when the bower.json was reloaded: created, modified or deleted.
     * @private
     */
    function _notifyBowerJsonReloaded() {
        exports.trigger(BOWER_JSON_RELOADED);
    }

    function loadBowerJson(project) {
        var deferred = new $.Deferred(),
            bowerJson;

        // search for the bower.json file if it exists
        if (project) {
            var path = project.getPath(),
                name = project.name;

            _findBowerJson(path).then(function () {
                bowerJson = new BowerJson(path, name);

                return bowerJson._loadAllDependencies();
            }).fail(function () {
                bowerJson = null;
            }).always(function () {
                _notifyBowerJsonReloaded();

                project.activeBowerJson = bowerJson;

                if (bowerJson) {
                    deferred.resolve();
                } else {
                    deferred.reject();
                }
            });
        } else {
            bowerJson = null;
            project.activeBowerJson = null;

            _notifyBowerJsonReloaded();

            deferred.reject();
        }

        return deferred;
    }

    function getDependencies() {
        var project = ProjectManager.getProject();

        return (project) ? project.getBowerJsonDependencies() : null;
    }

    /**
     * Callback for when the bower.json is created manually through the file system.
     * @private
     */
    function _onBowerJsonCreated() {
        var project = ProjectManager.getProject();

        if (project.activeBowerJson !== null) {
            return;
        }

        createBowerJson().always(function () {
            _notifyBowerJsonReloaded();
        });
    }

    /**
     * Callback for when the bower.json is deleted manually through the file system.
     * @private
     */
    function _onBowerJsonDeleted() {
        var project = ProjectManager.getProject();

        if (project) {
            project.activeBowerJson = null;

            _notifyBowerJsonReloaded();
        }
    }

    function _onBowerJsonChanged() {
        var project = ProjectManager.getProject(),
            bowerJson;

        if (project && project.activeBowerJson) {
            bowerJson = project.activeBowerJson;

            bowerJson.onContentChanged();
        }
    }

    AppInit.appReady(function () {
        var Events = FileSystemHandler.Events;

        FileSystemHandler.on(Events.BOWER_JSON_CREATED, _onBowerJsonCreated);
        FileSystemHandler.on(Events.BOWER_JSON_DELETED, _onBowerJsonDeleted);
        FileSystemHandler.on(Events.BOWER_JSON_CHANGED, _onBowerJsonChanged);
    });

    exports.loadBowerJson   = loadBowerJson;
    exports.getBowerJson    = getBowerJson;
    exports.createBowerJson = createBowerJson;
    exports.removeBowerJson = removeBowerJson;
    exports.existsBowerJson = existsBowerJson;
    exports.getDependencies = getDependencies;
    exports.open            = open;
    exports.Events          = Events;
});
