import { addressFromContractId, binToHex, contractIdFromAddress, groupOfAddress, NetworkId, web3 } from '@alephium/web3'
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
  pot: boolean
}

export interface TokenList {
   networkId: number;
   tokens:    Token[];
}

export interface Token {
   id:             string;
   name:           string;
   symbol:         string;
   decimals:       number;
   description:    string;
   logoURI:        string;
   nameOnChain?:   string;
   symbolOnChain?: string;
}

export enum WithdrawState {
  Locked = 'Gift',
  Locking = 'Unwrapping your gift',
  Claiming = 'Opening your gift',
  Wrapping = 'Gift wrapping',
  Deposit = 'Adding tokens',
  Cancel = 'Canceling gift',
  Adding = 'Adding tokens'
}

export const GIFT_FACTORY_ADDRESS = process.env.NEXT_PUBLIC_GIFT_FACTORY_ADDRESS ??"23YbSbpLCpz7PpzMZ23ksjNzpiqEDkoqisyY4fLvba61d"

export function getNetwork(): NetworkId {
  const network = (process.env.NEXT_PUBLIC_NETWORK ?? 'testnet') as NetworkId
  return network
}

export function getNode(): string {
  return (process.env.NEXT_PUBLIC_NODE_URL ?? 'https://fullnode-testnet.alephium.notrustverify.ch')
}

export function getUrl(): string {
  return (process.env.NEXT_PUBLIC_URL ?? "https://yodh.app")
}

export function getContractIdGroup(contractId: string): number {
  return groupOfAddress(addressFromContractId(contractId))
}

export function getUrlParams(path: string) {
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
  } catch (error) {
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

export async function getTokenList(): Promise<Token[]>{
   const url = `https://raw.githubusercontent.com/alephium/token-list/master/tokens/${getNetwork()}.json`
   
   const response = await fetch(url);
  
   if (!response.ok) {
     throw new Error('Network response was not ok');
   }
 
   const data: TokenList = await response.json(); // Ensure type assertion here
   return data.tokens; // Correctly returning the value
    
}

export function findTokenFromId(tokenList: Token[], tokenId: string): Token|undefined{
   return tokenList?.find((token) => token.id === tokenId)
}

export const contractIdFromAddressString = (contractAddr: string) =>  {
   return binToHex(contractIdFromAddress(contractAddr))
}

export const isEncodedFormat = (secret: string) => Buffer.from(decodeURIComponent(secret), 'base64').toString('base64') == decodeURIComponent(secret)

export const isBase64 = (secret: string) => Buffer.from(secret, 'base64').toString('base64') == secret

export const getInputDatetime = () => new Date().toISOString()
