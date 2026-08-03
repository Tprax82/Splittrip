import { get, set } from 'idb-keyval'

// ── General ───────────────────────────────────────────────────────────────────
export const uid   = () => Math.random().toString(36).slice(2, 9)
export const pc    = (v) => { const n = parseFloat(String(v).replace(/[^0-9.-]/g, '')); return isNaN(n) ? 0 : n }
export const today = () => new Date().toLocaleDateString('en-SG', { day:'2-digit', month:'short', year:'numeric' })

// ── IndexedDB persistence (works in any browser, no login required) ───────────
const DB_KEY = 'splittrip-trips-v1'

export async function loadTrips() {
  try { return (await get(DB_KEY)) || [] }
  catch { return [] }
}
export async function saveTrips(trips) {
  try { await set(DB_KEY, trips) } catch (e) { console.error('storage error', e) }
}

// ── Settlement algorithm ──────────────────────────────────────────────────────
export function settle(friends, expenses, baseCurrency, rateMap) {
  const bal = {}
  friends.forEach(f => bal[f] = 0)

  expenses.forEach(({ paidBy, amount, currency, splitAmong }) => {
    if (!splitAmong.length || !paidBy) return
    let inBase = amount
    if (currency !== baseCurrency) {
      const r = rateMap[currency]
      if (r) inBase = amount * r
    }
    const share = inBase / splitAmong.length
    bal[paidBy] = (bal[paidBy] || 0) + inBase
    splitAmong.forEach(f => bal[f] = (bal[f] || 0) - share)
  })

  const pos = [], neg = []
  Object.entries(bal).forEach(([n, v]) => {
    if (v >  0.005) pos.push({ n, v })
    if (v < -0.005) neg.push({ n, v: -v })
  })

  const txns = []
  let i = 0, j = 0
  while (i < pos.length && j < neg.length) {
    const amt = Math.min(pos[i].v, neg[j].v)
    txns.push({ from: neg[j].n, to: pos[i].n, amount: amt })
    pos[i].v -= amt; neg[j].v -= amt
    if (pos[i].v < 0.005) i++
    if (neg[j].v < 0.005) j++
  }
  return { bal, txns }
}

// ── Exchange rate fetching (fawazahmed0 — free, no key, 200+ currencies) ──────
const RATE_CACHE = {}
const CDN  = 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies'
const CF   = 'https://latest.currency-api.pages.dev/v1/currencies'

export async function fetchAllRatesFrom(base, targetCodes) {
  const baseL = base.toLowerCase()
  const urls  = [`${CDN}/${baseL}.min.json`, `${CF}/${baseL}.min.json`]

  for (const url of urls) {
    try {
      const r    = await fetch(url)
      if (!r.ok) continue
      const data = await r.json()
      const raw  = data[baseL]
      if (!raw) continue

      // raw[target] = how many target per 1 base  →  invert to get "1 target in base"
      const inverted = {}
      targetCodes.forEach(code => {
        const cL = code.toLowerCase()
        if (raw[cL]) {
          inverted[code] = 1 / raw[cL]
          RATE_CACHE[`${code}->${base}`] = { rate: inverted[code], ts: Date.now() }
        }
      })
      return inverted
    } catch { /* try next URL */ }
  }
  return {}
}
