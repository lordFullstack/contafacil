import { useEffect, useState, useCallback } from 'react'
import BottomNav from './components/BottomNav'
import Dashboard from './pages/Dashboard'
import Movimientos from './pages/Movimientos'
import Proveedores from './pages/Proveedores'
import { seedIfEmpty, getSettings } from './lib/storage'

export default function App() {
  const [tab, setTab] = useState('dashboard')
  const [refreshKey, setRefreshKey] = useState(0)
  const [settings, setSettings] = useState(getSettings())

  // Datos de ejemplo la primera vez que se abre la app (localStorage vacío)
  useEffect(() => {
    seedIfEmpty()
    setSettings(getSettings())
    setRefreshKey((k) => k + 1)
  }, [])

  const handleDataChanged = useCallback(() => {
    setRefreshKey((k) => k + 1)
  }, [])

  return (
    <div className="mx-auto min-h-screen max-w-md bg-base-950">
      {tab === 'dashboard' && (
        <Dashboard refreshKey={refreshKey} onDataChanged={handleDataChanged} settings={settings} />
      )}
      {tab === 'movimientos' && (
        <Movimientos refreshKey={refreshKey} onDataChanged={handleDataChanged} />
      )}
      {tab === 'proveedores' && (
        <Proveedores refreshKey={refreshKey} onDataChanged={handleDataChanged} />
      )}

      <BottomNav active={tab} onChange={setTab} />
    </div>
  )
}
