/**
 * Pencari lubang di daftar harga.
 *
 * Tabel harga rute berbentuk matriks segitiga: tiap pasangan Samsat cukup
 * ditulis sekali, karena pencarian harga berlaku dua arah. Berkas ini
 * menghitung pasangan mana yang belum punya harga, dan menyiapkan barisnya
 * supaya tinggal diisi.
 */

import { daftarRute, daftarSamsat, type BarisRute } from './data'

const kunci = (s: string) => s.trim().toLowerCase()

/** Urutan Samsat mengikuti tabel yang sudah ada, supaya bentuknya konsisten. */
export function urutanSamsatBerharga(ruteSekarang: BarisRute[] = daftarRute): string[] {
  const urut: string[] = []
  for (const r of ruteSekarang) {
    if (!urut.some((s) => kunci(s) === kunci(r.dari))) urut.push(r.dari)
  }
  return urut
}

/** Samsat yang terdaftar tapi belum punya satu pun harga rute. */
export function samsatTanpaHarga(ruteSekarang: BarisRute[] = daftarRute): string[] {
  const berharga = new Set<string>()
  for (const r of ruteSekarang) {
    berharga.add(kunci(r.dari))
    berharga.add(kunci(r.ke))
  }
  return daftarSamsat.map((s) => s.samsat).filter((s) => !berharga.has(kunci(s)))
}

const adaRute = (a: string, b: string, rute: BarisRute[]) =>
  rute.some(
    (r) =>
      (kunci(r.dari) === kunci(a) && kunci(r.ke) === kunci(b)) ||
      (kunci(r.dari) === kunci(b) && kunci(r.ke) === kunci(a)),
  )

/**
 * Baris kosong yang perlu diisi supaya satu Samsat punya harga ke semua
 * Samsat lain yang sudah berharga, termasuk ke dirinya sendiri (pengurusan
 * di dalam wilayah yang sama).
 */
export function barisKosongUntuk(samsat: string, ruteSekarang: BarisRute[] = daftarRute): BarisRute[] {
  const tujuan = [samsat, ...urutanSamsatBerharga(ruteSekarang)]
  const hasil: BarisRute[] = []
  const sudah = new Set<string>()

  for (const t of tujuan) {
    const pasangan = kunci(t)
    if (sudah.has(pasangan)) continue
    sudah.add(pasangan)
    if (adaRute(samsat, t, ruteSekarang)) continue
    hasil.push({
      dari: samsat,
      ke: t,
      bbnMobil: null,
      bbnMotor: null,
      pindahMobil: null,
      pindahMotor: null,
    })
  }
  return hasil
}

/** Baris yang sudah ada tapi ada kolom harganya masih kosong. */
export function barisSetengahTerisi(ruteSekarang: BarisRute[] = daftarRute): BarisRute[] {
  return ruteSekarang.filter(
    (r) =>
      r.bbnMobil === null || r.bbnMotor === null || r.pindahMobil === null || r.pindahMotor === null,
  )
}

export interface RingkasanKelengkapan {
  samsatKosong: string[]
  /** Perkiraan jumlah baris yang perlu diisi bila semua Samsat dilengkapi. */
  totalBarisPerluDiisi: number
  barisSetengah: number
}

export function ringkasKelengkapan(ruteSekarang: BarisRute[] = daftarRute): RingkasanKelengkapan {
  const kosong = samsatTanpaHarga(ruteSekarang)
  // Setiap Samsat yang dilengkapi menambah tujuan bagi Samsat berikutnya,
  // jadi dihitung berurutan agar angkanya jujur.
  let berjalan = [...ruteSekarang]
  let total = 0
  for (const s of kosong) {
    const baris = barisKosongUntuk(s, berjalan)
    total += baris.length
    berjalan = [...berjalan, ...baris]
  }
  return {
    samsatKosong: kosong,
    totalBarisPerluDiisi: total,
    barisSetengah: barisSetengahTerisi(ruteSekarang).length,
  }
}
