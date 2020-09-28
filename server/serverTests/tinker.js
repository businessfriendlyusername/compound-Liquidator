const uniswap = require('@uniswap/sdk')
const uniswapPairs = require("../config/uniswapPairs")
const { TokenAmount } = require('@uniswap/sdk')
//const log = require('tracer').console()
const bigNumber = require('bignumber.js')

run = async () => {

  console.log(uniswap.)

  // //initialize all Uniswap tokens
  // var promises = []
  // var uniswapTokens = {}
  // uniswapPairs.forEach(pair => {
  //   if(uniswapTokens[pair.address0] === undefined){
  //     uniswapTokens[pair.address0] = 0
  //     promises.push(uniswap.Token.fetchData(uniswap.ChainId.MAINNET, pair.address0))
  //   }
  //   if(uniswapTokens[pair.address1] === undefined){
  //     uniswapTokens[pair.address1] = 0
  //     promises.push(uniswap.Token.fetchData(uniswap.ChainId.MAINNET, pair.address1))
  //   }
  // })
  // try{
  //   fulfilled = await Promise.all(promises)
  //   fulfilled.forEach(token => {
  //     uniswapTokens[token.address] = token
  //   })
  // } 
  // catch (err) {
  //   console.log(err)
  // }
  // //combine tokens into pairs


  // promises = []
  // var uniswapTokenPairs = []
  // uniswapPairs.forEach(pair => {
  //   promises.push(uniswap.Pair.fetchData(uniswapTokens[pair.address0], uniswapTokens[pair.address1]))
  // })
  // try{
  //   uniswapTokenPairs = await Promise.all(promises)
  // }
  // catch (err) {
  //   console.log(err)
  // }


  // var tokenOut = new bigNumber('900000000000000000000000000000')

  // var trade
  // [trade] = uniswap.Trade.bestTradeExactOut(
  //   uniswapTokenPairs,
  //   uniswapTokens["0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"],
  //   new TokenAmount(uniswapTokens["0x0D8775F648430679A709E98d2b0Cb6250d2887EF"], tokenOut.toFixed(0))
  // )

  // var lastSlippage = trade == undefined ? undefined : trade.slippage.toSignificant(5)
  // for(var i = 1; i < 100; i++){
  //   if(lastSlippage == undefined){
  //     tokenOut = tokenOut.dividedBy(10)
  //     trade = uniswap.Trade.bestTradeExactOut(
  //       uniswapTokenPairs,
  //       uniswapTokens["0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"],
  //       new TokenAmount(uniswapTokens["0x0D8775F648430679A709E98d2b0Cb6250d2887EF"], tokenOut.toFixed(0))
  //     )[0]
  //   }
  //   else if(lastSlippage > 8){
  //     tokenOut = tokenOut.dividedBy(2)
  //     trade = uniswap.Trade.bestTradeExactOut(
  //       uniswapTokenPairs,
  //       uniswapTokens["0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"],
  //       new TokenAmount(uniswapTokens["0x0D8775F648430679A709E98d2b0Cb6250d2887EF"], tokenOut.toFixed(0))
  //     )[0]
  //   }
  //   else if(lastSlippage > 4.01){
  //     tokenOut = tokenOut.dividedBy(1.05)
  //     trade = uniswap.Trade.bestTradeExactOut(
  //       uniswapTokenPairs,
  //       uniswapTokens["0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"],
  //       new TokenAmount(uniswapTokens["0x0D8775F648430679A709E98d2b0Cb6250d2887EF"], tokenOut.toFixed(0))
  //     )[0]
  //   }
  //   else if(lastSlippage > 3.99 && lastSlippage < 4.01){
  //     console.log(i, tokenOut.toFixed(0), lastSlippage)
  //     break
  //   }
  //   else{
  //     tokenOut = tokenOut.multipliedBy(1.001)
  //     trade = uniswap.Trade.bestTradeExactOut(
  //       uniswapTokenPairs,
  //       uniswapTokens["0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"],
  //       new TokenAmount(uniswapTokens["0x0D8775F648430679A709E98d2b0Cb6250d2887EF"], tokenOut.toFixed(0))
  //     )[0]
  //   }
  //   var lastSlippage = trade == undefined ? undefined : parseFloat(trade.slippage.toSignificant(5))
  //   console.log(tokenOut.toFixed(0), lastSlippage)
  // }

  // //console.log(trade)

  // console.log(trade.route)
  // // console.log(trade.slippage.toFixed())
  // console.log(trade.inputAmount.toExact(), trade.outputAmount.toFixed(), trade.executionPrice.toFixed(), trade.nextMidPrice.toFixed())
  // console.log(new bigNumber(trade.inputAmount.toFixed()).shiftedBy(18).toFixed())
}




run().catch(err => {console.log(err)})

