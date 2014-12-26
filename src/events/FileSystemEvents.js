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
/*global define */

define(function (require, exports) {
    "use strict";

    var FileSystem     = brackets.getModule("filesystem/FileSystem"),
        ProjectManager = brackets.getModule("project/ProjectManager"),
        Event          = require("src/events/Events"),
        EventEmitter   = require("src/events/EventEmitter");

    function _isFileByPathInArray (filesArray, filePath) {
        var result;

        filesArray.some(function (file, index) {
            result = file.fullPath.match(filePath);

            return result;
        });

        return result;
    }

    function init () {
        var projectPath = ProjectManager.getProjectRoot().fullPath,
            bowerConfigFile = projectPath + ".bowerrc",
            projectPathRegex = new RegExp(projectPath),
            bowerConfigRegex = new RegExp(bowerConfigFile);

        FileSystem.on("change.bower", function (event, entry, added, removed) {
            if(!entry) return;

            if(entry.isFile && entry.fullPath.match(bowerConfigRegex)) {
                console.log("is modified!");

                EventEmitter.trigger(Event.BOWER_BOWERRC_CHANGE);

            } else if(entry.isDirectory && entry.fullPath.match(projectPathRegex)) {

                if(added && _isFileByPathInArray(added, bowerConfigFile)) {
                    console.log("is created!");
                    EventEmitter.trigger(Event.BOWER_BOWERRC_CREATE);

                } else if(removed && _isFileByPathInArray(removed, bowerConfigFile)) {
                    console.log("is deleted!");
                    EventEmitter.trigger(Event.BOWER_BOWERRC_DELETE);
                }
            }
        });
    }

    exports.init = init;
});
