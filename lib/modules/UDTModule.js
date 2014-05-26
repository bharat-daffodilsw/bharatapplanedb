/**
 * Created with IntelliJ IDEA.
 * User: Administrator
 * Date: 4/18/14
 * Time: 10:07 AM
 * To change this template use File | Settings | File Templates.
 */


var Constants = require("../Constants.js");
var Utils = require("ApplaneCore/apputil/util.js");

exports.onValue = function (event, document, collection, db, options) {
    var updatedFieldInfo = options.updatedFieldInfo;
    if (!updatedFieldInfo || (updatedFieldInfo.type != "duration" && updatedFieldInfo.type != "currency" && updatedFieldInfo.type != "file" && updatedFieldInfo.type != "unit" )) {
        throw new Error("updatedFieldInfo must be available and must be one of these duration/currency/file/unit but found [" + JSON.stringify(updatedFieldInfo) + "]");
    }
    if (updatedFieldInfo.type == Constants.Admin.Fields.Type.DURATION) {
        var field=updatedFieldInfo.field;
        field.type= "object";
        field.fields = [
            {field: Constants.Modules.Udt.Duration.TIME, type: "decimal"},
            {field: Constants.Modules.Udt.Duration.UNIT, type: "string"},
            {field: "convertedvalue", type: "number"}
        ];
        insertConvertedValue(document, field);
    }
}


exports.doQuery = function (query, collection, db, callback) {
    collection.get(Constants.Admin.Collections.FIELDS, function (err, fields) {
        if (err) {
            callback(err);
            return;
        }
        if (query[Constants.Query.GROUP] !== undefined) {
            var group = query[Constants.Query.GROUP];
            if (Array.isArray(group)) {
                for (var i = 0; i < group.length; i++) {
                    handleEachGroup(group[i], fields);
                }
            }
            if (Utils.isJSONObject(group)) {
                handleEachGroup(group, fields);

                callback();
            } else {
                callback();
            }
        } else {
            callback();
        }
    });
}

exports.doResult = function (query, result, collection, db, callback) {

    collection.get(Constants.Admin.Collections.FIELDS, function (err, fields) {
        if (err) {
            callback(err);
            return;
        }
        if (query[Constants.Query.GROUP] !== undefined) {
            var group = query[Constants.Query.GROUP];
            if (Array.isArray(group)) {
                for (var i = 0; i < group.length; i++) {
                    handleEachGroupResult(group[i], fields, result.result);
                }
            }
            if (Utils.isJSONObject(group)) {
                handleEachGroupResult(group, fields, result.result);
                callback();
            } else {
                callback();
            }
        } else {
            callback();
        }
    });
}

exports.preUpdate = function (document, collection, db, callback) {
    this.preInsert(document, collection, db, callback);
}

exports.preInsert = function (document, collection, db, callback) {
    collection.get(Constants.Admin.Collections.FIELDS, function (err, fields) {
        try {
            handleUDTType(document, fields);
            callback();
        } catch (e) {
            callback(e);
            return;
        }
    });
}

exports.postInsert = function (document, collection, db, callback) {
    callback();
}

exports.preCommit = function (document, collection, db, callback) {
    callback();
}


exports.postCommit = function (document, collection, db, callback) {
    callback();
}

function handleUDTType(document, fields) {
    if (document === undefined) {
        return;
    }
    fields = fields || [];
    for (var i = 0; i < fields.length; i++) {
        var field = fields[i];
        var type = field.type;
        if (type == Constants.Admin.Fields.Type.DURATION) {
            field.type = "object";
            field.fields = [
                {field: Constants.Modules.Udt.Duration.TIME, type: "decimal"},
                {field: Constants.Modules.Udt.Duration.UNIT, type: "string"},
                {field: "convertedvalue", type: "number"}
            ];
            insertConvertedValue(document, field);
        } else if (type == Constants.Admin.Fields.Type.CURRENCY) {
            field.type = "object";
            field.fields = [
                {field: Constants.Modules.Udt.Currency.AMOUNT, type: "decimal"},
                {field: Constants.Modules.Udt.Currency.TYPE, type: Constants.Admin.Fields.Type.FK, set: [Constants.Modules.Udt.Currency.Type.CURRENCY], upsert: true, collection: {"collection": Constants.Modules.Udt.Currency.Type.COLLECTION, "fields": [
                    {field: Constants.Modules.Udt.Currency.Type.CURRENCY, type: "string"}
                ]}}
            ];
            validateValue(document, field);
        } else if (type == Constants.Admin.Fields.Type.UNIT) {
            field.type = "object";
            field.fields = [
                {field: Constants.Modules.Udt.Unit.QUANTITY, type: "decimal"},
                {field: Constants.Modules.Udt.Unit.UNIT, type: Constants.Admin.Fields.Type.FK, set: [Constants.Modules.Udt.Unit.Unit.UNIT], upsert: true, collection: {"collection": Constants.Modules.Udt.Unit.Unit.COLLECTION, "fields": [
                    {field: Constants.Modules.Udt.Unit.Unit.UNIT, type: "string"}
                ]}}
            ];
            validateValue(document, field);
        } else if (type == 'file') {
            field.type = "object";
            field.fields = [
                {field: "key", type: "string"},
                {field: "name", type: "string"}
            ];
        } else if (type === "object") {
            var innerFields = field[Constants.Admin.Collections.FIELDS];
            var fieldDocs = document.getDocuments(field.field);
            if (Array.isArray(fieldDocs)) {
                for (var j = 0; j < fieldDocs.length; j++) {
                    if (j == fieldDocs.length - 1) {
                        handleUDTType(fieldDocs[j], innerFields);
                    } else {
                        var innerFieldsClone = Utils.deepClone(innerFields);
                        handleUDTType(fieldDocs[j], innerFieldsClone);
                    }
                }
            } else {
                handleUDTType(fieldDocs, innerFields);
            }
        }
    }
}

function validateValue(document, field) {
    var value = document.get(field.field);
    if (document.type === "insert") {
        if (value !== null && value !== undefined && Utils.isJSONObject(value)) {
            if (value.amount === undefined) {
                throw new Error("value is mandatory for expression " + field.field + ".amount]");
            }
            if (Utils.isJSONObject(value.type)) {
                //TODO check for the null value
            } else {
                throw new Error("value expected is object for expression [" + field.field + ".type]");
            }
        }
    }
}

function insertConvertedValue(document, field) {
    var value = document.getDocuments(field.field);
    if (value) {
        var time = value.get(Constants.Modules.Udt.Duration.TIME);
        var unit = value.get(Constants.Modules.Udt.Duration.UNIT);
        if (time === undefined) {
            throw new Error("value is mandatory for expression [" + field.field + ".time ]");
        }
        if (unit === undefined) {
            throw new Error("value is mandatory for expression [" + field.field + ".unit ]");
        }
        var convertedValue = 0;
        if (unit == Constants.Modules.Udt.Duration.Unit.DAYS) {
            convertedValue = time * 8 * 60;
        } else if (unit == Constants.Modules.Udt.Duration.Unit.HRS) {
            convertedValue = time * 60;
        } else if (unit == Constants.Modules.Udt.Duration.Unit.MINUTES) {
            convertedValue = time;
        }
        value.set("convertedvalue", convertedValue);
    }
}

function handleEachGroup(group, fields) {
    for (var key in group) {
        if (Utils.isJSONObject(group[key])) {
            for (var innerKey in group[key]) {
                if (innerKey === "$sum") {
                    var aggregateExpression = group[key][innerKey];
                    if (typeof aggregateExpression === "string") {
                        var index = aggregateExpression.indexOf("$");
                        if (index !== undefined) {
                            aggregateExpression = aggregateExpression.substr(index + 1)
                            var fieldInfo = getField(aggregateExpression, fields);
                            if (fieldInfo && fieldInfo.type === "duration") {
                                group[key][innerKey] = "$" + aggregateExpression + ".convertedvalue";
                            }
                        }
                    }
                }
            }
        }
    }
}

function handleEachGroupResult(group, fields, result) {
    for (var key in group) {
        if (Utils.isJSONObject(group[key])) {
            for (var innerKey in group[key]) {
                if (innerKey === "$sum") {
                    var aggregateExpression = group[key][innerKey];
                    if (typeof aggregateExpression === "string") {
                        var index = aggregateExpression.indexOf("$");
                        if (index !== undefined) {
                            aggregateExpression = aggregateExpression.substr(index + 1)
                            var fieldInfo = getField(aggregateExpression, fields);
                            if (fieldInfo && fieldInfo.type === "duration") {
                                for (var i = 0; i < result.length; i++) {
                                    var value = result[i][key];
                                    result[i][key] = {"time": value / 60, timeunit: "hrs"};
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

function getField(expression, fields) {
    if (fields && fields.length > 0) {
        var index = expression.indexOf(".");
        if (index !== -1) {
            var firstPart = expression.substr(0, index);
            var rest = expression.substr(index + 1);
            var firstPartField = get(firstPart, fields);
            if (firstPartField) {
                return getField(rest, firstPartField.fields);
            }
        } else {
            return get(expression, fields);
        }
    }
}

function get(expression, fields) {
    for (var i = 0; i < fields.length; i++) {
        var field = fields[i];
        if (field.field === expression) {
            return field;
        }
    }
}



