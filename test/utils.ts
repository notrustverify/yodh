import { Number256, web3, hashMessage, ZERO_ADDRESS, SignerProvider, Token, Address, ONE_ALPH, waitForTxConfirmation } from "@alephium/web3";
import { deriveHDWalletPrivateKey, PrivateKeyWallet } from "@alephium/web3-wallet";
import { waitForTxConfirmation as _waitTxConfirmed } from "@alephium/web3";
import { testPrivateKey } from "@alephium/web3-test";

import { Gift } from "../artifacts/ts";

web3.setCurrentNodeProvider("http://127.0.0.1:22973", undefined, fetch);

export const defaultSigner = new PrivateKeyWallet({
    privateKey: testPrivateKey,
});

export const DEFAULT_ALPH_AMOUNT_RANDOM_SIGNER = 100n * ONE_ALPH
export async function getRandomSigner(group?: number): Promise<PrivateKeyWallet> {
    const pkWallet = PrivateKeyWallet.Random(group)
    await transferAlphTo(pkWallet.address, DEFAULT_ALPH_AMOUNT_RANDOM_SIGNER)
    return pkWallet
}

export async function deployGift(sender: SignerProvider, senderAddress: string, attoAlphAmount: Number256, secret: string, announcementLockIntervall: bigint = 0n, tokens: Array<Token> = []) {

    return await Gift.deploy(sender, {
        initialFields: {
            sender: senderAddress,
            hashedSecret: hashMessage(secret, "sha256"),
            announcementLockIntervall: announcementLockIntervall,
            announcedAddress: ZERO_ADDRESS,
            announcementLockedUntil: 0n,
            version: 1n,
            isCancellable: true
        },
        initialAttoAlphAmount: attoAlphAmount,
        initialTokenAmounts: tokens
    });
}

// Functions belows are taken from PredictAlph test suite
// https://github.com/notrustverify/predictalph-contracts/blob/predictionv2/test/utils.ts

export const alphBalanceOf = async (address: string): Promise<bigint> => {
    const balances = await web3
        .getCurrentNodeProvider()
        .addresses.getAddressesAddressBalance(address)
    const balance = balances.balance;
    return balance === undefined ? 0n : BigInt(balance)
}

export async function transferAlphTo(to: Address, amount: bigint) {
    const tx = await defaultSigner.signAndSubmitTransferTx({
        signerAddress: defaultSigner.address,
        destinations: [{ address: to, attoAlphAmount: amount }],
    })
    return waitForTxConfirmation(tx.txId, 1, 1000)
  }