// ─────────────────────────────────────────────────────────
// Capa de persistencia local. Toda la app lee/escribe SOLO aquí.
// El día de mañana, migrar a Supabase/Firebase implica reemplazar
// el contenido de estas funciones (mismo "contrato" de entrada/salida),
// sin tocar los componentes que las consumen.
// ─────────────────────────────────────────────────────────

const KEYS = {
  transactions: 'cf_transactions',
  providers: 'cf_providers',
  credits: 'cf_credits',
  customers: 'cf_customers',
  clientCredits: 'cf_client_credits',
  settings: 'cf_settings',
}

// ---------- utilidades base ----------

function read(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : []
  } catch (e) {
    console.error(`Error leyendo ${key} de localStorage`, e)
    return []
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch (e) {
    console.error(`Error escribiendo ${key} en localStorage`, e)
    return false
  }
}

function uid(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

// ---------- Modelo de datos ----------
// Transacción:
// { id, type: 'ingreso' | 'egreso', amount, category, description, date (ISO), providerId? }
//
// Proveedor:
// { id, name, nit, phone, category, createdAt }
//
// Crédito (cuenta por pagar a un proveedor):
// { id, providerId, amount, description, date (ISO), dueDate (ISO)?, status: 'pendiente' | 'pagado' }

// ---------- Transacciones ----------

export function getTransactions() {
  return read(KEYS.transactions).sort((a, b) => new Date(b.date) - new Date(a.date))
}

export function addTransaction({ type, amount, category, description, date, providerId = null }) {
  const list = read(KEYS.transactions)
  const item = {
    id: uid('tx'),
    type, // 'ingreso' | 'egreso'
    amount: Number(amount),
    category: category || (type === 'ingreso' ? 'Ventas' : 'Otro'),
    description: description || '',
    date: date || new Date().toISOString(),
    providerId,
  }
  list.push(item)
  write(KEYS.transactions, list)
  return item
}

export function deleteTransaction(id) {
  const list = read(KEYS.transactions).filter((t) => t.id !== id)
  write(KEYS.transactions, list)
}

// ---------- Proveedores ----------

export function getProviders() {
  return read(KEYS.providers).sort((a, b) => a.name.localeCompare(b.name))
}

export function addProvider({ name, nit, phone, category }) {
  const list = read(KEYS.providers)
  const item = {
    id: uid('prov'),
    name,
    nit: nit || '',
    phone: phone || '',
    category: category || 'General',
    createdAt: new Date().toISOString(),
  }
  list.push(item)
  write(KEYS.providers, list)
  return item
}

export function deleteProvider(id) {
  const list = read(KEYS.providers).filter((p) => p.id !== id)
  write(KEYS.providers, list)
}

// Pago a proveedor = crea una transacción tipo 'egreso' asociada a providerId
export function payProvider({ providerId, amount, description, date }) {
  return addTransaction({
    type: 'egreso',
    amount,
    category: 'Pago a proveedor',
    description,
    date,
    providerId,
  })
}

// ---------- Créditos (cuentas por pagar) ----------

export function getCredits() {
  return read(KEYS.credits).sort((a, b) => new Date(a.dueDate || a.date) - new Date(b.dueDate || b.date))
}

export function addCredit({ providerId, amount, description, date, dueDate }) {
  const list = read(KEYS.credits)
  const item = {
    id: uid('cred'),
    providerId,
    amount: Number(amount),
    description: description || '',
    date: date || new Date().toISOString(),
    dueDate: dueDate || null,
    status: 'pendiente',
  }
  list.push(item)
  write(KEYS.credits, list)
  return item
}

export function markCreditPaid(id) {
  const list = read(KEYS.credits)
  const credit = list.find((c) => c.id === id)
  if (!credit) return null
  credit.status = 'pagado'
  write(KEYS.credits, list)
  // Registrar el pago como egreso real
  payProvider({
    providerId: credit.providerId,
    amount: credit.amount,
    description: `Pago de crédito: ${credit.description}`,
    date: new Date().toISOString(),
  })
  return credit
}

export function deleteCredit(id) {
  const list = read(KEYS.credits).filter((c) => c.id !== id)
  write(KEYS.credits, list)
}

// ---------- Clientes (a quienes LES fiamos — cuentas por cobrar) ----------

export function getCustomers() {
  return read(KEYS.customers).sort((a, b) => a.name.localeCompare(b.name))
}

export function addCustomer({ name, phone, notes }) {
  const list = read(KEYS.customers)
  const item = {
    id: uid('cust'),
    name,
    phone: phone || '',
    notes: notes || '',
    createdAt: new Date().toISOString(),
  }
  list.push(item)
  write(KEYS.customers, list)
  return item
}

export function deleteCustomer(id) {
  const list = read(KEYS.customers).filter((c) => c.id !== id)
  write(KEYS.customers, list)
}

// ---------- Créditos a clientes (cuentas por cobrar) ----------
// Representan dinero que un cliente TE debe (le fiaste una venta).
// A diferencia de los créditos con proveedores, cuando se pagan generan
// un INGRESO real (el cliente te está devolviendo efectivo).

export function getClientCredits() {
  return read(KEYS.clientCredits).sort(
    (a, b) => new Date(a.dueDate || a.date) - new Date(b.dueDate || b.date)
  )
}

export function addClientCredit({ customerId, amount, description, date, dueDate }) {
  const list = read(KEYS.clientCredits)
  const item = {
    id: uid('ccred'),
    customerId,
    amount: Number(amount),
    description: description || '',
    date: date || new Date().toISOString(),
    dueDate: dueDate || null,
    status: 'pendiente',
  }
  list.push(item)
  write(KEYS.clientCredits, list)
  return item
}

export function markClientCreditPaid(id) {
  const list = read(KEYS.clientCredits)
  const credit = list.find((c) => c.id === id)
  if (!credit) return null
  credit.status = 'pagado'
  write(KEYS.clientCredits, list)
  // El cliente paga lo que debía: esto SÍ entra como ingreso real de caja
  addTransaction({
    type: 'ingreso',
    amount: credit.amount,
    category: 'Cobro de crédito',
    description: `Cobro de crédito: ${credit.description}`,
    date: new Date().toISOString(),
  })
  return credit
}

export function deleteClientCredit(id) {
  const list = read(KEYS.clientCredits).filter((c) => c.id !== id)
  write(KEYS.clientCredits, list)
}

// ---------- Cálculos para el Dashboard ----------

// El "saldo en efectivo" es el total de ingresos que han entrado a caja.
// Los gastos se registran y se muestran por separado, para control y reportes,
// pero NUNCA se restan del saldo en efectivo — así es como el cliente maneja su caja.
export function getSummary() {
  const txs = read(KEYS.transactions)
  const ingresos = txs.filter((t) => t.type === 'ingreso').reduce((sum, t) => sum + t.amount, 0)
  const gastos = txs.filter((t) => t.type === 'egreso').reduce((sum, t) => sum + t.amount, 0)
  return {
    ingresos,
    gastos,
    saldo: ingresos,
  }
}

// Resumen del día actual: ingresos, gastos y el TOTAL (suma de ambos),
// útil para cuadre de caja diario — no confundir con "saldo" (que es la resta acumulada).
export function getTodaySummary() {
  const txs = read(KEYS.transactions)
  const todayKey = new Date().toISOString().slice(0, 10)
  const todayTxs = txs.filter((t) => t.date.slice(0, 10) === todayKey)

  const ingresosHoy = todayTxs.filter((t) => t.type === 'ingreso').reduce((s, t) => s + t.amount, 0)
  const gastosHoy = todayTxs.filter((t) => t.type === 'egreso').reduce((s, t) => s + t.amount, 0)

  return {
    ingresosHoy,
    gastosHoy,
    totalHoy: ingresosHoy + gastosHoy,
  }
}

// Agrupa movimientos de los últimos N días para la gráfica (vista "Día")
export function getDailySeries(days = 7) {
  const txs = read(KEYS.transactions)
  const today = new Date()
  const series = []

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    const label = d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })

    const dayTxs = txs.filter((t) => t.date.slice(0, 10) === key)
    const ingresos = dayTxs.filter((t) => t.type === 'ingreso').reduce((s, t) => s + t.amount, 0)
    const gastos = dayTxs.filter((t) => t.type === 'egreso').reduce((s, t) => s + t.amount, 0)

    series.push({ label, ingresos, gastos })
  }
  return series
}

// Agrupa movimientos por mes, últimos N meses (vista "Mes")
export function getMonthlySeries(monthsCount = 6) {
  const txs = read(KEYS.transactions)
  const today = new Date()
  const series = []

  for (let i = monthsCount - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
    const year = d.getFullYear()
    const month = d.getMonth()
    const label = d.toLocaleDateString('es-CO', { month: 'short', year: '2-digit' })

    const monthTxs = txs.filter((t) => {
      const td = new Date(t.date)
      return td.getFullYear() === year && td.getMonth() === month
    })
    const ingresos = monthTxs.filter((t) => t.type === 'ingreso').reduce((s, t) => s + t.amount, 0)
    const gastos = monthTxs.filter((t) => t.type === 'egreso').reduce((s, t) => s + t.amount, 0)

    series.push({ label, ingresos, gastos })
  }
  return series
}

// Agrupa movimientos por año, últimos N años (vista "Año")
export function getYearlySeries(yearsCount = 5) {
  const txs = read(KEYS.transactions)
  const currentYear = new Date().getFullYear()
  const series = []

  for (let i = yearsCount - 1; i >= 0; i--) {
    const year = currentYear - i

    const yearTxs = txs.filter((t) => new Date(t.date).getFullYear() === year)
    const ingresos = yearTxs.filter((t) => t.type === 'ingreso').reduce((s, t) => s + t.amount, 0)
    const gastos = yearTxs.filter((t) => t.type === 'egreso').reduce((s, t) => s + t.amount, 0)

    series.push({ label: String(year), ingresos, gastos })
  }
  return series
}

// ---------- Configuración de empresa (branding) ----------

export function getSettings() {
  const raw = localStorage.getItem(KEYS.settings)
  return raw
    ? JSON.parse(raw)
    : { companyName: 'Mi Empresa', primaryColor: '#E8B34A', secondaryColor: '#1FB6A8' }
}

export function saveSettings(settings) {
  write(KEYS.settings, settings)
}

// ---------- Datos de ejemplo (solo si la app está vacía) ----------

export function seedIfEmpty() {
  if (read(KEYS.transactions).length === 0 && read(KEYS.providers).length === 0) {
    const prov1 = addProvider({ name: 'Distribuidora La 70', nit: '900123456-1', phone: '3001234567', category: 'Insumos' })
    const prov2 = addProvider({ name: 'Papelería Central', nit: '900654321-2', phone: '3109876543', category: 'Oficina' })

    addTransaction({ type: 'ingreso', amount: 1250000, category: 'Ventas', description: 'Venta mostrador', date: new Date().toISOString() })
    addTransaction({ type: 'ingreso', amount: 480000, category: 'Ventas', description: 'Venta a domicilio', date: new Date(Date.now() - 86400000).toISOString() })
    addTransaction({ type: 'egreso', amount: 320000, category: 'Pago a proveedor', description: 'Compra insumos', date: new Date(Date.now() - 86400000).toISOString(), providerId: prov1.id })
    addTransaction({ type: 'egreso', amount: 95000, category: 'Servicios', description: 'Internet y luz', date: new Date(Date.now() - 2 * 86400000).toISOString() })

    addCredit({ providerId: prov2.id, amount: 210000, description: 'Resmas de papel y tóner', date: new Date().toISOString(), dueDate: new Date(Date.now() + 5 * 86400000).toISOString() })
  }
}

// ---------- Backup / Exportación ----------

export function getFullBackup() {
  return {
    exportedAt: new Date().toISOString(),
    transactions: read(KEYS.transactions),
    providers: read(KEYS.providers),
    credits: read(KEYS.credits),
    customers: read(KEYS.customers),
    clientCredits: read(KEYS.clientCredits),
    settings: getSettings(),
  }
}

// Restaura TODOS los datos desde un backup JSON exportado previamente.
// Esto REEMPLAZA por completo lo que haya guardado actualmente en localStorage.
export function restoreFromBackup(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('El archivo no tiene un formato de backup válido.')
  }
  if (Array.isArray(data.transactions)) write(KEYS.transactions, data.transactions)
  if (Array.isArray(data.providers)) write(KEYS.providers, data.providers)
  if (Array.isArray(data.credits)) write(KEYS.credits, data.credits)
  if (Array.isArray(data.customers)) write(KEYS.customers, data.customers)
  if (Array.isArray(data.clientCredits)) write(KEYS.clientCredits, data.clientCredits)
  if (data.settings && typeof data.settings === 'object') write(KEYS.settings, data.settings)
}

// Alias por compatibilidad, en caso de que algún archivo importe con este otro nombre
export const importFullBackup = restoreFromBackup
