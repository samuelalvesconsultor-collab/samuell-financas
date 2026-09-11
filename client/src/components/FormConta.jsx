import { useState } from 'react'
import { useApp } from '../context/AppContext'

const RecIcone = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="17 1 21 5 17 9"/>
    <path d="M3 11V9a4 4 0 014-4h14"/>
    <polyline points="7 23 3 19 7 15"/>
    <path d="M21 13v2a4 4 0 01-4 4H3"/>
  </svg>
)

function getStatusUI(conta) {
  if (!conta) return 'pendente'
  if (conta.recorrente) return 'recorrente'
  if (conta.status === 'paga') return 'paga'
  return 'pendente'
}

export default function FormConta({ inicial, onSalvar, onCancelar }) {
  const { categorias, mesSelecionado } = useApp()

  const mesRef = mesSelecionado
    ? `${mesSelecionado}-01`
    : new Date().toISOString().slice(0, 7) + '-01'

  const [form, setForm] = useState({
    descricao:      inicial?.descricao      || '',
    valor:          inicial?.valor          || '',
    dia_vencimento: inicial?.dia_vencimento || '',
    categoria_id:   inicial?.categoria_id   || '',
    mes_referencia: inicial?.mes_referencia || mesRef,
    status_ui:      getStatusUI(inicial),
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // cats precisa vir antes de catSelecionada
  const cats = categorias.filter(c => !c.arquivada)

  const ehInstancia      = !!(inicial?.conta_pai_id)
  const isRec            = form.status_ui === 'recorrente'
  const catSelecionada   = cats.find(c => String(c.id) === String(form.categoria_id))
  const ehAssinatura     = catSelecionada?.nome?.toLowerCase().includes('assinatura') ?? false
  const mostrarSantander = isRec && ehAssinatura

  const STATUS_OPTS = [
    { val: 'pendente',   label: 'Pendente',    desc: 'Aguardando pagamento' },
    { val: 'paga',       label: 'Paga',        desc: 'Já quitada'           },
    ...(!ehInstancia ? [{ val: 'recorrente', label: 'Recorrente', desc: 'Débito automático', icone: <RecIcone /> }] : []),
  ]

  function submit(e) {
    e.preventDefault()
    const payload = {
      descricao:      form.descricao,
      valor:          parseFloat(form.valor),
      dia_vencimento: parseInt(form.dia_vencimento),
      categoria_id:   form.categoria_id || null,
      mes_referencia: form.mes_referencia,
    }

    if (isRec) {
      payload.recorrente       = true
      payload.status           = 'pendente'
      payload.cartao_vinculado = mostrarSantander ? 'Santander' : null
    } else {
      payload.recorrente       = false
      payload.status           = form.status_ui
      payload.cartao_vinculado = null
    }

    onSalvar(payload)
  }

  return (
    <form onSubmit={submit} className="space-y-4">

      {/* Nome */}
      <input
        required
        placeholder="Nome"
        value={form.descricao}
        onChange={e => set('descricao', e.target.value)}
        className="input-dark"
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

      {/* Status — seletor visual */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-faint)' }}>
          Status
        </p>
        <div className={`grid gap-2 ${STATUS_OPTS.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
          {STATUS_OPTS.map(opt => {
            const ativo = form.status_ui === opt.val
            return (
              <button
                key={opt.val}
                type="button"
                onClick={() => set('status_ui', opt.val)}
                className="rounded-xl p-3 text-left transition-all duration-150"
                style={{
                  background: ativo ? 'rgba(220,38,38,0.1)' : 'var(--card-alt)',
                  border: `1.5px solid ${ativo ? '#dc2626' : 'var(--card-border)'}`,
                  boxShadow: ativo ? '0 0 0 2px rgba(220,38,38,0.12)' : 'none',
                }}
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  {opt.icone && (
                    <span style={{ color: ativo ? '#dc2626' : 'var(--text-faint)' }}>{opt.icone}</span>
                  )}
                  <span className="text-xs font-semibold" style={{ color: ativo ? '#ffffff' : 'var(--text-muted)' }}>
                    {opt.label}
                  </span>
                </div>
                <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>
                  {opt.desc}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Categoria — vem antes do aviso Santander para que a seleção seja visível */}
      <select
        value={form.categoria_id}
        onChange={e => set('categoria_id', e.target.value)}
        className="select-dark"
      >
        <option value="">Sem categoria</option>
        {cats.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
      </select>

      {/* Aviso Santander: só quando Recorrente + Assinaturas */}
      {mostrarSantander && (
        <div
          className="rounded-xl px-4 py-3 flex items-center gap-3"
          style={{ background: 'rgba(220,38,38,0.07)', border: '1px solid rgba(220,38,38,0.22)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
          </svg>
          <div>
            <p className="text-xs text-white font-medium">Cartão Santander vinculado automaticamente</p>
            <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-faint)' }}>
              Gera uma ocorrência pendente em cada mês automaticamente.
            </p>
          </div>
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
