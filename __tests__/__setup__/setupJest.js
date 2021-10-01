global.Zotero = {
  Debug: {
    // eslint-disable-next-line no-unused-vars
    log: (message, level, maxDepth, stack) => {
      return message;
    },
  },
  openInViewer: (targetUrl) => {
    if (!targetUrl) {
      throw new Error('missing params');
    }
    Zotero.viewerOpen = true;
    return;
  },
  launchURL: (targetUrl) => {
    if (!targetUrl) {
      throw new Error('missing params');
    }
    Zotero.viewerOpen = true;
    return;
  },
  ScholarCitations: () => {
    return {};
  },
  viewerOpen: false,
};

global.gBrowser = {
  loadOneTab: (targetUrl = '', obj = {}) => {
    if (targetUrl === '' || Object.keys(obj).length === 0) {
      throw new Error('missing params');
    }
    Zotero.viewerOpen = true;
    return;
  },
};

global.alert = jest.fn();
