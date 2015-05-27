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

    var _                     = brackets.getModule("thirdparty/lodash"),
        EventDispatcher       = brackets.getModule("utils/EventDispatcher"),
        ProjectManager        = require("src/project/ProjectManager"),
        BowerRc               = require("src/metadata/BowerRc"),
        Bower                 = require("src/bower/Bower"),
        BracketsConfiguration = require("src/configuration/BracketsConfiguration"),
        DefaultConfiguration  = require("src/configuration/DefaultConfiguration"),
        FileSystemHandler     = require("src/project/FileSystemHandler"),
        FileUtils             = require("src/utils/FileUtils"),
        ErrorUtils            = require("src/utils/ErrorUtils");

    var _bowerRc  = null;

    var namespace = ".albertinad.bracketsbower",
        BOWERRC_RELOADED = "bowerrcReloaded";

    var Events = {
        BOWERRC_RELOADED: BOWERRC_RELOADED + namespace
    };

    EventDispatcher.makeEventDispatcher(exports);

    function createBowerRc() {
        var currentProject = ProjectManager.getProject(),
            deferred = new $.Deferred();

        if (!currentProject) {
            return deferred.reject(ErrorUtils.createError(ErrorUtils.NO_PROJECT));
        }

        _bowerRc = new BowerRc(currentProject);

        _bowerRc.create().then(function () {
            deferred.resolve();
        }).fail(function (error) {
            _bowerRc = null;

            deferred.reject(error);
        });

        return deferred;
    }

    function removeBowerRc() {
        var deferred = new $.Deferred();

        if (_bowerRc !== null) {
            _bowerRc.remove().done(function () {
                _bowerRc = null;

                deferred.resolve();
            });
        } else {
            deferred.resolve();
        }

        return deferred;
    }

    function getBowerRc() {
        return _bowerRc;
    }

    function open() {
        if (_bowerRc !== null) {
            FileUtils.openInEditor(_bowerRc.AbsolutePath);
        }
    }

    function getConfiguration() {
        var config,
            project = ProjectManager.getProject();

        if (_bowerRc !== null) {
            config = _bowerRc.Data;
        } else {
            config = DefaultConfiguration.getConfiguration();
        }

        config = _.extend(config, BracketsConfiguration.getConfiguration());

        if (project) {
            config.cwd = project.getPath();
        }

        return _.clone(config, true);
    }

    /**
     * Checks if the file exists in the given directory. If the directory
     * is not set, the root project directory is taken as the default directory.
     * @param {string} path
     * @return {Promise}
     */
    function findBowerRc(path) {
        return FileUtils.exists(path + ".bowerrc");
    }

    function _notifyBowerRcReloaded() {
        exports.trigger(BOWERRC_RELOADED);
    }

    function loadBowerRc(project) {
        var deferred = new $.Deferred();

        if (project) {
            findBowerRc(project.getPath()).then(function () {
                _bowerRc = new BowerRc(project);

                Bower.getConfiguration(_bowerRc.AbsolutePath)
                    .then(function (configuration) {
                        _bowerRc.Data = configuration;
                    })
                    .fail(function () {
                        // do not handle error
                    });
            }).fail(function () {
                _bowerRc = null;
            }).always(function () {
                _notifyBowerRcReloaded();

                if (_bowerRc) {
                    deferred.resolve();
                } else {
                    deferred.reject();
                }
            });
        } else {
            _bowerRc = null;
            _notifyBowerRcReloaded();

            deferred.reject();
        }

        return deferred;
    }

    function _onBowerRcCreated() {
        if (_bowerRc !== null) {
            return;
        }

        createBowerRc().always(function () {
            _notifyBowerRcReloaded();
        });
    }

    function _onBowerRcChanged() {
        if (_bowerRc === null) {
            return;
        }

        Bower.getConfiguration(_bowerRc.AbsolutePath).done(function (configuration) {
            _bowerRc.Data = configuration;
        });
    }

    function _onBowerRcDeleted() {
        _bowerRc = null;
        _notifyBowerRcReloaded();
    }

    function _init() {
        var Events = FileSystemHandler.Events;

        BracketsConfiguration.init();
        DefaultConfiguration.init();

        BracketsConfiguration.on(BracketsConfiguration.Events.CHANGED, function (configuration) {
            if (_bowerRc !== null) {
                _bowerRc.Data = configuration;
            }
        });

        FileSystemHandler.on(Events.BOWER_BOWERRC_CREATED, _onBowerRcCreated);
        FileSystemHandler.on(Events.BOWER_BOWERRC_CHANGED, _onBowerRcChanged);
        FileSystemHandler.on(Events.BOWER_BOWERRC_DELETED, _onBowerRcDeleted);
    }

    _init();

    exports.loadBowerRc             = loadBowerRc;
    exports.getBowerRc              = getBowerRc;
    exports.createBowerRc           = createBowerRc;
    exports.removeBowerRc           = removeBowerRc;
    exports.getConfiguration        = getConfiguration;
    exports.findBowerRc             = findBowerRc;
    exports.open                    = open;
    exports.Events                  = Events;
});
