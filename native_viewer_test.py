#!/usr/bin/env python3
"""Test hidden Zotero browser verification and count saving in a disposable profile.

Uses a local HTTP fixture and programmatic browser APIs. No live library,
Google requests, mouse, keyboard, or desktop UI automation is used.
"""
import json
import os
from pathlib import Path
import subprocess
import shutil
import tempfile
import zipfile


WORKSPACE = Path(__file__).resolve().parent
zotero_bin = os.environ.get("ZOTERO_BIN") or shutil.which("zotero")
if not zotero_bin and Path("/Applications/Zotero.app/Contents/MacOS/zotero").exists():
    zotero_bin = "/Applications/Zotero.app/Contents/MacOS/zotero"
if not zotero_bin:
    raise SystemExit("Set ZOTERO_BIN to your Zotero executable to run this optional check")
root = Path(tempfile.mkdtemp(prefix="gscc-hidden-browser-"))
profile = root / "profile"
(profile / "extensions").mkdir(parents=True)
data = root / "data"
data.mkdir()
(root / "plugin.js").write_text((WORKSPACE / "src/gscc.js").read_text() + "\nthis.gscc=$__gscc;\n")
import http.server, threading
class Handler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        if 'verified=1' in self.path:
            content=b'<html><title>Test Scholar results</title><div id="gs_res_ccl_mid"><div class="gs_r gs_or gs_scl"><h3 class="gs_rt">Test paper</h3><a>Cited by 123</a></div></div></html>'
        else:
            content=b'<html><title>Verifying...</title><script>setTimeout(()=>location.replace("/scholar?q=Test&verified=1"),800)</script></html>'
        self.send_response(200); self.send_header('Content-Type','text/html');self.end_headers();self.wfile.write(content)
    def log_message(self,*args): pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),Handler)
threading.Thread(target=server.serve_forever,daemon=True).start()
script = r'''
function install(){} function uninstall(){} function shutdown(){}
function startup(){
 const {setTimeout,clearTimeout,setInterval,clearInterval}=ChromeUtils.importESModule('resource://gre/modules/Timer.sys.mjs');
 setTimeout(async()=>{
 const result={observations:[],visibleWindows:0};let hidden,observer;
 try{
 await Zotero.initializationPromise;
 if(Services.dirsvc.get('ProfD',Ci.nsIFile).path!==__PROFILE__)throw Error('Refusing to access a non-test profile');
 const scope={Zotero,Services,ChromeUtils,Ci,DOMParser,URL,setTimeout,clearTimeout};
 Services.scriptloader.loadSubScript(__SOURCE_URI__,scope);
 const gs=scope.gscc;
 const item=new Zotero.Item('journalArticle');
 item.setField('title','Test paper');item.setField('extra','My own annotation stays here.');
 item.setCreators([{firstName:'Test',lastName:'Author',creatorType:'author'}]);
 await item.saveTx();
 gs.app.generateItemUrl=async()=>__FIXTURE_URL__;
 gs.app.showStatus=message=>{(result.messages ||= []).push(message)};
 gs.app.openProgressWindow=async count=>{result.savedCount=count};
 const {HiddenBrowser:NativeHiddenBrowser}=ChromeUtils.importESModule('chrome://zotero/content/HiddenBrowser.mjs');
 scope.ChromeUtils={importESModule:uri=>{
  if(uri==='chrome://zotero/content/HiddenBrowser.mjs')return {HiddenBrowser:class extends NativeHiddenBrowser{
   constructor(options){super(options);hidden=this;}
  }};
  return ChromeUtils.importESModule(uri);
 }};
 Zotero.openInViewer=()=>{result.visibleWindows++;throw Error('A visible browser must not be opened')};
 observer=setInterval(()=>{
 try{
 const browser=hidden,doc=browser?.contentDocument;
 result.observations.push({remote:browser?.isRemoteBrowser,hasDoc:!!doc,url:doc?.URL,state:doc?.readyState,
 browserURI:browser?.currentURI?.spec,results:doc?gs.util.hasCitationResults(doc.documentElement.outerHTML):false});
 }catch(e){result.observations.push({error:String(e)})}
 },500);
 const completed=await gs.app.processCitationResponse(200,'<title>Verifying...</title>',null,__FIXTURE_URL__,item);
 result.extra=item.getField('extra');
 result.persistedExtra=await Zotero.DB.valueQueryAsync('SELECT value FROM itemData JOIN itemDataValues USING(valueID) WHERE itemID=? AND fieldID=?',[item.id,Zotero.ItemFields.getID('extra')]);
 result.hiddenDestroyed=hidden?._destroyed;
 result.ok=result.visibleWindows===0 && result.hiddenDestroyed && completed && result.savedCount===123 && result.extra.includes('GSCC: 0000123')
   && result.extra.includes('My own annotation stays here.') && result.persistedExtra===result.extra
   && result.observations.some(o=>o.remote && !o.hasDoc);
 }catch(e){result.error=String(e);result.stack=e.stack;}
 clearInterval(observer);try{hidden?.destroy()}catch{}
 await IOUtils.writeUTF8(__OUTPUT__,JSON.stringify(result,null,2));
 Services.startup.quit(Ci.nsIAppStartup.eForceQuit);
 },3000);
}
'''
for key, value in {
    "__SOURCE_URI__": (root / "plugin.js").as_uri(), "__FIXTURE_URL__": f"http://127.0.0.1:{server.server_port}/scholar?q=Test", "__PROFILE__": str(profile), "__FILE__": str(root / "sample.md"),
    "__WORKSPACE_URI__": WORKSPACE.as_uri(), "__OUTPUT__": str(root / "result.json"),
}.items():
    script = script.replace(key, json.dumps(value))
manifest = {"manifest_version": 2, "name": "Google Scholar viewer probe", "version": "1.0.0",
            "applications": {"zotero": {"id": "gscc-viewer-probe@example.invalid",
            "update_url": "https://invalid.example/no-updates.json",
            "strict_min_version": "8.0", "strict_max_version": "10.0.*"}}}
with zipfile.ZipFile(profile / "extensions/gscc-viewer-probe@example.invalid.xpi", "w") as z:
    z.writestr("manifest.json", json.dumps(manifest))
    z.writestr("bootstrap.js", script)
prefs = {"extensions.zotero.useDataDir": True, "extensions.zotero.dataDir": str(data),
         "extensions.zotero.firstRun2": False, "extensions.zotero.firstRunGuidance": False,
         "extensions.zotero.httpServer.enabled": False,
         "extensions.zoteroMacWordIntegration.skipInstallation": True,
         "extensions.zoteroOpenOfficeIntegration.skipInstallation": True,
         "extensions.autoDisableScopes": 0, "extensions.startupScanScopes": 15,
         "extensions.update.enabled": False, "extensions.getAddons.cache.enabled": False,
         "extensions.systemAddon.update.enabled": False, "app.update.enabled": False,
         "toolkit.telemetry.enabled": False}
(profile / "user.js").write_text("\n".join(
    "user_pref(" + json.dumps(k) + "," + json.dumps(v) + ");" for k, v in prefs.items()))
print(root, flush=True)
with (root / "process.log").open("w") as log:
    proc = subprocess.Popen([zotero_bin, "-headless",
                             "-no-remote", "-profile", str(profile), "-ZoteroDebugText"],
                            env={**os.environ, "MOZ_HEADLESS": "1"}, stdout=log, stderr=subprocess.STDOUT)
    try:
        proc.wait(timeout=45)
    except subprocess.TimeoutExpired:
        proc.kill()
        proc.wait()
if (root / "result.json").exists():
    result = json.loads((root / "result.json").read_text())
    print(json.dumps(result, indent=2))
    raise SystemExit(0 if result.get("ok") else 1)
print((root / "process.log").read_text()[-3500:])
raise SystemExit(1)
