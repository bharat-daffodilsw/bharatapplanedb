/**
 * Created with IntelliJ IDEA.
 * User: Administrator
 * Date: 5/26/14
 * Time: 11:54 AM
 * To change this template use File | Settings | File Templates.
 */
exports.onValue = function (event, document, collection, db, options) {
    var updatedFieldInfo = options.updatedFieldInfo;
    if (!updatedFieldInfo || updatedFieldInfo.type != "date") {
        throw new Error("updatedFieldInfo must be available and must be date but found [" + JSON.stringify(updatedFieldInfo) + "]");
    }
    var value = document.get(updatedFieldInfo.field);
    if (updatedFieldInfo.mandatory) {
        if (value === undefined || value === null) {
            throw new Error("Expression [" + updatedFieldInfo.field + "] is mandatory");
        }
    }
    if (value !== undefined && value !== null && !(value instanceof Date)) {
        if ("Invalid Date" == new Date(value)) {
            throw  new Error("Error while casting for expression [" + updatedFieldInfo.field + "] with value [" + value + "]");
        } else {
            document.set(updatedFieldInfo.field, new Date(value));
        }
    }
}
