var util = require('util')
var vm = require('vm');

var ApplaneDBError = function (message, code) {
    Error.captureStackTrace(this, this);

    this.message = message || 'Error';
    this.code = code;
    this.applanedberror = true;
    if (code.stack) {
        this.stack = code.stack;
    }
}
util.inherits(ApplaneDBError, Error)
ApplaneDBError.prototype.name = 'ApplaneDB Error'


module.exports = ApplaneDBError
