const cTokens = require('../contracts/cTokens')
const comptrollerContract = require('../contracts/comptrollerContract')
const priceOracleContract = require('../contracts/priceOracleContract')
const aaveContract = require('../contracts/aave')
const Web3 = require('web3')
const net = require('net')
const logger = require('tracer').console()
const bigNumber = require('bignumber.js')

const local = "ws://127.0.0.1:8546"
const infura = "wss://mainnet.infura.io/ws/v3/1e6dafd39f064e1cb74ca7e7115ef345"
const ipc = new Web3.providers.IpcProvider("/home/belvis/.ethereum/geth.ipc", net)
const startingBlock = 7722506 //when the first compound contract deployed 
const provider = new Web3(infura, net)
const web3 = new Web3(provider)

// const cZRX = new web3.eth.Contract(cTokens.cZRX.abi, cTokens.cZRX.address)
// const cWBTC = new web3.eth.Contract(cTokens.cWBTC.abi, cTokens.cWBTC.address)
// const cUSDC = new web3.eth.Contract(cTokens.cUSDC.abi, cTokens.cUSDC.address)
// const cSAI = new web3.eth.Contract(cTokens.cSAI.abi, cTokens.cSAI.address)
// const cREP = new web3.eth.Contract(cTokens.cREP.abi, cTokens.cREP.address)
// const cETH = new web3.eth.Contract(cTokens.cETH.abi, cTokens.cETH.address)
// const cDAI = new web3.eth.Contract(cTokens.cDAI.abi, cTokens.cDAI.address)
// const cBAT = new web3.eth.Contract(cTokens.cBAT.abi, cTokens.cBAT.address)
const comptroller = new web3.eth.Contract(comptrollerContract.abi, comptrollerContract.address)
const priceOracle = new web3.eth.Contract(priceOracleContract.abi, priceOracleContract.address)
const aave = new web3.eth.Contract(aaveContract.abi, aaveContract.address)
const flashLoanRate = 35 //the flash loan rate in basis points -- flash loan fee is always 35 basis points as far as i can tell



//~~~~~~~~~~~~~~~~~~~~~~~~~~~init state vars~~~~~~~~~~~~~~~~~~~~~~~~~~~~

cTokenAddresses = []
cTokenContracts = {}
var tokenData = {}

cTokens.entries().forEach(cToken => {
  
  cTokenAddresses.push(cToken.address)
  cTokenContracts[cToken.address] = new web3.eth.Contract(cToken.abi, cToken.address)
  tokenData[cToken.address] = {
    underlyingAddress : cToken.underlyingAddress,
    underlyingPriceInEth : null,
    exchangeRate : null,
    flashLoanLiquidity : null
  }
})
var closeFactor = null
var liquidationIncentive = null



syncData = async () => {
  logger.debug('started syncData()')
  var promises = []
  
  promises.push(comptroller.methods.closeFactorMantissa().call().then(result => {
    var asBigNumber = new bigNumber(result)
    closeFactor = asBigNumber.shiftedBy(-18)
  }))
  promises.push(comptroller.methods.liquidationIncentiveMantissa().call().then(result => {
    var asBigNumber = new bigNumber(result)
    liquidationIncentive = asBigNumber.shiftedBy(-18)
  }))
  cTokenAddresses.forEach(address => {
    promises.push(syncCToken(address))
  })
  Promise.all(promises).then(() => {
    return
  })
  .catch((err) => console.log(err))
}

syncCToken = cTokenAddress => {
  return new Promise((resolve,reject) => {
    const underlyingAddress = tokenData[cTokenAddress].underlyingAddress

    var promises = []
    promises.push(priceOracle.methods.getUnderlyingPrice(cTokenAddress).call().then(price => {
      tokenData[cTokenAddress].underlyingPriceInEth = new bigNumber(price)
    }))
    promises.push(cTokenContracts[cTokenAddress].methods.exchangeRateCurrent().call().then(rate => {
      tokenData[cTokenAddress].exchangeRate = new bigNumber(rate)
    }))
    var reserveData
    promises.push(aave.methods.getReserveData(underlyingAddress).call().then(data => {
      reserveData = new bigNumber(data.availableLiquidity)
    }))
  
    Promise.all(promises)
    .then(() => {
      tokenData[cTokenAddress].flashLoanLiquidity = reserveData
      resolve()
    })
    .catch(reject)
  })
}


getLargestBorrow = address => {
  return new Promise((resolve, reject) => {
    var promises = []
    cTokenAddresses.forEach(cTokenAddress => {
      promises.push(cTokenContracts[cTokenAddress].methods.borrowBalanceCurrent(address).call().then(borrow => {
        return [borrow, cTokenAddress]
      }))
    })

    Promise.all(promises).then(borrows => {
      var largestEthVal = new bigNumber(0)
      var largestTokenBalance
      var assetCTokenAddress
      borrows.forEach(borrow => {
        //each borrow is an array: [tokensBorrowed, cTokenAddress]
        logger.debug(borrow[0], tokenData[borrow[1]].underlyingPriceInEth.toString(), borrow[1])
        var borrowed = new bigNumber(borrow[0])
        var underlying = new bigNumber(tokenData[borrow[1]].underlyingPriceInEth)
        var ethVal = borrowed.times(underlying).shiftedBy(-18)
        if(ethVal.isGreaterThan(largestEthVal)){
          largestEthVal = ethVal
          largestTokenBalance = borrowed
          assetCTokenAddress = borrow[1]
        }
      })
      logger.debug(largestTokenBalance, assetCTokenAddress, largestEthVal.toString())
      resolve([largestTokenBalance, assetCTokenAddress, largestEthVal])
    })
    .catch(reject)
  })
}

getLargestCollateral = address => {
  return new Promise((resolve, reject) => {
    var promises = []
    cTokenAddresses.forEach(cTokenAddress => {
      cTokenContracts[cTokenAddress].methods.balanceOfUnderlying(address).call().then(collateral => {
        return [collateral, cTokenAddress]
      })
    })

    Promise.all(promises).then(collateralAssets => {
      var largestEthVal = 0
      var largestTokenBalance
      var assetCTokenAddress
      collateralAssets.forEach(asset => {
        //each asset is an array: [collateralTokens, cTokenAddress]
        var bigNumAsset = new bigNumber(asset[0])
        var underlying = new bigNumber(tokenData[asset[1]].underlyingPriceInEth)
        var ethVal = bigNumAsset.times(underlying).shiftedBy(-18)
        if(ethVal > largestEthVal){
          largestEthVal = ethVal
          largestTokenBalance = bigNumAsset
          assetCTokenAddress = asset[1]
        }
      })
      resolve([largestTokenBalance, assetCTokenAddress, largestEthVal])
    })
    .catch(reject)
  })
}

calculateProfit = async address => {
  var [largestBorrowBalance, largestBorrowCTokenAddress, largestBorrowInEth] = await getLargestBorrow(address)
  var [largestCollateralBalance, largestCollateralCTokenAddress, largestCollateralInEth] = await getLargestCollateral(address)
  var flashLoanLiquidity = tokenData[borrowCTokenAddress].flashLoanLiquidity
  //if(largestBorrowInEth * closeFactor)
}


logger.debug('waiting for web3 connections')
web3.currentProvider.on("connect", async () => {
  await syncData()
  await getLargestBorrow("0x606420fc17e08ce7d85a5068cede5542c0e47128")
})