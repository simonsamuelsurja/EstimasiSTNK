/**
 * Penyiapan isi kartu estimasi untuk klien.
 *
 * Dipisah dari tampilan supaya bisa diuji: yang sampai ke klien adalah bagian
 * paling sensitif dari aplikasi ini, dan kesalahannya tidak bisa ditarik lagi
 * setelah gambarnya terkirim.
 */

import type { HasilEstimasi, KelompokBiaya } from './tipe'

/**
 * Kelompok biaya yang layak ditampilkan ke klien.
 *
 * Baris bernilai nol dibuang: bagi klien itu bukan rincian, melainkan daftar
 * hal yang tidak ditagihkan. Kelompok yang jadi kosong ikut dibuang.
 *
 * Label yang disesuaikan manual TETAP dipakai — memang itu gunanya. Yang tidak
 * ikut hanyalah penanda bahwa baris itu disesuaikan, karena itu urusan staf.
 */
export function kelompokUntukKlien(hasil: HasilEstimasi): KelompokBiaya[] {
  return hasil.kelompok
    .map((k) => ({ ...k, baris: k.baris.filter((b) => b.nilai !== 0) }))
    .filter((k) => k.baris.length > 0)
}

/** Kartu hanya layak dikirim kalau tidak ada harga yang belum lengkap. */
export function kartuLayakDikirim(hasil: HasilEstimasi): boolean {
  return !hasil.peringatan.some((p) => p.tingkat === 'gagal')
}
