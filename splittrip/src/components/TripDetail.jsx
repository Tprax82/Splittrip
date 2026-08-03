import { useState, useRef, useCallback, useEffect } from 'react'
import { C, POPULAR, currLabel, fmtAmt, CURR_MAP } from '../constants.js'
import { uid, pc, settle, fetchAllRatesFrom } from '../utils.js'
import { Pill, Tag, Btn, EditableText, Toast, CurrencyPicker, RateWidget } from './UI.jsx'

const baseInp = {
  background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8,
  color: C.text, padding: '9px 12px', fontSize: 13, outline: 'none',
  width: '100%', boxSizing: 'border-box', fontFamily: 'inherit',
}

// Calls our serverless function /api/scan-receipt (proxies to Anthropic with server-side key)
async function scanReceipt(b64, mime) {
  const resp = await fetch('/api/scan-receipt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: b64, mimeType: mime }),
  })
  if (!resp.ok) throw new Error(`Scan API error: ${resp.status}`)
  return resp.json()
}

export default function TripDetail({ trip, onUpdate, onBack }) {
  const [tab,          setTab]         = useState('add')
  const [desc,         setDesc]        = useState('')
  const [amount,       setAmount]      = useState('')
  const [currency,     setCurrency]    = useState(trip.baseCurrency)
  const [paidBy,       setPaidBy]      = useState(trip.friends[0] || '')
  const [splitAmong,   setSplitAmong]  = useState([...trip.friends])
  const [scanning,     setScanning]    = useState(false)
  const [scanErr,      setScanErr]     = useState('')
  const [showPeople,   setShowPeople]  = useState(false)
  const [newPerson,    setNewPerson]   = useState('')
  const [toast,        setToast]       = useState('')
  const [currPicker,   setCurrPicker]  = useState(false)
  const [basePicker,   setBasePicker]  = useState(false)
  const [rateMap,      setRateMap]     = useState({})
  const [ratesDate,    setRatesDate]   = useState('')
  const [ratesLoading, setRatesLoading] = useState(false)
  const fileRef = useRef()

  const t = trip
  const usedCurrencies = [...new Set([t.baseCurrency, ...t.expenses.map(e => e.currency)])]

  // ── Load rates whenever base or expenses change ──
  async function loadRates() {
    const targets = usedCurrencies.filter(c => c !== t.baseCurrency)
    if (!targets.length) return
    setRatesLoading(true)
    try {
      const inverted = await fetchAllRatesFrom(t.baseCurrency, targets)
      setRateMap(inverted)
      setRatesDate(new Date().toLocaleString('en-SG', {
        day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit'
      }))
    } catch (e) { console.error('rate fetch', e) }
    setRatesLoading(false)
  }
  useEffect(() => { loadRates() }, [t.baseCurrency, t.expenses.length])

  function patch(changes) { onUpdate({ ...t, ...changes }) }

  function toBase(amount, curr) {
    if (curr === t.baseCurrency) return amount
    const r = rateMap[curr]
    return r ? amount * r : amount
  }

  // ── People management ──────────────────────────────────────────────────────
  function renamePerson(old, next) {
    if (!next.trim() || next === old) return
    patch({
      friends:  t.friends.map(f => f === old ? next : f),
      expenses: t.expenses.map(e => ({
        ...e,
        paidBy:     e.paidBy === old ? next : e.paidBy,
        splitAmong: e.splitAmong.map(f => f === old ? next : f),
      })),
    })
    if (paidBy === old) setPaidBy(next)
    setSplitAmong(s => s.map(f => f === old ? next : f))
  }

  function removePerson(name) {
    const friends = t.friends.filter(f => f !== name)
    patch({
      friends,
      expenses: t.expenses.map(e => ({
        ...e,
        paidBy:     e.paidBy === name ? (friends[0] || '') : e.paidBy,
        splitAmong: e.splitAmong.filter(f => f !== name),
      })),
    })
    if (paidBy === name) setPaidBy(friends[0] || '')
    setSplitAmong(s => s.filter(f => f !== name))
  }

  function addPerson() {
    const n = newPerson.trim()
    if (!n || t.friends.includes(n)) return
    patch({ friends: [...t.friends, n] })
    setSplitAmong(s => [...s, n])
    setNewPerson('')
  }

  // ── Receipt scan ───────────────────────────────────────────────────────────
  const handleScan = useCallback(async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setScanErr('')
    setScanning(true)
    try {
      const b64 = await new Promise((res, rej) => {
        const r = new FileReader()
        r.onload  = () => res(r.result.split(',')[1])
        r.onerror = rej
        r.readAsDataURL(file)
      })
      const result = await scanReceipt(b64, file.type || 'image/jpeg')
      if (result.total && result.total > 0) {
        setAmount(String(result.total))
        if (result.currency && CURR_MAP[result.currency]) setCurrency(result.currency)
        if (result.merchant) setDesc(result.merchant)
        setToast(`📷 Scanned: ${fmtAmt(result.total, result.currency || t.baseCurrency)}`)
      } else {
        setScanErr('Could not read amount from receipt — fill in manually.')
      }
    } catch (err) {
      console.error('scan error', err)
      setScanErr('Scan failed — check your connection or fill in manually.')
    } finally {
      setScanning(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }, [t.baseCurrency])

  // ── Add expense ────────────────────────────────────────────────────────────
  function addExpense() {
    if (!desc || !amount || !splitAmong.length || !paidBy) return
    patch({
      expenses: [...t.expenses, {
        id: uid(), description: desc,
        amount: pc(amount), currency,
        paidBy, splitAmong: [...splitAmong],
      }],
    })
    setDesc('')
    setAmount('')
    setToast('Expense added ✓')
  }

  const { bal, txns } = settle(t.friends, t.expenses, t.baseCurrency, rateMap)
  const totalBase = t.expenses.reduce((s, e) => s + toBase(e.amount, e.currency), 0)
  const shareAmt  = splitAmong.length > 0 && amount
    ? toBase(pc(amount), currency) / splitAmong.length
    : 0

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 16px 60px' }}>
      {toast      && <Toast msg={toast} onDone={() => setToast('')} />}
      {currPicker && <CurrencyPicker selected={currency}        onSelect={setCurrency}                 onClose={() => setCurrPicker(false)} />}
      {basePicker && <CurrencyPicker selected={t.baseCurrency}  onSelect={c => { patch({ baseCurrency: c }); setBasePicker(false) }} onClose={() => setBasePicker(false)} />}

      {/* ── Trip header ── */}
      <div style={{ padding: '20px 0 16px', borderBottom: `1px solid ${C.border}`, marginBottom: 20 }}>
        <button onClick={onBack} style={{
          background:'none', border:'none', color:C.muted,
          cursor:'pointer', fontSize:13, marginBottom:12,
          padding:0, display:'flex', alignItems:'center', gap:4,
        }}>← All trips</button>

        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:10 }}>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:10, color:C.muted, fontWeight:700, letterSpacing:1, marginBottom:4 }}>TRIP NAME</div>
            <EditableText value={t.name} onChange={v => patch({ name: v })} placeholder="Trip name"
              style={{ fontSize:19, fontWeight:800, color:C.white }} />
            <div style={{ fontSize:11, color:C.muted, marginTop:3 }}>{t.date}</div>
          </div>
          <div style={{ textAlign:'right', flexShrink:0 }}>
            <div style={{ fontSize:18, fontWeight:800, color:C.teal }}>{fmtAmt(totalBase, t.baseCurrency)}</div>
            <div style={{ fontSize:10, color:C.muted }}>total</div>
          </div>
        </div>

        {/* Base currency */}
        <div style={{ marginTop:12, display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:11, color:C.muted }}>Settle in</span>
          <button onClick={() => setBasePicker(true)} style={{
            background:C.accentDim, border:`1px solid ${C.accent}44`,
            borderRadius:8, padding:'5px 12px', cursor:'pointer',
            color:C.accent, fontWeight:700, fontSize:13, fontFamily:'inherit',
          }}>{currLabel(t.baseCurrency)} ↓</button>
        </div>

        {/* People */}
        <div style={{ marginTop:14 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
            <span style={{ fontSize:11, color:C.muted, fontWeight:700, letterSpacing:1 }}>PEOPLE</span>
            <button onClick={() => setShowPeople(v => !v)} style={{
              background:'none', border:`1px solid ${C.border}`, borderRadius:6,
              color:C.muted, fontSize:11, cursor:'pointer', padding:'3px 10px',
            }}>{showPeople ? 'Done' : 'Edit people'}</button>
          </div>

          {showPeople ? (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {t.friends.map(f => (
                <div key={f} style={{
                  display:'flex', alignItems:'center', gap:8,
                  background:C.card, border:`1px solid ${C.border}`,
                  borderRadius:8, padding:'8px 12px',
                }}>
                  <EditableText value={f} onChange={v => renamePerson(f, v)}
                    style={{ fontSize:13, color:C.text, flex:1 }} />
                  <span style={{ fontSize:10, color:C.muted }}>tap to rename</span>
                  <button onClick={() => removePerson(f)} style={{
                    background:C.redDim, border:'none', borderRadius:6,
                    color:C.red, cursor:'pointer', padding:'3px 8px', fontSize:11,
                  }}>✕</button>
                </div>
              ))}
              <div style={{ display:'flex', gap:8, marginTop:4 }}>
                <input placeholder="Add person…" value={newPerson}
                  onChange={e => setNewPerson(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addPerson()}
                  style={{ ...baseInp, flex:1, padding:'7px 10px', fontSize:12 }} />
                <Btn small onClick={addPerson}>Add</Btn>
              </div>
            </div>
          ) : (
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {t.friends.map(f => (
                <span key={f} style={{
                  background:C.accentDim, color:C.accent,
                  border:`1px solid ${C.accent}33`,
                  borderRadius:20, padding:'4px 12px', fontSize:12, fontWeight:600,
                }}>{f}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display:'flex', gap:6, marginBottom:20 }}>
        {[['add','Add'],['expenses',`Expenses (${t.expenses.length})`],['settle','Settle up']].map(([key,label]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            flex:1, background: tab===key ? C.accent : C.card,
            color: tab===key ? C.white : C.muted,
            border:`1px solid ${tab===key ? C.accent : C.border}`,
            borderRadius:9, padding:'9px 4px', fontSize:11,
            cursor:'pointer', fontWeight:tab===key?700:400, fontFamily:'inherit',
          }}>{label}</button>
        ))}
      </div>

      {/* ── ADD TAB ── */}
      {tab === 'add' && (
        <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, padding:18 }}>
          {/* Scan */}
          <button onClick={() => fileRef.current?.click()} disabled={scanning} style={{
            width:'100%', background: scanning ? C.surface : C.accentDim,
            border:`1.5px dashed ${C.accent}66`, borderRadius:10,
            color: scanning ? C.muted : C.accent,
            padding:'13px 0', cursor: scanning ? 'not-allowed' : 'pointer',
            fontSize:13, fontWeight:700, marginBottom:14,
            display:'flex', alignItems:'center', justifyContent:'center', gap:8,
            fontFamily:'inherit',
          }}>
            {scanning ? '⏳ Scanning receipt…' : '📷  Scan Receipt with AI'}
          </button>
          <input ref={fileRef} type="file" accept="image/*"
            capture="environment"
            onChange={handleScan} style={{ display:'none' }} />

          {scanErr && (
            <div style={{
              background:C.redDim, border:`1px solid ${C.red}44`,
              borderRadius:8, padding:'8px 12px',
              color:C.red, fontSize:12, marginBottom:12,
            }}>{scanErr}</div>
          )}

          <input placeholder="What was this for?" value={desc}
            onChange={e => setDesc(e.target.value)}
            style={{ ...baseInp, marginBottom:10 }} />

          <div style={{ display:'flex', gap:8, marginBottom: shareAmt > 0 ? 8 : 14 }}>
            <input type="number" placeholder="0.00" value={amount}
              onChange={e => setAmount(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addExpense()}
              style={{ ...baseInp, flex:1 }} />
            <button onClick={() => setCurrPicker(true)} style={{
              background:C.card, border:`1px solid ${C.border}`,
              borderRadius:8, padding:'9px 14px', cursor:'pointer',
              color:C.text, fontWeight:700, fontSize:13, flexShrink:0,
              fontFamily:'inherit', whiteSpace:'nowrap',
            }}>{currLabel(currency)} ↓</button>
          </div>

          {shareAmt > 0 && (
            <div style={{
              background:C.tealDim, border:`1px solid ${C.teal}33`,
              borderRadius:8, padding:'7px 12px', marginBottom:14,
              fontSize:12, color:C.teal,
            }}>
              {fmtAmt(pc(amount), currency)}
              {currency !== t.baseCurrency && rateMap[currency] &&
                ` ≈ ${fmtAmt(toBase(pc(amount), currency), t.baseCurrency)}`}
              {' ÷ '}{splitAmong.length} = <strong>{fmtAmt(shareAmt, t.baseCurrency)} each</strong>
            </div>
          )}

          <div style={{ marginBottom:12 }}>
            <div style={{ fontSize:11, color:C.muted, marginBottom:7 }}>Paid by</div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {t.friends.map(f => <Pill key={f} label={f} active={paidBy===f} onClick={() => setPaidBy(f)} />)}
            </div>
          </div>

          <div style={{ marginBottom:16 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:7 }}>
              <span style={{ fontSize:11, color:C.muted }}>Split among</span>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={() => setSplitAmong([...t.friends])} style={{ background:'none',border:'none',color:C.accent,fontSize:11,cursor:'pointer' }}>All</button>
                <button onClick={() => setSplitAmong([])} style={{ background:'none',border:'none',color:C.muted,fontSize:11,cursor:'pointer' }}>None</button>
              </div>
            </div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {t.friends.map(f => (
                <Pill key={f} label={f}
                  active={splitAmong.includes(f)}
                  onClick={() => setSplitAmong(s => s.includes(f) ? s.filter(x => x!==f) : [...s,f])} />
              ))}
            </div>
          </div>

          <Btn full onClick={addExpense} disabled={!desc || !amount || !splitAmong.length || !paidBy}>
            Add Expense
          </Btn>
        </div>
      )}

      {/* ── EXPENSES TAB ── */}
      {tab === 'expenses' && (
        <div>
          <RateWidget baseCurrency={t.baseCurrency} usedCurrencies={usedCurrencies}
            rateMap={rateMap} ratesDate={ratesDate} loading={ratesLoading} onRefresh={loadRates} />
          {t.expenses.length === 0 ? (
            <div style={{ textAlign:'center', padding:'40px 0', color:C.muted }}>
              <div style={{ fontSize:32, marginBottom:8 }}>🧾</div>
              <div style={{ fontSize:13 }}>No expenses yet.</div>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {[...t.expenses].reverse().map(e => {
                const base = toBase(e.amount, e.currency)
                return (
                  <div key={e.id} style={{
                    background:C.card, border:`1px solid ${C.border}`,
                    borderRadius:10, padding:'12px 14px',
                    display:'flex', gap:10, alignItems:'flex-start',
                  }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', gap:6, alignItems:'center', flexWrap:'wrap', marginBottom:4 }}>
                        <span style={{ color:C.text, fontWeight:600, fontSize:13 }}>{e.description}</span>
                        <Tag color={e.currency===t.baseCurrency ? C.accent : C.amber}>
                          {fmtAmt(e.amount, e.currency)}
                        </Tag>
                        {e.currency !== t.baseCurrency && (
                          <Tag color={C.muted}>≈{fmtAmt(base, t.baseCurrency)}</Tag>
                        )}
                      </div>
                      <div style={{ fontSize:11, color:C.muted }}>
                        <span style={{ color:C.teal }}>Paid by {e.paidBy}</span>
                        {' · '}Split: {e.splitAmong.join(', ')}
                      </div>
                    </div>
                    <button onClick={() => patch({ expenses: t.expenses.filter(x => x.id!==e.id) })} style={{
                      background:C.redDim, border:'none', borderRadius:6,
                      color:C.red, cursor:'pointer', padding:'4px 8px', fontSize:11,
                    }}>✕</button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── SETTLE TAB ── */}
      {tab === 'settle' && (
        <div>
          <RateWidget baseCurrency={t.baseCurrency} usedCurrencies={usedCurrencies}
            rateMap={rateMap} ratesDate={ratesDate} loading={ratesLoading} onRefresh={loadRates} />

          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:11, color:C.muted, fontWeight:700, letterSpacing:1, marginBottom:10 }}>
              NET BALANCE ({t.baseCurrency})
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {t.friends.map(f => {
                const b = bal[f] || 0
                return (
                  <div key={f} style={{
                    background:C.card,
                    border:`1px solid ${b>0.005?C.teal+'44':b<-0.005?C.red+'44':C.border}`,
                    borderRadius:10, padding:'12px 16px',
                    display:'flex', justifyContent:'space-between', alignItems:'center',
                  }}>
                    <span style={{ fontWeight:600, fontSize:14 }}>{f}</span>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ color:b>0.005?C.teal:b<-0.005?C.red:C.muted, fontWeight:800, fontSize:16 }}>
                        {b>0.005?'+':''}{fmtAmt(b, t.baseCurrency)}
                      </div>
                      <div style={{ fontSize:10, color:C.muted }}>
                        {b>0.005?'to receive':b<-0.005?'to pay':'settled'}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div>
            <div style={{ fontSize:11, color:C.muted, fontWeight:700, letterSpacing:1, marginBottom:10 }}>
              WHO PAYS WHOM
            </div>
            {txns.length === 0 ? (
              <div style={{
                background:C.tealDim, border:`1px solid ${C.teal}44`,
                borderRadius:12, padding:'20px', textAlign:'center',
                color:C.teal, fontWeight:700, fontSize:14,
              }}>✅ All settled up!</div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {txns.map((s, i) => (
                  <div key={i} style={{
                    background:C.tealDim, border:`1px solid ${C.teal}33`,
                    borderRadius:12, padding:'14px 18px',
                    display:'flex', alignItems:'center', gap:10, flexWrap:'wrap',
                  }}>
                    <div style={{ background:C.redDim, border:`1px solid ${C.red}33`, borderRadius:8, padding:'4px 10px', color:C.red, fontWeight:700, fontSize:13 }}>{s.from}</div>
                    <div style={{ color:C.muted, fontSize:18 }}>→</div>
                    <div style={{ background:C.tealDim, border:`1px solid ${C.teal}55`, borderRadius:8, padding:'4px 10px', color:C.teal, fontWeight:700, fontSize:13 }}>{s.to}</div>
                    <div style={{ marginLeft:'auto', fontWeight:800, fontSize:17, color:C.white }}>{fmtAmt(s.amount, t.baseCurrency)}</div>
                  </div>
                ))}
              </div>
            )}

            {t.expenses.length > 0 && (
              <div style={{ marginTop:20, background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:16 }}>
                <div style={{ fontSize:11, color:C.muted, marginBottom:10, fontWeight:700 }}>TRIP SUMMARY</div>
                {[
                  ['Total spent', fmtAmt(totalBase, t.baseCurrency)],
                  ['Per person (equal)', fmtAmt(totalBase / t.friends.length, t.baseCurrency)],
                  ['Expenses', String(t.expenses.length)],
                  ['People', String(t.friends.length)],
                  ['Base currency', currLabel(t.baseCurrency)],
                ].map(([label, val]) => (
                  <div key={label} style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                    <span style={{ color:C.muted, fontSize:12 }}>{label}</span>
                    <span style={{ fontWeight:700, fontSize:12 }}>{val}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
