exports.getCommandLineArgument = function (key) {
    if (process && process.argv) {
        for (var i = 0; i < process.argv.length; i++) {
            var obj = process.argv [i];
            if (obj.indexOf(key + "=") == 0) {
                return obj.substring(obj.indexOf(key + "=") + key.length + 1);
            }

        }
    }
}
