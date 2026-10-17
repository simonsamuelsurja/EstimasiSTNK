/**
 * Layar kartu estimasi.
 *
 * Kartu digambar di luar layar pada ukuran tetap, lalu hasilnya ditampilkan
 * sebagai gambar. Yang dilihat staf di sini persis yang diterima klien.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { kartuLayakDikirim } from '../core/kartu'
import type { HasilDenganPenyesuaian } from '../core/tipe'
import { Kartu, Peringatan } from './dasar'
import { bagikanGambar, buatGambar, namaBerkasGambar, unduhGambar } from './gambar'
import { KartuEstimasi } from './KartuEstimasi'

type Keadaan = 'menggambar' | 'siap' | 'gagal'

export function LayarKartu({
  hasil,
  onMulaiBaru,
}: {
  hasil: HasilDenganPenyesuaian
  onMulaiBaru: () => void
}) {
  const panggung = useRef<HTMLDivElement>(null)
  const [gambar, setGambar] = useState<string | null>(null)
  const [keadaan, setKeadaan] = useState<Keadaan>('menggambar')
  const [pesan, setPesan] = useState<string | null>(null)
  const [membagikan, setMembagikan] = useState(false)

  const gambarUlang = useCallback(async () => {
    if (!panggung.current) return
    setKeadaan('menggambar')
    try {
      // Sekali gambar buang dulu: pemanggilan pertama html-to-image kadang
      // keluar sebelum huruf selesai dimuat, dan hasilnya jadi kosong.
      await buatGambar(panggung.current)
      const hasilGambar = await buatGambar(panggung.current)
      setGambar(hasilGambar.dataUrl)
      setKeadaan('siap')
    } catch {
      setKeadaan('gagal')
    }
  }, [])

  useEffect(() => {
    void gambarUlang()
  }, [gambarUlang, hasil])

  const namaBerkas = namaBerkasGambar(hasil.nopol)

  const simpan = () => {
    if (!gambar) return
    // Unduhan bisa diam-diam tidak jalan: Safari di iPhone kerap menolaknya,
    // dan halaman yang dimuat di dalam kerangka terbatas ikut memblokirnya.
    // Karena itu petunjuk cadangan selalu disebut, bukan hanya saat gagal.
    unduhGambar(gambar, namaBerkas)
    setPesan(
      `Gambar sedang diunduh sebagai ${namaBerkas}. Kalau tidak tersimpan otomatis, ` +
        'tekan lama gambar di bawah lalu pilih simpan.',
    )
  }

  const share = async () => {
    if (!gambar || membagikan) return
    setMembagikan(true)
    setPesan(null)
    const hasilBerbagi = await bagikanGambar(gambar, namaBerkas)
    setMembagikan(false)
    if (hasilBerbagi === 'berhasil') setPesan('Gambar dibagikan.')
    else if (hasilBerbagi === 'tidak-didukung') {
      setPesan('Berbagi gambar belum didukung di peramban ini. Unduh gambar lalu bagikan dari galeri.')
    } else if (hasilBerbagi === 'gagal') {
      setPesan('Gambar belum berhasil dibagikan. Coba Share lagi atau unduh gambarnya.')
    }
  }

  return (
    <>
      {/* Kartu sungguhan, digambar di luar layar pada ukuran tetap. */}
      <div className="panggung-kartu" aria-hidden="true">
        <KartuEstimasi hasil={hasil} ref={panggung} />
      </div>

      <div className="tombol-berjajar">
        <button type="button" className="tombol tombol-kedua" onClick={onMulaiBaru}>
          Kembali ke Awal &amp; Reset
        </button>
      </div>

      {!kartuLayakDikirim(hasil) && (
        <Peringatan tingkat="gagal">
          <span>
            <b>Estimasi belum lengkap.</b> Masih ada harga yang belum ada di daftar, jadi kartu ini
            belum layak dikirim ke klien.
          </span>
        </Peringatan>
      )}

      <Kartu judul="Yang Diterima Klien">
        <div className="tombol-berjajar aksi-gambar" aria-busy={keadaan === 'menggambar'}>
          <button
            type="button"
            className="tombol tombol-utama"
            onClick={simpan}
            disabled={keadaan !== 'siap'}
            aria-label="Unduh gambar"
            title="Unduh gambar"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
          </button>
          <button
            type="button"
            className="tombol tombol-kedua"
            onClick={() => void share()}
            disabled={keadaan !== 'siap' || membagikan}
            aria-label="Share gambar"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
              <path d="m8.6 10.5 6.8-4M8.6 13.5l6.8 4" />
            </svg>
            {membagikan ? 'Membagikan…' : 'Share'}
          </button>
        </div>

        {keadaan === 'menggambar' && <p className="petunjuk" role="status">Menyiapkan gambar…</p>}

        {pesan && (
          <Peringatan tingkat="info">
            <span>{pesan}</span>
          </Peringatan>
        )}
        {keadaan === 'gagal' && (
          <Peringatan tingkat="gagal">
            <span>
              Gambar gagal dibuat di peramban ini. Muat ulang halaman atau buka lewat peramban lain.
            </span>
          </Peringatan>
        )}
      </Kartu>

      <div className="pratinjau">
        {gambar ? (
          <img src={gambar} alt={`Kartu estimasi ${hasil.nopol}`} />
        ) : (
          <div className="pratinjau-kosong">
            {keadaan === 'gagal' ? 'Gambar gagal dibuat.' : 'Menyiapkan gambar…'}
          </div>
        )}
      </div>

    </>
  )
}
