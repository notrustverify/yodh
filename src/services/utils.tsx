import { addressFromContractId, groupOfAddress, NetworkId, NodeProvider, web3 } from '@alephium/web3'
import router from 'next/router'

export interface TokenFaucetConfig {
  network: NetworkId
  groupIndex: number
  tokenFaucetAddress: string
  faucetTokenId: string
}

export interface Gift {
  contractId: string
  message: string
  secret: Uint8Array
}

export enum WithdrawState {
  Locked = 'Gift',
  Locking = 'Unwrapping your gift',
  Claiming = 'Opening your gift',
  Wrapping = 'Gift wrapping'
}

export function getNetwork(): NetworkId {
  const network = (process.env.NETWORK ?? 'testnet') as NetworkId
  return network
}

export function getNode(): string {
  return (process.env.NODE_URL ?? 'https://fullnode-testnet.alephium.notrustverify.ch')
}

export function getUrl(): string {
  return (process.env.URL ?? "https://yodh.app")
}

export function getContractIdGroup(contractId: string): number {
  return groupOfAddress(addressFromContractId(contractId))
}

export function getUrlParams(path:any) {
  // This ensures the code runs on the client-side only
  if(!router.isReady) return
  // Parse the URL fragment (hash) from the router's `asPath`
  const hashIndex = router.asPath.indexOf('#');

  if (hashIndex > -1) {
    const hash = router.asPath.substring(hashIndex + 1); // Get rid of the `#`
    const searchParams = new URLSearchParams(hash);

    const contract = searchParams.get('contract') || '';
    const secret = searchParams.get('secret') || '';
    const msg = searchParams.get('msg') || '';

    return({
      contract,
      secret,
      msg,
    });

  }
}
export async function contractExists(address: string): Promise<boolean> {
  try {
    const nodeProvider = web3.getCurrentNodeProvider();
    await nodeProvider.contracts.getContractsAddressState(address);
    return true;
  } catch (error: any) {
    if (error instanceof Error && error.message.includes("KeyNotFound")) {
      return false;
    }
    throw error;
  }
}

export function shortAddress(address: string){
  return `${address.substring(0, 3)}...${address.substring(address.length - 3)}`
}

export function getGiftUrl(contractId:string, secret: Uint8Array, message:string){
  const encodedSecret = Buffer.from(secret).toString('base64')

  return `${getUrl()}/#contract=${contractId}&secret=${encodeURIComponent(encodedSecret)}&msg=${encodeURIComponent(message)}`
}
