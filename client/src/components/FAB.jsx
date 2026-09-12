import { useState } from 'react'
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
      <button
        onClick={() => setOpen(true)}
        className="fixed z-40 flex items-center justify-center rounded-full transition-transform active:scale-95
                   bottom-[5.5rem] left-4 md:bottom-6 md:left-[4.5rem] w-[52px] h-[52px]"
        style={{
          background: '#dc2626',
          boxShadow: '0 4px 20px rgba(220,38,38,0.45)',
        }}
        aria-label="Registrar gasto"
      >
        <span className="text-white text-2xl leading-none select-none font-light">+</span>
      </button>

      {open && (
        <Modal titulo="NOVO GASTO" onClose={() => setOpen(false)}>
          <FormGasto onSalvar={salvar} onCancelar={() => setOpen(false)} />
        </Modal>
      )}
    </>
  )
}
