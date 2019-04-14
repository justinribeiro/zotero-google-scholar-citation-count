let zsc = require('../chrome/content/scripts/zoteroscholarcitations.js');
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

        suite('._extraPair', function () {
            test('should match extra content that is only a cite count', function() {
                let matches = 'ZSCC: 9001042'.match(zsc._extraPair);
                assert.equal(matches[1], 'ZSCC');
                assert.equal(matches[2], '9001042');
            });

            test('should match extra content that is only an error msg', function() {
                let matches = 'ZSCC: NoCitationData'.match(zsc._extraPair);
                assert.equal(matches[1], 'ZSCC');
                assert.equal(matches[2], 'NoCitationData');
            });

            test('should match extra content that is prefixed with zsc content', function() {
                let matches = 'ZSCC: 9001042 arXiv: 1337.123456'.match(zsc._extraPair);
                assert.equal(matches[1], 'ZSCC');
                assert.equal(matches[2], '9001042');
                assert.equal(matches[3], ' arXiv: 1337.123456')
            });
        });

        suite('.updateExtraPairs()', function() {
            // need mock item
            test('should prepend cite count if it\'s not in extra at all', function() {
                // Given
                let spy = sinon.spy()
                let item = { setField: spy};

                // When
                zsc.updateExtraPairs("arXiv: 1337.123456", item, 'ZSCC: 0000000');

                // Then
                let args = spy.getCall(0).args;
                assert(spy.calledOnce);
                assert.equal(args[0], 'extra');
                assert.equal(args[1], 'ZSCC: 0000000 \narXiv: 1337.123456');
            });

            test('should update existing zsc content in pole-position', function() {
                // Given
                let spy = sinon.spy()
                let item = { setField: spy};

                // When
                zsc.updateExtraPairs( 'ZSCC: 0000000 \narXiv: 1337.123456', item, 'ZSCC: 0000042');

                // Then
                let args = spy.getCall(0).args;
                assert(spy.calledOnce);
                assert.equal(args[0], 'extra');
                assert.equal(args[1], 'ZSCC: 0000042 \narXiv: 1337.123456');
            });

            test('should update existing zsc content in non-pole-position', function() {
                // Given
                let spy = sinon.spy()
                let item = { setField: spy};

                // When
                zsc.updateExtraPairs( 'arXiv: 1337.123456 \nZSCC: 0000000', item, 'ZSCC: 0000042');

                // Then
                let args = spy.getCall(0).args;
                assert(spy.calledOnce);
                assert.equal(args[0], 'extra');
                assert.equal(args[1], 'arXiv: 1337.123456 \nZSCC: 0000042');
            });

            test('shouldn\'t change non key-value entries while updating', function() {
                // Given
                let spy = sinon.spy()
                let item = { setField: spy};

                // When
                zsc.updateExtraPairs( 'ZSCC: 0000000 \nHUEHUEHUE \nFooBar', item, 'ZSCC: 0000042');

                // Then
                let args = spy.getCall(0).args;
                assert(spy.calledOnce);
                assert.equal(args[0], 'extra');
                assert.equal(args[1], 'ZSCC: 0000042 \nHUEHUEHUE \nFooBar');
            });
        });

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
                let citeCountStr = 'ZSCC: 0000042'
                getStub.withArgs('extra').returns('');

                // When
                zsc.updateItem(item, citeCountStr);

                // Then
                assert(getStub.calledWith('extra'));
                assert(setSpy.calledWith('extra', citeCountStr));
                assert(saveSpy.calledOnce);
            });

            test('should update zsc own extra content', function() {
                // Given
                let getStub = sinon.stub();
                let setSpy = sinon.spy();
                let saveSpy = sinon.spy();
                let item = {
                    getField: getStub,
                    setField: setSpy,
                    saveTx : saveSpy
                };
                let citeCountStr = 'ZSCC: 0000042'
                getStub.withArgs('extra').returns('ZSCC: 0000021');

                // When
                zsc.updateItem(item, citeCountStr);

                // Then
                assert(getStub.calledWith('extra'));
                assert(setSpy.calledWith('extra', citeCountStr));
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
                let citeCountStr = 'ZSCC: 0000042'
                getStub.withArgs('extra').returns('FooBar');

                // When
                zsc.updateItem(item, citeCountStr);

                // Then
                assert(getStub.calledWith('extra'));
                assert(setSpy.calledWith('extra', citeCountStr + ' \nFooBar'));
                assert(saveSpy.calledOnce);
            });

            test('should preserve existing a key-value pair while updating', function() {
                // Given
                let getStub = sinon.stub();
                let setSpy = sinon.spy();
                let saveSpy = sinon.spy();
                let item = {
                    getField: getStub,
                    setField: setSpy,
                    saveTx : saveSpy
                };
                let citeCountStr = 'ZSCC: 0000042'
                getStub.withArgs('extra').returns('ZSCC: 0000021 \narXiv: FooBar');

                // When
                zsc.updateItem(item, citeCountStr);

                // Then
                assert(getStub.calledWith('extra'));
                assert(setSpy.calledWith('extra', citeCountStr + ' \narXiv: FooBar'));
                assert(saveSpy.calledOnce);
            });

            test('should update legacy extra entry to new format', function() {
                // Given
                let citeCountStr = 'ZSCC: 0000042'
                let getStub = sinon.stub();
                let setSpy = sinon.spy();
                let saveSpy = sinon.spy();
                let item = {
                    getField: getStub,
                    setField: setSpy,
                    saveTx : saveSpy
                };
                getStub.withArgs('extra').returns('00021');

                // When
                zsc.updateItem(item, citeCountStr);

                // Then
                assert(getStub.calledWith('extra'));
                assert(setSpy.calledWith('extra', citeCountStr));
                assert(saveSpy.calledOnce);
            });

            test('should update legacy "no data" extra entry to new format', function() {
                // Given
                let citeCountStr = 'ZSCC: 0000042'
                let getStub = sinon.stub();
                let setSpy = sinon.spy();
                let saveSpy = sinon.spy();
                let item = {
                    getField: getStub,
                    setField: setSpy,
                    saveTx : saveSpy
                };
                getStub.withArgs('extra').returns('No Citation Data');

                // When
                zsc.updateItem(item, citeCountStr);

                // Then
                assert(getStub.calledWith('extra'));
                assert(setSpy.calledWith('extra', citeCountStr));
                assert(saveSpy.calledOnce);
            });

            test('should update legacy "no data" entries, even when we have still no data', function() {
                // Given
                let citeCountStr = 'ZSCC: NoCitationData'
                let getStub = sinon.stub();
                let setSpy = sinon.spy();
                let saveSpy = sinon.spy();
                let item = {
                    getField: getStub,
                    setField: setSpy,
                    saveTx : saveSpy
                };
                getStub.withArgs('extra').returns('No Citation Data');

                // When
                zsc.updateItem(item, citeCountStr);

                // Then
                assert(getStub.calledWith('extra'));
                assert(setSpy.calledWith('extra', citeCountStr));
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

            // how to mock ZoteroPane!?
            //suite('.updateCollectionMenuEntry()', function () {
            //    test('should update a group if called on a group', function() {
            //        assert.equal(false, true);
            //    });

            //    test('should update a collection if called on a collection', function() {
            //        assert.equal(false, true);
            //    });
            //});

            //suite('.updateItemMenuEntries()', function () {
            //    test('', function() {
            //        assert.equal(false, true);
            //    });
            //});

            // suite('Queue Interaction', function() {
            //     setup(function() {
            //         zsc.clearUpdateQueue();
            //     });

            //      suite('.updateGroup()', function () {
            //          test('should add all collections in the group to the update queue', function() {
            //              assert.equal(false, true);
            //          });

            //          test('should trigger processing of the update queue', function() {
            //              assert.equal(false, true);
            //          });
            //      });

            //     suite('.updateCollection()', function () {
            //         test('should add all items, subcollections as well as the items in subcollections to the update queue', function() {
            //             let zscMock = sinon.mock(zsc);
            //             zscMock.expects("processUpdateQueue").once();

            //             //zscMock.updateCollection();
            //             zsc.updateCollection([]);

            //             zscMock.verify();
            //         });

            //         test('should trigger processing of the update queue', function() {
            //             assert.equal(false, true);
            //         });
            //     });

            //     suite('.updateItems()', function () {
            //         test('should add all items to the udpate queue', function() {
            //             assert.equal(false, true);
            //         });

            //         test('should trigger processing of the update queue', function() {
            //             assert.equal(false, true);
            //         });
            //     });

            //     suite('.processUpdateQueue()', function () {
            //         test('should update items in the update queue', function() {
            //             assert.equal(false, true);
            //         });
            //     });
            // });

