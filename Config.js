exports.URL = process.env.MONGOLAB_URI || "mongodb://192.168.100.11:27027"
exports.Admin = {
    DB:process.env.ADMIN_DB || "pladmin",
    LOCAL_DB:process.env.LOCAL_DB || "pllocal",
    USER_NAME:process.env.ADMIN_USER || "admin",
    PASSWORD:process.env.ADMIN_PASS || "admin"
};

exports.MongoAdmin = {
    DB:process.env.MONGOADMIN_DB || "admin",
    USER_NAME:process.env.MONGOADMIN_USER || "admin",
    PASSWORD:process.env.MONGOADMIN_PASS || "damin"
};
