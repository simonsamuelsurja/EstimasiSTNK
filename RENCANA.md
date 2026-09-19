# Strategi Pembangunan Aplikasi Estimasi STNK

Aplikasi **web-based**, dipakai **internal** Surya Jasa, berfungsi sebagai kalkulator estimasi
biaya pengurusan dokumen kendaraan. Harus jalan baik di HP maupun di komputer.

Sumber logika: `Surya Jasa - Estimasi v2.xlsx` (5 sheet, sudah dibedah penuh).

> Dokumen ini adalah rencana, belum ada kode yang ditulis.

---

## Jawaban singkat: kapan jadi?

| Milestone | Isi | Perkiraan |
|---|---|---|
| **M1 — Otak kalkulator beres** | Data daerah/Samsat/tarif terekstrak, seluruh rumus diterjemahkan, mesin hitung lulus uji terhadap Excel | **±1 minggu** |
| **M2 — Bisa dipakai membuat estimasi** | Kalkulator jalan di HP & komputer, mode manual, output tersimpan sebagai gambar | **±2 minggu** |
| **M3 — Lepas dari ketergantungan** | Halaman admin tarif, terpasang di HP tim, uji paralel dengan Excel | **±3 minggu** |

Lebih cepat dari rencana Android sebelumnya (4–6 minggu) karena satu sebab:
**seluruh aplikasi bisa aku bangun dan uji sendiri sampai selesai.** Tidak ada lagi putaran
"aku tulis → kamu kompilasi → error dilaporkan → aku perbaiki" yang memakan waktu di jalur Android.

---

## Lingkup yang sudah ditetapkan

| # | Kebutuhan | Bentuknya di aplikasi |
|---|---|---|
| 1 | Kalkulator sebagai fungsi utama, dengan database daerah & Samsat | Input kendaraan → hitung **jasa**, **estimasi denda STNK**, dan **biaya-biaya lain**, ditampilkan terpisah agar terbaca |
| 2 | Fitur manual | Setiap baris biaya bisa ditimpa angkanya sesuai kebutuhan klien, menggantikan fungsi sheet `Hitung Manual` |
| 3 | Internal, tanpa login | Kalkulator langsung terbuka, tanpa akun, tanpa kata sandi |
| 4 | Output bisa disimpan sebagai gambar | Kartu estimasi rapi, sekali ketuk tersimpan sebagai gambar untuk dikirim ke klien |

**Satu asumsi yang aku ambil:** "versi mobile juga harus dibuat" aku artikan sebagai **satu aplikasi web yang
tata letaknya menyesuaikan layar** — dirancang mobile-first, tetap rapi di layar besar, dan bisa dipasang
di layar utama HP seperti aplikasi biasa (PWA). Bukan dua aplikasi terpisah yang harus dirawat dua kali.
Kalau maksudmu berbeda, beri tahu sebelum Fase 3 — setelah itu biayanya mahal untuk diubah.

---

## Strategi arsitektur

Tiga lapisan, dipisah dengan sengaja:

```
┌─────────────────────────────────────────────┐
│  TAMPILAN                                   │
│  Kalkulator · Mode manual · Kartu estimasi  │  ← berubah sering
│  Mobile-first, responsif, bisa dipasang     │
├─────────────────────────────────────────────┤
│  MESIN HITUNG                               │
│  Semua rumus. Tanpa tampilan.               │  ← jarang berubah, WAJIB benar
│  Diuji otomatis terhadap angka Excel        │
├─────────────────────────────────────────────┤
│  DATA                                       │
│  Daerah · Samsat · Tarif · Tabel harga      │  ← berubah lewat halaman admin
└─────────────────────────────────────────────┘
```

**Kenapa dipisah begini:** mesin hitung adalah satu-satunya bagian yang kalau salah, kamu rugi uang.
Dengan dipisahkan dari tampilan, dia bisa diuji otomatis terhadap ratusan kasus tanpa membuka browser.
Setiap kali ada perubahan tampilan, uji itu jalan lagi dan memastikan angkanya tidak bergeser.

**Tarif tidak ditanam di kode.** 30 tarif yang di Excel tertanam di dalam rumus akan diangkat
jadi baris data. Konsekuensinya: naik tarif cek fisik cukup diubah di halaman admin, tanpa menungguku.

---

## Tantangan yang perlu keputusanmu: admin tarif tanpa login

Ini bukan detail teknis, ini keputusan bisnis, dan aku angkat sekarang karena memengaruhi Fase 6.

Kamu minta tanpa login. Untuk kalkulator sehari-hari itu masuk akal — staf tinggal buka dan pakai.
Tapi halaman admin tarif berbeda sifatnya: **siapa pun yang tahu alamatnya bisa mengubah harga jasamu.**
Kalau aplikasi di-hosting di internet dengan alamat publik, "tanpa login" berarti tarifmu bisa diubah siapa saja
yang menemukan alamat itu — termasuk kompetitor yang penasaran, atau orang iseng.

Tiga pilihan, dari paling aman:

| Pilihan | Cara kerja | Konsekuensi |
|---|---|---|
| **A. Jaringan kantor saja** | Aplikasi hanya bisa dibuka dari WiFi kantor | Paling aman. Tapi tidak bisa dipakai saat staf di lapangan atau ketemu klien di luar |
| **B. Kalkulator terbuka, admin pakai PIN** ★ | Kalkulator tanpa login sama sekali. Halaman admin minta satu PIN yang diketahui kamu saja | Sesuai permintaanmu untuk pemakaian harian, tarif tetap terlindungi. **Rekomendasiku** |
| **C. Benar-benar terbuka** | Tidak ada perlindungan apa pun | Hanya layak kalau aplikasi tidak pernah menyentuh internet publik |

Pilihan B tidak melanggar "tanpa login" dalam arti yang kamu maksud — staf tidak perlu punya akun,
tidak perlu ingat kata sandi, tinggal buka dan pakai. PIN hanya berdiri di depan satu halaman: pengubah tarif.

Kalau kamu tetap mau C, aku kerjakan C — tapi ini perlu keputusan sadar, bukan kelalaian.

---

## Tahapan

### Fase 0 — Ekstraksi data & tarif

Memindahkan seluruh data referensi Excel ke format terstruktur.

- 140 kecamatan → Samsat
- 27 Samsat → penanda Jabodetabek
- ±150 pasangan rute (Dari → Ke) × 4 kolom harga
- Tabel Perpanjang Tahunan dan Perpanjang ACC KTP
- **Mengangkat 30 tarif yang tertanam di dalam rumus** menjadi baris tabel tarif

Keluaran: berkas data + daftar 30 tarif untuk kamu konfirmasi.

| Kerja Claude | Butuh darimu | Bisa kuuji sendiri |
|---|---|---|
| 2–3 jam | Verifikasi 30 tarif (±1–2 jam) | Ya |

---

### Fase 1 — Spesifikasi logika hitung

Menerjemahkan 22 rumus keluaran + 17 rumus helper menjadi aturan yang tidak ambigu.
**Fase paling menentukan benar-salahnya seluruh aplikasi.**

- Aturan per jenis jasa (8 jenis)
- Pemisahan tiga kelompok yang kamu sebut: **jasa**, **denda STNK**, **biaya lain**
- Tabel keputusan untuk rumus bercabang dalam (`Biaya Penulisan` punya 17 `IF` bersarang)
- Penyelesaian [pertanyaan terbuka](#pertanyaan-terbuka)

Keluaran: dokumen rujukan berbahasa manusia — dipakai kalau suatu hari ada sengketa angka dengan klien.

| Kerja Claude | Butuh darimu | Bisa kuuji sendiri |
|---|---|---|
| 3–4 jam | **Menjawab pertanyaan terbuka — ini penentu jadwal** | Ya |

---

### Fase 2 — Mesin hitung + uji regresi

Menulis lapisan mesin hitung dan mengujinya terhadap Excel.

- Implementasi seluruh aturan Fase 1
- Tarif dimuat dari data, tidak ditanam di kode
- **Uji regresi**: hasil aplikasi wajib sama persis dengan angka Excel
- Kasus awal dari Excel: Mutasi Cianjur→Jakarta **21.108.000**, Perpanjang ACC KTP, STNK Hilang
- Ditambah kasus untuk setiap jenis jasa yang belum tercakup

| Kerja Claude | Butuh darimu | Bisa kuuji sendiri |
|---|---|---|
| 6–8 jam | 3–5 contoh estimasi nyata beserta hasil yang benar | Ya, penuh |

**Fase ini adalah pelindung utama proyek.** Kalau mesin hitung benar dan teruji, sisanya tinggal tampilan.

---

### Fase 3 — Kalkulator (mobile-first)

Tampilan utama yang dipakai sehari-hari.

- Form input yang **field-nya muncul dan hilang** sesuai jenis jasa — tidak semua 20 field ditampilkan sekaligus
- Pencarian kecamatan dengan ketik-dan-saring (140 baris terlalu banyak untuk dropdown biasa)
- Tanggal STNK sebagai pemilih tanggal; **bulan keterlambatan dihitung otomatis**, tidak lagi diketik manual
- Hasil dipecah tiga sesuai permintaanmu: **Jasa** · **Denda STNK** · **Biaya lain** · lalu Total
- Dirancang untuk dipakai satu tangan sambil berdiri

| Kerja Claude | Butuh darimu | Bisa kuuji sendiri |
|---|---|---|
| 8–10 jam | Masukan tampilan setelah melihat versi pertama | Ya — termasuk tangkapan layar di ukuran HP |

---

### Fase 4 — Mode manual

Pengganti sheet `Hitung Manual`.

- Setiap baris biaya bisa ditimpa angkanya
- Baris yang ditimpa **ditandai jelas di layar** supaya staf tahu ini bukan angka hitungan
- Angka asli hasil hitungan tetap disimpan, agar bisa dikembalikan
- Penandaan ini **tidak ikut muncul** di gambar yang dikirim ke klien

| Kerja Claude | Butuh darimu | Bisa kuuji sendiri |
|---|---|---|
| 3–4 jam | Konfirmasi baris mana saja yang boleh ditimpa | Ya |

---

### Fase 5 — Kartu estimasi & simpan sebagai gambar

Ini yang sampai ke tangan klien, jadi diperlakukan sebagai hasil kerja tersendiri, bukan tempelan.

- Tata letak kartu khusus untuk gambar — bukan sekadar memotret layar kalkulator
- Ukuran dioptimalkan untuk WhatsApp
- Berisi nopol, tanggal STNK, jenis jasa, rincian, total
- Sekali ketuk: tersimpan ke galeri HP
- **Jalur cadangan untuk iPhone**: Safari sering menolak unduhan otomatis, jadi gambar ditampilkan agar bisa ditekan-tahan lalu disimpan

Risiko teknis yang sudah aku perhitungkan: pembuatan gambar dari halaman web punya jebakan pada
huruf dan tata letak — hasilnya bisa berbeda antar HP. Karena itu fase ini diberi jatah waktu lebih longgar
dan diuji di beberapa ukuran layar, bukan satu.

| Kerja Claude | Butuh darimu | Bisa kuuji sendiri |
|---|---|---|
| 4–6 jam | Contoh format penawaran yang biasa kamu kirim ke klien | Sebagian besar ya |

---

### Fase 6 — Halaman admin tarif

Yang membuat kamu tidak perlu memanggilku setiap kali harga berubah.

- Ubah 30 tarif dasar
- Kelola tabel harga rute, Samsat, kecamatan
- Impor/ekspor untuk pembaruan massal
- Riwayat perubahan: apa yang diubah, kapan
- Perlindungan sesuai [keputusanmu di atas](#tantangan-yang-perlu-keputusanmu-admin-tarif-tanpa-login)

| Kerja Claude | Butuh darimu | Bisa kuuji sendiri |
|---|---|---|
| 6–8 jam | Keputusan A / B / C soal perlindungan admin | Ya |

---

### Fase 7 — Pemasangan & uji paralel

- Dipasang agar bisa dibuka dari HP tim seperti aplikasi biasa
- Tetap bisa dipakai saat sinyal buruk
- **Uji paralel**: selama 1–2 minggu setiap estimasi dikerjakan di aplikasi **dan** di Excel, setiap selisih ditelusuri

| Kerja Claude | Butuh darimu | Bisa kuuji sendiri |
|---|---|---|
| 3–4 jam + perbaikan temuan | **Fase milikmu** — 1–2 minggu pemakaian nyata | Sebagian |

Uji paralel tidak boleh dilewati. Aplikasi ini menghasilkan angka yang ditagihkan ke klien;
satu tarif salah bisa berarti rugi, atau penawaran yang membuat klien lari.

---

## Pertanyaan terbuka

Harus dijawab di Fase 1. Tanpa ini mesin hitung tidak bisa ditulis dengan benar.

| # | Pertanyaan | Kenapa penting |
|---|---|---|
| 1 | Bulan keterlambatan dihitung **bulan penuh** atau **bulan berjalan** (lewat 1 hari = 1 bulan)? | Menentukan `SKP` dan `JR`; selisihnya bisa jutaan |
| 2 | `Kertas Gesek` sekarang membaca *nilai* `Cek Fisik` (`if(H14=450000,45000,...)`). Aturan sebenarnya apa? | Begitu tarif cek fisik naik, kertas gesek diam-diam jadi nol |
| 3 | Apakah 30 tarif yang tertanam di rumus masih berlaku semua? | Sumber kebenaran tarif |
| 4 | `Jasa Jauh` di-hardcode 7 juta, sementara tabel `K3:N11` punya rincian per tujuan. Mana yang benar? | Menentukan apakah tabel itu jadi acuan resmi |
| 5 | Daftar pilihan `Request Nopol` sudah lengkap? | Kelengkapan pilihan |
| 6 | Plat selain B, A, F, D perlu didukung? | Sekarang plat tak dikenal menghasilkan teks `"MANUAL"` |
| 7 | `Pickup` dihargai sama dengan `Mobil` untuk lookup, tapi `JR` ditambah 72.000. Benar? | Perlakuan jenis kendaraan |
| 8 | Perilaku pilihan `"Lainnya"` di daftar kecamatan? | Penanganan daerah di luar daftar |
| 9 | Angka `48%` di `SKP 1 BULAN` itu denda apa, dan bisa berubah? | Kalau bisa berubah, harus masuk tabel tarif |
| 10 | Baris mana saja yang boleh ditimpa di mode manual? | Menentukan desain Fase 4 |
| 11 | **Klien melihat rincian lengkap, atau hanya total?** | Menentukan isi kartu gambar di Fase 5 |
| 12 | Estimasi perlu disimpan jadi riwayat, atau sekali pakai lalu hilang? | Menentukan apakah butuh penyimpanan permanen |
| 13 | Aplikasi mau dipasang di mana — server kantor, atau layanan hosting? | Menentukan pilihan A/B/C perlindungan admin |

Nomor **1**, **2**, dan **11** paling berdampak ke angka dan ke hasil akhir yang dilihat klien.

Satu pertanyaan dari rencana sebelumnya **sudah terjawab dengan sendirinya**: sinkronisasi tarif antar HP.
Karena web-based, tarif tersimpan di satu tempat dan semua orang otomatis melihat angka yang sama.
Di jalur Android ini butuh tambahan 1–2 minggu; sekarang gratis.

---

## Risiko yang bisa menggeser jadwal

Diurutkan dari yang paling mungkin terjadi:

1. **Menunggu jawaban pertanyaan terbuka.** Fase 2 tidak bisa jalan sebelum Fase 1 tuntas.
   Di proyek seperti ini, inilah penyebab keterlambatan terbesar — bukan kodingnya.
2. **Tarif ternyata tidak seragam.** Excel sudah terbukti punya versi berbeda antar sheet
   (biaya per km `6850` vs `7000`). Kemungkinan masih ada perbedaan lain yang baru ketahuan saat uji paralel.
3. **Pembuatan gambar berbeda antar HP.** Sudah diantisipasi di Fase 5, tapi HP lama atau
   iPhone bisa memunculkan kejutan.
4. **Keputusan perlindungan admin tertunda.** Fase 6 tidak bisa diselesaikan tanpa itu.
5. **Aturan Samsat berubah di tengah jalan.** Di luar kendali; itulah gunanya halaman admin tarif.

---

## Catatan koreksi dari Simon

Hasil pembacaan awal Excel sudah dikoreksi. Yang berlaku:

| Temuan | Status |
|---|---|
| `B13 Pemutihan` tidak dipakai rumus mana pun | **Dihapus** — tidak dibawa ke aplikasi |
| `B4` (tanggal STNK) hanya untuk tampilan / disalin ke klien | Benar. Di aplikasi, bulan keterlambatan **dihitung otomatis** dari tanggal ini |
| Biaya per km: `6850` vs `7000` | **`7000/10` yang terbaru** — dipakai |
| Tabel `K3:N11` (Asal/Tujuan/Jasa/Akom) tidak terhubung rumus | Memang catatan manual untuk memperbaiki tabel harga. Lihat pertanyaan #4 |
| `Hitung Manual` dikira sheet rusak | **Salah baca.** Itu memang mode manual — sel sengaja tidak dikunci agar bisa disesuaikan per klien. Jadi Fase 4 |
| `B26`/`B27` tidak dipakai | **Terkonfirmasi** — diverifikasi sampai ke XML mentah, tidak ada satu pun rumus yang membacanya. Tidak dibawa ke aplikasi |
| `B43` pakai range tetap `D2:E141` | Benar, seharusnya kolom penuh. Tidak relevan lagi di aplikasi |

Temuan tambahan (tidak mendesak): 4 *defined name* di workbook rusak (`#REF!`), termasuk
`HargaBalikNama` yang rusak di semua scope. Tidak berdampak karena rumus memakai referensi
kolom langsung, tapi menjelaskan kenapa rumusnya tidak memakai nama range.

---

## Riwayat keputusan

| Tanggal | Keputusan | Alasan |
|---|---|---|
| 2026-09-19 | Platform: **web-based responsif**, menggantikan Android | Bisa dibangun dan diuji penuh dalam satu alur; menghapus putaran kompilasi bolak-balik; sinkronisasi tarif jadi gratis |
| 2026-09-19 | **Tanpa login** untuk pemakaian harian | Dipakai internal, staf tidak perlu punya akun |
| 2026-09-19 | Versi mobile = satu aplikasi responsif, bukan aplikasi terpisah | Satu kode, satu perawatan |
