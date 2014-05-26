/**
* mocha --recursive --timeout 150000 -g "CloneDocuemnttestcase" --reporter spec
 * * mocha --recursive --timeout 150000 -g "querywithoutclone" --reporter spec
 * querywithoutclone
*/

var expect = require('chai').expect;
var ApplaneDB = require("../lib/DB.js");
var Config = require("./config.js");


describe("CloneDocuemnttestcase", function () {
    afterEach(function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            db.dropDatabase(function (err) {
                console.log("drop...");
                var ModuleManager = require("../lib/ModuleManager.js");
                ModuleManager.unRegisterModule("CloneTestModule");
                done(err);
            })
        });
    })
    it("clone doc test", function (done) {
        var ModuleManager = require("../lib/ModuleManager.js");
        ModuleManager.registerModule({"index":1, path:"../test/CloneTestModule.js", name:"CloneTestModule", document:"pre"});
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates =
                [
                    {$collection:"countries", $insert:[
                        {
                            _id:"1", country:"india", state:"haryana"
                        }
                    ]}
                ];

            db.batchUpdateById(updates, function (err, data) {
                if (err) {
                    console.log(err.stack);
                    done(err);
                    return;
                }
                db.query({"$collection":"countries"}, function (err, result) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log("countires>>>" + JSON.stringify(result));
                    expect(result.result).to.have.length(1);
                    expect(result.result[0].country).to.eql(undefined);
                    expect(result.result[0].state).to.eql(undefined);
                    db.query({$collection:"countries1"}, function (err, res) {
                        if (err) {
                            done(err);
                            return;
                        }
                        expect(res.result).to.have.length(1);
                        expect(res.result[0].country).to.eql("China");
                        db.query({$collection:"countries2"}, function (err, res) {
                            if (err) {
                                done(err);
                                return;
                            }
                            expect(res.result).to.have.length(0);
                            done();
                        })
                    })
                })
            });
        });


    })

    it("doc not clone test", function (done) {
        var ModuleManager = require("../lib/ModuleManager.js");
        ModuleManager.registerModule({"index":1, path:"../test/CloneTestModule.js", name:"CloneTestModule"});
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates =
                [
                    {$collection:"countries", $insert:[
                        {
                            _id:"1", country:"india", state:"haryana"
                        }
                    ]}
                ];

            db.batchUpdateById(updates, function (err, data) {
                if (err) {
                    console.log(err.stack);
                    done(err);
                    return;
                }
                db.query({"$collection":"countries"}, function (err, result) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log("countires>>>" + JSON.stringify(result));
                    expect(result.result).to.have.length(1);
                    expect(result.result[0].country).to.eql(undefined);
                    expect(result.result[0].state).to.eql(undefined);
                    db.query({$collection:"countries2"}, function (err, res) {
                        if (err) {
                            done(err);
                            return;
                        }
                        expect(res.result).to.have.length(1);
                        expect(res.result[0].country).to.eql("China");
                        db.query({$collection:"countries1"}, function (err, res) {
                            if (err) {
                                done(err);
                                return;
                            }
                            expect(res.result).to.have.length(0);
                            done();
                        })
                    })
                })
            });
        });


    })

    it("query clone", function (done) {
        var ModuleManager = require("../lib/ModuleManager.js");
        ModuleManager.registerModule({"index":1, path:"../test/CloneTestModule.js", name:"CloneTestModule", query:"pre"});
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates =
                [
                    {$collection:"countries", $insert:[
                        {
                            _id:"1", country:"india", state:"haryana"
                        }
                    ]}
                ];

            db.batchUpdateById(updates, function (err, data) {
                if (err) {
                    console.log(err.stack);
                    done(err);
                    return;
                }
                db.query({"$collection":"countries"}, function (err, result) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log("countires>>>" + JSON.stringify(result));
                    expect(result.result).to.have.length(1);
                    expect(result.result[0].country).to.eql(undefined);
                    expect(result.result[0].state).to.eql(undefined);
                    expect(result.result[0].code).to.eql(undefined);
                    done();
                })
            });
        });


    })

    it("querywithoutclone", function (done) {
        var ModuleManager = require("../lib/ModuleManager.js");
        ModuleManager.registerModule({"index":1, path:"../test/CloneTestModule.js", name:"CloneTestModule"});
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates =
                [
                    {$collection:"countries", $insert:[
                        {
                            _id:"1", country:"india", state:"haryana"
                        }
                    ]}
                ];

            db.batchUpdateById(updates, function (err, data) {
                if (err) {
                    console.log(err.stack);
                    done(err);
                    return;
                }
//                done();
                db.query({"$collection":"countries"}, function (err, result) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log("countires>>>" + JSON.stringify(result));
                    expect(result.result).to.have.length(1);
                    expect(result.result[0].country).to.eql(undefined);
                    expect(result.result[0].state).to.eql(undefined);
                    expect(result.result[0].code).to.eql(1000);
                    done();
                })
            });
        });


    })
})
