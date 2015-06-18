/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, describe, it, expect, afterEach, beforeFirst, afterLast, waitsForDone, waitsForFail,
runs, spyOn, $, brackets, waitsForDone */

define(function (require, exports, module) {
    "use strict";

    var NodeDomain      = brackets.getModule("utils/NodeDomain"),
        SpecRunnerUtils = brackets.getModule("spec/SpecRunnerUtils"),
        extensionName   = "brackets-bower";

    describe("BracketsBower - Bower Commands", function () {
        var tempDir = SpecRunnerUtils.getTempDirectory(),
            defaultTimeout = 3000,
            Bower,
            config,
            ExtensionUtils,
            bowerDomain,
            testWindow,
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

                    config = {
                        cwd: tempDir
                    };

                    folderPromise.resolve();
                });

                waitsForDone(folderPromise, "waiting for test project to be opened");
            });

            runs(function () {
                var path = ExtensionUtils.getModulePath(module, "/utils/BowerDomainMock");

                Bower = extensionRequire("src/bower/Bower");

                bowerDomain = new NodeDomain("bower-test", path);

                Bower.setDomain(bowerDomain);
            });
        });

        afterEach(function () {
            runs(function () {
                bowerDomain.exec.reset();
                bowerDomain.exec("resetTestData");
            });
        });

        afterLast(function () {
            runs(function () {
                SpecRunnerUtils.closeTestWindow();
                SpecRunnerUtils.removeTempDirectory();
            });

            runs(function () {
                Bower = null;
                bowerDomain = null;
            });
        });

        it("should execute 'search' and get a list of packages", function () {
            spyOn(bowerDomain, "exec").andCallThrough();

            var resultPromise = new testWindow.$.Deferred(),
                data;

            runs(function () {
                Bower.search(config).then(function (result) {
                    data = result;
                    resultPromise.resolve();
                }).fail(function () {
                    resultPromise.reject();
                });

                waitsForDone(resultPromise, "search command was successfully executed", defaultTimeout);
            });

            runs(function () {
                expect(data).not.toBeNull();
                expect(data).toBeDefined();
                expect(data.length).toBeGreaterThan(0);

                data.forEach(function (pkg) {
                    expect(typeof pkg.name).toBe("string");
                    expect(typeof pkg.url).toBe("string");
                });

                expect(bowerDomain.exec).toHaveBeenCalledWith("search", config);
                expect(resultPromise.state()).toEqual("resolved");
            });
        });

        it("should execute 'search' and reject the promise with an error when it fails to search the registry", function () {
            var resultPromise = new testWindow.$.Deferred(),
                error;

            bowerDomain.exec("setTestData", {
                search: {
                    resultType: "failure"
                }
            });

            spyOn(bowerDomain, "exec").andCallThrough();

            runs(function () {
                Bower.search(config).then(function () {
                    resultPromise.resolve();
                }).fail(function (err) {
                    error = err;
                    resultPromise.reject();
                });

                waitsForFail(resultPromise, "search command was executed with failure", defaultTimeout);
            });

            runs(function () {
                expect(error).not.toBeNull();
                expect(error).toBeDefined();
                expect(error.code).not.toBeNull();
                expect(error.code).toBeDefined();
                expect(typeof error.code).toBe("number");
                expect(bowerDomain.exec.calls.length).toEqual(1);
                expect(bowerDomain.exec).toHaveBeenCalledWith("search", config);
                expect(resultPromise.state()).toEqual("rejected");
            });
        });

        it("should execute 'list cache' and get a list of available packages at the bower cache", function () {
            spyOn(bowerDomain, "exec").andCallThrough();

            var resultPromise = new testWindow.$.Deferred(),
                data;

            runs(function () {
                Bower.listCache(config).then(function (result) {
                    data = result;
                    resultPromise.resolve();
                }).fail(function () {
                    resultPromise.reject();
                });

                waitsForDone(resultPromise, "list cache command was successfully executed", defaultTimeout);
            });

            runs(function () {
                expect(data).not.toBeNull();
                expect(data).toBeDefined();
                expect(data.length).toBeGreaterThan(0);

                data.forEach(function (pkg) {
                    expect(typeof pkg.pkgMeta.name).toBe("string");
                    expect(typeof pkg.name).toBe("string");
                });

                expect(bowerDomain.exec.calls.length).toEqual(1);
                expect(bowerDomain.exec).toHaveBeenCalledWith("listCache", config);
                expect(resultPromise.state()).toEqual("resolved");
            });
        });

        it("should execute 'list cache' and get an empty list when any package is available at the bower cache", function () {
            var resultPromise = new testWindow.$.Deferred(),
                data;

            bowerDomain.exec("setTestData", {
                listCache: {
                    resultType: "failure"
                }
            });

            spyOn(bowerDomain, "exec").andCallThrough();

            runs(function () {
                Bower.listCache(config).then(function (result) {
                    data = result;
                    resultPromise.resolve();
                }).fail(function () {
                    resultPromise.reject();
                });

                waitsForDone(resultPromise, "list cache command was successfully executed", defaultTimeout);
            });

            runs(function () {
                expect(data).not.toBeNull();
                expect(data).toBeDefined();
                expect(data.length).toEqual(0);
                expect(bowerDomain.exec.calls.length).toEqual(1);
                expect(bowerDomain.exec).toHaveBeenCalledWith("listCache", config);
                expect(resultPromise.state()).toEqual("resolved");
            });
        });

        it("should execute 'install' to install a given package", function () {
            spyOn(bowerDomain, "exec").andCallThrough();

            var resultPromise = new testWindow.$.Deferred(),
                options = {
                    save: true
                },
                data;

            runs(function () {
                Bower.installPackage("jQuery", options, config).then(function (result) {
                    data = result;
                    resultPromise.resolve();
                }).fail(function () {
                    resultPromise.reject();
                });

                waitsForDone(resultPromise, "install command was successfully executed", defaultTimeout);
            });

            runs(function () {
                expect(data).not.toBeNull();
                expect(data).toBeDefined();
                expect(data.count).toEqual(1);

                expect(bowerDomain.exec.calls.length).toEqual(1);
                expect(bowerDomain.exec).toHaveBeenCalledWith("install", ["jQuery"], options, config);
                expect(resultPromise.state()).toEqual("resolved");
            });
        });

        it("should execute 'install' to install from a bower.json file", function () {
            var resultPromise = new testWindow.$.Deferred(),
                data;

            spyOn(bowerDomain, "exec").andCallThrough();

            runs(function () {
                Bower.install(config).then(function (result) {
                    data = result;
                    resultPromise.resolve();
                }).fail(function () {
                    resultPromise.reject();
                });

                waitsForDone(resultPromise, "install command was successfully executed", defaultTimeout);
            });

            runs(function () {
                expect(data).not.toBeNull();
                expect(data).toBeDefined();
                expect(data.count).toBeGreaterThan(1);

                expect(bowerDomain.exec.calls.length).toEqual(1);
                expect(bowerDomain.exec).toHaveBeenCalledWith("install", null, {}, config);
                expect(resultPromise.state()).toEqual("resolved");
            });
        });

        it("should execute 'install' to install from a bower.json file and when it doesn't exists reject the promise", function () {
            var resultPromise = new testWindow.$.Deferred(),
                error;

            bowerDomain.exec("setTestData", {
                install: {
                    bowerJsonExists: false
                }
            });

            spyOn(bowerDomain, "exec").andCallThrough();

            runs(function () {
                Bower.install(config).then(function (result) {
                    resultPromise.resolve();
                }).fail(function (err) {
                    error = err;
                    resultPromise.reject();
                });

                waitsForFail(resultPromise, "install command was executed with failure", defaultTimeout);
            });

            runs(function () {
                expect(error.code).not.toBeNull();
                expect(error.code).toBeDefined();
                expect(typeof error.code).toBe("number");

                expect(bowerDomain.exec.calls.length).toEqual(1);
                expect(bowerDomain.exec).toHaveBeenCalledWith("install", null, {}, config);
                expect(resultPromise.state()).toEqual("rejected");
            });
        });

        it("should execute 'uninstall' to uninstall a given package when it exists", function () {
            spyOn(bowerDomain, "exec").andCallThrough();

            var resultPromise = new testWindow.$.Deferred(),
                options = {
                    save: true
                },
                data;

            runs(function () {
                Bower.uninstall("jquery", options, config).then(function (result) {
                    data = result;
                    resultPromise.resolve();
                }).fail(function (err) {
                    console.log(err);
                    resultPromise.reject(err);
                });

                waitsForDone(resultPromise, "uninstall command was successfully executed", defaultTimeout);
            });

            runs(function () {
                expect(data).not.toBeNull();
                expect(data).toBeDefined();
                expect(Object.keys(data).length).toEqual(1);
                expect(data.jquery).toBeDefined();

                expect(bowerDomain.exec.calls.length).toEqual(1);
                expect(bowerDomain.exec).toHaveBeenCalledWith("uninstall", ["jquery"], options, config);
                expect(resultPromise.state()).toEqual("resolved");
            });
        });

        it("should execute 'uninstall' to uninstall more than 1 packages", function () {
            spyOn(bowerDomain, "exec").andCallThrough();

            var resultPromise = new testWindow.$.Deferred(),
                pkgs = ["package1", "package2", "package3"],
                options = {
                    save: true
                },
                data;

            runs(function () {
                Bower.uninstall(pkgs, options, config).then(function (result) {
                    data = result;
                    resultPromise.resolve();
                }).fail(function () {
                    resultPromise.reject();
                });

                waitsForDone(resultPromise, "uninstall command was successfully executed", defaultTimeout);
            });

            runs(function () {
                var pkgsNames = Object.keys(data);

                expect(data).not.toBeNull();
                expect(data).toBeDefined();
                expect(pkgsNames.length).toEqual(3);

                pkgsNames.forEach(function (pkgName) {
                    expect(data[pkgName]).toBeDefined();
                });

                expect(bowerDomain.exec.calls.length).toEqual(1);
                expect(bowerDomain.exec).toHaveBeenCalledWith("uninstall", pkgs, options, config);
                expect(resultPromise.state()).toEqual("resolved");
            });
        });

        it("should execute 'uninstall' to uninstall a package that doesn't exists and reject the promise", function () {
            var resultPromise = new testWindow.$.Deferred(),
                options = {
                    save: true
                },
                data;

            bowerDomain.exec("setTestData", {
                uninstall: {
                    packagesExists: false
                }
            });

            spyOn(bowerDomain, "exec").andCallThrough();

            runs(function () {
                Bower.uninstall("package1", options, config).then(function (result) {
                    data = result;
                    resultPromise.resolve();
                }).fail(function (err) {
                    resultPromise.reject(err);
                });

                waitsForFail(resultPromise, "uninstall command was successfully executed", defaultTimeout);
            });

            runs(function () {
                expect(data).not.toBeDefined();

                expect(bowerDomain.exec.calls.length).toEqual(1);
                expect(bowerDomain.exec).toHaveBeenCalledWith("uninstall", ["package1"], options, config);
                expect(resultPromise.state()).toEqual("rejected");
            });
        });

        it("should execute 'prune' to uninstall dependencies removed from a bower.json file when the bower.json file exists", function () {
            spyOn(bowerDomain, "exec").andCallThrough();

            var resultPromise = new testWindow.$.Deferred(),
                commandResult;

            runs(function () {
                Bower.prune(config).then(function (result) {
                    commandResult = result;
                    resultPromise.resolve();
                }).fail(function () {
                    resultPromise.reject();
                });

                waitsForDone(resultPromise, "prune command was successfully executed", defaultTimeout);
            });

            runs(function () {
                expect(commandResult).toEqual(true);
                expect(bowerDomain.exec.calls.length).toEqual(1);
                expect(bowerDomain.exec).toHaveBeenCalledWith("prune", config);
                expect(resultPromise.state()).toEqual("resolved");
            });
        });

        it("should reject the promise when executing 'prune' without a bower.json file at the current project", function () {
            var resultPromise = new testWindow.$.Deferred(),
                commandResult;

            bowerDomain.exec("setTestData", {
                prune: {
                    bowerJsonExists: false
                }
            });

            spyOn(bowerDomain, "exec").andCallThrough();

            Bower.prune(config).then(function () {
                resultPromise.resolve();
            }).fail(function (error) {
                commandResult = error;
                resultPromise.reject();
            });

            waitsForFail(resultPromise, "prune command was executed with failure", defaultTimeout);

            runs(function () {
                expect(commandResult.code).not.toBeNull();
                expect(commandResult.code).toBeDefined();
                expect(typeof commandResult.code).toBe("number");
                expect(bowerDomain.exec.calls.length).toEqual(1);
                expect(bowerDomain.exec).toHaveBeenCalledWith("prune", config);
                expect(resultPromise.state()).toEqual("rejected");
            });
        });
    });
});
