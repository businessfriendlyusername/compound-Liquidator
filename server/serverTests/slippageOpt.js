const uniswap = require('@uniswap/sdk')
const uniswapPairs = require("../config/uniswapPairs")
const { TokenAmount } = require('@uniswap/sdk')
//const log = require('tracer').console()

run = async () => {

  //initialize all Uniswap tokens
  var promises = []
  var uniswapTokens = {}
  uniswapPairs.forEach(pair => {
    if(uniswapTokens[pair.address0] === undefined){
      uniswapTokens[pair.address0] = 0
      promises.push(uniswap.Token.fetchData(uniswap.ChainId.MAINNET, pair.address0))
    }
    if(uniswapTokens[pair.address1] === undefined){
      uniswapTokens[pair.address1] = 0
      promises.push(uniswap.Token.fetchData(uniswap.ChainId.MAINNET, pair.address1))
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
  //combine tokens into pairs


  promises = []
  var uniswapTokenPairs = []
  uniswapPairs.forEach(pair => {
    promises.push(uniswap.Pair.fetchData(uniswapTokens[pair.address0], uniswapTokens[pair.address1]))
  })
  try{
    uniswapTokenPairs = await Promise.all(promises)
  }
  catch (err) {
    console.log(err)
  }

  var [trade] = uniswap.Trade.bestTradeExactOut(
    uniswapTokenPairs,
    uniswapTokens["0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"],
    new TokenAmount(uniswapTokens["0x0D8775F648430679A709E98d2b0Cb6250d2887EF"], '9000000000000000000000')
  )
  const percent = new uniswap.Percent('4', '100')
  console.log(trade.maximumAmountIn(percent).toExact())

  
}

run().catch(err => {console.log(err)})