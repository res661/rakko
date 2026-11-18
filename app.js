/* Token check — one tap score */
(function () {
  'use strict';

  const TG = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
  const PLATFORM = (TG && TG.platform) || (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.platform) || 'web';
  const IS_DESKTOP = /tdesktop|macos|web|win/i.test(PLATFORM);

  const APP_VER = 'ios';

  const K = {
    ob: 'tc.onboard.v1', saved: 'tc.saved.v1', stats: 'tc.stats.v1',
    theme: 'tc.theme.v1', lang: 'tc.lang.v1', black: 'tc.black.v1'
  };

  const S = {
    tab: 'scan',
    saved: read(K.saved, []),
    stats: read(K.stats, { scans: 0 }),
    lang: null,
    black: read(K.black, { devs: {}, tokens: {} }),
    notify: read('tc.notify', true),
    autoUpd: read('tc.auto', true),
    hideMoney: read('tc.hide', false),
    quota: read('tc.quota', { hour: [], day: [] }),
    plan: read('tc.plan', 'free'),
    wallets: read('tc.wallets', []),
    checks: read('tc.checks', []),
    custom: read('tc.custom.v1', { active: 'reactive', items: [], seen: false }),
    alertPrefs: read('tc.alertPrefs', { score: true, liq: true, price: true, risky: true, wallet: true, scoreN: 10, liqN: 30, priceN: 40 }),
    alertLog: read('tc.alertLog', []),
    creators: read('tc.creators', {}),
    walletAlerts: read('tc.walletAlerts', []),
    ui: read('tc.ui', { trend: true, recent: true, quota: true, anim: true, big: true }),
    planUntil: read('tc.planUntil', 0),
    result: null,
    resultOpen: false,
    suppressResult: false,
    busy: false,
    error: '',
    lastMint: ''
  };

  /* ---------------- storage ---------------- */
  function read(key, fb) { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fb; } catch (e) { return fb; } }
  function write(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) {} }

  /* ---------------- i18n ---------------- */
  const D = {
    ru: {
      checkTab: 'Проверка', savedTab: 'Список', profileTab: 'Профиль',
      pasteTitle: 'Проверь монету', pasteSub: 'Вставь адрес — получишь оценку от 0 до 100 и поймёшь, стоит ли рисковать.',
      ph: 'Адрес контракта Solana', paste: 'Вставить', check: 'Проверить', checking: 'Проверяю…',
      howTitle: 'Как читать оценку',
      how: '70–100 — низкий риск. 40–69 — средний. 0–39 — высокий. Оценка не гарантия.',
      result: 'Результат', why: 'Почему такой балл', save: 'В список', again: 'Проверить другую',
      liq: 'Ликвидность', holders: 'Распределение', dev: 'Дев и бандлы', contract: 'Контракт',
      activity: 'Активность', age: 'Возраст', price: 'Цена за 24ч', links: 'Ссылки',
      good: 'Низкий риск', mid: 'Средний риск', bad: 'Высокий риск', of100: 'из 100',
      priceL: 'цена', liqL: 'ликвидность', volL: 'объём 24ч',
      emptyTitle: 'Список пуст', emptyText: 'Проверь монету и сохрани её — оценка останется здесь.',
      tapCoin: 'Нажми, чтобы проверить заново',
      scanned: 'проверок', savedN: 'сохранено',
      theme: 'Тема', themeAuto: 'Системная', themeDark: 'Тёмная', themeLight: 'Светлая',
      langRow: 'Язык', clear: 'Очистить список', cleared: 'Список очищен',
      savedToast: 'Сохранено', guest: 'Гость', noUser: 'без username',
      about: 'Данные: DexScreener, Rugcheck. Только чтение, без доступа к кошельку. Оценка — не гарантия.',
      errAddr: 'Не похоже на адрес Solana (32–44 символа)', notFound: 'Монета не найдена',
      fewData: 'Мало данных — оценка приблизительная', fail: 'Ошибка: ', noClip: 'Нет доступа к буферу',
      next: 'Дальше', start: 'Начать', skip: 'Пропустить',
      ob1t: 'Одна кнопка.\nОдна оценка.', ob1p: 'Вставь адрес монеты — и получишь балл от 0 до 100. Без таблиц и двадцати вкладок.',
      ob2t: 'Восемь проверок\nв одном числе.', ob2p: 'Ликвидность, холдеры, дев-кошелёк, контракт, активность, возраст, цена, ссылки.',
      ob3t: 'Сохраняй\nи перепроверяй.', ob3p: 'Список монет с оценками — чтобы видеть, что изменилось за день.',
      obCardK: 'ОЦЕНКА', obCardS: 'из 8 блоков',
      verdictK: 'Уровень', vCan: 'Низкий риск', vRisk: 'Средний риск', vNo: 'Высокий риск',
      checksK: 'Проверки', scanning: 'Проверяю монету…'
    },
    en: {
      checkTab: 'Check', savedTab: 'Saved', profileTab: 'Profile',
      pasteTitle: 'Check a token', pasteSub: 'Paste the address — get a score from 0 to 100 and know whether it is worth the risk.',
      ph: 'Solana contract address', paste: 'Paste', check: 'Check', checking: 'Checking…',
      howTitle: 'How to read the score',
      how: '70–100 — low risk. 40–69 — medium. 0–39 — high. The score is not a guarantee.',
      result: 'Result', why: 'Why this score', save: 'Save', again: 'Check another',
      liq: 'Liquidity', holders: 'Distribution', dev: 'Dev & bundles', contract: 'Contract',
      activity: 'Activity', age: 'Age', price: '24h price', links: 'Links',
      good: 'Low risk', mid: 'Medium risk', bad: 'High risk', of100: 'of 100',
      priceL: 'price', liqL: 'liquidity', volL: '24h volume',
      emptyTitle: 'Nothing saved', emptyText: 'Check a token and save it — the score stays here.',
      tapCoin: 'Tap to re-check',
      scanned: 'checks', savedN: 'saved',
      theme: 'Theme', themeAuto: 'System', themeDark: 'Dark', themeLight: 'Light',
      langRow: 'Language', clear: 'Clear list', cleared: 'List cleared',
      savedToast: 'Saved', guest: 'Guest', noUser: 'no username',
      about: 'Data: DexScreener, Rugcheck. Read-only, no wallet access. Score is not a guarantee.',
      errAddr: 'Not a Solana address (32–44 chars)', notFound: 'Token not found',
      fewData: 'Not enough data — score is approximate', fail: 'Error: ', noClip: 'No clipboard access',
      next: 'Next', start: 'Start', skip: 'Skip',
      ob1t: 'One button.\nOne score.', ob1p: 'Paste a token address and get a number from 0 to 100. No spreadsheets, no twenty tabs.',
      ob2t: 'Eight checks\nin one number.', ob2p: 'Liquidity, holders, dev wallet, contract, activity, age, price, links.',
      ob3t: 'Save it.\nRe-check it.', ob3p: 'A list of tokens with scores, so you can see what changed.',
      obCardK: 'SCORE', obCardS: 'across 8 blocks',
      verdictK: 'Level', vCan: 'Low risk', vRisk: 'Medium risk', vNo: 'High risk',
      checksK: 'Checks', scanning: 'Checking the token…'
    }
  };
  const t = (k) => (D[S.lang] && D[S.lang][k]) || D.ru[k] || k;
  function detectLang() {
    const saved = read(K.lang, null);
    if (saved === 'ru' || saved === 'en') return saved;
    const code = (TG && TG.initDataUnsafe && TG.initDataUnsafe.user && TG.initDataUnsafe.user.language_code) || navigator.language || '';
    return /^ru/i.test(code) ? 'ru' : 'en';
  }

  /* ---------------- helpers ---------------- */
  const $ = (s, r) => (r || document).querySelector(s);
  const app = document.getElementById('app');
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const usd = (n) => {
    if (S.hideMoney) return '••••';
    n = Number(n); if (!isFinite(n) || n <= 0) return '—';
    if (n >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
    if (n >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M';
    if (n >= 1e3) return '$' + (n / 1e3).toFixed(1) + 'K';
    return '$' + n.toFixed(2);
  };
  const price = (n) => {
    if (S.hideMoney) return '••••';
    n = Number(n); if (!isFinite(n) || n <= 0) return '—';
    if (n >= 1) return '$' + n.toFixed(2);
    if (n >= 0.01) return '$' + n.toFixed(4);
    return '$' + n.toPrecision(4);
  };
  const num = (n) => { n = Number(n); if (!isFinite(n)) return '—'; return n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(1) + 'K' : String(n); };
  const pct = (n) => (isFinite(Number(n)) ? (Number(n) >= 0 ? '+' : '') + Number(n).toFixed(1) + '%' : '—');
  const c01 = (n) => Math.max(0, Math.min(1, n));
  function haptic(kind) {
    if (!TG || !TG.HapticFeedback) return;
    try {
      if (kind === 'ok') TG.HapticFeedback.notificationOccurred('success');
      else if (kind === 'err') TG.HapticFeedback.notificationOccurred('error');
      else TG.HapticFeedback.impactOccurred('light');
    } catch (e) {}
  }
  function toast(msg) {
    let el = $('.toast');
    if (!el) { el = document.createElement('div'); el.className = 'toast'; document.body.appendChild(el); }
    el.textContent = msg;
    requestAnimationFrame(() => el.classList.add('show'));
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove('show'), 2000);
  }

  /* ---------------- theme ---------------- */
  function applyTheme() {
    document.documentElement.dataset.theme = 'dark';
    const bg = '#000000';
    const meta = document.querySelector('meta[name=theme-color]');
    if (meta) meta.setAttribute('content', bg);
    if (TG && TG.setHeaderColor) { try { TG.setHeaderColor(bg); } catch (e) {} }
    if (TG && TG.setBackgroundColor) { try { TG.setBackgroundColor(bg); } catch (e) {} }
    if (TG && TG.setBottomBarColor) { try { TG.setBottomBarColor(bg); } catch (e) {} }
  }
  function applyInsets() {
    if (!TG) return;
    const s = TG.safeAreaInset || {};
    const c = TG.contentSafeAreaInset || {};
    const st = document.documentElement.style;
    function put(name, v) {
      if (typeof v === 'number' && isFinite(v) && v > 0) st.setProperty(name, v + 'px');
    }
    put('--tg-safe-area-inset-top', s.top);
    put('--tg-safe-area-inset-bottom', s.bottom);
    put('--tg-safe-area-inset-left', s.left);
    put('--tg-safe-area-inset-right', s.right);
    put('--tg-content-safe-area-inset-top', c.top);
    put('--tg-content-safe-area-inset-bottom', c.bottom);
    put('--tg-content-safe-area-inset-left', c.left);
    put('--tg-content-safe-area-inset-right', c.right);
    const reported = (Number(s.top) || 0) + (Number(c.top) || 0);
    if (TG.isFullscreen && reported < 100) {
      st.setProperty('--tg-content-safe-area-inset-top', Math.max(Number(c.top) || 0, 112 - (Number(s.top) || 0)) + 'px');
    }
  }

  /* ---------------- data ---------------- */
  function isAddr(s) { return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(String(s || '').trim()); }
  async function getJson(url, ms) {
    const c = new AbortController();
    const id = setTimeout(() => c.abort(), ms || 7000);
    try {
      const r = await fetch(url, { signal: c.signal, headers: { accept: 'application/json' } });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return await r.json();
    } finally { clearTimeout(id); }
  }
  const SRC_TTL = { dex: 30000, rug: 600000, gp: 3600000, gt: 600000, pump: 1800000 };
  const rawCache = read('tc.rawcache', {});

  function cacheGet(mint, src) {
    const c = rawCache[mint] && rawCache[mint][src];
    if (!c) return null;
    if (Date.now() - c.at > (SRC_TTL[src] || 60000)) return null;
    return c.data;
  }
  function cachePut(mint, src, data) {
    rawCache[mint] = rawCache[mint] || {};
    rawCache[mint][src] = { at: Date.now(), data: data };
    try { write('tc.rawcache', rawCache); } catch (e) {}
  }

  async function loadFast(mint) {
    const out = { mint: mint, dex: cacheGet(mint, 'dex'), rug: null, gt: null, gp: null, pump: null };
    if (!out.dex) {
      out.dex = await getJson('https://api.dexscreener.com/latest/dex/tokens/' + encodeURIComponent(mint), 5000).catch(() => null);
      if (out.dex) cachePut(mint, 'dex', out.dex);
    }
    return out;
  }

  async function loadSlow(mint, into) {
    const jobs = [];
    if (!into.rag) {}
    if (!into.rug) {
      const c = cacheGet(mint, 'rug');
      if (c) into.rug = c;
      else jobs.push(getJson('https://api.rugcheck.xyz/v1/tokens/' + encodeURIComponent(mint) + '/report', 3500)
        .then((d) => { into.rug = d; cachePut(mint, 'rug', d); }).catch(() => {}));
    }
    if (!into.gp) {
      const c = cacheGet(mint, 'gp');
      if (c) into.gp = c;
      else jobs.push(getJson('https://api.gopluslabs.io/api/v1/solana/token_security?contract_addresses=' + encodeURIComponent(mint), 3500)
        .then((d) => { into.gp = d; cachePut(mint, 'gp', d); }).catch(() => {}));
    }
    // GeckoTerminal is lazy-loaded on demand (see loadGecko)
    await Promise.all(jobs);
    return into;
  }

  async function loadGecko(mint) {
    const c = cacheGet(mint, 'gt');
    if (c) return c;
    const d = await getJson('https://api.geckoterminal.com/api/v2/networks/solana/tokens/' + encodeURIComponent(mint), 3000).catch(() => null);
    if (d) cachePut(mint, 'gt', d);
    return d;
  }

  async function loadRaw(mint) {
    const out = { mint: mint, dex: null, rug: null, gt: null, gp: null, pump: null };
    await Promise.all([
      getJson('https://api.dexscreener.com/latest/dex/tokens/' + encodeURIComponent(mint)).then((d) => { out.dex = d; }).catch(() => {}),
      getJson('https://api.rugcheck.xyz/v1/tokens/' + encodeURIComponent(mint) + '/report').then((d) => { out.rug = d; }).catch(() => {}),
      getJson('https://api.geckoterminal.com/api/v2/networks/solana/tokens/' + encodeURIComponent(mint), 6000).then((d) => { out.gt = d; }).catch(() => {}),
      getJson('https://api.gopluslabs.io/api/v1/solana/token_security?contract_addresses=' + encodeURIComponent(mint), 6000).then((d) => { out.gp = d; }).catch(() => {}),
      getJson('https://frontend-api.pump.fun/coins/' + encodeURIComponent(mint), 5000).then((d) => { out.pump = d; }).catch(() => {})
    ]);
    return out;
  }
  function bestPair(dex) {
    const list = (dex && dex.pairs) || [];
    return list.slice().sort((a, b) => (Number(b.liquidity && b.liquidity.usd) || 0) - (Number(a.liquidity && a.liquidity.usd) || 0))[0] || null;
  }

  /* ---------------- scoring ---------------- */
  function txWin(pair, key) {
    const t = pair && pair.txns && pair.txns[key];
    if (!t) return null;
    return { b: Number(t.buys) || 0, s: Number(t.sells) || 0 };
  }
  function readLpLocked(rug) {
    const NULL_MINT = '11111111111111111111111111111111';
    const markets = (rug && rug.markets) || [];
    let weighted = 0, weight = 0;
    markets.forEach(function (m) {
      const lp = m && m.lp;
      if (!lp) return;
      const mint = String(lp.lpMint || '');
      if (!mint || mint === NULL_MINT) return;
      if (lp.lpLockedPct === undefined || lp.lpLockedPct === null || lp.lpLockedPct === '') return;
      const pct = Number(lp.lpLockedPct);
      if (!isFinite(pct)) return;
      const supply = Number(lp.lpTotalSupply) || 0;
      const lockedUsd = Number(lp.lpLockedUSD) || 0;
      if (supply <= 0 && pct === 0 && lockedUsd <= 0) return;
      const w = Math.max(1, Math.abs(Number(lp.quoteUSD) || 0) + Math.abs(Number(lp.baseUSD) || 0));
      weighted += pct * w;
      weight += w;
    });
    return weight ? weighted / weight : null;
  }
  function liqOfFdv(tk) {
    if (!tk || !tk.fdv || !tk.liq) return null;
    const pct = tk.liq / tk.fdv * 100;
    return isFinite(pct) ? pct : null;
  }
  function fmtPctSmall(pct, ru) {
    if (pct == null || !isFinite(pct)) return null;
    if (pct > 0 && pct < 0.1) return ru ? '<0,1%' : '<0.1%';
    if (pct < 10) {
      const s = (Math.round(pct * 10) / 10).toFixed(1);
      return (ru ? s.replace('.', ',') : s) + '%';
    }
    return Math.round(pct) + '%';
  }
  function scoreToken(raw) {
    const pair = bestPair(raw.dex);
    const rug = raw.rug || {};
    const b = [];
    const liq = Number(pair && pair.liquidity && pair.liquidity.usd) || 0;
    const fdv = Number(pair && pair.fdv) || Number(pair && pair.marketCap) || 0;
    const vol = Number(pair && pair.volume && pair.volume.h24) || 0;

    if (liq > 0) {
      let s = liq < 15000 ? 0.08 : liq < 40000 ? 0.35 : liq < 120000 ? 0.65 : liq < 400000 ? 0.88 : 1;
      const ratio = fdv > 0 ? liq / fdv : 0.1;
      if (ratio < 0.03 && liq < 500000) s *= 0.65;
      b.push({ k: 'liq', w: 20, s, info: usd(liq) + (fdv ? ' · ' + Math.round(ratio * 100) + '% of FDV' : '') });
    }

    const holders = rug.topHolders || [];
    const totalH = Number(rug.totalHolders) || 0;
    if (holders.length || totalH) {
      const top10 = holders.slice(0, 10).reduce((a, h) => a + (Number(h.pct) || 0), 0);
      let s = top10 > 80 ? 0.05 : top10 > 60 ? 0.25 : top10 > 45 ? 0.55 : top10 > 30 ? 0.8 : 0.95;
      if (totalH && totalH < 100) s *= 0.5;
      if (totalH > 5000) s = Math.min(1, s * 1.08);
      b.push({ k: 'holders', w: 15, s: c01(s), info: (totalH ? num(totalH) + ' holders · ' : '') + 'top-10 ' + Math.round(top10) + '%' });
    }

    const risks = (rug.risks || []);
    const norm = Number(rug.score_normalised);
    if (risks.length || isFinite(norm)) {
      let s = isFinite(norm) ? c01(1 - norm / 100) : 0.6;
      const bad = risks.filter((r) => /danger|high/i.test(String(r.level))).length;
      const warn = risks.filter((r) => /warn|medium/i.test(String(r.level))).length;
      s = c01(s - bad * 0.18 - warn * 0.07);
      const names = risks.filter((r) => /danger|high/i.test(String(r.level))).map((r) => String(r.name)).slice(0, 2);
      b.push({ k: 'dev', w: 20, s, info: names.length ? names.join(', ') : t('mid') === 'Risky' ? 'no critical risks' : 'критичных рисков нет' });
    }

    if (rug.mintAuthority !== undefined || rug.freezeAuthority !== undefined) {
      let s = 1; const notes = [];
      if (rug.mintAuthority) { s -= 0.5; notes.push(t('contract') === 'Contract' ? 'mint open' : 'минт открыт'); }
      if (rug.freezeAuthority) { s -= 0.35; notes.push(t('contract') === 'Contract' ? 'freeze on' : 'заморозка'); }
      b.push({ k: 'contract', w: 15, s: c01(s), info: notes.length ? notes.join(' · ') : (t('contract') === 'Contract' ? 'authorities revoked' : 'полномочия отозваны') });
    }

    if (vol > 0) {
      const turn = liq > 0 ? vol / liq : 0;
      const s = turn < 0.05 ? 0.3 : turn < 0.2 ? 0.6 : turn < 0.6 ? 0.8 : turn < 2 ? 0.95 : turn < 6 ? 1 : 0.7;
      b.push({ k: 'activity', w: 10, s: c01(s), info: usd(vol) + ' · ×' + turn.toFixed(1) });
    }

    const created = Number(pair && pair.pairCreatedAt) || 0;
    if (created > 0) {
      const h = (Date.now() - created) / 36e5;
      const s = h < 1 ? 0.15 : h < 6 ? 0.35 : h < 24 ? 0.6 : h < 72 ? 0.8 : 1;
      const txt = h < 1 ? Math.round(h * 60) + 'm' : h < 48 ? Math.round(h) + 'h' : Math.round(h / 24) + 'd';
      b.push({ k: 'age', w: 10, s, info: txt });
    }

    const ch = Number(pair && pair.priceChange && pair.priceChange.h24);
    if (isFinite(ch)) {
      let s = ch > -25 ? 0.8 : ch > -50 ? 0.5 : ch > -75 ? 0.25 : 0.1;
      if (ch > 400) s -= 0.3;
      b.push({ k: 'price', w: 5, s: c01(s), info: pct(ch) });
    }

    const info = (pair && pair.info) || {};
    if (pair) {
      const links = (info.socials || []).length + (info.websites || []).length;
      b.push({ k: 'links', w: 5, s: links >= 2 ? 1 : links === 1 ? 0.6 : 0.15, info: links ? String(links) : '—' });
    }

    const tw = b.reduce((a, x) => a + x.w, 0);
    const score = tw ? Math.round(b.reduce((a, x) => a + x.s * x.w, 0) / tw * 100) : 0;
    const worst = b.slice().sort((x, y) => x.s - y.s).filter((x) => x.s < 0.65).slice(0, 3);
    const reasons = (worst.length ? worst : b.slice().sort((x, y) => x.s - y.s).slice(0, 2)).map((x) => t(x.k) + ' · ' + x.info);

    return {
      score, blocks: b, reasons,
      token: {
        mint: raw.mint,
        symbol: (pair && pair.baseToken && pair.baseToken.symbol) || 'TOKEN',
        name: (pair && pair.baseToken && pair.baseToken.name) || '',
        image: info.imageUrl || '',
        price: Number(pair && pair.priceUsd) || 0,
        liq, vol,
        fdv: Number(pair && pair.fdv) || 0,
        mc: Number(pair && pair.marketCap) || 0,
        ch24: Number(pair && pair.priceChange && pair.priceChange.h24) || 0,
        ch6: Number(pair && pair.priceChange && pair.priceChange.h6) || 0,
        ch1: Number(pair && pair.priceChange && pair.priceChange.h1) || 0,
        ch5: Number(pair && pair.priceChange && pair.priceChange.m5) || 0,
        buys: Number(pair && pair.txns && pair.txns.h24 && pair.txns.h24.buys) || 0,
        sells: Number(pair && pair.txns && pair.txns.h24 && pair.txns.h24.sells) || 0,
        tx24: txWin(pair, 'h24'),
        tx6: txWin(pair, 'h6'),
        tx1: txWin(pair, 'h1'),
        tx5: txWin(pair, 'm5'),
        dex: (pair && pair.dexId) || '',
        pairAddr: (pair && pair.pairAddress) || '',
        created: Number(pair && pair.pairCreatedAt) || 0,
        holders: Number(rug.totalHolders) || 0,
        top: (rug.topHolders || []).slice(0, 5).map((h) => ({ addr: String(h.address || h.owner || ''), pct: Number(h.pct) || 0 })),
        risks: (rug.risks || []).slice(0, 6).map((r) => ({ name: String(r.name || ''), level: String(r.level || ''), desc: String(r.description || '') })),
        mutable: rug.risks ? (rug.risks || []).some(function (r) { return /mutable|metadata/i.test(String(r.name || '') + ' ' + String(r.description || '')); }) : null,
        holderPrev: (function () {
          const prev = (S.checks || []).find(function (x) { return x.mint === raw.mint; });
          return prev && prev.holders ? prev.holders : null;
        })(),
        devPrev: (function () {
          const prev = (S.checks || []).find(function (x) { return x.mint === raw.mint; });
          return prev && prev.dev != null ? prev.dev : null;
        })(),
        rugScore: Number(rug.score_normalised),
        mintAuth: rug.mintAuthority === undefined ? null : !!rug.mintAuthority,
        freezeAuth: rug.freezeAuthority === undefined ? null : !!rug.freezeAuthority,
        creator: String(rug.creator || ''),
        creatorBalance: (function () {
          const cb = rug.creatorBalance;
          const v = typeof cb === 'object' && cb !== null ? Number(cb.uiAmount || cb.amount || 0) : Number(cb || 0);
          const supply = Number(rug.token && rug.token.supply) || 0;
          return { amount: v, pct: supply > 0 ? (v / supply * 100) : 0 };
        })(),
        transferFee: (function () {
          const ext = rug.token_extensions || {};
          const fee = ext.transferFeeConfig || ext.transfer_fee_config;
          if (!fee) return null;
          const bps = Number(fee.transferFeeBasisPoints || fee.transfer_fee_basis_points || 0);
          return bps > 0 ? bps / 100 : 0;
        })(),
        top1: (rug.topHolders && rug.topHolders[0]) ? Number(rug.topHolders[0].pct) || 0 : 0,
        top10: holders.slice(0, 10).reduce((a, h) => a + (Number(h.pct) || 0), 0),
        socials: (info.socials || []).map((s) => ({ type: s.type, url: s.url })),
        sites: (info.websites || []).map((s) => s.url),
        url: (pair && pair.url) || '',
        lpLocked: readLpLocked(rug),
        pump: raw.pump && raw.pump.symbol ? { complete: !!raw.pump.complete, curve: Number(raw.pump.virtual_sol_reserves) || 0, replies: Number(raw.pump.reply_count) || 0 } : null,
        gtReserve: Number(raw.gt && raw.gt.data && raw.gt.data.attributes && raw.gt.data.attributes.total_reserve_in_usd) || 0,
        gtVol: Number(raw.gt && raw.gt.data && raw.gt.data.attributes && raw.gt.data.attributes.volume_usd && raw.gt.data.attributes.volume_usd.h24) || 0,
        gtMc: Number(raw.gt && raw.gt.data && raw.gt.data.attributes && raw.gt.data.attributes.market_cap_usd) || 0,
        gp: (function () {
          const m = raw.gp && raw.gp.result ? raw.gp.result[Object.keys(raw.gp.result)[0]] : null;
          if (!m) return null;
          return {
            honeypot: String(m.is_honeypot || '') === '1',
            mintable: Number(m.is_mintable) === 1,
            freezable: Number(m.freezable) === 1,
            ownerRenounced: Number(m.owner_renounced) === 1,
            buyTax: m.buy_tax, sellTax: m.sell_tax,
            holders: Number(m.holder_count) || 0,
            lp: Number(m.lp_holder_count) || 0
          };
        })()
      },
      at: Date.now()
    };
  }

  /* ---------------- ui parts ---------------- */

  const ART = {
    shield: '<svg viewBox="0 0 120 120" fill="none"><path d="M60 14l34 12v26c0 22-14 40-34 50-20-10-34-28-34-50V26l34-12z" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><path d="M46 60l10 10 20-22" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    gauge: '<svg viewBox="0 0 120 120" fill="none"><path d="M18 84a42 42 0 1 1 84 0" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><path d="M60 84l22-26" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><circle cx="60" cy="84" r="5" fill="currentColor"/><path d="M22 64h10M88 64h10M60 26v10" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>',
    layers: '<svg viewBox="0 0 120 120" fill="none"><path d="M60 20l40 20-40 20-40-20 40-20z" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><path d="M20 60l40 20 40-20M20 80l40 20 40-20" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/></svg>',
    list: '<svg viewBox="0 0 120 120" fill="none"><rect x="24" y="24" width="72" height="16" rx="8" stroke="currentColor" stroke-width="3"/><rect x="24" y="52" width="72" height="16" rx="8" stroke="currentColor" stroke-width="3"/><rect x="24" y="80" width="44" height="16" rx="8" stroke="currentColor" stroke-width="3"/></svg>'
  };


  const BICON = {
    liq: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c3.5 4.2 6 7.2 6 10a6 6 0 1 1-12 0c0-2.8 2.5-5.8 6-10z"/></svg>',
    holders: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="9" r="3.2"/><path d="M3.5 20a5.5 5.5 0 0 1 11 0"/><path d="M16 6.5a3 3 0 0 1 0 5.6"/><path d="M17.5 20a5 5 0 0 0-2-4"/></svg>',
    dev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 8 4 12l4 4M16 8l4 4-4 4"/><path d="M13 5l-2 14"/></svg>',
    contract: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="3" width="14" height="18" rx="3"/><path d="M9 8h6M9 12h6M9 16h3"/></svg>',
    activity: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17l5-6 4 4 5-8 4 5"/></svg>',
    age: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
    price: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 16l5-5 3 3 7-7"/><path d="M15 7h4v4"/></svg>',
    links: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a4 4 0 0 0 5.7 0l2.3-2.3a4 4 0 1 0-5.7-5.7L11 6.3"/><path d="M14 11a4 4 0 0 0-5.7 0L6 13.3a4 4 0 1 0 5.7 5.7L13 17.7"/></svg>'
  };

  const ICON_CHEV = '<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>';
  const ICON_EMPTY = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7.5 12 4l8 3.5v9L12 20l-8-3.5z"/><path d="M4 7.5 12 11l8-3.5M12 11v9"/></svg>';

  function top() { return ''; }

  const FREE_SAVED_LIMIT = 7;
  const FREE_PER_HOUR = 20;
  const FREE_PER_DAY = 20;
  const FREE_WATCH_N = 3;
  const FREE_ALERTS_DAY = 8;
  const PREMIUM_DAY_CAP = 1000;      // internal only, never shown
  const MIN_INTERVAL_FREE = 3000;    // ms between checks
  const MIN_INTERVAL_PREM = 1500;
  const BURST_WINDOW = 60000;        // 1 min
  const BURST_LIMIT = 15;            // more than 15 checks/min = script
  const CACHE_TTL = 30000;           // per-mint result cache

  const abuse = { stamps: [], cooldownUntil: 0, cache: {} };

  function quotaState() {
    const now = Date.now();
    const q = S.quota || { hour: [], day: [] };
    q.hour = (q.hour || []).filter(function (t) { return now - t < 3600e3; });
    q.day = (q.day || []).filter(function (t) { return now - t < 86400e3; });
    return q;
  }
  function quotaLeft() {
    const q = quotaState();
    if (S.plan === 'premium' && (!S.planUntil || S.planUntil > Date.now())) return { hour: 999, day: 999, resetMin: 0 };
    if (S.plan === 'premium' && q.day.length >= PREMIUM_DAY_CAP) return { hour: 0, day: 0, resetMin: 60 };
    let resetMin = 0;
    if (q.day.length) resetMin = Math.max(resetMin, Math.ceil((86400e3 - (Date.now() - q.day[0])) / 60000));
    if (q.hour.length) resetMin = Math.max(1, Math.ceil((3600e3 - (Date.now() - q.hour[0])) / 60000));
    if (q.day.length >= FREE_PER_DAY) resetMin = Math.max(1, Math.ceil((86400e3 - (Date.now() - q.day[0])) / 60000));
    return { hour: Math.max(0, FREE_PER_HOUR - q.hour.length), day: Math.max(0, FREE_PER_DAY - q.day.length), resetMin: resetMin };
  }
  function quotaConsume() {
    const q = quotaState();
    q.hour.push(Date.now()); q.day.push(Date.now());
    S.quota = q;
    write('tc.quota', q);
  }
  function quotaBlocked() {
    const L = quotaLeft();
    return L.hour <= 0 || L.day <= 0;
  }

  function fmtDate(ts) {
    if (!ts) return '—';
    const d = new Date(ts);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return dd + '.' + mm + '.' + d.getFullYear();
  }

  function ago(ts) {
    const m = Math.max(1, Math.round((Date.now() - ts) / 60000));
    if (m < 60) return (S.lang === 'ru' ? m + ' мин назад' : m + 'm ago');
    const h = Math.round(m / 60);
    return (S.lang === 'ru' ? h + ' ч назад' : h + 'h ago');
  }

  function motionOk() {
    if (S.ui.anim === false) return false;
    return !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }
  function dismiss(el, done) {
    if (!el) { if (done) done(); return; }
    if (!motionOk()) { el.remove(); if (done) done(); return; }
    el.classList.add('out');
    setTimeout(function () { if (el.parentNode) el.remove(); if (done) done(); }, 320);
  }
  function countUp(el, to, ms) {
    if (!el) return;
    if (!motionOk()) { el.innerHTML = String(to) + (arguments[3] || ''); return; }
    const dur = ms || 520;
    const start = performance.now();
    const from = 0;
    const tick = (now) => {
      const k = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - k, 3);
      el.innerHTML = String(Math.round(from + (to - from) * eased)) + (arguments[3] || '');
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  function verdict(score) {
    if (score >= 70) return { cls: 'good', label: t('good') };
    if (score >= 40) return { cls: 'mid', label: t('mid') };
    return { cls: 'bad', label: t('bad') };
  }
  function buildInsights(tk) {
    const prev = (S.saved || []).find(function (x) { return x.mint === tk.mint; }) || null;
    const ru = S.lang === 'ru';
    const out = [];
    const add = (tone, text, free) => out.push({ tone, text, free: !!free });
    const lowLiq = tk.liq > 0 && tk.liq < 10000;

    if (tk.gp && tk.gp.honeypot) add('bad', ru ? 'Honeypot: продать не получится. Не покупай.' : 'Honeypot: you will not be able to sell.', true);
    if (tk.mintAuth) add('bad', ru ? 'Минт открыт: создатель может напечатать токены в любой момент.' : 'Mint authority open: the dev can mint tokens anytime.', true);
    if (tk.freezeAuth) add('bad', ru ? 'Заморозка открыта: продажи могут заблокировать.' : 'Freeze authority open: sells can be blocked.', true);
    if (tk.gp && Number(tk.gp.buyTax) > 5) add('bad', ru ? 'Налог на покупку ' + tk.gp.buyTax + '% — почти всегда скам.' : 'Buy tax ' + tk.gp.buyTax + '% — almost always a scam.', true);
    if (tk.gp && Number(tk.gp.sellTax) > 5) add('bad', ru ? 'Налог на продажу ' + tk.gp.sellTax + '% — почти всегда скам.' : 'Sell tax ' + tk.gp.sellTax + '% — almost always a scam.', true);
    if (lowLiq) add('bad', ru ? 'Ликвидность меньше $10K — выйти без потерь почти невозможно.' : 'Liquidity under $10K — almost impossible to exit cleanly.', true);
    const fdvPct = liqOfFdv(tk);
    if (fdvPct != null && fdvPct < 1.5 && tk.liq < 50000) add('warn', ru ? 'Ликвидность — ' + fmtPctSmall(fdvPct, true) + ' от FDV, и сам пул меньше $50K.' : 'Liquidity is ' + fmtPctSmall(fdvPct, false) + ' of FDV, and the pool is under $50K.');
    if (tk.holders && tk.holders < 200) add('warn', ru ? 'Всего ' + num(tk.holders) + ' холдеров — легко манипулировать.' : 'Only ' + num(tk.holders) + ' holders — easy to manipulate.');
    const top10now = Number(tk.top10) || (tk.top || []).reduce(function (s, h) { return s + (h.pct || 0); }, 0);
    if (top10now > 50) add('warn', ru ? 'Топ-10 держат ' + Math.round(top10now) + '% — могут обрушить цену.' : 'Top-10 hold ' + Math.round(top10now) + '% — they can crash the price.', true);
    if (tk.created) {
      const h = (Date.now() - tk.created) / 36e5;
      if (h < 1) add('warn', ru ? 'Монете меньше часа — истории нет, всё может измениться.' : 'Less than an hour old — no history yet.');
      if (h > 24 * 30) add('good', ru ? 'Монета живёт ' + Math.round(h / 24) + ' дней — прошла проверку временем.' : 'Alive for ' + Math.round(h / 24) + ' days — survived the test of time.');
    }
    if (tk.ch24 <= -30) add('warn', ru ? 'Падение ' + pct(tk.ch24) + ' за 24ч — идёт дамп или потеря интереса.' : pct(tk.ch24) + ' in 24h — dumping or losing interest.');
    if (tk.ch24 >= 300) add('warn', ru ? 'Рост ' + pct(tk.ch24) + ' за 24ч — высокий риск войти на пике.' : pct(tk.ch24) + ' in 24h — high risk of buying the top.');
    if (tk.buys && tk.sells && tk.sells > tk.buys * 1.6) add('warn', ru ? 'Продаж в ' + (tk.sells / tk.buys).toFixed(1) + ' раза больше покупок.' : (tk.sells / tk.buys).toFixed(1) + '× more sells than buys.');
    if (tk.buys && tk.sells && tk.buys > tk.sells * 1.6 && tk.ch24 > 0) add('good', ru ? 'Покупают активнее, чем продают (' + tk.buys + ' / ' + tk.sells + ').' : 'Buy pressure dominates (' + tk.buys + ' / ' + tk.sells + ').');
    if (tk.gp && tk.gp.lp && tk.gp.lp <= 2) add('warn', ru ? 'Ликвидность в ' + tk.gp.lp + ' кошельке(ах) — пул могут вывести.' : 'Liquidity in ' + tk.gp.lp + ' wallet(s) — the pool can be pulled.', true);
    if (tk.lpLocked !== null && tk.lpLocked > 90) add('good', ru ? 'LP заблокирован на ' + Math.round(tk.lpLocked) + '% — пул нельзя вывести.' : 'LP locked ' + Math.round(tk.lpLocked) + '% — the pool cannot be pulled.');
    if (tk.lpLocked !== null && tk.lpLocked < 50) add('warn', ru ? 'LP заблокирован только на ' + Math.round(tk.lpLocked) + '% — разработчик может собрать ликвидность.' : 'LP locked only ' + Math.round(tk.lpLocked) + '% — the dev can pull liquidity.', true);
    if (tk.pump && !tk.pump.complete) add('info', ru ? 'Ещё на бондинг-кривой Pump.fun — не вышла на DEX.' : 'Still on the Pump.fun bonding curve — not on a DEX yet.');
    if (tk.pump && tk.pump.complete) add('good', ru ? 'Прошла градацию Pump.fun — есть внешний пул.' : 'Graduated from Pump.fun — has an external pool.');
    if (!tk.socials.length && !tk.sites.length) add('warn', ru ? 'Нет ссылок на сайт и соцсети — красный флаг.' : 'No website or socials — red flag.');
    if (tk.risks.length) tk.risks.slice(0, 2).forEach((r) => {
      const crit = /mint|freeze|honeypot|lp|liquid|unlock|owner|holder|dump|creator|insider|authority/i.test(String(r.name || ''));
      add('warn', riskRu(r.name), crit);
    });
    if (tk.creatorBalance && tk.creatorBalance.pct > 5) add('warn', ru ? 'У создателя ' + tk.creatorBalance.pct.toFixed(1) + '% supply — он может слить в любой момент.' : 'Creator holds ' + tk.creatorBalance.pct.toFixed(1) + '% of supply.', true);
    if (tk.creatorBalance && tk.creatorBalance.pct > 0 && tk.creatorBalance.pct <= 5) add('good', ru ? 'У создателя всего ' + tk.creatorBalance.pct.toFixed(2) + '% supply.' : 'Creator holds only ' + tk.creatorBalance.pct.toFixed(2) + '% of supply.');
    if (tk.transferFee !== null && tk.transferFee > 3) add('bad', ru ? 'Комиссия за перевод ' + tk.transferFee.toFixed(1) + '% — токен может съедать деньги при переводах.' : 'Transfer fee ' + tk.transferFee.toFixed(1) + '% — the token eats funds on transfers.', true);
    if (tk.transferFee === 0) add('good', ru ? 'Комиссии за перевод нет.' : 'No transfer fee.');
    if (tk.top1 > 15) add('warn', ru ? 'Один кошелёк держит ' + tk.top1.toFixed(1) + '% — это риск дампа.' : 'One wallet holds ' + tk.top1.toFixed(1) + '% — dump risk.', true);
    if (prev && prev.liq && tk.liq) {
      const dLiq = (tk.liq - prev.liq) / prev.liq * 100;
      if (dLiq <= -25) add('bad', ru ? 'Ликвидность упала на ' + Math.abs(Math.round(dLiq)) + '% с прошлой проверки — похоже на вывод пула.' : 'Liquidity dropped ' + Math.abs(Math.round(dLiq)) + '% since last check.', true);
      if (dLiq >= 40) add('good', ru ? 'Ликвидность выросла на ' + Math.round(dLiq) + '% с прошлой проверки.' : 'Liquidity grew ' + Math.round(dLiq) + '% since last check.');
    }
    if (tk.vol && tk.liq && tk.vol / tk.liq > 5) add('warn', ru ? 'Оборот в ' + (tk.vol / tk.liq).toFixed(1) + '× ликвидности — возможна накрутка объёма.' : 'Volume is ' + (tk.vol / tk.liq).toFixed(1) + '× liquidity — possible volume farming.');
    if (tk.ch24 && tk.ch24 < -60) add('bad', ru ? 'Монета потеряла ' + Math.abs(Math.round(tk.ch24)) + '% за сутки — идёт слив.' : 'Down ' + Math.abs(Math.round(tk.ch24)) + '% in 24h.', true);
    if (tk.creator && S.creators[tk.creator] && S.creators[tk.creator].n > 1) {
      const cn = S.creators[tk.creator].n;
      add(cn >= 4 ? 'bad' : 'warn', ru ? 'Этого создателя мы уже видели: ' + cn + ' монет.' : 'This creator appeared before: ' + cn + ' tokens.');
    }
    if (S.black.devs[tk.creator]) add('bad', ru ? 'Создатель в твоём чёрном списке — ты уже блокировал его.' : 'Creator is in your blacklist — you blocked them before.', true);
    if (S.black.tokens[tk.mint]) add('bad', ru ? 'Эта монета в твоём чёрном списке.' : 'This token is in your blacklist.', true);
    return out;
  }

  const RISK_RU = {
    'Low Liquidity': 'Мало ликвидности',
    'Low Amount of LP Providers': 'Мало поставщиков ликвидности',
    'Single holder ownership': 'Один кошелёк держит почти всё',
    'Top 10 holders high ownership': 'Топ-10 держат слишком много',
    'High Ownership': 'Высокая концентрация у владельца',
    'Mint Authority Enabled': 'Минт не отозван',
    'Freeze Authority Enabled': 'Заморозка не отозвана',
    'Copycat Token': 'Копия известного токена',
    'Mutable metadata': 'Метаданные можно менять',
    'Honeypot': 'Ловушка (нельзя продать)',
    'Transfer Fee': 'Комиссия за перевод',
    'Non-transferable': 'Токен нельзя переводить',
    'Balance mutable authority': 'Можно менять балансы',
    'Closable': 'Аккаунт можно закрыть',
    'Default account state': 'Аккаунты по умолчанию заморожены',
    'Freeze authority': 'Заморозка активна',
    'Mint authority': 'Минт активен',
    'Low Volume': 'Низкий объём торгов',
    'Low 24h Volume': 'Низкий объём за 24ч',
    'High Supply Concentration': 'Высокая концентрация supply'
  };

  function riskRu(name) {
    if (!name) return '';
    if (S.lang !== 'ru') return name;
    if (RISK_RU[name]) return RISK_RU[name];
    let t2 = String(name);
    const parts = [
      [/mint authority/gi, 'минт активен'],
      [/freeze authority/gi, 'заморозка активна'],
      [/low liquidity/gi, 'мало ликвидности'],
      [/top 10 holders/gi, 'топ-10 держат много'],
      [/high ownership/gi, 'высокая концентрация'],
      [/single holder/gi, 'один кошелёк держит всё'],
      [/copycat/gi, 'копия токена'],
      [/mutable/gi, 'можно менять'],
      [/honeypot/gi, 'ловушка'],
      [/transfer fee/gi, 'комиссия за перевод'],
      [/low volume/gi, 'низкий объём'],
      [/insider/gi, 'инсайдеры'],
      [/bundl/gi, 'бандлы']
    ];
    parts.forEach(function (p) { t2 = t2.replace(p[0], p[1]); });
    return t2;
  }

  function blockHints(k, tk, b) {
    const ru = S.lang === 'ru';
    const out = [];
    const p = b ? b.s : 1;
    const liq = tk.liq || 0;
    const ch = tk.ch24 || 0;
    const turn = (tk.vol && liq) ? tk.vol / liq : 0;
    const top10 = (tk.top || []).slice(0, 10).reduce(function (s, h) { return s + (h.pct || 0); }, 0);
    const ageH = tk.created ? (Date.now() - tk.created) / 36e5 : 0;

    if (k === 'liq') {
      if (liq && liq < 3000) out.push(ru ? 'Ликвидности почти нет: продать даже небольшую сумму не получится — цена рухнет от твоей же продажи.' : 'Almost no liquidity: your own sell would crash the price.');
      else if (liq && liq < 15000) out.push(ru ? 'Ликвидность ниже $15K. Это «микро-пул»: одна крупная продажа обнулит цену.' : 'Liquidity under $15K: one big sell wipes the price.');
      else if (liq && liq < 60000) out.push(ru ? 'Ликвидность средняя: выйти можно, но при панике проскальзывание будет заметным.' : 'Mid liquidity: you can exit, but slippage hurts in a panic.');
      else if (liq > 1000000) out.push(ru ? 'Глубокий пул: цена устойчива, крупные сделки почти не двигают график.' : 'Deep pool: price is stable to large trades.');
      const fdvPct = liqOfFdv(tk);
      if (fdvPct != null && fdvPct < 1.5 && liq < 50000) out.push(ru ? 'Ликвидность — ' + fmtPctSmall(fdvPct, true) + ' от FDV, и пул меньше $50K.' : 'Liquidity is ' + fmtPctSmall(fdvPct, false) + ' of FDV, and the pool is under $50K.');
      if (tk.lpLocked !== null && tk.lpLocked < 30) out.push(ru ? 'LP заблокирован на ' + Math.round(tk.lpLocked) + '%: разработчик может забрать ликвидность.' : 'LP locked ' + Math.round(tk.lpLocked) + '%: the dev can pull liquidity.');
    }

    if (k === 'holders') {
      if (tk.holders && tk.holders < 100) out.push(ru ? 'Меньше 100 холдеров: рынок состоит из нескольких людей, цену двигает один кошелёк.' : 'Under 100 holders: a handful of wallets move the price.');
      if (top10 > 60) out.push(ru ? 'Топ-10 держат ' + Math.round(top10) + '% — фактически это закрытый клуб, они решают судьбу цены.' : 'Top-10 hold ' + Math.round(top10) + '% — they decide the price.');
      if (tk.top1 > 20) out.push(ru ? 'Один кошелёк держит ' + tk.top1.toFixed(1) + '%. Одна продажа — и минус треть капитализации.' : 'One wallet holds ' + tk.top1.toFixed(1) + '% — one sell kills a third of the cap.');
      if (tk.holders > 5000) out.push(ru ? 'Больше 5 000 холдеров — распределение здоровое, манипулировать сложно.' : 'Over 5,000 holders — healthy distribution.');
    }

    if (k === 'dev') {
      if (tk.gp && tk.gp.honeypot) out.push(ru ? 'Honeypot подтверждён: покупка проходит, продажа — нет. Это 100% потеря.' : 'Confirmed honeypot: buys pass, sells do not.');
      if (tk.creatorBalance && tk.creatorBalance.pct > 10) out.push(ru ? 'У создателя ' + tk.creatorBalance.pct.toFixed(1) + '% supply — он может слить в стакан в любой момент.' : 'Creator holds ' + tk.creatorBalance.pct.toFixed(1) + '% — can dump anytime.');
      if (tk.risks.length === 0 && p > 0.7) out.push(ru ? 'Rugcheck не нашёл критичных рисков: нет бандлов, подозрительных кошельков и сливов.' : 'Rugcheck found no critical risks.');
      if (tk.risks.length > 2) out.push(ru ? 'Найдено несколько рисков — посмотри их в блоке RISKS выше, там конкретика.' : 'Multiple risks found — see the RISKS block above.');
    }

    if (k === 'contract') {
      if (tk.mintAuth) out.push(ru ? 'Минт открыт: создатель может напечатать сколько угодно токенов и обесценить твои.' : 'Mint open: the dev can print tokens and dilute you.');
      if (tk.freezeAuth) out.push(ru ? 'Заморозка открыта: твой кошелёк могут заморозить и ты не продашь.' : 'Freeze open: your wallet can be frozen.');
      if (!tk.mintAuth && !tk.freezeAuth && tk.gp) out.push(ru ? 'Права отозваны — печатать и замораживать токены больше нельзя. Это хороший знак.' : 'Authorities revoked — a good sign.');
      if (tk.gp && (Number(tk.gp.buyTax) > 5 || Number(tk.gp.sellTax) > 5)) out.push(ru ? 'Налог выше 5%: каждый вход и выход съедает десятую часть.' : 'Tax above 5% eats a tenth on every trade.');
      if (tk.transferFee > 3) out.push(ru ? 'Комиссия за перевод ' + tk.transferFee.toFixed(1) + '% — токен теряет стоимость при каждом переводе.' : 'Transfer fee ' + tk.transferFee.toFixed(1) + '% on every transfer.');
    }

    if (k === 'activity') {
      if (turn && turn > 6) out.push(ru ? 'Оборот в ' + turn.toFixed(1) + '× ликвидности — похоже на накрутку объёма ботами.' : 'Turnover ' + turn.toFixed(1) + '× liquidity — looks like wash trading.');
      if (turn && turn < 0.1) out.push(ru ? 'Почти нет торгов: монета «мертвая», выйти будет некому.' : 'Almost no trading: a dead token.');
      if (tk.buys && tk.sells && tk.sells > tk.buys * 1.5) out.push(ru ? 'Продажи перевешивают покупки — держатели выходят, давление вниз.' : 'Sells dominate — holders are exiting.');
      if (tk.buys && tk.sells && tk.buys > tk.sells * 1.5) out.push(ru ? 'Покупок больше продаж — интерес растёт, но проверь, не один ли это кошелёк.' : 'Buy pressure dominates — check if it is one wallet.');
    }

    if (k === 'age') {
      if (ageH && ageH < 1) out.push(ru ? 'Монете меньше часа. 9 из 10 таких умирают в первые сутки — это лотерея, не инвестиция.' : 'Under an hour old — 9 of 10 die within a day.');
      if (ageH && ageH > 24 * 30) out.push(ru ? 'Монета живёт больше месяца — прошла первичный отбор, но не гарантирует рост.' : 'Alive over a month — passed the first filter.');
      if (ageH && ageH > 24 * 180) out.push(ru ? 'Полгода на рынке — таких мало; риск рага ниже, но и иксов обычно уже нет.' : 'Over six months old — rare, lower rug risk.');
    }

    if (k === 'price') {
      if (ch <= -60) out.push(ru ? 'Минус ' + Math.abs(Math.round(ch)) + '% за сутки: идёт слив. Вход — ловля ножа.' : 'Down ' + Math.abs(Math.round(ch)) + '% — catching a falling knife.');
      if (ch >= 200) out.push(ru ? 'Плюс ' + Math.round(ch) + '% за сутки: ты видишь уже состоявшийся памп. Риск купить на пике.' : 'Up ' + Math.round(ch) + '% — you are buying after the pump.');
      if (ch > -10 && ch < 10) out.push(ru ? 'Цена стабильна за сутки — без резких движений, но и без интереса.' : 'Price is flat — no momentum.');
    }

    if (k === 'links') {
      if (!tk.socials.length && !tk.sites.length) out.push(ru ? 'Нет ни сайта, ни соцсетей. У нормального проекта они есть всегда.' : 'No site or socials — a red flag.');
      if (tk.socials.length >= 2) out.push(ru ? 'Есть несколько соцсетей — проверь, живые ли там посты, а не купленные подписчики.' : 'Several socials — check if posts are real.');
    }

    if (!out.length) out.push(ru ? 'По этому блоку всё в пределах нормы — явных красных флагов нет.' : 'Nothing alarming in this block.');
    return out.slice(0, 3);
  }

  function verdictLabel(score) {
    if (score >= 70) return { txt: t('vCan'), cls: 'good' };
    if (score >= 40) return { txt: t('vRisk'), cls: 'mid' };
    return { txt: t('vNo'), cls: 'bad' };
  }

  function gauge(score) {
    const vv = verdict(score);
    const col = vv.cls === 'good' ? 'var(--green)' : vv.cls === 'mid' ? 'var(--yellow)' : 'var(--red)';
    const R = 92, C = Math.PI * R;
    const off = C * (1 - score / 100);
    return '<div class="gauge" style="color:' + col + '">' +
      '<svg viewBox="0 0 220 130"><path d="M18 118a92 92 0 0 1 184 0" fill="none" stroke="var(--card-2)" stroke-width="12" stroke-linecap="round"/>' +
      '<path class="gbar" d="M18 118a92 92 0 0 1 184 0" fill="none" stroke="currentColor" stroke-width="12" stroke-linecap="round" stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="' + C.toFixed(1) + '" data-to="' + off.toFixed(1) + '"/></svg>' +
      '<div class="gauge-mid"><b>' + score + '</b><span>' + t('of100') + '</span><em class="' + vv.cls + '">' + esc(vv.label) + '</em></div></div>';
  }

  /* ---------------- views ---------------- */
  function scoreColor(cls) {
    return cls === 'good' ? 'var(--green)' : cls === 'mid' ? 'var(--yellow)' : 'var(--red)';
  }
  function avaClass(cls) {
    return cls === 'good' ? 'a-good' : cls === 'mid' ? 'a-mid' : 'a-bad';
  }
  function isPrem() {
    return S.plan === 'premium' && (!S.planUntil || S.planUntil > Date.now());
  }
  const CHECK_BLOCKS = ['liq', 'holders', 'dev', 'contract', 'activity', 'age', 'price', 'links', 'pressure'];
  function customState() {
    const c = S.custom || { active: 'reactive', items: [], seen: false };
    if (!c.items) c.items = [];
    if (!c.active) c.active = 'reactive';
    return c;
  }
  function saveCustom() { write('tc.custom.v1', S.custom); }
  function blockMeta() {
    const ru = S.lang === 'ru';
    return [
      ['liq', ru ? 'Ликвидность' : 'Liquidity'],
      ['holders', ru ? 'Холдеры и топ-10' : 'Holders and top-10'],
      ['dev', ru ? 'Дев' : 'Dev'],
      ['contract', ru ? 'Минт и заморозка' : 'Mint and freeze'],
      ['activity', ru ? 'Объём' : 'Volume'],
      ['age', ru ? 'Возраст' : 'Age'],
      ['price', ru ? 'Импульс цены' : 'Price momentum'],
      ['links', ru ? 'Ссылки' : 'Links'],
      ['pressure', ru ? 'Покупки и продажи' : 'Buy and sell pressure']
    ];
  }
  function checkPresets() {
    const ru = S.lang === 'ru';
    return [
      { name: ru ? 'Снайпер' : 'Sniper', weights: { liq: 24, holders: 8, dev: 12, contract: 20, activity: 18, age: 4, price: 16, links: 0, pressure: 22 }, rules: { devPct: 10, liqUsd: 5000, top10: 75, ageMin: 0 } },
      { name: ru ? 'Осторожный' : 'Careful', weights: { liq: 24, holders: 24, dev: 24, contract: 24, activity: 6, age: 16, price: 4, links: 6, pressure: 6 }, rules: { devPct: 3, liqUsd: 50000, top10: 40, ageMin: 360 } },
      { name: ru ? 'Холд' : 'Hold', weights: { liq: 20, holders: 24, dev: 16, contract: 20, activity: 4, age: 26, price: 4, links: 10, pressure: 4 }, rules: { devPct: 5, liqUsd: 100000, top10: 35, ageMin: 1440 } }
    ];
  }
  function activeCustom() {
    if (!isPrem()) return null;
    const c = customState();
    if (!c.active || c.active === 'reactive') return null;
    return (c.items || []).find(function (x) { return x.id === c.active; }) || null;
  }
  function runCustom(result, check) {
    if (!result || !check) return null;
    const tk = result.token || {};
    const by = {};
    (result.blocks || []).forEach(function (b) { by[b.k] = b.s; });
    const buys = Number(tk.buys) || 0, sells = Number(tk.sells) || 0, tot = buys + sells;
    if (tot > 0) {
      const buy = buys / tot;
      by.pressure = buy >= 0.6 ? 0.9 : buy >= 0.45 ? 0.65 : 0.3;
    }
    const wts = check.weights || {};
    let num = 0, den = 0;
    CHECK_BLOCKS.forEach(function (k) {
      const w = Number(wts[k]) || 0;
      if (w <= 0 || by[k] == null) return;
      num += by[k] * w;
      den += w;
    });
    let score = den ? Math.round(num / den * 100) : result.score;
    const rules = check.rules || {};
    const ru = S.lang === 'ru';
    const fired = [];
    const dev = tk.creatorBalance && tk.creatorBalance.pct ? tk.creatorBalance.pct : 0;
    if (Number(rules.devPct) > 0 && dev > Number(rules.devPct)) fired.push(ru ? 'Дев держит ' + dev.toFixed(1) + '% · порог ' + rules.devPct + '%' : 'Dev holds ' + dev.toFixed(1) + '% · limit ' + rules.devPct + '%');
    if (Number(rules.liqUsd) > 0 && tk.liq > 0 && tk.liq < Number(rules.liqUsd)) fired.push(ru ? 'Ликвидность ' + usd(tk.liq) + ' · порог $' + rules.liqUsd : 'Liquidity ' + usd(tk.liq) + ' · limit $' + rules.liqUsd);
    const t10 = Number(tk.top10) || 0;
    if (Number(rules.top10) > 0 && t10 > Number(rules.top10)) fired.push(ru ? 'Топ-10 ' + Math.round(t10) + '% · порог ' + rules.top10 + '%' : 'Top-10 ' + Math.round(t10) + '% · limit ' + rules.top10 + '%');
    if (Number(rules.ageMin) > 0 && tk.created) {
      const mins = (Date.now() - tk.created) / 60000;
      if (mins < Number(rules.ageMin)) fired.push(ru ? 'Возраст ' + Math.round(mins) + ' мин · порог ' + rules.ageMin + ' мин' : 'Age ' + Math.round(mins) + ' min · limit ' + rules.ageMin + ' min');
    }
    if (fired.length) score = Math.min(score, 24);
    return { name: check.name, score: score, fired: fired };
  }
  function insightParts(text) {
    const s = String(text || '');
    const i = s.indexOf(':');
    if (i > 2 && i < 48) return { title: s.slice(0, i), sub: s.slice(i + 1).trim() };
    const j = s.indexOf(' — ');
    if (j > 2 && j < 48) return { title: s.slice(0, j), sub: s.slice(j + 3).trim() };
    return { title: s, sub: '' };
  }
  const INS_ICON = {
    key: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="7" cy="10" r="3.2"/><path d="M10.2 10H17M15 10v2.6M17 10v2" stroke-linecap="round"/></svg>',
    people: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="7.5" cy="7" r="2.6"/><path d="M2.8 16a4.8 4.8 0 0 1 9.4 0"/><circle cx="14" cy="7.6" r="2"/><path d="M13.2 12.2a3.8 3.8 0 0 1 3.6 3.6"/></svg>',
    lock: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="4" y="9" width="12" height="8" rx="2"/><path d="M7 9V6.6a3 3 0 0 1 6 0V9"/></svg>',
    down: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10 3.5v12.5M5 11l5 5 5-5"/></svg>',
    drop: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M10 2.8c3 3.6 5 6.4 5 8.8a5 5 0 0 1-10 0c0-2.4 2-5.2 5-8.8z"/></svg>',
    alert: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M10 3.2 17 16.5H3L10 3.2z"/><path d="M10 8.2v3.6M10 14.2v.2"/></svg>',
    ok: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="10" cy="10" r="7"/><path d="M6.8 10.2 9 12.4 13.4 8"/></svg>'
  };
  function insightIcon(x) {
    const t0 = String(x.text || '').toLowerCase();
    if (/минт|mint|замороз|freeze|honeypot|ловуш/.test(t0)) return INS_ICON.key;
    if (/топ-10|холдер|кошел|holder|wallet|держат/.test(t0)) return INS_ICON.people;
    if (/lp |ликвид|пул|liquid/.test(t0)) return INS_ICON.lock;
    if (/паден|dump|слив|упал|down |минус/.test(t0)) return INS_ICON.down;
    if (/налог|tax|комисс/.test(t0)) return INS_ICON.drop;
    if (x.tone === 'good') return INS_ICON.ok;
    return INS_ICON.alert;
  }
  function fmtLoss(dollars) {
    const v = Math.abs(Number(dollars) || 0);
    let s = v >= 100 ? String(Math.round(v)) : v >= 10 ? v.toFixed(0) : v.toFixed(2);
    if (S.lang === 'ru') s = s.replace('.', ',');
    return '−$' + s;
  }
  function fmtSlip(v) {
    if (v < 0.1) return S.lang === 'ru' ? '<0,1%' : '<0.1%';
    let s = v.toFixed(1);
    if (S.lang === 'ru') s = s.replace('.', ',');
    return s + '%';
  }
  const CHEV = '<svg class="chev" width="8" height="14" viewBox="0 0 8 14" fill="none"><path d="M1.5 1.5 6.5 7l-5 5.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const BELL = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6.2 16.2V10a5.8 5.8 0 0 1 11.6 0v6.2L19.2 18H4.8l1.4-1.8z"/><path d="M10 18.6a2 2 0 0 0 4 0"/></svg>';
  const CHANNEL = 'https://t.me/reactive_family';
  const LOCK_SVG = '<svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="9" width="12" height="8" rx="2"/><path d="M7 9V6.6a3 3 0 0 1 6 0V9" stroke-linecap="round"/></svg>';
  const SVG_X = '<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true"><path d="M2.25 2.25l7.5 7.5M9.75 2.25L2.25 9.75" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
  const SVG_HELP = '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M6.05 6.1a2 2 0 1 1 3.15 1.65c-.55.3-.85.7-.85 1.3" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="8.35" cy="11.65" r=".85" fill="currentColor"/></svg>';
  function premLock(id, html) {
    return '<div class="prem-lock" id="' + id + '" role="button" tabindex="0"><div class="prem-blur">' + html + '</div><span class="prem-cap">' + LOCK_SVG + 'Premium</span></div>';
  }
  function lockBundle(id, rows, hiddenN) {
    const ru = S.lang === 'ru';
    const body = rows.map(function (r) {
      return '<div class="lock-row"><div class="lock-title"><b>' + esc(r.title) + '</b><span class="prem-cap mini">' + LOCK_SVG + 'Premium</span></div><div class="prem-blur">' + r.detail + '</div></div>';
    }).join('');
    const more = hiddenN > 0 ? '<p class="lock-more">' + esc(ru ? 'ещё ' + hiddenN + ' скрыто в Premium' : hiddenN + ' more hidden in Premium') + '</p>' : '';
    return '<div class="prem-lock" id="' + id + '" role="button" tabindex="0">' + body + more + '</div>';
  }
  function inTelegram() {
    return !!(TG && TG.BackButton && TG.platform && TG.platform !== 'unknown');
  }
  function fallbackBack() {
    if (inTelegram()) return '';
    const ru = S.lang === 'ru';
    return '<button type="button" class="ios-back" id="iosBack"><svg width="11" height="18" viewBox="0 0 8 14" fill="none"><path d="M6.5 1.5 1.5 7l5 5.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' + (ru ? 'Назад' : 'Back') + '</button>';
  }

  function activeCheckName() {
    const ru = S.lang === 'ru';
    const c = customState();
    const id = isPrem() ? (c.active || 'reactive') : 'reactive';
    if (id === 'reactive') return ru ? 'Reactive (общий)' : 'Reactive (general)';
    const item = (c.items || []).find(function (x) { return x.id === id; });
    return item ? item.name : (ru ? 'Reactive (общий)' : 'Reactive (general)');
  }
  function feedbackDue() {
    if ((S.stats.scans || 0) < 3) return false;
    return Date.now() > Number(read('tc.fb.until', 0) || 0);
  }
  function hideFeedback() {
    write('tc.fb.until', Date.now() + 21 * 864e5);
  }
  function openChannel() {
    haptic();
    if (TG && typeof TG.openTelegramLink === 'function') {
      try { TG.openTelegramLink(CHANNEL); return; } catch (e) {}
    }
    window.open(CHANNEL, '_blank', 'noopener');
  }
  function viewHome() {
    const ru = S.lang === 'ru';
    let out = '<div class="page home">';
    out += '<div class="hero-tx" style="margin:4px 2px 16px"><h1 class="lt' + (S.ui.big === false ? ' compact' : '') + '">' + esc(t('checkTab')) + '</h1>';
    out += '<p class="sub">' + esc(ru ? 'Оценка риска монеты Solana за 30 секунд' : 'Solana token risk score in 30 seconds') + '</p></div>';
    out += '<div class="card paste">';
    out += '<label class="inp-wrap"><svg class="inp-ico" viewBox="0 0 28 28" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12.5" cy="12.5" r="7.5"/><path d="m18 18 6 6"/></svg>';
    out += '<input id="mint" placeholder="' + esc(ru ? 'Адрес монеты' : 'Token address') + '" autocomplete="off" spellcheck="false" enterkeyhint="go">';
    out += '<button type="button" class="paste-side" id="paste">' + esc(ru ? 'Вставить' : 'Paste') + '</button></label>';
    out += '<button type="button" class="btn paste-go" id="go"' + (S.busy ? ' disabled' : '') + '>' + (S.busy ? '<span class="spinner"></span>' : esc(ru ? 'Проверить' : 'Check')) + '</button>';
    if (!isPrem() && S.ui.quota !== false) {
      const L = quotaLeft();
      out += '<p class="left-line">' + esc(ru
        ? 'Осталось ' + L.day + ' из ' + FREE_PER_DAY + ' проверок сегодня'
        : L.day + ' of ' + FREE_PER_DAY + ' checks left today') + '</p>';
    }
    if (S.error) out += '<p class="err">' + esc(S.error) + '</p>';
    out += '</div>';
    out += '<div class="card check-pick"><button type="button" class="set-row" id="checkPick">' + esc(ru ? 'Проверка' : 'Check') +
      '<span class="val">' + esc(activeCheckName()) + '</span>' + CHEV + '</button></div>';
    if (S.busy && !S.result) out += '<div class="skel-wrap"><div class="skel"></div><div class="skel"></div></div>';
    out += '<div class="sec"><span>' + esc(ru ? 'Кошельки' : 'Wallets') + '</span><button type="button" class="sh-btn" id="walletAdd">' + esc(ru ? 'Добавить' : 'Add') + '</button></div>';
    out += '<div class="card">';
    if (!(S.wallets || []).length) out += '<p class="set-note">' + esc(ru ? 'Добавь адрес Solana. Если он держит проверенную монету, это появится в результате.' : 'Add a Solana address. If it holds a coin you check, the result will say so.') + '</p>';
    else out += (S.wallets || []).map(function (w) {
      return '<div class="row"><span class="tx"><b>' + esc(w.slice(0, 4) + '…' + w.slice(-4)) + '</b><span>' + esc(ru ? 'смотрим баланс' : 'watching balance') + '</span></span><button type="button" class="tag tg-trash" data-delw="' + esc(w) + '">' + SVG_X + '</button></div>';
    }).join('');
    out += '</div>';
    if (S.ui.recent !== false && S.saved.length) {
      out += '<div class="sec"><span>' + esc(ru ? 'Недавние' : 'Recent') + '</span><button type="button" class="sh-btn" id="recentAll">' + esc(ru ? 'Все' : 'All') + '</button></div>';
      if (S.recentLoading) {
        out += '<div class="card">' + [0, 1, 2].map(function () {
          return '<div class="row it skel-item"><span class="ava skel-ava"></span><span class="skel-lines"><span class="skel-line"></span><span class="skel-line short"></span></span></div>';
        }).join('') + '</div>';
      } else {
        out += '<div class="card">' + S.saved.slice(0, 5).map(function (s, i) {
          const vv = verdictLabel(s.score || 0);
          return '<button type="button" class="row it item" style="--i:' + i + '" data-mint="' + esc(s.mint) + '">' +
            '<span class="ava ' + avaClass(vv.cls) + '">' + (s.image ? '<img src="' + esc(s.image) + '" alt="">' : esc(String(s.symbol || '?').slice(0, 2))) + '</span>' +
            '<span class="tx meta"><b>' + esc(s.symbol) + '</b><span>' + usd(s.liq) + '</span></span>' +
            '<span class="snum num" style="color:' + scoreColor(vv.cls) + '">' + s.score + '</span></button>';
        }).join('') + '</div>';
      }
    }
    if (feedbackDue()) {
      out += '<div class="ask"><button type="button" class="ask-go" id="askGo">' + esc(ru ? 'Чего не хватает в Reactive? Напиши нам' : 'What is missing in Reactive? Write to us') + '</button>' +
        '<button type="button" class="ask-x" id="askX" aria-label="' + esc(ru ? 'Скрыть' : 'Hide') + '">×</button></div>';
    }
    out += '</div>';
    return out;
  }
  function openCheckSheet() {
    const ru = S.lang === 'ru';
    const c = customState();
    const activeId = isPrem() ? (c.active || 'reactive') : 'reactive';
    const items = [{ id: 'reactive', name: ru ? 'Reactive (общий)' : 'Reactive (general)' }].concat((c.items || []).map(function (x) { return { id: x.id, name: x.name }; }));
    const mark = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4.5 4.5L19 7"/></svg>';
    const wrap = document.createElement('div');
    wrap.className = 'modal';
    wrap.innerHTML = '<div class="modal-card sheet-help">' +
      '<div class="modal-head"><b>' + (ru ? 'Проверка' : 'Check') + '</b><button type="button" class="modal-x" id="mx" aria-label="Close">' + SVG_X + '</button></div>' +
      '<div class="card" style="margin:0 16px 10px">' + items.map(function (p) {
        return '<button type="button" class="set-row" data-pick="' + esc(p.id) + '"><span>' + esc(p.name) + '</span>' +
          (p.id === activeId ? '<span class="val" style="color:var(--blue)">' + mark + '</span>' : '') + '</button>';
      }).join('') + '</div>' +
      '<div class="card" style="margin:0 16px 16px"><button type="button" class="set-row" id="pickEdit">' + esc(ru ? 'Настроить проверки' : 'Edit checks') + CHEV + '</button></div></div>';
    document.body.appendChild(wrap);
    const close = function () { wrap.remove(); };
    wrap.addEventListener('click', function (e) { if (e.target === wrap) close(); });
    wrap.querySelector('#mx').onclick = close;
    wrap.querySelectorAll('[data-pick]').forEach(function (b) {
      b.onclick = function () {
        const id = b.dataset.pick;
        if (id !== 'reactive' && !isPrem()) { close(); showPaywall(); return; }
        S.custom.active = id;
        saveCustom();
        haptic();
        close();
        render();
      };
    });
    wrap.querySelector('#pickEdit').onclick = function () { close(); openCustomEditor(); };
  }

  function numLabel(n, ru, d) {
    if (n == null || !isFinite(Number(n))) return '';
    const x = Number(n);
    const s = Math.abs(x) >= 100 || d === 0 ? String(Math.round(x)) : x.toFixed(d == null ? 1 : d);
    return ru ? s.replace('.', ',') : s;
  }
  function ageLabel(created, ru) {
    if (!created) return '';
    const mins = (Date.now() - created) / 60000;
    if (mins < 90) return Math.max(1, Math.round(mins)) + (ru ? ' мин' : ' min');
    const hrs = mins / 60;
    if (hrs < 36) return Math.round(hrs) + (ru ? ' ч' : ' h');
    const days = hrs / 24;
    if (days < 60) return Math.round(days) + (ru ? ' дн' : ' d');
    const years = days / 365;
    if (years >= 1) {
      const n = Math.round(years * 10) / 10;
      const num = (ru ? n.toFixed(1).replace('.', ',') : n.toFixed(1)).replace(/[,.]0$/, '');
      return num + (ru ? ' г' : ' yr');
    }
    return Math.round(days / 30) + (ru ? ' мес' : ' mo');
  }
  function bsRatio(tx) {
    if (!tx || (!tx.b && !tx.s)) return null;
    if (!tx.s) return tx.b ? 99 : null;
    return tx.b / tx.s;
  }
  function explainRaw(tk) {
    const liq = Number(tk.liq) || 0;
    const mc = Number(tk.mc) || 0;
    const fdv = Number(tk.fdv) || 0;
    const vol = Number(tk.vol) || 0;
    const devKnown = !!(tk.creator || (tk.creatorBalance && tk.creatorBalance.amount));
    const dev = devKnown && tk.creatorBalance ? Number(tk.creatorBalance.pct) : null;
    const top1 = Number(tk.top1) || 0;
    let impact = null;
    if (liq > 0 && mc > 0 && top1 > 0) impact = Math.min(90, top1 * mc / liq);
    else if (top1 > 0) impact = Math.min(90, top1);
    const gp = tk.gp;
    return {
      liq: liq || null, mc: mc || null, fdv: fdv || null, vol: vol || null,
      liqMc: mc > 0 ? liq / mc * 100 : null,
      liqFdv: fdv > 0 ? liq / fdv * 100 : null,
      volMc: mc > 0 ? vol / mc * 100 : null,
      fdvMc: mc > 0 && fdv > 0 ? fdv / mc : null,
      top10: Number(tk.top10) > 0 ? Number(tk.top10) : null,
      top1: top1 > 0 ? top1 : null,
      holders: Number(tk.holders) > 0 ? Number(tk.holders) : null,
      dev: dev,
      devDelta: tk.devPrev != null && dev != null ? dev - Number(tk.devPrev) : null,
      holderDelta: tk.holderPrev > 0 && tk.holders ? (tk.holders - tk.holderPrev) / tk.holderPrev * 100 : null,
      ageMin: tk.created ? (Date.now() - tk.created) / 60000 : null,
      ch24: isFinite(Number(tk.ch24)) ? Number(tk.ch24) : null,
      ch6: isFinite(Number(tk.ch6)) ? Number(tk.ch6) : null,
      ch1: isFinite(Number(tk.ch1)) ? Number(tk.ch1) : null,
      ch5: isFinite(Number(tk.ch5)) ? Number(tk.ch5) : null,
      bs24: bsRatio(tk.tx24), bs6: bsRatio(tk.tx6), bs1: bsRatio(tk.tx1), bs5: bsRatio(tk.tx5),
      lp: tk.lpLocked == null ? null : Number(tk.lpLocked),
      buyTax: gp ? Number(gp.buyTax) || 0 : null,
      sellTax: gp ? Number(gp.sellTax) || 0 : null,
      fee: tk.transferFee == null ? null : Number(tk.transferFee),
      mintOpen: tk.mintAuth == null ? null : !!tk.mintAuth,
      freezeOpen: tk.freezeAuth == null ? null : !!tk.freezeAuth,
      honeypot: gp ? !!gp.honeypot : null,
      mutable: tk.mutable == null ? null : !!tk.mutable,
      socials: (tk.socials || []).length + (tk.sites || []).length,
      pump: tk.pump ? (tk.pump.complete ? 'grad' : 'curve') : 'no',
      impact: impact
    };
  }
  function explainLabels(tk, ru) {
    const raw = explainRaw(tk);
    const pct = function (n) { return numLabel(n, ru, 1); };
    return {
      liq: usd(tk.liq), mc: usd(tk.mc), fdv: usd(tk.fdv), vol: usd(tk.vol),
      liqMc: pct(raw.liqMc), liqFdv: pct(raw.liqFdv), volMc: pct(raw.volMc), fdvMc: pct(raw.fdvMc),
      top10: pct(raw.top10), top1: pct(raw.top1), holders: raw.holders ? num(raw.holders) : '',
      dev: pct(raw.dev), devDelta: pct(raw.devDelta), holderDelta: pct(raw.holderDelta),
      age: ageLabel(tk.created, ru),
      ch24: pct(raw.ch24), ch6: pct(raw.ch6), ch1: pct(raw.ch1), ch5: pct(raw.ch5),
      bs24: pct(raw.bs24), bs6: pct(raw.bs6), bs1: pct(raw.bs1), bs5: pct(raw.bs5),
      lp: pct(raw.lp), buyTax: pct(raw.buyTax), sellTax: pct(raw.sellTax), fee: pct(raw.fee),
      impact: pct(raw.impact), socials: raw.socials ? String(raw.socials) : ''
    };
  }
  function ensureExplain() {
    if (window.REACTIVE_EXPLAIN || S._explainLoading) return;
    S._explainLoading = true;
    const s = document.createElement('script');
    s.src = 'explain.js?v=20261118ios12';
    s.async = true;
    s.onload = function () { S._explainLoading = false; render(); };
    s.onerror = function () { S._explainLoading = false; };
    document.head.appendChild(s);
  }
  function explainSection(tk, ru) {
    if (!window.REACTIVE_EXPLAIN) {
      ensureExplain();
      return '<div class="sh"><b>' + esc(ru ? 'Разбор' : 'Read') + '</b></div><div class="card"><p class="tiny" style="padding:14px 16px">' + esc(ru ? 'Собираю разбор…' : 'Preparing the read…') + '</p></div>';
    }
    const built = window.REACTIVE_EXPLAIN.run(explainRaw(tk), explainLabels(tk, ru), ru ? 'ru' : 'en', tk.mint);
    if (!built.rows.length) return '';
    const rowHtml = function (r) {
      const col = r.sev === 'bad' ? 'var(--red)' : r.sev === 'warn' ? 'var(--orange)' : r.sev === 'good' ? 'var(--green)' : 'var(--blue)';
      return '<details class="read-row"><summary><i class="read-dot" style="background:' + col + '"></i><b>' + esc(r.h) + '</b></summary><div class="read-body"><p>' + esc(r.why) + '</p><p class="tiny">' + esc(r.watch) + '</p></div></details>';
    };
    const openRows = isPrem() ? built.rows : built.rows.filter(function (r) { return r.crit; });
    const locked = isPrem() ? [] : built.rows.filter(function (r) { return !r.crit; });
    let html = '<div class="sh"><b>' + esc(ru ? 'Разбор' : 'Read') + '</b><span class="muted">' + built.rows.length + '</span></div>';
    html += '<div class="card"><p class="read-sum">' + esc(built.summary) + '</p></div>';
    if (openRows.length) html += '<div class="card read-list">' + openRows.map(rowHtml).join('') + '</div>';
    if (locked.length) {
      const shown = locked.slice(0, 3).map(function (r) {
        return { title: r.h, detail: '<p>' + esc(r.why) + '</p>' };
      });
      html += lockBundle('lockRead', shown, Math.max(0, locked.length - shown.length));
    }
    return html;
  }

  function viewResultPage() {
    const ru = S.lang === 'ru';
    const back = fallbackBack();
    if (!S.result || !S.result.token) {
      return '<div class="page">' + back + '<div class="skel-wrap"><div class="skel tall"></div><div class="skel"></div><div class="skel"></div></div></div>';
    }
    const tk = S.result.token;
    const v = verdictLabel(S.result.score);
    const scCol = scoreColor(v.cls);
    const chCol = (Number(tk.ch24) || 0) >= 0 ? 'var(--green)' : 'var(--red)';
    const ageTxt = (function () {
      if (!tk.created) return '—';
      const h = (Date.now() - tk.created) / 36e5;
      return h < 1 ? Math.round(h * 60) + 'm' : h < 48 ? Math.round(h) + 'h' : Math.round(h / 24) + 'd';
    })();
    let out = '<div class="page res">' + back;
    out += '<div class="tk-card">' +
      '<div class="tk-top">' +
      '<span class="tk-ava ' + avaClass(v.cls) + '">' + (tk.image ? '<img src="' + esc(tk.image) + '" alt="">' : esc(String(tk.symbol || '?').slice(0, 2))) + '</span>' +
      '<span class="tk-id"><b>' + esc(tk.symbol) + '</b><span>' + esc(tk.name || '') + '</span></span>' +
      '<span class="tk-score" style="color:' + scCol + '"><b>' + S.result.score + '</b><i>/100</i></span>' +
      '</div>' +
      '<div class="tk-priceline"><b>' + esc(price(tk.price)) + '</b>' +
      '<span style="color:' + chCol + '">' + (tk.ch24 ? pct(tk.ch24) : '') + '</span></div>' +
      '<div class="tk-bar"><i style="width:' + Math.round(S.result.score) + '%;background:' + scCol + '"></i></div>' +
      '<p class="score-note">' + esc(ru ? 'Скор — грубая общая оценка по данным. В Reactive можно создать свои проверки.' : 'The score is a rough overall read of the data. In Reactive you can build your own checks.') + '</p>' +
      '<div class="tk-stats">' +
      '<div><span>MC</span><b>' + usd(tk.mc) + '</b></div>' +
      '<div><span>' + esc(ru ? 'Ликв.' : 'Liq') + '</span><b>' + usd(tk.liq) + '</b></div>' +
      '<div><span>' + esc(ru ? 'Объём' : 'Vol') + '</span><b>' + usd(tk.vol) + '</b></div>' +
      '<div><span>' + esc(ru ? 'Возраст' : 'Age') + '</span><b>' + esc(ageTxt) + '</b></div>' +
      '</div>' +
      '<div class="tk-foot"><div class="tk-links">' +
      (tk.url ? '<a class="tkl" href="' + esc(tk.url) + '" target="_blank" rel="noopener" aria-label="DEX"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 18l6-6 4 3 6-8"/><path d="M16 7h4v4"/></svg></a>' : '') +
      (tk.socials || []).map(function (s) {
        const u = String(s.url || '');
        const t2 = String(s.type || '').toLowerCase();
        let ic = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"/><path d="M4 12h16M12 4c3 3 3 13 0 16M12 4c-3 3-3 13 0 16"/></svg>';
        if (t2.indexOf('twitter') > -1 || t2 === 'x' || u.indexOf('x.com') > -1 || u.indexOf('twitter.com') > -1) ic = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 3h3l-6.6 7.6L21.7 21h-5.9l-4.6-6-5.3 6H3l7-8.1L2.7 3h6l4.2 5.5L17.5 3zm-1 16h1.6L7.6 4.7H5.9L16.5 19z"/></svg>';
        else if (t2.indexOf('telegram') > -1 || u.indexOf('t.me') > -1) ic = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21.5 4.3 2.9 11.4c-1 .4-1 1.7.1 2l4.6 1.4 1.8 5.5c.3.9 1.4 1.1 2 .4l2.5-2.6 4.6 3.4c.8.6 1.9.1 2.1-.8l3-14.2c.2-1-.8-1.8-1.7-1.4zM8.7 14.3l8.6-5.4-6.6 6.5-.2 3-1.8-4.1z"/></svg>';
        return '<a class="tkl" href="' + esc(u) + '" target="_blank" rel="noopener">' + ic + '</a>';
      }).join('') +
      (tk.sites || []).map(function (u) {
        return '<a class="tkl" href="' + esc(u) + '" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"/><path d="M4 12h16M12 4c3 3 3 13 0 16M12 4c-3 3-3 13 0 16"/></svg></a>';
      }).join('') +
      '</div><div class="tk-upd">' + esc((ru ? 'обновлено ' : 'updated ') + ago(S.updatedAt || Date.now())) + (S.result.partial ? ' · ' + (ru ? 'догружаю…' : 'loading…') : '') + '</div></div>' +
      '<div class="tk-meta">' + esc((tk.dex || '').toUpperCase()) +
      (tk.holders ? ' · ' + num(tk.holders) + ' holders' : '') +
      (tk.buys || tk.sells ? ' · ' + tk.buys + '/' + tk.sells : '') +
      '</div></div>';
    const mine = runCustom(S.result, activeCustom());
    if (mine) {
      const mv = verdictLabel(mine.score);
      out += '<div class="custom-score"><div class="cs-top"><span>' + esc(ru ? 'Проверка: ' + mine.name : 'Check: ' + mine.name) + '</span><b style="color:' + scoreColor(mv.cls) + '">' + mine.score + '</b></div>' +
        (mine.fired.length ? '<div class="cs-flags">' + mine.fired.map(function (f) { return '<span>' + esc(f) + '</span>'; }).join('') + '</div>' : '<p class="tiny">' + esc(ru ? 'Красные флаги не сработали' : 'No red flags fired') + '</p>') +
        '</div>';
    }
    if (S.error) out += '<p class="err">' + esc(S.error) + '</p>';
    out += '<div class="card wallet-box" id="walletBox"><p class="set-note">' + esc(ru ? 'Смотрю твои кошельки…' : 'Checking your wallets…') + '</p></div>';
    out += explainSection(tk, ru);

    const insights = buildInsights(tk);
    const tiered = (function () {
      if (isPrem()) return { free: insights, prem: [] };
      const crit = [], rest = [];
      insights.forEach(function (x) { (x.free ? crit : rest).push(x); });
      const keep = Math.ceil(rest.length / 2);
      return { free: crit.concat(rest.slice(0, keep)), prem: rest.slice(keep) };
    })();
    const shownIns = tiered.free;
    const lockedIns = tiered.prem;
    const insRow = function (x, i) {
      const p = insightParts(x.text);
      const tone = x.tone === 'bad' ? 'b-r' : x.tone === 'warn' ? 'b-o' : x.tone === 'good' ? 'b-g' : 'b-n';
      return '<div class="row" style="--i:' + i + '"><div class="ic ' + tone + '">' + insightIcon(x) + '</div>' +
        '<div class="tx"><b>' + esc(p.title) + '</b>' + (p.sub ? '<span>' + esc(p.sub) + '</span>' : '') + '</div></div>';
    };
    if (insights.length) {
      const rc = (tk.risks || []).length;
      out += '<div class="sh"><b>' + esc(ru ? 'Что важно' : 'What matters') + '</b>' +
        (rc ? '<span class="muted">Rugcheck · ' + rc + '</span>' : '') + '</div>';
      if (shownIns.length) out += '<div class="card ins">' + shownIns.map(insRow).join('') + '</div>';
      if (lockedIns.length) {
        const shown = lockedIns.slice(0, 3).map(function (x) {
          const p = insightParts(x.text);
          return { title: p.title, detail: '<span class="tiny">' + esc(p.sub || (ru ? 'подробности' : 'details')) + '</span>' };
        });
        out += lockBundle('lockIns', shown, Math.max(0, lockedIns.length - shown.length));
      }
    }
    if (tk.risks && tk.risks.length) {
      const critR = [], restR = [];
      tk.risks.forEach(function (r) {
        (/mint|freeze|honeypot|lp|liquid|unlock|owner|holder|dump|creator|insider|authority/i.test(String(r.name || '')) ? critR : restR).push(r);
      });
      const keepR = Math.ceil(restR.length / 2);
      const freeR = isPrem() ? tk.risks : critR.concat(restR.slice(0, keepR));
      const premR = isPrem() ? [] : restR.slice(keepR);
      const riskRow = function (r) {
        const low = /warn|medium|low/i.test(r.level);
        return '<div class="risk"><span class="dot" style="background:' + (low ? 'var(--orange)' : 'var(--red)') + '"></span><span><b>' + esc(riskRu(r.name)) + '</b></span></div>';
      };
      out += '<div class="sh"><b>' + esc(ru ? 'Риски Rugcheck' : 'Rugcheck risks') + '</b><span class="muted">' + tk.risks.length + '</span></div>';
      if (freeR.length) out += '<div class="card risk-list">' + freeR.map(riskRow).join('') + '</div>';
      if (premR.length) {
        const shown = premR.slice(0, 3).map(function (r) {
          return { title: riskRu(r.name), detail: '<span class="tiny">' + esc(r.desc || (ru ? 'подробности риска' : 'risk details')) + '</span>' };
        });
        out += lockBundle('lockRisk', shown, Math.max(0, premR.length - shown.length));
      }
    }

    if (tk.liq > 0) {
      const slip = function (usdAmt) { return (usdAmt / tk.liq) * 100; };
      const tone = function (v) { return v < 1 ? 'var(--green)' : v < 3 ? 'var(--orange)' : 'var(--red)'; };
      const cols = [100, 500, 1000].map(function (amt) {
        const p = slip(amt);
        const loss = amt * p / 100;
        return '<div><div class="k">$' + (amt === 1000 ? '1000' : amt) + '</div><div class="v" style="color:' + tone(p) + '">' + fmtLoss(loss) + '</div><div class="s">' + fmtSlip(p) + '</div></div>';
      }).join('');
      let tax = '—';
      if (tk.gp) {
        const b = String(tk.gp.buyTax || '0');
        const s = String(tk.gp.sellTax || '0');
        tax = b === s ? (b + '%') : (b + '% / ' + s + '%');
      }
      let dev = '—';
      let devCol = '';
      if (tk.creatorBalance && tk.creatorBalance.pct) {
        dev = (S.lang === 'ru' ? tk.creatorBalance.pct.toFixed(1).replace('.', ',') : tk.creatorBalance.pct.toFixed(1)) + '%';
        if (tk.creatorBalance.pct > 5) devCol = ' style="color:var(--orange)"';
      }
      out += '<div class="sh"><b>' + esc(ru ? 'Для сделки' : 'For a trade') + '</b><span class="muted">' + esc(ru ? 'потеря на входе' : 'entry loss') + '</span></div>';
      out += '<div class="card"><div class="deal">' + cols + '</div>' +
        '<div class="kv"><span>' + esc(ru ? 'Налог · доля дева' : 'Tax · dev share') + '</span><b>' + esc(tax) + ' · <span' + devCol + '>' + esc(dev) + '</span></b></div></div>';
    }

    const rows = [
      [t('priceL'), price(tk.price), tk.ch24 ? pct(tk.ch24) : ''],
      ['MC', usd(tk.mc), ''],
      ['FDV', usd(tk.fdv), ''],
      [t('liqL'), usd(tk.liq), ''],
      [t('volL'), usd(tk.vol), ''],
      ['Buys / Sells', String(tk.buys) + ' / ' + String(tk.sells), ''],
      ['Holders', tk.holders ? num(tk.holders) : '—', ''],
      ['DEX', (tk.dex || '—').toUpperCase(), ''],
      ['FDV / MC', (tk.mc && tk.fdv ? (tk.fdv / tk.mc).toFixed(2) + '×' : '—'), ''],
      ['1h / 6h', (tk.ch1 ? pct(tk.ch1) : '—') + ' / ' + (tk.ch6 ? pct(tk.ch6) : '—'), ''],
      ['Creator', tk.creator ? tk.creator.slice(0, 6) + '…' + tk.creator.slice(-4) : '—', ''],
      ['Pair', tk.pairAddr ? tk.pairAddr.slice(0, 6) + '…' + tk.pairAddr.slice(-4) : '—', ''],
      ['Holders (GP)', tk.gp && tk.gp.holders ? num(tk.gp.holders) : '—', ''],
      ['LP holders', tk.gp && tk.gp.lp ? String(tk.gp.lp) : '—', ''],
      ['Honeypot', tk.gp ? (tk.gp.honeypot ? 'да' : 'нет') : '—', ''],
      ['Mint / Freeze', tk.gp ? ((tk.gp.mintable ? 'open' : 'revoked') + ' / ' + (tk.gp.freezable ? 'open' : 'revoked')) : '—', ''],
      ['Buy / Sell tax', tk.gp ? ((tk.gp.buyTax || '0') + '% / ' + (tk.gp.sellTax || '0') + '%') : '—', ''],
      ['Reserve (GT)', tk.gtReserve ? usd(tk.gtReserve) : (S.gtLoading ? '…' : '—'), ''],
      ['Creator %', tk.creatorBalance && tk.creatorBalance.pct ? tk.creatorBalance.pct.toFixed(2) + '%' : '—', ''],
      ['Top-1 holder', tk.top1 ? tk.top1.toFixed(2) + '%' : '—', ''],
      ['Transfer fee', tk.transferFee === null || tk.transferFee === undefined ? '—' : tk.transferFee.toFixed(1) + '%', ''],
      ['LP locked', tk.lpLocked === null || tk.lpLocked === undefined ? '—' : Math.round(tk.lpLocked) + '%', '']
    ];
    const rowHtml = function (r) {
      return '<div class="info-row"><span>' + esc(r[0]) + '</span><b>' + esc(r[1]) + (r[2] ? ' <i style="color:' + (String(r[2]).charAt(0) === '-' ? 'var(--red)' : 'var(--green)') + '">' + esc(r[2]) + '</i>' : '') + '</b></div>';
    };
    out += '<div class="card" style="margin-top:10px"><button type="button" class="plain" id="infoMore">' +
      '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="3" width="5.5" height="5.5" rx="1.3"/><rect x="11.5" y="3" width="5.5" height="5.5" rx="1.3"/><rect x="3" y="11.5" width="5.5" height="5.5" rx="1.3"/><rect x="11.5" y="11.5" width="5.5" height="5.5" rx="1.3"/></svg>' +
      '<span>' + esc(ru ? 'Все метрики' : 'All metrics') + '</span><span class="cnt">' + rows.length + '</span>' + CHEV + '</button>' +
      '<div class="info-extra" id="infoExtra">' + rows.map(rowHtml).join('') + '</div></div>';

    out += '<div class="sh"><b>' + esc(t('checksK')) + '</b><button type="button" class="help" id="help" aria-label="Help">' + SVG_HELP + '</button></div>';
    out += '<div class="cats">' + S.result.blocks.map(function (x, bi) {
      const c = x.s >= 0.7 ? 'green' : x.s >= 0.4 ? 'yellow' : 'red';
      const col = 'var(--' + c + ')';
      const p = Math.round(x.s * 100);
      return '<button type="button" class="cat ' + c + '" data-bi="' + bi + '" style="--c:' + col + '">' +
        '<div class="cat-top"><span class="cat-ico">' + (BICON[x.k] || '') + '</span>' +
        '<span class="cat-v">' + p + '<i>%</i></span></div>' +
        '<span class="cat-t">' + esc(t(x.k)) + '</span>' +
        '<span class="cat-pb"><i style="width:' + p + '%"></i></span>' +
        '<span class="cat-s">' + esc(x.info) + '</span></button>';
    }).join('') + (S.result.partial ? pendingBlocks(S.result.blocks.map(function (x) { return x.k; }), S.lang) : '') + '</div>';
    out += '<div id="block-detail"></div>';

    if (tk.top && tk.top.length) {
      const maxPct = Math.max.apply(null, tk.top.map(function (h) { return h.pct; }).concat([1]));
      const holdHtml = '<details class="card holders"' + (isPrem() ? ' style="margin-top:10px"' : '') + '><summary class="plain">' + esc(ru ? 'Топ держателей' : 'Top holders') + '<span class="cnt">' + tk.top.length + '</span>' + CHEV + '</summary><div class="hold-list">' + tk.top.map(function (h, hi) {
        const w = Math.max(3, Math.round(h.pct / maxPct * 100));
        const ht = h.pct > 20 ? 'var(--red)' : h.pct > 10 ? 'var(--orange)' : 'var(--l3)';
        return '<div class="hold-row"><span class="hold-n">' + (hi + 1) + '</span>' +
          '<span class="hold-mid"><span class="hold-bar"><i style="width:' + w + '%;background:' + ht + '"></i></span>' +
          '<span class="hold-addr">' + esc(h.addr ? h.addr.slice(0, 5) + '…' + h.addr.slice(-4) : '—') + '</span></span>' +
          '<b>' + esc(h.pct.toFixed(2)) + '%</b></div>';
      }).join('') + '</div></details>';
      out += isPrem() ? holdHtml : lockBundle('lockHold', [{ title: ru ? 'Топ держателей' : 'Top holders', detail: '<span class="tiny">' + tk.top.length + '</span>' }], Math.max(0, tk.top.length - 1));
    }

    if (S.result.blocks.length < 8) out += '<p class="tiny" style="margin-top:12px">' + esc(ru ? 'Часть данных недоступна — оценка по ' + S.result.blocks.length + ' из 8 блоков.' : 'Some data unavailable — scored on ' + S.result.blocks.length + ' of 8 blocks.') + '</p>';
    out += '<div id="similar"></div>';

    const inList = (S.saved || []).some(function (x) { return x.mint === tk.mint; });
    out += '<div class="actions-main"><button type="button" class="btn' + (inList ? ' saved' : '') + '" id="save">' +
      (inList ? '<svg class="ok-mark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4.5 4.5L19 7"/></svg><span>' + esc(ru ? 'В списке' : 'Saved') + '</span>' : esc(t('save'))) +
      '</button></div>';
    out += '<button type="button" class="btn secondary" id="share" style="margin-top:10px">' + esc(ru ? 'Поделиться' : 'Share') + '</button>';
    out += '<div class="card" style="margin-top:10px">';
    if (tk.creator) {
      const blocked = !!S.black.devs[tk.creator];
      out += '<button type="button" class="plain ghost-action' + (blocked ? ' on' : '') + '" id="blkDev">' +
        '<span class="ga-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="8"/><path d="M6.5 6.5l11 11"/></svg></span>' +
        '<span>' + esc(blocked ? (ru ? 'Создатель заблокирован' : 'Creator blocked') : (ru ? 'Заблокировать создателя' : 'Block creator')) + '</span></button>';
    }
    const tokBlocked = !!S.black.tokens[tk.mint];
    out += '<button type="button" class="plain ghost-action' + (tokBlocked ? ' on' : '') + '" id="blkTok">' +
      '<span class="ga-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="8"/><path d="M6.5 6.5l11 11"/></svg></span>' +
      '<span>' + esc(tokBlocked ? (ru ? 'Монета в чёрном списке' : 'Token blacklisted') : (ru ? 'В чёрный список' : 'Blacklist token')) + '</span></button>';
    out += '</div>';

    out += '<p class="tiny copy-a" id="copyMint" style="margin-top:14px"><span class="mint">' + esc(tk.mint) + '</span><span class="cp">' + (ru ? 'копировать' : 'copy') + '</span></p>';
    out += '<p class="tiny">' + esc(t('about')) + '</p></div>';
    return out;
  }

  

  function viewScan() {
    if (S.result) return viewResult();
    return top(t('checkTab')) +
      '<div class="page">' +
      '<h1 class="display">' + t('pasteTitle').replace(/\n/g, '<br>') + '</h1>' +
      '<p class="lead">' + esc(t('pasteSub')) + '</p>' +
      '<div class="field"><input id="mint" placeholder="' + esc(t('ph')) + '" autocomplete="off" spellcheck="false"><button class="icon-pill" id="paste">' + esc(t('paste')) + '</button></div>' +
      '<div style="height:14px"></div>' +
      '<button class="btn" id="go"' + (S.busy ? ' disabled' : '') + '>' + (S.busy ? '<span class="spinner"></span>' : esc(t('check'))) + '</button>' +
      (S.busy ? '<div class="skel-wrap"><div class="skel"></div><div class="skel"></div><div class="skel"></div></div>' : '') +
      (S.error ? '<p class="err">' + esc(S.error) + '</p>' : '') +
      '<div style="height:22px"></div>' +
      '<p class="eyebrow">' + esc(t('howTitle')) + '</p>' +
      '<p class="tiny" style="margin-top:6px">' + esc(t('how')) + '</p>' +
      '</div>';
  }

  function viewResult() {
    const r = S.result, tk = r.token;
    const blocks = r.blocks.map((x, bi) => {
      const color = x.s >= 0.7 ? 'var(--green)' : x.s >= 0.4 ? 'var(--yellow)' : 'var(--red)';
      return '<div class="block" style="--i:' + bi + '">' +
        '<button class="block-head"><span class="dot" style="background:' + color + '"></span>' +
        '<span>' + esc(t(x.k)) + '</span>' +
        '<span class="val" style="color:' + color + '">' + Math.round(x.s * 100) + '</span>' + ICON_CHEV + '</button>' +
        '<div class="block-body"><div class="bar" style="color:' + color + '"><i style="width:' + Math.round(x.s * 100) + '%"></i></div>' + esc(x.info) + '</div></div>';
    }).join('');

    return top(t('result')) +
      '<div class="page">' +
      gauge(r.score) +
      (function () { var v = verdictLabel(r.score); return '<div class="verdict-bar"><span class="k">' + esc(t('verdictK')) + '</span><b class="' + v.cls + '" style="color:var(--' + (v.cls === 'good' ? 'green' : v.cls === 'mid' ? 'yellow' : 'red') + ')">' + esc(v.txt) + '</b></div>'; })() +
      (S.result.partial ? '<p class="eta-line">' + esc(S.lang === 'ru' ? 'Оценка уточняется · ещё ≈2 сек' : 'Refining · ≈2s left') + '</p>' : '') +
      '<div class="token-line" style="text-align:center"><b>' + esc(tk.symbol) + '</b>' + (tk.name ? ' · ' + esc(tk.name) : '') + '</div>' +

      '<div style="height:22px"></div>' +
      '<p class="eyebrow" style="margin-bottom:8px">' + esc(t('checksK')) + '</p>' +
      r.reasons.map((x) => '<p class="small muted" style="margin:0 0 4px">— ' + esc(x) + '</p>').join('') +
      '<div class="blocks">' + blocks + '</div>' +
      '<div style="height:18px"></div>' +
      '<div class="row"><button class="btn" id="save">' + esc(t('save')) + '</button>' +
      (tk.url ? '<button class="btn secondary" id="open">Dex</button>' : '') + '</div>' +
      '<div style="height:8px"></div>' +
      '<button class="btn ghost" id="again">' + esc(t('again')) + '</button>' +
      '</div>';
  }

  function sparkSvg(s) {
    const p1 = Number(s.ch1) || 0, p6 = Number(s.ch6) || 0, p24 = Number(s.ch24) || 0;
    const vals = [0, p1, p6, p24];
    const max = Math.max(1, Math.abs(Math.min.apply(null, vals)), Math.abs(Math.max.apply(null, vals)));
    const W = 54, H = 22;
    const pts = vals.map(function (v, i) {
      const x = (i / (vals.length - 1)) * W;
      const y = H / 2 - (v / max) * (H / 2 - 2);
      return x.toFixed(1) + ',' + y.toFixed(1);
    }).join(' ');
    const col = p24 >= 0 ? '#30d158' : '#ff453a';
    return '<svg class="spark" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '">' +
      '<polyline points="' + pts + '" fill="none" stroke="' + col + '" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }

  function alertOf(s) {
    const ru = S.lang === 'ru';
    const out = [];
    if (typeof s.prevScore === 'number' && s.prevScore - s.score >= 10) out.push(ru ? 'скор упал на ' + (s.prevScore - s.score) : 'score −' + (s.prevScore - s.score));
    if (typeof s.prevLiq === 'number' && s.prevLiq > 0 && (s.liq - s.prevLiq) / s.prevLiq <= -0.3) out.push(ru ? 'ликвидность −30%' : 'liquidity −30%');
    if (Number(s.ch24) <= -40) out.push(ru ? 'цена ' + Math.round(Number(s.ch24)) + '%' : 'price ' + Math.round(Number(s.ch24)) + '%');
    if ((s.score || 0) < 40) out.push(ru ? 'опасный скор' : 'risky score');
    return out;
  }

  function tagLabel(tag) {
    const ru = S.lang === 'ru';
    if (tag === 'hold') return ru ? 'в позиции' : 'holding';
    if (tag === 'trash') return ru ? 'мусор' : 'trash';
    return ru ? 'слежу' : 'watching';
  }

  function watchedCoins() {
    const list = S.saved || [];
    if (isPrem()) return list;
    return list.slice(0, FREE_WATCH_N);
  }
  function alertsToday() {
    const cut = Date.now() - 864e5;
    return (S.alertLog || []).filter(function (a) { return a.at > cut; }).length;
  }
  function alertAllowed(kind) {
    const prefs = S.alertPrefs || {};
    if (prefs[kind] === false) return false;
    if (isPrem()) return true;
    return kind === 'score' || kind === 'liq';
  }
  function takeAlert(mint, kind) {
    if (!alertAllowed(kind)) return false;
    const day = new Date().toISOString().slice(0, 10);
    const id = mint + '|' + kind + '|' + day;
    S.alertLog = S.alertLog || [];
    if (S.alertLog.some(function (a) { return a.id === id; })) return true;
    if (!isPrem() && alertsToday() >= FREE_ALERTS_DAY) return false;
    S.alertLog.push({ id: id, at: Date.now(), kind: kind });
    S.alertLog = S.alertLog.filter(function (a) { return Date.now() - a.at < 864e5 * 2; }).slice(-200);
    write('tc.alertLog', S.alertLog);
    return true;
  }
  function alertLimitText() {
    const ru = S.lang === 'ru';
    if (isPrem()) return ru ? 'Premium · все типы уведомлений, без лимита' : 'Premium · every alert type, no limit';
    return ru
      ? 'Free · ' + FREE_WATCH_N + ' монеты в слежке · ' + alertsToday() + '/' + FREE_ALERTS_DAY + ' уведомлений сегодня. Скор и ликвидность. Остальное — Premium.'
      : 'Free · ' + FREE_WATCH_N + ' watched coins · ' + alertsToday() + '/' + FREE_ALERTS_DAY + ' alerts today. Score and liquidity. The rest is Premium.';
  }
  function viewSaved() {
    const ru = S.lang === 'ru';
    const sort = S.listSort || 'score';
    const sortLbl = sort === 'score' ? (ru ? 'Скор' : 'Score') : sort === 'change' ? '24ч' : (ru ? 'Дата' : 'Date');
    if (!S.saved.length) {
      return '<div class="page"><div class="lt"><span>' + esc(t('savedTab')) + '</span><button type="button" class="lt-ico" id="listGear" aria-label="' + (ru ? 'Уведомления' : 'Alerts') + '">' + BELL + '</button></div>' +
        '<p class="sub">' + esc(ru ? 'Обновляется каждые 45 секунд' : 'Refreshes every 45 seconds') + '</p>' +
        '<div class="empty"><b>' + esc(t('emptyTitle')) + '</b><span>' + esc(t('emptyText')) + '</span></div>' +
        '<p class="set-note">' + esc(alertLimitText()) + '</p></div>';
    }

    const avg = Math.round(S.saved.reduce(function (x, s) { return x + (s.score || 0); }, 0) / S.saved.length);
    const risky = S.saved.filter(function (s) { return (s.score || 0) < 40; }).length;
    const filter = S.listFilter || 'all';
    if (filter === 'clean' || filter === 'risky') S.listFilter = 'all';

    let list = S.saved.filter(function (s) {
      const f = S.listFilter || 'all';
      if (f === 'hold') return s.tag === 'hold';
      if (f === 'trash') return s.tag === 'trash';
      if (f === 'watch') return s.tag !== 'hold' && s.tag !== 'trash';
      return true;
    });
    list = list.slice().sort(function (x, y) {
      if (sort === 'change') return (Number(y.ch24) || 0) - (Number(x.ch24) || 0);
      if (sort === 'date') return (y.at || 0) - (x.at || 0);
      return (y.score || 0) - (x.score || 0);
    });

    const attn = [];
    const watchSet = {};
    watchedCoins().forEach(function (s) { watchSet[s.mint] = 1; });
    const scoreN = Number(S.alertPrefs.scoreN) || 10;
    const liqN = Number(S.alertPrefs.liqN) || 30;
    const priceN = Number(S.alertPrefs.priceN) || 40;
    S.saved.forEach(function (s) {
      if (!watchSet[s.mint]) return;
      if (typeof s.prevScore === 'number' && s.prevScore - s.score >= scoreN && takeAlert(s.mint, 'score')) {
        const d = s.prevScore - s.score;
        attn.push({ mint: s.mint, tone: 'bad', icon: 'down', title: s.symbol + (ru ? ' · скор ' : ' · score ') + s.prevScore + ' → ' + s.score, sub: ru ? 'Упал на ' + d + ' с прошлой проверки' : 'Down ' + d + ' since the last check' });
      } else if (typeof s.prevLiq === 'number' && s.prevLiq > 0 && (s.prevLiq - s.liq) / s.prevLiq * 100 >= liqN && takeAlert(s.mint, 'liq')) {
        const p = Math.abs(Math.round((s.liq - s.prevLiq) / s.prevLiq * 100));
        attn.push({ mint: s.mint, tone: 'warn', icon: 'drop', title: s.symbol + (ru ? ' · ликвидность −' : ' · liquidity −') + p + '%', sub: (ru ? 'С ' : 'From ') + usd(s.prevLiq) + (ru ? ' до ' : ' to ') + usd(s.liq) });
      } else if (Number(s.ch24) <= -priceN && takeAlert(s.mint, 'price')) {
        attn.push({ mint: s.mint, tone: 'bad', icon: 'down', title: s.symbol + (ru ? ' · цена ' : ' · price ') + Math.round(Number(s.ch24)) + '%', sub: ru ? 'Сильное падение за 24 часа' : 'Sharp drop over 24 hours' });
      } else if ((s.score || 0) < 40 && takeAlert(s.mint, 'risky')) {
        attn.push({ mint: s.mint, tone: 'bad', icon: 'alert', title: s.symbol + (ru ? ' · скор ' : ' · score ') + (s.score || 0), sub: ru ? 'Ниже 40 — высокий риск' : 'Below 40 — high risk' });
      }
    });

    const row = function (s) {
      const vv = verdictLabel(s.score || 0);
      const color = scoreColor(vv.cls);
      const ch = Number(s.ch24) || 0;
      const chCol = ch >= 0 ? 'var(--green)' : 'var(--red)';
      const d = (typeof s.prevScore === 'number') ? (s.score - s.prevScore) : 0;
      const delta = d ? (d > 0 ? '<em class="up">▲' + d + '</em>' : '<em class="down">▼' + Math.abs(d) + '</em>') : '';
      const al = alertOf(s);
      const tag = s.tag || 'watch';
      const open = (S.expanded || []).indexOf(s.mint) > -1;
      return '<div class="row-item' + (open ? ' open' : '') + '">' +
        '<button type="button" class="row it item" data-mint="' + esc(s.mint) + '">' +
        '<span class="ava ' + avaClass(vv.cls) + '">' + (s.image ? '<img src="' + esc(s.image) + '" alt="">' : esc(String(s.symbol || '?').slice(0, 2))) + '</span>' +
        '<span class="tx meta"><b>' + esc(s.symbol) + delta + '</b><span>' + usd(s.liq) + (s.at ? ' · ' + ago(s.at) : '') + '</span></span>' +
        sparkSvg(s) +
        '<span class="ch" style="color:' + chCol + '">' + (ch ? pct(ch) : '') + '</span>' +
        '<span class="snum num" style="color:' + color + '">' + s.score + '</span>' +
        '</button>' +
        '<div class="row-foot">' +
        '<button type="button" class="tag tg-' + tag + '" data-tag="' + esc(s.mint) + '">' + esc(tagLabel(tag)) + '</button>' +
        (al.length ? '<span class="al-flag">' + esc(al[0]) + '</span>' : '') +
        '<button type="button" class="row-more" data-exp="' + esc(s.mint) + '">' + (open ? (ru ? 'Скрыть' : 'Hide') : (ru ? 'История' : 'History')) + '</button>' +
        '</div>' +
        (open ? '<div class="row-exp"><div class="re-grid">' +
          '<div><span>MC</span><b>' + usd(s.mc) + '</b></div>' +
          '<div><span>' + (ru ? 'ликвидность' : 'liquidity') + '</span><b>' + usd(s.liq) + '</b></div>' +
          '<div><span>24h</span><b style="color:' + chCol + '">' + (ch ? pct(ch) : '—') + '</b></div>' +
          '<div><span>' + (ru ? 'проверено' : 'checked') + '</span><b>' + (s.at ? ago(s.at) : '—') + '</b></div>' +
          '</div>' +
          (s.hist && s.hist.length > 1 ? '<div class="hist">' + (ru ? 'История скора: ' : 'Score history: ') + s.hist.map(function (x) { return x.s; }).join(' → ') + '</div>' : '') +
          '</div>' : '') +
        '</div>';
    };

    let head = '<div class="lt' + (S.ui.big === false ? ' compact' : '') + '"><span>' + esc(t('savedTab')) + '</span><span class="lt-acts">' +
      '<button type="button" class="lt-txt" id="sortBtn">' + esc(sortLbl) + '</button>' +
      '<button type="button" class="lt-txt" id="refreshAll">' + esc(ru ? 'Обновить' : 'Refresh') + '</button>' +
      '<button type="button" class="lt-ico" id="listGear" aria-label="' + (ru ? 'Уведомления' : 'Alerts') + '">' + BELL + '</button>' +
      '</span></div>';
    head += '<p class="sub">' + esc(ru ? 'Обновляется каждые 45 секунд' : 'Refreshes every 45 seconds') + '</p>';
    head += '<div class="sum">' +
      '<div><b>' + S.saved.length + '</b><span>' + (ru ? 'монет' : 'tokens') + '</span></div>' +
      '<div><b>' + avg + '</b><span>' + (ru ? 'средний скор' : 'avg score') + '</span></div>' +
      '<div><b style="color:var(--red)">' + risky + '</b><span>' + (ru ? 'опасных' : 'risky') + '</span></div>' +
      '</div>';

    if (attn.length) {
      head += '<div class="sh"><b>' + esc(ru ? 'Требует внимания' : 'Needs attention') + '</b><span class="muted">' + attn.length + '</span></div>';
      head += '<div class="card ins">' + attn.slice(0, 4).map(function (a) {
        const tone = a.tone === 'warn' ? 'b-o' : 'b-r';
        const ic = a.icon === 'drop' ? INS_ICON.drop : INS_ICON.down;
        return '<button type="button" class="row attn-row" data-mint="' + esc(a.mint) + '"><div class="ic ' + tone + '">' + ic + '</div><div class="tx"><b>' + esc(a.title) + '</b><span>' + esc(a.sub) + '</span></div>' + CHEV + '</button>';
      }).join('') + '</div>';
    } else {
      head += '<p class="set-note">' + esc(alertLimitText()) + '</p>';
    }

    const filters = [
      ['all', ru ? 'Все' : 'All'],
      ['watch', ru ? 'Слежу' : 'Watching'],
      ['hold', ru ? 'В позиции' : 'Holding'],
      ['trash', ru ? 'Мусор' : 'Trash']
    ];
    head += '<div class="seg">' + filters.map(function (f) {
      return '<button type="button" class="lf' + ((S.listFilter || 'all') === f[0] ? ' on' : '') + '" data-f="' + f[0] + '">' + f[1] + '</button>';
    }).join('') + '</div>';

    let body = list.length
      ? '<div class="card wl list">' + list.map(row).join('') + '</div>'
      : '<p class="tiny" style="text-align:center;padding:24px 0">' + esc(ru ? 'Ничего не найдено по фильтру' : 'Nothing matches the filter') + '</p>';
    return '<div class="page">' + head + body + '</div>';
  }

  function viewProfile() {
    const ru = S.lang === 'ru';
    const u = TG && TG.initDataUnsafe ? TG.initDataUnsafe.user : null;
    const name = u ? [u.first_name, u.last_name].filter(Boolean).join(' ') : t('guest');
    const handle = u && u.username ? '@' + u.username : t('noUser');
    const pfp = u && u.photo_url ? '<img src="' + esc(u.photo_url) + '" alt="">' : esc(name.slice(0, 1).toUpperCase());
    const prem = isPrem();
    const row = function (id, label, val, extra) {
      return '<button type="button" class="set-row' + (extra || '') + '" id="' + id + '">' + esc(label) +
        (val != null ? '<span class="val' + (id === 'plan' && prem ? ' prem' : '') + '">' + val + '</span>' : '') + CHEV + '</button>';
    };
    return '<div class="page">' +
      '<h1 class="lt' + (S.ui.big === false ? ' compact' : '') + '">' + esc(t('profileTab')) + '</h1>' +
      '<div class="card phead"><span class="pfp">' + pfp + '</span><span><b>' + esc(name) + '</b><span>' + esc(handle) + '</span></span></div>' +
      '<div class="stats"><div class="stat"><b>' + (S.stats.scans || 0) + '</b><span>' + esc(t('scanned')) + '</span></div>' +
      '<div class="stat"><b>' + S.saved.length + '</b><span>' + esc(t('savedN')) + '</span></div></div>' +
      '<p class="grp">' + esc(ru ? 'Приложение' : 'App') + '</p>' +
      '<div class="card">' +
      row('aboutApp', ru ? 'Инфо' : 'Info', null) +
      row('channel', ru ? 'Наш канал' : 'Our channel', '@reactive_family') +
      row('lang', t('langRow'), S.lang === 'ru' ? 'Русский' : 'English') +
      row('plan', ru ? 'Тариф' : 'Plan', prem
        ? (ru ? 'Premium · ' + Math.max(1, Math.ceil((S.planUntil - Date.now()) / 864e5)) + ' дн.' : 'Premium · ' + Math.max(1, Math.ceil((S.planUntil - Date.now()) / 864e5)) + 'd')
        : (ru ? 'Free · 20/день' : 'Free · 20/day')) +
      row('how', ru ? 'Как это работает' : 'How it works', null) +
      row('notify', ru ? 'Уведомления' : 'Notifications', S.notify ? (ru ? 'вкл' : 'on') : (ru ? 'выкл' : 'off')) +
      row('auto', ru ? 'Автообновление' : 'Auto-refresh', S.autoUpd === false ? (ru ? 'выкл' : 'off') : (ru ? 'вкл' : 'on')) +
      row('hide', ru ? 'Скрывать суммы' : 'Hide amounts', S.hideMoney ? (ru ? 'вкл' : 'on') : (ru ? 'выкл' : 'off')) +
      row('screen', ru ? 'Экран проверки' : 'Check screen', null) +
      '</div>' +
      '<p class="grp">' + esc(ru ? 'Данные' : 'Data') + '</p>' +
      '<div class="card">' +
      row('cache', ru ? 'Очистить кэш' : 'Clear cache', null) +
      '<button type="button" class="set-row danger" id="clear">' + esc(t('clear')) + '</button>' +
      '</div>' +
      '<p class="grp">' + esc(ru ? 'Для теста' : 'For testing') + '</p>' +
      '<div class="card">' +
      row('testPrem', ru ? 'Premium локально' : 'Premium locally', prem ? (ru ? 'вкл' : 'on') : (ru ? 'выкл' : 'off')) +
      '<button type="button" class="set-row" id="testReset">' + esc(ru ? 'Сбросить первый вход' : 'Reset first launch') + '</button>' +
      '</div>' +
      '<p class="foot">' + esc(t('about')) + ' · v' + APP_VER + '</p>' +
      '</div>';
  }

  

  function viewOnboard() {
    const slides = [
      { t: t('ob1t'), p: t('ob1p'), v: '82', s: t('obCardS'), art: 'gauge' },
      { t: t('ob2t'), p: t('ob2p'), v: '8', s: t('obCardS'), art: 'layers' },
      { t: t('ob3t'), p: t('ob3p'), v: '12', s: t('obCardS'), art: 'list' }
    ];
    let i = 0;
    document.getElementById('dock').style.display = 'none';
    app.innerHTML = '<div class="ob"><div class="ob-top"><button class="ob-skip" id="obSkip">' + esc(t('skip')) + '</button></div>' +
      '<div class="ob-art"><span class="halo"></span><div class="ob-card"><div class="ob-ico" id="obArt"></div><div class="k">' + esc(t('obCardK')) + '</div><div class="v" id="obV"></div><div class="s" id="obS"></div></div></div>' +
      '<div class="ob-body"><h1 id="obT"></h1><p id="obP"></p></div>' +
      '<div class="ob-dots" id="obD"></div>' +
      '<div class="ob-foot"><button class="btn" id="obNext">' + esc(t('next')) + '</button></div></div>';
    const paint = () => {
      $('#obT').innerHTML = slides[i].t.replace(/\n/g, '<br>');
      $('#obP').textContent = slides[i].p;
      $('#obV').textContent = slides[i].v;
      const artEl = $('#obArt'); if (artEl) artEl.innerHTML = ART[slides[i].art] || '';
      $('#obS').textContent = slides[i].s;
      $('#obD').innerHTML = slides.map((_, k) => '<i' + (k === i ? ' class="on"' : '') + '></i>').join('');
      $('#obNext').textContent = i === slides.length - 1 ? t('start') : t('next');
    };
    const done = () => { write(K.ob, true); render(); };
    $('#obNext').onclick = () => { haptic(); if (i < slides.length - 1) { i++; paint(); } else done(); };
    $('#obSkip').onclick = done;
    paint();
  }

  const HELP = {
    ru: [
      ['Ликвидность', 'Сколько денег в пуле. Мало ликвидности — нельзя продать без огромного слиппеджа.'],
      ['Распределение', 'Сколько монет у крупных кошельков. Если топ-10 держат больше 50% — они могут обрушить цену.'],
      ['Дев и бандлы', 'Риски из Rugcheck: связанные кошельки, бандлы, прошлые запуски создателя.'],
      ['Контракт', 'Отозваны ли права на минт и заморозку. Если нет — создатель может печатать токены или блокировать продажи.'],
      ['Активность', 'Объём торгов против ликвидности. Слишком мало — мёртвая монета, слишком много за минуту — манипуляция.'],
      ['Возраст', 'Сколько живёт пара. Совсем новая — выше риск, старая — больше истории.'],
      ['Цена за 24ч', 'Сильное падение — возможен дамп; сильный рост — риск войти на пике.'],
      ['Ссылки', 'Сайт и соцсети. Их отсутствие — красный флаг.'],
      ['MC / FDV', 'MC — капитализация по цене, FDV — если бы все токены стоили столько же. FDV сильно выше MC = много токенов ещё не в обороте.'],
      ['Holders', 'Сколько кошельков держат монету. Мало — легко манипулировать.'],
      ['Buys / Sells', 'Сделки за 24ч. Перекос в продажи — давление вниз.'],
      ['Honeypot', 'Ловушка: купить можно, продать нельзя. Если «да» — не покупай.'],
      ['Buy / Sell tax', 'Налог на покупку и продажу. Выше 5% — почти всегда скам.'],
      ['LP holders', 'Сколько кошельков держат ликвидность. 1–2 — риск вывода пула.']
    ],
    en: [
      ['Liquidity', 'How much money is in the pool. Low liquidity means you cannot exit without huge slippage.'],
      ['Distribution', 'How much top wallets hold. If top-10 hold over 50%, they can crash the price.'],
      ['Dev & bundles', 'Rugcheck risks: linked wallets, bundles, creator history.'],
      ['Contract', 'Whether mint and freeze authorities are revoked. If not, the dev can mint or block sells.'],
      ['Activity', 'Volume vs liquidity. Too low — dead token; too high in a minute — manipulation.'],
      ['Age', 'How long the pair has existed. Very new — higher risk, older — more history.'],
      ['24h price', 'A deep drop may be a dump; a huge pump is a risk of buying the top.'],
      ['Links', 'Website and socials. Missing links are a red flag.'],
      ['MC / FDV', 'MC is price × supply; FDV assumes all tokens are unlocked. FDV far above MC means lots of locked tokens.'],
      ['Holders', 'How many wallets hold the token. Few holders = easy manipulation.'],
      ['Buys / Sells', 'Trades in 24h. More sells = downward pressure.'],
      ['Honeypot', 'You can buy but not sell. If yes — do not buy.'],
      ['Buy / Sell tax', 'Tax on trades. Above 5% is almost always a scam.'],
      ['LP holders', 'How many wallets hold liquidity. 1–2 means the pool can be pulled.']
    ]
  };

  const STORY_KEY = 'tc.ob.story.v1';
  const BANNER_KEY = 'tc.ob.banners.v1';

  function bannerSlides() {
    const ru = S.lang === 'ru';
    const welcome = '<div class="bn-ill" style="background:#1E2622">' +
      '<img class="bn-logo" src="assets/reactive-icon-512.png?v=20261118ios12" alt="">' +
      '<div class="bn-fl bn-tk" style="left:18px;top:16px;width:188px;transform:rotate(-5deg)">' +
      '<div class="bn-top"><span class="bn-ava">MO</span><span class="bn-id"><b>MOODENG</b><span>Moo Deng</span></span><span class="bn-score" style="color:var(--green)"><b>81</b><i>/100</i></span></div>' +
      '<div class="bn-pl"><b>$0.2134</b><span style="color:var(--green)">+4.8%</span></div><div class="bn-bar"><i style="width:81%;background:var(--green)"></i></div>' +
      '<div class="bn-st"><div><span>MC</span><b>$212M</b></div><div><span>' + (ru ? 'Ликв.' : 'Liq') + '</span><b>$4.21M</b></div><div><span>' + (ru ? 'Возраст' : 'Age') + '</span><b>214d</b></div></div></div>' +
      '<div class="bn-fl bn-tk" style="left:118px;top:58px;width:200px;transform:rotate(3deg)">' +
      '<div class="bn-top"><span class="bn-ava">PX</span><span class="bn-id"><b>PEPEX</b><span>PepeX</span></span><span class="bn-score" style="color:var(--red)"><b>34</b><i>/100</i></span></div>' +
      '<div class="bn-pl"><b>$0.0004120</b><span style="color:var(--red)">-18.4%</span></div><div class="bn-bar"><i style="width:34%;background:var(--red)"></i></div>' +
      '<div class="bn-st"><div><span>MC</span><b>$412.0K</b></div><div><span>' + (ru ? 'Ликв.' : 'Liq') + '</span><b>$86.4K</b></div><div><span>' + (ru ? 'Возраст' : 'Age') + '</span><b>6h</b></div></div></div>' +
      '<div class="bn-chip" style="left:16px;bottom:16px"><span class="dot" style="background:var(--red)"></span>' + (ru ? 'Минт не отозван' : 'Mint not revoked') + '</div>' +
      '<div class="bn-chip bn-paste" style="right:16px;bottom:16px">' + (ru ? 'Вставить' : 'Paste') + '</div></div>';
    const premium = '<div class="bn-ill" style="background:#28241D">' +
      '<div class="bn-fl" style="left:14px;top:22px;width:200px;padding:4px 0;transform:rotate(-3deg)">' +
      '<div class="bn-rw"><span class="bn-ava">MO</span><span class="bn-id"><b>MOODENG</b><span>$4.21M</span></span><svg width="40" height="16"><polyline points="1,14 14,10 26,7 39,3" fill="none" stroke="#30D158" stroke-width="1.6" stroke-linecap="round"/></svg><b style="color:var(--green)">81</b></div>' +
      '<div class="bn-rw"><span class="bn-ava">GR</span><span class="bn-id"><b>GRASS</b><span>$312.7K</span></span><svg width="40" height="16"><polyline points="1,8 14,7 26,9 39,8" fill="none" stroke="#30D158" stroke-width="1.6" stroke-linecap="round"/></svg><b style="color:var(--yellow)">57</b></div>' +
      '<div class="bn-rw"><span class="bn-ava">WI</span><span class="bn-id"><b>WIFX</b><span>$198.5K</span></span><svg width="40" height="16"><polyline points="1,4 14,7 26,11 39,14" fill="none" stroke="#FF453A" stroke-width="1.6" stroke-linecap="round"/></svg><b style="color:var(--yellow)">52</b></div></div>' +
      '<div class="bn-fl bn-limit" style="right:12px;top:18px;transform:rotate(4deg)"><div style="color:var(--blue);font-size:22px;line-height:1">∞</div><b>' + (ru ? 'Без лимита' : 'Unlimited') + '</b><span>' + (ru ? 'проверок в час' : 'checks per hour') + '</span></div>' +
      '<div class="bn-fl bn-note" style="left:48px;bottom:18px"><img src="assets/reactive-icon-512.png?v=20261118ios12" alt=""><div><b>Reactive</b><span>' + (ru ? 'WIFX: дев продал 4.2%, скор теперь ' : 'WIFX: dev sold 4.2%, score now ') + '<em style="color:var(--yellow);font-style:normal">52</em></span></div></div></div>';
    const wallets = '<div class="bn-ill" style="background:#1D222B">' +
      '<div class="bn-fl" style="left:12px;top:28px;width:176px;padding:4px 0;transform:rotate(-3deg)">' +
      '<div class="bn-rw"><span class="bn-ava" style="color:var(--green)">7x</span><span class="bn-id"><b>7xKX…9fPq</b><span>' + (ru ? 'купил ' : 'bought ') + '<em style="color:var(--green);font-style:normal">$1.2K</em></span></span></div>' +
      '<div class="bn-rw"><span class="bn-ava" style="color:var(--blue)">Ab</span><span class="bn-id"><b>AbE3…k2Lm</b><span>' + (ru ? 'держит · 0.8%' : 'holds · 0.8%') + '</span></span></div></div>' +
      '<div class="bn-fl" style="left:16px;bottom:18px;width:168px;padding:4px 0;transform:rotate(2deg)"><div class="bn-rw"><span class="bn-ava" style="color:var(--red)">Hq</span><span class="bn-id"><b>Hq9w…3TzB</b><span>' + (ru ? 'продал ' : 'sold ') + '<em style="color:var(--red);font-style:normal">$860</em></span></span></div></div>' +
      '<div class="bn-fl bn-tk" style="right:12px;top:70px;width:150px;transform:rotate(3deg)"><div class="bn-top"><span class="bn-ava">PX</span><span class="bn-id"><b>PEPEX</b><span>PepeX</span></span></div><div class="bn-score" style="color:var(--red);margin-top:8px"><b>34</b><i>/100</i></div><div class="bn-bar"><i style="width:34%;background:var(--red)"></i></div><div style="font-size:11px;color:var(--l2);margin-top:6px">' + (ru ? '2 кошелька в монете' : '2 wallets in this coin') + '</div></div></div>';
    return [
      { ill: welcome, title: ru ? 'Проверь монету\nза 30 секунд' : 'Check any coin\nin 30 seconds', text: ru ? 'Вставь адрес — Reactive покажет скор, риски по-русски и сколько потеряешь на входе.' : 'Paste an address — Reactive shows the score, the risks in plain words and what you lose on entry.', cta: ru ? 'Поехали' : "Let's go", act: 'check' },
      { ill: premium, title: 'Reactive Premium', text: '', perks: ru ? ['Без лимита проверок', 'Вторая половина рисков', 'Топ держателей'] : ['Unlimited checks', 'The other half of the risks', 'Top holders'], cta: ru ? 'Подключить' : 'Subscribe', act: 'prem' },
      { ill: wallets, title: 'Smart Wallets', text: ru ? 'Добавь кошельки — Reactive покажет, что они делают с твоими монетами.' : 'Add wallets — Reactive shows what they do with your coins.', cta: ru ? 'Добавить кошелёк' : 'Add wallet', act: 'wallets' }
    ];
  }

  function finishBanners(act) {
    write(BANNER_KEY, true);
    write(K.ob, true);
    const el = document.getElementById('banners');
    dismiss(el, function () {
      if (act === 'prem') { showPaywall(); return; }
      if (act === 'wallets') { S.tab = 'scan'; S.resultOpen = false; render(); setTimeout(addWallet, 60); return; }
      if (act === 'check') { S.tab = 'scan'; S.resultOpen = false; render(); }
    });
  }

  function openBanners() {
    if (document.getElementById('banners')) return;
    const slides = bannerSlides();
    const wrap = document.createElement('div');
    wrap.className = 'bn';
    wrap.id = 'banners';
    wrap.innerHTML = '<button type="button" class="bn-x" id="bnX" aria-label="Close">' + SVG_X + '</button>' +
      '<div class="bn-sheet"><div class="bn-grab"></div><div class="bn-track" id="bnTrack">' +
      slides.map(function (s, i) {
        const perks = (s.perks || []).map(function (p) { return '<div class="bn-perk">' + esc(p) + '</div>'; }).join('');
        return '<section class="bn-slide"><div class="bn-body"><div class="bn-illwrap">' + s.ill + '</div><div class="bn-copy"><h2>' + esc(s.title).replace(/\n/g, '<br>') + '</h2>' +
          (s.text ? '<p>' + esc(s.text) + '</p>' : '') +
          (perks ? '<div class="bn-perks">' + perks + '</div>' : '') +
          '</div></div><div class="bn-foot"><button type="button" class="bn-go" data-act="' + s.act + '">' + esc(s.cta) + '</button></div></section>';
      }).join('') +
      '</div><div class="bn-dots" id="bnDots">' + slides.map(function (_, i) { return '<i' + (i === 0 ? ' class="on"' : '') + '></i>'; }).join('') + '</div></div>';
    document.body.appendChild(wrap);
    const track = wrap.querySelector('#bnTrack');
    const dots = wrap.querySelectorAll('#bnDots i');
    const parallax = function () {
      const w = track.clientWidth || 1;
      const i = Math.max(0, Math.min(slides.length - 1, Math.round(track.scrollLeft / w)));
      dots.forEach(function (d, k) { d.classList.toggle('on', k === i); });
      if (!motionOk()) return;
      track.querySelectorAll('.bn-illwrap').forEach(function (ill, k) {
        const dx = k - track.scrollLeft / w;
        ill.style.transform = 'translate3d(' + (dx * 36).toFixed(1) + 'px,0,0)';
      });
    };
    track.addEventListener('scroll', parallax, { passive: true });
    parallax();
    wrap.querySelector('#bnX').onclick = function () { finishBanners(''); };
    wrap.querySelectorAll('.bn-go').forEach(function (b) {
      b.onclick = function () { haptic(); finishBanners(b.dataset.act); };
    });
  }

  function storySlides() {
    const ru = S.lang === 'ru';
    const art = {
      check: '<div class="sa-ui"><div class="sa-tk"><div class="sa-row"><span class="ava a-good">MO</span><span><b>MOODENG</b><i>$0.2134</i></span><em style="color:var(--green)">81<small>/100</small></em></div><div class="sa-bar"><i style="width:81%;background:var(--green)"></i></div></div>' +
        '<div class="sa-tk sa-shift"><div class="sa-row"><span class="ava a-bad">PX</span><span><b>PEPEX</b><i>$0.0004120</i></span><em style="color:var(--red)">34<small>/100</small></em></div><div class="sa-bar"><i style="width:34%;background:var(--red)"></i></div></div>' +
        '<div class="sa-chip"><i style="background:var(--red)"></i>' + (ru ? 'Минт не отозван' : 'Mint not revoked') + '</div></div>',
      score: '<div class="sa-blocks">' +
        (ru ? ['Ликв.', 'Холдеры', 'Дев', 'Контракт', 'Актив.', 'Возраст', 'Цена', 'Ссылки'] : ['Liq', 'Holders', 'Dev', 'Contract', 'Activity', 'Age', 'Price', 'Links']).map(function (name, i) {
          const b = [name, [88, 42, 70, 35, 61, 80, 48, 90][i], ['green', 'red', 'green', 'red', 'yellow', 'green', 'yellow', 'green'][i]];
          return '<div><span>' + b[0] + '</span><b style="color:var(--' + b[2] + ')">' + b[1] + '</b><i style="width:' + b[1] + '%;background:var(--' + b[2] + ')"></i></div>';
        }).join('') + '</div>',
      risks: '<div class="sa-stack"><div class="sa-line"><span class="ic b-r">' + INS_ICON.key + '</span><span><b>' + (ru ? 'Минт не отозван' : 'Mint not revoked') + '</b><i>' + (ru ? 'Создатель может напечатать токены' : 'The dev can print tokens') + '</i></span></div>' +
        '<div class="sa-line"><span class="ic b-r">' + INS_ICON.people + '</span><span><b>' + (ru ? 'Топ-10 держат 62%' : 'Top-10 hold 62%') + '</b><i>' + (ru ? 'Пара кошельков может обвалить цену' : 'A few wallets can crash the price') + '</i></span></div>' +
        '<div class="sa-line"><span class="ic b-o">' + INS_ICON.lock + '</span><span><b>' + (ru ? 'LP не заблокирован' : 'LP is unlocked') + '</b><i>' + (ru ? 'Пул могут вывести' : 'The pool can be pulled') + '</i></span></div></div>',
      trade: '<div class="sa-deal"><div><span>$100</span><b style="color:var(--green)">−$2,10</b><i>2,1%</i></div><div><span>$500</span><b style="color:var(--orange)">−$46</b><i>9,2%</i></div><div><span>$1000</span><b style="color:var(--red)">−$171</b><i>17,1%</i></div></div><div class="sa-tax">' + (ru ? 'Налог · доля дева' : 'Tax · dev share') + ' <b>0% · 7,4%</b></div>',
      list: '<div class="sa-stack"><div class="sa-line"><span class="ava a-good">MO</span><span><b>MOODENG</b><i>$4.21M</i></span><svg width="48" height="18"><polyline points="1,14 16,10 32,8 47,3" fill="none" stroke="#30D158" stroke-width="1.6" stroke-linecap="round"/></svg><em style="color:var(--green)">81</em></div>' +
        '<div class="sa-line"><span class="ava a-mid">WI</span><span><b>WIFX <small style="color:var(--red)">▼19</small></b><i>$198.5K</i></span><svg width="48" height="18"><polyline points="1,4 16,8 32,12 47,16" fill="none" stroke="#FF453A" stroke-width="1.6" stroke-linecap="round"/></svg><em style="color:var(--yellow)">52</em></div>' +
        '<div class="sa-alert">' + (ru ? 'Сторож · скор 71 → 52' : 'Watcher · score 71 → 52') + '</div></div>',
      wallets: '<div class="sa-stack"><div class="sa-line"><span class="ava" style="color:var(--green)">7x</span><span><b>7xKX…9fPq</b><i>' + (ru ? 'купил $1.2K' : 'bought $1.2K') + '</i></span></div>' +
        '<div class="sa-line"><span class="ava" style="color:var(--red)">Hq</span><span><b>Hq9w…3TzB</b><i>' + (ru ? 'продал $860' : 'sold $860') + '</i></span></div>' +
        '<div class="sa-line"><span class="ava a-bad">PX</span><span><b>PEPEX</b><i>' + (ru ? '2 кошелька в монете' : '2 wallets in this coin') + '</i></span><em style="color:var(--red)">34</em></div></div>',
      prem: '<div class="sa-stack"><div class="sa-line sa-blur"><span class="ava">H1</span><span><b>9AhK…sbkw</b><i>12.4%</i></span></div><div class="sa-line sa-blur"><span class="ava">H2</span><span><b>3kLm…91Qa</b><i>8.1%</i></span></div><div class="sa-lock">' + LOCK_SVG + ' Premium</div></div>',
      custom: '<div class="sa-stack"><div class="sa-line"><span class="ic b-n">≡</span><span><b>' + (ru ? 'Снайпер' : 'Sniper') + '</b><i>' + (ru ? 'давление 22 · возраст 4' : 'pressure 22 · age 4') + '</i></span><em style="color:var(--blue)">72</em></div><div class="sa-line"><span class="ic b-r">!</span><span><b>' + (ru ? 'Дев больше 3%' : 'Dev above 3%') + '</b><i>' + (ru ? 'красный флаг' : 'red flag') + '</i></span></div><div class="sa-line"><span class="ic b-g">R</span><span><b>Reactive</b><i>' + (ru ? 'общий скор рядом' : 'general score stays') + '</i></span><em style="color:var(--green)">81</em></div></div>',
      honest: '<div class="sa-honest"><img src="assets/reactive-icon-512.png?v=20261118ios12" alt=""><b>0–100</b><span>' + (ru ? 'эвристика, не гарантия' : 'a heuristic, not a guarantee') + '</span></div>'
    };
    return [
      { art: art.check, t: ru ? 'Проверка за 30 секунд' : 'A check in 30 seconds', p: ru ? 'Вставь адрес — Reactive покажет скор, риски простыми словами и сколько потеряешь на входе.' : 'Paste an address — Reactive shows the score, the risks in plain words, and what you lose on entry.' },
      { art: art.score, t: ru ? 'Скор от 0 до 100' : 'A score from 0 to 100', p: ru ? 'Восемь блоков в одном числе. Зелёный — низкий риск, жёлтый — средний, красный — высокий.' : 'Eight blocks in one number. Green — low risk, yellow — medium, red — high.' },
      { art: art.custom, t: ru ? 'Свои проверки' : 'Your own checks', p: ru ? 'Задай веса блоков и красные флаги. Общий скор Reactive остаётся рядом, а твоя проверка считается отдельно.' : 'Set block weights and red flags. The general Reactive score stays beside a score that follows your rules.' },
      { art: art.risks, t: ru ? 'Что важно и риски' : 'What matters, and the risks', p: ru ? 'Не таблица, а фразы: минт открыт, топ-10 держат много, LP не заблокирован.' : 'Not a table — sentences: mint is open, top-10 hold too much, LP isn’t locked.' },
      { art: art.trade, t: ru ? 'Для сделки' : 'For a trade', p: ru ? 'Три суммы: $100, $500 и $1000. Сколько долларов и процентов сгорит на входе.' : 'Three sizes: $100, $500 and $1000. How many dollars and percent you lose on entry.' },
      { art: art.list, t: ru ? 'Список и сторож' : 'List and watcher', p: ru ? 'Монеты со скором, спарклайном и пометкой, если скор или ликвидность упали.' : 'Coins with a score, a sparkline, and a flag when the score or liquidity drops.' },
      { art: art.wallets, t: 'Smart Wallets', p: ru ? 'Добавь кошельки — Reactive покажет, что они делают с монетами из твоего списка.' : 'Add wallets — Reactive shows what they do with the coins on your list.' },
      { art: art.prem, t: 'Premium', p: ru ? 'Без лимита проверок, топ держателей, все инсайты и алерты, когда монета ломается.' : 'Unlimited checks, top holders, every insight, and alerts when a coin breaks.' },
      { art: art.honest, t: ru ? 'Оценка — эвристика, не гарантия' : 'A score is a heuristic, not a guarantee', p: ru ? 'Раг случается и с чистыми монетами. Reactive экономит время и показывает риски, а не решает за тебя.' : 'Rugs happen to clean coins too. Reactive saves time and shows risks — it doesn’t decide for you.' }
    ];
  }

  function openStory(onboard) {
    if (document.getElementById('story')) return;
    const ru = S.lang === 'ru';
    const slides = storySlides();
    const wrap = document.createElement('div');
    wrap.className = 'story';
    wrap.id = 'story';
    wrap.innerHTML = '<button type="button" class="story-x" id="storyX" aria-label="Close">' + SVG_X + '</button>' +
      '<div class="story-sheet"><div class="story-track" id="storyTrack">' +
      slides.map(function (s) {
        return '<section class="story-slide"><div class="story-art">' + s.art + '</div><h2>' + esc(s.t) + '</h2><p>' + esc(s.p) + '</p></section>';
      }).join('') +
      '</div><div class="story-dots" id="storyDots">' + slides.map(function (_, i) { return '<i' + (i === 0 ? ' class="on"' : '') + '></i>'; }).join('') + '</div>' +
      '<button type="button" class="btn" id="storyNext">' + (ru ? 'Далее' : 'Next') + '</button></div>';
    document.body.appendChild(wrap);
    const track = wrap.querySelector('#storyTrack');
    const dots = wrap.querySelectorAll('#storyDots i');
    const next = wrap.querySelector('#storyNext');
    let idx = 0;
    const finish = function () {
      if (onboard) { write(STORY_KEY, true); write(K.ob, true); }
      dismiss(wrap);
    };
    const sync = function () {
      const w = track.clientWidth || 1;
      idx = Math.max(0, Math.min(slides.length - 1, Math.round(track.scrollLeft / w)));
      dots.forEach(function (d, i) { d.classList.toggle('on', i === idx); });
      if (motionOk()) {
        track.querySelectorAll('.story-art').forEach(function (art, k) {
          art.style.transform = 'translate3d(' + ((k - track.scrollLeft / w) * 28).toFixed(1) + 'px,0,0)';
        });
      }
      next.textContent = idx === slides.length - 1 ? (ru ? 'Готово' : 'Done') : (ru ? 'Далее' : 'Next');
    };
    track.addEventListener('scroll', sync, { passive: true });
    next.onclick = function () {
      haptic();
      if (idx >= slides.length - 1) { finish(); return; }
      track.scrollTo({ left: (idx + 1) * track.clientWidth, behavior: 'smooth' });
    };
    wrap.querySelector('#storyX').onclick = finish;
    haptic();
  }

  function showHow() { S.tab = 'info'; S.infoFocus = 'how'; haptic(); render(); }

  function loadShareImage(url) {
    return new Promise(function (resolve) {
      if (!url) { resolve(null); return; }
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = function () {
        try {
          const t = document.createElement('canvas');
          t.width = t.height = 8;
          const x = t.getContext('2d');
          x.drawImage(img, 0, 0, 8, 8);
          x.getImageData(0, 0, 1, 1);
          resolve(img);
        } catch (e) { resolve(null); }
      };
      img.onerror = function () { resolve(null); };
      img.src = url;
    });
  }
  function loadLogo(url) {
    return loadShareImage(url).then(function (img) {
      if (img || !url) return img;
      const bare = String(url).replace(/^https?:\/\//, '');
      const prox = 'https://images.weserv.nl/?url=' + encodeURIComponent(bare) + '&w=320&h=320&fit=cover&output=png';
      return loadShareImage(prox);
    });
  }

  function canvasRound(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function wrapCanvas(ctx, text, max) {
    const words = String(text || '').split(/\s+/);
    const lines = [];
    let cur = '';
    words.forEach(function (w) {
      const t = cur ? cur + ' ' + w : w;
      if (ctx.measureText(t).width > max && cur) { lines.push(cur); cur = w; }
      else cur = t;
    });
    if (cur) lines.push(cur);
    return lines.slice(0, 2);
  }

  async function buildSharePng(tk) {
    const ru = S.lang === 'ru';
    const W = 1080, H = 1350;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const ctx = c.getContext('2d');
    const v = verdictLabel(S.result.score);
    const col = v.cls === 'good' ? '#30D158' : v.cls === 'mid' ? '#FFD60A' : '#FF453A';
    const ch = Number(tk.ch24) || 0;
    const font = '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif';
    const mine = runCustom(S.result, activeCustom());
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    canvasRound(ctx, 28, 28, W - 56, H - 56, 40);
    ctx.fillStyle = '#1C1C1E';
    ctx.fill();

    const img = await loadLogo(tk.image);
    const ax = 64, ay = 64, as = 112;
    ctx.beginPath();
    ctx.arc(ax + as / 2, ay + as / 2, as / 2 + 6, 0, Math.PI * 2);
    ctx.strokeStyle = col;
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.save();
    ctx.beginPath();
    ctx.arc(ax + as / 2, ay + as / 2, as / 2, 0, Math.PI * 2);
    ctx.clip();
    if (img) ctx.drawImage(img, ax, ay, as, as);
    else {
      ctx.fillStyle = '#2C2C2E';
      ctx.fillRect(ax, ay, as, as);
      ctx.fillStyle = '#fff';
      ctx.font = '700 42px ' + font;
      ctx.textAlign = 'center';
      ctx.fillText(String(tk.symbol || '?').slice(0, 2).toUpperCase(), ax + as / 2, ay + 70);
      ctx.textAlign = 'left';
    }
    ctx.restore();

    const sym = String(tk.symbol || 'TOKEN');
    ctx.fillStyle = '#fff';
    ctx.font = '700 64px ' + font;
    let symSize = 64;
    while (symSize > 32 && ctx.measureText(sym).width > 620) {
      symSize -= 4;
      ctx.font = '700 ' + symSize + 'px ' + font;
    }
    ctx.fillText(sym, 204, 112);
    ctx.fillStyle = 'rgba(235,235,245,.6)';
    ctx.font = '500 28px ' + font;
    ctx.fillText(String(tk.name || '').slice(0, 28), 204, 152);
    const mint = String(tk.mint || '');
    const short = mint ? mint.slice(0, 4) + '…' + mint.slice(-4) : '';
    ctx.font = '500 22px ' + font;
    ctx.fillText('$' + sym + (short ? '  ·  ' + short : ''), 204, 186);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#fff';
    ctx.font = '700 32px ' + font;
    ctx.fillText(price(tk.price), W - 64, 118);
    ctx.fillStyle = ch >= 0 ? '#30D158' : '#FF453A';
    ctx.font = '650 26px ' + font;
    ctx.fillText(tk.ch24 ? pct(tk.ch24) + (ru ? ' 24ч' : ' 24h') : '', W - 64, 156);
    ctx.textAlign = 'left';

    const cx = 540, cy = 390, R = 118;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(118,118,128,.28)';
    ctx.lineWidth = 16;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (S.result.score / 100));
    ctx.strokeStyle = col;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.fillStyle = col;
    ctx.font = '700 92px ' + font;
    ctx.textAlign = 'center';
    ctx.fillText(String(S.result.score), cx, cy + 18);
    ctx.fillStyle = 'rgba(235,235,245,.45)';
    ctx.font = '600 22px ' + font;
    ctx.fillText('/100', cx, cy + 48);
    const pill = v.txt || '';
    ctx.font = '650 22px ' + font;
    const pw = ctx.measureText(pill).width + 36;
    canvasRound(ctx, cx - pw / 2, cy + R + 16, pw, 36, 18);
    ctx.fillStyle = '#2C2C2E';
    ctx.fill();
    ctx.fillStyle = col;
    ctx.fillText(pill, cx, cy + R + 41);
    ctx.textAlign = 'left';

    const chartY = 590, chartH = 132;
    canvasRound(ctx, 64, chartY, W - 128, chartH, 22);
    ctx.fillStyle = '#000';
    ctx.fill();
    const ch1 = Number(tk.ch1) || 0, ch6 = Number(tk.ch6) || 0;
    const safe = function (p) { return Math.max(-95, p); };
    const nowP = 100;
    const pts = [
      nowP / (1 + safe(ch) / 100),
      nowP / (1 + safe(ch6) / 100),
      nowP / (1 + safe(ch1) / 100),
      nowP
    ];
    const pMin = Math.min.apply(null, pts), pMax = Math.max.apply(null, pts);
    const span = Math.max(0.5, pMax - pMin);
    const px = function (i) { return 96 + i * ((W - 192) / 3); };
    const py = function (val) { return chartY + 24 + (1 - (val - pMin) / span) * (chartH - 56); };
    ctx.beginPath();
    pts.forEach(function (val, i) {
      const x = px(i), y = py(val);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.lineTo(px(3), chartY + chartH - 16);
    ctx.lineTo(px(0), chartY + chartH - 16);
    ctx.closePath();
    const fade = ctx.createLinearGradient(0, chartY, 0, chartY + chartH);
    fade.addColorStop(0, col === '#FFD60A' ? 'rgba(255,214,10,.28)' : col === '#FF453A' ? 'rgba(255,69,58,.28)' : 'rgba(48,209,88,.28)');
    fade.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = fade;
    ctx.fill();
    ctx.beginPath();
    pts.forEach(function (val, i) {
      const x = px(i), y = py(val);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = col;
    ctx.lineWidth = 4;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(px(3), py(pts[3]), 6, 0, Math.PI * 2);
    ctx.fillStyle = col;
    ctx.fill();
    ctx.font = '600 16px ' + font;
    ctx.fillStyle = 'rgba(235,235,245,.4)';
    [ru ? '24ч' : '24h', '6h', '1h', ru ? 'сейчас' : 'now'].forEach(function (lab, i) {
      ctx.fillText(lab, px(i) - 12, chartY + chartH - 8);
    });

    function ageHuman(created) {
      if (!created) return '—';
      const mins = (Date.now() - created) / 60000;
      if (mins < 90) return Math.max(1, Math.round(mins)) + (ru ? ' мин' : ' min');
      const hrs = mins / 60;
      if (hrs < 36) return Math.round(hrs) + (ru ? ' ч' : ' h');
      const days = hrs / 24;
      if (days < 50) return Math.round(days) + (ru ? ' дн' : ' d');
      const years = days / 365;
      if (years >= 1) {
        const n = Math.round(years * 10) / 10;
        const num = (ru ? n.toFixed(1).replace('.', ',') : n.toFixed(1)).replace(/[,.]0$/, '');
        if (!ru) return num + ' yr';
        const whole = Math.floor(n);
        const word = (whole % 10 === 1 && whole % 100 !== 11) ? 'год' : (whole % 10 >= 2 && whole % 10 <= 4 && (whole % 100 < 10 || whole % 100 >= 20) ? 'года' : 'лет');
        return num + ' ' + word;
      }
      return Math.round(days / 30) + (ru ? ' мес' : ' mo');
    }
    const top10v = Number(tk.top10) || (tk.top || []).reduce(function (s, h) { return s + (h.pct || 0); }, 0);
    const tiles = [
      ['MC', usd(tk.mc)],
      [ru ? 'Ликвидность' : 'Liquidity', usd(tk.liq)],
      [ru ? 'Холдеры' : 'Holders', tk.holders ? num(tk.holders) : '—'],
      [ru ? 'Возраст' : 'Age', ageHuman(tk.created)],
      [ru ? 'Топ-10' : 'Top-10', top10v ? Math.round(top10v) + '%' : '—']
    ];
    const tileY = 742;
    tiles.forEach(function (m, i) {
      const colN = i < 3 ? i : i - 3;
      const row = i < 3 ? 0 : 1;
      const cols = i < 3 ? 3 : 2;
      const gap = 14;
      const tw = (W - 128 - gap * (cols - 1)) / cols;
      const x = 64 + colN * (tw + gap);
      const y = tileY + row * 96;
      canvasRound(ctx, x, y, tw, 84, 18);
      ctx.fillStyle = '#000';
      ctx.fill();
      ctx.fillStyle = 'rgba(235,235,245,.5)';
      ctx.font = '600 18px ' + font;
      ctx.fillText(m[0], x + 16, y + 30);
      ctx.fillStyle = '#fff';
      ctx.font = '700 30px ' + font;
      ctx.fillText(String(m[1]), x + 16, y + 64);
    });

    const order = ['liq', 'holders', 'dev', 'contract', 'activity', 'age', 'price', 'links'];
    const names = { liq: ru ? 'Ликв.' : 'Liq', holders: ru ? 'Холд.' : 'Hold', dev: ru ? 'Дев' : 'Dev', contract: ru ? 'Минт' : 'Mint', activity: ru ? 'Объём' : 'Vol', age: ru ? 'Возр.' : 'Age', price: ru ? 'Цена' : 'Price', links: ru ? 'Ссылки' : 'Links' };
    const by = {};
    (S.result.blocks || []).forEach(function (b) { by[b.k] = b; });
    const barY = 946;
    order.forEach(function (k, i) {
      const x = 72 + i * 124;
      const b = by[k];
      const s = b ? b.s : 0;
      const bc = !b ? 'rgba(118,118,128,.35)' : s >= 0.7 ? '#30D158' : s >= 0.4 ? '#FFD60A' : '#FF453A';
      canvasRound(ctx, x, barY, 28, 56, 8);
      ctx.fillStyle = 'rgba(118,118,128,.22)';
      ctx.fill();
      const h = Math.max(6, Math.round(s * 56));
      canvasRound(ctx, x, barY + 56 - h, 28, h, 8);
      ctx.fillStyle = bc;
      ctx.fill();
      ctx.fillStyle = 'rgba(235,235,245,.55)';
      ctx.font = '600 15px ' + font;
      ctx.fillText(names[k], x - 6, barY + 76);
    });

    function chipRow(title, items, y) {
      ctx.fillStyle = 'rgba(235,235,245,.62)';
      ctx.font = '700 20px ' + font;
      ctx.fillText(title, 64, y);
      let x = 64;
      const yy = y + 26;
      items.slice(0, 3).forEach(function (it) {
        ctx.font = '600 20px ' + font;
        let label = it.text;
        const max = 280;
        while (label.length > 6 && ctx.measureText(label).width > max) label = label.slice(0, -2);
        if (label !== it.text) label = label.replace(/\s+\S*$/, '') + '…';
        const w = ctx.measureText(label).width + 44;
        if (x + w > W - 64) return;
        canvasRound(ctx, x, yy, w, 40, 20);
        ctx.fillStyle = '#2C2C2E';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + 18, yy + 20, 5, 0, Math.PI * 2);
        ctx.fillStyle = it.tone;
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.fillText(label, x + 32, yy + 27);
        x += w + 10;
      });
      return yy + 56;
    }
    const toneOf = function (t) { return t === 'good' ? '#30D158' : t === 'warn' ? '#FF9F0A' : '#FF453A'; };
    const ins = buildInsights(tk).filter(function (x) { return x.tone === 'bad' || x.tone === 'warn' || x.tone === 'good'; }).slice(0, 3).map(function (x) {
      const parts = insightParts(x.text);
      return { text: parts.title || x.text, tone: toneOf(x.tone) };
    });
    const seen = {};
    ins.forEach(function (it) { seen[it.text] = 1; });
    const risks = (tk.risks || []).map(function (r) {
      const low = /warn|medium|low/i.test(r.level || '');
      return { text: riskRu(r.name), tone: low ? '#FF9F0A' : '#FF453A' };
    }).filter(function (r) { return r.text && !seen[r.text]; }).slice(0, 3);
    let y = 1048;
    if (ins.length) y = chipRow(ru ? 'Что важно' : 'What matters', ins, y);
    if (risks.length) y = chipRow(ru ? 'Риски' : 'Risks', risks, y);
    if (mine) {
      const txt = (ru ? 'Проверка: ' : 'Check: ') + mine.name + ' — ' + mine.score;
      ctx.font = '650 22px ' + font;
      const w = ctx.measureText(txt).width + 32;
      canvasRound(ctx, 64, y, w, 40, 20);
      ctx.fillStyle = '#2C2C2E';
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.fillText(txt, 80, y + 27);
      y += 52;
    }

    const foot = 1188;
    canvasRound(ctx, 48, foot, W - 96, 128, 24);
    ctx.fillStyle = '#000';
    ctx.fill();
    const logo = await loadShareImage(new URL('assets/reactive-icon-512.png?v=20261118ios12', location.href).href);
    if (logo) {
      canvasRound(ctx, 72, foot + 18, 44, 44, 12);
      ctx.save();
      ctx.clip();
      ctx.drawImage(logo, 72, foot + 18, 44, 44);
      ctx.restore();
    }
    ctx.fillStyle = '#fff';
    ctx.font = '700 24px ' + font;
    ctx.fillText('Reactive', 128, foot + 36);
    ctx.fillStyle = 'rgba(235,235,245,.55)';
    ctx.font = '500 18px ' + font;
    ctx.fillText('@reactive_app', 128, foot + 58);
    ctx.fillStyle = '#fff';
    ctx.font = '650 22px ' + font;
    ctx.fillText(ru ? 'Проверь любую монету за 30 сек → в Telegram' : 'Check any coin in 30 sec → in Telegram', 250, foot + 42);
    ctx.fillStyle = 'rgba(235,235,245,.4)';
    ctx.font = '400 16px ' + font;
    const disc = ru ? 'Скор — грубая общая оценка по данным. В Reactive можно создать свои проверки.' : 'The score is a rough overall read of the data. In Reactive you can build your own checks.';
    ctx.fillText(disc, 72, foot + 100);

    return await new Promise(function (resolve) { c.toBlob(function (b) { resolve(b); }, 'image/png'); });
  }

  function openSharePreview(blob, ru) {
    const url = URL.createObjectURL(blob);
    const old = document.getElementById('sharePrev');
    if (old) old.remove();
    const wrap = document.createElement('div');
    wrap.className = 'share-prev';
    wrap.id = 'sharePrev';
    wrap.innerHTML = '<button type="button" class="story-x" id="spx" aria-label="Close">' + SVG_X + '</button>' +
      '<img alt="" src="' + url + '">' +
      '<p>' + (ru ? 'Удерживай, чтобы сохранить' : 'Hold the image to save it') + '</p>' +
      '<a class="btn" id="spdl" download="reactive.png" href="' + url + '">' + (ru ? 'Скачать' : 'Download') + '</a>';
    document.body.appendChild(wrap);
    const close = function () { URL.revokeObjectURL(url); wrap.remove(); };
    wrap.querySelector('#spx').onclick = close;
  }

  async function shareResult() {
    const tk = S.result && S.result.token;
    if (!tk) return;
    const ru = S.lang === 'ru';
    let blob;
    try { blob = await buildSharePng(tk); } catch (e) { toast(ru ? 'Не удалось собрать картинку' : 'Couldn’t build the image'); return; }
    if (!blob) { toast(ru ? 'Не удалось собрать картинку' : 'Couldn’t build the image'); return; }
    const file = new File([blob], 'reactive-' + String(tk.symbol || 'coin') + '.png', { type: 'image/png' });
    const payload = { files: [file], title: 'Reactive · ' + (tk.symbol || ''), text: (ru ? 'Проверка ' : 'Check ') + (tk.symbol || '') + ' · Reactive' };
    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share(payload);
        return;
      }
    } catch (e) {
      if (e && e.name === 'AbortError') return;
    }
    openSharePreview(blob, ru);
  }

  const ETA = { liq: 0.8, holders: 2.5, dev: 3, contract: 2, activity: 1.2, age: 0.8, price: 0.8, links: 1.5 };

  function pendingBlocks(haveKeys, lang) {
    const all = ['liq', 'holders', 'dev', 'contract', 'activity', 'age', 'price', 'links'];
    const missing = all.filter(function (k) { return haveKeys.indexOf(k) === -1; });
    if (!missing.length) return '';
    return missing.map(function (k) {
      return '<div class="cat loading"><div class="cat-top"><span class="cat-ico"><span class="mini-spin"></span></span>' +
        '<span class="cat-v" style="color:var(--text-3)">—</span></div>' +
        '<span class="cat-t">' + esc(t(k)) + '</span>' +
        '<span class="cat-pb"><i style="width:0%"></i></span>' +
        '<span class="cat-s">' + esc((lang === 'ru' ? 'загружаю · ≈' : 'loading · ≈') + ETA[k] + (lang === 'ru' ? ' с' : 's')) + '</span></div>';
    }).join('');
  }

  function blockArt(k, c) {
    if (k === 'liq') return '<svg viewBox="0 0 240 140" fill="none"><rect x="16" y="22" width="208" height="18" rx="9" fill="rgba(255,255,255,.10)"/><rect x="16" y="22" width="130" height="18" rx="9" fill="' + c + '"/><rect x="16" y="60" width="208" height="18" rx="9" fill="rgba(255,255,255,.10)"/><rect x="16" y="60" width="74" height="18" rx="9" fill="' + c + '" opacity=".7"/><rect x="16" y="98" width="208" height="18" rx="9" fill="rgba(255,255,255,.10)"/><rect x="16" y="98" width="170" height="18" rx="9" fill="' + c + '" opacity=".45"/></svg>';
    if (k === 'holders') return '<svg viewBox="0 0 240 140" fill="none"><circle cx="58" cy="70" r="30" stroke="' + c + '" stroke-width="9"/><circle cx="126" cy="70" r="22" stroke="' + c + '" stroke-width="8" opacity=".7"/><circle cx="184" cy="70" r="14" stroke="' + c + '" stroke-width="7" opacity=".45"/></svg>';
    if (k === 'dev') return '<svg viewBox="0 0 240 140" fill="none"><rect x="38" y="12" width="164" height="116" rx="20" stroke="' + c + '" stroke-width="8"/><path d="M92 46l-20 24 20 24M148 46l20 24-20 24" stroke="' + c + '" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    if (k === 'contract') return '<svg viewBox="0 0 240 140" fill="none"><rect x="80" y="10" width="80" height="120" rx="16" stroke="' + c + '" stroke-width="8"/><path d="M100 44h40M100 70h40M100 96h24" stroke="' + c + '" stroke-width="8" stroke-linecap="round"/></svg>';
    if (k === 'activity') return '<svg viewBox="0 0 240 140" fill="none"><path d="M18 112l38-38 28 20 34-56 34 40 34-62" stroke="' + c + '" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    if (k === 'age') return '<svg viewBox="0 0 240 140" fill="none"><circle cx="120" cy="70" r="48" stroke="' + c + '" stroke-width="9"/><path d="M120 40v30l22 14" stroke="' + c + '" stroke-width="9" stroke-linecap="round"/></svg>';
    if (k === 'price') return '<svg viewBox="0 0 240 140" fill="none"><path d="M18 44l44 32 34-24 40 40 44-58" stroke="' + c + '" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/><path d="M186 34h40v40" stroke="' + c + '" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    return '<svg viewBox="0 0 240 140" fill="none"><circle cx="78" cy="70" r="28" stroke="' + c + '" stroke-width="9"/><circle cx="162" cy="70" r="28" stroke="' + c + '" stroke-width="9"/><path d="M106 70h28" stroke="' + c + '" stroke-width="9" stroke-linecap="round"/></svg>';
  }

  function toneOf(block, fallback) {
    if (!block) return fallback || 'var(--blue)';
    return block.s >= 0.7 ? 'var(--green)' : block.s >= 0.4 ? 'var(--yellow)' : 'var(--red)';
  }

  function showExplainer(startIndex) {
    const ru = S.lang === 'ru';
    const helpList = HELP[S.lang] || HELP.ru;
    const blocks = (S.result && S.result.blocks) || [];
    const keys = ['liq', 'holders', 'dev', 'contract', 'activity', 'age', 'price', 'links'];
    const titles = ru
      ? { liq: 'Ликвидность', holders: 'Распределение', dev: 'Дев и бандлы', contract: 'Контракт', activity: 'Активность', age: 'Возраст', price: 'Цена за сутки', links: 'Ссылки' }
      : { liq: 'Liquidity', holders: 'Distribution', dev: 'Dev & bundles', contract: 'Contract', activity: 'Activity', age: 'Age', price: '24h price', links: 'Links' };

    const slides = keys.map(function (k) {
      const b = blocks.find(function (x) { return x.k === k; });
      const help = helpList.find(function (h) { return h[0] === t(k); }) || ['', ''];
      const c = toneOf(b);
      const p = b ? Math.round(b.s * 100) : null;
      return { k: k, title: titles[k], text: help[1], color: c, pct: p, info: b ? b.info : '' };
    });

    let idx = Math.max(0, Math.min(slides.length - 1, startIndex || 0));

    const wrap = document.createElement('div');
    wrap.className = 'expl';
    wrap.innerHTML = '<div class="expl-head">' +
      '<button type="button" class="expl-x" id="bx" aria-label="Close">' + SVG_X + '</button>' +
      '<span class="expl-count" id="ec">' + (idx + 1) + ' / ' + slides.length + '</span>' +
      '</div>' +
      '<div class="expl-track" id="track">' + slides.map(function (s) {
        return '<div class="expl-slide">' +
          '<div class="expl-art" style="--ac:' + s.color + '"><div class="expl-glow"></div>' + blockArt(s.k, s.color) + '</div>' +
          '<div class="expl-body"><h2>' + esc(s.title) + '</h2>' +
          '<p>' + esc(s.text) + '</p>' +
          (s.pct !== null ? '<div class="expl-score" style="color:' + s.color + '">' + s.pct + '%</div><div class="expl-info">' + esc(s.info) + '</div>' : '') +
          '</div></div>';
      }).join('') + '</div>' +
      '<div class="expl-foot"><div class="expl-dots" id="dots">' + slides.map(function (_, i) { return '<i' + (i === idx ? ' class="on"' : '') + '></i>'; }).join('') + '</div>' +
      '<div class="expl-btns"><button class="btn secondary" id="bprev">' + (ru ? 'Назад' : 'Back') + '</button>' +
      '<button class="btn" id="bnext">' + (ru ? 'Дальше' : 'Next') + '</button></div></div>';

    document.body.appendChild(wrap);
    const track = wrap.querySelector('#track');
    const dots = wrap.querySelectorAll('#dots i');
    const counter = wrap.querySelector('#ec');
    const bprev = wrap.querySelector('#bprev');
    const bnext = wrap.querySelector('#bnext');

    const go = function (i) {
      idx = Math.max(0, Math.min(slides.length - 1, i));
      track.scrollTo({ left: idx * track.clientWidth, behavior: 'smooth' });
      sync();
    };
    const sync = function () {
      dots.forEach(function (d, k) { d.classList.toggle('on', k === idx); });
      counter.textContent = (idx + 1) + ' / ' + slides.length;
      bprev.style.visibility = idx === 0 ? 'hidden' : 'visible';
      bnext.textContent = idx === slides.length - 1 ? (ru ? 'Понятно' : 'Got it') : (ru ? 'Дальше' : 'Next');
    };
    track.addEventListener('scroll', function () {
      const i = Math.round(track.scrollLeft / track.clientWidth);
      if (i !== idx) { idx = i; sync(); }
    });
    bprev.onclick = function () { go(idx - 1); haptic(); };
    bnext.onclick = function () { if (idx === slides.length - 1) { wrap.remove(); } else { go(idx + 1); haptic(); } };
    wrap.querySelector('#bx').onclick = function () { wrap.remove(); };
    sync();
    requestAnimationFrame(function () { track.scrollLeft = idx * track.clientWidth; });
    haptic();
  }

  function showBlock(i) { showHelp(i); }

  const PLANS = [
    { days: 3, stars: 75, label: '3 дня', labelEn: '3 days', tag: '', full: 0 },
    { days: 7, stars: 180, label: '7 дней', labelEn: '7 days', tag: '', full: 0 },
    { days: 14, stars: 320, label: '14 дней', labelEn: '14 days', tag: '', full: 337 },
    { days: 30, stars: 490, label: '30 дней', labelEn: '30 days', tag: 'выгодно', full: 654 }
  ];
  function planDiscount(p) {
    if (!p.full || p.full <= p.stars) return 0;
    return Math.round((1 - p.stars / p.full) * 100);
  }

  function paySim(days, ru) {
    const layer = document.createElement('div');
    layer.className = 'payfx';
    let stars = '';
    for (let i = 0; i < 18; i++) {
      stars += '<span class="pfx-star" style="--x:' + (Math.random() * 100).toFixed(0) + '%;--d:' + (Math.random() * 0.5).toFixed(2) + 's;--s:' + (0.7 + Math.random() * 0.9).toFixed(2) + '">' + (Math.random() > 0.35 ? '⭐' : '✨') + '</span>';
    }
    layer.innerHTML = stars + '<div class="pfx-card"><div class="pfx-badge">⭐</div><b>' + (ru ? 'Premium активирован' : 'Premium activated') + '</b><span>' + days + (ru ? ' дней' : ' days') + '</span></div>';
    document.body.appendChild(layer);
    haptic('ok');
    S.plan = 'premium';
    S.planUntil = Date.now() + days * 864e5;
    write('tc.plan', 'premium');
    write('tc.planUntil', S.planUntil);
    setTimeout(function () {
      layer.classList.add('out');
      setTimeout(function () { layer.remove(); render(); }, 380);
    }, 1600);
  }

  function showScreenSettings() {
    const ru = S.lang === 'ru';
    const rows = [
      ['recent', ru ? 'Недавние проверки' : 'Recent checks', ru ? 'Список под панелью' : 'List under the panel'],
      ['quota', ru ? 'Счётчик лимита' : 'Quota counter', ru ? 'Сколько проверок осталось' : 'Checks left'],
      ['anim', ru ? 'Анимации цифр' : 'Number animations', ru ? 'Скор набегает' : 'Score counts up'],
      ['big', ru ? 'Крупный заголовок' : 'Large title', ru ? 'Большой «Проверь монету»' : 'Big heading']
    ];
    const wrap = document.createElement('div');
    wrap.className = 'modal';
    wrap.innerHTML = '<div class="modal-card sheet-help" style="max-height:80vh">' +
      '<div class="modal-head"><b>' + (ru ? 'Настройки экрана' : 'Screen settings') + '</b><button type="button" class="modal-x" id="mx" aria-label="Close">' + SVG_X + '</button></div>' +
      '<div class="help-list">' + rows.map(function (r) {
        const on = S.ui[r[0]] !== false;
        return '<button class="ui-row" data-k="' + r[0] + '"><span class="ui-txt"><b>' + esc(r[1]) + '</b><i>' + esc(r[2]) + '</i></span>' +
          '<span class="ui-sw' + (on ? ' on' : '') + '"><i></i></span></button>';
      }).join('') + '</div></div>';
    document.body.appendChild(wrap);
    const close = function () { wrap.remove(); };
    wrap.addEventListener('click', function (e) { if (e.target === wrap) close(); });
    wrap.querySelector('#mx').onclick = close;
    wrap.querySelectorAll('.ui-row').forEach(function (b) {
      b.onclick = function () {
        const k = b.dataset.k;
        S.ui[k] = S.ui[k] === false;
        write('tc.ui', S.ui);
        b.querySelector('.ui-sw').classList.toggle('on', S.ui[k] !== false);
        haptic();
        render();
      };
    });
    haptic();
  }

  function showAlertSettings() {
    const ru = S.lang === 'ru';
    const rows = [
      ['score', ru ? 'Скор упал' : 'Score dropped', ru ? 'На сколько пунктов. Пример: 10 — с 70 до 60.' : 'How many points. Example: 10 means 70 to 60.', 'scoreN', 1, 40],
      ['liq', ru ? 'Ликвидность упала' : 'Liquidity dropped', ru ? 'Процент пула. Пример: 30 — с $100K до $70K.' : 'Percent of the pool. Example: 30 means $100K to $70K.', 'liqN', 5, 90],
      ['price', ru ? 'Цена упала' : 'Price dropped', ru ? 'Процент за 24 часа. Пример: 40.' : 'Percent over 24 hours. Example: 40.', 'priceN', 5, 90],
      ['risky', ru ? 'Опасный скор' : 'Risky score', ru ? 'Скор ниже 40. Тип целиком в Premium.' : 'Score below 40. This type is Premium.', '', 0, 0],
      ['wallet', ru ? 'Сделки кошельков' : 'Wallet trades', ru ? 'Покупка или продажа монеты из списка. Premium.' : 'A buy or sell of a listed coin. Premium.', '', 0, 0]
    ];
    const wrap = document.createElement('div');
    wrap.className = 'modal';
    wrap.innerHTML = '<div class="modal-card sheet-help" style="max-height:86vh">' +
      '<div class="modal-head"><b>' + (ru ? 'Уведомления' : 'Alerts') + '</b><button type="button" class="modal-x" id="mx" aria-label="Close">' + SVG_X + '</button></div>' +
      '<p class="set-note">' + esc(alertLimitText()) + '</p>' +
      '<div class="help-list">' + rows.map(function (r) {
        const freeOk = r[0] === 'score' || r[0] === 'liq';
        const locked = !isPrem() && !freeOk;
        const on = (S.alertPrefs || {})[r[0]] !== false && !locked;
        const num = r[3] ? '<label class="cx-rule"><span>' + esc(ru ? 'Порог' : 'Threshold') + '</span><input type="number" data-n="' + r[3] + '" min="' + r[4] + '" max="' + r[5] + '" value="' + (Number(S.alertPrefs[r[3]]) || r[4]) + '"></label>' : '';
        return '<div class="lock-row"><button class="ui-row" data-k="' + r[0] + '" data-locked="' + (locked ? '1' : '0') + '"><span class="ui-txt"><b>' + esc(r[1]) + (locked ? ' · PRO' : '') + '</b><i>' + esc(r[2]) + '</i></span>' +
          '<span class="ui-sw' + (on ? ' on' : '') + '"><i></i></span></button>' + num + '</div>';
      }).join('') + '</div></div>';
    document.body.appendChild(wrap);
    const close = function () { dismiss(wrap); render(); };
    wrap.addEventListener('click', function (e) { if (e.target === wrap) close(); });
    wrap.querySelector('#mx').onclick = close;
    wrap.querySelectorAll('.ui-row').forEach(function (b) {
      b.onclick = function () {
        if (b.dataset.locked === '1') { showPaywall(); return; }
        const k = b.dataset.k;
        S.alertPrefs[k] = S.alertPrefs[k] === false;
        write('tc.alertPrefs', S.alertPrefs);
        b.querySelector('.ui-sw').classList.toggle('on', S.alertPrefs[k] !== false);
        haptic();
      };
    });
    wrap.querySelectorAll('[data-n]').forEach(function (inp) {
      inp.onchange = function () {
        const k = inp.dataset.n;
        const v = Math.max(Number(inp.min) || 0, Math.min(Number(inp.max) || 100, Number(inp.value) || 0));
        S.alertPrefs[k] = v;
        write('tc.alertPrefs', S.alertPrefs);
      };
    });
  }

  function addWallet() {
    const ru = S.lang === 'ru';
    const wrap = document.createElement('div');
    wrap.className = 'modal';
    wrap.innerHTML = '<div class="modal-card sheet-help" style="max-height:60vh">' +
      '<div class="modal-head"><b>' + (ru ? 'Добавить кошелёк' : 'Add wallet') + '</b><button type="button" class="modal-x" id="mx" aria-label="Close">' + SVG_X + '</button></div>' +
      '<div class="help-list"><p class="small">' + (ru ? 'Вставь адрес кошелька Solana. Reactive проверит его сделки при открытии.' : 'Paste a Solana wallet address. Reactive checks its trades when you open the app.') + '</p>' +
      '<div class="panel-in" style="margin-top:10px"><input id="waddr" placeholder="' + (ru ? 'Адрес кошелька' : 'Wallet address') + '"></div>' +
      '<button class="panel-go" id="wsave" style="margin-top:12px">' + (ru ? 'Добавить' : 'Add') + '</button>' +
      '<p class="tiny" id="werr" style="color:#ff453a"></p></div></div>';
    document.body.appendChild(wrap);
    const close = function () { wrap.remove(); };
    wrap.addEventListener('click', function (e) { if (e.target === wrap) close(); });
    wrap.querySelector('#mx').onclick = close;
    wrap.querySelector('#wsave').onclick = function () {
      const v = (wrap.querySelector('#waddr').value || '').trim();
      if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(v)) { wrap.querySelector('#werr').textContent = ru ? 'Не похоже на адрес Solana' : 'Not a Solana address'; return; }
      if (S.wallets.indexOf(v) === -1) S.wallets.push(v);
      S.wallets = S.wallets.slice(0, 5);
      write('tc.wallets', S.wallets);
      close(); render();
      refreshWallets();
    };
    haptic();
  }

  async function rpcCall(method, params) {
    const r = await fetch('https://api.mainnet-beta.solana.com', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: method, params: params })
    });
    const j = await r.json();
    return j && j.result;
  }

  const PUMP_PROGRAMS = [
    '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P',
    'pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA',
    'LanMV9sAd7wArD4vJFtMpvBCZQ2p2yF5kK1n1jFhKXf'
  ];

  async function devFallback(creator) {
    const out = [];
    try {
      const sigs = await rpcCall('getSignaturesForAddress', [creator, { limit: 25 }]);
      if (!Array.isArray(sigs)) return out;
      for (const sg of sigs.slice(0, 15)) {
        if (!sg || !sg.signature) continue;
        const tx = await rpcCall('getTransaction', [sg.signature, { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 }]);
        if (!tx || !tx.transaction) continue;
        const msg = tx.transaction.message || {};
        const allIns = (msg.instructions || []).concat(((tx.meta && tx.meta.innerInstructions) || []).reduce(function (acc, x) { return acc.concat(x.instructions || []); }, []));
        allIns.forEach(function (i) {
          const pid = String(i.programId || '');
          if (PUMP_PROGRAMS.indexOf(pid) === -1) return;
          const accs = i.accounts || [];
          if (accs.length && typeof accs[0] === 'string') out.push({ mint: accs[0], amount: 0 });
        });
        // fallback: new mints in postTokenBalances that were absent in pre
        const pre = (tx.meta && tx.meta.preTokenBalances) || [];
        const post = (tx.meta && tx.meta.postTokenBalances) || [];
        post.forEach(function (p) {
          const inPre = pre.some(function (x) { return x.mint === p.mint; });
          if (!inPre && p.mint) out.push({ mint: p.mint, amount: 0 });
        });
        if (out.length >= 8) break;
      }
    } catch (e) {}
    const uniq = {};
    const res = out.filter(function (x) { if (uniq[x.mint]) return false; uniq[x.mint] = 1; return true; }).slice(0, 8);
    return res;
  }

  async function checkDev(creator, btnEl) {
    const ru = S.lang === 'ru';
    const setTxt = function (t2) { if (btnEl) btnEl.textContent = t2; };
    setTxt(ru ? 'Смотрю кошелёк создателя…' : 'Reading creator wallet…');
    try {
      const TOKEN_PROGRAM = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
      const resp = await rpcCall('getTokenAccountsByOwner', [creator, { programId: TOKEN_PROGRAM }, { encoding: 'jsonParsed' }]);
      const accounts = (resp && resp.value) || [];
      const held = accounts.map(function (acc) {
        const info = acc.account && acc.account.data && acc.account.data.parsed && acc.account.data.parsed.info;
        if (!info) return null;
        const amount = Number(info.tokenAmount && info.tokenAmount.uiAmount) || 0;
        return { mint: info.mint, amount: amount };
      }).filter(function (x) { return x && x.amount > 0; }).slice(0, 10);

      if (!held.length) {
        setTxt(ru ? 'Кошелёк пуст, смотрю транзакции…' : 'Empty wallet, scanning txs…');
        const found = await devFallback(creator);
        if (found.length) {
          held.push.apply(held, found);
        } else {
          toast(ru ? 'Созданий токенов не найдено' : 'No token creations found');
          setTxt(ru ? 'Проверить создателя' : 'Check creator');
          return;
        }
      }

      setTxt(ru ? 'Проверяю ' + held.length + ' токенов…' : 'Checking ' + held.length + ' tokens…');
      const mints = held.map(function (x) { return x.mint; });
      const res = await getJson('https://api.dexscreener.com/latest/dex/tokens/' + encodeURIComponent(mints.join(',')), 7000).catch(function () { return null; });
      const pairs = (res && res.pairs) || [];
      const rows = held.map(function (h) {
        const ps = pairs.filter(function (p) { return p.baseToken && p.baseToken.address === h.mint; });
        const best = ps.sort(function (x, y) { return (Number(y.liquidity && y.liquidity.usd) || 0) - (Number(x.liquidity && x.liquidity.usd) || 0); })[0];
        const liq = best ? Number(best.liquidity && best.liquidity.usd) || 0 : 0;
        const sym = best && best.baseToken && best.baseToken.symbol ? best.baseToken.symbol : h.mint.slice(0, 4) + '…';
        return { mint: h.mint, symbol: sym, liq: liq, alive: liq > 500, amount: h.amount };
      });
      const dead = rows.filter(function (r) { return !r.alive; }).length;

      const wrap = document.createElement('div');
      wrap.className = 'modal';
      wrap.innerHTML = '<div class="modal-card sheet-help" style="max-height:80vh">' +
        '<div class="modal-head"><b>' + (ru ? 'Кошелёк создателя' : 'Creator wallet') + '</b><button type="button" class="modal-x" id="mx" aria-label="Close">' + SVG_X + '</button></div>' +
        '<div class="help-list">' +
        '<div class="trade" style="margin-bottom:12px">' +
        '<div class="trade-row flat"><span>' + (ru ? 'Токенов на кошельке' : 'Tokens held') + '</span><b>' + rows.length + '</b></div>' +
        '<div class="trade-row flat"><span>' + (ru ? 'Без ликвидности' : 'No liquidity') + '</span><b style="color:var(--red)">' + dead + ' из ' + rows.length + '</b></div>' +
        '</div>' +
        rows.map(function (r) {
          return '<div class="alert-row"><span class="al-dot" style="background:' + (r.alive ? 'var(--green)' : 'var(--red)') + '"></span>' +
            '<span class="al-txt"><b>' + esc(r.symbol) + '</b><i>' + (r.alive ? usd(r.liq) + ' ' + (ru ? 'ликвидности' : 'liquidity') : (ru ? 'нет пула — мёртвый' : 'no pool — dead')) + '</i></span></div>';
        }).join('') +
        '<p class="tiny" style="margin:10px 2px 0">' + (ru ? 'Это токены, которые создатель держит сейчас. Полная история запусков требует сервера.' : 'Tokens the creator holds right now. Full launch history needs a backend.') + '</p>' +
        '</div></div>';
      document.body.appendChild(wrap);
      const close = function () { wrap.remove(); };
      wrap.addEventListener('click', function (e) { if (e.target === wrap) close(); });
      wrap.querySelector('#mx').onclick = close;
      setTxt(ru ? 'Проверить снова' : 'Check again');
    } catch (e) {
      toast(ru ? 'RPC не ответил, попробуй ещё раз' : 'RPC failed, try again');
      setTxt(ru ? 'Проверить создателя' : 'Check creator');
    }
  }

  async function refreshWallets() {
    if (!S.wallets || !S.wallets.length) return;
    if (!alertAllowed('wallet')) return;
    const savedMints = {};
    (S.saved || []).forEach(function (s) { savedMints[s.mint] = s.symbol; });
    const out = [];
    for (const w of S.wallets.slice(0, 3)) {
      try {
        const sigs = await rpcCall('getSignaturesForAddress', [w, { limit: 6 }]);
        if (!Array.isArray(sigs)) continue;
        for (const sg of sigs.slice(0, 4)) {
          if (!sg || !sg.signature) continue;
          const tx = await rpcCall('getTransaction', [sg.signature, { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 }]);
          if (!tx || !tx.meta) continue;
          const pre = tx.meta.preTokenBalances || [];
          const post = tx.meta.postTokenBalances || [];
          const byMint = {};
          post.forEach(function (p) {
            if (p.owner !== w) return;
            const before = pre.find(function (x) { return x.mint === p.mint && x.owner === w; });
            const delta = (Number(p.uiTokenAmount && p.uiTokenAmount.uiAmount) || 0) - (before ? Number(before.uiTokenAmount && before.uiTokenAmount.uiAmount) || 0 : 0);
            if (Math.abs(delta) > 0.0001) byMint[p.mint] = delta;
          });
          Object.keys(byMint).forEach(function (mint) {
            if (!savedMints[mint]) return;
            const d = byMint[mint];
            out.push({
              kind: 'wallet',
              mint: mint,
              symbol: savedMints[mint],
              text: (S.lang === 'ru' ? (d > 0 ? 'кошелёк купил' : 'кошелёк продал') : (d > 0 ? 'wallet bought' : 'wallet sold')) + ' ' + (Math.abs(d) > 1 ? Math.round(Math.abs(d)) : Math.abs(d).toFixed(2)),
              at: (sg.blockTime || Date.now() / 1000) * 1000,
              wallet: w
            });
          });
          if (out.length > 8) break;
        }
      } catch (e) {}
    }
    if (out.length) {
      S.walletAlerts = out.slice(0, 12);
      write('tc.walletAlerts', S.walletAlerts);
      render();
    }
  }

  function openCustomEditor() {
    if (document.getElementById('customEd')) return;
    const ru = S.lang === 'ru';
    const c = customState();
    const meta = blockMeta();
    let draft = { name: '', weights: { liq: 20, holders: 15, dev: 20, contract: 15, activity: 10, age: 10, price: 5, links: 5, pressure: 8 }, rules: { devPct: 5, liqUsd: 10000, top10: 50, ageMin: 0 } };
    const wrap = document.createElement('div');
    wrap.className = 'modal';
    wrap.id = 'customEd';
    const ruleField = function (k, label, val) {
      return '<label class="cx-rule"><span>' + esc(label) + '</span><input type="number" min="0" step="1" data-r="' + k + '" value="' + (Number(val) || 0) + '"></label>';
    };
    const weightHelp = {
      liq: ru ? ['Чем выше вес, тем сильнее размер пула двигает скор.', 'Пример: 30 вместо 20 — тонкий пул сильнее снижает скор.'] : ['A higher weight lets pool size move the score more.', 'Example: 30 instead of 20 — a thin pool pulls the score down harder.'],
      holders: ru ? ['Вес доли топ-10 и числа холдеров.', 'Пример: 30 — концентрация у десяти кошельков почти решает скор.'] : ['Weight of the top-10 share and holder count.', 'Example: 30 — concentration in ten wallets almost decides the score.'],
      dev: ru ? ['Вес рисков создателя и Rugcheck.', 'Пример: 5 — предупреждения о создателе почти не влияют.'] : ['Weight of creator and Rugcheck risks.', 'Example: 5 — creator warnings barely count.'],
      contract: ru ? ['Вес минта, заморозки и налога.', 'Пример: 30 — открытый минт сильно роняет скор.'] : ['Weight of mint, freeze, and tax.', 'Example: 30 — an open mint drops the score hard.'],
      activity: ru ? ['Вес объёма относительно пула.', 'Пример: 20 — тихий или накрученный объём заметнее.'] : ['Weight of volume versus the pool.', 'Example: 20 — quiet or inflated volume counts more.'],
      age: ru ? ['Вес того, сколько живёт пара.', 'Пример: 4 — возраст почти не важен, как у снайпера.'] : ['Weight of how long the pair has lived.', 'Example: 4 — age barely matters, as in the sniper preset.'],
      price: ru ? ['Вес изменения цены за сутки.', 'Пример: 16 — резкий ход сильнее двигает скор.'] : ['Weight of the 24-hour price move.', 'Example: 16 — a sharp move shifts the score more.'],
      links: ru ? ['Вес сайта и соцсетей.', 'Пример: 0 — отсутствие ссылок не меняет скор.'] : ['Weight of a site and socials.', 'Example: 0 — missing links do not change the score.'],
      pressure: ru ? ['Вес перевеса покупок над продажами.', 'Пример: 22 — поток сделок почти как отдельный скор.'] : ['Weight of buys versus sells.', 'Example: 22 — trade flow almost becomes its own score.']
    };
    const ruleHelp = {
      devPct: ru ? ['Красный флаг, если у создателя больше этого процента.', 'Пример: 3 — остаток 4% уже красит проверку.'] : ['A red flag when the creator holds more than this percent.', 'Example: 3 — a 4% balance already turns the check red.'],
      liqUsd: ru ? ['Красный флаг, если пул меньше этой суммы в долларах.', 'Пример: 50000 — пул $20K не проходит.'] : ['A red flag when the pool is under this many dollars.', 'Example: 50000 — a $20K pool fails.'],
      top10: ru ? ['Красный флаг, если топ-10 держат больше этого процента.', 'Пример: 40 — доля 55% красит проверку.'] : ['A red flag when the top 10 hold more than this percent.', 'Example: 40 — a 55% share turns the check red.'],
      ageMin: ru ? ['Красный флаг, если монете меньше стольких минут. 0 — правило выключено.', 'Пример: 360 — монета моложе 6 часов не проходит.'] : ['A red flag when the coin is younger than this many minutes. 0 turns the rule off.', 'Example: 360 — a coin under 6 hours fails.']
    };
    const previewText = function () {
      const base = { liq: 20, holders: 15, dev: 20, contract: 15, activity: 10, age: 10, price: 5, links: 5, pressure: 8 };
      const bits = [];
      meta.forEach(function (m) {
        const d = (Number(draft.weights[m[0]]) || 0) - base[m[0]];
        if (Math.abs(d) >= 6) bits.push(m[1] + (d > 0 ? ' ↑' : ' ↓'));
      });
      if (!bits.length) return ru ? 'Баланс весов как у общего скора Reactive.' : 'Weights match the general Reactive score.';
      return (ru ? 'Сильнее или слабее общего скора: ' : 'Stronger or weaker than the general score: ') + bits.join(', ');
    };
    const formHtml = function () {
      return '<div class="cx-group"><label class="cx-name">' + esc(ru ? 'Название' : 'Name') + '<input id="cxName" value="' + esc(draft.name) + '" placeholder="' + esc(ru ? 'Например, Ночной' : 'For example, Night') + '"></label></div>' +
        '<p class="cx-k">' + esc(ru ? 'Веса блоков · 0–40' : 'Block weights · 0–40') + '</p><div class="cx-group">' +
        meta.map(function (m) {
          const v = Number(draft.weights[m[0]]) || 0;
          const h = weightHelp[m[0]] || ['', ''];
          return '<label class="cx-sl"><span>' + esc(m[1]) + '<i class="cx-help">' + esc(h[0]) + '</i><i class="cx-ex">' + esc(h[1]) + '</i></span><input type="range" min="0" max="40" step="1" data-w="' + m[0] + '" value="' + v + '"><b>' + v + '</b></label>';
        }).join('') +
        '<p class="cx-preview" id="cxPreview">' + esc(previewText()) + '</p></div>' +
        '<p class="cx-k">' + esc(ru ? 'Красные флаги' : 'Red flags') + '</p><div class="cx-group">' +
        ['devPct', 'liqUsd', 'top10', 'ageMin'].map(function (k) {
          const labels = { devPct: ru ? 'Создатель больше, %' : 'Creator above, %', liqUsd: ru ? 'Пул меньше, $' : 'Pool under, $', top10: ru ? 'Топ-10 больше, %' : 'Top-10 above, %', ageMin: ru ? 'Моложе, минут' : 'Younger than, minutes' };
          const h = ruleHelp[k];
          return '<label class="cx-rule"><span>' + esc(labels[k]) + '<i class="cx-help">' + esc(h[0]) + '</i><i class="cx-ex">' + esc(h[1]) + '</i></span><input type="number" min="0" step="1" data-r="' + k + '" value="' + (Number(draft.rules[k]) || 0) + '"></label>';
        }).join('') + '</div>' +
        '<div class="cx-pres" id="cxReset">' + checkPresets().map(function (p, i) {
          return '<button type="button" class="cx-pre" data-reset="' + i + '"><b>' + esc(p.name) + '</b><span>' + esc(ru ? 'Сбросить к пресету' : 'Reset to preset') + '</span></button>';
        }).join('') + '</div>' +
        '<button type="button" class="btn" id="cxSave">' + esc(ru ? 'Сохранить и использовать' : 'Save and use') + '</button>' +
        '<p class="tiny">' + esc(ru ? '0 в флаге — правило выключено. Сохранение открывает Premium.' : '0 turns a flag off. Saving opens Premium.') + '</p>';
    };
    const needPrem = function () {
      if (isPrem()) return false;
      showPaywall();
      return true;
    };
    const readDraft = function () {
      draft.name = String((wrap.querySelector('#cxName') || {}).value || '').trim();
      wrap.querySelectorAll('[data-w]').forEach(function (el) { draft.weights[el.dataset.w] = Number(el.value) || 0; });
      wrap.querySelectorAll('[data-r]').forEach(function (el) { draft.rules[el.dataset.r] = Number(el.value) || 0; });
    };
    const bindEd = function () {
      wrap.querySelector('#cxX').onclick = function () { dismiss(wrap); };
      const seen = wrap.querySelector('#cxSeen');
      if (seen) seen.onclick = function () { c.seen = true; S.custom = c; saveCustom(); paint(); };
      wrap.querySelectorAll('[data-w]').forEach(function (el) {
        el.oninput = function () {
          const b = el.parentNode.querySelector('b');
          if (b) b.textContent = el.value;
          draft.weights[el.dataset.w] = Number(el.value) || 0;
          const prev = wrap.querySelector('#cxPreview');
          if (prev) prev.textContent = previewText();
        };
      });
      wrap.querySelectorAll('[data-reset]').forEach(function (b) {
        b.onclick = function () {
          const p = checkPresets()[Number(b.dataset.reset)];
          draft = { name: p.name, weights: Object.assign({}, p.weights), rules: Object.assign({}, p.rules) };
          paint();
        };
      });
      wrap.querySelectorAll('[data-pre]').forEach(function (b) {
        b.onclick = function () {
          if (needPrem()) return;
          const p = checkPresets()[Number(b.dataset.pre)];
          const item = { id: 'c' + Date.now(), name: p.name, weights: p.weights, rules: p.rules };
          c.items.push(item);
          c.active = item.id;
          S.custom = c;
          saveCustom();
          haptic();
          dismiss(wrap);
          render();
        };
      });
      wrap.querySelectorAll('[data-use]').forEach(function (b) {
        b.onclick = function () {
          if (needPrem()) return;
          c.active = b.dataset.use;
          S.custom = c;
          saveCustom();
          dismiss(wrap);
          render();
        };
      });
      wrap.querySelectorAll('[data-del]').forEach(function (b) {
        b.onclick = function () {
          c.items = (c.items || []).filter(function (x) { return x.id !== b.dataset.del; });
          if (c.active === b.dataset.del) c.active = 'reactive';
          S.custom = c;
          saveCustom();
          paint();
        };
      });
      const save = wrap.querySelector('#cxSave');
      if (save) save.onclick = function () {
        readDraft();
        if (!draft.name) { toast(ru ? 'Дай проверке имя' : 'Name the check'); return; }
        if (needPrem()) return;
        const item = { id: 'c' + Date.now(), name: draft.name.slice(0, 32), weights: draft.weights, rules: draft.rules };
        c.items.push(item);
        c.active = item.id;
        S.custom = c;
        saveCustom();
        haptic();
        dismiss(wrap);
        render();
      };
    };
    const paint = function () {
      const items = (c.items || []).map(function (x) {
        return '<div class="cx-item"><b>' + esc(x.name) + '</b><button type="button" data-use="' + esc(x.id) + '">' + esc(ru ? 'Взять' : 'Use') + '</button><button type="button" data-del="' + esc(x.id) + '">' + esc(ru ? 'Удалить' : 'Delete') + '</button></div>';
      }).join('');
      const presets = checkPresets().map(function (p, i) {
        return '<button type="button" class="cx-pre" data-pre="' + i + '"><b>' + esc(p.name) + '</b><span>' + esc(ru ? 'Начать с этого' : 'Start from this') + '</span></button>';
      }).join('');
      const expl = c.seen ? '' : '<div class="cx-expl"><div class="cx-ill"><i style="width:78%"></i><i style="width:46%"></i><i style="width:62%"></i></div><p>' + esc(ru ? 'Свои веса и красные флаги. Общий скор Reactive остаётся рядом — это вторая линейка, не замена.' : 'Your own weights and red flags. The general Reactive score stays beside it — a second scale, not a replacement.') + '</p><button type="button" class="cx-ok" id="cxSeen">' + esc(ru ? 'Понятно' : 'Got it') + '</button></div>';
      wrap.innerHTML = '<div class="modal-card paywall cx"><div class="modal-head"><b>' + esc(ru ? 'Мои проверки' : 'My checks') + '</b><span class="pro-badge">PRO</span><button type="button" class="modal-x" id="cxX" aria-label="Close">' + SVG_X + '</button></div>' +
        expl +
        '<p class="cx-k">' + esc(ru ? 'Пресеты' : 'Presets') + '</p><div class="cx-pres">' + presets + '</div>' +
        (items ? '<p class="cx-k">' + esc(ru ? 'Сохранённые' : 'Saved') + '</p><div class="cx-items">' + items + '</div>' : '') +
        '<p class="cx-k">' + esc(ru ? 'Новая проверка' : 'New check') + '</p>' + formHtml() + '</div>';
      bindEd();
    };
    document.body.appendChild(wrap);
    wrap.addEventListener('click', function (e) { if (e.target === wrap) dismiss(wrap); });
    paint();
  }

  function showPaywall() {
    const ru = S.lang === 'ru';
    const isPrem = S.plan === 'premium' && (!S.planUntil || S.planUntil > Date.now());
    const perks = ru ? [
      'Без лимита — бесплатно 20 проверок в день',
      'Вторая половина «Что важно» и рисков Rugcheck',
      'Полный список топ-держателей',
      'Свои проверки: веса блоков и красные флаги',
      'Уведомления без лимита и все типы, не только скор и ликвидность'
    ] : [
      'No limit — 20 free checks a day',
      'The other half of “What matters” and Rugcheck risks',
      'The full top-holder list',
      'Your own checks: block weights and red flags',
      'Unlimited alerts and every alert type, not only score and liquidity'
    ];
    const wrap = document.createElement('div');
    wrap.className = 'modal';
    wrap.innerHTML = '<div class="modal-card paywall">' +
      '<div class="pw-head"><button type="button" class="pw-x" id="px" aria-label="Close">' + SVG_X + '</button></div>' +
      '<h2 class="pw-title">' + (ru ? 'Проверяй быстрее и глубже' : 'Check faster and deeper') + '</h2>' +
      '<p class="pw-sub">' + (ru ? 'Без лимита и полные риски по монете.' : 'No limit, and the full risk list.') + '</p>' +
      '<div class="pw-perks">' + perks.map(function (p) { return '<div class="pw-perk"><i>✓</i><span>' + esc(p) + '</span></div>'; }).join('') + '</div>' +
      '<div class="pw-plans">' + PLANS.map(function (p, i) {
        const disc = planDiscount(p);
        return '<button class="pw-plan' + (i === 3 ? ' active' : '') + '" data-days="' + p.days + '">' +
          (disc > 0 ? '<em>−' + disc + '%</em>' : '') +
          '<b>' + esc(ru ? p.label : p.labelEn) + '</b><span>' + p.stars + ' ⭐</span></button>';
      }).join('') + '</div>' +
      '<button class="pw-buy' + (isPrem ? ' active' : '') + '" id="pwbuy">' + (isPrem
        ? (ru ? 'Подписка активна до ' + fmtDate(S.planUntil) : 'Active until ' + fmtDate(S.planUntil))
        : (ru ? 'Подписка' : 'Subscribe')) + '</button>' +
      '<p class="pw-save" id="pwsave"></p>' +
      '<p class="pw-note">' + (ru ? 'Оплата через Telegram Stars. Подписка продлевается вручную — без автосписаний.' : 'Telegram Stars. Manual renewal, no auto-charge.') + '</p>' +
      '</div>';
    document.body.appendChild(wrap);
    const close = function () { dismiss(wrap); };
    wrap.addEventListener('click', function (e) { if (e.target === wrap) close(); });
    wrap.querySelector('#px').onclick = close;
    let chosen = 30;
    const saveEl = wrap.querySelector('#pwsave');
    const syncSave = function () {
      const p = PLANS.find(function (x) { return x.days === chosen; }) || PLANS[3];
      const disc = planDiscount(p);
      saveEl.innerHTML = disc > 0
        ? (ru ? 'Скидка <b>' + disc + '%</b> · вместо ' + p.full + ' ⭐' : 'Save <b>' + disc + '%</b> · normally ' + p.full + ' ⭐')
        : (ru ? 'Базовая цена · <b>' + Math.round(p.stars / p.days) + ' ⭐</b> в день' : 'Base price · <b>' + Math.round(p.stars / p.days) + ' ⭐</b> per day');
    };
    wrap.querySelectorAll('.pw-plan').forEach(function (b) {
      b.onclick = function () {
        wrap.querySelectorAll('.pw-plan').forEach(function (x) { x.classList.remove('active'); });
        b.classList.add('active');
        chosen = Number(b.dataset.days);
        syncSave();
        haptic();
      };
    });
    syncSave();
    wrap.querySelector('#pwbuy').onclick = function () {
      if (isPrem) { toast(ru ? 'Подписка активна до ' + fmtDate(S.planUntil) : 'Active until ' + fmtDate(S.planUntil)); return; }
      paySim(chosen, ru);
    };
  }

  function showHelp(focusIndex) {
    const ru = S.lang === 'ru';
    const helpList = HELP[S.lang] || HELP.ru;
    const blocks = (S.result && S.result.blocks) || [];
    const keys = ['liq', 'holders', 'dev', 'contract', 'activity', 'age', 'price', 'links'];
    const titles = ru
      ? { liq: 'Ликвидность', holders: 'Распределение', dev: 'Дев и бандлы', contract: 'Контракт', activity: 'Активность', age: 'Возраст', price: 'Цена за сутки', links: 'Ссылки' }
      : { liq: 'Liquidity', holders: 'Distribution', dev: 'Dev & bundles', contract: 'Contract', activity: 'Activity', age: 'Age', price: '24h price', links: 'Links' };

    const cards = keys.map(function (k) {
      const b = blocks.find(function (x) { return x.k === k; });
      const help = helpList.find(function (h) { return h[0] === t(k); }) || ['', ''];
      const c = b ? (b.s >= 0.7 ? 'var(--green)' : b.s >= 0.4 ? 'var(--yellow)' : 'var(--red)') : 'var(--text-3)';
      const p = b ? Math.round(b.s * 100) : null;
      return '<div class="hc" id="hc-' + k + '">' +
        '<div class="hc-art" style="--ac:' + c + '"><div class="hc-glow"></div>' + blockArt(k, c) + '</div>' +
        '<div class="hc-body"><div class="hc-top"><b>' + esc(titles[k]) + '</b>' +
        (p !== null ? '<span class="hc-p" style="color:' + c + '">' + p + '%</span>' : '') + '</div>' +
        '<p>' + esc(help[1]) + '</p>' +
        (b ? '<span class="hc-info">' + esc(b.info) + '</span>' : '') +
        (b && S.result ? '<div class="hc-hints">' + blockHints(k, S.result.token, b).map(function (h) {
          return '<div class="hc-hint"><span>›</span>' + esc(h) + '</div>';
        }).join('') + '</div>' : '') +
        '</div></div>';
    }).join('');

    const wrap = document.createElement('div');
    wrap.className = 'modal';
    wrap.innerHTML = '<div class="modal-card sheet-help">' +
      '<div class="modal-head"><b>' + (ru ? 'Что значит каждый блок' : 'What each block means') + '</b><button type="button" class="modal-x" id="mx" aria-label="Close">' + SVG_X + '</button></div>' +
      '<div class="help-list" id="hl">' + cards + '</div>' +
      '</div>';
    document.body.appendChild(wrap);
    const close = function () { wrap.remove(); };
    wrap.addEventListener('click', function (e) { if (e.target === wrap) close(); });
    wrap.querySelector('#mx').onclick = close;

    if (typeof focusIndex === 'number' && keys[focusIndex]) {
      setTimeout(function () {
        const el2 = wrap.querySelector('#hc-' + keys[focusIndex]);
        if (el2) el2.scrollIntoView({ block: 'center' });
      }, 60);
    }
    haptic();
  }

  function showFatal(err) {
    try {
      const msg = String(err && err.message ? err.message : err);
      const where = String(err && err.stack || '').split('\n').slice(0, 3).join(' | ');
      app.innerHTML = '<div class="page"><div class="card" style="margin-top:20px">' +
        '<b style="font-size:17px">Ошибка отображения</b>' +
        '<p class="small" style="margin-top:8px;word-break:break-word">' + esc(msg) + '</p>' +
        '<p class="tiny" style="word-break:break-word">' + esc(where) + '</p>' +
        '<p class="tiny">platform: ' + esc(PLATFORM) + ' · ua: ' + esc((navigator.userAgent || '').slice(0, 60)) + '</p>' +
        '<button class="btn sm" id="cp" style="margin-top:12px">Скопировать текст</button>' +
        '<button class="btn ghost sm" id="rl" style="margin-top:8px">Перезагрузить</button>' +
        '</div></div>';
      const cp = document.getElementById('cp');
      if (cp) cp.onclick = function () {
        const txt = msg + '\n' + where + '\nplatform: ' + PLATFORM;
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt);
        if (TG && TG.showAlert) TG.showAlert(txt);
      };
      const rl = document.getElementById('rl');
      if (rl) rl.onclick = function () { location.reload(); };
    } catch (e) {
      app.textContent = 'Ошибка: ' + String(err && err.message || err);
    }
  }

  window.addEventListener('error', function (e) { if (e && e.error) showFatal(e.error); });
  window.addEventListener('unhandledrejection', function (e) { if (e && e.reason) showFatal(e.reason); });

  let NEWS = null;
  async function fillWalletBox(mint) {
    const box = document.getElementById('walletBox');
    if (!box) return;
    const ru = S.lang === 'ru';
    if (!(S.wallets || []).length) {
      box.innerHTML = '<p class="set-note">' + esc(ru ? 'Кошельки не добавлены. Их можно добавить на экране Проверки.' : 'No wallets yet. Add them on the Check screen.') + '</p>';
      return;
    }
    const hits = [];
    for (let i = 0; i < Math.min(3, S.wallets.length); i++) {
      const w = S.wallets[i];
      try {
        const resp = await rpcCall('getTokenAccountsByOwner', [w, { mint: mint }, { encoding: 'jsonParsed' }]);
        const rows = (resp && resp.value) || [];
        let amt = 0;
        rows.forEach(function (acc) {
          const info = acc.account && acc.account.data && acc.account.data.parsed && acc.account.data.parsed.info;
          amt += Number(info && info.tokenAmount && info.tokenAmount.uiAmount) || 0;
        });
        if (amt > 0) hits.push({ w: w, amt: amt });
      } catch (e) {}
    }
    if (!box.isConnected) return;
    if (!hits.length) box.innerHTML = '<p class="set-note">' + esc(ru ? 'Твои кошельки эту монету не держат.' : 'Your wallets do not hold this coin.') + '</p>';
    else box.innerHTML = hits.map(function (h) {
      return '<p class="set-note"><b>' + esc(ru ? 'Твои кошельки: ' : 'Your wallets: ') + h.w.slice(0, 4) + '…' + h.w.slice(-4) + '</b> ' + esc(ru ? 'держит ' : 'holds ') + (h.amt > 1 ? Math.round(h.amt) : h.amt.toFixed(2)) + '</p>';
    }).join('');
  }
  function viewInfo() {
    const ru = S.lang === 'ru';
    if (!NEWS && !S._newsLoading) {
      S._newsLoading = true;
      fetch('news.json?v=20261118ios12').then(function (r) { return r.json(); }).then(function (d) { NEWS = d; S._newsLoading = false; if (S.tab === 'info') render(); }).catch(function () { S._newsLoading = false; });
    }
    const news = (NEWS || []).map(function (n) {
      return '<div class="news-item"><time>' + esc(n.at) + '</time><p>' + esc(ru ? n.ru : n.en) + '</p></div>';
    }).join('') || '<p class="set-note">' + esc(ru ? 'Загружаю…' : 'Loading…') + '</p>';
    const faq = (ru ? [
      ['Это финансовый совет?', 'Нет. Скор — грубая сводка уже загруженных данных. Он не говорит, покупать или продавать.'],
      ['Почему часть строк размыта?', 'Бесплатно видны критичные риски и сводка. Подробности и полный список держателей открывает Premium.'],
      ['Сколько проверок бесплатно?', '20 в день. Premium снимает этот лимит.'],
      ['Почему уведомлений мало?', 'Free следит за 3 монетами и показывает до 8 уведомлений в день: падение скора и ликвидности. Остальные типы — Premium.'],
      ['Куда делся Рынок?', 'Вкладку убрали. Снизу остались Проверка, Список и Профиль. Инфо открывается в Профиле.'],
      ['Где добавить кошелёк?', 'На экране Проверки, блок «Кошельки». Если адрес держит монету, это пишется в результате.'],
      ['Что такое Мои проверки?', 'Свои веса блоков и красные флаги. Общий скор остаётся. Сохранить и включить можно в Premium.'],
      ['Картинка для шеринга без логотипа монеты?', 'Если хост картинки не отдаёт её в холст, останутся инициалы. Кольцо скора всё равно на месте.'],
      ['Данные уходят на сервер Reactive?', 'Нет. Список, свои проверки и уведомления остаются в этом устройстве. Общей статистики сканов нет.'],
      ['Откуда цифры?', 'DexScreener, Rugcheck и GoPlus. Это чтение публичных данных, без доступа к кошельку.']
    ] : [
      ['Is this financial advice?', 'No. The score is a rough summary of data already loaded. It does not say to buy or sell.'],
      ['Why are some rows blurred?', 'Free shows the critical risks and the summary. Details and the full holder list are Premium.'],
      ['How many free checks?', '20 a day. Premium removes that limit.'],
      ['Why so few alerts?', 'Free watches 3 coins and shows up to 8 alerts a day: score and liquidity drops. Other types are Premium.'],
      ['Where did Market go?', 'That tab was removed. Check, List, and Profile stay. Info opens from Profile.'],
      ['Where do I add a wallet?', 'On Check, in Wallets. If the address holds the coin, the result says so.'],
      ['What are My checks?', 'Your own block weights and red flags. The general score stays. Saving and turning one on is Premium.'],
      ['Share image has no token logo?', 'If the image host blocks the canvas, you get initials. The score ring is still there.'],
      ['Do scans go to a Reactive server?', 'No. The list, your checks, and alerts stay on this device. There is no shared scan history.'],
      ['Where do the numbers come from?', 'DexScreener, Rugcheck, and GoPlus. Public reads only, with no wallet access.']
    ]).map(function (q) {
      return '<details><summary>' + esc(q[0]) + '</summary><p>' + esc(q[1]) + '</p></details>';
    }).join('');
    return '<div class="page" id="infoPage">' +
      '<button type="button" class="ios-back" id="infoBack"><svg width="11" height="18" viewBox="0 0 8 14" fill="none"><path d="M6.5 1.5 1.5 7l5 5.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' + esc(ru ? 'Профиль' : 'Profile') + '</button>' +
      '<h1 class="lt">' + esc(ru ? 'Инфо' : 'Info') + '</h1>' +
      '<h2 class="info-h">' + esc(ru ? 'Новости и обновления' : 'News and updates') + '</h2>' +
      '<div class="card">' + news + '</div>' +
      '<h2 class="info-h" id="infoHow">' + esc(ru ? 'Как это работает' : 'How it works') + '</h2>' +
      '<p class="info-p">' + esc(ru ? 'Reactive экономит время: за полминуты собирает ликвидность, холдеров, создателя, контракт и цену в один скор и короткие строки. Уведомления говорят, когда сохранённая монета стала хуже.' : 'Reactive saves time: in half a minute it folds liquidity, holders, the creator, the contract, and the price into one score and short lines. Alerts say when a saved coin got worse.') + '</p>' +
      '<div class="card"><p class="set-note">' + esc(ru
        ? 'Проверка — адрес, свои проверки, кошельки, недавние. Результат — скор, что важно, риски, разбор, для сделки, поделиться. Список — монеты, фильтры, колокольчик уведомлений. Эта страница открывается из Профиля.'
        : 'Check — the address, your checks, wallets, recents. Result — score, what matters, risks, the read, a trade, share. List — coins, filters, the alerts bell. This page opens from Profile.') + '</p>' +
      '<p class="set-note">' + esc(ru ? 'Короткие карточки по-прежнему в профиле не нужны: подробности здесь.' : 'The short cards are no longer required: the detail lives here.') + ' <button type="button" class="sh-btn" id="openStory">' + esc(ru ? 'Короткие карточки' : 'Short cards') + '</button></p></div>' +
      '<h2 class="info-h">' + esc(ru ? 'Free и Premium' : 'Free and Premium') + '</h2>' +
      '<div class="card" style="overflow:auto"><table class="cmp-table"><thead><tr><th></th><th>Free</th><th>Premium</th></tr></thead><tbody>' +
      '<tr><td>' + esc(ru ? 'Проверки' : 'Checks') + '</td><td>20/' + (ru ? 'день' : 'day') + '</td><td>' + esc(ru ? 'без лимита' : 'no limit') + '</td></tr>' +
      '<tr><td>' + esc(ru ? 'Что важно и риски' : 'What matters and risks') + '</td><td>' + esc(ru ? 'критичное видно' : 'critical lines') + '</td><td>' + esc(ru ? 'все строки' : 'every line') + '</td></tr>' +
      '<tr><td>' + esc(ru ? 'Разбор' : 'Read') + '</td><td>' + esc(ru ? 'сводка и безопасность' : 'summary and safety') + '</td><td>' + esc(ru ? 'полный разбор' : 'full read') + '</td></tr>' +
      '<tr><td>' + esc(ru ? 'Держатели' : 'Holders') + '</td><td>' + esc(ru ? 'название, список скрыт' : 'title, list hidden') + '</td><td>' + esc(ru ? 'полный список' : 'full list') + '</td></tr>' +
      '<tr><td>' + esc(ru ? 'Мои проверки' : 'My checks') + '</td><td>' + esc(ru ? 'смотреть' : 'view') + '</td><td>' + esc(ru ? 'сохранять и включать' : 'save and use') + '</td></tr>' +
      '<tr><td>' + esc(ru ? 'Уведомления' : 'Alerts') + '</td><td>' + FREE_WATCH_N + ' · ' + FREE_ALERTS_DAY + '/' + (ru ? 'день, скор и пул' : 'day, score and pool') + '</td><td>' + esc(ru ? 'все типы, без лимита' : 'every type, no limit') + '</td></tr>' +
      '</tbody></table></div>' +
      '<h2 class="info-h">FAQ</h2><div class="card faq">' + faq + '</div>' +
      '<div class="disclaimer">' + esc(ru
        ? 'Мы не даём финансовых советов. Скор — грубая оценка всех факторов. В крипте, особенно в мемах, монета с красными флагами может вырасти, а с зелёными — упасть. Решение остаётся за тобой.'
        : 'We do not give financial advice. The score is a rough read of the factors together. In crypto, especially memes, a coin with red flags can rise, and one with green flags can fall. The decision stays yours.') + '</div></div>';
  }

  /* ---------------- render ---------------- */
  function render() {
    const dock = document.getElementById('dock');
    if (dock) dock.style.display = '';
    document.documentElement.lang = S.lang === 'en' ? 'en' : 'ru';
    const kept = app.scrollTop;
    try {
      let html;
      if (S.tab === 'saved') html = viewSaved();
      else if (S.tab === 'profile') html = viewProfile();
      else if (S.tab === 'info') html = viewInfo();
      else if (S.tab === 'alerts') { S.tab = 'saved'; html = viewSaved(); }
      else if (S.resultOpen) html = viewResultPage();
      else html = viewHome();
      app.innerHTML = html;
    } catch (err) {
      showFatal(err);
      return;
    }
    const animKey = S.tab + (S.resultOpen ? ':r:' + (S.result && S.result.token ? S.result.token.mint : '') : '');
    const animateIn = motionOk() && S._animKey !== animKey;
    S._animKey = animKey;
    app.classList.toggle('enter', animateIn);
    if (animateIn) app.scrollTop = 0; else app.scrollTop = kept;
    try { if (!read(BANNER_KEY, false)) openBanners(); } catch (e) {}
    syncDock();
    bind();
    decorate();
    if (S.infoFocus === 'how') {
      const how = document.getElementById('infoHow');
      if (how) how.scrollIntoView({ block: 'start' });
      S.infoFocus = '';
    }
    if (S.resultOpen && S.result && S.result.token) fillWalletBox(S.result.token.mint);
    if (animateIn) {
      try {
        document.querySelectorAll('.cat-v').forEach(function (el) {
          countUp(el, parseInt(el.textContent, 10) || 0, 420, '<i>%</i>');
        });
        countUp(document.querySelector('.tk-score b'), S.result ? S.result.score : 0, 520);
        document.querySelectorAll('.tk-bar i').forEach(function (bar) {
          const w = bar.style.width;
          bar.style.width = '0%';
          requestAnimationFrame(function () { bar.style.width = w; });
        });
      } catch (e) {}
    }
  }

  function hang() {}

  function decorate() { try { decorateInner(); } catch (e) {} }
  function decorateInner() {
    const page = document.querySelector('.page');
    if (page) Array.prototype.forEach.call(page.children, (ch, i) => ch.style.setProperty('--i', i));
    const blocks = document.querySelectorAll('.block');
    Array.prototype.forEach.call(blocks, (b, i) => b.style.setProperty('--i', i));
    const items = document.querySelectorAll('.item');
    Array.prototype.forEach.call(items, (it, i) => it.style.setProperty('--i', i));
    const numEl = document.querySelector('.dial .mid b');
    if (numEl) {
      const target = parseInt(numEl.textContent, 10) || 0;
      let cur = 0;
      const step = Math.max(1, Math.round(target / 22));
      numEl.textContent = '0';
      const tick = () => {
        cur = Math.min(target, cur + step);
        numEl.textContent = String(cur);
        if (cur < target) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
  }

  async function refreshLive(force) {
    try {
      if (S.saved.length) {
        const mints = S.saved.slice(0, 25).map(function (s) { return s.mint; }).join(',');
        const res = await getJson('https://api.dexscreener.com/latest/dex/tokens/' + encodeURIComponent(mints), 6000);
        const pairs = (res && res.pairs) || [];
        let changed = false;
        S.saved.forEach(function (s) {
          const p = pairs.filter(function (x) { return x.baseToken && x.baseToken.address === s.mint; })
            .sort(function (x, y) { return (Number(y.liquidity && y.liquidity.usd) || 0) - (Number(x.liquidity && x.liquidity.usd) || 0); })[0];
          if (!p) return;
          const liq = Number(p.liquidity && p.liquidity.usd) || 0;
          const ch = Number(p.priceChange && p.priceChange.h24) || 0;
          const price = Number(p.priceUsd) || 0;
          if (liq !== s.liq || ch !== s.ch24 || price !== s.price) {
            s.prevLiq = s.liq || liq;
            s.liq = liq; s.ch24 = ch; s.price = price; s.at = Date.now();
            s.ch1 = Number(p.priceChange && p.priceChange.h1) || 0;
            s.ch6 = Number(p.priceChange && p.priceChange.h6) || 0;
            s.mc = Number(p.marketCap) || 0;
            changed = true;
          }
        });
        if (changed) { write(K.saved, S.saved); render(); }
      }
      if (S.result && S.resultOpen && S.tab === 'scan') {
        const res = await getJson('https://api.dexscreener.com/latest/dex/tokens/' + encodeURIComponent(S.result.token.mint), 6000);
        const p = bestPair(res);
        if (p) {
          const price = Number(p.priceUsd) || 0;
          const ch = Number(p.priceChange && p.priceChange.h24) || 0;
          if (price !== S.result.token.price || ch !== S.result.token.ch24) {
            S.result.token.price = price;
            S.result.token.ch24 = ch;
            render();
            const pEl = document.querySelector('.tk-priceline b');
            if (pEl) { pEl.classList.add('tick'); setTimeout(function () { pEl.classList.remove('tick'); }, 700); }
          }
        }
      }
    } catch (e) {}
  }

  function syncDock() {
    const labels = {
      scan: t('checkTab'),
      saved: t('savedTab'),
      profile: t('profileTab')
    };
    document.querySelectorAll('#dock [data-tab]').forEach(function (b) {
      const tab = b.dataset.tab;
      const on = tab === S.tab || (S.tab === 'alerts' && tab === 'saved') || (S.tab === 'info' && tab === 'profile');
      b.classList.toggle('on', on);
      const s = b.querySelector('span');
      if (s && labels[tab]) s.textContent = labels[tab];
    });
    syncBack();
  }
  function needsBack() {
    return (S.tab === 'scan' && S.resultOpen) || S.tab === 'info';
  }
  function syncBack() {
    if (!TG || !TG.BackButton) return;
    try {
      if (needsBack()) TG.BackButton.show();
      else TG.BackButton.hide();
    } catch (e) {}
  }
  function goBack() {
    if (S.tab === 'info') { S.tab = 'profile'; haptic(); render(); return; }
    S.resultOpen = false;
    if (S.busy) S.suppressResult = true;
    haptic();
    render();
  }

  function bind() { try { bindInner(); } catch (e) { console.warn(e); } }
  function bindInner() {
    if (document.getElementById('alBack')) document.getElementById('alBack').onclick = function () { S.tab = 'saved'; render(); };
    if (document.getElementById('alSet')) document.getElementById('alSet').onclick = showAlertSettings;
    if (document.getElementById('walletAdd')) document.getElementById('walletAdd').onclick = addWallet;
    document.querySelectorAll('[data-delw]').forEach(function (b) {
      b.onclick = function () { S.wallets = S.wallets.filter(function (w) { return w !== b.dataset.delw; }); write('tc.wallets', S.wallets); render(); };
    });
    document.querySelectorAll('.alert-row[data-mint]').forEach(function (b) {
      b.onclick = function () { if (!b.dataset.mint) return; S.lastMint = b.dataset.mint; S.result = null; S.resultOpen = false; S.tab = 'scan'; render(); setTimeout(runCheck, 80); };
    });
    if (document.getElementById('iosBack')) document.getElementById('iosBack').onclick = goBack;
    if (document.getElementById('recentAll')) document.getElementById('recentAll').onclick = function () { S.tab = 'saved'; haptic(); render(); };
    if (document.getElementById('checkPick')) document.getElementById('checkPick').onclick = function () { haptic(); openCheckSheet(); };
    if (document.getElementById('aboutApp')) document.getElementById('aboutApp').onclick = function () { S.tab = 'info'; haptic(); render(); };
    if (document.getElementById('channel')) document.getElementById('channel').onclick = openChannel;
    if (document.getElementById('infoBack')) document.getElementById('infoBack').onclick = goBack;
    if (document.getElementById('askGo')) document.getElementById('askGo').onclick = function () { hideFeedback(); openChannel(); };
    if (document.getElementById('askX')) document.getElementById('askX').onclick = function (e) {
      e.stopPropagation();
      hideFeedback();
      haptic();
      render();
    };
    if (document.getElementById('listGear')) document.getElementById('listGear').onclick = function () { haptic(); showAlertSettings(); };
    const bnrs = $('#bnrs');
    if (bnrs) {
      const dots = document.querySelectorAll('#bnrDots i');
      bnrs.addEventListener('scroll', function () {
        const i = Math.round(bnrs.scrollLeft / bnrs.clientWidth);
        dots.forEach(function (d, k) { d.classList.toggle('on', k === i); });
      });
      bnrs.querySelectorAll('.bnr-cta').forEach(function (btn) {
        btn.onclick = function (e) {
          e.stopPropagation();
          const id = Number(btn.dataset.bnr);
          if (id === 1) { const inp = $('#mint'); if (inp) inp.focus(); }
          else if (id === 2) { if (typeof showPaywall === 'function') showPaywall(); }
          else if (typeof showHelp === 'function') showHelp(2);
        };
      });
    }
    if ($('#mint')) {
      const input = $('#mint');
      if (S.lastMint) input.value = S.lastMint;
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') runCheck(); });
      const pullAddr = function (raw) {
        const s = String(raw || '').trim();
        if (isAddr(s)) return s;
        const m = s.match(/[1-9A-HJ-NP-Za-km-z]{32,44}/);
        return m && isAddr(m[0]) ? m[0] : '';
      };
      const readClip = async function () {
        let denied = false;
        try {
          if (navigator.clipboard && navigator.clipboard.readText) {
            const t = await navigator.clipboard.readText();
            if (t && String(t).trim()) return String(t);
          }
        } catch (e) { denied = true; }
        if (TG && typeof TG.readTextFromClipboard === 'function') {
          try {
            const t = await new Promise(function (resolve) {
              try { TG.readTextFromClipboard(function (text) { resolve(String(text || '')); }); }
              catch (err) { resolve(''); }
            });
            if (t && String(t).trim()) return String(t);
          } catch (e) {}
        }
        toast(denied
          ? (S.lang === 'ru' ? 'Нет доступа к буферу' : 'Clipboard access was blocked')
          : (S.lang === 'ru' ? 'Буфер пуст' : 'Clipboard is empty'));
        return '';
      };
      if ($('#paste')) $('#paste').onclick = async function (e) {
        e.preventDefault();
        e.stopPropagation();
        const raw = await readClip();
        if (!raw) return;
        const addr = pullAddr(raw);
        input.value = addr || raw.trim();
        haptic();
        if (addr) setTimeout(runCheck, 80);
        else toast(S.lang === 'ru' ? 'Это не адрес Solana' : 'That is not a Solana address');
      };
    }
    if ($('#go')) $('#go').onclick = runCheck;
    if ($('#save')) $('#save').onclick = () => {
      const btn = $('#save');
      const r = S.result; if (!r) return;
      const mint = r.token.mint;
      const exists = (S.saved || []).some(function (x) { return x.mint === mint; });
      if (exists) {
        S.saved = S.saved.filter(function (x) { return x.mint !== mint; });
        write(K.saved, S.saved); haptic(); render();
        return;
      }
      if (S.plan !== 'premium' && S.saved.length >= FREE_SAVED_LIMIT) {
        if (typeof showPaywall === 'function') showPaywall(); else toast(S.lang === 'ru' ? 'Лимит списка в Free — ' + FREE_SAVED_LIMIT + ' монет' : 'Free list limit is ' + FREE_SAVED_LIMIT);
        return;
      }
      const item = { mint: r.token.mint, symbol: r.token.symbol, image: r.token.image, liq: r.token.liq, price: r.token.price, ch24: r.token.ch24, score: r.score, at: Date.now(), entryLiq: r.token.liq, entryPrice: r.token.price, entryScore: r.score, hist: [{ t: Date.now(), s: r.score }] };
      S.saved = [item].concat(S.saved.filter((x) => x.mint !== item.mint)).slice(0, 60);
      write(K.saved, S.saved); haptic('ok');
      const btn2 = document.getElementById('save');
      if (btn2) {
        btn2.classList.add('saved');
        btn2.innerHTML = '<svg class="ok-mark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4.5 4.5L19 7"/></svg><span>' + (S.lang === 'ru' ? 'В списке' : 'Saved') + '</span>';
      }
    };
    if ($('#devCheck') && S.result && S.result.token.creator) {
      const btnEl = $('#devCheck');
      btnEl.onclick = function () { checkDev(S.result.token.creator, btnEl); };
    }
    if ($('#copyMint') && S.result) $('#copyMint').onclick = function () {
      const mint = S.result.token.mint;
      const done = function () {
        haptic('ok');
        const el = document.createElement('div');
        el.className = 'copy-chip';
        el.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4.5 4.5L19 7"/></svg>' + (S.lang === 'ru' ? 'Скопировано' : 'Copied');
        document.body.appendChild(el);
        requestAnimationFrame(function () { el.classList.add('show'); });
        setTimeout(function () { el.classList.remove('show'); setTimeout(function () { el.remove(); }, 250); }, 1400);
      };
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(mint).then(done).catch(done);
        else done();
      } catch (e) { done(); }
    };
    if ($('#open')) $('#open').onclick = () => { const u = S.result && S.result.token.url; if (u) window.open(u, '_blank'); };

    document.querySelectorAll('.block-head').forEach((b) => b.onclick = () => b.parentElement.classList.toggle('open'));
    document.querySelectorAll('.lf[data-f]').forEach(function (b) {
      b.onclick = function () { S.listFilter = b.dataset.f; render(); haptic(); };
    });
    document.querySelectorAll('.tag[data-tag]').forEach(function (b) {
      b.onclick = function (e) {
        e.stopPropagation();
        const m = b.dataset.tag;
        const it = S.saved.find(function (x) { return x.mint === m; });
        if (!it) return;
        it.tag = it.tag === 'hold' ? 'trash' : it.tag === 'trash' ? 'watch' : 'hold';
        write(K.saved, S.saved); haptic(); render();
      };
    });
    document.querySelectorAll('.row-more').forEach(function (b) {
      b.onclick = function (e) {
        e.stopPropagation();
        const m = b.dataset.exp;
        S.expanded = S.expanded || [];
        const i = S.expanded.indexOf(m);
        if (i > -1) S.expanded.splice(i, 1); else S.expanded.push(m);
        haptic(); render();
      };
    });
    document.querySelectorAll('.attn-row').forEach(function (b) {
      b.onclick = function () { S.tab = 'scan'; S.lastMint = b.dataset.mint; S.result = null; S.resultOpen = false; render(); setTimeout(runCheck, 80); };
    });
    if ($('#sortBtn')) $('#sortBtn').onclick = function () {
      S.listSort = S.listSort === 'score' ? 'change' : S.listSort === 'change' ? 'date' : 'score';
      haptic(); render();
    };
    if ($('#refreshAll')) $('#refreshAll').onclick = function () { haptic(); refreshLive(true); };
    document.querySelectorAll('.item').forEach(function (it) {
      let timer = null;
      const start = function () {
        timer = setTimeout(function () {
          timer = null;
          it._lp = true;
          const mint = it.dataset.mint;
          const ask = S.lang === 'ru' ? 'Удалить монету из списка?' : 'Remove this token from the list?';
          const doDel = function () {
            S.saved = S.saved.filter(function (x) { return x.mint !== mint; });
            write(K.saved, S.saved); haptic(); render();
          };
          if (TG && TG.showConfirm) TG.showConfirm(ask, doDel); else if (window.confirm(ask)) doDel();
        }, 550);
      };
      const cancel = function () { if (timer) { clearTimeout(timer); timer = null; } };
      it.addEventListener('click', function (e) { if (it._lp) { e.preventDefault(); e.stopPropagation(); it._lp = false; } }, true);
      it.addEventListener('pointerdown', start);
      it.addEventListener('pointerup', cancel);
      it.addEventListener('pointercancel', cancel);
      it.addEventListener('pointermove', cancel);
    });
    document.querySelectorAll('.item').forEach((it) => it.onclick = () => {
      S.tab = 'scan'; S.lastMint = it.dataset.mint; S.result = null; S.resultOpen = false; render(); setTimeout(runCheck, 80);
    });
    if ($('#plan')) $('#plan').onclick = showPaywall;
    document.querySelectorAll('.prem-lock').forEach(function (b) { b.onclick = showPaywall; });
    if ($('#share')) $('#share').onclick = function () { haptic(); shareResult(); };
    if ($('#notify')) $('#notify').onclick = function () { S.notify = !S.notify; write('tc.notify', S.notify); render(); };
    if ($('#auto')) $('#auto').onclick = function () { S.autoUpd = S.autoUpd === false; write('tc.auto', S.autoUpd); render(); };
    if ($('#hide')) $('#hide').onclick = function () { S.hideMoney = !S.hideMoney; write('tc.hide', S.hideMoney); render(); };
    if ($('#cache')) $('#cache').onclick = function () { try { localStorage.clear(); } catch (e) {} toast(S.lang === 'ru' ? 'Кэш очищен' : 'Cache cleared'); };
    if ($('#lang')) $('#lang').onclick = () => { S.lang = S.lang === 'ru' ? 'en' : 'ru'; write(K.lang, S.lang); render(); };
    if ($('#screen')) $('#screen').onclick = showScreenSettings;
    if ($('#testPrem')) $('#testPrem').onclick = function () {
      if (isPrem()) { S.plan = 'free'; S.planUntil = 0; }
      else { S.plan = 'premium'; S.planUntil = Date.now() + 30 * 864e5; }
      write('tc.plan', S.plan);
      write('tc.planUntil', S.planUntil);
      haptic();
      render();
    };
    if ($('#testReset')) $('#testReset').onclick = function () {
      try {
        localStorage.removeItem(BANNER_KEY);
        localStorage.removeItem(STORY_KEY);
        localStorage.removeItem(K.ob);
      } catch (e) {}
      const b = document.getElementById('banners'); if (b) b.remove();
      const s = document.getElementById('story'); if (s) s.remove();
      S.tab = 'scan';
      S.resultOpen = false;
      haptic();
      render();
    };
    if ($('#clear')) $('#clear').onclick = () => { S.saved = []; write(K.saved, []); render(); toast(t('cleared')); };
    const more = $('#infoMore');
    if (more) more.onclick = function () {
      const box = $('#infoExtra');
      const open = box.classList.toggle('open');
      more.classList.toggle('open', open);
      haptic();
      if (open && S.result && !S.result.token.gtReserve) {
        S.gtLoading = true;
        loadGecko(S.result.token.mint).then(function (d) {
          S.gtLoading = false;
          if (!d || !S.result) return;
          const at = d.data && d.data.attributes ? d.data.attributes : {};
          S.result.token.gtReserve = Number(at.total_reserve_in_usd) || 0;
          S.result.token.gtVol = Number(at.volume_usd && at.volume_usd.h24) || 0;
          if (S.result.token.gtReserve) {
            const rows = document.querySelectorAll('.info-extra .info-row b');
            for (let i = 0; i < rows.length; i++) {
              if (rows[i].previousElementSibling && rows[i].previousElementSibling.textContent.indexOf('Reserve') > -1) {
                rows[i].textContent = usd(S.result.token.gtReserve);
              }
            }
          }
        });
      }
    };
    if ($('#help')) $('#help').onclick = showHelp;
    if ($('#how')) $('#how').onclick = showHow;
    if ($('#openStory')) $('#openStory').onclick = function () { openStory(false); };
    document.querySelectorAll('.cat[data-bi]').forEach(function (el) {
      el.onclick = function () { showBlock(+el.dataset.bi); };
    });
    if ($('#blkTok') && S.result) $('#blkTok').onclick = function () {
      const m = S.result.token.mint;
      if (S.black.tokens[m]) delete S.black.tokens[m]; else S.black.tokens[m] = Date.now();
      write(K.black, S.black); haptic(); render();
    };
    if ($('#blkDev') && S.result) $('#blkDev').onclick = function () {
      const d = S.result.token.creator;
      if (!d) return;
      if (S.black.devs[d]) delete S.black.devs[d]; else S.black.devs[d] = Date.now();
      write(K.black, S.black); haptic(); render();
    };
    if (S.result) loadSimilar(S.result.token);
  }

  async function loadSimilar(tk) {
    const slot = document.getElementById('similar');
    if (!slot || !tk || !tk.symbol) return;
    try {
      const res = await getJson('https://api.dexscreener.com/latest/dex/search?q=' + encodeURIComponent(tk.symbol), 6000);
      const pairs = (res && res.pairs) || [];
      const seen = {};
      const list = pairs
        .filter(function (p) { return p.chainId === 'solana' && p.baseToken && String(p.baseToken.symbol || '').toUpperCase() === String(tk.symbol).toUpperCase(); })
        .filter(function (p) {
          const ad = p.baseToken.address;
          if (!ad || ad === tk.mint || seen[ad]) return false;
          seen[ad] = 1; return true;
        })
        .sort(function (x, y) { return (Number(y.liquidity && y.liquidity.usd) || 0) - (Number(x.liquidity && x.liquidity.usd) || 0); })
        .slice(0, 4);
      if (!list.length) return;
      const ru = S.lang === 'ru';
      slot.innerHTML = '<div class="sh"><b>' + (ru ? 'Похожие тикеры' : 'Similar tickers') + '</b></div>' +
        '<div class="card">' + list.map(function (p) {
          return '<button type="button" class="row sim-row" data-mint="' + esc(p.baseToken.address) + '">' +
            '<span class="sim-sym">' + esc(p.baseToken.symbol) + '</span>' +
            '<span class="sim-liq">' + usd(p.liquidity && p.liquidity.usd) + '</span>' +
            '<span class="sim-ch" style="color:' + ((Number(p.priceChange && p.priceChange.h24) || 0) >= 0 ? 'var(--green)' : 'var(--red)') + '">' +
            (Number(p.priceChange && p.priceChange.h24) ? pct(p.priceChange.h24) : '') + '</span></button>';
        }).join('') + '</div>' +
        '<p class="foot">' + (ru ? 'Другие контракты с таким же тикером — проверь, не копия ли.' : 'Other contracts with the same ticker.') + '</p>';
      slot.querySelectorAll('.sim-row').forEach(function (b) {
        b.onclick = function () {
          S.lastMint = b.dataset.mint;
          S.result = null;
          S.resultOpen = false;
          render();
          setTimeout(runCheck, 80);
        };
      });
    } catch (e) {}
  }

  async function runCheck() {
    const input = $('#mint');
    const mint = ((input && input.value) || S.lastMint || '').trim();
    const fail = function (msg) {
      S.error = msg;
      S.resultOpen = false;
      S.busy = false;
      render();
      haptic('err');
    };
    if (/^0x[0-9a-fA-F]{40}$/.test(mint)) {
      fail(S.lang === 'ru'
        ? 'Это адрес EVM-сети. Reactive проверяет только Solana.'
        : 'This is an EVM address. Reactive checks Solana only.');
      return;
    }
    if (!isAddr(mint)) { fail(t('errAddr')); return; }
    const nowTs = Date.now();
    if (nowTs < abuse.cooldownUntil) {
      const left = Math.ceil((abuse.cooldownUntil - nowTs) / 1000);
      fail(S.lang === 'ru' ? 'Слишком часто. Подожди ' + left + ' с.' : 'Too fast. Wait ' + left + 's.');
      return;
    }
    abuse.stamps = abuse.stamps.filter(function (t) { return nowTs - t < BURST_WINDOW; });
    abuse.stamps.push(nowTs);
    if (abuse.stamps.length > BURST_LIMIT) {
      abuse.cooldownUntil = nowTs + 60000;
      fail(S.lang === 'ru' ? 'Похоже на автоматические запросы. Пауза 60 секунд.' : 'Automated requests detected. 60s cooldown.');
      return;
    }
    const lastCheck = (S.stats.lastCheckAt || 0);
    const minGap = S.plan === 'premium' ? MIN_INTERVAL_PREM : MIN_INTERVAL_FREE;
    if (nowTs - lastCheck < minGap) {
      const left = Math.ceil((minGap - (nowTs - lastCheck)) / 1000);
      fail(S.lang === 'ru' ? 'Подожди ' + left + ' с перед следующей проверкой.' : 'Wait ' + left + 's before the next check.');
      return;
    }
    const cached = abuse.cache[mint];
    if (cached && nowTs - cached.at < CACHE_TTL) {
      S.result = cached.result;
      S.resultOpen = true;
      S.error = '';
      S.lastMint = mint;
      S.stats.lastCheckAt = nowTs;
      render();
      return;
    }
    if (quotaBlocked()) {
      const L = quotaLeft();
      fail(S.lang === 'ru'
        ? 'Лимит бесплатных проверок исчерпан. Сброс через ' + L.resetMin + ' мин. Premium снимает лимит.'
        : 'Free checks limit reached. Resets in ' + L.resetMin + ' min. Premium removes the limit.');
      showPaywall();
      return;
    }
    S.suppressResult = false;
    S.resultOpen = true;
    S.result = null;
    S.busy = true; S.error = ''; S.lastMint = mint; render();
    try {
      const fast = await loadFast(mint);
      if (fast.dex) {
        S.result = scoreToken(fast);
        S.result.partial = true;
        S.updatedAt = Date.now();
        if (!S.suppressResult) S.resultOpen = true;
        render();
      }
      const raw = await loadSlow(mint, fast);
      if (!bestPair(raw.dex) && !raw.rug) throw new Error(t('notFound'));
      S.result = scoreToken(raw);
      S.updatedAt = Date.now();
      if (S.result.blocks.length < 3) S.error = t('fewData');
      S.stats.scans = (S.stats.scans || 0) + 1; write(K.stats, S.stats);
      try {
        const rec = { mint: S.result.token.mint, symbol: S.result.token.symbol, score: S.result.score, liq: S.result.token.liq, price: S.result.token.price, holders: S.result.token.holders || 0, dev: S.result.token.creatorBalance && S.result.token.creatorBalance.pct ? S.result.token.creatorBalance.pct : 0, at: Date.now() };
        const ex = S.checks.find(function (x) { return x.mint === rec.mint; });
        if (ex) { ex.score = rec.score; ex.liq = rec.liq; ex.price = rec.price; ex.holders = rec.holders; ex.dev = rec.dev; ex.at = rec.at; }
        else S.checks.unshift(rec);
        S.checks = S.checks.slice(0, 60);
        write('tc.checks', S.checks);
      } catch (e) {}
      try {
        const cr = S.result.token.creator;
        if (cr) {
          S.creators[cr] = S.creators[cr] || { n: 0, mints: [], last: 0 };
          if (S.creators[cr].mints.indexOf(S.result.token.mint) === -1) {
            S.creators[cr].mints.push(S.result.token.mint);
            S.creators[cr].n = S.creators[cr].mints.length;
          }
          S.creators[cr].last = Date.now();
          write('tc.creators', S.creators);
        }
      } catch (e) {}
      quotaConsume();
      S.stats.lastCheckAt = Date.now();
      abuse.cache[mint] = { at: Date.now(), result: S.result };
      write(K.stats, S.stats);
      haptic('ok');
    } catch (e) {
      S.error = t('fail') + (e && e.message ? e.message : '');
      if (!S.result) S.resultOpen = false;
      haptic('err');
    }
    if (S.suppressResult) S.resultOpen = false;
    else if (S.result) S.resultOpen = true;
    S.busy = false; render();
  }

  /* ---------------- boot ---------------- */
  S.lang = detectLang();
  applyTheme();
  if (IS_DESKTOP) document.documentElement.classList.add('desktop');
  if (TG) {
    try {
      TG.ready();
      if (!IS_DESKTOP) {
        TG.expand();
        if (TG.requestFullscreen) TG.requestFullscreen();
        if (TG.lockOrientation) TG.lockOrientation();
        if (TG.disableVerticalSwipes) TG.disableVerticalSwipes();
      }
      applyInsets();
      applyTheme();
      if (TG.BackButton && TG.BackButton.onClick) TG.BackButton.onClick(goBack);
    } catch (e) {}
    try {
      if (TG.onEvent) {
        TG.onEvent('fullscreenChanged', applyInsets);
        TG.onEvent('safeAreaChanged', applyInsets);
        TG.onEvent('contentSafeAreaChanged', applyInsets);
        TG.onEvent('themeChanged', applyTheme);
        TG.onEvent('viewportChanged', function () { if (TG.expand) TG.expand(); applyInsets(); });
      }
      [0, 400, 1200].forEach(function (ms) { setTimeout(applyInsets, ms); });
    } catch (e) {}
  }
  applyInsets();
  function ensureFullscreen() {
    if (!TG || IS_DESKTOP) return;
    try { if (!TG.isFullscreen && TG.requestFullscreen) TG.requestFullscreen(); } catch (e) {}
    try { if (TG.expand) TG.expand(); } catch (e) {}
  }
  document.addEventListener('pointerdown', ensureFullscreen, { once: false });
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('#dock [data-tab]');
    if (!btn) return;
    const next = btn.dataset.tab;
    if (next === 'scan' && S.tab === 'scan' && S.resultOpen) {
      S.resultOpen = false;
      if (S.busy) S.suppressResult = true;
      haptic();
      render();
      return;
    }
    if (next === S.tab && S.tab !== 'alerts') return;
    S.tab = next;
    haptic();
    render();
  });
  // block pinch-zoom / double-tap zoom (make it feel native)
  ['gesturestart', 'gesturechange', 'gestureend'].forEach(function (ev) {
    document.addEventListener(ev, function (e) { e.preventDefault(); }, { passive: false });
  });
  document.addEventListener('touchmove', function (e) {
    if (e.touches && e.touches.length > 1) e.preventDefault();
  }, { passive: false });
  document.addEventListener('dblclick', function (e) { e.preventDefault(); }, { passive: false });

  // autoClip
  setTimeout(async function () {
    try {
      if (S.result || S.lastMint) return;
      let txt = '';
      if (TG && typeof TG.readTextFromClipboard === 'function') {
        txt = await new Promise(function (res) { try { TG.readTextFromClipboard(function (t2) { res(String(t2 || '')); }); } catch (e) { res(''); } });
      }
      txt = String(txt || '').trim();
      if (!isAddr(txt)) return;
      const line = document.getElementById('clipLine');
      if (!line) return;
      const short = esc(txt.slice(0, 4) + '…' + txt.slice(-4));
      line.hidden = false;
      line.innerHTML = S.lang === 'ru'
        ? 'В буфере <code>' + short + '</code> — проверим сразу после вставки'
        : 'Clipboard <code>' + short + '</code> — we’ll check right after paste';
    } catch (e) {}
  }, 400);

  setInterval(refreshLive, 45000);
  setInterval(function () { if (S.tab === 'scan' && S.result && !S.busy) refreshLive(); }, 25000);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) refreshLive(); });

  try {
    if (S.saved && S.saved.length) {
      S.recentLoading = true;
      render();
      setTimeout(function () {
        refreshLive().finally(function () {
          if (S.wallets && S.wallets.length) refreshWallets();
          S.recentLoading = false;
          try { render(); } catch (e) {}
        });
      }, 120);
    } else {
      render();
    }
  } catch (e) { showFatal(e); }
})();
