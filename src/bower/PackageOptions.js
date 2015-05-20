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
/*global define */

define(function (require, exports, module) {
    "use strict";

    var DependencyType = {
        DEVELOPMENT: 0,
        PRODUCTION: 1
    };

    var VersionOptions = {
        TILDE: 0,
        CARET: 1,
        FIXED: 2
    };

    var Status = {
        INSTALLED: 0,
        MISSING: 1,
        NOT_TRACKED: 2
    };

    /**
     * @param {number} type
     * @return {boolean}
     */
    function isValidDependencyType(type) {
        return (type === DependencyType.DEVELOPMENT || type === DependencyType.PRODUCTION);
    }

    /**
     * @param {number} type
     * @return {boolean}
     */
    function isValidVersion(version) {
        return (version === VersionOptions.TILDE || version === VersionOptions.CARET ||
                version === VersionOptions.FIXED);
    }

    /**
     * @param {number} type
     * @return {boolean}
     */
    function isValidStatus(status) {
        return (status === Status.INSTALLED || status === Status.MISSING ||
                status === Status.NOT_TRACKED);
    }

    exports.DependencyType        = DependencyType;
    exports.VersionOptions        = VersionOptions;
    exports.Status                = Status;
    exports.isValidDependencyType = isValidDependencyType;
    exports.isValidVersion        = isValidVersion;
    exports.isValidStatus         = isValidStatus;
});
