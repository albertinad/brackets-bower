/*
 * Copyright (c) 2013 Narciso Jaramillo. All rights reserved.
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
maxerr: 50, node: true */
/*global require */

(function () {
    "use strict";

    var fs = require("fs");

    /**
     * Recursively and synchronously deletes the given folder or file.
     * @param {string} path The path to the folder or file to delete. If a folder, deletes all contents
     *    recursively.
     */
    function _cmdDeleteRecursive(path) {
        // Do everything synchronously for now.
        // For symlinks, delete the link, don't follow it.
        var stats = fs.lstatSync(path);
        if (stats.isDirectory()) {
            var files = fs.readdirSync(path);
            files.forEach(function (file) {
                _cmdDeleteRecursive(path + "/" + file);
            });
            fs.rmdirSync(path);
        } else {
            fs.unlinkSync(path);
        }
    }

    /**
     * Initializes the domain with its commands.
     * @param {DomainManager} domainmanager The DomainManager for the server
     */
    function init(domainManager) {
        if (!domainManager.hasDomain("bower_test_fileutils")) {
            domainManager.registerDomain("bower_test_fileutils", {major: 0, minor: 1});
        }
        domainManager.registerCommand(
            "bower_test_fileutils",
            "deleteRecursive",
            _cmdDeleteRecursive,
            false,
            "Recursively deletes the given folder or file.",
            [{
                name: "path",
                type: "string",
                description: "Full path to the file or folder to delete"
            }],
            []
        );
    }

    exports.init = init;

    // For repl testing
    exports._cmdDeleteRecursive = _cmdDeleteRecursive;
}());
