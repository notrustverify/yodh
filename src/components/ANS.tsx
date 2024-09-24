import { getNode, shortAddress } from '@/services/utils'
import { ANS } from '@alph-name-service/ans-sdk'
import React, { useEffect, useState } from 'react'

export default function AlephiumDomain({ addressParams }: { addressParams: string }) {
   const [ansName, setAnsName] = useState<string>(shortAddress(addressParams))
   const [mounted, setMounted] = useState<boolean>(false)
 
   useEffect(() => {
     const fetchAnsProfile = async (address: string) => {
       try {
         const ans = new ANS('mainnet', false, getNode())
         const profile = await ans.getProfile(address)
         if (profile?.name) {
           return profile.name
         }
       } catch (error) {
         console.error('Error fetching ANS:', error)
       }
     }
     if (addressParams) {
       fetchAnsProfile(addressParams).then((name) => {
         name !== undefined && setAnsName(name)
       })
     }
   }, [addressParams])
 
   useEffect(() => {
     setMounted(true)
   }, [])
 
   if (!mounted) return null

  return <span>{ansName}</span>
}
