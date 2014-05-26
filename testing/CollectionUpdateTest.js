var expect = require('chai').expect;
var ApplaneDB = require("../lib/DB.js");
var Config = require("./config.js");


describe("collectionUpdate", function () {
    afterEach(function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            db.dropDatabase(function (err) {
                done(err);
            })
        });
    })

    it("collection update Test", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var insert = [
                {$collection:"pl.collections", $insert:[
                    {_id:1001, "collection":"myCollection"}
                ]}
            ]
            db.batchUpdateById(insert, function (err, result) {
                if (err) {
                    done(err);
                    return;
                }
                db.query({$collection:"pl.collections"}, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    expect(data.result).to.have.length(1);
                    expect(data.result[0].collection).to.eql("myCollection");
                    expect(data.result[0].db).to.eql("northwindtestcases");
                    var update = [
                        {$collection:"pl.collections", $update:[
                            {_id:1001, $set:{"collection":"updatedCollection"} }
                        ]}
                    ]

                    db.batchUpdateById(update, function (err, result) {
                        if (err) {
                            if (err.toString().indexOf("Collection name cannot be update") != -1) {
                                done();
                            } else {
                                done(err);
                            }
                        } else {
                            done("Not Ok");
                        }
                    })
                })
            });
        })
    })
})


