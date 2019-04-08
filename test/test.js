var zsc = require('../chrome/content/scripts/zoteroscholarcitations.js');
var assert = require('assert');
var sinon = require('sinon');
var request = require('sync-request');

var items = [
{
    'citations': 400,
    'title': 'Energy-aware resource allocation heuristics for efficient management of data centers for cloud computing',
    'date': '2012',
    'creators': [{
        'firstName': 'Anton',
        'lastName': 'Beloglazov'
    }, {
        'firstName': 'Jemal',
        'lastName': 'Abawajy'

    }, {
        'firstName': 'Rajkumar',
        'lastName': 'Buyya'
    }]
},{
    'citations': 50,
    'title': 'Optimal value of information in graphical models',
    'date': '2009',
    'creators': [{
        'firstName': 'Andreas',
        'lastName': 'Krause',
    }, {
        'firstName': 'Carlos',
        'lastName': 'Guestrin',
    }]
}];


function createMockItem(item) {
    var mock = {
        citations: item.citations,
        getField: sinon.stub(),
        getCreators: sinon.stub()
    };
    mock.getField.withArgs('title').returns(item.title);
    mock.getField.withArgs('date').returns(item.date);
    mock.getCreators.returns(item.creators);
    return mock;
}

function fetchCitations(item) {
    var url = zsc.generateItemUrl(item);
    var res = request('GET', url);
    var content = res.body.toString('utf-8');
    return parseInt(zsc.getCitationCount(content));
}

suite('Zotero Scholar Citations', function() {
    suite('Unit Tests', function() {
        suite('ScholarCitations', function() {
            suite('.fillZeros()', function() {
                test('Should fill an empty string with zeroes', function() {
                    assert.equal(zsc.fillZeros(''), '0000000');
                });

                test('Should fill a non-empty string with zeroes', function() {
                    assert.equal(zsc.fillZeros('1'), '0000001');
                });

                test('Should be idempotent', function() {
                    assert.equal(zsc.fillZeros(zsc.fillZeros('32')), zsc.fillZeros('32'));
                });

                test('Should not change a string that\'s already too long', function() {
                    assert.equal(zsc.fillZeros('foobarbar'), 'foobarbar');
                });
            });



            suite('.generateItemUrl()', function () {
                var url;
                suiteSetup(function() {
                    url = zsc.generateItemUrl(createMockItem(items[1]));
                });

                test('should return a URI encoded string', function() {
                    // needs work
                    // only catches strings that are unencoded and contains URI escape symbols
                    assert.equal(url, encodeURI(decodeURI(url)));
                });

                test('should only search in the title', function() {
                    assert.notEqual(url.indexOf('as_occt=title'), -1);
                });

                test('should include the entire title as exact search', function() {
                    assert.notEqual(url.indexOf('as_epq='
                        + 'Optimal+value+of+information+in+graphical+models'), -1);
                });

                test('should include all authors', function() {
                    assert.notEqual(url.indexOf('as_sauthors=Krause+Guestrin'), -1);
                });

                test('should include the exact year', function() {
                    assert.notEqual(url.indexOf('as_ylo=2009'), -1);
                    assert.notEqual(url.indexOf('as_yhi=2009'), -1);
                });

                test('should show only one result', function() {
                    assert.notEqual(url.indexOf('num=1'), -1);
                });
            });

            suite('.getCitationCount()', function () {
                test('should extract citation count from a string', function() {
                    var text = 'foo<a href="http://foo.bar/">Cited by 42</a>bar';
                    assert.equal(zsc.getCitationCount(text), '0000042');
                });

                test('should return explanation string, if no citation count is found', function() {
                    var text = 'foobar';
                    assert.equal(zsc.getCitationCount(text), 'No Citation Data');
                });
            });

            suite('.updateItem()', function () {
                test('should update items', function() {
                    assert.equal(true, true);
                });
            });
        });

    });

    suite('Integration Tests', function () {
        this.timeout(0);

        test('fetchCitations', function() {
            items.forEach(function (item) {
                var mock = createMockItem(item);
                assert(fetchCitations(mock) > mock.citations);
            });
        });
    });
});
