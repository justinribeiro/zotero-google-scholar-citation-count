// eslint-disable-next-line camelcase
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

// eslint-disable-next-line camelcase
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
};

/**
 * A short hand typedef for general use, not exhaustive of the Zotero Schema
 * @typedef {Object} ZoteroGenericItem
 * @property {function} getCreators returns an array of creators/authors
 * @property {function} getField returns a specific schema field
 */

const gsCitationCount = {
  _captchaString: '',
  _citedPrefixString: 'Cited by ',
  _citeCountStrLength: 7,
  _extraPrefix: 'GSCC',
  _extraEntrySep: ' \n',
  _noData: 'NoCitationData',
  _baseUrl: 'https://scholar.google.com/',

  _min_wait_time: 2000,
  _max_wait_time: 7000,

  _extraRegex: new RegExp(
      '^(?:(?:' +
      this._extraPrefix +
      ': )?)' +
      '((?:(?:\\d{' +
      this._citeCountStrLength +
      '}|' +
      this._noData +
      ')|(?:\\d{5}|No Citation Data))?)' +
      '\\[?s?(\\d|)\\]?' +
      '([^]*)$',
  ),
  /**
   * Initialize our world.
   * @return {void}
   */
  init: () => {
    const stringBundle = document.getElementById(
        'zoteroscholarcitations-bundle',
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
  updateGroup: (group) => {
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
                'title',
            )}': empty title or missing creator information'`,
        );
        continue;
      }
      $__gsccDebugger.info(`queued for ${time} ms later.`);

      // using setTimeout(non-blocking) to delay execution
      setTimeout(
          gsCitationCount.retrieveCitationData,
          time,
          item,
          (item, citeCount) => {
            $__gsccDebugger.info(`updating item '${item.getField('title')}'`);
            gsCitationCount.updateItem(item, citeCount);
          },
      );
      // cumulate time for next retrieve
      time += $__gsccUtil.randomInteger(
          gsCitationCount._min_wait_time,
          gsCitationCount._max_wait_time,
      );
    }
  },
  /**
   * update a record with the citation data
   * @param {ZoteroGenericItem} item
   * @param {number} citeCount
   */
  updateItem: (item, citeCount) => {
    const curExtra = item.getField('extra');
    const matches = curExtra.match(gsCitationCount._extraRegex);
    let newExtra = '';

    if (citeCount >= 0) {
      newExtra += gsCitationCount.buildCiteCountString(citeCount);
      $__gsccDebugger.info(`updating extra field with new cite count`);
    } else {
      if (matches[1] === '') {
        $__gsccDebugger.info(
            `updating extra field that contains no zsc content`,
        );
        newExtra += gsCitationCount.buildCiteCountString(citeCount);
      } else if (
        matches[1] === gsCitationCount._noData ||
        matches[1] === 'No Citation Data'
      ) {
        $__gsccDebugger.info(`updating extra field that contains "no data"`);
        newExtra += gsCitationCount.buildCiteCountString(citeCount);
      } else {
        const oldCiteCount = parseInt(matches[1]);
        newExtra += gsCitationCount.buildCiteCountString(oldCiteCount);
        $__gsccDebugger.info(`updating extra field that contains cite count`);
      }

      if (!matches[2]) {
        $__gsccDebugger.info(`marking extra field as stale`);
        newExtra += gsCitationCount.buildStalenessString(0);
      } else {
        $__gsccDebugger.info(`increasing staleness counter in extra field`);
        newExtra += gsCitationCount.buildStalenessString(
            (parseInt(matches[2]) + 1) % 10,
        );
      }
    }

    if (/^\s\n/.test(matches[3]) || matches[3] === '') {
      // do nothing, since the separator is already correct or not needed at all
    } else if (/^\n/.test(matches[3])) {
      newExtra += ' ';
    } else {
      newExtra += gsCitationCount._extraEntrySep;
    }
    newExtra += matches[3];

    item.setField('extra', newExtra);

    try {
      item.saveTx();
    } catch (e) {
      $__gsccDebugger.error(`could not update extra content: ${e}`);
    }
  },
  retrieveCitationData: (item, cb) => {
    const url = gsCitationCount.generateItemUrl(item);

    $__gsccDebugger.info(`GET ${url}`);

    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        if (this.responseText.indexOf('class="gs_r gs_or gs_scl"') != -1) {
          $__gsccDebugger.info(`received non-captcha scholar results`);
          cb(item, gsCitationCount.getCiteCount(this.responseText));
          // check if response includes captcha
        } else if (
          this.responseText.indexOf('www.google.com/recaptcha/api.js') != -1
        ) {
          $__gsccDebugger.warn(
              `received a captcha instead of a scholar result`,
          );
          alert(gsCitationCount._captchaString);
          if (typeof Zotero.openInViewer !== 'undefined') {
            Zotero.openInViewer(url);
          } else if (typeof ZoteroStandalone !== 'undefined') {
            ZoteroStandalone.openInViewer(url);
          } else if (typeof Zotero.launchURL !== 'undefined') {
            Zotero.launchURL(url);
          } else {
            window.gBrowser.loadOneTab(url, {inBackground: false});
          }
        } else {
          $__gsccDebugger.warn(
              // eslint-disable-next-line max-len
              `neither got meaningful text or captcha, please check the following response text`,
          );
          $__gsccDebugger.warn(this.responseText);
          alert(
              'neither got meaningful text or captcha, please check it in log',
          );
        }
      } else if (this.readyState == 4 && this.status == 429) {
        if (
          this.responseText.indexOf('www.google.com/recaptcha/api.js') == -1
        ) {
          $__gsccDebugger.error(
              // eslint-disable-next-line max-len
              `could not retrieve the google scholar data: ${xhr.status}: ${
                xhr.statusText
              }, retry after ${this.getResponseHeader('Retry-After')} seconds.`,
          );
        } else {
          $__gsccDebugger.warn(
              `received a captcha instead of a scholar result`,
          );

          alert(gsCitationCount._captchaString);
          if (typeof Zotero.openInViewer !== 'undefined') {
            Zotero.openInViewer(url);
          } else if (typeof ZoteroStandalone !== 'undefined') {
            ZoteroStandalone.openInViewer(url);
          } else if (typeof Zotero.launchURL !== 'undefined') {
            Zotero.launchURL(url);
          } else {
            window.gBrowser.loadOneTab(url, {inBackground: false});
          }
        }
      } else if (this.readyState == 4) {
        $__gsccDebugger.error(
            // eslint-disable-next-line max-len
            `could not retrieve the google scholar data: ${xhr.status}: ${xhr.statusText}`,
        );
      } else {
        // request progress, I guess
      }
    };
    xhr.send();
  },
  generateItemUrl: (item) => {
    let url =
      gsCitationCount._baseUrl +
      'scholar?hl=en&q=' +
      // + zsc.cleanTitle(item.getField('title'))
      item.getField('title') +
      '&as_epq=&as_occt=title&num=1';

    const creators = item.getCreators();
    if (creators && creators.length > 0) {
      // using the first three authors is enough for accurate retrieval
      const numCreators = creators.length > 3 ? 3 : creators.length;

      url += '&as_sauthors=';
      url += creators[0].lastName;
      for (let idx = 1; idx < numCreators; idx++) {
        url += '+' + creators[idx].lastName;
      }
    }

    const year = parseInt(item.getField('year'));
    if (year) {
      // set a small range of year instead of an exact number
      url += '&as_ylo=' + (year - 2) + '&as_yhi=' + (year + 2);
    }

    return encodeURI(url);
  },
  padLeftWithZeroes: (numStr) => {
    let output = '';
    const cnt = gsCitationCount._citeCountStrLength - numStr.length;
    for (let i = 0; i < cnt; i++) {
      output += '0';
    }
    output += numStr;
    return output;
  },
  buildCiteCountString: (citeCount) => {
    if (citeCount < 0) {
      return gsCitationCount._extraPrefix + ': ' + gsCitationCount._noData;
    } else {
      return (
        gsCitationCount._extraPrefix +
        ': ' +
        gsCitationCount.padLeftWithZeroes(citeCount.toString())
      );
    }
  },
  buildStalenessString: (stalenessCount) => {
    return '[s' + stalenessCount + ']';
  },
  getCiteCount: (responseText) => {
    const citePrefix = '>' + gsCitationCount._citedPrefixString;
    const citePrefixLen = citePrefix.length;
    const citeCountStart = responseText.indexOf(citePrefix);

    if (citeCountStart === -1) {
      if (responseText.indexOf('class="gs_rt"') === -1) return -1;
      else return 0;
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
