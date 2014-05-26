/**
 * Created with IntelliJ IDEA.
 * User: Administrator
 * Date: 5/26/14
 * Time: 12:59 PM
 * To change this template use File | Settings | File Templates.
 */

var Constants = require("../Constants.js");
var Utils = require("ApplaneCore/apputil/util.js");
exports.onValue = function (event, document, collection, db, options) {
    var updatedFieldInfo = options.updatedFieldInfo;
    if (!updatedFieldInfo || updatedFieldInfo.type != "duration") {
        throw new Error("updatedFieldInfo must be available and must be one of these duration but found [" + JSON.stringify(updatedFieldInfo) + "]");
    }
    if (updatedFieldInfo.type == Constants.Admin.Fields.Type.DURATION) {
        var field = updatedFieldInfo.field;
        field.type = "object";
        field.fields = [
            {field: Constants.Modules.Udt.Duration.TIME, type: "decimal"},
            {field: Constants.Modules.Udt.Duration.UNIT, type: "string"},
            {field: "convertedvalue", type: "number"}
        ];
        insertConvertedValue(document, field);
    }
}

function insertConvertedValue(document, field) {
    var value = document.getDocuments(field.field);
    if (value) {
        var time = value.get(Constants.Modules.Udt.Duration.TIME);
        var unit = value.get(Constants.Modules.Udt.Duration.UNIT);
        if (time === undefined) {
            throw new Error("value is mandatory for expression [" + field.field + ".time ]");
        }
        if (unit === undefined) {
            throw new Error("value is mandatory for expression [" + field.field + ".unit ]");
        }
        var convertedValue = 0;
        if (unit == Constants.Modules.Udt.Duration.Unit.DAYS) {
            convertedValue = time * 8 * 60;
        } else if (unit == Constants.Modules.Udt.Duration.Unit.HRS) {
            convertedValue = time * 60;
        } else if (unit == Constants.Modules.Udt.Duration.Unit.MINUTES) {
            convertedValue = time;
        }
        value.set("convertedvalue", convertedValue);
    }
}