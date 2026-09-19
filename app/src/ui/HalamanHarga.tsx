/**
 * Halaman daftar harga.
 *
 * Tiga hal yang bisa dikerjakan di sini:
 *  1. Melengkapi harga rute yang masih kosong, per Samsat
 *  2. Mengubah tarif dasar
 *  3. Mengekspor seluruh daftar harga
 */

import { useMemo, useState } from 'react'
import type { BarisRute } from '../core/data'
import { katalogHarga } from '../core/katalog'
import { katalogKeCsv, katalogKeJson, namaBerkasEkspor, unduhTeks } from '../core/ekspor'
import { barisKosongUntuk, ringkasKelengkapan } from '../core/lengkapi'
import { ruteTerisiPenuh, tarifGabungan, type IsianHarga } from '../core/simpanan'
import { TARIF_BAWAAN } from '../core/tarif'
import { BarisIsian, Kartu, Lembar, Peringatan } from './dasar'
import { angkaRupiah, bacaAngka, rupiah } from './format'

type Bagian = 'lengkapi' | 'tarif' | 'lihat'

export function HalamanHarga({
  isian,
  ruteBerlaku,
  onUbah,
}: {
  isian: IsianHarga
  ruteBerlaku: BarisRute[]
  onUbah: (isian: IsianHarga) => void
}) {
  const [bagian, setBagian] = useState<Bagian>('lengkapi')

  return (
    <>
      <div className="tab-bagian" role="tablist" aria-label="Bagian daftar harga">
        {(
          [
            ['lengkapi', 'Perlu Diisi'],
            ['tarif', 'Tarif Dasar'],
            ['lihat', 'Lihat & Ekspor'],
          ] as const
        ).map(([kode, nama]) => (
          <button
            key={kode}
            type="button"
            role="tab"
            aria-selected={bagian === kode}
            onClick={() => setBagian(kode)}
          >
            {nama}
          </button>
        ))}
      </div>

      {bagian === 'lengkapi' && (
        <Lengkapi isian={isian} ruteBerlaku={ruteBerlaku} onUbah={onUbah} />
      )}
      {bagian === 'tarif' && <UbahTarif isian={isian} onUbah={onUbah} />}
      {bagian === 'lihat' && <LihatEkspor isian={isian} ruteBerlaku={ruteBerlaku} />}
    </>
  )
}

// ---------------------------------------------------------------------------

function Lengkapi({
  isian,
  ruteBerlaku,
  onUbah,
}: {
  isian: IsianHarga
  ruteBerlaku: BarisRute[]
  onUbah: (isian: IsianHarga) => void
}) {
  const [sedangDiisi, setSedangDiisi] = useState<string | null>(null)
  const ringkasan = useMemo(() => ringkasKelengkapan(ruteBerlaku), [ruteBerlaku])

  const terisiDariIsian = ruteTerisiPenuh(isian.rute).length

  if (ringkasan.samsatKosong.length === 0 && ringkasan.barisSetengah === 0) {
    return (
      <Kartu judul="Kelengkapan Harga">
        <Peringatan tingkat="info">
          <span>
            <b>Semua Samsat sudah punya harga rute.</b> Tidak ada yang perlu dilengkapi.
          </span>
        </Peringatan>
      </Kartu>
    )
  }

  return (
    <>
      <Kartu judul="Yang Belum Punya Harga">
        <p className="keterangan">
          Samsat berikut ada di daftar daerah dan bisa dipilih staf, tapi belum punya satu pun
          harga rute. Kalau terpilih, kalkulator memunculkan peringatan dan jasanya terhitung nol.
        </p>

        <div className="ringkas-angka">
          <div>
            <span className="ringkas-nilai">{ringkasan.samsatKosong.length}</span>
            <span className="ringkas-ket">Samsat kosong</span>
          </div>
          <div>
            <span className="ringkas-nilai">{ringkasan.totalBarisPerluDiisi}</span>
            <span className="ringkas-ket">Baris tersisa</span>
          </div>
          <div>
            <span className="ringkas-nilai">{terisiDariIsian}</span>
            <span className="ringkas-ket">Sudah kamu isi</span>
          </div>
        </div>

        <p className="keterangan">
          Tidak perlu sekaligus. Pilih satu Samsat, isi harganya, lalu lanjut yang lain kapan pun.
        </p>

      </Kartu>

      <Kartu judul="Pilih Samsat untuk Diisi">
        <ul className="daftar-pilihan">
          {ringkasan.samsatKosong.map((s) => {
            const kosong = barisKosongUntuk(s, ruteBerlaku).length
            return (
              <li key={s}>
                <button type="button" onClick={() => setSedangDiisi(s)}>
                  <span>{s}</span>
                  <span className="samsat">{kosong} baris kosong</span>
                </button>
              </li>
            )
          })}
        </ul>
      </Kartu>

      {sedangDiisi && (
        <IsiRute
          samsat={sedangDiisi}
          ruteBerlaku={ruteBerlaku}
          isian={isian}
          onSimpan={(barisBaru) => {
            const kunci = (r: BarisRute) => `${r.dari}→${r.ke}`.toLowerCase()
            const lama = isian.rute.filter(
              (r) => !barisBaru.some((b) => kunci(b) === kunci(r)),
            )
            onUbah({ ...isian, rute: [...lama, ...barisBaru] })
            setSedangDiisi(null)
          }}
          onTutup={() => setSedangDiisi(null)}
        />
      )}
    </>
  )
}

// ---------------------------------------------------------------------------

const KOLOM_HARGA = [
  { kunci: 'bbnMobil', judul: 'Balik Nama Mobil' },
  { kunci: 'bbnMotor', judul: 'Balik Nama Motor' },
  { kunci: 'pindahMobil', judul: 'Pindah Alamat Mobil' },
  { kunci: 'pindahMotor', judul: 'Pindah Alamat Motor' },
] as const

function IsiRute({
  samsat,
  ruteBerlaku,
  isian,
  onSimpan,
  onTutup,
}: {
  samsat: string
  ruteBerlaku: BarisRute[]
  isian: IsianHarga
  onSimpan: (baris: BarisRute[]) => void
  onTutup: () => void
}) {
  const awal = useMemo(() => {
    const kosong = barisKosongUntuk(samsat, ruteBerlaku)
    // Kalau sebagian sudah pernah diisi, tampilkan lagi isinya.
    return kosong.map((k) => {
      const sudah = isian.rute.find(
        (r) =>
          r.dari.toLowerCase() === k.dari.toLowerCase() &&
          r.ke.toLowerCase() === k.ke.toLowerCase(),
      )
      return sudah ?? k
    })
  }, [samsat, ruteBerlaku, isian.rute])

  const [baris, setBaris] = useState<BarisRute[]>(awal)

  const ubahSel = (indeks: number, kolom: string, teks: string) => {
    setBaris((lama) =>
      lama.map((b, i) => (i === indeks ? { ...b, [kolom]: teks ? bacaAngka(teks) : null } : b)),
    )
  }

  /** Menyalin baris pertama yang terisi ke semua baris kosong di bawahnya. */
  const salinKeBawah = () => {
    const sumber = baris.find(
      (b) => b.bbnMobil !== null || b.bbnMotor !== null || b.pindahMobil !== null,
    )
    if (!sumber) return
    setBaris((lama) =>
      lama.map((b) =>
        b.bbnMobil === null && b.bbnMotor === null && b.pindahMobil === null && b.pindahMotor === null
          ? { ...b, ...pilihHarga(sumber) }
          : b,
      ),
    )
  }

  const terisi = baris.filter(
    (b) =>
      b.bbnMobil !== null || b.bbnMotor !== null || b.pindahMobil !== null || b.pindahMotor !== null,
  ).length

  return (
    <Lembar
      judul={`Harga Rute ${samsat}`}
      onTutup={onTutup}
      kaki={
        <>
          <button type="button" className="tombol tombol-kedua" onClick={salinKeBawah}>
            Salin ke bawah
          </button>
          <button
            type="button"
            className="tombol tombol-utama"
            onClick={() => onSimpan(baris.filter((b) => adaIsi(b)))}
          >
            Simpan {terisi > 0 && `(${terisi})`}
          </button>
        </>
      }
    >
      <p className="keterangan">
        Harga berlaku dua arah, jadi cukup diisi sekali. Baris pertama adalah pengurusan di dalam
        wilayah {samsat} sendiri. Kosongkan baris yang memang tidak melayani rute itu.
      </p>
      <p className="keterangan">
        Tombol <b>Salin ke bawah</b> menyalin harga terisi pertama ke semua baris yang masih
        kosong — berguna kalau banyak rute berharga sama.
      </p>

      {baris.map((b, i) => (
        <div className="blok-rute" key={`${b.dari}→${b.ke}`}>
          <div className="blok-rute-judul">
            {b.dari === b.ke ? (
              <>
                Dalam wilayah <b>{b.ke}</b>
              </>
            ) : (
              <>
                {b.dari} <span aria-hidden="true">↔</span> <b>{b.ke}</b>
              </>
            )}
          </div>
          <div className="blok-rute-isian">
            {KOLOM_HARGA.map((k) => {
              const nilai = b[k.kunci]
              return (
                <label key={k.kunci}>
                  <span>{k.judul}</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="—"
                    value={nilai === null ? '' : angkaRupiah(nilai)}
                    onChange={(e) => ubahSel(i, k.kunci, e.target.value)}
                    aria-label={`${k.judul} ${b.dari} ke ${b.ke}`}
                  />
                </label>
              )
            })}
          </div>
        </div>
      ))}
    </Lembar>
  )
}

const adaIsi = (b: BarisRute) =>
  b.bbnMobil !== null || b.bbnMotor !== null || b.pindahMobil !== null || b.pindahMotor !== null

const pilihHarga = (b: BarisRute) => ({
  bbnMobil: b.bbnMobil,
  bbnMotor: b.bbnMotor,
  pindahMobil: b.pindahMobil,
  pindahMotor: b.pindahMotor,
})

// ---------------------------------------------------------------------------

function UbahTarif({
  isian,
  onUbah,
}: {
  isian: IsianHarga
  onUbah: (isian: IsianHarga) => void
}) {
  const tarif = tarifGabungan(isian)
  const kelompok = [...new Set(tarif.map((t) => t.kelompok))]

  return (
    <>
      <Kartu judul="Tarif Dasar">
        <p className="keterangan">
          Di Excel, angka-angka ini tertanam di dalam rumus. Di sini bisa diubah langsung.
          Yang diubah ditandai, dan bisa dikembalikan ke nilai semula.
        </p>
      </Kartu>

      {kelompok.map((nama) => (
        <Kartu judul={nama} key={nama}>
          {tarif
            .filter((t) => t.kelompok === nama)
            .map((t) => {
              const diubah = isian.tarif[t.kode] !== undefined
              const bawaan = TARIF_BAWAAN.find((b) => b.kode === t.kode)?.nilai ?? 0
              return (
                <BarisIsian
                  key={t.kode}
                  label={t.label}
                  petunjuk={
                    diubah
                      ? `Diubah dari ${t.satuan === 'rupiah' ? rupiah(bawaan) : bawaan}`
                      : t.catatan
                  }
                >
                  <div className="isian-tarif" data-diubah={diubah ? 'ya' : 'tidak'}>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={angkaRupiah(t.nilai)}
                      aria-label={t.label}
                      onChange={(e) => {
                        const n = bacaAngka(e.target.value)
                        onUbah({ ...isian, tarif: { ...isian.tarif, [t.kode]: n } })
                      }}
                    />
                    <span className="satuan-tarif">{satuanPendek(t.satuan)}</span>
                    {diubah && (
                      <button
                        type="button"
                        className="tombol-teks"
                        onClick={() => {
                          const sisa = { ...isian.tarif }
                          delete sisa[t.kode]
                          onUbah({ ...isian, tarif: sisa })
                        }}
                      >
                        Kembalikan
                      </button>
                    )}
                  </div>
                </BarisIsian>
              )
            })}
        </Kartu>
      ))}
    </>
  )
}

function satuanPendek(satuan: string): string {
  switch (satuan) {
    case 'rupiah':
      return 'Rp'
    case 'persen':
      return '%'
    case 'bulan':
      return 'bln'
    case 'rupiah/km':
      return 'Rp/km'
    default:
      return ''
  }
}

// ---------------------------------------------------------------------------

function LihatEkspor({ isian, ruteBerlaku }: { isian: IsianHarga; ruteBerlaku: BarisRute[] }) {
  const [teks, setTeks] = useState<{ nama: string; isi: string } | null>(null)
  const [tersalin, setTersalin] = useState(false)
  const katalog = useMemo(
    () =>
      katalogHarga(tarifGabungan(isian)).map((t) =>
        t.kode === 'rute'
          ? { ...t, baris: ruteBerlaku as unknown as Record<string, unknown>[] }
          : t,
      ),
    [isian, ruteBerlaku],
  )

  return (
    <>
      <Kartu judul="Ekspor Daftar Harga">
        <p className="keterangan">
          Mengunduh seluruh daftar harga, termasuk yang baru kamu isi. Berkas inilah yang
          dipakai untuk menjadikan isianmu permanen dan dipakai semua orang.
        </p>
        <div className="tombol-berjajar">
          <button
            type="button"
            className="tombol tombol-utama"
            onClick={() => {
              const isi = katalogKeCsv(katalog)
              const nama = namaBerkasEkspor('csv')
              unduhTeks(isi, nama, 'text/csv')
              setTeks({ nama, isi })
              setTersalin(false)
            }}
          >
            Unduh CSV
          </button>
          <button
            type="button"
            className="tombol tombol-kedua"
            onClick={() => {
              const isi = katalogKeJson(katalog)
              const nama = namaBerkasEkspor('json')
              unduhTeks(isi, nama, 'application/json')
              setTeks({ nama, isi })
              setTersalin(false)
            }}
          >
            Unduh JSON
          </button>
        </div>

        {teks && (
          <>
            <p className="keterangan">
              Berkas <b>{teks.nama}</b> sedang diunduh. Sebagian peramban memblokir unduhan
              otomatis tanpa memberi tahu — kalau berkasnya tidak muncul, salin isinya dari kotak
              di bawah.
            </p>
            <textarea className="kotak-ekspor" readOnly value={teks.isi} aria-label="Isi ekspor" />
            <div className="tombol-berjajar">
              <button
                type="button"
                className="tombol tombol-kedua"
                onClick={() => {
                  void navigator.clipboard
                    ?.writeText(teks.isi)
                    .then(() => setTersalin(true))
                    .catch(() => setTersalin(false))
                }}
              >
                {tersalin ? 'Tersalin' : 'Salin Semua'}
              </button>
            </div>
          </>
        )}
      </Kartu>

      {katalog.map((t) => (
        <Kartu judul={t.nama} key={t.kode}>
          <p className="keterangan">{t.keterangan}</p>
          <p className="keterangan">
            <b>{t.baris.length}</b> baris · {t.kolom.length} kolom
            {t.belumDipakai && ' · belum dipakai perhitungan'}
          </p>
        </Kartu>
      ))}
    </>
  )
}
