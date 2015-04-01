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

    var templatePanel     = require("text!templates/dependencies.html"),
        templateBowerJson = require("text!templates/bower-json-section.html"),
        templatePackages  = require("text!templates/packages-section.html"),
        Strings           = require("strings");

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

        this._$panel.on("click", "[data-bower-installed-action='delete']", function () {
            /*jshint validthis:true */
            that._controller.uninstall($(this).data("name"));
        }).on("click", "[data-bower-installed-action='update']", function () {
            /*jshint validthis:true */
            that._controller.update($(this).data("name"));
        }).on("click", "[data-bower-json-action='create']", function (event) {
            event.stopPropagation();

            that._disableButton($(this));

            that._controller.createBowerJson();
        }).on("click", "[data-bower-json-action='delete']", function (event) {
            event.stopPropagation();

            that._controller.deleteBowerJson();
        }).on("click", "[data-bower-json]", function () {
            event.stopPropagation();

            that._controller.openBowerJson();
        });
    };

    DependenciesView.prototype.show = function (bowerJson) {
        var $sectionBowerJson,
            $sectionPackages,
            data = {
                Strings: Strings
            },
            bowerJsonData = {
                Strings: Strings,
                bowerJson: bowerJson
            },
            packagesData = {
                Strings: Strings,
                loading: true,
                dependencies: null,
                existsDependencies: false
            };

        var panelHtml = Mustache.render(templatePanel, data),
            bowerJsonSectionHtml = Mustache.render(templateBowerJson, bowerJsonData),
            packagesSectionHtml = Mustache.render(templatePackages, packagesData);

        this._$panel.append(panelHtml);

        $sectionBowerJson = this._$panel.find("[data-bower-section-id='bower-json-section']");
        $sectionPackages = this._$panel.find("[data-bower-section-id='packages-section']");

        $sectionBowerJson.append(bowerJsonSectionHtml);
        $sectionPackages.append(packagesSectionHtml);

        this._controller.loadProjectPackages();
    };

    DependenciesView.prototype.hide = function () {
        this._$panel.empty();
    };

    /**
     * Reload the bower.json information section.
     * @param {BowerJson} bowerJson
     */
    DependenciesView.prototype.reloadBowerJson = function (bowerJson) {
        var $sectionBowerJson = this._$panel.find("[data-bower-section-id='bower-json-section']"),
            data = {
                Strings: Strings,
                bowerJson: bowerJson
            },
            bowerJsonSectionHtml = Mustache.render(templateBowerJson, data);

        $sectionBowerJson.empty();

        $sectionBowerJson.append(bowerJsonSectionHtml);
    };

    /**
     * Reload the project packages information section.
     * @param {Array} dependencies
     */
    DependenciesView.prototype.reloadPackages = function (dependencies) {
        var $sectionPackages = this._$panel.find("[data-bower-section-id='packages-section']"),
            data = {
                Strings: Strings,
                loading: false,
                dependencies: dependencies,
                existsDependencies: (dependencies && dependencies.length !== 0)
            },
            packagesHtml = Mustache.render(templatePackages, data);

        $sectionPackages.empty();

        $sectionPackages.append(packagesHtml);
    };

    /**
     * @param{BowerJson} bowerJson
     */
    DependenciesView.prototype.onBowerJsonCreated = function (bowerJson) {
        var $btnCreate = this._$panel.find("[data-bower-json-action='create']");

        this._enableButton($btnCreate);

        this.reloadBowerJson(bowerJson);
    };

    DependenciesView.prototype.onDependecyRemoved = function (name) {
        if (this._$panel.find("[data-bower-dependency]").length > 1) {
            var $uninstalledDependency = this._$panel.find("[data-bower-dependency='" + name + "']");

            $uninstalledDependency.remove();
        } else {
            this.reloadPackages(null);
        }
    };

    /**
     * Helper function to enable a given jQuery button object.
     * @private
     * @param {jQuery} $btn
     */
    DependenciesView.prototype._enableButton = function ($btn) {
        $btn.prop("disabled", false);
    };

    /**
     * Helper function to disable a given jQuery button object.
     * @private
     * @param {jQuery} $btn
     */
    DependenciesView.prototype._disableButton = function ($btn) {
        $btn.prop("disabled", true);
    };

    module.exports = DependenciesView;
});
