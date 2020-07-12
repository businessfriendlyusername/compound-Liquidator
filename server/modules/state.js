const cTokens = require('../contracts/cTokens')
const comptrollerContract = require('../contracts/comptrollerContract')
const priceOracleContract = require('../contracts/priceOracleContract')
const uniswap = require('@uniswap/sdk')
const uniswapPairList = require('../config/uniswapPairs')
const log = require('tracer').console()
const bigNumber = require('bignumber.js')



class State {
  constructor(web3){
    this.web3 = web3
  }

  async init(){
    log.debug('started init')
    //init contracts 
    this.comptroller = new this.web3.eth.Contract(comptrollerContract.abi, comptrollerContract.address)
    this.priceOracle = new this.web3.eth.Contract(priceOracleContract.abi, priceOracleContract.address)
    this.uniswapTokens = await this.uniswapInit()
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
    }
  }

  async sync(){
    log.debug('started sync')
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
    promises.push(this.uniswapSync())
    await Promise.all(promises)
  }

  async syncCToken(cTokenAddress){
    const underlyingAddress = this.cTokenToUnderlying[cTokenAddress]
    var promises = []
    promises.push(this.priceOracle.methods.getUnderlyingPrice(cTokenAddress).call().then(price => {
      this.tokenData[underlyingAddress].priceInEth = new bigNumber(price).shiftedBy(-18)
    }))
    // promises.push(this.cTokenContracts[cTokenAddress].methods.exchangeRateCurrent().call().then(rate => {
    //   this.tokenData[underlyingAddress].exchangeRate = new bigNumber(rate).shiftedBy(-18)
    // }))
    // promises.push(this.aave.methods.getReserveData(underlyingAddress).call().then(data => {
    //   this.tokenData[underlyingAddress].flashLoanLiquidity = new bigNumber(data.availableLiquidity)
    // }).catch(console.log))
    // if(underlyingAddress === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"){
    //   this.tokenData[underlyingAddress].uniswapReserves = undefined
    // }
    // else{
    //   promises.push(uniswap.getTokenReserves(underlyingAddress, this.web3.currentProvider).then(reserves => {
    //     this.tokenData[underlyingAddress].uniswapReserves = reserves
    //   }))
    //}
  
    await Promise.all(promises)
    return
  }

  async uniswapInit(){
    //initialize all Uniswap tokens
    var promises = []
    var uniswapTokens = {}
    uniswapPairList.forEach(pair => {
      if(uniswapTokens[pair.address0] === undefined){
        uniswapTokens[pair.address0] = 0
        promises.push(uniswap.Token.fetchData(uniswap.ChainId.MAINNET, pair.address0, this.web3.currentProvider))
      }
      if(uniswapTokens[pair.address1] === undefined){
        uniswapTokens[pair.address1] = 0
        promises.push(uniswap.Token.fetchData(uniswap.ChainId.MAINNET, pair.address1, this.web3.currentProvider))
      }
    })
    try{
      fulfilled = await Promise.all(promises)
      fulfilled.forEach(token => {
        uniswapTokens[token.address] = token
      })
    } 
    catch (err) {
      console.log(err)
    }
    return uniswapTokens
  }

  async uniswapSync(){
    var promises = []
    uniswapPairList.forEach(pair => {
      promises.push(uniswap.Pair.fetchData(this.uniswapTokens[pair.address0], this.uniswapTokens[pair.address1]))
    })
    try{
      this.uniswapTokenPairs = await Promise.all(promises)
    }
    catch (err) {
      console.log(err)
    }
  }
}