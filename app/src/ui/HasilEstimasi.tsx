/**
 * Tampilan rincian estimasi.
 *
 * Setiap baris bisa diketuk untuk disesuaikan — nilai maupun labelnya.
 * Baris yang sudah disesuaikan ditandai jelas, supaya staf tidak salah kira
 * itu angka hasil hitungan.
 */

import { useState } from 'react'
import type {
  BarisBiaya,
  HasilDenganPenyesuaian,
  PenyesuaianManual,
} from '../core/tipe'
import { Kartu, Lembar, Peringatan } from './dasar'
import { angkaRupiah, bacaAngka, rupiah, tanggalPanjang } from './format'

export function HasilEstimasi({
  hasil,
  penyesuaian,
  onUbahPenyesuaian,
}: {
  hasil: HasilDenganPenyesuaian
  penyesuaian: PenyesuaianManual[]
  onUbahPenyesuaian: (p: PenyesuaianManual[]) => void
}) {
  const [sedangDiubah, setSedangDiubah] = useState<BarisBiaya | null>(null)

  const simpan = (baru: PenyesuaianManual) => {
    const lain = penyesuaian.filter((p) => p.kode !== baru.kode)
    const kosong = baru.nilai === undefined && !baru.label?.trim()
    onUbahPenyesuaian(kosong ? lain : [...lain, baru])
    setSedangDiubah(null)
  }

  const hapus = (kode: string) => {
    onUbahPenyesuaian(penyesuaian.filter((p) => p.kode !== kode))
    setSedangDiubah(null)
  }

  const gagal = hasil.peringatan.filter((p) => p.tingkat === 'gagal')
  const perhatian = hasil.peringatan.filter((p) => p.tingkat !== 'gagal')

  return (
    <>
      {gagal.map((p, i) => (
        <Peringatan key={`g${i}`} tingkat="gagal">
          <span>
            <b>Perlu dilengkapi.</b> {p.pesan}
          </span>
        </Peringatan>
      ))}
      {perhatian.map((p, i) => (
        <Peringatan key={`p${i}`} tingkat="perhatian">
          <span>{p.pesan}</span>
        </Peringatan>
      ))}

      <Kartu judul="Rincian Estimasi">
        <div className="baris-isian">
          <span className="label-isian">{hasil.judul}</span>
          <span className="petunjuk">
            {hasil.nopol || 'Nopol belum diisi'} · STNK {tanggalPanjang(hasil.tanggalStnk)} ·{' '}
            {hasil.bulanTelat} bulan terlambat
          </span>
        </div>
      </Kartu>

      <section className="kartu">
        {hasil.kelompok.map((kelompok) => (
          <div className="kelompok-hasil" key={kelompok.kode}>
            <div className="kelompok-kepala">
              <span className="kelompok-nama">{kelompok.judul}</span>
              <span className="kelompok-subtotal">{rupiah(kelompok.subtotal)}</span>
            </div>
            {kelompok.baris.map((baris) => {
              const ditimpa = hasil.kodeDitimpa.includes(baris.kode)
              return (
                <button
                  key={baris.kode}
                  type="button"
                  className="baris-biaya"
                  data-nol={baris.nilai === 0 && !ditimpa ? 'ya' : 'tidak'}
                  data-timpa={ditimpa ? 'ya' : 'tidak'}
                  onClick={() => setSedangDiubah(baris)}
                >
                  <span className="baris-biaya-nama">
                    <span className="baris-biaya-label">{baris.label}</span>
                    {baris.rincian && (
                      <span className="baris-biaya-rincian">{baris.rincian}</span>
                    )}
                  </span>
                  {ditimpa && <span className="tanda-timpa">DIUBAH</span>}
                  <span className="baris-biaya-nilai">{rupiah(baris.nilai)}</span>
                </button>
              )
            })}
          </div>
        ))}
      </section>

      {hasil.kodeDitimpa.length > 0 && (
        <p className="catatan-kaki">
          {hasil.kodeDitimpa.length} baris disesuaikan manual. Estimasi tanpa penyesuaian:{' '}
          {rupiah(hasil.totalAsli)}.{' '}
          <button type="button" className="tombol-teks" onClick={() => onUbahPenyesuaian([])}>
            Kembalikan semua
          </button>
        </p>
      )}

      {sedangDiubah && (
        <UbahBaris
          baris={sedangDiubah}
          penyesuaian={penyesuaian.find((p) => p.kode === sedangDiubah.kode)}
          onSimpan={simpan}
          onHapus={() => hapus(sedangDiubah.kode)}
          onTutup={() => setSedangDiubah(null)}
        />
      )}
    </>
  )
}

// ---------------------------------------------------------------------------

function UbahBaris({
  baris,
  penyesuaian,
  onSimpan,
  onHapus,
  onTutup,
}: {
  baris: BarisBiaya
  penyesuaian?: PenyesuaianManual
  onSimpan: (p: PenyesuaianManual) => void
  onHapus: () => void
  onTutup: () => void
}) {
  const [label, setLabel] = useState(penyesuaian?.label ?? baris.label)
  const [teksNilai, setTeksNilai] = useState(angkaRupiah(baris.nilai))

  const nilaiBaru = bacaAngka(teksNilai)
  const adaPenyesuaian = !!penyesuaian

  return (
    <Lembar
      judul="Sesuaikan Baris"
      onTutup={onTutup}
      kaki={
        <>
          {adaPenyesuaian && (
            <button type="button" className="tombol tombol-kedua" onClick={onHapus}>
              Kembalikan
            </button>
          )}
          <button
            type="button"
            className="tombol tombol-utama"
            onClick={() =>
              onSimpan({
                kode: baris.kode,
                label: label.trim() === baris.label ? undefined : label.trim(),
                nilai: nilaiBaru,
              })
            }
          >
            Simpan
          </button>
        </>
      }
    >
      <div className="baris-isian">
        <span className="label-isian">Nama biaya</span>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          aria-label="Nama biaya"
        />
        <span className="petunjuk">Nama ini yang dilihat klien di rincian estimasi.</span>
      </div>

      <div className="baris-isian">
        <span className="label-isian">Nilai</span>
        <input
          type="text"
          inputMode="numeric"
          value={teksNilai}
          onChange={(e) => {
            const n = bacaAngka(e.target.value)
            setTeksNilai(n ? angkaRupiah(n) : '')
          }}
          aria-label="Nilai biaya"
        />
        <span className="petunjuk">
          {adaPenyesuaian ? 'Nilai yang berlaku sekarang' : `Hasil hitungan: ${rupiah(baris.nilai)}`}
          {baris.kode === 'cekFisik' && ' · kertas gesek akan ikut menyesuaikan'}
        </span>
      </div>
    </Lembar>
  )
}
