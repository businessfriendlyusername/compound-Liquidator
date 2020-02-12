const comptrollerABI = require("./contracts/comptrollerContract")
//const init = require("./init")
const fs = require("fs")
const queryString = require('querystring')
const https = require('https')

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~Initialization~~~~~~~~~~~~~~~~~~~~~~~~~~~
// const web3 = init.web3
// const log = init.log
// const startingBlock = 7722506 //when the first compound contract deployed 

// var comptroller = new web3.eth.Contract(comptrollerABI.abi)
// comptroller.options.address = comptrollerABI.address



//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~Sync up accounts~~~~~~~~~~~~~~~~~~~~~~~~~~


// newAccountEmitter = comptroller.events.MarketEntered({fromBlock: 9355000}).on('data', event => {
//   console.log(event)
//   accounts.add(event.address)
//   count++
//   console.log(count)
// })

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

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~pull accounts from compound's API~~~~~~~~~~~~~~~~~~~~~~~~~~
const url = "https://api.compound.finance/api/v2/account?"
const requestParams = {
  "page_size": 100,
  "max_health[value]": "1.5",
  "min_borrow_value_in_eth[value]": "0.5"
}

const paramString = queryString.stringify(requestParams)
console.log(url + paramString)
https.get(url + paramString, res => {
  let data = ''
  res.on('data', chunk => data += chunk)
  res.on('end', () => parseResponse(data))
})

parseResponse = response => {
  accounts = JSON.parse(response)['accounts']
  accounts.forEach(account => {
    //console.log(account)
    if(parseFloat(account['health']['value']) <= 1.5){
      console.log(account['health']['value'])
      console.log(account['total_collateral_value_in_eth'])
      console.log(account['address'])
    }
  })
}
