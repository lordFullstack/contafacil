import { useEffect, useState, useCallback } from 'react'
import BottomNav from './components/BottomNav'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Movimientos from './pages/Movimientos'
import Proveedores from './pages/Proveedores'
import Clientes from './pages/Clientes'
import { getSettings } from './lib/storage'

export default function App() {
  const [tab, setTab] = useState('dashboard')
  const [refreshKey, setRefreshKey] = useState(0)
  const [settings, setSettings] = useState(getSettings())

  useEffect(() => {
    setSettings(getSettings())
  }, [])

  const handleDataChanged = useCallback(() => {
    setRefreshKey((k) => k + 1)
  }, [])

  return (
    <div className="min-h-screen bg-base-950 md:flex">
      <Sidebar active={tab} onChange={setTab} companyName={settings.companyName} />

      <div className="mx-auto w-full max-w-md md:max-w-4xl md:px-8 md:py-8">
        {tab === 'dashboard' && (
          <Dashboard refreshKey={refreshKey} onDataChanged={handleDataChanged} settings={settings} />
        )}
        {tab === 'movimientos' && (
          <Movimientos refreshKey={refreshKey} onDataChanged={handleDataChanged} />
        )}
        {tab === 'proveedores' && (
          <Proveedores refreshKey={refreshKey} onDataChanged={handleDataChanged} />
        )}
        {tab === 'clientes' && (
          <Clientes refreshKey={refreshKey} onDataChanged={handleDataChanged} />
        )}
      </div>

      <BottomNav active={tab} onChange={setTab} />
    </div>
  )
}
