///**
// *
// *  mocha --recursive --timeout 150000 -g AutoIncrementTestCase --reporter spec
// *  mocha --recursive --timeout 150000 -g "UpdateTestCases" --reporter spec
// */
//var expect = require('chai').expect;
//var ApplaneDB = require("ApplaneDB");
//
//
//describe("User testcase", function () {
//
//    it("Simple insert", function (done) {
//
//
//        ApplaneDB.connect("mongodb://127.0.0.1:27017/northwindtestcases", function (err, conn) {
//            if (err) {
//                done(err);
//                return;
//            }
//
//            /*when collection is building at run time*/
//            var collection = conn.collection({$collection:"tasks", fields:{when:"date"}});
//
//            collection.insert([
//                {task:"task1", when:"2014-01-01"},
//                {task:"task2", when:"2014-01-01"},
//                {task:"task3", when:"2014-01-01"}
//            ], function (err, result) {
//                done(err);
//            })
//
//        })
//    })
//
//    it("Simple Lookup insert", function (done) {
//
//
//        ApplaneDB.connect("mongodb://127.0.0.1:27017/northwindtestcases", function (err, conn) {
//            if (err) {
//                done(err);
//                return;
//            }
//
//            /*when collection is building at run time*/
//            var collection = conn.collection({$collection:"countries"});
//
//            collection.insert([
//                {country:"India", code:"91", _id:"india"},
//                {country:"USA", code:"01", _id:"usa"},
//            ], function (err, result) {
//                conn.collection(stateCollection, function (stateCollection) {
//                    stateCollection.insert([
//                        {state:"Haryana", countryid:{country:"India",code:"100",population:100}, _id:"haryanaindia"} ,
//                        {state:"Newyork", countryid:"usa", _id:"newyorkusa"}
//                    ], function (err) {
//                        done(err)
//                    })
//                })
//                var stateCollection = {$collection:"states", fields:{state:"string", countryid:{$type:"fk", $collection:"countries"}}}
//
//            })
//
//        })
//    })
//
//    it("Simple insert(schema is in same database", function (done) {
//        ApplaneDB.connect("mongodb://127.0.0.1:27017/northwindtestcases", {schema:"collections"},
//            function (err, conn) {
//                if (err) {
//                    done(err);
//                    return;
//                }
//
//                /*when collection is building at run time*/
//                var collection = conn.collection({$collection:"tasks", fields:{when:"date"}});
//
//                collection.insert([
//                    {task:"task1", when:"2014-01-01"},
//                    {task:"task2", when:"2014-01-01"},
//                    {task:"task3", when:"2014-01-01"}
//                ], function (err, result) {
//                    done(err);
//                })
//
//            }
//
//        )
//    })
//
//
//})