
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
/*global define, brackets */

define(function (require, exports) {
    "use strict";

    var StringUtils    = brackets.getModule("utils/StringUtils"),
        ErrorUtils     = require("src/utils/ErrorUtils"),
        PackageFactory = require("src/project/PackageFactory"),
        Strings        = require("strings");

    /**
     * @param {object} wrappedError
     * @return {Error}
     * @private
     */
    function getError(wrappedError) {
        var originalError = wrappedError.error,
            originalCode = (originalError) ? originalError.code : "UNKNOWN_ERROR_CODE",
            options = {
                originalError: originalError
            },
            code,
            message,
            extra;

        switch (originalCode) {
        case "ENOENT":
            code = ErrorUtils.NO_BOWER_JSON;
            message = Strings.ERROR_NO_BOWER_JSON;
            break;
        case "ENOTINS":
            code = ErrorUtils.PKG_NOT_INSTALLED;
            message = Strings.ERROR_MSG_NO_PACKAGE_INSTALLED;
            break;
        case "ECONFLICT":
            code = ErrorUtils.CONFLICT;

            if (originalError.name) {
                message = StringUtils.format(Strings.ERROR_MSG_DEPENDENCY_CONFLICT, originalError.name);
            }

            if (originalError.picks) {
                extra = {
                    pickPackages: PackageFactory.getPackages(originalError.picks)
                };
            }
            break;
        case "ENORESOLVER":
            code = ErrorUtils.SRC_RESOLVER_NOT_FOUND;
            message = Strings.ERROR_MSG_NO_RESOLVER;
            break;
        case "ENOTFOUND":
            code = ErrorUtils.SRC_NOT_FOUND;
            message = Strings.ERROR_MSG_NO_SOURCE;
            break;
        case "ENORESTARGET":
            code = ErrorUtils.CANT_FOUND_TARGET;
            message = Strings.ERROR_MSG_NO_TARGET;
            break;
        case "ECMDERR":
            code = ErrorUtils.CMD_EXE;
            break;
        case "ENOGIT":
            code = ErrorUtils.GIT_NOT_INSTALLED;
            break;
        case "ENOSVN":
            code = ErrorUtils.SVN_NOT_FOUND;
            break;
        case "EHTTP":
            code = ErrorUtils.HTTP_DOWNLOAD_FAIL;
            break;
        case "EINCOMPLETE":
            code = ErrorUtils.DONWLOAD_INCOMPLETE;
            message = Strings.ERROR_MSG_DOWNLOAD_INCOMPLETE;
            break;
        case "EMALFORMED":
            if (originalError.file) {
                if (originalError.file.match("bower.json")) {
                    code = ErrorUtils.EMALFORMED_BOWER_JSON;
                    message = Strings.ERROR_MSG_MALFORMED_BOWER_JSON;
                } else {
                    code = ErrorUtils.EMALFORMED_BOWERRC;
                }
            } else {
                code = ErrorUtils.EMALFORMED;
                message = Strings.ERROR_MSG_MALFORMED_FILE;
            }
            break;
        case "ECONRESET":
            code = ErrorUtils.ECONNECTION_RESET;
            message = Strings.ERROR_MSG_CONNECTION_PROBLEM;
            break;
        default:
            code = ErrorUtils.UNKNOWN_ERROR;
            message = Strings.ERROR_DEFAULT_MSG;
        }

        if (originalError) {
            options.originalMessage = originalError.message;
        }

        if (message) {
            options.message = message;
        }

        if (extra) {
            options.extra = extra;
        }

        return ErrorUtils.createError(code, options);
    }

    exports.getError = getError;
});
