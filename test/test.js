let zsc = require('../chrome/content/zsc.js');
let assert = require('assert');
let sinon = require('sinon');
let request = require('sync-request');

suite('Unit Tests', function() {
    suite('zsc', function() {
        suite('.padLeftWithZeroes()', function() {
            test('Should fill an empty string with zeroes', function() {
                assert.equal(zsc.padLeftWithZeroes(''), '0000000');
            });

            test('Should fill a non-empty string with zeroes', function() {
                assert.equal(zsc.padLeftWithZeroes('1'), '0000001');
            });

            test('Should be idempotent', function() {
                assert.equal(zsc.padLeftWithZeroes(zsc.padLeftWithZeroes('32')), zsc.padLeftWithZeroes('32'));
            });

            test('Should not change a string that\'s already too long', function() {
                assert.equal(zsc.padLeftWithZeroes('foobarbar'), 'foobarbar');
            });
        });

        suite('.generateItemUrl()', function () {
            let url;
            suiteSetup(function() {
                url = zsc.generateItemUrl(createItem(items[1]));
            });

            test('should return a URI encoded string', function() {
                // TODO: needs work
                // only catches strings that are unencoded and contains URI escape symbols
                assert.equal(url, encodeURI(decodeURI(url)));
            });

            test('should only search in the title', function() {
                assert.notEqual(url.indexOf('as_occt=title'), -1);
            });

            test('should include the entire title', function() {
                assert.notEqual(url.indexOf('as_q='
                    + 'Optimal+value+of+information+in+graphical+models'), -1);
            });

            test('should include all authors', function() {
                assert.notEqual(url.indexOf('as_sauthors=Krause+Guestrin'), -1);
            });

            test('should include the exact year', function() {
                assert.notEqual(url.indexOf('as_ylo=2009'), -1);
                assert.notEqual(url.indexOf('as_yhi=2009'), -1);
            });

            test('should show only one result per page', function() {
                assert.notEqual(url.indexOf('num=1'), -1);
            });
        });

        suite('.cleanTitle()', function () {
            test('should remove all blacklisted characters', function() {
                assert(!/[-+~*"]/.test(zsc.cleanTitle('Foo"bar*bar~foo+bar-foo')));
            });
        });

            suite('.getCiteCount()', function () {
                test('should extract citation count from a string', function() {
                    let text = 'foo<a href="http://foo.bar/">Cited by 42</a>bar';
                    assert.equal(zsc.getCiteCount(text), 42);
                });

                test('should return -1, if no citation count is found', function() {
                    let text = 'foobar';
                    assert.equal(zsc.getCiteCount(text), -1);
                });
            });

            suite('.buildCiteCountString()', function () {
                test('should embed number zeropadded into string', function() {
                    assert(zsc.buildCiteCountString(42), "ZSCC: 0000042")
                });

                test('should show hint in case of error', function() {
                    assert(zsc.buildCiteCountString(-1), "ZSCC: NoCitationData")
                });
            });

        suite('.updateCollection()', function() {
            test('should trigger processing of all items in a collection and it\'s subcollections', function() {
                // Given
                let collection = createNestedCollection();
                let zscMock = sinon.mock(zsc);
                let zscExpec = zscMock.expects('processItems').exactly(2);

                // When
                zsc.updateCollection(collection);

                // Then
                zscExpec.verify();
                zscMock.restore();
            });
        });


        suite('._extraRegex', function() {
            test('should match empty string', function() {
                let matches = ''.match(zsc._extraRegex);
                assert.equal(matches.length, 4);
                assert.equal(matches[1], '');
                assert.equal(matches[2], '');
                assert.equal(matches[3], '');
            });

            test('should match zsc content', function() {
                let matches = 'ZSCC: 0000042'.match(zsc._extraRegex);
                assert.equal(matches.length, 4);
                assert.equal(matches[1], '0000042');
                assert.equal(matches[2], '');
                assert.equal(matches[3], '');
            });

            test('should match zsc no data', function() {
                let matches = 'ZSCC: NoCitationData'.match(zsc._extraRegex);
                assert.equal(matches.length, 4);
                assert.equal(matches[1], 'NoCitationData');
                assert.equal(matches[2], '');
                assert.equal(matches[3], '');
            });

            test('should match zsc content marked as stale', function() {
                let matches = 'ZSCC: 0000042[s0]'.match(zsc._extraRegex);
                assert.equal(matches.length, 4);
                assert.equal(matches[1], '0000042');
                assert.equal(matches[2], '0');
                assert.equal(matches[3], '');
            });

            test('should match zsc no data marked as stale', function() {
                let matches = 'ZSCC: NoCitationData[s0]'.match(zsc._extraRegex);
                assert.equal(matches.length, 4);
                assert.equal(matches[1], 'NoCitationData');
                assert.equal(matches[2], '0');
                assert.equal(matches[3], '');
            });

            test('should match legacy zsc content', function() {
                let matches = '00021'.match(zsc._extraRegex);
                assert.equal(matches.length, 4);
                assert.equal(matches[1], '00021');
                assert.equal(matches[2], '');
                assert.equal(matches[3], '');
            });

            test('should match legacy zsc no data', function() {
                let matches = 'No Citation Data'.match(zsc._extraRegex);
                assert.equal(matches.length, 4);
                assert.equal(matches[1], 'No Citation Data');
                assert.equal(matches[2], '');
                assert.equal(matches[3], '');
            });

            test('should match random content following zsc content', function() {
                let matches = 'ZSCC: 0000042 \nFooBar'.match(zsc._extraRegex);
                assert.equal(matches.length, 4);
                assert.equal(matches[1], '0000042');
                assert.equal(matches[2], '');
                assert.equal(matches[3], ' \nFooBar');
            });

            test('should match random content following zsc no data', function() {
                let matches = 'ZSCC: NoCitationData \nFooBar'.match(zsc._extraRegex);
                assert.equal(matches.length, 4);
                assert.equal(matches[1], 'NoCitationData');
                assert.equal(matches[2], '');
                assert.equal(matches[3], ' \nFooBar');
            });

            test('should match random content following zsc content marked as stale', function() {
                let matches = 'ZSCC: 0000042[s1] \nFoo: Bar'.match(zsc._extraRegex);
                assert.equal(matches.length, 4);
                assert.equal(matches[1], '0000042');
                assert.equal(matches[2], '1');
                assert.equal(matches[3], ' \nFoo: Bar');
            });

            test('should match random content following zsc no data marked as stale', function() {
                let matches = 'ZSCC: NoCitationData[s1] \nFoo: Bar'.match(zsc._extraRegex);
                assert.equal(matches.length, 4);
                assert.equal(matches[1], 'NoCitationData');
                assert.equal(matches[2], '1');
                assert.equal(matches[3], ' \nFoo: Bar');
            });

            test('should match random content following legacy zsc content', function() {
                let matches = '00021 \nFoo: Bar'.match(zsc._extraRegex);
                assert.equal(matches.length, 4);
                assert.equal(matches[1], '00021');
                assert.equal(matches[2], '');
                assert.equal(matches[3], ' \nFoo: Bar');
            });

            test('should match random content following legacy zsc no data', function() {
                let matches = 'No Citation Data \n Foo: Bar'.match(zsc._extraRegex);
                assert.equal(matches.length, 4);
                assert.equal(matches[1], 'No Citation Data');
                assert.equal(matches[2], '');
                assert.equal(matches[3], ' \n Foo: Bar');
            });
        })

        suite('.updateItem()', function() {
            test('should directly update an empty extra field', function() {
                // Given
                let getStub = sinon.stub();
                let setSpy = sinon.spy();
                let saveSpy = sinon.spy();
                let item = {
                    getField: getStub,
                    setField: setSpy,
                    saveTx : saveSpy
                };
                let citeCount = 42;
                getStub.withArgs('extra').returns('');

                // When
                zsc.updateItem(item, citeCount);

                // Then
                assert(getStub.calledWith('extra'));
                assert(setSpy.calledWith('extra', 'ZSCC: 0000042'));
                assert(saveSpy.calledOnce);
            });

            test('should update zsc extra content', function() {
                // Given
                let getStub = sinon.stub();
                let setSpy = sinon.spy();
                let saveSpy = sinon.spy();
                let item = {
                    getField: getStub,
                    setField: setSpy,
                    saveTx : saveSpy
                };
                let citeCount = 42;
                getStub.withArgs('extra').returns('ZSCC: 0000021');

                // When
                zsc.updateItem(item, citeCount);

                // Then
                assert(getStub.calledWith('extra'));
                assert(setSpy.calledWith('extra', 'ZSCC: 0000042'));
                assert(saveSpy.calledOnce);
            });

            test('should mark zsc extra content as stale', function() {
                // Given
                let getStub = sinon.stub();
                let setSpy = sinon.spy();
                let saveSpy = sinon.spy();
                let item = {
                    getField: getStub,
                    setField: setSpy,
                    saveTx : saveSpy
                };
                let citeCount = -1;
                getStub.withArgs('extra').returns('ZSCC: 0000042');

                // When
                zsc.updateItem(item, citeCount);

                // Then
                assert(getStub.calledWith('extra'));
                assert(setSpy.calledWith('extra', 'ZSCC: 0000042[s0]'));
                assert(saveSpy.calledOnce);
            });

            test('should update random extra content so it\'s prefixed with zsc data', function() {
                // Given
                let getStub = sinon.stub();
                let setSpy = sinon.spy();
                let saveSpy = sinon.spy();
                let item = {
                    getField: getStub,
                    setField: setSpy,
                    saveTx : saveSpy
                };
                let citeCount = 42;
                getStub.withArgs('extra').returns('FooBar');

                // When
                zsc.updateItem(item, citeCount);

                // Then
                assert(getStub.calledWith('extra'));
                assert(setSpy.calledWith('extra', 'ZSCC: 0000042' + ' \nFooBar'));
                assert(saveSpy.calledOnce);
            });

            test('should preserve extra data while updating', function() {
                // Given
                let getStub = sinon.stub();
                let setSpy = sinon.spy();
                let saveSpy = sinon.spy();
                let item = {
                    getField: getStub,
                    setField: setSpy,
                    saveTx : saveSpy
                };
                let citeCount = 42;
                getStub.withArgs('extra').returns('ZSCC: 0000021 \narXiv: FooBar');

                // When
                zsc.updateItem(item, citeCount);

                // Then
                assert(getStub.calledWith('extra'));
                assert(setSpy.calledWith('extra', 'ZSCC: 0000042 \narXiv: FooBar'));
                assert(saveSpy.calledOnce);
            });

            test('should preserve extra data marking data as stale', function() {
                // Given
                let getStub = sinon.stub();
                let setSpy = sinon.spy();
                let saveSpy = sinon.spy();
                let item = {
                    getField: getStub,
                    setField: setSpy,
                    saveTx : saveSpy
                };
                let citeCount = -1;
                getStub.withArgs('extra').returns('ZSCC: 0000042 \narXiv: FooBar');

                // When
                zsc.updateItem(item, citeCount);

                // Then
                assert(getStub.calledWith('extra'));
                assert(setSpy.calledWith('extra', 'ZSCC: 0000042[s0] \narXiv: FooBar'));
                assert(saveSpy.calledOnce);
            });

            test('should update legacy extra entry to new format', function() {
                // Given
                let getStub = sinon.stub();
                let setSpy = sinon.spy();
                let saveSpy = sinon.spy();
                let item = {
                    getField: getStub,
                    setField: setSpy,
                    saveTx : saveSpy
                };
                let citeCount = 42;
                getStub.withArgs('extra').returns('00021');

                // When
                zsc.updateItem(item, citeCount);

                // Then
                assert(getStub.calledWith('extra'));
                assert(setSpy.calledWith('extra', 'ZSCC: 0000042'));
                assert(saveSpy.calledOnce);
            });

            test('should update legacy "no data" extra entry with new data', function() {
                // Given
                let getStub = sinon.stub();
                let setSpy = sinon.spy();
                let saveSpy = sinon.spy();
                let item = {
                    getField: getStub,
                    setField: setSpy,
                    saveTx : saveSpy
                };
                let citeCount = 42;
                getStub.withArgs('extra').returns('No Citation Data');

                // When
                zsc.updateItem(item, citeCount);

                // Then
                assert(getStub.calledWith('extra'));
                assert(setSpy.calledWith('extra', 'ZSCC: 0000042'));
                assert(saveSpy.calledOnce);
            });

            test('should update legacy "no data" entries, even when we have still no data', function() {
                // Given
                let getStub = sinon.stub();
                let setSpy = sinon.spy();
                let saveSpy = sinon.spy();
                let item = {
                    getField: getStub,
                    setField: setSpy,
                    saveTx : saveSpy
                };
                let citeCountStr = -1;
                getStub.withArgs('extra').returns('No Citation Data');

                // When
                zsc.updateItem(item, citeCountStr);

                // Then
                assert(getStub.calledWith('extra'));
                assert(setSpy.calledWith('extra', 'ZSCC: NoCitationData[s0]'));
                assert(saveSpy.calledOnce);
            });

            test('should mark zsc entry as stale, if there is no new data', function() {
                // Given
                let getStub = sinon.stub();
                let setSpy = sinon.spy();
                let saveSpy = sinon.spy();
                let item = {
                    getField: getStub,
                    setField: setSpy,
                    saveTx : saveSpy
                };
                let citeCountStr = -1;
                getStub.withArgs('extra').returns('ZSCC: 0000042');

                // When
                zsc.updateItem(item, citeCountStr);

                // Then
                assert(getStub.calledWith('extra'));
                assert(setSpy.calledWith('extra', 'ZSCC: 0000042[s0]'));
                assert(saveSpy.calledOnce);
            });

            test('should increase staleness counter, if there is no new data', function() {
                // Given
                let getStub = sinon.stub();
                let setSpy = sinon.spy();
                let saveSpy = sinon.spy();
                let item = {
                    getField: getStub,
                    setField: setSpy,
                    saveTx : saveSpy
                };
                let citeCountStr = -1;
                getStub.withArgs('extra').returns('ZSCC: 0000042[s0]');

                // When
                zsc.updateItem(item, citeCountStr);

                // Then
                assert(getStub.calledWith('extra'));
                assert(setSpy.calledWith('extra', 'ZSCC: 0000042[s1]'));
                assert(saveSpy.calledOnce);
            });

            test('should wrap the staleness counter', function() {
                // Given
                let getStub = sinon.stub();
                let setSpy = sinon.spy();
                let saveSpy = sinon.spy();
                let item = {
                    getField: getStub,
                    setField: setSpy,
                    saveTx : saveSpy
                };
                let citeCountStr = -1;
                getStub.withArgs('extra').returns('ZSCC: 0000042[s9]');

                // When
                zsc.updateItem(item, citeCountStr);

                // Then
                assert(getStub.calledWith('extra'));
                assert(setSpy.calledWith('extra', 'ZSCC: 0000042[s0]'));
                assert(saveSpy.calledOnce);
            });

            test('should remove staleness counter, if there is new data', function() {
                // Given
                let getStub = sinon.stub();
                let setSpy = sinon.spy();
                let saveSpy = sinon.spy();
                let item = {
                    getField: getStub,
                    setField: setSpy,
                    saveTx : saveSpy
                };
                let citeCountStr = 42;
                getStub.withArgs('extra').returns('ZSCC: 0000042[s0]');

                // When
                zsc.updateItem(item, citeCountStr);

                // Then
                assert(getStub.calledWith('extra'));
                assert(setSpy.calledWith('extra', 'ZSCC: 0000042'));
                assert(saveSpy.calledOnce);
            });

            test('should update legacy data and mark as stale, if there is no new data', function() {
                // Given
                let getStub = sinon.stub();
                let setSpy = sinon.spy();
                let saveSpy = sinon.spy();
                let item = {
                    getField: getStub,
                    setField: setSpy,
                    saveTx : saveSpy
                };
                let citeCountStr = -1;
                getStub.withArgs('extra').returns('00042');

                // When
                zsc.updateItem(item, citeCountStr);

                // Then
                assert(getStub.calledWith('extra'));
                assert(setSpy.calledWith('extra', 'ZSCC: 0000042[s0]'));
                assert(saveSpy.calledOnce);
            });

            test('should update legacy "no data" and mark as stale, if there is no new data', function() {
                // Given
                let getStub = sinon.stub();
                let setSpy = sinon.spy();
                let saveSpy = sinon.spy();
                let item = {
                    getField: getStub,
                    setField: setSpy,
                    saveTx : saveSpy
                };
                let citeCountStr = -1;
                getStub.withArgs('extra').returns('No Citation Data');

                // When
                zsc.updateItem(item, citeCountStr);

                // Then
                assert(getStub.calledWith('extra'));
                assert(setSpy.calledWith('extra', 'ZSCC: NoCitationData[s0]'));
                assert(saveSpy.calledOnce);
            });
        });

        // might be able to test this with sinon.replace()?
        suite('.retrieveCitationData()', function() {
            test('should be tested', function() {
                assert.equal(false, true);
            });
        });
    });
});

    suite('Integration Tests', function () {
        // TODO: mock this shit
        this.timeout(0);

        test('fetchCitations', function() {
            items.forEach(function (item) {
                let mock = createItem(item);
                let fetched = fetchCitations(mock);
                assert(fetched > mock.citations, fetched + ' > ' + mock.citations + '?');
            });
        });
    });

let items = [
{
    'citations': 400,
    'title': 'Energy-aware resource allocation heuristics for efficient management of data centers for cloud computing',
    'year': '2012',
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
    'year': '2009',
    'creators': [{
        'firstName': 'Andreas',
        'lastName': 'Krause',
    }, {
        'firstName': 'Carlos',
        'lastName': 'Guestrin',
    }]
}];

function createItem(data) {
    let item = {
        citations: data.citations,
        getField: function(field) {
            if (field === 'title') return data.title;
            else if (field === 'year') return data.year;
            else return null;
        },
        getCreators: function() { return data.creators; }
    };
    return item;
}

function fetchCitations(item) {
    let url = zsc.generateItemUrl(item);
    let res = request('GET', url);
    let content = res.body.toString('utf-8');
    return zsc.getCiteCount(content);
}

function createNestedCollection() {
    let item1 = {};
    let item2 = {};
    let item3 = {};
    let collection = {
        getChildItems: function() {
            return [item1, item2];
        },
        getChildCollections: function() {
            return [{
                getChildItems: function() { return [item3]; },
                getChildCollections: function() { return[]; }
            }];
        }
    };
    return collection;
}
