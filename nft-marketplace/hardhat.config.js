require("@nomiclabs/hardhat-waffle");


module.exports = {
  networks:{
    hardhat:{
      chainId:1337
    },
    // mumbai:{
    //   url:`https://polygon-mumbai.infura.io/v3/${process.env.INFURA_POLYGON_PROJECT_ID}`,
    //   accounts:[]
    // },
    // mainnet:{
    //   url:`https://polygon-mainnet.infura.io/v3/${process.env.INFURA_POLYGON_PROJECT_ID}`,
    //   accounts:[]
    // },
  },
  solidity: {
    version: "0.8.4",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  }
};
