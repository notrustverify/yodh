import React, { useCallback, useEffect, useRef } from 'react'
import store, { StoreBase, StoreType } from 'store2'
import QrCode from './Qrcode'
import Modal from 'react-modal'
import styles from '@/styles/Gift.module.css'
import { Icon } from '@iconify/react'
import { Gift } from '@/services/utils'



export const Gifts = ({gifts}:{gifts:Array<Gift>}) => {
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

  const results: any = []

  const [modalIsOpen, setIsOpen] = React.useState(false)

  const openModal = () => {
    setIsOpen(true)
  }

  const closeModal = () => {
    setIsOpen(false)
  }
  if(gifts !== null){

   gifts.forEach(element => {

   
       let message = element.message
       if (element.message === undefined) message = ''
   
       results.push(
         <div key={element.contractId}>
           <label htmlFor="gift-message">
             <QrCode contractId={element.contractId} message={message} secret={new Uint8Array(Object.values(element.secret))} />
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
          Gift cards created
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
