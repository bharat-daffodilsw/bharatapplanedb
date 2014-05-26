/**
 *
 *  mocha --recursive --timeout 150000 -g GroupQuerytestcase --reporter spec
 *
 *   mocha --recursive --timeout 150000 -g "group by on n Fk column more than one with having and sort and aggregates and data and array with min max" --reporter spec
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
//data[NorthwindDb.SCHOOLS_TABLE] = NorthwindDb.Schools;
//data[NorthwindDb.YEARS_TABLE] = NorthwindDb.Years;
//data[NorthwindDb.COLLEGES_TABLE] = NorthwindDb.Colleges;
data[NorthwindDb.ACCOUNTS_TABLE] = NorthwindDb.Accounts;
data[NorthwindDb.ACCOUNT_GROUPS_TABLE] = NorthwindDb.AccountGroups;
data[NorthwindDb.VOUCHERS_TABLE] = NorthwindDb.Vouchers;
data[NorthwindDb.TASK_TABLE] = NorthwindDb.Tasks;

var collectionsToRegister = [
    {collection:NorthwindDb.TASK_WITHOUT_ID_TABLE, fields:[
        {field:"businessfunctionid", type:"fk", collection:NorthwindDb.BUSINESS_FUNCTIONS_WITHOUT_ID_TABLE, upsert:true, "set":["businessfunction"]}
    ]}
];


describe("GroupQuerytestcase", function () {
    describe("Tasktabletestcase", function () {
        before(function (done) {
            console.log("before called...");
            TEST_UTILITY.insertData(data, done);
        })

        after(function (done) {
            TEST_UTILITY.removeData(data, done);
        })

        // tasks and its count
        //TODO doubt
        it.skip("data and total count", function (done) {
            ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
                if (err) {
                    done(err);
                    return;
                }
                var query = TEST_UTILITY.populateQuery(NorthwindDb.TASK_TABLE, undefined, undefined, {task:1}, {_id:null, count:{$sum:1}});
                db.query(query, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    expect(data.result).to.have.length(3);
                    expect(data.result.count).to.eql(3);


                    expect(data.result[0].task).to.eql("task1");
                    expect(data.result[0].status).to.eql("Completed");
                    expect(data.result[0].priority).to.eql(1);
                    expect(data.result[0].estHrs).to.eql(2);


                    expect(data.result[1].task).to.eql("task2");
                    expect(data.result[1].status).to.eql("New");
                    expect(data.result[1].priority).to.eql(2);
                    expect(data.result[1].estHrs).to.eql(3);

                    expect(data.result[2].task).to.eql("task3");
                    expect(data.result[2].status).to.eql("Inprogress");
                    expect(data.result[2].priority).to.eql(3);
                    expect(data.result[2].estHrs).to.eql(4);


                    done();
                });
            })
        })

        //tasks and total of esthrs.

        it.skip("data and total aggregates", function (done) {
            done();
        })

        // in tasks --> group by on businessfunction --> get count and total of estefforts

        //TODO businessfunctionid will be provided inteligently in result, user should specify this using $first or other thing...
        it("group by on fk column aggregates", function (done) {
            ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
                if (err) {
                    done(err);
                    return;
                }
                var group = {
                    _id:"$businessfunctionid._id",
                    count:{$sum:1},
                    estefforts:{$sum:"$estefforts"},
                    businessfunctionid:{$first:"$businessfunctionid"}
                }
                group[Constants.Query.SORT] = {businessfunctionid:1};

                var query = TEST_UTILITY.populateQuery(NorthwindDb.TASK_TABLE, undefined, undefined, {task:1}, group);

                db.query(query, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    expect(data.result).to.have.length(4);
//
                    expect(data.result[0]._id).to.eql("Accounts");
                    expect(data.result[0].count).to.eql(2);
                    expect(data.result[0].estefforts).to.eql(19);
                    expect(data.result[0].businessfunctionid._id).to.eql("Accounts");
                    expect(data.result[0].businessfunctionid.businessfunction).to.eql("Accounts");

                    expect(data.result[1]._id).to.eql("Delivery");
                    expect(data.result[1].count).to.eql(5);
                    expect(data.result[1].estefforts).to.eql(22);
                    expect(data.result[1].businessfunctionid._id).to.eql("Delivery");
                    expect(data.result[1].businessfunctionid.businessfunction).to.eql("Delivery");

                    expect(data.result[2]._id).to.eql("HR");
                    expect(data.result[2].count).to.eql(2);
                    expect(data.result[2].estefforts).to.eql(23);
                    expect(data.result[2].businessfunctionid._id).to.eql("HR");
                    expect(data.result[2].businessfunctionid.businessfunction).to.eql("HR");

                    expect(data.result[3]._id).to.eql("Sales");
                    expect(data.result[3].count).to.eql(3);
                    expect(data.result[3].estefforts).to.eql(14);
                    expect(data.result[3].businessfunctionid._id).to.eql("Sales");
                    expect(data.result[3].businessfunctionid.businessfunction).to.eql("Sales");
                    done();
                });
            })

            /**
             * Execute plan
             * group module will not work here --> it will run when $field or array is in _id of group
             */
            var group1 = {_id:"$businessfunctionid", count:{$sum:1}, estefforts:{$sum:"$estefforts"},
                businessfunctinid:{$first:"$businessfunctionid"}
            }
            group1[Constants.Query.SORT] = {businessfunctionid:1};

            var query1 = TEST_UTILITY.populateQuery(NorthwindDb.TASK_TABLE, undefined, undefined, {task:1}, group1);


            /*
             * Query engine --> $group, $unwind --> pipeline
             * */
            var mongoPipelines =
                [
                    {"$group":{"_id":"$businessfunctionid._id",
                        "count":{"$sum":1},
                        "estefforts":{"$sum":"$estefforts"},
                        "businessfunctionid":{"$first":"$businessfunctionid"}}
                    },
                    {"$sort":{"businessfunctionid":1}}
                ]

            var expectedResult = {result:[
                {_id:"Accounts", businessfunctionid:{_id:"Accounts", delivery:"Accounts"}, count:2, estefforts:19},
                {_id:"Delivery", businessfunctionid:{_id:"Delivery", delivery:"Delivery"}, count:5, estefforts:22} ,
                {_id:"HR", businessfunctionid:{_id:"HR", delivery:"HR"}, count:2, estefforts:23},
                {_id:"Sales", businessfunctionid:{_id:"Sales", delivery:"Sales"}, count:3, estefforts:14}
            ]}
        });

        it("group by on fk column aggregates and add _id if fk column", function (done) {
            ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
                if (err) {
                    done(err);
                    return;
                }
                var group = {
                    _id:"$businessfunctionid",
                    count:{$sum:1},
                    estefforts:{$sum:"$estefforts"},
                    businessfunctionid:{$first:"$businessfunctionid"}
                }
                group[Constants.Query.SORT] = {businessfunctionid:1};
                var query = {$collection:{collection:"tasks", fields:[
                    {field:"businessfunctionid", type:"fk", collection:"businessfunctions", set:["businessfunction"]}
                ]}, $sort:{task:1}, $group:group};
                db.query(query, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    expect(data.result).to.have.length(4);
//
                    expect(data.result[0]._id).to.eql("Accounts");
                    expect(data.result[0].count).to.eql(2);
                    expect(data.result[0].estefforts).to.eql(19);
                    expect(data.result[0].businessfunctionid._id).to.eql("Accounts");
                    expect(data.result[0].businessfunctionid.businessfunction).to.eql("Accounts");

                    expect(data.result[1]._id).to.eql("Delivery");
                    expect(data.result[1].count).to.eql(5);
                    expect(data.result[1].estefforts).to.eql(22);
                    expect(data.result[1].businessfunctionid._id).to.eql("Delivery");
                    expect(data.result[1].businessfunctionid.businessfunction).to.eql("Delivery");

                    expect(data.result[2]._id).to.eql("HR");
                    expect(data.result[2].count).to.eql(2);
                    expect(data.result[2].estefforts).to.eql(23);
                    expect(data.result[2].businessfunctionid._id).to.eql("HR");
                    expect(data.result[2].businessfunctionid.businessfunction).to.eql("HR");

                    expect(data.result[3]._id).to.eql("Sales");
                    expect(data.result[3].count).to.eql(3);
                    expect(data.result[3].estefforts).to.eql(14);
                    expect(data.result[3].businessfunctionid._id).to.eql("Sales");
                    expect(data.result[3].businessfunctionid.businessfunction).to.eql("Sales");
                    done();
                });
            })

            /**
             * Execute plan
             * group module will not work here --> it will run when $field or array is in _id of group
             */
            var group1 = {_id:"$businessfunctionid", count:{$sum:1}, estefforts:{$sum:"$estefforts"},
                businessfunctinid:{$first:"$businessfunctionid"}
            }
            group1[Constants.Query.SORT] = {businessfunctionid:1};

            var query1 = TEST_UTILITY.populateQuery(NorthwindDb.TASK_TABLE, undefined, undefined, {task:1}, group1);


            /*
             * Query engine --> $group, $unwind --> pipeline
             * */
            var mongoPipelines =
                [
                    {"$group":{"_id":"$businessfunctionid._id",
                        "count":{"$sum":1},
                        "estefforts":{"$sum":"$estefforts"},
                        "businessfunctionid":{"$first":"$businessfunctionid"}}
                    },
                    {"$sort":{"businessfunctionid":1}}
                ]

            var expectedResult = {result:[
                {_id:"Accounts", businessfunctionid:{_id:"Accounts", delivery:"Accounts"}, count:2, estefforts:19},
                {_id:"Delivery", businessfunctionid:{_id:"Delivery", delivery:"Delivery"}, count:5, estefforts:22} ,
                {_id:"HR", businessfunctionid:{_id:"HR", delivery:"HR"}, count:2, estefforts:23},
                {_id:"Sales", businessfunctionid:{_id:"Sales", delivery:"Sales"}, count:3, estefforts:14}
            ]}
        });

        it("group by on fk column without save _id and filter on _id default aggregates and add _id if fk column", function (done) {
            ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
                if (err) {
                    done(err);
                    return;
                }
                ApplaneDB.addCollection(collectionsToRegister, function (err) {
                    if (err) {
                        done(err);
                        return;
                    }
                    db.batchUpdateById([
                        {$collection:NorthwindDb.TASK_WITHOUT_ID_TABLE, $insert:NorthwindDb.TasksWithout_Id}
                    ], function (err) {
                        if (err) {
                            console.log("Err in insert");
                            done(err);
                            return;
                        }
                        console.log("Data Inserted");
                        db.query({$collection:NorthwindDb.BUSINESS_FUNCTIONS_WITHOUT_ID_TABLE, $fields:{_id:1}}, function (err, res) {
                            if (err) {
                                done(err);
                                return;
                            }
                            var bfs = [];
                            for (var i = 0; i < res.result.length; i++) {
                                bfs.push(res.result[i]._id.toString());
                            }
                            console.log("bfs>>>>>>>>>>>" + JSON.stringify(bfs));
                            var group = {
                                _id:"$businessfunctionid",
                                count:{$sum:1},
                                estefforts:{$sum:"$estefforts"},
                                businessfunctionid:{$first:"$businessfunctionid"}
                            }
                            group[Constants.Query.SORT] = {businessfunctionid:1};
                            group.$filter = {"businessfunctionid._id":{$in:bfs}};
                            var query = {$collection:NorthwindDb.TASK_WITHOUT_ID_TABLE, $sort:{task:1}, $group:group};
                            db.query(query, function (err1, data) {
                                NorthwindDb.removeData(db, NorthwindDb.TASK_WITHOUT_ID_TABLE, {}, function (err) {
                                    if (err) {
                                        done(err);
                                        return;
                                    }
                                    console.log("Data Removed");
                                    NorthwindDb.removeData(db, NorthwindDb.BUSINESS_FUNCTIONS_WITHOUT_ID_TABLE, {}, function (err) {
                                        if (err) {
                                            done(err);
                                            return;
                                        }
                                        console.log("Data Removed");
                                        if (err1) {
                                            done(err1);
                                            return;
                                        }
                                        console.log("data >>>>>>>>>>>" + JSON.stringify(data));
                                        expect(data.result).to.have.length(3);

                                        expect(data.result[0].count).to.eql(1);
                                        expect(data.result[0].estefforts).to.eql(4);
                                        expect(data.result[0].businessfunctionid.businessfunction).to.eql("Account");

                                        expect(data.result[1].count).to.eql(2);
                                        expect(data.result[1].estefforts).to.eql(4);
                                        expect(data.result[1].businessfunctionid.businessfunction).to.eql("Delivery");

                                        expect(data.result[2].count).to.eql(1);
                                        expect(data.result[2].estefforts).to.eql(2);
                                        expect(data.result[2].businessfunctionid.businessfunction).to.eql("Sales");


                                        var expRes = {"result":[
                                            {"_id":"536b545963b8387811000029", "count":1, "estefforts":4, "businessfunctionid":{"businessfunction":"Account", "_id":"536b545963b8387811000029"}},
                                            {"_id":"536b545963b8387811000017", "count":2, "estefforts":4, "business functionid":{"businessfunction":"Delivery", "_id":"536b545963b8387811000017"}},
                                            {"_id":"536b545963b838781100001e", "count":1, "estefforts":2, "businessfunctionid":{"businessfunction":"Sales", "_id":"536b545963b838781100001e"}}
                                        ]};

                                        done();
                                    })
                                })
                            });
                        })
                    })
                })
            })

            /**
             * Execute plan
             * group module will not work here --> it will run when $field or array is in _id of group
             */
            var group1 = {_id:"$businessfunctionid", count:{$sum:1}, estefforts:{$sum:"$estefforts"},
                businessfunctinid:{$first:"$businessfunctionid"}
            }
            group1[Constants.Query.SORT] = {businessfunctionid:1};

            var query1 = TEST_UTILITY.populateQuery(NorthwindDb.TASK_TABLE, undefined, undefined, {task:1}, group1);


            /*
             * Query engine --> $group, $unwind --> pipeline
             * */
            var mongoPipelines =
                [
                    {"$group":{"_id":"$businessfunctionid._id",
                        "count":{"$sum":1},
                        "estefforts":{"$sum":"$estefforts"},
                        "businessfunctionid":{"$first":"$businessfunctionid"}}
                    },
                    {"$sort":{"businessfunctionid":1}}
                ]

            var expectedResult = {result:[
                {_id:"Accounts", businessfunctionid:{_id:"Accounts", delivery:"Accounts"}, count:2, estefforts:19},
                {_id:"Delivery", businessfunctionid:{_id:"Delivery", delivery:"Delivery"}, count:5, estefforts:22} ,
                {_id:"HR", businessfunctionid:{_id:"HR", delivery:"HR"}, count:2, estefforts:23},
                {_id:"Sales", businessfunctionid:{_id:"Sales", delivery:"Sales"}, count:3, estefforts:14}
            ]}
        });

        it("group by on fk column in json aggregates and add _id if fk column", function (done) {
            ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
                if (err) {
                    done(err);
                    return;
                }
                var group = {
                    _id:{businessfunctionid:"$businessfunctionid"},
                    count:{$sum:1},
                    estefforts:{$sum:"$estefforts"},
                    businessfunctionid:{$first:"$businessfunctionid"}
                }
                group[Constants.Query.SORT] = {businessfunctionid:1};
                var query = {$collection:{collection:"tasks", fields:[
                    {field:"businessfunctionid", type:"fk", collection:"businessfunctions", set:["businessfunction"]}
                ]}, $sort:{task:1}, $group:group};
                db.query(query, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log("result >>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(data.result));
                    expect(data.result).to.have.length(4);
//
                    expect(data.result[0]._id.businessfunctionid).to.eql("Accounts");
                    expect(data.result[0].count).to.eql(2);
                    expect(data.result[0].estefforts).to.eql(19);
                    expect(data.result[0].businessfunctionid._id).to.eql("Accounts");
                    expect(data.result[0].businessfunctionid.businessfunction).to.eql("Accounts");

                    expect(data.result[1]._id.businessfunctionid).to.eql("Delivery");
                    expect(data.result[1].count).to.eql(5);
                    expect(data.result[1].estefforts).to.eql(22);
                    expect(data.result[1].businessfunctionid._id).to.eql("Delivery");
                    expect(data.result[1].businessfunctionid.businessfunction).to.eql("Delivery");

                    expect(data.result[2]._id.businessfunctionid).to.eql("HR");
                    expect(data.result[2].count).to.eql(2);
                    expect(data.result[2].estefforts).to.eql(23);
                    expect(data.result[2].businessfunctionid._id).to.eql("HR");
                    expect(data.result[2].businessfunctionid.businessfunction).to.eql("HR");

                    expect(data.result[3]._id.businessfunctionid).to.eql("Sales");
                    expect(data.result[3].count).to.eql(3);
                    expect(data.result[3].estefforts).to.eql(14);
                    expect(data.result[3].businessfunctionid._id).to.eql("Sales");
                    expect(data.result[3].businessfunctionid.businessfunction).to.eql("Sales");
                    done();
                });
            })

            /**
             * Execute plan
             * group module will not work here --> it will run when $field or array is in _id of group
             */
            var group1 = {_id:"$businessfunctionid", count:{$sum:1}, estefforts:{$sum:"$estefforts"},
                businessfunctinid:{$first:"$businessfunctionid"}
            }
            group1[Constants.Query.SORT] = {businessfunctionid:1};

            var query1 = TEST_UTILITY.populateQuery(NorthwindDb.TASK_TABLE, undefined, undefined, {task:1}, group1);


            /*
             * Query engine --> $group, $unwind --> pipeline
             * */
            var mongoPipelines =
                [
                    {"$group":{"_id":"$businessfunctionid._id",
                        "count":{"$sum":1},
                        "estefforts":{"$sum":"$estefforts"},
                        "businessfunctionid":{"$first":"$businessfunctionid"}}
                    },
                    {"$sort":{"businessfunctionid":1}}
                ]

            var expectedResult = {result:[
                {_id:"Accounts", businessfunctionid:{_id:"Accounts", delivery:"Accounts"}, count:2, estefforts:19},
                {_id:"Delivery", businessfunctionid:{_id:"Delivery", delivery:"Delivery"}, count:5, estefforts:22} ,
                {_id:"HR", businessfunctionid:{_id:"HR", delivery:"HR"}, count:2, estefforts:23},
                {_id:"Sales", businessfunctionid:{_id:"Sales", delivery:"Sales"}, count:3, estefforts:14}
            ]}
        });

        // tasks and group by on businessfunction and data

        it("group by on fk columns aggregates and data", function (done) {

            ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
                if (err) {
                    done(err);
                    return;
                }

                var group = {
                    _id:"$businessfunctionid._id",
                    count:{$sum:1},
                    estefforts:{$sum:"$estefforts"},
                    businessfunctionid:{$first:"$businessfunctionid"}
                };
                group[Constants.Query.SORT] = {businessfunctionid:1};

                var query = TEST_UTILITY.populateQuery(NorthwindDb.TASK_TABLE, {task:1, estefforts:1, status:1}, undefined, {task:1}, group);

                db.query(query, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    expect(data.result).to.have.length(4);
                    expect(data.result[0]._id).to.eql("Accounts");
                    expect(data.result[0].count).to.eql(2);
                    expect(data.result[0].estefforts).to.eql(19);
                    expect(data.result[0].businessfunctionid._id).to.eql("Accounts");
                    expect(data.result[0].businessfunctionid.businessfunction).to.eql("Accounts");
                    expect(data.result[0].children).to.have.length(2);
                    expect(data.result[0].children[0]._id).to.eql("task09");
                    expect(data.result[0].children[0].task).to.eql("task09");
                    expect(data.result[0].children[0].estefforts).to.eql(9);
                    expect(data.result[0].children[0].status).to.eql("Completed");

                    expect(data.result[1]._id).to.eql("Delivery");
                    expect(data.result[1].count).to.eql(5);
                    expect(data.result[1].estefforts).to.eql(22);
                    expect(data.result[1].businessfunctionid._id).to.eql("Delivery");
                    expect(data.result[1].businessfunctionid.businessfunction).to.eql("Delivery");
                    expect(data.result[1].children).to.have.length(5);

                    expect(data.result[2]._id).to.eql("HR");
                    expect(data.result[2].count).to.eql(2);
                    expect(data.result[2].estefforts).to.eql(23);
                    expect(data.result[2].businessfunctionid._id).to.eql("HR");
                    expect(data.result[2].businessfunctionid.businessfunction).to.eql("HR");
                    expect(data.result[2].children).to.have.length(2);

                    expect(data.result[3]._id).to.eql("Sales");
                    expect(data.result[3].count).to.eql(3);
                    expect(data.result[3].estefforts).to.eql(14);
                    expect(data.result[3].businessfunctionid._id).to.eql("Sales");
                    expect(data.result[3].businessfunctionid.businessfunction).to.eql("Sales");
                    expect(data.result[3].children).to.have.length(3);
                    done();
                })
            })

            // groupby module , it will remove fields, add it as childern, and also populate businessfunctionid as $first
            //TODO how will  other module get fields

            var mongoPipelines =
                [
                    {$group:{
                        _id:"businessfunctionid._id",
                        count:{$sum:1},
                        estefforts:{$sum:"$estefforts"},
                        businessfunctionid:{$first:"$businessfunctionid"},
                        children:{$push:{_id:"$_id", task:"$task", status:"$status", estefforts:"$estefforts"}}}
                    },
                    { $sort:{businessfunctionid:1}}

                ]

            var expectedResult = {"result":[
                {"_id":"Accounts", "count":2, "estefforts":19, "businessfunctionid":{"_id":"Accounts", "businessfunction":"Accounts"}, "children":[
                    {"_id":"task09", "task":"task09", "estefforts":9, "status":"Completed"},
                    {"_id":"task10", "task":"task10", "estefforts":10, "status":"Completed"}
                ]},
                {"_id":"Delivery", "count":5, "estefforts":22, "businessfunctionid":{"_id":"Delivery", "businessfunction":"Delivery"}, "children":[
                    {"_id":"task01", "task":"task01", "estefforts":1, "status":"New"},
                    {"_id":"task03", "task":"task03", "estefforts":3, "status":"InProgress"},
                    {"_id":"task05", "task":"task05", "estefforts":5,
                        "status":"New"},
                    {"_id":"task06", "task":"task06", "estefforts":6, "status":"InProgress"},
                    {"_id":"task07", "task":"task07", "estefforts":7, "status":"New"}
                ]},
                {"_id":"HR", "count":2, "estefforts":23, "businessfunctionid":{"_id":"HR", "businessfunction":"HR"}, "children":[
                    {"_id":"task11", "task":"task11", "estefforts":11, "status":"Completed"},
                    {"_id":"task12", "task":"task12", "estefforts":12, "status":"Completed"}
                ]},
                {"_id":"Sales", "count":3, "estefforts":14, "businessfunctionid":{"_id":"Sales", "businessfunction":"Sales"}, "children":[
                    {"_id":"task02", "task":"task02", "estefforts":2, "status":"New"},
                    {"_id":"task04", "task":"task04", "estefforts":4, "status":"InProgress"},
                    {"_id":"task08", "task":"task08", "estefforts":8, "status":"New"}
                ]}
            ]}

        })


        //  in tasks --> group by on businessfunction having sum(estefforts) < 20 and sort on sum(esteffort) : asc --> get count and estefforts sum
        it("group by on fk column with having and sort and aggregates", function (done) {

            ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
                if (err) {
                    done(err);
                    return;
                }

                var group = {
                    _id:"$businessfunctionid._id",
                    count:{$sum:1},
                    estefforts:{$sum:"$estefforts"},
                    businessfunctionid:{$first:"$businessfunctionid"}
                };
                group[Constants.Query.SORT] = {estefforts:1};
                group[Constants.Query.FILTER] = {estefforts:{$lt:20}};

                var query = TEST_UTILITY.populateQuery(NorthwindDb.TASK_TABLE, undefined, undefined, {task:1}, group);

                db.query(query, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    expect(data.result).to.have.length(2);
                    expect(data.result[0]._id).to.eql("Sales");
                    expect(data.result[0].count).to.eql(3);
                    expect(data.result[0].estefforts).to.eql(14);
                    expect(data.result[0].businessfunctionid._id).to.eql("Sales");
                    expect(data.result[0].businessfunctionid.businessfunction).to.eql("Sales");

                    expect(data.result[1]._id).to.eql("Accounts");
                    expect(data.result[1].count).to.eql(2);
                    expect(data.result[1].estefforts).to.eql(19);
                    expect(data.result[1].businessfunctionid._id).to.eql("Accounts");
                    expect(data.result[1].businessfunctionid.businessfunction).to.eql("Accounts");
//
                    done();
                })
            })

            //$fitler and $sort will be handle by QueryEngine, and other execute plan is same as above
            var mongoPipelines =
                [
                    {$group:{
                        _id:"businessfunctionid._id",
                        count:{$sum:1},
                        estefforts:{$sum:"$estefforts"},
                        businessfunctionid:{$first:"$businessfunctionid"}}
                    },
                    { $match:{estefforts:{$lt:20}}},
                    { $sort:{estefforts:1}}

                ]

            var expectedResult = {"result":[
                {"_id":"Sales", "count":3, "estefforts":14, "businessfunctionid":{"_id":"Sales", "businessfunction":"Sales"}},
                {"_id":"Accounts", "count":2, "estefforts":19, "businessfunctionid":{"_id":"Accounts", "businessfunction":"Accounts"}}
            ]}

        })

//  in tasks --> group by on businessfunction having sum(estefforts) < 20 and sort on sum(esteffort) : asc --> get count and estefforts sum and tasks
//TODO children OR result

        it("group by on fk column with having and sort and aggregates and data ", function (done) {

            ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
                if (err) {
                    done(err);
                    return;
                }

                var group = {
                    _id:"$businessfunctionid._id",
                    count:{$sum:1},
                    estefforts:{$sum:"$estefforts"},
                    businessfunctionid:{$first:"$businessfunctionid"}
                };
                group[Constants.Query.SORT] = {estefforts:1};
                group[Constants.Query.FILTER] = {estefforts:{$lt:20}};

                var query = TEST_UTILITY.populateQuery(NorthwindDb.TASK_TABLE, {task:1, estefforts:1, status:1}, undefined, {task:1}, group);

                db.query(query, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    expect(data.result).to.have.length(2);

                    expect(data.result[0]._id).to.eql("Sales");
                    expect(data.result[0].count).to.eql(3);
                    expect(data.result[0].estefforts).to.eql(14);
                    expect(data.result[0].businessfunctionid._id).to.eql("Sales");
                    expect(data.result[0].businessfunctionid.businessfunction).to.eql("Sales");
                    expect(data.result[0].children).to.have.length(3);
                    expect(data.result[0].children[0]._id).to.eql("task02");
                    expect(data.result[0].children[0].task).to.eql("task02");
                    expect(data.result[0].children[0].estefforts).to.eql(2);
                    expect(data.result[0].children[0].status).to.eql("New");

                    expect(data.result[1]._id).to.eql("Accounts");
                    expect(data.result[1].count).to.eql(2);
                    expect(data.result[1].estefforts).to.eql(19);
                    expect(data.result[1].businessfunctionid._id).to.eql("Accounts");
                    expect(data.result[1].businessfunctionid.businessfunction).to.eql("Accounts");
                    expect(data.result[1].children).to.have.length(2);
                    expect(data.result[1].children[0]._id).to.eql("task09");
                    expect(data.result[1].children[0].task).to.eql("task09");
                    expect(data.result[1].children[0].estefforts).to.eql(9);
                    expect(data.result[1].children[0].status).to.eql("Completed");
                    done();
                })
            })


            var mongoPipeLine = [
                {$group:{
                    _id:"businessfunctionid._id",
                    count:{$sum:1},
                    estefforts:{$sum:"$estefforts"},
                    businessfunctionid:{$first:"$businessfunctionid._id"},
                    children:{$push:{task:"$task", status:"$status", estefforts:"$estefforts"}}}
                },
                { $match:{estefforts:{$lt:20}}},
                { $sort:{estefforts:1}}
            ];

            var expectedResult = {"result":[
                {"_id":"Sales", "count":3, "estefforts":14, "businessfunctionid":{"_id":"Sales", "businessfunction":"Sales"}, "children":[
                    {"_id":"task02", "task":"task02", "estefforts":2, "status":"New"},
                    {"_id":"task04", "task":"task04", "estefforts":4, "status":"InProgress"},
                    {"_id":"task08", "task":"task08", "estefforts":8, "status":"New"}
                ]},
                {"_id":"Accounts", "count":2, "estefforts":19, "businessfunctionid":{"_id":"Accounts", "businessfunction":"Accounts"}, "children":[
                    {"_id":"task09", "task":"task09", "estefforts":9, "status":"Completed"},
                    {"_id":"task10", "task":"task10", "estefforts":10, "status":"Completed"}
                ]}

            ]}
        })

        it("group by on fk column in nested data", function (done) {

            ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
                if (err) {
                    done(err);
                    return;
                }

                var group = {"_id":"$vlis.accountgroupid._id",
                    "amount":{"$sum":"$vlis.amount"},
                    "vlis_accountgroupid__id":{"$first":"$vlis.accountgroupid._id"}
                };

                var query = TEST_UTILITY.populateQuery(NorthwindDb.VOUCHERS_TABLE, undefined, undefined, undefined, group, ["vlis"]);

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

                var expectedResult = {"result":[
                    {"_id":"Asset", "amount":-100, "vlis_accountgroupid__id":"Asset"},
                    {"_id":"Expense", "amount":600, "vlis_accountgroupid__id":"Expense"},
                    {"_id":"Income", "amount":-500, "vlis_accountgroupid__id":"Income"}
                ]};
            })
        })

//  in tasks --> group by on businessfunction having sum(estefforts) < 20 and sort on sum(esteffort) : asc --> group by on status (first group by on businessfunction and then group by on status)

//TODO do we need to apply having on inner group

        it("group by on column more than one with having and sort and aggregates and data and array ", function (done) {

            ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
                if (err) {
                    done(err);
                    return;
                }


                var group = {
                    _id:[
                        {businessfunctionid:"$businessfunctionid._id"},
                        { status:"$status"}
                    ],
                    count:{$sum:1},
                    estefforts:{$sum:"$estefforts"},
                    businessfunctionid:{$first:"$businessfunctionid"},
                    status:{$first:"$status"}
                };
                group[Constants.Query.SORT] = {businessfunctionid:1, status:1};
                group[Constants.Query.FILTER] = {estefforts:{$lt:20}};

                var query = TEST_UTILITY.populateQuery(NorthwindDb.TASK_TABLE, {task:1, estefforts:1, status:1}, undefined, {task:1}, group);

                db.query(query, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    expect(data.result).to.have.length(2);
                    expect(data.result[0]._id).to.eql("Accounts");
                    expect(data.result[0].count).to.eql(2);
                    expect(data.result[0].estefforts).to.eql(19);
                    expect(data.result[0].businessfunctionid._id).to.eql("Accounts");
                    expect(data.result[0].businessfunctionid.businessfunction).to.eql("Accounts");
                    expect(data.result[0].children).to.have.length(1);
                    expect(data.result[0].children[0]._id).to.eql("Completed");
                    expect(data.result[0].children[0].status).to.eql("Completed");
                    expect(data.result[0].children[0].children).to.have.length(2);
                    expect(data.result[0].children[0].children[0]._id).to.eql("task09");
                    expect(data.result[0].children[0].children[0].task).to.eql("task09");
                    expect(data.result[0].children[0].children[0].estefforts).to.eql(9);
                    expect(data.result[0].children[0].children[0].status).to.eql("Completed");

                    expect(data.result[1]._id).to.eql("Sales");
                    expect(data.result[1].count).to.eql(3);
                    expect(data.result[1].estefforts).to.eql(14);
                    expect(data.result[1].businessfunctionid._id).to.eql("Sales");
                    expect(data.result[1].businessfunctionid.businessfunction).to.eql("Sales");
                    expect(data.result[1].children[0]._id).to.eql("InProgress");
                    expect(data.result[1].children[0].status).to.eql("InProgress");
                    expect(data.result[1].children[0].children).to.have.length(1);
                    expect(data.result[1].children[0].children[0]._id).to.eql("task04");
                    expect(data.result[1].children[0].children[0].task).to.eql("task04");
                    expect(data.result[1].children[0].children[0].estefforts).to.eql(4);
                    expect(data.result[1].children[0].children[0].status).to.eql("InProgress");
                    expect(data.result[1].children[1]._id).to.eql("New");
                    expect(data.result[1].children[1].status).to.eql("New");
                    expect(data.result[1].children[1].children).to.have.length(2);
                    expect(data.result[1].children[1].children[0]._id).to.eql("task02");
                    expect(data.result[1].children[1].children[0].task).to.eql("task02");
                    expect(data.result[1].children[1].children[0].estefforts).to.eql(2);
                    expect(data.result[1].children[1].children[0].status).to.eql("New");
                    done();
                })
            })

            // /step

            var query1 = {
                $collection:"tasks",
                $group:[
                    {
                        _id:{businessfunctionid:"$businessfunctionid._id", status:"$status"},
                        count:{$sum:1},
                        estefforts:{$sum:"$estefforts"},
                        businessfunctionid:{$first:"$businessfunctionid"},
                        status:{$first:"$status"},
                        children:{$push:{task:"$task", status:"$status", estefforts:"$estefforts"}},
                        $filter:{estefforts:{$lt:20}},
                        $sort:{businessfunctionid:1, status:1}
                    },
                    {
                        _id:"$_id.businessfunctionid",
                        count:{$sum:"$count"},
                        estefforts:{$sum:"$estefforts"},
                        businessfunctionid:{$first:"$businessfunctionid"},
                        children:{$push:{_id:"_id.status", status:"$status", count:"$count", estefforts:"$estefforts", children:"$children"}},
                        $filter:{estefforts:{$lt:20}},
                        $sort:{businessfunctionid:1, status:1}
                    }
                ]};

            var mongoPipeLine = [
                {"$group":{
                    "_id":{"businessfunctionid":"$businessfunctionid._id", "status":"$status"},
                    "count":{"$sum":1},
                    "estefforts":{"$sum":"$estefforts"},
                    "businessfunctionid":{"$first":"$businessfunctionid"},
                    "status":{"$first":"$status"},
                    "children":{"$push":{"_id":"$_id", "task":"$task", "estefforts":"$estefforts", "stat us":"$status"}}
                }},
                {"$match":{"estefforts":{"$lt":20}}},
                {"$sort":{"businessfunctionid":1}},
                {"$group":{
                    "_id":"$_id.businessfunctionid",
                    "count":{"$sum":"$count"},
                    "estefforts":{"$sum":"$estefforts"},
                    "businessfunctionid":{"$first":"$businessfunctionid"},
                    "children":{"$push":{"_id":"$_id.status", "status":" $status", "children":"$children", "count":"$count", "estefforts":"$estefforts"}}
                }},
                {"$match":{"estefforts":{"$lt":20}}},
                {"$sort":{"businessfunctionid":1, status:1}}
            ]
            var expectedResult = {"result":[
                {"_id":"Accounts", "count":2, "estefforts":19, "businessfunctionid":{"_id":"Accounts", "businessfunction":"Accounts"}, "children":[
                    {"_id":"Completed", "status":"Completed", "children":[
                        {"_id":"task09", "task":"task09", "estefforts":9, "status":"Completed"},
                        {"_id":"task10", "tas k":"task10", "estefforts":10, "status":"Completed"}
                    ], "count":2, "estefforts":19}
                ]},
                {"_id":"Sales", "count":3, "estefforts":14, "businessfunctionid":{"_id":"Sales", "businessfunction":"Sales"}, "children":[
                    {"_id":"InProgress", "status":"InProgress", "children":[
                        {"_id":"task04", "task":"task04", "estefforts":4, "s tatus":"InProgress"}
                    ], "count":1, "estefforts":4},
                    {"_id":"New", "status":"New", "children":[
                        {"_id":"task02", "task":"task02", "estefforts":2, "status":"New"},
                        {"_id":"task08", "task":"task08", "estefforts":8, "status":"New"}
                    ], "count":2, "estefforts":10}
                ]}
            ]}

        })

        it("group by on column more than one with having and sort and aggregates and data and array", function (done) {

            ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
                if (err) {
                    done(err);
                    return;
                }


                var group = {
                    _id:[
                        {businessfunctionid:"$businessfunctionid._id"},
                        { status:"$status"}
                    ],
                    count:{$sum:1},
                    estefforts:{$sum:"$estefforts"},
                    businessfunctionid:{$first:"$businessfunctionid"},
                    status:{$first:"$status"}
                };
                group[Constants.Query.SORT] = {businessfunctionid:1, status:1};
                group[Constants.Query.FILTER] = {estefforts:{$lt:20}};

                var query = TEST_UTILITY.populateQuery(NorthwindDb.TASK_TABLE, {task:1, estefforts:1, status:1}, undefined, {task:1}, group);

                db.query(query, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    expect(data.result).to.have.length(2);
                    expect(data.result[0]._id).to.eql("Accounts");
                    expect(data.result[0].count).to.eql(2);
                    expect(data.result[0].estefforts).to.eql(19);
                    expect(data.result[0].businessfunctionid._id).to.eql("Accounts");
                    expect(data.result[0].businessfunctionid.businessfunction).to.eql("Accounts");
                    expect(data.result[0].children).to.have.length(1);
                    expect(data.result[0].children[0]._id).to.eql("Completed");
                    expect(data.result[0].children[0].status).to.eql("Completed");
                    expect(data.result[0].children[0].children).to.have.length(2);
                    expect(data.result[0].children[0].children[0]._id).to.eql("task09");
                    expect(data.result[0].children[0].children[0].task).to.eql("task09");
                    expect(data.result[0].children[0].children[0].estefforts).to.eql(9);
                    expect(data.result[0].children[0].children[0].status).to.eql("Completed");

                    expect(data.result[1]._id).to.eql("Sales");
                    expect(data.result[1].count).to.eql(3);
                    expect(data.result[1].estefforts).to.eql(14);
                    expect(data.result[1].businessfunctionid._id).to.eql("Sales");
                    expect(data.result[1].businessfunctionid.businessfunction).to.eql("Sales");
                    expect(data.result[1].children[0]._id).to.eql("InProgress");
                    expect(data.result[1].children[0].status).to.eql("InProgress");
                    expect(data.result[1].children[0].children).to.have.length(1);
                    expect(data.result[1].children[0].children[0]._id).to.eql("task04");
                    expect(data.result[1].children[0].children[0].task).to.eql("task04");
                    expect(data.result[1].children[0].children[0].estefforts).to.eql(4);
                    expect(data.result[1].children[0].children[0].status).to.eql("InProgress");
                    expect(data.result[1].children[1]._id).to.eql("New");
                    expect(data.result[1].children[1].status).to.eql("New");
                    expect(data.result[1].children[1].children).to.have.length(2);
                    expect(data.result[1].children[1].children[0]._id).to.eql("task02");
                    expect(data.result[1].children[1].children[0].task).to.eql("task02");
                    expect(data.result[1].children[1].children[0].estefforts).to.eql(2);
                    expect(data.result[1].children[1].children[0].status).to.eql("New");
                    done();
                })
            })

            // /step

            var query1 = {
                $collection:"tasks",
                $group:[
                    {
                        _id:{businessfunctionid:"$businessfunctionid._id", status:"$status"},
                        count:{$sum:1},
                        estefforts:{$sum:"$estefforts"},
                        businessfunctionid:{$first:"$businessfunctionid"},
                        status:{$first:"$status"},
                        children:{$push:{task:"$task", status:"$status", estefforts:"$estefforts"}},
                        $filter:{estefforts:{$lt:20}},
                        $sort:{businessfunctionid:1, status:1}
                    },
                    {
                        _id:"$_id.businessfunctionid",
                        count:{$sum:"$count"},
                        estefforts:{$sum:"$estefforts"},
                        businessfunctionid:{$first:"$businessfunctionid"},
                        children:{$push:{_id:"_id.status", status:"$status", count:"$count", estefforts:"$estefforts", children:"$children"}},
                        $filter:{estefforts:{$lt:20}},
                        $sort:{businessfunctionid:1, status:1}
                    }
                ]};

            var mongoPipeLine = [
                {"$group":{
                    "_id":{"businessfunctionid":"$businessfunctionid._id", "status":"$status"},
                    "count":{"$sum":1},
                    "estefforts":{"$sum":"$estefforts"},
                    "businessfunctionid":{"$first":"$businessfunctionid"},
                    "status":{"$first":"$status"},
                    "children":{"$push":{"_id":"$_id", "task":"$task", "estefforts":"$estefforts", "stat us":"$status"}}
                }},
                {"$match":{"estefforts":{"$lt":20}}},
                {"$sort":{"businessfunctionid":1}},
                {"$group":{
                    "_id":"$_id.businessfunctionid",
                    "count":{"$sum":"$count"},
                    "estefforts":{"$sum":"$estefforts"},
                    "businessfunctionid":{"$first":"$businessfunctionid"},
                    "children":{"$push":{"_id":"$_id.status", "status":" $status", "children":"$children", "count":"$count", "estefforts":"$estefforts"}}
                }},
                {"$match":{"estefforts":{"$lt":20}}},
                {"$sort":{"businessfunctionid":1, status:1}}
            ]
            var expectedResult = {"result":[
                {"_id":"Accounts", "count":2, "estefforts":19, "businessfunctionid":{"_id":"Accounts", "businessfunction":"Accounts"}, "children":[
                    {"_id":"Completed", "status":"Completed", "children":[
                        {"_id":"task09", "task":"task09", "estefforts":9, "status":"Completed"},
                        {"_id":"task10", "tas k":"task10", "estefforts":10, "status":"Completed"}
                    ], "count":2, "estefforts":19}
                ]},
                {"_id":"Sales", "count":3, "estefforts":14, "businessfunctionid":{"_id":"Sales", "businessfunction":"Sales"}, "children":[
                    {"_id":"InProgress", "status":"InProgress", "children":[
                        {"_id":"task04", "task":"task04", "estefforts":4, "s tatus":"InProgress"}
                    ], "count":1, "estefforts":4},
                    {"_id":"New", "status":"New", "children":[
                        {"_id":"task02", "task":"task02", "estefforts":2, "status":"New"},
                        {"_id":"task08", "task":"task08", "estefforts":8, "status":"New"}
                    ], "count":2, "estefforts":10}
                ]}
            ]}

        })

        it("group by on n Fk column more than one with having and sort and aggregates and data and array with min max", function (done) {

            ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
                if (err) {
                    done(err);
                    return;
                }

                var group = {
                    _id:[
                        {businessfunctionid:"$businessfunctionid._id"},
                        { status:"$status"} ,
                        { priorityid:"$priorityid._id"}
                    ],
                    count:{$sum:1},
                    estefforts:{$sum:"$estefforts"},
                    estefforts_min:{$min:"$estefforts"},
                    estefforts_max:{$max:"$estefforts"},
                    businessfunctionid:{$first:"$businessfunctionid"},
                    status:{$first:"$status"},
                    priorityid:{$first:"$priorityid"}
                };
                group[Constants.Query.SORT] = {businessfunctionid:1, status:1};
                group[Constants.Query.FILTER] = {estefforts:{$lt:20}};

                var query = {$collection:NorthwindDb.TASK_TABLE, $fields:{task:1, estefforts:1, status:1}, $sort:{task:1}, $group:group};

                db.query(query, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log(">>>>>>>>>>>>>>>>>>>data>>>>>>>>>>>>" + JSON.stringify(data));
                    expect(data.result).to.have.length(2);
                    expect(data.result[0]._id).to.eql("Accounts");
                    expect(data.result[0].count).to.eql(2);
                    expect(data.result[0].estefforts).to.eql(19);
                    expect(data.result[0].estefforts_min).to.eql(9);
                    expect(data.result[0].estefforts_max).to.eql(10);
                    expect(data.result[0].businessfunctionid._id).to.eql("Accounts");
                    expect(data.result[0].businessfunctionid.businessfunction).to.eql("Accounts");
                    expect(data.result[0].children).to.have.length(1);
                    expect(data.result[0].children[0]._id).to.eql("Completed");
                    expect(data.result[0].children[0].status).to.eql("Completed");
                    expect(data.result[0].children[0].children).to.have.length(1);
                    expect(data.result[0].children[0].estefforts).to.eql(19);
                    expect(data.result[0].children[0].estefforts_min).to.eql(9);
                    expect(data.result[0].children[0].estefforts_max).to.eql(10);
                    expect(data.result[0].children[0].count).to.eql(2);
                    expect(data.result[0].children[0].children[0]._id).to.eql("High");
                    expect(data.result[0].children[0].children[0].priorityid.priority).to.eql("High");
                    expect(data.result[0].children[0].children[0].children).have.length(2);
                    expect(data.result[0].children[0].children[0].children[0]._id).to.eql("task09");
                    expect(data.result[0].children[0].children[0].children[0].task).to.eql("task09");
                    expect(data.result[0].children[0].children[0].children[0].estefforts).to.eql(9);
                    expect(data.result[0].children[0].children[0].children[0].status).to.eql("Completed");
                    expect(data.result[0].children[0].children[0].estefforts).to.eql(19);
                    expect(data.result[0].children[0].children[0].estefforts_min).to.eql(9);
                    expect(data.result[0].children[0].children[0].estefforts_max).to.eql(10);
                    expect(data.result[0].children[0].children[0].count).to.eql(2);

                    expect(data.result[1]._id).to.eql("Sales");
                    expect(data.result[1].count).to.eql(3);
                    expect(data.result[1].estefforts).to.eql(14);
                    expect(data.result[1].estefforts_min).to.eql(2);
                    expect(data.result[1].estefforts_max).to.eql(8);
                    expect(data.result[1].businessfunctionid._id).to.eql("Sales");
                    expect(data.result[1].businessfunctionid.businessfunction).to.eql("Sales");
                    expect(data.result[1].children).to.have.length(2);
                    expect(data.result[1].children[0]._id).to.eql("InProgress");
                    expect(data.result[1].children[0].status).to.eql("InProgress");
                    expect(data.result[1].children[0].children).to.have.length(1);
                    expect(data.result[1].children[0].estefforts).to.eql(4);
                    expect(data.result[1].children[0].estefforts_min).to.eql(4);
                    expect(data.result[1].children[0].estefforts_max).to.eql(4);
                    expect(data.result[1].children[0].count).to.eql(1);
                    expect(data.result[1].children[0].children[0]._id).to.eql("High");
                    expect(data.result[1].children[0].children[0].priorityid.priority).to.eql("High");
                    expect(data.result[1].children[0].children[0].children).have.length(1);
                    expect(data.result[1].children[0].children[0].children[0]._id).to.eql("task04");
                    expect(data.result[1].children[0].children[0].children[0].task).to.eql("task04");
                    expect(data.result[1].children[0].children[0].children[0].estefforts).to.eql(4);
                    expect(data.result[1].children[0].children[0].children[0].status).to.eql("InProgress");
                    expect(data.result[1].children[0].children[0].estefforts).to.eql(4);
                    expect(data.result[1].children[0].children[0].count).to.eql(1);

                    expect(data.result[1].children[1]._id).to.eql("New");
                    expect(data.result[1].children[1].status).to.eql("New");
                    expect(data.result[1].children[1].children).to.have.length(2);
                    expect(data.result[1].children[1].estefforts).to.eql(10);
                    expect(data.result[1].children[1].estefforts_min).to.eql(2);
                    expect(data.result[1].children[1].estefforts_max).to.eql(8);
                    expect(data.result[1].children[1].count).to.eql(2);
                    expect(data.result[1].children[1].children[0]._id).to.eql("Medium");
                    expect(data.result[1].children[1].children[0].priorityid.priority).to.eql("Medium");
                    expect(data.result[1].children[1].children[0].children).have.length(1);
                    expect(data.result[1].children[1].children[0].children[0]._id).to.eql("task08");
                    expect(data.result[1].children[1].children[0].children[0].task).to.eql("task08");
                    expect(data.result[1].children[1].children[0].children[0].estefforts).to.eql(8);
                    expect(data.result[1].children[1].children[0].children[0].status).to.eql("New");
                    expect(data.result[1].children[1].children[0].estefforts).to.eql(8);
                    expect(data.result[1].children[1].children[0].estefforts_min).to.eql(8);
                    expect(data.result[1].children[1].children[0].estefforts_max).to.eql(8);
                    expect(data.result[1].children[1].children[0].count).to.eql(1);
                    done();
                })
            })


            var mongoPipeLine = [
                {"$group":{"_id":{"businessfunctionid":"$businessfunctionid._id", "status":"$status", "priorityid":"$priorityid._id"}, "count":{"$sum":1}, "estefforts":{"$sum":"$estefforts"}, "estefforts_min":{"$min":"$estefforts"}, "estefforts_max":{"$max":"$estefforts"}, "businessfunctionid":{"$first":"$businessfunctionid"}, "status":{"$first":"$status"}, "priorityid":{"$first":"$priorityid"}, "children":{"$push":{"_id":"$_id", "task":"$task", "estefforts":"$estefforts", "status":"$status"}}}},
                {"$match":{"estefforts":{"$lt":20}}},
                {"$sort":{"businessfunctionid":1, "status":1}},
                {"$group":{"_id":{"business functionid":"$_id.businessfunctionid", "status":"$_id.status"}, "count":{"$sum":"$count"}, "estefforts":{"$sum":"$estefforts"}, "estefforts_min":{"$min":"$estefforts_min"}, "estefforts_max":{"$max":"$estefforts_max"}, "businessfunctionid":{"$first":"$businessfunctionid"}, "status":{"$first":"$status"}, "chi ldren":{"$push":{"_id":"$_id.priorityid", "priorityid":"$priorityid", "children":"$children", "count":"$count", "estefforts":"$estefforts", "estefforts_min":"$estefforts_min", "estefforts_max":"$estefforts_max"}}}},
                {"$match":{"estefforts":{"$lt":20}}},
                {"$sort":{"businessfunctionid":1, "status":1}},
                {"$group ":{"_id":"$_id.businessfunctionid", "count":{"$sum":"$count"}, "estefforts":{"$sum":"$estefforts"}, "estefforts_min":{"$min":"$estefforts_min"}, "estefforts_max":{"$max":"$estefforts_max"}, "businessfunctionid":{"$first":"$businessfunctionid"}, "children":{"$push":{"_id":"$_id.status", "status":"$status", " children":"$children", "count":"$count", "estefforts":"$estefforts", "estefforts_min":"$estefforts_min", "estefforts_max":"$estefforts_max"}}}},
                {"$match":{"estefforts":{"$lt":20}}},
                {"$sort":{"businessfunctionid":1, "status":1}},
                {"$sort":{"task":1}}
            ]

            var expectedResult = {"result":[
                {"_id":"Accounts", "count":2, "estefforts":19, "estefforts_min":9, "estefforts_max":10, "businessfunctionid":{"_id":"Accounts", "businessfunction":"Accounts"}, "children":[
                    {"_id":"Completed", "status":"Completed", "children":[
                        {"_id":"High", "priorityid":{"_id":"Hi gh", "priority":"High"}, "children":[
                            {"_id":"task09", "task":"task09", "estefforts":9, "status":"Completed"},
                            {"_id":"task10", "task":"task10", "estefforts":10, "status":"Completed"}
                        ], "count":2, "estefforts":19, "estefforts_min":9, "estefforts_max":10}
                    ], "count":2, "estefforts":19, "estefforts_min":9, "estefforts_m ax":10}
                ]},
                {"_id":"Sales", "count":3, "estefforts":14, "estefforts_min":2, "estefforts_max":8, "businessfunctionid":{"_id":"Sales", "businessfunction":"Sales"}, "children":[
                    {"_id":"InProgress", "status":"InProgress", "children":[
                        {"_id":"High", "priorityid":{"_id":"High", "priority":"High"}, "children":[
                            {"_id":"t ask04", "task":"task04", "estefforts":4, "status":"InProgress"}
                        ], "count":1, "estefforts":4, "estefforts_min":4, "estefforts_max":4}
                    ], "count":1, "estefforts":4, "estefforts_min":4, "estefforts_max":4},
                    {"_id":"New", "status":"New", "children":[
                        {"_id":"Medium", "priorityid":{"_id":"Medium", "priority":"Medium"}, "ch ildren":[
                            {"_id":"task08", "task":"task08", "estefforts":8, "status":"New"}
                        ], "count":1, "estefforts":8, "estefforts_min":8, "estefforts_max":8},
                        {"_id":"High", "priorityid":{"_id":"High", "priority":"High"}, "children":[
                            {"_id":"task02", "task":"task02", "estefforts":2, "status":"New"}
                        ], "count":1, "estefforts":2, "e stefforts_min":2, "estefforts_max":2}
                    ], "count":2, "estefforts":10, "estefforts_min":2, "estefforts_max":8}
                ]}
            ]};

        })

        it("group by on n Fk column more than one with having and sort and aggregates and data and array without _id", function (done) {

            ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
                if (err) {
                    done(err);
                    return;
                }

                var group = {
                    _id:[
                        {businessfunctionid:"$businessfunctionid"},
                        { status:"$status"} ,
                        { priorityid:"$priorityid"}
                    ],
                    count:{$sum:1},
                    estefforts:{$sum:"$estefforts"},
                    businessfunctionid:{$first:"$businessfunctionid"},
                    status:{$first:"$status"},
                    priorityid:{$first:"$priorityid"}
                };
                group[Constants.Query.SORT] = {businessfunctionid:1, status:1};
                group[Constants.Query.FILTER] = {estefforts:{$lt:20}};

                var query = {$collection:{collection:"tasks", fields:[
                    {field:"businessfunctionid", type:"fk", collection:"businessfunctions", set:["businessfunction"]},
                    {field:"priorityid", type:"fk", collection:"priorities", set:["priotiry"]}
                ]}, $fields:{task:1, estefforts:1, status:1}, $sort:{task:1}, $group:group};

                db.query(query, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    expect(data.result).to.have.length(2);
                    expect(data.result[0]._id).to.eql("Accounts");
                    expect(data.result[0].count).to.eql(2);
                    expect(data.result[0].estefforts).to.eql(19);
                    expect(data.result[0].businessfunctionid._id).to.eql("Accounts");
                    expect(data.result[0].businessfunctionid.businessfunction).to.eql("Accounts");
                    expect(data.result[0].children).to.have.length(1);
                    expect(data.result[0].children[0]._id).to.eql("Completed");
                    expect(data.result[0].children[0].status).to.eql("Completed");
                    expect(data.result[0].children[0].children).to.have.length(1);
                    expect(data.result[0].children[0].estefforts).to.eql(19);
                    expect(data.result[0].children[0].count).to.eql(2);
                    expect(data.result[0].children[0].children[0]._id).to.eql("High");
                    expect(data.result[0].children[0].children[0].priorityid.priority).to.eql("High");
                    expect(data.result[0].children[0].children[0].children).have.length(2);
                    expect(data.result[0].children[0].children[0].children[0]._id).to.eql("task09");
                    expect(data.result[0].children[0].children[0].children[0].task).to.eql("task09");
                    expect(data.result[0].children[0].children[0].children[0].estefforts).to.eql(9);
                    expect(data.result[0].children[0].children[0].children[0].status).to.eql("Completed");
                    expect(data.result[0].children[0].children[0].estefforts).to.eql(19);
                    expect(data.result[0].children[0].children[0].count).to.eql(2);

                    expect(data.result[1]._id).to.eql("Sales");
                    expect(data.result[1].count).to.eql(3);
                    expect(data.result[1].estefforts).to.eql(14);
                    expect(data.result[1].businessfunctionid._id).to.eql("Sales");
                    expect(data.result[1].businessfunctionid.businessfunction).to.eql("Sales");
                    expect(data.result[1].children).to.have.length(2);
                    expect(data.result[1].children[0]._id).to.eql("InProgress");
                    expect(data.result[1].children[0].status).to.eql("InProgress");
                    expect(data.result[1].children[0].children).to.have.length(1);
                    expect(data.result[1].children[0].estefforts).to.eql(4);
                    expect(data.result[1].children[0].count).to.eql(1);
                    expect(data.result[1].children[0].children[0]._id).to.eql("High");
                    expect(data.result[1].children[0].children[0].priorityid.priority).to.eql("High");
                    expect(data.result[1].children[0].children[0].children).have.length(1);
                    expect(data.result[1].children[0].children[0].children[0]._id).to.eql("task04");
                    expect(data.result[1].children[0].children[0].children[0].task).to.eql("task04");
                    expect(data.result[1].children[0].children[0].children[0].estefforts).to.eql(4);
                    expect(data.result[1].children[0].children[0].children[0].status).to.eql("InProgress");
                    expect(data.result[1].children[0].children[0].estefforts).to.eql(4);
                    expect(data.result[1].children[0].children[0].count).to.eql(1);

                    expect(data.result[1].children[1]._id).to.eql("New");
                    expect(data.result[1].children[1].status).to.eql("New");
                    expect(data.result[1].children[1].children).to.have.length(2);
                    expect(data.result[1].children[1].estefforts).to.eql(10);
                    expect(data.result[1].children[1].count).to.eql(2);
                    expect(data.result[1].children[1].children[0]._id).to.eql("Medium");
                    expect(data.result[1].children[1].children[0].priorityid.priority).to.eql("Medium");
                    expect(data.result[1].children[1].children[0].children).have.length(1);
                    expect(data.result[1].children[1].children[0].children[0]._id).to.eql("task08");
                    expect(data.result[1].children[1].children[0].children[0].task).to.eql("task08");
                    expect(data.result[1].children[1].children[0].children[0].estefforts).to.eql(8);
                    expect(data.result[1].children[1].children[0].children[0].status).to.eql("New");
                    expect(data.result[1].children[1].children[0].estefforts).to.eql(8);
                    expect(data.result[1].children[1].children[0].count).to.eql(1);

                    done();
                })
            })

            // /step

            var query1 = {
                $collection:"tasks",
                $group:[
                    {
                        _id:{businessfunctionid:"$businessfunctionid._id", status:"$status", priorityid:"$priorityid._id"},
                        count:{$sum:1},
                        estefforts:{$sum:"$estefforts"},
                        businessfunctionid:{$first:"$businessfunctionid"},
                        status:{$first:"$status"},
                        priorityid:{$first:"$priorityid"},
                        children:{$push:{task:"$task", status:"$status", estefforts:"$estefforts"}},
                        $filter:{estefforts:{$lt:20}},
                        $sort:{businessfunctionid:1, status:1}
                    },
                    {
                        _id:{businessfunctionid:"$_id.businessfunctionid", status:"$_id.status"},
                        count:{$sum:"$count"},
                        estefforts:{$sum:"$estefforts"},
                        businessfunctionid:{$first:"$businessfunctionid"},
                        status:{$first:"$status"},
                        children:{$push:{_id:"$_id.priorityid", priorityid:"$priorityid", count:"$count", estefforts:"$estefforts", children:"$children"}},
                        $filter:{estefforts:{$lt:20}},
                        $sort:{businessfunctionid:1, status:1}
                    },
                    {
                        _id:"$_id.businessfunctionid",
                        count:{$sum:"$count"},
                        estefforts:{$sum:"$estefforts"},
                        businessfunctionid:{$first:"$businessfunctionid"},
                        children:{$push:{_id:"$_id.status", status:"$status", count:"$count", estefforts:"$estefforts", children:"$children"}},
                        $filter:{estefforts:{$lt:20}},
                        $sort:{businessfunctionid:1, status:1}
                    }
                ]};

            var mongoPipeLine = [
                {"$group":{
                    "_id":{"businessfunctionid":"$businessfunctionid._id", "status":"$status", "priorityid":"$priorityid"},
                    "count":{"$sum":1},
                    "estefforts":{"$sum":"$estefforts"},
                    "businessfunctionid":{"$first":"$businessfunctionid"},
                    "status":{"$first":"$status"},
                    "priorityid":{"$first":"$priorityid"},
                    "children":{"$push":{"_id":"$_id", "task":"$task", "estefforts":"$estefforts", "status":"$status"}}
                }},
                {"$match":{"estefforts":{"$lt":20}}},
                {"$sort":{"businessfunctionid":1}},
                {"$group":{
                    "_id":{"businessfunctionid":"$_id.businessfunctionid", "status":"$_id.status"},
                    "count":{"$sum":"$count"},
                    "estefforts":{"$sum":"$estefforts"},
                    "businessfunctionid":{"$first":"$businessfunctionid"},
                    "status":{"$first":"$status"},
                    "children":{"$push":{"_id":"$_id.priorityid", "priorityid":"$priorityid", "children":"$children", "count":"$count", "estefforts":"$estefforts"}}
                }},
                {"$match":{"estefforts":{"$lt":20}}},
                {"$sort ":{"businessfunctionid":1, status:1}},
                {"$group":{
                    "_id":"$_id.businessfunctionid",
                    "count":{"$sum":"$count"},
                    "estefforts":{"$sum":"$estefforts"},
                    "businessfunctionid":{"$first":"$businessfunctionid"},
                    "children":{"$push":{"_id":"$_id.status", "status":"$status", "children":"$children", "count":"$count", "estefforts":"$estefforts"}}
                }},
                {"$match":{"estefforts":{"$lt":20}}},
                {"$sort":{"businessfunctionid":1, status:11}}
            ]


            var expectedResult = [
                {"_id":"Accounts", "count":2, "estefforts":19, "businessfunctionid":{"_id":"Accounts", "businessfunction":"Accounts"}, "children":[
                    {"_id":"Completed", "status":"Completed", "children":[
                        {"_id":"High", "priorityid":{"_id":"High", "priority":"High"}, "children":[
                            {"_id":"task09", "task":"task09", "estefforts":9, "status":"Completed"},
                            {"_id":"task10", "task":"task10", "estefforts":10, "status":"Completed"}
                        ], "count":2, "estefforts":19}
                    ], "count":2, "estefforts":19}
                ]},
                {"_id":"Sales", "count":3, "estefforts":14, "businessfunctionid":{"_id":"Sales", "businessfunction":"Sales"}, "children":[
                    {"_id":"InProgress", "status":"InProgress", "children":[
                        {"_id":"High", "priorityid":{"_id":"High", "priority":"High"}, "children":[
                            {"_id":"task04", "task":"task04", "estefforts":4, "status":"InProgress"}
                        ], "count":1, "estefforts":4}
                    ], "count":1, "estefforts":4},
                    {"_id":"New", "status":"New", "children":[
                        {"_id":"Medium", "priorityid ":{"_id":"Medium", "priority":"Medium"}, "children":[
                            {"_id":"task08", "task":"task08", "estefforts":8, "status":"New"}
                        ], "count":1, "estefforts":8},
                        {"_id":"High", "priorityid":{"_id":"High", "priority":"High"}, "children":[
                            {"_id":"task02", "task":"task02", "estefforts":2, "status":"New"}
                        ], "count":1, "estefforts":2}
                    ], "count":2, "estefforts":10}
                ]}
            ]

        })

//  in tasks --> group by on businessfunction having sum(estefforts) < 20 and sort on sum(esteffort) : asc --> group by on status (group by on businessfunction and status simultaneously)

        it("group by on n fk column more than one with having and sort and aggregates and data without array ", function (done) {

            ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
                if (err) {
                    done(err);
                    return;
                }

                var group = {
                    _id:{businessfunctionid:"$businessfunctionid._id", status:"$status"},
                    count:{$sum:1},
                    estefforts:{$sum:"$estefforts"},
                    businessfunctionid:{$first:"$businessfunctionid"},
                    status:{$first:"$status"}
                };
                group[Constants.Query.SORT] = {businessfunctionid:1};
                group[Constants.Query.FILTER] = {estefforts:{$lt:20}};

                var query = TEST_UTILITY.populateQuery(NorthwindDb.TASK_TABLE, {task:1, estefforts:1, status:1}, undefined, {task:1}, group);

                db.query(query, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    expect(data.result).to.have.length(5);

//                            expect(data.result[0]._id).to.eql("Sales");
//                            expect(data.result[0].count).to.eql(3);
//                            expect(data.result[0].estefforts).to.eql(14);
//                            expect(data.result[0].businessfunctionid._id).to.eql("Sales");
//                            expect(data.result[0].businessfunctionid.businessfunction).to.eql("Sales");
//                            expect(data.result[0].children).to.have.length(3);
//                            expect(data.result[0].children[0]._id).to.eql("task02");
//                            expect(data.result[0].children[0].task).to.eql("task02");
//                            expect(data.result[0].children[0].estefforts).to.eql(2);
//                            expect(data.result[0].children[0].status).to.eql("New");
//
//                            expect(data.result[1]._id).to.eql("Accounts");
//                            expect(data.result[1].count).to.eql(2);
//                            expect(data.result[1].estefforts).to.eql(19);
//                            expect(data.result[1].businessfunctionid._id).to.eql("Accounts");
//                            expect(data.result[1].businessfunctionid.businessfunction).to.eql("Accounts");
//                            expect(data.result[1].children).to.have.length(2);
//                            expect(data.result[1].children[0]._id).to.eql("task09");
//                            expect(data.result[1].children[0].task).to.eql("task09");
//                            expect(data.result[1].children[0].estefforts).to.eql(9);
//                            expect(data.result[1].children[0].status).to.eql("Completed");
                    done();
                })
            })

            var mongoPipeLine = [
                {$group:{
                    _id:{businessfunctionid:"$businessfunctionid._id", status:"$status"},
                    count:{$sum:1},
                    estefforts:{$sum:"$estefforts"},
                    businessfunctionid:{$first:"$businessfunctionid"},
                    status:{$first:"$status"},
                    children:{$push:{task:"$task", status:"$status", estefforts:"$estefforts"}}}},
                {$match:{estefforts:{$lt:20}}},
                {$sort:{businessfunctionid:1}}
            ]

            var result = {"result":[
                {"_id":{"businessfunctionid":"Accounts", "status":"Completed"}, "count":2, "estefforts":19, "businessfunctionid":{"_id":"Accounts", "businessfunction":"Accounts"}, "status":"Completed", "children":[
                    {"_id":"task09", "task":"task09", "estefforts":9, "status":"Completed"},
                    {"_id":"task10 ", "task":"task10", "estefforts":10, "status":"Completed"}
                ]},
                {"_id":{"businessfunctionid":"Delivery", "status":"InProgress"}, "count":2, "estefforts":9, "businessfunctionid":{"_id":"Delivery", "businessfunction":"Delivery"}, "status":"InProgress", "children":[
                    {"_id":"task03", "task":"task03", "estefforts":3, "st atus":"InProgress"},
                    {"_id":"task06", "task":"task06", "estefforts":6, "status":"InProgress"}
                ]},
                {"_id":{"businessfunctionid":"Delivery", "status":"New"}, "count":3, "estefforts":13, "businessfunctionid":{"_id":"Delivery", "businessfunction":"Delivery"}, "status":"New", "children":[
                    {"_id":"task01", "task":"task0 1", "estefforts":1, "status":"New"},
                    {"_id":"task05", "task":"task05", "estefforts":5, "status":"New"},
                    {"_id":"task07", "task":"task07", "estefforts":7, "status":"New"}
                ]},
                {"_id":{"businessfunctionid":"Sales", "status":"InProgress"}, "count":1, "estefforts":4, "businessfunctionid":{"_id":"Sales", "businessfunction ":"Sales"}, "status":"InProgress", "children":[
                    {"_id":"task04", "task":"task04", "estefforts":4, "status":"InProgress"}
                ]},
                {"_id":{"businessfunctionid":"Sales", "status":"New"}, "count":2, "estefforts":10, "businessfunctionid":{"_id":"Sales", "businessfunction":"Sales"}, "status":"New", "children":[
                    {"_id":"task0 2", "task":"task02", "estefforts":2, "status":"New"},
                    {"_id":"task08", "task":"task08", "estefforts":8, "status":"New"}
                ]}
            ]}

        })
    })

    //TODO, we do not required to add filter for 0 amount as we are starting from vouchers, it may requird when we starts from accountgroup
//TODO vli filter --> will be applied two time or single time
//TODO this report is without hierarchy
    it.skip("group by with unwind(array)  column with having and sort --> aggregates", function (done) {


        var Vouchers = [
            {voucherno:1, vlis:[
                {accountid:{_id:"service", "account":"service"}, amount:-500, accountgroupid:{_id:"Income", "accountgroup":"Income"}} ,
                {accountid:{_id:"salary", "account":"salary"}, amount:500, accountgroupid:{_id:"Expense", "accountgroup":"Expense"}}
            ] },
            {voucherno:2, vlis:[
                {accountid:{_id:"service", "account":"service"}, amount:-100, accountgroupid:{_id:"Income", "accountgroup":"Income"}} ,
                {accountid:{_id:"salary", "account":"salary"}, amount:100, accountgroupid:{_id:"Expense", "accountgroup":"Expense"}}
            ] }
        ]
        var query = {$collcetion:",vouchers", $filter:{"vlis.accountgroupid":{$in:["Income", "Expense"]}}, $unwind:["$vlis"],
            $group:{
                _id:[
                    {accountgroupid:"$vlis.accountgroupid"},
                    {accountid:"$vlis.accountid"}
                ],
                amount:{$sum:"$vlis.amount"}
            }};

        var mongoPipelines =
            [
                {$match:{"vlis.accountgroupid._id":{$in:["Income", "Expense"]}}},
                {$unwind:"vlis"},
                {$match:{"vlis.accountgroupid._id":{$in:["Income", "Expense"]}}},
                {$group:{
                    _id:{accountgroupid:"$vlis.accountgroupid._id", accountid:"$vlis.accountid._id"},
                    amount:{$sum:"$vlis.amount"},
                    accountgroupid:{$first:"$vlis.accountgroupid"},
                    accountid:{$first:"$vlis.accountid"}
                }},
                {$group:{
                    _id:"$_id.accoountgroupid",
                    amount:{$sum:"$amount"},
                    accountgroupid:{$first:"$accountgroupid"},
                    children:{$push:{_id:"$_id.accountid", accountid:"$accountid", amount:"$amount"}}
                }}

            ]
        var result = {result:[
            {_id:"Asset", "accountgroup":"Asset"}
        ]}

    })

    it.skip("group by on fk column --> aggregates and data and fk join column", function (done) {
        done();
    })

    it.skip("group by on fk column --> aggregates and data and fk join column", function (done) {
        done();
    })
})

