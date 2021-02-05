
require('dotenv').config();
const { Client,AccountId,PrivateKey, TokenCreateTransaction,TokenAssociateTransaction,TransferTransaction,
    AccountBalanceQuery,TopicCreateTransaction,TopicMessageSubmitTransaction,TopicMessageQuery} 
= require('@hashgraph/sdk');
const {TE} = require('./service/util');


async function mainToken(){
    //credential to access testnet
    const operatorKey = PrivateKey.fromString(process.env.MY_PRIVATE_KEY);
    const opratorId = AccountId.fromString(process.env.MY_ACCOUNT_ID);
    if(operatorKey == null || opratorId == null){    
        TE('Enviroment variable private key and account id not found') ;
    }  

    //Create our connection to the Hedera network
    // client connection
    const client = Client.forTestnet();
    client.setOperator(opratorId, operatorKey);

    // create tocken hts

    let createTokenTx = await new TokenCreateTransaction()
    .setTokenName('example')
    .setTokenSymbol('exl')
    .setDecimals(0)
    .setInitialSupply(100)
    .setTreasuryAccountId(opratorId)
    .execute(client);

    // create reciept 
    let reciept = await createTokenTx.getReceipt(client);
    let tokenId = reciept.tokenId;
    console.log("token",tokenId.toString())

    //ASSOCIATE TRANSACTION
    const accountId2 = AccountId.fromString(process.env.ACCOUNT_ID_2);
    const privateKey2 = PrivateKey.fromString(process.env.PRIVATE_KEY_2);
    let associateTx = await new TokenAssociateTransaction()
    .setAccountId(accountId2)
    .setTokenIds([tokenId])
    .freezeWith(client)
    .sign(privateKey2)

    let submitAssociateTx = await associateTx.execute(client);
    let associatereciept = await submitAssociateTx.getReceipt(client);

    console.log("associate =",associatereciept)

    // transfer token 'tresury' to another account

    let transferTx = await new TransferTransaction()
    .addTokenTransfer(tokenId ,opratorId,-10)// deduce from my acc. 
    .addTokenTransfer(tokenId,accountId2,10) // incress by 10
    .execute(client);

    let transferReciept = await transferTx.getReceipt(client);

    console.log("hhhhhh=",transferReciept)

    // check balance 

    let account_1_balance = await new AccountBalanceQuery()
    .setAccountId(opratorId)
    .execute(client);

    let account_2_balance = await new AccountBalanceQuery()
    .setAccountId(accountId2)
    .execute(client);

    console.log("acc1",account_1_balance.tokens.toString(),account_2_balance.tokens.toString())



}
mainToken();

async function hcsMain(){
    // test net setup
 const myClient = Client.forTestnet();
 myClient.setOperator(process.env.MY_ACCOUNT_ID,process.env.MY_PRIVATE_KEY)

 // create a topic 
 let topicTransactionId = await new TopicCreateTransaction().execute(myClient);
 let topicReciept = await topicTransactionId.getReceipt(myClient);
 let topicID = topicReciept.topicId
 let topicIdInString =topicID.toString();
 console.log("topic recipt==",topicReciept);
 console.log("topic id",topicIdInString); 
 sleep(500);

 //subscribe topic 

 new TopicMessageQuery()
 .setTopicId(topicID)
 .setStartTime(0)
 .subscribe(
     myClient,
    //  (message) => console.log("message recieve",message.contents.toString())
    (message) => console.log("message recieve",message.contents.toString()),
    (error)=> console.log("error",error)
 );
 
 // submit transaction (messege)

 for (let i = 0; i < 10; i++) {
     let hcsMessage = await new TopicMessageSubmitTransaction()
     .setTopicId(topicID)
     .setMessage(`Hi HCS ${i}`)
     .execute(myClient);
     let hcsReciept = await hcsMessage.getReceipt(myClient);
     console.log("hcs Reciept ",hcsReciept);
     
 }
}
hcsMain()

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}