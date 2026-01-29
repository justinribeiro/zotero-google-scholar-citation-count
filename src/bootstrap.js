'use strict';
/* global Components, Services */
/* global $__gscc */

const { classes: Cc, utils: Cu, interfaces: Ci } = Components;
let chromeHandle;

function log(msg) {
  Zotero.debug('GSCC: ' + msg);
}

function install() {
  log('Installed GSCC 5.0.0');
}

async function startup({ id, version, rootURI }, reason) {
  log('Starting GSCC 5.0.0');

  var aomStartup = Cc['@mozilla.org/addons/addon-manager-startup;1'].getService(
    Ci.amIAddonManagerStartup,
  );
  var manifestURI = Services.io.newURI(rootURI + 'manifest.json');
  chromeHandle = aomStartup.registerChrome(manifestURI, [
    ['content', 'gscc', rootURI],
  ]);

  Services.scriptloader.loadSubScript(`${rootURI}/gscc.js`);

  Zotero.PreferencePanes.register({
    pluginID: 'justin@justinribeiro.com',
    src: `${rootURI}prefs.xhtml`,
  });

  $__gscc.app.init({ id, version, rootURI });
  $__gscc.app.addToAllWindows();
  await $__gscc.app.main();
}

function onMainWindowLoad({ window }) {
  $__gscc.app.addToWindow(window);
}

function onMainWindowUnload({ window }) {
  $__gscc.app.removeFromWindow(window);
}

function shutdown() {
  $__gscc.app.removeFromAllWindows();
}

function uninstall() {
  $__gscc.app.removeFromAllWindows();
}
