exports.cast = function (value, expression, field) {
    if (value === undefined || value === null) {
        return
    }
    try {
        if (!(value instanceof Date)) {
            if ("Invalid Date" == new Date(value)) {
                throw  new Error("Error while casting for expression [" + expression + "] with value [" + value + "]");
            }
            return new Date(value);
        } else {
            return value;
        }
    } catch (e) {
        throw new Error("Error while casting for expression [" + expression + "] with value [" + value + "]");
    }
}
exports.checkRequired = function (value, expression, field) {
    if (value === undefined || value == null) {
        throw new Error("Expression [" + expression + "] is mandatory");
    }
}

