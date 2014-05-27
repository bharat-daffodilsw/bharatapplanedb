var Constants = require("../Constants.js");
var Utils = require("ApplaneCore/apputil/util.js");
exports.doQuery = function (query, collection, db, callback) {
    callback();
}

exports.doResult = function (query, result, collection, db, callback) {
    callback();
}

exports.preInsert = function (document, collection, db, callback) {
    invokeTriggers(document, collection, db, "insert", "pre", function (err) {
        if (err) {
            callback(err);
            return;
        }
        callback();
    });
}

exports.postInsert = function (document, collection, db, callback) {
    invokeTriggers(document, collection, db, "insert", "post", function (err) {
        if (err) {
            callback(err);
            return;
        }
        callback();
    });
}

exports.postDelete = function (document, collection, db, callback) {
    invokeTriggers(document, collection, db, "delete", "post", function (err) {
        if (err) {
            callback(err);
            return;
        }
        callback();
    });
}

exports.preDelete = function (document, collection, db, callback) {
    invokeTriggers(document, collection, db, "delete", "pre", function (err) {
        if (err) {
            callback(err);
            return;
        }
        callback();
    });
}

exports.postUpdate = function (document, collection, db, callback) {
    invokeTriggers(document, collection, db, "update", "post", function (err) {
        if (err) {
            callback(err);
            return;
        }
        callback();
    });
}

exports.preUpdate = function (document, collection, db, callback) {
    invokeTriggers(document, collection, db, "update", "pre", function (err) {
        if (err) {
            callback(err);
            return;
        }
        callback();
    });
}

exports.preCommit = function (document, collection, db, callback) {
    callback();
}

exports.postCommit = function (document, collection, db, callback) {
    callback();
}


function invokeTriggers(document, collection, db, type, when, callback) {
    collection.get(Constants.Trigger.TRIGGERS, function (err, triggers) {
        if (err) {
            callback(err);
            return;
        }
        Utils.iterateArray(triggers, callback, function (trigger, callback) {
            var operations = trigger[Constants.Trigger.Triggers.OPERATIONS];
            if (operations && operations.length > 0 && operations.indexOf(type) !== -1 && trigger.when === when) {
                db.invokeFunction(trigger[Constants.Trigger.Triggers.FUNCTIONNAME], [document], function (err) {
                    if (callback === undefined) {
                        throw new Error("Issue in Trigger [" + JSON.stringify(trigger) + "]");
                    }
                    if (err) {
                        callback(err);
                        callback = undefined;
                        return;
                    }
                    callback();
                    callback = undefined;
                });
            } else {
                callback();
            }
        })
    });
}