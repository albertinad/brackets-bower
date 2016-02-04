/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2016 - 2016 Intel Corporation
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4,
maxerr: 50, browser: true */
/*global define */

define(function (require, exports, module) {
    "use strict";

    var data = [
        {
            key          : "reloadRegistryTime",
            preferenceId : "RELOAD_REGISTRY_TIME",
            type         : "number",
            defaultValue : 10,
            minValue     : 3,
            validate     : function (value, preferences) {
                if (typeof value !== this.type) {
                    if (value === undefined || value === null) {
                        value = this.defaultValue;
                    } else {
                        value = parseInt(value, 0);

                        if (isNaN(value)) {
                            value = this.defaultValue;
                        }
                    }

                    preferences.set(this.key, value);
                } else if (value < this.minValue) {
                    preferences.set(this.key, this.defaultValue);
                }
            }
        },
        {
            key          : "quickInstallSavePackages",
            preferenceId : "QUICK_INSTALL_SAVE",
            type         : "boolean",
            defaultValue : true
        },
        {
            key          : "show",
            preferenceId : "EXTENSION_VISIBLE",
            type         : "boolean",
            defaultValue : false
        }
    ];

    module.exports = data;
});
