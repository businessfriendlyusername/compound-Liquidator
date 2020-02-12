const cTokens = require('../contracts/cTokens')
const comptrollerContract = require('../contracts/comptrollerContract')
const priceOracleContract = require('../contracts/priceOracleContract')
const Web3 = require('web3')
const net = require('net')

const local = "ws://127.0.0.1:8546"
const infura = "wss://mainnet.infura.io/ws/v3/1e6dafd39f064e1cb74ca7e7115ef345"
const ipc = new Web3.providers.IpcProvider("/home/belvis/.ethereum/geth.ipc", net)
const startingBlock = 7722506 //when the first compound contract deployed 
const provider = ipc//new Web3(local, net)
const web3 = new Web3(provider)

const cZRX = new web3.eth.Contract(cTokens.cZRX.abi, cTokens.cZRX.address)
const cWBTC = new web3.eth.Contract(cTokens.cWBTC.abi, cTokens.cWBTC.address)
const cUSDC = new web3.eth.Contract(cTokens.cUSDC.abi, cTokens.cUSDC.address)
const cSAI = new web3.eth.Contract(cTokens.cSAI.abi, cTokens.cSAI.address)
const cREP = new web3.eth.Contract(cTokens.cREP.abi, cTokens.cREP.address)
const cETH = new web3.eth.Contract(cTokens.cETH.abi, cTokens.cETH.address)
const cDAI = new web3.eth.Contract(cTokens.cDAI.abi, cTokens.cDAI.address)
const cBAT = new web3.eth.Contract(cTokens.cBAT.abi, cTokens.cBAT.address)
const comptroller = new web3.eth.Contract(comptrollerContract.abi, comptrollerContract.address)
const priceOracle = new web3.eth.Contract(priceOracleContract.abi, priceOracleContract.address)


// fullSync = () => {

//   console.log('started')
//   getAllAddresses = blockToSyncTo => {
//     return new Promise((resolve, reject) => {
//       // let accounts = {}
//       // let promises = []
//       // let requests = 0
//       // for(var block = startingBlock; block <= blockToSyncTo; block++){
//       //   promises.push(comptroller.getPastEvents('MarketEntered', {fromBlock: block, toBlock: block})
//       //     .then((events, error) => {
//       //       console.log(events)
//       //       if(error) {
//       //         reject(`couldn't get past events from block: ${block}`)
//       //       }
//       //       var addresses = events.map(event => event.returnValues.account)
//       //       return addresses
//       //     })
//       //   )
//       // }
//       // Promise.all(promises)
//       comptroller.getPastEvents('MarketEntered', {fromBlock: startingBlock, toBlock: blockToSyncTo})
//       .then((events, error) => {
//         if(error) {
//           reject(`couldn't get past events from block: ${block}`)
//         }
//         var addresses = [...new Set(events.map(event => event.returnValues.account))]
//         console.log(addresses.length)
//         resolve(addresses)
//       })
//       // .then(twoDArray => {
//       //   console.log('got all addresses')
//       //   var flat = []//flatten 2d array of addresses
//       //   twoDArray.forEach(array => {
//       //     flat.push(...array)
//       //   })
//       //   resolve([...new Set(flat)])//return all unique addresses
//       // })
//     })
//   }

//   web3.eth.getBlockNumber()
//   .then(getAllAddresses)
//   .then(addresses => {
//     //console.log(addresses.length)
//     let promises = []
//     addresses.forEach(address => {
//       promises.push(getBalancesOfAddress(address))
//     })
//     Promise.all(promises)
//     .then(balances => {
//       accounts = {}
//       for(var i = 0; i < balances.length; i++){
//         accounts[addresses[i]] = balances[i]
//       }
//       //console.log(accounts)
//       console.log(Math.floor((Date.now() - start) / 1000))
//     })
//   })
// }

// getBalancesOfAddress = address => {
//   //console.log(address)
//   return new Promise((resolve, reject) => {
//     let balances = {}
//     var promises = []
//     var cTokenContract
//     cTokens.entries().forEach(cToken => {
//       balances[cToken.address] = {}
//       cTokenContract = new web3.eth.Contract(cToken.abi, cToken.address)
//       promises.push(
//         cTokenContract.methods.balanceOf(address).call()
//         .then(result => {
//           //console.log(result)
//           balances[cToken.address]['cTokenBalance'] = result
//         })
//       )
//     })
//     Promise.all(promises)
//     .then(() => {
//       resolve(balances)
//     })
//   })
// }

getAmountSeized = async address => {
  //get assets that can be seized
  const markets = await comptroller.methods.getAssetsIn(address).call()
  console.log(markets)
}

// const start = Date.now()
// console.log(start)


web3.currentProvider.on("connect", () => getAmountSeized('0x7a68a38d8670d91c90122817cd0f06212cd4c8c0'))
