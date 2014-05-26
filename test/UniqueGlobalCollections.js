/**
*
* mocha --recursive --timeout 150000 -g "unique global collection testcase" --reporter spec
* collection update
* mocha --recursive --timeout 150000 -g "menus update without change" --reporter spec
*
*/

var expect = require('chai').expect;
var ApplaneDB = require("../lib/DB.js");
var Config = require("./config.js");
var NorthwindDb = require("./NorthwindDb.js");
var Utils = require("ApplaneCore/apputil/util.js");
var Constants = require("../lib/Constants.js");
var ApplaneDBConfig = require("ApplaneDB/Config.js");
var configureOptions = {url:require("./config.js").URL, admin:{db:"uniqueadmindb", username:"admin", password:"1234"}};

describe("unique global collection testcase", function () {

    before(function (done) {
        ApplaneDB.configure(configureOptions, function (err) {
            if (err) {
                done(err);
                return;
            }
            done();
        })
    })

    afterEach(function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            db.dropDatabase(function (err) {
                ApplaneDB.connect(ApplaneDBConfig.URL, ApplaneDBConfig.Admin.DB, function (err, adminDb) {
                    adminDb.dropDatabase(function (err) {
                        done(err);
                    });
                });
            })
        });
    })


    it("collection insert", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var insert = [
                {
                    $collection:Constants.Admin.COLLECTIONS,
                    $insert:[
                        {collection:"states"},
                        {collection:"states"}
                    ]
                }
            ]
            db.batchUpdateById(insert, function (err, res) {
                if (err) {
                    var duplicateError = err.toString().indexOf("Record alreay exists for filter") != -1;
                    if (duplicateError) {
                        done();
                    } else {
                        done(err);
                    }
                    return;
                }
                done("Not Ok");
            })
        })
    })

    it("collection update", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var update = [
                {
                    $collection:Constants.Admin.COLLECTIONS,
                    $insert:[
                        {_id:"stateid", collection:"states"}
                    ]
                },
                {
                    $collection:Constants.Admin.COLLECTIONS,
                    $update:[
                        {_id:"stateid", $set:{collection:"countries"}}
                    ]
                }
            ]

            db.batchUpdateById(update, function (err, res) {
                if (err) {
                    var duplicateError = err.toString().indexOf("Update in not allowed in collection field.") != -1;
                    if (duplicateError) {
                        done();
                        return;
                    } else {
                        done(err);
                        return;
                    }
                }
                done("Not Ok");
            })
        })
    })

    it("collection update without change", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var update = [
                {
                    $collection:Constants.Admin.COLLECTIONS,
                    $insert:[
                        {_id:"stateid", collection:"states"}
                    ]
                },
                {
                    $collection:Constants.Admin.COLLECTIONS,
                    $update:[
                        {_id:"stateid", $set:{collection:"states"}}
                    ]
                }
            ]

            db.batchUpdateById(update, function (err, res) {
                if (err) {
                    done(err);
                    return;
                }
                done();
            })
        })
    })

    it("collection insert with db", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            db.adminDB(function (err, adminDb) {
                if (err) {
                    done(err);
                    return;
                }

                var insert = [
                    {
                        $collection:Constants.Admin.COLLECTIONS,
                        $insert:[
                            { collection:"states"}
                        ]
                    }
                ]
                adminDb.batchUpdateById(insert, function (err, res) {
                    if (err) {
                        done(err);
                        return;
                    }
                    var insert2 = [
                        {
                            $collection:Constants.Admin.COLLECTIONS,
                            $insert:[
                                { collection:"states"}
                            ]
                        }
                    ]
                    db.batchUpdateById(insert2, function (err, res) {
                        if (err) {
                            var duplicateError = err.toString().indexOf("Record alreay exists for filter") != -1;
                            if (duplicateError) {
                                done();
                            } else {
                                done(err);
                            }
                            return;
                        }
                        done("Not Ok");
                    })
                })
            })
        })
    })

    it("collection update with db", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            db.adminDB(function (err, adminDb) {
                if (err) {
                    done(err);
                    return;
                }
                var update = [
                    {
                        $collection:Constants.Admin.COLLECTIONS,
                        $insert:[
                            {_id:"stateid", collection:"states"}
                        ]
                    }
                ]
                adminDb.batchUpdateById(update, function (err, res) {
                    if (err) {
                        done(err);
                        return;
                    }
                    var update2 = [
                        {
                            $collection:Constants.Admin.COLLECTIONS,
                            $update:[
                                {_id:"stateid", $set:{collection:"countries"}}
                            ]
                        }
                    ]
                    db.batchUpdateById(update2, function (err, res) {
                        if (err) {
                            var duplicateError = err.toString().indexOf("Update in not allowed in collection field.") != -1;
                            if (duplicateError) {
                                done();
                            } else {
                                done(err);
                            }
                            return;
                        }
                        done("Not Ok");
                    })
                })
            })
        })
    })

    it("function insert", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            db.adminDB(function (err, adminDb) {
                if (err) {
                    done(err);
                    return;
                }
                var insert = [
                    {
                        $collection:Constants.Admin.FUNCTIONS,
                        $insert:[
                            {name:"states"},
                            {name:"states"}
                        ]
                    }
                ]
                db.batchUpdateById(insert, function (err, res) {
                    if (err) {
                        var duplicateError = err.toString().indexOf("Record alreay exists for filter") != -1;
                        if (duplicateError) {
                            done();
                        } else {
                            done(err);
                        }
                        return;
                    }
                    done("Not Ok");
                })
            })
        })
    })

    it("function update", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var update = [
                {
                    $collection:Constants.Admin.FUNCTIONS,
                    $insert:[
                        {_id:"stateid", name:"states"}
                    ]
                },
                {
                    $collection:Constants.Admin.FUNCTIONS,
                    $update:[
                        {_id:"stateid", $set:{name:"countries"}}
                    ]
                }
            ]

            db.batchUpdateById(update, function (err, res) {
                if (err) {
                    done(err);
                    return;
                }
                done();
            })
        })
    })

    it("function update without change", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var update = [
                {
                    $collection:Constants.Admin.FUNCTIONS,
                    $insert:[
                        {_id:"stateid", name:"states"}
                    ]
                },
                {
                    $collection:Constants.Admin.FUNCTIONS,
                    $update:[
                        {_id:"stateid", $set:{name:"states"}}
                    ]
                }
            ]

            db.batchUpdateById(update, function (err, res) {
                if (err) {
                    done(err);
                    return;
                }
                done();
            })
        })
    })

    it("function insert with db", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            db.adminDB(function (err, adminDb) {
                if (err) {
                    done(err);
                    return;
                }

                var insert = [
                    {
                        $collection:Constants.Admin.FUNCTIONS,
                        $insert:[
                            { name:"states"}
                        ]
                    }
                ]
                adminDb.batchUpdateById(insert, function (err, res) {
                    if (err) {
                        done(err);
                        return;
                    }
                    var insert2 = [
                        {
                            $collection:Constants.Admin.FUNCTIONS,
                            $insert:[
                                { name:"states"}
                            ]
                        }
                    ]
                    db.batchUpdateById(insert2, function (err, res) {
                        if (err) {
                            var duplicateError = err.toString().indexOf("Record alreay exists for filter") != -1;
                            if (duplicateError) {
                                done();
                            } else {
                                done(err);
                            }
                            return;
                        }
                        done("Not Ok");
                    })
                })
            })
        })
    })

    it("function update with db", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            db.adminDB(function (err, adminDb) {
                if (err) {
                    done(err);
                    return;
                }
                var update = [
                    {
                        $collection:Constants.Admin.FUNCTIONS,
                        $insert:[
                            {_id:"stateid", name:"states"}
                        ]
                    }
                ]
                adminDb.batchUpdateById(update, function (err, res) {
                    if (err) {
                        done(err);
                        return;
                    }
                    var update2 = [
                        {
                            $collection:Constants.Admin.FUNCTIONS,
                            $update:[
                                {_id:"stateid", $set:{name:"countries"}}
                            ]
                        }
                    ]
                    db.batchUpdateById(update2, function (err, res) {
                        if (err) {
                            done(err);
                            return;
                        }
                        done();
                    })
                })
            })
        })
    })

    it("role insert", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var insert = [
                {
                    $collection:Constants.Admin.ROLES,
                    $insert:[
                        {role:"admin"},
                        {role:"admin"}
                    ]
                }
            ]
            db.batchUpdateById(insert, function (err, res) {
                if (err) {
                    var duplicateError = err.toString().indexOf("Record alreay exists for filter") != -1;
                    if (duplicateError) {
                        done();
                    } else {
                        done(err);
                    }
                    return;
                }
                done("Not Ok");
            })
        })
    })

    it("role update", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var update = [
                {
                    $collection:Constants.Admin.ROLES,
                    $insert:[
                        {_id:"admin", role:"admin"}
                    ]
                },
                {
                    $collection:Constants.Admin.ROLES,
                    $update:[
                        {_id:"admin", $set:{role:"crmadmin"}}
                    ]
                }
            ]

            db.batchUpdateById(update, function (err, res) {
                if (err) {
                    var duplicateError = err.toString().indexOf("Update in not allowed in role field.") != -1;
                    if (duplicateError) {
                        done();
                        return;
                    } else {
                        done(err);
                        return;
                    }
                }
                done("Not Ok");
            })
        })
    })

    it("role update without change", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var update = [
                {
                    $collection:Constants.Admin.ROLES,
                    $insert:[
                        {_id:"admin", role:"admin"}
                    ]
                },
                {
                    $collection:Constants.Admin.ROLES,
                    $update:[
                        {_id:"admin", $set:{role:"admin"}}
                    ]
                }
            ]

            db.batchUpdateById(update, function (err, res) {
                if (err) {
                    done(err);
                    return;
                }
                done();
            })
        })
    })

    it("role insert with db", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            db.adminDB(function (err, adminDb) {
                if (err) {
                    done(err);
                    return;
                }

                var insert = [
                    {
                        $collection:Constants.Admin.ROLES,
                        $insert:[
                            { role:"admin"}
                        ]
                    }
                ]
                adminDb.batchUpdateById(insert, function (err, res) {
                    if (err) {
                        done(err);
                        return;
                    }
                    var insert2 = [
                        {
                            $collection:Constants.Admin.ROLES,
                            $insert:[
                                { role:"admin"}
                            ]
                        }
                    ]
                    db.batchUpdateById(insert2, function (err, res) {
                        if (err) {
                            var duplicateError = err.toString().indexOf("Record alreay exists for filter") != -1;
                            if (duplicateError) {
                                done();
                            } else {
                                done(err);
                            }
                            return;
                        }
                        done("Not Ok");
                    })
                })
            })
        })
    })

    it("role update with db", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            db.adminDB(function (err, adminDb) {
                if (err) {
                    done(err);
                    return;
                }
                var update = [
                    {
                        $collection:Constants.Admin.ROLES,
                        $insert:[
                            {_id:"admin", role:"admin"}
                        ]
                    }
                ]
                adminDb.batchUpdateById(update, function (err, res) {
                    if (err) {
                        done(err);
                        return;
                    }
                    var update2 = [
                        {
                            $collection:Constants.Admin.ROLES,
                            $update:[
                                {_id:"admin", $set:{role:"CRMadmin"}}
                            ]
                        }
                    ]
                    db.batchUpdateById(update2, function (err, res) {
                        if (err) {
                            var duplicateError = err.toString().indexOf("Update in not allowed in role field.") != -1;
                            if (duplicateError) {
                                done();
                            } else {
                                done(err);
                            }
                            return;
                        }
                        done("Not Ok");
                    })
                })
            })
        })
    })

    it("qview insert", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var insert = [
                {
                    $collection:Constants.Admin.COLLECTIONS,
                    $insert:[
                        {_id:"State", collection:"State"},
                        {_id:"Countries", collection:"Countries"}
                    ]
                },
                {
                    $collection:Constants.Admin.QVIEWS,
                    $insert:[
                        {id:"StateView", label:"State", collection:{_id:"State"}},
                        {id:"StateView1", label:"State", collection:{_id:"State"}},
                        {id:"StateView2", label:"Country", collection:{_id:"Countries"}}
                    ]
                }
            ]
            db.batchUpdateById(insert, function (err, res) {
                if (err) {
                    done(err);
                    return;
                }
                var insert = [
                    {
                        $collection:Constants.Admin.QVIEWS,
                        $insert:[
                            {id:"StateView", label:"view1", collection:{_id:"State"}}
                        ]
                    }
                ]
                db.batchUpdateById(insert, function (err, res) {
                    if (err) {
                        var duplicateError = err.toString().indexOf("Record alreay exists for filter") != -1;
                        if (duplicateError) {
                            done();
                        } else {
                            done(err);
                        }
                        return;
                    }
                    done("Not Ok");
                })
            })
        })
    })

    it("qview update", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var insert = [
                {
                    $collection:Constants.Admin.COLLECTIONS,
                    $insert:[
                        {_id:"State", collection:"State"}
                    ]
                },
                {
                    $collection:Constants.Admin.QVIEWS,
                    $insert:[
                        {_id:"view1", id:"StateView", label:"view1", collection:{_id:"State"}}
                    ]
                },
                {
                    $collection:Constants.Admin.QVIEWS,
                    $update:[
                        {_id:"view1", $set:{id:"StateView1"}}
                    ]
                }
            ]
            db.batchUpdateById(insert, function (err, res) {
                if (err) {
                    var duplicateError = err.toString().indexOf("Update is not allowed in id field") != -1;
                    if (duplicateError) {
                        done();
                    } else {
                        done(err);
                    }
                    return;
                }
                done("Not Ok");
            })
        })
    })

    it("qview update without change", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var insert = [
                {
                    $collection:Constants.Admin.COLLECTIONS,
                    $insert:[
                        {_id:"State", collection:"State"}
                    ]
                },
                {
                    $collection:Constants.Admin.QVIEWS,
                    $insert:[
                        {_id:"view1", id:"StateView", label:"view1", collection:{_id:"State"}}
                    ]
                },
                {
                    $collection:Constants.Admin.QVIEWS,
                    $update:[
                        {_id:"view1", $set:{collection:{_id:"State"}}}
                    ]
                }
            ]
            db.batchUpdateById(insert, function (err, res) {
                if (err) {
                    done(err);
                    return;
                }
                done();
            })
        })
    })

    it("qview insert with db", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            db.adminDB(function (err, adminDb) {
                if (err) {
                    done(err);
                    return;
                }
                var insert = [
                    {
                        $collection:Constants.Admin.COLLECTIONS,
                        $insert:[
                            {_id:"State", collection:"State"}
                        ]
                    },
                    {
                        $collection:Constants.Admin.QVIEWS,
                        $insert:[
                            {id:"StateView", label:"view1", collection:{_id:"State"}}
                        ]
                    }
                ]
                adminDb.batchUpdateById(insert, function (err, res) {
                    if (err) {
                        done(err);
                        return;
                    }
                    var insert = [
                        {
                            $collection:Constants.Admin.QVIEWS,
                            $insert:[
                                {id:"StateView", label:"view2", collection:{_id:"State"}}
                            ]
                        }
                    ]
                    db.batchUpdateById(insert, function (err, res) {
                        if (err) {
                            var duplicateError = err.toString().indexOf("Record alreay exists for filter") != -1;
                            if (duplicateError) {
                                done();
                            } else {
                                done(err);
                            }
                            return;
                        }
                        done("Not Ok");
                    })
                })
            })
        })
    })

    it("qview update with db", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            db.adminDB(function (err, adminDb) {
                if (err) {
                    done(err);
                    return;
                }
                var insert = [
                    {
                        $collection:Constants.Admin.COLLECTIONS,
                        $insert:[
                            {_id:"State", collection:"State"}
                        ]
                    },
                    {
                        $collection:Constants.Admin.QVIEWS,
                        $insert:[
                            {_id:"view1", id:"StateView", label:"view1", collection:{_id:"State"}}
                        ]
                    }
                ]
                adminDb.batchUpdateById(insert, function (err, res) {
                    if (err) {
                        done(err);
                        return;
                    }

                    var update = [
                        {
                            $collection:Constants.Admin.QVIEWS,
                            $update:[
                                {_id:"view1", label:"view2", $set:{id:"StateView1"}}
                            ]
                        }
                    ]
                    db.batchUpdateById(update, function (err, res) {
                        if (err) {
                            var duplicateError = err.toString().indexOf("Update is not allowed in id field") != -1;
                            if (duplicateError) {
                                done();
                            } else {
                                done(err);
                            }
                            return;
                        }
                        done("Not Ok");
                    })
                })
            })
        })
    })

    it("applications insert", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var insert = [
                {
                    $collection:Constants.Admin.APPLICATIONS,
                    $insert:[
                        {label:"CRM", db:"CRM"},
                        {label:"CRM", db:"CRM1"}
                    ]
                }
            ]
            db.batchUpdateById(insert, function (err, res) {
                if (err) {
                    done(err);
                    return;
                }
                insert = [
                    {
                        $collection:Constants.Admin.APPLICATIONS,
                        $insert:[
                            {label:"CRM", db:"CRM"}
                        ]
                    }
                ]
                db.batchUpdateById(insert, function (err, res) {
                    if (err) {
                        var duplicateError = err.toString().indexOf("Record alreay exists for filter") != -1;
                        if (duplicateError) {
                            done();
                        } else {
                            done(err);
                        }
                        return;
                    }
                    done("Not Ok");
                })
            })
        })
    })

    it("applications update", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var update = [
                {
                    $collection:Constants.Admin.APPLICATIONS,
                    $insert:[
                        {_id:1, label:"CRM", db:"CRM"}
                    ]
                },
                {
                    $collection:Constants.Admin.APPLICATIONS,
                    $update:[
                        {_id:1, $set:{label:"CRM1"}}
                    ]
                }
            ]

            db.batchUpdateById(update, function (err, res) {
                if (err) {
                    done(err);
                    return;
                }

                var update = [
                    {
                        $collection:Constants.Admin.APPLICATIONS,
                        $update:[
                            {_id:1, $set:{db:"CRM1"}}
                        ]
                    }
                ]
                db.batchUpdateById(update, function (err, res) {
                    if (err) {
                        var duplicateError = err.toString().indexOf("Update in not allowed in db field.") != -1;
                        if (duplicateError) {
                            done();
                            return;
                        } else {
                            done(err);
                            return;
                        }
                    }
                    done("Not Ok");
                })
            })
        })
    })

    it("applications update without change", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var update = [
                {
                    $collection:Constants.Admin.APPLICATIONS,
                    $insert:[
                        {_id:1, label:"CRM", db:"CRM"}
                    ]
                },
                {
                    $collection:Constants.Admin.APPLICATIONS,
                    $update:[
                        {_id:1, $set:{label:"CRM1"}}
                    ]
                }
            ]

            db.batchUpdateById(update, function (err, res) {
                if (err) {
                    done(err);
                    return;
                }

                var update = [
                    {
                        $collection:Constants.Admin.APPLICATIONS,
                        $update:[
                            {_id:1, $set:{db:"CRM"}}
                        ]
                    }
                ]
                db.batchUpdateById(update, function (err, res) {
                    if (err) {
                        done(err);
                        return;
                    }
                    done();
                })
            })
        })
    })

    it("applications insert with db", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            db.adminDB(function (err, adminDb) {
                if (err) {
                    done(err);
                    return;
                }

                var insert = [
                    {
                        $collection:Constants.Admin.APPLICATIONS,
                        $insert:[
                            { label:"CRM", db:"CRM"}
                        ]
                    }
                ];
                adminDb.batchUpdateById(insert, function (err, res) {
                    if (err) {
                        done(err);
                        return;
                    }
                    var insert2 = [
                        {
                            $collection:Constants.Admin.APPLICATIONS,
                            $insert:[
                                { label:"CRM", db:"CRM"}
                            ]
                        }
                    ]
                    db.batchUpdateById(insert2, function (err, res) {
                        if (err) {
                            var duplicateError = err.toString().indexOf("Record alreay exists for filter") != -1;
                            if (duplicateError) {
                                done();
                            } else {
                                done(err);
                            }
                            return;
                        }
                        done("Not Ok");
                    })
                })
            })
        })
    })

    it("applications update with db", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            db.adminDB(function (err, adminDb) {
                if (err) {
                    done(err);
                    return;
                }
                var update = [
                    {
                        $collection:Constants.Admin.APPLICATIONS,
                        $insert:[
                            {_id:"CRM", label:"CRM", db:"CRM"}
                        ]
                    }
                ]
                adminDb.batchUpdateById(update, function (err, res) {
                    if (err) {
                        done(err);
                        return;
                    }
                    var update2 = [
                        {
                            $collection:Constants.Admin.APPLICATIONS,
                            $update:[
                                {_id:"CRM", $set:{db:"CRM1"}}
                            ]
                        }
                    ]
                    db.batchUpdateById(update2, function (err, res) {
                        if (err) {
                            var duplicateError = err.toString().indexOf("Update in not allowed in db field.") != -1;
                            if (duplicateError) {
                                done();
                            } else {
                                done(err);
                            }
                            return;
                        }
                        done("Not Ok");
                    })
                })
            })
        })
    })

    it("actions insert", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var insert = [
                {
                    $collection:Constants.Admin.COLLECTIONS,
                    $insert:[
                        {_id:"State", collection:"State"},
                        {_id:"Countries", collection:"Countries"}
                    ]
                },
                {
                    $collection:Constants.Admin.ACTIONS,
                    $insert:[
                        {label:"StateView", collectionid:{_id:"State"}, "type":"invoke"},
                        {label:"StateView1", collectionid:{_id:"State"}, "type":"invoke"},
                        {label:"StateView", collectionid:{_id:"Countries"}, "type":"invoke"}
                    ]
                }
            ]
            db.batchUpdateById(insert, function (err, res) {
                if (err) {
                    done(err);
                    return;
                }
                var insert = [
                    {
                        $collection:Constants.Admin.ACTIONS,
                        $insert:[
                            {label:"StateView", collectionid:{_id:"State"}, "type":"invoke"}
                        ]
                    }
                ]
                db.batchUpdateById(insert, function (err, res) {
                    if (err) {
                        var duplicateError = err.toString().indexOf("Record alreay exists for filter") != -1;
                        if (duplicateError) {
                            done();
                        } else {
                            done(err);
                        }
                        return;
                    }
                    done("Not Ok");
                })
            })
        })
    })

    it("actions update", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var insert = [
                {
                    $collection:Constants.Admin.COLLECTIONS,
                    $insert:[
                        {_id:"State", collection:"State"}
                    ]
                },
                {
                    $collection:Constants.Admin.ACTIONS,
                    $insert:[
                        {_id:1, label:"StateView", collectionid:{_id:"State"}, "type":"invoke"},
                        {_id:2, label:"StateView1", collectionid:{_id:"State"}, "type":"invoke"}
                    ]
                },
                {
                    $collection:Constants.Admin.ACTIONS,
                    $update:[
                        {_id:1, $set:{label:"StateView2"}}
                    ]
                }
            ]
            db.batchUpdateById(insert, function (err, res) {
                if (err) {
                    done(err);
                    return;
                }
                var insert = [
                    {
                        $collection:Constants.Admin.ACTIONS,
                        $update:[
                            {_id:1, $set:{label:"StateView1"}}
                        ]
                    }
                ]
                db.batchUpdateById(insert, function (err, res) {
                    if (err) {
                        var duplicateError = err.toString().indexOf("Record alreay exists for filter") != -1;
                        if (duplicateError) {
                            done();
                        } else {
                            done(err);
                        }
                        return;
                    }
                    done("Not Ok");
                })
            })
        })
    })

    it("actions update without change", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var insert = [
                {
                    $collection:Constants.Admin.COLLECTIONS,
                    $insert:[
                        {_id:"State", collection:"State"}
                    ]
                },
                {
                    $collection:Constants.Admin.ACTIONS,
                    $insert:[
                        {_id:1, label:"StateView", collectionid:{_id:"State"}, "type":"invoke"},
                        {_id:2, label:"StateView1", collectionid:{_id:"State"}, "type":"invoke"}
                    ]
                },
                {
                    $collection:Constants.Admin.ACTIONS,
                    $update:[
                        {_id:1, $set:{label:"StateView2"}}
                    ]
                }
            ]
            db.batchUpdateById(insert, function (err, res) {
                if (err) {
                    done(err);
                    return;
                }
                var insert = [
                    {
                        $collection:Constants.Admin.ACTIONS,
                        $update:[
                            {_id:1, $set:{collectionid:{_id:"State"}}}
                        ]
                    }
                ]
                db.batchUpdateById(insert, function (err, res) {
                    if (err) {
                        done(err);
                        return;
                    }
                    done();
                })
            })
        })
    })

    it("actions insert with db", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            db.adminDB(function (err, adminDb) {
                if (err) {
                    done(err);
                    return;
                }
                var insert = [
                    {
                        $collection:Constants.Admin.COLLECTIONS,
                        $insert:[
                            {_id:"State", collection:"State"}
                        ]
                    },
                    {
                        $collection:Constants.Admin.ACTIONS,
                        $insert:[
                            {label:"StateView", collectionid:{_id:"State"}, "type":"invoke"}
                        ]
                    }
                ]
                adminDb.batchUpdateById(insert, function (err, res) {
                    if (err) {
                        done(err);
                        return;
                    }
                    var insert = [
                        {
                            $collection:Constants.Admin.ACTIONS,
                            $insert:[
                                {label:"StateView", collectionid:{_id:"State"}, "type":"invoke"}
                            ]
                        }
                    ]
                    db.batchUpdateById(insert, function (err, res) {
                        if (err) {
                            var duplicateError = err.toString().indexOf("Record alreay exists for filter") != -1;
                            if (duplicateError) {
                                done();
                            } else {
                                done(err);
                            }
                            return;
                        }
                        done("Not Ok");
                    })
                })
            })
        })
    })

    it("actions update with db", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            db.adminDB(function (err, adminDb) {
                if (err) {
                    done(err);
                    return;
                }
                var insert = [
                    {
                        $collection:Constants.Admin.COLLECTIONS,
                        $insert:[
                            {_id:"State", collection:"State"}
                        ]
                    },
                    {
                        $collection:Constants.Admin.ACTIONS,
                        $insert:[
                            {_id:1, label:"StateView", collectionid:{_id:"State"}, "type":"invoke"},
                            {_id:2, label:"StateView1", collectionid:{_id:"State"}, "type":"invoke"}
                        ]
                    }
                ]
                adminDb.batchUpdateById(insert, function (err, res) {
                    if (err) {
                        done(err);
                        return;
                    }

                    var update = [
                        {
                            $collection:Constants.Admin.ACTIONS,
                            $update:[
                                {_id:1, $set:{label:"StateView1"}}
                            ]
                        }
                    ]
                    db.batchUpdateById(update, function (err, res) {
                        if (err) {
                            var duplicateError = err.toString().indexOf("Record alreay exists for filter") != -1;
                            if (duplicateError) {
                                done();
                            } else {
                                done(err);
                            }
                            return;
                        }
                        done("Not Ok");
                    })
                })
            })
        })
    })

    it("formgroups insert", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var insert = [
                {
                    $collection:Constants.Admin.COLLECTIONS,
                    $insert:[
                        {_id:"State", collection:"State"},
                        {_id:"Countries", collection:"Countries"}
                    ]
                },
                {
                    $collection:Constants.Admin.FORM_GROUPS,
                    $insert:[
                        {title:"StateView", collectionid:{_id:"State"}},
                        {title:"StateView1", collectionid:{_id:"State"}},
                        {title:"", collectionid:{_id:"Countries"}}
                    ]
                }
            ]
            db.batchUpdateById(insert, function (err, res) {
                if (err) {
                    done(err);
                    return;
                }
                var insert = [
                    {
                        $collection:Constants.Admin.FORM_GROUPS,
                        $insert:[
                            {title:"", collectionid:{_id:"Countries"}}
                        ]
                    }
                ]
                db.batchUpdateById(insert, function (err, res) {
                    if (err) {
                        var duplicateError = err.toString().indexOf("Record alreay exists for filter") != -1;
                        if (duplicateError) {
                            done();
                        } else {
                            done(err);
                        }
                        return;
                    }
                    done("Not Ok");
                })
            })
        })
    })

    it("formgroups update", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var insert = [
                {
                    $collection:Constants.Admin.COLLECTIONS,
                    $insert:[
                        {_id:"State", collection:"State"}
                    ]
                },
                {
                    $collection:Constants.Admin.FORM_GROUPS,
                    $insert:[
                        {_id:1, title:"StateView", collectionid:{_id:"State"}},
                        {_id:2, title:"StateView1", collectionid:{_id:"State"}}
                    ]
                },
                {
                    $collection:Constants.Admin.FORM_GROUPS,
                    $update:[
                        {_id:1, $set:{title:"StateView2"}}
                    ]
                }
            ]
            db.batchUpdateById(insert, function (err, res) {
                if (err) {
                    done(err);
                    return;
                }
                var insert = [
                    {
                        $collection:Constants.Admin.FORM_GROUPS,
                        $update:[
                            {_id:1, $set:{title:"StateView1"}}
                        ]
                    }
                ]
                db.batchUpdateById(insert, function (err, res) {
                    if (err) {
                        var duplicateError = err.toString().indexOf("Record alreay exists for filter") != -1;
                        if (duplicateError) {
                            done();
                        } else {
                            done(err);
                        }
                        return;
                    }
                    done("Not Ok");
                })
            })
        })
    })

    it("formgroups update without change", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var insert = [
                {
                    $collection:Constants.Admin.COLLECTIONS,
                    $insert:[
                        {_id:"State", collection:"State"}
                    ]
                },
                {
                    $collection:Constants.Admin.FORM_GROUPS,
                    $insert:[
                        {_id:1, title:"StateView", collectionid:{_id:"State"}},
                        {_id:2, title:"StateView1", collectionid:{_id:"State"}}
                    ]
                },
                {
                    $collection:Constants.Admin.FORM_GROUPS,
                    $update:[
                        {_id:1, $set:{title:"StateView2"}}
                    ]
                }
            ]
            db.batchUpdateById(insert, function (err, res) {
                if (err) {
                    done(err);
                    return;
                }
                var insert = [
                    {
                        $collection:Constants.Admin.FORM_GROUPS,
                        $update:[
                            {_id:1, $set:{collectionid:{_id:"State"}}}
                        ]
                    }
                ]
                db.batchUpdateById(insert, function (err, res) {
                    if (err) {
                        done(err);
                        return;
                    }
                    done();
                })
            })
        })
    })

    it("formgroups insert with db", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            db.adminDB(function (err, adminDb) {
                if (err) {
                    done(err);
                    return;
                }
                var insert = [
                    {
                        $collection:Constants.Admin.COLLECTIONS,
                        $insert:[
                            {_id:"State", collection:"State"}
                        ]
                    },
                    {
                        $collection:Constants.Admin.FORM_GROUPS,
                        $insert:[
                            {title:"StateView", collectionid:{_id:"State"}}
                        ]
                    }
                ]
                adminDb.batchUpdateById(insert, function (err, res) {
                    if (err) {
                        done(err);
                        return;
                    }
                    var insert = [
                        {
                            $collection:Constants.Admin.FORM_GROUPS,
                            $insert:[
                                {title:"StateView", collectionid:{_id:"State"}}
                            ]
                        }
                    ]
                    db.batchUpdateById(insert, function (err, res) {
                        if (err) {
                            var duplicateError = err.toString().indexOf("Record alreay exists for filter") != -1;
                            if (duplicateError) {
                                done();
                            } else {
                                done(err);
                            }
                            return;
                        }
                        done("Not Ok");
                    })
                })
            })
        })
    })

    it("formgroups update with db", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            db.adminDB(function (err, adminDb) {
                if (err) {
                    done(err);
                    return;
                }
                var insert = [
                    {
                        $collection:Constants.Admin.COLLECTIONS,
                        $insert:[
                            {_id:"State", collection:"State"}
                        ]
                    },
                    {
                        $collection:Constants.Admin.FORM_GROUPS,
                        $insert:[
                            {_id:1, title:"StateView", collectionid:{_id:"State"}},
                            {_id:2, title:"StateView1", collectionid:{_id:"State"}}
                        ]
                    }
                ]
                adminDb.batchUpdateById(insert, function (err, res) {
                    if (err) {
                        done(err);
                        return;
                    }

                    var update = [
                        {
                            $collection:Constants.Admin.FORM_GROUPS,
                            $update:[
                                {_id:1, $set:{title:"StateView1"}}
                            ]
                        }
                    ]
                    db.batchUpdateById(update, function (err, res) {
                        if (err) {
                            var duplicateError = err.toString().indexOf("Record alreay exists for filter") != -1;
                            if (duplicateError) {
                                done();
                            } else {
                                done(err);
                            }
                            return;
                        }
                        done("Not Ok");
                    })
                })
            })
        })
    })

    it("field insert", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var insert = [
                {
                    $collection:Constants.Admin.COLLECTIONS,
                    $insert:[
                        {_id:"Haryana01", collection:"Haryana01"}
                    ]
                },
                {
                    $collection:Constants.Admin.FIELDS,
                    $insert:[
                        {_id:"haryana", field:"stateCode", collectionid:{_id:"Haryana01"}},
                        {_id:"har", field:"stateCode", collectionid:{_id:"Haryana01"}}
                    ]
                }
            ]
            db.batchUpdateById(insert, function (err, res) {
                if (err) {
                    var duplicateError = err.toString().indexOf("Record alreay exists for filter") != -1;
                    if (duplicateError) {
                        done();
                    } else {
                        done(err);
                    }
                    return;
                }
                done("Not Ok");
            })
        })
    })

    it("field update", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var update = [
                {
                    $collection:Constants.Admin.COLLECTIONS,
                    $insert:[
                        {_id:"Haryana01", collection:"Haryana01"} ,
                        {_id:"Haryana02", collection:"Haryana02"}
                    ]
                },
                {
                    $collection:Constants.Admin.FIELDS,
                    $insert:[

                        {_id:"haryana1", field:"state01", collectionid:{_id:"Haryana01"}},
                        {_id:"haryana2", field:"state02", collectionid:{_id:"Haryana01"}, parentfieldid:{_id:"haryana1"}},
                        {_id:"haryana4", field:"state02", collectionid:{_id:"Haryana01"}}
                    ]
                },
            ]
            db.batchUpdateById(update, function (err, res) {
                if (err) {
                    done(err);
                    return;
                }
                var update = [
                    {
                        $collection:Constants.Admin.FIELDS,
                        $update:[
                            {_id:"haryana4", $set:{parentfieldid:{_id:"haryana1"}} }
                        ]
                    }
                ]
                db.batchUpdateById(update, function (err, res) {
                    if (err) {
                        var duplicateError = err.toString().indexOf("Record alreay exists for filter") != -1;
                        if (duplicateError) {
                            done();
                        } else {
                            done(err);
                        }
                        return;
                    }
                    done("Not Ok");
                })
            })
        })
    })

    it("field update without change", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var update = [
                {
                    $collection:Constants.Admin.COLLECTIONS,
                    $insert:[
                        {_id:"Haryana01", collection:"Haryana01"} ,
                        {_id:"Haryana02", collection:"Haryana02"}
                    ]
                },
                {
                    $collection:Constants.Admin.FIELDS,
                    $insert:[

                        {_id:"haryana1", field:"state01", collectionid:{_id:"Haryana01"}},
                        {_id:"haryana2", field:"state02", collectionid:{_id:"Haryana01"}, parentfieldid:{_id:"haryana1"}},
                        {_id:"haryana4", field:"state02", collectionid:{_id:"Haryana01"}}
                    ]
                },
            ]
            db.batchUpdateById(update, function (err, res) {
                if (err) {
                    done(err);
                    return;
                }
                var update = [
                    {
                        $collection:Constants.Admin.FIELDS,
                        $update:[
                            {_id:"haryana4", $set:{collectionid:{_id:"Haryana01"}} }
                        ]
                    }
                ]
                db.batchUpdateById(update, function (err, res) {
                    if (err) {
                        done(err);
                        return;
                    }
                    done();
                })
            })
        })
    })

    it("field insert with db", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            db.adminDB(function (err, adminDb) {
                if (err) {
                    done(err);
                    return;
                }
                var insert = [
                    {
                        $collection:Constants.Admin.COLLECTIONS,
                        $insert:[
                            {_id:"Haryana01", collection:"Haryana01"}
                        ]
                    },
                    {
                        $collection:Constants.Admin.FIELDS,
                        $insert:[
                            {_id:"har", field:"stateCode", collectionid:{_id:"Haryana01"}}
                        ]
                    }
                ]
                adminDb.batchUpdateById(insert, function (err, res) {
                    if (err) {
                        done(err);
                        return;
                    }
                    var insert2 = [
                        {
                            $collection:Constants.Admin.FIELDS,
                            $insert:[
                                {_id:"haryana", field:"stateCode", collectionid:{_id:"Haryana01"}}
                            ]
                        }
                    ]
                    db.batchUpdateById(insert2, function (err, res) {
                        if (err) {
                            var duplicateError = err.toString().indexOf("Record alreay exists for filter") != -1;
                            if (duplicateError) {
                                done();
                            } else {
                                done(err);
                            }
                            return;
                        }
                        done("Not Ok");
                    })
                })
            })
        })
    })

    it("field update with db", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            db.adminDB(function (err, adminDb) {
                if (err) {
                    done(err);
                    return;
                }
                var update = [
                    {
                        $collection:Constants.Admin.COLLECTIONS,
                        $insert:[
                            {_id:"Haryana01", collection:"Haryana01"} ,
                            {_id:"Haryana02", collection:"Haryana02"}
                        ]
                    },
                    {
                        $collection:Constants.Admin.FIELDS,
                        $insert:[

                            {_id:"haryana1", field:"state01", collectionid:{_id:"Haryana01"}},
                            {_id:"haryana2", field:"state02", collectionid:{_id:"Haryana01"}},
                            {_id:"haryana4", field:"state01", collectionid:{_id:"Haryana02"}}
                        ]
                    }
                ]
                adminDb.batchUpdateById(update, function (err, res) {
                    if (err) {
                        done(err);
                        return;
                    }
                    var update2 = [
                        {
                            $collection:Constants.Admin.FIELDS,
                            $update:[
                                {_id:"haryana1", $set:{field:"state02"} }
                            ]
                        }
                    ]
                    db.batchUpdateById(update2, function (err, res) {
                        if (err) {
                            var duplicateError = err.toString().indexOf("Record alreay exists for filter") != -1;
                            if (duplicateError) {
                                done();
                            } else {
                                done(err);
                            }
                            return;
                        }
                        done("Not Ok");
                    })
                })
            })
        })
    })

    it("menus insert", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var insert = [
                {
                    $collection:Constants.Admin.APPLICATIONS,
                    $insert:[
                        {_id:"ReportGeneration1", label:"Menu", roles:{role:"help"}, db:"this"} ,
                        {_id:"ReportGeneration2", label:"Menu1", roles:{role:"help"}, db:"this"}
                    ]
                },
                {
                    $collection:Constants.Admin.MENUS,
                    $insert:[
                        {_id:"Menu01", label:"Menu", application:{_id:"ReportGeneration1"}} ,
                        {_id:"Menu12", label:"subMenu", parentmenu:{_id:"Menu01"}, application:{_id:"ReportGeneration1"} },
                        {_id:"Menu02", label:"Menu", application:{_id:"ReportGeneration2"}},
                        {_id:"Menu01", label:"Menu", application:{_id:"ReportGeneration2"}}
                    ]
                }
            ]
            db.batchUpdateById(insert, function (err, res) {
                if (err) {
                    var duplicateError = err.toString().indexOf("Record alreay exists for filter") != -1;
                    if (duplicateError) {
                        done();
                    } else {
                        done(err);
                    }
                    return;
                }
                done("Not Ok");
            })
        })
    })

    it("menus update", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var update = [
                {
                    $collection:Constants.Admin.APPLICATIONS,
                    $insert:[
                        {_id:"ReportGeneration1", label:"Menu", roles:{role:"help"}, db:"this"} ,
                        {_id:"ReportGeneration2", label:"Menu1", roles:{role:"help"}, db:"this"}
                    ]
                },
                {
                    $collection:Constants.Admin.MENUS,
                    $insert:[
                        {_id:"Menu01", label:"Menu", application:{_id:"ReportGeneration1"}} ,
                        {_id:"Menu12", label:"subMenu", parentmenu:{_id:"Menu01"}, application:{_id:"ReportGeneration1"} },
                        {_id:"Menu02", label:"Menu", application:{_id:"ReportGeneration2"}},
                        {_id:"Menu03", label:"Menu00", application:{_id:"ReportGeneration2"}}
                    ]
                },
                {
                    $collection:Constants.Admin.MENUS,
                    $update:[
                        {_id:"Menu02", $set:{label:"Menu00"}}
                    ]
                }
            ]
            db.batchUpdateById(update, function (err, res) {
                if (err) {
                    var duplicateError = err.toString().indexOf("Record alreay exists for filter") != -1;
                    if (duplicateError) {
                        done();
                    } else {
                        done(err);
                    }
                    return;
                }
                done("Not Ok");
            })
        })
    })

    it("menus update without change", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var update = [
                {
                    $collection:Constants.Admin.APPLICATIONS,
                    $insert:[
                        {_id:"ReportGeneration1", label:"Menu", roles:{role:"help"}, db:"this"} ,
                        {_id:"ReportGeneration2", label:"Menu1", roles:{role:"help"}, db:"this"}
                    ]
                },
                {
                    $collection:Constants.Admin.MENUS,
                    $insert:[
                        {_id:"Menu01", label:"Menu", application:{_id:"ReportGeneration1"}} ,
                        {_id:"Menu12", label:"subMenu", parentmenu:{_id:"Menu01"}, application:{_id:"ReportGeneration1"} },
                        {_id:"Menu02", label:"Menu", application:{_id:"ReportGeneration2"}}
                    ]
                },
                {
                    $collection:Constants.Admin.MENUS,
                    $update:[
                        {_id:"Menu02", $set:{label:"Menu"}}
                    ]
                }
            ]
            db.batchUpdateById(update, function (err, res) {
                if (err) {
                    done(err);
                    return;
                }
                done();
            })
        })
    })

    it("menus insert with db", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            db.adminDB(function (err, adminDb) {
                if (err) {
                    done(err);
                    return;
                }
                var insert = [
                    {
                        $collection:Constants.Admin.APPLICATIONS,
                        $insert:[
                            {_id:"ReportGeneration1", label:"Menu", roles:{role:"help"}, db:"this"} ,
                            {_id:"ReportGeneration2", label:"Menu1", roles:{role:"help"}, db:"this"}
                        ]
                    },
                    {
                        $collection:Constants.Admin.MENUS,
                        $insert:[
                            {_id:"Menu01", label:"Menu", application:{_id:"ReportGeneration1"}} ,
                            {_id:"Menu12", label:"subMenu", parentmenu:{_id:"Menu01"}, application:{_id:"ReportGeneration1"} },
                            {_id:"Menu02", label:"Menu", application:{_id:"ReportGeneration2"}}
                        ]
                    }
                ]
                adminDb.batchUpdateById(insert, function (err, res) {
                    if (err) {
                        done(err);
                        return;
                    }
                    var insert = [
                        {
                            $collection:Constants.Admin.MENUS,
                            $insert:[
                                {_id:"Menu02", label:"Menu", application:{_id:"ReportGeneration2"}}
                            ]
                        }
                    ]

                    db.batchUpdateById(insert, function (err, res) {
                        if (err) {
                            var duplicateError = err.toString().indexOf("Record alreay exists for filter") != -1;
                            if (duplicateError) {
                                done();
                            } else {
                                done(err);
                            }
                            return;
                        }
                        done("Not Ok");
                    })
                })
            })
        })
    })

})