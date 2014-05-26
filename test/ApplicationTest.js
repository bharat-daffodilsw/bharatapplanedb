/**
 * mocha --recursive --timeout 30000 -g "ApplicationTest" --reporter spec
 * mocha --recursive --timeout 30000 -g "testcase" --reporter spec
 *  Created with IntelliJ IDEA.
 * User: Rajit
 * Date: 15/5/14
 * Time: 9:58 AM
 * To change this template use File | Settings | File Templates.
 */
var expect = require('chai').expect;
var ApplaneDB = require("../lib/DB.js");
var Config = require("../config.js");


describe("ApplicationTest", function () {
    afterEach(function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, {username:"admin", password:"damin"}, function (err, db) {
            db.dropDatabase(function (err) {
                done(err);
            })
        });
    })

    it("Application Test case 1", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, {username:"admin", password:"damin"}, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            //here i am inserting fields into pl.applications
            var insert = [
                {$collection:"pl.applications", $insert:[
                    {_id:11, "label":"TestingApp", "db":"MyTestApp"}
                ]}
            ]
            db.batchUpdateById(insert, function (err, result) {
                if (err) {
                    done(err);
                    return;
                }
                //here we will get updated field of pl.application, including roles field
                db.query({$collection:"pl.applications"}, function (err, plappdata) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log("plappdata>>>>>>>>>>>>>>>>>>" + JSON.stringify(plappdata.result));
                    expect(plappdata.result).to.have.length(1);
                    expect(plappdata.result[0].label).to.eql("TestingApp");
                    expect(plappdata.result[0]._id).to.eql(11);
                    expect(plappdata.result[0].db).to.eql("northwindtestcases");
                    expect(plappdata.result[0].roles[0].role.role).to.eql("TestingApp");
                    //here we will get updated field of pl.roles, including roles field
                    db.query({$collection:"pl.roles"}, function (err, plrolesdata) {
                        if (err) {
                            done(err);
                            return;
                        }
                        console.log("plroles data>>>>>>>>>>>>" + JSON.stringify(plrolesdata));
                        expect(plrolesdata.result).to.have.length(1);
                        expect(plrolesdata.result[0].role).to.eql("TestingApp");
                        db.query({$collection:"pl.users"}, function (err, plusersdata) {
                            if (err) {
                                done(err);
                                return;
                            }
                            expect(plusersdata.result[0].roles[0].role.role).to.eql("TestingApp");
                            done();
                        });
                    });
                });
            })
        })
    })

    it("Application Test without DB", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, {username:"admin", password:"damin"}, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            //here i am inserting fields into pl.applications
            var insert = [
                {$collection:"pl.applications", $insert:[
                    {_id:11, "label":"TestingApp"}
                ]}
            ]
            db.batchUpdateById(insert, function (err, result) {
                if (err) {
                    done(err);
                    return;
                }
                //here we will get updated field of pl.application, including roles field  and DB
                db.query({$collection:"pl.applications"}, function (err, plappdata) {
                    if (err) {
                        done(err);
                        return;
                    }
                    //here we will get updated field of pl.roles, including roles field
                    db.query({$collection:"pl.roles"}, function (err, plrolesdata) {
                        if (err) {
                            done(err);
                            return;
                        }
                        console.log("plappdata>>>>>>>>>>>>>>>>>>" + JSON.stringify(plappdata.result));
                        expect(plappdata.result).to.have.length(1);
                        expect(plrolesdata.result).to.have.length(1);
                        expect(plappdata.result[0].label).to.eql("TestingApp");
                        expect(plappdata.result[0]._id).to.eql(11);
                        expect(plappdata.result[0].db).to.eql("northwindtestcases");
                        expect(plrolesdata.result[0].role).to.eql("TestingApp");
                        expect(plappdata.result[0].roles[0].role.role).to.eql("TestingApp");
                        db.query({$collection:"pl.users"}, function (err, plusersdata) {
                            if (err) {
                                done(err);
                                return;
                            }
                            expect(plusersdata.result[0].roles[0].role.role).to.eql("TestingApp");
                            done();
                        });
                    });
                });
            })
        })
    })
})


