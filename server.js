var express = require('express');
var http = require('http');

var app = express();

app.use(express.bodyParser());

var Utils = require("ApplaneCore/apputil/util.js");
var ApplaneDB = require("ApplaneDB");

var ApplaneDBHttp = require("ApplaneDB").HTTP;
ApplaneDBHttp.configure(app);

http.createServer(app).listen(process.env.PORT || 5100);


