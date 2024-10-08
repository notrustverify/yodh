import React from 'react'
import QrCode from './Qrcode'
import Modal from 'react-modal'
import styles from '@/styles/Gift.module.css'
import { Icon } from '@iconify/react'
import { Gift } from '@/services/utils'

export const Gifts = ({ gifts }:{ gifts:Array<Gift> }) => {
  const customStyles = {
    content: {
      top: '50%',
      left: '50%',
      right: 'auto',
      bottom: 'auto',
      display: 'block',
      transform: 'translate(-50%, -50%)',
      maxHeight: '100vh'
    }
  }

  const results: JSX.Element[] = []

  const [modalIsOpen, setIsOpen] = React.useState(false)

  const openModal = () => {
    setIsOpen(true)
  }

  const closeModal = () => {
    setIsOpen(false)
  }

  if (gifts !== null) {

   gifts.forEach(element => {
   
       let message = element.message
       if (element.message === undefined) message = ''
   
       results.push(
         <div key={element.contractId}>
           <label htmlFor="gift-message">
             <QrCode contractId={element.contractId} message={message} secret={new Uint8Array(Object.values(element.secret))} pot={element.pot}  />
           </label>
         </div>
       )
   });
  
}

  return (
    <>
      <div>
        <button
          className={styles.wrapButtonModal}
          onClick={openModal}
          disabled={gifts === null || gifts.length <= 0}
        >
          Your gifts cards
        </button>
        <Modal
          isOpen={modalIsOpen}
          ariaHideApp={false}
          onRequestClose={closeModal}
          style={customStyles}
          contentLabel="Gift created"
        >
          <button className={styles.wrapButtonModal} onClick={closeModal}>
            <Icon icon="material-symbols:close" />
          </button>
          {results}
        </Modal>
      </div>
    </>
  )
}
