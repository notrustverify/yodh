import React from 'react'
import { ZERO_ADDRESS } from '@alephium/web3'
import { shortAddress } from '@/services/utils'

export const Locked = ({ announcedAddress, connectedAddress, announcementLockedUntil }:{ announcedAddress:string, connectedAddress:string|undefined, announcementLockedUntil:bigint }) => {

  // Split address if it contains a colon and use the first part
  const addressToCompare = announcedAddress.includes(':') ? 
    announcedAddress.split(':')[0] : 
    announcedAddress

  return (
   <label htmlFor='gift-message'>
   {addressToCompare !== connectedAddress &&
   addressToCompare !== ZERO_ADDRESS ? `Contract is locked by ${shortAddress(addressToCompare)} until ${new Date(
         Number(announcementLockedUntil)
       ).toLocaleString()} `
     : ''}
   </label>
  )
}
