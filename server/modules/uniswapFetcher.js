const ERC20ABI = require('../contracts/ERC20')
const Web3 = require('web3')
const uniswap = require("@uniswap/sdk")
const uniswapPairABI = require("@uniswap/v2-core/build/IUniswapV2Pair.json");

fetchToken = async (address, provider) => {
  var web3 = new Web3(provider)
  tokenContract = new web3.eth.Contract(ERC20ABI, address)
  var decimals = await tokenContract.methods.decimals().call()

  return new uniswap.Token(uniswap.ChainId.MAINNET, address, decimals)
}

fetchPair = async (token0, token1, provider) => {
  var web3 = new Web3(provider)
  if(!token0.sortsBefore(token1)){
    var temp = token0
    token0 = token1
    token1 = temp
  }
  var pairAddress = uniswap.Pair.getAddress(token0, token1)
  pairContract = new web3.eth.Contract(uniswapPairABI.abi, pairAddress)
  var {reserve0, reserve1} = await pairContract.methods.getReserves().call()
  //console.log(`penis, ${reserve0}, vagina ${reserve1}`)
  return new uniswap.Pair(new uniswap.TokenAmount(token0, reserve0), new uniswap.TokenAmount(token1, reserve1))
}

module.exports = {
  fetchToken,
  fetchPair
}