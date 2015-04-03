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
/*global define, describe, it, expect, beforeEach, afterEach, beforeFirst, afterLast, waitsFor, waitsForDone, waitsForFail,
runs, spyOn, jasmine, $, brackets, waitsForDone */

define(function (require, exports, module) {
    "use strict";

    var NodeDomain      = brackets.getModule("utils/NodeDomain"),
        SpecRunnerUtils = brackets.getModule("spec/SpecRunnerUtils");

    describe("BracketsBower", function () {

        describe("Bower Commands", function () {
            var tempDir = SpecRunnerUtils.getTempDirectory(),
                bower = require("src/bower/Bower"),
                config,
                ExtensionUtils,
                bowerDomain,
                testWindow;

            beforeFirst(function () {
                SpecRunnerUtils.createTempDirectory();

                runs(function () {
                    var folderPromise = new $.Deferred();

                    SpecRunnerUtils.createTestWindowAndRun(this, function (w) {
                        testWindow = w;

                        ExtensionUtils = testWindow.brackets.test.ExtensionUtils;

                        SpecRunnerUtils.loadProjectInTestWindow(tempDir);

                        config = {
                            cwd: tempDir
                        };

                        folderPromise.resolve();
                    });

                    waitsForDone(folderPromise, "waiting for test project to be opened");
                });

                runs(function () {
                    var path = ExtensionUtils.getModulePath(module, "/tests/BowerDomainMock");

                    bowerDomain = new NodeDomain("bower-test", path);

                    bower.setDomain(bowerDomain);
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

            it("should execute 'search' and get a list of packages", function () {
                spyOn(bowerDomain, "exec").andCallThrough();

                var resultPromise = new testWindow.$.Deferred(),
                    data;

                runs(function () {
                    bower.search(config).then(function (result) {
                        data = result;
                        resultPromise.resolve();
                    }).fail(function () {
                        resultPromise.reject();
                    });

                    waitsForDone(resultPromise, "search command was successfully executed");
                });

                runs(function () {
                    expect(data).not.toBeNull();
                    expect(data).toBeDefined();
                    expect(data.length).toBeGreaterThan(0);

                    data.forEach(function (pkg) {
                        expect(typeof pkg.name).toBe("string");
                        expect(typeof pkg.url).toBe("string");
                    });

                    expect(bowerDomain.exec.calls.length).toEqual(1);
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
                    bower.search(config).then(function () {
                        resultPromise.resolve();
                    }).fail(function (err) {
                        error = err;
                        resultPromise.reject();
                    });

                    waitsForFail(resultPromise, "search command was executed with failure");
                });

                runs(function () {
                    expect(error).not.toBeNull();
                    expect(error).toBeDefined();
                    expect(typeof error).toBe("string");
                    expect(error).toEqual("BowerDomainMock error message");
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
                    bower.listCache(config).then(function (result) {
                        data = result;
                        resultPromise.resolve();
                    }).fail(function () {
                        resultPromise.reject();
                    });

                    waitsForDone(resultPromise, "list cache command was successfully executed");
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
                    bower.listCache(config).then(function (result) {
                        data = result;
                        resultPromise.resolve();
                    }).fail(function () {
                        resultPromise.reject();
                    });

                    waitsForDone(resultPromise, "list cache command was successfully executed");
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
                        save: true,
                    },
                    data;

                runs(function () {
                    bower.installPackage("jQuery", options, config).then(function (result) {
                        data = result;
                        resultPromise.resolve();
                    }).fail(function () {
                        resultPromise.reject();
                    });

                    waitsForDone(resultPromise, "install command was successfully executed");
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
                    bower.install(config).then(function (result) {
                        data = result;
                        resultPromise.resolve();
                    }).fail(function () {
                        resultPromise.reject();
                    });

                    waitsForDone(resultPromise, "install command was successfully executed");
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
                    bower.install(config).then(function (result) {
                        resultPromise.resolve();
                    }).fail(function (err) {
                        error = err;
                        resultPromise.reject();
                    });

                    waitsForFail(resultPromise, "install command was executed with failure");
                });

                runs(function () {
                    expect(error).toEqual("BowerDomainMock error message");

                    expect(bowerDomain.exec.calls.length).toEqual(1);
                    expect(bowerDomain.exec).toHaveBeenCalledWith("install", null, {}, config);
                    expect(resultPromise.state()).toEqual("rejected");
                });
            });

            it("should execute 'uninstall' to uninstall a given package when it exists", function () {
                spyOn(bowerDomain, "exec").andCallThrough();

                var resultPromise = new testWindow.$.Deferred(),
                    options = {
                        save: true,
                    },
                    data;

                runs(function () {
                    bower.uninstall("jquery", options, config).then(function (result) {
                        data = result;
                        resultPromise.resolve();
                    }).fail(function (err) {
                        console.log(err);
                        resultPromise.reject(err);
                    });

                    waitsForDone(resultPromise, "uninstall command was successfully executed");
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
                        save: true,
                    },
                    data;

                runs(function () {
                    bower.uninstall(pkgs, options, config).then(function (result) {
                        data = result;
                        resultPromise.resolve();
                    }).fail(function () {
                        resultPromise.reject();
                    });

                    waitsForDone(resultPromise, "uninstall command was successfully executed");
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
                        save: true,
                    },
                    data;

                bowerDomain.exec("setTestData", {
                    uninstall: {
                        packagesExists: false
                    }
                });

                spyOn(bowerDomain, "exec").andCallThrough();

                runs(function () {
                    bower.uninstall("package1", options, config).then(function (result) {
                        data = result;
                        resultPromise.resolve();
                    }).fail(function (err) {
                        resultPromise.reject(err);
                    });

                    waitsForFail(resultPromise, "uninstall command was successfully executed");
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
                    bower.prune(config).then(function (result) {
                        commandResult = result;
                        resultPromise.resolve();
                    }).fail(function () {
                        resultPromise.reject();
                    });

                    waitsForDone(resultPromise, "prune command was successfully executed");
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

                bower.prune(config).then(function () {
                    resultPromise.resolve();
                }).fail(function (error) {
                    commandResult = error;
                    resultPromise.reject();
                });

                waitsForFail(resultPromise, "prune command was executed with failure");

                runs(function () {
                    expect(commandResult).toEqual("BowerDomainMock error message");
                    expect(bowerDomain.exec.calls.length).toEqual(1);
                    expect(bowerDomain.exec).toHaveBeenCalledWith("prune", config);
                    expect(resultPromise.state()).toEqual("rejected");
                });
            });
        });

        describe("Bower Status Bar Controller", function () {
            var StatusBarController = require("src/StatusBarController")._StatusBarController,
                Status = require("src/StatusBarController")._Status,
                statusBarController,
                StatusTypes,
                mockView;

            beforeEach(function () {
                mockView = jasmine.createSpyObj("mockView", ["initialize", "onStatusAdded", "onStatusUpdated", "onStatusRemoved"]);

                statusBarController = new StatusBarController();
                statusBarController.initialize(mockView);
                StatusTypes = Status.types;

                expect(mockView.initialize).toHaveBeenCalled();
            });

            it("should post an 'INFO' status and the active status must be 1, when removing it, must be 0", function () {
                var id;

                expect(statusBarController.activeStatusCount()).toBe(0);

                id = statusBarController.post("Status text", StatusTypes.INFO);

                expect(statusBarController.activeStatusCount()).toBe(1);
                expect(mockView.onStatusAdded).toHaveBeenCalled();

                statusBarController.remove(id);

                expect(statusBarController.activeStatusCount()).toBe(0);
                expect(mockView.onStatusRemoved).toHaveBeenCalled();
            });

            it("should post 3 'INFO' status and the active status must be 3, when removing all of them, the active status must be 0", function () {
                var id1, id2, id3;

                expect(statusBarController.activeStatusCount()).toBe(0);

                id1 = statusBarController.post("Status text 1", StatusTypes.INFO);
                id2 = statusBarController.post("Status text 2", StatusTypes.INFO);
                id3 = statusBarController.post("Status text 3", StatusTypes.INFO);

                expect(statusBarController.activeStatusCount()).toBe(3);
                expect(mockView.onStatusAdded.callCount).toBe(3);

                statusBarController.remove(id1);
                statusBarController.remove(id2);
                statusBarController.remove(id3);

                expect(statusBarController.activeStatusCount()).toBe(0);
                expect(mockView.onStatusRemoved.callCount).toBe(3);
            });

            it("should post 50 'INFO' status and the active status must be 50, when removing all of them, the active status must be 0", function () {
                var idArray = [],
                    i;

                expect(statusBarController.activeStatusCount()).toBe(0);

                for (i = 0; i < 50; i++) {
                    idArray.push(statusBarController.post("Status text " + i, StatusTypes.INFO));
                }

                expect(statusBarController.activeStatusCount()).toBe(50);
                expect(mockView.onStatusAdded.callCount).toBe(50);

                for (i = 0; i < 50; i++) {
                    statusBarController.remove(idArray[i]);
                }

                expect(statusBarController.activeStatusCount()).toBe(0);
                expect(mockView.onStatusRemoved.callCount).toBe(50);
            });

            it("should post 50 'PROGRESS' status and the active status must be 50, when removing all of them, the active status must be 0", function () {
                var idArray = [],
                    i;

                expect(statusBarController.activeStatusCount()).toBe(0);

                for (i = 0; i < 50; i++) {
                    idArray.push(statusBarController.post("Status text " + i, StatusTypes.PROGRESS));
                }

                expect(statusBarController.activeStatusCount()).toBe(50);
                expect(mockView.onStatusAdded.callCount).toBe(50);

                for (i = 0; i < 50; i++) {
                    statusBarController.remove(idArray[i]);
                }

                expect(statusBarController.activeStatusCount()).toBe(0);
                expect(mockView.onStatusRemoved.callCount).toBe(50);
            });

            it("should post 50 'INFO' status and the active status must be 50, when removing 30 of them, the active status must be 20", function () {
                var idArray = [],
                    i;

                expect(statusBarController.activeStatusCount()).toBe(0);

                for (i = 0; i < 50; i++) {
                    idArray.push(statusBarController.post("Status text " + i, StatusTypes.INFO));
                }

                expect(statusBarController.activeStatusCount()).toBe(50);
                expect(mockView.onStatusAdded.callCount).toBe(50);

                for (i = 0; i < 30; i++) {
                    statusBarController.remove(idArray[i]);
                }

                expect(statusBarController.activeStatusCount()).toBe(20);
                expect(mockView.onStatusRemoved.callCount).toBe(30);
            });

            it("should post 10000 'INFO' status and the active status must be 10000, when removing all of them, the active status must be 0", function () {
                var idArray = [],
                    i;

                expect(statusBarController.activeStatusCount()).toBe(0);

                for (i = 0; i < 10000; i++) {
                    idArray.push(statusBarController.post("Status text " + i, StatusTypes.INFO));
                }

                expect(statusBarController.activeStatusCount()).toBe(10000);
                expect(mockView.onStatusAdded.callCount).toBe(10000);

                for (i = 0; i < 10000; i++) {
                    statusBarController.remove(idArray[i]);
                }

                expect(statusBarController.activeStatusCount()).toBe(0);
                expect(mockView.onStatusRemoved.callCount).toBe(10000);
            });

            it("should post an 'INFO' status, updated and then remove it", function () {
                var status, id;

                expect(statusBarController.activeStatusCount()).toBe(0);

                id = statusBarController.post("Status text", StatusTypes.INFO);
                status = statusBarController.getById(id);

                expect(statusBarController.activeStatusCount()).toBe(1);
                expect(status.Text).toEqual("Status text");
                expect(status.Type).toEqual(StatusTypes.INFO);
                expect(mockView.onStatusAdded).toHaveBeenCalled();

                statusBarController.update(id, "Status text updated", StatusTypes.PROGRESS);
                status = statusBarController.getById(id);

                expect(statusBarController.activeStatusCount()).toBe(1);
                expect(status.Text).toEqual("Status text updated");
                expect(status.Type).toEqual(StatusTypes.PROGRESS);
                expect(mockView.onStatusUpdated).toHaveBeenCalled();

                statusBarController.remove(id);
                status = statusBarController.getById(id);

                expect(statusBarController.activeStatusCount()).toBe(0);
                expect(status).not.toBeDefined();
                expect(mockView.onStatusRemoved).toHaveBeenCalled();
            });
        });

        describe("Bower Status Bar View", function () {
            var StatusBarView = require("src/views/StatusBarView"),
                Status = require("src/StatusBarController")._Status,
                statusBarView,
                StatusTypes,
                mockController = {
                    statusTypes: function () {
                        return Status.types;
                    }
                };

            beforeEach(function () {
                statusBarView = new StatusBarView(mockController);
                statusBarView.initialize();
                StatusTypes = Status.types;
            });

            it("should display only 1 'INFO' status when a single 'INFO' status is added", function () {
                var statusInstance = new Status(1, "Text 1", StatusTypes.INFO);

                statusBarView.onStatusAdded(1, statusInstance);

                expect(statusBarView.hasActiveInfoStatus()).toBe(true);
            });

            it("should display 0 'INFO' status when a single 'INFO' status was added and then removed", function () {
                var statusInstance = new Status(1, "Text 1", StatusTypes.INFO);

                statusBarView.onStatusAdded(1, statusInstance);

                expect(statusBarView.hasActiveInfoStatus()).toBe(true);

                statusBarView.onStatusRemoved(1, statusInstance);

                waitsFor(function () {
                    return (statusBarView.hasActiveInfoStatus() === false);
                }, "Info progress section has no more elements");
            });

            it("should display only 1 'PROGRESS' status when a single 'PROGRESS' status is added", function () {
                var statusInstance = new Status(1, "Text 1", StatusTypes.INFO);

                statusBarView.onStatusAdded(1, statusInstance);

                expect(statusBarView.hasActiveInfoStatus()).toBe(true);
            });

            it("should display 0 'PROGRESS' status when a single 'PROGRESS' status was added and then removed", function () {
                var statusInstance = new Status(1, "Text 1", StatusTypes.INFO);

                statusBarView.onStatusAdded(1, statusInstance);

                expect(statusBarView.hasActiveInfoStatus()).toBe(true);

                statusBarView.onStatusRemoved(1, statusInstance);

                waitsFor(function () {
                    return (statusBarView.hasActiveInfoStatus() === false);
                }, "Info progress section has no more elements");
            });

            it("should display 1 'INFO' status when a single 'PROGRESS' status was added and then updated its status", function () {
                var statusInstance = new Status(1, "Text 1", StatusTypes.PROGRESS),
                    statusInstanceUpdated = new Status(1, "Text 1", StatusTypes.INFO);

                statusBarView.onStatusAdded(1, statusInstance);

                expect(statusBarView.hasActiveProgressStatus()).toBe(true);
                expect(statusBarView.hasActiveInfoStatus()).toBe(false);

                statusBarView.onStatusUpdated(1, statusInstanceUpdated, statusInstance);

                expect(statusBarView.hasActiveProgressStatus()).toBe(false);
                expect(statusBarView.hasActiveInfoStatus()).toBe(true);
            });

            it("should display 0 status when a single 'PROGRESS' status was added, updated and removed", function () {
                var statusInstance = new Status(1, "Text 1", StatusTypes.PROGRESS),
                    statusInstanceUpdated = new Status(1, "Text 1", StatusTypes.INFO);

                statusBarView.onStatusAdded(1, statusInstance);

                expect(statusBarView.hasActiveProgressStatus()).toBe(true);
                expect(statusBarView.hasActiveInfoStatus()).toBe(false);

                statusBarView.onStatusUpdated(1, statusInstanceUpdated, statusInstance);

                expect(statusBarView.hasActiveProgressStatus()).toBe(false);
                expect(statusBarView.hasActiveInfoStatus()).toBe(true);

                statusBarView.onStatusRemoved(1, statusInstanceUpdated);

                waitsFor(function () {
                    return (statusBarView.hasActiveInfoStatus() === false);
                });

                runs(function () {
                    expect(statusBarView.hasActiveProgressStatus()).toBe(false);
                    expect(statusBarView.hasActiveInfoStatus()).toBe(false);
                });
            });

            it("should display 10 'INFO' status when 10 are posted, then 0 status when all of them where removed", function () {
                var statusArray = [],
                    status,
                    i;

                expect(statusBarView.hasActiveInfoStatus()).toBe(false);
                expect(statusBarView.hasActiveProgressStatus()).toBe(false);
                expect(statusBarView.progressStatusCount()).toBe(0);

                for (i = 0; i < 10; i++) {
                    status = new Status(i, "Text " + i, StatusTypes.INFO);
                    statusArray.push(status);
                    statusBarView.onStatusAdded(status.Id, status);
                }

                expect(statusBarView.hasActiveInfoStatus()).toBe(true);
                expect(statusBarView.hasActiveProgressStatus()).toBe(false);
                expect(statusBarView.progressStatusCount()).toBe(0);

                statusArray.forEach(function (status) {
                    statusBarView.onStatusRemoved(status.Id, status);
                });

                waitsFor(function () {
                    return (statusBarView.hasActiveInfoStatus() === false);
                }, 100000);

                runs(function () {
                    expect(statusBarView.hasActiveInfoStatus()).toBe(false);
                    expect(statusBarView.hasActiveProgressStatus()).toBe(false);
                    expect(statusBarView.progressStatusCount()).toBe(0);
                });

            });

            it("should display 10 'PROGRESS' status when 10 are posted, then 0 status when all of them where removed", function () {
                var statusArray = [],
                    status,
                    i;

                expect(statusBarView.hasActiveInfoStatus()).toBe(false);
                expect(statusBarView.hasActiveProgressStatus()).toBe(false);
                expect(statusBarView.progressStatusCount()).toBe(0);

                for (i = 0; i < 10; i++) {
                    status = new Status(i, "Text " + i, StatusTypes.PROGRESS);
                    statusArray.push(status);
                    statusBarView.onStatusAdded(status.Id, status);
                }

                expect(statusBarView.hasActiveInfoStatus()).toBe(false);
                expect(statusBarView.hasActiveProgressStatus()).toBe(true);
                expect(statusBarView.progressStatusCount()).toBe(10);

                statusArray.forEach(function (status) {
                    statusBarView.onStatusRemoved(status.Id, status);
                });

                waitsFor(function () {
                    return (statusBarView.hasActiveProgressStatus() === false);
                }, 100000);

                runs(function () {
                    expect(statusBarView.hasActiveInfoStatus()).toBe(false);
                    expect(statusBarView.hasActiveProgressStatus()).toBe(false);
                    expect(statusBarView.progressStatusCount()).toBe(0);
                });

            });

            it("should display 10 mixed 'PROGRESS' and 'INFO' status when 10 are posted, then 0 status when all of them where removed", function () {
                var statusArray = [],
                    status,
                    type,
                    i;

                expect(statusBarView.hasActiveInfoStatus()).toBe(false);
                expect(statusBarView.hasActiveProgressStatus()).toBe(false);
                expect(statusBarView.progressStatusCount()).toBe(0);

                for (i = 0; i < 10; i++) {
                    type = ((i % 2) === 0) ? StatusTypes.INFO : StatusTypes.PROGRESS;
                    status = new Status(i, "Text " + i, type);
                    statusArray.push(status);
                    statusBarView.onStatusAdded(status.Id, status);
                }

                expect(statusBarView.hasActiveInfoStatus()).toBe(true);
                expect(statusBarView.hasActiveProgressStatus()).toBe(true);
                expect(statusBarView.progressStatusCount()).toBe(5);

                statusArray.forEach(function (status) {
                    statusBarView.onStatusRemoved(status.Id, status);
                });

                waitsFor(function () {
                    return (statusBarView.hasActiveProgressStatus() === false && statusBarView.hasActiveInfoStatus() === false);
                }, 100000);

                runs(function () {
                    expect(statusBarView.hasActiveInfoStatus()).toBe(false);
                    expect(statusBarView.hasActiveProgressStatus()).toBe(false);
                    expect(statusBarView.progressStatusCount()).toBe(0);
                });

            });

            it("should display 2 'PROGRESS' status, update them to 'INFO' type, they should be displayed on information section and 'progressCount' should be 0", function () {
                var status1,
                    status2,
                    statusUpdated1,
                    statusUpdated2;

                expect(statusBarView.hasActiveInfoStatus()).toBe(false);
                expect(statusBarView.hasActiveProgressStatus()).toBe(false);
                expect(statusBarView.progressStatusCount()).toBe(0);

                status1 = new Status(1, "Text 1", StatusTypes.PROGRESS);
                status2 = new Status(2, "Text 2", StatusTypes.PROGRESS);
                statusUpdated1 = new Status(1, "Text 1", StatusTypes.INFO);
                statusUpdated2 = new Status(2, "Text 2", StatusTypes.INFO);

                statusBarView.onStatusAdded(status1.Id, status1);
                statusBarView.onStatusAdded(status2.Id, status2);

                expect(statusBarView.hasActiveInfoStatus()).toBe(false);
                expect(statusBarView.hasActiveProgressStatus()).toBe(true);
                expect(statusBarView.progressStatusCount()).toBe(2);

                statusBarView.onStatusUpdated(1, statusUpdated1, status1);
                statusBarView.onStatusUpdated(2, statusUpdated2, status2);

                expect(statusBarView.hasActiveInfoStatus()).toBe(true);
                expect(statusBarView.hasActiveProgressStatus()).toBe(false);
                expect(statusBarView.progressStatusCount()).toBe(0);
            });
        });

        describe("Bower Status Bar", function () {
            var StatusBarController = require("src/StatusBarController")._StatusBarController,
                StatusBarView = require("src/views/StatusBarView"),
                statusBarController,
                statusBarView,
                StatusTypes;

            beforeEach(function () {

                runs(function () {
                    SpecRunnerUtils.createTestWindowAndRun(this, function (testWindow) {
                        statusBarController = new StatusBarController();
                        statusBarView = new StatusBarView(statusBarController);
                        statusBarController.initialize(statusBarView);

                        StatusTypes = statusBarController.statusTypes();
                    });
                });
            });

            afterEach(function () {

                runs(function () {
                    SpecRunnerUtils.closeTestWindow();
                });

                runs(function () {
                    statusBarController = null;
                    statusBarView = null;
                    StatusTypes = null;
                });
            });

            it("should display 5 status in progress section for status type 'PROGRESS', and shouldn't display any when all of them are removed", function () {
                var ids = [],
                    id,
                    i;

                expect(statusBarController.activeStatusCount()).toBe(0);
                expect(statusBarView.hasActiveProgressStatus()).toBe(false);
                expect(statusBarView.hasActiveInfoStatus()).toBe(false);

                for (i = 0; i < 5; i++) {
                    id = statusBarController.post("Status text " + i, StatusTypes.PROGRESS);
                    ids.push(id);
                }

                expect(statusBarController.activeStatusCount()).toBe(5);
                expect(statusBarView.hasActiveProgressStatus()).toBe(true);
                expect(statusBarView.hasActiveInfoStatus()).toBe(false);

                ids.forEach(function (statusId) {
                    statusBarController.remove(statusId);
                });

                waitsFor(function () {
                    return (statusBarView.hasActiveProgressStatus() === false && statusBarView.hasActiveInfoStatus() === false);
                });

                runs(function () {
                    expect(statusBarController.activeStatusCount()).toBe(0);
                    expect(statusBarView.hasActiveProgressStatus()).toBe(false);
                    expect(statusBarView.hasActiveInfoStatus()).toBe(false);
                });
            });

            it("should display 5 status in progress section for status type 'PROGRESS', update some of them, delete some of them and, add new status, then remove all of them and the status bar should be empty", function () {
                var ids = [],
                    id,
                    i;

                expect(statusBarController.activeStatusCount()).toBe(0);
                expect(statusBarView.hasActiveProgressStatus()).toBe(false);
                expect(statusBarView.hasActiveInfoStatus()).toBe(false);
                expect(statusBarView.progressStatusCount()).toBe(0);

                for (i = 0; i < 5; i++) {
                    id = statusBarController.post("Status text " + i, StatusTypes.PROGRESS);
                    ids.push(id);
                }

                expect(statusBarController.activeStatusCount()).toBe(5);
                expect(statusBarView.hasActiveProgressStatus()).toBe(true);
                expect(statusBarView.hasActiveInfoStatus()).toBe(false);
                expect(statusBarView.progressStatusCount()).toBe(5);

                statusBarController.update(1, "Status text", StatusTypes.INFO);
                statusBarController.update(2, "Status text", StatusTypes.INFO);
                statusBarController.update(3, "Status text", StatusTypes.INFO);

                expect(statusBarController.activeStatusCount()).toBe(5);
                expect(statusBarView.hasActiveProgressStatus()).toBe(true);
                expect(statusBarView.hasActiveInfoStatus()).toBe(true);
                expect(statusBarView.progressStatusCount()).toBe(2);

                ids.forEach(function (id) {
                    statusBarController.remove(id);
                });

                ids = [];

                for (i = 0; i < 5; i++) {
                    id = statusBarController.post("Status text " + i, StatusTypes.INFO);
                    ids.push(id);
                }

                waitsFor(function () {
                    return (statusBarView.hasActiveProgressStatus() === false);
                });

                runs(function () {
                    expect(statusBarController.activeStatusCount()).toBe(5);
                    expect(statusBarView.hasActiveProgressStatus()).toBe(false);
                    expect(statusBarView.hasActiveInfoStatus()).toBe(true);
                });
            });
        });

        describe("Bower Preferences", function () {
            var Preferences = require("src/preferences/Preferences");

            it("should get as default value '10' for 'RELOAD_REGISTRY_TIME'", function () {
                var value = Preferences.getDefaultBySetting(Preferences.settings.RELOAD_REGISTRY_TIME);

                expect(value).toBe(10);
            });

            it("should get as default value 'true' for 'QUICK_INSTALL_SAVE'", function () {
                var value = Preferences.getDefaultBySetting(Preferences.settings.QUICK_INSTALL_SAVE);

                expect(value).toBe(true);
            });

            it("should get as default value 'false' for 'EXTENSION_VISIBLE'", function () {
                var value = Preferences.getDefaultBySetting(Preferences.settings.EXTENSION_VISIBLE);

                expect(value).toBe(false);
            });

            it("should get as minimum value '3' for 'RELOAD_REGISTRY_TIME'", function () {
                var value = Preferences.getMinValueForSetting(Preferences.settings.RELOAD_REGISTRY_TIME);

                expect(value).toBe(3);
            });

            it("should throw an exception when trying to get the minimum value for 'QUICK_INSTALL_SAVE'", function () {
                var fn = function () {
                    Preferences.getMinValueForSetting(Preferences.settings.QUICK_INSTALL_SAVE);
                };

                expect(fn).toThrow();
            });

            it("should throw an exception when trying to get the minimum value for 'EXTENSION_VISIBLE'", function () {
                var fn = function () {
                    Preferences.getMinValueForSetting(Preferences.settings.EXTENSION_VISIBLE);
                };

                expect(fn).toThrow();
            });

            it("should validate and change the preference 'RELOAD_REGISTRY_TIME' with a string value of '60000' to a number value", function () {
                var key = Preferences.settings.RELOAD_REGISTRY_TIME;

                Preferences.set(key, "6000");

                expect(Preferences.get(key)).toBe(6000);
            });

            it("should validate and change the preference 'RELOAD_REGISTRY_TIME' with a string value of 'abc' to the default number value for the preference", function () {
                var key = Preferences.settings.RELOAD_REGISTRY_TIME,
                    defaults = Preferences.getDefaults();

                Preferences.set(key, "abc");

                expect(Preferences.get(key)).toBe(defaults.reloadRegistryTime);
            });

            it("should validate and change the preference 'RELOAD_REGISTRY_TIME' with a 'null' value to the default number value for the preference", function () {
                var key = Preferences.settings.RELOAD_REGISTRY_TIME,
                    defaults = Preferences.getDefaults();

                Preferences.set(key, null);

                expect(Preferences.get(key)).toBe(defaults.reloadRegistryTime);
            });

            it("should validate and change the preference 'RELOAD_REGISTRY_TIME' with an 'undefined' value to the default number value for the preference", function () {
                var key = Preferences.settings.RELOAD_REGISTRY_TIME,
                    defaults = Preferences.getDefaults();

                Preferences.set(key, undefined);

                expect(Preferences.get(key)).toBe(defaults.reloadRegistryTime);
            });

            it("should validate and change the preference 'RELOAD_REGISTRY_TIME' with a number value less than the minimum value, like '2' minutes, to the default number value for the preference", function () {
                var key = Preferences.settings.RELOAD_REGISTRY_TIME,
                    defaults = Preferences.getDefaults();

                Preferences.set(key, 2);

                expect(Preferences.get(key)).toBe(defaults.reloadRegistryTime);
            });

            it("should validate and change the preference 'RELOAD_REGISTRY_TIME' with a number value less than the minimum value, like '-10' minutes, to the default number value for the preference", function () {
                var key = Preferences.settings.RELOAD_REGISTRY_TIME,
                    defaults = Preferences.getDefaults();

                Preferences.set(key, -10);

                expect(Preferences.get(key)).toBe(defaults.reloadRegistryTime);
            });

            it("should validate and not change the preference 'RELOAD_REGISTRY_TIME' with a number value of '6000'", function () {
                var key = Preferences.settings.RELOAD_REGISTRY_TIME;

                Preferences.set(key, 100000);

                expect(Preferences.get(key)).toBe(100000);
            });

            it("should validate and change the preference 'QUICK_INSTALL_SAVE' with a string value of 'abc' to the default boolean value", function () {
                var key = Preferences.settings.QUICK_INSTALL_SAVE,
                    defaults = Preferences.getDefaults();

                Preferences.set(key, "abc");

                expect(Preferences.get(key)).toBe(defaults.quickInstallSavePackages);
            });

            it("should validate and change the preference 'QUICK_INSTALL_SAVE' with a number value of '60000' to the default boolean value", function () {
                var key = Preferences.settings.QUICK_INSTALL_SAVE,
                    defaults = Preferences.getDefaults();

                Preferences.set(key, 60000);

                expect(Preferences.get(key)).toBe(defaults.quickInstallSavePackages);
            });

            it("should validate and change the preference 'QUICK_INSTALL_SAVE' with a 'null' value to the default boolean value", function () {
                var key = Preferences.settings.QUICK_INSTALL_SAVE,
                    defaults = Preferences.getDefaults();

                Preferences.set(key, null);

                expect(Preferences.get(key)).toBe(defaults.quickInstallSavePackages);
            });

            it("should validate and change the preference 'QUICK_INSTALL_SAVE' with an 'undefined' value to the default boolean value", function () {
                var key = Preferences.settings.QUICK_INSTALL_SAVE,
                    defaults = Preferences.getDefaults();

                Preferences.set(key, undefined);

                expect(Preferences.get(key)).toBe(defaults.quickInstallSavePackages);
            });

            it("should validate and not change the preference 'QUICK_INSTALL_SAVE' with a boolean value of 'true'", function () {
                var key = Preferences.settings.QUICK_INSTALL_SAVE;

                Preferences.set(key, true);

                expect(Preferences.get(key)).toBe(true);
            });

            it("should validate and not change the preference 'QUICK_INSTALL_SAVE' with a boolean value of 'false'", function () {
                var key = Preferences.settings.QUICK_INSTALL_SAVE;

                Preferences.set(key, false);

                expect(Preferences.get(key)).toBe(false);
            });

            it("should validate and change the preference 'EXTENSION_VISIBLE' with a string value of 'abc' to the default boolean value", function () {
                var key = Preferences.settings.EXTENSION_VISIBLE,
                    defaults = Preferences.getDefaults();

                Preferences.set(key, "abc");

                expect(Preferences.get(key)).toBe(defaults.show);
            });

            it("should validate and change the preference 'EXTENSION_VISIBLE' with a number value of '60000' to the default boolean value", function () {
                var key = Preferences.settings.EXTENSION_VISIBLE,
                    defaults = Preferences.getDefaults();

                Preferences.set(key, 60000);

                expect(Preferences.get(key)).toBe(defaults.show);
            });

            it("should validate and change the preference 'EXTENSION_VISIBLE' with a null value to the default boolean value", function () {
                var key = Preferences.settings.EXTENSION_VISIBLE,
                    defaults = Preferences.getDefaults();

                Preferences.set(key, null);

                expect(Preferences.get(key)).toBe(defaults.show);
            });

            it("should validate and change the preference 'EXTENSION_VISIBLE' with an undefined value to the default boolean value", function () {
                var key = Preferences.settings.EXTENSION_VISIBLE,
                    defaults = Preferences.getDefaults();

                Preferences.set(key, undefined);

                expect(Preferences.get(key)).toBe(defaults.show);
            });

            it("should validate and not change the preference 'EXTENSION_VISIBLE' with a boolean value of 'true'", function () {
                var key = Preferences.settings.EXTENSION_VISIBLE;

                Preferences.set(key, true);

                expect(Preferences.get(key)).toBe(true);
            });

            it("should validate and not change the preference 'EXTENSION_VISIBLE' with a boolean value of 'false'", function () {
                var key = Preferences.settings.EXTENSION_VISIBLE;

                Preferences.set(key, false);

                expect(Preferences.get(key)).toBe(false);
            });
        });

        describe("Metadata files models", function () {
            var tempDir = SpecRunnerUtils.getTempDirectory(),
                testWindow;

            beforeFirst(function () {
                runs(function () {
                    var folderPromise = new $.Deferred();

                    SpecRunnerUtils.createTestWindowAndRun(this, function (w) {
                        testWindow = w;
                        folderPromise.resolve();
                    });

                    waitsForDone(folderPromise, "waiting for test project to be opened");
                });
            });

            beforeEach(function () {
                runs(function () {
                    SpecRunnerUtils.createTempDirectory();
                    SpecRunnerUtils.loadProjectInTestWindow(tempDir);
                });
            });

            afterEach(function () {
                runs(function () {
                    SpecRunnerUtils.removeTempDirectory();
                });
            });

            afterLast(function () {
                runs(function () {
                    SpecRunnerUtils.closeTestWindow();
                });
            });

            describe("BowerJson", function () {
                var BowerJson = require("src/bower/metadata/BowerJson"),
                    Package = require("src/bower/PackageFactory")._Package;

                it("should create a BowerJson object with default content", function () {
                    var bowerJson = new BowerJson(tempDir + "/", "test-app"), // TODO check this
                        content;

                    runs(function () {
                        var promise = bowerJson.create();

                        waitsForDone(promise, "bower.json file created", 3000);
                    });

                    runs(function () {
                        var deferred = new $.Deferred();

                        bowerJson.read().then(function (res) {
                            content = JSON.parse(res);
                            deferred.resolve();
                        }).fail(function (err) {
                            deferred.reject(err);
                        });

                        waitsForDone(deferred.promise(), "read content");
                    });

                    runs(function () {
                        expect(bowerJson.AbsolutePath).not.toBeNull();
                        expect(bowerJson.AbsolutePath).toBeDefined();
                        expect(bowerJson.ProjectPath).not.toBeNull();
                        expect(bowerJson.ProjectPath).toBeDefined();

                        expect(content).not.toBeNull();
                        expect(content).toBeDefined();

                        expect(content.name).toBe("test-app");
                        expect(content.dependencies).toBeDefined();
                        expect(content.devDependencies).toBeDefined();
                        expect(Object.keys(content.dependencies).length).toBe(0);
                        expect(Object.keys(content.devDependencies).length).toBe(0);
                    });
                });

                it("should create a BowerJson object with the given content (only dependencies)", function () {
                    var bowerJson = new BowerJson(tempDir + "/", "test-app"), // TODO check this
                        pkg1 = new Package("dep1"),
                        pkg2 = new Package("dep2"),
                        packages = [],
                        content;

                    pkg1.version = "1.0.0";
                    pkg2.version = "1.1.0";

                    packages.push(pkg1);
                    packages.push(pkg2);

                    runs(function () {
                        var promise = bowerJson.create(packages);

                        waitsForDone(promise, "bower.json file created", 3000);
                    });

                    runs(function () {
                        var deferred = new $.Deferred();

                        bowerJson.read().then(function (res) {
                            content = JSON.parse(res);
                            deferred.resolve();
                        }).fail(function (err) {
                            deferred.reject(err);
                        });

                        waitsForDone(deferred.promise(), "read content");
                    });

                    runs(function () {
                        expect(bowerJson.AbsolutePath).not.toBeNull();
                        expect(bowerJson.AbsolutePath).toBeDefined();
                        expect(bowerJson.ProjectPath).not.toBeNull();
                        expect(bowerJson.ProjectPath).toBeDefined();

                        expect(content).not.toBeNull();
                        expect(content).toBeDefined();

                        expect(content.name).toBe("test-app");
                        expect(content.dependencies).toBeDefined();
                        expect(content.devDependencies).not.toBeDefined();
                        expect(Object.keys(content.dependencies).length).toBe(2);

                        expect(content.dependencies[pkg1.name]).toBe(pkg1.version);
                        expect(content.dependencies[pkg2.name]).toBe(pkg2.version);
                    });
                });

                it("should create a BowerJson object with the given content (only devDependencies)", function () {
                    var bowerJson = new BowerJson(tempDir + "/", "test-app"), // TODO check this
                        pkg1 = new Package("dep1"),
                        pkg2 = new Package("dep2"),
                        packages = [],
                        content;

                    pkg1.version = "1.0.0";
                    pkg1.isDevDependency = true;
                    pkg2.version = "1.1.0";
                    pkg2.isDevDependency = true;

                    packages.push(pkg1);
                    packages.push(pkg2);

                    runs(function () {
                        var promise = bowerJson.create(packages);

                        waitsForDone(promise, "bower.json file created", 3000);
                    });

                    runs(function () {
                        var deferred = new $.Deferred();

                        bowerJson.read().then(function (res) {
                            content = JSON.parse(res);
                            deferred.resolve();
                        }).fail(function (err) {
                            deferred.reject(err);
                        });

                        waitsForDone(deferred.promise(), "read content");
                    });

                    runs(function () {
                        expect(bowerJson.AbsolutePath).not.toBeNull();
                        expect(bowerJson.AbsolutePath).toBeDefined();
                        expect(bowerJson.ProjectPath).not.toBeNull();
                        expect(bowerJson.ProjectPath).toBeDefined();

                        expect(content).not.toBeNull();
                        expect(content).toBeDefined();

                        expect(content.name).toBe("test-app");
                        expect(content.dependencies).toBeDefined();
                        expect(content.devDependencies).toBeDefined();
                        expect(Object.keys(content.devDependencies).length).toBe(2);

                        expect(content.devDependencies[pkg1.name]).toBe(pkg1.version);
                        expect(content.devDependencies[pkg2.name]).toBe(pkg2.version);
                    });
                });

                it("should create a BowerJson object with the given content (dependencies and devDependencies)", function () {
                    var bowerJson = new BowerJson(tempDir + "/", "test-app"), // TODO check this
                        pkg1 = new Package("dep1"),
                        pkg2 = new Package("dep2"),
                        pkg3 = new Package("dep3"),
                        pkg4 = new Package("dep4"),
                        pkg5 = new Package("dep5"),
                        packages = [],
                        content;

                    pkg1.version = "1.0.0";
                    pkg2.version = "1.1.0";
                    pkg3.version = "1.0.0";
                    pkg4.version = "1.1.0";
                    pkg5.version = "1.1.0";

                    pkg1.isDevDependency = false;
                    pkg2.isDevDependency = true;
                    pkg3.isDevDependency = false;
                    pkg4.isDevDependency = true;
                    pkg5.isDevDependency = true;

                    packages.push(pkg1);
                    packages.push(pkg2);
                    packages.push(pkg3);
                    packages.push(pkg4);
                    packages.push(pkg5);

                    runs(function () {
                        var promise = bowerJson.create(packages);

                        waitsForDone(promise, "bower.json file created", 3000);
                    });

                    runs(function () {
                        var deferred = new $.Deferred();

                        bowerJson.read().then(function (res) {
                            content = JSON.parse(res);
                            deferred.resolve();
                        }).fail(function (err) {
                            deferred.reject(err);
                        });

                        waitsForDone(deferred.promise(), "read content");
                    });

                    runs(function () {
                        expect(bowerJson.AbsolutePath).not.toBeNull();
                        expect(bowerJson.AbsolutePath).toBeDefined();
                        expect(bowerJson.ProjectPath).not.toBeNull();
                        expect(bowerJson.ProjectPath).toBeDefined();

                        expect(content).not.toBeNull();
                        expect(content).toBeDefined();

                        expect(content.name).toBe("test-app");
                        expect(content.dependencies).toBeDefined();
                        expect(content.devDependencies).toBeDefined();
                        expect(Object.keys(content.dependencies).length).toBe(2);
                        expect(Object.keys(content.devDependencies).length).toBe(3);

                        expect(content.dependencies[pkg1.name]).toBe(pkg1.version);
                        expect(content.devDependencies[pkg2.name]).toBe(pkg2.version);
                        expect(content.dependencies[pkg3.name]).toBe(pkg3.version);
                        expect(content.devDependencies[pkg4.name]).toBe(pkg4.version);
                        expect(content.devDependencies[pkg5.name]).toBe(pkg5.version);
                    });
                });

                it("should update the version for a dependency when it exists", function () {
                    var bowerJson = new BowerJson(tempDir + "/", "test-app"), // TODO check this
                        pkg1 = new Package("dep1"),
                        newVersion = "2.0.0",
                        packages = [],
                        content;

                    pkg1.version = "1.0.0";

                    packages.push(pkg1);

                    // create bower.json content
                    runs(function () {
                        var promise = bowerJson.create(packages);
                        waitsForDone(promise, "bower.json file created", 3000);
                    });

                    runs(function () {
                        var deferred = new $.Deferred();
                        bowerJson.read().then(function (res) {
                            content = JSON.parse(res);
                            deferred.resolve();
                        }).fail(function (err) {
                            deferred.reject(err);
                        });

                        waitsForDone(deferred.promise(), "read content");
                    });

                    // check
                    runs(function () {
                        expect(content).not.toBeNull();
                        expect(content).toBeDefined();

                        expect(content.name).toBe("test-app");
                        expect(content.dependencies).toBeDefined();
                        expect(content.devDependencies).not.toBeDefined();
                        expect(Object.keys(content.dependencies).length).toBe(1);

                        expect(content.dependencies[pkg1.name]).toBe(pkg1.version);
                    });

                    // update package version in bower.json
                    runs(function () {
                        var promise = bowerJson.updatePackageVersion(pkg1.name, newVersion);
                        waitsForDone(promise, "package version updated in bower.json");
                    });

                    runs(function () {
                        var deferred = new $.Deferred();
                        bowerJson.read().then(function (res) {
                            content = JSON.parse(res);
                            deferred.resolve();
                        }).fail(function (err) {
                            deferred.reject(err);
                        });

                        waitsForDone(deferred.promise(), "read content");
                    });

                    // check
                    runs(function () {
                        expect(content).not.toBeNull();
                        expect(content).toBeDefined();

                        expect(content.name).toBe("test-app");
                        expect(content.dependencies).toBeDefined();
                        expect(content.devDependencies).not.toBeDefined();
                        expect(Object.keys(content.dependencies).length).toBe(1);

                        expect(content.dependencies[pkg1.name]).toBe(newVersion);
                    });
                });

                it("should update the version for a devDependency when it exists", function () {
                    var bowerJson = new BowerJson(tempDir + "/", "test-app"), // TODO check this
                        pkg1 = new Package("dep1"),
                        newVersion = "2.0.0",
                        packages = [],
                        content;

                    pkg1.version = "1.0.0";
                    pkg1.isDevDependency = true;

                    packages.push(pkg1);

                    // create bower.json content
                    runs(function () {
                        var promise = bowerJson.create(packages);
                        waitsForDone(promise, "bower.json file created", 3000);
                    });

                    runs(function () {
                        var deferred = new $.Deferred();
                        bowerJson.read().then(function (res) {
                            content = JSON.parse(res);
                            deferred.resolve();
                        }).fail(function (err) {
                            deferred.reject(err);
                        });

                        waitsForDone(deferred.promise(), "read content");
                    });

                    // check
                    runs(function () {
                        expect(content).not.toBeNull();
                        expect(content).toBeDefined();

                        expect(content.name).toBe("test-app");
                        expect(content.dependencies).toBeDefined();
                        expect(content.devDependencies).toBeDefined();
                        expect(Object.keys(content.devDependencies).length).toBe(1);

                        expect(content.devDependencies[pkg1.name]).toBe(pkg1.version);
                    });

                    // update package version in bower.json
                    runs(function () {
                        var promise = bowerJson.updatePackageVersion(pkg1.name, newVersion);
                        waitsForDone(promise, "package version updated in bower.json");
                    });

                    runs(function () {
                        var deferred = new $.Deferred();
                        bowerJson.read().then(function (res) {
                            content = JSON.parse(res);
                            deferred.resolve();
                        }).fail(function (err) {
                            deferred.reject(err);
                        });

                        waitsForDone(deferred.promise(), "read content");
                    });

                    // check
                    runs(function () {
                        expect(content).not.toBeNull();
                        expect(content).toBeDefined();

                        expect(content.name).toBe("test-app");
                        expect(content.dependencies).toBeDefined();
                        expect(content.devDependencies).toBeDefined();
                        expect(Object.keys(content.devDependencies).length).toBe(1);

                        expect(content.devDependencies[pkg1.name]).toBe(newVersion);
                    });
                });

                it("should not update the version for a dependency when it doesn't exists", function () {
                    var bowerJson = new BowerJson(tempDir + "/", "test-app"), // TODO check this
                        pkg1 = new Package("dep1"),
                        nonDepName = "nonDep",
                        nonDepVersion = "2.0.0",
                        packages = [],
                        content;

                    pkg1.version = "1.0.0";

                    packages.push(pkg1);

                    // create bower.json content
                    runs(function () {
                        var promise = bowerJson.create(packages);
                        waitsForDone(promise, "bower.json file created", 3000);
                    });

                    runs(function () {
                        var deferred = new $.Deferred();
                        bowerJson.read().then(function (res) {
                            content = JSON.parse(res);
                            deferred.resolve();
                        }).fail(function (err) {
                            deferred.reject(err);
                        });

                        waitsForDone(deferred.promise(), "read content");
                    });

                    // check
                    runs(function () {
                        expect(content).not.toBeNull();
                        expect(content).toBeDefined();

                        expect(content.name).toBe("test-app");
                        expect(content.dependencies).toBeDefined();
                        expect(content.devDependencies).not.toBeDefined();
                        expect(Object.keys(content.dependencies).length).toBe(1);

                        expect(content.dependencies[pkg1.name]).toBe(pkg1.version);
                    });

                    // update package version in bower.json
                    runs(function () {
                        var promise = bowerJson.updatePackageVersion(nonDepName, nonDepVersion);
                        waitsForFail(promise, "package version not updated in bower.json");
                    });

                    runs(function () {
                        var deferred = new $.Deferred();
                        bowerJson.read().then(function (res) {
                            content = JSON.parse(res);
                            deferred.resolve();
                        }).fail(function (err) {
                            deferred.reject(err);
                        });

                        waitsForDone(deferred.promise(), "read content");
                    });

                    // check
                    runs(function () {
                        expect(content).not.toBeNull();
                        expect(content).toBeDefined();

                        expect(content.name).toBe("test-app");
                        expect(content.dependencies).toBeDefined();
                        expect(content.devDependencies).not.toBeDefined();
                        expect(Object.keys(content.dependencies).length).toBe(1);

                        expect(content.dependencies[pkg1.name]).toBe(pkg1.version);
                        expect(content.dependencies[pkg1.name]).not.toBe(nonDepVersion);
                    });
                });

                it("should update the version for a devDependency it exists", function () {
                    var bowerJson = new BowerJson(tempDir + "/", "test-app"), // TODO check this
                        pkg1 = new Package("dep1"),
                        nonDepName = "nonDep",
                        nonDepVersion = "2.0.0",
                        packages = [],
                        content;

                    pkg1.version = "1.0.0";
                    pkg1.isDevDependency = true;

                    packages.push(pkg1);

                    // create bower.json content
                    runs(function () {
                        var promise = bowerJson.create(packages);
                        waitsForDone(promise, "bower.json file created", 3000);
                    });

                    runs(function () {
                        var deferred = new $.Deferred();
                        bowerJson.read().then(function (res) {
                            content = JSON.parse(res);
                            deferred.resolve();
                        }).fail(function (err) {
                            deferred.reject(err);
                        });

                        waitsForDone(deferred.promise(), "read content");
                    });

                    // check
                    runs(function () {
                        expect(content).not.toBeNull();
                        expect(content).toBeDefined();

                        expect(content.name).toBe("test-app");
                        expect(content.dependencies).toBeDefined();
                        expect(content.devDependencies).toBeDefined();
                        expect(Object.keys(content.devDependencies).length).toBe(1);

                        expect(content.devDependencies[pkg1.name]).toBe(pkg1.version);
                    });

                    // update package version in bower.json
                    runs(function () {
                        var promise = bowerJson.updatePackageVersion(nonDepName, nonDepVersion);
                        waitsForFail(promise, "package version not updated in bower.json");
                    });

                    runs(function () {
                        var deferred = new $.Deferred();
                        bowerJson.read().then(function (res) {
                            content = JSON.parse(res);
                            deferred.resolve();
                        }).fail(function (err) {
                            deferred.reject(err);
                        });

                        waitsForDone(deferred.promise(), "read content");
                    });

                    // check
                    runs(function () {
                        expect(content).not.toBeNull();
                        expect(content).toBeDefined();

                        expect(content.name).toBe("test-app");
                        expect(content.dependencies).toBeDefined();
                        expect(content.devDependencies).toBeDefined();
                        expect(Object.keys(content.devDependencies).length).toBe(1);

                        expect(content.devDependencies[pkg1.name]).toBe(pkg1.version);
                        expect(content.devDependencies[pkg1.name]).not.toBe(nonDepVersion);
                    });
                });
            });

            describe("BowerRc", function () {
                var BowerRc = require("src/bower/metadata/BowerRc");

                it("should create a BowerJson object with default content", function () {
                    var bowerRc = new BowerRc(tempDir + "/", "test-app"), // TODO check this
                        content;

                    runs(function () {
                        var promise = bowerRc.create();

                        waitsForDone(promise, ".bowerrc file created", 3000);
                    });

                    runs(function () {
                        var deferred = new $.Deferred();

                        bowerRc.read().then(function (res) {
                            content = JSON.parse(res);
                            deferred.resolve();
                        }).fail(function (err) {
                            deferred.reject(err);
                        });

                        waitsForDone(deferred.promise(), "read content");
                    });

                    runs(function () {
                        expect(bowerRc.AbsolutePath).not.toBeNull();
                        expect(bowerRc.AbsolutePath).toBeDefined();
                        expect(bowerRc.ProjectPath).not.toBeNull();
                        expect(bowerRc.ProjectPath).toBeDefined();

                        expect(content).not.toBeNull();
                        expect(content).toBeDefined();

                        expect(content.directory).toBeDefined();
                        expect(content.directory).toBe("bower_components/");
                    });
                });
            });
        });

        // test for the underlying node domain

        describe("Bower Domain Integration", function () {
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
                    var bowerDomainPath = ExtensionUtils.getModulePath(module, "/node/BowerDomain");

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

            it("should return a list of package names", function () {
                var packages,
                    emptyConfig = {},
                    i;

                runs(function () {
                    bowerDomain.exec("search", emptyConfig)
                        .done(function (data) {
                            packages = data;
                        });
                });

                waitsFor(function () {
                    return packages;
                }, "waiting for bower package list", 100000);

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
                    var config = {
                            cwd: tempDir
                        },
                        options = {
                            save: false
                        };

                    waitsForDone(bowerDomain.exec("install", ["jquery"], options, config),
                        "installing jquery", 100000);
                });

                runs(function () {
                    var file = FileSystem.getFileForPath(tempDir + "/bower_components/jquery/dist/jquery.min.js");

                    waitsForDone(FileUtils.readAsText(file), "reading installed jquery");
                });
            });
        });
    });
});
