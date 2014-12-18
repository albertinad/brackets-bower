/*
 * Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
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


/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, describe, it, expect, beforeEach, afterEach, waitsFor, waitsForDone, runs, $, brackets, waitsForDone */

define(function (require, exports, module) {
    "use strict";

    var NodeDomain       = brackets.getModule("utils/NodeDomain"),
        FileUtils        = brackets.getModule("file/FileUtils"),
        FileSystem       = brackets.getModule("filesystem/FileSystem"),
        ExtensionUtils   = brackets.getModule("utils/ExtensionUtils"),
        SpecRunnerUtils  = brackets.getModule("spec/SpecRunnerUtils");

    // TODO: should put in system temp folder, but we don't have a generic way to get that
    var testFolder      = FileUtils.getNativeModuleDirectoryPath(module) + "/tmp-test";

    describe("bower-install", function () {

        // Unit tests for the underlying node server.
        describe("BowerDomain", function () {
            var bowerDomain,
                fileUtilsDomain,
                testBrackets,
                ProjectManager,
                emptyConfig = {};

            beforeEach(function () {
                runs(function () {
                    var bowerDomainPath = ExtensionUtils.getModulePath(module, "/node/BowerDomain"),
                        fileUtilsDomainPath = ExtensionUtils.getModulePath(module, "/node/FileUtilsDomain");

                    bowerDomain = new NodeDomain("bower", bowerDomainPath);
                    fileUtilsDomain = new NodeDomain("fileUtils", fileUtilsDomainPath);
                });

                runs(function () {
                    var folderPromise = new $.Deferred();
                    SpecRunnerUtils.createTestWindowAndRun(this, function (testWindow) {
                        testBrackets = testWindow.brackets;
                        ProjectManager = testBrackets.test.ProjectManager;

                        testBrackets.fs.makedir(testFolder, 0, function (err) {
                            if (err === testBrackets.fs.NO_ERROR) {
                                ProjectManager.openProject(testFolder)
                                    .then(folderPromise.resolve, folderPromise.reject);
                            } else {
                                folderPromise.reject();
                            }
                        });
                        folderPromise.resolve();
                    });
                    waitsForDone(folderPromise, "waiting for test folder to be created");
                });
            });

            afterEach(function () {
                runs(function () {
                    SpecRunnerUtils.closeTestWindow();

                    fileUtilsDomain.exec("deleteRecursive", testFolder);
                });

                runs(function () {
                    bowerDomain = null;
                    fileUtilsDomain = null;
                });
            });

            it("should return a list of package names", function () {
                var packages,
                    i;

                runs(function () {
                    bowerDomain.exec("getPackages", emptyConfig)
                        .done(function (data) {
                            packages = data;
                        });
                });

                waitsFor(function () { return packages; }, "waiting for bower package list", 100000);

                runs(function () {
                    expect(Array.isArray(packages)).toBe(true);
                    expect(packages.length).toBeGreaterThan(0);

                    for (i = 0; i < packages.length; i++) {
                        expect(typeof packages[i].name).toBe("string");
                        expect(typeof packages[i].url).toBe("string");
                    }
                });
            });

            it("should install jquery", function () {
                runs(function () {
                    waitsForDone(bowerDomain.exec("installPackage", testFolder, "jquery", emptyConfig),
                                 "installing jquery", 10000);
                });
                runs(function () {
                    var file = FileSystem.getFileForPath(testFolder + "/bower_components/jquery/dist/jquery.min.js");

                    waitsForDone(FileUtils.readAsText(file), "reading installed jquery");
                });
            });
        });
    });
});
