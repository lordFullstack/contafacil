// Exportación local usando Blob + URL.createObjectURL.
// No requiere backend: el navegador genera el archivo y lo descarga directamente.

function downloadBlob(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function toCSVValue(value) {
  const str = String(value ?? '')
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export function exportTransactionsToCSV(transactions, providers = []) {
  const providerMap = Object.fromEntries(providers.map((p) => [p.id, p.name]))
  const headers = ['Fecha', 'Tipo', 'Categoría', 'Descripción', 'Proveedor', 'Monto (COP)']

  const rows = transactions.map((t) => [
    new Date(t.date).toLocaleDateString('es-CO'),
    t.type === 'ingreso' ? 'Ingreso' : 'Egreso',
    t.category,
    t.description,
    t.providerId ? providerMap[t.providerId] || '' : '',
    t.amount,
  ])

  const csv = [headers, ...rows].map((row) => row.map(toCSVValue).join(',')).join('\n')
  // \uFEFF: BOM para que Excel abra tildes/ñ correctamente
  downloadBlob('\uFEFF' + csv, `movimientos_${dateStamp()}.csv`, 'text/csv;charset=utf-8;')
}

export function exportJSONBackup(data) {
  const json = JSON.stringify(data, null, 2)
  downloadBlob(json, `backup_contafacil_${dateStamp()}.json`, 'application/json')
}

function dateStamp() {
  return new Date().toISOString().slice(0, 10)
}
