import { MessageHasher } from '@alephium/web3'

type GiftConfiguration = {
  hashAlgo: MessageHasher
}

const giftConfig: GiftConfiguration = {
  hashAlgo: 'sha256' //process.env.NODE_URL as string,
}

export default giftConfig
