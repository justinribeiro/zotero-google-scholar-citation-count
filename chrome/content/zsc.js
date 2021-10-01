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

const $__gsccDebugger = {
  /**
   * Print an info message to the console
   * @param {string} message
   */
  info: (message) => {
    $__gsccDebugger.__debugMessage(message, 3);
  },
  /**
   * Print a debug message to the console
   * @param {string} message
   */
  debug: (message) => {
    $__gsccDebugger.__debugMessage(message, 2);
  },
  /**
   * Print an error message to the console
   * @param {string} message
   */
  warn: (message) => {
    $__gsccDebugger.__debugMessage(message, 1);
  },
  /**
   * Print an warning message to the console
   * @param {string} message
   */
  error: (message) => {
    $__gsccDebugger.__debugMessage(message, 0);
  },
  /**
   * Print a message to the debug console
   * @param {string} message
   * @param {number} level
   * @param {number} maxDepth
   * @param {object} stack
   */
  __debugMessage: (message, level = 3, maxDepth = 5, stack = null) => {
    const prependMessage = `[ZGSC]: ${message}`;
    Zotero.Debug.log(prependMessage, level, maxDepth, stack);
  },
};

const $__gsccUtil = {
  /**
   * Get a random number
   * @param {number} min
   * @param {number} max
   * @return {number}
   */
  randomInteger: (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },
  /**
   * Checks to validate whether the source code has a recaptcha within it
   * @param {string} source source code to parse and search for recaptcha
   * include
   * @return {boolean}
   */
  hasRecaptcha: (source) => {
    // if the onload is there, we know it's going to inject the iframe as
    // opposed to just a general include
    return source.includes('google.com/recaptcha/api.js?onload');
  },
  /**
   * Checks to validate if we have a search result in the data
   * @param {string} source source code to parse and search for data
   * @return {boolean}
   */
  hasCitationResults: (source) => {
    return source.includes('class="gs_r gs_or gs_scl"');
  },
  /**
   * Add zero's to a given string
   * @param {string} string the string to pad with zeros
   * @param {number} length the length of the string
   * @returns
   */
  padCountWithZeros: (string, length) => {
    return string.padStart(length, '0');
  },
  /**
   * Open a user interactive window to complete the recaptcha check
   * @param {string} targetUrl The url which caused the recaptcha
   * @return {void}
   */
  openRecaptchaWindow: (targetUrl) => {
    alert(gsCitationCount._captchaString);
    if (
      typeof Zotero.openInViewer !== 'undefined' ||
      typeof ZoteroStandalone !== 'undefined'
    ) {
      Zotero.openInViewer(targetUrl);
    } else if (typeof Zotero.launchURL !== 'undefined') {
      Zotero.launchURL(targetUrl);
    } else {
      window.gBrowser.loadOneTab(targetUrl, { inBackground: false });
    }
  },
};

const gsCitationCount = {
  /**
   * The string to display to user when Google Scholar requires robot check;
   * protected because can be overridden by locale
   * @protected
   */
  _captchaString: '',
  /**
   * The string to search for on Google Scholar to pull the citation count;
   * protected because can be overridden by locale
   * @protected
   */
  _citedPrefixString: 'Cited by ',
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

  /**
   * The min wait time for sending an API request, in milliseconds
   * @private
   */
  __minWaitMs: 2000,
  /**
   * The max wait time for sending an API request, in milliseconds
   * @private
   */
  __maxWaitMs: 7000,
  /**
   * Initialize our world.
   * @return {void}
   */
  init: () => {
    const stringBundle = document.getElementById(
      'zoteroscholarcitations-bundle'
    );
    if (stringBundle != null) {
      gsCitationCount._captchaString = stringBundle.getString('captchaString');
      gsCitationCount._citedPrefixString =
        stringBundle.getString('citedPrefixString');
    }
  },
  /**
   * Verify is the Zotero item record has a title and creators (otherwise we
   * can't query)
   * @param {ZoteroGenericItem} item
   * @return {boolean}
   */
  hasRequiredFields: (item) => {
    return item.getField('title') && item.getCreators().length > 0;
  },
  updateCollectionMenuEntry: () => {
    if (!ZoteroPane.canEditLibrary()) {
      alert('You lack the permission to make edit to this library.');
      return;
    }

    const group = ZoteroPane.getSelectedGroup();
    if (group) {
      gsCitationCount.updateGroup(ZoteroPane.getSelectedGroup());
      return;
    }

    const collection = ZoteroPane.getSelectedCollection();
    if (collection) {
      gsCitationCount.updateCollection(collection);
      return;
    }

    alert('Updating citations for this type of Entry is not supported.');
    return;
  },
  updateItemMenuEntries: () => {
    if (!ZoteroPane.canEditLibrary()) {
      alert('You lack the permission to make edit to this library.');
      return;
    }
    gsCitationCount.processItems(ZoteroPane.getSelectedItems());
  },
  updateGroup: () => {
    alert('Updating a Group is not yet implemented.');
    return;
  },
  updateCollection: (collection) => {
    gsCitationCount.processItems(collection.getChildItems());
    const childCollections = collection.getChildCollections();
    for (let idx = 0; idx < childCollections.length; ++idx) {
      gsCitationCount.updateCollection(childCollections[idx]);
    }
  },
  processItems: (items) => {
    // try to add delay execution to get rid of reCAPTCHA
    let time = 0;

    /**
     * @type {ZoteroGenericItem}
     */
    let item;

    while (typeof (item = items.shift()) !== 'undefined') {
      if (!gsCitationCount.hasRequiredFields(item)) {
        $__gsccDebugger.warn(
          `skipping item '${item.getField(
            'title'
          )}': empty title or missing creator information'`
        );
        continue;
      }
      $__gsccDebugger.info(`queued for ${time} ms later.`);

      setTimeout(
        gsCitationCount.retrieveCitationData,
        time,
        item,
        (item, citeCount) => {
          $__gsccDebugger.info(`updating item '${item.getField('title')}'`);
          gsCitationCount.updateItem(item, citeCount);
        }
      );
      // cumulate time for next retrieve
      time += $__gsccUtil.randomInteger(
        gsCitationCount.__minWaitMs,
        gsCitationCount.__maxWaitMs
      );
    }
  },
  /**
   * update a record with the citation data
   * @param {ZoteroGenericItem} item
   * @param {number} citeCount
   */
  updateItem: (item, citeCount) => {
    const fieldExtra = item.getField('extra');
    const buildNewCiteCount = gsCitationCount.buildCiteCountString(citeCount);
    let revisedExtraField;

    if (fieldExtra.startsWith(gsCitationCount.__extraEntryPrefix)) {
      $__gsccDebugger.info(`existing cite count in extra field, updating`);
      revisedExtraField = fieldExtra.replace(
        RegExp(
          `${gsCitationCount.__extraEntryPrefix}.*${gsCitationCount.__extraEntrySeparator}`,
          'g'
        ),
        buildNewCiteCount
      );
    } else {
      $__gsccDebugger.info(`no existing cite count in extra field, adding`);
      revisedExtraField = buildNewCiteCount.concat('', fieldExtra);
    }
    item.setField('extra', revisedExtraField);

    try {
      item.saveTx();
    } catch (e) {
      $__gsccDebugger.error(
        `could not update extra field with citation count: ${e}`
      );
    }
  },
  /**
   * Retrieve the Google Scholar Citation Count for a given Zotero item record
   * @param {ZoteroGenericItem} item Used to generate the fetch() string
   * @param {function} callback callback on complete
   */
  retrieveCitationData: (item, callback) => {
    const targetUrl = gsCitationCount.generateItemUrl(item);

    $__gsccDebugger.info(`GET ${targetUrl}`);

    // Sadly, fetch() won't work here because Google is wise to the no-js, which
    // in a twisted turn XHR passes
    const request = new XMLHttpRequest();
    request.open('GET', targetUrl, true);
    request.onreadystatechange = () => {
      if (request.readyState === 4) {
        const retryCheck = request.getResponseHeader('Retry-After');
        const rawData = request.responseText;

        switch (request.status) {
          case 200:
            if (!$__gsccUtil.hasRecaptcha(rawData)) {
              if ($__gsccUtil.hasCitationResults(rawData)) {
                $__gsccDebugger.info(
                  `Google Scholar returned search result, parsing cite count`
                );
                callback(item, gsCitationCount.getCiteCount(rawData));
              } else {
                $__gsccDebugger.warn(
                  `Google Scholar found no search result for requested item: ${targetUrl}`
                );
              }
            } else {
              $__gsccDebugger.warn(
                'Google Scholar asking for recaptcha, opening window.'
              );
              $__gsccUtil.openRecaptchaWindow(targetUrl);
            }
            break;
          case 404:
            $__gsccDebugger.error(
              `Google Scholar could not find the requested page.`
            );
            break;
          case 429:
            if (retryCheck) {
              $__gsccDebugger.warn(
                `Google Scholar asks for retry after ${retryCheck} seconds, re-queuing request.`
              );
              // TODO requeue
            }
            break;
          default:
            $__gsccDebugger.error(
              `Google Scholar fetch failed for item: ${targetUrl}`
            );
            break;
        }
      }
    };
    request.send();
  },
  /**
   * Generate a Google Scholar URL to use to fetch data
   * @param {ZoteroGenericItem} item
   * @returns string
   */
  generateItemUrl: (item) => {
    let paramDateRange = '';
    let paramAuthors = '';

    /**
     * @type array
     */
    const creators = item.getCreators() || [];

    if (creators.length > 0) {
      paramAuthors = `&as_sauthors=${creators
        .map((author) => author.lastName)
        .slice(0, 3)
        .join('+')}`;
    }

    const year = parseInt(item.getField('year'));
    if (year) {
      paramDateRange = `&as_ylo=${year - 2}&as_yhi=${year + 2}`;
    }

    const targetUrl = `${
      gsCitationCount.__apiEndpoint
    }scholar?hl=en&q=${item.getField(
      'title'
    )}&as_epq=&as_occt=title&num=1${paramAuthors}${paramDateRange}`;

    return encodeURI(targetUrl);
  },
  /**
   * Create the citation string for use on the item record
   * @param {number} citeCount
   * @returns string
   */
  buildCiteCountString: (citeCount) => {
    let data;
    if (citeCount < 0) {
      data = gsCitationCount.__noData;
    } else {
      data = $__gsccUtil.padCountWithZeros(
        citeCount.toString(),
        gsCitationCount.__citeCountStrLength
      );
    }
    // technically, you don't have to do it this way, but this is easier to
    // understand from an implementation standpoint since we need the new line
    // separator in the regex for finding things
    return (
      `${gsCitationCount.__extraEntryPrefix}: ${data}` +
      gsCitationCount.__extraEntrySeparator
    );
  },
  getCiteCount: (responseText) => {
    const citePrefix = '>' + gsCitationCount._citedPrefixString;
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

window.addEventListener('load', () => gsCitationCount.init(), false);

if (!window.Zotero.ScholarCitations) window.Zotero.ScholarCitations = {};

window.Zotero.ScholarCitations.updateCollectionMenuEntry = () => {
  gsCitationCount.updateCollectionMenuEntry();
};

window.Zotero.ScholarCitations.updateItemMenuEntries = () => {
  gsCitationCount.updateItemMenuEntries();
};

// For testing only
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { gsCitationCount, $__gsccDebugger, $__gsccUtil };
}
