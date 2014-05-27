var Utility = require("ApplaneCore/apputil/util.js")
var Constants = require("./Constants.js");
/**
 *  Module Sequence is required for Child Module.
 *  We need to run module in different sequences in case of update and query.
 *
 *  Also Clone of document is Required in update in child bcz Child Data removed from document before insert/Update/Delete and we need that data in post update/insert/delete to insert record in child
 *  like deliveries saved from orders.Deliveries removed when order saved.but we need to save/update deliveries after that in post.
 *
 *  Clone of Query is Required in subQuery as fields of subquery removed in doQuery and that fields are required for merging result in doResult.
 *
 *  For Clone Creation,We need to define query:"pre" in case of Query and document:"pre" in case of Update
 */
var modules = [
    {index:1, name:"UDT", path:"./modules/UDTModule.js", query:"pre", require:{query:["DBRef"], update:["DBRef"]}},
    {index:1, name:"Recursion", path:"./modules/Recursion.js", require:{query:["DBRef"]}},
    {index:1, name:"DBRef", path:"./modules/DBRef.js", require:{query:["SubQuery"], update:["Function"]}},
    {index:1, name:"SubQuery", path:"./modules/SubQuery.js", query:"pre", require:{ query:["Group"], update:false}},
    {index:1, name:"Group", path:"./modules/Group.js", require:{query:["Function"], update:false}},
    {index:1, name:"Function", path:"./modules/Function.js", require:{query:["DataType"], update:["DataType"]}},
    {index:1, name:"Replicate", path:"./modules/Replicate.js", require:{query:false}},
    {index:1, name:"DataType", path:"./modules/DataType.js", require:{query:["TriggerRequiredFields"], update:["TriggerRequiredFields"]}},
    {index:1, name:"TriggerModule", path:"./modules/TriggerModule.js", require:{update:["Child"]}},
    {index:1, name:"Child", path:"./modules/Child.js", document:"pre", require:{query:["SubQuery", "Recursion", "DBRef", "Group"], update:["TransactionModule"]}},
    {index:1, name:"MergeLocalAdminDB", path:"./modules/MergeLocalAdminDB.js", require:{query:false, update:["Transaction"]}},
    {index:1, name:"TriggerRequiredFields", path:"./modules/TriggerRequiredFields.js", require:{query:["TriggerModule"], update:["TriggerModule"]}},
    {index:1, name:"TransactionModule", path:"./modules/TransactionModule.js", require:{query:false}}
];

var Queries = {};
var Docs = {};
var queryModules = [];
var updateModules = [];


exports.getSequence = function (sequenceType) {
    if (sequenceType === "query") {
        return queryModules;
    } else {
        return updateModules;
    }
}

exports.registerModule = function (module) {
    modules.push(module);
    populateModuleSequence("query", true);
    populateModuleSequence("update", true);
}

exports.unRegisterModule = function (name) {
    if (!name) {
        return;
    }
    for (var i = 0; i < modules.length; i++) {
        if (modules[i].name === name) {
            modules.splice(i, 1);
        }
    }
    populateModuleSequence("query", true);
    populateModuleSequence("update", true);
}

exports.doQuery = function (queryId, query, collection, db, callback) {
    populateModuleSequence("query");
    Utility.iterateArray(queryModules, callback, function (module, callback) {
            var moduleRequired = isModuleRequired(query[Constants.Query.MODULES], module);
            if (moduleRequired) {
                if (module.query == "pre") {
                    Queries[queryId] = Queries[queryId] || {};
                    Queries[queryId][module.path] = Utility.deepClone(query);
                }
                var resource = require(module.path);
                var method = module.doQuery || "doQuery";
                if (resource && resource[method]) {
                    resource[method](query, collection, db, callback);
                } else {
                    callback();
                }
            } else {
                callback();
            }
        }
    )
}

exports.doResult = function (queryId, query, result, collection, db, callback) {
    populateModuleSequence("query");
    Utility.iterateArray(queryModules, function (err) {
            delete Queries[queryId];
            callback(err);
        }, function (module, callback) {
            var moduleRequired = isModuleRequired(query[Constants.Query.MODULES], module);
            if (moduleRequired) {
                var moduleQuery = query;
                if (module.query == "pre") {
                    moduleQuery = Queries[queryId][module.path];
                    delete Queries[queryId][module.path];
                }
                var resource = require(module.path);
                var method = module.doResult || "doResult";
                if (resource && resource[method]) {
                    resource[method](moduleQuery, result, collection, db, callback);
                } else {
                    callback();
                }
            }
            else {
                callback();
            }
        }
    )
}

exports.preInsert = function (docId, doc, modulesInfo, collection, db, callback) {
    populateModuleSequence("update");
    Utility.iterateArray(updateModules, callback, function (module, callback) {
            if (isModuleRequired(modulesInfo, module)) {
                if (module.document == "pre") {
                    Docs[docId] = Docs[docId] || {};
                    Docs[docId][module.path] = doc.clone();
                }
                var resource = require(module.path);
                var method = module.preInsert || "preInsert";
                if (resource && resource[method]) {
                    resource[method](doc, collection, db, callback);
                } else {
                    callback();
                }
            } else {
                callback();
            }

        }
    )
}

exports.postInsert = function (docId, doc, modulesInfo, collection, db, callback) {
    populateModuleSequence("update");
    Utility.iterateArray(updateModules, function (err) {
            delete Docs[docId];
            callback(err);
        }, function (module, callback) {
            if (isModuleRequired(modulesInfo, module)) {
                var moduleDoc = doc;
                if (module.document == "pre") {
                    moduleDoc = Docs[docId][module.path];
                    moduleDoc.set("_id", doc.get("_id"));
                    delete Docs[docId][module.path];
                }
                var resource = require(module.path);
                var method = module.postInsert || "postInsert";
                if (resource && resource[method]) {
                    resource[method](moduleDoc, collection, db, callback);
                } else {
                    callback();
                }
            } else {
                callback();
            }
        }
    )
}

exports.preUpdate = function (docId, doc, modulesInfo, collection, db, callback) {
    populateModuleSequence("update");
    Utility.iterateArray(updateModules, callback, function (module, callback) {
            if (isModuleRequired(modulesInfo, module)) {
                if (module.document == "pre") {
                    Docs[docId] = Docs[docId] || {};
                    Docs[docId][module.path] = doc.clone();
                }
                var resource = require(module.path);
                var method = module.preUpdate || "preUpdate";
                if (resource && resource[method]) {
                    resource[method](doc, collection, db, callback);
                } else {
                    callback();
                }
            } else {
                callback();
            }
        }
    )
}

exports.postUpdate = function (docId, doc, modulesInfo, collection, db, callback) {
    populateModuleSequence("update");
    Utility.iterateArray(updateModules, function (err) {
            delete Docs[docId];
            callback(err);
        }, function (module, callback) {
            if (isModuleRequired(modulesInfo, module)) {
                if (module.document == "pre") {
                    doc = Docs[docId][module.path];
                    delete Docs[docId][module.path];
                }
                var resource = require(module.path);
                var method = module.postUpdate || "postUpdate";
                if (resource && resource[method]) {
                    resource[method](doc, collection, db, callback);
                } else {
                    callback();
                }
            } else {
                callback();
            }
        }
    )
}


exports.preDelete = function (docId, doc, modulesInfo, collection, db, callback) {
    populateModuleSequence("update");
    Utility.iterateArray(updateModules, callback, function (module, callback) {
            if (isModuleRequired(modulesInfo, module)) {
                if (module.document == "pre") {
                    Docs[docId] = Docs[docId] || {};
                    Docs[docId][module.path] = doc.clone();
                }
                var resource = require(module.path);
                var method = module.preDelete || "preDelete";
                if (resource && resource[method]) {
                    resource[method](doc, collection, db, callback);
                } else {
                    callback();
                }
            } else {
                callback();
            }
        }
    )
}
exports.postDelete = function (docId, doc, modulesInfo, collection, db, callback) {
    populateModuleSequence("update");
    Utility.iterateArray(updateModules, function (err) {
            delete Docs[docId];
            callback(err);
        }, function (module, callback) {
            if (isModuleRequired(modulesInfo, module)) {
                if (module.document == "pre") {
                    doc = Docs[docId][module.path];
                    delete Docs[docId][module.path];
                }
                var resource = require(module.path);
                var method = module.postDelete || "postDelete";
                if (resource && resource[method]) {
                    resource[method](doc, collection, db, callback);
                } else {
                    callback();
                }
            } else {
                callback();
            }
        }
    )
}


function populateModuleSequence(sequenceType, repopulate) {
    if (!repopulate && ((sequenceType === "query" && queryModules.length > 0 ) || (sequenceType === "update" && updateModules.length > 0))) {
        return;
    }
    var moduleClone = Utility.deepClone(modules);

    populateRequired(moduleClone, sequenceType);
    for (var i = 0; i < moduleClone.length; i++) {
        var module = moduleClone[i];
        var requiredModule = module.require && module.require[sequenceType] ? module.require[sequenceType] : null;
        if (Array.isArray(requiredModule)) {
            for (var j = 0; j < requiredModule.length; j++) {
                var reqModule = requiredModule[j];
                for (var k = 0; k < moduleClone.length; k++) {
                    if (reqModule === moduleClone[k].name) {
                        moduleClone[k].index = moduleClone[k].index + 1;
                    }
                }
            }
        }
    }
    sortModules(moduleClone);
    if (sequenceType === "query") {
        queryModules = [];
        for (var i = 0; i < moduleClone.length; i++) {
            if (moduleClone[i].require) {
                if (moduleClone[i].require.query !== false) {
                    queryModules.push(moduleClone[i]);
                }
            } else {
                queryModules.push(moduleClone[i]);
            }
        }
    } else {
        updateModules = [];
        for (var i = 0; i < modules.length; i++) {
            if (moduleClone[i].require) {
                if (moduleClone[i].require.update !== false) {
                    updateModules.push(moduleClone[i]);
                }
            } else {
                updateModules.push(moduleClone[i]);
            }
        }
    }
}

function populateRequired(modules, sequenceType) {
    var noOfModules = modules.length;
    for (var i = 0; i < noOfModules; i++) {
        var module = modules[i];
        var requiredModules = modules[i].require && modules[i].require[sequenceType] ? modules[i].require[sequenceType] : null;
        if (Array.isArray(requiredModules)) {
            for (var j = 0; j < noOfModules; j++) {
                var innerRequiredModules = modules[j].require && modules[j].require[sequenceType] ? modules[j].require[sequenceType] : null;
                if (Array.isArray(innerRequiredModules)) {
                    var noOfInnerRequiredModules = innerRequiredModules.length;
                    for (var k = 0; k < noOfInnerRequiredModules; k++) {
                        if (innerRequiredModules[k] === module.name) {
                            for (var l = 0; l < requiredModules.length; l++) {
                                if (modules[j].name === requiredModules[l]) {
                                    throw new Error("Recursion cannot require [" + modules[j].name + "] in [" + requiredModules[l] + "]");
                                }
                                if (innerRequiredModules.indexOf(requiredModules[l]) === -1) {
                                    innerRequiredModules.push(requiredModules[l]);
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

function isModuleRequired(modulesInfo, module) {
    if (!modulesInfo || Object.keys(modulesInfo).length == 0) {
        return true;
    }
    var moduleNames = Object.keys(modulesInfo);
    var moduleValue = modulesInfo[moduleNames[0]];
    for (var i = 1; i < moduleNames.length; i++) {
        if (modulesInfo[moduleNames[i]] !== moduleValue) {
            throw new Error("Can not Mix modules of inclusion and exclusion");
        }
    }
    return (moduleValue === 1 && modulesInfo[module.name] ) || (moduleValue === 0 && modulesInfo[module.name] === undefined) ? true : false;
}


function sortModules(moduleClone) {
    for (var i = 0; i < moduleClone.length - 1; i++) {
        for (var j = i + 1; j < moduleClone.length; j++) {
            if (moduleClone[i].index > moduleClone[j].index) {
                var temp = moduleClone[i];
                moduleClone[i] = moduleClone[j];
                moduleClone[j] = temp;
            }
        }
    }
}


exports.onRollback = function (db, callback) {
    Utility.iterateArray(updateModules, callback, function (module, callback) {
        var resource = require(module.path);
        var method = module.onRollback || "onRollback";
        if (resource && resource[method]) {
            resource[method](db, callback);
        } else {
            callback();
        }
    });
}

exports.onCommit = function (db, callback) {
    try {
        Utility.iterateArray(updateModules, callback, function (module, callback) {
            var resource = require(module.path);
            var method = module.onCommit || "onCommit";
            if (resource && resource[method]) {
                resource[method](db, callback);
            } else {
                callback();
            }
        });
    } catch (e) {
        console.log(e);
    }
}