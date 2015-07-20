/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, describe, it, beforeFirst, afterEach, afterLast, waitsForDone,
runs, $, brackets, waitsForDone, waitsFor, spyOn, expect */

define(function (require, exports, module) {
    "use strict";

    var SpecRunnerUtils = brackets.getModule("spec/SpecRunnerUtils"),
        extensionName = "brackets-bower";

    describe("BracketsBower - BowerJson Internal Changes", function () {
        var projectName = "project01",
            projectsPath = "extensions/dev/brackets-bower/tests/data/projects",
            testProjectPath = SpecRunnerUtils.getBracketsSourceRoot() + "/" + projectsPath + "/" + projectName,
            tempDirProjectPath = SpecRunnerUtils.getTempDirectory() + "/" + projectName,
            DEFAULT_TIMEOUT = 5000,
            PackageManager,
            VersionOptions,
            DependencyType,
            PackageFactory,
            BowerProjectManager,
            Bower,
            FileUtils,
            FileSystemHandler,
            Events,
            testWindow,
            getBowerJsonSpy,
            setPackagesSpy,
            project;

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
                var deferred = new $.Deferred();

                SpecRunnerUtils.createTestWindowAndRun(this, function (w) {
                    testWindow = w;

                    var ExtensionLoader = testWindow.brackets.test.ExtensionLoader,
                        extensionRequire = ExtensionLoader.getRequireContextForExtension(extensionName);

                    PackageManager      = extensionRequire("src/bower/PackageManager");
                    PackageFactory      = extensionRequire("src/project/PackageFactory");
                    FileUtils           = extensionRequire("src/utils/FileUtils");
                    BowerProjectManager = extensionRequire("src/project/ProjectManager");
                    Bower               = extensionRequire("src/bower/Bower");
                    FileSystemHandler   = extensionRequire("src/project/FileSystemHandler");
                    Events              = FileSystemHandler.Events;
                    DependencyType      = PackageManager.DependencyType;
                    VersionOptions      = PackageManager.VersionOptions;

                    deferred.resolve();
                });

                waitsForDone(deferred, "waiting for test window to be ready", DEFAULT_TIMEOUT);
            });

            runs(function () {
                var copyPromise = SpecRunnerUtils.copy(testProjectPath, tempDirProjectPath);

                waitsForDone(copyPromise, "waiting for copying project to temp dir", DEFAULT_TIMEOUT);
            });

            runs(function () {
                SpecRunnerUtils.loadProjectInTestWindow(tempDirProjectPath);
            });

            runs(function () {
                var deferred = new $.Deferred(),
                    promise = deferred.promise();

                // ignore packages with latest versions
                spyOn(PackageManager, "listWithVersions").andReturn((new testWindow.$.Deferred()).reject());

                function onProjectReady() {
                    project = BowerProjectManager.getProject();

                    deferred.resolve();

                    BowerProjectManager.off(BowerProjectManager.Events.PROJECT_READY, onProjectReady);
                }

                BowerProjectManager.on(BowerProjectManager.Events.PROJECT_READY, onProjectReady);

                waitsForDone(promise, "waiting for project bower ready", DEFAULT_TIMEOUT);
            });

            runs(function () {
                getBowerJsonSpy = spyOn(BowerProjectManager, "getBowerJson");
                setPackagesSpy = spyOn(project, "setPackages");
                getBowerJsonSpy.andCallThrough();
                setPackagesSpy.andCallThrough();
            });

            runs(function () {
                var projectPackages = project.getProjectPackages(),
                    dependenciesPackages = project.getPackagesDependenciesArray(),
                    packages = project.getPackages(),
                    status = project.getStatus();

                expect(status.isSynced()).toEqual(true);
                expect(project.name).toEqual(projectName);
                expect(projectPackages.length).toEqual(2);
                expect(dependenciesPackages.length).toEqual(0);
                expect(packages.angular).toBeDefined();
                expect(packages.sinon).toBeDefined();
            });
        });

        afterEach(function () {
            var notifyDependenciesAddedSpy = spyOn(BowerProjectManager, "notifyDependenciesAdded");

            notifyDependenciesAddedSpy.andCallThrough();
            setPackagesSpy.andCallThrough();
            getBowerJsonSpy.andCallThrough();

            notifyDependenciesAddedSpy.reset();
            setPackagesSpy.reset();
            getBowerJsonSpy.reset();

            // restore bower.json

            runs(function () {
                var deferred = new $.Deferred(),
                    promise = deferred.promise(),
                    bowerJson = project.activeBowerJson;

                function onBowerJsonChanged() {
                    FileSystemHandler.off(Events.BOWER_JSON_CHANGED, onBowerJsonChanged);

                    deferred.resolve();
                }

                FileSystemHandler.on(Events.BOWER_JSON_CHANGED, onBowerJsonChanged);

                bowerJson.saveContent(JSON.stringify(defaultBowerJsonContent, null, 4)).fail(function (error) {
                    FileSystemHandler.off(Events.BOWER_JSON_CHANGED, onBowerJsonChanged);

                    deferred.reject(error);
                });

                waitsForDone(promise, "saving default content ready");
            });

            runs(function () {
                waitsFor(function () {
                    return (notifyDependenciesAddedSpy.calls.length === 1);
                }, "project packages to be updated after bower.json changed", 30000);
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
                bowerJson = project.activeBowerJson;

            getBowerJsonSpy.andCallThrough();

            spyOn(bowerJson, "_notifyBowerJsonChanged").andCallThrough();
            spyOn(project, "bowerJsonChanged").andCallThrough();
            spyOn(project, "_processPackagesChanges").andCallThrough();

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
                    versionType: VersionOptions.TILDE,
                    type: DependencyType.PRODUCTION,
                    save: true
                };

                PackageManager.installByName("jquery", options);

                waitsFor(function () {
                    return (project._processPackagesChanges.calls.length === 1);
                }, "Installing 'jquery#~2.1.4' as production package", DEFAULT_TIMEOUT);
            });

            runs(function () {
                var projectPackages = project.getProjectPackages(),
                    dependenciesPackages = project.getPackagesDependenciesArray(),
                    packages = project.getPackages(),
                    bowerJsonDeps = bowerJson.getAllDependencies(),
                    status = project.getStatus(),
                    newPkg;

                expect(bowerJson._notifyBowerJsonChanged).toHaveBeenCalled();
                expect(project.bowerJsonChanged).toHaveBeenCalled();
                expect(setPackagesSpy.calls.length).toEqual(0);

                expect(status.isSynced()).toEqual(true);
                expect(bowerJsonDeps.dependencies).toBeDefined();
                expect(bowerJsonDeps.devDependencies).toBeDefined();
                expect(Object.keys(bowerJsonDeps.dependencies).length).toEqual(2);
                expect(Object.keys(bowerJsonDeps.devDependencies).length).toEqual(1);
                expect(bowerJsonDeps.dependencies.angular).toBeDefined();
                expect(bowerJsonDeps.devDependencies.sinon).toBeDefined();
                expect(bowerJsonDeps.dependencies.jquery).toBeDefined();

                expect(project.name).toEqual(projectName);
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
                bowerJson = project.activeBowerJson;

            getBowerJsonSpy.andCallThrough();
            setPackagesSpy.reset();

            spyOn(bowerJson, "_notifyBowerJsonChanged").andCallThrough();
            spyOn(project, "bowerJsonChanged").andCallThrough();
            spyOn(project, "_processPackagesChanges").andCallThrough();

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
                    versionType: VersionOptions.TILDE,
                    type: DependencyType.DEVELOPMENT,
                    save: true
                };

                PackageManager.installByName("jquery", options);

                waitsFor(function () {
                    return (project._processPackagesChanges.calls.length === 1);
                }, "Installing 'jquery#~2.1.4' as development package", DEFAULT_TIMEOUT);
            });

            runs(function () {
                var projectPackages = project.getProjectPackages(),
                    dependenciesPackages = project.getPackagesDependenciesArray(),
                    packages = project.getPackages(),
                    bowerJsonDeps = bowerJson.getAllDependencies(),
                    status = project.getStatus(),
                    newPkg;

                expect(bowerJson._notifyBowerJsonChanged).toHaveBeenCalled();
                expect(project.bowerJsonChanged).toHaveBeenCalled();
                expect(setPackagesSpy.calls.length).toEqual(0);

                expect(status.isSynced()).toEqual(true);
                expect(bowerJsonDeps.dependencies).toBeDefined();
                expect(bowerJsonDeps.devDependencies).toBeDefined();
                expect(Object.keys(bowerJsonDeps.dependencies).length).toEqual(1);
                expect(Object.keys(bowerJsonDeps.devDependencies).length).toEqual(2);
                expect(bowerJsonDeps.dependencies.angular).toBeDefined();
                expect(bowerJsonDeps.devDependencies.sinon).toBeDefined();
                expect(bowerJsonDeps.devDependencies.jquery).toBeDefined();

                expect(project.name).toEqual(projectName);
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
            var bowerJson = project.activeBowerJson;

            getBowerJsonSpy.andCallThrough();

            spyOn(bowerJson, "_notifyBowerJsonChanged").andCallThrough();
            spyOn(project, "bowerJsonChanged").andCallThrough();
            spyOn(project, "_processPackagesChanges").andCallThrough();

            spyOn(Bower, "uninstall").andCallFake(function () {
                var deferred = new testWindow.$.Deferred(),
                    Events = FileSystemHandler.Events,
                    result = {
                        "sinon": "/tests/project01/bower_components/sinon"
                    },
                    newContent = {
                        "name": projectName,
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
                PackageManager.uninstallByName("sinon", false);

                waitsFor(function () {
                    return (project._processPackagesChanges.calls.length === 1);
                }, "Uninstalling 'sinon'", DEFAULT_TIMEOUT);
            });

            runs(function () {
                var projectPackages = project.getProjectPackages(),
                    dependenciesPackages = project.getPackagesDependenciesArray(),
                    packages = project.getPackages(),
                    bowerJsonDeps = bowerJson.getAllDependencies(),
                    status = project.getStatus();

                expect(bowerJson._notifyBowerJsonChanged).toHaveBeenCalled();
                expect(project.bowerJsonChanged).toHaveBeenCalled();
                expect(setPackagesSpy.calls.length).toEqual(0);

                expect(status.isSynced()).toEqual(true);
                expect(bowerJsonDeps.dependencies).toBeDefined();
                expect(bowerJsonDeps.devDependencies).toBeDefined();
                expect(Object.keys(bowerJsonDeps.dependencies).length).toEqual(1);
                expect(Object.keys(bowerJsonDeps.devDependencies).length).toEqual(0);
                expect(bowerJsonDeps.dependencies.angular).toBeDefined();

                expect(project.name).toEqual(projectName);
                expect(projectPackages.length).toEqual(1);
                expect(dependenciesPackages.length).toEqual(0);
                expect(packages.angular).toBeDefined();
            });
        });

        it("updating a tracked package from 'production' to 'development' should cause BowerJson to be udpated without refreshing the Project packages model", function () {
            var bowerJson = project.activeBowerJson;

            getBowerJsonSpy.andCallThrough();

            spyOn(project, "bowerJsonChanged").andCallThrough();
            spyOn(project, "_processPackagesChanges").andCallThrough();

            spyOn(Bower, "update").andCallFake(function () {
                var deferred = new testWindow.$.Deferred();

                deferred.resolve({});

                return deferred.promise();
            });

            runs(function () {
                var options = {
                    version: "1.4.2",
                    versionType: VersionOptions.TILDE,
                    type: DependencyType.DEVELOPMENT
                };

                PackageManager.updateByName("angular", options);

                waitsFor(function () {
                    return (project._processPackagesChanges.calls.length === 1);
                }, "Updating 'angular' to 'development' package", DEFAULT_TIMEOUT);
            });

            runs(function () {
                var projectPackages = project.getProjectPackages(),
                    dependenciesPackages = project.getPackagesDependenciesArray(),
                    packages = project.getPackages(),
                    bowerJsonDeps = bowerJson.getAllDependencies(),
                    status = project.getStatus(),
                    updatedPkg;

                expect(project.bowerJsonChanged).not.toHaveBeenCalled();
                expect(setPackagesSpy.calls.length).toEqual(0);

                expect(status.isSynced()).toEqual(true);
                expect(bowerJsonDeps.dependencies).toBeDefined();
                expect(bowerJsonDeps.devDependencies).toBeDefined();
                expect(Object.keys(bowerJsonDeps.dependencies).length).toEqual(0);
                expect(Object.keys(bowerJsonDeps.devDependencies).length).toEqual(2);
                expect(bowerJsonDeps.devDependencies.angular).toBeDefined();
                expect(bowerJsonDeps.devDependencies.sinon).toBeDefined();

                expect(project.name).toEqual(projectName);
                expect(projectPackages.length).toEqual(2);
                expect(dependenciesPackages.length).toEqual(0);
                expect(packages.angular).toBeDefined();
                expect(packages.sinon).toBeDefined();

                updatedPkg = packages.angular;

                expect(updatedPkg.isProjectDependency).toEqual(true);
                expect(updatedPkg.isDevDependency()).toEqual(true);
                expect(updatedPkg.isInstalled()).toEqual(true);
                expect(updatedPkg.isNotTracked()).toEqual(false);
                expect(updatedPkg.isMissing()).toEqual(false);
            });
        });

        it("updating a tracked package from 'development' to 'production' should cause BowerJson to be udpated without refreshing the Project packages model", function () {
            var bowerJson = project.activeBowerJson;

            getBowerJsonSpy.andCallThrough();

            spyOn(project, "bowerJsonChanged").andCallThrough();
            spyOn(project, "_processPackagesChanges").andCallThrough();

            spyOn(Bower, "update").andCallFake(function () {
                var deferred = new testWindow.$.Deferred();

                deferred.resolve({});

                return deferred.promise();
            });

            runs(function () {
                var options = {
                    type: DependencyType.PRODUCTION
                };

                PackageManager.updateByName("sinon", options);

                waitsFor(function () {
                    return (project._processPackagesChanges.calls.length === 1);
                }, "Updating 'sinon' to 'production' package", DEFAULT_TIMEOUT);
            });

            runs(function () {
                var projectPackages = project.getProjectPackages(),
                    dependenciesPackages = project.getPackagesDependenciesArray(),
                    packages = project.getPackages(),
                    bowerJsonDeps = bowerJson.getAllDependencies(),
                    status = project.getStatus(),
                    updatedPkg;

                expect(project.bowerJsonChanged).not.toHaveBeenCalled();
                expect(setPackagesSpy.calls.length).toEqual(0);

                expect(status.isSynced()).toEqual(true);
                expect(bowerJsonDeps.dependencies).toBeDefined();
                expect(bowerJsonDeps.devDependencies).toBeDefined();
                expect(Object.keys(bowerJsonDeps.dependencies).length).toEqual(2);
                expect(Object.keys(bowerJsonDeps.devDependencies).length).toEqual(0);
                expect(bowerJsonDeps.dependencies.angular).toBeDefined();
                expect(bowerJsonDeps.dependencies.sinon).toBeDefined();

                expect(project.name).toEqual(projectName);
                expect(projectPackages.length).toEqual(2);
                expect(dependenciesPackages.length).toEqual(0);
                expect(packages.angular).toBeDefined();
                expect(packages.sinon).toBeDefined();

                updatedPkg = packages.sinon;

                expect(updatedPkg.isProjectDependency).toEqual(true);
                expect(updatedPkg.isProductionDependency()).toEqual(true);
                expect(updatedPkg.isInstalled()).toEqual(true);
                expect(updatedPkg.isNotTracked()).toEqual(false);
                expect(updatedPkg.isMissing()).toEqual(false);
            });
        });
    });
});
