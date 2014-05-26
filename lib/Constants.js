/**
 * Created with IntelliJ IDEA.
 * User: daffodil
 * Date: 8/4/14
 * Time: 10:59 AM
 * To change this template use File | Settings | File Templates.
 */


exports.Query = {
    COLLECTION:"$collection",
    _ID:"_id",
    FIELDS:"$fields",
    Fields:{
        TYPE:"$type",
        QUERY:"$query",
        FK:"$fk",
        PARENT:"$parent",
        ENSURE:"$ensure"
    },
    FILTER:"$filter",
    Filter:{
        OR:"$or",
        AND:"$and",
        IN:"$in",
        GT:"$gt",
        LT:"$lt"
    },
    PARAMETERS:"$parameters",
    CHILDS:"$childs",
    SORT:"$sort",
    GROUP:"$group",
    LIMIT:"$limit",
    SKIP:"$skip",
    UNWIND:"$unwind",
    RECURSION:"$recursion",
    Recursion:{
        LEVEL:"$level",
        ALIAS:"$alias",
        COUNTER:"$counter",
        ENSURE:"$ensure"
    },
    DATA:"$data",
    MODULES:"$modules"
};

exports.Update = {
    COLLECTION:"$collection",

    INSERT:"$insert",
    UPDATE:"$update",
    Update:{
        SET:"$set",
        UNSET:"$unset",
        QUERY:"$query",
        INC:"$inc"

    },
    DELETE:"$delete",
    QUERY:"$query",
    UPSERT:"$upsert",
    Upsert:{
        QUERY:"$query",
        FIELDS:"$fields"
    }
}
exports.Admin = {
    CONNECTIONS:"pl.connections",
    Conncetions:{
        TOKEN:"token",
        DB:"db",
        OPTIONS:"options"
    },
    USERS:"pl.users",
    Users:{
        USER_NAME:"username",
        PASSWORD:"password",
        ADMIN:"admin"
    },
    FUNCTIONS:"pl.functions",
    Functions:{
        NAME:"name",
        SOURCE:"source",
        CODE:"code"
    },
    ROLES:"pl.roles",
    Roles:{
        TABLE:"pl.roles",
        ROLE:"role",
        RIGHTS:"rights"
    },
    MENUS:"pl.menus",
    Menus:{
        LABEL:"label",
        PARENTMENU:"parentmenu",
        APPLICATION:"application"
    },
    FORM_GROUPS:"pl.formgroups",
    FormGroups:{
        TITLE:"title",
        COLLECTION_ID:"collectionid"
    },
    ACTIONS:"pl.actions",
    Actions:{
        LABEL:"label",
        COLLECTION_ID:"collectionid"
    },
    APPLICATIONS:"pl.applications",
    Applications:{
        LABEL:"label",
        DB:"db"
    },
    QVIEWS:"pl.qviews",
    Qviews:{
        ID:"id",
        COLLECTION:"collection"
    },
    COLLECTIONS:"pl.collections",
    Collections:{
        COLLECTION:"collection",
        DB:"db",
        FIELDS:"fields",
        REFERRED_FKS:"referredfks",
        EVENTS:"events",
        CHILDS:"childs",
        MERGE:"merge",
        Merge:{
            COLLECTION:"collection",
            FIELDS:"fields"
        },
        MergeType:{
            UNION:"union",
            OVERRIDE:"override"
        }
    },
    REFERRED_FKS:"pl.referredfks",
    /**  {collection:"persons",fields:[{_id:"cityid","field":"cityid","type":fk,collection:"cities","set":["city"]}]}
     */
    ReferredFks:{
        COLLECTION_ID:"collectionid", //persons
        FIELD:"field", //cityid
        SET:"set", //["city"]
        REFERRED_COLLECTION_ID:"referredcollectionid", //cities
        REFERRED_FIELD_ID:"referredfieldid"               //cityid
    },
    FIELDS:"pl.fields",
    Fields:{
        FIELD:"field",
        TYPE:"type",
        Type:{
            STRING:"string",
            FK:"fk",
            OBJECT:"object",
            NUMBER:"number",
            DECIMAL:"decimal",
            BOOLEAN:"boolean",
            DATE:"date",
            JSON:"json",
            DURATION:"duration",
            CURRENCY:"currency",
            UNIT:"unit"
        },
        MULTIPLE:"multiple",
        SET:"set", // Array of string
        DISPLAYFIELD:"displayField",
        COLLECTION:"collection", // can be object or string
        MANDATORY:"mandatory",
        UPSERT:"upsert",
        PARENT_FIELD_ID:"parentfieldid",
        COLLECTION_ID:"collectionid",
        FK:"fk",
        QUERY:"query"
    }
};


exports.Index = {
    INDEXES:"pl.indexes",
    Indexes:{
        NAME:"name",
        COLLECTION_ID:"collectionid",
        COLLECTION:"collection",
        UNIQUE:"unique",
        FIELD:"field",
        MULTIKEY:"multiKey",
        FIELDS:"fields"
    }
}

exports.Trigger = {
    TRIGGERS:"triggers",
    Triggers:{
        FUNCTIONNAME:"functionName",
        OPERATIONS:"operations",
        WHEN:"when",
        REQUIREDFIELDS:"requiredfields"
    }
}

exports.TRANSACTIONS = "pl.txs";

exports.Modules = {
    Udt:{
        Duration:{
            TIME:"time",
            UNIT:"unit",
            Unit:{
                HRS:"Hrs",
                DAYS:"Days",
                MINUTES:"Minutes"
            }
        },
        Currency:{
            AMOUNT:"amount",
            TYPE:"type",
            Type:{
                COLLECTION:"pl.currencies",
                CURRENCY:"currency"
            }
        },
        Unit:{
            QUANTITY:"quantity",
            UNIT:"unit",
            Unit:{
                COLLECTION:"pl.units",
                UNIT:"unit"
            }
        }
    }
}


//exports.Collections = {
//    TABLE:"pl.collections",
//    COLLECTION:"collection", /*could not be changed*/
//    FIELDS:"fields",
//    Fields:{
//        FIELD:"field",
//        TYPE:"type",
//        Type:{
//            STRING:"string",
//            FK:"fk",
//            OBJECT:"object",
//            NUMBER:"number",
//            DECIMAL:"decimal",
//            BOOLEAN:"boolean",
//            DATE:"date"
//        },
//        MULTIPLE:"multiple",
//        PUSH:"push", // Array of string
//        COLLECTION:"collection", // can be object or string
//        MANDATORY:"mandatory",
//        UPSERT:"upsert",
//        PARENT_FIELD:"parentfield",
//        COLLECTIONID:"collectionid"
//
//    },
//    REFERRED_FKS:"referredfks"
//}

exports.ErrorCode = {
    USER_NOT_FOUND:{CODE:1, MESSAGE:"User Not Found."},
    CREDENTIAL_MISSMATCH:{CODE:3, MESSAGE:"Username/Password did not match."},
    USER_ALREADY_EXISTS:{CODE:29, MESSAGE:"User already exists"},
    INVALID_DB_CODE:{CODE:30, MESSAGE:"Invalid db code"},
    MANDATORY_FIELDS:{CODE:31, MESSAGE:"Mandatory fields can not be left blank"},
    ONLY_ADMIN_CAN_ADD_USER:{CODE:32, MESSAGE:"Only admin can add user"}

}
