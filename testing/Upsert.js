/**
 * mocha --recursive --timeout 150000 -g "Upsert TestCases" --reporter spec
 * mocha --recursive --timeout 150000 -g "Upsert without query" --reporter spec
 *
 * Created with IntelliJ IDEA.
 * User: Administrator
 * Date: 4/8/14
 * Time: 1:11 PM
 * To change this template use File | Settings | File Templates.
 */

var expect = require('chai').expect;
var ApplaneDB = require("../lib/DB.js");
var Config = require("./config.js");


describe("Upsert testcase", function () {

    afterEach(function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            db.dropDatabase(function (err) {
                done(err);
            })
        });
    })

    it("simple Upsert", function (done) {
        var COUNTRIES = "countries";
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {$collection: COUNTRIES, $insert: [
                    {country: "USA", code: "01", "states": [
                        {_id: "newyork", state: "newyork"},
                        {_id: "canada", state: "canada"}
                    ]},
                    {country: "China", code: "01", "states": [
                        {_id: "bejing", state: "bejing"},
                        {_id: "tokyo", state: "tokyo"}
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
                    console.log("data>>>" + JSON.stringify(data));
                    expect(data.result).to.have.length(2);
                    expect(data.result[0].states).to.have.length(2);
                    expect(data.result[1].states).to.have.length(2);
                    var newUpdates = [
                        {$collection: COUNTRIES, $upsert: [
                            {$query: {"country": "india"}, $set: {"states": [
                                {"state": "haryana", "_id": "haryana"}
                            ]}, $fields: {"country": 1, "states": 1}
                            }
                        ]}
                        ,
                        {$collection: COUNTRIES, $upsert: [
                            {$query: {"country": "USA"}, $set: {"country": "USA1", "states": {$insert: [
                                {"_id": "las vegas", "state": "las vegas"}
                            ]}}, $fields: {"country": 1, "states": 1}
                            }
                        ]}
                    ]
                    db.batchUpdateById(newUpdates, function (err, result) {
                        if (err) {
                            done(err);
                            return;
                        }
                        expect(result["countries"]["$upsert"]).to.have.length(2);
                        expect(result["countries"]["$upsert"][1].country).to.eql("USA1");
                        done();
                    })


                })

            })


        })


    })

    it("Upsert without query", function (done) {
        var COUNTRIES = "countries";
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {$collection: COUNTRIES, $insert: [
                    {country: "USA", code: "01", "states": [
                        {_id: "newyork", state: "newyork"},
                        {_id: "canada", state: "canada"}
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
                    expect(data.result).to.have.length(1);
                    expect(data.result[0].states).to.have.length(2);
                    var newUpdates = [
                        {$collection: COUNTRIES, $upsert: [
                            {$set: {"states": [
                                {"state": "haryana", "_id": "haryana"}
                            ]}, $fields: {"country": 1, "states": 1}
                            }
                        ]}
                    ]
                    db.batchUpdateById(newUpdates, function (err, result) {
                        if (err) {
                            done(err);
                            return;
                        }
                        expect(result["countries"]["$upsert"]).to.have.length(1);
                        expect(result["countries"]["$upsert"][0].country).to.eql(undefined);
                        db.query({$collection: COUNTRIES}, function (err, data) {
                            if (err) {
                                done(err);
                                return;
                            }
                            expect(data.result).to.have.length(2);
                            done();
                        })
                    })
                })
            })
        })
    })
})
