const Web3 = require('web3')
const net = require('net')
const GM = require('godmode-for-test');
const uniswap = require('@uniswap/sdk');
const uniswapFetcher = require("../server/modules/uniswapFetcher")
const addressBook = require('../server/modules/addressBook');
const uniswapPairs = require("../server/config/uniswapPairs")
const { assert } = require('chai');
const uniswapPairABI = require("@uniswap/v2-core/build/IUniswapV2Pair.json");
//const { promises } = require('dns');
const bigBankAccount = "0x3dfd23A6c5E8BbcFc9581d2E864a68feb6a076d3"

const log = require('tracer').console()
var bigNumber = require('bignumber.js');
const { Router } = require('@uniswap/sdk');
bigNumber.config({ EXPONENTIAL_AT: 30})
const maxUint = "1000000000000000000000000000"
const oracleAddress = "0x02557a5E05DeFeFFD4cAe6D83eA3d173B272c904"
const proxyOracleAddress = "0xDDc46a3B076aec7ab3Fc37420A8eDd2959764Ec4"
const daiOracleKey = "0x0000000000000000000000000000000000000002"
const usdcOracleKey = "0x0000000000000000000000000000000000000001"

const ERC20 = artifacts.require("ERC20")
const DAIMintable = artifacts.require("DaiMintable")
const USDCMintable = artifacts.require("USDCMintable")
//const REPMintable = artifacts.require("REPMintable") <~~~~~~~~~ see FUCK THIS below 
const ZRXMintable = artifacts.require("ZRXMintable")
const WBTCMintable = artifacts.require("WBTCMintable")
const BATMintable = artifacts.require("BATMintable")
//const USDTMintable = artifacts.require("USDTMintable")
const WETHMintable = artifacts.require("WETH9")
const TestRouter = artifacts.require("TestRouter")
const Oracle = artifacts.require("PriceOracle")
const OracleProxy = artifacts.require("PriceOracleProxy")
const GodModeOracle = artifacts.require("PriceOracleGodMode")

bigNumber 
let GODMODE = new GM("development", "ws://127.0.0.1:9545");
var provider = new Web3(GODMODE.provider, net)
web3 = new Web3(provider)
const uniswapPair = new web3.eth.Contract(uniswapPairABI.abi)



var DAIContract
var USDCContract 
var ZRXContract
//var USDTContract 
var BATContract
//REPContract = await ERC20.at(addressBook["REP"])
var WBTCContract 
var WETHContract 
var basicContracts
var RouterContract
/*
  prices = { 
    ZRXAddress: (price in wei),
    DAIAddress: (price in wei),
    USDCAddress: etc... (ZRX, DAI, USDC, WBTC, BAT, USDT)
  }
*/
var setUniswapPrices = async (prices, accounts) => {
  var pair
  for(var i = 0; i < uniswapPairs.length; i++){
    pair = uniswapPairs[i]
    //log.debug(`calling setPrice for ${pair.address0}-${pair.address1} pair at target prices: ${prices[pair.address0]}-${prices[pair.address1]}`)
    await setPrice(pair.address0, pair.address1, prices[pair.address0], prices[pair.address1], accounts)
  }
  //await Promise.all(promises)
}

var getExactUniswapPriceTargetsByPercent = async (percentages) => {
  var prices = await getUniswapPrices()
  var newPrices = {}
  var coins = [addressBook["USDC"], addressBook["DAI"], addressBook["WBTC"], addressBook["BAT"], addressBook["ZRX"], addressBook["WETH"]]
  coins.forEach(coin => {
    newPrices[coin] = prices[coin] * (1 + percentages[coin] / 100)
  })
  return newPrices
}

var setUniswapPricesByPercent = async (percentages, accounts) => {
  var prices = await getExactUniswapPriceTargetsByPercent(percentages)
  await setUniswapPrices(prices, accounts)
}

var OracleContract = await Oracle.at(oracleAddress)
var setOraclePrice = async (token, price) => {
  await GODMODE.executeAs(
    OracleContract,
    GodModeOracle,
    "setPrice", token, price,
    {from: accounts[0]}
  );
}

var getUniswapPrices = async () => {
  /*
    reserve = {
      address0,
      address1,
      amount0,
      amount1
    }
  */
  var reserves = [];
  for(var i = 0; i < uniswapPairs.length; i++){
    var token0 = await uniswapFetcher.fetchToken(uniswapPairs[i].address0, GODMODE.provider)
    var token1 = await uniswapFetcher.fetchToken(uniswapPairs[i].address1, GODMODE.provider)
    var pair = await uniswapFetcher.fetchPair(token0, token1, GODMODE.provider)
    reserves.push({
      address0 : uniswapPairs[i].address0,
      address1 : uniswapPairs[i].address1,
      amount0 : pair.reserve0.raw,
      amount1 : pair.reserve1.raw
    })
  }
  let prices = {}
  prices[addressBook["WETH"]] = 1
  reserves.forEach(reserve => {
    if(reserve.address0 in prices){
      prices[reserve.address1] = reserve.amount0 / reserve.amount1 * prices[reserve.address0]
    }
    else if(reserve.address1 in prices){
      prices[reserve.address0] = reserve.amount1 / reserve.amount0 * prices[reserve.address1]
    }
    else{
      log.debug('penis')
      reserves.push(reserve)
    }
  })
  return prices
}

var setPrice = async (address0, address1, address0Price, address1Price, accounts) => {
  var token0 = await uniswapFetcher.fetchToken(address0, GODMODE.provider)
  var token1 = await uniswapFetcher.fetchToken(address1, GODMODE.provider)
  const pairAddress = uniswap.Pair.getAddress(token0, token1)
  let pair = await uniswapFetcher.fetchPair(token0, token1, GODMODE.provider)
  // if(token0.decimals != token1.decimals){
  //   console.log(address0, address1)
  //   var scale = Math.abs(token0.decimals - token1.decimals)
  //   if(token0.decimals < token1.decimals){
  //     address0Price *= scale
  //   }
  //   else{
  //     address1Price *= scale
  //   }
  // }

  const token0PriceTarget = pair.token0.address == address0 ? address0Price / address1Price : address1Price / address0Price
  const token1PriceTarget = pair.token1.address == address1 ? address1Price / address0Price : address0Price / address1Price

  const token0StartPool = pair.token0.address == address0 ? new bigNumber(pair.reserve0.raw) : new bigNumber(pair.reserve1.raw)
  const token1StartPool = pair.token1.address == address1 ? new bigNumber(pair.reserve1.raw) : new bigNumber(pair.reserve0.raw)

  const invariant = token0StartPool.times(token1StartPool)

  var token0LiquidityTarget = invariant.div(token0PriceTarget).sqrt()
  var token1LiquidityTarget = invariant.div(token1PriceTarget).sqrt()

  const token0Delta = token0LiquidityTarget.minus(token0StartPool)
  const token1Delta = token1LiquidityTarget.minus(token1StartPool)
  var amount0Out, amount1Out
  var contract0 = await ERC20.at(pair.token0.address)
  var contract1 = await ERC20.at(pair.token1.address)
  if(token0Delta.isNegative()){
    amount0Out = token0Delta.integerValue().abs()
    amount1Out = "0"
    if(amount0Out < 1)
      return
  }
  else if(token1Delta.isNegative){
    amount1Out = token1Delta.integerValue().abs()
    amount0Out = "0"
    if(amount1Out < 1)
      return
  }
  else{
    console.log("Major yikes in function setPrice()")
  }
  // log.debug(token1Delta.toString(), token0Delta.toString())

  
  log.debug(`token0Target: ${token0PriceTarget} token0 initial liquidity: ${token0StartPool.toString()} token0 target liquidity: ${token0LiquidityTarget.toString()}`)
  log.debug(`token1Target: ${token1PriceTarget} token1 initial liquidity: ${token1StartPool.toString()} token1 target liquidity: ${token1LiquidityTarget.toString()}`)
  log.debug(`amount0Out: ${amount0Out} amount1Out: ${amount1Out}`)
  log.debug(`token0Delta: ${token0Delta} token1Delta: ${token1Delta}`)
  uniswapPair.options.address = pairAddress


  var allowance0 = await contract0.allowance(accounts[0], RouterContract.address)
  var allowance1 = await contract1.allowance(accounts[0], RouterContract.address)
  var balance0 = await contract0.balanceOf(accounts[0])
  var balance1 = await contract1.balanceOf(accounts[0])
  log.debug(`accounts[0] balance of ${pair.token0.address}: ${balance0} balance of ${pair.token1.address}: ${balance1}`)
  log.debug(`accounts[0] allowance of ${pair.token0.address}: ${allowance0} allowance of ${pair.token1.address}: ${allowance1}`)
  await RouterContract.swap(pair.token0.address, pair.token1.address, amount0Out, amount1Out);
  //console.log(re["0"].toString(), re["1"].toString(), re["2"].toString())
}




var unlockAccount = async account => {
  for(var j = 0; j < basicContracts.length; j++){
    await basicContracts[j].approve(RouterContract.address, maxUint, {from: account})
  }
}


contract("Godmode Network setup", function(accounts) {

  // describe("remove permission to mint ERC20", () => {
  //   before(async function() {
  //     await GODMODE.open();
  //     DAIContract = await ERC20.at(addressBook["DAI"])
  //     USDCContract = await ERC20.at(addressBook["USDC"])
  //     ZRXContract = await ERC20.at(addressBook["ZRX"])
  //     USDTContract = await ERC20.at(addressBook["USDT"])
  //     BATContract = await ERC20.at(addressBook["BAT"])
  //     //REPContract = await ERC20.at(addressBook["REP"])
  //     WBTCContract = await ERC20.at(addressBook["WBTC"])
  //     WETHContract = await ERC20.at(addressBook["WETH"])
  //     basicContracts = [DAIContract, USDCContract, ZRXContract, BATContract, WBTCContract, WETHContract]
  //   })
  
  //   after(async function() {
  //     await GODMODE.close();
  //   });


  
  //   it("mint DAI using godmode", async () => {
  //     assert.equal(await DAIContract.balanceOf(accounts[0]), 0, "Network has already been contaminated, Reset godmode ganache to fix")
  //     await GODMODE.executeAs(
  //       DAIContract,
  //       DAIMintable,
  //       "mint", accounts[0], maxUint,
  //       {from: accounts[0]}
  //     );
  //     assert(await DAIContract.balanceOf(bigBankAccount) > 0, "Minting DAI modified wrong state")
  //     assert.equal(await DAIContract.balanceOf(accounts[0]), maxUint, "godmode edit failed")

  //   })

  //   it("mint USDC using godmode", async () => {
  //     assert.equal(await USDCContract.balanceOf(accounts[0]), 0, "Network has already been contaminated, Reset godmode ganache to fix")
  //     await GODMODE.executeAs(
  //       USDCContract,
  //       USDCMintable,
  //       "mint", accounts[0], maxUint,
  //       {from: accounts[0]}
  //     );
  //     assert(await USDCContract.balanceOf(bigBankAccount) > 0, "Minting USDC modified wrong state")
  //     assert.equal(await USDCContract.balanceOf(accounts[0]), maxUint, "godmode edit failed")

  //   })


  //   //~~~~~~~~~~~~~~~~~~~~~~~~BEGIN FUCK THIS~~~~~~~~~~~~~~~~~~~
  //   //FUCK THIS their delegation bullshit is giving me too many errors on setup so we're just going to exclude REP from all of our tests and it will be fine :)

  //   // it("mint REP using godmode", async () => {
  //   //   assert.equal(await REPContract.balanceOf(accounts[0]), 0, "Network has already been contaminated, Reset godmode ganache to fix")
  //   //   await GODMODE.executeAs(
  //   //     REPContract,
  //   //     REPMintable,
  //   //     "mint", accounts[0], 1,
  //   //     {from: accounts[0]}
  //   //   );
  //   //   assert(await REPContract.balanceOf(bigBankAccount) > 0, "Minting REP modified wrong state")
  //   //   assert.equal(await REPContract.balanceOf(accounts[0]), 1, "godmode edit failed")

  //   // })

  //   //~~~~~~~~~~~~~~~~~~~END FUCK THIS~~~~~~~~~~~~~~~~~~~~~

  //   it("mint ZRX using godmode", async () => {
  //     assert.equal(await ZRXContract.balanceOf(accounts[0]), 0, "Network has already been contaminated, Reset godmode ganache to fix")
  //     await GODMODE.executeAs(
  //       ZRXContract,
  //       ZRXMintable,
  //       "mint", accounts[0], maxUint,
  //       {from: accounts[0]}
  //     );
  //     assert(await ZRXContract.balanceOf(bigBankAccount) > 0, "Minting ZRX modified wrong state")
  //     assert.equal(await ZRXContract.balanceOf(accounts[0]), maxUint, "godmode edit failed")

  //   })

  //   // it("mint USDT using godmode", async () => {
  //   //   assert.equal(await USDTContract.balanceOf(accounts[0]), 0, "Network has already been contaminated, Reset godmode ganache to fix")
  //   //   await GODMODE.executeAs(
  //   //     USDTContract,
  //   //     USDTMintable,
  //   //     "mint", accounts[0], maxUint,
  //   //     {from: accounts[0]}
  //   //   );
  //   //   assert(await USDTContract.balanceOf(bigBankAccount) > 0, "Minting USDT modified wrong state")
  //   //   assert.equal(await USDTContract.balanceOf(accounts[0]), maxUint, "godmode edit failed")

  //   // })

  //   it("mint WBTC using godmode", async () => {
  //     assert.equal(await WBTCContract.balanceOf(accounts[0]), 0, "Network has already been contaminated, Reset godmode ganache to fix")
  //     await GODMODE.executeAs(
  //       WBTCContract,
  //       WBTCMintable,
  //       "mint", accounts[0], maxUint,
  //       {from: accounts[0]}
  //     );
  //     assert(await WBTCContract.balanceOf(bigBankAccount) > 0, "Minting WBTC modified wrong state")
  //     assert.equal(await WBTCContract.balanceOf(accounts[0]), maxUint, "godmode edit failed")

  //   })

  //   it("mint BAT using godmode", async () => {
  //     assert.equal(await BATContract.balanceOf(accounts[0]), 0, "Network has already been contaminated, Reset godmode ganache to fix")
  //     await GODMODE.executeAs(
  //       BATContract,
  //       BATMintable,
  //       "mint", accounts[0], maxUint,
  //       {from: accounts[0]}
  //     );
  //     assert(await BATContract.balanceOf(bigBankAccount) > 0, "Minting BAT modified wrong state")
  //     assert.equal(await BATContract.balanceOf(accounts[0]), maxUint, "godmode edit failed")

  //   })

  //   it("mint WETH using godmode", async () => {
  //     assert.equal(await WETHContract.balanceOf(accounts[0]), 0, "Network has already been contaminated, Reset godmode ganache to fix")
  //     await GODMODE.executeAs(
  //       WETHContract,
  //       WETHMintable,
  //       "mint", accounts[0], maxUint,
  //       {from: accounts[0]}
  //     );
  //     assert.equal(await WETHContract.balanceOf(accounts[0]), maxUint, "godmode edit failed")
  //   })

  // })
   
  // describe("Test uniswap and oracle price editing", async () => {

  //   before(async () => {
  //     await GODMODE.open()
  //     RouterContract = await TestRouter.deployed()
  //     await unlockAccount(accounts[0])
  //   })

  //   after(async () => {
  //     await GODMODE.close()
  //   })

  //   it("Should be able to make a basic uniswap swap", async () => {
  //     var token0 = await uniswapFetcher.fetchToken(addressBook["DAI"], GODMODE.provider)
  //     var token1 = await uniswapFetcher.fetchToken(addressBook["WETH"], GODMODE.provider)
  //     const pairAddress = uniswap.Pair.getAddress(token0, token1)
  //     uniswapPair.options.address = pairAddress
  //     let pair = await uniswapFetcher.fetchPair(token0, token1, GODMODE.provider)


  //     var allowance0 = await DAIContract.allowance(accounts[0], RouterContract.address)
  //     var allowance1 = await WETHContract.allowance(accounts[0], RouterContract.address)
  //     var balance0 = await DAIContract.balanceOf(accounts[0])
  //     var balance1 = await WETHContract.balanceOf(accounts[0])
  //     var uniswapBalance0 = await DAIContract.balanceOf(pairAddress)
  //     var uniswapBalance1 = await WETHContract.balanceOf(pairAddress)
  //     // log.debug(`accounts[0] balance of ${pair.token0.address}: ${balance0} balance of ${pair.token1.address}: ${balance1}`)
  //     // log.debug(`accounts[0] allowance of ${pair.token0.address}: ${allowance0} allowance of ${pair.token1.address}: ${allowance1}`)
  //     // log.debug(`pairAddress balance of ${pair.token0.address}: ${uniswapBalance0} balance of ${pair.token1.address}: ${uniswapBalance1}`)
  //     var re = await RouterContract.swap(WETHContract.address, DAIContract.address, 0, 1)

  //     var allowance0 = await DAIContract.allowance(accounts[0], RouterContract.address)
  //     var allowance1 = await WETHContract.allowance(accounts[0], RouterContract.address)
  //     var balance0 = await DAIContract.balanceOf(accounts[0])
  //     var balance1 = await WETHContract.balanceOf(accounts[0])
  //     var uniswapBalance0 = await DAIContract.balanceOf(pairAddress)
  //     var uniswapBalance1 = await WETHContract.balanceOf(pairAddress)
  //     // log.debug(`accounts[0] balance of ${pair.token0.address}: ${balance0} balance of ${pair.token1.address}: ${balance1}`)
  //     // log.debug(`accounts[0] allowance of ${pair.token0.address}: ${allowance0} allowance of ${pair.token1.address}: ${allowance1}`)
  //     // log.debug(`pairAddress balance of ${pair.token0.address}: ${uniswapBalance0} balance of ${pair.token1.address}: ${uniswapBalance1}`)
  //   })
  //   it("Should be able to edit a uniswap pool to an exact price", async () => {

  //     var prices = {
  //       [addressBook["USDC"]] : 10,
  //       [addressBook["DAI"]] : 10,
  //       [addressBook["WBTC"]] : 10,
  //       [addressBook["BAT"]] : 10,
  //       [addressBook["ZRX"]] : 10,
  //       [addressBook["WETH"]] : 1,
  //     }

  //     var coins = [addressBook["USDC"], addressBook["DAI"], addressBook["WBTC"], addressBook["BAT"], addressBook["ZRX"], addressBook["WETH"]]
  //     await setUniswapPrices(prices, accounts)
  //     var newPrices = await getUniswapPrices()

  //     const closeEnough = (target, actual) => {
  //       var dif = Math.abs(target - actual)
  //       return (dif / target) <= 0.01 //we were within 1%
  //     }
  //     coins.forEach(coin => {
  //       assert(closeEnough(prices[coin], newPrices[coin]), `prices for ${coin} too different target: ${prices[coin]} actual: ${newPrices[coin]}`)
  //     })
  //   })

  //   it("Should be able to edit a uniswap pool by a percentage ", async () => {
  //     var initialPrices = await getUniswapPrices()
  //     var percentages = {
  //       [addressBook["USDC"]] : 10,
  //       [addressBook["DAI"]] : 10,
  //       [addressBook["WBTC"]] : 10,
  //       [addressBook["BAT"]] : 10,
  //       [addressBook["ZRX"]] : 10,
  //       [addressBook["WETH"]] : 1,
  //     }
  //     var coins = [addressBook["USDC"], addressBook["DAI"], addressBook["WBTC"], addressBook["BAT"], addressBook["ZRX"], addressBook["WETH"]]
  //     var exactTarget = await getExactUniswapPriceTargetsByPercent(percentages)
  //     await setUniswapPricesByPercent(percentages, accounts)
  //     var newPrices = await getUniswapPrices()
  //     const closeEnough = (target, actual) => {
  //       var dif = Math.abs(target - actual)
  //       return (dif / target) <= 0.01 //we were within 1%
  //     }
  //     coins.forEach(coin => {
  //       assert(closeEnough(exactTarget[coin], newPrices[coin]), `prices for ${coin} too different target: ${exactTarget[coin]} actual: ${newPrices[coin]}`)
  //     })
  //   })
  // })

  describe("Test Compound Oracle price editing", async () => {
    before(async () => {
      await GODMODE.open()
    })

    after(async () => {
      await GODMODE.close()
    })

    it("Should be able to query the Compound Oracle for prices", async () => {
      var coins = [addressBook["CUSDC"], addressBook["CDAI"], addressBook["CWBTC"], addressBook["CBAT"], addressBook["CZRX"], addressBook["CETH"]]
      var OracleContract = await OracleProxy.at(proxyOracleAddress)
      for(var i = 0; i < coins.length; i++){
        var re = await OracleContract.getUnderlyingPrice.call(coins[i])
        //console.log(re.toString())
      }
    })

  //     await GODMODE.executeAs(
  //       BATContract,
  //       BATMintable,
  //       "mint", accounts[0], maxUint,
  //       {from: accounts[0]}
  //     );

    it("Should be able to set the Oracle Price", async () => {
      var cTokens = [addressBook["CUSDC"], addressBook["CDAI"], addressBook["CWBTC"], addressBook["CBAT"], addressBook["CZRX"]]
      var coins = [addressBook["USDC"], addressBook["DAI"], addressBook["WBTC"], addressBook["BAT"], addressBook["ZRX"]]
      var ProxyOracleContract = await OracleProxy.at(proxyOracleAddress)
      var targetPrices = coins.map(coin => {//target all prices to 10
        if(coin == addressBook["USDC"]){
          return [usdcOracleKey, "1000000000000000000000000"]
        }
        if(coin == addressBook["DAI"]){
          return [daiOracleKey, "1000000000000000000000000"]
        }
        return [coin, "1000000000000000000000000"];
      })
      var initialPrices = []
      for(var i = 0; i < cTokens.length; i++){
        var re = await ProxyOracleContract.getUnderlyingPrice.call(cTokens[i])
        initialPrices.push([cTokens[i], re]);
      }
      // console.log(initialPrices.map(prices => {
      //   return [prices[0], prices[1].toString()]
      // }))
      var OracleContract = await Oracle.at(oracleAddress)
      for(var i = 0; i < targetPrices.length; i++){
        await setOraclePrice(targetPrices)
      }

      var finalPrices = []
      for(var i = 0; i < cTokens.length; i++){
        var re = await ProxyOracleContract.getUnderlyingPrice.call(cTokens[i])
        finalPrices.push(re);
      }
      //console.log(finalPrices.map(price => {return price.toString()}))
    })
  })
})