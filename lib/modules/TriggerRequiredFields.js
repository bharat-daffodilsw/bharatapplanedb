/**
 * Created with IntelliJ IDEA.
 * User: Administrator
 * Date: 4/28/14
 * Time: 10:57 AM
 * To change this template use File | Settings | File Templates.
 */
var Constants = require("../Constants.js");
var Utils = require("ApplaneCore/apputil/util.js");
exports.doQuery = function (query, collection, db, callback) {
    callback();
}

exports.doResult = function (query, result, collection, db, callback) {
    callback();
}

exports.preInsert = function (document, collection, db, callback) {
    loadDocument(document, collection, db, function (err, document) {
        if (err) {
            callback(err);
            return;
        }
        callback();
    });
}

exports.postInsert = function (document, collection, db, callback) {
    callback();
}

exports.postDelete = function (document, collection, db, callback) {
    callback();
}

exports.preDelete = function (document, collection, db, callback) {
    loadDocument(document, collection, db, function (err, document) {
        if (err) {
            callback(err);
            return;
        }
        callback();
    });
}

exports.postUpdate = function (document, collection, db, callback) {
    callback();
}

exports.preUpdate = function (document, collection, db, callback) {
    loadDocument(document, collection, db, function (err, document) {
        if (err) {
            callback(err);
            return;
        }
        callback();
    });
}

exports.preCommit = function (document, collection, db, callback) {
    callback();
}


exports.postCommit = function (document, collection, db, callback) {
    callback();
}

function loadDocument(document, collection, db, callback) {
    getRequiredFields(collection, function (err, requiredFields) {
        if (err) {
            callback(err);
            return;
        }
        requiredFields = Object.keys(requiredFields).length > 0 ? requiredFields : undefined;
        if (requiredFields) {
            var query = {};
            query[Constants.Query.COLLECTION] = collection.options && collection.options[Constants.Admin.Collections.COLLECTION] ? collection.options : collection.mongoCollection.collectionName;
            query[Constants.Query.FIELDS] = requiredFields;
            var convertedJSON = document.convertToJSON();
            query[Constants.Query.DATA] = [convertedJSON];
            db.query(query, function (err, data) {
                if (err) {
                    callback(err);
                    return;
                }
                document.setRequiredFieldsValues(data.result[0]);
                callback(null, document);
            });
        } else {
            callback(null, document);
        }
    })
}

function getRequiredFields(collection, callback) {
    var finalFields = {};
    collection.get(Constants.Trigger.TRIGGERS, function (err, triggers) {
        if (err) {
            callback(err);
            return;
        }
        triggers = triggers || [];
        for (var i = 0; i < triggers.length; i++) {
            var trigger = triggers[i];
            var requiredFields = trigger[Constants.Trigger.Triggers.REQUIREDFIELDS];
            try {
                requiredFields = requiredFields && !Utils.isJSONObject(requiredFields) ? JSON.parse(requiredFields) : requiredFields;
            } catch (e) {
                throw new Error("Unable to parse requiredFields defined in trigger");
            }
            if (requiredFields) {
                for (var key in requiredFields) {
                    finalFields[key] = requiredFields[key];
                }
            }
        }
    });
    callback(null, finalFields);
}


