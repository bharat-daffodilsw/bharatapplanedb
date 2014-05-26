var Constants = require("../Constants.js");
exports.updateRoles = function (document, db, callback) {
    console.log("application trigger calleed");
    if (!db.user) {
        callback();
        return;
    }
    var databaseName = db.db.databaseName;
    var userId = db.user._id;
    var label = document.get("label");
    var appid = document.get("_id");
    /*here i am inserting field into pl.roles*/
    var insert = [
        {$collection:"pl.roles", $insert:[
            {"role":label}
        ]}
    ]
    db.batchUpdateById(insert, function (err, result) {
        if (err) {
            callback(err);
            return;
        }
        var res = result["pl.roles"];
        var insertpart = res.$insert[0];
        var roleId = insertpart._id;
        //here i am setting/updating roles field into pl.application
        var app_update = [
            {$collection:"pl.applications", $update:[
                {$query:{_id:appid },
                    $push:{
                        "roles":{$each:[
                            {role:{_id:roleId, role:label}}
                        ]}
                    }, $set:{"db":databaseName}}
            ]}
        ]
        console.log("appupdate???????" + JSON.stringify(app_update));
        db.batchUpdate(app_update, function (err, result) {
            if (err) {
                callback(err);
                return;
            }
            console.log("result of app update>>>>>>>>" + JSON.stringify(result));
            var user_updates = [
                {$collection:"pl.users", $update:[
                    {$query:{_id:userId}, $push:{"roles":{$each:[
                        {role:{_id:roleId, role:label}}
                    ]}}}
                ]}
            ]


            console.log("user_updates???????" + JSON.stringify(user_updates));
            db.batchUpdate(user_updates, function (err, result) {
                if (err) {
                    callback(err);
                    return;
                }
                console.log("result of user update>>>>>>>>" + JSON.stringify(result));
                callback();
            });
        });
    })
}