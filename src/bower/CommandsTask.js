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

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4,
maxerr: 50, browser: true */
/*global $, define */

define(function (require, exports, module) {
    "use strict";

    /**
     * Command Task constructor function. Creates an object that represents
     * a task to execute, with arguments and context.
     * @param {Function} fn Function to execute. It must return a promise.
     * @param {Array|null} args
     * @param {Object|null} context
     * @constructor
     */
    function Task(fn, args, context) {
        /** @private */
        this._fn = fn;
        /** @private */
        this._args = args;
        /** @private */
        this._context = context || null;

        /** @private */
        this._deferred = new $.Deferred();
        /** @private */
        this._promise = this._deferred.promise();
    }

    Object.defineProperty(Task.prototype, "fn", {
        get: function () {
            return this._fn;
        }
    });

    Object.defineProperty(Task.prototype, "args", {
        get: function () {
            return this._args;
        }
    });

    /**
     * Executes the task function, returns a promise as a result.
     * @return {$.Promise}
     */
    Task.prototype.execute = function () {
        this._fn.apply(this._context, this._args).then(function (result) {
            this._deferred.resolve(result);
        }.bind(this)).fail(function (error) {
            this._deferred.reject(error);
        }.bind(this));

        return this._promise;
    };

    /**
     * @return {$.Promise}
     */
    Task.prototype.promise = function () {
        return this._promise;
    };

    /**
     * Commands task manager constructor function. Keep and manages a tasks
     * queue by executing only one at a time.
     * @constructor
     */
    function CommandsTask() {
        /** @private */
        this._tasksQueue = [];
        /** @private */
        this._currentTask = null;
    }

    /**
     * @param {Function} fn
     * @param {Array} args
     * @param {Object} context
     */
    CommandsTask.prototype.addTask = function (fn, args, context) {
        var task = new Task(fn, args, context);

        this._tasksQueue.push(task);

        this._executeNext();

        return task.promise();
    };

    /**
     * Executes the next task if any.
     */
    CommandsTask.prototype._executeNext = function () {
        if (this._currentTask || this._tasksQueue.length === 0) {
            // a task is being executed or tasksQueue empty
            return;
        }

        this._currentTask = this._tasksQueue.shift();
        this._currentTask.execute().always(function () {
            this._currentTask = null;

            this._executeNext();
        }.bind(this));
    };

    CommandsTask.prototype._count = function () {
        return this._tasksQueue.length;
    };

    module.exports = CommandsTask;
});
