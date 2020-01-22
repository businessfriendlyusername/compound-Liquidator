const fs = require('fs')
const logging = require('./logging')
const Web3 = require('web3')
const net = require('net')


const config = JSON.parse(fs.readFileSync(__dirname + "/config.json", "utf8"))

const loggerOutFile = config.logToFile ? config.logFile : false
const log = new logging(
  outputPath=loggerOutFile, 
  console=config.logToConsole, 
  verbosity=config.loggingVerbosity)

log.info(`Logger initialized with verbosity: ${config.loggingVerbosity}`);
log.info(`Logger outputting to: ${config.logFile}`);


const provider = config.useIPC ? new Web3.providers.IpcProvider(config.IPC, net) : new Web3(config.WS, net)
const web3 = new Web3(provider)

module.exports = {
  log,
  web3,
  config,
  provider
}