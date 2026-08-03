import { useState, useEffect } from 'react'
import { loadTrips, saveTrips } from './utils.js'
import TripList    from './components/TripList.jsx'
import TripDetail  from './components/TripDetail.jsx'
import NewTripModal from './components/NewTripModal.jsx'
import { C } from './constants.js'

export default function App() {
  const [trips,    setTrips]    = useState([])
  const [activeId, setActiveId] = useState(null)
  const [showNew,  setShowNew]  = useState(false)
  const [loaded,   setLoaded]   = useState(false)

  useEffect(() => {
    loadTrips().then(data => { setTrips(data); setLoaded(true) })
  }, [])

  useEffect(() => {
    if (loaded) saveTrips(trips)
  }, [trips, loaded])

  function createTrip(trip) {
    setTrips(prev => [...prev, trip])
    setActiveId(trip.id)
    setShowNew(false)
  }

  function updateTrip(updated) {
    setTrips(prev => prev.map(t => t.id === updated.id ? updated : t))
  }

  const activeTrip = trips.find(t => t.id === activeId)

  if (!loaded) return (
    <div style={{
      background: C.bg, minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: C.muted, fontSize: 14,
    }}>
      Loading…
    </div>
  )

  return (
    <div style={{ background: C.bg, minHeight: '100vh', color: C.text }}>
      {showNew && (
        <NewTripModal
          onConfirm={createTrip}
          onCancel={() => setShowNew(false)}
        />
      )}
      {activeTrip ? (
        <TripDetail
          trip={activeTrip}
          onUpdate={updateTrip}
          onBack={() => setActiveId(null)}
        />
      ) : (
        <TripList
          trips={trips}
          onOpen={id => setActiveId(id)}
          onCreate={() => setShowNew(true)}
        />
      )}
    </div>
  )
}
