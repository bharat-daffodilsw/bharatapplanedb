/**
 * Created with IntelliJ IDEA.
 * User: Rajit
 * Date: 15/5/14
 * Time: 9:59 AM
 * To change this template use File | Settings | File Templates.
 */
var expect = require('chai').expect;
var ApplaneDB = require("../lib/DB.js");
var Config = require("./config.js");


describe("FieldValidationTestcase", function () {
    afterEach(function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            db.dropDatabase(function (err) {
                done(err);
            })
        });
    })
    it("Fields Verification Simple", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var insert = [
                {$collection:"pl.collections", $insert:[
                    {_id:11, "collection":"country"},
                    {_id:12, "collection":"states"}  ,
                    {_id:13, "collection":"task"}
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
                    /* console.log("data>>>" + JSON.stringify(data));*/
                    var insert2 = [
                        {$collection:"pl.fields", $insert:[
                            {field:"name", type:"string", collectionid:{$query:{"collection":"country"}}},
                            {field:"address", type:"string", collectionid:{$query:{"collection":"states"}}},
                            {field:"line1", type:"string", collectionid:{$query:{"collection":"states"}}},
                            {field:"Area", type:"string", collectionid:{$query:{"collection":"states"}}},
                            {field:"city", type:"string", collectionid:{$query:{"collection":"states"}}},
                            {field:"state", type:"string", collectionid:{$query:{"collection":"states"}}},

                            {field:"code", type:"number", collectionid:{$query:{"collection":"country"}}},
                            {field:"stateId", type:"fk", collectionid:{$query:{"collection":"country"}}, collection:"states", displayField:"state", set:["address", "line1", "Area", "city", "state"]}
                        ]}
                    ]
                    db.batchUpdateById(insert2, function (err, result) {
                        if (err) {
                            done(err);
                            return;
                        }
                        db.query({$collection:"pl.fields"}, function (err, data) {
                            if (err) {
                                done(err);
                                return;
                            }
                            /*  console.log("field data>>>" + JSON.stringify(data));*/
                            done();
                        });
                    })
                });
            });
        })
    })


    it("Fields Verification with error", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var insert = [
                {$collection:"pl.collections", $insert:[
                    {_id:1001, "collection":"cities"},
                    {_id:1002, "collection":"states"}  ,
                    {_id:1003, "collection":"countries"}   ,
                    {_id:1004, "collection":"continents"}
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
                    var insert2 = [
                        {$collection:"pl.fields", $insert:[
                            {field:"city", type:"string", collectionid:{$query:{"collection":"cities"}}},

                            {field:"state", type:"string", collectionid:{$query:{"collection":"states"}}},
                            {field:"code", type:"number", collectionid:{$query:{"collection":"states"}}},
                            {field:"city1", type:"string", collectionid:{$query:{"collection":"states"}}},


                            {field:"profile", type:"object", collectionid:{$query:{"collection":"states"}}},
                            {field:"name", type:"string", "parentfieldid":{$query:{"field":"profile", collectionid:{$query:{"collection":"states"}}}}, collectionid:{$query:{"collection":"states"}}},
                            {field:"code", type:"string", "parentfieldid":{$query:{"field":"profile", collectionid:{$query:{"collection":"states"}}}}, collectionid:{$query:{"collection":"states"}}},
                            {field:"address", type:"object", "parentfieldid":{$query:{"field":"profile", collectionid:{$query:{"collection":"states"}}}}, collectionid:{$query:{"collection":"states"}}},
                            {field:"line1", type:"string", "parentfieldid":{$query:{"field":"address", collectionid:{$query:{"collection":"states"}}}}, collectionid:{$query:{"collection":"states"}}},
                            {field:"line2", type:"string", "parentfieldid":{$query:{"field":"address", collectionid:{$query:{"collection":"states"}}}}, collectionid:{$query:{"collection":"states"}}},
                            {field:"city", type:"object", "parentfieldid":{$query:{"field":"address", collectionid:{$query:{"collection":"states"}}}}, collectionid:{$query:{"collection":"states"}}},
                            {field:"cityname", type:"string", "parentfieldid":{$query:{"field":"city", collectionid:{$query:{"collection":"states"}}}}, collectionid:{$query:{"collection":"states"}}},
                            {field:"code", type:"string", "parentfieldid":{$query:{"field":"city", collectionid:{$query:{"collection":"states"}}}}, collectionid:{$query:{"collection":"states"}}},

                            {field:"country", type:"string", collectionid:{$query:{"collection":"countries"}}},

                            {field:"continent", type:"string", collectionid:{$query:{"collection":"continents"}}},
                            {field:"code", type:"string", collectionid:{$query:{"collection":"continents"}}},
                            {field:"countryid", type:"fk", collectionid:{$query:{"collection":"states"}}, collection:"countries"},
                            {field:"continentid", type:"fk", collectionid:{$query:{"collection":"countries"}}, collection:"continents"},
                            {field:"stateid", type:"fk", collectionid:{$query:{"collection":"cities"}}, collection:"states", displayField:"city1", set:["code", "state", "profile.address.line1", "profile.address.city.code", "profile.name1", "profile.code", "countryid.country", "countryid.continentid.continent"] }

                        ]}
                    ]
                    db.batchUpdateById(insert2, function (err, result) {
                        if (err) {
                            if (err.toString().indexOf("field [name1] not found in collection [states]") != -1) {
                                done();
                            } else {
                                done(err);
                            }
                        } else {
                            done("Not Ok");
                        }
                    })
                });
            });
        })
    })


    it("Fields Verification without error", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var insert = [
                {$collection:"pl.collections", $insert:[
                    {_id:1001, "collection":"cities"},
                    {_id:1002, "collection":"states"}  ,
                    {_id:1003, "collection":"countries"}   ,
                    {_id:1004, "collection":"continents"}
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
                    var insert2 = [
                        {$collection:"pl.fields", $insert:[
                            {field:"city", type:"string", collectionid:{$query:{"collection":"cities"}}},

                            {field:"state", type:"string", collectionid:{$query:{"collection":"states"}}},
                            {field:"code", type:"number", collectionid:{$query:{"collection":"states"}}},
                            {field:"city1", type:"string", collectionid:{$query:{"collection":"states"}}},


                            {field:"profile", type:"object", collectionid:{$query:{"collection":"states"}}},
                            {field:"name", type:"string", "parentfieldid":{$query:{"field":"profile", collectionid:{$query:{"collection":"states"}}}}, collectionid:{$query:{"collection":"states"}}},
                            {field:"code", type:"string", "parentfieldid":{$query:{"field":"profile", collectionid:{$query:{"collection":"states"}}}}, collectionid:{$query:{"collection":"states"}}},
                            {field:"address", type:"object", "parentfieldid":{$query:{"field":"profile", collectionid:{$query:{"collection":"states"}}}}, collectionid:{$query:{"collection":"states"}}},
                            {field:"line1", type:"string", "parentfieldid":{$query:{"field":"address", collectionid:{$query:{"collection":"states"}}}}, collectionid:{$query:{"collection":"states"}}},
                            {field:"line2", type:"string", "parentfieldid":{$query:{"field":"address", collectionid:{$query:{"collection":"states"}}}}, collectionid:{$query:{"collection":"states"}}},
                            {field:"city", type:"object", "parentfieldid":{$query:{"field":"address", collectionid:{$query:{"collection":"states"}}}}, collectionid:{$query:{"collection":"states"}}},
                            {field:"cityname", type:"string", "parentfieldid":{$query:{"field":"city", collectionid:{$query:{"collection":"states"}}}}, collectionid:{$query:{"collection":"states"}}},
                            {field:"code", type:"string", "parentfieldid":{$query:{"field":"city", collectionid:{$query:{"collection":"states"}}}}, collectionid:{$query:{"collection":"states"}}},

                            {field:"country", type:"string", collectionid:{$query:{"collection":"countries"}}},

                            {field:"continent", type:"string", collectionid:{$query:{"collection":"continents"}}},
                            {field:"code", type:"string", collectionid:{$query:{"collection":"continents"}}},
                            {field:"countryid", type:"fk", collectionid:{$query:{"collection":"states"}}, collection:"countries"},
                            {field:"continentid", type:"fk", collectionid:{$query:{"collection":"countries"}}, collection:"continents"},
                            {field:"stateid", type:"fk", collectionid:{$query:{"collection":"cities"}}, collection:"states", displayField:"city1", set:["code", "state", "profile.address.line1", "profile.address.city.code", "profile.name", "profile.code", "countryid.country", "countryid.continentid.continent"] },
                            {field:"Person", type:"object", collectionid:{$query:{"collection":"cities"}}, query:JSON.stringify({"$collection":"states"}), multiple:true, fk:"code"}


                        ]}
                    ]
                    db.batchUpdateById(insert2, function (err, result) {
                        if (err) {
                            done(err);
                            return;
                        }
                        db.query({$collection:"pl.fields"}, function (err, data) {
                            if (err) {
                                done(err);
                                return;
                            }
                            expect(data.result).to.have.length(20);
                            expect(data.result[0].field).to.eql("city");
                            expect(data.result[1].collectionid.collection).to.eql("states");
                            expect(data.result[10].parentfieldid.field).to.eql("address");
                            expect(data.result[14].field).to.eql("continent");
                            expect(data.result[18].field).to.eql("stateid");
                            expect(data.result[18].type).to.eql("fk");
                            expect(data.result[18].collection).to.eql("states");
                            expect(data.result[18].displayField).to.eql("city1");
                            expect(data.result[18].set).to.have.length(9);
                            expect(data.result[18].set).to.eql(["code", "state", "profile.address.line1", "profile.address.city.code", "profile.name", "profile.code", "countryid.country", "countryid.continentid.continent" , "city1"]);
                            expect(data.result[19].type).to.eql("object");
                            expect(data.result[19].multiple).to.eql(true);
                            expect(data.result[19].fk).to.eql("code");
                            done();
                        })
                    })
                });
            });
        })
    })
    it("Fields Verification grid", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var insert = [
                {$collection:"pl.collections", $insert:[
                    {_id:1001, "collection":"cities"},
                    {_id:1002, "collection":"states"}  ,
                    {_id:1003, "collection":"countries"}   ,
                    {_id:1004, "collection":"continents"}
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
                    var insert2 = [
                        {$collection:"pl.fields", $insert:[
                            {field:"city", type:"string", collectionid:{$query:{"collection":"cities"}}},

                            {field:"state", type:"string", collectionid:{$query:{"collection":"states"}}},
                            {field:"code", type:"number", collectionid:{$query:{"collection":"states"}}},
                            {field:"city1", type:"string", collectionid:{$query:{"collection":"states"}}},


                            {field:"profile", type:"object", collectionid:{$query:{"collection":"states"}}},
                            {field:"name", type:"string", "parentfieldid":{$query:{"field":"profile", collectionid:{$query:{"collection":"states"}}}}, collectionid:{$query:{"collection":"states"}}},
                            {field:"code", type:"string", "parentfieldid":{$query:{"field":"profile", collectionid:{$query:{"collection":"states"}}}}, collectionid:{$query:{"collection":"states"}}},
                            {field:"address", type:"object", "parentfieldid":{$query:{"field":"profile", collectionid:{$query:{"collection":"states"}}}}, collectionid:{$query:{"collection":"states"}}},
                            {field:"line1", type:"string", "parentfieldid":{$query:{"field":"address", collectionid:{$query:{"collection":"states"}}}}, collectionid:{$query:{"collection":"states"}}},
                            {field:"line2", type:"string", "parentfieldid":{$query:{"field":"address", collectionid:{$query:{"collection":"states"}}}}, collectionid:{$query:{"collection":"states"}}},
                            {field:"city", type:"object", "parentfieldid":{$query:{"field":"address", collectionid:{$query:{"collection":"states"}}}}, collectionid:{$query:{"collection":"states"}}},
                            {field:"cityname", type:"string", "parentfieldid":{$query:{"field":"city", collectionid:{$query:{"collection":"states"}}}}, collectionid:{$query:{"collection":"states"}}},
                            {field:"code", type:"string", "parentfieldid":{$query:{"field":"city", collectionid:{$query:{"collection":"states"}}}}, collectionid:{$query:{"collection":"states"}}},

                            {field:"country", type:"string", collectionid:{$query:{"collection":"countries"}}},

                            {field:"continent", type:"string", collectionid:{$query:{"collection":"continents"}}},
                            {field:"code", type:"string", collectionid:{$query:{"collection":"continents"}}},
                            {field:"countryid", type:"fk", collectionid:{$query:{"collection":"states"}}, collection:"countries"},
                            {field:"continentid", type:"fk", collectionid:{$query:{"collection":"countries"}}, collection:"continents"},
                            {field:"stateid", type:"fk", collectionid:{$query:{"collection":"cities"}}, collection:"states", displayField:"city1", set:["code", "state", "profile.address.line1", "profile.address.city.code", "profile.name", "profile.code", "countryid.country", "countryid.continentid.continent"] },
                            {field:"Person", type:"object", collectionid:{$query:{"collection":"cities"}}, query:JSON.stringify({"$collection":"states"}), multiple:true, fk:"code"},
                            {field:"ui", type:"object", collectionid:{$query:{"collection":"cities"}},uiForm:"grid", multiple:true}



                        ]}
                    ]
                    db.batchUpdateById(insert2, function (err, result) {
                        if (err) {
                            done(err);
                            return;
                        }
                        db.query({$collection:"pl.fields"}, function (err, data) {
                            if (err) {
                                done(err);
                                return;
                            }
                            expect(data.result).to.have.length(21);
                            expect(data.result[0].field).to.eql("city");
                            expect(data.result[1].collectionid.collection).to.eql("states");
                            expect(data.result[10].parentfieldid.field).to.eql("address");
                            expect(data.result[14].field).to.eql("continent");
                            expect(data.result[18].field).to.eql("stateid");
                            expect(data.result[18].type).to.eql("fk");
                            expect(data.result[18].collection).to.eql("states");
                            expect(data.result[18].displayField).to.eql("city1");
                            expect(data.result[18].set).to.have.length(9);
                            expect(data.result[18].set).to.eql(["code", "state", "profile.address.line1", "profile.address.city.code", "profile.name", "profile.code", "countryid.country", "countryid.continentid.continent" , "city1"]);
                            expect(data.result[19].type).to.eql("object");
                            expect(data.result[19].multiple).to.eql(true);
                            expect(data.result[19].fk).to.eql("code");
                            expect(data.result[20].type).to.eql("object");
                            expect(data.result[20].multiple).to.eql(true);
                            done();
                        })
                    })
                });
            });
        })
    })
})