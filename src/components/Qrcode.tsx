import React, { useCallback, useState } from 'react'
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react'
import Link from 'next/link'
import { CopyToClipboard } from 'react-copy-to-clipboard'
import { FaRegCopy } from "react-icons/fa";
import { getUrl, shortAddress } from '../services/utils'

export default function QrCode({
  contractId,
  secret,
  message
}: {
  contractId: string
  secret: Uint8Array
  message: string
}) {
  const [isCopied, setIsCopied] = useState(false)
  const buttonStyle = isCopied ? { backgroundColor: 'green', color: 'white' } : {}
  const encodedSecret = Buffer.from(secret).toString('base64')

  const urlToEncode = `${getUrl()}/#contract=${contractId}&secret=${encodeURIComponent(encodedSecret)}&msg=${encodeURIComponent(message)}`

  return (
    <>
      
        <p>
          <Link
            href={urlToEncode}
            rel="noopener noreferrer"
            target="_blank"
          >Gift URL</Link>{' '}
            {isCopied ? "URL Copied" : <FaRegCopy style={buttonStyle} onClick={() => {navigator.clipboard.writeText(urlToEncode)
               setIsCopied(true)
            }}>Copy to Clipboard</FaRegCopy>}
        </p>
        <QRCodeCanvas value={urlToEncode} />
    </>
  )
}
