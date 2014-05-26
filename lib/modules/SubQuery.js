var Utils = require("ApplaneCore/apputil/util.js");
var Constants = require("../Constants.js");

exports.doQuery = function (query, collection, db, callback) {
//    console.log("SubQuery doQuery Called...");
    try {
        if (query[Constants.Query.FIELDS]) {
            removeQueryFromFields(query);
        }
//        console.log("query After in subquery >>>>>>>>>>>>" + JSON.stringify(query));
        if (!query[Constants.Query.FILTER]) {
            callback();
            return;
        }
        resolveFilterSubQuery(query[Constants.Query.FILTER], db, callback);

    } catch (e) {
        callback(e);
    }
}


function resolveFilterSubQuery(filter, db, callback) {
    var filterKeys = Object.keys(filter);
    Utils.iterateArray(filterKeys, callback, function (filterKey, callback) {
        if (filterKey == Constants.Query.Filter.OR || filterKey == Constants.Query.Filter.AND) {
            var filterValues = filter[filterKey];
            Utils.iterateArray(filterValues, callback, function (filterValue, callback) {
                resolveFilterSubQuery(filterValue, db, callback);
            })
        } else {
            populateFilterSubQuery(filter, filterKey, db, callback);
        }
    })
}

function populateFilterSubQuery(filter, filterKey, db, callback) {
    try {
        var filterValue = filter[filterKey];
        if (!Utils.isJSONObject(filterValue) || !filterValue[Constants.Query.Fields.QUERY]) {
            callback();
            return;
        }
        var filterSubQuery = filterValue[Constants.Query.Fields.QUERY];
        console.log("filterSubQuery >>>>>>>>>>>>>" + JSON.stringify(filterSubQuery));
        if (filterSubQuery[Constants.Query.GROUP]) {
            throw new Error("Group is not allowed in filter subQuery.");
        }
        if (!filterSubQuery[Constants.Query.FIELDS]) {
            throw new Error("Field is mandatory in case of subquery in filter.");
        }
        if (Object.keys(filterSubQuery[Constants.Query.FIELDS]).length != 1) {
            throw new Error("One Field can be defined in fields in subquery defined in filter.");
        }
        var fieldColumn = Object.keys(filterSubQuery[Constants.Query.FIELDS])[0];
        db.query(filterSubQuery, function (err, filterQueryResult) {
            if (err) {
                callback(err);
                return;
            }
            try {
                var filterData = [];
                var filterResultLength = filterQueryResult.result ? filterQueryResult.result.length : 0;
                for (var i = 0; i < filterResultLength; i++) {
                    var row = filterQueryResult.result[i];
                    //TODO if field column value is Array
                    var fieldColumnValue = Utils.resolveValue(row, fieldColumn);
                    if (fieldColumnValue) {
                        filterData.push(fieldColumnValue);
                    }
                }
                filter[filterKey] = filterData.length == 1 ? filterData[0] : {$in:filterData};
                callback();
            } catch (e) {
                callback();
            }
        })
    } catch (e) {
        callback(e);
    }

}

function removeQueryFromFields(query) {
    var fields = query[Constants.Query.FIELDS];
    var parentFields = {};
    for (var fieldKey in fields) {
        var fieldValue = fields[fieldKey];
        if (Utils.isJSONObject(fieldValue)) {
            if (fieldValue[Constants.Query.Fields.QUERY]) {
                delete fields[fieldKey];
            } else {
                throw new Error("If query is not defined can't define Object in field [" + JSON.stringify(fieldValue) + "]");
            }
            var parentColumn = fieldValue[Constants.Query.Fields.PARENT] || "_id";
            if (fieldKey.lastIndexOf(".") != -1) {
                parentColumn = fieldKey.substring(0, fieldKey.lastIndexOf(".")) + "." + parentColumn;
            }
            ensureColumnInFields(parentColumn, parentFields);
        }
    }

    if (addField(fields)) {
        for (var key in parentFields) {
            fields[key] = parentFields[key];
        }
    }
}

function addField(fields) {
    for (var exp in fields) {
        var fieldValue = fields[exp];
        if (fieldValue != 0 && !Utils.isJSONObject(fieldValue)) {
            return true;
        }
    }

}

function ensureColumnInFields(columnName, fields) {
    //TODO handling of adding column in fields,Error if dotted and without dotted expressiion already exists.
//    if(!fields[columnName.substring(0, columnName.length - 4)]) {
    fields[columnName] = 1;
//    }
}

exports.doResult = function (query, result, collection, db, callback) {
//    console.log("SubQuery doResult Called...");
//    console.log("query in subquery doResult++++++++++++++++++++++++" + JSON.stringify(query));
//    console.log("result in subquery doResult++++++++++++++++++++++++" + JSON.stringify(result));
    try {
        if (!query[Constants.Query.FIELDS] || result.result.length == 0) {
            callback();
            return;
        }

        var fields = query[Constants.Query.FIELDS];
        var fieldKeys = Object.keys(fields);
//        console.log("fieldKeys >>>>>>>>>>>>>>>>" + JSON.stringify(fieldKeys));
        Utils.iterateArray(fieldKeys, callback, function (fieldKey, callback) {
            var fieldValue = fields[fieldKey];
            if (!Utils.isJSONObject(fieldValue) || !fieldValue[Constants.Query.Fields.QUERY]) {
                callback();
                return;
            }
            if (!fieldValue[Constants.Query.Fields.FK]) {
                throw new Error("fk is not defined..");
            }
            var filterResult = [];
            populateFilterResult(filterResult, result.result, fieldKey, fieldValue[Constants.Query.Fields.PARENT]);
//            console.log("filterResult >>>>>>>>>>>>" + JSON.stringify(filterResult));
            var filterResultLength = filterResult.length;
            if (filterResult.length == 0) {
                callback();
                return;
            }
            var subQuery = populateSubQuery(fieldValue);
            subQuery[Constants.Query.FILTER] = subQuery[Constants.Query.FILTER] || {};
            subQuery[Constants.Query.FILTER][fieldValue[Constants.Query.Fields.FK]] = (filterResultLength == 1) ? filterResult[0] : {$in:filterResult};
//            console.log("subquery >>>>>>>>>>>>" + JSON.stringify(subQuery));
            db.query(subQuery, function (err, subQueryResult) {
                if (err) {
                    callback(err);
                    return;
                }
                try {
                    if (!subQueryResult.result || subQueryResult.result.length == 0) {
                        callback();
                        return;
                    }
                    var type = fieldValue[Constants.Query.Fields.TYPE] || "scalar";
                    var ensureColumn = fieldValue[Constants.Query.Fields.ENSURE];
                    mergeResult(result.result, subQueryResult.result, fieldKey, fieldValue, type, ensureColumn);
                    callback();
                } catch (e) {
                    callback(e);
                }
            });
        })
    }
    catch (e) {
        callback(e);
    }
}

function populateIdColumnValue(subQueryRow, fkColumnAlias) {
    if (Array.isArray(subQueryRow._id)) {
        throw new Error("");
    } else if (subQueryRow._id instanceof Object) {
        if (Object.keys(subQueryRow._id).length == 1) {
            subQueryRow._id = subQueryRow._id[Object.keys(subQueryRow._id)[0]];
        } else {
            delete subQueryRow._id[fkColumnAlias];
            if (Object.keys(subQueryRow._id).length == 1) {
                subQueryRow._id = subQueryRow._id[Object.keys(subQueryRow._id)[0]];
            } else if (Object.keys(subQueryRow._id).length == 0) {
                throw new Error("");
            }
        }
    }
}
function mergeResult(result, subQueryResult, fieldKey, fieldValue, type, ensureColumn) {
    for (var i = 0; i < result.length; i++) {
        var row = result[i];
        if (fieldKey.indexOf(".") != -1) {
            var fieldKeyResult = Utils.resolveValue(row, fieldKey.substring(0, fieldKey.indexOf(".")));
            if (!(Array.isArray(fieldKeyResult))) {
                fieldKeyResult = [fieldKeyResult];
            }
            mergeResult(fieldKeyResult, subQueryResult, fieldKey.substring(fieldKey.indexOf(".") + 1), fieldValue, type, ensureColumn);
        } else {
            var parentColumnValue = Utils.resolveValue(row, fieldValue[Constants.Query.Fields.PARENT]);
            if (parentColumnValue) {
                if (!(Array.isArray(parentColumnValue))) {
                    parentColumnValue = [parentColumnValue];
                }
                var fkColumnAlias = fieldValue[Constants.Query.Fields.QUERY][Constants.Query.GROUP] ? fieldValue[Constants.Query.Fields.FK].replace(/\./g, "_") : fieldValue[Constants.Query.Fields.FK];
                var dataArray = [];
                for (var j = 0; j < parentColumnValue.length; j++) {
                    for (var k = 0; k < subQueryResult.length; k++) {
                        var subQueryRow = subQueryResult[k];
                        var fkColumnValue = Utils.resolveValue(subQueryRow, fkColumnAlias);
                        if (fkColumnValue && (fkColumnValue === parentColumnValue[j] || Utils.compareObjectId(fkColumnValue, parentColumnValue[j]) || (Array.isArray(fkColumnValue) && fkColumnValue.indexOf(parentColumnValue[j]) != -1))) {
                            populateIdColumnValue(subQueryRow, fkColumnAlias);
                            //Doubt need to delete alias result or not
//                    delete  subQueryRow[fkColumnAlias];
//                            console.log("matched........." + JSON.stringify(subQueryRow));
                            dataArray.push(subQueryRow);
                        }
                    }
                }
                if (dataArray.length > 0 || ensureColumn) {
                    row[fieldKey] = (type == "scalar") ? (dataArray.length > 0 ? dataArray[0] : {}) : dataArray;
                }
            }
        }
    }
}

function populateSubQuery(fieldValue) {
//    console.log("fieldValue>>>>>>>>>>>>>>>>>+++++++++++++++++++++++++++++++++" + JSON.stringify(fieldValue));
    var subQuery = fieldValue[Constants.Query.Fields.QUERY];
    if (subQuery[Constants.Query.GROUP]) {
        var groupId = subQuery[Constants.Query.GROUP]._id;
        if (groupId) {
            if (Array.isArray(groupId)) {
                throw new Error("");
            }
            if (!(groupId instanceof Object)) {
                var groupColumn = groupId.substring(1);
                var newGroupId = {};
                newGroupId[groupColumn.replace(/\./g, "_")] = groupId;
                groupId = newGroupId;
            }
            groupId[fieldValue[Constants.Query.Fields.FK].replace(/\./g, "_")] = "$" + fieldValue[Constants.Query.Fields.FK];
        } else {
            groupId = "$" + fieldValue[Constants.Query.Fields.FK];
        }
        subQuery[Constants.Query.GROUP]._id = groupId;
        subQuery[Constants.Query.GROUP][fieldValue[Constants.Query.Fields.FK].replace(/\./g, "_")] = {$first:"$" + fieldValue[Constants.Query.Fields.FK]};
//        fieldValue.$fk = fieldValue.$fk.replace(/\./g, "_");
    }
    if (fieldValue[Constants.Query.Fields.FK] && fieldValue[Constants.Query.Fields.QUERY][Constants.Query.FIELDS] && Object.keys(fieldValue[Constants.Query.Fields.QUERY][Constants.Query.FIELDS]).length > 0) {
        var queryFields = fieldValue[Constants.Query.Fields.QUERY][Constants.Query.FIELDS];
        if (addField(queryFields)) {
            ensureColumnInFields(fieldValue[Constants.Query.Fields.FK], queryFields);
        }
    }
    return subQuery;
}

function populateFilterResult(parentResult, result, fieldKey, parentColumn) {
    if (fieldKey.lastIndexOf(".") != -1) {
        parentColumn = fieldKey.substring(0, fieldKey.lastIndexOf(".")) + "." + parentColumn;
    }
    for (var i = 0; i < result.length; i++) {
        var row = result[i];
        var value = Utils.resolveValue(row, parentColumn);
        if (value) {
            if (Array.isArray(value)) {
                for (var j = 0; j < value.length; j++) {
                    if (parentResult.indexOf(value[j]) == -1) {
                        parentResult.push(value[j]);
                    }
                }
            } else {
                if (parentResult.indexOf(value) == -1) {
                    parentResult.push(value);
                }
            }
        }
    }
}