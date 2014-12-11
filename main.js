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

define(function (require, exports, module) {
    "use strict";

    var AppInit           = brackets.getModule("utils/AppInit"),
        ExtensionUtils    = brackets.getModule("utils/ExtensionUtils"),
        NodeDomain        = brackets.getModule("utils/NodeDomain"),
        StringMatch       = brackets.getModule("utils/StringMatch"),
        StringUtils       = brackets.getModule("utils/StringUtils"),
        Resizer           = brackets.getModule("utils/Resizer"),
        CommandManager    = brackets.getModule("command/CommandManager"),
        KeyBindingManager = brackets.getModule("command/KeyBindingManager"),
        Menus             = brackets.getModule("command/Menus"),
        WorkspaceManager  = brackets.getModule("view/WorkspaceManager"),
        QuickOpen         = brackets.getModule("search/QuickOpen"),
        ProjectManager    = brackets.getModule("project/ProjectManager"),
        FileSystem        = brackets.getModule("filesystem/FileSystem");

    // local module
    var StatusDisplay = require("src/StatusDisplay"),
        Config        = require("src/Config"),
        Strings       = require("strings");

    // mustache templates
    var bowerPanel = require("text!templates/panel.html");

    var EXTENSION_NAME         = "com.adobe.brackets.extension.bower",
        CMD_INSTALL_FROM_BOWER = "com.adobe.brackets.commands.bower.installFromBower",
        CMD_BOWER_CONFIG       = "com.adobe.brackets.commands.bower.toggleConfigView",
        KEY_INSTALL_FROM_BOWER = "Ctrl-Alt-B";

    var bowerDomain = new NodeDomain("bower", ExtensionUtils.getModulePath(module, "node/BowerDomain")),
        packageListPromise,
        queue = [],
        packages,
        installPromise,
        latestQuery,
        failed = [],
        lastFetchTime,
        status = StatusDisplay.create(),
        $bowerPanel,
        isBowerPanelVisible = false;


    function _installNext() {
        // TODO: timeout if an install takes too long (maybe that should be in
        // BowerDomain?)
        if (installPromise || queue.length === 0) {
            return;
        }

        var rootPath = ProjectManager.getProjectRoot().fullPath,
            pkgName = queue.shift(),
            config = Config.getDefaultConfiguration();

        status.showStatusInfo(StringUtils.format(Strings.STATUS_INSTALLING_PKG, pkgName), true);

        installPromise = bowerDomain.exec("installPackage", rootPath, pkgName, config);

        installPromise.done(function (installationPath) {
            status.showStatusInfo(StringUtils.format(Strings.STATUS_PKG_INSTALLED, pkgName), false);

            window.setTimeout(function () {
                ProjectManager.showInTree(FileSystem.getDirectoryForPath(installationPath));
            }, 1000);

        }).fail(function (error) {
            // Make sure the user sees the error even if other packages get installed.
            failed.push(pkgName);
        }).always(function () {
            installPromise = null;

            if (queue.length === 0) {
                if (failed.length > 0) {
                    var errorMessage = StringUtils.format(Strings.STATUS_ERROR_INSTALLING, failed.join(", "));
                    status.showStatusInfo(errorMessage, false);
                    failed = [];
                }
                status.hideStatusInfo();
            } else {
                _installNext();
            }
        });
    }

    function _addToQueue(pkgName) {
        queue.push(pkgName);

        _installNext();
    }

    function _quickOpenBower() {
        QuickOpen.beginSearch("+", "");
    }

    function _match(query) {
        // TODO: doesn't seem to work if no file is open. Bug in Quick Open?
        return (query.length > 0 && query.charAt(0) === "+");
    }

    function _fetchPackageList() {
        var result = new $.Deferred(),
            config = Config.getDefaultConfiguration();

        bowerDomain.exec("getPackages", config)
            .done(function (pkgs) {
                pkgs.sort(function (pkg1, pkg2) {
                    var name1 = pkg1.name.toLowerCase(),
                        name2 = pkg2.name.toLowerCase();

                    return (name1 < name2 ? -1 : (name1 === name2 ? 0 : 1));
                });

                packages = pkgs;

                result.resolve();
            })
            .fail(result.reject);

        return result;
    }

    function _search(query, matcher) {
        var curTime = Date.now(),
            maxTime = 1000 * 60 * 10; // 10 minutes

        // Remove initial "+"
        query = query.slice(1);

        latestQuery = query;

        if (packages && (lastFetchTime === undefined || curTime - lastFetchTime > maxTime)) {
            // Packages were fetched more than ten minutes ago. Force a refetch.
            packages = null;
        }

        if (lastFetchTime === undefined || curTime - lastFetchTime > maxTime) {
            // Re-fetch the list of packages if it's been more than 10 minutes since the last time we fetched them.
            packages = null;
            packageListPromise = null;
            lastFetchTime = curTime;
        }

        if (!packages) {
            // Packages haven't yet been fetched. If we haven't started fetching them yet, go ahead and do so.
            if (!packageListPromise) {
                var displayMessage = Strings.STATUS_BOWER_LOADING;

                packageListPromise = new $.Deferred();

                status.showQuickSearchSpinner();
                status.showStatusInfo(displayMessage, true);

                _fetchPackageList()
                    .done(function () {
                        displayMessage = Strings.STATUS_BOWER_READY;

                        packageListPromise.resolve();
                    })
                    .fail(function () {
                        displayMessage = Strings.STATUS_BOWER_NOT_LOADED;

                        packageListPromise.reject();
                    })
                    .always(function () {
                        status.hideQuickSearchSpinner();
                        status.showStatusInfo(displayMessage, false);
                        status.hideStatusInfo();

                        packageListPromise = null;
                    });
            }

            // Due to bugs in smart autocomplete, we have to return separate promises for each call
            // to _search, but make sure to only resolve the last one.
            var result = new $.Deferred();

            packageListPromise.done(function () {
                // validate for an empty string avoids an exception in smart autocomplete
                if (query === latestQuery && query.trim() !== "") {
                    result.resolve(_search(latestQuery, matcher));
                } else {
                    result.reject();
                }
            });

            return result.promise();
        }

        // Filter and rank how good each match is
        var filteredList = $.map(packages, function (pkg) {
            var searchResult = matcher.match(pkg.name, query);
            if (searchResult) {
                searchResult.pkg = pkg;
            }
            return searchResult;
        });

        // Sort based on ranking & basic alphabetical order
        StringMatch.basicMatchSort(filteredList);

        return filteredList;
    }

    function _itemSelect(result) {
        if (result) {
            _addToQueue(result.pkg.name);
        }
    }

    function _toggleSetup() {
        if(isBowerPanelVisible) {
            Resizer.hide($bowerPanel);
        } else {
            Resizer.show($bowerPanel);
        }

        isBowerPanelVisible = !isBowerPanelVisible;
    }

    function _init() {
        var $bowerIcon = $("<a id='bower-config-icon' href='#' title='" + Strings.TITLE_BOWER + "'></a>"),
            configCmd = CommandManager.register(Strings.TITLE_BOWER, CMD_BOWER_CONFIG, _toggleSetup),
            installCmd = CommandManager.register(Strings.TITLE_SHORTCUT, CMD_INSTALL_FROM_BOWER, _quickOpenBower),
            fileMenu = Menus.getMenu(Menus.AppMenuBar.FILE_MENU),
            bowerPanelHTML = Mustache.render(bowerPanel, { Strings: Strings });

        fileMenu.addMenuDivider();
        fileMenu.addMenuItem(installCmd);
        fileMenu.addMenuItem(configCmd);

        KeyBindingManager.addBinding(CMD_INSTALL_FROM_BOWER, {
            key: KEY_INSTALL_FROM_BOWER
        });

        ExtensionUtils.loadStyleSheet(module, "assets/styles.css");

        // right panel button
        $bowerIcon.appendTo("#main-toolbar .buttons");
        $bowerIcon.click(function () {
            CommandManager.execute(CMD_BOWER_CONFIG);
        });

        // bottom panel
        WorkspaceManager.createBottomPanel(EXTENSION_NAME, $(bowerPanelHTML), 100);

        $bowerPanel = $("#brackets-bower-panel");

        $bowerPanel.on("click", ".close", function () {
            Resizer.hide($bowerPanel);
        });

        QuickOpen.addQuickOpenPlugin({
            name: "installFromBower",
            languageIds: [],
            search: _search,
            match: _match,
            itemSelect: _itemSelect,
            label: Strings.TITLE_QUICK_OPEN
        });
    }

    _init();
});
