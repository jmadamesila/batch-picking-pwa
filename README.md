# Batch Picking Report — PWA

A client‑only (offline‑capable) web app that converts a Daily Batch Picking Excel (.xlsb) into a mobile‑friendly interactive HTML timeline (v8). Nothing leaves the device — processing happens in the browser with Python (Pyodide).

- Works in Safari on iPhone (installable PWA)
- Sticky header/footer, zoom, sorting, legend overlay
- Color by zone (AMBIENT, PRODUCE, FRIDGE, FREEZER, LARGE, PRIORITY, Other)
- English / 日本語 toggle

## Quick Start (GitHub Pages)

1. Create a new repo (public is simplest), e.g. `batch-picking-pwa`.
2. Put the contents of this `pwa/` folder at the repo root so you have:
   `index.html, app.js, styles.css, template_v8.html, sw.js, manifest.webmanifest, README.md`.
3. Push to GitHub on `main`.
4. In the repo: Settings → Pages → Source = Deploy from a branch → Branch = `main` / root → Save.
5. Visit the HTTPS URL on your iPhone (https://USERNAME.github.io/batch-picking-pwa).
6. Tap “Preload Runtime” once while online to cache the Python runtime.
7. Tap “Choose Excel”, pick the `.xlsb`, then “Generate” → “Open Report”.
8. Add to Home Screen for a native feel (optional).

### Offline use
- After the one‑time preload on HTTPS, the app works offline (Service Worker caches the runtime and app files).
- If Safari site data is cleared or the PWA is reinstalled, run “Preload Runtime” once again while online.

### Why HTTPS (GitHub Pages) matters
Service Worker caching of large runtime files is fully supported and persistent over HTTPS. Local LAN `http://` hosting may not reliably keep the runtime cached on iOS.

## Development
Serve the folder locally for quick testing:

```
cd pwa
python3 -m http.server 8000
# open http://localhost:8000
```

## Privacy
All processing happens on‑device in the browser. Files are never uploaded to a server.

---

# バッチピッキングレポート — PWA

Python（Pyodide）を使い、iPhoneのSafari上で `.xlsb` からインタラクティブなタイムラインHTML（v8）を生成します。処理は端末内のみで行われ、ファイルは外部に送信されません。

- iPhoneのSafariで動作（PWAとしてホーム画面に追加可）
- 固定ヘッダー／フッター、ズーム、並べ替え、凡例
- ゾーン色分け（AMBIENT / PRODUCE / FRIDGE / FREEZER / LARGE / PRIORITY / Other）
- 英語／日本語切り替え

## かんたん手順（GitHub Pages）

1. 新規リポジトリを作成（公開がおすすめ）。例：`batch-picking-pwa`。
2. この `pwa/` フォルダの内容をリポジトリ直下に配置し、下記ファイルが存在するようにします。
   `index.html, app.js, styles.css, template_v8.html, sw.js, manifest.webmanifest, README.md`
3. `main` ブランチに push。
4. リポジトリの Settings → Pages → Source = Deploy from a branch → Branch = `main` / root → Save。
5. iPhoneのSafariでHTTPSのページ（例：`https://USERNAME.github.io/batch-picking-pwa`）を開く。
6. オンラインの状態で一度「ランタイムを事前読み込み」を押してPythonランタイムをキャッシュ。
7. 「Excel を選択」→ `.xlsb` を選ぶ → 「レポート作成」→ 「レポートを開く」。
8. ホーム画面に追加すると便利です（任意）。

### オフライン利用
- HTTPSで一度「事前読み込み」した後は、オフラインでも動作します（Service Workerがランタイムとアプリをキャッシュします）。
- Safariのサイトデータを消去した場合やPWAを再インストールした場合は、オンラインで再度「事前読み込み」を実行してください。

### なぜHTTPS（GitHub Pages）が必要？
iOSでは、HTTPS環境下でService Workerが大きなランタイムファイルを安定してキャッシュ・保持します。ローカルLANの`http://`ではキャッシュが維持されないことがあります。

## 開発
ローカルで動作確認：

```
cd pwa
python3 -m http.server 8000
# http://localhost:8000 を開く
```

## プライバシー
処理はすべて端末内（ブラウザ）で行われます。ファイルは外部に送信されません。
