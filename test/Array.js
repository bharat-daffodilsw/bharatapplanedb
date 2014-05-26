/**
 *
 *  mocha --recursive --timeout 150000 -g "Updatetestcase Array" --reporter spec
 *  mocha --recursive --timeout 150000 -g "simple insert in  string array" --reporter spec
 *  mocha --recursive --timeout 150000 -g "update with nested  Array inside Object" --reporter spec
 *
 *  mocha --recursive --timeout 150000 -g "All In One set,unset ,inc, override, set in object" --reporter spec
 *
 *  mocha --recursive --timeout 150000 -g "update with Array of literals" --reporter spec
 *
 *  mocha --recursive --timeout 150000 -g "update array on the basis of query" --reporter spec
 *
 *  mocha --recursive --timeout 150000 -g "update with nested  Array" --reporter spec

 *   mocha --recursive --timeout 150000 -g "nested  3 dollar updates" --reporter spec
 *
 *  mocha --recursive --timeout 150000 -g "dollar updates with single level" --reporter spec
 *
 *  mocha --recursive --timeout 150000 -g "nested dollar updates" --reporter spec
 *  mocha --recursive --timeout 150000 -g "update in nested array saturday" --reporter spec
 *
 */
var expect = require('chai').expect;
var ApplaneDB = require("../lib/DB.js");
var Config = require("./config.js");


describe("Updatetestcase Array", function () {


    afterEach(function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            db.dropDatabase(function (err) {
                done(err);
            })
        });
    })


    it("simple insert in  string array", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates =
                [
                    {$collection: "countries", $insert: [
                        {
                            country: "india", states: ["haryana", "delhi"]
                        }
                    ]}
                ];
            console.log("calling batch update by id");
            db.batchUpdateById(updates, function (err, data) {
                if (err) {
                    done(err);
                    return;
                }
                db.query({"$collection": "countries"}, function (err, result) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log("countires>>>" + JSON.stringify(result));
                    expect()
                    done();
                })
            });
        });
    })

    it("update with nested  Array inside Object", function (done) {
        var COUNTRIES = "countries";
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {$collection: COUNTRIES, $insert: [
                    {country: "India", code: "91", "states": {_id: "haryana", state: "haryana", "cities": [
                        {"_id": "hisar", "city": "hisar", "schools": [
                            {"_id": "vdjs", "school": "vdjs"},
                            {"_id": "model", "school": "model"}
                        ]},
                        {"_id": "sirsa", "city": "sirsa", "schools": [
                            {"_id": "jindal", "school": "jindal"},
                            {"_id": "modern", "school": "modern"}
                        ]},
                        {"_id": "rohtak", "city": "rohtak", "schools": [
                            {"_id": "dav", "school": "dav"},
                            {"_id": "high school", "school": "high school"}
                        ]}
                    ]}
                    }
                ]
                }
            ]
            db.batchUpdateById(updates, function (err, result) {
                if (err) {
                    done(err);
                    return;
                }
                db.query({$collection: COUNTRIES, $sort: {country: 1}}, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log(">>>>>data>>>" + JSON.stringify(data));
                    expect(data.result).to.have.length(1);
                    expect(data.result[0].states.cities).to.have.length(3);
                    expect(data.result[0].states.cities[0].schools).to.have.length(2);
                    expect(data.result[0].states.cities[1].schools).to.have.length(2);
                    var arrayUpdates = [
                        {$collection: COUNTRIES, $update: [
                            {
                                _id: data.result[0]._id,
                                $set: { "states": {$set: {state: "haryana1",
                                    "cities": {"$insert": [
                                        {"_id": "bathinda", "city": "bathinda"}
                                    ], "$delete": [
                                        {"_id": "sirsa"}
                                    ], "$update": [
                                        {"_id": "hisar",
                                            "$set": {"city": "firoza-e-hisar", "schools": {"$insert": [
                                                {"_id": "happy public school", "school": "happy public school"}
                                            ], "$delete": [
                                                {"_id": "model"}
                                            ], "$update": [
                                                {$query: {"school": "vdjs"}, "$set": {"school": "vidya devi jindal school"}}
                                            ]}}}
                                    ]   }           }}
                                }}
                        ]}
                    ]
                    db.batchUpdateById(arrayUpdates, function (err, updateResult) {
                        db.query({$collection: COUNTRIES, $sort: {country: 1}}, function (err, data) {
                            if (err) {
                                done(err);
                                return;
                            }
                            console.log("data>>>>>>>in countries table after update" + JSON.stringify(data));
                            expect(data.result).to.have.length(1);
                            expect(data.result[0].states.state).to.eql("haryana1");
                            expect(data.result[0].states.cities).to.length(3);
                            expect(data.result[0].states.cities[1].city).to.eql("firoza-e-hisar");
                            done();
                        })
                    })
                })

            })


        })


    });

    it("remove  inserts in case of insert operation", function (done) {

        var COUNTRIES = "countries";
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {$collection: COUNTRIES, $insert: [
                    {country: "India", code: "91", "states": {"$insert": [
                        {_id: "haryana", state: "haryana", cities: {"$insert": [
                            {"_id": "hisar", "city": "hisar"},
                            {"_id": "sirsa", "city": "sirsa"}
                        ]}},
                        {_id: "punjab", state: "punjab", cities: {"$insert": [
                            {"_id": "amritsar", "city": "amritsar"},
                            {"_id": "ludhiana", "city": "ludhiana"}
                        ]}}
                    ]}},
                    {country: "Pakistan", code: "91", "states": [
                        {_id: "lahore", state: "lahore", cities: {"$insert": [
                            {"_id": "jharkhand", "city": "jharkhand"},
                            {"_id": "up", "city": "up"}
                        ]}},
                        {_id: "multan", state: "multan", cities: {"$insert": [
                            {"_id": "bihar", "city": "bihar"}
                        ]}}
                    ]}
                ] }
            ]
            db.batchUpdateById(updates, function (err, result) {
                if (err) {
                    done(err);
                    return;
                }
                db.query({$collection: COUNTRIES, $sort: {country: 1}}, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log("data>>>" + JSON.stringify(data));
                    expect(data.result).to.have.length(2);
                    expect(data.result[0].states).to.have.length(2);
                    expect(data.result[0].states[0].cities).to.have.length(2);
                    expect(data.result[0].states[1].cities).to.have.length(2);
                    done();
                })

            })


        })

    });

    it("simple insert with Array", function (done) {
        var COUNTRIES = "countries";
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {$collection: COUNTRIES, $insert: [
                    {country: "India", code: "91", "states": [
                        {_id: "haryana", state: "haryana"},
                        {_id: "punjab", state: "punjab"}
                    ]},
                    {country: "USA", code: "01", "states": [
                        {_id: "newyork", state: "newyork"},
                        {_id: "canada", state: "canada"}
                    ]}

                ] }
            ]
            db.batchUpdateById(updates, function (err, result) {
                if (err) {
                    done(err);
                    return;
                }
                db.query({$collection: COUNTRIES, $sort: {country: 1}}, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log("data>>>" + JSON.stringify(data));
                    expect(data.result).to.have.length(2);
                    expect(data.result[0].states).to.have.length(2);
                    expect(data.result[1].states).to.have.length(2);
                    done();

                })

            })


        })


    })

    it("All In One set,unset ,inc, override, set in object", function (done) {
        var COUNTRIES = "countries";
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {$collection: COUNTRIES, $insert: [
                    {_id: "rohit",
                        name: "rohit",
                        status: "single",
                        age: 30,
                        address: {line1: "zz", line2: "xx", city: "hansi", state: "haryana", score: 9 },
                        gameinfo: {_id: "cricket", "game": "cricket"},
                        schools: [
                            {_id: "pcsd", school: "pcsd", code: "91", status: "private", score: 100},
                            {_id: "sdm", school: "sdm", code: "92", status: "public", score: 98},
                            {_id: "psb", school: "psb", code: "93", status: "public", score: 90}
                        ],
                        countries: [
                            {_id: "india", country: "india", code: "91", states: [
                                {_id: "haryana", state: "haryana", code: "10", cities: [
                                    {_id: "hisar", city: "hisar", code: "1662"},
                                    {_id: "sirsa", city: "sirsa", code: "1664"},
                                    {_id: "rohtak", city: "rohtak", code: "1262"},
                                    {_id: "ggn", city: "ggn", code: "124"}
                                ]}
                            ]},
                            {_id: "USA", country: "USA", code: "0011", states: [
                                {_id: "new york", state: "new york", code: "12", cities: [
                                    {_id: "manhattan", city: "manhattan", code: "1662"},
                                    {_id: "brooklyn", city: "brooklyn", code: "1664"}
                                ]},
                                {_id: "washington", state: "washington", code: "132", cities: [
                                    {_id: "florida", city: "florida", code: "1754"},
                                    {"_id": "dc", city: "dc1", code: 111}
                                ]}
                            ]}
                        ],
                        languages: [
                            {_id: "hindi", language: "hindi"},
                            {_id: "urdu", language: "urdu"}
                        ],
                        score: 10
                    }
                ]}
            ]
            db.batchUpdateById(updates, function (err, result) {
                if (err) {
                    done(err);
                    return;
                }
                db.query({$collection: COUNTRIES, $sort: {country: 1}}, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log("data>>>" + JSON.stringify(data));
                    expect(data.result).to.have.length(1);
                    expect(data.result[0].address.line1).to.eql("zz");
                    expect(data.result[0].address.line2).to.eql("xx");
                    expect(data.result[0].address.city).to.eql("hansi");
                    expect(data.result[0].gameinfo.game).to.eql("cricket");
                    expect(data.result[0].schools).to.have.length(3);
                    expect(data.result[0].countries).to.have.length(2);
                    expect(data.result[0].countries[0].states).to.have.length(1);
                    expect(data.result[0].countries[1].states).to.have.length(2);
                    expect(data.result[0].countries[0].states[0].cities).to.have.length(4);
                    expect(data.result[0].countries[1].states[0].cities).to.have.length(2);
                    expect(data.result[0].countries[1].states[1].cities).to.have.length(2);
                    expect(data.result[0].languages).to.have.length(2);
                    expect(data.result[0].score).to.eql(10);
                    var arrayUpdates = [
                        {$collection: COUNTRIES, $update: [
                            {
                                _id: "rohit",
                                $set: {
                                    "address": {$set: {line1: "z1"}, $unset: {line2: ""}},
                                    status: "married",
                                    schools: {$insert: [
                                        {_id: "dav", school: "dav", score: "17"}
                                    ], $update: [
                                        {_id: "sdm", $set: {school: "SDM"}, $unset: {status: ""}, $inc: {score: 10}}
                                    ], $delete: [
                                        {_id: "pcsd"}
                                    ]},
                                    countries: {$insert: [
                                        {_id: "Pakistan", country: "Pakistan", code: "92", states: [
                                            {_id: "lahore", state: "lahore", code: "12", cities: [
                                                {_id: "multan", city: "multan", code: "1662"}
                                            ]}
                                        ]}
                                    ], $update: [
                                        {_id: "USA", $set: {states: {$insert: [
                                            {_id: "canada", state: "canada", code: "121", cities: [
                                                {_id: "mini-punjab", city: "mini-punjab", code: "18852"}
                                            ]}
                                        ], $delete: [
                                            {_id: "new york"}
                                        ], $update: [
                                            {"_id": "washington", $set: {"cities": {"$insert": [
                                                {_id: "abc", city: "abc", code: "1864084"}
                                            ], $delete: [
                                                {"_id": "florida"}
                                            ], $update: [
                                                {"_id": "dc", "$set": {city: "dc1"}, $inc: {code: 1}}
                                            ]}}}
                                        ]}}},
                                        {_id: "india", $set: {states: {$insert: [
                                            {_id: "himachal", state: "himachal", code: "099", cities: [
                                                {_id: "kasol", city: "kasol", code: "876"}
                                            ]}
                                        ], $delete: [], $update: []}}}
                                    ]},
                                    languages: [
                                        {_id: "engish", language: "english"},
                                        {_id: "german", language: "german"}
                                    ]

                                },
                                $unset: {age: "", gameinfo: ""},
                                $inc: {score: 10}
                            }
                        ]}
                    ]
                    db.batchUpdateById(arrayUpdates, function (err, updateResult) {
                        db.query({$collection: COUNTRIES, $sort: {country: 1}}, function (err, data) {
                            if (err) {
                                done(err);
                                return;
                            }
                            console.log(">>>data>>>after update>>>>" + JSON.stringify(data));
                            expect(data.result).to.have.length(1);
                            expect(data.result[0].score).to.eql(20);
                            expect(data.result[0].languages).to.have.length(2);
                            expect(data.result[0].languages[0].language).to.eql("english");
                            expect(data.result[0].languages[1].language).to.eql("german");
                            expect(data.result[0].address.line1).to.eql("z1");
                            expect(data.result[0].schools).to.have.length(3);
                            expect(data.result[0].schools[2].school).to.eql("SDM");
                            expect(data.result[0].schools[2].score).to.eql(108);
                            expect(data.result[0].countries).to.have.length(3);

                            expect(data.result[0].countries[1].states[0].state).to.eql("washington");
                            expect(data.result[0].countries[1].states[1].state).to.eql("canada");
                            expect(data.result[0].countries[1].states[0].cities[0].city).to.eql("dc1");
                            expect(data.result[0].countries[1].states[0].cities[0].code).to.eql(112);
                            done();
                        })
                    })


                })

            })


        })


    })

    it("override in array sachin", function (done) {
        var COUNTRIES = "countries";
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {$collection: {collection: "countries", fields: [
                    {field: "states", type: "object", multiple: true}
                ]}, $insert: [
                    {country: "India", code: "91", "states": [
                        { state: "haryana"},
                        { state: "punjab"}
                    ]},
                    {country: "USA", code: "01", "states": [
                        {state: "newyork"},
                        {state: "canada"}
                    ]}

                ] }
            ]
            db.batchUpdateById(updates, function (err, result) {
                if (err) {
                    done(err);
                    return;
                }
                db.query({$collection: COUNTRIES, $sort: {country: 1}}, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log("data>>>" + JSON.stringify(data));
                    expect(data.result).to.have.length(2);
                    expect(data.result[0].states).to.have.length(2);
                    expect(data.result[1].states).to.have.length(2);
                    done();

                })

            })


        })


    })

    it("simple update with Array in array testcase", function (done) {
        var COUNTRIES = "countries";
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {$collection: COUNTRIES, $insert: [
                    {country: "India", code: "91", "states": [
                        {_id: "haryana", state: "haryana"},
                        {_id: "punjab", state: "punjab"},
                        {_id: "bihar", state: "bihar"}
                    ]},
                    {country: "USA", code: "01", "states": [
                        {_id: "newyork", state: "newyork"},
                        {_id: "canada", state: "canada"}
                    ]}
                ] }
            ]
            db.batchUpdateById(updates, function (err, result) {
                if (err) {
                    done(err);
                    return;
                }
                db.query({$collection: COUNTRIES, $sort: {country: 1}}, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log(">>>>>data>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>..>>" + JSON.stringify(data));
                    expect(data.result).to.have.length(2);
                    expect(data.result[0].states).to.have.length(3);
                    expect(data.result[1].states).to.have.length(2);

                    var arrayUpdates = [
                        {$collection: COUNTRIES, $update: [
                            {_id: data.result[0]._id,
                                $set: {
                                    states: {
                                        $insert: [
                                            {_id: "gujrat", state: "gujrat"}
                                        ],
                                        $delete: [
                                            {_id: "bihar"}
                                        ],
                                        $update: [
                                            {_id: "punjab",
                                                $set: {
                                                    state: "punjab1",
                                                    cities: {$insert: [
                                                        {_id: "bathinda", city: "bathinda"}
                                                    ]}}},
                                            {_id: "haryana", $set: {state: "haryana1", cities: [
                                                {_id: "sirsa", city: "sirsa"}
                                            ]}}
                                        ]}}}
                        ]}
                    ]


                    var mongoUpdate1 = {$set: {"states.1.state": "punjab1", "states.0.state": "haryana", "states.0.cities": [
                        {_id: "sirsa", city: "sirsa"}
                    ]}};

                    var mongoUpdate2 = {$push: {"states.1.cities": {$each: [
                        {_id: "bathinda", state: "bathinda"}
                    ]}}, states: {$each: [
                        {_id: "gujrat", state: "gujrat"}
                    ]}};

                    var mongoUpdate3 = {$pull: {states: {_id: "haryana"}}}


                    db.batchUpdateById(arrayUpdates, function (err, updateResult) {
                        console.log(">>>updateResult>>>>" + JSON.stringify(updateResult));

                        db.query({$collection: COUNTRIES, $sort: {country: 1}}, function (err, data) {
                            if (err) {
                                done(err);
                                return;
                            }
                            console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>data>>>" + JSON.stringify(data));
                            expect(data.result).to.have.length(2);
                            expect(data.result[0].states).to.have.length(3);
                            expect(data.result[1].states).to.have.length(2);
                            done();
                        })
                    })


                })

            })


        })


    })

    it("update with nested  Array  in array testcaess", function (done) {
        var COUNTRIES = "countries";
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {$collection: COUNTRIES, $insert: [
                    {country: "India", code: "91", "states": [
                        {_id: "haryana", state: "haryana", "cities": [
                            {"_id": "hisar", "city": "hisar", "schools": [
                                {"_id": "vdjs", "school": "vdjs"},
                                {"_id": "model", "school": "model"}
                            ]},
                            {"_id": "sirsa", "city": "sirsa", "schools": [
                                {"_id": "jindal", "school": "jindal"},
                                {"_id": "modern", "school": "modern"}
                            ]}
                        ]},
                        {_id: "punjab", state: "punjab", "cities": [
                            {"_id": "amritsar", "city": "amritsar", "schools": [
                                {"_id": "sant kabir", "school": "sant kabir"},
                                {"_id": "guru nanak", "school": "guru nanak"}
                            ]},
                            {"_id": "patiala", "city": "patiala", "schools": [
                                {"_id": "bhagat singh school", "school": "bhagat singh school"},
                                {"_id": "sukhdev singh school", "school": "sukhdev singh school"}
                            ]}
                        ]},
                        {_id: "gujrat", state: "gujrat", "cities": [
                            {"_id": "amhemdabad", "city": "amhemdabad", "schools": [
                                {"_id": "patel school", "school": "patel school"}
                            ]},
                            {"_id": "goa", "city": "goa", "schools": [
                                {"_id": "beach school", "school": "beach school"}
                            ]}
                        ]}
                    ]}
                ] }
            ]
            db.batchUpdateById(updates, function (err, result) {
                if (err) {
                    done(err);
                    return;
                }
                db.query({$collection: COUNTRIES, $sort: {country: 1}}, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log(">>>>>data>>>" + JSON.stringify(data));
                    expect(data.result).to.have.length(1);
                    expect(data.result[0].states).to.have.length(3);
                    expect(data.result[0].states[0].cities).to.have.length(2);
                    expect(data.result[0].states[0].cities[0].schools).to.have.length(2);
                    expect(data.result[0].states[1].cities).to.have.length(2);
                    expect(data.result[0].states[1].cities[1].schools).to.have.length(2);
                    var arrayUpdates = [
                        {$collection: COUNTRIES, $update: [
                            {
                                _id: data.result[0]._id,
                                $set: {states: {$insert: [
                                    {_id: "gurgoan", state: "gurgoan"}
                                ], $delete: [
                                    {$query: {state: "haryana"}},
                                    {$query: {state: "gujrat"}}
                                ], $update: [
                                    {_id: "punjab", $set: {state: "punjab1", cities: {"$insert": [
                                        {"_id": "bathinda", "city": "bathinda"}
                                    ], "$delete": [
                                        {"_id": "patiala"}
                                    ], "$update": [
                                        {"_id": "amritsar",
                                            "$set": {"city": "amritsar1", "schools": {"$insert": [
                                                {"_id": "happy public school", "school": "happy public school"}
                                            ], "$delete": [
                                                {"_id": "sant kabir"}
                                            ], "$update": [
                                                {"_id": "guru nanak", "$set": {"school": "guru nanak school"}}
                                            ]}}}
                                    ]}
                                    }}
                                ]}}}
                        ]}
                    ]
                    db.batchUpdateById(arrayUpdates, function (err, updateResult) {
                        db.query({$collection: COUNTRIES, $sort: {country: 1}}, function (err, data) {
                            if (err) {
                                done(err);
                                return;
                            }
                            console.log("data>>>>>>>in countries table after update" + JSON.stringify(data));
                            expect(data.result).to.have.length(1);
                            expect(data.result[0].states).to.have.length(2);
                            expect(data.result[0].states[1].state).to.eql("punjab1");
                            expect(data.result[0].states[1].cities).to.length(2);
                            expect(data.result[0].states[1].cities[0].schools).to.length(2);
                            expect(data.result[0].states[1].cities[0].city).to.eql("amritsar1");
                            expect(data.result[0].states[1].cities[0].schools[0].school).to.eql("guru nanak school");
                            done();
                        })
                    })
                })

            })


        })


    });

    it("update with nested  Array on the basis of query", function (done) {
        var COUNTRIES = "countries";
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {$collection: COUNTRIES, $insert: [
                    {country: "India", code: "91", "states": [
                        {_id: "haryana", state: "haryana", "cities": [
                            {"_id": "hisar", "city": "hisar", "schools": [
                                {"_id": "vdjs", "school": "vdjs"},
                                {"_id": "model", "school": "model"}
                            ]},
                            {"_id": "sirsa", "city": "sirsa", "schools": [
                                {"_id": "jindal", "school": "jindal"},
                                {"_id": "modern", "school": "modern"}
                            ]}
                        ]},
                        {_id: "punjab", state: "punjab", "cities": [
                            {"_id": "amritsar", "city": "amritsar", "schools": [
                                {"_id": "sant kabir", "school": "sant kabir"},
                                {"_id": "guru nanak", "school": "guru nanak"}
                            ]},
                            {"_id": "patiala", "city": "patiala", "schools": [
                                {"_id": "bhagat singh school", "school": "bhagat singh school"},
                                {"_id": "sukhdev singh school", "school": "sukhdev singh school"}
                            ]}
                        ]}
                    ]}
                ] }
            ]
            db.batchUpdateById(updates, function (err, result) {
                if (err) {
                    done(err);
                    return;
                }
                db.query({$collection: COUNTRIES, $sort: {country: 1}}, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log(">>>>>data>>>" + JSON.stringify(data));
                    expect(data.result).to.have.length(1);
                    expect(data.result[0].states).to.have.length(2);
                    expect(data.result[0].states[0].cities).to.have.length(2);
                    expect(data.result[0].states[0].cities[0].schools).to.have.length(2);
                    expect(data.result[0].states[1].cities).to.have.length(2);
                    expect(data.result[0].states[1].cities[1].schools).to.have.length(2);
                    var arrayUpdates = [
                        {$collection: COUNTRIES, $update: [
                            {
                                _id: data.result[0]._id,
                                $set: {states: {$insert: [
                                    {_id: "gurgoan", state: "gurgoan"}
                                ], $delete: [
                                    {$query: {state: "haryana"}}
                                ], $update: [
                                    {_id: "punjab", $set: {state: "punjab1", cities: {"$insert": [
                                        {"_id": "bathinda", "city": "bathinda"}
                                    ], "$delete": [
                                        {$query: {city: "patiala"}}
                                    ], "$update": [
                                        {"$query": {"_id": "amritsar"},
                                            "$set": {"city": "amritsar1", "schools": {"$insert": [
                                                {"_id": "happy public school", "school": "happy public school"}
                                            ], "$delete": [
                                                {$query: {school: "sant kabir"}}
                                            ], "$update": [
                                                {$query: {"_id": "guru nanak"}, "$set": {"school": "guru nanak school"}}
                                            ]}}}
                                    ]}
                                    }}
                                ]}}}
                        ]}
                    ]
                    db.batchUpdateById(arrayUpdates, function (err, updateResult) {
                        db.query({$collection: COUNTRIES, $sort: {country: 1}}, function (err, data) {
                            if (err) {
                                done(err);
                                return;
                            }
                            console.log("data>>>>>>>in countries table after update" + JSON.stringify(data));
                            expect(data.result).to.have.length(1);
                            expect(data.result[0].states).to.have.length(2);
                            expect(data.result[0].states[1].state).to.eql("punjab1");
                            expect(data.result[0].states[1].cities).to.length(2);
                            expect(data.result[0].states[1].cities[0].schools).to.length(2);
                            expect(data.result[0].states[1].cities[0].city).to.eql("amritsar1");
                            expect(data.result[0].states[1].cities[0].schools[0].school).to.eql("guru nanak school");
                            done();
                        })
                    })
                })

            })


        })


    });

    it("update with Array of literals", function (done) {
        var COUNTRIES = "countries";
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {$collection: COUNTRIES, $insert: [
                    {country: "India", code: "91", "states": ["haryana", "punjab", "gujrat", "himachal"
                    ]}
                ]}
            ];

            db.batchUpdateById(updates, function (err, result) {
                if (err) {
                    done(err);
                    return;
                }
                db.query({$collection: COUNTRIES, $sort: {country: 1}}, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log(">>>>>data>>>" + JSON.stringify(data));
                    expect(data.result).to.have.length(1);
                    expect(data.result[0].states).to.have.length(4);
                    var arrayUpdates = [
                        {$collection: COUNTRIES, $update: [
                            {
                                _id: data.result[0]._id,
                                $set: {states: {$insert: [
                                    "bihar"
                                ], $delete: ["haryana", "punjab", "himachal"]
                                }}}
                        ]}
                    ]
                    db.batchUpdateById(arrayUpdates, function (err, updateResult) {
                        db.query({$collection: COUNTRIES, $sort: {country: 1}}, function (err, data) {
                            if (err) {
                                done(err);
                                return;
                            }
                            expect(data.result).to.have.length(1);
                            expect(data.result[0].states).to.have.length(2);
                            done();
                        })
                    })
                })

            })


        })


    });

    it("dollar updates with single dollar", function (done) {
        var COUNTRIES = "countries";
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {$collection: COUNTRIES, $insert: [
                    {"_id": "india", "country": "india", "states": [
                        {"_id": "haryana", "state": "haryana"}
                    ]}
                    ,
                    {"_id": "USA", "country": "USA", "states": [
                        {"_id": "New York", "state": "New York"},
                        {"_id": "haryana", "state": "haryana"},
                        {"_id": "haryana1", "state": "haryana"}
                    ]}
                ]}

            ];


            db.batchUpdate(updates, function (err, result) {
                if (err) {
                    done(err);
                    return;
                }
                db.query({$collection: COUNTRIES, $sort: {country: 1}}, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log(">>>>>data after insert>>>" + JSON.stringify(data));
                    expect(data.result).to.have.length(2);
                    expect(data.result[1].states).to.have.length(1);
                    expect(data.result[0].states).to.have.length(3);

                    var arrayUpdates = [
                        {$collection: COUNTRIES, "$update": [
                            {"$query": {"states.state": "haryana"}, "$set": {"states.$.state": "haryana1"}
                            }
                        ]}
                    ]
                    db.batchUpdate(arrayUpdates, {multi: true}, function (err, updateResult) {
                        db.query({$collection: COUNTRIES, $sort: {country: 1}}, function (err, data) {
                            if (err) {
                                done(err);
                                return;
                            }
                            console.log(">>>data>>>after update>>>>" + JSON.stringify(data));
                            expect(data.result).to.have.length(2);
                            expect(data.result[0].country).to.eql("USA");
                            expect(data.result[0].states).to.have.length(3);
                            expect(data.result[0].states[0].state).to.eql("New York");
                            expect(data.result[0].states[1].state).to.eql("haryana1");
                            expect(data.result[0].states[2].state).to.eql("haryana1");


                            expect(data.result[1].country).to.eql("india");
                            expect(data.result[1].states).to.have.length(1);
                            expect(data.result[1].states[0].state).to.eql("haryana1");

                            done();
                        })
                    })
                })
            })
        })
    });

    it("second dollar updates with single level", function (done) {
        var COUNTRIES = "countries";
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {$collection: COUNTRIES, $insert: [
                    {"_id": "india", "country": "india", "states": [
                        {"_id": "haryana", "state": "haryana", "cityid": {"_id": "hisar", "city": "hisar"}
                        },
                        {"_id": "bihar", "state": "bihar", "cityid": {"_id": "sirsa", "city": "sirsa"}
                        },
                        {"_id": "gujrat", "state": "gujrat", "cityid": {"_id": "hisar", "city": "hisar"}
                        }
                    ]}
                ]}
            ];

            db.batchUpdate(updates, function (err, result) {
                if (err) {
                    done(err);
                    return;
                }
                db.query({$collection: COUNTRIES, $sort: {country: 1}}, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log(">>>>>data after insert>>>" + JSON.stringify(data));
                    expect(data.result).to.have.length(1);
                    expect(data.result[0].states).to.have.length(3);
                    expect(data.result[0].states[0].state).to.eql("haryana");
                    expect(data.result[0].states[1].state).to.eql("bihar");
                    expect(data.result[0].states[2].state).to.eql("gujrat");

                    var arrayUpdates = [
                        {$collection: COUNTRIES, "$update": [
                            {"$query": {"states.cityid.city": "hisar"}, "$set": {"states.$.cityid.city": "goa"}
                            }
                        ]}
                    ]
                    db.batchUpdate(arrayUpdates, {w: 1, multi: true}, function (err, updateResult) {
                        db.query({$collection: COUNTRIES, $sort: {country: 1}}, function (err, data) {
                            if (err) {
                                done(err);
                                return;
                            }
                            console.log(">>>data>>>after update>>>>" + JSON.stringify(data));
                            expect(data.result).to.have.length(1);
                            expect(data.result[0].states).to.have.length(3);
                            expect(data.result[0].states[0].state).to.eql("haryana");
                            expect(data.result[0].states[0].cityid.city).to.eql("goa");
                            expect(data.result[0].states[1].state).to.eql("bihar");
                            expect(data.result[0].states[1].cityid.city).to.eql("sirsa");
                            expect(data.result[0].states[2].state).to.eql("gujrat");
                            expect(data.result[0].states[2].cityid.city).to.eql("goa");

                            done();
                        })
                    })
                })
            })
        })
    });

    it("nested dollar updates", function (done) {
        var COUNTRIES = "countries";
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {$collection: COUNTRIES, $insert: [
                    {"_id": "india", "country": "india", "states": [
                        {"_id": "haryana", "state": "haryana", "cities": [
                            {"cityid": {"_id": "sirsa", "city": "sirsa"}},
                            {"cityid": {"_id": "hisar", "city": "hisar"}},
                            {"cityid": {"_id": "sirsa", "city": "sirsa"}}

                        ]},
                        {"_id": "gujrat", "state": "gujrat", "cities": [
                            {"cityid": {"_id": "sirsa", "city": "sirsa"}},
                            {"cityid": {"_id": "ahmedabad", "city": "ahmedabad"}},
                            {"cityid": {"_id": "sirsa", "city": "sirsa"}}

                        ]}
                    ]},
                    {"_id": "USA", "country": "USA", "states": [
                        {"_id": "canada", "state": "canada", "cities": [
                            {"cityid": {"_id": "hisar", "city": "hisar"}},
                            {"cityid": {"_id": "sirsa", "city": "sirsa"}}
                        ]}
                    ]},
                    {"_id": "pakistan", "country": "pakistan", "states": [
                        {"_id": "lahore", "state": "lahore", "cities": [
                            {"cityid": {"_id": "hisar", "city": "hisar"}},
                            {"cityid": {"_id": "sirsa", "city": "sirsa"}}
                        ]},
                        {"_id": "multan", "state": "multan", "cities": [
                            {"cityid": {"_id": "hisar", "city": "hisar"}},
                            {"cityid": {"_id": "sirsa", "city": "sirsa"}}
                        ]}
                    ]}
                ]}
            ];

            db.batchUpdate(updates, function (err, result) {
                if (err) {
                    done(err);
                    return;
                }
                db.query({$collection: COUNTRIES, $sort: {country: 1}}, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log(">>>>>data>>>" + JSON.stringify(data));
                    expect(data.result).to.have.length(3);
                    expect(data.result[0].states).to.have.length(1);
                    expect(data.result[1].states).to.have.length(2);
                    expect(data.result[2].states).to.have.length(2);
                    var arrayUpdates = [
                        {$collection: COUNTRIES, "$update": [
                            {"$query": {"states.cities.cityid.city": "sirsa"}, "$set": {"states.$.cities.$.cityid.city": "sirsa1"}
                            }
                        ]}
                    ]
                    db.batchUpdate(arrayUpdates, {multi: true}, function (err, updateResult) {
                        db.query({$collection: COUNTRIES, $sort: {country: 1}}, function (err, data) {
                            if (err) {
                                done(err);
                                return;
                            }
                            console.log(">>>data>>>after update>>>>" + JSON.stringify(data));
                            expect(data.result).to.have.length(3);
                            expect(data.result[0].country).to.eql("USA");
                            expect(data.result[0].states).to.have.length(1);
                            expect(data.result[0].states[0].cities).to.have.length(2);
                            expect(data.result[0].states[0].cities[0].cityid.city).to.eql("hisar");
                            expect(data.result[0].states[0].cities[1].cityid.city).to.eql("sirsa1");

                            expect(data.result[1].country).to.eql("india");
                            expect(data.result[1].states).to.have.length(2);
                            expect(data.result[1].states[0].cities).to.have.length(3);
                            expect(data.result[1].states[0].cities[0].cityid.city).to.eql("sirsa1");
                            expect(data.result[1].states[0].cities[1].cityid.city).to.eql("hisar");
                            expect(data.result[1].states[0].cities[2].cityid.city).to.eql("sirsa1");

                            expect(data.result[1].states[1].cities).to.have.length(3);
                            expect(data.result[1].states[1].cities[0].cityid.city).to.eql("sirsa1");
                            expect(data.result[1].states[1].cities[1].cityid.city).to.eql("ahmedabad");
                            expect(data.result[1].states[1].cities[2].cityid.city).to.eql("sirsa1");

                            expect(data.result[2].country).to.eql("pakistan");
                            expect(data.result[2].states).to.have.length(2);
                            expect(data.result[2].states[0].cities).to.have.length(2);
                            expect(data.result[2].states[0].cities[0].cityid.city).to.eql("hisar");
                            expect(data.result[2].states[0].cities[1].cityid.city).to.eql("sirsa1");
                            expect(data.result[2].states[1].cities).to.have.length(2);
                            expect(data.result[2].states[1].cities[0].cityid.city).to.eql("hisar");
                            expect(data.result[2].states[1].cities[1].cityid.city).to.eql("sirsa1");
                            done();
                        })
                    })
                })

            })


        })


    });

    it("nested  3 dollar updates", function (done) {
        var COUNTRIES = "countries";
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {$collection: COUNTRIES, $insert: [
                    {"_id": "india", "country": "india", "states": [
                        {"_id": "haryana", "state": "haryana", "cities": [
                            {"id": "hisar", "city": "hisar", "schools": [
                                {"id": "vdjs", "school": "vdjs"},
                                {"id": "nyps", "school": "nyps"},
                                {"id": "nehru", "school": "nehru"}
                            ]},
                            {"id": "sirsa", "city": "sirsa", "schools": [
                                {"id": "jindal", "school": "jindal"},
                                {"id": "nehru", "school": "nehru"}
                            ]}
                        ]}
                    ]},
                    {"_id": "pakistan", "country": "pakistan", "states": [
                        {"_id": "lahore", "state": "lahore", "cities": [
                            {"id": "hisar", "city": "hisar", "schools": [
                                {"id": "vdjs", "school": "vdjs"},
                                {"id": "nyps", "school": "nyps"},
                                {"id": "nehru", "school": "nehru"}
                            ]},
                            {"id": "sirsa", "city": "sirsa", "schools": [
                                {"id": "jindal", "school": "jindal"},
                                {"id": "nehru", "school": "nehru"}
                            ]}
                        ]},
                        {"_id": "multan", "state": "multan", "cities": [
                            {"id": "hisar", "city": "hisar", "schools": [
                                {"id": "vdjs", "school": "vdjs"},
                                {"id": "nyps", "school": "nyps"},
                                {"id": "nehru", "school": "nehru"}
                            ]},
                            {"id": "sirsa", "city": "sirsa", "schools": [
                                {"id": "jindal", "school": "jindal"},
                                {"id": "nehru", "school": "nehru"}
                            ]}
                        ]}
                    ]},
                    {"_id": "usa", "country": "usa", "states": [
                        {"_id": "amsterdam", "state": "amsterdam", "cities": [
                            {"id": "hisar", "city": "hisar", "schools": [
                                {"id": "vdjs", "school": "vdjs"},
                                {"id": "nyps", "school": "nyps"},
                                {"id": "nehru", "school": "nehru"}
                            ]},
                            {"id": "sirsa", "city": "sirsa", "schools": [
                                {"id": "jindal", "school": "jindal"},
                                {"id": "nehru", "school": "nehru"}
                            ]}
                        ]}
                    ]}
                ]}
            ];

            db.batchUpdate(updates, function (err, result) {
                if (err) {
                    done(err);
                    return;
                }
                db.query({$collection: COUNTRIES, $sort: {country: 1}}, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log(">>>>>data>>>" + JSON.stringify(data));
                    expect(data.result).to.have.length(3);
                    expect(data.result[0].states).to.have.length(1);
                    expect(data.result[0].states[0].cities).to.have.length(2);
                    expect(data.result[0].states[0].cities[0].schools).to.have.length(3);
                    expect(data.result[0].states[0].cities[1].schools).to.have.length(2);
                    var arrayUpdates = [
                        {$collection: COUNTRIES, "$update": [
                            {"$query": {"states.cities.schools.school": "nehru"}, "$set": {"states.$.cities.$.schools.$.school": "nehru1"}
                            }
                        ]}
                    ]
                    db.batchUpdate(arrayUpdates, {multi: true}, function (err, updateResult) {
                        db.query({$collection: COUNTRIES, $sort: {country: 1}}, function (err, data) {
                            if (err) {
                                done(err);
                                return;
                            }
                            console.log(">>>data>>>after update>>>>" + JSON.stringify(data));
                            expect(data.result).to.have.length(3);
                            expect(data.result[0].country).to.eql("india");
                            expect(data.result[0].states).to.have.length(1);
                            expect(data.result[0].states[0].state).to.eql("haryana");
                            expect(data.result[0].states[0].cities).to.have.length(2);
                            expect(data.result[0].states[0].cities[0].city).to.eql("hisar");
                            expect(data.result[0].states[0].cities[1].city).to.eql("sirsa");
                            expect(data.result[0].states[0].cities[0].schools).to.have.length(3);
                            expect(data.result[0].states[0].cities[0].schools).to.have.length(3);
                            expect(data.result[0].states[0].cities[0].schools[0].school).to.eql("vdjs");
                            expect(data.result[0].states[0].cities[0].schools[1].school).to.eql("nyps");
                            expect(data.result[0].states[0].cities[0].schools[2].school).to.eql("nehru1");
                            expect(data.result[0].states[0].cities[1].schools).to.have.length(2);
                            expect(data.result[0].states[0].cities[1].schools[0].school).to.eql("jindal");
                            expect(data.result[0].states[0].cities[1].schools[1].school).to.eql("nehru1");


                            expect(data.result[1].country).to.eql("pakistan");
                            expect(data.result[1].states).to.have.length(2);
                            expect(data.result[1].states[0].state).to.eql("lahore");
                            expect(data.result[1].states[0].cities).to.have.length(2);
                            expect(data.result[1].states[0].cities[0].city).to.eql("hisar");
                            expect(data.result[1].states[0].cities[1].city).to.eql("sirsa");
                            expect(data.result[1].states[0].cities[0].schools).to.have.length(3);
                            expect(data.result[1].states[0].cities[0].schools).to.have.length(3);
                            expect(data.result[1].states[0].cities[0].schools[0].school).to.eql("vdjs");
                            expect(data.result[1].states[0].cities[0].schools[1].school).to.eql("nyps");
                            expect(data.result[1].states[0].cities[0].schools[2].school).to.eql("nehru1");
                            expect(data.result[1].states[0].cities[1].schools).to.have.length(2);
                            expect(data.result[1].states[0].cities[1].schools[0].school).to.eql("jindal");
                            expect(data.result[1].states[0].cities[1].schools[1].school).to.eql("nehru1");

                            expect(data.result[1].states[1].state).to.eql("multan");
                            expect(data.result[1].states[1].cities).to.have.length(2);
                            expect(data.result[1].states[1].cities[0].city).to.eql("hisar");
                            expect(data.result[1].states[1].cities[1].city).to.eql("sirsa");
                            expect(data.result[1].states[1].cities[0].schools).to.have.length(3);
                            expect(data.result[1].states[1].cities[0].schools).to.have.length(3);
                            expect(data.result[1].states[1].cities[0].schools[0].school).to.eql("vdjs");
                            expect(data.result[1].states[1].cities[0].schools[1].school).to.eql("nyps");
                            expect(data.result[1].states[1].cities[0].schools[2].school).to.eql("nehru1");
                            expect(data.result[1].states[1].cities[1].schools).to.have.length(2);
                            expect(data.result[1].states[1].cities[1].schools[0].school).to.eql("jindal");
                            expect(data.result[1].states[1].cities[1].schools[1].school).to.eql("nehru1");


                            expect(data.result[2].country).to.eql("usa");
                            expect(data.result[2].states).to.have.length(1);
                            expect(data.result[2].states[0].state).to.eql("amsterdam");
                            expect(data.result[2].states[0].cities).to.have.length(2);
                            expect(data.result[2].states[0].cities[0].city).to.eql("hisar");
                            expect(data.result[2].states[0].cities[1].city).to.eql("sirsa");
                            expect(data.result[2].states[0].cities[0].schools).to.have.length(3);
                            expect(data.result[2].states[0].cities[0].schools).to.have.length(3);
                            expect(data.result[2].states[0].cities[0].schools[0].school).to.eql("vdjs");
                            expect(data.result[2].states[0].cities[0].schools[1].school).to.eql("nyps");
                            expect(data.result[2].states[0].cities[0].schools[2].school).to.eql("nehru1");
                            expect(data.result[2].states[0].cities[1].schools).to.have.length(2);
                            expect(data.result[2].states[0].cities[1].schools[0].school).to.eql("jindal");
                            expect(data.result[2].states[0].cities[1].schools[1].school).to.eql("nehru1");

                            done();
                        })
                    })
                })

            })
        })
    });

    it("nested dollar updates inside object", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {$collection: "countries", $insert: [
                    {_id: "india", country: "india", state: {state: "haryana", cities: [
                        {city: "hisar", address: {lineno: "12", landmark: [
                            {land: "area1"},
                            {land: "area2"}
                        ]}},
                        {city: "sirsa", address: {lineno: "15", landmark: [
                            {land: "area5"},
                            {land: "area2"}
                        ]}},
                        {city: "bhiwani", address: {lineno: "25", landmark: [
                            {land: "area33"},
                            {land: "area2"}
                        ]}}
                    ]}},
                    {_id: "pakistan", country: "pakistan", state: {state: "lahore", cities: [
                        {city: "hisar", address: {lineno: "12"}},
                        {city: "sirsa", address: {lineno: "15"}},
                        {city: "bhiwani", address: {lineno: "25"}}
                    ]}}
                ]}
            ];
            db.batchUpdateById(updates, function (err, data) {
                if (err) {
                    done(err);
                    return;
                }
                db.query({$collection: "countries"}, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    expect(data.result).to.have.length(2);
                    expect(data.result[0].country).to.eql("india");
                    expect(data.result[1].country).to.eql("pakistan");
                    console.log("data after insert>>>>>>>>>>>" + JSON.stringify(data));

                    var arrayUpdates = [
                        {$collection: "countires", "$update": [
                            {"$query": {"state.cities.address.landmark.land": "area2"}, "$set": {"state.cities.$.address.lankmark.$.land": "area100"}
                            }
                        ]}
                    ];
                    db.batchUpdate(arrayUpdates, {multi: true}, function (err, data) {
                        if (err) {
                            done(err);
                            return;
                        }
                        db.query({$collection: "countries"}, function (err, data) {
                            if (err) {
                                done(err);
                                return;
                            }
                            console.log("data after update>>>>>>>>>>>" + JSON.stringify(data));
                            done();
                        })
                    });
                });

            })

        });
    });

    it("test case by sachin bansal", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return
            }

            var batchUpdates = [
                {
                    $collection: {collection: "persons", fields: [
                        {field: "address", type: "object", multiple: true, fields: [
                            {field: "cityid", type: "fk", collection: "cities", upsert: true, set: ["city"]}
                        ]}
                    ]},
                    $insert: [

                        {
                            _id: "Pawan",
                            name: "Pawan",
                            address: [
                                {address: "212", cityid: {_id: "sirsa", $set: {city: "sirsa"}}}
                            ]

                        },
                        {
                            _id: "Rohit",
                            name: "Rohit",
                            address: [
                                {address: "23123", cityid: {_id: "hisar", $set: {city: "hisar"}}}
                            ]
                        }
                        ,
                        {
                            _id: "Sachin",
                            name: "Sachin",
                            address: [
                                {address: "1234", cityid: {_id: "hisar", $set: {city: "hisar"}}},
                                {address: "2132", cityid: {_id: "sirsa", $set: {city: "sirsa"}}} ,
                                {address: "213211", cityid: {_id: "hisar", $set: {city: "hisar"}}}
                            ]
                        }
                    ]

                }
            ]

            db.batchUpdateById(batchUpdates, function (err, res) {
                if (err) {
                    done(err);
                    return;
                }
                var updates = {"$collection": "persons", "$update": [
                    {"$query": {"address.cityid._id": "hisar"}, "$set": {"address.$.cityid.city": "hisar1"}}
                ]};
                db.batchUpdate([updates], {w: 1, multi: true}, function (err, result) {
                    if (err) {
                        done(err);
                        return;
                    }
                    db.query({$collection: "persons", $sort: {name: 1}}, function (err, persons) {
                        if (err) {
                            done(err);
                            return;
                        }
                        console.log("result>>." + JSON.stringify(persons));
                        done();
                    });
                });

            });


        });


    });

    it("inc and set in object case array", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return
            }

            var updates = [
                {$collection: "countries", $insert: [
                    {_id: 1, country: "USA", code: "01", "score": 1000, address: {city: "hisar", state: "haryana", "lineno": 1}}
                ]}
            ];

            db.batchUpdateById(updates, function (err, res) {
                if (err) {
                    done(err);
                    return;
                }
                var update = [
                    {$collection: "countries", $update: [
                        {_id: 1, $set: {"country": "India", address: {$set: {city: "Hisar1"}, $inc: {lineno: 12}}}, $inc: {score: 10}}
                    ]}
                ];
                db.batchUpdateById(update, function (err, result) {
                    if (err) {
                        done(err);
                        return;
                    }
                    db.query({$collection: "countries"}, function (err, data) {
                        if (err) {
                            done(err);
                            return;
                        }
                        console.log("result>>." + JSON.stringify(data));
                        expect(data.result).to.have.length(1);
                        expect(data.result[0].country).to.eql("India");
                        expect(data.result[0].address.city).to.eql("Hisar1");
                        expect(data.result[0].address.lineno).to.eql(13);
                        expect(data.result[0].score).to.eql(1010);
                        done();
                    });
                });

            });


        });


    })

    it("update fk column case from dhirender", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return
            }

            var updates = [
                {$collection: {collection: "countries", fields: [
                    {field: "artistid", type: "fk", upsert: true, collection: "artists"}
                ]}, $insert: [
                    {_id: 1, country: "USA", artistid: {$query: {_id: 1}, $set: {name: "dhirender"}}}
                ]}
            ];

            db.batchUpdateById(updates, function (err, data) {
                if (err) {
                    done(err);
                    return;
                }
                db.query({$collection: "countries"}, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log("data>>>>>>>>>>>>>>" + JSON.stringify(data));
                    expect(data.result).to.have.length(1);
                    expect(data.result[0].country).to.eql("USA");
                    expect(data.result[0].artistid._id).to.eql(1);
                    var newUpdates = [
                        {$collection: {collection: "countries", fields: [
                            {field: "artistid", type: "fk", upsert: true, collection: "artists"}
                        ]}, $update: [
                            {_id: 1, $set: {artistid: {$query: {_id: 2}, $set: {name: "dhirender2"}}}}
                        ]}
                    ];

                    db.batchUpdateById(newUpdates, function (err, data) {
                        if (err) {
                            done(err);
                            return;
                        }
                        db.query({$collection: "countries"}, function (err, data) {
                            if (err) {
                                done(err);
                                return;
                            }
                            console.log("data>>>>>>>>>>>after update>>>" + JSON.stringify(data));
                            expect(data.result).to.have.length(1);
                            expect(data.result[0].country).to.eql("USA");
                            expect(data.result[0].artistid._id).to.eql(2);
                            done();
                        });
                    });

                })
            })
        });
    })

    it("update nested object with inc and set", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return
            }
            var updates = [
                {$collection: "countries", $insert: [
                    {"_id": 1, "country": "USA", "code": 1, "state": {"state": "haryana", "rank": 100, "city": {"city": "hisar", "score": 200, "address": {"lineno": 300, "area": "near ketarpaul hospital"}}}}
                ]}
            ];
            db.batchUpdateById(updates, function (err, data) {
                if (err) {
                    done(err);
                    return;
                }
                db.query({$collection: "countries"}, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    expect(data.result).to.have.length(1);
                    console.log("data after insert>>>>>>>>>>>>>>>>" + JSON.stringify(data));
                    var newUpdates = [
                        {$collection: "countries", $update: [
                            {"_id": 1, "$inc": {"code": 10}, "$set": {"country": "india", "state": {"$set": {"state": "LA", "city": {"$set": {"city": "toronto", "address": {"$inc": {"lineno": 10}, "$set": {"area": "daffodil"}}}, "$inc": {"score": 10}}}, "$inc": {"rank": 10}}}}
                        ]}
                    ]

                    db.batchUpdateById(newUpdates, function (err, data) {
                        if (err) {
                            done(err);
                            return;
                        }
                        db.query({$collection: "countries"}, function (err, data) {
                            if (err) {
                                done(err);
                                return;
                            }
                            console.log("data>>>>>>>>>>>after update>>>" + JSON.stringify(data));
                            expect(data.result).to.have.length(1);
                            expect(data.result[0].country).to.eql("india");
                            expect(data.result[0].code).to.eql(11);
                            expect(data.result[0].state.state).to.eql("LA");
                            expect(data.result[0].state.rank).to.eql(110);
                            expect(data.result[0].state.city.city).to.eql("toronto");
                            expect(data.result[0].state.city.score).to.eql(210);
                            expect(data.result[0].state.city.address.area).to.eql("daffodil");
                            expect(data.result[0].state.city.address.lineno).to.eql(310);

                            done();
                        });
                    });

                })
            })
        });
    });

    it("override in array level 3", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {$collection: "tasks", "$insert": [
                    {_id: "task1", "task": "newtasks", progress: [
                        {_id: "progress1", progress: "completed", efforts: [
                            {"time": 10}
                        ]}
                    ]}
                ]}
            ]
            db.batchUpdateById(updates, function (err, data) {
                if (err) {
                    done(err);
                    return;
                }
                var newUpdates = [
                    {$collection: "tasks", "$update": [
                        {_id: "task1", $set: {progress: {$update: [
                            {_id: "progress1", $set: { efforts: [
                                {time: "5"},
                                {time: "5"}
                            ]}}
                        ]}} }
                    ]}
                ];
                db.batchUpdateById(newUpdates, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    db.query({$collection: "tasks"}, function (err, data) {
                        if (err) {
                            done(err);
                            return;
                        }
                        console.log("data of tasks after update>>>>" + JSON.stringify(data));
                        expect(data.result).to.have.length(1);
                        expect(data.result[0].progress).to.have.length(1);
                        expect(data.result[0].progress[0].efforts).to.have.length(2);
                        done();
                    });
                });
            })

        });
    });

    it("case of file type column", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {$collection: "todos", $insert: [
                    {_id: "1", todo: "say hello"}
                ]
                }
            ];
            db.batchUpdateById(updates, function (err, data) {
                if (err) {
                    done(err);
                    return;
                }
                db.query({$collection: "todos"}, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log("data insert after todos");
                    expect(data.result).to.have.length(1);
                    expect(data.result[0].todo).to.eql("say hello");
                    var newUpdates = [
                        {$collection: {collection: "todos", fields: [
                            {field: "photo", type: "file"}
                        ]}, $update: [
                            {"$set": {"photo": {"key": "536b54c7c8e4a734150002f8", "name": "Desert.jpg"}}, "_id": "1"}
                        ]}
                    ];
                    db.batchUpdateById(newUpdates, function (err, data) {
                        if (err) {
                            done(err);
                            return;
                        }
                        db.query({$collection: "todos"}, function (err, data) {
                            if (err) {
                                done(err);
                                return;
                            }
                            console.log("data after update>>>>>." + JSON.stringify(data));
                            expect(data.result).to.have.length(1);
                            expect(data.result[0].todo).to.eql("say hello");
                            expect(data.result[0].photo.key).to.eql("536b54c7c8e4a734150002f8");
                            expect(data.result[0].photo.name).to.eql("Desert.jpg");
                            done();
                        });
                    });
                });
            });
        });
    });

    it("case of single dollar to run multiple times", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = {$collection: "countries", $insert: [
                {"_id": "india", "country": "india", "states": [
                    {"_id": "1", "state": "haryana", info: {"city": "hansi"}},
                    {"_id": "2", "state": "haryana"},
                    {"_id": "3", "state": "haryana"},
                    {"_id": "4", "state": "haryana"},
                    {"_id": "5", "state": "haryana"},
                    {"_id": "6", "state": "haryana"},
                    {"_id": "7", "state": "haryana"},
                    {"_id": "8", "state": "haryana"},
                    {"_id": "9", "state": "haryana"},
                    {"_id": "10", "state": "haryana"},
                    {"_id": "11", "state": "haryana"},
                    {"_id": "12", "state": "haryana"}
                ]}
            ]};
            db.batchUpdateById(updates, function (err, data) {
                if (err) {
                    done(err);
                    return;
                }
                var arrayUpdates = [
                    {$collection: "countries", "$update": [
                        {"$query": {"states.state": "haryana"}, "$set": {"states.$.state": "haryana1", "states.$.code": "xyz", "states.$.info.code": "002"}
                        }
                    ]}
                ];
                db.batchUpdate(arrayUpdates, {multi: true}, function (err, result) {
                    if (err) {
                        done(err);
                        return;
                    }
                    db.query({$collection: "countries"}, function (err, data) {
                        if (err) {
                            done(err);
                            return;
                        }
                        console.log("data in logs >>>>>>>>" + JSON.stringify(data));
                        expect(data.result).to.have.length(1);
                        expect(data.result[0].states[0].state).to.eql("haryana1");
                        expect(data.result[0].states[1].state).to.eql("haryana1");
                        expect(data.result[0].states[2].state).to.eql("haryana1");
                        expect(data.result[0].states[3].state).to.eql("haryana1");
                        expect(data.result[0].states[4].state).to.eql("haryana1");
                        expect(data.result[0].states[5].state).to.eql("haryana1");
                        expect(data.result[0].states[6].state).to.eql("haryana1");
                        expect(data.result[0].states[7].state).to.eql("haryana1");
                        expect(data.result[0].states[8].state).to.eql("haryana1");
                        expect(data.result[0].states[9].state).to.eql("haryana1");
                        expect(data.result[0].states[10].state).to.eql("haryana1");
                        expect(data.result[0].states[11].state).to.eql("haryana1");
                        done();
                    })
                });
            })
        });
    });

    it("case when unset in not working", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {$collection: {collection: "users", fields: [
                    {field: "artistid", type: "fk", upsert: true, collection: "artists" }
                ]}, "$insert": [
                    {_id: "111", artistid: {_id: "123123"}}
                ]}
            ];
            db.batchUpdateById(updates, function (err, data) {
                if (err) {
                    done(err);
                    return;
                }
                db.query({$collection: "users"}, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log("data after insert>>>>>>>>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(data));
                    expect(data.result).to.have.length(1);
                    expect(data.result[0].artistid._id).to.eql("123123");
                    var newUpdates = [
                        {$collection: {collection: "users", fields: [
                            {field: "artistid", type: "fk", upsert: true, collection: "artists" }
                        ]}, "$update": [
                            {_id: "111", $unset: {"artistid": 1}}
                        ]}
                    ];
                    db.batchUpdateById(newUpdates, function (err, data) {
                        if (err) {
                            done(err);
                            return;
                        }
                        db.query({$collection: "users"}, function (err, data) {
                            if (err) {
                                done(err);
                                return;
                            }
                            console.log("Data afterupdate>>>>>>>>>." + JSON.stringify(data));
                            expect(data.result).to.have.length(1);
                            expect(data.result[0].artistid).to.eql(undefined);
                            done();
                        });
                    });
                });
            });
        })
    })

    it.skip("required column of fk case from  dhirender", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {$collection: {collection: "tweets", fields: [
                    {field: "tweets", type: "object", multiple: true},
                    {field: "favtweetid", type: "fk", upsert: true, collection: "favtweets" }
                ]}, "$insert": [
                    {_id: "111", tweets: [
                        {_id: "tweet1"}
                    ]}
                ]}
            ];
            db.batchUpdateById(updates, function (err, data) {
                if (err) {
                    done(err);
                    return;
                }
                db.query({$collection: "tweets"}, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log("new data after insert>>>>>>>>>>" + JSON.stringify(data));
                    var tweetJob = {   name: "tweetJob", code: "tweetJob", source: "NorthwindTestCase/lib/TweetJob.js"};
                    var trigger = [
                        {
                            functionName: tweetJob,
                            operations: ["update"],
                            when: "pre",
                            requiredfields: {"tweets.favtweetid.tweetid": 1, "tweets.favtweetid.afavourite": 1}
                        }
                    ];
                    var newUpdates = [
                        {$collection: {collection: "tweets", triggers: trigger, fields: [
                            {field: "tweets", type: "object", multiple: true, fields: [
                                {field: "favtweetid", type: "fk", upsert: true, collection: {collection: "favtweets", fields: [
                                    {field: "tweetid", type: "string"},
                                    {field: "afavourite", type: "fk", upsert: true, multiple: true, collection: "artists"}
                                ]}}
                            ]}
                        ]}, "$update": [
                            {_id: "111", $set: { tweets: {$update: [
                                {_id: "tweet1", $set: {favtweetid: {$query: {tweetid: "1111"}, $set: {afavourite: {$insert: [
                                    {_id: "12334"}
                                ]}}}}}
                            ]}}}
                        ]}
                    ];
                    db.batchUpdateById(newUpdates, function (err, data) {
                        if (err) {
                            done(err);
                            return;
                        }
                        db.query({$collection: "tweets"}, function (err, data) {
                            if (err) {
                                done(err);
                                return;
                            }
                            console.log("new data after update>>>>>>>>>>" + JSON.stringify(data));
                            db.query({$collection: "favtweets"}, function (err, data) {
                                if (err) {
                                    done(err);
                                    return;
                                }
                                console.log("data in favtwwets update>>>>>>>>>>" + JSON.stringify(data));
                                done();
                            });
                        });
                    });
                });
            });
        });
    });

    it.skip("sort while updating in array", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {$collection: {collection: "myusers", fields: [
                    {field: "followers", type: "object", multiple: true, sort: "likes"}
                ]}, "$insert": [
                    {_id: "user1", "name": "ashish", followers: [
                        {_id: 1, follower: "manjeet", likes: 15},
                        {_id: 1, follower: "sachin", likes: 12},
                        {_id: 1, follower: "naveen", likes: 3}
                    ]}
                ]}
            ]
            db.batchUpdateById(updates, function (err, data) {
                if (err) {
                    done(err);
                    return;
                }
                var newUpdates = [
                    {$collection: {collection: "myusers", fields: [
                        {field: "followers", type: "object", multiple: true, sort: "likes"}
                    ]}, "$update": [
                        {_id: "user1", $set: {followers: {$insert: [
                            {_id: 1, follower: "ashu", likes: 87},
                            {_id: 1, follower: "rajit", likes: 55},
                            {_id: 1, follower: "sudeep", likes: 1}
                        ]}} }
                    ]}
                ];
                db.batchUpdateById(newUpdates, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    db.query({$collection: "myusers"}, function (err, data) {
                        if (err) {
                            done(err);
                            return;
                        }
                        console.log("data of myusers after update>>>>" + JSON.stringify(data));
                        expect(data.result).to.have.length(1);
                        expect(data.result[0].followers).to.have.length(6);
                        expect(data.result[0].followers[0].follower).to.eql("sudeep");
                        expect(data.result[0].followers[1].follower).to.eql("naveen");
                        expect(data.result[0].followers[2].follower).to.eql("sachin");
                        expect(data.result[0].followers[3].follower).to.eql("manjeet");
                        expect(data.result[0].followers[4].follower).to.eql("rajit");
                        expect(data.result[0].followers[5].follower).to.eql("ashu");

                        done();
                    });
                });
            });
        });
    });

    it("sequence in object in case of update", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {$collection: {collection: "myusers", fields: [
                    {field: "follower", type: "object", fields: [
                        {field: "name", type: "string"},
                        {field: "likes", type: "number"}
                    ]}
                ]}, "$insert": [
                    {_id: "user1", "name": "ashish", follower: { name: "manjeet"}
                    }
                ]}
            ]
            db.batchUpdateById(updates, function (err, data) {
                if (err) {
                    done(err);
                    return;
                }
                var newUpdates = [
                    {$collection: {collection: "myusers", fields: [
                        {field: "follower", type: "object", fields: [
                            {field: "name", type: "string"},
                            {field: "likes", type: "number"}
                        ]}
                    ]}, "$update": [
                        {_id: "user1", $set: {follower: {likes: 99, aname: "manjeet1"} }}
                    ]}
                ];
                db.batchUpdateById(newUpdates, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    db.query({$collection: "myusers"}, function (err, data) {
                        if (err) {
                            done(err);
                            return;
                        }
                        console.log("data of myusers after update>>>>" + JSON.stringify(data));
                        expect(data.result).to.have.length(1);
                        expect(data.result[0].follower.likes).to.eql(99);
                        expect(data.result[0].follower.aname).to.eql("manjeet1");
                        expect(data.result[0].follower.name).to.eql(undefined);
                        done();
                    });
                });
            });
        });
    });

    it.skip("nested  3 dollar updates error entry in pl.logs", function (done) {
        var COUNTRIES = "countries";
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {$collection: COUNTRIES, $insert: [
                    {"_id": "india", "country": "india", "states": [
                        {"_id": "haryana", "state": "haryana", "cities": [
                            {"id": "hisar", "city": "hisar", "schools": [
                                {"id": "vdjs", "school": "vdjs"},
                                {"id": "nyps", "school": "nyps"},
                                {"id": "nehru", "school": "nehru"}
                            ]},
                            {"id": "sirsa", "city": "sirsa", "schools": [
                                {"id": "jindal", "school": "jindal"},
                                {"id": "nehru", "school": "nehru"}
                            ]}
                        ]}
                    ]},
                    {"_id": "pakistan", "country": "pakistan", "states": [
                        {"_id": "lahore", "state": "lahore", "cities": [
                            {"id": "hisar", "city": "hisar", "schools": [
                                {"id": "vdjs", "school": "vdjs"},
                                {"id": "nyps", "school": "nyps"},
                                {"id": "nehru", "school": "nehru"}
                            ]},
                            {"id": "sirsa", "city": "sirsa", "schools": [
                                {"id": "jindal", "school": "jindal"},
                                {"id": "nehru", "school": "nehru"}
                            ]}
                        ]},
                        {"_id": "multan", "state": "multan", "cities": [
                            {"id": "hisar", "city": "hisar", "schools": [
                                {"id": "vdjs", "school": "vdjs"},
                                {"id": "nyps", "school": "nyps"},
                                {"id": "nehru", "school": "nehru"}
                            ]},
                            {"id": "sirsa", "city": "sirsa", "schools": [
                                {"id": "jindal", "school": "jindal"},
                                {"id": "nehru", "school": "nehru"}
                            ]}
                        ]}
                    ]},
                    {"_id": "usa", "country": "usa", "states": [
                        {"_id": "amsterdam", "state": "amsterdam", "cities": [
                            {"id": "hisar", "city": "hisar", "schools": [
                                {"id": "vdjs", "school": "vdjs"},
                                {"id": "nyps", "school": "nyps"},
                                {"id": "nehru", "school": "nehru"}
                            ]},
                            {"id": "sirsa", "city": "sirsa", "schools": [
                                {"id": "jindal", "school": "jindal"},
                                {"id": "nehru", "school": "nehru"}
                            ]}
                        ]}
                    ]}
                ]}
            ];

            db.batchUpdate(updates, function (err, result) {
                if (err) {
                    done(err);
                    return;
                }
                db.query({$collection: COUNTRIES, $sort: {country: 1}}, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log(">>>>>data>>>" + JSON.stringify(data));
                    expect(data.result).to.have.length(3);
                    expect(data.result[0].states).to.have.length(1);
                    expect(data.result[0].states[0].cities).to.have.length(2);
                    expect(data.result[0].states[0].cities[0].schools).to.have.length(3);
                    expect(data.result[0].states[0].cities[1].schools).to.have.length(2);
                    var arrayUpdates = [
                        {$collection: COUNTRIES, "$update": [
                            {"$query": {"states.cities.schools.school": "nehru"}, "$set": {"states.$.cities.$.schools.$.school": "nehru1", "states.$.state": "haryana1"}
                            }
                        ]}
                    ]
                    db.batchUpdate(arrayUpdates, function (err, updateResult) {
                        if (err) {
                            done(err);
                            return;
                        }
                        db.query({$collection: "pl.logs"}, function (err, data) {
                            if (err) {
                                done(err);
                                return;
                            }
                            console.log("data in pl.logs>>>>>" + JSON.stringify(data));
                            expect(data.result).to.have.length(3);
                            expect(data.result[0].message).to.eql("operation not supported with updates in set [{\"states.$.cities.$.schools.$.school\":\"nehru1\",\"states.$.state\":\"haryana1\"}]");
                            done();
                        })
                    })
                })

            })
        })
    });

    it("override a fk columns in update", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {$collection: {collection: "states", fields: [
                    {field: "countryid", upsert: true, type: "fk", collection: {collection: "countries"}, set: ["countryname"]},
                    {field: "cityid", type: "object", fields: [
                        {field: "cityname", type: "string"},
                        {field: "code", type: "string"}
                    ]}
                ]}, "$insert": [
                    {_id: "UP", "state": "UP", "countryid": {$query: {_id: "india", "countryname": "india"}, $set: {isfree: true}}, "cityid": {"cityname": "luchnow", code: "20"} }
                ]},
                {$collection: {collection: "states1", fields: [
                    {field: "countryid", type: "fk", collection: {collection: "countries"}, set: ["countryname"]},
                    {field: "cityid", type: "object", fields: [
                        {field: "cityname", type: "string"},
                        {field: "code", type: "string"}
                    ]}
                ]}, "$insert": [
                    {_id: "UP"}

                ]}
            ]
            db.batchUpdateById(updates, function (err, data) {
                if (err) {
                    done(err);
                    return;
                }
                var newUpdates = [
                    {$collection: {collection: "states1", fields: [
                        {field: "countryid", type: "fk", upsert: true, collection: {collection: "countries"}, set: ["countryname", "isfree"]},
                        {field: "cityid", type: "object", fields: [
                            {field: "cityname", type: "string"},
                            {field: "code", type: "string"}
                        ]}
                    ]}, "$update": [
                        {_id: "UP", $set: {state: "UP", countryid: {$set: {countryname: "india", isfree: true}}, cityid: {$set: {"cityname": "luchnow", code: "20"}} }}
                    ]}
                ];
                db.batchUpdateById(newUpdates, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }

                    db.query({$collection: "states1"}, function (err, data) {
                        if (err) {
                            done(err);
                            return;
                        }
                        console.log("data of states1 after update>>>>" + JSON.stringify(data));
                        var newUpdates11 = [
                            {$collection: {collection: "states1", fields: [
                                {field: "countryid", type: "fk", upsert: true, collection: {collection: "countries"}, set: ["countryname", "isfree"]},
                                {field: "cityid", type: "object", fields: [
                                    {field: "cityname", type: "string"},
                                    {field: "code", type: "string"}
                                ]}
                            ]}, "$update": [
                                {_id: "UP", $set: {countryid: {$set: {_id: "india1", countryname: "pakistan1"}} }}
                            ]}
                        ];
                        db.batchUpdateById(newUpdates11, function (err, data) {
                            if (err) {
                                done(err);
                                return;
                            }
                            db.query({$collection: "states1"}, function (err, data) {
                                if (err) {
                                    done(err);
                                    return;
                                }
                                console.log("data in states1 after second update>>>>" + JSON.stringify(data));
                                expect(data.result).to.have.length(1);
                                expect(data.result[0].countryid.countryname).to.eql("pakistan1");
                                done();
                            });
                        });
                    });
                });
            });
        });
    });


    it("error while updating task in array", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {$collection: {collection: "tasks", fields: [
                    {field: "progress", type: "object", multiple: "true", fields: [
                        {field: "status", type: "string"},
                        {field: "efforts", type: "duration"}
                    ]}
                ]}, $insert: [
                    {_id: "task1", "task": "task1", progress: [
                        {_id: "progress1", status: "in progress", efforts: {"time": "5", unit: "Hrs"}}
                    ]}
                ]}
            ];
            db.batchUpdateById(updates, function (err, result) {
                if (err) {
                    done(err);
                    return;
                }
                db.query({$collection: "tasks"}, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log("task data after insert" + JSON.stringify(data));
                    var newUpdates = [
                        {$collection: {collection: "tasks", fields: [
                            {field: "progress", type: "object", multiple: "true", fields: [
                                {field: "status", type: "string"},
                                {field: "efforts", type: "duration"}
                            ]}
                        ]}, $update: [
                            {_id: "task1", $set: {progress: {$update: [
                                {_id: "progress1", $set: {efforts: {time: "10", unit: "Hrs"}}}
                            ]}}}
                        ]}
                    ];
                    db.batchUpdateById(newUpdates, function (err, result) {
                        if (err) {
                            done(err);
                            return;
                        }
                        db.query({$collection: "tasks"}, function (err, data) {
                            if (err) {
                                done(err);
                                return;
                            }
                            console.log("task data after update" + JSON.stringify(data));
                            done();
                        });
                    })
                })
            })
        });
    });

    it("update in nested array using dollar insert", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {$collection: {collection: "invoice"}, "$insert": [
                    {_id: "1", "invoiceno": "12" }
                ]}
            ];

            db.batchUpdateById(updates, function (err, data) {
                if (err) {
                    done(err);
                    return;
                }
                var newUpdates = [
                    {$collection: {collection: "invoice"}, "$update": [
                        {_id: "1", $set: {lineitems: {$insert: [
                            {_id: 1233, amount: 100, deductions: {$insert: [
                                {_id: "31"}
                            ]}}
                        ]}}}
                    ]}
                ];
                db.batchUpdateById(newUpdates, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }

                    db.query({$collection: "invoice"}, function (err, data) {
                        if (err) {
                            done(err);
                            return;
                        }
                        console.log("data of invoice after update>>>>" + JSON.stringify(data));


                        expect(data.result).to.have.length(1);
                        expect(data.result[0].lineitems[0].deductions).to.have.length(1);
                        expect(data.result[0].lineitems[0].deductions[0]._id).to.eql("31");
                        done();

                    });
                });
            });
        });
    });

})
;



