const { $__gscc: gs } = require('../src/gscc.js');
const results = require('./__data__/gsResponseHasCitation.js').data;
const search = 'https://scholar.google.com/scholar?q=Test';

describe('Hidden Scholar browser', () => {
  let browser;
  beforeEach(() => {
    jest.restoreAllMocks();
    const page = {
      documentURI: { spec: search },
      getActor: () => ({ sendQuery: async () => results }),
    };
    browser = {
      load: jest.fn().mockResolvedValue(true),
      destroy: jest.fn(),
      browsingContext: { currentWindowGlobal: page },
    };
    global.ChromeUtils = {
      importESModule: jest.fn(() => ({
        HiddenBrowser: jest.fn(() => browser),
      })),
    };
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('reads results invisibly and destroys the browser', async () => {
    const visible = jest.spyOn(Zotero, 'openInViewer');
    expect((await gs.util.loadSearchInBackground(search)).responseText).toBe(
      results,
    );
    expect(ChromeUtils.importESModule).toHaveBeenCalledWith(
      'chrome://zotero/content/HiddenBrowser.mjs',
    );
    expect(visible).not.toHaveBeenCalled();
    expect(browser.destroy).toHaveBeenCalledTimes(1);
  });

  test('waits for automatic verification without opening windows', async () => {
    let html = '<title>Verifying...</title>';
    browser.browsingContext.currentWindowGlobal.getActor = () => ({
      sendQuery: async () => html,
    });
    const visible = jest.spyOn(Zotero, 'openInViewer');
    jest.spyOn(gs.util, 'sleep').mockImplementation(async () => {
      html = results;
    });
    expect((await gs.util.loadSearchInBackground(search)).responseText).toBe(
      results,
    );
    expect(visible).not.toHaveBeenCalled();
    expect(browser.destroy).toHaveBeenCalledTimes(1);
  });

  test('only an explicit CAPTCHA asks for interaction', async () => {
    browser.browsingContext.currentWindowGlobal.getActor = () => ({
      sendQuery: async () => '<form id="captcha-form"></form>',
    });
    expect(await gs.util.loadSearchInBackground(search)).toEqual({
      needsInteraction: true,
    });
    expect(browser.destroy).toHaveBeenCalledTimes(1);
  });

  test('failed load still destroys its browser', async () => {
    browser.load.mockResolvedValue(false);
    expect(await gs.util.loadSearchInBackground(search)).toBeNull();
    expect(browser.destroy).toHaveBeenCalledTimes(1);
    browser.load.mockRejectedValue(new Error('Connection failed'));
    await expect(gs.util.loadSearchInBackground(search)).rejects.toThrow(
      'Connection failed',
    );
    expect(browser.destroy).toHaveBeenCalledTimes(2);
  });

  test('verification that does not finish times out without a visible window', async () => {
    browser.browsingContext.currentWindowGlobal.getActor = () => ({
      sendQuery: async () => '<title>Verifying...</title>',
    });
    let now = 0;
    jest.spyOn(Date, 'now').mockImplementation(() => now);
    jest.spyOn(gs.util, 'sleep').mockImplementation(async () => {
      now += 20000;
    });
    const visible = jest.spyOn(Zotero, 'openInViewer');
    expect(await gs.util.loadSearchInBackground(search)).toBeNull();
    expect(visible).not.toHaveBeenCalled();
    expect(browser.destroy).toHaveBeenCalledTimes(1);
  });

  test('blocked HTTP response completes via hidden results without a visible window', async () => {
    jest.spyOn(gs.app, 'generateItemUrl').mockResolvedValue(search);
    jest.spyOn(gs.app, 'showStatus').mockImplementation(() => {});
    const update = jest.spyOn(gs.app, 'updateItem').mockResolvedValue();
    const visible = jest.spyOn(Zotero, 'openInViewer');
    expect(
      await gs.app.processCitationResponse(
        200,
        '<title>Verifying...</title>',
        null,
        search,
        {},
      ),
    ).toBe(true);
    expect(update).toHaveBeenCalledWith({}, 1028);
    expect(visible).not.toHaveBeenCalled();
    expect(browser.destroy).toHaveBeenCalledTimes(1);
  });
});
