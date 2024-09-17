import React from 'react'
import Head from 'next/head'
import styles from '@/styles/Home.module.css'
import { WithdrawDapp } from '@/components/Withdraw'
import NewGift from '@/components/NewGift'

export default function Home({ contract, secret, msg }:{ contract:string, secret:string, msg:string }) {
  
  if (undefined !== contract)
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
