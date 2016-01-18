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
/*global define, describe, it, expect, beforeEach, afterEach, waitsForDone, waitsForFail,
runs, $, waitsFor */

define(function (require, exports, module) {
    "use strict";

    describe("BracketsBower - CommandsTask", function () {
        var CommandsTask = require("src/bower/CommandsTask"),
            defaultTimeout = 10000,
            commandsTask;

        beforeEach(function () {
            commandsTask = new CommandsTask();
        });

        afterEach(function () {
            commandsTask = null;
        });

        it("should execute a single successful task without arguments", function () {
            var resultPromise,
                data;

            function someTask() {
                var deferred = new $.Deferred();

                window.setTimeout(function () {
                    deferred.resolve("some value");
                }, 1000);

                return deferred.promise();
            }

            runs(function () {
                resultPromise = commandsTask.addTask(someTask, null, null);
                resultPromise.then(function (result) {
                    data = result;
                });

                waitsForDone(resultPromise, "command task executed successfuly");
            });

            runs(function () {
                expect(data).not.toBeNull();
                expect(data).toBeDefined();
                expect(typeof data).toBe("string");

                expect(commandsTask._count()).toEqual(0);
                expect(resultPromise.state()).toEqual("resolved");
            });
        });

        it("should execute a single failure task without arguments", function () {
            var resultPromise,
                data;

            function someTask() {
                var deferred = new $.Deferred();

                window.setTimeout(function () {
                    deferred.reject("some value");
                }, 1000);

                return deferred.promise();
            }

            runs(function () {
                resultPromise = commandsTask.addTask(someTask, null, null);
                resultPromise.fail(function (result) {
                    data = result;
                });

                waitsForFail(resultPromise, "command task executed not successfuly");
            });

            runs(function () {
                expect(data).not.toBeNull();
                expect(data).toBeDefined();
                expect(typeof data).toBe("string");

                expect(commandsTask._count()).toEqual(0);
                expect(resultPromise.state()).toEqual("rejected");
            });
        });

        it("should execute more than 1 task", function () {
            var resultPromise1,
                resultPromise2,
                resultPromise3,
                state = 0;

            function task1() {
                var deferred = new $.Deferred();

                window.setTimeout(function () {
                    deferred.resolve("task1");
                }, 100);

                return deferred.promise();
            }

            function task2() {
                var deferred = new $.Deferred();

                window.setTimeout(function () {
                    deferred.resolve(3);
                }, 150);

                return deferred.promise();
            }

            function task3() {
                var deferred = new $.Deferred();

                window.setTimeout(function () {
                    deferred.resolve(true);
                }, 500);

                return deferred.promise();
            }

            runs(function () {
                resultPromise1 = commandsTask.addTask(task1, null, null);
                resultPromise2 = commandsTask.addTask(task2, null, null);
                resultPromise3 = commandsTask.addTask(task3, null, null);

                resultPromise1.then(function (result) {
                    expect(commandsTask._count()).toBeGreaterThan(0);

                    expect(result).not.toBeNull();
                    expect(result).toBeDefined();
                    expect(result).toBe("task1");

                    expect(state).toBe(0);
                    // 1st task resolved
                    state = 1;
                });

                resultPromise2.then(function (result) {
                    expect(commandsTask._count()).toBeGreaterThan(0);

                    expect(result).not.toBeNull();
                    expect(result).toBeDefined();
                    expect(typeof result).toBe("number");
                    expect(result).toBe(3);

                    expect(state).toBe(1);
                    // 2nd task resolved
                    state = 2;
                });

                resultPromise3.then(function (result) {
                    expect(commandsTask._count()).toEqual(0);

                    expect(result).not.toBeNull();
                    expect(result).toBeDefined();
                    expect(typeof result).toBe("boolean");
                    expect(result).toBe(true);

                    expect(state).toBe(2);
                    // 3rd task resolved
                    state = 3;
                });

                waitsFor(function () {
                    return (commandsTask._count() === 0 && state === 3);
                }, "Commands task executed", defaultTimeout);
            });
        });

        it("should execute more than 1 task, successful and failure mixed", function () {
            var resultPromise1,
                resultPromise2,
                resultPromise3,
                state = 0;

            function task1() {
                var deferred = new $.Deferred();

                window.setTimeout(function () {
                    deferred.reject("task1");
                }, 500);

                return deferred.promise();
            }

            function task2() {
                var deferred = new $.Deferred();

                window.setTimeout(function () {
                    deferred.resolve(3);
                }, 3000);

                return deferred.promise();
            }

            function task3() {
                var deferred = new $.Deferred();

                window.setTimeout(function () {
                    deferred.resolve(true);
                }, 100);

                return deferred.promise();
            }

            runs(function () {
                resultPromise1 = commandsTask.addTask(task1, null, null);
                resultPromise2 = commandsTask.addTask(task2, null, null);
                resultPromise3 = commandsTask.addTask(task3, null, null);

                resultPromise1.fail(function (result) {
                    expect(commandsTask._count()).toBeGreaterThan(0);

                    expect(result).not.toBeNull();
                    expect(result).toBeDefined();
                    expect(result).toBe("task1");

                    expect(state).toBe(0);
                    // 1st task resolved
                    state = 1;
                });

                resultPromise2.then(function (result) {
                    expect(commandsTask._count()).toBeGreaterThan(0);

                    expect(result).not.toBeNull();
                    expect(result).toBeDefined();
                    expect(typeof result).toBe("number");
                    expect(result).toBe(3);

                    expect(state).toBe(1);
                    // 2nd task resolved
                    state = 2;
                });

                resultPromise3.then(function (result) {
                    expect(commandsTask._count()).toEqual(0);

                    expect(result).not.toBeNull();
                    expect(result).toBeDefined();
                    expect(typeof result).toBe("boolean");
                    expect(result).toBe(true);

                    expect(state).toBe(2);
                    // 3rd task resolved
                    state = 3;
                });

                waitsFor(function () {
                    return (commandsTask._count() === 0 && state === 3);
                }, "Commands task executed", defaultTimeout);
            });
        });
    });
});
