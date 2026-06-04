import XLSX from 'xlsx'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function readExcel(filePath) {
  const wb = XLSX.readFile(filePath)
  const sheetName = wb.SheetNames[0]
  const ws = wb.Sheets[sheetName]
  const json = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
  return json
}

const files = [
  '../docs/Test/Hợp Đồng Nguyên Tắc Template.xlsx',
  '../docs/Test/ung-vien-hop-dong.xlsx',
  '../docs/Test/ung-vien-hop-dong-20260603-2235.xlsx',
  '../docs/Test/hop_ong_nguyen_tac_template_260604_1018.xlsx',
]

files.forEach((f, idx) => {
  const fullPath = path.join(__dirname, f)
  console.log(`\n========== FILE ${idx + 1}: ${path.basename(f)} ==========`)
  try {
    const data = readExcel(fullPath)
    data.forEach((row, rIdx) => {
      console.log(`Row ${rIdx + 1}:`, JSON.stringify(row))
    })
  } catch (e) {
    console.log('ERROR:', e.message)
  }
})
