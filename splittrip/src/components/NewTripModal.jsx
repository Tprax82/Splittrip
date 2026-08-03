import { useState } from 'react'
import { C, currLabel, CURR_MAP } from '../constants.js'
import { uid, today, pc } from '../utils.js'
import { Btn, CurrencyPicker } from './UI.jsx'

const inp = {
  background: '#0f1520', border: `1px solid #1e2d4a`, borderRadius: 8,
  color: '#dde4f0', padding: '9px 12px', fontSize: 13, outline: 'none',
  width: '100%', boxSizing: 'border-box', fontFamily: 'inherit',
}

export default function NewTripModal({ onConfirm, onCancel }) {
  const [name,         setName]    = useState('')
  const [peopleRaw,    setPeople]  = useState('')
  const [baseCurrency, setBase]    = useState('SGD')
  const [picker,       setPicker]  = useState(false)

  function create() {
    const friends = peopleRaw.split(',').map(s => s.trim()).filter(Boolean)
    if (friends.length < 2) { alert('Add at least 2 people (comma-separated).'); return }
    onConfirm({
      id: uid(),
      name: name.trim() || 'New Trip',
      date: today(),
      friends,
      expenses: [],
      baseCurrency,
    })
  }

  return (
    <>
      {picker && (
        <CurrencyPicker selected={baseCurrency} onSelect={setBase} onClose={() => setPicker(false)} />
      )}
      <div style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16,
      }}>
        <div style={{
          background: '#141b2d', border: `1px solid #1e2d4a`,
          borderRadius: 16, padding: 24, width: '100%', maxWidth: 400,
        }}>
          <div style={{ fontWeight: 800, fontSize: 17, color: '#ffffff', marginBottom: 18 }}>New Trip</div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: '#5a7090', marginBottom: 6, fontWeight: 700 }}>TRIP NAME</div>
            <input placeholder="JB Weekend, Bali June, Tokyo…"
              value={name} onChange={e => setName(e.target.value)} autoFocus style={inp} />
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: '#5a7090', marginBottom: 6, fontWeight: 700 }}>PEOPLE (comma-separated)</div>
            <input placeholder="Alice, Bob, Charlie"
              value={peopleRaw} onChange={e => setPeople(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && create()} style={inp} />
            <div style={{ fontSize: 11, color: '#5a7090', marginTop: 4 }}>You can rename or add more later.</div>
          </div>

          <div style={{ marginBottom: 22 }}>
            <div style={{ fontSize: 11, color: '#5a7090', marginBottom: 6, fontWeight: 700 }}>SETTLE IN CURRENCY</div>
            <button onClick={() => setPicker(true)} style={{
              ...inp, textAlign: 'left', cursor: 'pointer',
              color: '#3d8bff', fontWeight: 700, fontSize: 14,
              border: `1px solid #3d8bff44`,
            }}>
              {currLabel(baseCurrency)} · {CURR_MAP[baseCurrency]?.name} ↓
            </button>
          </div>

          <div style={{ display:'flex', gap: 10 }}>
            <Btn variant="secondary" onClick={onCancel} full>Cancel</Btn>
            <Btn onClick={create} full>Create Trip</Btn>
          </div>
        </div>
      </div>
    </>
  )
}
