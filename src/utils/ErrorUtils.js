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

    var NO_BOWER_JSON            = 0,
        PKG_NOT_INSTALLED        = 1,
        SRC_NOT_FOUND            = 2,
        SRC_RESOLVER_NOT_FOUND   = 3,
        CANT_FOUND_TARGET        = 4,
        SRC_NOT_VALID_GITHUB_URL = 5,
        GIT_NOT_INSTALLED        = 6,
        SVN_NOT_INSTALLED        = 7,
        CMD_EXE                  = 8,
        INTERACTIVE_DISABLED     = 9,
        HTTP_DOWNLOAD_FAIL       = 10,
        DOWNLOAD_INCOMPLETE      = 11,
        UNKNOWN_ERROR            = 12;

    /**
     * @param {number}
     * @param {Error=} originalError
     */
    function createError(code, originalError) {
        var error = new Error();

        error.code = code;

        if (originalError) {
            error.originalError = originalError;
        }

        return error;
    }

    exports.createError              = createError;
    exports.NO_BOWER_JSON            = NO_BOWER_JSON;
    exports.PKG_NOT_INSTALLED        = PKG_NOT_INSTALLED;
    exports.SRC_NOT_FOUND            = SRC_NOT_FOUND;
    exports.SRC_RESOLVER_NOT_FOUND   = SRC_RESOLVER_NOT_FOUND;
    exports.CANT_FOUND_TARGET        = CANT_FOUND_TARGET;
    exports.SRC_NOT_VALID_GITHUB_URL = SRC_NOT_VALID_GITHUB_URL;
    exports.GIT_NOT_INSTALLED        = GIT_NOT_INSTALLED;
    exports.SVN_NOT_INSTALLED        = SVN_NOT_INSTALLED;
    exports.CMD_EXE                  = CMD_EXE;
    exports.INTERACTIVE_DISABLED     = INTERACTIVE_DISABLED;
    exports.HTTP_DOWNLOAD_FAIL       = HTTP_DOWNLOAD_FAIL;
    exports.DOWNLOAD_INCOMPLETE      = DOWNLOAD_INCOMPLETE;
    exports.UNKNOWN_ERROR            = UNKNOWN_ERROR;
});
