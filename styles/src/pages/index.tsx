import React, { useEffect, useState } from 'react'
import Head from 'next/head'
import styles from '@/styles/Home.module.css'
import { AlephiumConnectButton, useWallet } from '@alephium/web3-react'
import { useRouter } from 'next/router'
import { WithdrawDapp } from '@/components/Withdraw'
import Link from 'next/link'
import NewGift from '@/components/NewGift'
import { getContractIdGroup } from '@/services/utils'
import { useWalletConfig } from '@alephium/web3-react'

interface Params {
   contract: string;
   secret: string;
   msg: string;
}

export default function Home({contract, secret, msg}:{contract:string, secret:string, msg:string}) {
  
   console.log(contract)
  return (
    <>
      <div className={styles.container}>
        <Head>
          <title>Yodh</title>
          <meta name="description" content="Create ALPH digital gift cards easily." />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        
         { contract === undefined ? <NewGift /> : <WithdrawDapp contractId={contract} secret={secret} message={msg} />}
      </div>
    </>
  )
}
