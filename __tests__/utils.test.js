const gscc = require('../chrome/content/zsc.js');
const hasCitation = require('./__data__/gsResponseHasCitation.js');
const noCitation = require('./__data__/gsResponseNoCitation.js');
const hasRecaptcha = require('./__data__/gsResponseHasRecaptcha');

describe('Verify $__gsccUtil', () => {
  it('check randomInteger() for proper output ', async () => {
    const test = gscc.$__gsccUtil.randomInteger(1000, 2000);
    expect(test).toBeGreaterThan(1000);
    expect(test).toBeLessThan(2000);
  });
  it('check padCountWithZeros() length ', async () => {
    const test = gscc.$__gsccUtil.padCountWithZeros('1234', 7);
    expect(test.length).toEqual(7);
  });
  it('hasCitationResults() should return true with result data in response ', async () => {
    const test = gscc.$__gsccUtil.hasCitationResults(`${hasCitation.data}`);
    expect(test).toBe(true);
  });
  it('hasCitationResults() should return false with no result data in response ', async () => {
    const test = gscc.$__gsccUtil.hasCitationResults(`${noCitation.data}`);
    expect(test).toBe(false);
  });
  it('hasRecaptcha() should return false with result data in response ', async () => {
    const test = gscc.$__gsccUtil.hasRecaptcha(`${hasCitation.data}`);
    expect(test).toBe(false);
  });
  it('hasRecaptcha() should return true with recaptcha data in response ', async () => {
    const test = gscc.$__gsccUtil.hasRecaptcha(`${hasRecaptcha.data}`);
    expect(test).toBe(true);
  });
  it('openRecaptchaWindow() should open viewer', async () => {
    gscc.$__gsccUtil.openRecaptchaWindow('https://justinribeiro.com');
    expect(global.Zotero.viewerOpen).toBe(true);
  });
  it('openRecaptchaWindow() should open viewer in standalone', async () => {
    global.Zotero.openInViewer = undefined;
    gscc.$__gsccUtil.openRecaptchaWindow('https://justinribeiro.com');
    expect(global.Zotero.viewerOpen).toBe(true);
  });
  it('openRecaptchaWindow() should open viewer in launch', async () => {
    global.Zotero.openInViewer = undefined;
    global.ZoteroStandalone = undefined;
    gscc.$__gsccUtil.openRecaptchaWindow('https://justinribeiro.com');
    expect(global.Zotero.viewerOpen).toBe(true);
  });
  it('openRecaptchaWindow() should open viewer in gBrowser', async () => {
    global.Zotero.openInViewer = undefined;
    global.ZoteroStandalone = undefined;
    global.Zotero.launchURL = undefined;
    gscc.$__gsccUtil.openRecaptchaWindow('https://justinribeiro.com');
    expect(global.Zotero.viewerOpen).toBe(true);
  });
});
