const { $__gscc: gs } = require('../src/gscc.js');

describe('automatic additions and selection feedback', () => {
  const invalid = () => ({
    isRegularItem: () => false,
    getField: () => 'Attachment',
    getCreators: () => [],
  });
  let status, endpoint, request;
  beforeEach(() => {
    jest
      .spyOn(Zotero.Prefs, 'get')
      .mockImplementation((name) => name.endsWith('useAutoCountUpdate'));
    status = jest.spyOn(gs.app, 'showStatus').mockResolvedValue();
    endpoint = jest
      .spyOn(gs.app, 'getApiEndpoint')
      .mockResolvedValue(new URL('https://scholar.google.com'));
    request = jest
      .spyOn(gs.app, 'retrieveCitationData')
      .mockResolvedValue({ status: 200, responseText: '' });
    jest.spyOn(gs.app, 'processCitationResponse').mockResolvedValue(true);
  });
  afterEach(() => jest.restoreAllMocks());

  test('40 background additions produce no prompts, validation or requests', async () => {
    Zotero.Items = {
      getAsync: jest
        .fn()
        .mockResolvedValue(Array.from({ length: 40 }, invalid)),
    };
    await gs.app.onItemNotify('add', 'item', [1]);
    expect(status).not.toHaveBeenCalled();
    expect(endpoint).not.toHaveBeenCalled();
    expect(request).not.toHaveBeenCalled();
  });

  test('mixed background additions look up only eligible bibliographic items', async () => {
    const valid = {
      isRegularItem: () => true,
      getField: () => 'Paper',
      getCreators: () => [{}],
    };
    const incomplete = { ...valid, getCreators: () => [] };
    const attachmentWithMetadata = { ...valid, isRegularItem: () => false };
    Zotero.Items = {
      getAsync: jest
        .fn()
        .mockResolvedValue([
          invalid(),
          incomplete,
          attachmentWithMetadata,
          valid,
        ]),
    };
    await gs.app.onItemNotify('add', 'item', [1, 2, 3, 4]);
    expect(request).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenCalledWith(valid);
    expect(status).not.toHaveBeenCalled();
  });

  test.each([[[]], [Array.from({ length: 40 }, invalid)]])(
    'manual invalid selection gives one prompt',
    async (items) => {
      await gs.app.processItems(items);
      expect(status).toHaveBeenCalledTimes(1);
      expect(request).not.toHaveBeenCalled();
    },
  );
});
