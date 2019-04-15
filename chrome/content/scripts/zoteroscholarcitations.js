let zsc = {
    _captchaString: '',
    _citeCountStrLength: 7,
    _extraPrefix: 'ZSCC',
    _extraEntrySep: ' \n',
    _noData : 'NoCitationData',
    _legacyDataRegex: /^(\d{5})(s?)/,
    _legacyNoDataRegex: /^No Citation Data/,
    _searchblackList: new RegExp('[-+~*"]', 'g')
};
// _extraPair: /^([^:]*):\s*([^\s]*)(.*)$/

zsc._extraPair = new RegExp(
    '^(' + zsc._extraPrefix + '): (\\d{' + zsc._citeCountStrLength + '}|'
    + zsc._noData + ')(s?)(.*)$'
);

zsc._extraStaleRegex = new RegExp('(' + zsc._extraPrefix + ': '
    + '\\d{' + zsc._citeCountStrLength + '})(s?)');

let isDebug = function() {
    return typeof Zotero != 'undefined'
        && typeof Zotero.Debug != 'undefined'
        && Zotero.Debug.enabled;
};

// this would be soo much less ugly if this zsc was a class :/

let prefixRegex =
    zsc._extraPrefix + ': ';
zsc._extraPrefixRegex = new RegExp(prefixRegex);

zsc.init = function() {
    let stringBundle = document.getElementById('zoteroscholarcitations-bundle');
    if (stringBundle != null) {
        this._captchaString = stringBundle.getString('captchaString');
        this._citedPrefixString = stringBundle.getString('citedPrefixString');
    }

    // Register the callback in Zotero as an item observer
    let notifierID = Zotero.Notifier.registerObserver(
        this.notifierCallback, ['item']);

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
            zsc.updateItem(item, zsc.buildCiteCountString(citeCount));
        });
    }
};

// TODO: make it less ugly, because holy ugly :(
zsc.updateItem = function(item, citeCountStr) {
    let curExtra = item.getField('extra');
    if (curExtra.length === 0) {
        if (isDebug()) Zotero.debug('[scholar-citations] '
            + 'setting empty extra field to cite count');
        item.setField('extra', citeCountStr);
    } else if (citeCountStr.indexOf(zsc._noData) == -1) {
        if (/:/.test(curExtra)) {
            zsc.updateExtraPairs(curExtra, item, citeCountStr);
        } else if (zsc._legacyDataRegex.test(curExtra)) {
            zsc.updateExtra(zsc._legacyDataRegex
                , curExtra, item, citeCountStr
                , 'updating legacy extra content with new cite count');
        } else if (zsc._legacyNoDataRegex.test(curExtra)) {
            zsc.updateExtra(zsc._legacyNoDataRegex
                , curExtra, item, citeCountStr
                ,'updating legacy no-data extra content with new cite count');
        } else {
            if (isDebug()) Zotero.debug('[scholar-citations] '
                + 'updating ');
            item.setField('extra', citeCountStr + zsc._extraEntrySep + curExtra);
        }
    } else {
        if (zsc._legacyNoDataRegex.test(curExtra)) {
            zsc.updateExtra(zsc._legacyNoDataRegex
                , curExtra, item, citeCountStr
                ,'updating legacy no-data extra content to new format');
        } else if (zsc._legacyDataRegex.test(curExtra)) {
            if (isDebug()) Zotero.debug('[scholar-citations] '
                + 'reformatting legacy entry and marking it as stale');
            let matches = curExtra.match(zsc._legacyDataRegex);
            let newExtra = curExtra.replace(zsc._legacyDataRegex,
                zsc._extraPrefix + ': 00' + matches[1] + 's');
            item.setField('extra', newExtra);
        } else if (zsc._extraStaleRegex.test(curExtra)) {
            if (isDebug()) Zotero.debug('[scholar-citations] '
                + 'marking entry as stale');
            let matches = curExtra.match(zsc._extraStaleRegex);
            let newExtra = curExtra.replace(zsc._extraStaleRegex, matches[1] + 's');
            item.setField('extra', newExtra);
        } else {
            if (isDebug()) Zotero.debug('[scholar-citations] '
                + ' not updating extra content of "'
                + item.getField('title')
                + '", because we didn\'t get a cite count from gs '
                + ' and it\'s not a field format zsc recognizes.');
        }
    }

    try { item.saveTx(); } catch (e) {
        if (isDebug()) Zotero.debug("[scholar-citations] "
            + "could not update extra content: " + e);
    }
};

zsc.updateExtraPairs = function(extra, item, citeCountStr) {
    if (isDebug()) Zotero.debug('[scholar-citations] '
        + 'updating extra content that contains key value pairs with new cite count');
    let newExtra = [];
    if (!zsc._extraPrefixRegex.test(extra)) {
        newExtra.push(citeCountStr);
        newExtra.push(extra);
    } else {
        extra.split(zsc._extraEntrySep).forEach(function(entry) {
            let matches = entry.match(zsc._extraPair);
            if (matches) {
                if (matches[1].trim() === zsc._extraPrefix) {
                    newExtra.push(citeCountStr + matches[4]);
                } else {
                    newExtra.push(matches.input);
                }
            } else {
                newExtra.push(entry);
            }
        });
    }
    item.setField('extra', newExtra.join(zsc._extraEntrySep));
}

zsc.updateExtra = function(regex, extra, item, citeCountStr, logMsg) {
    if (isDebug()) Zotero.debug('[scholar-citations] ' + logMsg);
    let newExtra = extra.replace(regex, citeCountStr);
    item.setField('extra', newExtra);
}

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
                if (isDebug()) Zotero.debug("[scholar-citations] "
                    + "recieved non-captcha scholar results");
                cb(item, zsc.getCiteCount(this.responseText));
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
                + 'could not retrieve the google scholar data. server returned: ['
                + xhr.status + ':'  + xhr.statusText + ']');
        } else {
            // request progress, I guess
        }
    };
    xhr.send();
};

zsc.generateItemUrl = function(item) {
    let baseUrl = 'https://scholar.google.com/';
    let url = baseUrl
        + 'scholar?hl=en&as_q='
        + zsc.cleanTitle(item.getField('title')).split(/\s/).join('+')
        + '&as_epq=&as_occt=title&num=1';

    let creators = item.getCreators();
    if (creators && creators.length > 0) {
        url += '&as_sauthors=';
        url += creators[0].lastName;
        for (let idx = 1; idx < creators.length; idx++) {
            url += '+' + creators[idx].lastName;
        }
    }

    let year = item.getField('year');
    if (year) {
        url += '&as_ylo=' + year + '&as_yhi=' + year;
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

zsc.getCiteCount = function(responseText) {
    let citePrefix = '>Cited by ';
    let citePrefixLen = citePrefix.length;
    let citeCountStart = responseText.indexOf(citePrefix);

    if (citeCountStart === -1) {
        return -1
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
