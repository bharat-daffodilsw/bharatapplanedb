/**
 *  mocha --recursive --timeout 150000 -g "AsyncUpdatestestcase" --reporter spec
 */
var expect = require('chai').expect;
var ApplaneDB = require("../lib/DB.js");
var Config = require("./config.js");


describe("AsyncUpdatestestcase", function () {


    afterEach(function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            db.dropDatabase(function (err) {
                done(err);
            })
        });
    })


    it("asynctest", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {$collection: "countries", "$insert": [
                    {country: "india"}
                ]}
            ];
            db.startTransaction(function (txid) {
                db.addToOnCommitQueue(updates).then(function () {
                    console.log("successfully added to queue");
                    done();
                }).fail(function (e) {
                        console.log("error while adding to queue" + e);
                        done();
                    });
            });
        });
    });
});
