/**
 * mocha --recursive --timeout 150000 -g "Transactiontestcase" --reporter spec
 * mocha --recursive --timeout 150000 -g "simple insert transaction commit" --reporter spec
 * mocha --recursive --timeout 150000 -g "simple insert transaction rollback" --reporter spec
 * mocha --recursive --timeout 150000 -g "insert operation with object multiple type field transaction commit" --reporter spec
 * mocha --recursive --timeout 150000 -g "insert operation with object multiple type field transaction rollback" --reporter spec
 * mocha --recursive --timeout 150000 -g "insert operation with object multiple type field  multiple operations in same transaction with transaction commit" --reporter spec
 *
 *
 */
var expect = require('chai').expect;
var ApplaneDB = require("../lib/DB.js");
var Config = require("./config.js");


describe("Transactiontestcase", function () {
    afterEach(function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            db.dropDatabase(function (err) {
                done(err);
            })
        });
    });

    it("simple insert transaction commit", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {$collection: "countries", $insert: [
                    {_id: 1, country: "USA", code: "01"}
                ]}
            ];
            db.startTransaction(function (err, txid) {
                db.batchUpdateById(updates, function (err, result) {
                    if (err) {
                        done(err);
                        return;
                    }
                    db.query({$collection: "countries"}, function (err, data) {
                        if (err) {
                            done(err);
                            return;
                        }
                        console.log("data >>>>>>>>>>>>>>>>.after insrt" + JSON.stringify(data));
                        expect(data.result).to.have.length(1);
                        expect(data.result[0].country).to.eql("USA");
                        expect(data.result[0].code).to.eql("01");
                        var recordTxid = data.result[0].txid;
                        db.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                            if (err) {
                                done(err);
                                return;
                            }
                            /*
                             * expected transaction entry in pl.txs collection
                             * */
                            var transactions =
                            {_id: "1", txid: "1", updates: [
                                {tx: {$collection: "countries", $delete: [
                                    {_id: 1}
                                ]}}
                            ]};
                            console.log("data >>>>>>>>>>>>>>>>.transaction insert" + JSON.stringify(data));
                            expect(data.result).to.have.length(1);
                            expect(data.result[0].txid).to.eql(txid);
                            expect(data.result[0].updates).to.have.length(1);
                            var txUpdates = data.result[0].updates;
                            var tx = txUpdates[0].tx;
                            expect(tx.collection).to.eql("countries");
                            expect(tx.delete.txid).to.eql(recordTxid);

                            db.commitTransaction(function (err) {
                                db.query({$collection: "countries"}, function (err, data) {
                                    if (err) {
                                        done(err);
                                        return;
                                    }
                                    console.log("data >>>>>>>>>>>>>>>>.after commit" + JSON.stringify(data));
                                    expect(data.result).to.have.length(1);
                                    expect(data.result[0].country).to.eql("USA");
                                    expect(data.result[0].code).to.eql("01");
                                    expect(data.result[0].txid).to.eql(undefined);
                                    db.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                                        if (err) {
                                            done(err);
                                            return;
                                        }
                                        console.log("data in pl.txs after commit " + JSON.stringify(data));
                                        expect(data.result).to.have.length(0);
                                        done();
                                    });
                                });
                            });
                        });
                    });
                })
            });
        });
    });
    it("simple insert transaction rollback", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {$collection: "countries", $insert: [
                    {_id: 1, country: "USA", code: "01"}
                ]}
            ];
            db.startTransaction(function (err, txid) {
                db.batchUpdateById(updates, function (err, result) {
                    if (err) {
                        done(err);
                        return;
                    }
                    db.query({$collection: "countries"}, function (err, data) {
                        if (err) {
                            done(err);
                            return;
                        }
                        console.log("data after insert on countries>>>>>>>>>>." + JSON.stringify(data));
                        expect(data.result).to.have.length(1);
                        expect(data.result[0].country).to.eql("USA");
                        expect(data.result[0].code).to.eql("01");
                        var recordTxid = data.result[0].txid;
                        db.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                            if (err) {
                                done(err);
                                return;
                            }
                            /*
                             * expected transaction entry in pl.txs collection
                             * */

                            var transactions =
                            {_id: "1", txid: "1", updates: [
                                {tx: {$collection: "countries", $delete: [
                                    {_id: 1}
                                ]}}
                            ]};
                            console.log("transaction>>>>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(data));
                            expect(data.result).to.have.length(1);
                            expect(data.result[0].txid).to.eql(txid);
                            expect(data.result[0].updates).to.have.length(1);
                            var txUpdates = data.result[0].updates;
                            var tx = txUpdates[0].tx;
                            expect(tx.collection).to.eql("countries");
                            expect(tx.delete.txid).to.eql(recordTxid);


                            db.rollbackTransaction(function (err) {
                                db.query({$collection: "countries"}, function (err, data) {
                                    if (err) {
                                        done(err);
                                        return;
                                    }
                                    console.log("countries data after rollback>>>" + JSON.stringify(data));
                                    expect(data.result).to.have.length(0);
                                    db.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                                        if (err) {
                                            done(err);
                                            return;
                                        }
                                        expect(data.result).to.have.length(0);
                                        done();
                                    });
                                });
                            });
                        });
                    });
                })
            });
        });
    });

    it("simple delete transaction commit", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {$collection: "countries", $insert: [
                    {_id: 1, country: "USA", code: "01"}
                ]}
            ];
            db.startTransaction(function (err, txid) {
                if (err) {
                    done(err);
                    return;
                }
                db.batchUpdateById(updates, function (err, result) {
                    if (err) {
                        done(err);
                        return;
                    }
                    db.query({$collection: "countries"}, function (err, data) {
                        if (err) {
                            done(err);
                            return;
                        }
                        expect(data.result).to.have.length(1);
                        expect(data.result[0].country).to.eql("USA");
                        expect(data.result[0].code).to.eql("01");
                        db.commitTransaction(function (err) {
                            if (err) {
                                done(err);
                                return;
                            }
                            db.startTransaction(function (err, txid) {
                                var deleteUpdates = [
                                    {$collection: "countries", $delete: [
                                        {_id: 1}
                                    ]}
                                ];
                                db.batchUpdateById(deleteUpdates, function (err, result) {
                                    if (err) {
                                        done(err);
                                        return;
                                    }
                                    db.query({$collection: "countries"}, function (err, data) {
                                        if (err) {
                                            done(err);
                                            return;
                                        }
//                                        console.log("countries data after delete udpates>>>" + JSON.stringify(data));
                                        expect(data.result).to.have.length(0);
                                        db.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                                            if (err) {
                                                done(err);
                                                return;
                                            }
                                            /*
                                             * expected transaction entry in pl.txs collection
                                             * */

                                            var transactions =
                                            {_id: "1", txid: "1", updates: [
                                                {tx: {$collection: "countries", $delete: [
                                                    {_id: 1}
                                                ]}}
                                            ]};
                                            console.log("transactions data>>>" + JSON.stringify(data))
                                            expect(data.result).to.have.length(1);
                                            expect(data.result[0].txid).to.eql(txid);
                                            expect(data.result[0].updates).to.have.length(1);
                                            var txUpdates = data.result[0].updates;
                                            var tx = txUpdates[0].tx;
                                            expect(tx.collection).to.eql("countries");
                                            expect(tx.insert.country).to.eql("USA");
                                            expect(tx.insert.code).to.eql("01");
                                            db.commitTransaction(function (err) {
                                                db.query({$collection: "countries"}, function (err, data) {
                                                    if (err) {
                                                        done(err);
                                                        return;
                                                    }
//                                                    console.log("countries data after commit called>>>" + JSON.stringify(data))

                                                    expect(data.result).to.have.length(0);
                                                    db.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                                                        if (err) {
                                                            done(err);
                                                            return;
                                                        }
//                                                        console.log("transaction  data after commit>>>" + JSON.stringify(data))
                                                        expect(data.result).to.have.length(0);
                                                        done();
                                                    });
                                                });
                                            });
                                        });
                                    });
                                })
                            });
                        })
                    });
                });

            })


        });
    });
    it("simple delete transaction rollback", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {$collection: "countries", $insert: [
                    {_id: 1, country: "USA", code: "01"}
                ]}
            ];
            db.startTransaction(function (err, txid) {
                if (err) {
                    done(err);
                    return;
                }
                db.batchUpdateById(updates, function (err, result) {
                    if (err) {
                        done(err);
                        return;
                    }
                    db.query({$collection: "countries"}, function (err, data) {
                        if (err) {
                            done(err);
                            return;
                        }
                        expect(data.result).to.have.length(1);
                        expect(data.result[0].country).to.eql("USA");
                        expect(data.result[0].code).to.eql("01");
                        db.commitTransaction(function (err) {
                            if (err) {
                                done(err);
                                return;
                            }
                            db.startTransaction(function (err, txid) {
                                var deleteUpdates = [
                                    {$collection: "countries", $delete: [
                                        {_id: 1}
                                    ]}
                                ];
                                db.batchUpdateById(deleteUpdates, function (err, result) {
                                    if (err) {
                                        done(err);
                                        return;
                                    }
                                    db.query({$collection: "countries"}, function (err, data) {
                                        if (err) {
                                            done(err);
                                            return;
                                        }
                                        expect(data.result).to.have.length(0);
                                        db.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                                            if (err) {
                                                done(err);
                                                return;
                                            }
                                            /*
                                             * expected transaction entry in pl.txs collection
                                             * */

                                            var transactions =
                                            {_id: "1", txid: "1", updates: [
                                                {tx: {$collection: "countries", $delete: [
                                                    {_id: 1}
                                                ]}}
                                            ]};
                                            expect(data.result).to.have.length(1);
                                            expect(data.result[0].txid).to.eql(txid);
                                            expect(data.result[0].updates).to.have.length(1);
                                            var txUpdates = data.result[0].updates;
                                            var tx = txUpdates[0].tx;
                                            expect(tx.collection).to.eql("countries");
                                            expect(tx.insert.country).to.eql("USA");
                                            expect(tx.insert.code).to.eql("01");
                                            db.rollbackTransaction(function (err) {
                                                db.query({$collection: "countries"}, function (err, data) {
                                                    if (err) {
                                                        done(err);
                                                        return;
                                                    }
                                                    expect(data.result).to.have.length(1);
                                                    expect(data.result[0].country).to.eql("USA");
                                                    expect(data.result[0].code).to.eql("01");
                                                    db.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                                                        if (err) {
                                                            done(err);
                                                            return;
                                                        }
                                                        expect(data.result).to.have.length(0);
                                                        done();
                                                    });
                                                });
                                            });
                                        });
                                    });
                                })
                            });
                        })
                    });
                });

            })


        });
    });


    it("simple update transaction commit", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {$collection: "countries", $insert: [
                    {_id: 1, country: "USA", code: "01"}
                ]}
            ];
            db.startTransaction(function (err, txid) {
                if (err) {
                    done(err);
                    return;
                }
                db.batchUpdateById(updates, function (err, result) {
                    if (err) {
                        done(err);
                        return;
                    }
                    db.query({$collection: "countries"}, function (err, data) {
                        if (err) {
                            done(err);
                            return;
                        }
                        expect(data.result).to.have.length(1);
                        expect(data.result[0].country).to.eql("USA");
                        expect(data.result[0].code).to.eql("01");
                        db.commitTransaction(function (err) {
                            if (err) {
                                done(err);
                                return;
                            }
                            db.startTransaction(function (err, txid) {
                                var update = [
                                    {$collection: "countries", $update: [
                                        {_id: 1, $set: {"country": "India"}}
                                    ]}
                                ];
                                db.batchUpdateById(update, function (err, result) {
                                    if (err) {
                                        done(err);
                                        return;
                                    }
                                    db.query({$collection: "countries"}, function (err, data) {
                                        if (err) {
                                            done(err);
                                            return;
                                        }
                                        console.log("after update in countries >>>>>>>>>>>>>>" + JSON.stringify(data));
                                        expect(data.result).to.have.length(1);
                                        expect(data.result[0].country).to.eql("India");

                                        var expectedUpdates = [
                                            {$collection: "countries", $update: [
                                                {_id: 1, $set: {"country": "India"}, __txs__: {txid: {tx: {_id: 1, $set: {"country": "USA"}}}}}
                                            ]
                                            }
                                        ]


                                        var tx = data.result[0].__txs__[txid].tx;
                                        expect(tx._id).to.eql(data.result[0]._id);
                                        expect(tx.set).to.have.length(1);
                                        expect(tx.set[0].key).to.eql("country");
                                        expect(tx.set[0].value).to.eql("USA");


                                        db.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                                            if (err) {
                                                done(err);
                                                return;
                                            }
                                            var transactions =
                                            {_id: "1", txid: "1", updates: [
                                                {tx: {$collection: "countries", $update: [
                                                    {_id: 1}
                                                ]}}
                                            ]};
                                            console.log("transaction>>>>>>>>>>>.." + JSON.stringify(data));
                                            expect(data.result).to.have.length(1);
                                            expect(data.result[0].txid).to.eql(txid);
                                            expect(data.result[0].updates).to.have.length(1);
                                            var txUpdates = data.result[0].updates;
                                            var tx = txUpdates[0].tx;
                                            console.log("tx>>>>>>>>>." + JSON.stringify(tx));

                                            expect(tx.collection).to.eql("countries");
                                            expect(tx.update._id).to.eql(1);


                                            db.commitTransaction(function (err) {
                                                db.query({$collection: "countries"}, function (err, data) {
                                                    if (err) {
                                                        done(err);
                                                        return;
                                                    }
                                                    console.log("data of countries after commit>>>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(data));
                                                    expect(data.result).to.have.length(1);
                                                    expect(data.result[0].country).to.eql("India");
                                                    expect(data.result[0].__txs__).to.eql({});
                                                    db.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                                                        if (err) {
                                                            done(err);
                                                            return;
                                                        }
                                                        expect(data.result).to.have.length(0);
                                                        done();
                                                    });
                                                });
                                            });
                                        });
                                    });
                                })
                            });
                        })
                    });
                });

            })


        });
    });
    it("simple update transaction rollback", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {$collection: "countries", $insert: [
                    {_id: 1, country: "USA", code: "01"}
                ]}
            ];
            db.startTransaction(function (err, txid) {
                if (err) {
                    done(err);
                    return;
                }
                db.batchUpdateById(updates, function (err, result) {
                    if (err) {
                        done(err);
                        return;
                    }
                    db.query({$collection: "countries"}, function (err, data) {
                        if (err) {
                            done(err);
                            return;
                        }
                        expect(data.result).to.have.length(1);
                        expect(data.result[0].country).to.eql("USA");
                        expect(data.result[0].code).to.eql("01");
                        db.commitTransaction(function (err) {
                            if (err) {
                                done(err);
                                return;
                            }
                            db.startTransaction(function (err, txid) {
                                var update = [
                                    {$collection: "countries", $update: [
                                        {_id: 1, $set: {"country": "India"}}
                                    ]}
                                ];
                                db.batchUpdateById(update, function (err, result) {
                                    if (err) {
                                        done(err);
                                        return;
                                    }
                                    db.query({$collection: "countries"}, function (err, data) {
                                        if (err) {
                                            done(err);
                                            return;
                                        }
//                                        console.log("data in countries after udpate>>>." + JSON.stringify(data));
                                        expect(data.result).to.have.length(1);
                                        expect(data.result[0].country).to.eql("India");

                                        var expectedUpdates = [
                                            {$collection: "countries", $update: [
                                                {_id: 1, $set: {"country": "India"}, __txs__: {txid: {tx: {_id: 1, $set: {"country": "USA"}}}}}
                                            ]}
                                        ]


                                        var tx = data.result[0].__txs__[txid].tx;
                                        expect(tx._id).to.eql(data.result[0]._id);
                                        expect(tx.set).to.have.length(1);
                                        expect(tx.set[0].key).to.eql("country");
                                        expect(tx.set[0].value).to.eql("USA");


                                        db.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                                            if (err) {
                                                done(err);
                                                return;
                                            }
                                            var transactions =
                                            {_id: "1", txid: "1", updates: [
                                                {tx: {$collection: "countries", $update: [
                                                    {_id: 1}
                                                ]}}
                                            ]};
                                            console.log("transaction aster updater>>>>>>" + JSON.stringify(data));
                                            expect(data.result).to.have.length(1);
                                            expect(data.result[0].txid).to.eql(txid);
                                            expect(data.result[0].updates).to.have.length(1);
                                            var txUpdates = data.result[0].updates;
                                            var tx = txUpdates[0].tx;
                                            expect(tx.collection).to.eql("countries");
                                            expect(tx.update._id).to.eql(1);


                                            db.rollbackTransaction(function (err) {
                                                db.query({$collection: "countries"}, function (err, data) {
                                                    if (err) {
                                                        done(err);
                                                        return;
                                                    }
                                                    console.log("countries data after rollback>>>" + JSON.stringify(data));
                                                    expect(data.result).to.have.length(1);
                                                    expect(data.result[0].country).to.eql("USA");
                                                    expect(data.result[0].__txs__).to.eql({});
                                                    db.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                                                        if (err) {
                                                            done(err);
                                                            return;
                                                        }
                                                        expect(data.result).to.have.length(0);
                                                        done();
                                                    });
                                                });
                                            });
                                        });
                                    });
                                })
                            });
                        })
                    });
                });

            })


        });
    });


    it("update with inc operator transaction commit", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {$collection: "countries", $insert: [
                    {_id: 1, country: "USA", code: "01", "score": 1000}

                ]}
            ];
            db.startTransaction(function (err, txid) {
                if (err) {
                    done(err);
                    return;
                }
                db.batchUpdateById(updates, function (err, result) {
                    if (err) {
                        done(err);
                        return;
                    }
                    db.query({$collection: "countries"}, function (err, data) {
                        if (err) {
                            done(err);
                            return;
                        }
                        expect(data.result).to.have.length(1);
                        expect(data.result[0].country).to.eql("USA");
                        expect(data.result[0].code).to.eql("01");
                        expect(data.result[0].score).to.eql(1000);
                        db.commitTransaction(function (err) {
                            if (err) {
                                done(err);
                                return;
                            }
                            db.startTransaction(function (err, txid) {
                                var update = [
                                    {$collection: "countries", $update: [
                                        {_id: 1, $set: {"country": "India"}, $inc: {score: 10}}
                                    ]}
                                ];
                                db.batchUpdateById(update, function (err, result) {
                                    if (err) {
                                        done(err);
                                        return;
                                    }
                                    db.query({$collection: "countries"}, function (err, data) {
                                        if (err) {
                                            done(err);
                                            return;
                                        }
                                        console.log("countries >>>>>>>>>>>..after update>>>>>>>>>>>>>>>>>>>>." + JSON.stringify(data));
                                        expect(data.result).to.have.length(1);
                                        expect(data.result[0].country).to.eql("India");
                                        expect(data.result[0].score).to.eql(1010);

                                        var expectedUpdates = [
                                            {$collection: "countries", $update: [
                                                {_id: 1, $set: {"country": "India"}, $push: {__txs__: {$each: [
                                                    {txid: 1, tx: {_id: 1, $set: {"country": "USA"}, $inc: {score: -10}}}
                                                ]}}
                                                }
                                            ]}
                                        ]
                                        console.log("data of transaction after udpate>>>>>>>>>>>>>>>" + JSON.stringify(data));
                                        var tx = data.result[0].__txs__[txid].tx;
                                        expect(tx._id).to.eql(1);
                                        expect(tx.set).to.have.length(1);
                                        expect(tx.set[0].key).to.eql("country");
                                        expect(tx.set[0].value).to.eql("USA");
                                        expect(tx.inc).to.have.length(1);
                                        expect(tx.inc[0].key).to.eql("score");
                                        expect(tx.inc[0].value).to.eql(-10);


                                        db.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                                            if (err) {
                                                done(err);
                                                return;
                                            }

                                            var transactions =
                                            {_id: "1", txid: "1", updates: [
                                                {tx: {$collection: "countries", $update: [
                                                    {_id: 1}
                                                ]}}
                                            ]};
                                            console.log("transaction aster updater>>>>>>" + JSON.stringify(data));
                                            expect(data.result).to.have.length(1);
                                            expect(data.result[0].txid).to.eql(txid);
                                            var txUpdates = data.result[0].updates;
                                            var tx = txUpdates[0].tx;
                                            expect(tx.collection).to.eql("countries");
                                            expect(tx.update._id).to.eql(1);


                                            db.commitTransaction(function (err) {
                                                db.query({$collection: "countries"}, function (err, data) {
                                                    if (err) {
                                                        done(err);
                                                        return;
                                                    }
                                                    expect(data.result).to.have.length(1);
                                                    expect(data.result[0].country).to.eql("India");
                                                    expect(data.result[0].score).to.eql(1010);
                                                    db.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                                                        if (err) {
                                                            done(err);
                                                            return;
                                                        }
                                                        expect(data.result).to.have.length(0);
                                                        done();
                                                    });
                                                });
                                            });
                                        });
                                    });
                                })
                            });
                        })
                    });
                });

            })


        });
    });
    it("update with inc operator transaction rollback", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {$collection: "countries", $insert: [
                    {_id: 1, country: "USA", code: "01", "score": 1000}

                ]}
            ];
            db.startTransaction(function (err, txid) {
                if (err) {
                    done(err);
                    return;
                }
                db.batchUpdateById(updates, function (err, result) {
                    if (err) {
                        done(err);
                        return;
                    }
                    db.query({$collection: "countries"}, function (err, data) {
                        if (err) {
                            done(err);
                            return;
                        }
                        expect(data.result).to.have.length(1);
                        expect(data.result[0].country).to.eql("USA");
                        expect(data.result[0].code).to.eql("01");
                        expect(data.result[0].score).to.eql(1000);
                        db.commitTransaction(function (err) {
                            if (err) {
                                done(err);
                                return;
                            }
                            db.startTransaction(function (err, txid) {
                                var update = [
                                    {$collection: "countries", $update: [
                                        {_id: 1, $set: {"country": "India"}, $inc: {score: 10}}
                                    ]}
                                ];
                                db.batchUpdateById(update, function (err, result) {
                                    if (err) {
                                        done(err);
                                        return;
                                    }
                                    db.query({$collection: "countries"}, function (err, data) {
                                        if (err) {
                                            done(err);
                                            return;
                                        }
                                        expect(data.result).to.have.length(1);
                                        expect(data.result[0].country).to.eql("India");
                                        expect(data.result[0].score).to.eql(1010);

                                        var expectedUpdates = [
                                            {$collection: "countries", $update: [
                                                {_id: 1, $set: {"country": "India"}, $push: {__txs__: {$each: [
                                                    {txid: 1, tx: {_id: 1, $set: {"country": "USA"}, $inc: {score: -10}}}
                                                ]}}
                                                }
                                            ]}
                                        ]
                                        var tx = data.result[0].__txs__[txid].tx;
                                        expect(tx._id).to.eql(1);
                                        expect(tx.set).to.have.length(1);
                                        expect(tx.set[0].key).to.eql("country");
                                        expect(tx.set[0].value).to.eql("USA");
                                        expect(tx.inc).to.have.length(1);
                                        expect(tx.inc[0].key).to.eql("score");
                                        expect(tx.inc[0].value).to.eql(-10);
                                        db.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                                            if (err) {
                                                done(err);
                                                return;
                                            }


                                            var transactions =
                                            {_id: "1", txid: "1", updates: [
                                                {tx: {$collection: "countries", $update: [
                                                    {_id: 1}
                                                ]}}
                                            ]};

                                            expect(data.result).to.have.length(1);
                                            expect(data.result[0].txid).to.eql(txid);
                                            expect(data.result[0].updates).to.have.length(1);
                                            var txUpdates = data.result[0].updates;
                                            var tx = txUpdates[0].tx;
                                            expect(tx.collection).to.eql("countries");
                                            expect(tx.update._id).to.eql(1);


                                            db.rollbackTransaction(function (err) {
                                                db.query({$collection: "countries"}, function (err, data) {
                                                    if (err) {
                                                        done(err);
                                                        return;
                                                    }
                                                    expect(data.result).to.have.length(1);
                                                    expect(data.result[0].country).to.eql("USA");
                                                    expect(data.result[0].score).to.eql(1000);
                                                    db.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                                                        if (err) {
                                                            done(err);
                                                            return;
                                                        }
                                                        expect(data.result).to.have.length(0);
                                                        done();
                                                    });
                                                });
                                            });
                                        });
                                    });
                                })
                            });
                        })
                    });
                });

            })


        });
    });


    it("insert operation with object type field transaction commit", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {$collection: "countries", $insert: [
                    {_id: 1, country: "USA", code: "01", "score": 1000, address: {city: "hisar", state: "haryana", "lineno": 1}}
                ]}
            ];
            db.startTransaction(function (err, txid) {
                if (err) {
                    done(err);
                    return;
                }
                db.batchUpdateById(updates, function (err, result) {
                    if (err) {
                        done(err);
                        return;
                    }
                    db.query({$collection: "countries"}, function (err, data) {
                        if (err) {
                            done(err);
                            return;
                        }
                        console.log("data after insert in countries>>>>" + JSON.stringify(data));
                        expect(data.result).to.have.length(1);
                        expect(data.result[0].country).to.eql("USA");
                        expect(data.result[0].code).to.eql("01");
                        expect(data.result[0].score).to.eql(1000);
                        expect(data.result[0].address.city).to.eql("hisar");
                        expect(data.result[0].address.state).to.eql("haryana");
                        expect(data.result[0].address.lineno).to.eql(1);
                        expect(data.result[0].address.lineno).to.eql(1);
                        db.commitTransaction(function (err) {
                            if (err) {
                                done(err);
                                return;
                            }
                            db.startTransaction(function (err, txid) {
                                var update = [
                                    {$collection: "countries", $update: [
                                        {_id: 1, $set: {"country": "India", address: {$set: {city: "Hisar1"}, $inc: {lineno: 12}}}, $inc: {score: 10}}
                                    ]}
                                ];
                                db.batchUpdateById(update, function (err, result) {
                                    if (err) {
                                        done(err);
                                        return;
                                    }
                                    db.query({$collection: "countries"}, function (err, data) {
                                        if (err) {
                                            done(err);
                                            return;
                                        }
                                        console.log("countries data after update>>>>>>>>>." + JSON.stringify(data));
                                        expect(data.result).to.have.length(1);
                                        expect(data.result[0].country).to.eql("India");
                                        expect(data.result[0].score).to.eql(1010);
                                        expect(data.result[0].address.city).to.eql("Hisar1");
                                        expect(data.result[0].address.lineno).to.eql(13);

                                        var expectedUpdates = [
                                            {$collection: "countries", $update: [
                                                {_id: 1, $set: {"country": "India"}, $push: {__txs__: {$each: [
                                                    {txid: 1, tx: {_id: 1, $set: {"country": "USA", address: {$set: {"city": "Hisar"}, $inc: {lineno: -12}}}, $inc: {score: -10}}}
                                                ]}}
                                                }
                                            ]}
                                        ]
                                        var tx = data.result[0].__txs__[txid].tx;
                                        console.log("txx>>>>>>>>>>>>>." + JSON.stringify(tx));
                                        expect(tx._id).to.eql(1);
                                        expect(tx.set).to.have.length(2);
                                        expect(tx.set[0].key).to.eql("country");
                                        expect(tx.set[0].value).to.eql("USA");
                                        expect(tx.set[1].key).to.eql("address.city");
                                        expect(tx.set[1].value).to.eql("hisar");
                                        expect(tx.inc).to.have.length(2);
                                        expect(tx.inc[0].key).to.eql("address.lineno");
                                        expect(tx.inc[0].value).to.eql(-12);
                                        expect(tx.inc[1].key).to.eql("score");
                                        expect(tx.inc[1].value).to.eql(-10);

                                        db.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                                            if (err) {
                                                done(err);
                                                return;
                                            }

                                            var transactions =
                                            {_id: "1", txid: "1", updates: [
                                                {tx: {$collection: "countries", $update: [
                                                    {_id: 1}
                                                ]}}
                                            ]};

                                            console.log("transaction after update>>>>>." + JSON.stringify(data));
                                            expect(data.result).to.have.length(1);
                                            expect(data.result[0].txid).to.eql(txid);
                                            expect(data.result[0].updates).to.have.length(1);
                                            var txUpdates = data.result[0].updates;
                                            var tx = txUpdates[0].tx;
                                            expect(tx.collection).to.eql("countries");
                                            expect(tx.update._id).to.eql(1);


                                            db.commitTransaction(function (err) {
                                                db.query({$collection: "countries"}, function (err, data) {
                                                    if (err) {
                                                        done(err);
                                                        return;
                                                    }
                                                    console.log("countries data after commit >>>" + JSON.stringify(data));
                                                    expect(data.result).to.have.length(1);
                                                    expect(data.result[0].country).eql("India");
                                                    expect(data.result[0].score).eql(1010);
                                                    expect(data.result[0].address.city).to.eql("Hisar1");
                                                    expect(data.result[0].address.state).to.eql("haryana");
                                                    expect(data.result[0].address.lineno).to.eql(13);
                                                    db.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                                                        if (err) {
                                                            done(err);
                                                            return;
                                                        }
                                                        expect(data.result).to.have.length(0);
                                                        done();
                                                    });
                                                });
                                            });
                                        });
                                    });
                                })
                            });
                        })
                    });
                });

            })


        });
    });
    it("insert operation with object type field transaction rollback", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {$collection: "countries", $insert: [
                    {_id: 1, country: "USA", code: "01", "score": 1000, address: {city: "hisar", state: "haryana", "lineno": 1}}
                ]}
            ];
            db.startTransaction(function (err, txid) {
                if (err) {
                    done(err);
                    return;
                }
                db.batchUpdateById(updates, function (err, result) {
                    if (err) {
                        done(err);
                        return;
                    }
                    db.query({$collection: "countries"}, function (err, data) {
                        if (err) {
                            done(err);
                            return;
                        }
                        console.log("data after insert in countries>>>>" + JSON.stringify(data));
                        expect(data.result).to.have.length(1);
                        expect(data.result[0].country).to.eql("USA");
                        expect(data.result[0].code).to.eql("01");
                        expect(data.result[0].score).to.eql(1000);
                        expect(data.result[0].address.city).to.eql("hisar");
                        expect(data.result[0].address.state).to.eql("haryana");
                        expect(data.result[0].address.lineno).to.eql(1);
                        expect(data.result[0].address.lineno).to.eql(1);
                        db.commitTransaction(function (err) {
                            if (err) {
                                done(err);
                                return;
                            }
                            db.startTransaction(function (err, txid) {
                                var update = [
                                    {$collection: "countries", $update: [
                                        {_id: 1, $set: {"country": "India", address: {$set: {city: "Hisar1"}, $inc: {lineno: 12}}}, $inc: {score: 10}}
                                    ]}
                                ];
                                db.batchUpdateById(update, function (err, result) {
                                    if (err) {
                                        done(err);
                                        return;
                                    }
                                    db.query({$collection: "countries"}, function (err, data) {
                                        if (err) {
                                            done(err);
                                            return;
                                        }
                                        console.log("countries data after update>>>>>>>>>." + JSON.stringify(data));
                                        expect(data.result).to.have.length(1);
                                        expect(data.result[0].country).to.eql("India");
                                        expect(data.result[0].score).to.eql(1010);
                                        expect(data.result[0].address.city).to.eql("Hisar1");
                                        expect(data.result[0].address.lineno).to.eql(13);

                                        var expectedUpdates = [
                                            {$collection: "countries", $update: [
                                                {_id: 1, $set: {"country": "India"}, $push: {__txs__: {$each: [
                                                    {txid: 1, tx: {_id: 1, $set: {"country": "USA", address: {$set: {"city": "Hisar"}, $inc: {lineno: -12}}}, $inc: {score: -10}}}
                                                ]}}
                                                }
                                            ]}
                                        ]
                                        var tx = data.result[0].__txs__[txid].tx;
                                        console.log("txx>>>>>>>>>>>>>." + JSON.stringify(tx));
                                        expect(tx._id).to.eql(1);
                                        expect(tx.set).to.have.length(2);
                                        expect(tx.set[0].key).to.eql("country");
                                        expect(tx.set[0].value).to.eql("USA");
                                        expect(tx.set[1].key).to.eql("address.city");
                                        expect(tx.set[1].value).to.eql("hisar");
                                        expect(tx.inc).to.have.length(2);
                                        expect(tx.inc[0].key).to.eql("address.lineno");
                                        expect(tx.inc[0].value).to.eql(-12);
                                        expect(tx.inc[1].key).to.eql("score");
                                        expect(tx.inc[1].value).to.eql(-10);

                                        db.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                                            if (err) {
                                                done(err);
                                                return;
                                            }

                                            var transactions =
                                            {_id: "1", txid: "1", updates: [
                                                {tx: {$collection: "countries", $update: [
                                                    {_id: 1}
                                                ]}}
                                            ]};

                                            console.log("transaction after update>>>>>." + JSON.stringify(data));
                                            expect(data.result).to.have.length(1);
                                            expect(data.result[0].txid).to.eql(txid);
                                            expect(data.result[0].updates).to.have.length(1);
                                            var txUpdates = data.result[0].updates;
                                            var tx = txUpdates[0].tx;
                                            expect(tx.collection).to.eql("countries");
                                            expect(tx.update._id).to.eql(1);


                                            db.rollbackTransaction(function (err) {
                                                db.query({$collection: "countries"}, function (err, data) {
                                                    if (err) {
                                                        done(err);
                                                        return;
                                                    }
                                                    console.log("countries data after commit >>>" + JSON.stringify(data));
                                                    expect(data.result).to.have.length(1);
                                                    expect(data.result[0].country).eql("USA");
                                                    expect(data.result[0].score).eql(1000);
                                                    expect(data.result[0].address.city).to.eql("hisar");
                                                    expect(data.result[0].address.state).to.eql("haryana");
                                                    expect(data.result[0].address.lineno).to.eql(1);
                                                    db.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                                                        if (err) {
                                                            done(err);
                                                            return;
                                                        }
                                                        expect(data.result).to.have.length(0);
                                                        done();
                                                    });
                                                });
                                            });
                                        });
                                    });
                                })
                            });
                        })
                    });
                });

            })


        });
    });

    it("insert operation with object multiple type field  multiple operations in same transaction with transaction commit", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {"$collection": {"collection": "countries", "fields": [
                    {"field": "states", "type": "object", "multiple": true, "fields": [
                        {"field": "state", "type": "string"},
                        {"field": "rank", "type": "number"}
                    ]},
                    {"field": "languages", "type": "object", "multiple": true, "fields": [
                        {"field": "language", "type": "string"}
                    ]}
                ]}, $insert: [
                    {_id: 1, country: "USA", code: "01", "score": 1000, address: {city: "hisar", state: "haryana", "lineno": 1}, states: [
                        {state: "jammu", _id: "jammu", rank: 1},
                        {state: "delhi", _id: "delhi", rank: 2},
                        {state: "himachal", _id: "himachal", rank: 3},
                        {state: "punjab", _id: "punjab", rank: 4}
                    ]}
                ]}
            ];
            db.startTransaction(function (err, txid) {
                if (err) {
                    done(err);
                    return;
                }
                db.batchUpdateById(updates, function (err, result) {
                    if (err) {
                        done(err);
                        return;
                    }
                    db.query({$collection: "countries"}, function (err, data) {
                        if (err) {
                            done(err);
                            return;
                        }
                        console.log("data>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(data));
                        expect(data.result).to.have.length(1);
                        expect(data.result[0].country).to.eql("USA");
                        expect(data.result[0].code).to.eql("01");
                        expect(data.result[0].score).to.eql(1000);
                        expect(data.result[0].address.city).to.eql("hisar");
                        expect(data.result[0].address.state).to.eql("haryana");
                        expect(data.result[0].address.lineno).to.eql(1);
                        expect(data.result[0].address.lineno).to.eql(1);
                        expect(data.result[0].states).to.have.length(4);
                        expect(data.result[0].states[0].state).to.eql("jammu");
                        expect(data.result[0].states[0].rank).to.eql(1);
                        expect(data.result[0].states[1].state).to.eql("delhi");
                        expect(data.result[0].states[1].rank).to.eql(2);
                        expect(data.result[0].states[2].state).to.eql("himachal");
                        expect(data.result[0].states[2].rank).to.eql(3);
                        expect(data.result[0].states[3].state).to.eql("punjab");
                        expect(data.result[0].states[3].rank).to.eql(4);


                        db.commitTransaction(function (err) {
                            if (err) {
                                done(err);
                                return;
                            }
                            db.startTransaction(function (err, txid) {
                                var update = [
                                    {$collection: {"collection": "countries", "fields": [
                                        {"field": "states", "type": "object", "multiple": true, "fields": [
                                            {"field": "state", "type": "string"},
                                            {"field": "rank", "type": "number"}
                                        ]},
                                        {"field": "languages", "type": "object", "multiple": true, "fields": [
                                            {"field": "language", "type": "string"}
                                        ]}
                                    ]}, $update: [
                                        {_id: 1, $set: {"country": "India", address: {$set: {city: "Hisar1"}, $inc: { lineno: 12}}, states: {$insert: [
                                            {"state": "rajasthan", _id: "rajasthan", rank: 5},
                                            {"state": "bihar", _id: "bihar", rank: 6}
                                        ],
                                            $update: [
                                                {_id: "jammu", $set: {"state": "JK"}, $inc: {rank: 10}},
                                                {_id: "himachal", $set: {"state": "HP"}, $inc: {rank: 20}}
                                            ],
                                            $delete: [
                                                {_id: "punjab"}
                                            ]
                                        }
                                        }, $inc: {
                                            score: 10
                                        }
                                        }
                                    ]
                                    }
                                ];
                                db.batchUpdateById(update, function (err, result) {
                                    if (err) {
                                        done(err);
                                        return;
                                    }
                                    db.query({$collection: "countries"}, function (err, data) {
                                        if (err) {
                                            done(err);
                                            return;
                                        }
                                        console.log("data of countries after update>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(data));
                                        expect(data.result).to.have.length(1);
                                        expect(data.result[0].country).to.eql("India");
                                        expect(data.result[0].score).to.eql(1010);
                                        expect(data.result[0].address.city).to.eql("Hisar1");
                                        expect(data.result[0].address.lineno).to.eql(13);
                                        expect(data.result[0].states).to.have.length(5);

                                        expect(data.result[0].states[0].state).to.eql("bihar");
                                        expect(data.result[0].states[1].state).to.eql("delhi");
                                        expect(data.result[0].states[3].state).to.eql("JK");

                                        expect(data.result[0].states[2].state).to.eql("HP");
                                        expect(data.result[0].states[4].state).to.eql("rajasthan");

                                        expect(data.result[0].states[3].rank).to.eql(11);
                                        expect(data.result[0].states[1].rank).to.eql(2);
                                        expect(data.result[0].states[2].rank).to.eql(23);
                                        expect(data.result[0].states[4].rank).to.eql(5);
                                        expect(data.result[0].states[0].rank).to.eql(6);

                                        var tx = data.result[0].__txs__[txid].tx;
                                        console.log("*********tx>>>>>>>>>>>>>>>>>>" + JSON.stringify(tx));

                                        expect(tx.set).to.have.length(2);
                                        expect(tx.set[0].key).to.eql("country");
                                        expect(tx.set[0].value).to.eql("USA");
                                        expect(tx.set[1].key).to.eql("address.city");
                                        expect(tx.set[1].value).to.eql("hisar");

                                        expect(tx.inc).to.have.length(2);
                                        expect(tx.inc[0].key).to.eql("address.lineno");
                                        expect(tx.inc[0].value).to.eql(-12);
                                        expect(tx.inc[1].key).to.eql("score");
                                        expect(tx.inc[1].value).to.eql(-10);


                                        console.log("***********array****************" + JSON.stringify(tx.array.length));
                                        expect(tx.array).to.have.length(5);

                                        console.log("***********array0****************" + JSON.stringify(tx.array[0]));
                                        expect(tx.array[0].field).to.eql("states");
                                        expect(tx.array[0].type).to.eql("update");
                                        expect(tx.array[0]._id).to.eql("jammu");
                                        expect(tx.array[0].inc).to.have.length(1);
                                        expect(tx.array[0].inc[0].key).to.eql("rank");
                                        expect(tx.array[0].inc[0].value).to.eql(-10);
                                        expect(tx.array[0].set).to.have.length(1);
                                        expect(tx.array[0].set[0].key).to.eql("state");
                                        expect(tx.array[0].set[0].value).to.eql("jammu");
                                        console.log("***********array1****************" + JSON.stringify(tx.array[1]));
                                        expect(tx.array[1].field).to.eql("states");
                                        expect(tx.array[1].type).to.eql("update");
                                        expect(tx.array[1]._id).to.eql("himachal");
                                        expect(tx.array[1].inc).to.have.length(1);
                                        expect(tx.array[1].inc[0].key).to.eql("rank");
                                        expect(tx.array[1].inc[0].value).to.eql(-20);
                                        expect(tx.array[1].set).to.have.length(1);
                                        expect(tx.array[1].set[0].key).to.eql("state");
                                        expect(tx.array[1].set[0].value).to.eql("himachal");
                                        console.log("***********array2****************" + JSON.stringify(tx.array[2]));
                                        expect(tx.array[2].field).to.eql("states");
                                        expect(tx.array[2].type).to.eql("insert");
                                        expect(tx.array[2]._id).to.eql("punjab");
                                        expect(tx.array[2].value.state).to.eql("punjab");
                                        expect(tx.array[2].value._id).to.eql("punjab");
                                        expect(tx.array[2].value.rank).to.eql(4);

                                        console.log("***********array3****************" + JSON.stringify(tx.array[3]));
                                        expect(tx.array[3].field).to.eql("states");
                                        expect(tx.array[3].type).to.eql("delete");
                                        expect(tx.array[3]._id).to.eql("rajasthan");

                                        console.log("***********array4****************" + JSON.stringify(tx.array[4]));
                                        expect(tx.array[4].field).to.eql("states");
                                        expect(tx.array[4].type).to.eql("delete");
                                        expect(tx.array[4]._id).to.eql("bihar");


                                        db.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                                            if (err) {
                                                done(err);
                                                return;
                                            }
                                            var transactions =
                                            {_id: "1", txid: "1", updates: [
                                                {tx: {$collection: "countries", $update: [
                                                    {_id: 1}
                                                ]}}
                                            ]};
                                            console.log("data of transaxction>>>" + JSON.stringify(data));
                                            expect(data.result).to.have.length(1);
                                            expect(data.result[0].txid).to.eql(txid);
                                            expect(data.result[0].updates).to.have.length(1);
                                            var txUpdates = data.result[0].updates;
                                            var tx = txUpdates[0].tx;
                                            expect(tx.collection).to.eql("countries");
                                            expect(tx.update._id).to.eql(1);


                                            var newUpdate = [
                                                {$collection: {"collection": "countries", "fields": [
                                                    {"field": "states", "type": "object", "multiple": true, "fields": [
                                                        {"field": "state", "type": "string"},
                                                        {"field": "rank", "type": "number"}
                                                    ]},
                                                    {"field": "languages", "type": "object", "multiple": true, "fields": [
                                                        {"field": "language", "type": "string"}
                                                    ]}
                                                ]}, $update: [
                                                    {_id: 1, $set: {"country": "New India", address: {$set: {city: "New Hisar"}, $inc: { lineno: -20}}, states: {$insert: [
                                                        {"state": "kerela", _id: "kerela", rank: 7}
                                                    ],
                                                        $update: [
                                                            {_id: "rajasthan", $set: {"state": "RJ"}, $inc: {rank: 100}},
                                                            {_id: "himachal", $set: {"state": "NEW HP"}, $inc: {rank: 50}}
                                                        ],
                                                        $delete: [
                                                            {_id: "bihar"}
                                                        ]
                                                    }
                                                    }, $inc: {
                                                        score: 10
                                                    }
                                                    }
                                                ]
                                                }
                                            ];
                                            db.batchUpdateById(newUpdate, function (err, result) {
                                                if (err) {
                                                    done(err);
                                                    return;
                                                }
                                                db.query({$collection: "countries"}, function (err, data) {
                                                    if (err) {
                                                        done(err);
                                                        return;
                                                    }
                                                    console.log("data of countries after second update>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(data));
                                                    expect(data.result).to.have.length(1);
                                                    expect(data.result[0].country).to.eql("New India");
                                                    expect(data.result[0].score).to.eql(1020);
                                                    expect(data.result[0].address.city).to.eql("New Hisar");
                                                    expect(data.result[0].address.lineno).to.eql(-7);
                                                    expect(data.result[0].states).to.have.length(5);

                                                    expect(data.result[0].states[2].state).to.eql("JK");
                                                    expect(data.result[0].states[0].state).to.eql("delhi");
                                                    expect(data.result[0].states[1].state).to.eql("NEW HP");
                                                    expect(data.result[0].states[4].state).to.eql("RJ");
                                                    expect(data.result[0].states[3].state).to.eql("kerela");
                                                    expect(data.result[0].states[2].rank).to.eql(11);
                                                    expect(data.result[0].states[0].rank).to.eql(2);
                                                    expect(data.result[0].states[1].rank).to.eql(73);
                                                    expect(data.result[0].states[4].rank).to.eql(105);
                                                    expect(data.result[0].states[3].rank).to.eql(7);

                                                    var tx = data.result[0].__txs__[txid].tx;
                                                    console.log("*********tx>>>>>>>>>>>>>>>>>>" + JSON.stringify(tx));

                                                    expect(tx.set).to.have.length(2);
                                                    expect(tx.set[0].key).to.eql("country");
                                                    expect(tx.set[0].value).to.eql("USA");
                                                    expect(tx.set[1].key).to.eql("address.city");
                                                    expect(tx.set[1].value).to.eql("hisar");

                                                    expect(tx.inc).to.have.length(2);
                                                    expect(tx.inc[0].key).to.eql("address.lineno");
                                                    expect(tx.inc[0].value).to.eql(8);
                                                    expect(tx.inc[1].key).to.eql("score");
                                                    expect(tx.inc[1].value).to.eql(-20);


                                                    console.log("***********array****************" + JSON.stringify(tx.array.length));
                                                    expect(tx.array).to.have.length(6);

                                                    console.log("***********array0****************" + JSON.stringify(tx.array[0]));
                                                    expect(tx.array[0].field).to.eql("states");
                                                    expect(tx.array[0].type).to.eql("update");
                                                    expect(tx.array[0]._id).to.eql("jammu");
                                                    expect(tx.array[0].inc).to.have.length(1);
                                                    expect(tx.array[0].inc[0].key).to.eql("rank");
                                                    expect(tx.array[0].inc[0].value).to.eql(-10);
                                                    expect(tx.array[0].set).to.have.length(1);
                                                    expect(tx.array[0].set[0].key).to.eql("state");
                                                    expect(tx.array[0].set[0].value).to.eql("jammu");
                                                    console.log("***********array1****************" + JSON.stringify(tx.array[1]));
                                                    expect(tx.array[1].field).to.eql("states");
                                                    expect(tx.array[1].type).to.eql("update");
                                                    expect(tx.array[1]._id).to.eql("himachal");
                                                    expect(tx.array[1].inc).to.have.length(1);
                                                    expect(tx.array[1].inc[0].key).to.eql("rank");
                                                    expect(tx.array[1].inc[0].value).to.eql(-70);
                                                    expect(tx.array[1].set).to.have.length(1);
                                                    expect(tx.array[1].set[0].key).to.eql("state");
                                                    expect(tx.array[1].set[0].value).to.eql("himachal");
                                                    console.log("***********array2****************" + JSON.stringify(tx.array[2]));
                                                    expect(tx.array[2].field).to.eql("states");
                                                    expect(tx.array[2].type).to.eql("insert");
                                                    expect(tx.array[2]._id).to.eql("punjab");
                                                    expect(tx.array[2].value.state).to.eql("punjab");
                                                    expect(tx.array[2].value._id).to.eql("punjab");
                                                    expect(tx.array[2].value.rank).to.eql(4);

                                                    console.log("***********array3****************" + JSON.stringify(tx.array[3]));
                                                    expect(tx.array[3].field).to.eql("states");
                                                    expect(tx.array[3].type).to.eql("delete");
                                                    expect(tx.array[3]._id).to.eql("rajasthan");

                                                    console.log("***********array4****************" + JSON.stringify(tx.array[4]));
                                                    expect(tx.array[4].field).to.eql("states");
                                                    expect(tx.array[4].type).to.eql("delete");
                                                    expect(tx.array[4]._id).to.eql("bihar");
                                                    console.log("***********array5****************" + JSON.stringify(tx.array[5]));
                                                    expect(tx.array[5].field).to.eql("states");
                                                    expect(tx.array[5].type).to.eql("delete");
                                                    expect(tx.array[5]._id).to.eql("kerela");


                                                    db.query({$collection: "pl.txs"}, function (err, data) {
                                                        if (err) {
                                                            done(err);
                                                            return;
                                                        }
                                                        console.log("data in pl.txs after second time update on same record>>>>>>>>>>>>>>>>>>" + JSON.stringify(data));
                                                        expect(data.result).to.have.length(1);
                                                        expect(data.result[0].txid).to.eql(txid);
                                                        expect(data.result[0].updates).to.have.length(1);
                                                        var txUpdates = data.result[0].updates;
                                                        var tx = txUpdates[0].tx;
                                                        expect(tx.collection).to.eql("countries");
                                                        expect(tx.update._id).to.eql(1);
                                                        db.commitTransaction(function (err) {
                                                            db.query({$collection: "countries"}, function (err, data) {
                                                                if (err) {
                                                                    done(err);
                                                                    return;
                                                                }
                                                                console.log("Data after comamit >>>" + JSON.stringify(data));
                                                                expect(data.result).to.have.length(1);
                                                                expect(data.result[0].country).to.eql("New India");
                                                                expect(data.result[0].score).to.eql(1020);
                                                                expect(data.result[0].address.city).to.eql("New Hisar");
                                                                expect(data.result[0].address.lineno).to.eql(-7);
                                                                expect(data.result[0].states).to.have.length(5);

                                                                expect(data.result[0].states[2].state).to.eql("JK");
                                                                expect(data.result[0].states[0].state).to.eql("delhi");
                                                                expect(data.result[0].states[1].state).to.eql("NEW HP");
                                                                expect(data.result[0].states[4].state).to.eql("RJ");
                                                                expect(data.result[0].states[3].state).to.eql("kerela");
                                                                expect(data.result[0].states[2].rank).to.eql(11);
                                                                expect(data.result[0].states[0].rank).to.eql(2);
                                                                expect(data.result[0].states[1].rank).to.eql(73);
                                                                expect(data.result[0].states[4].rank).to.eql(105);
                                                                expect(data.result[0].states[3].rank).to.eql(7);
                                                                db.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                                                                    if (err) {
                                                                        done(err);
                                                                        return;
                                                                    }
                                                                    expect(data.result).to.have.length(0);
                                                                    done();
                                                                });
                                                            });
                                                        });
                                                    });
                                                });
                                            });
                                        });
                                    });
                                })
                            });
                        })
                    });
                });

            })
        })
        ;
    })

    it("insert operation with object multiple type field  multiple operations in same transaction with transaction rollback", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {"$collection": {"collection": "countries", "fields": [
                    {"field": "states", "type": "object", "multiple": true, "fields": [
                        {"field": "state", "type": "string"},
                        {"field": "rank", "type": "number"}
                    ]},
                    {"field": "languages", "type": "object", "multiple": true, "fields": [
                        {"field": "language", "type": "string"}
                    ]}
                ]}, $insert: [
                    {_id: 1, country: "USA", code: "01", "score": 1000, address: {city: "hisar", state: "haryana", "lineno": 1}, states: [
                        {state: "jammu", _id: "jammu", rank: 1},
                        {state: "delhi", _id: "delhi", rank: 2},
                        {state: "himachal", _id: "himachal", rank: 3},
                        {state: "punjab", _id: "punjab", rank: 4}
                    ]}
                ]}
            ];
            db.startTransaction(function (err, txid) {
                if (err) {
                    done(err);
                    return;
                }
                db.batchUpdateById(updates, function (err, result) {
                    if (err) {
                        done(err);
                        return;
                    }
                    db.query({$collection: "countries"}, function (err, data) {
                        if (err) {
                            done(err);
                            return;
                        }
                        console.log("data>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(data));
                        expect(data.result).to.have.length(1);
                        expect(data.result[0].country).to.eql("USA");
                        expect(data.result[0].code).to.eql("01");
                        expect(data.result[0].score).to.eql(1000);
                        expect(data.result[0].address.city).to.eql("hisar");
                        expect(data.result[0].address.state).to.eql("haryana");
                        expect(data.result[0].address.lineno).to.eql(1);
                        expect(data.result[0].address.lineno).to.eql(1);
                        expect(data.result[0].states).to.have.length(4);
                        expect(data.result[0].states[0].state).to.eql("jammu");
                        expect(data.result[0].states[0].rank).to.eql(1);
                        expect(data.result[0].states[1].state).to.eql("delhi");
                        expect(data.result[0].states[1].rank).to.eql(2);
                        expect(data.result[0].states[2].state).to.eql("himachal");
                        expect(data.result[0].states[2].rank).to.eql(3);
                        expect(data.result[0].states[3].state).to.eql("punjab");
                        expect(data.result[0].states[3].rank).to.eql(4);


                        db.commitTransaction(function (err) {
                            if (err) {
                                done(err);
                                return;
                            }
                            db.startTransaction(function (err, txid) {
                                var update = [
                                    {$collection: {"collection": "countries", "fields": [
                                        {"field": "states", "type": "object", "multiple": true, "fields": [
                                            {"field": "state", "type": "string"},
                                            {"field": "rank", "type": "number"}
                                        ]},
                                        {"field": "languages", "type": "object", "multiple": true, "fields": [
                                            {"field": "language", "type": "string"}
                                        ]}
                                    ]}, $update: [
                                        {_id: 1, $set: {"country": "India", address: {$set: {city: "Hisar1"}, $inc: { lineno: 12}}, states: {$insert: [
                                            {"state": "rajasthan", _id: "rajasthan", rank: 5},
                                            {"state": "bihar", _id: "bihar", rank: 6}
                                        ],
                                            $update: [
                                                {_id: "jammu", $set: {"state": "JK"}, $inc: {rank: 10}},
                                                {_id: "himachal", $set: {"state": "HP"}, $inc: {rank: 20}}
                                            ],
                                            $delete: [
                                                {_id: "punjab"}
                                            ]
                                        }
                                        }, $inc: {
                                            score: 10
                                        }
                                        }
                                    ]
                                    }
                                ];
                                db.batchUpdateById(update, function (err, result) {
                                    if (err) {
                                        done(err);
                                        return;
                                    }
                                    db.query({$collection: "countries"}, function (err, data) {
                                        if (err) {
                                            done(err);
                                            return;
                                        }
                                        console.log("data of countries after update>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(data));
                                        expect(data.result).to.have.length(1);
                                        expect(data.result[0].country).to.eql("India");
                                        expect(data.result[0].score).to.eql(1010);
                                        expect(data.result[0].address.city).to.eql("Hisar1");
                                        expect(data.result[0].address.lineno).to.eql(13);
                                        expect(data.result[0].states).to.have.length(5);

                                        expect(data.result[0].states[0].state).to.eql("bihar");
                                        expect(data.result[0].states[1].state).to.eql("delhi");
                                        expect(data.result[0].states[3].state).to.eql("JK");

                                        expect(data.result[0].states[2].state).to.eql("HP");
                                        expect(data.result[0].states[4].state).to.eql("rajasthan");

                                        expect(data.result[0].states[3].rank).to.eql(11);
                                        expect(data.result[0].states[1].rank).to.eql(2);
                                        expect(data.result[0].states[2].rank).to.eql(23);
                                        expect(data.result[0].states[4].rank).to.eql(5);
                                        expect(data.result[0].states[0].rank).to.eql(6);
                                        var tx = data.result[0].__txs__[txid].tx;
                                        console.log("*********tx>>>>>>>>>>>>>>>>>>" + JSON.stringify(tx));

                                        expect(tx.set).to.have.length(2);
                                        expect(tx.set[0].key).to.eql("country");
                                        expect(tx.set[0].value).to.eql("USA");
                                        expect(tx.set[1].key).to.eql("address.city");
                                        expect(tx.set[1].value).to.eql("hisar");

                                        expect(tx.inc).to.have.length(2);
                                        expect(tx.inc[0].key).to.eql("address.lineno");
                                        expect(tx.inc[0].value).to.eql(-12);
                                        expect(tx.inc[1].key).to.eql("score");
                                        expect(tx.inc[1].value).to.eql(-10);


                                        console.log("***********array****************" + JSON.stringify(tx.array.length));
                                        expect(tx.array).to.have.length(5);

                                        console.log("***********array0****************" + JSON.stringify(tx.array[0]));
                                        expect(tx.array[0].field).to.eql("states");
                                        expect(tx.array[0].type).to.eql("update");
                                        expect(tx.array[0]._id).to.eql("jammu");
                                        expect(tx.array[0].inc).to.have.length(1);
                                        expect(tx.array[0].inc[0].key).to.eql("rank");
                                        expect(tx.array[0].inc[0].value).to.eql(-10);
                                        expect(tx.array[0].set).to.have.length(1);
                                        expect(tx.array[0].set[0].key).to.eql("state");
                                        expect(tx.array[0].set[0].value).to.eql("jammu");
                                        console.log("***********array1****************" + JSON.stringify(tx.array[1]));
                                        expect(tx.array[1].field).to.eql("states");
                                        expect(tx.array[1].type).to.eql("update");
                                        expect(tx.array[1]._id).to.eql("himachal");
                                        expect(tx.array[1].inc).to.have.length(1);
                                        expect(tx.array[1].inc[0].key).to.eql("rank");
                                        expect(tx.array[1].inc[0].value).to.eql(-20);
                                        expect(tx.array[1].set).to.have.length(1);
                                        expect(tx.array[1].set[0].key).to.eql("state");
                                        expect(tx.array[1].set[0].value).to.eql("himachal");

                                        expect(tx.array[2].field).to.eql("states");
                                        expect(tx.array[2].type).to.eql("insert");
                                        expect(tx.array[2]._id).to.eql("punjab");
                                        expect(tx.array[2].value.state).to.eql("punjab");
                                        expect(tx.array[2].value._id).to.eql("punjab");
                                        expect(tx.array[2].value.rank).to.eql(4);


                                        expect(tx.array[3].field).to.eql("states");
                                        expect(tx.array[3].type).to.eql("delete");
                                        expect(tx.array[3]._id).to.eql("rajasthan");


                                        expect(tx.array[4].field).to.eql("states");
                                        expect(tx.array[4].type).to.eql("delete");
                                        expect(tx.array[4]._id).to.eql("bihar");


                                        db.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                                            if (err) {
                                                done(err);
                                                return;
                                            }
                                            var transactions =
                                            {_id: "1", txid: "1", updates: [
                                                {tx: {$collection: "countries", $update: [
                                                    {_id: 1}
                                                ]}}
                                            ]};
                                            console.log("data of transaxction>>>" + JSON.stringify(data));
                                            expect(data.result).to.have.length(1);
                                            expect(data.result[0].txid).to.eql(txid);
                                            expect(data.result[0].updates).to.have.length(1);
                                            var txUpdates = data.result[0].updates;
                                            var tx = txUpdates[0].tx;
                                            expect(tx.collection).to.eql("countries");
                                            expect(tx.update._id).to.eql(1);


                                            var newUpdate = [
                                                {$collection: {"collection": "countries", "fields": [
                                                    {"field": "states", "type": "object", "multiple": true, "fields": [
                                                        {"field": "state", "type": "string"},
                                                        {"field": "rank", "type": "number"}
                                                    ]},
                                                    {"field": "languages", "type": "object", "multiple": true, "fields": [
                                                        {"field": "language", "type": "string"}
                                                    ]}
                                                ]}, $update: [
                                                    {_id: 1, $set: {"country": "New India", address: {$set: {city: "New Hisar"}, $inc: { lineno: -20}}, states: {$insert: [
                                                        {"state": "kerela", _id: "kerela", rank: 7}
                                                    ],
                                                        $update: [
                                                            {_id: "rajasthan", $set: {"state": "RJ"}, $inc: {rank: 100}},
                                                            {_id: "himachal", $set: {"state": "NEW HP"}, $inc: {rank: 50}}
                                                        ],
                                                        $delete: [
                                                            {_id: "bihar"}
                                                        ]
                                                    }
                                                    }, $inc: {
                                                        score: 10
                                                    }
                                                    }
                                                ]
                                                }
                                            ];
                                            db.batchUpdateById(newUpdate, function (err, result) {
                                                if (err) {
                                                    done(err);
                                                    return;
                                                }
                                                db.query({$collection: "countries"}, function (err, data) {
                                                    if (err) {
                                                        done(err);
                                                        return;
                                                    }
                                                    console.log("data of countries after second update>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(data));
                                                    expect(data.result).to.have.length(1);
                                                    expect(data.result[0].country).to.eql("New India");
                                                    expect(data.result[0].score).to.eql(1020);
                                                    expect(data.result[0].address.city).to.eql("New Hisar");
                                                    expect(data.result[0].address.lineno).to.eql(-7);
                                                    expect(data.result[0].states).to.have.length(5);

                                                    expect(data.result[0].states[2].state).to.eql("JK");
                                                    expect(data.result[0].states[0].state).to.eql("delhi");
                                                    expect(data.result[0].states[1].state).to.eql("NEW HP");
                                                    expect(data.result[0].states[4].state).to.eql("RJ");
                                                    expect(data.result[0].states[3].state).to.eql("kerela");
                                                    expect(data.result[0].states[2].rank).to.eql(11);
                                                    expect(data.result[0].states[0].rank).to.eql(2);
                                                    expect(data.result[0].states[1].rank).to.eql(73);
                                                    expect(data.result[0].states[4].rank).to.eql(105);
                                                    expect(data.result[0].states[3].rank).to.eql(7);

                                                    var tx = data.result[0].__txs__[txid].tx;
                                                    console.log("*********tx>>>>>>>>>>>>>>>>>>" + JSON.stringify(tx));

                                                    expect(tx.set).to.have.length(2);
                                                    expect(tx.set[0].key).to.eql("country");
                                                    expect(tx.set[0].value).to.eql("USA");
                                                    expect(tx.set[1].key).to.eql("address.city");
                                                    expect(tx.set[1].value).to.eql("hisar");

                                                    expect(tx.inc).to.have.length(2);
                                                    expect(tx.inc[0].key).to.eql("address.lineno");
                                                    expect(tx.inc[0].value).to.eql(8);
                                                    expect(tx.inc[1].key).to.eql("score");
                                                    expect(tx.inc[1].value).to.eql(-20);


                                                    console.log("***********array****************" + JSON.stringify(tx.array.length));
                                                    expect(tx.array).to.have.length(6);

                                                    console.log("***********array0****************" + JSON.stringify(tx.array[0]));
                                                    expect(tx.array[0].field).to.eql("states");
                                                    expect(tx.array[0].type).to.eql("update");
                                                    expect(tx.array[0]._id).to.eql("jammu");
                                                    expect(tx.array[0].inc).to.have.length(1);
                                                    expect(tx.array[0].inc[0].key).to.eql("rank");
                                                    expect(tx.array[0].inc[0].value).to.eql(-10);
                                                    expect(tx.array[0].set).to.have.length(1);
                                                    expect(tx.array[0].set[0].key).to.eql("state");
                                                    expect(tx.array[0].set[0].value).to.eql("jammu");
                                                    console.log("***********array1****************" + JSON.stringify(tx.array[1]));
                                                    expect(tx.array[1].field).to.eql("states");
                                                    expect(tx.array[1].type).to.eql("update");
                                                    expect(tx.array[1]._id).to.eql("himachal");
                                                    expect(tx.array[1].inc).to.have.length(1);
                                                    expect(tx.array[1].inc[0].key).to.eql("rank");
                                                    expect(tx.array[1].inc[0].value).to.eql(-70);
                                                    expect(tx.array[1].set).to.have.length(1);
                                                    expect(tx.array[1].set[0].key).to.eql("state");
                                                    expect(tx.array[1].set[0].value).to.eql("himachal");

                                                    expect(tx.array[2].field).to.eql("states");
                                                    expect(tx.array[2].type).to.eql("insert");
                                                    expect(tx.array[2]._id).to.eql("punjab");
                                                    expect(tx.array[2].value.state).to.eql("punjab");
                                                    expect(tx.array[2].value._id).to.eql("punjab");
                                                    expect(tx.array[2].value.rank).to.eql(4);


                                                    expect(tx.array[3].field).to.eql("states");
                                                    expect(tx.array[3].type).to.eql("delete");
                                                    expect(tx.array[3]._id).to.eql("rajasthan");


                                                    expect(tx.array[4].field).to.eql("states");
                                                    expect(tx.array[4].type).to.eql("delete");
                                                    expect(tx.array[4]._id).to.eql("bihar");

                                                    expect(tx.array[5].field).to.eql("states");
                                                    expect(tx.array[5].type).to.eql("delete");
                                                    expect(tx.array[5]._id).to.eql("kerela");


                                                    db.query({$collection: "pl.txs"}, function (err, data) {
                                                        if (err) {
                                                            done(err);
                                                            return;
                                                        }
                                                        console.log("data in pl.txs after second time update on same record>>>>>>>>>>>>>>>>>>" + JSON.stringify(data));
                                                        expect(data.result).to.have.length(1);
                                                        expect(data.result[0].txid).to.eql(txid);
                                                        expect(data.result[0].updates).to.have.length(1);
                                                        var txUpdates = data.result[0].updates;
                                                        var tx = txUpdates[0].tx;
                                                        expect(tx.collection).to.eql("countries");
                                                        expect(tx.update._id).to.eql(1);
                                                        db.rollbackTransaction(function (err) {
                                                            db.query({$collection: "countries"}, function (err, data) {
                                                                if (err) {
                                                                    done(err);
                                                                    return;
                                                                }
                                                                console.log("Data after rollback >>>" + JSON.stringify(data));
                                                                expect(data.result).to.have.length(1);
                                                                expect(data.result[0].country).to.eql("USA");
                                                                expect(data.result[0].code).to.eql("01");
                                                                expect(data.result[0].score).to.eql(1000);
                                                                expect(data.result[0].address.city).to.eql("hisar");
                                                                expect(data.result[0].address.state).to.eql("haryana");
                                                                expect(data.result[0].address.lineno).to.eql(1);
                                                                expect(data.result[0].address.lineno).to.eql(1);
                                                                expect(data.result[0].states).to.have.length(4);
                                                                expect(data.result[0].states[2].state).to.eql("jammu");
                                                                expect(data.result[0].states[2].rank).to.eql(1);
                                                                expect(data.result[0].states[0].state).to.eql("delhi");
                                                                expect(data.result[0].states[0].rank).to.eql(2);
                                                                expect(data.result[0].states[1].state).to.eql("himachal");
                                                                expect(data.result[0].states[1].rank).to.eql(3);
                                                                expect(data.result[0].states[3].state).to.eql("punjab");
                                                                expect(data.result[0].states[3].rank).to.eql(4);
                                                                db.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                                                                    if (err) {
                                                                        done(err);
                                                                        return;
                                                                    }
                                                                    expect(data.result).to.have.length(0);
                                                                    done();
                                                                });
                                                            });
                                                        });
                                                    });
                                                });
                                            });
                                        });
                                    });
                                })
                            });
                        })
                    });
                });

            })
        })
        ;
    })


    it("update operation on array with sort and then rollback", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {"$collection": {"collection": "countries", "fields": [
                    {"field": "states", "type": "object", "multiple": true, sort: "rank", "fields": [
                        {"field": "state", "type": "string"},
                        {"field": "rank", "type": "number"}
                    ]}
                ]}, $insert: [
                    {_id: 1, country: "USA", code: "01", "score": 1000, address: {city: "hisar", state: "haryana", "lineno": 1}, states: [
                        {state: "jammu", _id: "jammu", rank: 1},
                        {state: "delhi", _id: "delhi", rank: 2},
                        {state: "himachal", _id: "himachal", rank: 3},
                        {state: "punjab", _id: "punjab", rank: 4}
                    ]}
                ]}
            ];
            db.startTransaction(function (err, txid) {
                if (err) {
                    done(err);
                    return;
                }
                db.batchUpdateById(updates, function (err, result) {
                    if (err) {
                        done(err);
                        return;
                    }
                    db.query({$collection: "countries"}, function (err, data) {
                        if (err) {
                            done(err);
                            return;
                        }
                        console.log("data>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(data));
                        expect(data.result).to.have.length(1);
                        expect(data.result[0].country).to.eql("USA");
                        expect(data.result[0].code).to.eql("01");
                        expect(data.result[0].score).to.eql(1000);
                        expect(data.result[0].address.city).to.eql("hisar");
                        expect(data.result[0].address.state).to.eql("haryana");
                        expect(data.result[0].address.lineno).to.eql(1);
                        expect(data.result[0].address.lineno).to.eql(1);
                        expect(data.result[0].states).to.have.length(4);
                        expect(data.result[0].states[0].state).to.eql("jammu");
                        expect(data.result[0].states[0].rank).to.eql(1);
                        expect(data.result[0].states[1].state).to.eql("delhi");
                        expect(data.result[0].states[1].rank).to.eql(2);
                        expect(data.result[0].states[2].state).to.eql("himachal");
                        expect(data.result[0].states[2].rank).to.eql(3);
                        expect(data.result[0].states[3].state).to.eql("punjab");
                        expect(data.result[0].states[3].rank).to.eql(4);
                        db.commitTransaction(function (err) {
                            if (err) {
                                done(err);
                                return;
                            }
                            db.startTransaction(function (err, txid) {
                                var update = [
                                    {$collection: {"collection": "countries", "fields": [
                                        {"field": "states", "type": "object", "multiple": true, sort: "rank", "fields": [
                                            {"field": "state", "type": "string"},
                                            {"field": "rank", "type": "number"}
                                        ]}
                                    ]}, $update: [
                                        {_id: 1, $set: {"country": "India", address: {$set: {city: "Hisar1"}, $inc: { lineno: 12}}, states: {$insert: [
                                            {"state": "rajasthan", _id: "rajasthan", rank: 5},
                                            {"state": "bihar", _id: "bihar", rank: 6}
                                        ],
                                            $update: [
                                                {_id: "jammu", $set: {"state": "JK"}, $inc: {rank: 10}},
                                                {_id: "himachal", $set: {"state": "HP"}, $inc: {rank: 20}}
                                            ],
                                            $delete: [
                                                {_id: "punjab"}
                                            ]
                                        }
                                        }, $inc: {
                                            score: 10
                                        }
                                        }
                                    ]
                                    }
                                ];
                                db.batchUpdateById(update, function (err, result) {
                                    if (err) {
                                        done(err);
                                        return;
                                    }
                                    db.query({$collection: "countries"}, function (err, data) {
                                        if (err) {
                                            done(err);
                                            return;
                                        }
                                        console.log("data of countries after update>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(data));
                                        expect(data.result).to.have.length(1);
                                        expect(data.result[0].country).to.eql("India");
                                        expect(data.result[0].score).to.eql(1010);
                                        expect(data.result[0].address.city).to.eql("Hisar1");
                                        expect(data.result[0].address.lineno).to.eql(13);
                                        expect(data.result[0].states).to.have.length(5);

                                        expect(data.result[0].states[3].state).to.eql("JK");
                                        expect(data.result[0].states[0].state).to.eql("delhi");
                                        expect(data.result[0].states[4].state).to.eql("HP");
                                        expect(data.result[0].states[1].state).to.eql("rajasthan");
                                        expect(data.result[0].states[2].state).to.eql("bihar");
                                        expect(data.result[0].states[3].rank).to.eql(11);
                                        expect(data.result[0].states[0].rank).to.eql(2);
                                        expect(data.result[0].states[4].rank).to.eql(23);
                                        expect(data.result[0].states[1].rank).to.eql(5);
                                        expect(data.result[0].states[2].rank).to.eql(6);

                                        var tx = data.result[0].__txs__[txid].tx;
                                        console.log("*********tx>>>>>>>>>>>>>>>>>>" + JSON.stringify(tx));

                                        expect(tx.set).to.have.length(2);
                                        expect(tx.set[0].key).to.eql("country");
                                        expect(tx.set[0].value).to.eql("USA");
                                        expect(tx.set[1].key).to.eql("address.city");
                                        expect(tx.set[1].value).to.eql("hisar");

                                        expect(tx.inc).to.have.length(2);
                                        expect(tx.inc[0].key).to.eql("address.lineno");
                                        expect(tx.inc[0].value).to.eql(-12);
                                        expect(tx.inc[1].key).to.eql("score");
                                        expect(tx.inc[1].value).to.eql(-10);


                                        console.log("***********array****************" + JSON.stringify(tx.array.length));
                                        expect(tx.array).to.have.length(5);

                                        console.log("***********array0****************" + JSON.stringify(tx.array[0]));
                                        expect(tx.array[0].field).to.eql("states");
                                        expect(tx.array[0].type).to.eql("update");
                                        expect(tx.array[0]._id).to.eql("jammu");
                                        expect(tx.array[0].inc).to.have.length(1);
                                        expect(tx.array[0].inc[0].key).to.eql("rank");
                                        expect(tx.array[0].inc[0].value).to.eql(-10);
                                        expect(tx.array[0].set).to.have.length(1);
                                        expect(tx.array[0].set[0].key).to.eql("state");
                                        expect(tx.array[0].set[0].value).to.eql("jammu");
                                        console.log("***********array1****************" + JSON.stringify(tx.array[1]));
                                        expect(tx.array[1].field).to.eql("states");
                                        expect(tx.array[1].type).to.eql("update");
                                        expect(tx.array[1]._id).to.eql("himachal");
                                        expect(tx.array[1].inc).to.have.length(1);
                                        expect(tx.array[1].inc[0].key).to.eql("rank");
                                        expect(tx.array[1].inc[0].value).to.eql(-20);
                                        expect(tx.array[1].set).to.have.length(1);
                                        expect(tx.array[1].set[0].key).to.eql("state");
                                        expect(tx.array[1].set[0].value).to.eql("himachal");
                                        console.log("***********array2****************" + JSON.stringify(tx.array[2]));
                                        expect(tx.array[2].field).to.eql("states");
                                        expect(tx.array[2].type).to.eql("insert");
                                        expect(tx.array[2]._id).to.eql("punjab");
                                        expect(tx.array[2].value.state).to.eql("punjab");
                                        expect(tx.array[2].value._id).to.eql("punjab");
                                        expect(tx.array[2].value.rank).to.eql(4);
                                        console.log("***********array3****************" + JSON.stringify(tx.array[3]));

                                        expect(tx.array[3].field).to.eql("states");
                                        expect(tx.array[3].type).to.eql("delete");
                                        expect(tx.array[3]._id).to.eql("rajasthan");


                                        expect(tx.array[4].field).to.eql("states");
                                        expect(tx.array[4].type).to.eql("delete");
                                        expect(tx.array[4]._id).to.eql("bihar");
                                        db.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                                            if (err) {
                                                done(err);
                                                return;
                                            }
                                            var transactions =
                                            {_id: "1", txid: "1", updates: [
                                                {tx: {$collection: "countries", $update: [
                                                    {_id: 1}
                                                ]}}
                                            ]};
                                            console.log("data of transaxction>>>" + JSON.stringify(data));
                                            expect(data.result).to.have.length(1);
                                            expect(data.result[0].txid).to.eql(txid);
                                            expect(data.result[0].updates).to.have.length(1);
                                            var txUpdates = data.result[0].updates;
                                            var tx = txUpdates[0].tx;
                                            expect(tx.collection).to.eql("countries");
                                            expect(tx.update._id).to.eql(1);


                                            db.rollbackTransaction(function (err) {
                                                db.query({$collection: "countries"}, function (err, data) {
                                                    if (err) {
                                                        done(err);
                                                        return;
                                                    }
                                                    console.log("Data after rollback>>>" + JSON.stringify(data));
                                                    expect(data.result).to.have.length(1);
                                                    expect(data.result[0].country).to.eql("USA");
                                                    expect(data.result[0].code).to.eql("01");
                                                    expect(data.result[0].score).to.eql(1000);
                                                    expect(data.result[0].address.city).to.eql("hisar");
                                                    expect(data.result[0].address.state).to.eql("haryana");
                                                    expect(data.result[0].address.lineno).to.eql(1);
                                                    expect(data.result[0].address.lineno).to.eql(1);
                                                    expect(data.result[0].states).to.have.length(4);
                                                    expect(data.result[0].states[0].state).to.eql("jammu");
                                                    expect(data.result[0].states[0].rank).to.eql(1);
                                                    expect(data.result[0].states[1].state).to.eql("delhi");
                                                    expect(data.result[0].states[1].rank).to.eql(2);
                                                    expect(data.result[0].states[2].state).to.eql("himachal");
                                                    expect(data.result[0].states[2].rank).to.eql(3);
                                                    expect(data.result[0].states[3].state).to.eql("punjab");
                                                    expect(data.result[0].states[3].rank).to.eql(4);

                                                    db.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                                                        if (err) {
                                                            done(err);
                                                            return;
                                                        }
                                                        expect(data.result).to.have.length(0);
                                                        done();
                                                    });
                                                });
                                            });
                                        });
                                    });
                                })
                            });
                        })
                    });
                });

            })
        })
        ;
    })

    it("insert operation with object multiple type field transaction commit", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {"$collection": {"collection": "countries", "fields": [
                    {"field": "states", "type": "object", "multiple": true, "fields": [
                        {"field": "state", "type": "string"},
                        {"field": "rank", "type": "number"}
                    ]},
                    {"field": "languages", "type": "object", "multiple": true, "fields": [
                        {"field": "language", "type": "string"}
                    ]}
                ]}, $insert: [
                    {_id: 1, country: "USA", code: "01", "score": 1000, address: {city: "hisar", state: "haryana", "lineno": 1}, states: [
                        {state: "jammu", _id: "jammu", rank: 1},
                        {state: "delhi", _id: "delhi", rank: 2},
                        {state: "himachal", _id: "himachal", rank: 3},
                        {state: "punjab", _id: "punjab", rank: 4}
                    ], languages: [
                        {language: "Hindi"},
                        {language: "English"},
                        {_id: "urdu", language: "Urdu"},
                        {language: "German"}
                    ]}
                ]}
            ];
            db.startTransaction(function (err, txid) {
                if (err) {
                    done(err);
                    return;
                }
                db.batchUpdateById(updates, function (err, result) {
                    if (err) {
                        done(err);
                        return;
                    }
                    db.query({$collection: "countries"}, function (err, data) {
                        if (err) {
                            done(err);
                            return;
                        }
                        console.log("data>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(data));
                        expect(data.result).to.have.length(1);
                        expect(data.result[0].country).to.eql("USA");
                        expect(data.result[0].code).to.eql("01");
                        expect(data.result[0].score).to.eql(1000);
                        expect(data.result[0].address.city).to.eql("hisar");
                        expect(data.result[0].address.state).to.eql("haryana");
                        expect(data.result[0].address.lineno).to.eql(1);
                        expect(data.result[0].address.lineno).to.eql(1);
                        expect(data.result[0].states).to.have.length(4);
                        expect(data.result[0].states[0].state).to.eql("jammu");
                        expect(data.result[0].states[0].rank).to.eql(1);
                        expect(data.result[0].states[1].state).to.eql("delhi");
                        expect(data.result[0].states[1].rank).to.eql(2);
                        expect(data.result[0].states[2].state).to.eql("himachal");
                        expect(data.result[0].states[2].rank).to.eql(3);
                        expect(data.result[0].states[3].state).to.eql("punjab");
                        expect(data.result[0].states[3].rank).to.eql(4);

                        expect(data.result[0].languages).to.have.length(4);
                        expect(data.result[0].languages[0].language).to.eql("Hindi");
                        expect(data.result[0].languages[1].language).to.eql("English");
                        expect(data.result[0].languages[2].language).to.eql("Urdu");
                        expect(data.result[0].languages[3].language).to.eql("German");


                        db.commitTransaction(function (err) {
                            if (err) {
                                done(err);
                                return;
                            }
                            db.startTransaction(function (err, txid) {
                                var update = [
                                    {$collection: {"collection": "countries", "fields": [
                                        {"field": "states", "type": "object", "multiple": true, "fields": [
                                            {"field": "state", "type": "string"},
                                            {"field": "rank", "type": "number"}
                                        ]},
                                        {"field": "languages", "type": "object", "multiple": true, "fields": [
                                            {"field": "language", "type": "string"}
                                        ]}
                                    ]}, $update: [
                                        {_id: 1, $set: {"country": "India", address: {$set: {city: "Hisar1"}, $inc: { lineno: 12}}, states: {$insert: [
                                            {"state": "rajasthan", _id: "rajasthan", rank: 5},
                                            {"state": "bihar", _id: "bihar", rank: 6}
                                        ],
                                            $update: [
                                                {_id: "jammu", $set: {"state": "JK"}, $inc: {rank: 10}},
                                                {_id: "himachal", $set: {"state": "HP"}, $inc: {rank: 20}}
                                            ],
                                            $delete: [
                                                {_id: "punjab"}
                                            ]
                                        }, languages: {$insert: [
                                            {language: "Haryanvi"}
                                        ], $delete: [
                                            {$query: {language: "German"}}
                                        ], $update: [
                                            {_id: "urdu", $set: {language: "URDU", score: 100}}
                                        ]
                                        }
                                        }, $inc: {
                                            score: 10
                                        }
                                        }
                                    ]
                                    }
                                ];
                                db.batchUpdateById(update, function (err, result) {
                                    if (err) {
                                        done(err);
                                        return;
                                    }
                                    db.query({$collection: "countries"}, function (err, data) {
                                        if (err) {
                                            done(err);
                                            return;
                                        }
                                        console.log("data of countries after update>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(data));
                                        expect(data.result).to.have.length(1);
                                        expect(data.result[0].country).to.eql("India");
                                        expect(data.result[0].score).to.eql(1010);
                                        expect(data.result[0].address.city).to.eql("Hisar1");
                                        expect(data.result[0].address.lineno).to.eql(13);
                                        expect(data.result[0].states).to.have.length(5);

                                        expect(data.result[0].states[3].state).to.eql("JK");
                                        expect(data.result[0].states[1].state).to.eql("delhi");
                                        expect(data.result[0].states[2].state).to.eql("HP");
                                        expect(data.result[0].states[4].state).to.eql("rajasthan");
                                        expect(data.result[0].states[0].state).to.eql("bihar");
                                        expect(data.result[0].states[3].rank).to.eql(11);
                                        expect(data.result[0].states[1].rank).to.eql(2);
                                        expect(data.result[0].states[2].rank).to.eql(23);
                                        expect(data.result[0].states[4].rank).to.eql(5);
                                        expect(data.result[0].states[0].rank).to.eql(6);

                                        var tx = data.result[0].__txs__[txid].tx;
                                        console.log("*********tx>>>>>>>>>>>>>>>>>>" + JSON.stringify(tx));

                                        expect(tx.set).to.have.length(2);
                                        expect(tx.set[0].key).to.eql("country");
                                        expect(tx.set[0].value).to.eql("USA");
                                        expect(tx.set[1].key).to.eql("address.city");
                                        expect(tx.set[1].value).to.eql("hisar");

                                        expect(tx.inc).to.have.length(2);
                                        expect(tx.inc[0].key).to.eql("address.lineno");
                                        expect(tx.inc[0].value).to.eql(-12);
                                        expect(tx.inc[1].key).to.eql("score");
                                        expect(tx.inc[1].value).to.eql(-10);


                                        console.log("***********array****************" + JSON.stringify(tx.array.length));
                                        expect(tx.array).to.have.length(8);

                                        console.log("***********array0****************" + JSON.stringify(tx.array[0]));
                                        expect(tx.array[0].field).to.eql("states");
                                        expect(tx.array[0].type).to.eql("update");
                                        expect(tx.array[0]._id).to.eql("jammu");
                                        expect(tx.array[0].inc).to.have.length(1);
                                        expect(tx.array[0].inc[0].key).to.eql("rank");
                                        expect(tx.array[0].inc[0].value).to.eql(-10);
                                        expect(tx.array[0].set).to.have.length(1);
                                        expect(tx.array[0].set[0].key).to.eql("state");
                                        expect(tx.array[0].set[0].value).to.eql("jammu");
                                        console.log("***********array1****************" + JSON.stringify(tx.array[1]));
                                        expect(tx.array[1].field).to.eql("states");
                                        expect(tx.array[1].type).to.eql("update");
                                        expect(tx.array[1]._id).to.eql("himachal");
                                        expect(tx.array[1].inc).to.have.length(1);
                                        expect(tx.array[1].inc[0].key).to.eql("rank");
                                        expect(tx.array[1].inc[0].value).to.eql(-20);
                                        expect(tx.array[1].set).to.have.length(1);
                                        expect(tx.array[1].set[0].key).to.eql("state");
                                        expect(tx.array[1].set[0].value).to.eql("himachal");
                                        console.log("***********array2****************" + JSON.stringify(tx.array[2]));
                                        expect(tx.array[2].field).to.eql("states");
                                        expect(tx.array[2].type).to.eql("insert");
                                        expect(tx.array[2]._id).to.eql("punjab");
                                        expect(tx.array[2].value.state).to.eql("punjab");
                                        expect(tx.array[2].value._id).to.eql("punjab");
                                        expect(tx.array[2].value.rank).to.eql(4);
                                        console.log("***********array3****************" + JSON.stringify(tx.array[3]));

                                        expect(tx.array[3].field).to.eql("states");
                                        expect(tx.array[3].type).to.eql("delete");
                                        expect(tx.array[3]._id).to.eql("rajasthan");

                                        console.log("***********array4****************" + JSON.stringify(tx.array[4]));
                                        expect(tx.array[4].field).to.eql("states");
                                        expect(tx.array[4].type).to.eql("delete");
                                        expect(tx.array[4]._id).to.eql("bihar");

                                        console.log("***********array5****************" + JSON.stringify(tx.array[5]));
                                        expect(tx.array[5].field).to.eql("languages");
                                        expect(tx.array[5].type).to.eql("update");
                                        expect(tx.array[5]._id).to.eql("urdu");
                                        expect(tx.array[5].set).to.have.length(1);
                                        expect(tx.array[5].set[0].key).to.eql("language");
                                        expect(tx.array[5].set[0].value).to.eql("Urdu");
                                        expect(tx.array[5].unset).to.have.length(1);
                                        expect(tx.array[5].unset[0].key).to.eql("score");
                                        expect(tx.array[5].unset[0].value).to.eql(1);

                                        console.log("tx>>>" + JSON.stringify(tx.array[6]))
                                        expect(tx.array[6].field).to.eql("languages");
                                        expect(tx.array[6].type).to.eql("insert");
                                        expect(tx.array[6].value.language).to.eql("German");

                                        expect(tx.array[7].field).to.eql("languages");
                                        expect(tx.array[7].type).to.eql("delete");

                                        db.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                                            if (err) {
                                                done(err);
                                                return;
                                            }
                                            var transactions =
                                            {_id: "1", txid: "1", updates: [
                                                {tx: {$collection: "countries", $update: [
                                                    {_id: 1}
                                                ]}}
                                            ]};
                                            console.log("data of transaxction>>>" + JSON.stringify(data));
                                            expect(data.result).to.have.length(1);
                                            expect(data.result[0].txid).to.eql(txid);
                                            expect(data.result[0].updates).to.have.length(1);
                                            var txUpdates = data.result[0].updates;
                                            var tx = txUpdates[0].tx;
                                            expect(tx.collection).to.eql("countries");
                                            expect(tx.update._id).to.eql(1);


                                            db.commitTransaction(function (err) {
                                                db.query({$collection: "countries"}, function (err, data) {
                                                    if (err) {
                                                        done(err);
                                                        return;
                                                    }
                                                    console.log("Data after comamit >>>" + JSON.stringify(data));
                                                    expect(data.result).to.have.length(1);
                                                    expect(data.result[0].country).to.eql("India");
                                                    expect(data.result[0].score).to.eql(1010);
                                                    expect(data.result[0].address.city).to.eql("Hisar1");
                                                    expect(data.result[0].address.state).to.eql("haryana");
                                                    expect(data.result[0].address.lineno).to.eql(13);
                                                    expect(data.result[0].states).to.have.length(5);
                                                    expect(data.result[0].states[3].state).to.eql("JK");
                                                    expect(data.result[0].states[1].state).to.eql("delhi");
                                                    expect(data.result[0].states[2].state).to.eql("HP");
                                                    expect(data.result[0].states[4].state).to.eql("rajasthan");
                                                    expect(data.result[0].states[0].state).to.eql("bihar");
                                                    expect(data.result[0].states[3].rank).to.eql(11);
                                                    expect(data.result[0].states[1].rank).to.eql(2);
                                                    expect(data.result[0].states[2].rank).to.eql(23);
                                                    expect(data.result[0].states[4].rank).to.eql(5);
                                                    expect(data.result[0].states[0].rank).to.eql(6);
                                                    db.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                                                        if (err) {
                                                            done(err);
                                                            return;
                                                        }
                                                        expect(data.result).to.have.length(0);
                                                        done();
                                                    });
                                                });
                                            });
                                        });
                                    });
                                })
                            });
                        })
                    });
                });

            })
        })
        ;
    })
    it("insert operation with object multiple type field transaction rollback", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {"$collection": {"collection": "countries", "fields": [
                    {"field": "states", "type": "object", "multiple": true, "fields": [
                        {"field": "state", "type": "string"},
                        {"field": "rank", "type": "number"}
                    ]},
                    {"field": "languages", "type": "object", "multiple": true, "fields": [
                        {"field": "language", "type": "string"}
                    ]}
                ]}, $insert: [
                    {_id: 1, country: "USA", code: "01", "score": 1000, address: {city: "hisar", state: "haryana", "lineno": 1}, states: [
                        {state: "jammu", _id: "jammu", rank: 1},
                        {state: "delhi", _id: "delhi", rank: 2},
                        {state: "himachal", _id: "himachal", rank: 3},
                        {state: "punjab", _id: "punjab", rank: 4}
                    ], languages: [
                        {language: "Hindi"},
                        {language: "English"},
                        {_id: "urdu", language: "Urdu"},
                        {language: "German"}
                    ]}
                ]}
            ];
            db.startTransaction(function (err, txid) {
                if (err) {
                    done(err);
                    return;
                }
                db.batchUpdateById(updates, function (err, result) {
                    if (err) {
                        done(err);
                        return;
                    }
                    db.query({$collection: "countries"}, function (err, data) {
                        if (err) {
                            done(err);
                            return;
                        }
                        console.log("data>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(data));
                        expect(data.result).to.have.length(1);
                        expect(data.result[0].country).to.eql("USA");
                        expect(data.result[0].code).to.eql("01");
                        expect(data.result[0].score).to.eql(1000);
                        expect(data.result[0].address.city).to.eql("hisar");
                        expect(data.result[0].address.state).to.eql("haryana");
                        expect(data.result[0].address.lineno).to.eql(1);
                        expect(data.result[0].address.lineno).to.eql(1);
                        expect(data.result[0].states).to.have.length(4);
                        expect(data.result[0].states[0].state).to.eql("jammu");
                        expect(data.result[0].states[0].rank).to.eql(1);
                        expect(data.result[0].states[1].state).to.eql("delhi");
                        expect(data.result[0].states[1].rank).to.eql(2);
                        expect(data.result[0].states[2].state).to.eql("himachal");
                        expect(data.result[0].states[2].rank).to.eql(3);
                        expect(data.result[0].states[3].state).to.eql("punjab");
                        expect(data.result[0].states[3].rank).to.eql(4);

                        expect(data.result[0].languages).to.have.length(4);
                        expect(data.result[0].languages[0].language).to.eql("Hindi");
                        expect(data.result[0].languages[1].language).to.eql("English");
                        expect(data.result[0].languages[2].language).to.eql("Urdu");
                        expect(data.result[0].languages[3].language).to.eql("German");


                        db.commitTransaction(function (err) {
                            if (err) {
                                done(err);
                                return;
                            }
                            db.startTransaction(function (err, txid) {
                                var update = [
                                    {$collection: {"collection": "countries", "fields": [
                                        {"field": "states", "type": "object", "multiple": true, "fields": [
                                            {"field": "state", "type": "string"},
                                            {"field": "rank", "type": "number"}
                                        ]},
                                        {"field": "languages", "type": "object", "multiple": true, "fields": [
                                            {"field": "language", "type": "string"}
                                        ]}
                                    ]}, $update: [
                                        {_id: 1, $set: {"country": "India", address: {$set: {city: "Hisar1"}, $inc: { lineno: 12}}, states: {$insert: [
                                            {"state": "rajasthan", _id: "rajasthan", rank: 5},
                                            {"state": "bihar", _id: "bihar", rank: 6}
                                        ],
                                            $update: [
                                                {_id: "jammu", $set: {"state": "JK"}, $inc: {rank: 10}},
                                                {_id: "himachal", $set: {"state": "HP"}, $inc: {rank: 20}}
                                            ],
                                            $delete: [
                                                {_id: "punjab"}
                                            ]
                                        }, languages: {$insert: [
                                            {language: "Haryanvi"}
                                        ], $delete: [
                                            {$query: {language: "German"}}
                                        ], $update: [
                                            {_id: "urdu", $set: {language: "URDU", score: 100}}
                                        ]
                                        }
                                        }, $inc: {
                                            score: 10
                                        }
                                        }
                                    ]
                                    }
                                ];
                                db.batchUpdateById(update, function (err, result) {
                                    if (err) {
                                        done(err);
                                        return;
                                    }
                                    db.query({$collection: "countries"}, function (err, data) {
                                        if (err) {
                                            done(err);
                                            return;
                                        }
                                        console.log("data of countries after update>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(data));
                                        expect(data.result).to.have.length(1);
                                        expect(data.result[0].country).to.eql("India");
                                        expect(data.result[0].score).to.eql(1010);
                                        expect(data.result[0].address.city).to.eql("Hisar1");
                                        expect(data.result[0].address.lineno).to.eql(13);
                                        expect(data.result[0].states).to.have.length(5);

                                        expect(data.result[0].states[3].state).to.eql("JK");
                                        expect(data.result[0].states[1].state).to.eql("delhi");
                                        expect(data.result[0].states[2].state).to.eql("HP");
                                        expect(data.result[0].states[4].state).to.eql("rajasthan");
                                        expect(data.result[0].states[0].state).to.eql("bihar");
                                        expect(data.result[0].states[3].rank).to.eql(11);
                                        expect(data.result[0].states[1].rank).to.eql(2);
                                        expect(data.result[0].states[2].rank).to.eql(23);
                                        expect(data.result[0].states[4].rank).to.eql(5);
                                        expect(data.result[0].states[0].rank).to.eql(6);

                                        var tx = data.result[0].__txs__[txid].tx;
                                        console.log("*********tx>>>>>>>>>>>>>>>>>>" + JSON.stringify(tx));

                                        expect(tx.set).to.have.length(2);
                                        expect(tx.set[0].key).to.eql("country");
                                        expect(tx.set[0].value).to.eql("USA");
                                        expect(tx.set[1].key).to.eql("address.city");
                                        expect(tx.set[1].value).to.eql("hisar");

                                        expect(tx.inc).to.have.length(2);
                                        expect(tx.inc[0].key).to.eql("address.lineno");
                                        expect(tx.inc[0].value).to.eql(-12);
                                        expect(tx.inc[1].key).to.eql("score");
                                        expect(tx.inc[1].value).to.eql(-10);


                                        console.log("***********array****************" + JSON.stringify(tx.array.length));
                                        expect(tx.array).to.have.length(8);

                                        console.log("***********array0****************" + JSON.stringify(tx.array[0]));
                                        expect(tx.array[0].field).to.eql("states");
                                        expect(tx.array[0].type).to.eql("update");
                                        expect(tx.array[0]._id).to.eql("jammu");
                                        expect(tx.array[0].inc).to.have.length(1);
                                        expect(tx.array[0].inc[0].key).to.eql("rank");
                                        expect(tx.array[0].inc[0].value).to.eql(-10);
                                        expect(tx.array[0].set).to.have.length(1);
                                        expect(tx.array[0].set[0].key).to.eql("state");
                                        expect(tx.array[0].set[0].value).to.eql("jammu");
                                        console.log("***********array1****************" + JSON.stringify(tx.array[1]));
                                        expect(tx.array[1].field).to.eql("states");
                                        expect(tx.array[1].type).to.eql("update");
                                        expect(tx.array[1]._id).to.eql("himachal");
                                        expect(tx.array[1].inc).to.have.length(1);
                                        expect(tx.array[1].inc[0].key).to.eql("rank");
                                        expect(tx.array[1].inc[0].value).to.eql(-20);
                                        expect(tx.array[1].set).to.have.length(1);
                                        expect(tx.array[1].set[0].key).to.eql("state");
                                        expect(tx.array[1].set[0].value).to.eql("himachal");

                                        expect(tx.array[2].field).to.eql("states");
                                        expect(tx.array[2].type).to.eql("insert");
                                        expect(tx.array[2]._id).to.eql("punjab");
                                        expect(tx.array[2].value.state).to.eql("punjab");
                                        expect(tx.array[2].value._id).to.eql("punjab");
                                        expect(tx.array[2].value.rank).to.eql(4);


                                        expect(tx.array[3].field).to.eql("states");
                                        expect(tx.array[3].type).to.eql("delete");
                                        expect(tx.array[3]._id).to.eql("rajasthan");


                                        expect(tx.array[4].field).to.eql("states");
                                        expect(tx.array[4].type).to.eql("delete");
                                        expect(tx.array[4]._id).to.eql("bihar");


                                        expect(tx.array[5].field).to.eql("languages");
                                        expect(tx.array[5].type).to.eql("update");
                                        expect(tx.array[5]._id).to.eql("urdu");
                                        expect(tx.array[5].set).to.have.length(1);
                                        expect(tx.array[5].set[0].key).to.eql("language");
                                        expect(tx.array[5].set[0].value).to.eql("Urdu");
                                        expect(tx.array[5].unset).to.have.length(1);
                                        expect(tx.array[5].unset[0].key).to.eql("score");
                                        expect(tx.array[5].unset[0].value).to.eql(1);

                                        console.log("tx>>>" + JSON.stringify(tx.array[6]))
                                        expect(tx.array[6].field).to.eql("languages");
                                        expect(tx.array[6].type).to.eql("insert");
                                        expect(tx.array[6].value.language).to.eql("German");

                                        expect(tx.array[7].field).to.eql("languages");
                                        expect(tx.array[7].type).to.eql("delete");

                                        db.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                                            if (err) {
                                                done(err);
                                                return;
                                            }
                                            var transactions =
                                            {_id: "1", txid: "1", updates: [
                                                {tx: {$collection: "countries", $update: [
                                                    {_id: 1}
                                                ]}}
                                            ]};
                                            console.log("data of transaxction>>>" + JSON.stringify(data));
                                            expect(data.result).to.have.length(1);
                                            expect(data.result[0].txid).to.eql(txid);
                                            expect(data.result[0].updates).to.have.length(1);
                                            var txUpdates = data.result[0].updates;
                                            var tx = txUpdates[0].tx;
                                            expect(tx.collection).to.eql("countries");
                                            expect(tx.update._id).to.eql(1);


                                            db.rollbackTransaction(function (err) {
                                                db.query({$collection: "countries"}, function (err, data) {
                                                    if (err) {
                                                        done(err);
                                                        return;
                                                    }
                                                    console.log("Data after rollback>>>" + JSON.stringify(data));
                                                    expect(data.result).to.have.length(1);
                                                    expect(data.result[0].country).to.eql("USA");
                                                    expect(data.result[0].code).to.eql("01");
                                                    expect(data.result[0].score).to.eql(1000);
                                                    expect(data.result[0].address.city).to.eql("hisar");
                                                    expect(data.result[0].address.state).to.eql("haryana");
                                                    expect(data.result[0].address.lineno).to.eql(1);
                                                    expect(data.result[0].address.lineno).to.eql(1);
                                                    expect(data.result[0].states).to.have.length(4);
                                                    expect(data.result[0].states[2].state).to.eql("jammu");
                                                    expect(data.result[0].states[2].rank).to.eql(1);
                                                    expect(data.result[0].states[0].state).to.eql("delhi");
                                                    expect(data.result[0].states[0].rank).to.eql(2);
                                                    expect(data.result[0].states[1].state).to.eql("himachal");
                                                    expect(data.result[0].states[1].rank).to.eql(3);
                                                    expect(data.result[0].states[3].state).to.eql("punjab");
                                                    expect(data.result[0].states[3].rank).to.eql(4);

                                                    expect(data.result[0].languages).to.have.length(4);
                                                    expect(data.result[0].languages[1].language).to.eql("Hindi");
                                                    expect(data.result[0].languages[2].language).to.eql("English");
                                                    expect(data.result[0].languages[0].language).to.eql("Urdu");
                                                    expect(data.result[0].languages[3].language).to.eql("German");
                                                    db.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                                                        if (err) {
                                                            done(err);
                                                            return;
                                                        }
                                                        expect(data.result).to.have.length(0);
                                                        done();
                                                    });
                                                });
                                            });
                                        });
                                    });
                                })
                            });
                        })
                    });
                });

            })
        })
        ;
    })


    it("insert operation with nested array field transaction commit", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                    {"$collection": {"collection": "countries", "fields": [
                        {"field": "states", "type": "object", "multiple": true, "fields": [
                            {"field": "state", "type": "string"},
                            {"field": "rank", "type": "number"},
                            {"field": "districts", "type": "object", multiple: true, fields: [
                                {field: "district", type: "string"},
                                {field: "code", type: "number"}
                            ]}
                        ]},
                        {"field": "languages", "type": "object", "multiple": true, "fields": [
                            {"field": "language", "type": "string"}
                        ]},
                        {"field": "sports", "type": "object", "multiple": true, "fields": [
                            {"field": "sport", "type": "string"},
                            {"field": "score", "type": "number"},
                            {"field": "club", "type": "string"}
                        ]},
                        {"field": "profile", "type": "object", "fields": [
                            {"field": "username", "type": "string"},
                            {"field": "tweets", "type": "object", multiple: true, fields: [
                                {field: "tweet", type: "string"}
                            ]}
                        ]}
                    ]}, $insert: [
                        {_id: 1, country: "india", code: "01", "score": 1000, address: {city: "hisar", state: "haryana", "lineno": 1}, states: [
                            {state: "jammu", _id: "jammu", rank: 1, districts: [
                                {district: "katra", code: 11},
                                {district: "pahalgaon", code: 22}
                            ]},
                            {state: "delhi", _id: "delhi", rank: 2, districts: [
                                {district: "north", code: 111},
                                {district: "south", code: 222}
                            ]},
                            {state: "himachal", _id: "himachal", rank: 3, districts: [
                                {district: "kullu", code: 1111},
                                {district: "manali", code: 2222}
                            ]},
                            {state: "punjab", _id: "punjab", rank: 4, districts: [
                                {district: "amritsar", code: 11111},
                                {district: "patiala", code: 22222}
                            ]}
                        ], languages: [
                            {language: "Hindi"},
                            {language: "English"},
                            {_id: "urdu", language: "Urdu"},
                            {language: "German"}
                        ], sports: [
                            {sport: "cricket", "score": 100, club: "Kings X1 punjab"},
                            {sport: "cricket", "score": 95, club: "super kings"},
                            {sport: "cricket", "score": 85, club: "royals"}
                        ], profile: {
                            username: "maxwell", tweets: [
                                {tweet: "super player"},
                                {"tweet": "awesome player"},
                                {"tweet": "Man of the series"}
                            ]
                        }}
                    ]
                    }
                ]
                ;
            db.startTransaction(function (err, txid) {
                if (err) {
                    done(err);
                    return;
                }
                db.batchUpdateById(updates, function (err, result) {
                    if (err) {
                        done(err);
                        return;
                    }
                    db.query({$collection: "countries"}, function (err, data) {
                        if (err) {
                            done(err);
                            return;
                        }
                        console.log("data>>>>>>>>>>>>>after update>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(data));
                        expect(data.result).to.have.length(1);
                        expect(data.result[0].country).to.eql("india");
                        expect(data.result[0].code).to.eql("01");
                        expect(data.result[0].score).to.eql(1000);
                        expect(data.result[0].address.city).to.eql("hisar");
                        expect(data.result[0].address.state).to.eql("haryana");
                        expect(data.result[0].address.lineno).to.eql(1);
                        expect(data.result[0].address.lineno).to.eql(1);
                        expect(data.result[0].states).to.have.length(4);
                        expect(data.result[0].states[0].state).to.eql("jammu");
                        expect(data.result[0].states[0].rank).to.eql(1);
                        expect(data.result[0].states[0].districts).to.have.length(2);

                        expect(data.result[0].states[0].districts[0].district).to.eql("katra");
                        expect(data.result[0].states[0].districts[0].code).to.eql(11);
                        expect(data.result[0].states[0].districts[1].district).to.eql("pahalgaon");
                        expect(data.result[0].states[0].districts[1].code).to.eql(22);
                        expect(data.result[0].states[1].state).to.eql("delhi");
                        expect(data.result[0].states[1].rank).to.eql(2);
                        expect(data.result[0].states[1].districts).to.have.length(2);
                        expect(data.result[0].states[1].districts[0].district).to.eql("north");
                        expect(data.result[0].states[1].districts[0].code).to.eql(111);
                        expect(data.result[0].states[1].districts[1].district).to.eql("south");
                        expect(data.result[0].states[1].districts[1].code).to.eql(222);
                        expect(data.result[0].states[2].state).to.eql("himachal");
                        expect(data.result[0].states[2].rank).to.eql(3);
                        expect(data.result[0].states[2].districts).to.have.length(2);
                        expect(data.result[0].states[2].districts[0].district).to.eql("kullu");
                        expect(data.result[0].states[2].districts[0].code).to.eql(1111);
                        expect(data.result[0].states[2].districts[1].district).to.eql("manali");
                        expect(data.result[0].states[2].districts[1].code).to.eql(2222);
                        expect(data.result[0].states[3].state).to.eql("punjab");
                        expect(data.result[0].states[3].rank).to.eql(4);
                        expect(data.result[0].states[3].districts).to.have.length(2);
                        expect(data.result[0].states[3].districts[0].district).to.eql("amritsar");
                        expect(data.result[0].states[3].districts[0].code).to.eql(11111);
                        expect(data.result[0].states[3].districts[1].district).to.eql("patiala");
                        expect(data.result[0].states[3].districts[1].code).to.eql(22222);

                        expect(data.result[0].languages).to.have.length(4);
                        expect(data.result[0].languages[0].language).to.eql("Hindi");
                        expect(data.result[0].languages[1].language).to.eql("English");
                        expect(data.result[0].languages[2].language).to.eql("Urdu");
                        expect(data.result[0].languages[3].language).to.eql("German");

                        expect(data.result[0].sports).to.have.length(3);
                        expect(data.result[0].sports[0].sport).to.eql("cricket");
                        expect(data.result[0].sports[0].club).to.eql("Kings X1 punjab");
                        expect(data.result[0].sports[0].score).to.eql(100);
                        expect(data.result[0].sports[1].sport).to.eql("cricket");
                        expect(data.result[0].sports[1].club).to.eql("super kings");
                        expect(data.result[0].sports[1].score).to.eql(95);
                        expect(data.result[0].sports[2].sport).to.eql("cricket");
                        expect(data.result[0].sports[2].club).to.eql("royals");
                        expect(data.result[0].sports[2].score).to.eql(85);

                        expect(data.result[0].profile.username).to.eql("maxwell");
                        expect(data.result[0].profile.tweets).to.have.length(3);
                        expect(data.result[0].profile.tweets[0].tweet).to.eql("super player");
                        expect(data.result[0].profile.tweets[1].tweet).to.eql("awesome player");
                        expect(data.result[0].profile.tweets[2].tweet).to.eql("Man of the series");


                        db.commitTransaction(function (err) {
                            if (err) {
                                done(err);
                                return;
                            }
                            db.startTransaction(function (err, txid) {
                                var update = [
                                    {$collection: {"collection": "countries", "fields": [
                                        {"field": "states", "type": "object", "multiple": true, "fields": [
                                            {"field": "state", "type": "string"},
                                            {"field": "rank", "type": "number"},
                                            {"field": "districts", "type": "object", multiple: true, fields: [
                                                {field: "district", type: "string"},
                                                {field: "code", type: "number"}
                                            ]}
                                        ]},
                                        {"field": "languages", "type": "object", "multiple": true, "fields": [
                                            {"field": "language", "type": "string"}
                                        ]},
                                        {"field": "sports", "type": "object", "multiple": true, "fields": [
                                            {"field": "sport", "type": "string"},
                                            {"field": "score", "type": "number"},
                                            {"field": "club", "type": "string"}
                                        ]},
                                        {"field": "profile", "type": "object", "fields": [
                                            {"field": "username", "type": "string"},
                                            {"field": "tweets", "type": "object", multiple: true, fields: [
                                                {field: "tweet", type: "string"}
                                            ]}
                                        ]}
                                    ]}, $update: [
                                        {_id: 1, $set: {"country": "India", address: {$set: {city: "Hisar1"}, $inc: { lineno: 12}}, states: {$insert: [
                                            {"state": "rajasthan", _id: "rajasthan", rank: 5, districts: [
                                                {district: "jaipur", code: 4444}
                                            ]},
                                            {"state": "bihar", _id: "bihar", rank: 6, districts: [
                                                {district: "patna", code: 5555}
                                            ]}
                                        ],
                                            $update: [
                                                {_id: "jammu", $set: {"state": "JK", districts: {$insert: [
                                                    {"district": "ladakh", code: 6666}
                                                ], $update: [
                                                    {$query: {district: "katra"}, $set: {district: "newKatra"}, $inc: {code: -1}}
                                                ], $delete: [
                                                    {$query: {district: "pahalgaon"}}
                                                ]}}, $inc: {rank: 10}},
                                                {_id: "himachal", $set: {"state": "HP", districts: {$insert: [
                                                    {district: "shimla", code: 7777}
                                                ], $update: [
                                                    {$query: {district: "kullu"}, $set: {district: "newKullu"}, $inc: {code: -1}}
                                                ], $delete: [
                                                    {$query: {district: "manali"}}
                                                ]}}, $inc: {rank: 20}}
                                            ],
                                            $delete: [
                                                {$query: {state: "punjab"}}
                                            ]
                                        }, languages: {$insert: [
                                            {language: "Haryanvi"}
                                        ], $delete: [
                                            {$query: {language: "German"}}
                                        ], $update: [
                                            {_id: "urdu", $set: {language: "URDU", score: 100}}
                                        ]
                                        }, sports: {$insert: [
                                            {sport: "football", score: 1000, club: "manchester"}
                                        ], $update: [
                                            {$query: {club: "royals"}, $set: {club: "ROYALS"}, $inc: {score: -5}}
                                        ], $delete: [
                                            {$query: {club: "super kings"}}
                                        ]}, profile: {$set: {username: "kingmaxwell", tweets: {$insert: [
                                            {tweet: "king of kings"}
                                        ], $update: [
                                            {$query: {tweet: "awesome player"}, $set: {tweet: "mast hai"}}
                                        ], $delete: [
                                            {$query: {tweet: "Man of the series"}}
                                        ]}}}
                                        }, $inc: {
                                            score: 10
                                        }
                                        }
                                    ]
                                    }
                                ];
                                console.log("updating countries >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
                                db.batchUpdateById(update, function (err, result) {
                                    if (err) {
                                        done(err);
                                        return;
                                    }
                                    db.query({$collection: "countries"}, function (err, data) {
                                        if (err) {
                                            done(err);
                                            return;
                                        }
                                        console.log("data of countries after update>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(data));
                                        expect(data.result).to.have.length(1);
                                        expect(data.result[0].country).to.eql("India");
                                        expect(data.result[0].score).to.eql(1010);
                                        expect(data.result[0].address.city).to.eql("Hisar1");
                                        expect(data.result[0].address.lineno).to.eql(13);
                                        expect(data.result[0].states).to.have.length(5);

                                        expect(data.result[0].states[3].state).to.eql("JK");
                                        expect(data.result[0].states[3].rank).to.eql(11);
                                        expect(data.result[0].states[3].districts).to.have.length(2);
                                        expect(data.result[0].states[3].districts[0].district).to.eql("newKatra");
                                        expect(data.result[0].states[3].districts[0].code).to.eql(10);
                                        expect(data.result[0].states[3].districts[1].district).to.eql("ladakh");
                                        expect(data.result[0].states[3].districts[1].code).to.eql(6666);

                                        expect(data.result[0].states[1].state).to.eql("delhi");
                                        expect(data.result[0].states[1].rank).to.eql(2);
                                        expect(data.result[0].states[1].districts).to.have.length(2);
                                        expect(data.result[0].states[1].districts[0].district).to.eql("north");
                                        expect(data.result[0].states[1].districts[0].code).to.eql(111);
                                        expect(data.result[0].states[1].districts[1].district).to.eql("south");
                                        expect(data.result[0].states[1].districts[1].code).to.eql(222);

                                        expect(data.result[0].states[2].state).to.eql("HP");
                                        expect(data.result[0].states[2].rank).to.eql(23);
                                        expect(data.result[0].states[2].districts).to.have.length(2);
                                        expect(data.result[0].states[2].districts[0].district).to.eql("newKullu");
                                        expect(data.result[0].states[2].districts[0].code).to.eql(1110);
                                        expect(data.result[0].states[2].districts[1].district).to.eql("shimla");
                                        expect(data.result[0].states[2].districts[1].code).to.eql(7777);

                                        expect(data.result[0].states[4].state).to.eql("rajasthan");
                                        expect(data.result[0].states[4].rank).to.eql(5);
                                        expect(data.result[0].states[4].districts).to.have.length(1);
                                        expect(data.result[0].states[4].districts[0].district).to.eql("jaipur");
                                        expect(data.result[0].states[4].districts[0].code).to.eql(4444);


                                        expect(data.result[0].states[0].state).to.eql("bihar");
                                        expect(data.result[0].states[0].rank).to.eql(6);
                                        expect(data.result[0].states[0].districts).to.have.length(1);
                                        expect(data.result[0].states[0].districts[0].district).to.eql("patna");
                                        expect(data.result[0].states[0].districts[0].code).to.eql(5555);


                                        expect(data.result[0].sports).to.have.length(3);
                                        expect(data.result[0].sports[0].sport).to.eql("cricket");
                                        expect(data.result[0].sports[0].score).to.eql(100);
                                        expect(data.result[0].sports[0].club).to.eql("Kings X1 punjab");

                                        expect(data.result[0].sports[1].sport).to.eql("cricket");
                                        expect(data.result[0].sports[1].score).to.eql(80);
                                        expect(data.result[0].sports[1].club).to.eql("ROYALS");

                                        expect(data.result[0].sports[2].sport).to.eql("football");
                                        expect(data.result[0].sports[2].score).to.eql(1000);
                                        expect(data.result[0].sports[2].club).to.eql("manchester");

                                        expect(data.result[0].profile.username).to.eql("kingmaxwell");
                                        expect(data.result[0].profile.tweets).to.have.length(3);
                                        expect(data.result[0].profile.tweets[0].tweet).to.eql("super player");
                                        expect(data.result[0].profile.tweets[1].tweet).to.eql("mast hai");
                                        expect(data.result[0].profile.tweets[2].tweet).to.eql("king of kings");


                                        var tx = data.result[0].__txs__[txid].tx;
                                        console.log("*********tx>>>>>>>>>>>>>>>>>>" + JSON.stringify(tx));

                                        expect(tx.set).to.have.length(3);
                                        expect(tx.set[0].key).to.eql("country");
                                        expect(tx.set[0].value).to.eql("india");
                                        expect(tx.set[1].key).to.eql("address.city");
                                        expect(tx.set[1].value).to.eql("hisar");
                                        expect(tx.set[2].key).to.eql("profile.username");
                                        expect(tx.set[2].value).to.eql("maxwell");

                                        expect(tx.inc).to.have.length(2);
                                        expect(tx.inc[0].key).to.eql("address.lineno");
                                        expect(tx.inc[0].value).to.eql(-12);
                                        expect(tx.inc[1].key).to.eql("score");
                                        expect(tx.inc[1].value).to.eql(-10);


                                        console.log("***********array****************" + JSON.stringify(tx.array.length));
                                        expect(tx.array).to.have.length(14);

                                        console.log("***********array0****************" + JSON.stringify(tx.array[0]));
                                        /*expect(tx.array[0].field).to.eql("states");
                                         expect(tx.array[0].type).to.eql("update");
                                         expect(tx.array[0]._id).to.eql("jammu");
                                         expect(tx.array[0].inc).to.have.length(1);
                                         expect(tx.array[0].inc[0].key).to.eql("rank");
                                         expect(tx.array[0].inc[0].value).to.eql(-10);
                                         expect(tx.array[0].set).to.have.length(2);
                                         expect(tx.array[0].set[0].key).to.eql("state");
                                         expect(tx.array[0].set[0].value).to.eql("jammu");
                                         expect(tx.array[0].set[0].key).to.eql("districts");
                                         expect(tx.array[0].set[0].value).to.have.length(2);
                                         expect(tx.array[0].set[0].value[0].district).to.eql("katra");
                                         expect(tx.array[0].set[0].value[1]).to.have.length(2);
                                         console.log("***********array1****************" + JSON.stringify(tx.array[1]));
                                         expect(tx.array[1].field).to.eql("states");
                                         expect(tx.array[1].type).to.eql("update");
                                         expect(tx.array[1]._id).to.eql("himachal");
                                         expect(tx.array[1].inc).to.have.length(1);
                                         expect(tx.array[1].inc[0].key).to.eql("rank");
                                         expect(tx.array[1].inc[0].value).to.eql(-20);
                                         expect(tx.array[1].set).to.have.length(1);
                                         expect(tx.array[1].set[0].key).to.eql("state");
                                         expect(tx.array[1].set[0].value).to.eql("himachal");

                                         expect(tx.array[2].field).to.eql("states");
                                         expect(tx.array[2].type).to.eql("delete");
                                         expect(tx.array[2]._id).to.eql("punjab");
                                         expect(tx.array[2].value.state).to.eql("punjab");
                                         expect(tx.array[2].value._id).to.eql("punjab");
                                         expect(tx.array[2].value.rank).to.eql(4);


                                         expect(tx.array[3].field).to.eql("states");
                                         expect(tx.array[3].type).to.eql("insert");
                                         expect(tx.array[3]._id).to.eql("rajasthan");


                                         expect(tx.array[4].field).to.eql("states");
                                         expect(tx.array[4].type).to.eql("insert");
                                         expect(tx.array[4]._id).to.eql("bihar");


                                         expect(tx.array[5].field).to.eql("languages");
                                         expect(tx.array[5].type).to.eql("update");
                                         expect(tx.array[5]._id).to.eql("urdu");
                                         expect(tx.array[5].set).to.have.length(2);
                                         expect(tx.array[5].set[0].key).to.eql("language");
                                         expect(tx.array[5].set[0].value).to.eql("Urdu");
                                         expect(tx.array[5].set[1].key).to.eql("score");
                                         expect(tx.array[5].set[1].value).to.eql(null);

                                         console.log("tx>>>" + JSON.stringify(tx.array[6]))
                                         expect(tx.array[6].field).to.eql("languages");
                                         expect(tx.array[6].type).to.eql("delete");
                                         expect(tx.array[6].value.language).to.eql("German");

                                         expect(tx.array[7].field).to.eql("languages");
                                         expect(tx.array[7].type).to.eql("insert");*/

                                        db.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                                            if (err) {
                                                done(err);
                                                return;
                                            }
                                            var transactions =
                                            {_id: "1", txid: "1", updates: [
                                                {tx: {$collection: "countries", $update: [
                                                    {_id: 1}
                                                ]}}
                                            ]};
                                            console.log("data of transaxction>>>" + JSON.stringify(data));
                                            expect(data.result).to.have.length(1);
                                            expect(data.result[0].txid).to.eql(txid);
                                            expect(data.result[0].updates).to.have.length(1);
                                            var txUpdates = data.result[0].updates;
                                            var tx = txUpdates[0].tx;
                                            expect(tx.collection).to.eql("countries");
                                            expect(tx.update._id).to.eql(1);


                                            db.commitTransaction(function (err) {
                                                db.query({$collection: "countries"}, function (err, data) {
                                                    if (err) {
                                                        done(err);
                                                        return;
                                                    }
                                                    console.log("Data after comamit >>>" + JSON.stringify(data));
                                                    expect(data.result).to.have.length(1);
                                                    expect(data.result[0].country).to.eql("India");
                                                    expect(data.result[0].score).to.eql(1010);
                                                    expect(data.result[0].address.city).to.eql("Hisar1");
                                                    expect(data.result[0].address.lineno).to.eql(13);
                                                    expect(data.result[0].states).to.have.length(5);

                                                    expect(data.result[0].states[3].state).to.eql("JK");
                                                    expect(data.result[0].states[3].rank).to.eql(11);
                                                    expect(data.result[0].states[3].districts).to.have.length(2);
                                                    expect(data.result[0].states[3].districts[0].district).to.eql("newKatra");
                                                    expect(data.result[0].states[3].districts[0].code).to.eql(10);
                                                    expect(data.result[0].states[3].districts[1].district).to.eql("ladakh");
                                                    expect(data.result[0].states[3].districts[1].code).to.eql(6666);

                                                    expect(data.result[0].states[1].state).to.eql("delhi");
                                                    expect(data.result[0].states[1].rank).to.eql(2);
                                                    expect(data.result[0].states[1].districts).to.have.length(2);
                                                    expect(data.result[0].states[1].districts[0].district).to.eql("north");
                                                    expect(data.result[0].states[1].districts[0].code).to.eql(111);
                                                    expect(data.result[0].states[1].districts[1].district).to.eql("south");
                                                    expect(data.result[0].states[1].districts[1].code).to.eql(222);

                                                    expect(data.result[0].states[2].state).to.eql("HP");
                                                    expect(data.result[0].states[2].rank).to.eql(23);
                                                    expect(data.result[0].states[2].districts).to.have.length(2);
                                                    expect(data.result[0].states[2].districts[0].district).to.eql("newKullu");
                                                    expect(data.result[0].states[2].districts[0].code).to.eql(1110);
                                                    expect(data.result[0].states[2].districts[1].district).to.eql("shimla");
                                                    expect(data.result[0].states[2].districts[1].code).to.eql(7777);

                                                    expect(data.result[0].states[4].state).to.eql("rajasthan");
                                                    expect(data.result[0].states[4].rank).to.eql(5);
                                                    expect(data.result[0].states[4].districts).to.have.length(1);
                                                    expect(data.result[0].states[4].districts[0].district).to.eql("jaipur");
                                                    expect(data.result[0].states[4].districts[0].code).to.eql(4444);


                                                    expect(data.result[0].states[0].state).to.eql("bihar");
                                                    expect(data.result[0].states[0].rank).to.eql(6);
                                                    expect(data.result[0].states[0].districts).to.have.length(1);
                                                    expect(data.result[0].states[0].districts[0].district).to.eql("patna");
                                                    expect(data.result[0].states[0].districts[0].code).to.eql(5555);


                                                    expect(data.result[0].sports).to.have.length(3);
                                                    expect(data.result[0].sports[0].sport).to.eql("cricket");
                                                    expect(data.result[0].sports[0].score).to.eql(100);
                                                    expect(data.result[0].sports[0].club).to.eql("Kings X1 punjab");

                                                    expect(data.result[0].sports[1].sport).to.eql("cricket");
                                                    expect(data.result[0].sports[1].score).to.eql(80);
                                                    expect(data.result[0].sports[1].club).to.eql("ROYALS");

                                                    expect(data.result[0].sports[2].sport).to.eql("football");
                                                    expect(data.result[0].sports[2].score).to.eql(1000);
                                                    expect(data.result[0].sports[2].club).to.eql("manchester");

                                                    expect(data.result[0].profile.username).to.eql("kingmaxwell");
                                                    expect(data.result[0].profile.tweets).to.have.length(3);
                                                    expect(data.result[0].profile.tweets[0].tweet).to.eql("super player");
                                                    expect(data.result[0].profile.tweets[1].tweet).to.eql("mast hai");
                                                    expect(data.result[0].profile.tweets[2].tweet).to.eql("king of kings");

                                                    db.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                                                        if (err) {
                                                            done(err);
                                                            return;
                                                        }
                                                        expect(data.result).to.have.length(0);
                                                        done();
                                                    });
                                                });
                                            });
                                        });
                                    });
                                })
                            });
                        })
                    });
                });

            })
        })
    });
    it("insert operation with nested array field transaction rollback", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                    {"$collection": {"collection": "countries", "fields": [
                        {"field": "states", "type": "object", "multiple": true, "fields": [
                            {"field": "state", "type": "string"},
                            {"field": "rank", "type": "number"},
                            {"field": "districts", "type": "object", multiple: true, fields: [
                                {field: "district", type: "string"},
                                {field: "code", type: "number"}
                            ]}
                        ]},
                        {"field": "languages", "type": "object", "multiple": true, "fields": [
                            {"field": "language", "type": "string"}
                        ]},
                        {"field": "sports", "type": "object", "multiple": true, "fields": [
                            {"field": "sport", "type": "string"},
                            {"field": "score", "type": "number"},
                            {"field": "club", "type": "string"}
                        ]},
                        {"field": "profile", "type": "object", "fields": [
                            {"field": "username", "type": "string"},
                            {"field": "tweets", "type": "object", multiple: true, fields: [
                                {field: "tweet", type: "string"}
                            ]}
                        ]}
                    ]}, $insert: [
                        {_id: 1, country: "india", code: "01", "score": 1000, address: {city: "hisar", state: "haryana", "lineno": 1}, states: [
                            {state: "jammu", _id: "jammu", rank: 1, districts: [
                                {district: "katra", code: 11},
                                {district: "pahalgaon", code: 22}
                            ]},
                            {state: "delhi", _id: "delhi", rank: 2, districts: [
                                {district: "north", code: 111},
                                {district: "south", code: 222}
                            ]},
                            {state: "himachal", _id: "himachal", rank: 3, districts: [
                                {district: "kullu", code: 1111},
                                {district: "manali", code: 2222}
                            ]},
                            {state: "punjab", _id: "punjab", rank: 4, districts: [
                                {district: "amritsar", code: 11111},
                                {district: "patiala", code: 22222}
                            ]}
                        ], languages: [
                            {language: "Hindi"},
                            {language: "English"},
                            {_id: "urdu", language: "Urdu"},
                            {language: "German"}
                        ], sports: [
                            {sport: "cricket", "score": 100, club: "Kings X1 punjab"},
                            {sport: "cricket", "score": 95, club: "super kings"},
                            {sport: "cricket", "score": 85, club: "royals"}
                        ], profile: {
                            username: "maxwell", tweets: [
                                {tweet: "super player"},
                                {"tweet": "awesome player"},
                                {"tweet": "Man of the series"}
                            ]
                        }}
                    ]
                    }
                ]
                ;
            db.startTransaction(function (err, txid) {
                if (err) {
                    done(err);
                    return;
                }
                db.batchUpdateById(updates, function (err, result) {
                    if (err) {
                        done(err);
                        return;
                    }
                    db.query({$collection: "countries"}, function (err, data) {
                        if (err) {
                            done(err);
                            return;
                        }
                        console.log("data>>>>>>>>>>>>>after update>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(data));
                        expect(data.result).to.have.length(1);
                        expect(data.result[0].country).to.eql("india");
                        expect(data.result[0].code).to.eql("01");
                        expect(data.result[0].score).to.eql(1000);
                        expect(data.result[0].address.city).to.eql("hisar");
                        expect(data.result[0].address.state).to.eql("haryana");
                        expect(data.result[0].address.lineno).to.eql(1);
                        expect(data.result[0].address.lineno).to.eql(1);
                        expect(data.result[0].states).to.have.length(4);
                        expect(data.result[0].states[0].state).to.eql("jammu");
                        expect(data.result[0].states[0].rank).to.eql(1);
                        expect(data.result[0].states[0].districts).to.have.length(2);

                        expect(data.result[0].states[0].districts[0].district).to.eql("katra");
                        expect(data.result[0].states[0].districts[0].code).to.eql(11);
                        expect(data.result[0].states[0].districts[1].district).to.eql("pahalgaon");
                        expect(data.result[0].states[0].districts[1].code).to.eql(22);
                        expect(data.result[0].states[1].state).to.eql("delhi");
                        expect(data.result[0].states[1].rank).to.eql(2);
                        expect(data.result[0].states[1].districts).to.have.length(2);
                        expect(data.result[0].states[1].districts[0].district).to.eql("north");
                        expect(data.result[0].states[1].districts[0].code).to.eql(111);
                        expect(data.result[0].states[1].districts[1].district).to.eql("south");
                        expect(data.result[0].states[1].districts[1].code).to.eql(222);
                        expect(data.result[0].states[2].state).to.eql("himachal");
                        expect(data.result[0].states[2].rank).to.eql(3);
                        expect(data.result[0].states[2].districts).to.have.length(2);
                        expect(data.result[0].states[2].districts[0].district).to.eql("kullu");
                        expect(data.result[0].states[2].districts[0].code).to.eql(1111);
                        expect(data.result[0].states[2].districts[1].district).to.eql("manali");
                        expect(data.result[0].states[2].districts[1].code).to.eql(2222);
                        expect(data.result[0].states[3].state).to.eql("punjab");
                        expect(data.result[0].states[3].rank).to.eql(4);
                        expect(data.result[0].states[3].districts).to.have.length(2);
                        expect(data.result[0].states[3].districts[0].district).to.eql("amritsar");
                        expect(data.result[0].states[3].districts[0].code).to.eql(11111);
                        expect(data.result[0].states[3].districts[1].district).to.eql("patiala");
                        expect(data.result[0].states[3].districts[1].code).to.eql(22222);

                        expect(data.result[0].languages).to.have.length(4);
                        expect(data.result[0].languages[0].language).to.eql("Hindi");
                        expect(data.result[0].languages[1].language).to.eql("English");
                        expect(data.result[0].languages[2].language).to.eql("Urdu");
                        expect(data.result[0].languages[3].language).to.eql("German");

                        expect(data.result[0].sports).to.have.length(3);
                        expect(data.result[0].sports[0].sport).to.eql("cricket");
                        expect(data.result[0].sports[0].club).to.eql("Kings X1 punjab");
                        expect(data.result[0].sports[0].score).to.eql(100);
                        expect(data.result[0].sports[1].sport).to.eql("cricket");
                        expect(data.result[0].sports[1].club).to.eql("super kings");
                        expect(data.result[0].sports[1].score).to.eql(95);
                        expect(data.result[0].sports[2].sport).to.eql("cricket");
                        expect(data.result[0].sports[2].club).to.eql("royals");
                        expect(data.result[0].sports[2].score).to.eql(85);

                        expect(data.result[0].profile.username).to.eql("maxwell");
                        expect(data.result[0].profile.tweets).to.have.length(3);
                        expect(data.result[0].profile.tweets[0].tweet).to.eql("super player");
                        expect(data.result[0].profile.tweets[1].tweet).to.eql("awesome player");
                        expect(data.result[0].profile.tweets[2].tweet).to.eql("Man of the series");


                        db.commitTransaction(function (err) {
                            if (err) {
                                done(err);
                                return;
                            }
                            db.startTransaction(function (err, txid) {
                                var update = [
                                    {$collection: {"collection": "countries", "fields": [
                                        {"field": "states", "type": "object", "multiple": true, "fields": [
                                            {"field": "state", "type": "string"},
                                            {"field": "rank", "type": "number"},
                                            {"field": "districts", "type": "object", multiple: true, fields: [
                                                {field: "district", type: "string"},
                                                {field: "code", type: "number"}
                                            ]}
                                        ]},
                                        {"field": "languages", "type": "object", "multiple": true, "fields": [
                                            {"field": "language", "type": "string"}
                                        ]},
                                        {"field": "sports", "type": "object", "multiple": true, "fields": [
                                            {"field": "sport", "type": "string"},
                                            {"field": "score", "type": "number"},
                                            {"field": "club", "type": "string"}
                                        ]},
                                        {"field": "profile", "type": "object", "fields": [
                                            {"field": "username", "type": "string"},
                                            {"field": "tweets", "type": "object", multiple: true, fields: [
                                                {field: "tweet", type: "string"}
                                            ]}
                                        ]}
                                    ]}, $update: [
                                        {_id: 1, $set: {"country": "India", address: {$set: {city: "Hisar1"}, $inc: { lineno: 12}}, states: {$insert: [
                                            {"state": "rajasthan", _id: "rajasthan", rank: 5, districts: [
                                                {district: "jaipur", code: 4444}
                                            ]},
                                            {"state": "bihar", _id: "bihar", rank: 6, districts: [
                                                {district: "patna", code: 5555}
                                            ]}
                                        ],
                                            $update: [
                                                {_id: "jammu", $set: {"state": "JK", districts: {$insert: [
                                                    {"district": "ladakh", code: 6666}
                                                ], $update: [
                                                    {$query: {district: "katra"}, $set: {district: "newKatra"}, $inc: {code: -1}}
                                                ], $delete: [
                                                    {$query: {district: "pahalgaon"}}
                                                ]}}, $inc: {rank: 10}},
                                                {_id: "himachal", $set: {"state": "HP", districts: {$insert: [
                                                    {district: "shimla", code: 7777}
                                                ], $update: [
                                                    {$query: {district: "kullu"}, $set: {district: "newKullu"}, $inc: {code: -1}}
                                                ], $delete: [
                                                    {$query: {district: "manali"}}
                                                ]}}, $inc: {rank: 20}}
                                            ],
                                            $delete: [
                                                {$query: {state: "punjab"}}
                                            ]
                                        }, languages: {$insert: [
                                            {language: "Haryanvi"}
                                        ], $delete: [
                                            {$query: {language: "German"}}
                                        ], $update: [
                                            {_id: "urdu", $set: {language: "URDU", score: 100}}
                                        ]
                                        }, sports: {$insert: [
                                            {sport: "football", score: 1000, club: "manchester"}
                                        ], $update: [
                                            {$query: {club: "royals"}, $set: {club: "ROYALS"}, $inc: {score: -5}}
                                        ], $delete: [
                                            {$query: {club: "super kings"}}
                                        ]}, profile: {$set: {username: "kingmaxwell", tweets: {$insert: [
                                            {tweet: "king of kings"}
                                        ], $update: [
                                            {$query: {tweet: "awesome player"}, $set: {tweet: "mast hai"}}
                                        ], $delete: [
                                            {$query: {tweet: "Man of the series"}}
                                        ]}}}
                                        }, $inc: {
                                            score: 10
                                        }
                                        }
                                    ]
                                    }
                                ];
                                console.log("updating countries >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
                                db.batchUpdateById(update, function (err, result) {
                                    if (err) {
                                        done(err);
                                        return;
                                    }
                                    db.query({$collection: "countries"}, function (err, data) {
                                        if (err) {
                                            done(err);
                                            return;
                                        }
                                        console.log("data of countries after update>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(data));
                                        expect(data.result).to.have.length(1);
                                        expect(data.result[0].country).to.eql("India");
                                        expect(data.result[0].score).to.eql(1010);
                                        expect(data.result[0].address.city).to.eql("Hisar1");
                                        expect(data.result[0].address.lineno).to.eql(13);
                                        expect(data.result[0].states).to.have.length(5);

                                        expect(data.result[0].states[3].state).to.eql("JK");
                                        expect(data.result[0].states[3].rank).to.eql(11);
                                        expect(data.result[0].states[3].districts).to.have.length(2);
                                        expect(data.result[0].states[3].districts[0].district).to.eql("newKatra");
                                        expect(data.result[0].states[3].districts[0].code).to.eql(10);
                                        expect(data.result[0].states[3].districts[1].district).to.eql("ladakh");
                                        expect(data.result[0].states[3].districts[1].code).to.eql(6666);

                                        expect(data.result[0].states[1].state).to.eql("delhi");
                                        expect(data.result[0].states[1].rank).to.eql(2);
                                        expect(data.result[0].states[1].districts).to.have.length(2);
                                        expect(data.result[0].states[1].districts[0].district).to.eql("north");
                                        expect(data.result[0].states[1].districts[0].code).to.eql(111);
                                        expect(data.result[0].states[1].districts[1].district).to.eql("south");
                                        expect(data.result[0].states[1].districts[1].code).to.eql(222);

                                        expect(data.result[0].states[2].state).to.eql("HP");
                                        expect(data.result[0].states[2].rank).to.eql(23);
                                        expect(data.result[0].states[2].districts).to.have.length(2);
                                        expect(data.result[0].states[2].districts[0].district).to.eql("newKullu");
                                        expect(data.result[0].states[2].districts[0].code).to.eql(1110);
                                        expect(data.result[0].states[2].districts[1].district).to.eql("shimla");
                                        expect(data.result[0].states[2].districts[1].code).to.eql(7777);

                                        expect(data.result[0].states[4].state).to.eql("rajasthan");
                                        expect(data.result[0].states[4].rank).to.eql(5);
                                        expect(data.result[0].states[4].districts).to.have.length(1);
                                        expect(data.result[0].states[4].districts[0].district).to.eql("jaipur");
                                        expect(data.result[0].states[4].districts[0].code).to.eql(4444);


                                        expect(data.result[0].states[0].state).to.eql("bihar");
                                        expect(data.result[0].states[0].rank).to.eql(6);
                                        expect(data.result[0].states[0].districts).to.have.length(1);
                                        expect(data.result[0].states[0].districts[0].district).to.eql("patna");
                                        expect(data.result[0].states[0].districts[0].code).to.eql(5555);


                                        expect(data.result[0].sports).to.have.length(3);
                                        expect(data.result[0].sports[0].sport).to.eql("cricket");
                                        expect(data.result[0].sports[0].score).to.eql(100);
                                        expect(data.result[0].sports[0].club).to.eql("Kings X1 punjab");

                                        expect(data.result[0].sports[1].sport).to.eql("cricket");
                                        expect(data.result[0].sports[1].score).to.eql(80);
                                        expect(data.result[0].sports[1].club).to.eql("ROYALS");

                                        expect(data.result[0].sports[2].sport).to.eql("football");
                                        expect(data.result[0].sports[2].score).to.eql(1000);
                                        expect(data.result[0].sports[2].club).to.eql("manchester");

                                        expect(data.result[0].profile.username).to.eql("kingmaxwell");
                                        expect(data.result[0].profile.tweets).to.have.length(3);
                                        expect(data.result[0].profile.tweets[0].tweet).to.eql("super player");
                                        expect(data.result[0].profile.tweets[1].tweet).to.eql("mast hai");
                                        expect(data.result[0].profile.tweets[2].tweet).to.eql("king of kings");


                                        var tx = data.result[0].__txs__[txid].tx;
                                        console.log("*********tx>>>>>>>>>>>>>>>>>>" + JSON.stringify(tx));

                                        expect(tx.set).to.have.length(3);
                                        expect(tx.set[0].key).to.eql("country");
                                        expect(tx.set[0].value).to.eql("india");
                                        expect(tx.set[1].key).to.eql("address.city");
                                        expect(tx.set[1].value).to.eql("hisar");
                                        expect(tx.set[2].key).to.eql("profile.username");
                                        expect(tx.set[2].value).to.eql("maxwell");

                                        expect(tx.inc).to.have.length(2);
                                        expect(tx.inc[0].key).to.eql("address.lineno");
                                        expect(tx.inc[0].value).to.eql(-12);
                                        expect(tx.inc[1].key).to.eql("score");
                                        expect(tx.inc[1].value).to.eql(-10);


                                        console.log("***********array****************" + JSON.stringify(tx.array.length));
                                        expect(tx.array).to.have.length(14);

                                        console.log("***********array0****************" + JSON.stringify(tx.array[0]));
                                        /*expect(tx.array[0].field).to.eql("states");
                                         expect(tx.array[0].type).to.eql("update");
                                         expect(tx.array[0]._id).to.eql("jammu");
                                         expect(tx.array[0].inc).to.have.length(1);
                                         expect(tx.array[0].inc[0].key).to.eql("rank");
                                         expect(tx.array[0].inc[0].value).to.eql(-10);
                                         expect(tx.array[0].set).to.have.length(2);
                                         expect(tx.array[0].set[0].key).to.eql("state");
                                         expect(tx.array[0].set[0].value).to.eql("jammu");
                                         expect(tx.array[0].set[0].key).to.eql("districts");
                                         expect(tx.array[0].set[0].value).to.have.length(2);
                                         expect(tx.array[0].set[0].value[0].district).to.eql("katra");
                                         expect(tx.array[0].set[0].value[1]).to.have.length(2);
                                         console.log("***********array1****************" + JSON.stringify(tx.array[1]));
                                         expect(tx.array[1].field).to.eql("states");
                                         expect(tx.array[1].type).to.eql("update");
                                         expect(tx.array[1]._id).to.eql("himachal");
                                         expect(tx.array[1].inc).to.have.length(1);
                                         expect(tx.array[1].inc[0].key).to.eql("rank");
                                         expect(tx.array[1].inc[0].value).to.eql(-20);
                                         expect(tx.array[1].set).to.have.length(1);
                                         expect(tx.array[1].set[0].key).to.eql("state");
                                         expect(tx.array[1].set[0].value).to.eql("himachal");

                                         expect(tx.array[2].field).to.eql("states");
                                         expect(tx.array[2].type).to.eql("delete");
                                         expect(tx.array[2]._id).to.eql("punjab");
                                         expect(tx.array[2].value.state).to.eql("punjab");
                                         expect(tx.array[2].value._id).to.eql("punjab");
                                         expect(tx.array[2].value.rank).to.eql(4);


                                         expect(tx.array[3].field).to.eql("states");
                                         expect(tx.array[3].type).to.eql("insert");
                                         expect(tx.array[3]._id).to.eql("rajasthan");


                                         expect(tx.array[4].field).to.eql("states");
                                         expect(tx.array[4].type).to.eql("insert");
                                         expect(tx.array[4]._id).to.eql("bihar");


                                         expect(tx.array[5].field).to.eql("languages");
                                         expect(tx.array[5].type).to.eql("update");
                                         expect(tx.array[5]._id).to.eql("urdu");
                                         expect(tx.array[5].set).to.have.length(2);
                                         expect(tx.array[5].set[0].key).to.eql("language");
                                         expect(tx.array[5].set[0].value).to.eql("Urdu");
                                         expect(tx.array[5].set[1].key).to.eql("score");
                                         expect(tx.array[5].set[1].value).to.eql(null);

                                         console.log("tx>>>" + JSON.stringify(tx.array[6]))
                                         expect(tx.array[6].field).to.eql("languages");
                                         expect(tx.array[6].type).to.eql("delete");
                                         expect(tx.array[6].value.language).to.eql("German");

                                         expect(tx.array[7].field).to.eql("languages");
                                         expect(tx.array[7].type).to.eql("insert");*/

                                        db.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                                            if (err) {
                                                done(err);
                                                return;
                                            }
                                            var transactions =
                                            {_id: "1", txid: "1", updates: [
                                                {tx: {$collection: "countries", $update: [
                                                    {_id: 1}
                                                ]}}
                                            ]};
                                            console.log("data of transaxction>>>" + JSON.stringify(data));
                                            expect(data.result).to.have.length(1);
                                            expect(data.result[0].txid).to.eql(txid);
                                            expect(data.result[0].updates).to.have.length(1);
                                            var txUpdates = data.result[0].updates;
                                            var tx = txUpdates[0].tx;
                                            expect(tx.collection).to.eql("countries");
                                            expect(tx.update._id).to.eql(1);


                                            db.rollbackTransaction(function (err) {
                                                db.query({$collection: "countries"}, function (err, data) {
                                                    if (err) {
                                                        done(err);
                                                        return;
                                                    }
                                                    console.log("Data after rollback >>>" + JSON.stringify(data));
                                                    expect(data.result).to.have.length(1);
                                                    expect(data.result[0].country).to.eql("india");
                                                    expect(data.result[0].code).to.eql("01");
                                                    expect(data.result[0].score).to.eql(1000);
                                                    expect(data.result[0].address.city).to.eql("hisar");
                                                    expect(data.result[0].address.state).to.eql("haryana");
                                                    expect(data.result[0].address.lineno).to.eql(1);
                                                    expect(data.result[0].address.lineno).to.eql(1);
                                                    expect(data.result[0].states).to.have.length(4);
                                                    expect(data.result[0].states[2].state).to.eql("jammu");
                                                    expect(data.result[0].states[2].rank).to.eql(1);
                                                    expect(data.result[0].states[2].districts).to.have.length(2);

                                                    expect(data.result[0].states[2].districts[0].district).to.eql("katra");
                                                    expect(data.result[0].states[2].districts[0].code).to.eql(11);
                                                    expect(data.result[0].states[2].districts[1].district).to.eql("pahalgaon");
                                                    expect(data.result[0].states[2].districts[1].code).to.eql(22);

                                                    expect(data.result[0].states[0].state).to.eql("delhi");
                                                    expect(data.result[0].states[0].rank).to.eql(2);
                                                    expect(data.result[0].states[0].districts).to.have.length(2);
                                                    expect(data.result[0].states[0].districts[0].district).to.eql("north");
                                                    expect(data.result[0].states[0].districts[0].code).to.eql(111);
                                                    expect(data.result[0].states[0].districts[1].district).to.eql("south");
                                                    expect(data.result[0].states[0].districts[1].code).to.eql(222);

                                                    expect(data.result[0].states[1].state).to.eql("himachal");
                                                    expect(data.result[0].states[1].rank).to.eql(3);
                                                    expect(data.result[0].states[1].districts).to.have.length(2);
                                                    expect(data.result[0].states[1].districts[0].district).to.eql("kullu");
                                                    expect(data.result[0].states[1].districts[0].code).to.eql(1111);
                                                    expect(data.result[0].states[1].districts[1].district).to.eql("manali");
                                                    expect(data.result[0].states[1].districts[1].code).to.eql(2222);
                                                    expect(data.result[0].states[3].state).to.eql("punjab");
                                                    expect(data.result[0].states[3].rank).to.eql(4);
                                                    expect(data.result[0].states[3].districts).to.have.length(2);
                                                    expect(data.result[0].states[3].districts[0].district).to.eql("amritsar");
                                                    expect(data.result[0].states[3].districts[0].code).to.eql(11111);
                                                    expect(data.result[0].states[3].districts[1].district).to.eql("patiala");
                                                    expect(data.result[0].states[3].districts[1].code).to.eql(22222);

                                                    expect(data.result[0].languages).to.have.length(4);
                                                    expect(data.result[0].languages[1].language).to.eql("Hindi");
                                                    expect(data.result[0].languages[2].language).to.eql("English");
                                                    expect(data.result[0].languages[0].language).to.eql("Urdu");
                                                    expect(data.result[0].languages[3].language).to.eql("German");

                                                    expect(data.result[0].sports).to.have.length(3);
                                                    expect(data.result[0].sports[0].sport).to.eql("cricket");
                                                    expect(data.result[0].sports[0].club).to.eql("Kings X1 punjab");
                                                    expect(data.result[0].sports[0].score).to.eql(100);
                                                    expect(data.result[0].sports[1].sport).to.eql("cricket");
                                                    expect(data.result[0].sports[1].club).to.eql("super kings");
                                                    expect(data.result[0].sports[1].score).to.eql(95);
                                                    expect(data.result[0].sports[2].sport).to.eql("cricket");
                                                    expect(data.result[0].sports[2].club).to.eql("royals");
                                                    expect(data.result[0].sports[2].score).to.eql(85);

                                                    expect(data.result[0].profile.username).to.eql("maxwell");
                                                    expect(data.result[0].profile.tweets).to.have.length(3);
                                                    expect(data.result[0].profile.tweets[0].tweet).to.eql("super player");
                                                    expect(data.result[0].profile.tweets[1].tweet).to.eql("awesome player");
                                                    expect(data.result[0].profile.tweets[2].tweet).to.eql("Man of the series");

                                                    db.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                                                        if (err) {
                                                            done(err);
                                                            return;
                                                        }
                                                        expect(data.result).to.have.length(0);
                                                        done();
                                                    });
                                                });
                                            });
                                        });
                                    });
                                })
                            });
                        })
                    });
                });

            })
        })
    });


    it("insert operation with object multiple type field override case transaction commit", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {"$collection": {"collection": "countries", "fields": [
                    {"field": "states", "type": "object", "multiple": true, "fields": [
                        {"field": "state", "type": "string"},
                        {"field": "rank", "type": "number"}
                    ]},
                    {"field": "languages", "type": "object", "multiple": true, "fields": [
                        {"field": "language", "type": "string"}
                    ]}
                ]}, $insert: [
                    {_id: 1, country: "USA", code: "01", "score": 1000, address: {city: "hisar", state: "haryana", "lineno": 1}, states: [
                        {state: "jammu", _id: "jammu", rank: 1},
                        {state: "delhi", _id: "delhi", rank: 2},
                        {state: "himachal", _id: "himachal", rank: 3},
                        {state: "punjab", _id: "punjab", rank: 4}
                    ], languages: [
                        {language: "Hindi"},
                        {language: "English"},
                        {_id: "urdu", language: "Urdu"},
                        {language: "German"}
                    ]}
                ]}
            ];
            db.startTransaction(function (err, txid) {
                if (err) {
                    done(err);
                    return;
                }
                db.batchUpdateById(updates, function (err, result) {
                    if (err) {
                        done(err);
                        return;
                    }
                    db.query({$collection: "countries"}, function (err, data) {
                        if (err) {
                            done(err);
                            return;
                        }
                        console.log("data>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(data));
                        expect(data.result).to.have.length(1);
                        expect(data.result[0].country).to.eql("USA");
                        expect(data.result[0].code).to.eql("01");
                        expect(data.result[0].score).to.eql(1000);
                        expect(data.result[0].address.city).to.eql("hisar");
                        expect(data.result[0].address.state).to.eql("haryana");
                        expect(data.result[0].address.lineno).to.eql(1);
                        expect(data.result[0].address.lineno).to.eql(1);
                        expect(data.result[0].states).to.have.length(4);
                        expect(data.result[0].states[0].state).to.eql("jammu");
                        expect(data.result[0].states[0].rank).to.eql(1);
                        expect(data.result[0].states[1].state).to.eql("delhi");
                        expect(data.result[0].states[1].rank).to.eql(2);
                        expect(data.result[0].states[2].state).to.eql("himachal");
                        expect(data.result[0].states[2].rank).to.eql(3);
                        expect(data.result[0].states[3].state).to.eql("punjab");
                        expect(data.result[0].states[3].rank).to.eql(4);

                        expect(data.result[0].languages).to.have.length(4);
                        expect(data.result[0].languages[0].language).to.eql("Hindi");
                        expect(data.result[0].languages[1].language).to.eql("English");
                        expect(data.result[0].languages[2].language).to.eql("Urdu");
                        expect(data.result[0].languages[3].language).to.eql("German");


                        db.commitTransaction(function (err) {
                            if (err) {
                                done(err);
                                return;
                            }
                            db.startTransaction(function (err, txid) {
                                var update = [
                                    {$collection: {"collection": "countries", "fields": [
                                        {"field": "states", "type": "object", "multiple": true, "fields": [
                                            {"field": "state", "type": "string"},
                                            {"field": "rank", "type": "number"}
                                        ]},
                                        {"field": "languages", "type": "object", "multiple": true, "fields": [
                                            {"field": "language", "type": "string"}
                                        ]}
                                    ]}, $update: [
                                        {_id: 1, $set: {"country": "India", address: {$set: {city: "Hisar1"}, $inc: { lineno: 12}}, states: {$insert: [
                                            {"state": "rajasthan", _id: "rajasthan", rank: 5},
                                            {"state": "bihar", _id: "bihar", rank: 6}
                                        ],
                                            $update: [
                                                {_id: "jammu", $set: {"state": "JK"}, $inc: {rank: 10}},
                                                {_id: "himachal", $set: {"state": "HP"}, $inc: {rank: 20}}
                                            ],
                                            $delete: [
                                                {_id: "punjab"}
                                            ]
                                        }, languages: [
                                            {language: "marathi"},
                                            {language: "gujrati"}
                                        ]
                                        }, $inc: {
                                            score: 10
                                        }
                                        }


                                    ]
                                    }
                                ];
                                db.batchUpdateById(update, function (err, result) {
                                    if (err) {
                                        done(err);
                                        return;
                                    }
                                    db.query({$collection: "countries"}, function (err, data) {
                                        if (err) {
                                            done(err);
                                            return;
                                        }
                                        console.log("data of countries after update>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(data));
                                        expect(data.result).to.have.length(1);
                                        expect(data.result[0].country).to.eql("India");
                                        expect(data.result[0].score).to.eql(1010);
                                        expect(data.result[0].address.city).to.eql("Hisar1");
                                        expect(data.result[0].address.lineno).to.eql(13);
                                        expect(data.result[0].states).to.have.length(5);

                                        expect(data.result[0].states[3].state).to.eql("JK");
                                        expect(data.result[0].states[1].state).to.eql("delhi");
                                        expect(data.result[0].states[2].state).to.eql("HP");
                                        expect(data.result[0].states[4].state).to.eql("rajasthan");
                                        expect(data.result[0].states[0].state).to.eql("bihar");
                                        expect(data.result[0].states[3].rank).to.eql(11);
                                        expect(data.result[0].states[1].rank).to.eql(2);
                                        expect(data.result[0].states[2].rank).to.eql(23);
                                        expect(data.result[0].states[4].rank).to.eql(5);
                                        expect(data.result[0].states[0].rank).to.eql(6);

                                        expect(data.result[0].languages).to.have.length(2);
                                        expect(data.result[0].languages[0].language).to.eql("marathi");
                                        expect(data.result[0].languages[1].language).to.eql("gujrati");

                                        var tx = data.result[0].__txs__[txid].tx;
                                        console.log("*********tx>>>>>>>>>>>>>>>>>>" + JSON.stringify(tx));

                                        expect(tx.set).to.have.length(3);
                                        expect(tx.set[0].key).to.eql("country");
                                        expect(tx.set[0].value).to.eql("USA");
                                        expect(tx.set[1].key).to.eql("address.city");
                                        expect(tx.set[1].value).to.eql("hisar");
                                        expect(tx.set[2].key).to.eql("languages");
                                        expect(tx.set[2].value).to.have.length(4);

                                        expect(tx.inc).to.have.length(2);
                                        expect(tx.inc[0].key).to.eql("address.lineno");
                                        expect(tx.inc[0].value).to.eql(-12);
                                        expect(tx.inc[1].key).to.eql("score");
                                        expect(tx.inc[1].value).to.eql(-10);


                                        console.log("***********array****************" + JSON.stringify(tx.array.length));
                                        expect(tx.array).to.have.length(5);

                                        console.log("***********array0****************" + JSON.stringify(tx.array[0]));
                                        expect(tx.array[0].field).to.eql("states");
                                        expect(tx.array[0].type).to.eql("update");
                                        expect(tx.array[0]._id).to.eql("jammu");
                                        expect(tx.array[0].inc).to.have.length(1);
                                        expect(tx.array[0].inc[0].key).to.eql("rank");
                                        expect(tx.array[0].inc[0].value).to.eql(-10);
                                        expect(tx.array[0].set).to.have.length(1);
                                        expect(tx.array[0].set[0].key).to.eql("state");
                                        expect(tx.array[0].set[0].value).to.eql("jammu");
                                        console.log("***********array1****************" + JSON.stringify(tx.array[1]));
                                        expect(tx.array[1].field).to.eql("states");
                                        expect(tx.array[1].type).to.eql("update");
                                        expect(tx.array[1]._id).to.eql("himachal");
                                        expect(tx.array[1].inc).to.have.length(1);
                                        expect(tx.array[1].inc[0].key).to.eql("rank");
                                        expect(tx.array[1].inc[0].value).to.eql(-20);
                                        expect(tx.array[1].set).to.have.length(1);
                                        expect(tx.array[1].set[0].key).to.eql("state");
                                        expect(tx.array[1].set[0].value).to.eql("himachal");

                                        expect(tx.array[2].field).to.eql("states");
                                        expect(tx.array[2].type).to.eql("insert");
                                        expect(tx.array[2]._id).to.eql("punjab");
                                        expect(tx.array[2].value.state).to.eql("punjab");
                                        expect(tx.array[2].value._id).to.eql("punjab");
                                        expect(tx.array[2].value.rank).to.eql(4);


                                        expect(tx.array[3].field).to.eql("states");
                                        expect(tx.array[3].type).to.eql("delete");
                                        expect(tx.array[3]._id).to.eql("rajasthan");


                                        expect(tx.array[4].field).to.eql("states");
                                        expect(tx.array[4].type).to.eql("delete");
                                        expect(tx.array[4]._id).to.eql("bihar");


                                        db.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                                            if (err) {
                                                done(err);
                                                return;
                                            }
                                            var transactions =
                                            {_id: "1", txid: "1", updates: [
                                                {tx: {$collection: "countries", $update: [
                                                    {_id: 1}
                                                ]}}
                                            ]};
                                            console.log("data of transaxction>>>" + JSON.stringify(data));
                                            expect(data.result).to.have.length(1);
                                            expect(data.result[0].txid).to.eql(txid);
                                            expect(data.result[0].updates).to.have.length(1);
                                            var txUpdates = data.result[0].updates;
                                            var tx = txUpdates[0].tx;
                                            expect(tx.collection).to.eql("countries");
                                            expect(tx.update._id).to.eql(1);


                                            db.commitTransaction(function (err) {
                                                db.query({$collection: "countries"}, function (err, data) {
                                                    if (err) {
                                                        done(err);
                                                        return;
                                                    }
                                                    console.log("Data after comamit >>>" + JSON.stringify(data));
                                                    expect(data.result).to.have.length(1);
                                                    expect(data.result[0].country).to.eql("India");
                                                    expect(data.result[0].score).to.eql(1010);
                                                    expect(data.result[0].address.city).to.eql("Hisar1");
                                                    expect(data.result[0].address.state).to.eql("haryana");
                                                    expect(data.result[0].address.lineno).to.eql(13);
                                                    expect(data.result[0].states).to.have.length(5);
                                                    expect(data.result[0].states[3].state).to.eql("JK");
                                                    expect(data.result[0].states[1].state).to.eql("delhi");
                                                    expect(data.result[0].states[2].state).to.eql("HP");
                                                    expect(data.result[0].states[4].state).to.eql("rajasthan");
                                                    expect(data.result[0].states[0].state).to.eql("bihar");
                                                    expect(data.result[0].states[3].rank).to.eql(11);
                                                    expect(data.result[0].states[1].rank).to.eql(2);
                                                    expect(data.result[0].states[2].rank).to.eql(23);
                                                    expect(data.result[0].states[4].rank).to.eql(5);
                                                    expect(data.result[0].states[0].rank).to.eql(6);
                                                    expect(data.result[0].languages).to.have.length(2);
                                                    db.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                                                        if (err) {
                                                            done(err);
                                                            return;
                                                        }
                                                        expect(data.result).to.have.length(0);
                                                        done();
                                                    });
                                                });
                                            });
                                        });
                                    });
                                })
                            });
                        })
                    });
                });

            })
        })
        ;
    })
    it("insert operation with object multiple type field override case transaction rollback", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {"$collection": {"collection": "countries", "fields": [
                    {"field": "states", "type": "object", "multiple": true, "fields": [
                        {"field": "state", "type": "string"},
                        {"field": "rank", "type": "number"}
                    ]},
                    {"field": "languages", "type": "object", "multiple": true, "fields": [
                        {"field": "language", "type": "string"}
                    ]}
                ]}, $insert: [
                    {_id: 1, country: "USA", code: "01", "score": 1000, address: {city: "hisar", state: "haryana", "lineno": 1}, states: [
                        {state: "jammu", _id: "jammu", rank: 1},
                        {state: "delhi", _id: "delhi", rank: 2},
                        {state: "himachal", _id: "himachal", rank: 3},
                        {state: "punjab", _id: "punjab", rank: 4}
                    ], languages: [
                        {language: "Hindi"},
                        {language: "English"},
                        {_id: "urdu", language: "Urdu"},
                        {language: "German"}
                    ]}
                ]}
            ];
            db.startTransaction(function (err, txid) {
                if (err) {
                    done(err);
                    return;
                }
                db.batchUpdateById(updates, function (err, result) {
                    if (err) {
                        done(err);
                        return;
                    }
                    db.query({$collection: "countries"}, function (err, data) {
                        if (err) {
                            done(err);
                            return;
                        }
                        console.log("data>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(data));
                        expect(data.result).to.have.length(1);
                        expect(data.result[0].country).to.eql("USA");
                        expect(data.result[0].code).to.eql("01");
                        expect(data.result[0].score).to.eql(1000);
                        expect(data.result[0].address.city).to.eql("hisar");
                        expect(data.result[0].address.state).to.eql("haryana");
                        expect(data.result[0].address.lineno).to.eql(1);
                        expect(data.result[0].address.lineno).to.eql(1);
                        expect(data.result[0].states).to.have.length(4);
                        expect(data.result[0].states[0].state).to.eql("jammu");
                        expect(data.result[0].states[0].rank).to.eql(1);
                        expect(data.result[0].states[1].state).to.eql("delhi");
                        expect(data.result[0].states[1].rank).to.eql(2);
                        expect(data.result[0].states[2].state).to.eql("himachal");
                        expect(data.result[0].states[2].rank).to.eql(3);
                        expect(data.result[0].states[3].state).to.eql("punjab");
                        expect(data.result[0].states[3].rank).to.eql(4);

                        expect(data.result[0].languages).to.have.length(4);
                        expect(data.result[0].languages[0].language).to.eql("Hindi");
                        expect(data.result[0].languages[1].language).to.eql("English");
                        expect(data.result[0].languages[2].language).to.eql("Urdu");
                        expect(data.result[0].languages[3].language).to.eql("German");


                        db.commitTransaction(function (err) {
                            if (err) {
                                done(err);
                                return;
                            }
                            db.startTransaction(function (err, txid) {
                                var update = [
                                    {$collection: {"collection": "countries", "fields": [
                                        {"field": "states", "type": "object", "multiple": true, "fields": [
                                            {"field": "state", "type": "string"},
                                            {"field": "rank", "type": "number"}
                                        ]},
                                        {"field": "languages", "type": "object", "multiple": true, "fields": [
                                            {"field": "language", "type": "string"}
                                        ]}
                                    ]}, $update: [
                                        {_id: 1, $set: {"country": "India", address: {$set: {city: "Hisar1"}, $inc: { lineno: 12}}, states: {$insert: [
                                            {"state": "rajasthan", _id: "rajasthan", rank: 5},
                                            {"state": "bihar", _id: "bihar", rank: 6}
                                        ],
                                            $update: [
                                                {_id: "jammu", $set: {"state": "JK"}, $inc: {rank: 10}},
                                                {_id: "himachal", $set: {"state": "HP"}, $inc: {rank: 20}}
                                            ],
                                            $delete: [
                                                {_id: "punjab"}
                                            ]
                                        }, languages: [
                                            {language: "marathi"},
                                            {language: "gujrati"}
                                        ]
                                        }, $inc: {
                                            score: 10
                                        }
                                        }


                                    ]
                                    }
                                ];
                                db.batchUpdateById(update, function (err, result) {
                                    if (err) {
                                        done(err);
                                        return;
                                    }
                                    db.query({$collection: "countries"}, function (err, data) {
                                        if (err) {
                                            done(err);
                                            return;
                                        }
                                        console.log("data of countries after update>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(data));
                                        expect(data.result).to.have.length(1);
                                        expect(data.result[0].country).to.eql("India");
                                        expect(data.result[0].score).to.eql(1010);
                                        expect(data.result[0].address.city).to.eql("Hisar1");
                                        expect(data.result[0].address.lineno).to.eql(13);
                                        expect(data.result[0].states).to.have.length(5);

                                        expect(data.result[0].states[3].state).to.eql("JK");
                                        expect(data.result[0].states[1].state).to.eql("delhi");
                                        expect(data.result[0].states[2].state).to.eql("HP");
                                        expect(data.result[0].states[4].state).to.eql("rajasthan");
                                        expect(data.result[0].states[0].state).to.eql("bihar");
                                        expect(data.result[0].states[3].rank).to.eql(11);
                                        expect(data.result[0].states[1].rank).to.eql(2);
                                        expect(data.result[0].states[2].rank).to.eql(23);
                                        expect(data.result[0].states[4].rank).to.eql(5);
                                        expect(data.result[0].states[0].rank).to.eql(6);

                                        expect(data.result[0].languages).to.have.length(2);
                                        expect(data.result[0].languages[0].language).to.eql("marathi");
                                        expect(data.result[0].languages[1].language).to.eql("gujrati");

                                        var tx = data.result[0].__txs__[txid].tx;
                                        console.log("*********tx>>>>>>>>>>>>>>>>>>" + JSON.stringify(tx));

                                        expect(tx.set).to.have.length(3);
                                        expect(tx.set[0].key).to.eql("country");
                                        expect(tx.set[0].value).to.eql("USA");
                                        expect(tx.set[1].key).to.eql("address.city");
                                        expect(tx.set[1].value).to.eql("hisar");
                                        expect(tx.set[2].key).to.eql("languages");
                                        expect(tx.set[2].value).to.have.length(4);

                                        expect(tx.inc).to.have.length(2);
                                        expect(tx.inc[0].key).to.eql("address.lineno");
                                        expect(tx.inc[0].value).to.eql(-12);
                                        expect(tx.inc[1].key).to.eql("score");
                                        expect(tx.inc[1].value).to.eql(-10);


                                        console.log("***********array****************" + JSON.stringify(tx.array.length));
                                        expect(tx.array).to.have.length(5);

                                        console.log("***********array0****************" + JSON.stringify(tx.array[0]));
                                        expect(tx.array[0].field).to.eql("states");
                                        expect(tx.array[0].type).to.eql("update");
                                        expect(tx.array[0]._id).to.eql("jammu");
                                        expect(tx.array[0].inc).to.have.length(1);
                                        expect(tx.array[0].inc[0].key).to.eql("rank");
                                        expect(tx.array[0].inc[0].value).to.eql(-10);
                                        expect(tx.array[0].set).to.have.length(1);
                                        expect(tx.array[0].set[0].key).to.eql("state");
                                        expect(tx.array[0].set[0].value).to.eql("jammu");
                                        console.log("***********array1****************" + JSON.stringify(tx.array[1]));
                                        expect(tx.array[1].field).to.eql("states");
                                        expect(tx.array[1].type).to.eql("update");
                                        expect(tx.array[1]._id).to.eql("himachal");
                                        expect(tx.array[1].inc).to.have.length(1);
                                        expect(tx.array[1].inc[0].key).to.eql("rank");
                                        expect(tx.array[1].inc[0].value).to.eql(-20);
                                        expect(tx.array[1].set).to.have.length(1);
                                        expect(tx.array[1].set[0].key).to.eql("state");
                                        expect(tx.array[1].set[0].value).to.eql("himachal");
                                        console.log("***********array2****************" + JSON.stringify(tx.array[2]));
                                        expect(tx.array[2].field).to.eql("states");
                                        expect(tx.array[2].type).to.eql("insert");
                                        expect(tx.array[2]._id).to.eql("punjab");
                                        expect(tx.array[2].value.state).to.eql("punjab");
                                        expect(tx.array[2].value._id).to.eql("punjab");
                                        expect(tx.array[2].value.rank).to.eql(4);

                                        console.log("***********array3****************" + JSON.stringify(tx.array[3]));
                                        expect(tx.array[3].field).to.eql("states");
                                        expect(tx.array[3].type).to.eql("delete");
                                        expect(tx.array[3]._id).to.eql("rajasthan");

                                        console.log("***********array4****************" + JSON.stringify(tx.array[4]));
                                        expect(tx.array[4].field).to.eql("states");
                                        expect(tx.array[4].type).to.eql("delete");
                                        expect(tx.array[4]._id).to.eql("bihar");


                                        db.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                                            if (err) {
                                                done(err);
                                                return;
                                            }
                                            var transactions =
                                            {_id: "1", txid: "1", updates: [
                                                {tx: {$collection: "countries", $update: [
                                                    {_id: 1}
                                                ]}}
                                            ]};
                                            console.log("data of transaxction>>>" + JSON.stringify(data));
                                            expect(data.result).to.have.length(1);
                                            expect(data.result[0].txid).to.eql(txid);
                                            expect(data.result[0].updates).to.have.length(1);
                                            var txUpdates = data.result[0].updates;
                                            var tx = txUpdates[0].tx;
                                            expect(tx.collection).to.eql("countries");
                                            expect(tx.update._id).to.eql(1);


                                            db.rollbackTransaction(function (err) {
                                                db.query({$collection: "countries"}, function (err, data) {
                                                    if (err) {
                                                        done(err);
                                                        return;
                                                    }
                                                    console.log("Data after rollback >>>" + JSON.stringify(data));
                                                    expect(data.result).to.have.length(1);
                                                    expect(data.result[0].country).to.eql("USA");
                                                    expect(data.result[0].code).to.eql("01");
                                                    expect(data.result[0].score).to.eql(1000);
                                                    expect(data.result[0].address.city).to.eql("hisar");
                                                    expect(data.result[0].address.state).to.eql("haryana");
                                                    expect(data.result[0].address.lineno).to.eql(1);
                                                    expect(data.result[0].address.lineno).to.eql(1);
                                                    expect(data.result[0].states).to.have.length(4);
                                                    expect(data.result[0].states[2].state).to.eql("jammu");
                                                    expect(data.result[0].states[2].rank).to.eql(1);
                                                    expect(data.result[0].states[0].state).to.eql("delhi");
                                                    expect(data.result[0].states[0].rank).to.eql(2);
                                                    expect(data.result[0].states[1].state).to.eql("himachal");
                                                    expect(data.result[0].states[1].rank).to.eql(3);
                                                    expect(data.result[0].states[3].state).to.eql("punjab");
                                                    expect(data.result[0].states[3].rank).to.eql(4);

                                                    expect(data.result[0].languages).to.have.length(4);
                                                    expect(data.result[0].languages[0].language).to.eql("Hindi");
                                                    expect(data.result[0].languages[1].language).to.eql("English");
                                                    expect(data.result[0].languages[2].language).to.eql("Urdu");
                                                    expect(data.result[0].languages[3].language).to.eql("German");

                                                    db.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                                                        if (err) {
                                                            done(err);
                                                            return;
                                                        }
                                                        expect(data.result).to.have.length(0);
                                                        done();
                                                    });
                                                });
                                            });
                                        });
                                    });
                                })
                            });
                        })
                    });
                });

            })
        })
        ;
    })

    it("upsert operation transaction commit", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {$collection: {collection: "cities", fields: [
                    {field: "city", type: "string"},
                    {field: "state", type: "fk", upsert: true, set: ["state", "country"], collection: {"collection": "states", fields: [
                        {field: "country", type: "fk", set: ["country"], upsert: true, collection: {"collection": "countries"}}
                    ]}}
                ]}, $insert: [
                    {_id: 1, city: "hisar", state: {$query: {_id: "haryana"}, $set: {"state": "haryana", country: {"$query": {_id: "india"}, $set: {country: "india"}}}}}
                ]
                }
            ];
            db.startTransaction(function (err, txid) {
                if (err) {
                    done(err);
                    return;
                }
                db.batchUpdateById(updates, function (err, result) {
                    if (err) {
                        done(err);
                        return;
                    }
                    db.query({$collection: "cities"}, function (err, data) {
                        if (err) {
                            done(err);
                            return;
                        }
                        console.log("cites data after insert>>>>" + JSON.stringify(data));
                        expect(data.result).to.have.length(1);
                        expect(data.result[0].city).to.eql("hisar");
                        expect(data.result[0].state.state).to.eql("haryana");
                        expect(data.result[0].state.country.country).to.eql("india");
                        var recordTxid = data.result[0].txid;
                        db.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                            if (err) {
                                done(err);
                                return;
                            }
                            /*
                             * expected transaction entry in __txs__ collection
                             * */

                            var transactions =
                            {_id: "1", txid: "1", updates: [
                                {tx: {$collection: "countries", $delete: [
                                    {_id: "india"}
                                ]}},
                                {tx: {$collection: "states", $delete: [
                                    {_id: "haryana"}
                                ]}} ,
                                {tx: {$collection: "cities", $delete: [
                                    {_id: "hisar"}
                                ]}}
                            ]};
                            console.log("transaction after update>>>>>>" + JSON.stringify(data));

                            expect(data.result).to.have.length(1);
                            expect(data.result[0].txid).to.eql(txid);
                            expect(data.result[0].updates).to.have.length(3);

                            var tx = data.result[0].updates[2].tx;
                            expect(tx.collection).to.eql("cities");
//                            expect(tx.delete._id).to.eql(1);

                            var tx = data.result[0].updates[1].tx;
                            expect(tx.collection).to.eql("states");
//                            expect(tx.delete._id).to.eql("haryana");

                            var tx = data.result[0].updates[0].tx;
                            expect(tx.collection).to.eql("countries");
//                            expect(tx.delete._id).to.eql("india");


                            db.commitTransaction(function (err) {
                                db.query({$collection: "cities"}, function (err, data) {
                                    if (err) {
                                        done(err);
                                        return;
                                    }
                                    expect(data.result).to.have.length(1);
                                    expect(data.result[0].city).to.eql("hisar");
                                    expect(data.result[0].state.state).to.eql("haryana");
                                    expect(data.result[0].state.country.country).to.eql("india");
                                    db.query({$collection: "states"}, function (err, data) {
                                        if (err) {
                                            done(err);
                                            return;
                                        }
                                        expect(data.result).to.have.length(1);
                                        expect(data.result[0].state).to.eql("haryana");
                                        db.query({$collection: "countries"}, function (err, data) {
                                            if (err) {
                                                done(err);
                                                return;
                                            }
                                            expect(data.result).to.have.length(1);
                                            expect(data.result[0].country).to.eql("india");

                                            db.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                                                if (err) {
                                                    done(err);
                                                    return;
                                                }
                                                expect(data.result).to.have.length(0);
                                                done();
                                            });
                                        });
                                    });
                                });
                            })
                        });
                    });
                });

            })


        });
    });
    it("upsert operation transaction rollback", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {$collection: {collection: "cities", fields: [
                    {field: "city", type: "string"},
                    {field: "state", type: "fk", upsert: true, set: ["state", "country"], collection: {"collection": "states", fields: [
                        {field: "country", type: "fk", set: ["country"], upsert: true, collection: {"collection": "countries"}}
                    ]}}
                ]}, $insert: [
                    {_id: 1, city: "hisar", state: {$query: {_id: "haryana"}, $set: {"state": "haryana", country: {"$query": {_id: "india"}, $set: {country: "india"}}}}}
                ]
                }
            ];
            db.startTransaction(function (err, txid) {
                if (err) {
                    done(err);
                    return;
                }
                db.batchUpdateById(updates, function (err, result) {
                    if (err) {
                        done(err);
                        return;
                    }
                    db.query({$collection: "cities"}, function (err, data) {
                        if (err) {
                            done(err);
                            return;
                        }
                        console.log("cites data after insert>>>>" + JSON.stringify(data));
                        expect(data.result).to.have.length(1);
                        expect(data.result[0].city).to.eql("hisar");
                        expect(data.result[0].state.state).to.eql("haryana");
                        expect(data.result[0].state.country.country).to.eql("india");
                        db.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                            if (err) {
                                done(err);
                                return;
                            }
                            /*
                             * expected transaction entry in __txs__ collection
                             * */

                            var transactions =
                            {_id: "1", txid: "1", updates: [
                                {tx: {$collection: "countries", $delete: [
                                    {_id: "india"}
                                ]}},
                                {tx: {$collection: "states", $delete: [
                                    {_id: "haryana"}
                                ]}} ,
                                {tx: {$collection: "cities", $delete: [
                                    {_id: "hisar"}
                                ]}}
                            ]};
                            console.log("transaction after update>>>>>>" + JSON.stringify(data));

                            expect(data.result).to.have.length(1);
                            expect(data.result[0].txid).to.eql(txid);
                            expect(data.result[0].updates).to.have.length(3);

                            var tx = data.result[0].updates[2].tx;
                            expect(tx.collection).to.eql("cities");
//                            expect(tx.delete._id).to.eql(1);

                            var tx = data.result[0].updates[1].tx;
                            expect(tx.collection).to.eql("states");
//                            expect(tx.delete._id).to.eql("haryana");

                            var tx = data.result[0].updates[0].tx;
                            expect(tx.collection).to.eql("countries");
//                            expect(tx.delete._id).to.eql("india");


                            db.rollbackTransaction(function (err) {
                                db.query({$collection: "cities"}, function (err, data) {
                                    if (err) {
                                        done(err);
                                        return;
                                    }
                                    expect(data.result).to.have.length(0);
                                    db.query({$collection: "states"}, function (err, data) {
                                        if (err) {
                                            done(err);
                                            return;
                                        }
                                        expect(data.result).to.have.length(0);
                                        db.query({$collection: "countries"}, function (err, data) {
                                            if (err) {
                                                done(err);
                                                return;
                                            }
                                            expect(data.result).to.have.length(0);

                                            db.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                                                if (err) {
                                                    done(err);
                                                    return;
                                                }
                                                expect(data.result).to.have.length(0);
                                                done();
                                            });
                                        });
                                    });
                                });
                            })
                        });
                    });
                });

            })


        });
    });

// array
    it.skip("insert and delete from  2 instances of same db one commit and one  rollback", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {$collection: "countries", $insert: [
                    {_id: 1, country: "india", rank: 22, states: [
                        {"_id": "haryana", state: "haryana"},
                        {"_id": "punjab", state: "punjab"},
                        {"_id": "bihar", state: "bihar"}
                    ]}
                ]}
            ];
            db.startTransaction(function (err, txid) {
                db.batchUpdateById(updates, function (err, result) {
                    if (err) {
                        done(err);
                        return;
                    }
                    db.query({$collection: "countries"}, function (err, data) {
                        if (err) {
                            done(err);
                            return;
                        }
                        expect(data.result).to.have.length(1);
                        expect(data.result[0].country).to.eql("india");
                        expect(data.result[0].rank).to.eql(22);
                        expect(data.result[0].states).to.have.length(3);
                        expect(data.result[0].states[0].state).to.eql("haryana");
                        expect(data.result[0].states[1].state).to.eql("punjab");
                        expect(data.result[0].states[2].state).to.eql("bihar");


                        db.commitTransaction(function (err) {
                            if (err) {
                                done(err);
                                return;
                            }
                            ApplaneDB.connect(Config.URL, Config.DB, function (err, db1) {
                                if (err) {
                                    done(err);
                                    return;
                                }
                                var update = [
                                    {$collection: "countries", $update: [
                                        {_id: 1, $set: {states: {$insert: [
                                            {state: "jammu", _id: "jammu"},
                                            {state: "gujrat", _id: "gujrat"}
                                        ], $delete: [
                                            {_id: "bihar"}
                                        ]}}}
                                    ]}
                                ];
                                db1.startTransaction(function (err, txid) {
                                    if (err) {
                                        done(err);
                                        return;
                                    }
                                    db1.batchUpdateById(update, function (err, result) {
                                        if (err) {
                                            done(err);
                                            return;
                                        }
                                        db1.query({$collection: "countries"}, function (err, data) {
                                            if (err) {
                                                done(err);
                                                return;
                                            }
                                            expect(data.result).to.have.length(1);
                                            expect(data.result[0].states).to.eql(4);


                                            var expectedUpdates = [
                                                {$collection: "countries", $update: [
                                                    {_id: 1, $set: {states: {$insert: [
                                                        {state: "jammu", _id: "jammu"},
                                                        {state: "gujrat", _id: "gujrat"}
                                                    ], $delete: [
                                                        {_id: "bihar"}
                                                    ]}}}
                                                ], $push: {__txs__: {$each: [
                                                    {txid: txid, tx: {_id: 1, $set: {states: {$insert: [
                                                        {_id: "bihar", state: "bihar"}
                                                    ], $delete: [
                                                        {_id: "gujrat"},
                                                        {_id: "jammu"}
                                                    ]}}}}
                                                ]}}}
                                            ];


                                            expect(data.result[0].__txs__).to.have.length(1);
                                            expect(data.result[0].__txs__[0].txid).to.eql(txid);
                                            var tx = JSON.parse(data.result[0].__txs__[0].tx);
                                            expect(tx._id).to.eql(1);
                                            expect(tx.$set.states.$insert).to.have.length(1);
                                            expect(tx.$set.states.$insert[0]._id).to.eql("bihar");
                                            expect(tx.$set.states.$insert[0].state).to.eql("bihar");
                                            expect(tx.$set.states.$delete).to.have.length(2);
                                            expect(tx.$set.states.$delete[0]._id).to.eql("gujart");
                                            expect(tx.$set.states.$delete[1]._id).to.eql("jammu");

                                            db1.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                                                if (err) {
                                                    done(err);
                                                    return;
                                                }

                                                var expectedTransactions =
                                                {_id: "1", txid: txid, updates: [
                                                    {tx: {$collection: "countries", $update: [
                                                        {_id: 1}
                                                    ]}}
                                                ]};
                                                expect(data.result).to.have.length(1);
                                                expect(data.result[0].txid).to.eql(txid);
                                                expect(data.result[0].updates).to.have.length(1);
                                                var txUpdates = data.result[0].updates;
                                                var tx = JSON.parse(txUpdates[0].tx);
                                                expect(tx.$collection).to.eql("countries");
                                                expect(tx.$update).to.have.length(1);
                                                expect(tx.$update[0]._id).to.eql(1);
                                                ApplaneDB.connect(Config.URL, Config.DB, function (err, db2) {
                                                    if (err) {
                                                        done(err);
                                                        return;
                                                    }
                                                    db2.startTransaction(function (err, txid2) {
                                                        if (err) {
                                                            done(err);
                                                            return;
                                                        }
                                                        var newUpdate = [
                                                            {$collection: "countries", $update: [
                                                                {_id: 1, $set: {states: {$insert: [
                                                                    {_id: "chennai", state: "chennai"},
                                                                    {_id: "mumbai", state: "mumbai"}
                                                                ], $delete: [
                                                                    {_id: "punjab"}
                                                                ]}}}
                                                            ]}
                                                        ];

                                                        db2.batchUpdateById(newUpdate, function (err, result) {
                                                            if (err) {
                                                                done(err);
                                                                return;
                                                            }
                                                            db2.query({$collection: "countries"}, function (err, data) {
                                                                if (err) {
                                                                    done(err);
                                                                    return;
                                                                }
                                                                expect(data.result).to.have.length(1);
                                                                expect(data.result[0].states).to.eql(5);

                                                                var expectedUpdates = [
                                                                    {$collection: "countries", $update: [
                                                                        {_id: 1, $set: {states: {$insert: [
                                                                            {_id: "chennai", state: "chennai"},
                                                                            {_id: "mumbai", state: "mumbai"}
                                                                        ], $delete: [
                                                                            {_id: "punjab"}
                                                                        ]}}}
                                                                    ], $push: {__txs__: {$each: [
                                                                        {txid: txid, tx: {_id: 1, $set: {states: {$insert: [
                                                                            {_id: "punjab", state: "punjab"}
                                                                        ], $delete: [
                                                                            {_id: "chennai"},
                                                                            {_id: "mumbai"}
                                                                        ]}}}}
                                                                    ]}}}
                                                                ];


                                                                expect(data.result[0].__txs__).to.have.length(2);
                                                                expect(data.result[0].__txs__[1].txid).to.eql(txid2);
                                                                var tx = JSON.parse(data.result[0].__txs__[1].tx);
                                                                expect(tx._id).to.eql(1);
                                                                expect(tx.$set.states.$insert).to.have.length(1);
                                                                expect(tx.$set.states.$insert[0]._id).to.eql("punjab");
                                                                expect(tx.$set.states.$insert[0].state).to.eql("punjab");
                                                                expect(tx.$set.states.$delete).to.have.length(2);
                                                                expect(tx.$set.states.$delete[0]._id).to.eql("chennai");
                                                                expect(tx.$set.states.$delete[1]._id).to.eql("mumbai");


                                                                db2.query({$collection: "pl.txs", $filter: {"_id": txid2}}, function (err, data) {
                                                                    if (err) {
                                                                        done(err);
                                                                        return;
                                                                    }
                                                                    var transactions =
                                                                    {_id: "1", txid: txid, updates: [
                                                                        {tx: {$collection: "countries", $update: [
                                                                            {_id: 1}
                                                                        ]}}
                                                                    ]};

                                                                    expect(data.result).to.have.length(2);
                                                                    expect(data.result[1].txid).to.eql(txid2);
                                                                    expect(data.result[1].updates).to.have.length(1);
                                                                    var txUpdates = data.result[1].updates;
                                                                    var tx = JSON.parse(txUpdates[0].tx);
                                                                    expect(tx.$collection).to.eql("countries");
                                                                    expect(tx.$update).to.have.length(1);
                                                                    expect(tx.$update[0]._id).to.eql(1);


                                                                    db1.commitTransaction(function (err) {
                                                                        if (err) {
                                                                            done(err);
                                                                            return;
                                                                        }
                                                                        db1.query({$collection: "countries"}, function (err, data) {
                                                                            if (err) {
                                                                                done(err);
                                                                                return;
                                                                            }
                                                                            expect(data.result).to.have.length(1);
                                                                            expect(data.result[0].states).to.have.length(4);
                                                                            db2.query({$collection: "pl.txs", $filter: {"_id": txid2}}, function (err, data) {
                                                                                if (err) {
                                                                                    done(err);
                                                                                    return;
                                                                                }
                                                                                expect(data.result).to.have.length(0);
                                                                                expect(data.result[0].states).to.have.length(4);
                                                                                expect(data.result[0].states[0].state).to.eql("haryana")
                                                                                expect(data.result[0].states[1].state).to.eql("punjab")
                                                                                expect(data.result[0].states[2].state).to.eql("gujrat")
                                                                                expect(data.result[0].states[3].state).to.eql("jammu")
                                                                                db2.rollbackTransaction(function (err) {
                                                                                    if (err) {
                                                                                        done(err);
                                                                                        return;
                                                                                    }
                                                                                    db2.query({$collection: "countries"}, function (err, data) {
                                                                                        if (err) {
                                                                                            done(err);
                                                                                            return;
                                                                                        }
                                                                                        expect(data.result).to.have.length(1);
                                                                                        expect(data.result[0].states).to.have.length(4);
                                                                                        expect(data.result[0].states[0].state).to.eql("haryana")
                                                                                        expect(data.result[0].states[1].state).to.eql("punjab")
                                                                                        expect(data.result[0].states[2].state).to.eql("gujrat")
                                                                                        expect(data.result[0].states[3].state).to.eql("jammu")


                                                                                        db2.query({$collection: "pl.txs", $filter: {"_id": txid2}}, function (err, data) {
                                                                                            if (err) {
                                                                                                done(err);
                                                                                                return;
                                                                                            }
                                                                                            expect(data.result).to.have.length(0);
                                                                                        });
                                                                                    });
                                                                                });
                                                                            });
                                                                        });


                                                                    })
                                                                });
                                                            })
                                                        });

                                                    });
                                                });
                                            });
                                        });
                                    })
                                })
                            });
                        });
                    });
                })
            });
        });
    });

// array
    it.skip("insert and delete  2 instances of same db both commit", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {$collection: "countries", $insert: [
                    {_id: 1, country: "india", rank: 22, states: [
                        {"_id": "haryana", state: "haryana"},
                        {"_id": "punjab", state: "punjab"},
                        {"_id": "bihar", state: "bihar"}
                    ]}
                ]}
            ];
            db.startTransaction(function (err, txid) {
                db.batchUpdateById(updates, function (err, result) {
                    if (err) {
                        done(err);
                        return;
                    }
                    db.query({$collection: "countries"}, function (err, data) {
                        if (err) {
                            done(err);
                            return;
                        }
                        expect(data.result).to.have.length(1);
                        expect(data.result[0].country).to.eql("india");
                        expect(data.result[0].rank).to.eql(22);
                        expect(data.result[0].states).to.have.length(3);
                        expect(data.result[0].states[0].state).to.eql("haryana");
                        expect(data.result[0].states[1].state).to.eql("punjab");
                        expect(data.result[0].states[2].state).to.eql("bihar");


                        db.commitTransaction(function (err) {
                            if (err) {
                                done(err);
                                return;
                            }
                            ApplaneDB.connect(Config.URL, Config.DB, function (err, db1) {
                                if (err) {
                                    done(err);
                                    return;
                                }
                                var update = [
                                    {$collection: "countries", $update: [
                                        {_id: 1, $set: {states: {$insert: [
                                            {state: "jammu", _id: "jammu"},
                                            {state: "gujrat", _id: "gujrat"}
                                        ], $delete: [
                                            {_id: "bihar"}
                                        ]}}}
                                    ]}
                                ];
                                db1.startTransaction(function (err, txid) {
                                    if (err) {
                                        done(err);
                                        return;
                                    }
                                    db1.batchUpdateById(update, function (err, result) {
                                        if (err) {
                                            done(err);
                                            return;
                                        }
                                        db1.query({$collection: "countries"}, function (err, data) {
                                            if (err) {
                                                done(err);
                                                return;
                                            }
                                            expect(data.result).to.have.length(1);
                                            expect(data.result[0].states).to.eql(4);


                                            var expectedUpdates = [
                                                {$collection: "countries", $update: [
                                                    {_id: 1, $set: {states: {$insert: [
                                                        {state: "jammu", _id: "jammu"},
                                                        {state: "gujrat", _id: "gujrat"}
                                                    ], $delete: [
                                                        {_id: "bihar"}
                                                    ]}}}
                                                ], $push: {__txs__: {$each: [
                                                    {txid: txid, tx: {_id: 1, $set: {states: {$insert: [
                                                        {_id: "bihar", state: "bihar"}
                                                    ], $delete: [
                                                        {_id: "jammu"},
                                                        {_id: "gujrat"}
                                                    ]}}}}
                                                ]}}}
                                            ];


                                            expect(data.result[0].__txs__).to.have.length(1);
                                            expect(data.result[0].__txs__[0].txid).to.eql(txid);
                                            var tx = JSON.parse(data.result[0].__txs__[0].tx);
                                            expect(tx._id).to.eql(1);
                                            expect(tx.$set.states.$insert).to.have.length(1);
                                            expect(tx.$set.states.$insert[0]._id).to.eql("bihar");
                                            expect(tx.$set.states.$insert[0].state).to.eql("bihar");
                                            expect(tx.$set.states.$delete).to.have.length(2);
                                            expect(tx.$set.states.$delete[1]._id).to.eql("gujart");
                                            expect(tx.$set.states.$delete[0]._id).to.eql("jammu");

                                            db1.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                                                if (err) {
                                                    done(err);
                                                    return;
                                                }

                                                var expectedTransactions =
                                                {_id: "1", txid: txid, updates: [
                                                    {tx: {$collection: "countries", $update: [
                                                        {_id: 1}
                                                    ]}}
                                                ]};
                                                expect(data.result).to.have.length(1);
                                                expect(data.result[0].txid).to.eql(txid);
                                                expect(data.result[0].updates).to.have.length(1);
                                                var txUpdates = data.result[0].updates;
                                                var tx = JSON.parse(txUpdates[0].tx);
                                                expect(tx.$collection).to.eql("countries");
                                                expect(tx.$update).to.have.length(1);
                                                expect(tx.$update[0]._id).to.eql(1);
                                                ApplaneDB.connect(Config.URL, Config.DB, function (err, db2) {
                                                    if (err) {
                                                        done(err);
                                                        return;
                                                    }
                                                    db2.startTransaction(function (err, txid2) {
                                                        if (err) {
                                                            done(err);
                                                            return;
                                                        }
                                                        var newUpdate = [
                                                            {$collection: "countries", $update: [
                                                                {_id: 1, $set: {states: {$insert: [
                                                                    {_id: "chennai", state: "chennai"},
                                                                    {_id: "mumbai", state: "mumbai"}
                                                                ], $delete: [
                                                                    {_id: "punjab"}
                                                                ]}}}
                                                            ]}
                                                        ];

                                                        db2.batchUpdateById(newUpdate, function (err, result) {
                                                            if (err) {
                                                                done(err);
                                                                return;
                                                            }
                                                            db2.query({$collection: "countries"}, function (err, data) {
                                                                if (err) {
                                                                    done(err);
                                                                    return;
                                                                }
                                                                expect(data.result).to.have.length(1);
                                                                expect(data.result[0].states).to.eql(5);

                                                                var expectedUpdates = [
                                                                    {$collection: "countries", $update: [
                                                                        {_id: 1, $set: {states: {$insert: [
                                                                            {_id: "chennai", state: "chennai"},
                                                                            {_id: "mumbai", state: "mumbai"}
                                                                        ], $delete: [
                                                                            {_id: "punjab"}
                                                                        ]}}}
                                                                    ], $push: {__txs__: {$each: [
                                                                        {txid: txid, tx: {_id: 1, $set: {states: {$insert: [
                                                                            {_id: "punjab", state: "punjab"}
                                                                        ], $delete: [
                                                                            {_id: "chennai"},
                                                                            {_id: "mumbai"}
                                                                        ]}}}}
                                                                    ]}}}
                                                                ];


                                                                expect(data.result[0].__txs__).to.have.length(2);
                                                                expect(data.result[0].__txs__[1].txid).to.eql(txid2);
                                                                var tx = JSON.parse(data.result[0].__txs__[1].tx);
                                                                expect(tx._id).to.eql(1);
                                                                expect(tx.$set.states.$insert).to.have.length(1);
                                                                expect(tx.$set.states.$insert[0]._id).to.eql("punjab");
                                                                expect(tx.$set.states.$insert[0].state).to.eql("punjab");
                                                                expect(tx.$set.states.$delete).to.have.length(2);
                                                                expect(tx.$set.states.$delete[0]._id).to.eql("chennai");
                                                                expect(tx.$set.states.$delete[1]._id).to.eql("mumbai");


                                                                db2.query({$collection: "pl.txs", $filter: {"_id": txid2}}, function (err, data) {
                                                                    if (err) {
                                                                        done(err);
                                                                        return;
                                                                    }
                                                                    var transactions =
                                                                    {_id: "1", txid: txid, updates: [
                                                                        {tx: {$collection: "countries", $update: [
                                                                            {_id: 1}
                                                                        ]}}
                                                                    ]};

                                                                    expect(data.result).to.have.length(2);
                                                                    expect(data.result[1].txid).to.eql(txid2);
                                                                    expect(data.result[1].updates).to.have.length(1);
                                                                    var txUpdates = data.result[1].updates;
                                                                    var tx = JSON.parse(txUpdates[0].tx);
                                                                    expect(tx.$collection).to.eql("countries");
                                                                    expect(tx.$update).to.have.length(1);
                                                                    expect(tx.$update[0]._id).to.eql(1);


                                                                    db1.commitTransaction(function (err) {
                                                                        if (err) {
                                                                            done(err);
                                                                            return;
                                                                        }
                                                                        db1.query({$collection: "countries"}, function (err, data) {
                                                                            if (err) {
                                                                                done(err);
                                                                                return;
                                                                            }
                                                                            expect(data.result).to.have.length(1);
                                                                            expect(data.result[0].states).to.have.length(4);
                                                                            db2.query({$collection: "pl.txs", $filter: {"_id": txid2}}, function (err, data) {
                                                                                if (err) {
                                                                                    done(err);
                                                                                    return;
                                                                                }
                                                                                expect(data.result).to.have.length(0);
                                                                                expect(data.result[0].states).to.have.length(4);
                                                                                expect(data.result[0].states[0].state).to.eql("haryana")
                                                                                expect(data.result[0].states[1].state).to.eql("punjab")
                                                                                expect(data.result[0].states[3].state).to.eql("gujrat")
                                                                                expect(data.result[0].states[2].state).to.eql("jammu")
                                                                                db2.commitTransaction(function (err) {
                                                                                    if (err) {
                                                                                        done(err);
                                                                                        return;
                                                                                    }
                                                                                    db2.query({$collection: "countries"}, function (err, data) {
                                                                                        if (err) {
                                                                                            done(err);
                                                                                            return;
                                                                                        }
                                                                                        expect(data.result).to.have.length(1);
                                                                                        expect(data.result[0].states).to.have.length(5);
                                                                                        expect(data.result[0].states[0].state).to.eql("haryana")
                                                                                        expect(data.result[0].states[2].state).to.eql("gujrat")
                                                                                        expect(data.result[0].states[1].state).to.eql("jammu")
                                                                                        expect(data.result[0].states[3].state).to.eql("chennai")
                                                                                        expect(data.result[0].states[4].state).to.eql("mumbai")


                                                                                        db2.query({$collection: "pl.txs", $filter: {"_id": txid2}}, function (err, data) {
                                                                                            if (err) {
                                                                                                done(err);
                                                                                                return;
                                                                                            }
                                                                                            expect(data.result).to.have.length(0);
                                                                                        });
                                                                                    });
                                                                                });
                                                                            });
                                                                        });


                                                                    })
                                                                });
                                                            })
                                                        });

                                                    });
                                                });
                                            });
                                        });
                                    })
                                })
                            });
                        });
                    });
                })
            });
        });
    });

// array
    it.skip("insert and delete  2 instances of same db both rollback", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {$collection: "countries", $insert: [
                    {_id: 1, country: "india", rank: 22, states: [
                        {"_id": "haryana", state: "haryana"},
                        {"_id": "punjab", state: "punjab"},
                        {"_id": "bihar", state: "bihar"}
                    ]}
                ]}
            ];
            db.startTransaction(function (err, txid) {
                db.batchUpdateById(updates, function (err, result) {
                    if (err) {
                        done(err);
                        return;
                    }
                    db.query({$collection: "countries"}, function (err, data) {
                        if (err) {
                            done(err);
                            return;
                        }
                        expect(data.result).to.have.length(1);
                        expect(data.result[0].country).to.eql("india");
                        expect(data.result[0].rank).to.eql(22);
                        expect(data.result[0].states).to.have.length(3);
                        expect(data.result[0].states[0].state).to.eql("haryana");
                        expect(data.result[0].states[1].state).to.eql("punjab");
                        expect(data.result[0].states[2].state).to.eql("bihar");


                        db.commitTransaction(function (err) {
                            if (err) {
                                done(err);
                                return;
                            }
                            ApplaneDB.connect(Config.URL, Config.DB, function (err, db1) {
                                if (err) {
                                    done(err);
                                    return;
                                }
                                var update = [
                                    {$collection: "countries", $update: [
                                        {_id: 1, $set: {states: {$insert: [
                                            {state: "jammu", _id: "jammu"},
                                            {state: "gujrat", _id: "gujrat"}
                                        ], $delete: [
                                            {_id: "bihar"}
                                        ]}}}
                                    ]}
                                ];
                                db1.startTransaction(function (err, txid) {
                                    if (err) {
                                        done(err);
                                        return;
                                    }
                                    db1.batchUpdateById(update, function (err, result) {
                                        if (err) {
                                            done(err);
                                            return;
                                        }
                                        db1.query({$collection: "countries"}, function (err, data) {
                                            if (err) {
                                                done(err);
                                                return;
                                            }
                                            expect(data.result).to.have.length(1);
                                            expect(data.result[0].states).to.eql(4);


                                            var expectedUpdates = [
                                                {$collection: "countries", $update: [
                                                    {_id: 1, $set: {states: {$insert: [
                                                        {state: "jammu", _id: "jammu"},
                                                        {state: "gujrat", _id: "gujrat"}
                                                    ], $delete: [
                                                        {_id: "bihar"}
                                                    ]}}}
                                                ], $push: {__txs__: {$each: [
                                                    {txid: txid, tx: {_id: 1, $set: {states: {$insert: [
                                                        {_id: "bihar", state: "bihar"}
                                                    ], $delete: [
                                                        {_id: "gujrat"},
                                                        {_id: "jammu"}
                                                    ]}}}}
                                                ]}}}
                                            ];


                                            expect(data.result[0].__txs__).to.have.length(1);
                                            expect(data.result[0].__txs__[0].txid).to.eql(txid);
                                            var tx = JSON.parse(data.result[0].__txs__[0].tx);
                                            expect(tx._id).to.eql(1);
                                            expect(tx.$set.states.$insert).to.have.length(1);
                                            expect(tx.$set.states.$insert[0]._id).to.eql("bihar");
                                            expect(tx.$set.states.$insert[0].state).to.eql("bihar");
                                            expect(tx.$set.states.$delete).to.have.length(2);
                                            expect(tx.$set.states.$delete[1]._id).to.eql("gujart");
                                            expect(tx.$set.states.$delete[0]._id).to.eql("jammu");

                                            db1.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                                                if (err) {
                                                    done(err);
                                                    return;
                                                }

                                                var expectedTransactions =
                                                {_id: "1", txid: txid, updates: [
                                                    {tx: {$collection: "countries", $update: [
                                                        {_id: 1}
                                                    ]}}
                                                ]};
                                                expect(data.result).to.have.length(1);
                                                expect(data.result[0].txid).to.eql(txid);
                                                expect(data.result[0].updates).to.have.length(1);
                                                var txUpdates = data.result[0].updates;
                                                var tx = JSON.parse(txUpdates[0].tx);
                                                expect(tx.$collection).to.eql("countries");
                                                expect(tx.$update).to.have.length(1);
                                                expect(tx.$update[0]._id).to.eql(1);
                                                ApplaneDB.connect(Config.URL, Config.DB, function (err, db2) {
                                                    if (err) {
                                                        done(err);
                                                        return;
                                                    }
                                                    db2.startTransaction(function (err, txid2) {
                                                        if (err) {
                                                            done(err);
                                                            return;
                                                        }
                                                        var newUpdate = [
                                                            {$collection: "countries", $update: [
                                                                {_id: 1, $set: {states: {$insert: [
                                                                    {_id: "chennai", state: "chennai"},
                                                                    {_id: "mumbai", state: "mumbai"}
                                                                ], $delete: [
                                                                    {_id: "punjab"}
                                                                ]}}}
                                                            ]}
                                                        ];

                                                        db2.batchUpdateById(newUpdate, function (err, result) {
                                                            if (err) {
                                                                done(err);
                                                                return;
                                                            }
                                                            db2.query({$collection: "countries"}, function (err, data) {
                                                                if (err) {
                                                                    done(err);
                                                                    return;
                                                                }
                                                                expect(data.result).to.have.length(1);
                                                                expect(data.result[0].states).to.eql(5);

                                                                var expectedUpdates = [
                                                                    {$collection: "countries", $update: [
                                                                        {_id: 1, $set: {states: {$insert: [
                                                                            {_id: "chennai", state: "chennai"},
                                                                            {_id: "mumbai", state: "mumbai"}
                                                                        ], $delete: [
                                                                            {_id: "punjab"}
                                                                        ]}}}
                                                                    ], $push: {__txs__: {$each: [
                                                                        {txid: txid, tx: {_id: 1, $set: {states: {$insert: [
                                                                            {_id: "punjab", state: "punjab"}
                                                                        ], $delete: [
                                                                            {_id: "chennai"},
                                                                            {_id: "mumbai"}
                                                                        ]}}}}
                                                                    ]}}}
                                                                ];


                                                                expect(data.result[0].__txs__).to.have.length(2);
                                                                expect(data.result[0].__txs__[1].txid).to.eql(txid2);
                                                                var tx = JSON.parse(data.result[0].__txs__[1].tx);
                                                                expect(tx._id).to.eql(1);
                                                                expect(tx.$set.states.$insert).to.have.length(1);
                                                                expect(tx.$set.states.$insert[0]._id).to.eql("punjab");
                                                                expect(tx.$set.states.$insert[0].state).to.eql("punjab");
                                                                expect(tx.$set.states.$delete).to.have.length(2);
                                                                expect(tx.$set.states.$delete[0]._id).to.eql("chennai");
                                                                expect(tx.$set.states.$delete[1]._id).to.eql("mumbai");


                                                                db2.query({$collection: "pl.txs", $filter: {"_id": txid2}}, function (err, data) {
                                                                    if (err) {
                                                                        done(err);
                                                                        return;
                                                                    }
                                                                    var transactions =
                                                                    {_id: "1", txid: txid, updates: [
                                                                        {tx: {$collection: "countries", $update: [
                                                                            {_id: 1}
                                                                        ]}}
                                                                    ]};

                                                                    expect(data.result).to.have.length(2);
                                                                    expect(data.result[1].txid).to.eql(txid2);
                                                                    expect(data.result[1].updates).to.have.length(1);
                                                                    var txUpdates = data.result[1].updates;
                                                                    var tx = JSON.parse(txUpdates[0].tx);
                                                                    expect(tx.$collection).to.eql("countries");
                                                                    expect(tx.$update).to.have.length(1);
                                                                    expect(tx.$update[0]._id).to.eql(1);


                                                                    db1.commitTransaction(function (err) {
                                                                        if (err) {
                                                                            done(err);
                                                                            return;
                                                                        }
                                                                        db1.query({$collection: "countries"}, function (err, data) {
                                                                            if (err) {
                                                                                done(err);
                                                                                return;
                                                                            }
                                                                            expect(data.result).to.have.length(1);
                                                                            expect(data.result[0].states).to.have.length(4);
                                                                            db2.query({$collection: "pl.txs", $filter: {"_id": txid2}}, function (err, data) {
                                                                                if (err) {
                                                                                    done(err);
                                                                                    return;
                                                                                }
                                                                                expect(data.result).to.have.length(0);
                                                                                expect(data.result[0].states).to.have.length(3);
                                                                                expect(data.result[0].states[0].state).to.eql("haryana")
                                                                                expect(data.result[0].states[1].state).to.eql("punjab")
                                                                                expect(data.result[0].states[2].state).to.eql("bihar")

                                                                                db2.rollbackTransaction(function (err) {
                                                                                    if (err) {
                                                                                        done(err);
                                                                                        return;
                                                                                    }
                                                                                    db2.query({$collection: "countries"}, function (err, data) {
                                                                                        if (err) {
                                                                                            done(err);
                                                                                            return;
                                                                                        }
                                                                                        expect(data.result).to.have.length(1);
                                                                                        expect(data.result[0].states).to.have.length(3);
                                                                                        expect(data.result[0].states[0].state).to.eql("haryana")
                                                                                        expect(data.result[0].states[1].state).to.eql("punjab")
                                                                                        expect(data.result[0].states[2].state).to.eql("bihar");

                                                                                        db2.query({$collection: "pl.txs", $filter: {"_id": txid2}}, function (err, data) {
                                                                                            if (err) {
                                                                                                done(err);
                                                                                                return;
                                                                                            }
                                                                                            expect(data.result).to.have.length(0);
                                                                                        });
                                                                                    });
                                                                                });
                                                                            });
                                                                        });


                                                                    })
                                                                });
                                                            })
                                                        });

                                                    });
                                                });
                                            });
                                        });
                                    })
                                })
                            });
                        });
                    });
                })
            });
        });
    });


    it("update by business logic transaction commit", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }

            var modifyPerson = {   name: "modifyPerson", code: "personJob", source: "NorthwindTestCase/lib/PersonJob.js"};
            var trigger = [
                {
                    functionName: modifyPerson,
                    operations: ["insert", "delete", "update"],
                    when: "pre"
                }
            ];

            var updates = [
                {$collection: {"collection": "Persons", "triggers": trigger}, $insert: [
                    {_id: 1, "lastname": "Sangwan", "firstname": "Manjeet"}
                ]}
            ]

            db.startTransaction(function (err, txid) {
                if (err) {
                    done(err);
                    return;
                }
                db.batchUpdateById(updates, function (err, result) {
                    if (err) {
                        done(err);
                        return;
                    }
                    db.query({$collection: "Persons", $sort: {country: 1}}, function (err, data) {
                        if (err) {
                            done(err);
                            return;
                        }
                        console.log("data after savingg person>>>>>" + JSON.stringify(data));
                        expect(data.result).to.have.length(1);
                        expect(data.result[0].fullname).to.eql("Manjeet Sangwan");
                        var recordTxid = data.result[0].txid;
                        var transactions = {_id: "1", txid: txid, updates: [
                            {tx: {$collection: "persons", $delete: [
                                {_id: 1}
                            ]}}
                        ]};
                        db.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                            if (err) {
                                done(err);
                                return;

                            }
                            console.log("transactoin after saving>>>>>>>>>>." + JSON.stringify(data));
                            expect(data.result).to.have.length(1);
                            expect(data.result[0].txid).to.eql(txid);
                            expect(data.result[0].updates).to.have.length(1);
                            var txUpdates = data.result[0].updates;
                            var tx = txUpdates[0].tx;
                            expect(tx.collection).to.eql("Persons");
                            expect(tx.delete.txid).to.eql(recordTxid);
                            db.commitTransaction(function (err) {
                                db.query({$collection: "Persons"}, function (err, data) {
                                    if (err) {
                                        done(err);
                                        return;
                                    }
                                    expect(data.result).to.have.length(1);
                                    expect(data.result[0].firstname).to.eql("Manjeet");
                                    expect(data.result[0].lastname).to.eql("Sangwan");
                                    expect(data.result[0].fullname).to.eql("Manjeet Sangwan");
                                    db.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                                        if (err) {
                                            done(err);
                                            return;
                                        }
                                        expect(data.result).to.have.length(0);
                                        done();
                                    });
                                });
                            });
                        });
                    })
                });
            })
        });
    });
    it("update by business logic transaction rollback", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }

            var modifyPerson = {   name: "modifyPerson", code: "personJob", source: "NorthwindTestCase/lib/PersonJob.js"};
            var trigger = [
                {
                    functionName: modifyPerson,
                    operations: ["insert", "delete", "update"],
                    when: "pre"
                }
            ];

            var updates = [
                {$collection: {"collection": "Persons", "triggers": trigger}, $insert: [
                    {_id: 1, "lastname": "Sangwan", "firstname": "Manjeet"}
                ]}
            ]

            db.startTransaction(function (err, txid) {
                if (err) {
                    done(err);
                    return;
                }
                db.batchUpdateById(updates, function (err, result) {
                    if (err) {
                        done(err);
                        return;
                    }
                    db.query({$collection: "Persons", $sort: {country: 1}}, function (err, data) {
                        if (err) {
                            done(err);
                            return;
                        }
                        console.log("data after savingg person>>>>>" + JSON.stringify(data));
                        expect(data.result).to.have.length(1);
                        expect(data.result[0].fullname).to.eql("Manjeet Sangwan");
                        var recordTxid = data.result[0].txid;
                        var transactions = {_id: "1", txid: txid, updates: [
                            {tx: {$collection: "persons", $delete: [
                                {_id: 1}
                            ]}}
                        ]};
                        db.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                            if (err) {
                                done(err);
                                return;

                            }
                            console.log("transactoin after saving>>>>>>>>>>." + JSON.stringify(data));
                            expect(data.result).to.have.length(1);
                            expect(data.result[0].txid).to.eql(txid);
                            expect(data.result[0].updates).to.have.length(1);
                            var txUpdates = data.result[0].updates;
                            var tx = txUpdates[0].tx;
                            expect(tx.collection).to.eql("Persons");
                            expect(tx.delete.txid).to.eql(recordTxid);
                            db.rollbackTransaction(function (err) {
                                db.query({$collection: "Persons"}, function (err, data) {
                                    if (err) {
                                        done(err);
                                        return;
                                    }
                                    console.log("data of persons after >>>>>>>>>>>>>>" + JSON.stringify(data));
                                    expect(data.result).to.have.length(0);
                                    db.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                                        if (err) {
                                            done(err);
                                            return;
                                        }
                                        expect(data.result).to.have.length(0);
                                        done();
                                    });
                                });
                            });
                        });
                    })
                });
            })
        });
    });

    it("update  self and another  collection  by business logic transaction commit", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }

            var modifyPerson = {   name: "createVoucher", code: "job", source: "NorthwindTestCase/lib/InvoiceJob.js"};
            var trigger = [
                {
                    functionName: modifyPerson,
                    operations: ["insert", "delete", "update"],
                    when: "post"
                }
            ]

            var updates = [
                {$collection: {"collection": "invoices", "triggers": trigger}, $insert: [
                    {
                        _id: 001,
                        invoiceno: "001",
                        date: "2013-12-10",
                        customer: {_id: "pawan", customer: "pawan"},
                        invoicelineitems: [
                            {
                                deliveryid: {_id: "001", deliveryno: "001"},
                                amount: 20000
                            },
                            {
                                deliveryid: {_id: "002", deliveryno: "002"},
                                amount: 30000
                            }
                        ]
                    }
                ]
                }
            ]
            db.startTransaction(function (err, txid) {
                if (err) {
                    done(err);
                    return;
                }
                db.batchUpdateById(updates, function (err, result) {
                    if (err) {
                        done(err);
                        return;
                    }
                    db.query({$collection: "invoices", $sort: {country: 1}}, function (err, data) {
                        if (err) {
                            done(err);
                            return;
                        }
                        console.log("invoice data after update" + JSON.stringify(data));
                        expect(data.result).to.have.length(1);
                        expect(data.result[0].customer.customer).to.eql("pawan");
                        expect(data.result[0].invoicelineitems).to.have.length(2);
                        expect(data.result[0].invoicelineitems[0].deliveryid.deliveryno).to.eql("001");
                        expect(data.result[0].invoicelineitems[0].amount).to.eql(20000);
                        expect(data.result[0].invoicelineitems[1].deliveryid.deliveryno).to.eql("002");
                        expect(data.result[0].invoicelineitems[1].amount).to.eql(30000);
                        var invoiceRecordTxid = data.result[0].txid;
                        console.log("invoiceRecordTxid>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(invoiceRecordTxid));
                        db.query({$collection: "vouchers", $sort: {country: 1}}, function (err, voucherData) {
                            if (err) {
                                done(err);
                                return;
                            }
                            console.log("vouchers data after update" + JSON.stringify(voucherData));
                            expect(voucherData.result).to.have.length(1);
                            expect(voucherData.result[0].voucherno).to.eql("001");
                            expect(voucherData.result[0].invoiceid).to.eql(data.result[0]._id);
                            expect(voucherData.result[0]._id).to.eql(data.result[0].voucherid);
                            var voucherRecordTxid = voucherData.result[0].txid;
                            console.log("voucherRecordId>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(voucherRecordTxid));
                            db.query({$collection: "pl.txs"}, function (err, data) {
                                if (err) {
                                    done(err);
                                    return;
                                }
                                var expectedTransactions =
                                {_id: "1", txid: "1", updates: [
                                    {tx: {$collection: "invoices", $delete: [
                                        {_id: 001}
                                    ]}},
                                    {tx: {$collection: "vouchers", $delete: [
                                        {_id: "v001"}
                                    ]}}
                                ]};
                                console.log("transactions data after update>>>>>>>>>" + JSON.stringify(data));
                                expect(data.result).to.have.length(1);
                                expect(data.result[0].txid).to.eql(txid);
//                                expect(data.result[0].updates).to.have.length(2);

                                var txUpdates = data.result[0].updates;
                                console.log("txxUPdates>>>>>>>>>>>>>" + JSON.stringify(txUpdates));
                                var tx = txUpdates[0].tx;
                                expect(tx.collection).to.eql("invoices");
                                expect(tx.delete.txid).to.eql(invoiceRecordTxid);

                                var tx = txUpdates[1].tx;
                                expect(tx.collection).to.eql("vouchers");
                                expect(tx.delete.txid).to.eql(voucherRecordTxid);
                                db.commitTransaction(function (err) {
                                    db.query({$collection: "invoices"}, function (err, data) {
                                        if (err) {
                                            done(err);
                                            return;
                                        }
                                        console.log("invoices data after commit >>>>" + JSON.stringify(data));
                                        expect(data.result).to.have.length(1);
                                        expect(data.result[0].customer.customer).to.eql("pawan");
                                        expect(data.result[0].invoicelineitems).to.have.length(2);
                                        expect(data.result[0].invoicelineitems[0].deliveryid.deliveryno).to.eql("001");
                                        expect(data.result[0].invoicelineitems[0].amount).to.eql(20000);
                                        expect(data.result[0].invoicelineitems[1].deliveryid.deliveryno).to.eql("002");
                                        expect(data.result[0].invoicelineitems[1].amount).to.eql(30000);
                                        db.query({$collection: "vouchers", $sort: {country: 1}}, function (err, voucherData) {
                                            if (err) {
                                                done(err);
                                                return;
                                            }
                                            console.log("voucherDAta data after commit >>>>" + JSON.stringify(voucherData));
                                            expect(voucherData.result).to.have.length(1);
                                            expect(voucherData.result[0].voucherno).to.eql("001");
                                            expect(voucherData.result[0].invoiceid).to.eql(data.result[0]._id);
                                            expect(voucherData.result[0]._id).to.eql(data.result[0].voucherid);

                                            db.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                                                if (err) {
                                                    done(err);
                                                    return;
                                                }
                                                expect(data.result).to.have.length(0);
                                                done();
                                            });
                                        });
                                    });
                                });
                            });
                        });


                    })
                });
            });
        });
    });
    it("update  self and another  collection  by business logic transaction rollback", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }

            var modifyPerson = {   name: "createVoucher", code: "job", source: "NorthwindTestCase/lib/InvoiceJob.js"};
            var trigger = [
                {
                    functionName: modifyPerson,
                    operations: ["insert", "delete", "update"],
                    when: "post"
                }
            ]

            var updates = [
                {$collection: {"collection": "invoices", "triggers": trigger}, $insert: [
                    {
                        _id: 001,
                        invoiceno: "001",
                        date: "2013-12-10",
                        customer: {_id: "pawan", customer: "pawan"},
                        invoicelineitems: [
                            {
                                deliveryid: {_id: "001", deliveryno: "001"},
                                amount: 20000
                            },
                            {
                                deliveryid: {_id: "002", deliveryno: "002"},
                                amount: 30000
                            }
                        ]
                    }
                ]
                }
            ]
            db.startTransaction(function (err, txid) {
                if (err) {
                    done(err);
                    return;
                }
                db.batchUpdateById(updates, function (err, result) {
                    if (err) {
                        done(err);
                        return;
                    }
                    db.query({$collection: "invoices", $sort: {country: 1}}, function (err, data) {
                        if (err) {
                            done(err);
                            return;
                        }
                        console.log("invoice data after update" + JSON.stringify(data));

                        expect(data.result).to.have.length(1);
                        expect(data.result[0].customer.customer).to.eql("pawan");
                        expect(data.result[0].invoicelineitems).to.have.length(2);
                        expect(data.result[0].invoicelineitems[0].deliveryid.deliveryno).to.eql("001");
                        expect(data.result[0].invoicelineitems[0].amount).to.eql(20000);
                        expect(data.result[0].invoicelineitems[1].deliveryid.deliveryno).to.eql("002");
                        expect(data.result[0].invoicelineitems[1].amount).to.eql(30000);
                        var invoiceRecordTxid = data.result[0].txid;
                        db.query({$collection: "vouchers", $sort: {country: 1}}, function (err, voucherData) {
                            if (err) {
                                done(err);
                                return;
                            }
                            console.log("vouchers data after update" + JSON.stringify(voucherData));
                            expect(voucherData.result).to.have.length(1);
                            expect(voucherData.result[0].voucherno).to.eql("001");
                            expect(voucherData.result[0].invoiceid).to.eql(data.result[0]._id);
                            expect(voucherData.result[0]._id).to.eql(data.result[0].voucherid);
                            var voucherRecordTxid = voucherData.result[0].txid;
                            db.query({$collection: "pl.txs"}, function (err, data) {
                                if (err) {
                                    done(err);
                                    return;
                                }
                                var expectedTransactions =
                                {_id: "1", txid: "1", updates: [
                                    {tx: {$collection: "invoices", $delete: [
                                        {_id: 001}
                                    ]}},
                                    {tx: {$collection: "vouchers", $delete: [
                                        {_id: "v001"}
                                    ]}}
                                ]};
                                console.log("transactions data after update>>>>>>>>>" + JSON.stringify(data));
                                expect(data.result).to.have.length(1);
                                expect(data.result[0].txid).to.eql(txid);
//                                expect(data.result[0].updates).to.have.length(2);

                                var txUpdates = data.result[0].updates;
                                console.log("txxUPdates>>>>>>>>>>>>>" + JSON.stringify(txUpdates));
                                var tx = txUpdates[0].tx;
                                expect(tx.collection).to.eql("invoices");
                                expect(tx.delete.txid).to.eql(invoiceRecordTxid);

                                var tx = txUpdates[1].tx;
                                expect(tx.collection).to.eql("vouchers");
                                expect(tx.delete.txid).to.eql(voucherRecordTxid);
                                db.rollbackTransaction(function (err) {
                                    db.query({$collection: "invoices"}, function (err, data) {
                                        if (err) {
                                            done(err);
                                            return;
                                        }
                                        console.log("invoices data after rollback >>>>" + JSON.stringify(data));
                                        expect(data.result).to.have.length(0);
                                        db.query({$collection: "vouchers", $sort: {country: 1}}, function (err, voucherData) {
                                            if (err) {
                                                done(err);
                                                return;
                                            }
                                            console.log("voucherDAta data after rollback >>>>" + JSON.stringify(voucherData));
                                            expect(voucherData.result).to.have.length(0);
                                            db.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                                                if (err) {
                                                    done(err);
                                                    return;
                                                }
                                                expect(data.result).to.have.length(0);
                                                done();
                                            });
                                        });
                                    });
                                });
                            });
                        });


                    })
                });
            });
        });
    });


    it.skip("insert 2 times with same id transaction should be automatic rollback", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {$collection: "countries", $insert: [
                    {_id: 1, country: "USA", code: "01"}
                ]}
            ];
            db.startTransaction(function (err, txid) {
                db.batchUpdateById(updates, function (err, result) {
                    if (err) {
                        done(err);
                        return;
                    }
                    var transactions =
                    {_id: "1", txid: "1", updates: [
                        {tx: {$collection: "countries", $delete: [
                            {_id: 1}
                        ]}}
                    ]};

                    expect(data.result).to.have.length(1);
                    expect(data.result[0].txid).to.eql(txid);
                    expect(data.result[0].updates).to.have.length(1);
                    var txUpdates = data.result[0].updates;
                    var tx = JSON.parse(txUpdates[0].tx);
                    expect(tx.$collection).to.eql("countries");
                    expect(tx.$delete).to.have.length(1);
                    expect(tx.$delete[0]._id).to.eql(1);

                    db.rollbackTransaction(function (err) {
                        db.query({$collection: "countries"}, function (err, data) {
                            if (err) {
                                done(err);
                                return;
                            }
                            expect(data.result).to.have.length(0);
                            db.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                                if (err) {
                                    done(err);
                                    return;
                                }
                                expect(data.result).to.have.length(0);
                                done();
                            });
                        })
                    });
                });
            });
        })
    });

    it("increment 2 times transaction commit", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {$collection: "countries", $insert: [
                    {_id: 1, country: "USA", code: "01", "score": 1000}

                ]}
            ];
            db.startTransaction(function (err, txid) {
                if (err) {
                    done(err);
                    return;
                }
                db.batchUpdateById(updates, function (err, result) {
                    if (err) {
                        done(err);
                        return;
                    }
                    db.query({$collection: "countries"}, function (err, data) {
                        if (err) {
                            done(err);
                            return;
                        }
                        expect(data.result).to.have.length(1);
                        expect(data.result[0].country).to.eql("USA");
                        expect(data.result[0].code).to.eql("01");
                        expect(data.result[0].score).to.eql(1000);
                        db.commitTransaction(function (err) {
                            if (err) {
                                done(err);
                                return;
                            }
                            db.startTransaction(function (err, txid) {
                                var update = [
                                    {$collection: "countries", $update: [
                                        {_id: 1, $set: {"country": "India"}, $inc: {score: 10}}
                                    ]},
                                    {$collection: "countries", $update: [
                                        {_id: 1, $inc: {score: -25}}
                                    ]}
                                ];
                                db.batchUpdateById(update, function (err, result) {
                                    if (err) {
                                        done(err);
                                        return;
                                    }
                                    db.query({$collection: "countries"}, function (err, data) {
                                        if (err) {
                                            done(err);
                                            return;
                                        }
                                        expect(data.result).to.have.length(1);
                                        expect(data.result[0].country).eql("India");
                                        expect(data.result[0].score).to.eql(985);

                                        var expectedUpdates = [
                                            {$collection: "countries", $update: [
                                                {_id: 1, $set: {"country": "India"}, $push: {__txs__: {$each: [
                                                    {txid: 1, tx: {_id: 1, $set: {"country": "USA"}, $inc: {score: 15}}}
                                                ]}}
                                                }
                                            ]}
                                        ]
                                        console.log("data in countries after update>>>>>>>." + JSON.stringify(data));
                                        var tx = data.result[0].__txs__[txid].tx;
                                        console.log("tx>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(tx));
                                        expect(tx._id).to.eql(1);
                                        expect(tx.set).to.have.length(1);
                                        expect(tx.set[0].key).to.eql("country");
                                        expect(tx.set[0].value).to.eql("USA");
                                        expect(tx.inc).to.have.length(1);
                                        expect(tx.inc[0].key).to.eql("score");
                                        expect(tx.inc[0].value).to.eql(15);


                                        db.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                                            if (err) {
                                                done(err);
                                                return;
                                            }
                                            console.log("data in transaction >>>>>>>>" + JSON.stringify(data));
                                            expect(data.result).to.have.length(1);
                                            expect(data.result[0].txid).to.eql(txid);
                                            expect(data.result[0].updates).to.have.length(1);
                                            var txUpdates = data.result[0].updates;
                                            var tx = txUpdates[0].tx;
                                            expect(tx.collection).to.eql("countries");
                                            expect(tx.update._id).to.eql(1);


                                            db.commitTransaction(function (err) {
                                                db.query({$collection: "countries"}, function (err, data) {
                                                    if (err) {
                                                        done(err);
                                                        return;
                                                    }
                                                    console.log("data in countries after commit>>>>>>>." + JSON.stringify(data));
                                                    expect(data.result).to.have.length(1);
                                                    expect(data.result[0].country).to.eql("India");
                                                    expect(data.result[0].score).to.eql(985);
                                                    db.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                                                        if (err) {
                                                            done(err);
                                                            return;
                                                        }
                                                        expect(data.result).to.have.length(0);
                                                        done();
                                                    });
                                                });
                                            });
                                        });
                                    });
                                })
                            });
                        })
                    });
                });

            })


        });
    });
    it("increment 2 times transaction rollback", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {$collection: "countries", $insert: [
                    {_id: 1, country: "USA", code: "01", "score": 1000}

                ]}
            ];
            db.startTransaction(function (err, txid) {
                if (err) {
                    done(err);
                    return;
                }
                db.batchUpdateById(updates, function (err, result) {
                    if (err) {
                        done(err);
                        return;
                    }
                    db.query({$collection: "countries"}, function (err, data) {
                        if (err) {
                            done(err);
                            return;
                        }
                        expect(data.result).to.have.length(1);
                        expect(data.result[0].country).to.eql("USA");
                        expect(data.result[0].code).to.eql("01");
                        expect(data.result[0].score).to.eql(1000);
                        db.commitTransaction(function (err) {
                            if (err) {
                                done(err);
                                return;
                            }
                            db.startTransaction(function (err, txid) {
                                var update = [
                                    {$collection: "countries", $update: [
                                        {_id: 1, $set: {"country": "India"}, $inc: {score: 10}}
                                    ]},
                                    {$collection: "countries", $update: [
                                        {_id: 1, $inc: {score: -25}}
                                    ]}
                                ];
                                db.batchUpdateById(update, function (err, result) {
                                    if (err) {
                                        done(err);
                                        return;
                                    }
                                    db.query({$collection: "countries"}, function (err, data) {
                                        if (err) {
                                            done(err);
                                            return;
                                        }
                                        console.log("Data of countries after update>>>>>>>>>>>>>>>" + JSON.stringify(data));
                                        expect(data.result).to.have.length(1);
                                        expect(data.result[0].country).to.eql("India");
                                        expect(data.result[0].score).to.eql(985);


                                        var expectedUpdates = [
                                            {$collection: "countries", $update: [
                                                {_id: 1, $set: {"country": "India"}, $push: {__txs__: {$each: [
                                                    {txid: 1, tx: {_id: 1, $set: {"country": "USA"}, $inc: {score: 15}}}
                                                ]}}
                                                }
                                            ]}
                                        ]

                                        var tx = data.result[0].__txs__[txid].tx;
                                        expect(tx._id).to.eql(1);
                                        expect(tx.set).to.have.length(1);
                                        expect(tx.set[0].key).to.eql("country");
                                        expect(tx.set[0].value).to.eql("USA");
                                        expect(tx.inc).to.have.length(1);
                                        expect(tx.inc[0].key).to.eql("score");
                                        expect(tx.inc[0].value).to.eql(15);

                                        db.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                                            if (err) {
                                                done(err);
                                                return;
                                            }

                                            var transactions =
                                            {_id: "1", txid: "1", updates: [
                                                {tx: {$collection: "countries", $update: [
                                                    {_id: 1}
                                                ]}}
                                            ]};

                                            expect(data.result).to.have.length(1);
                                            expect(data.result[0].txid).to.eql(txid);
                                            expect(data.result[0].updates).to.have.length(1);
                                            var txUpdates = data.result[0].updates;
                                            var tx = txUpdates[0].tx;
                                            expect(tx.collection).to.eql("countries");
                                            expect(tx.update._id).to.eql(1);

                                            db.rollbackTransaction(function (err) {
                                                db.query({$collection: "countries"}, function (err, data) {
                                                    if (err) {
                                                        done(err);
                                                        return;
                                                    }
                                                    expect(data.result).to.have.length(1);
                                                    expect(data.result[0].country).to.eql("USA");
                                                    expect(data.result[0].score).to.eql(1000);
                                                    db.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                                                        if (err) {
                                                            done(err);
                                                            return;
                                                        }
                                                        expect(data.result).to.have.length(0);
                                                        done();
                                                    });
                                                });
                                            });
                                        });
                                    });
                                })
                            });
                        })
                    });
                });
            })
        });
    });

    it("update 3 times transaction commit", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {$collection: "countries", $insert: [
                    {_id: 1, country: "USA", code: "01", "score": 1000}

                ]}
            ];
            db.startTransaction(function (err, txid) {
                if (err) {
                    done(err);
                    return;
                }
                db.batchUpdateById(updates, function (err, result) {
                    if (err) {
                        done(err);
                        return;
                    }
                    db.query({$collection: "countries"}, function (err, data) {
                        if (err) {
                            done(err);
                            return;
                        }
                        expect(data.result).to.have.length(1);
                        expect(data.result[0].country).to.eql("USA");
                        expect(data.result[0].code).to.eql("01");
                        expect(data.result[0].score).to.eql(1000);
                        db.commitTransaction(function (err) {
                            if (err) {
                                done(err);
                                return;
                            }

                            db.startTransaction(function (err, txid) {
                                var update = [
                                    {$collection: "countries", $update: [
                                        {_id: 1, $set: {"country": "India"}, $inc: {score: 10}}
                                    ]},
                                    {$collection: "countries", $update: [
                                        {_id: 1, set: {country: "pakistan"}}
                                    ]},
                                    {$collection: "countries", $update: [
                                        {_id: 1, $set: {country: "hindustan"}}
                                    ]}
                                ];

                                db.batchUpdateById(update, function (err, result) {
                                    if (err) {
                                        done(err);
                                        return;
                                    }
                                    db.query({$collection: "countries"}, function (err, data) {
                                        if (err) {
                                            done(err);
                                            return;
                                        }
                                        console.log("data in countries after update>>>>>>>>>>>." + JSON.stringify(data));
                                        expect(data.result).to.have.length(1);
                                        expect(data.result[0].country).to.eql("hindustan");
                                        expect(data.result[0].score).to.eql(1010);


                                        var expectedUpdates = [
                                            {$collection: "countries", $update: [
                                                {_id: 1, $set: {"country": "India"}, $push: {__txs__: {$each: [
                                                    {txid: 1, tx: {_id: 1, $set: {"country": "USA"}, $inc: {score: -10}}}
                                                ]}}
                                                }
                                            ]}
                                        ]

                                        var tx = data.result[0].__txs__[txid].tx;
                                        expect(tx._id).to.eql(1);
                                        expect(tx.set).to.have.length(1);
                                        console.log("tx.set>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(tx.set));
                                        expect(tx.set[0].key).to.eql("country");
                                        expect(tx.set[0].value).to.eql("USA");
                                        expect(tx.inc).to.have.length(1);
                                        expect(tx.inc[0].key).to.eql("score");
                                        expect(tx.inc[0].value).to.eql(-10);
                                        db.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                                            if (err) {
                                                done(err);
                                                return;
                                            }
                                            var transactions =
                                            {_id: "1", txid: "1", updates: [
                                                {tx: {$collection: "countries", $update: [
                                                    {_id: 1}
                                                ]}}
                                            ]};
                                            console.log("data in transaction after update>>>>>>>>>>>>>>>>>" + JSON.stringify(data));
                                            expect(data.result).to.have.length(1);
                                            expect(data.result[0].txid).to.eql(txid);
                                            expect(data.result[0].updates).to.have.length(1);
                                            var txUpdates = data.result[0].updates;
                                            var tx = txUpdates[0].tx;
                                            console.log("tx>>>>>>>" + JSON.stringify(tx));
                                            expect(tx.collection).to.eql("countries");
                                            expect(tx.update._id).to.eql(1);


                                            db.commitTransaction(function (err) {
                                                db.query({$collection: "countries"}, function (err, data) {
                                                    if (err) {
                                                        done(err);
                                                        return;
                                                    }
                                                    console.log("data in countires after comit>>>>>>>>>>>>>>>>>" + JSON.stringify(data));
                                                    expect(data.result).to.have.length(1);
                                                    expect(data.result[0].country).to.eql("hindustan");
                                                    expect(data.result[0].score).to.eql(1010);
                                                    db.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                                                        if (err) {
                                                            done(err);
                                                            return;
                                                        }
                                                        expect(data.result).to.have.length(0);
                                                        done();
                                                    });
                                                });
                                            });
                                        });
                                    });
                                })
                            });
                        })
                    });
                });
            })
        });
    });
    it("update 3 times transaction rollback", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {$collection: "countries", $insert: [
                    {_id: 1, country: "USA", code: "01", "score": 1000}

                ]}
            ];
            db.startTransaction(function (err, txid) {
                if (err) {
                    done(err);
                    return;
                }
                db.batchUpdateById(updates, function (err, result) {
                    if (err) {
                        done(err);
                        return;
                    }
                    db.query({$collection: "countries"}, function (err, data) {
                        if (err) {
                            done(err);
                            return;
                        }
                        expect(data.result).to.have.length(1);
                        expect(data.result[0].country).to.eql("USA");
                        expect(data.result[0].code).to.eql("01");
                        expect(data.result[0].score).to.eql(1000);
                        db.commitTransaction(function (err) {
                            if (err) {
                                done(err);
                                return;
                            }
                            db.startTransaction(function (err, txid) {
                                var update = [
                                    {$collection: "countries", $update: [
                                        {_id: 1, $set: {"country": "India"}, $inc: {score: 10}}
                                    ]},
                                    {$collection: "countries", $update: [
                                        {_id: 1, set: {country: "pakistan"}}
                                    ]},
                                    {$collection: "countries", $update: [
                                        {_id: 1, $set: {country: "hindustan"}}
                                    ]}
                                ];
                                db.batchUpdateById(update, function (err, result) {
                                    if (err) {
                                        done(err);
                                        return;
                                    }
                                    db.query({$collection: "countries"}, function (err, data) {
                                        if (err) {
                                            done(err);
                                            return;
                                        }
                                        expect(data.result).to.have.length(1);
                                        expect(data.result[0].country).to.eql("hindustan");
                                        expect(data.result[0].score).to.eql(1010);

                                        var expectedUpdates = [
                                            {$collection: "countries", $update: [
                                                {_id: 1, $set: {"country": "India"}, $push: {__txs__: {$each: [
                                                    {txid: 1, tx: {_id: 1, $set: {"country": "USA"}, $inc: {score: -10}}}
                                                ]}}
                                                }
                                            ]}
                                        ]

                                        var tx = data.result[0].__txs__[txid].tx;
                                        expect(tx._id).to.eql(1);
                                        expect(tx.set).to.have.length(1);
                                        console.log("tx.set>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(tx.set));
                                        expect(tx.set[0].key).to.eql("country");
                                        expect(tx.set[0].value).to.eql("USA");
                                        expect(tx.inc).to.have.length(1);
                                        expect(tx.inc[0].key).to.eql("score");
                                        expect(tx.inc[0].value).to.eql(-10);

                                        db.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                                            if (err) {
                                                done(err);
                                                return;
                                            }
                                            var transactions =
                                            {_id: "1", txid: "1", updates: [
                                                {tx: {$collection: "countries", $update: [
                                                    {_id: 1}
                                                ]}}
                                            ]};

                                            expect(data.result).to.have.length(1);
                                            expect(data.result[0].txid).to.eql(txid);
                                            expect(data.result[0].updates).to.have.length(1);
                                            var txUpdates = data.result[0].updates;
                                            var tx = txUpdates[0].tx;
                                            expect(tx.collection).to.eql("countries");
                                            expect(tx.update._id).to.eql(1);

                                            db.rollbackTransaction(function (err) {
                                                db.query({$collection: "countries"}, function (err, data) {
                                                    if (err) {
                                                        done(err);
                                                        return;
                                                    }
                                                    expect(data.result).to.have.length(1);
                                                    expect(data.result[0].country).to.eql("USA");
                                                    expect(data.result[0].code).to.eql("01");
                                                    expect(data.result[0].score).to.eql(1000);
                                                    db.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                                                        if (err) {
                                                            done(err);
                                                            return;
                                                        }
                                                        expect(data.result).to.have.length(0);
                                                        done();
                                                    });
                                                });
                                            });
                                        });
                                    });
                                })
                            });
                        })
                    });
                });

            })


        });
    });


    it("update same record from  2 instances of same db both rollback", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {$collection: "countries", $insert: [
                    {_id: 1, country: "india", code: "01"}
                ]}
            ];
            db.startTransaction(function (err, txid) {
                db.batchUpdateById(updates, function (err, result) {
                    if (err) {
                        done(err);
                        return;
                    }
                    db.query({$collection: "countries"}, function (err, data) {
                        if (err) {
                            done(err);
                            return;
                        }
                        expect(data.result).to.have.length(1);
                        expect(data.result[0].country).to.eql("india");
                        expect(data.result[0].code).to.eql("01");
                        db.commitTransaction(function (err) {
                            if (err) {
                                done(err);
                                return;
                            }
                            ApplaneDB.connect(Config.URL, Config.DB, function (err, db1) {
                                if (err) {
                                    done(err);
                                    return;
                                }
                                var update = [
                                    {$collection: "countries", $update: [
                                        {_id: 1, $set: {country: "bharat"}}
                                    ]}
                                ];
                                db1.startTransaction(function (err, txid) {
                                    if (err) {
                                        done(err);
                                        return;
                                    }
                                    console.log("txid1>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>" + txid);
                                    db1.batchUpdateById(update, function (err, result) {
                                        if (err) {
                                            done(err);
                                            return;
                                        }
                                        db1.query({$collection: "countries"}, function (err, data) {
                                            if (err) {
                                                done(err);
                                                return;
                                            }
                                            console.log("after updating with the help of db1" + JSON.stringify(data));
                                            expect(data.result).to.have.length(1);
                                            expect(data.result[0].country).to.eql("bharat");


                                            var expectedUpdates = [
                                                {$collection: "countries", $update: [
                                                    {_id: 1, $set: {"country": "bharat"}, $push: {__txs__: {$each: [
                                                        {txid: txid, tx: {_id: 1, $set: {"country": "india"}}}
                                                    ]}}
                                                    }
                                                ]}
                                            ];

                                            var txs = data.result[0].__txs__;
                                            console.log("txs>>>>>>>>>>>>>>>" + JSON.stringify(txs));
                                            var tx = data.result[0].__txs__[txid].tx;
                                            expect(tx._id).to.eql(1);
                                            expect(tx.set).to.have.length(1);
                                            expect(tx.set[0].key).to.eql("country");
                                            expect(tx.set[0].value).to.eql("india");


                                            db1.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                                                if (err) {
                                                    done(err);
                                                    return;
                                                }

                                                var expectedTransactions =
                                                {_id: "1", txid: txid, updates: [
                                                    {tx: {$collection: "countries", $update: [
                                                        {_id: 1}
                                                    ]}}
                                                ]};
                                                console.log("db 1 transaction >>>>>>>>>>>>>>>>>." + JSON.stringify(data));
                                                expect(data.result).to.have.length(1);
                                                expect(data.result[0].txid).to.eql(txid);
                                                expect(data.result[0].updates).to.have.length(1);
                                                var txUpdates = data.result[0].updates;
                                                var tx = txUpdates[0].tx;
                                                expect(tx.collection).to.eql("countries");
                                                expect(tx.update._id).to.eql(1);
                                                ApplaneDB.connect(Config.URL, Config.DB, function (err, db2) {
                                                    if (err) {
                                                        done(err);
                                                        return;
                                                    }
                                                    db2.startTransaction(function (err, txid2) {
                                                        if (err) {
                                                            done(err);
                                                            return;
                                                        }
                                                        console.log("txid2>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>" + txid2);
                                                        var newUpdate = [
                                                            {$collection: "countries", $update: [
                                                                {_id: 1, $set: {country: "hindustan"}}
                                                            ]}
                                                        ];

                                                        db2.batchUpdateById(newUpdate, function (err, result) {
                                                            if (err) {
                                                                done(err);
                                                                return;
                                                            }
                                                            db2.query({$collection: "countries"}, function (err, data) {
                                                                if (err) {
                                                                    done(err);
                                                                    return;
                                                                }
                                                                console.log("data after update form db2>>>>" + JSON.stringify(data));
                                                                expect(data.result).to.have.length(1);
                                                                expect(data.result[0].country).to.eql("hindustan");

                                                                var expectedUpdates = [
                                                                    {$collection: "countries", $update: [
                                                                        {_id: 1, $set: {"country": "hindustan"}, $push: {__txs__: {$each: [
                                                                            {txid: txid, tx: {_id: 1, $set: {"country": "bharat"}}}
                                                                        ]}}
                                                                        }
                                                                    ]}
                                                                ];
                                                                var tx = data.result[0].__txs__[txid2].tx;
                                                                expect(tx._id).to.eql(1);
                                                                expect(tx.set).to.have.length(1);
                                                                expect(tx.set[0].key).to.eql("country");
                                                                expect(tx.set[0].value).to.eql("bharat");

                                                                db2.query({$collection: "pl.txs", $filter: {"_id": txid2}}, function (err, data) {
                                                                    if (err) {
                                                                        done(err);
                                                                        return;
                                                                    }
                                                                    var transactions =
                                                                    {_id: "1", txid: txid, updates: [
                                                                        {tx: {$collection: "countries", $update: [
                                                                            {_id: 1}
                                                                        ]}}
                                                                    ]};
                                                                    console.log("transaction entry from db 2>>>" + JSON.stringify(data));
                                                                    expect(data.result).to.have.length(1);
                                                                    expect(data.result[0].txid).to.eql(txid2);
                                                                    var txUpdates = data.result[0].updates;
                                                                    var tx = txUpdates[0].tx;
                                                                    expect(tx.collection).to.eql("countries");
                                                                    expect(tx.update._id).to.eql(1);


                                                                    db1.rollbackTransaction(function (err) {
                                                                        if (err) {
                                                                            done(err);
                                                                            return;
                                                                        }
                                                                        db1.query({$collection: "countries"}, function (err, data) {
                                                                            if (err) {
                                                                                done(err);
                                                                                return;
                                                                            }
                                                                            console.log("countries data after rollback from db1?>>>>" + JSON.stringify(data));
                                                                            expect(data.result).to.have.length(1);
                                                                            expect(data.result[0].country).to.eql("india");
                                                                            db2.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                                                                                if (err) {
                                                                                    done(err);
                                                                                    return;
                                                                                }
                                                                                console.log("transactions data from db1>>>>>>>>>>>>" + JSON.stringify(data));
                                                                                expect(data.result).to.have.length(0);
                                                                                db2.rollbackTransaction(function (err) {
                                                                                    if (err) {
                                                                                        done(err);
                                                                                        return;
                                                                                    }
                                                                                    db2.query({$collection: "countries"}, function (err, data) {
                                                                                        if (err) {
                                                                                            done(err);
                                                                                            return;
                                                                                        }
                                                                                        console.log("countries data after rollback from db2?>>>>" + JSON.stringify(data));
                                                                                        expect(data.result).to.have.length(1);
                                                                                        expect(data.result[0].country).to.eql("bharat");
                                                                                        db2.query({$collection: "pl.txs", $filter: {"_id": txid2}}, function (err, data) {
                                                                                            if (err) {
                                                                                                done(err);
                                                                                                return;
                                                                                            }
                                                                                            expect(data.result).to.have.length(0);
                                                                                            done();
                                                                                        });
                                                                                    });
                                                                                });
                                                                            });
                                                                        });


                                                                    })
                                                                });
                                                            })
                                                        });

                                                    });
                                                });
                                            });
                                        });
                                    })
                                })
                            });
                        });
                    });
                })
            });
        });
    });

    it("inc from  2 instances of same db both rollback", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {$collection: "countries", $insert: [
                    {_id: 1, country: "india", rank: 22}
                ]}
            ];
            db.startTransaction(function (err, txid) {
                db.batchUpdateById(updates, function (err, result) {
                    if (err) {
                        done(err);
                        return;
                    }
                    db.query({$collection: "countries"}, function (err, data) {
                        if (err) {
                            done(err);
                            return;
                        }
                        expect(data.result).to.have.length(1);
                        expect(data.result[0].country).to.eql("india");
                        expect(data.result[0].rank).to.eql(22);
                        db.commitTransaction(function (err) {
                            if (err) {
                                done(err);
                                return;
                            }
                            ApplaneDB.connect(Config.URL, Config.DB, function (err, db1) {
                                if (err) {
                                    done(err);
                                    return;
                                }
                                var update = [
                                    {$collection: "countries", $update: [
                                        {_id: 1, $inc: {rank: 10}}
                                    ]}
                                ];
                                db1.startTransaction(function (err, txid) {
                                    if (err) {
                                        done(err);
                                        return;
                                    }
                                    db1.batchUpdateById(update, function (err, result) {
                                        if (err) {
                                            done(err);
                                            return;
                                        }
                                        db1.query({$collection: "countries"}, function (err, data) {
                                            if (err) {
                                                done(err);
                                                return;
                                            }
                                            console.log("data after update from db1>>>>" + JSON.stringify(data));
                                            expect(data.result).to.have.length(1);
                                            expect(data.result[0].rank).to.eql(32);


                                            var expectedUpdates = [
                                                {$collection: "countries", $update: [
                                                    {_id: 1, $inc: {"rank": 10}, $push: {__txs__: {$each: [
                                                        {txid: txid, tx: {_id: 1, $inc: {"rank": -10}}}
                                                    ]}}
                                                    }
                                                ]}
                                            ];

                                            var tx = data.result[0].__txs__[txid].tx;
                                            expect(tx._id).to.eql(1);
                                            expect(tx.inc).to.have.length(1);
                                            expect(tx.inc[0].key).to.eql("rank");
                                            expect(tx.inc[0].value).to.eql(-10);


                                            db1.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                                                if (err) {
                                                    done(err);
                                                    return;
                                                }

                                                var expectedTransactions =
                                                {_id: "1", txid: txid, updates: [
                                                    {tx: {$collection: "countries", $update: [
                                                        {_id: 1}
                                                    ]}}
                                                ]};
                                                console.log("data after transaction  from db1>>>>" + JSON.stringify(data));
                                                expect(data.result).to.have.length(1);
                                                expect(data.result[0].txid).to.eql(txid);
                                                var txUpdates = data.result[0].updates;
                                                var tx = txUpdates[0].tx;
                                                expect(tx.collection).to.eql("countries");
                                                expect(tx.update._id).to.eql(1);
                                                ApplaneDB.connect(Config.URL, Config.DB, function (err, db2) {
                                                    if (err) {
                                                        done(err);
                                                        return;
                                                    }
                                                    db2.startTransaction(function (err, txid2) {
                                                        if (err) {
                                                            done(err);
                                                            return;
                                                        }
                                                        var newUpdate = [
                                                            {$collection: "countries", $update: [
                                                                {_id: 1, $inc: {rank: -50}}
                                                            ]}
                                                        ];

                                                        db2.batchUpdateById(newUpdate, function (err, result) {
                                                            if (err) {
                                                                done(err);
                                                                return;
                                                            }
                                                            db2.query({$collection: "countries"}, function (err, data) {
                                                                if (err) {
                                                                    done(err);
                                                                    return;
                                                                }
                                                                console.log("data after update from db2>>>>" + JSON.stringify(data));
                                                                expect(data.result).to.have.length(1);
                                                                expect(data.result[0].rank).to.eql(-18);

                                                                var expectedUpdates = [
                                                                    {$collection: "countries", $update: [
                                                                        {_id: 1, $inc: {"rank": -50}, $push: {__txs__: {$each: [
                                                                            {txid: txid, tx: {_id: 1, $inc: {"rank": 50}}}
                                                                        ]}}
                                                                        }
                                                                    ]}
                                                                ];


                                                                var tx = data.result[0].__txs__[txid2].tx;
                                                                expect(tx._id).to.eql(1);
                                                                expect(tx.inc).to.have.length(1);
                                                                expect(tx.inc[0].key).to.eql("rank");
                                                                expect(tx.inc[0].value).to.eql(50);

                                                                db2.query({$collection: "pl.txs", $filter: {"_id": txid2}}, function (err, data) {
                                                                    if (err) {
                                                                        done(err);
                                                                        return;
                                                                    }
                                                                    var transactions =
                                                                    {_id: "1", txid: txid, updates: [
                                                                        {tx: {$collection: "countries", $update: [
                                                                            {_id: 1}
                                                                        ]}}
                                                                    ]};

                                                                    console.log("data after transaction from db1>>>>" + JSON.stringify(data));
                                                                    expect(data.result).to.have.length(1);
                                                                    expect(data.result[0].txid).to.eql(txid2);
                                                                    var txUpdates = data.result[0].updates;
                                                                    var tx = txUpdates[0].tx;
                                                                    expect(tx.collection).to.eql("countries");
                                                                    expect(tx.update._id).to.eql(1);


                                                                    db1.rollbackTransaction(function (err) {
                                                                        if (err) {
                                                                            done(err);
                                                                            return;
                                                                        }
                                                                        db1.query({$collection: "countries"}, function (err, data) {
                                                                            if (err) {
                                                                                done(err);
                                                                                return;
                                                                            }
                                                                            console.log("data after rollback from db1>>>>" + JSON.stringify(data));
                                                                            expect(data.result).to.have.length(1);
                                                                            expect(data.result[0].rank).to.eql(-28);
                                                                            db1.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                                                                                if (err) {
                                                                                    done(err);
                                                                                    return;
                                                                                }

                                                                                expect(data.result).to.have.length(0);

                                                                                db2.rollbackTransaction(function (err) {
                                                                                    if (err) {
                                                                                        done(err);
                                                                                        return;
                                                                                    }
                                                                                    db2.query({$collection: "countries"}, function (err, data) {
                                                                                        if (err) {
                                                                                            done(err);
                                                                                            return;
                                                                                        }
                                                                                        expect(data.result).to.have.length(1);
                                                                                        expect(data.result[0].rank).to.eql(22);
                                                                                        db2.query({$collection: "pl.txs", $filter: {"_id": txid2}}, function (err, data) {
                                                                                            if (err) {
                                                                                                done(err);
                                                                                                return;
                                                                                            }
                                                                                            expect(data.result).to.have.length(0);
                                                                                            done();
                                                                                        });
                                                                                    });
                                                                                });
                                                                            });
                                                                        });


                                                                    })
                                                                });
                                                            })
                                                        });

                                                    });
                                                });
                                            });
                                        });
                                    })
                                })
                            });
                        });
                    });
                })
            });
        });
    });

    it("inc from  2 instances of same db one commit and one  rollback", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {$collection: "countries", $insert: [
                    {_id: 1, country: "india", rank: 22}
                ]}
            ];
            db.startTransaction(function (err, txid) {
                db.batchUpdateById(updates, function (err, result) {
                    if (err) {
                        done(err);
                        return;
                    }
                    db.query({$collection: "countries"}, function (err, data) {
                        if (err) {
                            done(err);
                            return;
                        }
                        expect(data.result).to.have.length(1);
                        expect(data.result[0].country).to.eql("india");
                        expect(data.result[0].rank).to.eql(22);
                        db.commitTransaction(function (err) {
                            if (err) {
                                done(err);
                                return;
                            }
                            ApplaneDB.connect(Config.URL, Config.DB, function (err, db1) {
                                if (err) {
                                    done(err);
                                    return;
                                }
                                var update = [
                                    {$collection: "countries", $update: [
                                        {_id: 1, $inc: {rank: 10}}
                                    ]}
                                ];
                                db1.startTransaction(function (err, txid) {
                                    if (err) {
                                        done(err);
                                        return;
                                    }
                                    db1.batchUpdateById(update, function (err, result) {
                                        if (err) {
                                            done(err);
                                            return;
                                        }
                                        db1.query({$collection: "countries"}, function (err, data) {
                                            if (err) {
                                                done(err);
                                                return;
                                            }
                                            console.log("data after update from db1>>>>>>>>>>>>>>>" + JSON.stringify(data));
                                            expect(data.result).to.have.length(1);
                                            expect(data.result[0].rank).to.eql(32);


                                            var expectedUpdates = [
                                                {$collection: "countries", $update: [
                                                    {_id: 1, $inc: {"rank": 10}, $push: {__txs__: {$each: [
                                                        {txid: txid, tx: {_id: 1, $inc: {"rank": -10}}}
                                                    ]}}
                                                    }
                                                ]}
                                            ];

                                            var tx = data.result[0].__txs__[txid].tx;
                                            expect(tx._id).to.eql(1);
                                            expect(tx.inc).to.have.length(1);
                                            expect(tx.inc[0].key).to.eql("rank");
                                            expect(tx.inc[0].value).to.eql(-10);


                                            db1.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                                                if (err) {
                                                    done(err);
                                                    return;
                                                }

                                                var expectedTransactions =
                                                {_id: "1", txid: txid, updates: [
                                                    {tx: {$collection: "countries", $update: [
                                                        {_id: 1}
                                                    ]}}
                                                ]};
                                                console.log("data after transaction from db1>>>>>>>>>>>>>>>" + JSON.stringify(data));
                                                expect(data.result).to.have.length(1);
                                                expect(data.result[0].txid).to.eql(txid);
                                                var txUpdates = data.result[0].updates;
                                                var tx = txUpdates[0].tx;
                                                expect(tx.collection).to.eql("countries");
                                                expect(tx.update._id).to.eql(1);
                                                ApplaneDB.connect(Config.URL, Config.DB, function (err, db2) {
                                                    if (err) {
                                                        done(err);
                                                        return;
                                                    }
                                                    db2.startTransaction(function (err, txid2) {
                                                        if (err) {
                                                            done(err);
                                                            return;
                                                        }
                                                        var newUpdate = [
                                                            {$collection: "countries", $update: [
                                                                {_id: 1, $inc: {rank: -50}}
                                                            ]}
                                                        ];

                                                        db2.batchUpdateById(newUpdate, function (err, result) {
                                                            if (err) {
                                                                done(err);
                                                                return;
                                                            }
                                                            db2.query({$collection: "countries"}, function (err, data) {
                                                                if (err) {
                                                                    done(err);
                                                                    return;
                                                                }
                                                                console.log("data after update from db2>>>>>>>>>>>>>>>" + JSON.stringify(data));
                                                                expect(data.result).to.have.length(1);
                                                                expect(data.result[0].rank).to.eql(-18);

                                                                var expectedUpdates = [
                                                                    {$collection: "countries", $update: [
                                                                        {_id: 1, $inc: {"rank": -50}, $push: {__txs__: {$each: [
                                                                            {txid: txid, tx: {_id: 1, $inc: {"rank": 50}}}
                                                                        ]}}
                                                                        }
                                                                    ]}
                                                                ];


                                                                var tx = data.result[0].__txs__[txid2].tx;
                                                                expect(tx._id).to.eql(1);
                                                                expect(tx.inc).to.have.length(1);
                                                                expect(tx.inc[0].key).to.eql("rank");
                                                                expect(tx.inc[0].value).to.eql(50);

                                                                db2.query({$collection: "pl.txs", $filter: {"_id": txid2}}, function (err, data) {
                                                                    if (err) {
                                                                        done(err);
                                                                        return;
                                                                    }
                                                                    var transactions =
                                                                    {_id: "1", txid: txid, updates: [
                                                                        {tx: {$collection: "countries", $update: [
                                                                            {_id: 1}
                                                                        ]}}
                                                                    ]};
                                                                    console.log("data after update from db2>>>>>>>>>>>>>>>" + JSON.stringify(data));
                                                                    expect(data.result).to.have.length(1);
                                                                    expect(data.result[0].txid).to.eql(txid2);
                                                                    var txUpdates = data.result[0].updates;
                                                                    var tx = txUpdates[0].tx;
                                                                    expect(tx.collection).to.eql("countries");
                                                                    expect(tx.update._id).to.eql(1);


                                                                    db1.commitTransaction(function (err) {
                                                                        if (err) {
                                                                            done(err);
                                                                            return;
                                                                        }
                                                                        db1.query({$collection: "countries"}, function (err, data) {
                                                                            if (err) {
                                                                                done(err);
                                                                                return;
                                                                            }
                                                                            console.log("data after commit from db1>>>>>>>>>>>>>>>" + JSON.stringify(data));
                                                                            expect(data.result).to.have.length(1);
                                                                            expect(data.result[0].rank).to.eql(-18);
                                                                            db1.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                                                                                if (err) {
                                                                                    done(err);
                                                                                    return;
                                                                                }
                                                                                expect(data.result).to.have.length(0);

                                                                                db2.rollbackTransaction(function (err) {
                                                                                    if (err) {
                                                                                        done(err);
                                                                                        return;
                                                                                    }
                                                                                    db2.query({$collection: "countries"}, function (err, data) {
                                                                                        if (err) {
                                                                                            done(err);
                                                                                            return;
                                                                                        }
                                                                                        console.log("data after rollback from db2>>>>>>>>>>>>>>>" + JSON.stringify(data));
                                                                                        expect(data.result).to.have.length(1);
                                                                                        expect(data.result[0].rank).to.eql(32);
                                                                                        db2.query({$collection: "pl.txs", $filter: {"_id": txid2}}, function (err, data) {
                                                                                            if (err) {
                                                                                                done(err);
                                                                                                return;
                                                                                            }
                                                                                            expect(data.result).to.have.length(0);
                                                                                            done();
                                                                                        });
                                                                                    });
                                                                                });
                                                                            });
                                                                        });


                                                                    })
                                                                });
                                                            })
                                                        });

                                                    });
                                                });
                                            });
                                        });
                                    })
                                })
                            });
                        });
                    });
                })
            });
        });
    });


    it("multiple inserts transaction commit", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {$collection: "countries", $insert: [
                    {_id: 1, country: "USA", code: "01"}
                ]},
                {$collection: "states", $insert: [
                    {_id: 1, country: "LA", code: "11"}
                ]},
                {$collection: "city", $insert: [
                    {_id: 1, country: "HISAR", code: "22"}
                ]}
            ];
            db.startTransaction(function (err, txid) {
                db.batchUpdateById(updates, function (err, result) {
                    if (err) {
                        done(err);
                        return;
                    }
                    db.query({$collection: "countries"}, function (err, data) {
                        if (err) {
                            done(err);
                            return;
                        }

                        expect(data.result).to.have.length(1);
                        expect(data.result[0].country).to.eql("USA");
                        expect(data.result[0].code).to.eql("01");
                        db.query({$collection: "states"}, function (err, data) {
                            if (err) {
                                done(err);
                                return;
                            }

                            expect(data.result).to.have.length(1);
                            expect(data.result[0].country).to.eql("LA");
                            expect(data.result[0].code).to.eql("11");

                            db.query({$collection: "city"}, function (err, data) {
                                if (err) {
                                    done(err);
                                    return;
                                }

                                expect(data.result).to.have.length(1);
                                expect(data.result[0].country).to.eql("HISAR");
                                expect(data.result[0].code).to.eql("22");
                                db.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                                    if (err) {
                                        done(err);
                                        return;
                                    }
                                    console.log("data >>>>>>>>>>>>>>>>.transaction insert" + JSON.stringify(data));
                                    expect(data.result).to.have.length(1);
                                    expect(data.result[0].txid).to.eql(txid);
                                    var txUpdates = data.result[0].updates;

                                    var tx = txUpdates[0].tx;
                                    expect(tx.collection).to.eql("countries");
//                                    expect(tx.delete._id).to.eql(1);

                                    var tx = txUpdates[1].tx;
                                    expect(tx.collection).to.eql("states");
//                                    expect(tx.delete._id).to.eql(1);

                                    var tx = txUpdates[2].tx;
                                    expect(tx.collection).to.eql("city");
//                                    expect(tx.delete._id).to.eql(1);


                                    db.commitTransaction(function (err) {
                                        db.query({$collection: "countries"}, function (err, data) {
                                            if (err) {
                                                done(err);
                                                return;
                                            }
                                            expect(data.result).to.have.length(1);
                                            expect(data.result[0].country).to.eql("USA");
                                            expect(data.result[0].code).to.eql("01");
                                            db.query({$collection: "states"}, function (err, data) {
                                                if (err) {
                                                    done(err);
                                                    return;
                                                }
                                                expect(data.result).to.have.length(1);
                                                expect(data.result[0].country).to.eql("LA");
                                                expect(data.result[0].code).to.eql("11");
                                                db.query({$collection: "city"}, function (err, data) {
                                                    if (err) {
                                                        done(err);
                                                        return;
                                                    }
                                                    expect(data.result).to.have.length(1);
                                                    expect(data.result[0].country).to.eql("HISAR");
                                                    expect(data.result[0].code).to.eql("22");
                                                    db.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                                                        if (err) {
                                                            done(err);
                                                            return;
                                                        }
                                                        expect(data.result).to.have.length(0);
                                                        done();
                                                    });
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        });

                    });
                })
            });
        });
    })

    it("multiple inserts transaction rollback", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {$collection: "countries", $insert: [
                    {_id: 1, country: "USA", code: "01"}
                ]},
                {$collection: "states", $insert: [
                    {_id: 1, country: "LA", code: "11"}
                ]},
                {$collection: "city", $insert: [
                    {_id: 1, country: "HISAR", code: "22"}
                ]}
            ];
            db.startTransaction(function (err, txid) {
                db.batchUpdateById(updates, function (err, result) {
                    if (err) {
                        done(err);
                        return;
                    }
                    db.query({$collection: "countries"}, function (err, data) {
                        if (err) {
                            done(err);
                            return;
                        }

                        expect(data.result).to.have.length(1);
                        expect(data.result[0].country).to.eql("USA");
                        expect(data.result[0].code).to.eql("01");
                        db.query({$collection: "states"}, function (err, data) {
                            if (err) {
                                done(err);
                                return;
                            }

                            expect(data.result).to.have.length(1);
                            expect(data.result[0].country).to.eql("LA");
                            expect(data.result[0].code).to.eql("11");

                            db.query({$collection: "city"}, function (err, data) {
                                if (err) {
                                    done(err);
                                    return;
                                }

                                expect(data.result).to.have.length(1);
                                expect(data.result[0].country).to.eql("HISAR");
                                expect(data.result[0].code).to.eql("22");
                                db.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                                    if (err) {
                                        done(err);
                                        return;
                                    }
                                    console.log("data >>>>>>>>>>>>>>>>.transaction insert" + JSON.stringify(data));
                                    expect(data.result).to.have.length(1);
                                    expect(data.result[0].txid).to.eql(txid);
                                    var txUpdates = data.result[0].updates;

                                    var tx = txUpdates[0].tx;
                                    expect(tx.collection).to.eql("countries");
//                                    expect(tx.delete._id).to.eql(1);

                                    var tx = txUpdates[1].tx;
                                    expect(tx.collection).to.eql("states");
//                                    expect(tx.delete._id).to.eql(1);

                                    var tx = txUpdates[2].tx;
                                    expect(tx.collection).to.eql("city");
//                                    expect(tx.delete._id).to.eql(1);


                                    db.rollbackTransaction(function (err) {
                                        db.query({$collection: "countries"}, function (err, data) {
                                            if (err) {
                                                done(err);
                                                return;
                                            }
                                            expect(data.result).to.have.length(0);
                                            db.query({$collection: "states"}, function (err, data) {
                                                if (err) {
                                                    done(err);
                                                    return;
                                                }
                                                expect(data.result).to.have.length(0);
                                                db.query({$collection: "city"}, function (err, data) {
                                                    if (err) {
                                                        done(err);
                                                        return;
                                                    }
                                                    expect(data.result).to.have.length(0);
                                                    db.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                                                        if (err) {
                                                            done(err);
                                                            return;
                                                        }
                                                        expect(data.result).to.have.length(0);
                                                        done();
                                                    });
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        });

                    });
                })
            });
        });
    })


    it("insert then update transaction commit", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {$collection: "countries", $insert: [
                    {_id: 1, country: "USA", code: "01"}
                ]},
                {$collection: "countries", $update: [
                    {_id: 1, $set: { "country": "india"}}
                ]}

            ];
            db.startTransaction(function (err, txid) {
                db.batchUpdateById(updates, function (err, result) {
                    if (err) {
                        done(err);
                        return;
                    }
                    db.query({$collection: "countries"}, function (err, data) {
                        if (err) {
                            done(err);
                            return;
                        }

                        expect(data.result).to.have.length(1);
                        expect(data.result[0].country).to.eql("india");
                        expect(data.result[0].code).to.eql("01");


                        db.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                            if (err) {
                                done(err);
                                return;
                            }
                            console.log("data >>>>>>>>>>>>>>>>.transaction insert" + JSON.stringify(data));
                            expect(data.result).to.have.length(1);
                            expect(data.result[0].txid).to.eql(txid);
                            var txUpdates = data.result[0].updates;

                            var tx = txUpdates[0].tx;
                            expect(tx.collection).to.eql("countries");
//                            expect(tx.delete._id).to.eql(1);

                            db.commitTransaction(function (err) {
                                db.query({$collection: "countries"}, function (err, data) {
                                    if (err) {
                                        done(err);
                                        return;
                                    }
                                    expect(data.result).to.have.length(1);
                                    expect(data.result[0].country).to.eql("india");
                                    expect(data.result[0].code).to.eql("01");
                                    db.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                                        if (err) {
                                            done(err);
                                            return;
                                        }
                                        expect(data.result).to.have.length(0);
                                        done();
                                    });
                                });

                            });
                        });

                    });
                })
            });
        });
    });

    it("insert then update transaction rollback", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {$collection: "countries", $insert: [
                    {_id: 1, country: "USA", code: "01"}
                ]},
                {$collection: "countries", $update: [
                    {_id: 1, $set: { "country": "india"}}
                ]}

            ];
            db.startTransaction(function (err, txid) {
                db.batchUpdateById(updates, function (err, result) {
                    if (err) {
                        done(err);
                        return;
                    }
                    db.query({$collection: "countries"}, function (err, data) {
                        if (err) {
                            done(err);
                            return;
                        }

                        expect(data.result).to.have.length(1);
                        expect(data.result[0].country).to.eql("india");
                        expect(data.result[0].code).to.eql("01");


                        db.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                            if (err) {
                                done(err);
                                return;
                            }
                            console.log("data >>>>>>>>>>>>>>>>.transaction insert" + JSON.stringify(data));
                            expect(data.result).to.have.length(1);
                            expect(data.result[0].txid).to.eql(txid);
                            var txUpdates = data.result[0].updates;

                            var tx = txUpdates[0].tx;
                            expect(tx.collection).to.eql("countries");
//                            expect(tx.delete._id).to.eql(1);

                            db.rollbackTransaction(function (err) {
                                db.query({$collection: "countries"}, function (err, data) {
                                    if (err) {
                                        done(err);
                                        return;
                                    }
                                    expect(data.result).to.have.length(0);
                                    db.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                                        if (err) {
                                            done(err);
                                            return;
                                        }
                                        expect(data.result).to.have.length(0);
                                        done();
                                    });
                                });

                            });
                        });

                    });
                })
            });
        });
    });


    it("insert then update nested object transaction commit", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {$collection: "countries", $insert: [
                    {"_id": 1, "country": "USA", "code": 1, "state": {"state": "haryana", "rank": 100, "city": {"city": "hisar", "score": 200, "address": {"lineno": 300, "area": "near ketarpaul hospital"}}}}
                ]}
            ];

            db.startTransaction(function (err, txid) {
                if (err) {
                    done(err);
                    return;
                }
                db.batchUpdateById(updates, function (err, result) {
                    if (err) {
                        done(err);
                        return;
                    }
                    db.query({$collection: "countries"}, function (err, data) {
                        if (err) {
                            done(err);
                            return;
                        }
                        expect(data.result).to.have.length(1);
                        db.commitTransaction(function (err) {
                            if (err) {
                                done(err);
                                return;
                            }
                            db.startTransaction(function (err, txid) {
                                    var updates = [
                                        {$collection: "countries", $update: [
                                            {"_id": 1, "$inc": {"code": 10}, "$set": { "country": "india", "state": {"$set": {"state": "LA", "city": {"$set": {"city": "toronto", "address": {"$set": {"area": "daffodil"}, "$inc": {"lineno": 10}}}, "$inc": {"score": 10}}}, "$inc": {"rank": 10}}}}
                                        ]}
                                    ]


                                    db.batchUpdateById(updates, function (err, result) {
                                        if (err) {
                                            done(err);
                                            return;
                                        }
                                        db.query({$collection: "countries"}, function (err, data) {
                                            if (err) {
                                                done(err);
                                                return;
                                            }
                                            console.log("data after update>>>>>>>>>>>>>>>." + JSON.stringify(data));
                                            expect(data.result).to.have.length(1);
                                            expect(data.result[0].country).to.eql("india");
                                            expect(data.result[0].code).to.eql(11);
                                            expect(data.result[0].state.state).to.eql("LA");
                                            expect(data.result[0].state.rank).to.eql(110);
                                            expect(data.result[0].state.city.city).to.eql("toronto");
                                            expect(data.result[0].state.city.score).to.eql(210);
                                            expect(data.result[0].state.city.address.area).to.eql("daffodil");
                                            expect(data.result[0].state.city.address.lineno).to.eql(310);

                                            var tx = data.result[0].__txs__[txid].tx;
                                            console.log("tx>>>>>>>>>>>>>>>>>>>>>.." + JSON.stringify(tx));
                                            expect(tx._id).to.eql(data.result[0]._id);
                                            expect(tx.set).to.have.length(4);
                                            expect(tx.set[0].key).to.eql("country");
                                            expect(tx.set[0].value).to.eql("USA");
                                            expect(tx.set[1].key).to.eql("state.state");
                                            expect(tx.set[1].value).to.eql("haryana");
                                            expect(tx.set[2].key).to.eql("state.city.city");
                                            expect(tx.set[2].value).to.eql("hisar");
                                            expect(tx.set[3].key).to.eql("state.city.address.area");
                                            expect(tx.set[3].value).to.eql("near ketarpaul hospital");

                                            expect(tx.inc).to.have.length(4);
                                            expect(tx.inc[3].key).to.eql("code");
                                            expect(tx.inc[3].value).to.eql(-10);
                                            expect(tx.inc[2].key).to.eql("state.rank");
                                            expect(tx.inc[2].value).to.eql(-10);
                                            expect(tx.inc[1].key).to.eql("state.city.score");
                                            expect(tx.inc[1].value).to.eql(-10);
                                            expect(tx.inc[0].key).to.eql("state.city.address.lineno");
                                            expect(tx.inc[0].value).to.eql(-10);

                                            db.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                                                if (err) {
                                                    done(err);
                                                    return;
                                                }
                                                console.log("data >>>>>>>>>>>>>>>>.transaction insert" + JSON.stringify(data));
                                                expect(data.result).to.have.length(1);
                                                expect(data.result[0].txid).to.eql(txid);
                                                var txUpdates = data.result[0].updates;

                                                var tx = txUpdates[0].tx;

                                                expect(tx.collection).to.eql("countries");
                                                expect(tx.update._id).to.eql(1);

                                                db.commitTransaction(function (err) {
                                                    db.query({$collection: "countries"}, function (err, data) {
                                                        if (err) {
                                                            done(err);
                                                            return;
                                                        }
                                                        console.log("query after comit >>>" + JSON.stringify(data));
                                                        expect(data.result).to.have.length(1);
                                                        expect(data.result[0].country).to.eql("india");
                                                        expect(data.result[0].code).to.eql(11);
                                                        expect(data.result[0].state.state).to.eql("LA");
                                                        expect(data.result[0].state.rank).to.eql(110);
                                                        expect(data.result[0].state.city.city).to.eql("toronto");
                                                        expect(data.result[0].state.city.score).to.eql(210);
                                                        expect(data.result[0].state.city.address.area).to.eql("daffodil");
                                                        expect(data.result[0].state.city.address.lineno).to.eql(310);
                                                        db.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                                                            if (err) {
                                                                done(err);
                                                                return;
                                                            }
                                                            expect(data.result).to.have.length(0);
                                                            done();
                                                        });
                                                    });

                                                });
                                            });

                                        });
                                    })
                                }
                            )
                            ;

                        });
                    });
                });
            });

        });
    })

    it("insert then update nested object transaction rollback", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {$collection: "countries", $insert: [
                    {"_id": 1, "country": "USA", "code": 1, "state": {"state": "haryana", "rank": 100, "city": {"city": "hisar", "score": 200, "address": {"lineno": 300, "area": "near ketarpaul hospital"}}}}
                ]}
            ];

            db.startTransaction(function (err, txid) {
                if (err) {
                    done(err);
                    return;
                }
                db.batchUpdateById(updates, function (err, result) {
                    if (err) {
                        done(err);
                        return;
                    }
                    db.query({$collection: "countries"}, function (err, data) {
                        if (err) {
                            done(err);
                            return;
                        }
                        expect(data.result).to.have.length(1);
                        db.commitTransaction(function (err) {
                            if (err) {
                                done(err);
                                return;
                            }
                            db.startTransaction(function (err, txid) {
                                    var updates = [
                                        {$collection: "countries", $update: [
                                            {"_id": 1, "$inc": {"code": 10}, "$set": { "country": "india", "state": {"$set": {"state": "LA", "city": {"$set": {"city": "toronto", "address": {"$set": {"area": "daffodil"}, "$inc": {"lineno": 10}}}, "$inc": {"score": 10}}}, "$inc": {"rank": 10}}}}
                                        ]}
                                    ]


                                    db.batchUpdateById(updates, function (err, result) {
                                        if (err) {
                                            done(err);
                                            return;
                                        }
                                        db.query({$collection: "countries"}, function (err, data) {
                                            if (err) {
                                                done(err);
                                                return;
                                            }
                                            console.log("data after update>>>>>>>>>>>>>>>." + JSON.stringify(data));
                                            expect(data.result).to.have.length(1);
                                            expect(data.result[0].country).to.eql("india");
                                            expect(data.result[0].code).to.eql(11);
                                            expect(data.result[0].state.state).to.eql("LA");
                                            expect(data.result[0].state.rank).to.eql(110);
                                            expect(data.result[0].state.city.city).to.eql("toronto");
                                            expect(data.result[0].state.city.score).to.eql(210);
                                            expect(data.result[0].state.city.address.area).to.eql("daffodil");
                                            expect(data.result[0].state.city.address.lineno).to.eql(310);

                                            var tx = data.result[0].__txs__[txid].tx;
                                            console.log("tx>>>>>>>>>>>>>>>>>>>>>.." + JSON.stringify(tx));
                                            expect(tx._id).to.eql(data.result[0]._id);
                                            expect(tx.set).to.have.length(4);
                                            expect(tx.set[0].key).to.eql("country");
                                            expect(tx.set[0].value).to.eql("USA");
                                            expect(tx.set[1].key).to.eql("state.state");
                                            expect(tx.set[1].value).to.eql("haryana");
                                            expect(tx.set[2].key).to.eql("state.city.city");
                                            expect(tx.set[2].value).to.eql("hisar");
                                            expect(tx.set[3].key).to.eql("state.city.address.area");
                                            expect(tx.set[3].value).to.eql("near ketarpaul hospital");

                                            expect(tx.inc).to.have.length(4);
                                            expect(tx.inc[3].key).to.eql("code");
                                            expect(tx.inc[3].value).to.eql(-10);
                                            expect(tx.inc[2].key).to.eql("state.rank");
                                            expect(tx.inc[2].value).to.eql(-10);
                                            expect(tx.inc[1].key).to.eql("state.city.score");
                                            expect(tx.inc[1].value).to.eql(-10);
                                            expect(tx.inc[0].key).to.eql("state.city.address.lineno");
                                            expect(tx.inc[0].value).to.eql(-10);

                                            db.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                                                if (err) {
                                                    done(err);
                                                    return;
                                                }
                                                console.log("data >>>>>>>>>>>>>>>>.transaction insert" + JSON.stringify(data));
                                                expect(data.result).to.have.length(1);
                                                expect(data.result[0].txid).to.eql(txid);
                                                var txUpdates = data.result[0].updates;

                                                var tx = txUpdates[0].tx;

                                                expect(tx.collection).to.eql("countries");
                                                expect(tx.update._id).to.eql(1);

                                                db.rollbackTransaction(function (err) {
                                                    db.query({$collection: "countries"}, function (err, data) {
                                                        if (err) {
                                                            done(err);
                                                            return;
                                                        }
                                                        console.log("query after rollback >>>" + JSON.stringify(data));
                                                        expect(data.result).to.have.length(1);
                                                        expect(data.result[0].country).to.eql("USA");
                                                        expect(data.result[0].code).to.eql(1);
                                                        expect(data.result[0].state.state).to.eql("haryana");
                                                        expect(data.result[0].state.rank).to.eql(100);
                                                        expect(data.result[0].state.city.city).to.eql("hisar");
                                                        expect(data.result[0].state.city.score).to.eql(200);
                                                        expect(data.result[0].state.city.address.area).to.eql("near ketarpaul hospital");
                                                        expect(data.result[0].state.city.address.lineno).to.eql(300);
                                                        db.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                                                            if (err) {
                                                                done(err);
                                                                return;
                                                            }
                                                            expect(data.result).to.have.length(0);
                                                            done();
                                                        });
                                                    });

                                                });
                                            });

                                        });
                                    })
                                }
                            )
                            ;

                        });
                    });
                });
            });

        });
    });

    it("required values in old record rollback transaction", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }

            var modifyPerson = {   name: "modifyPerson", code: "transactionJob", source: "NorthwindTestCase/lib/PersonJob.js"};
            var trigger = [
                {
                    functionName: modifyPerson,
                    operations: ["insert", "delete", "update"],
                    when: "pre",
                    requiredfields: {"accountid.code": 1 }
                }
            ];

            var updates = [
                {$collection: "accounts", $insert: [
                    {"name": "bank", code: "c1" },
                    {"name": "cash", code: "c2" }
                ]},
                {$collection: {collection: "vouchers", "triggers": trigger, fields: [
                    {field: "accountid", type: "fk", upsert: false, collection: {collection: "accounts"}}
                ]}, $insert: [
                    {"_id": 1, "voucherNo": "1221", "accountid": {$query: {name: "bank"}} }
                ]}
            ];

            db.startTransaction(function (err, txid) {
                if (err) {
                    done(err);
                    return;
                }
                db.batchUpdateById(updates, function (err, result) {
                    if (err) {
                        done(err);
                        return;
                    }
                    db.query({$collection: "vouchers"}, function (err, data) {
                        if (err) {
                            done(err);
                            return;
                        }
                        console.log("data ater insert>>>>>>>>>>>>>>>>>>>>>>." + JSON.stringify(data));
                        expect(data.result).to.have.length(1);
                        expect(data.result[0].code).to.eql("c1");
                        db.commitTransaction(function (err) {
                            if (err) {
                                done(err);
                                return;
                            }
                            db.startTransaction(function (err, txid) {
                                var newUpdates = [
                                    {$collection: {collection: "vouchers", "triggers": trigger, fields: [
                                        {field: "accountid", type: "fk", upsert: false, collection: {collection: "accounts"}}
                                    ]}, $update: [
                                        {"_id": 1, $set: {"voucherNo": "2112", "accountid": {$query: {name: "cash"}}}}
                                    ]}
                                ]
                                db.batchUpdateById(newUpdates, function (err, result) {
                                    if (err) {
                                        done(err);
                                        return;
                                    }
                                    db.query({$collection: "vouchers"}, function (err, data) {
                                        if (err) {
                                            done(err);
                                            return;
                                        }
                                        console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>.data after update>>>>>>>>>>>>>>>." + JSON.stringify(data));
                                        expect(data.result).to.have.length(1);
                                        expect(data.result[0].voucherNo).to.eql("2112");
                                        expect(data.result[0].code).to.eql("c2");

                                        var tx = data.result[0].__txs__[txid].tx;
                                        console.log("tx>>>>>>>>>>>>>>>>>>>>>.." + JSON.stringify(tx));
                                        expect(tx._id).to.eql(data.result[0]._id);

                                        db.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                                            if (err) {
                                                done(err);
                                                return;
                                            }
                                            console.log("data >>>>>>>>>>>>>>>>.transaction insert" + JSON.stringify(data));
                                            expect(data.result).to.have.length(1);
                                            expect(data.result[0].txid).to.eql(txid);
                                            var txUpdates = data.result[0].updates;

                                            var tx = txUpdates[0].tx;

                                            expect(tx.collection).to.eql("vouchers");
                                            expect(tx.update._id).to.eql(1);

                                            db.rollbackTransaction(function (err) {
                                                db.query({$collection: "vouchers"}, function (err, data) {
                                                    if (err) {
                                                        done(err);
                                                        return;
                                                    }
                                                    console.log("query after rollback >>>" + JSON.stringify(data));
                                                    expect(data.result).to.have.length(1);
                                                    expect(data.result[0].code).to.eql("c1");
                                                    expect(data.result[0].accountid.code).to.eql(undefined);
                                                    db.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                                                        if (err) {
                                                            done(err);
                                                            return;
                                                        }
                                                        expect(data.result).to.have.length(0);
                                                        done();
                                                    });
                                                });

                                            });
                                        });

                                    });
                                })
                            });

                        });
                    });
                });
            });

        });
    });

    it("required values in old record delete case rollback transaction", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }

            var modifyPerson = {   name: "modifyPerson", code: "transactionJob", source: "NorthwindTestCase/lib/PersonJob.js"};
            var trigger = [
                {
                    functionName: modifyPerson,
                    operations: ["insert", "delete", "update"],
                    when: "pre",
                    requiredfields: {"accountid.code": 1 }
                }
            ];

            var updates = [
                {$collection: "accounts", $insert: [
                    {"name": "bank", code: "c1" },
                    {"name": "cash", code: "c2" }
                ]},
                {$collection: {collection: "vouchers", "triggers": trigger, fields: [
                    {field: "accountid", type: "fk", upsert: false, collection: {collection: "accounts"}}
                ]}, $insert: [
                    {"_id": 1, "voucherNo": "1221", "accountid": {$query: {name: "bank"}} }
                ]}
            ];

            db.startTransaction(function (err, txid) {
                if (err) {
                    done(err);
                    return;
                }
                db.batchUpdateById(updates, function (err, result) {
                    if (err) {
                        done(err);
                        return;
                    }
                    db.query({$collection: "vouchers"}, function (err, data) {
                        if (err) {
                            done(err);
                            return;
                        }
                        console.log("data ater insert>>>>>>>>>>>>>>>>>>>>>>." + JSON.stringify(data));
                        expect(data.result).to.have.length(1);
                        expect(data.result[0].code).to.eql("c1");
                        db.commitTransaction(function (err) {
                            if (err) {
                                done(err);
                                return;
                            }
                            db.startTransaction(function (err, txid) {
                                var newUpdates = [
                                    {$collection: {collection: "vouchers", "triggers": trigger, fields: [
                                        {field: "accountid", type: "fk", upsert: false, collection: {collection: "accounts"}}
                                    ]}, $delete: [
                                        {"_id": 1}
                                    ]}
                                ]
                                db.batchUpdateById(newUpdates, function (err, result) {
                                    if (err) {
                                        done(err);
                                        return;
                                    }
                                    db.query({$collection: "vouchers"}, function (err, data) {
                                        if (err) {
                                            done(err);
                                            return;
                                        }
                                        console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>.data after update>>>>>>>>>>>>>>>." + JSON.stringify(data));
                                        expect(data.result).to.have.length(0);


                                        db.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                                            if (err) {
                                                done(err);
                                                return;
                                            }
                                            console.log("data >>>>>>>>>>>>>>>>.transaction insert" + JSON.stringify(data));
                                            expect(data.result).to.have.length(1);
                                            expect(data.result[0].txid).to.eql(txid);
                                            var txUpdates = data.result[0].updates;

                                            var tx = txUpdates[0].tx;
                                            console.log("insert>>>>>>>>>>>>>>>>" + JSON.stringify(tx));
                                            expect(tx.collection).to.eql("vouchers");
                                            expect(tx.insert._id).to.eql(1);
                                            expect(tx.insert.voucherNo).to.eql("1221");

                                            db.rollbackTransaction(function (err) {
                                                db.query({$collection: "vouchers"}, function (err, data) {
                                                    if (err) {
                                                        done(err);
                                                        return;
                                                    }
                                                    console.log("query after rollback >>>" + JSON.stringify(data));
                                                    expect(data.result).to.have.length(1);
                                                    expect(data.result[0].code).to.eql("c1");
                                                    expect(data.result[0].accountid.code).to.eql(undefined);
                                                    db.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                                                        if (err) {
                                                            done(err);
                                                            return;
                                                        }
                                                        expect(data.result).to.have.length(0);
                                                        done();
                                                    });
                                                });

                                            });
                                        });

                                    });
                                })
                            });

                        });
                    });
                });
            });

        });
    });


    it("update with unset operator transaction commit", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {$collection: "countries", $insert: [
                    {_id: 1, country: "USA", code: "01", "score": 1000}
                ]}
            ];
            db.startTransaction(function (err, txid) {
                if (err) {
                    done(err);
                    return;
                }
                db.batchUpdateById(updates, function (err, result) {
                    if (err) {
                        done(err);
                        return;
                    }
                    db.query({$collection: "countries"}, function (err, data) {
                        if (err) {
                            done(err);
                            return;
                        }
                        expect(data.result).to.have.length(1);
                        expect(data.result[0].country).to.eql("USA");
                        expect(data.result[0].code).to.eql("01");
                        expect(data.result[0].score).to.eql(1000);
                        db.commitTransaction(function (err) {
                            if (err) {
                                done(err);
                                return;
                            }
                            db.startTransaction(function (err, txid) {
                                var update = [
                                    {$collection: "countries", $update: [
                                        {_id: 1, $set: {"country": "India", rank: "1111"}, $unset: {code: ""}}
                                    ]}
                                ];
                                db.batchUpdateById(update, function (err, result) {
                                    if (err) {
                                        done(err);
                                        return;
                                    }
                                    db.query({$collection: "countries"}, function (err, data) {
                                        if (err) {
                                            done(err);
                                            return;
                                        }
                                        console.log("countries >>>>>>>>>>>..after update>>>>>>>>>>>>>>>>>>>>." + JSON.stringify(data));
                                        expect(data.result).to.have.length(1);
                                        expect(data.result[0].country).to.eql("India");
                                        expect(data.result[0].score).to.eql(1000);
                                        expect(data.result[0].code).to.eql(undefined);

                                        var expectedUpdates = [
                                            {$collection: "countries", $update: [
                                                {_id: 1, $set: {"country": "India"}, $unset: {"code": ""}, $push: {__txs__: {$each: [
                                                    {txid: 1, tx: {_id: 1, $set: {"country": "USA", "code": "01"}, $inc: {score: -10}}}
                                                ]}}
                                                }
                                            ]}
                                        ]

                                        var tx = data.result[0].__txs__[txid].tx;
                                        console.log("tx>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(tx));
                                        expect(tx._id).to.eql(1);
                                        expect(tx.unset).to.have.length(1);
                                        expect(tx.unset[0].key).to.eql("rank");
                                        expect(tx.unset[0].value).to.eql(1);
                                        expect(tx.set).to.have.length(2);
                                        expect(tx.set[0].key).to.eql("country");
                                        expect(tx.set[0].value).to.eql("USA");
                                        expect(tx.set[1].key).to.eql("code");
                                        expect(tx.set[1].value).to.eql("01");


                                        db.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                                            if (err) {
                                                done(err);
                                                return;
                                            }

                                            var transactions =
                                            {_id: "1", txid: "1", updates: [
                                                {tx: {$collection: "countries", $update: [
                                                    {_id: 1}
                                                ]}}
                                            ]};
                                            console.log("transaction aster updater>>>>>>" + JSON.stringify(data));
                                            expect(data.result).to.have.length(1);
                                            expect(data.result[0].txid).to.eql(txid);
                                            var txUpdates = data.result[0].updates;
                                            var tx = txUpdates[0].tx;
                                            expect(tx.collection).to.eql("countries");
                                            expect(tx.update._id).to.eql(1);


                                            db.commitTransaction(function (err) {
                                                db.query({$collection: "countries"}, function (err, data) {
                                                    if (err) {
                                                        done(err);
                                                        return;
                                                    }
                                                    expect(data.result).to.have.length(1);
                                                    expect(data.result[0].country).to.eql("India");
                                                    expect(data.result[0].code).to.eql(undefined);
                                                    expect(data.result[0].rank).to.eql("1111");
                                                    db.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                                                        if (err) {
                                                            done(err);
                                                            return;
                                                        }
                                                        expect(data.result).to.have.length(0);
                                                        done();
                                                    });
                                                });
                                            });
                                        });
                                    });
                                })
                            });
                        })
                    });
                });

            })


        });
    });
    it("update with unset operator transaction rollback", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {$collection: "countries", $insert: [
                    {_id: 1, country: "USA", code: "01", "score": 1000}
                ]}
            ];
            db.startTransaction(function (err, txid) {
                if (err) {
                    done(err);
                    return;
                }
                db.batchUpdateById(updates, function (err, result) {
                    if (err) {
                        done(err);
                        return;
                    }
                    db.query({$collection: "countries"}, function (err, data) {
                        if (err) {
                            done(err);
                            return;
                        }
                        expect(data.result).to.have.length(1);
                        expect(data.result[0].country).to.eql("USA");
                        expect(data.result[0].code).to.eql("01");
                        expect(data.result[0].score).to.eql(1000);
                        db.commitTransaction(function (err) {
                            if (err) {
                                done(err);
                                return;
                            }
                            db.startTransaction(function (err, txid) {
                                var update = [
                                    {$collection: "countries", $update: [
                                        {_id: 1, $set: {"country": "India", rank: "22222"}, $unset: {code: ""}}
                                    ]}
                                ];
                                db.batchUpdateById(update, function (err, result) {
                                    if (err) {
                                        done(err);
                                        return;
                                    }
                                    db.query({$collection: "countries"}, function (err, data) {
                                        if (err) {
                                            done(err);
                                            return;
                                        }
                                        console.log("countries >>>>>>>>>>>..after update>>>>>>>>>>>>>>>>>>>>." + JSON.stringify(data));
                                        expect(data.result).to.have.length(1);
                                        expect(data.result[0].country).to.eql("India");
                                        expect(data.result[0].score).to.eql(1000);
                                        expect(data.result[0].code).to.eql(undefined);

                                        var expectedUpdates = [
                                            {$collection: "countries", $update: [
                                                {_id: 1, $set: {"country": "India"}, $unset: {"code": ""}, $push: {__txs__: {$each: [
                                                    {txid: 1, tx: {_id: 1, $set: {"country": "USA", "code": "01"}, $inc: {score: -10}}}
                                                ]}}
                                                }
                                            ]}
                                        ]

                                        var tx = data.result[0].__txs__[txid].tx;
                                        console.log("tx>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(tx));
                                        expect(tx._id).to.eql(1);
                                        expect(tx.unset).to.have.length(1);
                                        expect(tx.unset[0].key).to.eql("rank");
                                        expect(tx.unset[0].value).to.eql(1);
                                        expect(tx.set).to.have.length(2);
                                        expect(tx.set[0].key).to.eql("country");
                                        expect(tx.set[0].value).to.eql("USA");
                                        expect(tx.set[1].key).to.eql("code");
                                        expect(tx.set[1].value).to.eql("01");


                                        db.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                                            if (err) {
                                                done(err);
                                                return;
                                            }

                                            var transactions =
                                            {_id: "1", txid: "1", updates: [
                                                {tx: {$collection: "countries", $update: [
                                                    {_id: 1}
                                                ]}}
                                            ]};
                                            console.log("transaction aster updater>>>>>>" + JSON.stringify(data));
                                            expect(data.result).to.have.length(1);
                                            expect(data.result[0].txid).to.eql(txid);
                                            var txUpdates = data.result[0].updates;
                                            var tx = txUpdates[0].tx;
                                            expect(tx.collection).to.eql("countries");
                                            expect(tx.update._id).to.eql(1);


                                            db.rollbackTransaction(function (err) {
                                                db.query({$collection: "countries"}, function (err, data) {
                                                    if (err) {
                                                        done(err);
                                                        return;
                                                    }
                                                    expect(data.result).to.have.length(1);
                                                    expect(data.result[0].country).to.eql("USA");
                                                    expect(data.result[0].code).to.eql("01");
                                                    expect(data.result[0].rank).to.eql(undefined);
                                                    db.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                                                        if (err) {
                                                            done(err);
                                                            return;
                                                        }
                                                        expect(data.result).to.have.length(0);
                                                        done();
                                                    });
                                                });
                                            });
                                        });
                                    });
                                })
                            });
                        })
                    });
                });

            })


        });
    });

    it("parallel transaction case when updating txs in document -- on the basis of count", function (done) {
        function whenDone(done) {
            ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
                if (err) {
                    done(err);
                    return;
                }
                db.query({$collection: "countries"}, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log("data in countries>>>>>>>>>>>>>>>>>>>>>>.." + JSON.stringify(data));
                    expect(data.result).to.have.length(1);
                    expect(data.result[0].country).to.eql("pakistan");
                    expect(data.result[0].code).to.eql("92");
                    expect(data.result[0]._id).to.eql("india");
                    done();
                })
            });
        }


        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            ApplaneDB.connect(Config.URL, Config.DB, function (err, db1) {
                if (err) {
                    done(err);
                    return;
                }
                var updates = [
                    {$collection: "countries", $insert: [
                        {_id: "india", country: "india", code: "91"}
                    ]}
                ];
                db.batchUpdateById(updates, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log("**************************after inserting ********************************************");
                    var update1 = [
                        {$collection: "countries", $update: [
                            {_id: "india", $set: {country: "pakistan"}}
                        ]}
                    ];
                    var update2 = [
                        {$collection: "countries", $update: [
                            {_id: "india", $set: {code: "92"}}
                        ]}
                    ];
                    db.startTransaction(function (err, txid1) {
                        if (err) {
                            done(err);
                            return
                        }
                        db1.startTransaction(function (err, txid2) {
                            var count = 0;
                            db.batchUpdateById(update1, function (err, data) {
                                if (err) {
                                    done(err);
                                    return;
                                }
                                db.commitTransaction(function (err) {
                                    if (err) {
                                        done(err);
                                        return;
                                    }
                                    count = count + 1;
                                    if (count == 2) {
                                        whenDone(done);
                                    }
                                })
                            });
                            db1.batchUpdateById(update2, function (err, data) {
                                if (err) {
                                    done(err)
                                    return;
                                }
                                count = count + 1;
                                if (count == 2) {
                                    whenDone(done);
                                }
                                db1.commitTransaction(function (err) {
                                    if (err) {
                                        done(err);
                                        return;
                                    }
                                    count = count + 1;
                                    if (count == 2) {
                                        whenDone(done);
                                    }
                                })
                            })

                        })

                    });


                });
            });
        });
    });

    it("cancel document testcase in insert case pre job", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            console.log("test case connected")
            if (err) {
                done(err);
                return;
            }
            var modifyPerson = {   name: "modifyPerson", code: "cancelDocument", source: "NorthwindTestCase/lib/PersonJob.js"};
            var trigger = [
                {
                    functionName: modifyPerson,
                    operations: ["insert", "delete", "update"],
                    when: "pre"
                }
            ];
            var updates = [
                {$collection: {collection: "countries", triggers: trigger}, $insert: [
                    {_id: 1, country: "USA", code: "01"}
                ]}
            ];
            db.startTransaction(function (err, txid) {
                if (err) {
                    done(err);
                    return;
                }
                db.batchUpdateById(updates, function (err) {
                    console.log("batch update")
                    if (err) {
                        done(err);
                        return;
                    }
                    db.query({$collection: "countries"}, function (err, data) {
                        if (err) {
                            done(err);
                            return
                        }
                        console.log("data after insert>>>>>>>>>>>>>>>>" + JSON.stringify(data));
                        expect(data.result).to.have.length(0);
                        db.query({$collection: "pl.txs"}, function (err, data) {
                            if (err) {
                                done(err);
                                return;
                            }
                            console.log("data in transactoins>>>" + JSON.stringify(data));
                            expect(data.result).to.have.length(1);
                            expect(data.result[0].txid).to.eql(txid);
                            expect(data.result[0].updates).to.have.length(0)
                            db.commitTransaction(function (err) {
                                if (err) {
                                    done(err);
                                    return
                                }
                                db.query({$collection: "countries"}, function (err, data) {
                                    if (err) {
                                        done(err);
                                        return;
                                    }
                                    expect(data.result).to.have.length(0);
                                    db.query({$collection: "__txs__"}, function (err, data) {
                                        if (err) {
                                            done(err);
                                            return;
                                        }
                                        expect(data.result).to.have.length(0);
                                        done();
                                    });
                                });
                            });
                        });
                    });
                });
            });
        })
    });

    it("cancel document testcase in update case", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var modifyPerson = {   name: "modifyPerson", code: "cancelDocumentUpdate", source: "NorthwindTestCase/lib/PersonJob.js"};
            var trigger = [
                {
                    functionName: modifyPerson,
                    operations: ["insert", "delete", "update"],
                    when: "pre"
                }
            ];
            var updates = [
                {$collection: {collection: "countries"}, $insert: [
                    {_id: 1, country: "USA", code: "01"}
                ]}
            ];
            db.startTransaction(function (err, txid) {
                if (err) {
                    done(err);
                    return;
                }
                db.batchUpdateById(updates, function (err) {
                    if (err) {
                        done(err);
                        return;
                    }
                    db.query({$collection: "countries"}, function (err, data) {
                        if (err) {
                            done(err);
                            return
                        }
                        console.log("data after insert>>>>>>>>>>>>>>>>" + JSON.stringify(data));
                        expect(data.result).to.have.length(1);

                        db.query({$collection: "pl.txs"}, function (err, data) {
                            if (err) {
                                done(err);
                                return;
                            }
                            console.log("data in transactions>>>" + JSON.stringify(data));
                            expect(data.result).to.have.length(1);
                            expect(data.result[0].txid).to.eql(txid);
                            expect(data.result[0].updates).to.have.length(1);
                            var txUpdates = data.result[0].updates;
                            var tx = txUpdates[0].tx;
                            console.log("tx>>>>>" + JSON.stringify(tx));
                            expect(tx.collection).to.eql("countries");
//                            expect(tx.delete._id).to.eql(1);
                            var updates = [
                                {$collection: {collection: "countries", triggers: trigger}, $update: [
                                    {_id: 1, $set: {country: "INDIA"}}
                                ]}
                            ];
                            db.batchUpdateById(updates, function (err) {
                                if (err) {
                                    done(err);
                                    return;
                                }
                                db.query({$collection: "countries"}, function (err, data) {
                                    if (err) {
                                        done(err);
                                        return;
                                    }
                                    console.log("Data after updation>>>>>>>>>>>>>>>>>>>>>." + JSON.stringify(data));
                                    expect(data.result).to.have.length(1);
                                    expect(data.result[0].country).to.eql("USA");
                                    db.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                                        if (err) {
                                            done(err);
                                            return;
                                        }
                                        console.log("transaction>>>>>>>>>>>.." + JSON.stringify(data));
                                        expect(data.result).to.have.length(1);
                                        db.commitTransaction(function (err) {
                                            if (err) {
                                                done(err);
                                                return
                                            }
                                            db.query({$collection: "countries"}, function (err, data) {
                                                if (err) {
                                                    done(err);
                                                    return;
                                                }
                                                console.log("Data after updation>>>>>>>>>>>>>>>>>>>>>." + JSON.stringify(data));
                                                expect(data.result).to.have.length(1);
                                                db.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                                                    if (err) {
                                                        done(err);
                                                        return;
                                                    }
                                                    console.log("transaction>>>>>>>>>>>.." + JSON.stringify(data));
                                                    expect(data.result).to.have.length(0);
                                                    done();
                                                });
                                            });
                                        });
                                    });
                                });
                            });


                        });
                    });
                });
            });
        })
    });


    it.skip("server problem while rollback", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {$collection: "countries", $insert: [
                    {_id: 1, country: "USA", code: "01"}
                ]}
            ];
            done();
        });
    });


    it.skip("throw error when inc in array with insert or delete");
    it.skip("first insert and then delete in same transaction in array");


    it.skip("insert and delete  operation from trigger in object multiple type field transaction commit", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var onInsert = {   name: "onInsert", code: "preInsert", source: "NorthwindTestCase/lib/PersonJob.js"};
            var trigger = [
                {
                    functionName: onInsert,
                    operations: ["update"],
                    when: "pre"
                }
            ];
            var updates = [
                {"$collection": {"collection": "countries", triggers: trigger, "fields": [
                    {"field": "states", "type": "object", "multiple": true, sort: "rank", "fields": [
                        {"field": "state", "type": "string"},
                        {"field": "rank", "type": "number"}
                    ]}
                ]}, $insert: [
                    {_id: 1, country: "USA", code: "01", "score": 1000, address: {city: "hisar", state: "haryana", "lineno": 1}, states: [
                        {state: "jammu", _id: "jammu", rank: 1},
                        {state: "delhi", _id: "delhi", rank: 2},
                        {state: "himachal", _id: "himachal", rank: 3},
                        {state: "punjab", _id: "punjab", rank: 4}
                    ]}
                ]}
            ];
            db.startTransaction(function (err, txid) {
                if (err) {
                    done(err);
                    return;
                }
                db.batchUpdateById(updates, function (err, result) {
                    if (err) {
                        done(err);
                        return;
                    }
                    db.query({$collection: "countries"}, function (err, data) {
                        if (err) {
                            done(err);
                            return;
                        }
                        console.log("data>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(data));
                        expect(data.result).to.have.length(1);
                        expect(data.result[0].country).to.eql("USA");
                        expect(data.result[0].code).to.eql("01");
                        expect(data.result[0].score).to.eql(1000);
                        expect(data.result[0].address.city).to.eql("hisar");
                        expect(data.result[0].address.state).to.eql("haryana");
                        expect(data.result[0].address.lineno).to.eql(1);
                        expect(data.result[0].address.lineno).to.eql(1);
                        expect(data.result[0].states).to.have.length(4);
                        expect(data.result[0].states[0].state).to.eql("jammu");
                        expect(data.result[0].states[0].rank).to.eql(1);
                        expect(data.result[0].states[1].state).to.eql("delhi");
                        expect(data.result[0].states[1].rank).to.eql(2);
                        expect(data.result[0].states[2].state).to.eql("himachal");
                        expect(data.result[0].states[2].rank).to.eql(3);
                        expect(data.result[0].states[3].state).to.eql("punjab");
                        expect(data.result[0].states[3].rank).to.eql(4);
                        db.commitTransaction(function (err) {
                            if (err) {
                                done(err);
                                return;
                            }
                            db.startTransaction(function (err, txid) {
                                var update = [
                                    {$collection: {"collection": "countries", triggers: trigger, "fields": [
                                        {"field": "states", "type": "object", "multiple": true, "fields": [
                                            {"field": "state", "type": "string"},
                                            {"field": "rank", "type": "number"}
                                        ]}
                                    ]}, $update: [
                                        {_id: 1, $set: {"country": "India", address: {$set: {city: "Hisar1"}, $inc: { lineno: 12}}, states: {$insert: [
                                            {"state": "rajasthan", _id: "rajasthan", rank: 5},
                                            {"state": "bihar", _id: "bihar", rank: 6}
                                        ],
                                            $update: [
                                                {_id: "jammu", $set: {"state": "JK"}, $inc: {rank: 10}},
                                                {_id: "himachal", $set: {"state": "HP"}, $inc: {rank: 20}}
                                            ],
                                            $delete: [
                                                {_id: "punjab"}
                                            ]
                                        }
                                        }, $inc: {
                                            score: 10
                                        }
                                        }
                                    ]
                                    }
                                ];
                                db.batchUpdateById(update, function (err, result) {
                                    if (err) {
                                        done(err);
                                        return;
                                    }
                                    db.query({$collection: "countries"}, function (err, data) {
                                        if (err) {
                                            done(err);
                                            return;
                                        }
                                        console.log("data of countries after update>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(data));
                                        expect(data.result).to.have.length(1);
                                        expect(data.result[0].country).to.eql("India");
                                        expect(data.result[0].score).to.eql(1010);
                                        expect(data.result[0].address.city).to.eql("Hisar1");
                                        expect(data.result[0].address.lineno).to.eql(13);
                                        expect(data.result[0].states).to.have.length(5);

                                        expect(data.result[0].states[0].state).to.eql("JK");
                                        expect(data.result[0].states[1].state).to.eql("delhi");
                                        expect(data.result[0].states[2].state).to.eql("HP");
                                        expect(data.result[0].states[3].state).to.eql("rajasthan");
                                        expect(data.result[0].states[4].state).to.eql("bihar");
                                        expect(data.result[0].states[0].rank).to.eql(11);
                                        expect(data.result[0].states[1].rank).to.eql(2);
                                        expect(data.result[0].states[2].rank).to.eql(23);
                                        expect(data.result[0].states[3].rank).to.eql(5);
                                        expect(data.result[0].states[4].rank).to.eql(6);

                                        var tx = data.result[0].__txs__[txid].tx;
                                        console.log("*********tx>>>>>>>>>>>>>>>>>>" + JSON.stringify(tx));

                                        expect(tx.set).to.have.length(2);
                                        expect(tx.set[0].key).to.eql("country");
                                        expect(tx.set[0].value).to.eql("USA");
                                        expect(tx.set[1].key).to.eql("address.city");
                                        expect(tx.set[1].value).to.eql("hisar");

                                        expect(tx.inc).to.have.length(2);
                                        expect(tx.inc[0].key).to.eql("address.lineno");
                                        expect(tx.inc[0].value).to.eql(-12);
                                        expect(tx.inc[1].key).to.eql("score");
                                        expect(tx.inc[1].value).to.eql(-10);


                                        console.log("***********array****************" + JSON.stringify(tx.array.length));
                                        expect(tx.array).to.have.length(8);

                                        console.log("***********array0****************" + JSON.stringify(tx.array[0]));
                                        expect(tx.array[0].field).to.eql("states");
                                        expect(tx.array[0].type).to.eql("update");
                                        expect(tx.array[0]._id).to.eql("jammu");
                                        expect(tx.array[0].inc).to.have.length(1);
                                        expect(tx.array[0].inc[0].key).to.eql("rank");
                                        expect(tx.array[0].inc[0].value).to.eql(-10);
                                        expect(tx.array[0].set).to.have.length(1);
                                        expect(tx.array[0].set[0].key).to.eql("state");
                                        expect(tx.array[0].set[0].value).to.eql("jammu");
                                        console.log("***********array1****************" + JSON.stringify(tx.array[1]));
                                        expect(tx.array[1].field).to.eql("states");
                                        expect(tx.array[1].type).to.eql("update");
                                        expect(tx.array[1]._id).to.eql("himachal");
                                        expect(tx.array[1].inc).to.have.length(1);
                                        expect(tx.array[1].inc[0].key).to.eql("rank");
                                        expect(tx.array[1].inc[0].value).to.eql(-20);
                                        expect(tx.array[1].set).to.have.length(1);
                                        expect(tx.array[1].set[0].key).to.eql("state");
                                        expect(tx.array[1].set[0].value).to.eql("himachal");
                                        console.log("***********array2****************" + JSON.stringify(tx.array[2]));
                                        expect(tx.array[2].field).to.eql("states");
                                        expect(tx.array[2].type).to.eql("insert");
                                        expect(tx.array[2]._id).to.eql("punjab");
                                        expect(tx.array[2].value.state).to.eql("punjab");
                                        expect(tx.array[2].value._id).to.eql("punjab");
                                        expect(tx.array[2].value.rank).to.eql(4);
                                        console.log("***********array3****************" + JSON.stringify(tx.array[3]));

                                        expect(tx.array[3].field).to.eql("states");
                                        expect(tx.array[3].type).to.eql("delete");
                                        expect(tx.array[3]._id).to.eql("rajasthan");


                                        expect(tx.array[4].field).to.eql("states");
                                        expect(tx.array[4].type).to.eql("delete");
                                        expect(tx.array[4]._id).to.eql("bihar");


                                        expect(tx.array[5].field).to.eql("languages");
                                        expect(tx.array[5].type).to.eql("update");
                                        expect(tx.array[5]._id).to.eql("urdu");
                                        expect(tx.array[5].set).to.have.length(2);
                                        expect(tx.array[5].set[0].key).to.eql("language");
                                        expect(tx.array[5].set[0].value).to.eql("Urdu");
                                        expect(tx.array[5].set[1].key).to.eql("score");
                                        expect(tx.array[5].set[1].value).to.eql(null);

                                        console.log("tx>>>" + JSON.stringify(tx.array[6]))
                                        expect(tx.array[6].field).to.eql("languages");
                                        expect(tx.array[6].type).to.eql("insert");
                                        expect(tx.array[6].value.language).to.eql("German");

                                        expect(tx.array[7].field).to.eql("languages");
                                        expect(tx.array[7].type).to.eql("delete");

                                        db.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                                            if (err) {
                                                done(err);
                                                return;
                                            }
                                            var transactions =
                                            {_id: "1", txid: "1", updates: [
                                                {tx: {$collection: "countries", $update: [
                                                    {_id: 1}
                                                ]}}
                                            ]};
                                            console.log("data of transaxction>>>" + JSON.stringify(data));
                                            expect(data.result).to.have.length(1);
                                            expect(data.result[0].txid).to.eql(txid);
                                            expect(data.result[0].updates).to.have.length(1);
                                            var txUpdates = data.result[0].updates;
                                            var tx = txUpdates[0].tx;
                                            expect(tx.collection).to.eql("countries");
                                            expect(tx.update._id).to.eql(1);


                                            db.commitTransaction(function (err) {
                                                db.query({$collection: "countries"}, function (err, data) {
                                                    if (err) {
                                                        done(err);
                                                        return;
                                                    }
                                                    console.log("Data after comamit >>>" + JSON.stringify(data));
                                                    expect(data.result).to.have.length(1);
                                                    expect(data.result[0].country).to.eql("India");
                                                    expect(data.result[0].score).to.eql(1010);
                                                    expect(data.result[0].address.city).to.eql("Hisar1");
                                                    expect(data.result[0].address.state).to.eql("haryana");
                                                    expect(data.result[0].address.lineno).to.eql(13);
                                                    expect(data.result[0].states).to.have.length(5);
                                                    expect(data.result[0].states[0].state).to.eql("JK");
                                                    expect(data.result[0].states[1].state).to.eql("delhi");
                                                    expect(data.result[0].states[2].state).to.eql("HP");
                                                    expect(data.result[0].states[3].state).to.eql("rajasthan");
                                                    expect(data.result[0].states[4].state).to.eql("bihar");
                                                    expect(data.result[0].states[0].rank).to.eql(11);
                                                    expect(data.result[0].states[1].rank).to.eql(2);
                                                    expect(data.result[0].states[2].rank).to.eql(23);
                                                    expect(data.result[0].states[3].rank).to.eql(5);
                                                    expect(data.result[0].states[4].rank).to.eql(6);
                                                    db.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                                                        if (err) {
                                                            done(err);
                                                            return;
                                                        }
                                                        expect(data.result).to.have.length(0);
                                                        done();
                                                    });
                                                });
                                            });
                                        });
                                    });
                                })
                            });
                        })
                    });
                });

            })
        })
        ;
    })

    it("duplicate error while rollback", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var update = {$collection: "countries", $insert: [
                {_id: "india", country: "india"},
                {_id: "usa", country: "usa"}
            ]};
            db.batchUpdateById(update, function (err, data) {
                if (err) {
                    done(err);
                    return;
                }
                db.startTransaction(function (err, txid) {
                    if (err) {
                        done(err);
                        return;
                    }
                    var newUpdate = [
                        {$collection: "countries", $delete: [
                            {_id: "india"}
                        ]},
                        {$collection: "countries", $update: [
                            {_id: "usa", $set: {country: "USA"}}
                        ]}
                    ];
                    db.batchUpdateById(newUpdate, function (err, result) {
                        if (err) {
                            done(err);
                            return;
                        }
                        db.query({$collection: "countries"}, function (err, data) {
                            if (err) {
                                done(err);
                                return;
                            }
                            console.log("data> in countries after delete and update>>>>>>>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(data));
                            expect(data.result).to.have.length(1);
                            var tx = data.result[0].__txs__[txid].tx;
                            expect(tx._id).to.eql(data.result[0]._id);
                            expect(tx.set).to.have.length(1);
                            expect(tx.set[0].key).to.eql("country");
                            expect(tx.set[0].value).to.eql("usa");
                            db.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                                if (err) {
                                    done(err);
                                    return;
                                }
                                console.log("data in transactions >>>>>>>>>>>>>>>>>>>" + JSON.stringify(data));
                                expect(data.result).to.have.length(1);
                                expect(data.result[0].txid).to.eql(txid);
                                expect(data.result[0].updates).to.have.length(2);
                                var txUpdates = data.result[0].updates;
                                var tx = txUpdates[0].tx;
                                expect(tx.collection).to.eql("countries");
                                expect(tx.insert.country).to.eql("india");

                                var tx = txUpdates[1].tx;
                                expect(tx.collection).to.eql("countries");
                                expect(tx.update._id).to.eql("usa");


                                //insert again before rollback
                                var update = {$collection: "countries", $insert: [
                                    {_id: "india", country: "india"}
                                ]}
                                db.batchUpdate(update, function (err, result) {
                                    if (err) {
                                        done(err);
                                        return;
                                    }
                                    db.query({$collection: "countries"}, function (err, data) {
                                        if (err) {
                                            done(err);
                                            return;
                                        }
                                        console.log("data> in countries after insert again>>>>>>>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(data));
                                        expect(data.result).to.have.length(2);
                                        console.log(":rollbacking transactions");
                                        db.rollbackTransaction(function (err) {
                                            if (err) {
                                                done(err);
                                                return;
                                            }
                                            db.query({$collection: "countries"}, function (err, data) {
                                                if (err) {
                                                    done(err);
                                                    return;
                                                }
                                                console.log("data in countries after rollback >>>>>>>>>>>>>>>>>>>" + JSON.stringify(data));
                                                expect(data.result).to.have.length(2);
                                                expect(data.result[0].country).to.eql("usa");
                                                expect(data.result[0]._id).to.eql("usa");
                                                expect(data.result[1].country).to.eql("india");
                                                expect(data.result[1]._id).to.eql("india");

                                                db.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                                                    if (err) {
                                                        done(err);
                                                        return;
                                                    }
                                                    console.log("data in transactions after rollback >>>>>>>>>>>>>>>>>>>" + JSON.stringify(data));
                                                    expect(data.result).to.have.length(0);
                                                    done();
                                                })
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });

            });
        });
    });
})
;

