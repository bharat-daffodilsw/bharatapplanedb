/**
 * Created with IntelliJ IDEA.
 * User: Rajit
 * Date: 17/5/14
 * Time: 12:13 PM
 * To change this template use File | Settings | File Templates.
 */

var Constants = require("../Constants.js");

exports.IndexValidation = function (document, db, callback) {
    var type = document.type;
    if (type === "insert") {
        var indexName = document.get(Constants.Index.Indexes.NAME);
        var isUnique = document.get(Constants.Index.Indexes.UNIQUE);
        var isMultiKey = document.get(Constants.Index.Indexes.MULTIKEY);
        var indexObject = {};
        if (isMultiKey === true) {
            var indexedfieldsArray = document.getDocuments("fields", ["insert"]);
            for (var i = 0; i < indexedfieldsArray.length; i++) {
                var indexedField = indexedfieldsArray[i].get("field");
                var indexedValue = indexedfieldsArray[i].get("value");
                indexObject[indexedField] = indexedValue;
            }
        } else {
            var indexedField = document.get(Constants.Index.Indexes.FIELD);
            indexObject[indexedField] = 1;
        }
        var collectionId = document.get(Constants.Index.Indexes.COLLECTION_ID);
        var collection = collectionId[Constants.Index.Indexes.COLLECTION];
        db.db.collection(collection).ensureIndex(indexObject, {name:indexName, unique:isUnique}, callback);
    }
    if (type === "update") {
        //delete steps
        var collectionId = document.getOld(Constants.Index.Indexes.COLLECTION_ID);
        var collection = collectionId[Constants.Index.Indexes.COLLECTION];
        var indexName = document.getOld(Constants.Index.Indexes.NAME);
        db.db.collection(collection).dropIndex(indexName);


        //insert steps
        var indexName = document.get(Constants.Index.Indexes.NAME);
        var isUnique = document.get(Constants.Index.Indexes.UNIQUE);
        var isMultiple = document.get(Constants.Index.Indexes.MULTIKEY);
        var indexObject = {};
        if (isMultiple === true) {
            var indexedfieldsArray = document.getDocuments("fields", ["insert"]);
            for (var i = 0; i < indexedfieldsArray.length; i++) {
                var indexedField = indexedfieldsArray[i].get("field");
                var indexedValue = indexedfieldsArray[i].get("value");
                indexObject[indexedField] = indexedValue;
            }
        } else {
            var indexedField = document.get(Constants.Index.Indexes.FIELD);
            indexObject[indexedField] = 1;
        }
        var collectionId = document.get(Constants.Index.Indexes.COLLECTION_ID);
        var collection = collectionId[Constants.Index.Indexes.COLLECTION];
        db.db.collection(collection).ensureIndex(indexObject, {name:indexName, unique:isUnique}, callback);
    }
    if (type === "delete") {
        var collectionId = document.getOld(Constants.Index.Indexes.COLLECTION_ID);
        var collection = collectionId[Constants.Index.Indexes.COLLECTION];
        var indexName = document.getOld(Constants.Index.Indexes.NAME);
        db.db.collection(collection).dropIndex(indexName, callback);
    }
}
