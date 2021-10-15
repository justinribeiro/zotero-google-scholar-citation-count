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

global.Services = {
  prefs: {
    getBranch: function () {
      return {
        getPrefType: function (val) {
          return 'number';
        },
        setBoolPref: function () {
          return true;
        },
        setCharPref: function () {
          return true;
        },
        setIntPref: function () {
          return true;
        },
        getBoolPref: function () {},
        getCharPref: function () {},
        getIntPref: function () {},
        clearUserPref: function () {
          return true;
        },
        PREF_BOOL: 'boolean',
        PREF_STRING: 'string',
        PREF_INT: 'number',
      };
    },
  },
};

global.Components = {
  interfaces: {
    nsIWindowWatcher: '',
  },
  utils: {
    import: function (val) {
      return true;
    },
  },
  classes: {
    '@mozilla.org/embedcomp/window-watcher;1': {
      getService: function () {
        return {
          openWindow: function () {
            return {
              closed: false,
            };
          },
        };
      },
    },
  },
};
