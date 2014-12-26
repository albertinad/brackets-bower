## Bower extension for [Brackets](http://brackets.io)

This Brackets extension lets you quickly install a package from [Bower](http://bower.io)
into your current project using a Quick Open-style interface.

### Installing into Brackets

1. Choose **File > Extension Manager...**
2. Search for "Install from Bower"
3. Click the Install button

Note that this will only work with Brackets Sprint 34 or later.

**Note:** For some packages to install properly, you'll need to have git installed as well.

### Using

1. Choose **File > Install from Bower...** or hit **Cmd/Ctrl-Alt-B**
2. Start typing the name of a Bower package. (The first time you do this in a run,
   you might need to wait a bit to see results.)
3. Choose a package

The package will be installed into a "bower_components" folder in your current project.

You can also access this from normal Quick Open (Cmd/Ctrl-Shift-O) by typing a "+"
before the package name. (I'm not totally convinced Quick Open is the right UI for
this--would love to get feedback.)

### Proxy Support

The extension takes the proxy configuration from the Brackets default [Preferences](https://github.com/adobe/brackets/wiki/How-to-Use-Brackets#preferences),
the "proxy" preference. In order to make it work behind a proxy, you need to setup the proxy value
through the default Preferences.

1. Choose **Debug > Open Preferences File
2. Add a new entry "proxy": "proxyValue"

Some bower commands like "install", relies on Git configuration. To support proxy, you need
to configure http and https proxy from your global git configuration in your system.

1. Open a console/terminal
2. Setup the global proxy,
git config --global --set http.proxy proxyValue
git config --global --set https.proxy proxyValue

### .bowerrc

The extension automatically detects if the .bowerrc file exists at the root project.
It allows to create a default one and to delete it later. All the changes made to
the configurable properties are automatically propagated to bower once the file is
saved.

### Problems? Suggestions?

[File an issue!](https://github.com/njx/brackets-bower/issues)
