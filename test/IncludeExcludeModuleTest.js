/**
* mocha --recursive --timeout 150000 -g "IncludeExcludeModuletestcase" --reporter spec
*/

var expect = require('chai').expect;
var ApplaneDB = require("../lib/DB.js");
var Config = require("./config.js");

describe("IncludeExcludeModuletestcase", function () {
    afterEach(function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            db.dropDatabase(function (err) {
                console.log("drop...");
                var ModuleManager = require("../lib/ModuleManager.js");
                ModuleManager.unRegisterModule("IncludeExcludeModule");
                ModuleManager.unRegisterModule("IncludeExcludeModule1");
                done(err);
            })
        });
    })
    it("module test", function (done) {
        var ModuleManager = require("../lib/ModuleManager.js");
        ModuleManager.registerModule({"index":1, path:"../test/IncludeExcludeModule.js", name:"IncludeExcludeModule"});
        ModuleManager.registerModule({"index":1, path:"../test/IncludeExcludeModule1.js", name:"IncludeExcludeModule1"});
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates =
                [
                    {$collection:{collection:"countries"}, $insert:[
                        {
                            _id:"1", country:"india", state:"haryana"
                        }
                    ], $modules:{IncludeExcludeModule:0}}
                ];

            db.batchUpdateById(updates, function (err, data) {
                if (err) {
                    done(err);
                    return;
                }
                db.query({"$collection":{collection:"countries"}}, function (err, result) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log("countires>>>" + JSON.stringify(result));
                    expect(result.result).to.have.length(1);
                    expect(result.result[0].country).to.eql("india");
                    expect(result.result[0].code).to.eql(100);
                    var updates =
                        [
                            {$collection:{collection:"countries"}, $delete:[
                                {
                                    _id:"1"
                                }
                            ], $modules:{IncludeExcludeModule:1}}
                        ];
                    db.batchUpdateById(updates, function (err, data) {
                        if (err) {
                            done(err);
                            return;
                        }
                        db.query({"$collection":{collection:"countries"}}, function (err, res) {
                            if (err) {
                                done(err);
                                return;
                            }
                            console.log("countires>>>" + JSON.stringify(res));
                            expect(res.result).to.have.length(2);
                            expect(res.result[0].country).to.eql("india");
                            expect(res.result[0].code).to.eql(100);
                            expect(res.result[0].code1).to.eql(undefined);
//                            expect(res.result[1].country).to.eql("USA");
                            expect(res.result[1].code).to.eql(100);
                            expect(res.result[1].code1).to.eql(91);
                            done();
                        })
                    })
                })
            });
        });


    })
})