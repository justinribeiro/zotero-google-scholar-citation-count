const fs = require('node:fs');
const path = require('node:path');
const { $__gscc: gs } = require('../src/gscc.js');
const messages = new Map(
  [
    ...fs
      .readFileSync(
        path.join(__dirname, '../src/locale/en-US/gscc.ftl'),
        'utf8',
      )
      .matchAll(/^(gscc-status-[\w-]+) = (.+)$/gm),
  ].map((match) => [match[1], match[2]]),
);

test('every new status message has an English fallback', () => {
  const source = fs.readFileSync(
    path.join(__dirname, '../src/gscc.js'),
    'utf8',
  );
  for (const match of source.matchAll(
    /showStatus\(\s*'(gscc-status-[\w-]+)'/g,
  )) {
    expect(messages.has(match[1])).toBe(true);
  }
});

test('status popup uses Fluent for its title and message', async () => {
  const format = jest
    .spyOn(window.document.l10n, 'formatValue')
    .mockImplementation((id) => messages.get(id));
  await gs.app.showStatus('gscc-status-background');
  expect(format).toHaveBeenCalledWith('gscc-status-title');
  expect(format).toHaveBeenCalledWith('gscc-status-background');
  const popup = Zotero.ProgressWindow.mock.results.at(-1).value;
  expect(popup.changeHeadline).toHaveBeenCalledWith(
    messages.get('gscc-status-title'),
  );
  expect(popup.addDescription).toHaveBeenCalledWith(
    messages.get('gscc-status-background'),
  );
  format.mockRestore();
});
