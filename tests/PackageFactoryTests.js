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
/*global define, describe, it, expect, beforeFirst, afterLast, waitsForDone, runs, spyOn, $, brackets */

define(function (require, exports, module) {
    "use strict";

    var SpecRunnerUtils = brackets.getModule("spec/SpecRunnerUtils"),
        extensionName = "brackets-bower";

    describe("BracketsBower - PackageFactory", function () {
        var tempDir = SpecRunnerUtils.getTempDirectory(),
            defaultTimeout = 5000,
            PackageFactory,
            ProjectManager,
            extensionRequire,
            ExtensionUtils,
            testWindow;

        beforeFirst(function () {
            runs(function () {
                var folderPromise = new $.Deferred();

                SpecRunnerUtils.createTestWindowAndRun(this, function (w) {
                    testWindow = w;
                    ExtensionUtils = testWindow.brackets.test.ExtensionUtils;
                    extensionRequire = testWindow.brackets.test.ExtensionLoader.getRequireContextForExtension(extensionName);

                    PackageFactory = extensionRequire("src/project/PackageFactory");
                    ProjectManager = extensionRequire("src/project/ProjectManager");

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
                extensionRequire = null;
            });

            runs(function () {
                SpecRunnerUtils.removeTempDirectory();
                SpecRunnerUtils.closeTestWindow();
            });
        });

        it("should get an array of Package objects for the raw data", function () {
            var data = require("text!tests/utils/data/install.packages.json"),
                rawData = JSON.parse(data),
                packages = PackageFactory.createPackages(rawData);

            runs(function () {
                expect(packages).not.toBeNull();
                expect(packages).toBeDefined();
                expect(Array.isArray(packages)).toEqual(true);

                packages.forEach(function (pkg) {
                    expect(pkg.name).toBeDefined();
                    expect(pkg.version).toBeDefined();
                    expect(pkg.latestVersion).toBeDefined();
                    expect(pkg.status).toBeDefined();
                    expect(pkg.dependencyType).toBeDefined();
                    expect(pkg.description).toBeDefined();
                    expect(pkg.homepage).toBeDefined();
                    expect(pkg.source).toBeDefined();
                    expect(pkg.installationDir).toBeDefined();
                    expect(pkg.installationDir).not.toBeNull();
                });
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
            expect(pkg.dependenciesCount()).toEqual(0);
            expect(pkg.homepage).toEqual("https://github.com/jquery/jquery");
            expect(pkg.installationDir).toEqual("/bowertestuser/bower_components/jQuery");
            expect(pkg.hasDependants()).toEqual(false);
            expect(pkg.hasDependencies()).toEqual(false);
        });

        it("should get a Package instance for the raw data, with dependencies", function () {
            var data = require("text!tests/data/package-factory/list1.result.json"),
                rawData = JSON.parse(data);

            var pkg = PackageFactory.createPackage("bootstrap", rawData, false);

            expect(pkg).not.toBeNull();
            expect(pkg).toBeDefined();
            expect(pkg.name).toEqual("bootstrap");
            expect(pkg.version).toEqual("3.3.4");
            expect(pkg.dependenciesCount()).not.toEqual(0);
            expect(pkg.homepage).toEqual("http://getbootstrap.com");
            expect(pkg.installationDir).toBeDefined();
            expect(pkg.installationDir).not.toBeNull();
            expect(pkg.hasDependants()).toEqual(false);
            expect(pkg.hasDependencies()).toEqual(true);
        });

        it("should get an array of packages, with secondary dependencies, tracked as 'production' dependencies", function () {
            var data = require("text!tests/data/package-factory/install1.result.json"),
                rawData = JSON.parse(data),
                mockBowerJson = {
                    getAllDependencies: function () {
                        return {
                            dependencies: {
                                "angular-material": "*"
                            }
                        };
                    }
                },
                result;

            spyOn(ProjectManager, "getBowerJson").andReturn(mockBowerJson);

            result = PackageFactory.createPackages(rawData);

            expect(result.length).toEqual(4);

            result.forEach(function (pkg) {
                expect(pkg).toBeDefined();
                expect(pkg.isInstalled()).toEqual(true);
                expect(pkg.installationDir).toBeDefined();
                expect(pkg.installationDir).not.toBeNull();

                switch (pkg.name) {
                case "angular-aria":
                    expect(pkg.isProjectDependency).toEqual(false);
                    expect(pkg.hasDependencies()).toEqual(true);
                    expect(pkg.hasDependants()).toEqual(true);
                    expect(pkg.hasDependency("angular")).toEqual(true);
                    expect(pkg.hasDependant("angular-material")).toEqual(true);
                    break;
                case "angular":
                    expect(pkg.isProjectDependency).toEqual(false);
                    expect(pkg.hasDependencies()).toEqual(false);
                    expect(pkg.hasDependants()).toEqual(true);
                    expect(pkg.hasDependant("angular-animate")).toEqual(true);
                    expect(pkg.hasDependant("angular-aria")).toEqual(true);
                    expect(pkg.hasDependant("angular-material")).toEqual(true);
                    break;
                case "angular-material":
                    expect(pkg.isProductionDependency()).toEqual(true);
                    expect(pkg.isProjectDependency).toEqual(true);
                    expect(pkg.hasDependencies()).toEqual(true);
                    expect(pkg.hasDependants()).toEqual(false);
                    expect(pkg.hasDependency("angular-animate")).toEqual(true);
                    expect(pkg.hasDependency("angular-aria")).toEqual(true);
                    expect(pkg.hasDependency("angular")).toEqual(true);
                    break;
                case "angular-animate":
                    expect(pkg.isProjectDependency).toEqual(false);
                    expect(pkg.hasDependencies()).toEqual(true);
                    expect(pkg.hasDependants()).toEqual(true);
                    expect(pkg.hasDependency("angular")).toEqual(true);
                    expect(pkg.hasDependant("angular-material")).toEqual(true);
                    break;
                }
            });
        });

        it("should get an array of packages, with dependencies, tracked as 'development' dependencies", function () {
            var data = require("text!tests/data/package-factory/install1.result.json"),
                rawData = JSON.parse(data),
                mockBowerJson = {
                    getAllDependencies: function () {
                        return {
                            devDependencies: {
                                "angular-material": "*"
                            }
                        };
                    }
                },
                result;

            spyOn(ProjectManager, "getBowerJson").andReturn(mockBowerJson);

            result = PackageFactory.createPackages(rawData);

            expect(result.length).toEqual(4);

            result.forEach(function (pkg) {
                expect(pkg).toBeDefined();
                expect(pkg.isInstalled()).toEqual(true);

                switch (pkg.name) {
                case "angular-aria":
                    expect(pkg.isProjectDependency).toEqual(false);
                    expect(pkg.hasDependencies()).toEqual(true);
                    expect(pkg.hasDependants()).toEqual(true);
                    expect(pkg.hasDependency("angular")).toEqual(true);
                    expect(pkg.hasDependant("angular-material")).toEqual(true);
                    break;
                case "angular":
                    expect(pkg.isProjectDependency).toEqual(false);
                    expect(pkg.hasDependencies()).toEqual(false);
                    expect(pkg.hasDependants()).toEqual(true);
                    expect(pkg.hasDependant("angular-animate")).toEqual(true);
                    expect(pkg.hasDependant("angular-aria")).toEqual(true);
                    expect(pkg.hasDependant("angular-material")).toEqual(true);
                    break;
                case "angular-material":
                    expect(pkg.isProductionDependency()).toEqual(false);
                    expect(pkg.isDevDependency()).toEqual(true);
                    expect(pkg.isProjectDependency).toEqual(true);
                    expect(pkg.hasDependencies()).toEqual(true);
                    expect(pkg.hasDependants()).toEqual(false);
                    expect(pkg.hasDependency("angular-animate")).toEqual(true);
                    expect(pkg.hasDependency("angular-aria")).toEqual(true);
                    expect(pkg.hasDependency("angular")).toEqual(true);
                    break;
                case "angular-animate":
                    expect(pkg.isProjectDependency).toEqual(false);
                    expect(pkg.hasDependencies()).toEqual(true);
                    expect(pkg.hasDependants()).toEqual(true);
                    expect(pkg.hasDependency("angular")).toEqual(true);
                    expect(pkg.hasDependant("angular-material")).toEqual(true);
                    break;
                }
            });
        });

        it("should get an array of packages, with dependencies, tracked as 'production' and 'development' dependencies", function () {
            var data = require("text!tests/data/package-factory/install2.result.json"),
                rawData = JSON.parse(data),
                mockBowerJson = {
                    getAllDependencies: function () {
                        return {
                            dependencies: {
                                "jquery": "*",
                                "angular": "*",
                                "lodash": "*"
                            },
                            devDependencies: {
                                "jasmine": "*",
                                "sinon": "*"
                            }
                        };
                    }
                },
                result;

            spyOn(ProjectManager, "getBowerJson").andReturn(mockBowerJson);

            result = PackageFactory.createPackages(rawData);

            expect(result.length).toEqual(5);

            result.forEach(function (pkg) {
                expect(pkg).toBeDefined();
                expect(pkg.isInstalled()).toEqual(true);
                expect(pkg.isProjectDependency).toEqual(true);
                expect(pkg.installationDir).toBeDefined();
                expect(pkg.installationDir).not.toBeNull();

                switch (pkg.name) {
                case "jquery":
                    expect(pkg.isProductionDependency()).toEqual(true);
                    expect(pkg.isDevDependency()).toEqual(false);
                    expect(pkg.hasDependencies()).toEqual(false);
                    expect(pkg.hasDependants()).toEqual(false);
                    break;
                case "angular":
                    expect(pkg.isProductionDependency()).toEqual(true);
                    expect(pkg.isDevDependency()).toEqual(false);
                    expect(pkg.hasDependencies()).toEqual(false);
                    expect(pkg.hasDependants()).toEqual(false);
                    break;
                case "lodash":
                    expect(pkg.isProductionDependency()).toEqual(true);
                    expect(pkg.isDevDependency()).toEqual(false);
                    expect(pkg.hasDependencies()).toEqual(false);
                    expect(pkg.hasDependants()).toEqual(false);
                    break;
                case "jasmine":
                    expect(pkg.isProductionDependency()).toEqual(false);
                    expect(pkg.isDevDependency()).toEqual(true);
                    expect(pkg.hasDependencies()).toEqual(false);
                    expect(pkg.hasDependants()).toEqual(false);
                    break;
                case "sinon":
                    expect(pkg.isProductionDependency()).toEqual(false);
                    expect(pkg.isDevDependency()).toEqual(true);
                    expect(pkg.hasDependencies()).toEqual(false);
                    expect(pkg.hasDependants()).toEqual(false);
                    break;
                }
            });
        });

        // deep creation

        it("should get an array of packages, without n-level dependencies, tracked as 'production' dependencies", function () {
            var data = require("text!tests/data/package-factory/deep2.result.json"),
                rawData = JSON.parse(data).dependencies,
                mockBowerJson = {
                    getAllDependencies: function () {
                        return {
                            dependencies: {
                                "angular": "*",
                                "jquery": "*",
                                "sinon": "*",
                                "lodash": "*",
                                "jasmine": "*"
                            }
                        };
                    }
                },
                result;

            spyOn(ProjectManager, "getBowerJson").andReturn(mockBowerJson);

            result = PackageFactory.createPackagesDeep(rawData);

            expect(Object.keys(result).length).toEqual(5);

            var pkg1 = result.angular,
                pkg2 = result.jquery,
                pkg3 = result.sinon,
                pkg4 = result.lodash,
                pkg5 = result.jasmine;

            expect(pkg1).toBeDefined();
            expect(pkg1.name).toEqual("angular");
            expect(pkg1.isInstalled()).toEqual(true);
            expect(pkg1.isProductionDependency()).toEqual(true);
            expect(pkg1.isProjectDependency).toEqual(true);
            expect(pkg1.installationDir).toBeDefined();
            expect(pkg1.installationDir).not.toBeNull();
            expect(pkg1.hasDependencies()).toEqual(false);
            expect(pkg1.hasDependants()).toEqual(false);

            expect(pkg2).toBeDefined();
            expect(pkg2.name).toEqual("jquery");
            expect(pkg2.isInstalled()).toEqual(true);
            expect(pkg2.isProductionDependency()).toEqual(true);
            expect(pkg2.isProjectDependency).toEqual(true);
            expect(pkg2.installationDir).toBeDefined();
            expect(pkg2.installationDir).not.toBeNull();
            expect(pkg2.hasDependencies()).toEqual(false);
            expect(pkg2.hasDependants()).toEqual(false);

            expect(pkg3).toBeDefined();
            expect(pkg3.name).toEqual("sinon");
            expect(pkg3.isInstalled()).toEqual(true);
            expect(pkg3.isProductionDependency()).toEqual(true);
            expect(pkg3.isProjectDependency).toEqual(true);
            expect(pkg3.installationDir).toBeDefined();
            expect(pkg3.installationDir).not.toBeNull();
            expect(pkg3.hasDependencies()).toEqual(false);
            expect(pkg3.hasDependants()).toEqual(false);

            expect(pkg4).toBeDefined();
            expect(pkg4.name).toEqual("lodash");
            expect(pkg4.isInstalled()).toEqual(true);
            expect(pkg4.isProductionDependency()).toEqual(true);
            expect(pkg4.isProjectDependency).toEqual(true);
            expect(pkg4.installationDir).toBeDefined();
            expect(pkg4.installationDir).not.toBeNull();
            expect(pkg4.hasDependencies()).toEqual(false);
            expect(pkg4.hasDependants()).toEqual(false);

            expect(pkg5).toBeDefined();
            expect(pkg5.name).toEqual("jasmine");
            expect(pkg5.isInstalled()).toEqual(true);
            expect(pkg5.isProductionDependency()).toEqual(true);
            expect(pkg5.isProjectDependency).toEqual(true);
            expect(pkg5.installationDir).toBeDefined();
            expect(pkg5.installationDir).not.toBeNull();
            expect(pkg5.hasDependencies()).toEqual(false);
            expect(pkg5.hasDependants()).toEqual(false);
        });

        it("should get an array of packages, without n-level dependencies, tracked as 'development' dependencies", function () {
            var data = require("text!tests/data/package-factory/deep2.result.json"),
                rawData = JSON.parse(data).dependencies,
                mockBowerJson = {
                    getAllDependencies: function () {
                        return {
                            devDependencies: {
                                "angular": "*",
                                "jquery": "*",
                                "sinon": "*",
                                "lodash": "*",
                                "jasmine": "*"
                            }
                        };
                    }
                },
                result;

            spyOn(ProjectManager, "getBowerJson").andReturn(mockBowerJson);

            result = PackageFactory.createPackagesDeep(rawData);

            expect(Object.keys(result).length).toEqual(5);

            var pkg1 = result.angular,
                pkg2 = result.jquery,
                pkg3 = result.sinon,
                pkg4 = result.lodash,
                pkg5 = result.jasmine;

            expect(pkg1).toBeDefined();
            expect(pkg1.name).toEqual("angular");
            expect(pkg1.isInstalled()).toEqual(true);
            expect(pkg1.isDevDependency()).toEqual(true);
            expect(pkg1.isProductionDependency()).toEqual(false);
            expect(pkg1.isProjectDependency).toEqual(true);
            expect(pkg1.installationDir).toBeDefined();
            expect(pkg1.installationDir).not.toBeNull();
            expect(pkg1.hasDependencies()).toEqual(false);
            expect(pkg1.hasDependants()).toEqual(false);

            expect(pkg2).toBeDefined();
            expect(pkg2.name).toEqual("jquery");
            expect(pkg2.isInstalled()).toEqual(true);
            expect(pkg2.isProductionDependency()).toEqual(false);
            expect(pkg2.isDevDependency()).toEqual(true);
            expect(pkg2.isProjectDependency).toEqual(true);
            expect(pkg2.installationDir).toBeDefined();
            expect(pkg2.installationDir).not.toBeNull();
            expect(pkg2.hasDependencies()).toEqual(false);
            expect(pkg2.hasDependants()).toEqual(false);

            expect(pkg3).toBeDefined();
            expect(pkg3.name).toEqual("sinon");
            expect(pkg3.isInstalled()).toEqual(true);
            expect(pkg3.isProductionDependency()).toEqual(false);
            expect(pkg3.isDevDependency()).toEqual(true);
            expect(pkg3.isProjectDependency).toEqual(true);
            expect(pkg3.installationDir).toBeDefined();
            expect(pkg3.installationDir).not.toBeNull();
            expect(pkg3.hasDependencies()).toEqual(false);
            expect(pkg3.hasDependants()).toEqual(false);

            expect(pkg4).toBeDefined();
            expect(pkg4.name).toEqual("lodash");
            expect(pkg4.isInstalled()).toEqual(true);
            expect(pkg4.isProductionDependency()).toEqual(false);
            expect(pkg4.isDevDependency()).toEqual(true);
            expect(pkg4.isProjectDependency).toEqual(true);
            expect(pkg4.installationDir).toBeDefined();
            expect(pkg4.installationDir).not.toBeNull();
            expect(pkg4.hasDependencies()).toEqual(false);
            expect(pkg4.hasDependants()).toEqual(false);

            expect(pkg5).toBeDefined();
            expect(pkg5.name).toEqual("jasmine");
            expect(pkg5.isInstalled()).toEqual(true);
            expect(pkg5.isProductionDependency()).toEqual(false);
            expect(pkg5.isDevDependency()).toEqual(true);
            expect(pkg5.isProjectDependency).toEqual(true);
            expect(pkg5.installationDir).toBeDefined();
            expect(pkg5.installationDir).not.toBeNull();
            expect(pkg5.hasDependencies()).toEqual(false);
            expect(pkg5.hasDependants()).toEqual(false);
        });

        it("should get an array of packages, without n-level dependencies, tracked as 'production' and 'development' dependencies", function () {
            var data = require("text!tests/data/package-factory/deep2.result.json"),
                rawData = JSON.parse(data).dependencies,
                mockBowerJson = {
                    getAllDependencies: function () {
                        return {
                            dependencies: {
                                "angular": "*",
                                "jquery": "*"
                            },
                            devDependencies: {
                                "sinon": "*",
                                "lodash": "*",
                                "jasmine": "*"
                            }
                        };
                    }
                },
                result;

            spyOn(ProjectManager, "getBowerJson").andReturn(mockBowerJson);

            result = PackageFactory.createPackagesDeep(rawData);

            expect(Object.keys(result).length).toEqual(5);

            var pkg1 = result.angular,
                pkg2 = result.jquery,
                pkg3 = result.sinon,
                pkg4 = result.lodash,
                pkg5 = result.jasmine;

            expect(pkg1).toBeDefined();
            expect(pkg1.name).toEqual("angular");
            expect(pkg1.isInstalled()).toEqual(true);
            expect(pkg1.isProductionDependency()).toEqual(true);
            expect(pkg1.isDevDependency()).toEqual(false);
            expect(pkg1.isProjectDependency).toEqual(true);
            expect(pkg1.hasDependencies()).toEqual(false);
            expect(pkg1.hasDependants()).toEqual(false);

            expect(pkg2).toBeDefined();
            expect(pkg2.name).toEqual("jquery");
            expect(pkg2.isInstalled()).toEqual(true);
            expect(pkg2.isProductionDependency()).toEqual(true);
            expect(pkg2.isDevDependency()).toEqual(false);
            expect(pkg2.isProjectDependency).toEqual(true);
            expect(pkg2.hasDependencies()).toEqual(false);
            expect(pkg2.hasDependants()).toEqual(false);

            expect(pkg3).toBeDefined();
            expect(pkg3.name).toEqual("sinon");
            expect(pkg3.isInstalled()).toEqual(true);
            expect(pkg3.isProductionDependency()).toEqual(false);
            expect(pkg3.isDevDependency()).toEqual(true);
            expect(pkg3.isProjectDependency).toEqual(true);
            expect(pkg3.hasDependencies()).toEqual(false);
            expect(pkg3.hasDependants()).toEqual(false);

            expect(pkg4).toBeDefined();
            expect(pkg4.name).toEqual("lodash");
            expect(pkg4.isInstalled()).toEqual(true);
            expect(pkg4.isProductionDependency()).toEqual(false);
            expect(pkg4.isDevDependency()).toEqual(true);
            expect(pkg4.isProjectDependency).toEqual(true);
            expect(pkg4.hasDependencies()).toEqual(false);
            expect(pkg4.hasDependants()).toEqual(false);

            expect(pkg5).toBeDefined();
            expect(pkg5.name).toEqual("jasmine");
            expect(pkg5.isInstalled()).toEqual(true);
            expect(pkg5.isProductionDependency()).toEqual(false);
            expect(pkg5.isDevDependency()).toEqual(true);
            expect(pkg5.isProjectDependency).toEqual(true);
            expect(pkg5.hasDependencies()).toEqual(false);
            expect(pkg5.hasDependants()).toEqual(false);
        });

        it("should get an array of packages, with n-level dependencies and 1 of them tracked as 'production' dependency", function () {
            var data = require("text!tests/data/package-factory/deep1.result.json"),
                rawData = JSON.parse(data).dependencies,
                mockBowerJson = {
                    getAllDependencies: function () {
                        return {
                            dependencies: {
                                "angular-material": "*"
                            }
                        };
                    }
                },
                result;

            spyOn(ProjectManager, "getBowerJson").andReturn(mockBowerJson);

            result = PackageFactory.createPackagesDeep(rawData);

            expect(Object.keys(result).length).toEqual(4);

            var pkg1 = result["angular-aria"],
                pkg2 = result.angular,
                pkg3 = result["angular-material"],
                pkg4 = result["angular-animate"];

            expect(pkg1).toBeDefined();
            expect(pkg1.name).toEqual("angular-aria");
            expect(pkg1.isInstalled()).toEqual(true);
            expect(pkg1.isProjectDependency).toEqual(false);
            expect(pkg1.hasDependencies()).toEqual(true);
            expect(pkg1.hasDependants()).toEqual(true);
            expect(pkg1.hasDependency("angular")).toEqual(true);
            expect(pkg1.hasDependant("angular-material")).toEqual(true);

            expect(pkg2).toBeDefined();
            expect(pkg2.name).toEqual("angular");
            expect(pkg2.isInstalled()).toEqual(true);
            expect(pkg2.isProjectDependency).toEqual(false);
            expect(pkg2.hasDependencies()).toEqual(false);
            expect(pkg2.hasDependants()).toEqual(true);
            expect(pkg2.hasDependant("angular-animate")).toEqual(true);
            expect(pkg2.hasDependant("angular-aria")).toEqual(true);
            expect(pkg2.hasDependant("angular-material")).toEqual(true);

            expect(pkg3).toBeDefined();
            expect(pkg3.name).toEqual("angular-material");
            expect(pkg3.isInstalled()).toEqual(true);
            expect(pkg3.isProductionDependency()).toEqual(true);
            expect(pkg3.isProjectDependency).toEqual(true);
            expect(pkg3.hasDependencies()).toEqual(true);
            expect(pkg3.hasDependants()).toEqual(false);
            expect(pkg3.hasDependency("angular-animate")).toEqual(true);
            expect(pkg3.hasDependency("angular-aria")).toEqual(true);
            expect(pkg3.hasDependency("angular")).toEqual(true);

            expect(pkg4).toBeDefined();
            expect(pkg4.name).toEqual("angular-animate");
            expect(pkg4.isInstalled()).toEqual(true);
            expect(pkg4.isProjectDependency).toEqual(false);
            expect(pkg4.hasDependencies()).toEqual(true);
            expect(pkg4.hasDependants()).toEqual(true);
            expect(pkg4.hasDependency("angular")).toEqual(true);
            expect(pkg4.hasDependant("angular-material")).toEqual(true);
        });

        it("should get an array of packages, with n-level dependencies and 1 of them tracked as 'development' dependency", function () {
            var data = require("text!tests/data/package-factory/deep1.result.json"),
                rawData = JSON.parse(data).dependencies,
                mockBowerJson = {
                    getAllDependencies: function () {
                        return {
                            devDependencies: {
                                "angular-material": "*"
                            }
                        };
                    }
                },
                result;

            spyOn(ProjectManager, "getBowerJson").andReturn(mockBowerJson);

            result = PackageFactory.createPackagesDeep(rawData);

            expect(Object.keys(result).length).toEqual(4);

            var pkg1 = result["angular-aria"],
                pkg2 = result.angular,
                pkg3 = result["angular-material"],
                pkg4 = result["angular-animate"];

            expect(pkg1).toBeDefined();
            expect(pkg1.name).toEqual("angular-aria");
            expect(pkg1.isInstalled()).toEqual(true);
            expect(pkg1.isProjectDependency).toEqual(false);
            expect(pkg1.hasDependencies()).toEqual(true);
            expect(pkg1.hasDependants()).toEqual(true);
            expect(pkg1.hasDependency("angular")).toEqual(true);
            expect(pkg1.hasDependant("angular-material")).toEqual(true);

            expect(pkg2).toBeDefined();
            expect(pkg2.name).toEqual("angular");
            expect(pkg2.isInstalled()).toEqual(true);
            expect(pkg2.isProjectDependency).toEqual(false);
            expect(pkg2.hasDependencies()).toEqual(false);
            expect(pkg2.hasDependants()).toEqual(true);
            expect(pkg2.hasDependant("angular-animate")).toEqual(true);
            expect(pkg2.hasDependant("angular-aria")).toEqual(true);
            expect(pkg2.hasDependant("angular-material")).toEqual(true);

            expect(pkg3).toBeDefined();
            expect(pkg3.name).toEqual("angular-material");
            expect(pkg3.isInstalled()).toEqual(true);
            expect(pkg3.isProductionDependency()).toEqual(false);
            expect(pkg3.isDevDependency()).toEqual(true);
            expect(pkg3.isProjectDependency).toEqual(true);
            expect(pkg3.hasDependencies()).toEqual(true);
            expect(pkg3.hasDependants()).toEqual(false);
            expect(pkg3.hasDependency("angular-animate")).toEqual(true);
            expect(pkg3.hasDependency("angular-aria")).toEqual(true);
            expect(pkg3.hasDependency("angular")).toEqual(true);

            expect(pkg4).toBeDefined();
            expect(pkg4.name).toEqual("angular-animate");
            expect(pkg4.isInstalled()).toEqual(true);
            expect(pkg4.isProjectDependency).toEqual(false);
            expect(pkg4.hasDependencies()).toEqual(true);
            expect(pkg4.hasDependants()).toEqual(true);
            expect(pkg4.hasDependency("angular")).toEqual(true);
            expect(pkg4.hasDependant("angular-material")).toEqual(true);
        });

        it("should get an array of packages, mix with n-level dependencies and tracked as 'production' dependencies", function () {
            var data = require("text!tests/data/package-factory/deep3.result.json"),
                rawData = JSON.parse(data).dependencies,
                mockBowerJson = {
                    getAllDependencies: function () {
                        return {
                            dependencies: {
                                "angular-material": "*",
                                "jquery": "*",
                                "jasmine": "*"
                            }
                        };
                    }
                },
                result;

            spyOn(ProjectManager, "getBowerJson").andReturn(mockBowerJson);

            result = PackageFactory.createPackagesDeep(rawData);

            expect(Object.keys(result).length).toEqual(6);

            var pkg1 = result["angular-aria"],
                pkg2 = result.angular,
                pkg3 = result["angular-material"],
                pkg4 = result["angular-animate"],
                pkg5 = result.jquery,
                pkg6 = result.jasmine;

            expect(pkg1).toBeDefined();
            expect(pkg1.name).toEqual("angular-aria");
            expect(pkg1.isInstalled()).toEqual(true);
            expect(pkg1.isProjectDependency).toEqual(false);
            expect(pkg1.hasDependencies()).toEqual(true);
            expect(pkg1.hasDependants()).toEqual(true);
            expect(pkg1.hasDependency("angular")).toEqual(true);
            expect(pkg1.hasDependant("angular-material")).toEqual(true);

            expect(pkg2).toBeDefined();
            expect(pkg2.name).toEqual("angular");
            expect(pkg2.isInstalled()).toEqual(true);
            expect(pkg2.isProjectDependency).toEqual(false);
            expect(pkg2.hasDependencies()).toEqual(false);
            expect(pkg2.hasDependants()).toEqual(true);
            expect(pkg2.hasDependant("angular-animate")).toEqual(true);
            expect(pkg2.hasDependant("angular-aria")).toEqual(true);
            expect(pkg2.hasDependant("angular-material")).toEqual(true);

            expect(pkg3).toBeDefined();
            expect(pkg3.name).toEqual("angular-material");
            expect(pkg3.isInstalled()).toEqual(true);
            expect(pkg3.isProductionDependency()).toEqual(true);
            expect(pkg3.isDevDependency()).toEqual(false);
            expect(pkg3.isProjectDependency).toEqual(true);
            expect(pkg3.hasDependencies()).toEqual(true);
            expect(pkg3.hasDependants()).toEqual(false);
            expect(pkg3.hasDependency("angular-animate")).toEqual(true);
            expect(pkg3.hasDependency("angular-aria")).toEqual(true);
            expect(pkg3.hasDependency("angular")).toEqual(true);

            expect(pkg4).toBeDefined();
            expect(pkg4.name).toEqual("angular-animate");
            expect(pkg4.isInstalled()).toEqual(true);
            expect(pkg4.isProjectDependency).toEqual(false);
            expect(pkg4.hasDependencies()).toEqual(true);
            expect(pkg4.hasDependants()).toEqual(true);
            expect(pkg4.hasDependency("angular")).toEqual(true);
            expect(pkg4.hasDependant("angular-material")).toEqual(true);

            expect(pkg5).toBeDefined();
            expect(pkg5.name).toEqual("jquery");
            expect(pkg5.isInstalled()).toEqual(true);
            expect(pkg5.isProductionDependency()).toEqual(true);
            expect(pkg5.isDevDependency()).toEqual(false);
            expect(pkg5.isProjectDependency).toEqual(true);
            expect(pkg5.hasDependencies()).toEqual(false);
            expect(pkg5.hasDependants()).toEqual(false);

            expect(pkg6).toBeDefined();
            expect(pkg6.name).toEqual("jasmine");
            expect(pkg6.isInstalled()).toEqual(true);
            expect(pkg6.isProductionDependency()).toEqual(true);
            expect(pkg6.isDevDependency()).toEqual(false);
            expect(pkg6.isProjectDependency).toEqual(true);
            expect(pkg6.hasDependencies()).toEqual(false);
            expect(pkg6.hasDependants()).toEqual(false);
        });

        it("should get an array of packages, mix with n-level dependencies and tracked as 'development' dependencies", function () {
            var data = require("text!tests/data/package-factory/deep3.result.json"),
                rawData = JSON.parse(data).dependencies,
                mockBowerJson = {
                    getAllDependencies: function () {
                        return {
                            devDependencies: {
                                "angular-material": "*",
                                "jquery": "*",
                                "jasmine": "*"
                            }
                        };
                    }
                },
                result;

            spyOn(ProjectManager, "getBowerJson").andReturn(mockBowerJson);

            result = PackageFactory.createPackagesDeep(rawData);

            expect(Object.keys(result).length).toEqual(6);

            var pkg1 = result["angular-aria"],
                pkg2 = result.angular,
                pkg3 = result["angular-material"],
                pkg4 = result["angular-animate"],
                pkg5 = result.jquery,
                pkg6 = result.jasmine;

            expect(pkg1).toBeDefined();
            expect(pkg1.name).toEqual("angular-aria");
            expect(pkg1.isInstalled()).toEqual(true);
            expect(pkg1.isProjectDependency).toEqual(false);
            expect(pkg1.hasDependencies()).toEqual(true);
            expect(pkg1.hasDependants()).toEqual(true);
            expect(pkg1.hasDependency("angular")).toEqual(true);
            expect(pkg1.hasDependant("angular-material")).toEqual(true);

            expect(pkg2).toBeDefined();
            expect(pkg2.name).toEqual("angular");
            expect(pkg2.isInstalled()).toEqual(true);
            expect(pkg2.isProjectDependency).toEqual(false);
            expect(pkg2.hasDependencies()).toEqual(false);
            expect(pkg2.hasDependants()).toEqual(true);
            expect(pkg2.hasDependant("angular-animate")).toEqual(true);
            expect(pkg2.hasDependant("angular-aria")).toEqual(true);
            expect(pkg2.hasDependant("angular-material")).toEqual(true);

            expect(pkg3).toBeDefined();
            expect(pkg3.name).toEqual("angular-material");
            expect(pkg3.isInstalled()).toEqual(true);
            expect(pkg3.isProductionDependency()).toEqual(false);
            expect(pkg3.isDevDependency()).toEqual(true);
            expect(pkg3.isProjectDependency).toEqual(true);
            expect(pkg3.hasDependencies()).toEqual(true);
            expect(pkg3.hasDependants()).toEqual(false);
            expect(pkg3.hasDependency("angular-animate")).toEqual(true);
            expect(pkg3.hasDependency("angular-aria")).toEqual(true);
            expect(pkg3.hasDependency("angular")).toEqual(true);

            expect(pkg4).toBeDefined();
            expect(pkg4.name).toEqual("angular-animate");
            expect(pkg4.isInstalled()).toEqual(true);
            expect(pkg4.isProjectDependency).toEqual(false);
            expect(pkg4.hasDependencies()).toEqual(true);
            expect(pkg4.hasDependants()).toEqual(true);
            expect(pkg4.hasDependency("angular")).toEqual(true);
            expect(pkg4.hasDependant("angular-material")).toEqual(true);

            expect(pkg5).toBeDefined();
            expect(pkg5.name).toEqual("jquery");
            expect(pkg5.isInstalled()).toEqual(true);
            expect(pkg5.isProductionDependency()).toEqual(false);
            expect(pkg5.isDevDependency()).toEqual(true);
            expect(pkg5.isProjectDependency).toEqual(true);
            expect(pkg5.hasDependencies()).toEqual(false);
            expect(pkg5.hasDependants()).toEqual(false);

            expect(pkg6).toBeDefined();
            expect(pkg6.name).toEqual("jasmine");
            expect(pkg6.isInstalled()).toEqual(true);
            expect(pkg6.isProductionDependency()).toEqual(false);
            expect(pkg6.isDevDependency()).toEqual(true);
            expect(pkg6.isProjectDependency).toEqual(true);
            expect(pkg6.hasDependencies()).toEqual(false);
            expect(pkg6.hasDependants()).toEqual(false);
        });

        it("should get an array of packages, mix with n-level dependencies and tracked as 'production' and 'development' dependencies", function () {
            var data = require("text!tests/data/package-factory/deep3.result.json"),
                rawData = JSON.parse(data).dependencies,
                mockBowerJson = {
                    getAllDependencies: function () {
                        return {
                            dependencies: {
                                "angular-material": "*",
                                "jquery": "*"
                            },
                            devDependencies: {
                                "jasmine": "*"
                            }
                        };
                    }
                },
                result;

            spyOn(ProjectManager, "getBowerJson").andReturn(mockBowerJson);

            result = PackageFactory.createPackagesDeep(rawData);

            expect(Object.keys(result).length).toEqual(6);

            var pkg1 = result["angular-aria"],
                pkg2 = result.angular,
                pkg3 = result["angular-material"],
                pkg4 = result["angular-animate"],
                pkg5 = result.jquery,
                pkg6 = result.jasmine;

            expect(pkg1).toBeDefined();
            expect(pkg1.name).toEqual("angular-aria");
            expect(pkg1.isInstalled()).toEqual(true);
            expect(pkg1.isProjectDependency).toEqual(false);
            expect(pkg1.hasDependencies()).toEqual(true);
            expect(pkg1.hasDependants()).toEqual(true);
            expect(pkg1.hasDependency("angular")).toEqual(true);
            expect(pkg1.hasDependant("angular-material")).toEqual(true);

            expect(pkg2).toBeDefined();
            expect(pkg2.name).toEqual("angular");
            expect(pkg2.isInstalled()).toEqual(true);
            expect(pkg2.isProjectDependency).toEqual(false);
            expect(pkg2.hasDependencies()).toEqual(false);
            expect(pkg2.hasDependants()).toEqual(true);
            expect(pkg2.hasDependant("angular-animate")).toEqual(true);
            expect(pkg2.hasDependant("angular-aria")).toEqual(true);
            expect(pkg2.hasDependant("angular-material")).toEqual(true);

            expect(pkg3).toBeDefined();
            expect(pkg3.name).toEqual("angular-material");
            expect(pkg3.isInstalled()).toEqual(true);
            expect(pkg3.isProductionDependency()).toEqual(true);
            expect(pkg3.isDevDependency()).toEqual(false);
            expect(pkg3.isProjectDependency).toEqual(true);
            expect(pkg3.hasDependencies()).toEqual(true);
            expect(pkg3.hasDependants()).toEqual(false);
            expect(pkg3.hasDependency("angular-animate")).toEqual(true);
            expect(pkg3.hasDependency("angular-aria")).toEqual(true);
            expect(pkg3.hasDependency("angular")).toEqual(true);

            expect(pkg4).toBeDefined();
            expect(pkg4.name).toEqual("angular-animate");
            expect(pkg4.isInstalled()).toEqual(true);
            expect(pkg4.isProjectDependency).toEqual(false);
            expect(pkg4.hasDependencies()).toEqual(true);
            expect(pkg4.hasDependants()).toEqual(true);
            expect(pkg4.hasDependency("angular")).toEqual(true);
            expect(pkg4.hasDependant("angular-material")).toEqual(true);

            expect(pkg5).toBeDefined();
            expect(pkg5.name).toEqual("jquery");
            expect(pkg5.isInstalled()).toEqual(true);
            expect(pkg5.isProductionDependency()).toEqual(true);
            expect(pkg5.isDevDependency()).toEqual(false);
            expect(pkg5.isProjectDependency).toEqual(true);
            expect(pkg5.hasDependencies()).toEqual(false);
            expect(pkg5.hasDependants()).toEqual(false);

            expect(pkg6).toBeDefined();
            expect(pkg6.name).toEqual("jasmine");
            expect(pkg6.isInstalled()).toEqual(true);
            expect(pkg6.isProductionDependency()).toEqual(false);
            expect(pkg6.isDevDependency()).toEqual(true);
            expect(pkg6.isProjectDependency).toEqual(true);
            expect(pkg6.hasDependencies()).toEqual(false);
            expect(pkg6.hasDependants()).toEqual(false);
        });

        it("should get an array of packages, with n-level dependencies and a shared dependency, tracked as 'production' dependencies", function () {
            var data = require("text!tests/data/package-factory/deep4.result.json"),
                rawData = JSON.parse(data).dependencies,
                mockBowerJson = {
                    getAllDependencies: function () {
                        return {
                            dependencies: {
                                "angular-material": "*",
                                "angular": "*",
                                "jquery": "*",
                                "jasmine": "*"
                            }
                        };
                    }
                },
                result;

            spyOn(ProjectManager, "getBowerJson").andReturn(mockBowerJson);

            result = PackageFactory.createPackagesDeep(rawData);

            expect(Object.keys(result).length).toEqual(6);

            var pkg1 = result["angular-aria"],
                pkg2 = result.angular,
                pkg3 = result["angular-material"],
                pkg4 = result["angular-animate"],
                pkg5 = result.jquery,
                pkg6 = result.jasmine;

            expect(pkg1).toBeDefined();
            expect(pkg1.name).toEqual("angular-aria");
            expect(pkg1.isInstalled()).toEqual(true);
            expect(pkg1.isProjectDependency).toEqual(false);
            expect(pkg1.hasDependencies()).toEqual(true);
            expect(pkg1.hasDependants()).toEqual(true);
            expect(pkg1.hasDependency("angular")).toEqual(true);
            expect(pkg1.hasDependant("angular-material")).toEqual(true);

            expect(pkg2).toBeDefined();
            expect(pkg2.name).toEqual("angular");
            expect(pkg2.isInstalled()).toEqual(true);
            expect(pkg3.isProductionDependency()).toEqual(true);
            expect(pkg3.isDevDependency()).toEqual(false);
            expect(pkg2.isProjectDependency).toEqual(true);
            expect(pkg2.hasDependencies()).toEqual(false);
            expect(pkg2.hasDependants()).toEqual(true);
            expect(pkg2.hasDependant("angular-animate")).toEqual(true);
            expect(pkg2.hasDependant("angular-aria")).toEqual(true);
            expect(pkg2.hasDependant("angular-material")).toEqual(true);

            expect(pkg3).toBeDefined();
            expect(pkg3.name).toEqual("angular-material");
            expect(pkg3.isInstalled()).toEqual(true);
            expect(pkg3.isProductionDependency()).toEqual(true);
            expect(pkg3.isDevDependency()).toEqual(false);
            expect(pkg3.isProjectDependency).toEqual(true);
            expect(pkg3.hasDependencies()).toEqual(true);
            expect(pkg3.hasDependants()).toEqual(false);
            expect(pkg3.hasDependency("angular-animate")).toEqual(true);
            expect(pkg3.hasDependency("angular-aria")).toEqual(true);
            expect(pkg3.hasDependency("angular")).toEqual(true);

            expect(pkg4).toBeDefined();
            expect(pkg4.name).toEqual("angular-animate");
            expect(pkg4.isInstalled()).toEqual(true);
            expect(pkg4.isProjectDependency).toEqual(false);
            expect(pkg4.hasDependencies()).toEqual(true);
            expect(pkg4.hasDependants()).toEqual(true);
            expect(pkg4.hasDependency("angular")).toEqual(true);
            expect(pkg4.hasDependant("angular-material")).toEqual(true);

            expect(pkg5).toBeDefined();
            expect(pkg5.name).toEqual("jquery");
            expect(pkg5.isInstalled()).toEqual(true);
            expect(pkg5.isProductionDependency()).toEqual(true);
            expect(pkg5.isDevDependency()).toEqual(false);
            expect(pkg5.isProjectDependency).toEqual(true);
            expect(pkg5.hasDependencies()).toEqual(false);
            expect(pkg5.hasDependants()).toEqual(false);

            expect(pkg6).toBeDefined();
            expect(pkg6.name).toEqual("jasmine");
            expect(pkg6.isInstalled()).toEqual(true);
            expect(pkg6.isProductionDependency()).toEqual(true);
            expect(pkg6.isDevDependency()).toEqual(false);
            expect(pkg6.isProjectDependency).toEqual(true);
            expect(pkg6.hasDependencies()).toEqual(false);
            expect(pkg6.hasDependants()).toEqual(false);
        });

        it("should get an array of packages, with n-level dependencies and a shared dependency, tracked as 'development' dependencies", function () {
            var data = require("text!tests/data/package-factory/deep4.result.json"),
                rawData = JSON.parse(data).dependencies,
                mockBowerJson = {
                    getAllDependencies: function () {
                        return {
                            devDependencies: {
                                "angular-material": "*",
                                "angular": "*",
                                "jquery": "*",
                                "jasmine": "*"
                            }
                        };
                    }
                },
                result;

            spyOn(ProjectManager, "getBowerJson").andReturn(mockBowerJson);

            result = PackageFactory.createPackagesDeep(rawData);

            expect(Object.keys(result).length).toEqual(6);

            var pkg1 = result["angular-aria"],
                pkg2 = result.angular,
                pkg3 = result["angular-material"],
                pkg4 = result["angular-animate"],
                pkg5 = result.jquery,
                pkg6 = result.jasmine;

            expect(pkg1).toBeDefined();
            expect(pkg1.name).toEqual("angular-aria");
            expect(pkg1.isInstalled()).toEqual(true);
            expect(pkg1.isProjectDependency).toEqual(false);
            expect(pkg1.hasDependencies()).toEqual(true);
            expect(pkg1.hasDependants()).toEqual(true);
            expect(pkg1.hasDependency("angular")).toEqual(true);
            expect(pkg1.hasDependant("angular-material")).toEqual(true);

            expect(pkg2).toBeDefined();
            expect(pkg2.name).toEqual("angular");
            expect(pkg2.isInstalled()).toEqual(true);
            expect(pkg3.isProductionDependency()).toEqual(false);
            expect(pkg3.isDevDependency()).toEqual(true);
            expect(pkg2.isProjectDependency).toEqual(true);
            expect(pkg2.hasDependencies()).toEqual(false);
            expect(pkg2.hasDependants()).toEqual(true);
            expect(pkg2.hasDependant("angular-animate")).toEqual(true);
            expect(pkg2.hasDependant("angular-aria")).toEqual(true);
            expect(pkg2.hasDependant("angular-material")).toEqual(true);

            expect(pkg3).toBeDefined();
            expect(pkg3.name).toEqual("angular-material");
            expect(pkg3.isInstalled()).toEqual(true);
            expect(pkg3.isProductionDependency()).toEqual(false);
            expect(pkg3.isDevDependency()).toEqual(true);
            expect(pkg3.isProjectDependency).toEqual(true);
            expect(pkg3.hasDependencies()).toEqual(true);
            expect(pkg3.hasDependants()).toEqual(false);
            expect(pkg3.hasDependency("angular-animate")).toEqual(true);
            expect(pkg3.hasDependency("angular-aria")).toEqual(true);
            expect(pkg3.hasDependency("angular")).toEqual(true);

            expect(pkg4).toBeDefined();
            expect(pkg4.name).toEqual("angular-animate");
            expect(pkg4.isInstalled()).toEqual(true);
            expect(pkg4.isProjectDependency).toEqual(false);
            expect(pkg4.hasDependencies()).toEqual(true);
            expect(pkg4.hasDependants()).toEqual(true);
            expect(pkg4.hasDependency("angular")).toEqual(true);
            expect(pkg4.hasDependant("angular-material")).toEqual(true);

            expect(pkg5).toBeDefined();
            expect(pkg5.name).toEqual("jquery");
            expect(pkg5.isInstalled()).toEqual(true);
            expect(pkg5.isProductionDependency()).toEqual(false);
            expect(pkg5.isDevDependency()).toEqual(true);
            expect(pkg5.isProjectDependency).toEqual(true);
            expect(pkg5.hasDependencies()).toEqual(false);
            expect(pkg5.hasDependants()).toEqual(false);

            expect(pkg6).toBeDefined();
            expect(pkg6.name).toEqual("jasmine");
            expect(pkg6.isInstalled()).toEqual(true);
            expect(pkg6.isProductionDependency()).toEqual(false);
            expect(pkg6.isDevDependency()).toEqual(true);
            expect(pkg6.isProjectDependency).toEqual(true);
            expect(pkg6.hasDependencies()).toEqual(false);
            expect(pkg6.hasDependants()).toEqual(false);
        });

        it("should get an array of packages, with n-level dependencies and a shared dependency, tracked as 'production' and 'development' dependencies", function () {
            var data = require("text!tests/data/package-factory/deep4.result.json"),
                rawData = JSON.parse(data).dependencies,
                mockBowerJson = {
                    getAllDependencies: function () {
                        return {
                            dependencies: {
                                "angular-material": "*",
                                "angular": "*"
                            },
                            devDependencies: {
                                "jquery": "*",
                                "jasmine": "*"
                            }
                        };
                    }
                },
                result;

            spyOn(ProjectManager, "getBowerJson").andReturn(mockBowerJson);

            result = PackageFactory.createPackagesDeep(rawData);

            expect(Object.keys(result).length).toEqual(6);

            var pkg1 = result["angular-aria"],
                pkg2 = result.angular,
                pkg3 = result["angular-material"],
                pkg4 = result["angular-animate"],
                pkg5 = result.jquery,
                pkg6 = result.jasmine;

            expect(pkg1).toBeDefined();
            expect(pkg1.name).toEqual("angular-aria");
            expect(pkg1.isInstalled()).toEqual(true);
            expect(pkg1.isProjectDependency).toEqual(false);
            expect(pkg1.hasDependencies()).toEqual(true);
            expect(pkg1.hasDependants()).toEqual(true);
            expect(pkg1.hasDependency("angular")).toEqual(true);
            expect(pkg1.hasDependant("angular-material")).toEqual(true);

            expect(pkg2).toBeDefined();
            expect(pkg2.name).toEqual("angular");
            expect(pkg2.isInstalled()).toEqual(true);
            expect(pkg3.isProductionDependency()).toEqual(true);
            expect(pkg3.isDevDependency()).toEqual(false);
            expect(pkg2.isProjectDependency).toEqual(true);
            expect(pkg2.hasDependencies()).toEqual(false);
            expect(pkg2.hasDependants()).toEqual(true);
            expect(pkg2.hasDependant("angular-animate")).toEqual(true);
            expect(pkg2.hasDependant("angular-aria")).toEqual(true);
            expect(pkg2.hasDependant("angular-material")).toEqual(true);

            expect(pkg3).toBeDefined();
            expect(pkg3.name).toEqual("angular-material");
            expect(pkg3.isInstalled()).toEqual(true);
            expect(pkg3.isProductionDependency()).toEqual(true);
            expect(pkg3.isDevDependency()).toEqual(false);
            expect(pkg3.isProjectDependency).toEqual(true);
            expect(pkg3.hasDependencies()).toEqual(true);
            expect(pkg3.hasDependants()).toEqual(false);
            expect(pkg3.hasDependency("angular-animate")).toEqual(true);
            expect(pkg3.hasDependency("angular-aria")).toEqual(true);
            expect(pkg3.hasDependency("angular")).toEqual(true);

            expect(pkg4).toBeDefined();
            expect(pkg4.name).toEqual("angular-animate");
            expect(pkg4.isInstalled()).toEqual(true);
            expect(pkg4.isProjectDependency).toEqual(false);
            expect(pkg4.hasDependencies()).toEqual(true);
            expect(pkg4.hasDependants()).toEqual(true);
            expect(pkg4.hasDependency("angular")).toEqual(true);
            expect(pkg4.hasDependant("angular-material")).toEqual(true);

            expect(pkg5).toBeDefined();
            expect(pkg5.name).toEqual("jquery");
            expect(pkg5.isInstalled()).toEqual(true);
            expect(pkg5.isProductionDependency()).toEqual(false);
            expect(pkg5.isDevDependency()).toEqual(true);
            expect(pkg5.isProjectDependency).toEqual(true);
            expect(pkg5.hasDependencies()).toEqual(false);
            expect(pkg5.hasDependants()).toEqual(false);

            expect(pkg6).toBeDefined();
            expect(pkg6.name).toEqual("jasmine");
            expect(pkg6.isInstalled()).toEqual(true);
            expect(pkg6.isProductionDependency()).toEqual(false);
            expect(pkg6.isDevDependency()).toEqual(true);
            expect(pkg6.isProjectDependency).toEqual(true);
            expect(pkg6.hasDependencies()).toEqual(false);
            expect(pkg6.hasDependants()).toEqual(false);
        });

        it("should get an array of packages, with n-level dependencies, a shared dependency and 'extraneous', tracked as 'production' dependencies", function () {
            var data = require("text!tests/data/package-factory/deep5.result.json"),
                rawData = JSON.parse(data).dependencies,
                mockBowerJson = {
                    getAllDependencies: function () {
                        return {
                            dependencies: {
                                "angular-material": "*",
                                "angular": "*",
                                "jasmine": "*"
                            }
                        };
                    }
                },
                result;

            spyOn(ProjectManager, "getBowerJson").andReturn(mockBowerJson);

            result = PackageFactory.createPackagesDeep(rawData);

            expect(Object.keys(result).length).toEqual(6);

            var pkg1 = result["angular-aria"],
                pkg2 = result.angular,
                pkg3 = result["angular-material"],
                pkg4 = result["angular-animate"],
                pkg5 = result.jquery,
                pkg6 = result.jasmine;

            expect(pkg1).toBeDefined();
            expect(pkg1.name).toEqual("angular-aria");
            expect(pkg1.isInstalled()).toEqual(true);
            expect(pkg1.isProjectDependency).toEqual(false);
            expect(pkg1.hasDependencies()).toEqual(true);
            expect(pkg1.hasDependants()).toEqual(true);
            expect(pkg1.hasDependency("angular")).toEqual(true);
            expect(pkg1.hasDependant("angular-material")).toEqual(true);

            expect(pkg2).toBeDefined();
            expect(pkg2.name).toEqual("angular");
            expect(pkg2.isInstalled()).toEqual(true);
            expect(pkg3.isProductionDependency()).toEqual(true);
            expect(pkg3.isDevDependency()).toEqual(false);
            expect(pkg2.isProjectDependency).toEqual(true);
            expect(pkg2.hasDependencies()).toEqual(false);
            expect(pkg2.hasDependants()).toEqual(true);
            expect(pkg2.hasDependant("angular-animate")).toEqual(true);
            expect(pkg2.hasDependant("angular-aria")).toEqual(true);
            expect(pkg2.hasDependant("angular-material")).toEqual(true);

            expect(pkg3).toBeDefined();
            expect(pkg3.name).toEqual("angular-material");
            expect(pkg3.isInstalled()).toEqual(true);
            expect(pkg3.isProductionDependency()).toEqual(true);
            expect(pkg3.isDevDependency()).toEqual(false);
            expect(pkg3.isProjectDependency).toEqual(true);
            expect(pkg3.hasDependencies()).toEqual(true);
            expect(pkg3.hasDependants()).toEqual(false);
            expect(pkg3.hasDependency("angular-animate")).toEqual(true);
            expect(pkg3.hasDependency("angular-aria")).toEqual(true);
            expect(pkg3.hasDependency("angular")).toEqual(true);

            expect(pkg4).toBeDefined();
            expect(pkg4.name).toEqual("angular-animate");
            expect(pkg4.isInstalled()).toEqual(true);
            expect(pkg4.isProjectDependency).toEqual(false);
            expect(pkg4.hasDependencies()).toEqual(true);
            expect(pkg4.hasDependants()).toEqual(true);
            expect(pkg4.hasDependency("angular")).toEqual(true);
            expect(pkg4.hasDependant("angular-material")).toEqual(true);

            expect(pkg5).toBeDefined();
            expect(pkg5.name).toEqual("jquery");
            expect(pkg5.isProductionDependency()).toEqual(true);
            expect(pkg5.isNotTracked()).toEqual(true); // and installed
            expect(pkg5.isDevDependency()).toEqual(false);
            expect(pkg5.isProjectDependency).toEqual(true);
            expect(pkg5.hasDependencies()).toEqual(false);
            expect(pkg5.hasDependants()).toEqual(false);

            expect(pkg6).toBeDefined();
            expect(pkg6.name).toEqual("jasmine");
            expect(pkg6.isInstalled()).toEqual(true);
            expect(pkg6.isProductionDependency()).toEqual(true);
            expect(pkg6.isDevDependency()).toEqual(false);
            expect(pkg6.isProjectDependency).toEqual(true);
            expect(pkg6.hasDependencies()).toEqual(false);
            expect(pkg6.hasDependants()).toEqual(false);
        });

        it("should get an array of packages, with n-level dependencies, a shared dependency and 'extraneous', tracked as 'development' dependencies", function () {
            var data = require("text!tests/data/package-factory/deep5.result.json"),
                rawData = JSON.parse(data).dependencies,
                mockBowerJson = {
                    getAllDependencies: function () {
                        return {
                            devDependencies: {
                                "angular-material": "*",
                                "angular": "*",
                                "jasmine": "*"
                            }
                        };
                    }
                },
                result;

            spyOn(ProjectManager, "getBowerJson").andReturn(mockBowerJson);

            result = PackageFactory.createPackagesDeep(rawData);

            expect(Object.keys(result).length).toEqual(6);

            var pkg1 = result["angular-aria"],
                pkg2 = result.angular,
                pkg3 = result["angular-material"],
                pkg4 = result["angular-animate"],
                pkg5 = result.jquery,
                pkg6 = result.jasmine;

            expect(pkg1).toBeDefined();
            expect(pkg1.name).toEqual("angular-aria");
            expect(pkg1.isInstalled()).toEqual(true);
            expect(pkg1.isProjectDependency).toEqual(false);
            expect(pkg1.hasDependencies()).toEqual(true);
            expect(pkg1.hasDependants()).toEqual(true);
            expect(pkg1.hasDependency("angular")).toEqual(true);
            expect(pkg1.hasDependant("angular-material")).toEqual(true);

            expect(pkg2).toBeDefined();
            expect(pkg2.name).toEqual("angular");
            expect(pkg2.isInstalled()).toEqual(true);
            expect(pkg3.isProductionDependency()).toEqual(false);
            expect(pkg3.isDevDependency()).toEqual(true);
            expect(pkg2.isProjectDependency).toEqual(true);
            expect(pkg2.hasDependencies()).toEqual(false);
            expect(pkg2.hasDependants()).toEqual(true);
            expect(pkg2.hasDependant("angular-animate")).toEqual(true);
            expect(pkg2.hasDependant("angular-aria")).toEqual(true);
            expect(pkg2.hasDependant("angular-material")).toEqual(true);

            expect(pkg3).toBeDefined();
            expect(pkg3.name).toEqual("angular-material");
            expect(pkg3.isInstalled()).toEqual(true);
            expect(pkg3.isProductionDependency()).toEqual(false);
            expect(pkg3.isDevDependency()).toEqual(true);
            expect(pkg3.isProjectDependency).toEqual(true);
            expect(pkg3.hasDependencies()).toEqual(true);
            expect(pkg3.hasDependants()).toEqual(false);
            expect(pkg3.hasDependency("angular-animate")).toEqual(true);
            expect(pkg3.hasDependency("angular-aria")).toEqual(true);
            expect(pkg3.hasDependency("angular")).toEqual(true);

            expect(pkg4).toBeDefined();
            expect(pkg4.name).toEqual("angular-animate");
            expect(pkg4.isInstalled()).toEqual(true);
            expect(pkg4.isProjectDependency).toEqual(false);
            expect(pkg4.hasDependencies()).toEqual(true);
            expect(pkg4.hasDependants()).toEqual(true);
            expect(pkg4.hasDependency("angular")).toEqual(true);
            expect(pkg4.hasDependant("angular-material")).toEqual(true);

            expect(pkg5).toBeDefined();
            expect(pkg5.name).toEqual("jquery");
            expect(pkg5.isProductionDependency()).toEqual(true);
            expect(pkg5.isNotTracked()).toEqual(true); // and installed
            expect(pkg5.isDevDependency()).toEqual(false);
            expect(pkg5.isProjectDependency).toEqual(true);
            expect(pkg5.hasDependencies()).toEqual(false);
            expect(pkg5.hasDependants()).toEqual(false);

            expect(pkg6).toBeDefined();
            expect(pkg6.name).toEqual("jasmine");
            expect(pkg6.isInstalled()).toEqual(true);
            expect(pkg6.isProductionDependency()).toEqual(false);
            expect(pkg6.isDevDependency()).toEqual(true);
            expect(pkg6.isProjectDependency).toEqual(true);
            expect(pkg6.hasDependencies()).toEqual(false);
            expect(pkg6.hasDependants()).toEqual(false);
        });

        it("should get an array of packages, with n-level dependencies, a shared dependency and 'extraneous', tracked as 'production' and 'development' dependencies", function () {
            var data = require("text!tests/data/package-factory/deep5.result.json"),
                rawData = JSON.parse(data).dependencies,
                mockBowerJson = {
                    getAllDependencies: function () {
                        return {
                            dependencies: {
                                "angular-material": "*",
                                "angular": "*"
                            },
                            devDependencies: {
                                "jasmine": "*"
                            }
                        };
                    }
                },
                result;

            spyOn(ProjectManager, "getBowerJson").andReturn(mockBowerJson);

            result = PackageFactory.createPackagesDeep(rawData);

            expect(Object.keys(result).length).toEqual(6);

            var pkg1 = result["angular-aria"],
                pkg2 = result.angular,
                pkg3 = result["angular-material"],
                pkg4 = result["angular-animate"],
                pkg5 = result.jquery,
                pkg6 = result.jasmine;

            expect(pkg1).toBeDefined();
            expect(pkg1.name).toEqual("angular-aria");
            expect(pkg1.isInstalled()).toEqual(true);
            expect(pkg1.isProjectDependency).toEqual(false);
            expect(pkg1.hasDependencies()).toEqual(true);
            expect(pkg1.hasDependants()).toEqual(true);
            expect(pkg1.hasDependency("angular")).toEqual(true);
            expect(pkg1.hasDependant("angular-material")).toEqual(true);

            expect(pkg2).toBeDefined();
            expect(pkg2.name).toEqual("angular");
            expect(pkg2.isInstalled()).toEqual(true);
            expect(pkg3.isProductionDependency()).toEqual(true);
            expect(pkg3.isDevDependency()).toEqual(false);
            expect(pkg2.isProjectDependency).toEqual(true);
            expect(pkg2.hasDependencies()).toEqual(false);
            expect(pkg2.hasDependants()).toEqual(true);
            expect(pkg2.hasDependant("angular-animate")).toEqual(true);
            expect(pkg2.hasDependant("angular-aria")).toEqual(true);
            expect(pkg2.hasDependant("angular-material")).toEqual(true);

            expect(pkg3).toBeDefined();
            expect(pkg3.name).toEqual("angular-material");
            expect(pkg3.isInstalled()).toEqual(true);
            expect(pkg3.isProductionDependency()).toEqual(true);
            expect(pkg3.isDevDependency()).toEqual(false);
            expect(pkg3.isProjectDependency).toEqual(true);
            expect(pkg3.hasDependencies()).toEqual(true);
            expect(pkg3.hasDependants()).toEqual(false);
            expect(pkg3.hasDependency("angular-animate")).toEqual(true);
            expect(pkg3.hasDependency("angular-aria")).toEqual(true);
            expect(pkg3.hasDependency("angular")).toEqual(true);

            expect(pkg4).toBeDefined();
            expect(pkg4.name).toEqual("angular-animate");
            expect(pkg4.isInstalled()).toEqual(true);
            expect(pkg4.isProjectDependency).toEqual(false);
            expect(pkg4.hasDependencies()).toEqual(true);
            expect(pkg4.hasDependants()).toEqual(true);
            expect(pkg4.hasDependency("angular")).toEqual(true);
            expect(pkg4.hasDependant("angular-material")).toEqual(true);

            expect(pkg5).toBeDefined();
            expect(pkg5.name).toEqual("jquery");
            expect(pkg5.isProductionDependency()).toEqual(true);
            expect(pkg5.isNotTracked()).toEqual(true); // and installed
            expect(pkg5.isDevDependency()).toEqual(false);
            expect(pkg5.isProjectDependency).toEqual(true);
            expect(pkg5.hasDependencies()).toEqual(false);
            expect(pkg5.hasDependants()).toEqual(false);

            expect(pkg6).toBeDefined();
            expect(pkg6.name).toEqual("jasmine");
            expect(pkg6.isInstalled()).toEqual(true);
            expect(pkg6.isProductionDependency()).toEqual(false);
            expect(pkg6.isDevDependency()).toEqual(true);
            expect(pkg6.isProjectDependency).toEqual(true);
            expect(pkg6.hasDependencies()).toEqual(false);
            expect(pkg6.hasDependants()).toEqual(false);
        });

        it("should get an array of packages, with n-level dependencies, a shared dependency, 'extraneous' and 'missing', tracked as 'production' dependencies", function () {
            var data = require("text!tests/data/package-factory/deep6.result.json"),
                rawData = JSON.parse(data).dependencies,
                mockBowerJson = {
                    getAllDependencies: function () {
                        return {
                            dependencies: {
                                "angular-material": "*",
                                "angular": "*",
                                "jasmine": "*",
                                "lodash": "*"
                            }
                        };
                    }
                },
                result;

            spyOn(ProjectManager, "getBowerJson").andReturn(mockBowerJson);

            result = PackageFactory.createPackagesDeep(rawData);

            expect(Object.keys(result).length).toEqual(7);

            var pkg1 = result["angular-aria"],
                pkg2 = result.angular,
                pkg3 = result["angular-material"],
                pkg4 = result["angular-animate"],
                pkg5 = result.jquery,
                pkg6 = result.jasmine,
                pkg7 = result.lodash;

            expect(pkg1).toBeDefined();
            expect(pkg1.name).toEqual("angular-aria");
            expect(pkg1.isInstalled()).toEqual(true);
            expect(pkg1.isProjectDependency).toEqual(false);
            expect(pkg1.hasDependencies()).toEqual(true);
            expect(pkg1.hasDependants()).toEqual(true);
            expect(pkg1.hasDependency("angular")).toEqual(true);
            expect(pkg1.hasDependant("angular-material")).toEqual(true);

            expect(pkg2).toBeDefined();
            expect(pkg2.name).toEqual("angular");
            expect(pkg2.isInstalled()).toEqual(true);
            expect(pkg3.isProductionDependency()).toEqual(true);
            expect(pkg3.isDevDependency()).toEqual(false);
            expect(pkg2.isProjectDependency).toEqual(true);
            expect(pkg2.hasDependencies()).toEqual(false);
            expect(pkg2.hasDependants()).toEqual(true);
            expect(pkg2.hasDependant("angular-animate")).toEqual(true);
            expect(pkg2.hasDependant("angular-aria")).toEqual(true);
            expect(pkg2.hasDependant("angular-material")).toEqual(true);

            expect(pkg3).toBeDefined();
            expect(pkg3.name).toEqual("angular-material");
            expect(pkg3.isInstalled()).toEqual(true);
            expect(pkg3.isProductionDependency()).toEqual(true);
            expect(pkg3.isDevDependency()).toEqual(false);
            expect(pkg3.isProjectDependency).toEqual(true);
            expect(pkg3.hasDependencies()).toEqual(true);
            expect(pkg3.hasDependants()).toEqual(false);
            expect(pkg3.hasDependency("angular-animate")).toEqual(true);
            expect(pkg3.hasDependency("angular-aria")).toEqual(true);
            expect(pkg3.hasDependency("angular")).toEqual(true);

            expect(pkg4).toBeDefined();
            expect(pkg4.name).toEqual("angular-animate");
            expect(pkg4.isInstalled()).toEqual(true);
            expect(pkg4.isProjectDependency).toEqual(false);
            expect(pkg4.hasDependencies()).toEqual(true);
            expect(pkg4.hasDependants()).toEqual(true);
            expect(pkg4.hasDependency("angular")).toEqual(true);
            expect(pkg4.hasDependant("angular-material")).toEqual(true);

            expect(pkg5).toBeDefined();
            expect(pkg5.name).toEqual("jquery");
            expect(pkg5.isProductionDependency()).toEqual(true);
            expect(pkg5.isNotTracked()).toEqual(true); // and installed
            expect(pkg5.isDevDependency()).toEqual(false);
            expect(pkg5.isProjectDependency).toEqual(true);
            expect(pkg5.hasDependencies()).toEqual(false);
            expect(pkg5.hasDependants()).toEqual(false);

            expect(pkg6).toBeDefined();
            expect(pkg6.name).toEqual("jasmine");
            expect(pkg6.isInstalled()).toEqual(true);
            expect(pkg6.isProductionDependency()).toEqual(true);
            expect(pkg6.isDevDependency()).toEqual(false);
            expect(pkg6.isProjectDependency).toEqual(true);
            expect(pkg6.hasDependencies()).toEqual(false);
            expect(pkg6.hasDependants()).toEqual(false);

            expect(pkg7).toBeDefined();
            expect(pkg7.name).toEqual("lodash");
            expect(pkg7.isInstalled()).toEqual(false);
            expect(pkg7.isMissing()).toEqual(true);
            expect(pkg7.isProductionDependency()).toEqual(true);
            expect(pkg7.isDevDependency()).toEqual(false);
            expect(pkg7.isProjectDependency).toEqual(true);
            expect(pkg7.hasDependencies()).toEqual(false);
            expect(pkg7.hasDependants()).toEqual(false);
        });

        it("should get an array of packages, with n-level dependencies, a shared dependency, 'extraneous' and 'missing', tracked as 'development' dependencies", function () {
            var data = require("text!tests/data/package-factory/deep6.result.json"),
                rawData = JSON.parse(data).dependencies,
                mockBowerJson = {
                    getAllDependencies: function () {
                        return {
                            devDependencies: {
                                "angular-material": "*",
                                "angular": "*",
                                "jasmine": "*",
                                "lodash": "*"
                            }
                        };
                    }
                },
                result;

            spyOn(ProjectManager, "getBowerJson").andReturn(mockBowerJson);

            result = PackageFactory.createPackagesDeep(rawData);

            expect(Object.keys(result).length).toEqual(7);

            var pkg1 = result["angular-aria"],
                pkg2 = result.angular,
                pkg3 = result["angular-material"],
                pkg4 = result["angular-animate"],
                pkg5 = result.jquery,
                pkg6 = result.jasmine,
                pkg7 = result.lodash;

            expect(pkg1).toBeDefined();
            expect(pkg1.name).toEqual("angular-aria");
            expect(pkg1.isInstalled()).toEqual(true);
            expect(pkg1.isProjectDependency).toEqual(false);
            expect(pkg1.hasDependencies()).toEqual(true);
            expect(pkg1.hasDependants()).toEqual(true);
            expect(pkg1.hasDependency("angular")).toEqual(true);
            expect(pkg1.hasDependant("angular-material")).toEqual(true);

            expect(pkg2).toBeDefined();
            expect(pkg2.name).toEqual("angular");
            expect(pkg2.isInstalled()).toEqual(true);
            expect(pkg3.isProductionDependency()).toEqual(false);
            expect(pkg3.isDevDependency()).toEqual(true);
            expect(pkg2.isProjectDependency).toEqual(true);
            expect(pkg2.hasDependencies()).toEqual(false);
            expect(pkg2.hasDependants()).toEqual(true);
            expect(pkg2.hasDependant("angular-animate")).toEqual(true);
            expect(pkg2.hasDependant("angular-aria")).toEqual(true);
            expect(pkg2.hasDependant("angular-material")).toEqual(true);

            expect(pkg3).toBeDefined();
            expect(pkg3.name).toEqual("angular-material");
            expect(pkg3.isInstalled()).toEqual(true);
            expect(pkg3.isProductionDependency()).toEqual(false);
            expect(pkg3.isDevDependency()).toEqual(true);
            expect(pkg3.isProjectDependency).toEqual(true);
            expect(pkg3.hasDependencies()).toEqual(true);
            expect(pkg3.hasDependants()).toEqual(false);
            expect(pkg3.hasDependency("angular-animate")).toEqual(true);
            expect(pkg3.hasDependency("angular-aria")).toEqual(true);
            expect(pkg3.hasDependency("angular")).toEqual(true);

            expect(pkg4).toBeDefined();
            expect(pkg4.name).toEqual("angular-animate");
            expect(pkg4.isInstalled()).toEqual(true);
            expect(pkg4.isProjectDependency).toEqual(false);
            expect(pkg4.hasDependencies()).toEqual(true);
            expect(pkg4.hasDependants()).toEqual(true);
            expect(pkg4.hasDependency("angular")).toEqual(true);
            expect(pkg4.hasDependant("angular-material")).toEqual(true);

            expect(pkg5).toBeDefined();
            expect(pkg5.name).toEqual("jquery");
            expect(pkg5.isProductionDependency()).toEqual(true);
            expect(pkg5.isNotTracked()).toEqual(true); // and installed
            expect(pkg5.isDevDependency()).toEqual(false);
            expect(pkg5.isProjectDependency).toEqual(true);
            expect(pkg5.hasDependencies()).toEqual(false);
            expect(pkg5.hasDependants()).toEqual(false);

            expect(pkg6).toBeDefined();
            expect(pkg6.name).toEqual("jasmine");
            expect(pkg6.isInstalled()).toEqual(true);
            expect(pkg6.isProductionDependency()).toEqual(false);
            expect(pkg6.isDevDependency()).toEqual(true);
            expect(pkg6.isProjectDependency).toEqual(true);
            expect(pkg6.hasDependencies()).toEqual(false);
            expect(pkg6.hasDependants()).toEqual(false);

            expect(pkg7).toBeDefined();
            expect(pkg7.name).toEqual("lodash");
            expect(pkg7.isInstalled()).toEqual(false);
            expect(pkg7.isMissing()).toEqual(true);
            expect(pkg7.isProductionDependency()).toEqual(false);
            expect(pkg7.isDevDependency()).toEqual(true);
            expect(pkg7.isProjectDependency).toEqual(true);
            expect(pkg7.hasDependencies()).toEqual(false);
            expect(pkg7.hasDependants()).toEqual(false);
        });

        it("should get an array of packages, with n-level dependencies, a shared dependency, 'extraneous' and 'missing', tracked as 'production' and 'development' dependencies", function () {
            var data = require("text!tests/data/package-factory/deep6.result.json"),
                rawData = JSON.parse(data).dependencies,
                mockBowerJson = {
                    getAllDependencies: function () {
                        return {
                            dependencies: {
                                "angular-material": "*",
                                "angular": "*",
                                "lodash": "*"
                            },
                            devDependencies: {
                                "jasmine": "*"
                            }
                        };
                    }
                },
                result;

            spyOn(ProjectManager, "getBowerJson").andReturn(mockBowerJson);

            result = PackageFactory.createPackagesDeep(rawData);

            expect(Object.keys(result).length).toEqual(7);

            var pkg1 = result["angular-aria"],
                pkg2 = result.angular,
                pkg3 = result["angular-material"],
                pkg4 = result["angular-animate"],
                pkg5 = result.jquery,
                pkg6 = result.jasmine,
                pkg7 = result.lodash;

            expect(pkg1).toBeDefined();
            expect(pkg1.name).toEqual("angular-aria");
            expect(pkg1.isInstalled()).toEqual(true);
            expect(pkg1.isProjectDependency).toEqual(false);
            expect(pkg1.hasDependencies()).toEqual(true);
            expect(pkg1.hasDependants()).toEqual(true);
            expect(pkg1.hasDependency("angular")).toEqual(true);
            expect(pkg1.hasDependant("angular-material")).toEqual(true);

            expect(pkg2).toBeDefined();
            expect(pkg2.name).toEqual("angular");
            expect(pkg2.isInstalled()).toEqual(true);
            expect(pkg3.isProductionDependency()).toEqual(true);
            expect(pkg3.isDevDependency()).toEqual(false);
            expect(pkg2.isProjectDependency).toEqual(true);
            expect(pkg2.hasDependencies()).toEqual(false);
            expect(pkg2.hasDependants()).toEqual(true);
            expect(pkg2.hasDependant("angular-animate")).toEqual(true);
            expect(pkg2.hasDependant("angular-aria")).toEqual(true);
            expect(pkg2.hasDependant("angular-material")).toEqual(true);

            expect(pkg3).toBeDefined();
            expect(pkg3.name).toEqual("angular-material");
            expect(pkg3.isInstalled()).toEqual(true);
            expect(pkg3.isProductionDependency()).toEqual(true);
            expect(pkg3.isDevDependency()).toEqual(false);
            expect(pkg3.isProjectDependency).toEqual(true);
            expect(pkg3.hasDependencies()).toEqual(true);
            expect(pkg3.hasDependants()).toEqual(false);
            expect(pkg3.hasDependency("angular-animate")).toEqual(true);
            expect(pkg3.hasDependency("angular-aria")).toEqual(true);
            expect(pkg3.hasDependency("angular")).toEqual(true);

            expect(pkg4).toBeDefined();
            expect(pkg4.name).toEqual("angular-animate");
            expect(pkg4.isInstalled()).toEqual(true);
            expect(pkg4.isProjectDependency).toEqual(false);
            expect(pkg4.hasDependencies()).toEqual(true);
            expect(pkg4.hasDependants()).toEqual(true);
            expect(pkg4.hasDependency("angular")).toEqual(true);
            expect(pkg4.hasDependant("angular-material")).toEqual(true);

            expect(pkg5).toBeDefined();
            expect(pkg5.name).toEqual("jquery");
            expect(pkg5.isProductionDependency()).toEqual(true);
            expect(pkg5.isNotTracked()).toEqual(true); // and installed
            expect(pkg5.isDevDependency()).toEqual(false);
            expect(pkg5.isProjectDependency).toEqual(true);
            expect(pkg5.hasDependencies()).toEqual(false);
            expect(pkg5.hasDependants()).toEqual(false);

            expect(pkg6).toBeDefined();
            expect(pkg6.name).toEqual("jasmine");
            expect(pkg6.isInstalled()).toEqual(true);
            expect(pkg6.isProductionDependency()).toEqual(false);
            expect(pkg6.isDevDependency()).toEqual(true);
            expect(pkg6.isProjectDependency).toEqual(true);
            expect(pkg6.hasDependencies()).toEqual(false);
            expect(pkg6.hasDependants()).toEqual(false);

            expect(pkg7).toBeDefined();
            expect(pkg7.name).toEqual("lodash");
            expect(pkg7.isInstalled()).toEqual(false);
            expect(pkg7.isMissing()).toEqual(true);
            expect(pkg7.isProductionDependency()).toEqual(true);
            expect(pkg7.isDevDependency()).toEqual(false);
            expect(pkg7.isProjectDependency).toEqual(true);
            expect(pkg7.hasDependencies()).toEqual(false);
            expect(pkg7.hasDependants()).toEqual(false);
        });

        // package info

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
