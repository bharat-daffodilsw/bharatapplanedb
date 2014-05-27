/**
 * mocha --recursive --timeout 150000 -g "UDTtestcase" --reporter spec
 * mocha --recursive --timeout 150000 -g "insert currency type field" --reporter spec
 * mocha --recursive --timeout 150000 -g "update currency type field" --reporter spec
 * mocha --recursive --timeout 150000 -g "insert file type field" --reporter spec
 *
 *
 */

var expect = require('chai').expect;
var ApplaneDB = require("../lib/DB.js");
var Config = require("./config.js");

describe("UDTtestcase", function () {
    afterEach(function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            db.dropDatabase(function (err) {
                done(err);
            })
        });
    })
    it("insert duration type field", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {$collection:{"collection":"tasks", fields:[
                    {field:"task", type:"string"},
                    {field:"estimatedefforts", type:"duration"}
                ]}, $insert:[
                    {"task":"Implement UDT Module", "estimatedefforts":{"time":"5", "unit":"Hrs"}}
                ]}
            ]
            db.batchUpdateById(updates, function (err, result) {
                if (err) {
                    done(err);
                    return;
                }
                db.query({$collection:"tasks", $fields:{task:1, estimatedefforts:1}, $sort:{country:1}}, function (err, tasks) {
                    if (err) {
                        done(err);
                        return;
                    }
                    expect(tasks.result).to.have.length(1);
                    expect(tasks.result[0].estimatedefforts.time).to.eql(5);
                    expect(tasks.result[0].estimatedefforts.unit).to.eql("Hrs");
                    expect(tasks.result[0].estimatedefforts.convertedvalue).to.eql(300);
                    done();
                });

            });
        });
    });
    it("insert duration type field inside object", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }

            var updates = [
                {$collection:{"collection":"tasks", fields:[
                    {field:"task", type:"string"},
                    {field:"estimatedefforts", type:"duration"},
                    {field:"progress", type:"object", fields:[
                        {field:"progress", type:"string"},
                        {field:"progresshrs", type:"duration"}
                    ]}
                ]}, $insert:[
                    {"task":"Implement UDT Module", "estimatedefforts":{"time":"5", "unit":"Hrs"}, progress:{"progress":"completed", "progresshrs":{"time":"5", "unit":"Hrs"}}}
                ]}
            ];
            db.batchUpdateById(updates, function (err, result) {
                if (err) {
                    done(err);
                    return;
                }
                db.query({$collection:"tasks", $sort:{country:1}}, function (err, tasks) {
                    if (err) {
                        done(err);
                        return;
                    }
                    expect(tasks.result).to.have.length(1);
                    expect(tasks.result[0].estimatedefforts.time).to.eql(5);
                    expect(tasks.result[0].estimatedefforts.unit).to.eql("Hrs");
                    expect(tasks.result[0].estimatedefforts.convertedvalue).to.eql(300);

                    expect(tasks.result[0].progress.progresshrs.time).to.eql(5);
                    expect(tasks.result[0].progress.progresshrs.unit).to.eql("Hrs");
                    expect(tasks.result[0].progress.progresshrs.convertedvalue).to.eql(300);
                    done();
                });
            });
        });
    });
    it("insert duration type field inside array", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }

            var updates = [
                {$collection:{"collection":"tasks", fields:[
                    {field:"task", type:"string"},
                    {field:"estimatedefforts", type:"duration"},
                    {field:"progress", type:"object", multiple:true, fields:[
                        {field:"progress", type:"string"},
                        {field:"progresshrs", type:"duration"}
                    ]}
                ]}, $insert:[
                    {"task":"Implement UDT Module", "estimatedefforts":{"time":"5", "unit":"Hrs"}, progress:[
                        {"progress":"completed", "progresshrs":{"time":"1", "unit":"Hrs"}},
                        {progress:"pending", progresshrs:{"time":"4", "unit":"Days"}}
                    ]}
                ]}
            ];
            db.batchUpdateById(updates, function (err, result) {
                if (err) {
                    done(err);
                    return;
                }
                db.query({$collection:"tasks", $sort:{country:1}}, function (err, tasks) {
                    if (err) {
                        done(err);
                        return;
                    }
                    expect(tasks.result).to.have.length(1);
                    expect(tasks.result[0].estimatedefforts.time).to.eql(5);
                    expect(tasks.result[0].estimatedefforts.unit).to.eql("Hrs");
                    expect(tasks.result[0].estimatedefforts.convertedvalue).to.eql(300);

                    expect(tasks.result[0].progress[0].progresshrs.time).to.eql(1);
                    expect(tasks.result[0].progress[0].progresshrs.unit).to.eql("Hrs");
                    expect(tasks.result[0].progress[0].progresshrs.convertedvalue).to.eql(60);

                    expect(tasks.result[0].progress[1].progresshrs.time).to.eql(4);
                    expect(tasks.result[0].progress[1].progresshrs.unit).to.eql("Days");
                    expect(tasks.result[0].progress[1].progresshrs.convertedvalue).to.eql(1920);


                    done();
                });
            });
        });
    });
    it("aggregate query", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {$collection:{"collection":"tasks", fields:[
                    {field:"task", type:"string"},
                    {field:"estimatedefforts", type:"duration"}
                ]}, $insert:[
                    {"task":"Task 0", priority:5, "estimatedefforts":{"time":"5", "unit":"Hrs"}},
                    {"task":"Task1", "estimatedefforts":{"time":"15", "unit":"Hrs"}},
                    {"task":"Task2", "estimatedefforts":{"time":"35", "unit":"Hrs"}}  ,
                    {"task":"Task3", "estimatedefforts":{"time":"53", "unit":"Hrs"}}   ,
                    {"task":"Task4", "estimatedefforts":{"time":"50", "unit":"Hrs"}}   ,
                    {"task":"Task5", "estimatedefforts":{"time":"3", "unit":"Hrs"}}   ,
                    {"task":"Task6", "estimatedefforts":{"time":"2", "unit":"Hrs"}}
                ]}
            ];
            db.batchUpdateById(updates, function (err, data) {
                if (err) {
                    done(err);
                    return;
                }
                var aggregateQuery = {$collection:{collection:"tasks", fields:[
                    {field:"task", type:"string"},
                    {field:"estimatedefforts", type:"duration"}
                ]}, $group:{ _id:null, totalefforts:{$sum:"$estimatedefforts"}}};
                db.query(aggregateQuery, function (err, result) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log("result>>>>>>>>>." + JSON.stringify(result));
                    expect(result.result).to.have.length(1);
                    expect(result.result[0].totalefforts.time).to.eql(163);
                    done();
                });
            });
        });
    });
    it("aggregate query case 2", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {$collection:{"collection":"tasks", fields:[
                    {field:"task", type:"string"},
                    {field:"estimatedefforts", type:"duration"}
                ]}, $insert:[
                    {"task":"Task0", "estimatedefforts":{"time":"5", "unit":"Hrs"}},
                    {"task":"Task1", "estimatedefforts":{"time":"15", "unit":"Hrs"}},
                    {"task":"Task0", "estimatedefforts":{"time":"35", "unit":"Hrs"}}  ,
                    {"task":"Task1", "estimatedefforts":{"time":"53", "unit":"Hrs"}}   ,
                    {"task":"Task0", "estimatedefforts":{"time":"50", "unit":"Hrs"}}   ,
                    {"task":"Task1", "estimatedefforts":{"time":"3", "unit":"Minutes"}}   ,
                    {"task":"Task0", "estimatedefforts":{"time":"2", "unit":"Minutes"}}
                ]}
            ];
            db.batchUpdateById(updates, function (err, data) {
                if (err) {
                    done(err);
                    return;
                }
                var aggregateQuery = {$collection:{collection:"tasks", fields:[
                    {field:"task", type:"string"},
                    {field:"estimatedefforts", type:"duration"}
                ]}, $group:{ _id:{"task":"$task"}, totalefforts:{$sum:"$estimatedefforts"}}};
                db.query(aggregateQuery, function (err, result) {
                    if (err) {
                        done(err);
                        return;
                    }
                    expect(result.result).to.have.length(2);
                    expect(result.result[0]._id.task).to.eql("Task1");
                    expect(result.result[0].totalefforts.time).to.eql(68.05);
                    expect(result.result[1]._id.task).to.eql("Task0");
                    expect(result.result[1].totalefforts.time).to.eql(90.03333333333333);
                    done();
                });
            });
        });
    });
    it("aggregate query case 3", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {$collection:{"collection":"tasks", fields:[
                    {field:"task", type:"string"},
                    {field:"estimatedefforts", type:"duration"},
                    {field:"progress", type:"object", multiple:true, fields:[
                        {field:"progresshours", type:"duration"}
                    ]}
                ]}, $insert:[
                    {"task":"Task0", "estimatedefforts":{"time":"5", "unit":"Hrs"}, progress:[
                        {"progresshours":{"time":"2", unit:"Hrs"}},
                        {"progresshours":{"time":"3", unit:"Hrs"}},
                        {"progresshours":{"time":"5", unit:"Hrs"}}
                    ]},
                    {"task":"Task1", "estimatedefforts":{"time":"15", "unit":"Hrs"}, progress:[
                        {"progresshours":{"time":"2", unit:"Hrs"}},
                        {"progresshours":{"time":"3", unit:"Hrs"}},
                        {"progresshours":{"time":"5", unit:"Hrs"}}
                    ]},
                    {"task":"Task0", "estimatedefforts":{"time":"35", "unit":"Hrs"}, progress:[
                        {"progresshours":{"time":"2", unit:"Hrs"}},
                        {"progresshours":{"time":"3", unit:"Hrs"}},
                        {"progresshours":{"time":"5", unit:"Hrs"}}
                    ]}  ,
                    {"task":"Task1", "estimatedefforts":{"time":"53", "unit":"Hrs"}, progress:[
                        {"progresshours":{"time":"2", unit:"Hrs"}},
                        {"progresshours":{"time":"3", unit:"Hrs"}},
                        {"progresshours":{"time":"5", unit:"Hrs"}}
                    ]}   ,
                    {"task":"Task0", "estimatedefforts":{"time":"50", "unit":"Hrs"}, progress:[
                        {"progresshours":{"time":"2", unit:"Hrs"}},
                        {"progresshours":{"time":"5", unit:"Hrs"}},
                        {"progresshours":{"time":"3", unit:"Hrs"}}
                    ]}   ,
                    {"task":"Task1", "estimatedefforts":{"time":"3", "unit":"Minutes"}, progress:[
                        {"progresshours":{"time":"2", unit:"Hrs"}},
                        {"progresshours":{"time":"3", unit:"Hrs"}},
                        {"progresshours":{"time":"5", unit:"Hrs"}}
                    ]}   ,
                    {"task":"Task0", "estimatedefforts":{"time":"2", "unit":"Minutes"}, progress:[
                        {"progresshours":{"time":"2", unit:"Hrs"}},
                        {"progresshours":{"time":"3", unit:"Hrs"}},
                        {"progresshours":{"time":"5", unit:"Hrs"}}
                    ]}
                ]}
            ];
            db.batchUpdateById(updates, function (err, data) {
                if (err) {
                    done(err);
                    return;
                }
                var aggregateQuery = {$collection:{collection:"tasks", fields:[
                    {field:"task", type:"string"},
                    {field:"estimatedefforts", type:"duration"},
                    {field:"progress", type:"object", multiple:true, fields:[
                        {field:"progresshours", type:"duration"}
                    ]}
                ]}, $unwind:["progress"], $group:{ _id:{"task":"$task"}, totalefforts:{$sum:"$progress.progresshours"}}};
                db.query(aggregateQuery, function (err, result) {
                    if (err) {
                        done(err);
                        return;
                    }
                    expect(result.result).to.have.length(2);
                    expect(result.result[0]._id.task).to.eql("Task1");
                    expect(result.result[0].totalefforts.time).to.eql(30);
                    expect(result.result[1]._id.task).to.eql("Task0");
                    expect(result.result[1].totalefforts.time).to.eql(40);
                    done();
                });
            });
        });
    });
    // currency test cases

    it("insert currency type field", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }

            var updates = [
                {$collection:{"collection":"products", fields:[
                    {field:"name", type:"string"},
                    {field:"cost", type:"currency"}
                ]}, $insert:[
                    {"product":"personal computer", "cost":{"amount":"50000", "type":{$query:{"currency":"INR"}}}}
                ]}
            ]
            db.batchUpdateById(updates, function (err, result) {
                if (err) {
                    done(err);
                    return;
                }
                db.query({$collection:"products", $sort:{country:1}}, function (err, products) {
                    if (err) {
                        done(err);
                        return;
                    }
                    expect(products.result).to.have.length(1);
                    expect(products.result[0].cost.amount).to.eql(50000);
                    expect(products.result[0].cost.type.currency).to.eql("INR");
                    done();
                });

            });
        });
    });
    it("insert currency type field inside object", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }

            var updates = [
                {$collection:{"collection":"products", fields:[
                    {field:"name", type:"string"},
                    {field:"cost", type:"currency"},
                    {field:"dealers", type:"object", fields:[
                        {field:"location", type:"string"},
                        {field:"dealprice", type:"currency"}
                    ]}
                ]}, $insert:[
                    {"product":"personal computer", "cost":{"amount":"50000", "type":{$query:{"currency":"INR"}}}, dealers:{"location":"delhi", dealprice:{"amount":"51000", type:{$query:{"currency":"INR"}}}}}
                ]}
            ]
            db.batchUpdateById(updates, function (err, result) {
                if (err) {
                    done(err);
                    return;
                }
                db.query({$collection:{"collection":"products", fields:[
                    {field:"name", type:"string"},
                    {field:"cost", type:"currency"},
                    {field:"dealers", type:"object", fields:[
                        {field:"location", type:"string"},
                        {field:"dealprice", type:"currency"}
                    ]}
                ]}, $sort:{country:1}}, function (err, products) {
                    if (err) {
                        done(err);
                        return;
                    }
                    expect(products.result).to.have.length(1);
                    expect(products.result[0].cost.amount).to.eql(50000);
                    expect(products.result[0].cost.type.currency).to.eql("INR");
                    expect(products.result[0].dealers.dealprice.amount).to.eql(51000);
                    expect(products.result[0].dealers.dealprice.type.currency).to.eql("INR");
                    done();
                });

            });
        });
    });
    it("insert currency type field inside nested array", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }

            var updates = [
                {$collection:{"collection":"products", fields:[
                    {field:"name", type:"string"},
                    {field:"cost", type:"currency"},
                    {field:"dealers", type:"object", multiple:true, fields:[
                        {field:"location", type:"string"},
                        {field:"dealprice", type:"currency"},
                        {field:"coupons", type:"object", multiple:true, fields:[
                            {field:"code", type:"string"},
                            {field:"price", type:"currency"}
                        ]}
                    ]}
                ]}, $insert:[
                    {"product":"personal computer", "cost":{"amount":"50000", "type":{$query:{"currency":"INR"}}}, dealers:[
                        {"location":"delhi", dealprice:{"amount":"51000", type:{$query:{"currency":"INR"}}}, "coupons":[
                            {"code":"12DFt21", "price":{"amount":"200", "type":{"$query":{"currency":"DOLLAR"}}}},
                            {"code":"324RTSE", "price":{"amount":"100", "type":{"$query":{"currency":"YEN"}}}}
                        ]},
                        {"location":"chandigarh", dealprice:{"amount":"49000", type:{$query:{"currency":"INR"}}}, "coupons":[
                            {"code":"9045jkret", "price":{"amount":"50", "type":{"$query":{"currency":"DOLLAR"}}}},
                            {"code":"45qh45r4", "price":{"amount":"20", "type":{"$query":{"currency":"YEN"}}}}
                        ]}
                    ]}
                ]}
            ]
            db.batchUpdateById(updates, function (err, result) {
                if (err) {
                    done(err);
                    return;
                }
                db.query({$collection:{"collection":"products", fields:[
                    {field:"name", type:"string"},
                    {field:"cost", type:"currency"},
                    {field:"dealers", type:"object", multiple:true, fields:[
                        {field:"location", type:"string"},
                        {field:"dealprice", type:"currency"},
                        {field:"coupons", type:"object", multiple:true, fields:[
                            {field:"code", type:"string"},
                            {field:"price", type:"currency"}
                        ]}
                    ]}
                ]}, $sort:{country:1}}, function (err, products) {
                    if (err) {
                        done(err);
                        return;
                    }
                    expect(products.result).to.have.length(1);
                    expect(products.result[0].cost.amount).to.eql(50000);
                    expect(products.result[0].cost.type.currency).to.eql("INR");

                    expect(products.result[0].dealers[0].location).to.eql("delhi");
                    expect(products.result[0].dealers[0].dealprice.amount).to.eql(51000);
                    expect(products.result[0].dealers[0].dealprice.type.currency).to.eql("INR");
                    expect(products.result[0].dealers[0].coupons[0].code).to.eql("12DFt21");
                    expect(products.result[0].dealers[0].coupons[0].price.amount).to.eql(200);
                    expect(products.result[0].dealers[0].coupons[0].price.type.currency).to.eql("DOLLAR");
                    expect(products.result[0].dealers[0].coupons[1].code).to.eql("324RTSE");
                    expect(products.result[0].dealers[0].coupons[1].price.amount).to.eql(100);
                    expect(products.result[0].dealers[0].coupons[1].price.type.currency).to.eql("YEN");

                    expect(products.result[0].dealers[1].location).to.eql("chandigarh");
                    expect(products.result[0].dealers[1].dealprice.amount).to.eql(49000);
                    expect(products.result[0].dealers[1].dealprice.type.currency).to.eql("INR");
                    expect(products.result[0].dealers[1].coupons[0].code).to.eql("9045jkret");
                    expect(products.result[0].dealers[1].coupons[0].price.amount).to.eql(50);
                    expect(products.result[0].dealers[1].coupons[0].price.type.currency).to.eql("DOLLAR");
                    expect(products.result[0].dealers[1].coupons[1].code).to.eql("45qh45r4");
                    expect(products.result[0].dealers[1].coupons[1].price.amount).to.eql(20);
                    expect(products.result[0].dealers[1].coupons[1].price.type.currency).to.eql("YEN");
                    done();
                });

            });
        });
    });

    it("update currency type field", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {$collection:{"collection":"products", fields:[
                    {field:"name", type:"string"},
                    {field:"cost", type:"currency"}
                ]}, $insert:[
                    {_id:1, "product":"personal computer", "cost":{"amount":"50000", "type":{$query:{"currency":"INR"}}}}
                ]}
            ]
            db.batchUpdateById(updates, function (err, result) {
                if (err) {
                    done(err);
                    return;
                }
                db.query({$collection:"products", $sort:{country:1}}, function (err, products) {
                    if (err) {
                        done(err);
                        return;
                    }
                    expect(products.result).to.have.length(1);
                    expect(products.result[0].cost.amount).to.eql(50000);
                    expect(products.result[0].cost.type.currency).to.eql("INR");
                    var newUpdates = [
                        {$collection:{"collection":"products", fields:[
                            {field:"name", type:"string"},
                            {field:"cost", type:"currency"}
                        ]}, $update:[
                            {_id:1, $set:{"cost":{ $set:{"amount":"250000"}}}}
                        ]}
                    ]
                    db.batchUpdateById(newUpdates, function (err, result) {
                        if (err) {
                            done(err);
                            return;
                        }
                        db.query({$collection:"products", $sort:{country:1}}, function (err, products) {
                            if (err) {
                                done(err);
                                return;
                            }
                            expect(products.result).to.have.length(1);
                            expect(products.result[0].cost.amount).to.eql(250000);
                            expect(products.result[0].cost.type.currency).to.eql("INR");
                            done();
                        });
                    });


                });

            });
        });
    })
    it("update duration type field", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {$collection:{"collection":"tasks", fields:[
                    {field:"task", type:"string"},
                    {field:"estimatedefforts", type:"duration"}
                ]}, $insert:[
                    {_id:1, "task":"Implement UDT Module", "estimatedefforts":{"time":"5", "unit":"Hrs"}}
                ]}
            ]
            db.batchUpdateById(updates, function (err, result) {
                if (err) {
                    done(err);
                    return;
                }
                db.query({$collection:"tasks"}, function (err, tasks) {
                    if (err) {
                        done(err);
                        return;
                    }
                    expect(tasks.result).to.have.length(1);
                    expect(tasks.result[0].estimatedefforts.time).to.eql(5);
                    expect(tasks.result[0].estimatedefforts.unit).to.eql("Hrs");
                    expect(tasks.result[0].estimatedefforts.convertedvalue).to.eql(300);
                    var newUpdates = [
                        {$collection:{"collection":"tasks", fields:[
                            {field:"task", type:"string"},
                            {field:"estimatedefforts", type:"duration"}
                        ]}, $update:[
                            {_id:1, $set:{ "estimatedefforts":{$set:{"time":"10"}}}}
                        ]}
                    ]
                    db.batchUpdateById(newUpdates, function (err, result) {
                        if (err) {
                            done(err);
                            return;
                        }
                        db.query({$collection:"tasks"}, function (err, tasks) {
                            if (err) {
                                done(err);
                                return;
                            }
                            console.log("tasks after updation>>>" + JSON.stringify(tasks));
                            expect(tasks.result).to.have.length(1);
                            expect(tasks.result[0].estimatedefforts.time).to.eql(10);
                            expect(tasks.result[0].estimatedefforts.unit).to.eql("Hrs");
                            expect(tasks.result[0].estimatedefforts.convertedvalue).to.eql(600);
                            done();
                        });
                    });

                });

            });
        });
    })


    it("update duration type field override object", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {$collection: {"collection": "tasks", fields: [
                    {field: "task", type: "string"},
                    {field: "estimatedefforts", type: "duration"}
                ]}, $insert: [
                    {_id: 1, "task": "Implement UDT Module", "estimatedefforts": {"time": "5", "unit": "Hrs"}}
                ]}
            ]
            db.batchUpdateById(updates, function (err, result) {
                if (err) {
                    done(err);
                    return;
                }
                db.query({$collection: "tasks"}, function (err, tasks) {
                    if (err) {
                        done(err);
                        return;
                    }
                    expect(tasks.result).to.have.length(1);
                    expect(tasks.result[0].estimatedefforts.time).to.eql(5);
                    expect(tasks.result[0].estimatedefforts.unit).to.eql("Hrs");
                    expect(tasks.result[0].estimatedefforts.convertedvalue).to.eql(300);
                    var newUpdates = [
                        {$collection: {"collection": "tasks", fields: [
                            {field: "task", type: "string"},
                            {field: "estimatedefforts", type: "duration"}
                        ]}, $update: [
                            {_id: 1, $set: {"task": "testing", "estimatedefforts": {"time": "10", unit: "Hrs"}}}
                        ]}
                    ]
                    db.batchUpdateById(newUpdates, function (err, result) {
                        if (err) {
                            done(err);
                            return;
                        }
                        db.query({$collection: "tasks"}, function (err, tasks) {
                            if (err) {
                                done(err);
                                return;
                            }
                            console.log("tasks after updation>>>" + JSON.stringify(tasks));
                            expect(tasks.result).to.have.length(1);
                            expect(tasks.result[0].estimatedefforts.time).to.eql(10);
                            expect(tasks.result[0].estimatedefforts.unit).to.eql("Hrs");
                            expect(tasks.result[0].estimatedefforts.convertedvalue).to.eql(600);
                            done();
                        });
                    });

                });

            });
        });
    })

    it("insert file type field", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }

            var updates = [
                {$collection:{"collection":"products", fields:[
                    {field:"name", type:"string"},
                    {field:"file", type:"file"}
                ]}, $insert:[
                    {"product":"personal computer", "file":{"key":"111222", "name":"abc"}}
                ]}
            ]
            db.batchUpdateById(updates, function (err, result) {
                if (err) {
                    done(err);
                    return;
                }
                db.query({$collection:"products", $sort:{country:1}}, function (err, products) {
                    if (err) {
                        done(err);
                        return;
                    }

                    expect(products.result).to.have.length(1);
                    expect(products.result[0].file.key).to.eql("111222");
                    expect(products.result[0].file.name).to.eql("abc");
                    done();
                });

            });
        });
    });
    it("insert file type field inside object", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }

            var updates = [
                {$collection:{"collection":"products", fields:[
                    {field:"name", type:"string"},
                    {field:"file", type:"file"},
                    {field:"dealers", type:"object", fields:[
                        {field:"location", type:"string"},
                        {field:"file", type:"file"}
                    ]}
                ]}, $insert:[
                    {"product":"personal computer", "file":{"key":"1111", "name":"abc"}, dealers:{"location":"delhi", "file":{"key":"2222", "name":"xyz"}}}
                ]}
            ]
            db.batchUpdateById(updates, function (err, result) {
                if (err) {
                    done(err);
                    return;
                }
                db.query({$collection:{"collection":"products", fields:[
                    {field:"name", type:"string"},
                    {field:"file", type:"file"},
                    {field:"dealers", type:"object", fields:[
                        {field:"location", type:"string"},
                        {field:"file", type:"file"}
                    ]}
                ]}, $sort:{country:1}}, function (err, products) {
                    if (err) {
                        done(err);
                        return;
                    }
                    expect(products.result).to.have.length(1);
                    expect(products.result[0].file.key).to.eql("1111");
                    expect(products.result[0].file.name).to.eql("abc");
                    expect(products.result[0].dealers.file.key).to.eql("2222");
                    expect(products.result[0].dealers.file.name).to.eql("xyz");
                    done();
                });

            });
        });
    });
    it("insert file type field inside nested array", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }

            var updates = [
                {$collection:{"collection":"products", fields:[
                    {field:"name", type:"string"},
                    {field:"file", type:"file"},
                    {field:"dealers", type:"object", multiple:true, fields:[
                        {field:"location", type:"string"},
                        {field:"file", type:"file"},
                        {field:"coupons", type:"object", multiple:true, fields:[
                            {field:"code", type:"string"},
                            {field:"file", type:"file"}
                        ]}
                    ]}
                ]}, $insert:[
                    {"product":"personal computer", "file":{"key":"1111", "name":"crocodile"}, dealers:[
                        {"location":"delhi", "file":{"key":"2211", "name":"gorilla"}, "coupons":[
                            {"code":"12DFt21", "file":{"key":"3111", "name":"pug"}},
                            {"code":"324RTSE", "file":{"key":"3122", "name":"dalmatian"}}
                        ]},
                        {"location":"chandigarh", "file":{"key":"2222", "name":"monkey"}, "coupons":[
                            {"code":"9045jkret", "file":{"key":"3211", "name":"pitbull"}},
                            {"code":"45qh45r4", "file":{"key":"3222", "name":"husky"}}
                        ]}
                    ]}
                ]}
            ]
            db.batchUpdateById(updates, function (err, result) {
                if (err) {
                    done(err);
                    return;
                }
                db.query({$collection:{"collection":"products", fields:[
                    {field:"name", type:"string"},
                    {field:"file1", type:"file"},
                    {field:"dealers", type:"object", multiple:true, fields:[
                        {field:"location", type:"string"},
                        {field:"file2", type:"file"},
                        {field:"coupons", type:"object", multiple:true, fields:[
                            {field:"code", type:"string"},
                            {field:"file3", type:"file"}
                        ]}
                    ]}
                ]}, $sort:{country:1}}, function (err, products) {
                    if (err) {
                        done(err);
                        return;
                    }
                    expect(products.result).to.have.length(1);
                    expect(products.result[0].file.key).to.eql("1111");
                    expect(products.result[0].file.name).to.eql("crocodile");

                    expect(products.result[0].dealers[0].location).to.eql("delhi");
                    expect(products.result[0].dealers[0].file.key).to.eql("2211");
                    expect(products.result[0].dealers[0].file.name).to.eql("gorilla");
                    expect(products.result[0].dealers[0].coupons[0].code).to.eql("12DFt21");
                    expect(products.result[0].dealers[0].coupons[0].file.key).to.eql("3111");
                    expect(products.result[0].dealers[0].coupons[0].file.name).to.eql("pug");
                    expect(products.result[0].dealers[0].coupons[1].code).to.eql("324RTSE");
                    expect(products.result[0].dealers[0].coupons[1].file.key).to.eql("3122");
                    expect(products.result[0].dealers[0].coupons[1].file.name).to.eql("dalmatian");

                    expect(products.result[0].dealers[1].location).to.eql("chandigarh");
                    expect(products.result[0].dealers[1].file.key).to.eql("2222");
                    expect(products.result[0].dealers[1].file.name).to.eql("monkey");
                    expect(products.result[0].dealers[1].coupons[0].code).to.eql("9045jkret");
                    expect(products.result[0].dealers[1].coupons[0].file.key).to.eql("3211");
                    expect(products.result[0].dealers[1].coupons[0].file.name).to.eql("pitbull");
                    expect(products.result[0].dealers[1].coupons[1].code).to.eql("45qh45r4");
                    expect(products.result[0].dealers[1].coupons[1].file.key).to.eql("3222");
                    expect(products.result[0].dealers[1].coupons[1].file.name).to.eql("husky");
                    done();
                });

            });
        });
    });
    it("update file type field", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {$collection:{"collection":"products", fields:[
                    {field:"name", type:"string"},
                    {field:"file", type:"file"}
                ]}, $insert:[
                    {_id:1, "product":"personal computer", "file":{"key":"1111", "name":"Gorillaz"}}
                ]}
            ]
            db.batchUpdateById(updates, function (err, result) {
                if (err) {
                    done(err);
                    return;
                }
                db.query({$collection:"products", $sort:{country:1}}, function (err, products) {
                    if (err) {
                        done(err);
                        return;
                    }
                    expect(products.result).to.have.length(1);
                    expect(products.result[0].file.key).to.eql("1111");
                    expect(products.result[0].file.name).to.eql("Gorillaz");
                    var newUpdates = [
                        {$collection:{"collection":"products", fields:[
                            {field:"name", type:"string"},
                            {field:"file", type:"file"}
                        ]}, $update:[
                            {_id:1, $set:{"file":{ $set:{"name":"GnR", key:"2222"}}}}
                        ]}
                    ]
                    db.batchUpdateById(newUpdates, function (err, result) {
                        if (err) {
                            done(err);
                            return;
                        }
                        db.query({$collection:"products", $sort:{country:1}}, function (err, products) {
                            if (err) {
                                done(err);
                                return;
                            }
                            expect(products.result).to.have.length(1);
                            expect(products.result[0].file.key).to.eql("2222");
                            expect(products.result[0].file.name).to.eql("GnR");
                            done();
                        });
                    });


                });

            });
        });
    })

    it("update case of duration nochange error", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var inserts = [
                {$collection: {collection: "employees", fields: [
                    {field: "cost", type: "currency"}
                ]}, $insert: [
                    { _id: 1, "cost": {amount: "5", type: {$query: {currency: "INR"}}}}
                ]
                }
            ]
            db.batchUpdateById(inserts, function (err) {
                if (err) {
                    done(err);
                    return;
                }
                db.query({$collection: "employees"}, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log("data after insert>>>>>>>" + JSON.stringify(data));
                    expect(data.result).to.have.length(1);
                    expect(data.result[0].cost.amount).to.eql(5);
                    expect(data.result[0].cost.type.currency).to.eql("INR");
                    var updates = [
                        {"$update": [
                            {"$set": {"cost": {"$set": {"amount": 1, "type": {"currency": "INR", "_id": "5368d8f391b99ff014000209"}}}}, "_id": 1}
                        ], "$collection": "employees"}
                    ];
                    db.batchUpdateById(updates, function (err) {
                        if (err) {
                            done(err);
                            return;
                        }
                        db.query({$collection: "employees"}, function (err, data) {
                            if (err) {
                                done(err);
                                return;
                            }
                            console.log("data after update" + JSON.stringify(data));
                            expect(data.result).to.have.length(1);
                            expect(data.result[0].cost.amount).to.eql(1);
                            expect(data.result[0].cost.type.currency).to.eql("INR");
                            done();
                        });
                    });
                })

            })

        });
    })


});



