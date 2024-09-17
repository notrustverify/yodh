import React, { useEffect, useState } from 'react'
import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { AlephiumWalletProvider, useWalletConfig } from '@alephium/web3-react'
import { NetworkId, web3 } from '@alephium/web3'
import { getContractIdGroup, getNetwork, getNode } from '../services/utils'
import store from 'store2'
import { useRouter } from 'next/router'
import { contract } from '@alephium/web3/dist/src/codec'

interface Params {
   contract: string;
   secret: string;
   msg: string;
}

export default function App({ Component, pageProps }: AppProps) {
   web3.setCurrentNodeProvider(getNode());
   const router = useRouter()
   const [params, setParams] = useState<Params>();

   useEffect(() => {
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
   
        setParams({
          contract,
          secret,
          msg,
        });
      
      }
   
    }, [router.isReady, router.asPath]);


  return (
    <AlephiumWalletProvider
      network={getNetwork()}
      addressGroup={ params !== undefined && getContractIdGroup(params?.contract) || undefined}
      theme="rounded"
    >
      <Component {...pageProps} contract={params?.contract} secret={params?.secret} msg={params?.msg}  />
    </AlephiumWalletProvider>
  )
}
