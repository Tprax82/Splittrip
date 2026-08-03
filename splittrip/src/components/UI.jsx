import { useState, useEffect, useRef } from 'react'
import { C, POPULAR, currLabel } from '../constants.js'

// ── Pill toggle ───────────────────────────────────────────────────────────────
export function Pill({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      background:    active ? C.accentDim   : 'transparent',
      color:         active ? C.accent      : C.muted,
      border:        `1px solid ${active ? C.accent + '55' : C.border}`,
      borderRadius:  20, padding: '5px 13px', fontSize: 12,
      cursor: 'pointer', fontWeight: active ? 700 : 400,
      transition: 'all 0.12s', fontFamily: 'inherit',
    }}>{label}</button>
  )
}

// ── Tag chip ──────────────────────────────────────────────────────────────────
export function Tag({ children, color = C.accent }) {
  return (
    <span style={{
      background: color + '22', color,
      border: `1px solid ${color}44`,
      borderRadius: 6, padding: '2px 8px',
      fontSize: 11, fontWeight: 700,
    }}>{children}</span>
  )
}

// ── Button ────────────────────────────────────────────────────────────────────
export function Btn({ children, onClick, variant = 'primary', small, disabled, full, style: sx = {} }) {
  const map = {
    primary:   { bg: disabled ? C.border : C.accent, bd: `1px solid ${disabled ? C.border : C.accent}`,  col: C.white },
    secondary: { bg: C.card,         bd: `1px solid ${C.border}`,    col: C.muted  },
    ghost:     { bg: 'transparent',  bd: 'none',                     col: C.muted  },
    danger:    { bg: C.redDim,       bd: `1px solid ${C.red}55`,     col: C.red    },
  }
  const s = map[variant] || map.primary
  return (
    <button onClick={disabled ? undefined : onClick} style={{
      background: s.bg, border: s.bd, borderRadius: 9,
      color: s.col, padding: small ? '6px 14px' : '10px 20px',
      fontSize: small ? 12 : 13, fontWeight: 700,
      cursor: disabled ? 'not-allowed' : 'pointer',
      width: full ? '100%' : undefined,
      opacity: disabled ? 0.5 : 1,
      fontFamily: 'inherit', ...sx,
    }}>{children}</button>
  )
}

// ── Inline editable text ──────────────────────────────────────────────────────
export function EditableText({ value, onChange, style: sx = {}, placeholder = '' }) {
  const [editing, setEditing] = useState(false)
  const [v, setV]             = useState(value)
  const ref = useRef()
  useEffect(() => setV(value), [value])
  useEffect(() => { if (editing) ref.current?.select() }, [editing])

  const commit = () => { onChange(v || value); setEditing(false) }

  if (editing) return (
    <input ref={ref} value={v}
      onChange={e => setV(e.target.value)}
      onBlur={commit}
      onKeyDown={e => (e.key === 'Enter' || e.key === 'Escape') && commit()}
      style={{
        ...sx, background: 'transparent', border: 'none',
        borderBottom: `1.5px solid ${C.accent}`, outline: 'none',
        color: 'inherit', fontFamily: 'inherit', padding: '0 2px',
      }}
    />
  )
  return (
    <span onClick={() => setEditing(true)} title="Click to edit" style={{
      ...sx, cursor: 'text',
      borderBottom: `1px dashed ${C.borderBright}`, paddingBottom: 1,
    }}>{value || placeholder}</span>
  )
}

// ── Toast ─────────────────────────────────────────────────────────────────────
export function Toast({ msg, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2400); return () => clearTimeout(t) }, [])
  return (
    <div style={{
      position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
      background: C.teal, color: '#000', borderRadius: 10, padding: '10px 22px',
      fontSize: 13, fontWeight: 700, zIndex: 9999, pointerEvents: 'none',
      boxShadow: `0 4px 24px ${C.teal}44`, whiteSpace: 'nowrap',
    }}>{msg}</div>
  )
}

// ── Currency picker bottom-sheet ──────────────────────────────────────────────
export function CurrencyPicker({ selected, onSelect, onClose }) {
  const [q, setQ] = useState('')
  const filtered  = POPULAR.filter(c =>
    c.code.includes(q.toUpperCase()) ||
    c.name.toLowerCase().includes(q.toLowerCase())
  )
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 2000,
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: C.card, border: `1px solid ${C.border}`,
        borderRadius: '16px 16px 0 0', padding: '20px 16px 32px',
        width: '100%', maxWidth: 480, maxHeight: '70vh',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 12 }}>
          <span style={{ fontWeight: 800, fontSize: 16, color: C.white }}>Choose Currency</span>
          <button onClick={onClose} style={{ background:'none', border:'none', color:C.muted, cursor:'pointer', fontSize:20 }}>✕</button>
        </div>
        <input autoFocus placeholder="Search…" value={q} onChange={e => setQ(e.target.value)}
          style={{
            background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 8, color: C.text, padding: '9px 12px',
            fontSize: 13, outline: 'none', marginBottom: 12,
          }}
        />
        <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {filtered.map(c => (
            <button key={c.code} onClick={() => { onSelect(c.code); onClose() }} style={{
              background: selected === c.code ? C.accentDim : 'transparent',
              border: `1px solid ${selected === c.code ? C.accent + '55' : C.border}`,
              borderRadius: 8, padding: '10px 14px', cursor: 'pointer',
              color: C.text, textAlign: 'left', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span style={{ fontSize: 20 }}>{c.flag}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: selected === c.code ? C.accent : C.text }}>{c.code}</div>
                <div style={{ fontSize: 11, color: C.muted }}>{c.name}</div>
              </div>
              {selected === c.code && <span style={{ marginLeft: 'auto', color: C.accent }}>✓</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Rate widget ───────────────────────────────────────────────────────────────
export function RateWidget({ baseCurrency, usedCurrencies, rateMap, ratesDate, loading, onRefresh }) {
  const others = usedCurrencies.filter(c => c !== baseCurrency)
  if (!others.length) return null
  return (
    <div style={{
      background: C.amberDim, border: `1px solid ${C.amber}33`,
      borderRadius: 12, padding: '12px 14px', marginBottom: 16,
    }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 8 }}>
        <span style={{ fontSize: 11, color: C.amber, fontWeight: 700, letterSpacing: 1 }}>LIVE RATES</span>
        <button onClick={onRefresh} style={{
          background:'none', border:'none', color:C.amber, cursor:'pointer', fontSize:11, fontWeight:700,
        }}>{loading ? '⏳ Loading…' : '↻ Refresh'}</button>
      </div>
      <div style={{ display:'flex', flexWrap:'wrap', gap: 8 }}>
        {others.map(c => (
          <div key={c} style={{
            background: C.amberDim, border: `1px solid ${C.amber}22`,
            borderRadius: 8, padding: '5px 10px', fontSize: 12,
          }}>
            <span style={{ color: C.muted }}>1 {c} = </span>
            <span style={{ color: C.amber, fontWeight: 700 }}>
              {rateMap[c] ? `${rateMap[c].toFixed(4)} ${baseCurrency}` : '–'}
            </span>
          </div>
        ))}
      </div>
      {ratesDate && (
        <div style={{ fontSize: 10, color: C.muted, marginTop: 6 }}>
          Rates as of {ratesDate} · ECB/Interbank midmarket
        </div>
      )}
    </div>
  )
}
