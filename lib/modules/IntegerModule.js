/**
 * Created with IntelliJ IDEA.
 * User: Administrator
 * Date: 5/26/14
 * Time: 12:02 PM
 * To change this template use File | Settings | File Templates.
 */
exports.onValue = function (event, document, collection, db, options) {
    var updatedFieldInfo = options.updatedFieldInfo;
    if (!updatedFieldInfo || updatedFieldInfo.type != "integer") {
        throw new Error("updatedFieldInfo must be available and must be integer but found [" + JSON.stringify(updatedFieldInfo) + "]");
    }
    var value = document.get(updatedFieldInfo.field);
    if (updatedFieldInfo.mandatory) {
        if (value === undefined || value === null) {
            throw new Error("Expression [" + updatedFieldInfo.field + "] is mandatory");
        }
    }
    if (value !== undefined && value !== null && (!(typeof value === 'number' && value % 1 == 0))) {
        if (isNaN(parseInt(value))) {
            throw new Error("Error while casting for expression [" + updatedFieldInfo.field + "] with value [" + value + "]");
        } else {
            document.set(updatedFieldInfo.field, parseInt(value));
        }
    }
}

