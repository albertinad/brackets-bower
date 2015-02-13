/*
 * Copyright (c) 2013 - 2015 Narciso Jaramillo. All rights reserved.
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

define(function (require, exports, module) {
    "use strict";

    var AppInit         = brackets.getModule("utils/AppInit"),
        CodeHintManager = brackets.getModule("editor/CodeHintManager");

    /**
     * Bower code hints constructor function. Code hints for packages names
     * when a bower.json file is being edited.
     * @constructor
     */
    function BowerCodeHints() {
        /** @private */
        this._depsStartWord = "dependencies";
        /** @private */
        this._depsDevStartWord = "devDependencies";

        /** @private */
        this._regexDeps = null;
        /** @private */
        this._regexDevDeps = null;

        /** @private */
        this._editor = null;
    }

    BowerCodeHints.FILES = ["bower.json"];

    BowerCodeHints.prototype.hasHints = function (editor, implicitChar) {

    };

    BowerCodeHints.prototype.getHints = function (implicitChar) {

    };

    BowerCodeHints.prototype.insertHint = function (hint) {

    };

    AppInit.appReady(function () {
        var hints = new BowerCodeHints();

        CodeHintManager.registerHintProvider(hints, files, 0);
    });
});
