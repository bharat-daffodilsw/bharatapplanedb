/**
 * Created with IntelliJ IDEA.
 * User: Administrator
 * Date: 3/31/14
 * Time: 10:21 AM
 * To change this template use File | Settings | File Templates.
 */
exports.cast = function (value, expression, field) {
    if (value == null || value == undefined) {
        return
    }
    try {
        if (!(typeof value === 'number' && value % 1 == 0)) {
            if (isNaN(parseInt(value))) {
                throw new Error("Error while casting for expression [" + expression + "] with value [" + value + "]");
            } else {
                return parseInt(value);
            }
        } else {
            return value;
        }
    } catch (e) {
        throw new Error("Error while casting for expression [" + expression + "] with value [" + value + "]");
    }
}

exports.checkRequired = function (value, expression, field) {
    if (value === undefined || value == null || value.length === 0) {
        throw new Error("Expression [" + expression + "] is mandatory");
    }
}

function isInt(data) {
    return typeof data === 'number' && data % 1 == 0;
}

function isFloat(data) {
    return typeof data === 'number' && !isNaN(data);
}
