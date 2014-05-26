var Utils = require("ApplaneCore/apputil/util.js");
var Constants = require("../Constants.js");

exports.doQuery = function (query, collection, db, callback) {
    try {
        ensureFields(query, db, function (err) {
            if (err) {
                callback(err);
                return;
            }
            collection.get(Constants.Admin.Collections.FIELDS, function (err, collectionFields) {
                var fkColumns = {};
                populateFKColumns(fkColumns, collectionFields);
                if (query[Constants.Query.SORT]) {
                    for (var exp in query[Constants.Query.SORT]) {
                        ensureSorts(fkColumns, query, exp);
                    }
                }

                if (Object.keys(fkColumns).length == 0) {
                    callback();
                    return;
                }

                if (query[Constants.Query.FIELDS]) {
                    var newQueryFields = {};
                    for (var exp in query[Constants.Query.FIELDS]) {
                        var fieldValue = query[Constants.Query.FIELDS][exp];
                        populateSubQueryInField(newQueryFields, fkColumns, fieldValue, exp, exp);
                    }
                    query[Constants.Query.FIELDS] = newQueryFields;
                }
                if (query[Constants.Query.FILTER]) {
                    query[Constants.Query.FILTER] = populateFilter(query[Constants.Query.FILTER], fkColumns);
                }
                callback();
            })

        });
    } catch (e) {
        callback(e);
    }
}

function populateFKColumns(fkColumns, collectionFields, pExp) {
    if (collectionFields && collectionFields.length > 0) {
        for (var i = 0; i < collectionFields.length; i++) {
            var collectionField = collectionFields[i];
            var collectionFieldType = collectionField[Constants.Admin.Fields.TYPE];
            var exp = collectionField[Constants.Admin.Fields.FIELD];
            if (collectionFieldType == Constants.Admin.Fields.Type.FK) {
                fkColumns[pExp ? pExp + "." + exp : exp] = collectionField;
            } else if (collectionFieldType == Constants.Admin.Fields.Type.OBJECT) {
                populateFKColumns(fkColumns, collectionField[Constants.Admin.Collections.FIELDS], pExp ? pExp + "." + exp : exp);
            }
        }
    }
}

function populateFilter(filter, fkcolumns) {
    var newQueryFilter = {};
    for (var exp in  filter) {
        var filterValue = filter[exp];
        if (exp == Constants.Query.Filter.OR || exp == Constants.Query.Filter.AND) {
            if (!Array.isArray(filterValue)) {
                throw new Error("Filter value must be an Array in $or/$and Filter.");
            }
            var newOrFilterArray = [];
            for (var i = 0; i < filterValue.length; i++) {
                var newOrFilter = populateFilter(filterValue[i], fkcolumns);
                newOrFilterArray.push(newOrFilter);
            }
            newQueryFilter[exp] = newOrFilterArray;
        } else {
            if (fkcolumns[exp]) {
                if (Utils.isJSONObject(filterValue) && filterValue._id) {
                    filterValue = filterValue._id;
                }
                exp = exp + "._id";
            }
            populateSubQueryInFilter(newQueryFilter, fkcolumns, filterValue, exp, exp);
        }
    }
    return newQueryFilter;
}

function ensureFields(query, db, callback) {
    if (!query[Constants.Query.FIELDS]) {
        callback();
        return;
    }
    try {
        var fields = query[Constants.Query.FIELDS];
        var fieldKeys = Object.keys(fields);
        Utils.iterateArray(fieldKeys, callback, function (fieldkey, callback) {
            var fieldValue = fields[fieldkey];
            var indexOf = fieldkey.indexOf(".");
            if (indexOf > 0) {
                var firstPart = fieldkey.substring(0, indexOf);
                var secondPart = fieldkey.substring(indexOf + 1);
                if (fields[firstPart]) {
                    if (secondPart != "_id") {
                        throw new Error("Dotted Fields can not be defined if you want to get whole data.");
                    } else {
                        delete fields[fieldkey];
                    }
                }
            }
            if (Utils.isJSONObject(fieldValue) && fieldValue[Constants.Query.Fields.QUERY] && fieldValue[Constants.Query.Fields.FK]) {
                db.collection(fieldValue[Constants.Query.Fields.QUERY][Constants.Query.COLLECTION], function (err, collection) {
                    if (err) {
                        callback(err);
                        return;
                    }
                    try {
                        collection.get(Constants.Admin.Collections.FIELDS, function (err, collectionFields) {
                            if (err) {
                                callback(err);
                                return;
                            }
                            try {
                                var fkColumns = {};
                                populateFKColumns(fkColumns, collectionFields);
                                if (fkColumns[fieldValue[Constants.Query.Fields.FK]]) {
                                    fieldValue[Constants.Query.Fields.FK] = fieldValue[Constants.Query.Fields.FK] + "._id";
                                }
                                callback();
                            } catch (e) {
                                callback(e);
                            }
                        })
                    } catch (e) {
                        callback(e);
                    }

                })
            } else {
                callback();
            }
        })
    } catch (e) {
        callback(e);
    }
}

function ensureSorts(fkColumns, query, exp, pExp) {
    var indexOf = exp.indexOf(".");
    if (indexOf > 0) {
        var firstPart = exp.substring(0, indexOf);
        var secondPart = exp.substring(indexOf + 1);
        pExp = pExp ? pExp + "." + firstPart : firstPart;
        if (fkColumns[firstPart]) {
            var fkColumnDef = fkColumns[firstPart];
            if (!fkColumnDef[Constants.Admin.Fields.SET] || fkColumnDef[Constants.Admin.Fields.SET].indexOf(secondPart) == -1) {
                throw new Error("Sort on dotted column defined in another table not supported.");
            }
        } else {
            ensureSorts(fkColumns, query, secondPart, pExp);
        }
    }
}

function populateSubQueryInField(newQueryFields, fkcolumns, fieldValue, mainExp, exp, pExp) {
    var indexOf = exp.indexOf(".");
    if (indexOf > 0) {
        var firstPart = exp.substring(0, indexOf);
        var secondPart = exp.substring(indexOf + 1);
        pExp = pExp ? pExp + "." + firstPart : firstPart;
        if (fkcolumns[pExp]) {
            if (newQueryFields[pExp] && Utils.isJSONObject(newQueryFields[pExp]) && newQueryFields[pExp][Constants.Query.Fields.QUERY]) {
                newQueryFields[pExp][Constants.Query.Fields.QUERY][Constants.Query.FIELDS] = newQueryFields[pExp][Constants.Query.Fields.QUERY][Constants.Query.FIELDS] || {};
                newQueryFields[pExp][Constants.Query.Fields.QUERY][Constants.Query.FIELDS] [secondPart] = fieldValue;
            } else {
                var fkColumnDef = fkcolumns[pExp];
                if (secondPart != "_id" && (!fkColumnDef[Constants.Admin.Fields.SET] || fkColumnDef[Constants.Admin.Fields.SET].indexOf(secondPart) == -1)) {
                    var fkQueryFields = {};
                    for (var newFieldExp in newQueryFields) {
                        if (newFieldExp.indexOf(pExp + ".") == 0) {
                            fkQueryFields[newFieldExp.substring(pExp.length + 1)] = newQueryFields[newFieldExp];
                            delete newQueryFields[newFieldExp];
                        }
                    }
                    fkQueryFields[secondPart] = fieldValue;
                    var innerField = {};
                    innerField[Constants.Query.Fields.TYPE] = fkColumnDef[Constants.Admin.Fields.MULTIPLE] ? "n-rows" : "scalar";
                    var innerFieldQuery = {};
                    innerFieldQuery[Constants.Query.COLLECTION] = fkColumnDef[Constants.Admin.Collections.COLLECTION];
                    innerFieldQuery[Constants.Query.FIELDS] = fkQueryFields;
                    innerField[Constants.Query.Fields.QUERY] = innerFieldQuery;
                    innerField[Constants.Query.Fields.FK] = "_id";
                    innerField[Constants.Query.Fields.PARENT] = firstPart + "._id";
                    newQueryFields[pExp] = innerField;
                } else {
                    newQueryFields[mainExp] = fieldValue;
                }
            }
        } else {
            populateSubQueryInField(newQueryFields, fkcolumns, fieldValue, mainExp, secondPart, pExp);
        }
    } else {
        newQueryFields[mainExp] = fieldValue;
    }

}

function populateSubQueryInFilter(newQueryFilter, fkcolumns, filterValue, mainExp, exp, pExp) {
    var indexOf = exp.indexOf(".");
    if (indexOf > 0) {
        var firstPart = exp.substring(0, indexOf);
        var secondPart = exp.substring(indexOf + 1);
        pExp = pExp ? pExp + "." + firstPart : firstPart;
        if (fkcolumns[pExp]) {
            if (newQueryFilter[pExp + "._id"] && Utils.isJSONObject(newQueryFilter[pExp + "._id"]) && newQueryFilter[pExp + "._id"][Constants.Query.Fields.QUERY]) {
                newQueryFilter[pExp + "._id"][Constants.Query.Fields.QUERY][Constants.Query.FILTER] = newQueryFilter[pExp + "._id"][Constants.Query.Fields.QUERY][Constants.Query.FILTER] || {};
                newQueryFilter[pExp + "._id"][Constants.Query.Fields.QUERY][Constants.Query.FILTER][secondPart] = filterValue;
            } else {
                var fkColumnDef = fkcolumns[pExp];
                if (secondPart != "_id" && (!fkColumnDef[Constants.Admin.Fields.SET] || fkColumnDef[Constants.Admin.Fields.SET].indexOf(secondPart) == -1)) {
                    var fkQueryFilter = {};
                    for (var newFieldExp in newQueryFilter) {
                        if (newFieldExp.indexOf(pExp + ".") == 0) {
                            fkQueryFilter[newFieldExp.substring(pExp.length + 1)] = newQueryFilter[newFieldExp];
                            delete newQueryFilter[newFieldExp];
                        }
                    }
                    fkQueryFilter[secondPart] = filterValue;
                    var innerField = {};
                    var innerFieldQuery = {};
                    innerFieldQuery[Constants.Query.COLLECTION] = fkColumnDef[Constants.Admin.Collections.COLLECTION];
                    innerFieldQuery[Constants.Query.FIELDS] = {_id:1};
                    innerFieldQuery[Constants.Query.FILTER] = fkQueryFilter;
                    innerField[Constants.Query.Fields.QUERY] = innerFieldQuery;
                    newQueryFilter[pExp + "._id"] = innerField;
                } else {
                    newQueryFilter[mainExp] = filterValue;
                }
            }
        } else {
            populateSubQueryInFilter(newQueryFilter, fkcolumns, filterValue, mainExp, secondPart, pExp);
        }
    } else {
        newQueryFilter[mainExp] = filterValue;
    }
}

exports.doResult = function (query, result, collection, db, callback) {
    callback();
}


exports.preInsert = function (doc, collection, db, callback) {
    try {
        collection.get(Constants.Admin.Collections.FIELDS, function (err, collectionFields) {
//            console.log("collectionFields>>>>>>>>>>>>>>" + JSON.stringify(collectionFields));
            populateFKColumnValue(doc, collectionFields, db, callback);
        })
    } catch (e) {
        callback(e);
    }
}

exports.preUpdate = function (doc, collection, db, callback) {
    try {
        collection.get(Constants.Admin.Collections.FIELDS, function (err, collectionFields) {
//            console.log("collectionFields>>>>>>>>>>>>>>" + JSON.stringify(collectionFields));
            populateFKColumnValue(doc, collectionFields, db, callback);
        })
    } catch (e) {
        callback(e);
    }
}

exports.postUpdate = function (doc, collection, db, callback) {
    callback();
}

function populateFKColumnValue(doc, collectionFields, db, callback) {
    Utils.iterateArray(collectionFields, callback, function (collectionField, callback) {
        try {
            var collectionFieldExp = collectionField[Constants.Admin.Fields.FIELD];
            var collectionFieldType = collectionField[Constants.Admin.Fields.TYPE];
            if (!collectionFieldType) {
                throw new Error("type/field is mandatory in field [" + JSON.stringify(collectionField) + "]");
            }
            if (!collectionFieldExp) {
                throw new Error("Field is not defined in field [" + JSON.stringify(collectionField) + "]");
            }
            if (collectionFieldType == Constants.Admin.Fields.Type.FK) {
                if (!collectionField[Constants.Admin.Fields.COLLECTION]) {
                    throw new Error("collection is mandatory in field [" + JSON.stringify(collectionField) + "]");
                }
                var fieldDocs = doc.getDocuments(collectionFieldExp, ["insert", "update"]);
                if (!fieldDocs) {
                    callback();
                    return;
                }
                if (!Array.isArray(fieldDocs)) {
                    fieldDocs = [fieldDocs];
                }
                Utils.iterateArray(fieldDocs, callback, function (fieldDoc, callback) {
                    if (!fieldDoc.updates) {
                        callback();
                        return;
                    }
                    if (!collectionField[Constants.Admin.Fields.UPSERT]) {
                        if (fieldDoc.updates && fieldDoc.updates.$set) {
                            throw new Error("Fk Column value can not be updated if upsert is false in column [" + JSON.stringify(collectionField) + "]");
                        }
                    }
                    getQueryResult(collectionField, fieldDoc, db, function (err, data) {
                        if (err) {
                            callback(err);
                            return;
                        }
                        populateFieldDoc(fieldDoc, data);
                        callback();
                    })
                })
            } else if (collectionFieldType == Constants.Admin.Fields.Type.OBJECT && collectionField[Constants.Admin.Collections.FIELDS]) {
                var innerFields = collectionField[Constants.Admin.Collections.FIELDS];
                var fieldDocs = doc.getDocuments(collectionFieldExp, ["insert", "update"]);
                if (!fieldDocs) {
                    callback();
                    return;
                }
                if (Array.isArray(fieldDocs)) {
                    Utils.iterateArray(fieldDocs, callback, function (fieldDoc, callback) {
                        populateFKColumnValue(fieldDoc, innerFields, db, callback);
                    })
                } else {
                    populateFKColumnValue(fieldDocs, innerFields, db, callback);
                }
            } else {
                callback();
            }
        } catch (e) {
            callback(e);
        }
    })
}

function populateFieldDoc(fieldDoc, data) {
    var fieldkeys = Object.keys(fieldDoc.updates);
    for (var i = 0; i < fieldkeys.length; i++) {
        delete fieldDoc.updates[fieldkeys[i]];
    }
    for (var exp in data) {
        fieldDoc.set(exp, data[exp]);
    }
}

function getQueryResult(collectionField, fieldDoc, db, callback) {
    try {
        var filter = fieldDoc.get("$query") || (fieldDoc.get("_id") ? {_id:fieldDoc.get("_id")} : {});
//        if (!filter || Object.keys(filter).length == 0) {
//            throw new Error("Query not defined for value [" + JSON.stringify(fieldDoc) + "]");
//        }
        db.collection(collectionField[Constants.Admin.Fields.COLLECTION], function (err, innerCollection) {
            if (err) {
                callback(err);
                return;
            }
            var filterKeys = Object.keys(filter);
            Utils.iterateArray(filterKeys, function (err, finalResult) {
                populateResult(collectionField, fieldDoc, filter, innerCollection, db, callback);
            }, function (filterKey, callback) {
                try {
                    innerCollection.get(Constants.Admin.Collections.FIELDS, function (err, innerCollectionFields) {
                        var innerCollectionField = undefined;
                        var innerFieldDoc = undefined;
                        var noOfFields = innerCollectionFields ? innerCollectionFields.length : 0;
                        for (var i = 0; i < noOfFields; i++) {
                            if (innerCollectionFields[i][Constants.Admin.Fields.FIELD] == filterKey && innerCollectionFields[i][Constants.Admin.Fields.TYPE] == Constants.Admin.Fields.Type.FK) {
                                innerCollectionField = innerCollectionFields[i];
                                innerFieldDoc = fieldDoc.getDocuments("$query").getDocuments(filterKey);
                                break;
                            }
                        }
                        if (innerCollectionField) {
                            getQueryResult(innerCollectionField, innerFieldDoc, db, function (err, res) {
                                if (err) {
                                    callback(err);
                                    return;
                                }
                                filter[filterKey] = {_id:res._id};
                                callback();
                            })
                        } else {
                            callback();
                        }
                    })
                } catch (e) {
                    callback(e);
                }
            })
        })
    } catch (e) {
        callback(e);
    }
}

function populateResult(collectionField, fieldDoc, filter, innerCollection, db, callback) {
    try {
        var queryFields = {_id:1};
        if (collectionField[Constants.Admin.Fields.SET]) {
            for (var i = 0; i < collectionField[Constants.Admin.Fields.SET].length; i++) {
                queryFields[collectionField[Constants.Admin.Fields.SET][i]] = 1;
            }
        }
        if (collectionField[Constants.Admin.Fields.UPSERT]) {
            var operation = fieldDoc.updates;
            delete operation.$query;
            delete operation._id;
//        console.log("operation>>>>>>>>>>>>>>>>>>>>>>+++++++++++++++++++++++++++" + JSON.stringify(operation));
            console.log("upsert called..." + JSON.stringify(filter));
            innerCollection.upsert(filter, operation, queryFields, {w:1}, function (err, data) {
                if (err) {
                    callback(err);
                    return;
                }
                if (!data || Object.keys(data).length == 0) {
                    throw new Error("Record can not be null from upsert.");
                }
                console.log(">>>>>>>>>>>>>>>>>data >>>>>>>>>>>" + JSON.stringify(data));
                callback(null, data);
            })

        } else {
            if (!filter || Object.keys(filter).length == 0) {
                throw new Error("Query not defined for value [" + JSON.stringify(fieldDoc) + "] if upsert is false.");
            }
            var query = {};
            query[Constants.Query.COLLECTION] = collectionField[Constants.Admin.Fields.COLLECTION];
            query[Constants.Query.FIELDS] = queryFields;
            query[Constants.Query.FILTER] = filter;
            query[Constants.Query.LIMIT] = 2;
            db.query(query, function (err, data) {
                if (err) {
                    callback(err);
                    return;
                }
                if (data.result.length == 0) {
                    throw new Error("Autosave is not allowed if upsert is false in column [" + JSON.stringify(collectionField) + "]");
                }
                if (data.result.length > 1) {
                    throw new Error("More than one result found for column [" + JSON.stringify(collectionField) + "], Query [" + JSON.stringify(filter) + "]");
                }
                data = data.result[0];
                callback(null, data);
            })
        }
    } catch (e) {
        callback(e);
    }
}


exports.afterCommit = function (updates, doc, collection, db, callback) {
    //country name get changed
    //find collection where country is reffered
    // states (countryid)
    // persons : address [ ] --> countryid
    //    db.states.update({"countryid._id":"india"},{$set:{countryid.country:"india1"}})


    db.states.update({"countryid.states.cities._id":"hansi"}, {$set:{"countryid.country":"india1"}})

    var updates = {$query:{"countryid.states.cities._id":"hansi"}, $set:{"countryid.$states.$cities.city":"New hansi"}}

    var mongoupdates = {$query:{_id:"india"}, $set:{"countryid.states.1.cities.0.city":"New hansi"}}
    var mongoupdates = {$query:{_id:"india"}, $set:{"countryid.states.2.cities.1.city":"New hansi"}}
    var mongoupdates = {$query:{_id:"usa"}, $set:{"countryid.states.1.cities.0.city":"New hansi"}}


}