require("@nomiclabs/hardhat-waffle");
const fs = require('fs');

const privateKey = fs.readFileSync(".secret").toString().trim() || "01234567890123456789";
const infuraProject = fs.readFileSync(".project").toString().trim() || "01234567890123456789";

module.exports = {
  networks:{
    hardhat:{
      chainId:1337
    },
    mumbai:{
      url:`https://polygon-mumbai.infura.io/v3/${infuraProject}`,
      accounts:[privateKey]
    },
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
