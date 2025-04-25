const base = require('../src/gscc.js');
const hasCitation = require('./__data__/gsResponseHasCitation.js');
const hasCitation2023Version = require('./__data__/gsResponseHasCitationJuly2023GSUpdate.js');
const hasCitation2023VersionAltReturn = require('./__data__/gsResponseHasCitationJuly2023GSUpdateAltSearchCase.js');
const noCitation = require('./__data__/gsResponseNoCitation.js');
const hasPaperNoCitations = require('./__data__/gsResponseHasPaperNoCitations.js');
const hasRecaptcha = require('./__data__/gsResponseHasRecaptcha.js');
const singleItemWithCount = require('./__data__/zoteroItemsListSingleItemWithCount.js');
const singleItemWithCountLegacyFormat = require('./__data__/zoteroItemsListSingleItemWithCountLegacyFormat.js');
const singleItemNoCount = require('./__data__/zoteroItemsListSingleItemWithNoCount.js');
const singleItemNoTitle = require('./__data__/zoteroItemsListSingleItemWithNoTitle.js');
const singleItemHtmlTitle = require('./__data__/zoteroItemsListSingleItemWithHtmlTitle.js');
const singleItemNoCreators = require('./__data__/zoteroItemsListSingleItemWithNoCreators.js');
const itemsList = require('./__data__/zoteroItemsList.js');
const extraFieldTester = require('./__data__/extraFieldExtractorData.js');

window.alert = jest.fn();
jest.useRealTimers();

describe('Verify $__gscc.app sanity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers('modern');
    jest.setSystemTime(new Date(2024, 12, 1));
  });

  it('init() should set app', () => {
    const id = 'gscc';
    const version = '4.0.0';
    const rootURI = 'justinribeiro.com';
    base.$__gscc.app.init({ id, version, rootURI });

    expect(base.$__gscc.app.__initialized).toBe(true);
  });

  it('getCiteCount() should return number', () => {
    const test = base.$__gscc.app.getCiteCount(hasCitation.data);
    expect(test).toBe(1028);
  });

  it('getCiteCount() should return number from July 2023 GS UI Update', () => {
    const test = base.$__gscc.app.getCiteCount(hasCitation2023Version.data);
    expect(test).toBe(2468);
  });

  it('getCiteCount() should return number from July 2023 GS UI Update - Alt Case!', () => {
    const test = base.$__gscc.app.getCiteCount(
      hasCitation2023VersionAltReturn.data,
    );
    expect(test).toBe(2468);
  });

  it('getCiteCount() should return -1, no data', () => {
    const test = base.$__gscc.app.getCiteCount(noCitation.data);
    expect(test).toBe(-1);
  });

  it('getCiteCount() should return 0, no count', () => {
    const test = base.$__gscc.app.getCiteCount(hasPaperNoCitations.data);
    expect(test).toBe(0);
  });

  it('buildcitecountstring() string + count', () => {
    const count = base.$__gscc.app.getCiteCount(hasCitation.data);
    const test = base.$__gscc.app.buildCiteCountString(count);
    expect(test).toEqual('GSCC: 0001028 2025-01-01T08:00:00.000Z 0');
  });

  it('buildcitecountstring() string + no data', () => {
    const count = base.$__gscc.app.getCiteCount(noCitation.data);
    const test = base.$__gscc.app.buildCiteCountString(count);
    expect(test).toEqual('GSCC: NoCitationData 2025-01-01T08:00:00.000Z 0');
  });

  it('generateItemUrl() should output string', async () => {
    const string = await base.$__gscc.app.generateItemUrl(
      singleItemNoCount.data,
    );
    expect(string).toEqual(
      'https://scholar.google.com/scholar?hl=en&q=%22Potential%20Biases%20in%20Leadership%20Measures:%20How%20Prototypes,%20Leniency,%20and%20General%20Satisfaction%20Relate%20to%20Ratings%20and%20Rankings%20of%20Transformational%20and%20Transactional%20Leadership%20Constructs%22&as_epq=&as_occt=title&num=1&as_sauthors=Bass+Avolio',
    );
  });

  it('generateItemUrl() should handle HTML in title', async () => {
    const string = await base.$__gscc.app.generateItemUrl(
      singleItemHtmlTitle.data,
    );
    expect(string).toEqual(
      'https://scholar.google.com/scholar?hl=en&q=%22(Y0.25Yb0.25Er0.25Lu0.25)2(Zr0.5Hf0.5)2O7:%20a%20defective%20fluorite%20structured%20high%20entropy%20ceramic%20with%20low%20thermal%20conductivity%20and%20close%20thermal%20expansion%20coefficient%20to%20Al2O3%22&as_epq=&as_occt=title&num=1&as_sauthors=Zhao+Chen+Xiang+Dai+Wang',
    );
  });

  it('updateItem() should change extra field when legacy data present', () => {
    const item = singleItemWithCountLegacyFormat.data;
    const extra = jest.spyOn(item, 'setField');
    const tx = jest.spyOn(item, 'saveTx');
    base.$__gscc.app.updateItem(item, 400);
    expect(extra).toHaveBeenCalled();
    expect(tx).toHaveBeenCalled();
    expect(item.getField('extra')).toEqual(
      'GSCC: 0000400 2025-01-01T08:00:00.000Z 0.22 \nPublisher: SAGE Publications Inc',
    );
  });

  it('updateItem() should change extra field when data present', () => {
    const item = singleItemWithCount.data;
    const extra = jest.spyOn(item, 'setField');
    const tx = jest.spyOn(item, 'saveTx');
    base.$__gscc.app.updateItem(item, 1000);
    expect(extra).toHaveBeenCalled();
    expect(tx).toHaveBeenCalled();
    expect(item.getField('extra')).toEqual(
      'GSCC: 0001000 2025-01-01T08:00:00.000Z 0.54 \nPublisher: SAGE Publications Inc',
    );
  });

  it('updateItem() should change extra field when no data present', () => {
    const item = { ...singleItemNoCount.data };
    const extra = jest.spyOn(item, 'setField');
    const tx = jest.spyOn(item, 'saveTx');
    base.$__gscc.app.updateItem(item, 10);
    expect(extra).toHaveBeenCalled();
    expect(tx).toHaveBeenCalled();
    expect(item.getField('extra')).toEqual(
      'GSCC: 0000010 2025-01-01T08:00:00.000Z 0.01 \n',
    );
  });

  it('hasRequiredFields() should return true with sane data', () => {
    const item = { ...singleItemNoCount.data };
    const test = base.$__gscc.app.hasRequiredFields(item);
    expect(test).toBe(true);
  });

  it('hasRequiredFields() should return false with no title', () => {
    const item = singleItemNoTitle.data;
    const test = base.$__gscc.app.hasRequiredFields(item);
    expect(test).toBe(false);
  });

  it('hasRequiredFields() should return false with no creators', () => {
    const item = singleItemNoCreators.data;
    const test = base.$__gscc.app.hasRequiredFields(item);
    expect(test).toBe(false);
  });

  it('processCitationResponse() 200 should set item data', () => {
    const item = { ...singleItemNoCount.data };
    const targetUrl = base.$__gscc.app.generateItemUrl(singleItemNoCount.data);
    base.$__gscc.app.processCitationResponse(
      200,
      hasCitation.data,
      null,
      targetUrl,
      item,
      (item, citeCount) => {
        base.$__gscc.app.updateItem(item, citeCount);
      },
    );
    expect(item.getField('extra')).toEqual(
      'GSCC: 0001028 2025-01-01T08:00:00.000Z 0.56 \n',
    );
  });

  it('processCitationResponse() 200 should warn on console when item not found', () => {
    const warn = jest.spyOn(base.$__gscc.debugger, 'warn');
    const item = { ...singleItemNoCount.data };
    const targetUrl = base.$__gscc.app.generateItemUrl(singleItemNoCount.data);
    base.$__gscc.app.processCitationResponse(
      200,
      noCitation.data,
      null,
      targetUrl,
      item,
      (item, citeCount) => {
        base.$__gscc.app.updateItem(item, citeCount);
      },
    );
    expect(warn).toHaveBeenCalled();
  });

  it('processCitationResponse() 200 should open window on recaptcha', () => {
    const warn = jest.spyOn(base.$__gscc.debugger, 'warn');
    const openWindow = jest.spyOn(base.$__gscc.util, 'openRecaptchaWindow');
    const item = { ...singleItemNoCount.data };
    const targetUrl = base.$__gscc.app.generateItemUrl(singleItemNoCount.data);
    base.$__gscc.app.processCitationResponse(
      200,
      hasRecaptcha.data,
      null,
      targetUrl,
      item,
      (item, citeCount) => {
        base.$__gscc.app.updateItem(item, citeCount);
      },
    );
    expect(warn).toHaveBeenCalled();
    expect(openWindow).toHaveBeenCalled();
  });

  it('processCitationResponse() 404 should console error', () => {
    const warn = jest.spyOn(base.$__gscc.debugger, 'error');
    const item = { ...singleItemNoCount.data };
    const targetUrl = base.$__gscc.app.generateItemUrl(singleItemNoCount.data);
    base.$__gscc.app.processCitationResponse(
      404,
      hasRecaptcha.data,
      null,
      targetUrl,
      item,
      (item, citeCount) => {
        base.$__gscc.app.updateItem(item, citeCount);
      },
    );
    expect(warn).toHaveBeenCalled();
  });

  it('processCitationResponse() 429 should not console warn if retry set', () => {
    const warn = jest.spyOn(base.$__gscc.debugger, 'warn');
    const item = { ...singleItemNoCount.data };
    const targetUrl = base.$__gscc.app.generateItemUrl(singleItemNoCount.data);
    base.$__gscc.app.processCitationResponse(
      429,
      hasRecaptcha.data,
      null,
      targetUrl,
      item,
      (item, citeCount) => {
        base.$__gscc.app.updateItem(item, citeCount);
      },
    );
    expect(warn).toHaveBeenCalledTimes(0);
  });

  it('processCitationResponse() 429 should console warn if retry set', () => {
    const warn = jest.spyOn(base.$__gscc.debugger, 'warn');
    const item = { ...singleItemNoCount.data };
    const targetUrl = base.$__gscc.app.generateItemUrl(singleItemNoCount.data);
    base.$__gscc.app.processCitationResponse(
      429,
      hasRecaptcha.data,
      2000,
      targetUrl,
      item,
      (item, citeCount) => {
        base.$__gscc.app.updateItem(item, citeCount);
      },
    );
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('processCitationResponse() 500 should console error', () => {
    const error = jest.spyOn(base.$__gscc.debugger, 'error');
    const item = { ...singleItemNoCount.data };
    const targetUrl = base.$__gscc.app.generateItemUrl(singleItemNoCount.data);
    base.$__gscc.app.processCitationResponse(
      500,
      hasRecaptcha.data,
      null,
      targetUrl,
      item,
      (item, citeCount) => {
        base.$__gscc.app.updateItem(item, citeCount);
      },
    );
    expect(error).toHaveBeenCalledTimes(1);
  });

  it('addToWindow sets up world', async () => {
    const info = jest.spyOn(base.$__gscc.debugger, 'info');

    // there's no menu in JSDOM, so we make one temp wise
    const ele = global.document.createElement('div');
    ele.id = 'zotero-itemmenu';
    global.document.body.appendChild(ele);

    await base.$__gscc.app.addToWindow(global.window);

    // expect(base.$__gscc.app.__citedByPrefix).toBe('gscc-citedByPrefix');
    expect(info).toHaveBeenCalledTimes(1);
  });

  it('removeFromWindow runs failsafe in case unregister fails', async () => {
    const info = jest.spyOn(base.$__gscc.debugger, 'info');

    // there's no menu in JSDOM, so we make one temp wise
    const ele = global.document.createElement('div');
    ele.id = 'gscc-get-count';
    global.document.body.appendChild(ele);

    await base.$__gscc.app.removeFromWindow(global.window);

    expect(info).toHaveBeenCalledTimes(1);
  });

  it('processItems burns correctly', async () => {
    const info = jest.spyOn(base.$__gscc.debugger, 'info');
    jest.spyOn($__gscc.app, 'retrieveCitationData');
    jest.spyOn($__gscc.app, 'processCitationResponse');
    await base.$__gscc.app.processItems(itemsList);

    expect(info).toHaveBeenCalledTimes(6);
  });

  it('getApiEndpoint handles bad data URL', async () => {
    const alert = jest.spyOn(global.window, 'alert');
    base.$__gscc.app.__preferenceDefaults.defaultGsApiEndpoint = 'gibbgerish';
    await base.$__gscc.app.getApiEndpoint();

    expect(alert).toHaveBeenCalledTimes(1);
  });

  it('verify field key lookup in setColumnData', () => {
    const item = singleItemWithCount.data;
    const citeCount = base.$__gscc.app.setColumnData(item, 'citationCount');
    expect(citeCount).toBe(1000);

    const lastUpdated = base.$__gscc.app.setColumnData(item, 'lastUpdated');
    expect(lastUpdated).toBe('1/1/2025, 12:00:00 AM');

    const relevanceScore = base.$__gscc.app.setColumnData(
      item,
      'relevanceScore',
    );
    expect(relevanceScore).toBe(0.54);
  });

  it('extra Field Extractor tests', () => {
    for (const test of extraFieldTester) {
      const verify = base.$__gscc.app.extraFieldExtractor(test.string);
      expect(verify).toEqual(test.expectedResult);
    }
  });
});
