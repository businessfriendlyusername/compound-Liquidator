const cTokens = require('../contracts/cTokens')
const comptrollerContract = require('../contracts/comptrollerContract')
const priceOracleContract = require('../contracts/priceOracleContract')
const Web3 = require('web3')
const net = require('net')

const startingBlock = 7722506 //when the first compound contract deployed 
const provider = new Web3("wss://mainnet.infura.io/ws/v3/1e6dafd39f064e1cb74ca7e7115ef345", net)
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


fullSync = () => {

  
  web3.eth.getBlockNumber()
  .then(blockToSyncTo => {
    return new Promise((resolve, reject) => {//this promise returns all account balances on accounts that are 'in' at least one market
      let accounts = {}
      let promises = []
      for(var block = 7722642; block <= 7722642; block++){
        promises.push(comptroller.getPastEvents('MarketEntered', {fromBlock: block, toBlock: block})
          .then((events, error) => {
            if(error) {
              reject(`couldn't get past events from block: ${block}`)
            }
            else {
              events.forEach(event => {
                if(!(event.address in accounts) && accounts[event.address] !== null){//this account has not been checked yet
                  promises.push(getBalances(event.address)
                    .then((balances, error) => {
                      if(error){
                        reject(`couldn't get balances for account: ${event.address}`)
                      }
                      else{
                        //console.log(balances)
                        accounts[event.address] = balances
                      }
                    })
                  ) 
                }
              })
            }
          })
        )
      }
      Promise.all(promises)
      .then(Promise.all(promises).then(() => resolve(accounts)))
    })
  })
  .then(console.log)
}

getBalances = address => {
  return new Promise((resolve, reject) => {
    let balances = {}
    var promises = []
    var cTokenContract
    cTokens.entries().forEach(cToken => {
      balances[cToken.address] = {}
      cTokenContract = new web3.eth.Contract(cToken.abi, cToken.address)
      promises.push(
        cTokenContract.methods.balanceOf(address).call()
        .then(result => {
          balances[cToken.address]['cTokenBalance'] = result
        })
      )
    })
    Promise.all(promises)
    .then(() => {
      resolve(balances)
    })
  })
}



web3.currentProvider.on("connect", fullSync)
