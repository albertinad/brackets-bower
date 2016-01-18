/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 - 2016 Intel Corporation
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, describe, it, expect, afterEach, beforeFirst, afterLast, waitsForDone, waitsForFail,
runs, spyOn, $, brackets, waitsForDone */

define(function (require, exports, module) {
    "use strict";

    var NodeDomain = brackets.getModule("utils/NodeDomain"),
        SpecRunnerUtils = brackets.getModule("spec/SpecRunnerUtils"),
        extensionName = "brackets-bower";

    describe("BracketsBower - PackageManager", function () {
        var tempDir = SpecRunnerUtils.getTempDirectory(),
            defaultTimeout = 5000,
            PackageManager,
            Bower,
            ExtensionUtils,
            testWindow,
            bowerDomain,
            extensionRequire;

        beforeFirst(function () {
            runs(function () {
                SpecRunnerUtils.createTempDirectory();
            });

            runs(function () {
                var folderPromise = new $.Deferred();

                SpecRunnerUtils.createTestWindowAndRun(this, function (w) {
                    var ExtensionLoader;

                    testWindow = w;
                    ExtensionUtils = testWindow.brackets.test.ExtensionUtils;
                    ExtensionLoader = testWindow.brackets.test.ExtensionLoader;

                    extensionRequire = ExtensionLoader.getRequireContextForExtension(extensionName);

                    SpecRunnerUtils.loadProjectInTestWindow(tempDir);

                    folderPromise.resolve();
                });

                waitsForDone(folderPromise, "waiting for test project to be opened", defaultTimeout);
            });

            runs(function () {
                var path = ExtensionUtils.getModulePath(module, "/utils/BowerDomainMock");

                PackageManager = extensionRequire("src/bower/PackageManager");
                Bower = extensionRequire("src/bower/Bower");

                bowerDomain = new NodeDomain("bower-test", path);

                Bower.setDomain(bowerDomain);
            });
        });

        afterEach(function () {
            runs(function () {
                bowerDomain.exec("resetTestData");
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

        it("should get the list of cached packages when executing 'list cache'", function () {
            spyOn(Bower, "listCache").andCallThrough();

            var resultPromise = new testWindow.$.Deferred(),
                data;

            runs(function () {
                PackageManager.listCache().then(function (result) {
                    data = result;
                    resultPromise.resolve();
                }).fail(function () {
                    resultPromise.reject();
                });

                waitsForDone(resultPromise, "listCache was successfully executed", defaultTimeout);
            });

            runs(function () {
                expect(data).not.toBeNull();
                expect(data).toBeDefined();
                expect(data.length).toBeGreaterThan(0);

                data.forEach(function (pkg) {
                    expect(typeof pkg.name).toBe("string");
                    expect(pkg.pkgMeta).toBeDefined();
                });

                expect(Bower.listCache.calls.length).toEqual(1);
                expect(resultPromise.state()).toEqual("resolved");
            });
        });

        it("should get the list of packages from the registry when executing 'search'", function () {
            spyOn(Bower, "search").andCallThrough();

            var resultPromise = new testWindow.$.Deferred(),
                data;

            runs(function () {
                PackageManager.search().then(function (result) {
                    data = result;
                    resultPromise.resolve();
                }).fail(function () {
                    resultPromise.reject();
                });

                waitsForDone(resultPromise, "search was successfully executed", defaultTimeout);
            });

            runs(function () {
                expect(data).not.toBeNull();
                expect(data).toBeDefined();
                expect(data.length).toBeGreaterThan(0);

                data.forEach(function (pkg) {
                    expect(typeof pkg.name).toBe("string");
                    expect(typeof pkg.url).toBe("string");
                });

                expect(Bower.search.calls.length).toEqual(1);
                expect(resultPromise.state()).toEqual("resolved");
            });
        });

        it("should get the list of installed packages when executing 'list'", function () {
            spyOn(Bower, "list").andCallThrough();

            var resultPromise = new testWindow.$.Deferred(),
                data;

            runs(function () {
                PackageManager.list().then(function (result) {
                    data = result;
                    resultPromise.resolve();
                }).fail(function () {
                    resultPromise.reject();
                });

                waitsForDone(resultPromise, "listCache was successfully executed", defaultTimeout);
            });

            runs(function () {
                expect(data).not.toBeNull();
                expect(data).toBeDefined();
                expect(data.pkgMeta).toBeDefined();

                expect(Bower.list.calls.length).toEqual(1);
                expect(resultPromise.state()).toEqual("resolved");
            });
        });

        it("should fail when executing 'info' without a package name", function () {
            spyOn(Bower, "info").andCallThrough();

            var resultPromise = new testWindow.$.Deferred(),
                data;

            runs(function () {
                PackageManager.infoByName().then(function (result) {
                    data = result;
                    resultPromise.resolve();
                }).fail(function () {
                    resultPromise.reject();
                });

                waitsForFail(resultPromise, "info was rejected", defaultTimeout);
            });

            runs(function () {
                expect(data).not.toBeDefined();

                expect(Bower.info.calls.length).toEqual(1);
                expect(resultPromise.state()).toEqual("rejected");
            });
        });

        it("should get the information of the given package when executing 'info'", function () {
            spyOn(Bower, "info").andCallThrough();

            var resultPromise = new testWindow.$.Deferred(),
                data;

            runs(function () {
                PackageManager.infoByName("jquery").then(function (result) {
                    data = result;
                    resultPromise.resolve();
                }).fail(function () {
                    resultPromise.reject();
                });

                waitsForDone(resultPromise, "info was successfully executed", defaultTimeout);
            });

            runs(function () {
                expect(data).not.toBeNull();
                expect(data).toBeDefined();

                expect(data.name).toBeDefined();
                expect(data.latestVersion).toBeDefined();
                expect(data.versions).toBeDefined();
                expect(data.dependencies).toBeDefined();
                expect(data.keywords).toBeDefined();
                expect(data.homepage).toBeDefined();
                expect(data.description).toBeDefined();

                expect(Bower.info.calls.length).toEqual(1);
                expect(resultPromise.state()).toEqual("resolved");
            });
        });
    });
});
