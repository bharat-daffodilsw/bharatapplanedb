/**
 * Created with IntelliJ IDEA.
 * User: daffodil
 * Date: 21/4/14
 * Time: 12:33 PM
 * To change this template use File | Settings | File Templates.
 */

var Utils = require("ApplaneCore/apputil/util.js");
var Constants = require("../Constants.js");

exports.postUpdate = function (doc, collection, db, callback) {
    try {
        collection.get(Constants.Admin.Collections.REFERRED_FKS, function (err, referredFks) {
            if (!referredFks) {
                callback();
                return;
            }
            var updatedFields = doc.getUpdatedFields();
            var updatedId = doc.get("_id");
            collection.get(Constants.Admin.Collections.COLLECTION, function (err, collectionName) {
                if (err) {
                    callback(err);
                    return;
                }
                getUpdatedFieldValues(updatedId, updatedFields, collectionName, db, function (err, updatedFieldValues) {
                    Utils.iterateArray(referredFks, callback, function (referredFk, callback) {
                        var referredFkSet = referredFk[Constants.Admin.ReferredFks.SET];
                        if (!referredFkSet || referredFkSet.length == 0) {
                            callback();
                            return;
                        }
                        var referredField = referredFk[Constants.Admin.ReferredFks.FIELD];
                        var valueToSet = {};
                        for (var i = 0; i < referredFkSet.length; i++) {
                            if (updatedFields.indexOf(referredFkSet[i]) != -1) {
                                valueToSet[referredField + "." + referredFkSet[i]] = Utils.resolveValue(updatedFieldValues, referredFkSet[i]);
                            }
                        }
                        if (!valueToSet || Object.keys(valueToSet) == 0) {
                            callback();
                            return;
                        }
                        var query = {};
                        query[referredField.replace(/\.\$/g, "") + "._id"] = updatedId;
                        var update = {};
                        update[Constants.Update.Update.QUERY] = query;
                        update[Constants.Update.Update.SET] = valueToSet;

                        var updateQuery = {};
                        updateQuery[Constants.Query.COLLECTION] = referredFk[Constants.Admin.ReferredFks.COLLECTION_ID][Constants.Admin.Collections.COLLECTION];
                        updateQuery[Constants.Update.UPDATE] = [update];
                        console.log("updates >>>>>>>>>>>>>>>>>>>>>>>++++++++++++++++++++++++++++++" + JSON.stringify(updateQuery));
                        db.batchUpdate([updateQuery], {w:1, multi:true}, callback);
                    });
                });
            });
        })
    } catch (e) {
        callback(e);
    }
}

function getUpdatedFieldValues(updatedId, updatedFields, collectionName, db, callback) {
    var queryTogetData = {};
    queryTogetData[Constants.Query.COLLECTION] = collectionName;
    var fields = {};
    for (var i = 0; i < updatedFields.length; i++) {
        fields[updatedFields[i]] = 1;
    }
    queryTogetData[Constants.Query.FIELDS] = fields;
    queryTogetData[Constants.Query.FILTER] = {_id:updatedId};
    db.query(queryTogetData, function (err, res) {
        if (err) {
            callback(err);
            return;
        }
        callback(null, res.result[0]);
    })
}


