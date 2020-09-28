const uniswap = require('@uniswap/sdk')
const uniswapPairs = require('../config/uniswapPairs.js')

poolsByToken = {}

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

Promise.all(promises).then(tokens => {
  tokens.forEach(token => {
    uniswapTokens[token.address] = token
  })
})
.then(() => {

  uniswapPairs.forEach(pair => {
    if(poolsByToken[pair.address0] == undefined)
      poolsByToken[pair.address0] = []
    if(poolsByToken[pair.address1] == undefined)
      poolsByToken[pair.address1] = []
    poolsByToken[pair.address0].push(uniswap.Pair.getAddress(uniswapTokens[pair.address0], uniswapTokens[pair.address1]))
    poolsByToken[pair.address1].push(uniswap.Pair.getAddress(uniswapTokens[pair.address0], uniswapTokens[pair.address1]))
  })
}).then(() => {console.log(poolsByToken)})

console.log(poolsByToken)