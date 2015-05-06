/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, describe, it, expect, beforeEach, afterEach,  waitsFor, runs, jasmine, brackets */

define(function (require, exports, module) {
    "use strict";

    var SpecRunnerUtils = brackets.getModule("spec/SpecRunnerUtils");

    describe("BracketsBower - Status Bar", function () {

        describe("Bower Status Bar Controller", function () {
            var StatusBarController = require("src/StatusBarController")._StatusBarController,
                Status = require("src/StatusBarController")._Status,
                statusBarController,
                StatusTypes,
                mockView;

            beforeEach(function () {
                mockView = jasmine.createSpyObj("mockView", [
                    "initialize",
                    "onStatusAdded",
                    "onStatusUpdated",
                    "onStatusRemoved"
                ]);

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
    });
});
