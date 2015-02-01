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
                    "!**/node_modules/**/*.js"
                ],
                options: {
                    jshintrc: ".jshintrc"
                }
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
                    "*.md"
                ],
                dest: "<%= pkg.name %>-<%= pkg.version %>.zip",
                compression: 'DEFLATE'
            }
        }
    });

    grunt.registerTask("package", ["jshint", "zip"]);
    grunt.registerTask("default", ["jshint"]);
};
