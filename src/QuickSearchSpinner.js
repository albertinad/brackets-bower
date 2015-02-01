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
maxerr: 50, browser: true */
/*global $, define */

define(function (require, exports) {
    "use strict";

    /**
     * @constructor
     */
    function QuickSearchSpinner() {
        /** @private **/
        this._templateHtml = "<div class='spinner spin'></div>";
        /** @private **/
        this._$spinner = null;
    }

    QuickSearchSpinner.prototype.show = function () {
        // Bit of a hack that we know the actual element here.
        var $quickOpenInput = $("#quickOpenSearch"),
            $parent = $quickOpenInput.parent(),
            $label = $parent.find("span.find-dialog-label"),
            inputOffset = $quickOpenInput.offset(),
            inputWidth = $quickOpenInput.outerWidth(),
            inputHeight = $quickOpenInput.outerHeight(),
            parentOffset = $parent.offset(),
            parentWidth = $parent.outerWidth(),
            parentPosition = $parent.position(),

            // This calculation is a little nasty because the parent modal bar isn't actually position: relative,
            // so we both have to account for the input's offset within the modal bar as well as the modal bar's
            // position within its offset parent.
            spinnerTop = parentPosition.top + inputOffset.top - parentOffset.top + (inputHeight / 2) - 7,

            // Hack: for now we don't deal with the modal bar's offset parent for the horizontal calculation since we
            // happen to know it's the full width.
            spinnerRight = (parentOffset.left + parentWidth) - (inputOffset.left + inputWidth) + 14;

        if ($label) {
            $label.css({
                right: "40px"
            });
        }

        this._$spinner = $(this._templateHtml);

        this._$spinner.css({
            position: "absolute",
            top: spinnerTop + "px",
            right: spinnerRight + "px"
        });

        this._$spinner.appendTo($parent);
    };

    QuickSearchSpinner.prototype.hide = function () {
        if (this._$spinner) {
            this._$spinner.remove();
        }
    };

    function create () {
        return new QuickSearchSpinner();
    }

    exports.create = create;
});
