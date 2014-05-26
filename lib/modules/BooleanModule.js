/**
 * Created with IntelliJ IDEA.
 * User: Administrator
 * Date: 5/26/14
 * Time: 11:58 AM
 * To change this template use File | Settings | File Templates.
 */
exports.onValue = function (event, document, collection, db, options) {
    var updatedFieldInfo = options.updatedFieldInfo;
    if (!updatedFieldInfo || updatedFieldInfo.type != "boolean") {
        throw new Error("updatedFieldInfo must be available and must be boolean but found [" + JSON.stringify(updatedFieldInfo) + "]");
    }
    var value = document.get(updatedFieldInfo.field);
    if (updatedFieldInfo.mandatory) {
        if (value === undefined || value === null) {
            throw new Error("Expression [" + updatedFieldInfo.field + "] is mandatory");
        }
    }
    if (value !== undefined && value !== null) {
        if (value == true || value == "true" || value == "TRUE" || value == 1) {
            document.set(updatedFieldInfo.field, true);
        } else {
            document.set(updatedFieldInfo.field, false);
        }
    }
}
