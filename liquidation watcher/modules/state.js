const cTokens = require('../contracts/cTokens')
const comptrollerContract = require('../contracts/comptrollerContract')
const priceOracleContract = require('../contracts/priceOracleContract')
const aaveContract = require('../contracts/aave')
const uniswapContracts = require('../contracts/uniswap')
const logger = require('tracer').console()
const bigNumber = require('bignumber.js')
const uniswap = require('@uniswap/sdk')

class State {
  constructor(web3){
    this.web3 = web3
  }

  async init(){
    //initialize contracts
    this.comptroller = new this.web3.eth.Contract(comptrollerContract.abi, comptrollerContract.address)
    this.priceOracle = new this.web3.eth.Contract(priceOracleContract.abi, priceOracleContract.address)
    this.aave = new this.web3.eth.Contract(aaveContract.abi, aaveContract.address)
    this.uniswapFactory = new this.web3.eth.Contract(uniswapContracts.factoryABI, uniswapContracts.factoryAddress)
    this.flashLoanRate = new bigNumber('35') //the flash loan rate in basis points -- flash loan fee is always 35 basis points as far as i can tell
    this.flashLoanRate = this.flashLoanRate.shiftedBy(-4).plus(1)//convert to 1.0035

    this.cTokenAddresses = []
    this.cTokenContracts = {}
    this.tokenData = {}
    this.cTokenToUnderlying = {}
    for(const cToken of cTokens.entries()){
      this.cTokenAddresses.push(cToken.address)
      this.cTokenToUnderlying[cToken.address] = cToken.underlyingAddress
      this.cTokenContracts[cToken.address] = new this.web3.eth.Contract(cToken.abi, cToken.address)
      this.tokenData[cToken.underlyingAddress] = {
        cTokenAddress : cToken.address,
        priceInEth : null,
        exchangeRate : null,
        flashLoanLiquidity : null
      }
      if(cToken.underlyingAddress === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"){//ether has no uniswap address
        this.tokenData[cToken.underlyingAddress].uniswapAddress = null
      }
      else{
        this.tokenData[cToken.underlyingAddress].uniswapAddress = await this.uniswapFactory.methods.getExchange(cToken.underlyingAddress).call()
      }
    }
    logger.debug('done with init, now sync')
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
      promises.push(this.syncCToken(address))
    })
    await Promise.all(promises)
  }

  async syncCToken(cTokenAddress){

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
    if(underlyingAddress === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"){
      this.tokenData[underlyingAddress].uniswapReserves = undefined
    }
    else{
      promises.push(uniswap.getTokenReserves(underlyingAddress, this.web3.currentProvider).then(reserves => {
        this.tokenData[underlyingAddress].uniswapReserves = reserves
      }))
    }
  
    await Promise.all(promises)
    return
  }

  export(){
    return {
      liquidationIncentive: this.liquidationIncentive.toString(),
      closeFactor: this.closeFactor.toString(),
      flashLoanRate: this.flashLoanRate.toString(),
      tokenData: this.tokenData,
      cTokenToUnderlying: this.cTokenToUnderlying,
      cTokenAddresses: this.cTokenAddresses,
      cTokenContracts: this.cTokenContracts
    }
  }

}

module.exports = State