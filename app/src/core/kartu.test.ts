/**
 * Uji isi kartu estimasi.
 *
 * Kartu ini satu-satunya bagian yang dilihat orang di luar Surya Jasa, dan
 * kekeliruannya tidak bisa ditarik lagi setelah gambarnya terkirim.
 */

import { describe, expect, it } from 'vitest'
import { hitungEstimasi } from './hitung'
import { kartuLayakDikirim, kelompokUntukKlien } from './kartu'
import { terapkanPenyesuaian } from './manual'
import type { InputEstimasi } from './tipe'

const MUTASI: InputEstimasi = {
  nopol: 'B 1769 VOQ',
  tanggalStnk: '2024-06-21',
  tanggalAcuan: '2025-11-15',
  jasa: 'Mutasi',
  kendaraan: 'Mobil',
  kecamatanAsal: 'Cianjur',
  kecamatanTujuan: 'Jakarta',
  gantiKaleng: false,
  pkb: 1_967_000,
  swdkllj: 143_000,
  stnkHilang: false,
  pengurusanJauh: false,
  etle: false,
  matikanNopol: false,
  requestNopol: 'Ganjil/Genap',
  jarak: 0,
  hotel: 0,
  tolTaksi: 0,
  makan: 0,
  tiketPesawat: 0,
  lokasiJauhAsal: '',
  lokasiJauhTujuan: '',
}

const semuaBaris = (k: ReturnType<typeof kelompokUntukKlien>) => k.flatMap((x) => x.baris)

describe('isi kartu untuk klien', () => {
  const dasar = hitungEstimasi(MUTASI)

  it('tidak menampilkan baris bernilai nol', () => {
    // Di rincian staf, baris nol berguna sebagai penjelasan. Di mata klien
    // itu cuma daftar hal yang tidak ditagihkan.
    expect(semuaBaris(dasar.kelompok.map((k) => k)).some((b) => b.nilai === 0)).toBe(true)
    expect(semuaBaris(kelompokUntukKlien(dasar)).every((b) => b.nilai !== 0)).toBe(true)
  })

  it('membuang kelompok yang seluruh barisnya nol', () => {
    const tanpaNopol = hitungEstimasi({ ...MUTASI, requestNopol: 'Tidak', matikanNopol: false })
    expect(tanpaNopol.kelompok.some((k) => k.kode === 'nopol')).toBe(true)
    expect(kelompokUntukKlien(tanpaNopol).some((k) => k.kode === 'nopol')).toBe(false)
  })

  it('jumlah semua baris yang tampil sama dengan total estimasi', () => {
    // Membuang baris nol tidak boleh mengubah angka yang ditagihkan.
    const jumlah = semuaBaris(kelompokUntukKlien(dasar)).reduce((j, b) => j + b.nilai, 0)
    expect(Math.round(jumlah / 1000) * 1000).toBe(dasar.total)
  })

  it('subtotal kelompok tetap utuh walau barisnya disaring', () => {
    for (const k of kelompokUntukKlien(dasar)) {
      const asli = dasar.kelompok.find((x) => x.kode === k.kode)!
      expect(k.subtotal).toBe(asli.subtotal)
    }
  })
})

describe('penyesuaian manual di mata klien', () => {
  const dasar = hitungEstimasi(MUTASI)

  it('memakai label yang diganti, karena memang itu gunanya', () => {
    const hasil = terapkanPenyesuaian(dasar, [
      { kode: 'jasaUtama', label: 'Jasa Pengurusan Lengkap', nilai: 5_000_000 },
    ])
    const baris = semuaBaris(kelompokUntukKlien(hasil)).find((b) => b.kode === 'jasaUtama')
    expect(baris?.label).toBe('Jasa Pengurusan Lengkap')
    expect(baris?.nilai).toBe(5_000_000)
  })

  it('baris yang ditimpa jadi nol ikut hilang dari kartu', () => {
    const hasil = terapkanPenyesuaian(dasar, [{ kode: 'jasaUtama', nilai: 0 }])
    expect(semuaBaris(kelompokUntukKlien(hasil)).some((b) => b.kode === 'jasaUtama')).toBe(false)
  })

  it('total kartu mengikuti angka setelah penyesuaian', () => {
    const hasil = terapkanPenyesuaian(dasar, [{ kode: 'jasaUtama', nilai: 5_000_000 }])
    const jumlah = semuaBaris(kelompokUntukKlien(hasil)).reduce((j, b) => j + b.nilai, 0)
    expect(Math.round(jumlah / 1000) * 1000).toBe(hasil.total)
    expect(hasil.total).toBe(dasar.total - 750_000)
  })
})

describe('kelayakan kartu dikirim', () => {
  it('layak bila semua harga lengkap', () => {
    expect(kartuLayakDikirim(hitungEstimasi(MUTASI))).toBe(true)
  })

  it('tidak layak bila ada harga rute yang belum ada di daftar', () => {
    const hasil = hitungEstimasi({ ...MUTASI, kecamatanAsal: 'Lembang' })
    expect(hasil.peringatan.some((p) => p.tingkat === 'gagal')).toBe(true)
    expect(kartuLayakDikirim(hasil)).toBe(false)
  })

  it('tetap layak bila peringatannya hanya bersifat perhatian', () => {
    const hasil = hitungEstimasi({
      ...MUTASI,
      nopol: 'Z 9999 ZZ',
      jasa: 'Revisi Nopol Ganti Buku',
      kecamatanTujuan: '',
    })
    expect(hasil.peringatan.every((p) => p.tingkat !== 'gagal')).toBe(true)
    expect(kartuLayakDikirim(hasil)).toBe(true)
  })
})
