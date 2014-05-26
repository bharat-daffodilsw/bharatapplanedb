/**
 * Created with IntelliJ IDEA.
 * User: Administrator
 * Date: 3/31/14
 * Time: 10:21 AM
 * To change this template use File | Settings | File Templates.
 */
exports.cast = function (value, expression, field) {
    if (value === undefined || value === null) {
        return
    }
    try {
        if (!(typeof value === 'number' && !isNaN(value))) {
            if (isNaN(parseFloat(value))) {
                throw new Error("Error while casting for expression [" + expression + "] with value [" + value + "]");
            } else {
                return parseFloat(value);
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