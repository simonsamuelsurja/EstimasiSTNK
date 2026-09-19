/**
 * Kartu estimasi yang dikirim ke klien.
 *
 * Ini satu-satunya bagian aplikasi yang dilihat orang luar, jadi diperlakukan
 * sebagai hasil kerja tersendiri: lebarnya tetap, warnanya selalu terang, dan
 * tanda-tanda yang hanya berguna untuk staf tidak ikut tergambar.
 *
 * Warna ditulis langsung, tidak memakai peubah tema, supaya kartu yang
 * diterima klien selalu sama walau staf memakai mode gelap.
 */

import { forwardRef } from 'react'
import { kelompokUntukKlien } from '../core/kartu'
import type { HasilDenganPenyesuaian } from '../core/tipe'
import { rupiah, tanggalPanjang } from './format'
import { LEBAR_KARTU } from './gambar'

const NAMA_BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

function tanggalHariIniPanjang(): string {
  const k = new Date()
  return `${k.getDate()} ${NAMA_BULAN[k.getMonth()]} ${k.getFullYear()}`
}

export const KartuEstimasi = forwardRef<HTMLDivElement, { hasil: HasilDenganPenyesuaian }>(
  function KartuEstimasi({ hasil }, ref) {
    const kelompok = kelompokUntukKlien(hasil)

    return (
      <div className="kg" ref={ref} style={{ width: LEBAR_KARTU }}>
        <div className="kg-kepala">
          <div className="kg-merek">Surya Jasa</div>
          <div className="kg-tajuk">Estimasi Biaya Pengurusan</div>
        </div>

        <div className="kg-ringkas">
          <div className="kg-nopol">{hasil.nopol || 'Nopol belum diisi'}</div>
          <div className="kg-jasa">{hasil.judul}</div>
          <div className="kg-fakta">
            <span>
              <b>Jatuh tempo STNK</b>
              {tanggalPanjang(hasil.tanggalStnk)}
            </span>
            <span>
              <b>Keterlambatan</b>
              {hasil.bulanTelat} bulan
            </span>
          </div>
        </div>

        <div className="kg-rincian">
          {kelompok.map((k) => (
            <div className="kg-kelompok" key={k.kode}>
              <div className="kg-kelompok-kepala">
                <span>{k.judul}</span>
                <span>{rupiah(k.subtotal)}</span>
              </div>
              {k.baris.map((b) => (
                <div className="kg-baris" key={b.kode}>
                  <span className="kg-baris-label">{b.label}</span>
                  <span className="kg-titik" />
                  <span className="kg-baris-nilai">{rupiah(b.nilai)}</span>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="kg-total">
          <span>Total Estimasi</span>
          <span className="kg-total-nilai">{rupiah(hasil.total)}</span>
        </div>

        <div className="kg-kaki">
          <span>Dibuat {tanggalHariIniPanjang()}</span>
          <span>
            Angka di atas adalah perkiraan. Biaya akhir dapat berbeda mengikuti ketentuan Samsat
            yang berlaku saat pengurusan.
          </span>
        </div>
      </div>
    )
  },
)
