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
        StatusBar      = brackets.getModule("widgets/StatusBar"),
        NativeFileSystem = brackets.getModule("file/NativeFileSystem").NativeFileSystem,
        template       = require("text!template.html");
    
    var CMD_INSTALL_FROM_BOWER = "com.adobe.brackets.commands.bower.installFromBower",
        STATUS_BOWER = "status-bower";

    var nodeConnection,
        nodePromise = new $.Deferred(),
        packageListPromise,
        modalBar,
        queue = [],
        packages,
        installPromise,
        failed = [];
    
    function _updateStatus(status) {
        status = status || "";
        StatusBar.updateIndicator(STATUS_BOWER, !!status);
        $("#" + STATUS_BOWER).text(status); // TODO: weird that we can't just pass this into updateIndicator()
    }

    function _installNext() {
        if (installPromise || queue.length === 0) {
            return;
        }
        
        StatusBar.showBusyIndicator();
        
        // TODO: timeout if an install takes too long (maybe that should be in
        // BowerDomain?)
        // TODO: detect if bower child process died--catch exception
        var pkgName = queue.shift();
        _updateStatus("Bower: installing " + pkgName + "...");
        installPromise = nodeConnection.domains.bower.installPackage(
            ProjectManager.getProjectRoot().fullPath,
            pkgName
        ).done(function (error) {
            _updateStatus("Bower: installed " + pkgName);
            ProjectManager.refreshFileTree().done(function () {
                ProjectManager.showInTree(new NativeFileSystem.DirectoryEntry(ProjectManager.getProjectRoot().fullPath + "bower_components/" + pkgName));
            });
        }).fail(function (error) {
            // Make sure the user sees the error even if other packages get installed.
            failed.push(pkgName);
        }).always(function () {
            installPromise = null;
            if (queue.length === 0) {
                StatusBar.hideBusyIndicator();
                if (failed.length > 0) {
                    _updateStatus("Bower: Error installing " + failed.join(", "));
                    failed = [];
                }
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
        nodePromise.done(function () {
            nodeConnection.domains.bower.getPackages().done(function (pkgs) {
                pkgs.sort(function (pkg1, pkg2) {
                    var name1 = pkg1.name.toLowerCase(), name2 = pkg2.name.toLowerCase();
                    return (name1 < name2 ? -1 : (name1 === name2 ? 0 : 1));
                });
                packages = pkgs;
                result.resolve();
            }).fail(result.reject);
        }).fail(result.reject);
        return result;
    }
    
    function _search(query, matcher) {
        if (!packages) {
            // Packages haven't yet been fetched. Get them asynchronously and return a promise.
            // TODO: this doesn't seem to actually do the right thing--when the result list shows up
            // initially after the first fetch it isn't filtered properly.
            if (!packageListPromise) {
                packageListPromise = new $.Deferred();
                _fetchPackageList().done(function () {
                    packageListPromise.resolve(_search(query, matcher));
                }).fail(packageListPromise.reject);
            }
            return packageListPromise;
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
        
        // TODO: this shouldn't be necessary, see #5682
        var indicator = $("<div/>");
        StatusBar.addIndicator(STATUS_BOWER, indicator, false);
        indicator.prependTo($("#status-indicators"));
    }
    
    _init();
});
