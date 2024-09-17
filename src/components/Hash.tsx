import React from 'react'
import { checkHash } from '@/services/gift.service';


export default function Hash({ secret, secretContract }:{ secret: Uint8Array, secretContract: string|undefined}) {

   const isValid = checkHash(secret, secretContract )
   return (<>
      <div>{isValid ? "" : "Secret is not valid"}</div>
   </>)
}