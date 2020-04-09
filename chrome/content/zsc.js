let zsc = {
    _captchaString: '',
    _citedPrefixString: 'Cited by ',
    _citeCountStrLength: 7,
    _extraPrefix: 'ZSCC',
    _extraEntrySep: ' \n',
    _noData : 'NoCitationData',
    _searchblackList: new RegExp('[-+~*":]', 'g'),
    _baseUrl : 'https://scholar.google.com/'
};

zsc._extraRegex = new RegExp(
    '^(?:(?:' + zsc._extraPrefix + ': )?)'
    + '((?:(?:\\d{'
      + zsc._citeCountStrLength +
    '}|'
      + zsc._noData +
    ')|(?:\\d{5}|No Citation Data))?)'
    + '\\[?s?(\\d|)\\]?'
    + '([^]*)$'
);

let isDebug = function() {
    return typeof Zotero != 'undefined'
        && typeof Zotero.Debug != 'undefined'
        && Zotero.Debug.enabled;
};

zsc.init = function() {
    let stringBundle = document.getElementById('zoteroscholarcitations-bundle');
    if (stringBundle != null) {
        this._captchaString = stringBundle.getString('captchaString');
        this._citedPrefixString = stringBundle.getString('citedPrefixString');
    }

    // Temporarily disable Notifier to observe add event,
    //     as the request cannot use local cookie when adding new item.
    // // Register the callback in Zotero as an item observer
    // let notifierID = Zotero.Notifier.registerObserver(
    //     this.notifierCallback, ['item']);

    // Unregister callback when the window closes (important to avoid a memory leak)
    window.addEventListener('unload', function(e) {
        Zotero.Notifier.unregisterObserver(notifierID);
    }, false);
};

// so citation counts will be queried for >all< items that are added to zotero!? o.O
zsc.notifierCallback = {
    notify: function(event, type, ids, extraData) {
        if (event == 'add') {
            zsc.processItems(Zotero.Items.get(ids));
        }
    }
};

zsc.hasRequiredFields = function(item) {
    return item.getField('title')
        && item.getCreators().length > 0;
}

zsc.updateCollectionMenuEntry = function() {
    if (!ZoteroPane.canEditLibrary()) {
        alert('You lack the permission to make edit to this library.');
        return;
    }

    let group = ZoteroPane.getSelectedGroup();
    if (group) {
        this.updateGroup(ZoteroPane.getSelectedGroup());
        return;
    };

    let collection = ZoteroPane.getSelectedCollection();
    if (collection) {
        this.updateCollection(collection);
        return;
    }

    alert('Updating citations for this type of Entry is not supported.');
    return;
};

zsc.updateItemMenuEntries = function() {
    if (!ZoteroPane.canEditLibrary()) {
        alert('You lack the permission to make edit to this library.');
        return;
    }
    this.processItems(ZoteroPane.getSelectedItems());
};

zsc.updateGroup = function(group) {
    alert('Updating a Group is not yet implemented.')
    return;
    //this.processUpdateQueue(items);
};

zsc.updateCollection = function(collection) {
    this.processItems(collection.getChildItems());
    let childColls = collection.getChildCollections();
    for (idx = 0; idx < childColls.length; ++idx) {
        this.updateCollection(childColls[idx]);
    }
};

zsc.processItems = function(items) {
    while (item = items.shift()) {
        if (!zsc.hasRequiredFields(item)) {
            if (isDebug()) Zotero.debug('[scholar-citations] '
                + 'skipping item "' + item.getField('title') + '"'
                + ' it has either an empty title or is missing creator information');
            continue;
        }
        this.retrieveCitationData(item, function(item, citeCount) {
            if (isDebug()) Zotero.debug('[scholar-citations] '
                + 'Updating item "' + item.getField('title') + '"');
            zsc.updateItem(item, citeCount);
        });
    }
};

zsc.updateItem = function(item, citeCount) {
    let curExtra = item.getField('extra');
    let matches = curExtra.match(zsc._extraRegex);
    let newExtra = '';

    if (citeCount >= 0) {
        newExtra += zsc.buildCiteCountString(citeCount);
        if (isDebug()) Zotero.debug('[scholar-citations] '
            + 'updating extra field with new cite count');
    } else {
        if (matches[1] === '') {
            if (isDebug()) Zotero.debug('[scholar-citations] '
                + 'updating extra field that contains no zsc content');
            newExtra += zsc.buildCiteCountString(citeCount);
        } else if (matches[1] === zsc._noData || matches[1] === 'No Citation Data') {
            if (isDebug()) Zotero.debug('[scholar-citations] '
                + 'updating extra field that contains "no data"');
            newExtra += zsc.buildCiteCountString(citeCount);
        } else {
            let oldCiteCount = parseInt(matches[1]);
            newExtra += zsc.buildCiteCountString(oldCiteCount);
            if (isDebug()) Zotero.debug('[scholar-citations] '
                + 'updating extra field that contains cite count');
        }

        if (!matches[2]) {
            if (isDebug()) Zotero.debug('[scholar-citations] '
                + 'marking extra field as stale');
            newExtra += zsc.buildStalenessString(0);
        } else {
            if (isDebug()) Zotero.debug('[scholar-citations] '
                + 'increasing staleness counter in extra field');
            newExtra += zsc.buildStalenessString((parseInt(matches[2]) + 1) % 10);
        }
    }

    if (/^\s\n/.test(matches[3]) || matches[3] === '') {
        // do nothing, since the separator is already correct or not needed at all
    } else if (/^\n/.test(matches[3])) {
        newExtra += ' ';
    } else {
        newExtra += zsc._extraEntrySep;
    }
    newExtra += matches[3];

    item.setField('extra', newExtra);

    try { item.saveTx(); } catch (e) {
        if (isDebug()) Zotero.debug("[scholar-citations] "
            + "could not update extra content: " + e);
    }
};

// TODO: complex version, i.e. batching + retrying + blocking for solved captchas
// this prob. involves some nasty callback hell shit
// TODO: retries with random author permutations decreasing in author number :^)
zsc.retrieveCitationData = function(item, cb) {
    let url = this.generateItemUrl(item);
    if (isDebug()) Zotero.debug("[scholar-citations] GET " + url);
    let citeCount;
    let xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            if (this.responseText.indexOf('www.google.com/recaptcha/api.js') == -1) {
                if (isDebug()) Zotero.debug('[scholar-citations] '
                    + 'recieved non-captcha scholar results');
                cb(item, zsc.getCiteCount(this.responseText));
            } else {
                if (isDebug()) Zotero.debug('[scholar-citations] '
                    + 'received a captcha instead of a scholar result');
                alert(zsc._captchaString);
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
        } else if (this.readyState == 4 && this.status == 429) {
            if (this.responseText.indexOf('www.google.com/recaptcha/api.js') == -1) {
                if (isDebug()) Zotero.debug('[scholar-citations] '
                    + 'could not retrieve the google scholar data. Server returned: ['
                    + xhr.status + ': '  + xhr.statusText + ']. '
                    + 'GS want\'s you to wait for ' + this.getResponseHeader("Retry-After")
                    + ' seconds before sending further requests.');
            } else {
                if (isDebug()) Zotero.debug("[scholar-citations] "
                    + "received a captcha instead of a scholar result");
                alert(zsc._captchaString);
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
            if (isDebug()) Zotero.debug('[scholar-citations] '
                + 'could not retrieve the google scholar data. Server returned: ['
                + xhr.status + ': '  + xhr.statusText + ']');
        } else {
            // request progress, I guess
        }
    };
    xhr.send();
};

zsc.generateItemUrl = function(item) {
    let url = this._baseUrl
        + 'scholar?hl=en&as_q='
        + zsc.cleanTitle(item.getField('title')).split(/\s/).join('+')
        + '&as_epq=&as_occt=title&num=1';

    let creators = item.getCreators();
    if (creators && creators.length > 0) {

        // using the first three authors is enough for accurate retrieval
        num_creators = creators.length > 3 ? 3 : creators.length;

        url += '&as_sauthors=';
        url += creators[0].lastName;
        for (let idx = 1; idx < num_creators; idx++) {
            url += '+' + creators[idx].lastName;
        }
    }

    let year = parseInt(item.getField('year'));
    if (year) {
        // set a small range of year instead of an exact number
        url += '&as_ylo=' + (year - 2) + '&as_yhi=' + (year + 2);
    }

    return encodeURI(url);
};

zsc.cleanTitle = function(title) {
    return title.replace(zsc._searchblackList, ' ');
};

zsc.padLeftWithZeroes = function(numStr) {
    let output = '';
    let cnt = this._citeCountStrLength - numStr.length;
    for (let i = 0; i < cnt; i++) { output += '0'; }
    output += numStr;
    return output;
};

zsc.buildCiteCountString = function(citeCount) {
    if (citeCount < 0)
        return this._extraPrefix + ': ' + this._noData;
    else
        return this._extraPrefix + ': ' + this.padLeftWithZeroes(citeCount.toString());
};

zsc.buildStalenessString = function(stalenessCount) {
    return '[s' + stalenessCount + ']';
};

zsc.getCiteCount = function(responseText) {
    let citePrefix = '>' + this._citedPrefixString;
    let citePrefixLen = citePrefix.length;
    let citeCountStart = responseText.indexOf(citePrefix);

    if (citeCountStart === -1) {
        if (responseText.indexOf('class="gs_rt"') === -1)
            return -1;
        else
            return 0;
    } else {
        let citeCountEnd = responseText.indexOf('<', citeCountStart);
        let citeStr = responseText.substring(citeCountStart, citeCountEnd);
        let citeCount = citeStr.substring(citePrefixLen);
        return parseInt(citeCount.trim());
    }
};

if (typeof window !== 'undefined') {
    window.addEventListener('load', function(e) { zsc.init(); }, false);

    // API export for Zotero UI
    // Can't imagine those to not exist tbh
    if (!window.Zotero) window.Zotero = {};
    if (!window.Zotero.ScholarCitations) window.Zotero.ScholarCitations = {};
    // note sure about any of this
    window.Zotero.ScholarCitations.updateCollectionMenuEntry
        = function() { zsc.updateCollectionMenuEntry(); };
    window.Zotero.ScholarCitations.updateItemMenuEntries
        = function() { zsc.updateItemMenuEntries(); };
}

if (typeof module !== 'undefined') module.exports = zsc;
