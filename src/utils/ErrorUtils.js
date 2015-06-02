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

    var NO_BOWER_JSON             = 0,
        PKG_NOT_INSTALLED         = 1,
        SRC_NOT_FOUND             = 2,
        SRC_RESOLVER_NOT_FOUND    = 3,
        CANT_FOUND_TARGET         = 4,
        GIT_NOT_INSTALLED         = 5,
        SVN_NOT_INSTALLED         = 6,
        CMD_EXE                   = 7,
        CONFLICT                  = 8,
        HTTP_DOWNLOAD_FAIL        = 9,
        DOWNLOAD_INCOMPLETE       = 10,
        UNKNOWN_ERROR             = 11,
        NO_PROJECT                = 12,
        EMALFORMED                = 13,
        EUPDATE_NO_DATA           = 14,
        EUPDATE_NO_PKG_UPDATED    = 15,
        EINSTALL_NO_PKG_INSTALLED = 16,
        EINSTALL_NO_PKG           = 17,
        ESYNC_NOTHING_TO_SYNC     = 18;

    /**
     * @param {number} code
     * @param {string=} message
     * @param {object=} originalError
     */
    function createError(code, message, originalError) {
        var error = new Error();

        error.code = code;
        error.message = message || null;
        error.originalError = originalError || null;

        return error;
    }

    exports.createError            = createError;
    exports.NO_BOWER_JSON          = NO_BOWER_JSON;
    exports.PKG_NOT_INSTALLED      = PKG_NOT_INSTALLED;
    exports.SRC_NOT_FOUND          = SRC_NOT_FOUND;
    exports.SRC_RESOLVER_NOT_FOUND = SRC_RESOLVER_NOT_FOUND;
    exports.CANT_FOUND_TARGET      = CANT_FOUND_TARGET;
    exports.GIT_NOT_INSTALLED      = GIT_NOT_INSTALLED;
    exports.SVN_NOT_INSTALLED      = SVN_NOT_INSTALLED;
    exports.CMD_EXE                = CMD_EXE;
    exports.CONFLICT               = CONFLICT;
    exports.HTTP_DOWNLOAD_FAIL     = HTTP_DOWNLOAD_FAIL;
    exports.DOWNLOAD_INCOMPLETE    = DOWNLOAD_INCOMPLETE;
    exports.UNKNOWN_ERROR          = UNKNOWN_ERROR;
    exports.NO_PROJECT             = NO_PROJECT;
    exports.EMALFORMED             = EMALFORMED;
    exports.EUPDATE_NO_DATA        = EUPDATE_NO_DATA;
    exports.EUPDATE_NO_PKG_UPDATED = EUPDATE_NO_PKG_UPDATED;
    exports.EINSTALL_NO_PKG_INSTALLED = EINSTALL_NO_PKG_INSTALLED;
    exports.EINSTALL_NO_PKG        = EINSTALL_NO_PKG;
    exports.ESYNC_NOTHING_TO_SYNC  = ESYNC_NOTHING_TO_SYNC;
});
