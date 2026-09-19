import { describe, expect, it } from 'vitest'
import { daftarRute, daftarSamsat, type BarisRute } from './data'
import {
  barisKosongUntuk,
  ringkasKelengkapan,
  samsatTanpaHarga,
  urutanSamsatBerharga,
} from './lengkapi'
import { ruteGabungan, ruteTerisiPenuh, tarifGabungan, ISIAN_KOSONG } from './simpanan'

const terisi = (dari: string, ke: string): BarisRute => ({
  dari,
  ke,
  bbnMobil: 4_500_000,
  bbnMotor: 3_500_000,
  pindahMobil: 4_000_000,
  pindahMotor: 3_000_000,
})

describe('kelengkapan harga rute', () => {
  it('menemukan Samsat yang belum punya harga sama sekali', () => {
    const kosong = samsatTanpaHarga()
    // Kelimanya bisa dipilih staf lewat kecamatan, tapi belum berharga.
    expect(kosong).toContain('Kab. Bandung Barat')
    expect(kosong).toContain('Cilegon')
    expect(kosong).toContain('Pandeglang')
    expect(kosong).toContain('Tegal')
    expect(kosong).toContain('Kab. Bandung')
  })

  it('tidak menganggap Samsat yang sudah berharga sebagai kosong', () => {
    const kosong = samsatTanpaHarga().map((s) => s.toLowerCase())
    for (const s of ['Jakarta', 'Depok', 'Cianjur', 'Bogor']) {
      expect(kosong).not.toContain(s.toLowerCase())
    }
  })

  it('menyiapkan satu baris untuk tiap Samsat berharga, ditambah wilayahnya sendiri', () => {
    const baris = barisKosongUntuk('Kab. Bandung Barat')
    expect(baris.length).toBe(urutanSamsatBerharga().length + 1)
    // Baris pertama adalah pengurusan di dalam wilayah itu sendiri.
    expect(baris[0]).toMatchObject({ dari: 'Kab. Bandung Barat', ke: 'Kab. Bandung Barat' })
    expect(baris.every((b) => b.dari === 'Kab. Bandung Barat')).toBe(true)
    expect(baris.every((b) => b.bbnMobil === null)).toBe(true)
  })

  it('tidak menyiapkan baris untuk rute yang sudah ada, termasuk arah sebaliknya', () => {
    const dengan = [...daftarRute, terisi('Jakarta', 'Tegal')]
    const baris = barisKosongUntuk('Tegal', dengan)
    const keJakarta = baris.filter((b) => b.ke.toLowerCase() === 'jakarta')
    expect(keJakarta).toEqual([])
  })

  it('Samsat yang sudah dilengkapi hilang dari daftar kosong', () => {
    const baru = barisKosongUntuk('Tegal').map((b) => terisi(b.dari, b.ke))
    const sesudah = samsatTanpaHarga([...daftarRute, ...baru])
    expect(samsatTanpaHarga()).toContain('Tegal')
    expect(sesudah).not.toContain('Tegal')
  })

  it('baris tersisa berkurang persis sebanyak yang diisi', () => {
    // Melengkapi satu Samsat menambah satu tujuan baru bagi Samsat lain yang
    // masih kosong, tapi tambahan itu tepat sebanding dengan baris yang sudah
    // terisi. Jadi angkanya selalu turun, tidak pernah naik.
    const sebelum = ringkasKelengkapan()
    const baru = barisKosongUntuk('Tegal').map((b) => terisi(b.dari, b.ke))
    const sesudah = ringkasKelengkapan([...daftarRute, ...baru])

    expect(sesudah.samsatKosong.length).toBe(sebelum.samsatKosong.length - 1)
    expect(sesudah.totalBarisPerluDiisi).toBe(sebelum.totalBarisPerluDiisi - baru.length)
  })

  it('semua Samsat yang terdaftar tercakup: berharga atau tercatat kosong', () => {
    const berharga = new Set(
      [...daftarRute.map((r) => r.dari), ...daftarRute.map((r) => r.ke)].map((s) =>
        s.toLowerCase(),
      ),
    )
    const kosong = new Set(samsatTanpaHarga().map((s) => s.toLowerCase()))
    for (const s of daftarSamsat) {
      const k = s.samsat.toLowerCase()
      expect(berharga.has(k) || kosong.has(k)).toBe(true)
    }
  })
})

describe('simpanan daftar harga', () => {
  it('isian kosong tidak mengubah apa pun', () => {
    expect(ruteGabungan(ISIAN_KOSONG).length).toBe(daftarRute.length)
    expect(tarifGabungan(ISIAN_KOSONG).find((t) => t.kode === 'admStnk.mobil')?.nilai).toBe(200_000)
  })

  it('baris baru ditambahkan, baris lama dengan rute sama ditimpa', () => {
    const gabung = ruteGabungan({
      tarif: {},
      rute: [terisi('Tegal', 'Jakarta'), { ...terisi('Jakarta', 'Bogor'), bbnMobil: 1 }],
    })
    expect(gabung.length).toBe(daftarRute.length + 1)
    expect(gabung.find((r) => r.dari === 'Jakarta' && r.ke === 'Bogor')?.bbnMobil).toBe(1)
  })

  it('tarif yang diubah menimpa bawaan, sisanya tetap', () => {
    const tarif = tarifGabungan({ tarif: { 'admStnk.mobil': 250_000 }, rute: [] })
    expect(tarif.find((t) => t.kode === 'admStnk.mobil')?.nilai).toBe(250_000)
    expect(tarif.find((t) => t.kode === 'admStnk.motor')?.nilai).toBe(100_000)
  })

  it('hanya menghitung baris yang keempat harganya terisi sebagai selesai', () => {
    const setengah: BarisRute = { ...terisi('Tegal', 'Jakarta'), pindahMotor: null }
    expect(ruteTerisiPenuh([terisi('Tegal', 'Bogor'), setengah]).length).toBe(1)
  })
})
