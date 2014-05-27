var Q = require("q");
var Utils = require("ApplaneCore/apputil/util.js");
var Self = require("./EventManager.js");
var TotalCount = 0;

exports.triggerEvents = function (event, document, events, db, options) {
    console.log("----------------Start triggerEvent called...." + event);
    console.log("----------------document called...." + JSON.stringify(document));
    console.log("----------------options called...." + JSON.stringify(options));
    var d = Q.defer();
    if (!events || events.length == 0) {
        d.resolve();
        return d.promise;
    }
    options = options || {};
    options = Utils.deepClone(options);
    var mergedDocument = undefined;
    if (event == "onInsert") {
        mergedDocument = {};
    } else if (event == "onValue") {
        mergedDocument = document.convertToJSON();
        options.fields = options.fields || document.getRevisedUpdatedFields();
    } else if (event == "onSave") {
        mergedDocument = document.convertToJSON();
        if (!options.pre && !options.post) {
            d.reject(new Error("No pre/post found in onSave"));
            return d.promise;
        }
    }

    Utils.iterateArrayWithPromise(options.fields,
        function (index, updatedField) {
            var d1 = Q.defer();

            var updatedFieldDoc = document.getDocuments(updatedField, ["insert", "update", "delete"]);
            if (!updatedFieldDoc || !Array.isArray(updatedFieldDoc)) {
                d1.resolve();
                return d1.promise;
            }
            console.log(">>NestedupdatedField >>>>>>>>>>>>>>>>>" + JSON.stringify(updatedField));
            Utils.iterateArrayWithPromise(updatedFieldDoc,
                function (docIndex, nestedDoc) {
                    console.log("nested doc>>>" + JSON.stringify(nestedDoc));
                    var d11 = Q.defer();

                    var nestedOptions = Utils.deepClone(options);
                    nestedOptions.parentFields = nestedOptions.parentFields || [];
                    nestedOptions.parentFields.push(updatedField);
                    if (nestedDoc.type == "insert") {
                        console.log("firing nested field insert")
                        delete nestedOptions.fields;
                        return Self.triggerEvents("onInsert", nestedDoc, events, db, nestedOptions);
                    } else if (nestedDoc.type == "update") {
                        console.log("firing nested field udpate")
                        nestedOptions.fields = nestedDoc.getRevisedUpdatedFields();
                        console.log("nested options>>>" + JSON.stringify(nestedOptions));
                        return Self.triggerEvents("onValue", nestedDoc, events, db, nestedOptions);
                    } else if (nestedDoc.type == "delete") {
                        console.log("firing nested field delete")
                        nestedDoc.updates.$unset = nestedDoc.updates.$unset || {};
                        if (nestedDoc.oldRecord) {
                            for (var k in nestedDoc.oldRecord) {
                                nestedDoc.updates.$unset[k] = "";
                            }
                            delete nestedDoc.updates.$unset._id;
                        }
                        console.log(">>>nestedDoc>>>" + JSON.stringify(nestedDoc));
                        nestedOptions.fields = nestedDoc.getRevisedUpdatedFields();
                        console.log("nested options>>>" + JSON.stringify(nestedOptions));
                        return Self.triggerEvents("onValue", nestedDoc, events, db, nestedOptions);
                    } else {
                        d11.resolve();
                    }
                    return d11.promise;
                }).then(
                function () {
                    //nested doc has done its all work, now it should
                    var documentJSON = document.convertToJSON();
                    mergedDocument[updatedField] = documentJSON[updatedField];
                    d1.resolve();
                }).fail(function (err) {
                    d1.reject(err);
                });


            return d1.promise;
        }).then(
        function () {
            return invokeTriggers(event, document, events, db, options);
        }).then(
        function () {
            if (!options.post) {

                document.oldRecord = mergedDocument;
                var revisedUpdatedFields = document.getRevisedUpdatedFields();
                console.log(">>>>revisedUpdatedFields >>>>>>>>>>>>>>>>>>" + JSON.stringify(revisedUpdatedFields));
                console.log("$$$$$$$document is now" + JSON.stringify(document));
                console.log("options>>>>" + JSON.stringify(options));


                if (revisedUpdatedFields && revisedUpdatedFields.length > 0) {
                    options.fields = revisedUpdatedFields;
                    return Self.triggerEvents("onValue", document, events, db, options);
                }
            }
        }).then(
        function () {
            d.resolve();
        }).fail(function (err) {
            d.reject(err);
        })
    return d.promise;
}

function invokeTriggers(event, document, events, db, options) {
    console.log("invoking triggers for event>>>" + event + ">>>options>>>>" + JSON.stringify(options));
    var d = Q.defer();
    getTriggers(event, events, options).then(
        function (triggers) {
            console.log("triggers>>>>>>>>>>>>>>>>" + JSON.stringify(triggers));
            return executeTriggers(document, triggers, db);
        }).then(
        function () {
            d.resolve();
        }).fail(function (err) {
            d.reject(err);
        })
    return d.promise;
}

function executeTriggers(document, triggers, db) {
    var d = Q.defer();
    Utils.iterateArrayWithPromise(triggers,
        function (index, trigger) {
            return db.invokeFunctionAsPromise(trigger.function, [document]);
        }).then(
        function () {
            d.resolve();
        }).fail(function (err) {
            d.reject(err);
        })
    return d.promise;
}

function getTriggers(event, events, options) {
    console.log("......getTriggers" + JSON.stringify(options) + ">>event>>>" + event)
    var d = Q.defer();
    var eventsToTrigger = [];
    for (var i = 0; i < events.length; i++) {
        var e = events[i];
        if (e.eventName == event) {
            options = options || {};
            var needToAdd = false;
            if (event == "onInsert") {
                console.log("options >>>>>>>>>>>>>>>" + JSON.stringify(options));
                if (!options.parentFields && !e.fields) {
                    needToAdd = true;
                } else if (options.parentFields && e.fields) {
                    if (needToAddEventFields(e.fields, options.fields, options.parentFields, 0)) {
                        needToAdd = true;
                    }
                } else {
                    //do not add
                }
            } else if (options.fields && e.fields) {
                if (needToAddEventFields(e.fields, options.fields, options.parentFields, 0)) {
                    needToAdd = true;
                }
            } else if ((options.pre && e.pre == options.pre)) {
                needToAdd = true;
            } else if (options.post && e.post == options.post) {
                needToAdd = true;
            }

            if (needToAdd) {
                console.log(">>>>>>adding triger>>>>>>>>>>" + JSON.stringify(e));
                var trigerAlreadyAdded = false;
                for (var j = 0; j < eventsToTrigger.length; j++) {
                    var evetntToTrigger = eventsToTrigger[j];
                    if (Utils.deepEqual(evetntToTrigger.function, e.function)) {
                        trigerAlreadyAdded = true;
                        break;

                    }

                }
                if (!trigerAlreadyAdded) {
                    eventsToTrigger.push(e);
                }

            }
        }
    }
//    console.log(">>>eventsToTrigger>>>>" + JSON.stringify(eventsToTrigger))
    d.resolve(eventsToTrigger);
    return d.promise;
}

function needToAddEventFields(eventFields, fields, parentFields) {
//    console.log("eventFields>>>>" + JSON.stringify(eventFields))
//    console.log("fields>>>>" + JSON.stringify(fields))
//    console.log("parentFields>>>>" + JSON.stringify(parentFields))
    if ((!fields || fields.length == 0) && (!eventFields || eventFields.length == 0) && (!parentFields || parentFields.length == 0)) {
        //it will return onInsert/onSave
        return true;
    }
    if (eventFields) {
        for (var i = 0; i < eventFields.length; i++) {
            var eventField = eventFields[i];
            if (Utils.isJSONObject(eventField) && parentFields && parentFields.length > 0 && eventField[parentFields[0]]) {
                var newParentFields = [];
                for (var j = 1; j < parentFields.length; j++) {
                    newParentFields.push(parentFields[j]);
                }
                return needToAddEventFields(eventField[parentFields[0]], fields, newParentFields);
            } else if (typeof eventField == "string" && (!parentFields || parentFields.length == 0)) {
                // check for  onValue
                if (fields) {
                    for (var j = 0; j < fields.length; j++) {
                        var field = fields[j];
                        if (Utils.isExists(eventFields, field) !== undefined) {
                            return true;
                        }
                    }
                }
            }
        }
    }
}
