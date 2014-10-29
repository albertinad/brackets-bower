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

    var AppInit        = brackets.getModule("utils/AppInit"),
        ExtensionUtils = brackets.getModule("utils/ExtensionUtils"),
        NodeConnection = brackets.getModule("utils/NodeConnection"),
        CommandManager = brackets.getModule("command/CommandManager"),
        KeyBindingManager = brackets.getModule("command/KeyBindingManager"),
        Menus          = brackets.getModule("command/Menus"),
        QuickOpen      = brackets.getModule("search/QuickOpen"),
        ProjectManager = brackets.getModule("project/ProjectManager"),
        FileSystem     = brackets.getModule("filesystem/FileSystem");

    // local module
    var StatusDisplay = require("src/StatusDisplay");

    var CMD_INSTALL_FROM_BOWER = "com.adobe.brackets.commands.bower.installFromBower";

    var nodeConnection,
        nodePromise = new $.Deferred(),
        packageListPromise,
        queue = [],
        packages,
        installPromise,
        latestQuery,
        failed = [],
        lastFetchTime;


    function _installNext() {
        if (installPromise || queue.length === 0) {
            return;
        }
        
        // TODO: timeout if an install takes too long (maybe that should be in
        // BowerDomain?)
        var pkgName = queue.shift();

        StatusDisplay.showInProject("Installing " + pkgName + "...", true);

        installPromise = nodeConnection.domains.bower.installPackage(
            ProjectManager.getProjectRoot().fullPath,
            pkgName
        ).done(function (error) {
            StatusDisplay.showInProject("Installed " + pkgName, false);
            
            var rootPath = ProjectManager.getProjectRoot().fullPath,
                rootDir = FileSystem.getDirectoryForPath(rootPath),
                bowerPath = rootPath + "bower_components/",
                bowerDir = FileSystem.getDirectoryForPath(bowerPath);

            // Temporary hack to deal with the fact that the filesystem caches directory entries and
            // doesn't refresh unless you switch away from the Brackets window and back. This should
            // go away when we have file watchers.
            rootDir._clearCachedData();
            bowerDir._clearCachedData();
            
            ProjectManager.refreshFileTree().done(function () {
                ProjectManager.showInTree(FileSystem.getDirectoryForPath(bowerPath + pkgName));
            });
        }).fail(function (error) {
            // Make sure the user sees the error even if other packages get installed.
            failed.push(pkgName);
        }).always(function () {
            installPromise = null;
            if (queue.length === 0) {
                if (failed.length > 0) {
                    StatusDisplay.showInProject("Error installing " + failed.join(", "), false);
                    failed = [];
                }
                StatusDisplay.hideInProject();
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
        var result = new $.Deferred();

        nodePromise
            .then(function () {
                return nodeConnection.domains.bower.getPackages();
            })
            .then(function (pkgs) {
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
                packageListPromise = new $.Deferred();

                StatusDisplay.showQuickSearchSpinner();
                StatusDisplay.showStatusInfo("Loading Bower Registry", true);

                _fetchPackageList()
                    .done(packageListPromise.resolve)
                    .fail(packageListPromise.reject)
                    .always(function () {
                        StatusDisplay.hideQuickSearchSpinner();
                        StatusDisplay.showStatusInfo("Bower Registry Ready", false);
                        StatusDisplay.hideStatusInfo();

                        packageListPromise = null;
                    });
            }

            // Due to bugs in smart autocomplete, we have to return separate promises for each call
            // to _search, but make sure to only resolve the last one.
            var result = new $.Deferred();
            packageListPromise.done(function () {
                if (query === latestQuery) {
                    result.resolve(_search(latestQuery, matcher));
                } else {
                    result.reject();
                }
            });
            return result.promise();
        }
        
        // Remove initial "+"
        query = query.slice(1);
        
        // Filter and rank how good each match is
        var filteredList = $.map(packages, function (pkg) {
            var searchResult = matcher.match(pkg.name, query);
            if (searchResult) {
                searchResult.pkg = pkg;
            }
            return searchResult;
        });
        
        // Sort based on ranking & basic alphabetical order
        QuickOpen.basicMatchSort(filteredList);

        return filteredList;
    }
    
    function _itemSelect(result) {
        _addToQueue(result.pkg.name);
    }
    
    function _init() {
        var bowerInstallCmd = CommandManager.register("Install from Bower...", CMD_INSTALL_FROM_BOWER, _quickOpenBower),
            fileMenu = Menus.getMenu(Menus.AppMenuBar.FILE_MENU);
        
        fileMenu.addMenuDivider();
        fileMenu.addMenuItem(bowerInstallCmd);
        
        KeyBindingManager.addBinding(CMD_INSTALL_FROM_BOWER, {key: "Ctrl-Shift-B"});
        
        ExtensionUtils.loadStyleSheet(module, "styles.css");

        AppInit.appReady(function () {
            nodeConnection = new NodeConnection();
            nodeConnection.connect(true).then(function () {
                nodeConnection.loadDomains(
                    [ExtensionUtils.getModulePath(module, "node/BowerDomain")],
                    true
                ).then(function () {
                    nodePromise.resolve();
                });
            });
        });

        QuickOpen.addQuickOpenPlugin({
            name: "installFromBower",
            languageIds: [],
            search: _search,
            match: _match,
            itemSelect: _itemSelect,
            label: "Install from Bower"
        });
    }
    
    _init();
});
