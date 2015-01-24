/*
 * Copyright (c) 2013 - 2015 Narciso Jaramillo. All rights reserved.
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
/*global define, brackets */

define(function (require, exports) {
    "use strict";

    var Bower = require("src/bower/Bower");

    var DEFAULT_GIT = "git",
        GIT_ARG_VERSION = "--version",
        GIT_VERSION_REGEX = /^git version\s(.*)$/;

    /**
     * Search for Git on the system Path.
     */
    function findGitOnSystem() {
        var deferred = new $.Deferred(),
            execPromise = Bower.executeCommand(DEFAULT_GIT, [GIT_ARG_VERSION]);

        execPromise.then(function (result) {
            var version = result.output,
                match = version.match(GIT_VERSION_REGEX);

            if (match) {
                deferred.resolve();
            } else {
                deferred.reject();
            }
        }).fail(function (error) {
             deferred.reject(error);
        });

        return deferred.promise();
    }

    exports.findGitOnSystem = findGitOnSystem;
});
