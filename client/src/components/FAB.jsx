import { useState } from 'react'
import FABButton from './FABButton'
import Modal from './Modal'
import FormGasto from './FormGasto'
import { criarGasto } from '../api/gastos'

export default function FAB() {
  const [open, setOpen] = useState(false)

  async function salvar(dados) {
    await criarGasto(dados)
    setOpen(false)
    window.dispatchEvent(new CustomEvent('gasto-criado'))
  }

  return (
    <>
      <FABButton cor="#dc2626" onClick={() => setOpen(true)} posicao="center" />
      {open && (
        <Modal titulo="NOVO GASTO" onClose={() => setOpen(false)}>
          <FormGasto onSalvar={salvar} onCancelar={() => setOpen(false)} />
        </Modal>
      )}
    </>
  )
}
