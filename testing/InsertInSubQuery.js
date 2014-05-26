it(function (done) {
    var countryCollection = {
        collection:"countries",
        fields:[
            {field:"country"},
            {field:"code"}
        ],

    }

    var countryInsert = {
        $collection:"countries",
        $insert:[
            {_id:"india", country:"India", code:"91"},
            {_id:"usa", country:"USA", code:"01"}
        ]
    }


    //if alias is missing then using collection name
    var countryInsert = {
        $collection:{
            collection:"countries",
            childs:[
                {collection:"states", alias:"states", fk:"countryid"}
            ]
        },
        $insert:[
            {_id:"india", country:"India", code:"91", states:[
            ]},
            {_id:"usa", country:"USA", code:"01"}
        ]
    }


    var countryUpdate = {
        $collection:"countries",
        $update:[
            {_id:"india", states:25},
        ]
    }

    var voucherCollectionInsert = {collection:"vouchers", fields:[
        {field:"voucherno"} ,
        {field:"vli", type:"object", multiple:true, fields:[
            {field:"narration"} ,
            {field:"account", type:"fk", collection:"accounts", set:["account"]}
        ]}
    ]
    }

    var collectionFieldChild = [
        {collection:"pl.fields",alias:"fields",fk:"collectionid"}
    ]

    var voucherCollectionQuery = {
        $query:"pl.collections",
        $filter:{collection:"vouchers"},
        $child:{fields:1}
    }


});