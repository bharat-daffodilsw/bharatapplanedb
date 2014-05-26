/*
 * name
 * address not valid
 * address.cityname valid
 * getDocumnet(adddress) valid
 * isUpdated(address) not valid
 *
 * */
var Utility = require("ApplaneCore/apputil/util.js")
var Constants = require("./Constants.js")

/**
 *
 * updates --> only $set, $unset, $inc, _id can be occur only otherise error throw  incase of update
 * insert--> no $set, $unset, $inc is there*
 * Also need to support required columns ------------------------------------>
 */



var Document = function (updates, oldRecord, type, requiredValues) {
//    if (type == "update" && updates) {
//        validateUpdates(updates);
//    }
    this.updates = updates;
    this.oldRecord = oldRecord;
    this.type = type;
    this.requiredValues = requiredValues;
}

function validateUpdates(updates) {
    var validKeys = ["$set", "$unset", "$inc", "_id", "$query"];
    var keys = Object.keys(updates);
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (validKeys.indexOf(key) === -1) {
            throw Error("Invalid Key [" + key + "] in updates");
        }
    }
}
function validateProperty(property) {

    if (property.indexOf(".") > 0) {
        throw Error("Dotted Expression Not Supported");
    }
}

Document.prototype.getUpdatedFields = function () {
    var value = this.updates;
    var oldValue = this.oldRecord;
    if (!value || !Utility.isJSONObject(value)) {
        return undefined;
    }
    if (oldValue && Utility.deepEqual(value, oldValue)) {
        return undefined;
    }
    oldValue = oldValue || {};
    var keys = [];
    if (this.type == "insert") {
        populateUpdatedFields(value, oldValue, keys);
    } else if (this.type == "update" || this.type == "delete") {
        var found = false;
        if (value.$set !== undefined) {
            populateUpdatedFields(value.$set, oldValue.$set || {}, keys);
            found = true;
        }
        if (value.$unset !== undefined) {
            populateUpdatedFields(value.$unset, oldValue.$unset || {}, keys);
            found = true;
        }
        if (value.$inc !== undefined) {
            populateUpdatedFields(value.$inc, oldValue.$inc || {}, keys);
            found = true;
        }
        if (value.$query !== undefined) {
            populateUpdatedFields(value.$query, oldValue.$query || {}, keys);
            found = true;
        }
        if (!found) {
            populateUpdatedFields(value, oldValue, keys);
        }
    }
    return keys;
}

Document.prototype.getRevisedUpdatedFields = function () {
    var value = this.convertToJSON();
    var oldValue = this.oldRecord;
    if (!value || !Utility.isJSONObject(value)) {
        return undefined;
    }
    if (oldValue && Utility.deepEqual(value, oldValue)) {
        return undefined;
    }
    oldValue = oldValue || {};
    var keys = [];
    populateUpdatedFields(value, oldValue, keys);
    return keys;
}

function populateUpdatedFields(value, oldValue, updatedFields) {
    for (var k in value) {
        if (oldValue[k] === undefined || !Utility.deepEqual(value[k], oldValue[k])) {
            if (updatedFields.indexOf(k) < 0) {
                updatedFields.push(k);
            }
        }
    }
}

Document.prototype.isInInc = function (property) {
    return this.updates && this.updates.$inc && this.updates.$inc[property] ? true : false;
}

/*
 * if property is in $inc throw error
 * "addressinfo.city" --> error --> dotted --> error, as well as not supported in updates
 * first check in $set, $unset and if not then check in oldvalue and return
 * in
 * */
Document.prototype.get = function (property) {
    if (this.updates === null || this.updates === undefined) {
        return undefined;
    }
    else if (this.updates && this.updates[property] !== undefined) {
        return this.updates[property];
    }
    else if (this.updates && this.updates.$set && this.updates.$set[property] !== undefined) {
        return this.updates.$set[property];
    } else if (this.updates && this.updates.$unset && this.updates.$unset[property] !== undefined) {
        return null;
    }
    else if (this.updates && this.updates.$inc && this.updates.$inc[property] !== undefined) {
        return this.updates.$inc[property];
    } else if (this.updates && this.updates.$query && this.updates.$query[property] !== undefined) {
        return this.updates.$query[property];
    }
    else if (this.requiredValues && this.requiredValues[property] !== undefined) {
        return this.requiredValues[property];
    }
    else if (this.oldRecord && this.oldRecord[property] !== undefined) {
        return this.oldRecord[property];
    } else {
        return undefined;
    }

}

/*
 * return only from old values
 * */
Document.prototype.getOld = function (property) {
    validateProperty(property);
    if (this.oldRecord && this.oldRecord[property] !== undefined) {
        return this.oldRecord[property];
    } else {
        return null;
    }
}

/*
 * if property exists in unset --> throw error
 *  null and not exists in set
 *  lookup case
 * */


Document.prototype.setParent = function (parent) {
    this.parent = parent;
}

Document.prototype.getDocuments = function (property, operation) {
    if (!this.updates) {
        return;
    }
    validateProperty(property);
    var value = checkValue.call(this, property);
    if (Array.isArray(value)) {
        var docs = handleArray(value, operation, this.oldRecord ? this.oldRecord[property] : null, null, this.requiredValues ? this.requiredValues[property] : null);
        setDocAsParent(docs, this);
        return  docs;
    } else if (Utility.isJSONObject(value)) {
        if (value.$insert || value.$update || value.$delete) {
            var docs = handleArray(value, operation, this.oldRecord ? this.oldRecord[property] : null, null, this.requiredValues ? this.requiredValues[property] : null);
            setDocAsParent(docs, this);
            return docs;
        } else {
            return handleObject(value, this.oldRecord ? this.oldRecord[property] : null, this.type, this.requiredValues ? this.requiredValues[property] : null, operation);
        }
    } else if (value !== null && value !== undefined) {
        return undefined;
    } else if (value === null) {
        /*
         * unset case or value set==null in $set
         * */
        var oldValue = this.oldRecord ? this.oldRecord[property] : null;
        if (Array.isArray(oldValue)) {
            var docs = handleArray(null, operation, oldValue, null, this.requiredValues ? this.requiredValues[property] : null)
            setDocAsParent(docs, this);
            return docs;
        } else if (Utility.isJSONObject(oldValue)) {
            return handleObject(null, oldValue, "update", this.requiredValues ? this.requiredValues[property] : null, operation);
        } else {
            return undefined;
        }
    } else {
        var oldValue = this.oldRecord ? this.oldRecord[property] : null;
        if (Array.isArray(oldValue)) {
            var docs = handleArray({}, operation, oldValue, "nochange", this.requiredValues ? this.requiredValues[property] : null)
            setDocAsParent(docs, this);
            return docs;
        } else if (Utility.isJSONObject(oldValue)) {
            return handleObject({}, oldValue, "nochange", this.requiredValues ? this.requiredValues[property] : null, operation);
        } else {
            var requiredValues = this.requiredValues ? this.requiredValues[property] : null;
            if (Array.isArray(requiredValues)) {
                throw new Error("Array Document not supported for only requiredValues>>>>>>>>" + JSON.stringify(this));
//                return handleArray({}, operation, oldValue, "nochange", this.requiredValues ? this.requiredValues[property] : null)
            } else if (Utility.isJSONObject(requiredValues)) {
                return handleObject({}, {}, "nochange", requiredValues, operation);
            } else {
                return undefined;
            }

        }
    }
}

function setDocAsParent(docs, parent) {
    if (docs) {
        for (var i = 0; i < docs.length; i++) {
            docs[i].setParent(parent);

        }
    }
}

function handleObject(value, oldRecord, type, requiredValue, operation) {
    if (operation && operation.indexOf(type) === -1) {
        return undefined;
    } else {
        return new Document(value, oldRecord, type, requiredValue);
    }

}

function handleOperationInArray(documentArray, operation) {
    var newDocumentArray = [];
    for (var i = 0; i < documentArray.length; i++) {
        var document = documentArray[i];
        if (operation.indexOf(document.type) !== -1) {
            newDocumentArray.push(document);
        }
    }
    return newDocumentArray;
}
function handleArray(value, operation, oldRecord, isNoChange, requiredValue) {
    oldRecord = oldRecord || {};
    value = value || {};
    requiredValue = requiredValue || [];
    if (value.$insert || value.$update || value.$delete) {
        var documentArray = [];
        populateArrayRevised(value, oldRecord, requiredValue, documentArray);
        if (operation) {
            return handleOperationInArray(documentArray, operation);
        } else {
            return documentArray;
        }
    } else {
        if ((value && value.length > 0 && Utility.isJSONObject(value[0])) || (oldRecord && oldRecord.length > 0 && Utility.isJSONObject(oldRecord[0]))) {
            var newDocumentArray = [];
            for (var i = 0; i < value.length; i++) {
                newDocumentArray.push(new Document(value[i], null, "insert", requiredValue[i]));
            }
            for (var i = 0; i < oldRecord.length; i++) {
                var type = isNoChange ? "nochange" : "delete";
                var updates = isNoChange ? {} : undefined;
                if (type === "nochange") {
                    var requiredIndex = Utility.isExists(requiredValue, value, "_id");
                    var rValue = requiredIndex !== undefined ? requiredValue[requiredIndex] : null;
                    newDocumentArray.push(new Document(updates, oldRecord[i], type, rValue));
                } else {
                    newDocumentArray.push(new Document(updates, oldRecord[i], type, null));
                }

            }
            if (operation) {
                return handleOperationInArray(newDocumentArray, operation);
            } else {
                return newDocumentArray;
            }
        } else {
            return undefined;
        }
    }
}

function checkValue(property) {
    if (this.updates && this.updates[property] !== undefined) {
        return this.updates[property];
    }
    if (this.updates && this.updates.$set && this.updates.$set[property] !== undefined) {
        return this.updates.$set[property];
    }
    if (this.updates && this.updates.$unset && this.updates.$unset[property] !== undefined) {
        return null;
    }
    if (this.updates && this.updates.$inc && this.updates.$inc[property] !== undefined) {
        return this.updates.$inc[property];
    }
    if (this.updates && this.updates.$query && this.updates.$query[property] !== undefined) {
        return this.updates.$query[property];
    }
    /*if (this.requiredValues && this.requiredValues[property] !== undefined) {
     return this.requiredValues[property];
     }*/
    return undefined;
}

function populateArray(updates, oldValue, documentArray, requiredValue) {
    oldValue = oldValue || [];
    requiredValue = requiredValue || [];
    updates.$update = updates.$update || [];
    updates.$delete = updates.$delete || [];
    for (var i = 0; i < oldValue.length; i++) {
        var value = oldValue[i];
        var found = false;
        for (var j = 0; j < updates.$update.length; j++) {
            var query = undefined;
            if (updates.$update[j].$query) {
                query = updates.$update[j].$query;
            } else {
                query = {"_id":updates.$update[j]._id};
            }
            if (Utility.evaluateFilter(query, value)) {
                var requiredIndex = Utility.isExists(requiredValue, value, "_id");
                var rValue = requiredIndex !== undefined ? requiredValue[requiredIndex] : null;
                documentArray.push(new Document(updates.$update[j], value, "update", rValue));
                found = true;
                break;
            }
        }
        if (!found) {

            for (var k = 0; k < updates.$delete.length; k++) {
                var query = undefined;
                if (updates.$delete[k].$query) {
                    query = updates.$delete[k].$query;
                } else if (Utility.isJSONObject(updates.$delete[k])) {
                    query = {"_id":updates.$delete[k]._id};
                } else {
                    query = updates.$delete[k];
                }
                if (Utility.isJSONObject(query)) {
                    if (Utility.evaluateFilter(query, value)) {
                        documentArray.push(new Document(query, value, "delete", null));
                        found = true;
                        break;
                    }
                } else {
                    if (value === query) {
                        documentArray.push(new Document(query, value, "delete", null));
                        found = true;
                        break;
                    }
                }
            }

        }
        if (!found) {
            var requiredIndex = Utility.isExists(requiredValue, value, "_id");
            var rValue = requiredIndex !== undefined ? requiredValue[requiredIndex] : null;
            documentArray.push(new Document({}, value, "nochange", rValue));
        }
    }
}


function getValue(property, updates, old) {
    if (updates && updates.$set && updates.$set[property] !== undefined) {
        return updates.$set[property];
    } else if (updates && updates.$unset && updates.$unset[property] !== undefined) {
        return undefined;
    }
    else if (updates && updates.$inc && updates.$inc[property] !== undefined) {
        throw Error("property [" + property + "] found in $inc");
    }
    else if (old && old[property] !== undefined) {
        return old[property];
    } else {
        return updates[property];
    }
}

Document.prototype.insertDocument = function (property, setValue) {
    var value = this.updates.$set[property];
    if (value && value.$insert) {
        var insertArray = value.$insert;
        insertArray.push(setValue);
    } else {
        this.updates.$set[property] = {$insert:[setValue]};
    }
}

Document.prototype.deleteDocument = function (property, setValue) {
    var value = this.updates.$set[property];
    if (value && value.$delete) {
        var deleteArray = value.$delete;
        deleteArray.push(setValue);
    } else {
        this.updates.$set[property] = {$delete:[setValue]};
    }
}

Document.prototype.set = function (property, value) {
    validateProperty(property);
    if (value === undefined) {
        if (this.type == "insert") {
            delete this.updates[property];
        } else if (this.type == "update") {
            if (this.updates.$set) {
                delete this.updates.$set[property];
            }
        }
    } else {
        if (this.type == "insert") {
            this.updates[property] = value;
        } else if (this.type == "update" || this.type == "delete") {
            if (!this.updates.$set && !this.updates.$unset && !this.updates.$inc && !this.updates.$query) {
                this.updates[property] = value;
            } else {
                this.updates.$set = this.updates.$set || {};
                this.updates.$set[property] = value;
            }
        } else {
            throw new Error("$Set operation not permitted for type[" + this.type + "]");
        }
    }
}

Document.prototype.unset = function (property, value) {
    validateProperty(property);
    if (value === undefined) {
        if (this.type == "insert") {
            delete this.updates[property];
        } else if (this.type == "update" || this.type == "delete") {
            if (this.updates.$unset) {
                delete this.updates.$unset[property];
            }
        }
    } else {
        if (this.type == "insert") {
            this.updates[property] = value;
        }
        else if (this.type == "update" || this.type == "delete") {
            this.updates.$unset = this.updates.$unset || {};
            this.updates.$unset[ property] = value;
        }
        else {
            throw new Error("$unset operation not permitted for type[" + this.type + "]");
        }
    }


}

Document.prototype.inc = function (property, value) {
    validateProperty(property);
    this.updates.$inc = this.updates.$inc || {};
    this.updates.$inc[property] = value;
}


function fetchIndex(query, oldData) {
    var Utils = require("ApplaneCore/apputil/util.js");

    var indexes = [];
    var length = oldData ? oldData.length : 0;

    for (var i = 0; i < length; i++) {
        if (Utils.evaluateFilter(query, oldData[i])) {
            indexes.push({index:i, data:oldData[i]});
        }
    }
    return indexes;
}

Document.prototype.convertToJSON = function () {
    if (this.updates === null || this.updates === undefined) {
        return undefined;
    }
    var jsonDocument = {};
    var fields = this.getFields();
    for (var i = 0; i < fields.length; i++) {
        var field = fields[i];
        var fieldDoc = this.getDocuments(field);
        if (fieldDoc !== undefined) {
            if (Array.isArray(fieldDoc)) {
                var fieldArray = [];
                for (var j = 0; j < fieldDoc.length; j++) {
                    var doc = fieldDoc[j];
                    if (doc.type !== "delete") {
                        var convertedJson = doc.convertToJSON();
                        fieldArray.push(convertedJson);
                    }
                }
                jsonDocument[field] = fieldArray;
            } else {
                jsonDocument[field] = fieldDoc.convertToJSON();
            }
        } else {
            if (this.isInInc(field)) {
                jsonDocument[field] = this.getOld(field) + this.get(field);
            } else {
                jsonDocument[field] = this.get(field);
            }
        }
    }
    return Object.keys(jsonDocument).length > 0 ? jsonDocument : undefined;
}


Document.prototype.getFields = function () {
    var keys = [];
    var updates = this.updates || {};
    for (var key in updates) {
        if (key !== "$query" && key !== "$set" && key !== "$unset" && key !== "$inc") {
            keys.push(key);
        }
    }
    for (var key in updates.$query) {
        if (keys.indexOf(key) === -1) {
            keys.push(key);
        }
    }
    for (var key in updates.$set) {
        if (keys.indexOf(key) === -1) {
            keys.push(key);
        }
    }
    for (var key in updates.$unset) {
        if (keys.indexOf(key) === -1) {
            keys.push(key);
        }
    }
    for (var key in updates.$inc) {
        if (keys.indexOf(key) === -1) {
            keys.push(key);
        }
    }
    var updated_id = this.get("_id");
    var old_id = this.oldRecord ? this.oldRecord._id : undefined;
    if (!old_id) {
        old_id = this.requiredValues ? this.requiredValues._id : undefined;
    }
    if ((!old_id && !updated_id && (this.updates.$set || this.updates.$unset || this.updates.$inc || Object.keys(this.updates).length == 0)) || (old_id && Utility.deepEqual(old_id, updated_id))) {
        //Rohit Bansal and Sachin Bansal 23-05-2014 --> for object merging, fk will be merged on the basis of _id, and simple object will have no _id but if object is completely overridden then old vlaue will not be consider otherwise if $set,$unset or $inc is there in simple object then we will consider old value in simple object :

        var oldRecord = this.oldRecord;
        for (var key in oldRecord) {
            if (keys.indexOf(key) === -1) {
                keys.push(key);
            }
        }
    }

    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (key === "$query" || key === "$set" || key === "$unset" || key === "$inc") {
            throw new Error("key cannot start with a $");
        }
    }
    return keys;
}

Document.prototype.setRequiredFieldsValues = function (requiredFieldValues) {
    this.requiredValues = requiredFieldValues;
}
module.exports = Document;


Document.prototype.clone = function () {
    return new Document(Utility.deepClone(this.updates), this.oldRecord, this.type, this.requiredValues);
}

Document.prototype.setCancelUpdates = function () {
    this.cancelUpdates = true;
}

function getInsertIndex(insert, requiredValue) {
    if (insert._id !== undefined) {
        var requiredIndex = Utility.isExists(requiredValue, insert, "_id");
        return requiredIndex;
    } else {
        var requiredValue = requiredValue || [];
        for (var i = 0; i < requiredValue.length; i++) {
            var obj = requiredValue[i];
            if (requiredValue[i]._id === undefined) {
                return i;
            }
        }
    }
}

function populateArrayDocs(updates, oldValue, requiredValue, documentArray) {
    oldValue = oldValue || [];
    requiredValue = requiredValue || [];
    updates.$update = updates.$update || [];
    updates.$delete = updates.$delete || [];
    updates.$insert = updates.$insert || [];
    var insertIndexes = [];
    for (var i = 0; i < oldValue.length; i++) {
        var old = oldValue[i].query ? oldValue[i].query : oldValue[i];
        var found = false;
        for (var j = 0; j < updates.$update.length; j++) {
            var query = prepareQuery(updates.$update[j]);
            if (Utility.evaluateFilter(query, old)) {
                var type = "update";
                if (Utility.deepEqual(oldValue[j], updates.$update[j])) {
                    type = "nochange";
                }
                var requiredIndex = Utility.isExists(requiredValue, oldValue[i], "_id");
                var rValue = requiredIndex !== undefined ? requiredValue[requiredIndex] : null;
                documentArray.push(new Document(updates.$update[j], oldValue[i], type, rValue));
                found = true;
                break;
            }
        }
        if (!found) {
            for (var k = 0; k < updates.$delete.length; k++) {
                var query = prepareQuery(updates.$delete[k]);
                if (Utility.evaluateFilter(query, old)) {
                    var type = "delete";
                    if (Utility.deepEqual(oldValue[j], updates.$delete[k])) {
                        type = "nochange";
                    }
                    documentArray.push(new Document(updates.$delete[k], oldValue[i], type, null));
                    found = true;
                    break;
                }
            }
        }
        if (!found) {
            for (var k = 0; k < updates.$insert.length; k++) {
                var query = prepareQuery(updates.$insert[k]);
                if (Utility.evaluateFilter(query, old)) {
                    var type = "update";
                    if (Utility.deepEqual(oldValue[j], updates.$insert[k])) {
                        type = "nochange";
                    }
                    insertIndexes.push(k);
                    documentArray.push(new Document(updates.$insert[k], oldValue[i], type, null));
                    found = true;
                    break;
                }
            }
        }
        if (!found) {
            var requiredIndex = Utility.isExists(requiredValue, oldValue[i], "_id");
            var rValue = requiredIndex !== undefined ? requiredValue[requiredIndex] : null;
            documentArray.push(new Document({}, oldValue[i], "nochange", rValue));
        }
    }
    var inserts = updates && updates.$insert ? updates.$insert : [];
    var newInserts = [];
    for (var i = 0; i < inserts.length; i++) {
        if (insertIndexes.indexOf(i) === -1) {
            newInserts.push(inserts[i]);
        }
    }
    populateArrayInsertDocs(newInserts, requiredValue, documentArray);
}

function prepareQuery(updates) {
    var query = undefined;
    if (updates.$query) {
        query = updates.$query;
    } else {
        query = {"_id":updates._id};
    }
    return query;
}

function populateArrayInsertDocs(inserts, requiredValue, documentArray) {
    var firstValue = inserts[0] || {};
    var requiredIndex = getInsertIndex(firstValue, requiredValue);
    for (var i = 0; i < inserts.length; i++) {
        var rValue = null;
        if (requiredIndex !== undefined) {
            rValue = requiredValue[requiredIndex];
            requiredIndex = requiredIndex + 1;
        }
        documentArray.push(new Document(inserts[i], null, "insert", rValue));
    }
}
function populateArrayRevised(updates, oldValue, requiredValue, documentArray) {
    if (Array.isArray(oldValue)) {
        populateArrayDocs(updates, oldValue, requiredValue, documentArray);
    } else if (oldValue && Utility.isJSONObject(oldValue)) {
        var oldArray = oldValue.$insert || [];
        if (oldValue.$update !== undefined) {
            for (var i = 0; i < oldValue.$update.length; i++) {
                oldArray.push(oldValue.$update[i]);
            }
        }
        if (oldValue.$delete !== undefined) {
            for (var i = 0; i < oldValue.$delete.length; i++) {
                oldArray.push(oldValue.$delete[i]);
            }
        }
        populateArrayDocs(updates, oldArray, requiredValue, documentArray);
    } else {
        var inserts = updates && updates.$insert ? updates.$insert : [];
        populateArrayInsertDocs(inserts, requiredValue, documentArray);
    }
}

