///**
// * mocha --recursive --timeout 150000 -g "DisconnectTestCase" --reporter spec
// *
// */
//var expect = require('chai').expect;
//var ApplaneDB = require("../lib/DB.js");
//var Config = require("./config.js");
//var Document = require("ApplaneDB/lib/Document.js");
//var HttpUtil = require("ApplaneCore/apputil/httputil.js");
//
//
//describe("DisconnectTestCase", function () {
//    it("disconnect", function (done) {
//        var params = {};
//        params.db = "admindb";
//        var service = {};
//        service.hostname = "localhost";
//        service.port = "5100";
//        service.path = "/rest/connect";
//        service.method = "post";
//        HttpUtil.executeService(service, params, function (err, connectionToken) {
//            if (err) {
//                done(err);
//                return;
//            }
//            console.log("connectionToken>>>" + connectionToken);
//            connectionToken = connectionToken ? JSON.parse(connectionToken) : connectionToken;
//            var token = connectionToken && connectionToken.response ? connectionToken.response.token : null;
//            if (token) {
//                var params = {};
//                service.path = "/rest/query";
//                var query = JSON.stringify({"$collection": "pl.connections", $filter: {"token": token}});
//                params.query = query;
//                params.token = token;
//                HttpUtil.executeService(service, params, function (err, result) {
//                    if (err) {
//                        done(err);
//                        return;
//                    }
//                    console.log("result>>>" + JSON.stringify(result));
//                    service.path = "/rest/disconnect";
//                    HttpUtil.executeService(service, {token: token}, function (err, result) {
//                        if (err) {
//                            done(err);
//                            return;
//                        }
//                        service.path = "/rest/query";
//                        params.query = {"$collection": "pl.connections", $filter: {"token": token}};
//                        HttpUtil.executeService(service, params, function (err, result) {
//                            if (err) {
//                                done(err);
//                                return;
//                            }
//                            done();
//                        });
//
//                    });
//
//
//                });
//            }
//            else {
//                expect(connectionToken).not.to.be.ok;
//            }
//        });
//    });
//})
//;
