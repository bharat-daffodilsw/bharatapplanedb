/**
 *  If Merge is not defined in collection or saving in AdminDb then do nothing.
 *
 *  If Override is defined in collection corresponds to merge,then just check if record exist in currentDB.If record exists then do nothing otherwise fetch all records from AdminDb and insert
 *  records here. And further operation is processed.
 *
 * In case Of Insert,If Union in collection,then just add __type__=insert in document so that we can identifiy records that are newly inserted in localDb.Also we can use __type__=insert as filter in query for merging data.
 *
 * In Case of Delete,We dont need to delete data from AdminDb if Admin Record is deleted,we just need to insert record with __type__=delete so that we can remove data on basis of type while merging.Also the current operation will be cancelled.
 * If there is __type__=insert in operation which is deleted then no need to cancel/insert new operation with __type__=delete.We have to delete the record bcz that record was inserted here and not exist in AdminDb. i.e we do nothing in this case.
 *
 * Also we dont need to execute any module in all updation in record,just need to execute Transaction module so that if error occurred ,the updation will be rollback.
 *
 * In Case of update operation in union, firstly we set all unset values to set with null.
 *         then check the record with current documentId exist in localDB or not.
 *         If record not exist in localDB,then insert record with _id as in document in local db.
 *         Update value for Array type fields and fields which are defined override is collection
 *              IN case of Field Overide in collection,we need to check there is value already saved in that field in local db,then do nothing otherwise fetch oldValue from document and set that value in reocrd.
 *              In case of Array,
 *                     insert -->> add __type__=insert in record reuired for merging
 *                     delete-->>  insert new record in array with __type__=delete  and delete that record from array.
 *                     update ->>  check value on basis of _id,either it is exist on oldrecord in local db or not.If exist then do nothing otherwise insert new record in array with that _id.
 *                                 Also unset values in not deleted.
 *              All records which are not exist here and  exist in adminDb,and update is required on that record,are also inserted here with same _id.
 *              Now perform required operation.
 *
 *
 *
 */


var Constants = require("../Constants.js");
var Utils = require("ApplaneCore/apputil/util.js");
var Config = require("../../Config.js");

exports.preInsert = function (document, collection, db, callback) {
    collection.get(Constants.Admin.Collections.MERGE, function (err, mergeValue) {
        if (err || !mergeValue || Object.keys(mergeValue).length == 0 || db.isAdminDB()) {
            callback(err);
            return;
        }
        var mergeInCollection = mergeValue.collection;
        if (mergeInCollection === "override") {
            mergeValueForOverride(db, collection, callback);
        } else {
            document.set("__type__", "insert");
            callback();
        }
    })

}

exports.preUpdate = function (document, collection, db, callback) {
    collection.get(Constants.Admin.Collections.MERGE, function (err, mergeValue) {
        if (err || !mergeValue || Object.keys(mergeValue).length == 0 || db.isAdminDB()) {
            callback(err);
            return;
        }
        var type = document.get("__type__");
        if (type == "insert") {
            callback();
            return;
        }
        var mergeInCollection = mergeValue.collection;
        if (mergeInCollection === "override") {
            mergeValueForOverride(db, collection, callback);
        } else {
            var updates = document.updates;
            if (updates.$inc) {
                callback(new Error("$inc is not allowed if Merge in defined in collection [" + collection.mongoCollection.collectionName));
                return;
            }
            var updateId = document.get("_id");
            updateUnsetValues(updates);
            collection.find({_id: updateId}, {}).toArray(function (err, result) {
                if (err) {
                    callback(err);
                    return;
                }
                var oldRecord = result && result.length > 0 ? result[0] : undefined;
                var mergeFields = mergeValue.fields;
                var valuesToSet = updates.$set;
                var newInsert = oldRecord ? {} : {_id: updateId};
                populateNewInserts(document, oldRecord, valuesToSet, mergeFields, newInsert);
                if (Object.keys(newInsert).length > 0) {
                    var update = {};
                    update[Constants.Update.COLLECTION] = collection.mongoCollection.collectionName;
                    if (oldRecord) {
                        update[Constants.Update.UPDATE] = [
                            {_id: oldRecord._id, $set: newInsert, $oldData: {_id: oldRecord._id}}
                        ];
                    } else {
                        update[Constants.Update.INSERT] = [newInsert];
                    }
                    update[Constants.Query.MODULES] = {TransactionModule: 1};
                    db.batchUpdateById([update], callback);
                } else {
                    callback();
                }
            })
        }
    })
}

function populateNewInserts(document, oldRecord, valuesToSet, mergeFields, newInsert) {
    if (valuesToSet && Object.keys(valuesToSet).length > 0) {
        for (var exp in valuesToSet) {
            var valueToSet = valuesToSet[exp];
            var mergeFieldValue = mergeFields ? mergeFields[exp] : undefined;
            if (mergeFieldValue && mergeFieldValue === "override") {
                if (!oldRecord || oldRecord[exp] === undefined) {
                    var oldValue = document.oldRecord[exp];
                    if (oldValue) {
                        if (Array.isArray(oldValue)) {
                            newInsert[exp] = {$insert: oldValue}
                        } else if (Utils.isJSONObject(oldValue)) {
                            newInsert[exp] = oldValue;
                        }
                    }
                }
            } else {
                if (Array.isArray(valueToSet)) {
                    //TODO   may be no need to do work here .
                } else if (Utils.isJSONObject(valueToSet) && (valueToSet.$update || valueToSet.$delete || valuesToSet.$insert)) {
                    if (valueToSet.$insert) {
                        for (var i = 0; i < valueToSet.$insert.length; i++) {
                            valueToSet.$insert[i].__type__ = "insert";
                        }
                    }
                    if (valueToSet.$update) {
                        addValueIfNotExist(oldRecord, exp, newInsert, valueToSet.$update, false);
                    }
                    if (valueToSet.$delete) {
                        addValueIfNotExist(oldRecord, exp, newInsert, valueToSet.$delete, true);
                    }
                }
            }
        }
    }
}

function addValueIfNotExist(oldRecord, exp, newInsert, valuesToUpdate, isDelete) {
    var oldValue = oldRecord ? oldRecord[exp] : undefined;
    for (var i = 0; i < valuesToUpdate.length; i++) {
        var valueToUpdate = valuesToUpdate[i];
        var index = Utils.isExists(oldValue, valueToUpdate, "_id");
//        if (!isDelete && (index === undefined || oldValue[index].__type__ !== "insert")) {
        if (!isDelete) {
//            TODO dont need to unset to null if insert in array is there.
            updateUnsetValues(valueToUpdate);
        }
        if (index === undefined) {
            newInsert[exp] = newInsert[exp] || {};
            newInsert[exp].$insert = newInsert[exp].$insert || [];
            var valueToPush = {_id: valueToUpdate._id};
            if (isDelete) {
                valueToPush["__type__"] = "delete";
                valuesToUpdate.splice(i, 1);
                i = i - 1;
            }
            newInsert[exp].$insert.push(valueToPush);
        } else {
            if (isDelete && oldValue[index] && oldValue[index].__type__ !== "insert") {
                newInsert[exp] = newInsert[exp] || {};
                newInsert[exp].$update = newInsert[exp].$update || [];
                var valueToPush = {_id: valueToUpdate._id};
                valueToPush.$set = {__type__: "delete"};
                valuesToUpdate.splice(i, 1);
                i = i - 1;
                newInsert[exp].$update.push(valueToPush);
            }
        }
    }
}


function updateUnsetValues(updates) {
    if (updates.$unset && Object.keys(updates.$unset).length > 0) {
        var valuesToUnset = updates.$unset;
        updates.$set = updates.$set || {};
        for (var exp in valuesToUnset) {
            updates.$set[exp] = null;
        }
        delete updates.$unset;
    }
}

exports.preDelete = function (document, collection, db, callback) {
    collection.get(Constants.Admin.Collections.MERGE, function (err, mergeValue) {
        if (err || !mergeValue || Object.keys(mergeValue).length == 0 || db.isAdminDB()) {
            callback(err);
            return;
        }
        var mergeInCollection = mergeValue.collection;
        if (mergeInCollection === "override") {
            mergeValueForOverride(db, collection, callback);
        } else {
            var type = document.get("__type__");
            if (type && type == "insert") {
                callback();
                return;
            }
            var updateId = document.get("_id");
            db.db.collection(collection.mongoCollection.collectionName).find({_id: updateId}).toArray(function (err, result) {
                if (err) {
                    callback(err);
                    return;
                }
                var update = {};
                update[Constants.Update.COLLECTION] = collection.mongoCollection.collectionName;
                update[Constants.Query.MODULES] = {TransactionModule: 1};
                if (result.length == 0) {
                    update[Constants.Update.INSERT] = [
                        {_id: updateId, __type__: "delete"}
                    ];
                } else {
                    update[Constants.Update.UPDATE] = [
                        {_id: updateId, $set: { __type__: "delete"}}
                    ];
                }
                db.batchUpdateById([update], function (err, res) {
                    if (err) {
                        callback(err);
                        return;
                    }
                    document.setCancelUpdates();
                    callback();
                })
            })
        }
    })
}

function mergeValueForOverride(db, collection, callback) {
    collection.count({}, {}, function (err, count) {
        if (count > 0) {
            callback();
            return;
        }
        db.adminDB(function (err, adminDb) {
            if (err) {
                callback(err);
                return;
            }
            adminDb.db.collection(collection.mongoCollection.collectionName).find().toArray(function (err, result) {
                if (err) {
                    callback(err);
                    return;
                }
                var update = {};
                update[Constants.Update.COLLECTION] = collection.mongoCollection.collectionName;
                update[Constants.Update.INSERT] = result;
                update[Constants.Query.MODULES] = {TransactionModule: 1};
                db.batchUpdateById([update], callback);
            });
        })
    });
}

