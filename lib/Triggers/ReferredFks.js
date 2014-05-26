/**
 * Created with IntelliJ IDEA.
 * User: daffodil
 * Date: 23/4/14
 * Time: 5:06 PM
 * To change this template use File | Settings | File Templates.
 */

var Utils = require("ApplaneCore/apputil/util.js");
var Constants = require("../Constants.js");

exports.populateRefferedFks = function (document, db, callback) {
    var setValues = document.get(Constants.Admin.ReferredFks.SET);
    var valuesToSet = {};
    var referredCollectionId = document.get(Constants.Admin.ReferredFks.REFERRED_COLLECTION_ID);
    getReferredCollectionFields(referredCollectionId, db, function (err, referredCollectionFields) {
        Utils.iterateArray(setValues, function (err) {
            if (err) {
                callback(err);
                return;
            }
            if (Object.keys(valuesToSet).length == 0) {
                callback();
                return;
            }
            insertReferredData(valuesToSet, document, db, callback);
        }, function (setValue, callback) {
            if (setValue.indexOf(".") == -1) {
                callback();
                return;
            }
            var found = false;
            for (var key in valuesToSet) {
                if (setValue.indexOf(key + ".") == 0) {
                    var nextValue = setValue.substring(key.length + 1);
                    valuesToSet[key].value.push(nextValue);
                    found = true;
                    break;
                }
            }
            if (found) {
                callback();
                return;
            }
            var result = populate(setValue, document.get(Constants.Admin.ReferredFks.FIELD), referredCollectionFields, undefined);
            if (result) {
                valuesToSet[setValue.substring(0, (setValue.length - result.value[0].length - 1))] = result;
            }
            callback();
        })
    })
}

function getReferredCollectionFields(collectionId, db, callback) {
    var query = {};
    query[Constants.Query.COLLECTION] = Constants.Admin.FIELDS;
    query[Constants.Query.FILTER] = {"collectionid._id":collectionId._id};
    db.query(query, function (err, res) {
        callback(null, res.result);
    })

}

function insertReferredData(valuesToSet, document, db, callback) {
    var referredFksData = [];
    for (var key in valuesToSet) {
        var value = valuesToSet[key];
        var referredFkData = {};
        referredFkData[Constants.Admin.ReferredFks.COLLECTION_ID] = document.get(Constants.Admin.ReferredFks.COLLECTION_ID);
        referredFkData[Constants.Admin.ReferredFks.FIELD] = value.field;
        referredFkData[Constants.Admin.ReferredFks.SET] = value.value;
        referredFkData[Constants.Admin.ReferredFks.REFERRED_COLLECTION_ID] = {$query:{collection:typeof value.collection == "string" ? value.collection : value.collection.collection}};
        referredFkData[Constants.Admin.ReferredFks.REFERRED_FIELD_ID] = document.get(Constants.Admin.ReferredFks.REFERRED_FIELD_ID);
        referredFksData.push(referredFkData);
    }
    var updates = {};
    updates[Constants.Update.COLLECTION] = Constants.Admin.REFERRED_FKS;
    updates[Constants.Update.INSERT] = referredFksData;
    db.batchUpdateById([updates], callback);
}

function populate(setValue, field, referredCollectionFields, pFieldId) {
    var indexOf = setValue.indexOf(".");
    if (indexOf > 0) {
        var firstPart = setValue.substr(0, indexOf);
        var nextPart = setValue.substr(indexOf + 1);
        for (var i = 0; i < referredCollectionFields.length; i++) {
            var referredCollectionField = referredCollectionFields[i];
            if (referredCollectionField[Constants.Admin.Fields.FIELD] == firstPart && isMatched(referredCollectionField, pFieldId)) {
                var type = referredCollectionField[Constants.Admin.Fields.TYPE];
                var multiple = referredCollectionField[Constants.Admin.Fields.MULTIPLE];
                if (type == Constants.Admin.Fields.Type.FK) {
                    field = field + "." + firstPart + (multiple ? ".$" : "");
                    return {field:field, value:[nextPart], collection:referredCollectionField[Constants.Admin.Fields.COLLECTION]};
                } else if (type == Constants.Admin.Fields.Type.OBJECT) {
                    field = field + "." + firstPart + (multiple ? ".$" : "");
                    return populate(nextPart, field, referredCollectionFields, referredCollectionField._id);
                }
            }
        }
    }
}

function isMatched(field, pFieldId) {
    if ((!pFieldId && !field[Constants.Admin.Fields.PARENT_FIELD_ID]) || (pFieldId && field[Constants.Admin.Fields.PARENT_FIELD_ID] && field[Constants.Admin.Fields.PARENT_FIELD_ID]._id == pFieldId)) {
        return true;
    }
}
