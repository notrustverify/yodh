import React, { useEffect, useState } from 'react'
import { usePDF } from '@react-pdf/renderer'
import { FiDownload } from 'react-icons/fi'
import { createGiftPdfDocument, GiftPdfProps } from './Pdf'

export default function GiftPdfDownload(props: GiftPdfProps) {
  const [document, setDocument] = useState<Awaited<ReturnType<typeof createGiftPdfDocument>>>()
  const [error, setError] = useState('')
  const { sender, contractId, message, secret, amount, tokenSymbol, customPassword, example } = props
  useEffect(() => {
    let cancelled = false
    setDocument(undefined)
    setError('')
    createGiftPdfDocument({ sender, contractId, message, secret, amount, tokenSymbol, customPassword, example })
      .then((document) => {
        if (!cancelled) setDocument(document)
      })
      .catch(() => {
        if (!cancelled) setError('Could not prepare the gift PDF. Please try again.')
      })
    return () => {
      cancelled = true
    }
  }, [sender, contractId, message, secret, amount, tokenSymbol, customPassword, example])
  if (error) return <p role="alert">{error}</p>
  if (!document) return <p role="status">Preparing your gift card…</p>
  return <PreparedGiftPdf document={document} />
}

function PreparedGiftPdf({ document }: { document: Awaited<ReturnType<typeof createGiftPdfDocument>> }) {
  const [instance, updateInstance] = usePDF({ document })
  useEffect(() => {
    updateInstance(document)
  }, [document, updateInstance])
  if (instance.error) return <p role="alert">PDF generation failed. Please try again.</p>
  if (instance.loading || !instance.url) return <p role="status">Generating PDF…</p>
  return (
    <a href={instance.url} download="yodh-gift-card.pdf">
      <FiDownload aria-hidden="true" /> Download gift card
    </a>
  )
}
