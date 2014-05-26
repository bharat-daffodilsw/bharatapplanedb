exports.onValue = function (event, document, collection, db, options) {

    var updatedFieldInfo = options.updatedFieldInfo;
    if (!updatedFieldInfo || updatedFieldInfo.type != "number") {
        throw new Error("updatedFieldInfo must be available and must be number but found [" + JSON.stringify(updatedFieldInfo) + "]");
    }
    var value = document.get(updatedFieldInfo.field);
    if (updatedFieldInfo.mandatory) {
        if (value === undefined || value === null) {
            throw new Error("Expression [" + updatedFieldInfo.field + "] is mandatory");
        }
    }
    if (value !== undefined && value !== null && typeof(value) != "number") {
        if (isNaN(Number(value))) {
            throw new Error("Error while casting for expression [" + updatedFieldInfo.field + "] with value [" + value + "]");
        } else {
            document.set(updatedFieldInfo.field, Number(value));
        }
    }
}
