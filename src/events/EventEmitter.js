/*
 * Copyright (c) 2014 Narciso Jaramillo. All rights reserved.
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


/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4,
maxerr: 50, browser: true */
/*global $, define, brackets */

define(function (require, exports) {
    "use strict";

    var handlersForEvents = {};

    function _validateHandler(handler) {
        if (typeof (handler) !== "function") {
            throw "The event handler " + handler + "is not a Function.";
        }
    }

    function _validateEvent(event) {
        if (typeof (event) !== "string") {
            throw "The event " + event + "is not a String.";
        }

        if (event && event.trim() === "") {
            throw "The event cannot be an empty String.";
        }
    }

    function on(event, handler) {
        _validateEvent(event);
        _validateHandler(handler);

        var handlers = handlersForEvents[event];

        if (handlers === undefined) {
            handlers = [];
            handlersForEvents[event] = handlers;
        }

        handlers.push(handler);
    }

    function off(event, handler) {
        _validateEvent(event);

        var handlers = handlersForEvents[event],
            index;

        if (handlers === undefined) {
            return;
        }

        index = handlers.indexOf(handler);

        if (index !== -1) {
            handlers.slice(index);
        }
    }

    function trigger(event) {
        _validateEvent(event);

        var handlers = handlersForEvents[event],
            handler,
            args,
            size,
            i;

        if(handlers === undefined) {
            return;
        }

        args = Array.prototype.slice.call(arguments, 0);
        size = handlers.length;

        for(i = 0; i < size; i++) {
            handler = handlers[i];

            if(handler) {
                handler.apply(handler, args);
            }
        }
    }

    exports.on = on;
    exports.off = off;
    exports.trigger = trigger;
});
