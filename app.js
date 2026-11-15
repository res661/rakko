/* Token check — one tap score */
(function () {
  'use strict';

  const TG = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
  const K = {
    ob: 'tc.onboard.v1', saved: 'tc.saved.v1', stats: 'tc.stats.v1',
    theme: 'tc.theme.v1', lang: 'tc.lang.v1'
  };

  const S = {
    tab: 'scan',
    saved: read(K.saved, []),
    stats: read(K.stats, { scans: 0 }),
    theme: read(K.theme, 'auto'),
    lang: null,
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
      obCardK: 'ОЦЕНКА', obCardS: 'из 8 блоков'
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
      obCardK: 'SCORE', obCardS: 'across 8 blocks'
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
    if (TG && TG.setHeaderColor) { try { TG.setHeaderColor(dark ? '#000000' : '#f5f5f7'); } catch (e) {} }
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
  async function loadRaw(mint) {
    const out = { mint: mint, dex: null, rug: null };
    await Promise.all([
      getJson('https://api.dexscreener.com/latest/dex/tokens/' + encodeURIComponent(mint)).then((d) => { out.dex = d; }).catch(() => {}),
      getJson('https://api.rugcheck.xyz/v1/tokens/' + encodeURIComponent(mint) + '/report').then((d) => { out.rug = d; }).catch(() => {})
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
      if (ratio < 0.03) s *= 0.65;
      b.push({ k: 'liq', w: 20, s, info: usd(liq) + (fdv ? ' · ' + Math.round(ratio * 100) + '% of FDV' : '') });
    }

    const holders = rug.topHolders || [];
    const totalH = Number(rug.totalHolders) || 0;
    if (holders.length || totalH) {
      const top10 = holders.slice(0, 10).reduce((a, h) => a + (Number(h.pct) || 0), 0);
      let s = top10 > 80 ? 0.05 : top10 > 60 ? 0.25 : top10 > 45 ? 0.5 : top10 > 30 ? 0.75 : 0.9;
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
      const s = turn < 0.2 ? 0.25 : turn < 0.6 ? 0.55 : turn < 2 ? 0.85 : turn < 6 ? 1 : 0.6;
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
        url: (pair && pair.url) || ''
      },
      at: Date.now()
    };
  }

  /* ---------------- ui parts ---------------- */
  const ICON_CHEV = '<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>';
  const ICON_EMPTY = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7.5 12 4l8 3.5v9L12 20l-8-3.5z"/><path d="M4 7.5 12 11l8-3.5M12 11v9"/></svg>';

  function top(title) {
    return '<header class="top"><h1>' + esc(title) + '</h1><div class="spacer"></div></header>';
  }
  function verdict(score) {
    if (score >= 70) return { cls: 'good', label: t('good') };
    if (score >= 40) return { cls: 'mid', label: t('mid') };
    return { cls: 'bad', label: t('bad') };
  }
  function dial(score) {
    const v = verdict(score);
    const color = v.cls === 'good' ? 'var(--green)' : v.cls === 'mid' ? 'var(--yellow)' : 'var(--red)';
    const r = 96, c = 2 * Math.PI * r, off = c * (1 - score / 100);
    return '<div class="score-view"><div class="dial" style="color:' + color + '">' +
      '<svg width="230" height="230" viewBox="0 0 230 230">' +
      '<circle class="trk" cx="115" cy="115" r="' + r + '" fill="none" stroke-width="10"/>' +
      '<circle class="bar" cx="115" cy="115" r="' + r + '" fill="none" stroke-width="10" stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + c.toFixed(1) + '" data-to="' + off.toFixed(1) + '"/>' +
      '</svg><div class="mid"><b>' + score + '</b><span>' + t('of100') + '</span></div></div>' +
      '<div class="verdict ' + v.cls + '">' + v.label + '</div></div>';
  }

  /* ---------------- views ---------------- */
  function viewScan() {
    if (S.result) return viewResult();
    return top(t('checkTab')) +
      '<div class="page">' +
      '<h1 class="display">' + t('pasteTitle').replace(/\n/g, '<br>') + '</h1>' +
      '<p class="lead">' + esc(t('pasteSub')) + '</p>' +
      '<div class="field"><input id="mint" placeholder="' + esc(t('ph')) + '" autocomplete="off" spellcheck="false"><button class="icon-pill" id="paste">' + esc(t('paste')) + '</button></div>' +
      '<div style="height:14px"></div>' +
      '<button class="btn" id="go">' + (S.busy ? '<span class="spinner"></span>' : esc(t('check'))) + '</button>' +
      (S.error ? '<p class="err">' + esc(S.error) + '</p>' : '') +
      '<div style="height:22px"></div>' +
      '<p class="eyebrow">' + esc(t('howTitle')) + '</p>' +
      '<p class="tiny" style="margin-top:6px">' + esc(t('how')) + '</p>' +
      '</div>';
  }

  function viewResult() {
    const r = S.result, tk = r.token;
    const blocks = r.blocks.map((x) => {
      const color = x.s >= 0.7 ? 'var(--green)' : x.s >= 0.4 ? 'var(--yellow)' : 'var(--red)';
      return '<div class="block">' +
        '<button class="block-head"><span class="dot" style="background:' + color + '"></span>' +
        '<span>' + esc(t(x.k)) + '</span>' +
        '<span class="val" style="color:' + color + '">' + Math.round(x.s * 100) + '</span>' + ICON_CHEV + '</button>' +
        '<div class="block-body"><div class="bar" style="color:' + color + '"><i style="width:' + Math.round(x.s * 100) + '%"></i></div>' + esc(x.info) + '</div></div>';
    }).join('');

    return top(t('result')) +
      '<div class="page">' +
      dial(r.score) +
      '<div class="token-line" style="text-align:center"><b>' + esc(tk.symbol) + '</b>' + (tk.name ? ' · ' + esc(tk.name) : '') + '</div>' +
      '<div class="metrics">' +
      '<div class="metric"><b>' + price(tk.price) + '</b><span>' + esc(t('priceL')) + '</span></div>' +
      '<div class="metric"><b>' + usd(tk.liq) + '</b><span>' + esc(t('liqL')) + '</span></div>' +
      '<div class="metric"><b>' + usd(tk.vol) + '</b><span>' + esc(t('volL')) + '</span></div>' +
      '</div>' +
      '<div style="height:22px"></div>' +
      '<p class="eyebrow" style="margin-bottom:8px">' + esc(t('why')) + '</p>' +
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
      return top(t('savedTab')) + '<div class="page"><div class="empty"><div class="ring">' + ICON_EMPTY + '</div><b>' + esc(t('emptyTitle')) + '</b>' + esc(t('emptyText')) + '</div></div>';
    }
    const items = S.saved.map((s) => {
      const v = verdict(s.score);
      const color = v.cls === 'good' ? 'var(--green)' : v.cls === 'mid' ? 'var(--yellow)' : 'var(--red)';
      return '<button class="item" data-mint="' + esc(s.mint) + '">' +
        '<span class="ava">' + (s.image ? '<img src="' + esc(s.image) + '" alt="">' : esc(s.symbol.slice(0, 2))) + '</span>' +
        '<span class="meta"><b>' + esc(s.symbol) + '</b><span>' + usd(s.liq) + '</span></span>' +
        '<span class="num" style="color:' + color + '">' + s.score + '</span></button>';
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
      '<button class="set-row" id="theme">' + esc(t('theme')) + '<span class="val">' + esc(themeLabel) + '</span></button>' +
      '<button class="set-row" id="lang">' + esc(t('langRow')) + '<span class="val">' + (S.lang === 'ru' ? 'Русский' : 'English') + '</span></button>' +
      '<button class="set-row" id="clear">' + esc(t('clear')) + '</button>' +
      '</div>' +
      '<p class="tiny" style="margin-top:18px">' + esc(t('about')) + '</p>' +
      '</div>';
  }

  function viewOnboard() {
    const slides = [
      { t: t('ob1t'), p: t('ob1p'), v: '82', s: t('obCardS') },
      { t: t('ob2t'), p: t('ob2p'), v: '8', s: t('obCardS') },
      { t: t('ob3t'), p: t('ob3p'), v: '12', s: t('obCardS') }
    ];
    let i = 0;
    document.getElementById('dock').style.display = 'none';
    app.innerHTML = '<div class="ob"><div class="ob-top"><button class="ob-skip" id="obSkip">' + esc(t('skip')) + '</button></div>' +
      '<div class="ob-art"><span class="halo"></span><div class="ob-card"><div class="k">' + esc(t('obCardK')) + '</div><div class="v" id="obV"></div><div class="s" id="obS"></div></div></div>' +
      '<div class="ob-body"><h1 id="obT"></h1><p id="obP"></p></div>' +
      '<div class="ob-dots" id="obD"></div>' +
      '<div class="ob-foot"><button class="btn" id="obNext">' + esc(t('next')) + '</button></div></div>';
    const paint = () => {
      $('#obT').innerHTML = slides[i].t.replace(/\n/g, '<br>');
      $('#obP').textContent = slides[i].p;
      $('#obV').textContent = slides[i].v;
      $('#obS').textContent = slides[i].s;
      $('#obD').innerHTML = slides.map((_, k) => '<i' + (k === i ? ' class="on"' : '') + '></i>').join('');
      $('#obNext').textContent = i === slides.length - 1 ? t('start') : t('next');
    };
    const done = () => { write(K.ob, true); render(); };
    $('#obNext').onclick = () => { haptic(); if (i < slides.length - 1) { i++; paint(); } else done(); };
    $('#obSkip').onclick = done;
    paint();
  }

  /* ---------------- render ---------------- */
  function render() {
    applyTheme();
    if (!read(K.ob, false)) return viewOnboard();
    document.getElementById('dock').style.display = '';
    app.innerHTML = S.tab === 'saved' ? viewSaved() : S.tab === 'profile' ? viewProfile() : viewScan();
    syncDock();
    bind();
    const bar = $('.dial .bar');
    if (bar) requestAnimationFrame(() => { bar.style.strokeDashoffset = bar.dataset.to; });
  }

  function syncDock() {
    document.querySelectorAll('.dbtn').forEach((b) => b.classList.toggle('on', b.dataset.tab === S.tab));
    const l1 = document.querySelector('[data-label="saved"]');
    const l2 = document.querySelector('[data-label="profile"]');
    if (l1) l1.textContent = t('savedTab');
    if (l2) l2.textContent = t('profileTab');
  }

  function bind() {
    if ($('#mint')) {
      const input = $('#mint');
      if (S.lastMint) input.value = S.lastMint;
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') runCheck(); });
      $('#paste').onclick = async () => {
        try { const txt = await navigator.clipboard.readText(); if (txt) { input.value = txt.trim(); haptic(); } }
        catch (e) { toast(t('noClip')); }
      };
    }
    if ($('#go')) $('#go').onclick = runCheck;
    if ($('#save')) $('#save').onclick = () => {
      const r = S.result; if (!r) return;
      const item = { mint: r.token.mint, symbol: r.token.symbol, image: r.token.image, liq: r.token.liq, score: r.score, at: r.at };
      S.saved = [item].concat(S.saved.filter((x) => x.mint !== item.mint)).slice(0, 60);
      write(K.saved, S.saved); haptic('ok'); toast(t('savedToast'));
    };
    if ($('#open')) $('#open').onclick = () => { const u = S.result && S.result.token.url; if (u) window.open(u, '_blank'); };
    if ($('#again')) $('#again').onclick = () => { S.result = null; S.error = ''; render(); };
    document.querySelectorAll('.block-head').forEach((b) => b.onclick = () => b.parentElement.classList.toggle('open'));
    document.querySelectorAll('.item').forEach((it) => it.onclick = () => {
      S.tab = 'scan'; S.lastMint = it.dataset.mint; S.result = null; render(); setTimeout(runCheck, 80);
    });
    if ($('#theme')) $('#theme').onclick = () => {
      S.theme = S.theme === 'auto' ? 'dark' : S.theme === 'dark' ? 'light' : 'auto';
      write(K.theme, S.theme); render();
    };
    if ($('#lang')) $('#lang').onclick = () => { S.lang = S.lang === 'ru' ? 'en' : 'ru'; write(K.lang, S.lang); render(); };
    if ($('#clear')) $('#clear').onclick = () => { S.saved = []; write(K.saved, []); render(); toast(t('cleared')); };
  }

  async function runCheck() {
    const input = $('#mint');
    const mint = (input && input.value || '').trim();
    if (!isAddr(mint)) { S.error = t('errAddr'); render(); haptic('err'); return; }
    S.busy = true; S.error = ''; S.lastMint = mint; render();
    try {
      const raw = await loadRaw(mint);
      if (!bestPair(raw.dex) && !raw.rug) throw new Error(t('notFound'));
      S.result = scoreToken(raw);
      if (S.result.blocks.length < 3) S.error = t('fewData');
      S.stats.scans = (S.stats.scans || 0) + 1; write(K.stats, S.stats);
      haptic('ok');
    } catch (e) {
      S.error = t('fail') + (e && e.message ? e.message : '');
      haptic('err');
    }
    S.busy = false; render();
  }

  /* ---------------- boot ---------------- */
  S.lang = detectLang();
  if (TG) {
    try {
      TG.ready();
      TG.expand();
      if (TG.requestFullscreen) TG.requestFullscreen();
      if (TG.lockOrientation) TG.lockOrientation();
      if (TG.disableVerticalSwipes) TG.disableVerticalSwipes();
      if (TG.setHeaderColor) TG.setHeaderColor('#000000');
      if (TG.setBottomBarColor) TG.setBottomBarColor('#000000');
      if (TG.enableClosingConfirmation) { /* no-op: keep swipe close */ }
    } catch (e) {}
    try {
      const onFs = () => document.documentElement.style.setProperty('--fs', TG.isFullscreen ? '1' : '0');
      if (TG.onEvent) TG.onEvent('fullscreenChanged', onFs);
      if (TG.onEvent) TG.onEvent('viewportChanged', () => { if (TG.expand) TG.expand(); });
      onFs();
    } catch (e) {}
  }
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-tab]');
    if (!btn) return;
    S.tab = btn.dataset.tab;
    if (S.tab !== 'scan') S.result = null;
    haptic(); render();
  });
  render();
})();
