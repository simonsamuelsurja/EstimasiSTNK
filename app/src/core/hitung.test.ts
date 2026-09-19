/**
 * Uji regresi terhadap Excel.
 *
 * Setiap angka yang diharapkan di berkas ini diambil langsung dari
 * `Surya Jasa - Estimasi v2.xlsx`. Kalau ada uji yang gagal, artinya mesin
 * hitung menyimpang dari Excel — bukan sebaliknya. Jangan ubah angka harapan
 * tanpa memastikan dulu perubahannya memang disengaja.
 */

import { describe, expect, it } from 'vitest'
import { hitungBulanTelat, hitungEstimasi, platDariNopol, uraiTanggal } from './hitung'
import { terapkanPenyesuaian } from './manual'
import { petaTarif } from './tarif'
import type { InputEstimasi } from './tipe'

const KOSONG: InputEstimasi = {
  nopol: '',
  tanggalStnk: '',
  jasa: 'Perpanjang',
  kendaraan: 'Mobil',
  kecamatanAsal: '',
  kecamatanTujuan: '',
  gantiKaleng: false,
  pkb: 0,
  swdkllj: 0,
  stnkHilang: false,
  pengurusanJauh: false,
  etle: false,
  matikanNopol: false,
  requestNopol: 'Tidak',
  jarak: 0,
  hotel: 0,
  tolTaksi: 0,
  makan: 0,
  tiketPesawat: 0,
  lokasiJauhAsal: '',
  lokasiJauhTujuan: '',
}

/** Mengambil satu baris biaya dari hasil, berdasarkan kodenya. */
function baris(hasil: ReturnType<typeof hitungEstimasi>, kode: string): number {
  for (const k of hasil.kelompok) {
    const b = k.baris.find((x) => x.kode === kode)
    if (b) return b.nilai
  }
  throw new Error(`Baris tidak ditemukan: ${kode}`)
}

function subtotal(hasil: ReturnType<typeof hitungEstimasi>, kode: string): number {
  const k = hasil.kelompok.find((x) => x.kode === kode)
  if (!k) throw new Error(`Kelompok tidak ditemukan: ${kode}`)
  return k.subtotal
}

// ---------------------------------------------------------------------------

describe('bulan keterlambatan', () => {
  const acuan = (iso: string) => uraiTanggal(iso)!

  it('cocok dengan sheet Rumus Utama: Jun 2024 dilihat Nov 2025 jadi 19', () => {
    // Di Excel ditulis =12+5+2, yaitu 12 bulan + 5 bulan + 2 bulan margin.
    expect(hitungBulanTelat('2024-06-21', acuan('2025-11-15'), 2)).toBe(19)
  })

  it('cocok dengan sheet Hitung Estimasi Otomatis: bulan yang sama jadi 2', () => {
    expect(hitungBulanTelat('2026-09-10', acuan('2026-09-19'), 2)).toBe(2)
  })

  it('mengabaikan tanggal dalam bulan, hanya menghitung bulan', () => {
    expect(hitungBulanTelat('2025-01-01', acuan('2025-03-31'), 0)).toBe(2)
    expect(hitungBulanTelat('2025-01-31', acuan('2025-03-01'), 0)).toBe(2)
  })

  it('tidak pernah negatif walau STNK belum jatuh tempo', () => {
    expect(hitungBulanTelat('2027-01-01', acuan('2026-09-19'), 2)).toBe(0)
  })

  it('menolak tanggal yang tidak sah', () => {
    expect(hitungBulanTelat('bukan tanggal', acuan('2026-09-19'), 2)).toBeNull()
  })
})

describe('plat dari nopol', () => {
  it('mengenali plat yang didukung', () => {
    expect(platDariNopol('B 1769 VOQ')).toBe('B')
    expect(platDariNopol('d 123 xx')).toBe('D')
  })

  it('mengembalikan null untuk plat yang belum didukung', () => {
    expect(platDariNopol('Z 1 ZZ')).toBeNull()
    expect(platDariNopol('')).toBeNull()
  })
})

// ---------------------------------------------------------------------------

describe('Kasus 1 — sheet Rumus Utama: Mutasi Cianjur ke Jakarta', () => {
  const hasil = hitungEstimasi({
    ...KOSONG,
    nopol: 'B 1769 VOQ',
    tanggalStnk: '2024-06-21',
    tanggalAcuan: '2025-11-15',
    jasa: 'Mutasi',
    kendaraan: 'Mobil',
    kecamatanAsal: 'Cianjur',
    kecamatanTujuan: 'Jakarta',
    pkb: 1_967_000,
    swdkllj: 143_000,
    requestNopol: 'Ganjil/Genap',
    hotel: 1_000_000,
    tolTaksi: 1_000_000,
    makan: 1_000_000,
    tiketPesawat: 5_200_000,
  })

  it('menerjemahkan kecamatan jadi Samsat', () => {
    expect(hasil.samsatAsal).toBe('Cianjur')
    expect(hasil.samsatTujuan).toBe('Jakarta')
    expect(hasil.jadetabek).toBe(false)
  })

  it('menghitung keterlambatan seperti Excel', () => {
    expect(hasil.bulanTelat).toBe(19)
    expect(hasil.tahunJr).toBe(2)
  })

  it('menyusun judul seperti sel F4', () => {
    expect(hasil.judul).toBe('Mutasi Cianjur - Jakarta')
  })

  it.each([
    ['skp', 4_617_000],
    ['jr', 486_000],
    ['printSkp', 100_000],
    ['pkb', 1_967_000],
    ['swdkllj', 243_000],
    ['admStnk', 200_000],
    ['tnkb', 100_000],
    ['cekFisik', 450_000],
    ['kertasGesek', 45_000],
    ['bukaBlokir', 150_000],
    ['jasaUtama', 5_750_000],
    ['matikanNopol', 0],
    ['requestNopol', 3_500_000],
    ['admNopol', 2_000_000],
    ['penulisan', 1_500_000],
    ['stnkHilangTambahan', 0],
    ['etle', 0],
    ['transport', 0],
  ])('baris %s sama dengan Excel', (kode, harapan) => {
    expect(baris(hasil, kode as string)).toBe(harapan)
  })

  it.each([
    ['denda', 5_203_000],
    ['pajak', 2_510_000],
    ['jasa', 6_395_000],
    ['nopol', 5_500_000],
    ['lain', 1_500_000],
  ])('subtotal %s sama dengan Excel', (kode, harapan) => {
    expect(subtotal(hasil, kode as string)).toBe(harapan)
  })

  it('total sama dengan Excel', () => {
    expect(hasil.total).toBe(21_108_000)
  })

  it('tidak memunculkan peringatan', () => {
    expect(hasil.peringatan).toEqual([])
  })
})

// ---------------------------------------------------------------------------

describe('Kasus 2 — sheet Hitung Estimasi Otomatis: Perpanjang ACC KTP', () => {
  const hasil = hitungEstimasi({
    ...KOSONG,
    nopol: 'B 1043 VOO',
    tanggalStnk: '2026-09-10',
    tanggalAcuan: '2026-09-19',
    jasa: 'Perpanjang ACC KTP',
    kendaraan: 'Mobil',
    kecamatanAsal: 'Cipondoh',
    kecamatanTujuan: 'Pamulang',
    pkb: 3_142_000,
    swdkllj: 143_000,
  })

  it('memakai Samsat dari kecamatan asal', () => {
    expect(hasil.samsatAsal).toBe('Ciledug')
    expect(hasil.judul).toBe('Perpanjang ACC KTP Ciledug')
  })

  it('tidak kena denda karena keterlambatan di bawah 12 bulan', () => {
    expect(hasil.bulanTelat).toBe(2)
    expect(subtotal(hasil, 'denda')).toBe(0)
  })

  it.each([
    ['pkb', 3_393_000],
    ['swdkllj', 243_000],
    ['admStnk', 0],
    ['tnkb', 0],
    ['cekFisik', 0],
    ['kertasGesek', 0],
    ['bukaBlokir', 0],
    ['jasaUtama', 1_150_000],
  ])('baris %s sama dengan Excel', (kode, harapan) => {
    expect(baris(hasil, kode as string)).toBe(harapan)
  })

  it('total sama dengan Excel', () => {
    expect(subtotal(hasil, 'pajak')).toBe(3_636_000)
    expect(subtotal(hasil, 'jasa')).toBe(1_150_000)
    expect(hasil.total).toBe(4_786_000)
  })
})

// ---------------------------------------------------------------------------

describe('Kasus 3 — sheet Hitung Manual: Mutasi motor dengan penyesuaian', () => {
  const masukan: InputEstimasi = {
    ...KOSONG,
    nopol: 'B 4504 BSW',
    tanggalStnk: '2021-10-05',
    tanggalAcuan: '2026-08-15',
    jasa: 'Mutasi',
    kendaraan: 'Motor',
    kecamatanAsal: 'Jakarta',
    kecamatanTujuan: 'Pasar Kemis',
    pkb: 396_000,
    swdkllj: 35_000,
    jarak: 269,
    tolTaksi: 500_000,
    makan: 600_000,
  }
  const dasar = hitungEstimasi(masukan)

  it('menghitung keterlambatan 60 bulan seperti Excel', () => {
    expect(dasar.bulanTelat).toBe(60)
    expect(dasar.tahunJr).toBe(5)
  })

  it.each([
    ['skp', 2_940_000],
    ['jr', 335_000],
    ['printSkp', 100_000],
    ['pkb', 396_000],
    ['swdkllj', 67_000],
    ['admStnk', 100_000],
    ['tnkb', 60_000],
    ['bukaBlokir', 150_000],
  ])('baris %s yang tidak ditimpa sama dengan Excel', (kode, harapan) => {
    expect(baris(dasar, kode as string)).toBe(harapan)
  })

  it('menghitung cek fisik luar Jadetabek sebelum ditimpa', () => {
    expect(dasar.jadetabek).toBe(false)
    expect(baris(dasar, 'cekFisik')).toBe(450_000)
    expect(baris(dasar, 'kertasGesek')).toBe(45_000)
  })

  it('mengikuti Excel setelah cek fisik, jasa, dan penulisan ditimpa manual', () => {
    const hasil = terapkanPenyesuaian(
      dasar,
      [
        { kode: 'cekFisik', nilai: 200_000 },
        { kode: 'jasaUtama', nilai: 950_000 },
        { kode: 'penulisan', nilai: 0 },
      ],
      petaTarif(),
    )

    // Kertas gesek ikut menyesuaikan tanpa perlu ditimpa terpisah,
    // persis seperti perilaku Excel.
    expect(baris(hasil, 'cekFisik')).toBe(200_000)
    expect(baris(hasil, 'kertasGesek')).toBe(15_000)

    expect(subtotal(hasil, 'denda')).toBe(3_375_000)
    expect(subtotal(hasil, 'pajak')).toBe(623_000)
    expect(subtotal(hasil, 'jasa')).toBe(1_315_000)
    expect(subtotal(hasil, 'nopol')).toBe(0)
    expect(subtotal(hasil, 'lain')).toBe(0)
    expect(hasil.total).toBe(5_313_000)
  })
})

// ---------------------------------------------------------------------------

describe('mode manual', () => {
  const dasar = hitungEstimasi({
    ...KOSONG,
    nopol: 'B 1769 VOQ',
    tanggalStnk: '2024-06-21',
    tanggalAcuan: '2025-11-15',
    jasa: 'Mutasi',
    kendaraan: 'Mobil',
    kecamatanAsal: 'Cianjur',
    kecamatanTujuan: 'Jakarta',
    pkb: 1_967_000,
    swdkllj: 143_000,
  })

  it('bisa mengubah label tanpa mengubah angka', () => {
    const hasil = terapkanPenyesuaian(dasar, [
      { kode: 'jasaUtama', label: 'Jasa Pengurusan Lengkap' },
    ])
    const b = hasil.kelompok.flatMap((k) => k.baris).find((x) => x.kode === 'jasaUtama')!
    expect(b.label).toBe('Jasa Pengurusan Lengkap')
    expect(b.nilai).toBe(baris(dasar, 'jasaUtama'))
    expect(hasil.total).toBe(dasar.total)
    expect(hasil.kodeDitimpa).toEqual([])
  })

  it('bisa mengubah label dan angka sekaligus', () => {
    const hasil = terapkanPenyesuaian(dasar, [
      { kode: 'jasaUtama', label: 'Jasa Khusus Klien', nilai: 4_000_000 },
    ])
    const b = hasil.kelompok.flatMap((k) => k.baris).find((x) => x.kode === 'jasaUtama')!
    expect(b.label).toBe('Jasa Khusus Klien')
    expect(b.nilai).toBe(4_000_000)
    expect(hasil.kodeDitimpa).toContain('jasaUtama')
  })

  it('menyimpan total asli sebagai pembanding', () => {
    const hasil = terapkanPenyesuaian(dasar, [{ kode: 'jasaUtama', nilai: 0 }])
    expect(hasil.totalAsli).toBe(dasar.total)
    expect(hasil.total).toBe(dasar.total - baris(dasar, 'jasaUtama'))
  })
})

// ---------------------------------------------------------------------------

describe('penanganan data yang tidak lengkap', () => {
  it('memperingatkan bila kecamatan tidak ada di daftar', () => {
    const hasil = hitungEstimasi({
      ...KOSONG,
      nopol: 'B 1 AA',
      tanggalStnk: '2025-01-01',
      tanggalAcuan: '2026-09-19',
      jasa: 'Mutasi',
      kecamatanAsal: 'Kecamatan Antah Berantah',
      kecamatanTujuan: 'Jakarta',
      pkb: 1_000_000,
      swdkllj: 100_000,
    })
    expect(hasil.peringatan.some((p) => p.tingkat === 'gagal')).toBe(true)
    expect(hasil.samsatAsal).toBeNull()
  })

  it('memperingatkan bila rute belum punya harga, bukan diam-diam jadi nol', () => {
    // Lembang menunjuk ke Samsat Kab. Bandung Barat, yang terdaftar tapi belum
    // punya satu pun baris harga rute. Di Excel kasus ini menghasilkan #N/A.
    const hasil = hitungEstimasi({
      ...KOSONG,
      nopol: 'B 1 AA',
      tanggalStnk: '2025-01-01',
      tanggalAcuan: '2026-09-19',
      jasa: 'Mutasi',
      kecamatanAsal: 'Lembang',
      kecamatanTujuan: 'Jakarta',
      pkb: 1_000_000,
      swdkllj: 100_000,
    })
    expect(hasil.samsatAsal).toBe('Kab. Bandung Barat')
    expect(hasil.peringatan.some((p) => p.pesan.includes('belum ada di daftar harga'))).toBe(true)
    expect(baris(hasil, 'jasaUtama')).toBe(0)
  })

  it('memperingatkan bila plat belum didukung untuk revisi nopol', () => {
    const hasil = hitungEstimasi({
      ...KOSONG,
      nopol: 'Z 9999 ZZ',
      tanggalStnk: '2025-01-01',
      tanggalAcuan: '2026-09-19',
      jasa: 'Revisi Nopol Ganti Buku',
      kecamatanAsal: 'Jakarta',
      pkb: 1_000_000,
      swdkllj: 100_000,
    })
    expect(hasil.peringatan.some((p) => p.pesan.includes('manual'))).toBe(true)
  })
})

// ---------------------------------------------------------------------------

describe('ketahanan terhadap perubahan tarif', () => {
  const masukan: InputEstimasi = {
    ...KOSONG,
    nopol: 'B 1769 VOQ',
    tanggalStnk: '2024-06-21',
    tanggalAcuan: '2025-11-15',
    jasa: 'Mutasi',
    kendaraan: 'Mobil',
    kecamatanAsal: 'Cianjur',
    kecamatanTujuan: 'Jakarta',
    pkb: 1_967_000,
    swdkllj: 143_000,
  }

  it('kertas gesek tetap terhitung walau tarif cek fisik dinaikkan', () => {
    // Jebakan di Excel: rumusnya mencocokkan angka persis, jadi menaikkan
    // tarif cek fisik membuat kertas gesek jatuh ke nol tanpa ketahuan.
    const tarif = { ...petaTarif(), 'cekFisik.luarJadetabek': 500_000 }
    const hasil = hitungEstimasi(masukan, tarif)
    expect(baris(hasil, 'cekFisik')).toBe(500_000)
    expect(baris(hasil, 'kertasGesek')).toBe(45_000)
  })

  it('TNKB tetap terhitung walau tarif administrasi STNK dinaikkan', () => {
    // Jebakan serupa: di Excel TNKB dicocokkan ke besarnya administrasi STNK.
    const tarif = { ...petaTarif(), 'admStnk.mobil': 250_000 }
    const hasil = hitungEstimasi(masukan, tarif)
    expect(baris(hasil, 'admStnk')).toBe(250_000)
    expect(baris(hasil, 'tnkb')).toBe(100_000)
  })
})

// ---------------------------------------------------------------------------

describe('kecamatan bernama sama di beberapa daerah', () => {
  const dasar = {
    ...KOSONG,
    nopol: 'B 1 AA',
    tanggalStnk: '2025-01-01',
    tanggalAcuan: '2026-09-19',
    jasa: 'Mutasi' as const,
    kecamatanTujuan: 'Jakarta',
    pkb: 1_000_000,
    swdkllj: 100_000,
  }

  it('memakai Samsat yang dipilih staf, bukan yang pertama ditemukan', () => {
    // "Curug" ada di Kelapa Dua, Depok, dan Cinere. Excel selalu mengambil
    // Kelapa Dua karena VLOOKUP berhenti di kecocokan pertama, sehingga dua
    // daerah lain tidak pernah bisa terpilih.
    const kelapaDua = hitungEstimasi({ ...dasar, kecamatanAsal: 'Curug' })
    expect(kelapaDua.samsatAsal).toBe('Kelapa Dua')

    const depok = hitungEstimasi({
      ...dasar,
      kecamatanAsal: 'Curug',
      samsatAsalPilihan: 'Depok',
    })
    expect(depok.samsatAsal).toBe('Depok')

    const cinere = hitungEstimasi({
      ...dasar,
      kecamatanAsal: 'Curug',
      samsatAsalPilihan: 'Cinere',
    })
    expect(cinere.samsatAsal).toBe('Cinere')
  })

  it('memakai Samsat pilihan sampai ke judul dan pencarian harga', () => {
    const cinere = hitungEstimasi({
      ...dasar,
      kecamatanAsal: 'Curug',
      samsatAsalPilihan: 'Cinere',
    })
    expect(cinere.judul).toBe('Mutasi Cinere - Jakarta')
    expect(baris(cinere, 'jasaUtama')).toBeGreaterThan(0)
    expect(cinere.peringatan).toEqual([])
  })

  it('tanpa pilihan staf, mengambil yang pertama seperti VLOOKUP di Excel', () => {
    // Penting untuk uji paralel: selisih dengan Excel tidak boleh datang
    // dari urutan pencarian yang berbeda.
    expect(hitungEstimasi({ ...dasar, kecamatanAsal: 'Curug' }).samsatAsal).toBe('Kelapa Dua')
  })
})
