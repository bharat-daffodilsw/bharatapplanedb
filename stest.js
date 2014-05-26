var ObjectId = require("mongodb").ObjectID;
var expect = require('chai').expect;
var ApplaneDB = require("ApplaneDB");
var NorthwindDb = require("./test/NorthwindDb.js");
var Utils = require("ApplaneCore/apputil/util.js");
var Constants = require("./lib/Constants.js");
var TEST_UTILITY = require("./test/Utility.js");
//var OPTIONS = {username:"rohit", password:"daffodil"};
var OPTIONS = {};
var Document = require("./lib/Document.js");

var Config = {};
Config.URL = "mongodb://127.0.0.1:27017";
Config.DB = "northwindtestcases";
Config.ADMIN_DB = "applaneadmin";
//cash account allready esists


var invoices1 = {
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
                {field:"damt", type:"number"},
            ]}
        ]},
//        {field:"invoicelineitems1", type:"object", multiple:true, fields:[
//            {field:"invoice_no", type:"string"},
//            {field:"amt", type:"number"},
//            {field:"stax", type:"number"},
//            {field:"net", type:"number"}
//        ]}
    ], events:[
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
        {event:'onValue:["totalnet"]', function:"Invoicess.NetWord"}


    ]
}

var bills = {
    collection:"bills", fields:[
        {field:"qty", type:"number"},
        {field:"rate", type:"number"},
        {field:"amount", type:"number"} ,
        {field:"stax", type:"number"} ,
        {field:"totalamount", type:"number"} ,

//        {field:"invoicelineitems1", type:"object", multiple:true, fields:[
//            {field:"invoice_no", type:"string"},
//            {field:"amt", type:"number"},
//            {field:"stax", type:"number"},
//            {field:"net", type:"number"}
//        ]}
    ], events:[
        {event:'onValue:["rate","qty"]', function:"Bills1.calculateAmt"}
    ]
}

var functionsToRegister = [
    {name:"Bills", source:"NorthwindTestCase/lib", type:"js"},
    {name:"Invoicess", source:"NorthwindTestCase/lib", type:"js"},
    {name:"Bills1", source:"NorthwindTestCase/lib", type:"js"}
]


ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
    if (err) {
        console.log("Error>>>>" + err)
        return;
    }


    var callback = function (err, data) {
        if (err) {
            console.log('error >>>' + err.stack)
            return;
        }
        console.log("result>>>" + JSON.stringify(data));

    }
    ApplaneDB.addFunction(functionsToRegister, function (err) {
        if (err) {
            callback(err);
            return;
        }

        var type = "moduleinsert";
        if (type == "insert") {
            var invoice = {invoice_no:1111, invoicelineitems:{$insert:[
                {amt:1000},
                {amt:5000},
                {amt:10000}
            ]}, invoicelineitems1:{$insert:[
                {amt:1000},
                {amt:5000}
            ]}};

            var invoice = {invoice_no:1111, invoicelineitems:{$insert:[
                {amt:1000},
                {amt:5000},
                {amt:10000}
            ]}};


//            var invoice = {invoice_no:1111, invoicelineitems:{$insert:[
//                {amt:1000, deductions:{$insert:[
//                    {damt:50}
//                ]}}
//
//            ]}};
            db.updateAsPromise({$collection:invoices1, $insert:invoice}).then(
                function () {
                    db.query({$collection:"invoices", $sort:{_id:-1}, $limit:1}, function (err, result) {
                        if (err) {
                            callback(err);
                            return;
                        }
                        console.log("result >>>>>>>>>>>>>>>>>>>>" + JSON.stringify(result));
                        ApplaneDB.getMethodToInvoke();
                        callback();
                    })
                }).fail(function (e) {
                    callback(e);
                })
        } else if (type == "update") {
            var invoice = {_id:"537e149c8224fad01cf8e8e9", $set:{invoicelineitems:{$update:[
                {_id:"537e149c8224fad01cf8e8e7", $set:{amt:3000, deductions:{$update:[
                    {_id:"537e149c8224fad01cf8e8e8", damt:100}
                ], $insert:[
                    {damt:200}
                ]}}}
            ], $insert:[
                {amt:20000, deductions:{$insert:[
                    {damt:2000}
                ]}}
            ]}}};


            db.updateAsPromise({$collection:invoices1, $update:invoice}).then(
                function () {
                    db.query({$collection:"invoices", $filter:{_id:"537e149c8224fad01cf8e8e9"}, $sort:{_id:-1}, $limit:1}, function (err, result) {
                        if (err) {
                            callback(err);
                            return;
                        }
                        console.log("result >>>>>>>>>>>>>>>>>>>>" + JSON.stringify(result));
                        ApplaneDB.getMethodToInvoke();
                        callback();
                    })
                }).fail(function (e) {
                    callback(e);
                })
        } else if (type == "delete") {
            var invoice = {_id:"537e181feeae63941f0557ea", $set:{invoicelineitems:{$delete:[
                {_id:"537e181eeeae63941f0557e8"}
            ] }}};


            db.updateAsPromise({$collection:invoices1, $update:invoice}).then(
                function () {
                    db.query({$collection:"invoices", $filter:{_id:"537e181feeae63941f0557ea"}, $sort:{_id:-1}, $limit:1}, function (err, result) {
                        if (err) {
                            callback(err);
                            return;
                        }
                        console.log("result >>>>>>>>>>>>>>>>>>>>" + JSON.stringify(result));
                        ApplaneDB.getMethodToInvoke();
                        callback();
                    })
                }).fail(function (e) {
                    callback(e);
                })
        } else if (type == "doc") {
            var updates = {_id:"rohit", $set:{countryid:{_id:"india"}}}
            var updates = {_id:"rohit", $set:{countryid:{$query:{_id:"india"}, $set:{country:"India"}}}}
            var old = {_id:"rohit", countryid:{_id:"china", country:"china"}};
            var document = new Document(updates, old, "update");
            var json = document.convertToJSON();
            console.log("json>>" + JSON.stringify(json));
        } else if (type == "moduleinsert") {
            var bill = {qty:"100", rate:"50"}


            db.updateAsPromise({$collection:bills, $insert:bill}).then(
                function () {
                    console.log("querying>>>>")
                    db.query({$collection:"bills", $sort:{_id:-1}, $limit:1}, function (err, result) {
                        if (err) {
                            console.log("error cnoutnred")
                            callback(err);
                            return;
                        }
                        console.log("result >>>>>>>>>>>>>>>>>>>>" + JSON.stringify(result));
                        ApplaneDB.getMethodToInvoke();
                        callback();
                    })
                }).fail(function (e) {
                    callback(e);
                })
        }


    })


})
