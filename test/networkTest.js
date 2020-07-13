const Web3 = require('web3')
const GM = require('godmode-for-test');
const { Contract } = require('web3-eth-contract');
const { assert } = require('console');

const Dai = artifacts.require("Dai")
const DaiMintable = artifacts.require("DaiMintable")

let GODMODE = new GM("mainnet", "ws://localhost:8546");

Contract("Godmode Network setup demo", function(accounts) {
  
  describe("remove permission to mint ERC20", () => {
    before(async function() {
      await GODMODE.open();
    });
  
    after(async function() {
      await GODMODE.close();
    });
  
    it("mint dai using godmode", async () => {
      let daiContract = await Dai.at("0x6B175474E89094C44Da98b954EedeAC495271d0F")//let dai be the mainnet address of dai
      assert.equal(await daiContract.balanceOf(accounts[0]))

      assert.isNotZero(await daiContract.balanceOf("0xA478c2975Ab1Ea89e8196811F51A7B7Ade33eB11"))//make sure the mainnet uniswap balance is not 0

      await GODMODE.executeAs(
        Dai,
        DaiMintable,
        "Mint", 1, accounts[0],
        {from: accounts[0]}
      );

      assert.equal(await daiContract.balanceOf(accounts[0], 1))
    })
  })
  
})