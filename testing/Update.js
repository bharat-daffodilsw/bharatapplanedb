/**
 *
 *  mocha --recursive --timeout 150000 -g "Updatetestcase" --reporter spec
 *  mocha --recursive --timeout 150000 -g "_id simple" --reporter spec
 */
var expect = require('chai').expect;
var ApplaneDB = require("../lib/DB.js");
var Config = require("./config.js");


describe("Updatetestcase", function () {

    afterEach(function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            db.dropDatabase(function (err) {
                done(err);
            })
        });
    })

    it("simple insert", function (done) {
        var COUNTRIES = "countries";
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {$collection:COUNTRIES, $insert:[
                    {country:"India", code:"91"},
                    {country:"USA", code:"01"}

                ]}
            ]
            db.batchUpdate(updates, function (err, result) {
                if (err) {
                    done(err);
                    return;
                }
                db.query({$collection:COUNTRIES, $sort:{country:1}}, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log("data>>>" + JSON.stringify(data));
                    expect(data.result).to.have.length(2);
                    done();

                })
            })
        })

    })

    it("simple update", function (done) {
        var COUNTRIES = "countries";
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {$collection:COUNTRIES, $insert:[
                    {country:"India", code:"91"},
                    {country:"USA", code:"01"}

                ]}
            ]
            db.batchUpdate(updates, function (err, result) {
                if (err) {
                    done(err);
                    return;
                }
                db.query({$collection:COUNTRIES, $sort:{country:1}}, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }


                    var updates = [
                        {$collection:COUNTRIES, $update:[
                            {$query:{_id:data.result[0]._id}, $set:{code:"+91"}},
                            {$query:{_id:data.result[1]._id}, $set:{code:"+01"}}

                        ]}
                    ]
                    db.batchUpdate(updates, function (err, updateResult) {
                        if (err) {
                            done(err);
                            return;
                        }
                        console.log("update result>>>" + JSON.stringify(updateResult));
                        db.query({$collection:COUNTRIES, $sort:{country:1}}, function (err, queryResult) {
                            expect(queryResult.result).to.have.length(2);
                            expect(queryResult.result[0].code).to.eql("+91");
                            expect(queryResult.result[1].code).to.eql("+01");
                            done();
                        })


                    })


                })

            })


        })


    })

    it("simple delete", function (done) {
        var COUNTRIES = "countries";
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {$collection:COUNTRIES, $insert:[
                    {country:"India", code:"91"},
                    {country:"USA", code:"01"}

                ]}
            ]
            db.batchUpdate(updates, function (err, result) {
                if (err) {
                    done(err);
                    return;
                }
                db.query({$collection:COUNTRIES, $sort:{country:1}}, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }


                    var updates = [
                        {$collection:COUNTRIES, $delete:[
                            {_id:data.result[0]._id}

                        ]}
                    ]
                    db.batchUpdate(updates, function (err, deleteResult) {
                        if (err) {
                            done(err);
                            return;
                        }
                        db.query({$collection:COUNTRIES, $sort:{country:1}}, function (err, queryResult) {
                            if (err) {
                                done(err);
                                return;
                            }
                            expect(queryResult.result).to.have.length(1);
                            expect(queryResult.result[0].code).to.eql("01");
                            done();
                        })


                    })


                })

            })


        })


    })

    it("simple upsert", function (done) {
        var collection = {}
        done();

    })

    it("_id simple", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var insert = [
                {"$collection":"states_demo", $insert:[
                    { state:"Haryana", code:"21312"} ,
                    {"_id":"Newyork", state:"Newyork", code:"2312"}
                ]}
            ]
            db.batchUpdateById(insert, function (err, data) {
                if (err) {
                    done(err);
                    return;
                }
                db.query({$collection:"states_demo", $sort:{state:1}}, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log("   ins data   >>>" + JSON.stringify(data));
                    expect(data.result).to.have.length(2);
                    expect(data.result[0].state).to.eql("Haryana");
                    expect(data.result[0]._id).to.be.an("object");
                    expect(data.result[1]._id).to.be.an("string");
                    expect(data.result[1]._id).to.eql("Newyork");
                    var haryanaStateId = data.result[0]._id;

                    var updateStringID = [
                        {"$collection":"states_demo", $update:[
                            {_id:"Newyork", $set:{"state":"Washington"}}  ,
                            {_id:haryanaStateId, $set:{"state":"Haryana1"}} ,
                            {_id:haryanaStateId.toString(), $set:{"state":"Haryana2"}}
                        ]
                        }
                    ]
                    db.batchUpdateById(updateStringID, function (err, data) {
                        if (err) {
                            done(err);
                            return;
                        }
                        db.query({$collection:"states_demo", $sort:{state:1}}, function (err, data) {
                            if (err) {
                                done(err);
                                return;
                            }
                            console.log("   update data   >>>" + JSON.stringify(data));
                            expect(data.result[0]._id).to.be.an("object");
                            expect(data.result[0].state).to.eql("Haryana2");
                            expect(data.result[1].state).to.eql("Washington");
                            done();
                        })
                    })
                })
            })
        })
    })

    it(" _id multiple", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var insert = [
                {"$collection":{collection:"states_demo", fields:[
                    {field:"district", type:"object", multiple:true, fields:[
                        {field:"cities", type:"object", multiple:true}
                    ]}
                ]}, $insert:[
                    {"state":"Haryana", "code":"21312", "district":{$insert:[
                        {"_id":"Hisar", "name":"Hisar", cities:{$insert:[
                            {"_id":"Hisar", name:"Hisar"},
                            {name:"Bhiwani1"}
                        ]}},
                        {"name":"Sirsa"}
                    ]}} ,
                    {"_id":"Newyork", "state":"Newyork", "code":"2312", "district":[
                        {"_id":"Denver", city:"Denver"}
                    ]}
                ]}
            ]
            db.batchUpdateById(insert, function (err, data) {
                if (err) {
                    done(err);
                    return;
                }
                db.query({$collection:"states_demo", $sort:{state:1}}, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log("   insert  data   >>> " + JSON.stringify(data));
                    expect(data.result).to.have.length(2);
                    expect(data.result[0].state).to.eql("Haryana");
                    expect(data.result[0]._id).to.be.an("object");
                    expect(data.result[1]._id).to.be.a("string");
                    expect(data.result[0].district[0]._id).to.be.an("string");
                    expect(data.result[0].district[1]._id).to.be.a("object");
                    var haryanaID = data.result[0]._id;
                    var sirsaId = data.result[0].district[1]._id;
                    var update = [
                        {$collection:"states_demo", $update:[
                            {"_id":haryanaID, $set:{"district":{$update:[
                                {_id:sirsaId.toString(), $set:{"cities":[
                                    {"name":"Sirsa-city"}
                                ]}}
                            ]}}
                            }
                        ]
                        },
                        {$collection:"states_demo", $update:[
                            {"_id":haryanaID, $set:{"district":{$update:[
                                { "_id":"Hisar", $set:{"cities":[
                                    {_id:"Hansi", "name":"Hansi"}
                                ]}}
                            ]}}
                            }
                        ]
                        }  ,
                        {$collection:"states_demo", $update:[
                            {"_id":"Newyork", $set:{"district":{$update:[
                                { "_id":"Denver", $set:{"cities":[
                                    {_id:"Hansi", "name":"Hansi"}
                                ]}}
                            ]}}
                            }
                        ]
                        }
                    ]
                    console.log("Updates>>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(update));
                    db.batchUpdateById(update, function (err, data) {
                        if (err) {
                            done(err);
                            return;
                        }
                        db.query({$collection:"states_demo", $sort:{state:1}}, function (err, data) {
                            if (err) {
                                done(err);
                                return;
                            }
                            console.log("   update  data   >>> " + JSON.stringify(data));
                            expect(data.result[0].district[1].cities[0].name).to.eql("Sirsa-city");
                            expect(data.result[0].district[0].cities[0].name).to.eql("Hansi");
                            expect(data.result[1].district[0].cities[0].name).to.eql("Hansi");
                            done();
                        })
                    })
                })
            })
        })
    })

    it("_id with fk", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var insert = [
                {"$collection":{collection:"states_demo", fields:[
                    {field:"district", type:"fk", upsert:true, collection:"district_demo"}
                ]}, $insert:[
                    {_id:"Haryana", "state":"Haryana", "code":"21312", "district":{"_id":"Hisar",$set:{name:"Hisar"}}
                    } ,
                    {"_id":"California", "state":"California", "code":"2312", "district":{$query:{"name":"Denver"}}
                    }
                ]}
            ]
            db.batchUpdateById(insert, function (err, data) {
                if (err) {
                    done(err);
                    return;
                }
                db.query({$collection:"states_demo", $sort:{state:1}}, function (err, states) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log("   insert  data   >>> " + JSON.stringify(states));
                    expect(states.result).to.have.length(2);
                    expect(states.result[0].district._id).to.be.an("object");
                    expect(states.result[1].district._id).to.be.an("string");
                    expect(states.result[1].district._id).to.eql("Hisar");
                    expect(states.result[1].district.name).to.eql(undefined);
                    db.query({$collection:"district_demo", $sort:{name:1}}, function (err, district) {
                        if (err) {
                            done(err);
                            return;
                        }
                        console.log("   insert  data   >>> " + JSON.stringify(district));
                        expect(district.result).to.have.length(2);
                        expect(district.result[0]._id).to.be.an("object");
                        expect(district.result[1]._id).to.be.an("string");
                        expect(district.result[1]._id).to.eql("Hisar");
                        expect(district.result[1].name).to.eql("Hisar");
                        done();
                        return;
                        //TODO

                        var update = [
                            {"$collection":{collection:"states_demo", fields:[
                                {field:"district", type:"fk", collection:"district_demo"}
                            ]}, $update:[
                                {  _id:"Haryana", $set:{district:{_id:"Hisar", $set:{name:"Hisar***City"}}}

                                }
                            ]}
                        ]
                        db.batchUpdateById(update, function (err, data) {
                            if (err) {
                                done(err);
                                return;
                            }
                            db.query({$collection:"states_demo", $sort:{state:1}}, function (err, data) {
                                if (err) {
                                    done(err);
                                    return;
                                }
                                console.log("   update  data   >>> " + JSON.stringify(data));
                                done();
                            })
                        })
                    })
                })
            })
        })
    })

});