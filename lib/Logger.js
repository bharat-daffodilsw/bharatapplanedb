var Logger = function (info) {
    this.info = info || {};
    this.info.logs = this.info.logs || [];
}

Logger.prototype.setInfo = function (key, value) {
    if (this.info) {
        this.info[key] = value;
    }
}
Logger.prototype.writeLog = function (log) {
    if (this.info && this.info.logs) {
        this.info.logs.push(log);
    }
}

Logger.prototype.get = function (key) {
    if (this.info) {
        return this.info[key];
    }
}

Logger.prototype.getAll = function () {
    return this.info;
}


Logger.prototype.persist = function (db, callback) {
    if (!this.info || !this.info.totaltime || this.info.totaltime < 200) {
        callback();
        return;
    }
    db.batchUpdateById({$collection: "pl.logs", $insert: this.info}, function (err, res) {
        console.log(err);
        if (callback) {
            callback(err);
        }
    })

}


module.exports = Logger;
