/**
 *
 * mocha --recursive --timeout 150000 -g "Updatetestcase DataType2" --reporter spec
 *
 * mocha --recursive --timeout 150000 -g "simple insert with object in batchupdate" --reporter spec
 *
 * mocha --recursive --timeout 150000 -g "Filter DataType testcase" --reporter spec
 */
var expect = require('chai').expect;
var ApplaneDB = require("../lib/DB.js");
var Config = require("./config.js");


describe("Updatetestcase DataType2", function () {

    afterEach(function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            db.dropDatabase(function (err) {
                done(err);
            })
        });
    })

    it("simple insert with object in batchupdate", function (done) {
        var COUNTRIES = "countries";
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates =
            {$collection: {"collection": COUNTRIES, fields: [
                {field: "constitutiondate", type: "date"},
                {field: "country", type: "string", mandatory: true},
                {field: "isfree", type: "boolean"}
            ]}, $insert: {country: "India", code: "91", "constitutiondate": "1900-01-26", "isfree": true}
            }

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
                    done();

                })
            })
        })
    })

    it("simple insert with DataType", function (done) {
        var COUNTRIES = "countries";
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {$collection: {"collection": COUNTRIES, fields: [
                    {field: "constitutiondate", type: "date"},
                    {field: "country", type: "string", mandatory: true},
                    {field: "isfree", type: "boolean"}
                ]}, $insert: [
                    {country: "India", code: "91", "constitutiondate": "1900-01-26", "isfree": true},
                    {country: "USA", code: "01", "constitutiondate": "1900-01-26", "isfree": "TRUE"},
                    {country: "pakistan", code: "92", "constitutiondate": "1900-01-30", "isfree": "NAHI"}
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
                    console.log("data>>>" + JSON.stringify(data));
                    expect(data.result).to.have.length(3);
                    expect(data.result[0].constitutiondate.getDate()).to.eql(26);
                    expect(data.result[0].country).to.eql("India");
                    expect(data.result[0].isfree).to.eql(true);
                    expect(data.result[1].isfree).to.eql(true);
                    expect(data.result[2].isfree).to.eql(false);
                    done();

                })
            })
        })
    })

    it("Error in casting date while insert", function (done) {
        var COUNTRIES = "countries";
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {$collection: {"collection": COUNTRIES, fields: [
                    {field: "constitutiondate", type: "date"},
                    {field: "country", type: "string", mandatory: true},
                    {field: "isfree", type: "boolean"}
                ]}, $insert: [
                    { code: "92", "constitutiondate": "1900-01-30", "isfree": "NAHI"}
                ]
                }
            ]
            db.batchUpdateById(updates, function (err, result) {
                if (err) {
                    try {
                        expect(err.message).eql("Expression [country] is mandatory");
                        done();
                    } catch (e) {
                        done(e);
                    }
                    return;
                }
                expect(result).not.to.be.ok;
            })
        })
    })

    it("casting error while update", function (done) {
        var COUNTRIES = "countries";
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {$collection: {collection: COUNTRIES, fields: [
                    {field: "country", type: "string"},
                    {field: "code", type: "string"},
                    {field: "cdate", type: "date"}
                ]}, $insert: [
                    {country: "India", code: "91", "cdate": "1990-05-01"},
                    {country: "USA", code: "01", "cdate": "1990-05-02"}
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
                    expect(data.result).to.have.length(2);
                    expect(data.result[0].cdate.getDate()).to.eql(1);
                    expect(data.result[1].cdate.getDate()).to.eql(2);
                    var updates = [
                        {$collection: {collection: COUNTRIES, fields: [
                            {field: "country", type: "string"},
                            {field: "code", type: "string"},
                            {field: "cdate", type: "date"}
                        ]}, $update: [
                            {_id: data.result[0]._id, $set: {code: "+91", "cdate": "manjeet"}},
                            {_id: data.result[1]._id, $set: {code: "+01", "cdate": "rajit"}}
                        ]}
                    ]
                    db.batchUpdateById(updates, function (err, updateResult) {
                        if (err) {
                            try {
                                expect(err.message).to.eql("Error while casting for expression [cdate] with value [manjeet]");
                                done();
                            } catch (e) {
                                done(e);
                            }
                            return;
                        }
                        expect(updateResult).not.to.be.ok;
                    })
                })
            })
        })
    })

    it("insert with Object as DataType", function (done) {
        var COUNTRIES = "countries";
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {$collection: {collection: COUNTRIES, fields: [
                    {field: "constitutiondate", type: "date"},
                    {field: "country", type: "string"},
                    {field: "languages", type: "object", fields: [
                        {field: "name", type: "string"},
                        {field: "date", type: "date"}
                    ]},
                    {field: "constitutiondate", type: "date"},
                    {field: "address", type: "object", fields: [
                        {field: "line", type: "string"},
                        {field: "city", type: "object", fields: [
                            {"field": "city", type: "string"},
                            {"field": "date", type: "date"},
                            {"field": "district", type: "object", fields: [
                                {"field": "district", type: "string", fields: [
                                    {"field": "village", type: "object", fields: [
                                        {field: "goan", type: "string"}
                                    ]}
                                ]}
                            ]}
                        ]},
                        {field: "state", type: "object", fields: [
                            {"field": "state", type: "string"},
                            {"field": "date", type: "date"}
                        ]},
                        {field: "country", type: "object", fields: [
                            {"field": "country", type: "string"},
                            {"field": "date", type: "date"}
                        ]}
                    ]}
                ]}, $insert: [
                    {country: "India", code: "91", "constitutiondate": "1950-01-26", languages: {"name": "hindi", "date": "2014-01-01"}, address: {"line": "22", city: {"city": "Hisar", "date": "2014-01-05", district: {"district": "hansi", "village": {"goan": "mayad"} }}, state: {"state": "haryana", "date": "2014-06-02"}, country: {"country": "India", "date": "2014-04-22"}}},
                    {country: "USA", code: "01", "constitutiondate": "1900-01-26", languages: {"name": "english", "date": "2014-01-01"}, address: {"line": "street-1", city: {"city": "vegas", "date": "2014-01-02"}, state: {"state": "new york", "date": "2014-06-15"}, country: {"country": "USA", "date": "2014-04-30"}}},
                    {country: "Pakistan", code: "92", "constitutiondate": "1900-01-30", languages: {"name": "urdu", "date": "2014-01-01"}}
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
                    console.log("data>>> in case 2" + JSON.stringify(data));
                    expect(data.result).to.have.length(3);
                    expect(data.result[0].languages.name).to.eql("hindi");
                    expect(data.result[0].address.line).to.eql("22");
                    expect(data.result[0].address.city.city).to.eql("Hisar");
                    expect(data.result[0].address.city.date.getDate()).to.eql(05);
                    expect(data.result[0].address.city.district.district).to.eql("hansi");
                    expect(data.result[0].address.city.district.village.goan).to.eql("mayad");
                    expect(data.result[0].address.city.date.getDate()).to.eql(05);
                    expect(data.result[0].address.state.state).to.eql("haryana");
                    expect(data.result[0].address.state.date.getDate()).to.eql(02);
                    expect(data.result[0].address.country.country).to.eql("India");
                    expect(data.result[0].address.country.date.getDate()).to.eql(22);

                    expect(data.result[1].languages.name).to.eql("urdu");
                    expect(data.result[1].country).to.eql("Pakistan");

                    expect(data.result[2].languages.name).to.eql("english");
                    expect(data.result[2].address.line).to.eql("street-1");
                    expect(data.result[2].address.city.city).to.eql("vegas");
                    expect(data.result[2].address.city.date.getDate()).to.eql(02);
                    expect(data.result[2].address.state.state).to.eql("new york");
                    expect(data.result[2].address.state.date.getDate()).to.eql(15);
                    expect(data.result[2].address.country.country).to.eql("USA");
                    expect(data.result[2].address.country.date.getDate()).to.eql(30);
                    done();
                })
            })
        })
    })

    it("insert with Array as DataType", function (done) {
        var COUNTRIES = "countries";
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {$collection: {collection: COUNTRIES, fields: [
                    {field: "constitutiondate", type: "date"},
                    {field: "currency", type: "string"},
                    {field: "mycountry", type: "string"},
                    {field: "country", type: "object", fields: [
                        {field: "name", type: "string"},
                        {field: "states", type: "object", fields: [
                            {field: "state", type: "string"},
                            {field: "date", type: "date"},
                            {field: "cities", multiple: true, type: "object", "fields": [
                                {field: "city", type: "string"},
                                {field: "date", type: "date"},
                                {field: "schools", type: "object", multiple: true, fields: [
                                    {field: "school", type: "string"},
                                    {field: "date", type: "date"}
                                ]}
                            ]}
                        ], multiple: true}
                    ]}
                ]}, $insert: [
                    {mycountry: "India", code: "91", "constitutiondate": "1950-01-26", country: { name: "India", states: [
                        {"state": "haryana", "date": "2014-01-01", cities: [
                            {city: "hisar", date: "2012-03-04", schools: [
                                {school: "abc", date: "2014-5-9"},
                                {school: "dps", date: "1988-5-11"}
                            ]},
                            {city: "sirsa", date: "2012-03-22"}
                        ]},
                        {"state": "punjab", "date": "2012-01-09", cities: [
                            {city: "amritsar", date: "2011-09-08", schools: [
                                { school: "model", "date": "1788-3-26"}
                            ]},
                            {city: "ludhiana", date: "2011-09-25", schools: [
                                { school: "nursery", "date": "1788-8-09"}
                            ]}
                        ]}
                    ]}}
                    ,
                    {mycountry: "USA", code: "01", "constitutiondate": "1900-01-26", country: { name: "India", states: [
                        {"state": "toronto", "date": "2014-01-01"},
                        {"state": "new york", "date": "2014-01-01"}
                    ]}},
                    {mycountry: "Pakistan", code: "92", "constitutiondate": "1900-01-30", country: { name: "India", states: [
                        {"state": "lahore", "date": "2014-01-01"},
                        {"state": "multan", "date": "2014-01-01"}
                    ]}}
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
                    console.log("data>>>>>>>after insert>>>>>" + JSON.stringify(data));
                    expect(data.result).to.have.length(3);
                    expect(data.result[0].mycountry).to.eql("India");
                    expect(data.result[0].country.name).to.eql("India");
                    expect(data.result[0].country.states).to.have.length(2);

                    expect(data.result[0].country.states[0].state).to.eql("haryana");
                    expect(data.result[0].country.states[0].date.getDate()).to.eql(01);
                    expect(data.result[0].country.states[0].cities).to.have.length(2);
                    expect(data.result[0].country.states[0].cities[0].city).to.eql("hisar");
                    expect(data.result[0].country.states[0].cities[0].date.getDate()).to.eql(04);
                    expect(data.result[0].country.states[0].cities[0].schools).to.have.length(2);
                    expect(data.result[0].country.states[0].cities[0].schools[0].school).to.eql("abc");
                    expect(data.result[0].country.states[0].cities[0].schools[0].date.getDate()).to.eql(9);
                    expect(data.result[0].country.states[0].cities[0].schools[1].school).to.eql("dps");
                    expect(data.result[0].country.states[0].cities[0].schools[1].date.getDate()).to.eql(11);
                    expect(data.result[0].country.states[0].cities[1].city).to.eql("sirsa");
                    expect(data.result[0].country.states[0].cities[1].date.getDate()).to.eql(22);

                    expect(data.result[0].country.states[1].state).to.eql("punjab");
                    expect(data.result[0].country.states[1].date.getDate()).to.eql(09);
                    expect(data.result[0].country.states[1].cities).to.have.length(2);
                    expect(data.result[0].country.states[1].cities[0].city).eql("amritsar");
                    expect(data.result[0].country.states[1].cities[0].date.getDate()).eql(08);
                    expect(data.result[0].country.states[1].cities[0].schools).to.have.length(1);
                    expect(data.result[0].country.states[1].cities[0].schools[0].school).to.eql("model");
                    expect(data.result[0].country.states[1].cities[0].schools[0].date.getDate()).to.eql(26);

                    expect(data.result[0].country.states[1].cities[1].city).eql("ludhiana");
                    expect(data.result[0].country.states[1].cities[1].date.getDate()).eql(25);
                    expect(data.result[0].country.states[1].cities[1].schools).to.have.length(1);
                    expect(data.result[0].country.states[1].cities[1].schools[0].school).to.eql("nursery");
                    expect(data.result[0].country.states[1].cities[1].schools[0].date.getDate()).to.eql(09);
                    done();
                })
            })
        })
    })

    it("insert with Decimal as DataType", function (done) {
        var COUNTRIES = "countries";
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {$collection: {collection: COUNTRIES, fields: [
                    {field: "constitutiondate", type: "date"},
                    {field: "country", type: "string"},
                    {field: "CurrentTemp", type: "decimal"},
                    {field: "languages", type: "object", fields: [
                        {field: "name", type: "string"},
                        {field: "date", type: "date"}
                    ], multiple: true}
                ]}, $insert: [
                    {country: "India", code: "91", "constitutiondate": "1950-01-26", CurrentTemp: 25.5, languages: {"name": "hindi", "date": "2014-01-01"}},
                    {country: "USA", code: "01", "constitutiondate": "1900-01-26", CurrentTemp: 15, languages: {"name": "english", "date": "2014-01-01"}},
                    {country: "Pakistan", code: "92", "constitutiondate": "1900-01-30", CurrentTemp: 28, languages: {"name": "urdu", "date": "2014-01-01"}}
                ], $fields: {"constitutiondate": {$type: {date: {}}}, "country": {$type: {string: {length: 50}}}, "CurrentTemp": {$type: {decimal: {}}}, "languages": {$type: {object: {$fields: {name: {$type: {string: {}}}, date: {$type: {date: {}}}}}}, $multiple: true}}}
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
                    console.log("data>>> in case 2" + JSON.stringify(data));
                    expect(data.result).to.have.length(3);
                    expect(data.result[0].languages.name).to.eql("hindi");
                    expect(data.result[0].CurrentTemp).to.eql(25.5);     //PASSING
                    expect(data.result[1].CurrentTemp).to.eql(28);
                    done();
                })
            })
        })
    })

    it(" insert with Integer as DataType", function (done) {
        var COUNTRIES = "countries";
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {$collection: {collection: COUNTRIES, fields: [
                    {field: "constitutiondate", type: "date"},
                    {field: "country", type: "string"},
                    {field: "CurrentTemp", type: "integer"},
                    {field: "languages", type: "object", fields: [
                        {field: "name", type: "string"},
                        {field: "date", type: "date"}
                    ], multiple: true}
                ]}, $insert: [
                    {country: "India", code: "91", "constitutiondate": "1950-01-26", CurrentTemp: 25, languages: {"name": "hindi", "date": "2014-01-01"}},
                    {country: "USA", code: "01", "constitutiondate": "1900-01-26", CurrentTemp: 15, languages: {"name": "english", "date": "2014-01-01"}},
                    {country: "Pakistan", code: "92", "constitutiondate": "1900-01-30", CurrentTemp: 28.2, languages: {"name": "urdu", "date": "2014-01-01"}}
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
                    console.log("***************data>>> in case 2" + JSON.stringify(data));
                    expect(data.result).to.have.length(3);
                    expect(data.result[0].languages.name).to.eql("hindi");
                    expect(data.result[1].CurrentTemp).to.eql(28);
                    done();
                })
            })
        })
    })

    it("update with Array in datatype module without id and ensure _id is generated", function (done) {
        var COUNTRIES = "countries";
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {$collection: {collection: COUNTRIES, fields: [
                    {field: "country", type: "string"},
                    {field: "code", type: "string"},
                    {field: "states", type: "object", fields: [
                        {field: "state", type: "string"},
                        {field: "date", type: "date"}
                    ], multiple: true}
                ]}, $insert: [
                    { country: "India", code: "91", "states": [
                        {state: "haryana", "date": "2020-02-02"},
                        { state: "punjab", "date": "2020-02-10"}
                    ]},
                    {country: "USA", code: "01", "states": [
                        { state: "newyork", "date": "2020-02-23"},
                        { state: "canada", "date": "2020-02-18"}
                    ]},
                    {country: "pakistan", code: "92", "states": { $insert: [
                        { state: "islamabad", "date": "2020-02-23"},
                        { state: "lahore", "date": "2020-02-18"}
                    ]}}
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
                    console.log("data>>>>" + JSON.stringify(data));
                    expect(data.result).to.have.length(3);
                    expect(data.result[0]._id).exists;
                    expect(data.result[0].states).to.have.length(2);
                    expect(data.result[0].states[0]._id).exists;
                    expect(data.result[0].states[1]._id).exists;
                    expect(data.result[1].states).to.have.length(2);
                    var arrayUpdates = [
                        {$collection: {collection: COUNTRIES, fields: [
                            {field: "country", type: "string"},
                            {field: "code", type: "string"},
                            {field: "states", type: "object", fields: [
                                {field: "state", type: "string"},
                                {field: "date", type: "date"}
                            ], multiple: true}
                        ]}, $update: [
                            {"_id": data.result[0]._id,
                                $set: {country: "India11", states: {$insert: [
                                    {state: "bihar", date: "2021-12-01"}
                                ], $update: [
                                    {$query: {state: "haryana"}, $set: {state: "haryana1", date: "2050-02-05"}}
                                ]}}
                            }
                        ]}
                    ]
                    db.batchUpdateById(arrayUpdates, function (err, updateResult) {
                        db.query({$collection: COUNTRIES, $sort: {country: 1}}, function (err, data) {
                            if (err) {
                                done(err);
                                return;
                            }
                            expect(data.result).to.have.length(3);
                            expect(data.result[0].country).to.eql("India11");
                            expect(data.result[0].states).to.have.length(3);
                            expect(data.result[0].states[0].state).to.eql("haryana1");
                            expect(data.result[0].states[0].date.getMonth()).to.eql(01);
                            expect(data.result[0].states[2].state).to.eql("bihar");
                            expect(data.result[0].states[2].date.getFullYear()).to.eql(2021);
                            done();
                        })
                    })
                })
            })
        })
    })

    it("update with Array and remove mandatory field from array", function (done) {
        var COUNTRIES = "countries";
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {$collection: {collection: COUNTRIES, fields: [
                    {field: "country", type: "string"},
                    {field: "code", type: "string"},
                    {field: "states", type: "object", fields: [
                        {field: "state", type: "string", mandatory: true},
                        {field: "date", type: "date"}
                    ], multiple: true}
                ]}, $insert: [
                    { country: "India", code: "91", "states": [
                        {state: "haryana", "date": "2020-02-02"},
                        { state: "punjab", "date": "2020-02-10"}
                    ]},
                    {country: "USA", code: "01", "states": [
                        { state: "newyork", "date": "2020-02-23"},
                        { state: "canada", "date": "2020-02-18"}
                    ]}
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
                    console.log("data>>>>" + JSON.stringify(data));
                    expect(data.result).to.have.length(2);
                    expect(data.result[0]._id).exists;
                    expect(data.result[0].states).to.have.length(2);
                    expect(data.result[0].states[0]._id).exists;
                    expect(data.result[0].states[1]._id).exists;
                    expect(data.result[1].states).to.have.length(2);
                    var arrayUpdates = [
                        {$collection: {collection: COUNTRIES, fields: [
                            {field: "country", type: "string"},
                            {field: "code", type: "string"},
                            {field: "states", type: "object", fields: [
                                {field: "state", type: "string", mandatory: true},
                                {field: "date", type: "date"}
                            ], multiple: true}
                        ]}, $update: [
                            {"_id": data.result[0]._id,
                                $set: {country: "India11", states: {$insert: [
                                    {state: "bihar", date: "2021-12-01"}
                                ], $update: [
                                    {$query: {state: "haryana"}, $set: {state: "", date: "2050-02-05"}}
                                ]}}
                            }
                        ]}
                    ]
                    db.batchUpdateById(arrayUpdates, function (err, updateResult) {
                        if (err) {
                            try {
                                expect(err.message).to.eql("Expression [states.state] is mandatory");
                                done();
                            } catch (err) {
                                done(err);
                            }
                            return;
                        }
                        expect(updateResult).not.to.be.ok;
                    })
                })
            })
        })
    })

    it("update object multiple type field", function (done) {      //wrong
        var COUNTRIES = "countries";
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {$collection: {collection: COUNTRIES, fields: [
                    {field: "country", type: "string"},
                    {field: "code", type: "string"},
                    {field: "normalTemp", type: "number"},
                    {field: "date", type: "date"},
                    {field: "states", type: "object", multiple: true, fields: [
                        {field: "state", type: "string"},
                        {field: "city", type: "object", fields: [
                            {field: "city", type: "string"}
                        ]}
                    ]}
                ]}, $insert: [
                    {country: "India", code: "91", normalTemp: 25, date: "1950-01-30", "states": [
                        {_id: "haryana", state: "haryana", city: {"city": "hisar", "date": "2012-02-04"}},
                        {_id: "punjab", state: "punjab", city: {"city": "amritsar", "date": "2012-02-08"}}
                    ]},
                    {country: "USA", code: "01", normalTemp: 15, date: "1966-05-18", "states": [
                        {_id: "newyork", state: "newyork", city: {"city": "vegas", "date": "2012-02-13"}},
                        {_id: "canada", state: "canada", city: {"city": "toronto", "date": "2012-02-27"}}
                    ]}
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
                    console.log("data after insert>>>" + JSON.stringify(data));
                    expect(data.result).to.have.length(2);
                    expect(data.result[0].states).to.have.length(2);
                    expect(data.result[1].states).to.have.length(2);
                    var arrayUpdates = [
                        {$collection: {collection: COUNTRIES, fields: [
                            {field: "country", type: "string"},
                            {field: "code", type: "string"},
                            {field: "normalTemp", type: "number"},
                            {field: "date", type: "date"},
                            {field: "states", type: "object", multiple: true, fields: [
                                {field: "state", type: "string"},
                                {field: "city", type: "object", fields: [
                                    {field: "city", type: "string"}
                                ]}
                            ]}
                        ]}, $update: [
                            {"_id": data.result[0]._id, $set: {"date": "1950-02-26", states: {
                                $update: [
                                    {$query: {state: "haryana"}, $set: {"state": "haryana1", city: {$set: {city: "hisar1"}}}}
                                ]
                            }}},
                            {"_id": data.result[1]._id, $set: {"date": "1950-07-02", states: {
                                $update: [
                                    {$query: {state: "newyork"}, $set: {"state": "newyork1", city: {$set: {city: "lasvegas"}}}}
                                ]
                            }}}

                        ]}
                    ]

                    db.batchUpdateById(arrayUpdates, function (err, updateResult) {
                        if (err) {
                            done(err);
                            return;
                        }
                        db.query({$collection: COUNTRIES, $sort: {country: 1}}, function (err, data) {
                            if (err) {
                                done(err);
                                return;
                            }
                            console.log("data>>after update>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(data));
                            expect(data.result).to.have.length(2);
                            expect(data.result[0].country).to.eql("India");
                            expect(data.result[1].country).to.eql("USA");
                            expect(data.result[0].date.getDate()).to.eql(26);
                            done();
                        })
                    })
                })
            })
        })
    })

    it("case from dhirender to set  boolean value ", function (done) {
        var COUNTRIES = "countries";
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {$collection: {"collection": COUNTRIES, fields: [
                    {field: "constitutiondate", type: "date"},
                    {field: "country", type: "string", mandatory: true},
                    {field: "isfree", type: "boolean"}
                ]}, $insert: [
                    {_id: "India", country: "India", code: "91", "constitutiondate": "1900-01-26", "isfree": true},
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

                    expect(data.result).to.have.length(1);
                    expect(data.result[0].constitutiondate.getDate()).to.eql(26);
                    expect(data.result[0].country).to.eql("India");
                    expect(data.result[0].isfree).to.eql(true);


                    var update = [
                        {$collection: {"collection": COUNTRIES, fields: [
                            {field: "constitutiondate", type: "date"},
                            {field: "country", type: "string", mandatory: true},
                            {field: "isfree", type: "boolean"}
                        ]}, $update: [
                            {_id: "India", $set: {isfree: false}}
                        ]}
                    ];
                    db.batchUpdateById(update, function (err, data) {
                        if (err) {
                            done(err);
                            return;
                        }
                        db.query({$collection: COUNTRIES, $sort: {country: 1}}, function (err, data) {
                            if (err) {
                                done(err);
                                return;
                            }
                            expect(data.result).to.have.length(1);
                            expect(data.result[0].isfree).to.eql(false);
                            done();
                        });
                    });
                })
            })
        })

    });

    it("case from dhirender to increment score", function (done) {
        var COUNTRIES = "countries";
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {$collection: {"collection": COUNTRIES, fields: [
                    {field: "country", type: "string", mandatory: true},
                    {field: "rank", type: "number"}
                ]}, $insert: [
                    {_id: "India", country: "India", "rank": 99}
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

                    expect(data.result).to.have.length(1);
                    expect(data.result[0].country).to.eql("India");
                    expect(data.result[0].rank).to.eql(99);


                    var update = [
                        {$collection: {"collection": COUNTRIES, fields: [
                            {field: "country", type: "string", mandatory: true},
                            {field: "rank", type: "number"}
                        ]}, $update: [
                            {_id: "India", $inc: {rank: 1}}
                        ]}
                    ];
                    db.batchUpdateById(update, function (err, data) {
                        if (err) {
                            done(err);
                            return;
                        }
                        db.query({$collection: COUNTRIES, $sort: {country: 1}}, function (err, data) {
                            if (err) {
                                done(err);
                                return;
                            }
                            expect(data.result).to.have.length(1);
                            expect(data.result[0].rank).to.eql(100);
                            done();
                        });
                    });
                })
            })
        })

    });

});

describe("Filter DataType testcase", function () {

    afterEach(function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            db.dropDatabase(function (err) {
                done(err);
            })
        });
    })

    it("datetype filter", function (done) {
        var COUNTRIES = "countries";
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {$collection: {"collection": COUNTRIES, fields: [
                    {field: "constitutiondate", type: "date"},
                    {field: "country", type: "string", mandatory: true},
                    {field: "isfree", type: "boolean"}
                ]}, $insert: [
                    {country: "India", code: "91", "constitutiondate": "1900-01-26", "isfree": true},
                    {country: "USA", code: "01", "constitutiondate": "1900-01-26", "isfree": "TRUE"},
                    {country: "pakistan", code: "92", "constitutiondate": "1900-01-30", "isfree": "NAHI"}
                ]
                }
            ]
            db.batchUpdateById(updates, function (err, result) {
                if (err) {
                    done(err);
                    return;
                }
                db.query({$collection: {"collection": COUNTRIES, fields: [
                    {field: "constitutiondate", type: "date"},
                    {field: "country", type: "string", mandatory: true},
                    {field: "isfree", type: "boolean"}
                ]}, $sort: {country: 1}, $filter: {"constitutiondate": "1900-01-30"}}, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    expect(data.result).to.have.length(1);
                    expect(data.result[0].constitutiondate.getDate()).to.eql(30);
                    expect(data.result[0].country).to.eql("pakistan");
                    expect(data.result[0].isfree).to.eql(false);
                    ;
                    done();

                })
            })
        })
    })

    it("datetype $gt and $lt in filter", function (done) {
        var COUNTRIES = "countries";
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {$collection: {"collection": COUNTRIES, fields: [
                    {field: "constitutiondate", type: "date"},
                    {field: "country", type: "string", mandatory: true},
                    {field: "isfree", type: "boolean"}
                ]}, $insert: [
                    {country: "India", code: "91", "constitutiondate": "1900-01-26", "isfree": true},
                    {country: "USA", code: "01", "constitutiondate": "1900-01-26", "isfree": "TRUE"},
                    {country: "pakistan", code: "92", "constitutiondate": "1900-01-30", "isfree": "NAHI"}
                ]
                }
            ]
            db.batchUpdateById(updates, function (err, result) {
                if (err) {
                    done(err);
                    return;
                }
                db.query({$collection: {"collection": COUNTRIES, fields: [
                    {field: "constitutiondate", type: "date"},
                    {field: "country", type: "string", mandatory: true},
                    {field: "isfree", type: "boolean"}
                ]}, $sort: {country: 1}, $filter: {"constitutiondate": {$gt: "1800-01-30", $lt: "2000-01-30"}}}, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    expect(data.result).to.have.length(3);
                    expect(data.result[2].constitutiondate.getDate()).to.eql(30);
                    expect(data.result[2].country).to.eql("pakistan");
                    expect(data.result[2].isfree).to.eql(false);
                    ;
                    done();

                })
            })
        })
    })

    it("datetype $or and $and in filter", function (done) {
        var COUNTRIES = "countries";
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {$collection: {"collection": COUNTRIES, fields: [
                    {field: "constitutiondate", type: "date"},
                    {field: "country", type: "string", mandatory: true},
                    {field: "isfree", type: "boolean"}
                ]}, $insert: [
                    {country: "India", code: "91", "constitutiondate": "1900-01-26", "isfree": true},
                    {country: "USA", code: "01", "constitutiondate": "1900-05-26", "isfree": "TRUE"},
                    {country: "pakistan", code: "92", "constitutiondate": "1900-01-30", "isfree": "NAHI"}
                ]
                }
            ]
            db.batchUpdateById(updates, function (err, result) {
                if (err) {
                    done(err);
                    return;
                }
                db.query({$collection: {"collection": COUNTRIES, fields: [
                    {field: "constitutiondate", type: "date"},
                    {field: "country", type: "string", mandatory: true},
                    {field: "isfree", type: "boolean"}
                ]}, $sort: {country: 1}, $filter: {$or: [
                    {"constitutiondate": "1900-01-26"},
                    {"constitutiondate": "1900-01-30"}
                ]}}, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    expect(data.result).to.have.length(2);
                    expect(data.result[0].constitutiondate.getDate()).to.eql(26);
                    expect(data.result[0].country).to.eql("India");
                    expect(data.result[0].isfree).to.eql(true);
                    expect(data.result[1].constitutiondate.getDate()).to.eql(30);
                    expect(data.result[1].country).to.eql("pakistan");
                    expect(data.result[1].isfree).to.eql(false);
                    ;
                    done();

                })
            })
        })
    })


    it("datetype filter on object no cast if fields are not provided", function (done) {
        var COUNTRIES = "countries";
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {$collection: {"collection": "vouchers", fields: [
                    {field: "vli", type: "object", fields: [
                        {field: "accountgroupid", type: "fk", "collection": "accountgroups", upsert: true, set: ["account"]}
                    ], multiple: true}
                ]}, $insert: [
                    {vli: [
                        {accountgroupid: {$query: {"_id": "1234", account: "abc"}}},
                        {accountgroupid: {$query: {"_id": "5678", account: "def"}}}
                    ], voucherno: "124"}
                ]
                }
            ]
            db.batchUpdateById(updates, function (err, result) {
                if (err) {
                    done(err);
                    return;
                }
                db.query({$collection: {"collection": "vouchers", fields: [
                    {field: "vli", type: "object", fields: [
                        {field: "accountgroupid", type: "fk", "collection": "accountgroups"}
                    ], multiple: true}
                ]}, $filter: {"vli.accountgroupid._id": "1234"}}, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log("data>>>" + JSON.stringify(data));
                    expect(data.result).to.have.length(1);
                    done();
                });
            })
        })
    });

    it("datetype $or and $and in filter on array of dates", function (done) {
        var COUNTRIES = "countries";
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {$collection: {"collection": COUNTRIES, fields: [
                    {field: "constitutiondate", type: "date"},
                    {field: "country", type: "string", mandatory: true},
                    {field: "isfree", type: "boolean"},
                    {field: "holidays", type: "date", multiple: true}
                ]}, $insert: [
                    {country: "India", code: "91", "constitutiondate": "1948-01-26", "isfree": true, "holidays": ["2014-01-01", "2014-10-01", "2014-02-14", "2014-04-14"]},
                    {country: "Pakistan", code: "92", "constitutiondate": "1950-01-02", "isfree": true, "holidays": ["2014-01-01", "2014-04-14", "2014-03-04"]}
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
                    console.log("data>>>" + JSON.stringify(data));
                    expect(data.result).to.have.length(2);
                    expect(data.result[0].holidays).to.have.length(4);
                    db.query({$collection: {"collection": COUNTRIES, fields: [
                        {field: "constitutiondate", type: "date"},
                        {field: "country", type: "string", mandatory: true},
                        {field: "isfree", type: "boolean"},
                        {field: "holidays", type: "date", multiple: true}
                    ]}, $sort: {country: 1}, $filter: {"holidays": {"$in": ["2014-03-04", "2014-01-01"]}}}, function (err, data) {
                        if (err) {
                            done(err);
                            return;
                        }
                        expect(data.result).to.have.length(2);
                        done();

                    })
                });

            })
        })


    });


    it("filter on number type field", function (done) {
        var COUNTRIES = "countries";
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {$collection: {"collection": COUNTRIES, fields: [
                    {field: "constitutiondate", type: "date"},
                    {field: "country", type: "string", mandatory: true},
                    {field: "code", type: "number"},
                    {field: "holidays", type: "date", multiple: true}
                ]}, $insert: [
                    {country: "India", code: "91", "constitutiondate": "1948-01-26", "isfree": true},
                    {country: "Pakistan", code: "92", "constitutiondate": "1950-01-02", "isfree": true}
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
                    console.log("data>>>" + JSON.stringify(data));
                    expect(data.result).to.have.length(2);
                    expect(data.result[0].code).to.eql(91);
                    db.query({$collection: {"collection": COUNTRIES, fields: [
                        {field: "constitutiondate", type: "date"},
                        {field: "country", type: "string", mandatory: true},
                        {field: "code", type: "number"},
                        {field: "holidays", type: "date", multiple: true}
                    ]}, $sort: {country: 1}, $filter: {"code": "91"}}, function (err, data) {
                        if (err) {
                            done(err);
                            return;
                        }
                        expect(data.result).to.have.length(1);
                        done();

                    })
                });

            })
        })


    });


    it.skip("filter case dhirender issue", function (done) {
        done();
    });
});