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

/*
Params:
  account = {
    address //standard ethereum address
    largestBorrowBalance //the atomic value of the most valuable borrow balance (measured in ETH)
    largestBorrowCTokenAddress
    largestCollateralBalance //the atomic value of the most valuable Collateral balance (measured in ETH)
    largestCollateralCTokenAddress
  }

  state = {(The output of state.export() in modules/state.js)}
*/

calculateProfit = (account, state) => {
  var largestBorrowUnderlyingAddress = state.cTokenToUnderlying[account.largestBorrowCTokenAddress]
  var largestCollateralUnderlyingAddress = state.cTokenToUnderlying[account.largestCollateralCTokenAddress]
  var flashLoanLiquidity = state.tokenData[largestBorrowUnderlyingAddress].flashLoanLiquidity

  //calculate how many tokens to repay
  var params = {
    largestBorrowBalance: account.largestBorrowBalance,
    borrowPriceInEth: state.tokenData[largestBorrowUnderlyingAddress].priceInEth,
    closeFactor: state.closeFactor,
    collateralPriceInEth: state.tokenData[largestCollateralUnderlyingAddress].priceInEth,
    largestCollateralBalance: account.largestCollateralBalance,
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



module.exports = calculateProfit