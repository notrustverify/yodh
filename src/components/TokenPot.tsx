import React from 'react'
import { findTokenFromId, shortAddress, Token } from '@/services/utils'
import { number256ToNumber, ONE_ALPH } from '@alephium/web3'
import { GiftTypes } from 'artifacts/ts'
import AlephiumDomain from './ANS'

export default function TokenPot({
  tokenList,
  contractState
}: {
  tokenList: Token[]
  contractState: GiftTypes.State
}) {
  const results: JSX.Element[] = []

  if (contractState.asset.tokens !== undefined) {
    if (number256ToNumber(contractState.asset.alphAmount,18) > 0.1)
      results.push(<>{number256ToNumber(contractState.asset.alphAmount, 18)} ALPH</>)

    contractState.asset.tokens.forEach((element) => {
      const token = findTokenFromId(tokenList, element.id)
      if (token !== undefined) {
        const tokenAmount = number256ToNumber(element.amount, token.decimals)
        const tokenSymbol = token.symbol

        results.push(
          <>
            {' / '}{tokenAmount} {tokenSymbol}{' '}
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
          Tokens in the pool: {results}
        </p>
      )}
    </label>
  )
}
