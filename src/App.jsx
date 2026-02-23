import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'

// ══════════════════════════════════════════════════════════════════════════════
//  SUPABASE CLIENT
// ══════════════════════════════════════════════════════════════════════════════
const sb = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      storageKey: 'twr-auth-v4',
      detectSessionInUrl: true,
      lock: (_name, _acquireTimeout, fn) => fn()
    }
  }
)

// ══════════════════════════════════════════════════════════════════════════════
//  DESIGN TOKENS
// ══════════════════════════════════════════════════════════════════════════════
const G   = '#C9A96E'
const BG  = '#080808'
const S1  = '#111111'
const S2  = '#181818'
const S3  = '#222222'
const BR  = '#2A2A2A'
const BRG = '#3A3020'
const TX  = '#E8E2D5'
const TM  = '#888880'
const TD  = '#555550'
const RED = '#C0392B'
const GRN = '#27AE60'
const BLU = '#2E86AB'
const PRP = '#9B59B6'

// ══════════════════════════════════════════════════════════════════════════════
//  ROLE CONFIG
// ══════════════════════════════════════════════════════════════════════════════
const ROLES = {
  director:      { label: 'Director',      color: G   },
  operador:      { label: 'Operador',      color: BLU },
  inversionista: { label: 'Inversionista', color: PRP },
  pending:       { label: 'Pendiente',     color: TM  },
}

const NAV_ITEMS = [
  { id: 'dashboard',      icon: '◈', label: 'Dashboard',      roles: ['director', 'operador'] },
  { id: 'inventario',     icon: '◷', label: 'Inventario',     roles: ['director', 'operador'] },
  { id: 'ventas',         icon: '⇄', label: 'Ventas & Pagos', roles: ['director', 'operador'] },
  { id: 'inversionistas', icon: '◉', label: 'Inversionistas', roles: ['director'] },
  { id: 'contactos',      icon: '◌', label: 'Contactos',      roles: ['director', 'operador'] },
  { id: 'catalogos',      icon: '▤', label: 'Catálogos',      roles: ['director', 'operador'] },
  { id: 'reportes',       icon: '▣', label: 'Reportes',       roles: ['director'] },
  { id: 'mi_cuenta',      icon: '◎', label: 'Mi Cuenta',      roles: ['inversionista'] },
  { id: 'admin',          icon: '⚙', label: 'Administración', roles: ['director'] },
]

// ══════════════════════════════════════════════════════════════════════════════
//  HELPERS
// ══════════════════════════════════════════════════════════════════════════════
const fmt  = n => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(n || 0)
const fmtD = d => d ? new Date(d + 'T00:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
const tod  = () => new Date().toISOString().slice(0, 10)
const uid  = () => 'id_' + Math.random().toString(36).slice(2, 9)
const dias = d => d ? Math.floor((new Date() - new Date(d + 'T00:00:00')) / 86400000) : 0
const statusColor = s => ({ Disponible: GRN, Vendido: TM, Consignado: BLU, Reservado: G, Oportunidad: PRP, Liquidado: GRN })[s] || TM

// ══════════════════════════════════════════════════════════════════════════════
//  DEMO DATA (reemplaza con llamadas a Supabase cuando conectes la DB completa)
// ══════════════════════════════════════════════════════════════════════════════
const DEMO = {
  brands: [], models: [], refs: [], watches: [],
  sales: [], payments: [], contacts: [], suppliers: [],
  clients: [], investors: [],
  // Socios configurables (no hardcodeados)
  socios: [
    { id: 'S1', name: 'Fernando Garduño', participacion: 40, color: '#C9A96E', activo: true },
    { id: 'S2', name: 'TWR Capital',      participacion: 60, color: '#9B59B6', activo: true },
  ],
  // Catálogo de tipos de costo
  tiposCosto: [
    { id: 'TC1', nombre: 'Envío / Flete',     icono: '📦' },
    { id: 'TC2', nombre: 'Autenticación',      icono: '🔍' },
    { id: 'TC3', nombre: 'Reparación',         icono: '🔧' },
    { id: 'TC4', nombre: 'Mantenimiento',      icono: '⚙️'  },
    { id: 'TC5', nombre: 'Seguro',             icono: '🛡️'  },
    { id: 'TC6', nombre: 'Almacenaje',         icono: '🏪' },
    { id: 'TC7', nombre: 'Comisión',           icono: '💼' },
    { id: 'TC8', nombre: 'Otros',              icono: '📋' },
  ],
}

// ══════════════════════════════════════════════════════════════════════════════
//  UI ATOMS
// ══════════════════════════════════════════════════════════════════════════════
function Badge({ label, color, small }) {
  return (
    <span style={{ background: color + '22', color, border: `1px solid ${color}44`, borderRadius: 3, padding: small ? '1px 7px' : '2px 9px', fontSize: small ? 9 : 10, fontFamily: "'DM Mono', monospace", letterSpacing: '.07em', whiteSpace: 'nowrap' }}>
      {label}
    </span>
  )
}

function KPI({ label, value, sub, accent = G }) {
  return (
    <div style={{ background: S1, border: `1px solid ${BR}`, borderTop: `2px solid ${accent}`, borderRadius: 6, padding: '16px 20px' }}>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: TM, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, color: TX, fontWeight: 500, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: TD, marginTop: 5 }}>{sub}</div>}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
//  WATCH CARD
// ══════════════════════════════════════════════════════════════════════════════
function WatchCard({ watch, refs, models, brands, onClick }) {
  const ref   = refs.find(r => r.id === watch.refId)
  const model = models.find(m => m.id === ref?.modelId)
  const brand = brands.find(b => b.id === model?.brandId)

  return (
    <div onClick={onClick}
      style={{ background: S1, border: `1px solid ${BR}`, borderLeft: `3px solid ${statusColor(watch.status)}`, borderRadius: 6, padding: 16, cursor: 'pointer' }}
      onMouseEnter={e => e.currentTarget.style.background = S2}
      onMouseLeave={e => e.currentTarget.style.background = S1}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 17, color: TX }}>{brand?.name} {model?.name}</div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: TM, marginTop: 2 }}>Ref: {ref?.ref || '—'}{watch.serial && ` · S/N: ${watch.serial}`}</div>
        </div>
        <Badge label={watch.status} color={statusColor(watch.status)} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, color: TX }}>{watch.cost ? fmt(watch.cost) : 'Sin precio'}</div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: TD }}>{watch.condition || '—'}</div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: TD }}>{dias(watch.entryDate) > 0 ? `${dias(watch.entryDate)} días` : ''}</div>
        </div>
      </div>
      {watch.stage === 'oportunidad' && watch.priceAsked && (
        <div style={{ marginTop: 8, background: PRP + '11', border: `1px solid ${PRP}33`, borderRadius: 3, padding: '4px 8px', fontFamily: "'DM Mono', monospace", fontSize: 10, color: PRP }}>
          Pedido: {fmt(watch.priceAsked)} · Margen potencial: {fmt(watch.priceAsked - watch.cost)} ({((watch.priceAsked - watch.cost) / watch.cost * 100).toFixed(1)}%)
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
//  DASHBOARD
// ══════════════════════════════════════════════════════════════════════════════
function DashboardModule({ state }) {
  const { watches, sales, investors, brands, models, refs } = state
  const inv     = watches.filter(w => w.stage === 'inventario')
  const opp     = watches.filter(w => w.stage === 'oportunidad')
  const sold    = watches.filter(w => w.stage === 'liquidado')
  const capital = investors.reduce((a, i) => a + i.capitalAportado, 0)
  const utilidad = sales.reduce((a, s) => { const w = watches.find(x => x.id === s.watchId); return a + (s.agreedPrice - (w?.cost || 0)) }, 0)
  const porCobrar = sales.filter(s => s.status !== 'Liquidado').reduce((a, s) => { const c = (s.payments || []).reduce((x, p) => x + p.amount, 0); return a + (s.agreedPrice - c) }, 0)

  const alertas = [
    ...watches.filter(w => w.stage === 'inventario' && dias(w.entryDate) > 60).map(w => {
      const r = refs.find(r => r.id === w.refId), m = models.find(m => m.id === r?.modelId), b = brands.find(b => b.id === m?.brandId)
      return { type: 'warning', msg: `${b?.name || ''} ${m?.name || ''}: +60 días en inventario` }
    }),
    ...sales.filter(s => s.status !== 'Liquidado').map(s => {
      const c = s.payments.reduce((a, p) => a + p.amount, 0)
      return { type: 'danger', msg: `Venta pendiente: saldo de ${fmt(s.agreedPrice - c)}` }
    }),
    ...opp.map(w => {
      const r = refs.find(r => r.id === w.refId), m = models.find(m => m.id === r?.modelId), b = brands.find(b => b.id === m?.brandId)
      return { type: 'info', msg: `Oportunidad sin validar: ${b?.name || ''} ${m?.name || ''}` }
    }),
  ]

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 30, color: TX, fontWeight: 300 }}>The Wrist Room</div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: TM, marginTop: 3, letterSpacing: '.08em' }}>{new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase()}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
        <KPI label="Capital Total"   value={fmt(capital)}   sub={`${investors.length} socios`} />
        <KPI label="Piezas Activas"  value={inv.length}     sub={fmt(inv.reduce((a, w) => a + (w.cost || 0), 0))} accent={GRN} />
        <KPI label="Por Cobrar"      value={fmt(porCobrar)} accent={porCobrar > 0 ? RED : GRN} />
        <KPI label="Utilidad Bruta"  value={fmt(utilidad)}  sub={`${sold.length} relojes vendidos`} accent={BLU} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        <div>
          {alertas.length > 0 && (
            <div style={{ background: S1, border: `1px solid ${BR}`, borderRadius: 6, marginBottom: 16 }}>
              <div style={{ padding: '12px 18px', borderBottom: `1px solid ${BR}`, fontFamily: "'DM Mono', monospace", fontSize: 10, color: TM, letterSpacing: '.1em' }}>ALERTAS · {alertas.length}</div>
              {alertas.map((a, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '10px 18px', borderBottom: i < alertas.length - 1 ? `1px solid ${BR}` : 'none' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: a.type === 'danger' ? RED : a.type === 'warning' ? G : BLU, flexShrink: 0 }} />
                  <span style={{ fontFamily: "'Jost', sans-serif", fontSize: 13, color: TX }}>{a.msg}</span>
                </div>
              ))}
            </div>
          )}
          <div style={{ background: S1, border: `1px solid ${BR}`, borderRadius: 6 }}>
            <div style={{ padding: '12px 18px', borderBottom: `1px solid ${BR}`, fontFamily: "'DM Mono', monospace", fontSize: 10, color: TM, letterSpacing: '.1em' }}>PIPELINE</div>
            <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, textAlign: 'center' }}>
              {[[opp.length, 'Oportunidades', PRP], [inv.length, 'En Inventario', GRN], [sold.length, 'Vendidos', TM]].map(([n, l, c]) => (
                <div key={l}>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: c }}>{n}</div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: TD, marginTop: 3 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={{ background: S1, border: `1px solid ${BR}`, borderRadius: 6, padding: 16 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: TM, letterSpacing: '.1em', marginBottom: 14 }}>SOCIOS</div>
          {investors.map(inv => (
            <div key={inv.id} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontFamily: "'Jost', sans-serif", fontSize: 12, color: TX }}>{inv.name.split(',')[0]}</span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: G }}>{inv.participacion}%</span>
              </div>
              <div style={{ background: S3, borderRadius: 2, height: 3 }}><div style={{ background: G, height: 3, width: `${inv.participacion}%` }} /></div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: TD, marginTop: 2 }}>{fmt(inv.capitalAportado)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
//  INVENTARIO
// ══════════════════════════════════════════════════════════════════════════════
function InventarioModule({ state, setState }) {
  const { watches, sales, brands, models, refs, suppliers, clients } = state
  const [view, setView]         = useState('pipeline')
  const [selWatch, setSelWatch] = useState(null)
  const [showAdd, setShowAdd]   = useState(false)
  const [showSale, setShowSale] = useState(false)
  const [showPay, setShowPay]   = useState(null)
  const [search, setSearch]     = useState('')

  const blank = { refId: '', _brandId: '', _modelId: '', supplierId: '', serial: '', condition: 'Muy Bueno', fullSet: true, papers: true, box: true, cost: '', priceAsked: '', entryDate: tod(), status: 'Oportunidad', notes: '', modoAdquisicion: 'sociedad', splitPersonalizado: null, costos: [] }
  const [wf, setWf] = useState({ ...blank })
  const [sf, setSf] = useState({ clientId: '', saleDate: tod(), agreedPrice: '', notes: '' })
  const [pf, setPf] = useState({ date: tod(), amount: '', method: 'Transferencia', notes: '' })
  const [showAddCosto, setShowAddCosto] = useState(false)
  const [costoForm, setCostoForm] = useState({ tipo: '', fecha: tod(), monto: '', descripcion: '' })

  const filtered = watches.filter(w => {
    if (!search) return true
    const r = refs.find(r => r.id === w.refId), m = models.find(m => m.id === r?.modelId), b = brands.find(b => b.id === m?.brandId)
    return [b?.name, m?.name, r?.ref, w.serial].some(v => v?.toLowerCase().includes(search.toLowerCase()))
  })

  const stages = [
    { id: 'oportunidad', label: 'Oportunidades', color: PRP, items: filtered.filter(w => w.stage === 'oportunidad') },
    { id: 'inventario',  label: 'En Inventario',  color: GRN, items: filtered.filter(w => w.stage === 'inventario')  },
    { id: 'liquidado',   label: 'Vendidos',        color: TM,  items: filtered.filter(w => w.stage === 'liquidado')   },
  ]

  const saveWatch = () => {
    const id = 'W' + uid()
    const stage = wf.status === 'Oportunidad' ? 'oportunidad' : 'inventario'
    setState(s => ({ ...s, watches: [...s.watches, { ...wf, id, stage, cost: +wf.cost || 0, priceAsked: +wf.priceAsked || 0, validatedBy: '', validationDate: '', costos: [] }] }))
    setShowAdd(false); setWf({ ...blank })
  }

  const saveAdditionalCost = () => {
    if (!costoForm.monto || !selWatch) return
    const newCosto = { ...costoForm, monto: +costoForm.monto, tipo: costoForm.tipo || (state.tiposCosto?.[0]?.nombre || 'Otros') }
    const updatedWatch = { ...selWatch, costos: [...(selWatch.costos || []), newCosto] }
    setState(s => ({ ...s, watches: s.watches.map(w => w.id !== selWatch.id ? w : updatedWatch) }))
    setSelWatch(updatedWatch)
    setShowAddCosto(false)
    setCostoForm({ tipo: '', fecha: tod(), monto: '', descripcion: '' })
  }

  const approve = w => {
    setState(s => ({ ...s, watches: s.watches.map(x => x.id !== w.id ? x : { ...x, stage: 'inventario', status: 'Disponible', validatedBy: 'Director', validationDate: tod(), entryDate: tod() }) }))
    setSelWatch(p => ({ ...p, stage: 'inventario', status: 'Disponible', validatedBy: 'Director' }))
  }

  const saveSale = () => {
    const id = 'S' + uid()
    setState(s => ({
      ...s,
      watches: s.watches.map(x => x.id !== selWatch.id ? x : { ...x, status: 'Vendido', stage: 'liquidado' }),
      sales:   [...s.sales, { ...sf, id, watchId: selWatch.id, agreedPrice: +sf.agreedPrice, payments: [], status: 'Pendiente' }]
    }))
    setSelWatch(p => ({ ...p, status: 'Vendido', stage: 'liquidado' }))
    setShowSale(false); setSf({ clientId: '', saleDate: tod(), agreedPrice: '', notes: '' })
  }

  const savePay = saleId => {
    setState(s => ({
      ...s,
      sales: s.sales.map(sale => {
        if (sale.id !== saleId) return sale
        const pays  = [...sale.payments, { ...pf, id: 'PAY' + uid(), amount: +pf.amount }]
        const total = pays.reduce((a, p) => a + p.amount, 0)
        return { ...sale, payments: pays, status: total >= sale.agreedPrice ? 'Liquidado' : total > 0 ? 'Parcial' : 'Pendiente' }
      })
    }))
    setShowPay(null); setPf({ date: tod(), amount: '', method: 'Transferencia', notes: '' })
  }

  const selRef      = selWatch ? refs.find(r => r.id === selWatch.refId) : null
  const selModel    = models.find(m => m.id === selRef?.modelId)
  const selBrand    = brands.find(b => b.id === selModel?.brandId)
  const selSale     = selWatch ? sales.find(s => s.watchId === selWatch.id) : null

  const inputStyle = { background: S3, border: `1px solid ${BR}`, color: TX, padding: '10px 14px', borderRadius: 4, fontFamily: "'Jost', sans-serif", fontSize: 13, width: '100%', outline: 'none' }
  const selStyle   = { ...inputStyle }

  return (
    <div>
      <SH title="Inventario" subtitle={`${watches.length} piezas · ${watches.filter(w => w.stage === 'inventario').length} activas`} action="+ Registrar Pieza" onAction={() => setShowAdd(true)} />

      <div style={{ display: 'flex', gap: 10, marginBottom: 18, alignItems: 'center' }}>
        <input placeholder="Buscar por marca, modelo, ref, serial..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...inputStyle, maxWidth: 360 }} />
        <div style={{ display: 'flex', gap: 0, border: `1px solid ${BR}`, borderRadius: 3, overflow: 'hidden' }}>
          {[['pipeline', 'Pipeline'], ['list', 'Lista']].map(([id, l]) => (
            <button key={id} onClick={() => setView(id)} style={{ padding: '8px 16px', background: view === id ? G : 'transparent', color: view === id ? BG : TM, border: 'none', fontFamily: "'DM Mono', monospace", fontSize: 10, cursor: 'pointer', letterSpacing: '.08em' }}>{l.toUpperCase()}</button>
          ))}
        </div>
      </div>

      {view === 'pipeline' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, alignItems: 'start' }}>
          {stages.map(stage => (
            <div key={stage.id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, paddingBottom: 10, borderBottom: `2px solid ${stage.color}` }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: stage.color }} />
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: stage.color, letterSpacing: '.1em' }}>{stage.label.toUpperCase()}</span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: TD, marginLeft: 'auto' }}>{stage.items.length}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {stage.items.map(w => <WatchCard key={w.id} watch={w} refs={refs} models={models} brands={brands} onClick={() => setSelWatch(w)} />)}
                {stage.items.length === 0 && <div style={{ border: `1px dashed ${BR}`, borderRadius: 6, padding: 20, textAlign: 'center', fontFamily: "'DM Mono', monospace", fontSize: 10, color: TD }}>Sin piezas</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {view === 'list' && (
        <div style={{ background: S1, border: `1px solid ${BR}`, borderRadius: 6, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ borderBottom: `1px solid ${BR}` }}>
              {['Pieza', 'Ref', 'Serial', 'Condición', 'Costo', 'Estado', 'Días'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontFamily: "'DM Mono', monospace", fontSize: 10, color: TM, letterSpacing: '.1em', fontWeight: 400, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.map(w => {
                const r = refs.find(r => r.id === w.refId), m = models.find(m => m.id === r?.modelId), b = brands.find(b => b.id === m?.brandId)
                return (
                  <tr key={w.id} onClick={() => setSelWatch(w)} style={{ borderBottom: `1px solid ${BR}`, cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background = S2} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '11px 14px', fontFamily: "'Jost', sans-serif", fontSize: 13, color: TX }}>{b?.name} {m?.name}</td>
                    <td style={{ padding: '11px 14px', fontFamily: "'DM Mono', monospace", fontSize: 11, color: G }}>{r?.ref || '—'}</td>
                    <td style={{ padding: '11px 14px', fontFamily: "'DM Mono', monospace", fontSize: 11, color: TM }}>{w.serial || '—'}</td>
                    <td style={{ padding: '11px 14px', fontSize: 12, color: TX }}>{w.condition || '—'}</td>
                    <td style={{ padding: '11px 14px', fontFamily: "'DM Mono', monospace", fontSize: 12, color: TX }}>{w.cost ? fmt(w.cost) : '—'}</td>
                    <td style={{ padding: '11px 14px' }}><Badge label={w.status} color={statusColor(w.status)} small /></td>
                    <td style={{ padding: '11px 14px', fontFamily: "'DM Mono', monospace", fontSize: 11, color: TD }}>{dias(w.entryDate)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* DETAIL MODAL */}
      {selWatch && (
        <Modal title={`${selBrand?.name || ''} ${selModel?.name || ''}`} onClose={() => setSelWatch(null)} width={700}>
          <div style={{ display: 'flex', gap: 0, marginBottom: 20, background: S2, borderRadius: 4, overflow: 'hidden' }}>
            {[['oportunidad', 'Oportunidad', PRP], ['inventario', 'En Inventario', GRN], ['liquidado', 'Vendido', TM]].map(([id, label, color], i, arr) => (
              <div key={id} style={{ flex: 1, textAlign: 'center', padding: '9px 4px', background: selWatch.stage === id ? color + '22' : 'transparent', borderRight: i < arr.length - 1 ? `1px solid ${BR}` : 'none' }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: '.1em', color: selWatch.stage === id ? color : TD }}>{label.toUpperCase()}</div>
                {selWatch.stage === id && <div style={{ width: 4, height: 4, borderRadius: '50%', background: color, margin: '4px auto 0' }} />}
              </div>
            ))}
          </div>

          <div style={{ background: S3, borderRadius: 4, padding: '10px 14px', marginBottom: 14 }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: TD, marginBottom: 4 }}>REFERENCIA</div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 16, color: TX }}>{selBrand?.name} {selModel?.name} · <span style={{ color: G }}>{selRef?.ref || '—'}</span></div>
            {selRef && <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: TM, marginTop: 3 }}>{selRef.material} · {selRef.size} · Calibre {selRef.caliber}</div>}
          </div>

          <FR>
            <div>
              <InfoRow label="Número de Serie"  value={selWatch.serial || '—'} />
              <InfoRow label="Condición"         value={selWatch.condition || '—'} />
              <InfoRow label="Fecha ingreso"     value={fmtD(selWatch.entryDate)} />
              <InfoRow label="Días en cartera"   value={`${dias(selWatch.entryDate)} días`} />
              <InfoRow label="Validado"          value={selWatch.validatedBy || 'Pendiente'} color={selWatch.validatedBy ? GRN : G} />
            </div>
            <div>
              <InfoRow label="Full Set" value={selWatch.fullSet === null ? '—' : selWatch.fullSet ? 'Sí' : 'No'} color={selWatch.fullSet ? GRN : RED} />
              <InfoRow label="Papeles"  value={selWatch.papers  === null ? '—' : selWatch.papers  ? 'Sí' : 'No'} color={selWatch.papers  ? GRN : RED} />
              <InfoRow label="Caja"     value={selWatch.box     === null ? '—' : selWatch.box     ? 'Sí' : 'No'} color={selWatch.box     ? GRN : RED} />
              <Divider label="FINANCIERO" />
              <InfoRow label="Costo" value={selWatch.cost ? fmt(selWatch.cost) : '—'} />
              {selWatch.priceAsked > 0 && <InfoRow label="Precio pedido" value={fmt(selWatch.priceAsked)} color={TM} />}
              {selSale && <InfoRow label="Precio venta" value={fmt(selSale.agreedPrice)} color={G} />}
              {selWatch.cost && selSale && <InfoRow label="Utilidad bruta" value={'+' + fmt(selSale.agreedPrice - selWatch.cost)} color={GRN} />}
            </div>
          </FR>

          {selWatch.notes && <div style={{ background: S2, borderRadius: 4, padding: '10px 14px', marginBottom: 14, fontFamily: "'Jost', sans-serif", fontSize: 13, color: TM }}>{selWatch.notes}</div>}

          {selSale && (() => {
            const cob = selSale.payments.reduce((a, p) => a + p.amount, 0)
            const pend = selSale.agreedPrice - cob
            return (
              <>
                <Divider label="VENTA Y PAGOS" />
                <div style={{ background: S2, border: `1px solid ${BR}`, borderRadius: 6, overflow: 'hidden', marginBottom: 14 }}>
                  <div style={{ padding: '10px 14px', borderBottom: `1px solid ${BR}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Badge label={selSale.status} color={selSale.status === 'Liquidado' ? GRN : selSale.status === 'Parcial' ? G : RED} />
                    <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, color: G }}>{fmt(selSale.agreedPrice)}</div>
                  </div>
                  {selSale.payments.map((p, i) => (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderBottom: `1px solid ${BR}`, background: i % 2 === 0 ? S3 : 'transparent' }}>
                      <div>
                        <div style={{ fontFamily: "'Jost', sans-serif", fontSize: 13, color: TX }}>{p.method}{p.notes ? ` · ${p.notes}` : ''}</div>
                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: TM }}>{fmtD(p.date)}</div>
                      </div>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: GRN }}>+{fmt(p.amount)}</div>
                    </div>
                  ))}
                  <div style={{ padding: '10px 14px', background: S3 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: pend > 0 ? 6 : 0 }}>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: TM }}>COBRADO</span>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: GRN }}>{fmt(cob)}</span>
                    </div>
                    {pend > 0
                      ? <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 10px', background: RED + '11', border: `1px solid ${RED}33`, borderRadius: 3 }}>
                          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: RED, fontWeight: 500 }}>SALDO PENDIENTE</span>
                          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: RED, fontWeight: 500 }}>{fmt(pend)}</span>
                        </div>
                      : <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: GRN, textAlign: 'center' }}>✓ LIQUIDADO</div>}
                  </div>
                </div>
                {selSale.status !== 'Liquidado' && (
                  showPay === selSale.id ? (
                    <div style={{ background: S3, border: `1px solid ${BRG}`, borderRadius: 6, padding: 14, marginBottom: 14 }}>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: G, marginBottom: 12, letterSpacing: '.1em' }}>REGISTRAR PAGO</div>
                      <FR>
                        <Field label="Fecha"><input type="date" value={pf.date} onChange={e => setPf(f => ({ ...f, date: e.target.value }))} style={inputStyle} /></Field>
                        <Field label="Monto (MXN)"><input type="number" value={pf.amount} onChange={e => setPf(f => ({ ...f, amount: e.target.value }))} placeholder="0" style={inputStyle} /></Field>
                      </FR>
                      <FR>
                        <Field label="Método"><select value={pf.method} onChange={e => setPf(f => ({ ...f, method: e.target.value }))} style={selStyle}>{['Transferencia', 'Efectivo', 'Cheque', 'Crypto', 'Otro'].map(x => <option key={x}>{x}</option>)}</select></Field>
                        <Field label="Notas"><input value={pf.notes} onChange={e => setPf(f => ({ ...f, notes: e.target.value }))} placeholder="Referencia..." style={inputStyle} /></Field>
                      </FR>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <Btn small variant="secondary" onClick={() => setShowPay(null)}>Cancelar</Btn>
                        <Btn small onClick={() => savePay(selSale.id)} disabled={!pf.amount}>Registrar Pago</Btn>
                      </div>
                    </div>
                  ) : <Btn variant="ghost" onClick={() => setShowPay(selSale.id)}>+ Registrar Pago Parcial</Btn>
                )}
              </>
            )
          })()}


          {/* COSTOS ADICIONALES */}
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${BR}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: TM, letterSpacing: '.1em' }}>COSTOS ADICIONALES</span>
              <button onClick={() => setShowAddCosto(true)}
                style={{ background: 'none', border: `1px solid ${BR}`, color: TM, padding: '3px 10px', borderRadius: 3, fontFamily: "'DM Mono', monospace", fontSize: 9, cursor: 'pointer', letterSpacing: '.08em' }}>
                + Agregar Costo
              </button>
            </div>
            {(selWatch.costos || []).length === 0 && (
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: TD, padding: '6px 0' }}>Sin costos adicionales registrados</div>
            )}
            {(selWatch.costos || []).map((c, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: S2, borderRadius: 3, marginBottom: 3 }}>
                <div>
                  <span style={{ fontFamily: "'Jost', sans-serif", fontSize: 12, color: TX }}>{c.tipo}</span>
                  {c.descripcion && <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: TM, marginLeft: 8 }}>{c.descripcion}</span>}
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: TD, marginLeft: 8 }}>{fmtD(c.fecha)}</span>
                </div>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: RED }}>+{fmt(c.monto)}</span>
              </div>
            ))}
            {(selWatch.costos || []).length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', borderTop: `1px solid ${BR}`, marginTop: 4 }}>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: TM }}>Costo total (base + adicionales)</span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: G }}>
                  {fmt(selWatch.cost + (selWatch.costos || []).reduce((a, c) => a + c.monto, 0))}
                </span>
              </div>
            )}
          </div>

          {showAddCosto && (
            <div style={{ background: S3, border: `1px solid ${BRG}`, borderRadius: 6, padding: 14, marginTop: 10 }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: G, marginBottom: 12, letterSpacing: '.1em' }}>NUEVO COSTO</div>
              <FR>
                <Field label="Tipo">
                  <select value={costoForm.tipo} onChange={e => setCostoForm(f => ({ ...f, tipo: e.target.value }))}
                    style={{ background: S3, border: `1px solid ${BR}`, color: TX, padding: '10px 14px', borderRadius: 4, fontFamily: "'Jost', sans-serif", fontSize: 13, width: '100%', outline: 'none' }}>
                    {(state.tiposCosto || []).map(t => <option key={t.id}>{t.icono} {t.nombre}</option>)}
                  </select>
                </Field>
                <Field label="Fecha">
                  <input type="date" value={costoForm.fecha}
                    onChange={e => setCostoForm(f => ({ ...f, fecha: e.target.value }))}
                    style={{ background: S3, border: `1px solid ${BR}`, color: TX, padding: '10px 14px', borderRadius: 4, fontFamily: "'Jost', sans-serif", fontSize: 13, width: '100%', outline: 'none' }} />
                </Field>
              </FR>
              <FR>
                <Field label="Monto (MXN)">
                  <input type="number" value={costoForm.monto} onChange={e => setCostoForm(f => ({ ...f, monto: e.target.value }))} placeholder="0"
                    style={{ background: S3, border: `1px solid ${BR}`, color: TX, padding: '10px 14px', borderRadius: 4, fontFamily: "'Jost', sans-serif", fontSize: 13, width: '100%', outline: 'none' }} />
                </Field>
                <Field label="Descripción">
                  <input value={costoForm.descripcion} onChange={e => setCostoForm(f => ({ ...f, descripcion: e.target.value }))} placeholder="Detalle..."
                    style={{ background: S3, border: `1px solid ${BR}`, color: TX, padding: '10px 14px', borderRadius: 4, fontFamily: "'Jost', sans-serif", fontSize: 13, width: '100%', outline: 'none' }} />
                </Field>
              </FR>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <Btn small variant="secondary" onClick={() => setShowAddCosto(false)}>Cancelar</Btn>
                <Btn small onClick={saveAdditionalCost} disabled={!costoForm.monto}>Guardar Costo</Btn>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8, paddingTop: 14, borderTop: `1px solid ${BR}` }}>
            {selWatch.stage === 'oportunidad' && <Btn variant="ghost" small onClick={() => approve(selWatch)}>✓ Aprobar → Inventario</Btn>}
            {selWatch.stage === 'inventario' && !selSale && <Btn small onClick={() => setShowSale(true)}>Registrar Venta</Btn>}
          </div>
        </Modal>
      )}

      {/* SALE FORM */}
      {showSale && selWatch && (
        <Modal title="Registrar Venta" onClose={() => setShowSale(false)} width={520}>
          <div style={{ background: S3, borderRadius: 4, padding: '10px 14px', marginBottom: 16 }}>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 16, color: TX }}>{selBrand?.name} {selModel?.name} · {selRef?.ref}</div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: TM }}>Costo: {fmt(selWatch.cost)}</div>
          </div>
          <FR>
            <Field label="Cliente" required>
              <select value={sf.clientId} onChange={e => setSf(f => ({ ...f, clientId: e.target.value }))} style={selStyle}>
                <option value="">— Seleccionar —</option>{clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Fecha"><input type="date" value={sf.saleDate} onChange={e => setSf(f => ({ ...f, saleDate: e.target.value }))} style={inputStyle} /></Field>
          </FR>
          <FR cols={1}><Field label="Precio acordado (MXN)" required>
            <input type="number" value={sf.agreedPrice} onChange={e => setSf(f => ({ ...f, agreedPrice: e.target.value }))} placeholder="0" style={inputStyle} />
            {sf.agreedPrice && selWatch.cost && <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: GRN, marginTop: 4 }}>Utilidad bruta: +{fmt(+sf.agreedPrice - selWatch.cost)} ({((+sf.agreedPrice - selWatch.cost) / selWatch.cost * 100).toFixed(1)}%)</div>}
          </Field></FR>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 14 }}>
            <Btn variant="secondary" small onClick={() => setShowSale(false)}>Cancelar</Btn>
            <Btn small onClick={saveSale} disabled={!sf.clientId || !sf.agreedPrice}>Registrar Venta</Btn>
          </div>
        </Modal>
      )}

      {/* ADD WATCH */}
      {showAdd && (
        <Modal title="Registrar Nueva Pieza" onClose={() => setShowAdd(false)}>
          <div style={{ background: S3, borderRadius: 4, padding: '10px 14px', marginBottom: 16, fontFamily: "'DM Mono', monospace", fontSize: 10, color: TM }}>
            Selecciona del catálogo: Marca → Modelo → Referencia
          </div>
          <FR>
            <Field label="Marca" required>
              <select value={wf._brandId || ''} onChange={e => setWf(f => ({ ...f, _brandId: e.target.value, _modelId: '', refId: '' }))} style={selStyle}>
                <option value="">— Seleccionar —</option>{brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </Field>
            <Field label="Modelo" required>
              <select value={wf._modelId || ''} onChange={e => setWf(f => ({ ...f, _modelId: e.target.value, refId: '' }))} disabled={!wf._brandId} style={selStyle}>
                <option value="">— Seleccionar —</option>{models.filter(m => m.brandId === wf._brandId).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </Field>
          </FR>
          <FR cols={1}>
            <Field label="Referencia" required>
              <select value={wf.refId} onChange={e => setWf(f => ({ ...f, refId: e.target.value }))} disabled={!wf._modelId} style={selStyle}>
                <option value="">— Seleccionar —</option>{refs.filter(r => r.modelId === wf._modelId).map(r => <option key={r.id} value={r.id}>{r.ref} · {r.material} · {r.dial} · {r.size}</option>)}
              </select>
            </Field>
          </FR>
          <Divider label="DATOS FÍSICOS" />
          <FR>
            <Field label="Serial"><input value={wf.serial} onChange={e => setWf(f => ({ ...f, serial: e.target.value }))} placeholder="S/N" style={inputStyle} /></Field>
            <Field label="Proveedor" required>
              <select value={wf.supplierId} onChange={e => setWf(f => ({ ...f, supplierId: e.target.value }))} style={selStyle}>
                <option value="">— Seleccionar —</option>{suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Field>
          </FR>
          <FR>
            <Field label="Condición">
              <select value={wf.condition} onChange={e => setWf(f => ({ ...f, condition: e.target.value }))} style={selStyle}>
                {['Mint', 'Excelente', 'Muy Bueno', 'Bueno', 'Regular', 'Para Servicio'].map(x => <option key={x}>{x}</option>)}
              </select>
            </Field>
            <Field label="Estado inicial">
              <select value={wf.status} onChange={e => setWf(f => ({ ...f, status: e.target.value }))} style={selStyle}>
                {['Oportunidad', 'Disponible', 'Consignado'].map(x => <option key={x}>{x}</option>)}
              </select>
            </Field>
          </FR>
          <div style={{ display: 'flex', gap: 20, marginBottom: 14 }}>
            {[['fullSet', 'Full Set'], ['papers', 'Papeles'], ['box', 'Caja']].map(([k, l]) => (
              <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontFamily: "'Jost', sans-serif", fontSize: 13, color: TX }}>
                <input type="checkbox" checked={wf[k]} onChange={e => setWf(f => ({ ...f, [k]: e.target.checked }))} style={{ width: 'auto', accentColor: G }} />{l}
              </label>
            ))}
          </div>
          <FR>
            <Field label="Costo (MXN)"><input type="number" value={wf.cost} onChange={e => setWf(f => ({ ...f, cost: e.target.value }))} placeholder="0" style={inputStyle} /></Field>
            <Field label="Precio pedido"><input type="number" value={wf.priceAsked} onChange={e => setWf(f => ({ ...f, priceAsked: e.target.value }))} placeholder="0" style={inputStyle} /></Field>
          </FR>
          {wf.cost && wf.priceAsked && (
            <div style={{ background: GRN + '11', border: `1px solid ${GRN}33`, borderRadius: 3, padding: '6px 12px', marginBottom: 10, fontFamily: "'DM Mono', monospace", fontSize: 11, color: GRN }}>
              Margen potencial: +{fmt(wf.priceAsked - wf.cost)} ({((wf.priceAsked - wf.cost) / wf.cost * 100).toFixed(1)}%)
            </div>
          )}
          <Divider label="ADQUISICIÓN" />
          <FR>
            <Field label="Modo de adquisición">
              <select value={wf.modoAdquisicion} onChange={e => setWf(f => ({ ...f, modoAdquisicion: e.target.value, splitPersonalizado: null }))} style={selStyle}>
                <option value="sociedad">🤝 En Sociedad (split global)</option>
                <option value="twr">🏢 Compra TWR (100% TWR)</option>
                <option value="aportacion">📦 Aportación de Socio</option>
                <option value="personalizado">📊 Split Personalizado</option>
              </select>
            </Field>
            {wf.modoAdquisicion === 'aportacion' && (
              <Field label="Socio que aporta">
                <select value={wf.socioAportaId || ''} onChange={e => setWf(f => ({ ...f, socioAportaId: e.target.value }))} style={selStyle}>
                  <option value="">— Seleccionar —</option>
                  {(state?.socios || []).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </Field>
            )}
          </FR>
          {wf.modoAdquisicion === 'personalizado' && (
            <div style={{ background: S3, borderRadius: 4, padding: '10px 14px', marginBottom: 14 }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: TM, marginBottom: 8 }}>SPLIT PERSONALIZADO</div>
              {(state?.socios || []).map((s, i) => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span style={{ fontFamily: "'Jost', sans-serif", fontSize: 12, color: TX, width: 140 }}>{s.name}</span>
                  <input type="number" min="0" max="100"
                    value={(wf.splitPersonalizado || {})[s.id] ?? s.participacion}
                    onChange={e => setWf(f => ({ ...f, splitPersonalizado: { ...(f.splitPersonalizado || {}), [s.id]: +e.target.value } }))}
                    style={{ ...inputStyle, width: 70 }} />
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: TM }}>%</span>
                </div>
              ))}
            </div>
          )}
          <Divider label="ADQUISICIÓN" />
          <FR>
            <Field label="Modo de adquisición">
              <select value={wf.modoAdquisicion} onChange={e => setWf(f => ({ ...f, modoAdquisicion: e.target.value, splitPersonalizado: null }))} style={selStyle}>
                <option value="sociedad">🤝 En Sociedad (split global)</option>
                <option value="twr">🏢 Compra TWR (100% TWR)</option>
                <option value="aportacion">📦 Aportación de Socio</option>
                <option value="personalizado">📊 Split Personalizado</option>
              </select>
            </Field>
            {wf.modoAdquisicion === 'aportacion' && (
              <Field label="Socio que aporta">
                <select value={wf.socioAportaId || ''} onChange={e => setWf(f => ({ ...f, socioAportaId: e.target.value }))} style={selStyle}>
                  <option value="">— Seleccionar —</option>
                  {(state.socios || []).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </Field>
            )}
          </FR>
          {wf.modoAdquisicion === 'personalizado' && (
            <div style={{ background: S3, borderRadius: 4, padding: '10px 14px', marginBottom: 14 }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: TM, marginBottom: 8 }}>SPLIT PERSONALIZADO</div>
              {(state.socios || []).map(s => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span style={{ fontFamily: "'Jost', sans-serif", fontSize: 12, color: TX, minWidth: 140 }}>{s.name}</span>
                  <input type="number" min="0" max="100"
                    value={(wf.splitPersonalizado || {})[s.id] ?? s.participacion}
                    onChange={e => setWf(f => ({ ...f, splitPersonalizado: { ...(f.splitPersonalizado || {}), [s.id]: +e.target.value } }))}
                    style={{ ...inputStyle, width: 70 }} />
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: TM }}>%</span>
                </div>
              ))}
            </div>
          )}
          <Field label="Notas">
            <textarea rows={2} value={wf.notes} onChange={e => setWf(f => ({ ...f, notes: e.target.value }))} placeholder="Procedencia, observaciones..." style={{ ...inputStyle, resize: 'vertical', marginBottom: 14 }} />
          </Field>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Btn variant="secondary" small onClick={() => setShowAdd(false)}>Cancelar</Btn>
            <Btn small onClick={saveWatch} disabled={!wf.refId || !wf.supplierId}>Registrar Pieza</Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
//  VENTAS & CARTERA
// ══════════════════════════════════════════════════════════════════════════════
function VentasModule({ state, setState }) {
  const { watches, sales, clients, brands, models, refs } = state
  const [showPay, setShowPay] = useState(null)
  const [pf, setPf]           = useState({ date: tod(), amount: '', method: 'Transferencia', notes: '' })

  const inputStyle = { background: S3, border: `1px solid ${BR}`, color: TX, padding: '10px 14px', borderRadius: 4, fontFamily: "'Jost', sans-serif", fontSize: 13, width: '100%', outline: 'none' }

  const getLabel = watchId => {
    const w = watches.find(w => w.id === watchId), r = refs.find(r => r.id === w?.refId),
          m = models.find(m => m.id === r?.modelId), b = brands.find(b => b.id === m?.brandId)
    return b && m ? `${b.name} ${m.name} · ${r?.ref || ''}` : watchId
  }

  const savePay = saleId => {
    setState(s => ({
      ...s,
      sales: s.sales.map(sale => {
        if (sale.id !== saleId) return sale
        const pays  = [...sale.payments, { ...pf, id: 'PAY' + uid(), amount: +pf.amount }]
        const total = pays.reduce((a, p) => a + p.amount, 0)
        return { ...sale, payments: pays, status: total >= sale.agreedPrice ? 'Liquidado' : total > 0 ? 'Parcial' : 'Pendiente' }
      })
    }))
    setShowPay(null); setPf({ date: tod(), amount: '', method: 'Transferencia', notes: '' })
  }

  const totalVentas  = sales.reduce((a, s) => a + s.agreedPrice, 0)
  const totalCobrado = sales.reduce((a, s) => a + (s.payments || []).reduce((x, p) => x + p.amount, 0), 0)
  const porCobrar    = totalVentas - totalCobrado
  const pendientes   = sales.filter(s => s.status !== 'Liquidado')

  return (
    <div>
      <SH title="Ventas & Cartera" subtitle={`${sales.length} ventas · ${pendientes.length} con saldo pendiente`} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
        <KPI label="Total Ventas"  value={fmt(totalVentas)}  accent={GRN} />
        <KPI label="Cobrado"       value={fmt(totalCobrado)} accent={BLU} />
        <KPI label="Por Cobrar"    value={fmt(porCobrar)}    accent={porCobrar > 0 ? RED : GRN} sub={`${pendientes.length} abiertas`} />
        <KPI label="Liquidadas"    value={sales.filter(s => s.status === 'Liquidado').length} accent={TM} sub={`de ${sales.length}`} />
      </div>

      {pendientes.length > 0 && (
        <div style={{ background: RED + '11', border: `1px solid ${RED}33`, borderRadius: 6, padding: '12px 16px', marginBottom: 18, fontFamily: "'DM Mono', monospace", fontSize: 11, color: RED }}>
          ⚠ {pendientes.length} venta{pendientes.length > 1 ? 's' : ''} con pagos pendientes · Total: {fmt(porCobrar)}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {[...sales].sort((a, b) => a.status === 'Liquidado' ? 1 : -1).map(sale => {
          const cob = sale.payments.reduce((a, p) => a + p.amount, 0)
          const pend = sale.agreedPrice - cob
          const pct  = Math.round(cob / sale.agreedPrice * 100)
          const client = clients.find(c => c.id === sale.clientId)

          return (
            <div key={sale.id} style={{ background: S1, border: `1px solid ${sale.status !== 'Liquidado' ? RED + '44' : BR}`, borderRadius: 6, padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, color: TX, marginBottom: 3 }}>{getLabel(sale.watchId)}</div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: TM }}>Cliente: {client?.name || '—'} · {fmtD(sale.saleDate)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <Badge label={sale.status} color={sale.status === 'Liquidado' ? GRN : sale.status === 'Parcial' ? G : RED} />
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: G, marginTop: 4 }}>{fmt(sale.agreedPrice)}</div>
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: TM }}>Cobrado: {fmt(cob)}</span>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: pend > 0 ? RED : GRN }}>{pend > 0 ? `Pendiente: ${fmt(pend)}` : 'Liquidado ✓'}</span>
                </div>
                <div style={{ background: S3, borderRadius: 99, height: 6 }}>
                  <div style={{ background: pct >= 100 ? GRN : pct > 0 ? G : RED, height: 6, borderRadius: 99, width: `${Math.min(pct, 100)}%`, transition: 'width .5s' }} />
                </div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: TD, marginTop: 3 }}>{pct}% cobrado</div>
              </div>

              {sale.payments.map(p => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: S2, borderRadius: 3, marginBottom: 3 }}>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: TM }}>{fmtD(p.date)} · {p.method}</span>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: GRN }}>+{fmt(p.amount)}</span>
                </div>
              ))}

              {sale.status !== 'Liquidado' && (
                showPay === sale.id ? (
                  <div style={{ background: S3, border: `1px solid ${BRG}`, borderRadius: 4, padding: 12, marginTop: 10 }}>
                    <FR>
                      <Field label="Fecha"><input type="date" value={pf.date} onChange={e => setPf(f => ({ ...f, date: e.target.value }))} style={inputStyle} /></Field>
                      <Field label="Monto (MXN)">
                        <input type="number" value={pf.amount} onChange={e => setPf(f => ({ ...f, amount: e.target.value }))} placeholder="0" style={inputStyle} />
                        {pf.amount && <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: pend - pf.amount > 0 ? G : GRN, marginTop: 3 }}>Restante: {fmt(Math.max(0, pend - pf.amount))}</div>}
                      </Field>
                    </FR>
                    <FR>
                      <Field label="Método"><select value={pf.method} onChange={e => setPf(f => ({ ...f, method: e.target.value }))} style={inputStyle}>{['Transferencia', 'Efectivo', 'Cheque', 'Crypto', 'Otro'].map(x => <option key={x}>{x}</option>)}</select></Field>
                      <Field label="Notas"><input value={pf.notes} onChange={e => setPf(f => ({ ...f, notes: e.target.value }))} placeholder="Referencia..." style={inputStyle} /></Field>
                    </FR>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <Btn small variant="secondary" onClick={() => setShowPay(null)}>Cancelar</Btn>
                      <Btn small onClick={() => savePay(sale.id)} disabled={!pf.amount || +pf.amount <= 0}>+ Registrar Pago</Btn>
                    </div>
                  </div>
                ) : (
                  <Btn variant="ghost" small onClick={() => { setShowPay(sale.id); setPf(f => ({ ...f, amount: String(pend) })) }}>
                    + Registrar Pago · Sugerido: {fmt(pend)}
                  </Btn>
                )
              )}
            </div>
          )
        })}
        {sales.length === 0 && (
          <div style={{ background: S1, border: `1px solid ${BR}`, borderRadius: 6, padding: 60, textAlign: 'center', fontFamily: "'DM Mono', monospace", fontSize: 11, color: TD }}>
            Las ventas se registran desde el detalle de cada reloj en Inventario
          </div>
        )}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
//  REPORTES
// ══════════════════════════════════════════════════════════════════════════════
function ReportesModule({ state }) {
  const { watches, sales, investors, brands, models, refs } = state
  const utilidad  = sales.reduce((a, s) => { const w = watches.find(x => x.id === s.watchId); return a + (s.agreedPrice - (w?.cost || 0)) }, 0)
  const capital   = investors.reduce((a, i) => a + i.capitalAportado, 0)
  const roi       = capital > 0 ? (utilidad / capital * 100).toFixed(1) : 0
  const margenProm = sales.length > 0 ? (sales.reduce((a, s) => { const w = watches.find(x => x.id === s.watchId); return a + (s.agreedPrice - (w?.cost || 0)) / s.agreedPrice * 100 }, 0) / sales.length).toFixed(1) : 0
  const distInv   = investors.map(inv => { const dist = (inv.movimientos || []).filter(m => m.tipo === 'Distribución' || m.tipo === 'Retiro').reduce((a, m) => a + Math.abs(m.monto), 0); const corr = utilidad * inv.participacion / 100; return { ...inv, dist, corr, pend: corr - dist } })

  return (
    <div>
      <SH title="Reportes" subtitle="Resumen financiero del proyecto" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
        <KPI label="Capital Total"   value={fmt(capital)}     accent={BLU} />
        <KPI label="Utilidad Bruta"  value={fmt(utilidad)}    accent={GRN} />
        <KPI label="ROI Acumulado"   value={`${roi}%`} />
        <KPI label="Margen Promedio" value={`${margenProm}%`} accent={TM} />
      </div>

      <div style={{ background: S1, border: `1px solid ${BR}`, borderRadius: 6, marginBottom: 18 }}>
        <div style={{ padding: '14px 20px', borderBottom: `1px solid ${BR}`, fontFamily: "'DM Mono', monospace", fontSize: 10, color: TM, letterSpacing: '.1em' }}>VENTAS REALIZADAS</div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr style={{ borderBottom: `1px solid ${BR}` }}>{['Reloj', 'Costo', 'Precio Venta', 'Utilidad', 'Margen', 'Pago'].map(h => <th key={h} style={{ textAlign: 'left', padding: '9px 14px', fontFamily: "'DM Mono', monospace", fontSize: 10, color: TM, letterSpacing: '.1em', fontWeight: 400 }}>{h}</th>)}</tr></thead>
          <tbody>
            {sales.map(s => {
              const w = watches.find(x => x.id === s.watchId), r = refs.find(r => r.id === w?.refId), m = models.find(m => m.id === r?.modelId), b = brands.find(b => b.id === m?.brandId)
              const ut = s.agreedPrice - (w?.cost || 0), mrg = (ut / s.agreedPrice * 100).toFixed(1)
              return (
                <tr key={s.id} style={{ borderBottom: `1px solid ${BR}` }} onMouseEnter={e => e.currentTarget.style.background = S2} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '11px 14px', fontFamily: "'Jost', sans-serif", fontSize: 13, color: TX }}>{b?.name} {m?.name}</td>
                  <td style={{ padding: '11px 14px', fontFamily: "'DM Mono', monospace", fontSize: 11, color: TM }}>{fmt(w?.cost || 0)}</td>
                  <td style={{ padding: '11px 14px', fontFamily: "'DM Mono', monospace", fontSize: 11, color: G }}>{fmt(s.agreedPrice)}</td>
                  <td style={{ padding: '11px 14px', fontFamily: "'DM Mono', monospace", fontSize: 11, color: GRN }}>+{fmt(ut)}</td>
                  <td style={{ padding: '11px 14px', fontFamily: "'DM Mono', monospace", fontSize: 11, color: G }}>{mrg}%</td>
                  <td style={{ padding: '11px 14px' }}><Badge label={s.status} color={s.status === 'Liquidado' ? GRN : RED} small /></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div style={{ background: S1, border: `1px solid ${BR}`, borderRadius: 6 }}>
        <div style={{ padding: '14px 20px', borderBottom: `1px solid ${BR}`, fontFamily: "'DM Mono', monospace", fontSize: 10, color: TM, letterSpacing: '.1em' }}>DISTRIBUCIÓN A SOCIOS</div>
        <div style={{ padding: 18 }}>
          {distInv.map(inv => (
            <div key={inv.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: `1px solid ${BR}` }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Jost', sans-serif", fontSize: 14, color: TX }}>{inv.name}</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: TM }}>{inv.participacion}%</div>
              </div>
              {[['Corresponde', fmt(inv.corr), TX], ['Distribuido', fmt(inv.dist), GRN], ['Pendiente', fmt(inv.pend), inv.pend > 0 ? G : GRN]].map(([l, v, c]) => (
                <div key={l} style={{ textAlign: 'right', minWidth: 110 }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: c }}>{v}</div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: TD }}>{l}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
//  CATÁLOGOS
// ══════════════════════════════════════════════════════════════════════════════
function CatalogosModule({ state, setState }) {
  const { brands, models, refs, tiposCosto } = state
  const [tab, setTab]         = useState('marcas')
  const [selBrand, setSelBrand] = useState(null)
  const [selModel, setSelModel] = useState(null)
  const [showBrandForm, setShowBrandForm] = useState(false)
  const [showModelForm, setShowModelForm] = useState(false)
  const [showRefForm, setShowRefForm]     = useState(false)
  const [bf, setBf] = useState({ name: '', country: 'Suiza', founded: '', notes: '' })
  const [mf, setMf] = useState({ brandId: '', name: '', family: '', notes: '' })
  const [rf, setRf] = useState({ modelId: '', ref: '', caliber: '', material: 'Acero', bezel: '', dial: '', size: '', bracelet: '', year: '', notes: '' })

  const inputStyle = { background: S3, border: `1px solid ${BR}`, color: TX, padding: '10px 14px', borderRadius: 4, fontFamily: "'Jost', sans-serif", fontSize: 13, width: '100%', outline: 'none' }

  const saveBrand = () => { setState(s => ({ ...s, brands: [...s.brands, { ...bf, id: 'B' + uid() }] })); setShowBrandForm(false); setBf({ name: '', country: 'Suiza', founded: '', notes: '' }) }
  const saveModel = () => { setState(s => ({ ...s, models: [...s.models, { ...mf, id: 'M' + uid() }] })); setShowModelForm(false); setMf({ brandId: '', name: '', family: '', notes: '' }) }
  const saveRef   = () => { setState(s => ({ ...s, refs: [...s.refs, { ...rf, id: 'R' + uid(), year: +rf.year }] })); setShowRefForm(false); setRf({ modelId: '', ref: '', caliber: '', material: 'Acero', bezel: '', dial: '', size: '', bracelet: '', year: '', notes: '' }) }

  const filteredModels = selBrand ? models.filter(m => m.brandId === selBrand.id) : models
  const filteredRefs   = selModel ? refs.filter(r => r.modelId === selModel.id) : refs

  return (
    <div>
      <SH title="Catálogos" subtitle="Maestro de marcas · modelos · referencias" />

      {(selBrand || selModel) && (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 16, background: S2, border: `1px solid ${BR}`, borderRadius: 4, padding: '8px 14px' }}>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: TM }}>Filtro activo:</span>
          {selBrand && <>
            <Badge label={selBrand.name} color={G} />
            <button onClick={() => { setSelBrand(null); setSelModel(null) }} style={{ background: 'none', border: 'none', color: TM, cursor: 'pointer', fontSize: 12 }}>×</button>
          </>}
          {selModel && <>
            <span style={{ color: TD }}>→</span>
            <Badge label={selModel.name} color={BLU} />
            <button onClick={() => setSelModel(null)} style={{ background: 'none', border: 'none', color: TM, cursor: 'pointer', fontSize: 12 }}>×</button>
          </>}
        </div>
      )}

      <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: `1px solid ${BR}` }}>
        {[['marcas', 'Marcas', brands.length], ['modelos', 'Modelos', models.length], ['referencias', 'Referencias', refs.length], ['costos', 'Tipos de Costo', (state.tiposCosto||[]).length]].map(([id, label, n]) => (
          <button key={id} onClick={() => setTab(id)}
            style={{ padding: '10px 20px', background: 'none', border: 'none', borderBottom: tab === id ? `2px solid ${G}` : '2px solid transparent', color: tab === id ? G : TM, fontFamily: "'Jost', sans-serif", fontSize: 12, cursor: 'pointer', letterSpacing: '.06em' }}>
            {label} <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: tab === id ? G : TD, marginLeft: 4 }}>{n}</span>
          </button>
        ))}
      </div>

      {tab === 'marcas' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}><Btn onClick={() => setShowBrandForm(true)}>+ Nueva Marca</Btn></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
            {brands.map(b => {
              const mc = models.filter(m => m.brandId === b.id).length
              const rc = refs.filter(r => models.filter(m => m.brandId === b.id).map(m => m.id).includes(r.modelId)).length
              return (
                <div key={b.id} onClick={() => { setSelBrand(b); setTab('modelos') }}
                  style={{ background: S1, border: `1px solid ${selBrand?.id === b.id ? G : BR}`, borderRadius: 6, padding: 16, cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background = S2} onMouseLeave={e => e.currentTarget.style.background = S1}>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: TX, marginBottom: 6 }}>{b.name}</div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: TM, marginBottom: 10 }}>{b.country} · Est. {b.founded}</div>
                  <div style={{ display: 'flex', gap: 8 }}><Badge label={`${mc} modelos`} color={BLU} small /><Badge label={`${rc} refs`} color={G} small /></div>
                </div>
              )
            })}
            <div onClick={() => setShowBrandForm(true)} style={{ background: 'transparent', border: `1px dashed ${BR}`, borderRadius: 6, padding: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: TD }}>+ Agregar marca</span>
            </div>
          </div>
        </div>
      )}

      {tab === 'modelos' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: TM }}>{selBrand ? `Modelos de ${selBrand.name}` : 'Todos los modelos'}</div>
            <Btn onClick={() => setShowModelForm(true)}>+ Nuevo Modelo</Btn>
          </div>
          <div style={{ background: S1, border: `1px solid ${BR}`, borderRadius: 6, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ borderBottom: `1px solid ${BR}` }}>{['Marca', 'Modelo', 'Familia', 'Referencias', ''].map(h => <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontFamily: "'DM Mono', monospace", fontSize: 10, color: TM, letterSpacing: '.1em', fontWeight: 400 }}>{h}</th>)}</tr></thead>
              <tbody>
                {filteredModels.map(m => {
                  const b = brands.find(b => b.id === m.brandId), rc = refs.filter(r => r.modelId === m.id).length
                  return (
                    <tr key={m.id} style={{ borderBottom: `1px solid ${BR}` }} onMouseEnter={e => e.currentTarget.style.background = S2} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '11px 16px', fontFamily: "'DM Mono', monospace", fontSize: 11, color: TM }}>{b?.name}</td>
                      <td style={{ padding: '11px 16px', fontFamily: "'Jost', sans-serif", fontSize: 13, color: TX }}>{m.name}</td>
                      <td style={{ padding: '11px 16px' }}><Badge label={m.family || '—'} color={BLU} small /></td>
                      <td style={{ padding: '11px 16px', fontFamily: "'DM Mono', monospace", fontSize: 11, color: G }}>{rc}</td>
                      <td style={{ padding: '11px 16px', textAlign: 'right' }}>
                        <button onClick={() => { setSelModel(m); setTab('referencias') }} style={{ background: 'none', border: `1px solid ${BR}`, color: TM, padding: '4px 10px', borderRadius: 3, fontFamily: "'DM Mono', monospace", fontSize: 9, cursor: 'pointer', letterSpacing: '.08em' }}>VER REFS →</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'referencias' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: TM }}>{selModel ? `Referencias de ${selModel.name}` : 'Todas las referencias'}</div>
            <Btn onClick={() => setShowRefForm(true)}>+ Nueva Referencia</Btn>
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            {filteredRefs.map(r => {
              const m = models.find(m => m.id === r.modelId), b = brands.find(b => b.id === m?.brandId)
              return (
                <div key={r.id} style={{ background: S1, border: `1px solid ${BR}`, borderRadius: 6, padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div>
                      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, color: TX }}>{b?.name} {m?.name}</div>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: G, marginTop: 2 }}>{r.ref}</div>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10 }}>
                    {[['Calibre', r.caliber], ['Material', r.material], ['Bisel', r.bezel], ['Esfera', r.dial], ['Tamaño', r.size]].map(([k, v]) => (
                      <div key={k}>
                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: TD, marginBottom: 2 }}>{k}</div>
                        <div style={{ fontFamily: "'Jost', sans-serif", fontSize: 12, color: TX }}>{v || '—'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* BRAND FORM */}
      {showBrandForm && (
        <Modal title="Nueva Marca" onClose={() => setShowBrandForm(false)} width={480}>
          <FR>
            <Field label="Nombre" required><input value={bf.name} onChange={e => setBf(f => ({ ...f, name: e.target.value }))} placeholder="Ej: Rolex" style={inputStyle} /></Field>
            <Field label="País"><input value={bf.country} onChange={e => setBf(f => ({ ...f, country: e.target.value }))} placeholder="Suiza" style={inputStyle} /></Field>
          </FR>
          <FR>
            <Field label="Año fundación"><input type="number" value={bf.founded} onChange={e => setBf(f => ({ ...f, founded: e.target.value }))} placeholder="1905" style={inputStyle} /></Field>
            <Field label="Notas"><input value={bf.notes} onChange={e => setBf(f => ({ ...f, notes: e.target.value }))} style={inputStyle} /></Field>
          </FR>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Btn variant="secondary" small onClick={() => setShowBrandForm(false)}>Cancelar</Btn>
            <Btn small onClick={saveBrand} disabled={!bf.name}>Guardar</Btn>
          </div>
        </Modal>
      )}

      {/* MODEL FORM */}
      {showModelForm && (
        <Modal title="Nuevo Modelo" onClose={() => setShowModelForm(false)} width={480}>
          <FR>
            <Field label="Marca" required>
              <select value={mf.brandId} onChange={e => setMf(f => ({ ...f, brandId: e.target.value }))} style={{ ...inputStyle }}>
                <option value="">— Seleccionar —</option>{brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </Field>
            <Field label="Nombre" required><input value={mf.name} onChange={e => setMf(f => ({ ...f, name: e.target.value }))} placeholder="Ej: Submariner" style={inputStyle} /></Field>
          </FR>
          <FR>
            <Field label="Familia">
              <select value={mf.family} onChange={e => setMf(f => ({ ...f, family: e.target.value }))} style={{ ...inputStyle }}>
                {['', 'Sport', 'Dress', 'Sport-Luxury', 'Complications'].map(x => <option key={x} value={x}>{x || '— Seleccionar —'}</option>)}
              </select>
            </Field>
            <Field label="Notas"><input value={mf.notes} onChange={e => setMf(f => ({ ...f, notes: e.target.value }))} style={inputStyle} /></Field>
          </FR>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Btn variant="secondary" small onClick={() => setShowModelForm(false)}>Cancelar</Btn>
            <Btn small onClick={saveModel} disabled={!mf.brandId || !mf.name}>Guardar</Btn>
          </div>
        </Modal>
      )}

      {/* REF FORM */}
      {showRefForm && (
        <Modal title="Nueva Referencia" onClose={() => setShowRefForm(false)} width={600}>
          <FR>
            <Field label="Modelo" required>
              <select value={rf.modelId} onChange={e => setRf(f => ({ ...f, modelId: e.target.value }))} style={{ ...inputStyle }}>
                <option value="">— Seleccionar —</option>{models.map(m => { const b = brands.find(b => b.id === m.brandId); return <option key={m.id} value={m.id}>{b?.name} {m.name}</option> })}</select>
            </Field>
            <Field label="Número de referencia" required><input value={rf.ref} onChange={e => setRf(f => ({ ...f, ref: e.target.value }))} placeholder="126610LN" style={inputStyle} /></Field>
          </FR>
          <FR>
            <Field label="Calibre"><input value={rf.caliber} onChange={e => setRf(f => ({ ...f, caliber: e.target.value }))} placeholder="3235" style={inputStyle} /></Field>
            <Field label="Material">
              <select value={rf.material} onChange={e => setRf(f => ({ ...f, material: e.target.value }))} style={{ ...inputStyle }}>
                {['Acero', 'Oro Amarillo', 'Oro Blanco', 'Oro Rosa', 'Platino', 'Bimetálico', 'Titanio', 'Cerámica'].map(x => <option key={x}>{x}</option>)}
              </select>
            </Field>
          </FR>
          <FR>
            <Field label="Bisel"><input value={rf.bezel} onChange={e => setRf(f => ({ ...f, bezel: e.target.value }))} placeholder="Cerámica negra" style={inputStyle} /></Field>
            <Field label="Esfera"><input value={rf.dial} onChange={e => setRf(f => ({ ...f, dial: e.target.value }))} placeholder="Negro" style={inputStyle} /></Field>
          </FR>
          <FR>
            <Field label="Tamaño"><input value={rf.size} onChange={e => setRf(f => ({ ...f, size: e.target.value }))} placeholder="41mm" style={inputStyle} /></Field>
            <Field label="Año producción"><input type="number" value={rf.year} onChange={e => setRf(f => ({ ...f, year: e.target.value }))} placeholder="2021" style={inputStyle} /></Field>
          </FR>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Btn variant="secondary" small onClick={() => setShowRefForm(false)}>Cancelar</Btn>
            <Btn small onClick={saveRef} disabled={!rf.modelId || !rf.ref}>Guardar</Btn>
          </div>
        </Modal>
      )}
      {tab === 'costos' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
            <Btn onClick={() => {
              const nombre = window.prompt('Nombre del tipo de costo:')
              if (nombre) setState(s => ({ ...s, tiposCosto: [...(s.tiposCosto || []), { id: 'TC' + uid(), nombre, icono: '📋' }] }))
            }}>+ Nuevo Tipo</Btn>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
            {(state.tiposCosto || []).map(t => (
              <div key={t.id} style={{ background: S1, border: `1px solid ${BR}`, borderRadius: 6, padding: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 20 }}>{t.icono}</span>
                <div style={{ fontFamily: "'Jost', sans-serif", fontSize: 13, color: TX }}>{t.nombre}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function Btn({ children, onClick, variant = 'primary', small, disabled, full, type = 'button' }) {
  const vs = {
    primary:   { background: G,   color: BG,  border: 'none' },
    secondary: { background: 'transparent', color: TM,  border: `1px solid ${BR}` },
    danger:    { background: RED + '22', color: RED, border: `1px solid ${RED}44` },
    ghost:     { background: 'transparent', color: G,   border: `1px solid ${BRG}` },
  }
  return (
    <button type={type} onClick={!disabled ? onClick : undefined}
      style={{ ...vs[variant], padding: small ? '6px 13px' : '9px 20px', fontSize: small ? 11 : 13, fontFamily: "'Jost', sans-serif", fontWeight: 500, letterSpacing: '.06em', cursor: disabled ? 'not-allowed' : 'pointer', borderRadius: 3, opacity: disabled ? .45 : 1, width: full ? '100%' : 'auto' }}>
      {children}
    </button>
  )
}

function Modal({ title, children, onClose, width = 640 }) {
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.84)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: S1, border: `1px solid ${BR}`, borderRadius: 8, width: '100%', maxWidth: width, maxHeight: '92vh', overflow: 'auto', animation: 'fi .25s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 22px', borderBottom: `1px solid ${BR}` }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: TX }}>{title}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: TM, fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: 22 }}>{children}</div>
      </div>
    </div>
  )
}

function FR({ children, cols = 2, gap = 14 }) {
  return <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap, marginBottom: 14 }}>{children}</div>
}

function Field({ label, children, required }) {
  return (
    <div>
      <label style={{ display: 'block', fontFamily: "'DM Mono', monospace", fontSize: 10, color: TM, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 6 }}>
        {label}{required && <span style={{ color: RED }}> *</span>}
      </label>
      {children}
    </div>
  )
}

function SH({ title, subtitle, action, onAction }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 22 }}>
      <div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, color: TX, fontWeight: 400 }}>{title}</div>
        {subtitle && <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: TM, marginTop: 3, letterSpacing: '.06em' }}>{subtitle}</div>}
      </div>
      {action && <Btn onClick={onAction}>{action}</Btn>}
    </div>
  )
}

function Divider({ label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '18px 0 14px' }}>
      <div style={{ flex: 1, height: 1, background: BR }} />
      {label && <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: TD, letterSpacing: '.15em' }}>{label}</span>}
      <div style={{ flex: 1, height: 1, background: BR }} />
    </div>
  )
}

function InfoRow({ label, value, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${BR}` }}>
      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: TM }}>{label}</span>
      <span style={{ fontFamily: "'Jost', sans-serif", fontSize: 13, color: color || TX, fontWeight: color ? 500 : 400 }}>{value}</span>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
//  AUTH SCREEN
// ══════════════════════════════════════════════════════════════════════════════
function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ email: '', password: '', name: '', confirm: '' })
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const handleLogin = async () => {
    setErr(''); setLoading(true)
    const { data, error } = await sb.auth.signInWithPassword({ email: form.email, password: form.password })
    if (error) { setErr(error.message); setLoading(false); return }
    const { data: profile } = await sb.from('profiles').select('*').eq('id', data.user.id).maybeSingle()
    onAuth(data.user, profile)
    setLoading(false)
  }

  const handleRegister = async () => {
    setErr('')
    if (form.password !== form.confirm) { setErr('Las contraseñas no coinciden'); return }
    if (form.password.length < 8) { setErr('Mínimo 8 caracteres'); return }
    setLoading(true)
    const { data, error } = await sb.auth.signUp({ email: form.email, password: form.password })
    if (error) { setErr(error.message); setLoading(false); return }
    if (data.user) {
      await sb.from('profiles').upsert({ id: data.user.id, name: form.name, email: form.email, role: 'pending', active: true })
    }
    setMode('login')
    setForm(p => ({ ...p, password: '', confirm: '' }))
    alert('Cuenta creada. El Director asignará tu rol para acceder al sistema.')
    setLoading(false)
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: BG }}>
      <div style={{ width: '100%', maxWidth: 420, padding: 16 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, color: G, letterSpacing: '.1em' }}>The Wrist Room</div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: TD, letterSpacing: '.25em', marginTop: 6 }}>TWR OPERATING SYSTEM</div>
        </div>
        <div style={{ background: S1, border: `1px solid ${BR}`, borderRadius: 8, padding: 28 }}>
          <div style={{ display: 'flex', marginBottom: 24, borderBottom: `1px solid ${BR}` }}>
            {[['login', 'Iniciar Sesión'], ['register', 'Crear Cuenta']].map(([id, label]) => (
              <button key={id} onClick={() => setMode(id)}
                style={{ flex: 1, padding: '9px 0', background: 'none', border: 'none', borderBottom: mode === id ? `2px solid ${G}` : '2px solid transparent', color: mode === id ? G : TM, fontFamily: "'Jost', sans-serif", fontSize: 12, cursor: 'pointer', letterSpacing: '.06em' }}>
                {label}
              </button>
            ))}
          </div>

          {mode === 'login' && (
            <div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontFamily: "'DM Mono', monospace", fontSize: 10, color: TM, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 6 }}>Correo</label>
                <input type="email" value={form.email} onChange={f('email')} placeholder="tu@correo.mx"
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  style={{ background: S3, border: `1px solid ${BR}`, color: TX, padding: '10px 14px', borderRadius: 4, fontFamily: "'Jost', sans-serif", fontSize: 13, width: '100%', outline: 'none' }} />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontFamily: "'DM Mono', monospace", fontSize: 10, color: TM, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 6 }}>Contraseña</label>
                <input type="password" value={form.password} onChange={f('password')} placeholder="••••••••"
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  style={{ background: S3, border: `1px solid ${BR}`, color: TX, padding: '10px 14px', borderRadius: 4, fontFamily: "'Jost', sans-serif", fontSize: 13, width: '100%', outline: 'none' }} />
              </div>
              {err && <div style={{ background: RED + '11', border: `1px solid ${RED}33`, borderRadius: 4, padding: '8px 12px', fontFamily: "'DM Mono', monospace", fontSize: 11, color: RED, marginBottom: 14 }}>{err}</div>}
              <Btn onClick={handleLogin} full disabled={loading || !form.email || !form.password}>{loading ? 'Verificando...' : 'Entrar'}</Btn>
            </div>
          )}

          {mode === 'register' && (
            <div>
              {[['name', 'Nombre completo', 'text', 'Nombre Apellido'], ['email', 'Correo', 'email', 'tu@correo.mx']].map(([k, l, t, ph]) => (
                <div key={k} style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontFamily: "'DM Mono', monospace", fontSize: 10, color: TM, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 6 }}>{l}</label>
                  <input type={t} value={form[k]} onChange={f(k)} placeholder={ph}
                    style={{ background: S3, border: `1px solid ${BR}`, color: TX, padding: '10px 14px', borderRadius: 4, fontFamily: "'Jost', sans-serif", fontSize: 13, width: '100%', outline: 'none' }} />
                </div>
              ))}
              <FR>
                <Field label="Contraseña"><input type="password" value={form.password} onChange={f('password')} placeholder="Mín. 8 chars"
                  style={{ background: S3, border: `1px solid ${BR}`, color: TX, padding: '10px 14px', borderRadius: 4, fontFamily: "'Jost', sans-serif", fontSize: 13, width: '100%', outline: 'none' }} /></Field>
                <Field label="Confirmar"><input type="password" value={form.confirm} onChange={f('confirm')} placeholder="Repetir"
                  style={{ background: S3, border: `1px solid ${BR}`, color: TX, padding: '10px 14px', borderRadius: 4, fontFamily: "'Jost', sans-serif", fontSize: 13, width: '100%', outline: 'none' }} /></Field>
              </FR>
              {err && <div style={{ background: RED + '11', border: `1px solid ${RED}33`, borderRadius: 4, padding: '8px 12px', fontFamily: "'DM Mono', monospace", fontSize: 11, color: RED, marginBottom: 14 }}>{err}</div>}
              <div style={{ background: S3, borderRadius: 4, padding: '8px 12px', marginBottom: 14, fontFamily: "'DM Mono', monospace", fontSize: 10, color: TM }}>
                Tu cuenta quedará pendiente hasta que el Director asigne tu rol.
              </div>
              <Btn onClick={handleRegister} full disabled={loading || !form.email || !form.password || !form.name}>{loading ? 'Creando...' : 'Crear Cuenta'}</Btn>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
//  PENDING SCREEN
// ══════════════════════════════════════════════════════════════════════════════
function PendingScreen({ user, onLogout }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: BG }}>
      <div style={{ textAlign: 'center', padding: 32 }}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: G, marginBottom: 16 }}>The Wrist Room</div>
        <div style={{ background: S1, border: `1px solid ${BR}`, borderRadius: 8, padding: 32, maxWidth: 420 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: TM + '22', border: `1px solid ${TM}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 22 }}>⏳</div>
          <div style={{ fontFamily: "'Jost', sans-serif", fontSize: 16, color: TX, marginBottom: 8 }}>Cuenta pendiente de activación</div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: TM, marginBottom: 24, lineHeight: 1.6 }}>Tu cuenta fue creada. El Director del sistema asignará tu rol de acceso en breve.</div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: TD, marginBottom: 20 }}>{user.email}</div>
          <Btn variant="secondary" onClick={onLogout} full>Cerrar Sesión</Btn>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
//  ADMIN MODULE
// ══════════════════════════════════════════════════════════════════════════════
function AdminModule({ currentUser }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  const loadUsers = useCallback(async () => {
    setLoading(true)
    const { data } = await sb.from('profiles').select('*').order('created_at', { ascending: false })
    setUsers(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { loadUsers() }, [loadUsers])

  const saveRole = async (userId, role, active) => {
    setSaving(true)
    await sb.from('profiles').update({ role, active }).eq('id', userId)
    setUsers(u => u.map(x => x.id === userId ? { ...x, role, active } : x))
    setEditing(null)
    setSaving(false)
  }

  const pending = users.filter(u => u.role === 'pending').length
  const filtered = users.filter(u => !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div>
      <SH title="Administración" subtitle={`${users.length} usuarios registrados`} />

      {pending > 0 && (
        <div style={{ background: G + '11', border: `1px solid ${G}33`, borderRadius: 6, padding: '12px 16px', marginBottom: 18 }}>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: G }}>⚠ {pending} usuario{pending > 1 ? 's' : ''} pendiente{pending > 1 ? 's' : ''} de asignación de rol</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
        <KPI label="Total Usuarios" value={users.length} accent={BLU} />
        <KPI label="Pendientes" value={pending} accent={pending > 0 ? G : TM} />
        <KPI label="Activos" value={users.filter(u => u.active && u.role !== 'pending').length} accent={GRN} />
        <KPI label="Roles Asignados" value={users.filter(u => u.role !== 'pending').length} accent={TM} />
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <input placeholder="Buscar usuario..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 320, background: S3, border: `1px solid ${BR}`, color: TX, padding: '10px 14px', borderRadius: 4, fontFamily: "'Jost', sans-serif", fontSize: 13, outline: 'none' }} />
        <button onClick={loadUsers} style={{ background: S2, border: `1px solid ${BR}`, color: TM, padding: '8px 16px', borderRadius: 3, fontFamily: "'DM Mono', monospace", fontSize: 10, cursor: 'pointer', letterSpacing: '.08em' }}>↻ ACTUALIZAR</button>
      </div>

      <div style={{ background: S1, border: `1px solid ${BR}`, borderRadius: 6, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${BR}` }}>
              {['Nombre', 'Email', 'Rol', 'Estado', 'Registro', 'Acciones'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontFamily: "'DM Mono', monospace", fontSize: 10, color: TM, letterSpacing: '.1em', fontWeight: 400 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', fontFamily: "'DM Mono', monospace", fontSize: 11, color: TD }}>Cargando...</td></tr>
            ) : filtered.map(u => (
              <tr key={u.id} style={{ borderBottom: `1px solid ${BR}` }}
                onMouseEnter={e => e.currentTarget.style.background = S2}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <td style={{ padding: '12px 16px', fontFamily: "'Jost', sans-serif", fontSize: 13, color: TX }}>
                  {u.name || '—'}
                  {u.id === currentUser.id && <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: G, marginLeft: 6 }}>(tú)</span>}
                </td>
                <td style={{ padding: '12px 16px', fontFamily: "'DM Mono', monospace", fontSize: 11, color: TM }}>{u.email}</td>
                <td style={{ padding: '12px 16px' }}><Badge label={ROLES[u.role]?.label || u.role} color={ROLES[u.role]?.color || TM} small /></td>
                <td style={{ padding: '12px 16px' }}><Badge label={u.active ? 'Activo' : 'Inactivo'} color={u.active ? GRN : RED} small /></td>
                <td style={{ padding: '12px 16px', fontFamily: "'DM Mono', monospace", fontSize: 10, color: TD }}>{u.created_at ? new Date(u.created_at).toLocaleDateString('es-MX') : '—'}</td>
                <td style={{ padding: '12px 16px' }}>
                  {u.id !== currentUser.id ? (
                    <button onClick={() => setEditing({ ...u })} style={{ background: 'none', border: `1px solid ${BR}`, color: TM, padding: '4px 10px', borderRadius: 3, fontFamily: "'DM Mono', monospace", fontSize: 9, cursor: 'pointer', letterSpacing: '.08em' }}>EDITAR</button>
                  ) : <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: TD }}>—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <Modal title={`Editar: ${editing.name || editing.email}`} onClose={() => setEditing(null)} width={480}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: TM, marginBottom: 4 }}>EMAIL</div>
            <div style={{ fontFamily: "'Jost', sans-serif", fontSize: 13, color: TX }}>{editing.email}</div>
          </div>
          <Divider label="ROL DE ACCESO" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
            {Object.entries(ROLES).filter(([k]) => k !== 'pending').map(([key, cfg]) => (
              <div key={key} onClick={() => setEditing(e => ({ ...e, role: key }))}
                style={{ background: editing.role === key ? cfg.color + '22' : S3, border: `1px solid ${editing.role === key ? cfg.color : BR}`, borderRadius: 6, padding: '12px 14px', cursor: 'pointer' }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: editing.role === key ? cfg.color : TM, letterSpacing: '.08em' }}>{cfg.label.toUpperCase()}</div>
                <div style={{ fontFamily: "'Jost', sans-serif", fontSize: 11, color: TD, marginTop: 4 }}>
                  {key === 'director' ? 'Acceso total' : key === 'operador' ? 'Operaciones diarias' : 'Solo cuenta propia'}
                </div>
              </div>
            ))}
          </div>
          <Divider label="ESTADO" />
          <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
            {[['true', 'Activo', GRN], ['false', 'Inactivo', RED]].map(([val, label, color]) => (
              <div key={val} onClick={() => setEditing(e => ({ ...e, active: val === 'true' }))}
                style={{ flex: 1, background: String(editing.active) === val ? color + '22' : S3, border: `1px solid ${String(editing.active) === val ? color : BR}`, borderRadius: 6, padding: '10px 14px', cursor: 'pointer', textAlign: 'center' }}>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: String(editing.active) === val ? color : TM }}>{label}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Btn variant="secondary" small onClick={() => setEditing(null)}>Cancelar</Btn>
            <Btn small onClick={() => saveRole(editing.id, editing.role, editing.active)} disabled={saving}>{saving ? 'Guardando...' : 'Guardar Cambios'}</Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
//  INVERSIONISTAS
// ══════════════════════════════════════════════════════════════════════════════
function InversionistasModule({ state, setState }) {
  const { sales, watches, socios: sociosState } = state
  const [sel, setSel]           = useState(null)
  const [showMov, setShowMov]   = useState(false)
  const [showEditSocios, setShowEditSocios] = useState(false)
  const [mv, setMv]             = useState({ fecha: tod(), tipo: 'Aportación', monto: '', concepto: '' })
  const [editSocios, setEditSocios] = useState(null)
  const inputStyle = { background: S3, border: `1px solid ${BR}`, color: TX, padding: '10px 14px', borderRadius: 4, fontFamily: "'Jost', sans-serif", fontSize: 13, width: '100%', outline: 'none' }

  const socios = sociosState || []

  // Costo total por pieza (base + costos adicionales)
  const costoTotal = w => (w?.cost || 0) + (w?.costos || []).reduce((a, c) => a + c.monto, 0)

  // Split de una pieza según su modo
  const getSplitPieza = (pieza) => {
    if (!pieza) return {}
    if (pieza.modoAdquisicion === 'twr') return socios.reduce((acc, s) => ({ ...acc, [s.id]: s.name === 'TWR Capital' ? 100 : 0 }), {})
    if (pieza.modoAdquisicion === 'aportacion') return socios.reduce((acc, s) => ({ ...acc, [s.id]: s.id === pieza.socioAportaId ? 100 : 0 }), {})
    if (pieza.modoAdquisicion === 'personalizado' && pieza.splitPersonalizado) return pieza.splitPersonalizado
    return socios.reduce((acc, s) => ({ ...acc, [s.id]: s.participacion }), {})
  }

  // Utilidad total liquidada por socio
  const utilidadPorSocio = socios.reduce((acc, s) => {
    const util = (sales || []).filter(sale => sale.status === 'Liquidado').reduce((a, sale) => {
      const w = (watches || []).find(x => x.id === sale.watchId)
      const utilBruta = sale.agreedPrice - costoTotal(w)
      const split = getSplitPieza(w)
      return a + utilBruta * (split[s.id] || 0) / 100
    }, 0)
    return { ...acc, [s.id]: util }
  }, {})

  const utilidadTotal = Object.values(utilidadPorSocio).reduce((a, v) => a + v, 0)

  const getMovimientos = (socioId) => (socios.find(s => s.id === socioId)?.movimientos || [])

  const saveMov = () => {
    if (!sel) return
    const monto = mv.tipo === 'Distribución' || mv.tipo === 'Retiro' ? -Math.abs(+mv.monto) : +mv.monto
    const nuevoMov = { id: 'M' + uid(), ...mv, monto }
    setState(s => ({
      ...s,
      socios: (s.socios || []).map(i => i.id !== sel.id ? i : { ...i, movimientos: [...(i.movimientos || []), nuevoMov] })
    }))
    setShowMov(false)
    setMv({ fecha: tod(), tipo: 'Aportación', monto: '', concepto: '' })
  }

  const saveEditSocios = () => {
    setState(s => ({ ...s, socios: editSocios }))
    setShowEditSocios(false)
  }

  const selConMovimientos = sel ? socios.find(s => s.id === sel.id) : null

  return (
    <div>
      <SH title="Socios" subtitle={`${socios.length} socios · split global configurable`}
        action="⚙ Configurar Socios" onAction={() => { setEditSocios(JSON.parse(JSON.stringify(socios))); setShowEditSocios(true) }} />

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${socios.length + 1},1fr)`, gap: 14, marginBottom: 24 }}>
        <KPI label="Utilidad Total Liquidada" value={fmt(utilidadTotal)} accent={G} />
        {socios.map(s => (
          <KPI key={s.id} label={s.name} value={fmt(utilidadPorSocio[s.id] || 0)} accent={s.color || G} sub={`${s.participacion}% split global`} />
        ))}
      </div>

      {/* Tarjetas de socios */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16, marginBottom: 24 }}>
        {socios.map(inv => {
          const movs = inv.movimientos || []
          const ap = movs.filter(m => m.monto > 0).reduce((a, m) => a + m.monto, 0)
          const di = movs.filter(m => m.monto < 0).reduce((a, m) => a + Math.abs(m.monto), 0)
          const corr = utilidadPorSocio[inv.id] || 0
          const pendiente = corr - di
          return (
            <div key={inv.id} onClick={() => setSel(inv)}
              style={{ background: S1, border: `1px solid ${BR}`, borderRadius: 6, padding: 20, cursor: 'pointer', transition: 'border-color .2s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = inv.color || G}
              onMouseLeave={e => e.currentTarget.style.borderColor = BR}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: TX }}>{inv.name}</div>
                <Badge label={`${inv.participacion}% global`} color={inv.color || G} />
              </div>
              <div style={{ background: S3, borderRadius: 2, height: 4, marginBottom: 14 }}>
                <div style={{ background: inv.color || G, height: 4, width: `${inv.participacion}%`, borderRadius: 2 }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
                {[
                  ['Aportado', fmt(ap), TX],
                  ['Distribuido', fmt(di), GRN],
                  ['Corresponde', fmt(corr), inv.color || G],
                  ['Pendiente', fmt(Math.max(0, pendiente)), pendiente > 0 ? RED : TM],
                ].map(([l, v, c]) => (
                  <div key={l}>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: TD, marginBottom: 3 }}>{l}</div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: c }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Tabla distribución por venta */}
      {(sales || []).filter(s => s.status === 'Liquidado').length > 0 && (
        <div style={{ background: S1, border: `1px solid ${BR}`, borderRadius: 6, overflow: 'hidden', marginBottom: 24 }}>
          <div style={{ padding: '14px 16px', borderBottom: `1px solid ${BR}`, fontFamily: "'DM Mono', monospace", fontSize: 10, color: TM, letterSpacing: '.1em' }}>
            DISTRIBUCIÓN POR VENTA LIQUIDADA
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ borderBottom: `1px solid ${BR}` }}>
              {['Pieza', 'Modo', 'Costo Total', 'Venta', 'Utilidad', ...socios.map(s => `${s.name} (${s.participacion}%)`)].map(h =>
                <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontFamily: "'DM Mono', monospace", fontSize: 10, color: TM, letterSpacing: '.08em', fontWeight: 400, whiteSpace: 'nowrap' }}>{h}</th>
              )}
            </tr></thead>
            <tbody>
              {(sales || []).filter(s => s.status === 'Liquidado').map(s => {
                const w = (watches || []).find(x => x.id === s.watchId)
                const ct = costoTotal(w)
                const util = s.agreedPrice - ct
                const split = getSplitPieza(w)
                const modos = { sociedad: '🤝 Sociedad', twr: '🏢 TWR', aportacion: '📦 Aportación', personalizado: '📊 Custom' }
                return (
                  <tr key={s.id} style={{ borderBottom: `1px solid ${BR}` }}
                    onMouseEnter={e => e.currentTarget.style.background = S2}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '11px 14px', fontFamily: "'Jost', sans-serif", fontSize: 12, color: TX }}>{w?.id || '—'}</td>
                    <td style={{ padding: '11px 14px', fontFamily: "'DM Mono', monospace", fontSize: 10, color: TM }}>{modos[w?.modoAdquisicion || 'sociedad']}</td>
                    <td style={{ padding: '11px 14px', fontFamily: "'DM Mono', monospace", fontSize: 11, color: TM }}>{fmt(ct)}</td>
                    <td style={{ padding: '11px 14px', fontFamily: "'DM Mono', monospace", fontSize: 11, color: TX }}>{fmt(s.agreedPrice)}</td>
                    <td style={{ padding: '11px 14px', fontFamily: "'DM Mono', monospace", fontSize: 12, color: util > 0 ? GRN : RED, fontWeight: 500 }}>{fmt(util)}</td>
                    {socios.map(soc => (
                      <td key={soc.id} style={{ padding: '11px 14px', fontFamily: "'DM Mono', monospace", fontSize: 11, color: soc.color || G }}>
                        {fmt(util * (split[soc.id] || 0) / 100)}
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal configurar socios */}
      {showEditSocios && editSocios && (
        <Modal title="Configurar Socios" onClose={() => setShowEditSocios(false)} width={500}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: TM, marginBottom: 16 }}>
            El split global aplica a todas las piezas marcadas como "En Sociedad"
          </div>
          {editSocios.map((s, i) => (
            <div key={s.id} style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12, padding: '10px 14px', background: S2, borderRadius: 4 }}>
              <input value={s.name} onChange={e => setEditSocios(prev => prev.map((x, j) => j !== i ? x : { ...x, name: e.target.value }))}
                style={{ ...inputStyle, flex: 1 }} placeholder="Nombre del socio" />
              <input type="number" min="0" max="100" value={s.participacion}
                onChange={e => setEditSocios(prev => prev.map((x, j) => j !== i ? x : { ...x, participacion: +e.target.value }))}
                style={{ ...inputStyle, width: 70 }} />
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: TM }}>%</span>
            </div>
          ))}
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: editSocios.reduce((a, s) => a + s.participacion, 0) === 100 ? GRN : RED, marginBottom: 14 }}>
            Total: {editSocios.reduce((a, s) => a + s.participacion, 0)}% {editSocios.reduce((a, s) => a + s.participacion, 0) !== 100 ? '⚠ Debe sumar 100%' : '✓'}
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Btn small variant="secondary" onClick={() => setShowEditSocios(false)}>Cancelar</Btn>
            <Btn small onClick={saveEditSocios} disabled={editSocios.reduce((a, s) => a + s.participacion, 0) !== 100}>Guardar</Btn>
          </div>
        </Modal>
      )}

      {/* Modal detalle socio */}
      {sel && selConMovimientos && (
        <Modal title={`${selConMovimientos.name}`} onClose={() => { setSel(null); setShowMov(false) }} width={580}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: TM }}>
              Corresponde: <span style={{ color: G }}>{fmt(utilidadPorSocio[sel.id] || 0)}</span>
            </div>
            <Btn small onClick={() => setShowMov(true)}>+ Movimiento</Btn>
          </div>
          {(selConMovimientos.movimientos || []).length === 0 && (
            <div style={{ textAlign: 'center', padding: '24px', fontFamily: "'DM Mono', monospace", fontSize: 11, color: TD }}>Sin movimientos registrados</div>
          )}
          {[...(selConMovimientos.movimientos || [])].reverse().map((m, i) => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', background: i % 2 === 0 ? S2 : 'transparent', borderRadius: 4, marginBottom: 2 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: m.monto > 0 ? GRN + '22' : RED + '22', border: `1px solid ${m.monto > 0 ? GRN : RED}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: m.monto > 0 ? GRN : RED }}>{m.monto > 0 ? '↑' : '↓'}</div>
                <div>
                  <div style={{ fontFamily: "'Jost', sans-serif", fontSize: 13, color: TX }}>{m.concepto}</div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: TM }}>{fmtD(m.fecha)} · {m.tipo}</div>
                </div>
              </div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: m.monto > 0 ? GRN : RED, fontWeight: 500 }}>{m.monto > 0 ? '+' : ''}{fmt(m.monto)}</div>
            </div>
          ))}
          {showMov && (
            <div style={{ background: S3, border: `1px solid ${BRG}`, borderRadius: 6, padding: 14, marginTop: 14 }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: G, marginBottom: 12, letterSpacing: '.1em' }}>NUEVO MOVIMIENTO</div>
              <FR>
                <Field label="Tipo"><select value={mv.tipo} onChange={e => setMv(m => ({ ...m, tipo: e.target.value }))} style={inputStyle}>{['Aportación', 'Distribución', 'Retiro', 'Ajuste'].map(t => <option key={t}>{t}</option>)}</select></Field>
                <Field label="Fecha"><input type="date" value={mv.fecha} onChange={e => setMv(m => ({ ...m, fecha: e.target.value }))} style={inputStyle} /></Field>
              </FR>
              <FR>
                <Field label="Monto (MXN)"><input type="number" value={mv.monto} onChange={e => setMv(m => ({ ...m, monto: e.target.value }))} placeholder="0" style={inputStyle} /></Field>
                <Field label="Concepto"><input value={mv.concepto} onChange={e => setMv(m => ({ ...m, concepto: e.target.value }))} placeholder="Descripción" style={inputStyle} /></Field>
              </FR>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <Btn small variant="secondary" onClick={() => setShowMov(false)}>Cancelar</Btn>
                <Btn small onClick={saveMov} disabled={!mv.monto || !mv.concepto}>Guardar</Btn>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
//  CONTACTOS
// ══════════════════════════════════════════════════════════════════════════════
function ContactosModule({ state, setState }) {
  const { suppliers, clients } = state
  const [tab, setTab]           = useState('clientes')
  const [showAddCliente, setShowAddCliente] = useState(false)
  const [showAddProveedor, setShowAddProveedor] = useState(false)
  const [cf, setCf] = useState({ name: '', phone: '', email: '', city: '', tier: 'Prospecto', notes: '' })
  const [pf, setPf] = useState({ name: '', type: 'Particular', phone: '', email: '', city: '', notes: '' })
  const inputStyle = { background: S3, border: `1px solid ${BR}`, color: TX, padding: '10px 14px', borderRadius: 4, fontFamily: "'Jost', sans-serif", fontSize: 13, width: '100%', outline: 'none' }
  const Stars = n => '★'.repeat(n) + '☆'.repeat(5 - n)

  const saveCliente = () => {
    setState(s => ({ ...s, clients: [...(s.clients || []), { ...cf, id: 'C' + uid(), totalSpent: 0, totalPurchases: 0 }] }))
    setShowAddCliente(false)
    setCf({ name: '', phone: '', email: '', city: '', tier: 'Prospecto', notes: '' })
  }

  const saveProveedor = () => {
    setState(s => ({ ...s, suppliers: [...(s.suppliers || []), { ...pf, id: 'P' + uid(), rating: 3, totalDeals: 0 }] }))
    setShowAddProveedor(false)
    setPf({ name: '', type: 'Particular', phone: '', email: '', city: '', notes: '' })
  }

  return (
    <div>
      <SH title="Contactos" />
      <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: `1px solid ${BR}` }}>
        {[['clientes', 'Clientes', (clients||[]).length], ['proveedores', 'Proveedores', (suppliers||[]).length]].map(([id, label, n]) => (
          <button key={id} onClick={() => setTab(id)}
            style={{ padding: '10px 20px', background: 'none', border: 'none', borderBottom: tab === id ? `2px solid ${G}` : '2px solid transparent', color: tab === id ? G : TM, fontFamily: "'Jost', sans-serif", fontSize: 12, cursor: 'pointer', letterSpacing: '.06em' }}>
            {label} <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: tab === id ? G : TD, marginLeft: 4 }}>{n}</span>
          </button>
        ))}
      </div>

      {tab === 'clientes' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
            <Btn onClick={() => setShowAddCliente(true)}>+ Nuevo Cliente</Btn>
          </div>
          {(clients||[]).length === 0 ? (
            <div style={{ border: `1px dashed ${BR}`, borderRadius: 6, padding: 32, textAlign: 'center', fontFamily: "'DM Mono', monospace", fontSize: 11, color: TD }}>
              Sin clientes registrados · click "+ Nuevo Cliente" para agregar
            </div>
          ) : (
            <div style={{ background: S1, border: `1px solid ${BR}`, borderRadius: 6, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr style={{ borderBottom: `1px solid ${BR}` }}>{['Nombre', 'Tier', 'Ciudad', 'Teléfono', 'Email', 'Compras', 'Facturado'].map(h => <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontFamily: "'DM Mono', monospace", fontSize: 10, color: TM, letterSpacing: '.1em', fontWeight: 400 }}>{h}</th>)}</tr></thead>
                <tbody>
                  {(clients||[]).map(c => (
                    <tr key={c.id} style={{ borderBottom: `1px solid ${BR}` }} onMouseEnter={e => e.currentTarget.style.background = S2} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '11px 14px', fontFamily: "'Jost', sans-serif", fontSize: 13, color: TX }}>{c.name}</td>
                      <td style={{ padding: '11px 14px' }}><Badge label={c.tier} color={({ VIP: G, Regular: BLU, Prospecto: TM })[c.tier] || TM} small /></td>
                      <td style={{ padding: '11px 14px', fontFamily: "'Jost', sans-serif", fontSize: 12, color: TM }}>{c.city || '—'}</td>
                      <td style={{ padding: '11px 14px', fontFamily: "'DM Mono', monospace", fontSize: 11, color: TM }}>{c.phone || '—'}</td>
                      <td style={{ padding: '11px 14px', fontFamily: "'DM Mono', monospace", fontSize: 11, color: TM }}>{c.email || '—'}</td>
                      <td style={{ padding: '11px 14px', fontFamily: "'DM Mono', monospace", fontSize: 11, color: TX, textAlign: 'center' }}>{c.totalPurchases || 0}</td>
                      <td style={{ padding: '11px 14px', fontFamily: "'DM Mono', monospace", fontSize: 11, color: G }}>{c.totalSpent > 0 ? fmt(c.totalSpent) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'proveedores' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
            <Btn onClick={() => setShowAddProveedor(true)}>+ Nuevo Proveedor</Btn>
          </div>
          {(suppliers||[]).length === 0 ? (
            <div style={{ border: `1px dashed ${BR}`, borderRadius: 6, padding: 32, textAlign: 'center', fontFamily: "'DM Mono', monospace", fontSize: 11, color: TD }}>
              Sin proveedores registrados · click "+ Nuevo Proveedor" para agregar
            </div>
          ) : (
            <div style={{ background: S1, border: `1px solid ${BR}`, borderRadius: 6, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr style={{ borderBottom: `1px solid ${BR}` }}>{['Nombre', 'Tipo', 'Ciudad', 'Teléfono', 'Email', 'Operaciones', 'Rating'].map(h => <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontFamily: "'DM Mono', monospace", fontSize: 10, color: TM, letterSpacing: '.1em', fontWeight: 400 }}>{h}</th>)}</tr></thead>
                <tbody>
                  {(suppliers||[]).map(s => (
                    <tr key={s.id} style={{ borderBottom: `1px solid ${BR}` }} onMouseEnter={e => e.currentTarget.style.background = S2} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '11px 14px', fontFamily: "'Jost', sans-serif", fontSize: 13, color: TX }}>{s.name}</td>
                      <td style={{ padding: '11px 14px' }}><Badge label={s.type} color={BLU} small /></td>
                      <td style={{ padding: '11px 14px', fontFamily: "'Jost', sans-serif", fontSize: 12, color: TM }}>{s.city || '—'}</td>
                      <td style={{ padding: '11px 14px', fontFamily: "'DM Mono', monospace", fontSize: 11, color: TM }}>{s.phone || '—'}</td>
                      <td style={{ padding: '11px 14px', fontFamily: "'DM Mono', monospace", fontSize: 11, color: TM }}>{s.email || '—'}</td>
                      <td style={{ padding: '11px 14px', fontFamily: "'DM Mono', monospace", fontSize: 11, color: G, textAlign: 'center' }}>{s.totalDeals || 0}</td>
                      <td style={{ padding: '11px 14px', color: G, fontSize: 13 }}>{Stars(s.rating || 3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* FORM NUEVO CLIENTE */}
      {showAddCliente && (
        <Modal title="Nuevo Cliente" onClose={() => setShowAddCliente(false)} width={500}>
          <FR>
            <Field label="Nombre completo" required>
              <input value={cf.name} onChange={e => setCf(f => ({ ...f, name: e.target.value }))} placeholder="Ej. García, Roberto" style={inputStyle} />
            </Field>
            <Field label="Tier">
              <select value={cf.tier} onChange={e => setCf(f => ({ ...f, tier: e.target.value }))} style={inputStyle}>
                {['Prospecto', 'Regular', 'VIP'].map(t => <option key={t}>{t}</option>)}
              </select>
            </Field>
          </FR>
          <FR>
            <Field label="Teléfono">
              <input value={cf.phone} onChange={e => setCf(f => ({ ...f, phone: e.target.value }))} placeholder="+52 55 0000 0000" style={inputStyle} />
            </Field>
            <Field label="Email">
              <input value={cf.email} onChange={e => setCf(f => ({ ...f, email: e.target.value }))} placeholder="correo@ejemplo.com" style={inputStyle} />
            </Field>
          </FR>
          <Field label="Ciudad">
            <input value={cf.city} onChange={e => setCf(f => ({ ...f, city: e.target.value }))} placeholder="CDMX, Monterrey..." style={inputStyle} />
          </Field>
          <Field label="Notas">
            <textarea rows={2} value={cf.notes} onChange={e => setCf(f => ({ ...f, notes: e.target.value }))} placeholder="Preferencias, observaciones..." style={{ ...inputStyle, resize: 'vertical', marginBottom: 14 }} />
          </Field>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Btn small variant="secondary" onClick={() => setShowAddCliente(false)}>Cancelar</Btn>
            <Btn small onClick={saveCliente} disabled={!cf.name}>Guardar Cliente</Btn>
          </div>
        </Modal>
      )}

      {/* FORM NUEVO PROVEEDOR */}
      {showAddProveedor && (
        <Modal title="Nuevo Proveedor" onClose={() => setShowAddProveedor(false)} width={500}>
          <FR>
            <Field label="Nombre" required>
              <input value={pf.name} onChange={e => setPf(f => ({ ...f, name: e.target.value }))} placeholder="Nombre o razón social" style={inputStyle} />
            </Field>
            <Field label="Tipo">
              <select value={pf.type} onChange={e => setPf(f => ({ ...f, type: e.target.value }))} style={inputStyle}>
                {['Particular', 'Coleccionista', 'Dealer', 'Casa de Empeño', 'Subasta', 'Otro'].map(t => <option key={t}>{t}</option>)}
              </select>
            </Field>
          </FR>
          <FR>
            <Field label="Teléfono">
              <input value={pf.phone} onChange={e => setPf(f => ({ ...f, phone: e.target.value }))} placeholder="+52 55 0000 0000" style={inputStyle} />
            </Field>
            <Field label="Email">
              <input value={pf.email} onChange={e => setPf(f => ({ ...f, email: e.target.value }))} placeholder="correo@ejemplo.com" style={inputStyle} />
            </Field>
          </FR>
          <Field label="Ciudad">
            <input value={pf.city} onChange={e => setPf(f => ({ ...f, city: e.target.value }))} placeholder="CDMX, Monterrey..." style={inputStyle} />
          </Field>
          <Field label="Notas">
            <textarea rows={2} value={pf.notes} onChange={e => setPf(f => ({ ...f, notes: e.target.value }))} placeholder="Observaciones, condiciones..." style={{ ...inputStyle, resize: 'vertical', marginBottom: 14 }} />
          </Field>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Btn small variant="secondary" onClick={() => setShowAddProveedor(false)}>Cancelar</Btn>
            <Btn small onClick={saveProveedor} disabled={!pf.name}>Guardar Proveedor</Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
//  ROOT APP
// ══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [authUser, setAuthUser]   = useState(null)
  const [profile, setProfile]     = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [page, setPage]           = useState('dashboard')
  const [appState, setAppState]   = useState({ ...DEMO })

  useEffect(() => {
    // Check existing session
    sb.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const { data: p } = await sb.from('profiles').select('*').eq('id', session.user.id).maybeSingle()
        setAuthUser(session.user)
        setProfile(p || { role: 'pending', name: session.user.email })
      }
      setAuthLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = sb.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const { data: p } = await sb.from('profiles').select('*').eq('id', session.user.id).maybeSingle()
        setAuthUser(session.user)
        setProfile(p || { role: 'pending', name: session.user.email })
      } else if (event === 'SIGNED_OUT') {
        setAuthUser(null); setProfile(null)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const logout = async () => { await sb.auth.signOut(); setAuthUser(null); setProfile(null); setPage('dashboard') }

  // Auto-select first valid page (must be before any conditional returns)
  useEffect(() => {
    if (profile && profile.role) {
      const nav = NAV_ITEMS.filter(n => n.roles.includes(profile.role))
      if (!nav.find(n => n.id === page) && nav.length > 0) setPage(nav[0].id)
    }
  }, [profile?.role])

  // Loading
  if (authLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: BG }}>
      <style>{`@keyframes fi{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: TD, letterSpacing: '.2em' }}>CARGANDO TWR OS...</div>
    </div>
  )

  // Not logged in
  if (!authUser) return (
    <>
      <style>{`@keyframes fi{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}} input,select{background:#222;border:1px solid #2A2A2A;color:#E8E2D5;padding:10px 14px;border-radius:4px;font-family:'Jost',sans-serif;font-size:13px;width:100%;outline:none;transition:border-color .2s} input:focus,select:focus{border-color:#C9A96E}`}</style>
      <AuthScreen onAuth={(u, p) => { setAuthUser(u); setProfile(p || { role: 'pending' }) }} />
    </>
  )

  // Pending role
  if (!profile || profile.role === 'pending') return (
    <>
      <style>{`@keyframes fi{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <PendingScreen user={authUser} onLogout={logout} />
    </>
  )

  const role       = profile ? profile.role : null
  const allowedNav = role ? NAV_ITEMS.filter(n => n.roles.includes(role)) : []
  const hasSaleAlert = role !== 'inversionista' && appState.sales.some(s => s.status !== 'Liquidado')

  const renderPage = () => {
    const s = { state: appState, setState: setAppState }
    switch (page) {
      case 'dashboard':      return <DashboardModule state={appState} />
      case 'inventario':     return <InventarioModule {...s} />
      case 'ventas':         return <VentasModule {...s} />
      case 'inversionistas': return <InversionistasModule {...s} />
      case 'contactos':      return <ContactosModule state={appState} setState={setAppState} />
      case 'catalogos':      return <CatalogosModule {...s} />
      case 'reportes':       return <ReportesModule state={appState} />
      case 'admin':          return <AdminModule currentUser={authUser} />
      default:               return null
    }
  }

  return (
    <>
      <style>{`
        @keyframes fi { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:translateY(0) } }
        input, select, textarea { background:${S3}; border:1px solid ${BR}; color:${TX}; padding:10px 14px; border-radius:4px; font-family:'Jost',sans-serif; font-size:13px; width:100%; outline:none; transition:border-color .2s; }
        input:focus, select:focus, textarea:focus { border-color:${G}; }
        input::placeholder, textarea::placeholder { color:${TD}; }
        select option { background:${S3}; }
        label { display:block; font-family:'DM Mono',monospace; font-size:10px; color:${TM}; letter-spacing:.1em; text-transform:uppercase; margin-bottom:6px; }
      `}</style>
      <div style={{ display: 'flex', height: '100vh', background: BG, color: TX, fontFamily: "'Jost', sans-serif", overflow: 'hidden' }}>
        {/* Sidebar */}
        <div style={{ width: 210, background: S1, borderRight: `1px solid ${BR}`, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <div style={{ padding: '22px 20px 16px', borderBottom: `1px solid ${BR}` }}>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, color: G, lineHeight: 1.1 }}>The Wrist Room</div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: TD, letterSpacing: '.2em', marginTop: 4 }}>TWR OS · v4.0</div>
          </div>
          <nav style={{ padding: '8px 0', flex: 1, overflowY: 'auto' }}>
            {allowedNav.map(item => {
              const active = page === item.id
              const isAlert = item.id === 'ventas' && hasSaleAlert
              return (
                <button key={item.id} onClick={() => setPage(item.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 20px', background: active ? BRG : 'transparent', border: 'none', color: active ? G : TM, cursor: 'pointer', borderLeft: `2px solid ${active ? G : 'transparent'}`, textAlign: 'left' }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.background = S2; e.currentTarget.style.color = TX } }}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = TM } }}>
                  <span style={{ fontSize: 13 }}>{item.icon}</span>
                  <span style={{ fontFamily: "'Jost', sans-serif", fontSize: 12, letterSpacing: '.06em', fontWeight: active ? 500 : 300 }}>{item.label}</span>
                  {isAlert && <div style={{ width: 6, height: 6, borderRadius: '50%', background: RED, marginLeft: 'auto' }} />}
                </button>
              )
            })}
          </nav>
          <div style={{ padding: '12px 16px', borderTop: `1px solid ${BR}` }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: TM, marginBottom: 3, letterSpacing: '.1em' }}>{profile.name || authUser.email}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Badge label={ROLES[role]?.label || role} color={ROLES[role]?.color || TM} small />
              <button onClick={logout} style={{ background: 'none', border: 'none', fontFamily: "'DM Mono', monospace", fontSize: 9, color: TD, cursor: 'pointer', letterSpacing: '.08em' }}>SALIR</button>
            </div>
          </div>
        </div>
        {/* Main content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 28 }}>{renderPage()}</div>
      </div>
    </>
  )
}
