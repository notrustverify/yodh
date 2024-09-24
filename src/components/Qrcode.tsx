import React, { useCallback, useState } from 'react'
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react'
import Link from 'next/link'
import { CopyToClipboard } from 'react-copy-to-clipboard'
import { FaRegCopy } from 'react-icons/fa'
import { getUrl, shortAddress } from '../services/utils'

export default function QrCode({
  contractId,
  secret,
  message,
  pot
}: {
  contractId: string
  secret: Uint8Array
  message: string
  pot: boolean
}) {
  const [isCopied, setIsCopied] = useState(false)
  const [isCopiedPot, setIsCopiedPot] = useState(false)

  const encodedSecret = Buffer.from(secret).toString('base64')

  const urlToEncode = `${getUrl()}/#contract=${contractId}&secret=${encodeURIComponent(
    encodedSecret
  )}&msg=${encodeURIComponent(message)}`
  const urlPotToEncode = `${getUrl()}/#contract=${contractId}&pot=${pot}`
  return (
    <>
      <p>
        <Link href={urlToEncode} rel="noopener noreferrer" target="_blank">
          Gift URL
        </Link>{' '}
        {isCopied ? (
          'URL Copied'
        ) : (
          <FaRegCopy
            onClick={() => {
              navigator.clipboard.writeText(urlToEncode)
              setIsCopied(true)
            }}
          >
            Copy to Clipboard
          </FaRegCopy>
        )}
        <br />
        {pot && (
          <Link href={urlPotToEncode} rel="noopener noreferrer" target="_blank">
            Add tokens URL
          </Link>
        )}{' '}
      {pot ? isCopiedPot ? (
          'URL Copied'
        ) : (
          <FaRegCopy
            onClick={() => {
              navigator.clipboard.writeText(urlToEncode)
              setIsCopiedPot(true)
            }}
          >
            Copy to Clipboard
          </FaRegCopy>
        ) : '' }
      </p>
      <QRCodeCanvas value={urlToEncode} />
    </>
  )
}
