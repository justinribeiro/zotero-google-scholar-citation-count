const gscc = require('../chrome/content/zsc.js');
const hasCitation = require('./__data__/gsResponseHasCitation.js');
const noCitation = require('./__data__/gsResponseNoCitation.js');
const hasPaperNoCitations = require('./__data__/gsResponseHasPaperNoCitations.js');
const hasRecaptcha = require('./__data__/gsResponseHasRecaptcha.js');
const singleItemWithCount = require('./__data__/zoteroItemsListSingleItemWithCount.js');
const singleItemNoCount = require('./__data__/zoteroItemsListSingleItemWithNoCount.js');
const singleItemNoTitle = require('./__data__/zoteroItemsListSingleItemWithNoTitle.js');
const singleItemNoCreators = require('./__data__/zoteroItemsListSingleItemWithNoCreators.js');

describe('Verify gsCitationCount sanity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getCiteCount() should return number', () => {
    const test = gscc.gsCitationCount.getCiteCount(hasCitation.data);
    expect(test).toBe(1028);
  });

  it('getCiteCount() should return -1, no data', () => {
    const test = gscc.gsCitationCount.getCiteCount(noCitation.data);
    expect(test).toBe(-1);
  });

  it('getCiteCount() should return 0, no count', () => {
    const test = gscc.gsCitationCount.getCiteCount(hasPaperNoCitations.data);
    expect(test).toBe(0);
  });

  it('buildcitecountstring() string + count', () => {
    const count = gscc.gsCitationCount.getCiteCount(hasCitation.data);
    const test = gscc.gsCitationCount.buildCiteCountString(count);
    expect(test).toEqual('GSCC: 0001028 \n');
  });

  it('buildcitecountstring() string + no data', () => {
    const count = gscc.gsCitationCount.getCiteCount(noCitation.data);
    const test = gscc.gsCitationCount.buildCiteCountString(count);
    expect(test).toEqual('GSCC: NoCitationData \n');
  });

  it('generateItemUrl() should output string', () => {
    const string = gscc.gsCitationCount.generateItemUrl(singleItemNoCount.data);
    expect(string).toEqual(
      'https://scholar.google.com/scholar?hl=en&q=Potential%20Biases%20in%20Leadership%20Measures:%20How%20Prototypes,%20Leniency,%20and%20General%20Satisfaction%20Relate%20to%20Ratings%20and%20Rankings%20of%20Transformational%20and%20Transactional%20Leadership%20Constructs&as_epq=&as_occt=title&num=1&as_sauthors=Bass+Avolio&as_ylo=1987&as_yhi=1991'
    );
  });

  it('updateItem() should change extra field when data present', () => {
    const item = singleItemWithCount.data;
    const extra = jest.spyOn(item, 'setField');
    const tx = jest.spyOn(item, 'saveTx');
    gscc.gsCitationCount.updateItem(item, 400);
    expect(extra).toHaveBeenCalled();
    expect(tx).toHaveBeenCalled();
    expect(item.getField('extra')).toEqual(
      'GSCC: 0000400 \nPublisher: SAGE Publications Inc'
    );
  });

  it('updateItem() should change extra field when no data present', () => {
    const item = { ...singleItemNoCount.data };
    const extra = jest.spyOn(item, 'setField');
    const tx = jest.spyOn(item, 'saveTx');
    gscc.gsCitationCount.updateItem(item, 10);
    expect(extra).toHaveBeenCalled();
    expect(tx).toHaveBeenCalled();
    expect(item.getField('extra')).toEqual('GSCC: 0000010 \n');
  });

  it('hasRequiredFields() should return true with sane data', () => {
    const item = { ...singleItemNoCount.data };
    const test = gscc.gsCitationCount.hasRequiredFields(item);
    expect(test).toBe(true);
  });

  it('hasRequiredFields() should return false with no title', () => {
    const item = singleItemNoTitle.data;
    const test = gscc.gsCitationCount.hasRequiredFields(item);
    expect(test).toBe(false);
  });

  it('hasRequiredFields() should return false with no creators', () => {
    const item = singleItemNoCreators.data;
    const test = gscc.gsCitationCount.hasRequiredFields(item);
    expect(test).toBe(false);
  });

  it('processCitationResponse() 200 should set item data', () => {
    const item = { ...singleItemNoCount.data };
    const targetUrl = gscc.gsCitationCount.generateItemUrl(
      singleItemNoCount.data
    );
    gscc.gsCitationCount.processCitationResponse(
      200,
      hasCitation.data,
      null,
      targetUrl,
      item,
      (item, citeCount) => {
        gscc.gsCitationCount.updateItem(item, citeCount);
      }
    );
    expect(item.getField('extra')).toEqual('GSCC: 0001028 \n');
  });

  it('processCitationResponse() 200 should warn on console when item not found', () => {
    const warn = jest.spyOn(gscc.$__gsccDebugger, 'warn');
    const item = { ...singleItemNoCount.data };
    const targetUrl = gscc.gsCitationCount.generateItemUrl(
      singleItemNoCount.data
    );
    gscc.gsCitationCount.processCitationResponse(
      200,
      noCitation.data,
      null,
      targetUrl,
      item,
      (item, citeCount) => {
        gscc.gsCitationCount.updateItem(item, citeCount);
      }
    );
    expect(warn).toHaveBeenCalled();
  });

  it('processCitationResponse() 200 should open window on recaptcha', () => {
    const warn = jest.spyOn(gscc.$__gsccDebugger, 'warn');
    const openWindow = jest.spyOn(gscc.$__gsccUtil, 'openRecaptchaWindow');
    const item = { ...singleItemNoCount.data };
    const targetUrl = gscc.gsCitationCount.generateItemUrl(
      singleItemNoCount.data
    );
    gscc.gsCitationCount.processCitationResponse(
      200,
      hasRecaptcha.data,
      null,
      targetUrl,
      item,
      (item, citeCount) => {
        gscc.gsCitationCount.updateItem(item, citeCount);
      }
    );
    expect(warn).toHaveBeenCalled();
    expect(openWindow).toHaveBeenCalled();
  });

  it('processCitationResponse() 404 should console error', () => {
    const warn = jest.spyOn(gscc.$__gsccDebugger, 'error');
    const item = { ...singleItemNoCount.data };
    const targetUrl = gscc.gsCitationCount.generateItemUrl(
      singleItemNoCount.data
    );
    gscc.gsCitationCount.processCitationResponse(
      404,
      hasRecaptcha.data,
      null,
      targetUrl,
      item,
      (item, citeCount) => {
        gscc.gsCitationCount.updateItem(item, citeCount);
      }
    );
    expect(warn).toHaveBeenCalled();
  });

  it('processCitationResponse() 429 should not console warn if retry set', () => {
    const warn = jest.spyOn(gscc.$__gsccDebugger, 'warn');
    const item = { ...singleItemNoCount.data };
    const targetUrl = gscc.gsCitationCount.generateItemUrl(
      singleItemNoCount.data
    );
    gscc.gsCitationCount.processCitationResponse(
      429,
      hasRecaptcha.data,
      null,
      targetUrl,
      item,
      (item, citeCount) => {
        gscc.gsCitationCount.updateItem(item, citeCount);
      }
    );
    expect(warn).toHaveBeenCalledTimes(0);
  });

  it('processCitationResponse() 429 should console warn if retry set', () => {
    const warn = jest.spyOn(gscc.$__gsccDebugger, 'warn');
    const item = { ...singleItemNoCount.data };
    const targetUrl = gscc.gsCitationCount.generateItemUrl(
      singleItemNoCount.data
    );
    gscc.gsCitationCount.processCitationResponse(
      429,
      hasRecaptcha.data,
      2000,
      targetUrl,
      item,
      (item, citeCount) => {
        gscc.gsCitationCount.updateItem(item, citeCount);
      }
    );
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('processCitationResponse() 500 should console error', () => {
    const error = jest.spyOn(gscc.$__gsccDebugger, 'error');
    const item = { ...singleItemNoCount.data };
    const targetUrl = gscc.gsCitationCount.generateItemUrl(
      singleItemNoCount.data
    );
    gscc.gsCitationCount.processCitationResponse(
      500,
      hasRecaptcha.data,
      null,
      targetUrl,
      item,
      (item, citeCount) => {
        gscc.gsCitationCount.updateItem(item, citeCount);
      }
    );
    expect(error).toHaveBeenCalledTimes(1);
  });

  it('processItems() should call timers', () => {
    jest.spyOn(global, 'setTimeout');
    const item = { ...singleItemNoCount.data };
    gscc.gsCitationCount.processItems([item]);
    expect(setTimeout).toHaveBeenCalledTimes(1);
  });

  it('processItems() should call timers twice', () => {
    jest.spyOn(global, 'setTimeout');
    const item = { ...singleItemNoCount.data };
    gscc.gsCitationCount.processItems([item, item]);
    expect(setTimeout).toHaveBeenCalledTimes(2);
  });

  it('processItems() should skip when item does not meet criteria', () => {
    jest.spyOn(global, 'setTimeout');
    const itemNoData = { ...singleItemNoTitle.data };
    const item = { ...singleItemNoCount.data };
    gscc.gsCitationCount.processItems([itemNoData, item]);
    expect(setTimeout).toHaveBeenCalledTimes(1);
  });
});
