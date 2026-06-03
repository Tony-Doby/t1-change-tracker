import type * as XLSXType from 'xlsx'

const PLACEHOLDER_REGEX = /\{\{([^}]+)\}\}/g

export interface PlaceholderMatch {
  placeholder: string
  key: string
  matched: boolean
}

export interface PreviewRow {
  [key: string]: string | number | null
}

export async function loadXlsx(): Promise<typeof XLSXType> {
  return await import('xlsx')
}

export function detectPlaceholders(workbook: XLSXType.WorkBook, XLSX: typeof XLSXType): string[] {
  const sheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[sheetName]
  const json = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1, defval: '' })

  const found = new Set<string>()
  for (const row of json) {
    const rowArr = row as unknown[]
    for (const cell of rowArr) {
      const str = String(cell ?? '')
      let match: RegExpExecArray | null
      while ((match = PLACEHOLDER_REGEX.exec(str)) !== null) {
        found.add(match[1].trim())
      }
      PLACEHOLDER_REGEX.lastIndex = 0
    }
  }
  return Array.from(found)
}

export function readDataFile(workbook: XLSXType.WorkBook, XLSX: typeof XLSXType): { headers: string[]; rows: Record<string, string>[] } {
  const sheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[sheetName]
  const json = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1, defval: '' })

  if (json.length === 0) return { headers: [], rows: [] }

  const headers = (json[0] as unknown[]).map((h) => String(h).trim())
  const rows: Record<string, string>[] = []

  for (let i = 1; i < json.length; i++) {
    const raw = json[i] as unknown[]
    const row: Record<string, string> = {}
    headers.forEach((h, idx) => {
      row[h] = raw[idx] !== undefined ? String(raw[idx]) : ''
    })
    rows.push(row)
  }

  return { headers, rows }
}

export function getTemplateRowIndex(workbook: XLSXType.WorkBook, XLSX: typeof XLSXType): number | null {
  const sheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[sheetName]
  const json = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1, defval: '' })

  for (let i = 0; i < json.length; i++) {
    const row = json[i] as unknown[]
    for (const cell of row) {
      if (PLACEHOLDER_REGEX.test(String(cell ?? ''))) {
        PLACEHOLDER_REGEX.lastIndex = 0
        return i
      }
      PLACEHOLDER_REGEX.lastIndex = 0
    }
  }
  return null
}

export function replacePlaceholdersInRow(
  row: unknown[],
  dataRow: Record<string, string>
): unknown[] {
  return row.map((cell) => {
    const str = String(cell ?? '')
    if (!str.includes('{{')) return cell
    return str.replace(PLACEHOLDER_REGEX, (_match, key) => {
      const trimmed = key.trim()
      return dataRow[trimmed] !== undefined ? dataRow[trimmed] : _match
    })
  })
}

export function generateWorkbook(
  templateWorkbook: XLSXType.WorkBook,
  dataRows: Record<string, string>[],
  XLSX: typeof XLSXType
): XLSXType.WorkBook {
  const sheetName = templateWorkbook.SheetNames[0]
  const worksheet = templateWorkbook.Sheets[sheetName]
  const json = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1, defval: '' })

  const templateRowIndex = getTemplateRowIndex(templateWorkbook, XLSX)
  if (templateRowIndex === null) {
    // No placeholder found, return original
    return templateWorkbook
  }

  const templateRow = json[templateRowIndex] as unknown[]
  const outputRows: unknown[][] = []

  // Add all rows before template row
  for (let i = 0; i < templateRowIndex; i++) {
    outputRows.push(json[i] as unknown[])
  }

  // Add replicated template rows
  for (const dataRow of dataRows) {
    outputRows.push(replacePlaceholdersInRow(templateRow, dataRow))
  }

  // Add all rows after template row
  for (let i = templateRowIndex + 1; i < json.length; i++) {
    outputRows.push(json[i] as unknown[])
  }

  const newWs = XLSX.utils.aoa_to_sheet(outputRows)
  // Copy column widths if available
  if (worksheet['!cols']) {
    newWs['!cols'] = worksheet['!cols']
  }

  const newWb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(newWb, newWs, sheetName)
  return newWb
}

export function buildPreview(
  templateWorkbook: XLSXType.WorkBook,
  dataRows: Record<string, string>[],
  dataHeaders: string[],
  XLSX: typeof XLSXType,
  limit = 10
): { headers: string[]; rows: PreviewRow[]; matched: PlaceholderMatch[] } {
  const templatePlaceholders = detectPlaceholders(templateWorkbook, XLSX)
  const dataHeaderSet = new Set(dataHeaders.map((h) => h.trim()))

  const matched: PlaceholderMatch[] = templatePlaceholders.map((p) => ({
    placeholder: `{{${p}}}`,
    key: p,
    matched: dataHeaderSet.has(p),
  }))

  const previewRows = dataRows.slice(0, limit)
  const templateRowIndex = getTemplateRowIndex(templateWorkbook, XLSX)

  if (templateRowIndex === null) {
    return { headers: dataHeaders, rows: previewRows, matched }
  }

  const sheetName = templateWorkbook.SheetNames[0]
  const worksheet = templateWorkbook.Sheets[sheetName]
  const json = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1, defval: '' })
  const templateRow = json[templateRowIndex] as unknown[]

  const headers = templateRow.map((h) => String(h ?? ''))
  const rows: PreviewRow[] = previewRows.map((dataRow) => {
    const replaced = replacePlaceholdersInRow(templateRow, dataRow)
    const obj: PreviewRow = {}
    headers.forEach((h, idx) => {
      obj[h] = replaced[idx] as string | number | null
    })
    return obj
  })

  return { headers, rows, matched }
}

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
