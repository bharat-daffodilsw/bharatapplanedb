exports.cast = function (value, expression, field) {
    if (value === undefined || value === null) {
        return
    }
    if (value == true || value == "true" || value == "TRUE" || value == 1) {
        return true;
    } else {
        return false;
    }
}

exports.checkRequired = function (value, expression, field) {
    if (value === undefined || value == null || value.length === 0) {
        throw new Error("Expression [" + expression + "] is mandatory");
    }
}