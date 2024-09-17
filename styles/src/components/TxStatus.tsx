import React, { useCallback, useRef } from 'react'
import { useTxStatus } from '@alephium/web3-react'
import { node } from '@alephium/web3'
import { BarLoader, GridLoader, PropagateLoader, RiseLoader } from 'react-spinners'
import { WithdrawState } from '@/services/utils'

interface TxStatusAlertProps {
  txId: string
  txStatusCallback(status: node.TxStatus, numberOfChecks: number): Promise<any>
  step?: WithdrawState

}

export const TxStatus = ({ txId, txStatusCallback, step}: TxStatusAlertProps) => {
  const numberOfChecks = useRef(0)
  const callback = useCallback(
    async (status: node.TxStatus) => {
      numberOfChecks.current += 1
      return txStatusCallback(status, numberOfChecks.current)
    },
    [txStatusCallback, numberOfChecks]
  )

  const { txStatus } = useTxStatus(txId, callback)


  return (
    <>
     <h3 style={{ margin: 0 }}>
         <code>{txStatus?.type !== 'Confirmed' && step}</code>
      </h3>
      <br/>
      <h3>
       <PropagateLoader color='#8288f1' loading={txStatus?.type !== 'Confirmed'} />
      </h3>
      <br/>
    </>
  )
}
