/**
 *
 *  mocha --recursive --timeout 150000 -g "joins in filter" --reporter spec
 *  mocha --recursive --timeout 150000 -g "FkQuery testcase" --reporter spec
 *  mocha --recursive --timeout 150000 -g "filter on two columns of fk" --reporter spec
 *  mocha --recursive --timeout 150000 -g "FkSave testcase" --reporter spec
 *  mocha --recursive --timeout 150000 -g "Simple fk save" --reporter spec
 *  mocha --recursive --timeout 150000 -g "FkSave testcase" --reporter spec
 *  mocha --recursive --timeout 150000 -g "Multiple FK in array column" --reporter spec
 *  filtertest
 *
 */

var expect = require('chai').expect;
var ApplaneDB = require("../lib/DB.js");
var Config = require("./config.js");
var NorthwindDb = require("./NorthwindDb.js");
var Utils = require("ApplaneCore/apputil/util.js");
var Constants = require("../lib/Constants.js");
var TEST_UTILITY = require("./Utility.js");
var OPTIONS = {};

var data = {};
data[NorthwindDb.COUNTRIES_TABLE] = NorthwindDb.Countries;
data[NorthwindDb.STATES_TABLE] = NorthwindDb.States;
data[NorthwindDb.CITIES_TABLE] = NorthwindDb.Cities;
data[NorthwindDb.SCHOOLS_TABLE] = NorthwindDb.Schools;
data[NorthwindDb.YEARS_TABLE] = NorthwindDb.Years;
data[NorthwindDb.COLLEGES_TABLE] = NorthwindDb.Colleges;
data[NorthwindDb.ACCOUNTS_TABLE] = NorthwindDb.Accounts;
data[NorthwindDb.ACCOUNT_GROUPS_TABLE] = NorthwindDb.AccountGroups;
data[NorthwindDb.VOUCHERS_TABLE] = NorthwindDb.Vouchers;

describe("FkQuery testcase", function () {
    before(function (done) {
        console.log("before called...");
        TEST_UTILITY.insertData(data, done);
    })

    after(function (done) {
        TEST_UTILITY.removeData(data, done);
    })

    describe("FilterTestcase", function () {
        it("simple fk filter", function (done) {
            ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
                if (err) {
                    done(err);
                    return;
                }

                var fieldsDef = [];
                fieldsDef.push(TEST_UTILITY.populateCollectionField("countryid", Constants.Admin.Fields.Type.FK, undefined, undefined, NorthwindDb.COUNTRIES_TABLE, ["country"]));
                var stateCollection = TEST_UTILITY.populateCollection(NorthwindDb.STATES_TABLE, fieldsDef);

                var query = TEST_UTILITY.populateQuery(stateCollection, {
                    state: 1,
                    "countryid.country": 1,
                    "countryid.code": 1
                }, {"countryid": "India"}, {"state": 1});

                console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>query >>>>>>>>>>>" + JSON.stringify(query));
                db.query(query, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    expect(data.result).to.have.length(2);
                    expect(data.result[0]._id).to.eql("Haryana");
                    expect(data.result[0].state).to.eql("Haryana");
                    expect(data.result[0].countryid.country).to.eql("India");
                    expect(data.result[0].countryid._id).to.eql("India");
                    expect(data.result[0].countryid.code).to.eql("91");

                    expect(data.result[1]._id).to.eql("Punjab");
                    expect(data.result[1].state).to.eql("Punjab");
                    expect(data.result[1].countryid.country).to.eql("India");
                    expect(data.result[1].countryid._id).to.eql("India");
                    expect(data.result[1].countryid.code).to.eql("91");

                    done();
                });

                var query1 = {
                    $collection: {"collection": "states", "fields": [
                        {"field": "countryid", type: "fk", collection: "countries", set: ["country"]}
                    ]},
                    $fields: {"state": 1, "countryid": {"$query": {"$collection": "countries", "$fields": {"country": 1, "code": 1}}, "$fk": "_id", "$parent": "countryid._id"}},
                    $filter: {"countryid._id": "India"}
                };

                var expectedResult = {"result": [
                    {"_id": "Haryana", "state": "Haryana", "countryid": {"_id": "India", "country": "India", "code": "91"}},
                    {"_id": "Punjab", "state": "Punjab", "countryid": {"_id": "India", "country": "India", "code": "91"}}
                ]};
            })
        })

        it("filter on two columns of fk", function (done) {
            ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
                if (err) {
                    done(err);
                    return;
                }

                var fieldsDef = [];
                fieldsDef.push(TEST_UTILITY.populateCollectionField("countryid", Constants.Admin.Fields.Type.FK, undefined, undefined, NorthwindDb.COUNTRIES_TABLE, ["country"]));
                var stateCollection = TEST_UTILITY.populateCollection(NorthwindDb.STATES_TABLE, fieldsDef);

                var query = TEST_UTILITY.populateQuery(stateCollection, {
                    state: 1,
                    "countryid._id": 1,
                    "countryid.country": 1,
                    "countryid.code": 1
                }, { "countryid.code": "90", "countryid": "India"}, {"state": 1});
                db.query(query, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    expect(data.result).to.have.length(0);

                    done();
                });

                var query1 = {
                    "$collection": {"collection": "states", "fields": [
                        {"field": "countryid", "type": "fk", "collection": "countries", "set": ["country"]}
                    ]},
                    "$fields": {
                        "state": 1,
                        "countryid": {
                            "$type": "scalar",
                            "$query": {
                                "$collection": "countries",
                                "$fields": {"_id": 1, "country": 1, "code": 1}},
                            "$fk": "_id",
                            "$parent": "countryid._id"
                        }
                    },
                    "$filter": {
                        "countryid._id": {
                            "$query": {
                                "$collection": "countries",
                                "$fields": {"_id": 1},
                                "$filter": {"code": "90", "_id": "India"}
                            }
                        }
                    },
                    "$sort": {"state": 1}
                };

                var expectedResult = {"result": [
                ]};
            })
        })

        it("filter on fk field ", function (done) {
            ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
                if (err) {
                    done(err);
                    return;
                }

                var fieldsDef = [];
                fieldsDef.push(TEST_UTILITY.populateCollectionField("countryid", Constants.Admin.Fields.Type.FK, undefined, undefined, NorthwindDb.COUNTRIES_TABLE, ["country"]));
                var stateCollection = TEST_UTILITY.populateCollection(NorthwindDb.STATES_TABLE, fieldsDef);

                var query = TEST_UTILITY.populateQuery(stateCollection, {
                    state: 1,
                    "countryid.country": 1,
                    "countryid.code": 1
                }, { "countryid.code": "91"}, {"state": 1});
                db.query(query, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    expect(data.result).to.have.length(2);
                    expect(data.result[0]._id).to.eql("Haryana");
                    expect(data.result[0].state).to.eql("Haryana");
                    expect(data.result[0].countryid.country).to.eql("India");
                    expect(data.result[0].countryid._id).to.eql("India");
                    expect(data.result[0].countryid.code).to.eql("91");

                    expect(data.result[1]._id).to.eql("Punjab");
                    expect(data.result[1].state).to.eql("Punjab");
                    expect(data.result[1].countryid.country).to.eql("India");
                    expect(data.result[1].countryid._id).to.eql("India");
                    expect(data.result[1].countryid.code).to.eql("91");

                    done();
                });

                var query1 = {
                    "$collection": {"collection": "states", "fields": [
                        {"field": "countryid", "type": "fk", "collection": "countries", "set": ["country"]}
                    ]},
                    "$fields": {
                        "state": 1,
                        "countryid": {
                            "$query": {
                                "$collection": "countries",
                                "$fields": {"country": 1, "code": 1}
                            },
                            "$fk": "_id",
                            "$parent": "countryid._id"}
                    },
                    "$filter": {
                        "countryid._id": {
                            "$query": {
                                "$collection": "countries",
                                "$fields": {"_id": 1},
                                "$filter": {"code ": "91"}
                            }
                        }
                    },
                    "$sort": {"state": 1}
                };

                var expectedResult = {"result": [
                    {"_id": "Haryana", "state": "Haryana", "countryid": {"_id": "India", "country": "India", "code": "91"}},
                    {"_id": "Punjab", "state": "Punjab", "countryid": {"_id": "India", "country": "India", "code": "91"}}
                ]};
            })
        })

        it("joins in filter", function (done) {
            ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
                if (err) {
                    done(err);
                    return;
                }


//                var query = {
//                    $collection:{collection:"cities", fields:[
//                        {field:"stateid", type:"fk", set:["state"], collection:{collection:"states", fields:[
//                            {field:"countryid", type:"fk", collection:"countries", set:["country"]}
//                        ]}}
//                    ]},
//                    $fields:{city:1},
//                    $filter:{
//                        "stateid.countryid":"India",
//                        "stateid.countryid.code":"91"
//                    },
//                    $sort:{city:1}
//                };

                var stateFieldsDef = [TEST_UTILITY.populateCollectionField("countryid", Constants.Admin.Fields.Type.FK, undefined, undefined, NorthwindDb.COUNTRIES_TABLE, ["country"])];
                var cityFieldsDef = [TEST_UTILITY.populateCollectionField("stateid", Constants.Admin.Fields.Type.FK, undefined, undefined, TEST_UTILITY.populateCollection(NorthwindDb.STATES_TABLE, stateFieldsDef), ["state"])];
                var cityCollection = TEST_UTILITY.populateCollection(NorthwindDb.CITIES_TABLE, cityFieldsDef);

                var query = TEST_UTILITY.populateQuery(cityCollection, {
                    city: 1
                }, {
                    "stateid.countryid": "India",
                    "stateid.countryid.code": "91"
                }, {city: 1});

                db.query(query, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log("result >>>>>>>>>>>>>>>>>>>" + JSON.stringify(data.result));
                    expect(data.result).to.have.length(4);
                    expect(data.result[0]._id).to.eql("Amritsar");
                    expect(data.result[0].city).to.eql("Amritsar");
                    expect(data.result[1]._id).to.eql("Bathinda");
                    expect(data.result[1].city).to.eql("Bathinda");
                    expect(data.result[2]._id).to.eql("Hisar");
                    expect(data.result[2].city).to.eql("Hisar");
                    expect(data.result[3]._id).to.eql("Sirsa");
                    expect(data.result[3].city).to.eql("Sirsa");

                    done();
                });

                //create sub query.
                var query1 = {
                    "$collection": {collection: "cities", fields: [
                        {field: "stateid", type: "fk", set: ["state"], collection: {collection: "states", fields: [
                            {field: "countryid", type: "fk", collection: "countries", set: ["country"]}
                        ]}}
                    ]},
                    "$fields": {
                        "city": 1
                    }, "$filter": {
                        "stateid._id": {
                            "$query": {
                                "$collection": {collection: "states", fields: [
                                    {field: "countryid", type: "fk", collection: "countries", set: ["country"]}
                                ]},
                                "$fields": {
                                    "_id": 1
                                },
                                "$filter": {
                                    "countryid.code": "91"
                                }
                            }
                        }
                    },
                    $sort: {city: 1}
                };

                var expectedResult = [
                    {"_id": "Amritsar", "city": "Amritsar"},
                    {"_id": "Bathinda", "city": "Bathinda"},
                    {"_id": "Hisar", "city": "Hisar"},
                    {"_id": "Sirsa", "city": "Sirsa"}
                ];

            })
        })

        it("multiple field filter ", function (done) {
            ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
                if (err) {
                    done(err);
                    return;
                }

                var stateFieldsDef = [TEST_UTILITY.populateCollectionField("countryid", Constants.Admin.Fields.Type.FK, undefined, undefined, NorthwindDb.COUNTRIES_TABLE, ["country"])];
                var stateCollection = TEST_UTILITY.populateCollection(NorthwindDb.STATES_TABLE, stateFieldsDef);

                var query = TEST_UTILITY.populateQuery(stateCollection, {
                    state: 1,
                    "countryid.country": 1,
                    "countryid.code": 1
                }, {"state": "Haryana", "countryid.code": "91", "countryid.country": "India"});

                db.query(query, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log("data >>>>>>>>>>>>" + JSON.stringify(data));
                    expect(data.result).to.have.length(1);
                    expect(data.result[0].state).to.eql("Haryana");
                    expect(data.result[0].countryid._id).to.eql("India");
                    expect(data.result[0].countryid.country).to.eql("India");
                    expect(data.result[0].countryid.code).to.eql("91");
                    done();

                })

                var expectedResult = {"result": [
                    {"_id": "Haryana", "state": "Haryana", "countryid": {"_id": "India", "country": "India", "code": "91"}}
                ]};
            })
        })
        it("filter recursion n-dot singlefilter", function (done) {
            ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
                if (err) {
                    done(err);
                    return;
                }

//                var query = {$collection:{collection:"vouchers", fields:[
//                    {field:"vlis", type:"object", multiple:true,fields:[
//                        {field:"accountgroupid", type:"fk", collection:NorthwindDb.ACCOUNT_GROUPS_TABLE, set:["accountgroup"]}
//                    ]}
//                ]},
//                    $fields:{"voucherno":1, "vlis.accountid._id":1, "vlis.accountid.account":1},
//                    $filter:{
//                        "vlis.accountgroupid.parent_account_group":null
//                    },
//                    $unwind:["vlis"]
//                }

                var accountGroupDef = [TEST_UTILITY.populateCollectionField("accountgroupid", Constants.Admin.Fields.Type.FK, undefined, undefined, NorthwindDb.ACCOUNT_GROUPS_TABLE, ["accountgroup"])];
                var voucherFieldsDef = [TEST_UTILITY.populateCollectionField("vlis", Constants.Admin.Fields.Type.OBJECT, true, undefined, undefined, undefined, accountGroupDef)];
                var voucherCollection = TEST_UTILITY.populateCollection(NorthwindDb.VOUCHERS_TABLE, voucherFieldsDef);

                var query = TEST_UTILITY.populateQuery(voucherCollection, {
                    "voucherno": 1,
                    "vlis.accountid._id": 1,
                    "vlis.accountid.account": 1
                }, {
                    "vlis.accountgroupid.parent_account_group": null
                }, undefined, undefined, ["vlis"]);

                db.query(query, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log("Data :: -----  " + JSON.stringify(data));
                    expect(data.result).to.have.length(1);
                    expect(data.result[0].voucherno).to.eql(1);
                    expect(data.result[0].vlis.accountid._id).to.eql("Services");
                    expect(data.result[0].vlis.accountid.account).to.eql("Services");
                    done();
                })

                var expectedResult = {"result": [
                    {"voucherno": 1, "vlis": {"accountid": {"_id": "Services", "account": "Services"}}, "_id": "53438fb43f95490c3477b928"}
                ]};
            })
        })
        it("filter recursion multipleflter", function (done) {
            ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
                if (err) {
                    done(err);
                    return;
                }
//                var query = {$collection:{collection:"vouchers", fields:[
//                    {field:"vlis", type:"object", multiple:true, fields:[
//                        {field:"accountgroupid", type:"fk", set:["accountgroup"],collection:{collection:"accountgroups", fields:[
//                            {field:"parent_account_group", type:"fk", collection:"accountgroups"}
//                        ]}}
//                    ]}
//                ]},
//                    $fields:{"voucherno":1, "vlis.accountid._id":1, "vlis.accountid.account":1},
//                    $filter:{
//                        "vlis.accountgroupid":{$in:["Income", "Expense"]},
//                        "vlis.accountgroupid.parent_account_group":null
//                    },
//                    $unwind:["vlis"]
//                }

                var parentAccountGroupDef = [TEST_UTILITY.populateCollectionField("parent_account_group", Constants.Admin.Fields.Type.FK, undefined, undefined, NorthwindDb.ACCOUNT_GROUPS_TABLE)];
                var accountGroupDef = [TEST_UTILITY.populateCollectionField("accountgroupid", Constants.Admin.Fields.Type.FK, undefined, undefined, TEST_UTILITY.populateCollection(NorthwindDb.ACCOUNT_GROUPS_TABLE, parentAccountGroupDef), ["accountgroup"])];
                var voucherFieldsDef = [TEST_UTILITY.populateCollectionField("vlis", Constants.Admin.Fields.Type.OBJECT, true, undefined, undefined, undefined, accountGroupDef)];
                var voucherCollection = TEST_UTILITY.populateCollection(NorthwindDb.VOUCHERS_TABLE, voucherFieldsDef);

                var query = TEST_UTILITY.populateQuery(voucherCollection, {
                    "voucherno": 1,
                    "vlis.accountid._id": 1,
                    "vlis.accountid.account": 1
                }, {
                    "vlis.accountgroupid": {$in: ["Income", "Expense"]},
                    "vlis.accountgroupid.parent_account_group": null
                }, undefined, undefined, ["vlis"]);

                db.query(query, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log("Data :: -----  " + JSON.stringify(data));
                    expect(data.result).to.have.length(1);
                    expect(data.result[0].voucherno).to.eql(1);
                    expect(data.result[0].vlis.accountid._id).to.eql("Services");
                    expect(data.result[0].vlis.accountid.account).to.eql("Services");
                    done();
                })

                var expectedResult = {"result": [
                    {"voucherno": 1, "vlis": {"accountid": {"_id": "Services", "account": "Services"}}, "_id": "53438fb43f95490c3477b928"}
                ]};
            })
        })

        it("or in filter", function (done) {
            ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
                if (err) {
                    done(err);
                    return;
                }
//                var query = {$collection:{collection:"states", fields:[
//                    {field:"countryid", type:"fk", collection:"countries", set:["country"]}
//                ]},
//                    $fields:{state:1, "countryid._id":1, "countryid.country":1, "countryid.code":1},
//                    $filter:{"$or":[
//                        {"countryid":"India", "countryid.code":"91"},
//                        {"countryid.code":"01"}
//                    ]}
//                }

                var fieldsDef = [];
                fieldsDef.push(TEST_UTILITY.populateCollectionField("countryid", Constants.Admin.Fields.Type.FK, undefined, undefined, NorthwindDb.COUNTRIES_TABLE, ["country"]));
                var stateCollection = TEST_UTILITY.populateCollection(NorthwindDb.STATES_TABLE, fieldsDef);

                var query = TEST_UTILITY.populateQuery(stateCollection, {
                    state: 1,
                    "countryid._id": 1,
                    "countryid.country": 1,
                    "countryid.code": 1
                }, {"$or": [
                    {"countryid": "India", "countryid.code": "91"},
                    {"countryid.code": "01"}
                ]}, {"state": 1});
                db.query(query, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log("Data :: -----  " + JSON.stringify(data));
                    expect(data.result).to.have.length(3);
                    expect(data.result[0].state).to.eql("Haryana");
                    expect(data.result[0].countryid._id).to.eql("India");
                    expect(data.result[0].countryid.code).to.eql("91");
                    expect(data.result[1].state).to.eql("Newyork");
                    expect(data.result[1].countryid._id).to.eql("USA");
                    expect(data.result[1].countryid.code).to.eql("01");
                    expect(data.result[2].state).to.eql("Punjab");
                    expect(data.result[2].countryid._id).to.eql("India");
                    expect(data.result[2].countryid.code).to.eql("91");
                    done();
                })

                var expectedResult = {"result": [
                    {"_id": "Haryana", "state": "Haryana", "countryid": {"_id": "India", "country": "India", "code": "91"}},
                    {"_id": "Newyork", "state": "Newyork", "countryid": {"_id": "USA", "country": "USA", "code": "01"}},
                    {"_id": "Punjab", "state": "Punjab", "countryid": {"_id": "India", "country": "India", "code": "91"}}
                ]};
            })
        })

        it("and in filter", function (done) {
            ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
                if (err) {
                    done(err);
                    return;
                }
//                var query = {$collection:{collection:"states", fields:[
//                    {field:"countryid", type:"fk", collection:"countries", set:["country"]}
//                ]},
//                    $fields:{state:1, "countryid._id":1, "countryid.country":1, "countryid.code":1},
//                    $filter:{"$and":[
//                        {"countryid":"India"},
//                        {"countryid.code":"91"},
//                        {"state":"Haryana"}
//                    ]}
//                }

                var fieldsDef = [];
                fieldsDef.push(TEST_UTILITY.populateCollectionField("countryid", Constants.Admin.Fields.Type.FK, undefined, undefined, NorthwindDb.COUNTRIES_TABLE, ["country"]));
                var stateCollection = TEST_UTILITY.populateCollection(NorthwindDb.STATES_TABLE, fieldsDef);

                var query = TEST_UTILITY.populateQuery(stateCollection, {
                    state: 1,
                    "countryid._id": 1,
                    "countryid.country": 1,
                    "countryid.code": 1
                }, {"$and": [
                    {"countryid": "India"},
                    {"countryid.code": "91"},
                    {"state": "Haryana"}
                ]}, {"state": 1});
                db.query(query, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log("Data :: -----  " + JSON.stringify(data));
                    expect(data.result).to.have.length(1);
                    expect(data.result[0].state).to.eql("Haryana");
                    expect(data.result[0].countryid._id).to.eql("India");
                    expect(data.result[0].countryid.code).to.eql("91");
                    done();
                })
            })
        })

        it("or with and filter", function (done) {
            ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
                if (err) {
                    done(err);
                    return;
                }
//                var query = {$collection:{collection:"states", fields:[
//                    {field:"countryid", type:"fk", collection:"countries", set:["country"]}
//                ]},
//                    $fields:{state:1, "countryid._id":1, "countryid.country":1, "countryid.code":1},
//                    $filter:{"$and":[
//                        {"countryid":"India"},
//                        {"countryid.code":"91"},
//                        {"$or":[
//                            {"state":"Haryana"},
//                            {"state":"Punjab"}
//                        ]}
//                    ]}
//                }


                var fieldsDef = [];
                fieldsDef.push(TEST_UTILITY.populateCollectionField("countryid", Constants.Admin.Fields.Type.FK, undefined, undefined, NorthwindDb.COUNTRIES_TABLE, ["country"]));
                var stateCollection = TEST_UTILITY.populateCollection(NorthwindDb.STATES_TABLE, fieldsDef);

                var query = TEST_UTILITY.populateQuery(stateCollection, {
                    state: 1,
                    "countryid._id": 1,
                    "countryid.country": 1,
                    "countryid.code": 1
                }, {"$and": [
                    {"countryid": "India"},
                    {"countryid.code": "91"},
                    {"$or": [
                        {"state": "Haryana"},
                        {"state": "Punjab"}
                    ]}
                ]}, {"state": 1});
                db.query(query, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log("Data :: -----  " + JSON.stringify(data));
                    expect(data.result).to.have.length(2);
                    expect(data.result[0].state).to.eql("Haryana");
                    expect(data.result[0].countryid._id).to.eql("India");
                    expect(data.result[0].countryid.code).to.eql("91");
                    expect(data.result[1].state).to.eql("Punjab");
                    expect(data.result[1].countryid._id).to.eql("India");
                    expect(data.result[1].countryid.code).to.eql("91");
                    done();
                })
            })
        })


    })

    describe("SortTestcase", function () {
        it("sort on fk field", function (done) {
            ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
                if (err) {
                    done(err);
                    return;
                }
//                var query = {
//                    $collection:{collection:"states", fields:[
//                        {field:"countryid", type:"fk", collection:"countries", set:["country"]}
//                    ]},
//                    $fields:{
//                        state:1,
//                        "countryid.country":1,
//                        "countryid.code":1
//                    },
//                    $sort:{"countryid.country":-1, state:1}
//                };


                var fieldsDef = [];
                fieldsDef.push(TEST_UTILITY.populateCollectionField("countryid", Constants.Admin.Fields.Type.FK, undefined, undefined, NorthwindDb.COUNTRIES_TABLE, ["country"]));
                var stateCollection = TEST_UTILITY.populateCollection(NorthwindDb.STATES_TABLE, fieldsDef);

                var query = TEST_UTILITY.populateQuery(stateCollection, {
                    state: 1,
                    "countryid.country": 1,
                    "countryid.code": 1
                }, undefined, {"countryid.country": -1, state: 1});


                db.query(query, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    expect(data.result).to.have.length(3);

                    expect(data.result[0]._id).to.eql("Newyork");
                    expect(data.result[0].state).to.eql("Newyork");
                    expect(data.result[0].countryid.country).to.eql("USA");
                    expect(data.result[0].countryid._id).to.eql("USA");
                    expect(data.result[0].countryid.code).to.eql("01");

                    expect(data.result[1]._id).to.eql("Haryana");
                    expect(data.result[1].state).to.eql("Haryana");
                    expect(data.result[1].countryid.country).to.eql("India");
                    expect(data.result[1].countryid._id).to.eql("India");
                    expect(data.result[1].countryid.code).to.eql("91");

                    expect(data.result[2]._id).to.eql("Punjab");
                    expect(data.result[2].state).to.eql("Punjab");
                    expect(data.result[2].countryid.country).to.eql("India");
                    expect(data.result[2].countryid._id).to.eql("India");
                    expect(data.result[2].countryid.code).to.eql("91");


                    done();
                });
            })
        })

        it("sort on fk field Error if push not defined", function (done) {
            ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
                if (err) {
                    done(err);
                    return;
                }


//                var query = {
//                    $collection:{collection:"states", fields:[
//                        {field:"countryid", type:"fk", collection:"countries"}
//                    ]},
//                    $fields:{
//                        state:1,
//                        "countryid.country":1,
//                        "countryid.code":1
//                    },
//                    $sort:{"countryid.country":-1, state:1}
//                };


                var fieldsDef = [];
                fieldsDef.push(TEST_UTILITY.populateCollectionField("countryid", Constants.Admin.Fields.Type.FK, undefined, undefined, NorthwindDb.COUNTRIES_TABLE));
                var stateCollection = TEST_UTILITY.populateCollection(NorthwindDb.STATES_TABLE, fieldsDef);

                var query = TEST_UTILITY.populateQuery(stateCollection, {
                    state: 1,
                    "countryid.country": 1,
                    "countryid.code": 1
                }, undefined, {"countryid.country": -1, state: 1});
                db.query(query, function (err, data) {
                    if (err) {
                        console.log("Sort Error In DBRef  : >>>>>>>>>>>   " + err);
                        var sortError = err.toString().indexOf("Sort on dotted column defined in another table not supported.") != -1;
                        if (sortError) {
                            done();
                        } else {
                            done(err);
                        }
                    } else {
                        expect(data).to.not.be.ok;
                        done();
                    }
                });
            })
        })

        it("Sort on fk column in nested data in Group", function (done) {

            ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
                if (err) {
                    done(err);
                    return;
                }

//                var query = {
//                    "$collection":{collection:"vouchers", fields:[
//                        {field:"accountgroupid", type:"fk", collection:"accountgroups"}
//                    ]},
////                    //need to define unwind by user.
//                    $unwind:["vlis"],
//                    "$group":{"_id":"$vlis.accountgroupid._id",
//                        "amount":{"$sum":"$vlis.amount"},
//                        "vlis_accountgroupid__id":{"$first":"$vlis.accountgroupid._id"}
//                    },
//                    $sort:{"vlis.accountgroupid":1}
//                };

                var fieldsDef = [];
                fieldsDef.push(TEST_UTILITY.populateCollectionField("accountgroupid", Constants.Admin.Fields.Type.FK, undefined, undefined, NorthwindDb.ACCOUNT_GROUPS_TABLE));
                var voucherCollection = TEST_UTILITY.populateCollection(NorthwindDb.VOUCHERS_TABLE, fieldsDef);

                var query = TEST_UTILITY.populateQuery(voucherCollection, undefined, undefined, {"vlis.accountgroupid": 1}, {"_id": "$vlis.accountgroupid._id",
                    "amount": {"$sum": "$vlis.amount"},
                    "vlis_accountgroupid__id": {"$first": "$vlis.accountgroupid._id"}
                }, ["vlis"]);

                db.query(query, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log("data >>>>>>>>>>>" + JSON.stringify(data));
                    expect(data.result).to.have.length(3);

                    expect(data.result[0]._id).to.eql("Asset");
                    expect(data.result[0].amount).to.eql(-100);
                    expect(data.result[1]._id).to.eql("Expense");
                    expect(data.result[1].amount).to.eql(600);
                    expect(data.result[2]._id).to.eql("Income");
                    expect(data.result[2].amount).to.eql(-500);
                    done();
                })

                var expectedResult = {"result": [
                    {"_id": "Asset", "amount": -100, "vlis_accountgroupid__id": "Asset"},
                    {"_id": "Expense", "amount": 600, "vlis_accountgroupid__id": "Expense"},
                    {"_id": "Income", "amount": -500, "vlis_accountgroupid__id": "Income"}
                ]};
            })
        })

        it("Sort on fk column in nested data", function (done) {

            ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
                if (err) {
                    done(err);
                    return;
                }
//                var query = {
//                    "$collection":"vouchers",
//                    $unwind:["vlis"],
//                    "$sort":{"vlis.accountgroupid":1}
//                };


                var query = TEST_UTILITY.populateQuery(NorthwindDb.VOUCHERS_TABLE, undefined, undefined, {"vlis.accountgroupid": 1}, undefined, ["vlis"]);

                db.query(query, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log("data >>>>>>>>>>>" + JSON.stringify(data));
                    expect(data.result).to.have.length(4);

                    expect(data.result[0].vlis.accountgroupid._id).to.eql("Asset");
                    expect(data.result[1].vlis.accountgroupid._id).to.eql("Expense");
                    expect(data.result[2].vlis.accountgroupid._id).to.eql("Expense");
                    expect(data.result[3].vlis.accountgroupid._id).to.eql("Income");
                    done();
                })

                var expectedResult = {"result": [
                    {"voucherno": 2, "vlis": {"accountid": {"_id": "cash", "account": "cash"}, "amount": -100, "accountgroupid": {"_id": "Asset", "accountgroup": "Asset"}}, "_id": "533d30e4e723b608194c1db5"},
                    {"voucherno": 1, "vlis": {"accountid": {"_id": "salary", "account": "salary"}, "amount": 500, "accountgroupid": {"_id": "Expense", "accountgroup": "Expense"}}, "_id": "533d30e4e723b608194c1db4"},
                    {"voucherno": 2, "vlis": {"accountid": {"_id": "salary", "account": "salary"}, "amount": 100, "accountgroupid": {"_id": "Expense", "accountgroup": "Expense"}}, "_id": "533d30e4e723b608194c1db5"},
                    {"voucherno": 1, "vlis": {"accountid": {"_id": " Services", "account": "Services"}, "amount": -500, "accountgroupid": {"_id": "Income", "accountgroup": "Income"}}, "_id": "533d30e4e723b608194c1db4"}
                ]};

            })
        })

        it("Error In Sort", function (done) {
            ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
                if (err) {
                    done(err);
                    return;
                }


//                var query = {
//                    $collection:{collection:"states", fields:[
//                        {field:"countryid", type:"fk", collection:"countries",set:["country"]}
//                    ]},
//                    $fields:{
//                        state:1,
//                        "countryid.country":1,
//                        "countryid.code":1
//                    },
//                    $sort:{"countryid.code":-1, state:1}
//                };

                var fieldsDef = [];
                fieldsDef.push(TEST_UTILITY.populateCollectionField("countryid", Constants.Admin.Fields.Type.FK, undefined, undefined, NorthwindDb.COUNTRIES_TABLE, ["country"]));
                var stateCollection = TEST_UTILITY.populateCollection(NorthwindDb.STATES_TABLE, fieldsDef);

                var query = TEST_UTILITY.populateQuery(stateCollection, {
                    state: 1,
                    "countryid.country": 1,
                    "countryid.code": 1
                }, undefined, {"countryid.code": -1, state: 1});
                db.query(query, function (err, data) {
                    if (err) {
                        console.log("Sort Error In DBRef  : >>>>>>>>>>>   " + err);
                        var sortError = err.toString().indexOf("Sort on dotted column defined in another table not supported.") != -1;
                        if (sortError) {
                            done();
                        } else {
                            done(err);
                        }
                    } else {
                        expect(data).to.not.be.ok;
                        done();
                    }
                });
            })
        })
    })

    it("query", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
            if (err) {
                done(err);
                return;
            }


//            var query = {
//                $collection:{collection:"states", fields:[
//                        {field:"countryid", type:"fk", collection:"countries",set:["country"]}
//                    ]},
//                $fields:{state:1, "countryid.country":1, "countryid.code":1}
//            };

            var fieldsDef = [];
            fieldsDef.push(TEST_UTILITY.populateCollectionField("countryid", Constants.Admin.Fields.Type.FK, undefined, undefined, NorthwindDb.COUNTRIES_TABLE, ["country"]));
            var stateCollection = TEST_UTILITY.populateCollection(NorthwindDb.STATES_TABLE, fieldsDef);

            var query = TEST_UTILITY.populateQuery(stateCollection, {
                state: 1,
                "countryid.country": 1,
                "countryid.code": 1
            });
            db.query(query, function (err, data) {
                if (err) {
                    done(err);
                    return;
                }
                console.log("result >>>>>>>>>>>>>>>>>>>" + JSON.stringify(data.result));
                expect(data.result).to.have.length(3);

                expect(data.result[0].state).to.eql("Haryana");
                expect(data.result[0].countryid.country).to.eql("India");
                expect(data.result[0].countryid._id).to.eql("India");
                expect(data.result[0].countryid.code).to.eql("91");

                expect(data.result[1].state).to.eql("Punjab");
                expect(data.result[1].countryid.country).to.eql("India");
                expect(data.result[1].countryid._id).to.eql("India");
                expect(data.result[1].countryid.code).to.eql("91");

                expect(data.result[2].state).to.eql("Newyork");
                expect(data.result[2].countryid.country).to.eql("USA");
                expect(data.result[2].countryid._id).to.eql("USA");
                expect(data.result[2].countryid.code).to.eql("01");


                done();
            });

            //Step

            var query1 = {
                $collection: {collection: "states", fields: [
                    {field: "countryid", type: "fk", collection: "countries", set: ["country"]}
                ]},
                $fields: {
                    state: 1,
                    countryid: {
                        $query: {
                            $collection: "countries",
                            $fields: {"country": 1, "code": 1}
                        },
                        $fk: "_id",
                        $parent: "countryid._id"
                    }
                }
            };

            var expectedResult = {"result": [
                {"_id": "Haryana", "state": "Haryana", "countryid": {"_id": "India", "country": "India", "code": "91"}},
                {"_id": "Punjab", "state": "Punjab", "countryid": {"_id": "India", "country": "India", "code": "91"}} ,
                {"_id": "Newyork", "state": "Newyork", "countryid": {"_id": "USA", "country": "USA", "code": "01"}}
            ]};
        })
    })

    it("nested fk field(n-dot)", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
            if (err) {
                done(err);
                return;
            }


//            var query = {
//                $collection:{collection:"cities", fields:[
//                    {field:"stateid", type:"fk", collection:{collection:"states", fields:[
//                        {field:"countryid", type:"fk", collection:"countries", set:["country"]}
//                    ]}}
//                ]},
//                $fields:{
//                    city:1,
//                    "stateid.state":1,
//                    "stateid.countryid.country":1,
//                    "stateid.countryid.code":1},
//                $sort:{city:1}
//            };


            var stateFieldsDef = [TEST_UTILITY.populateCollectionField("countryid", Constants.Admin.Fields.Type.FK, undefined, undefined, NorthwindDb.COUNTRIES_TABLE, ["country"])];
            var cityFieldsDef = [TEST_UTILITY.populateCollectionField("stateid", Constants.Admin.Fields.Type.FK, undefined, undefined, TEST_UTILITY.populateCollection(NorthwindDb.STATES_TABLE, stateFieldsDef))];
            var cityCollection = TEST_UTILITY.populateCollection(NorthwindDb.CITIES_TABLE, cityFieldsDef);

            var query = TEST_UTILITY.populateQuery(cityCollection, {
                city: 1,
                "stateid.state": 1,
                "stateid.countryid.country": 1,
                "stateid.countryid.code": 1
            }, undefined, {city: 1});


            db.query(query, function (err, data) {
                if (err) {
                    done(err);
                    return;
                }

                expect(data.result).to.have.length(6);

                expect(data.result[0]._id).to.eql("Amritsar");
                expect(data.result[0].city).to.eql("Amritsar");
                expect(data.result[0].stateid.state).to.eql("Punjab");
                expect(data.result[0].stateid._id).to.eql("Punjab");
                expect(data.result[0].stateid.countryid.country).to.eql("India");
                expect(data.result[0].stateid.countryid._id).to.eql("India");
                expect(data.result[0].stateid.countryid.code).to.eql("91");

                expect(data.result[1]._id).to.eql("Bathinda");
                expect(data.result[1].city).to.eql("Bathinda");
                expect(data.result[1].stateid.state).to.eql("Punjab");
                expect(data.result[1].stateid._id).to.eql("Punjab");
                expect(data.result[1].stateid.countryid.country).to.eql("India");
                expect(data.result[1].stateid.countryid._id).to.eql("India");
                expect(data.result[1].stateid.countryid.code).to.eql("91");

                expect(data.result[2]._id).to.eql("Hisar");
                expect(data.result[2].city).to.eql("Hisar");
                expect(data.result[2].stateid.state).to.eql("Haryana");
                expect(data.result[2].stateid._id).to.eql("Haryana");
                expect(data.result[2].stateid.countryid.country).to.eql("India");
                expect(data.result[2].stateid.countryid._id).to.eql("India");
                expect(data.result[2].stateid.countryid.code).to.eql("91");

                expect(data.result[3]._id).to.eql("Iceland");
                expect(data.result[3].city).to.eql("Iceland");
                expect(data.result[3].stateid.state).to.eql("Newyork");
                expect(data.result[3].stateid._id).to.eql("Newyork");
                expect(data.result[3].stateid.countryid.country).to.eql("USA");
                expect(data.result[3].stateid.countryid._id).to.eql("USA");
                expect(data.result[3].stateid.countryid.code).to.eql("01");

                expect(data.result[4]._id).to.eql("Sirsa");
                expect(data.result[4].city).to.eql("Sirsa");
                expect(data.result[4].stateid.state).to.eql("Haryana");
                expect(data.result[4].stateid._id).to.eql("Haryana");
                expect(data.result[4].stateid.countryid.country).to.eql("India");
                expect(data.result[4].stateid.countryid._id).to.eql("India");
                expect(data.result[4].stateid.countryid.code).to.eql("91");

                expect(data.result[5]._id).to.eql("Skyland");
                expect(data.result[5].city).to.eql("Skyland");
                expect(data.result[5].stateid.state).to.eql("Newyork");
                expect(data.result[5].stateid._id).to.eql("Newyork");
                expect(data.result[5].stateid.countryid.country).to.eql("USA");
                expect(data.result[5].stateid.countryid._id).to.eql("USA");
                expect(data.result[5].stateid.countryid.code).to.eql("01");

                done();

                //step1 fk module (doQuery)

                var query1 = {
                    "$collection": {collection: "cities", fields: [
                        {field: "stateid", type: "fk", collection: {collection: "states", fields: [
                            {field: "countryid", type: "fk", collection: "countries", set: ["country"]}
                        ]}}
                    ]},
                    "$fields": {
                        "city": 1,
                        "stateid": {
                            "$query": {
                                "$collection": {collection: "states", fields: [
                                    {field: "countryid", type: "fk", collection: "countries", set: ["country"]}
                                ]},
                                "$fields": {
                                    "state": 1,
                                    "countryid.country": 1,
                                    "countryid.code": 1
                                }
                            },
                            "$fk": "_id",
                            "$parent": "stateid._id"
                        }
                    },
                    "$sort": {"city": 1}
                };

                var expectedResult = {"result": [
                    {"_id": "Amritsar", "city": "Amritsar", "stateid": {"_id": "Punjab", "state": "Punjab", "countryid": {"_id": "India", "country": "India", "code": "91"}}},
                    {"_id": "Bathinda", "city": "Bathinda", "stateid": {"_id": "Punjab", "state": "Punjab", "countryid": {"_id": "India", "country": "India", "code": "91"}}},
                    {"_id": "Hisar", "city": "Hisar", "stateid": {"_id": "Haryana", "state": "Haryana", "countryid": {"_id": "India", "country": "India", "code": "91"}}},
                    {"_id": "Iceland", "city": "Iceland", "stateid": {"_id": "Newyork", "state": "Newyork", "countryid": {"_id": "USA", "country": "USA", "code": "01"}}},
                    {"_id": "Sirsa", "city": "Sirsa", "stateid": {"_id": "Haryana", "state": "Haryana", "countryid": {"_id": "India", "country": "India", "code": "91"}}},
                    {"_id": "Skyland", "city": "Skyland", "stateid": {"_id": "Newyork", "state": "Newyork", "countryid": {"_id": "USA", "country": "USA", "code": "01"}}}
                ]};

            });
        })
    })

    it("query on fk in object single", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
            if (err) {
                done(err);
                return;
            }


//            var query = {
//                "$collection":{collection:"colleges", fields:[
//                    {field:"establishment", type:"object",fields:[
//                        {field:"yearid", type:"fk",collection:"years",set:["year"]}
//                    ]}
//                ]},
//                "$fields":{
//                    "college":1,
//                    "code":1,
//                    "establishment.yearid.year":1,
//                    "establishment.yearid.inwords":1
//                },
//                "$sort":{"college":1}
//            };

            var yearsDef = [TEST_UTILITY.populateCollectionField("yearid", Constants.Admin.Fields.Type.FK, undefined, undefined, NorthwindDb.YEARS_TABLE, ["year"])];
            var collegeFieldsDef = [TEST_UTILITY.populateCollectionField("establishment", Constants.Admin.Fields.Type.OBJECT, undefined, undefined, undefined, undefined, yearsDef)];
            var collegeCollection = TEST_UTILITY.populateCollection(NorthwindDb.COLLEGES_TABLE, collegeFieldsDef);

            var query = TEST_UTILITY.populateQuery(collegeCollection, {
                "college": 1,
                "code": 1,
                "establishment.yearid.year": 1,
                "establishment.yearid.inwords": 1
            }, undefined, {"college": 1});

            db.query(query, function (err, data) {
                if (err) {
                    done(err);
                    return;
                }
                expect(data.result).to.have.length(2);
                console.log("data >>>>>>>>>>>>>>" + JSON.stringify(data));


                expect(data.result[0].college).to.eql("DAV");
                expect(data.result[0].code).to.eql("DAV");
                expect(data.result[0].establishment.yearid.year).to.eql("2012");
                expect(data.result[0].establishment.yearid.inwords).to.eql("Two Thousand Twelve");

                expect(data.result[1].college).to.eql("Universal");
                expect(data.result[1].code).to.eql("Universal");
                expect(data.result[1].establishment.yearid.year).to.eql("2014");
                expect(data.result[1].establishment.yearid.inwords).to.eql("Two Thousand Fourteen");

                done();
            });

            //step1
            var query1 = {
                "$collection": {collection: "colleges", fields: [
                    {field: "establishment", type: "object", fields: [
                        {field: "yearid", type: "fk", collection: "years", set: ["year"]}
                    ]}
                ]},
                "$fields": {
                    "college": 1,
                    "code": 1, "establishment.yearid": {
                        "$query": {
                            "$collection": "years",
                            "$fields": {"year": 1, "inwords": 1}
                        },
                        "$fk": "_id",
                        "$parent": "establishment.yearid._id"
                    }
                },
                "$sort ": {"college": 1}
            };

        })
    })


    /*
     * convert it to task--> owners example
     * */

    it("query on array of fk", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
            if (err) {
                done(err);
                return;
            }


//            var query = {
//                $collection:{collection:"schools", fields:[
//                    {
//                        field:"cities", type:"fk", multiple:true, collection:{collection:"cities", fields:[
//                        {field:"stateid", type:"fk", set:["state"], collection:{collection:"states", fields:[
//                            {field:"countryid", type:"fk", collection:"countries", set:["country"]}
//                        ]}}
//                    ]}
//                    }
//                ]},
//                $fields:{
//                    school:1,
//                    code:1,
//                    "cities.city":1,
//                    "cities.stateid.state":1,
//                    "cities.stateid.countryid.country":1,
//                    "cities.stateid.countryid.code":1
//                },
//                $sort:{school:1}
//            };


            var stateFieldsDef = [TEST_UTILITY.populateCollectionField("countryid", Constants.Admin.Fields.Type.FK, undefined, undefined, NorthwindDb.COUNTRIES_TABLE, ["country"])];
            var cityFieldsDef = [TEST_UTILITY.populateCollectionField("stateid", Constants.Admin.Fields.Type.FK, undefined, undefined, TEST_UTILITY.populateCollection(NorthwindDb.STATES_TABLE, stateFieldsDef), ["state"])];
            var schoolFieldDef = [TEST_UTILITY.populateCollectionField("cities", Constants.Admin.Fields.Type.FK, true, undefined, TEST_UTILITY.populateCollection(NorthwindDb.CITIES_TABLE, cityFieldsDef))];
            var schoolCollection = TEST_UTILITY.populateCollection(NorthwindDb.SCHOOLS_TABLE, schoolFieldDef);

            var query = TEST_UTILITY.populateQuery(schoolCollection, {
                school: 1,
                code: 1,
                "cities.city": 1,
                "cities.stateid.state": 1,
                "cities.stateid.countryid.country": 1,
                "cities.stateid.countryid.code": 1
            }, undefined, {school: 1});


            db.query(query, function (err, data) {
                if (err) {
                    done(err);
                    return;
                }
                expect(data.result).to.have.length(3);

                expect(data.result[0].school).to.eql("DAV");
                expect(data.result[0].code).to.eql("DAV");
                expect(data.result[0].cities).to.have.length(2);
                expect(data.result[0].cities[0].city).to.eql("Bathinda");
                expect(data.result[0].cities[0].stateid.state).to.eql("Punjab");
                expect(data.result[0].cities[0].stateid._id).to.eql("Punjab");
                expect(data.result[0].cities[0].stateid.countryid.country).to.eql("India");
                expect(data.result[0].cities[0].stateid.countryid._id).to.eql("India");
                expect(data.result[0].cities[0].stateid.countryid.code).to.eql("91");

                expect(data.result[0].cities[1].city).to.eql("Hisar");
                expect(data.result[0].cities[1].stateid.state).to.eql("Haryana");
                expect(data.result[0].cities[1].stateid._id).to.eql("Haryana");
                expect(data.result[0].cities[1].stateid.countryid.country).to.eql("India");
                expect(data.result[0].cities[1].stateid.countryid._id).to.eql("India");
                expect(data.result[0].cities[1].stateid.countryid.code).to.eql("91");


                expect(data.result[1].school).to.eql("Redcliife");
                expect(data.result[1].code).to.eql("Redcliife");
                expect(data.result[1].cities).to.have.length(3);
                expect(data.result[1].cities[0].city).to.eql("Hisar");
                expect(data.result[1].cities[0].stateid.state).to.eql("Haryana");
                expect(data.result[1].cities[0].stateid._id).to.eql("Haryana");
                expect(data.result[1].cities[0].stateid.countryid.country).to.eql("India");
                expect(data.result[1].cities[0].stateid.countryid._id).to.eql("India");
                expect(data.result[1].cities[0].stateid.countryid.code).to.eql("91");

                expect(data.result[1].cities[1].city).to.eql("Amritsar");
                expect(data.result[1].cities[1].stateid.state).to.eql("Punjab");
                expect(data.result[1].cities[1].stateid._id).to.eql("Punjab");
                expect(data.result[1].cities[1].stateid.countryid.country).to.eql("India");
                expect(data.result[1].cities[1].stateid.countryid._id).to.eql("India");
                expect(data.result[1].cities[1].stateid.countryid.code).to.eql("91");

                expect(data.result[1].cities[2].city).to.eql("Iceland");
                expect(data.result[1].cities[2].stateid.state).to.eql("Newyork");
                expect(data.result[1].cities[2].stateid._id).to.eql("Newyork");
                expect(data.result[1].cities[2].stateid.countryid.country).to.eql("USA");
                expect(data.result[1].cities[2].stateid.countryid._id).to.eql("USA");
                expect(data.result[1].cities[2].stateid.countryid.code).to.eql("01");


                done();
            });

            var query1 = {
                "$collection": {collection: "schools", fields: [
                    {
                        field: "cities", type: "fk", multiple: true, collection: {collection: "cities", fields: [
                        {field: "stateid", type: "fk", set: ["state"], collection: {collection: "states", fields: [
                            {field: "countryid", type: "fk", collection: "countries", set: ["country"]}
                        ]}}
                    ]}
                    }
                ]},
                "$fields": {
                    "school": 1,
                    "code": 1,
                    "cities": {
                        "$query": {
                            "$collection": {collection: "cities", fields: [
                                {field: "stateid", type: "fk", set: ["state"], collection: {collection: "states", fields: [
                                    {field: "countryid", type: "fk", collection: "countries", set: ["country"]}
                                ]}}
                            ]},
                            "$fields": {
                                "city": 1,
                                "stateid.state": 1,
                                "stateid.countryid.country": 1,
                                "stateid.countryid.code": 1
                            }
                        },
                        "$fk": "_id",
                        "$parent": "cities._id"
                    }
                },
                $sort: {school: 1}
            };
            var expectedResult = {"result": [
                {"school": "DAV", "code": "DAV", "cities": [
                    {"_id": "Bathinda", "city": "Bathinda", "stateid": {"_id": "Punjab", "state": "Punjab", "countryid": {"_id": "India", "country": "India", "code": "91"}}},
                    {"_id": "Hisar", "city": "Hisar", "stateid": {"_id": "Haryana", "state": "Haryana", "countryid": {" _id": "India", "country": "India", "code": "91"}}}
                ], "_id": "5339bb103744fd6022d2f75c"},
                {"school": "Redcliife", "code": "Redcliife", "cities": [
                    {"_id": "Hisar", "city": "Hisar", "stateid": {"_id": "Haryana", "state": "Haryana", "countryid": {"_id": "India", "country": "India", "code": "91"}}},
                    {"_id": "Amritsar", "city": "Amritsa r", "stateid": {"_id": "Punjab", "state": "Punjab", "countryid": {"_id": "India", "country": "India", "code": "91"}}},
                    {"_id": "Iceland", "city": "Iceland", "stateid": {"_id": "Newyork", "state": "Newyork", "countryid": {"_id": "USA", "country": "USA", "code": "01"}}}
                ], "_id": "5339bb103744fd6022d2f75d"},
                {"school": "Universal", "c ode": "Universal", "cities": [
                    {"_id": "Bathinda", "city": "Bathinda", "stateid": {"_id": "Punjab", "state": "Punjab", "countryid": {"_id": "India", "country": "India", "code": "91"}}},
                    {"_id": "Sirsa", "city": "Sirsa", "stateid": {"_id": "Haryana", "state": "Haryana", "countryid": {"_id": "India", "country": "India", "code": "91"}}} ,
                    {"_id": "Amritsar", "city": "Amritsar", "stateid": {"_id": "Punjab", "state": "Punjab", "countryid": {"_id": "India", "country": "India", "code": "91"}}}
                ], "_id": "5339bb103744fd6022d2f75e"}
            ]};
        })
    })

    /*
     *  convert it to voucher --> lineitems
     *  */
    it("query on fk in array", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
            if (err) {
                done(err);
                return;
            }


//            var query = {
//                $collection:{collection:"colleges", fields:[
//                    {field:"establishment", type:"object", fields:[
//                        {
//                            field:"yearid", type:"fk", collection:"years", set:["year"]
//                        },
//                        {
//                            field:"cities", type:"fk", multiple:true, collection:{collection:"cities", fields:[
//                            {field:"stateid", type:"fk", set:["state"], collection:{collection:"states", fields:[
//                                {field:"countryid", type:"fk", collection:"countries", set:["country"]}
//                            ]}}
//                        ]}
//                        }
//                    ]}
//                ]},
//                $fields:{
//                    college:1,
//                    code:1,
//                    "establishment.yearid.year":1,
//                    "establishment.yearid.inwords":1,
//                    "establishment.cities.city":1,
//                    "establishment.cities.stateid.state":1,
//                    "establishment.cities.stateid.countryid.country":1,
//                    "establishment.cities.stateid.countryid.code":1
//                },
//                $sort:{college:1}
//            };


            var establishmentFieldsDef = [];
            establishmentFieldsDef.push(TEST_UTILITY.populateCollectionField("yearid", Constants.Admin.Fields.Type.FK, undefined, undefined, NorthwindDb.YEARS_TABLE, ["year"]))
            var stateFieldsDef = [TEST_UTILITY.populateCollectionField("countryid", Constants.Admin.Fields.Type.FK, undefined, undefined, NorthwindDb.COUNTRIES_TABLE, ["country"])];
            var cityFieldsDef = [TEST_UTILITY.populateCollectionField("stateid", Constants.Admin.Fields.Type.FK, undefined, undefined, TEST_UTILITY.populateCollection(NorthwindDb.STATES_TABLE, stateFieldsDef), ["state"])];
            establishmentFieldsDef.push(TEST_UTILITY.populateCollectionField("cities", Constants.Admin.Fields.Type.FK, true, undefined, TEST_UTILITY.populateCollection(NorthwindDb.CITIES_TABLE, cityFieldsDef)));
            var establishmentFieldDef = [TEST_UTILITY.populateCollectionField("establishment", Constants.Admin.Fields.Type.OBJECT, undefined, undefined, undefined, undefined, establishmentFieldsDef)];
            var collegeCollection = TEST_UTILITY.populateCollection(NorthwindDb.COLLEGES_TABLE, establishmentFieldDef);

            var query = TEST_UTILITY.populateQuery(collegeCollection, {
                college: 1,
                code: 1,
                "establishment.yearid.year": 1,
                "establishment.yearid.inwords": 1,
                "establishment.cities.city": 1,
                "establishment.cities.stateid.state": 1,
                "establishment.cities.stateid.countryid.country": 1,
                "establishment.cities.stateid.countryid.code": 1
            }, undefined, {college: 1});

            db.query(query, function (err, data) {
                if (err) {
                    done(err);
                    return;
                }
                expect(data.result).to.have.length(2);


                expect(data.result[0].college).to.eql("DAV");
                expect(data.result[0].code).to.eql("DAV");
                expect(data.result[0].establishment.yearid.year).to.eql("2012");
                expect(data.result[0].establishment.yearid.inwords).to.eql("Two Thousand Twelve");

                expect(data.result[0].establishment.cities).to.have.length(3);

                expect(data.result[0].establishment.cities[0].city).to.eql("Bathinda");
                expect(data.result[0].establishment.cities[0].stateid.state).to.eql("Punjab");
                expect(data.result[0].establishment.cities[0].stateid._id).to.eql("Punjab");
                expect(data.result[0].establishment.cities[0].stateid.countryid.country).to.eql("India");
                expect(data.result[0].establishment.cities[0].stateid.countryid._id).to.eql("India");
                expect(data.result[0].establishment.cities[0].stateid.countryid.code).to.eql("91");


                expect(data.result[0].establishment.cities[1].city).to.eql("Hisar");
                expect(data.result[0].establishment.cities[1].stateid.state).to.eql("Haryana");
                expect(data.result[0].establishment.cities[1].stateid._id).to.eql("Haryana");
                expect(data.result[0].establishment.cities[1].stateid.countryid.country).to.eql("India");
                expect(data.result[0].establishment.cities[1].stateid.countryid._id).to.eql("India");
                expect(data.result[0].establishment.cities[1].stateid.countryid.code).to.eql("91");


                expect(data.result[0].establishment.cities[2].city).to.eql("Sirsa");
                expect(data.result[0].establishment.cities[2].stateid.state).to.eql("Haryana");
                expect(data.result[0].establishment.cities[2].stateid._id).to.eql("Haryana");
                expect(data.result[0].establishment.cities[2].stateid.countryid.country).to.eql("India");
                expect(data.result[0].establishment.cities[2].stateid.countryid._id).to.eql("India");
                expect(data.result[0].establishment.cities[2].stateid.countryid.code).to.eql("91");

                expect(data.result[1].college).to.eql("Universal");
                expect(data.result[1].code).to.eql("Universal");
                expect(data.result[1].establishment.yearid.year).to.eql("2014");
                expect(data.result[1].establishment.yearid.inwords).to.eql("Two Thousand Fourteen");

                expect(data.result[1].establishment.cities).to.have.length(3);

                expect(data.result[1].establishment.cities[0].city).to.eql("Amritsar");
                expect(data.result[1].establishment.cities[0].stateid.state).to.eql("Punjab");
                expect(data.result[1].establishment.cities[0].stateid._id).to.eql("Punjab");
                expect(data.result[1].establishment.cities[0].stateid.countryid.country).to.eql("India");
                expect(data.result[1].establishment.cities[0].stateid.countryid._id).to.eql("India");
                expect(data.result[1].establishment.cities[0].stateid.countryid.code).to.eql("91");


                expect(data.result[1].establishment.cities[1].city).to.eql("Sirsa");
                expect(data.result[1].establishment.cities[1].stateid.state).to.eql("Haryana");
                expect(data.result[1].establishment.cities[1].stateid._id).to.eql("Haryana");
                expect(data.result[1].establishment.cities[1].stateid.countryid.country).to.eql("India");
                expect(data.result[1].establishment.cities[1].stateid.countryid._id).to.eql("India");
                expect(data.result[1].establishment.cities[1].stateid.countryid.code).to.eql("91");


                expect(data.result[1].establishment.cities[2].city).to.eql("Iceland");
                expect(data.result[1].establishment.cities[2].stateid.state).to.eql("Newyork");
                expect(data.result[1].establishment.cities[2].stateid._id).to.eql("Newyork");
                expect(data.result[1].establishment.cities[2].stateid.countryid.country).to.eql("USA");
                expect(data.result[1].establishment.cities[2].stateid.countryid._id).to.eql("USA");
                expect(data.result[1].establishment.cities[2].stateid.countryid.code).to.eql("01");

                done();
            });

            var query1 = {
                "$collection": {collection: "colleges", fields: [
                    {field: "establishment", type: "object", fields: [
                        {
                            field: "yearid", type: "fk", collection: "years", set: ["year"]
                        },
                        {
                            field: "cities", type: "fk", multiple: true, collection: {collection: "cities", fields: [
                            {field: "stateid", type: "fk", set: ["state"], collection: {collection: "states", fields: [
                                {field: "countryid", type: "fk", collection: "countries", push: ["country"]}
                            ]}}
                        ]}
                        }
                    ]}
                ]},
                "$fields": {
                    "college": 1,
                    "code": 1,
                    "establishment.yearid": {
                        "$query": {
                            "$collection": "years",
                            "$fields": {
                                "year": 1,
                                "inwords": 1
                            }
                        },
                        "$fk": "_id",
                        "$parent": "yearid._id"
                    },
                    "establishment.cities": {
                        "$type": "n-rows",
                        "$query": {
                            "$collection": {collection: "cities", fields: [
                                {field: "stateid", type: "fk", set: ["state"], collection: {collection: "states", fields: [
                                    {field: "countryid", type: "fk", collection: "countries", set: ["country"]}
                                ]}}
                            ]},
                            "$fields": {
                                "city": 1,
                                "stateid.state": 1,
                                "stateid.countryid.country": 1,
                                "stateid.countryid.code": 1
                            }
                        },
                        "$fk": "_id",
                        "$parent": "cities._id"
                    }
                },
                "$sort": {"college": 1}
            };

            var expectedResult = {"result": [
                {"college": "DAV", "code": "DAV", "establishment": {"yearid": {"_id": "2012", "year": "2012", "inwords": "Two Thousand Twelve"}, "cities": [
                    {"_id": "Bathinda", "city": "Bathinda", "stateid": {"_id": "Punjab", "state": "Punjab", "countryid": {"_id": "India", "country": "India", "code": "91"} }},
                    {"_id": "Hisar", "city": "Hisar", "stateid": {"_id": "Haryana", "state": "Haryana", "countryid": {"_id": "India", "country": "India", "code": "91"}}},
                    {"_id": "Sirsa", "city": "Sirsa", "stateid": {"_id": "Haryana", "state": "Haryana", "countryid": {"_id": "India", "country": "India", "code": "91"}}}
                ]}, "_id": "5339bac19878dcb82f 3b3e98"},
                {"college": "Universal", "code": "Universal", "establishment": {"yearid": {"_id": "2014", "year": "2014", "inwords": "Two Thousand Fourteen"}, "cities": [
                    {"_id": "Amritsar", "city": "Amritsar", "stateid": {"_id": "Punjab", "state": "Punjab", "countryid": {"_id": "India", "country": "India", "code": "91"}}},
                    {"_id": "Sir sa", "city": "Sirsa", "stateid": {"_id": "Haryana", "state": "Haryana", "countryid": {"_id": "India", "country": "India", "code": "91"}}},
                    {"_id": "Iceland", "city": "Iceland", "stateid": {"_id": "Newyork", "state": "Newyork", "countryid": {"_id": "USA", "country": "USA", "code": "01"}}}
                ]}, "_id": "5339bac19878dcb82f3b3e99"}
            ]};
        })
    })

    /*
     * convert it to order --> deliveries(onwers[])
     * */
    it("query on array of fk in array", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
            if (err) {
                done(err);
                return;
            }


//            var query = {
//                $collection:{collection:"colleges", fields:[
//                    {field:"courses", type:"object", multiple:true, fields:[
//                        {
//                            field:"cities", type:"fk", multiple:true, collection:{collection:"cities", fields:[
//                            {field:"stateid", type:"fk", set:["state"], collection:{collection:"states", fields:[
//                                {field:"countryid", type:"fk", collection:"countries", set:["country"]}
//                            ]}}
//                        ]}
//                        }
//                    ]}
//                ]},
//                $fields:{
//                    college:1,
//                    code:1,
//                    "courses.course":1,
//                    "courses.cities.city":1,
//                    "courses.cities.stateid.state":1,
//                    "courses.cities.stateid.countryid.country":1,
//                    "courses.cities.stateid.countryid.code":1
//                },
//                $sort:{college:1}
//            };


            var stateFieldsDef = [TEST_UTILITY.populateCollectionField("countryid", Constants.Admin.Fields.Type.FK, undefined, undefined, NorthwindDb.COUNTRIES_TABLE, ["country"])];
            var cityFieldsDef = [TEST_UTILITY.populateCollectionField("stateid", Constants.Admin.Fields.Type.FK, undefined, undefined, TEST_UTILITY.populateCollection(NorthwindDb.STATES_TABLE, stateFieldsDef), ["state"])];
            var courseFieldDef = [TEST_UTILITY.populateCollectionField("cities", Constants.Admin.Fields.Type.FK, true, undefined, TEST_UTILITY.populateCollection(NorthwindDb.CITIES_TABLE, cityFieldsDef))];
            var collegeFieldDef = [TEST_UTILITY.populateCollectionField("courses", Constants.Admin.Fields.Type.OBJECT, true, undefined, undefined, undefined, courseFieldDef)];
            var collegeCollection = TEST_UTILITY.populateCollection(NorthwindDb.COLLEGES_TABLE, collegeFieldDef);

            var query = TEST_UTILITY.populateQuery(collegeCollection, {
                college: 1,
                code: 1,
                "courses.course": 1,
                "courses.cities.city": 1,
                "courses.cities.stateid.state": 1,
                "courses.cities.stateid.countryid.country": 1,
                "courses.cities.stateid.countryid.code": 1
            }, undefined, {college: 1});
            db.query(query, function (err, data) {
                if (err) {
                    done(err);
                    return;
                }
                expect(data.result).to.have.length(2);


                expect(data.result[0].college).to.eql("DAV");
                expect(data.result[0].code).to.eql("DAV");

                expect(data.result[0].courses).to.have.length(2);

                expect(data.result[0].courses[0].course).to.eql("BCA");
                expect(data.result[0].courses[0].cities).to.have.length(2);

                expect(data.result[0].courses[0].cities[0].city).to.eql("Bathinda");
                expect(data.result[0].courses[0].cities[0].stateid.state).to.eql("Punjab");
                expect(data.result[0].courses[0].cities[0].stateid._id).to.eql("Punjab");
                expect(data.result[0].courses[0].cities[0].stateid.countryid.country).to.eql("India");
                expect(data.result[0].courses[0].cities[0].stateid.countryid._id).to.eql("India");
                expect(data.result[0].courses[0].cities[0].stateid.countryid.code).to.eql("91");

                expect(data.result[0].courses[0].cities[1].city).to.eql("Hisar");
                expect(data.result[0].courses[0].cities[1].stateid.state).to.eql("Haryana");
                expect(data.result[0].courses[0].cities[1].stateid._id).to.eql("Haryana");
                expect(data.result[0].courses[0].cities[1].stateid.countryid.country).to.eql("India");
                expect(data.result[0].courses[0].cities[1].stateid.countryid._id).to.eql("India");
                expect(data.result[0].courses[0].cities[1].stateid.countryid.code).to.eql("91");

                expect(data.result[0].courses[1].course).to.eql("MCA");
                expect(data.result[0].courses[1].cities).to.have.length(3);

                expect(data.result[0].courses[1].cities[0].city).to.eql("Bathinda");
                expect(data.result[0].courses[1].cities[0].stateid.state).to.eql("Punjab");
                expect(data.result[0].courses[1].cities[0].stateid._id).to.eql("Punjab");
                expect(data.result[0].courses[1].cities[0].stateid.countryid.country).to.eql("India");
                expect(data.result[0].courses[1].cities[0].stateid.countryid._id).to.eql("India");
                expect(data.result[0].courses[1].cities[0].stateid.countryid.code).to.eql("91");

                expect(data.result[0].courses[1].cities[1].city).to.eql("Sirsa");
                expect(data.result[0].courses[1].cities[1].stateid.state).to.eql("Haryana");
                expect(data.result[0].courses[1].cities[1].stateid._id).to.eql("Haryana");
                expect(data.result[0].courses[1].cities[1].stateid.countryid.country).to.eql("India");
                expect(data.result[0].courses[1].cities[1].stateid.countryid._id).to.eql("India");
                expect(data.result[0].courses[1].cities[1].stateid.countryid.code).to.eql("91");

                expect(data.result[0].courses[1].cities[2].city).to.eql("Hisar");
                expect(data.result[0].courses[1].cities[2].stateid.state).to.eql("Haryana");
                expect(data.result[0].courses[1].cities[2].stateid._id).to.eql("Haryana");
                expect(data.result[0].courses[1].cities[2].stateid.countryid.country).to.eql("India");
                expect(data.result[0].courses[1].cities[2].stateid.countryid._id).to.eql("India");
                expect(data.result[0].courses[1].cities[2].stateid.countryid.code).to.eql("91");


                expect(data.result[1].college).to.eql("Universal");
                expect(data.result[1].code).to.eql("Universal");

                expect(data.result[1].courses).to.have.length(2);

                expect(data.result[1].courses[0].course).to.eql("MBBS");
                expect(data.result[1].courses[0].cities).to.have.length(2);

                expect(data.result[1].courses[0].cities[0].city).to.eql("Amritsar");
                expect(data.result[1].courses[0].cities[0].stateid.state).to.eql("Punjab");
                expect(data.result[1].courses[0].cities[0].stateid._id).to.eql("Punjab");
                expect(data.result[1].courses[0].cities[0].stateid.countryid.country).to.eql("India");
                expect(data.result[1].courses[0].cities[0].stateid.countryid._id).to.eql("India");
                expect(data.result[1].courses[0].cities[0].stateid.countryid.code).to.eql("91");

                expect(data.result[1].courses[0].cities[1].city).to.eql("Iceland");
                expect(data.result[1].courses[0].cities[1].stateid.state).to.eql("Newyork");
                expect(data.result[1].courses[0].cities[1].stateid._id).to.eql("Newyork");
                expect(data.result[1].courses[0].cities[1].stateid.countryid.country).to.eql("USA");
                expect(data.result[1].courses[0].cities[1].stateid.countryid._id).to.eql("USA");
                expect(data.result[1].courses[0].cities[1].stateid.countryid.code).to.eql("01");

                expect(data.result[1].courses[1].course).to.eql("MSC");
                expect(data.result[1].courses[1].cities).to.have.length(2);

                expect(data.result[1].courses[1].cities[0].city).to.eql("Amritsar");
                expect(data.result[1].courses[1].cities[0].stateid.state).to.eql("Punjab");
                expect(data.result[1].courses[1].cities[0].stateid._id).to.eql("Punjab");
                expect(data.result[1].courses[1].cities[0].stateid.countryid.country).to.eql("India");
                expect(data.result[1].courses[1].cities[0].stateid.countryid._id).to.eql("India");
                expect(data.result[1].courses[1].cities[0].stateid.countryid.code).to.eql("91");

                expect(data.result[1].courses[1].cities[1].city).to.eql("Sirsa");
                expect(data.result[1].courses[1].cities[1].stateid.state).to.eql("Haryana");
                expect(data.result[1].courses[1].cities[1].stateid._id).to.eql("Haryana");
                expect(data.result[1].courses[1].cities[1].stateid.countryid.country).to.eql("India");
                expect(data.result[1].courses[1].cities[1].stateid.countryid._id).to.eql("India");
                expect(data.result[1].courses[1].cities[1].stateid.countryid.code).to.eql("91");

                done();
            });

            var query1 = {
                "$collection": {collection: "colleges", fields: [
                    {field: "courses", type: "object", multiple: true, fields: [
                        {
                            field: "cities", type: "fk", multiple: true, collection: {collection: "cities", fields: [
                            {field: "stateid", type: "fk", set: ["state"], collection: {collection: "states", fields: [
                                {field: "countryid", type: "fk", collection: "countries", set: ["country"]}
                            ]}}
                        ]}
                        }
                    ]}
                ]},
                "$fields": {
                    "college": 1,
                    "code": 1,
                    "courses.course": 1,
                    "courses.cities": {
                        "$type": "n-row",
                        "$query": {
                            "$collection": {collection: "cities", fields: [
                                {field: "stateid", type: "fk", set: ["state"], collection: {collection: "states", fields: [
                                    {field: "countryid", type: "fk", collection: "countries", set: ["country"]}
                                ]}}
                            ]},
                            "$fields": {
                                "city": 1,
                                "stateid.state": 1,
                                "stateid.countryid.country": 1,
                                "stateid.countryid.code": 1
                            },
                            "$fk": "_id",
                            "$parent": "cities._id"
                        }
                    }
                },
                "$sort": {"college": 1}
            };

            var expectedResult = {"result": [
                {"college": "DAV", "code": "DAV", "courses": [
                    {"course": "BCA", "cities": [
                        {"_id": "Bathinda", "city": "Bathinda", "stateid": {"_id": "Punjab", "state": "Punjab", "countryid": {"_id": "India", "country": "India", "code": "91"}}},
                        {"_id": "Hisar", "city": "Hisar", "stateid": {"_id": "Haryana", "state": "Haryana", "countryid": {"_id": "India", "country": "India", "code": "91"}}}
                    ]},
                    {"course": "MCA", "cities": [
                        {"_id": "Bathinda", "city": "Bathinda", "stateid": {"_id": "Punjab", "state": "Punjab", "countryid": {"_id": "India", "country": "India", "code": "91"}}},
                        {"_id": "Sirsa", "city": "Sirsa", "stateid": {"_id": "Haryana", "state ": "Haryana", "countryid": {"_id": "India", "country": "India", "code": "91"}}},
                        {"_id": "Hisar", "city": "Hisar", "stateid": {"_id": "Haryana", "state": "Haryana", "countryid": {"_id": "India", "country": "India", "code": "91"}}}
                    ]}
                ], "_id": "5339bc88ef9ff1982e10fd2c"},
                {"college": "Universal", "code": "Universal", "courses": [
                    {"c ourse": "MBBS", "cities": [
                        {"_id": "Amritsar", "city": "Amritsar", "stateid": {"_id": "Punjab", "state": "Punjab", "countryid": {"_id": "India", "country": "India", "code": "91"}}},
                        {"_id": "Iceland", "city": "Iceland", "stateid": {"_id": "Newyork", "state": "Newyork", "countryid": {"_id": "USA", "country": "USA", "code": "01"}}}
                    ]},
                    {"course": "MSC", "cities": [
                        {"_id": "Amritsar", "city": "Amritsar", "stateid": {"_id": "Punjab", "state": "Punjab", "countryid": {"_id": "India", "country": "India", "code": "91"}}},
                        {"_id": "Sirsa", "city": "Sirsa", "stateid": {"_id": "Haryana", "state": "Haryana", "countryid": {"_id": "India", "country": "India", "code": "91"}}}
                    ] }
                ], "_id": "5339bc88ef9ff1982e10fd2d"}
            ]};
        })
    })

    it("Error In Fields", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
            if (err) {
                done(err);
                return;
            }
//            var query = {
//                $collection:{  collection:"states", fields:[
//                    {"field":"countryid", type:"fk", collection:"countries", set:["country"]}
//                ]
//                },
//                $fields:{state:1, "countryid":1, "countryid.code":1}
//
//            };


            var fieldsDef = [];
            fieldsDef.push(TEST_UTILITY.populateCollectionField("countryid", Constants.Admin.Fields.Type.FK, undefined, undefined, NorthwindDb.COUNTRIES_TABLE, ["country"]));
            var stateCollection = TEST_UTILITY.populateCollection(NorthwindDb.STATES_TABLE, fieldsDef);

            var query = TEST_UTILITY.populateQuery(stateCollection, {
                state: 1,
                "countryid": 1,
                "countryid.code": 1
            });

            db.query(query, function (err, data) {
                if (err) {
                    console.log("Fields Error In DBRef  : >>>>>>>>>>>   " + err);
                    var fieldError = err.toString().indexOf("Dotted Fields can not be defined if you want to get whole data.") != -1;
                    if (fieldError) {
                        done();
                    } else {
                        done(err);
                    }
                } else {
                    expect(data).to.not.be.ok;
                    done();
                }
            });
        })
    })

})

describe("FkSave testcase", function () {

    afterEach(function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
            db.dropDatabase(function (err) {
                done(err);
            })
        });
    })

    it("Simple fk save", function (done) {
        /*
         *
         * iterate fields, find fk type fields
         * its value in operation should be object or array of object
         * ensure _id in value,
         * if  _id not provided, then need to make a query on the basis of unique index
         * if _id provided
         * if push column are provide then need to make query where push column will be in select list
         * query will always be run
         * change in document on the basis of query result
         * if value not found and upsert was false, then throw error
         * if id not provided and no primary index throw error
         * change type --> object (for mandatory validation of coutnryid)
         * this module will run before data type module
         * if upsert is true --> if _Id not provide -->db.upsertbyid and pass push fields here so that we can get these fiedl value from upsert operation
         *
         *
         *
         * */

        ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
            if (err) {
                done(err);
                return;
            }

            var updates = [
                {
                    $collection: "countries",
                    $insert: [
                        {_id: "India", country: "India"} ,
                        {_id: "USA", country: "USA"}  ,
                        {_id: "Afgan"},
                        {_id: "JAPAN", country: "JAPAN"}
                    ]
                },
                {
                    $collection: {
                        collection: "states",
                        fields: [
                            {field: "countryid", mandatory: true, type: "fk", upsert: true, collection: "countries", set: ["country"]}  /*requird only if mandatory type validation required*/
                        ]
                    },
                    $insert: [
                        {_id: "haryana", state: "haryana", countryid: {$query: {_id: "India"}}},
                        {_id: "punjab", state: "punjab", countryid: {$query: {country: "India"}, $set: {code: 91}}},
                        {_id: "chinastate", state: "chinastate", countryid: {$query: {country: "CHINA"}}},
                        {_id: "newyork", state: "newyork", countryid: {$query: {_id: "USA"}, $set: {country: "USA1"}}},
                        {_id: "ukstate", state: "ukstate", countryid: {$query: {_id: "UK"}, $set: {country: "UK"}}},
                        {_id: "afganstate", state: "afganstate", countryid: {$query: {_id: "Afgan"}, $set: {country: "Afgan"}}},
                        {_id: "japanstate", state: "japanstate", countryid: {$query: {country: "JAPAN"}, $set: {country: "JAPAN1"}}}
                    ]
                }
            ]
            db.batchUpdateById(updates, function (err, res) {
                if (err) {
                    done(err);
                    return;
                }
                db.query({$collection: "states", $sort: {state: 1}}, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log("data>>>" + JSON.stringify(data));
                    expect(data.result).to.have.length(7);
//                   expect(data.result).to.have.length(6);
                    expect(data.result[0].state).to.eql("afganstate");
                    expect(data.result[0].countryid.country).to.eql("Afgan");
                    expect(data.result[1].state).to.eql("chinastate");
                    expect(data.result[1].countryid.country).to.eql("CHINA");
                    expect(data.result[2].state).to.eql("haryana");
                    expect(data.result[2].countryid.country).to.eql("India");
                    expect(data.result[3].state).to.eql("japanstate");
                    expect(data.result[3].countryid.country).to.eql("JAPAN1");
                    expect(data.result[4].state).to.eql("newyork");
                    expect(data.result[4].countryid.country).to.eql("USA1");
                    expect(data.result[5].state).to.eql("punjab");
                    expect(data.result[5].countryid.country).to.eql("India");
                    expect(data.result[6].state).to.eql("ukstate");
                    expect(data.result[6].countryid.country).to.eql("UK");
                    db.query({$collection: "countries", $sort: {country: 1}}, function (err, data) {
                        if (err) {
                            done(err);
                            return;
                        }
                        console.log("data>>>" + JSON.stringify(data));
                        expect(data.result).to.have.length(6);
                        expect(data.result[0].country).to.eql("Afgan");
                        expect(data.result[1].country).to.eql("CHINA");
                        expect(data.result[2].country).to.eql("India");
                        expect(data.result[2].code).to.eql(91);
                        expect(data.result[3].country).to.eql("JAPAN1");
                        expect(data.result[4].country).to.eql("UK");
                        expect(data.result[5].country).to.eql("USA1");

                        done();

                        var expectedResult = {"result": [
                            {"_id": "Afgan", "country": "Afgan"},
                            {"country": "CHINA", "_id": "5348cea576c11af03b0db3ac"},
                            {"_id": "India", "country": "India", code: 91},
                            {"_id": "JAPAN", "country": "JAPAN1"},
                            {"country": "UK", "_id": "UK"},
                            {"_id": "USA", "country": "USA1"}
                        ]};

                    })

                })
            })

        })

    })

    it("Auto save false", function (done) {
        //india exists  only

        ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
            if (err) {
                done(err);
                return;
            }

            var updates = [
                {
                    $collection: {
                        collection: "states",
                        fields: [
                            {field: "countryid", mandatory: true, type: "fk", upsert: false, collection: "countries", set: ["country"]}  /*requird only if mandatory type validation required*/
                        ]
                    },
                    $insert: [
                        {_id: "haryana", state: "haryana", countryid: {$query: {_id: "india"}}}
                    ]
                }
            ]
            db.batchUpdateById(updates, function (err, res) {
                if (err) {
                    var autosaveError = err.toString().indexOf("Autosave is not allowed if upsert is false") != -1;
                    if (autosaveError) {
                        done();
                    } else {
                        done(err);
                    }
                } else {
                    expect(res).not.to.be.ok;
                }
            })

        })

    })

    it("Set not defined if upsert false", function (done) {
        //india exists  only

        ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
            if (err) {
                done(err);
                return;
            }

            var updates = [
                {
                    $collection: {
                        collection: "states",
                        fields: [
                            {field: "countryid", mandatory: true, type: "fk", upsert: false, collection: "countries", set: ["country"]}  /*requird only if mandatory type validation required*/
                        ]
                    },
                    $insert: [
                        {_id: "ukstate", state: "ukstate", countryid: {$query: {_id: "UK"}, $set: {country: "UK"}}}
                    ]
                }
            ]
            db.batchUpdateById(updates, function (err, res) {
                if (err) {
                    var autosaveError = err.toString().indexOf("Fk Column value can not be updated if upsert is false") != -1;
                    if (autosaveError) {
                        done();
                    } else {
                        done(err);
                    }
                } else {
                    expect(res).not.to.be.ok;
                }
            })

        })

    })

    it("More than one result Found", function (done) {
        //india exists  only

        ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
            if (err) {
                done(err);
                return;
            }

            var updates = [
                {
                    $collection: "countries",
                    $insert: [
                        {_id: "India1", country: "India"} ,
                        {_id: "India", country: "India"}
                    ]
                },
                {
                    $collection: {
                        collection: "states",
                        fields: [
                            {field: "countryid", mandatory: true, type: "fk", upsert: false, collection: "countries", set: ["country"]}  /*requird only if mandatory type validation required*/
                        ]
                    },
                    $insert: [
                        {_id: "ukstate", state: "ukstate", countryid: {$query: {country: "India"}}}
                    ]
                }
            ]
            db.batchUpdateById(updates, function (err, res) {
                if (err) {
                    var autosaveError = err.toString().indexOf("More than one result found for column") != -1;
                    if (autosaveError) {
                        done();
                    } else {
                        done(err);
                    }
                } else {
                    expect(res).not.to.be.ok;
                }
            })

        })

    })

    it("Fk Query not defined in insert", function (done) {
        //india exists  only

        ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
            if (err) {
                done(err);
                return;
            }

            var updates = [
                {
                    $collection: {
                        collection: "states",
                        fields: [
                            {field: "countryid", mandatory: true, type: "fk", upsert: true, collection: "countries", set: ["country"]}  /*requird only if mandatory type validation required*/
                        ]
                    },
                    $insert: [
                        {_id: "ukstate", state: "ukstate", countryid: {$set: {country: "UK"}}}
                    ]
                }
            ]
            db.batchUpdateById(updates, function (err, res) {
                if (err) {
                    done(err);
                    return;
                } else {
                    db.query({$collection: "states"}, function (err, data) {
                        if (err) {
                            done(err);
                            return;
                        }
                        console.log("data>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(data));
                        expect(data.result).to.have.length(1);
                        expect(data.result[0].state).to.eql("ukstate");
                        expect(data.result[0].countryid.country).to.eql("UK");
                        done();
                    })
                }
            })

        })

    })

    it("FK in array column", function (done) {

        //cash account allready esists
        ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
            if (err) {
                done(err);
                return;
            }


            var batchUpdates = [
                {
                    $collection: {collection: "vouchers", fields: [
                        {field: "vlis", type: "object", multiple: true, fields: [
                            {field: "accountid", type: "fk", collection: "accounts", upsert: true, set: ["account"]}
                        ]}
                    ]},
                    $insert: [
                        {
                            _id: "1",
                            voucherno: "001",
                            vlis: [
                                {_id: "1", accountid: {_id: "cash"}, amount: 100},
                                {_id: "2", accountid: {$query: {account: "cash"}}, amount: 100},
                                {_id: "3", accountid: {$query: {_id: "salary", account: "salary"}}, amount: 200}
                            ]
//                            vlis:{
//                                $insert:[
//                                    {_id:"1", accountid:{_id:"cash"}, amount:100},
//                                    {_id:"2", accountid:{$query:{account:"cash"}}, amount:100},
//                                    {_id:"3", accountid:{$query:{_id:"salary", account:"salary"}}, amount:200}
//                                ]
//                            }
                        }
                    ]

                }
            ];

            db.batchUpdateById(batchUpdates, function (err, res) {
                if (err) {
                    done(err);
                    return;
                }
                console.log("res >>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(res));
                db.query({$collection: "vouchers", $sort: {voucherno: 1}}, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log("data>>>" + JSON.stringify(data));
                    expect(data.result).to.have.length(1);
                    expect(data.result[0].voucherno).to.eql("001");
                    expect(data.result[0].vlis).to.have.length(3);
                    expect(data.result[0].vlis[0].accountid._id).to.eql("cash");
                    expect(data.result[0].vlis[0].amount).to.eql(100);
                    expect(data.result[0].vlis[1].accountid.account).to.eql("cash");
                    expect(data.result[0].vlis[1].amount).to.eql(100);
                    expect(data.result[0].vlis[2].accountid._id).to.eql("salary");
                    expect(data.result[0].vlis[2].accountid.account).to.eql("salary");
                    expect(data.result[0].vlis[2].amount).to.eql(200);
                    done();

                })
            })

            var expectedResult = {"result": [
                {"_id": "1", "voucherno": "001", "vlis": [
                    {"_id": "1", "accountid": {"_id": "cash"}, "amount": 100},
                    {"_id": "2", "accountid": {"account": "cash", "_id": "5348e613ee6e309404a84e13"}, "amount": 100},
                    {"_id": "3", "accountid": {"_id": "salary", "account": "salary"}, "amount": 200}
                ]}
            ]};

        })
    });

    it("Multiple FK in array column", function (done) {

        //cash account allready esists
        ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
            if (err) {
                done(err);
                return;
            }


            var batchUpdates = [
                {
                    $collection: {collection: "vouchers", fields: [
                        {field: "vlis", type: "object", multiple: true, fields: [
                            {field: "accountid", type: "fk", multiple: true, collection: "accounts", upsert: true, set: ["account"]}
                        ]}
                    ]},
                    $insert: [
                        {
                            _id: "1",
                            voucherno: "001",
                            vlis: [
                                {_id: "1", accountid: [
                                    {_id: "cash"}
                                ], amount: 100},
                                {_id: "2", accountid: [
                                    {$query: {account: "cash"}},
                                    {$query: {account: "salary"}}
                                ], amount: 100},
                                {_id: "3", accountid: [
                                    {$query: {_id: "salary"}, $set: {account: "salary"}}
                                ], amount: 200}
                            ]
//                            vlis:[
//                                {_id:"1", accountid:{$insert:[
//                                    {_id:"cash"}
//                                ]}, amount:100},
//                                {_id:"2", accountid:{$insert:[
//                                    {$query:{account:"cash"}},
//                                    {$query:{account:"salary"}}
//                                ]}, amount:100},
//                                {_id:"3", accountid:{$insert:[
//                                    {$query:{_id:"salary", account:"salary"}}
//                                ]}, amount:200}
//                            ]
//                            vlis:{
//                                $insert:[
//                                    {_id:"1", accountid:{$insert:[
//                                        {_id:"cash"}
//                                    ]}, amount:100},
//                                    {_id:"2", accountid:{$insert:[
//                                        {$query:{account:"cash"}},
//                                        {$query:{account:"salary"}}
//                                    ]}, amount:100},
//                                    {_id:"3", accountid:{$insert:[
//                                        {$query:{_id:"salary", account:"salary"}}
//                                    ]}, amount:200}
//                                ]
//                            }
                        }
                    ]
                }
            ];

            db.batchUpdateById(batchUpdates, function (err, res) {
                if (err) {
                    done(err);
                    return;
                }
                console.log("res >>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(res));
                db.query({$collection: "vouchers", $sort: {voucherno: 1}}, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log("data>>>" + JSON.stringify(data));
                    expect(data.result).to.have.length(1);
                    expect(data.result[0].voucherno).to.eql("001");
                    expect(data.result[0].vlis).to.have.length(3);
                    expect(data.result[0].vlis[0].amount).to.eql(100);
                    expect(data.result[0].vlis[0].accountid).to.have.length(1);
                    expect(data.result[0].vlis[0].accountid[0]._id).to.eql("cash");
                    expect(data.result[0].vlis[1].amount).to.eql(100);
                    expect(data.result[0].vlis[1].accountid).to.have.length(2);
                    expect(data.result[0].vlis[1].accountid[0].account).to.eql("cash");
                    expect(data.result[0].vlis[1].accountid[1].account).to.eql("salary");
                    expect(data.result[0].vlis[2].amount).to.eql(200);
                    expect(data.result[0].vlis[2].accountid).to.have.length(1);
                    expect(data.result[0].vlis[2].accountid[0]._id).to.eql("salary");
                    expect(data.result[0].vlis[2].accountid[0].account).to.eql("salary");
                    db.query({$collection: "accounts", $sort: {account: 1, _id: 1}}, function (err, data) {
                        if (err) {
                            done(err);
                            return;
                        }
                        console.log("data>>>" + JSON.stringify(data));
                        expect(data.result).to.have.length(4);
                        expect(data.result[0]._id).to.eql("cash");
                        expect(data.result[1].account).to.eql("cash");
                        expect(data.result[2].account).to.eql("salary");
                        expect(data.result[2]._id).to.eql("salary");
                        expect(data.result[3].account).to.eql("salary");
                        done();

                    })
                })
            })

            var expectedResult = {"result": [
                {"_id": "1", "voucherno": "001", "vlis": [
                    {"_id": "1", "accountid": [
                        {"_id": "cash"}
                    ], "amount": 100},
                    {"_id": "2", "accountid": [
                        {"account": "cash", "_id": "5348eb784f3b45442cc00bfc"},
                        {"account": "salary", "_id": "5348eb784f3b45442cc00c02"}
                    ], "amount": 100},
                    {"_id": "3", "accountid": [
                        {"_id": "salary", "account": "salary"}
                    ], "amount": 200}
                ]}
            ]}

        })
    });

    it("array of fk", function (done) {
        //employees rohit allready saved.

        ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var batchUpdates = [
                {$collection: {collection: "tasks", fields: [
                    {field: "ownerid", type: "fk", multiple: true, collection: "employees", set: ["employee"], upsert: true}
                ]}, $insert: [
                    {task: "task1", ownerid: [
                        {_id: "rohit"},
                        {$query: {_id: "pawan", employee: "pawan"}}
                    ]},
                    {task: "task2", ownerid: {$insert: [
                        {$query: {employee: "rohit"}},
                        {$query: {employee: "manjeet"}} ,
                        {$query: {employee: "pawan"}}
                    ]}}
                ]}
            ]

//            var batchUpdates = [
//                {$collection:{collection:"tasks", fields:[
//                    {field:"ownerid", multiple:true, type:"object", collection:"employees", set:["employee"], upsert:true}
//                ]}, $insert:[
//                    {task:"task1", ownerid:{
//                        $insert:[
//                            {_id:"rohit"},
//                            {_id:"pawan", employee:"pawan"}
//                        ]
//                    }},
//                    {task:"task2", ownerid:[
//                        {employee:"rohit"},
//                        {employee:"manjeet"},
//                        {employee:"pawan"}
//                    ]}
//                ]}
//            ]
            db.batchUpdateById(batchUpdates, function (err, res) {
                if (err) {
                    done(err);
                    return;
                }
                db.query({$collection: "tasks", $sort: {}}, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log("data>>>" + JSON.stringify(data));
                    expect(data.result).to.have.length(2);
                    expect(data.result[0].task).to.eql("task1");
                    expect(data.result[0].ownerid).to.have.length(2);
                    expect(data.result[0].ownerid[0]._id).to.eql("rohit");
                    expect(data.result[0].ownerid[1]._id).to.eql("pawan");
                    expect(data.result[0].ownerid[1].employee).to.eql("pawan");
                    expect(data.result[1].task).to.eql("task2");
                    expect(data.result[1].ownerid).to.have.length(3);
                    expect(data.result[1].ownerid[0].employee).to.eql("rohit");
                    expect(data.result[1].ownerid[1].employee).to.eql("manjeet");
                    expect(data.result[1].ownerid[2].employee).to.eql("pawan");
                    done();
                })
            })
        })

    });

    it("Two level dotted Fk", function (done) {
        //employees rohit allready saved.

        ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var batchUpdates = [
                {$collection: {collection: "cities", fields: [
                    {field: "stateid", type: "fk", collection: {collection: "states", fields: [
                        {field: "countryid", type: "fk", collection: "countries", upsert: true, set: ["country"]}
                    ]}, set: ["state", "countryid.code"], upsert: true}
                ]}, $insert: [
                    {
                        city: "Hisar",
                        stateid: {
                            $query: {
                                _id: "Haryana",
                                state: "Haryana",
                                countryid: {
                                    $query: {
                                        _id: "India"
                                    }, $set: {"code": 91, country: "India"}
                                }
                            }
                        }
                    }
                ]}
            ]

            db.batchUpdateById(batchUpdates, function (err, res) {
                if (err) {
                    done(err);
                    return;
                }
                db.query({$collection: "cities", $sort: {"city": 1}}, function (err, cities) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log("cities>>>" + JSON.stringify(cities));
                    expect(cities.result).to.have.length(1);
                    expect(cities.result[0].city).to.eql("Hisar");
                    expect(cities.result[0].stateid.state).to.eql("Haryana");
                    expect(cities.result[0].stateid.countryid.code).to.eql(91);
                    db.query({$collection: "states", $sort: {"state": 1}}, function (err, states) {
                        if (err) {
                            done(err);
                            return;
                        }
                        console.log("states>>>" + JSON.stringify(states));
                        expect(states.result).to.have.length(1);
                        expect(states.result[0].state).to.eql("Haryana");
                        expect(states.result[0].countryid.country).to.eql("India");
                        db.query({$collection: "countries", $sort: {"country": 1}}, function (err, countries) {
                            if (err) {
                                done(err);
                                return;
                            }
                            console.log("countries>>>" + JSON.stringify(countries));
                            expect(countries.result).to.have.length(1);
                            expect(countries.result[0].country).to.eql("India");
                            expect(countries.result[0].code).to.eql(91);
                            done();
                        })
                    })
                })
            })
        })

    });

    it("update in fk as update country code when state is already saved", function (done) {

        ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
            if (err) {
                done(err);
                return;
            }

            var updates = [
                {
                    $collection: "countries",
                    $insert: [
                        {_id: "India", country: "India"}
                    ]
                },
                {
                    $collection: {
                        collection: "states",
                        fields: [
                            {field: "countryid", mandatory: true, type: "fk", upsert: true, collection: "countries", set: ["country"]}  /*requird only if mandatory type validation required*/
                        ]
                    },
                    $insert: [
                        {_id: "punjab", state: "punjab", countryid: {$query: {_id: "India"}, $set: {code: 91}}}
                    ]
                },
                {
                    $collection: {
                        collection: "states",
                        fields: [
                            {field: "countryid", mandatory: true, type: "fk", upsert: true, collection: "countries", set: ["country"]}  /*requird only if mandatory type validation required*/
                        ]
                    },
                    $update: [
                        {_id: "punjab", $set: {state: "punjab1", countryid: {$set: {code: 100}}}}
                    ]
                }
            ]
            db.batchUpdateById(updates, function (err, res) {
                if (err) {
                    done(err);
                    return;
                }
                db.query({$collection: "states", $sort: {state: 1}}, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log("data>>>" + JSON.stringify(data));
                    expect(data.result).to.have.length(1);
                    expect(data.result[0].state).to.eql("punjab1");
                    expect(data.result[0].countryid.country).to.eql("India");
                    db.query({$collection: "countries", $sort: {country: 1}}, function (err, data) {
                        if (err) {
                            done(err);
                            return;
                        }
                        console.log("data>>>" + JSON.stringify(data));
                        expect(data.result).to.have.length(1);
                        expect(data.result[0].country).to.eql("India");
                        expect(data.result[0].code).to.eql(100);
                        done();
                    })

                })
            })

        })
    })

    it("update in array of fk as update in employee and employee code when task is already saved", function (done) {

        ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {
                    $collection: "employees",
                    $insert: [
                        {_id: "rohit", employee: "rohit", "code": "dfg-1048"},
                        {_id: "pawan", employee: "pawan", "code": "dfg-1045"}
                    ]
                },
                {
                    $collection: {
                        collection: "tasks",
                        fields: [
                            {field: "owners", mandatory: true, multiple: true, type: "fk", upsert: true, collection: "employees", set: ["employee"]}  /*requird only if mandatory type validation required*/
                        ]
                    },
                    $insert: [
                        {_id: "task1", task: "task1", owners: [
                            {_id: "rohit", employee: "rohit"},
                            {_id: "pawan", employee: "pawan"}
                        ]
                        }
                    ]
                },
                {
                    $collection: {
                        collection: "tasks",
                        fields: [
                            {field: "owners", mandatory: true, multiple: true, type: "fk", upsert: true, collection: "employees", set: ["employee"]}  /*requird only if mandatory type validation required*/
                        ]
                    },
                    $update: [
                        {_id: "task1",
                            $set: {
                                owners: {
                                    $update: [
                                        {_id: "rohit", $set: {code: "dfg-1000"}}
                                    ],
                                    $insert: [
                                        {_id: "sachin", $set: {employee: "sachin", code: "dfg-1100"}}
                                    ],
                                    $delete: [
                                        {_id: "pawan"}
                                    ]
                                }
                            }
                        }
                    ]
                }
            ]
            db.batchUpdateById(updates, function (err, res) {
                if (err) {
                    done(err);
                    return;
                }
                db.query({$collection: "tasks", $sort: {task: 1}}, function (err, tasks) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log("tasks>>>" + JSON.stringify(tasks));
                    expect(tasks.result).to.have.length(1);
                    expect(tasks.result[0].task).to.eql("task1");
                    db.query({$collection: "employees", $sort: {employee: 1}}, function (err, employees) {
                        if (err) {
                            done(err);
                            return;
                        }
                        console.log("employees>>>" + JSON.stringify(employees));
                        expect(employees.result).to.have.length(3);
                        expect(employees.result[0].employee).to.eql("pawan");
                        expect(employees.result[0].code).to.eql("dfg-1045");
                        expect(employees.result[1].employee).to.eql("rohit");
                        expect(employees.result[1].code).to.eql("dfg-1000");
                        expect(employees.result[2].employee).to.eql("sachin");
                        expect(employees.result[2].code).to.eql("dfg-1100");
                        done();
                    })

                })
            })

        })

    })

    it("update fk as update countryid when state is already saved", function (done) {


        ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
            if (err) {
                done(err);
                return;
            }

            var updates = [
                {
                    $collection: "countries",
                    $insert: [
                        {_id: "Srilanka", country: "Srilanka", "code": 96},
                        {_id: "India", country: "India", "code": 91}
                    ]
                },
                {
                    $collection: {
                        collection: "states",
                        fields: [
                            {field: "countryid", mandatory: true, type: "fk", upsert: true, collection: "countries", set: ["country", "code"]}  /*requird only if mandatory type validation required*/
                        ]
                    },
                    $insert: [
                        {_id: "Haryana", state: "Haryana", countryid: {_id: "Srilanka", country: "Srilanka", code: 96}}
                    ]
                },
                {
                    $collection: {
                        collection: "states",
                        fields: [
                            {field: "countryid", mandatory: true, type: "fk", upsert: true, collection: "countries", set: ["country", "code"]}  /*requird only if mandatory type validation required*/
                        ]
                    },
                    $update: [
                        {_id: "Haryana", $set: {countryid: {$query: {country: "India"}}}}
                    ]
                }
            ]
            db.batchUpdateById(updates, function (err, res) {
                if (err) {
                    done(err);
                    return;
                }
                db.query({$collection: "states", $sort: {state: 1}}, function (err, states) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log("states>>>" + JSON.stringify(states));
                    expect(states.result).to.have.length(1);
                    expect(states.result[0].state).to.eql("Haryana");
                    expect(states.result[0].countryid.country).to.eql("India");
                    expect(states.result[0].countryid.code).to.eql(91);
                    expect(states.result[0].countryid._id).to.eql("India");
                    db.query({$collection: "countries", $sort: {country: 1}}, function (err, countries) {
                        if (err) {
                            done(err);
                            return;
                        }
                        console.log("countries>>>" + JSON.stringify(countries));
                        expect(countries.result).to.have.length(2);
                        expect(countries.result[0].country).to.eql("India");
                        expect(countries.result[0].code).to.eql(91);
                        expect(countries.result[1].country).to.eql("Srilanka");
                        expect(countries.result[1].code).to.eql(96);
                        done();
                    })

                })
            })

        })
    })

    it("Update FK in array column as update account", function (done) {

        //cash account allready esists
        ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
            if (err) {
                done(err);
                return;
            }


            var batchUpdates = [
                {
                    $collection: {collection: "vouchers", fields: [
                        {field: "vlis", type: "object", multiple: true, fields: [
                            {field: "accountid", type: "fk", collection: "accounts", upsert: true, set: ["account"]}
                        ]}
                    ]},
                    $insert: [
                        {
                            _id: "1",
                            voucherno: "001",
                            vlis: [
                                {_id: "1", accountid: {_id: "cash"}, amount: 100},
                                {_id: "2", accountid: {$query: {account: "cash"}}, amount: 100},
                                {_id: "3", accountid: {$query: {_id: "salary", account: "salary"}}, amount: 200}
                            ]
                        }
                    ]

                } ,
                {
                    $collection: {collection: "vouchers", fields: [
                        {field: "vlis", type: "object", multiple: true, fields: [
                            {field: "accountid", type: "fk", collection: "accounts", upsert: true, set: ["account"]}
                        ]}
                    ]},
                    $update: [
                        {
                            _id: "1",
                            $set: {
                                voucherno: "002",
                                vlis: {
                                    $insert: [
                                        {_id: "4", accountid: {_id: "cash"}, amount: 500}
                                    ],
                                    $update: [
                                        {$query: {_id: "1"}, $set: { amount: 400, accountid: {$set: {account: "profit"}}}}
                                    ]
                                }
                            }
                        }
                    ]
                }
            ];

            db.batchUpdateById(batchUpdates, function (err, res) {
                if (err) {
                    done(err);
                    return;
                }
                console.log("res >>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(res));
                db.query({$collection: "vouchers", $sort: {voucherno: 1}}, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log("data>>>" + JSON.stringify(data));
                    expect(data.result).to.have.length(1);
                    expect(data.result[0].voucherno).to.eql("002");
                    expect(data.result[0].vlis).to.have.length(4);
                    expect(data.result[0].vlis[0].accountid._id).to.eql("cash");
                    expect(data.result[0].vlis[0].accountid.account).to.eql("profit");
                    expect(data.result[0].vlis[0].amount).to.eql(400);
                    expect(data.result[0].vlis[1].accountid.account).to.eql("cash");
                    expect(data.result[0].vlis[1].amount).to.eql(100);
                    expect(data.result[0].vlis[2].accountid._id).to.eql("salary");
                    expect(data.result[0].vlis[2].accountid.account).to.eql("salary");
                    expect(data.result[0].vlis[2].amount).to.eql(200);
                    expect(data.result[0].vlis[3].accountid._id).to.eql("cash");
                    expect(data.result[0].vlis[3].amount).to.eql(500);
                    done();

                })
            })

            var expectedResult = {"result": [
                {"_id": "1", "vlis": [
                    {"_id": "1", "accountid": {"_id": "cash", "account": "profit"}, "amount": 400},
                    {"_id": "2", "accountid": {"_id": "534cd7541cdd58b03788536e", "account": "profit"}, "amount": 400},
                    {"_id": "3", "accountid": {"_id": "salary", "account": "salary"}, "amount": 200},
                    {"_id": "4", "accountid": {"_id": "cash"}, "amount": 500}
                ], "voucherno": "002"}
            ]};


        })
    });

    it("Update FK column change complete", function (done) {

        //cash account allready esists
        ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
            if (err) {
                done(err);
                return;
            }


            var batchUpdates = [
                {
                    $collection: {collection: "vouchers", fields: [
                        {field: "accountid", type: "fk", collection: "accounts", upsert: true, set: ["account"]}
                    ]},
                    $insert: [
                        {
                            _id: "1",
                            voucherno: "001",
                            accountid: {$query: {_id: "salary"}},
                            type: "salary"
                        }
                    ]

                } ,
                {
                    $collection: {collection: "vouchers", fields: [
                        {field: "accountid", type: "fk", collection: "accounts", upsert: true, set: ["account"]}
                    ]},
                    $update: [
                        {
                            _id: "1",
                            $set: {
                                voucherno: "002",
                                accountid: {_id: "profit"}
                            },
                            $unset: {type: 1}
                        }
                    ]
                }
            ];

            db.batchUpdateById(batchUpdates, function (err, res) {
                if (err) {
                    done(err);
                    return;
                }
                console.log("res >>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(res));
                db.query({$collection: "vouchers", $sort: {voucherno: 1}}, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log("data>>>" + JSON.stringify(data));
                    expect(data.result).to.have.length(1);
                    expect(data.result[0].voucherno).to.eql("002");
                    expect(data.result[0].accountid._id).to.eql("profit");
                    db.query({$collection: "accounts", $sort: {account: 1}}, function (err, data) {
                        if (err) {
                            done(err);
                            return;
                        }
                        console.log("data>>>" + JSON.stringify(data));
                        expect(data.result).to.have.length(2);
                        expect(data.result[0]._id).to.eql("salary");
                        expect(data.result[1]._id).to.eql("profit");
                        done();

                    })

                })
            })

            var expectedResult = {"result": [
                {"_id": "1", "accountid": {"_id": "534cd7541cdd58b03788536e", "account": "profit"}, "voucherno": "002"}
            ]};

        })
    });

    it("Update FK in array column as change accountid complete", function (done) {

        //cash account allready esists
        ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
            if (err) {
                done(err);
                return;
            }


            var batchUpdates = [
                {
                    $collection: {collection: "vouchers", fields: [
                        {field: "vlis", type: "object", multiple: true, fields: [
                            {field: "accountid", type: "fk", collection: "accounts", upsert: true, set: ["account"]}
                        ]}
                    ]},
                    $insert: [
                        {
                            _id: "1",
                            voucherno: "001",
                            vlis: [
                                {_id: "3", accountid: {$query: {_id: "salary"}, $set: {account: "salary"}}, amount: 100}
                            ]
                        }
                    ]

                } ,
                {
                    $collection: {collection: "vouchers", fields: [
                        {field: "vlis", type: "object", multiple: true, fields: [
                            {field: "accountid", type: "fk", collection: "accounts", upsert: true, set: ["account"]}
                        ]}
                    ]},
                    $update: [
                        {
                            _id: "1",
                            $set: {
                                voucherno: "002",
                                vlis: {
                                    $update: [
                                        {$query: {_id: "3"}, $set: {amount: 400, accountid: {$query: {_id: "profit"}, $set: {account: "profit"}}}}
//                                        {$query:{_id:"3"}, $set:{amount:400, accountid:{$query:{_id:"profit",account:"profit"}}}}
                                    ]
                                }
                            }
                        }
                    ]
                }
            ];

            db.batchUpdateById(batchUpdates, function (err, res) {
                if (err) {
                    done(err);
                    return;
                }
                console.log("res >>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(res));
                db.query({$collection: "vouchers", $sort: {voucherno: 1}}, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log("data>>>" + JSON.stringify(data));
                    expect(data.result).to.have.length(1);
                    expect(data.result[0].voucherno).to.eql("002");
                    expect(data.result[0].vlis).to.have.length(1);
                    expect(data.result[0].vlis[0].accountid._id).to.eql("profit");
                    expect(data.result[0].vlis[0].accountid.account).to.eql("profit");
                    expect(data.result[0].vlis[0].amount).to.eql(400);
                    done();

                })
            })

            var expectedResult = {"result": [
                {"_id": "1", "vlis": [
                    {"_id": "1", "accountid": {"_id": "534cd7541cdd58b03788536e", "account": "profit"}, "amount": 400},
                    {"_id": "2", "accountid": {"_id": "534cd7541cdd58b03788536e", "account": "profit"}, "amount": 400},
                    {"_id": "3", "accountid": {"_id": "salary", "account": "salary"}, "amount": 200},
                    {"_id": "4", "accountid": {"_id": "cash"}, "amount": 500}
                ], "voucherno": "002"}
            ]};

        })
    });

    it.skip("Update FK in array column as update account with multiple vlis", function (done) {

        //cash account allready esists
        ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
            if (err) {
                done(err);
                return;
            }


            var batchUpdates = [
                {
                    $collection: {collection: "vouchers", fields: [
                        {field: "vlis", type: "object", multiple: true, fields: [
                            {field: "accountid", type: "fk", collection: "accounts", upsert: true, set: ["account"]}
                        ]}
                    ]},
                    $insert: [
                        {
                            _id: "1",
                            voucherno: "001",
                            vlis: [
                                {_id: "1", accountid: {_id: "cash"}, amount: 100},
                                {_id: "2", accountid: {$query: {account: "cash"}}, amount: 100},
                                {_id: "3", accountid: {$query: {_id: "salary", account: "salary"}}, amount: 200}
                            ]
                        }
                    ]

                } ,
                {
                    $collection: {collection: "vouchers", fields: [
                        {field: "vlis", type: "object", multiple: true, fields: [
                            {field: "accountid", type: "fk", collection: "accounts", upsert: true, set: ["account"]}
                        ]}
                    ]},
                    $update: [
                        {
                            _id: "1",
                            $set: {
                                voucherno: "002",
                                vlis: {
                                    $insert: [
                                        {_id: "4", accountid: {_id: "cash"}, amount: 500}
                                    ],
                                    $update: [
                                        {$query: {amount: 100}, $set: { amount: 400, accountid: {$set: {account: "profit"}}}}
                                    ]
                                }
                            }
                        }
                    ]
                }
            ];

            db.batchUpdateById(batchUpdates, function (err, res) {
                if (err) {
                    done(err);
                    return;
                }
                console.log("res >>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(res));
                db.query({$collection: "vouchers", $sort: {voucherno: 1}}, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log("data>>>" + JSON.stringify(data));
                    expect(data.result).to.have.length(1);
                    expect(data.result[0].voucherno).to.eql("002");
                    expect(data.result[0].vlis).to.have.length(4);
                    expect(data.result[0].vlis[0].accountid._id).to.eql("cash");
                    expect(data.result[0].vlis[0].accountid.account).to.eql("profit");
                    expect(data.result[0].vlis[0].amount).to.eql(400);
                    expect(data.result[0].vlis[1].accountid.account).to.eql("profit");
                    expect(data.result[0].vlis[1].amount).to.eql(400);
                    expect(data.result[0].vlis[2].accountid._id).to.eql("salary");
                    expect(data.result[0].vlis[2].accountid.account).to.eql("salary");
                    expect(data.result[0].vlis[2].amount).to.eql(200);
                    expect(data.result[0].vlis[3].accountid._id).to.eql("cash");
                    expect(data.result[0].vlis[3].amount).to.eql(500);
                    done();

                })
            })

            var expectedResult = {"result": [
                {"_id": "1", "vlis": [
                    {"_id": "1", "accountid": {"_id": "cash", "account": "profit"}, "amount": 400},
                    {"_id": "2", "accountid": {"_id": "534cd7541cdd58b03788536e", "account": "profit"}, "amount": 400},
                    {"_id": "3", "accountid": {"_id": "salary", "account": "salary"}, "amount": 200},
                    {"_id": "4", "accountid": {"_id": "cash"}, "amount": 500}
                ], "voucherno": "002"}
            ]};


        })
    });

    it("Dont query if data is passed in simple fk", function (done) {


        ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
            if (err) {
                done(err);
                return;
            }

            var updates = [
                {
                    $collection: "countries",
                    $insert: [
                        {_id: "India", country: "India", "code": 91}
                    ]
                }
            ]
            db.batchUpdateById(updates, function (err, res) {
                if (err) {
                    done(err);
                    return;
                }
                db.query({$collection: {
                    collection: "states",
                    fields: [
                        {field: "countryid", mandatory: true, type: "fk", upsert: true, collection: "countries", set: ["country"]}  /*requird only if mandatory type validation required*/
                    ]
                }, $fields: {state: 1, "countryid.country": 1, "countryid.code": 1}, $data: [
                    {_id: "Haryana", state: "Haryana", countryid: {_id: "India", country: "India"} }
                ], $sort: {state: 1}}, function (err, states) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log("states>>>" + JSON.stringify(states));
                    expect(states.result).to.have.length(1);
                    expect(states.result[0]._id).to.eql("Haryana");
                    expect(states.result[0].state).to.eql("Haryana");
                    expect(states.result[0].countryid._id).to.eql("India");
                    expect(states.result[0].countryid.country).to.eql("India");
                    expect(states.result[0].countryid.code).to.eql(91);
                    done();

                    var expectedResult = {"result": [
                        {"_id": "Haryana", "state": "Haryana", "countryid": {"_id": "India", "country": "India", "code": 91}}
                    ]};
                })
            })

        })
    })

    it("Dont query if data is passed in fk in Array", function (done) {


        ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
            if (err) {
                done(err);
                return;
            }

            var updates = [
                {
                    $collection: "accounts",
                    $insert: [
                        {_id: "SBI", account: "SBI", "type": "Salary"}
                    ]
                }
            ]
            db.batchUpdateById(updates, function (err, res) {
                if (err) {
                    done(err);
                    return;
                }
                db.query({$collection: {
                    collection: "invoices",
                    fields: [
                        {field: "ilis", mandatory: true, type: "object", fields: [
                            {field: "accountid", type: "fk", collection: "accounts", set: ["account"]}
                        ]}
                    ]
                }, $fields: {invoice_no: 1, "ilis.accountid": 1, "ilis.accountid.account": 1, "ilis.accountid.type": 1}, $data: [
                    {_id: "1", invoice_no: "12345", ilis: [
                        {accountid: {_id: "SBI", account: "SBI"}}
                    ]}
                ]}, function (err, invoices) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log("invoices>>>" + JSON.stringify(invoices));
                    expect(invoices.result).to.have.length(1);
                    expect(invoices.result[0]._id).to.eql("1");
                    expect(invoices.result[0].invoice_no).to.eql("12345");
                    expect(invoices.result[0].ilis).to.have.length(1);
                    expect(invoices.result[0].ilis[0].accountid._id).to.eql("SBI");
                    expect(invoices.result[0].ilis[0].accountid.account).to.eql("SBI");
                    expect(invoices.result[0].ilis[0].accountid.type).to.eql("Salary");
                    done();

                    var expectedResult = [
                        {"_id": "1", "invoice_no": "12345", "ilis": [
                            {"accountid": {"_id": "SBI", "account": "SBI", "type": "Salary"}}
                        ]}
                    ];
                })
            })

        })
    })
})

