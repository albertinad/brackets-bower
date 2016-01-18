/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 - 2016 Intel Corporation
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

/*global module, require */

module.exports = function (grunt) {
    "use strict";

    // load grunt tasks automatically
    require("load-grunt-tasks")(grunt);

    grunt.initConfig({

        pkg: grunt.file.readJSON("package.json"),

        jshint: {
            all: {
                src: [
                    "**/*.js"
                ],
                options: {
                    jshintrc: ".jshintrc",
                    jshintignore: ".jshintignore"
                }
            }
        },

        csslint: {
            options: {
                csslintrc: ".csslintrc"
            },
            strict: {
                options: {
                    "import": 2
                },
                src: [
                    "assets/**/*.css",
                    "!assets/fonts/**/*.css"
                ]
            }
        },

        jscs: {
            src: [
                "**/*.js",
                "!**/node_modules/**/*.js",
                "!**/bower_components/**/*.js",
                "!thirdparty/**/*.js"
            ],
            options: {
                config: ".jscs.json"
            }
        },

        zip: {
            extension: {
                src: [
                    "assets/**",
                    "nls/**",
                    "node/**",
                    "src/**",
                    "templates/**",
                    "thirdparty/**",
                    "LICENSE",
                    "*.js",
                    "*.json",
                    "*.css",
                    "!*.md",
                    "!gruntfile.js",
                    "!unittests.js"
                ],
                dest: "<%= pkg.name %>-<%= pkg.version %>.zip",
                compression: "DEFLATE"
            }
        }
    });

    grunt.registerTask("test", ["jshint", "csslint", "jscs"]);
    grunt.registerTask("package", ["test", "zip"]);
    grunt.registerTask("default", ["jshint"]);
};
