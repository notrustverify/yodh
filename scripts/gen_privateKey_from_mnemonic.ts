import { web3 } from "@alephium/web3";
import { deriveHDWalletPrivateKeyForGroup, PrivateKeyWallet } from "@alephium/web3-wallet";
import * as bip39 from "bip39";

web3.setCurrentNodeProvider('https://fullnode-testnet.alephium.notrustverify.ch', undefined, fetch)

const mnemonic = bip39.generateMnemonic(256)
console.log(`Mnemonic: ${mnemonic}`)

const privateKey = deriveHDWalletPrivateKeyForGroup(mnemonic, 0, "default")
console.log(`PrivateKey: ${privateKey[0]}`)

const pkWallet = new PrivateKeyWallet({ privateKey: privateKey[0] })
console.log(`Address: ${pkWallet.address}`)