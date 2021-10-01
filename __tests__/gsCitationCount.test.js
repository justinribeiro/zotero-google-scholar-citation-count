const gscc = require('../chrome/content/zsc.js');
const hasCitation = require('./__data__/gsResponseHasCitation.js');
const noCitation = require('./__data__/gsResponseNoCitation.js');
const hasPaperNoCitations = require('./__data__/gsResponseHasPaperNoCitations.js');
const singleItemWithCount = require('./__data__/zoteroItemsListSingleItemWithCount.js');
const singleItemNoCount = require('./__data__/zoteroItemsListSingleItemWithNoCount.js');

describe('Verify gsCitationCount sanity', () => {
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
    const string = gscc.gsCitationCount.generateItemUrl(
      singleItemWithCount.data
    );
    expect(string).toEqual(
      'https://scholar.google.com/scholar?hl=en&q=Potential%20Biases%20in%20Leadership%20Measures:%20How%20Prototypes,%20Leniency,%20and%20General%20Satisfaction%20Relate%20to%20Ratings%20and%20Rankings%20of%20Transformational%20and%20Transactional%20Leadership%20Constructs&as_epq=&as_occt=title&num=1&as_sauthors=Bass+Avolio&as_ylo=1987&as_yhi=1991'
    );
  });
  it('updateItem() should change extra field when data present', () => {
    const item = singleItemWithCount.data;
    const extra = jest.spyOn(item, 'setField');
    const tx = jest.spyOn(item, 'saveTx');
    gscc.gsCitationCount.updateItem(item, 505);
    expect(extra).toHaveBeenCalled();
    expect(tx).toHaveBeenCalled();
    expect(item.getField('extra')).toEqual(
      'GSCC: 0000505 \nPublisher: SAGE Publications Inc'
    );
  });

  it('updateItem() should change extra field when no data present', () => {
    const item = singleItemNoCount.data;
    const extra = jest.spyOn(item, 'setField');
    const tx = jest.spyOn(item, 'saveTx');
    gscc.gsCitationCount.updateItem(item, 10);
    expect(extra).toHaveBeenCalled();
    expect(tx).toHaveBeenCalled();
    expect(item.getField('extra')).toEqual('GSCC: 0000010 \n');
  });
});
