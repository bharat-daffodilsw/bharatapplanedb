/**
 * Created with IntelliJ IDEA.
 * User: Rajit
 * Date: 17/5/14
 * Time: 11:56 AM
 * To change this template use File | Settings | File Templates.
 */

/**
 * mocha --recursive --timeout 30000 -g "IndexVerification" --reporter spec
 * Created with IntelliJ IDEA.
 * User: Rajit
 * Date: 15/5/14
 * Time: 9:59 AM
 * To change this template use File | Settings | File Templates.
 */
var expect = require('chai').expect;
var ApplaneDB = require("../lib/DB.js");
var Config = require("./config.js");
var Constants = require("ApplaneDB/lib/Constants.js");
var Utils = require("ApplaneCore/apputil/util.js");


describe("IndexVerification", function () {
    afterEach(function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            db.dropDatabase(function (err) {
                done(err);
            })
        });
    })

    it("insert Indexes Verification", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var insert = [
                {$collection:"pl.collections", $insert:[
                    {_id:11, "collection":"states"},
                    {_id:12, "collection":"countries"}
                ]}
            ]
            db.batchUpdateById(insert, function (err, result) {
                if (err) {
                    done(err);
                    return;
                }
                db.query({$collection:"pl.collections"}, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    var insert1 = [
                        {$collection:"pl.fields", $insert:[
                            {field:"state", type:"string", collectionid:{$query:{"collection":"states"}}},
                            {field:"code", type:"number", collectionid:{$query:{"collection":"states"}}},
                            {field:"city", type:"string", collectionid:{$query:{"collection":"states"}}},
                            {field:"country", type:"string", collectionid:{$query:{"collection":"countries"}}}
                        ]}
                    ]
                    db.batchUpdateById(insert1, function (err, result) {
                        if (err) {
                            done(err);
                            return;
                        }
                        db.query({$collection:"pl.fields"}, function (err, data) {
                            if (err) {
                                done(err);
                                return;
                            }
                            var insert2 = [
                                {$collection:"pl.indexes", $insert:[
                                    {_id:"1232212", name:"state_data", collectionid:{$query:{"collection":"states"}}, unique:true, multikey:true, fields:[{field:"state", value:1},{field:"city", value:-1}]},
                                     {_id:"1232111", name:"state_data1", collectionid:{$query:{"collection":"states"}}, unique:false, field:"code", multikey:false},
                                    {_id:"12333115", name:"country_data", collectionid:{$query:{"collection":"countries"}}, unique:true, field:"country", multikey:false}
                                ]}
                            ]
                            db.batchUpdateById(insert2, function (err, result) {
                                if (err) {
                                    done(err);
                                    return;
                                }
                                db.db.collection("states").indexes(function (err, res) {
                                    if (err) {
                                        done(err);
                                        return;
                                    }
                                    var index = undefined;
                                    for (var i = 0; i < res.length; i++) {
                                        if (res[i].name === "state_data") {
                                            if (res[i].key.state === 1) {
                                                index = i;
                                            }
                                        }
                                    }
                                    expect(res[index].name).to.eql("state_data");
                                    expect(res[index].key.state).to.eql(1);
                                    expect(res[index].key.city).to.eql(-1);
                                });



                                db.db.collection("countries").indexes(function (err, res) {
                                    if (err) {
                                        done(err);
                                        return;
                                    }
                                    var index = undefined;
                                    for (var i = 0; i < res.length; i++) {
                                        if (res[i].name === "country_data") {
                                            if (res[i].key.country === 1) {
                                                index = i;
                                            }
                                        }
                                    }
                                    expect(res[index].name).to.eql("country_data");
                                    expect(res[index].key.country).to.eql(1);
                                    done();
                                });
                            })
                        })
                    })
                })
            })
        })
    })
    it("update Indexes Verification", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var insert = [
                {$collection:"pl.collections", $insert:[
                    {_id:11, "collection":"states"},
                    {_id:12, "collection":"countries"}
                ]}
            ]
            db.batchUpdateById(insert, function (err, result) {
                if (err) {
                    done(err);
                    return;
                }
                db.query({$collection:"pl.collections"}, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    var insert1 = [
                        {$collection:"pl.fields", $insert:[
                            {field:"state", type:"string", collectionid:{$query:{"collection":"states"}}},
                            {field:"code", type:"number", collectionid:{$query:{"collection":"states"}}},
                            {field:"city", type:"string", collectionid:{$query:{"collection":"states"}}},
                            {field:"country", type:"string", collectionid:{$query:{"collection":"countries"}}}
                        ]}
                    ]
                    db.batchUpdateById(insert1, function (err, result) {
                        if (err) {
                            done(err);
                            return;
                        }
                        db.query({$collection:"pl.fields"}, function (err, data) {
                            if (err) {
                                done(err);
                                return;
                            }
                            var insert2 = [
                                {$collection:"pl.indexes", $insert:[
                                    {_id:"1232212", name:"state_data", collectionid:{$query:{"collection":"states"}}, unique:true, multikey:true, fields:[{field:"state", value:1},{field:"city", value:-1}]}
                                ]}
                            ]
                            db.batchUpdateById(insert2, function (err, result) {
                                if (err) {
                                    done(err);
                                    return;
                                }
                                db.query({$collection:"pl.indexes"}, function (err, data) {
                                    if (err) {
                                        done(err);
                                        return;
                                    }
                                    var update = [
                                        {$collection:"pl.indexes", $update:[
                                            {_id:"1232212", $set:{fields:[{field:"code", value:1},{field:"city", value:-1}]}}
                                        ]}
                                    ]
                                    db.batchUpdateById(update, function (err, result) {
                                        if (err) {
                                            done(err);
                                            return;
                                        }
                                        db.db.collection("states").indexes(function (err, res) {
                                            if (err) {
                                                done(err);
                                                return;
                                            }
                                            var index = undefined;
                                            for (var i = 0; i < res.length; i++) {
                                                if (res[i].name === "state_data") {
                                                    if (res[i].key.code === 1) {
                                                        index = i;
                                                    }
                                                }
                                            }
                                            expect(Object.keys(res[index].key).length).to.eql(2);
                                            expect(res[index].name).to.eql("state_data");
                                            expect(res[index].key.code).to.eql(1);
                                            expect(res[index].key.city).to.eql(-1);
                                            done();
                                        });
                                    })
                                })
                            })
                        })
                    })
                })
            })
        })
    })
    it("delete Indexes Verification", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var insert = [
                {$collection:"pl.collections", $insert:[
                    {_id:11, "collection":"states"},
                    {_id:12, "collection":"countries"}
                ]}
            ]
            db.batchUpdateById(insert, function (err, result) {
                if (err) {
                    done(err);
                    return;
                }
                db.query({$collection:"pl.collections"}, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    var insert1 = [
                        {$collection:"pl.fields", $insert:[
                            {field:"state", type:"string", collectionid:{$query:{"collection":"states"}}},
                            {field:"code", type:"number", collectionid:{$query:{"collection":"states"}}},
                            {field:"city", type:"string", collectionid:{$query:{"collection":"states"}}},
                            {field:"country", type:"string", collectionid:{$query:{"collection":"countries"}}}
                        ]}
                    ]
                    db.batchUpdateById(insert1, function (err, result) {
                        if (err) {
                            done(err);
                            return;
                        }
                        db.query({$collection:"pl.fields"}, function (err, data) {
                            if (err) {
                                done(err);
                                return;
                            }
                            var insert2 = [
                                {$collection:"pl.indexes", $insert:[
                                    {_id:"1232212", name:"state_data", collectionid:{$query:{"collection":"states"}}, unique:false, field:"state", multikey:false}
                                ]}
                            ]
                            db.batchUpdateById(insert2, function (err, result) {
                                if (err) {
                                    done(err);
                                    return;
                                }
                                db.query({$collection:"pl.indexes"}, function (err, data) {
                                    if (err) {
                                        done(err);
                                        return;
                                    }
                                    var update = [
                                        {$collection:"pl.indexes", $delete:[
                                            {_id:"1232212"}
                                        ]}
                                    ]
                                    db.batchUpdateById(update, function (err, result) {
                                        if (err) {
                                            done(err);
                                            return;
                                        }
                                        db.db.collection("states").indexes(function (err, res) {
                                            if (err) {
                                                done(err);
                                                return;
                                            }
                                            index = undefined;
                                            for (var i = 0; i < res.length; i++) {
                                                if (res[i].name === "state_data") {
                                                    if (res[i].key.state === 1) {
                                                        index = i;
                                                    }
                                                }
                                            }
                                            expect(index).to.eql(undefined);
                                            expect(res[index]).is.not.ok;
                                            done();
                                        });
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

