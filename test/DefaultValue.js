/**
 *
 *  mocha --recursive --timeout 150000 -g "DefaultValuetestcase" --reporter spec
 *
 *
 */
var expect = require('chai').expect;
var ApplaneDB = require("../lib/DB.js");
var Config = require("./config.js");
var Document = require("ApplaneDB/lib/Document.js");
var Q = require("q");

var billCollection = {collection:"bills", fields:[], events:[
    {event:"onInsert", function:"Bills.onInsert"},
    {event:"onInsert", function:"Bills.onInsert1"},
    {event:"onInsert", function:"Bills.onInsert2"},
    {event:"onValue:[\"qty\", \"rate\"]", function:"Bills.calculateAmt"},
    {event:"onValue:[\"qty\", \"rate\"]", fields:["qty", "rate"], function:"Bills.calculateTotalAmt"},
    {event:"onValue:[\"qty\"]", function:"Bills.calculateAmt1"},
    {event:"onValue:[\"rate\"]", function:"Bills.calculateAmt2"},
    {event:"onValue:[\"totalAmount\"]", function:"Bills.calculateConvertedAmount"},
    {event:"onValue:[\"convertedAmount\"]", function:"Bills.calculateServiceTax"},
    {event:"onSave", pre:true, function:"Bills.onPreSave"},
    {event:"onSave", post:true, function:"Bills.onPostSave"}
]};

var invoices1 = {
    collection:"invoices1", fields:[
        {field:"invoice_no", type:"string"},
        {field:"invoice_date", type:"date"},
        {field:"invoice_currency", type:"fk", collection:"pl.currencies", set:["currency"]},
        {field:"invoice_currency_rate", type:"decimal"},
        {field:"vendorid", type:"fk", collection:"vendors", set:["vendor"]} ,
        {field:"profitcenterid", type:"fk", collection:"profitcenters", set:["profitcenter"]},
        {field:"total_invoice_amt", type:"currency"},
        {field:"total_service_tax_amt", type:"currency"},
        {field:"total_other_deductions_amt", type:"currency"},
        {field:"total_other_deductions_staxamt", type:"currency"},
        {field:"net_amt", type:"currency"} ,
        {field:"invoicelineitems", type:"object", multiple:true, fields:[
            {field:"profitcenterid", type:"fk", collection:"profitcenters", set:["profitcenter"]},
            {field:"deliveryid", type:"fk", collection:"deliveries", set:["delivery_no"]},
            {field:"lineitemno", type:"number"},
            {field:"amount", type:"currency"},
            {field:"service_tax_amt", type:"currency"},
            {field:"total_other_deduction_amt", type:"currency"},
            {field:"total_other_deduction_staxamt", type:"currency"},
            {field:"net_amt", type:"currency"},
            {field:"other_deductions", type:"object", multiple:true, fields:[
                {field:"deduction_type", type:"string"},
                {field:"deduction_amt", type:"currency"},
                {field:"deduction_staxamt", type:"currency"},
                {field:"deduction_netamt", type:"currency"}
            ]}
        ]}
    ], events:[
        {event:'onInsert:[{"invoicelineitems":[]}]', function:"Invoices.onInsertLineItems"},
        {event:'onInsert:[{"invoicelineitems":[{"deduction":[]}]}]', function:"Invoices.onInsertDeductions"},
        {event:'onValue:[{"invoicelineitems":[{"deduction":["amount"]}]}]', function:"Invoices.serviceTaxOnDeductionAmount"},
        {event:'onValue:[{"invoicelineitems":[{"deduction":["amount","stax"]}]}]', function:"Invoices.netAmtOnDeductionServiceTax"},
        {event:'onValue:[{"invoicelineitems":[{"deduction":["amount"]}]}]', function:"Invoices.lineItemDeductionAmtOnDeductionAmount"},
        {event:'onValue:[{"invoicelineitems":[{"deduction":["stax"]}]}]', function:"Invoices.lineItemDeductionAmtOnDeductionAmount"},
        {event:'onValue:[{"invoicelineitems":["amount"]}]', function:"Invoices.serviceTaxOnLineItemAmount"},
        {event:'onValue:[{"invoicelineitems":["amount","service_tax_amt","total_other_deduction_amt","total_other_deduction_staxamt"]}]', function:"Invoices.lineItemNetAmount"},
        {event:'onValue:[{"invoicelineitems":["amount"]}]', function:"Invoices.calcaulateInvoiceAmt"},
        {event:'onValue:[{"invoicelineitems":["service_tax_amt"]}]', function:"Invoices.calcaulateInvoiceStaxAmt"},
        {event:'onValue:[{"invoicelineitems":["total_other_deduction_amt"]}]', function:"Invoices.calcaulateInvoiceOtherDeductionAmt"},
        {event:'onValue:[{"invoicelineitems":["total_other_deduction_staxamt"]}]', function:"Invoices.calcaulateInvoiceOtherDeductionStaxAmt"},
        {event:'onValue:[{"invoicelineitems":["total_invoice_amt","total_service_tax_amt","total_other_deductions_amt","total_other_deductions_staxamt"]}]', function:"Invoices.calculateInvoiceNetAmt"}
    ]
}

var invoices = {
    collection:"invoices", fields:[
        {field:"invoice_no", type:"string"},
        {field:"invoice_date", type:"date"},
        {field:"totalamt", type:"number"} ,
        {field:"totalstax", type:"number"} ,
        {field:"totalnet", type:"number"},
        {field:"damt", type:"number"},
        {field:"invoicelineitems", type:"object", multiple:true, fields:[
            {field:"line_no", type:"string"},
            {field:"amt", type:"number"},
            {field:"stax", type:"number"},
            {field:"net", type:"number"},
            {field:"damt", type:"number"},
            {field:"deductions", multiple:true, type:"object", fields:[
                {field:"deduction_no", type:"string"},
                {field:"damt", type:"number"}
            ]}
        ]},
        {field:"invoicelineitems1", type:"object", multiple:true, fields:[
            {field:"invoice_no", type:"string"},
            {field:"amt", type:"number"},
            {field:"stax", type:"number"},
            {field:"net", type:"number"}
        ]}
    ], events:[
        {event:'onInsert', function:"Invoicess.onInsertInvoice"},
        {event:'onInsert:[{"invoicelineitems":[]},{"invoicelineitems1":[]}]', function:"Invoicess.onInsertLineItems"},
        {event:'onInsert:[{"invoicelineitems":[{"deductions":[]}]}]', function:"Invoicess.onInsertDeductions"},
        {event:'onValue:[{"invoicelineitems":[{"deductions":["damt"]}]}]', function:"Invoicess.deductionVat"},
        {event:'onValue:[{"invoicelineitems":[{"deductions":["damt"]}]}]', function:"Invoicess.lineItemDamt"},
        {event:'onValue:[{"invoicelineitems":["damt"]}]', function:"Invoicess.lineItemDamt"},
        {event:'onValue:[{"invoicelineitems":[{"deductions":["vat"]}]}]', function:"Invoicess.deductionnetamt"},
        {event:'onValue:["totalstax"]', function:"Invoicess.invoiceNetAmt"},
        {event:'onValue:[{"invoicelineitems":["amt"]},{"invoicelineitems1":["amt"]}]', function:"Invoicess.lineItemStax"},
        {event:'onValue:[{"invoicelineitems":["stax"]},{"invoicelineitems1":["stax"]}]', function:"Invoicess.lineItemNet"},
        {event:'onValue:[{"invoicelineitems":["amt"]},{"invoicelineitems1":["amt"]}]', function:"Invoicess.invoiceAmt"},
        {event:'onValue:[{"invoicelineitems":["stax"]},{"invoicelineitems1":["stax"]}]', function:"Invoicess.invoiceStaxAmt"},
        {event:'onValue:[{"invoicelineitems":["net"]},{"invoicelineitems1":["net"]}]', function:"Invoicess.LineItemNetWord"},
        {event:'onValue:["totalnet"]', function:"Invoicess.NetWord"},
        {event:"onSave", pre:true, function:"Invoicess.onPreSave"},
        {event:"onSave", post:true, function:"Invoicess.onPostSave"}
    ]
}

var collectionsToRegister = [
    billCollection
    ,
    invoices,
    invoices1,
    {
        collection:"orders", fields:[
        {field:"order_no", type:"string"},
        {field:"vendorid", type:"fk", collection:"vendors", set:["vendor"]} ,
        {field:"profitcenterid", type:"fk", collection:"profitcenters", set:["profitcenter"]},
        {field:"currency", type:"fk", collection:"currencies", set:["currency"]} ,
        {field:"order_date", type:"date"},
        {field:"total_amt", type:"currency"},
        {field:"total_converted_amt", type:"currency"}
    ]
    } ,
    {
        collection:"deliveries", fields:[
        {field:"profitcenterid", type:"fk", collection:"profitcenters", set:["profitcenter"]},
        {field:"productid", type:"string"},
        {field:"delivery_no", type:"string"},
        {field:"orderid", type:"fk", collection:"orders", set:["order_no"]},
        {field:"vendorid", type:"fk", collection:"vendors", set:["vendor"]},
        {field:"quantity", type:"number"},
        {field:"rate", type:"decimal"},
        {field:"amount", type:"currency"},
        {field:"amount_base_currency", type:"currency"}
    ]
    },
    {
        collection:"vouchers", fields:[
        {field:"voucher_no", type:"string"},
        {field:"voucher_date", type:"date"},
        {field:"voucher_type", "type":"string"},
        {field:"profitcenterid", type:"fk", collection:"profitcenters", set:["profitcenter"]},
        {field:"cr_amt", type:"currency"},
        {field:"dr_amt", type:"currency"},
        {field:"voucherlineitems", type:"object", multiple:true, fields:[
            {field:"accountid", type:"fk", collection:"accounts", set:["account"]},
            {field:"cr_amt", type:"currency"},
            {field:"dr_amt", type:"currency"},
            {field:"amount", type:"currency"}
        ]}
    ]
    },
    {
        collection:"vendors", fields:[
        {field:"vendor", type:"string"}  ,
        {field:"accountid", type:"fk", collection:"accounts", set:["account"]},
        {field:"service_tax_in_percent", type:"decimal"}
    ]
    } ,
    {
        collection:"accounts", fields:[
        {field:"account", type:"string"}
    ]
    },
    {
        collection:"accountgroups", fields:[
        {field:"name", type:"string"}
    ]
    },
    {
        collection:"accountgrouptotals", fields:[
        {field:"accountgroupid", type:"fk", collection:"accountgroups", set:["name"]}
    ]
    } ,
    {collection:"profitcenters", fields:[
        {field:"profitcenter", type:"string"}
    ]} ,
    {collection:"currencies", fields:[
        {field:"currency", type:"string"}
    ]}

];

var functionsToRegister = [
    {name:"Bills", source:"NorthwindTestCase/lib", type:"js"},
    {name:"Invoices", source:"NorthwindTestCase/lib", type:"js"},
    {name:"Invoicess", source:"NorthwindTestCase/lib", type:"js"}
]

describe("DefaultValuetestcase", function () {

    before(function (done) {
        ApplaneDB.addCollection(collectionsToRegister, function (err) {
            if (err) {
                done(err);
                return;
            }
            ApplaneDB.addFunction(functionsToRegister, function (err) {
                done(err);
            })

        })
    })

    beforeEach(function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {$collection:"pl.currencies", $insert:[
                    {_id:"INR", currency:"INR"},
                    {currency:"USD"}
                ]},
                {$collection:"profitcenters", $insert:[
                    {_id:"Services", profitcenter:"Services"},
                    {profitcenter:"Applane"}
                ]},
                {$collection:"accounts", $insert:[
                    {account:"SBI"},
                    {account:"Applane"}
                ]}
            ];
            db.batchUpdateById(updates, done);
        });
    })


    afterEach(function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            db.dropDatabase(function (err) {
                done(err);
            })
        });
    })

    it.skip("onBillCreate", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var bill1 = {rate:10, qty:200};

            var DataModel = require("../lib/EventManager.js");
            db.collection("bills", function (err, collection) {
                if (err) {
                    done(err);
                    return;
                }
                console.log("collection>>>>" + JSON.stringify(Object.keys(collection)));
                var dataModel = new DataModel(undefined, collection, db);
                dataModel.insert(bill1).then(
                    function (insertedRow) {
                        expect(bill1.amount).to.be.eql(2000);
                        expect(bill1.netAmount).to.be.eql(2000);
                        expect(bill1.totalAmount).to.be.eql(2000);
                        expect(bill1.amount1).to.be.eql(2000);
                        expect(bill1.amount2).to.be.eql(2000);
                        expect(bill1.amount3).to.be.eql(2000);
                        expect(bill1.convertedAmount).to.be.eql(2000);
                        expect(bill1.serviceTax).to.be.eql(200);
                        expect(bill1.netTax).to.be.eql(undefined);
                    }).then(
                    function () {
                        console.log("calling save");
                        return dataModel.save();
                    }).then(
                    function () {
                        var d2 = Q.defer();
                        expect(bill1.netTax).to.be.eql(200);
                        Q.delay(0).then(function () {
                            console.log(">>>>>>save called");

                            console.log("runnign query")
                            db.query({$collection:"bills"}, function (err, result) {
                                console.log("Query fired")
                                if (err) {
                                    d2.reject(err)
                                    return;
                                }
                                console.log("Result>>>" + JSON.stringify(result));
                                d2.resolve();
                            })
                        })
                        return d2.promise;
                    }).then(
                    function () {
                        done();
                    }).fail(function (err) {
                        done(err);
                    })
            })
        })
    })

    it.skip("onBillCreate Server", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var bill1 = {rate:10, qty:200};
            db.updateAsPromise({$collection:"bills", $insert:bill1}).then(
                function () {
                    db.query({$collection:"bills"}, function (err, result) {
                        if (err) {
                            done(err);
                            return;
                        }
                        console.log("result >>>>>>>>>>>>>>>>>>>>" + JSON.stringify(result));
                        expect(result.result).to.have.length(1);
                        expect(result.result[0].rate).to.eql(10);
                        expect(result.result[0].qty).to.eql(200);
                        expect(result.result[0].amount).to.eql(2000);
                        expect(result.result[0].amount3).to.eql(2000);
                        expect(result.result[0].totalAmount).to.eql(2000);
                        expect(result.result[0].amount1).to.eql(2000);
                        expect(result.result[0].netAmount).to.eql(2000);
                        expect(result.result[0].amount2).to.eql(2000);
                        expect(result.result[0].convertedAmount).to.eql(2000);
                        expect(result.result[0].serviceTax).to.eql(200);
                        expect(result.result[0].netTax).to.eql(200);
                        db.updateAsPromise({$collection:"bills", $update:{_id:result.result[0]._id, $set:{qty:2500, rate:20}}}).then(
                            function () {
                                db.query({$collection:"bills"}, function (err, result) {
                                    if (err) {
                                        done(err);
                                        return;
                                    }
                                    console.log("Update>>>result >>>>>>>>>>>>>>>>>>>>" + JSON.stringify(result));
                                    expect(result.result).to.have.length(1);
                                    expect(result.result[0].rate).to.eql(20);
                                    expect(result.result[0].qty).to.eql(2500);
                                    expect(result.result[0].amount).to.eql(50000);
                                    expect(result.result[0].amount3).to.eql(2000);
                                    expect(result.result[0].totalAmount).to.eql(50000);
                                    expect(result.result[0].amount1).to.eql(50000);
                                    expect(result.result[0].netAmount).to.eql(50000);
                                    expect(result.result[0].amount2).to.eql(50000);
                                    expect(result.result[0].convertedAmount).to.eql(50000);
                                    expect(result.result[0].serviceTax).to.eql(5000);
                                    expect(result.result[0].netTax).to.eql(5000);
                                    db.updateAsPromise({$collection:"bills", $delete:{_id:result.result[0]._id}}).then(
                                        function () {
                                            db.query({$collection:"bills"}, function (err, result) {
                                                if (err) {
                                                    done(err);
                                                    return;
                                                }
                                                console.log("Delete>>>result >>>>>>>>>>>>>>>>>>>>" + JSON.stringify(result));
                                                expect(result.result).to.have.length(0);
                                                done();
                                            });

                                        }).fail(function (err) {
                                            done(err);
                                        })
                                });
                            }).fail(function (err) {
                                done(err);
                            })
                    })
                }).fail(function (e) {
                    done(e);
                })
        })
    })

    it.skip("invoice nested lineitems", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var invoice = {invoice_no:1111, profitcenterid:{_id:"Services", profitcenter:"Services"}, invoicelineitems:{$insert:[
                {lineitemno:1, amount:{amount:10000, type:{_id:"INR", currency:"INR"}}, other_deductions:{$insert:[
                    {deduction_amt:{amount:200, type:{_id:"INR", currency:"INR"}}}
                ]}}
            ]}};
            db.updateAsPromise({$collection:"invoices", $insert:invoice}).then(
                function () {
                    db.query({$collection:"invoices"}, function (err, result) {
                        if (err) {
                            done(err);
                            return;
                        }
                        console.log("result >>>>>>>>>>>>>>>>>>>>" + JSON.stringify(result));
                        done();
                    })
                }).fail(function (e) {
                    done(e);
                })
        })
    })

    it("simple invoice nested lineitems without currency type", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var invoice = {invoice_no:1111, invoicelineitems:{$insert:[
                {amt:1000, deductions:{$insert:[
                    {damt:50}
                ]}},
                {amt:5000, deductions:{$insert:[
                    {damt:1000},
                    {damt:200}
                ]}}

            ]}, invoicelineitems1:{$insert:[
                {amt:3000},
                {amt:8000}
            ]}};
            var insertResult = undefined;
            var updateResult = undefined;
            db.updateAsPromise({$collection:"invoices", $insert:invoice}).then(
                function () {
                    return  db.queryAsPromise({$collection:"invoices"});
                }).then(
                function (result) {
                    insertResult = result;
                    console.log(">>>>>>>>>>>insertresult >>>>>>>>>>>>>>>>>>>>" + JSON.stringify(insertResult));
                    expect(insertResult.result).to.have.length(1);
                    expect(insertResult.result[0].invoice_no).to.eql(1111);
                    expect(insertResult.result[0].invoice_date).to.not.eql(undefined);
                    expect(insertResult.result[0].default_currency).to.eql("INR");
                    expect(insertResult.result[0].totalamt).to.eql(18000);
                    expect(insertResult.result[0].totalstax).to.eql(1800);
                    expect(insertResult.result[0].totalnet).to.eql(16200);
                    expect(insertResult.result[0].damt).to.eql(1250);
                    expect(insertResult.result[0].netword).to.eql("Greater that 1000");
                    expect(insertResult.result[0].invoicelineitems).to.have.length(2);

                    expect(insertResult.result[0].invoicelineitems[0].line_no).to.eql(1111);
                    expect(insertResult.result[0].invoicelineitems[0].damt).to.eql(50);
                    expect(insertResult.result[0].invoicelineitems[0].amt).to.eql(1500);
                    expect(insertResult.result[0].invoicelineitems[0].stax).to.eql(150);
                    expect(insertResult.result[0].invoicelineitems[0].net).to.eql(1350);
                    expect(insertResult.result[0].invoicelineitems[0].netword).to.eql("Greater that 1000");
                    expect(insertResult.result[0].invoicelineitems[0].deductions).to.have.length(1);
                    expect(insertResult.result[0].invoicelineitems[0].deductions[0].deduction_no).to.eql(1111);
                    expect(insertResult.result[0].invoicelineitems[0].deductions[0].damt).to.eql(50);
                    expect(insertResult.result[0].invoicelineitems[0].deductions[0].vat).to.eql(10);
                    expect(insertResult.result[0].invoicelineitems[0].deductions[0].dnetamt).to.eql(60);

                    expect(insertResult.result[0].invoicelineitems[1].line_no).to.eql(1111);
                    expect(insertResult.result[0].invoicelineitems[1].damt).to.eql(1200);
                    expect(insertResult.result[0].invoicelineitems[1].amt).to.eql(5500);
                    expect(insertResult.result[0].invoicelineitems[1].stax).to.eql(550);
                    expect(insertResult.result[0].invoicelineitems[1].net).to.eql(4950);
                    expect(insertResult.result[0].invoicelineitems[1].netword).to.eql("Greater that 1000");
                    expect(insertResult.result[0].invoicelineitems[1].deductions).to.have.length(2);
                    expect(insertResult.result[0].invoicelineitems[1].deductions[0].deduction_no).to.eql(1111);
                    expect(insertResult.result[0].invoicelineitems[1].deductions[0].damt).to.eql(1000);
                    expect(insertResult.result[0].invoicelineitems[1].deductions[0].vat).to.eql(200);
                    expect(insertResult.result[0].invoicelineitems[1].deductions[0].dnetamt).to.eql(1200);
                    expect(insertResult.result[0].invoicelineitems[1].deductions[1].deduction_no).to.eql(1111);
                    expect(insertResult.result[0].invoicelineitems[1].deductions[1].damt).to.eql(200);
                    expect(insertResult.result[0].invoicelineitems[1].deductions[1].vat).to.eql(40);
                    expect(insertResult.result[0].invoicelineitems[1].deductions[1].dnetamt).to.eql(240);

                    expect(insertResult.result[0].invoicelineitems1).to.have.length(2);
                    expect(insertResult.result[0].invoicelineitems1[0].line_no).to.eql(1111);
                    expect(insertResult.result[0].invoicelineitems1[0].amt).to.eql(3000);
                    expect(insertResult.result[0].invoicelineitems1[0].stax).to.eql(300);
                    expect(insertResult.result[0].invoicelineitems1[0].net).to.eql(2700);
                    expect(insertResult.result[0].invoicelineitems1[0].netword).to.eql("Greater that 1000");

                    expect(insertResult.result[0].invoicelineitems1[1].line_no).to.eql(1111);
                    expect(insertResult.result[0].invoicelineitems1[1].amt).to.eql(8000);
                    expect(insertResult.result[0].invoicelineitems1[1].stax).to.eql(800);
                    expect(insertResult.result[0].invoicelineitems1[1].net).to.eql(7200);
                    expect(insertResult.result[0].invoicelineitems1[1].netword).to.eql("Greater that 1000");

                    var updateInvoice = {_id:insertResult.result[0]._id, $set:{invoicelineitems:{$update:[
                        {_id:insertResult.result[0].invoicelineitems[0]._id, $set:{amt:3000, deductions:{$update:[
                            {_id:insertResult.result[0].invoicelineitems[0].deductions[0]._id, damt:100}
                        ], $insert:[
                            {damt:200}
                        ]}}},
                        {_id:insertResult.result[0].invoicelineitems[1]._id, $set:{amt:1000, deductions:{$update:[
                            {_id:insertResult.result[0].invoicelineitems[1].deductions[1]._id, damt:500}
                        ]}}}
                    ], $insert:[
                        {amt:20000, deductions:[
                            {damt:2000}
                        ]}
                    ]}, invoicelineitems1:{$update:[
                        {_id:insertResult.result[0].invoicelineitems1[1]._id, $set:{amt:10000}}
                    ]}}};
                    return db.updateAsPromise({$collection:"invoices", $update:updateInvoice});
                }).then(
                function () {
                    return db.queryAsPromise({$collection:"invoices"});
                }).then(
                function (result) {
                    updateResult = result;
                    console.log(">>>>>>>>>>>updateResult >>>>>>>>>>>>>>>>>>>>" + JSON.stringify(updateResult));
                    expect(updateResult.result).to.have.length(1);
                    expect(updateResult.result[0].invoice_no).to.eql(1111);
                    expect(updateResult.result[0].invoice_date).to.not.eql(undefined);
                    expect(updateResult.result[0].default_currency).to.eql("INR");
                    expect(updateResult.result[0].totalamt).to.eql(38000);
                    expect(updateResult.result[0].totalstax).to.eql(3800);
                    expect(updateResult.result[0].totalnet).to.eql(34200);
                    expect(updateResult.result[0].damt).to.eql(3800);
                    expect(updateResult.result[0].netword).to.eql("Greater that 1000");
                    expect(updateResult.result[0].invoicelineitems).to.have.length(3);


                    expect(updateResult.result[0].invoicelineitems[0].line_no).to.eql(1111);
                    expect(updateResult.result[0].invoicelineitems[0].damt).to.eql(300);
                    expect(updateResult.result[0].invoicelineitems[0].amt).to.eql(3500);
                    expect(updateResult.result[0].invoicelineitems[0].stax).to.eql(350);
                    expect(updateResult.result[0].invoicelineitems[0].net).to.eql(3150);
                    expect(updateResult.result[0].invoicelineitems[0].netword).to.eql("Greater that 1000");
                    expect(updateResult.result[0].invoicelineitems[0].deductions).to.have.length(2);
                    expect(updateResult.result[0].invoicelineitems[0].deductions[0].deduction_no).to.eql(1111);
                    expect(updateResult.result[0].invoicelineitems[0].deductions[0].damt).to.eql(100);
                    expect(updateResult.result[0].invoicelineitems[0].deductions[0].vat).to.eql(20);
                    expect(updateResult.result[0].invoicelineitems[0].deductions[0].dnetamt).to.eql(120);
                    expect(updateResult.result[0].invoicelineitems[0].deductions[1].deduction_no).to.eql(1111);
                    expect(updateResult.result[0].invoicelineitems[0].deductions[1].damt).to.eql(200);
                    expect(updateResult.result[0].invoicelineitems[0].deductions[1].vat).to.eql(40);
                    expect(updateResult.result[0].invoicelineitems[0].deductions[1].dnetamt).to.eql(240);

                    expect(updateResult.result[0].invoicelineitems[1].line_no).to.eql(1111);
                    expect(updateResult.result[0].invoicelineitems[1].damt).to.eql(1500);
                    expect(updateResult.result[0].invoicelineitems[1].amt).to.eql(1500);
                    expect(updateResult.result[0].invoicelineitems[1].stax).to.eql(150);
                    expect(updateResult.result[0].invoicelineitems[1].net).to.eql(1350);
                    expect(updateResult.result[0].invoicelineitems[1].netword).to.eql("Greater that 1000");
                    expect(updateResult.result[0].invoicelineitems[1].deductions).to.have.length(2);
                    expect(updateResult.result[0].invoicelineitems[1].deductions[0].deduction_no).to.eql(1111);
                    expect(updateResult.result[0].invoicelineitems[1].deductions[0].damt).to.eql(1000);
                    expect(updateResult.result[0].invoicelineitems[1].deductions[0].vat).to.eql(200);
                    expect(updateResult.result[0].invoicelineitems[1].deductions[0].dnetamt).to.eql(1200);
                    expect(updateResult.result[0].invoicelineitems[1].deductions[1].deduction_no).to.eql(1111);
                    expect(updateResult.result[0].invoicelineitems[1].deductions[1].damt).to.eql(500);
                    expect(updateResult.result[0].invoicelineitems[1].deductions[1].vat).to.eql(100);
                    expect(updateResult.result[0].invoicelineitems[1].deductions[1].dnetamt).to.eql(600);

                    expect(updateResult.result[0].invoicelineitems[2].line_no).to.eql(1111);
                    expect(updateResult.result[0].invoicelineitems[2].damt).to.eql(2000);
                    expect(updateResult.result[0].invoicelineitems[2].amt).to.eql(20000);
                    expect(updateResult.result[0].invoicelineitems[2].stax).to.eql(2000);
                    expect(updateResult.result[0].invoicelineitems[2].net).to.eql(18000);
                    expect(updateResult.result[0].invoicelineitems[2].netword).to.eql("Greater that 1000");
                    expect(updateResult.result[0].invoicelineitems[2].deductions).to.have.length(1);
                    expect(updateResult.result[0].invoicelineitems[2].deductions[0].deduction_no).to.eql(1111);
                    expect(updateResult.result[0].invoicelineitems[2].deductions[0].damt).to.eql(2000);
                    expect(updateResult.result[0].invoicelineitems[2].deductions[0].vat).to.eql(400);
                    expect(updateResult.result[0].invoicelineitems[2].deductions[0].dnetamt).to.eql(2400);


                    expect(updateResult.result[0].invoicelineitems1).to.have.length(2);
                    expect(updateResult.result[0].invoicelineitems1[0].line_no).to.eql(1111);
                    expect(updateResult.result[0].invoicelineitems1[0].amt).to.eql(3000);
                    expect(updateResult.result[0].invoicelineitems1[0].stax).to.eql(300);
                    expect(updateResult.result[0].invoicelineitems1[0].net).to.eql(2700);
                    expect(updateResult.result[0].invoicelineitems1[0].netword).to.eql("Greater that 1000");

                    expect(updateResult.result[0].invoicelineitems1[1].line_no).to.eql(1111);
                    expect(updateResult.result[0].invoicelineitems1[1].amt).to.eql(10000);
                    expect(updateResult.result[0].invoicelineitems1[1].stax).to.eql(1000);
                    expect(updateResult.result[0].invoicelineitems1[1].net).to.eql(9000);
                    expect(updateResult.result[0].invoicelineitems1[1].netword).to.eql("Greater that 1000");

                    var deleteUpdate = {_id:updateResult.result[0]._id, $set:{invoicelineitems1:{$delete:[
                        {_id:updateResult.result[0].invoicelineitems1[1]._id}
                    ]}, invoicelineitems:{$update:[
                        {_id:updateResult.result[0].invoicelineitems[1]._id, deductions:{$delete:[
                            {_id:updateResult.result[0].invoicelineitems[1].deductions[0]._id}
                        ]}}
                    ], $delete:[
                        {_id:updateResult.result[0].invoicelineitems[0]._id}
                    ]}}};
                    return db.updateAsPromise({$collection:"invoices", $update:deleteUpdate});
                }).then(
                function () {
                    return  db.queryAsPromise({$collection:"invoices"});
                }).then(
                function (updateResult) {
                    console.log("+++++++=deleteResult++++++++++++++++" + JSON.stringify(updateResult));

                    expect(updateResult.result).to.have.length(1);
                    expect(updateResult.result[0].invoice_no).to.eql(1111);
                    expect(updateResult.result[0].invoice_date).to.not.eql(undefined);
                    expect(updateResult.result[0].default_currency).to.eql("INR");
                    expect(updateResult.result[0].totalamt).to.eql(25000);
                    expect(updateResult.result[0].totalstax).to.eql(2500);
                    expect(updateResult.result[0].totalnet).to.eql(22500);
                    expect(updateResult.result[0].damt).to.eql(1900);
                    expect(updateResult.result[0].netword).to.eql("Greater that 1000");
                    expect(updateResult.result[0].invoicelineitems).to.have.length(2);

                    expect(updateResult.result[0].invoicelineitems[0].line_no).to.eql(1111);
                    expect(updateResult.result[0].invoicelineitems[0].damt).to.eql(500);
                    expect(updateResult.result[0].invoicelineitems[0].amt).to.eql(2000);
                    expect(updateResult.result[0].invoicelineitems[0].stax).to.eql(200);
                    expect(updateResult.result[0].invoicelineitems[0].net).to.eql(1800);
                    expect(updateResult.result[0].invoicelineitems[0].netword).to.eql("Greater that 1000");
                    expect(updateResult.result[0].invoicelineitems[0].deductions).to.have.length(1);
                    expect(updateResult.result[0].invoicelineitems[0].deductions[0].deduction_no).to.eql(1111);
                    expect(updateResult.result[0].invoicelineitems[0].deductions[0].damt).to.eql(500);
                    expect(updateResult.result[0].invoicelineitems[0].deductions[0].vat).to.eql(100);
                    expect(updateResult.result[0].invoicelineitems[0].deductions[0].dnetamt).to.eql(600);

                    expect(updateResult.result[0].invoicelineitems[1].line_no).to.eql(1111);
                    expect(updateResult.result[0].invoicelineitems[1].damt).to.eql(2000);
                    expect(updateResult.result[0].invoicelineitems[1].amt).to.eql(20000);
                    expect(updateResult.result[0].invoicelineitems[1].stax).to.eql(2000);
                    expect(updateResult.result[0].invoicelineitems[1].net).to.eql(18000);
                    expect(updateResult.result[0].invoicelineitems[1].netword).to.eql("Greater that 1000");
                    expect(updateResult.result[0].invoicelineitems[1].deductions).to.have.length(1);
                    expect(updateResult.result[0].invoicelineitems[1].deductions[0].deduction_no).to.eql(1111);
                    expect(updateResult.result[0].invoicelineitems[1].deductions[0].damt).to.eql(2000);
                    expect(updateResult.result[0].invoicelineitems[1].deductions[0].vat).to.eql(400);
                    expect(updateResult.result[0].invoicelineitems[1].deductions[0].dnetamt).to.eql(2400);

                    expect(updateResult.result[0].invoicelineitems1).to.have.length(1);
                    expect(updateResult.result[0].invoicelineitems1[0].line_no).to.eql(1111);
                    expect(updateResult.result[0].invoicelineitems1[0].amt).to.eql(3000);
                    expect(updateResult.result[0].invoicelineitems1[0].stax).to.eql(300);
                    expect(updateResult.result[0].invoicelineitems1[0].net).to.eql(2700);
                    expect(updateResult.result[0].invoicelineitems1[0].netword).to.eql("Greater that 1000");
                }).then(
                function () {
                    done();
                }).fail(function (e) {
                    done(e);
                })
        })
    })
})
describe("Default value test", function () {
    //document
    //updatedFields, oldValue, parentDocument --> Voucher
    //when will
    //value fired -> on insert or first update
    //angular watch fired before one complete
    //show invoicelineitem:[] --> add listener will fire or not when they are getting changed in trigger
    //how to give invoice line item added/delete events
    //events
    //onInsert: When new row added in voucher
    //onInsert:["vlis"]
    //onDelete
    //onDelete :["vlis"]
    //onSave : Default is pre
    //onSave:["pre"]  --> When voucher will going to save (Insert, Update , Delete)
    //onSave:["post"]  --> When voucher will get saved (Insert, Update , Delete)
    //onValue
    //onValue:["status"]
    //onValue:["lineitems.amount"]  ->
    //onValue:["lineitems.taxlineitems.taxamt"]
    it.skip("Task creation", function (done) {
        var taskCollection = {collection:"tasks", triggers:[
            {
                event:"rowAdded", function:"onTaskInsert",
                event:'value:["owner"]', function:"onOwner"

            }
        ]}

        function onTaskInsert(doc, db, callback) {
            doc.comments = ["New task created by " + db.user.username];
            doc.status = "New"
            callback();
        }

        function onOwnerChange(doc, logger, db, callback) {
            //save a new comment
            var ownerName = doc.owner;
            db.batchUpdateById({$collection:"users", $upsert:{username:ownerName}}, function () {

            })
        }
    })
    it.skip("Invoice creation", function (done) {

        var invoiceCollection = {collection:"invoices", triggers:[
            {
                event:"", function:""
            }
        ]};

        function onRowAdded(doc) {
            doc.creation_date = new Date();
        }

        function onVendorChange(doc, log, db, callback) {
            var vendor = doc.vendor;
            //get deliveries
            db.query({$collection:"deliveries", $filter:{vendor:vendor}}, function (err, deliveries) {
                deliveries = deliveries.result;
                doc.totalAmt = 0;
                doc.invoiceLineItem = [];
                for (var i = 0; i < deliveries.length; i++) {
                    var lineitem = {}
                    lineitem.delivery = deliveries[i];
                    lineitem.amount = deliveries[i].amount;
                }

            })
        }

        function onLineItemAmountDelete(doc) {
            doc.parent.amount -= doc.old.amount;
        }

        function onLineItemAmountChanged(doc) {
            doc.parent.amount += doc.amount - doc.old.amount;
        }

        function onLineItemTaxAmountChanged(doc) {
            doc.parent.taxamount += doc.toalTaxAmt - doc.old.toalTaxAmt;
        }

        function onTaxLineItemAmountChange(doc) {
            doc.parent.toalTaxAmt += doc.taxAmt - doc.old.taxAmt;
        }

        function onTaxLineItemDelete(doc) {
            doc.parent.taxamount -= doc.old.toalTaxAmt;
        }

        function onInvoiceSave(doc, db, callback) {
            db.batchUpdateById({$collection:"vouchers", $insert:{}}, function (err, voucher) {
                db.batchUpdateById({$collection:"invoices", $update:{_id:doc.get("_id"), $set:{voucherid:voucher.$insert[0]._id}}}, function () {

                })
            })
        }

        // value:[vendorid], client:true, server:true, default both tue

        function onVendorChange(doc, error, db, callback) {

            var vendorId = doc.get("vendorid");
            db.query({$query:{}}, function (err, pendingInvoices) {

                var invoiceLineItems = doc.getDocuments("invoicelineitems");

                for (i = 0; i < invoiceLineItems.lengh; i++) {
                    doc.deleteDocument("invoicelineitem", invoiceLineItems[i]._id)
                }


                for (i = 0; i < pendingInvoices.lengh; i++) {
                    var pendingInvoice = pendingInvoices[i];
                    doc.addDocuemnt("invoicelineitems", pendingInvoices[i])
                }


            })


        }

        //doc
        //updates
        //oldvalue
        //type
        //requiredvalue
        //
        //transient updates : {$set:{_id:"i1",vendor:"AirTel"},$unset:{},$transient:{_id:"i1",vendor :{tax:"AirtelService"},invoicelineitems:[]}}
        //onRowAdded:["invoicelineitems"] -->
        // onValue:[{"invoicelineitems":[]}] --> doc --> lineitems and invoice as parent and will run on invoice line item create
        // onValue:[{"invoicelineitems":["Amout"]}] --> doc --> lineitems and invoice as parent
        // onValue:["invoicelineitem"] --> doc--> invoice

        function onInvoiceLineItemAdded(doc) {
            doc.vendorId = doc.parent.vendorId;
            //tax calculation
        }


        //onRowDeleted:["invoicelineitems"] --> it is not required now, will be handle onValueChanage
        function onInvoiceLineItemDelete(doc) {
            doc.parent.totalAmt -= doc.amount;
        }

        //value:[{"invoicelineitem":["amount"]}]
        function onInvoiceLineItemAmount(doc) {
            doc.parent.amount = doc.parent.amount - doc.old.amount + doc.amount;
        }

        //value:[{"invoicelineitem":["invoiceid"]}]
        function onInvoiceLineItemAmount(doc, err, db, callback) {
            var invoiceID = doc.get("invoice");
            db.query({}, function (err, invoiceDetail) {
                var pendingAmt = invoiceDetail.pendingAmt;
                doc.amount = pendingAmt;
            })
        }

        //when profit center in invoice change, update it to all lineitems
        //value:["profitcenter"]
        function onProfitCenter(doc) {
            var profiteCenter = doc.get("profitecenter");
            var lineitems = doc.getDocuments("lineitems");
            for (var i = 0; i < lineitems.length; i++) {
                lineitems[i].profitecenter = profiteCenter;

            }
        }

        //invoice --> lineitems --> deliveryid --> productid --> accountid --> required in after
        //relationships -->
        //>> validation --> entity.name, entity.emailid, productid, productid.ptoductype
        //>> assignto A then can not assign to B(Current User)
        //>>>
        function onAssignToChange(doc, err) {
            //do validation work here
        }

        //deliveries
        //value:[amount] --> on delivery collection
        function onDeliveryAmt(doc, err) {
            doc.parent.totalamt = doc.parent.totalamt - doc.old.amt + doc.amt;
            //forServer
            db.batchUpdate({$collection:"ordres", $update:{_id:"o1", $inc:{amount:10}}}, function () {

            })
        }

        //value:[rate] --> on delivery collection
        function onDeliveryRateChanged(doc) {
            doc.amount = doc.rate * doc.qty;
        }

        //when delivery created independently
        //onRowSaved
        function onDeliverySaved(doc) {
            //in after delivery save
            var orderUpdates = {$inc:{amount:doc.amount}}
            db.batchUpdateById(orderUpdates, function () {

            })

        }

        //when delivery created independtely
        //onValue : [Amount]
        function onDeliverySaved(doc) {
            //in after delivery save
            var orderUpdates = {$inc:{amount:doc.amount}}
            db.batchUpdateById(orderUpdates, function () {

            })

        }

        var invoice = {vendor:"Airtel", totalAmt:1200, "lineitems":[
            {deliveryid:"", amount:1200}
        ]}
        var clientOld = {vendor:"Airtel", totalAmt:1200, "lineitems":[
            {deliveryid:"", amount:1200}
        ]}    //will be sent as old value from client in case of insert, and server will check on the basis of this wht is required col here
        var client = true //for default value

        //

        //client side --> batch update accumulate
        //client side --> inc update support
        //!!!>>>>>>delivery --> will update order amt as batchupdate at client, should we trigger order event in this case
        //!!!>>>>>>same point if voucher is saved from invoice at client side, should trigger voucher event
        //client side --> server side, insret case , as old value will be provide
        //We will execute the opeartion on client if collection is loaded and in that case we will fire onValue of new Operation, in this case orders's amount, if collection is not loaded, for eg, account upate, then it will not triggered and only operation will be accumulated and execute at server
        //
        //autoinc case
        //>>
        //>> onValue : Blnak, then it will fire on insert
        //>>
        //>> onValue(Server)
        //>>>>Client will send old value, but server will not consider this, account upate case
        //>> onInsert
        //>> onSave(Pre)
        // onSave(Post)
        //onValue (Both client and server)
        // if run at client then due to old vlaue, server will have no effect
        //onValue at client --> valid and it will not run on server (vendoer defautl vlaue for delivery invoice)
        //onvalue only at server --> oldValue will not be consider and it will run
        //if incremental update or some thing else done in both onValueChange and onSave --> then we can not stop user, it will be double effect
        //onSave(Pre) : Client
        //onSave(Pre) : Server
        //onSave(Pre) : Client & Server
        //
        //onSave(Post) : Only at server, we will not allow it at client and will be synch (As per yogehs sir, it should be asynch and need to be discuss)
        //>>>>>>>vli--> account change --> manage account total
        //>>>>>>>Delivery --> order total
        //>>>Invoice --> Vouhcer save (auto inc)
        //!!>>>at server, insert, when old vlaue is passed from client, what should be given in updatedfields
        //onPreSave --> client will have oldValue of its original, in case of insert(null) and in case of server, oldValue will be consider same updates pass by client and there will be no change in comparision oldValue and newValue
        function onVoucherSavePre(doc, db, callback) {
            var lineItems = doc.getDocuments("lineitems", ["insert", "update", "delete"]);
            for (var i = 0; i < lineItems.length; i++) {
                var lineItem = lineItems[i];
                var op = lineItem.operation;
                var oldAccount = lineItem.getOld("account");
                var newAccount = lineItem.get("account")
                if (oldAccount !== newAccount) {
                    var oldAmt = lineItem.getOld("Amount");
                    var newAmt = lineItem.get("Amount");
                    db.batchUpdate("Account", {_id:oldAccount, $inc:{amount:-1 * amount}})
                    db.batchUpdate("Account", {_id:newAccount, $inc:{amount:amount}})

                } else {
                    var oldAmt = lineItem.getOld("Amount");
                    var newAmt = lineItem.get("Amount");
                    var netEffect = newAmt - oldAmt;
                    //!!amount is double and it has issue in equal comparision
                    if (netEffect >= 0.00001 || netEffect <= 0.00001) {
                        db.batchUpdate("Account", {_id:newAccount, $inc:{amount:netEffect}});
                    }

                }

            }
        }

        //onInsert, onValue should be fire if value is defined with updatedValue : newvalue, oldValue : null
        //onDelete, olValue should fire if value is defined with updateValue : null and oldValue
        //if onDelte is passed from client to server, then oldValue will be null

        function onInvoiceDelete(doc) {
            var voucherId = doc.getOld("vouhcerid");
            if (voucherId) {
                db.update({collection:"vouchers", $delete:{_id:voucherId}});
            }

        }

        //autoinc case, --> will resides at server, need to confirm if required at client, when voucher create
        //invoice --> voucher need to be saved
        //logger--> can add message, warning, error, log in trigger
        //onValueChange --> module manager changes
        //onValueChange:["_id"] --> if _id is null, then it will be consider as delete -> it is ok, it should not be, it may do its work on onSave event
        //trigger --> onsave --> do some value change like set some fk field --> then it will be treated by module on value change --> menas should we fire value change on save also
        //requiredField--> will be manage by developer, do it is same on server also, means we will not give ourself requiredField values
        //onValue:type, required for module
        //for fk, do we need to add display field as dot in query or not, wht abt setFeilds


        //13-05-2014 Rohit and Sachin**********************************************************************
        //required fields case 1
        //invoice lineitems --> deliveries --> product --> accountid --> create vouchers for these accounts, voucher line items also required
        //afterSave at server
        function onInvoiceSave(doc) {
            //getLineItems, it will have delete, inserted and noChange, and updated
            //user should make a query to find required values


            var invoice = {no:12, lineitems:[
                {deliveryid:"xxx"},
                {delivery:"yyyyy"},
                {_id:"l11", deliveryid:"xxxx"},
                {_id:"xxx", __type__:"delete"}
            ]}

            var requiredREsult = [
                {deliveryid:"xxx", productuid:{accountid:{account:"cash"}}},
                {_id:"l11", deliveryid:"xxxx", productid:{}}
            ]


        }


        //required fields case 2
        //receipt --> vendor --> tdsaccount,servicetaxaccount,tdspercentage, serviceTaxPercentage
        function onVendorChange(doc) {
            var vendorId = doc.get("vendorid");
            var vendorDetailQuery = {$collection:"vendors", $filter:{_id:"$vendorid"}, $fields:{service_tax_percentage:1}}
            db.query(vendorDetailQuery, function (err, vendorDetails) {
                doc.setTransient("vendorid", vendorDetails); // transient value as other parameter in set
            })
        }

        // SElect vendor, in receipt line items --> serviceTaxPercentage is used to calcuate service tax also reflected at clilent side

        //required fields case 3
        //cab delay request --> employeeid --> sitting location --> cab admin --> officical email address --> consume this, onSave(Server)
        //required fields case 4
        // invoice -- lineitems -> [] --> otherdeductions [] --> deduction type --> accountid -> create voucher, onSave (server)


        //>> validation --> entity.name, entity.emailid, productid, productid.ptoductype

        //transient fields

        //vendor change --> get Line items
        //

        //initial stage --> updates : {}
        //>Fire valueChange --> do your oninsert work here
        //t1, t2 are registered for onInsert event
        //t1 --> will set CurrentDate
        //t2 --> will set currentUserId as vendorId

        /*
         collections : employees
         event : "onValue:["fname","lname"]" , function :"updateName"
         event : onValue , function :"onTaskInsert"

         function --> doc, log, db,callback

         voucher
         totalAmount :
         lineitems
         cash    100 --> 50 -> 200
         bank    200
         onValue:[{lineitems:["amount"]}] --> doc of lineitem
         function(doc){
         doc.parent.totalAmt = doc.parent.totalAmt - doc.old.amount + doc.amount
         }

         onValue: [], onValue
         onValue : [{lineitems:[]}] --> will be called when
         when profitcenter of voucher is to be inserted in vli
         doc.profitcenter  =doc.parent.profitcente

         onValue:profitCenter
         var vlis = doc.vlis;

         Invoice - > Vendor --> change vendor and then get all deliveries of that vendor
         onVendorChange(doc,db){
         var vendorid  =doc.vendorid;
         db.query ({collection:"deliveries"},function(err,deliveries){
         var oldLienitems =
         })

         }



         no of pieces per cart0on
         quantity
         rate
         totalpiecees
         onValue : [quantity,rate]  --> calculateAmt
         onValue : [quantity]  --> calculatePieces
         onValue : [amount] --> calcuateServiceTax
         onValue : [amount,convertedAmt]  --> currecyFluctuation()
         onValue : ["currencyFlucation"] -->
         calculateAmt(){
         doc.amount = doc.qty * doc.rate    ; 100 --> amount change doc.set("amount",100)
         doc.convertedAmt = doc.amount * ./1 ;   --> 99

         }

         calculatePieces(){
         }
         calcuateServiceTax(){
         }

         onValue : ["vendor"] -->   findVendorAccount
         onValue : ["Vendor"] --> pending deliveries
         findVendorAccount(){
         db.query({$collection:"vedor"},function(vendorDetails){
         doc.setTranseint("vendor",vendorDetails)
         })

         }


         //what should be old value in updated document
         qty,rate : calculateAmt
         amount --> serviceTax
         amount,serviceTax --> Net Amount
         net amount -- updateParentAmount

         {qty:6,rate:5}, {}

         function calculateAmt(){

         }

         qty -->
         (update{qty:6,rate:5}, old :{} )--> amount -> 30 -->
         (update{qty:6,rate:5,amount:30},old :{}}      serviceTax : 3
         (update{qty:6,rate:5,amount:30,serviceTax:3},old :{qty:6,rate:5,amount:30}}        NetAmount - 27
         Net Amount : 27

         updateParentAmount(doc){
         (update{qty:6,rate:5,amount:30,serviceTax:3,netAmount:27},old :{qty:6,rate:5,amount:30,serviceTax:3,}}
         var netAmt  =doc.netAmt;
         doc.parent.totalAmt = doc.parent.totalAmt - doc.old.netAmt + doc.netAmt
         }

         Now again for rate
         {qty:6,rate:5,amount:30,serviceTax:3,netAmount:27},old :{qty:6,rate:5,amount:30,serviceTax:3,netAmount:27}
         --> qty logic --> amount : 30 , doc.set("amount": 30)

         server, module, value change, but dependent on output of others, fk moudles, set

         Transeint point -->
         var voucherUpdates =  {no:123, date :"2012-10-10", vlis : [ {_id:"vli1",amount:10,account:cash} ]}
         var oldValue = {};
         var transient = {vlis:[{_id:"vli1"}]};
         var requriedValue = {};
         var voucherDocument = new Docuemnt (voucherUpdates,oldValue, transient, requiredValue)
         var vliUpdates =  voucherUpdates.vlis[0];
         var vliTranseint = transient.vli[0];

         estimate times
         Server
         use of promise
         document implementation : 1 days
         updates,old,cumulativeOld,transient,requriedFieldValue,type
         parentDocument
         logs
         addLog
         addError
         addWarning
         addMessage
         set(field,value,isTransient)
         addDocument
         removeDocument
         Events calling : 2 days
         use of cumulative old value
         call trigger
         final callback on calling trigger, required for saveing hold
         onSave -> client and server
         requiredField in onSave (insert case handling) (1 day)
         function registration change: 1 day (filename.functionname) --> employee.onFirstName
         Client Side Old Value --> data type
         module changes : 2 day
         test cases : 3-4 day
         Client
         angular issue of ng-watch - 1-2 days
         Use same business logic of server at client (loading, unloading of triggers) : 2 days
         Logs : 1 day
         save holding until default is resolving : 1 day
         image loading when default is resolving
         inc/dec support in updates : 1 day
         dellivery --> order updates --> update order amount at client side : 1 day









         */


    })

})