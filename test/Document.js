/**
 *
 *  mocha --recursive --timeout 150000 -g "Documenttestcase" --reporter spec
 *  mocha --recursive --timeout 150000 -g "all operations in case of update" --reporter spec
 *
 *
 *
 */
var expect = require('chai').expect;
var ApplaneDB = require("../lib/DB.js");
var Config = require("./config.js");
var Document = require("ApplaneDB/lib/Document.js");


describe("Documenttestcase", function () {
    afterEach(function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            db.dropDatabase(function (err) {
                done(err);
            })
        });
    })

    it("simpleee update", function (done) {
        //person example

        var oldperson = {
            _id:"rohit",
            name:"rohit",
            status:"single",
            age:30,
            address:{line1:"zz", line2:"xx", city:"hansi", state:"haryana", score:9 },
            gameinfo:{_id:"cricket", "game":"cricket"},
            schools:[
                {_id:"pcsd", school:"pcsd", code:"91", status:"private", score:100},
                {_id:"sdm", school:"sdm", code:"92", status:"public", score:98},
                {_id:"psb", school:"psb", code:"93", status:"public", score:90}
            ],
            countries:[
                {_id:"india", country:"india", code:"91", states:[
                    {_id:"haryana", state:"haryana", code:"10", cities:[
                        {_id:"hisar", city:"hisar", code:"1662"},
                        {_id:"sirsa", city:"sirsa", code:"1664"},
                        {_id:"rohtak", city:"rohtak", code:"1262"},
                        {_id:"ggn", city:"ggn", code:"124"}
                    ]}
                ]},
                {_id:"USA", country:"USA", code:"0011", states:[
                    {_id:"new york", state:"new york", code:"12", cities:[
                        {_id:"manhattan", city:"manhattan", code:"1662"},
                        {_id:"brooklyn", city:"brooklyn", code:"1664"}
                    ]},
                    {_id:"washington", state:"washington", code:"132", cities:[
                        {_id:"florida", city:"florida", code:"1754"},
                        {"_id":"dc", city:"dc"}
                    ]}
                ]}
            ],
            languages:[
                {_id:"hindi", language:"hindi"},
                {_id:"engish", language:"english"}
            ],
            score:10
        }

        var personUpdates = {
            _id:"rohit",
            $set:{
                "address":{$set:{line1:"z1"}, $unset:{line2:""}},
                status:"married",
                schools:{$insert:[
                    {_id:"dav", school:"dav", score:"17"}
                ], $update:[
                    {_id:"sdm", $set:{school:"SDM"}, $unset:{status:""}, $inc:{score:10}}
                ], $delete:[
                    {_id:"pcsd"}
                ]},
                countries:{$insert:[
                    {_id:"Pakistan", country:"Pakistan", code:"92", states:[
                        {_id:"lahore", state:"lahore", code:"12", cities:[
                            {_id:"multan", city:"multan", code:"1662"}
                        ]}
                    ]}
                ], $update:[
                    {_id:"USA", $set:{states:{$insert:[
                        {_id:"canada", state:"canada", code:"121", cities:[
                            {_id:"mini-punjab", city:"mini-punjab", code:"18852"}
                        ]}
                    ], $delete:[
                        {_id:"new york"}
                    ], $update:[
                        {"_id":"washington", $set:{"cities":{"$insert":[
                            {_id:"abc", city:"abc", code:"1864084"}
                        ], $delete:[
                            {"_id":"florida"}
                        ], $update:[
                            {"_id":"dc", "$set":{city:"dc1"}}
                        ]}}}
                    ]}}},
                    {_id:"india", $set:{states:{$insert:[
                        {_id:"himachal", state:"himachal", code:"099", cities:[
                            {_id:"kasol", city:"kasol", code:"876"}
                        ]}
                    ], $delete:[], $update:[]}}}
                ]},
                languages:[
                    {_id:"engish", language:"english"},
                    {_id:"german", language:"german"}
                ]

            },
            $unset:{age:"", gameinfo:""},
            $inc:{score:10}
        }

        var document = new Document(personUpdates, oldperson, "update");
        console.log("document>>>>>>>>>>>>." + JSON.stringify(document));
        var updatedFields = document.getUpdatedFields();
        var expectedUpdatedFields = [
            "address", "schools", "status", "age", "score" , "countries" , "languages"  , "gameinfo"
        ];
        for (var i = 0; i < expectedUpdatedFields.length; i++) {
            var key = expectedUpdatedFields[i];
            expect(updatedFields.indexOf(key)).not.equal(-1);
        }
        expect(document.get("status")).to.eql("married");
        expect(document.getOld("status")).to.eql("single");
        expect(document.get("name")).to.eql("rohit");
        expect(document.get("age")).to.eql(null);
        expect(document.getDocuments("address").get("line1")).to.eql("z1");
        expect(document.getDocuments("address").get("line2")).to.eql(null);
        var expectedAddressUpdatedFields = ["line1", "line2"];
        var addressUpdatedFields = document.getDocuments("address").getUpdatedFields();
        for (var i = 0; i < expectedAddressUpdatedFields.length; i++) {
            var key = expectedAddressUpdatedFields[i];
            expect(addressUpdatedFields.indexOf(key)).not.equal(-1);
        }

        expect(document.getDocuments("schools")).to.have.length(4);
        expect(document.getDocuments("schools", ["insert"])).to.have.length(1);
        expect(document.getDocuments("schools", ["update"])).to.have.length(1);
        expect(document.getDocuments("schools", ["delete"])).to.have.length(1);
        expect(document.getDocuments("schools", ["delete", "update"])).to.have.length(2);
        expect(document.getDocuments("schools", ["insert", "update"])).to.have.length(2);
        expect(document.getDocuments("schools", ["insert", "delete"])).to.have.length(2);
        expect(document.getDocuments("schools", ["nochange"])).to.have.length(1);
        expect(document.getDocuments("schools", ["nochange", "insert", "update"])).to.have.length(3);

        var studentUpdatedFields = (document.getDocuments("schools", ["insert"])[0]).getUpdatedFields();
        var studentExpectedUpdatedFieldsInsert = ["school", "score", "_id"];
        for (var i = 0; i < studentExpectedUpdatedFieldsInsert.length; i++) {
            var key = studentExpectedUpdatedFieldsInsert[i];
            expect(studentUpdatedFields.indexOf(key)).not.equal(-1);
        }
        var schoolInsertDocument = document.getDocuments("schools", ["insert"])[0];
        expect(document.getDocuments("schools", ["insert"])[0].get("school")).to.eql("dav");
        expect(document.getDocuments("schools", ["insert"])[0].get("score")).to.eql("17");


        expect(document.getDocuments("schools", ["update"])[0].get("status")).to.eql(null);
        expect(document.getDocuments("schools", ["update"])[0].getOld("status")).to.eql("public");

        expect(document.getDocuments("schools", ["update"])[0].get("score")).to.eql(10);


        var studentUpdatedFields = (document.getDocuments("schools", ["update"])[0]).getUpdatedFields();
        var studentExpectedUpdatedFieldsUpdate = ["school", "score", "status"];
        for (var i = 0; i < studentExpectedUpdatedFieldsUpdate.length; i++) {
            var key = studentExpectedUpdatedFieldsUpdate[i];
            expect(studentUpdatedFields.indexOf(key)).not.equal(-1);
        }
        expect(document.getDocuments("countries")).to.have.length(3);
        expect(document.getDocuments("countries", "insert")).to.have.length(1);
        expect(document.getDocuments("countries", "update")).to.have.length(2);
        var countriesUpdatedFieldsCase1 = (document.getDocuments("countries", ["update"])[0]).getUpdatedFields();

        var expectedCountriesUpdatedFields = ["states"];
        for (var i = 0; i < expectedCountriesUpdatedFields.length; i++) {
            var key = expectedCountriesUpdatedFields[i];
            expect(countriesUpdatedFieldsCase1.indexOf(key)).not.equal(-1);
        }
        var countriesUpdates = (document.getDocuments("countries", ["update"])[1]);
        console.log("countries updates>>>>>>>>>" + JSON.stringify(countriesUpdates));
        var stateUpdates = countriesUpdates.getDocuments("states", ["update"])[0];
        var citiesUpdates = stateUpdates.getDocuments("cities", ["update"])[0];
        expect(citiesUpdates.get("city")).to.eql("dc1");
        expect(stateUpdates.getDocuments("cities", ["update"])[0].getUpdatedFields()[0]).to.eql("city");
        expect(document.getDocuments("gameinfo").get("game")).to.eql(undefined);
        expect(document.getDocuments("gameinfo").getOld("game")).to.eql("cricket");
        expect(document.get("score")).to.eql(10);

        expect(document.getDocuments("languages")).to.have.length(4);


        document.insertDocument("countries", {"_id":"sri lanka", "country":"sri lanka", "states":[
            {"_id":"colombo", "state":"colombo"}
        ]})
        expect(document.getDocuments("countries", ["insert"])).to.have.length(2);
        document.insertDocument("schools", {"_id":"mnc", "school":"mnc"});
        expect(document.getDocuments("schools", ["insert"])).to.have.length(2);
//        document.deleteDocument("schools", {"_id": "mnc"});
//        //ToDO
//        expect(document.getDocuments("schools", ["delete"])).to.have.length(1);


        done();
//
//        //if we get(""school") or get("address") --> error, plz take document first
//
//        var addressDocument = document.getDocuments("address")//--> address document
//
//        var stateDocuments = document.getDocuments("schools")// [] array of documents of state --> all
//        var stateDocuments = document.getDocuments("schools", ["insert"])// [] array of documents of state where insert--> all
//        var stateDocuments = document.getDocuments("schools", ["insert", "update", "delete"])// [] array of documents of state where insert,update,delete--> all
//        var stateDocuments = document.getDocuments("schools", [])// [] array of documents of state where unchange
//        var stateDocuments = document.getDocuments("schools", ["nochange", "insert"])// [] array of documents of state where insert,and nochange--> all
//
//
//        var updatedAddress = docuement.get("address");
//        var expectedAddress = {line1: "z1", city: "hansi", state: "haryana"}
//        var updatedLine1 = docuement.get("address.line1");
//        var expectedLine1 = "z1";
//
//        document.set("address.city", "hisar");
//        var personUpdates = {_id: "rohit", $set: {"address.line1": "z1", "address.city": "hisar"}, $unset: {"address.line2": 1} }
//
//        var expectedUpdatedFields = [
//            {"address": ["line1", "line2", "city"]}
//        ];


    })
    it("test case no 2", function (done) {
        var oldRecord = {
            _id:"1",
            voucherno:"001",
            vlis:[
                {_id:"1", accountid:{_id:"cash"}, amount:100},
                {_id:"2", accountid:{_id:"cash", account:"cash"}, amount:200},
                {_id:"3", accountid:{_id:"salary", account:"salary"}, amount:100}
            ]
        };
        var updates = {
            _id:"1",
            $set:{
                voucherno:"002",
                vlis:{
                    $update:[
                        {$query:{amount:100}, $set:{amount:400, accountid:{$query:{_id:"profit"}, $set:{account:"profit"}}}}
                    ]
                }
            }
        };
        var document = new Document(updates, oldRecord, "update");
        var updatedFields = document.getUpdatedFields();
        var expectedUpdatedFields = ["voucherno", "vlis"];
        for (var i = 0; i < expectedUpdatedFields.length; i++) {
            var key = expectedUpdatedFields [i];
            expect(updatedFields.indexOf(key)).not.equal(-1);
        }
        expect(document.get("voucherno")).to.eql("002");
        try {
            document.getDocuments("vlis");
        } catch (e) {
            expect(e.message).to.eql("Update operation matches with none or more than one records");
        }


        done();
    });
    it("unset case in array and object", function (done) {
        var oldRecord = {
            _id:"1",
            "name":"kapil dalal",
            "reportingto":[
                {_id:"1", "name":"amit"},
                {_id:"2", name:"rohit"}
            ],
            "address":{"city":"hisar", state:"haryana"}
        };
        var updates = {
            _id:"1",
            $unset:{"address":"", "reportingto":""}
        };
        var document = new Document(updates, oldRecord, "update");
        var updatedFields = document.getUpdatedFields();
        var expectedUpdatedFields = ["reportingto", "address"];
        for (var i = 0; i < expectedUpdatedFields.length; i++) {
            var key = expectedUpdatedFields [i];
            expect(updatedFields.indexOf(key)).not.equal(-1);
        }


        expect(document.getDocuments("reportingto")).to.have.length(2);
        expect(document.getDocuments("reportingto", ["insert"])).to.have.length(0);
        expect(document.getDocuments("reportingto", ["update"])).to.have.length(0);
        expect(document.getDocuments("reportingto", ["delete"])).to.have.length(2);
        expect(document.getDocuments("reportingto", ["delete", "insert"])).to.have.length(2);

        expect(document.getDocuments("reportingto")[0].type).to.eql("delete");
        expect(document.getDocuments("reportingto")[1].type).to.eql("delete");
        expect(document.getDocuments("reportingto")[0].get("name")).to.eql(undefined);
        expect(document.getDocuments("reportingto")[0].getOld("name")).to.eql("amit");
        expect(document.getDocuments("reportingto")[1].get("name")).to.eql(undefined);
        expect(document.getDocuments("reportingto")[1].getOld("name")).to.eql("rohit");

        expect(document.getDocuments("address").get("city")).to.eql(undefined);
        expect(document.getDocuments("address").getOld("city")).to.eql("hisar");

        document.unset("reportingto", undefined);
        document.set("reportingto", [
            {"name":"ashish"}
        ]);
        done();
    });
    it("test case to get  allfields", function (done) {
        var oldperson = {
            _id:"rohit",
            name:"rohit",
            status:"single",
            age:30,
            address:{line1:"zz", line2:"xx", city:"hansi", state:"haryana", score:9 },
            gameinfo:{_id:"cricket", "game":"cricket"},
            schools:[
                {_id:"pcsd", school:"pcsd", code:"91", status:"private", score:100},
                {_id:"sdm", school:"sdm", code:"92", status:"public", score:98},
                {_id:"psb", school:"psb", code:"93", status:"public", score:90}
            ],
            countries:[
                {_id:"india", country:"india", code:"91", states:[
                    {_id:"haryana", state:"haryana", code:"10", cities:[
                        {_id:"hisar", city:"hisar", code:"1662"},
                        {_id:"sirsa", city:"sirsa", code:"1664"},
                        {_id:"rohtak", city:"rohtak", code:"1262"},
                        {_id:"ggn", city:"ggn", code:"124"}
                    ]}
                ]},
                {_id:"USA", country:"USA", code:"0011", states:[
                    {_id:"new york", state:"new york", code:"12", cities:[
                        {_id:"manhattan", city:"manhattan", code:"1662"},
                        {_id:"brooklyn", city:"brooklyn", code:"1664"}
                    ]},
                    {_id:"washington", state:"washington", code:"132", cities:[
                        {_id:"florida", city:"florida", code:"1754"},
                        {"_id":"dc", "$set":{city:"dc1"}}
                    ]}
                ]}
            ],
            languages:[
                {_id:"hindi", language:"hindi"},
                {_id:"engish", language:"english"}
            ],
            score:10
        }
        var personUpdates = {
            _id:"rohit",
            $set:{
                "address":{$set:{line1:"z1"}, $unset:{line2:""}},
                status:"married",
                schools:{$insert:[
                    {_id:"dav", school:"dav", score:"17"}
                ], $update:[
                    {_id:"sdm", $set:{school:"SDM"}, $unset:{status:""}, $inc:{score:10}}
                ], $delete:[
                    {_id:"pcsd"}
                ]},
                countries:{$insert:[
                    {_id:"Pakistan", country:"Pakistan", code:"92", states:[
                        {_id:"lahore", state:"lahore", code:"12", cities:[
                            {_id:"multan", city:"multan", code:"1662"}
                        ]}
                    ]}
                ], $update:[
                    {_id:"USA", $set:{states:{$insert:[
                        {_id:"canada", state:"canada", code:"121", cities:[
                            {_id:"mini-punjab", city:"mini-punjab", code:"18852"}
                        ]}
                    ], $delete:[
                        {_id:"new york"}
                    ], $update:[
                        {"_id":"washington", $set:{"cities":{"$insert":[
                            {_id:"abc", city:"abc", code:"1864084"}
                        ], $delete:[
                            {"_id":"florida"}
                        ], $update:[
                            {"_id":"dc", "$set":{city:"dc1"}}
                        ]}}}
                    ]}}},
                    {_id:"india", $set:{states:{$insert:[
                        {_id:"himachal", state:"himachal", code:"099", cities:[
                            {_id:"kasol", city:"kasol", code:"876"}
                        ]}
                    ], $delete:[], $update:[]}}}
                ]},
                languages:[
                    {_id:"engish", language:"english"},
                    {_id:"german", language:"german"}
                ]

            },
            $unset:{age:"", gameinfo:""},
            $inc:{score:10}
        }
        var document = new Document(personUpdates, oldperson, "update");
        var allFields = JSON.stringify(document.getFields());
        var expectedFields = ["address", "status", "schools", "countries", "languages", "age", "gameinfo", "score", "_id", "name"];
        for (var i = 0; i < expectedFields.length; i++) {
            var key = expectedFields [i];
            expect(allFields.indexOf(key)).not.equal(-1);
        }
        done();
    });
    it("simple case of merging", function (done) {
        var insert = {name:"Rohit", age:30};
        var document = new Document(insert, null, "insert");
        var allFields = JSON.stringify(document.getFields());
        var expectedFields = ["name", "age"];
        for (var i = 0; i < expectedFields.length; i++) {
            var key = expectedFields [i];
            expect(allFields.indexOf(key)).not.equal(-1);
        }
        var jsonDocument = document.convertToJSON();
        expect(jsonDocument.name).to.eql("Rohit");
        expect(jsonDocument.age).to.eql(30);
        done();
    });
    it("simple case of merging while update", function (done) {
        var old = {_id:12, name:"Rohit", age:30};
        var updates = {_id:12, $set:{age:40}};
        var document = new Document(updates, old, "update");
        var allFields = document.getFields();
        var expectedFields = ["name", "age", "_id"];
        for (var i = 0; i < expectedFields.length; i++) {
            var key = expectedFields [i];
            expect(allFields.indexOf(key)).not.equal(-1);
        }
        var jsonDocument = document.convertToJSON();
        expect(jsonDocument.name).to.eql("Rohit");
        expect(jsonDocument.age).to.eql(40);
        done();

    })
    it("simple case of merging while update case 2", function (done) {
        var old = {_id:12, name:"Rohit", age:30};
        var updates = {_id:12, $unset:{age:40}};
        var document = new Document(updates, old, "update");
        var allFields = document.getFields();
        var expectedFields = ["name", "age", "_id"];
        for (var i = 0; i < expectedFields.length; i++) {
            var key = expectedFields [i];
            expect(allFields.indexOf(key)).not.equal(-1);
        }
        var jsonDocument = document.convertToJSON();
        expect(jsonDocument.name).to.eql("Rohit");
        expect(jsonDocument.age).to.eql(null);
        done();
    })
    it("object case of merging while insert", function (done) {
        var insert = {_id:12, name:"Rohit", age:30, address:{city:"Hansi"}}
        var document = new Document(insert, null, "insert");
        var allFields = document.getFields();
        var expectedFields = ["name", "age", "address"];
        for (var i = 0; i < expectedFields.length; i++) {
            var key = expectedFields [i];
            expect(allFields.indexOf(key)).not.equal(-1);
        }
        var jsonDocument = document.convertToJSON();
        expect(jsonDocument.name).to.eql("Rohit");
        expect(jsonDocument.age).to.eql(30);
        expect(jsonDocument.address.city).to.eql("Hansi");
        done();
    })
    it("object case of merging while update", function (done) {
        var old = {_id:12, name:"Rohit", age:30, address:{city:"Hansi", "state":"haryana"}};
        var updates = {_id:12, $set:{address:{$set:{city:"Hansi1"}}}};
        var document = new Document(updates, old, "update");
        var allFields = document.getFields();
        var expectedFields = ["name", "age", "address", "_id"];
        for (var i = 0; i < expectedFields.length; i++) {
            var key = expectedFields [i];
            expect(allFields.indexOf(key)).not.equal(-1);
        }
        var jsonDocument = document.convertToJSON();
        expect(jsonDocument.name).to.eql("Rohit");
        expect(jsonDocument.age).to.eql(30);
        expect(jsonDocument.address.city).to.eql("Hansi1");
        expect(jsonDocument.address.state).to.eql("haryana");
        done();
    })
    it("array case of merging while update", function (done) {
        var old = {_id:12, name:"Rohit", age:30, address:{city:"Hansi"}, images:[
            {"image":"2277"},
            {image:"124"},
            {image:"254"}
        ]};
        var updates = {_id:12, $set:{images:{$insert:[
            {_id:"000", image:"000"}
        ], $update:[
            {$query:{image:"124"}, $set:{image:"421"}}
        ], $delete:[
            {$query:{image:"254"}}
        ]}}}
        var document = new Document(updates, old, "update");
        var allFields = document.getFields();
        var expectedFields = ["name", "age", "address", "images", "_id"];
        for (var i = 0; i < expectedFields.length; i++) {
            var key = expectedFields [i];
            expect(allFields.indexOf(key)).not.equal(-1);
        }
        var jsonDocument = document.convertToJSON();

        expect(jsonDocument.name).to.eql("Rohit");
        expect(jsonDocument.age).to.eql(30);
        expect(jsonDocument.address.city).to.eql("Hansi");
        expect(jsonDocument.images).to.have.length(3);
        done();
    })
    it("all operations in case of insert", function (done) {
        var oldperson = {
            _id:"rohit",
            name:"rohit",
            status:"single",
            age:30,
            address:{line1:"zz", line2:"xx", city:"hansi", state:"haryana", score:9 },
            gameinfo:{_id:"cricket", "game":"cricket"},
            schools:[
                {_id:"pcsd", school:"pcsd", code:"91", status:"private", score:100},
                {_id:"sdm", school:"sdm", code:"92", status:"public", score:98},
                {_id:"psb", school:"psb", code:"93", status:"public", score:90}
            ],
            countries:[
                {_id:"india", country:"india", code:"91", states:[
                    {_id:"haryana", state:"haryana", code:"10", cities:[
                        {_id:"hisar", city:"hisar", code:"1662"},
                        {_id:"sirsa", city:"sirsa", code:"1664"},
                        {_id:"rohtak", city:"rohtak", code:"1262"},
                        {_id:"ggn", city:"ggn", code:"124"}
                    ]}
                ]},
                {_id:"USA", country:"USA", code:"0011", states:[
                    {_id:"new york", state:"new york", code:"12", cities:[
                        {_id:"manhattan", city:"manhattan", code:"1662"},
                        {_id:"brooklyn", city:"brooklyn", code:"1664"}
                    ]},
                    {_id:"washington", state:"washington", code:"132", cities:[
                        {_id:"florida", city:"florida", code:"1754"},
                        {"_id":"dc", "$set":{city:"dc1"}}
                    ]}
                ]}
            ],
            languages:[
                {_id:"hindi", language:"hindi"},
                {_id:"engish", language:"english"}
            ],
            score:10
        };
        var document = new Document(oldperson, null, "insert");
        var allFields = document.getFields();
        var expectedFields = ["_id", "name", "status", "age", "address", "gameinfo", "schools", "countries", "languages", "score"];
        for (var i = 0; i < expectedFields.length; i++) {
            var key = expectedFields[i];
            expect(allFields.indexOf(key)).not.equal(-1);
        }
        var jsonDocument = document.convertToJSON();
        expect(jsonDocument._id).to.eql("rohit");
        expect(jsonDocument.name).to.eql("rohit");
        expect(jsonDocument.status).to.eql("single");
        expect(jsonDocument.age).to.eql(30);
        expect(jsonDocument.address.line1).to.eql("zz");
        expect(jsonDocument.address.line2).to.eql("xx");
        expect(jsonDocument.address.city).to.eql("hansi");
        expect(jsonDocument.address.state).to.eql("haryana");
        expect(jsonDocument.address.score).to.eql(9);

        expect(jsonDocument.gameinfo._id).to.eql("cricket");
        expect(jsonDocument.gameinfo.game).to.eql("cricket");

        expect(jsonDocument.schools).to.have.length(3);
        expect(jsonDocument.countries).to.have.length(2);
        expect(jsonDocument.languages).to.have.length(2);
        expect(jsonDocument.score).to.eql(10);
        done();

    })
    it("all operations in case of update", function (done) {
        var oldperson = {
            _id:"rohit",
            name:"rohit",
            status:"single",
            age:30,
            address:{line1:"zz", line2:"xx", city:"hansi", state:"haryana", score:9 },
            gameinfo:{_id:"cricket", "game":"cricket"},
            schools:[
                {_id:"pcsd", school:"pcsd", code:"91", status:"private", score:100},
                {_id:"sdm", school:"sdm", code:"92", status:"public", score:98},
                {_id:"psb", school:"psb", code:"93", status:"public", score:90}
            ],
            countries:[
                {_id:"india", country:"india", code:"91", states:[
                    {_id:"haryana", state:"haryana", code:"10", cities:[
                        {_id:"hisar", city:"hisar", code:"1662"},
                        {_id:"sirsa", city:"sirsa", code:"1664"},
                        {_id:"rohtak", city:"rohtak", code:"1262"},
                        {_id:"ggn", city:"ggn", code:"124"}
                    ]}
                ]},
                {_id:"USA", country:"USA", code:"0011", states:[
                    {_id:"new york", state:"new york", code:"12", cities:[
                        {_id:"manhattan", city:"manhattan", code:"1662"},
                        {_id:"brooklyn", city:"brooklyn", code:"1664"}
                    ]},
                    {_id:"washington", state:"washington", code:"132", cities:[
                        {_id:"florida", city:"florida", code:"1754"},
                        {"_id":"dc", city:"dc1"}
                    ]}
                ]}
            ],
            languages:[
                {_id:"hindi", language:"hindi"},
                {_id:"engish", language:"english"}
            ],
            score:10
        };
        var personUpdates = {
            _id:"rohit",
            $set:{
                "address":{$set:{line1:"z1"}, $unset:{line2:""}},
                status:"married",
                schools:{$insert:[
                    {_id:"dav", school:"dav", score:"17"}
                ], $update:[
                    {_id:"sdm", $set:{school:"SDM"}, $unset:{status:""}
//                        , $inc: {score: 10}
                    }
                ], $delete:[
                    {_id:"pcsd"}
                ]},
                countries:{$insert:[
                    {_id:"Pakistan", country:"Pakistan", code:"92", states:[
                        {_id:"lahore", state:"lahore", code:"12", cities:[
                            {_id:"multan", city:"multan", code:"1662"}
                        ]}
                    ]}
                ], $update:[
                    {_id:"USA", $set:{states:{$insert:[
                        {_id:"canada", state:"canada", code:"121", cities:[
                            {_id:"mini-punjab", city:"mini-punjab", code:"18852"}
                        ]}
                    ], $delete:[
                        {_id:"new york"}
                    ], $update:[
                        {"_id":"washington", $set:{"cities":{"$insert":[
                            {_id:"abc", city:"abc", code:"1864084"}
                        ], $delete:[
                            {"_id":"florida"}
                        ], $update:[
                            {"_id":"dc", "$set":{city:"dc1"}}
                        ]}}}
                    ]}}}
                    ,
                    {_id:"india", $set:{states:{$insert:[
                        {_id:"himachal", state:"himachal", code:"099", cities:[
                            {_id:"kasol", city:"kasol", code:"876"}
                        ]}
                    ], $delete:[], $update:[]}}}
                ]}, languages:[
                    {_id:"engish", language:"english"},
                    {_id:"german", language:"german"}
                ]

            },
            $unset:{age:"", gameinfo:""}

//            ,$inc: {score: 10}
        };
        var document = new Document(personUpdates, oldperson, "update");
        var jsonDocument = document.convertToJSON();
        expect(jsonDocument._id).to.eql("rohit");
        expect(jsonDocument.name).to.eql("rohit");
        expect(jsonDocument.status).to.eql("married");
        expect(jsonDocument.age).to.eql(null);

        expect(jsonDocument.gameinfo).to.eql(undefined);

        expect(jsonDocument.address.line1).to.eql("z1");
        expect(jsonDocument.address.line2).to.eql(null);

        expect(jsonDocument.schools).to.have.length(3);

        expect(jsonDocument.schools[2]._id).to.eql("dav");
        expect(jsonDocument.schools[2].school).to.eql("dav");
        expect(jsonDocument.schools[2].score).to.eql("17");

        expect(jsonDocument.schools[0]._id).to.eql("sdm");
        expect(jsonDocument.schools[0].school).to.eql("SDM");
        expect(jsonDocument.schools[0].score).to.eql(98);
        expect(jsonDocument.schools[0].code).to.eql("92");

        expect(jsonDocument.schools[1]._id).to.eql("psb");
        expect(jsonDocument.schools[1].school).to.eql("psb");
        expect(jsonDocument.schools[1].score).to.eql(90);
        expect(jsonDocument.schools[1].code).to.eql("93");

        expect(jsonDocument.countries).to.have.length(3);
        console.log("JSONDocuemtn>>>>>>>>..schoolds>>>>>>" + JSON.stringify(jsonDocument.countries));
        expect(jsonDocument.countries[2].country).to.eql("Pakistan");
        expect(jsonDocument.countries[2].code).to.eql("92");
        expect(jsonDocument.countries[2].states).to.have.length(1);
        expect(jsonDocument.countries[2].states[0]._id).to.eql("lahore");
        expect(jsonDocument.countries[2].states[0].state).to.eql("lahore");
        expect(jsonDocument.countries[2].states[0].code).to.eql("12");
        expect(jsonDocument.countries[2].states[0].cities).to.have.length(1);
        expect(jsonDocument.countries[2].states[0].cities[0].city).to.eql("multan");
        expect(jsonDocument.countries[2].states[0].cities[0]._id).to.eql("multan");
        expect(jsonDocument.countries[2].states[0].cities[0].code).to.eql("1662");

        expect(jsonDocument.countries[1].country).to.eql("USA");
        expect(jsonDocument.countries[1].code).to.eql("0011");
        expect(jsonDocument.countries[1].states).to.have.length(2);

        expect(jsonDocument.countries[1].states[1]._id).to.eql("canada");
        expect(jsonDocument.countries[1].states[1].state).to.eql("canada");
        expect(jsonDocument.countries[1].states[1].code).to.eql("121");
        expect(jsonDocument.countries[1].states[1].cities).to.have.length(1);
        expect(jsonDocument.countries[1].states[1].cities[0].city).to.eql("mini-punjab");
        expect(jsonDocument.countries[1].states[1].cities[0]._id).to.eql("mini-punjab");
        expect(jsonDocument.countries[1].states[1].cities[0].code).to.eql("18852");

        expect(jsonDocument.countries[1].states[0]._id).to.eql("washington");
        expect(jsonDocument.countries[1].states[0].state).to.eql("washington");
        expect(jsonDocument.countries[1].states[0].code).to.eql("132");
        expect(jsonDocument.countries[1].states[0].cities).to.have.length(2);

        expect(jsonDocument.countries[1].states[0].cities[1].city).to.eql("abc");
        expect(jsonDocument.countries[1].states[0].cities[1]._id).to.eql("abc");
        expect(jsonDocument.countries[1].states[0].cities[1].code).to.eql("1864084");
        expect(jsonDocument.countries[1].states[0].cities[0].city).to.eql("dc1");
        expect(jsonDocument.countries[1].states[0].cities[0]._id).to.eql("dc");

        expect(jsonDocument.countries[0].country).to.eql("india");
        expect(jsonDocument.countries[0].code).to.eql("91");

        done();
    });
    it("query in case of insert", function (done) {
        var countries = {"_id":"india", "country":"india", "city":{$query:{"_id":"hisar"}, $set:{"city":"hisar"}}};
        var persons = {_id:"india", $set:{"country":"india"}};
        var document = new Document(countries, null, "insert");
        var jsonDocument = document.convertToJSON();
        expect(jsonDocument.country).to.eql("india");
        expect(jsonDocument._id).to.eql("india");
        expect(jsonDocument.city._id).to.eql("hisar");
        expect(jsonDocument.city.city).to.eql("hisar");
        done();
    });
    it("nested query in case of insert", function (done) {
        var countries = {"_id":"india", "country":"india", "city":{$query:{"_id":"hisar"}, $set:{"city":"hisar"}, accountid:{"$query":{"_id":"SBI"}, $set:{"account":"salary"}}}};
        var persons = {_id:"india", $set:{"country":"india"}};
        var document = new Document(countries, null, "insert");
        var jsonDocument = document.convertToJSON();
        expect(jsonDocument.country).to.eql("india");
        expect(jsonDocument._id).to.eql("india");
        expect(jsonDocument.city._id).to.eql("hisar");
        expect(jsonDocument.city.city).to.eql("hisar");
        expect(jsonDocument.city.accountid._id).to.eql("SBI");
        expect(jsonDocument.city.accountid.account).to.eql("salary");

        done();
    });
    it("test case for convert to JSON", function (done) {
        var countries = {"_id":"india", "country":"india", states:[
            {"state":"haryana"},
            {"state":"ambala"},
            {"state":"sirsa"}
        ]};
        var countryUpdates = {"_id":"india", $set:{"country":"youngistan", "city":{$query:{"_id":"hisar"}, $set:{"city":"hisar"}, accountid:{"$query":{"_id":"SBI"}, $set:{"account":"salary"}}}}};
        var document = new Document(countryUpdates, countries, "update");
        expect(document.getDocuments("states", ["nochange"])).to.have.length(3);
        expect(document.getDocuments("states", ["insert"])).to.have.length(0);
        var jsonDocument = document.convertToJSON();
        expect(jsonDocument.country).to.eql("youngistan");
        expect(jsonDocument.city._id).to.eql("hisar");
        expect(jsonDocument.city.city).to.eql("hisar");
        expect(jsonDocument.city.accountid._id).to.eql("SBI");
        expect(jsonDocument.city.accountid.account).to.eql("salary");
        expect(jsonDocument.states).to.have.length(3);
        expect(jsonDocument.states[0].state).to.eql("haryana");
        expect(jsonDocument.states[1].state).to.eql("ambala");
        expect(jsonDocument.states[2].state).to.eql("sirsa");
        done();
    })
    it("getvalue from required fields", function (done) {
        var document = new Document({"_id":"customer1"}, null, "insert", {"_id":"customer1", "name":"bansal-and-sons", "accountid":{"_id":"SBI", "account":"SBI", "type":"Salary"}});
        expect(document.get("name")).to.eql("bansal-and-sons");
        done();

    })

    it("getValue from required field in case of updates", function (done) {
        var updates = {_id:"myinvoice", $set:{    invoicelineitems:{$insert:[
            {"_id":3, lineitemno:"3", purchases:[
                {"_id":5, purchaseno:"5", productid:{"_id":"computer"}    },
                {"_id":6, purchaseno:"6", productid:{"_id":"notebooks"}    }
            ], amount:20000    }
        ], $update:[
            {   $query:{lineitemno:"2"}, $set:{    purchases:{$insert:[
                {    "_id":7, purchaseno:"7", productid:{"_id":"notebooks"}}
            ], $update:[
                {    $query:{purchaseno:"3"}, $set:{        productid:{_id:"computer"}    }}
            ]    }}    }
        ]    }}                             };

        var oldRecord = {"_id":"myinvoice", "invoiceno":"001", "date":"2013-12-10T00:00:00.000Z", "invoicelineitems":[
            {"_id":1, "lineitemno":"1", "purchases":[
                {"_id":1, "purchaseno":"1", "productid":{"_id":"computer"}},
                {"_id":2, "purchaseno":"2", "productid":{"_id":"laptop"}}
            ], "amount":20000 },
            {"_id":2, "lineitemno":"2", "purchases":[
                {"_id":3, "purchaseno":"3", "productid":{"_id":"chairs"}},
                {"_id":4, "purchaseno":"4", "productid":{"_id":"ac"}}
            ], "amount":50000}
        ]};

        var requiredValues = {"invoicelineitems":[
            {"_id":3, "lineitemno":"3", "purchases":[
                {"_id":5, "purchaseno":"5", "productid":{"_id":"computer", "name":"computer", "type":"device", "accountid":{"_id":"SBI", "account":"SBI", "type":"asset", "accountgroupid":{"_id":"Asset", "name":"Asset"}}}},
                {"_id":6, "purchaseno":"6", "productid":{"_id":"notebooks", "name":"notebooks", "type":"utility", "accountid":{"_id":"SBI", "account":"SBI", "type":"asset", "accountgroupid":{"_id":"Asset", "name":"Asset"}}}}
            ], "amount":20000},
            {"lineitemno":"2", "purchases":[
                {"_id":7, "purchas eno":"7", "productid":{"_id":"notebooks", "name":"notebooks", "type":"utility", "accountid":{"_id":"SBI", "account":"SBI", "type":"asset", "accountgroupid":{"_id":"Asset", "name":"Asset"}}}},
                {"purchaseno":"3", "productid":{"_id":"computer", "name":"computer", "type":"device", "accountid":{"_id":"SBI", "account":"SBI", "type":"asset", "accountgroupid":{"_id":"Asset", "name":"Asset"}}}, "_id":3},
                {"_id":4, "purchaseno":"4", "productid":{"_id":"ac", "name":"ac", "type":"coolingdevice", "accountid":{"_id":"PNB", "account":"PNB", "type":"expense", "accountgroupid":{"_id":"Expense", "name":"Expense"}}}}
            ], "_id":2, "amount":50000},
            {"_id":1, "lineitemno":"1", "purchases":[
                {"_id":1, "purchaseno":"1", "productid":{"_id":"computer", "name":"computer", "type":"device", "accountid":{"_id":"SBI", "account":"SBI", "type":"asset", "accountgroupid":{"_id":"Asset", "name":"Asset"}}}},
                {"_id":2, "purchaseno":"2", "productid":{"_id":"laptop", "name":"laptop", "type":"portabledevice", "accountid":{"_id":"PNB", "account":"PNB", "type":"expense", "accountgroupid":{"_id":"Expense", "name":"Expense"}}}}
            ], "amount":20000}
        ], "_id":"myinvoice", "invoiceno":"001", "date":"2013-12-10T00:00:00.000Z"};

        var document = new Document(updates, oldRecord, "update", requiredValues);
        expect(document.getDocuments("invoicelineitems", ["update"])).to.have.length(1);
        done();

    })

    it("case from kapil dalal", function (done) {
        var old = {
            _id:"1",
            employee_id:{$query:{"_id":"1"}},
            reporting_to_id:{$insert:[
                {$query:{"_id":"1"}}
            ]},
            date:"2014-02-02",
            from_date:"2014-02-02",
            to_date:"2014-02-02",
            request_date:"2014-02-02",
//                            shift_id: {$query: {"_id": "1"}},
            status_id:{$query:{"_id":"1"}}
        };
        var updates = {
            _id:"1",
            $set:{
                status_id:{$query:{"_id":"2"}},
                remarks:"approvedddddddddd"
            }
        };
        var document = new Document(updates, old, "update");
        var status = document.getDocuments("status_id");
        expect(status.get("_id")).to.eql("2");

        done();
    })

    it("case from sachinbansal", function (done) {
        var old = {
            _id:"1",
            employee_id:{$query:{"_id":"1"}},
            reporting_to_id:{$insert:[
                {$query:{"_id":"1"}}
            ]},
            date:"2014-02-02",
            from_date:"2014-02-02",
            to_date:"2014-02-02",
            request_date:"2014-02-02",
            status_id:{$query:{"_id":"1"}}
        };
        var document = new Document({}, old, "delete");
        var status = document.get("_id");
        expect(status).to.eql("1");
        done();
    });


    it("case no 2 from sachin bansal", function (done) {
        var old = {_id:"india", "country":"india", "address":{"city":"hisar", "state":"hrayana"}};
        var updates = {"_id":"india", $set:{"country":"india1"}};
        var document = new Document(updates, old, "update");
        expect(document.getDocuments("address", ["insert", "update"])).to.eql(undefined);
        expect(document.getDocuments("address", ["nochange"]).get("city")).to.eql("hisar");
        done();
    });


    it("error while set value to 0 from kapil dalal", function (done) {
        var old = {_id:1, country:"USA", rate:{"amount":0, type:{_id:111, currency:"INR"}}};
        var document = new Document(old, null, "insert");
        console.log("rate document >>> " + JSON.stringify(document.getDocuments("rate")));
        var rateDocument = document.getDocuments("rate");
        console.log("amount>>>" + rateDocument.get("amount"));

        done();
//        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
//            if (err) {
//                done(err);
//                return;
//            }
//            var updates = [
//                {$collection: {collection: "countries", fields: [
//                    {field: "country", type: "string"},
//                    {field: "rate", type: "currency"}
//                ]}, $insert: [
//                    {_id: 1, country: "USA", code: "01", rate: {"amount": "25000", type: {$query: {currency: "INR"}}}}
//                ]}
//            ];
//
//            db.batchUpdateById(updates, function (err, result) {
//                if (err) {
//                    done(err);
//                    return;
//                }
//                db.query({$collection: "countries"}, function (err, data) {
//                    if (err) {
//                        done(err);
//                        return;
//                    }
//                    expect(data.result).to.have.length(1);
//                    expect(data.result[0].country).to.eql("USA");
//                    expect(data.result[0].rate.amount).to.eql(25000);
//                    expect(data.result[0].rate.type.currency).to.eql("INR");
//                    var updates = [
//                        {$collection: {collection: "countries", fields: [
//                            {field: "country", type: "string"},
//                            {field: "rate", type: "currency"}
//                        ]}, $update: [
//                            {_id: 1, $set: {rate: {$set: {amount: 0}}}}
//                        ]}
//                    ];
//                    db.batchUpdateById(updates, function (err, result) {
//                        if (err) {
//                            done(err);
//                            return;
//                        }
//                        db.query({$collection: "countries"}, function (err, data) {
//                            if (err) {
//                                done(err);
//                                return;
//
//                            }
//                            console.log("data>>>>>>after update>>>." + JSON.stringify(data));
//                            expect(data.result).to.have.length(1);
//                            expect(data.result[0].country).to.eql("USA");
//                            expect(data.result[0].rate.amount).to.eql(0);
//                            expect(data.result[0].rate.type.currency).to.eql("INR");
//                            done();
//                        });
//                    });
//                })
//            })
//
//        });
    });

    it("override case in object in documenttest case", function (done) {
        var old = {_id:1, "task":"Implement UDT Module", "estimatedefforts":{"time":"5", "unit":"Hrs"}};
        var update = {_id:1, $set:{ "estimatedefforts":{"time":"10", unit:"Hrs"}}};
        var document = new Document(update, old, "update");
        var updatedfields = document.getUpdatedFields();
        var estimatedEfforts = document.getDocuments(updatedfields);
        expect(estimatedEfforts.get("time")).to.eql("10");
        done();
    });

    it("get updated value testcase", function (done) {
        var old = {"_id":1, "country":"USA", "code":1, "state":{"state":"haryana", "rank":100, "city":{"city":"hisar", "score":200, "address":{"lineno":300, "area":"near ketarpaul hospital"}}}};
        var updates = {"_id":1, "$inc":{"code":10}, "$set":{ "country":"india", "state":{"$set":{"state":"LA", "city":{"$set":{"city":"toronto", "address":{"$set":{"area":"daffodil"}, "$inc":{"lineno":10}}}, "$inc":{"score":10}}}, "$inc":{"rank":10}}}};
        var document = new Document(updates, old, "update");
        console.log("updatedFields>>>>" + document.getUpdatedFields());
        var stateDocument = document.getDocuments("state");
        console.log("state updatedFields>>>>" + stateDocument.getUpdatedFields());
        done();
    })

    it("unset fk column document testcase", function (done) {
        var oldRecord = {_id:"111", artistid:{_id:"123123"}};
        var update = {_id:"111", $unset:{"artistid":1}};
        var document = new Document(update, oldRecord, "update");
        console.log("artistdocument " + JSON.stringify(document.getDocuments("artistid")));
        var artistDocument = document.getDocuments("artistid");
        expect(artistDocument.type).to.eql("update");
        done();
    });

    it("case of set fk column document testcase", function (done) {
        var oldRecord = {_id:"111", artistid:{_id:"123123"}};
        var update = {_id:"111", $set:{"artistid":{$set:{_id:1}}}};
        var document = new Document(update, oldRecord, "update");
        var artistDocument = document.getDocuments("artistid");
        console.log("artist document>>>>>>>>>." + JSON.stringify(artistDocument));
        expect(artistDocument.type).to.eql("update");
        done();
    });

    it("error case of array documents", function (done) {
        var updates = {"_id":"5376f2435e5bb1252322daf0", "$set":{"voucher_id":{"_id":"5376f2435e5bb1252322db2c"}}};
        var oldRecord = {"currency_rate":"1", "entity_id":{"_id":"5371df8146f92a020007bdb7", "name":"Rohit Bansal"}, "invoice_amount_invoice_currency":{"amount":100, "type":{"currency":"INR", "_id":"536a35cfbc14dd0200bf4e94"}}, "invoice_date":"2014-04-30T18:30:00.000Z", "invoice_details":[
            {"amount":{"amount":100, "type":{"currency":"INR", "_id":"536a35cfbc14dd0200bf4e94"}}, "delivery_id":{"_id":"53760f3048beba061682a3f1", "delivery_number":"Order/1/M1"}, "_id":"5376f2435e5bb1252322dade"}
        ], "invoice_type":"Invoice", "location_id":{"name":"Hisar", "_id":"536a2d67d386e802007a293d"}, "total_invoice_amount_invoice_currency":{"amount":100, "type":{"currency":"INR", "_id":"536a35cfbc14dd0200bf4e94"}}, "profit_center_id":{"_id":"536a2e2dd386e802007a2949", "name":"Services"}, "payment_due_date":"2014-05-01T18:30:00.000Z", "sales_owner_id":{"name":"Kapil Dalal", "_id":"53749944b3f5bb0200bd9e0f"}, "_id":"5376f2435e5bb1252322daf0"};
        var document = new Document(updates, oldRecord, "update");
        console.log("doucmners>>>>>>>>>>>>>>" + JSON.stringify(document.getDocuments("invoice_details")));
        done();
    })
    it("delete documents found", function (done) {
        var update = {_id:"123", $set:{invoiceno:"321"}};
        var oldRecord = {_id:"123", invoiceno:"123", invoicedetails:[
            {_id:"1111", deliveryno:"1111"},
            {_id:"2222", deliveryno:"2222"}
        ]};
        var document = new Document(update, oldRecord, "update");
        console.log("document>>>>>>>>>>>>>>>" + JSON.stringify(document));
        console.log("invoicdetails>>>>>>>>>>>>>>>" + JSON.stringify(document.getDocuments("invoicedetails")));
        done();
    })


    it("match array records case for default value", function (done) {
        var update = {_id:"123", $set:{lineitems:{"$insert":[
            {_id:"11", "amount":{amount:5500}}
        ]}
        }};
        var oldRecord = {_id:"123", lineitems:[
            {_id:"11", "amount":{amount:5500}}
        ]};
        var document = new Document(update, oldRecord, "insert");
        var lineItemInsertDocs = document.getDocuments("lineitems", ["nochange"]);
        console.log("lineitems>>>>>>>>>>>>>>>>>" + JSON.stringify(lineItemInsertDocs));
        expect(lineItemInsertDocs.length).to.eql(1);
        expect(lineItemInsertDocs[0].oldRecord._id).to.eql("11");
        done();
    });


    it("match array records case for default value with dollar insert in oldValue", function (done) {
        var update = {"invoice_no":1111, "profitcenterid":{"_id":"Services", "profitcenter":"Services"}, "invoicelineitems":{"$insert":[
            {"lineitemno":1, "amount":{"amount":10000, "type":{"_id":"INR", "currency":"INR"}}, "other_deductions":{"$insert":[
                {"deduction_amt":{"amount":200, "type":{"_id":"INR", "currency":"INR"}}, "_id":"537daef2f3dedaf82ad7c217"}
            ]}, "_id":"537daef2f3dedaf82ad7c216"}
        ]}};
        var oldRecord = {"invoice_no":1111, "profitcenterid":{"_id":"Services", "profitcenter":"Services"}, "invoicelineitems":{"$insert":[
            {"lineitemno":1, "amount":{"amount":10000, "type":{"_id":"INR", "currency":"INR"}}, "other_deductions":{"$insert":[
                {"deduction_amt":{"amount":200, "type":{"_id":"INR", "currency":"INR"}}, "_id":"537daef2f3dedaf82ad7c217"}
            ]}, "_id":"537daef2f3dedaf82ad7c216"}
        ]}};
        var document = new Document(update, oldRecord, "insert");
        var lineItemDocs = document.getDocuments("invoicelineitems");
        var otherDeductionDocs = lineItemDocs[0].getDocuments("other_deductions", ["nochange"]);
        console.log("otherDeductionDocs>>>>" + JSON.stringify(otherDeductionDocs));
        expect(lineItemDocs.length).to.eql(1);
        expect(otherDeductionDocs.length).to.eql(1);
        expect(lineItemDocs[0].oldRecord._id).to.eql("537daef2f3dedaf82ad7c216");
        done();
    });


    it("match array records case for default value with dollar insert in oldValue and dollar update in update", function (done) {
        var update = {"invoice_no":1111, "profitcenterid":{"_id":"Services", "profitcenter":"Services"}, "invoicelineitems":{"$update":[
            {"lineitemno":1, "amount":{"amount":10000, "type":{"_id":"INR", "currency":"INR"}}, "other_deductions":{"$update":[
                {"deduction_amt":{"amount":200, "type":{"_id":"INR", "currency":"INR"}}, "_id":"537daef2f3dedaf82ad7c217"}
            ]}, "_id":"537daef2f3dedaf82ad7c216"}
        ]}};
        var oldRecord = {"invoice_no":1111, "profitcenterid":{"_id":"Services", "profitcenter":"Services"}, "invoicelineitems":{"$insert":[
            {"lineitemno":1, "amount":{"amount":10000, "type":{"_id":"INR", "currency":"INR"}}, "other_deductions":{"$insert":[
                {"deduction_amt":{"amount":200, "type":{"_id":"INR", "currency":"INR"}}, "_id":"537daef2f3dedaf82ad7c217"}
            ]}, "_id":"537daef2f3dedaf82ad7c216"}
        ]}};
        var document = new Document(update, oldRecord, "insert");
        var lineItemDocs = document.getDocuments("invoicelineitems");
        console.log("********LIneItemDocs>>>>>>>>>>>>>.." + JSON.stringify(lineItemDocs));
        var otherDeductionDocs = lineItemDocs[0].getDocuments("other_deductions");
        console.log("otherDeductionDocs>>>>" + JSON.stringify(otherDeductionDocs));
        expect(lineItemDocs.length).to.eql(1);
        expect(lineItemDocs[0].type).to.eql("update");
        expect(otherDeductionDocs.length).to.eql(1);
        expect(otherDeductionDocs[0].type).to.eql("nochange");
        done();
    })

    it("convert to json of object/fk", function (done) {
        var updates = {_id:"rohit", $set:{countryid:{_id:"india"}}}
        var old = {_id:"rohit", countryid:{_id:"china", country:"china"}};
        var document = new Document(updates, old, "update");
        var json = document.convertToJSON();
        console.log("json>>" + JSON.stringify(json));
        expect(json.countryid.country).to.eql(undefined);
        expect(json.countryid._id).to.eql("india");
        expect(json._id).to.eql("rohit");


        updates = {_id:"rohit", $set:{countryid:{$query:{_id:"india"}}}}
        old = {_id:"rohit", countryid:{_id:"china", country:"china"}};
        document = new Document(updates, old, "update");
        json = document.convertToJSON();
        console.log("json>>" + JSON.stringify(json));
        expect(json.countryid.country).to.eql(undefined);
        expect(json.countryid._id).to.eql("india");
        expect(json._id).to.eql("rohit");


        updates = {_id:"rohit", $set:{countryid:{$query:{_id:"india"}, $set:{country:"india", code:91}}}}
        old = {_id:"rohit", countryid:{_id:"china", country:"china"}};
        document = new Document(updates, old, "update");
        json = document.convertToJSON();
        console.log("json>>" + JSON.stringify(json));
        expect(json.countryid.country).to.eql("india");
        expect(json.countryid.code).to.eql(91);
        expect(json.countryid._id).to.eql("india");
        expect(json._id).to.eql("rohit");


        updates = {_id:"rohit", $unset:{countryid:""}}
        old = {_id:"rohit", countryid:{_id:"china", country:"china"}};
        document = new Document(updates, old, "update");
        json = document.convertToJSON();
        console.log("json>>" + JSON.stringify(json));
        expect(json.countryid).to.eql(undefined);
        expect(json._id).to.eql("rohit");


        updates = {_id:"rohit"}
        old = {_id:"rohit", countryid:{_id:"china", country:"china"}};
        document = new Document(updates, old, "update");
        json = document.convertToJSON();
        console.log("json>>" + JSON.stringify(json));
        expect(json.countryid.country).to.eql("china");
        expect(json.countryid._id).to.eql("china");
        expect(json._id).to.eql("rohit");


        updates = {_id:"rohit", $set:{address:{$set:{state:"haryana"}}}}
        old = {_id:"rohit", address:{country:"india", city:"hisar"}};
        document = new Document(updates, old, "update");
        json = document.convertToJSON();
        console.log("json>>" + JSON.stringify(json));
        expect(json.address.country).to.eql("india");
        expect(json.address.state).to.eql("haryana");
        expect(json.address.city).to.eql("hisar");
        expect(json._id).to.eql("rohit");


        updates = {_id:"rohit", $set:{address:{city:"new hisar", code:1662, state:"haryana"}}}
        old = {_id:"rohit", address:{country:"india", state:"haryana", city:"hisar"}};
        document = new Document(updates, old, "update");
        json = document.convertToJSON();
        console.log("json>>" + JSON.stringify(json));
        expect(json.address.country).to.eql(undefined);
        expect(json.address.state).to.eql("haryana");
        expect(json.address.city).to.eql("new hisar");
        expect(json.address.code).to.eql(1662);
        expect(json._id).to.eql("rohit");


        updates = {_id:"rohit", $set:{name:"sachin"}}
        old = {_id:"rohit", address:{country:"india", state:"haryana", city:"hisar"}};
        document = new Document(updates, old, "update");
        json = document.convertToJSON();
        console.log("json>>" + JSON.stringify(json));
        expect(json.address.country).to.eql("india");
        expect(json.address.state).to.eql("haryana");
        expect(json.address.city).to.eql("hisar");
        expect(json._id).to.eql("rohit");
        expect(json.name).to.eql("sachin");


        updates = {_id:"rohit", $set:{name:"sachin"}, $unset:{address:""}}
        old = {_id:"rohit", address:{country:"india", state:"haryana", city:"hisar"}};
        document = new Document(updates, old, "update");
        json = document.convertToJSON();
        console.log("json>>" + JSON.stringify(json));
        expect(json.address).to.eql(undefined);
        expect(json._id).to.eql("rohit");
        expect(json.name).to.eql("sachin");

        updates = {};
        old = {"_id":4, "purchaseno":"4", "productid":{"_id":"ac", "accountid":{"name":"PNB", "type":"expense", "accountgroupid":{"name":"Expense"}}, "type":"coolingdevice", "name":"ac"}};
        var requiredValues = {"_id":4, "purchaseno":"4", "productid":{"_id":"ac", "name":"ac", "type":"coolingdevice", "accountid":{"_id":"PNB", "account":"PNB", "type":"expense", "accountgroupid":{"_id":"Expense", "name":"Expense"}}}};
        document = new Document(updates, old, "nochange", requiredValues);
        json = document.convertToJSON();
        console.log("json>>" + JSON.stringify(json));

        done();
    })

    it.skip("getDocuments testcase", function (done) {

        var updates2 = {"_id":"5382c99042463d9036927187", "$unset":{"amt":"", "deductions":"", "line_no":"", "damt":"", "stax":"", "net":"", "netword":""}};
        var oldRecord2 = {"amt":10500, "deductions":[
            {"damt":500, "_id":"5382c99042463d9036927188", "deduction_no":1111, "vat":100, "dnetamt":600}
        ], "_id":"5382c99042463d9036927187", "line_no":1111, "damt":500, "stax":1050, "net":9450, "netword":"Greater that 1000"};
        var document2 = new Document(updates2, oldRecord2, "delete");
        console.log("document >>>>>>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(document));
        var deductions = document2.getDocuments("deductions",  ["insert", "update", "delete"]);
        console.log("deductions>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(deductions));

        var updates = {"invoice_no":1111, "invoicelineitems":{"$insert":[
            {"amt":1000, "deductions":{"$insert":[
                {"damt":50, "_id":"5382663a818f07ec1d9b67d0", "deduction_no":1111, "vat":10, "dnetamt":60}
            ], "$update":[], "$delete":[]}, "_id":"5382663a818f07ec1d9b67cf", "line_no":1111, "damt":50, "stax":100, "net":900, "netword":"Greater that 100"},
            {"amt":5000, "deductions":{"$insert":[
                {"damt":1000, "_id":"5382663a818f07ec1d9b67d2", "deduction_no":1111, "vat":200, "dnetamt":1200},
                {"damt":200, "_id":"5382663a818f07ec1d9b67d3", "deduction_no":1111, "vat":40, "dnetamt":240}
            ], "$update":[], "$delete":[]}, "_id":"5382663a818f07ec1d9b67d1", "line_no":1111, "damt":1200, "stax":500, "net":4500, "netword":"Greater that 1000"}
        ], "$update":[], "$delete":[]}, "invoicelineitems1":{"$insert":[
            {"amt":3000, "_id":"5382663a818f07ec1d9b67d4", "line_no":1111, "stax":300, "net":2700, "netword":"Greater that 1000"},
            {"amt":8000, "_id":"5382663a818f07ec1d9b67d5", "line_no":1111, "stax":800, "net":7200, "netword":"Greater that 1000"}
        ], "$update":[], "$delete":[]}, "invoice_date":"2014-05-25T21:52:58.754Z", "totalamt":17000, "damt":1250, "totalstax":1700, "totalnet":15300, "netword":"Greater that 1000"};
        var oldRecord = {"invoice_no":1111, "invoicelineitems":[
            {"amt":1000, "deductions":[
                {"damt":50, "_id":"5382663a818f07ec1d9b67d0", "deduction_no":1111, "vat":10, "dnetamt":60}
            ], "_id":"5382663a818f07ec1d9b67cf", "line_no":1111, "damt":50, "stax":100, "net":900, "netword":"Greater that 100"},
            {"amt":5000, "deductions":[
                {"da mt":1000, "_id":"5382663a818f07ec1d9b67d2", "deduction_no":1111, "vat":200, "dnetamt":1200},
                {"damt":200, "_id":"5382663a818f07ec1d9b67d3", "deduction_no":1111, "vat":40, "dnetamt":240}
            ], "_id":"5382663a818f07ec1d9b67d1", "line_no":1111, "damt":1200, "stax":500, "net":4500, "netword":"Greater that 1000"}
        ], "invoice lineitems1":[
            {"amt":3000, "_id":"5382663a818f07ec1d9b67d4", "line_no":1111, "stax":300, "net":2700, "netword":"Greater that 1000"},
            {"amt":8000, "_id":"5382663a818f07ec1d9b67d5", "line_no":1111, "stax":800, "net":7200, "netword":"Greater that 1000"}
        ], "invoice_date":"2014-05-25T21:52:58.754Z", "totalamt":17000, " damt":1250, "totalstax":1700, "totalnet":15300, "netword":"Greater that 1000"};
        var document = new Document(updates, oldRecord, "insert");
        console.log("document >>>>>>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(document));
        var invoiceLineItems = document.getDocuments("invoicelineitems", ["insert"]);
        console.log("lineitems>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(invoiceLineItems));

        var updates1 = {"$set":{"invoicelineitems":{"$update":[
            {"_id":"538268b9cead20b81e774f4d", "$set":{"amt":3000, "deductions":{"$update":[
                {"_id":"538268b9cead20b81e774f4e", "damt":100, "vat":20, "dnetamt":120}
            ], " $insert":[
                {"damt":200, "_id":"538268bacead20b81e774f56", "deduction_no":1111, "vat":40, "dnetamt":240}
            ], "$delete":[]}, "damt":300, "stax":300, "net":2700, "netword":"Greater that 1000"}},
            {"_id":"538268b9cead20b81e774f4f", "$set":{"amt":1000, "deductions":{"$update":[
                {"_id":"538268b9cead20b81e774f51", "damt":500, "vat":100, "dnetamt":600}
            ], "$delete":[], "$insert":[]}, "damt":1500, "stax":100, "net":900, "netword":"Greater that 100"}}
        ], "$insert":[
            {"amt":20000, "deductions":[
                {"damt":2000, "_id":"538268bacead20b81e774f58", "deduction_no":1111, "vat":400, "dnetamt":2400}
            ], "_id":"538268bacead20b81e774f57", "line_no":1111, " damt":2000, "stax":2000, "net":18000, "netword":"Greater that 1000"}
        ], "$delete":[]}, "invoicelineitems1":{"$update":[
            {"_id":"538268b9cead20b81e774f53", "$set":{"amt":10000, "stax":1000, "net":9000, "netword":"Greater that 1000"}}
        ], "$delete":[], "$insert":[]}, "totalamt":37000, "damt":3800, "totalstax":3700, "totalnet":33300, "netword":"Greater that 1000"}};

        var oldRecord1 = {"invoicelineitems":[
            {"_id":"538268b9cead20b81e774f4d", "amt":3000, "deductions":[
                {"_id":"538268b9cead20b81e774f4e", "damt":100, "vat":20, "dnetamt":120, "deduction_no":1111},
                {"damt":200, "_id":"538268bacead20b81e774f56", "deduction_no":1111, "vat":40, "dnetamt":240}
            ], "damt":300, "stax":300, "net":2700, "netword":"Greater that 1000", "line_no":1111},
            {"_id":"538268b9cead20b81e774f4f", "amt":1000, "deductions":[
                {"damt":1000, "_id":"538268b9cead20b81e774f50", "deduction_no":1111, "vat":200, "dnetamt":1200},
                {"_id":"538268b9cead20b81e774f51", "damt":500, "vat":100, "dnetamt":600, "deduction_no":1111}
            ], "damt":1500, "stax":100, "net":900, "netword":"Greater that 100", "line_no":1111},
            {"amt":20000, "deductions":[
                {"damt":2000, "_id":"538268bacead20b81e774f58", "deduction_no":1111, "vat":400, "dnetamt":2400}
            ], "_id":"538268bacead20b81e774f57", "line_no":1111, " damt":2000, "stax":2000, "net":18000, "netword":"Greater that 1000"}
        ], "invoicelineitems1":[
            {"amt":3000, "_id":"538268b9cead20b81e774f52", "line_no":1111, "stax":300, "net":2700, "netword":"Greater that 1000"},
            {"_id":"538268b9cead20b81e774f53", "amt":10000, "stax":1000, "net":9000, "netword":"Greater that 1000", "line_no":1111}
        ], "totalamt":37000, "damt":3800, "totalstax":3700, "totalnet":33300, "invoice_no":1111, "invoice_date":"2014-05-25T22:03:37.108Z", "netword":"Greater that 1000", "default_currency":"INR", "_id":"538268bacead20b81e774f54"}

        var document1 = new Document(updates1, oldRecord1, "update");
        console.log("document >>>>>>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(document1));
        var invoiceLineItems = document1.getDocuments("invoicelineitems", ["insert","update"]);
        console.log("lineitems>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(invoiceLineItems));

        done();
    });

})
