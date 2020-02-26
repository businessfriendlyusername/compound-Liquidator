const cTokens = require('../contracts/cTokens')
const comptrollerContract = require('../contracts/comptrollerContract')
const priceOracleContract = require('../contracts/priceOracleContract')
const aaveContract = require('../contracts/aave')
const uniswapContracts = require('../contracts/uniswap')
const logger = require('tracer').console()
const bigNumber = require('bn.js')

class State {
  constructor(web3){
    this.web3 = web3
  }

  async init(){

    this.data = {}

    //initialize contracts
    this.comptroller = new this.web3.eth.Contract(comptrollerContract.abi, comptrollerContract.address)
    this.priceOracle = new this.web3.eth.Contract(priceOracleContract.abi, priceOracleContract.address)
    this.aave = new this.web3.eth.Contract(aaveContract.abi, aaveContract.address)
    this.uniswapFactory = new this.web3.eth.Contract(uniswapContracts.factoryABI, uniswapContracts.factoryAddress)
    this.flashLoanRate = 35 //the flash loan rate in basis points -- flash loan fee is always 35 basis points as far as i can tell

    this.cTokenAddresses = []
    this.cTokenContracts = {}
    this.tokenData = {}
    this.cTokenToUnderlying = {}
    await cTokens.entries().forEach(async cToken => {
  
      this.cTokenAddresses.push(cToken.address)
      this.cTokenToUnderlying[cToken.address] = cToken.underlyingAddress
      this.cTokenContracts[cToken.address] = new web3.eth.Contract(cToken.abi, cToken.address)
      this.tokenData[cToken.underlyingAddress] = {
        cTokenAddress : cToken.underlyingAddress,
        priceInEth : null,
        exchangeRate : null,
        flashLoanLiquidity : null
      }
      if(cToken.underlyingAddress === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE")//ether has no uniswap address
        this.tokenData[cToken.underlyingAddress].uniswapAddress = null
      else
        this.tokenData[cToken.underlyingAddress].uniswapAddress = await this.uniswapFactory.methods.getExchange(cToken.underlyingAddress).call()
    })
    await this.sync()
  }
  
  async sync(){
    logger.debug('started syncData()')
    var promises = []
    
    promises.push(this.comptroller.methods.closeFactorMantissa().call().then(result => {
      var asBigNumber = new bigNumber(result)
      this.closeFactor = asBigNumber.shiftedBy(-18)
    }))
    promises.push(this.comptroller.methods.liquidationIncentiveMantissa().call().then(result => {
      var asBigNumber = new bigNumber(result)
      this.liquidationIncentive = asBigNumber.shiftedBy(-18)
    }))
    this.cTokenAddresses.forEach(address => {
      promises.push(syncCToken(address))
    })
    Promise.all(promises)
    .then(() => {
      return
    })
    .catch((err) => console.log(err))
  }

  syncCToken(cTokenAddress){
    return new Promise((resolve,reject) => {
      const underlyingAddress = this.cTokenToUnderlying[cTokenAddress]
  
      var promises = []
      promises.push(this.priceOracle.methods.getUnderlyingPrice(cTokenAddress).call().then(price => {
        this.tokenData[underlyingAddress].priceInEth = new bigNumber(price).shiftedBy(-18)
      }))
      promises.push(this.cTokenContracts[cTokenAddress].methods.exchangeRateCurrent().call().then(rate => {
        this.tokenData[underlyingAddress].exchangeRate = new bigNumber(rate).shiftedBy(-18)
      }))
      promises.push(this.aave.methods.getReserveData(underlyingAddress).call().then(data => {
        this.tokenData[underlyingAddress].flashLoanLiquidity = new bigNumber(data.availableLiquidity)
      }))
      promises.push(uniswap.getTokenReserves(underlyingAddress).then(reserves => {
        this.tokenData[underlyingAddress].uniswapReserves = reserves
      }))
    
      Promise.all(promises)
      .then(resolve)
      .catch(reject)
    })
  }

  export(){
    return {
      flashLoanRate: this.flashLoanRate,
      tokenData: this.tokenData,
    }
  }

}

module.exports = State