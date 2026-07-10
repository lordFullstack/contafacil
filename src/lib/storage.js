// ─────────────────────────────────────────────────────────
// Capa de persistencia. Toda la app lee/escribe SOLO aquí.
// Antes usaba localStorage; ahora usa Supabase (base de datos real en la nube),
// así que TODAS las funciones son asíncronas (devuelven promesas).
// ─────────────────────────────────────────────────────────
import { supabase } from './supabaseClient'

function mustNotError(error, context) {
  if (error) {
    console.error(`Error en ${context}:`, error)
    throw new Error(error.message || `Error en ${context}`)
  }
}

// ---------- Mapas fila de BD (snake_case) -> objeto de la app (camelCase) ----------

function mapTransaction(row) {
  return {
    id: row.id,
    type: row.type,
    amount: Number(row.amount),
    category: row.category,
    description: row.description || '',
    date: row.date,
    providerId: row.provider_id,
  }
}

function mapProvider(row) {
  return {
    id: row.id,
    name: row.name,
    nit: row.nit || '',
    phone: row.phone || '',
    category: row.category || 'General',
    createdAt: row.created_at,
  }
}

function mapCredit(row) {
  return {
    id: row.id,
    providerId: row.provider_id,
    amount: Number(row.amount),
    description: row.description || '',
    date: row.date,
    dueDate: row.due_date,
    status: row.status,
  }
}

function mapCustomer(row) {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone || '',
    notes: row.notes || '',
    createdAt: row.created_at,
  }
}

function mapClientCredit(row) {
  return {
    id: row.id,
    customerId: row.customer_id,
    amount: Number(row.amount),
    description: row.description || '',
    date: row.date,
    dueDate: row.due_date,
    status: row.status,
  }
}

// ---------- Transacciones ----------

export async function getTransactions() {
  const { data, error } = await supabase.from('transactions').select('*').order('date', { ascending: false })
  mustNotError(error, 'getTransactions')
  return data.map(mapTransaction)
}

export async function addTransaction({ type, amount, category, description, date, providerId = null }) {
  const { data, error } = await supabase
    .from('transactions')
    .insert({
      type,
      amount: Number(amount),
      category: category || (type === 'ingreso' ? 'Ventas' : 'Otro'),
      description: description || '',
      date: date || new Date().toISOString(),
      provider_id: providerId,
    })
    .select()
    .single()
  mustNotError(error, 'addTransaction')
  return mapTransaction(data)
}

export async function deleteTransaction(id) {
  const { error } = await supabase.from('transactions').delete().eq('id', id)
  mustNotError(error, 'deleteTransaction')
}

// ---------- Proveedores ----------

export async function getProviders() {
  const { data, error } = await supabase.from('providers').select('*').order('name', { ascending: true })
  mustNotError(error, 'getProviders')
  return data.map(mapProvider)
}

export async function addProvider({ name, nit, phone, category }) {
  const { data, error } = await supabase
    .from('providers')
    .insert({ name, nit: nit || '', phone: phone || '', category: category || 'General' })
    .select()
    .single()
  mustNotError(error, 'addProvider')
  return mapProvider(data)
}

export async function deleteProvider(id) {
  const { error } = await supabase.from('providers').delete().eq('id', id)
  mustNotError(error, 'deleteProvider')
}

// Pago a proveedor = crea una transacción tipo 'egreso' asociada a providerId
export async function payProvider({ providerId, amount, description, date }) {
  return addTransaction({
    type: 'egreso',
    amount,
    category: 'Pago a proveedor',
    description,
    date,
    providerId,
  })
}

// ---------- Créditos con proveedores (cuentas por pagar) ----------

export async function getCredits() {
  const { data, error } = await supabase
    .from('provider_credits')
    .select('*')
    .order('due_date', { ascending: true, nullsFirst: false })
  mustNotError(error, 'getCredits')
  return data.map(mapCredit)
}

export async function addCredit({ providerId, amount, description, date, dueDate }) {
  const { data, error } = await supabase
    .from('provider_credits')
    .insert({
      provider_id: providerId,
      amount: Number(amount),
      description: description || '',
      date: date || new Date().toISOString(),
      due_date: dueDate || null,
      status: 'pendiente',
    })
    .select()
    .single()
  mustNotError(error, 'addCredit')
  return mapCredit(data)
}

export async function markCreditPaid(id) {
  const { data: credit, error: fetchError } = await supabase
    .from('provider_credits')
    .select('*')
    .eq('id', id)
    .single()
  mustNotError(fetchError, 'markCreditPaid (fetch)')

  const { error: updateError } = await supabase
    .from('provider_credits')
    .update({ status: 'pagado' })
    .eq('id', id)
  mustNotError(updateError, 'markCreditPaid (update)')

  // El pago del crédito SÍ es un egreso real de caja
  await addTransaction({
    type: 'egreso',
    amount: credit.amount,
    category: 'Pago a proveedor',
    description: `Pago de crédito: ${credit.description}`,
    date: new Date().toISOString(),
    providerId: credit.provider_id,
  })
  return mapCredit(credit)
}

export async function deleteCredit(id) {
  const { error } = await supabase.from('provider_credits').delete().eq('id', id)
  mustNotError(error, 'deleteCredit')
}

// ---------- Clientes (a quienes LES fiamos — cuentas por cobrar) ----------

export async function getCustomers() {
  const { data, error } = await supabase.from('customers').select('*').order('name', { ascending: true })
  mustNotError(error, 'getCustomers')
  return data.map(mapCustomer)
}

export async function addCustomer({ name, phone, notes }) {
  const { data, error } = await supabase
    .from('customers')
    .insert({ name, phone: phone || '', notes: notes || '' })
    .select()
    .single()
  mustNotError(error, 'addCustomer')
  return mapCustomer(data)
}

export async function deleteCustomer(id) {
  const { error } = await supabase.from('customers').delete().eq('id', id)
  mustNotError(error, 'deleteCustomer')
}

// ---------- Créditos a clientes (fiado / cuentas por cobrar) ----------

export async function getClientCredits() {
  const { data, error } = await supabase
    .from('client_credits')
    .select('*')
    .order('due_date', { ascending: true, nullsFirst: false })
  mustNotError(error, 'getClientCredits')
  return data.map(mapClientCredit)
}

export async function addClientCredit({ customerId, amount, description, date, dueDate }) {
  const { data, error } = await supabase
    .from('client_credits')
    .insert({
      customer_id: customerId,
      amount: Number(amount),
      description: description || '',
      date: date || new Date().toISOString(),
      due_date: dueDate || null,
      status: 'pendiente',
    })
    .select()
    .single()
  mustNotError(error, 'addClientCredit')
  return mapClientCredit(data)
}

export async function markClientCreditPaid(id) {
  const { data: credit, error: fetchError } = await supabase
    .from('client_credits')
    .select('*')
    .eq('id', id)
    .single()
  mustNotError(fetchError, 'markClientCreditPaid (fetch)')

  const { error: updateError } = await supabase
    .from('client_credits')
    .update({ status: 'pagado' })
    .eq('id', id)
  mustNotError(updateError, 'markClientCreditPaid (update)')

  // El cliente pagando lo que debía SÍ es un ingreso real de caja
  await addTransaction({
    type: 'ingreso',
    amount: credit.amount,
    category: 'Cobro de crédito',
    description: `Cobro de crédito: ${credit.description}`,
    date: new Date().toISOString(),
  })
  return mapClientCredit(credit)
}

export async function deleteClientCredit(id) {
  const { error } = await supabase.from('client_credits').delete().eq('id', id)
  mustNotError(error, 'deleteClientCredit')
}

// ---------- Cálculos para el Dashboard ----------

// El "saldo en efectivo" es el total de ingresos que han entrado a caja.
// Los gastos se registran y se muestran por separado, para control y reportes,
// pero NUNCA se restan del saldo en efectivo — así es como el cliente maneja su caja.
export async function getSummary() {
  const txs = await getTransactions()
  const ingresos = txs.filter((t) => t.type === 'ingreso').reduce((sum, t) => sum + t.amount, 0)
  const gastos = txs.filter((t) => t.type === 'egreso').reduce((sum, t) => sum + t.amount, 0)
  return {
    ingresos,
    gastos,
    saldo: ingresos,
  }
}

// Resumen del día actual: ingresos, gastos y el TOTAL (suma de ambos),
// útil para cuadre de caja diario — no confundir con "saldo" (que es solo ingresos).
export async function getTodaySummary() {
  const txs = await getTransactions()
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
export async function getDailySeries(days = 7) {
  const txs = await getTransactions()
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
export async function getMonthlySeries(monthsCount = 6) {
  const txs = await getTransactions()
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
export async function getYearlySeries(yearsCount = 5) {
  const txs = await getTransactions()
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

export async function getSettings() {
  const { data, error } = await supabase.from('settings').select('*').eq('id', true).single()
  mustNotError(error, 'getSettings')
  return {
    companyName: data.company_name,
    primaryColor: data.primary_color,
    secondaryColor: data.secondary_color,
  }
}

export async function saveSettings({ companyName, primaryColor, secondaryColor }) {
  const { error } = await supabase
    .from('settings')
    .update({ company_name: companyName, primary_color: primaryColor, secondary_color: secondaryColor })
    .eq('id', true)
  mustNotError(error, 'saveSettings')
}

// ---------- Backup / Exportación / Importación ----------

export async function getFullBackup() {
  const [transactions, providers, credits, customers, clientCredits, settings] = await Promise.all([
    getTransactions(),
    getProviders(),
    getCredits(),
    getCustomers(),
    getClientCredits(),
    getSettings(),
  ])
  return {
    exportedAt: new Date().toISOString(),
    transactions,
    providers,
    credits,
    customers,
    clientCredits,
    settings,
  }
}

// Restaura TODOS los datos desde un backup JSON. Esto REEMPLAZA por completo
// lo que haya en la base de datos actual. Los IDs se regeneran (Supabase asigna
// IDs nuevos), así que también sirve para restaurar backups viejos que venían
// de la versión con localStorage.
export async function restoreFromBackup(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('El archivo no tiene un formato de backup válido.')
  }

  const ALL_ZEROS = '00000000-0000-0000-0000-000000000000'
  await supabase.from('transactions').delete().neq('id', ALL_ZEROS)
  await supabase.from('provider_credits').delete().neq('id', ALL_ZEROS)
  await supabase.from('client_credits').delete().neq('id', ALL_ZEROS)
  await supabase.from('providers').delete().neq('id', ALL_ZEROS)
  await supabase.from('customers').delete().neq('id', ALL_ZEROS)

  const providerIdMap = {}
  const customerIdMap = {}

  if (Array.isArray(data.providers)) {
    for (const p of data.providers) {
      const created = await addProvider({ name: p.name, nit: p.nit, phone: p.phone, category: p.category })
      providerIdMap[p.id] = created.id
    }
  }
  if (Array.isArray(data.customers)) {
    for (const c of data.customers) {
      const created = await addCustomer({ name: c.name, phone: c.phone, notes: c.notes })
      customerIdMap[c.id] = created.id
    }
  }
  if (Array.isArray(data.transactions)) {
    for (const t of data.transactions) {
      await addTransaction({
        type: t.type,
        amount: t.amount,
        category: t.category,
        description: t.description,
        date: t.date,
        providerId: t.providerId ? providerIdMap[t.providerId] || null : null,
      })
    }
  }
  if (Array.isArray(data.credits)) {
    for (const c of data.credits) {
      if (!providerIdMap[c.providerId]) continue
      const created = await addCredit({
        providerId: providerIdMap[c.providerId],
        amount: c.amount,
        description: c.description,
        date: c.date,
        dueDate: c.dueDate,
      })
      if (c.status === 'pagado') {
        await supabase.from('provider_credits').update({ status: 'pagado' }).eq('id', created.id)
      }
    }
  }
  if (Array.isArray(data.clientCredits)) {
    for (const c of data.clientCredits) {
      if (!customerIdMap[c.customerId]) continue
      const created = await addClientCredit({
        customerId: customerIdMap[c.customerId],
        amount: c.amount,
        description: c.description,
        date: c.date,
        dueDate: c.dueDate,
      })
      if (c.status === 'pagado') {
        await supabase.from('client_credits').update({ status: 'pagado' }).eq('id', created.id)
      }
    }
  }
  if (data.settings) {
    await saveSettings(data.settings)
  }
}

// Alias por compatibilidad, en caso de que algún archivo importe con este otro nombre
export const importFullBackup = restoreFromBackup
