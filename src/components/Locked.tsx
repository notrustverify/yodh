import React from 'react'
import { ZERO_ADDRESS } from '@alephium/web3'
import { shortAddress } from '@/services/utils'

export const Locked = ({ announcedAddress, connectedAddress, announcementLockedUntil }:{ announcedAddress:string, connectedAddress:string|undefined, announcementLockedUntil:bigint }) => {
  return (
   <label htmlFor='gift-message'>
   {announcedAddress !== connectedAddress &&
   announcedAddress !== ZERO_ADDRESS ? `Contract is locked by ${shortAddress(announcedAddress)} until ${new Date(
         Number(announcementLockedUntil)
       ).toLocaleString()} `
     : ''}
   </label>
  )
}
