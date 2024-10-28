import { Configuration } from '@alephium/cli'
import { NodeProvider, web3, ZERO_ADDRESS } from '@alephium/web3'
import { configDotenv } from 'dotenv'

// Settings are usually for configuring
export type Settings = {
  oracleAddress: string
}

const defaultSettings: Settings = {
  oracleAddress: ZERO_ADDRESS
}

console.log(process.env.TESTNET_NODE_URL)
configDotenv()
const configuration: Configuration<Settings> = {
  networks: {
    devnet: {
      nodeUrl: process.env.DEVNET_NODE_URL === undefined ? 'http://127.0.0.1:22973' : process.env.DEVNET_NODE_URL,
      // here we could configure which address groups to deploy the contract
      privateKeys: ['a642942e67258589cd2b1822c631506632db5a12aabcf413604e785300d762a5'],
      settings: defaultSettings
    },

    testnet: {
      nodeUrl: process.env.TESTNET_NODE_URL as string,
      privateKeys: process.env.TESTNET_PRIVATE_KEYS === undefined ? [] : process.env.TESTNET_PRIVATE_KEYS.split(','),
      settings: {
        oracleAddress: 'vKdWgyqtQZzAV7eoMXxQCkyiNtceViGZheXC1iHbKFDZ'
      }
    },

    mainnet: {
      nodeUrl: process.env.MAINNET_NODE_URL as string,
      privateKeys: process.env.MAINNET_PRIVATE_KEYS === undefined ? [] : process.env.MAINNET_PRIVATE_KEYS.split(','),
      settings: {
        oracleAddress: '285zrkZTPpUCpjKg9E3z238VmpUBQEAbESGsJT6yX7Rod'
      }
    }
  }
}

let nodeProvider: NodeProvider = new NodeProvider("")
switch(process.env.NETWORK) {
  case configuration.networks.devnet.networkId:
    nodeProvider = new NodeProvider(configuration.networks.devnet.nodeUrl)
    break

  case configuration.networks.testnet.networkId:
    nodeProvider = new NodeProvider(configuration.networks.testnet.nodeUrl)
    break

  case configuration.networks.mainnet.networkId:
    nodeProvider = new NodeProvider(configuration.networks.mainnet.nodeUrl)
    break
}
web3.setCurrentNodeProvider(nodeProvider)

export default configuration
