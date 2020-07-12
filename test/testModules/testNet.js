const ganache = require("ganache-core")

class TestNet {
  //the address of the node and blocknum we are forking from, and an array of unlocked accounts, the port is the port this tesnet will  listen on
  constructor(nodeIpAddr, blockNum, unlockAccounts, forkPort){
    this.nodeIpAddr = nodeIpAddr
    this.blockNum = blockNum
    this.forkPort = forkPort
    this.forkIpAddr = "ws://localhost:" + forkPort
  }

  async init(){
    this.server = ganache.server({fork: this.nodeIpAddr+'@'+this.blockNum, locked: false, accounts: 100})
    try{
      await this.server.listen(this.forkPort)
    } catch(err){
      console.log(err)
    }
    
  }
  
  async reset(){
    await this.init()
  }

}

module.exports = TestNet