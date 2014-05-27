///**
// *
// *  mocha --recursive --timeout 150000 -g AutoIncrementTestCase --reporter spec
// *  mocha --recursive --timeout 150000 -g "UpdateTestCases" --reporter spec
// */
//var expect = require('chai').expect;
//var ApplaneDB = require("ApplaneDB");
//
//
//describe("Unwind testcase", function () {
//    before(function (done) {
//        ApplaneDB.connect("mongodb://127.0.0.1:27017/northwindtestcases", function (err, db) {
//            if (err) {
//                done(err);
//                return;
//            }
//            db.collection("countries").insert([
//                {_id:"india", country:"india",
//                    states:[
//                        {_id:"haryana", "state":"haryana",
//                            cities:[
//                                {_id:"hansi", city:"hansi", population:200} ,
//                                {_id:"hisar", city:"hisar", population:250}
//                            ]},
//                        {_id:"punjab", "state":"punjab",
//                            cities:[
//                                {_id:"amritsar", city:"amritsar", population:500} ,
//                                {_id:"ludhiana", city:"ludhiana", population:100}
//                            ]}
//                    ]
//                }
//            ], function (err, result) {
//                done(err);
//            })
//
//        })
//    })
//    it("Unwind query", function (done) {
//        ApplaneDB.connect("mongodb://127.0.0.1:27017/northwindtestcases", function (err, db) {
//            if (err) {
//                done(err);
//                return;
//            }
//
//            var query = {$collection:"countries",
//                $fields:{
//                    "states.cities.city":1,
//                    "states.cities.population":1
//                },
//                $filter:{
//                    "country":"india",
//                    "states.state":"haryana",
//                    "states.cities.population":{
//                        $gt:500
//                    }
//                },
//                $unwind:["states", "states.cities"],
//
//
//            :
//            {
//                $filter:{
//                    states.state
//                :
//                    "1212"
//                }
//            }
//            ,
//            "states.cities"
//            ],
//
//            $groups:{
//                _id:[country, states.state], $filter
//            :
//                {
//                    count:{
//                    }
//                }
//            ,
//                $sort:{
//                }
//            ,
//                count:{
//                    $sum:1
//                }
//            }
//            ,
//            $groups:[
//                {_id:{country:"$country", state:"$states.state"},
//                    citycount:{$sum:1},
//                    cities:{$push:{name:"$states.cities.name", "population":"$states.cities.population"}}
//                },
//                {_id:"$_id.country",
//                    statecount:{$sum:1},
//                    states:{$push:{state:"_id.state", citycount:"$citycount", data:"$data"}}
//                }
//            ];
//
//            var data = [
//                {_id:"india",
//                    count:2,
//                    children:[
//                        {_id:"haryana",
//                            state:"haryana",
//                            count:2,
//                            children:[
//                                {_id:"hansi", city:"hansi"}
//                            ]
//                        }
//                    ]
//                }
//            ]
//
//        };
//        var mongoPipeline = [
//            {$match:{country:"india"}},
//            {$unwind:"$states"},
//            {$match:{"states.state":"haryana"}},
//            {$unwind:"$states.cities"},
//            {$match:{population:{$gt:500}}},
//            {$project:{"states.cities.city":1}}
//        ]
//        db.query(query, function (err, data) {
//            if (err) {
//                done(err);
//                return;
//            }
//            expect(data).to.have.length(3);
//            expect(data[0].task).to.eql("task1");
//            expect(data[0].task).to.eql("task2");
//            expect(data[0].task).to.eql("task3");
//            done();
//        });
//    })
//})
//
//
//})