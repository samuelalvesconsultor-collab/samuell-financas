import { useState } from 'react'
import { useApp } from '../context/AppContext'

function getTipoPagamento(inicial) {
  if (!inicial) return 'avista'
  if (inicial.recorrente || inicial.tipo_pagamento === 'recorrente') return 'recorrente'
  return inicial.tipo_pagamento || 'avista'
}

const toDateStr = v => (!v ? '' : String(v).slice(0, 10))

export default function FormConta({ inicial, onSalvar, onCancelar }) {
  const { categorias, mesSelecionado } = useApp()

  const mesRef = mesSelecionado
    ? `${mesSelecionado}-01`
    : new Date().toISOString().slice(0, 7) + '-01'

  const [form, setForm] = useState({
    descricao:       inicial?.descricao       || '',
    valor:           inicial?.valor           || '',
    dia_vencimento:  inicial?.dia_vencimento  || '',
    tipo_pagamento:  getTipoPagamento(inicial),
    categoria_id:    inicial?.categoria_id    || '',
    forma_pagamento: inicial?.forma_pagamento || 'boleto',
    num_parcelas:    inicial?.num_parcelas    || '',
    cartao_vinculado: inicial?.cartao_vinculado || 'Santander',
    mes_referencia:  toDateStr(inicial?.mes_referencia) || mesRef,
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const cats = categorias.filter(c => !c.arquivada && (c.tipo === 'saida' || c.tipo === 'ambos'))
  const isRec = form.tipo_pagamento === 'recorrente'
  const isParc = form.tipo_pagamento === 'parcelado'
  const isCredito = form.forma_pagamento === 'credito'
  const ehInstancia = !!(inicial?.conta_pai_id)

  const TIPO_OPTS = [
    { val: 'avista',    label: 'À vista',   desc: 'Pagamento único' },
    { val: 'parcelado', label: 'Parcelado', desc: 'Em parcelas'     },
    ...(!ehInstancia ? [{ val: 'recorrente', label: 'Recorrente', desc: 'Todo mês' }] : []),
  ]

  function submit(e) {
    e.preventDefault()
    const payload = {
      descricao:       form.descricao,
      valor:           parseFloat(form.valor),
      dia_vencimento:  parseInt(form.dia_vencimento),
      categoria_id:    form.categoria_id || null,
      mes_referencia:  form.mes_referencia,
      tipo_pagamento:  form.tipo_pagamento,
    }

    if (isRec) {
      payload.recorrente       = true
      payload.status           = 'pendente'
      payload.forma_pagamento  = form.forma_pagamento
      payload.cartao_vinculado = isCredito ? form.cartao_vinculado : null
    } else {
      payload.recorrente       = false
      payload.status           = 'pendente'
      payload.forma_pagamento  = form.forma_pagamento
      if (isParc && form.num_parcelas) {
        payload.num_parcelas   = parseInt(form.num_parcelas)
        payload.cartao_vinculado = isCredito ? form.cartao_vinculado : null
      }
    }

    onSalvar(payload)
  }

  return (
    <form onSubmit={submit} className="space-y-4">

      {/* Nome */}
      <input
        required
        placeholder="Nome da conta"
        value={form.descricao}
        onChange={e => set('descricao', e.target.value)}
        className="input-dark"
        autoFocus
      />

      {/* Valor + Dia vencimento */}
      <div className="grid grid-cols-2 gap-2">
        <input
          required type="number" step="0.01" min="0.01"
          placeholder="Valor (R$)"
          value={form.valor}
          onChange={e => set('valor', e.target.value)}
          className="input-dark"
        />
        <input
          required type="number" min="1" max="31"
          placeholder="Dia vencimento"
          value={form.dia_vencimento}
          onChange={e => set('dia_vencimento', e.target.value)}
          className="input-dark"
        />
      </div>

      {/* Status / Tipo */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-faint)' }}>
          Status
        </p>
        <div className={`grid gap-2 ${TIPO_OPTS.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
          {TIPO_OPTS.map(opt => {
            const ativo = form.tipo_pagamento === opt.val
            return (
              <button
                key={opt.val}
                type="button"
                onClick={() => set('tipo_pagamento', opt.val)}
                className="rounded-xl p-3 text-left transition-all duration-150"
                style={{
                  background: ativo ? 'rgba(220,38,38,0.1)' : 'var(--card-alt)',
                  border: `1.5px solid ${ativo ? '#dc2626' : 'var(--card-border)'}`,
                  boxShadow: ativo ? '0 0 0 2px rgba(220,38,38,0.12)' : 'none',
                }}
              >
                <p className="text-xs font-semibold" style={{ color: ativo ? '#ffffff' : 'var(--text-muted)' }}>
                  {opt.label}
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-faint)' }}>
                  {opt.desc}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Categoria */}
      <select
        value={form.categoria_id}
        onChange={e => set('categoria_id', e.target.value)}
        className="select-dark"
      >
        <option value="">Sem categoria</option>
        {cats.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
      </select>

      {/* Forma de pagamento */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-faint)' }}>
          Forma de pagamento
        </p>
        <div className="grid grid-cols-3 gap-2">
          {[
            { val: 'credito', label: 'Crédito' },
            { val: 'boleto',  label: 'Boleto'  },
            { val: 'pix',     label: 'PIX'     },
          ].map(opt => {
            const ativo = form.forma_pagamento === opt.val
            return (
              <button
                key={opt.val}
                type="button"
                onClick={() => set('forma_pagamento', opt.val)}
                className="rounded-xl py-2.5 text-center text-xs font-semibold transition-all duration-150"
                style={{
                  background: ativo ? 'rgba(220,38,38,0.1)' : 'var(--card-alt)',
                  border: `1.5px solid ${ativo ? '#dc2626' : 'var(--card-border)'}`,
                  color: ativo ? '#ffffff' : 'var(--text-muted)',
                }}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Campos condicionais: Parcelado */}
      {isParc && (
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-widest mb-1 block" style={{ color: 'var(--text-faint)' }}>
            Número de parcelas
          </label>
          <input
            required
            type="number"
            min="2"
            max="120"
            placeholder="Ex: 12"
            value={form.num_parcelas}
            onChange={e => set('num_parcelas', e.target.value)}
            className="input-dark"
          />
        </div>
      )}

      {/* Cartão: só quando Parcelado + Crédito, OU Recorrente + Crédito */}
      {isCredito && (isParc || isRec) && (
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-widest mb-1 block" style={{ color: 'var(--text-faint)' }}>
            Qual cartão?
          </label>
          <select
            value={form.cartao_vinculado}
            onChange={e => set('cartao_vinculado', e.target.value)}
            className="select-dark"
          >
            <option value="Santander">Santander</option>
            <option value="Mercado Pago">Mercado Pago</option>
          </select>
        </div>
      )}

      {/* Botões */}
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onCancelar} className="btn-ghost">Cancelar</button>
        <button type="submit" className="btn-primary">
          {isRec ? 'Salvar recorrência' : 'Salvar'}
        </button>
      </div>
    </form>
  )
}
