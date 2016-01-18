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
maxerr: 50, node: true */
/*global require */

(function () {
    "use strict";

    var exec = require("child_process").exec;

    /**
     * Run a program in a process child using exec function.
     * @param {cmd} The full path to the program.
     * @param {argsArray} args The arguments for the program to execute.
     * @param {callback} callback Callback for when the program has executed.
     */
    function execCommand(cmd, argsArray, callback) {
        var command = cmd + " " + argsArray.join(" "),
            result = {
                cmd: cmd
            };

        function onExecDone(error, stdout, stderr) {
            if (error) {
                result.error = error;

                callback(result, null);
            } else {
                result.output = stdout.trim();

                callback(null, result);
            }
        }

        exec(command, onExecDone);
    }

    exports.execCommand = execCommand;
}());
