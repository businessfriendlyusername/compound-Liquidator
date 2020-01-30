const cTokens = require('../contracts/cTokens')
const comptroller = require('../contracts/comptroller')
const priceOracle = require('../contracts/priceOracle')
const sortedMap = require('collections/sorted-map')

class State{
  constructor(web3, logger, accounts, blockNumber){
    this.web3 = web3
    this.logger = logger
    this.blockNumber = blockNumber
    this.accountList = new sortedMap()
    this.accountList.contentCompare = compare
    accounts.forEach(account => {
      this.accountList.add(account.address, account.balances)
    })
    this.cZRX = new web3.eth.Contract(cTokens.cZRX.abi, cTokens.cZRX.address)
    this.cWBTC = new web3.eth.Contract(cTokens.cWBTC.abi, cTokens.cWBTC.address)
    this.cUSDC = new web3.eth.Contract(cTokens.cUSDC.abi, cTokens.cUSDC.address)
    this.cSAI = new web3.eth.Contract(cTokens.cSAI.abi, cTokens.cSAI.address)
    this.cREP = new web3.eth.Contract(cTokens.cREP.abi, cTokens.cREP.address)
    this.cETH = new web3.eth.Contract(cTokens.cETH.abi, cTokens.cETH.address)
    this.cDAI = new web3.eth.Contract(cTokens.cDAI.abi, cTokens.cDAI.address)
    this.cBAT = new web3.eth.Contract(cTokens.cBAT.abi, cTokens.cBAT.address)
    this.comptroller = new web3.eth.Contract(comptroller.abi, comptroller.address)
    this.priceOracle = new web3.eth.Contract(priceOracle.abi, priceOracle.address)
  }

  sync(){
    var promises = []

    promises.push()
    promises.push()
    promises.push()
    promises.push()
    promises.push()
    promises.push()
    promises.push()
    promises.push()

  }

  compare(left, right){

  }

  sort(){

  }


  blockNumber,//the last block that was sync'd
  collateralFactor,
  closeFactor,
  liquidationFactor,
}