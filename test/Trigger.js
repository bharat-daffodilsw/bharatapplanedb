/*
 * mocha --recursive --timeout 150000 -g "Trigger" --reporter spec
 * mocha --recursive --timeout 150000 -g "create another trigger with required fields in nested array" --reporter spec
 * mocha --recursive --timeout 150000 -g "create  trigger with required fields" --reporter spec
 *
 * mocha --recursive --timeout 150000 -g "create another case of update trigger with required fields in nested array" --reporter spec
 * mocha --recursive --timeout 150000 -g "required Field in post trigger" --reporter spec
 *
 *
 *
 * */

var expect = require('chai').expect;
var ApplaneDB = require("../lib/DB.js");
var Config = require("./config.js");


describe("Triggertestcase", function () {
    afterEach(function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            db.dropDatabase(function (err) {
                done(err);
            });
        });
    })

    it("insert full name pre  trigger", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }

            var modifyPerson = {   name: "modifyPerson", code: "personJob", source: "NorthwindTestCase/lib/PersonJob.js"};
            var trigger = [
                {
                    functionName: modifyPerson,
                    operations: ["insert", "delete", "update"],
                    when: "pre",
                    requiredfields: {a: 1, b: 1}
                }
            ];

            var updates = [
                {$collection: {"collection": "Persons", "triggers": trigger}, $insert: [
                    {"lastname": "Sangwan", "firstname": "Manjeet"}
                ]}
            ]

            db.batchUpdateById(updates, function (err, result) {
                if (err) {
                    done(err);
                    return;
                }
                db.query({$collection: "Persons", $sort: {country: 1}}, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log("data>>>" + JSON.stringify(data));
                    expect(data.result).to.have.length(1);
                    expect(data.result[0].fullname).to.eql("Manjeet Sangwan");
                    done();
                })
            });


        });
    });

    it("update full name pre trigger", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }

            var modifyPerson = {   name: "modifyPerson", code: "personJob", source: "NorthwindTestCase/lib/PersonJob.js"};
            var trigger = [
                {
                    functionName: modifyPerson,
                    operations: ["insert", "delete", "update"],
                    when: "pre"
                }
            ]

            var updates = [
                {$collection: {"collection": "Persons", "triggers": trigger}, $insert: [
                    {"lastname": "Sangwan", "firstname": "Manjeet"}
                ]}
            ]

            db.batchUpdateById(updates, function (err, result) {
                if (err) {
                    done(err);
                    return;
                }
                db.query({$collection: "Persons", $sort: {country: 1}}, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log("data>>>" + JSON.stringify(data));
                    expect(data.result).to.have.length(1);
                    expect(data.result[0].fullname).to.eql("Manjeet Sangwan");

                    var newUpdates = [
                        {$collection: {"collection": "Persons", "triggers": trigger}, $update: [
                            {"_id": data.result[0]._id, $set: {"lastname": "Bansal", "firstname": "Sachin"}}
                        ]}
                    ]

                    db.batchUpdateById(newUpdates, function (err, result) {
                        if (err) {
                            done(err);
                            return;
                        }
                        db.query({$collection: "Persons", $sort: {country: 1}}, function (err, data) {
                            if (err) {
                                done(err);
                                return;
                            }
                            console.log("data>>>" + JSON.stringify(data));
                            expect(data.result).to.have.length(1);
                            expect(data.result[0].fullname).to.eql("Sachin Bansal");
                            done();
                        })
                    });
                })
            });


        });
    });

    it("create voucher on invoice creation post trigger", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }

            var modifyPerson = {   name: "createVoucher", code: "job", source: "NorthwindTestCase/lib/InvoiceJob.js"};
            var trigger = [
                {
                    functionName: modifyPerson,
                    operations: ["insert", "delete", "update"],
                    when: "post"
                }
            ]

            var updates = [
                {$collection: {"collection": "invoices", "triggers": trigger}, $insert: [
                    {
                        invoiceno: "001",
                        date: "2013-12-10",
                        customer: {_id: "pawan", customer: "pawan"},
                        invoicelineitems: [
                            {
                                deliveryid: {_id: "001", deliveryno: "001"},
                                amount: 20000
                            },
                            {
                                deliveryid: {_id: "002", deliveryno: "002"},
                                amount: 30000
                            }
                        ]
                    }
                ]
                }
            ]

            db.batchUpdateById(updates, function (err, result) {
                if (err) {
                    done(err);
                    return;
                }
                db.query({$collection: "invoices", $sort: {country: 1}}, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    expect(data.result).to.have.length(1);
                    db.query({$collection: "vouchers", $sort: {country: 1}}, function (err, voucherData) {
                        if (err) {
                            done(err);
                            return;
                        }
                        expect(voucherData.result).to.have.length(1);
                        expect(voucherData.result[0].voucherno).to.eql("001");
                        expect(voucherData.result[0].invoiceid).to.eql(data.result[0]._id);
                        expect(voucherData.result[0]._id).to.eql(data.result[0].voucherid);
                        done();
                    });
                })
            });


        });


    });

    it("create  trigger with required fields", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }

            var modifyPerson = {   name: "createVoucher2", code: "preJob", source: "NorthwindTestCase/lib/InvoiceJob.js"};
            var trigger = [
                {
                    functionName: modifyPerson,
                    operations: ["insert", "delete", "update"],
                    when: "pre",
                    requiredfields: {"customerid.accountid.account": 1, "customerid.accountid.type": 1, "customerid.name": 1}
                }
            ];

            var updates = [
                {
                    $collection: "accounts",
                    $insert: [
                        {_id: "SBI", account: "SBI", "type": "Salary"},
                        {_id: "PA", account: "PA", "type": "Personal Account"}
                    ]
                } ,
                {
                    $collection: {"collection": "customers", fields: [
                        {field: "accountid", type: "fk", collection: "accounts" }
                    ]}, $insert: [
                    {_id: "customer1", "name": "bansal-and-sons", "accountid": {_id: "SBI"}},
                    {_id: "customer2", "name": "dalal-brothers", "accountid": {$query: {_id: "PA"}}}
                ]
                },
                {$collection: {"collection": "invoices", "triggers": trigger, fields: [
                    {field: "customerid", type: "fk", collection: {collection: "customers", fields: [
                        {field: "accountid", type: "fk", collection: {collection: "accounts"}}
                    ]}}
                ]}, $insert: [
                    {
                        invoiceno: "001",
                        date: "2013-12-10",
                        customerid: {_id: "customer1"},
                        invoicelineitems: [
                            {
                                deliveryid: {_id: "001", deliveryno: "001"},
                                amount: 20000
                            },
                            {
                                deliveryid: {_id: "002", deliveryno: "002"},
                                amount: 30000
                            }
                        ]
                    }
                ]
                }
            ]

            db.batchUpdateById(updates, function (err, result) {
                if (err) {
                    done(err);
                    return;
                }
                db.query({$collection: "invoices", $sort: {country: 1}}, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    expect(data.result).to.have.length(1);
                    expect(data.result[0].customername).to.eql("bansal-and-sons");
                    expect(data.result[0].accountname).to.eql("SBI");
                    expect(data.result[0].accounttype).to.eql("Salary");
                    done();
                })
            });


        });


    });

    it("create another trigger with required fields in nested array", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }

            var modifyPerson = {   name: "insertjob", code: "insertJob", source: "NorthwindTestCase/lib/InvoiceJob.js"};
            var trigger = [
                {
                    functionName: modifyPerson,
                    operations: ["insert", "delete", "update"],
                    when: "pre",
                    requiredfields: {"invoicelineitems.purchases.productid.accountid.accountgroupid.name": 1, "invoicelineitems.purchases.productid.accountid.account": 1, "invoicelineitems.purchases.productid.accountid.type": 1, "invoicelineitems.purchases.productid.name": 1, "invoicelineitems.purchases.productid.type": 1}
                }
            ];

            var updates = [
                {
                    $collection: "accountgroups",
                    $insert: [
                        {_id: "Asset", name: "Asset"},
                        {_id: "Revenue", name: "Revenue"} ,
                        {_id: "Liability", name: "Liability"},
                        {_id: "Expense", name: "Expense"}
                    ]
                } ,

                {
                    $collection: "accounts",
                    $insert: [
                        {_id: "SBI", account: "SBI", "type": "asset", accountgroupid: {_id: "Asset"}},
                        {_id: "PNB", account: "PNB", "type": "expense", accountgroupid: {_id: "Expense"}},
                        {_id: "cashinhand", account: "cashinhand", "type": "revenue", accountgroupid: {_id: "Revenue"}},
                        {_id: "parking", account: "PNB", "type": "liability", accountgroupid: {_id: "Liability"}}
                    ]
                } ,
                {
                    $collection: "products",
                    $insert: [
                        {_id: "computer", name: "computer", "type": "device", accountid: {_id: "SBI"}},
                        {_id: "laptop", name: "laptop", "type": "portabledevice", accountid: {_id: "PNB"}},
                        {_id: "chairs", name: "chairs", "type": "comfortable", accountid: {_id: "cashinhand"}} ,
                        {_id: "ac", name: "ac", "type": "coolingdevice", accountid: {_id: "PNB"}}
                    ]
                } ,
                {$collection: {"collection": "invoices", "triggers": trigger, fields: [
                    {field: "invoiceno", type: "string"},
                    {field: "date", type: "date"},
                    {field: "invoicelineitems", type: "object", multiple: true, fields: [
                        {field: "purchases", type: "object", multiple: true, fields: [
                            {field: "productid", type: "fk", collection: {"collection": "products", fields: [
                                {field: "accountid", type: "fk", collection: {"collection": "accounts", fields: [
                                    {field: "accountgroupid", type: "fk", "collection": "accountgroups"}
                                ]}}
                            ]}}
                        ]}
                    ]}
                ]}, $insert: [
                    {
                        invoiceno: "001",
                        date: "2013-12-10",
                        invoicelineitems: [
                            {
                                lineitemno: "1",
                                purchases: [
                                    {
                                        purchaseno: "1",
                                        productid: {"_id": "computer"}
                                    },
                                    {
                                        purchaseno: "2",
                                        productid: {"_id": "laptop"}
                                    }
                                ],
                                amount: 20000
                            },
                            {
                                lineitemno: "2",
                                purchases: [
                                    {
                                        purchaseno: "3",
                                        productid: {"_id": "chairs"}
                                    },
                                    {
                                        purchaseno: "4",
                                        productid: {"_id": "ac"}
                                    }
                                ],
                                amount: 50000
                            }
                        ]
                    }
                ]
                }
            ];

            db.batchUpdateById(updates, function (err, result) {
                if (err) {
                    done(err);
                    return;
                }
                db.query({$collection: "invoices", $sort: {country: 1}}, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log("data>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(data));
                    expect(data.result).to.have.length(1);
                    expect(data.result[0].invoicelineitems).to.have.length(2);
                    expect(data.result[0].invoicelineitems[0].purchases).to.have.length(2);

                    expect(data.result[0].invoicelineitems[0].purchases[0].productid.name).to.eql("computer");
                    expect(data.result[0].invoicelineitems[0].purchases[0].productid.type).to.eql("device");
                    expect(data.result[0].invoicelineitems[0].purchases[0].productid.accountid.name).to.eql("SBI");
                    expect(data.result[0].invoicelineitems[0].purchases[0].productid.accountid.type).to.eql("asset");
                    expect(data.result[0].invoicelineitems[0].purchases[0].productid.accountid.accountgroupid.name).to.eql("Asset");

                    expect(data.result[0].invoicelineitems[0].purchases[1].productid.name).to.eql("laptop");
                    expect(data.result[0].invoicelineitems[0].purchases[1].productid.type).to.eql("portabledevice");
                    expect(data.result[0].invoicelineitems[0].purchases[1].productid.accountid.name).to.eql("PNB");
                    expect(data.result[0].invoicelineitems[0].purchases[1].productid.accountid.type).to.eql("expense");
                    expect(data.result[0].invoicelineitems[0].purchases[1].productid.accountid.accountgroupid.name).to.eql("Expense");


                    expect(data.result[0].invoicelineitems[1].purchases).to.have.length(2);

                    expect(data.result[0].invoicelineitems[1].purchases[0].productid.name).to.eql("chairs");
                    expect(data.result[0].invoicelineitems[1].purchases[0].productid.type).to.eql("comfortable");
                    expect(data.result[0].invoicelineitems[1].purchases[0].productid.accountid.name).to.eql("cashinhand");
                    expect(data.result[0].invoicelineitems[1].purchases[0].productid.accountid.type).to.eql("revenue");
                    expect(data.result[0].invoicelineitems[1].purchases[0].productid.accountid.accountgroupid.name).to.eql("Revenue");

                    expect(data.result[0].invoicelineitems[1].purchases[1].productid.name).to.eql("ac");
                    expect(data.result[0].invoicelineitems[1].purchases[1].productid.type).to.eql("coolingdevice");
                    expect(data.result[0].invoicelineitems[1].purchases[1].productid.accountid.name).to.eql("PNB");
                    expect(data.result[0].invoicelineitems[1].purchases[1].productid.accountid.type).to.eql("expense");
                    expect(data.result[0].invoicelineitems[1].purchases[1].productid.accountid.accountgroupid.name).to.eql("Expense");


                    done();
                })
            });


        });


    });

    it("create another case of update trigger with required fields in nested array", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }

            var modifyPerson = {   name: "updatejob", code: "updateJob", source: "NorthwindTestCase/lib/InvoiceJob.js"};
            var trigger = [
                {
                    functionName: modifyPerson,
                    operations: ["insert", "delete", "update"],
                    when: "pre",
                    requiredfields: {"invoicelineitems.purchases.productid.accountid.accountgroupid.name": 1, "invoicelineitems.purchases.productid.accountid.account": 1, "invoicelineitems.purchases.productid.accountid.type": 1, "invoicelineitems.purchases.productid.name": 1, "invoicelineitems.purchases.productid.type": 1}
                }
            ];

            var updates = [
                {
                    $collection: "accountgroups",
                    $insert: [
                        {_id: "Asset", name: "Asset"},
                        {_id: "Revenue", name: "Revenue"} ,
                        {_id: "Liability", name: "Liability"},
                        {_id: "Expense", name: "Expense"}
                    ]
                } ,

                {
                    $collection: "accounts",
                    $insert: [
                        {_id: "SBI", account: "SBI", "type": "asset", accountgroupid: {_id: "Asset"}},
                        {_id: "PNB", account: "PNB", "type": "expense", accountgroupid: {_id: "Expense"}},
                        {_id: "cashinhand", account: "cashinhand", "type": "revenue", accountgroupid: {_id: "Revenue"}},
                        {_id: "parking", account: "PNB", "type": "liability", accountgroupid: {_id: "Liability"}}
                    ]
                } ,
                {
                    $collection: "products",
                    $insert: [
                        {_id: "computer", name: "computer", "type": "device", accountid: {_id: "SBI"}},
                        {_id: "laptop", name: "laptop", "type": "portabledevice", accountid: {_id: "PNB"}},
                        {_id: "chairs", name: "chairs", "type": "comfortable", accountid: {_id: "cashinhand"}} ,
                        {_id: "ac", name: "ac", "type": "coolingdevice", accountid: {_id: "PNB"}}
                    ]
                } ,
                {$collection: {"collection": "invoices", "triggers": trigger, fields: [
                    {field: "invoiceno", type: "string"},
                    {field: "date", type: "date"},
                    {field: "invoicelineitems", type: "object", multiple: true, fields: [
                        {field: "purchases", type: "object", multiple: true, fields: [
                            {field: "productid", type: "fk", collection: {"collection": "products", fields: [
                                {field: "accountid", type: "fk", collection: {"collection": "accounts", fields: [
                                    {field: "accountgroupid", type: "fk", "collection": "accountgroups"}
                                ]}}
                            ]}}
                        ]}
                    ]}
                ]}, $insert: [
                    {
                        _id: "myinvoice",
                        invoiceno: "001",
                        date: "2013-12-10",
                        invoicelineitems: [
                            {
                                "_id": 1,
                                lineitemno: "1",
                                purchases: [
                                    {  "_id": 1,
                                        purchaseno: "1",
                                        productid: {"_id": "computer"}
                                    },
                                    {         "_id": 2,
                                        purchaseno: "2",
                                        productid: {"_id": "laptop"}
                                    }
                                ],
                                amount: 20000
                            },
                            {          "_id": 2,
                                lineitemno: "2",
                                purchases: [
                                    {
                                        "_id": 3,
                                        purchaseno: "3",
                                        productid: {"_id": "chairs"}
                                    },
                                    {
                                        "_id": 4,
                                        purchaseno: "4",
                                        productid: {"_id": "ac"}
                                    }
                                ],
                                amount: 50000
                            }
                        ]
                    }
                ]
                }
            ];

            db.batchUpdateById(updates, function (err, result) {
                if (err) {
                    done(err);
                    return;
                }
                db.query({$collection: "invoices"}, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
//                    console.log("data after insert>>>" + JSON.stringify(data));
                    expect(data.result).to.have.length(1);
                    var newUpdates = [
                        {
                            $collection: "products",
                            $insert: [
                                {_id: "notebooks", name: "notebooks", "type": "utility", accountid: {_id: "SBI"}}
                            ]
                        } ,
                        {$collection: {"collection": "invoices", "triggers": trigger, fields: [
                            {field: "invoiceno", type: "string"},
                            {field: "date", type: "date"},
                            {field: "invoicelineitems", type: "object", multiple: true, fields: [
                                {field: "purchases", type: "object", multiple: true, fields: [
                                    {field: "productid", type: "fk", collection: {"collection": "products", fields: [
                                        {field: "accountid", type: "fk", collection: {"collection": "accounts", fields: [
                                            {field: "accountgroupid", type: "fk", "collection": "accountgroups"}
                                        ]}}
                                    ]}}
                                ]}
                            ]}
                        ]}, $update: [
                            {
                                _id: "myinvoice",
                                $set: {
                                    invoicelineitems: {
                                        $insert: [
                                            {
                                                "_id": 3,
                                                lineitemno: "3",
                                                purchases: [
                                                    {
                                                        "_id": 5,
                                                        purchaseno: "5",
                                                        productid: {"_id": "computer"}
                                                    },
                                                    {
                                                        "_id": 6,
                                                        purchaseno: "6",
                                                        productid: {"_id": "notebooks"}
                                                    }
                                                ],
                                                amount: 20000
                                            }
                                        ],
                                        $update: [
                                            {   $query: {lineitemno: "2"},
                                                $set: {
                                                    purchases: {
                                                        $insert: [
                                                            {
                                                                "_id": 7,
                                                                purchaseno: "7",
                                                                productid: {"_id": "notebooks"}
                                                            }
                                                        ],
                                                        $update: [
                                                            {
                                                                $query: {purchaseno: "3"},
                                                                $set: {
                                                                    productid: {_id: "computer"}
                                                                }
                                                            }
                                                        ]
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        ]
                        }
                    ];
                    db.batchUpdateById(newUpdates, function (err, data) {
                        if (err) {
                            done(err);
                            return;
                        } else {
                            db.query({$collection: "invoices"}, function (err, data) {
                                if (err) {
                                    done(err);
                                    return;
                                } else {
                                    console.log("data>>>>>>>>>>>after >>>>>>>>>>>.update" + JSON.stringify(data));
                                    expect(data.result).to.have.length(1);
                                    expect(data.result[0].invoicelineitems).to.have.length(3);

                                    expect(data.result[0].invoicelineitems[0].purchases).to.have.length(2);
                                    expect(data.result[0].invoicelineitems[0].purchases[0].productid.name).to.eql("computer");
                                    expect(data.result[0].invoicelineitems[0].purchases[0].productid.type).to.eql("device");
                                    expect(data.result[0].invoicelineitems[0].purchases[0].productid.accountid.name).to.eql("SBI");
                                    expect(data.result[0].invoicelineitems[0].purchases[0].productid.accountid.type).to.eql("asset");
                                    expect(data.result[0].invoicelineitems[0].purchases[0].productid.accountid.accountgroupid.name).to.eql("Asset");

                                    expect(data.result[0].invoicelineitems[0].purchases[1].productid.name).to.eql("laptop");
                                    expect(data.result[0].invoicelineitems[0].purchases[1].productid.type).to.eql("portabledevice");
                                    expect(data.result[0].invoicelineitems[0].purchases[1].productid.accountid.name).to.eql("PNB");
                                    expect(data.result[0].invoicelineitems[0].purchases[1].productid.accountid.type).to.eql("expense");
                                    expect(data.result[0].invoicelineitems[0].purchases[1].productid.accountid.accountgroupid.name).to.eql("Expense");


                                    expect(data.result[0].invoicelineitems[2].purchases).to.have.length(2);

                                    expect(data.result[0].invoicelineitems[2].purchases[0].productid.name).to.eql("computer");
                                    expect(data.result[0].invoicelineitems[2].purchases[0].productid.type).to.eql("device");
                                    expect(data.result[0].invoicelineitems[2].purchases[0].productid.accountid.name).to.eql("SBI");
                                    expect(data.result[0].invoicelineitems[2].purchases[0].productid.accountid.type).to.eql("asset");
                                    expect(data.result[0].invoicelineitems[2].purchases[0].productid.accountid.accountgroupid.name).to.eql("Asset");


                                    expect(data.result[0].invoicelineitems[2].purchases[1].productid.name).to.eql("notebooks");
                                    expect(data.result[0].invoicelineitems[2].purchases[1].productid.type).to.eql("utility");
                                    expect(data.result[0].invoicelineitems[2].purchases[1].productid.accountid.name).to.eql("SBI");
                                    expect(data.result[0].invoicelineitems[2].purchases[1].productid.accountid.type).to.eql("asset");
                                    expect(data.result[0].invoicelineitems[2].purchases[1].productid.accountid.accountgroupid.name).to.eql("Asset");
//
                                    expect(data.result[0].invoicelineitems[1].purchases).to.have.length(3);
                                    expect(data.result[0].invoicelineitems[1].purchases[0].productid.name).to.eql("computer");
                                    expect(data.result[0].invoicelineitems[1].purchases[0].productid.type).to.eql("device");
                                    expect(data.result[0].invoicelineitems[1].purchases[0].productid.accountid.name).to.eql("SBI");
                                    expect(data.result[0].invoicelineitems[1].purchases[0].productid.accountid.type).to.eql("asset");
                                    expect(data.result[0].invoicelineitems[1].purchases[0].productid.accountid.accountgroupid.name).to.eql("Asset");

                                    expect(data.result[0].invoicelineitems[1].purchases[1].productid.name).to.eql("ac");
                                    expect(data.result[0].invoicelineitems[1].purchases[1].productid.type).to.eql("coolingdevice");
                                    expect(data.result[0].invoicelineitems[1].purchases[1].productid.accountid.name).to.eql("PNB");
                                    expect(data.result[0].invoicelineitems[1].purchases[1].productid.accountid.type).to.eql("expense");
                                    expect(data.result[0].invoicelineitems[1].purchases[1].productid.accountid.accountgroupid.name).to.eql("Expense");

                                    expect(data.result[0].invoicelineitems[1].purchases[2].productid.name).to.eql("notebooks");
                                    expect(data.result[0].invoicelineitems[1].purchases[2].productid.type).to.eql("utility");
                                    expect(data.result[0].invoicelineitems[1].purchases[2].productid.accountid.name).to.eql("SBI");
                                    expect(data.result[0].invoicelineitems[1].purchases[2].productid.accountid.type).to.eql("asset");
                                    expect(data.result[0].invoicelineitems[1].purchases[2].productid.accountid.accountgroupid.name).to.eql("Asset");

                                    done()
                                }
                            })
                        }
                    });
                });
            });
        });
    });

    it("required Field in post trigger", function (done) {

        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }

            var modifyPerson = {   name: "postJob", code: "postJob", source: "NorthwindTestCase/lib/InvoiceJob.js"};
            var trigger = [
                {
                    functionName: modifyPerson,
                    operations: ["insert", "delete", "update"],
                    when: "post",
                    requiredfields: {"customerid.accountid.account": 1, "customerid.accountid.type": 1, "customerid.name": 1}
                }
            ];

            var updates = [
                {
                    $collection: "accounts",
                    $insert: [
                        {_id: "SBI", account: "SBI", "type": "Salary"},
                        {_id: "PA", account: "PA", "type": "Personal Account"}
                    ]
                } ,
                {
                    $collection: {"collection": "customers", fields: [
                        {field: "accountid", type: "fk", collection: "accounts" }
                    ]}, $insert: [
                    {_id: "customer1", "name": "bansal-and-sons", "accountid": {_id: "SBI"}},
                    {_id: "customer2", "name": "dalal-brothers", "accountid": {$query: {_id: "PA"}}}
                ]
                },
                {$collection: {"collection": "invoices", "triggers": trigger, fields: [
                    {field: "customerid", type: "fk", collection: {collection: "customers", fields: [
                        {field: "accountid", type: "fk", collection: {collection: "accounts"}}
                    ]}}
                ]}, $insert: [
                    {
                        invoiceno: "001",
                        date: "2013-12-10",
                        customerid: {_id: "customer1"}
                    }
                ]
                }
            ]

            db.batchUpdateById(updates, function (err, result) {
                if (err) {
                    done(err);
                    return;
                }
                db.query({$collection: "invoices", $sort: {country: 1}}, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    expect(data.result).to.have.length(1);
                    expect(data.result[0].customername).to.eql("bansal-and-sons");
                    expect(data.result[0].accountname).to.eql("SBI");
                    expect(data.result[0].accountype).to.eql("Salary");
                    done();
                })
            });


        });


    });

    it("array override with reqired columns", function (done) {
        done();
    })

});


