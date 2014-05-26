var Utils = require("ApplaneCore/apputil/util.js");
var Constants = require("../Constants.js");

exports.doQuery = function (query, collection, db, callback) {
    try {
        if (!query[Constants.Query.RECURSION] || (query[Constants.Query.RECURSION][Constants.Query.Recursion.LEVEL] !== undefined && query[Constants.Query.RECURSION][Constants.Query.Recursion.LEVEL] < 1)) {
            callback();
            return;
        }
        query[Constants.Query.RECURSION][Constants.Query.Recursion.COUNTER] = query[Constants.Query.RECURSION][Constants.Query.Recursion.COUNTER] || 0;
        if (query[Constants.Query.RECURSION][Constants.Query.Recursion.COUNTER] > 6) {
            throw new Error("Too Many Recursion levels found.");
        }
        generateRecursiveQuery(query);
        callback();
    } catch (e) {
        callback(e);
    }
}

function generateRecursiveQuery(query) {
//    console.log("query >>>>>>>>>>>>>>>" + JSON.stringify(query));
//    if (!query[Constants.Query.FIELDS]) {
//        throw new Error("Fields is mandatory if recursion is defined in query.");
//    }
    var recursiveColumn = undefined;
    var recursiveColumnValue = undefined;
    var queryRecursion = query[Constants.Query.RECURSION];
    delete query[Constants.Query.RECURSION];
    for (var column in queryRecursion) {
        if (column.indexOf("$") != 0) {
            recursiveColumn = column;
            recursiveColumnValue = queryRecursion[recursiveColumn];
            break;
        }
    }
    var queryFilter = query[Constants.Query.FILTER];

//    TODO doubt in case of recursion query.
    if (!queryFilter || (queryFilter[recursiveColumn] === undefined && queryFilter[recursiveColumn + "._id"] === undefined)) {
        throw new Error("Filter on recursive column is mandatory.");
    }
    var childQuery = {};
    childQuery[Constants.Query.COLLECTION] = query[Constants.Query.COLLECTION];
    childQuery[Constants.Query.FIELDS] = Utils.deepClone(query[Constants.Query.FIELDS]);
    var childDataFilter = {};
    for (var exp in queryFilter) {
        if (exp != recursiveColumn) {
            childDataFilter[exp] = queryFilter[exp];
        }
    }
    childQuery[Constants.Query.FILTER] = childDataFilter;
    if (queryRecursion[Constants.Query.Recursion.LEVEL]) {
        queryRecursion[Constants.Query.Recursion.LEVEL] = queryRecursion[Constants.Query.Recursion.LEVEL] - 1;
    }
    queryRecursion[Constants.Query.Recursion.COUNTER] = queryRecursion[Constants.Query.Recursion.COUNTER] + 1;
    childQuery[Constants.Query.RECURSION] = queryRecursion;
    childQuery[Constants.Query.UNWIND] = query[Constants.Query.UNWIND];
    childQuery[Constants.Query.SORT] = query[Constants.Query.SORT];
    childQuery[Constants.Query.CHILDS] = query[Constants.Query.CHILDS];
    childQuery[Constants.Query.MODULES] = query[Constants.Query.MODULES];

    var childData = {};
    //always show recursionDataAlias data in array format..
    childData[Constants.Query.Fields.TYPE] = "n-rows";
    childData[Constants.Query.Fields.ENSURE] = queryRecursion[Constants.Query.Recursion.ENSURE];
    childData[Constants.Query.Fields.QUERY] = childQuery;
    childData[Constants.Query.Fields.FK] = recursiveColumn;
    childData[Constants.Query.Fields.PARENT] = recursiveColumnValue;
    query[Constants.Query.FIELDS] = query[Constants.Query.FIELDS] || {};
    query[Constants.Query.FIELDS][queryRecursion[Constants.Query.Recursion.ALIAS] || "children"] = childData;
//    console.log("query After Recursion ++++++++++++++++++++++++++++++++++++++" + JSON.stringify(query));
}

