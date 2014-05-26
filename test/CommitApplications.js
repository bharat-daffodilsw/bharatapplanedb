/**
 *
 * mocha --recursive --timeout 150000 -g "commit applications testcase" --reporter spec
 * simpleCollection update and commit in admin
 * need to handle case of rollback transaction if error occurs.
 * mocha --recursive --timeout 150000 -g "simpleCollection insert and rollback and commit in admin" --reporter spec
 */

var expect = require('chai').expect;
var ApplaneDB = require("../lib/DB.js");
var Config = require("./config.js");
var NorthwindDb = require("./NorthwindDb.js");
var Utils = require("ApplaneCore/apputil/util.js");
var ApplaneDBConfig = require("ApplaneDB/Config.js");
var Constants = require("../lib/Constants.js");
var configureOptions = {url:Config.URL, admin:{db:"northwindadmindb", localdb:Config.DB, username:"northiwndadmin", password:"1234"}};

describe("commit applications testcase", function () {

    before(function (done) {
        ApplaneDB.configure(configureOptions, function (err) {
            if (err) {
                done(err);
                return;
            }
            done();
        })
    })

    afterEach(function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            db.dropDatabase(function (err) {
                ApplaneDB.connect(ApplaneDBConfig.URL, ApplaneDBConfig.Admin.DB, function (err, adminDb) {
                    adminDb.dropDatabase(function (err) {
                        done(err);
                    });
                });
            })
        });
    })

    it("simpleCollection insert and commit in admin", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {
                    $collection:Constants.Admin.COLLECTIONS,
                    $insert:[
                        { collection:"states"},
                        { collection:"countries"}
                    ]
                }
            ]
            db.batchUpdateById(updates, function (err, res) {
                if (err) {
                    done(err);
                    return;
                }
                db.query({$collection:Constants.Admin.COLLECTIONS, $sort:{collection:1}}, function (err, collections) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log("collections >>>>>>>>>>>>>>>>" + JSON.stringify(collections));
                    expect(collections.result).to.have.length(2);
                    expect(collections.result[0].collection).to.eql("countries");
                    expect(collections.result[0].__type__).to.eql("insert");
                    expect(collections.result[1].collection).to.eql("states");
                    expect(collections.result[1].__type__).to.eql("insert");
                    db.invokeFunction("commit", [
                        {commit:true}
                    ], function (err, res) {
                        if (err) {
                            done(err);
                            return;
                        }
                        db.adminDB(function (err, adminDb) {
                            if (err) {
                                done(err);
                                return;
                            }
                            db.db.collection(Constants.Admin.COLLECTIONS).find().toArray(function (err, localCollections) {
                                if (err) {
                                    done(err);
                                    return;
                                }
                                console.log("localCollections >>>>>>>>>>>>>>>>" + JSON.stringify(localCollections));
                                expect(localCollections).to.have.length(0);
                                adminDb.db.collection(Constants.Admin.COLLECTIONS).find({}, {sort:{collection:1}}).toArray(function (err, adminCollections) {
                                    if (err) {
                                        done(err);
                                        return;
                                    }
                                    console.log("adminCollections >>>>>>>>>>>>>>>>" + JSON.stringify(adminCollections));
                                    expect(adminCollections).to.have.length(2);
                                    expect(adminCollections[0].collection).to.eql("countries");
                                    expect(adminCollections[0].__type__).to.eql(undefined);
                                    expect(adminCollections[1].collection).to.eql("states");
                                    expect(adminCollections[1].__type__).to.eql(undefined);
                                    db.query({$collection:Constants.Admin.COLLECTIONS, $sort:{collection:1}}, function (err, collections) {
                                        if (err) {
                                            done(err);
                                            return;
                                        }
                                        console.log("collections >>>>>>>>>>>>>>>>" + JSON.stringify(collections));
                                        expect(collections.result).to.have.length(2);
                                        expect(collections.result[0].collection).to.eql("countries");
                                        expect(collections.result[0].__type__).to.eql(undefined);
                                        expect(collections.result[1].collection).to.eql("states");
                                        expect(collections.result[1].__type__).to.eql(undefined);
                                        done();
                                    })
                                })
                            })
                        })
                    })
                })
            })
        })
    })

    it("simpleCollection insert and rollback and commit in admin", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            db.adminDB(function (err, adminDb) {
                if (err) {
                    done(err);
                    return;
                }
                var updates = [
                    {
                        $collection:Constants.Admin.COLLECTIONS,
                        $insert:[
                            {collection:"states"}
                        ]
                    }
                ]
                adminDb.batchUpdateById(updates, function (err, res) {
                    if (err) {
                        done(err);
                        return;
                    }
                    adminDb.db.collection(Constants.Admin.COLLECTIONS).ensureIndex({collection:1}, {name:"Collection", unique:true}, function (err) {
                        if (err) {
                            done(err);
                            return;
                        }
                        adminDb.query({$collection:Constants.Admin.COLLECTIONS, $sort:{collection:1}}, function (err, collections) {
                            if (err) {
                                done(err);
                                return;
                            }
                            console.log("collections >>>>>>>>>>>>>>>>" + JSON.stringify(collections));
                            expect(collections.result).to.have.length(1);
                            expect(collections.result[0].collection).to.eql("states");
                            expect(collections.result[0].__type__).to.eql(undefined);
                            var updates = [
                                {
                                    $collection:Constants.Admin.COLLECTIONS,
                                    $insert:[
                                        {collection:"countries"},
                                        {collection:"states"}
                                    ],
                                    $modules:{TriggerModule:0}
                                }
                            ];
                            db.batchUpdateById(updates, function (err, res) {
                                if (err) {
                                    done(err);
                                    return;
                                }
                                db.query({$collection:Constants.Admin.COLLECTIONS, $sort:{collection:1}}, function (err, collections) {
                                    if (err) {
                                        done(err);
                                        return;
                                    }
                                    console.log("collections >>>>>>>>>>>>>>>>" + JSON.stringify(collections));
                                    expect(collections.result).to.have.length(3);
                                    db.invokeFunction("commit", [
                                        {commit:true}
                                    ], function (err, res) {
                                        if (err) {
                                            db.db.collection(Constants.Admin.COLLECTIONS).find().toArray(function (err, localCollections) {
                                                if (err) {
                                                    done(err);
                                                    return;
                                                }
                                                console.log("localCollections >>>>>>>>>>>>>>>>" + JSON.stringify(localCollections));
                                                expect(localCollections).to.have.length(1);
                                                adminDb.db.collection(Constants.Admin.COLLECTIONS).find({}, {sort:{collection:1}}).toArray(function (err, adminCollections) {
                                                    if (err) {
                                                        done(err);
                                                        return;
                                                    }
                                                    console.log("adminCollections >>>>>>>>>>>>>>>>" + JSON.stringify(adminCollections));
                                                    expect(adminCollections).to.have.length(2);
                                                    done();
                                                })
                                            })
                                        } else {
                                            done("Not ok");
                                        }
                                    })
                                })
                            })
                        })
                    })
                })
            })
        })
    })

    it("simpleCollection delete and commit in admin", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {
                    $collection:Constants.Admin.COLLECTIONS,
                    $insert:[
                        { collection:"states"},
                        { collection:"countries"}
                    ]
                }
            ]
            db.batchUpdateById(updates, function (err, res) {
                if (err) {
                    done(err);
                    return;
                }
                db.query({$collection:Constants.Admin.COLLECTIONS, $sort:{collection:1}}, function (err, collections) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log("collections >>>>>>>>>>>>>>>>" + JSON.stringify(collections));
                    expect(collections.result).to.have.length(2);
                    expect(collections.result[0].collection).to.eql("countries");
                    expect(collections.result[0].__type__).to.eql("insert");
                    expect(collections.result[1].collection).to.eql("states");
                    expect(collections.result[1].__type__).to.eql("insert");
                    db.invokeFunction("commit", [
                        {commit:true}
                    ], function (err, res) {
                        if (err) {
                            done(err);
                            return;
                        }
                        db.adminDB(function (err, adminDb) {
                            if (err) {
                                done(err);
                                return;
                            }
                            db.db.collection(Constants.Admin.COLLECTIONS).find().toArray(function (err, localCollections) {
                                if (err) {
                                    done(err);
                                    return;
                                }
                                console.log("localCollections >>>>>>>>>>>>>>>>" + JSON.stringify(localCollections));
                                expect(localCollections).to.have.length(0);
                                adminDb.db.collection(Constants.Admin.COLLECTIONS).find({}, {sort:{collection:1}}).toArray(function (err, adminCollections) {
                                    if (err) {
                                        done(err);
                                        return;
                                    }
                                    console.log("adminCollections >>>>>>>>>>>>>>>>" + JSON.stringify(adminCollections));
                                    expect(adminCollections).to.have.length(2);
                                    expect(adminCollections[0].collection).to.eql("countries");
                                    expect(adminCollections[0].__type__).to.eql(undefined);
                                    expect(adminCollections[1].collection).to.eql("states");
                                    expect(adminCollections[1].__type__).to.eql(undefined);
                                    db.query({$collection:Constants.Admin.COLLECTIONS, $sort:{collection:1}}, function (err, collections) {
                                        if (err) {
                                            done(err);
                                            return;
                                        }
                                        console.log("collections >>>>>>>>>>>>>>>>" + JSON.stringify(collections));
                                        expect(collections.result).to.have.length(2);
                                        expect(collections.result[0].collection).to.eql("countries");
                                        expect(collections.result[0].__type__).to.eql(undefined);
                                        expect(collections.result[1].collection).to.eql("states");
                                        expect(collections.result[1].__type__).to.eql(undefined);
                                        var update = [
                                            {$collection:"pl.collections", $delete:[
                                                {_id:collections.result[0]._id}
                                            ]}
                                        ]
                                        db.batchUpdateById(update, function (err, res) {
                                            if (err) {
                                                done(err);
                                                return;
                                            }
                                            db.db.collection(Constants.Admin.COLLECTIONS).find().toArray(function (err, localCollections) {
                                                if (err) {
                                                    done(err);
                                                    return;
                                                }
                                                console.log("localCollections >>>>>>>>>>>>>>>>" + JSON.stringify(localCollections));
                                                expect(localCollections).to.have.length(1);
                                                expect(localCollections[0]._id).to.eql(collections.result[0]._id);
                                                expect(localCollections[0].__type__).to.eql("delete");
                                                db.query({$collection:"pl.collections"}, function (err, res) {
                                                    if (err) {
                                                        done(err);
                                                        return;
                                                    }
                                                    console.log("res>>>>>>>>>>>>>" + JSON.stringify(res));
                                                    expect(res.result).to.have.length(1);
                                                    expect(res.result[0].collection).to.eql("states");
                                                    expect(res.result[0].__type__).to.eql(undefined);
                                                    db.invokeFunction("commit", [
                                                        {commit:true}
                                                    ], function (err, res) {
                                                        if (err) {
                                                            done(err);
                                                            return;
                                                        }
                                                        db.db.collection(Constants.Admin.COLLECTIONS).find().toArray(function (err, localCollections) {
                                                            if (err) {
                                                                done(err);
                                                                return;
                                                            }
                                                            console.log("localCollections >>>>>>>>>>>>>>>>" + JSON.stringify(localCollections));
                                                            expect(localCollections).to.have.length(0);
                                                            adminDb.db.collection(Constants.Admin.COLLECTIONS).find({}, {sort:{collection:1}}).toArray(function (err, adminCollections) {
                                                                if (err) {
                                                                    done(err);
                                                                    return;
                                                                }
                                                                console.log("adminCollections >>>>>>>>>>>>>>>>" + JSON.stringify(adminCollections));
                                                                expect(adminCollections).to.have.length(1);
                                                                expect(adminCollections[0].collection).to.eql("states");
                                                                expect(adminCollections[0].__type__).to.eql(undefined);
                                                                done();
                                                            })
                                                        })
                                                    })
                                                })
                                            })
                                        })
                                    })
                                })
                            })
                        })
                    })
                })
            })
        })
    })

    it("simpleCollection update and commit in admin", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {
                    $collection:Constants.Admin.COLLECTIONS,
                    $insert:[
                        { collection:"states"},
                        { collection:"countries"}
                    ]
                }
            ]
            db.batchUpdateById(updates, function (err, res) {
                if (err) {
                    done(err);
                    return;
                }
                db.query({$collection:Constants.Admin.COLLECTIONS, $sort:{collection:1}}, function (err, collections) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log("collections >>>>>>>>>>>>>>>>" + JSON.stringify(collections));
                    expect(collections.result).to.have.length(2);
                    expect(collections.result[0].collection).to.eql("countries");
                    expect(collections.result[0].__type__).to.eql("insert");
                    expect(collections.result[1].collection).to.eql("states");
                    expect(collections.result[1].__type__).to.eql("insert");
                    db.invokeFunction("commit", [
                        {commit:true}
                    ], function (err, res) {
                        if (err) {
                            done(err);
                            return;
                        }
                        db.adminDB(function (err, adminDb) {
                            if (err) {
                                done(err);
                                return;
                            }
                            db.db.collection(Constants.Admin.COLLECTIONS).find().toArray(function (err, localCollections) {
                                if (err) {
                                    done(err);
                                    return;
                                }
                                console.log("localCollections >>>>>>>>>>>>>>>>" + JSON.stringify(localCollections));
                                expect(localCollections).to.have.length(0);
                                adminDb.db.collection(Constants.Admin.COLLECTIONS).find({}, {sort:{collection:1}}).toArray(function (err, adminCollections) {
                                    if (err) {
                                        done(err);
                                        return;
                                    }
                                    console.log("adminCollections >>>>>>>>>>>>>>>>" + JSON.stringify(adminCollections));
                                    expect(adminCollections).to.have.length(2);
                                    expect(adminCollections[0].collection).to.eql("countries");
                                    expect(adminCollections[0].__type__).to.eql(undefined);
                                    expect(adminCollections[1].collection).to.eql("states");
                                    expect(adminCollections[1].__type__).to.eql(undefined);
                                    db.query({$collection:Constants.Admin.COLLECTIONS, $sort:{collection:1}}, function (err, collections) {
                                        if (err) {
                                            done(err);
                                            return;
                                        }
                                        console.log("collections >>>>>>>>>>>>>>>>" + JSON.stringify(collections));
                                        expect(collections.result).to.have.length(2);
                                        expect(collections.result[0].collection).to.eql("countries");
                                        expect(collections.result[0].__type__).to.eql(undefined);
                                        expect(collections.result[1].collection).to.eql("states");
                                        expect(collections.result[1].__type__).to.eql(undefined);
                                        var update = [
                                            {$collection:"pl.collections", $update:[
                                                {_id:collections.result[0]._id, $set:{alias:"COUNTRIES"}}
                                            ]}
                                        ]
                                        db.batchUpdateById(update, function (err, res) {
                                            if (err) {
                                                done(err);
                                                return;
                                            }
                                            db.db.collection(Constants.Admin.COLLECTIONS).find().toArray(function (err, localCollections) {
                                                if (err) {
                                                    done(err);
                                                    return;
                                                }
                                                console.log("localCollections >>>>>>>>>>>>>>>>" + JSON.stringify(localCollections));
                                                expect(localCollections).to.have.length(1);
                                                expect(localCollections[0]._id).to.eql(collections.result[0]._id);
                                                expect(localCollections[0].__type__).to.eql(undefined);
                                                expect(localCollections[0].alias).to.eql("COUNTRIES");
                                                db.query({$collection:"pl.collections", $sort:{collection:1}}, function (err, res) {
                                                    if (err) {
                                                        done(err);
                                                        return;
                                                    }
                                                    console.log("res>>>>>>>>>>>>>" + JSON.stringify(res));
                                                    expect(res.result).to.have.length(2);
                                                    expect(res.result[0].collection).to.eql("countries");
                                                    expect(res.result[0].__type__).to.eql(undefined);
                                                    expect(res.result[0].alias).to.eql("COUNTRIES");
                                                    expect(res.result[1].collection).to.eql("states");
                                                    expect(res.result[1].__type__).to.eql(undefined);
                                                    db.invokeFunction("commit", [
                                                        {commit:true}
                                                    ], function (err, res) {
                                                        if (err) {
                                                            done(err);
                                                            return;
                                                        }
                                                        db.db.collection(Constants.Admin.COLLECTIONS).find().toArray(function (err, localCollections) {
                                                            if (err) {
                                                                done(err);
                                                                return;
                                                            }
                                                            console.log("localCollections >>>>>>>>>>>>>>>>" + JSON.stringify(localCollections));
                                                            expect(localCollections).to.have.length(0);
                                                            adminDb.db.collection(Constants.Admin.COLLECTIONS).find({}, {sort:{collection:1}}).toArray(function (err, res) {
                                                                if (err) {
                                                                    done(err);
                                                                    return;
                                                                }
                                                                console.log("adminCollections >>>>>>>>>>>>>>>>" + JSON.stringify(res));
                                                                expect(res).to.have.length(2);
                                                                expect(res[0].collection).to.eql("countries");
                                                                expect(res[0].__type__).to.eql(undefined);
                                                                expect(res[0].alias).to.eql("COUNTRIES");
                                                                expect(res[1].collection).to.eql("states");
                                                                expect(res[1].__type__).to.eql(undefined);
                                                                done();
                                                            })
                                                        })
                                                    })
                                                })
                                            })
                                        })
                                    })
                                })
                            })
                        })
                    })
                })
            })
        })
    })

    it.skip("fields update and commit in admin", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {
                    $collection:Constants.Admin.COLLECTIONS,
                    $insert:[
                        { collection:"states"},
                        { collection:"countries"}
                    ]
                }
            ]
            db.batchUpdateById(updates, function (err, res) {
                if (err) {
                    done(err);
                    return;
                }
                db.query({$collection:Constants.Admin.COLLECTIONS, $sort:{collection:1}}, function (err, collections) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log("collections >>>>>>>>>>>>>>>>" + JSON.stringify(collections));
                    expect(collections.result).to.have.length(2);
                    expect(collections.result[0].collection).to.eql("countries");
                    expect(collections.result[0].__type__).to.eql("insert");
                    expect(collections.result[1].collection).to.eql("states");
                    expect(collections.result[1].__type__).to.eql("insert");
                    db.invokeFunction("commit", [
                        {commit:true}
                    ], function (err, res) {
                        if (err) {
                            done(err);
                            return;
                        }
                        db.adminDB(function (err, adminDb) {
                            if (err) {
                                done(err);
                                return;
                            }
                            db.db.collection(Constants.Admin.COLLECTIONS).find().toArray(function (err, localCollections) {
                                if (err) {
                                    done(err);
                                    return;
                                }
                                console.log("localCollections >>>>>>>>>>>>>>>>" + JSON.stringify(localCollections));
                                expect(localCollections).to.have.length(0);
                                adminDb.db.collection(Constants.Admin.COLLECTIONS).find({}, {sort:{collection:1}}).toArray(function (err, adminCollections) {
                                    if (err) {
                                        done(err);
                                        return;
                                    }
                                    console.log("adminCollections >>>>>>>>>>>>>>>>" + JSON.stringify(adminCollections));
                                    expect(adminCollections).to.have.length(2);
                                    expect(adminCollections[0].collection).to.eql("countries");
                                    expect(adminCollections[0].__type__).to.eql(undefined);
                                    expect(adminCollections[1].collection).to.eql("states");
                                    expect(adminCollections[1].__type__).to.eql(undefined);
                                    db.query({$collection:Constants.Admin.COLLECTIONS, $sort:{collection:1}}, function (err, collections) {
                                        if (err) {
                                            done(err);
                                            return;
                                        }
                                        console.log("collections >>>>>>>>>>>>>>>>" + JSON.stringify(collections));
                                        expect(collections.result).to.have.length(2);
                                        expect(collections.result[0].collection).to.eql("countries");
                                        expect(collections.result[0].__type__).to.eql(undefined);
                                        expect(collections.result[1].collection).to.eql("states");
                                        expect(collections.result[1].__type__).to.eql(undefined);
                                        var update = [
                                            {$collection:"pl.collections", $update:[
                                                {_id:collections.result[0]._id, $set:{alias:"COUNTRIES"}}
                                            ]}
                                        ]
                                        db.batchUpdateById(update, function (err, res) {
                                            if (err) {
                                                done(err);
                                                return;
                                            }
                                            db.db.collection(Constants.Admin.COLLECTIONS).find().toArray(function (err, localCollections) {
                                                if (err) {
                                                    done(err);
                                                    return;
                                                }
                                                console.log("localCollections >>>>>>>>>>>>>>>>" + JSON.stringify(localCollections));
                                                expect(localCollections).to.have.length(1);
                                                expect(localCollections[0]._id).to.eql(collections.result[0]._id);
                                                expect(localCollections[0].__type__).to.eql(undefined);
                                                expect(localCollections[0].alias).to.eql("COUNTRIES");
                                                db.query({$collection:"pl.collections", $sort:{collection:1}}, function (err, res) {
                                                    if (err) {
                                                        done(err);
                                                        return;
                                                    }
                                                    console.log("res>>>>>>>>>>>>>" + JSON.stringify(res));
                                                    expect(res.result).to.have.length(2);
                                                    expect(res.result[0].collection).to.eql("countries");
                                                    expect(res.result[0].__type__).to.eql(undefined);
                                                    expect(res.result[0].alias).to.eql("COUNTRIES");
                                                    expect(res.result[1].collection).to.eql("states");
                                                    expect(res.result[1].__type__).to.eql(undefined);
                                                    db.invokeFunction("commit", [
                                                        {commit:true}
                                                    ], function (err, res) {
                                                        if (err) {
                                                            done(err);
                                                            return;
                                                        }
                                                        db.db.collection(Constants.Admin.COLLECTIONS).find().toArray(function (err, localCollections) {
                                                            if (err) {
                                                                done(err);
                                                                return;
                                                            }
                                                            console.log("localCollections >>>>>>>>>>>>>>>>" + JSON.stringify(localCollections));
                                                            expect(localCollections).to.have.length(0);
                                                            adminDb.db.collection(Constants.Admin.COLLECTIONS).find({}, {sort:{collection:1}}).toArray(function (err, res) {
                                                                if (err) {
                                                                    done(err);
                                                                    return;
                                                                }
                                                                console.log("adminCollections >>>>>>>>>>>>>>>>" + JSON.stringify(res));
                                                                expect(res).to.have.length(2);
                                                                expect(res[0].collection).to.eql("countries");
                                                                expect(res[0].__type__).to.eql(undefined);
                                                                expect(res[0].alias).to.eql("COUNTRIES");
                                                                expect(res[1].collection).to.eql("states");
                                                                expect(res[1].__type__).to.eql(undefined);
                                                                done();
                                                            })
                                                        })
                                                    })
                                                })
                                            })
                                        })
                                    })
                                })
                            })
                        })
                    })
                })
            })
        })
    })
})

