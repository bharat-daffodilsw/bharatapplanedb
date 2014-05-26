/**
 *  mocha --recursive --timeout 150000 -g "Replicate testcase" --reporter spec
 */
var expect = require('chai').expect;
var ApplaneDB = require("../lib/DB.js");
var Config = require("./config.js");
var NorthwindDb = require('./NorthwindDb.js');
var OPTIONS = {username:"Sachin", password:"1234"};
/**
 * Created with IntelliJ IDEA.
 * User: daffodil
 * Date: 21/4/14
 * Time: 12:28 PM
 * To change this template use File | Settings | File Templates.
 */

describe("Replicate testcase", function () {

    afterEach(function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
            db.dropDatabase(function (err) {
                done(err);
            })
        });
    })

    it("simple fk column", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
            if (err) {
                done(err);
                return;
            }

            var batchUpdates = [
                {
                    $collection:{collection:"persons", fields:[
                        {field:"cityid", type:"fk", collection:"cities", upsert:true, set:["city"]}
                    ]},
                    $insert:[
                        {
                            _id:"Sachin",
                            name:"Sachin",
                            cityid:{_id:"hisar", $set:{city:"hisar"}}
                        },
                        {
                            _id:"Pawan",
                            name:"Pawan",
                            cityid:{_id:"sirsa", $set:{city:"sirsa"}}
                        },
                        {
                            _id:"Rohit",
                            name:"Rohit",
                            cityid:{_id:"hisar", $set:{city:"hisar"}}
                        }
                    ]

                }
            ];
            db.batchUpdateById(batchUpdates, function (err, res) {
                if (err) {
                    done(err);
                    return;
                }
                db.query({$collection:"cities", $sort:{city:1}}, function (err, cities) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log("cities >>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(cities));
                    var batchUpdates = [
                        {
                            $collection:{collection:"cities", referredfks:[
                                {collectionid:{collection:"persons"}, field:"cityid", set:["city"]}
                            ]},
                            $update:[
                                {
                                    _id:cities.result[0]._id,
                                    $set:{city:"hisar1"}
                                } ,
                                {
                                    _id:cities.result[1]._id,
                                    $set:{city:"sirsa1"}
                                }
                            ]

                        }
                    ];
                    db.batchUpdateById(batchUpdates, function (err, res) {
                        if (err) {
                            done(err);
                            return;
                        }
                        db.query({$collection:"cities", $sort:{city:1}}, function (err, cities) {
                            if (err) {
                                done(err);
                                return;
                            }
                            expect(cities.result).to.have.length(2);
                            expect(cities.result[0].city).to.eql("hisar1");
                            expect(cities.result[1].city).to.eql("sirsa1");
                            db.query({$collection:"persons", $sort:{name:1}}, function (err, persons) {
                                if (err) {
                                    done(err);
                                    return;
                                }
                                console.log("Persons >>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(persons));
                                expect(persons.result).to.have.length(3);
                                expect(persons.result[0].name).to.eql("Pawan");
                                expect(persons.result[1].name).to.eql("Rohit");
                                expect(persons.result[2].name).to.eql("Sachin");
                                expect(persons.result[0].cityid.city).to.eql("sirsa1");
                                expect(persons.result[1].cityid.city).to.eql("hisar1");
                                expect(persons.result[2].cityid.city).to.eql("hisar1");
                                done();
                            })
                        })
                    })
                })
            })
        })
    })

    it("simple fk column with null value", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
            if (err) {
                done(err);
                return;
            }

            var batchUpdates = [
                {
                    $collection:{collection:"persons", fields:[
                        {field:"cityid", type:"fk", collection:"cities", upsert:true, set:["city"]}
                    ]},
                    $insert:[
                        {
                            _id:"Sachin",
                            name:"Sachin",
                            cityid:{_id:"hisar", $set:{city:"hisar"}}
                        },
                        {
                            _id:"Pawan",
                            name:"Pawan",
                            cityid:{_id:"sirsa", $set:{city:"sirsa"}}
                        },
                        {
                            _id:"Rohit",
                            name:"Rohit",
                            cityid:{_id:"hisar", $set:{city:"hisar"}}
                        }
                    ]

                }
            ];
            db.batchUpdateById(batchUpdates, function (err, res) {
                if (err) {
                    done(err);
                    return;
                }
                db.query({$collection:"cities", $sort:{city:1}}, function (err, cities) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log("cities >>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(cities));
                    var batchUpdates = [
                        {
                            $collection:{collection:"cities", referredfks:[
                                {collectionid:{collection:"persons"}, field:"cityid", set:["city"]}
                            ]},
                            $update:[
                                {
                                    _id:cities.result[0]._id,
                                    $set:{city:""}
                                } ,
                                {
                                    _id:cities.result[1]._id,
                                    $set:{city:"sirsa1"}
                                }
                            ]

                        }
                    ];
                    db.batchUpdateById(batchUpdates, function (err, res) {
                        if (err) {
                            done(err);
                            return;
                        }
                        db.query({$collection:"cities", $sort:{city:1}}, function (err, cities) {
                            if (err) {
                                done(err);
                                return;
                            }
                            expect(cities.result).to.have.length(2);
                            expect(cities.result[0].city).to.eql("");
                            expect(cities.result[1].city).to.eql("sirsa1");
                            db.query({$collection:"persons", $sort:{name:1}}, function (err, persons) {
                                if (err) {
                                    done(err);
                                    return;
                                }
                                console.log("Persons >>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(persons));
                                expect(persons.result).to.have.length(3);
                                expect(persons.result[0].name).to.eql("Pawan");
                                expect(persons.result[1].name).to.eql("Rohit");
                                expect(persons.result[2].name).to.eql("Sachin");
                                expect(persons.result[0].cityid.city).to.eql("sirsa1");
                                expect(persons.result[1].cityid.city).to.eql("");
                                expect(persons.result[2].cityid.city).to.eql("");
                                done();
                            })
                        })
                    })
                })
            })
        })
    })

    it("simple fk column with two values in set", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
            if (err) {
                done(err);
                return;
            }

            var batchUpdates = [
                {
                    $collection:{collection:"persons", fields:[
                        {field:"cityid", type:"fk", collection:"cities", upsert:true, set:["city", "code"]}
                    ]},
                    $insert:[
                        {
                            _id:"Sachin",
                            name:"Sachin",
                            cityid:{_id:"hisar", $set:{city:"hisar", code:1662}}
                        },
                        {
                            _id:"Pawan",
                            name:"Pawan",
                            cityid:{_id:"sirsa", $set:{city:"sirsa", code:1665}}
                        },
                        {
                            _id:"Rohit",
                            name:"Rohit",
                            cityid:{_id:"hisar", $set:{city:"hisar", code:1662}}
                        }
                    ]

                }
            ];
            db.batchUpdateById(batchUpdates, function (err, res) {
                if (err) {
                    done(err);
                    return;
                }
                db.query({$collection:"cities", $sort:{city:1}}, function (err, cities) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log("cities >>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(cities));
                    var batchUpdates = [
                        {
                            $collection:{collection:"cities", referredfks:[
                                {collectionid:{collection:"persons"}, field:"cityid", set:["city", "code"]}
                            ]},
                            $update:[
                                {
                                    _id:cities.result[0]._id,
                                    $set:{city:"hisar1", code:1663}
                                } ,
                                {
                                    _id:cities.result[1]._id,
                                    $set:{city:"sirsa1", code:1666}
                                }
                            ]

                        }
                    ];
                    db.batchUpdateById(batchUpdates, function (err, res) {
                        if (err) {
                            done(err);
                            return;
                        }
                        db.query({$collection:"cities", $sort:{city:1}}, function (err, cities) {
                            if (err) {
                                done(err);
                                return;
                            }
                            expect(cities.result).to.have.length(2);
                            expect(cities.result[0].city).to.eql("hisar1");
                            expect(cities.result[0].code).to.eql(1663);
                            expect(cities.result[1].city).to.eql("sirsa1");
                            expect(cities.result[1].code).to.eql(1666);
                            db.query({$collection:"persons", $sort:{name:1}}, function (err, persons) {
                                if (err) {
                                    done(err);
                                    return;
                                }
                                console.log("Persons >>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(persons));
                                expect(persons.result).to.have.length(3);
                                expect(persons.result[0].name).to.eql("Pawan");
                                expect(persons.result[1].name).to.eql("Rohit");
                                expect(persons.result[2].name).to.eql("Sachin");
                                expect(persons.result[0].cityid.city).to.eql("sirsa1");
                                expect(persons.result[0].cityid.code).to.eql(1666);
                                expect(persons.result[1].cityid.city).to.eql("hisar1");
                                expect(persons.result[1].cityid.code).to.eql(1663);
                                expect(persons.result[2].cityid.city).to.eql("hisar1");
                                expect(persons.result[2].cityid.code).to.eql(1663);
                                done();
                            })
                        })
                    })
                })
            })
        })
    })

    it("miltiple fk column", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
            if (err) {
                done(err);
                return;
            }

            var batchUpdates = [
                {
                    $collection:{collection:"persons", fields:[
                        {field:"cityid", type:"fk", multiple:true, collection:"cities", upsert:true, set:["city"]}
                    ]},
                    $insert:[
                        {
                            _id:"Sachin",
                            name:"Sachin",
                            cityid:[
                                {_id:"hisar", $set:{city:"hisar"}},
                                {_id:"sirsa", $set:{city:"sirsa"}}
                            ]
                        },
                        {
                            _id:"Pawan",
                            name:"Pawan",
                            cityid:[
                                {_id:"sirsa", $set:{city:"sirsa"}}
                            ]
                        },
                        {
                            _id:"Rohit",
                            name:"Rohit",
                            cityid:[
                                {_id:"hisar", $set:{city:"hisar"}}
                            ]
                        }
                    ]

                }
            ];
            db.batchUpdateById(batchUpdates, function (err, res) {
                if (err) {
                    done(err);
                    return;
                }
                db.query({$collection:"cities", $sort:{city:1}}, function (err, cities) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log("cities >>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(cities));
                    var batchUpdates = [
                        {
                            $collection:{collection:"cities", referredfks:[
                                {collectionid:{collection:"persons"}, field:"cityid.$", set:["city"]}
                            ]},
                            $update:[
                                {
                                    _id:cities.result[0]._id,
                                    $set:{city:"hisar1"}
                                } ,
                                {
                                    _id:cities.result[1]._id,
                                    $set:{city:"sirsa1"}
                                }
                            ]

                        }
                    ];
                    db.batchUpdateById(batchUpdates, function (err, res) {
                        if (err) {
                            done(err);
                            return;
                        }
                        db.query({$collection:"cities", $sort:{city:1}}, function (err, cities) {
                            if (err) {
                                done(err);
                                return;
                            }
                            expect(cities.result).to.have.length(2);
                            expect(cities.result[0].city).to.eql("hisar1");
                            expect(cities.result[1].city).to.eql("sirsa1");
                            db.query({$collection:"persons", $sort:{name:1}}, function (err, persons) {
                                if (err) {
                                    done(err);
                                    return;
                                }
                                console.log("Persons >>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(persons));
                                expect(persons.result).to.have.length(3);
                                expect(persons.result[0].name).to.eql("Pawan");
                                expect(persons.result[1].name).to.eql("Rohit");
                                expect(persons.result[2].name).to.eql("Sachin");
                                expect(persons.result[0].cityid).to.have.length(1);
                                expect(persons.result[0].cityid[0].city).to.eql("sirsa1");
                                expect(persons.result[1].cityid).to.have.length(1);
                                expect(persons.result[1].cityid[0].city).to.eql("hisar1");
                                expect(persons.result[2].cityid).to.have.length(2);
                                expect(persons.result[2].cityid[0].city).to.eql("hisar1");
                                expect(persons.result[2].cityid[1].city).to.eql("sirsa1");
                                done();
                            })
                        })
                    })
                })
            })
        })
    })

    it("fk column in object single", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
            if (err) {
                done(err);
                return;
            }

            var batchUpdates = [
                {
                    $collection:{collection:"persons", fields:[
                        {field:"address", type:"object", fields:[
                            {field:"cityid", type:"fk", collection:"cities", upsert:true, set:["city"]}
                        ]}
                    ]},
                    $insert:[
                        {
                            _id:"Sachin",
                            name:"Sachin",
                            address:{address:"1234", cityid:{_id:"hisar", $set:{city:"hisar"}}}
                        },
                        {
                            _id:"Pawan",
                            name:"Pawan",
                            address:{address:"212", cityid:{_id:"sirsa", $set:{city:"sirsa"}}}

                        },
                        {
                            _id:"Rohit",
                            name:"Rohit",
                            address:{address:"23123", cityid:{_id:"hisar", $set:{city:"hisar"}}}
                        }
                    ]

                }
            ];
            db.batchUpdateById(batchUpdates, function (err, res) {
                if (err) {
                    done(err);
                    return;
                }
                db.query({$collection:"cities", $sort:{city:1}}, function (err, cities) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log("cities >>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(cities));
                    var batchUpdates = [
                        {
                            $collection:{collection:"cities", referredfks:[
                                {collectionid:{collection:"persons"}, field:"address.cityid", set:["city"]}
                            ]},
                            $update:[
                                {
                                    _id:cities.result[0]._id,
                                    $set:{city:"hisar1"}
                                } ,
                                {
                                    _id:cities.result[1]._id,
                                    $set:{city:"sirsa1"}
                                }
                            ]

                        }
                    ];
                    db.batchUpdateById(batchUpdates, function (err, res) {
                        if (err) {
                            done(err);
                            return;
                        }
                        db.query({$collection:"cities", $sort:{city:1}}, function (err, cities) {
                            if (err) {
                                done(err);
                                return;
                            }
                            expect(cities.result).to.have.length(2);
                            expect(cities.result[0].city).to.eql("hisar1");
                            expect(cities.result[1].city).to.eql("sirsa1");
                            db.query({$collection:"persons", $sort:{name:1}}, function (err, persons) {
                                if (err) {
                                    done(err);
                                    return;
                                }
                                console.log("Persons >>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(persons));
                                expect(persons.result).to.have.length(3);
                                expect(persons.result[0].name).to.eql("Pawan");
                                expect(persons.result[1].name).to.eql("Rohit");
                                expect(persons.result[2].name).to.eql("Sachin");
                                expect(persons.result[0].address.cityid.city).to.eql("sirsa1");
                                expect(persons.result[1].address.cityid.city).to.eql("hisar1");
                                expect(persons.result[2].address.cityid.city).to.eql("hisar1");
                                done();
                            })
                        })
                    })
                })
            })
        })
    })

    it("fk column in object multiple", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
            if (err) {
                done(err);
                return;
            }

            var batchUpdates = [
                {
                    $collection:{collection:"persons", fields:[
                        {field:"address", type:"object", multiple:true, fields:[
                            {field:"cityid", type:"fk", collection:"cities", upsert:true, set:["city"]}
                        ]}
                    ]},
                    $insert:[
                        {
                            _id:"Sachin",
                            name:"Sachin",
                            address:[
                                {address:"1234", cityid:{_id:"hisar", $set:{city:"hisar"}}},
                                {address:"2132", cityid:{_id:"sirsa", $set:{city:"sirsa"}}} ,
                                {address:"213211", cityid:{_id:"hisar", $set:{city:"hisar"}}}
                            ]
                        },
                        {
                            _id:"Pawan",
                            name:"Pawan",
                            address:[
                                {address:"212", cityid:{_id:"sirsa", $set:{city:"sirsa"}}}
                            ]

                        },
                        {
                            _id:"Rohit",
                            name:"Rohit",
                            address:[
                                {address:"23123", cityid:{_id:"hisar", $set:{city:"hisar"}}}
                            ]
                        }
                    ]

                }
            ];
            db.batchUpdateById(batchUpdates, function (err, res) {
                if (err) {
                    done(err);
                    return;
                }
                db.query({$collection:"cities", $sort:{city:1}}, function (err, cities) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log("cities >>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(cities));
                    var batchUpdates = [
                        {
                            $collection:{collection:"cities", referredfks:[
                                {collectionid:{collection:"persons"}, field:"address.$.cityid", set:["city"]}
                            ]},
                            $update:[
                                {
                                    _id:cities.result[0]._id,
                                    $set:{city:"hisar1"}
                                } ,
                                {
                                    _id:cities.result[1]._id,
                                    $set:{city:"sirsa1"}
                                }
                            ]

                        }
                    ];
                    db.batchUpdateById(batchUpdates, function (err, res) {
                        if (err) {
                            done(err);
                            return;
                        }
                        db.query({$collection:"cities", $sort:{city:1}}, function (err, cities) {
                            if (err) {
                                done(err);
                                return;
                            }
                            expect(cities.result).to.have.length(2);
                            expect(cities.result[0].city).to.eql("hisar1");
                            expect(cities.result[1].city).to.eql("sirsa1");
                            db.query({$collection:"persons", $sort:{name:1}}, function (err, persons) {
                                if (err) {
                                    done(err);
                                    return;
                                }
                                console.log("Persons >>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(persons));
                                expect(persons.result).to.have.length(3);
                                expect(persons.result[0].name).to.eql("Pawan");
                                expect(persons.result[1].name).to.eql("Rohit");
                                expect(persons.result[2].name).to.eql("Sachin");
                                expect(persons.result[0].address).to.have.length(1);
                                expect(persons.result[0].address[0].cityid.city).to.eql("sirsa1");
                                expect(persons.result[1].address).to.have.length(1);
                                expect(persons.result[1].address[0].cityid.city).to.eql("hisar1");
                                expect(persons.result[2].address).to.have.length(3);
                                expect(persons.result[2].address[0].cityid.city).to.eql("hisar1");
                                expect(persons.result[2].address[1].cityid.city).to.eql("sirsa1");
                                expect(persons.result[2].address[2].cityid.city).to.eql("hisar1");
                                done();
                            })
                        })
                    })
                })
            })
        })
    })

    it("multiple fk column in object multiple", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
            if (err) {
                done(err);
                return;
            }

            var batchUpdates = [
                {
                    $collection:{collection:"persons", fields:[
                        {field:"address", type:"object", multiple:true, fields:[
                            {field:"cityid", type:"fk", multiple:true, collection:"cities", upsert:true, set:["city"]}
                        ]}
                    ]},
                    $insert:[
                        {
                            _id:"Sachin",
                            name:"Sachin",
                            address:[
                                {address:"1234", cityid:[
                                    {_id:"hisar", $set:{city:"hisar"}},
                                    {_id:"sirsa", $set:{city:"sirsa"}}
                                ]},
                                {address:"2132", cityid:[
                                    {_id:"sirsa", $set:{city:"sirsa"}}
                                ]} ,
                                {address:"213211", cityid:[
                                    {_id:"hisar", $set:{city:"hisar"}}
                                ]}
                            ]
                        },
                        {
                            _id:"Pawan",
                            name:"Pawan",
                            address:[
                                {address:"212", cityid:[
                                    {_id:"sirsa", $set:{city:"sirsa"}},
                                    {_id:"hisar", $set:{city:"hisar"}}
                                ]}
                            ]

                        },
                        {
                            _id:"Rohit",
                            name:"Rohit",
                            address:[
                                {address:"23123", cityid:[
                                    {_id:"hisar", $set:{city:"hisar"}}
                                ]}
                            ]
                        }
                    ]

                }
            ];
            db.batchUpdateById(batchUpdates, function (err, res) {
                if (err) {
                    done(err);
                    return;
                }
                db.query({$collection:"cities", $sort:{city:1}}, function (err, cities) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log("cities >>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(cities));
                    var batchUpdates = [
                        {
                            $collection:{collection:"cities", referredfks:[
                                {collectionid:{collection:"persons"}, field:"address.$.cityid.$", set:["city"]}
                            ]},
                            $update:[
                                {
                                    _id:cities.result[0]._id,
                                    $set:{city:"hisar1"}
                                } ,
                                {
                                    _id:cities.result[1]._id,
                                    $set:{city:"sirsa1"}
                                }
                            ]

                        }
                    ];
                    db.batchUpdateById(batchUpdates, function (err, res) {
                        if (err) {
                            done(err);
                            return;
                        }
                        db.query({$collection:"cities", $sort:{city:1}}, function (err, cities) {
                            if (err) {
                                done(err);
                                return;
                            }
                            expect(cities.result).to.have.length(2);
                            expect(cities.result[0].city).to.eql("hisar1");
                            expect(cities.result[1].city).to.eql("sirsa1");
                            db.query({$collection:"persons", $sort:{name:1}}, function (err, persons) {
                                if (err) {
                                    done(err);
                                    return;
                                }
                                console.log("Persons >>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(persons));
                                expect(persons.result).to.have.length(3);
                                expect(persons.result[0].name).to.eql("Pawan");
                                expect(persons.result[1].name).to.eql("Rohit");
                                expect(persons.result[2].name).to.eql("Sachin");
                                expect(persons.result[0].address).to.have.length(1);
                                expect(persons.result[0].address[0].cityid).to.have.length(2);
                                expect(persons.result[0].address[0].cityid[0].city).to.eql("sirsa1");
                                expect(persons.result[0].address[0].cityid[1].city).to.eql("hisar1");
                                expect(persons.result[1].address).to.have.length(1);
                                expect(persons.result[1].address[0].cityid).to.have.length(1);
                                expect(persons.result[1].address[0].cityid[0].city).to.eql("hisar1");
                                expect(persons.result[2].address).to.have.length(3);
                                expect(persons.result[2].address[0].cityid).to.have.length(2);
                                expect(persons.result[2].address[0].cityid[0].city).to.eql("hisar1");
                                expect(persons.result[2].address[0].cityid[1].city).to.eql("sirsa1");
                                expect(persons.result[2].address[1].cityid).to.have.length(1);
                                expect(persons.result[2].address[1].cityid[0].city).to.eql("sirsa1");
                                expect(persons.result[2].address[2].cityid).to.have.length(1);
                                expect(persons.result[2].address[2].cityid[0].city).to.eql("hisar1");
                                done();
                            })
                        })
                    })
                })
            })
        })
    })

    it("fk column in Two level multiple", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
            if (err) {
                done(err);
                return;
            }

            var batchUpdates = [
                {
                    $collection:{collection:"persons", fields:[
                        {field:"schools", type:"object", multiple:true, fields:[
                            {field:"address", type:"object", multiple:true, fields:[
                                {field:"cityid", type:"fk", collection:"cities", upsert:true, set:["city"]}
                            ]}
                        ]}
                    ]},
                    $insert:[
                        {
                            _id:"Sachin",
                            name:"Sachin",
                            schools:[
                                {name:"S", address:[
                                    {address:"1234", cityid:{_id:"hisar", $set:{city:"hisar"}}},
                                    {address:"2132", cityid:{_id:"sirsa", $set:{city:"sirsa"}}} ,
                                    {address:"213211", cityid:{_id:"hisar", $set:{city:"hisar"}}}
                                ]}
                            ]
                        },
                        {
                            _id:"Pawan",
                            name:"Pawan",
                            schools:[
                                {name:"P", address:[
                                    {address:"212", cityid:{_id:"sirsa", $set:{city:"sirsa"}}}
                                ]}
                            ]

                        },
                        {
                            _id:"Rohit",
                            name:"Rohit",
                            schools:[
                                {name:"R", address:[
                                    {address:"23123", cityid:{_id:"hisar", $set:{city:"hisar"}}}
                                ]}
                            ]

                        }
                    ]

                }
            ];
            db.batchUpdateById(batchUpdates, function (err, res) {
                if (err) {
                    done(err);
                    return;
                }
                db.query({$collection:"cities", $sort:{city:1}}, function (err, cities) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log("cities >>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(cities));
                    var batchUpdates = [
                        {
                            $collection:{collection:"cities", referredfks:[
                                {collectionid:{collection:"persons"}, field:"schools.$.address.$.cityid", set:["city"]}
                            ]},
                            $update:[
                                {
                                    _id:cities.result[0]._id,
                                    $set:{city:"hisar1"}
                                } ,
                                {
                                    _id:cities.result[1]._id,
                                    $set:{city:"sirsa1"}
                                }
                            ]

                        }
                    ];
                    db.batchUpdateById(batchUpdates, function (err, res) {
                        if (err) {
                            done(err);
                            return;
                        }
                        db.query({$collection:"cities", $sort:{city:1}}, function (err, cities) {
                            if (err) {
                                done(err);
                                return;
                            }
                            expect(cities.result).to.have.length(2);
                            expect(cities.result[0].city).to.eql("hisar1");
                            expect(cities.result[1].city).to.eql("sirsa1");
                            db.query({$collection:"persons", $sort:{name:1}}, function (err, persons) {
                                if (err) {
                                    done(err);
                                    return;
                                }
                                console.log("Persons >>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(persons));
                                expect(persons.result).to.have.length(3);
                                expect(persons.result[0].name).to.eql("Pawan");
                                expect(persons.result[1].name).to.eql("Rohit");
                                expect(persons.result[2].name).to.eql("Sachin");
                                expect(persons.result[0].schools).to.have.length(1);
                                expect(persons.result[0].schools[0].address).to.have.length(1);
                                expect(persons.result[0].schools[0].address[0].cityid.city).to.eql("sirsa1");
                                expect(persons.result[1].schools).to.have.length(1);
                                expect(persons.result[1].schools[0].address).to.have.length(1);
                                expect(persons.result[1].schools[0].address[0].cityid.city).to.eql("hisar1");
                                expect(persons.result[2].schools).to.have.length(1);
                                expect(persons.result[2].schools[0].address).to.have.length(3);
                                expect(persons.result[2].schools[0].address[0].cityid.city).to.eql("hisar1");
                                expect(persons.result[2].schools[0].address[1].cityid.city).to.eql("sirsa1");
                                expect(persons.result[2].schools[0].address[2].cityid.city).to.eql("hisar1");
                                done();
                            })
                        })
                    })
                })
            })
        })
    })

    it("multiple fk column in Two level multiple", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
            if (err) {
                done(err);
                return;
            }

            var batchUpdates = [
                {
                    $collection:{collection:"persons", fields:[
                        {field:"schools", type:"object", multiple:true, fields:[
                            {field:"address", type:"object", multiple:true, fields:[
                                {field:"cityid", type:"fk", collection:"cities", multiple:true, upsert:true, set:["city"]}
                            ]}
                        ]}
                    ]},
                    $insert:[
                        {
                            _id:"Sachin",
                            name:"Sachin",
                            schools:[
                                {name:"S", address:[
                                    {address:"1234", cityid:[
                                        {_id:"hisar", $set:{city:"hisar", code:1662}},
                                        {_id:"sirsa", $set:{city:"sirsa", code:1663}}
                                    ]},
                                    {address:"2132", cityid:[
                                        {_id:"sirsa", $set:{city:"sirsa", code:1663}}
                                    ]} ,
                                    {address:"213211", cityid:[
                                        {_id:"hisar", $set:{city:"hisar", code:1662}}
                                    ]}
                                ]}
                            ]
                        },
                        {
                            _id:"Pawan",
                            name:"Pawan",
                            schools:[
                                {name:"P", address:[
                                    {address:"212", cityid:[
                                        {_id:"sirsa", $set:{city:"sirsa", code:1663}},
                                        {_id:"hisar", $set:{city:"hisar", code:1662}}
                                    ]}
                                ]}
                            ]

                        },
                        {
                            _id:"Rohit",
                            name:"Rohit",
                            schools:[
                                {name:"R", address:[
                                    {address:"23123", cityid:[
                                        {_id:"hisar", $set:{city:"hisar", code:1662}}
                                    ]}
                                ]}
                            ]

                        }
                    ]

                }
            ];
            db.batchUpdateById(batchUpdates, function (err, res) {
                if (err) {
                    done(err);
                    return;
                }
                db.query({$collection:"cities", $sort:{city:1}}, function (err, cities) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log("cities >>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(cities));
                    var batchUpdates = [
                        {
                            $collection:{collection:"cities", referredfks:[
                                {collectionid:{collection:"persons"}, field:"schools.$.address.$.cityid.$", set:["city", "code"]}
                            ]},
                            $update:[
                                {
                                    _id:cities.result[0]._id,
                                    $set:{city:"hisar1", code:1664}
                                } ,
                                {
                                    _id:cities.result[1]._id,
                                    $set:{city:"sirsa1", code:1665}
                                }
                            ]

                        }
                    ];
                    db.batchUpdateById(batchUpdates, function (err, res) {
                        if (err) {
                            done(err);
                            return;
                        }
                        db.query({$collection:"cities", $sort:{city:1}}, function (err, cities) {
                            if (err) {
                                done(err);
                                return;
                            }
                            expect(cities.result).to.have.length(2);
                            expect(cities.result[0].city).to.eql("hisar1");
                            expect(cities.result[1].city).to.eql("sirsa1");
                            expect(cities.result[0].code).to.eql(1664);
                            expect(cities.result[1].code).to.eql(1665);
                            db.query({$collection:"persons", $sort:{name:1}}, function (err, persons) {
                                if (err) {
                                    done(err);
                                    return;
                                }
                                console.log("Persons >>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(persons));
                                expect(persons.result).to.have.length(3);
                                expect(persons.result[0].name).to.eql("Pawan");
                                expect(persons.result[1].name).to.eql("Rohit");
                                expect(persons.result[2].name).to.eql("Sachin");
                                expect(persons.result[0].schools).to.have.length(1);
                                expect(persons.result[0].schools[0].address).to.have.length(1);
                                expect(persons.result[0].schools[0].address[0].cityid).to.have.length(2);
                                expect(persons.result[0].schools[0].address[0].cityid[0].city).to.eql("sirsa1");
                                expect(persons.result[0].schools[0].address[0].cityid[0].code).to.eql(1665);
                                expect(persons.result[0].schools[0].address[0].cityid[1].city).to.eql("hisar1");
                                expect(persons.result[0].schools[0].address[0].cityid[1].code).to.eql(1664);
                                expect(persons.result[1].schools).to.have.length(1);
                                expect(persons.result[1].schools[0].address).to.have.length(1);
                                expect(persons.result[1].schools[0].address[0].cityid).to.have.length(1);
                                expect(persons.result[1].schools[0].address[0].cityid[0].city).to.eql("hisar1");
                                expect(persons.result[1].schools[0].address[0].cityid[0].code).to.eql(1664);
                                expect(persons.result[2].schools).to.have.length(1);
                                expect(persons.result[2].schools[0].address).to.have.length(3);
                                expect(persons.result[2].schools[0].address[0].cityid).to.have.length(2);
                                expect(persons.result[2].schools[0].address[0].cityid[0].city).to.eql("hisar1");
                                expect(persons.result[2].schools[0].address[0].cityid[0].code).to.eql(1664);
                                expect(persons.result[2].schools[0].address[0].cityid[1].city).to.eql("sirsa1");
                                expect(persons.result[2].schools[0].address[0].cityid[1].code).to.eql(1665);
                                expect(persons.result[2].schools[0].address[1].cityid).to.have.length(1);
                                expect(persons.result[2].schools[0].address[1].cityid[0].city).to.eql("sirsa1");
                                expect(persons.result[2].schools[0].address[1].cityid[0].code).to.eql(1665);
                                expect(persons.result[2].schools[0].address[2].cityid).to.have.length(1);
                                expect(persons.result[2].schools[0].address[2].cityid[0].city).to.eql("hisar1");
                                expect(persons.result[2].schools[0].address[2].cityid[0].code).to.eql(1664);
                                done();
                            })
                        })
                    })
                })
            })
        })
    })

    it("simple fk column with multiple or dotted values in set", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
            if (err) {
                done(err);
                return;
            }

            var batchUpdates = [
                {
                    $collection:{collection:"persons", fields:[
                        {field:"cityid", type:"fk", collection:"cities", upsert:true}
                    ]},
                    $insert:[
                        {
                            _id:"Sachin",
                            name:"Sachin",
                            cityid:{_id:"hisar", $set:{city:"hisar", code:1662}}
                        },
                        {
                            _id:"Pawan",
                            name:"Pawan",
                            cityid:{_id:"sirsa", $set:{city:"sirsa", code:1665}}
                        },
                        {
                            _id:"Rohit",
                            name:"Rohit",
                            cityid:{_id:"hisar", $set:{city:"hisar", code:1662}}
                        }
                    ]

                },
                {
                    $collection:{collection:"students", fields:[
                        {field:"personid", type:"fk", collection:{collection:"persons", fields:[
                            {field:"cityid", type:"fk", collection:"cities", upsert:true}
                        ]}, upsert:true, set:["name", "cityid.city", "cityid.code"]}
                    ]},
                    $insert:[
                        {
                            _id:"Sachin",
                            name:"Sachin",
                            personid:{_id:"Sachin"}
                        },
                        {
                            _id:"Pawan",
                            name:"Pawan",
                            personid:{_id:"Pawan"}
                        },
                        {
                            _id:"Rohit",
                            name:"Rohit",
                            personid:{_id:"Rohit"}
                        }
                    ]

                }
            ];
            db.batchUpdateById(batchUpdates, function (err, res) {
                if (err) {
                    done(err);
                    return;
                }
                db.query({$collection:"cities", $sort:{city:1}}, function (err, cities) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log("cities >>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(cities));
                    var batchUpdates = [
                        {
                            $collection:{collection:"cities", referredfks:[
                                {collectionid:{collection:"students"}, field:"personid.cityid", set:["city", "code"]}
                            ]},
                            $update:[
                                {
                                    _id:cities.result[0]._id,
                                    $set:{city:"hisar1", code:1670}
                                } ,
                                {
                                    _id:cities.result[1]._id,
                                    $set:{city:"sirsa1", code:1671}
                                }
                            ]

                        }
                    ];
                    db.batchUpdateById(batchUpdates, function (err, res) {
                        if (err) {
                            done(err);
                            return;
                        }
                        db.query({$collection:"cities", $sort:{city:1}}, function (err, cities) {
                            if (err) {
                                done(err);
                                return;
                            }
                            expect(cities.result).to.have.length(2);
                            expect(cities.result[0].city).to.eql("hisar1");
                            expect(cities.result[0].code).to.eql(1670);
                            expect(cities.result[1].city).to.eql("sirsa1");
                            expect(cities.result[1].code).to.eql(1671);
                            db.query({$collection:"students", $sort:{name:1}}, function (err, students) {
                                if (err) {
                                    done(err);
                                    return;
                                }
                                console.log("students >>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(students));
                                expect(students.result).to.have.length(3);
                                expect(students.result[0].name).to.eql("Pawan");
                                expect(students.result[1].name).to.eql("Rohit");
                                expect(students.result[2].name).to.eql("Sachin");
                                expect(students.result[0].personid.cityid.city).to.eql("sirsa1");
                                expect(students.result[0].personid.cityid.code).to.eql(1671);
                                expect(students.result[1].personid.cityid.city).to.eql("hisar1");
                                expect(students.result[1].personid.cityid.code).to.eql(1670);
                                expect(students.result[2].personid.cityid.city).to.eql("hisar1");
                                expect(students.result[2].personid.cityid.code).to.eql(1670);
                                done();
                            })
                        })
                    })
                })
            })
        })
    })

    it("multiple fk column with multiple or dotted values in set", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
            if (err) {
                done(err);
                return;
            }

            var batchUpdates = [
                {
                    $collection:{collection:"persons", fields:[
                        {field:"cityid", type:"fk", multiple:true, collection:"cities", upsert:true}
                    ]},
                    $insert:[
                        {
                            _id:"Sachin",
                            name:"Sachin",
                            cityid:[
                                {_id:"hisar", $set:{city:"hisar"}}
                            ]
                        },
                        {
                            _id:"Pawan",
                            name:"Pawan",
                            cityid:[
                                {_id:"sirsa", $set:{city:"sirsa"}}
                            ]
                        },
                        {
                            _id:"Rohit",
                            name:"Rohit",
                            cityid:[
                                {_id:"hisar", $set:{city:"hisar"}}
                            ]
                        }
                    ]

                },
                {
                    $collection:{collection:"students", fields:[
                        {field:"personid", type:"fk", multiple:true, collection:{collection:"persons", fields:[
                            {field:"cityid", type:"fk", multiple:true, collection:"cities", upsert:true}
                        ]}, upsert:true, set:["name", "cityid.city"]}
                    ]},
                    $insert:[
                        {
                            _id:"Sachin",
                            name:"Sachin",
                            personid:[
                                {_id:"Sachin"}
                            ]
                        },
                        {
                            _id:"Pawan",
                            name:"Pawan",
                            personid:[
                                {_id:"Pawan"}
                            ]
                        },
                        {
                            _id:"Rohit",
                            name:"Rohit",
                            personid:[
                                {_id:"Rohit"}
                            ]
                        }
                    ]

                }
            ];
            db.batchUpdateById(batchUpdates, function (err, res) {
                if (err) {
                    done(err);
                    return;
                }
                db.query({$collection:"cities", $sort:{city:1}}, function (err, cities) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log("cities >>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(cities));
                    var batchUpdates = [
                        {
                            $collection:{collection:"cities", referredfks:[
                                {collectionid:{collection:"students"}, field:"personid.$.cityid.$", set:["city"]}
                            ]},
                            $update:[
                                {
                                    _id:cities.result[0]._id,
                                    $set:{city:"hisar1"}
                                } ,
                                {
                                    _id:cities.result[1]._id,
                                    $set:{city:"sirsa1"}
                                }
                            ]

                        }
                    ];
                    db.batchUpdateById(batchUpdates, function (err, res) {
                        if (err) {
                            done(err);
                            return;
                        }
                        db.query({$collection:"cities", $sort:{city:1}}, function (err, cities) {
                            if (err) {
                                done(err);
                                return;
                            }
                            expect(cities.result).to.have.length(2);
                            expect(cities.result[0].city).to.eql("hisar1");
                            expect(cities.result[1].city).to.eql("sirsa1");
                            db.query({$collection:"students", $sort:{name:1}}, function (err, students) {
                                if (err) {
                                    done(err);
                                    return;
                                }
                                console.log("students >>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(students));
                                expect(students.result).to.have.length(3);
                                expect(students.result[0].name).to.eql("Pawan");
                                expect(students.result[1].name).to.eql("Rohit");
                                expect(students.result[2].name).to.eql("Sachin");
                                expect(students.result[0].personid).to.have.length(1);
                                expect(students.result[0].personid[0].cityid).to.have.length(1);
                                expect(students.result[0].personid[0].cityid[0].city).to.eql("sirsa1");
                                expect(students.result[1].personid).to.have.length(1);
                                expect(students.result[1].personid[0].cityid).to.have.length(1);
                                expect(students.result[1].personid[0].cityid[0].city).to.eql("hisar1");
                                expect(students.result[2].personid).to.have.length(1);
                                expect(students.result[2].personid[0].cityid).to.have.length(1);
                                expect(students.result[2].personid[0].cityid[0].city).to.eql("hisar1");
                                done();
                            })
                        })
                    })
                })
            })
        })
    })

    it("fk column with Three level state,countries and cities multiple or dotted push", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, OPTIONS, function (err, db) {
            if (err) {
                done(err);
                return;
            }

            var batchUpdates = [
                {
                    $collection:{collection:"persons", fields:[
                        {field:"cityid", type:"fk", multiple:true, collection:"cities", upsert:true}
                    ]},
                    $insert:[
                        {
                            _id:"Sachin",
                            name:"Sachin",
                            cityid:[
                                {_id:"hisar", $set:{city:"hisar"}}
                            ]
                        },
                        {
                            _id:"Pawan",
                            name:"Pawan",
                            cityid:[
                                {_id:"sirsa", $set:{city:"sirsa"}}
                            ]
                        },
                        {
                            _id:"Rohit",
                            name:"Rohit",
                            cityid:[
                                {_id:"hisar", $set:{city:"hisar"}}
                            ]
                        }
                    ]

                },
                {
                    $collection:{collection:"students", fields:[
                        {field:"personid", type:"fk", multiple:true, collection:{collection:"persons", fields:[
                            {field:"cityid", type:"fk", multiple:true, collection:"cities", upsert:true}
                        ]}, upsert:true, set:["name", "cityid.city"]}
                    ]},
                    $insert:[
                        {
                            _id:"Sachin",
                            name:"Sachin",
                            personid:[
                                {_id:"Sachin"}
                            ]
                        },
                        {
                            _id:"Pawan",
                            name:"Pawan",
                            personid:[
                                {_id:"Pawan"}
                            ]
                        },
                        {
                            _id:"Rohit",
                            name:"Rohit",
                            personid:[
                                {_id:"Rohit"}
                            ]
                        }
                    ]

                }
            ];
            db.batchUpdateById(batchUpdates, function (err, res) {
                if (err) {
                    done(err);
                    return;
                }
                db.query({$collection:"cities", $sort:{city:1}}, function (err, cities) {
                    if (err) {
                        done(err);
                        return;
                    }
                    console.log("cities >>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(cities));
                    var batchUpdates = [
                        {
                            $collection:{collection:"cities", referredfks:[
                                {collectionid:{collection:"students"}, field:"personid.$.cityid.$", set:["city"]}
                            ]},
                            $update:[
                                {
                                    _id:cities.result[0]._id,
                                    $set:{city:"hisar1"}
                                } ,
                                {
                                    _id:cities.result[1]._id,
                                    $set:{city:"sirsa1"}
                                }
                            ]

                        }
                    ];
                    db.batchUpdateById(batchUpdates, function (err, res) {
                        if (err) {
                            done(err);
                            return;
                        }
                        db.query({$collection:"cities", $sort:{city:1}}, function (err, cities) {
                            if (err) {
                                done(err);
                                return;
                            }
                            expect(cities.result).to.have.length(2);
                            expect(cities.result[0].city).to.eql("hisar1");
                            expect(cities.result[1].city).to.eql("sirsa1");
                            db.query({$collection:"students", $sort:{name:1}}, function (err, students) {
                                if (err) {
                                    done(err);
                                    return;
                                }
                                console.log("students >>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(students));
                                expect(students.result).to.have.length(3);
                                expect(students.result[0].name).to.eql("Pawan");
                                expect(students.result[1].name).to.eql("Rohit");
                                expect(students.result[2].name).to.eql("Sachin");
                                expect(students.result[0].personid).to.have.length(1);
                                expect(students.result[0].personid[0].cityid).to.have.length(1);
                                expect(students.result[0].personid[0].cityid[0].city).to.eql("sirsa1");
                                expect(students.result[1].personid).to.have.length(1);
                                expect(students.result[1].personid[0].cityid).to.have.length(1);
                                expect(students.result[1].personid[0].cityid[0].city).to.eql("hisar1");
                                expect(students.result[2].personid).to.have.length(1);
                                expect(students.result[2].personid[0].cityid).to.have.length(1);
                                expect(students.result[2].personid[0].cityid[0].city).to.eql("hisar1");
                                done();
                            })
                        })
                    })
                })
            })
        })
    })
})
