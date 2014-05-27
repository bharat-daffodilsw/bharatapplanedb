var Utils = require("ApplaneCore/apputil/util.js");
var Document = require("./Document.js");
var Constants = require("./Constants.js");
var ModuleManager = require("./ModuleManager.js");
var EventManager = require("./EventManager.js");
var Q = require("q");
var Collection = function (collection, db, options) {
    this.mongoCollection = collection;
    this.db = db;
    this.options = options;
//    validateFields(options ? options.fields : undefined);
}

function validateFields(fields, pField) {
    if (fields) {
        for (var i = 0; i < fields.length; i++) {
            if (fields[i].field.indexOf(".") > -1) {
                throw new Error("Dotted Fields not allowed [" + (pField ? (pField + ">>" + fields[i].field) : fields[i].field) + "]");
            }
            if (fields[i].fields) {
                validateFields(fields[i].fields, (pField ? (pField + ">>" + fields[i].field) : fields[i].field));
            }
        }
    }
}

module.exports = Collection;

Collection.prototype.find = function (query, options) {
    return this.mongoCollection.find(query, options);
}

Collection.prototype.count = function (query, options, callback) {
    return this.mongoCollection.find(query, options).count(callback);
}

Collection.prototype.aggregate = function (pipeline, callback) {
    return this.mongoCollection.aggregate(pipeline, callback);
}

Collection.prototype.upsert = function (query, update, fields, modules, options, callback) {
    var that = this;
    if (typeof modules == "function") {
        callback = modules;
        options = {w:1};
        modules = undefined;
    } else if (typeof options == "function") {
        callback = options;
        options = modules;
        modules = undefined;
    }
    var queryTogetData = {};
    queryTogetData[Constants.Query.COLLECTION] = that.options && that.options[Constants.Admin.Collections.COLLECTION] ? that.options : that.mongoCollection.collectionName;
    queryTogetData[Constants.Query.FIELDS] = fields;
    if (query === undefined || Object.keys(query).length == 0) {
        if (update && update.$set === undefined) {
            throw new Error("$set in mandatory in upsert without query");
        }
        var newInsert = update.$set || {};
        that.insert(newInsert, modules, options, function (err, result) {
            if (err) {
                callback(err);
                return;
            }
            queryTogetData[Constants.Query.FILTER] = {_id:result[0]._id};
            that.db.query(queryTogetData, function (err, finalResult) {
                if (err) {
                    callback(err);
                    return;
                }
                callback(null, finalResult.result[0]);
            });
        });
    } else {
        queryTogetData[Constants.Query.FILTER] = query;
        queryTogetData[Constants.Query.LIMIT] = 2;
        that.db.query(queryTogetData, function (err, data) {
            if (err) {
                callback(err);
                return;
            } else {
                if (data && data.result && data.result.length > 0) {
                    if (data.result.length > 1) {
                        throw Error("Mulitple Records found corresponding to [" + query + "] in collection [" + this.mongoCollection.collectionName + "]");
                    } else {
                        if (update.$set || update.$pull || update.$push || update.$unset) {
                            that.updateById(data.result[0]._id, update, modules, options, function (err, result) {
                                if (err) {
                                    callback(err);
                                    return;
                                }
                                queryTogetData[Constants.Query.FILTER] = {_id:data.result[0]._id};
                                that.db.query(queryTogetData, function (err, finalResult) {
                                    if (err) {
                                        callback(err);
                                        return;
                                    }
                                    callback(null, finalResult.result[0]);
                                });
                            });
                        } else {
                            callback(null, data.result[0]);
                        }
                    }
                } else {
                    var newInsert = update.$set || {};
                    for (var key in query) {
                        if (!newInsert[key]) {
                            newInsert[key] = query[key];
                        }
                    }
                    that.insert(newInsert, modules, options, function (err, result) {
                        if (err) {
                            callback(err);
                            return;
                        }
                        that.db.query(queryTogetData, function (err, finalResult) {
                            if (err) {
                                callback(err);
                                return;
                            }
                            callback(null, finalResult.result[0]);
                        });
                    });
                }
            }
        });
    }
}

Collection.prototype.insert = function (inserts, modules, options, callback) {
    if (typeof modules == "function") {
        callback = modules;
        options = {w:1};
        modules = undefined;
    } else if (typeof options == "function") {
        callback = options;
        options = modules;
        modules = undefined;
    }

    var that = this;
    var docId = Utils.getUnique();
//    if (!inserts._id) {
//        inserts._id = Utils.getUnique();
//    }
    Utils.populate_IdInArray(inserts);
    var document = new Document(inserts, null, "insert");
    ModuleManager.preInsert(docId, document, modules, that, that.db, function (err) {
        if (err) {
            callback(err);
            return;
        }
        if (document.cancelUpdates) {
            callback();
            return;
        }
        prepareInserts(inserts);
        that.mongoCollection.insert(inserts, options, function (err, result) {
            if (err) {
                callback(err);
                return;
            }
            document.updates = result[0];
            ModuleManager.postInsert(docId, document, modules, that, that.db, function (err) {
                if (err) {
                    callback(err);
                    return;
                }
                callback(null, result);
            });
        });
    });
};

Collection.prototype.insertAsPromise = function (inserts, modules, options) {
    var d = Q.defer();
    options = options || {w:1};
    var that = this;
    var docId = Utils.getUnique();
    var document = new Document(inserts, null, "insert");
    var events = undefined;
    Utils.populate_IdInArray(inserts);
    that.getAsPromise(Constants.Admin.Collections.EVENTS).then(
        function (collectionEvents) {
            events = collectionEvents;
            return EventManager.triggerEvents("onInsert", document, events, that.db);
        }).then(
        function () {
            return EventManager.triggerEvents("onSave", document, events, that.db, {pre:true});
        }).then(
        function () {
            var d1 = Q.defer();
            Q.delay(0).then(
                function () {
                    prepareInserts(inserts);
                    that.mongoCollection.insert(inserts, options, function (err, result) {
                        if (err) {
                            d1.reject(err)
                            return;
                        }
                        d1.resolve(result[0]);
                    });
                }).fail(function (err) {
                    d1.reject(err);
                })

            return d1.promise;
        }).then(
        function (insertedValue) {
            document.updates._id = insertedValue._id;
            return EventManager.triggerEvents("onSave", document, events, that.db, {post:true});
        }).then(
        function () {
            d.resolve();
        }).fail(function (err) {
            d.reject(err);
        })
    return d.promise;
};

Collection.prototype.findAndModify = function (update, options, callback) {
    this.db.findAndModify(update, options, function (err, data) {
        if (err) {
            callback(err);
            return;
        } else {
            callback(null, data);
        }
    })

}

Collection.getOldData = function (id, update, collection, callback) {
    if (update && update.$oldData) {
        var oldData = update.$oldData;
        delete update.$oldData;
        callback(null, oldData);
        return;
    }
    var query = {};
    query[Constants.Query.COLLECTION] = collection.options && collection.options[Constants.Admin.Collections.COLLECTION] ? collection.options : collection.mongoCollection.collectionName;
    query[Constants.Query.FILTER] = {"_id":id};
    collection.db.query(query, function (err, data) {
        if (err) {
            callback(err);
            return;
        } else {
            var oldData = data.result[0];
            callback(null, oldData);
        }
    })
}

Collection.prototype.updateById = function (id, update, modules, options, callback) {
    if (!id) {
        callback(new Error("_id is mandatory in case of UpdateById."));
        return;
    }
    if (typeof modules == "function") {
        callback = modules;
        options = {w:1};
        modules = undefined;
    } else if (typeof options == "function") {
        callback = options;
        options = modules;
        modules = undefined;
    }
    var that = this;
    Collection.getOldData(id, update, that, function (err, oldData) {
        if (err) {
            callback(err);
            return;
        } else {
            var docId = Utils.getUnique();
            var document = new Document(update, oldData, "update");
            ModuleManager.preUpdate(docId, document, modules, that, that.db, function (err) {
                if (err) {
                    callback(err);
                    return;
                }
                if (document.cancelUpdates) {
                    callback(null, 0);
                    return;
                }
                that.get("fields", function (err, fields) {
                    if (err) {
                        callback(err);
                        return;
                    }
                    console.log("document>>>>>>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(document));
                    var newUpdates = {};
                    newUpdates.query = {_id:id};
                    var arrayUpdates = [];
                    modifyUpdates(document, newUpdates, arrayUpdates, id, fields);
                    var pushUpdates = newUpdates.$push;
                    var pullUpdates = newUpdates.$pull;
                    delete newUpdates.$push;
                    delete newUpdates.$pull;
                    if (newUpdates.$set || newUpdates.$unset || newUpdates.$inc) {
                        arrayUpdates.push(newUpdates);
                    }
                    if (pushUpdates && Object.keys(pushUpdates).length > 0) {
                        arrayUpdates.push({query:{_id:id}, $push:pushUpdates});
                    }
                    if (pullUpdates && Object.keys(pullUpdates).length > 0) {
                        arrayUpdates.push({query:{_id:id}, $pull:pullUpdates});
                    }
                    console.log("arrayUPdate>>>>>>>>>." + JSON.stringify(arrayUpdates));
                    var finalResult = {};
                    Utils.iterateArray(arrayUpdates, function (err) {
                        if (err) {
                            callback(err);
                            return;
                        }
                        ModuleManager.postUpdate(docId, document, modules, that, that.db, function (err) {
                            if (err) {
                                callback(err);
                                return;
                            }
                            callback(null, finalResult);

                        });
                    }, function (newUpdate, callback) {
                        var query = newUpdate.query;
                        delete newUpdate.query;
                        if (!newUpdate || Object.keys(newUpdate).length == 0) {
                            callback();
                            return;
                        }
                        that.mongoCollection.update(query, newUpdate, options, function (err, result) {
                            if (err) {
                                callback(err);
                                return;
                            }
                            finalResult = result;
                            callback(null, result);
                        })

                    });
                });
            });
        }
    });
}

Collection.prototype.updateAsPromise = function (id, update, modules, options) {
    Utils.populate_IdInArray(update);
    var d = Q.defer();
    if (!id) {
        d.reject(new Error("_id is mandatory in case of UpdateById."));
        return d.promise;
    }
    if (!options) {
        options = {w:1};
    }
    var that = this;
    Collection.getOldData(id, update, that, function (err, oldData) {
        if (err) {
            d.reject(err);
            return;
        } else {
            var docId = Utils.getUnique();
            var document = new Document(update, oldData, "update");
            var events = undefined;
            var fields = undefined;

            that.getAsPromise(Constants.Admin.Collections.EVENTS).then(
                function (collectionEvents) {
                    events = collectionEvents;
                    return that.getAsPromise("fields")
                }).then(
                function (collectionFields) {
                    fields = collectionFields;
                    return EventManager.triggerEvents("onValue", document, events, that.db);
                }).then(
                function () {
                    return EventManager.triggerEvents("onSave", document, events, that.db, {pre:true});
                }).then(
                function () {
                    document.oldRecord = oldData;
                    var d1 = Q.defer();

//                    d1.resolve();
//                    return d1.promise;

                    var newUpdates = {};
                    newUpdates.query = {_id:id};
                    var arrayUpdates = [];
                    modifyUpdates(document, newUpdates, arrayUpdates, id, fields);
                    var pushUpdates = newUpdates.$push;
                    var pullUpdates = newUpdates.$pull;
                    delete newUpdates.$push;
                    delete newUpdates.$pull;
                    if (newUpdates.$set || newUpdates.$unset || newUpdates.$inc) {
                        arrayUpdates.push(newUpdates);
                    }
                    if (pushUpdates && Object.keys(pushUpdates).length > 0) {
                        arrayUpdates.push({query:{_id:id}, $push:pushUpdates});
                    }
                    if (pullUpdates && Object.keys(pullUpdates).length > 0) {
                        arrayUpdates.push({query:{_id:id}, $pull:pullUpdates});
                    }
                    Utils.iterateArrayWithPromise(arrayUpdates,
                        function (index, newUpdate) {
                            var d11 = Q.defer();

                            var query = newUpdate.query;
                            delete newUpdate.query;
                            that.mongoCollection.update(query, newUpdate, options, function (err, result) {
                                if (err) {
                                    d11.reject(err);
                                    return;
                                }
                                d11.resolve(result);
                            })
                            return d11.promise;
                        }).then(
                        function () {
                            d1.resolve();
                        }).fail(function (err) {
                            d1.reject(err);
                        })
                    return d1.promise;
                }).then(
                function () {
                    return EventManager.triggerEvents("onSave", document, events, that.db, {post:true});
                }).then(
                function () {
                    d.resolve();
                }).fail(function (err) {
                    d.reject(err);
                })


        }
    });
    return d.promise;
}

Collection.prototype.removeAsPromise = function (id, update, modules, options) {
    var d = Q.defer();
    if (!id) {
        d.reject(new Error("_id is mandatory in case of UpdateById."));
        return d.promise;
    }
    if (!options) {
        options = {w:1};
    }
    var that = this;
    var query = {};
    query[Constants.Query.COLLECTION] = this.options && this.options[Constants.Admin.Collections.COLLECTION] ? this.options : this.mongoCollection.collectionName;
    query[Constants.Query.FILTER] = {"_id":id};
    that.db.query(query, function (err, data) {
        if (err) {
            d.reject(err);
            return;
        } else {
            var oldData = data.result[0];
            var docId = Utils.getUnique();
            var newUpdates = {_id:oldData._id, $unset:{}};
            for (var k in oldData) {
                newUpdates.$unset[k] = "";
            }
            delete newUpdates.$unset._id;
            var document = new Document(newUpdates, oldData, "delete");
            var events = undefined;

            that.getAsPromise(Constants.Admin.Collections.EVENTS).then(
                function (collectionEvents) {
                    events = collectionEvents;
                    return EventManager.triggerEvents("onValue", document, events, that.db);
                }).then(
                function () {
                    return EventManager.triggerEvents("onSave", document, events, that.db, {pre:true});
                }).then(
                function () {
                    var d1 = Q.defer();

                    that.mongoCollection.remove({_id:oldData._id}, options, function (err, result) {
                        if (err) {
                            d1.reject(err);
                            return;
                        }
                        d1.resolve(result);
                    })
                    return d1.promise;
                }).then(
                function () {
                    return EventManager.triggerEvents("onSave", document, events, that.db, {post:true});
                }).then(
                function () {
                    d.resolve();
                }).fail(function (err) {
                    d.reject(err);
                })


        }
    });
    return d.promise;
}

Collection.prototype.update = function (query, update, options, callback) {
    var that = this;
//    update.$set = update.$set || {};
    var found = checkDollar(update.$set);
    var multiple = options ? options.multi : false;
    if (found && multiple) {
        if (validateFilter(query, that, options, update)) {
            that.mongoCollection.find(query).batchSize(10).each(function (err, document) {
                if (document != null) {
                    var queryPart = getQueryPart(update.$set);
                    var toSet = getToSet(update.$set);
                    var recordId = document["_id"];
                    var newSet = modifySet(update.$set, Object.keys(query)[0], that, options);
                    var isMultipleDollar = checkMultipleDollar(update.$set);
                    handleDollarUpdates(that, options, query, update, Object.keys(query)[0], query[Object.keys(query)[0]], newSet, document, queryPart, toSet, recordId, !isMultipleDollar, null);
                } else {
                    callback(null, {});
                }
            });
        }
    } else {
        that.mongoCollection.update(query, update, options, function (err, result) {
            if (err) {
                callback(err);
                return;
            }
            callback(null, result);
        });
    }
}

Collection.prototype.removeById = function (id, modules, options, callback) {
    if (!id) {
        callback(new Error("_id is mandatory in case of removeById."));
        return;
    }
    if (typeof modules == "function") {
        callback = modules;
        options = {w:1};
        modules = undefined;
    } else if (typeof options == "function") {
        callback = options;
        options = modules;
        modules = undefined;
    }
    var query = {};
    query[Constants.Query.COLLECTION] = this.options && this.options[Constants.Admin.Collections.COLLECTION] ? this.options : this.mongoCollection.collectionName;
    query[Constants.Query.FILTER] = {"_id":id};
    var that = this;
    that.db.query(query, function (err, data) {
        if (err) {
            callback(err);
            return;
        } else {
            var oldData = data.result[0];
            var docId = Utils.getUnique();
            var document = new Document({"_id":id}, oldData, "delete");
            ModuleManager.preDelete(docId, document, modules, that, that.db, function (err) {
                if (err) {
                    callback(err);
                    return;
                }
                if (document.cancelUpdates) {
                    callback(null, 0);
                    return;
                }
                that.mongoCollection.remove({_id:id}, options, function (err, result) {
                    if (err) {
                        callback(err);
                        return;
                    }
                    ModuleManager.postDelete(docId, document, modules, that, that.db, function (err) {
                        if (err) {
                            callback(err);
                            return;
                        }
                        callback(null, result);
                    })
                });
            });
        }
    });
}

Collection.prototype.remove = function (id, options, callback) {
    this.mongoCollection.remove(id, options, callback);
}

Collection.prototype.addField = function (field, callback) {
    // save in database
}

Collection.prototype.get = function (key, callback) {
    if (key == Constants.Admin.Collections.COLLECTION) {
        callback(null, this.mongoCollection.collectionName);
    } else if (this.options && this.options[key]) {
        callback(null, this.options[key]);
    } else if (key == Constants.Admin.Collections.REFERRED_FKS) {
        getReferredFks.call(this, this.options, function (err, referredFks) {
            if (err) {
                callback(err);
                return;
            }
            callback(null, referredFks);
        })
    } else {
        callback();
    }
}

Collection.prototype.getAsPromise = function (key) {
    var that = this;
    var D = Q.defer();
    if (key == Constants.Admin.Collections.COLLECTION) {
        D.resolve(that.mongoCollection.collectionName);
    } else if (that.options && that.options[key]) {
        var value = that.options[key];
        if (key == Constants.Admin.Collections.EVENTS) {
            populateEvents(value);
        }
        D.resolve(value);
    } else if (key == Constants.Admin.Collections.REFERRED_FKS) {
        getReferredFks.call(that, that.options, function (err, referredFks) {
            if (err) {
                D.reject(err);
                return;
            }
            D.resolve(referredFks);
        })
    } else {
        D.resolve();
    }
    return D.promise;

}

function populateEvents(events) {
    for (var i = 0; i < events.length; i++) {
        var event = events[i];
        var eventDef = event.event;
        var indexOf = eventDef.indexOf(":");
        if (indexOf < 0) {
            event.eventName = eventDef;
        } else {
            event.eventName = eventDef.substring(0, indexOf);
            event.fields = JSON.parse(eventDef.substring(indexOf + 1));
        }
    }
}

function getReferredFks(options, callback) {
    if (!options || !options._id) {
        callback();
        return;
    }
    var query = {};
    query[Constants.Query.COLLECTION] = Constants.Admin.REFERRED_FKS;
    var fields = {};
    fields[Constants.Admin.ReferredFks.COLLECTION_ID + "._id"] = 1;
    fields[Constants.Admin.ReferredFks.COLLECTION_ID + "." + Constants.Admin.Collections.COLLECTION] = 1;
    fields[Constants.Admin.ReferredFks.FIELD] = 1;
    fields[Constants.Admin.ReferredFks.SET] = 1;
//    fields[Constants.Admin.ReferredFks.COLLECTION_ID] = 1;
    query[Constants.Query.FIELDS] = fields;
    query[Constants.Query.FILTER] = {"referredcollectionid._id":options._id};
    this.db.query(query, function (err, res) {
        if (err) {
            callback(err);
            return;
        }
        var referredFks = res.result;
        options[Constants.Admin.Collections.REFERRED_FKS] = referredFks;
        callback(null, referredFks);
    });

}

Collection.prototype.ensureIndex = function (callback) {
    // save in database
}

function handleUnsetAndIncUpdates(updates, operation, operator, pExpression, pIndex) {
    if (operation[operator] === undefined) {
        return;
    }
    var newOperation = operation[operator];
    newOperation = newOperation || {};
    var keys = Object.keys(newOperation);
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        updates[operator] = updates[operator] || {};
        var newKey = pExpression ? pIndex ? pExpression + "." + pIndex + "." + key : pExpression + "." + key : key;
        updates[operator][newKey] = newOperation[key];
        if (pExpression) {
            delete newOperation[key];
        }
    }
    if (pExpression) {
        if (Object.keys(newOperation).length === 0) {
            delete operation[operator];
        }
    }

}

function fetchIndex(query, oldData) {

    var indexes = [];
    var length = oldData ? oldData.length : 0;
    for (var i = 0; i < length; i++) {
        if (Utils.evaluateFilter(query, oldData[i])) {
            indexes.push({index:i, data:oldData[i]});
        }
    }
    return indexes;
}

function populateMap(object) {
    var keys = Object.keys(object);
    var newMap = {};
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var index = key.indexOf(".");
        if (index !== -1) {
            var firstPart = key.substr(0, index);
            var lastPart = key.substr(index + 1);
            index = lastPart.indexOf(".");
            while (index !== -1) {
                var secondPart = lastPart.substr(0, index);
                if (!isNaN(Number(secondPart))) {
                    var thirdPart = lastPart.substr(index + 1);
                    newMap[firstPart] = newMap[firstPart] || {};
                    newMap[firstPart][secondPart] = newMap[firstPart][secondPart] || {};
                    newMap[firstPart][secondPart][thirdPart] = object[key];
                    newMap[firstPart][secondPart] = populateMap(newMap[firstPart][secondPart]);
                    break;
                }
                firstPart = firstPart + "." + secondPart;
                lastPart = lastPart.substr(index + 1);
                index = lastPart.indexOf(".");
            }
            if (index == -1) {
                newMap[key] = newMap[key] || {}
                if (object[key][Constants.Update.QUERY]) {
                    newMap[key][Constants.Update.QUERY] = object[key][Constants.Update.QUERY];
                } else {
                    newMap[key][Constants.Update.QUERY] = object[key];
                }
            }
        } else {
            newMap[key] = newMap[key] || {}
            if (object[key][Constants.Update.QUERY]) {
                newMap[key][Constants.Update.QUERY] = object[key][Constants.Update.QUERY];
            } else {
                newMap[key][Constants.Update.QUERY] = object[key];
            }
        }
    }
    return newMap;
}

function validateFilter(filter, that, options, update) {
    filter = filter || {};
    var keys = Object.keys(filter);
    var value = filter[keys[0]];
    if (Array.isArray(value) || Utils.isJSONObject(value)) {
        var message = "value cannot be jsonobject or array for filter [" + JSON.stringify(filter) + "]";
        insertLogs(that, options, message, update);
//        throw new Error("value cannot be jsonobject or array for filter [" + JSON.stringify(filter) + "]");
    }
    if (keys.length > 1 || keys.indexOf("$or") !== -1 || keys.indexOf("$and") !== -1) {
        var message = "filter not supported [" + JSON.stringify(filter) + "]";
        insertLogs(that, options, message, update);
//        throw Error("filter not supported");
    }
    return true;
}


function prepareInserts(inserts) {
    var keys = Object.keys(inserts);
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (Utils.isJSONObject(inserts[key])) {
            if (inserts[key].$insert) {
                inserts[key] = inserts[key].$insert;
            }
            for (var j = 0; j < inserts[key].length; j++) {
                prepareInserts(inserts[key][j]);
            }
        } else if (Array.isArray(inserts[key])) {
            for (var j = 0; j < inserts[key].length; j++) {
                if (Utils.isJSONObject(inserts[key][j])) {
                    prepareInserts(inserts[key][j]);
                }
            }
        }
    }
}


Collection.prototype.mongoInsert = function (inserts, options, callback) {
    if (!inserts._id) {
        inserts._id = Utils.getUnique();
    }
    prepareInserts(inserts);
    this.mongoCollection.insert(inserts, options, function (err, result) {
        if (err) {
            callback(err);
            return;
        }
        callback(null, result);
    });
}


function handleSimpleFields(document, newUpdate, field, pExpression) {
    var newField = pExpression ? pExpression + "." + field : field;
    if (document.updates && document.updates.$inc && document.updates.$inc[field] !== undefined) {
        newUpdate.$inc = newUpdate.$inc || {};
        newUpdate.$inc[newField] = document.get(field);
    } else if (document.updates && document.updates.$set && document.updates.$set[field] !== undefined) {
        newUpdate.$set = newUpdate.$set || {};
        newUpdate.$set[newField] = document.get(field);
    } else if (document.updates && document.updates.$unset && document.updates.$unset[field] !== undefined) {
        newUpdate.$unset = newUpdate.$unset || {};
        newUpdate.$unset[newField] = "";
    } else if (document.updates && document.updates[field] !== undefined) {
        newUpdate.$set = newUpdate.$set || {};
        newUpdate.$set[newField] = document.updates[field];
    }
}
function createFilter(document, id, newParentExp) {
    var query = {};
    if (document.updates && document.updates.$query !== undefined) {
        query = document.updates.$query;
    } else {
        query._id = document.updates._id;
    }
    var newQuery = {};
    for (var key in query) {
        newQuery[newParentExp + "." + key] = query[key];
    }
    newQuery._id = id;
    return newQuery;
}
function modifyUpdates(document, newUpdate, arrayUpdates, id, allFields, pExpression) {
    if (document && document.updates === null) {
        newUpdate.$unset = newUpdate.$unset || {};
        newUpdate.$unset[pExpression] = "";
    }
    var fields = document.getUpdatedFields();
    var fieldCount = fields ? fields.length : 0;
    for (var i = 0; i < fieldCount; i++) {
        var field = fields[i];
        console.log("field****************" + field);
        var documents = document.getDocuments(field);
        console.log("doc*** field>>>>>>>>>." + JSON.stringify(documents));
        if (documents) {
            var newParentExp = pExpression ? pExpression + "." + field : field;
            if (Array.isArray(documents)) {
                var updates = document && document.updates && document.updates.$set && document.updates.$set[field];
                if (updates && (updates.$insert || updates.$delete || updates.$update)) {
                    var insertDocuments = document.getDocuments(field, ["insert"]);
                    handleInsertDocuments(insertDocuments, newUpdate, allFields, newParentExp);
                    var deleteDocuments = document.getDocuments(field, ["delete"]);
                    handleDeleteDocuments(deleteDocuments, newUpdate, newParentExp);
                    var updateDocuments = document.getDocuments(field, ["update"]) || [];
                    for (var j = 0; j < updateDocuments.length; j++) {
                        var query = createFilter(updateDocuments[j], id, newParentExp);
                        var update = {};
                        update.query = query;
                        var newParentExp = pExpression ? pExpression + "." + field : field;
                        handleUpdateDocuments(updateDocuments[j], update, newParentExp + ".$");
                        arrayUpdates.push(update);
                    }
                } else {
                    var newParentExp = pExpression ? pExpression + "." + field : field;
                    newUpdate.$set = newUpdate.$set || {};
                    newUpdate.$set[newParentExp] = document.get(field);
                }
            } else {
                if (documents && documents.updates && documents.updates.$set === undefined && documents.updates.$unset === undefined && documents.updates.$inc === undefined) {
                    newUpdate.$set = newUpdate.$set || {};
                    newUpdate.$set[newParentExp] = documents.updates;
                } else {
                    if (documents && documents.updates === null && document.updates.$set !== undefined && document.updates.$set[field] === null) {
                        newUpdate.$set = newUpdate.$set || {};
                        newUpdate.$set[newParentExp] = null;
                    } else {
                        console.log("else case in object" + newParentExp);
                        modifyUpdates(documents, newUpdate, arrayUpdates, id, allFields ? allFields[field] : null, newParentExp);
                    }
                }

            }
        }
        else {
            handleSimpleFields(document, newUpdate, field, pExpression);
        }
    }
}

function handleDeleteDocuments(documents, newUpdate, expression) {
    var pull = newUpdate.$pull ? newUpdate.$pull : {};
    var filters = [];
    var filterKey = null;
    for (var i = 0; i < documents.length; i++) {
        var operation = documents[i].updates ? documents[i].updates : documents[i].oldRecord;
        operation = operation.$query ? operation.$query : operation;
        if (Utils.isJSONObject(operation)) {
            filterKey = Object.keys(operation)[0];
            filters.push(operation[filterKey]);
        } else {
            filters.push(operation);
        }
    }

    if (filterKey) {
        var newFilter = {};
        newFilter[filterKey] = {"$in":filters};
        pull[expression] = newFilter;
    } else {
        if (filters.length > 0) {
            pull[expression] = {"$in":filters};
        }
    }
    newUpdate.$pull = pull;
}


function handleInsertDocuments(documents, newUpdate, fields, expression) {
    var inserts = [];
    for (var i = 0; i < documents.length; i++) {
        inserts.push(documents[i].updates);
    }
    var push = newUpdate.$push ? newUpdate.$push : {};
    var sortExp = getSortExpression(fields, expression);
    var sort = {};
    sortExp = sortExp !== undefined ? sortExp : "_id";
    sort[sortExp] = 1;
    push[expression] = {"$each":inserts, $sort:sort, $slice:-20000};
    newUpdate.$push = push;
}

function handleUpdateDocuments(document, newUpdate, pExp) {
    var updatedFields = document.getUpdatedFields();
    if (updatedFields) {
        for (var i = 0; i < updatedFields.length; i++) {
            var field = updatedFields[i];
            var documents = document.getDocuments(field);
            if (documents) {
                var newParentExp = pExp ? pExp + "." + field : field;
                if (Array.isArray(documents)) {
                    var nestedArray = [];
                    for (var j = 0; j < documents.length; j++) {
                        if (documents[j].type !== "delete") {
                            nestedArray.push(documents[j].convertToJSON());
                        }
                    }
                    newUpdate.$set = newUpdate.$set || {};
                    newUpdate.$set[newParentExp] = nestedArray;
                } else {
                    handleUpdateDocuments(documents, newUpdate, newParentExp);
                }
            } else {
                handleSimpleFields(document, newUpdate, field, pExp);
            }
        }
    }
}

function handleDollarUpdates(that, options, query, originalSet, queryKey, queryValue, modifiedSet, document, queryPart, toSet, recordId, isSingleDollar, parentExp) {
    if (queryKey !== undefined) {
        var key = queryKey.substr(0, queryKey.indexOf("."));
        var restPart = queryKey.substr(queryKey.indexOf(".") + 1);
        if (queryPart === parentExp) {
            if (Utils.isJSONObject(document)) {
                handleNested(that, options, query, originalSet, queryKey, queryValue, modifiedSet, document, queryPart, toSet, recordId, isSingleDollar);
            } else {
                var message = "Value  should be Jsonobject at break point but found [" + typeof document + "]";
                insertLogs(that, options, message, originalSet);
//                throw new Error("Value  should be Jsonobject at break point but found [" + typeof document + "]")
            }
        } else {
            var value = document[key];
            if (Array.isArray(value)) {
                for (var j = 0; j < value.length; j++) {
                    handleDollarUpdates(that, options, query, originalSet, restPart, queryValue, modifiedSet, value[j], queryPart, toSet, recordId, isSingleDollar, parentExp ? parentExp + "." + key : key);
                }
            } else if (Utils.isJSONObject(value)) {
                handleDollarUpdates(that, options, query, originalSet, restPart, queryValue, modifiedSet, value, queryPart, toSet, recordId, isSingleDollar, parentExp ? parentExp + "." + key : key);
            }
            else {
                var message = "value should be array of object for field [" + key + "]";
                insertLogs(that, options, message, originalSet);
            }
        }
    }
    else {
        return;
    }
}


function checkDollar(setUpdates) {
    setUpdates = setUpdates || {};
    var keys = Object.keys(setUpdates);
    var found = false;
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var index = key.indexOf(".$.");
        if (index !== -1) {
            return true;
        }
    }
    return false;
}

function getQueryPart(setUpdates) {
    var firstKey = Object.keys(setUpdates)[0];
    var index = firstKey.indexOf(".$.");
    return firstKey.substr(0, index);
}

function getToSet(setUpdates) {
    var firstKey = Object.keys(setUpdates)[0];
    var index = firstKey.indexOf(".$.");
    var rest = firstKey.substr(index + 3);
    var dotIndex = rest.indexOf(".");
    if (dotIndex > 0) {
        return rest.substr(0, dotIndex);
    } else {
        return rest;
    }
}

function seperateByDot(query, keys) {
    if (query !== undefined) {
        var index = query.indexOf(".");
        var firstPart = query.substr(0, index);
        keys.push(firstPart);
        var rest = query.substr(index + 1);
        if (rest.indexOf(".") !== -1) {
            seperateByDot(rest, keys);
        } else {
            keys.push(rest);
        }
        return keys;
    }
}

function handleNested(that, options, query, originalSet, queryKey, queryValue, modifiedSet, document, queryPart, toSet, recordId, isSingleDollar) {
    if (!Utils.isJSONObject(document)) {
//        throw Error("document should be object");
        var message = "document should be object at break point but found [" + JSON.stringify(document) + "]";
        insertLogs(that, options, message, originalSet);
    }
    if (isSingleDollar) {
        handleSingleDollar(that, options, query, queryKey, queryValue, originalSet, document, document._id, queryPart, recordId);
    } else {
        var targetValue = document[toSet];
        if (targetValue !== undefined) {
            if (Array.isArray(targetValue) || Utils.isJSONObject(targetValue)) {
                var restQueryPart = queryKey.substr(queryKey.indexOf(".") + 1);
                var isChanged = prepareNestedUpdates(restQueryPart, queryValue, originalSet, modifiedSet, targetValue);
                if (isChanged) {
                    finalUpdateOnMongo(that, options, document, recordId, queryPart, toSet, targetValue, originalSet);
                } else {
                    return;
                }
            }
        } else {
            return
        }
    }
}

function modifySet(setUpdates, queryKey, that, options) {
    var newSet = {};
    var lastIndexofDot = queryKey.lastIndexOf(".");
    var partToRemove = queryKey.substr(0, lastIndexofDot + 1);
    var keys = Object.keys(setUpdates);
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var keyWithoutDollar = removeDollars(key);
        if (keyWithoutDollar.indexOf(partToRemove) < 0) {
//            throw new Error("operation not supported with updates in set [" + JSON.stringify(setUpdates) + "]");
            var message = "operation not supported with updates in set [" + JSON.stringify(setUpdates) + "]";
            insertLogs(that, options, message, setUpdates);
        }
        var newKey = keyWithoutDollar.substring(partToRemove.length);

        newSet[newKey] = setUpdates[key];
    }
    return newSet;
}

function prepareNestedUpdates(query, queryValue, originalSet, modifiedSet, targetValue) {
    if (Array.isArray(targetValue)) {
        var updated = false;
        for (var i = 0; i < targetValue.length; i++) {
            var nestedpdated = prepareNestedUpdates(query, queryValue, originalSet, modifiedSet, targetValue[i]);
            updated = updated || nestedpdated;
        }
        return updated;
    } else if (Utils.isJSONObject(targetValue)) {
        if (query.indexOf(".") >= 0) {
            var queryFirstPart = query.substr(0, query.indexOf("."));
            var queryRestPart = query.substr(query.indexOf(".") + 1);
            var value = targetValue[queryFirstPart];
            return prepareNestedUpdates(queryRestPart, queryValue, originalSet, modifiedSet, value);
        } else {
            if (targetValue[query] === queryValue) {
                updateValue(targetValue, modifiedSet);
                return true;
            } else {
                return false;
            }
        }
    } else {
        return false;
    }
}

function removeDollars(key) {
    if (key.indexOf(".$.") !== -1) {
        var replacedKey = key.replace(".$.", ".");
        return removeDollars(replacedKey);
    } else {
        return key;
    }
}

function updateValue(targetValue, modifiedSet) {
    for (var key in modifiedSet) {
        finalUpdate(targetValue, key, modifiedSet[key])
    }
}

function finalUpdate(targetValue, key, value, parentExp) {
    if (key.indexOf(".") !== -1) {
        var firstPart = key.substr(0, key.indexOf("."));
        var rest = key.substr(key.indexOf(".") + 1);
        targetValue[firstPart] = targetValue[firstPart] || {};
        finalUpdate(targetValue, rest, value, firstPart);
    } else {
        if (parentExp) {
            var parentValue = targetValue[parentExp];
            parentValue[key] = value;
        } else {
            targetValue[key] = value;
        }
    }
}

function insertLogs(that, options, message, updates) {
    var update = {};
    update[Constants.Query.COLLECTION] = "pl.logs";
    var insert = {message:message, updates:JSON.stringify(updates)};
    update[Constants.Update.INSERT] = insert;
    that.db.batchUpdate(update, options, function (err) {
    });
}

function finalUpdateOnMongo(that, options, document, recordId, queryPart, toSet, targetValue, originalSet) {
    var query = {};
    query["_id"] = recordId;
    query[queryPart + "._id" ] = document["_id"];
    var set = {};
    set.$set = {};
    set.$set[queryPart + ".$." + toSet] = targetValue;
    that.mongoCollection.update(query, set, options, function (err, data) {
        if (err) {
            var message = "error while updating with  [" + query + "]  and updates >>[" + set + "]>>> and err message [" + err.message + "]";
            insertLogs(that, options, message, originalSet);
            throw new Error("err>>" + err.message);
        }
    });
}


function checkSingleDollar(setUpdates) {
    var keys = Object.keys(setUpdates);
    var found = false;
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var index = key.indexOf(".$.");
        if (index !== -1) {
            return true;
        } else {
            return false;
        }
    }
}

function checkMultipleDollar(setUpdates) {
    var keys = Object.keys(setUpdates);
    var found = false;
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var index = key.indexOf(".$.");
        if (index !== -1) {
            var first = key.substr(0, index);
            var second = key.substr(index + 3);
            var secondIndex = second.indexOf(".$.");
            if (secondIndex !== -1) {
                found = true;
                break;
            }
        }
    }
    if (found) {
        return true;
    } else {
        return false;
    }
}
function handleSingleDollar(that, options, query, queryKey, queryValue, originalSet, document, documentId, queryPart, recordId) {
    if (queryKey.indexOf(".") > 0) {
        var firstpart = queryKey.substr(0, queryKey.indexOf("."));
        var restKey = queryKey.substr(queryKey.indexOf(".") + 1);
        handleSingleDollar(that, options, query, restKey, queryValue, originalSet, document[firstpart], documentId, queryPart, recordId);
    } else {
        if (queryValue === document[queryKey]) {
            var query = {};
            query["_id"] = recordId;
            query[queryPart + "._id"] = documentId;
            that.mongoCollection.update(query, originalSet, options, function (err, result) {
                if (err) {
                    insertLogs(that, options, err.message, originalSet);
                }
            });
        } else {
            return;
        }
    }

}
function getSortExpression(fields, expression) {
    fields = fields || [];
    for (var i = 0; i < fields.length; i++) {
        if (fields[i].field === expression) {
            return fields[i].sort;
        }
    }
}
