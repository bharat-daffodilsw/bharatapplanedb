exports.TASK_TABLE = "tasks";
exports.BUSINESS_FUNCTION_TABLE = "businessfunctions";
exports.EMPLOYEES_TABLE = "employees";
exports.EMP_RECURSION_TABLE = "emps";
exports.CITIES_TABLE = "cities";
exports.STATES_TABLE = "states";
exports.COUNTRIES_TABLE = "countries";
exports.SCHOOLS_TABLE = "schools";
exports.YEARS_TABLE = "years";
exports.COLLEGES_TABLE = "colleges";
exports.EMP_RECURSIVE_TABLE = "emprecursive";
exports.EMP_RECURSIVE_WITHOUT_ID_TABLE = "emprecursivewithout_id";
exports.EMP_RELATION_TABLE = "emprelation";
exports.ACCOUNT_GROUPS_TABLE = "accountgroups";
exports.ACCOUNTS_TABLE = "accounts";
exports.VOUCHERS_TABLE = "vouchers";
exports.TASK_WITHOUT_ID_TABLE = "taskswithout_id";
exports.BUSINESS_FUNCTIONS_WITHOUT_ID_TABLE = "businessfunctionswithout_id";

exports.Countries = [
    {"_id":"India", country:"India", code:"91"} ,
    {"_id":"USA", country:"USA", code:"01"}
];

exports.States = [
    {"_id":"Haryana", state:"Haryana", code:"21312", countryid:{"_id":"India", country:"India"}} ,
    {"_id":"Punjab", state:"Punjab", code:"32423", countryid:{"_id":"India", country:"India"}}   ,
    {"_id":"Newyork", state:"Newyork", code:"2312", countryid:{"_id":"USA", country:"USA"}}
];

exports.Cities = [
    {"_id":"Amritsar", city:"Amritsar", code:"19992", stateid:{"_id":"Punjab", state:"Punjab"}} ,
    {"_id":"Bathinda", city:"Bathinda", code:"011", stateid:{"_id":"Punjab", state:"Punjab"}} ,
    {"_id":"Hisar", city:"Hisar", code:"01662", stateid:{"_id":"Haryana", state:"Haryana"}} ,
    {"_id":"Iceland", city:"Iceland", code:"11111", stateid:{"_id":"Newyork", state:"Newyork"}},
    {"_id":"Sirsa", city:"Sirsa", code:"01662", stateid:{"_id":"Haryana", state:"Haryana"}} ,
    {"_id":"Skyland", city:"Skyland", code:"1101662", stateid:{"_id":"Newyork", state:"Newyork"}}
];

exports.Schools = [
    {"id":"DAV", school:"DAV", code:"DAV", cities:[
        {_id:"Bathinda", city:"Bathinda"},
        {_id:"Hisar", city:"Hisar"}
    ]},
    {"id":"Redcliife", school:"Redcliife", code:"Redcliife", cities:[
        {_id:"Hisar", city:"Hisar"},
        {_id:"Amritsar", city:"Amritsar"} ,
        {_id:"Iceland", city:"Iceland"}
    ]},
    {"id":"Universal", school:"Universal", code:"Universal", cities:[
        {_id:"Bathinda", city:"Bathinda"},
        {_id:"Sirsa", city:"Sirsa"},
        {_id:"Amritsar", city:"Amritsar"}
    ]}

]

exports.Years = [
    {_id:"2012", year:"2012", inwords:"Two Thousand Twelve"},
    {_id:"2013", year:"2013", inwords:"Two Thousand Thirteen"},
    {_id:"2014", year:"2014", inwords:"Two Thousand Fourteen"}
]

exports.Colleges = [
    {college:"DAV", code:"DAV", establishment:{yearid:{_id:"2012", year:"2012"}, cities:[
        {_id:"Bathinda", city:"Bathinda"},
        {_id:"Hisar", city:"Hisar"},
        {_id:"Sirsa", city:"Sirsa"}
    ]}, courses:[
        {course:"BCA", cities:[
            {_id:"Bathinda", city:"Bathinda"},
            {_id:"Hisar", city:"Hisar"}
        ]},
        {course:"MCA", cities:[
            {_id:"Bathinda", city:"Bathinda"},
            {_id:"Sirsa", city:"Sirsa"},
            {_id:"Hisar", city:"Hisar"}
        ]}
    ]},
    {college:"Universal", code:"Universal", establishment:{yearid:{_id:"2014", year:"2014"}, cities:[
        {_id:"Amritsar", city:"Amritsar"},
        {_id:"Sirsa", city:"Sirsa"},
        {_id:"Iceland", city:"Iceland"}
    ]}, courses:[
        {course:"MBBS", cities:[
            {_id:"Amritsar", city:"Amritsar"},
            {_id:"Iceland", city:"Iceland"}
        ]},
        {course:"MSC", cities:[
            {_id:"Amritsar", city:"Amritsar"},
            {_id:"Sirsa", city:"Sirsa"}
        ]}
    ]}

]

exports.BusinessFunctions = [
    {_id:"Delivery", "businessfunction":"Delivery"},
    {_id:"Sales", "businessfunction":"Sales"},
    {_id:"Accounts", "businessfunction":"Accounts"},
    {_id:"HR", "businessfunction":"HR"}
]

exports.Employees = [
    {_id:"Pawan", "employee":"Pawan", code:"DFG-1011"},
    {_id:"Rohit", "employee":"Rohit", code:"DFG-1048"},
    {_id:"Sachin", "employee":"Sachin", code:"DFG-1049"},
    {_id:"Ashish", "employee":"Ashish", code:"DFG-1050"}
]

exports.Emps = [
    {_id:"Yogesh", "employee":"Yogesh", code:"DFG-1011", status:"active"},
    {_id:"Nitin", "employee":"Nitin", code:"DFG-1018", status:"active", reporting_to:[
        {_id:"Yogesh"}
    ]},
    {_id:"Rohit", "employee":"Rohit", code:"DFG-1015", status:"active", reporting_to:[
        {_id:"Yogesh"},
        {_id:"Nitin"}
    ]} ,
    {_id:"Pawan", "employee":"Pawan", code:"DFG-1012", status:"active", reporting_to:[
        {_id:"Yogesh"},
        {_id:"Nitin"}
    ]},
    {_id:"Sachin", "employee":"Sachin", code:"DFG-1013", status:"active", reporting_to:[
        {_id:"Pawan"}
    ]},
    {_id:"Ashish", "employee":"Ashish", code:"DFG-1014", status:"NA", reporting_to:[
        {_id:"Pawan"}
    ]},
    {_id:"Ashu", "employee":"Ashu", code:"DFG-1019", status:"active", reporting_to:[
        {_id:"Pawan"}  ,
        {_id:"Sachin"}
    ]}
]

exports.EmpRecursive = [
    {_id:"Nitin", "employee":"Nitin", code:"DFG-1011", status:"active"},
    {_id:"Pawan", "employee":"Pawan", code:"DFG-1012", status:"active", reporting_to:{_id:"Nitin"}
    },
    {_id:"Sachin", "employee":"Sachin", code:"DFG-1013", status:"active", reporting_to:{_id:"Pawan"}
    },
    {_id:"Ashish", "employee":"Ashish", code:"DFG-1014", status:"NA", reporting_to:{_id:"Pawan"}
    },
    {_id:"Rohit", "employee":"Rohit", code:"DFG-1015", status:"active", reporting_to:{_id:"Nitin"}
    }
]

exports.EmpRecursiveWithout_id = [
    {"employee":"Nitin", code:"DFG-1011", status:"active"},
    {"employee":"Pawan", code:"DFG-1012", status:"active", reporting_to:{$query:{employee:"Nitin"}}
    },
    {"employee":"Sachin", code:"DFG-1013", status:"active", reporting_to:{$query:{employee:"Pawan"}}
    },
    {"employee":"Ashish", code:"DFG-1014", status:"NA", reporting_to:{$query:{employee:"Pawan"}}
    },
    {"employee":"Rohit", code:"DFG-1015", status:"active", reporting_to:{$query:{employee:"Nitin"}}
    }
]

exports.EmpRelation = [
    {_id:"Nitin", "employee":"Nitin", code:"DFG-1011", status:"active"},
    {_id:"Pawan", "employee":"Pawan", code:"DFG-1011", status:"active", reporting_to:[
        {_id:"Nitin"},
        {_id:"Rohit"}
    ]},
    {_id:"Rohit", "employee":"Rohit", code:"DFG-1013", status:"active", reporting_to:[
        {_id:"Nitin"},
        {_id:"Pawan"}
    ]
    }
]

var monthlyAttendances = [
    {employeeid:{_id:"Pawan", "employee":"Pawan", code:"DFG-1011"}, month:"Januyary", year:"2014",
        salarycomponentdetails:[
            {component:"Basic", amount:5000, grossamount:6000},
            {component:"HRA", amount:10000},
            {component:"Basic", amount:15000, grossamount:6000}
        ]
    }
]

exports.TasksWithout_Id = [
    {task:"task01", status:"New", estefforts:1, businessfunctionid:{$query:{businessfunction:"Delivery"}}, "priorityid":{"_id":"High", "priority":"High"}, "assignto":[
        {_id:"Pawan"},
        {_id:"Rohit"}
    ]},
    {task:"task02", status:"New", estefforts:2, businessfunctionid:{$query:{businessfunction:"Sales"}}, "priorityid":{"_id":"High", "priority":"High"}, "assignto":[
        {_id:"Ashish"},
        {_id:"Rohit"}
    ]},
    {task:"task03", status:"InProgress", estefforts:3, businessfunctionid:{$query:{businessfunction:"Delivery"}}, "priorityid":{"_id":"Low", "priority":"Low"}, "assignto":[
        {_id:"Sachin"},
        {_id:"Rohit"}
    ]},
    {task:"task04", status:"InProgress", estefforts:4, businessfunctionid:{$query:{businessfunction:"Account"}}, "priorityid":{"_id":"High", "priority":"High"}, "assignto":[
        {_id:"Pawan"},
        {_id:"Sachin"}
    ]}
]


exports.Tasks = [
    {_id:"task01", task:"task01", status:"New", estefforts:1, businessfunctionid:{_id:"Delivery", businessfunction:"Delivery"}, "priorityid":{"_id":"High", "priority":"High"}, "assignto":[
        {_id:"Pawan"},
        {_id:"Rohit"}
    ]},
    {_id:"task02", task:"task02", status:"New", estefforts:2, businessfunctionid:{_id:"Sales", businessfunction:"Sales"}, "priorityid":{"_id":"High", "priority":"High"}, "assignto":[
        {_id:"Ashish"},
        {_id:"Rohit"}
    ]},
    {_id:"task03", task:"task03", status:"InProgress", estefforts:3, businessfunctionid:{_id:"Delivery", businessfunction:"Delivery"}, "priorityid":{"_id":"Low", "priority":"Low"}, "assignto":[
        {_id:"Sachin"},
        {_id:"Rohit"}
    ]},
    {_id:"task04", task:"task04", status:"InProgress", estefforts:4, businessfunctionid:{_id:"Sales", businessfunction:"Sales"}, "priorityid":{"_id":"High", "priority":"High"}, "assignto":[
        {_id:"Pawan"},
        {_id:"Sachin"}
    ]},
    {_id:"task05", task:"task05", status:"New", estefforts:5, businessfunctionid:{_id:"Delivery", businessfunction:"Delivery"}, "priorityid":{"_id":"High", "priority":"High"}, "assignto":[
        {_id:"Sachin"},
        {_id:"Ashish"}
    ]},
    {_id:"task06", task:"task06", status:"InProgress", estefforts:6, businessfunctionid:{_id:"Delivery", businessfunction:"Delivery"}, "priorityid":{"_id":"Medium", "priority":"Medium"}, "assignto":[
        {_id:"Pawan"},
        {_id:"Rohit"}
    ]},
    {_id:"task07", task:"task07", status:"New", estefforts:7, businessfunctionid:{_id:"Delivery", businessfunction:"Delivery"}, "priorityid":{"_id":"High", "priority":"High"}, "assignto":[
        {_id:"Pawan"}
    ]},
    {_id:"task08", task:"task08", status:"New", estefforts:8, businessfunctionid:{_id:"Sales", businessfunction:"Sales"}, "priorityid":{"_id":"Medium", "priority":"Medium"}, "assignto":[
        {_id:"Rohit"}
    ]},
    {_id:"task09", task:"task09", status:"Completed", estefforts:9, businessfunctionid:{_id:"Accounts", businessfunction:"Accounts"}, "priorityid":{"_id":"High", "priority":"High"}, "assignto":[
        {_id:"Pawan"},
        {_id:"Rohit"}
    ]},
    {_id:"task10", task:"task10", status:"Completed", estefforts:10, businessfunctionid:{_id:"Accounts", businessfunction:"Accounts"}, "priorityid":{"_id":"High", "priority":"High"}, "assignto":[
        {_id:"Sachin"}
    ]},
    {_id:"task11", task:"task11", status:"Completed", estefforts:11, businessfunctionid:{_id:"HR", businessfunction:"HR"}, "priorityid":{"_id":"Low", "priority":"Low"}, "assignto":[
        {_id:"Pawan"},
        {_id:"Rohit"}
    ]},
    {_id:"task12", task:"task12", status:"Completed", estefforts:12, businessfunctionid:{_id:"HR", businessfunction:"HR"}, "priorityid":{"_id":"High", "priority":"High"}, "assignto":[
        {_id:"Pawan"},
        {_id:"Rohit"}
    ]}
]

exports.AccountGroups = [
    {_id:"Income", "accountgroup":"Income"},
    {_id:"Expense", "accountgroup":"Expense", parent_account_group:{"_id":"Income"}} ,
    {_id:"Asset", "accountgroup":"Asset", parent_account_group:{"_id":"Expense"}}
]

exports.Accounts = [
    {_id:"Services", "account":"Services", accountgroupid:{_id:"Income", "accountgroup":"Income"}},
    {_id:"salary", "account":"salary", accountgroupid:{_id:"Expense", "accountgroup":"Expense"}}
]

exports.Vouchers = [
    {voucherno:1, vlis:[
        {accountid:{_id:"Services", "account":"Services"}, amount:-500, accountgroupid:{_id:"Income", "accountgroup":"Income"}} ,
        {accountid:{_id:"salary", "account":"salary"}, amount:500, accountgroupid:{_id:"Expense", "accountgroup":"Expense"}}
    ] },
    {voucherno:2, vlis:[
        {accountid:{_id:"cash", "account":"cash"}, amount:-100, accountgroupid:{_id:"Asset", "accountgroup":"Asset"}} ,
        {accountid:{_id:"salary", "account":"salary"}, amount:100, accountgroupid:{_id:"Expense", "accountgroup":"Expense"}}
    ] }
]

exports.insertData = function (db, tableName, data, callback) {
    db.collection(tableName, function (err, collection) {
        if (err) {
            callback(err);
            return;
        }
        collection.insert(data, function (err, res) {
            if (err) {
                callback(err);
                return;
            }
            callback(null, res);
        })
    })
}

exports.removeData = function (db, tableName, filter, callback) {
    db.collection(tableName, function (err, collection) {
        if (err) {
            callback(err);
            return;
        }

        collection.remove(filter, function (err, res) {
            if (err) {
                callback(err);
                return;
            }
            callback(null, res);
        })
    })
}





