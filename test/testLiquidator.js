const Web3 = require('web3')
const uniswap = require('@uniswap/sdk')
const uniswapPairs = require('../server/config/uniswapPairs')
const GM = require('godmode-for-test');
const addressBook = require('../server/modules/addressBook')
const bigNumer = require('bignumber.js')

const Dai = artifacts.require("Dai")
const DaiMintable = artifacts.require("DaiMintable")
const MintableToken = artifacts.require("MintableToken")

let GODMODE = new GM("development", "ws://127.0.0.1:9545");

/*
  prices = {
    REPAddress: (price in wei),
    DAIAddress: (price in wei),
    USDCAddress: etc...
  }
  add = bool //whether to remove or add liquidity to achieve prices
*/
setUniswapPrices = async (prices) => {
  
}

setPrice = async (address0, address1, address0Price, address1Price) => {
  const token0 = await uniswap.Token.fetchData(uniswap.ChainId.MAINNET, address0, GODMODE.provider)
  const token1 = await uniswap.Token.fetchData(uniswap.ChainId.MAINNET, address1, GODMODE.provider)
  let pair = await uniswap.Pair.fetchData(token0, token1)

  const token0PriceTarget = pair.token0.address == address0 ? address0Price / address1Price : address1Price / address0Price
  const token1PriceTarget = pair.token1.address == address1 ? address1Price / address0Price : address0Price / address1Price

  const token0StartPool = pair.token0.address == address0 ? new bigNumber(pair.reserve0.toFixed(0)) : new bigNumber(pair.reserve1.toFixed(0))
  const token1StartPool = pair.token1.address == address1 ? new bigNumber(pair.reserve1.toFixed(0)) : new bigNumber(pair.reserve0.toFixed(0))

  const invariant = token0StartPool.times(token1StartPool)

  const token0LiquidityTarget = invariant.div(token0PriceTarget).sqrt()
  const token1LiquidityTarget = invariant.div(token1PriceTarget).sqrt()

  const token0Delta = token0LiquidityTarget.sub(token0StartPool)
  const token1Delta = token1LiquidityTarget.sub(token1StartPool)
}

contract("Uniswap and Oracle price editing", accounts => {

  before(async () => {//mint lots of tokens for account[0]
    
  })

  describe("Modify uniswap price", () => {

  })

  describe("Modify oracle price", () => {

  })
})

