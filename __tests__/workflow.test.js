const { $__gscc: gs } = require('../src/gscc.js');
const item = require('./__data__/zoteroItemsListSingleItemWithNoCount.js').data;

describe('User commands and batch lookup boundaries', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
    window.alert = jest.fn();
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('selected-item command processes the current selection and shows errors', async () => {
    const selection = [item];
    const pane = {
      canEditLibrary: () => true,
      getSelectedItems: () => selection,
    };
    Zotero.getActiveZoteroPane = jest.fn(() => pane);
    const process = jest
      .spyOn(gs.app, 'processItems')
      .mockRejectedValue(new Error('Connection failed'));
    const status = jest.spyOn(gs.app, 'showStatus');
    await gs.handlers.updateItemMenuEntries();
    expect(process).toHaveBeenCalledWith(selection);
    expect(status).toHaveBeenCalledWith('gscc-status-failed');
  });

  test('read-only libraries never issue a lookup', async () => {
    jest
      .spyOn(gs.app, 'getActivePane')
      .mockReturnValue({ canEditLibrary: () => false });
    const process = jest.spyOn(gs.app, 'processItems');
    await gs.app.updateItemMenuEntries();
    await gs.handlers.updateCollectionMenuEntry();
    expect(process).not.toHaveBeenCalled();
    expect(window.alert).toHaveBeenCalledTimes(2);
  });

  test('collection command selects the collection, rejects groups and unsupported rows', async () => {
    const collection = {};
    const pane = {
      canEditLibrary: () => true,
      getSelectedGroup: () => null,
      getSelectedCollection: () => collection,
    };
    jest.spyOn(gs.app, 'getActivePane').mockReturnValue(pane);
    const update = jest.spyOn(gs.app, 'updateCollection').mockResolvedValue();
    await gs.app.updateCollectionMenuEntry();
    expect(update).toHaveBeenCalledWith(collection);
    pane.getSelectedGroup = () => ({});
    await gs.app.updateCollectionMenuEntry();
    expect(window.alert).toHaveBeenCalled();
    pane.getSelectedGroup = () => null;
    pane.getSelectedCollection = () => null;
    await gs.app.updateCollectionMenuEntry();
    expect(window.alert).toHaveBeenCalledTimes(2);
  });

  test('nested collections process their children', async () => {
    const process = jest.spyOn(gs.app, 'processItems').mockResolvedValue();
    const child = {
      getChildItems: () => [item],
      getChildCollections: () => [],
    };
    await gs.app.updateCollection({
      getChildItems: () => [],
      getChildCollections: () => [child],
    });
    expect(process).toHaveBeenCalledWith([item]);
  });

  test('blocked lookup stops a batch instead of repeatedly opening verification windows', async () => {
    jest
      .spyOn(gs.app, 'getApiEndpoint')
      .mockResolvedValue(new URL('https://scholar.google.com'));
    jest.spyOn(gs.util, 'sleep').mockResolvedValue();
    const request = jest
      .spyOn(gs.app, 'retrieveCitationData')
      .mockResolvedValue({ status: 200, responseText: 'blocked' });
    jest.spyOn(gs.app, 'processCitationResponse').mockResolvedValue(false);
    await gs.app.processItems([item, item]);
    expect(request).toHaveBeenCalledTimes(1);
  });

  test('an ordinary missing result does not prevent later items from updating', async () => {
    jest
      .spyOn(gs.app, 'getApiEndpoint')
      .mockResolvedValue(new URL('https://scholar.google.com'));
    jest.spyOn(gs.util, 'sleep').mockResolvedValue();
    const request = jest
      .spyOn(gs.app, 'retrieveCitationData')
      .mockResolvedValue({ status: 200, responseText: '' });
    jest
      .spyOn(gs.app, 'processCitationResponse')
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(true);
    await gs.app.processItems([item, item]);
    expect(request).toHaveBeenCalledTimes(2);
  });

  test('request rejection produces feedback for batch and automatic callers', async () => {
    jest
      .spyOn(gs.app, 'getApiEndpoint')
      .mockResolvedValue(new URL('https://scholar.google.com'));
    const request = jest
      .spyOn(gs.app, 'retrieveCitationData')
      .mockRejectedValue(new Error('Connection failed'));
    const status = jest.spyOn(gs.app, 'showStatus').mockResolvedValue();
    await expect(gs.app.processItems([item, item])).resolves.toBeUndefined();
    expect(request).toHaveBeenCalledTimes(1);
    expect(status).toHaveBeenCalledWith('gscc-status-failed');
  });

  test('invalid endpoint and attachment-only selections show feedback without requests', async () => {
    const endpoint = jest
      .spyOn(gs.app, 'getApiEndpoint')
      .mockResolvedValue(null);
    const request = jest.spyOn(gs.app, 'retrieveCitationData');
    const status = jest.spyOn(gs.app, 'showStatus');
    await gs.app.processItems([item]);
    expect(request).not.toHaveBeenCalled();
    endpoint.mockResolvedValue(new URL('https://scholar.google.com'));
    await gs.app.processItems([{ getField: () => '', getCreators: () => [] }]);
    expect(request).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith('gscc-status-select-item');
  });

  test('failed database save never claims the count was updated', async () => {
    const record = {
      ...item,
      saveTx: jest.fn().mockRejectedValue(new Error('Database failure')),
    };
    const original = record.getField('extra');
    const progress = jest.spyOn(gs.app, 'openProgressWindow');
    await expect(gs.app.updateItem(record, 100)).rejects.toThrow(
      'Database failure',
    );
    expect(progress).not.toHaveBeenCalled();
    expect(record.getField('extra')).toBe(original);
  });

  test('item notifier processes additions only when enabled', async () => {
    const process = jest.spyOn(gs.app, 'processItems').mockResolvedValue();
    Zotero.Items = { getAsync: jest.fn().mockResolvedValue([item]) };
    const pref = jest.spyOn(Zotero.Prefs, 'get').mockReturnValue(false);
    await gs.app.onItemNotify('add', 'item', [1]);
    expect(process).not.toHaveBeenCalled();
    pref.mockReturnValue(true);
    await gs.app.onItemNotify('modify', 'item', [1]);
    expect(process).not.toHaveBeenCalled();
    await gs.app.onItemNotify('add', 'item', [1]);
    expect(process).toHaveBeenCalledWith([item]);
  });

  test('window registration connects the command and all three citation columns', async () => {
    document.body.innerHTML = '<div id="zotero-itemmenu"></div>';
    const command = jest
      .spyOn(gs.app, 'updateItemMenuEntries')
      .mockResolvedValue();
    let columns, observer;
    jest
      .spyOn(Zotero.ItemTreeManager, 'registerColumns')
      .mockImplementation((opts) => {
        columns = opts;
        return ['count'];
      });
    Zotero.Notifier.registerObserver.mockImplementation((value) => {
      observer = value;
      return 1;
    });
    await gs.app.addToWindow(window);
    document
      .querySelector('#gscc-get-count')
      .dispatchEvent(new window.Event('command'));
    expect(command).toHaveBeenCalled();
    const provider = jest.spyOn(gs.app, 'setColumnData').mockReturnValue(123);
    for (const column of columns) expect(column.dataProvider(item)).toBe(123);
    expect(provider.mock.calls.map((call) => call[1])).toEqual([
      'citationCount',
      'lastUpdated',
      'relevanceScore',
    ]);
    const notify = jest.spyOn(gs.app, 'onItemNotify').mockResolvedValue();
    await observer.notify('add', 'item', [1]);
    expect(notify).toHaveBeenCalledWith('add', 'item', [1]);
    const add = jest.spyOn(gs.app, 'addToWindow').mockResolvedValue();
    const remove = jest.spyOn(gs.app, 'removeFromWindow').mockResolvedValue();
    Zotero.getMainWindows = () => [{ ZoteroPane: {} }, {}];
    gs.app.addToAllWindows();
    gs.app.removeFromAllWindows();
    expect(add).toHaveBeenCalledTimes(1);
    expect(remove).toHaveBeenCalledTimes(1);
    await gs.app.main();
  });
});
