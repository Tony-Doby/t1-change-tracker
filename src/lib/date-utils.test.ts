import { describe, it, expect } from 'vitest'
import { formatDate, formatDateTime, formatTime } from './date-utils'

describe('date-utils', () => {
  describe('formatDate', () => {
    it('returns "—" for null', () => {
      expect(formatDate(null)).toBe('—')
    })

    it('returns "—" for undefined', () => {
      expect(formatDate(undefined)).toBe('—')
    })

    it('formats ISO string to dd/mm/yyyy', () => {
      // 2024-06-15T00:00:00+07:00 → 15/06/2024
      const result = formatDate('2024-06-15T00:00:00+07:00')
      expect(result).toBe('15/06/2024')
    })

    it('formats Date object to dd/mm/yyyy', () => {
      const d = new Date('2024-12-25T00:00:00+07:00')
      expect(formatDate(d)).toBe('25/12/2024')
    })
  })

  describe('formatDateTime', () => {
    it('returns "—" for null', () => {
      expect(formatDateTime(null)).toBe('—')
    })

    it('formats ISO string to dd/mm/yyyy HH:mm', () => {
      const result = formatDateTime('2024-06-15T14:30:00+07:00')
      // vi-VN format: HH:mm dd/mm/yyyy (dấu phẩy đã được replace bằng space)
      expect(result).toMatch(/14:30\s+15\/06\/2024/)
    })
  })

  describe('formatTime', () => {
    it('returns "—" for null', () => {
      expect(formatTime(null)).toBe('—')
    })

    it('formats ISO string to HH:mm', () => {
      const result = formatTime('2024-06-15T09:05:00+07:00')
      expect(result).toBe('09:05')
    })
  })
})
