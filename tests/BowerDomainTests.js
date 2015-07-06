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
/*global define, describe, it, expect, beforeFirst, afterLast, waitsFor, waitsForDone, runs, $, brackets, waitsForDone */

define(function (require, exports, module) {
    "use strict";

    var NodeDomain = brackets.getModule("utils/NodeDomain"),
        SpecRunnerUtils = brackets.getModule("spec/SpecRunnerUtils");

    describe("BracketsBower - Bower Domain", function () {

        var DEFAULT_TIMEOUT = 100000;

        // test for the underlying node domain

        var tempDir = SpecRunnerUtils.getTempDirectory(),
            FileSystem,
            FileUtils,
            ExtensionUtils,
            bowerDomain;

        beforeFirst(function () {
            SpecRunnerUtils.createTempDirectory();

            runs(function () {
                var folderPromise = new $.Deferred();

                SpecRunnerUtils.createTestWindowAndRun(this, function (testWindow) {
                    FileSystem = testWindow.brackets.test.FileSystem;
                    FileUtils = testWindow.brackets.test.FileUtils;
                    ExtensionUtils = testWindow.brackets.test.ExtensionUtils;

                    SpecRunnerUtils.loadProjectInTestWindow(tempDir);

                    folderPromise.resolve();
                });

                waitsForDone(folderPromise, "waiting for test folder to be created");
            });

            runs(function () {
                var bowerDomainPath = ExtensionUtils.getModulePath(module, "../node/BowerDomain");

                bowerDomain = new NodeDomain("bower", bowerDomainPath);
            });
        });

        afterLast(function () {
            runs(function () {
                SpecRunnerUtils.closeTestWindow();
                SpecRunnerUtils.removeTempDirectory();
            });

            runs(function () {
                bowerDomain = null;
            });
        });

        it("should get detailed information about 'jquery'", function () {
            var emptyConfig = {},
                info;

            runs(function () {
                bowerDomain.exec("info", "jquery", emptyConfig)
                    .done(function (data) {
                        info = data;
                    });
            });

            waitsFor(function () {
                return info;
            }, "waiting for bower info about jquery ", DEFAULT_TIMEOUT);

            runs(function () {
                expect(info.name).toEqual("jquery");
                expect(Array.isArray(info.versions)).toBe(true);
                expect(info.latest).toBeDefined();
                expect(typeof info.latest.version).toBe("string");
            });
        });

        it("should install 'jquery'", function () {
            runs(function () {
                var config = {
                        cwd: tempDir
                    },
                    options = {
                        save: false
                    };

                waitsForDone(bowerDomain.exec("install", ["jquery"], options, config),
                    "installing jquery", DEFAULT_TIMEOUT);
            });

            runs(function () {
                var file = FileSystem.getFileForPath(tempDir + "/bower_components/jquery/dist/jquery.min.js");

                waitsForDone(FileUtils.readAsText(file), "reading installed jquery");
            });
        });
    });
});
