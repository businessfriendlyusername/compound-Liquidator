const fs = require('fs')
const logging = require('./logging')
const Web3 = require('web3')
const net = require('net')
const sleep = require('system-sleep')
const initAccountData = require('./initAccountData')

const startingBlock = 7722506 //when the first compound contract deployed 

const config = JSON.parse(fs.readFileSync(__dirname + "/config.json", "utf8"))

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~logger initialization~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
const loggerOutFile = config.logToFile ? config.logFile : false
const log = new logging(
  outputPath=loggerOutFile, 
  console=config.logToConsole, 
  verbosity=config.loggingVerbosity)
log.info(`Starting up...`)
log.info(`Logger initialized with verbosity: ${config.loggingVerbosity}`);
log.info(`Logger outputting to: ${config.logFile}`);

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~Ethereum node connection~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
let provider = 'fuck you javascript scope eat my ass'
var connectedToEthereum = false
if(config.connectionType === 'ipc') {
  log.info(`connecting to Ethereum node via IPC endpoint at ${config.ipc}`)
  provider = new Web3.providers.IpcProvider(config.ipc, net)
}
else if(config.connectionType === 'ws' || config.connectionType === 'infura'){
  log.info(`connecting to Ethereum node via Websocket at ${config.ws}`)
  provider = new Web3(config.ws, net)
}
else{
  log.crit(`invalid connection type in config file`)
  process.exit()
}

pullSetFromInfura = async (fromBlock, toBlock) => {
  return new Promise((resolve, reject) => {
    let accounts = new Set()
    let promises = []
    for(var block = fromBlock; block < toBlock; block++){//query once each block to avoid infura limits
      promises.push(new Promise((res, rej) => {
        comptroller.getPastEvents('MarketEntered', {fromBlock: block, toBlock: block})
        .then((error, events) => {
          if(error) {
            reject(`couldn't get past events from Block ${block}, shutting down`)
          }
          else {
            events.forEach(event => {
              accounts.add(event.address)
              res()
            })
          }
        })
      }))
    }
    await Promise.all(promises)
    resolve(accounts)
  })
}

pullSetFromNode = async (fromBlock, toBlock) => {
  return new Promise((resolve, reject) => {
    let accounts = new Set()
    comptroller.getPastEvents('MarketEntered', {fromBlock: fromBlock, toBlock: toBlock})
    .then((error, events) => {
      if(error) {
        reject(`couldn't get past events, shutting down`)
      }
      else {
        events.forEach(event => {
          accounts.add(event.address)
        })
        resolve(accounts)
      }
    })
  })
}

scoreAccount = account => {
  
}

const web3 = new Web3(provider)
accounts = new Set()
var syncdTo = 0
web3.currentProvider.on("connect", () => {
  
  log.info(`Successfully connected to Ethereum`)
  log.info(`Pulling Compound accounts from node...`)
  web3.eth.getBlockNumber()
  .then(number => {
    syncdTo = number
    if(config.connectionType === 'infura'){
      pullSetFromInfura(startingBlock, number)
      .then(acc => {
        accounts = acc
        connectedToEthereum = true
      })
      .catch(log.crit)
    }
    else{
      pullSetFromNode(startingBlock, number)
      .then(acc => {
        accounts = acc
        connectedToEthereum = true
      })
      .catch(log.crit)
    }
  })
})

while(!connectedToEthereum) {
  sleep(10)
}

module.exports = {
  log,
  web3,
  config,
  provider,
  connectionType,
  accounts,
  syncdTo
}