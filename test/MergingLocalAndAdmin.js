/**
 *
 *  mocha --recursive --timeout 150000 -g "MergingLocalAndAdminDbtestcase" --reporter spec
 *  Array case add trigger in collections
 *  mocha --recursive --timeout 150000 -g "Array case add trigger in collections" --reporter spec
 */
var expect = require('chai').expect;
var ApplaneDB = require("ApplaneDB");
var ApplaneDBConfig = require("ApplaneDB/Config.js");
var Document = require("ApplaneDB/lib/Document.js");
var configureOptions = {url: require("./config.js").URL, admin: {db: "northwindadmindb", username: "northiwndadmin", password: "1234"}};
var localDB1 = "northwindb1";
var localDB2 = "northwinddb2";
var collectionsToRegister = [
    {
        collection: "menus",
        merge: {collection: "union"}
    } ,
    {
        collection: "status",
        merge: {collection: "override"}
    } ,
    {
        collection: "persons",
        merge: {collection: "override"}
    },
    {
        collection: "roles",
        merge: {collection: "union", fields: {rights: "override"}}
    }
];     //one testcase without pass _id
//unwind or group case for override in query and update unwind fields in collection.

describe("MergingLocalAndAdminDbtestcase", function () {

    describe("UpdateCase", function () {

        before(function (done) {
            ApplaneDB.configure(configureOptions, function (err) {
                if (err) {
                    done(err);
                    return;
                }
                ApplaneDB.addCollection(collectionsToRegister, function (err) {
                    if (err) {
                        done(err);
                        return;
                    }
                    done();
                })
            })
        })

        afterEach(function (done) {
            ApplaneDB.connect(ApplaneDBConfig.URL, localDB1, function (err, localDb1) {
                localDb1.dropDatabase(function (err) {
                    ApplaneDB.connect(ApplaneDBConfig.URL, localDB2, function (err, localDb2) {
                        localDb2.dropDatabase(function (err) {
                            ApplaneDB.connect(ApplaneDBConfig.URL, ApplaneDBConfig.Admin.DB, function (err, adminDb) {
                                adminDb.dropDatabase(function (err) {
                                    done(err);
                                });
                            });
                        });
                    });
                });
            })
        })

        it("status override", function (done) {
            ApplaneDB.connect(ApplaneDBConfig.URL, ApplaneDBConfig.Admin.DB, function (err, adminDb) {
                if (err) {
                    done(err);
                    return;
                }
                ApplaneDB.connect(ApplaneDBConfig.URL, localDB1, function (err, localDb1) {
                    if (err) {
                        done(err);
                        return;
                    }
                    var adminStatus = [
                        {
                            $collection: "status",
                            $insert: [
                                {_id: "new", status: "New"},
                                {_id: "inprogress", status: "In progress"} ,
                                {_id: "completed", status: "Completed"}
                            ]
                        }
                    ];
                    adminDb.batchUpdateById(adminStatus, function (err) {
                        if (err) {
                            done(err);
                            return;
                        }
                        var localStatus = [
                            {
                                $collection: "status",
                                $insert: [
                                    {_id: "fresh", status: "Fresh"},
                                    {_id: "planned", status: "Planned"}
                                ],
                                $update: [
                                    {_id: "new", $set: {status: "Latest"}}
                                ],
                                $delete: [
                                    {_id: "inprogress"}
                                ]
                            }
                        ];
                        localDb1.batchUpdateById(localStatus, function (err) {
                            if (err) {
                                done(err);
                                return;
                            }

                            localDb1.db.collection("status").find({}, {sort: {_id: 1}}).toArray(function (err, localStatus) {
                                if (err) {
                                    done(err);
                                    return;
                                }
                                console.log("localstatus>>>>>>>>>>>>>>>>>>>" + JSON.stringify(localStatus));

                                expect(localStatus).to.have.length(4);

                                expect(localStatus[0]._id).to.eql("completed");
                                expect(localStatus[0].status).to.eql("Completed");
                                expect(localStatus[0].__type__).to.eql(undefined);
                                expect(localStatus[1]._id).to.eql("fresh");
                                expect(localStatus[1].status).to.eql("Fresh");
                                expect(localStatus[1].__type__).to.eql(undefined);
                                expect(localStatus[2]._id).to.eql("new");
                                expect(localStatus[2].status).to.eql("Latest");
                                expect(localStatus[2].__type__).to.eql(undefined);
                                expect(localStatus[3]._id).to.eql("planned");
                                expect(localStatus[3].status).to.eql("Planned");
                                expect(localStatus[3].__type__).to.eql(undefined);
                                var expectedResult = [
                                    {_id: "completed", status: "Completed"},
                                    {_id: "fresh", status: "Fresh"},
                                    {_id: "new", status: "Latest"},
                                    {_id: "planned", status: "Planned"}
                                ]

                                localDb1.query({$collection: "status", $sort: {_id: 1}}, function (err, statusResult) {
                                    if (err) {
                                        done(err);
                                        return;
                                    }
                                    expect(statusResult.result).to.have.length(4);

                                    expect(statusResult.result[0]._id).to.eql("completed");
                                    expect(statusResult.result[0].status).to.eql("Completed");
                                    expect(statusResult.result[0].__type__).to.eql(undefined);
                                    expect(statusResult.result[1]._id).to.eql("fresh");
                                    expect(statusResult.result[1].status).to.eql("Fresh");
                                    expect(statusResult.result[1].__type__).to.eql(undefined);
                                    expect(statusResult.result[2]._id).to.eql("new");
                                    expect(statusResult.result[2].status).to.eql("Latest");
                                    expect(statusResult.result[2].__type__).to.eql(undefined);
                                    expect(statusResult.result[3]._id).to.eql("planned");
                                    expect(statusResult.result[3].status).to.eql("Planned");
                                    expect(statusResult.result[3].__type__).to.eql(undefined);
                                    var expectedResult = [
                                        {_id: "completed", status: "Completed"},
                                        {_id: "fresh", status: "Fresh"},
                                        {_id: "new", status: "Latest"},
                                        {_id: "planned", status: "Planned"}
                                    ]
                                    done();
                                })
                            })
                        })
                    })
                })
            })

        })

        it("persons override with unwind person on localdb", function (done) {
            ApplaneDB.connect(ApplaneDBConfig.URL, ApplaneDBConfig.Admin.DB, function (err, adminDb) {
                if (err) {
                    done(err);
                    return;
                }
                ApplaneDB.connect(ApplaneDBConfig.URL, localDB1, function (err, localDb1) {
                    if (err) {
                        done(err);
                        return;
                    }
                    var adminPersons = [
                        {
                            $collection: "persons",
                            $insert: [
                                {_id: "sachin", name: "sachin", languages: [
                                    {language: "Hindi", read: true, speak: true}
                                ]},
                                {_id: "manjeet", name: "manjeet", status: "Completed", languages: [
                                    {language: "Hindi", read: true, write: true},
                                    {language: "English", read: true, speak: true}
                                ]}
                            ]
                        }
                    ];
                    adminDb.batchUpdateById(adminPersons, function (err) {
                        if (err) {
                            done(err);
                            return;
                        }
                        var localPersons = [
                            {
                                $collection: "persons",
                                $insert: [
                                    {_id: "Ashish", name: "Ashish", languages: [
                                        {language: "Hindi", read: true, speak: true}
                                    ]},
                                    {_id: "Rohit", name: "Rohit", status: "Completed", languages: [
                                        {language: "Hindi", read: true, write: true},
                                        {language: "English", read: true, speak: true}
                                    ]}
                                ],
                                $update: [
                                    {_id: "sachin", $set: {name: "sachin1"}}
                                ],
                                $delete: [
                                    {_id: "manjeet"}
                                ]
                            }
                        ];
                        localDb1.batchUpdateById(localPersons, function (err) {
                            if (err) {
                                done(err);
                                return;
                            }

                            localDb1.query({$collection: "persons", $unwind: ["languages"], $sort: {_id: 1}}, function (err, personResult) {
                                if (err) {
                                    done(err);
                                    return;
                                }
                                console.log("personResult >>>>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(personResult));
                                expect(personResult.result).to.have.length(4);

                                expect(personResult.result[0]._id).to.eql("Ashish");
                                expect(personResult.result[0].name).to.eql("Ashish");
                                expect(personResult.result[0].languages.language).to.eql("Hindi");
                                expect(personResult.result[0].languages.read).to.eql(true);
                                expect(personResult.result[0].languages.speak).to.eql(true);
                                expect(personResult.result[1]._id).to.eql("Rohit");
                                expect(personResult.result[1].name).to.eql("Rohit");
                                expect(personResult.result[1].languages.language).to.eql("Hindi");
                                expect(personResult.result[1].languages.read).to.eql(true);
                                expect(personResult.result[1].languages.write).to.eql(true);
                                expect(personResult.result[2]._id).to.eql("Rohit");
                                expect(personResult.result[2].name).to.eql("Rohit");
                                expect(personResult.result[2].languages.language).to.eql("English");
                                expect(personResult.result[2].languages.read).to.eql(true);
                                expect(personResult.result[2].languages.speak).to.eql(true);
                                expect(personResult.result[3]._id).to.eql("sachin");
                                expect(personResult.result[3].name).to.eql("sachin1");
                                expect(personResult.result[3].languages.language).to.eql("Hindi");
                                expect(personResult.result[3].languages.read).to.eql(true);
                                expect(personResult.result[3].languages.speak).to.eql(true);
                                var expectedResult = {"result": [
                                    {"_id": "Ashish", "name": "Ashish", "languages": {"language": "Hindi", "read": true, "speak": true}},
                                    {"_id": "Rohit", "name": "Rohit", "status": "Completed", "languages": {"language": "Hindi", "read": true, "write": true}},
                                    {"_id": "Rohit", "name": "Rohit", "status": "Completed", "languages": {"language": "English", "read": true, "speak": true}} ,
                                    {"_id": "sachin", "languages": {"language": "Hindi", "read": true, "speak": true}, "name": "sachin1"}
                                ]}
                                done();
                            })
                        })
                    })
                })
            })

        })

        it("menus merging", function (done) {
            ApplaneDB.connect(ApplaneDBConfig.URL, ApplaneDBConfig.Admin.DB, function (err, adminDb) {
                if (err) {
                    done(err);
                    return;
                }
                ApplaneDB.connect(ApplaneDBConfig.URL, localDB1, function (err, localDb1) {
                    if (err) {
                        done(err);
                        return;
                    }
                    var adminMenus = [
                        {
                            $collection: "menus",
                            $insert: [
                                {_id: "m1", menu: "Relationships", collection: "relationships", viewid: "allleads", ui: "grid", index: 100},
                                {_id: "m2", menu: "Communications", collection: "communications", viewid: "allcommunications", ui: "grid", index: 200} ,
                                {_id: "m3", menu: "Tasks", collection: "tasks", viewid: "tasks", ui: "grid", index: 300}
                            ]
                        }
                    ];
                    adminDb.batchUpdateById(adminMenus, function (err) {
                        if (err) {
                            done(err);
                            return;
                        }
                        var localMenus = [
                            {
                                $collection: "menus",
                                $insert: [
                                    {_id: "daffodilm1", menu: "Contacts", collection: "contacts", viewid: "contacts", ui: "grid", index: 50}
                                ],
                                $update: [
                                    {_id: "m1", $set: {menu: "Leads", index: 250}}
                                ],
                                $delete: [
                                    {_id: "m3"}
                                ]
                            }
                        ];
                        localDb1.batchUpdateById(localMenus, function (err) {
                            if (err) {
                                done(err);
                                return;
                            }
                            var localMenus1 = [
                                {
                                    $collection: "menus",
                                    $update: [
                                        {_id: "m1", $unset: {ui: 1}},
                                        {_id: "daffodilm1", $set: {"menu": "Contacts3"}, $unset: {viewid: 1}}
                                    ]
                                }
                            ];
                            localDb1.batchUpdateById(localMenus1, function (err) {
                                if (err) {
                                    done(err);
                                    return;
                                }
                                localDb1.db.collection("menus").find({}, {sort: {_id: 1}}).toArray(function (err, localMenus) {
                                    if (err) {
                                        done(err);
                                        return;
                                    }
                                    console.log("localMenus>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(localMenus));
                                    expect(localMenus).to.have.length(3);
                                    expect(localMenus[0]._id).to.eql("daffodilm1");
                                    expect(localMenus[0].menu).to.eql("Contacts3");
                                    expect(localMenus[0].index).to.eql(50);
                                    expect(localMenus[0].collection).to.eql("contacts");
                                    expect(localMenus[0].viewid).to.eql(undefined);
                                    expect(localMenus[0].ui).to.eql("grid");
                                    expect(localMenus[0].__type__).to.eql("insert");

                                    expect(localMenus[1]._id).to.eql("m1");
                                    expect(localMenus[1].menu).to.eql("Leads");
                                    expect(localMenus[1].index).to.eql(250);
                                    expect(localMenus[1].collection).to.eql(undefined);
                                    expect(localMenus[1].viewid).to.eql(undefined);
                                    expect(localMenus[1].ui).to.eql(null);
                                    expect(localMenus[1].__type__).to.eql(undefined);

                                    expect(localMenus[2]._id).to.eql("m3");
                                    expect(localMenus[2].menu).to.eql(undefined);
                                    expect(localMenus[2].index).to.eql(undefined);
                                    expect(localMenus[2].collection).to.eql(undefined);
                                    expect(localMenus[2].viewid).to.eql(undefined);
                                    expect(localMenus[2].__type__).to.eql("delete");
                                    var expectedResult = [
                                        {_id: "daffodilm1", menu: "Contacts", collection: "contacts", viewid: "contacts", ui: "grid", __type__: "insert", index: 50},
                                        {_id: "m1", menu: "Leads", index: 250},
                                        {_id: "m3", __type__: "delete"}
                                    ]

                                    localDb1.query({$collection: "menus", $sort: {menu: 1}}, function (err, menuResult) {
                                        if (err) {
                                            done(err);
                                            return;
                                        }
                                        expect(menuResult.result).to.have.length(3);
                                        expect(menuResult.result[0]._id).to.eql("m2");
                                        expect(menuResult.result[0].menu).to.eql("Communications");
                                        expect(menuResult.result[0].index).to.eql(200);
                                        expect(menuResult.result[0].collection).to.eql("communications");
                                        expect(menuResult.result[0].viewid).to.eql("allcommunications");
                                        expect(menuResult.result[0].ui).to.eql("grid");
                                        expect(menuResult.result[0].__type__).to.eql(undefined);

                                        expect(menuResult.result[1]._id).to.eql("daffodilm1");
                                        expect(menuResult.result[1].menu).to.eql("Contacts3");
                                        expect(menuResult.result[1].index).to.eql(50);
                                        expect(menuResult.result[1].collection).to.eql("contacts");
                                        expect(menuResult.result[1].viewid).to.eql(undefined);
                                        expect(menuResult.result[1].ui).to.eql("grid");
                                        expect(menuResult.result[1].__type__).to.eql("insert");

                                        expect(menuResult.result[2]._id).to.eql("m1");
                                        expect(menuResult.result[2].menu).to.eql("Leads");
                                        expect(menuResult.result[2].index).to.eql(250);
                                        expect(menuResult.result[2].collection).to.eql("relationships");
                                        expect(menuResult.result[2].viewid).to.eql("allleads");
                                        expect(menuResult.result[2].ui).to.eql(undefined);
                                        expect(menuResult.result[2].__type__).to.eql(undefined);

                                        var result = [
                                            {_id: "m2", menu: "Communications", collection: "communications", viewid: "allcommunications", ui: "grid", index: 200} ,
                                            {_id: "daffodilm1", menu: "Contacts", collection: "contacts", viewid: "contacts", ui: "grid", index: 50},
                                            {_id: "m1", menu: "Leads", collection: "relationships", viewid: "allleads", ui: "grid", index: 250}

                                        ]
                                        done();
                                    })
                                })
                            })
                        })
                    })
                })
            })
        })

        it("menus merging _id generate default", function (done) {
            ApplaneDB.connect(ApplaneDBConfig.URL, ApplaneDBConfig.Admin.DB, function (err, adminDb) {
                if (err) {
                    done(err);
                    return;
                }
                ApplaneDB.connect(ApplaneDBConfig.URL, localDB1, function (err, localDb1) {
                    if (err) {
                        done(err);
                        return;
                    }
                    var adminMenus = [
                        {
                            $collection: "menus",
                            $insert: [
                                {menu: "Relationships", collection: "relationships", viewid: "allleads", ui: "grid", index: 100},
                                {menu: "Communications", collection: "communications", viewid: "allcommunications", ui: "grid", index: 200} ,
                                {menu: "Tasks", collection: "tasks", viewid: "tasks", ui: "grid", index: 300}
                            ]
                        }
                    ];
                    adminDb.batchUpdateById(adminMenus, function (err) {
                        if (err) {
                            done(err);
                            return;
                        }
                        adminDb.query({$collection: "menus", $sort: {menu: 1}}, function (err, result) {
                            if (err) {
                                done(err);
                                return;
                            }
                            var localMenus = [
                                {
                                    $collection: "menus",
                                    $insert: [
                                        {menu: "Contacts", collection: "contacts", viewid: "contacts", ui: "grid", index: 50}
                                    ],
                                    $update: [
                                        {_id: result.result[1]._id, $set: {menu: "Leads", index: 250}}
                                    ],
                                    $delete: [
                                        {_id: result.result[2]._id}
                                    ]
                                }
                            ];
                            localDb1.batchUpdateById(localMenus, function (err) {
                                if (err) {
                                    done(err);
                                    return;
                                }
                                localDb1.db.collection("menus").find({}, {sort: {menu: 1}}).toArray(function (err, localMenus) {
                                    if (err) {
                                        done(err);
                                        return;
                                    }

                                    expect(localMenus).to.have.length(3);

                                    expect(localMenus[0]._id).to.eql(result.result[2]._id);
                                    expect(localMenus[0].menu).to.eql(undefined);
                                    expect(localMenus[0].index).to.eql(undefined);
                                    expect(localMenus[0].collection).to.eql(undefined);
                                    expect(localMenus[0].viewid).to.eql(undefined);
                                    expect(localMenus[0].__type__).to.eql("delete");

                                    expect(localMenus[1].menu).to.eql("Contacts");
                                    expect(localMenus[1].index).to.eql(50);
                                    expect(localMenus[1].collection).to.eql("contacts");
                                    expect(localMenus[1].viewid).to.eql("contacts");
                                    expect(localMenus[1].ui).to.eql("grid");
                                    expect(localMenus[1].__type__).to.eql("insert");

                                    expect(localMenus[2]._id).to.eql(result.result[1]._id);
                                    expect(localMenus[2].menu).to.eql("Leads");
                                    expect(localMenus[2].index).to.eql(250);
                                    expect(localMenus[2].collection).to.eql(undefined);
                                    expect(localMenus[2].viewid).to.eql(undefined);
                                    expect(localMenus[2].__type__).to.eql(undefined);


                                    var expectedResult = [
                                        {_id: result.result[2]._id, __type__: "delete"},
                                        {menu: "Contacts", collection: "contacts", viewid: "contacts", ui: "grid", __type__: "insert", index: 50},
                                        {_id: result.result[0]._id, menu: "Leads", index: 250}
                                    ]

                                    localDb1.query({$collection: "menus", $sort: {menu: 1}}, function (err, menuResult) {
                                        if (err) {
                                            done(err);
                                            return;
                                        }
                                        console.log("menuREsult >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(menuResult));
                                        expect(menuResult.result).to.have.length(3);
                                        expect(menuResult.result[0].menu).to.eql("Communications");
                                        expect(menuResult.result[0].index).to.eql(200);
                                        expect(menuResult.result[0].collection).to.eql("communications");
                                        expect(menuResult.result[0].viewid).to.eql("allcommunications");
                                        expect(menuResult.result[0].ui).to.eql("grid");
                                        expect(menuResult.result[0].__type__).to.eql(undefined);

                                        expect(menuResult.result[1].menu).to.eql("Contacts");
                                        expect(menuResult.result[1].index).to.eql(50);
                                        expect(menuResult.result[1].collection).to.eql("contacts");
                                        expect(menuResult.result[1].viewid).to.eql("contacts");
                                        expect(menuResult.result[1].ui).to.eql("grid");
                                        expect(menuResult.result[1].__type__).to.eql("insert");


                                        expect(menuResult.result[2].menu).to.eql("Leads");
                                        expect(menuResult.result[2].index).to.eql(250);
                                        expect(menuResult.result[2].collection).to.eql("relationships");
                                        expect(menuResult.result[2].viewid).to.eql("allleads");
                                        expect(menuResult.result[2].ui).to.eql("grid");
                                        expect(menuResult.result[2].__type__).to.eql(undefined);
//
//                                        var result = [
//                                            {_id:result[1]._id, menu:"Communications", collection:"communications", viewid:"allcommunications", ui:"grid", index:200} ,
//                                            {_id:"daffodilm1", menu:"Contacts", collection:"contacts", viewid:"contacts", ui:"grid", index:50},
//                                            {_id:result[0]._id, menu:"Leads", collection:"relationships", viewid:"allleads", ui:"grid", index:250}
//
//                                        ]
                                        done();
                                    })
                                })

                            })
                        })
                    })
                })
            })
        })

        it("menus merging in two databases", function (done) {
            ApplaneDB.connect(ApplaneDBConfig.URL, ApplaneDBConfig.Admin.DB, function (err, adminDb) {
                if (err) {
                    done(err);
                    return;
                }
                ApplaneDB.connect(ApplaneDBConfig.URL, localDB1, function (err, localDb1) {
                    if (err) {
                        done(err);
                        return;
                    }
                    ApplaneDB.connect(ApplaneDBConfig.URL, localDB2, function (err, localDb2) {
                        if (err) {
                            done(err);
                            return;
                        }
                        var adminMenus = [
                            {
                                $collection: "menus",
                                $insert: [
                                    {_id: "m1", menu: "Relationships", collection: "relationships", viewid: "allleads", ui: "grid", index: 100},
                                    {_id: "m2", menu: "Communications", collection: "communications", viewid: "allcommunications", ui: "grid", index: 200} ,
                                    {_id: "m3", menu: "Tasks", collection: "tasks", viewid: "tasks", ui: "grid", index: 300}
                                ]
                            }
                        ];
                        adminDb.batchUpdateById(adminMenus, function (err) {
                            if (err) {
                                done(err);
                                return;
                            }
                            var localDB1Menus = [
                                {
                                    $collection: "menus",
                                    $insert: [
                                        {_id: "daffodilm1", menu: "Contacts", collection: "contacts", viewid: "contacts", ui: "grid", index: 50}
                                    ],
                                    $update: [
                                        {_id: "m1", $set: {menu: "Leads", index: 250}}
                                    ],
                                    $delete: [
                                        {_id: "m3"}
                                    ]
                                }
                            ];
                            localDb1.batchUpdateById(localDB1Menus, function (err) {
                                if (err) {
                                    done(err);
                                    return;
                                }
                                var localDB2Menus = [
                                    {
                                        $collection: "menus",
                                        $insert: [
                                            {_id: "daffodilm2", menu: "Contacts1", collection: "contacts1", viewid: "contacts1", ui: "grid", index: 50}
                                        ],
                                        $update: [
                                            {_id: "m1", $set: {menu: "Leads1", index: 200}}
                                        ],
                                        $delete: [
                                            {_id: "m2"}
                                        ]
                                    }
                                ];
                                localDb2.batchUpdateById(localDB2Menus, function (err) {
                                    if (err) {
                                        done(err);
                                        return;
                                    }
                                    localDb1.db.collection("menus").find({}, {sort: {_id: 1}}).toArray(function (err, localMenus) {
                                        if (err) {
                                            done(err);
                                            return;
                                        }

                                        expect(localMenus).to.have.length(3);

                                        expect(localMenus[0]._id).to.eql("daffodilm1");
                                        expect(localMenus[0].menu).to.eql("Contacts");
                                        expect(localMenus[0].index).to.eql(50);
                                        expect(localMenus[0].collection).to.eql("contacts");
                                        expect(localMenus[0].viewid).to.eql("contacts");
                                        expect(localMenus[0].ui).to.eql("grid");
                                        expect(localMenus[0].__type__).to.eql("insert");

                                        expect(localMenus[1]._id).to.eql("m1");
                                        expect(localMenus[1].menu).to.eql("Leads");
                                        expect(localMenus[1].index).to.eql(250);
                                        expect(localMenus[1].collection).to.eql(undefined);
                                        expect(localMenus[1].viewid).to.eql(undefined);
                                        expect(localMenus[1].__type__).to.eql(undefined);

                                        expect(localMenus[2]._id).to.eql("m3");
                                        expect(localMenus[2].menu).to.eql(undefined);
                                        expect(localMenus[2].index).to.eql(undefined);
                                        expect(localMenus[2].collection).to.eql(undefined);
                                        expect(localMenus[2].viewid).to.eql(undefined);
                                        expect(localMenus[2].__type__).to.eql("delete");
                                        var expectedResult = [
                                            {_id: "daffodilm1", menu: "Contacts", collection: "contacts", viewid: "contacts", ui: "grid", __type__: "insert", index: 50},
                                            {_id: "m1", menu: "Leads", index: 250},
                                            {_id: "m3", __type__: "delete"}
                                        ]

                                        localDb1.query({$collection: "menus", $sort: {menu: 1}}, function (err, menuResult) {
                                            if (err) {
                                                done(err);
                                                return;
                                            }

                                            expect(menuResult.result).to.have.length(3);

                                            expect(menuResult.result[0]._id).to.eql("m2");
                                            expect(menuResult.result[0].menu).to.eql("Communications");
                                            expect(menuResult.result[0].index).to.eql(200);
                                            expect(menuResult.result[0].collection).to.eql("communications");
                                            expect(menuResult.result[0].viewid).to.eql("allcommunications");
                                            expect(menuResult.result[0].ui).to.eql("grid");
                                            expect(menuResult.result[0].__type__).to.eql(undefined);

                                            expect(menuResult.result[1]._id).to.eql("daffodilm1");
                                            expect(menuResult.result[1].menu).to.eql("Contacts");
                                            expect(menuResult.result[1].index).to.eql(50);
                                            expect(menuResult.result[1].collection).to.eql("contacts");
                                            expect(menuResult.result[1].viewid).to.eql("contacts");
                                            expect(menuResult.result[1].ui).to.eql("grid");
                                            expect(menuResult.result[1].__type__).to.eql("insert");

                                            expect(menuResult.result[2]._id).to.eql("m1");
                                            expect(menuResult.result[2].menu).to.eql("Leads");
                                            expect(menuResult.result[2].index).to.eql(250);
                                            expect(menuResult.result[2].collection).to.eql("relationships");
                                            expect(menuResult.result[2].viewid).to.eql("allleads");
                                            expect(menuResult.result[2].ui).to.eql("grid");
                                            expect(menuResult.result[2].__type__).to.eql(undefined);

                                            var result = [
                                                {_id: "m2", menu: "Communications", collection: "communications", viewid: "allcommunications", ui: "grid", index: 200} ,
                                                {_id: "daffodilm1", menu: "Contacts", collection: "contacts", viewid: "contacts", ui: "grid", index: 50},
                                                {_id: "m1", menu: "Leads", collection: "relationships", viewid: "allleads", ui: "grid", index: 250}

                                            ]
                                            localDb2.db.collection("menus").find({}, {sort: {_id: 1}}).toArray(function (err, localMenus) {
                                                if (err) {
                                                    done(err);
                                                    return;
                                                }

                                                expect(localMenus).to.have.length(3);

                                                expect(localMenus[0]._id).to.eql("daffodilm2");
                                                expect(localMenus[0].menu).to.eql("Contacts1");
                                                expect(localMenus[0].index).to.eql(50);
                                                expect(localMenus[0].collection).to.eql("contacts1");
                                                expect(localMenus[0].viewid).to.eql("contacts1");
                                                expect(localMenus[0].ui).to.eql("grid");
                                                expect(localMenus[0].__type__).to.eql("insert");

                                                expect(localMenus[1]._id).to.eql("m1");
                                                expect(localMenus[1].menu).to.eql("Leads1");
                                                expect(localMenus[1].index).to.eql(200);
                                                expect(localMenus[1].collection).to.eql(undefined);
                                                expect(localMenus[1].viewid).to.eql(undefined);
                                                expect(localMenus[1].__update__).to.eql(undefined);

                                                expect(localMenus[2]._id).to.eql("m2");
                                                expect(localMenus[2].menu).to.eql(undefined);
                                                expect(localMenus[2].index).to.eql(undefined);
                                                expect(localMenus[2].collection).to.eql(undefined);
                                                expect(localMenus[2].viewid).to.eql(undefined);
                                                expect(localMenus[2].__type__).to.eql("delete");
                                                var expectedResult = [
                                                    {_id: "daffodilm2", menu: "Contacts1", collection: "contacts1", viewid: "contacts1", ui: "grid", __type__: "insert", index: 50},
                                                    {_id: "m1", menu: "Leads1", index: 200},
                                                    {_id: "m2", __type__: "delete"}
                                                ]
                                                localDb2.query({$collection: "menus", $sort: {_id: 1}}, function (err, menuResult) {
                                                    if (err) {
                                                        done(err);
                                                        return;
                                                    }
                                                    expect(menuResult.result).to.have.length(3);

                                                    expect(menuResult.result[0]._id).to.eql("daffodilm2");
                                                    expect(menuResult.result[0].menu).to.eql("Contacts1");
                                                    expect(menuResult.result[0].index).to.eql(50);
                                                    expect(menuResult.result[0].collection).to.eql("contacts1");
                                                    expect(menuResult.result[0].viewid).to.eql("contacts1");
                                                    expect(menuResult.result[0].ui).to.eql("grid");
                                                    expect(menuResult.result[0].__type__).to.eql("insert");

                                                    expect(menuResult.result[1]._id).to.eql("m1");
                                                    expect(menuResult.result[1].menu).to.eql("Leads1");
                                                    expect(menuResult.result[1].index).to.eql(200);
                                                    expect(menuResult.result[1].collection).to.eql("relationships");
                                                    expect(menuResult.result[1].viewid).to.eql("allleads");
                                                    expect(menuResult.result[1].ui).to.eql("grid");
                                                    expect(menuResult.result[1].__type__).to.eql(undefined);

                                                    expect(menuResult.result[2]._id).to.eql("m3");
                                                    expect(menuResult.result[2].menu).to.eql("Tasks");
                                                    expect(menuResult.result[2].index).to.eql(300);
                                                    expect(menuResult.result[2].collection).to.eql("tasks");
                                                    expect(menuResult.result[2].viewid).to.eql("tasks");
                                                    expect(menuResult.result[2].ui).to.eql("grid");
                                                    expect(menuResult.result[2].__type__).to.eql(undefined);

//


                                                    var result = [
                                                        {_id: "m1", menu: "Leads1", collection: "relationships", viewid: "allleads", ui: "grid", index: 200},
                                                        {_id: "m3", menu: "Tasks", collection: "tasks", viewid: "tasks", ui: "grid", index: 300},
                                                        {_id: "daffodilm2", menu: "Contacts1", collection: "contacts1", viewid: "contacts1", ui: "grid", index: 50}

                                                    ]
                                                    done();
                                                })
                                            })
                                        })
                                    })

                                })
                            })
                        })
                    })
                })
            })
        })

        it("menus merging with sorting by index after merging", function (done) {
            ApplaneDB.connect(ApplaneDBConfig.URL, ApplaneDBConfig.Admin.DB, function (err, adminDb) {
                if (err) {
                    done(err);
                    return;
                }
                ApplaneDB.connect(ApplaneDBConfig.URL, localDB1, function (err, localDb1) {
                    if (err) {
                        done(err);
                        return;
                    }
                    var adminMenus = [
                        {
                            $collection: "menus",
                            $insert: [
                                {_id: "m1", menu: "Relationships", collection: "relationships", viewid: "allleads", ui: "grid", index: 100},
                                {_id: "m2", menu: "Communications", collection: "communications", viewid: "allcommunications", ui: "grid", index: 200} ,
                                {_id: "m3", menu: "Tasks", collection: "tasks", viewid: "tasks", ui: "grid", index: 300}
                            ]
                        }
                    ];
                    adminDb.batchUpdateById(adminMenus, function (err) {
                        if (err) {
                            done(err);
                            return;
                        }
                        var localMenus = [
                            {
                                $collection: "menus",
                                $insert: [
                                    {_id: "daffodilm1", menu: "Contacts", collection: "contacts", viewid: "contacts", ui: "grid", index: 50}
                                ],
                                $update: [
                                    {_id: "m1", $set: {menu: "Leads", index: 250}}
                                ],
                                $delete: [
                                    {_id: "m3"}
                                ]
                            }
                        ];
                        localDb1.batchUpdateById(localMenus, function (err) {
                            if (err) {
                                done(err);
                                return;
                            }
                            localDb1.db.collection("menus").find({}, {sort: {_id: 1}}).toArray(function (err, localMenus) {
                                if (err) {
                                    done(err);
                                    return;
                                }

                                expect(localMenus).to.have.length(3);

                                expect(localMenus[0]._id).to.eql("daffodilm1");
                                expect(localMenus[0].menu).to.eql("Contacts");
                                expect(localMenus[0].index).to.eql(50);
                                expect(localMenus[0].collection).to.eql("contacts");
                                expect(localMenus[0].viewid).to.eql("contacts");
                                expect(localMenus[0].ui).to.eql("grid");
                                expect(localMenus[0].__type__).to.eql("insert");

                                expect(localMenus[1]._id).to.eql("m1");
                                expect(localMenus[1].menu).to.eql("Leads");
                                expect(localMenus[1].index).to.eql(250);
                                expect(localMenus[1].collection).to.eql(undefined);
                                expect(localMenus[1].viewid).to.eql(undefined);
                                expect(localMenus[1].__type__).to.eql(undefined);

                                expect(localMenus[2]._id).to.eql("m3");
                                expect(localMenus[2].menu).to.eql(undefined);
                                expect(localMenus[2].index).to.eql(undefined);
                                expect(localMenus[2].collection).to.eql(undefined);
                                expect(localMenus[2].viewid).to.eql(undefined);
                                expect(localMenus[2].__type__).to.eql("delete");
                                var expectedResult = [
                                    {_id: "daffodilm1", menu: "Contacts", collection: "contacts", viewid: "contacts", ui: "grid", __type__: "insert", index: 50},
                                    {_id: "m1", menu: "Leads", index: 250},
                                    {_id: "m3", __type__: "delete"}
                                ]

                                localDb1.query({$collection: "menus", $sort: {index: 1}}, function (err, menuResult) {
                                    if (err) {
                                        done(err);
                                        return;
                                    }
                                    expect(menuResult.result).to.have.length(3);

                                    expect(menuResult.result[0]._id).to.eql("daffodilm1");
                                    expect(menuResult.result[0].menu).to.eql("Contacts");
                                    expect(menuResult.result[0].index).to.eql(50);
                                    expect(menuResult.result[0].collection).to.eql("contacts");
                                    expect(menuResult.result[0].viewid).to.eql("contacts");
                                    expect(menuResult.result[0].ui).to.eql("grid");
                                    expect(menuResult.result[0].__type__).to.eql("insert");

                                    expect(menuResult.result[1]._id).to.eql("m2");
                                    expect(menuResult.result[1].menu).to.eql("Communications");
                                    expect(menuResult.result[1].index).to.eql(200);
                                    expect(menuResult.result[1].collection).to.eql("communications");
                                    expect(menuResult.result[1].viewid).to.eql("allcommunications");
                                    expect(menuResult.result[1].ui).to.eql("grid");
                                    expect(menuResult.result[1].__type__).to.eql(undefined);

                                    expect(menuResult.result[2]._id).to.eql("m1");
                                    expect(menuResult.result[2].menu).to.eql("Leads");
                                    expect(menuResult.result[2].index).to.eql(250);
                                    expect(menuResult.result[2].collection).to.eql("relationships");
                                    expect(menuResult.result[2].viewid).to.eql("allleads");
                                    expect(menuResult.result[2].ui).to.eql("grid");
                                    expect(menuResult.result[2].__type__).to.eql(undefined);

                                    var result = [
                                        {_id: "daffodilm1", menu: "Contacts", collection: "contacts", viewid: "contacts", ui: "grid", index: 50},
                                        {_id: "m2", menu: "Communications", collection: "communications", viewid: "allcommunications", ui: "grid", index: 200} ,
                                        {_id: "m1", menu: "Leads", collection: "relationships", viewid: "allleads", ui: "grid", index: 250}

                                    ]
                                    done();
                                })
                            })
                        })
                    })
                })
            })
        })

        it("Array case add trigger in collections", function (done) {
            //assuming triggers are saved in collection

            ApplaneDB.connect(ApplaneDBConfig.URL, ApplaneDBConfig.Admin.DB, function (err, adminDb) {
                if (err) {
                    done(err);
                    return;
                }
                ApplaneDB.connect(ApplaneDBConfig.URL, localDB1, function (err, localDb1) {
                    if (err) {
                        done(err);
                        return;
                    }
                    var adminCollection = [
                        {
                            $collection: "pl.collections",
                            $insert: [
                                {_id: "tasks", collection: "tasks", triggers: [
                                    {_id: "t1", name: "TaskPreInsert", source: "AFB/lib/tasks.js", code: "preInsert", operation: ["insert", "update"], when: "pre"},
                                    {_id: "t2", name: "TaskPostInsert", source: "AFB/lib/tasks.js", code: "postInsert", operation: ["insert", "update"], when: "post"},
                                    {_id: "t5", name: "TaskPostInsert", source: "AFB/lib/tasks.js", code: "postInsert", operation: ["insert", "update"], when: "post"} ,
                                    {_id: "t6", name: "TaskPostInsert", source: "AFB/lib/tasks.js", code: "postInsert", operation: ["insert", "update"], when: "post"} ,
                                    {_id: "t7", name: "TaskPostInsert", source: "AFB/lib/tasks.js", code: "postInsert", operation: ["insert", "update"], when: "post"}
                                ]}
                            ]
                        }
                    ];
                    adminDb.batchUpdateById(adminCollection, function (err) {
                        if (err) {
                            done(err);
                            return;
                        }
                        var localCollection = [
                            {
                                $collection: "pl.collections",
                                $update: [
                                    {_id: "tasks",
                                        $set: {
                                            triggers: {
                                                $insert: [
                                                    {_id: "t3", name: "TaskPreInsertDaffodil", source: "AFB/lib/daffodil/tasks.js", code: "preInsert", operation: ["insert", "update"], when: "pre"},
                                                    {_id: "t4", name: "TaskPostInsertDaffodil", source: "AFB/lib/daffodil/tasks.js", code: "postInsert", operation: ["insert", "update"], when: "post"}
                                                ],
                                                $update: [
                                                    {_id: "t2", $set: {source: "AFB/lib/daffodil/tasks.js"}}
                                                ],
                                                $delete: [
                                                    {_id: "t1"}
                                                ]
                                            }
                                        }
                                    }
                                ]
                            }
                        ];

                        localDb1.batchUpdateById(localCollection, function (err) {
                            if (err) {
                                done(err);
                                return;
                            }
                            var localCollection1 = [
                                {
                                    $collection: "pl.collections",
                                    $update: [
                                        {_id: "tasks",
                                            $set: {
                                                triggers: {
                                                    $update: [
                                                        {_id: "t3", $set: {name: "TaskPreInsertDaffodil1"}, $unset: {source: 1}},
                                                        {_id: "t5", $set: {name: ""}, $unset: {"code": 1}},
                                                        {_id: "t6", $unset: {"name": 1}},
                                                        {_id: "t2", $set: {name: "t2"}}
                                                    ],
                                                    $delete: [
                                                        {_id: "t7"}
                                                    ]
                                                }
                                            }
                                        }
                                    ]
                                }
                            ];
                            localDb1.batchUpdateById(localCollection1, function (err) {
                                if (err) {
                                    done(err);
                                    return;
                                }
                                localDb1.db.collection("pl.collections").find().toArray(function (err, localResult) {
                                    if (err) {
                                        done(err);
                                        return;
                                    }
                                    console.log("localResult >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(localResult));
                                    expect(localResult).to.have.length(1);
                                    expect(localResult[0]._id).to.eql("tasks");
                                    expect(localResult[0].collection).to.eql(undefined);
                                    expect(localResult[0].triggers).to.have.length(7);
                                    expect(localResult[0].triggers[0]._id).to.eql("t1");
                                    expect(localResult[0].triggers[0].name).to.eql(undefined);
                                    expect(localResult[0].triggers[0].source).to.eql(undefined);
                                    expect(localResult[0].triggers[0].code).to.eql(undefined);
                                    expect(localResult[0].triggers[0].operation).to.eql(undefined);
                                    expect(localResult[0].triggers[0].when).to.eql(undefined);
                                    expect(localResult[0].triggers[0].__type__).to.eql("delete");

                                    expect(localResult[0].triggers[1]._id).to.eql("t2");
                                    expect(localResult[0].triggers[1].name).to.eql("t2");
                                    expect(localResult[0].triggers[1].source).to.eql("AFB/lib/daffodil/tasks.js");
                                    expect(localResult[0].triggers[1].code).to.eql(undefined);
                                    expect(localResult[0].triggers[1].operation).to.eql(undefined);
                                    expect(localResult[0].triggers[1].when).to.eql(undefined);
                                    expect(localResult[0].triggers[1].__type__).to.eql(undefined);

                                    expect(localResult[0].triggers[2]._id).to.eql("t3");
                                    expect(localResult[0].triggers[2].name).to.eql("TaskPreInsertDaffodil1");
                                    expect(localResult[0].triggers[2].source).to.eql(null);
                                    expect(localResult[0].triggers[2].code).to.eql("preInsert");
                                    expect(localResult[0].triggers[2].operation).to.eql(["insert", "update"]);
                                    expect(localResult[0].triggers[2].when).to.eql("pre");
                                    expect(localResult[0].triggers[2].__type__).to.eql("insert");

                                    expect(localResult[0].triggers[3]._id).to.eql("t4");
                                    expect(localResult[0].triggers[3].name).to.eql("TaskPostInsertDaffodil");
                                    expect(localResult[0].triggers[3].source).to.eql("AFB/lib/daffodil/tasks.js");
                                    expect(localResult[0].triggers[3].code).to.eql("postInsert");
                                    expect(localResult[0].triggers[3].operation).to.eql(["insert", "update"]);
                                    expect(localResult[0].triggers[3].when).to.eql("post");
                                    expect(localResult[0].triggers[3].__type__).to.eql("insert");

                                    expect(localResult[0].triggers[4]._id).to.eql("t5");
                                    expect(localResult[0].triggers[4].name).to.eql("");
                                    expect(localResult[0].triggers[4].code).to.eql(null);

                                    expect(localResult[0].triggers[5]._id).to.eql("t6");
                                    expect(localResult[0].triggers[5].name).to.eql(null);

                                    expect(localResult[0].triggers[6]._id).to.eql("t7");
                                    expect(localResult[0].triggers[6].__type__).to.eql("delete");

                                    var expRes = [
                                        {"_id": "tasks", "triggers": [
                                            {"_id": "t2", "source": "AFB/lib/daffodil/tasks.js", name: "t2"},
                                            {"_id": "t1", "__type__": "delete"},
                                            {"_id": "t3", "code": "preInsert", "name": "TaskPreInsertDaffodil1", "operation": ["insert", "update"], "source": null, "when": "pre"},
                                            {"_id": "t4", "name": "TaskPostInsertDaffodil", "source": "AFB/lib/daffodil/tasks.js", "code": "postInsert", "operation": ["insert", "update"], "when": "post"},
                                            {"_id": "t5", "code": null, "name": ""},
                                            {"_id": "t6", "name": null},
                                            {"_id": "t7", "__type__": "delete"}
                                        ]}
                                    ];
                                    localDb1.query({$collection: "pl.collections"}, function (err, mainResult) {
                                        if (err) {
                                            done(err);
                                            return;
                                        }
                                        console.log("mainREsult >?>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(mainResult));
                                        expect(mainResult.result).to.have.length(1);
                                        expect(mainResult.result[0]._id).to.eql("tasks");
                                        expect(mainResult.result[0].collection).to.eql("tasks");
                                        expect(mainResult.result[0].triggers).to.have.length(5);
                                        expect(mainResult.result[0].triggers[0]._id).to.eql("t2");
                                        expect(mainResult.result[0].triggers[0].name).to.eql("t2");
                                        expect(mainResult.result[0].triggers[0].source).to.eql("AFB/lib/daffodil/tasks.js");
                                        expect(mainResult.result[0].triggers[0].code).to.eql("postInsert");
                                        expect(mainResult.result[0].triggers[0].operation).to.eql(["insert", "update"]);
                                        expect(mainResult.result[0].triggers[0].when).to.eql("post");
                                        expect(mainResult.result[0].triggers[0].__type__).to.eql(undefined);

                                        expect(mainResult.result[0].triggers[1]._id).to.eql("t5");
                                        expect(mainResult.result[0].triggers[1].name).to.eql("");
                                        expect(mainResult.result[0].triggers[1].source).to.eql("AFB/lib/tasks.js");
                                        expect(mainResult.result[0].triggers[1].code).to.eql(undefined);
                                        expect(mainResult.result[0].triggers[1].operation).to.eql(["insert", "update"]);
                                        expect(mainResult.result[0].triggers[1].when).to.eql("post");
                                        expect(mainResult.result[0].triggers[1].__type__).to.eql(undefined);

                                        expect(mainResult.result[0].triggers[2]._id).to.eql("t6");
                                        expect(mainResult.result[0].triggers[2].name).to.eql(undefined);
                                        expect(mainResult.result[0].triggers[2].source).to.eql("AFB/lib/tasks.js");
                                        expect(mainResult.result[0].triggers[2].code).to.eql("postInsert");
                                        expect(mainResult.result[0].triggers[2].operation).to.eql(["insert", "update"]);
                                        expect(mainResult.result[0].triggers[2].when).to.eql("post");
                                        expect(mainResult.result[0].triggers[2].__type__).to.eql(undefined);

                                        expect(mainResult.result[0].triggers[3]._id).to.eql("t3");
                                        expect(mainResult.result[0].triggers[3].name).to.eql("TaskPreInsertDaffodil1");
//                                        expect(mainResult.result[0].triggers[3].source).to.eql(undefined);
                                        expect(mainResult.result[0].triggers[3].source).to.eql(null);
                                        expect(mainResult.result[0].triggers[3].code).to.eql("preInsert");
                                        expect(mainResult.result[0].triggers[3].operation).to.eql(["insert", "update"]);
                                        expect(mainResult.result[0].triggers[3].when).to.eql("pre");
                                        expect(mainResult.result[0].triggers[3].__type__).to.eql("insert");

                                        expect(mainResult.result[0].triggers[4]._id).to.eql("t4");
                                        expect(mainResult.result[0].triggers[4].name).to.eql("TaskPostInsertDaffodil");
                                        expect(mainResult.result[0].triggers[4].source).to.eql("AFB/lib/daffodil/tasks.js");
                                        expect(mainResult.result[0].triggers[4].code).to.eql("postInsert");
                                        expect(mainResult.result[0].triggers[4].operation).to.eql(["insert", "update"]);
                                        expect(mainResult.result[0].triggers[4].when).to.eql("post");
                                        expect(mainResult.result[0].triggers[4].__type__).to.eql("insert");

                                        done();
                                        var result = {"result": [
                                            {"_id": "tasks", "collection": "tasks", "triggers": [
                                                {"_id": "t2", "name": "TaskPostInsert", "source": "AFB/lib/daffodil/tasks.js", "code": "postInsert", "operation": ["insert", "update"], "when": "post"},
                                                {"_id": "t5", "name": "", "source": "AFB/lib/tasks.js", "operation": ["insert", "update"], "when": "post"},
                                                {"_id": "t6", "source": "AFB/lib/tasks.js", "code": "postInsert", "operation": ["insert", "update"], "when": "post"},
                                                {"_id": "t3", "code": "preInsert", "name": "TaskPreInsertDaffodil1", "operation": ["insert", "update"], "source": null, "when": "pre"},
                                                {"_id": "t4", "name": "TaskPostInsertDaffodil", "source": "AFB/lib/daffodil/tasks.js", "code": "postInsert", "operation": ["insert", "update"], "when": "post"}
                                            ]}
                                        ]}
                                    })
                                })
                            })
                        })
                    })
                })
            })

        })

        it("Rights merging in Role", function (done) {
            ApplaneDB.connect(ApplaneDBConfig.URL, ApplaneDBConfig.Admin.DB, function (err, adminDb) {
                if (err) {
                    done(err);
                    return;
                }
                ApplaneDB.connect(ApplaneDBConfig.URL, localDB1, function (err, localDb1) {
                    if (err) {
                        done(err);
                        return;
                    }
                    var adminCollection = [
                        {
                            $collection: "roles",
                            $insert: [
                                {_id: "Admin", role: "admin", label: "Admin", rights: [
                                    {_id: 1, right: "write", tables: {"relationships": {write: 1}, status: {read: 1}}, filter: {type: "Leads"}},
                                    {_id: 2, right: "read", tables: {"relationships": {read: 1}, status: {read: 1}}, filter: {type: "Leads"}}
                                ]} ,
                                {_id: "Manager", role: "crmmanager", label: "Manager", rights: [
                                    {right: "write", tables: {"Leads": {write: 1}, opportunity: {read: 1}}, filter: {type: "Leads"}},
                                    {right: "read", tables: {"Leads": {read: 1}, opportunity: {read: 1}}, filter: {type: "Leads"}}
                                ]} ,
                                {_id: "CEO", role: "ceo", label: "CEO", rights: [
                                    {_id: 1, right: "write"}
                                ]}
                            ]
                        }
                    ];
                    adminDb.batchUpdateById(adminCollection, function (err) {
                        if (err) {
                            done(err);
                            return;
                        }
                        var localCollection = [
                            {
                                $collection: "roles",
                                $update: [
                                    {_id: "Admin", "$set": {role: "admin1"}}
                                ]
                            }
                        ];
                        localDb1.batchUpdateById(localCollection, function (err, res) {
                            if (err) {
                                done(err);
                                return;
                            }
                            localDb1.db.collection("roles").find().toArray(function (err, localResult) {
                                if (err) {
                                    done(err);
                                    return;
                                }
                                console.log("role >>>>>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(localResult));
                                expect(localResult).to.have.length(1);
                                expect(localResult[0].role).to.eql("admin1");
                                localCollection = [
                                    {
                                        $collection: "roles",
                                        $update: [
                                            {_id: "Admin", "$set": {
                                                label: "Admin1",
                                                rights: {
                                                    $insert: [
                                                        {right: "None", tables: {status: {read: 1}}}
                                                    ], $update: [
                                                        {_id: 1, $set: {right: "read", "tables": {tasks: 1}}}
                                                    ], $delete: [
                                                        {_id: 2}
                                                    ]
                                                }
                                            }} ,
                                            {_id: "CEO", $set: {rights: { $insert: [
                                                {right: "None", tables: {status: {read: 1}}}
                                            ], $update: [
                                                {_id: 1, $set: {right: "read", "tables": {tasks: 1}}}
                                            ]}}}
                                        ]
                                    }
                                ];
                                localDb1.batchUpdateById(localCollection, function (err, res) {
                                    if (err) {
                                        done(err);
                                        return;
                                    }
                                    localDb1.db.collection("roles").find().toArray(function (err, localResult) {
                                        if (err) {
                                            done(err);
                                            return;
                                        }
                                        console.log("role >>>>>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(localResult));

                                        var expResult = [
                                            {"_id": "Admin", "label": "Admin1", "rights": [
                                                {"_id": 1, "filter": {"type": "Leads"}, "right": "read", "tables": {"relationships": {"write": 1}, "status": {"read": 1}}},
                                                {"right": "None", "tables": {"status": {"read": 1}}}
                                            ], "role": "admin1"},
                                            {"_id": "CEO", "rights": [
                                                {"_id": 1, "right": "read"},
                                                {" right": "None", "tables": {"status": {"read": 1}}}
                                            ]}
                                        ];
                                        localDb1.query({$collection: "roles"}, function (err, mainResult) {
                                            if (err) {
                                                done(err);
                                                return;
                                            }

                                            console.log("mainREsult >?>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(mainResult));

                                            var expectedResult = {"result": [
                                                {"_id": "Admin", "role": "admin1", "label": "Admin1", "rights": [
                                                    {"_id": 1, "filter": {"type": "Leads"}, "right": "read", "tables": {"relationships": {"write": 1}, "status": {"read": 1}}},
                                                    {"right": "None", "tables": {"status": {"read": 1}}}
                                                ]},
                                                {"_id": "Manager", "role": "crmmanager", "label": "Manager", "rights": [
                                                    {"right": "write", "tables": {"Leads": {"write": 1}, "opportunity": {"read": 1}}, "filter": {"type": "Leads"}},
                                                    {"right": "read", "tables": {"Leads": {"read": 1}, "opportunity": {"read": 1}}, "filter": {"type": "Leads"}}
                                                ]},
                                                {"_id": "CEO", "role": "ceo", "label": "CEO", "rights": [
                                                    {"_id": 1, "right": "read"},
                                                    {"right": "None", "tables": {"status": {"read": 1}}}
                                                ]}
                                            ]}
                                            done();
                                        })
                                    })
                                })
                            })
                        })
                    })
                })
            })
        })

        it.skip("Two level array")
        it.skip("Filter in query")
        it.skip("Filter in array field")
        it.skip("array as unwind")


        it.skip("role merging", function (done) {

            var adminDb = Config.ADMIN_DB
            var localDb = Config.DB;
            var adminApplication = [
                {_id: "a1", application: "crm", label: "Crm", roles: [
                    {_id: "crm manager", role: "crmmanager"},
                    {_id: "crm projectlead", role: "crmprojectlead"}
                ]}
            ]
            var adminRoles = [
                {_id: "crm manager", role: "crmmanager", label: "Manager", tables: {relationships: {r: 1, w: 1}, tasks: {r: 1, w: 1}}},
                {_id: "crm projectlead", role: "crmprojectlead", label: "Project lead", tables: {relationships: {r: 0, w: 0}, tasks: {r: 1, w: 1}}}
            ]
            //applications --> application should be unique, but it should not be applied on localdb
            var localApplication = [
                {_id: "a1", label: "CRM", roles: []}
            ]

            var localRoles = [
                {_id: "crm manager", tables: {relationships: {r: 1, w: 0}}}
            ]
            /*
             * document  :true --> new document can be added and if found with same _id, then it should be merged, if _deleted then it should be removed
             * */
            var applicationCollection = {collections: "applications", //saved in admin db
                fields: [],
                merge: {document: true, fields: {menus: {document: true}}  },
                indexes: [
                    {indexName: "uniqueindex", fields: {application: 1}, onlyadmin: true, unique: true}
                ]
            }

            var roleCollection = {collections: "roles", //saved in admin db
                fields: [],
                merge: {document: true, fields: {tables: false} },
                indexes: [
                    {indexName: "uniqueindex", fields: {rolename: 1}, onlyadmin: true, unique: true}
                ]
            }
            done();
        })

        it.skip("fields merging", function (done) {
            //same as menus
        })

        it.skip("collection merging", function (done) {
            //when new collection defined in local db no issue, use merge:{document:true} in collections definition}

        })

        it.skip("saving", function (done) {
            var adminMenus = [
                {_id: 1, label: "Accounts", collection: "accounts"},
                {_id: 2, label: "AccountGroups", collection: "accounts"}
            ]
            var updates = {$update: {_id: 1, $set: {label: "Accounts"}}}
            //it should be saved in local db and for local db it will be a insert and not update
            var updates = {$delete: {_id: 2}};
            //it should be saved in localdb and will be treated as insert, __deleted__:true

            var updates = {$insert: {label: "Transactions", collection: "txs"}};
            //it wil be saved as insert and __insert__ will be true

        })

        it.skip("saving in array", function (done) {
            var adminCollection = [
                {_id: "tasks", collection: "tasks", triggers: [
                    {_id: "t1", name: "TaskPreInsert", source: "AFB/lib/tasks.js", code: "preInsert", operation: ["insert", "update"], when: "pre"},
                    {_id: "t2", name: "TaskPostInsert", source: "AFB/lib/tasks.js", code: "postInsert", operation: ["insert", "update"], when: "post"}
                ]}
            ]

            var updates =
            {$update: { _id: "tasks", $set: {triggers: {$insert: [
                {_id: "t3", name: "TaskPreInsertDaffodil", source: "AFB/lib/daffodil/tasks.js", code: "preInsert", operation: ["insert", "update"], when: "pre"},
                {_id: "t4", name: "TaskPostInsertDaffodil", source: "AFB/lib/daffodil/tasks.js", code: "postInsert", operation: ["insert", "update"], when: "post"}
            ]}}} }

            //we be treated as insert in local db, it need to be check, if it is already exists, then update other wise insert
            //we may use upsert for this without trigger
            //array will be as push and pull
            //if some array get deleted, we need to put __deleted__:true


        })

    })

    describe("QueryCase", function () {

        //Sort in query After merging.

        before(function (done) {
            ApplaneDB.configure(configureOptions, function (err) {
                if (err) {
                    done(err);
                    return;
                }
                ApplaneDB.addCollection(collectionsToRegister, function (err) {
                    if (err) {
                        done(err);
                        return;
                    }
                    done();
                })
            })
        })

        afterEach(function (done) {
            ApplaneDB.connect(ApplaneDBConfig.URL, localDB1, function (err, localDb1) {
                localDb1.dropDatabase(function (err) {
                    ApplaneDB.connect(ApplaneDBConfig.URL, localDB2, function (err, localDb2) {
                        localDb2.dropDatabase(function (err) {
                            ApplaneDB.connect(ApplaneDBConfig.URL, ApplaneDBConfig.Admin.DB, function (err, adminDb) {
                                adminDb.dropDatabase(function (err) {
                                    done(err);
                                });
                            });
                        });
                    });
                });
            })
        })

        it("menus merging", function (done) {
            ApplaneDB.connect(ApplaneDBConfig.URL, ApplaneDBConfig.Admin.DB, function (err, adminDb) {
                if (err) {
                    done(err);
                    return;
                }
                ApplaneDB.connect(ApplaneDBConfig.URL, localDB1, function (err, localDb1) {
                    if (err) {
                        done(err);
                        return;
                    }
                    var adminMenus = [
                        {
                            $collection: "menus",
                            $insert: [
                                {_id: "m1", menu: "Relationships", collection: "relationships", viewid: "allleads", ui: "grid", index: 100},
                                {_id: "m2", menu: "Communications", collection: "communications", viewid: "allcommunications", ui: "grid", index: 200} ,
                                {_id: "m3", menu: "Tasks", collection: "tasks", viewid: "tasks", ui: "grid", index: 300}
                            ]
                        }
                    ];
                    adminDb.batchUpdateById(adminMenus, function (err) {
                        if (err) {
                            done(err);
                            return;
                        }
                        var localMenus = [
                            {
                                $collection: "menus",
                                $insert: [
                                    {_id: "daffodilm1", menu: "Contacts", collection: "contacts", viewid: "contacts", ui: "grid", __type__: "insert", index: 50},
                                    {_id: "m1", menu: "Leads", index: 250},
                                    {_id: "m3", __type__: "delete"}
                                ],
                                $modules: {MergeLocalAdminDB: 0}
                            }
                        ];
                        localDb1.batchUpdateById(localMenus, function (err) {
                            if (err) {
                                done(err);
                                return;
                            }
                            localDb1.db.collection("menus").find({}, {sort: {_id: 1}}).toArray(function (err, localMenus) {
                                if (err) {
                                    done(err);
                                    return;
                                }
                                console.log("localMenus>>>>>>>>>>>>>>>>" + JSON.stringify(localMenus));
                                expect(localMenus).to.have.length(3);

                                expect(localMenus[0]._id).to.eql("daffodilm1");
                                expect(localMenus[0].menu).to.eql("Contacts");
                                expect(localMenus[0].index).to.eql(50);
                                expect(localMenus[0].collection).to.eql("contacts");
                                expect(localMenus[0].viewid).to.eql("contacts");
                                expect(localMenus[0].ui).to.eql("grid");
                                expect(localMenus[0].__type__).to.eql("insert");

                                expect(localMenus[1]._id).to.eql("m1");
                                expect(localMenus[1].menu).to.eql("Leads");
                                expect(localMenus[1].index).to.eql(250);
                                expect(localMenus[1].collection).to.eql(undefined);
                                expect(localMenus[1].viewid).to.eql(undefined);
                                expect(localMenus[1].__type__).to.eql(undefined);

                                expect(localMenus[2]._id).to.eql("m3");
                                expect(localMenus[2].menu).to.eql(undefined);
                                expect(localMenus[2].index).to.eql(undefined);
                                expect(localMenus[2].collection).to.eql(undefined);
                                expect(localMenus[2].viewid).to.eql(undefined);
                                expect(localMenus[2].__type__).to.eql("delete");
                                var expectedResult = [
                                    {_id: "daffodilm1", menu: "Contacts", collection: "contacts", viewid: "contacts", ui: "grid", __type__: "insert", index: 50},
                                    {_id: "m1", menu: "Leads", index: 250},
                                    {_id: "m3", __type__: "delete"}
                                ]

                                localDb1.query({$collection: "menus", $sort: {menu: 1}}, function (err, menuResult) {
                                    if (err) {
                                        done(err);
                                        return;
                                    }
                                    console.log("menuResult >>>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(menuResult));
                                    expect(menuResult.result).to.have.length(3);
                                    expect(menuResult.result[0]._id).to.eql("m2");
                                    expect(menuResult.result[0].menu).to.eql("Communications");
                                    expect(menuResult.result[0].index).to.eql(200);
                                    expect(menuResult.result[0].collection).to.eql("communications");
                                    expect(menuResult.result[0].viewid).to.eql("allcommunications");
                                    expect(menuResult.result[0].ui).to.eql("grid");
                                    expect(menuResult.result[0].__type__).to.eql(undefined);

                                    expect(menuResult.result[1]._id).to.eql("daffodilm1");
                                    expect(menuResult.result[1].menu).to.eql("Contacts");
                                    expect(menuResult.result[1].index).to.eql(50);
                                    expect(menuResult.result[1].collection).to.eql("contacts");
                                    expect(menuResult.result[1].viewid).to.eql("contacts");
                                    expect(menuResult.result[1].ui).to.eql("grid");
                                    expect(menuResult.result[1].__type__).to.eql("insert");

                                    expect(menuResult.result[2]._id).to.eql("m1");
                                    expect(menuResult.result[2].menu).to.eql("Leads");
                                    expect(menuResult.result[2].index).to.eql(250);
                                    expect(menuResult.result[2].collection).to.eql("relationships");
                                    expect(menuResult.result[2].viewid).to.eql("allleads");
                                    expect(menuResult.result[2].ui).to.eql("grid");
                                    expect(menuResult.result[2].__type__).to.eql(undefined);

                                    var result = [
                                        {_id: "m2", menu: "Communications", collection: "communications", viewid: "allcommunications", ui: "grid", index: 200} ,
                                        {_id: "daffodilm1", menu: "Contacts", collection: "contacts", viewid: "contacts", ui: "grid", index: 50},
                                        {_id: "m1", menu: "Leads", collection: "relationships", viewid: "allleads", ui: "grid", index: 250}

                                    ]
                                    done();
                                })
                            })

                        })
                    })
                })
            })
        })

        it("menus merging in two databases", function (done) {
            ApplaneDB.connect(ApplaneDBConfig.URL, ApplaneDBConfig.Admin.DB, function (err, adminDb) {
                if (err) {
                    done(err);
                    return;
                }
                ApplaneDB.connect(ApplaneDBConfig.URL, localDB1, function (err, localDb1) {
                    if (err) {
                        done(err);
                        return;
                    }
                    ApplaneDB.connect(ApplaneDBConfig.URL, localDB2, function (err, localDb2) {
                        if (err) {
                            done(err);
                            return;
                        }
                        var adminMenus = [
                            {
                                $collection: "menus",
                                $insert: [
                                    {_id: "m1", menu: "Relationships", collection: "relationships", viewid: "allleads", ui: "grid", index: 100},
                                    {_id: "m2", menu: "Communications", collection: "communications", viewid: "allcommunications", ui: "grid", index: 200} ,
                                    {_id: "m3", menu: "Tasks", collection: "tasks", viewid: "tasks", ui: "grid", index: 300}
                                ]
                            }
                        ];
                        adminDb.batchUpdateById(adminMenus, function (err) {
                            if (err) {
                                done(err);
                                return;
                            }
                            var localDB1Menus = [
                                {
                                    $collection: "menus",
                                    $insert: [
                                        {_id: "daffodilm1", menu: "Contacts", collection: "contacts", viewid: "contacts", ui: "grid", __type__: "insert", index: 50},
                                        {_id: "m1", menu: "Leads", index: 250},
                                        {_id: "m3", __type__: "delete"}
                                    ],
                                    $modules: {MergeLocalAdminDB: 0}

                                }
                            ];
                            localDb1.batchUpdateById(localDB1Menus, function (err) {
                                if (err) {
                                    done(err);
                                    return;
                                }
                                var localDB2Menus = [
                                    {
                                        $collection: "menus",
                                        $insert: [
                                            {_id: "daffodilm2", menu: "Contacts1", collection: "contacts1", viewid: "contacts1", ui: "grid", __type__: "insert", index: 50},
                                            {_id: "m1", menu: "Leads1", index: 200},
                                            {_id: "m2", __type__: "delete"}
                                        ],
                                        $modules: {MergeLocalAdminDB: 0}
                                    }
                                ];
                                localDb2.batchUpdateById(localDB2Menus, function (err) {
                                    if (err) {
                                        done(err);
                                        return;
                                    }
                                    localDb1.db.collection("menus").find({}, {sort: {_id: 1}}).toArray(function (err, localMenus) {
                                        if (err) {
                                            done(err);
                                            return;
                                        }

                                        expect(localMenus).to.have.length(3);

                                        expect(localMenus[0]._id).to.eql("daffodilm1");
                                        expect(localMenus[0].menu).to.eql("Contacts");
                                        expect(localMenus[0].index).to.eql(50);
                                        expect(localMenus[0].collection).to.eql("contacts");
                                        expect(localMenus[0].viewid).to.eql("contacts");
                                        expect(localMenus[0].ui).to.eql("grid");
//                                        expect(localMenus[0].__type__).to.eql("insert");

                                        expect(localMenus[1]._id).to.eql("m1");
                                        expect(localMenus[1].menu).to.eql("Leads");
                                        expect(localMenus[1].index).to.eql(250);
                                        expect(localMenus[1].collection).to.eql(undefined);
                                        expect(localMenus[1].viewid).to.eql(undefined);
                                        expect(localMenus[1].__type__).to.eql(undefined);

                                        expect(localMenus[2]._id).to.eql("m3");
                                        expect(localMenus[2].menu).to.eql(undefined);
                                        expect(localMenus[2].index).to.eql(undefined);
                                        expect(localMenus[2].collection).to.eql(undefined);
                                        expect(localMenus[2].viewid).to.eql(undefined);
                                        expect(localMenus[2].__type__).to.eql("delete");
                                        var expectedResult = [
                                            {_id: "daffodilm1", menu: "Contacts", collection: "contacts", viewid: "contacts", ui: "grid", __type__: "insert", index: 50},
                                            {_id: "m1", menu: "Leads", index: 250},
                                            {_id: "m3", __type__: "delete"}
                                        ]

                                        localDb1.query({$collection: "menus", $sort: {menu: 1}}, function (err, menuResult) {
                                            if (err) {
                                                done(err);
                                                return;
                                            }

                                            expect(menuResult.result).to.have.length(3);

                                            expect(menuResult.result[0]._id).to.eql("m2");
                                            expect(menuResult.result[0].menu).to.eql("Communications");
                                            expect(menuResult.result[0].index).to.eql(200);
                                            expect(menuResult.result[0].collection).to.eql("communications");
                                            expect(menuResult.result[0].viewid).to.eql("allcommunications");
                                            expect(menuResult.result[0].ui).to.eql("grid");
                                            expect(menuResult.result[0].__type__).to.eql(undefined);

                                            expect(menuResult.result[1]._id).to.eql("daffodilm1");
                                            expect(menuResult.result[1].menu).to.eql("Contacts");
                                            expect(menuResult.result[1].index).to.eql(50);
                                            expect(menuResult.result[1].collection).to.eql("contacts");
                                            expect(menuResult.result[1].viewid).to.eql("contacts");
                                            expect(menuResult.result[1].ui).to.eql("grid");
                                            expect(menuResult.result[1].__type__).to.eql("insert");

                                            expect(menuResult.result[2]._id).to.eql("m1");
                                            expect(menuResult.result[2].menu).to.eql("Leads");
                                            expect(menuResult.result[2].index).to.eql(250);
                                            expect(menuResult.result[2].collection).to.eql("relationships");
                                            expect(menuResult.result[2].viewid).to.eql("allleads");
                                            expect(menuResult.result[2].ui).to.eql("grid");
                                            expect(menuResult.result[2].__type__).to.eql(undefined);

                                            var result = [
                                                {_id: "m2", menu: "Communications", collection: "communications", viewid: "allcommunications", ui: "grid", index: 200} ,
                                                {_id: "daffodilm1", menu: "Contacts", collection: "contacts", viewid: "contacts", ui: "grid", index: 50},
                                                {_id: "m1", menu: "Leads", collection: "relationships", viewid: "allleads", ui: "grid", index: 250}

                                            ]
                                            localDb2.db.collection("menus").find({}, {sort: {_id: 1}}).toArray(function (err, localMenus) {
                                                if (err) {
                                                    done(err);
                                                    return;
                                                }

                                                expect(localMenus).to.have.length(3);

                                                expect(localMenus[0]._id).to.eql("daffodilm2");
                                                expect(localMenus[0].menu).to.eql("Contacts1");
                                                expect(localMenus[0].index).to.eql(50);
                                                expect(localMenus[0].collection).to.eql("contacts1");
                                                expect(localMenus[0].viewid).to.eql("contacts1");
                                                expect(localMenus[0].ui).to.eql("grid");
                                                expect(localMenus[0].__type__).to.eql("insert");

                                                expect(localMenus[1]._id).to.eql("m1");
                                                expect(localMenus[1].menu).to.eql("Leads1");
                                                expect(localMenus[1].index).to.eql(200);
                                                expect(localMenus[1].collection).to.eql(undefined);
                                                expect(localMenus[1].viewid).to.eql(undefined);
                                                expect(localMenus[1].__type__).to.eql(undefined);

                                                expect(localMenus[2]._id).to.eql("m2");
                                                expect(localMenus[2].menu).to.eql(undefined);
                                                expect(localMenus[2].index).to.eql(undefined);
                                                expect(localMenus[2].collection).to.eql(undefined);
                                                expect(localMenus[2].viewid).to.eql(undefined);
                                                expect(localMenus[2].__type__).to.eql("delete");
                                                var expectedResult = [
                                                    {_id: "daffodilm2", menu: "Contacts1", collection: "contacts1", viewid: "contacts1", ui: "grid", __type__: "insert", index: 50},
                                                    {_id: "m1", menu: "Leads1", index: 200},
                                                    {_id: "m2", __type__: "delete"}
                                                ]

                                                localDb2.query({$collection: "menus", $sort: {_id: 1}}, function (err, menuResult) {
                                                    if (err) {
                                                        done(err);
                                                        return;
                                                    }

                                                    expect(menuResult.result).to.have.length(3);

                                                    expect(menuResult.result[0]._id).to.eql("daffodilm2");
                                                    expect(menuResult.result[0].menu).to.eql("Contacts1");
                                                    expect(menuResult.result[0].index).to.eql(50);
                                                    expect(menuResult.result[0].collection).to.eql("contacts1");
                                                    expect(menuResult.result[0].viewid).to.eql("contacts1");
                                                    expect(menuResult.result[0].ui).to.eql("grid");
                                                    expect(menuResult.result[0].__type__).to.eql("insert");

                                                    expect(menuResult.result[1]._id).to.eql("m1");
                                                    expect(menuResult.result[1].menu).to.eql("Leads1");
                                                    expect(menuResult.result[1].index).to.eql(200);
                                                    expect(menuResult.result[1].collection).to.eql("relationships");
                                                    expect(menuResult.result[1].viewid).to.eql("allleads");
                                                    expect(menuResult.result[1].ui).to.eql("grid");
                                                    expect(menuResult.result[1].__type__).to.eql(undefined);

                                                    expect(menuResult.result[2]._id).to.eql("m3");
                                                    expect(menuResult.result[2].menu).to.eql("Tasks");
                                                    expect(menuResult.result[2].index).to.eql(300);
                                                    expect(menuResult.result[2].collection).to.eql("tasks");
                                                    expect(menuResult.result[2].viewid).to.eql("tasks");
                                                    expect(menuResult.result[2].ui).to.eql("grid");
                                                    expect(menuResult.result[2].__type__).to.eql(undefined);

                                                    var result = [
                                                        {_id: "daffodilm2", menu: "Contacts1", collection: "contacts1", viewid: "contacts1", ui: "grid", index: 50},
                                                        {_id: "m1", menu: "Leads1", collection: "relationships", viewid: "allleads", ui: "grid", index: 200},
                                                        {_id: "m3", menu: "Tasks", collection: "tasks", viewid: "tasks", ui: "grid", index: 300}

                                                    ]
                                                    done();
                                                })
                                            })
                                        })
                                    })

                                })
                            })
                        })
                    })
                })
            })
        })

        it("menus merging with sorting by index after merging", function (done) {
            ApplaneDB.connect(ApplaneDBConfig.URL, ApplaneDBConfig.Admin.DB, function (err, adminDb) {
                if (err) {
                    done(err);
                    return;
                }
                ApplaneDB.connect(ApplaneDBConfig.URL, localDB1, function (err, localDb1) {
                    if (err) {
                        done(err);
                        return;
                    }
                    var adminMenus = [
                        {
                            $collection: "menus",
                            $insert: [
                                {_id: "m1", menu: "Relationships", collection: "relationships", viewid: "allleads", ui: "grid", index: 100},
                                {_id: "m2", menu: "Communications", collection: "communications", viewid: "allcommunications", ui: "grid", index: 200} ,
                                {_id: "m3", menu: "Tasks", collection: "tasks", viewid: "tasks", ui: "grid", index: 300}
                            ]
                        }
                    ];
                    adminDb.batchUpdateById(adminMenus, function (err) {
                        if (err) {
                            done(err);
                            return;
                        }
                        var localMenus = [
                            {
                                $collection: "menus",
                                $insert: [
                                    {_id: "daffodilm1", menu: "Contacts", collection: "contacts", viewid: "contacts", ui: "grid", __type__: "insert", index: 50},
                                    {_id: "m1", menu: "Leads", index: 250},
                                    {_id: "m3", __type__: "delete"}
                                ],
                                $modules: {MergeLocalAdminDB: 0}
                            }
                        ];
                        localDb1.batchUpdateById(localMenus, function (err) {
                            if (err) {
                                done(err);
                                return;
                            }
                            localDb1.db.collection("menus").find({}, {sort: {_id: 1}}).toArray(function (err, localMenus) {
                                if (err) {
                                    done(err);
                                    return;
                                }

                                expect(localMenus).to.have.length(3);

                                expect(localMenus[0]._id).to.eql("daffodilm1");
                                expect(localMenus[0].menu).to.eql("Contacts");
                                expect(localMenus[0].index).to.eql(50);
                                expect(localMenus[0].collection).to.eql("contacts");
                                expect(localMenus[0].viewid).to.eql("contacts");
                                expect(localMenus[0].ui).to.eql("grid");
                                expect(localMenus[0].__type__).to.eql("insert");

                                expect(localMenus[1]._id).to.eql("m1");
                                expect(localMenus[1].menu).to.eql("Leads");
                                expect(localMenus[1].index).to.eql(250);
                                expect(localMenus[1].collection).to.eql(undefined);
                                expect(localMenus[1].viewid).to.eql(undefined);
                                expect(localMenus[1].__type__).to.eql(undefined);

                                expect(localMenus[2]._id).to.eql("m3");
                                expect(localMenus[2].menu).to.eql(undefined);
                                expect(localMenus[2].index).to.eql(undefined);
                                expect(localMenus[2].collection).to.eql(undefined);
                                expect(localMenus[2].viewid).to.eql(undefined);
                                expect(localMenus[2].__type__).to.eql("delete");
                                var expectedResult = [
                                    {_id: "daffodilm1", menu: "Contacts", collection: "contacts", viewid: "contacts", ui: "grid", __type__: "insert", index: 50},
                                    {_id: "m1", menu: "Leads", index: 250},
                                    {_id: "m3", __type__: "delete"}
                                ]

                                localDb1.query({$collection: "menus", $sort: {index: 1}}, function (err, menuResult) {
                                    if (err) {
                                        done(err);
                                        return;
                                    }
                                    expect(menuResult.result).to.have.length(3);

                                    expect(menuResult.result[0]._id).to.eql("daffodilm1");
                                    expect(menuResult.result[0].menu).to.eql("Contacts");
                                    expect(menuResult.result[0].index).to.eql(50);
                                    expect(menuResult.result[0].collection).to.eql("contacts");
                                    expect(menuResult.result[0].viewid).to.eql("contacts");
                                    expect(menuResult.result[0].ui).to.eql("grid");
                                    expect(menuResult.result[0].__type__).to.eql("insert");

                                    expect(menuResult.result[1]._id).to.eql("m2");
                                    expect(menuResult.result[1].menu).to.eql("Communications");
                                    expect(menuResult.result[1].index).to.eql(200);
                                    expect(menuResult.result[1].collection).to.eql("communications");
                                    expect(menuResult.result[1].viewid).to.eql("allcommunications");
                                    expect(menuResult.result[1].ui).to.eql("grid");
                                    expect(menuResult.result[1].__type__).to.eql(undefined);

                                    expect(menuResult.result[2]._id).to.eql("m1");
                                    expect(menuResult.result[2].menu).to.eql("Leads");
                                    expect(menuResult.result[2].index).to.eql(250);
                                    expect(menuResult.result[2].collection).to.eql("relationships");
                                    expect(menuResult.result[2].viewid).to.eql("allleads");
                                    expect(menuResult.result[2].ui).to.eql("grid");
                                    expect(menuResult.result[2].__type__).to.eql(undefined);

                                    var result = [
                                        {_id: "daffodilm1", menu: "Contacts", collection: "contacts", viewid: "contacts", ui: "grid", index: 50},
                                        {_id: "m2", menu: "Communications", collection: "communications", viewid: "allcommunications", ui: "grid", index: 200} ,
                                        {_id: "m1", menu: "Leads", collection: "relationships", viewid: "allleads", ui: "grid", index: 250}

                                    ]
                                    done();
                                })
                            })

                        })
                    })
                })
            })
        })

        it("status override with status on localdb", function (done) {
            ApplaneDB.connect(ApplaneDBConfig.URL, ApplaneDBConfig.Admin.DB, function (err, adminDb) {
                if (err) {
                    done(err);
                    return;
                }
                ApplaneDB.connect(ApplaneDBConfig.URL, localDB1, function (err, localDb1) {
                    if (err) {
                        done(err);
                        return;
                    }
                    var adminStatus = [
                        {
                            $collection: "status",
                            $insert: [
                                {_id: "new", status: "New"},
                                {_id: "inprogress", status: "In progress"},
                                {_id: "completed", status: "Completed"}
                            ]
                        }
                    ];
                    adminDb.batchUpdateById(adminStatus, function (err) {
                        if (err) {
                            done(err);
                            return;
                        }

                        var localStatus = [
                            {
                                $collection: "status",
                                $insert: [
                                    {_id: "completed", status: "Completed"},
                                    {_id: "fresh", status: "Fresh"},
                                    {_id: "new", status: "Latest"},
                                    {_id: "planned", status: "Planned"}
                                ],
                                $modules: {MergeLocalAdminDB: 0}
                            }
                        ];
                        localDb1.batchUpdateById(localStatus, function (err) {
                            if (err) {
                                done(err);
                                return;
                            }

                            localDb1.db.collection("status").find({}, {sort: {_id: 1}}).toArray(function (err, localStatus) {
                                if (err) {
                                    done(err);
                                    return;
                                }
                                console.log("localStatus >>>>>>>>>>>>>>>>>>>>" + JSON.stringify(localStatus));
                                expect(localStatus).to.have.length(4);

                                expect(localStatus[0]._id).to.eql("completed");
                                expect(localStatus[0].status).to.eql("Completed");
                                expect(localStatus[1]._id).to.eql("fresh");
                                expect(localStatus[1].status).to.eql("Fresh");
                                expect(localStatus[2]._id).to.eql("new");
                                expect(localStatus[2].status).to.eql("Latest");
                                expect(localStatus[3]._id).to.eql("planned");
                                expect(localStatus[3].status).to.eql("Planned");
                                var expectedResult = [
                                    {_id: "completed", status: "Completed"},
                                    {_id: "fresh", status: "Fresh"},
                                    {_id: "new", status: "Latest"},
                                    {_id: "planned", status: "Planned"}
                                ]

                                localDb1.query({$collection: "status", $sort: {_id: 1}}, function (err, statusResult) {
                                    if (err) {
                                        done(err);
                                        return;
                                    }
                                    console.log("status >>>>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(statusResult));
                                    expect(statusResult.result).to.have.length(4);

                                    expect(statusResult.result[0]._id).to.eql("completed");
                                    expect(statusResult.result[0].status).to.eql("Completed");
                                    expect(statusResult.result[1]._id).to.eql("fresh");
                                    expect(statusResult.result[1].status).to.eql("Fresh");
                                    expect(statusResult.result[2]._id).to.eql("new");
                                    expect(statusResult.result[2].status).to.eql("Latest");
                                    expect(statusResult.result[3]._id).to.eql("planned");
                                    expect(statusResult.result[3].status).to.eql("Planned");
                                    var expectedResult = [
                                        {_id: "completed", status: "Completed"},
                                        {_id: "fresh", status: "Fresh"},
                                        {_id: "new", status: "Latest"},
                                        {_id: "planned", status: "Planned"}
                                    ]
                                    done();
                                })
                            })
                        })
                    })
                })
            })

        })

        it("status override with no status on localdb", function (done) {
            ApplaneDB.connect(ApplaneDBConfig.URL, ApplaneDBConfig.Admin.DB, function (err, adminDb) {
                if (err) {
                    done(err);
                    return;
                }
                ApplaneDB.connect(ApplaneDBConfig.URL, localDB1, function (err, localDb1) {
                    if (err) {
                        done(err);
                        return;
                    }
                    var adminStatus = [
                        {
                            $collection: "status",
                            $insert: [
                                {_id: "new", status: "New"},
                                {_id: "inprogress", status: "In progress"},
                                {_id: "completed", status: "Completed"}
                            ]
                        }
                    ];
                    adminDb.batchUpdateById(adminStatus, function (err) {
                        if (err) {
                            done(err);
                            return;
                        }

                        localDb1.query({$collection: "status", $sort: {_id: 1}}, function (err, statusResult) {
                            if (err) {
                                done(err);
                                return;
                            }
                            console.log("statusResult >>>>>>>>>>>>>>>>>>>>" + JSON.stringify(statusResult));

                            expect(statusResult.result).to.have.length(3);

                            expect(statusResult.result[0]._id).to.eql("completed");
                            expect(statusResult.result[0].status).to.eql("Completed");
                            expect(statusResult.result[1]._id).to.eql("inprogress");
                            expect(statusResult.result[1].status).to.eql("In progress");
                            expect(statusResult.result[2]._id).to.eql("new");
                            expect(statusResult.result[2].status).to.eql("New");
                            var expectedResult = [
                                {_id: "new", status: "New"},
                                {_id: "inprogress", status: "In progress"} ,
                                {_id: "completed", status: "Completed"}
                            ]
                            done();
                        })
                    })
                })
            })
        })

        it("persons override with person on localdb", function (done) {
            ApplaneDB.connect(ApplaneDBConfig.URL, ApplaneDBConfig.Admin.DB, function (err, adminDb) {
                if (err) {
                    done(err);
                    return;
                }
                ApplaneDB.connect(ApplaneDBConfig.URL, localDB1, function (err, localDb1) {
                    if (err) {
                        done(err);
                        return;
                    }
                    var adminPersons = [
                        {
                            $collection: "persons",
                            $insert: [
                                {_id: "sachin", name: "sachin", languages: [
                                    {language: "Hindi", read: true, speak: true}
                                ]},
                                {_id: "manjeet", name: "manjeet", status: "Completed", languages: [
                                    {language: "Hindi", read: true, write: true},
                                    {language: "English", read: true, speak: true}
                                ]}
                            ]
                        }
                    ];
                    adminDb.batchUpdateById(adminPersons, function (err) {
                        if (err) {
                            done(err);
                            return;
                        }
                        var localPersons = [
                            {
                                $collection: "persons",
                                $insert: [
                                    {_id: "Ashish", name: "Ashish", languages: [
                                        {language: "Hindi", read: true, speak: true}
                                    ]},
                                    {_id: "Rohit", name: "Rohit", status: "Completed", languages: [
                                        {language: "Hindi", read: true, write: true},
                                        {language: "English", read: true, speak: true}
                                    ]}
                                ],
                                $modules: {MergeLocalAdminDB: 0}
                            }
                        ];
                        localDb1.batchUpdateById(localPersons, function (err) {
                            if (err) {
                                done(err);
                                return;
                            }

                            localDb1.query({$collection: "persons", $sort: {_id: 1}}, function (err, personResult) {
                                if (err) {
                                    done(err);
                                    return;
                                }
                                console.log("personResult >>>>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(personResult));
                                expect(personResult.result).to.have.length(2);

                                expect(personResult.result[0]._id).to.eql("Ashish");
                                expect(personResult.result[0].name).to.eql("Ashish");
                                expect(personResult.result[0].languages).to.have.length(1);
                                expect(personResult.result[0].languages[0].language).to.eql("Hindi");
                                expect(personResult.result[0].languages[0].read).to.eql(true);
                                expect(personResult.result[0].languages[0].speak).to.eql(true);
                                expect(personResult.result[1]._id).to.eql("Rohit");
                                expect(personResult.result[1].name).to.eql("Rohit");
                                expect(personResult.result[1].languages).to.have.length(2);
                                expect(personResult.result[1].languages[0].language).to.eql("Hindi");
                                expect(personResult.result[1].languages[0].read).to.eql(true);
                                expect(personResult.result[1].languages[0].write).to.eql(true);
                                expect(personResult.result[1].languages[1].language).to.eql("English");
                                expect(personResult.result[1].languages[1].read).to.eql(true);
                                expect(personResult.result[1].languages[1].speak).to.eql(true);
                                var expectedResult = {result: [
                                    {_id: "Ashish", name: "Ashish", languages: [
                                        {language: "Hindi", read: true, speak: true}
                                    ]},
                                    {_id: "Rohit", name: "Rohit", status: "Completed", languages: [
                                        {language: "Hindi", read: true, write: true},
                                        {language: "English", read: true, speak: true}
                                    ]}
                                ]}
                                done();
                            })
                        })
                    })
                })
            })

        })

        it("persons override with no person on localdb", function (done) {
            ApplaneDB.connect(ApplaneDBConfig.URL, ApplaneDBConfig.Admin.DB, function (err, adminDb) {
                if (err) {
                    done(err);
                    return;
                }
                ApplaneDB.connect(ApplaneDBConfig.URL, localDB1, function (err, localDb1) {
                    if (err) {
                        done(err);
                        return;
                    }
                    var adminPersons = [
                        {
                            $collection: "persons",
                            $insert: [
                                {_id: "sachin", name: "sachin", languages: [
                                    {language: "Hindi", read: true, speak: true}
                                ]},
                                {_id: "manjeet", name: "manjeet", status: "Completed", languages: [
                                    {language: "Hindi", read: true, write: true},
                                    {language: "English", read: true, speak: true}
                                ]}
                            ]
                        }
                    ];
                    adminDb.batchUpdateById(adminPersons, function (err) {
                        if (err) {
                            done(err);
                            return;
                        }

                        localDb1.query({$collection: "persons", $sort: {_id: -1}}, function (err, personResult) {
                            if (err) {
                                done(err);
                                return;
                            }
                            console.log("personResult >>>>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(personResult));
                            expect(personResult.result).to.have.length(2);

                            expect(personResult.result[0]._id).to.eql("sachin");
                            expect(personResult.result[0].name).to.eql("sachin");
                            expect(personResult.result[0].languages).to.have.length(1);
                            expect(personResult.result[0].languages[0].language).to.eql("Hindi");
                            expect(personResult.result[0].languages[0].read).to.eql(true);
                            expect(personResult.result[0].languages[0].speak).to.eql(true);
                            expect(personResult.result[1]._id).to.eql("manjeet");
                            expect(personResult.result[1].name).to.eql("manjeet");
                            expect(personResult.result[1].languages).to.have.length(2);
                            expect(personResult.result[1].languages[0].language).to.eql("Hindi");
                            expect(personResult.result[1].languages[0].read).to.eql(true);
                            expect(personResult.result[1].languages[0].write).to.eql(true);
                            expect(personResult.result[1].languages[1].language).to.eql("English");
                            expect(personResult.result[1].languages[1].read).to.eql(true);
                            expect(personResult.result[1].languages[1].speak).to.eql(true);
                            var expectedResult = {result: [
                                {_id: "sachin", name: "sachin", languages: [
                                    {language: "Hindi", read: true, speak: true}
                                ]},
                                {_id: "manjeet", name: "manjeet", status: "Completed", languages: [
                                    {language: "Hindi", read: true, write: true},
                                    {language: "English", read: true, speak: true}
                                ]}
                            ]}
                            done();
                        })
                    })
                })
            })

        })

        it("persons override with unwind person on localdb", function (done) {
            ApplaneDB.connect(ApplaneDBConfig.URL, ApplaneDBConfig.Admin.DB, function (err, adminDb) {
                if (err) {
                    done(err);
                    return;
                }
                ApplaneDB.connect(ApplaneDBConfig.URL, localDB1, function (err, localDb1) {
                    if (err) {
                        done(err);
                        return;
                    }
                    var adminPersons = [
                        {
                            $collection: "persons",
                            $insert: [
                                {_id: "sachin", name: "sachin", languages: [
                                    {language: "Hindi", read: true, speak: true}
                                ]},
                                {_id: "manjeet", name: "manjeet", status: "Completed", languages: [
                                    {language: "Hindi", read: true, write: true},
                                    {language: "English", read: true, speak: true}
                                ]}
                            ]
                        }
                    ];
                    adminDb.batchUpdateById(adminPersons, function (err) {
                        if (err) {
                            done(err);
                            return;
                        }
                        var localPersons = [
                            {
                                $collection: "persons",
                                $insert: [
                                    {_id: "Ashish", name: "Ashish", languages: [
                                        {language: "Hindi", read: true, speak: true}
                                    ]},
                                    {_id: "Rohit", name: "Rohit", status: "Completed", languages: [
                                        {language: "Hindi", read: true, write: true},
                                        {language: "English", read: true, speak: true}
                                    ]}
                                ],
                                $modules: {MergeLocalAdminDB: 0}
                            }
                        ];
                        localDb1.batchUpdateById(localPersons, function (err) {
                            if (err) {
                                done(err);
                                return;
                            }

                            localDb1.query({$collection: "persons", $unwind: ["languages"], $sort: {_id: 1}}, function (err, personResult) {
                                if (err) {
                                    done(err);
                                    return;
                                }
                                console.log("personResult >>>>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(personResult));
                                expect(personResult.result).to.have.length(3);

                                expect(personResult.result[0]._id).to.eql("Ashish");
                                expect(personResult.result[0].name).to.eql("Ashish");
                                expect(personResult.result[0].languages.language).to.eql("Hindi");
                                expect(personResult.result[0].languages.read).to.eql(true);
                                expect(personResult.result[0].languages.speak).to.eql(true);
                                expect(personResult.result[1]._id).to.eql("Rohit");
                                expect(personResult.result[1].name).to.eql("Rohit");
                                expect(personResult.result[1].languages.language).to.eql("Hindi");
                                expect(personResult.result[1].languages.read).to.eql(true);
                                expect(personResult.result[1].languages.write).to.eql(true);
                                expect(personResult.result[2]._id).to.eql("Rohit");
                                expect(personResult.result[2].name).to.eql("Rohit");
                                expect(personResult.result[2].languages.language).to.eql("English");
                                expect(personResult.result[2].languages.read).to.eql(true);
                                expect(personResult.result[2].languages.speak).to.eql(true);
                                var expectedResult = {"result": [
                                    {"_id": "Ashish", "name": "Ashish", "languages": {"language": "Hindi", "read": true, "speak": true}},
                                    {"_id": "Rohit", "name": "Rohit", "status": "Completed", "languages": {"language": "Hindi", "read": true, "write": true}},
                                    {"_id": "Rohit", "name": "Rohit", "status": "Completed", "languages": {"language": "English", "read": true, "speak": true}}
                                ]}
                                done();
                            })
                        })
                    })
                })
            })

        })

        it("persons override with unwind no person on localdb", function (done) {
            ApplaneDB.connect(ApplaneDBConfig.URL, ApplaneDBConfig.Admin.DB, function (err, adminDb) {
                if (err) {
                    done(err);
                    return;
                }
                ApplaneDB.connect(ApplaneDBConfig.URL, localDB1, function (err, localDb1) {
                    if (err) {
                        done(err);
                        return;
                    }
                    var adminPersons = [
                        {
                            $collection: "persons",
                            $insert: [
                                {_id: "sachin", name: "sachin", languages: [
                                    {language: "Hindi", read: true, speak: true}
                                ]},
                                {_id: "manjeet", name: "manjeet", status: "Completed", languages: [
                                    {language: "Hindi", read: true, write: true},
                                    {language: "English", read: true, speak: true}
                                ]}
                            ]
                        }
                    ];
                    adminDb.batchUpdateById(adminPersons, function (err) {
                        if (err) {
                            done(err);
                            return;
                        }

                        localDb1.query({$collection: "persons", $unwind: ["languages"], $sort: {_id: -1}}, function (err, personResult) {
                            if (err) {
                                done(err);
                                return;
                            }
                            console.log("personResult >>>>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(personResult));
                            expect(personResult.result).to.have.length(3);

                            expect(personResult.result[0]._id).to.eql("sachin");
                            expect(personResult.result[0].name).to.eql("sachin");
                            expect(personResult.result[0].languages.language).to.eql("Hindi");
                            expect(personResult.result[0].languages.read).to.eql(true);
                            expect(personResult.result[0].languages.speak).to.eql(true);
                            expect(personResult.result[1]._id).to.eql("manjeet");
                            expect(personResult.result[1].name).to.eql("manjeet");
                            expect(personResult.result[1].languages.language).to.eql("Hindi");
                            expect(personResult.result[1].languages.read).to.eql(true);
                            expect(personResult.result[1].languages.write).to.eql(true);
                            expect(personResult.result[2]._id).to.eql("manjeet");
                            expect(personResult.result[2].name).to.eql("manjeet");
                            expect(personResult.result[2].languages.language).to.eql("English");
                            expect(personResult.result[2].languages.read).to.eql(true);
                            expect(personResult.result[2].languages.speak).to.eql(true);
                            var expectedResult = {"result": [
                                {"_id": "sachin", "name": "sachin", "languages": {"language": "Hindi", "read": true, "speak": true}},
                                {"_id": "manjeet", "name": "manjeet", "status": "Completed", "languages": {"language": "Hindi", "read": true, "write": true}},
                                {"_id": "manjeet", "name": "manjeet", "status": "Completed", "languages": {"language": "English", "read": true, "speak": true}}
                            ]}
                            done();
                        })
                    })
                })

            })
        })

        it("Array case add trigger in collections", function (done) {
            //assuming triggers are saved in collection

            ApplaneDB.connect(ApplaneDBConfig.URL, ApplaneDBConfig.Admin.DB, function (err, adminDb) {
                if (err) {
                    done(err);
                    return;
                }
                ApplaneDB.connect(ApplaneDBConfig.URL, localDB1, function (err, localDb1) {
                    if (err) {
                        done(err);
                        return;
                    }
                    var adminCollection = [
                        {
                            $collection: "pl.collections",
                            $insert: [
                                {_id: "tasks", collection: "tasks", triggers: [
                                    {_id: "t1", name: "TaskPreInsert", source: "AFB/lib/tasks.js", code: "preInsert", operation: ["insert", "update"], when: "pre"},
                                    {_id: "t2", name: "TaskPostInsert", source: "AFB/lib/tasks.js", code: "postInsert", operation: ["insert", "update"], when: "post"}
                                ]}
                            ]
                        }
                    ];
                    adminDb.batchUpdateById(adminCollection, function (err) {
                        if (err) {
                            done(err);
                            return;
                        }
                        var localCollection = [
                                {
                                    $collection: "pl.collections",
                                    $insert: [
                                        {_id: "tasks", collection: "tasks", triggers: [
                                            {_id: "t3", name: "TaskPreInsertDaffodil", source: "AFB/lib/daffodil/tasks.js", code: "preInsert", operation: ["insert", "update"], when: "pre"},
                                            {_id: "t4", name: "TaskPostInsertDaffodil", source: "AFB/lib/daffodil/tasks.js", code: "postInsert", operation: ["insert", "update"], when: "post"},
                                            {_id: "t2", source: "AFB/lib/daffodil/tasks.js", operation: ["insert", "delete"]},
                                            {_id: "t1", __type__: "delete"}
                                        ]}
                                    ],
                                    $modules: {MergeLocalAdminDB: 0, TriggerModule: 0}
                                }
                            ]
                            ;

                        localDb1.batchUpdateById(localCollection, function (err) {
                            if (err) {
                                done(err);
                                return;
                            }

                            localDb1.db.collection("pl.collections").find().toArray(function (err, localResult) {
                                if (err) {
                                    done(err);
                                    return;
                                }

                                expect(localResult).to.have.length(1);
                                expect(localResult[0]._id).to.eql("tasks");
//                                expect(localResult[0].collection).to.eql(undefined);
                                expect(localResult[0].triggers).to.have.length(4);
                                expect(localResult[0].triggers[0]._id).to.eql("t3");
                                expect(localResult[0].triggers[0].name).to.eql("TaskPreInsertDaffodil");
                                expect(localResult[0].triggers[0].source).to.eql("AFB/lib/daffodil/tasks.js");
                                expect(localResult[0].triggers[0].code).to.eql("preInsert");
                                expect(localResult[0].triggers[0].operation).to.eql(["insert", "update"]);
                                expect(localResult[0].triggers[0].when).to.eql("pre");
                                expect(localResult[0].triggers[0].__type__).to.eql(undefined);

                                expect(localResult[0].triggers[1]._id).to.eql("t4");
                                expect(localResult[0].triggers[1].name).to.eql("TaskPostInsertDaffodil");
                                expect(localResult[0].triggers[1].source).to.eql("AFB/lib/daffodil/tasks.js");
                                expect(localResult[0].triggers[1].code).to.eql("postInsert");
                                expect(localResult[0].triggers[1].operation).to.eql(["insert", "update"]);
                                expect(localResult[0].triggers[1].when).to.eql("post");
                                expect(localResult[0].triggers[1].__type__).to.eql(undefined);

                                expect(localResult[0].triggers[2]._id).to.eql("t2");
                                expect(localResult[0].triggers[2].name).to.eql(undefined);
                                expect(localResult[0].triggers[2].source).to.eql("AFB/lib/daffodil/tasks.js");
                                expect(localResult[0].triggers[2].code).to.eql(undefined);
                                expect(localResult[0].triggers[2].operation).to.eql(["insert", "delete"]);
                                expect(localResult[0].triggers[2].when).to.eql(undefined);
                                expect(localResult[0].triggers[2].__type__).to.eql(undefined);

                                expect(localResult[0].triggers[3]._id).to.eql("t1");
                                expect(localResult[0].triggers[3].name).to.eql(undefined);
                                expect(localResult[0].triggers[3].source).to.eql(undefined);
                                expect(localResult[0].triggers[3].code).to.eql(undefined);
                                expect(localResult[0].triggers[3].operation).to.eql(undefined);
                                expect(localResult[0].triggers[3].when).to.eql(undefined);
                                expect(localResult[0].triggers[3].__type__).to.eql("delete");

                                var expectedResult = [
                                    {_id: "tasks", triggers: [
                                        {_id: "t3", name: "TaskPreInsertDaffodil", source: "AFB/lib/daffodil/tasks.js", code: "preInsert", operation: ["insert", "update"], when: "pre", __type__: "insert"},
                                        {_id: "t4", name: "TaskPostInsertDaffodil", source: "AFB/lib/daffodil/tasks.js", code: "postInsert", operation: ["insert", "update"], when: "post", __type__: "insert"},
                                        {_id: "t2", source: "AFB/lib/daffodil/tasks.js", operation: ["insert", "delete"]},
                                        {_id: "t1", __type__: "delete"}
                                    ]}
                                ]

                                localDb1.query({$collection: "pl.collections"}, function (err, mainResult) {
                                    if (err) {
                                        done(err);
                                        return;
                                    }
                                    console.log("mainREsult >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(mainResult));
                                    expect(mainResult.result).to.have.length(1);
                                    expect(mainResult.result[0]._id).to.eql("tasks");
                                    expect(mainResult.result[0].collection).to.eql("tasks");
                                    expect(mainResult.result[0].triggers).to.have.length(3);
                                    expect(mainResult.result[0].triggers[0]._id).to.eql("t2");
                                    expect(mainResult.result[0].triggers[0].name).to.eql("TaskPostInsert");
                                    expect(mainResult.result[0].triggers[0].source).to.eql("AFB/lib/daffodil/tasks.js");
                                    expect(mainResult.result[0].triggers[0].code).to.eql("postInsert");
                                    expect(mainResult.result[0].triggers[0].operation).to.eql(["insert", "delete"]);
                                    expect(mainResult.result[0].triggers[0].when).to.eql("post");
                                    expect(mainResult.result[0].triggers[0].__type__).to.eql(undefined);

                                    expect(mainResult.result[0].triggers[1]._id).to.eql("t3");
                                    expect(mainResult.result[0].triggers[1].name).to.eql("TaskPreInsertDaffodil");
                                    expect(mainResult.result[0].triggers[1].source).to.eql("AFB/lib/daffodil/tasks.js");
                                    expect(mainResult.result[0].triggers[1].code).to.eql("preInsert");
                                    expect(mainResult.result[0].triggers[1].operation).to.eql(["insert", "update"]);
                                    expect(mainResult.result[0].triggers[1].when).to.eql("pre");
                                    expect(mainResult.result[0].triggers[1].__type__).to.eql(undefined);

                                    expect(mainResult.result[0].triggers[2]._id).to.eql("t4");
                                    expect(mainResult.result[0].triggers[2].name).to.eql("TaskPostInsertDaffodil");
                                    expect(mainResult.result[0].triggers[2].source).to.eql("AFB/lib/daffodil/tasks.js");
                                    expect(mainResult.result[0].triggers[2].code).to.eql("postInsert");
                                    expect(mainResult.result[0].triggers[2].operation).to.eql(["insert", "update"]);
                                    expect(mainResult.result[0].triggers[2].when).to.eql("post");
                                    expect(mainResult.result[0].triggers[2].__type__).to.eql(undefined);

                                    done();
                                    var result = {"result": [
                                        {"_id": "tasks", "collection": "tasks", "triggers": [
                                            {"_id": "t2", "name": "TaskPostInsert", "source": "AFB/lib/daffodil/tasks.js", "code": "postInsert", "operation": ["insert", "update"], "when": "post"},
                                            {"_id": "t3", "name": "TaskPreInsertDaffo dil", "source": "AFB/lib/daffodil/tasks.js", "code": "preInsert", "operation": ["insert", "update"], "when": "pre"},
                                            {"_id": "t4", "name": "TaskPostInsertDaffodil", "source": "AFB/lib/daffodil/tasks.js", "code": "postInsert", "operation": ["insert", "update"], "when": "post"}
                                        ]}
                                    ]}
                                })
                            })
                        })

                    })
                })
            })

        })
        //Array override
        //jsonobject in array
        //merge jsonobjectvalue
        //merge jsonobject value in array..
    })

})
;