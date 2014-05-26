//var expect = require('chai').expect;
//var ApplaneDB = require("ApplaneDB");
//var Config = require("./config.js");
//
//describe("Role", function () {
//
//    it("Create role to restrict data.", function () {
//
//        var employees = [
//            {_id:"Yogesh", employee:"Yogesh"},
//            {_id:"Pawan", employee:"Pawan", reportto:"Yogesh", reportto_temp:["Yogesh"]},
//            {_id:"Rohit", employee:"Rohit", reportto:"Yogesh", reportto_temp:["Yogesh"]},
//            {_id:"Sachin", employee:"Sachin", reportto:"Pawan", reportto_temp:["Yogesh", "Pawan"]},
//            {_id:"Manjeet", employee:"Manjeet", reportto:"Pawan", reportto_temp:["Yogesh", "Pawan"]},
//            {_id:"Ashish", employee:"Ashish", reportto:"Rohit", reportto_temp:["Yogesh", "Rohit"]},
//            {_id:"Ashu", employee:"Ashu", reportto:"Sachin", reportto_temp:["Yogesh", "Pawan", "Sachin"]},
//            {_id:"Rajit", employee:"Rajit", reportto:"Manjeet", reportto_temp:["Yogesh", "Pawan", "Manjeet"]},
//            {_id:"Naveen", employee:"Naveen", reportto:"Ashish", reportto_temp:["Yogesh", "Rohit", "Ashish"]}
//        ]
//
//        var tasks = [
//            {_id:"task1", task:"task1", owner:"Pawan"},
//            {_id:"task1", task:"task2", owner:"Rohit"},
//            {_id:"task1", task:"task3", owner:"Sachin"},
//            {_id:"task1", task:"task4", owner:"Sachin"},
//            {_id:"task1", task:"task5", owner:"Manjeet"},
//            {_id:"task1", task:"task6", owner:"Manjeet"},
//            {_id:"task1", task:"task7", owner:"Ashish"},
//            {_id:"task1", task:"task8", owner:"Ashu"},
//            {_id:"task1", task:"task9", owner:"Rajit"},
//            {_id:"task1", task:"task10", owner:"Rajit"},
//            {_id:"task1", task:"task11", owner:"Ashu"},
//            {_id:"task1", task:"task12", owner:"Naveen"}
//        ];
//
//        var roles = [
//            {
//                role:"CEO", r:1, w:1
//            },
//            {
//                role:"TeamLead",
//                r:0,
//                w:0,
//                collections:[
//                    {
//                        collection:"employees",
//                        r:1,
//                        w:0,
//                        filter:{reportto_temp:"_CurrentUser"}
//                    },
//                    {
//                        collection:"Tasks",
//                        r:1,
//                        w:1,
//                        filter:{"owner.reportto_temp":"_CurrentUser"}
//                    }
//                ]
//            }
//        ];
//
//        var users = [
//            {_id:"Yogesh", user:"Yogesh", roles:["CEO"]},
//            {_id:"Pawan", user:"Pawan", roles:["TeamLead"]},
//            {_id:"Rohit", user:"Rohit", roles:["TeamLead"]},
//            {_id:"Sachin", user:"Sachin", roles:["TeamLead"]},
//            {_id:"Manjeet", user:"Manjeet", roles:["TeamLead"]},
//            {_id:"Ashish", user:"Ashish", roles:["TeamLead"]},
//            {_id:"Ashu", user:"Ashu", roles:["TeamLead"]},
//            {_id:"Rajit", user:"Rajit", roles:["TeamLead"]},
//            {_id:"Naveen", user:"Naveen", roles:["TeamLead"]}
//        ]
//
//        var DaffodilDB = ApplaneDB.connect("Daffodil", {user:"Yogesh", pwd:"hrhk"});
//
//        var tasks = DaffodilDB.query({collections:"tasks"});
//
//        expect(tasks).to.have.length(12);
//
//
//        var DaffodilDB = ApplaneDB.connect("Daffodil", {user:"Pawan", pwd:"hrhk"});
//
//        var tasks = DaffodilDB.query({collections:"tasks"});
//
//        expect(tasks).to.have.length(9);
//
//        var DaffodilDB = ApplaneDB.connect("Daffodil", {user:"Naveen", pwd:"hrhk"});
//
//        var tasks = DaffodilDB.query({collections:"tasks"});
//
//        expect(tasks).to.have.length(1);
//    });
//
//    it("Create role to restrict column.", function () {
//
//        var employees = [
//            {_id:"Yogesh", employee:"Yogesh"},
//            {_id:"SachinGarg", employee:"SachinGarg", reportto:"Yogesh", reportto_temp:["Yogesh"]},
//            {_id:"SachinGarg", employee:"Sam", reportto:"SachinGarg", reportto_temp:["Yogesh", "SachinGarg"]},
//            {_id:"SachinGarg", employee:"Rick", reportto:"SachinGarg", reportto_temp:["Yogesh", "SachinGarg"]},
//            {_id:"Pawan", employee:"Pawan", reportto:"Yogesh", reportto_temp:["Yogesh"]},
//            {_id:"Rohit", employee:"Rohit", reportto:"Yogesh", reportto_temp:["Yogesh"]},
//            {_id:"Sachin", employee:"Sachin", reportto:"Pawan", reportto_temp:["Yogesh", "Pawan"]},
//            {_id:"Manjeet", employee:"Manjeet", reportto:"Pawan", reportto_temp:["Yogesh", "Pawan"]},
//            {_id:"Ashish", employee:"Ashish", reportto:"Rohit", reportto_temp:["Yogesh", "Rohit"]},
//            {_id:"Ashu", employee:"Ashu", reportto:"Sachin", reportto_temp:["Yogesh", "Pawan", "Sachin"]},
//            {_id:"Rajit", employee:"Rajit", reportto:"Manjeet", reportto_temp:["Yogesh", "Pawan", "Manjeet"]},
//            {_id:"Naveen", employee:"Naveen", reportto:"Ashish", reportto_temp:["Yogesh", "Rohit", "Ashish"]}
//        ]
//
//        var sales = [
//            {_id:"1", name:"Ganpat Rao Pub School", product:"SIS", assignto:"Pawan", potentialValue:500000, saleperson:"SachinGarg"},
//            {_id:"2", name:"task2", product:"SIS", assignto:"Rohit", potentialValue:500000, saleperson:"Sam"},
//            {_id:"3", name:"task3", product:"SIS", assignto:"Sachin", potentialValue:500000, saleperson:"SachinGarg"},
//            {_id:"4", name:"task4", product:"SIS", assignto:"Sachin", potentialValue:500000, saleperson:"Rick"},
//            {_id:"5", name:"task5", product:"SIS", assignto:"Manjeet", potentialValue:500000, saleperson:"Sam"},
//            {_id:"6", name:"task6", product:"SIS", assignto:"Manjeet", potentialValue:500000, saleperson:"Rick"},
//            {_id:"7", name:"task7", product:"SIS", assignto:"Ashish", potentialValue:500000, saleperson:"Sam"},
//            {_id:"8", name:"task8", product:"SIS", assignto:"Ashu", potentialValue:500000, saleperson:"Sam"},
//            {_id:"9", name:"task9", product:"SIS", assignto:"Rajit", potentialValue:500000, saleperson:"Rick"},
//            {_id:"10", name:"task10", product:"SIS", assignto:"Rajit", potentialValue:500000, saleperson:"Sam"},
//            {_id:"11", name:"task11", product:"SIS", assignto:"Ashu", potentialValue:500000, saleperson:"Sam"},
//            {_id:"12", name:"task12", product:"SIS", assignto:"Naveen", potentialValue:500000, saleperson:"Rick"}
//        ];
//
//        var roles = [
//            {role:"CEO"},
//            {
//                role:"SaleManager",
//                r:0,
//                w:0,
//                collections:[
//                    {
//                        collection:"employees",
//                        r:1,
//                        w:0,
//                        filter:{reportto_temp:"_CurrentUser"}
//                    },
//                    {
//                        collection:"Sales",
//                        r:1,
//                        w:1,
//                        filter:{"saleperson.reportto_temp":"_CurrentUser"}
//                    }
//                ]
//            },
//            {
//                role:"ProjectManager",
//                r:0,
//                w:0,
//                collections:[
//                    {
//                        collection:"employees",
//                        r:1,
//                        w:0,
//                        filter:{reportto_temp:"_CurrentUser"}
//                    },
//                    {
//                        collection:"Sales",
//                        r:1,
//                        w:1,
//                        filter:{"assignto.reportto_temp":"_CurrentUser"},
//                        fields:{potentialValue:{r:0, w:0}}
//                    }
//                ]
//            }
//        ];
//
//        var role = {
//            "role":"Team lead",
//            "collections":{
//                tasks:{
//                    rights:[
//                        {
//                            r:1,
//                            w:1
//                        },
//                        {
//                            r:1,
//                            w:1,
//                            filter:{
//
//                            }
//                        }
//                    ]
//                }},
//
//        }
//
//        var users = [
//            {_id:"Yogesh", user:"Yogesh", roles:["CEO"]},
//            {_id:"Yogesh", user:"SachinGarg", roles:["SaleTeamLead"]},
//            {_id:"Yogesh", user:"Sam", roles:["SaleTeamLead"]},
//            {_id:"Yogesh", user:"Rick", roles:["SaleTeamLead"]},
//            {_id:"Pawan", user:"Pawan", roles:["TechTeamLead"]},
//            {_id:"Rohit", user:"Rohit", roles:["TechTeamLead"]},
//            {_id:"Sachin", user:"Sachin", roles:["TechTeamLead"]},
//            {_id:"Manjeet", user:"Manjeet", roles:["TechTeamLead"]},
//            {_id:"Ashish", user:"Ashish", roles:["TechTeamLead"]},
//            {_id:"Ashu", user:"Ashu", roles:["TechTeamLead"]},
//            {_id:"Rajit", user:"Rajit", roles:["TechTeamLead"]},
//            {_id:"Naveen", user:"Naveen", roles:["TechTeamLead"]}
//        ]
//
//        var DaffodilDB = ApplaneDB.connect("Daffodil", {user:"Yogesh", pwd:"hrhk"});
//
//        var sales = DaffodilDB.query({collection:"sales"});
//
//        expect(sales).to.have.length(12);
//        expect(sales[0].potentialValue).to.equals(5000000);
//
//
//        var DaffodilDB = ApplaneDB.connect("Daffodil", {user:"Pawan", pwd:"hrhk"});
//
//        var sales = DaffodilDB.query({collections:"Sales"});
//
//        expect(sales).to.have.length(9);
//        expect(sales[0].potentialValue).to.equals(undefined);
//
//        var DaffodilDB = ApplaneDB.connect("Daffodil", {user:"SachinGarg", pwd:"hrhk"});
//
//        var sales = DaffodilDB.query({collections:"Sales"});
//
//        expect(sales).to.have.length(12);
//        expect(sales[0].potentialValue).to.equals(500000);
//
//    });
//});