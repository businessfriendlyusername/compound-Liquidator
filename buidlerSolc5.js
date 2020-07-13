module.exports = {
  defaultNetwork: "develop",

  networks: {
    develop: {
      url: "ws://localhost:9545",
      gas: 6000000
    }
  },

  solc: {
    version: "0.5.12",
    optimizer: {
      enabled: true,
      runs: 200
    }
  },

  paths: {
    sources: "./contracts/solc5",
  },
};