/**
 *
 * mocha --recursive --timeout 150000 -g "collection testcase" --reporter spec
 * mocha --recursive --timeout 150000 -g "collection Fields" --reporter spec
 */

var expect = require('chai').expect;
var ApplaneDB = require("../lib/DB.js");
var Config = require("./config.js");
var NorthwindDb = require("./NorthwindDb.js");
var Utils = require("ApplaneCore/apputil/util.js");
var Constants = require("../lib/Constants.js");

describe("collection testcase", function () {

    afterEach(function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            db.dropDatabase(function (err) {
                done(err);
            })
        });
    })

    it("collection Fields", function (done) {
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
                },
                {
                    $collection:Constants.Admin.FIELDS,
                    $insert:[
                        {field:"country", type:"string", mandatory:true, collectionid:{$query:{collection:"countries"}}} ,
                        {field:"code", type:"string", mandatory:true, collectionid:{$query:{collection:"countries"}}} ,
                        {field:"state", type:"string", mandatory:true, collectionid:{$query:{collection:"states"}}} ,
                        {field:"code", type:"string", mandatory:true, collectionid:{$query:{collection:"states"}}} ,
                        {field:"countryid", type:"fk", collectionid:{$query:{collection:"states"}}, collection:"countries", set:["country", "code"]} ,
                        {field:"cities", type:"object", collectionid:{$query:{collection:"states"}}, multiple:true},
                        {field:"city", type:"string", collectionid:{$query:{collection:"states"}}, parentfieldid:{$query:{field:"cities", collectionid:{$query:{collection:"states"}}}}},
                        {field:"countryid", type:"fk", collectionid:{$query:{collection:"states"}}, collection:"countries", set:["country"], parentfieldid:{$query:{field:"cities", collectionid:{$query:{collection:"states"}}}}} ,
                        {field:"schools", type:"object", multiple:true, collectionid:{$query:{collection:"states"}}, parentfieldid:{$query:{field:"cities"}, collectionid:{$query:{collection:"states"}}}},
                        {field:"schoolname", type:"string", multiple:false, collectionid:{$query:{collection:"states"}}, parentfieldid:{$query:{field:"schools"}, collectionid:{$query:{collection:"states"}}}}
                    ]
                }
            ];
            db.batchUpdateById(updates, function (err, res) {
                if (err) {
                    done(err);
                    return;
                }
                db.collection("states", function (err, collectionObj) {
                    if (err) {
                        done(err);
                        return;
                    }
                    collectionObj.get("fields", function (err, collectionFields) {
                        if (err) {
                            done(err);
                            return;
                        }
                        console.log("collectionFields >>>>>>>>>>>>>>>>" + JSON.stringify(collectionFields));
                        expect(collectionFields).to.have.length(4);
                        expect(collectionFields[0].field).to.eql("state");
                        expect(collectionFields[1].field).to.eql("code");
                        expect(collectionFields[2].field).to.eql("countryid");
                        expect(collectionFields[3].field).to.eql("cities");
                        expect(collectionFields[3].fields).to.have.length(3);
                        expect(collectionFields[3].fields[0].field).to.eql("city");
                        expect(collectionFields[3].fields[1].field).to.eql("countryid");
                        expect(collectionFields[3].fields[2].field).to.eql("schools");
                        expect(collectionFields[3].fields[2].fields).to.have.length(1);
                        expect(collectionFields[3].fields[2].fields[0].field).to.eql("schoolname");
                        db.collection("countries", function (err, collectionObj) {
                            if (err) {
                                done(err);
                                return;
                            }
                            collectionObj.get("referredfks", function (err, referredFks) {
                                if (err) {
                                    done(err);
                                    return;
                                }
                                console.log("referredfks >>>>>>>>>>>>>>>>++++++++++++++++++++++" + JSON.stringify(referredFks));
                                expect(referredFks).to.have.length(2);
                                expect(referredFks[0].field).to.eql("countryid");
                                expect(referredFks[0].set).to.eql(["country", "code"]);
                                expect(referredFks[1].field).to.eql("cities.$.countryid");
                                expect(referredFks[1].set).to.eql(["country"]);

                                done();
                            })
                        })
                    })
                })
            })

            var expectedResult = [
                {"field":"state", "type":"string", "mandatory":true, "collectionid":{"_id":"534e65458dbaae303ebc3614"}, "_id":"534e65458dbaae303ebc3615"},
                {"field":"code", "type":"string", "mandatory":true, "collectionid":{"_id":"534e65458dbaae303ebc3614"}, "_id":"534e65458dbaae 303ebc3619"},
                {"field":"countryid", "type":"fk", "mandatory":true, "collectionid":{"_id":"534e65458dbaae303ebc3614"}, collection:"countries", set:["country"], "_id":"534e65458dbaae 303ebc3219"},
                {"field":"cities", "type":"object", "collectionid":{"_id":"534e65458dbaae303ebc3614"}, "multiple":true, "_id":"534e65458dbaae303ebc361d", "fields":[
                    {"field":"city", "type":"string", "collectionid":{"_id":"534e65458dbaae303ebc3614"}, "parentfieldid":{"field":"cities", "_id":"534e65458 dbaae303ebc361d"}, "_id":"534e65458dbaae303ebc3621", "fields":[]},
                    {"field":"countryid", "type":"fk", "mandatory":true, "collectionid":{"_id":"534e65458dbaae303ebc3614"}, collection:"countries", set:["country"], "_id":"534e65458dbaae 303ebc3219"},
                    {"field":"schools", "type":"object", "multiple":true, "collectionid":{"_id":"534e65458dbaae303ebc3614"}, "parentfieldid":{"field":"cities", "_id":"534e65458dbaae303ebc361d"}, "_id":"534e65458dbaae303ebc3628", "fields":[
                        {"field":"schoolname", "t ype":"string", "multiple":false, "collectionid":{"_id":"534e65458dbaae303ebc3614"}, "parentfieldid":{"field":"schools", "_id":"534e65458dbaae303ebc3628"}, "_id":"534e65458dbaae303ebc362f"}
                    ]}
                ]}
            ];

        })
    })

    it("Referred Fks insert field testcase", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }

            var updates = [
                {
                    $collection:Constants.Admin.COLLECTIONS,
                    $insert:[
                        { _id:"persons", collection:"persons"},
                        { _id:"students", collection:"students"},
                        { _id:"cities", collection:"cities"},
                        { _id:"states", collection:"states"},
                        { _id:"countries", collection:"countries"}
                    ]
                },
                {
                    $collection:Constants.Admin.FIELDS,
                    $insert:[
                        {_id:"country", field:"country", type:"string", collectionid:{_id:"countries"}},
                        {_id:"countrycode", field:"countrycode", type:"string", collectionid:{_id:"countries"}},

                        {_id:"state", field:"state", type:"string", collectionid:{_id:"states"}},
                        {_id:"statecode", field:"statecode", type:"string", collectionid:{_id:"states"}},
                        {_id:"statecountryid", field:"countryid", type:"fk", collection:"countries", set:["country"], collectionid:{_id:"states"}},

                        {_id:"city", field:"city", type:"string", collectionid:{_id:"cities"}},
                        {_id:"citycode", field:"citycode", type:"string", collectionid:{_id:"cities"}},
                        {_id:"citystateid", field:"stateid", type:"fk", collection:"states", set:["state"], collectionid:{_id:"cities"}},

                        {_id:"personname", field:"personname", type:"string", collectionid:{_id:"persons"}},
                        {_id:"cityid", field:"cityid", type:"fk", collection:"cities", set:["city", "stateid.state", "stateid.countryid.country"], collectionid:{_id:"persons"}},
                        {_id:"cities", field:"cities", type:"fk", multiple:true, collection:"cities", set:["city", "stateid.state", "stateid.countryid.country"], collectionid:{_id:"persons"}},
                        {_id:"address", field:"address", type:"object", collectionid:{_id:"persons"}},
                        {_id:"addresscity", field:"cityid", type:"fk", collection:"cities", set:["city"], collectionid:{_id:"persons"}, parentfieldid:{"_id":"address"}},
                        {_id:"addresscitymultiple", multiple:true, field:"cities", type:"fk", collection:"cities", set:["city"], collectionid:{_id:"persons"}, parentfieldid:{"_id":"address"}},
                        {_id:"documents", field:"documents", type:"object", multiple:true, collectionid:{_id:"persons"}},
                        {_id:"documentcity", field:"cityid", type:"fk", collection:"cities", set:["city"], collectionid:{_id:"persons"}, parentfieldid:{"_id":"documents"}},
                        {_id:"documentcitymultiple", multiple:true, field:"cities", type:"fk", collection:"cities", set:["city"], collectionid:{_id:"persons"}, parentfieldid:{"_id":"documents"}},
                        {_id:"schools", field:"schools", type:"object", multiple:true, collectionid:{_id:"persons"}},
                        {_id:"schoolsaddress", field:"address", type:"object", multiple:true, collectionid:{_id:"persons"}, parentfieldid:{"_id":"schools"}},
                        {_id:"schoolsaddresscity", field:"cityid", type:"fk", collection:"cities", set:["city"], collectionid:{_id:"persons"}, parentfieldid:{"_id":"schoolsaddress"}},
                        {_id:"schoolsaddresscitymultiple", field:"cities", multiple:true, type:"fk", collection:"cities", set:["city"], collectionid:{_id:"persons"}, parentfieldid:{"_id":"schoolsaddress"}},
                        {_id:"personid", field:"personid", type:"fk", collection:"persons", set:["personname", "cityid.city", "cities.stateid.state", "cities.stateid.countryid.country", "schools.address.cityid.city"], collectionid:{_id:"students"}}
                    ]
                }
            ];
            db.batchUpdateById(updates, function (err, res) {
                if (err) {
                    done(err);
                    return;
                }
                db.collection("countries", function (err, collectionObj) {
                    if (err) {
                        done(err);
                        return;
                    }
                    collectionObj.get("referredfks", function (err, countries) {
                        if (err) {
                            done(err);
                            return;
                        }
                        console.log("referredfks countries>>>>>>>>>>>>>>>>++++++++++++++++++++++" + JSON.stringify(countries));
                        expect(countries).to.have.length(4);
                        expect(countries[0].collectionid._id).to.eql("states");
                        expect(countries[0].collectionid.collection).to.eql("states");
                        expect(countries[0].field).to.eql("countryid");
                        expect(countries[0].set).to.eql(["country"]);
                        expect(countries[1].collectionid._id).to.eql("persons");
                        expect(countries[1].collectionid.collection).to.eql("persons");
                        expect(countries[1].field).to.eql("cityid.stateid.countryid");
                        expect(countries[1].set).to.eql(["country"]);
                        expect(countries[2].collectionid._id).to.eql("persons");
                        expect(countries[2].collectionid.collection).to.eql("persons");
                        expect(countries[2].field).to.eql("cities.$.stateid.countryid");
                        expect(countries[2].set).to.eql(["country"]);
                        expect(countries[3].collectionid._id).to.eql("students");
                        expect(countries[3].collectionid.collection).to.eql("students");
                        expect(countries[3].field).to.eql("personid.cities.$.stateid.countryid");
                        expect(countries[3].set).to.eql(["country"]);
                        db.collection("states", function (err, collectionObj) {
                            if (err) {
                                done(err);
                                return;
                            }
                            collectionObj.get("referredfks", function (err, states) {
                                if (err) {
                                    done(err);
                                    return;
                                }
                                console.log("referredfks states>>>>>>>>>>>>>>>>++++++++++++++++++++++" + JSON.stringify(states));
                                expect(states).to.have.length(4);
                                expect(states[0].collectionid._id).to.eql("cities");
                                expect(states[0].collectionid.collection).to.eql("cities");
                                expect(states[0].field).to.eql("stateid");
                                expect(states[0].set).to.eql(["state"]);
                                expect(states[1].collectionid._id).to.eql("persons");
                                expect(states[1].collectionid.collection).to.eql("persons");
                                expect(states[1].field).to.eql("cityid.stateid");
                                expect(states[1].set).to.eql(["state", "countryid.country"]);
                                expect(states[2].collectionid._id).to.eql("persons");
                                expect(states[2].collectionid.collection).to.eql("persons");
                                expect(states[2].field).to.eql("cities.$.stateid");
                                expect(states[2].set).to.eql(["state", "countryid.country"]);
                                expect(states[3].collectionid._id).to.eql("students");
                                expect(states[3].collectionid.collection).to.eql("students");
                                expect(states[3].field).to.eql("personid.cities.$.stateid");
                                expect(states[3].set).to.eql(["state", "countryid.country"]);
                                db.collection("cities", function (err, collectionObj) {
                                    if (err) {
                                        done(err);
                                        return;
                                    }
                                    collectionObj.get("referredfks", function (err, cities) {
                                        if (err) {
                                            done(err);
                                            return;
                                        }
                                        console.log("referredfkscities >>>>>>>>>>>>>>>>++++++++++++++++++++++" + JSON.stringify(cities));
                                        expect(cities).to.have.length(11);
                                        expect(cities[0].collectionid.collection).to.eql("persons");
                                        expect(cities[0].field).to.eql("cityid");
                                        expect(cities[0].set).to.eql(["city","stateid.state","stateid.countryid.country"]);
                                        expect(cities[1].collectionid.collection).to.eql("persons");
                                        expect(cities[1].field).to.eql("cities.$");
                                        expect(cities[1].set).to.eql(["city","stateid.state","stateid.countryid.country"]);
                                        expect(cities[2].collectionid.collection).to.eql("persons");
                                        expect(cities[2].field).to.eql("address.cityid");
                                        expect(cities[2].set).to.eql(["city"]);
                                        expect(cities[3].collectionid.collection).to.eql("persons");
                                        expect(cities[3].field).to.eql("address.cities.$");
                                        expect(cities[3].set).to.eql(["city"]);
                                        expect(cities[4].collectionid.collection).to.eql("persons");
                                        expect(cities[4].field).to.eql("documents.$.cityid");
                                        expect(cities[4].set).to.eql(["city"]);
                                        expect(cities[5].collectionid.collection).to.eql("persons");
                                        expect(cities[5].field).to.eql("documents.$.cities.$");
                                        expect(cities[5].set).to.eql(["city"]);
                                        expect(cities[6].collectionid.collection).to.eql("persons");
                                        expect(cities[6].field).to.eql("schools.$.address.$.cityid");
                                        expect(cities[6].set).to.eql(["city"]);
                                        expect(cities[7].collectionid.collection).to.eql("persons");
                                        expect(cities[7].field).to.eql("schools.$.address.$.cities.$");
                                        expect(cities[7].set).to.eql(["city"]);
                                        expect(cities[8].collectionid.collection).to.eql("students");
                                        expect(cities[8].field).to.eql("personid.cityid");
                                        expect(cities[8].set).to.eql(["city"]);
                                        expect(cities[9].collectionid.collection).to.eql("students");
                                        expect(cities[9].field).to.eql("personid.cities.$");
                                        expect(cities[9].set).to.eql(["stateid.state","stateid.countryid.country"]);
                                        expect(cities[10].collectionid.collection).to.eql("students");
                                        expect(cities[10].field).to.eql("personid.schools.$.address.$.cityid");
                                        expect(cities[10].set).to.eql(["city"]);
                                        db.collection("persons", function (err, collectionObj) {
                                            if (err) {
                                                done(err);
                                                return;
                                            }
                                            collectionObj.get("referredfks", function (err, persons) {
                                                if (err) {
                                                    done(err);
                                                    return;
                                                }
                                                console.log("referredfks persons>>>>>>>>>>>>>>>>++++++++++++++++++++++" + JSON.stringify(persons));
                                                expect(persons).to.have.length(1);
                                                expect(persons[0].collectionid._id).to.eql("students");
                                                expect(persons[0].collectionid.collection).to.eql("students");
                                                expect(persons[0].field).to.eql("personid");
                                                expect(persons[0].set).to.eql(["personname", "cityid.city", "cities.stateid.state", "cities.stateid.countryid.country", "schools.address.cityid.city"]);
                                                db.collection("students", function (err, collectionObj) {
                                                    if (err) {
                                                        done(err);
                                                        return;
                                                    }
                                                    collectionObj.get("referredfks", function (err, students) {
                                                        if (err) {
                                                            done(err);
                                                            return;
                                                        }
                                                        console.log("referredfks students>>>>>>>>>>>>>>>>++++++++++++++++++++++" + JSON.stringify(students));
                                                        expect(students).to.have.length(0);
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

    it("Referred Fks update field testcase", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }

            var updates = [
                {
                    $collection:Constants.Admin.COLLECTIONS,
                    $insert:[
                        { _id:"states", collection:"states"},
                        { _id:"countries", collection:"countries"}
                    ]
                },
                {
                    $collection:Constants.Admin.FIELDS,
                    $insert:[
                        {field:"country", type:"string", mandatory:true, collectionid:{$query:{collection:"countries"}}} ,
                        {_id:"statecountryid", field:"countryid", type:"fk", collection:"countries", set:["country"], collectionid:{_id:"states"}}
                    ],
                    $update:[
                        {_id:"statecountryid", $set:{field:"contid"}}
                    ]
                }
            ];
            db.batchUpdateById(updates, function (err, res) {
                if (err) {
                    done(err);
                    return;
                }
                db.collection("countries", function (err, collectionObj) {
                    if (err) {
                        done(err);
                        return;
                    }
                    collectionObj.get("referredfks", function (err, countries) {
                        if (err) {
                            done(err);
                            return;
                        }
                        console.log("referredfks countries>>>>>>>>>>>>>>>>++++++++++++++++++++++" + JSON.stringify(countries));
                        expect(countries).to.have.length(1);
                        expect(countries[0].collectionid._id).to.eql("states");
                        expect(countries[0].collectionid.collection).to.eql("states");
                        expect(countries[0].field).to.eql("contid");
                        expect(countries[0].set).to.eql(["country"]);
                        done();

                        var expectedResult = [
                            {"collectionid":{"_id":"states", "collection":"states"}, "field":"contid", "set":["country"], "_id":"5358e2339550d830150eea76"}
                        ];
                    })
                })
            })
        })
    })

    it("Referred Fks delete field testcase", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }

            var updates = [
                {
                    $collection:Constants.Admin.COLLECTIONS,
                    $insert:[
                        { _id:"states", collection:"states"},
                        { _id:"countries", collection:"countries"}
                    ]
                },
                {
                    $collection:Constants.Admin.FIELDS,
                    $insert:[
                        {field:"country", type:"string", mandatory:true, collectionid:{$query:{collection:"countries"}}} ,
                        {_id:"statecountryid", field:"countryid", type:"fk", collection:"countries", set:["country"], collectionid:{_id:"states"}}
                    ]
                } ,
                {
                    $collection:Constants.Admin.FIELDS,
                    $delete:[
                        {_id:"statecountryid"}
                    ]
                }
            ];
            db.batchUpdateById(updates, function (err, res) {
                if (err) {
                    done(err);
                    return;
                }
                db.collection("countries", function (err, collectionObj) {
                    if (err) {
                        done(err);
                        return;
                    }
                    collectionObj.get("referredfks", function (err, countries) {
                        if (err) {
                            done(err);
                            return;
                        }
                        console.log("referredfks countries>>>>>>>>>>>>>>>>++++++++++++++++++++++" + JSON.stringify(countries));
                        expect(countries).to.have.length(0);
                        done();
                    })
                })
            })
        })
    })

})