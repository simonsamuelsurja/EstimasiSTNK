/**
 * Ekspor daftar harga.
 *
 * Berjalan di atas katalog, jadi berlaku untuk semua tabel harga — termasuk
 * tabel yang ditambahkan nanti, tanpa perlu menyentuh berkas ini lagi.
 */

import type { JenisKolom, Kolom, TabelHarga } from './katalog'

function nilaiUntukEkspor(nilai: unknown, jenis: JenisKolom): string {
  if (nilai === null || nilai === undefined || nilai === '') return ''
  switch (jenis) {
    case 'yatidak':
      return nilai ? 'Ya' : 'Tidak'
    case 'rupiah':
    case 'angka':
      return typeof nilai === 'number' ? String(nilai) : String(nilai)
    default:
      return String(nilai)
  }
}

function selCsv(teks: string): string {
  return /[",\n]/.test(teks) ? `"${teks.replace(/"/g, '""')}"` : teks
}

function barisCsv(nilai: string[]): string {
  return nilai.map(selCsv).join(',')
}

/** Satu tabel jadi CSV. */
export function tabelKeCsv(tabel: TabelHarga): string {
  const baris: string[] = [barisCsv(tabel.kolom.map((k: Kolom) => k.judul))]
  for (const data of tabel.baris) {
    baris.push(
      barisCsv(
        tabel.kolom.map((k) => nilaiUntukEkspor((data as Record<string, unknown>)[k.kunci], k.jenis)),
      ),
    )
  }
  return baris.join('\n') + '\n'
}

/**
 * Seluruh katalog jadi satu berkas CSV bertingkat.
 * Tiap tabel diberi judul dan keterangan supaya berkasnya bisa dibaca sendiri
 * tanpa perlu penjelasan tambahan.
 */
export function katalogKeCsv(katalog: TabelHarga[]): string {
  const bagian: string[] = []
  for (const tabel of katalog) {
    const judul = tabel.belumDipakai
      ? `${tabel.nama} (belum dipakai perhitungan)`
      : tabel.nama
    bagian.push(barisCsv([`== ${judul} ==`]))
    bagian.push(barisCsv([tabel.keterangan]))
    bagian.push(tabelKeCsv(tabel).trimEnd())
    bagian.push('')
  }
  return bagian.join('\n')
}

/** Katalog jadi JSON, untuk cadangan atau pemindahan data. */
export function katalogKeJson(katalog: TabelHarga[]): string {
  const isi = {
    diekspor: new Date().toISOString(),
    tabel: katalog.map((t) => ({
      kode: t.kode,
      nama: t.nama,
      keterangan: t.keterangan,
      belumDipakai: t.belumDipakai ?? false,
      kolom: t.kolom,
      baris: t.baris,
    })),
  }
  return JSON.stringify(isi, null, 2) + '\n'
}

export function namaBerkasEkspor(ekstensi: string, tanggal = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0')
  const cap = `${tanggal.getFullYear()}${p(tanggal.getMonth() + 1)}${p(tanggal.getDate())}`
  return `daftar-harga-surya-jasa-${cap}.${ekstensi}`
}

/** Memicu unduhan di peramban. Tidak dipakai saat pengujian. */
export function unduhTeks(isi: string, namaBerkas: string, tipe: string): void {
  const blob = new Blob([isi], { type: `${tipe};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const tautan = document.createElement('a')
  tautan.href = url
  tautan.download = namaBerkas
  document.body.appendChild(tautan)
  tautan.click()
  document.body.removeChild(tautan)
  URL.revokeObjectURL(url)
}
