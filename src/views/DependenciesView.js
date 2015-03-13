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
/*globals define, $, Mustache */

define(function (require, exports, module) {
    "use strict";

    var template = require("text!templates/dependencies.html"),
        Strings = require("strings");

    /**
     * Dependencies view.
     * @constructor
     * @param{DependenciesController} controller
     */
    function DependenciesView(controller) {
        /** @private */
        this._controller = controller;
        /** @private */
        this._$panel = null;
    }

    DependenciesView.prototype.initialize = function ($container) {
        var that = this;

        this._$panel = $container;

        this._$panel.on("click", "[data-bower-installed-action='delete']", function (event) {
            event.stopPropagation();

            /*jshint validthis:true */
            var name = $(this).data("name");

            that._controller.onUninstall(name);
        });
    };

    DependenciesView.prototype.show = function (dependencies) {
        var data = {
            Strings: Strings,
            dependencies: dependencies,
            existsDependencies: (dependencies && dependencies.length !== 0)
        };

        var sectionHtml = Mustache.render(template, data);

        this._$panel.append(sectionHtml);
    };

    DependenciesView.prototype.hide = function () {
        this._$panel.empty();
    };

    DependenciesView.prototype.reload = function (dependencies) {
        this._$panel.empty();

        this.show(dependencies);
    };

    DependenciesView.prototype.onDependecyRemoved = function (name) {
        if (this._$panel.find('[data-bower-dependency]').length > 1) {
            var $uninstalledDependency = this._$panel.find("[data-bower-dependency='" + name + "']");

            $uninstalledDependency.remove();
        } else {
            this.reload(null);
        }
    };

    module.exports = DependenciesView;
});
