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

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define */

define({
    "TITLE_BOWER": "Bower",
    "TITLE_WARNING": "Bower Warning",
    "TITLE_ERROR": "Bower Error",
    "TITLE_SHORTCUT": "Install from Bower...",
    "TITLE_QUICK_OPEN": "Install from Bower",
    "TITLE_SET_CWD": "Set as Bower active directory",
    "TITLE_CONFIG": "Configuration",
    "TITLE_DEPENDENCIES": "Dependencies",
    "TITLE_SETTINGS": "Bower Settings",
    "TITLE_PROJECT_PACKAGES": "Project packages",
    "BOWERRC_NOT_FOUND": ".bowerrc file not found!",
    "BOWER_JSON_NOT_FOUND": "Bower.json file not found!",
    "INSTALLED_PACKAGES_NOT_FOUND": "No installed packages yet",
    "CREATE": "Create",
    "RELOAD": "Reload",
    "DELETE": "Delete",
    "STATUS_BOWER_LOADING": "Loading Bower registry",
    "STATUS_BOWER_READY": "Bower registry ready",
    "STATUS_BOWER_NOT_LOADED": "Couldn't load Bower registry",
    "STATUS_INSTALLING_PKG": "Installing {0} ...",
    "STATUS_PKG_INSTALLED": "Installed {0}",
    "STATUS_ERROR_INSTALLING": "Error installing {0}",
    "TEXT_CLOSE": "Close",
    "TEXT_CANCEL": "Cancel",
    "TEXT_SAVE": "Save",
    "TEXT_OK": "OK",
    "TEXT_RELOAD_DEFAULTS": "Reload defaults",
    "TEXT_SETTINGS_RELOAD_TIME": "Time to reload the Bower registry",
    "TEXT_SETTINGS_RELOAD_TIME_UNIT": "(m)",
    "TEXT_SETTINGS_SAVE_PACKAGES": "Save packages installed using QuickInstall to bower.json",
    "GIT_NOT_FOUND_TITLE": "Git wasn't found on your system",
    "GIT_NOT_FOUND_DESCRIPTION": "Brackets-bower extension searched for Git at the system PATH.\n\nBower requires Git installed, and configured in the system PATH variable, \nto download and install some packages.\nBrackets-bower extension may not work properly.",
    "COMMAND_INSTALL": "install",
    "COMMAND_PRUNE": "prune",
    "COMMAND_UNINSTALL": "uninstall",
    "COMMAND_UPDATE": "update",
    "TRACK_IN_BOWERJSON": "add",
    "REMOVE_FROM_BOWERJSON": "remove",
    "STATUS_EXECUTING_COMMAND": "Executing command \"{0}\"",
    "STATUS_ERROR_EXECUTING_COMMAND": "Error executing command \"{0}\"",
    "STATUS_SUCCESS_INSTALLING": "Packages installed",
    "STATUS_SUCCESS_EXECUTING_COMMAND": "Command \"{0}\" executed",
    "STATUS_NO_PACKAGES_INSTALLED": "There isn't any package to install",
    "ERROR_RELOAD_TIME_VALUE": "* The time must be greater than {0} minutes",
    "TITLE_ERROR_UNINSTALLING": "Error uninstalling Bower package",
    "SUMMARY_ERROR_UNINSTALLING_DEPENDANTS": "The package \"{0}\" has dependants packages",
    "NOTE_QUESTION_CONTINUE_UNINSTALLING": "Are you sure you want to uninstall it?",
    "SUMMARY_ERROR": "Oops! An error ocurred.",
    "SYNC_WITH_PROJECT_TITLE": "Synchronize with project packages",
    "SYNC_WITH_BOWER_JSON_TITLE": "Synchronize with bower.json",
    "SYNC_PROJECT_MESSAGE": "Synchronizing project",
    "SYNC_PROJECT_SUCCESS_MESSAGE": "Project synchronized",
    "PROJECT_OUT_OF_SYNC_MESSAGE": "Out of sync",
    "PKG_STATUS_MISSING": "Missing",
    "PKG_STATUS_NOT_TRACKED": "Not tracked",
    "PKG_STATUS_VERSIONS": "Versions don\'t match",
    "ERROR_DEFAULT_MSG": "Bower unknown internal error.",
    "ERROR_MSG_MALFORMED_BOWER_JSON": "The bower.json file is malformed, please review it.",
    "ERROR_MSG_MALFORMED": "Bower unknown internal error.",
    "ERROR_MSG_MALFORMED_FILE": "Some metadata file, \"bower.json\" or \".bowerrc\" is malformed or, it doesn't follow the specification.",
    "ERROR_MSG_NO_TARGET": "The target for downloading or getting more information about some of the packages does not exist or is not valid.",
    "ERROR_MSG_NO_SOURCE": "Some of the package's source was not found, or is not valid",
    "ERROR_MSG_NO_RESOLVER": "Bower can't find an specific resolver to download information about some package.",
    "ERROR_MSG_DEPENDENCY_CONFLICT": "Unable to find a suitable version for \"{0}\". Please, review your bower.json configuration.",
    "ERROR_MSG_NO_PACKAGE_INSTALLED": "The operation could not be performed because there's no installed package.",
    "ERROR_MSG_NO_PACKAGE_UPDATED": "The package was not updated because there wasn't anything to update.",
    "ERROR_MSG_NO_UPDATE_DATA": "There's no data to update the package",
    "ERROR_NO_BOWER_JSON": "The bower.json file is required and it doesn't exist.",
    "ERROR_MSG_NOTHING_TO_SYNC": "There's no packages that needs synchronization.",
    "ERROR_MSG_DOWNLOAD_INCOMPLETE": "The download is incomplete, please try again later.",
    "ERROR_MSG_CONNECTION_PROBLEM": "The network connection is lost. Please, check your internet connection and try again."
});
