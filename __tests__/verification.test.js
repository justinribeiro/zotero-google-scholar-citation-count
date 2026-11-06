const { $__gscc: gs } = require('../src/gscc.js');
const results = require('./__data__/gsResponseHasCitation.js').data;
const noResults = require('./__data__/gsResponseNoCitation.js').data;
const item = {
  getField: () => 'Test paper',
  getCreators: () => [{ lastName: 'Author' }],
};
const search = 'https://scholar.google.com/scholar?hl=en&q=Test%20paper';
const verifying =
  '<html><head><title>Verifying...</title></head><body><script>verify()</script></body></html>';

describe('Google verification and visible lookup failures', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
    jest.spyOn(gs.app, 'showStatus').mockImplementation(() => {});
    jest
      .spyOn(gs.util, 'loadSearchInBackground')
      .mockResolvedValue({ needsInteraction: true });
  });
  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  test('recognises HTTP 200 verification pages, redirects and CAPTCHA forms', () => {
    expect(gs.util.isVerificationPage(verifying)).toBe(true);
    expect(
      gs.util.isVerificationPage('', 'https://www.google.com/sgsync?url=x'),
    ).toBe(true);
    expect(
      gs.util.isVerificationPage('', 'https://scholar.google.com/sorry/index'),
    ).toBe(true);
    expect(gs.util.isVerificationPage('<form id="captcha-form"></form>')).toBe(
      true,
    );
    expect(gs.util.isVerificationPage(results, search)).toBe(false);
    expect(
      gs.util.isVerificationPage(results, 'https://example.com/sgsync'),
    ).toBe(false);
  });

  test('result detection tolerates reordered and extra CSS classes', () => {
    expect(
      gs.util.hasCitationResults('<div class="gs_scl extra gs_r gs_or"></div>'),
    ).toBe(true);
    expect(
      gs.util.hasCitationResults('<div class="extra gs_flb gs_fl"></div>'),
    ).toBe(true);
    expect(gs.util.hasCitationResults(verifying)).toBe(false);
  });

  test('uses the verified browser result once, without repeating the blocked XHR', async () => {
    jest.spyOn(gs.app, 'generateItemUrl').mockResolvedValue(search);
    const viewer = jest
      .spyOn(gs.util, 'openRecaptchaWindow')
      .mockResolvedValue({
        status: 200,
        responseText: results,
        responseURL: search,
      });
    const request = jest.spyOn(gs.app, 'retrieveCitationData');
    const update = jest.spyOn(gs.app, 'updateItem').mockResolvedValue();
    expect(
      await gs.app.processCitationResponse(
        200,
        verifying,
        null,
        'https://www.google.com/sgsync?url=x',
        item,
      ),
    ).toBe(true);
    expect(viewer).toHaveBeenCalledWith(search);
    expect(update).toHaveBeenCalledWith(item, 1028);
    expect(request).not.toHaveBeenCalled();
    expect(gs.app.showStatus).toHaveBeenCalledWith('gscc-status-background');
  });

  test.each([200, 403])(
    'cancellation preserves counts after HTTP %s',
    async (status) => {
      jest.spyOn(gs.app, 'generateItemUrl').mockResolvedValue(search);
      jest.spyOn(gs.util, 'openRecaptchaWindow').mockResolvedValue(null);
      const update = jest.spyOn(gs.app, 'updateItem');
      expect(
        await gs.app.processCitationResponse(
          status,
          verifying,
          null,
          search,
          item,
        ),
      ).toBe(false);
      expect(update).not.toHaveBeenCalled();
      expect(gs.app.showStatus).toHaveBeenLastCalledWith(
        'gscc-status-incomplete',
      );
    },
  );

  test('does not open endless verification windows', async () => {
    const viewer = jest.spyOn(gs.util, 'openRecaptchaWindow');
    expect(
      await gs.app.processCitationResponse(
        200,
        verifying,
        null,
        search,
        item,
        null,
        true,
      ),
    ).toBe(false);
    expect(viewer).not.toHaveBeenCalled();
  });

  test.each([0, 404, 429, 500])(
    'HTTP %s produces feedback without overwriting the count',
    async (status) => {
      const update = jest.spyOn(gs.app, 'updateItem');
      expect(
        await gs.app.processCitationResponse(status, '', null, search, item),
      ).toBe(false);
      expect(update).not.toHaveBeenCalled();
      expect(gs.app.showStatus).toHaveBeenCalledWith(
        expect.stringMatching(/^gscc-status-/),
      );
    },
  );

  test('a real empty search produces visible feedback', async () => {
    const update = jest.spyOn(gs.app, 'updateItem');
    expect(
      await gs.app.processCitationResponse(200, noResults, null, search, item),
    ).toBeNull();
    expect(update).not.toHaveBeenCalled();
    expect(gs.app.showStatus).toHaveBeenCalledWith('gscc-status-no-result');
  });

  test('unparseable result preserves the old count', async () => {
    const update = jest.spyOn(gs.app, 'updateItem');
    expect(
      await gs.app.processCitationResponse(
        200,
        '<div class="gs_r gs_or gs_scl"></div>',
        null,
        search,
        item,
      ),
    ).toBeNull();
    expect(update).not.toHaveBeenCalled();
  });

  test('viewer waits through redirects and rejects results for another query', async () => {
    const makePage = (url) => ({
      documentURI: { spec: url },
      getActor: (name) => {
        expect(name).toBe('PageData');
        return { sendQuery: jest.fn().mockResolvedValue(results) };
      },
    });
    const browser = {
      isRemoteBrowser: true,
      browsingContext: {
        currentWindowGlobal: makePage(search.replace('Test%20paper', 'Other')),
      },
      get contentDocument() {
        throw new Error('Remote documents cannot be accessed directly');
      },
    };
    const viewer = {
      closed: false,
      close: jest.fn(),
      document: { querySelector: () => browser },
    };
    const open = jest.spyOn(Zotero, 'openInViewer').mockReturnValue(viewer);
    const sleep = jest.spyOn(gs.util, 'sleep').mockImplementation(async () => {
      browser.browsingContext.currentWindowGlobal = makePage(search);
    });
    const response = await gs.util.openRecaptchaWindow(search);
    expect(sleep).toHaveBeenCalledTimes(1);
    expect(response.responseURL).toBe(search);
    expect(response.responseText).toContain('gs_r');
    expect(open).toHaveBeenCalledWith(search, { allowJavaScript: true });
    expect(viewer.close).toHaveBeenCalledTimes(1);
  });

  test('viewer closure cancels and deadline ends the wait', async () => {
    const viewer = { closed: false, document: { querySelector: () => null } };
    jest.spyOn(Zotero, 'openInViewer').mockReturnValue(viewer);
    jest.spyOn(gs.util, 'sleep').mockImplementation(async () => {
      viewer.closed = true;
    });
    expect(await gs.util.openRecaptchaWindow(search)).toBeNull();
    viewer.closed = false;
    let now = 0;
    jest.spyOn(Date, 'now').mockImplementation(() => now);
    gs.util.sleep.mockImplementation(async () => {
      now += 120000;
    });
    expect(await gs.util.openRecaptchaWindow(search)).toBeNull();
  });

  test('discards an actor reply if the browser navigated to another page', async () => {
    let resolveHTML;
    const browser = {
      browsingContext: {
        currentWindowGlobal: {
          documentURI: { spec: search },
          getActor: () => ({
            sendQuery: () =>
              new Promise((resolve) => {
                resolveHTML = resolve;
              }),
          }),
        },
      },
    };
    const pending = gs.util.readViewerPage(browser);
    browser.browsingContext.currentWindowGlobal = {
      documentURI: { spec: 'https://example.com' },
    };
    resolveHTML(results);
    expect(await pending).toBeNull();
  });

  test('an unresponsive content process times out and releases its timer', async () => {
    jest.useFakeTimers();
    const browser = {
      browsingContext: {
        currentWindowGlobal: {
          documentURI: { spec: search },
          getActor: () => ({ sendQuery: () => new Promise(() => {}) }),
        },
      },
    };
    const failure = expect(gs.util.readViewerPage(browser)).rejects.toThrow(
      'Browser page read timed out',
    );
    await jest.advanceTimersByTimeAsync(3000);
    await failure;
    expect(jest.getTimerCount()).toBe(0);
  });

  test('request timeout and network errors terminate instead of hanging', async () => {
    let xhr;
    global.XMLHttpRequest.mockImplementation(
      () =>
        (xhr = {
          open() {},
          send() {},
          setRequestHeader() {},
          readyState: 1,
        }),
    );
    const pending = gs.util.request({ method: 'GET', url: search });
    expect(xhr.timeout).toBe(30000);
    xhr.ontimeout();
    await expect(pending).rejects.toThrow('timed out');
    const failed = gs.util.request({ method: 'GET', url: search });
    xhr.onerror();
    await expect(failed).rejects.toThrow('Could not connect');
  });
});
