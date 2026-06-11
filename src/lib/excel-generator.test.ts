import { describe, it, expect } from 'vitest'
import { evaluateExpression, replaceExpressionsInCell } from './excel-generator'

describe('excel-generator expression parser', () => {
  describe('evaluateExpression', () => {
    const baseDate = new Date('2024-06-15T00:00:00+07:00')

    it('evaluates (ddmmyy)', () => {
      const result = evaluateExpression('ddmmyy', 0, baseDate)
      expect(result).toBe('150624')
    })

    it('evaluates (dd/mm/yyyy)', () => {
      const result = evaluateExpression('dd/mm/yyyy', 0, baseDate)
      expect(result).toBe('15/06/2024')
    })

    it('evaluates ([dd-1]mmyy) — day minus 1', () => {
      const result = evaluateExpression('[dd-1]mmyy', 0, baseDate)
      expect(result).toBe('140624')
    })

    it('evaluates ([dd+1]mmyy) — day plus 1', () => {
      const result = evaluateExpression('[dd+1]mmyy', 0, baseDate)
      expect(result).toBe('160624')
    })

    it('evaluates ([mm+1]ddyyyy) — month plus 1', () => {
      const result = evaluateExpression('[mm+1]ddyyyy', 0, baseDate)
      expect(result).toBe('07152024')
    })

    it('evaluates ([yyyy+1]mmdd) — year plus 1', () => {
      const result = evaluateExpression('[yyyy+1]mmdd', 0, baseDate)
      // tokens: yyyy+1 → 2025, mm → 06, dd → 15
      expect(result).toBe('20250615')
    })

    it('evaluates (R.num) — row index (1-based in app)', () => {
      // In app: rowIndex = dataIdx + 1, so rowIndex=4 means 4th data row
      const result = evaluateExpression('R.num', 4, baseDate)
      expect(result).toBe('04')
    })

    it('evaluates ([R.num-1]) — row index minus 1', () => {
      const result = evaluateExpression('[R.num-1]', 4, baseDate)
      expect(result).toBe('03')
    })

    it('evaluates ([R.num+5]) — row index plus 5', () => {
      const result = evaluateExpression('[R.num+5]', 1, baseDate)
      expect(result).toBe('06')
    })

    it('evaluates mixed literal and tokens: So (dd) thang (mm)', () => {
      const result = evaluateExpression('So (dd) thang (mm)', 0, baseDate)
      expect(result).toBe('So (15) thang (06)')
    })

    it('evaluates complex expression: HD([dd-1]/[mm+1]/yyyy)', () => {
      const result = evaluateExpression('HD([dd-1]/[mm+1]/yyyy)', 0, baseDate)
      expect(result).toBe('HD(14/07/2024)')
    })

    it('pads row number with leading zero', () => {
      const result = evaluateExpression('R.num', 1, baseDate)
      expect(result).toBe('01')
    })

    it('handles year yy format', () => {
      const result = evaluateExpression('ddmmyy', 0, baseDate)
      expect(result).toBe('150624')
    })

    it('handles year yyyy format', () => {
      const result = evaluateExpression('ddmmyyyy', 0, baseDate)
      expect(result).toBe('15062024')
    })
  })

  describe('replaceExpressionsInCell', () => {
    const baseDate = new Date('2024-06-15T00:00:00+07:00')

    it('replaces expression in cell value', () => {
      const result = replaceExpressionsInCell('(ddmmyy)', 0, baseDate)
      expect(result).toBe('150624')
    })

    it('replaces multiple expressions in one cell', () => {
      const result = replaceExpressionsInCell('(dd)-(mm)-(yyyy)', 0, baseDate)
      expect(result).toBe('15-06-2024')
    })

    it('keeps text outside parentheses unchanged', () => {
      const result = replaceExpressionsInCell('Ngay (dd) thang (mm) nam (yyyy)', 0, baseDate)
      expect(result).toBe('Ngay 15 thang 06 nam 2024')
    })

    it('does not replace text without parentheses', () => {
      const result = replaceExpressionsInCell('ddmmyy', 0, baseDate)
      expect(result).toBe('ddmmyy')
    })

    it('handles row number expression', () => {
      // rowIndex=9 means 9th data row in app (1-based)
      const result = replaceExpressionsInCell('STT: (R.num)', 9, baseDate)
      expect(result).toBe('STT: 09')
    })

    it('handles empty string', () => {
      const result = replaceExpressionsInCell('', 0, baseDate)
      expect(result).toBe('')
    })

    it('handles string with no expressions', () => {
      const result = replaceExpressionsInCell('Hello World', 0, baseDate)
      expect(result).toBe('Hello World')
    })
  })
})
