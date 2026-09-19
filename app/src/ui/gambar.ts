/**
 * Mengubah kartu estimasi jadi berkas gambar.
 *
 * Kartu digambar ulang di luar layar pada ukuran tetap, bukan dipotret dari
 * tampilan kalkulator. Dengan begitu hasilnya sama di semua ukuran HP, dan
 * tidak ikut terbawa tanda-tanda yang hanya berguna untuk staf.
 */

import { toPng } from 'html-to-image'

/** Lebar kartu dalam piksel CSS. Dikali dua saat digambar agar tajam di HP. */
export const LEBAR_KARTU = 720
const KERAPATAN = 2

export interface HasilGambar {
  /** Gambar dalam bentuk data URL, siap ditampilkan maupun diunduh. */
  dataUrl: string
  lebar: number
  tinggi: number
}

export async function buatGambar(simpul: HTMLElement): Promise<HasilGambar> {
  const tinggi = simpul.scrollHeight

  const dataUrl = await toPng(simpul, {
    width: LEBAR_KARTU,
    height: tinggi,
    pixelRatio: KERAPATAN,
    // Kartu selalu berlatar terang, tidak ikut mode gelap perangkat,
    // supaya yang diterima klien selalu sama.
    backgroundColor: '#ffffff',
    style: { margin: '0' },
  })

  return { dataUrl, lebar: LEBAR_KARTU * KERAPATAN, tinggi: tinggi * KERAPATAN }
}

export function namaBerkasGambar(nopol: string, tanggal = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0')
  const cap = `${tanggal.getFullYear()}${p(tanggal.getMonth() + 1)}${p(tanggal.getDate())}`
  const bersih = (nopol || 'estimasi').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return `estimasi-${bersih || 'tanpa-nopol'}-${cap}.png`
}

/**
 * Mencoba mengunduh gambar.
 *
 * Safari di iPhone sering menolak unduhan yang dipicu kode, dan gagalnya
 * diam-diam. Karena itu pemanggil tetap menampilkan gambarnya di layar
 * sebagai jalan kedua: ditekan lama lalu simpan ke galeri.
 */
export function unduhGambar(dataUrl: string, namaBerkas: string): boolean {
  try {
    const tautan = document.createElement('a')
    tautan.href = dataUrl
    tautan.download = namaBerkas
    document.body.appendChild(tautan)
    tautan.click()
    document.body.removeChild(tautan)
    return true
  } catch {
    return false
  }
}

/** Peramban pada iPhone dan iPad, tempat unduhan otomatis sering tidak jalan. */
export function peramban_iOS(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  return /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
}

/** Mengubah data URL jadi Blob, untuk dibagikan lewat menu berbagi bawaan. */
export function dataUrlKeBlob(dataUrl: string): Blob {
  const [kepala, isi] = dataUrl.split(',')
  const tipe = /:(.*?);/.exec(kepala)?.[1] ?? 'image/png'
  const biner = atob(isi)
  const angka = new Uint8Array(biner.length)
  for (let i = 0; i < biner.length; i++) angka[i] = biner.charCodeAt(i)
  return new Blob([angka], { type: tipe })
}

/**
 * Membagikan gambar lewat menu berbagi bawaan perangkat, kalau tersedia.
 * Ini jalur terbaik di HP: langsung ke WhatsApp tanpa mampir ke galeri.
 */
export async function bagikanGambar(dataUrl: string, namaBerkas: string): Promise<boolean> {
  try {
    const berkas = new File([dataUrlKeBlob(dataUrl)], namaBerkas, { type: 'image/png' })
    const bagi = navigator.share as ((data: ShareData) => Promise<void>) | undefined
    const bisa = navigator.canShare as ((data: ShareData) => boolean) | undefined
    if (!bagi || !bisa || !bisa({ files: [berkas] })) return false
    await bagi.call(navigator, { files: [berkas] })
    return true
  } catch {
    // Dibatalkan pengguna atau tidak didukung: jatuh ke unduhan biasa.
    return false
  }
}
