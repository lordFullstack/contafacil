import { useMemo, useRef, useState } from 'react'
import { TrendingUp, TrendingDown, Wallet, Download, FileJson, Upload, Plus, Calculator } from 'lucide-react'
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import StatCard, { formatCOP } from '../components/StatCard'
import TransactionForm from '../components/TransactionForm'
import { getSummary, getTodaySummary, getDailySeries, getTransactions, getProviders, getFullBackup, importFullBackup } from '../lib/storage'
import { exportTransactionsToCSV, exportJSONBackup } from '../lib/export'

export default function Dashboard({ refreshKey, onDataChanged, settings }) {
  const [showForm, setShowForm] = useState(false)
  const fileInputRef = useRef(null)

  const summary = useMemo(() => getSummary(), [refreshKey])
  const today = useMemo(() => getTodaySummary(), [refreshKey])
  const series = useMemo(() => getDailySeries(7), [refreshKey])
  const recent = useMemo(() => getTransactions().slice(0, 5), [refreshKey])
  const providers = useMemo(() => getProviders(), [refreshKey])

  function handleExportCSV() {
    exportTransactionsToCSV(getTransactions(), providers)
  }

  function handleExportJSON() {
    exportJSONBackup(getFullBackup())
  }

  function handleImportClick() {
    fileInputRef.current?.click()
  }

  function handleImportFile(e) {
    const file = e.target.files[0]
    if (!file) return

    const confirmado = window.confirm(
      'Esto reemplazará los datos actuales (ventas, proveedores y créditos) con los del archivo de backup. ¿Deseas continuar?'
    )
    if (!confirmado) {
      e.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result)
        importFullBackup(data)
        onDataChanged()
        alert('Backup importado correctamente.')
      } catch (err) {
        alert(err.message || 'No se pudo importar el archivo.')
      } finally {
        e.target.value = '' // permite volver a subir el mismo archivo si es necesario
      }
    }
    reader.onerror = () => alert('No se pudo leer el archivo.')
    reader.readAsText(file)
  }

  return (
    <div className="pb-28 md:pb-10">
      {/* Encabezado */}
      <header className="px-5 pt-6 pb-4 md:px-0">
        <p className="text-xs font-medium uppercase tracking-widest text-slate-500">
          {settings.companyName}
        </p>
        <h1 className="font-display text-2xl font-bold text-slate-50">Dashboard</h1>
      </header>

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-2 gap-3 px-5 md:grid-cols-4 md:px-0">
        <div className="col-span-2 md:col-span-1">
          <StatCard label="Efectivo en caja" value={summary.saldo} icon={Wallet} tone="neutral" />
        </div>
        <div className="col-span-2 md:col-span-1">
          <StatCard label="Total venta" value={today.totalHoy} icon={Calculator} tone="neutral" />
        </div>
        <StatCard label="Ingresos" value={summary.ingresos} icon={TrendingUp} tone="ingreso" />
        <StatCard label="Gastos" value={summary.gastos} icon={TrendingDown} tone="egreso" />
      </div>

      {/* Gráfica + movimientos recientes: lado a lado en escritorio */}
      <div className="md:grid md:grid-cols-5 md:gap-4 md:px-0">
      <div className="mx-5 mt-4 rounded-2xl border border-base-700 bg-base-900 p-4 shadow-card md:col-span-3 md:mx-0">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
          Últimos 7 días
        </p>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={series} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="ingresoFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2FD98A" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#2FD98A" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="egresoFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FF5D6C" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#FF5D6C" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1D2733" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: '#0D1218', border: '1px solid #1D2733', borderRadius: 12 }}
              labelStyle={{ color: '#94a3b8' }}
              formatter={(value) => formatCOP(value)}
            />
            <Area type="monotone" dataKey="ingresos" stroke="#2FD98A" fill="url(#ingresoFill)" strokeWidth={2} />
            <Area type="monotone" dataKey="gastos" stroke="#FF5D6C" fill="url(#egresoFill)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Movimientos recientes */}
      <div className="mx-5 mt-4 md:col-span-2 md:mx-0">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
          Movimientos recientes
        </p>
        <div className="divide-y divide-base-700 rounded-2xl border border-base-700 bg-base-900 shadow-card">
          {recent.length === 0 && (
            <p className="p-4 text-sm text-slate-500">Aún no hay movimientos registrados.</p>
          )}
          {recent.map((t) => (
            <div key={t.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium text-slate-200">{t.description || t.category}</p>
                <p className="text-xs text-slate-500">
                  {new Date(t.date).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })} · {t.category}
                </p>
              </div>
              <span
                className={`font-mono text-sm font-semibold ${
                  t.type === 'ingreso' ? 'text-ingreso' : 'text-egreso'
                }`}
              >
                {t.type === 'ingreso' ? '+' : '-'}
                {formatCOP(t.amount)}
              </span>
            </div>
          ))}
        </div>
      </div>
      </div>

      {/* Exportar / Importar */}
      <div className="mx-5 mt-4 grid grid-cols-2 gap-3 md:mx-0 md:max-w-sm">
        <button
          onClick={handleExportCSV}
          className="flex items-center justify-center gap-2 rounded-xl border border-base-600 bg-base-800 py-3 text-sm font-medium text-slate-200 active:scale-[0.98]"
        >
          <Download size={16} /> Exportar CSV
        </button>
        <button
          onClick={handleExportJSON}
          className="flex items-center justify-center gap-2 rounded-xl border border-base-600 bg-base-800 py-3 text-sm font-medium text-slate-200 active:scale-[0.98]"
        >
          <FileJson size={16} /> Backup JSON
        </button>
        <button
          onClick={handleImportClick}
          className="col-span-2 flex items-center justify-center gap-2 rounded-xl border border-base-600 bg-base-800 py-3 text-sm font-medium text-slate-200 active:scale-[0.98]"
        >
          <Upload size={16} /> Importar backup
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          onChange={handleImportFile}
          className="hidden"
        />
      </div>

      {/* Botón flotante */}
      <button
        onClick={() => setShowForm(true)}
        className="fixed bottom-24 right-5 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-brand-gold text-base-950 shadow-lg active:scale-95 md:bottom-8"
      >
        <Plus size={26} strokeWidth={2.5} />
      </button>

      {showForm && (
        <TransactionForm
          providers={providers}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false)
            onDataChanged()
          }}
        />
      )}
    </div>
  )
                  }

      
