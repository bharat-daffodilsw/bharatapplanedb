/**
 * Created with IntelliJ IDEA.
 * User: daffodil
 * Date: 22/4/14
 * Time: 4:17 PM
 * To change this template use File | Settings | File Templates.
 */

var Utils = require("ApplaneCore/apputil/util.js");
var Constants = require("../Constants.js");


exports.populateRefferedFks = function (document, db, callback) {
    var type = document.type;
    if (!document.get(Constants.Admin.Fields.COLLECTION_ID) && type != "delete") {
        callback();
        return;
    }
    if (type == "insert") {
        populateData(document, db, callback);
    } else if (type == "update") {
        var updatedFields = document.getUpdatedFields();
        var updateRequired = false;
        if(updatedFields){
            for (var i = 0; i < updatedFields.length; i++) {
                var updatedField = updatedFields[i];
                if (updatedField == Constants.Admin.Fields.FIELD || updatedField == Constants.Admin.Fields.TYPE || updatedField == Constants.Admin.Fields.MULTIPLE || updatedField == Constants.Admin.Fields.COLLECTION || updatedField == Constants.Admin.Fields.SET || updatedField == Constants.Admin.Fields.PARENT_FIELD_ID) {
                    updateRequired = true;
                    break;
                }
            }
        }
        if (!updateRequired) {
            callback();
            return;
        }
        var oldRecord = document.oldRecord;
        removeReferredFk(oldRecord._id, db, function (err) {
            if (err) {
                callback(err);
                return;
            }
            populateData(document, db, callback);
        });
    } else if (type == "delete") {
        var oldRecord = document.oldRecord;
        removeReferredFk(oldRecord._id, db, callback);
    } else {
        callback();
    }
}

function populateData(document, db, callback) {
    if (document.get(Constants.Admin.Fields.TYPE) != Constants.Admin.Fields.Type.FK || !document.get(Constants.Admin.Fields.SET) || document.get(Constants.Admin.Fields.SET).length == 0) {
        callback();
        return;
    }
    var field = document.get(Constants.Admin.Fields.FIELD);
    var parentFieldId = document.get(Constants.Admin.Fields.PARENT_FIELD_ID);
    if (document.get(Constants.Admin.Fields.MULTIPLE)) {
        field = field + ".$";
    }
    populateReferredField(field, parentFieldId, db, function (err, referredField) {
        if (err) {
            callback(err);
            return;
        }
        var fieldsToSet = document.get(Constants.Admin.Fields.SET);
        var insert = {};
        insert[Constants.Admin.ReferredFks.COLLECTION_ID] = document.get(Constants.Admin.Fields.COLLECTION_ID);
        insert[Constants.Admin.ReferredFks.FIELD] = referredField;
        insert[Constants.Admin.ReferredFks.SET] = fieldsToSet;
        insert[Constants.Admin.ReferredFks.REFERRED_COLLECTION_ID] = {$query:{collection:document.get(Constants.Admin.Fields.COLLECTION)}};
        insert[Constants.Admin.ReferredFks.REFERRED_FIELD_ID] = {_id:document.get("_id")};
        var updates = {};
        updates[Constants.Update.COLLECTION] = Constants.Admin.REFERRED_FKS;
        updates[Constants.Update.INSERT] = [insert];
        db.batchUpdateById([updates], callback);
    })
}

function populateReferredField(field, parentFieldId, db, callback) {
    if (!parentFieldId) {
        callback(null, field);
        return;
    }
    var parentFieldQuery = {};
    parentFieldQuery[Constants.Query.COLLECTION] = Constants.Admin.FIELDS;
    parentFieldQuery[Constants.Query.FIELDS] = {field:1, parentfieldid:1, multiple:1};
    parentFieldQuery[Constants.Query.FILTER] = {_id:parentFieldId._id};
    db.query(parentFieldQuery, function (err, parentFieldRes) {
        if (err) {
            callback(err);
            return;
        }
        var parentField = parentFieldRes.result && parentFieldRes.result.length > 0 ? parentFieldRes.result[0] : undefined;
        if (!parentField) {
            throw new Error("Parent Field does not exists.");
        }
        field = parentField[Constants.Admin.Fields.FIELD] + (parentField[Constants.Admin.Fields.MULTIPLE] ? ".$." : ".") + field;
        populateReferredField(field, parentField[Constants.Admin.Fields.PARENT_FIELD_ID], db, callback);
    })
}

function removeReferredFk(referredFieldId, db, callback) {
    var deleteQuery = {};
    deleteQuery[Constants.Admin.ReferredFks.REFERRED_FIELD_ID + "._id"] = referredFieldId;
    var updates = {};
    updates[Constants.Update.COLLECTION] = Constants.Admin.REFERRED_FKS;
    updates[Constants.Update.DELETE] = [deleteQuery];
    db.batchUpdate([updates], callback);
}

exports.validateFk = function (document, db, callback) {
    var type = document.get(Constants.Admin.Fields.TYPE);
    var field = document.get(Constants.Admin.Fields.FIELD);
    var query = document.get(Constants.Admin.Fields.QUERY);
    if (query !== undefined) {
        try {
            var afterParsing = JSON.parse(query);
        } catch (e) {
            throw new Error("Query is not parsable [" + query + "] for field [" + field + "]");
        }
        if (!Utils.isJSONObject(afterParsing)) {
            throw new Error("Query is not parsable [" + query + "] for field [" + field + "]");
        }
        if (type === (Constants.Admin.Fields.Type.OBJECT)) {
            var collection1 = afterParsing[Constants.Query.COLLECTION];
            var multiple = document.get(Constants.Admin.Fields.MULTIPLE);
            if (multiple === true) {
                var fk = document.get(Constants.Admin.Fields.FK);
                if (fk !== undefined) {
                    validateCollection(db, collection1, function (err, data) {
                        if (err) {
                            callback(err);
                            return;
                        }
                        var dataLength = data.result.length;
                        if (dataLength === 1) {
                            var collectionId = data.result[0]._id;
                            getFields(db, collectionId, function (err, fields) {
                                if (err) {
                                    callback(err);
                                    return
                                }
                                var found = false;
                                withoutDottedFieldCheck(db, fk, collection1, fields.result);
                                callback();
                            })
                        }
                        else {
                            throw new Error("None or more than one result found for collection[" + collection1 + "]");
                        }
                    })
                } else {
                    throw new Error("field fk must be present for field [" + field + "]");
                }
            } else {
                throw new Error("Multiple must be true for field [" + field + "]");
            }
        } else {
            throw new Error("field [" + field + "] must be object");
        }
    } else if (type === Constants.Admin.Fields.Type.FK) {
        var collection = document.get(Constants.Admin.Fields.COLLECTION);
        if (collection !== undefined) {
            validateCollection(db, collection, function (err, data) {
                if (err) {
                    callback(err);
                    return;
                }
                var dataLength = data.result.length;
                if (dataLength === 1) {
                    var displayField = document.get("displayField");
                    var set = document.updates.set || [];
                    if (displayField !== undefined) {
                        if (set.indexOf(displayField) === -1) {
                            set.push(displayField);
                        }
                    }
                    var setLength = set.length;
                    if (setLength > 0) {
                        var collectionId = data.result[0]._id;
                        getFields(db, collectionId, function (err, fields) {
                            if (err) {
                                callback(err);
                                return
                            }
                            Utils.iterateArray(set, callback, function (eachSet, callback) {
                                var indexOfDot = eachSet.indexOf(".");
                                if (indexOfDot !== -1) {
                                    dottedFieldCheck(db, eachSet, collection, indexOfDot, fields.result, callback);
                                } else {
                                    withoutDottedFieldCheck(db, eachSet, collection, fields.result);
                                    callback();
                                }
                            });
                        });
                    } else {
                        callback();
                    }
                } else {
                    throw new Error("None or more than one result found for collection[" + collection + "]");
                }
            });
        } else {
            throw new Error("collection not found for field [" + field + "]");
        }
    } else if(document.get("ui")==="grid" || document.get("uiGrid")==="grid" || document.get("uiForm")==="grid"){
        if (type === (Constants.Admin.Fields.Type.OBJECT)) {
            var multiple = document.get(Constants.Admin.Fields.MULTIPLE);
            if (multiple === true) {
                callback();
            }else{
                throw new Error("Multiple must be true for field [" + field + "]");
            }
        }else{
            throw new Error("field [" + field + "] must be object");
        }
    }else {
        callback();
    }
}
function validateCollection(db, collection, callback) {
    var query = {};
    query[Constants.Query.COLLECTION] = "pl.collections";
    var filter = {};
    filter[Constants.Admin.Fields.COLLECTION] = collection;
    query[Constants.Query.FILTER] = filter;
    db.query(query, function (err, data) {
        if (err) {
            callback(err);
            return;
        }
        callback(null, data);
    });
}

function getFields(db, collectionId, callback) {
    var query = {};
    query[Constants.Query.COLLECTION] = "pl.fields";
    var filter = {};
    filter[Constants.Admin.Fields.COLLECTION_ID] = collectionId;
    filter[Constants.Admin.Fields.PARENT_FIELD_ID] = null;
    var recursion = {};
    recursion[Constants.Admin.Fields.PARENT_FIELD_ID] = "_id";
    recursion[Constants.Query.Recursion.ALIAS] = "fields";
    query[Constants.Query.FILTER] = filter;
    query[Constants.Query.RECURSION] = recursion;
    db.query(query, function (err, data) {
        if (err) {
            callback(err);
            return;
        }
        /* console.log("data>>>>>>>>>>>>>>>>>>>>>>>"+JSON.stringify(data.result));*/
        callback(null, data);
    });
}

function dottedFieldCheck(db, setField, collection, indexOfDot, fields, callback) {
    var firstPart = setField.substring(0, indexOfDot);
    var fieldResult = [];
    Utils.iterateArray(fields, function (err) {
        if (err) {
            callback(err);
            return;
        }
        if (fieldResult.length == 0) {
            throw new Error("field [" + setField + "] not found in collection [" + collection + "]");
        }
        callback();
    }, function (field, callback) {
        if (field.field == firstPart) {
            fieldResult.push(1);
            var fieldType = field.type;
            var secondPart = setField.substring(indexOfDot + 1);
            indexOfDot = secondPart.indexOf(".");
            if (fieldType == "object") {
                if (indexOfDot !== -1) {
                    dottedFieldCheck(db, secondPart, collection, indexOfDot, field.fields, callback);
                } else {
                    withoutDottedFieldCheck(db, secondPart, collection, field.fields);
                    callback();
                }
            } else if (fieldType === "fk") {
                var collection_fk = field.collection;
                validateCollection(db, collection_fk, function (err, data) {
                    if (err) {
                        callback(err);
                        return;
                    }
                    var collectionId = data.result[0]._id;
                    getFields(db, collectionId, function (err, collectionFields) {
                        if (err) {
                            callback(err);
                            return
                        }
                        if (indexOfDot !== -1) {
                            dottedFieldCheck(db, secondPart, collection_fk, indexOfDot, collectionFields.result, callback);
                        } else {
                            withoutDottedFieldCheck(db, secondPart, collection_fk, collectionFields.result);
                            callback();
                        }
                    });

                });
            } else {
                throw new Error("field [" + setField + "] not found in collection [" + collection + "]");
            }
        } else {
            callback();
        }
    })
}

function withoutDottedFieldCheck(db, setField, collection, fields) {
    var found = false;
    for (var j = 0; j < fields.length; j++) {
        if (fields[j].field == setField) {
//            console.log("field [" + setField + "] found in collection [" + collection + "]");
            found = true;
            break;
        }
    }
    if (found === false) {
        throw new Error("field [" + setField + "] not found in collection [" + collection + "]");
    }
}

