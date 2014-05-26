describe("TransactionManagement testcase", function () {
    //batchupdatebyids --> options {atomicity:1}
    //db.startTx
    //db.rollbackTx
    //db.commitTx
    //when startTx, only one tx can be have at db level, if another user try to startTx throw error
    //addToOnCommitQueue
    //db.clone --> For making some tx without tx
    /*
     * __txs__
     *   _id  : txid
     *   updates : [
     *       {$collection:"countries",$delete:{_id:xxxx}}
     *
     *   ]
     *
     * when rollback, call reverse operation defined in __txs__ table for specified tx
     *
     * */
    /**
     * Test case should include required column use case, we may need to fire this in reverse order
     */

    /**
     *
     * cities : [
     *  {_id:"hansi", city:"hisar", population:50, __txn__:[{
     *          {txnid:12,$set:{city:"hansi",inc{population:-30}}}
     *  }] }
     * ]
     *
     *
     * addToQueue will be some direct db operations that will run directly with oncommit:true
     */

    it.skip("Simple Insert, update delete with multile values", function (done) {
        var countryInsert = {$collection:"countries", $insert:{ _id:"India", country:"india"}};

        db.startTx(function (err, txId) {
            /*
             * push to __txs__ table reverse effect, insert--> delete, delete -> insert, set --> oldValue and inc -- X(-1) before doing actual operation
             * in case of updates, field need to be kept in same table
             * in case of delete, field value need to be kept in another table __txs__
             * */
            var __txs__ = {_id:txId, updates:[
                {
                    $collection:"countries", $delete:{_id:"india"}
                }
            ]}

            db.batchUpdateById(countryInsert, function (err) {
                db.rollbackTx(txId, function (err) {

                })
            });
        });


    })

    it.skip("double updates in same table from after trigger", function (done) {  ok
        //
        var country = {_id:"india", country:"India"}
        var firstUpdate = {_id:"india", country:"India1"}
        var secondUpdate = {_id:"india", country:"India2"}
        //After rollback, it should be India not India1
        //insertion should not be part of testcase, only updates should be part of testcase


    })
    it.skip("upsert true, city, state, country", function (done) {

    })

    it.skip("automatic rollback, ", function (done) {
        //insert some duplicate records using some unique index

    })

    it.skip("after trigger from job, ", function (done) {
        //save invoice, then save voucher and then rollback

    })

    it.skip("array insert,update,delete,override ", function (done) {
        //save invoice, then save voucher and then rollback
        //voucher and lineitems
        var voucher = {_id:"124", voucherno:"124", vlis:[
            {accoount:"cash", amount:-2000},
            {accoount:"salary", amount:2000}
        ]}
        //db.insert
        var __txs__ = {_id:"tx1", updates:[
            {$collection:"vouchers", $delete:{_id:"124"}}
        ]}
        //db.commit
        var voucherUpdates = {$collection:"vouchers", $update:{_id:"124", $set:{vlis:{$insert:[
            {account:"bank", amount:20},
            {account:"ram", amount:-20}
        ]}}}}
        //db.update
        var txns = {_id:"tx1", updates:[
            {$collection:"vouchers", $updates:[
                {_id:"124"} //complete update will be in same table using json.stringify
            ]}
        ]}
        var vouchers = {_id:"127", __txs__:[
            {_id:"tx111", txid:"tx1", updates:{$set:{vlis:{$delete:[
                {_id:"vli3"}
            ]}}} }
        ]}

    })

    it.skip("child insert, update, delete and override", function (done) {
        //save invoice, then save voucher and then rollback

    })

    it.skip("required column test case", function (done) {
        var requiredFields = {"accountid.accountgroupid":1};

        var voucher = {_id:1, accountid:{_id:"cash"}}
        //from job update accountgroupid from required field
        var nowVoucher = {_id:1, accountid:{_id:"cash"}, accountGroup:{_id:"asset", accountgroup:"Assets"}}

        var voucherUpdates = {_id:1, accountid:{$query:{_id:"furniture"}}}
        var voucherTxUpdates = {}
        //when tx rollback and we will expect , check that account have just, _id saved and nothing more, it may happen for required fields


    })

    it.skip("inc case", function (done) {
        var persons = {_id:"rohit", name:"Rohit", tweets:10};
        var updates = {_id:"rohit", $inc:{tweets:20}}
        var __txupdates__ = {$inc:{tweets:-20}};
    })
    it.skip("inc case two times", function (done) {
        var persons = {_id:"rohit", name:"Rohit", tweets:10};
        var updates = {_id:"rohit", $inc:{tweets:20}}
    })

    it.skip("inc by two tx, one commit and one rollback", function (done) {
        var persons = {_id:"rohit", name:"Rohit", tweets:10};
        var updates = {_id:"rohit", $inc:{tweets:20}}
    })

    it.skip("object case", function (done) {
        var person = {_id:"rohit", address:{line1:"841", line2:"sector 14", city:"Hisar"}};
    })

    it.skip("$inc in array field")

})
