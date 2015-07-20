/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, describe, it, expect, beforeFirst, beforeEach, spyOn, jasmine, $, brackets */

define(function (require, exports, module) {
    "use strict";

    var _ = brackets.getModule("thirdparty/lodash");

    describe("BracketsBower - Project Model", function () {
        var BowerProject   = require("src/project/Project"),
            PackageFactory = require("src/project/PackageFactory"),
            ProjectManager = require("src/project/ProjectManager");

        describe("Packages summary", function () {
            var project,
                spyProjectManager,
                spyBowerJson;

            beforeFirst(function () {
                spyBowerJson = jasmine.createSpyObj("spyBowerJson", ["getAllDependencies"]);

                spyProjectManager = jasmine.createSpyObj("spyProjectManager", [
                    "notifyProjectStatusChanged",
                    "notifyDependenciesAdded",
                    "notifyDependenciesRemoved",
                    "notifyDependencyUpdated",
                    "syncDependenciesWithBowerJson",
                    "listProjectDependencies"
                ]);

                spyProjectManager.syncDependenciesWithBowerJson.andReturn((new $.Deferred()).resolve());
                spyProjectManager.listProjectDependencies.andReturn((new $.Deferred()).resolve());
            });

            beforeEach(function () {
                project = new BowerProject("project01", "/brackets-bower/unreal/path", spyProjectManager);
            });

            it("should get empty production, development and dependencies when the package doesn't have bower packages", function () {
                var pkgsSummary = project.getPackagesSummary();

                expect(project.packagesCount()).toEqual(0);
                expect(Array.isArray(pkgsSummary.production)).toEqual(true);
                expect(Array.isArray(pkgsSummary.development)).toEqual(true);
                expect(Array.isArray(pkgsSummary.dependenciesOnly)).toEqual(true);
                expect(pkgsSummary.production.length).toEqual(0);
                expect(pkgsSummary.development.length).toEqual(0);
                expect(pkgsSummary.dependenciesOnly.length).toEqual(0);
            });

            it("should get a production and development packages", function () {
                var data = require("text!tests/data/package-factory/list2.result.json"),
                    depsData = JSON.parse(data).dependencies,
                    pkgsSummary,
                    result,
                    pkg;

                spyBowerJson.getAllDependencies.andReturn(
                    {
                        "dependencies": {
                            "angular": "*",
                            "jquery": "*"
                        },
                        "devDependencies": {
                            "sinon": "*",
                            "lodash": "*",
                            "jasmine": "*"
                        }
                    }
                );

                spyOn(ProjectManager, "getBowerJson").andReturn(spyBowerJson);

                result = PackageFactory.createPackagesRecursive(depsData);

                project.setPackages(_.values(result));

                pkgsSummary = project.getPackagesSummary();

                expect(pkgsSummary.total).toEqual(5);
                expect(pkgsSummary.production.length).toEqual(2);
                expect(pkgsSummary.development.length).toEqual(3);
                expect(pkgsSummary.dependenciesOnly.length).toEqual(0);

                expect(spyProjectManager.notifyDependenciesAdded).toHaveBeenCalled();

                // production

                pkg = project.getPackageByName("angular");
                expect(pkg).toBeDefined();
                expect(pkg.isProjectDependency).toEqual(true);
                expect(pkg.isProductionDependency()).toEqual(true);
                expect(pkg.isDevDependency()).toEqual(false);
                expect(pkgsSummary.production.indexOf(pkg)).not.toEqual(-1);

                pkg = project.getPackageByName("jquery");
                expect(pkg).toBeDefined();
                expect(pkg.isProjectDependency).toEqual(true);
                expect(pkg.isProductionDependency()).toEqual(true);
                expect(pkg.isDevDependency()).toEqual(false);
                expect(pkgsSummary.production.indexOf(pkg)).not.toEqual(-1);

                // development

                pkg = project.getPackageByName("sinon");
                expect(pkg).toBeDefined();
                expect(pkg.isProjectDependency).toEqual(true);
                expect(pkg.isProductionDependency()).toEqual(false);
                expect(pkg.isDevDependency()).toEqual(true);
                expect(pkgsSummary.development.indexOf(pkg)).not.toEqual(-1);

                pkg = project.getPackageByName("lodash");
                expect(pkg).toBeDefined();
                expect(pkg.isProjectDependency).toEqual(true);
                expect(pkg.isProductionDependency()).toEqual(false);
                expect(pkg.isDevDependency()).toEqual(true);
                expect(pkgsSummary.development.indexOf(pkg)).not.toEqual(-1);

                pkg = project.getPackageByName("jasmine");
                expect(pkg).toBeDefined();
                expect(pkg.isProjectDependency).toEqual(true);
                expect(pkg.isProductionDependency()).toEqual(false);
                expect(pkg.isDevDependency()).toEqual(true);
                expect(pkgsSummary.development.indexOf(pkg)).not.toEqual(-1);
            });

            it("should get a production, development and dependencies packages, and an untracked one listed as a 'production' package", function () {
                var data = require("text!tests/data/package-factory/list5.result.json"),
                    depsData = JSON.parse(data).dependencies,
                    pkgsSummary,
                    result,
                    pkg;

                spyBowerJson.getAllDependencies.andReturn(
                    {
                        "name": "project01",
                        "dependencies": {
                            "angular-material": "*",
                            "angular": "*"
                        },
                        "devDependencies": {
                            "jasmine": "*"
                        }
                    }
                );

                spyOn(ProjectManager, "getBowerJson").andReturn(spyBowerJson);

                result = PackageFactory.createPackagesRecursive(depsData);

                project.setPackages(_.values(result));

                pkgsSummary = project.getPackagesSummary();

                expect(pkgsSummary.total).toEqual(6);
                expect(pkgsSummary.production.length).toEqual(3);
                expect(pkgsSummary.development.length).toEqual(1);
                expect(pkgsSummary.dependenciesOnly.length).toEqual(2);

                expect(spyProjectManager.notifyDependenciesAdded).toHaveBeenCalled();

                // production

                pkg = project.getPackageByName("angular-material");
                expect(pkg).toBeDefined();
                expect(pkg.isProjectDependency).toEqual(true);
                expect(pkg.isProductionDependency()).toEqual(true);
                expect(pkgsSummary.production.indexOf(pkg)).not.toEqual(-1);

                pkg = project.getPackageByName("angular");
                expect(pkg).toBeDefined();
                expect(pkg.isProjectDependency).toEqual(true);
                expect(pkg.isProductionDependency()).toEqual(true);
                expect(pkgsSummary.production.indexOf(pkg)).not.toEqual(-1);

                pkg = project.getPackageByName("jquery"); // is untracked, assume it's production
                expect(pkg).toBeDefined();
                expect(pkg.isProjectDependency).toEqual(true);
                expect(pkg.isProductionDependency()).toEqual(false);
                expect(pkg.isDevDependency()).toEqual(false);
                expect(pkg.isNotTracked()).toEqual(true);
                expect(pkgsSummary.production.indexOf(pkg)).not.toEqual(-1);
                expect(pkgsSummary.development.indexOf(pkg)).toEqual(-1);
                expect(pkgsSummary.dependenciesOnly.indexOf(pkg)).toEqual(-1);

                // development

                pkg = project.getPackageByName("jasmine");
                expect(pkg).toBeDefined();
                expect(pkg.isProjectDependency).toEqual(true);
                expect(pkg.isProductionDependency()).toEqual(false);
                expect(pkg.isDevDependency()).toEqual(true);
                expect(pkgsSummary.development.indexOf(pkg)).not.toEqual(-1);

                // dependencies only, not tracked in bower.json

                pkg = project.getPackageByName("angular-aria");
                expect(pkg).toBeDefined();
                expect(pkg.isProjectDependency).toEqual(false);
                expect(pkg.isProductionDependency()).toEqual(false);
                expect(pkg.isDevDependency()).toEqual(false);
                expect(pkgsSummary.dependenciesOnly.indexOf(pkg)).not.toEqual(-1);

                pkg = project.getPackageByName("angular-animate");
                expect(pkg).toBeDefined();
                expect(pkg.isProjectDependency).toEqual(false);
                expect(pkg.isProductionDependency()).toEqual(false);
                expect(pkg.isDevDependency()).toEqual(false);
                expect(pkgsSummary.dependenciesOnly.indexOf(pkg)).not.toEqual(-1);
            });
        });
    });
});
