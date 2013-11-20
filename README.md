## Bower extension for [Brackets](http://brackets.io)

This Brackets extension lets you quickly install a package from [Bower](http://bower.io)
into your current project using a Quick Open-style interface.

### Installing into Brackets

1. Choose **File > Extension Manager...**
2. Click on the Available tab
3. Search for "Install from Bower"
4. Click the Install button

Note that this will only work with Brackets Sprint 34 or later.

### Using

1. Choose **File > Install from Bower...** or hit **Cmd/Ctrl-Shift-B**
2. Start typing the name of a Bower package. (The first time you do this in a run,
   you might need to wait a bit to see results.)
3. Choose a package

The package will be installed into a "bower_components" folder in your current project.

You can also access this from normal Quick Open (Cmd/Ctrl-Shift-O) by typing a "+" 
before the package name. (I'm not totally convinced Quick Open is the right UI for
this--would love to get feedback.)

### Problems? Suggestions?

[File an issue!](https://github.com/njx/brackets-bower)
