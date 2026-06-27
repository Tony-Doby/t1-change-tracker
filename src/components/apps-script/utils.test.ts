import { describe, it, expect } from 'vitest'
import { extractDriveId, parseList } from './utils'

describe('extractDriveId', () => {
  it('returns plain ID if already an ID', () => {
    const id = '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms'
    expect(extractDriveId(id)).toBe(id)
  })

  it('extracts ID from folder URL', () => {
    const url = 'https://drive.google.com/drive/folders/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms'
    expect(extractDriveId(url)).toBe('1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms')
  })

  it('extracts ID from file URL', () => {
    const url = 'https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/view'
    expect(extractDriveId(url)).toBe('1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms')
  })

  it('extracts ID from open?id= URL', () => {
    const url = 'https://drive.google.com/open?id=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms'
    expect(extractDriveId(url)).toBe('1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms')
  })

  it('trims whitespace before parsing', () => {
    const url = '  https://drive.google.com/drive/folders/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms  '
    expect(extractDriveId(url)).toBe('1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms')
  })

  it('returns empty string for empty input', () => {
    expect(extractDriveId('')).toBe('')
  })

  it('returns trimmed input when no pattern matches', () => {
    expect(extractDriveId('not-a-valid-url')).toBe('not-a-valid-url')
  })
})

describe('parseList', () => {
  it('splits by newline', () => {
    expect(parseList('a\nb\nc')).toEqual(['a', 'b', 'c'])
  })

  it('splits by comma', () => {
    expect(parseList('a,b,c')).toEqual(['a', 'b', 'c'])
  })

  it('splits by semicolon', () => {
    expect(parseList('a;b;c')).toEqual(['a', 'b', 'c'])
  })

  it('trims and filters empty entries', () => {
    expect(parseList(' a ,  , b , ')).toEqual(['a', 'b'])
  })

  it('returns empty array for empty input', () => {
    expect(parseList('')).toEqual([])
  })
})
