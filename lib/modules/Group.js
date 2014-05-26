var Constants = require("../Constants.js");
var Utils = require("ApplaneCore/apputil/util.js");

exports.doQuery = function (query, collection, db, callback) {
    try {
        if (!query[Constants.Query.GROUP]) {
            callback();
            return;
        }
        collection.get(Constants.Admin.Collections.FIELDS, function (err, collectionFields) {
            if (err) {
                callback(err);
                return;
            }
            if (query[Constants.Query.FIELDS]) {
                if (Array.isArray(query[Constants.Query.GROUP])) {
                    throw new Error("Array of group is not supported if field is defined.");
                }
                var fields = query[Constants.Query.FIELDS];
                if (Object.keys(fields).length > 0) {
                    var children = populateChildren(fields, query);
                }
                delete query[Constants.Query.FIELDS];
            }
            if (Array.isArray(query[Constants.Query.GROUP])) {
                var groups = query[Constants.Query.GROUP];
                for (var i = 0; i < groups.length; i++) {
                    if (Array.isArray(groups[i]._id)) {
                        throw new Error("Array of _id is not supported in group Array.");
                    }
                }
            } else {
                var groupId = query[Constants.Query.GROUP]._id;
                if (Array.isArray(groupId)) {
                    var groupArray = [];
                    populateGroup(collectionFields, groupId, query, groupArray);
                    query[Constants.Query.GROUP] = groupArray;
                } else if (Utils.isJSONObject(groupId)) {
                    for (var key in groupId) {
                        if (isFkColumn(collectionFields, groupId[key])) {
                            groupId[key] = groupId[key] + "._id";
                        }
                    }
                } else {
                    if (isFkColumn(collectionFields, groupId)) {
                        query[Constants.Query.GROUP]._id = groupId + "._id";
                    }
                }
            }
            callback();
        })
    } catch (e) {
        callback(e);
    }
}

function isFkColumn(fields, field) {
    if (fields) {
        for (var i = 0; i < fields.length; i++) {
            if ("$" + fields[i][Constants.Admin.Fields.FIELD] == field && fields[i][Constants.Admin.Fields.TYPE] == Constants.Admin.Fields.Type.FK) {
                return true;
            }
        }
    }
}

function populateGroup(collectionFields, groupId, query, groupArray) {
    var groupIdLength = groupId.length;
    var idObject = {};
    for (var i = 0; i < groupId.length; i++) {
        var groupOn = groupId[i];
        var key = Object.keys(groupOn)[0];
        if (isFkColumn(collectionFields, groupOn[key])) {
            idObject[key] = groupOn[key] + "._id";
        } else {
            idObject[key] = groupOn[key];
        }
    }
    query[Constants.Query.GROUP]._id = idObject;
    groupArray.push(query[Constants.Query.GROUP]);
    var prevGroup = groupArray[groupArray.length - 1];
    for (var i = 1; i < groupIdLength; i++) {
        var key = Object.keys(groupId[groupIdLength - i])[0];
        var nestedGroup = {};
        for (var exp in prevGroup) {
            if (exp == key) {
                continue;
            }
            if (exp == Constants.Query.FILTER || exp == Constants.Query.SORT) {
                nestedGroup[exp] = prevGroup[exp];
            } else if (exp == "children") {
                var children = {};
                children._id = "$_id." + key;
                children[key] = "$" + key;
                children.children = "$children";
                for (var prevGroupExp in prevGroup) {
                    if (prevGroup[prevGroupExp].$sum || prevGroup[prevGroupExp].$min || prevGroup[prevGroupExp].$max) {
                        children[prevGroupExp] = "$" + prevGroupExp;
                    }
                }
                nestedGroup.children = {$push:children};
            } else if (exp == "_id") {
                var prevGroupId = prevGroup._id;
                var nestedGroupId = {};
                for (var exp in prevGroupId) {
                    if (exp != key) {
                        nestedGroupId[exp] = "$_id." + exp;
                    }
                }
                if (Object.keys(nestedGroupId).length == 1) {
                    nestedGroup._id = nestedGroupId[Object.keys(nestedGroupId)[0]];
                } else {
                    nestedGroup._id = nestedGroupId;
                }
            } else {
                var nestedGroupExpObj = {};
                nestedGroupExpObj[Object.keys(prevGroup[exp])[0]] = "$" + exp;
                nestedGroup[exp] = nestedGroupExpObj;
            }
        }
        groupArray.push(nestedGroup);
        prevGroup = nestedGroup;
    }
}

function populateChildren(fields, query) {
    var newField = {};
    newField._id = "$_id";
    for (var exp in fields) {
        newField[exp] = "$" + exp;
    }
    var children = {$push:newField};
    query[Constants.Query.GROUP].children = children;
}