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
/*global define, describe, it, expect, beforeFirst, afterLast, waitsForDone, runs, $, brackets */

define(function (require, exports, module) {
    "use strict";

    var SpecRunnerUtils = brackets.getModule("spec/SpecRunnerUtils");

    describe("BracketsBower - PackageFactory", function () {
        var PackageFactory = require("src/bower/PackageFactory"),
            tempDir = SpecRunnerUtils.getTempDirectory(),
            defaultTimeout = 5000,
            ExtensionUtils,
            testWindow;

        // BowerJsonManager.getDependencies().

        beforeFirst(function () {
            runs(function () {
                var folderPromise = new $.Deferred();

                SpecRunnerUtils.createTestWindowAndRun(this, function (w) {
                    testWindow = w;
                    ExtensionUtils = testWindow.brackets.test.ExtensionUtils;
                    folderPromise.resolve();
                });

                waitsForDone(folderPromise, "waiting for test project to be opened", defaultTimeout);
            });

            runs(function () {
                SpecRunnerUtils.createTempDirectory();
                SpecRunnerUtils.loadProjectInTestWindow(tempDir);
            });
        });

        afterLast(function () {
            runs(function () {
                SpecRunnerUtils.removeTempDirectory();
                SpecRunnerUtils.closeTestWindow();
            });
        });

        it("should get an array of Package objects for the raw data", function () {
            var data = require("text!tests/utils/data/install.packages.json"),
                rawData = JSON.parse(data),
                packages = PackageFactory.createPackages(rawData);

            expect(packages).not.toBeNull();
            expect(packages).toBeDefined();
            expect(Array.isArray(packages)).toEqual(true);

            packages.forEach(function (pkg) {
                expect(pkg.name).toBeDefined();
                expect(pkg.version).toBeDefined();
                expect(pkg.latestVersion).toBeDefined();
                expect(pkg.versions).toBeDefined();
                expect(pkg.extraneous).toBeDefined();
                expect(pkg.isInstalled).toBeDefined();
                expect(pkg.isDevDependency).toBeDefined();
                expect(pkg.dependencies).toBeDefined();
                expect(pkg.description).toBeDefined();
                expect(pkg.homepage).toBeDefined();
                expect(pkg.source).toBeDefined();
            });
        });

        it("should get a Package instance for the raw data, without dependencies", function () {
            var data = require("text!tests/utils/data/install.package.json"),
                rawData = JSON.parse(data).jQuery;

            var pkg = PackageFactory.createPackage("jQuery", rawData, false);

            expect(pkg).not.toBeNull();
            expect(pkg).toBeDefined();
            expect(pkg.name).toEqual("jQuery");
            expect(pkg.version).toEqual("2.1.3");
            expect(pkg.dependencies.length).toEqual(0);
            expect(pkg.homepage).toEqual("https://github.com/jquery/jquery");
        });

        it("should get a Package instance for the raw data, with dependencies", function () {
            var rawData = {
                "endpoint": {
                    "name": "bootstrap",
                    "source": "bootstrap",
                    "target": "*"
                },
                "canonicalDir": "/home/durantea/Development/brackets/src/extensions/dev/brackets-bower/bower_components/bootstrap",
                "pkgMeta": {
                    "name": "bootstrap",
                    "description": "The most popular front-end framework for developing responsive, mobile first projects on the web.",
                    "version": "3.3.4",
                    "keywords": ["css", "js", "less", "mobile-first", "responsive", "front-end", "framework", "web"],
                    "homepage": "http://getbootstrap.com",
                    "main": ["less/bootstrap.less", "dist/css/bootstrap.css", "dist/js/bootstrap.js"],
                    "ignore": ["/.*", "composer.json", "CONTRIBUTING.md", "docs", "js/tests", "test-infra"],
                    "dependencies": {
                        "jquery": ">= 1.9.1"
                    },
                    "_release": "3.3.4",
                    "_resolution": {
                        "type": "version",
                        "tag": "v3.3.4",
                        "commit": "a10eb60bc0b07b747fa0c4ebd8821eb7307bd07f"
                    },
                    "_source": "https://github.com/twbs/bootstrap.git",
                    "_target": "*"
                },
                "dependencies": {
                    "jquery": {
                        "endpoint": {
                            "name": "jquery",
                            "source": "jquery",
                            "target": ">= 1.9.1"
                        },
                        "canonicalDir": "/home/durantea/Development/brackets/src/extensions/dev/brackets-bower/bower_components/jquery",
                        "pkgMeta": {
                            "name": "jquery",
                            "version": "2.1.4",
                            "main": "dist/jquery.js",
                            "license": "MIT",
                            "ignore": ["**/.*", "build", "dist/cdn", "speed", "test", "*.md", "AUTHORS.txt", "Gruntfile.js", "package.json"],
                            "devDependencies": {
                                "sizzle": "2.1.1-jquery.2.1.2",
                                "requirejs": "2.1.10",
                                "qunit": "1.14.0",
                                "sinon": "1.8.1"
                            },
                            "keywords": ["jquery", "javascript", "library"],
                            "homepage": "https://github.com/jquery/jquery",
                            "_release": "2.1.4",
                            "_resolution": {
                                "type": "version",
                                "tag": "2.1.4",
                                "commit": "7751e69b615c6eca6f783a81e292a55725af6b85"
                            },
                            "_source": "https://github.com/jquery/jquery.git",
                            "_target": "*"
                        },
                        "dependencies": {},
                        "nrDependants": 1
                    }
                },
                "nrDependants": 1
            };

            var pkg = PackageFactory.createPackage("bootstrap", rawData, false);

            expect(pkg).not.toBeNull();
            expect(pkg).toBeDefined();
            expect(pkg.name).toEqual("bootstrap");
            expect(pkg.version).toEqual("3.3.4");
            expect(pkg.dependencies.length).not.toEqual(0);
            expect(pkg.homepage).toEqual("http://getbootstrap.com");
        });

        it("should get PackageInfo instance for the raw data, without keywords", function () {
            var rawData = {
                "name": "jquery",
                "versions": ["2.1.3", "2.1.2", "2.1.1", "2.1.1-rc2", "2.1.1-rc1", "2.1.1-beta1", "2.1.0", "2.1.0-rc1", "2.1.0-beta3", "2.1.0-beta2", "2.1.0-beta1", "2.0.3", "2.0.2", "2.0.1", "2.0.0", "2.0.0-beta3", "1.11.2"],
                "latest": {
                    "name": "jquery",
                    "version": "2.1.3",
                    "main": "dist/jquery.js",
                    "license": "MIT",
                    "ignore": ["**/.*", "build", "speed", "test", "*.md", "AUTHORS.txt", "Gruntfile.js", "package.json"],
                    "devDependencies": {
                        "sizzle": "2.1.1-jquery.2.1.2",
                        "requirejs": "2.1.10",
                        "qunit": "1.14.0",
                        "sinon": "1.8.1"
                    },
                    "homepage": "https://github.com/jquery/jquery"
                }
            };

            var packageInfo = PackageFactory.createInfo(rawData);

            expect(packageInfo).not.toBeNull();
            expect(packageInfo).toBeDefined();
            expect(packageInfo.name).toEqual("jquery");
            expect(packageInfo.latestVersion).toEqual("2.1.3");
            expect(packageInfo.versions.length).not.toEqual(0);
            expect(packageInfo.dependencies.length).toEqual(0);
            expect(packageInfo.keywords.length).toEqual(0);
            expect(packageInfo.homepage).toEqual("https://github.com/jquery/jquery");
        });

        it("should get PackageInfo instance for the raw data, with keywords", function () {
            var rawData = {
                "name": "jquery",
                "versions": ["2.1.3", "2.1.2", "2.1.1", "2.1.1-rc2", "2.1.1-rc1", "2.1.1-beta1", "2.1.0", "2.1.0-rc1", "2.1.0-beta3", "2.1.0-beta2", "2.1.0-beta1", "2.0.3", "2.0.2", "2.0.1", "2.0.0", "2.0.0-beta3", "1.11.2"],
                "latest": {
                    "name": "jquery",
                    "version": "2.1.3",
                    "main": "dist/jquery.js",
                    "license": "MIT",
                    "ignore": ["**/.*", "build", "speed", "test", "*.md", "AUTHORS.txt", "Gruntfile.js", "package.json"],
                    "dependencies": {
                        "sizzle": "2.1.1-jquery.2.1.2",
                        "requirejs": "2.1.10",
                        "qunit": "1.14.0",
                        "sinon": "1.8.1"
                    },
                    "keywords": ["jquery", "javascript", "library"],
                    "homepage": "https://github.com/jquery/jquery"
                }
            };

            var packageInfo = PackageFactory.createInfo(rawData);

            expect(packageInfo).not.toBeNull();
            expect(packageInfo).toBeDefined();
            expect(packageInfo.name).toEqual("jquery");
            expect(packageInfo.latestVersion).toEqual("2.1.3");
            expect(packageInfo.versions.length).not.toEqual(0);
            expect(packageInfo.dependencies.length).not.toEqual(0);
            expect(packageInfo.keywords.length).not.toEqual(0);
            expect(packageInfo.homepage).toEqual("https://github.com/jquery/jquery");
        });

        it("should get PackageInfo instance for the raw data, without dependencies", function () {
            var data = require("text!tests/utils/data/info.json"),
                rawData = JSON.parse(data);

            var packageInfo = PackageFactory.createInfo(rawData);

            expect(packageInfo).not.toBeNull();
            expect(packageInfo).toBeDefined();
            expect(packageInfo.name).toEqual("jquery");
            expect(packageInfo.latestVersion).toEqual("2.1.3");
            expect(packageInfo.versions.length).not.toEqual(0);
            expect(packageInfo.dependencies.length).toEqual(0);
            expect(packageInfo.homepage).toEqual("https://github.com/jquery/jquery");
        });

        it("should get PackageInfo instance for the raw data, with dependencies", function () {
            var rawData = {
                "name": "jquery",
                "versions": ["2.1.3", "2.1.2", "2.1.1", "2.1.1-rc2", "2.1.1-rc1", "2.1.1-beta1", "2.1.0", "2.1.0-rc1", "2.1.0-beta3", "2.1.0-beta2", "2.1.0-beta1", "2.0.3", "2.0.2", "2.0.1", "2.0.0", "2.0.0-beta3", "1.11.2"],
                "latest": {
                    "name": "jquery",
                    "version": "2.1.3",
                    "main": "dist/jquery.js",
                    "license": "MIT",
                    "ignore": ["**/.*", "build", "speed", "test", "*.md", "AUTHORS.txt", "Gruntfile.js", "package.json"],
                    "dependencies": {
                        "sizzle": "2.1.1-jquery.2.1.2",
                        "requirejs": "2.1.10",
                        "qunit": "1.14.0",
                        "sinon": "1.8.1"
                    },
                    "keywords": ["jquery", "javascript", "library"],
                    "homepage": "https://github.com/jquery/jquery"
                }
            };

            var packageInfo = PackageFactory.createInfo(rawData);

            expect(packageInfo).not.toBeNull();
            expect(packageInfo).toBeDefined();
            expect(packageInfo.name).toEqual("jquery");
            expect(packageInfo.latestVersion).toEqual("2.1.3");
            expect(packageInfo.versions.length).not.toEqual(0);
            expect(packageInfo.dependencies.length).not.toEqual(0);
            expect(packageInfo.homepage).toEqual("https://github.com/jquery/jquery");
        });
    });
});
