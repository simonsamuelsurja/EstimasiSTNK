#!/usr/bin/env python3
"""Screener ARA (Auto Reject Atas) IDX.

Menerapkan pola yang didokumentasikan di README.md: skor komposit dari empat
faktor yang lolos uji out-of-sample di dua blok waktu independen --
volatilitas 20 hari, jarak di atas dasar 60 hari, momentum 20 hari, dan
lonjakan volume.

Skor memprediksi PELUANG ARA, bukan peluang untung. Lihat POLA 3 di README.
"""
import argparse, glob, sys
import numpy as np
import pandas as pd

# Ambang ARA per bucket harga acuan (previous close), diverifikasi empiris.
ARA_BANDS = [(5000, 0.20), (200, 0.25), (50, 0.35)]
TOL = 0.015          # toleransi pembulatan tick
MIN_HISTORY = 60     # bar minimum sebelum sebuah emiten layak diskor


def load(data_dir):
    files = sorted(glob.glob(f"{data_dir}/stock_data_*.csv"))
    if not files:
        sys.exit(f"tidak ada file stock_data_*.csv di {data_dir}")
    df = pd.concat((pd.read_csv(f) for f in files), ignore_index=True)
    df.columns = [c.strip() for c in df.columns]
    df["Date"] = pd.to_datetime(df["Date"])
    for c in ["Previous Price", "Last Price", "Open Price",
              "High Price", "Low Price", "Volume", "Value"]:
        df[c] = pd.to_numeric(df[c], errors="coerce")
    return df.drop_duplicates(subset=["Date", "Stock Code"], keep="first")


def build_panel(df):
    """Panel harian bersih dengan harga terkoreksi aksi korporasi."""
    df = df.sort_values(["Stock Code", "Date"]).reset_index(drop=True)
    last, prev = df["Last Price"], df["Previous Price"]
    vol = df["Volume"].fillna(0)
    traded = (vol > 0) & (last > 0)

    # `Previous Price` milik IDX sudah disesuaikan aksi korporasi, sehingga
    # merangkai return darinya membuat seri ini kebal stock split.
    r = np.where(traded & (prev > 0), last / prev - 1.0, 0.0)
    df["r"] = np.clip(r, -0.9, 3.0)
    df["px"] = np.where(last > 0, last, prev)
    df["adj_px"] = (df.groupby("Stock Code")["r"].transform(lambda s: (1 + s).cumprod())
                    * df.groupby("Stock Code")["px"].transform("first"))

    band = np.select([prev >= b for b, _ in ARA_BANDS],
                     [p for _, p in ARA_BANDS], default=np.nan)
    df["ara"] = ((df["r"] >= band - TOL) & (last >= df["High Price"] - 1e-9)
                 & traded & np.isfinite(band))
    # Band emiten IPO baru 2x normal pada hari-hari pertama.
    first = df.groupby("Stock Code")["Date"].transform("min")
    new_ipo = (first > df["Date"].min() + pd.Timedelta(days=30)) & (df.groupby("Stock Code").cumcount() < 5)
    df.loc[new_ipo, "ara"] = False

    df["traded"] = traded
    df["val"] = df["Value"].fillna(0)
    return df.rename(columns={"Stock Code": "tic", "Date": "date"})


def score(panel):
    """Skor komposit + faktor mentahnya, satu matriks per tanggal x emiten."""
    p = lambda c: panel.pivot(index="date", columns="tic", values=c).sort_index()
    adj, val, px, r = p("adj_px"), p("val"), p("px"), p("r")
    traded = p("traded").fillna(False).astype(bool)

    f = {
        "vol20": r.rolling(20).std(),
        "off_lo60": adj / adj.rolling(60).min() - 1,
        "mom20": adj / adj.shift(20) - 1,
        "volsurge": val / val.rolling(20).median().shift(1),
    }
    liq = val.rolling(20).median().shift(1)
    # Rezim pasar: return 20 hari value-weighted, trailing (tanpa lookahead).
    mkt = (r * val.shift(1)).sum(axis=1) / val.shift(1).sum(axis=1)
    mkt20 = (1 + mkt).rolling(20).apply(np.prod, raw=True) - 1
    # Harga di bawah Rp50 adalah papan pemantauan khusus: tick kasar bikin
    # persentase meledak tanpa ada ARA sungguhan.
    elig = traded & (px >= 50) & adj.shift(MIN_HISTORY).notna() & (liq > 0)

    rank = lambda m: m.where(elig).rank(axis=1, pct=True)
    s = (rank(f["vol20"]) + rank(f["off_lo60"]) + rank(f["mom20"])
         + rank(np.log1p(f["volsurge"].clip(0, 200)))) / 4
    ara = p("ara").fillna(False).astype(bool)
    return s.where(elig), f, liq, px, ara, mkt20


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", required=True, help="folder berisi stock_data_*.csv")
    ap.add_argument("--top", type=int, default=15)
    ap.add_argument("--min-liq", type=float, default=0,
                    help="filter likuiditas, rupiah/hari (mis. 1e9)")
    ap.add_argument("--date", help="tanggal screening (default: bar terakhir)")
    ap.add_argument("--require-ara60", action="store_true",
                    help="konfigurasi v2: hanya emiten yang pernah ARA dalam 60 hari")
    a = ap.parse_args()

    panel = build_panel(load(a.data))
    s, f, liq, px, ara, mkt20 = score(panel)

    i = s.index.get_loc(pd.Timestamp(a.date)) if a.date else len(s.index) - 1
    d = s.index[i]

    ara60 = ara.rolling(60).sum()
    if a.require_ara60:
        s = s.where(ara60 >= 1)

    out = pd.DataFrame({
        "skor": s.iloc[i], "harga": px.iloc[i], "vol20": f["vol20"].iloc[i],
        "vs_dasar60": f["off_lo60"].iloc[i], "mom20": f["mom20"].iloc[i],
        "volsurge": f["volsurge"].iloc[i], "likuid": liq.iloc[i],
        "ara_60h": ara.iloc[max(0, i - 59):i + 1].sum(),
    }).dropna(subset=["skor"])
    out = out[out["likuid"] >= a.min_liq].nlargest(a.top, "skor")

    for c, m in [("skor", 100), ("vol20", 100), ("vs_dasar60", 100), ("mom20", 100)]:
        out[c] = (out[c] * m).round(1)
    out["likuid_jt"] = (out.pop("likuid") / 1e6).round(0)
    out["volsurge"] = out["volsurge"].round(1)

    m = mkt20.iloc[i]
    gate = "BOLEH ENTRY" if m > 0 else "MENAHAN - konfigurasi v2 tidak entry"
    print(f"\nScreen ARA per {d.date()} ({d.day_name()})  "
          f"— {len(s.iloc[i].dropna())} emiten lolos saringan")
    print(f"Rezim pasar (return 20 hari trailing): {m * 100:+.2f}%  ->  {gate}\n")
    print(out.to_string())
    print("\nSkor memeringkat peluang ARA, bukan peluang untung; keduanya diukur "
          "terpisah di README.")
    print("Kalibrasi v2 (top3 + syarat ARA-60h): hit rate 19-36% kena ARA dalam "
          "2 pekan. Sisanya tidak.")
    print("Aturan keluar: jual di open sehari setelah ARA; bila 10 bar tanpa ARA, "
          "tutup apa adanya; TANPA stop loss (terbukti merusak).")


if __name__ == "__main__":
    main()
