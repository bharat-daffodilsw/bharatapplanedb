var ObjectId = require("mongodb").ObjectID;
var Utils = require("ApplaneCore/apputil/util.js");

var Config = {};
//Config.URL = "mongodb://ds041779-a0.mongolab.com:41779,ds041779-a1.mongolab.com:41779";
Config.URL = "mongodb://192.168.100.129:27017"
Config.DB = "testerrorcode";
Config.ADMIN_DB = "testerrorcode";

var MongoClient = require("mongodb").MongoClient;

function connectToMongo(url, username, pwd, adminDB, callback) {

    console.log("url>>>" + url)
    MongoClient.connect(url, function (err, db) {
        if (err) {
            console.log("unable to connect with mongo")
            callback(err);
            return;
        }
        db.authenticate(username, pwd, {authdb:adminDB}, function (err, res) {
            if (err) {
                console.log("auth error>>>" + err)
                callback(err);
            } else if (!res) {
                console.log("not auth ")
                callback(new Error("Auth fails"));
            } else {
                callback(null, db);
            }
        })
    })
}

var localDB = Config.URL + "/" + Config.DB + "/";
console.log("connection to server");
console.log("localDB>>>   " + localDB);
connectToMongo(localDB, "admin", "damin", "admin", function (err, db) {
    if (err) {
        console.log("error>>>>" + err.stack);
        return;
    }
    console.log("Connection Done :::::::::::::::::::!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    return;
})

function portTX() {
    connectToMongo(localDB, "admin", "damin", "admin", function (err, db) {
        if (err) {
            console.log("error>>>>" + err.stack);
            return;
        }
        console.log("db>>>>" + db.databaseName);
        var txCollectionMogno = db.collection("pl.txs");
        txCollectionMogno.find().toArray(function (err, data) {
            if (err) {
                console.log("error>>>>" + err.stack);
                return;
            }
            console.log("collections>>>>" + JSON.stringify(data));
            var txRecord = data[0];
            var updates = txRecord.updates;
            Utils.iterateArrayWithIndex(updates, function (err) {
                if (err) {
                    console.log("error>>>>" + err.stack);
                    return;
                }
                console.log(">>>DONE>>>>>")
            }, function (index, update, callback) {
                console.log("index>>>>" + index);
                var tx = update.tx;
                var txCollection = tx.$collection;
                var mongoCollection = db.collection(txCollection);
                if (tx.$insert) {
                    delete tx.$insert.fields;
                    console.log("tx.$insert>>>>" + JSON.stringify(tx.$insert));
                    mongoCollection.insert(tx.$insert, function (err) {
                        if (err) {
                            console.log(">>>>>>err>>>" + err.stack);
                            callback();
                            return;
                        }
                        txCollectionMogno.update({_id:txRecord._id}, {$pull:{updates:{_id:update._id}}}, function (err) {
                            if (err) {
                                console.log("mongo tx roll back err>>>" + err.stack);
                                callback(err);
                            }
                            callback();
                        })
                    })

                } else {
                    console.log(">>>>Tx>>>>" + JSON.stringify(tx));
                }
            })


        })

    })
}

//portTX();
function getFields() {
    connectToMongo(localDB, "admin", "damin", "admin", function (err, db) {
        if (err) {
            console.log("error>>>>" + err.stack);
            return;
        }
        console.log("db>>>>" + db.databaseName);
        var mongoCollection = db.collection("countriesss");
        mongoCollection.insert({_id:"rohit", name:"rohit"}, function (err) {
            if (err) {
                console.log(">>>>>>err>>>" + err.stack);
                console.log(">>>>>>err code >>>" + err.code);
                console.log(">>>>>>message>>>" + err.message);
                console.log(">>>>>>err strngify>>>" + JSON.stringify(err));
                return;
            }
            console.log("inserted 1>>>")
            mongoCollection.insert({_id:"rohit", name:"rohit"}, function (err) {
                if (err) {
                    console.log(">>>>>>err>>>" + err.stack);
                    console.log(">>>>>>err code >>>" + err.code);
                    console.log(">>>>>>message>>>" + err.message);
                    console.log(">>>>>>err strngify>>>" + JSON.stringify(err));
                    return;
                }
                console.log("inserted 2>>>")
            })
        })

    })

}
getFields();
