# Changelog

## v2.0.0
* Basic support of bower.json to handle dependencies for production and development.
    - Create the file with the existent dependencies if any, open it in the editor and remove it.
    - Check if there are some packages installed and added them to the recently created bower.json file.
* Bower commands: install and prune. Now it is possible to install and prune the dependencies from
the bower.json file.
* Configure the extension using brackets settings: select to save the packages installed through
Quick Install (Install from Bower) to the package.json and select the time for reloading the
packages catalog.
* Check if Git exists on the system and warn the user if it isn't available.
* New icons for panels by [navelpluisje](https://github.com/navelpluisje)
* Bug fixing and improvements.

## v0.1.7
* Use bower cache list while loading the Bower packages from the registry.

## v0.1.6
* ".bowerrc" configuration file is now supported. Automatically checks if the ".bowerrc"
file exists, create one at the root project and deletes it. Update the configurable
properties and those changes will be automatically loaded by bower.
* Minor improvements.
* Test suite updated and migrated to the supported API.

## v0.1.5
* Proxy support through the default Brackets Preferences.
* i18n support: English as default locale and translations for Spanish.

## v0.1.4
* Adding feedback when the Bower registry is loading and finishes loading.
* Update the key binding command for "Bower install" to "Ctrl+Alt+B".
* Update bower module to version 1.3.12.
* Minor fixes.
