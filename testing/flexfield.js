/**
 * Flex field
 * mocha --recursive --timeout 150000 -g FlexFieldTestcase --reporter spec
 * invoices_flex__northwindtestcase
 *      invoice_number : string
 *      purchases :  object []
 *      purchases.purhchase_no : string
 *      purchases.accountid : lookup : accounts_flex : flexcolumn
 *      purchases.purchasedetails : object []
 *      purchases.purchasedetails.amount : currency
 *
 *      updates
 *          {"table":"invoices_flex__northwindtestcase","filter":{},"parameters":{},"operations":[{"purchases":[{"purchasedetails":[{"amount":{"amount":100,"type":{"currency":"INR","_id":"523166597fa1deb810000001"}},"telephone_no":"257807"},{"amount":{"amount":200,"type":{"currency":"INR","_id":"523166597fa1deb810000001"}},"telephone_no":"512263"}],"accountid":{"account":"Telephone"},"purhchase_no":"computer-101","period":"January 2014"}],"invoice_number":"daffodil/2014/1"}]}
 *
 * invoices_flex__northwindtestcase : flextable
 *      account : string
 *      updates
 *          {"table":"accounts_flex__northwindtestcase","filter":{},"parameters":{},"operations":[
 *              {
 *                  "account":"Telephone","columns":[{"label":"Period","expression":"period","type":"string","_id__temp":"17temp"},{"label":"Telephone no","expression":"purchasedetails.telephone_no","type":"string","_id__temp":"18temp"}],"_id__temp":"16temp"}]}
 *
 *
 * vouchers
 *      vlis
 *          accountid
 *          accountgroup : object , flexcolumn : accountgroupid
 *              accountgroupid : TelephoneExpene
 *              Telehpnoe_number
 *          accountgroup : fk, flex:true
 *          Telehpnoe_number
 *          accountgroup1 : fkl
 *
 *          narration
 *          costing : [ ]
 *
 *          voucher : { voucherno:1, vlis : [
 *                          {account:2579807,accountgroup:{_id:"telephone expense",group:"Telephone Exp",telephone_number:257807,paymentmode:cash}},
 *                          {account:2579807,accountgroup:{_id:"telephone expense",group:"Telephone Exp",telephone_number:257807,paymentmode:cash}}
 *                      ]}
 *
*       Query : {$collection:"vouchers",$fields:{voucherno:1,vli:1,vli.accountid:1}}
 *
 *       Update : Basic
 *          doc = Document (update, oldValue)
 *          vlis = doc.getDocuemnts("vlis")
 *           ==> vliDoc.getDocument("accountgroup")
 *                  -->
 *         FK Module
 *              collection
 *                  getField
 *                      fk
 *                      object
 *                          fields
 *                              getField
 *
 *
 * accounts
 *       account : Telephone
 *       flexColumns :
 *          period : string
 *          telephone_numner
 *          costing.amount
 *composite fk
 *accountgroups
 *      accountGroup : Telephone Expense
 *      flexfields :
 *          label : Period, field:"period", type:"string"
 *          label : Telehphone, field:"period", type:"string"
 *          label : Payment Mode, field:"period", type:"string"
 *          address.city
 *  Validation on save that name can not be same
 *
 *
 */



/**
 * Flex field
 * mocha --recursive --timeout 150000 -g FlexFieldTestcase --reporter spec
 * invoices_flex__northwindtestcase
 *      invoice_number : string
 *      purchases :  object []
 *      purchases.purhchase_no : string
 *      purchases.accountid : lookup : accounts_flex : flexcolumn
 *      purchases.purchasedetails : object []
 *      purchases.purchasedetails.amount : currency
 *
 *      updates
 *          {"table":"invoices_flex__northwindtestcase","filter":{},"parameters":{},"operations":[{"purchases":[{"purchasedetails":[{"amount":{"amount":100,"type":{"currency":"INR","_id":"523166597fa1deb810000001"}},"telephone_no":"257807"},{"amount":{"amount":200,"type":{"currency":"INR","_id":"523166597fa1deb810000001"}},"telephone_no":"512263"}],"accountid":{"account":"Telephone"},"purhchase_no":"computer-101","period":"January 2014"}],"invoice_number":"daffodil/2014/1"}]}
 *
 * invoices_flex__northwindtestcase : flextable
 *      account : string
 *      updates
 *          {"table":"accounts_flex__northwindtestcase","filter":{},"parameters":{},"operations":[{"account":"Telephone","columns":[{"label":"Period","expression":"period","type":"string","_id__temp":"17temp"},{"label":"Telephone no","expression":"purchasedetails.telephone_no","type":"string","_id__temp":"18temp"}],"_id__temp":"16temp"}]}
 * flex --> remove old value is not required now, as if accountid changes then it will be a new { } and will contains new values
 *
 * Query = {$collection:"vouchers",
 *              $fields :{"voucherno":1,vlis:1,vlis.accountgroup:1,vlis.amount:1}}
 *
 * Query = {$collection:"vouchers",
 *          $fields :{
 *              "voucherno":1,
 *              vlis:1,
 *              vlis.accountgroup.*:1,
 *              vlis.accountgroup.code:1,
 *              vlis.amount:1
 *              }
 *          }
 * Query = {
 *          $collection:"vouchers",
 *          $filter:{vlis.accountgroupid:"telephoneexp"},
 *          $fields :{"voucherno":1,vlis:1,vlis.accountgroup:1,vlis.amount:1,vlis.accountid.telehphoneid.number}}
 *
 * >>Discussion Parrt
 * voucher - lineitems -> accountgroups
 *  >> account group will be a flex field
 *   >> flex field required for account groups will be saved in pl.fields in which collection will be a composite fk type column
 *   >>flex field value will be saved in accountgroupid
 *   >> voucher = {date:"",vlis:[ {accountgroupid:{_id:"telephoneexp", telephone_number:"257807", paymeno_mode:"cash"} } ]}
 *
 *   >>For saving, every module will need field definion, for this, they will pass document to collection and get Field Definion
 *   >>DAtemodule --> voucher doc will be passed and getFields --> voucherno, date, vlis
 *   >>>>>> then for vlis, vlid doc and voucher as perent will be passed to collection and getFields --> narration, accountgroujpid, amount
 *   >>>>We will get Fields for FK and object type only
 *   >>>>>>>>>>>>We will get fields for accountgroup by passing its document --> we will get flex fields --> telephone number, paymentmode
 *   >>>>>We do not need to remove old value if accountgroup change as when accoount group change a new object { } will be saved
 *
 *   * Query = {$collection:"vouchers",
 *              $fields :{"voucherno":1,vlis:1,vlis.accountgroup:1,vlis.amount:1}}
 *
 * Query = {$collection:"vouchers",
 *          $fields :{
 *              "voucherno":1,
 *              vlis:1,
 *              vlis.accountgroup.*:1,  --> * is required to get flex fields info otherwise we will not provide flex feild saved in accountgroup, we will pass only other dotted field defined here, using * we will pass all info saved here
 *              vlis.accountgroup.code:1,
 *              vlis.amount:1
 *              }
 *          }
 * Query = {
 *          $collection:"vouchers",
 *          $filter:{vlis.accountgroupid:"telephoneexp"},
 *          $fields :{"voucherno":1,vlis:1,vlis.accountgroup:1,vlis.amount:1,vlis.accountid.telehphoneid.number}}
 *
 *          >>>we can get flex fields definition from collection by passing filter, (collection will serve flex field on the basis of document and filter)
 *          >>> will be handle by fk module
 *
 *
 *
 */
