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
        FileSystem     = brackets.getModule("filesystem/FileSystem");

    var CMD_INSTALL_FROM_BOWER = "com.adobe.brackets.commands.bower.installFromBower",
        STATUS_BOWER = "status-bower";

    var nodeConnection,
        nodePromise = new $.Deferred(),
        packageListPromise,
        modalBar,
        queue = [],
        packages,
        installPromise,
        latestQuery,
        failed = [],
        lastFetchTime,
        $fetchSpinner,
        $status,
        $statusPackages;
    

    function _showStatus(status, busy) {
        if (!$status) {
            $status = $("<div class='bower-install-status hidden'><div class='inner'><span class='text'></span><div class='spinner'></div></div></div>")
                .insertAfter($("#project-files-header"));
            setTimeout(function () {
                $status.removeClass("hidden");
            }, 0);
        }
        status = status || "";
        $status.find(".text").text(status);
        $status.find(".spinner").toggleClass("spin", busy);
    }

    function _hideStatusLater() {
        setTimeout(function () {
            if ($status) {
                $status.addClass("hidden")
                    .on("webkitTransitionEnd", function () {
                        $status.remove();
                        $status = null;
                    });
            }
        }, 3000);
    }

    function _showLoadingPackagesStatus(text, busy) {
        if (!$statusPackages) {
            var message = [
                    "<div class='bower-loading-status'>",
                    "<span id='loading-text'></span>",
                    "<span class='spinner'></span>",
                    "</div>"
                ];

            $statusPackages = $(message.join(""));
            $statusPackages.appendTo("#status-info");
        }

        $statusPackages.find("#loading-text").text(text);
        $statusPackages.find(".spinner").toggleClass("spin", busy);
    }

    function _hideLoadingPackagesStatus() {
        setTimeout(function () {
            if ($statusPackages) {
                console.log("#################");
                $statusPackages.remove();
                $statusPackages = null;
            }
        }, 500);
    }

    function _showFetchSpinner() {
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

        $fetchSpinner = $("<div class='spinner spin'/>")
            .css({
                position: "absolute",
                top: spinnerTop + "px",
                right: spinnerRight + "px"
            })
            .appendTo($parent);
    }

    function _hideFetchSpinner() {
        if ($fetchSpinner) {
            $fetchSpinner.remove();
        }
    }

    function _installNext() {
        if (installPromise || queue.length === 0) {
            return;
        }
        
        // TODO: timeout if an install takes too long (maybe that should be in
        // BowerDomain?)
        var pkgName = queue.shift();
        _showStatus("Installing " + pkgName + "...", true);
        installPromise = nodeConnection.domains.bower.installPackage(
            ProjectManager.getProjectRoot().fullPath,
            pkgName
        ).done(function (error) {
            _showStatus("Installed " + pkgName, false);
            
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
                    _showStatus("Error installing " + failed.join(", "), false);
                    failed = [];
                }
                _hideStatusLater();
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

                _showFetchSpinner();
                _showLoadingPackagesStatus("Loading Bower registry", true);

                _fetchPackageList()
                    .done(packageListPromise.resolve)
                    .fail(packageListPromise.reject)
                    .always(function () {
                        _hideFetchSpinner();
                        _showLoadingPackagesStatus("Ready", false);
                        _hideLoadingPackagesStatus();

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
