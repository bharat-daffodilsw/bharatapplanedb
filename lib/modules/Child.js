/**
 * Created with IntelliJ IDEA.
 * User: daffodil
 * Date: 24/4/14
 * Time: 7:02 PM
 * To change this template use File | Settings | File Templates.
 *
 *
 *  Child Module Will remove child column data from Docuemnt and that child is reuired for Trigger Module
 *  So Child Module will execute after Trigger  Modulein Update.
 *  Also Child Module will execute in update like after DBRef/subQuery/Recursion/Group but before transaction module bcz we need to remove child data from saving.
 *  Child Module executes in Query before DBRef/SubQuery/Recusrion Module because we need to add subquery of child to get child data before execute Query.
 *  Child Module will add subquery in fields if child is defined in Query.
 *  Recursion will be added in query if futhter childs are defined in child.
 *
 *
 *
 */

var Utils = require("ApplaneCore/apputil/util.js");
var Constants = require("../Constants.js");

exports.preInsert = function (doc, collection, db, callback) {
    try {
        collection.get(Constants.Admin.Collections.FIELDS, function (err, collectionFields) {
            if (err) {
                callback(err);
                return;
            }
            removeChildDataFromRecord(doc, collectionFields, callback);
        })
    } catch (e) {
        callback(e);
    }

}

exports.preUpdate = function (doc, collection, db, callback) {
    this.preInsert(doc, collection, db, callback);
}

function removeChildDataFromRecord(doc, collectionFields, callback) {
    /**
     * It will remove Child Data whether it is in $set or in $unset from document if field with query is defined in fields.
     */

    Utils.iterateArray(collectionFields, function (err) {
        if (err) {
            callback(err);
            return;
        }
        callback();
    }, function (collectionField, callback) {
        var collectionFieldType = collectionField[Constants.Admin.Fields.TYPE];
        if (collectionFieldType == Constants.Admin.Fields.Type.OBJECT && collectionField[Constants.Admin.Fields.QUERY]) {
            var collectionFieldExp = collectionField[Constants.Admin.Fields.FIELD];
            if (!collectionField[Constants.Admin.Fields.FK]) {
                throw new Error("Fk is mandatory in field [" + JSON.stringify(collectionField) + "] if Query is defined in field");
            }
            if (!collectionField[Constants.Admin.Fields.MULTIPLE]) {
                throw new Error("Multiple Should be true if query is defined on Object type column [" + JSON.stringify(collectionField) + "]");
            }
            doc.set(collectionFieldExp, undefined);
            doc.unset(collectionFieldExp, undefined);
            callback();
        } else {
            callback();
        }

    })

}

exports.postInsert = function (doc, collection, db, callback) {
    try {
        collection.get(Constants.Admin.Collections.FIELDS, function (err, collectionFields) {
            if (err) {
                callback(err);
                return;
            }
            populateChildData(doc, collectionFields, collection, db, callback);
        })
    } catch (e) {
        callback(e);
    }
}

function populateChildData(doc, collectionFields, collection, db, callback) {
    var updateId = doc.get("_id");
    if (!updateId) {
        throw new Error("DocumentId not found in doc" + JSON.stringify(doc));
    }
    Utils.iterateArray(collectionFields, callback, function (collectionField, callback) {
        var collectionFieldType = collectionField[Constants.Admin.Fields.TYPE];
        if (collectionFieldType == Constants.Admin.Fields.Type.OBJECT && collectionField[Constants.Admin.Fields.QUERY]) {
            console.log(collectionField[Constants.Admin.Fields.QUERY]);
            var collectionFieldQuery = JSON.parse(collectionField[Constants.Admin.Fields.QUERY]);
            var alias = collectionField[Constants.Admin.Fields.FIELD];
            var fkColumn = collectionField[Constants.Admin.Fields.FK];
            db.collection(collectionFieldQuery[Constants.Query.COLLECTION], function (err, childCollection) {
                if (err) {
                    callback(err);
                    return;
                }
                var aliasValue = doc.updates ? (doc.updates[alias] || (doc.updates.$set && doc.updates.$set[alias]) || (doc.updates.$unset && doc.updates.$unset[alias] ? null : undefined)) : undefined;
                if (aliasValue === undefined) {
                    callback();
                    return;
                }
                var collectionToPut = childCollection.options && childCollection.options[Constants.Admin.Collections.COLLECTION] ? childCollection.options : childCollection[Constants.Admin.Collections.COLLECTION];
                if (Array.isArray(aliasValue)) {
                    /**
                     * In this Case,We need to override all values of Child.like Override Deliveries of orders.
                     * For this,Remove all records of child if exists.
                     */
                    removeChildRecords(collectionToPut, updateId, fkColumn, db, function (err) {
                        if (err) {
                            callback(err);
                            return;
                        }
                        populateParentColumnId(updateId, collectionField, aliasValue, childCollection, function (err) {
                            if (err) {
                                callback(err);
                                return;
                            }
                            var queryToInsertData = {};
                            queryToInsertData[Constants.Update.COLLECTION] = collectionToPut;
                            queryToInsertData[Constants.Update.INSERT] = aliasValue;
                            db.batchUpdateById([queryToInsertData], callback);
                        });
                    });
                } else if (Utils.isJSONObject(aliasValue)) {
                    aliasValue[Constants.Update.COLLECTION] = collectionToPut;
                    var valueToUpdate = undefined;
                    for (var key in aliasValue) {
                        if (key == Constants.Update.INSERT) {
                            valueToUpdate = aliasValue[key];
                            break;
                        }
                    }
                    populateParentColumnId(updateId, collectionField, valueToUpdate, childCollection, function (err) {
                        if (err) {
                            callback(err);
                            return;
                        }
                        db.batchUpdateById([aliasValue], callback);
                    });
                } else if (aliasValue == null) {
                    /**
                     * If child values is set to null i.e. unset deliveries in childs of orders.
                     */
                    removeChildRecords(collectionToPut, updateId, fkColumn, db, callback);
                } else {
                    throw new Error("Alias Value must be Object [" + aliasValue + "] in child [" + JSON.stringify(child));
                }
            })
        } else {
            callback();
        }
    })
}

function populateParentColumnId(updateId, collectionField, value, childCollection, callback) {
    /**
     * populate Fk column value in child data Also in innerChilds if further childs is defined in Child.
     */
    if (!value) {
        callback();
        return;
    }
    childCollection.get(Constants.Admin.Collections.FIELDS, function (err, childCollectionFields) {
        if (err) {
            callback(err);
            return;
        }
        var innerChildFields = [];
        if (childCollectionFields) {
            for (var i = 0; i < childCollectionFields.length; i++) {
                if (childCollectionFields[i][Constants.Admin.Fields.QUERY]) {
                    innerChildFields.push(childCollectionFields[i]);
                }
            }
        }
        addParentColumnId(value, innerChildFields, collectionField[Constants.Admin.Fields.FK], updateId);
        callback();
    })

}

function addParentColumnId(value, innerFields, childFk, updateId) {
    if (value) {
        if (Array.isArray(value)) {
            for (var i = 0; i < value.length; i++) {
                updateValue(innerFields, value[i], childFk, updateId);
            }
        } else {
            updateValue(innerFields, value, childFk, updateId);
        }
    }
}

function updateValue(innerFields, value, childFk, updateId) {
    value[childFk] = {_id: updateId};
    var innerFieldsLength = innerFields ? innerFields.length : 0;
    for (var j = 0; j < innerFieldsLength; j++) {
        var alias = innerFields[j][Constants.Admin.Fields.FIELD];
        if (value[alias]) {
            addParentColumnId(value[alias], innerFields, childFk, updateId);
        }
    }
}

function removeChildRecords(collectionToPut, updatedId, fkColumn, db, callback) {
    var deleteQuery = {};
    deleteQuery[Constants.Query.COLLECTION] = collectionToPut;
    deleteQuery[Constants.Query.FIELDS] = {_id: 1};
    var filter = {};
    filter[fkColumn] = updatedId;
    deleteQuery[Constants.Query.FILTER] = filter;
    db.query(deleteQuery, function (err, valuesToDelete) {
        if (err) {
            callback(err);
            return;
        }
        var queryToRemoveData = {};
        queryToRemoveData[Constants.Update.COLLECTION] = collectionToPut;
        queryToRemoveData[Constants.Update.DELETE] = valuesToDelete.result;
        db.batchUpdateById([queryToRemoveData], callback);
    })
}

exports.postUpdate = function (doc, collection, db, callback) {
    this.postInsert(doc, collection, db, callback);
}

exports.doQuery = function (query, collection, db, callback) {
    try {
//        console.log("Query >>>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(query));
        collection.get(Constants.Admin.Collections.FIELDS, function (err, collectionFields) {
            if (err) {
                callback(err);
                return;
            }
            var queryFields = query[Constants.Query.FIELDS];
            var firstValue = undefined;
            for (var key in queryFields) {
                if (queryFields[key] == 0 || queryFields[key] == 1) {
                    if (firstValue) {
                        if (firstValue !== queryFields[key]) {
                            throw new Error("Can not Mix fields of inclusion and exclusion");
                        }
                    } else {
                        firstValue = queryFields[key];
                    }
                }
            }
            var newQueryFields = {};
            Utils.iterateArray(collectionFields, function (err) {
                if (err) {
                    callback(err);
                    return;
                }
                if (Object.keys(newQueryFields).length > 0) {
                    query[Constants.Query.FIELDS] = query[Constants.Query.FIELDS] || {};
                    for (var exp in newQueryFields) {
                        query[Constants.Query.FIELDS][exp] = newQueryFields[exp];
                    }
                }
                callback();
            }, function (collectionField, callback) {
                var collectionFieldType = collectionField[Constants.Admin.Fields.TYPE];
                if (collectionFieldType == Constants.Admin.Fields.Type.OBJECT && collectionField[Constants.Admin.Fields.QUERY]) {
                    populateChildFields(collectionField, queryFields, newQueryFields, firstValue);
                }
                callback();
            })
        })
    } catch (e) {
        callback(e);
    }
}

function populateChildFields(collectionField, queryFields, newQueryFields, firstValue) {
    var collectionFieldExp = collectionField[Constants.Admin.Fields.FIELD];
    var innerQuery = JSON.parse(collectionField[Constants.Admin.Fields.QUERY]);
    var fkColumn = collectionField[Constants.Admin.Fields.FK];
    if (!queryFields || Object.keys(queryFields).length == 0) {
        addSubQuery(newQueryFields, collectionFieldExp, innerQuery, fkColumn);
    } else {
        if (queryFields[collectionFieldExp] !== undefined) {
            var fieldValue = queryFields[collectionFieldExp];
            if (fieldValue == 1) {
                addSubQuery(newQueryFields, collectionFieldExp, innerQuery, fkColumn);
//            } else if (fieldValue == 0) {
//                delete queryFields[collectionFieldExp];
            }
        } else {
            var aliases = [];
            for (var exp in queryFields) {
                var value = queryFields[exp];
                if (typeof value == "string" && value.indexOf("$") == 0 && collectionFieldExp === value.substring(1)) {
                    aliases.push(exp);
                }
            }
            if (aliases.length > 0) {
                for (var i = 0; i < aliases.length; i++) {
                    addSubQuery(newQueryFields, aliases[i], innerQuery, fkColumn);

                }
            } else if (firstValue === 0) {
                addSubQuery(newQueryFields, collectionFieldExp, innerQuery, fkColumn);
            }
        }
    }
}

function addSubQuery(newQueryFields, alias, innerQuery, fk) {
    /**
     * It will add subquery in fields and also need to create fields if no field is defined.
     */
    var subQuery = {};
    subQuery[Constants.Query.Fields.TYPE] = "n-rows";
    subQuery[Constants.Query.Fields.QUERY] = innerQuery;
    subQuery[Constants.Query.Fields.FK] = fk
    subQuery[Constants.Query.Fields.PARENT] = "_id";
    newQueryFields[alias] = subQuery;
}

