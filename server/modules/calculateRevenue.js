const uniswap = require('@uniswap/sdk')
const bigNumber = require('bignumber.js')

calculateRevenue = (account, state) => {
  var largestBorrowUnderlyingAddress = state.cTokenToUnderlying[account.largestBorrowCTokenAddress]
  var largestCollateralUnderlyingAddress = state.cTokenToUnderlying[account.largestCollateralCTokenAddress]

    //calculate how many tokens to repay
    var params = {
      largestBorrowBalance: account.largestBorrowBalance,
      borrowPriceInEth: state.tokenData[largestBorrowUnderlyingAddress].priceInEth,
      closeFactor: state.closeFactor,
      collateralPriceInEth: state.tokenData[largestCollateralUnderlyingAddress].priceInEth,
      largestCollateralBalance: account.largestCollateralBalance,
      inputToken: state.cTokenToUnderlying[account.largestCollateralCTokenAddress],
      outputToken: state.cTokenToUnderlying[account.largestBorrowCTokenAddress]
    }
    var tokensRepaid = calculateTokensRepaid(params)

    //find the best uniswap trade for the amount of tokens being repaid
    params = {
      uniswapTokens: state.uniswapTokens,
      uniswapTokenPairs: state.uniswapTokenPairs,
      inputToken: state.cTokenToUnderlying[account.largestCollateralCTokenAddress],
      outputToken: state.cTokenToUnderlying[account.largestBorrowCTokenAddress],
      amountOut: tokensRepaid,
      liquidationIncentive: state.liquidationIncentive
    }
    var uniswapTrade = calculateBestUniswapTrade(params)
    var route = uniswapTrade.route.path.map(token => {return token.address})//the route to swap through in uniswap
    tokensRepaid = new bigNumber(uniswapTrade.outputAmount.toFixed()).shiftedBy(18)//tokensRepaid may have been affected by the optimal uniswap trade calc
    var approxCost = new bigNumber(uniswapTrade.inputAmount.toFixed()).shiftedBy(18)//the approximate cost of the uniswap cost function in the input token

    //calculate the amount of tokens that will be seized
    params = {
      liquidationIncentive: state.liquidationIncentive,
      repayTokenPrice: state.tokenData[largestBorrowUnderlyingAddress].priceInEth,
      tokensRepaid: tokensRepaid,
      seizeTokenPrice: state.tokenData[largestCollateralUnderlyingAddress].priceInEth
    }
    var tokensSeized = calculateTokensSeized(params)

    //final revenue calculation(in wei)
    var revenue = tokensSeized.minus(approxCost).times(state.tokenData[largestCollateralUnderlyingAddress].priceInEth)
    return {revenue:revenue, route:route, tokensSeized:tokensSeized}
}

/*
  var params = {
    liquidationIncentive
    repayTokenPrice (in wei)
    tokensRepaid
    seizeTokenPrice (in wei)
  } : returns bigNumber
*/

calculateTokensSeized = params => {
  //Ts = (I * Pr * Tr) / Ps
  return (params.liquidationIncentive.times(params.repayTokenPrice).times(params.tokensRepaid)).dividedBy(params.seizeTokenPrice)
}


/*
  params = {
    largestBorrowBalance: account.largestBorrowBalance,
    borrowPriceInEth: state.tokenData[largestBorrowUnderlyingAddress].priceInEth,
    closeFactor: state.closeFactor,
    collateralPriceInEth: state.tokenData[largestCollateralUnderlyingAddress].priceInEth,
    largestCollateralBalance: account.largestCollateralBalance,
  }
*/

calculateTokensRepaid = params => {
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
  return repayAmount
}


/*
  params = {
    // uniswapTokens, state variable
    // uniswapTokenPairs, state variable
    // inputToken, the address of input token (WETH for ETH)
    // outputToken, same as above
    // amountOut, the atomic amount of tokens coming out of the trade
    // liquidationIncentive, state variable
  } : returns uniswap:Trade
*/
calculateBestUniswapTrade = params => {
  const maxSlippage = liquidationIncentive.minus(1).shiftedBy(2).dividedBy(2).toNumber()//max slippage is half of the liquidation incentive for opt
  var [bestTrade] = uniswap.Trade.bestTradeExactOut(uniswapTokenPairs, 
    uniswapTokens[params.inputToken],
    new uniswap.TokenAmount(uniswapTokens[params.outputToken], params.amountOut)
  )

  if(bestTrade !== undefined && parseFloat(bestTrade.slippage.toExact()) < maxSlippage){//if slippage is acceptable, return the trade
    return bestTrade
  }
  else{//find the trade with $maxSlippage$ slippage
    return bestTradeBySlippage(params.uniswapTokens, params.uniswapTokenPairs, params.inputToken, params.outputToken, maxSlippage)
  }
}

//guess and check with jank gradient descent
bestTradeBySlippage = (uniswapTokens, uniswapTokenPairs, inputToken, outputToken, slippage) => {
  var tokenOut = new bigNumber('90000000000000000000000000000000000000000000000000000000')

  var trade
  [trade] = uniswap.Trade.bestTradeExactOut(
    uniswapTokenPairs,
    uniswapTokens[inputToken],
    new TokenAmount(uniswapTokens[outputToken], tokenOut)
  )

  var lastSlippage = Trade == undefined ? undefined : trade.slippage.toSignificant(5)
  for(var i = 1; i < 100; i++){
    if(lastSlippage == undefined){
      tokenOut = tokenOut.dividedBy(10)
      trade = uniswap.Trade.bestTradeExactOut(
        uniswapTokenPairs,
        uniswapTokens[inputToken],
        new TokenAmount(uniswapTokens[outputToken], tokenOut.toFixed(0))
      )[0]
    }
    else if(lastSlippage > 8){
      tokenOut = tokenOut.dividedBy(2)
      trade = uniswap.Trade.bestTradeExactOut(
        uniswapTokenPairs,
        uniswapTokens[inputToken],
        new TokenAmount(uniswapTokens[outputToken], tokenOut.toFixed(0))
      )[0]
    }
    else if(lastSlippage > 4.01){
      tokenOut = tokenOut.dividedBy(1.05)
      trade = uniswap.Trade.bestTradeExactOut(
        uniswapTokenPairs,
        uniswapTokens[inputToken],
        new TokenAmount(uniswapTokens[outputToken], tokenOut.toFixed(0))
      )[0]
    }
    else if(lastSlippage > 3.99 && lastSlippage < 4.01){
      break
    }
    else{
      tokenOut = tokenOut.multipliedBy(1.001)
      trade = uniswap.Trade.bestTradeExactOut(
        uniswapTokenPairs,
        uniswapTokens[inputToken],
        new TokenAmount(uniswapTokens[outputToken], tokenOut.toFixed(0))
      )[0]
    }
    var lastSlippage = trade == undefined ? undefined : parseFloat(trade.slippage.toSignificant(5))
  }
  if(lastSlippage < 5){//sanity check
    return trade
  }
  else{
    log.error('failed sanity check in bestTradeBySlippage(uniswap)')
    return null
  }
}