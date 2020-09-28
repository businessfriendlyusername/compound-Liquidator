const Migrations = artifacts.require("Migrations");
const Dai = artifacts.require("Dai");
const DaiMintable = artifacts.require("DaiMintable");
const TestRouter = artifacts.require("TestRouter")

module.exports = function(deployer) {
  deployer.deploy(Migrations);
  deployer.deploy(Dai, "1");
  deployer.deploy(DaiMintable, "1");
  deployer.deploy(TestRouter)
};
