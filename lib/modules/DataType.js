var ObjectJS = require("./datatypes/Object.js");
var Constants = require("../Constants.js");
var Utils = require("ApplaneCore/apputil/util.js");

exports.doQuery = function (query, collection, db, callback) {
    var filter = query.$filter;
    if (filter) {
        collection.get(Constants.Admin.Collections.FIELDS, function (err, fields) {
            if (err) {
                callback(err);
                return;
            }
            castFilter(filter, fields);
            callback();
        });
    } else {
        callback();
    }
}

function castFilter(filter, fields) {
    var keys = Object.keys(filter);
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var value = filter[key];
        if (value) {
            if (key === "$or" || key === "$and") {
                for (var j = 0; j < value.length; j++) {
                    castFilter(value[j], fields);
                }
            } else {
                if (fields) {
                    var field = getField(key, fields);
                    if (field) {
                        var type = field.type;
                        if (type && type !== "fk") {
                            var dataType = ObjectJS.getType(type);
                            if (Utils.isJSONObject(value)) {
                                for (var innerKey in value) {
                                    if (innerKey === "$in" || innerKey === "$nin") {
                                        for (var j = 0; j < value[innerKey].length; j++) {
                                            value[innerKey][j] = dataType.cast(value[innerKey][j], key, field);
                                        }
                                    } else {
                                        value[innerKey] = dataType.cast(value[innerKey], key, field);
                                    }
                                }
                            } else {
                                filter[key] = dataType.cast(value, key, field);
                            }
                        }
                    }
                }
            }
        }
    }
}

exports.doResult = function (query, result, collection, db, callback) {
    callback();
}

exports.preUpdate = function (document, collection, db, callback) {
    this.preInsert(document, collection, db, callback);
}

exports.preInsert = function (document, collection, db, callback) {
    collection.get(Constants.Admin.Collections.FIELDS, function (err, fields) {
        var error = undefined;
        try {
            ObjectJS.cast(document, "", {type: "object", fields: fields, mandatory: true});
        } catch (e) {
            error = e;
        }
        callback(error);
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

function getField(expression, fields) {
    if (fields && fields.length > 0) {
        var index = expression.indexOf(".");
        if (index !== -1) {
            var firstPart = expression.substr(0, index);
            var rest = expression.substr(index + 1);
            var firstPartFields = get(firstPart, fields);
            if(firstPartFields){
                return getField(rest, firstPartFields.fields);
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