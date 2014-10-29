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

    var $fetchSpinner,
        $statusProject,
        $statusInfo;
    
    var insertType = {
        AFTER: 0,
        APPEND: 1
    };

    function _internalShow($element, $parent, insertType, template, text, busy) {
        if (!$element) {
            $element = $(template);
            
            if(insertType === insertType.AFTER) {
                $element.insertAfter($parent);
            } else {
                $parent.append($element);
            }
            
            setTimeout(function () {
                $element.removeClass("hidden");
            }, 0);
        }

        text = text || "";

        $element.find(".text").text(text);
        $element.find(".spinner").toggleClass("spin", busy);
    }

    function _internalHideLater($element, time) {
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

        setTimeout(hide, time);
    }

    function showInProject(statusText, busy) {
        var $sectionProjects = $("#project-files-header"),
            template = "<div class='bower-install-status hidden'><div class='inner'><span class='text'></span><div class='spinner'></div></div></div>";

        _internalShow($statusProject, $sectionProjects, insertType.AFTER, template, statusText, busy);
    }

    function hideInProject() {
        _internalHideLater($statusProject);
    }

    function showStatusInfo(statusText, busy) {
        var $sectionStatusInfo = $("#status-info"),
            template = [
                "<div class='bower-loading-status'>",
                "<span class='text'></span>",
                "<span class='spinner'></span>",
                "</div>"
            ].join("");

        _internalShow($statusInfo, $sectionStatusInfo, insertType.APPEND, template, statusText, busy);
    }

    function hideStatusInfo() {
        _internalHideLater($statusInfo);
    }

    function showQuickSearchSpinner() {
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

        $fetchSpinner = $("<div class='spinner spin'></div>")
            .css({
                position: "absolute",
                top: spinnerTop + "px",
                right: spinnerRight + "px"
            })
            .appendTo($parent);
    }

    function hideQuickSearchSpinner() {
        if ($fetchSpinner) {
            $fetchSpinner.remove();
        }
    }

    // public API

    exports.showInProject = showInProject;
    exports.hideInProject = hideInProject;
    exports.showStatusInfo = showStatusInfo;
    exports.hideStatusInfo = hideStatusInfo;
    exports.showQuickSearchSpinner = showQuickSearchSpinner;
    exports.hideQuickSearchSpinner = hideQuickSearchSpinner;
});