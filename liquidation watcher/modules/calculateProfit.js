const cTokens = require('../contracts/cTokens')
const comptrollerContract = require('../contracts/comptrollerContract')
const priceOracleContract = require('../contracts/priceOracleContract')
const aaveContract = require('../contracts/aave')
const uniswapContracts = require('../contracts/uniswap')
const Web3 = require('web3')
const net = require('net')
const logger = require('tracer').console()
const bigNumber = require('bignumber.js')
const uniswap = require('@uniswap/sdk')



calculateProfit = async (address, state) => {
  var [largestBorrowBalance, largestBorrowCTokenAddress] = await getLargestBorrow(address, state)
  var [largestCollateralBalance, largestCollateralCTokenAddress] = await getLargestCollateral(address, state)
  var largestBorrowUnderlyingAddress = state.cTokenToUnderlying[largestBorrowCTokenAddress]
  var largestCollateralUnderlyingAddress = state.cTokenToUnderlying[largestCollateralCTokenAddress]
  var flashLoanLiquidity = state.tokenData[largestBorrowUnderlyingAddress].flashLoanLiquidity

  //calculate how many tokens to repay
  var params = {
    largestBorrowBalance,
    borrowPriceInEth: state.tokenData[largestBorrowUnderlyingAddress].priceInEth,
    closeFactor: state.closeFactor,
    collateralPriceInEth: state.tokenData[largestCollateralUnderlyingAddress].priceInEth,
    largestCollateralBalance,
    flashLoanLiquidity
  }
  var tokensRepaid = amountOfUnderlyingToRepayCompoundLoan(params)



  //calculate how many tokens we will seize
  params.amountRepaid = tokensRepaid
  params.liquidationIncentive = state.liquidationIncentive
  params.repayPriceInEth = state.tokenData[largestBorrowUnderlyingAddress].priceInEth
  params.seizePriceInEth = state.tokenData[largestCollateralUnderlyingAddress].priceInEth
  var tokensSeized = underlyingTokensSeized(params)

  //calculate expenses (flash loan repay => uniswap)
  var flashLoanRepay = tokensRepaid.times(state.flashLoanRate).decimalPlaces(0, 2)
  params.flashLoanRepay = flashLoanRepay
  params.outputToken = largestBorrowUnderlyingAddress
  params.inputToken = largestCollateralUnderlyingAddress
  var tokenExpenses = uniswapCost(params, state)

  //calculate profit
  var tokenProfit = tokensSeized.minus(tokenExpenses)
  var ethProfit = tokenProfit.times(state.tokenData[largestCollateralUnderlyingAddress].priceInEth)
  console.log(ethProfit.shiftedBy(-18).toString())
  return ethProfit
}


amountOfUnderlyingToRepayCompoundLoan = (params) => {
  var repayAmount = params.largestBorrowBalance.times(params.closeFactor).decimalPlaces(0, 3)//assume we can liquidate the max amount
  var repayAmountInEth = repayAmount.times(params.borrowPriceInEth)
  var collateralTotalInEth = params.largestCollateralBalance.times(params.collateralPriceInEth)


  //if the eth value of the amount that can be seized by repaying the largest borrow is more than the ETH value of the largest collateral asset
  //(i.e. we would be overpaying if we paid the default: largest borrow * close factor) calculate the maximum we can liquidate without overpaying
  if(repayAmountInEth.gt(collateralTotalInEth)){
    var ratio = borrowPriceInEth.div(collateralPriceInEth)
    var denominator = liquidationIncentive.times(ratio)
    repayAmount = params.largestCollateralBalance.div(denominator).decimalPlaces(0, 3)//Underlying seized / (liq incentive * ratio)
    repayAmountInEth = repayAmount.times(params.borrowPriceInEth)
  }
  if(repayAmount > params.flashLoanLiquidity){//check if aave has enough liquidity to repay this
    repayAmount = params.flashLoanLiquidity
    repayAmountInEth = repayAmount.times(params.borrowPriceInEth)
  }
  return repayAmount
}

underlyingTokensSeized = params => {
  var ratio = params.repayPriceInEth.div(params.seizePriceInEth)
  var rate = ratio.times(params.liquidationIncentive)
  return rate.times(params.amountRepaid).decimalPlaces(0, 3)
}

uniswapCost = (params, state) => {
  const marketDetails = uniswap.getMarketDetails(state.tokenData[params.inputToken].uniswapReserves, state.tokenData[params.outputToken].uniswapReserves)
  const tradeDetails = uniswap.getTradeDetails(uniswap.TRADE_EXACT.OUTPUT, Web3.utils.toBN(params.flashLoanRepay.decimalPlaces(0)), marketDetails)
  return tradeDetails.inputAmount.amount
}

getLargestBorrow = (address, state) => {
  return new Promise((resolve, reject) => {
    var promises = []
    state.cTokenAddresses.forEach(cTokenAddress => {
      promises.push(state.cTokenContracts[cTokenAddress].methods.borrowBalanceCurrent(address).call().then(borrow => {
        return [borrow, cTokenAddress]
      }))
    })

    Promise.all(promises).then(borrows => {
      var largestEthVal = new bigNumber(0)
      var largestTokenBalance
      var assetCTokenAddress
      borrows.forEach(borrow => {
        //each borrow is an array: [tokensBorrowed, cTokenAddress]
        //logger.debug(borrow[0], tokenData[borrow[1]].priceInEth.toString(), borrow[1])
        var borrowed = new bigNumber(borrow[0])
        var underlying = new bigNumber(state.tokenData[state.cTokenToUnderlying[borrow[1]]].priceInEth)
        var ethVal = borrowed.times(underlying)
        //console.log(ethVal.toString())
        if(ethVal.isGreaterThan(largestEthVal)){
          largestEthVal = ethVal
          largestTokenBalance = borrowed
          assetCTokenAddress = borrow[1]
        }
      })
      //logger.debug(largestTokenBalance, assetCTokenAddress, largestEthVal.toString())
      resolve([largestTokenBalance, assetCTokenAddress])
    })
    .catch(reject)
  })
}

getLargestCollateral = (address, state) => {
  return new Promise((resolve, reject) => {
    var promises = []
    state.cTokenAddresses.forEach(cTokenAddress => {
      promises.push(state.cTokenContracts[cTokenAddress].methods.balanceOfUnderlying(address).call().then(collateral => {
        return [collateral, cTokenAddress]
      }))
    })

    Promise.all(promises).then(collateralAssets => {
      var largestEthVal = new bigNumber(0)
      var largestTokenBalance
      var assetCTokenAddress
      collateralAssets.forEach(asset => {
        //each asset is an array: [collateralTokens, cTokenAddress]
        //logger.debug(asset[0], tokenData[asset[1]].priceInEth.toString(), asset[1])
        var bigNumAsset = new bigNumber(asset[0])
        var underlying = new bigNumber(state.tokenData[state.cTokenToUnderlying[asset[1]]].priceInEth)
        var ethVal = bigNumAsset.times(underlying)
        //console.log(ethVal.toString(), asset[1])
        if(ethVal.isGreaterThan(largestEthVal)){
          largestEthVal = ethVal
          largestTokenBalance = bigNumAsset
          assetCTokenAddress = asset[1]
        }
      })
      //logger.debug(largestTokenBalance, assetCTokenAddress, largestEthVal.toString())
      resolve([largestTokenBalance, assetCTokenAddress])
    })
    .catch(reject)
  })
}

module.exports = calculateProfit