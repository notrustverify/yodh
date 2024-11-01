import React, { useState } from 'react'
import { findTokenFromId, shortAddress, Token } from '@/services/utils'
import { ALPH_TOKEN_ID, MINIMAL_CONTRACT_DEPOSIT, number256ToNumber } from '@alephium/web3'
import { GiftTypes } from 'artifacts/ts'
import AlephiumDomain from './ANS'
import { CoinGeckoClient } from 'coingecko-api-v3'

export default function TokenGifted({
  tokenList,
  contractState,
  percentage
}: {
  tokenList: Token[]
  contractState: GiftTypes.State
  percentage: number | undefined
}) {
  const results: JSX.Element[] = []

  if (contractState.asset.tokens !== undefined) {
    if (number256ToNumber(contractState.asset.alphAmount, 18) > 0.1) {

      let percentageTxt = ''
      if(percentage !== undefined && contractState.fields.version >= 1n)
         percentageTxt = percentage > 0 ? `(+${percentage.toFixed(2)}%)` : `(${percentage?.toFixed(2)}%)`

      results.push(
        <>
          {number256ToNumber(contractState.asset.alphAmount, 18)} ALPH {percentageTxt} {contractState.fields.version >= 1n && <small>since the gift was created</small>}
        </>
      )

    }

    contractState.asset.tokens.forEach((element) => {
      const token = findTokenFromId(tokenList, element.id)
      if (token !== undefined) {
        const tokenAmount = number256ToNumber(element.amount, token.decimals)
        const tokenSymbol = token.symbol

        results.push(
          <>
            {' / '}
            {tokenAmount} {tokenSymbol}{' '}
          </>
        )
      }
    })
  }

  return (
    <label htmlFor="gift-message">
      {contractState !== undefined && (
        <p>
          {' '}
          <AlephiumDomain addressParams={contractState.fields.sender} /> sent you {results}
        </p>
      )}
    </label>
  )
}
