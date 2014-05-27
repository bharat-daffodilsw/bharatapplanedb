/**
 *
 *  mocha --recursive --timeout 150000 -g SubQuerytestcase --reporter spec
 *  mocha --recursive --timeout 150000 -g "UpdateTestCases" --reporter spec
 *
 *  mocha --recursive --timeout 150000 -g "subquery With blank fields" --reporter spec
 */
var expect = require('chai').expect;
var ApplaneDB = require("../lib/DB.js");
var Config = require("./config.js");
var NorthwindDb = require("./NorthwindDb.js");
var Utils = require("ApplaneCore/apputil/util.js");
var Constants = require("../lib/Constants.js");
var OPTIONS = {};

describe("SubQuerytestcase", function () {
    describe("Employee Tasks Relation", function () {

        beforeEach(function (done) {
            ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
                if (err) {
                    done(err);
                    return;
                }
                NorthwindDb.insertData(db, NorthwindDb.BUSINESS_FUNCTION_TABLE, NorthwindDb.BusinessFunctions, function (err, businessFunctions) {
//                console.log("businessFunctions >>>>>>>>>>>>" + JSON.stringify(businessFunctions));
                    if (err) {
                        done(err);
                        return;
                    }
                    NorthwindDb.insertData(db, NorthwindDb.TASK_TABLE, NorthwindDb.Tasks, function (err, tasks) {
//                    console.log("tasks >>>>>>>>>>>>" + JSON.stringify(tasks));
                        if (err) {
                            done(err);
                            return;
                        }
                        NorthwindDb.insertData(db, NorthwindDb.EMPLOYEES_TABLE, NorthwindDb.Employees, function (err, employees) {
//                        console.log("Emoployees >>>>>>>>>>>>" + JSON.stringify(employees));
                            if (err) {
                                done(err);
                                return;
                            }
                            done();
                        })
                    })
                })
            })
        });

        afterEach(function (done) {
            ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
                if (err) {
                    done(err);
                    return;
                }
                NorthwindDb.removeData(db, NorthwindDb.BUSINESS_FUNCTION_TABLE, {}, function (err, businessFunctions) {
//                console.log("businessFunctions>>>>>>>>" + JSON.stringify(businessFunctions));
                    if (err) {
                        done(err);
                        return;
                    }
                    NorthwindDb.removeData(db, NorthwindDb.TASK_TABLE, {}, function (err, tasks) {
//                    console.log("tasks>>>>>>>>" + JSON.stringify(tasks));
                        if (err) {
                            done(err);
                            return;
                        }
                        NorthwindDb.removeData(db, NorthwindDb.EMPLOYEES_TABLE, {}, function (err, employees) {
//                        console.log("employees>>>>>>>>" + JSON.stringify(employees));
                            if (err) {
                                done(err);
                                return;
                            }
                            done();
                        })
                    })
                })
            })
        });

        // business function and total taskhrs
        it("Subquery", function (done) {

            ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
                if (err) {
                    done(err);
                    return;
                }
                var query = {
                    $collection:NorthwindDb.BUSINESS_FUNCTION_TABLE,
                    $fields:{
                        businessfunction:1,
                        tasks:{
                            $type:"scalar",
                            $query:{
                                $collection:NorthwindDb.TASK_TABLE,
                                $group:{
                                    _id:null,
                                    count:{$sum:1},
                                    estefforts:{$sum:"$estefforts"}
                                }
                            },
                            $fk:"businessfunctionid._id", $parent:"_id"
                        }
                    },
                    $sort:{businessfunction:1}

                };
                db.query(query, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log("data>>>>>>>>>>" + JSON.stringify(data));
                    expect(data.result).to.have.length(4);

                    expect(data.result[0]._id).to.eql("Accounts");
                    expect(data.result[0].businessfunction).to.eql("Accounts");
                    expect(data.result[0].tasks._id).to.eql("Accounts");
                    expect(data.result[0].tasks.count).to.eql(2);
                    expect(data.result[0].tasks.estefforts).to.eql(19);

                    expect(data.result[1]._id).to.eql("Delivery");
                    expect(data.result[1].businessfunction).to.eql("Delivery");
                    expect(data.result[1].tasks._id).to.eql("Delivery");
                    expect(data.result[1].tasks.count).to.eql(5);
                    expect(data.result[1].tasks.estefforts).to.eql(22);

                    expect(data.result[2]._id).to.eql("HR");
                    expect(data.result[2].businessfunction).to.eql("HR");
                    expect(data.result[2].tasks._id).to.eql("HR");
                    expect(data.result[2].tasks.count).to.eql(2);
                    expect(data.result[2].tasks.estefforts).to.eql(23);

                    expect(data.result[3]._id).to.eql("Sales");
                    expect(data.result[3].businessfunction).to.eql("Sales");
                    expect(data.result[3].tasks._id).to.eql("Sales");
                    expect(data.result[3].tasks.count).to.eql(3);
                    expect(data.result[3].tasks.estefforts).to.eql(14);
                    done();

                })

            })


            //step1: get businessfunctions
            //subquery module check $fields has jsobobject of $query
            //query after sub query module
            var query1 = {
                $collection:"businessfunctions",
                $fields:{
                    businessfunction:1
                },
                $sort:{businessfunction:1}
            }
            //get business functions data
            var res = [
                {"_id":"Accounts", "businessfunction":"Accounts"},
                {"_id":"Delivery", "businessfunction":"Delivery"},
                {"_id":"HR", "businessfunction":"HR"},
                {"_id":"Sales", "businessfunction":"Sales"}
            ];
            // doresult of sub uqery module.
            var query2 = {
                $collection:"tasks",
                $group:{
                    _id:"$businessfunctionid._id",
                    count:{$sum:1},
                    estefforts:{$sum:"$estefforts"},
                    businessfunctionid__id:{$first:"$businessfunctionid._id"}  //TODO alias name if dot contains
                },
                $filter:{"$businessfunctionid._id":{$in:["Delivery", "Sales", "Accounts", "HR"]}}
            }
            var subQueryResult = {"result":[
                {"_id":"HR", "count":2, "estefforts":23, "businessfunctionid__id":"HR"},
                {"_id":"Accounts", "count":2, "estefforts":19, "businessfunctionid__id":"Accounts"},
                {"_id":"Sales", "count":3, "estefforts":14, "businessfunctionid__id":"Sales"},
                {"_id":"Delivery", "count":5, "estefforts":22, "businessfunctionid__id":"Delivery"}
            ]};
            // divide result on base of bfid.
            //remove assign to from result.
            var result = {"result":[
                {"_id":"Accounts", "businessfunction":"Accounts", "tasks":{"_id":"Accounts", "count":2, "estefforts":19}},
                {"_id":"Delivery", "businessfunction":"Delivery", "tasks":{"_id":"Delivery", "count":5, "estefforts":22}},
                {"_id":"HR", "businessfunction":"HR", "tasks":{"_id":"HR", "count":2, "estefforts":23}},
                {"_id":"Sales", "businessfunction":"Sales", "tasks":{"_id":"Sales", "count":3, "estefforts":14}}
            ]};
        });

        it("Subquery not found", function (done) {

            ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
                if (err) {
                    done(err);
                    return;
                }
                var query = {
                    $collection:NorthwindDb.BUSINESS_FUNCTION_TABLE,
                    $fields:{
                        businessfunction:1,
                        tasks:{
                            $type:"scalar",
                            $fk:"businessfunctionid._id", $parent:"_id"
                        }
                    },
                    $sort:{businessfunction:1}

                };
                db.query(query, function (err, data) {
                    if (err) {
                        console.log("Subquery not provided .... Error : >>>>>>>>>>>>>>>>>>>     " + err);
                        var noSubqueryError = err.toString().indexOf("If query is not defined can't define Object in field") != -1;
                        if (noSubqueryError) {
                            done();
                        } else {
                            done(err);
                        }
                    }
                    else {
                        expect(data).to.not.be.ok;
                        done();
                    }
                })
            })


            //step1: get businessfunctions
            //subquery module check $fields has jsobobject of $query
            //query after sub query module
            var query1 = {
                $collection:"businessfunctions",
                $fields:{
                    businessfunction:1
                },
                $sort:{businessfunction:1}
            }
            //get business functions data
            var res = [
                {"_id":"Accounts", "businessfunction":"Accounts"},
                {"_id":"Delivery", "businessfunction":"Delivery"},
                {"_id":"HR", "businessfunction":"HR"},
                {"_id":"Sales", "businessfunction":"Sales"}
            ];
            // doresult of sub uqery module.
            var query2 = {
                $collection:"tasks",
                $group:{
                    _id:"$businessfunctionid._id",
                    count:{$sum:1},
                    estefforts:{$sum:"$estefforts"},
                    businessfunctionid__id:{$first:"$businessfunctionid._id"}  //TODO alias name if dot contains
                },
                $filter:{"$businessfunctionid._id":{$in:["Delivery", "Sales", "Accounts", "HR"]}}
            }
            var subQueryResult = {"result":[
                {"_id":"HR", "count":2, "estefforts":23, "businessfunctionid__id":"HR"},
                {"_id":"Accounts", "count":2, "estefforts":19, "businessfunctionid__id":"Accounts"},
                {"_id":"Sales", "count":3, "estefforts":14, "businessfunctionid__id":"Sales"},
                {"_id":"Delivery", "count":5, "estefforts":22, "businessfunctionid__id":"Delivery"}
            ]};
            // divide result on base of bfid.
            //remove assign to from result.
            var result = {"result":[
                {"_id":"Accounts", "businessfunction":"Accounts", "tasks":{"_id":"Accounts", "count":2, "estefforts":19}},
                {"_id":"Delivery", "businessfunction":"Delivery", "tasks":{"_id":"Delivery", "count":5, "estefforts":22}},
                {"_id":"HR", "businessfunction":"HR", "tasks":{"_id":"HR", "count":2, "estefforts":23}},
                {"_id":"Sales", "businessfunction":"Sales", "tasks":{"_id":"Sales", "count":3, "estefforts":14}}
            ]};
        });

        it("Subquery without dotted in Fk", function (done) {

            ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
                if (err) {
                    done(err);
                    return;
                }
                var query = {
                    $collection:NorthwindDb.BUSINESS_FUNCTION_TABLE,
                    $fields:{
                        businessfunction:1,
                        tasks:{
                            $type:"scalar",
                            $query:{
                                $collection:{collection:NorthwindDb.TASK_TABLE, fields:[
                                    {field:"businessfunctionid", type:"fk", collection:"businessfunctions"}
                                ]},
                                $group:{
                                    _id:null,
                                    count:{$sum:1},
                                    estefforts:{$sum:"$estefforts"}
                                }
                            },
                            $fk:"businessfunctionid", $parent:"_id"
                        }
                    },
                    $sort:{businessfunction:1}
                };
                db.query(query, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log("data>>>>>>>>>>" + JSON.stringify(data));
                    expect(data.result).to.have.length(4);

                    expect(data.result[0]._id).to.eql("Accounts");
                    expect(data.result[0].businessfunction).to.eql("Accounts");
                    expect(data.result[0].tasks._id).to.eql("Accounts");
                    expect(data.result[0].tasks.count).to.eql(2);
                    expect(data.result[0].tasks.estefforts).to.eql(19);

                    expect(data.result[1]._id).to.eql("Delivery");
                    expect(data.result[1].businessfunction).to.eql("Delivery");
                    expect(data.result[1].tasks._id).to.eql("Delivery");
                    expect(data.result[1].tasks.count).to.eql(5);
                    expect(data.result[1].tasks.estefforts).to.eql(22);

                    expect(data.result[2]._id).to.eql("HR");
                    expect(data.result[2].businessfunction).to.eql("HR");
                    expect(data.result[2].tasks._id).to.eql("HR");
                    expect(data.result[2].tasks.count).to.eql(2);
                    expect(data.result[2].tasks.estefforts).to.eql(23);

                    expect(data.result[3]._id).to.eql("Sales");
                    expect(data.result[3].businessfunction).to.eql("Sales");
                    expect(data.result[3].tasks._id).to.eql("Sales");
                    expect(data.result[3].tasks.count).to.eql(3);
                    expect(data.result[3].tasks.estefforts).to.eql(14);
                    done();

                })

            })


            //step1: get businessfunctions
            //subquery module check $fields has jsobobject of $query
            //query after sub query module
            var query1 = {
                $collection:"businessfunctions",
                $fields:{
                    businessfunction:1
                },
                $sort:{businessfunction:1}
            }
            //get business functions data
            var res = [
                {"_id":"Accounts", "businessfunction":"Accounts"},
                {"_id":"Delivery", "businessfunction":"Delivery"},
                {"_id":"HR", "businessfunction":"HR"},
                {"_id":"Sales", "businessfunction":"Sales"}
            ];
            // doresult of sub uqery module.
            var query2 = {
                $collection:"tasks",
                $group:{
                    _id:"$businessfunctionid._id",
                    count:{$sum:1},
                    estefforts:{$sum:"$estefforts"},
                    businessfunctionid__id:{$first:"$businessfunctionid._id"}  //TODO alias name if dot contains
                },
                $filter:{"$businessfunctionid._id":{$in:["Delivery", "Sales", "Accounts", "HR"]}}
            }
            var subQueryResult = {"result":[
                {"_id":"HR", "count":2, "estefforts":23, "businessfunctionid__id":"HR"},
                {"_id":"Accounts", "count":2, "estefforts":19, "businessfunctionid__id":"Accounts"},
                {"_id":"Sales", "count":3, "estefforts":14, "businessfunctionid__id":"Sales"},
                {"_id":"Delivery", "count":5, "estefforts":22, "businessfunctionid__id":"Delivery"}
            ]};
            // divide result on base of bfid.
            //remove assign to from result.
            var result = {"result":[
                {"_id":"Accounts", "businessfunction":"Accounts", "tasks":{"_id":"Accounts", "count":2, "estefforts":19}},
                {"_id":"Delivery", "businessfunction":"Delivery", "tasks":{"_id":"Delivery", "count":5, "estefforts":22}},
                {"_id":"HR", "businessfunction":"HR", "tasks":{"_id":"HR", "count":2, "estefforts":23}},
                {"_id":"Sales", "businessfunction":"Sales", "tasks":{"_id":"Sales", "count":3, "estefforts":14}}
            ]};
        });


        // employees and total taskhrs
        it("Subquery on array of fk", function (done) {
            //@TODO throw error if group on array column.

            ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
                if (err) {
                    done(err);
                    return;
                }
                var query = {
                    $collection:NorthwindDb.EMPLOYEES_TABLE,
                    $fields:{
                        employee:1,
                        tasks:{
                            $type:"scalar",
                            $query:{
                                $collection:NorthwindDb.TASK_TABLE,
                                $unwind:["assignto"],
                                $group:{_id:null,
                                    count:{$sum:1},
                                    estefforts:{$sum:"$estefforts"}
                                }
                            },
                            $fk:"assignto._id", $parent:"_id"}
                    },
                    $sort:{employee:1}
                };
                db.query(query, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log("data>>>>>>>>>>" + JSON.stringify(data));
                    expect(data.result).to.have.length(4);

                    expect(data.result[0]._id).to.eql("Ashish");
                    expect(data.result[0].employee).to.eql("Ashish");
                    expect(data.result[0].tasks._id).to.eql("Ashish");
                    expect(data.result[0].tasks.count).to.eql(2);
                    expect(data.result[0].tasks.estefforts).to.eql(7);

                    expect(data.result[1]._id).to.eql("Pawan");
                    expect(data.result[1].employee).to.eql("Pawan");
                    expect(data.result[1].tasks._id).to.eql("Pawan");
                    expect(data.result[1].tasks.count).to.eql(7);
                    expect(data.result[1].tasks.estefforts).to.eql(50);

                    expect(data.result[2]._id).to.eql("Rohit");
                    expect(data.result[2].employee).to.eql("Rohit");
                    expect(data.result[2].tasks._id).to.eql("Rohit");
                    expect(data.result[2].tasks.count).to.eql(8);
                    expect(data.result[2].tasks.estefforts).to.eql(52);

                    expect(data.result[3]._id).to.eql("Sachin");
                    expect(data.result[3].employee).to.eql("Sachin");
                    expect(data.result[3].tasks._id).to.eql("Sachin");
                    expect(data.result[3].tasks.count).to.eql(4);
                    expect(data.result[3].tasks.estefforts).to.eql(22);
                    done();

                })

            })

            //step1: get tasks
            //subquery module check $fields has jsobobject of $query
            //query after sub query module
            var query1 = {
                $collection:NorthwindDb.EMPLOYEES_TABLE,
                $fields:{
                    employee:1
                }
            }
            //get employee data
            var employees = [
                {_id:"Ashish", "employee":"Ashish"},
                {_id:"Pawan", "employee":"Pawan"},
                {_id:"Rohit", "employee":"Rohit"},
                {_id:"Sachin", "employee":"Sachin"}
            ];
            // doresult of sub uqery module.
            var query2 = {
                $collection:NorthwindDb.TASK_TABLE,
                $unwind:["assignto"],
                "$group":{
                    "_id":"$assignto._id",
                    "count":{"$sum":1},
                    "estefforts":{"$sum":"$estefforts"},
                    "assignto__id":{"$first":"$assignto._id"}
                },
                "$filter":{"assignto._id":{"$in":["Pawan", "Rohit", "Sachin", "Ashish"]}}
            }

            var subQueryResult = {"result":[
                {"_id":"Sachin", "count":4, "estefforts":22, "assignto__id":"Sachin"},
                {"_id":"Ashish", "count":2, "estefforts":7, "assignto__id":"Ashish"},
                {"_id":"Rohit", "count":8, "estefforts":52, "assignto__id":"Rohit"},
                {"_id":"Pawan", "count":7, "estefforts":50, "assignto__id":"Pawan"}
            ]};
            // divide result on base of assignto.
            //remove assign to from result.
            var result = {"result":[
                {"_id":"Ashish", "employee":"Ashish", "tasks":{"_id":"Ashish", "count":2, "estefforts":7}},
                {"_id":"Pawan", "employee":"Pawan", "tasks":{"_id":"Pawan", "count":7, "estefforts":50}},
                {"_id":"Rohit", "employee":"Rohit", "tasks":{"_id":"Rohit", "count":8, "estefforts":52}},
                {"_id":"Sachin", "e mployee":"Sachin", "tasks":{"_id":"Sachin", "count":4, "estefforts":22}}
            ]};
        });

        it("Subquery on array without dotted of fk", function (done) {
            //@TODO throw error if group on array column.

            ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
                if (err) {
                    done(err);
                    return;
                }
                var query = {
                    $collection:NorthwindDb.EMPLOYEES_TABLE,
                    $fields:{
                        employee:1,
                        tasks:{
                            $type:"scalar",
                            $query:{
                                $collection:{collection:NorthwindDb.TASK_TABLE, fields:[
                                    {field:"assignto", type:"fk", collection:NorthwindDb.EMPLOYEES_TABLE}
                                ]},
                                $unwind:["assignto"],
                                $group:{_id:null,
                                    count:{$sum:1},
                                    estefforts:{$sum:"$estefforts"}
                                }
                            },
                            $fk:"assignto", $parent:"_id"}
                    },
                    $sort:{employee:1}
                };
                db.query(query, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log("data>>>>>>>>>>" + JSON.stringify(data));
                    expect(data.result).to.have.length(4);

                    expect(data.result[0]._id).to.eql("Ashish");
                    expect(data.result[0].employee).to.eql("Ashish");
                    expect(data.result[0].tasks._id).to.eql("Ashish");
                    expect(data.result[0].tasks.count).to.eql(2);
                    expect(data.result[0].tasks.estefforts).to.eql(7);

                    expect(data.result[1]._id).to.eql("Pawan");
                    expect(data.result[1].employee).to.eql("Pawan");
                    expect(data.result[1].tasks._id).to.eql("Pawan");
                    expect(data.result[1].tasks.count).to.eql(7);
                    expect(data.result[1].tasks.estefforts).to.eql(50);

                    expect(data.result[2]._id).to.eql("Rohit");
                    expect(data.result[2].employee).to.eql("Rohit");
                    expect(data.result[2].tasks._id).to.eql("Rohit");
                    expect(data.result[2].tasks.count).to.eql(8);
                    expect(data.result[2].tasks.estefforts).to.eql(52);

                    expect(data.result[3]._id).to.eql("Sachin");
                    expect(data.result[3].employee).to.eql("Sachin");
                    expect(data.result[3].tasks._id).to.eql("Sachin");
                    expect(data.result[3].tasks.count).to.eql(4);
                    expect(data.result[3].tasks.estefforts).to.eql(22);
                    done();

                })

            })

            //step1: get tasks
            //subquery module check $fields has jsobobject of $query
            //query after sub query module
            var query1 = {
                $collection:NorthwindDb.EMPLOYEES_TABLE,
                $fields:{
                    employee:1
                }
            }
            //get employee data
            var employees = [
                {_id:"Ashish", "employee":"Ashish"},
                {_id:"Pawan", "employee":"Pawan"},
                {_id:"Rohit", "employee":"Rohit"},
                {_id:"Sachin", "employee":"Sachin"}
            ];
            // doresult of sub uqery module.
            var query2 = {
                $collection:NorthwindDb.TASK_TABLE,
                $unwind:["assignto"],
                "$group":{
                    "_id":"$assignto._id",
                    "count":{"$sum":1},
                    "estefforts":{"$sum":"$estefforts"},
                    "assignto__id":{"$first":"$assignto._id"}
                },
                "$filter":{"assignto._id":{"$in":["Pawan", "Rohit", "Sachin", "Ashish"]}}
            }

            var subQueryResult = {"result":[
                {"_id":"Sachin", "count":4, "estefforts":22, "assignto__id":"Sachin"},
                {"_id":"Ashish", "count":2, "estefforts":7, "assignto__id":"Ashish"},
                {"_id":"Rohit", "count":8, "estefforts":52, "assignto__id":"Rohit"},
                {"_id":"Pawan", "count":7, "estefforts":50, "assignto__id":"Pawan"}
            ]};
            // divide result on base of assignto.
            //remove assign to from result.
            var result = {"result":[
                {"_id":"Ashish", "employee":"Ashish", "tasks":{"_id":"Ashish", "count":2, "estefforts":7}},
                {"_id":"Pawan", "employee":"Pawan", "tasks":{"_id":"Pawan", "count":7, "estefforts":50}},
                {"_id":"Rohit", "employee":"Rohit", "tasks":{"_id":"Rohit", "count":8, "estefforts":52}},
                {"_id":"Sachin", "e mployee":"Sachin", "tasks":{"_id":"Sachin", "count":4, "estefforts":22}}
            ]};
        });


        //@TODO cross join
        it("Subquery with n-rows", function (done) {

            ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
                if (err) {
                    done(err);
                    return;
                }
                var query = {
                    $collection:NorthwindDb.EMPLOYEES_TABLE,
                    $fields:{
                        employee:1,
                        tasks:{$type:"n-row",
                            $query:{
                                $collection:"tasks",
                                $unwind:["assignto"],
                                $group:{
                                    _id:"$status",
                                    count:{$sum:1},
                                    estefforts:{$sum:"$estefforts"},
                                    status:{$first:"$status"}
                                },
                                $sort:{status:1}
                            },
                            $fk:"assignto._id",
                            $parent:"_id"
                        }
                    },
                    $sort:{employee:1}
                };
                db.query(query, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log("data>>>>>>>>>>" + JSON.stringify(data));
                    expect(data.result).to.have.length(4);

                    expect(data.result[0]._id).to.eql("Ashish");
                    expect(data.result[0].employee).to.eql("Ashish");
                    expect(data.result[0].tasks).to.have.length(1);
                    expect(data.result[0].tasks[0]._id).to.eql("New");
                    expect(data.result[0].tasks[0].count).to.eql(2);
                    expect(data.result[0].tasks[0].estefforts).to.eql(7);

                    expect(data.result[1]._id).to.eql("Pawan");
                    expect(data.result[1].employee).to.eql("Pawan");
                    expect(data.result[1].tasks).to.have.length(3);
                    expect(data.result[1].tasks[0]._id).to.eql("Completed");
                    expect(data.result[1].tasks[0].count).to.eql(3);
                    expect(data.result[1].tasks[0].estefforts).to.eql(32);
                    expect(data.result[1].tasks[1]._id).to.eql("InProgress");
                    expect(data.result[1].tasks[1].count).to.eql(2);
                    expect(data.result[1].tasks[1].estefforts).to.eql(10);
                    expect(data.result[1].tasks[2]._id).to.eql("New");
                    expect(data.result[1].tasks[2].count).to.eql(2);
                    expect(data.result[1].tasks[2].estefforts).to.eql(8);

                    expect(data.result[2]._id).to.eql("Rohit");
                    expect(data.result[2].employee).to.eql("Rohit");
                    expect(data.result[2].tasks).to.have.length(3);
                    expect(data.result[2].tasks[0]._id).to.eql("Completed");
                    expect(data.result[2].tasks[0].count).to.eql(3);
                    expect(data.result[2].tasks[0].estefforts).to.eql(32);
                    expect(data.result[2].tasks[1]._id).to.eql("InProgress");
                    expect(data.result[2].tasks[1].count).to.eql(2);
                    expect(data.result[2].tasks[1].estefforts).to.eql(9);
                    expect(data.result[2].tasks[2]._id).to.eql("New");
                    expect(data.result[2].tasks[2].count).to.eql(3);
                    expect(data.result[2].tasks[2].estefforts).to.eql(11);

                    expect(data.result[3]._id).to.eql("Sachin");
                    expect(data.result[3].employee).to.eql("Sachin");
                    expect(data.result[3].tasks).to.have.length(3);
                    expect(data.result[3].tasks[0]._id).to.eql("Completed");
                    expect(data.result[3].tasks[0].count).to.eql(1);
                    expect(data.result[3].tasks[0].estefforts).to.eql(10);
                    expect(data.result[3].tasks[1]._id).to.eql("InProgress");
                    expect(data.result[3].tasks[1].count).to.eql(2);
                    expect(data.result[3].tasks[1].estefforts).to.eql(7);
                    expect(data.result[3].tasks[2]._id).to.eql("New");
                    expect(data.result[3].tasks[2].count).to.eql(1);
                    expect(data.result[3].tasks[2].estefforts).to.eql(5);
                    done();

                })

            })


            //step1: get tasks
            //subquery module check $fields has jsobobject of $query
            //query after sub query module
            var query1 = {
                $collection:"employees",
                $fields:{
                    employee:1
                },
                $sort:{employee:1}
            }
            //get employee data
            var employees = [
                {_id:"Ashish", "employee":"Ashish"},
                {_id:"Pawan", "employee":"Pawan"},
                {_id:"Rohit", "employee":"Rohit"},
                {_id:"Sachin", "employee":"Sachin"}
            ];
            // doresult of sub uqery module.
            var query2 = {
                "$collection":"tasks",
                "$unwind":["assignto"],
                "$group":{
                    _id:{status:"$status", assignto__id:"$assignto._id"},
                    "count":{"$sum":1},
                    "estefforts":{"$sum":"$estefforts"},
                    status:{$first:"$status"},
                    "assignto__id":{"$first":"$assignto._id"}
                },
                $sort:{"status":1},
                "$filter":{"assignto._id":{"$in":["Pawan", "Rohit", "Sachin", "Ashish"]}}
            }

            var res = {"result":[
                {"_id":{"status":"Completed", "assignto__id":"Sachin"}, "count":1, "estefforts":10, "status":"Completed", "assignto__id":"Sachin"},
                {"_id":{"status":"Completed", "assignto__id":"Rohit"}, "count":3, "estefforts":32, "status":"Completed", "assignto__id":"Rohit"},
                {"_id":{"status":"Completed", "assignto__id":"Pawan"}, "count":3, "estefforts":32, "status":"Completed", "assignto__id":"Pawan"},
                {"_id":{"status":"InProgress", "assignto__id":"Pawan"}, "count":2, "estefforts":10, "status":"InProgress", "assignto__id":"Pawan"},
                {"_id":{"stat us":"InProgress", "assignto__id":"Sachin"}, "count":2, "estefforts":7, "status":"InProgress", "assignto__id":"Sachin"},
                {"_id":{"status":"InProgress", "assignto__id":"Rohit"}, "count":2, "estefforts":9, "status":"InProgress", "assignto__id":"Rohit"},
                {"_id":{"status":"New", "assignto__id":"Sachin"}, "count":1, "estefforts":5, "status":"New", "assignto__id":"Sachin"},
                {"_id":{"status":"New", "assignto__id":"Ashish"}, "count":2, "estefforts":7, "status":"New", "assignto__id":"Ashish"},
                {"_id":{"status":"New", "assignto__id":"Rohit"}, "count":3, "estefforts":11, "status":"New", "assignto__id":"Rohit"},
                {"_id":{"status":"New", "assignto__id":"Pawan"}, "count":2, "estefforts":8, "st atus":"New", "assignto__id":"Pawan"}
            ]};
            // divide result on base of assignto.
            //remove assign to from result.
            var result = {"result":[
                {"_id":"Ashish", "employee":"Ashish", "tasks":[
                    {"_id":"New", "count":2, "estefforts":7, "status":"New"}
                ]},
                {"_id":"Pawan", "employee":"Pawan", "tasks":[
                    {"_id":"Completed", "count":3, "estefforts":32, "status":"Completed"},
                    {"_id":"InProgress", "count":2, "estefforts":10, "status":"InProgress"},
                    {"_id":"New", "count":2, "estefforts":8, "status":"New"}
                ]},
                {"_id":"Rohit", "employee":"Rohit", "tasks":[
                    {"_id":"Completed", "count":3, "estefforts":32, "status":"Completed"},
                    {"_id":"InProgress", "count":2, "estefforts":9, "status":"InProgress"},
                    {"_id":"New", "count":3, "estefforts":11, "status":"New"}
                ]},
                {"_i d":"Sachin", "employee":"Sachin", "tasks":[
                    {"_id":"Completed", "count":1, "estefforts":10, "status":"Completed"},
                    {"_id":"InProgress", "count":2, "estefforts":7, "status":"InProgress"},
                    {"_id":"New", "count":1, "estefforts":5, "status":"New"}
                ]}
            ]};
        });

        it("Subquery with n-rows without dotted fk", function (done) {

            ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
                if (err) {
                    done(err);
                    return;
                }
                var query = {
                    $collection:NorthwindDb.EMPLOYEES_TABLE,
                    $fields:{
                        employee:1,
                        tasks:{$type:"n-row",
                            $query:{
                                $collection:{collection:"tasks",fields:[{field:"assignto",type:"fk",collection:NorthwindDb.EMPLOYEES_TABLE}]},
                                $unwind:["assignto"],
                                $group:{
                                    _id:"$status",
                                    count:{$sum:1},
                                    estefforts:{$sum:"$estefforts"},
                                    status:{$first:"$status"}
                                },
                                $sort:{status:1}
                            },
                            $fk:"assignto",
                            $parent:"_id"
                        }
                    },
                    $sort:{employee:1}
                };
                db.query(query, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log("data>>>>>>>>>>" + JSON.stringify(data));
                    expect(data.result).to.have.length(4);

                    expect(data.result[0]._id).to.eql("Ashish");
                    expect(data.result[0].employee).to.eql("Ashish");
                    expect(data.result[0].tasks).to.have.length(1);
                    expect(data.result[0].tasks[0]._id).to.eql("New");
                    expect(data.result[0].tasks[0].count).to.eql(2);
                    expect(data.result[0].tasks[0].estefforts).to.eql(7);

                    expect(data.result[1]._id).to.eql("Pawan");
                    expect(data.result[1].employee).to.eql("Pawan");
                    expect(data.result[1].tasks).to.have.length(3);
                    expect(data.result[1].tasks[0]._id).to.eql("Completed");
                    expect(data.result[1].tasks[0].count).to.eql(3);
                    expect(data.result[1].tasks[0].estefforts).to.eql(32);
                    expect(data.result[1].tasks[1]._id).to.eql("InProgress");
                    expect(data.result[1].tasks[1].count).to.eql(2);
                    expect(data.result[1].tasks[1].estefforts).to.eql(10);
                    expect(data.result[1].tasks[2]._id).to.eql("New");
                    expect(data.result[1].tasks[2].count).to.eql(2);
                    expect(data.result[1].tasks[2].estefforts).to.eql(8);

                    expect(data.result[2]._id).to.eql("Rohit");
                    expect(data.result[2].employee).to.eql("Rohit");
                    expect(data.result[2].tasks).to.have.length(3);
                    expect(data.result[2].tasks[0]._id).to.eql("Completed");
                    expect(data.result[2].tasks[0].count).to.eql(3);
                    expect(data.result[2].tasks[0].estefforts).to.eql(32);
                    expect(data.result[2].tasks[1]._id).to.eql("InProgress");
                    expect(data.result[2].tasks[1].count).to.eql(2);
                    expect(data.result[2].tasks[1].estefforts).to.eql(9);
                    expect(data.result[2].tasks[2]._id).to.eql("New");
                    expect(data.result[2].tasks[2].count).to.eql(3);
                    expect(data.result[2].tasks[2].estefforts).to.eql(11);

                    expect(data.result[3]._id).to.eql("Sachin");
                    expect(data.result[3].employee).to.eql("Sachin");
                    expect(data.result[3].tasks).to.have.length(3);
                    expect(data.result[3].tasks[0]._id).to.eql("Completed");
                    expect(data.result[3].tasks[0].count).to.eql(1);
                    expect(data.result[3].tasks[0].estefforts).to.eql(10);
                    expect(data.result[3].tasks[1]._id).to.eql("InProgress");
                    expect(data.result[3].tasks[1].count).to.eql(2);
                    expect(data.result[3].tasks[1].estefforts).to.eql(7);
                    expect(data.result[3].tasks[2]._id).to.eql("New");
                    expect(data.result[3].tasks[2].count).to.eql(1);
                    expect(data.result[3].tasks[2].estefforts).to.eql(5);
                    done();

                })

            })


            //step1: get tasks
            //subquery module check $fields has jsobobject of $query
            //query after sub query module
            var query1 = {
                $collection:"employees",
                $fields:{
                    employee:1
                },
                $sort:{employee:1}
            }
            //get employee data
            var employees = [
                {_id:"Ashish", "employee":"Ashish"},
                {_id:"Pawan", "employee":"Pawan"},
                {_id:"Rohit", "employee":"Rohit"},
                {_id:"Sachin", "employee":"Sachin"}
            ];
            // doresult of sub uqery module.
            var query2 = {
                "$collection":"tasks",
                "$unwind":["assignto"],
                "$group":{
                    _id:{status:"$status", assignto__id:"$assignto._id"},
                    "count":{"$sum":1},
                    "estefforts":{"$sum":"$estefforts"},
                    status:{$first:"$status"},
                    "assignto__id":{"$first":"$assignto._id"}
                },
                $sort:{"status":1},
                "$filter":{"assignto._id":{"$in":["Pawan", "Rohit", "Sachin", "Ashish"]}}
            }

            var res = {"result":[
                {"_id":{"status":"Completed", "assignto__id":"Sachin"}, "count":1, "estefforts":10, "status":"Completed", "assignto__id":"Sachin"},
                {"_id":{"status":"Completed", "assignto__id":"Rohit"}, "count":3, "estefforts":32, "status":"Completed", "assignto__id":"Rohit"},
                {"_id":{"status":"Completed", "assignto__id":"Pawan"}, "count":3, "estefforts":32, "status":"Completed", "assignto__id":"Pawan"},
                {"_id":{"status":"InProgress", "assignto__id":"Pawan"}, "count":2, "estefforts":10, "status":"InProgress", "assignto__id":"Pawan"},
                {"_id":{"stat us":"InProgress", "assignto__id":"Sachin"}, "count":2, "estefforts":7, "status":"InProgress", "assignto__id":"Sachin"},
                {"_id":{"status":"InProgress", "assignto__id":"Rohit"}, "count":2, "estefforts":9, "status":"InProgress", "assignto__id":"Rohit"},
                {"_id":{"status":"New", "assignto__id":"Sachin"}, "count":1, "estefforts":5, "status":"New", "assignto__id":"Sachin"},
                {"_id":{"status":"New", "assignto__id":"Ashish"}, "count":2, "estefforts":7, "status":"New", "assignto__id":"Ashish"},
                {"_id":{"status":"New", "assignto__id":"Rohit"}, "count":3, "estefforts":11, "status":"New", "assignto__id":"Rohit"},
                {"_id":{"status":"New", "assignto__id":"Pawan"}, "count":2, "estefforts":8, "st atus":"New", "assignto__id":"Pawan"}
            ]};
            // divide result on base of assignto.
            //remove assign to from result.
            var result = {"result":[
                {"_id":"Ashish", "employee":"Ashish", "tasks":[
                    {"_id":"New", "count":2, "estefforts":7, "status":"New"}
                ]},
                {"_id":"Pawan", "employee":"Pawan", "tasks":[
                    {"_id":"Completed", "count":3, "estefforts":32, "status":"Completed"},
                    {"_id":"InProgress", "count":2, "estefforts":10, "status":"InProgress"},
                    {"_id":"New", "count":2, "estefforts":8, "status":"New"}
                ]},
                {"_id":"Rohit", "employee":"Rohit", "tasks":[
                    {"_id":"Completed", "count":3, "estefforts":32, "status":"Completed"},
                    {"_id":"InProgress", "count":2, "estefforts":9, "status":"InProgress"},
                    {"_id":"New", "count":3, "estefforts":11, "status":"New"}
                ]},
                {"_i d":"Sachin", "employee":"Sachin", "tasks":[
                    {"_id":"Completed", "count":1, "estefforts":10, "status":"Completed"},
                    {"_id":"InProgress", "count":2, "estefforts":7, "status":"InProgress"},
                    {"_id":"New", "count":1, "estefforts":5, "status":"New"}
                ]}
            ]};
        });
    })


    //@TODO cross join
    it.skip("salary sheet", function (done) {

        var query = {
            $collection:"employeemonthlyattendances",
            $fields:{
                employee:1,
                salarycomponents:{$type:"n-row",
                    $query:{$collection:"tasks",
                        $group:{_id:"$status",
                            count:{$sum:1},
                            estefforts:{$sum:"$estefforts"}}
                    },
                    $fk:"assignto",
                    $parent:"_id",
                    $crossjoin:"status"
                }
            }

        };

    });

    it.skip("Subquery on dotted", function (done) {
        var query = {
            $collection:"invoices",
            $fields:{
                invoiceno:1,
                "lineitems.devliveryid":1,
                "lineitems.amount":1,
                "lineitems.devliveryid.other":{
                    $query:{
                        $collcetion:"deliveries",
                        $fields:{productid:1}
                    },
                    $fk:"_id",
                    $parent:"lineitems.deliveryid._id"
                }
            }
        }

        // after doquery of subquery module.
        // ensure parent column in main query.
        var query1 = {
            $collection:"invoices",
            $fields:{
                invoiceno:1,
                "lineitems.devliveryid":1,
                "lineitems.amount":1
            }
        }

        var invoices = [
            {invoiceno:"1", lineitems:[
                {deliveryid:{_id:"001"}, amount:10000},
                {deliveryid:{_id:"002"}, amount:10000}
            ]}
        ];

        var query2 = {$collection:"deliveries", $fields:{productid:1}, $filter:{_id:{$in:["001", "002"]}}};

        var final = [
            {invoiceno:"1", lineitems:[
                {deliveryid:{_id:"001", li_productid:{_id:"001", productid:{_id:"laptop", product:"laptop"}}}, amount:10000},
                {deliveryid:{_id:"002"}, amount:10000}
            ]}
        ]


    });

    //TODO Restrict field is mandatory in Filter sub query and it can only be one
    describe("State City Relation", function () {
        beforeEach(function (done) {
            ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
                if (err) {
                    done(err);
                    return;
                }
                NorthwindDb.insertData(db, NorthwindDb.COUNTRIES_TABLE, NorthwindDb.Countries, function (err, countries) {
//                console.log("countries >>>>>>>>>>>>" + JSON.stringify(countries));
                    if (err) {
                        done(err);
                        return;
                    }
                    NorthwindDb.insertData(db, NorthwindDb.STATES_TABLE, NorthwindDb.States, function (err, states) {
//                    console.log("states >>>>>>>>>>>>" + JSON.stringify(states));
                        if (err) {
                            done(err);
                            return;
                        }
                        NorthwindDb.insertData(db, NorthwindDb.CITIES_TABLE, NorthwindDb.Cities, function (err, cities) {
//                        console.log("cities >>>>>>>>>>>>" + JSON.stringify(cities));
                            if (err) {
                                done(err);
                                return;
                            }
                            done();
                        })
                    })
                })
            })
        });

        afterEach(function (done) {
            ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
                if (err) {
                    done(err);
                    return;
                }
                NorthwindDb.removeData(db, NorthwindDb.COUNTRIES_TABLE, {}, function (err, countries) {
//                console.log("countries>>>>>>>>" + JSON.stringify(countries));
                    if (err) {
                        done(err);
                        return;
                    }
                    NorthwindDb.removeData(db, NorthwindDb.STATES_TABLE, {}, function (err, states) {
//                    console.log("states>>>>>>>>" + JSON.stringify(states));
                        if (err) {
                            done(err);
                            return;
                        }
                        NorthwindDb.removeData(db, NorthwindDb.CITIES_TABLE, {}, function (err, cities) {
//                        console.log("cities>>>>>>>>" + JSON.stringify(cities));
                            if (err) {
                                done(err);
                                return;
                            }
                            done();
                        })
                    })
                })
            })
        });

        it("subquery in filter", function (done) {
            ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
                if (err) {
                    done(err);
                    return;
                }

                var query = {
                    $collection:"cities",
                    $fields:{city:1},
                    $filter:{
                        "stateid._id":{
                            $query:{
                                $collection:"states",
                                $fields:{"_id":1},
                                $filter:{"countryid._id":"India"}
                            }
                        }
                    },
                    $sort:{city:1}

                };
                db.query(query, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log("data>>>>>>>>>>" + JSON.stringify(data));
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

                })

            })
            //step1: get state where countryid India in doQuery
            //subquery module check $fields has jsobobject of $query
            //query after sub query module
            var query1 = {
                $collcetion:"states",
                $fields:{"_id":1},
                $filter:{"countryid._id":"India"}
            }
            //get employee data
            var states = {"result":[
                {"_id":"Haryana"},
                {"_id":"Punjab"}
            ]};
            // doresult of sub uqery module.
            var query2 = {
                $collection:"cities",
                $fields:{city:1},
                $filter:{
                    "stateid._id":{$in:["Haryana", "Punjab"]}
                },
                $sort:{city:1}
            };

            var result = {"result":[
                {"_id":"Amritsar", "city":"Amritsar"},
                {"_id":"Bathinda", "city":"Bathinda"},
                {"_id":"Hisar", "city":"Hisar"},
                {"_id":"Sirsa", "city":"Sirsa"}
            ]};
        });

        it("subquery With blank fields", function (done) {
            ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
                if (err) {
                    done(err);
                    return;
                }

                var query = {
                    $collection:"cities",
                    $fields:{},
                    $sort:{city:1}

                };
                db.query(query, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log("data>>>>>>>>>>" + JSON.stringify(data));
                    expect(data.result).to.have.length(6);
                    expect(data.result[0]._id).to.eql("Amritsar");
                    expect(data.result[0].city).to.eql("Amritsar");
                    expect(data.result[1]._id).to.eql("Bathinda");
                    expect(data.result[1].city).to.eql("Bathinda");
                    expect(data.result[2]._id).to.eql("Hisar");
                    expect(data.result[2].city).to.eql("Hisar");
                    expect(data.result[3]._id).to.eql("Iceland");
                    expect(data.result[3].city).to.eql("Iceland");
                    expect(data.result[4]._id).to.eql("Sirsa");
                    expect(data.result[4].city).to.eql("Sirsa");
                    expect(data.result[5]._id).to.eql("Skyland");
                    expect(data.result[5].city).to.eql("Skyland");

                    done();

                })

                var expectedResult = {"result":[
                    {"_id":"Amritsar", "city":"Amritsar", "code":"19992", "stateid":{"_id":"Punjab", "state":"Punjab"}},
                    {"_id":"Bathinda", "city":"Bathinda", "code":"011", "stateid":{"_id":"Punjab", "state":"Punjab"}},
                    {"_id":"Hisar", "city":"Hisar", "code":"01662", "stateid":{"_id":"Haryana", "state":"Hary ana"}},
                    {"_id":"Iceland", "city":"Iceland", "code":"11111", "stateid":{"_id":"Newyork", "state":"Newyork"}},
                    {"_id":"Sirsa", "city":"Sirsa", "code":"01662", "stateid":{"_id":"Haryana", "state":"Haryana"}},
                    {"_id":"Skyland", "city":"Skyland", "code":"1101662", "stateid":{"_id":"Newyork", "state":"Newyork"}}
                ]};

            })

        });

    })
});




