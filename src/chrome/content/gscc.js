/**
 * A short hand typedef for general use, not exhaustive of the Zotero Schema
 * @typedef {Object} ZoteroGenericItem
 * @property {function} getCreators returns an array of creators/authors
 * @property {function} getField returns a specific schema field
 * @property {String} DOI
 * @property {String} ISSN
 * @property {String} abstractNote
 * @property {String} accessDate
 * @property {Array} collections
 * @property {ZoteroCreator[]} creators
 * @property {String} date
 * @property {String} dateAdded
 * @property {String} dateModified
 * @property {String} extra
 * @property {String} issue
 * @property {String} itemType
 * @property {String} journalAbbreviation
 * @property {String} key
 * @property {String} pages
 * @property {String} publicationTitle
 * @property {Object} relations
 * @property {Array} tags
 * @property {String} title
 * @property {String} url
 * @property {String} version
 * @property {String} volume
 */

/**
 * A short hand typedef for general use, not exhaustive of the Zotero Schema
 * @typedef {Object} ZoteroCreator
 * @property {String} firstName
 * @property {String} lastName
 * @property {String} creatorType
 */

Components.utils.import('resource://gre/modules/Services.jsm');

$__gscc = {};

$__gscc.debugger = {
  /**
   * Print an info message to the console
   * @param {string} message
   */
  info: function (message) {
    this.__debugMessage(message, 3);
  },
  /**
   * Print an error message to the console
   * @param {string} message
   */
  warn: function (message) {
    this.__debugMessage(message, 1);
  },
  /**
   * Print an warning message to the console
   * @param {string} message
   */
  error: function (message) {
    this.__debugMessage(message, 0);
  },
  /**
   * Print a message to the debug console
   * @param {string} message
   * @param {number} level
   * @param {number} maxDepth
   * @param {object} stack
   */
  __debugMessage: function (message, level = 3, maxDepth = 5, stack = null) {
    const prependMessage = `[GSCC]: ${message}`;
    Zotero.Debug.log(prependMessage, level, maxDepth, stack);
  },
};

$__gscc.localization = {
  /**
   * All the strings below get replaced by the localization process; they're
   * there as description fallbacks only
   */
  string: {
    recaptchaAlert:
      'Please enter the Captcha on the page that will now open and then re-try updating the citations, or wait a while to get unblocked by Google if the Captcha is not present.',
    citedByPrefix: 'Cited by ',
    lackPermissions: 'You lack the permission to make edit to this library.',
    unSupportedGroupCollection:
      'You lack the permission to make edit to this library.',
    unSupportedEntryType: 'Updating a Group is not yet implemented.',
  },
  translate: function () {
    const stringBundle = document.getElementById('gscc-bundle');

    if (stringBundle !== null) {
      Object.keys(this.string).map((key) => {
        this.string[key] = stringBundle.getString(key);
      });
    }
  },
};

$__gscc.preferences = {
  /**
   * Prefs lookup keys for use with get()
   */
  keys: {
    USE_RANDOM_WAIT: 'useRandomWait',
    RANDOM_WAIT_MIN_MS: 'randomWaitMinMs',
    RANDOM_WAIT_MAX_MS: 'randomWaitMaxMs',
  },
  /**
   * Setup some baseline prefs
   * @private
   */
  __preferences: {
    useRandomWait: true,
    randomWaitMinMs: 1000,
    randomWaitMaxMs: 5000,
  },
  /**
   * Defines the Preference Service lookup branch
   * @private
   */
  __preferenceBranch: 'extensions.gscc.',
  /**
   * Set up the default values for the preferences branch store
   */
  install: function () {
    Object.keys(this.__preferences).map((key) => {
      this.set(key, this.__preferences[key]);
    });
  },
  /**
   * Get the handle from the Services.prefs for GSCC branch
   * @returns PrefsBranch
   */
  getBranch: function () {
    return Services.prefs.getBranch(this.__preferenceBranch);
  },
  /**
   * Get a value for the preference from GSCC branch
   * @param {string} pref
   * @param {boolean} throwError
   * @returns string|number|boolean
   */
  get: function (pref, throwError = false) {
    const preferenceBranch = this.getBranch();
    let preferenceValue;
    try {
      switch (preferenceBranch.getPrefType(pref)) {
        case preferenceBranch.PREF_BOOL:
          preferenceValue = preferenceBranch.getBoolPref(pref);
          break;
        case preferenceBranch.PREF_STRING:
          preferenceValue = preferenceBranch.getCharPref(pref);
          break;
        case preferenceBranch.PREF_INT:
          preferenceValue = preferenceBranch.getIntPref(pref);
          break;
      }
    } catch (e) {
      if (throwError) {
        throw new Error('[GSCC]: no pref found');
      } else {
        preferenceValue = this.__preferences[pref].valueOf();
      }
    }
    return preferenceValue;
  },
  /**
   * Set a preference for GSCC branch
   * @param {string} pref
   * @param {string|number|boolean} value
   * @returns boolean
   */
  set: function (pref, value) {
    const preferenceBranch = this.getBranch();

    // if there is already a preference, chance are we don't want to overwrite
    // since we set this up ideally once
    try {
      this.get(pref, true);
    } catch (e) {
      switch (typeof value) {
        case 'boolean':
          return preferenceBranch.setBoolPref(pref, value);
        case 'string':
          return preferenceBranch.setCharPref(pref, value);
        case 'number':
          return preferenceBranch.setIntPref(pref, value);
        default:
          return false;
      }
    }
    return true;
  },
  /**
   * Clear a preference for GSCC branch
   * @param {string} pref
   */
  clear: function (pref) {
    const preferenceBranch = this.getBranch();
    try {
      preferenceBranch.clearUserPref(pref);
    } catch (e) {
      throw new Error(`[GSCC]: Invalid preference ${pref}`);
    }
  },
};

$__gscc.util = {
  /**
   * A method to sleep via setTimeout/promise
   * @async
   * @param {number} ms
   */
  sleep: async function (ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  },
  /**
   * Promise-based XHR for getting data (don't use fetch() it'll bust Scholar)
   * @param {object} opts
   * @param {string} opts.method HTTP Verb (e.g. GET)
   * @param {string} opts.url HTTP endpoint uri
   * @returns
   */
  request: async function (opts) {
    $__gscc.debugger.info(`${opts.method} ${opts.url}`);
    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open(opts.method, opts.url);
      xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
          resolve(xhr);
        }
      };
      if (opts.headers) {
        Object.keys(opts.headers).forEach((key) => {
          xhr.setRequestHeader(key, opts.headers[key]);
        });
      }
      xhr.send();
    });
  },
  /**
   * Get a random number
   * @param {number} min
   * @param {number} max
   * @return {number}
   */
  randomInteger: function (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },
  /**
   * Checks to validate whether the source code has a recaptcha within it
   * @param {string} source source code to parse and search for recaptcha
   * include
   * @return {boolean}
   */
  hasRecaptcha: function (source) {
    // if the onload is there, we know it's going to inject the iframe as
    // opposed to just a general include
    return source.includes('google.com/recaptcha/api.js?onload');
  },
  /**
   * Checks to validate if we have a search result in the data
   * @param {string} source source code to parse and search for data
   * @return {boolean}
   */
  hasCitationResults: function (source) {
    return (
      source.includes('class="gs_r gs_or gs_scl"') ||
      source.includes('class="gs_fl gs_flb gs_invis"') ||
      source.includes('class="gs_fl gs_flb"')
    );
  },
  /**
   * Add zero's to a given string
   * @param {string} string the string to pad with zeros
   * @param {number} length the length of the string
   * @returns
   */
  padCountWithZeros: function (string, length) {
    return string.padStart(length, '0');
  },
  /**
   * Open a user interactive window, holds the window reference, and waits to
   * complete the recaptcha check before resolving promise
   * @param {string} targetUrl The url which caused the recaptcha
   * @return {Promise}
   */
  openRecaptchaWindow: async function (targetUrl) {
    const window = Zotero.getMainWindow();

    window.alert($__gscc.localization.string.recaptchaAlert);

    let intervalWindowCloseState;

    const checkWindowClosed = (modalWindowHandle, resolve) => {
      if (modalWindowHandle.closed) {
        $__gscc.debugger.info('recaptcha window closed');
        clearInterval(intervalWindowCloseState);
        resolve();
      } else {
        $__gscc.debugger.info(`waiting for recaptcha user complete...`);
      }
    };

    const recaptchaWindow = Zotero.openInViewer(targetUrl);

    return new Promise((resolve) =>
      checkWindowClosed(recaptchaWindow, resolve)
    );
  },
};

$__gscc.app = {
  /**
   * The overall length of the citation count
   * @private
   */
  __citeCountStrLength: 7,
  /**
   * The string prefix for the citation count
   * @private
   */
  __extraEntryPrefix: 'GSCC',
  /**
   * The string append for the citation count
   * @private
   */
  __extraEntrySeparator: ' \n',
  /**
   * The string for when citation count is empty
   * @private
   */
  __noData: 'NoCitationData',
  /**
   * API endpoint for Google Scholar
   * @private
   */
  __apiEndpoint: 'https://scholar.google.com/',
  __initialized: false,
  /**
   * Initialize our world.
   * @return {void}
   */
  init: ({ id, version, rootURI } = {}) => {
    if (this.initialized) return;
    this.id = id;
    this.version = version;
    this.rootURI = rootURI;

    // sanity
    $__gscc.app.__initialized = true;

    $__gscc.debugger.info(`Init() Complete! ${this.rootURI}`);
  },

  main: async function () {
    // Global properties are included automatically in Zotero 7
    $__gscc.debugger.info(
      `extensions.gscc.useRandomWait: ${Zotero.Prefs.get(
        'extensions.gscc.useRandomWait',
        true
      )}`
    );
  },

  getActivePane: function () {
    return Zotero.getActiveZoteroPane();
  },

  addToWindow: async function (window) {
    const doc = window.document;

    window.MozXULElement.insertFTLIfNeeded('gscc.ftl');

    const XUL_NS =
      'http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul';

    // Add menu option
    const menuitem = doc.createElementNS(XUL_NS, 'menuitem');
    menuitem.id = 'gscc-get-count';
    menuitem.classList.add(
      'menuitem-iconic',
      'zotero-menuitem-retrieve-metadata'
    );
    menuitem.setAttribute('label', 'Update Google Scholar citation count');
    menuitem.addEventListener('command', async () => {
      await $__gscc.app.updateItemMenuEntries();
    });
    doc.getElementById('zotero-itemmenu').appendChild(menuitem);

    $__gscc.debugger.info(`${doc}`);
    $__gscc.debugger.info(`Option Added to Right Click Menu`);

    $__gscc.app.registeredDataKey =
      await Zotero.ItemTreeManager.registerColumns({
        dataKey: 'gsccCount',
        label: 'Citation Count',
        pluginID: 'justin@justinribeiro.com',
        dataProvider: (item, dataKey) => {
          const data = item.getField('extra');
          return setFieldFromExtra(data);
        },
      });
  },

  /**
   * Set the custom column by parsing the extra field
   * @param {String} extraString
   */
  setFieldFromExtra: function (extraString) {
    let count = 0;
    if (extraString.startsWith(this.__extraEntryPrefix)) {
      try {
        const regex = new RegExp(
          String.raw`${this.__extraEntryPrefix}:(\s*\d+)`,
          'g'
        );
        // meh
        const match = extraString.match(regex)[0];
        const split = match.split(':')[1].trim();
        count = parseInt(split);
      } catch {
        // dead case for weird behavior
      }
    }
    return count;
  },

  removeFromWindow: async function (win) {
    const doc = win.document;
    await Zotero.ItemTreeManager.unregisterColumns(
      $__gscc.app.registeredDataKey
    );
    // failsafe
    try {
      doc.querySelector('#gscc-get-count').remove();
    } catch (error) {
      $__gscc.debugger.info(
        'Unable to remove custom column; already cleaned up.'
      );
    }
  },
  addToAllWindows: function () {
    var windows = Zotero.getMainWindows();
    for (let win of windows) {
      if (!win.ZoteroPane) continue;
      this.addToWindow(win);
    }
  },
  removeFromAllWindows: function () {
    var windows = Zotero.getMainWindows();
    for (let win of windows) {
      if (!win.ZoteroPane) continue;
      this.removeFromWindow(win);
    }
  },
  /**
   * Verify is the Zotero item record has a title and creators (otherwise we
   * can't query)
   * @param {ZoteroGenericItem} item
   * @return {boolean}
   */
  hasRequiredFields: function (item) {
    return item.getField('title') !== '' && item.getCreators().length > 0;
  },
  updateCollectionMenuEntry: async function () {
    const zoteroPane = $__gscc.app.getActivePane();
    const window = Zotero.getMainWindow();

    if (!zoteroPane.canEditLibrary()) {
      window.alert($__gscc.localization.string.lackPermissions);
      return;
    }

    const group = zoteroPane.getSelectedGroup();
    if (group) {
      this.updateGroup(zoteroPane.getSelectedGroup());
      return;
    }

    const collection = zoteroPane.getSelectedCollection();
    if (collection) {
      await this.updateCollection(collection);
      return;
    }

    window.alert($__gscc.localization.string.unSupportedEntryType);
    return;
  },
  updateItemMenuEntries: async function () {
    const zoteroPane = $__gscc.app.getActivePane();
    const window = Zotero.getMainWindow();

    if (!zoteroPane.canEditLibrary()) {
      window.alert($__gscc.localization.string.lackPermissions);
      return;
    }
    await this.processItems(zoteroPane.getSelectedItems());
  },
  updateGroup: function () {
    const window = Zotero.getMainWindow();
    window.alert($__gscc.localization.string.unSupportedGroupCollection);
    return;
  },
  updateCollection: async function (collection) {
    await this.processItems(collection.getChildItems());
    const childCollections = collection.getChildCollections();
    for (let idx = 0; idx < childCollections.length; ++idx) {
      this.updateCollection(childCollections[idx]);
    }
  },
  /**
   * fatch and process data and update the selected entries from Zotero
   * @param {ZoteroGenericItem[]} items
   */
  processItems: async function (items) {
    const useQueue = $__gscc.preferences.get(
      $__gscc.preferences.keys.USE_RANDOM_WAIT
    );
    let queueMinWaitMs;
    let queueMaxWaitMs;

    if (useQueue) {
      queueMinWaitMs = $__gscc.preferences.get(
        $__gscc.preferences.keys.RANDOM_WAIT_MIN_MS
      );
      queueMaxWaitMs = $__gscc.preferences.get(
        $__gscc.preferences.keys.RANDOM_WAIT_MAX_MS
      );
    }

    /**
     * @param {number} index
     * @param {ZoteroGenericItem} item
     */
    for (const [index, item] of items.entries()) {
      if (!this.hasRequiredFields(item)) {
        $__gscc.debugger.warn(
          `skipping item '${item.getField(
            'title'
          )}': empty title or missing creator information'`
        );
      } else {
        // check the prefs in case user override, don't use it on the first item
        // either way
        if (useQueue && index > 0) {
          const queueTime = $__gscc.util.randomInteger(
            queueMinWaitMs,
            queueMaxWaitMs
          );

          $__gscc.debugger.info(`queued for ${queueTime} ms later.`);
          await $__gscc.util.sleep(queueTime);
        }

        const response = await this.retrieveCitationData(item);
        await this.processCitationResponse(
          response.status,
          response.responseText,
          1000,
          response.responseURL,
          item
        );
      }
    }
  },
  /**
   * update a record with the citation data
   * @param {ZoteroGenericItem} item
   * @param {number} citeCount
   */
  updateItem: function (item, citeCount) {
    const fieldExtra = item.getField('extra');
    const buildNewCiteCount = this.buildCiteCountString(citeCount);
    let revisedExtraField;

    if (fieldExtra.startsWith(this.__extraEntryPrefix)) {
      revisedExtraField = fieldExtra.replace(
        new RegExp(`${this.__extraEntryPrefix}.{9}`, 'g'),
        buildNewCiteCount
      );
      $__gscc.debugger.info(
        `existing cite count in extra field, updating to ${buildNewCiteCount} ${revisedExtraField}`
      );
    } else {
      $__gscc.debugger.info(`no existing cite count in extra field, adding`);
      revisedExtraField =
        `${buildNewCiteCount}${this.__extraEntrySeparator}`.concat(
          '',
          fieldExtra
        );
    }
    item.setField('extra', revisedExtraField);

    try {
      $__gscc.debugger.info(`updating item '${item.getField('title')}'`);
      item.saveTx();
    } catch (e) {
      $__gscc.debugger.error(
        `could not update extra field with citation count: ${e}`
      );
    }
  },
  /**
   * Retrieve the Google Scholar Citation Count for a given Zotero item record
   * @param {ZoteroGenericItem} item Used to generate the fetch() string
   * @param {function} callback callback on complete
   */
  retrieveCitationData: async function (item) {
    const targetUrl = this.generateItemUrl(item);
    return $__gscc.util.request({ method: 'GET', url: targetUrl });
  },
  /**
   * process the fetch request for information
   * @param {number} requestStatus the http response from the XHR
   * @param {string} requestData  the http response string from the XHR
   * @param {string} requestRetry the http retry header, if available
   * @param {string} targetUrl which url did we request
   * @param {ZoteroGenericItem} item the item we're looking up
   * @param {function} callback the updateItem callback.
   */
  processCitationResponse: async function (
    requestStatus,
    requestData,
    requestRetry,
    targetUrl,
    item
  ) {
    $__gscc.debugger.info(requestStatus, requestData);
    let retryResponse;
    switch (requestStatus) {
      case 200:
        if (!$__gscc.util.hasRecaptcha(requestData)) {
          if ($__gscc.util.hasCitationResults(requestData)) {
            $__gscc.debugger.info(
              `Google Scholar returned search result, parsing cite count`
            );
            this.updateItem(item, this.getCiteCount(requestData));
          } else {
            $__gscc.debugger.warn(
              `Google Scholar found no search result for requested item: ${targetUrl}`
            );
          }
        } else {
          $__gscc.debugger.warn(
            'Google Scholar asking for recaptcha, opening window.'
          );
          await $__gscc.util.openRecaptchaWindow(targetUrl);
          retryResponse = await this.retrieveCitationData(item);
          await this.processCitationResponse(
            retryResponse.status,
            retryResponse.responseText,
            1000,
            retryResponse.responseURL,
            item
          );
        }
        break;
      case 403:
        $__gscc.debugger.warn(
          'Google Scholar thinks we are sus, opening window.'
        );
        await $__gscc.util.openRecaptchaWindow(targetUrl);
        retryResponse = await this.retrieveCitationData(item);
        await this.processCitationResponse(
          retryResponse.status,
          retryResponse.responseText,
          1000,
          retryResponse.responseURL,
          item
        );
        break;
      case 404:
        $__gscc.debugger.error(
          `Google Scholar could not find the requested page.`
        );
        break;
      case 429:
        if (requestRetry) {
          $__gscc.debugger.warn(
            `Google Scholar asks for retry after ${requestRetry} seconds, re-queuing request.`
          );
          await $__gscc.util.sleep(requestRetry * 1000);
          await this.retrieveCitationData(item);
        }
        break;
      default:
        $__gscc.debugger.error(
          `Google Scholar fetch failed for item: ${targetUrl}`
        );
        break;
    }
  },
  /**
   * Generate a Google Scholar URL to use to fetch data
   * @param {ZoteroGenericItem} item
   * @returns string
   */
  generateItemUrl: function (item) {
    let paramAuthors = '';

    /**
     * @type array
     */
    const creators = item.getCreators() || [];

    if (creators.length > 0) {
      paramAuthors = `&as_sauthors=${creators
        .map((author) => author.lastName)
        .slice(0, 5)
        .join('+')}`;
    }

    // Dead match; switch out in v4.1 for improved hits
    const targetUrl = `${this.__apiEndpoint}scholar?hl=en&q="${item.getField(
      'title'
    )}"&as_epq=&as_occt=title&num=1${paramAuthors}`;

    $__gscc.debugger.info(`Endpoint test: ${targetUrl}`);

    return encodeURI(targetUrl);
  },
  /**
   * Create the citation string for use on the item record
   * @param {number} citeCount
   * @returns string
   */
  buildCiteCountString: function (citeCount) {
    let data;
    if (citeCount < 0) {
      data = this.__noData;
    } else {
      data = $__gscc.util.padCountWithZeros(
        citeCount.toString(),
        this.__citeCountStrLength
      );
    }
    return `${this.__extraEntryPrefix}: ${data}`;
  },
  /**
   * Parse the raw response for citation count
   * @param {string} responseText The raw string data to look for cited data
   * @returns number
   */
  getCiteCount: function (responseText) {
    const citePrefix = `>${$__gscc.localization.string.citedByPrefix}`;
    const citePrefixLen = citePrefix.length;
    const citeCountStart = responseText.indexOf(citePrefix);

    if (citeCountStart === -1) {
      if (responseText.indexOf('class="gs_rt"') === -1) {
        return -1;
      } else {
        return 0;
      }
    } else {
      const citeCountEnd = responseText.indexOf('<', citeCountStart);
      const citeStr = responseText.substring(citeCountStart, citeCountEnd);
      const citeCount = citeStr.substring(citePrefixLen);
      return parseInt(citeCount.trim());
    }
  },
};

/**
 * The handlers are what bind to the actions within the overlay XUL
 */
$__gscc.handlers = {
  updateCollectionMenuEntry: async function () {
    await $__gscc.app.updateCollectionMenuEntry();
  },
  updateItemMenuEntries: async function () {
    await $__gscc.app.updateItemMenuEntries();
  },
};

// For testing only
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    $__gscc,
  };
}
