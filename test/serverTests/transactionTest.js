const TestNet = require('./testModules/testNet')
const Web3 = require('web3')
const net = require('net')
const { assert, expect } = require('chai')

const forkIpAddr = "ws://localhost:9545"
const nodeIpAddr = "ws://localhost:8546"
const blockNum = "10441747"
const forkPort = "9545"
const userAdr = "0xf9f62fe6905c8d955f66011f3d86862844fb8084"
const userKey = "0a3e6c42804a4b820257c00389c6ec7d0b28aa7fb5b025b845975d11e7fc30dc"
const oracleAdmin = "0x3c6809319201b978D821190Ba03fA19A3523BD96"
richAccounts = {
  WBTC : "0xf854EE7048f7d5E61233A0663dC36D88dA779C39",
  USDC : "0x92d7796c04EE34d1D16c57fAB92Fc2bCCf434468",
  BAT : "0xBE0eB53F46cd790Cd13851d5EFf43D12404d33E8",
  REP : "0xBE0eB53F46cd790Cd13851d5EFf43D12404d33E8",
  ZRX : "0xBE0eB53F46cd790Cd13851d5EFf43D12404d33E8",
  ETH : "0xBE0eB53F46cd790Cd13851d5EFf43D12404d33E8",
  DAI : "0x9eB7f2591ED42dEe9315b6e2AAF21bA85EA69F8C",
  USDT : "0x5041ed759Dd4aFc3a72b8192C143F72f4724081A",

  toArray : () => {
    return [this.WBTC, this.USDC, this.BAT, this.REP, this.ZRX, this.ETH, this.DAI, this.USDT]
  }
}
accountArray = richAccounts.toArray().push(oracleAdmin)
const unlockAccounts = accountArray
var testNet = new TestNet(nodeIpAddr, blockNum, unlockAccounts, forkPort)
var web3

before(function(done){
  var provider = new Web3(nodeIpAddr, net)
  web3 = new Web3(provider)
  web3.currentProvider.on("connect", () => {
    console.log("found ethereum node to fork from @ " + nodeIpAddr)
    done()
  })
})

describe('ganache fork setup', () => {

  before(async () => {
    await testNet.init();
  })

  it("Should connect to the ganache fork", async () => {
    const provider = new Web3(forkIpAddr, net)
    web3 = new Web3(provider)
    await web3.currentProvider.on("connect", function(){})

  })

  it("Should be able to send transactions from unlocked accounts", async () => {
    await web3.eth.personal.unlockAccount(richAccounts.ETH, '', 1000000000000).then(console.log)

    //var str = await web3.eth.sendTransaction({from: richAccounts.ETH, to: userAdr, value: web3.utils.toWei("100")}, '')
  })
  

})










//function changePrice()