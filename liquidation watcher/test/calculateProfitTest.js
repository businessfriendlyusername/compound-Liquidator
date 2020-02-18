const functions = require('./calculateProfit')
const assert = require('chai').assert

const Web3 = require('web3')
const net = require('net')
const logger = require('tracer').console()
const bigNumber = require('bignumber.js')
const uniswap = require('@uniswap/sdk')

const local = "ws://127.0.0.1:8546"
const infura = "wss://mainnet.infura.io/ws/v3/1e6dafd39f064e1cb74ca7e7115ef345"
const ipc = new Web3.providers.IpcProvider("/home/belvis/.ethereum/geth.ipc", net)
const provider = new Web3(infura, net)
const web3 = new Web3(provider)

describe('#calculateProfit tests', () => {
  context('it finds the largest borrow/collateral correctly', () => {
    
  })
})