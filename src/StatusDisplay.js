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
/*global $, define, brackets */

define(function (require, exports) {
    "use strict";

    var AppInit = brackets.getModule("utils/AppInit");

    var $sectionProjectFiles,
        $sectionStatusInfo,
        insertType = {
            AFTER: 0,
            APPEND: 1
        };

    /**
     * @constructor
     */
    function StatusDisplay() {
        this._$fetchSpinner = null;
        this._$statusProject = null;
        this._$statusInfo = null;

        this._templateShowInProject = null;
        this._templateShowInStatus = null;
    }

    StatusDisplay.prototype.initialize = function () {
        this._templateShowInProject = [
            "<div class='bower-install-status hidden'>",
            "<div class='inner'>",
            "<span class='text'>",
            "</span><div class='spinner'></div>",
            "</div></div>"
        ].join("");

        this._templateShowInStatus = [
            "<div class='bower-loading-status'>",
            "<span class='text'></span>",
            "<span class='spinner'></span>",
            "</div>"
        ].join("");

        this._templateSpinner = "<div class='spinner spin'></div>";
    };

    StatusDisplay.prototype.showInProject = function (text, busy) {
        if(this._$statusProject === null || this._$statusProject === undefined) {
            this._$statusProject = $(this._templateShowInProject);
        }

        this._internalShow(this._$statusProject, $sectionProjectFiles, insertType.AFTER, text, busy);
    };

    StatusDisplay.prototype.hideInProject = function () {
        this._internalHideLaterAnimation($statusProject);
    };

    StatusDisplay.prototype.showStatusInfo = function (text, busy) {
        if(this._$statusInfo === null || this._$statusInfo === undefined) {
            this._$statusInfo = $(this._templateShowInStatus);
        }

        this._internalShow(this._$statusInfo, $sectionStatusInfo, insertType.APPEND, text, busy);
    };

    StatusDisplay.prototype.hideStatusInfo = function () {
        this._internalHideLater(this._$statusInfo);
    };

    StatusDisplay.prototype.showQuickSearchSpinner = function () {
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

        this._$fetchSpinner = $(this._templateSpinner)
            .css({
                position: "absolute",
                top: spinnerTop + "px",
                right: spinnerRight + "px"
            })
            .appendTo($parent);
    };

    StatusDisplay.prototype.hideQuickSearchSpinner = function () {
        if (this._$fetchSpinner) {
            this._$fetchSpinner.remove();
        }
    };

    /**
     * @private
     */
    StatusDisplay.prototype._internalShow = function ($element, $parent, insertType, text, busy) {
        var hasChildren = $parent.find($element).length !== 0;

        if (!hasChildren) {
            if (insertType === insertType.AFTER) {
                $element.insertAfter($parent);
            } else {
                $parent.append($element);
            }

            window.setTimeout(function () {
                $element.removeClass("hidden");
            }, 0);
        }

        text = text || "";

        $element.find(".text").text(text);
        $element.find(".spinner").toggleClass("spin", busy);
    };

    /**
     * @private
     */
    StatusDisplay.prototype._internalHideLaterAnimation = function ($element, time) {
        time = time || 3000;

        function hide() {
            if ($element) {
                $element.addClass("hidden")
                    .on("webkitTransitionEnd", function () {
                        $element.remove();
                        $element = null;
                    });
            }
        }

        window.setTimeout(hide, time);
    };

    /**
     * @private
     */
    StatusDisplay.prototype._internalHideLater = function ($element, time) {
        time = time || 3000;

        function hide() {
            if ($element) {
                $element.remove();
                $element = null;
            }
        }

        window.setTimeout(hide, time);
    };

    /**
     * @return {StatusDisplay}
     */
    function createStatusDisplay() {
        var status = new StatusDisplay();
        status.initialize();

        return status;
    }

    AppInit.htmlReady(function () {
        $sectionProjectFiles = $("#project-files-header");
        $sectionStatusInfo = $("#status-info");
    });

    // public API

    exports.create = createStatusDisplay;
});