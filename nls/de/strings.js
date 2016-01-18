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

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define */

define({
    "TITLE_BOWER": "Bower",
    "TITLE_WARNING": "Bower Warnung",
    "TITLE_ERROR": "Bower Fehler",
    "TITLE_SHORTCUT": "Installieren via Bower...",
    "TITLE_QUICK_OPEN": "Installieren via Bower",
    "TITLE_SET_CWD": "Als aktives Bower Verzeichnis festlegen",
    "TITLE_CONFIG": "Konfiguration",
    "TITLE_DEPENDENCIES": "Abhängigkeiten",
    "TITLE_SETTINGS": "Bower Einstellungen",
    "TITLE_PROJECT_PACKAGES": "Projekt Pakete",
    "BOWERRC_NOT_FOUND": ".bowerrc Datei nicht gefunden!",
    "BOWER_JSON_NOT_FOUND": "bower.json Datei nicht gefunden!",
    "INSTALLED_PACKAGES_NOT_FOUND": "Noch keine Pakete installiert",
    "CREATE": "Erstellen",
    "RELOAD": "Neu laden",
    "DELETE": "Entfernen",
    "STATUS_BOWER_LOADING": "Bower Registry laden",
    "STATUS_BOWER_READY": "Bower Registry bereit",
    "STATUS_BOWER_NOT_LOADED": "Die Bower Registry konnte nicht geladen werden",
    "STATUS_INSTALLING_PKG": "Installiere {0} ...",
    "STATUS_PKG_INSTALLED": "{0} wurde installiert",
    "STATUS_ERROR_INSTALLING": "Fehler beim installieren von {0}",
    "TEXT_CLOSE": "Schließen",
    "TEXT_CANCEL": "Abbrechen",
    "TEXT_SAVE": "Speichern",
    "TEXT_OK": "OK",
    "TEXT_RELOAD_DEFAULTS": "Standards wiederherstellen",
    "TEXT_SETTINGS_RELOAD_TIME": "Zeit die Bower Registry neu zu laden",
    "TEXT_SETTINGS_RELOAD_TIME_UNIT": "(m)",
    "TEXT_SETTINGS_SAVE_PACKAGES": "Pakete, die via QuickInstall installiert wurden, in bower.json speichern",
    "GIT_NOT_FOUND_TITLE": "Git wurde auf ihrem System nicht gefunden",
    "GIT_NOT_FOUND_DESCRIPTION": "Die Brackets-Bower Erweiterung hat im System PATH nach Git gesucht.\n\nUm Bower benutzen zu können, muss Git installiert und im System PATH konfiguriert werden, \num Pakete downloaden und installieren zu können.\nBei der Benutzung dieser Erweiterung kann es zu Fehlern kommen.",
    "COMMAND_INSTALL": "Installieren",
    "COMMAND_PRUNE": "Kürzen",
    "COMMAND_UNINSTALL": "Deinstallieren",
    "COMMAND_UPDATE": "Aktualisieren",
    "TRACK_IN_BOWERJSON": "Hinzufügen",
    "REMOVE_FROM_BOWERJSON": "Entfernen",
    "STATUS_EXECUTING_COMMAND": "Befehl \"{0}\" wird ausgeführt",
    "STATUS_ERROR_EXECUTING_COMMAND": "Fehler beim Ausführen des Befehls \"{0}\"",
    "STATUS_SUCCESS_INSTALLING": "Pakete installiert",
    "STATUS_SUCCESS_EXECUTING_COMMAND": "Befehl \"{0}\" ausgeführt",
    "STATUS_NO_PACKAGES_INSTALLED": "Es gibt kein Paket zum Installieren",
    "ERROR_RELOAD_TIME_VALUE": "* Die Zeit muss größer als {0} Minuten sein",
    "TITLE_ERROR_UNINSTALLING": "Fehler beim Deinstallieren des Bower Pakets",
    "SUMMARY_ERROR_UNINSTALLING_DEPENDANTS": "Das Paket \"{0}\" hat abhängige Pakete",
    "NOTE_QUESTION_CONTINUE_UNINSTALLING": "Bist du sicher, dass du das deinstallieren möchtest?",
    "SUMMARY_ERROR": "Uups! Es ist ein Fehler aufgetreten.",
    "SYNC_WITH_PROJECT_TITLE": "Synchronisieren mit Paketen dieses Projekts",
    "SYNC_WITH_BOWER_JSON_TITLE": "Synchronisieren mit bower.json",
    "SYNC_PROJECT_MESSAGE": "Synchronisiere Projekt",
    "SYNC_PROJECT_SUCCESS_MESSAGE": "Projekt synchronisiert",
    "PROJECT_OUT_OF_SYNC_MESSAGE": "Nicht mehr synchron",
    "PKG_STATUS_MISSING": "Fehlt",
    "PKG_STATUS_NOT_TRACKED": "Nicht protokolliert",
    "PKG_STATUS_VERSIONS": "Versionen stimmen nicht überein",
    "ERROR_DEFAULT_MSG": "Unbekannter interner Bower Fehler.",
    "ERROR_MSG_MALFORMED_BOWER_JSON": "Die bower.json Datei ist fehlerhaft. Bitte korrigiere das.",
    "ERROR_MSG_MALFORMED": "Unbekannter interner Bower Fehler.",
    "ERROR_MSG_MALFORMED_FILE": "Eine Metadaten Datei (\"bower.json\" oder \".bowerrc\") ist fehlerhaft oder entspricht nicht der Spezifikation.",
    "ERROR_MSG_NO_TARGET": "Das Ziel für den Download oder um mehr Informationen über Pakete zu erhalten, existiert nicht oder ist fehlerhaft.",
    "ERROR_MSG_NO_SOURCE": "Die Quelle einiger Pakete wurde nicht gefunden oder ist fehlerhaft",
    "ERROR_MSG_NO_RESOLVER": "Bower konnte keinen spezifischen Resolver finden um Informationen über einige Pakete zu erhalten.",
    "ERROR_MSG_DEPENDENCY_CONFLICT": "Keine passende Version für \"{0}\" gefunden. Bitte korrigiere die bower.json Konfiguration.",
    "ERROR_MSG_NO_PACKAGE_INSTALLED": "Der Vorgang konnte nicht durchgeführt werden, weil keine Pakete installiert sind.",
    "ERROR_MSG_NO_PACKAGE_UPDATED": "Das Paket wurde nicht aktualisiert, weil keine Änderungen vorgenommen wurden.",
    "ERROR_MSG_NO_UPDATE_DATA": "Es gibt keine Daten um dieses Paket zu aktualisieren",
    "ERROR_NO_BOWER_JSON": "Die erforderliche bower.json Datei existiert nicht.",
    "ERROR_MSG_NOTHING_TO_SYNC": "Es gibt kein Paket, das synchronisiert werden muss.",
    "ERROR_MSG_DOWNLOAD_INCOMPLETE": "Der Download ist unvollständig. Bitte versuche es später erneut.",
    "ERROR_MSG_CONNECTION_PROBLEM": "Du hast derzeit keine Internetverbindung. Bitte prüfe sie und versuche es erneut."
});
