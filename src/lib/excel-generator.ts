import type * as XLSXType from 'xlsx'

// ─────────────────────────────────────────────────────────────
// Expression parser for template cells
// Supports: (ddmmyy), ([dd-1]mmyy), (R.num), ([R.num-1]), (dd/mm/yyyy), etc.
// ─────────────────────────────────────────────────────────────

const EXPR_GROUP_REGEX = /\(([^)]+)\)/g
const TOKEN_SPLIT_REGEX = /(\[?(?:yyyy|yy|mm|dd|R\.num)(?:[+-]\d+)?\]?)/g

interface ExprToken {
  kind: 'date' | 'row' | 'literal'
  value?: string          // for literal
  token?: string          // 'dd' | 'mm' | 'yy' | 'yyyy' | 'R.num'
  offset?: number         // for date/row offset
}

function parseExpression(expr: string): ExprToken[] {
  const parts = expr.split(TOKEN_SPLIT_REGEX).filter((s) => s !== '')
  return parts.map((part) => {
    const m = part.match(/^\[?(R\.num|dd|mm|yy|yyyy)([+-]\d+)?\]?$/)
    if (!m) return { kind: 'literal' as const, value: part }

    const token = m[1]
    const offset = m[2] ? parseInt(m[2], 10) : 0
    if (token === 'R.num') {
      return { kind: 'row' as const, token, offset }
    }
    return { kind: 'date' as const, token, offset }
  })
}

function applyDateOffset(date: Date, token: string, offset: number): void {
  if (offset === 0) return
  const d = new Date(date)
  if (token === 'dd') {
    d.setDate(d.getDate() + offset)
    date.setTime(d.getTime())
  } else if (token === 'mm') {
    d.setMonth(d.getMonth() + offset)
    date.setTime(d.getTime())
  } else if (token === 'yy' || token === 'yyyy') {
    d.setFullYear(d.getFullYear() + offset)
    date.setTime(d.getTime())
  }
}

function formatDateToken(token: string, date: Date): string {
  const options: Intl.DateTimeFormatOptions = { timeZone: 'Asia/Ho_Chi_Minh' }
  if (token === 'dd') options.day = '2-digit'
  else if (token === 'mm') options.month = '2-digit'
  else if (token === 'yy' || token === 'yyyy') options.year = 'numeric'

  const parts = new Intl.DateTimeFormat('vi-VN', options).formatToParts(date)
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''

  if (token === 'dd') return get('day').padStart(2, '0')
  if (token === 'mm') return get('month').padStart(2, '0')
  if (token === 'yy') return get('year').slice(-2).padStart(2, '0')
  if (token === 'yyyy') return get('year')
  return ''
}

export function evaluateExpression(expr: string, rowIndex: number, baseDate: Date): string {
  const tokens = parseExpression(expr)

  // Compute working date by applying all date offsets once
  const workingDate = new Date(baseDate)
  for (const t of tokens) {
    if (t.kind === 'date' && t.offset) {
      applyDateOffset(workingDate, t.token!, t.offset)
    }
  }

  return tokens
    .map((t) => {
      if (t.kind === 'literal') return t.value!
      if (t.kind === 'row') {
        const val = rowIndex + (t.offset || 0)
        return String(val).padStart(2, '0')
      }
      // date
      return formatDateToken(t.token!, workingDate)
    })
    .join('')
}

export function replaceExpressionsInCell(
  cellValue: string,
  rowIndex: number,
  baseDate: Date
): string {
  return cellValue.replace(EXPR_GROUP_REGEX, (_match, expr) => {
    return evaluateExpression(expr, rowIndex, baseDate)
  })
}

function isExpressionOnly(cellValue: string): boolean {
  return /^\([^)]+\)$/.test(cellValue.trim())
}

function getDataValue(dataRow: Record<string, string>, key: string): string | undefined {
  if (dataRow[key] !== undefined) return dataRow[key]
  const lower = key.toLowerCase()
  for (const [k, v] of Object.entries(dataRow)) {
    if (k.toLowerCase() === lower) return v
  }
  return undefined
}

const FIELD_REF_REGEX = /\{\{([^}]+)\}\}/g

export function replaceFieldReferences(
  cellValue: string,
  dataRow: Record<string, string>,
  mapping: ColumnMapping
): string {
  // Build normalized mapping for case-insensitive field reference lookup
  const normalizedMapping = new Map<string, FieldMappingValue>()
  Object.entries(mapping).forEach(([k, v]) => normalizedMapping.set(k.toLowerCase(), v))

  return cellValue.replace(FIELD_REF_REGEX, (_match, fieldName) => {
    const mapped = normalizedMapping.get(fieldName.trim().toLowerCase())
    if (!mapped) return _match
    let val: string
    if (mapped.type === 'column') {
      const dataVal = getDataValue(dataRow, mapped.value)
      val = dataVal !== undefined ? dataVal : _match
    } else {
      val = mapped.value
    }
    if (mapped.uppercase && val) {
      val = val.toUpperCase()
    }
    return val
  })
}

// ─────────────────────────────────────────────────────────────
// Workbook helpers
// ─────────────────────────────────────────────────────────────

export async function loadXlsx(): Promise<typeof XLSXType> {
  return await import('xlsx')
}

export function detectFields(
  workbook: XLSXType.WorkBook,
  headerRowIndex: number,
  XLSX: typeof XLSXType
): string[] {
  const sheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[sheetName]
  const json = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1, defval: '' })
  if (headerRowIndex < 0 || headerRowIndex >= json.length) return []
  const row = json[headerRowIndex] as unknown[]
  return row.map((cell) => String(cell ?? '').trim())
}

// ─────────────────────────────────────────────────────────────
// CSV raw-text parser (preserves leading zeros, exact dates)
// ─────────────────────────────────────────────────────────────

function parseCsvLine(line: string): string[] {
  const cells: string[] = []
  let cell = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cell += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      cells.push(cell)
      cell = ''
    } else {
      cell += char
    }
  }
  cells.push(cell)
  return cells
}

function parseCsvText(text: string): string[][] {
  const lines: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
      current += char
    } else if (char === '\n' && !inQuotes) {
      lines.push(current)
      current = ''
    } else {
      current += char
    }
  }
  if (current.length > 0 || lines.length === 0) {
    lines.push(current)
  }

  return lines.map((line) => {
    const clean = line.endsWith('\r') ? line.slice(0, -1) : line
    return parseCsvLine(clean)
  })
}

export function readCsvFile(
  csvText: string,
  headerRowIndex: number
): { headers: string[]; rows: Record<string, string>[] } {
  const json = parseCsvText(csvText)

  if (json.length === 0 || headerRowIndex < 0 || headerRowIndex >= json.length) {
    return { headers: [], rows: [] }
  }

  const headers = json[headerRowIndex].map((h) => h.trim())
  const rows: Record<string, string>[] = []

  for (let i = headerRowIndex + 1; i < json.length; i++) {
    const raw = json[i]
    const row: Record<string, string> = {}
    headers.forEach((h, idx) => {
      row[h] = raw[idx] !== undefined ? raw[idx] : ''
    })
    rows.push(row)
  }

  return { headers, rows }
}

// ─────────────────────────────────────────────────────────────
// XLSX read with date handling
// ─────────────────────────────────────────────────────────────

export function parseDateFromInput(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function formatDateDDMMYYYY(date: Date): string {
  const parts = new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Asia/Ho_Chi_Minh',
  }).formatToParts(date)
  const d = parts.find((p) => p.type === 'day')?.value ?? ''
  const m = parts.find((p) => p.type === 'month')?.value ?? ''
  const y = parts.find((p) => p.type === 'year')?.value ?? ''
  return `${d}/${m}/${y}`
}

function isDateFormatted(w: string | undefined): boolean {
  if (!w) return false
  return /^\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}$/.test(w.trim())
}

function excelSerialToDate(serial: number): Date {
  const epoch = new Date(Date.UTC(1899, 11, 30))
  return new Date(epoch.getTime() + serial * 86400000)
}

export function readDataFile(
  workbook: XLSXType.WorkBook,
  headerRowIndex: number,
  XLSX: typeof XLSXType
): { headers: string[]; rows: Record<string, string>[] } {
  const sheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[sheetName]
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')

  // Read headers from the specified row
  const headers: string[] = []
  for (let c = range.s.c; c <= range.e.c; c++) {
    const cell = worksheet[XLSX.utils.encode_cell({ r: headerRowIndex, c })]
    headers.push(cell ? String(cell.v ?? cell.w ?? '').trim() : '')
  }

  const rows: Record<string, string>[] = []
  for (let r = headerRowIndex + 1; r <= range.e.r; r++) {
    const row: Record<string, string> = {}
    for (let c = 0; c < headers.length; c++) {
      const h = headers[c]
      const cellRef = XLSX.utils.encode_cell({ r, c })
      const cell = worksheet[cellRef]
      if (!cell) {
        row[h] = ''
      } else if (cell.t === 'n' && isDateFormatted(cell.w)) {
        // Excel serial date: compute from serial to avoid SheetJS timezone shift
        row[h] = formatDateDDMMYYYY(excelSerialToDate(cell.v as number))
      } else {
        row[h] = String(cell.v ?? cell.w ?? '')
      }
    }
    rows.push(row)
  }

  return { headers, rows }
}

// ─────────────────────────────────────────────────────────────
// Mapping types
// ─────────────────────────────────────────────────────────────

export interface FieldMappingValue {
  type: 'column' | 'fixed'
  value: string
  uppercase?: boolean
}

export type ColumnMapping = Record<string, FieldMappingValue>

// ─────────────────────────────────────────────────────────────
// Generate
// ─────────────────────────────────────────────────────────────

export function generateWorkbook(
  templateWorkbook: XLSXType.WorkBook,
  dataRows: Record<string, string>[],
  mapping: ColumnMapping,
  templateHeaderRow: number,
  XLSX: typeof XLSXType,
  baseDate = new Date()
): XLSXType.WorkBook {
  const sheetName = templateWorkbook.SheetNames[0]
  const worksheet = templateWorkbook.Sheets[sheetName]
  const json = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1, defval: '' })

  if (templateHeaderRow < 0 || templateHeaderRow >= json.length || dataRows.length === 0) {
    // Return original if invalid
    const newWb = XLSX.utils.book_new()
    const newWs = XLSX.utils.aoa_to_sheet(json)
    if (worksheet['!cols']) newWs['!cols'] = worksheet['!cols']
    XLSX.utils.book_append_sheet(newWb, newWs, sheetName)
    return newWb
  }

  // Case-insensitive mapping lookup
  const normalizedMapping = new Map<string, FieldMappingValue>()
  Object.entries(mapping).forEach(([k, v]) => normalizedMapping.set(k.toLowerCase(), v))

  const templateRow = json[templateHeaderRow] as unknown[]
  const outputRows: unknown[][] = []

  // Add all rows before header row
  for (let i = 0; i < templateHeaderRow; i++) {
    outputRows.push(json[i] as unknown[])
  }

  // Keep the header row itself in output
  outputRows.push(json[templateHeaderRow] as unknown[])

  // Add data rows after header
  for (let dataIdx = 0; dataIdx < dataRows.length; dataIdx++) {
    const dataRow = dataRows[dataIdx]
    const rowIndex = dataIdx + 1 // 1-based for R.num
    const replacedRow = templateRow.map((cell, colIdx) => {
      const str = String(cell ?? '')

      // 1. Evaluate expressions first
      let value = replaceExpressionsInCell(str, rowIndex, baseDate)

      // 2. Replace inline field references {{Field}}
      value = replaceFieldReferences(value, dataRow, mapping)

      // 3. Apply direct mapping if this column is mapped (skip for expression-only cells)
      const fieldName = String(templateRow[colIdx] ?? '').trim()
      const mapped = normalizedMapping.get(fieldName.toLowerCase())
      if (mapped && !isExpressionOnly(str)) {
        if (mapped.type === 'column') {
          const dataVal = getDataValue(dataRow, mapped.value)
          value = dataVal !== undefined ? dataVal : value
        } else if (mapped.type === 'fixed') {
          value = mapped.value
          value = replaceFieldReferences(value, dataRow, mapping)
        }
        if (mapped.uppercase && value) {
          value = value.toUpperCase()
        }
      }

      // Re-evaluate expressions on final value (for expressions in mapped fixed values)
      value = replaceExpressionsInCell(value, rowIndex, baseDate)

      return value
    })
    outputRows.push(replacedRow)
  }

  // Add all rows after header row
  for (let i = templateHeaderRow + 1; i < json.length; i++) {
    outputRows.push(json[i] as unknown[])
  }

  const newWs = XLSX.utils.aoa_to_sheet(outputRows)
  if (worksheet['!cols']) {
    newWs['!cols'] = worksheet['!cols']
  }

  const newWb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(newWb, newWs, sheetName)
  return newWb
}

// ─────────────────────────────────────────────────────────────
// Preview
// ─────────────────────────────────────────────────────────────

export interface PreviewRow {
  [key: string]: string | number | null
}

export interface MatchStatus {
  field: string
  type: 'column' | 'fixed'
  value: string
  matched: boolean
}

export function buildPreview(
  templateWorkbook: XLSXType.WorkBook,
  dataRows: Record<string, string>[],
  mapping: ColumnMapping,
  templateHeaderRow: number,
  XLSX: typeof XLSXType,
  limit?: number,
  baseDate = new Date()
): { headers: string[]; rows: PreviewRow[]; matched: MatchStatus[] } {
  const fields = detectFields(templateWorkbook, templateHeaderRow, XLSX)

  // Case-insensitive mapping lookup
  const normalizedMapping = new Map<string, FieldMappingValue>()
  Object.entries(mapping).forEach(([k, v]) => normalizedMapping.set(k.toLowerCase(), v))

  const matched: MatchStatus[] = fields.map((f) => {
    const m = normalizedMapping.get(f.toLowerCase())
    if (!m) return { field: f, type: 'fixed', value: '', matched: false }
    return { field: f, type: m.type, value: m.value, matched: true }
  })

  const previewRows = limit ? dataRows.slice(0, limit) : dataRows

  const sheetName = templateWorkbook.SheetNames[0]
  const worksheet = templateWorkbook.Sheets[sheetName]
  const json = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1, defval: '' })

  if (templateHeaderRow < 0 || templateHeaderRow >= json.length) {
    return { headers: fields, rows: previewRows, matched }
  }

  const templateRow = json[templateHeaderRow] as unknown[]

  const rows: PreviewRow[] = previewRows.map((dataRow, dataIdx) => {
    const rowIndex = dataIdx + 1
    const obj: PreviewRow = {}
    templateRow.forEach((cell, colIdx) => {
      const fieldName = String(templateRow[colIdx] ?? '').trim()
      const cellStr = String(cell ?? '')
      let value = replaceExpressionsInCell(cellStr, rowIndex, baseDate)

      // Replace inline field references {{Field}}
      value = replaceFieldReferences(value, dataRow, mapping)

      if (!isExpressionOnly(cellStr)) {
        const mapped = normalizedMapping.get(fieldName.toLowerCase())
        if (mapped) {
          if (mapped.type === 'column') {
            const dataVal = getDataValue(dataRow, mapped.value)
            value = dataVal !== undefined ? dataVal : value
          } else if (mapped.type === 'fixed') {
            value = mapped.value
            value = replaceFieldReferences(value, dataRow, mapping)
          }
          if (mapped.uppercase && value) {
            value = value.toUpperCase()
          }
        }
      }

      // Re-evaluate expressions on final value (for expressions in mapped fixed values)
      value = replaceExpressionsInCell(value, rowIndex, baseDate)

      obj[fieldName || `Cột ${colIdx + 1}`] = value
    })
    return obj
  })

  return { headers: fields, rows, matched }
}

// ─────────────────────────────────────────────────────────────
// File name formatting
// ─────────────────────────────────────────────────────────────

export function sanitizeFileName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_]/g, '')
    .toLowerCase()
}

export function formatGenerateFileName(templateName: string): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const yy = pad(now.getFullYear() % 100)
  const mm = pad(now.getMonth() + 1)
  const dd = pad(now.getDate())
  const hh = pad(now.getHours())
  const min = pad(now.getMinutes())
  return `${sanitizeFileName(templateName)}_${yy}${mm}${dd}_${hh}${min}.xlsx`
}
