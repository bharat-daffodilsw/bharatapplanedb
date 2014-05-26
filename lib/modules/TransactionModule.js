/*
 * Basic Concept
 *   1.We are maintaining the transaction in the pl.txs collection.
 *   2 . On start of a transaction we create  a unique transaction id (txid)
 *   and insert a record with this transaction id as the _id of the record and set the status of this transaction as pending.
 *   3.If a new record is inserted or a previous one is deleted , we make an entry in the pl.txs collection with the reverse
 *     effect so that the transaction can be easily rollbacked.
 *    for eg :
 *         if we have to insert a record
 *         {$collection: "countries", $insert: [
 {_id: 1, country: "USA", code: "01"}
 ]}
 then we update the pl.txs record with the following updates
 {updates: [
 {tx: {$collection: "countries", $delete: [
 {_id: 1}
 ]}}

 *  4. In case of update we cannot keep the updates with the transaction table because if the record itself fails to execute then
 *       we are going to rollback the changes made by the udpate which will make the database inconsitent
 *  5. So we keep the reverse effects of the updates with the record itself
 *
 *      for eg:
 *       the record to be updated
 *      {$collection: "countries", $update: [
 {_id: 1, $set: {"country": "India"}}
 ]}
 then the record with the transaction will be like this
 {$collection: "countries", $update: [
 {_id: 1, $set: {"country": "India"}, __txs__: {txid: {tx: {_id: 1, $set: {"country": "USA"}}}}}
 ]}

 in case of $inc operation we are maintaining the aggregate of the changes made by transactions
 for eg : if one transaction increments the value by 10
 and the second one decrements the value by 20 then we update our __txs__ field in the record by +10 .

 NOTE:  We are maintaining  an object corresponding to the __txs__ field . Correponding to this __txs__ field
 a transactionid - transaction (key-value)  pair is maintained so that we can easily commit or rollback or unset the
 transactionid in the pl.txs field after commit or rollback.
 6. In case of rollback , update the status of the transaction as rollback so that in case of any failure during the
 rollback process we can easily rollback the remaining transactions
 7. In case of commit , update the status of the transaction as commit so that in case of any failure during the commit
 process we can easily commit the remaining transactions.
 NOTE : all the transaction updates are executed using batchUpdate


 * */

var Constants = require("../Constants.js");
var Utils = require("ApplaneCore/apputil/util.js");

exports.preInsert = function (document, collection, db, callback) {
    if (document.cancelUpdates || db.txid === undefined) {
        callback();
        return;
    }
    var txid = db.txid;
    var documentId = Utils.getUnique();
    document.set("txid", documentId);
    var collectionName = collection.mongoCollection.collectionName;
    var tx = {collection: collectionName, delete: {txid: documentId}};
    var update = [
        {$collection: Constants.TRANSACTIONS, $update: [
            {$query: {_id: txid}, $push: {updates: {$each: [
                {_id: Utils.getUnique(), tx: tx}
            ]}}}
        ]}
    ];
    /*update the pl.txs collection with the reverse  effect of insert(delete with the record id )*/

    db.batchUpdate(update, callback);
}

exports.preUpdate = function (document, collection, db, callback) {
    if (document.cancelUpdates || db.txid === undefined) {
        callback();
        return;
    }
    var documentId = document.get("_id");
    var collectionName = collection.mongoCollection.collectionName;
    var tx = {collection: collectionName, update: {_id: documentId}};
    /*
     * query on the pl.txs collection to check whether a transaction is going on with collection with the same record updated that is  inserted or deleted in the same transaction
     * if the record is found the do nothing
     * else update the document with the reverse effect of the transaction and update the pl.txs collection with the id and name of the collection to be updated
     * */
    getTransaction(db, function (err, data) {
        if (err) {
            callback(err);
            return;
        }
        var toUpdate = true;
        var alreadyInProgress = false;
        var updates = data.result && data.result.length > 0 ? data.result[0].updates : [];
        for (var i = 0; i < updates.length; i++) {
            if (collectionName === updates[i].tx.collection) {
                if ((updates[i].tx.insert && updates[i].tx.insert._id == documentId) || (updates[i].tx.delete && updates[i].tx.delete._id == documentId)) {
                    toUpdate = false;
                }
                if (updates[i].tx.update && updates[i].tx.update._id == documentId) {
                    alreadyInProgress = true;
                }
            }
        }
        if (toUpdate) {
            if (alreadyInProgress) {
                updateDocument(document, collection, db, callback);
            } else {
                var update = [
                    {$collection: Constants.TRANSACTIONS, $update: [
                        {$query: {_id: db.txid}, $push: {updates: {$each: [
                            {_id: Utils.getUnique(), tx: tx}
                        ]}}}
                    ]}
                ];
                db.batchUpdate(update, function (err, result) {
                    if (err) {
                        callback(err);
                        return;
                    }
                    updateDocument(document, collection, db, callback);
                });
            }
        } else {
            callback();
        }

    });
}

exports.preDelete = function (document, collection, db, callback) {
    var txid = db.txid;
    if (document.cancelUpdates || txid === undefined) {
        callback();
        return;
    }
    var collectionName = collection.mongoCollection.collectionName;
    var tx = {collection: collectionName, insert: document.oldRecord};
    /*
     * update the pl.txs collection with the reverse effect of delete( save the old record )
     * */
    var update = [
        {$collection: Constants.TRANSACTIONS, $update: [
            {$query: {_id: txid}, $push: {updates: {$each: [
                {_id: Utils.getUnique(), tx: tx}
            ]}}}
        ]}
    ];
    db.batchUpdate(update, callback);

}

exports.onCommit = function (db, callback) {
    handleCommit(db, callback);
}

exports.onRollback = function (db, callback) {
    handleRollback(db, callback);
}

function handleCommit(db, callback) {
    getTransaction(db, function (err, data) {
        if (err) {
            callback(err);
            return;
        }
        var updates = data.result && data.result.length > 0 ? data.result[0].updates : [];
        if (updates && updates.length > 0) {
            processCommitUpdates(updates[0], db, function (err, data) {
                if (err) {
                    callback(err);
                    return;
                }
                handleCommit(db, callback);
            });
        } else {
            deleteTransaction(db, function (err, data) {
                if (err) {
                    callback(err);
                    return;
                }
                callback();
            })

        }
    });
}

function deleteTransaction(db, callback) {
    var update = {}
    update[Constants.Query.COLLECTION] = Constants.TRANSACTIONS;
    update[Constants.Update.DELETE] = [
        {_id: db.txid}
    ];
    db.batchUpdate([update], callback);
}

function handleRollback(db, callback) {
    /*
     * query on the pl.txs collection to fetch the transaction corresponding to the txid
     * */
    getTransaction(db, function (err, data) {
        if (err) {
            callback(err);
            return;
        }
        var updates = data.result && data.result.length > 0 ? data.result[0].updates : [];
        /*
         * process each operation in the transaction on by one
         * if no updated are found then delete the complete transaction
         * */
        if (updates && updates.length > 0) {
            processRollbackUpdates(updates[0], db, function (err, data) {
                if (err) {
                    callback(err);
                    return;
                }
                handleRollback(db, callback);
            });
        } else {
            deleteTransaction(db, function (err) {
                if (err) {
                    callback(err);
                    return;
                }
                callback();
            })
        }
    });
}

function getTransaction(db, callback) {
    var query = {};
    query[Constants.Query.COLLECTION] = Constants.TRANSACTIONS;
    query[Constants.Query.FILTER] = {_id: db.txid};
    db.query(query, function (err, data) {
        if (err) {
            callback(err);
            return;
        }
        callback(null, data);
    });
}

function processRollbackUpdates(update, db, callback) {
    /*
     * if the operation in transaction is insert or delete then rollback from the transaction
     * otherwise rollback from the document
     * */
    var tx = update.tx;
    if (tx) {
        if (tx.insert !== undefined) {
            var newTx = {};
            newTx[Constants.Query.COLLECTION] = tx.collection;
            newTx.$insert = tx.insert;
            db.batchUpdate([newTx], function (err, data) {
                if (err) {
                    if (err.code !== 11000) {
                        callback(err);
                        return;
                    }
                }
                removeFromTransaction(update._id, db, callback);
            });
        } else if (tx.delete !== undefined) {
            var newTx = {};
            newTx[Constants.Query.COLLECTION] = tx.collection;
            newTx.$delete = tx.delete;
            db.batchUpdate([newTx], function (err, data) {
                if (err) {
                    if (err.code !== 11000) {
                        callback(err);
                        return;
                    }
                }
                removeFromTransaction(update._id, db, callback);
            });
        } else {
            rollbackFromRecord(update._id, tx, db, callback);
        }
    } else {
        throw new Error("Transaction not found in Transaction");
    }
}

function processCommitUpdates(update, db, callback) {
    var tx = update.tx;
    if (tx) {
        if (tx.insert !== undefined) {
            removeFromTransaction(update._id, db, callback);
        } else if (tx.delete !== undefined) {
            removeTxidFromInsertRecord(tx, db, function (err) {
                if (err) {
                    callback(err);
                    return;
                }
                removeFromTransaction(update._id, db, callback);
            });
        } else {
            removeTxsFromRecord(tx, db, function (err) {
                if (err) {
                    callback(err);
                    return;
                }
                removeFromTransaction(update._id, db, callback);
            });
        }
    } else {
        throw new Error("Transaction not found in Transaction");
    }
}

function removeTxidFromInsertRecord(tx, db, callback) {
    var collection = tx.collection;
    var query = {};
    query.txid = tx.delete.txid;
    var unset = {};
    unset["txid"] = "";
    var update = {$collection: collection, $update: {$query: query, $unset: unset}};
    db.batchUpdate(update, callback);
}


function removeTxsFromRecord(tx, db, callback) {
    var collection = tx.collection;
    var updates = tx.update;
    var query = {};
    query._id = updates._id;
    var unset = {};
    unset["__txs__." + db.txid] = "";
    var update = {$collection: collection, $update: {$query: query, $unset: unset}};
    db.batchUpdate(update, callback);
}

function removeFromTransaction(id, db, callback) {
    var update = {}
    update[Constants.Query.COLLECTION] = Constants.TRANSACTIONS;
    update[Constants.Update.UPDATE] = [
        {$query: {_id: db.txid}, $pull: {updates: {_id: id}}}
    ];
    db.batchUpdate([update], callback);
}

function rollbackFromRecord(txsUpdatesid, tx, db, callback) {
    /*
     * query on the collection reffered in the transaction and extract the updates
     * */
    var collection = tx.collection;
    var updates = tx.update;
    var query = {};
    query[Constants.Query.COLLECTION] = collection;
    query[Constants.Query.FILTER] = {_id: updates._id};
    db.query(query, function (err, data) {
            if (err) {
                callback(err);
                return;
            }
            if (data.result && data.result.length === 0) {
                removeFromTransaction(txsUpdatesid, db, callback);
            }
            else {
                var transactions = data.result && data.result.length > 0 ? data.result[0].__txs__ : {};
                var txToRollback = transactions[db.txid] ? transactions[db.txid]["tx"] : undefined;
                if (txToRollback) {
                    var id = txToRollback._id;
                    var array = txToRollback.array;
                    if (array && array.length > 0) {
                        handleArrayRollback(array[0], id, db, collection, function (err) {
                            if (err) {
                                callback(err);
                                return;
                            }
                            handleRollback(db, callback);
                        });
                    } else {
                        var newUpdate = {};
                        newUpdate[Constants.Update.QUERY] = {_id: id};
                        newUpdate.$unset = txToRollback.$unset || {};
                        newUpdate.$unset["__txs__." + db.txid] = "";
                        if (txToRollback.set) {
                            newUpdate.$set = {};
                            for (var i = 0; i < txToRollback.set.length; i++) {
                                newUpdate.$set[txToRollback.set[i].key] = txToRollback.set[i].value;
                            }
                        }
                        if (txToRollback.unset) {
                            newUpdate.$unset = {};
                            for (var i = 0; i < txToRollback.unset.length; i++) {
                                newUpdate.$unset[txToRollback.unset[i].key] = txToRollback.unset[i].value;
                            }
                        }
                        if (txToRollback.inc) {
                            newUpdate.$inc = {};
                            for (var i = 0; i < txToRollback.inc.length; i++) {
                                newUpdate.$inc[txToRollback.inc[i].key] = txToRollback.inc[i].value;
                            }
                        }
                        var update = {$collection: collection, $update: [newUpdate]};
                        db.batchUpdate([update], function (err, result) {
                            if (err) {
                                callback(err);
                                return;
                            }
                            removeFromTransaction(txsUpdatesid, db, callback);
                        });
                    }
                }
                else {
                    callback();
                }
            }
        }
    )
    ;
}

function updateDocument(document, collection, db, callback) {
    collection.get(Constants.Admin.Collections.FIELDS, function (err, fields) {
        if (err) {
            callback(err);
            return;
        }
        var tx = {};
        tx._id = document.get("_id");
        var previousTransaction = document.getDocuments("__txs__");
        console.log("previousTransaction>>>>>>>>" + JSON.stringify(previousTransaction));
        if (previousTransaction !== undefined) {
            var pTx = previousTransaction.get(db.txid);
            if (pTx !== undefined) {
                pTx = pTx.tx;
                updateTransaction(document, fields, pTx);
                var pTxs = {};
                pTxs[db.txid] = {tx: pTx};
                document.set("__txs__", pTxs);
                callback();
            } else {
                console.log("tx is undefined");
                tx = {};
                tx._id = document.get("_id");
                tx.array = [];
                updateTransaction(document, fields, tx);
                var txs = {};
                var newTx = {};
                newTx[db.txid] = {"tx": tx};
                txs["$set"] = newTx;
                document.set("__txs__", txs);
                console.log("documentafter >>>>>>>>>>>>>>>>>>>>>>>.." + JSON.stringify(document));
                callback();
            }
        } else {
            tx.array = [];
            updateTransaction(document, fields, tx);
            var txs = {};
            txs[db.txid] = {tx: tx};
            document.set("__txs__", txs);
            callback();
        }
    });
}

function handleInc(tx, newKey, document, field) {
    tx.inc = tx.inc || [];
    var oldValue = 0;
    var index = undefined;
    for (var j = 0; j < tx.inc.length; j++) {
        if (tx.inc[j].key === newKey) {
            index = j;
            break;
        }
    }
    if (index !== undefined) {
        var oldValue = tx.inc[index].value;
        tx.inc[index].value = oldValue + (-1 * document.get(field));
    } else {
        tx.inc.push({key: newKey, value: (-1 * document.get(field))});
    }
}

function handleSet(tx, newKey, document, field) {
    tx.set = tx.set || [];
    var found = false;
    for (var j = 0; j < tx.set.length; j++) {
        if (tx.set[j].key === newKey) {
            found = true;
            break;
        }
    }
    if (!found) {
        var oldValue = document.getOld(field);
        if (oldValue === undefined || oldValue === null) {
            tx.unset = tx.unset || [];
            tx.unset.push({key: newKey, value: 1});
        } else {
            tx.set.push({key: newKey, value: document.getOld(field)});
        }
    }
}

function updateTransaction(document, fields, tx, pExpression) {
    /*
     * get Updated Fields from the document and iterate them . If the getDocuments result in object or array then handle them
     * otherwise value corresponding to the field is simple and handle it accordingly
     * */
    var updatedFields = document.getUpdatedFields() || [];
    for (var i = 0; i < updatedFields.length; i++) {
        var field = updatedFields[i];
        var documents = document.getDocuments(field);
        if (documents !== undefined) {
            if (Array.isArray(documents)) {
                var newParentExp = pExpression ? pExpression + "." + field : field;
                var updates = document && document.updates && document.updates.$set && document.updates.$set[field];
                if (updates && (updates.$insert || updates.$delete || updates.$update)) {
                    var oldValue = document.getOld(field);
                    handleArray(documents, fields, field, tx.array, newParentExp);
                } else {
                    handleSet(tx, newParentExp, document, field);
                }
            } else {
                var newParentExp = pExpression ? pExpression + "." + field : field;
                updateTransaction(documents, fields ? fields.field : null, tx, newParentExp);
            }
        } else {
            var newKey = pExpression ? pExpression + "." + field : field;
            if (document.updates && document.updates.$inc && document.updates.$inc[field] !== undefined) {
                handleInc(tx, newKey, document, field);
            } else if ((document.updates && document.updates.$unset && document.updates.$unset[field] !== undefined) || (document.updates && document.updates.$set && document.updates.$set[field] !== undefined)) {
                handleSet(tx, newKey, document, field);
            } else if (document.updates && document.updates[field] && document.updates[field].$query) {
                throw new Error("updates for field[" + field + "] cannot contain $query >>> updates found are " + JSON.stringify(document.updates));
            } else if (document.updates && document.updates[field] !== undefined) {
                handleSet(tx, newKey, document, field);
            } else {
                throw new Error("updates for field[" + field + "] must be in one of $set,$unset,$inc>>> updates found are " + JSON.stringify(document.updates));
            }
        }
    }
    return tx;
}

function handleUpdates(document, fields, tx, txid) {
    /*
     * check if a transaction is already in progress with the record to be updated
     * if found then update the changes in the ongoing transaction
     * otherwise create a new transaction
     * */

    var previousTransaction = document.getDocuments("__txs__");
    if (previousTransaction !== undefined) {
        var pTx = previousTransaction.get(txid);
        if (pTx !== undefined) {
            pTx = pTx.tx;
            updateTransaction(document, fields, pTx);
            return pTx;
        } else {
            tx = {};
            tx._id = document.get("_id");
            tx.array = [];
            updateTransaction(document, fields, tx);
            return tx;
        }
    } else {
        tx.array = [];
        updateTransaction(document, fields, tx);
        return tx;
    }
}

function handleObject(document, tx) {
    var updatedFields = document.getUpdatedFields() || [];
    for (var i = 0; i < updatedFields.length; i++) {
        var field = updatedFields[i];
        var documents = document.getDocuments(field);
    }
}

function handleArray(documents, fields, field, array, pExp) {
    for (var i = 0; i < documents.length; i++) {
        var document = documents[i];
        var newExp = pExp ? pExp : field;
        if (document.type === "insert") {
            var documentId = document.get("_id");
            var index = checkInArray(array, documentId);
            if (index === undefined) {
                var fieldInfo = getField(fields, field);
                var sortExp = fieldInfo && fieldInfo.sort ? fieldInfo.sort : null;
                array.push({_id: documentId, type: "delete", field: newExp, sort: sortExp});
            }
        }
        if (document.type === "delete") {
            var documentId = document.get("_id");
            var index = checkInArray(array, documentId);
            if (index === undefined) {
                var fieldInfo = getField(fields, field);
                var sortExp = fieldInfo && fieldInfo.sort ? fieldInfo.sort : null;
                array.push({_id: documentId, type: "insert", field: newExp, value: document.oldRecord, sort: sortExp});
            }
        }
        if (document.type === "update") {
            var documentId = document.get("_id");
            var index = checkInArray(array, documentId);
            var update = {};
            if (index === undefined) {
                update._id = documentId;
                update.field = newExp;
                update.type = "update";
                array.push(update);
                handleArrayUpdate(document, newExp, update);
            } else {
                update = array[index];
                if (update.type === "update") {
                    handleArrayUpdate(document, newExp, update);
                }
            }
        }
    }
}

function fetchIndex(query, oldData) {
    var Utils = require("ApplaneCore/apputil/util.js");
    var indexes = [];
    var length = oldData ? oldData.length : 0;

    for (var i = 0; i < length; i++) {
        if (Utils.evaluateFilter(query, oldData[i])) {
            indexes.push({index: i, data: oldData[i]});
        }
    }
    return indexes;
}

function handleArrayUpdate(document, field, update, pExp) {
    var updatedFields = document.getUpdatedFields() || [];
    for (var i = 0; i < updatedFields.length; i++) {
        var field = updatedFields[i];
        var documents = document.getDocuments(field);
        var newParentExp = pExp ? pExp + "." + field : field;
        if (Array.isArray(documents)) {
            handleSet(update, newParentExp, document, field);
        } else if (Utils.isJSONObject(documents)) {
            handleArrayUpdate(documents, field, update, newParentExp);
        } else {
            if (document.updates && document.updates.$inc && document.updates.$inc[field] !== undefined) {
                handleInc(update, newParentExp, document, field);
            } else if ((document.updates && document.updates.$unset && document.updates.$unset[field] !== undefined) || (document.updates && document.updates.$set && document.updates.$set[field] !== undefined)) {
                handleSet(update, newParentExp, document, field);
            } else if (document.updates && document.updates[field] && document.updates[field].$query) {
                throw new Error("updates for field[" + field + "] cannot contain $query >>> updates found are " + JSON.stringify(document.updates));
            } else if (document.updates && document.updates[field] !== undefined) {
                handleSet(update, newParentExp, document, field);
            } else {
                throw new Error("updates for field[" + field + "] must be in one of $set,$unset,$inc>>> updates found are " + JSON.stringify(document.updates));
            }

        }
    }
}

function handleDeleteOperationRollback(tx, recordId, collection, db, callback) {
    var pull = {};
    pull[tx.field] = {_id: tx._id};
    pull["__txs__." + db.txid + ".tx.array"] = {_id: tx._id};
    var update = {$query: {_id: recordId}, $pull: pull};
    var updates = {$collection: collection, $update: update};
    db.batchUpdate(updates, function (err, result) {
        if (err) {
            if (err.code !== 11000) {
                callback(err);
                return;
            }
        }
        callback();
    });
}

function handleInsertOperationRollback(tx, recordId, collection, db, callback) {
    var push = {};
    var sort = {};
    if (tx.sort) {
        sort[tx.sort] = 1
    } else {
        sort["_id"] = 1
    }
    push[tx.field] = {$each: [tx.value], $sort: sort, $slice: -20000};
    var update = {$query: {_id: recordId}, $push: push};
    update.$pull = {};
    update.$pull["__txs__." + db.txid + ".tx.array"] = {_id: tx._id};
    var updates = {$collection: collection, $update: update};
    db.batchUpdate(updates, function (err, result) {
        if (err) {
            callback(err);
            return;
        }
        callback();
    });
}

function handleUpdateOperationRollback(recordId, tx, collection, db, callback) {
    var query = {}
    query._id = recordId;
    query[tx.field + "._id"] = tx._id;
    var update = {$query: query};
    if (tx.set !== undefined && tx.set.length > 0) {
        update.$set = {};
        for (var i = 0; i < tx.set.length; i++) {
            update.$set[tx.field + ".$." + tx.set[i].key] = tx.set[i].value;
        }
    }
    if (tx.inc !== undefined && tx.inc.length > 0) {
        update.$inc = {};
        for (var i = 0; i < tx.inc.length; i++) {
            update.$inc[tx.field + ".$." + tx.inc[i].key] = tx.inc[i].value;
        }
    }
    update.$pull = {};
    update.$pull["__txs__." + db.txid + ".tx.array"] = {_id: tx._id};
    var updates = {$collection: collection, $update: update};
    db.batchUpdate(updates, {multiple: false}, function (err, result) {
        if (err) {
            callback(err);
            return;
        }
        callback();
    });
}

function handleArrayRollback(tx, recordId, db, collection, callback) {
    var type = tx.type;
    if (type === "insert") {
        handleInsertOperationRollback(tx, recordId, collection, db, callback);
    } else if (type === "delete") {
        handleDeleteOperationRollback(tx, recordId, collection, db, callback);
    } else {
        handleUpdateOperationRollback(recordId, tx, collection, db, callback);
    }
}

function checkInArray(array, documentId) {
    var index = Utils.isExists(array, {_id: documentId}, "_id");
    return index;
}
function getField(fields, field) {
    fields = fields || [];
    for (var i = 0; i < fields.length; i++) {
        if (field === fields[i].field) {
            return fields[i];
        }
    }
}
