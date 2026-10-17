import { describe, expect, it } from 'vitest'
import { bacaPenjumlahanRupiah } from './format'

describe('PKB berupa nominal atau penjumlahan', () => {
  it.each([
    ['', 0],
    ['0', 0],
    ['22353000', 22_353_000],
    ['22353000+1034000', 23_387_000],
    ['22.353.000 + 1.034.000', 23_387_000],
    [' 100 + 0 + 200 ', 300],
  ])('membaca %s sebagai %s', (teks, total) => {
    expect(bacaPenjumlahanRupiah(teks)).toBe(total)
  })

  it.each([
    '22353000+', '+1034000', '100++200', '100-200', '100*2', '1.23',
    'abc', '1e6', '100,50', 'Infinity', '9007199254740991+1',
  ])('menolak masukan tidak lengkap atau tidak valid: %s', (teks) => {
    expect(bacaPenjumlahanRupiah(teks)).toBeNull()
  })
})
