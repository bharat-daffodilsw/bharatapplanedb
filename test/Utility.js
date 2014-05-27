/**
 * Created with IntelliJ IDEA.
 * User: daffodil
 * Date: 9/4/14
 * Time: 5:06 PM
 * To change this template use File | Settings | File Templates.
 */

var ApplaneDB = require("../lib/DB.js");
var Config = require("./config.js");
var NorthwindDb = require("./NorthwindDb.js");
var Utils = require("ApplaneCore/apputil/util.js");
var Constants = require("../lib/Constants.js");
var OPTIONS = {};

exports.insertData = function (data, done) {
    ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
        if (err) {
            done(err);
            return;
        }
        var tables = Object.keys(data);
        Utils.iterateArray(tables, done, function (table, done) {
            db.collection(table, function (err, collection) {
                if (err) {
                    done(err);
                    return;
                }
                collection.insert(data[table], function (err, res) {
                    if (err) {
                        done(err);
                        return;
                    }
                    done();
                })
            })
        })
    })
}

exports.removeData = function (data, done) {
    ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
        if (err) {
            done(err);
            return;
        }
        var tables = Object.keys(data);
        Utils.iterateArray(tables, done, function (table, done) {
            db.collection(table, function (err, collection) {
                if (err) {
                    done(err);
                    return;
                }

                collection.remove({}, function (err, res) {
                    if (err) {
                        done(err);
                        return;
                    }
                    done();
                })
            })
        })
    })
}


exports.populateQuery = function (collection, fields, filter, sort, group, unwind, recursion) {
    var query = {};
    query[Constants.Query.COLLECTION] = collection;
    query[Constants.Query.FIELDS] = fields;
    query[Constants.Query.FILTER] = filter;
    query[Constants.Query.SORT] = sort;
    query[Constants.Query.GROUP] = group;
    query[Constants.Query.UNWIND] = unwind;
    query[Constants.Query.RECURSION] = recursion;

    return query;
}

exports.populateCollection = function (collectionName, fields) {
    var collection = {};
    collection[Constants.Admin.Collections.COLLECTION] = collectionName;
    collection[Constants.Admin.Collections.FIELDS] = fields;
    return collection;
}

exports.populateCollectionField = function (fieldName, type, multiple, mandatory, collection, setColumn, fields) {
    var field = {};
    field[Constants.Admin.Fields.FIELD] = fieldName;
    field[Constants.Admin.Fields.TYPE] = type;
    field[Constants.Admin.Fields.MULTIPLE] = multiple;
    field[Constants.Admin.Fields.MANDATORY] = mandatory;
    field[Constants.Admin.Fields.COLLECTION] = collection;
    field[Constants.Admin.Fields.SET] = setColumn;
    field[Constants.Admin.Collections.FIELDS] = fields;
    return field;
}