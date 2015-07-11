/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, describe, it, beforeFirst, beforeEach, afterEach, afterLast, waitsForDone,
runs, $, brackets, waitsForDone, waitsFor, spyOn, expect, xit */

define(function (require, exports, module) {
    "use strict";

    var SpecRunnerUtils = brackets.getModule("spec/SpecRunnerUtils"),
        extensionName = "brackets-bower";

    describe("BracketsBower - BowerJson Internal Changes", function () {
        var tempDir = SpecRunnerUtils.getTempDirectory(),
            projectsPath = "extensions/dev/brackets-bower/tests/data/projects",
            testProjectPath = SpecRunnerUtils.getBracketsSourceRoot() + "/" + projectsPath + "/" + "project01",
            tempDirProjectPath = tempDir + "/project01",
            DEFAULT_TIMEOUT = 5000,
            PackageManager,
            PackageUtils,
            PackageFactory,
            BowerProjectManager,
            Bower,
            FileUtils,
            FileSystemHandler,
            Events,
            testWindow,
            extensionRequire,
            getBowerJsonSpy;

        var defaultBowerJsonContent = {
            "name": "project01",
            "dependencies": {
                "angular": "~1.4.2"
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
                    var ExtensionLoader;

                    testWindow = w;
                    ExtensionLoader = testWindow.brackets.test.ExtensionLoader;

                    extensionRequire = ExtensionLoader.getRequireContextForExtension(extensionName);

                    PackageManager = extensionRequire("src/bower/PackageManager");
                    PackageUtils = extensionRequire("src/bower/PackageUtils");
                    PackageFactory = extensionRequire("src/project/PackageFactory");
                    FileUtils = extensionRequire("src/utils/FileUtils");
                    BowerProjectManager = extensionRequire("src/project/ProjectManager");
                    Bower = extensionRequire("src/bower/Bower");
                    FileSystemHandler = extensionRequire("src/project/FileSystemHandler");
                    Events = FileSystemHandler.Events;

                    folderPromise.resolve();
                });

                waitsForDone(folderPromise, "waiting for test window ready", DEFAULT_TIMEOUT);
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
                expect(bowerProject.name).toEqual("project01");
                expect(projectPackages.length).toEqual(2);
                expect(dependenciesPackages.length).toEqual(0);
                expect(packages.angular).toBeDefined();
                expect(packages.sinon).toBeDefined();
            });
        });

        beforeEach(function () {
            getBowerJsonSpy = spyOn(BowerProjectManager, "getBowerJson");

            getBowerJsonSpy.andCallThrough();
        });

        afterEach(function () {
            var project = BowerProjectManager.getProject(),
                notifyDependenciesAddedSpy = spyOn(BowerProjectManager, "notifyDependenciesAdded");

            notifyDependenciesAddedSpy.andCallThrough();
            getBowerJsonSpy.andCallThrough();

            // restore bower.json

            runs(function () {
                var bowerJson = project.activeBowerJson;

                bowerJson.saveContent(JSON.stringify(defaultBowerJsonContent, null, 4));

                waitsFor(function () {
                    return (notifyDependenciesAddedSpy.calls.length === 1);
                }, "project packages to be updated after bower.json changed", 20000);
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

        it("install a single package with '--save' option should cause BowerJson to be udpated without refreshing the Project packages model", function () {
            var data = require("text!tests/data/internal-changes/install1.result.json"),
                rawData = JSON.parse(data),
                project = BowerProjectManager.getProject(),
                bowerJson = project.activeBowerJson;

            getBowerJsonSpy.andCallThrough();

            spyOn(bowerJson, "_notifyBowerJsonChanged").andCallThrough();
            spyOn(project, "bowerJsonChanged").andCallThrough();
            spyOn(project, "setPackages").andCallThrough();
            spyOn(PackageManager, "isModificationInProgress").andCallThrough();

            spyOn(Bower, "info").andReturn((new $.Deferred()).reject());
            spyOn(Bower, "installPackage").andCallFake(function () {
                var deferred = new testWindow.$.Deferred(),
                    Events = FileSystemHandler.Events,
                    result = {
                        packages: rawData,
                        count: 1
                    },
                    newContent = {
                        "name": "project01",
                        "dependencies": {
                            "angular": "~1.4.2",
                            "jquery": "~2.1.4"
                        },
                        "devDependencies": {
                            "sinon": "~1.15.4"
                        }
                    };

                function onBowerJsonChanged() {
                    FileSystemHandler.off(Events.BOWER_JSON_CHANGED, onBowerJsonChanged);

                    deferred.resolve(result);
                }

                FileSystemHandler.on(Events.BOWER_JSON_CHANGED, onBowerJsonChanged);

                bowerJson.saveContent(JSON.stringify(newContent, null, 4)).fail(function (error) {
                    FileSystemHandler.off(Events.BOWER_JSON_CHANGED, onBowerJsonChanged);

                    deferred.reject(error);
                });

                return deferred.promise();
            });

            runs(function () {
                var options = {
                    version: "2.1.4",
                    versionType: PackageUtils.VersionOptions.TILDE,
                    type: PackageUtils.DependencyType.PRODUCTION,
                    save: true
                };

                var promise = PackageManager.install("jquery", options);

                waitsForDone(promise, "Installing 'jquery#~2.1.4' as production package", DEFAULT_TIMEOUT);
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
                expect(PackageManager.isModificationInProgress.calls.length).toEqual(1);
                expect(project.setPackages.calls.length).toEqual(0);

                expect(status.isSynced()).toEqual(true);
                expect(bowerJsonDeps.dependencies).toBeDefined();
                expect(bowerJsonDeps.devDependencies).toBeDefined();
                expect(Object.keys(bowerJsonDeps.dependencies).length).toEqual(2);
                expect(Object.keys(bowerJsonDeps.devDependencies).length).toEqual(1);
                expect(bowerJsonDeps.dependencies.angular).toBeDefined();
                expect(bowerJsonDeps.devDependencies.sinon).toBeDefined();
                expect(bowerJsonDeps.dependencies.jquery).toBeDefined();

                expect(project.name).toEqual("project01");
                expect(projectPackages.length).toEqual(3);
                expect(dependenciesPackages.length).toEqual(0);
                expect(packages.angular).toBeDefined();
                expect(packages.sinon).toBeDefined();
                expect(packages.jquery).toBeDefined();

                newPkg = packages.jquery;

                expect(newPkg.isProjectDependency).toEqual(true);
                expect(newPkg.isProductionDependency()).toEqual(true);
                expect(newPkg.isInstalled()).toEqual(true);
                expect(newPkg.isNotTracked()).toEqual(false);
                expect(newPkg.isMissing()).toEqual(false);
            });
        });

        it("install a single package with '--saveDev' option should cause BowerJson to be udpated without refreshing the Project packages model", function () {
            var data = require("text!tests/data/internal-changes/install1.result.json"),
                rawData = JSON.parse(data),
                project = BowerProjectManager.getProject(),
                bowerJson = project.activeBowerJson;

            getBowerJsonSpy.andCallThrough();

            spyOn(bowerJson, "_notifyBowerJsonChanged").andCallThrough();
            spyOn(project, "bowerJsonChanged").andCallThrough();
            spyOn(project, "setPackages").andCallThrough();
            spyOn(PackageManager, "isModificationInProgress").andCallThrough();

            spyOn(Bower, "info").andReturn((new $.Deferred()).reject());
            spyOn(Bower, "installPackage").andCallFake(function () {
                var deferred = new testWindow.$.Deferred(),
                    Events = FileSystemHandler.Events,
                    result = {
                        packages: rawData,
                        count: 1
                    },
                    newContent = {
                        "name": "project01",
                        "dependencies": {
                            "angular": "~1.4.2"
                        },
                        "devDependencies": {
                            "sinon": "~1.15.4",
                            "jquery": "~2.1.4"
                        }
                    };

                function onBowerJsonChanged() {
                    FileSystemHandler.off(Events.BOWER_JSON_CHANGED, onBowerJsonChanged);

                    deferred.resolve(result);
                }

                FileSystemHandler.on(Events.BOWER_JSON_CHANGED, onBowerJsonChanged);

                bowerJson.saveContent(JSON.stringify(newContent, null, 4)).fail(function (error) {
                    FileSystemHandler.off(Events.BOWER_JSON_CHANGED, onBowerJsonChanged);

                    deferred.reject(error);
                });

                return deferred.promise();
            });

            runs(function () {
                var options = {
                    version: "2.1.4",
                    versionType: PackageUtils.VersionOptions.TILDE,
                    type: PackageUtils.DependencyType.DEVELOPMENT,
                    save: true
                };

                var promise = PackageManager.install("jquery", options);

                waitsForDone(promise, "Installing 'jquery#~2.1.4' as development package", DEFAULT_TIMEOUT);
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
                expect(PackageManager.isModificationInProgress.calls.length).toEqual(1);
                expect(project.setPackages.calls.length).toEqual(0);

                expect(status.isSynced()).toEqual(true);
                expect(bowerJsonDeps.dependencies).toBeDefined();
                expect(bowerJsonDeps.devDependencies).toBeDefined();
                expect(Object.keys(bowerJsonDeps.dependencies).length).toEqual(1);
                expect(Object.keys(bowerJsonDeps.devDependencies).length).toEqual(2);
                expect(bowerJsonDeps.dependencies.angular).toBeDefined();
                expect(bowerJsonDeps.devDependencies.sinon).toBeDefined();
                expect(bowerJsonDeps.devDependencies.jquery).toBeDefined();

                expect(project.name).toEqual("project01");
                expect(projectPackages.length).toEqual(3);
                expect(dependenciesPackages.length).toEqual(0);
                expect(packages.angular).toBeDefined();
                expect(packages.sinon).toBeDefined();
                expect(packages.jquery).toBeDefined();

                newPkg = packages.jquery;

                expect(newPkg.isProjectDependency).toEqual(true);
                expect(newPkg.isDevDependency()).toEqual(true);
                expect(newPkg.isInstalled()).toEqual(true);
                expect(newPkg.isNotTracked()).toEqual(false);
                expect(newPkg.isMissing()).toEqual(false);
            });
        });

        it("uninstall a tracked package should cause BowerJson to be udpated without refreshing the Project packages model", function () {
            var project = BowerProjectManager.getProject(),
                bowerJson = project.activeBowerJson;

            getBowerJsonSpy.andCallThrough();

            spyOn(bowerJson, "_notifyBowerJsonChanged").andCallThrough();
            spyOn(project, "bowerJsonChanged").andCallThrough();
            spyOn(project, "setPackages").andCallThrough();
            spyOn(PackageManager, "isModificationInProgress").andCallThrough();

            spyOn(Bower, "uninstall").andCallFake(function () {
                var deferred = new testWindow.$.Deferred(),
                    Events = FileSystemHandler.Events,
                    result = {
                        "sinon": "/tests/project01/bower_components/sinon"
                    },
                    newContent = {
                        "name": "project01",
                        "dependencies": {
                            "angular": "~1.4.2"
                        }
                    };

                function onBowerJsonChanged() {
                    FileSystemHandler.off(Events.BOWER_JSON_CHANGED, onBowerJsonChanged);

                    deferred.resolve(result);
                }

                FileSystemHandler.on(Events.BOWER_JSON_CHANGED, onBowerJsonChanged);

                bowerJson.saveContent(JSON.stringify(newContent, null, 4)).fail(function (error) {
                    FileSystemHandler.off(Events.BOWER_JSON_CHANGED, onBowerJsonChanged);

                    deferred.reject(error);
                });

                return deferred.promise();
            });

            runs(function () {
                var promise = PackageManager.uninstall("sinon", false);

                waitsForDone(promise, "Uninstalling 'sinon'", DEFAULT_TIMEOUT);
            });

            runs(function () {
                var projectPackages = project.getPackagesArray(),
                    dependenciesPackages = project.getPackagesDependenciesArray(),
                    packages = project.getPackages(),
                    bowerJsonDeps = bowerJson.getAllDependencies(),
                    status = project.getStatus();

                expect(bowerJson._notifyBowerJsonChanged).toHaveBeenCalled();
                expect(project.bowerJsonChanged).toHaveBeenCalled();
                expect(PackageManager.isModificationInProgress.calls.length).toEqual(1);
                expect(project.setPackages.calls.length).toEqual(0);

                expect(status.isSynced()).toEqual(true);
                expect(bowerJsonDeps.dependencies).toBeDefined();
                expect(bowerJsonDeps.devDependencies).toBeDefined();
                expect(Object.keys(bowerJsonDeps.dependencies).length).toEqual(1);
                expect(Object.keys(bowerJsonDeps.devDependencies).length).toEqual(0);
                expect(bowerJsonDeps.dependencies.angular).toBeDefined();

                expect(project.name).toEqual("project01");
                expect(projectPackages.length).toEqual(1);
                expect(dependenciesPackages.length).toEqual(0);
                expect(packages.angular).toBeDefined();
            });
        });

        xit("updated a tracked package should cause BowerJson to be udpated without refreshing the Project packages model", function () {

        });
    });
});
