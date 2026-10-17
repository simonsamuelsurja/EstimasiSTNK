import { afterEach, describe, expect, it, vi } from 'vitest'
import { bagikanGambar } from './gambar'

const GAMBAR = 'data:image/png;base64,iVBORw0KGgo='

afterEach(() => vi.unstubAllGlobals())

describe('Share hanya berkas gambar', () => {
  it('mengirim satu PNG tanpa teks, judul, atau URL', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { canShare: () => true, share })
    expect(await bagikanGambar(GAMBAR, 'estimasi.png')).toBe('berhasil')
    const payload = share.mock.calls[0][0]
    expect(Object.keys(payload)).toEqual(['files'])
    expect(payload.files).toHaveLength(1)
    expect(payload.files[0].name).toBe('estimasi.png')
    expect(payload.files[0].type).toBe('image/png')
    expect([...new Uint8Array(await payload.files[0].arrayBuffer())])
      .toEqual([137, 80, 78, 71, 13, 10, 26, 10])
  })

  it('membedakan pembatalan pengguna dari kegagalan', async () => {
    vi.stubGlobal('navigator', {
      canShare: () => true,
      share: vi.fn().mockRejectedValue(new DOMException('Dibatalkan', 'AbortError')),
    })
    expect(await bagikanGambar(GAMBAR, 'estimasi.png')).toBe('dibatalkan')
  })

  it('menangani perangkat tanpa dukungan berbagi berkas', async () => {
    vi.stubGlobal('navigator', {})
    expect(await bagikanGambar(GAMBAR, 'estimasi.png')).toBe('tidak-didukung')
    const share = vi.fn()
    vi.stubGlobal('navigator', { share, canShare: () => false })
    expect(await bagikanGambar(GAMBAR, 'estimasi.png')).toBe('tidak-didukung')
    expect(share).not.toHaveBeenCalled()
  })

  it('melaporkan kegagalan saat aplikasi tujuan menolak berkas', async () => {
    vi.stubGlobal('navigator', {
      canShare: () => true,
      share: vi.fn().mockRejectedValue(new Error('Tujuan tidak tersedia')),
    })
    expect(await bagikanGambar(GAMBAR, 'estimasi.png')).toBe('gagal')
  })
})
