var $__gscc;

function log(msg) {
  Zotero.debug('GSCC:' + msg);
}

function install() {
  log('Installed GSCC 4.0.0');
}

async function startup({ id, version, rootURI }) {
  log('Starting GSCC 4.0.0');

  Services.scriptloader.loadSubScript(`${rootURI}chrome/content/gscc.js`);
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
