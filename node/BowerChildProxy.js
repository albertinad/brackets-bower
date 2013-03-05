/*
 * Copyright (c) 2013 Narciso Jaramillo. All rights reserved.
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
maxerr: 50, node: true */
/*global */

(function () {
    "use strict";
    
    var bower = require("bower"),
        log4js = require("log4js");
    
    log4js.loadAppender("file");
    log4js.addAppender(log4js.appenders.file("/tmp/BowerChildProxy.log"), "logfile");
    var log = log4js.getLogger("logfile");
    
    log.debug("Started child.");
    
    function makeHandler(event) {
        return function () {
            var argStr;
            try {
                argStr = JSON.stringify(arguments);
            } catch (err) {
                // Must contain a circular reference. Just continue.
            }
            log.debug("Sending: " + event + " - " + argStr);
            process.send({
                event: event,
                args: argStr ? Array.prototype.slice.call(arguments, 0) : []
            });
        };
    }
    
    process.once("message", function (msg) {
        log.debug("Command: " + JSON.stringify(msg));
        
        var cmd = bower.commands[msg.command],
            emitter = cmd.apply(cmd, msg.args);
        ["data", "result", "error", "packages", "package"].forEach(function (event) {
            emitter.on.call(emitter, event, makeHandler(event));
        });
        emitter.on("end", function () {
            makeHandler("end").apply(null, arguments);
            process.disconnect();
        });
    });
    process.once("disconnect", function () {
        process.exit();
    });
}());
