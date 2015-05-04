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
                    "**/*.js",
                    "!**/node_modules/**/*.js",
                    "!**/bower_components/**/*.js"
                ],
                options: {
                    jshintrc: ".jshintrc"
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
                "!**/bower_components/**/*.js"
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
