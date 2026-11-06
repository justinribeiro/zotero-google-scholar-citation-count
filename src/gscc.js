'use strict';
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

const $__gscc = {};

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
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open(opts.method, opts.url);
      xhr.timeout = 30000;
      xhr.ontimeout = () => reject(new Error('The Scholar request timed out'));
      xhr.onerror = () =>
        reject(new Error('Could not connect to Google Scholar'));
      xhr.onabort = () =>
        reject(new Error('The Scholar request was cancelled'));
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
    const doc = new DOMParser().parseFromString(source, 'text/html');
    return !!doc.querySelector('.gs_r.gs_or.gs_scl, .gs_fl.gs_flb');
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
  isVerificationPage: function (source, responseURL = '') {
    if (this.hasRecaptcha(source)) return true;
    try {
      const url = new URL(responseURL);
      if (
        (url.hostname === 'google.com' ||
          url.hostname.endsWith('.google.com')) &&
        /^\/(sgsync|sorry)(\/|$)/.test(url.pathname)
      )
        return true;
    } catch {}
    return (
      /<title[^>]*>\s*Verifying(?:\.{3}|…)?\s*<\/title>/i.test(source) ||
      /id=["']captcha-form["']/i.test(source)
    );
  },

  readViewerPage: async function (browser) {
    const page = browser?.browsingContext?.currentWindowGlobal;
    if (!page) return null;
    const url = page.documentURI.spec;
    let timer;
    try {
      // basicViewer switches HTTP pages to a content process in Zotero 10.
      // PageData is Zotero's own reader for documents in that process.
      const html = await Promise.race([
        page.getActor('PageData').sendQuery('documentHTML'),
        new Promise((_, reject) => {
          timer = setTimeout(
            () => reject(new Error('Browser page read timed out')),
            3000,
          );
        }),
      ]);
      // Navigation may complete while the actor reply is in flight. Never
      // combine one page's HTML with another page's URL.
      if (browser.browsingContext.currentWindowGlobal !== page) return null;
      return { url, html };
    } finally {
      clearTimeout(timer);
    }
  },

  matchingSearchResult: function (page, requested) {
    if (!page) return null;
    const url = new URL(page.url);
    if (
      url.origin !== requested.origin ||
      url.pathname !== '/scholar' ||
      url.searchParams.get('q') !== requested.searchParams.get('q')
    )
      return null;
    const doc = new DOMParser().parseFromString(page.html, 'text/html');
    if (
      this.isVerificationPage(page.html, page.url) ||
      !(
        this.hasCitationResults(page.html) ||
        doc.querySelector('#gs_res_ccl_mid')
      )
    )
      return null;
    return { status: 200, responseText: page.html, responseURL: page.url };
  },

  loadSearchInBackground: async function (targetUrl) {
    const { HiddenBrowser } = ChromeUtils.importESModule(
      'chrome://zotero/content/HiddenBrowser.mjs',
    );
    const browser = new HiddenBrowser({ allowJavaScript: true });
    const requested = new URL(targetUrl);
    try {
      if (!(await browser.load(targetUrl))) return null;
      const deadline = Date.now() + 20000;
      while (Date.now() < deadline) {
        try {
          const page = await this.readViewerPage(browser);
          const response = this.matchingSearchResult(page, requested);
          if (response) return response;
          if (page) {
            const doc = new DOMParser().parseFromString(page.html, 'text/html');
            // A script reference alone is not a request for user input.
            if (
              doc.querySelector(
                '#captcha-form, form[action*="/sorry/"], .g-recaptcha',
              )
            ) {
              return { needsInteraction: true };
            }
          }
        } catch (error) {
          $__gscc.debugger.warn('Waiting for Scholar in background: ' + error);
        }
        await this.sleep(500);
      }
      return null;
    } finally {
      browser.destroy();
    }
  },

  openRecaptchaWindow: async function (targetUrl) {
    const requested = new URL(targetUrl);
    const viewer = Zotero.openInViewer(targetUrl, { allowJavaScript: true });
    if (!viewer)
      throw new Error('Could not open the Google Scholar verification window');
    // Use the document that executed Google's verification script. Repeating
    // the XHR can send us straight back to the same verification page.
    const deadline = Date.now() + 120000;
    let lastReadError;
    while (!viewer.closed && Date.now() < deadline) {
      try {
        const browser = viewer.document.querySelector('browser');
        const page = await this.readViewerPage(browser);
        const response = this.matchingSearchResult(page, requested);
        if (response) {
          viewer.close();
          return response;
        }
      } catch (error) {
        // Navigation can briefly make the content document inaccessible.
        if (lastReadError !== String(error)) {
          lastReadError = String(error);
          $__gscc.debugger.warn(
            'Waiting to read Scholar browser: ' + lastReadError,
          );
        }
      }
      await this.sleep(500);
    }
    return null;
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
   * Default String search in Google Scholar,
   * will override based on locale
   * @private
   */
  __citedByPrefix: 'Cited by',
  /**
   * My own marker for init; not for general use
   * @private
   */
  __initialized: false,
  /**
   * Key holder for Zotero Column Management
   * @type {string | string[] | false}
   * @private
   */
  __registeredDataKey: false,
  /**
   * Key holder for Zotero Item Notifier Management
   * @type {string | string[] | false}
   * @private
   */
  __registeredNotifierKey: false,
  /**
   * Fallbacks for Zotero preferences
   * @private
   */
  __preferenceDefaults: {
    useRandomWait: true,
    randomWaitMinMs: 1000,
    randomWaitMaxMs: 5000,
    useFuzzyMatch: false,
    useSearchTitleFuzzyMatch: false,
    useSearchAuthorsMatch: true,
    useDateRangeMatch: false,
    defaultGsApiEndpoint: 'https://scholar.google.com',
  },
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
    // no need for default spin-up
  },

  getActivePane: function () {
    return Zotero.getActiveZoteroPane();
  },

  /**
   * Return the a resuable progress window for user updates
   * @returns Zotero.ProgressWindow
   */
  showStatus: async function (messageID) {
    const { l10n } = Zotero.getMainWindow().document;
    const [title, message] = await Promise.all([
      l10n.formatValue('gscc-status-title'),
      l10n.formatValue(messageID),
    ]);
    const popup = new Zotero.ProgressWindow();
    popup.changeHeadline(title);
    popup.addDescription(message);
    popup.show();
    popup.startCloseTimer(8000);
  },

  getProgressWindow: function () {
    if (!$__gscc.app.progressWindow) {
      $__gscc.app.progressWindow = new Zotero.ProgressWindow();
    }
    return $__gscc.app.progressWindow;
  },

  addToWindow: async function (window) {
    const doc = window.document;

    // Fluent for localization
    window.MozXULElement.insertFTLIfNeeded('gscc.ftl');

    const XUL_NS =
      'http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul';

    // Add menu option
    const menuitem = doc.createElementNS(XUL_NS, 'menuitem');
    menuitem.id = 'gscc-get-count';
    menuitem.classList.add(
      'menuitem-iconic',
      'zotero-menuitem-retrieve-metadata',
    );
    menuitem.setAttribute('data-l10n-id', 'gscc-menuitem');
    menuitem.addEventListener('command', async () => {
      await $__gscc.app.updateItemMenuEntries();
    });
    doc.getElementById('zotero-itemmenu').appendChild(menuitem);

    $__gscc.debugger.info(`Menu Item Option Added to Right Click Menu`);

    const columnLabel = await doc.l10n.formatValue('gscc-column-name');
    const columnLastUpdateLabel = await doc.l10n.formatValue(
      'gscc-lastupdated-column-name',
    );
    const columnRelevanceScoreLabel = await doc.l10n.formatValue(
      'gscc-relevancescore-column-name',
    );

    $__gscc.app.__registeredDataKey =
      await Zotero.ItemTreeManager.registerColumns([
        {
          dataKey: 'gsccCount',
          label: columnLabel,
          pluginID: 'justin@justinribeiro.com',
          dataProvider: (item, dataKey) => {
            return this.setColumnData(item, 'citationCount');
          },
          zoteroPersist: ['width', 'hidden', 'sortDirection'],
        },
        {
          dataKey: 'gsccCountUpdated',
          label: columnLastUpdateLabel,
          pluginID: 'justin@justinribeiro.com',
          dataProvider: (item, dataKey) => {
            return this.setColumnData(item, 'lastUpdated');
          },
          zoteroPersist: ['width', 'hidden', 'sortDirection'],
        },
        {
          dataKey: 'gsccRelevanceScore',
          label: columnRelevanceScoreLabel,
          pluginID: 'justin@justinribeiro.com',
          dataProvider: (item, dataKey) => {
            return this.setColumnData(item, 'relevanceScore');
          },
          zoteroPersist: ['width', 'hidden', 'sortDirection'],
        },
      ]);

    $__gscc.app.registerNotifier();
  },

  /**
   * Register a notifier for items added to the library
   */
  registerNotifier: async function () {
    const callback = {
      notify: async (event, type, ids) => {
        this.onItemNotify(event, type, ids);
      },
    };
    $__gscc.app.__registeredNotifierKey = Zotero.Notifier.registerObserver(
      callback,
      ['item'],
    );
  },

  /**
   * Update the citation count for a newly added item
   * @param {string} event
   * @param {string} type
   * @param {number[] | string[]} ids
   */
  onItemNotify: async (event, type, ids) => {
    const useAutoCountUpdate = Zotero.Prefs.get(
      'extensions.zotero.gscc.useAutoCountUpdate',
      true,
    );

    $__gscc.debugger.info(`useAutoCountUpdate set to ${useAutoCountUpdate}`);

    if (useAutoCountUpdate && event === 'add' && type === 'item') {
      $__gscc.debugger.info(`useAutoSearch running on new add!`);
      const newItems = await Zotero.Items.getAsync(ids);
      await $__gscc.app.processItems(newItems);
    }
  },

  /**
   * Set the custom column for the GsccExtra field key by parsing the extra field
   * @param {String} extraString
   */
  setColumnData: function (item, field) {
    const extraString = item.getField('extra');
    const data = this.extraFieldExtractor(extraString);
    return data[field];
  },

  /**
   * GSCC Extra Data Type
   * @typedef {Object} GsccExtra
   * @property {number} citationCount - The GS citation count
   * @property {date} lateUpdated - The last time we pulled the data.
   * @property {number} relevanceScore - The relative relevance of the citations
   */
  /**
   * Break apart all the variants we can think of for other uses
   * @param {String} extraString
   * @return {GsccExtra}
   */
  extraFieldExtractor: function (extraString) {
    const parts = {
      citationCount: 0,
      lastUpdated: '',
      relevanceScore: 0,
    };
    try {
      // Look everywhere but always on a single line
      const regex = new RegExp(
        String.raw`^${this.__extraEntryPrefix}.*$`,
        'gm',
      );
      const match = extraString.match(regex)[0];

      if (match) {
        // cool, a match, let's break it up
        let matches = match.split(' ');
        if (matches[0] !== `GSCC:`) {
          // Compressed string, split it
          const splitter = matches[0].split(':');
          matches.shift();
          matches = splitter.concat(matches);
        }

        parts.citationCount = parseInt(matches[1] ?? parts?.citationCount);
        parts.lastUpdated = matches[2]
          ? new Date(matches[2]).toLocaleString()
          : parts?.lastUpdated;
        parts.relevanceScore =
          parseFloat(matches[3] ?? parts?.relevanceScore) || 0;
      }
    } catch {
      // dead case for weird behavior
    }
    return parts;
  },

  removeFromWindow: async function (win) {
    const doc = win.document;
    await Zotero.ItemTreeManager.unregisterColumns(
      $__gscc.app.registeredDataKey,
    );

    try {
      // failsafe
      doc.querySelector('#gscc-get-count').remove();
      $__gscc.debugger.info('Running failsafe remove custom column.');
    } catch {}
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

    const permissionAlertString = await window.document.l10n.formatValue(
      'gscc-lackPermissions',
    );

    if (!zoteroPane.canEditLibrary()) {
      window.alert(permissionAlertString);
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

    const unSupportedEntryTypeString = await window.document.l10n.formatValue(
      'gscc-unSupportedEntryType',
    );
    window.alert(unSupportedEntryTypeString);
    return;
  },
  updateItemMenuEntries: async function () {
    const zoteroPane = $__gscc.app.getActivePane();
    const window = Zotero.getMainWindow();

    if (!zoteroPane.canEditLibrary()) {
      const permissionAlertString = await window.document.l10n.formatValue(
        'gscc-lackPermissions',
      );
      window.alert(permissionAlertString);
      return;
    }
    await this.showStatus('gscc-status-looking-up');
    try {
      await this.processItems(zoteroPane.getSelectedItems());
    } catch (error) {
      $__gscc.debugger.error(String(error));
      await this.showStatus('gscc-status-failed');
    }
  },
  updateGroup: async function () {
    const window = Zotero.getMainWindow();
    const unSupportedGroupCollectionString =
      await window.document.l10n.formatValue('gscc-unSupportedGroupCollection');
    window.alert(unSupportedGroupCollectionString);
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
   * fetch and process data and update the selected entries from Zotero
   * @param {ZoteroGenericItem[]} items
   */
  processItems: async function (items) {
    const useQueue = Zotero.Prefs.get(
      'extensions.zotero.gscc.useRandomWait',
      $__gscc.app.__preferenceDefaults.useRandomWait,
    );

    let queueMinWaitMs;
    let queueMaxWaitMs;

    $__gscc.debugger.info(`Use Queue: ${useQueue}`);

    if (useQueue) {
      queueMinWaitMs = Zotero.Prefs.get(
        'extensions.zotero.gscc.randomWaitMinMs',
        $__gscc.app.__preferenceDefaults.randomWaitMinMs,
      );
      queueMaxWaitMs = Zotero.Prefs.get(
        'extensions.zotero.gscc.randomWaitMaxMs',
        $__gscc.app.__preferenceDefaults.randomWaitMaxMs,
      );

      $__gscc.debugger.info(`Min: ${queueMinWaitMs} Max: ${queueMaxWaitMs}`);
    }

    // we need to validate if the Google Scholar URL setting is sane
    // otherwise we risk DDoS'ing the user with alerts
    const apiEndpoint = await this.getApiEndpoint();
    if (!apiEndpoint) {
      // we threw the error to the user, bail on any other work
      $__gscc.debugger.error(
        `Google Scholar URL is malformed in Settings, stopping work.`,
      );
      return;
    }

    /**
     * @param {number} index
     * @param {ZoteroGenericItem} item
     */
    for (const [index, item] of items.entries()) {
      if (!this.hasRequiredFields(item)) {
        await this.showStatus('gscc-status-select-item');
        $__gscc.debugger.warn(
          `skipping item '${item.getField(
            'title',
          )}': empty title or missing creator information'`,
        );
      } else {
        // check the prefs in case user override, don't use it on the first item
        // either way
        if (useQueue && index > 0) {
          const queueTime = $__gscc.util.randomInteger(
            queueMinWaitMs,
            queueMaxWaitMs,
          );

          $__gscc.debugger.info(`queued for ${queueTime} ms later.`);
          await $__gscc.util.sleep(queueTime);
        }

        try {
          const response = await this.retrieveCitationData(item);
          const completed = await this.processCitationResponse(
            response.status,
            response.responseText,
            1000,
            response.responseURL,
            item,
          );
          if (completed === false) break;
        } catch (error) {
          // All callers, including automatic updates and collections, need
          // feedback when a request or database save fails.
          $__gscc.debugger.error(String(error));
          await this.showStatus('gscc-status-failed');
          break;
        }
      }
    }
  },
  /**
   * update a record with the citation data
   * @param {ZoteroGenericItem} item
   * @param {number} citeCount
   */
  updateItem: async function (item, citeCount) {
    const fieldExtra = item.getField('extra');
    const fieldPublicationDate = item.getField('date');
    const buildNewCiteCount = this.buildCiteCountString(
      citeCount,
      fieldPublicationDate,
    );
    let revisedExtraField;

    if (fieldExtra.startsWith(this.__extraEntryPrefix)) {
      revisedExtraField = fieldExtra.replace(
        new RegExp(String.raw`${this.__extraEntryPrefix}:(.*)[^ \n]`, 'g'),
        buildNewCiteCount,
      );
      $__gscc.debugger.info(
        `existing cite count in extra field, updating to ${buildNewCiteCount} ${revisedExtraField}`,
      );
    } else {
      $__gscc.debugger.info(`no existing cite count in extra field, adding`);
      revisedExtraField =
        `${buildNewCiteCount}${this.__extraEntrySeparator}`.concat(
          '',
          fieldExtra,
        );
    }
    item.setField('extra', revisedExtraField);

    try {
      await item.saveTx();
    } catch (e) {
      item.setField('extra', fieldExtra);
      $__gscc.debugger.error(
        `could not update extra field with citation count: ${e}`,
      );
      throw e;
    }

    await this.openProgressWindow(citeCount, item.getField('title'));
  },
  /**
   * Show the progress window pop-up with the latest change
   * @param {number} count Total number of citations
   * @param {string} title ZoteroItem title
   */
  openProgressWindow: async function (count, title) {
    const window = Zotero.getMainWindow();
    const progressPopUp = this.getProgressWindow();
    const headlineLabel = await window.document.l10n.formatValue(
      'gscc-progresswindow-title',
    );
    const descriptionLabel = await window.document.l10n.formatValue(
      'gscc-progresswindow-desc',
    );

    progressPopUp.changeHeadline(headlineLabel);
    progressPopUp.addDescription(`${descriptionLabel}: ${count}, "${title}"`);
    progressPopUp.show();
    progressPopUp.startCloseTimer();
  },

  /**
   * Retrieve the Google Scholar Citation Count for a given Zotero item record
   * @param {ZoteroGenericItem} item Used to generate the fetch() string
   * @param {function} callback callback on complete
   */
  retrieveCitationData: async function (item) {
    const targetUrl = await this.generateItemUrl(item);
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
    item,
    _callback = null,
    verificationAttempted = false,
  ) {
    $__gscc.debugger.info(`Request Status: ${requestStatus}`);
    if (
      requestStatus === 403 ||
      (requestStatus === 200 &&
        $__gscc.util.isVerificationPage(requestData, targetUrl))
    ) {
      $__gscc.debugger.warn('Google Scholar requires verification.');
      if (verificationAttempted) {
        await this.showStatus('gscc-status-blocked');
        return false;
      }
      await this.showStatus('gscc-status-background');
      const searchURL = await this.generateItemUrl(item);
      let response = await $__gscc.util.loadSearchInBackground(searchURL);
      if (response?.needsInteraction) {
        await this.showStatus('gscc-status-captcha');
        response = await $__gscc.util.openRecaptchaWindow(searchURL);
      }
      if (!response) {
        await this.showStatus('gscc-status-incomplete');
        return false;
      }
      return this.processCitationResponse(
        response.status,
        response.responseText,
        null,
        response.responseURL,
        item,
        null,
        true,
      );
    }
    if (requestStatus === 200) {
      if ($__gscc.util.hasCitationResults(requestData)) {
        const count = this.getCiteCount(requestData);
        if (!Number.isInteger(count) || count < 0) {
          await this.showStatus('gscc-status-unreadable');
          return null;
        }
        await this.updateItem(item, count);
        return true;
      }
      $__gscc.debugger.warn(
        `Google Scholar found no search result for requested item: ${targetUrl}`,
      );
      await this.showStatus('gscc-status-no-result');
      return null;
    }
    if (requestStatus === 429) {
      if (requestRetry)
        $__gscc.debugger.warn('Google Scholar is rate limiting requests.');
      await this.showStatus('gscc-status-rate-limited');
      return false;
    }
    $__gscc.debugger.error(
      `Google Scholar lookup failed: HTTP ${requestStatus}`,
    );
    await this.showStatus('gscc-status-failed');
    return false;
  },

  /**
   * Validate and return the Google Scholar URL API target
   * @returns {URL|null}
   */
  getApiEndpoint: async function () {
    let apiEndpoint;
    try {
      apiEndpoint = new URL(
        Zotero.Prefs.get(
          'extensions.zotero.gscc.defaultGsApiEndpoint',
          $__gscc.app.__preferenceDefaults.defaultGsApiEndpoint,
        ),
      );
    } catch {
      const window = Zotero.getMainWindow();
      const invalidGoogleScholarURL = await window.document.l10n.formatValue(
        'gscc-invalidGoogleScholarURL',
      );
      window.alert(invalidGoogleScholarURL);
      return null;
    }
    return apiEndpoint;
  },

  /**
   * Generate a Google Scholar URL to use to fetch data
   * @param {ZoteroGenericItem} item
   * @returns string
   */
  generateItemUrl: async function (item) {
    const apiEndpoint = await $__gscc.app.getApiEndpoint();
    const useSearchTitleFuzzyMatch = Zotero.Prefs.get(
      'extensions.zotero.gscc.useSearchTitleFuzzyMatch',
      $__gscc.app.__preferenceDefaults.useSearchTitleFuzzyMatch,
    );

    const useSearchAuthorsMatch = Zotero.Prefs.get(
      'extensions.zotero.gscc.useSearchAuthorsMatch',
      $__gscc.app.__preferenceDefaults.useSearchAuthorsMatch,
    );

    const useDateRangeMatch = Zotero.Prefs.get(
      'extensions.zotero.gscc.useDateRangeMatch',
      $__gscc.app.__preferenceDefaults.useDateRangeMatch,
    );

    // Strip HTML from titles as breaks matching in GS
    const parser = new DOMParser();
    const sanitizedTitle =
      parser.parseFromString(item.getField('title'), 'text/html').body
        .textContent || '';

    let titleSearchString;
    if (useSearchTitleFuzzyMatch) {
      $__gscc.debugger.info(
        `Search Param: Using Fuzzy Title Match per Preferences`,
      );
      titleSearchString = `${sanitizedTitle}`;
    } else {
      // this is a dead match; kinda risky for hand-entered data but match is
      // good on Zotero grabs
      titleSearchString = `"${sanitizedTitle}"`;
    }

    let paramAuthors = '';
    if (useSearchAuthorsMatch) {
      $__gscc.debugger.info(
        `Search Param: Adding Authors Match per Preferences`,
      );
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
    }

    let paramYearRange = '';
    if (useDateRangeMatch) {
      $__gscc.debugger.info(`Search Param: Adding Date Range per Preferences`);
      const year = parseInt(item.getField('year'));
      if (year) {
        paramYearRange = `&as_ylo=${year - 2}&as_yhi=${year + 2}`;
      }
    }

    const targetUrl = `${apiEndpoint.href}scholar?hl=en&q=${titleSearchString}&as_epq=&as_occt=title&num=1${paramAuthors}${paramYearRange}`;
    $__gscc.debugger.info(`Search Endpoint Ready: ${targetUrl}`);

    return encodeURI(targetUrl);
  },
  /**
   * Create the citation string for use on the item record
   * @param {number} citeCount
   * @returns string
   */
  buildCiteCountString: function (citeCount, publicationDate) {
    let data;
    if (citeCount < 0) {
      data = this.__noData;
    } else {
      data = $__gscc.util.padCountWithZeros(
        citeCount.toString(),
        this.__citeCountStrLength,
      );
    }
    const getRelevanceScore = this.calculateRelativeRelevance(
      publicationDate,
      citeCount,
    );

    return `${this.__extraEntryPrefix}: ${data} ${new Date().toISOString()} ${getRelevanceScore}`;
  },
  /**
   * Parse the raw response for citation count
   * @param {string} responseText The raw string data to look for cited data
   * @returns number
   */
  getCiteCount: function (responseText) {
    const citePrefix = `>${$__gscc.app.__citedByPrefix}`;
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
  /**
   * Number of citations since publication (citations / weeksSincePublication)
   * Proposed by @c-hoffmann
   */
  calculateRelativeRelevance: function (date, citationCount) {
    const publicationDate = date;
    const weeksSincePublication = Math.ceil(
      (new Date() - new Date(publicationDate)) / (1000 * 60 * 60 * 24 * 7),
    );
    const citationRatio = citationCount / weeksSincePublication;
    const formattedRatio = citationRatio.toFixed(2);

    if (isNaN(formattedRatio)) {
      return 0;
    }
    return formattedRatio;
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
