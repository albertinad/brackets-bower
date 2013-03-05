/*
 * Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
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


/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, describe, it, expect, beforeEach, afterEach, waits, waitsFor, waitsForDone, runs, $, brackets, waitsForDone, spyOn, tinycolor, KeyEvent */

define(function (require, exports, module) {
    "use strict";
    
    var BowerInstall     = require("main"),
        NodeConnection   = brackets.getModule("utils/NodeConnection"),
        FileUtils        = brackets.getModule("file/FileUtils"),
        NativeFileSystem = brackets.getModule("file/NativeFileSystem"),
        ExtensionUtils   = brackets.getModule("utils/ExtensionUtils"),
        SpecRunnerUtils  = brackets.getModule("spec/SpecRunnerUtils"),
        Async            = brackets.getModule("utils/Async");

    // TODO: should put in system temp folder, but we don't have a generic way to get that
    var testFolder      = FileUtils.getNativeModuleDirectoryPath(module) + "/tmp-test";

    describe("BowerInstall", function () {
        
        // Unit tests for the underlying node server.
        describe("BowerDomain", function () {
            var nodeConnection,
                testBrackets,
                ProjectManager;
            
            beforeEach(function () {
                runs(function () {
                    var nodePromise = new $.Deferred();
                    nodeConnection = new NodeConnection();
                    nodeConnection.connect(true).then(function () {
                        nodeConnection.loadDomains(
                            [ExtensionUtils.getModulePath(module, "node/FileUtilsDomain")],
                            true
                        ).then(function () {
                            nodePromise.resolve();
                        });
                    });
                    waitsForDone(nodePromise, "connecting to node server");
                });
                
                runs(function () {
                    var domainPromise = new $.Deferred(),
                        retries = 0;

                    function waitForDomain() {
                        if (nodeConnection.domains.bower) {
                            domainPromise.resolve();
                        } else {
                            retries++;
                            if (retries >= 5) {
                                domainPromise.reject();
                            } else {
                                setTimeout(waitForDomain, 100);
                            }
                        }
                    }
                    
                    waitForDomain();
                    waitsForDone(domainPromise, "waiting for Bower domain to load");
                });
                
                runs(function () {
                    var folderPromise = new $.Deferred();
                    SpecRunnerUtils.createTestWindowAndRun(this, function (testWindow) {
                        testBrackets = testWindow.brackets;
                        ProjectManager = testBrackets.test.ProjectManager;
                        
                        testBrackets.fs.makedir(testFolder, 0, function (err) {
                            if (err === testBrackets.fs.NO_ERROR) {
                                ProjectManager.openProject(testFolder)
                                    .then(folderPromise.resolve, folderPromise.reject);
                            } else {
                                folderPromise.reject();
                            }
                        });
                        folderPromise.resolve();
                    });
                    waitsForDone(folderPromise, "waiting for test folder to be created");
                });
            });
            
            afterEach(function () {
                runs(function () {
                    SpecRunnerUtils.closeTestWindow();
                    waitsForDone(nodeConnection.domains.bower_test_fileutils.deleteRecursive(testFolder), "deleting test folder");
                });
                
                runs(function () {
                    nodeConnection.disconnect();
                    nodeConnection = null;
                });
            });
            
            it("should return a list of package names", function () {
                var serverInfo, packages, i;
                runs(function () {
                    nodeConnection.domains.bower.getPackages()
                        .done(function (data) {
                            packages = data;
                        });
                });
                
                waitsFor(function () { return packages; }, "waiting for bower package list", 10000);
                
                runs(function () {
                    expect(Array.isArray(packages)).toBe(true);
                    expect(packages.length).toBeGreaterThan(0);
                    for (i = 0; i < packages.length; i++) {
                        expect(typeof packages[i].name).toBe("string");
                        expect(typeof packages[i].url).toBe("string");
                    }
                });
            });
            
            it("should install jquery", function () {
                runs(function () {
                    waitsForDone(nodeConnection.domains.bower.installPackage(testFolder, "jquery"),
                                 "installing jquery", 10000);
                });
                runs(function () {
                    waitsForDone(FileUtils.readAsText(new NativeFileSystem.FileEntry(testFolder + "/components/jquery/jquery.js")),
                                 "reading installed jquery");
                });
            });
        });
    });
});
