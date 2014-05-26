exports.onValue = function (event, document, collection, db, options) {
    var updatedFieldInfo = options.updatedFieldInfo;
    if (!updatedFieldInfo || updatedFieldInfo.type != "string") {
        throw new Error("updatedFieldInfo must be available and must be string but found [" + JSON.stringify(updatedFieldInfo) + "]");
    }
    var value = document.get(updatedFieldInfo.field);
    if (updatedFieldInfo.mandatory) {
        if (value === undefined || value === null) {
            throw new Error("Expression [" + updatedFieldInfo.field + "] is mandatory");
        }
    }
    if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
            value = JSON.stringify(value);
        } else if (!(typeof value === 'string')) {
            value = value.toString();
        } else if (require("ApplaneCore/apputil/util.js").isJSONObject(value)) {
            value = JSON.stringify(value);
        }
        document.set(updatedFieldInfo.field, value);
    }
}