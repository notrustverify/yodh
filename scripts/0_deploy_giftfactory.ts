import { MINIMAL_CONTRACT_DEPOSIT } from '@alephium/web3'
import { Deployer, DeployFunction, Network } from '@alephium/cli'
import { Settings } from '../alephium.config'
import { Gift, GiftFactory, TestOracle } from '../artifacts/ts'
import { defaultGiftParams } from './utils'

// This deploy function will be called by cli deployment tool automatically
// Note that deployment scripts should prefixed with numbers (starting from 0)
const deployGiftFactory: DeployFunction<Settings> = async (
  deployer: Deployer,
  network: Network<Settings>
): Promise<void> => {
  let oracleAddress = network.settings.oracleAddress

  if (undefined !== network.networkId && 4 === network.networkId) {
    const resultOracle = await deployer.deployContract(TestOracle, {
      initialFields: {
        initialValue: {
          value: 2n,
          timestamp: BigInt(Date.now())
        }
      },
      initialAttoAlphAmount: MINIMAL_CONTRACT_DEPOSIT
    })
    oracleAddress = resultOracle.contractInstance.address
  }

  const resultGift = await deployer.deployContract(Gift, {
    // The initial states of the faucet contract
    initialFields: defaultGiftParams,
    initialAttoAlphAmount: MINIMAL_CONTRACT_DEPOSIT
  })

  const result = await deployer.deployContract(GiftFactory, {
    // The initial states of the faucet contract
    initialFields: {
      giftTemplate: resultGift.contractInstance.address,
      oracle: oracleAddress
    },
    initialAttoAlphAmount: MINIMAL_CONTRACT_DEPOSIT
  })
  console.log('GiftFactory contract id: ' + result.contractInstance.contractId)
  console.log('GiftFactory contract address: ' + result.contractInstance.address)
}

export default deployGiftFactory
