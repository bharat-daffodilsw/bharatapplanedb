exports.cast = function (value, expression, field) {
    if (value == null || value === undefined) {
        return;
    }
    try {
        if (!(typeof value === 'number')) {
            if (isNaN(Number(value))) {
                throw new Error("Error while casting for expression [" + expression + "] with value [" + value + "]");
            } else {
                return Number(value);
            }

        } else {
            return value;
        }
    } catch (e) {
        throw new Error("Error while casting for expression [" + expression + "] with value [" + value + "]");
    }
}


exports.checkRequired = function (value, expression, field) {
    if (value === undefined || value === null || value.length === 0) {
        throw new Error("Expression [" + expression + "] is mandatory");
    }
}