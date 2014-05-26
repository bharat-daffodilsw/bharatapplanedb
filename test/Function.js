/**
 *  mocha --recursive --timeout 150000 -g "Function testcase" --reporter spec
 */
var expect = require('chai').expect;
var ApplaneDB = require("../lib/DB.js");
var Config = require("./config.js");
var NorthwindDb = require('./NorthwindDb.js');
var OPTIONS = {username:"Sachin", password:"1234"};

describe("Function testcase", function () {

    afterEach(function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
            db.dropDatabase(function (err) {
                done(err);
            })
        });
    })

    it("resolve simple filter with parameters", function (done) {
        //cash account allready esists
        ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
            if (err) {
                done(err);
                return;
            }


            var batchUpdates = [
                {
                    $collection:"persons",
                    $insert:[
                        {name:"Pawan", age:24, dob:"10-10-1985"},
                        {name:"Sachin", age:24, dob:"02-04-1989"}
                    ]

                }
            ];

            db.batchUpdateById(batchUpdates, function (err, res) {
                if (err) {
                    done(err);
                    return;
                }
                var queryToGetData = {
                    $collection:"persons",
                    $filter:{name:"$name"},
                    $parameters:{name:"Sachin"},
                    $sort:{name:1}
                };
                db.query(queryToGetData, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log("data>>>" + JSON.stringify(data));
                    expect(data.result).to.have.length(1);
                    expect(data.result[0].name).to.eql("Sachin");
                    done();
                })
            })
        })
    })

    it("resolve simple filter with function", function (done) {
        //cash account allready esists
        ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
            if (err) {
                done(err);
                return;
            }


            var batchUpdates = [
                {
                    $collection:"pl.functions",
                    $insert:[
                        {name:"test", code:"tests", source:"ApplaneDB/test/Function.js"}
                    ]

                },
                {
                    $collection:"persons",
                    $insert:[
                        {name:"Pawan", age:24, dob:"10-10-1985"},
                        {name:"Sachin", age:24, dob:"02-04-1989"}
                    ]

                }
            ];

            db.batchUpdateById(batchUpdates, function (err, res) {
                if (err) {
                    done(err);
                    return;
                }
                var queryToGetData = {
                    $collection:"persons",
                    $filter:{name:{$function:"test"}},
//                    $parameters:{name:"Sachin"},
                    $sort:{name:1}
                };
                db.query(queryToGetData, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log("data>>>" + JSON.stringify(data));
                    expect(data.result).to.have.length(1);
                    expect(data.result[0].name).to.eql("Pawan");
                    done();
                })
            })
        })
    })

    it("resolve simple filter with Object", function (done) {
        //cash account allready esists
        ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
            if (err) {
                done(err);
                return;
            }


            var batchUpdates = [
                {
                    $collection:"pl.functions",
                    $insert:[
                        {name:"test", code:"testarg", source:"ApplaneDB/test/Function.js"}
                    ]

                },
                {
                    $collection:"persons",
                    $insert:[
                        {name:"Pawan", age:24, dob:"10-10-1985"},
                        {name:"Sachin", age:24, dob:"02-04-1989"}
                    ]

                }
            ];

            db.batchUpdateById(batchUpdates, function (err, res) {
                if (err) {
                    done(err);
                    return;
                }
                var queryToGetData = {
                    $collection:"persons",
                    $filter:{name:{$function:{"test":{name:"$name"}}}},
                    $parameters:{name:"Sachin"},
                    $sort:{name:1}
                };
                db.query(queryToGetData, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log("data>>>" + JSON.stringify(data));
                    expect(data.result).to.have.length(1);
                    expect(data.result[0].name).to.eql("Sachin");
                    done();
                })
            })
            var expectedResult = {"result":[
                {"name":"Sachin", "age":24, "dob":"02-04-1989", "_id":"534fe7e73aec32dc18e971a6"}
            ]};
        })
    })

    it("resolve simple filter with date", function (done) {
        //cash account allready esists
        ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
            if (err) {
                done(err);
                return;
            }


            var batchUpdates = [
                {
                    $collection:"pl.functions",
                    $insert:[
                        {name:"CurrentDate", code:"CurrentDate", source:"ApplaneDB/test/Function.js"}
                    ]

                },
                {
                    $collection:{collection:"persons", fields:[
                        {"field":"dob", type:"date"}
                    ]},
                    $insert:[
                        {name:"Pawan", age:24, dob:"10-10-1985"},
                        {name:"Sachin", age:24, dob:"02-04-1989"},
                        {name:"Manjeet", age:24, dob:"02-04-1980"} ,
                        {name:"Rohit", age:24, dob:"02-04-1978"}
                    ]

                }
            ];

            db.batchUpdateById(batchUpdates, function (err, res) {
                if (err) {
                    done(err);
                    return;
                }
                var queryToGetData = {
                    $collection:{collection:"persons", fields:[
                        {"field":"dob", type:"date"}
                    ]},
                    $filter:{dob:{$lt:{$function:"CurrentDate"}, $gt:"01-01-1980"}, name:{$in:["Sachin", "Rohit", "Manjeet"]}},
                    $parameters:{name:"Sachin"},
                    $sort:{name:1}
                };
                db.query(queryToGetData, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log("data>>>" + JSON.stringify(data));
                    expect(data.result).to.have.length(2);
                    expect(data.result[0].name).to.eql("Manjeet");
                    expect(data.result[1].name).to.eql("Sachin");
                    done();
                })
            })
        })
    })

    it("resolve simple filter with CurrentDate system functions", function (done) {
        //cash account allready esists
        ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
            if (err) {
                done(err);
                return;
            }


            var batchUpdates = [
                {
                    $collection:{collection:"persons", fields:[
                        {"field":"dob", type:"date"}
                    ]},
                    $insert:[
                        {name:"Pawan", age:24, dob:"10-10-1985"},
                        {name:"Sachin", age:24, dob:"02-04-1989"},
                        {name:"Manjeet", age:24, dob:"02-04-1980"} ,
                        {name:"Rohit", age:24, dob:"02-04-1978"}
                    ]

                }
            ];

            db.batchUpdateById(batchUpdates, function (err, res) {
                if (err) {
                    done(err);
                    return;
                }
                var queryToGetData = {
                    $collection:{collection:"persons", fields:[
                        {"field":"dob", type:"date"}
                    ]},
                    $filter:{dob:{$lt:{$function:"_CurrentDate"}, $gt:"01-01-1980"}, name:{$in:["Sachin", "Rohit", "Manjeet"]}},
                    $parameters:{name:"Sachin"},
                    $sort:{name:1}
                };
                db.query(queryToGetData, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log("data>>>" + JSON.stringify(data));
                    expect(data.result).to.have.length(2);
                    expect(data.result[0].name).to.eql("Manjeet");
                    expect(data.result[1].name).to.eql("Sachin");
                    done();
                })
            })
        })
    })

    it("resolve simple filter with CurrentUser system functions", function (done) {
        //cash account allready esists
        ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var batchUpdates = [
                {
                    $collection:{collection:"persons", fields:[
                        {"field":"dob", type:"date"}
                    ]},
                    $insert:[
                        {name:"Pawan", age:24, dob:"10-10-1985"},
                        {name:"Sachin", age:24, dob:"02-04-1989"},
                        {name:"Manjeet", age:24, dob:"02-04-1980"} ,
                        {name:"Rohit", age:24, dob:"02-04-1978"}
                    ]

                }
            ];

            db.batchUpdateById(batchUpdates, function (err, res) {
                if (err) {
                    done(err);
                    return;
                }
                var queryToGetData = {
                    $collection:{collection:"persons", fields:[
                        {"field":"dob", type:"date"}
                    ]},
                    $filter:{name:{$function:{"_CurrentUser":{"username":1}}}},
                    $sort:{name:1}
                };
                db.query(queryToGetData, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log("data>>>" + JSON.stringify(data));
                    expect(data.result).to.have.length(1);
                    expect(data.result[0].name).to.eql("Sachin");
                    done();
                })
            })
        })
    })

    it("resolve simple filter with date function and parameters", function (done) {
        //cash account allready esists
        ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
            if (err) {
                done(err);
                return;
            }


            var batchUpdates = [
                {
                    $collection:"pl.functions",
                    $insert:[
                        {name:"CurrentDate", code:"CurrentDate", source:"ApplaneDB/test/Function.js"}
                    ]

                },
                {
                    $collection:{collection:"persons", fields:[
                        {"field":"dob", type:"date"}
                    ]},
                    $insert:[
                        {name:"Pawan", age:24, dob:"10-10-1985"},
                        {name:"Sachin", age:24, dob:"02-04-1989"},
                        {name:"Manjeet", age:24, dob:"02-04-1980"} ,
                        {name:"Rohit", age:24, dob:"02-04-1978"}
                    ]

                }
            ];

            db.batchUpdateById(batchUpdates, function (err, res) {
                if (err) {
                    done(err);
                    return;
                }
                var queryToGetData = {
                    $collection:{collection:"persons", fields:[
                        {"field":"dob", type:"date"}
                    ]},
                    $filter:{dob:{$lt:{$function:"CurrentDate"}, $gt:"$gt"}, name:{$in:["Sachin", "Rohit", "Manjeet"]}},
                    $parameters:{name:"Sachin", gt:"01-01-1980"},
                    $sort:{name:1}
                };
                db.query(queryToGetData, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log("data>>>" + JSON.stringify(data));
                    expect(data.result).to.have.length(2);
                    expect(data.result[0].name).to.eql("Manjeet");
                    expect(data.result[1].name).to.eql("Sachin");
                    done();
                })
            })
        })
    })
})

exports.tests = function (db, callback) {
    callback(null, "Pawan");
}

exports.testarg = function (parameters, db, callback) {
    callback(null, parameters.name);
}

exports.CurrentDate = function (db, callback) {
    callback(null, new Date());
}