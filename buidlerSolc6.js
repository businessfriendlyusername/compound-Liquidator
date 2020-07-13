module.exports = {
  defaultNetwork: "develop",

  networks: {
    develop: {
      url: "",
      gas: 6000000
    }
  },

  solc: {
    version: "0.6.6",
    optimizer: {
      enabled: true,
      runs: 200
    }
  },

  paths: {
    sources: "./contracts/solc6",
  },
};