exports.cast = function (value, expression, field) {
    if (value === null || value === undefined) {
        return;
    }
    if (Array.isArray(value)) {
        return JSON.stringify(value);
    } else if (!(typeof value === 'string')) {
        return value.toString();
    } else if (require("ApplaneCore/apputil/util.js").isJSONObject(value)) {
        return JSON.stringify(value);
    } else {
        return value;
    }
}

exports.checkRequired = function (value, expression, field) {
    if (value === null || value === undefined || value.length === 0) {
        throw new Error("Expression [" + expression + "] is mandatory");
    }
}