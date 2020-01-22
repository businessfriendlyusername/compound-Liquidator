const fs = require('fs')
const logging = require('./logging')
const Web3 = require('web3')
const net = require('net')
const sleep = require('system-sleep')

const config = JSON.parse(fs.readFileSync(__dirname + "/config.json", "utf8"))

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~logger initialization~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
const loggerOutFile = config.logToFile ? config.logFile : false
const log = new logging(
  outputPath=loggerOutFile, 
  console=config.logToConsole, 
  verbosity=config.loggingVerbosity)

log.info(`Logger initialized with verbosity: ${config.loggingVerbosity}`);
log.info(`Logger outputting to: ${config.logFile}`);

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~Ethereum node connection~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
let provider = 'fuck you javascript scope eat my ass'
var connectedToEthereum = false
if(config.useIPC) {
  log.info(`connecting to Ethereum node via IPC endpoint at ${config.ipc}`)
  provider = new Web3.providers.IpcProvider(config.ipc, net)
}
else{
  log.info(`connecting to Ethereum node via Websocket at ${config.ws}`)
  provider = new Web3(config.ws, net)
}

const web3 = new Web3(provider)
web3.currentProvider.on("connect", () => {
  connectedToEthereum = true
  log.info(`Successfully connected to Ethereum`)
})
while(!connectedToEthereum) {
  sleep(10)
}

module.exports = {
  log,
  web3,
  config,
  provider
}