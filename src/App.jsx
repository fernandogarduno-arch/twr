import React, { useState, useEffect, useCallback } from 'react'
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
//  DESIGN TOKENS — The Wrist Room Navy Theme
// ══════════════════════════════════════════════════════════════════════════════
const G   = '#C9A96E'  // Gold accent (hallmark brand)
const BG  = '#071829'  // Near-black navy (deepest layer)
const S1  = '#0C2238'  // Dark navy (sidebar, main surface)
const S2  = '#0F2B46'  // Card / panel
const S3  = '#144058'  // Elevated input / table header
const BR  = '#1C3D58'  // Border subtle
const BRG = '#2A5272'  // Border accent / focused
const TX  = '#F0EDE7'  // Warm white (matches logo text)
const TM  = '#7BA0BA'  // Muted navy-blue label text
const TD  = '#4A6E88'  // Dim/placeholder text
const RED = '#E05A5A'  // Error / danger
const GRN = '#2ECC71'  // Success / active
const BLU = '#4AADE6'  // Info / Operador badge
const PRP = '#A478C8'  // Oportunidad / Inversionista badge

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
//  DB HELPERS — write to Supabase
// ══════════════════════════════════════════════════════════════════════════════
const db = {
  // MARCAS
  async saveBrand(brand) {
    const { error } = await sb.from('marcas').upsert({
      id: brand.id, name: brand.name, country: brand.country,
      founded: brand.founded || null, notes: brand.notes || null
    })
    if (error) throw new Error(error.message)
  },

  // MODELOS
  async saveModel(model) {
    const { error } = await sb.from('modelos').upsert({
      id: model.id, brand_id: model.brandId, name: model.name,
      family: model.family || null, notes: model.notes || null
    })
    if (error) throw new Error(error.message)
  },

  // REFERENCIAS
  async saveRef(ref) {
    const { error } = await sb.from('referencias').upsert({
      id: ref.id, model_id: ref.modelId, ref: ref.ref,
      caliber: ref.caliber || null, material: ref.material || null,
      bezel: ref.bezel || null, dial: ref.dial || null,
      size: ref.size || null, bracelet: ref.bracelet || null,
      year: ref.year || null, notes: ref.notes || null
    })
    if (error) throw new Error(error.message)
  },

  // PROVEEDORES
  async saveSupplier(s) {
    const { error } = await sb.from('proveedores').upsert({
      id: s.id, name: s.name, type: s.type, phone: s.phone || null,
      email: s.email || null, city: s.city || null, notes: s.notes || null,
      rating: s.rating || 3, total_deals: s.totalDeals || 0
    })
    if (error) throw new Error(error.message)
  },

  // CLIENTES
  async saveClient(c) {
    const { error } = await sb.from('clientes').upsert({
      id: c.id, name: c.name, phone: c.phone || null, email: c.email || null,
      city: c.city || null, tier: c.tier || 'Prospecto', notes: c.notes || null,
      total_spent: c.totalSpent || 0, total_purchases: c.totalPurchases || 0
    })
    if (error) throw new Error(error.message)
  },

  // PIEZAS
  async saveWatch(w) {
    const { error } = await sb.from('piezas').upsert({
      id: w.id, ref_id: w.refId, supplier_id: w.supplierId,
      serial: w.serial || null, condition: w.condition,
      full_set: w.fullSet, papers: w.papers, box: w.box,
      cost: w.cost || 0, price_asked: w.priceAsked || 0,
      entry_date: w.entryDate || null, status: w.status,
      stage: w.stage, validated_by: w.validatedBy || null,
      validation_date: w.validationDate || null, notes: w.notes || null,
      modo_adquisicion: w.modoAdquisicion || 'sociedad',
      socio_aporta_id: w.socioAportaId || null,
      split_personalizado: w.splitPersonalizado || null
    })
    if (error) throw new Error(error.message)
  },

  // COSTO DE PIEZA
  async saveCosto(c) {
    const { error } = await sb.from('costos_pieza').upsert({
      id: c.id, pieza_id: c.piezaId, tipo: c.tipo,
      fecha: c.fecha || null, monto: c.monto,
      descripcion: c.descripcion || null
    })
    if (error) throw new Error(error.message)
  },

  // VENTAS
  async saveVenta(v) {
    const { error } = await sb.from('ventas').upsert({
      id: v.id, pieza_id: v.watchId, cliente_id: v.clientId,
      sale_date: v.saleDate, agreed_price: v.agreedPrice,
      status: v.status, notes: v.notes || null
    })
    if (error) throw new Error(error.message)
  },

  async updateVentaStatus(id, status) {
    const { error } = await sb.from('ventas').update({ status }).eq('id', id)
    if (error) throw new Error(error.message)
  },

  // PAGOS
  async savePago(p) {
    const { error } = await sb.from('pagos').upsert({
      id: p.id, venta_id: p.ventaId, date: p.date,
      amount: p.amount, method: p.method, notes: p.notes || null
    })
    if (error) throw new Error(error.message)
  },

  // SOCIOS
  async saveSocio(s) {
    const { error } = await sb.from('socios').upsert({
      id: s.id, name: s.name, participacion: s.participacion,
      color: s.color, activo: s.activo
    })
    if (error) throw new Error(error.message)
  },

  // MOVIMIENTO SOCIO
  async saveMovimientoSocio(m) {
    const { error } = await sb.from('movimientos_socios').upsert({
      id: m.id, socio_id: m.socioId, fecha: m.fecha,
      tipo: m.tipo, monto: m.monto, concepto: m.concepto || null
    })
    if (error) throw new Error(error.message)
  },

  // TIPOS DE COSTO
  async saveTipoCosto(t) {
    const { error } = await sb.from('tipos_costo').upsert({
      id: t.id, nombre: t.nombre, icono: t.icono || '📋'
    })
    if (error) throw new Error(error.message)
  },

  // ACTUALIZAR ESTADO DE PIEZA
  async updateWatchStage(id, stage, status, extra = {}) {
    const { error } = await sb.from('piezas').update({ stage, status, ...extra }).eq('id', id)
    if (error) throw new Error(error.message)
  },

  // ACTUALIZAR CLIENTE stats
  async updateClientStats(clientId, spent, purchases) {
    const { error } = await sb.from('clientes').update({
      total_spent: spent, total_purchases: purchases
    }).eq('id', clientId)
    if (error) throw new Error(error.message)
  },
}

// ══════════════════════════════════════════════════════════════════════════════
//  QUICK CREATE — inline mini-modal para crear sin salir del flujo
// ══════════════════════════════════════════════════════════════════════════════
function QuickCreate({ title, onClose, children, error, saving }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#00000088', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
         onClick={e => e.target === e.currentTarget && !saving && onClose()}>
      <div style={{ background: S2, border: `1px solid ${BRG}`, borderRadius: 8, padding: 20, width: 420, boxShadow: '0 20px 60px #00000066', animation: 'fi .15s ease' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: G, letterSpacing: '.15em' }}>CREAR · {title.toUpperCase()}</div>
          <button onClick={saving ? undefined : onClose} style={{ background: 'none', border: 'none', color: TM, cursor: saving ? 'not-allowed' : 'pointer', fontSize: 18, lineHeight: 1, opacity: saving ? .4 : 1 }}>×</button>
        </div>
        {error && (
          <div style={{ background: '#E05A5A22', border: '1px solid #E05A5A44', borderRadius: 4, padding: '8px 12px', marginBottom: 12,
                        fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#E05A5A', letterSpacing: '.05em' }}>
            {error}
          </div>
        )}
        {saving && (
          <div style={{ background: G + '18', border: `1px solid ${G}44`, borderRadius: 4, padding: '8px 12px', marginBottom: 12,
                        fontFamily: "'DM Mono', monospace", fontSize: 10, color: G, letterSpacing: '.1em', textAlign: 'center',
                        animation: 'pulse 1.2s infinite' }}>
            GUARDANDO...
          </div>
        )}
        {children}
      </div>
    </div>
  )
}

// Selector with inline "+ Crear" button
function SelectWithCreate({ label, value, onChange, options, disabled, onClickCreate, createLabel }) {
  const inputStyle = { background: S3, border: `1px solid ${BR}`, color: TX, padding: '10px 14px', borderRadius: 4, fontFamily: "'Jost', sans-serif", fontSize: 13, width: '100%', outline: 'none' }
  return (
    <div style={{ flex: 1 }}>
      <label style={{ display: 'block', fontFamily: "'DM Mono', monospace", fontSize: 10, color: TM, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 6 }}>{label}</label>
      <div style={{ display: 'flex', gap: 6 }}>
        <select value={value} onChange={e => onChange(e.target.value)} disabled={disabled} style={{ ...inputStyle, flex: 1 }}>
          {options}
        </select>
        <button onClick={onClickCreate} title={createLabel || '+ Crear nuevo'}
          style={{ background: S3, border: `1px solid ${BRG}`, color: G, padding: '0 12px', borderRadius: 4, cursor: 'pointer', fontSize: 16, flexShrink: 0, fontFamily: "'DM Mono', monospace' " }}>
          +
        </button>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
//  INLINE SELECT — select + "Crear nuevo" sin salir del form
// ══════════════════════════════════════════════════════════════════════════════
/**
 * InlineSelect: dropdown con botón "+ Nuevo" que abre un mini form inline
 * Props:
 *   value, onChange, options [{id, label}], placeholder
 *   createLabel  — texto del botón (ej. "+ Nueva Marca")
 *   createFields — [{ key, label, type?, options? }]  campos del mini form
 *   onCreateSave — fn(newItem) => void
 *   style
 */
function InlineSelect({ value, onChange, options, placeholder, createLabel, createFields, onCreateSave, style }) {
  const [open, setOpen]   = useState(false)
  const [form, setForm]   = useState({})
  const inputS = { background: S3, border: `1px solid ${BR}`, color: TX, padding: '8px 12px', borderRadius: 4, fontFamily: "'Jost', sans-serif", fontSize: 12, width: '100%', outline: 'none' }

  const handleSave = () => {
    if (!form[createFields[0].key]) return
    onCreateSave(form)
    setForm({})
    setOpen(false)
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 6 }}>
        <select value={value} onChange={e => onChange(e.target.value)}
          style={{ ...style, flex: 1, background: S3, border: `1px solid ${BR}`, color: TX, padding: '10px 14px', borderRadius: 4, fontFamily: "'Jost', sans-serif", fontSize: 13, outline: 'none' }}>
          <option value="">{placeholder || '— Seleccionar —'}</option>
          {options.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
        <button onClick={() => setOpen(v => !v)}
          style={{ padding: '8px 10px', background: open ? G + '22' : S2, border: `1px solid ${open ? G : BR}`, color: open ? G : TM, borderRadius: 4, cursor: 'pointer', fontFamily: "'DM Mono', monospace", fontSize: 10, whiteSpace: 'nowrap', letterSpacing: '.06em' }}>
          {open ? '✕' : '+ Nuevo'}
        </button>
      </div>

      {open && (
        <div style={{ background: S2, border: `1px solid ${BRG}`, borderRadius: 6, padding: 14, marginTop: 8, animation: 'fi .15s ease' }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: G, marginBottom: 10, letterSpacing: '.1em' }}>{createLabel}</div>
          <div style={{ display: 'grid', gridTemplateColumns: createFields.length > 1 ? '1fr 1fr' : '1fr', gap: 8, marginBottom: 10 }}>
            {createFields.map(f => (
              <div key={f.key}>
                <label style={{ display: 'block', fontFamily: "'DM Mono', monospace", fontSize: 9, color: TM, letterSpacing: '.1em', marginBottom: 4 }}>{f.label}</label>
                {f.type === 'select' ? (
                  <select value={form[f.key] || ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} style={inputS}>
                    {(f.options || []).map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <input type={f.type || 'text'} value={form[f.key] || ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder || ''} style={inputS} />
                )}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
            <button onClick={() => { setOpen(false); setForm({}) }}
              style={{ padding: '6px 12px', background: 'none', border: `1px solid ${BR}`, color: TM, borderRadius: 3, cursor: 'pointer', fontFamily: "'DM Mono', monospace", fontSize: 10 }}>Cancelar</button>
            <button onClick={handleSave} disabled={!form[createFields[0].key]}
              style={{ padding: '6px 12px', background: G, border: 'none', color: BG, borderRadius: 3, cursor: 'pointer', fontFamily: "'DM Mono', monospace", fontSize: 10, fontWeight: 600, opacity: !form[createFields[0].key] ? .5 : 1 }}>Guardar</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
//  TOAST NOTIFICATIONS
// ══════════════════════════════════════════════════════════════════════════════
let _toastFn = null
const toast = (msg, type = 'success') => _toastFn && _toastFn(msg, type)

function ToastContainer() {
  const [toasts, setToasts] = useState([])
  useEffect(() => {
    _toastFn = (msg, type) => {
      const id = uid()
      setToasts(t => [...t, { id, msg, type }])
      setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000)
    }
    return () => { _toastFn = null }
  }, [])

  const colors = { success: GRN, error: RED, info: G, warning: '#E67E22' }

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, display: 'flex', flexDirection: 'column', gap: 8, zIndex: 9999, pointerEvents: 'none' }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background: S1, border: `1px solid ${colors[t.type] || GRN}`,
          borderLeft: `3px solid ${colors[t.type] || GRN}`,
          borderRadius: 4, padding: '10px 16px',
          display: 'flex', alignItems: 'center', gap: 10,
          fontFamily: "'DM Mono', monospace", fontSize: 11, color: TX,
          boxShadow: '0 4px 20px rgba(0,0,0,.5)',
          animation: 'fi .2s ease',
          minWidth: 220, maxWidth: 360,
        }}>
          <span style={{ color: colors[t.type] || GRN, fontSize: 13 }}>
            {t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : t.type === 'warning' ? '⚠' : '·'}
          </span>
          {t.msg}
        </div>
      ))}
    </div>
  )
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

// ── UI PRIMITIVES ────────────────────────────────────────────────────────────

// Modal overlay
function Modal({ title, onClose, width = 520, children }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.75)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}
         onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:S2, border:`1px solid ${BR}`, borderRadius:8, width:'100%', maxWidth:width,
                    maxHeight:'90vh', overflowY:'auto', animation:'fi .2s ease' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 24px', borderBottom:`1px solid ${BR}` }}>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:18, color: G }}>{title}</div>
          <button onClick={onClose} style={{ background:'none', border:'none', color: TD, fontSize:20, cursor:'pointer', lineHeight:1 }}>×</button>
        </div>
        <div style={{ padding:24 }}>{children}</div>
      </div>
    </div>
  )
}

// Button with variants: primary (default), secondary, ghost
function Btn({ children, onClick, disabled, variant = 'primary', small, style: extraStyle }) {
  const base = {
    border: 'none', borderRadius: 4, cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: "'DM Mono',monospace", fontSize: small ? 10 : 11, letterSpacing: '.15em',
    padding: small ? '7px 14px' : '10px 20px', transition: 'opacity .2s', opacity: disabled ? .45 : 1,
    ...extraStyle
  }
  const variants = {
    primary:   { background: G,             color: BG },
    secondary: { background: 'transparent', color: TD,  border: `1px solid ${BR}` },
    ghost:     { background: 'transparent', color: G,   border: `1px solid ${G}44` },
  }
  return (
    <button onClick={disabled ? undefined : onClick} style={{ ...base, ...variants[variant] }}
      onMouseOver={e => { if (!disabled) e.currentTarget.style.opacity = '.75' }}
      onMouseOut={e => { e.currentTarget.style.opacity = disabled ? '.45' : '1' }}>
      {children}
    </button>
  )
}

// Field wrapper: label + input/children
function Field({ label, children, style: extraStyle }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6, flex:1, ...extraStyle }}>
      <div style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color: TD, letterSpacing:'.2em' }}>{label}</div>
      {children}
    </div>
  )
}

// Form Row — flex row with gap
function FR({ children, gap = 12 }) {
  return <div style={{ display:'flex', gap, marginBottom:14, flexWrap:'wrap' }}>{children}</div>
}

// Info row for detail panels
function InfoRow({ label, value, color }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 0', borderBottom:'1px solid #222' }}>
      <span style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color: TD, letterSpacing:'.15em' }}>{label}</span>
      <span style={{ fontFamily:"'Jost',sans-serif", fontSize:13, color: color || '#C0B090' }}>{value}</span>
    </div>
  )
}

// Section divider with label
function Divider({ label }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, margin:'16px 0 8px' }}>
      <div style={{ flex:1, height:1, background: BR }} />
      {label && <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color: TD, letterSpacing:'.25em' }}>{label}</div>}
      <div style={{ flex:1, height:1, background: BR }} />
    </div>
  )
}

// Error boundary — aísla crashes de módulos individuales
class PageBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(e) { return { error: e } }
  componentDidCatch(e, info) { console.error('PageBoundary caught:', e, info) }
  render() {
    if (this.state.error) return (
      <div style={{ padding:40, textAlign:'center' }}>
        <div style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color: RED, marginBottom:16 }}>ERROR EN MÓDULO</div>
        <div style={{ fontFamily:"'Jost',sans-serif", fontSize:13, color: TD, marginBottom:24 }}>{this.state.error.message}</div>
        <button onClick={() => this.setState({ error: null })}
          style={{ padding:'8px 20px', background:'transparent', border:`1px solid ${G}`, color: G,
                   fontFamily:"'DM Mono',monospace", fontSize:10, letterSpacing:'.15em', cursor:'pointer', borderRadius:4 }}>
          REINTENTAR
        </button>
      </div>
    )
    return this.props.children
  }
}

// Section Header — usado en todos los módulos
function SH({ title, subtitle, action, onAction }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, paddingBottom:16, borderBottom:`1px solid #2A2A2A` }}>
      <div>
        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, color: G, lineHeight:1.2 }}>{title}</div>
        {subtitle && <div style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color: TD, letterSpacing:'.2em', marginTop:4 }}>{subtitle}</div>}
      </div>
      {action && (
        <button onClick={onAction}
          style={{ padding:'8px 18px', background: G, border:'none', borderRadius:4, color: BG,
                   fontFamily:"'DM Mono',monospace", fontSize:10, letterSpacing:'.15em', cursor:'pointer',
                   transition:'opacity .2s', whiteSpace:'nowrap' }}
          onMouseOver={e=>e.target.style.opacity='.8'} onMouseOut={e=>e.target.style.opacity='1'}>
          {action}
        </button>
      )}
    </div>
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
// ── Mini SVG bar chart ────────────────────────────────────────────────────────
function MiniBarChart({ data, height = 80, color = G }) {
  const max = Math.max(...data.map(d => d.value), 1)
  const w = 100 / data.length
  return (
    <svg viewBox={`0 0 100 ${height}`} style={{ width: '100%', height }} preserveAspectRatio="none">
      {data.map((d, i) => {
        const barH = (d.value / max) * (height - 16)
        const x = i * w + w * 0.15
        const barW = w * 0.7
        return (
          <g key={i}>
            <rect x={x} y={height - 16 - barH} width={barW} height={barH} fill={color} opacity={0.85} rx="1" />
            <text x={x + barW / 2} y={height - 2} textAnchor="middle" fontSize="6" fill="#6B6B6B" fontFamily="DM Mono">{d.label}</text>
          </g>
        )
      })}
    </svg>
  )
}

// ── Donut chart SVG ───────────────────────────────────────────────────────────
function DonutChart({ slices, size = 120 }) {
  const r = 40, cx = 60, cy = 60
  const circ = 2 * Math.PI * r
  let offset = 0
  const total = slices.reduce((a, s) => a + s.value, 0) || 1
  return (
    <svg width={size} height={size} viewBox="0 0 120 120">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={S1} strokeWidth="16" />
      {slices.map((s, i) => {
        const pct = s.value / total
        const dash = pct * circ
        const el = (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.color} strokeWidth="16"
            strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={-offset}
            style={{ transform: 'rotate(-90deg)', transformOrigin: '60px 60px' }} />
        )
        offset += dash
        return el
      })}
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize="11" fill="#E8E2D5" fontFamily="DM Mono">{total}</text>
      <text x={cx} y={cy + 10} textAnchor="middle" fontSize="7" fill="#6B6B6B" fontFamily="DM Mono">PIEZAS</text>
    </svg>
  )
}

function DashboardModule({ state }) {
  const { watches, sales, investors, brands, models, refs, clients } = state
  const inv     = watches.filter(w => w.stage === 'inventario')
  const opp     = watches.filter(w => w.stage === 'oportunidad')
  const sold    = watches.filter(w => w.stage === 'liquidado')
  const capital = investors.reduce((a, i) => a + i.capitalAportado, 0)
  const utilidad = sales.reduce((a, s) => { const w = watches.find(x => x.id === s.watchId); return a + (s.agreedPrice - (w?.cost || 0)) }, 0)
  const porCobrar = sales.filter(s => s.status !== 'Liquidado').reduce((a, s) => { const c = (s.payments || []).reduce((x, p) => x + p.amount, 0); return a + (s.agreedPrice - c) }, 0)
  const valorInventario = inv.reduce((a, w) => a + (w.cost || 0), 0)

  // Monthly sales data for bar chart (last 6 months)
  const now = new Date()
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
    const label = d.toLocaleDateString('es-MX', { month: 'short' }).toUpperCase().slice(0, 3)
    const value = sales.filter(s => {
      const sd = new Date(s.date)
      return sd.getFullYear() === d.getFullYear() && sd.getMonth() === d.getMonth()
    }).reduce((a, s) => { const w = watches.find(x => x.id === s.watchId); return a + (s.agreedPrice - (w?.cost || 0)) }, 0)
    return { label, value: Math.max(value, 0) }
  })

  // Brand distribution in inventory
  const brandDist = brands.map((b, i) => {
    const bModels = models.filter(m => m.brandId === b.id).map(m => m.id)
    const bRefs = refs.filter(r => bModels.includes(r.modelId)).map(r => r.id)
    const count = inv.filter(w => bRefs.includes(w.refId)).length
    return { name: b.name, value: count, color: [G, BLU, GRN, PRP, RED, '#E8A040'][i % 6] }
  }).filter(b => b.value > 0)

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

  const card = { background: S1, border: `1px solid ${BR}`, borderRadius: 6 }
  const cardHdr = { padding: '12px 18px', borderBottom: `1px solid ${BR}`, fontFamily: "'DM Mono', monospace", fontSize: 10, color: TM, letterSpacing: '.1em' }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
        <svg width="36" height="36" viewBox="0 0 80 80" fill="none">
          <line x1="14" y1="10" x2="32" y2="58" stroke="white" strokeWidth="5.5" strokeLinecap="round"/>
          <line x1="32" y1="58" x2="42" y2="30" stroke="white" strokeWidth="5.5" strokeLinecap="round"/>
          <line x1="42" y1="30" x2="52" y2="58" stroke="white" strokeWidth="5.5" strokeLinecap="round"/>
          <line x1="52" y1="58" x2="68" y2="10" stroke="white" strokeWidth="5.5" strokeLinecap="round"/>
          <line x1="14" y1="10" x2="24" y2="68" stroke={G} strokeWidth="3" strokeLinecap="round"/>
          <circle cx="24" cy="70" r="3.5" fill={G}/>
        </svg>
        <div>
          <div style={{ display:'flex', alignItems:'baseline', gap:6 }}>
            <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:11, color:TM, letterSpacing:'.35em', textTransform:'uppercase' }}>The</span>
            <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:28, color:TX, letterSpacing:'.1em', fontWeight:600 }}>Wrist Room</span>
          </div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: TM, marginTop: 2, letterSpacing: '.08em' }}>{new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase()}</div>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 16 }}>
        <KPI label="Capital Total"      value={fmt(capital)}          sub={`${investors.length} socios`} />
        <KPI label="Valor Inventario"   value={fmt(valorInventario)}  sub={`${inv.length} piezas activas`} accent={GRN} />
        <KPI label="Por Cobrar"         value={fmt(porCobrar)}        accent={porCobrar > 0 ? RED : GRN} sub={porCobrar > 0 ? 'Pendiente de pago' : 'Sin saldos pendientes'} />
        <KPI label="Utilidad Acumulada" value={fmt(utilidad)}         sub={`${sold.length} relojes vendidos`} accent={BLU} />
      </div>

      {/* Row 1: Graficas + Pipeline */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 14 }}>

        {/* Utilidad mensual bar chart */}
        <div style={card}>
          <div style={cardHdr}>UTILIDAD · ÚLTIMOS 6 MESES</div>
          <div style={{ padding: '14px 16px 8px' }}>
            <MiniBarChart data={monthlyData} height={90} color={G} />
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: TD, marginTop: 4, textAlign: 'right' }}>
              Total: {fmt(monthlyData.reduce((a, d) => a + d.value, 0))}
            </div>
          </div>
        </div>

        {/* Pipeline donut + stats */}
        <div style={card}>
          <div style={cardHdr}>PIPELINE</div>
          <div style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 16 }}>
            <DonutChart size={110} slices={[
              { value: opp.length,  color: PRP },
              { value: inv.length,  color: GRN },
              { value: sold.length, color: TM  },
            ]} />
            <div style={{ flex: 1 }}>
              {[[opp.length, 'Oportunidades', PRP], [inv.length, 'Inventario', GRN], [sold.length, 'Vendidos', TM]].map(([n, l, c]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: TD, letterSpacing: '.1em' }}>{l}</span>
                  </div>
                  <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: c }}>{n}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Capital por socio */}
        <div style={card}>
          <div style={cardHdr}>CAPITAL POR SOCIO</div>
          <div style={{ padding: 14 }}>
            {investors.length === 0
              ? <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: TD, textAlign: 'center', paddingTop: 20 }}>Sin socios registrados</div>
              : investors.map((inv, i) => (
                <div key={inv.id} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontFamily: "'Jost', sans-serif", fontSize: 12, color: TX }}>{inv.name.split(',')[0]}</span>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: G }}>{inv.participacion}%</span>
                  </div>
                  <div style={{ background: S3, borderRadius: 2, height: 4, overflow: 'hidden' }}>
                    <div style={{ background: [G, BLU, GRN, PRP][i % 4], height: '100%', width: `${inv.participacion}%`, transition: 'width .5s ease' }} />
                  </div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: TD, marginTop: 3 }}>{fmt(inv.capitalAportado)}</div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Row 2: Alertas + Distribución marcas + Clientes recientes */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14 }}>
        <div>
          {alertas.length > 0 && (
            <div style={{ ...card, marginBottom: 14 }}>
              <div style={cardHdr}>ALERTAS · {alertas.length}</div>
              {alertas.map((a, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '10px 18px', borderBottom: i < alertas.length - 1 ? `1px solid ${BR}` : 'none' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: a.type === 'danger' ? RED : a.type === 'warning' ? G : BLU, flexShrink: 0 }} />
                  <span style={{ fontFamily: "'Jost', sans-serif", fontSize: 13, color: TX }}>{a.msg}</span>
                </div>
              ))}
            </div>
          )}
          {/* Brand bar chart */}
          <div style={card}>
            <div style={cardHdr}>INVENTARIO POR MARCA</div>
            <div style={{ padding: '10px 18px' }}>
              {brandDist.length === 0
                ? <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: TD, padding: '10px 0' }}>Sin piezas en inventario</div>
                : brandDist.map(b => (
                  <div key={b.name} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontFamily: "'Jost', sans-serif", fontSize: 12, color: TX }}>{b.name}</span>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: b.color }}>{b.value} pza{b.value !== 1 ? 's' : ''}</span>
                    </div>
                    <div style={{ background: S3, borderRadius: 2, height: 3 }}>
                      <div style={{ background: b.color, height: '100%', width: `${(b.value / Math.max(...brandDist.map(x => x.value))) * 100}%`, borderRadius: 2, opacity: .85 }} />
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        </div>

        {/* Clientes recientes */}
        <div style={card}>
          <div style={cardHdr}>CLIENTES RECIENTES</div>
          {(clients || []).length === 0
            ? <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: TD, padding: 18 }}>Sin clientes registrados</div>
            : (clients || []).slice(-8).reverse().map(c => (
              <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 16px', borderBottom: `1px solid ${BR}` }}>
                <div>
                  <div style={{ fontFamily: "'Jost', sans-serif", fontSize: 12, color: TX }}>{c.name}</div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: TD, marginTop: 1 }}>{c.city || '—'}</div>
                </div>
                <Badge label={c.tier} color={({ VIP: G, Regular: BLU, Prospecto: TM })[c.tier] || TM} small />
              </div>
            ))
          }
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
  const [watchSaving, setWatchSaving] = useState(false)

  // Quick create inline
  const [qc, setQc] = useState(null) // 'brand' | 'model' | 'ref' | 'supplier' | 'client'
  const [qf, setQf] = useState({})   // quick-create form fields
  const [qcError, setQcError]   = useState('')  // inline error message
  const [qcSaving, setQcSaving] = useState(false)
  const qInput = { background: S3, border: `1px solid ${BR}`, color: TX, padding: '9px 12px', borderRadius: 4, fontFamily: "'Jost', sans-serif", fontSize: 13, width: '100%', outline: 'none', marginBottom: 10 }

  const quickCreate = async (type) => {
    if (qcSaving) return
    setQcError('')

    // ── Duplicate check ──────────────────────────────────────────────────────
    if (type === 'brand') {
      if (!qf.name) return
      const existing = state.brands.find(b => b.name.trim().toLowerCase() === qf.name.trim().toLowerCase())
      if (existing) {
        // Auto-select the existing brand and close
        setWf(f => ({ ...f, _brandId: existing.id, _modelId: '', refId: '' }))
        toast(`Marca "${existing.name}" ya existe — seleccionada automáticamente`, 'info')
        setQc(null); setQf({}); setQcError(''); return
      }
    }
    if (type === 'model') {
      if (!qf.name || !wf._brandId) return
      const existing = state.models.find(m => m.brandId === wf._brandId && m.name.trim().toLowerCase() === qf.name.trim().toLowerCase())
      if (existing) {
        setWf(f => ({ ...f, _modelId: existing.id, refId: '' }))
        toast(`Modelo "${existing.name}" ya existe — seleccionado automáticamente`, 'info')
        setQc(null); setQf({}); setQcError(''); return
      }
    }
    if (type === 'ref') {
      if (!qf.ref || !wf._modelId) return
      const existing = state.refs.find(r => r.modelId === wf._modelId && r.ref.trim().toLowerCase() === qf.ref.trim().toLowerCase())
      if (existing) {
        setWf(f => ({ ...f, refId: existing.id }))
        toast(`Referencia "${existing.ref}" ya existe — seleccionada automáticamente`, 'info')
        setQc(null); setQf({}); setQcError(''); return
      }
    }
    if (type === 'supplier') {
      if (!qf.name) return
      const existing = state.suppliers.find(s => s.name.trim().toLowerCase() === qf.name.trim().toLowerCase())
      if (existing) {
        setWf(f => ({ ...f, supplierId: existing.id }))
        toast(`Proveedor "${existing.name}" ya existe — seleccionado automáticamente`, 'info')
        setQc(null); setQf({}); setQcError(''); return
      }
    }
    if (type === 'client') {
      if (!qf.name) return
      const existing = state.clients.find(c => c.name.trim().toLowerCase() === qf.name.trim().toLowerCase())
      if (existing) {
        setSf(f => ({ ...f, clientId: existing.id }))
        toast(`Cliente "${existing.name}" ya existe — seleccionado automáticamente`, 'info')
        setQc(null); setQf({}); setQcError(''); return
      }
    }

    // ── Create ───────────────────────────────────────────────────────────────
    setQcSaving(true)
    let created = null
    let createdType = null
    try {
      if (type === 'brand') {
        const brand = { id: 'B' + uid(), name: qf.name.trim(), country: qf.country || 'Suiza', founded: qf.founded || null, notes: '' }
        created = brand; createdType = 'brand'
        setState(s => ({ ...s, brands: [...s.brands, brand] }))
        setWf(f => ({ ...f, _brandId: brand.id, _modelId: '', refId: '' }))
        await db.saveBrand(brand)
        toast(`Marca "${brand.name}" creada`)
      } else if (type === 'model') {
        const model = { id: 'M' + uid(), brandId: wf._brandId, name: qf.name.trim(), family: qf.family || '', notes: '' }
        created = model; createdType = 'model'
        setState(s => ({ ...s, models: [...s.models, model] }))
        setWf(f => ({ ...f, _modelId: model.id, refId: '' }))
        await db.saveModel(model)
        toast(`Modelo "${model.name}" creado`)
      } else if (type === 'ref') {
        const ref = { id: 'R' + uid(), modelId: wf._modelId, ref: qf.ref.trim(), caliber: qf.caliber || '', material: qf.material || 'Acero', bezel: qf.bezel || '', dial: qf.dial || '', size: qf.size || '', bracelet: '', year: +qf.year || null, notes: '' }
        created = ref; createdType = 'ref'
        setState(s => ({ ...s, refs: [...s.refs, ref] }))
        setWf(f => ({ ...f, refId: ref.id }))
        await db.saveRef(ref)
        toast(`Referencia "${ref.ref}" creada`)
      } else if (type === 'supplier') {
        const supplier = { id: 'P' + uid(), name: qf.name.trim(), type: qf.type || 'Particular', phone: qf.phone || '', email: '', city: '', notes: '', rating: 3, totalDeals: 0 }
        created = supplier; createdType = 'supplier'
        setState(s => ({ ...s, suppliers: [...s.suppliers, supplier] }))
        setWf(f => ({ ...f, supplierId: supplier.id }))
        await db.saveSupplier(supplier)
        toast(`Proveedor "${supplier.name}" creado`)
      } else if (type === 'client') {
        const client = { id: 'C' + uid(), name: qf.name.trim(), phone: qf.phone || '', email: '', city: '', tier: 'Prospecto', notes: '', totalSpent: 0, totalPurchases: 0 }
        created = client; createdType = 'client'
        setState(s => ({ ...s, clients: [...s.clients, client] }))
        setSf(f => ({ ...f, clientId: client.id }))
        await db.saveClient(client)
        toast(`Cliente "${client.name}" creado`)
      }
      setQc(null); setQf({}); setQcError('')
    } catch (e) {
      // Rollback optimistic update
      if (created && createdType) {
        setState(s => ({
          ...s,
          brands:    createdType === 'brand'    ? s.brands.filter(x => x.id !== created.id)    : s.brands,
          models:    createdType === 'model'    ? s.models.filter(x => x.id !== created.id)    : s.models,
          refs:      createdType === 'ref'      ? s.refs.filter(x => x.id !== created.id)      : s.refs,
          suppliers: createdType === 'supplier' ? s.suppliers.filter(x => x.id !== created.id) : s.suppliers,
          clients:   createdType === 'client'   ? s.clients.filter(x => x.id !== created.id)   : s.clients,
        }))
      }
      setQcError('Error al guardar: ' + e.message)
    }
    setQcSaving(false)
  }

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

  const saveWatch = async () => {
    if (watchSaving) return
    setWatchSaving(true)
    const id = 'W' + uid()
    const stage = wf.status === 'Oportunidad' ? 'oportunidad' : 'inventario'
    const watch = { ...wf, id, stage, cost: +wf.cost || 0, priceAsked: +wf.priceAsked || 0, validatedBy: '', validationDate: '', costos: [] }
    // Optimistic update
    setState(s => ({ ...s, watches: [...s.watches, watch] }))
    try {
      await db.saveWatch(watch)
      toast('Pieza registrada en inventario')
      setShowAdd(false)
      setWf({ ...blank })
    } catch (e) {
      // Rollback optimistic update
      setState(s => ({ ...s, watches: s.watches.filter(w => w.id !== id) }))
      toast('Error al registrar pieza: ' + e.message, 'error')
    }
    setWatchSaving(false)
  }

  const saveAdditionalCost = async () => {
    if (!costoForm.monto || !selWatch) return
    const newCosto = { ...costoForm, id: 'CT' + uid(), piezaId: selWatch.id, monto: +costoForm.monto, tipo: costoForm.tipo || (state.tiposCosto?.[0]?.nombre || 'Otros') }
    const updatedWatch = { ...selWatch, costos: [...(selWatch.costos || []), newCosto] }
    setState(s => ({ ...s, watches: s.watches.map(w => w.id !== selWatch.id ? w : updatedWatch) }))
    setSelWatch(updatedWatch)
    try {
      await db.saveCosto(newCosto)
      toast('Costo adicional registrado')
      setShowAddCosto(false)
      setCostoForm({ tipo: '', fecha: tod(), monto: '', descripcion: '' })
    } catch (e) {
      // Rollback
      setState(s => ({ ...s, watches: s.watches.map(w => w.id !== selWatch.id ? w : selWatch) }))
      setSelWatch(selWatch)
      toast('Error al guardar costo: ' + e.message, 'error')
    }
  }

  const approve = async w => {
    const extra = { validated_by: 'Director', validation_date: tod(), entry_date: tod() }
    setState(s => ({ ...s, watches: s.watches.map(x => x.id !== w.id ? x : { ...x, stage: 'inventario', status: 'Disponible', validatedBy: 'Director', validationDate: tod(), entryDate: tod() }) }))
    setSelWatch(p => ({ ...p, stage: 'inventario', status: 'Disponible', validatedBy: 'Director' }))
    try {
      await db.updateWatchStage(w.id, 'inventario', 'Disponible', extra)
      toast('Pieza aprobada · ahora en inventario')
    } catch (e) {
      // Rollback
      setState(s => ({ ...s, watches: s.watches.map(x => x.id !== w.id ? x : w) }))
      setSelWatch(w)
      toast('Error al aprobar pieza: ' + e.message, 'error')
    }
  }

  const saveSale = async () => {
    if (watchSaving) return
    setWatchSaving(true)
    const id = 'S' + uid()
    const sale = { ...sf, id, watchId: selWatch.id, agreedPrice: +sf.agreedPrice, payments: [], status: 'Pendiente' }
    const prevWatchState = { status: selWatch.status, stage: selWatch.stage }
    // Optimistic update
    setState(s => ({
      ...s,
      watches: s.watches.map(x => x.id !== selWatch.id ? x : { ...x, status: 'Vendido', stage: 'liquidado' }),
      sales:   [...s.sales, sale]
    }))
    setSelWatch(p => ({ ...p, status: 'Vendido', stage: 'liquidado' }))
    try {
      await db.updateWatchStage(selWatch.id, 'liquidado', 'Vendido')
      await db.saveVenta(sale)
      toast('Venta registrada correctamente')
      setShowSale(false)
      setSf({ clientId: '', saleDate: tod(), agreedPrice: '', notes: '' })
    } catch (e) {
      // Rollback
      setState(s => ({
        ...s,
        watches: s.watches.map(x => x.id !== selWatch.id ? x : { ...x, ...prevWatchState }),
        sales: s.sales.filter(x => x.id !== id)
      }))
      setSelWatch(p => ({ ...p, ...prevWatchState }))
      toast('Error al registrar venta: ' + e.message, 'error')
    }
    setWatchSaving(false)
  }

  const savePay = async saleId => {
    if (watchSaving) return
    setWatchSaving(true)
    const pago = { ...pf, id: 'PAY' + uid(), ventaId: saleId, amount: +pf.amount }
    const prevSales = state.sales.map(s => ({ ...s, payments: [...s.payments] }))
    setState(s => ({
      ...s,
      sales: s.sales.map(sale => {
        if (sale.id !== saleId) return sale
        const pays  = [...sale.payments, pago]
        const total = pays.reduce((a, p) => a + p.amount, 0)
        const status = total >= sale.agreedPrice ? 'Liquidado' : total > 0 ? 'Parcial' : 'Pendiente'
        return { ...sale, payments: pays, status }
      })
    }))
    try {
      const sale = state.sales.find(s => s.id === saleId)
      const newTotal = (sale?.payments || []).reduce((a, p) => a + p.amount, 0) + pago.amount
      const newStatus = newTotal >= (sale?.agreedPrice || 0) ? 'Liquidado' : newTotal > 0 ? 'Parcial' : 'Pendiente'
      await db.savePago(pago)
      await db.updateVentaStatus(saleId, newStatus)
      toast('Pago registrado')
      setShowPay(null)
      setPf({ date: tod(), amount: '', method: 'Transferencia', notes: '' })
    } catch (e) {
      setState(s => ({ ...s, sales: prevSales }))
      toast('Error al registrar pago: ' + e.message, 'error')
    }
    setWatchSaving(false)
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
                        <Btn small variant="secondary" onClick={() => setShowPay(null)} disabled={watchSaving}>Cancelar</Btn>
                        <Btn small onClick={() => savePay(selSale.id)} disabled={!pf.amount || watchSaving}>{watchSaving ? 'Guardando...' : 'Registrar Pago'}</Btn>
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
            <SelectWithCreate label="Cliente *" value={sf.clientId} onChange={v => setSf(f => ({ ...f, clientId: v }))}
              options={<><option value="">— Seleccionar —</option>{clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</>}
              onClickCreate={() => { setQc('client'); setQf({}); setQcError(''); setQcSaving(false) }} createLabel="Nuevo cliente" />
            <Field label="Fecha"><input type="date" value={sf.saleDate} onChange={e => setSf(f => ({ ...f, saleDate: e.target.value }))} style={inputStyle} /></Field>
          </FR>
          <FR cols={1}><Field label="Precio acordado (MXN)" required>
            <input type="number" value={sf.agreedPrice} onChange={e => setSf(f => ({ ...f, agreedPrice: e.target.value }))} placeholder="0" style={inputStyle} />
            {sf.agreedPrice && selWatch.cost && <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: GRN, marginTop: 4 }}>Utilidad bruta: +{fmt(+sf.agreedPrice - selWatch.cost)} ({((+sf.agreedPrice - selWatch.cost) / selWatch.cost * 100).toFixed(1)}%)</div>}
          </Field></FR>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 14 }}>
            <Btn variant="secondary" small onClick={() => setShowSale(false)} disabled={watchSaving}>Cancelar</Btn>
            <Btn small onClick={saveSale} disabled={!sf.clientId || !sf.agreedPrice || watchSaving}>{watchSaving ? 'Guardando...' : 'Registrar Venta'}</Btn>
          </div>
        </Modal>
      )}

      {/* ADD WATCH */}
      {showAdd && (
        <Modal title="Registrar Nueva Pieza" onClose={() => !watchSaving && setShowAdd(false)}>
          <div style={{ background: S3, borderRadius: 4, padding: '10px 14px', marginBottom: 16, fontFamily: "'DM Mono', monospace", fontSize: 10, color: TM }}>
            Selecciona del catálogo: Marca → Modelo → Referencia
          </div>
          <FR>
            <SelectWithCreate label="Marca *" value={wf._brandId || ''} onChange={v => setWf(f => ({ ...f, _brandId: v, _modelId: '', refId: '' }))}
              options={<><option value="">— Seleccionar —</option>{brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</>}
              onClickCreate={() => { setQc('brand'); setQf({}); setQcError(''); setQcSaving(false) }} createLabel="Nueva marca" />
            <SelectWithCreate label="Modelo *" value={wf._modelId || ''} onChange={v => setWf(f => ({ ...f, _modelId: v, refId: '' }))}
              disabled={!wf._brandId}
              options={<><option value="">— Seleccionar —</option>{models.filter(m => m.brandId === wf._brandId).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</>}
              onClickCreate={() => { setQc('model'); setQf({}); setQcError(''); setQcSaving(false) }} createLabel="Nuevo modelo" />
          </FR>
          <div style={{ marginBottom: 14 }}>
            <SelectWithCreate label="Referencia *" value={wf.refId} onChange={v => setWf(f => ({ ...f, refId: v }))}
              disabled={!wf._modelId}
              options={<><option value="">— Seleccionar —</option>{refs.filter(r => r.modelId === wf._modelId).map(r => <option key={r.id} value={r.id}>{r.ref} · {r.material} · {r.dial} · {r.size}</option>)}</>}
              onClickCreate={() => { setQc('ref'); setQf({ material: 'Acero' }); setQcError(''); setQcSaving(false) }} createLabel="Nueva referencia" />
          </div>
          <Divider label="DATOS FÍSICOS" />
          <FR>
            <Field label="Serial"><input value={wf.serial} onChange={e => setWf(f => ({ ...f, serial: e.target.value }))} placeholder="S/N" style={inputStyle} /></Field>
            <SelectWithCreate label="Proveedor *" value={wf.supplierId} onChange={v => setWf(f => ({ ...f, supplierId: v }))}
              options={<><option value="">— Seleccionar —</option>{suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</>}
              onClickCreate={() => { setQc('supplier'); setQf({ type: 'Particular' }); setQcError(''); setQcSaving(false) }} createLabel="Nuevo proveedor" />
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
          <Field label="Notas">
            <textarea rows={2} value={wf.notes} onChange={e => setWf(f => ({ ...f, notes: e.target.value }))} placeholder="Procedencia, observaciones..." style={{ ...inputStyle, resize: 'vertical', marginBottom: 14 }} />
          </Field>
          {watchSaving && (
            <div style={{ background: G + '18', border: `1px solid ${G}44`, borderRadius: 4, padding: '8px 14px', marginBottom: 10,
                          fontFamily: "'DM Mono', monospace", fontSize: 10, color: G, letterSpacing: '.15em', textAlign: 'center',
                          animation: 'pulse 1.2s infinite' }}>
              REGISTRANDO PIEZA...
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Btn variant="secondary" small onClick={() => !watchSaving && setShowAdd(false)} disabled={watchSaving}>Cancelar</Btn>
            <Btn small onClick={saveWatch} disabled={!wf.refId || !wf.supplierId || watchSaving}>
              {watchSaving ? 'Guardando...' : 'Registrar Pieza'}
            </Btn>
          </div>
        </Modal>
      )}

      {/* QUICK CREATE MODALS */}
      {qc === 'brand' && (
        <QuickCreate title="Nueva Marca" onClose={() => { setQc(null); setQf({}); setQcError('') }} error={qcError} saving={qcSaving}>
          <input value={qf.name || ''} onChange={e => setQf(f => ({ ...f, name: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && qf.name && quickCreate('brand')}
            placeholder="Nombre de la marca *" autoFocus
            style={{ background: S3, border: `1px solid ${BR}`, color: TX, padding: '9px 12px', borderRadius: 4, fontFamily: "'Jost', sans-serif", fontSize: 13, width: '100%', outline: 'none', marginBottom: 10, boxSizing: 'border-box' }} />
          <input value={qf.country || ''} onChange={e => setQf(f => ({ ...f, country: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && qf.name && quickCreate('brand')}
            placeholder="País (Suiza, Japón...)"
            style={{ background: S3, border: `1px solid ${BR}`, color: TX, padding: '9px 12px', borderRadius: 4, fontFamily: "'Jost', sans-serif", fontSize: 13, width: '100%', outline: 'none', marginBottom: 14, boxSizing: 'border-box' }} />
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Btn small variant="secondary" onClick={() => { setQc(null); setQf({}); setQcError('') }} disabled={qcSaving}>Cancelar</Btn>
            <Btn small onClick={() => quickCreate('brand')} disabled={!qf.name || qcSaving}>{qcSaving ? 'Guardando...' : 'Crear Marca'}</Btn>
          </div>
        </QuickCreate>
      )}

      {qc === 'model' && (
        <QuickCreate title="Nuevo Modelo" onClose={() => { setQc(null); setQf({}); setQcError('') }} error={qcError} saving={qcSaving}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: TM, marginBottom: 10 }}>
            Marca: {brands.find(b => b.id === wf._brandId)?.name || '—'}
          </div>
          <input value={qf.name || ''} onChange={e => setQf(f => ({ ...f, name: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && qf.name && quickCreate('model')}
            placeholder="Nombre del modelo *" autoFocus
            style={{ background: S3, border: `1px solid ${BR}`, color: TX, padding: '9px 12px', borderRadius: 4, fontFamily: "'Jost', sans-serif", fontSize: 13, width: '100%', outline: 'none', marginBottom: 10, boxSizing: 'border-box' }} />
          <input value={qf.family || ''} onChange={e => setQf(f => ({ ...f, family: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && qf.name && quickCreate('model')}
            placeholder="Familia (Submariner, Datejust...) — opcional"
            style={{ background: S3, border: `1px solid ${BR}`, color: TX, padding: '9px 12px', borderRadius: 4, fontFamily: "'Jost', sans-serif", fontSize: 13, width: '100%', outline: 'none', marginBottom: 14, boxSizing: 'border-box' }} />
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Btn small variant="secondary" onClick={() => { setQc(null); setQf({}); setQcError('') }} disabled={qcSaving}>Cancelar</Btn>
            <Btn small onClick={() => quickCreate('model')} disabled={!qf.name || !wf._brandId || qcSaving}>{qcSaving ? 'Guardando...' : 'Crear Modelo'}</Btn>
          </div>
        </QuickCreate>
      )}

      {qc === 'ref' && (
        <QuickCreate title="Nueva Referencia" onClose={() => { setQc(null); setQf({ material: 'Acero', size: '', dial: '', bezel: '' }); setQcError('') }} error={qcError} saving={qcSaving}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: TM, marginBottom: 12, letterSpacing: '.1em' }}>
            MODELO: {models.find(m => m.id === wf._modelId)?.name || '—'}
          </div>

          {/* Referencia — uppercase alfanumérico */}
          <div style={{ marginBottom: 10 }}>
            <label style={{ display: 'block', fontFamily: "'DM Mono', monospace", fontSize: 9, color: TD, letterSpacing: '.15em', marginBottom: 5 }}>NÚMERO DE REFERENCIA *</label>
            <input value={qf.ref || ''} autoFocus
              onChange={e => setQf(f => ({ ...f, ref: e.target.value.toUpperCase().replace(/[^A-Z0-9\-\/\.]/g, '') }))}
              onKeyDown={e => e.key === 'Enter' && qf.ref && quickCreate('ref')}
              placeholder="Ej. 126710BLNR · 5711/1A-010 · PAM00441"
              maxLength={20}
              style={{ background: S3, border: `1px solid ${qf.ref ? G + '66' : BR}`, color: TX, padding: '9px 12px', borderRadius: 4, fontFamily: "'DM Mono', monospace", fontSize: 13, letterSpacing: '.05em', width: '100%', outline: 'none', boxSizing: 'border-box', transition: 'border-color .2s' }} />
          </div>

          {/* Calibre — uppercase alfanumérico */}
          <div style={{ marginBottom: 10 }}>
            <label style={{ display: 'block', fontFamily: "'DM Mono', monospace", fontSize: 9, color: TD, letterSpacing: '.15em', marginBottom: 5 }}>CALIBRE <span style={{ color: TD, opacity: .5 }}>(opcional)</span></label>
            <input value={qf.caliber || ''}
              onChange={e => setQf(f => ({ ...f, caliber: e.target.value.toUpperCase().replace(/[^A-Z0-9\-\.\/]/g, '') }))}
              placeholder="Ej. 3235 · ETA 2824 · Cal.5 · A08"
              maxLength={15}
              style={{ background: S3, border: `1px solid ${BR}`, color: TX, padding: '9px 12px', borderRadius: 4, fontFamily: "'DM Mono', monospace", fontSize: 13, letterSpacing: '.05em', width: '100%', outline: 'none', boxSizing: 'border-box' }} />
          </div>

          {/* Row: Tamaño + Material */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
            <div>
              <label style={{ display: 'block', fontFamily: "'DM Mono', monospace", fontSize: 9, color: TD, letterSpacing: '.15em', marginBottom: 5 }}>DIÁMETRO</label>
              <select value={qf.size || ''} onChange={e => setQf(f => ({ ...f, size: e.target.value }))}
                style={{ background: S3, border: `1px solid ${BR}`, color: qf.size ? TX : TD, padding: '9px 12px', borderRadius: 4, fontFamily: "'Jost', sans-serif", fontSize: 13, width: '100%', outline: 'none' }}>
                <option value="">— Sin especificar —</option>
                {['34mm','36mm','37mm','38mm','39mm','40mm','41mm','42mm','43mm','44mm','45mm','46mm','47mm','50mm'].map(s => <option key={s} value={s}>{s}</option>)}
                <option value="otro">Otro</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontFamily: "'DM Mono', monospace", fontSize: 9, color: TD, letterSpacing: '.15em', marginBottom: 5 }}>MATERIAL CAJA</label>
              <select value={qf.material || 'Acero'} onChange={e => setQf(f => ({ ...f, material: e.target.value }))}
                style={{ background: S3, border: `1px solid ${BR}`, color: TX, padding: '9px 12px', borderRadius: 4, fontFamily: "'Jost', sans-serif", fontSize: 13, width: '100%', outline: 'none' }}>
                {['Acero','Oro Amarillo 18k','Oro Blanco 18k','Oro Rosa 18k','Bimetálico','Platino','Titanio','Cerámica','Carbono'].map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
          </div>

          {/* Row: Esfera + Bisel */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
            <div>
              <label style={{ display: 'block', fontFamily: "'DM Mono', monospace", fontSize: 9, color: TD, letterSpacing: '.15em', marginBottom: 5 }}>ESFERA <span style={{ opacity: .5 }}>(opcional)</span></label>
              <select value={qf.dial || ''} onChange={e => setQf(f => ({ ...f, dial: e.target.value }))}
                style={{ background: S3, border: `1px solid ${BR}`, color: qf.dial ? TX : TD, padding: '9px 12px', borderRadius: 4, fontFamily: "'Jost', sans-serif", fontSize: 13, width: '100%', outline: 'none' }}>
                <option value="">— Sin especificar —</option>
                {['Negra','Blanca','Azul','Gris','Verde','Champagne','Plateada','Marrón',
                  'Meteorito','Nácar','Skeletonizada','Smoked','Sunburst azul','Sunburst verde'].map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontFamily: "'DM Mono', monospace", fontSize: 9, color: TD, letterSpacing: '.15em', marginBottom: 5 }}>BISEL <span style={{ opacity: .5 }}>(opcional)</span></label>
              <select value={qf.bezel || ''} onChange={e => setQf(f => ({ ...f, bezel: e.target.value }))}
                style={{ background: S3, border: `1px solid ${BR}`, color: qf.bezel ? TX : TD, padding: '9px 12px', borderRadius: 4, fontFamily: "'Jost', sans-serif", fontSize: 13, width: '100%', outline: 'none' }}>
                <option value="">— Sin especificar —</option>
                {['Liso','Estriado','Cerachrom negro','Cerachrom azul','Cerachrom verde',
                  'Cerachrom bicolor','Taquímetro','GMT bicolor','Buceador','Pulsométro',
                  'Diamantes','Engastado'].map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          </div>

          {/* Año */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontFamily: "'DM Mono', monospace", fontSize: 9, color: TD, letterSpacing: '.15em', marginBottom: 5 }}>AÑO INTRODUCCIÓN <span style={{ opacity: .5 }}>(opcional)</span></label>
            <input value={qf.year || ''} type="number"
              min={1920} max={new Date().getFullYear()}
              onChange={e => {
                const v = e.target.value
                if (v === '' || (parseInt(v) >= 1920 && parseInt(v) <= new Date().getFullYear()))
                  setQf(f => ({ ...f, year: v }))
              }}
              placeholder={`1920 – ${new Date().getFullYear()}`}
              style={{ background: S3, border: `1px solid ${BR}`, color: TX, padding: '9px 12px', borderRadius: 4, fontFamily: "'DM Mono', monospace", fontSize: 13, width: '100%', outline: 'none', boxSizing: 'border-box' }} />
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Btn small variant="secondary" onClick={() => { setQc(null); setQf({ material: 'Acero' }); setQcError('') }} disabled={qcSaving}>Cancelar</Btn>
            <Btn small onClick={() => quickCreate('ref')} disabled={!qf.ref || !wf._modelId || qcSaving}>{qcSaving ? 'Guardando...' : 'Crear Referencia'}</Btn>
          </div>
        </QuickCreate>
      )}

      {qc === 'supplier' && (
        <QuickCreate title="Nuevo Proveedor" onClose={() => { setQc(null); setQf({}); setQcError('') }} error={qcError} saving={qcSaving}>
          <input value={qf.name || ''} onChange={e => setQf(f => ({ ...f, name: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && qf.name && quickCreate('supplier')}
            placeholder="Nombre *" autoFocus
            style={{ background: S3, border: `1px solid ${BR}`, color: TX, padding: '9px 12px', borderRadius: 4, fontFamily: "'Jost', sans-serif", fontSize: 13, width: '100%', outline: 'none', marginBottom: 8, boxSizing: 'border-box' }} />
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <select value={qf.type || 'Particular'} onChange={e => setQf(f => ({ ...f, type: e.target.value }))}
              style={{ background: S3, border: `1px solid ${BR}`, color: TX, padding: '9px 12px', borderRadius: 4, fontFamily: "'Jost', sans-serif", fontSize: 13, flex: 1, outline: 'none' }}>
              {['Particular', 'Coleccionista', 'Dealer', 'Casa de Empeño', 'Subasta', 'Otro'].map(t => <option key={t}>{t}</option>)}
            </select>
            <input value={qf.phone || ''} onChange={e => setQf(f => ({ ...f, phone: e.target.value }))} placeholder="Teléfono"
              style={{ background: S3, border: `1px solid ${BR}`, color: TX, padding: '9px 12px', borderRadius: 4, fontFamily: "'Jost', sans-serif", fontSize: 13, width: 140, outline: 'none' }} />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Btn small variant="secondary" onClick={() => { setQc(null); setQf({}); setQcError('') }} disabled={qcSaving}>Cancelar</Btn>
            <Btn small onClick={() => quickCreate('supplier')} disabled={!qf.name || qcSaving}>{qcSaving ? 'Guardando...' : 'Crear Proveedor'}</Btn>
          </div>
        </QuickCreate>
      )}

      {qc === 'client' && (
        <QuickCreate title="Nuevo Cliente" onClose={() => { setQc(null); setQf({}); setQcError('') }} error={qcError} saving={qcSaving}>
          <input value={qf.name || ''} onChange={e => setQf(f => ({ ...f, name: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && qf.name && quickCreate('client')}
            placeholder="Nombre completo *" autoFocus
            style={{ background: S3, border: `1px solid ${BR}`, color: TX, padding: '9px 12px', borderRadius: 4, fontFamily: "'Jost', sans-serif", fontSize: 13, width: '100%', outline: 'none', marginBottom: 8, boxSizing: 'border-box' }} />
          <input value={qf.phone || ''} onChange={e => setQf(f => ({ ...f, phone: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && qf.name && quickCreate('client')}
            placeholder="Teléfono"
            style={{ background: S3, border: `1px solid ${BR}`, color: TX, padding: '9px 12px', borderRadius: 4, fontFamily: "'Jost', sans-serif", fontSize: 13, width: '100%', outline: 'none', marginBottom: 14, boxSizing: 'border-box' }} />
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Btn small variant="secondary" onClick={() => { setQc(null); setQf({}); setQcError('') }} disabled={qcSaving}>Cancelar</Btn>
            <Btn small onClick={() => quickCreate('client')} disabled={!qf.name || qcSaving}>{qcSaving ? 'Guardando...' : 'Crear Cliente'}</Btn>
          </div>
        </QuickCreate>
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

  const savePay = async saleId => {
    const pago = { ...pf, id: 'PAY' + uid(), ventaId: saleId, amount: +pf.amount }
    const prevSales = state.sales
    setState(s => ({
      ...s,
      sales: s.sales.map(sale => {
        if (sale.id !== saleId) return sale
        const pays  = [...sale.payments, pago]
        const total = pays.reduce((a, p) => a + p.amount, 0)
        const status = total >= sale.agreedPrice ? 'Liquidado' : total > 0 ? 'Parcial' : 'Pendiente'
        return { ...sale, payments: pays, status }
      })
    }))
    try {
      const sale = prevSales.find(s => s.id === saleId)
      const newTotal = (sale?.payments || []).reduce((a, p) => a + p.amount, 0) + pago.amount
      const newStatus = newTotal >= (sale?.agreedPrice || 0) ? 'Liquidado' : newTotal > 0 ? 'Parcial' : 'Pendiente'
      await db.savePago(pago)
      await db.updateVentaStatus(saleId, newStatus)
      toast('Pago registrado')
      setShowPay(null)
      setPf({ date: tod(), amount: '', method: 'Transferencia', notes: '' })
    } catch (e) {
      setState(s => ({ ...s, sales: prevSales }))
      toast('Error al registrar pago: ' + e.message, 'error')
    }
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
  const [tab, setTab]           = useState('marcas')
  const [selBrand, setSelBrand] = useState(null)
  const [selModel, setSelModel] = useState(null)

  // Form visibility
  const [showBrandForm, setShowBrandForm]   = useState(false)
  const [showModelForm, setShowModelForm]   = useState(false)
  const [showRefForm, setShowRefForm]       = useState(false)

  // Edit targets
  const [editBrand, setEditBrand] = useState(null)
  const [editModel, setEditModel] = useState(null)
  const [editRef, setEditRef]     = useState(null)

  // Form values — shared between add and edit
  const [bf, setBf] = useState({ name: '', country: 'Suiza', founded: '', notes: '' })
  const [mf, setMf] = useState({ brandId: '', name: '', family: '', notes: '' })
  const [rf, setRf] = useState({ modelId: '', ref: '', caliber: '', material: 'Acero', bezel: '', dial: '', size: '', bracelet: '', year: '', notes: '' })

  const [saving, setSaving] = useState(false)

  const inputStyle = { background: S3, border: `1px solid ${BR}`, color: TX, padding: '10px 14px', borderRadius: 4, fontFamily: "'Jost', sans-serif", fontSize: 13, width: '100%', outline: 'none' }

  // ── Open form helpers ──────────────────────────────────────────────────────
  const openAddBrand  = ()    => { setEditBrand(null);  setBf({ name: '', country: 'Suiza', founded: '', notes: '' }); setShowBrandForm(true) }
  const openEditBrand = (b)   => { setEditBrand(b);     setBf({ name: b.name, country: b.country || 'Suiza', founded: b.founded || '', notes: b.notes || '' }); setShowBrandForm(true) }
  const openAddModel  = ()    => { setEditModel(null);  setMf({ brandId: selBrand?.id || '', name: '', family: '', notes: '' }); setShowModelForm(true) }
  const openEditModel = (m)   => { setEditModel(m);     setMf({ brandId: m.brandId, name: m.name, family: m.family || '', notes: m.notes || '' }); setShowModelForm(true) }
  const openAddRef    = ()    => { setEditRef(null);    setRf({ modelId: selModel?.id || '', ref: '', caliber: '', material: 'Acero', bezel: '', dial: '', size: '', bracelet: '', year: '', notes: '' }); setShowRefForm(true) }
  const openEditRef   = (r)   => { setEditRef(r);      setRf({ modelId: r.modelId, ref: r.ref, caliber: r.caliber || '', material: r.material || 'Acero', bezel: r.bezel || '', dial: r.dial || '', size: r.size || '', bracelet: r.bracelet || '', year: r.year || '', notes: r.notes || '' }); setShowRefForm(true) }

  // ── Save ──────────────────────────────────────────────────────────────────
  const saveBrand = async () => {
    if (saving) return
    setSaving(true)
    try {
      if (editBrand) {
        const updated = { ...editBrand, ...bf }
        setState(s => ({ ...s, brands: s.brands.map(b => b.id !== editBrand.id ? b : updated) }))
        await db.saveBrand(updated)
      } else {
        const brand = { ...bf, id: 'B' + uid() }
        setState(s => ({ ...s, brands: [...s.brands, brand] }))
        await db.saveBrand(brand)
      }
      toast(editBrand ? 'Marca actualizada' : 'Marca guardada correctamente')
      setShowBrandForm(false)
    } catch (e) { toast('Error: ' + e.message, 'error') }
    setSaving(false)
  }

  const saveModel = async () => {
    if (saving) return
    setSaving(true)
    try {
      if (editModel) {
        const updated = { ...editModel, ...mf }
        setState(s => ({ ...s, models: s.models.map(m => m.id !== editModel.id ? m : updated) }))
        await db.saveModel(updated)
      } else {
        const model = { ...mf, id: 'M' + uid() }
        setState(s => ({ ...s, models: [...s.models, model] }))
        await db.saveModel(model)
      }
      toast(editModel ? 'Modelo actualizado' : 'Modelo guardado correctamente')
      setShowModelForm(false)
    } catch (e) { toast('Error: ' + e.message, 'error') }
    setSaving(false)
  }

  const saveRef = async () => {
    if (saving) return
    setSaving(true)
    try {
      if (editRef) {
        const updated = { ...editRef, ...rf, year: +rf.year }
        setState(s => ({ ...s, refs: s.refs.map(r => r.id !== editRef.id ? r : updated) }))
        await db.saveRef(updated)
      } else {
        const ref = { ...rf, id: 'R' + uid(), year: +rf.year }
        setState(s => ({ ...s, refs: [...s.refs, ref] }))
        await db.saveRef(ref)
      }
      toast(editRef ? 'Referencia actualizada' : 'Referencia guardada correctamente')
      setShowRefForm(false)
    } catch (e) { toast('Error: ' + e.message, 'error') }
    setSaving(false)
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  const delBrand = async (b) => {
    if (!window.confirm(`¿Eliminar "${b.name}"? Se eliminarán también sus modelos y referencias.`)) return
    const prev = { brands: state.brands, models: state.models, refs: state.refs }
    setState(s => {
      const modelIds = s.models.filter(m => m.brandId === b.id).map(m => m.id)
      return { ...s, brands: s.brands.filter(x => x.id !== b.id), models: s.models.filter(m => m.brandId !== b.id), refs: s.refs.filter(r => !modelIds.includes(r.modelId)) }
    })
    try {
      const { error } = await sb.from('marcas').delete().eq('id', b.id)
      if (error) throw new Error(error.message)
      toast('Marca eliminada', 'info')
      if (selBrand?.id === b.id) setSelBrand(null)
    } catch (e) {
      setState(s => ({ ...s, ...prev }))
      toast('Error al eliminar: ' + e.message, 'error')
    }
  }

  const delModel = async (m) => {
    if (!window.confirm(`¿Eliminar "${m.name}"? Se eliminarán también sus referencias.`)) return
    const prev = { models: state.models, refs: state.refs }
    setState(s => ({ ...s, models: s.models.filter(x => x.id !== m.id), refs: s.refs.filter(r => r.modelId !== m.id) }))
    try {
      const { error } = await sb.from('modelos').delete().eq('id', m.id)
      if (error) throw new Error(error.message)
      toast('Modelo eliminado', 'info')
      if (selModel?.id === m.id) setSelModel(null)
    } catch (e) {
      setState(s => ({ ...s, ...prev }))
      toast('Error al eliminar: ' + e.message, 'error')
    }
  }

  const delRef = async (r) => {
    if (!window.confirm(`¿Eliminar referencia "${r.ref}"?`)) return
    const prev = state.refs
    setState(s => ({ ...s, refs: s.refs.filter(x => x.id !== r.id) }))
    try {
      const { error } = await sb.from('referencias').delete().eq('id', r.id)
      if (error) throw new Error(error.message)
      toast('Referencia eliminada', 'info')
    } catch (e) {
      setState(s => ({ ...s, refs: prev }))
      toast('Error al eliminar: ' + e.message, 'error')
    }
  }

  const filteredModels = selBrand ? models.filter(m => m.brandId === selBrand.id) : models
  const filteredRefs   = selModel ? refs.filter(r => r.modelId === selModel.id) : refs

  // ── Small action button style ─────────────────────────────────────────────
  const actionBtn = (color = TM) => ({
    background: 'none', border: 'none', color, cursor: 'pointer',
    fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: '.06em', padding: '2px 6px'
  })

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
        {[['marcas', 'Marcas', brands.length], ['modelos', 'Modelos', models.length], ['referencias', 'Referencias', refs.length], ['costos', 'Tipos de Costo', (tiposCosto||[]).length]].map(([id, label, n]) => (
          <button key={id} onClick={() => setTab(id)}
            style={{ padding: '10px 20px', background: 'none', border: 'none', borderBottom: tab === id ? `2px solid ${G}` : '2px solid transparent', color: tab === id ? G : TM, fontFamily: "'Jost', sans-serif", fontSize: 12, cursor: 'pointer', letterSpacing: '.06em' }}>
            {label} <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: tab === id ? G : TD, marginLeft: 4 }}>{n}</span>
          </button>
        ))}
      </div>

      {/* ── MARCAS ─────────────────────────────────────────────────────────── */}
      {tab === 'marcas' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
            <Btn onClick={openAddBrand}>+ Nueva Marca</Btn>
          </div>
          {brands.length === 0 && (
            <div style={{ border: `1px dashed ${BR}`, borderRadius: 6, padding: 32, textAlign: 'center', fontFamily: "'DM Mono', monospace", fontSize: 11, color: TD }}>
              Sin marcas · click "+ Nueva Marca" para empezar
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
            {brands.map(b => {
              const mc = models.filter(m => m.brandId === b.id).length
              const rc = refs.filter(r => models.filter(m => m.brandId === b.id).map(m => m.id).includes(r.modelId)).length
              return (
                <div key={b.id} style={{ background: S1, border: `1px solid ${selBrand?.id === b.id ? G : BR}`, borderRadius: 6, padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div onClick={() => { setSelBrand(b); setTab('modelos') }} style={{ cursor: 'pointer', flex: 1 }}>
                      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: TX }}>{b.name}</div>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: TM }}>{b.country} · Est. {b.founded || '—'}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 2 }}>
                      <button onClick={() => openEditBrand(b)} style={actionBtn(TM)}>EDITAR</button>
                      <button onClick={() => delBrand(b)} style={actionBtn(RED)}>✕</button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    <Badge label={`${mc} modelos`} color={BLU} small />
                    <Badge label={`${rc} refs`} color={G} small />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── MODELOS ────────────────────────────────────────────────────────── */}
      {tab === 'modelos' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: TM }}>{selBrand ? `Modelos de ${selBrand.name}` : 'Todos los modelos'}</div>
            <Btn onClick={openAddModel}>+ Nuevo Modelo</Btn>
          </div>
          {filteredModels.length === 0 && (
            <div style={{ border: `1px dashed ${BR}`, borderRadius: 6, padding: 32, textAlign: 'center', fontFamily: "'DM Mono', monospace", fontSize: 11, color: TD }}>
              Sin modelos{selBrand ? ` para ${selBrand.name}` : ''}
            </div>
          )}
          <div style={{ background: S1, border: `1px solid ${BR}`, borderRadius: 6, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ borderBottom: `1px solid ${BR}` }}>{['Marca', 'Modelo', 'Familia', 'Referencias', ''].map(h => <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontFamily: "'DM Mono', monospace", fontSize: 10, color: TM, letterSpacing: '.1em', fontWeight: 400 }}>{h}</th>)}</tr></thead>
              <tbody>
                {filteredModels.map(m => {
                  const b = brands.find(b => b.id === m.brandId), rc = refs.filter(r => r.modelId === m.id).length
                  return (
                    <tr key={m.id} style={{ borderBottom: `1px solid ${BR}` }}
                      onMouseEnter={e => e.currentTarget.style.background = S2}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '11px 16px', fontFamily: "'DM Mono', monospace", fontSize: 11, color: TM }}>{b?.name}</td>
                      <td style={{ padding: '11px 16px', fontFamily: "'Jost', sans-serif", fontSize: 13, color: TX }}>{m.name}</td>
                      <td style={{ padding: '11px 16px' }}><Badge label={m.family || '—'} color={BLU} small /></td>
                      <td style={{ padding: '11px 16px', fontFamily: "'DM Mono', monospace", fontSize: 11, color: G }}>{rc}</td>
                      <td style={{ padding: '11px 16px', textAlign: 'right', display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                        <button onClick={() => { setSelModel(m); setTab('referencias') }} style={{ background: 'none', border: `1px solid ${BR}`, color: TM, padding: '4px 10px', borderRadius: 3, fontFamily: "'DM Mono', monospace", fontSize: 9, cursor: 'pointer', letterSpacing: '.08em' }}>REFS →</button>
                        <button onClick={() => openEditModel(m)} style={actionBtn(TM)}>EDITAR</button>
                        <button onClick={() => delModel(m)} style={actionBtn(RED)}>✕</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── REFERENCIAS ────────────────────────────────────────────────────── */}
      {tab === 'referencias' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: TM }}>{selModel ? `Referencias de ${selModel.name}` : 'Todas las referencias'}</div>
            <Btn onClick={openAddRef}>+ Nueva Referencia</Btn>
          </div>
          {filteredRefs.length === 0 && (
            <div style={{ border: `1px dashed ${BR}`, borderRadius: 6, padding: 32, textAlign: 'center', fontFamily: "'DM Mono', monospace", fontSize: 11, color: TD }}>
              Sin referencias{selModel ? ` para ${selModel.name}` : ''}
            </div>
          )}
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
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => openEditRef(r)} style={actionBtn(TM)}>EDITAR</button>
                      <button onClick={() => delRef(r)} style={actionBtn(RED)}>✕</button>
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

      {/* ── TIPOS DE COSTO ─────────────────────────────────────────────────── */}
      {tab === 'costos' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
            <Btn onClick={async () => {
              const nombre = window.prompt('Nombre del tipo de costo:')
              if (nombre) {
                const tipo = { id: 'TC' + uid(), nombre, icono: '📋' }
                setState(s => ({ ...s, tiposCosto: [...(s.tiposCosto || []), tipo] }))
                await db.saveTipoCosto(tipo)
              }
            }}>+ Nuevo Tipo</Btn>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
            {(tiposCosto || []).map(t => (
              <div key={t.id} style={{ background: S1, border: `1px solid ${BR}`, borderRadius: 6, padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 20 }}>{t.icono}</span>
                  <div style={{ fontFamily: "'Jost', sans-serif", fontSize: 13, color: TX }}>{t.nombre}</div>
                </div>
                <button onClick={async () => {
                  if (!window.confirm(`¿Eliminar "${t.nombre}"?`)) return
                  setState(s => ({ ...s, tiposCosto: s.tiposCosto.filter(x => x.id !== t.id) }))
                  await sb.from('tipos_costo').delete().eq('id', t.id)
                  toast('Tipo de costo eliminado', 'info')
                }} style={actionBtn(RED)}>✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── MODAL MARCA ────────────────────────────────────────────────────── */}
      {showBrandForm && (
        <Modal title={editBrand ? `Editar · ${editBrand.name}` : 'Nueva Marca'} onClose={() => setShowBrandForm(false)}>
          <FR>
            <Field label="Nombre" required><input value={bf.name} onChange={e => setBf(f => ({ ...f, name: e.target.value }))} placeholder="Rolex, Patek Philippe..." style={inputStyle} /></Field>
            <Field label="País"><input value={bf.country} onChange={e => setBf(f => ({ ...f, country: e.target.value }))} placeholder="Suiza" style={inputStyle} /></Field>
          </FR>
          <FR>
            <Field label="Año fundación"><input type="number" value={bf.founded} onChange={e => setBf(f => ({ ...f, founded: e.target.value }))} placeholder="1905" style={inputStyle} /></Field>
            <Field label="Notas"><input value={bf.notes} onChange={e => setBf(f => ({ ...f, notes: e.target.value }))} placeholder="Observaciones..." style={inputStyle} /></Field>
          </FR>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Btn variant="secondary" small onClick={() => setShowBrandForm(false)}>Cancelar</Btn>
            <Btn small onClick={saveBrand} disabled={!bf.name || saving}>{saving ? 'Guardando...' : editBrand ? 'Guardar Cambios' : 'Crear Marca'}</Btn>
          </div>
        </Modal>
      )}

      {/* ── MODAL MODELO ───────────────────────────────────────────────────── */}
      {showModelForm && (
        <Modal title={editModel ? `Editar · ${editModel.name}` : 'Nuevo Modelo'} onClose={() => setShowModelForm(false)}>
          <FR>
            <Field label="Marca" required>
              <select value={mf.brandId} onChange={e => setMf(f => ({ ...f, brandId: e.target.value }))} style={inputStyle}>
                <option value="">— Seleccionar —</option>{brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </Field>
            <Field label="Nombre" required><input value={mf.name} onChange={e => setMf(f => ({ ...f, name: e.target.value }))} placeholder="Submariner, Daytona..." style={inputStyle} /></Field>
          </FR>
          <FR>
            <Field label="Familia"><input value={mf.family} onChange={e => setMf(f => ({ ...f, family: e.target.value }))} placeholder="Deportivo, Clásico..." style={inputStyle} /></Field>
            <Field label="Notas"><input value={mf.notes} onChange={e => setMf(f => ({ ...f, notes: e.target.value }))} placeholder="Observaciones..." style={inputStyle} /></Field>
          </FR>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Btn variant="secondary" small onClick={() => setShowModelForm(false)}>Cancelar</Btn>
            <Btn small onClick={saveModel} disabled={!mf.name || !mf.brandId || saving}>{saving ? 'Guardando...' : editModel ? 'Guardar Cambios' : 'Crear Modelo'}</Btn>
          </div>
        </Modal>
      )}

      {/* ── MODAL REFERENCIA ───────────────────────────────────────────────── */}
      {showRefForm && (
        <Modal title={editRef ? `Editar · ${editRef.ref}` : 'Nueva Referencia'} onClose={() => setShowRefForm(false)} width={560}>
          <FR>
            <Field label="Modelo *">
              <select value={rf.modelId} onChange={e => setRf(f => ({ ...f, modelId: e.target.value }))} style={inputStyle}>
                <option value="">— Seleccionar —</option>
                {models.map(m => { const b = brands.find(b => b.id === m.brandId); return <option key={m.id} value={m.id}>{b?.name} {m.name}</option> })}
              </select>
            </Field>
            <Field label="Número de Referencia *">
              <input value={rf.ref}
                onChange={e => setRf(f => ({ ...f, ref: e.target.value.toUpperCase().replace(/[^A-Z0-9\-\/\.]/g, '') }))}
                placeholder="Ej. 126610LN · 5711/1A-010" maxLength={20}
                style={{ ...inputStyle, fontFamily: "'DM Mono', monospace", letterSpacing: '.05em' }} />
            </Field>
          </FR>
          <FR>
            <Field label="Calibre">
              <input value={rf.caliber}
                onChange={e => setRf(f => ({ ...f, caliber: e.target.value.toUpperCase().replace(/[^A-Z0-9\-\.\/\s]/g, '') }))}
                placeholder="Ej. 3235 · ETA 2824 · Cal.5" maxLength={15}
                style={{ ...inputStyle, fontFamily: "'DM Mono', monospace", letterSpacing: '.03em' }} />
            </Field>
            <Field label="Material caja">
              <select value={rf.material} onChange={e => setRf(f => ({ ...f, material: e.target.value }))} style={inputStyle}>
                {['Acero','Oro Amarillo 18k','Oro Blanco 18k','Oro Rosa 18k','Bimetálico','Platino','Titanio','Cerámica','Carbono'].map(x => <option key={x}>{x}</option>)}
              </select>
            </Field>
          </FR>
          <FR>
            <Field label="Diámetro">
              <select value={rf.size} onChange={e => setRf(f => ({ ...f, size: e.target.value }))} style={inputStyle}>
                <option value="">— Sin especificar —</option>
                {['34mm','36mm','37mm','38mm','39mm','40mm','41mm','42mm','43mm','44mm','45mm','46mm','47mm','50mm','Otro'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Brazalete">
              <select value={rf.bracelet} onChange={e => setRf(f => ({ ...f, bracelet: e.target.value }))} style={inputStyle}>
                <option value="">— Sin especificar —</option>
                {['Oyster','Jubilee','President','Bracelet integrado','Correa cuero','Correa caucho','Correa NATO','Correa tela','Otro'].map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </Field>
          </FR>
          <FR>
            <Field label="Esfera">
              <select value={rf.dial} onChange={e => setRf(f => ({ ...f, dial: e.target.value }))} style={inputStyle}>
                <option value="">— Sin especificar —</option>
                {['Negra','Blanca','Azul','Gris','Verde','Champagne','Plateada','Marrón','Meteorito','Nácar','Skeletonizada','Smoked','Sunburst azul','Sunburst verde','Otro'].map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </Field>
            <Field label="Bisel">
              <select value={rf.bezel} onChange={e => setRf(f => ({ ...f, bezel: e.target.value }))} style={inputStyle}>
                <option value="">— Sin especificar —</option>
                {['Liso','Estriado','Cerachrom negro','Cerachrom azul','Cerachrom verde','Cerachrom bicolor','Taquímetro','GMT bicolor','Buceador','Pulsométro','Diamantes','Engastado','Otro'].map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </Field>
          </FR>
          <FR>
            <Field label="Año aprox.">
              <input type="number" value={rf.year} min={1920} max={new Date().getFullYear()}
                onChange={e => { const v = e.target.value; if (v === '' || (parseInt(v) >= 1920 && parseInt(v) <= new Date().getFullYear())) setRf(f => ({ ...f, year: v })) }}
                placeholder={`1920 – ${new Date().getFullYear()}`}
                style={{ ...inputStyle, fontFamily: "'DM Mono', monospace" }} />
            </Field>
            <Field label="Notas">
              <input value={rf.notes} onChange={e => setRf(f => ({ ...f, notes: e.target.value }))} placeholder="Observaciones adicionales..." maxLength={100} style={inputStyle} />
            </Field>
          </FR>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Btn variant="secondary" small onClick={() => setShowRefForm(false)}>Cancelar</Btn>
            <Btn small onClick={saveRef} disabled={!rf.ref || !rf.modelId || saving}>{saving ? 'Guardando...' : editRef ? 'Guardar Cambios' : 'Crear Referencia'}</Btn>
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

  const saveMov = async () => {
    if (!sel) return
    const monto = mv.tipo === 'Distribución' || mv.tipo === 'Retiro' ? -Math.abs(+mv.monto) : +mv.monto
    const nuevoMov = { id: 'M' + uid(), socioId: sel.id, ...mv, monto }
    setState(s => ({
      ...s,
      socios: (s.socios || []).map(i => i.id !== sel.id ? i : { ...i, movimientos: [...(i.movimientos || []), nuevoMov] })
    }))
    try {
      await db.saveMovimientoSocio(nuevoMov)
      toast('Movimiento registrado')
      setShowMov(false)
      setMv({ fecha: tod(), tipo: 'Aportación', monto: '', concepto: '' })
    } catch (e) {
      // Rollback
      setState(s => ({
        ...s,
        socios: (s.socios || []).map(i => i.id !== sel.id ? i : { ...i, movimientos: (i.movimientos || []).filter(m => m.id !== nuevoMov.id) })
      }))
      toast('Error al registrar movimiento: ' + e.message, 'error')
    }
  }

  const saveEditSocios = async () => {
    const prev = state.socios
    setState(s => ({ ...s, socios: editSocios }))
    try {
      await Promise.all(editSocios.map(s => db.saveSocio(s)))
      toast('Configuración de socios guardada')
      setShowEditSocios(false)
    } catch (e) {
      setState(s => ({ ...s, socios: prev }))
      toast('Error al guardar socios: ' + e.message, 'error')
    }
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
  const [tab, setTab]                     = useState('clientes')
  const [showClienteForm, setShowClienteForm]   = useState(false)
  const [showProveedorForm, setShowProveedorForm] = useState(false)
  const [editCliente, setEditCliente]       = useState(null)
  const [editProveedor, setEditProveedor]   = useState(null)
  const [cf, setCf] = useState({ name: '', phone: '', email: '', city: '', tier: 'Prospecto', notes: '' })
  const [pf, setPf] = useState({ name: '', type: 'Particular', phone: '', email: '', city: '', notes: '', rating: 3 })
  const inputStyle = { background: S3, border: `1px solid ${BR}`, color: TX, padding: '10px 14px', borderRadius: 4, fontFamily: "'Jost', sans-serif", fontSize: 13, width: '100%', outline: 'none' }
  const Stars = n => '★'.repeat(n) + '☆'.repeat(5 - n)

  const openAddCliente  = () => { setEditCliente(null); setCf({ name: '', phone: '', email: '', city: '', tier: 'Prospecto', notes: '' }); setShowClienteForm(true) }
  const openEditCliente = (c) => { setEditCliente(c); setCf({ name: c.name, phone: c.phone || '', email: c.email || '', city: c.city || '', tier: c.tier || 'Prospecto', notes: c.notes || '' }); setShowClienteForm(true) }
  const openAddProveedor  = () => { setEditProveedor(null); setPf({ name: '', type: 'Particular', phone: '', email: '', city: '', notes: '', rating: 3 }); setShowProveedorForm(true) }
  const openEditProveedor = (p) => { setEditProveedor(p); setPf({ name: p.name, type: p.type || 'Particular', phone: p.phone || '', email: p.email || '', city: p.city || '', notes: p.notes || '', rating: p.rating || 3 }); setShowProveedorForm(true) }

  const saveCliente = async () => {
    try {
      if (editCliente) {
        const updated = { ...editCliente, ...cf }
        setState(s => ({ ...s, clients: s.clients.map(x => x.id === editCliente.id ? updated : x) }))
        await db.saveClient(updated)
        toast('Cliente actualizado correctamente')
      } else {
        const client = { ...cf, id: 'C' + uid(), totalSpent: 0, totalPurchases: 0 }
        setState(s => ({ ...s, clients: [...(s.clients || []), client] }))
        await db.saveClient(client)
        toast('Cliente guardado correctamente')
      }
      setShowClienteForm(false)
    } catch (e) { toast('Error: ' + e.message, 'error') }
  }

  const delCliente = async (c) => {
    if (!window.confirm(`¿Eliminar cliente "${c.name}"?`)) return
    const prev = state.clients
    setState(s => ({ ...s, clients: s.clients.filter(x => x.id !== c.id) }))
    try {
      const { error } = await sb.from('clientes').delete().eq('id', c.id)
      if (error) throw new Error(error.message)
      toast('Cliente eliminado', 'info')
    } catch (e) {
      setState(s => ({ ...s, clients: prev }))
      toast('Error al eliminar: ' + e.message, 'error')
    }
  }

  const saveProveedor = async () => {
    try {
      if (editProveedor) {
        const updated = { ...editProveedor, ...pf, rating: +pf.rating }
        setState(s => ({ ...s, suppliers: s.suppliers.map(x => x.id === editProveedor.id ? updated : x) }))
        await db.saveSupplier(updated)
        toast('Proveedor actualizado correctamente')
      } else {
        const supplier = { ...pf, id: 'P' + uid(), rating: +pf.rating, totalDeals: 0 }
        setState(s => ({ ...s, suppliers: [...(s.suppliers || []), supplier] }))
        await db.saveSupplier(supplier)
        toast('Proveedor guardado correctamente')
      }
      setShowProveedorForm(false)
    } catch (e) { toast('Error: ' + e.message, 'error') }
  }

  const delProveedor = async (p) => {
    if (!window.confirm(`¿Eliminar proveedor "${p.name}"?`)) return
    const prev = state.suppliers
    setState(s => ({ ...s, suppliers: s.suppliers.filter(x => x.id !== p.id) }))
    try {
      const { error } = await sb.from('proveedores').delete().eq('id', p.id)
      if (error) throw new Error(error.message)
      toast('Proveedor eliminado', 'info')
    } catch (e) {
      setState(s => ({ ...s, suppliers: prev }))
      toast('Error al eliminar: ' + e.message, 'error')
    }
  }

  const actionBtn = (color = TM) => ({
    background: 'none', border: 'none', color, cursor: 'pointer',
    fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: '.06em', padding: '2px 8px'
  })

  const tabBtn = (id) => ({
    padding: '10px 20px', background: 'none', border: 'none',
    borderBottom: tab === id ? `2px solid ${G}` : '2px solid transparent',
    color: tab === id ? G : TM, fontFamily: "'Jost', sans-serif", fontSize: 12, cursor: 'pointer', letterSpacing: '.06em'
  })

  return (
    <div>
      <SH title="Contactos" subtitle={`${(clients||[]).length} clientes · ${(suppliers||[]).length} proveedores`} />
      <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: `1px solid ${BR}` }}>
        {[['clientes', 'Clientes', (clients||[]).length], ['proveedores', 'Proveedores', (suppliers||[]).length]].map(([id, label, n]) => (
          <button key={id} onClick={() => setTab(id)} style={tabBtn(id)}>
            {label} <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: tab === id ? G : TD, marginLeft: 4 }}>{n}</span>
          </button>
        ))}
      </div>

      {/* ── CLIENTES ──────────────────────────────────────────────────────── */}
      {tab === 'clientes' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
            <Btn onClick={openAddCliente}>+ Nuevo Cliente</Btn>
          </div>
          {(clients||[]).length === 0 ? (
            <div style={{ border: `1px dashed ${BR}`, borderRadius: 6, padding: 32, textAlign: 'center', fontFamily: "'DM Mono', monospace", fontSize: 11, color: TD }}>
              Sin clientes registrados · click "+ Nuevo Cliente" para agregar
            </div>
          ) : (
            <div style={{ background: S1, border: `1px solid ${BR}`, borderRadius: 6, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr style={{ borderBottom: `1px solid ${BR}` }}>
                  {['Nombre', 'Tier', 'Ciudad', 'Teléfono', 'Email', 'Compras', 'Facturado', ''].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontFamily: "'DM Mono', monospace", fontSize: 10, color: TM, letterSpacing: '.1em', fontWeight: 400 }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {(clients||[]).map(c => (
                    <tr key={c.id} style={{ borderBottom: `1px solid ${BR}` }}
                      onMouseEnter={e => e.currentTarget.style.background = S2}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '11px 14px', fontFamily: "'Jost', sans-serif", fontSize: 13, color: TX }}>{c.name}</td>
                      <td style={{ padding: '11px 14px' }}><Badge label={c.tier} color={({ VIP: G, Regular: BLU, Prospecto: TM })[c.tier] || TM} small /></td>
                      <td style={{ padding: '11px 14px', fontFamily: "'Jost', sans-serif", fontSize: 12, color: TM }}>{c.city || '—'}</td>
                      <td style={{ padding: '11px 14px', fontFamily: "'DM Mono', monospace", fontSize: 11, color: TM }}>{c.phone || '—'}</td>
                      <td style={{ padding: '11px 14px', fontFamily: "'DM Mono', monospace", fontSize: 11, color: TM }}>{c.email || '—'}</td>
                      <td style={{ padding: '11px 14px', fontFamily: "'DM Mono', monospace", fontSize: 11, color: TX, textAlign: 'center' }}>{c.totalPurchases || 0}</td>
                      <td style={{ padding: '11px 14px', fontFamily: "'DM Mono', monospace", fontSize: 11, color: G }}>{c.totalSpent > 0 ? fmt(c.totalSpent) : '—'}</td>
                      <td style={{ padding: '11px 14px', whiteSpace: 'nowrap' }}>
                        <button onClick={() => openEditCliente(c)} style={actionBtn(TM)}>EDITAR</button>
                        <button onClick={() => delCliente(c)} style={actionBtn(RED)}>✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── PROVEEDORES ───────────────────────────────────────────────────── */}
      {tab === 'proveedores' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
            <Btn onClick={openAddProveedor}>+ Nuevo Proveedor</Btn>
          </div>
          {(suppliers||[]).length === 0 ? (
            <div style={{ border: `1px dashed ${BR}`, borderRadius: 6, padding: 32, textAlign: 'center', fontFamily: "'DM Mono', monospace", fontSize: 11, color: TD }}>
              Sin proveedores registrados · click "+ Nuevo Proveedor" para agregar
            </div>
          ) : (
            <div style={{ background: S1, border: `1px solid ${BR}`, borderRadius: 6, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr style={{ borderBottom: `1px solid ${BR}` }}>
                  {['Nombre', 'Tipo', 'Ciudad', 'Teléfono', 'Email', 'Operaciones', 'Rating', ''].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontFamily: "'DM Mono', monospace", fontSize: 10, color: TM, letterSpacing: '.1em', fontWeight: 400 }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {(suppliers||[]).map(s => (
                    <tr key={s.id} style={{ borderBottom: `1px solid ${BR}` }}
                      onMouseEnter={e => e.currentTarget.style.background = S2}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '11px 14px', fontFamily: "'Jost', sans-serif", fontSize: 13, color: TX }}>{s.name}</td>
                      <td style={{ padding: '11px 14px' }}><Badge label={s.type} color={BLU} small /></td>
                      <td style={{ padding: '11px 14px', fontFamily: "'Jost', sans-serif", fontSize: 12, color: TM }}>{s.city || '—'}</td>
                      <td style={{ padding: '11px 14px', fontFamily: "'DM Mono', monospace", fontSize: 11, color: TM }}>{s.phone || '—'}</td>
                      <td style={{ padding: '11px 14px', fontFamily: "'DM Mono', monospace", fontSize: 11, color: TM }}>{s.email || '—'}</td>
                      <td style={{ padding: '11px 14px', fontFamily: "'DM Mono', monospace", fontSize: 11, color: G, textAlign: 'center' }}>{s.totalDeals || 0}</td>
                      <td style={{ padding: '11px 14px', color: G, fontSize: 12 }}>{Stars(s.rating || 3)}</td>
                      <td style={{ padding: '11px 14px', whiteSpace: 'nowrap' }}>
                        <button onClick={() => openEditProveedor(s)} style={actionBtn(TM)}>EDITAR</button>
                        <button onClick={() => delProveedor(s)} style={actionBtn(RED)}>✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── FORM CLIENTE ─────────────────────────────────────────────────── */}
      {showClienteForm && (
        <Modal title={editCliente ? `Editar · ${editCliente.name}` : 'Nuevo Cliente'} onClose={() => setShowClienteForm(false)} width={500}>
          <FR>
            <Field label="Nombre completo">
              <input value={cf.name} onChange={e => setCf(f => ({ ...f, name: e.target.value }))} placeholder="García, Roberto" style={inputStyle} />
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
          <FR>
            <Field label="Ciudad">
              <input value={cf.city} onChange={e => setCf(f => ({ ...f, city: e.target.value }))} placeholder="CDMX, Monterrey..." style={inputStyle} />
            </Field>
          </FR>
          <Field label="Notas">
            <textarea rows={2} value={cf.notes} onChange={e => setCf(f => ({ ...f, notes: e.target.value }))} placeholder="Preferencias, historial..." style={{ ...inputStyle, resize: 'vertical', marginBottom: 14 }} />
          </Field>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Btn small variant="secondary" onClick={() => setShowClienteForm(false)}>Cancelar</Btn>
            <Btn small onClick={saveCliente} disabled={!cf.name}>{editCliente ? 'Guardar Cambios' : 'Crear Cliente'}</Btn>
          </div>
        </Modal>
      )}

      {/* ── FORM PROVEEDOR ───────────────────────────────────────────────── */}
      {showProveedorForm && (
        <Modal title={editProveedor ? `Editar · ${editProveedor.name}` : 'Nuevo Proveedor'} onClose={() => setShowProveedorForm(false)} width={500}>
          <FR>
            <Field label="Nombre">
              <input value={pf.name} onChange={e => setPf(f => ({ ...f, name: e.target.value }))} placeholder="Nombre o razón social" style={inputStyle} />
            </Field>
            <Field label="Tipo">
              <select value={pf.type} onChange={e => setPf(f => ({ ...f, type: e.target.value }))} style={inputStyle}>
                {['Particular', 'Tienda', 'Distribuidor', 'Subasta', 'Otro'].map(t => <option key={t}>{t}</option>)}
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
          <FR>
            <Field label="Ciudad">
              <input value={pf.city} onChange={e => setPf(f => ({ ...f, city: e.target.value }))} placeholder="CDMX, Miami..." style={inputStyle} />
            </Field>
            <Field label="Rating (1-5)">
              <select value={pf.rating} onChange={e => setPf(f => ({ ...f, rating: +e.target.value }))} style={inputStyle}>
                {[1,2,3,4,5].map(n => <option key={n} value={n}>{Stars(n)}</option>)}
              </select>
            </Field>
          </FR>
          <Field label="Notas">
            <textarea rows={2} value={pf.notes} onChange={e => setPf(f => ({ ...f, notes: e.target.value }))} placeholder="Observaciones, condiciones..." style={{ ...inputStyle, resize: 'vertical', marginBottom: 14 }} />
          </Field>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Btn small variant="secondary" onClick={() => setShowProveedorForm(false)}>Cancelar</Btn>
            <Btn small onClick={saveProveedor} disabled={!pf.name}>{editProveedor ? 'Guardar Cambios' : 'Crear Proveedor'}</Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
//  ADMIN MODULE
// ══════════════════════════════════════════════════════════════════════════════
// ── AUTH SCREEN ─────────────────────────────────────────────────────────────
function AuthScreen({ onAuth }) {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode]         = useState('login') // 'login' | 'register'
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const handle = async () => {
    setError(''); setLoading(true)
    try {
      let result
      if (mode === 'login') {
        result = await sb.auth.signInWithPassword({ email, password })
      } else {
        result = await sb.auth.signUp({ email, password })
      }
      if (result.error) { setError(result.error.message); setLoading(false); return }
      if (mode === 'register') {
        setError(''); setMode('login')
        alert('Cuenta creada. Espera aprobación del Director antes de acceder.')
        setLoading(false); return
      }
      const user = result.data?.user || result.data?.session?.user
      if (user) {
        const { data: p } = await sb.from('profiles').select('*').eq('id', user.id).maybeSingle()
        onAuth(user, p)
      }
    } catch (e) { setError(e.message) }
    setLoading(false)
  }

  return (
    <div style={{ display:'flex', height:'100vh', background: BG }}>
      {/* Left panel — branding */}
      <div style={{ flex: 1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background: S1, borderRight:`1px solid ${BR}`, padding:60 }}>
        <svg width="72" height="72" viewBox="0 0 80 80" fill="none" style={{ marginBottom: 28 }}>
          <line x1="14" y1="10" x2="32" y2="58" stroke="white" strokeWidth="5.5" strokeLinecap="round"/>
          <line x1="32" y1="58" x2="42" y2="30" stroke="white" strokeWidth="5.5" strokeLinecap="round"/>
          <line x1="42" y1="30" x2="52" y2="58" stroke="white" strokeWidth="5.5" strokeLinecap="round"/>
          <line x1="52" y1="58" x2="68" y2="10" stroke="white" strokeWidth="5.5" strokeLinecap="round"/>
          <line x1="14" y1="10" x2="24" y2="68" stroke={G} strokeWidth="3" strokeLinecap="round"/>
          <circle cx="24" cy="70" r="3.5" fill={G}/>
        </svg>
        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:12, color:TM, letterSpacing:'.4em', textTransform:'uppercase', marginBottom:6 }}>The</div>
        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:38, color:TX, letterSpacing:'.18em', fontWeight:600, lineHeight:1, marginBottom:6 }}>Wrist Room</div>
        <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:TD, letterSpacing:'.3em', marginTop:8 }}>SISTEMA OPERATIVO · TWR OS</div>
        <div style={{ marginTop:48, fontFamily:"'Jost',sans-serif", fontSize:13, color:TM, textAlign:'center', lineHeight:1.8, maxWidth:280 }}>
          Plataforma privada de gestión<br/>de inventario y capital · México
        </div>
      </div>
      {/* Right panel — form */}
      <div style={{ width:400, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'48px 40px', animation:'fi .5s ease' }}>
        <div style={{ width:'100%', maxWidth:320 }}>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:TM, letterSpacing:'.2em', marginBottom:24 }}>ACCESO AL SISTEMA</div>

          <div style={{ display:'flex', marginBottom:24, background:S1, borderRadius:4, padding:3, border:`1px solid ${BR}` }}>
            {['login','register'].map(m => (
              <button key={m} onClick={() => { setMode(m); setError('') }}
                style={{ flex:1, padding:'8px 0', background: mode===m ? BRG : 'transparent', border:'none', color: mode===m ? G : TD,
                         fontFamily:"'DM Mono',monospace", fontSize:10, letterSpacing:'.15em', cursor:'pointer', borderRadius:3, transition:'all .2s' }}>
                {m === 'login' ? 'ACCEDER' : 'REGISTRAR'}
              </button>
            ))}
          </div>

          <div style={{ marginBottom:14 }}>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:TD, letterSpacing:'.2em', marginBottom:6 }}>CORREO</div>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handle()} placeholder="usuario@thewristroom.com" />
          </div>
          <div style={{ marginBottom:28 }}>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:TD, letterSpacing:'.2em', marginBottom:6 }}>CONTRASEÑA</div>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handle()} placeholder="••••••••" />
          </div>

          {error && <div style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:RED, marginBottom:16, padding:'10px 14px', background:RED+'18', borderRadius:4, border:`1px solid ${RED}44` }}>{error}</div>}

          <button onClick={handle} disabled={loading || !email || !password}
            style={{ width:'100%', padding:'13px 0', background: loading ? BRG : G, border:'none', borderRadius:4,
                     color: loading ? TM : BG, fontFamily:"'DM Mono',monospace", fontSize:11, letterSpacing:'.2em',
                     cursor: loading || !email || !password ? 'not-allowed' : 'pointer', opacity: (!email || !password) ? .5 : 1, transition:'all .2s', fontWeight:700 }}>
            {loading ? 'PROCESANDO...' : mode === 'login' ? 'ACCEDER' : 'CREAR CUENTA'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── PENDING SCREEN ──────────────────────────────────────────────────────────
function PendingScreen({ user, onLogout }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100vh', background: BG }}>
      <div style={{ animation:'fi .5s ease', width:420, padding:'48px 40px', background:S1, border:`1px solid ${BR}`, borderRadius:8, textAlign:'center' }}>
        <svg width="44" height="44" viewBox="0 0 80 80" fill="none" style={{ marginBottom: 20 }}>
          <line x1="14" y1="10" x2="32" y2="58" stroke="white" strokeWidth="5.5" strokeLinecap="round"/>
          <line x1="32" y1="58" x2="42" y2="30" stroke="white" strokeWidth="5.5" strokeLinecap="round"/>
          <line x1="42" y1="30" x2="52" y2="58" stroke="white" strokeWidth="5.5" strokeLinecap="round"/>
          <line x1="52" y1="58" x2="68" y2="10" stroke="white" strokeWidth="5.5" strokeLinecap="round"/>
          <line x1="14" y1="10" x2="24" y2="68" stroke={G} strokeWidth="3" strokeLinecap="round"/>
          <circle cx="24" cy="70" r="3.5" fill={G}/>
        </svg>
        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:26, color:TX, letterSpacing:'.12em', fontWeight:600, marginBottom:4 }}>The Wrist Room</div>
        <div style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:G, letterSpacing:'.3em', marginBottom:28 }}>ACCESO PENDIENTE</div>
        <div style={{ width:44, height:44, borderRadius:'50%', background:S3, border:`1px solid ${BR}`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px', fontSize:20 }}>⏳</div>
        <div style={{ fontFamily:"'Jost',sans-serif", fontSize:14, color:TX, marginBottom:8, lineHeight:1.6 }}>Tu cuenta ha sido creada exitosamente.</div>
        <div style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:TM, marginBottom:10 }}>{user?.email}</div>
        <div style={{ fontFamily:"'Jost',sans-serif", fontSize:13, color:TM, marginBottom:32, lineHeight:1.7 }}>
          Un Director debe asignarte un rol antes de que puedas acceder al sistema.
        </div>
        <button onClick={onLogout}
          style={{ padding:'10px 28px', background:'transparent', border:`1px solid ${BR}`, borderRadius:4,
                   color:TM, fontFamily:"'DM Mono',monospace", fontSize:10, letterSpacing:'.15em', cursor:'pointer',
                   transition:'all .2s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = G; e.currentTarget.style.color = G }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = BR; e.currentTarget.style.color = TM }}>
          CERRAR SESIÓN
        </button>
      </div>
    </div>
  )
}

function AdminModule({ currentUser }) {
  const [users, setUsers]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [editUser, setEditUser] = useState(null)
  const [uf, setUf]             = useState({ name: '', role: 'pending', active: true })

  const inputStyle = { background: S3, border: `1px solid ${BR}`, color: TX, padding: '10px 14px', borderRadius: 4, fontFamily: "'Jost', sans-serif", fontSize: 13, width: '100%', outline: 'none' }

  useEffect(() => {
    sb.from('profiles').select('*').order('created_at').then(({ data }) => {
      setUsers(data || [])
      setLoading(false)
    })
  }, [])

  const openEdit = (u) => {
    setEditUser(u)
    setUf({ name: u.name || '', role: u.role || 'pending', active: u.active !== false })
  }

  const saveUser = async () => {
    const updated = { ...editUser, ...uf }
    const prev = users
    setUsers(us => us.map(x => x.id === editUser.id ? updated : x))
    try {
      const { error } = await sb.from('profiles').update({ name: uf.name, role: uf.role, active: uf.active }).eq('id', editUser.id)
      if (error) throw new Error(error.message)
      toast(`Usuario "${uf.name || editUser.email}" actualizado`)
      setEditUser(null)
    } catch (e) {
      setUsers(prev)
      toast('Error al actualizar usuario: ' + e.message, 'error')
    }
  }

  const toggleActive = async (u) => {
    if (u.id === currentUser?.id) return
    const active = !u.active
    setUsers(us => us.map(x => x.id === u.id ? { ...x, active } : x))
    try {
      const { error } = await sb.from('profiles').update({ active }).eq('id', u.id)
      if (error) throw new Error(error.message)
      toast(active ? 'Usuario activado' : 'Usuario desactivado', 'info')
    } catch (e) {
      setUsers(us => us.map(x => x.id === u.id ? { ...x, active: !active } : x))
      toast('Error: ' + e.message, 'error')
    }
  }

  const delUser = async (u) => {
    if (u.id === currentUser?.id) return
    if (!window.confirm(`¿Eliminar acceso de "${u.email}"? Esta acción no se puede deshacer.`)) return
    const prev = users
    setUsers(us => us.filter(x => x.id !== u.id))
    try {
      const { error } = await sb.from('profiles').delete().eq('id', u.id)
      if (error) throw new Error(error.message)
      toast('Usuario eliminado del sistema', 'info')
    } catch (e) {
      setUsers(prev)
      toast('Error al eliminar usuario: ' + e.message, 'error')
    }
  }

  const roleColor = { director: G, operador: BLU, inversionista: GRN, pending: TM }
  const roleLbl   = { director: 'Director', operador: 'Operador', inversionista: 'Inversionista', pending: 'Pendiente' }

  return (
    <div>
      <SH title="Administración" subtitle={`${users.length} usuarios · Gestión de accesos`} />

      {loading ? (
        <div style={{ padding: 32, textAlign: 'center', fontFamily: "'DM Mono', monospace", fontSize: 11, color: TD }}>Cargando usuarios...</div>
      ) : (
        <div style={{ background: S1, border: `1px solid ${BR}`, borderRadius: 6, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ borderBottom: `1px solid ${BR}` }}>
              {['Nombre', 'Email', 'Rol', 'Estado', 'Ingreso', ''].map(h =>
                <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontFamily: "'DM Mono', monospace", fontSize: 10, color: TM, letterSpacing: '.1em', fontWeight: 400 }}>{h}</th>
              )}
            </tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom: `1px solid ${BR}` }}
                  onMouseEnter={e => e.currentTarget.style.background = S2}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '11px 16px', fontFamily: "'Jost', sans-serif", fontSize: 13, color: TX }}>
                    {u.name || <span style={{ color: TD, fontStyle: 'italic' }}>Sin nombre</span>}
                    {u.id === currentUser?.id && <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: G, marginLeft: 6, letterSpacing: '.1em' }}>TÚ</span>}
                  </td>
                  <td style={{ padding: '11px 16px', fontFamily: "'DM Mono', monospace", fontSize: 11, color: TM }}>{u.email}</td>
                  <td style={{ padding: '11px 16px' }}>
                    <Badge label={roleLbl[u.role] || u.role} color={roleColor[u.role] || TM} small />
                  </td>
                  <td style={{ padding: '11px 16px' }}>
                    <Badge label={u.active !== false ? 'Activo' : 'Inactivo'} color={u.active !== false ? GRN : RED} small />
                  </td>
                  <td style={{ padding: '11px 16px', fontFamily: "'DM Mono', monospace", fontSize: 10, color: TD }}>
                    {u.created_at ? new Date(u.created_at).toLocaleDateString('es-MX') : '—'}
                  </td>
                  <td style={{ padding: '11px 16px', whiteSpace: 'nowrap' }}>
                    {u.id !== currentUser?.id && <>
                      <button onClick={() => openEdit(u)}
                        style={{ background: 'none', border: 'none', color: TM, cursor: 'pointer', fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: '.06em', padding: '2px 8px' }}>
                        EDITAR
                      </button>
                      <button onClick={() => toggleActive(u)}
                        style={{ background: 'none', border: 'none', color: u.active !== false ? G : GRN, cursor: 'pointer', fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: '.06em', padding: '2px 8px' }}>
                        {u.active !== false ? 'DESACTIVAR' : 'ACTIVAR'}
                      </button>
                      <button onClick={() => delUser(u)}
                        style={{ background: 'none', border: 'none', color: RED, cursor: 'pointer', fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: '.06em', padding: '2px 8px' }}>
                        ✕
                      </button>
                    </>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit user modal */}
      {editUser && (
        <Modal title={`Editar · ${editUser.email}`} onClose={() => setEditUser(null)} width={460}>
          <FR>
            <Field label="Nombre completo">
              <input value={uf.name} onChange={e => setUf(f => ({ ...f, name: e.target.value }))} placeholder="Nombre del usuario" style={inputStyle} />
            </Field>
          </FR>
          <FR>
            <Field label="Rol">
              <select value={uf.role} onChange={e => setUf(f => ({ ...f, role: e.target.value }))} style={inputStyle}>
                <option value="director">Director</option>
                <option value="operador">Operador</option>
                <option value="inversionista">Inversionista</option>
                <option value="pending">Pendiente</option>
              </select>
            </Field>
            <Field label="Estado">
              <select value={uf.active ? 'activo' : 'inactivo'} onChange={e => setUf(f => ({ ...f, active: e.target.value === 'activo' }))} style={inputStyle}>
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </Field>
          </FR>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: TD, marginBottom: 16, letterSpacing: '.1em' }}>
            EMAIL: {editUser.email}
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Btn small variant="secondary" onClick={() => setEditUser(null)}>Cancelar</Btn>
            <Btn small onClick={saveUser}>Guardar Cambios</Btn>
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
  const [authUser, setAuthUser]       = useState(null)
  const [profile, setProfile]         = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [dbLoading, setDbLoading]     = useState(false)
  const [page, setPage]               = useState('dashboard')
  const [appState, setAppState]       = useState({ ...DEMO })

  // ── Load all data from Supabase ──────────────────────────────────────────
  const loadData = async () => {
    setDbLoading(true)
    try {
      const [
        { data: marcas },
        { data: modelos },
        { data: refs },
        { data: proveedores },
        { data: clientes },
        { data: piezas },
        { data: costos },
        { data: ventas },
        { data: pagos },
        { data: socios },
        { data: movimientos },
        { data: tiposCosto },
      ] = await Promise.all([
        sb.from('marcas').select('*').order('name'),
        sb.from('modelos').select('*').order('name'),
        sb.from('referencias').select('*').order('ref'),
        sb.from('proveedores').select('*').order('name'),
        sb.from('clientes').select('*').order('name'),
        sb.from('piezas').select('*').order('created_at', { ascending: false }),
        sb.from('costos_pieza').select('*'),
        sb.from('ventas').select('*').order('created_at', { ascending: false }),
        sb.from('pagos').select('*'),
        sb.from('socios').select('*').order('participacion', { ascending: false }),
        sb.from('movimientos_socios').select('*').order('fecha'),
        sb.from('tipos_costo').select('*').order('nombre'),
      ])

      // Map DB column names to app field names
      const mapBrand  = b => ({ id: b.id, name: b.name, country: b.country, founded: b.founded, notes: b.notes })
      const mapModel  = m => ({ id: m.id, brandId: m.brand_id, name: m.name, family: m.family, notes: m.notes })
      const mapRef    = r => ({ id: r.id, modelId: r.model_id, ref: r.ref, caliber: r.caliber, material: r.material, bezel: r.bezel, dial: r.dial, size: r.size, bracelet: r.bracelet, year: r.year, notes: r.notes })
      const mapProv   = p => ({ id: p.id, name: p.name, type: p.type, phone: p.phone, email: p.email, city: p.city, notes: p.notes, rating: p.rating, totalDeals: p.total_deals })
      const mapClient = c => ({ id: c.id, name: c.name, phone: c.phone, email: c.email, city: c.city, tier: c.tier, notes: c.notes, totalSpent: c.total_spent, totalPurchases: c.total_purchases })
      const mapPieza  = (p, costosList) => ({
        id: p.id, refId: p.ref_id, supplierId: p.supplier_id, serial: p.serial,
        condition: p.condition, fullSet: p.full_set, papers: p.papers, box: p.box,
        cost: p.cost, priceAsked: p.price_asked, entryDate: p.entry_date,
        status: p.status, stage: p.stage, validatedBy: p.validated_by,
        validationDate: p.validation_date, notes: p.notes,
        modoAdquisicion: p.modo_adquisicion || 'sociedad',
        socioAportaId: p.socio_aporta_id,
        splitPersonalizado: p.split_personalizado,
        costos: (costosList || []).filter(c => c.pieza_id === p.id).map(c => ({
          id: c.id, tipo: c.tipo, fecha: c.fecha, monto: c.monto, descripcion: c.descripcion
        }))
      })
      const mapVenta  = (v, pagosList) => ({
        id: v.id, watchId: v.pieza_id, clientId: v.cliente_id,
        saleDate: v.sale_date, agreedPrice: v.agreed_price,
        status: v.status, notes: v.notes,
        payments: (pagosList || []).filter(p => p.venta_id === v.id).map(p => ({
          id: p.id, date: p.date, amount: p.amount, method: p.method, notes: p.notes
        }))
      })
      const mapSocio  = (s, movsList) => ({
        id: s.id, name: s.name, participacion: s.participacion,
        color: s.color, activo: s.activo,
        movimientos: (movsList || []).filter(m => m.socio_id === s.id).map(m => ({
          id: m.id, fecha: m.fecha, tipo: m.tipo, monto: m.monto, concepto: m.concepto
        }))
      })

      setAppState({
        brands:     (marcas     || []).map(mapBrand),
        models:     (modelos    || []).map(mapModel),
        refs:       (refs       || []).map(mapRef),
        suppliers:  (proveedores|| []).map(mapProv),
        clients:    (clientes   || []).map(mapClient),
        watches:    (piezas     || []).map(p => mapPieza(p, costos || [])),
        sales:      (ventas     || []).map(v => mapVenta(v, pagos || [])),
        socios:     (socios     || []).map(s => mapSocio(s, movimientos || [])),
        tiposCosto: (tiposCosto || []).map(t => ({ id: t.id, nombre: t.nombre, icono: t.icono })),
        investors: [], clients_raw: clientes || [],
      })
    } catch(e) {
      console.error('Error loading data:', e)
    }
    setDbLoading(false)
  }

  useEffect(() => {
    // Check existing session
    sb.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const { data: p } = await sb.from('profiles').select('*').eq('id', session.user.id).maybeSingle()
        setAuthUser(session.user)
        setProfile(p || { role: 'pending', name: session.user.email })
        if (p && p.role !== 'pending') await loadData()
      }
      setAuthLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = sb.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const { data: p } = await sb.from('profiles').select('*').eq('id', session.user.id).maybeSingle()
        setAuthUser(session.user)
        setProfile(p || { role: 'pending', name: session.user.email })
        if (p && p.role !== 'pending') await loadData()
      } else if (event === 'SIGNED_OUT') {
        setAuthUser(null); setProfile(null); setAppState({ ...DEMO })
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const logout = async () => { await sb.auth.signOut(); setAuthUser(null); setProfile(null); setPage('dashboard'); setAppState({ ...DEMO }) }

  // Auto-select first valid page (must be before any conditional returns)
  useEffect(() => {
    if (profile && profile.role) {
      const nav = NAV_ITEMS.filter(n => n.roles.includes(profile.role))
      if (!nav.find(n => n.id === page) && nav.length > 0) setPage(nav[0].id)
    }
  }, [profile?.role])

  // Loading
  if (authLoading || dbLoading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: BG, gap: 20 }}>
      <style>{`@keyframes fi{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}} @keyframes pulse{0%,100%{opacity:.3}50%{opacity:1}} @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      <svg width="54" height="54" viewBox="0 0 80 80" fill="none">
        <line x1="14" y1="10" x2="32" y2="58" stroke="white" strokeWidth="5.5" strokeLinecap="round"/>
        <line x1="32" y1="58" x2="42" y2="30" stroke="white" strokeWidth="5.5" strokeLinecap="round"/>
        <line x1="42" y1="30" x2="52" y2="58" stroke="white" strokeWidth="5.5" strokeLinecap="round"/>
        <line x1="52" y1="58" x2="68" y2="10" stroke="white" strokeWidth="5.5" strokeLinecap="round"/>
        <line x1="14" y1="10" x2="24" y2="68" stroke={G} strokeWidth="3" strokeLinecap="round"/>
        <circle cx="24" cy="70" r="3.5" fill={G}/>
      </svg>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 11, color: TM, letterSpacing: '.35em', textTransform: 'uppercase', marginBottom: 4 }}>The</div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, color: TX, letterSpacing: '.15em', fontWeight: 600 }}>Wrist Room</div>
      </div>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: TD, letterSpacing: '.3em', animation: 'pulse 1.5s infinite' }}>
        {dbLoading ? 'CARGANDO DATOS...' : 'INICIANDO SISTEMA...'}
      </div>
    </div>
  )

  // Not logged in
  if (!authUser) return (
    <>
      <style>{`@keyframes fi{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}} input,select{background:${S3};border:1px solid ${BR};color:${TX};padding:10px 14px;border-radius:4px;font-family:'Jost',sans-serif;font-size:13px;width:100%;outline:none;transition:border-color .2s} input:focus,select:focus{border-color:${G}}`}</style>
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
        @keyframes pulse { 0%,100%{opacity:.3} 50%{opacity:1} }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: ${BG}; }
        ::-webkit-scrollbar-thumb { background: ${BR}; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: ${BRG}; }
        ::selection { background: ${G}33; color: ${TX}; }
        input, select, textarea { background:${S3}; border:1px solid ${BR}; color:${TX}; padding:10px 14px; border-radius:4px; font-family:'Jost',sans-serif; font-size:13px; width:100%; outline:none; transition:border-color .2s; }
        input:focus, select:focus, textarea:focus { border-color:${G}; box-shadow: 0 0 0 3px ${G}18; }
        input::placeholder, textarea::placeholder { color:${TD}; }
        select option { background:${S2}; color:${TX}; }
        label { display:block; font-family:'DM Mono',monospace; font-size:10px; color:${TM}; letter-spacing:.1em; text-transform:uppercase; margin-bottom:6px; }
      `}</style>
      <div style={{ display: 'flex', height: '100vh', background: BG, color: TX, fontFamily: "'Jost', sans-serif", overflow: 'hidden' }}>
        {/* Sidebar */}
        <div style={{ width: 210, background: S1, borderRight: `1px solid ${BR}`, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <div style={{ padding: '20px 18px 16px', borderBottom: `1px solid ${BR}` }}>
            {/* TWR Brand Mark */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <svg width="32" height="32" viewBox="0 0 80 80" fill="none">
                {/* Watch hand / W mark */}
                <line x1="14" y1="10" x2="32" y2="58" stroke="white" strokeWidth="5.5" strokeLinecap="round"/>
                <line x1="32" y1="58" x2="42" y2="30" stroke="white" strokeWidth="5.5" strokeLinecap="round"/>
                <line x1="42" y1="30" x2="52" y2="58" stroke="white" strokeWidth="5.5" strokeLinecap="round"/>
                <line x1="52" y1="58" x2="68" y2="10" stroke="white" strokeWidth="5.5" strokeLinecap="round"/>
                {/* Watch hand needle overlapping left stroke */}
                <line x1="14" y1="10" x2="24" y2="68" stroke={G} strokeWidth="3" strokeLinecap="round"/>
                <circle cx="24" cy="70" r="3.5" fill={G}/>
              </svg>
              <div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 11, color: TM, letterSpacing: '.25em', textTransform: 'uppercase', lineHeight: 1 }}>The</div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 16, color: TX, letterSpacing: '.12em', fontWeight: 600, lineHeight: 1, marginTop: 1 }}>Wrist Room</div>
              </div>
            </div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: TD, letterSpacing: '.2em', paddingLeft: 42 }}>TWR OS · v6.0</div>
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
        <div style={{ flex: 1, overflowY: 'auto', padding: 28 }}><PageBoundary key={page}>{renderPage()}</PageBoundary></div>
      </div>
      <ToastContainer />
    </>
  )
}
