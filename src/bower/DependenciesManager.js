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
        AppInit        = brackets.getModule("utils/AppInit"),
        BowerJson      = require("src/bower/BowerJson"),
        FileUtils      = require("src/utils/FileUtils");

    var _bowerJson = null;

    function createBowerJson(path) {
        _bowerJson = new BowerJson(path);

        return _bowerJson.create();
    }

    function removeBowerJson() {
        var deferred = new $.Deferred();

        if (_bowerJson !== null) {
            _bowerJson.remove()
                .done(deferred.resolve);
        } else {
            deferred.resolve();
        }

        return deferred;
    }

    function open() {
        if (_bowerJson !== null) {
            _bowerJson.open();
        }
    }

    /**
     * Checks if the file exists in the given directory. If the directory
     * is not set, the root project directory is taken as the default directory.
     * @param {string=} path
     * @return {Promise}
     */
    function findBowerJson(path) {
        if (!path) {
            path = ProjectManager.getProjectRoot().fullPath;
        }

        path += "bower.json";

        return FileUtils.exists(path);
    }

    function _loadBowerJson(path) {
        _bowerJson = new BowerJson(path);
    }

    AppInit.appReady(function () {
        // search for the bower.json file if it exists
        var defaultPath = ProjectManager.getProjectRoot().fullPath;

        findBowerJson(defaultPath).then(function () {
            _loadBowerJson(defaultPath);
        });
    });

    exports.createBowerJson = createBowerJson;
    exports.removeBowerJson = removeBowerJson;
    exports.findBowerJson   = findBowerJson;
    exports.open            = open;
});
