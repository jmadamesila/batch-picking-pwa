// Register SW
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(()=>{});
}

const $ = sel => document.querySelector(sel);
const fileEl = $('#file');
const runBtn = $('#run');
const storeEl = $('#store');
const statusEl = $('#status');
const statusWrap = $('#statusWrap');
const progressBar = $('#progressBar');
const preloadBtn = $('#preload');
const openBtn = $('#open');
const saveBtn = $('#save');
const langBtn = $('#lang');

let lastBlobUrl = null;
const I18N = {
  en: {
    title:'Batch Picking Report Generator', strap:'Fast, private, on‑device report builder',
    preload:'Preload Runtime', choose:'Open Batch Picking File (.xlsb)', generate:'Generate', open:'Open Report', save:'Save Report Locally',
    ready:'Ready', downloading:'Downloading Python runtime…', installing:'Installing packages…', processing:'Processing…', done:'Done',
    offline:'Offline: runtime not cached. Tap Preload.',
    note1:'This tool runs fully on your device (client‑only). Select your daily Batch Picking Excel (.xlsb) and tap Generate. The result opens in a new tab as a self‑contained HTML you can save to Files and view in Safari.',
    note2:'First run downloads the Python runtime (~20–30MB). Tap “Preload Runtime” once while online to cache it for offline use.',
    note3:''
  },
  ja: {
    title:'バッチピッキングレポート ジェネレーター', strap:'高速・プライバシー重視・端末内で完結',
    preload:'ランタイムを事前読み込み', choose:'バッチピッキングファイル（.xlsb）を開く', generate:'レポート作成', open:'レポートを開く', save:'ローカルに保存',
    ready:'準備完了', downloading:'Python ランタイムをダウンロード中…', installing:'パッケージをインストール中…', processing:'処理中…', done:'完了',
    offline:'オフライン：ランタイムが未キャッシュです。「ランタイムを事前読み込み」を押してください。',
    note1:'このツールは端末内のみで動作します（クライアントのみ）。毎日のバッチピッキングExcel（.xlsb）を選択し、「レポート作成」を押してください。Safariで保存・閲覧できる単独HTMLが開きます。',
    note2:'初回はPythonランタイム（約20〜30MB）をダウンロードします。オフライン利用のため、オンライン時に一度「ランタイムを事前読み込み」を行ってください。',
    note3:''
  }
};

function setLang(code){
  const dict = I18N[code]||I18N.en;
  document.querySelectorAll('[data-i18n]').forEach(el=>{ const k=el.getAttribute('data-i18n'); if(dict[k]) el.textContent=dict[k]; });
  const t = document.querySelector('#title'); if(t) t.textContent = dict.title;
  localStorage.setItem('bpr_lang', code);
  langBtn.textContent = code==='en' ? '日本語' : 'EN';
}

setLang(localStorage.getItem('bpr_lang')||'en');
langBtn?.addEventListener('click', ()=>{ const cur=localStorage.getItem('bpr_lang')||'en'; setLang(cur==='en'?'ja':'en'); });

// Theme toggle for landing page
const themeBtn = document.querySelector('#themeBtn');
const THEME='site_theme';
function applyTheme(t){ document.body.classList.toggle('light', t==='light'); localStorage.setItem(THEME,t); if(themeBtn) themeBtn.textContent = t==='light'?'🌙':'☀️'; }
applyTheme(localStorage.getItem(THEME)||'dark');
themeBtn?.addEventListener('click',()=> applyTheme(document.body.classList.contains('light')?'dark':'light'));

let pyodide;

async function ensurePyodideGlobal(){
  if (typeof loadPyodide === 'function') return;
  await new Promise((resolve, reject)=>{
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js';
    s.onload = resolve; s.onerror = ()=>reject(new Error('pyodide.js failed to load'));
    document.head.appendChild(s);
  });
}

function tr(key){ const d=I18N[localStorage.getItem('bpr_lang')||'en']; return d[key]||key; }

async function loadPy(preloadOnly=false) {
  if (pyodide) return pyodide;
  statusKey('downloading');
  await ensurePyodideGlobal();
  pyodide = await loadPyodide({indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/'});
  statusKey('installing');
  await pyodide.loadPackage(['pandas','micropip']);
  // Install pure-python pyxlsb
  const micropip = await pyodide.pyimport('micropip');
  await micropip.install('pyxlsb');
  // Load our python helpers
  // Load v8 template from repo to keep parity
  let tmpl = '';
  try{
    const src = await fetch('./template_v8.html');
    tmpl = await src.text();
  }catch(e){ console.warn('Template fetch failed:', e); }
  const b64 = btoa(unescape(encodeURIComponent(tmpl)));
  await pyodide.runPythonAsync(PY_CODE + `\nimport base64\nTEMPLATE_HTML = base64.b64decode("${b64}").decode('utf-8')\n`);
  statusKey('ready');
  return pyodide;
}

function statusByText(msg){
  if(!msg){ statusWrap?.classList.add('hidden'); return; }
  statusEl.textContent = msg; statusWrap?.classList.remove('hidden');
}

function setProgress(pct, indet=false){
  if(!progressBar) return;
  progressBar.classList.toggle('indeterminate', !!indet);
  if(!indet){ progressBar.style.width = Math.max(0, Math.min(100, pct||0)) + '%'; }
  else { progressBar.style.width = '60%'; }
}

function statusKey(key){
  const txt = tr(key);
  statusByText(txt);
  const map = { downloading:[20,true], installing:[60,true], processing:[80,true], ready:[100,false], done:[100,false], offline:[0,false] };
  const v = map[key];
  if(v){ setProgress(v[0], v[1]); }
  if(key==='ready' || key==='done') setTimeout(()=> statusByText(''), 900);
}

fileEl.addEventListener('change', () => {
  runBtn.disabled = !fileEl.files?.length;
});

preloadBtn?.addEventListener('click', async ()=>{ try{ preloadBtn.disabled=true; await loadPy(true); } finally { preloadBtn.disabled=false; } });

openBtn?.addEventListener('click', ()=>{ if(lastBlobUrl) try{ window.open(lastBlobUrl,'_blank'); }catch(_){ } });
saveBtn?.addEventListener('click', ()=>{ if(!lastBlobUrl) return; const a=document.createElement('a'); a.href=lastBlobUrl; a.download='batch_report_v8.html'; document.body.appendChild(a); a.click(); a.remove(); });

runBtn.addEventListener('click', async () => {
  if (!fileEl.files?.length) return;
  const f = fileEl.files[0];
  const buf = new Uint8Array(await f.arrayBuffer());
  try {
    runBtn.disabled = true; statusKey('processing');
    const py = await loadPy();
    const store = storeEl.value.trim() || '1545';
    const pyBuf = py.toPy ? py.toPy(buf) : buf; // JS -> Python bytes
    py.globals.set('XLSB_BYTES', pyBuf);
    const pyResult = await py.runPythonAsync(`process_xlsb(XLSB_BYTES, '${store}')`);
    const html = pyResult.toString ? pyResult.toString() : pyResult;
    try { if (pyBuf && pyBuf.destroy) pyBuf.destroy(); } catch(_){}
    lastBlobUrl = createBlobUrl(html);
    openBtn.disabled=false; saveBtn.disabled=false;
    statusKey('done');
  } catch (e){
    console.error(e); alert('Failed: ' + e);
  } finally { runBtn.disabled = false; }
});

function createBlobUrl(html){ const blob = new Blob([html], {type:'text/html'}); return URL.createObjectURL(blob); }

// Python code for parsing + rendering v8
const PY_CODE = `
import pandas as pd, numpy as np
from io import BytesIO
from datetime import timedelta

def _is_excel_serial(series):
    try:
        s = pd.to_numeric(series, errors='coerce')
        return (s.between(20000, 80000)).mean() > 0.5
    except Exception:
        return False

def to_datetime(series):
    if _is_excel_serial(series):
        return pd.to_datetime(pd.to_numeric(series, errors='coerce'), unit='D', origin='1899-12-30')
    return pd.to_datetime(series, errors='coerce')

def preprocess(df, store='1545'):
    df = df.copy()
    df['hub_store_number'] = df['hub_store_number'].astype(str).str.strip()
    df = df[df['hub_store_number'] == str(store)]
    if df.empty:
        raise ValueError(f'No rows found for hub_store_number == {store}.')
    df['run_date'] = to_datetime(df['run_date'])
    df['run_start_time'] = to_datetime(df['run_start_time'])
    df['run_end_time'] = to_datetime(df['run_end_time'])
    wrap = df['run_end_time'] < df['run_start_time']
    df.loc[wrap, 'run_end_time'] += pd.Timedelta(days=1)
    df = df.sort_values(['employee','run_start_time'])
    df['run_number'] = df.groupby('employee').cumcount() + 1
    day = (df['run_date'].dropna().iloc[0] if df['run_date'].notna().any() else df['run_start_time'].dropna().iloc[0]).normalize()
    day_start = day + pd.Timedelta(hours=4)
    day_end   = day + pd.Timedelta(hours=21)
    df['x0'] = df['run_start_time'].clip(lower=day_start, upper=day_end)
    df['x1'] = df['run_end_time'].clip(lower=day_start, upper=day_end)
    df['duration_min'] = (df['x1'] - df['x0']).dt.total_seconds()/60.0
    df = df[df['duration_min']>0]
    df['orders'] = pd.to_numeric(df.get('run_order_count'), errors='coerce').astype('Int64')
    df['units']  = pd.to_numeric(df.get('run_units_picked'), errors='coerce').astype('Int64')
    df['mins']   = pd.to_numeric(df.get('run_minutes'), errors='coerce').astype(float)
    df['UPH1']   = pd.to_numeric(df.get('UPH'), errors='coerce').astype(float)
    df['is_obf'] = df['run_type'].astype(str).str.upper().eq('OBF')
    df['zone']   = np.where(df['is_obf'], df.get('ob_zone_requested','').fillna('').str.upper(), '')
    def label_full(r):
        rn=int(r['run_number']); m=r['mins']; u=r['UPH1']
        m_s = f"{m:.1f} m" if pd.notna(m) else ''
        u_s = f"{u:.1f}" if pd.notna(u) else ''
        return f"#{rn}<br>{m_s}<br>{u_s}"
    df['label_full'] = df.apply(label_full, axis=1)
    df['label_short'] = df['run_number'].apply(lambda n: f"#{int(n)}")
    def tip(r):
        return (f"Run #{int(r.run_number)}<br>"
                f"Employee: {r.employee}<br>"
                f"Type: {r.run_type}"
                + (f"<br>Zone: {r.zone}" if str(r.zone) not in ['', '<NA>'] else '')
                + f"<br>Start: {pd.to_datetime(r.x0).strftime('%H:%M')}"
                + f"<br>End: {pd.to_datetime(r.x1).strftime('%H:%M')}"
                + f"<br>Orders: {('-' if pd.isna(r.orders) else int(r.orders))}"
                + f"<br>Units: {('-' if pd.isna(r.units) else int(r.units))}"
                + f"<br>Mins: {('-' if pd.isna(r.mins) else f'{r.mins:.1f}')}"
                + f"<br>UPH: {('-' if pd.isna(r.UPH1) else f'{r.UPH1:.1f}')}" )
    df['tip'] = [tip(r) for r in df.itertuples(index=False)]
    date_str = df['run_date'].dropna().dt.date.unique()
    date_str = str(date_str[0]) if len(date_str) else ''
    return df, day_start, day_end, date_str

def colors(is_obf, zone):
    z=(zone or '').upper()
    if not is_obf: return '#95a5a6','#7f8c8d'
    if z=='AMBIENT': return '#e74c3c','#c0392b'
    if z=='PRODUCE': return '#2ecc71','#1e8449'
    if z=='FRIDGE':  return '#5dade2','#2e86c1'
    if z=='FREEZER': return '#2874A6','#1B4F72'
    if z=='LARGE':   return '#9b59b6','#7d3c98'
    return '#e67e22','#af601a'

def build_html(df, day_start, day_end, date_str):
    employees = sorted(df['employee'].dropna().unique().tolist())
    span_min = (day_end - day_start).total_seconds()/60.0
    # ticks
    t = (day_start.ceil('1h'))
    ticks=[]
    while t <= day_end:
        pct = 100.0 * (t - day_start).total_seconds()/(span_min*60.0)
        ticks.append((pct, t.strftime('%H:%M')))
        t += pd.Timedelta(hours=1)
    ticks_html = ''.join([f'<div class="tick" style="left:{p:.6f}%">{txt}</div>' for p,txt in ticks])
    # aggregates
    mins_f = np.where(df['mins'].notna(), df['mins'], df['duration_min'])
    units_f = df['units'].fillna(0).astype(float)
    g = (pd.DataFrame({'employee':df['employee'], 'mins_f':mins_f, 'units_f':units_f})
         .groupby('employee', as_index=False)
         .agg(runs=('employee','count'), total_mins=('mins_f','sum'), total_units=('units_f','sum')))
    g['uph_total'] = np.where(g['total_mins']>0, 60.0*g['total_units']/g['total_mins'], np.nan)
    agg = {r.employee:r for r in g.itertuples(index=False)}
    hours = span_min/60.0; base_width_px = int(round(hours*160))
    vlines = ''.join([f'<div class="vline" style="left:{p:.6f}%"></div>' for p,_ in ticks])
    rows=[]
    for idx, emp in enumerate(employees):
        sub = df[df['employee']==emp]
        first_start = pd.to_datetime(sub['x0'].min()) if not sub.empty else pd.NaT
        first_start_min = (first_start - day_start).total_seconds()/60.0 if pd.notna(first_start) else float('inf')
        bars=[]
        for r in sub.itertuples(index=False):
            left_pct = 100.0 * (r.x0 - day_start).total_seconds()/(span_min*60.0)
            width_pct = max(0.12, 100.0 * (r.x1 - r.x0).total_seconds()/(span_min*60.0))
            fill,border = colors(r.is_obf, getattr(r,'zone',''))
            bars.append(f'''<div class="bar" style="left:{left_pct:.6f}%;width:{width_pct:.6f}%;background:{fill};border-color:{border}" 
                      data-tip="{r.tip.replace('"','&quot;')}" data-lshort="{r.label_short.replace('"','&quot;')}" data-lfull ="{r.label_full.replace('"','&quot;')}"><div class="bar-text"></div></div>''')
        a = agg.get(emp)
        if a is not None:
            stats = (f"<span class='s1'>{int(a.runs)} runs {a.total_mins:.0f} m</span>"+f"<span class='s2'>{(a.uph_total if pd.notna(a.uph_total) else float('nan')):.1f} UPH</span>").replace('nan','-')
            uph_total = a.uph_total if pd.notna(a.uph_total) else float('nan'); runs=int(a.runs)
        else:
            stats = "<span>0 runs 0 m</span><span>- UPH</span>"; uph_total=float('nan'); runs=0
        disp = (emp if len(str(emp))<=8 else (str(emp)[:8]+'…'))
        rows.append(f"""
          <div class=\"row\" data-id=\"{idx}\" data-emp=\"{emp.lower()}\" data-start=\"{first_start_min:.6f}\" data-uph=\"{(uph_total if not np.isnan(uph_total) else -1):.6f}\" data-runs=\"{runs}\">\n
            <div class=\"cell left freeze-left\">\n              <div class=\"emp-name\">{disp}</div>\n              <div class=\"emp-stats\">{stats}</div>\n            </div>\n
            <div class=\"cell right\">\n              <div class=\"track\" style=\"width:var(--timeline-w)\">{''.join(bars)}{vlines}</div>\n            </div>\n          </div>\n        """)
    rows_html=''.join(rows)
    from string import Template as T
    html_tpl = TEMPLATE_HTML if 'TEMPLATE_HTML' in globals() else '<html><body><pre>Template missing</pre></body></html>'
    html = T(html_tpl).safe_substitute(date=date_str, base_width=base_width_px, ticks=ticks_html, rows=rows_html)
    return html

def process_xlsb(buf, store='1545'):
    import pandas as pd
    bio = BytesIO(bytes(buf))
    df = pd.read_excel(bio, sheet_name='Run Details', engine='pyxlsb')
    df, d0, d1, ds = preprocess(df, store=store)
    return build_html(df, d0, d1, ds)
`
