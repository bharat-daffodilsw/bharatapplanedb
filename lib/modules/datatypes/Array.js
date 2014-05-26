exports.cast = function (values, expression, field) {
    values = values || [];
    var type = field.type;
    for (var i = 0; i < values.length; i++) {
        var value = values[i];
        if (type === 'object') {
            if (value.type == "insert") {
                if ((value.get("_id") === undefined)) {
                    value.set("_id", require("ApplaneCore/apputil/util.js").getUniqueObjectId());
                }
            }
        }
        var castValue = require("./Object.js").getType(type).cast(value, expression, field);
        if (type !== "object") {
            values[i] = castValue;
        }

    }
}

exports.checkRequired = function (value, expression, field) {
    if (value === undefined || value == null || value.length == 0) {
        throw new Error("Expression [" + expression + "] is mandatory");
    }
}
