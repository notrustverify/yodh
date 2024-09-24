import React, { useEffect, useState } from 'react'
import Head from 'next/head'
import styles from '@/styles/Home.module.css'
import { WithdrawDapp } from '@/components/Withdraw'
import NewGift from '@/components/NewGift'
import { useRouter } from 'next/router'

export default function Home({ contractIdUrl, secret, msg, pot }: { contractIdUrl: string; secret: string; msg: string, pot: boolean }) {
  const router = useRouter()
  const [contractId, setContractId] = useState<string | undefined>(undefined)

  // when navigating back to the main page reset contractid
  useEffect(() => {
    // This ensures the code runs on the client-side only
    if (!router.isReady) return
    // Parse the URL fragment (hash) from the router's `asPath`
    const hashIndex = router.asPath.indexOf('#')
    hashIndex > -1 ? setContractId(contractIdUrl) : setContractId(undefined)

  }, [router.isReady, router.asPath, contractIdUrl])
  return (
    <>
      <div className={styles.container}>
        <Head>
          <title>Yodh</title>
          <meta name="description" content="Create ALPH digital gift cards easily." />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/favicon.ico" />
        </Head>

        {pot || contractId === undefined ? <NewGift pot={pot} contractIdParam={contractId} /> : <WithdrawDapp contractId={contractId} secret={secret} message={msg} />}
      </div>
    </>
  )
}
