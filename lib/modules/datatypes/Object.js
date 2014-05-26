exports.cast = function (document, pExpression, field) {
    if (!document) {
        return;
    }
    var updatedFields = document.getUpdatedFields() || [];
    var fields = field.fields || [];
    for (var i = 0; i < fields.length; i++) {
        var expression = fields[i].field;
        var type = fields[i].type;
        var mandatory = fields[i].mandatory;
        var multiple = fields[i].multiple;
        if (type && type != "fk") {
            if (updatedFields.indexOf(expression) !== -1) {
                var value = type === "object" ? document.getDocuments(expression) : document.get(expression);
                if (value !== undefined || value !== null) {
                    var dataType = multiple ? require("./Array.js") : require("./Object.js").getType(type);
                    var castValue = dataType.cast(value, (pExpression ? pExpression + "." + expression : expression), fields[i]);
                    if (type !== "object" && !multiple) {
                        if (document.isInInc(expression)) {
                            document.inc(expression, castValue);
                        } else {
                            document.set(expression, castValue);
                        }
                    }
                }
            }
            if (mandatory && (document.type === 'insert' || updatedFields.indexOf(expression) !== -1)) {
                var value = type === "object" ? document.getDocuments(expression) : document.get(expression);
                var dataType = multiple ? require("./Array.js") : require("./Object.js").getType(type);
                dataType.checkRequired(value, (pExpression ? pExpression + "." + expression : expression), fields[i]);
            }
        }
    }
    return document;
}

exports.checkRequired = function (value, expression, field) {
    if (value == null || value == undefined) {
        throw new Error("Expression [" + expression + "] is mandatory");
    }
}

exports.getType = function (type) {
    if (type == "date") {
        return require("./Date.js");
    }
    if (type == "boolean") {
        return require("./Boolean.js");
    }
    if (type == "number") {
        return require("./Number.js");
    }
    if (type == "integer") {
        return require("./Integer.js");
    }
    if (type == "decimal") {
        return require("./Decimal.js");
    }
    if (type == "string") {
        return require("./String.js");
    }
    if (type == "object") {
        return require("./Object.js");
    }
    if (type == "json") {
        return require("./Json.js");
    }
}
