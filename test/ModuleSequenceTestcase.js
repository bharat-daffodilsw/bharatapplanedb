/*
 * mocha --recursive --timeout 150000 -g "ModuleSequencetestcase" --reporter spec
 */


var expect = require('chai').expect;
var ApplaneDB = require("../lib/DB.js");
var Config = require("./config.js");


describe("ModuleSequencetestcase", function () {
    afterEach(function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            db.dropDatabase(function (err) {
                var ModuleManager = require("../lib/ModuleManager.js");
                done(err);
            });
        });
    });

    it("clone test", function (done) {
        var ModuleManager = require("../lib/ModuleManager.js");
//        expect(ModuleManager.getSequence("query")).to.have.length(0);
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            db.query({$collection: "tasks"}, function (err, result) {
                if (err) {
                    done(err);
                    return;
                }
                console.log("qurey sequence>>>" + JSON.stringify(ModuleManager.getSequence("query")));
                expect(ModuleManager.getSequence("query")).to.have.length(10);
                expect(ModuleManager.getSequence("query")[0].name).to.eql("UDT");
                expect(ModuleManager.getSequence("query")[1].name).to.eql("Child");
                expect(ModuleManager.getSequence("query")[2].name).to.eql("Recursion");
                expect(ModuleManager.getSequence("query")[3].name).to.eql("DBRef");
                expect(ModuleManager.getSequence("query")[4].name).to.eql("SubQuery");
                expect(ModuleManager.getSequence("query")[5].name).to.eql("Group");
                expect(ModuleManager.getSequence("query")[6].name).to.eql("Function");
                expect(ModuleManager.getSequence("query")[7].name).to.eql("DataType");
                expect(ModuleManager.getSequence("query")[8].name).to.eql("TriggerRequiredFields");
                expect(ModuleManager.getSequence("query")[9].name).to.eql("TriggerModule");
                var update = [
                    {"$collection": "tasks", $insert: [
                        {_id: 1, name: "manjeet"}
                    ]}
                ]
                db.batchUpdateById(update, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log("update sequence>>>" + JSON.stringify(ModuleManager.getSequence("update")));
                    expect(ModuleManager.getSequence("update")).to.have.length(11);
                    expect(ModuleManager.getSequence("update")[0].name).to.eql("UDT");
                    expect(ModuleManager.getSequence("update")[1].name).to.eql("Recursion");
                    expect(ModuleManager.getSequence("update")[2].name).to.eql("Replicate");
                    expect(ModuleManager.getSequence("update")[3].name).to.eql("MergeLocalAdminDB");
                    expect(ModuleManager.getSequence("update")[4].name).to.eql("DBRef");
                    expect(ModuleManager.getSequence("update")[5].name).to.eql("Function");
                    expect(ModuleManager.getSequence("update")[6].name).to.eql("DataType");
                    expect(ModuleManager.getSequence("update")[7].name).to.eql("TriggerRequiredFields");
                    expect(ModuleManager.getSequence("update")[8].name).to.eql("TriggerModule");
                    expect(ModuleManager.getSequence("update")[9].name).to.eql("Child");
                    expect(ModuleManager.getSequence("update")[10].name).to.eql("TransactionModule");
                    done();
                });
            });
        });
    });

});

