import React from 'react'
import { findTokenFromId, shortAddress, Token } from '@/services/utils'
import { ALPH_TOKEN_ID, number256ToNumber } from '@alephium/web3'
import { GiftTypes } from 'artifacts/ts'
import AlephiumDomain from './ANS'

export default function TokenGifted({
  tokenList,
  contractState
}: {
  tokenList: Token[]
  contractState: GiftTypes.State
}) {
  const results: JSX.Element[] = []

  if (contractState.asset.tokens !== undefined) {
    if (contractState.asset.tokens.length <= 0)
      results.push(<span key={ALPH_TOKEN_ID}>{number256ToNumber(contractState.asset.alphAmount, 18)} ALPH</span>)

    contractState.asset.tokens.forEach((element) => {
      const token = findTokenFromId(tokenList, element.id)
      if (token !== undefined) {
        const tokenAmount = number256ToNumber(element.amount, token.decimals)
        const tokenSymbol = token.symbol

        results.push(
          <span key={element.id}>
            {tokenAmount} {tokenSymbol}{' '}
          </span>
        )
      }
    })
  }

  return (
    <label htmlFor="gift-message">
      {contractState !== undefined && (
        <p>
          {' '}
          {shortAddress(contractState.fields.sender)} sent you {results}
        </p>
      )}
    </label>
  )
}
