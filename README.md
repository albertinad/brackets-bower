# Bower extension for [Brackets](http://brackets.io) [![Build Status](https://travis-ci.org/albertinad/brackets-bower.svg?branch=master)](https://travis-ci.org/albertinad/brackets-bower)

This Brackets extension lets you manage your application's front-end dependencies using the bower.json file,
and quickly install a package from [Bower](http://bower.io) into your current project using a
Quick Open-style interface (Quick Install). You can also configure bower using the .bowerrc configuration file.

### Installing into Brackets

1. Choose **File > Extension Manager...**
2. Search for "Install from Bower"
3. Click the Install button

**Note:** For some packages to install properly, you'll need to have git installed as well.

### Using

1. Choose **File > Install from Bower...** or hit **Cmd/Ctrl-Alt-B**
2. Start typing the name of a Bower package. (The first time you do this in a run,
   you might need to wait a bit to see results.)
3. Choose a package

The package will be installed into a "bower_components" folder in your current project.

You can also access this from normal Quick Open (Cmd/Ctrl-Shift-O) by typing a "+"
before the package name.

### Proxy Support

The extension takes the proxy configuration from the Brackets default [Preferences](https://github.com/adobe/brackets/wiki/How-to-Use-Brackets#preferences),
the "proxy" preference. In order to make it work behind a proxy, you need to setup the proxy value
through the default Preferences.

1. Choose **Debug > Open Preferences File**
2. Add a new entry `"proxy": "proxyValue"`

Some bower commands like "install" rely on the git configuration. To support a proxy, you need
to configure the http and https proxy from your global git configuration on your system.

1. Open a console/terminal
2. Set up the global proxy:
```
git config --global --set http.proxy proxyValue
git config --global --set https.proxy proxyValue
```

### bower.json

You can create, edit and delete the bower.json file, install and prune dependencies. Quick Install (Install from Bower...) supports
configuration to automatically save the installed package to the existing bower.json.
The bower.json file is always created with default data or with current dependencies if any. This also works when you create the
file outside the extension using the file system.

* Known issue: when creating the file without using the Bower Panel, you need to close the recently created file in the working set and
re-open it to see the default file content. This issue will be fixed for the next version.

### .bowerrc

The extension automatically detects if the .bowerrc file exists in the root project.
It allows you to create a default one and to delete it later. All the changes made to
the configurable properties are automatically propagated to bower once the file is
saved.

### Extension Settings

Configure the brackets-bower extension by choosing the time to reload the packages catalog when searching using Quick Install,
and select to save or not the packages to the bower.json when installing using Quick Install.

### Problems? Suggestions?

[File an issue!](https://github.com/albertinad/brackets-bower/issues)
