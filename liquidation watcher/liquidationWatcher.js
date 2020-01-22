const comptrollerABI = require("./comptrollerContract")
const init = require("./init")

const web3 = init.web3
const log = init.log

var comptroller = new web3.eth.Contract(comptrollerABI.abi)
comptroller.options.address = comptrollerABI.address

// comptroller.events.MarketEntered({fromBlock: 1}).on('data', event => {
//   console.log(event)
// })

comptroller.getPastEvents('MarketEntered', {fromBlock: 0, toBlock: 'latest'}, (error, events) => {
  console.log(error)
  console.log(events)
})