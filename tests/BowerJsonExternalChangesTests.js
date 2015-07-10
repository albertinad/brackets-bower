/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, describe, it, expect, afterEach, beforeEach, beforeFirst, afterLast, waitsForDone, waitsFor,
runs, spyOn, $, brackets */

define(function (require, exports, module) {
    "use strict";

    var SpecRunnerUtils = brackets.getModule("spec/SpecRunnerUtils"),
        extensionName = "brackets-bower";

    describe("BracketsBower - BowerJson External Changes", function () {
        var tempDir = SpecRunnerUtils.getTempDirectory(),
            projectsPath = "extensions/dev/brackets-bower/tests/data/projects",
            testProjectPath = SpecRunnerUtils.getBracketsSourceRoot() + "/" + projectsPath + "/" + "project02",
            tempDirProjectPath = tempDir + "/project02",
            DEFAULT_TIMEOUT = 30000,
            BowerProjectManager,
            PackageFactory,
            FileUtils,
            PackageManager,
            testWindow,
            extensionRequire,
            getBowerJsonSpy;

        var defaultBowerJsonContent = {
            "name": "project02",
            "dependencies": {
                "angular-material": "~0.10.0"
            },
            "devDependencies": {
                "sinon": "~1.15.4"
            }
        };

        beforeFirst(function () {
            runs(function () {
                SpecRunnerUtils.createTempDirectory();
            });

            runs(function () {
                var folderPromise = new $.Deferred();

                SpecRunnerUtils.createTestWindowAndRun(this, function (w) {
                    testWindow = w;

                    var ExtensionLoader = testWindow.brackets.test.ExtensionLoader;
                    extensionRequire = ExtensionLoader.getRequireContextForExtension(extensionName);

                    BowerProjectManager = extensionRequire("src/project/ProjectManager");
                    PackageFactory = extensionRequire("src/project/PackageFactory");
                    FileUtils = extensionRequire("src/utils/FileUtils");
                    PackageManager = extensionRequire("src/bower/PackageManager");

                    folderPromise.resolve();
                });

                waitsForDone(folderPromise, "waiting for test project to be opened", DEFAULT_TIMEOUT);
            });

            runs(function () {
                var copyPromise = SpecRunnerUtils.copy(testProjectPath, tempDirProjectPath);

                waitsForDone(copyPromise, "waiting for project copy to temp dir", DEFAULT_TIMEOUT);
            });

            runs(function () {
                SpecRunnerUtils.loadProjectInTestWindow(tempDirProjectPath);
            });

            runs(function () {
                var deferred = new $.Deferred(),
                    promise = deferred.promise();

                // ignore packages with latest versions
                spyOn(PackageManager, "packagesWithVersions").andReturn((new testWindow.$.Deferred()).reject());

                function onProjectReady() {
                    deferred.resolve();

                    BowerProjectManager.off(BowerProjectManager.Events.PROJECT_READY, onProjectReady);
                }

                BowerProjectManager.on(BowerProjectManager.Events.PROJECT_READY, onProjectReady);

                waitsForDone(promise, "waiting for project bower ready", DEFAULT_TIMEOUT);
            });

            runs(function () {
                var bowerProject = BowerProjectManager.getProject(),
                    projectPackages = bowerProject.getPackagesArray(),
                    dependenciesPackages = bowerProject.getPackagesDependenciesArray(),
                    packages = bowerProject.getPackages(),
                    status = bowerProject.getStatus();

                expect(status.isSynced()).toEqual(true);
                expect(bowerProject.name).toEqual("project02");
                expect(projectPackages.length).toEqual(2);
                expect(dependenciesPackages.length).toEqual(3);
                expect(packages.sinon).toBeDefined();
                expect(packages.angular).toBeDefined();
                expect(packages["angular-material"]).toBeDefined();
                expect(packages["angular-aria"]).toBeDefined();
                expect(packages["angular-animate"]).toBeDefined();
            });
        });

        beforeEach(function () {
            getBowerJsonSpy = spyOn(BowerProjectManager, "getBowerJson");
            getBowerJsonSpy.andCallThrough();
        });

        afterEach(function () {
            var project = BowerProjectManager.getProject();

            getBowerJsonSpy.andCallThrough();

            // restore bower.json

            runs(function () {
                var bowerJson = project.activeBowerJson,
                    promise = bowerJson.saveContent(JSON.stringify(defaultBowerJsonContent, null, 4));

                waitsForDone(promise, "updating bower.json content", DEFAULT_TIMEOUT);
            });
        });

        afterLast(function () {
            runs(function () {
                SpecRunnerUtils.closeTestWindow();
            });

            runs(function () {
                SpecRunnerUtils.removeTempDirectory();
            });
        });

        it("Adding a new package to 'dependencies' section in bower.json should make the BowerJson content change, Project packages to be updated and status 'out of sync'", function () {
            var content = {
                "name": "project02",
                "dependencies": {
                    "angular-material": "~0.10.0",
                    "chai": "*"
                },
                "devDependencies": {
                    "sinon": "~1.15.4"
                }
            };

            var data = require("text!tests/data/external-changes/list1.result.json"),
                rawData = JSON.parse(data).dependencies,
                project = BowerProjectManager.getProject(),
                bowerJson = project.activeBowerJson;

            getBowerJsonSpy.andReturn({
                getAllDependencies: function () {
                    return content;
                }
            });

            var resultPkgs = PackageFactory.createPackagesDeepArray(rawData),
                listProjectDepsReturn = (new $.Deferred()).resolve(resultPkgs);

            getBowerJsonSpy.andCallThrough();

            spyOn(bowerJson, "_notifyBowerJsonChanged").andCallThrough();
            spyOn(project, "bowerJsonChanged").andCallThrough();
            spyOn(BowerProjectManager, "listProjectDependencies").andReturn(listProjectDepsReturn);

            runs(function () {
                var promise = bowerJson.saveContent(JSON.stringify(content, null, 4));

                waitsForDone(promise, "updating bower.json content", DEFAULT_TIMEOUT);
            });

            runs(function () {
                waitsFor(function () {
                    return (project.getPackagesArray().length === 3);
                }, "project dependencies updated", DEFAULT_TIMEOUT);
            });

            runs(function () {
                var projectPackages = project.getPackagesArray(),
                    dependenciesPackages = project.getPackagesDependenciesArray(),
                    packages = project.getPackages(),
                    bowerJsonDeps = bowerJson.getAllDependencies(),
                    status = project.getStatus(),
                    newPkg;

                expect(bowerJson._notifyBowerJsonChanged).toHaveBeenCalled();
                expect(project.bowerJsonChanged).toHaveBeenCalled();

                expect(status.isOutOfSync()).toEqual(true);
                expect(bowerJsonDeps.dependencies).toBeDefined();
                expect(bowerJsonDeps.devDependencies).toBeDefined();
                expect(Object.keys(bowerJsonDeps.dependencies).length).toEqual(2);
                expect(Object.keys(bowerJsonDeps.devDependencies).length).toEqual(1);
                expect(bowerJsonDeps.dependencies["angular-material"]).toBeDefined();
                expect(bowerJsonDeps.dependencies.chai).toBeDefined();
                expect(bowerJsonDeps.devDependencies.sinon).toBeDefined();

                expect(project.name).toEqual("project02");
                expect(projectPackages.length).toEqual(3);
                expect(dependenciesPackages.length).toEqual(3);
                expect(packages.sinon).toBeDefined();
                expect(packages.angular).toBeDefined();
                expect(packages.chai).toBeDefined();
                expect(packages["angular-material"]).toBeDefined();
                expect(packages["angular-aria"]).toBeDefined();
                expect(packages["angular-animate"]).toBeDefined();

                newPkg = packages.chai;

                expect(newPkg.isProjectDependency).toEqual(true);
                expect(newPkg.isProductionDependency()).toEqual(true);
                expect(newPkg.isMissing()).toEqual(true);
            });
        });

        it("Adding a new package to 'devDependencies' section in bower.json should make the BowerJson content change, Project packages to be updated and status 'out of sync'", function () {
            var content = {
                "name": "project02",
                "dependencies": {
                    "angular-material": "~0.10.0"
                },
                "devDependencies": {
                    "sinon": "~1.15.4",
                    "chai": "*"
                }
            };

            var data = require("text!tests/data/external-changes/list2.result.json"),
                rawData = JSON.parse(data).dependencies,
                project = BowerProjectManager.getProject(),
                bowerJson = project.activeBowerJson;

            getBowerJsonSpy.andReturn({
                getAllDependencies: function () {
                    return content;
                }
            });

            var resultPkgs = PackageFactory.createPackagesDeepArray(rawData),
                listProjectDepsReturn = (new $.Deferred()).resolve(resultPkgs);

            getBowerJsonSpy.andCallThrough();

            spyOn(bowerJson, "_notifyBowerJsonChanged").andCallThrough();
            spyOn(project, "bowerJsonChanged").andCallThrough();
            spyOn(BowerProjectManager, "listProjectDependencies").andReturn(listProjectDepsReturn);

            runs(function () {
                var promise = bowerJson.saveContent(JSON.stringify(content, null, 4));

                waitsForDone(promise, "updating bower.json content", DEFAULT_TIMEOUT);
            });

            runs(function () {
                waitsFor(function () {
                    return (project.getPackagesArray().length === 3);
                }, "project dependencies updated", DEFAULT_TIMEOUT);
            });

            runs(function () {
                var bowerProject = BowerProjectManager.getProject(),
                    projectPackages = bowerProject.getPackagesArray(),
                    dependenciesPackages = bowerProject.getPackagesDependenciesArray(),
                    packages = bowerProject.getPackages(),
                    bowerJsonDeps = bowerJson.getAllDependencies(),
                    status = project.getStatus(),
                    newPkg;

                expect(bowerJson._notifyBowerJsonChanged).toHaveBeenCalled();
                expect(project.bowerJsonChanged).toHaveBeenCalled();

                expect(bowerJsonDeps.dependencies).toBeDefined();
                expect(bowerJsonDeps.devDependencies).toBeDefined();
                expect(Object.keys(bowerJsonDeps.dependencies).length).toEqual(1);
                expect(Object.keys(bowerJsonDeps.devDependencies).length).toEqual(2);
                expect(bowerJsonDeps.dependencies["angular-material"]).toBeDefined();
                expect(bowerJsonDeps.devDependencies.chai).toBeDefined();
                expect(bowerJsonDeps.devDependencies.sinon).toBeDefined();

                expect(status.isOutOfSync()).toEqual(true);
                expect(bowerProject.name).toEqual("project02");
                expect(projectPackages.length).toEqual(3);
                expect(dependenciesPackages.length).toEqual(3);
                expect(packages.sinon).toBeDefined();
                expect(packages.angular).toBeDefined();
                expect(packages.chai).toBeDefined();
                expect(packages["angular-material"]).toBeDefined();
                expect(packages["angular-aria"]).toBeDefined();
                expect(packages["angular-animate"]).toBeDefined();

                newPkg = packages.chai;

                expect(newPkg.isProjectDependency).toEqual(true);
                expect(newPkg.isDevDependency()).toEqual(true);
                expect(newPkg.isMissing()).toEqual(true);
            });
        });

        it("Adding an already installed package to 'dependencies' section in bower.json should make the BowerJson content change, Project packages to be updated and status 'synced'", function () {
            var content = {
                "name": "project02",
                "dependencies": {
                    "angular-material": "~0.10.0",
                    "angular": "*"
                },
                "devDependencies": {
                    "sinon": "~1.15.4"
                }
            };

            var data = require("text!tests/data/external-changes/list3.result.json"),
                rawData = JSON.parse(data).dependencies,
                project = BowerProjectManager.getProject(),
                bowerJson = project.activeBowerJson;

            getBowerJsonSpy.andReturn({
                getAllDependencies: function () {
                    return content;
                }
            });

            var resultPkgs = PackageFactory.createPackagesDeepArray(rawData),
                listProjectDepsReturn = (new $.Deferred()).resolve(resultPkgs);

            getBowerJsonSpy.andCallThrough();

            spyOn(bowerJson, "_notifyBowerJsonChanged").andCallThrough();
            spyOn(project, "bowerJsonChanged").andCallThrough();
            spyOn(BowerProjectManager, "listProjectDependencies").andReturn(listProjectDepsReturn);

            runs(function () {
                var promise = bowerJson.saveContent(JSON.stringify(content, null, 4));

                waitsForDone(promise, "updating bower.json content", DEFAULT_TIMEOUT);
            });

            runs(function () {
                waitsFor(function () {
                    return (project.getPackagesArray().length === 3);
                }, "project dependencies updated", DEFAULT_TIMEOUT);
            });

            runs(function () {
                var projectPackages = project.getPackagesArray(),
                    dependenciesPackages = project.getPackagesDependenciesArray(),
                    packages = project.getPackages(),
                    bowerJsonDeps = bowerJson.getAllDependencies(),
                    status = project.getStatus(),
                    newPkg;

                expect(bowerJson._notifyBowerJsonChanged).toHaveBeenCalled();
                expect(project.bowerJsonChanged).toHaveBeenCalled();

                expect(status.isSynced()).toEqual(true);
                expect(bowerJsonDeps.dependencies).toBeDefined();
                expect(bowerJsonDeps.devDependencies).toBeDefined();
                expect(Object.keys(bowerJsonDeps.dependencies).length).toEqual(2);
                expect(Object.keys(bowerJsonDeps.devDependencies).length).toEqual(1);
                expect(bowerJsonDeps.dependencies["angular-material"]).toBeDefined();
                expect(bowerJsonDeps.dependencies.angular).toBeDefined();
                expect(bowerJsonDeps.devDependencies.sinon).toBeDefined();

                expect(project.name).toEqual("project02");
                expect(projectPackages.length).toEqual(3);
                expect(dependenciesPackages.length).toEqual(2);
                expect(packages.sinon).toBeDefined();
                expect(packages.angular).toBeDefined();
                expect(packages["angular-material"]).toBeDefined();
                expect(packages["angular-aria"]).toBeDefined();
                expect(packages["angular-animate"]).toBeDefined();

                newPkg = packages.angular;

                expect(newPkg.isProjectDependency).toEqual(true);
                expect(newPkg.isProductionDependency()).toEqual(true);
                expect(newPkg.isInstalled()).toEqual(true);
            });
        });

        it("Adding an already installed package to 'devDependencies' section in bower.json should make the BowerJson content change, Project packages to be updated and status 'synced'", function () {
            var content = {
                "name": "project02",
                "dependencies": {
                    "angular-material": "~0.10.0"
                },
                "devDependencies": {
                    "sinon": "~1.15.4",
                    "angular": "*"
                }
            };

            var data = require("text!tests/data/external-changes/list4.result.json"),
                rawData = JSON.parse(data).dependencies,
                project = BowerProjectManager.getProject(),
                bowerJson = project.activeBowerJson;

            getBowerJsonSpy.andReturn({
                getAllDependencies: function () {
                    return content;
                }
            });

            var resultPkgs = PackageFactory.createPackagesDeepArray(rawData),
                listProjectDepsReturn = (new $.Deferred()).resolve(resultPkgs);

            getBowerJsonSpy.andCallThrough();

            spyOn(bowerJson, "_notifyBowerJsonChanged").andCallThrough();
            spyOn(project, "bowerJsonChanged").andCallThrough();
            spyOn(BowerProjectManager, "listProjectDependencies").andReturn(listProjectDepsReturn);

            runs(function () {
                var promise = bowerJson.saveContent(JSON.stringify(content, null, 4));

                waitsForDone(promise, "updating bower.json content", DEFAULT_TIMEOUT);
            });

            runs(function () {
                waitsFor(function () {
                    return (project.getPackagesArray().length === 3);
                }, "project dependencies updated", DEFAULT_TIMEOUT);
            });

            runs(function () {
                var projectPackages = project.getPackagesArray(),
                    dependenciesPackages = project.getPackagesDependenciesArray(),
                    packages = project.getPackages(),
                    bowerJsonDeps = bowerJson.getAllDependencies(),
                    status = project.getStatus(),
                    newPkg;

                expect(bowerJson._notifyBowerJsonChanged).toHaveBeenCalled();
                expect(project.bowerJsonChanged).toHaveBeenCalled();

                expect(status.isSynced()).toEqual(true);
                expect(bowerJsonDeps.dependencies).toBeDefined();
                expect(bowerJsonDeps.devDependencies).toBeDefined();
                expect(Object.keys(bowerJsonDeps.dependencies).length).toEqual(1);
                expect(Object.keys(bowerJsonDeps.devDependencies).length).toEqual(2);
                expect(bowerJsonDeps.dependencies["angular-material"]).toBeDefined();
                expect(bowerJsonDeps.devDependencies.angular).toBeDefined();
                expect(bowerJsonDeps.devDependencies.sinon).toBeDefined();

                expect(project.name).toEqual("project02");
                expect(projectPackages.length).toEqual(3);
                expect(dependenciesPackages.length).toEqual(2);
                expect(packages.sinon).toBeDefined();
                expect(packages.angular).toBeDefined();
                expect(packages["angular-material"]).toBeDefined();
                expect(packages["angular-aria"]).toBeDefined();
                expect(packages["angular-animate"]).toBeDefined();

                newPkg = packages.angular;

                expect(newPkg.isProjectDependency).toEqual(true);
                expect(newPkg.isDevDependency()).toEqual(true);
                expect(newPkg.isInstalled()).toEqual(true);
            });
        });

        it("Removing a package from bower.json should make the BowerJson content change, Project packages to be updated and status 'out of sync'", function () {
            var content = {
                "name": "project02",
                "dependencies": {
                    "angular-material": "~0.10.0"
                }
            };

            var data = require("text!tests/data/external-changes/list5.result.json"),
                rawData = JSON.parse(data).dependencies,
                project = BowerProjectManager.getProject(),
                bowerJson = project.activeBowerJson;

            getBowerJsonSpy.andReturn({
                getAllDependencies: function () {
                    return content;
                }
            });

            var resultPkgs = PackageFactory.createPackagesDeepArray(rawData),
                listProjectDepsReturn = (new $.Deferred()).resolve(resultPkgs);

            getBowerJsonSpy.andCallThrough();

            spyOn(bowerJson, "_notifyBowerJsonChanged").andCallThrough();
            spyOn(project, "bowerJsonChanged").andCallThrough();
            spyOn(BowerProjectManager, "listProjectDependencies").andReturn(listProjectDepsReturn);

            runs(function () {
                var promise = bowerJson.saveContent(JSON.stringify(content, null, 4));

                waitsForDone(promise, "updating bower.json content", DEFAULT_TIMEOUT);
            });

            runs(function () {
                waitsFor(function () {
                    return (project.getPackagesArray().length === 2);
                }, "project dependencies updated", DEFAULT_TIMEOUT);
            });

            runs(function () {
                var projectPackages = project.getPackagesArray(),
                    dependenciesPackages = project.getPackagesDependenciesArray(),
                    packages = project.getPackages(),
                    bowerJsonDeps = bowerJson.getAllDependencies(),
                    status = project.getStatus(),
                    newPkg;

                expect(bowerJson._notifyBowerJsonChanged).toHaveBeenCalled();
                expect(project.bowerJsonChanged).toHaveBeenCalled();

                expect(status.isOutOfSync()).toEqual(true);
                expect(bowerJsonDeps.dependencies).toBeDefined();
                expect(bowerJsonDeps.devDependencies).toBeDefined();
                expect(Object.keys(bowerJsonDeps.dependencies).length).toEqual(1);
                expect(bowerJsonDeps.dependencies["angular-material"]).toBeDefined();

                expect(project.name).toEqual("project02");
                expect(projectPackages.length).toEqual(2);
                expect(dependenciesPackages.length).toEqual(3);
                expect(packages.sinon).toBeDefined();
                expect(packages.angular).toBeDefined();
                expect(packages["angular-material"]).toBeDefined();
                expect(packages["angular-aria"]).toBeDefined();
                expect(packages["angular-animate"]).toBeDefined();

                newPkg = packages.sinon;

                expect(newPkg.isProjectDependency).toEqual(true);
                expect(newPkg.isNotTracked()).toEqual(true);
            });
        });
    });
});
