import { MINIMAL_CONTRACT_DEPOSIT } from '@alephium/web3'
import { Deployer, DeployFunction, Network } from '@alephium/cli'
import { Settings } from '../alephium.config'
import { Gift } from '../artifacts/ts'
import { defaultGiftParams } from './utils'

// This deploy function will be called by cli deployment tool automatically
// Note that deployment scripts should prefixed with numbers (starting from 0)
const deployGift: DeployFunction<Settings> = async (deployer: Deployer, network: Network<Settings>): Promise<void> => {
  const result = await deployer.deployContract(Gift, {
    // The initial states of the faucet contract
    initialFields: defaultGiftParams,
    initialAttoAlphAmount: MINIMAL_CONTRACT_DEPOSIT
  })
  console.log('Gift contract id: ' + result.contractInstance.contractId)
  console.log('Gift contract address: ' + result.contractInstance.address)
}

export default deployGift
