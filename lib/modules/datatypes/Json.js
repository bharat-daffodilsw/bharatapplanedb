exports.cast = function (value, expression, field) {
    if (value === null || value === undefined) {
        return;
    }
    if (Array.isArray(value)) {
        return value;
    } else if (require("ApplaneCore/apputil/util.js").isJSONObject(value)) {
        return (value);
    } else if (typeof value === 'string') {
        return JSON.parse(value);
    } else {
        throw new Error("Unparsable value[" + value + "]");
    }
}

exports.checkRequired = function (value, expression, field) {
    if (value === null || value === undefined || value.length === 0) {
        throw new Error("Expression [" + expression + "] is mandatory");
    }
}