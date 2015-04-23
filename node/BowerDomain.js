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
maxerr: 50, node: true */
/*global require */

(function () {
    "use strict";

    var bower       = require("bower"),
        bowerConfig = require("bower-config"),
        Cli         = require("./Cli");

    var DOMAIN_NAME = "bower";

    /**
     * @param {object} error
     * @return {object}
     * @private
     */
    function _getError(error) {
        return {
            error: error,
            message: error.message || null
        };
    }

    /**
     * Returns a list of all package names from bower. Might take nontrivial time to complete.
     * @param {object} config Key-value object to specify optional configuration.
     * @param {function(?string, ?Array.<{name: string, url: string}>)} cb Callback to receive
     *     the list of package names. First parameter is either an error string or null if no
     *     error; second parameter is either the array of name/url objects or null if there was
     *     an error.
     */
    function _cmdSearch(config, cb) {
        bower.commands.search(null, config)
            .on("end", function (data) {
                cb(null, data);
            })
            .on("error", function (error) {
                cb(_getError(error), null);
            });
    }

    /**
     * Returns a list of all packages names from bower cache.
     * @param {object} config Key-value object to specify optional configuration.
     * @param {function(?Array)} cb Callback o receive
     *      the list of packages names that are on the bower cache.
     */
    function _cmdListCache(config, cb) {
        bower.commands.cache.list(null, null, config)
            .on("end", function (data) {
                cb(null, data);
            })
            .on("error", function (error) {
                // returns as a result an empty array
                cb(null, []);
            });
    }

    /**
     * Installs packages.
     * @param {Array} names Array with package's names to install.
     * @param {object} options Options object, to specify if it should save the package into bower.json.
     * @param {object} config Key-value object to specify optional configuration.
     * @param {function(?string, ?string)} cb Callback for when the installation is finished.
     * First parameter is an error string, or null if no error, and second parameter is either
     * the full installation path or null if there was an error.
     */
    function _cmdInstall(names, options, config, cb) {
        bower.commands.install(names, options, config)
            .on("end", function (installedPackages) {
                cb(null, installedPackages);
            })
            .on("error", function (error) {
                cb(_getError(error), null);
            });
    }

    /**
     * Uninstall the given packages.
     * @param {Array} names Array with package's names to uninstall.
     * @param {object} options Options object, to specify if it should update the bower.json.
     * @param {object} config Key-value object to specify optional configuration.
     * @param {function(?string, ?string)} cb Callback for when the uninstallation is finished.
     */
    function _cmdUninstall(names, options, config, cb) {
        bower.commands.uninstall(names, options, config)
            .on("end", function (uninstalledPackages) {
                cb(null, uninstalledPackages);
            })
            .on("error", function (error) {
                cb(_getError(error), null);
            });
    }

    /**
     * @param {object} config Key-value object to specify optional configuration.
     * @param {function} cb
     */
    function _cmdPrune(config, cb) {
        bower.commands.prune(null, config)
            .on("end", function (removedPackages) {
                cb(null, removedPackages);
            })
            .on("error", function (error) {
                cb(_getError(error), null);
            });
    }

    /**
     * Update the given packages according to the bower.json file.
     * @param {Array} names Array with package's names to update.
     * @param {object} config Key-value object to specify optional configuration.
     * @param {function(?string, ?string)} cb Callback for when the installation is finished.
     */
    function _cmdUpdate(names, config, cb) {
        var options = {};

        bower.commands.update(names, options, config)
            .on("end", function (result) {
                cb(null, result);
            })
            .on("error", function (error) {
                cb(_getError(error), null);
            });
    }

    /**
     * Get information about a particular package.
     * @param {string} name Name of the package to get more information.
     * @param {object} config Key-value object to specify optional configuration.
     * @param {function(?string, ?string)} cb
     */
    function _cmdInfo(name, config, cb) {
        bower.commands.info(name, null, config)
            .on("end", function (result) {
                cb(null, result);
            })
            .on("error", function (error) {
                cb(_getError(error), null);
            });
    }

    /**
     * @param {object} config Key-value object to specify optional configuration.
     * @param {function} cb
     */
    function _cmdList(config, cb) {
        bower.commands.list(null, config)
            .on("end", function (result) {
                cb(null, result);
            })
            .on("error", function (error) {
                cb(_getError(error), null);
            });
    }

    /**
     * Read and get the configuration from the ".bowerrc" file.
     * @param {string} path The path to the folder to read the configuration.
     * @param {function(?string, ?string)} cb Callback for when the configuration is ready.
     */
    function _cmdGetConfiguration(path, cb) {
        var config = bowerConfig.read(path);

        cb(null, config);
    }

    /**
     * Executes a system program with arguments.
     * @param {string} cmd The full path to the program.
     * @param {array} args The arguments for the program to execute.
     * @param {function(?string, ?string)} cb Callback for when the program has executed.
     */
    function _cmdExecCommand(cmd, args, cb) {
        Cli.execCommand(cmd, args, cb);
    }

    /**
     * Initializes the domain with its commands.
     * @param {DomainManager} domainmanager The DomainManager for the server
     */
    function init(domainManager) {
        if (!domainManager.hasDomain(DOMAIN_NAME)) {
            domainManager.registerDomain(DOMAIN_NAME, {
                major: 0,
                minor: 1
            });
        }

        domainManager.registerCommand(
            DOMAIN_NAME,
            "search",
            _cmdSearch,
            true,
            "Returns a list of all packages from the bower registry.",
            [{
                name: "config",
                type: "object",
                description: "Configuration object."
            }],
            [{
                name: "packages",
                type: "{Array.<{name: string, url: string}>}",
                description: "List of all packages in the bower registry."
            }]
        );

        domainManager.registerCommand(
            DOMAIN_NAME,
            "listCache",
            _cmdListCache,
            true,
            "Returns a list of all packages from the bower cache.",
            [{
                name: "config",
                type: "object",
                description: "Configuration object."
            }],
            [{
                name: "packages",
                type: "{Array}",
                description: "List of all packages in the bower cache."
            }]
        );

        domainManager.registerCommand(
            DOMAIN_NAME,
            "install",
            _cmdInstall,
            true,
            "Installs a package into a given folder.",
            [{
                name: "names",
                type: "array",
                description: "Array with package's names to install. If null, it will look for the bower.json dependencies."
            }, {
                name: "save",
                type: "object",
                description: "Options to specify to ave the installed package to the bower.json file"
            }, {
                name: "config",
                type: "object",
                description: "Configuration object."
            }],
            [{
                name: "installationPath",
                type: "string",
                description: "Path to the installed package."
            }]
        );

        domainManager.registerCommand(
            DOMAIN_NAME,
            "uninstall",
            _cmdUninstall,
            true,
            "Uninstalls a package.",
            [],
            []
        );

        domainManager.registerCommand(
            DOMAIN_NAME,
            "prune",
            _cmdPrune,
            true,
            "Uninstall packages removed from bower.json.",
            [{
                name: "config",
                type: "object",
                description: "Configuration object."
            }],
            []
        );

        domainManager.registerCommand(
            DOMAIN_NAME,
            "update",
            _cmdUpdate,
            true,
            "Update packages according to the bower.json.",
            [{
                name: "names",
                type: "array",
                description: "Array with package's names to update."
            }, {
                name: "config",
                type: "object",
                description: "Configuration object."
            }],
            []
        );

        domainManager.registerCommand(
            DOMAIN_NAME,
            "info",
            _cmdInfo,
            true,
            "Get information about the given package",
            [],
            []
        );

        domainManager.registerCommand(
            DOMAIN_NAME,
            "list",
            _cmdList,
            true,
            "List installed packages.",
            [{
                name: "config",
                type: "object",
                description: "Configuration object."
            }],
            []
        );

        domainManager.registerCommand(
            DOMAIN_NAME,
            "getConfiguration",
            _cmdGetConfiguration,
            true,
            "Get the configuration.",
            [{
                name: "path",
                type: "string",
                description: "Path to folder to read the configuration."
            }],
            [{
                name: "config",
                type: "Object",
                description: "Configuration object."
            }]
        );

        domainManager.registerCommand(
            DOMAIN_NAME,
            "execCommand",
            _cmdExecCommand,
            true,
            "Utility to execute commands",
            [{
                name: "cmd",
                type: "string",
                description: "System command to execute in a child process."
            }],
            [{
                name: "args",
                type: "array",
                description: "Sytem command's arguments."
            }],
            [{
                name: "result",
                type: "string",
                description: "Result of the command execution."
            }]
        );
    }

    exports.init = init;
}());
