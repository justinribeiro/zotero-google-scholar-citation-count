const base = require('../chrome/content/gscc/gscc.js');
const hasCitation = require('./__data__/gsResponseHasCitation.js');
const noCitation = require('./__data__/gsResponseNoCitation.js');
const hasRecaptcha = require('./__data__/gsResponseHasRecaptcha');

describe('Verify $__gscc.util', () => {
  it('check randomInteger() for proper output ', async () => {
    const test = base.$__gscc.util.randomInteger(1000, 2000);
    expect(test).toBeGreaterThan(1000);
    expect(test).toBeLessThan(2000);
  });
  it('check padCountWithZeros() length ', async () => {
    const test = base.$__gscc.util.padCountWithZeros('1234', 7);
    expect(test.length).toEqual(7);
  });
  it('hasCitationResults() should return true with result data in response ', async () => {
    const test = base.$__gscc.util.hasCitationResults(`${hasCitation.data}`);
    expect(test).toBe(true);
  });
  it('hasCitationResults() should return false with no result data in response ', async () => {
    const test = base.$__gscc.util.hasCitationResults(`${noCitation.data}`);
    expect(test).toBe(false);
  });
  it('hasRecaptcha() should return false with result data in response ', async () => {
    const test = base.$__gscc.util.hasRecaptcha(`${hasCitation.data}`);
    expect(test).toBe(false);
  });
  it('hasRecaptcha() should return true with recaptcha data in response ', async () => {
    const test = base.$__gscc.util.hasRecaptcha(`${hasRecaptcha.data}`);
    expect(test).toBe(true);
  });
});
