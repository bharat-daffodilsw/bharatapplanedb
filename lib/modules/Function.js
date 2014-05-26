/**
 * Created with IntelliJ IDEA.
 * User: daffodil
 * Date: 17/4/14
 * Time: 12:39 PM
 * To change this template use File | Settings | File Templates.
 */

var Utils = require("ApplaneCore/apputil/util.js");
var Constants = require("../Constants.js");
var Moment = require("moment");

exports.doQuery = function (query, collection, db, callback) {
    try {
        if (!query[Constants.Query.FILTER]) {
            callback();
            return;
        }
        var filter = query[Constants.Query.FILTER];
        var parameters = query[Constants.Query.PARAMETERS] || {};
        populateFilter(filter, parameters, db, callback);
    } catch (e) {
        callback(e);
    }
}

function populateFilter(filter, parameters, db, callback) {
    var filterKeys = Object.keys(filter);
    Utils.iterateArray(filterKeys, callback, function (filterKey, callback) {
        var filterValue = filter[filterKey];
        if (filterKey == Constants.Query.Filter.OR || filterKey == Constants.Query.Filter.AND) {
            Utils.iterateArray(filterValue, callback, function (row, callback) {
                populateFilter(row, parameters, db, callback);
            })
        } else {
            if (Utils.isJSONObject(filterValue)) {
                if (filterValue.$function) {
                    resolveFunction(filterValue.$function, parameters, db, function (err, result) {
                        if (err) {
                            callback(err);
                            return;
                        }
                        filter[filterKey] = result;
                        callback();
                    });
                } else {
                    var filterValueKeys = Object.keys(filterValue);
                    Utils.iterateArray(filterValueKeys, callback, function (filterValueKey, callback) {
                        var innerFilterValue = filterValue[filterValueKey];
                        if (!Utils.isJSONObject(innerFilterValue)) {
                            if (innerFilterValue && typeof innerFilterValue == "string" && innerFilterValue.indexOf("$") == 0) {
                                filterValue[filterValueKey] = Utils.resolveValue(parameters, innerFilterValue.substring(1));
                            }
                            callback();
                            return;
                        }
                        if (!innerFilterValue.$function) {
                            callback();
                            return;
                        }
                        resolveFunction(innerFilterValue.$function, parameters, db, function (err, result) {
                            if (err) {
                                callback(err);
                                return;
                            }
                            console.log("result >>>>>>>>>>>>>>" + JSON.stringify(result));
                            filterValue[filterValueKey] = result;
                            callback();
                        });
                    })
                }
            } else {
                if (filterValue && typeof filterValue == "string" && filterValue.indexOf("$") == 0) {
                    filter[filterKey] = Utils.resolveValue(parameters, filterValue.substring(1));
                }
                callback();
            }
        }
    })
}


function resolveFunction(functionValue, parameters, db, callback) {
    var functionName = undefined;
    var functionParams = undefined;
    if (Utils.isJSONObject(functionValue)) {
        functionName = Object.keys(functionValue)[0];
        functionParams = functionValue[functionName];
    } else {
        functionName = functionValue;
    }
    if (functionParams && !Utils.isJSONObject(functionParams)) {
        throw new Error("Parameters defined for function should be Object.");
    }
    for (var functionParamsKey in functionParams) {
        var funcParamsValue = functionParams[functionParamsKey];
        if (funcParamsValue && typeof funcParamsValue == "string" && funcParamsValue.indexOf("$") == 0) {
            functionParams[functionParamsKey] = Utils.resolveValue(parameters, funcParamsValue.substring(1));
        }
    }
    db.invokeFunction(functionName, functionParams ? [functionParams] : undefined, callback);

}

exports.getCurrentDate = function (db, callback) {
    var currentDate = Moment().zone(-330).startOf("day").toDate();
    callback(null, currentDate);
}

exports.getCurrentMonth = function (db, callback) {
    var startDate = Moment().zone(-330).startOf('month').toDate();
    var endDate = Moment().zone(-330).endOf('month').add('days', 1).startOf('day').toDate();
    callback(null, {$gte:startDate, $lt:endDate});
}

exports.getCurrentWeek = function (db, callback) {
    var startDate = Moment().zone(-330).startOf('week').toDate();
    var endDate = Moment().zone(-330).endOf('week').add('days', 1).startOf('day').toDate();
    callback(null, {$gte:startDate, $lt:endDate});
}

exports.getCurrentYear = function (db, callback) {
    var startDate = Moment().zone(-330).startOf('year').toDate();
    var endDate = Moment().zone(-330).endOf('year').add('days', 1).startOf('day').toDate();
    callback(null, {$gte:startDate, $lt:endDate});
}

exports.getNextDate = function (db, callback) {
    var nextDate = Moment().zone(-330).add("days", 1).startOf("day").toDate();
    callback(null, nextDate);
}

exports.getCurrentUser = function (params, db, callback) {
    var user = db.user;
    if (!user || !params || Object.keys(params).length == 0) {
        callback();
        return;
    }
    callback(null, user[Object.keys(params)[0]]);
}
