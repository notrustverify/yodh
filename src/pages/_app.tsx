import React, { useEffect, useState } from 'react'
import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { AlephiumWalletProvider } from '@alephium/web3-react'
import { NodeProvider, web3 } from '@alephium/web3'
import { getContractIdGroup, getNetwork, getNode } from '../services/utils'
import { useRouter } from 'next/router'

interface Params {
   contract: string;
   secret: string;
   msg: string;
   pot: boolean;
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
        const pot =  Boolean(searchParams.get('pot'))|| false
   
        setParams({
          contract,
          secret,
          msg,
          pot
        });
      
      }
   
    }, [router.isReady, router.asPath]);


  return (
    <AlephiumWalletProvider
      network={getNetwork()}
      addressGroup={0}
      theme="rounded"
    >
      <Component {...pageProps} contractIdUrl={params?.contract} secret={params?.secret} msg={params?.msg} pot={params?.pot} />
    </AlephiumWalletProvider>
  )
}
