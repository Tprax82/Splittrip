import { C, currLabel, fmtAmt } from '../constants.js'
import { settle } from '../utils.js'
import { Tag, Btn } from './UI.jsx'

export default function TripList({ trips, onOpen, onCreate }) {
  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 16px 60px' }}>
      {/* Header */}
      <div style={{ padding: '28px 0 20px', borderBottom: `1px solid ${C.border}`, marginBottom: 20 }}>
        <div style={{ display:'flex', alignItems:'center', gap: 10, marginBottom: 4 }}>
          <span style={{ fontSize: 28 }}>🧳</span>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: C.white, letterSpacing: -0.5 }}>SplitTrip</div>
            <div style={{ fontSize: 12, color: C.muted }}>Expense splitting · any currency</div>
          </div>
        </div>
      </div>

      <Btn full onClick={onCreate}>+ New Trip</Btn>

      {trips.length === 0 ? (
        <div style={{ textAlign:'center', padding:'48px 0', color:C.muted }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🗺️</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 4 }}>No trips yet</div>
          <div style={{ fontSize: 12 }}>Create your first trip to get started.</div>
        </div>
      ) : (
        <div style={{ marginTop: 20, display:'flex', flexDirection:'column', gap: 10 }}>
          <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, letterSpacing: 1 }}>
            YOUR TRIPS ({trips.length})
          </div>
          {[...trips].reverse().map(trip => {
            const usedCurrencies = [...new Set(trip.expenses.map(e => e.currency))]
            const { txns } = settle(trip.friends, trip.expenses, trip.baseCurrency, {})
            const totalBase = trip.expenses.reduce((s, e) => {
              if (e.currency === trip.baseCurrency) return s + e.amount
              return s + e.amount // rough — no rate available here
            }, 0)
            return (
              <div key={trip.id}
                onClick={() => onOpen(trip.id)}
                style={{
                  background: C.card, border: `1px solid ${C.border}`,
                  borderRadius: 14, padding: '16px 18px',
                  cursor: 'pointer', transition: 'background 0.15s',
                  display: 'flex', alignItems: 'center', gap: 12,
                }}
                onMouseEnter={e => e.currentTarget.style.background = C.cardHover}
                onMouseLeave={e => e.currentTarget.style.background = C.card}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, color: C.white, fontSize: 14, marginBottom: 3 }}>{trip.name}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>
                    {trip.date} · {trip.friends.join(', ')}
                  </div>
                  <div style={{ display:'flex', gap: 6, flexWrap:'wrap' }}>
                    <Tag color={C.accent}>{trip.expenses.length} expense{trip.expenses.length !== 1 ? 's' : ''}</Tag>
                    <Tag color={C.teal}>{currLabel(trip.baseCurrency)}</Tag>
                    {usedCurrencies.filter(c => c !== trip.baseCurrency).map(c => (
                      <Tag key={c} color={C.amber}>{currLabel(c)}</Tag>
                    ))}
                    {txns.length === 0 && trip.expenses.length > 0 && (
                      <Tag color={C.teal}>✓ Settled</Tag>
                    )}
                    {txns.length > 0 && (
                      <Tag color={C.red}>{txns.length} pending</Tag>
                    )}
                  </div>
                </div>
                <div style={{ color: C.muted, fontSize: 18 }}>›</div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
