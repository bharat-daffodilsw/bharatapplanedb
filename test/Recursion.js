/**
 *  mocha --recursive --timeout 150000 -g "SubQuery testcase recursion" --reporter spec
 *  mocha --recursive --timeout 150000 -g "Recursive With single columns" --reporter spec
 *  mocha --recursive --timeout 150000 -g "P&L" --reporter spec
 *  mocha --recursive --timeout 150000 -g "Recursive With single columns without _id" --reporter spec
 *
 */
var ApplaneDB = require("../lib/DB.js");
var Config = require("./config.js");
var NorthwindDb = require("./NorthwindDb.js");
var expect = require('chai').expect;
var Utils = require("ApplaneCore/apputil/util.js");
var Constants = require("../lib/Constants.js");
var OPTIONS = {};

var collectionsToRegister = [
    {collection:NorthwindDb.EMP_RECURSIVE_WITHOUT_ID_TABLE, fields:[
        {field:"reporting_to", type:"fk", collection:NorthwindDb.EMP_RECURSIVE_WITHOUT_ID_TABLE}
    ]}
];

describe("SubQuery testcase recursion", function () {

    describe("recursion testcase", function () {

        beforeEach(function (done) {
            ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
                if (err) {
                    console.log("Err in Conn");
                    done(err);
                    return;
                }
                ApplaneDB.addCollection(collectionsToRegister, function (err) {
                    if (err) {
                        done(err);
                        return;
                    }
                    NorthwindDb.insertData(db, NorthwindDb.EMP_RECURSION_TABLE, NorthwindDb.Emps, function (err) {
                        if (err) {
                            console.log("Err in insert");
                            done(err);
                            return;
                        }
                        NorthwindDb.insertData(db, NorthwindDb.EMP_RECURSIVE_TABLE, NorthwindDb.EmpRecursive, function (err) {
                            if (err) {
                                console.log("Err in insert");
                                done(err);
                                return;
                            }
                            console.log("Data Inserted");
                            NorthwindDb.insertData(db, NorthwindDb.EMP_RELATION_TABLE, NorthwindDb.EmpRelation, function (err) {
                                if (err) {
                                    console.log("Err in insert");
                                    done(err);
                                    return;
                                }
                                console.log("Data Inserted");

                                db.batchUpdateById([
                                    {$collection:NorthwindDb.EMP_RECURSIVE_WITHOUT_ID_TABLE, $insert:NorthwindDb.EmpRecursiveWithout_id}
                                ], function (err) {
                                    if (err) {
                                        console.log("Err in insert");
                                        done(err);
                                        return;
                                    }
                                    console.log("Data Inserted");
                                    done();
                                })
                            })
                        })
                    })
                })
            })
        });

        afterEach(function (done) {
            ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
                if (err) {
                    done(err);
                    return;
                }
                NorthwindDb.removeData(db, NorthwindDb.EMP_RECURSION_TABLE, {}, function (err) {
                    if (err) {
                        done(err);
                        return;
                    }
                    NorthwindDb.removeData(db, NorthwindDb.EMP_RECURSIVE_TABLE, {}, function (err) {
                        if (err) {
                            done(err);
                            return;
                        }
                        console.log("Data Removed");
                        NorthwindDb.removeData(db, NorthwindDb.EMP_RELATION_TABLE, {}, function (err) {
                            if (err) {
                                done(err);
                                return;
                            }
                            console.log("Data Removed");
                            NorthwindDb.removeData(db, NorthwindDb.EMP_RECURSIVE_WITHOUT_ID_TABLE, {}, function (err) {
                                if (err) {
                                    done(err);
                                    return;
                                }
                                console.log("Data Removed");
                                done();
                            })
                        })
                    })
                })
            })
        });

        it("Recursive With multiple column", function (done) {
            ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
                if (err) {
                    console.log("Err in Conn..IT");
                    done(err);
                    return;
                }
                var query = {
                    $collection:{collection:NorthwindDb.EMP_RECURSION_TABLE, fields:[
                        {field:"reporting_to", type:"fk", collection:NorthwindDb.EMP_RECURSION_TABLE}
                    ]},
                    $fields:{
                        employee:1,
                        code:1,
//                        reporting_to:1
                    },
                    $filter:{
                        status:"active",
                        "reporting_to":null
                    },
                    $recursion:{
                        reporting_to:"_id",
                        $level:4,
                        $ensure:1
                    },
                    $sort:{"employee":1}
                };
                console.log("Query :: -- " + JSON.stringify(query) + "\n");
                db.query(query, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log("Data------  " + JSON.stringify(data));
                    expect(data.result).to.have.length(1);
                    expect(data.result[0]._id).to.eql("Yogesh");
                    expect(data.result[0].employee).to.eql("Yogesh");
                    expect(data.result[0].code).to.eql("DFG-1011");

                    expect(data.result[0].children).to.have.length(3);
                    expect(data.result[0].children[0]._id).to.eql("Nitin");
                    expect(data.result[0].children[0].employee).to.eql("Nitin");
                    expect(data.result[0].children[0].code).to.eql("DFG-1018");
                    expect(data.result[0].children[1].children).to.have.length(2);
                    expect(data.result[0].children[0].children[0]._id).to.eql("Pawan");
                    expect(data.result[0].children[0].children[1]._id).to.eql("Rohit");

                    expect(data.result[0].children[1]._id).to.eql("Pawan");
                    expect(data.result[0].children[1].employee).to.eql("Pawan");
                    expect(data.result[0].children[1].children).to.have.length(2);
                    expect(data.result[0].children[1].children[0]._id).to.eql("Ashu");
                    expect(data.result[0].children[1].children[1]._id).to.eql("Sachin");
                    expect(data.result[0].children[1].children[1].children).to.have.length(1);
                    expect(data.result[0].children[1].children[1].children[0]._id).to.eql("Ashu");

                    expect(data.result[0].children[2]._id).to.eql("Rohit");
                    expect(data.result[0].children[2].employee).to.eql("Rohit");
                    expect(data.result[0].children[2].children).to.have.length(0);


                    done();
                })
            })

            //step1, get all employees where reporting_to : null
            //throw error if not $root filter
            //recursion module --> doQuery-> it will add $root filter

            var query1 = {
                $collection:{collection:NorthwindDb.EMP_RECURSION_TABLE, fields:[
                    {field:"reporting_to", type:"fk", collection:NorthwindDb.EMP_RECURSION_TABLE}
                ]},
                $fields:{
                    employee:1,
                    code:1,
                    reporting_to:1,
                    children:{
                        $query:{
                            $type:"n-rows",
                            $collection:{collection:NorthwindDb.EMP_RECURSION_TABLE, fields:[
                                {field:"reporting_to", type:"fk", collection:NorthwindDb.EMP_RECURSION_TABLE}
                            ]},
                            $fields:{employee:1, code:1, reporting_to:1},
                            $filter:{
                                status:"active"
                            },
                            $recursion:{
                                reporting_to:"_id",
                                $level:3
                            },
                            $sort:{"employee":1}
                        },
                        $fk:"reporting_to",
                        $parent:"_id"
                    }
                },
                $filter:{"status":"active", reporting_to:null},
                $sort:{"employee":1}
            };

            //setp 2 --> doQuery of subquery --> will remove children as it is of subquery column

            var query1 = {
                $collection:"employees",
                $fields:{
                    employee:1,
                    code:1

                },
                $filter:{"status":"active", reporting_to:null},
                $fk:{"reporting_to":"employee"}


            };

            var expectedResult = {"result":[
                {"_id":"Yogesh", "employee":"Yogesh", "code":"DFG-1011", "children":[
                    {"_id":"Nitin", "employee":"Nitin", "code":"DFG-1018", "reporting_to":[
                        {"_id":"Yogesh"}
                    ], "children":[
                        {"_id":"Pawan", "employee":"Pawan", "code":"DFG-1012", "reporting_to":[
                            {"_id":"Yogesh"},
                            {"_id":"Nitin"}
                        ], "children":[
                            {"_id":"Sachin", "employee":"Sachin", "code":"DFG-1013", "reporting_to":[
                                {"_id":"Pawan"}
                            ], "children":[
                                {"_id":"Ashu", "employee":"Ashu", "code":"DFG-1019", "reporting_to":[
                                    {"_id":"Pawan"},
                                    {"_id":"Sachin"}
                                ]}
                            ]},
                            {"_id":"Ashu", "employee":"Ashu", "code":"DFG-1019", "reporting_to":[
                                {"_id":"Pawan"},
                                {"_id":"Sachin" }
                            ], "children":[]}
                        ]},
                        {"_id":"Rohit", "employee":"Rohit", "code":"DFG-1015", "reporting_to":[
                            {"_id":"Yogesh"},
                            {"_id":"Nitin"}
                        ], "children":[]}
                    ]},
                    {"_id":"Pawan", "employee":"Pawan", "code":"DFG-1012", "reporting_to":[
                        {"_id":"Yogesh"},
                        {"_id":"Nitin"}
                    ], "children":[
                        {"_id":"Sachin", "employee":"Sachin", "code":"DFG -1013", "reporting_to":[
                            {"_id":"Pawan"}
                        ], "children":[
                            {"_id":"Ashu", "employee":"Ashu", "code":"DFG-1019", "reporting_to":[
                                {"_id":"Pawan"},
                                {"_id":"Sachin"}
                            ], "children":[]}
                        ]},
                        {"_id":"Ashu", "employee":"Ashu", "code":"DFG-1019", "reporting_to":[
                            {"_id":"Pawan"},
                            {"_id":"Sachin"}
                        ], "children":[]}
                    ]},
                    {"_id":"Rohit", "employee":"Rohit", "code":"DFG-1015", "reporting_to":[
                        {"_id":"Yogesh"},
                        {"_id":"Nitin"}
                    ], "children":[]}
                ]}
            ]};
        })

        it("Recursive With single columns", function (done) {
            ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
                if (err) {
                    console.log("Err in Conn..IT");
                    done(err);
                    return;
                }
                var query = {
                    $collection:{collection:NorthwindDb.EMP_RECURSIVE_TABLE, fields:[
                        {field:"reporting_to", type:"fk", collection:NorthwindDb.EMP_RECURSION_TABLE}
                    ]},
                    $fields:{
                        employee:1,
                        code:1,
                        reporting_to:1
                    },
                    $filter:{
                        status:"active",
                        "reporting_to":null
                    },
                    $recursion:{
                        reporting_to:"_id",
                        $level:3,
                        $ensure:1
                    }

                };
                console.log("Query :: -- " + JSON.stringify(query) + "\n");
                db.query(query, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log("data >>>>>>>>>" + JSON.stringify(data))
                    expect(data.result).to.have.length(1);
                    expect(data.result[0]._id).to.eql("Nitin");
                    expect(data.result[0].employee).to.eql("Nitin");
                    expect(data.result[0].code).to.eql("DFG-1011");
                    expect(data.result[0].children).to.have.length(2);
                    expect(data.result[0].children[0]._id).to.eql("Pawan");
                    expect(data.result[0].children[0].children).to.have.length(1);
                    expect(data.result[0].children[0].children[0]._id).to.eql("Sachin");
                    expect(data.result[0].children[1].employee).to.eql("Rohit");
                    expect(data.result[0].children[1].children).to.have.length(0);
                    done();
                })
            })

            //step1, get all employees where reporting_to : null
            //throw error if not $root filter
            //recursion module --> doQuery-> it will add $root filter

            var query1 = {
                $collection:{collection:NorthwindDb.EMP_RECURSIVE_TABLE, fields:[
                    {field:"reporting_to", type:"fk", collection:NorthwindDb.EMP_RECURSION_TABLE}
                ]},
                $fields:{
                    employee:1,
                    code:1,
                    reporting_to:1,
                    children:{
                        $query:{
                            $type:"n-rows",
                            $collection:{collection:NorthwindDb.EMP_RECURSIVE_TABLE, fields:[
                                {field:"reporting_to", type:"fk", collection:NorthwindDb.EMP_RECURSION_TABLE}
                            ]},
                            $fields:{employee:1, code:1, reporting_to:1},
                            $filter:{
                                status:"active"
                            },
                            $recursion:{
                                reporting_to:"_id",
                                $level:2
                            }
                        },
                        $fk:"reporting_to",
                        $parent:"_id"
                    }
                },
                $filter:{"status":"active", reporting_to:null}
            };

            //setp 2 --> doQuery of subquery --> will remove children as it is of subquery column

            var query1 = {
                $collection:"employees",
                $fields:{
                    employee:1,
                    code:1,
                    reporting_to:1

                },
                $filter:{"status":"active", reporting_to:null},
                $fk:{"reporting_to":"employee"}


            };

            var expectedResult = {"result":[
                {"_id":"Nitin", "employee":"Nitin", "code":"DFG-1011", "children":[
                    {"_id":"Pawan", "employee":"Pawa n", "code":"DFG-1012", "reporting_to":{"_id":"Nitin"}, "children":[
                        {"_id":"Sachin", "employee":"Sachin", "code":"DFG-1013", "reporting_to":{"_id":"Pawan"}}
                    ]},
                    {"_id":"Rohit", "employee":"Rohit", "code":"DFG-1015", "reporting_to":{"_id":"Nitin"}, "chil dren":[]}
                ]}
            ]};

        })

        it("Recursive With single columns without _id", function (done) {
            ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
                if (err) {
                    console.log("Err in Conn..IT");
                    done(err);
                    return;
                }
                var query = {
                    $collection:{collection:NorthwindDb.EMP_RECURSIVE_WITHOUT_ID_TABLE, fields:[
                        {field:"reporting_to", type:"fk", collection:NorthwindDb.EMP_RECURSIVE_WITHOUT_ID_TABLE}
                    ]},
                    $fields:{
                        employee:1,
                        code:1,
                        reporting_to:1
                    },
                    $filter:{
                        status:"active",
                        "reporting_to":null
                    },
                    $recursion:{
                        reporting_to:"_id",
                        $level:3,
                        $ensure:1
                    }

                };
                console.log("Query :: -- " + JSON.stringify(query) + "\n");
                db.query(query, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log("data >>>>>>>>>" + JSON.stringify(data))
                    expect(data.result).to.have.length(1);
                    expect(data.result[0].employee).to.eql("Nitin");
                    expect(data.result[0].code).to.eql("DFG-1011");
                    expect(data.result[0].children).to.have.length(2);
                    expect(data.result[0].children[0].children).to.have.length(1);
                    expect(data.result[0].children[1].employee).to.eql("Rohit");
                    expect(data.result[0].children[1].children).to.have.length(0);
                    done();
                })
            })

            var res = {"result":[
                {"employee":"Nitin", "code":"DFG-1011", "_id":"536a227165941ae80e33e463", "children":[
                    {"employee":"Pawan", "code":"DFG-1012", "reporting_to":{"_id":"536a227165941ae80e33e463"}, "_id":"536a227165941ae80e33e466", "children":[
                        {"employee":"Sachin", "code":"DFG-1013", "reporting_to":{"_id ":"536a227165941ae80e33e466"}, "_id":"536a227165941ae80e33e469"}
                    ]},
                    {"employee":"Rohit", "code":"DFG-1015", "reporting_to":{"_id":"536a227165941ae80e33e463"}, "_id":"536a227165941ae80e33e46f", "children":[]}
                ]}
            ]};

        })

        it("Recursive case of Two Employees referes to one another", function (done) {
            ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
                if (err) {
                    console.log("Err in Conn..IT");
                    done(err);
                    return;
                }
                var query = {
                    $collection:{collection:NorthwindDb.EMP_RELATION_TABLE, fields:[
                        {field:"reporting_to", type:"fk", collection:NorthwindDb.EMP_RECURSION_TABLE}
                    ]},
                    $fields:{
                        employee:1,
                        code:1
//                        reporting_to:1
                    },
                    $filter:{
                        status:"active",
                        "reporting_to":null
                    },
                    $recursion:{
                        reporting_to:"_id"
                    }

                };
                db.query(query, function (err, data) {
                    if (err) {
                        var recursionError = err.toString().indexOf("Too Many Recursion levels found.") != -1;
                        if (recursionError) {
                            done();
                        } else {
                            done(err);
                        }
                    } else {
                        expect(data).to.not.be.ok;
                        done();
                    }
                })
            })

        })

        it("Recursive With single column with n level", function (done) {
            ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
                if (err) {
                    console.log("Err in Conn..IT");
                    done(err);
                    return;
                }
                var query = {
                    $collection:{collection:NorthwindDb.EMP_RECURSIVE_TABLE, fields:[
                        {field:"reporting_to", type:"fk", collection:NorthwindDb.EMP_RECURSION_TABLE}
                    ]},
                    $fields:{
                        employee:1,
                        code:1
//                        reporting_to:1
                    },
                    $filter:{
                        status:"active",
                        "reporting_to":null
                    },
                    $recursion:{
                        reporting_to:"_id",
                        $level:10
                    }

                };
                console.log("Query :: -- " + JSON.stringify(query) + "\n");
                db.query(query, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log("data >>>>>>>>>" + JSON.stringify(data))
                    expect(data.result).to.have.length(1);
                    expect(data.result[0]._id).to.eql("Nitin");
                    expect(data.result[0].employee).to.eql("Nitin");
                    expect(data.result[0].code).to.eql("DFG-1011");
                    expect(data.result[0].children).to.have.length(2);
                    expect(data.result[0].children[0]._id).to.eql("Pawan");
                    expect(data.result[0].children[0].children).to.have.length(1);
                    expect(data.result[0].children[0].children[0]._id).to.eql("Sachin");
                    expect(data.result[0].children[1].employee).to.eql("Rohit");
//                    expect(data.result[0].children[1].children).to.have.length(0);
                    done();
                })
            })

            //step1, get all employees where reporting_to : null
            //throw error if not $root filter
            //recursion module --> doQuery-> it will add $root filter

            var query1 = {
                $collection:{collection:NorthwindDb.EMP_RECURSIVE_TABLE, fields:[
                    {field:"reporting_to", type:"fk", collection:NorthwindDb.EMP_RECURSION_TABLE}
                ]},
                $fields:{
                    employee:1,
                    code:1,
                    reporting_to:1,
                    children:{
                        $query:{
                            $type:"n-rows",
                            $collection:{collection:NorthwindDb.EMP_RECURSIVE_TABLE, fields:[
                                {field:"reporting_to", type:"fk", collection:NorthwindDb.EMP_RECURSION_TABLE}
                            ]},
                            $fields:{employee:1, code:1, reporting_to:1},
                            $filter:{
                                status:"active"
                            },
                            $recursion:{
                                reporting_to:"_id",
                                $level:2
                            }
                        },
                        $fk:"reporting_to",
                        $parent:"_id"
                    }
                },
                $filter:{"status":"active", reporting_to:null}
            };

            //setp 2 --> doQuery of subquery --> will remove children as it is of subquery column

            var query1 = {
                $collection:"employees",
                $fields:{
                    employee:1,
                    code:1,
                    reporting_to:1

                },
                $filter:{"status":"active", reporting_to:null},
                $fk:{"reporting_to":"employee"}


            };

            var expectedResult = {"result":[
                {"_id":"Nitin", "employee":"Nitin", "code":"DFG-1011", "children":[
                    {"_id":"Pawan", "employee":"Pawa n", "code":"DFG-1012", "reporting_to":{"_id":"Nitin"}, "children":[
                        {"_id":"Sachin", "employee":"Sachin", "code":"DFG-1013", "reporting_to":{"_id":"Pawan"}}
                    ]},
                    {"_id":"Rohit", "employee":"Rohit", "code":"DFG-1015", "reporting_to":{"_id":"Nitin"}, "chil dren":[]}
                ]}
            ]};

        })

        it("Recursive With single column and alias in recusrion", function (done) {
            ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
                if (err) {
                    console.log("Err in Conn..IT");
                    done(err);
                    return;
                }
                var query = {
                    $collection:{collection:NorthwindDb.EMP_RECURSIVE_TABLE, fields:[
                        {field:"reporting_to", type:"fk", collection:NorthwindDb.EMP_RECURSION_TABLE}
                    ]},
                    $fields:{
                        employee:1,
                        code:1
//                        reporting_to:1
                    },
                    $filter:{
                        status:"active",
                        "reporting_to":null
                    },
                    $recursion:{
                        reporting_to:"_id",
                        $level:3,
                        $alias:"childs"
                    }

                };
                console.log("Query :: -- " + JSON.stringify(query) + "\n");
                db.query(query, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log("data >>>>>>>>>" + JSON.stringify(data))
                    expect(data.result).to.have.length(1);
                    expect(data.result[0]._id).to.eql("Nitin");
                    expect(data.result[0].employee).to.eql("Nitin");
                    expect(data.result[0].code).to.eql("DFG-1011");
                    expect(data.result[0].childs).to.have.length(2);
                    expect(data.result[0].childs[0]._id).to.eql("Pawan");
                    expect(data.result[0].childs[0].childs).to.have.length(1);
                    expect(data.result[0].childs[0].childs[0]._id).to.eql("Sachin");
                    expect(data.result[0].childs[1].employee).to.eql("Rohit");
//                    expect(data.result[0].childs[1].childs).to.have.length(0);
                    done();
                })
            })

            //step1, get all employees where reporting_to : null
            //throw error if not $root filter
            //recursion module --> doQuery-> it will add $root filter

            var query1 = {
                $collection:{collection:NorthwindDb.EMP_RECURSIVE_TABLE, fields:[
                    {field:"reporting_to", type:"fk", collection:NorthwindDb.EMP_RECURSION_TABLE}
                ]},
                $fields:{
                    employee:1,
                    code:1,
                    reporting_to:1,
                    childs:{
                        $query:{
                            $type:"n-rows",
                            $collection:{collection:NorthwindDb.EMP_RECURSIVE_TABLE, fields:[
                                {field:"reporting_to", type:"fk", collection:NorthwindDb.EMP_RECURSION_TABLE}
                            ]},
                            $fields:{employee:1, code:1, reporting_to:1},
                            $filter:{
                                status:"active"
                            },
                            $recursion:{
                                reporting_to:"_id",
                                $level:2,
                                $alias:"childs"
                            }
                        },
                        $fk:"reporting_to",
                        $parent:"_id"
                    }
                },
                $filter:{"status":"active", reporting_to:null}
            };

            //setp 2 --> doQuery of subquery --> will remove children as it is of subquery column

            var query1 = {
                $collection:"employees",
                $fields:{
                    employee:1,
                    code:1,
                    reporting_to:1

                },
                $filter:{"status":"active", reporting_to:null},
                $fk:{"reporting_to":"employee"}


            };

            var expectedResult = {"result":[
                {"_id":"Nitin", "employee":"Nitin", "code":"DFG-1011", "childs":[
                    {"_id":"Pawan", "employee":"Pawa n", "code":"DFG-1012", "reporting_to":{"_id":"Nitin"}, "childs":[
                        {"_id":"Sachin", "employee":"Sachin", "code":"DFG-1013", "reporting_to":{"_id":"Pawan"}}
                    ]},
                    {"_id":"Rohit", "employee":"Rohit", "code":"DFG-1015", "reporting_to":{"_id":"Nitin"}, "childs":[]}
                ]}
            ]};

        })
    })

    describe("P&L", function () {

        beforeEach(function (done) {
            ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
                if (err) {
                    console.log("Err in Conn");
                    done(err);
                    return;
                }
                NorthwindDb.insertData(db, NorthwindDb.ACCOUNTS_TABLE, NorthwindDb.Accounts, function (err) {
                    if (err) {
                        console.log("Err in insert");
                        done(err);
                        return;
                    }
                    NorthwindDb.insertData(db, NorthwindDb.ACCOUNT_GROUPS_TABLE, NorthwindDb.AccountGroups, function (err) {
                        if (err) {
                            console.log("Err in insert");
                            done(err);
                            return;
                        }
                        NorthwindDb.insertData(db, NorthwindDb.VOUCHERS_TABLE, NorthwindDb.Vouchers, function (err) {
                            if (err) {
                                console.log("Err in insert");
                                done(err);
                                return;
                            }
                            console.log("Data Inserted");
                            done();
                        })
                    })
                })
            })
        });

        afterEach(function (done) {
            ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
                if (err) {
                    done(err);
                    return;
                }
                NorthwindDb.removeData(db, NorthwindDb.ACCOUNTS_TABLE, {}, function (err) {
                    if (err) {
                        done(err);
                        return;
                    }
                    NorthwindDb.removeData(db, NorthwindDb.ACCOUNT_GROUPS_TABLE, {}, function (err) {
                        if (err) {
                            done(err);
                            return;
                        }
                        NorthwindDb.removeData(db, NorthwindDb.VOUCHERS_TABLE, {}, function (err) {
                            if (err) {
                                done(err);
                                return;
                            }
                            console.log("Data Removed");
                            done();
                        })
                    })
                })
            })
        });

        it("P&L query", function (done) {
            ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
                if (err) {
                    done(err);
                    return;
                }
                var query = {
                    $collection:{collection:NorthwindDb.ACCOUNT_GROUPS_TABLE, fields:[
                        {field:"parent_account_group", type:"fk", collection:NorthwindDb.ACCOUNT_GROUPS_TABLE}
                    ]},
                    $fields:{
//                        accountgroup:1,
                        grouptotal:{
                            $query:{
                                $collection:{collection:"vouchers", fields:[
                                    {field:"vlis", type:"object", multiple:true, fields:[
                                        {field:"accountgroupid", type:"fk", collection:NorthwindDb.ACCOUNT_GROUPS_TABLE}
                                    ]}
                                ]},
                                $unwind:["vlis"],
                                $group:{
                                    _id:null,
                                    vliamount:{$sum:"$vlis.amount"}
                                }
                            },
                            $fk:"vlis.accountgroupid",
                            $parent:"_id"
                        },
                        accounts:{
                            $query:{
                                $collection:{collection:"accounts", fields:[
                                    {field:"accountgroupid", type:"fk", collection:NorthwindDb.ACCOUNT_GROUPS_TABLE}
                                ]},
                                $fields:{account:1,
                                    "accountgroupid._id":1,
                                    accounttotal:{
                                        $query:{
                                            $collection:{collection:"vouchers", fields:[
                                                {field:"vlis", type:"object", multiple:true, fields:[
                                                    {field:"accountid", type:"fk", collection:NorthwindDb.ACCOUNTS_TABLE}
                                                ]}
                                            ]},
                                            $unwind:["vlis"],
                                            $group:{_id:null, accounttotal:{$sum:"$vlis.amount"}}
                                        },
                                        $fk:"vlis.accountid",
                                        $parent:"_id"
                                    }
                                }
                            },
                            $fk:"accountgroupid",
                            $parent:"_id"
                        }
                    },
                    $filter:{
                        "parent_account_group":null
                    },
                    $recursion:{
                        parent_account_group:"_id",
                        $level:2
                    },
                    $sort:{"accountgroup":1}
                };

                db.query(query, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log("data >>>>>>>>" + JSON.stringify(data));
                    expect(data.result).to.have.length(1);
                    expect(data.result[0]._id).to.eql("Income");
                    expect(data.result[0].accountgroup).to.eql("Income");
                    expect(data.result[0].grouptotal._id).to.eql("Income");
                    expect(data.result[0].grouptotal.vliamount).to.eql(-500);
                    expect(data.result[0].accounts._id).to.eql("Services");
                    expect(data.result[0].accounts.accounttotal.accounttotal).to.eql(-500);
                    expect(data.result[0].children).to.have.length(1);
                    expect(data.result[0].children[0].accountgroup).to.eql("Expense");
                    expect(data.result[0].children[0]._id).to.eql("Expense");
                    expect(data.result[0].children[0].grouptotal.vliamount).to.eql(600);
                    expect(data.result[0].children[0].parent_account_group._id).to.eql("Income");
                    expect(data.result[0].children[0].accounts.accounttotal.accounttotal).to.eql(600);
                    expect(data.result[0].children[0].children[0]._id).to.eql("Asset");
                    expect(data.result[0].children[0].children[0].accountgroup).to.eql("Asset");
                    expect(data.result[0].children[0].children[0].parent_account_group._id).to.eql("Expense");
                    expect(data.result[0].children[0].children[0].grouptotal.vliamount).to.eql(-100);
                    done();
                })

                var expectedResult = {"result":[
                    {"_id":"Income", "accountgroup":"Income", "grouptotal":{"_id":"Income", "vliamount":-500, "vlis_accountgroupid__id":"Income"}, "accounts":{"_id":"Services", "account":"Services", "accountgroupid":{"_id":"Income"}, "accounttotal":{"_id":"Services", "accounttotal":-500, "vlis_accountid__ id":"Services"}}, "children":[
                        {"_id":"Expense", "accountgroup":"Expense", "parent_account_group":{"_id":"Income"}, "grouptotal":{"_id":"Expense", "vliamount":600, "vlis_accountgroupid__id":"Expense"}, "accounts":{"_id":"salary", "account":"salary", "accountgroupid":{"_id":"Expense"}, "accounttotal":{"_id":"sa lary", "accounttotal":600, "vlis_accountid__id":"salary"}}, "children":[
                            {"_id":"Asset", "accountgroup":"Asset", "parent_account_group":{"_id":"Expense"}, "grouptotal":{"_id":"Asset", "vliamount":-100, "vlis_accountgroupid__id":"Asset"}}
                        ]}
                    ]}
                ]};

            })
        })

        //TODO, we do not required to add filter for 0 amount as we are starting from vouchers, it may requird when we starts from accountgroup
        //TODO vli filter --> will be applied two time or single time
        //TODO this report is without hierarchy

        it.skip("group by with unwindarray column with having and sort and aggregates", function (done) {

            ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
                if (err) {
                    done(err);
                    return;
                }
                var query = {$collection:{collection:"vouchers", fields:[
                    {field:"vlis", type:"object", multiple:true, fields:[
                        {field:"accountgroupid", type:"fk", collection:NorthwindDb.ACCOUNT_GROUPS_TABLE, fields:[
                            {field:"parent_account_group", type:"fk", "collection":NorthwindDb.ACCOUNT_GROUPS_TABLE}
                        ]}
                    ]}
                ]},
                    $fields:{"voucherno":1, "vlis.accountid._id":1, "vlis.accountid.account":1},
                    $filter:{
                        "vlis.accountgroupid":{$in:["Income", "Expense"]},
                        "vlis.accountgroupid.parent_account_group":null
                    },
                    $recursion:{"vlis.accountgroupid.parent_account_group":"vlis.accountgroupid._id", $level:4},
                    $unwind:["vlis"],
                    $group:{
                        _id:[
                            {accountgroupid:"$vlis.accountgroupid"},
                            {accountid:"$vlis.accountid"}
                        ],
                        amount:{$sum:"$vlis.amount"}
                    }
                };
                db.query(query, function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log("data >>>>>>>>" + JSON.stringify(data));
                    expect(data.result[0].voucherno).to.eql(1);
                    expect(data.result[0].vlis.accountid._id).to.eql("Services");
                    expect(data.result[0].vlis.accountgroupid._id).to.eql("Income");
                    expect(data.result[0].children).to.have.length(2);
                    expect(data.result[0].children[0].voucherno).to.eql(1);
                    expect(data.result[0].children[0].vlis.accountid._id).to.eql("salary");
                    expect(data.result[0].children[0].vlis.accountgroupid._id).to.eql("Expense");
                    expect(data.result[0].children[0].children).to.have.length(1);
                    expect(data.result[0].children[0].children[0].voucherno).to.eql(2);
                    expect(data.result[0].children[0].children[0].vlis.accountid._id).to.eql("cash");
                    expect(data.result[0].children[0].children[0].vlis.accountgroupid._id).to.eql("Asset");
                    expect(data.result[0].children[1].voucherno).to.eql(2);
                    expect(data.result[0].children[1].vlis.accountid._id).to.eql("salary");
                    expect(data.result[0].children[1].vlis.accountgroupid._id).to.eql("Expense");
                    expect(data.result[0].children[1].children).to.have.length(1);
                    expect(data.result[0].children[1].children[0].voucherno).to.eql(2);
                    expect(data.result[0].children[1].children[0].vlis.accountid._id).to.eql("cash");
                    expect(data.result[0].children[1].children[0].vlis.accountgroupid._id).to.eql("Asset");
                    done();
                })

                var mongoPipelines =
                    [
                        {$match:{"vlis.accountgroupid._id":{$in:["Income", "Expense"]}}},
                        {$unwind:"vlis"},
                        {$match:{"vlis.accountgroupid._id":{$in:["Income", "Expense"]}}},
                        {$group:{
                            _id:{accountgroupid:"$vlis.accountgroupid._id", accountid:"$vlis.accountid._id"},
                            amount:{$sum:"$vlis.amount"},
                            accountgroupid:{$first:"$vlis.accountgroupid"},
                            accountid:{$first:"$vlis.accountid"}
                        }},
                        {$group:{
                            _id:"$_id.accoountgroupid",
                            amount:{$sum:"$amount"},
                            accountgroupid:{$first:"$accountgroupid"},
                            children:{$push:{_id:"$_id.accountid", accountid:"$accountid", amount:"$amount"}}
                        }}

                    ]
                var result = {"result":[
                    {"voucherno":1, "vlis":{"accountid":{"_id":"Services", "account":"Services"}, "accountgroupid":{"_id":"Income"}}, "_id":"533ea4a49a1d98f008000001", "children":[
                        {"voucherno":1, "vlis":{"accountid":{"_id":"salary", "account":"salary"}, "accountgroupid":{"_id":"Expense", "parent_account_group":{"_id":"Income"}}}, "_id":"533ea4a49a1d98f008000001", "children":[
                            {"voucherno":2, "vlis":{"accountid":{"_id":"cash", "account":"cash"}, "accountgroupid":{"_id":"Asset", "parent_account_group":{"_id":"Expense"}}}, "_id":"533ea4a49a1d98f008000002"}
                        ]},
                        {"voucherno ":2, "vlis":{"accountid":{"_id":"salary", "account":"salary"}, "accountgroupid":{"_id":"Expense", "parent_account_group":{"_id":"Income"}}}, "_id ":"533ea4a49a1d98f008000002", "children":[
                            {"voucherno":2, "vlis":{"accountid":{"_id":"cash", "account":"cash"}, "accountgroupid":{"_id":"Asset", "parent_account_group":{"_id":"Expense"}}}, "_id":"533ea4a49a1d98f008000002"}
                        ]}
                    ]}
                ]}

            })
        })

    })
})
