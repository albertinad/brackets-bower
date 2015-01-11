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

    var defaultOsPaths = {
        win: [
            "C:\\Program Files\\Git\\cmd\\git.exe",
            "C:\\Program Files (x86)\\Git\\cmd\\git.exe"
        ],
        nix: [
            "/usr/local/git/bin/git",
            "/usr/bin/git"
        ]
    };

    var DEFAULT_GIT       = "git",
        GIT_ARG_VERSION   = "--version",
        GIT_VERSION_REGEX = /^git version\s+(.*)$/;

    function getDefaultGitPaths (platform) {
        var platformPaths = (platform === "win") ? defaultOsPaths.win : defaultOsPaths.nix;

        return [DEFAULT_GIT].concat(platformPaths);
    }

    function _findGit (platform, callback) {
        var paths = getDefaultGitPaths(platform),
            gitFindings = [],
            gitErrors = [],
            count = paths.length;

        paths.forEach(function (path) {
            var args = [GIT_ARG_VERSION],
                execPromise = Bower.executeCommand(path, args);

            execPromise.then(function (result) {
                var version = result.output,
                    match = version.match(GIT_VERSION_REGEX);

                if(match) {
                    gitFindings.push(path);
                } else {
                    gitErrors.push(path);
                }
            })
            .fail(function (error) {
                gitErrors.push(error.cmd);
            })
            .always(function () {
                count -= 1;

                if(count === 0) {
                    callback(gitFindings, gitErrors);
                }
            });
        });
    }

    function isGitOnSystem (platform) {
        var deferred = new $.Deferred();

        function onFindCallback (findings, errors) {
            if(findings.length === 0) {
                deferred.reject(errors);
            } else {
                deferred.resolve();
            }
        }

        _findGit(platform, onFindCallback);

        return deferred.promise();
    }

    exports.isGitOnSystem      = isGitOnSystem;
    exports.getDefaultGitPaths = getDefaultGitPaths;
});
