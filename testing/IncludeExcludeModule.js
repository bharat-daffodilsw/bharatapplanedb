exports.doQuery = function (query, collection, db, callback) {
    callback();
}

exports.doResult = function (query, result, collection, db, callback) {
    callback();
}

exports.preInsert = function (document, collection, db, callback) {
    var country = document.get("country");
    document.set("country", undefined);
    document.set("code1", 91);
    callback();
}

exports.postInsert = function (document, collection, db, callback) {
    callback();
}

exports.postDelete = function (document, collection, db, callback) {
    callback();
}

exports.preDelete = function (document, collection, db, callback) {
    document.setCancelUpdates();
    db.batchUpdateById({$collection:"countries", $insert:[
        {"country":"USA", _id:"USA"}
    ], $modules:{IncludeExcludeModule1:1, IncludeExcludeModule:1}}, callback);
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

