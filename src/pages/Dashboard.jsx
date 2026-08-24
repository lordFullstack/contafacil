import { useEffect, useRef, useState } from 'react'
import { TrendingUp, TrendingDown, Wallet, Download, FileJson, Upload, Plus, HandCoins, CreditCard, Eye, EyeOff } from 'lucide-react'
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import StatCard, { formatCOP } from '../components/StatCard'
import TransactionForm from '../components/TransactionForm'
import ConfirmDialog from '../components/ConfirmDialog'
import {
  getSummary,
  getTodaySummary,
  getPendingTotals,
  getDailySeries,
  getMonthlySeries,
  getYearlySeries,
  getTransactions,
  getProviders,
  getFullBackup,
  restoreFromBackup,
} from '../lib/storage'
import { exportTransactionsToCSV, exportJSONBackup } from '../lib/export'

export default function Dashboard({ refreshKey, onDataChanged, settings }) {
  const [showForm, setShowForm] = useState(false)
  const [pendingImport, setPendingImport] = useState(null)
  const [importError, setImportError] = useState('')
  const [period, setPeriod] = useState('dia') // 'dia' | 'mes' | 'anio'
  const [dayRange, setDayRange] = useState(7) // 7 | 15 | 30, solo aplica cuando period === 'dia'
  const [valuesHidden, setValuesHidden] = useState(
    () => localStorage.getItem('cf_dashboard_hidden') === '1'
  )
  const fileInputRef = useRef(null)

  function toggleValuesHidden() {
    setValuesHidden((prev) => {
      const next = !prev
      localStorage.setItem('cf_dashboard_hidden', next ? '1' : '0')
      return next
    })
  }

  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState({ ingresos: 0, gastos: 0, saldo: 0 })
  const [today, setToday] = useState({ ingresosHoy: 0, gastosHoy: 0, netoHoy: 0 })
  const [pending, setPending] = useState({ porCobrar: 0, porPagar: 0 })
  const [series, setSeries] = useState([])
  const [recent, setRecent] = useState([])
  const [providers, setProviders] = useState([])

  const chartTitle =
    period === 'mes'
      ? 'Últimos 6 meses'
      : period === 'anio'
      ? 'Últimos 5 años'
      : `Últimos ${dayRange} días`

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    const seriesPromise =
      period === 'mes' ? getMonthlySeries(6) : period === 'anio' ? getYearlySeries(5) : getDailySeries(dayRange)

    Promise.all([getSummary(), getTodaySummary(), getPendingTotals(), seriesPromise, getTransactions(), getProviders()])
      .then(([s, t, p, ser, txs, provs]) => {
        if (cancelled) return
        setSummary(s)
        setToday(t)
        setPending(p)
        setSeries(ser)
        setRecent(txs.slice(0, 5))
        setProviders(provs)
      })
      .catch((err) => console.error('Error cargando el dashboard:', err))
      .finally(() => !cancelled && setLoading(false))

    return () => {
      cancelled = true
    }
  }, [refreshKey, period, dayRange])

  async function handleExportCSV() {
    const [txs, provs] = await Promise.all([getTransactions(), getProviders()])
    exportTransactionsToCSV(txs, provs)
  }

  async function handleExportJSON() {
    exportJSONBackup(await getFullBackup())
  }

  function handleImportClick() {
    setImportError('')
    fileInputRef.current?.click()
  }

  function handleFileSelected(e) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result)
        setPendingImport(parsed)
      } catch (err) {
        setImportError('El archivo no es un JSON válido de backup.')
      }
    }
    reader.onerror = () => setImportError('No se pudo leer el archivo.')
    reader.readAsText(file)
    e.target.value = ''
  }

  async function confirmImport() {
    try {
      await restoreFromBackup(pendingImport)
      setPendingImport(null)
      onDataChanged()
    } catch (err) {
      setImportError(err.message || 'No se pudo restaurar el backup.')
      setPendingImport(null)
    }
  }

  return (
    <div className="pb-28 md:pb-10">
      {/* Encabezado */}
      <header className="flex items-start justify-between px-5 pt-6 pb-4 md:px-0">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-slate-600">
            {settings.companyName}
          </p>
          <h1 className="font-display text-2xl font-bold text-slate-900">Dashboard</h1>
        </div>
        <button
          onClick={toggleValuesHidden}
          className="mt-1 flex items-center gap-1.5 rounded-full border border-base-600 px-3 py-1.5 text-xs font-medium text-slate-500 active:scale-[0.98]"
          title={valuesHidden ? 'Mostrar montos' : 'Ocultar montos'}
        >
          {valuesHidden ? <EyeOff size={14} /> : <Eye size={14} />}
          {valuesHidden ? 'Ocultos' : 'Visibles'}
        </button>
      </header>

      {loading && (
        <p className="px-5 text-sm text-slate-600 md:px-0">Cargando datos...</p>
      )}

      {/* Saldo en caja: la cifra principal, sin ambigüedad — ingresos menos egresos */}
      <div className="px-5 md:px-0">
        <div className="rounded-2xl border border-base-700 bg-base-900 p-4 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Saldo en caja</span>
            <Wallet size={16} className="text-brand-primary" strokeWidth={2} />
          </div>
          <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-brand-primary">
            {valuesHidden ? '••••••' : formatCOP(summary.saldo)}
          </p>
          <p className="mt-1 text-xs text-slate-600">
            Hoy: <span className="text-ingreso">+{valuesHidden ? '•••' : formatCOP(today.ingresosHoy)}</span>
            {' · '}
            <span className="text-egreso">-{valuesHidden ? '•••' : formatCOP(today.gastosHoy)}</span>
          </p>
          <div className="mt-3 flex items-center justify-between border-t border-base-700 pt-3">
            <span className="text-xs text-slate-500">
              Disponible para retirar
              <span className="block text-[11px] text-slate-400">saldo menos lo que debes (arriendo, servicios, proveedores)</span>
            </span>
            <span className="font-mono text-sm font-semibold text-ingreso">
              {valuesHidden ? '••••••' : formatCOP(summary.saldo - pending.porPagar)}
            </span>
          </div>
        </div>
      </div>

      {/* Cuadre de caja de hoy: la misma cuenta que harías a mano —
          lo gastado + lo que quedó = lo que vendiste hoy */}
      <div className="px-5 pt-3 md:px-0">
        <div className="rounded-2xl border border-base-700 bg-base-900 p-4 shadow-card">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Cuadre de hoy</p>
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-slate-500">Gastado hoy</span>
            <span className="font-mono font-semibold text-egreso">
              {valuesHidden ? '••••••' : formatCOP(today.gastosHoy)}
            </span>
          </div>
          <div className="mt-1.5 flex items-center justify-between text-sm">
            <span className="text-slate-500">Te quedó</span>
            <span className="font-mono font-semibold text-ingreso">
              {valuesHidden ? '••••••' : formatCOP(today.netoHoy)}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-base-700 pt-2 text-sm">
            <span className="font-medium text-slate-700">Total del día</span>
            <span className="font-mono text-base font-bold text-brand-primary">
              {valuesHidden ? '••••••' : formatCOP(today.ingresosHoy)}
            </span>
          </div>
        </div>
      </div>

      {/* Ingresos y egresos del histórico completo */}
      <div className="grid grid-cols-2 gap-3 px-5 pt-3 md:px-0">
        <StatCard label="Ingresos" value={summary.ingresos} icon={TrendingUp} tone="ingreso" hidden={valuesHidden} />
        <StatCard label="Gastos" value={summary.gastos} icon={TrendingDown} tone="egreso" hidden={valuesHidden} />
      </div>

      {/* Por cobrar / por pagar: dinero que NO está en caja todavía, aparte a propósito */}
      <div className="grid grid-cols-2 gap-3 px-5 pt-3 md:px-0">
        <StatCard label="Por cobrar (fiado)" value={pending.porCobrar} icon={HandCoins} tone="ingreso" hidden={valuesHidden} />
        <StatCard label="Por pagar (crédito)" value={pending.porPagar} icon={CreditCard} tone="egreso" hidden={valuesHidden} />
      </div>

      {/* Gráfica + movimientos recientes: lado a lado en escritorio */}
      <div className="md:grid md:grid-cols-5 md:gap-4 md:px-0">
      <div className="mx-5 mt-4 rounded-2xl border border-base-700 bg-base-900 p-4 shadow-card md:col-span-3 md:mx-0">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{chartTitle}</p>
          <div className="flex items-center gap-2">
            {period === 'dia' && (
              <div className="flex gap-1 rounded-lg bg-base-800 p-0.5">
                {[7, 15, 30].map((n) => (
                  <button
                    key={n}
                    onClick={() => setDayRange(n)}
                    className={`rounded-md px-2 py-1 text-xs font-semibold transition-colors ${
                      dayRange === n ? 'bg-brand-secondary text-base-950' : 'text-slate-500'
                    }`}
                  >
                    {n}d
                  </button>
                ))}
              </div>
            )}
            <div className="flex gap-1 rounded-lg bg-base-800 p-0.5">
              {[
                { id: 'dia', label: 'Día' },
                { id: 'mes', label: 'Mes' },
                { id: 'anio', label: 'Año' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setPeriod(opt.id)}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                    period === opt.id ? 'bg-brand-primary text-base-950' : 'text-slate-500'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={series} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="ingresoFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#32E993" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#32E993" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="egresoFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FF5D6C" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#FF5D6C" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E4E7EC" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              interval={period === 'dia' && dayRange > 7 ? Math.ceil(dayRange / 6) - 1 : 0}
            />
            <Tooltip
              contentStyle={{ background: '#FFFFFF', border: '1px solid #E4E7EC', borderRadius: 12, boxShadow: '0 8px 24px -12px rgba(0,0,0,0.15)' }}
              labelStyle={{ color: '#334155' }}
              formatter={(value) => formatCOP(value)}
            />
            <Area type="monotone" dataKey="ingresos" stroke="#32E993" fill="url(#ingresoFill)" strokeWidth={2} />
            <Area type="monotone" dataKey="gastos" stroke="#FF5D6C" fill="url(#egresoFill)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Movimientos recientes */}
      <div className="mx-5 mt-4 md:col-span-2 md:mx-0">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
          Movimientos recientes
        </p>
        <div className="divide-y divide-base-700 rounded-2xl border border-base-700 bg-base-900 shadow-card">
          {recent.length === 0 && (
            <p className="p-4 text-sm text-slate-600">Aún no hay movimientos registrados.</p>
          )}
          {recent.map((t) => (
            <div key={t.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium text-slate-700">{t.description || t.category}</p>
                <p className="text-xs text-slate-600">
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
          className="flex items-center justify-center gap-2 rounded-xl border border-base-600 bg-base-800 py-3 text-sm font-medium text-slate-700 active:scale-[0.98]"
        >
          <Download size={16} /> Exportar CSV
        </button>
        <button
          onClick={handleExportJSON}
          className="flex items-center justify-center gap-2 rounded-xl border border-base-600 bg-base-800 py-3 text-sm font-medium text-slate-700 active:scale-[0.98]"
        >
          <FileJson size={16} /> Backup JSON
        </button>
        <button
          onClick={handleImportClick}
          className="col-span-2 flex items-center justify-center gap-2 rounded-xl border border-dashed border-base-600 py-3 text-sm font-medium text-slate-500 active:scale-[0.98]"
        >
          <Upload size={16} /> Importar backup (JSON)
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          onChange={handleFileSelected}
          className="hidden"
        />
        {importError && (
          <p className="col-span-2 text-xs text-egreso">{importError}</p>
        )}
      </div>

      {/* Botón flotante */}
      <button
        onClick={() => setShowForm(true)}
        className="fixed bottom-24 right-5 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-secondary to-brand-primary text-base-950 shadow-lg active:scale-95 md:bottom-8"
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

      {pendingImport && (
        <ConfirmDialog
          title="Restaurar backup"
          message={
            `Vas a reemplazar TODOS los datos actuales (movimientos, proveedores, clientes y créditos) con el contenido de este archivo` +
            (pendingImport.exportedAt
              ? ` (exportado el ${new Date(pendingImport.exportedAt).toLocaleDateString('es-CO')}).`
              : '.') +
            `\n\nEsta acción no se puede deshacer. ¿Confirmas?`
          }
          confirmLabel="Sí, restaurar"
          cancelLabel="Cancelar"
          tone="egreso"
          onConfirm={confirmImport}
          onCancel={() => setPendingImport(null)}
        />
      )}
    </div>
  )
                                                                 }
