/* Token check — one tap score */
(function () {
  'use strict';

  const TG = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
  const PLATFORM = (TG && TG.platform) || (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.platform) || 'web';
  const IS_DESKTOP = /tdesktop|macos|web|win/i.test(PLATFORM);

  const APP_VER = 'bc';

  const K = {
    ob: 'tc.onboard.v1', saved: 'tc.saved.v1', stats: 'tc.stats.v1',
    theme: 'tc.theme.v1', lang: 'tc.lang.v1', black: 'tc.black.v1'
  };

  const S = {
    tab: 'scan',
    saved: read(K.saved, []),
    stats: read(K.stats, { scans: 0 }),
    theme: 'dark',
    lang: null,
    black: read(K.black, { devs: {}, tokens: {} }),
    notify: read('tc.notify', true),
    autoUpd: read('tc.auto', true),
    hideMoney: read('tc.hide', false),
    quota: read('tc.quota', { hour: [], day: [] }),
    plan: read('tc.plan', 'free'),
    ui: read('tc.ui', { trend: true, recent: true, quota: true, anim: true, big: true }),
    planUntil: read('tc.planUntil', 0),
    result: null,
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
      how: '70–100 — чисто. 40–69 — рискованно. 0–39 — опасно. Оценка не гарантия: раг случается и с чистыми монетами.',
      result: 'Результат', why: 'Почему такой балл', save: 'В список', again: 'Проверить другую',
      liq: 'Ликвидность', holders: 'Распределение', dev: 'Дев и бандлы', contract: 'Контракт',
      activity: 'Активность', age: 'Возраст', price: 'Цена за 24ч', links: 'Ссылки',
      good: 'Чисто', mid: 'Рискованно', bad: 'Опасно', of100: 'из 100',
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
      verdictK: 'Вердикт', vCan: 'Можно', vRisk: 'Рискованно', vNo: 'Нельзя',
      checksK: 'Проверки', scanning: 'Проверяю монету…'
    },
    en: {
      checkTab: 'Check', savedTab: 'Saved', profileTab: 'Profile',
      pasteTitle: 'Check a token', pasteSub: 'Paste the address — get a score from 0 to 100 and know whether it is worth the risk.',
      ph: 'Solana contract address', paste: 'Paste', check: 'Check', checking: 'Checking…',
      howTitle: 'How to read the score',
      how: '70–100 — clean. 40–69 — risky. 0–39 — dangerous. The score is not a guarantee: rugs happen to clean tokens too.',
      result: 'Result', why: 'Why this score', save: 'Save', again: 'Check another',
      liq: 'Liquidity', holders: 'Distribution', dev: 'Dev & bundles', contract: 'Contract',
      activity: 'Activity', age: 'Age', price: '24h price', links: 'Links',
      good: 'Clean', mid: 'Risky', bad: 'Dangerous', of100: 'of 100',
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
      verdictK: 'Verdict', vCan: 'Safe', vRisk: 'Risky', vNo: 'Avoid',
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
    n = Number(n); if (!isFinite(n) || n <= 0) return '—';
    if (n >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
    if (n >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M';
    if (n >= 1e3) return '$' + (n / 1e3).toFixed(1) + 'K';
    return '$' + n.toFixed(2);
  };
  const price = (n) => {
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
    const dark = S.theme === 'auto' ? (!TG || TG.colorScheme !== 'light') : S.theme === 'dark';
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    document.querySelector('meta[name=theme-color]').setAttribute('content', dark ? '#000000' : '#f5f5f7');
    if (TG && TG.setHeaderColor) { try { TG.setHeaderColor('#141416'); } catch (e) {} }
    if (TG && TG.setBackgroundColor) { try { TG.setBackgroundColor(dark ? '#000000' : '#f5f5f7'); } catch (e) {} }
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

  function trendingCached() {
    const c = read('tc.trending', null);
    if (!c || !c.at || Date.now() - c.at > 15 * 60000) return null;
    return c.items;
  }

  async function loadTrending() {
    const cached = trendingCached();
    if (cached) return cached;
    try {
      const d = await getJson('https://api.geckoterminal.com/api/v2/networks/solana/trending_pools?page=1', 4000);
      const pools = (d && d.data) || [];
      const items = pools.map(function (p) {
        const at = p.attributes || {};
        const rel = (p.relationships && p.relationships.base_token && p.relationships.base_token.data) || {};
        const id = String(rel.id || '');
        const addr = id.indexOf('_') > -1 ? id.split('_')[1] : '';
        const ch = at.price_change_percentage && at.price_change_percentage.h24;
        return { mint: addr, symbol: String(at.name || '').split(' / ')[0], ch: Number(ch) || 0 };
      }).filter(function (x) { return x.mint && x.symbol; }).slice(0, 5);
      if (items.length) write('tc.trending', { at: Date.now(), items: items });
      return items;
    } catch (e) {}
    // fallback: top volume Solana pairs from DexScreener search
    try {
      const d2 = await getJson('https://api.dexscreener.com/latest/dex/search?q=SOL', 5000);
      const pairs = (d2 && d2.pairs) || [];
      const seen = {};
      const items = pairs
        .filter(function (p) { return p.chainId === 'solana' && p.baseToken && p.liquidity && p.liquidity.usd > 200000; })
        .sort(function (x, y) { return (Number(y.volume && y.volume.h24) || 0) - (Number(x.volume && x.volume.h24) || 0); })
        .filter(function (p) { if (seen[p.baseToken.address]) return false; seen[p.baseToken.address] = 1; return true; })
        .slice(0, 5)
        .map(function (p) {
          return { mint: p.baseToken.address, symbol: p.baseToken.symbol, ch: Number(p.priceChange && p.priceChange.h24) || 0 };
        });
      if (items.length) write('tc.trending', { at: Date.now(), items: items });
      return items;
    } catch (e2) { return []; }
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
        buys: Number(pair && pair.txns && pair.txns.h24 && pair.txns.h24.buys) || 0,
        sells: Number(pair && pair.txns && pair.txns.h24 && pair.txns.h24.sells) || 0,
        dex: (pair && pair.dexId) || '',
        pairAddr: (pair && pair.pairAddress) || '',
        created: Number(pair && pair.pairCreatedAt) || 0,
        holders: Number(rug.totalHolders) || 0,
        top: (rug.topHolders || []).slice(0, 5).map((h) => ({ addr: String(h.address || h.owner || ''), pct: Number(h.pct) || 0 })),
        risks: (rug.risks || []).slice(0, 6).map((r) => ({ name: String(r.name || ''), level: String(r.level || ''), desc: String(r.description || '') })),
        rugScore: Number(rug.score_normalised),
        mintAuth: !!rug.mintAuthority,
        freezeAuth: !!rug.freezeAuthority,
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
        socials: (info.socials || []).map((s) => ({ type: s.type, url: s.url })),
        sites: (info.websites || []).map((s) => s.url),
        url: (pair && pair.url) || '',
        lpLocked: (function () {
          const m = (rug.markets || [])[0];
          if (!m) return null;
          const v = m.lp && (m.lp.lpLockedPct !== undefined ? m.lp.lpLockedPct : m.lp.lpLocked);
          return v === undefined ? null : Number(v);
        })(),
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

  const FREE_PER_HOUR = 10;
  const FREE_PER_DAY = 30;
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
    const resetMin = q.hour.length ? Math.max(1, Math.ceil((3600e3 - (Date.now() - q.hour[0])) / 60000)) : 0;
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

  function countUp(el, to, ms) {
    if (!el) return;
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
    const add = (tone, text) => out.push({ tone, text });
    const lowLiq = tk.liq > 0 && tk.liq < 10000;

    if (tk.gp && tk.gp.honeypot) add('bad', ru ? 'Honeypot: продать не получится. Не покупай.' : 'Honeypot: you will not be able to sell.');
    if (tk.mintAuth) add('bad', ru ? 'Минт открыт: создатель может напечатать токены в любой момент.' : 'Mint authority open: the dev can mint tokens anytime.');
    if (tk.freezeAuth) add('bad', ru ? 'Заморозка открыта: продажи могут заблокировать.' : 'Freeze authority open: sells can be blocked.');
    if (tk.gp && Number(tk.gp.buyTax) > 5) add('bad', ru ? 'Налог на покупку ' + tk.gp.buyTax + '% — почти всегда скам.' : 'Buy tax ' + tk.gp.buyTax + '% — almost always a scam.');
    if (tk.gp && Number(tk.gp.sellTax) > 5) add('bad', ru ? 'Налог на продажу ' + tk.gp.sellTax + '% — почти всегда скам.' : 'Sell tax ' + tk.gp.sellTax + '% — almost always a scam.');
    if (lowLiq) add('bad', ru ? 'Ликвидность меньше $10K — выйти без потерь почти невозможно.' : 'Liquidity under $10K — almost impossible to exit cleanly.');
    if (tk.fdv && tk.liq && tk.liq / tk.fdv < 0.02) add('warn', ru ? 'Ликвидность — ' + Math.round(tk.liq / tk.fdv * 100) + '% от FDV: при обвале выйти сложно.' : 'Liquidity is ' + Math.round(tk.liq / tk.fdv * 100) + '% of FDV: hard to exit in a dump.');
    if (tk.holders && tk.holders < 200) add('warn', ru ? 'Всего ' + num(tk.holders) + ' холдеров — легко манипулировать.' : 'Only ' + num(tk.holders) + ' holders — easy to manipulate.');
    if (tk.top && tk.top.length) {
      const top10 = tk.top.slice(0, 10).reduce((s, h) => s + h.pct, 0);
      if (top10 > 50) add('warn', ru ? 'Топ-10 держат ' + Math.round(top10) + '% — могут обрушить цену.' : 'Top-10 hold ' + Math.round(top10) + '% — they can crash the price.');
    }
    if (tk.created) {
      const h = (Date.now() - tk.created) / 36e5;
      if (h < 1) add('warn', ru ? 'Монете меньше часа — истории нет, всё может измениться.' : 'Less than an hour old — no history yet.');
      if (h > 24 * 30) add('good', ru ? 'Монета живёт ' + Math.round(h / 24) + ' дней — прошла проверку временем.' : 'Alive for ' + Math.round(h / 24) + ' days — survived the test of time.');
    }
    if (tk.ch24 <= -30) add('warn', ru ? 'Падение ' + pct(tk.ch24) + ' за 24ч — идёт дамп или потеря интереса.' : pct(tk.ch24) + ' in 24h — dumping or losing interest.');
    if (tk.ch24 >= 300) add('warn', ru ? 'Рост ' + pct(tk.ch24) + ' за 24ч — высокий риск войти на пике.' : pct(tk.ch24) + ' in 24h — high risk of buying the top.');
    if (tk.buys && tk.sells && tk.sells > tk.buys * 1.6) add('warn', ru ? 'Продаж в ' + (tk.sells / tk.buys).toFixed(1) + ' раза больше покупок.' : (tk.sells / tk.buys).toFixed(1) + '× more sells than buys.');
    if (tk.buys && tk.sells && tk.buys > tk.sells * 1.6 && tk.ch24 > 0) add('good', ru ? 'Покупают активнее, чем продают (' + tk.buys + ' / ' + tk.sells + ').' : 'Buy pressure dominates (' + tk.buys + ' / ' + tk.sells + ').');
    if (tk.gp && tk.gp.lp && tk.gp.lp <= 2) add('warn', ru ? 'Ликвидность в ' + tk.gp.lp + ' кошельке(ах) — пул могут вывести.' : 'Liquidity in ' + tk.gp.lp + ' wallet(s) — the pool can be pulled.');
    if (tk.lpLocked !== null && tk.lpLocked > 90) add('good', ru ? 'LP заблокирован на ' + Math.round(tk.lpLocked) + '% — пул нельзя вывести.' : 'LP locked ' + Math.round(tk.lpLocked) + '% — the pool cannot be pulled.');
    if (tk.lpLocked !== null && tk.lpLocked < 50) add('warn', ru ? 'LP заблокирован только на ' + Math.round(tk.lpLocked) + '% — разработчик может собрать ликвидность.' : 'LP locked only ' + Math.round(tk.lpLocked) + '% — the dev can pull liquidity.');
    if (tk.pump && !tk.pump.complete) add('info', ru ? 'Ещё на бондинг-кривой Pump.fun — не вышла на DEX.' : 'Still on the Pump.fun bonding curve — not on a DEX yet.');
    if (tk.pump && tk.pump.complete) add('good', ru ? 'Прошла градацию Pump.fun — есть внешний пул.' : 'Graduated from Pump.fun — has an external pool.');
    if (!tk.socials.length && !tk.sites.length) add('warn', ru ? 'Нет ссылок на сайт и соцсети — красный флаг.' : 'No website or socials — red flag.');
    if (tk.risks.length) tk.risks.slice(0, 2).forEach((r) => add('warn', (ru ? 'Риск: ' : 'Risk: ') + r.name));
    if (tk.creatorBalance && tk.creatorBalance.pct > 5) add('warn', ru ? 'У создателя ' + tk.creatorBalance.pct.toFixed(1) + '% supply — он может слить в любой момент.' : 'Creator holds ' + tk.creatorBalance.pct.toFixed(1) + '% of supply.');
    if (tk.creatorBalance && tk.creatorBalance.pct > 0 && tk.creatorBalance.pct <= 5) add('good', ru ? 'У создателя всего ' + tk.creatorBalance.pct.toFixed(2) + '% supply.' : 'Creator holds only ' + tk.creatorBalance.pct.toFixed(2) + '% of supply.');
    if (tk.transferFee !== null && tk.transferFee > 3) add('bad', ru ? 'Комиссия за перевод ' + tk.transferFee.toFixed(1) + '% — токен может съедать деньги при переводах.' : 'Transfer fee ' + tk.transferFee.toFixed(1) + '% — the token eats funds on transfers.');
    if (tk.transferFee === 0) add('good', ru ? 'Комиссии за перевод нет.' : 'No transfer fee.');
    if (tk.top1 > 15) add('warn', ru ? 'Один кошелёк держит ' + tk.top1.toFixed(1) + '% — это риск дампа.' : 'One wallet holds ' + tk.top1.toFixed(1) + '% — dump risk.');
    if (prev && prev.liq && tk.liq) {
      const dLiq = (tk.liq - prev.liq) / prev.liq * 100;
      if (dLiq <= -25) add('bad', ru ? 'Ликвидность упала на ' + Math.abs(Math.round(dLiq)) + '% с прошлой проверки — похоже на вывод пула.' : 'Liquidity dropped ' + Math.abs(Math.round(dLiq)) + '% since last check.');
      if (dLiq >= 40) add('good', ru ? 'Ликвидность выросла на ' + Math.round(dLiq) + '% с прошлой проверки.' : 'Liquidity grew ' + Math.round(dLiq) + '% since last check.');
    }
    if (tk.vol && tk.liq && tk.vol / tk.liq > 5) add('warn', ru ? 'Оборот в ' + (tk.vol / tk.liq).toFixed(1) + '× ликвидности — возможна накрутка объёма.' : 'Volume is ' + (tk.vol / tk.liq).toFixed(1) + '× liquidity — possible volume farming.');
    if (tk.ch24 && tk.ch24 < -60) add('bad', ru ? 'Монета потеряла ' + Math.abs(Math.round(tk.ch24)) + '% за сутки — идёт слив.' : 'Down ' + Math.abs(Math.round(tk.ch24)) + '% in 24h.');
    if (S.black.devs[tk.creator]) add('bad', ru ? 'Создатель в твоём чёрном списке — ты уже блокировал его.' : 'Creator is in your blacklist — you blocked them before.');
    if (S.black.tokens[tk.mint]) add('bad', ru ? 'Эта монета в твоём чёрном списке.' : 'This token is in your blacklist.');
    return out;
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
      if (tk.fdv && liq && liq / tk.fdv < 0.015) out.push(ru ? 'Ликвидность — меньше 1.5% от FDV. Такой пул не выдержит массового выхода.' : 'Liquidity is under 1.5% of FDV — cannot absorb a mass exit.');
      if (tk.lpLocked !== null && tk.lpLocked < 30) out.push(ru ? 'LP почти не заблокирован: разработчик может забрать ликвидность в любой момент.' : 'LP barely locked: the dev can pull liquidity anytime.');
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
  function viewAll() {
    const tk = S.result ? S.result.token : null;
    const v = S.result ? verdictLabel(S.result.score) : null;
    const colorOf = (c) => c === 'good' ? 'var(--green)' : c === 'mid' ? 'var(--yellow)' : 'var(--red)';

    let out = top(t('checkTab')) + '<div class="page">';
    const ru = S.lang === 'ru';
    if (S.ui.trend !== false) {
      out += '<div class="trend" id="trend">' +
        '<div class="trend-head"><span class="trend-k">' + esc(ru ? 'РЫНОК SOLANA' : 'SOLANA MARKET') + '</span>' +
        '<span class="trend-h">' + esc(ru ? 'тап — проверить' : 'tap to check') + '</span></div>' +
        '<div class="trend-row" id="trendRow"><span class="trend-skel"></span><span class="trend-skel"></span><span class="trend-skel"></span></div></div>';
    }
    out += '<div class="brand-l">REACTIVE</div>';
    out += '<h1 class="big-t' + (S.ui.big === false ? ' compact' : '') + '">' + esc(ru ? 'Проверь монету' : 'Check a token') + '</h1>';
    out += '<p class="big-s">' + esc(ru ? 'Оценка риска за 30 секунд. Solana.' : 'Risk score in 30 seconds. Solana.') + '</p>';
    out += '<div class="panel">' +
      '<span class="panel-k">' + esc(ru ? 'АДРЕС КОНТРАКТА' : 'CONTRACT ADDRESS') + '</span>' +
      '<div class="panel-in"><input id="mint" placeholder="' + esc(t('ph')) + '" autocomplete="off" spellcheck="false">' +
      '<button class="paste-b" id="paste">' + esc(ru ? 'Вставить' : 'Paste') + '</button></div>' +
      '<button class="panel-go" id="go"' + (S.busy ? ' disabled' : '') + '>' + (S.busy ? '<span class="spinner"></span>' : esc(S.result ? t('again') : t('check'))) + '</button>' +
      (S.error ? '<p class="err" style="margin:10px 2px 0">' + esc(S.error) + '</p>' : '') +
      (function () {
        if (S.result || S.ui.quota === false) return '';
        const L = quotaLeft();
        return '<p class="panel-f">' + esc(S.plan === 'premium'
          ? (ru ? 'Premium · без лимита' : 'Premium · unlimited')
          : (ru ? 'Осталось ' + L.hour + ' из ' + FREE_PER_HOUR + ' проверок в час' : L.hour + ' of ' + FREE_PER_HOUR + ' checks left')) + '</p>';
      })() +
      '</div>';
    if (S.busy) out += '<div class="skel-wrap"><div class="skel"></div><div class="skel"></div><div class="skel"></div></div>';

    if (S.ui.recent !== false && !S.result && S.saved.length) {
      out += '<p class="eyebrow" style="margin-top:24px">' + esc(S.lang === 'ru' ? 'НЕДАВНИЕ' : 'RECENT') + '</p>';
      out += '<div class="list recent-list">' + S.saved.slice(0, 10).map(function (s, i) {
        const vv = verdictLabel(s.score);
        const cc = vv.cls === 'good' ? 'var(--green)' : vv.cls === 'mid' ? 'var(--yellow)' : 'var(--red)';
        return '<button class="item" style="--i:' + i + '" data-mint="' + esc(s.mint) + '"><span class="ava" style="background:' + (vv.cls === 'good' ? 'linear-gradient(160deg,#2b6b45,#1c4a30)' : vv.cls === 'mid' ? 'linear-gradient(160deg,#6b5518,#4a3c17)' : 'linear-gradient(160deg,#6b2a30,#4a2026)') + '">' + (s.image ? '<img src="' + esc(s.image) + '" alt="">' : esc(s.symbol.slice(0, 2))) + '</span><span class="meta"><b>' + esc(s.symbol) + '</b><span>' + usd(s.liq) + '</span></span><span class="num" style="--sc:' + cc + '">' + s.score + '</span></button>';
      }).join('') + '</div>';
    }
    if (tk && S.result) {
      out += '<div class="res">';
      const chCol = (tk.ch24 || 0) >= 0 ? 'var(--green)' : 'var(--red)';
      const ageTxt = (function () {
        if (!tk.created) return '—';
        const h = (Date.now() - tk.created) / 36e5;
        return h < 1 ? Math.round(h * 60) + 'm' : h < 48 ? Math.round(h) + 'h' : Math.round(h / 24) + 'd';
      })();
      const scCol = v.cls === 'good' ? 'var(--green)' : v.cls === 'mid' ? 'var(--yellow)' : 'var(--red)';
      out += '<div class="tk-card">' +
        '<div class="tk-top">' +
        '<span class="tk-ava">' + (tk.image ? '<img src="' + esc(tk.image) + '" alt="">' : esc(tk.symbol.slice(0, 2))) + '</span>' +
        '<span class="tk-id"><b>' + esc(tk.symbol) + '</b><span>' + esc(tk.name || '') + '</span></span>' +
        '<span class="tk-score" style="color:' + scCol + '"><b>' + S.result.score + '</b><i>/100</i></span>' +
        '</div>' +
        '<div class="tk-priceline"><b>' + esc(price(tk.price)) + '</b>' +
        '<span style="color:' + chCol + '">' + (tk.ch24 ? pct(tk.ch24) : '') + '</span></div>' +
        '<div class="tk-bar"><i style="width:' + Math.round(S.result.score) + '%;background:' + scCol + '"></i></div>' +
        '<div class="tk-stats">' +
        '<div><span>MC</span><b>' + usd(tk.mc) + '</b></div>' +
        '<div><span>' + esc(S.lang === 'ru' ? 'Ликв.' : 'Liq') + '</span><b>' + usd(tk.liq) + '</b></div>' +
        '<div><span>' + esc(S.lang === 'ru' ? 'Объём' : 'Vol') + '</span><b>' + usd(tk.vol) + '</b></div>' +
        '<div><span>' + esc(S.lang === 'ru' ? 'Возраст' : 'Age') + '</span><b>' + esc(ageTxt) + '</b></div>' +
        '</div>' +
        '<div class="tk-upd">' + esc((S.lang === 'ru' ? 'обновлено ' : 'updated ') + ago(S.updatedAt || Date.now())) + (S.result.partial ? ' · ' + (S.lang === 'ru' ? 'догружаю…' : 'loading…') : '') + '</div>' +
        '<div class="tk-links">' +
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
        '</div>' +
        '<div class="tk-meta">' + esc((tk.dex || '').toUpperCase()) +
        (tk.holders ? ' · ' + num(tk.holders) + ' holders' : '') +
        (tk.buys || tk.sells ? ' · ' + tk.buys + '/' + tk.sells : '') +
        '</div></div>';
      // insights
      const insights = buildInsights(tk);
      if (insights.length) {
        out += '<p class="eyebrow" style="margin-top:20px">' + esc(S.lang === 'ru' ? 'Что важно' : 'Key findings') + '</p>';
        out += '<div class="ins">' + insights.map(function (x, i) {
          const c = x.tone === 'bad' ? 'var(--red)' : x.tone === 'warn' ? 'var(--yellow)' : x.tone === 'good' ? 'var(--green)' : 'var(--text-3)';
          return '<div class="ins-row" style="--i:' + i + '"><span class="ins-dot" style="background:' + c + '"></span><span>' + esc(x.text) + '</span></div>';
        }).join('') + '</div>';
        if (S.plan !== 'premium' && insights.length > 3) {
          out += '<button class="locked-row" id="lockIns"><span>🔒</span><span>' + esc(S.lang === 'ru' ? 'Ещё ' + (insights.length - 3) + ' инсайтов — в Premium' : (insights.length - 3) + ' more insights in Premium') + '</span></button>';
        }
      }

      // info grid
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
        ['Reserve (GT)', tk.gtReserve ? usd(tk.gtReserve) : '—', ''],
        ['Creator %', tk.creatorBalance && tk.creatorBalance.pct ? tk.creatorBalance.pct.toFixed(2) + '%' : '—', ''],
        ['Top-1 holder', tk.top1 ? tk.top1.toFixed(2) + '%' : '—', ''],
        ['Transfer fee', tk.transferFee === null ? '—' : tk.transferFee.toFixed(1) + '%', ''],
        ['LP locked', tk.lpLocked === null || tk.lpLocked === undefined ? '—' : Math.round(tk.lpLocked) + '%', '']
      ];
      const rowHtml = (r) => '<div class="info-row"><span>' + esc(r[0]) + '</span><b>' + esc(r[1]) + (r[2] ? ' <i style="color:' + (String(r[2]).startsWith('-') ? 'var(--red)' : 'var(--green)') + '">' + esc(r[2]) + '</i>' : '') + '</b></div>';
      const primary = rows.slice(0, 4);
      const extra = rows.slice(4);
      out += '<div class="info">' + primary.map(rowHtml).join('');
      if (extra.length) {
        out += '<button class="info-toggle" id="infoMore"><span>' + esc(S.lang === 'ru' ? 'Ещё ' + extra.length + ' показателей' : extra.length + ' more metrics') + '</span>' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg></button>' +
          '<div class="info-extra" id="infoExtra">' + extra.map(rowHtml).join('') + '</div>';
      }
      out += '</div>';

      // risks from rugcheck
      if (tk.risks && tk.risks.length) {
        out += '<p class="eyebrow" style="margin-top:18px">RISKS</p><div class="risk-list">' + tk.risks.map((r) => {
          const low = /warn|medium|low/i.test(r.level);
          return '<div class="risk"><span class="dot" style="background:' + (low ? 'var(--yellow)' : 'var(--red)') + '"></span><span><b>' + esc(r.name) + '</b>' + (r.desc ? '<span class="tiny">' + esc(r.desc) + '</span>' : '') + '</span></div>';
        }).join('') + '</div>';
      }

      // checks blocks
      out += '<div class="sec-head"><p class="eyebrow">' + esc(t('checksK')) + '</p><button class="help" id="help">?</button></div>';
      out += '<div class="cats">' + S.result.blocks.map((x, bi) => {
        const c = x.s >= 0.7 ? 'green' : x.s >= 0.4 ? 'yellow' : 'red';
        const col = 'var(--' + c + ')';
        const p = Math.round(x.s * 100);
        return '<button class="cat ' + c + '" data-bi="' + bi + '" style="--c:' + col + '">' +
          '<div class="cat-top"><span class="cat-ico">' + (BICON[x.k] || '') + '</span>' +
          '<span class="cat-v">' + p + '<i>%</i></span></div>' +
          '<span class="cat-t">' + esc(t(x.k)) + '</span>' +
          '<span class="cat-pb"><i style="width:' + p + '%"></i></span>' +
          '<span class="cat-s">' + esc(x.info) + '</span></button>';
      }).join('') + (S.result.partial ? pendingBlocks(S.result.blocks.map(function (x) { return x.k; }), S.lang) : '') + '</div>';
      out += '<div id="block-detail"></div>';
      // top holders
      if (tk.top && tk.top.length) {
        const maxPct = Math.max.apply(null, tk.top.map(function (h) { return h.pct; }).concat([1]));
        if (S.plan !== 'premium') {
          out += '<button class="locked-row" id="lockHold"><span>🔒</span><span>' + esc(S.lang === 'ru' ? 'Топ держателей — в Premium' : 'Top holders in Premium') + '</span></button>';
        } else {
        out += '<details class="holders"><summary>' + esc(S.lang === 'ru' ? 'Топ держателей' : 'Top holders') + '<i>' + tk.top.length + '</i></summary><div class="hold-list">' + tk.top.map(function (h, hi) {
          const w = Math.max(3, Math.round(h.pct / maxPct * 100));
          const tone = h.pct > 20 ? 'var(--red)' : h.pct > 10 ? 'var(--yellow)' : 'var(--text-3)';
          return '<div class="hold-row"><span class="hold-n">' + (hi + 1) + '</span>' +
            '<span class="hold-mid"><span class="hold-bar"><i style="width:' + w + '%;background:' + tone + '"></i></span>' +
            '<span class="hold-addr">' + esc(h.addr ? h.addr.slice(0, 5) + '…' + h.addr.slice(-4) : '—') + '</span></span>' +
            '<b>' + esc(h.pct.toFixed(2)) + '%</b></div>';
        }).join('') + '</div></details>';
        }
      }

      // actions
      if (S.result.blocks.length < 8) out += '<p class="tiny" style="margin-top:16px">' + esc(S.lang === 'ru' ? 'Часть данных недоступна — оценка по ' + S.result.blocks.length + ' из 8 блоков.' : 'Some data unavailable — scored on ' + S.result.blocks.length + ' of 8 blocks.') + '</p>';
      out += '<div id="similar"></div>';
      out += '<div class="actions-main"><button class="btn" id="save">' + esc(t('save')) + '</button></div>';
      if (tk.creator) {
        const blocked = !!S.black.devs[tk.creator];
        out += '<button class="ghost-action' + (blocked ? ' on' : '') + '" id="blkDev">' +
          '<span class="ga-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.2"/><path d="M6.5 6.5l11 11"/></svg></span>' +
          '<span>' + esc(blocked ? (S.lang === 'ru' ? 'Создатель заблокирован' : 'Creator blocked') : (S.lang === 'ru' ? 'Заблокировать создателя' : 'Block creator')) + '</span>' +
          '</button>';
      }
      if (S.black.tokens[tk.mint]) out += '<p class="tiny" style="margin-top:10px;color:var(--red)">' + esc(S.lang === 'ru' ? 'Монета в чёрном списке' : 'Token is blacklisted') + '</p>';
      out += '<p class="tiny" style="margin-top:14px">' + esc(tk.mint) + '</p>';
      out += '<p class="tiny">' + esc(t('about')) + '</p></div>';
    }
    out += '</div>';
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

  function viewSaved() {
    if (!S.saved.length) {
      return top(t('savedTab')) + '<div class="page"><div class="empty"><b>' + esc(t('emptyTitle')) + '</b><span>' + esc(t('emptyText')) + '</span></div></div>';
    }
    const items = S.saved.map((s) => {
      const v = verdict(s.score);
      const color = v.cls === 'good' ? 'var(--green)' : v.cls === 'mid' ? 'var(--yellow)' : 'var(--red)';
      const ch = Number(s.ch24) || 0;
      const chCol = ch >= 0 ? 'var(--green)' : 'var(--red)';
      return '<button class="item" data-mint="' + esc(s.mint) + '">' +
        '<span class="ava">' + (s.image ? '<img src="' + esc(s.image) + '" alt="">' : esc(s.symbol.slice(0, 2))) + '</span>' +
        '<span class="meta"><b>' + esc(s.symbol) + '</b><span>' + usd(s.liq) + (s.at ? ' · ' + ago(s.at) : '') + '</span></span>' +
        '<span class="ch" style="color:' + chCol + '">' + (ch ? pct(ch) : '') + '</span>' +
        '<span class="num" style="--sc:' + color + '">' + s.score + '</span></button>';
    }).join('');
    return top(t('savedTab')) + '<div class="page"><div class="list">' + items + '</div><p class="tiny" style="text-align:center;margin-top:16px">' + esc(t('tapCoin')) + '</p></div>';
  }

  function viewProfile() {
    const u = TG && TG.initDataUnsafe ? TG.initDataUnsafe.user : null;
    const name = u ? [u.first_name, u.last_name].filter(Boolean).join(' ') : t('guest');
    const handle = u && u.username ? '@' + u.username : t('noUser');
    const pfp = u && u.photo_url ? '<img src="' + esc(u.photo_url) + '" alt="">' : esc(name.slice(0, 1).toUpperCase());
    const themeLabel = S.theme === 'auto' ? t('themeAuto') : S.theme === 'dark' ? t('themeDark') : t('themeLight');
    return top(t('profileTab')) +
      '<div class="page">' +
      '<div class="phead"><span class="pfp">' + pfp + '</span><span><b>' + esc(name) + '</b><span>' + esc(handle) + '</span></span></div>' +
      '<div class="stats"><div class="stat"><b>' + (S.stats.scans || 0) + '</b><span>' + esc(t('scanned')) + '</span></div>' +
      '<div class="stat"><b>' + S.saved.length + '</b><span>' + esc(t('savedN')) + '</span></div></div>' +
      '<div style="height:22px"></div>' +
      '<div class="set-card">' +
      '<button class="set-row" id="lang">' + esc(t('langRow')) + '<span class="val">' + (S.lang === 'ru' ? 'Русский' : 'English') + '</span></button>' +
      '<button class="set-row" id="plan">' + esc(S.lang === 'ru' ? 'Тариф' : 'Plan') + '<span class="val ' + (S.plan === 'premium' && (!S.planUntil || S.planUntil > Date.now()) ? 'prem' : '') + '">' + (S.plan === 'premium' && (!S.planUntil || S.planUntil > Date.now())
        ? (S.lang === 'ru' ? 'Premium · ' + Math.max(1, Math.ceil((S.planUntil - Date.now()) / 864e5)) + ' дн.' : 'Premium · ' + Math.max(1, Math.ceil((S.planUntil - Date.now()) / 864e5)) + 'd')
        : (S.lang === 'ru' ? 'Free · 10/час' : 'Free · 10/h')) + '</span></button>' +
      '<button class="set-row" id="how">' + esc(S.lang === 'ru' ? 'Как это работает' : 'How it works') + '<span class="val">›</span></button>' +
      '<button class="set-row" id="notify">' + esc(S.lang === 'ru' ? 'Уведомления' : 'Notifications') + '<span class="val">' + (S.notify ? (S.lang === 'ru' ? 'вкл' : 'on') : (S.lang === 'ru' ? 'выкл' : 'off')) + '</span></button>' +
      '<button class="set-row" id="auto">' + esc(S.lang === 'ru' ? 'Автообновление раз в минуту' : 'Auto-refresh every minute') + '<span class="val">' + (S.autoUpd === false ? (S.lang === 'ru' ? 'выкл' : 'off') : (S.lang === 'ru' ? 'вкл' : 'on')) + '</span></button>' +
      '<button class="set-row" id="hide">' + esc(S.lang === 'ru' ? 'Скрывать суммы' : 'Hide amounts') + '<span class="val">' + (S.hideMoney ? (S.lang === 'ru' ? 'вкл' : 'on') : (S.lang === 'ru' ? 'выкл' : 'off')) + '</span></button>' +
      '<button class="set-row" id="cache">' + esc(S.lang === 'ru' ? 'Очистить кэш' : 'Clear cache') + '<span class="val">›</span></button>' +
      '<button class="set-row" id="clear">' + esc(t('clear')) + '</button>' +
      '</div>' +
      '<p class="tiny" style="margin-top:18px">' + esc(t('about')) + ' · v' + APP_VER + '</p>' +
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

  function showHow() {
    const ru = S.lang === 'ru';
    const steps = ru ? [
      ['Проверка', 'Вставь адрес монеты. Reactive опрашивает DexScreener, Rugcheck, GoPlus, GeckoTerminal и Pump.fun — параллельно, за 1–2 секунды.'],
      ['Оценка', 'Каждый блок получает 0–100%. Из них собирается общий балл. Цвет: зелёный — чисто, жёлтый — рискованно, красный — опасно.'],
      ['Инсайты', 'Правила находят конкретику: открыт минт, LP не заблокирован, продаж больше покупок, создатель уже запускал монеты.'],
      ['Чёрный список', 'Блокируй монету или создателя. При следующей проверке Reactive сразу предупредит.'],
      ['Точность', 'Оценка — не гарантия. Rag бывает и у чистых монет. Задача — сэкономить время и показать риски, а не решать за тебя.']
    ] : [
      ['Check', 'Paste the address. Reactive queries DexScreener, Rugcheck, GoPlus, GeckoTerminal and Pump.fun in parallel — 1–2 seconds.'],
      ['Score', 'Each block scores 0–100%. They combine into one number. Green — clean, yellow — risky, red — dangerous.'],
      ['Insights', 'Rules surface concrete facts: mint open, LP unlocked, more sells than buys, creator launched tokens before.'],
      ['Blacklist', 'Block a token or a creator. Next check Reactive warns you instantly.'],
      ['Accuracy', 'A score is not a guarantee. Rugs happen to clean tokens too. The goal is to save time and show risks, not decide for you.']
    ];
    const wrap = document.createElement('div');
    wrap.className = 'modal';
    wrap.innerHTML = '<div class="modal-card"><div class="modal-head"><b>' + (ru ? 'Как работает Reactive' : 'How Reactive works') + '</b><button class="modal-x" id="mx">✕</button></div><div class="modal-body">' +
      steps.map(function (s, i) { return '<div class="how-step"><span class="how-n">' + (i + 1) + '</span><div><b>' + esc(s[0]) + '</b><span>' + esc(s[1]) + '</span></div></div>'; }).join('') +
      '</div></div>';
    document.body.appendChild(wrap);
    const close = function () { wrap.remove(); };
    wrap.addEventListener('click', function (e) { if (e.target === wrap) close(); });
    wrap.querySelector('#mx').onclick = close;
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
      '<button class="expl-x" id="bx">✕</button>' +
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
      ['trend', ru ? 'Рынок Solana' : 'Solana market', ru ? 'Топ монет сверху' : 'Top coins on top'],
      ['recent', ru ? 'Недавние проверки' : 'Recent checks', ru ? 'Список под панелью' : 'List under the panel'],
      ['quota', ru ? 'Счётчик лимита' : 'Quota counter', ru ? 'Сколько проверок осталось' : 'Checks left'],
      ['anim', ru ? 'Анимации цифр' : 'Number animations', ru ? 'Скор набегает' : 'Score counts up'],
      ['big', ru ? 'Крупный заголовок' : 'Large title', ru ? 'Большой «Проверь монету»' : 'Big heading']
    ];
    const wrap = document.createElement('div');
    wrap.className = 'modal';
    wrap.innerHTML = '<div class="modal-card sheet-help" style="max-height:80vh">' +
      '<div class="modal-head"><b>' + (ru ? 'Настройки экрана' : 'Screen settings') + '</b><button class="modal-x" id="mx">✕</button></div>' +
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

  function showPaywall() {
    const ru = S.lang === 'ru';
    const isPrem = S.plan === 'premium' && (!S.planUntil || S.planUntil > Date.now());
    const perks = ru ? [
      'Все сети: Solana, Ethereum, BSC, Base, Arbitrum, TON',
      'Без лимита проверок',
      'Топ держателей и похожие тикеры',
      'Полная таблица метрик и все инсайты',
      'Сторож: алерты, когда монета ломается',
      'История создателя: сколько монет запускал'
    ] : [
      'All chains: Solana, Ethereum, BSC, Base, Arbitrum, TON',
      'Unlimited checks',
      'Top holders and similar tickers',
      'Full metrics table and every insight',
      'Watcher: alerts when a token breaks',
      'Creator history: how many tokens launched'
    ];
    const wrap = document.createElement('div');
    wrap.className = 'modal';
    wrap.innerHTML = '<div class="modal-card paywall">' +
      '<div class="pw-head"><button class="pw-x" id="px" aria-label="Close">✕</button></div>' +
      '<h2 class="pw-title">' + (ru ? 'Проверяй быстрее и глубже' : 'Check faster and deeper') + '</h2>' +
      '<p class="pw-sub">' + (ru ? 'Больше источников, все сети, без лимитов и с алертами.' : 'More sources, all chains, no limits, with alerts.') + '</p>' +
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
    const close = function () { wrap.remove(); };
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
      '<div class="modal-head"><b>' + (ru ? 'Что значит каждый блок' : 'What each block means') + '</b><button class="modal-x" id="mx">✕</button></div>' +
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

  /* ---------------- render ---------------- */
  function render() {
    if (!read(K.ob, false)) return viewOnboard();
    document.getElementById('dock').style.display = '';
    try {
      app.innerHTML = S.tab === 'saved' ? viewSaved() : S.tab === 'profile' ? viewProfile() : viewAll();
    } catch (err) {
      showFatal(err);
      return;
    }
    syncDock();
    bind();
    const bar = $('.dial .bar');
    if (bar) requestAnimationFrame(() => { bar.style.strokeDashoffset = bar.dataset.to; });
    decorate();
    try {
      document.querySelectorAll('.cat-v').forEach(function (el) {
        const to = parseInt(el.textContent, 10) || 0;
        const suffix = '<i>%</i>';
        countUp(el, to, 500, suffix);
      });
      countUp(document.querySelector('.tk-score b'), S.result ? S.result.score : 0, 600);
      countUp(document.querySelector('.gauge-mid b'), S.result ? S.result.score : 0, 600);
    } catch (e) {}
    const en = document.getElementById('infoMore');
    if (en) en.addEventListener('click', function () { hang(); });
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

  async function refreshLive() {
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
            s.liq = liq; s.ch24 = ch; s.price = price; s.at = Date.now(); changed = true;
          }
        });
        if (changed) { write(K.saved, S.saved); render(); }
      }
      if (S.result && S.tab === 'scan') {
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
    document.querySelectorAll('.dbtn, .dscan').forEach((b) => b.classList.toggle('on', b.dataset.tab === S.tab));
    const l1 = document.querySelector('[data-label="saved"]');
    const l2 = document.querySelector('[data-label="profile"]');
    if (l1) l1.textContent = t('savedTab');
    if (l2) l2.textContent = t('profileTab');
  }

  function bind() { try { bindInner(); } catch (e) { console.warn(e); } }
  function bindInner() {
    const trendRow = $('#trendRow');
    if (trendRow) {
      loadTrending().then(function (items) {
        if (!items || !items.length) { const t = $('#trend'); if (t) t.remove(); return; }
        trendRow.innerHTML = items.map(function (x) {
          const up = x.ch >= 0;
          const c = up ? 'var(--green)' : 'var(--red)';
          return '<button class="tr-chip ' + (up ? 'up' : 'down') + '" data-mint="' + esc(x.mint) + '">' +
            '<span class="tr-sym">' + esc(x.symbol) + '</span>' +
            '<span class="tr-pct">' + (up ? '▲' : '▼') + ' ' + Math.abs(x.ch).toFixed(1) + '%</span></button>';
        }).join('');
        trendRow.querySelectorAll('.tr-chip').forEach(function (b) {
          b.onclick = function () {
            const inp = $('#mint');
            if (inp) inp.value = b.dataset.mint;
            S.lastMint = b.dataset.mint;
            const go = $('#go');
            if (go) go.click(); else runCheck();
          };
        });
      });
    }
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
      const tgClipboard = () => new Promise((resolve) => {
        if (!TG || typeof TG.readTextFromClipboard !== 'function') return resolve('');
        try {
          TG.readTextFromClipboard(function (text) { resolve(String(text || '')); });
        } catch (e) { resolve(''); }
      });

      const tryPaste = async () => {
        // 1) Telegram native clipboard (no permission prompt)
        let txt = await tgClipboard();
        // 2) browser clipboard
        if (!txt) {
          try { txt = await navigator.clipboard.readText(); } catch (e) {}
        }
        txt = String(txt || '').trim();
        if (!txt) return false;
        input.value = txt;
        haptic();
        // auto-run the check right away when it looks like a Solana address
        if (isAddr(txt)) setTimeout(runCheck, 120);
        return true;
      };
      $('#paste').onclick = async () => {
        if (await tryPaste()) return;
        // fallback: native paste via execCommand into focused field
        try {
          input.focus();
          const ok = document.execCommand && document.execCommand('paste');
          if (ok) { haptic(); return; }
        } catch (e) {}
        input.focus();
        const oldHint = document.querySelector('.paste-hint');
        if (oldHint) oldHint.remove();
        const hint = document.createElement('div');
        hint.className = 'paste-hint';
        hint.innerHTML = (S.lang === 'ru'
          ? 'Браузер не дал доступ к буферу. Нажми в поле и удерживай — появится <b>«Вставить»</b>.'
          : 'Browser blocked clipboard access. Press and hold the field and tap <b>Paste</b>.');
        input.parentElement.insertAdjacentElement('afterend', hint);
        setTimeout(function () { hint.remove(); }, 5000);
      };
    }
    if ($('#go')) $('#go').onclick = runCheck;
    if ($('#save')) $('#save').onclick = () => {
      const btn = $('#save');
      if (btn) { btn.classList.add('saved'); btn.textContent = (S.lang === 'ru' ? 'Сохранено' : 'Saved'); }
      const r = S.result; if (!r) return;
      const item = { mint: r.token.mint, symbol: r.token.symbol, image: r.token.image, liq: r.token.liq, price: r.token.price, ch24: r.token.ch24, score: r.score, at: Date.now() };
      S.saved = [item].concat(S.saved.filter((x) => x.mint !== item.mint)).slice(0, 60);
      write(K.saved, S.saved); haptic('ok'); toast(t('savedToast'));
    };
    if ($('#open')) $('#open').onclick = () => { const u = S.result && S.result.token.url; if (u) window.open(u, '_blank'); };

    document.querySelectorAll('.block-head').forEach((b) => b.onclick = () => b.parentElement.classList.toggle('open'));
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
      S.tab = 'scan'; S.lastMint = it.dataset.mint; S.result = null; render(); setTimeout(runCheck, 80);
    });
    if ($('#plan')) $('#plan').onclick = showPaywall;
    document.querySelectorAll('#lockIns, #lockHold').forEach(function (b) { b.onclick = showPaywall; });
    if ($('#notify')) $('#notify').onclick = function () { S.notify = !S.notify; write('tc.notify', S.notify); render(); };
    if ($('#auto')) $('#auto').onclick = function () { S.autoUpd = S.autoUpd === false; write('tc.auto', S.autoUpd); render(); };
    if ($('#hide')) $('#hide').onclick = function () { S.hideMoney = !S.hideMoney; write('tc.hide', S.hideMoney); render(); };
    if ($('#cache')) $('#cache').onclick = function () { try { localStorage.clear(); } catch (e) {} toast(S.lang === 'ru' ? 'Кэш очищен' : 'Cache cleared'); };
    if ($('#lang')) $('#lang').onclick = () => { S.lang = S.lang === 'ru' ? 'en' : 'ru'; write(K.lang, S.lang); render(); };
    if ($('#clear')) $('#clear').onclick = () => { S.saved = []; write(K.saved, []); render(); toast(t('cleared')); };
    const more = $('#infoMore');
    if (more) more.onclick = function () {
      const box = $('#infoExtra');
      const open = box.classList.toggle('open');
      more.classList.toggle('open', open);
      haptic();
      if (open && S.result && !S.result.token.gtReserve) {
        loadGecko(S.result.token.mint).then(function (d) {
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
    document.querySelectorAll('.cat').forEach(function (el) {
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

  async function runCheck() {
    const input = $('#mint');
    const mint = (input && input.value || '').trim();
    if (/^0x[0-9a-fA-F]{40}$/.test(mint)) {
      S.error = (S.lang === 'ru'
        ? 'Это адрес EVM-сети (ETH/BSC/Base). Сейчас Reactive проверяет только Solana — другие сети будут в Premium.'
        : 'This is an EVM address. Reactive checks Solana for now; other chains come with Premium.');
      render(); haptic('err'); return;
    }
    if (!isAddr(mint)) { S.error = t('errAddr'); render(); haptic('err'); return; }
    // anti-script: burst detection
    const nowTs = Date.now();
    if (nowTs < abuse.cooldownUntil) {
      const left = Math.ceil((abuse.cooldownUntil - nowTs) / 1000);
      S.error = S.lang === 'ru' ? 'Слишком часто. Подожди ' + left + ' с.' : 'Too fast. Wait ' + left + 's.';
      render(); haptic('err'); return;
    }
    abuse.stamps = abuse.stamps.filter(function (t) { return nowTs - t < BURST_WINDOW; });
    abuse.stamps.push(nowTs);
    if (abuse.stamps.length > BURST_LIMIT) {
      abuse.cooldownUntil = nowTs + 60000;
      S.error = S.lang === 'ru' ? 'Похоже на автоматические запросы. Пауза 60 секунд.' : 'Automated requests detected. 60s cooldown.';
      render(); haptic('err'); return;
    }
    // min interval between checks
    const lastCheck = (S.stats.lastCheckAt || 0);
    const minGap = S.plan === 'premium' ? MIN_INTERVAL_PREM : MIN_INTERVAL_FREE;
    if (nowTs - lastCheck < minGap) {
      const left = Math.ceil((minGap - (nowTs - lastCheck)) / 1000);
      S.error = S.lang === 'ru' ? 'Подожди ' + left + ' с перед следующей проверкой.' : 'Wait ' + left + 's before the next check.';
      render(); haptic('err'); return;
    }
    // per-mint cache
    const cached = abuse.cache[mint];
    if (cached && nowTs - cached.at < CACHE_TTL) {
      S.result = cached.result;
      S.stats.lastCheckAt = nowTs;
      render();
      return;
    }
    if (quotaBlocked()) {
      const L = quotaLeft();
      S.error = (S.lang === 'ru'
        ? 'Лимит бесплатных проверок исчерпан. Сброс через ' + L.resetMin + ' мин. Premium снимает лимит.'
        : 'Free checks limit reached. Resets in ' + L.resetMin + ' min. Premium removes the limit.');
      render(); haptic('err'); return;
    }
    S.busy = true; S.error = ''; S.lastMint = mint; render();
    try {
      const fast = await loadFast(mint);
      if (fast.dex) {
        S.result = scoreToken(fast);
        S.result.partial = true;
        S.updatedAt = Date.now();
        render();
      }
      const raw = await loadSlow(mint, fast);
      if (!bestPair(raw.dex) && !raw.rug) throw new Error(t('notFound'));
      S.result = scoreToken(raw);
      S.updatedAt = Date.now();
      if (S.result.blocks.length < 3) S.error = t('fewData');
      S.stats.scans = (S.stats.scans || 0) + 1; write(K.stats, S.stats);
      quotaConsume();
      S.stats.lastCheckAt = Date.now();
      abuse.cache[mint] = { at: Date.now(), result: S.result };
      write(K.stats, S.stats);
      haptic('ok');
    } catch (e) {
      S.error = t('fail') + (e && e.message ? e.message : '');
      haptic('err');
    }
    S.busy = false; render();
  }

  /* ---------------- boot ---------------- */
  S.lang = detectLang();
  if (IS_DESKTOP) document.documentElement.classList.add('desktop');
  if (TG) {
    try {
      TG.ready();
      document.documentElement.style.setProperty('--top-inset', TG.isFullscreen ? '58px' : '4px');
      if (!IS_DESKTOP) {
        TG.expand();
        if (TG.requestFullscreen) TG.requestFullscreen();
        if (TG.lockOrientation) TG.lockOrientation();
        if (TG.disableVerticalSwipes) TG.disableVerticalSwipes();
      }
      if (TG.setHeaderColor) TG.setHeaderColor('#141416');
      if (TG.setBottomBarColor) TG.setBottomBarColor('#000000');
    } catch (e) {}
    try {
      const onFs = () => document.documentElement.style.setProperty('--fs', TG.isFullscreen ? '1' : '0');
      if (TG.onEvent) TG.onEvent('fullscreenChanged', onFs);
      if (TG.onEvent) TG.onEvent('viewportChanged', () => { if (TG.expand) TG.expand(); document.documentElement.style.setProperty('--top-inset', TG.isFullscreen ? '58px' : '4px'); });
      onFs();
    } catch (e) {}
  }
  function ensureFullscreen() {
    if (!TG || IS_DESKTOP) return;
    try { if (!TG.isFullscreen && TG.requestFullscreen) TG.requestFullscreen(); } catch (e) {}
    try { if (TG.expand) TG.expand(); } catch (e) {}
  }
  document.addEventListener('pointerdown', ensureFullscreen, { once: false });
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-tab]');
    if (!btn) return;
    S.tab = btn.dataset.tab;
    haptic(); render();
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
      const inp = document.getElementById('mint');
      if (!inp) return;
      inp.value = txt;
      S.lastMint = txt;
      const ph = document.querySelector('.paste-hint');
      if (ph) ph.remove();
      const hint = document.createElement('div');
      hint.className = 'paste-hint';
      hint.innerHTML = (S.lang === 'ru' ? 'Адрес из буфера: <b>' + txt.slice(0, 6) + '…' + ' Нажми «Проверить».' : 'Clipboard address detected — tap Check.');
      inp.parentElement.insertAdjacentElement('afterend', hint);
      setTimeout(function () { hint.remove(); }, 6000);
    } catch (e) {}
  }, 400);

  setInterval(refreshLive, 45000);
  setInterval(function () { if (S.tab === 'scan' && S.result && !S.busy) refreshLive(); }, 25000);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) refreshLive(); });

  try { render(); } catch (e) { showFatal(e); }
})();
