exports.doQuery = function (query, collection, db, callback) {

    if (query.$collection == "countries") {
        query.$fields = {country: 1};
        console.log("doquery>>>>>>>>" + JSON.stringify(query.$fields));
    }
    callback();
}

exports.doResult = function (query, result, collection, db, callback) {
    if (query.$collection == "countries") {
        console.log("doresult>>>>>>>>" + JSON.stringify(query.$fields));
        if (query.$fields && Object.keys(query.$fields).length == 1) {
            result.result[0].code = 1000;
        }
    }
    callback();
}

exports.preInsert = function (document, collection, db, callback) {
    var country = document.get("country");
    document.set("country", undefined);
    document.set("code", 91);
    callback();
}

exports.postInsert = function (document, collection, db, callback) {
    if (document.get("code") == 91) {
        db.batchUpdateById([
            {$collection: "countries2", $insert: [
                {"country": "China"}
            ], $modules: {CloneTestModule: 0}}
        ], callback);
    } else {
        db.batchUpdateById([
            {$collection: "countries1", $insert: [
                {"country": "China"}
            ], $modules: {CloneTestModule: 0}}
        ], callback);
    }
}

exports.postDelete = function (document, collection, db, callback) {
    callback();
}

exports.preDelete = function (document, collection, db, callback) {
    callback();
}

exports.postUpdate = function (document, collection, db, callback) {
    callback();
}

exports.preUpdate = function (document, collection, db, callback) {
    callback();
}

exports.preCommit = function (document, collection, db, callback) {
    callback();
}

exports.onCommit = function (document, collection, db, callback) {
    callback();
}

exports.postCommit = function (document, collection, db, callback) {
    callback();
}

