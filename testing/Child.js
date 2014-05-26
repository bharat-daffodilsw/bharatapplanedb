/**
 *
 *  mocha --recursive --timeout 150000 -g "ChildModule testcase" --reporter spec
 *
 *  mocha --recursive --timeout 150000 -g "Collection and fields recursive with change alias" --reporter spec
 *
 */

var expect = require('chai').expect;
var ApplaneDB = require("../lib/DB.js");
var Config = require("./config.js");
var NorthwindDb = require("./NorthwindDb.js");
var Utils = require("ApplaneCore/apputil/util.js");
var Constants = require("../lib/Constants.js");

var collectionsToRegister = [
    {
        collection:"deliveries",
        fields:[
            {field:"orderid", collection:"orders", type:"fk", set:["order_no"]}
        ]
    },
    {
        collection:"invoices",
        fields:[
            {field:"orderid", collection:"orders", type:"fk", set:["order_no"]}
        ]
    },
    {
        collection:"accounts",
        fields:[
            {field:"orderid", collection:"orders", type:"fk", set:["order_no"]}
        ]
    },
    {
        collection:"orders",
        fields:[
            {field:"deliveries", type:"object", multiple:true, fk:"orderid", query:JSON.stringify({$collection:"deliveries"})},
            {field:"invoices", type:"object", multiple:true, fk:"orderid", query:JSON.stringify({$collection:"invoices"})},
            {field:"accounts", type:"object", multiple:true, fk:"orderid", query:JSON.stringify({$collection:"accounts"})}
        ]
    } ,
    {collection:Constants.Admin.COLLECTIONS, fields:[
        {field:Constants.Admin.Collections.COLLECTION, type:Constants.Admin.Fields.Type.STRING, mandatory:true},
        {field:"fields", type:"object", multiple:true, fk:Constants.Admin.Fields.COLLECTION_ID, query:"{\"$collection\":\"pl.fields\",\"$filter\":{\"parentfieldid\":null},\"$recursion\":{\"parentfieldid\":\"_id\",\"$alias\":\"fields\"}}"}
    ],
        triggers:[
            {
                functionName:"CollectionPreInsertTrigger",
                operations:["insert"],
                when:"pre"
            },
            {
                functionName:"CollectionPreUpdateTrigger",
                operations:["update"],
                when:"pre"
            }
        ], merge:{collection:"union"}},
    {collection:Constants.Admin.FIELDS, fields:[
        {field:Constants.Admin.Fields.FIELD, type:Constants.Admin.Fields.Type.STRING, mandatory:true},
        {field:Constants.Admin.Fields.COLLECTION_ID, type:Constants.Admin.Fields.Type.FK, "collection":Constants.Admin.COLLECTIONS, set:[Constants.Admin.Collections.COLLECTION], mandatory:true},
        {field:Constants.Admin.Fields.PARENT_FIELD_ID, type:Constants.Admin.Fields.Type.FK, "collection":Constants.Admin.FIELDS, set:[Constants.Admin.Fields.FIELD]},
        {field:Constants.Admin.Fields.QUERY, type:Constants.Admin.Fields.Type.STRING},
        {field:Constants.Admin.Fields.FK, type:Constants.Admin.Fields.Type.STRING},
        {field:"fields", type:"object", multiple:true, fk:Constants.Admin.Fields.PARENT_FIELD_ID, query:"{\"$collection\":\"pl.fields\"}"}
    ], triggers:[
        {
            functionName: "FieldPreInsertTrigger",
            operations: ["insert"],
            when: "pre"
        },
        {
            functionName: "FieldPreUpdateTrigger",
            operations: ["update"],
            when: "pre"
        } ,
        {
            functionName: "Field_Trigger",
            operations: ["insert", "update", "delete"],
            when: "post"
        }
    ], merge:{collection:"union"}}
];


describe("ChildModule testcase", function () {

    before(function (done) {
        ApplaneDB.addCollection(collectionsToRegister, function (err) {
            if (err) {
                done(err);
                return;
            }
            done();
        })
    })

    afterEach(function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            db.dropDatabase(function (err) {
                done(err);
            })
        });
    })

    it("Orders and Deliveries with override deliveries", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }

            var orderUpdates = [
                {$collection:"orders", $insert:[
                    {_id:1, order_no:"123",
                        deliveries:[
                            {code:"xx1", amount:100},
                            {code:"xx2", amount:200}
                        ]
                    }
                ]
                }
            ];

            db.batchUpdateById(orderUpdates, function (err, res) {
                if (err) {
                    done(err);
                    return;
                }
                db.db.collection("orders").find().toArray(function (err, orders) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log("orders >>>>>>>>>>>>>>>>>" + JSON.stringify(orders));
                    expect(orders).to.have.length(1);
                    expect(orders[0].order_no).to.eql("123");
                    expect(orders[0].deliveries).to.eql(undefined);
                    db.db.collection("deliveries").find().toArray(function (err, deliveries) {
                        if (err) {
                            done(err);
                            return;
                        }
                        console.log("deliveries >>>>>>>>>>>>>>>>>" + JSON.stringify(deliveries));
                        expect(deliveries).to.have.length(2);
                        expect(deliveries[0].code).to.eql("xx1");
                        expect(deliveries[0].amount).to.eql(100);
                        expect(deliveries[0].orderid._id).to.eql(1);
                        expect(deliveries[1].code).to.eql("xx2");
                        expect(deliveries[1].amount).to.eql(200);
                        expect(deliveries[1].orderid._id).to.eql(1);
                        db.query({$collection:"orders", $sort:{order_no:1}}, function (err, orders) {
                            if (err) {
                                done(err);
                                return;
                            }
                            console.log("orders >>>>>>>>>>>>>>>>>" + JSON.stringify(orders));
                            expect(orders.result).to.have.length(1);
                            expect(orders.result[0].order_no).to.eql("123");
                            expect(orders.result[0].deliveries).to.have.length(2);
                            expect(orders.result[0].deliveries[0].code).to.eql("xx1");
                            expect(orders.result[0].deliveries[0].amount).to.eql(100);
                            expect(orders.result[0].deliveries[0].orderid._id).to.eql(1);
                            expect(orders.result[0].deliveries[1].code).to.eql("xx2");
                            expect(orders.result[0].deliveries[1].amount).to.eql(200);
                            expect(orders.result[0].deliveries[1].orderid._id).to.eql(1);
                            db.query({$collection:"orders", $fields:{"deliveries":1}, $sort:{order_no:1}}, function (err, orders) {
                                if (err) {
                                    done(err);
                                    return;
                                }
                                console.log("orders >>>>>>>>>>>>>>>>>" + JSON.stringify(orders));
                                expect(orders.result).to.have.length(1);
                                expect(orders.result[0].order_no).to.eql("123");
                                expect(orders.result[0].deliveries).to.have.length(2);
                                expect(orders.result[0].deliveries[0].code).to.eql("xx1");
                                expect(orders.result[0].deliveries[0].amount).to.eql(100);
                                expect(orders.result[0].deliveries[0].orderid._id).to.eql(1);
                                expect(orders.result[0].deliveries[1].code).to.eql("xx2");
                                expect(orders.result[0].deliveries[1].amount).to.eql(200);
                                expect(orders.result[0].deliveries[1].orderid._id).to.eql(1);
                                db.query({$collection:"orders", $fields:{"deliveries":0}, $sort:{order_no:1}}, function (err, orders) {
                                    if (err) {
                                        done(err);
                                        return;
                                    }
                                    console.log("orders >>>>>>>>>>>>>>>>>" + JSON.stringify(orders));
                                    expect(orders.result).to.have.length(1);
                                    expect(orders.result[0].order_no).to.eql("123");
                                    expect(orders.result[0].deliveries).to.eql(undefined);
                                    db.query({$collection:"orders", $fields:{"deliveries1":"$deliveries"}, $sort:{order_no:1}}, function (err, orders) {
                                        if (err) {
                                            done(err);
                                            return;
                                        }
                                        console.log("orders >>>>>>>>>>>>>>>>>" + JSON.stringify(orders));
                                        expect(orders.result).to.have.length(1);
                                        expect(orders.result[0].order_no).to.eql("123");
                                        expect(orders.result[0].deliveries1).to.have.length(2);
                                        expect(orders.result[0].deliveries1[0].code).to.eql("xx1");
                                        expect(orders.result[0].deliveries1[0].amount).to.eql(100);
                                        expect(orders.result[0].deliveries1[0].orderid._id).to.eql(1);
                                        expect(orders.result[0].deliveries1[1].code).to.eql("xx2");
                                        expect(orders.result[0].deliveries1[1].amount).to.eql(200);
                                        expect(orders.result[0].deliveries1[1].orderid._id).to.eql(1);
                                        db.query({$collection:"orders", $fields:{"deliveries1":"$deliveries", "deliveries2":"$deliveries"}, $sort:{order_no:1}}, function (err, orders) {
                                            if (err) {
                                                done(err);
                                                return;
                                            }
                                            console.log("orders >>>>>>>>>>>>>>>>>" + JSON.stringify(orders));
                                            expect(orders.result).to.have.length(1);
                                            expect(orders.result[0].order_no).to.eql("123");
                                            expect(orders.result[0].deliveries1).to.have.length(2);
                                            expect(orders.result[0].deliveries1[0].code).to.eql("xx1");
                                            expect(orders.result[0].deliveries1[0].amount).to.eql(100);
                                            expect(orders.result[0].deliveries1[0].orderid._id).to.eql(1);
                                            expect(orders.result[0].deliveries1[1].code).to.eql("xx2");
                                            expect(orders.result[0].deliveries1[1].amount).to.eql(200);
                                            expect(orders.result[0].deliveries1[1].orderid._id).to.eql(1);
                                            expect(orders.result[0].deliveries2).to.have.length(2);
                                            expect(orders.result[0].deliveries2[0].code).to.eql("xx1");
                                            expect(orders.result[0].deliveries2[0].amount).to.eql(100);
                                            expect(orders.result[0].deliveries2[0].orderid._id).to.eql(1);
                                            expect(orders.result[0].deliveries2[1].code).to.eql("xx2");
                                            expect(orders.result[0].deliveries2[1].amount).to.eql(200);
                                            expect(orders.result[0].deliveries2[1].orderid._id).to.eql(1);
                                            done();
                                        })
                                    })
                                })
                            })
                        })
                    })
                })
            })
        })
    })

    it("Orders and Deliveries", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }

            var orderUpdates = [
                {$collection:"orders", $insert:[
                    {_id:1, order_no:"123",
                        deliveries:{
                            $insert:[
                                {_id:"xx1", code:"xx1", amount:100},
                                {_id:"xx2", code:"xx2", amount:200} ,
                                {_id:"xx3", code:"xx3", amount:300}
                            ]
                        }
                    }
                ]
                }
            ];

            db.batchUpdateById(orderUpdates, function (err, res) {
                if (err) {
                    done(err);
                    return;
                }
                db.db.collection("orders").find().toArray(function (err, orders) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log("orders >>>>>>>>>>>>>>>>>" + JSON.stringify(orders));
                    expect(orders).to.have.length(1);
                    expect(orders[0].order_no).to.eql("123");
                    expect(orders[0].deliveries).to.eql(undefined);
                    db.db.collection("deliveries").find().toArray(function (err, deliveries) {
                        if (err) {
                            done(err);
                            return;
                        }
                        console.log("deliveries >>>>>>>>>>>>>>>>>" + JSON.stringify(deliveries));
                        expect(deliveries).to.have.length(3);
                        expect(deliveries[0].code).to.eql("xx1");
                        expect(deliveries[0].amount).to.eql(100);
                        expect(deliveries[0].orderid._id).to.eql(1);
                        expect(deliveries[1].code).to.eql("xx2");
                        expect(deliveries[1].amount).to.eql(200);
                        expect(deliveries[1].orderid._id).to.eql(1);
                        expect(deliveries[2].code).to.eql("xx3");
                        expect(deliveries[2].amount).to.eql(300);
                        expect(deliveries[2].orderid._id).to.eql(1);
                        done();
                    })
                })
            })
        })
    })

    it("Orders and Deliveries and invoices and accounts", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var orderUpdates = [
                {$collection:"orders", $insert:[
                    {_id:1, order_no:"123",
                        deliveries:{
                            $insert:[
                                {_id:"xx1", code:"xx1", amount:100},
                                {_id:"xx2", code:"xx2", amount:200},
                                {_id:"xx3", code:"xx3", amount:300}
                            ]
                        }, invoices:{
                        $insert:[
                            {_id:"xx1", code:"xx1", amount:100},
                            {_id:"xx2", code:"xx2", amount:200},
                            {_id:"xx3", code:"xx3", amount:300}
                        ]
                    }, accounts:{
                        $insert:[
                            {_id:"xx1", code:"xx1", amount:100},
                            {_id:"xx2", code:"xx2", amount:200},
                            {_id:"xx3", code:"xx3", amount:300}
                        ]
                    }
                    }
                ]
                }
            ];
            db.batchUpdateById(orderUpdates, function (err, res) {
                if (err) {
                    done(err);
                    return;
                }
                db.db.collection("orders").find().toArray(function (err, orders) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log("orders >>>>>>>>>>>>>>>>>" + JSON.stringify(orders));
                    expect(orders).to.have.length(1);
                    expect(orders[0].order_no).to.eql("123");
                    expect(orders[0].deliveries).to.eql(undefined);
                    expect(orders[0].invoices).to.eql(undefined);
                    expect(orders[0].accounts).to.eql(undefined);
                    db.db.collection("deliveries").find().toArray(function (err, deliveries) {
                        if (err) {
                            done(err);
                            return;
                        }
                        console.log("deliveries >>>>>>>>>>>>>>>>>" + JSON.stringify(deliveries));
                        expect(deliveries).to.have.length(3);
                        expect(deliveries[0].code).to.eql("xx1");
                        expect(deliveries[0].amount).to.eql(100);
                        expect(deliveries[0].orderid._id).to.eql(1);
                        expect(deliveries[1].code).to.eql("xx2");
                        expect(deliveries[1].amount).to.eql(200);
                        expect(deliveries[1].orderid._id).to.eql(1);
                        expect(deliveries[2].code).to.eql("xx3");
                        expect(deliveries[2].amount).to.eql(300);
                        expect(deliveries[2].orderid._id).to.eql(1);
                        db.db.collection("invoices").find().toArray(function (err, invoices) {
                            if (err) {
                                done(err);
                                return;
                            }
                            console.log("invoices >>>>>>>>>>>>>>>>>" + JSON.stringify(invoices));
                            expect(invoices).to.have.length(3);
                            expect(invoices[0].code).to.eql("xx1");
                            expect(invoices[0].amount).to.eql(100);
                            expect(invoices[0].orderid._id).to.eql(1);
                            expect(invoices[1].code).to.eql("xx2");
                            expect(invoices[1].amount).to.eql(200);
                            expect(invoices[1].orderid._id).to.eql(1);
                            expect(invoices[2].code).to.eql("xx3");
                            expect(invoices[2].amount).to.eql(300);
                            expect(invoices[2].orderid._id).to.eql(1);
                            db.db.collection("accounts").find().toArray(function (err, accounts) {
                                if (err) {
                                    done(err);
                                    return;
                                }
                                console.log("accounts >>>>>>>>>>>>>>>>>" + JSON.stringify(accounts));
                                expect(accounts).to.have.length(3);
                                expect(accounts[0].code).to.eql("xx1");
                                expect(accounts[0].amount).to.eql(100);
                                expect(accounts[0].orderid._id).to.eql(1);
                                expect(accounts[1].code).to.eql("xx2");
                                expect(accounts[1].amount).to.eql(200);
                                expect(accounts[1].orderid._id).to.eql(1);
                                expect(accounts[2].code).to.eql("xx3");
                                expect(accounts[2].amount).to.eql(300);
                                expect(accounts[2].orderid._id).to.eql(1);
                                db.query({$collection:"orders", $sort:{order_no:1}}, function (err, orders) {
                                    if (err) {
                                        done(err);
                                        return;
                                    }
                                    console.log("orders >>>>>>>>>>>>>>>>>" + JSON.stringify(orders));
                                    expect(orders.result).to.have.length(1);
                                    expect(orders.result[0].order_no).to.eql("123");
                                    expect(orders.result[0].deliveries).to.have.length(3);
                                    expect(orders.result[0].invoices).to.have.length(3);
                                    expect(orders.result[0].accounts).to.have.length(3);
                                    db.query({$collection:"orders", $fields:{"deliveries":1}, $sort:{order_no:1}}, function (err, orders) {
                                        if (err) {
                                            done(err);
                                            return;
                                        }
                                        console.log("orders >>>>>>>>>>>>>>>>>" + JSON.stringify(orders));
                                        expect(orders.result).to.have.length(1);
                                        expect(orders.result[0].order_no).to.eql("123");
                                        expect(orders.result[0].deliveries).to.have.length(3);
                                        expect(orders.result[0].invoices).to.eql(undefined);
                                        expect(orders.result[0].accounts).to.eql(undefined);
                                        db.query({$collection:"orders", $fields:{"deliveries":1, accounts:1}, $sort:{order_no:1}}, function (err, orders) {
                                            if (err) {
                                                done(err);
                                                return;
                                            }
                                            console.log("orders >>>>>>>>>>>>>>>>>" + JSON.stringify(orders));
                                            expect(orders.result).to.have.length(1);
                                            expect(orders.result[0].order_no).to.eql("123");
                                            expect(orders.result[0].deliveries).to.have.length(3);
                                            expect(orders.result[0].invoices).to.eql(undefined);
                                            expect(orders.result[0].accounts).to.have.length(3);
                                            db.query({$collection:"orders", $fields:{"invoices":0}, $sort:{order_no:1}}, function (err, orders) {
                                                if (err) {
                                                    done(err);
                                                    return;
                                                }
                                                console.log("orders >>>>>>>>>>>>>>>>>" + JSON.stringify(orders));
                                                expect(orders.result).to.have.length(1);
                                                expect(orders.result[0].order_no).to.eql("123");
                                                expect(orders.result[0].deliveries).to.have.length(3);
                                                expect(orders.result[0].invoices).to.eql(undefined);
                                                expect(orders.result[0].accounts).to.have.length(3);
                                                db.query({$collection:"orders", $fields:{"invoices":0, "deliveries":0, "accounts":0}, $sort:{order_no:1}}, function (err, orders) {
                                                    if (err) {
                                                        done(err);
                                                        return;
                                                    }
                                                    console.log("orders >>>>>>>>>>>>>>>>>" + JSON.stringify(orders));
                                                    expect(orders.result).to.have.length(1);
                                                    expect(orders.result[0].order_no).to.eql("123");
                                                    expect(orders.result[0].deliveries).to.eql(undefined);
                                                    expect(orders.result[0].accounts).to.eql(undefined);
                                                    expect(orders.result[0].invoices).to.eql(undefined);
                                                    done();
                                                })
                                            })
                                        })
                                    })
                                })
                            })
                        })
                    })
                })
            })
        })
    })

    it("Orders and Deliveries Update", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }

            var orderUpdates = [
                {$collection:"orders", $insert:[
                    {_id:1, order_no:"123",
                        deliveries:{
                            $insert:[
                                {_id:"xx1", code:"xx1", amount:100},
                                {_id:"xx2", code:"xx2", amount:200} ,
                                {_id:"xx3", code:"xx3", amount:300}
                            ]
                        }
                    }
                ]
                }
            ];

            db.batchUpdateById(orderUpdates, function (err, res) {
                if (err) {
                    done(err);
                    return;
                }
                var update = [
                    {$collection:"orders", $update:[
                        {_id:1,
                            $set:{deliveries:{
                                $insert:[
                                    {_id:"xx4", code:"xx4", amount:400}
                                ],
                                $update:[
                                    {_id:"xx1", $set:{code:"XX1"}}
                                ], $delete:[
                                    {_id:"xx2"}
                                ]
                            }}
                        }
                    ]
                    }
                ];
                db.batchUpdateById(update, function (err, res) {
                    if (err) {
                        done(err);
                        return;
                    }
                    db.db.collection("orders").find().toArray(function (err, orders) {
                        if (err) {
                            done(err);
                            return;
                        }
                        console.log("orders >>>>>>>>>>>>>>>>>" + JSON.stringify(orders));
                        expect(orders).to.have.length(1);
                        expect(orders[0].order_no).to.eql("123");
                        expect(orders[0].deliveries).to.eql(undefined);
                        db.db.collection("deliveries").find().toArray(function (err, deliveries) {
                            if (err) {
                                done(err);
                                return;
                            }
                            console.log("deliveries >>>>>>>>>>>>>>>>>" + JSON.stringify(deliveries));
                            expect(deliveries).to.have.length(3);
                            expect(deliveries[0].code).to.eql("XX1");
                            expect(deliveries[0].amount).to.eql(100);
                            expect(deliveries[0].orderid._id).to.eql(1);
                            expect(deliveries[1].code).to.eql("xx3");
                            expect(deliveries[1].amount).to.eql(300);
                            expect(deliveries[1].orderid._id).to.eql(1);
                            expect(deliveries[2].code).to.eql("xx4");
                            expect(deliveries[2].amount).to.eql(400);
                            expect(deliveries[2].orderid._id).to.eql(1);
                            done();
                        })
                    })
                })
            })
        })
    })

    it("Orders and Deliveries unset deliveries", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }

            var orderUpdates = [
                {$collection:"orders", $insert:[
                    {_id:1, order_no:"123",
                        deliveries:{
                            $insert:[
                                {_id:"xx1", code:"xx1", amount:100},
                                {_id:"xx2", code:"xx2", amount:200} ,
                                {_id:"xx3", code:"xx3", amount:300}
                            ]
                        }
                    }
                ]
                }
            ];

            db.batchUpdateById(orderUpdates, function (err, res) {
                if (err) {
                    done(err);
                    return;
                }
                var update = [
                    {$collection:"orders", $update:[
                        {_id:1,
                            $unset:{deliveries:1}
                        }
                    ]
                    }
                ];
                db.batchUpdateById(update, function (err, res) {
                    if (err) {
                        done(err);
                        return;
                    }
                    db.db.collection("orders").find().toArray(function (err, orders) {
                        if (err) {
                            done(err);
                            return;
                        }
                        console.log("orders >>>>>>>>>>>>>>>>>" + JSON.stringify(orders));
                        expect(orders).to.have.length(1);
                        expect(orders[0].order_no).to.eql("123");
                        expect(orders[0].deliveries).to.eql(undefined);
                        db.db.collection("deliveries").find().toArray(function (err, deliveries) {
                            if (err) {
                                done(err);
                                return;
                            }
                            console.log("deliveries >>>>>>>>>>>>>>>>>" + JSON.stringify(deliveries));
                            expect(deliveries).to.have.length(0);
                            done();
                        })
                    })
                })
            })
        })
    })

    it("Collection and fields recursive", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var batchUpdates = [
                {
                    $collection:Constants.Admin.COLLECTIONS,
                    $insert:[
                        {_id:"vouchers", collection:"vouchers", fields:{$insert:[
                            {field:"voucherno", type:"string"},
                            {field:"voucherlineitems", type:"object", multiple:true, fields:[
                                {field:"amount", type:"decimal"},
                                {field:"accountid", type:"fk", collection:"accounts"},
                                {field:"ilis", type:"object", multiple:true, fields:[
                                    {"field":"id", type:"string"}
                                ]}
                            ]}
                        ]}}
                    ]

//                    $insert:[
//                        {_id:"vouchers", collection:"vouchers", fields:[
//                            {field:"voucherno", type:"string"},
//                            {field:"voucherlineitems", type:"object", multiple:true, fields:[
//                                {field:"amount", type:"decimal"},
//                                {field:"accountid", type:"fk", collection:"accounts"}
//                            ]}
//                        ]}
//                    ]
                }
            ];
            db.batchUpdateById(batchUpdates, function (err, res) {
                if (err) {
                    done(err);
                    return;
                }
                db.db.collection(Constants.Admin.COLLECTIONS).find().toArray(function (err, collections) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log("collections >>>>>>>>>>>>>>>>>" + JSON.stringify(collections));
                    expect(collections).to.have.length(1);
                    expect(collections[0]._id).to.eql("vouchers");
                    expect(collections[0].collection).to.eql("vouchers");
                    expect(collections[0].fields).to.eql(undefined);
                    db.db.collection(Constants.Admin.FIELDS).find({}, {sort:{field:1, parentfieldid:1}}).toArray(function (err, fields) {
                        if (err) {
                            done(err);
                            return;
                        }
                        console.log("fields >>>>>>>>>>>>>>>>>" + JSON.stringify(fields));
                        expect(fields).to.have.length(6);
                        expect(fields[0].field).to.eql("accountid");
                        expect(fields[0].collectionid.collection).to.eql("vouchers");
                        expect(fields[0].parentfieldid.field).to.eql("voucherlineitems");
                        expect(fields[1].field).to.eql("amount");
                        expect(fields[1].collectionid.collection).to.eql("vouchers");
                        expect(fields[1].parentfieldid.field).to.eql("voucherlineitems");
                        expect(fields[2].field).to.eql("id");
                        expect(fields[2].collectionid.collection).to.eql("vouchers");
                        expect(fields[2].parentfieldid.field).to.eql("ilis");
                        expect(fields[3].field).to.eql("ilis");
                        expect(fields[3].collectionid.collection).to.eql("vouchers");
                        expect(fields[3].parentfieldid.field).to.eql("voucherlineitems");
                        expect(fields[4].field).to.eql("voucherlineitems");
                        expect(fields[4].collectionid.collection).to.eql("vouchers");
                        expect(fields[4].parentfieldid).to.eql(undefined);
                        expect(fields[5].field).to.eql("voucherno");
                        expect(fields[5].collectionid.collection).to.eql("vouchers");
                        expect(fields[5].parentfieldid).to.eql(undefined);

                        var expResult = [
                            {"field":"accountid", "type":"fk", "collection":"accounts", "collectionid":{"_id":"vouchers", "collection":"vouchers"}, "parentfieldid":{"field":"voucherlineitems", "_id":"535e2a9c7cd7c3c41c1e6edd"}, "_id":"535e2a9c7cd7c3c41c1e6ee5"},
                            {"field":"amount", "type":"decimal", "co llectionid":{"_id":"vouchers", "collection":"vouchers"}, "parentfieldid":{"field":"voucherlineitems", "_id":"535e2a9c7cd7c3c41c1e6edd"}, "_id":"535e2a9c7cd7c3c41c1e6ee1"},
                            {"field":"id", "type":"string", "parentfieldid":{"field":"ilis", "_id":"535e2a9c7cd7c3c41c1e6ee9"}, "_id":"535e2a9c7cd7c3c41c1e6eee"},
                            {"f ield":"ilis", "type":"object", "multiple":true, "collectionid":{"_id":"vouchers", "collection":"vouchers"}, "parentfieldid":{"field":"voucherlineitems", "_id":"535e2a9c7cd7c3c41c1e6edd"}, "_id":"535e2a9c7cd7c3c41c1e6ee9"},
                            {"field":"voucherlineitems", "type":"object", "multiple":true, "collectionid":{"_id":"vo uchers", "collection":"vouchers"}, "_id":"535e2a9c7cd7c3c41c1e6edd"},
                            {"field":"voucherno", "type":"string", "collectionid":{"_id":"vouchers", "collection":"vouchers"}, "_id":"535e2a9c7cd7c3c41c1e6eda"}
                        ];

                        db.query({$collection:Constants.Admin.COLLECTIONS, $sort:{collection:1}}, function (err, collections) {
                            if (err) {
                                done(err);
                                return;
                            }
                            console.log("collections >>>>>>>>>>>>>>>>>" + JSON.stringify(collections));
                            expect(collections.result).to.have.length(1);
                            expect(collections.result[0]._id).to.eql("vouchers");
                            expect(collections.result[0].collection).to.eql("vouchers");
                            expect(collections.result[0].fields).to.have.length(2);
                            expect(collections.result[0].fields[0].field).to.eql("voucherno");
                            expect(collections.result[0].fields[0].collectionid.collection).to.eql("vouchers");
                            expect(collections.result[0].fields[1].field).to.eql("voucherlineitems");
                            expect(collections.result[0].fields[1].collectionid.collection).to.eql("vouchers");
                            expect(collections.result[0].fields[1].fields).to.have.length(3);
                            expect(collections.result[0].fields[1].fields[0].field).to.eql("amount");
                            expect(collections.result[0].fields[1].fields[0].collectionid.collection).to.eql("vouchers");
                            expect(collections.result[0].fields[1].fields[0].parentfieldid.field).to.eql("voucherlineitems");
                            expect(collections.result[0].fields[1].fields[1].field).to.eql("accountid");
                            expect(collections.result[0].fields[1].fields[1].collectionid.collection).to.eql("vouchers");
                            expect(collections.result[0].fields[1].fields[1].parentfieldid.field).to.eql("voucherlineitems");
                            expect(collections.result[0].fields[1].fields[2].field).to.eql("ilis");
                            expect(collections.result[0].fields[1].fields[2].collectionid.collection).to.eql("vouchers");
                            expect(collections.result[0].fields[1].fields[2].parentfieldid.field).to.eql("voucherlineitems");
                            expect(collections.result[0].fields[1].fields[2].fields).to.have.length(1);
                            expect(collections.result[0].fields[1].fields[2].fields[0].field).to.eql("id");
                            expect(collections.result[0].fields[1].fields[2].fields[0].collectionid.collection).to.eql("vouchers");
                            expect(collections.result[0].fields[1].fields[2].fields[0].parentfieldid.field).to.eql("ilis");
                            db.query({$collection:Constants.Admin.COLLECTIONS, $fields:{fields:1}, $sort:{collection:1}}, function (err, collections) {
                                if (err) {
                                    done(err);
                                    return;
                                }
                                console.log("collections >>>>>>>>>>>>>>>>>" + JSON.stringify(collections));
                                expect(collections.result).to.have.length(1);
                                expect(collections.result[0]._id).to.eql("vouchers");
                                expect(collections.result[0].collection).to.eql("vouchers");
                                expect(collections.result[0].fields).to.have.length(2);
                                expect(collections.result[0].fields[0].field).to.eql("voucherno");
                                expect(collections.result[0].fields[0].collectionid.collection).to.eql("vouchers");
                                expect(collections.result[0].fields[1].field).to.eql("voucherlineitems");
                                expect(collections.result[0].fields[1].collectionid.collection).to.eql("vouchers");
                                expect(collections.result[0].fields[1].fields).to.have.length(3);
                                expect(collections.result[0].fields[1].fields[0].field).to.eql("amount");
                                expect(collections.result[0].fields[1].fields[0].collectionid.collection).to.eql("vouchers");
                                expect(collections.result[0].fields[1].fields[0].parentfieldid.field).to.eql("voucherlineitems");
                                expect(collections.result[0].fields[1].fields[1].field).to.eql("accountid");
                                expect(collections.result[0].fields[1].fields[1].collectionid.collection).to.eql("vouchers");
                                expect(collections.result[0].fields[1].fields[1].parentfieldid.field).to.eql("voucherlineitems");
                                expect(collections.result[0].fields[1].fields[2].field).to.eql("ilis");
                                expect(collections.result[0].fields[1].fields[2].collectionid.collection).to.eql("vouchers");
                                expect(collections.result[0].fields[1].fields[2].parentfieldid.field).to.eql("voucherlineitems");
                                expect(collections.result[0].fields[1].fields[2].fields).to.have.length(1);
                                expect(collections.result[0].fields[1].fields[2].fields[0].field).to.eql("id");
                                expect(collections.result[0].fields[1].fields[2].fields[0].collectionid.collection).to.eql("vouchers");
                                expect(collections.result[0].fields[1].fields[2].fields[0].parentfieldid.field).to.eql("ilis");
                                db.query({$collection:Constants.Admin.COLLECTIONS, $fields:{_id:1, fields:1}, $sort:{collection:1}}, function (err, collections) {
                                    if (err) {
                                        done(err);
                                        return;
                                    }
                                    console.log("collections >>>>>>>>>>>>>>>>>" + JSON.stringify(collections));
                                    expect(collections.result).to.have.length(1);
                                    expect(collections.result[0]._id).to.eql("vouchers");
                                    expect(collections.result[0].collection).to.eql(undefined);
                                    expect(collections.result[0].fields).to.have.length(2);
                                    expect(collections.result[0].fields[0].field).to.eql("voucherno");
                                    expect(collections.result[0].fields[0].collectionid.collection).to.eql("vouchers");
                                    expect(collections.result[0].fields[1].field).to.eql("voucherlineitems");
                                    expect(collections.result[0].fields[1].collectionid.collection).to.eql("vouchers");
                                    expect(collections.result[0].fields[1].fields).to.have.length(3);
                                    expect(collections.result[0].fields[1].fields[0].field).to.eql("amount");
                                    expect(collections.result[0].fields[1].fields[0].collectionid.collection).to.eql("vouchers");
                                    expect(collections.result[0].fields[1].fields[0].parentfieldid.field).to.eql("voucherlineitems");
                                    expect(collections.result[0].fields[1].fields[1].field).to.eql("accountid");
                                    expect(collections.result[0].fields[1].fields[1].collectionid.collection).to.eql("vouchers");
                                    expect(collections.result[0].fields[1].fields[1].parentfieldid.field).to.eql("voucherlineitems");
                                    expect(collections.result[0].fields[1].fields[2].field).to.eql("ilis");
                                    expect(collections.result[0].fields[1].fields[2].collectionid.collection).to.eql("vouchers");
                                    expect(collections.result[0].fields[1].fields[2].parentfieldid.field).to.eql("voucherlineitems");
                                    expect(collections.result[0].fields[1].fields[2].fields).to.have.length(1);
                                    expect(collections.result[0].fields[1].fields[2].fields[0].field).to.eql("id");
                                    expect(collections.result[0].fields[1].fields[2].fields[0].collectionid.collection).to.eql("vouchers");
                                    expect(collections.result[0].fields[1].fields[2].fields[0].parentfieldid.field).to.eql("ilis");
                                    db.query({$collection:Constants.Admin.COLLECTIONS, $fields:{_id:1}, $sort:{collection:1}}, function (err, collections) {
                                        if (err) {
                                            done(err);
                                            return;
                                        }
                                        console.log("collections >>>>>>>>>>>>>>>>>" + JSON.stringify(collections));
                                        expect(collections.result).to.have.length(1);
                                        expect(collections.result[0]._id).to.eql("vouchers");
                                        expect(collections.result[0].collection).to.eql(undefined);
                                        expect(collections.result[0].fields).to.eql(undefined);
                                        db.query({$collection:Constants.Admin.COLLECTIONS, $fields:{fields:0}, $sort:{collection:1}}, function (err, collections) {
                                            if (err) {
                                                done(err);
                                                return;
                                            }
                                            console.log("collections >>>>>>>>>>>>>>>>>" + JSON.stringify(collections));
                                            expect(collections.result).to.have.length(1);
                                            expect(collections.result[0]._id).to.eql("vouchers");
                                            expect(collections.result[0].collection).to.eql("vouchers");
                                            expect(collections.result[0].fields).to.eql(undefined);
                                            done();
                                        })
                                    })
                                })
                            })
                        })
                    })
                })
            })
        })
    })

    it("Collection and fields recursive with change alias", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var batchUpdates = [
                {
                    $collection:Constants.Admin.COLLECTIONS,
                    $insert:[
                        {_id:"vouchers", collection:"vouchers", fields:{$insert:[
                            {field:"voucherno", type:"string"},
                            {field:"voucherlineitems", type:"object", multiple:true, fields:[
                                {field:"amount", type:"decimal"},
                                {field:"accountid", type:"fk", collection:"accounts"},
                                {field:"ilis", type:"object", multiple:true, fields:[
                                    {"field":"id", type:"string"}
                                ]}
                            ]}
                        ]}}
                    ]

//                    $insert:[
//                        {_id:"vouchers", collection:"vouchers", fields:[
//                            {field:"voucherno", type:"string"},
//                            {field:"voucherlineitems", type:"object", multiple:true, fields:[
//                                {field:"amount", type:"decimal"},
//                                {field:"accountid", type:"fk", collection:"accounts"}
//                            ]}
//                        ]}
//                    ]
                }
            ];
            db.batchUpdateById(batchUpdates, function (err, res) {
                if (err) {
                    done(err);
                    return;
                }
                db.db.collection(Constants.Admin.COLLECTIONS).find().toArray(function (err, collections) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log("collections >>>>>>>>>>>>>>>>>" + JSON.stringify(collections));
                    expect(collections).to.have.length(1);
                    expect(collections[0]._id).to.eql("vouchers");
                    expect(collections[0].collection).to.eql("vouchers");
                    expect(collections[0].fields).to.eql(undefined);
                    db.db.collection(Constants.Admin.FIELDS).find({}, {sort:{field:1, parentfieldid:1}}).toArray(function (err, fields) {
                        if (err) {
                            done(err);
                            return;
                        }
                        console.log("fields >>>>>>>>>>>>>>>>>" + JSON.stringify(fields));
                        expect(fields).to.have.length(6);
                        expect(fields[0].field).to.eql("accountid");
                        expect(fields[0].collectionid.collection).to.eql("vouchers");
                        expect(fields[0].parentfieldid.field).to.eql("voucherlineitems");
                        expect(fields[1].field).to.eql("amount");
                        expect(fields[1].collectionid.collection).to.eql("vouchers");
                        expect(fields[1].parentfieldid.field).to.eql("voucherlineitems");
                        expect(fields[2].field).to.eql("id");
                        expect(fields[2].collectionid.collection).to.eql("vouchers");
                        expect(fields[2].parentfieldid.field).to.eql("ilis");
                        expect(fields[3].field).to.eql("ilis");
                        expect(fields[3].collectionid.collection).to.eql("vouchers");
                        expect(fields[3].parentfieldid.field).to.eql("voucherlineitems");
                        expect(fields[4].field).to.eql("voucherlineitems");
                        expect(fields[4].collectionid.collection).to.eql("vouchers");
                        expect(fields[4].parentfieldid).to.eql(undefined);
                        expect(fields[5].field).to.eql("voucherno");
                        expect(fields[5].collectionid.collection).to.eql("vouchers");
                        expect(fields[5].parentfieldid).to.eql(undefined);

                        var expResult = [
                            {"field":"accountid", "type":"fk", "collection":"accounts", "collectionid":{"_id":"vouchers", "collection":"vouchers"}, "parentfieldid":{"field":"voucherlineitems", "_id":"535e2a9c7cd7c3c41c1e6edd"}, "_id":"535e2a9c7cd7c3c41c1e6ee5"},
                            {"field":"amount", "type":"decimal", "co llectionid":{"_id":"vouchers", "collection":"vouchers"}, "parentfieldid":{"field":"voucherlineitems", "_id":"535e2a9c7cd7c3c41c1e6edd"}, "_id":"535e2a9c7cd7c3c41c1e6ee1"},
                            {"field":"id", "type":"string", "parentfieldid":{"field":"ilis", "_id":"535e2a9c7cd7c3c41c1e6ee9"}, "_id":"535e2a9c7cd7c3c41c1e6eee"},
                            {"f ield":"ilis", "type":"object", "multiple":true, "collectionid":{"_id":"vouchers", "collection":"vouchers"}, "parentfieldid":{"field":"voucherlineitems", "_id":"535e2a9c7cd7c3c41c1e6edd"}, "_id":"535e2a9c7cd7c3c41c1e6ee9"},
                            {"field":"voucherlineitems", "type":"object", "multiple":true, "collectionid":{"_id":"vo uchers", "collection":"vouchers"}, "_id":"535e2a9c7cd7c3c41c1e6edd"},
                            {"field":"voucherno", "type":"string", "collectionid":{"_id":"vouchers", "collection":"vouchers"}, "_id":"535e2a9c7cd7c3c41c1e6eda"}
                        ];

                        db.query({$collection:{collection:Constants.Admin.COLLECTIONS, fields:[
                            {field:"fields", type:"object", multiple:true, fk:Constants.Admin.Fields.COLLECTION_ID, query:"{\"$collection\":\"pl.fields\",\"$filter\":{\"parentfieldid\":null},\"$recursion\":{\"parentfieldid\":\"_id\",\"$alias\":\"parentfields\"}}"}
                        ]}, $sort:{collection:1}}, function (err, collections) {
                            if (err) {
                                done(err);
                                return;
                            }
//                            console.log("collections >>>>>>>>>>>>>>>>>" + JSON.stringify(collections));
                            expect(collections.result).to.have.length(1);
                            expect(collections.result[0]._id).to.eql("vouchers");
                            expect(collections.result[0].collection).to.eql("vouchers");
                            expect(collections.result[0].fields).to.have.length(2);
                            expect(collections.result[0].fields[0].field).to.eql("voucherno");
                            expect(collections.result[0].fields[0].collectionid.collection).to.eql("vouchers");
                            expect(collections.result[0].fields[1].field).to.eql("voucherlineitems");
                            expect(collections.result[0].fields[1].collectionid.collection).to.eql("vouchers");
//                            expect(collections.result[0].fields[1].fields).to.eql(undefined);
                            expect(collections.result[0].fields[1].parentfields).to.have.length(3);
                            expect(collections.result[0].fields[1].parentfields[0].field).to.eql("amount");
                            expect(collections.result[0].fields[1].parentfields[0].collectionid.collection).to.eql("vouchers");
                            expect(collections.result[0].fields[1].parentfields[0].parentfieldid.field).to.eql("voucherlineitems");
                            expect(collections.result[0].fields[1].parentfields[1].field).to.eql("accountid");
                            expect(collections.result[0].fields[1].parentfields[1].collectionid.collection).to.eql("vouchers");
                            expect(collections.result[0].fields[1].parentfields[1].parentfieldid.field).to.eql("voucherlineitems");
                            expect(collections.result[0].fields[1].parentfields[2].field).to.eql("ilis");
                            expect(collections.result[0].fields[1].parentfields[2].collectionid.collection).to.eql("vouchers");
                            expect(collections.result[0].fields[1].parentfields[2].parentfieldid.field).to.eql("voucherlineitems");
//                            expect(collections.result[0].fields[1].parentfields[2].fields).to.eql(undefined);
                            expect(collections.result[0].fields[1].parentfields[2].parentfields).to.have.length(1);
                            expect(collections.result[0].fields[1].parentfields[2].parentfields[0].field).to.eql("id");
                            expect(collections.result[0].fields[1].parentfields[2].parentfields[0].collectionid.collection).to.eql("vouchers");
                            expect(collections.result[0].fields[1].parentfields[2].parentfields[0].parentfieldid.field).to.eql("ilis");
                            db.query({$collection:{collection:Constants.Admin.COLLECTIONS, fields:[
                                {field:"fields", type:"object", multiple:true, fk:Constants.Admin.Fields.COLLECTION_ID, query:"{\"$collection\":\"pl.fields\",\"$filter\":{\"parentfieldid\":null},\"$fields\":{\"fields\":0},\"$recursion\":{\"parentfieldid\":\"_id\",\"$alias\":\"parentfields\"}}"}
                            ]}, $sort:{collection:1}}, function (err, collections) {
                                if (err) {
                                    done(err);
                                    return;
                                }
                                console.log("collections >>>>>>>>>>>>>>>>>" + JSON.stringify(collections));
                                expect(collections.result).to.have.length(1);
                                expect(collections.result[0]._id).to.eql("vouchers");
                                expect(collections.result[0].collection).to.eql("vouchers");
                                expect(collections.result[0].fields).to.have.length(2);
                                expect(collections.result[0].fields[0].field).to.eql("voucherno");
                                expect(collections.result[0].fields[0].collectionid.collection).to.eql("vouchers");
                                expect(collections.result[0].fields[1].field).to.eql("voucherlineitems");
                                expect(collections.result[0].fields[1].collectionid.collection).to.eql("vouchers");
                                expect(collections.result[0].fields[1].fields).to.eql(undefined);
                                expect(collections.result[0].fields[1].parentfields).to.have.length(3);
                                expect(collections.result[0].fields[1].parentfields[0].field).to.eql("amount");
                                expect(collections.result[0].fields[1].parentfields[0].collectionid.collection).to.eql("vouchers");
                                expect(collections.result[0].fields[1].parentfields[0].parentfieldid.field).to.eql("voucherlineitems");
                                expect(collections.result[0].fields[1].parentfields[1].field).to.eql("accountid");
                                expect(collections.result[0].fields[1].parentfields[1].collectionid.collection).to.eql("vouchers");
                                expect(collections.result[0].fields[1].parentfields[1].parentfieldid.field).to.eql("voucherlineitems");
                                expect(collections.result[0].fields[1].parentfields[2].field).to.eql("ilis");
                                expect(collections.result[0].fields[1].parentfields[2].collectionid.collection).to.eql("vouchers");
                                expect(collections.result[0].fields[1].parentfields[2].parentfieldid.field).to.eql("voucherlineitems");
                                expect(collections.result[0].fields[1].parentfields[2].fields).to.eql(undefined);
                                expect(collections.result[0].fields[1].parentfields[2].parentfields).to.have.length(1);
                                expect(collections.result[0].fields[1].parentfields[2].parentfields[0].field).to.eql("id");
                                expect(collections.result[0].fields[1].parentfields[2].parentfields[0].collectionid.collection).to.eql("vouchers");
                                expect(collections.result[0].fields[1].parentfields[2].parentfields[0].parentfieldid.field).to.eql("ilis");
                                done();
                            })
                        })
                    })
                })
            })
        })
    })
})
