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
/*global define */

define(function (require, exports, module) {
    "use strict";

    var NotificationDialog = require("src/dialogs/NotificationDialog"),
        Strings            = require("strings");

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
        EMALFORMED_BOWER_JSON     = 13,
        EMALFORMED_BOWERRC        = 14,
        EMALFORMED                = 15,
        EUPDATE_NO_DATA           = 16,
        EUPDATE_NO_PKG_UPDATED    = 17,
        EINSTALL_NO_PKG_INSTALLED = 18,
        EINSTALL_NO_PKG           = 19,
        ESYNC_NOTHING_TO_SYNC     = 20,
        ECONNECTION_RESET         = 21,
        EFILESYSTEM_ACTION        = 22;

    /**
     * @param {number} code
     * @param {object} options
     */
    function createError(code, options) {
        var error = new Error();

        if (!options) {
            options = {};
        }

        error.code = code;
        error.message = options.message || null;
        error.originalMessage = options.originalMessage || null;
        error.originalError = options.originalError || null;

        return error;
    }

    /**
     * Check error code to display a proper error description.
     * @param {object} error
     */
    function handleError(error) {
        var options = {
            summary: error.message || Strings.SUMMARY_ERROR
        };

        if (error.originalMessage) {
            options.highlight = error.originalMessage;
        }

        NotificationDialog.showError(options);
    }

    exports.createError            = createError;
    exports.handleError            = handleError;
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
    exports.EMALFORMED_BOWER_JSON  = EMALFORMED_BOWER_JSON;
    exports.EMALFORMED_BOWERRC     = EMALFORMED_BOWERRC;
    exports.EMALFORMED             = EMALFORMED;
    exports.EUPDATE_NO_DATA        = EUPDATE_NO_DATA;
    exports.EUPDATE_NO_PKG_UPDATED = EUPDATE_NO_PKG_UPDATED;
    exports.EINSTALL_NO_PKG_INSTALLED = EINSTALL_NO_PKG_INSTALLED;
    exports.EINSTALL_NO_PKG        = EINSTALL_NO_PKG;
    exports.ESYNC_NOTHING_TO_SYNC  = ESYNC_NOTHING_TO_SYNC;
    exports.ECONNECTION_RESET      = ECONNECTION_RESET;
    exports.EFILESYSTEM_ACTION     = EFILESYSTEM_ACTION;
});
