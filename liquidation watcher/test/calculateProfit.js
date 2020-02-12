const cTokens = require('../contracts/cTokens')
const comptrollerContract = require('../contracts/comptrollerContract')
const priceOracleContract = require('../contracts/priceOracleContract')
const Web3 = require('web3')
const net = require('net')

const local = "ws://127.0.0.1:8546"
const infura = "wss://mainnet.infura.io/ws/v3/1e6dafd39f064e1cb74ca7e7115ef345"
const ipc = new Web3.providers.IpcProvider("/home/belvis/.ethereum/geth.ipc", net)
const startingBlock = 7722506 //when the first compound contract deployed 
const provider = ipc//new Web3(local, net)
const web3 = new Web3(provider)

// const cZRX = new web3.eth.Contract(cTokens.cZRX.abi, cTokens.cZRX.address)
// const cWBTC = new web3.eth.Contract(cTokens.cWBTC.abi, cTokens.cWBTC.address)
// const cUSDC = new web3.eth.Contract(cTokens.cUSDC.abi, cTokens.cUSDC.address)
// const cSAI = new web3.eth.Contract(cTokens.cSAI.abi, cTokens.cSAI.address)
// const cREP = new web3.eth.Contract(cTokens.cREP.abi, cTokens.cREP.address)
// const cETH = new web3.eth.Contract(cTokens.cETH.abi, cTokens.cETH.address)
// const cDAI = new web3.eth.Contract(cTokens.cDAI.abi, cTokens.cDAI.address)
// const cBAT = new web3.eth.Contract(cTokens.cBAT.abi, cTokens.cBAT.address)
const comptroller = new web3.eth.Contract(comptrollerContract.abi, comptrollerContract.address)
const priceOracle = new web3.eth.Contract(priceOracleContract.abi, priceOracleContract.address)
const flashLoanRate = 35 //the flash loan rate in basis points -- flash loan fee is always 35 basis points as far as i can tell


//~~~~~~~~~~~~~~~~~~~~~~~~~~~init state vars~~~~~~~~~~~~~~~~~~~~~~~~~~~~

cTokenAddresses = []
cTokenContracts = {}

var tokenData = {}
cTokens.entries().forEach(cToken => {
  cTokenAddresses.push(cToken.address)
  cTokenContracts[cToken.address] = new web3.eth.Contract(cToken.abi, cToken.address)
  tokenData[cToken.address] = {
    underlyingAddress = cToken.underlyingAddress,
    priceInEth = null,
    exchangeRate = null,
    flashLoanLiquidity = null
  }
})
var closeFactor = null
var liquidationIncentive = null



syncData = async () => {

}




calculateProfit = address => {


}