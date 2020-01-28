const comptrollerABI = require("./contracts/comptrollerContract")
const init = require("./init")
const fs = require("fs")

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~Initialization~~~~~~~~~~~~~~~~~~~~~~~~~~~
const web3 = init.web3
const log = init.log
const startingBlock = 7722506 //when the first compound contract deployed 

var comptroller = new web3.eth.Contract(comptrollerABI.abi)
comptroller.options.address = comptrollerABI.address



//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~Sync up accounts~~~~~~~~~~~~~~~~~~~~~~~~~~

var accountSet = init.accounts//the set of all compound accounts
var accountsByHealth = []
accountSet.forEach(account => {
  
})


newAccountEmitter = comptroller.events.MarketEntered({fromBlock: 9355000}).on('data', event => {
  console.log(event)
  accounts.add(event.address)
})

// comptroller.getPastEvents('MarketEntered', {fromBlock: 0, toBlock: 'latest'}, (error, events) => {
//   if(error) {
//     log.crit(`couldn't get past events, shutting down`)
//     process.exit()
//   }
//   else {
//     events.forEach(event => {
//       accounts.add(event.address)
//     }) 
//   }
// })