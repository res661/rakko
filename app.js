/* Rakko — проба мемкоина */
(function () {
  'use strict';

  const TG = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
  const LS = {
    onboard: 'rakko.onboard.v1',
    saved: 'rakko.saved.v1',
    stats: 'rakko.stats.v1',
    theme: 'rakko.theme.v1'
  };

  const state = {
    tab: 'scan',
    saved: read(LS.saved, []),
    stats: read(LS.stats, { scans: 0 }),
    theme: read(LS.theme, 'auto'),
    result: null,
    busy: false,
    error: ''
  };

  /* ---------------- storage ---------------- */
  function read(key, fallback) {
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch (e) { return fallback; }
  }
  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
  }

  /* ---------------- helpers ---------------- */
  const $ = (sel, root) => (root || document).querySelector(sel);
  const el = document.getElementById('app');
  const fmtUsd = (n) => {
    n = Number(n);
    if (!isFinite(n) || n <= 0) return '—';
    if (n >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
    if (n >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M';
    if (n >= 1e3) return '$' + (n / 1e3).toFixed(1) + 'K';
    return '$' + n.toFixed(2);
  };
  const fmtNum = (n) => {
    n = Number(n);
    if (!isFinite(n)) return '—';
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    return String(n);
  };
  const pct = (n) => (isFinite(Number(n)) ? (Number(n) >= 0 ? '+' : '') + Number(n).toFixed(1) + '%' : '—');
  const clamp01 = (n) => Math.max(0, Math.min(1, n));
  const toast = (msg) => {
    let t = $('.toast');
    if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
    t.textContent = msg;
    requestAnimationFrame(() => t.classList.add('show'));
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove('show'), 2200);
  };
  const haptic = (type) => {
    try {
      if (!TG || !TG.HapticFeedback) return;
      if (type === 'ok') TG.HapticFeedback.notificationOccurred('success');
      else if (type === 'err') TG.HapticFeedback.notificationOccurred('error');
      else TG.HapticFeedback.impactOccurred('light');
    } catch (e) {}
  };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------------- theme ---------------- */
  function applyTheme() {
    const t = state.theme;
    const dark = t === 'dark' || (t === 'auto' && (!TG || TG.colorScheme !== 'light'));
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
    if (TG && TG.setHeaderColor) { try { TG.setHeaderColor(dark ? '#0b0b0d' : '#f2f3f6'); } catch (e) {} }
  }

  /* ---------------- data ---------------- */
  async function fetchJson(url, ms) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), ms || 6000);
    try {
      const res = await fetch(url, { signal: ctrl.signal, headers: { accept: 'application/json' } });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return await res.json();
    } finally { clearTimeout(timer); }
  }

  function isAddress(s) { return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(String(s || '').trim()); }

  async function loadToken(mint) {
    const out = { mint: mint, dex: null, rug: null, errors: [] };
    const dexPromise = fetchJson('https://api.dexscreener.com/latest/dex/tokens/' + encodeURIComponent(mint))
      .then((d) => { out.dex = d; }).catch((e) => out.errors.push('dex'));
    const rugPromise = fetchJson('https://api.rugcheck.xyz/v1/tokens/' + encodeURIComponent(mint) + '/report/summary')
      .then((d) => { out.rug = d; }).catch(() => fetchJson('https://api.rugcheck.xyz/v1/tokens/' + encodeURIComponent(mint) + '/report')
        .then((d) => { out.rug = d; }).catch((e) => out.errors.push('rug')));
    await Promise.all([dexPromise, rugPromise]);
    return out;
  }

  function pickPair(dex) {
    const pairs = (dex && dex.pairs) || [];
    if (!pairs.length) return null;
    return pairs.slice().sort((a, b) => (Number(b.liquidity && b.liquidity.usd) || 0) - (Number(a.liquidity && a.liquidity.usd) || 0))[0];
  }

  /* ---------------- score ---------------- */
  function buildScore(raw) {
    const pair = pickPair(raw.dex);
    const rug = raw.rug || {};
    const blocks = [];

    const liq = Number(pair && pair.liquidity && pair.liquidity.usd) || 0;
    const fdv = Number(pair && pair.fdv) || Number(pair && pair.marketCap) || 0;
    const vol24 = Number(pair && pair.volume && pair.volume.h24) || 0;

    // 1. ликвидность (20)
    if (liq > 0) {
      let s;
      if (liq < 15000) s = 0.1;
      else if (liq < 40000) s = 0.4;
      else if (liq < 120000) s = 0.7;
      else if (liq < 400000) s = 0.9;
      else s = 1;
      const ratio = fdv > 0 ? liq / fdv : 1;
      if (ratio < 0.03) s *= 0.7; else if (ratio > 0.15) s = Math.min(1, s * 1.05);
      blocks.push({ key: 'liq', icon: '💧', title: 'Ликвидность', w: 20, s: clamp01(s), info: fmtUsd(liq) + (fdv ? ' · ' + Math.round(ratio * 100) + '% от FDV' : '') });
    }

    // 2. распределение (15)
    const holders = rug.topHolders || [];
    const totalHolders = Number(rug.totalHolders) || 0;
    if (holders.length || totalHolders) {
      const top10 = holders.slice(0, 10).reduce((a, h) => a + (Number(h.pct) || 0), 0);
      let s = 0.85;
      if (top10 > 80) s = 0.05; else if (top10 > 60) s = 0.25; else if (top10 > 45) s = 0.5; else if (top10 > 30) s = 0.75;
      if (totalHolders && totalHolders < 100) s *= 0.55; else if (totalHolders > 3000) s = Math.min(1, s * 1.08);
      blocks.push({ key: 'holders', icon: '👥', title: 'Распределение', w: 15, s: clamp01(s), info: (totalHolders ? fmtNum(totalHolders) + ' холдеров · ' : '') + 'топ-10 ' + Math.round(top10) + '%' });
    }

    // 3. дев и бандлы (20) — по рискам Rugcheck
    const risks = (rug.risks || []).map((r) => ({ name: String(r.name || ''), level: String(r.level || r.score || ''), value: r.value }));
    const rugScore = Number(rug.score_normalised);
    if (risks.length || isFinite(rugScore)) {
      let s = isFinite(rugScore) ? clamp01(1 - rugScore / 100) : 0.6;
      const bad = risks.filter((r) => /danger|high/i.test(r.level)).length;
      const warn = risks.filter((r) => /warn|medium/i.test(r.level)).length;
      s = clamp01(s - bad * 0.18 - warn * 0.07);
      const names = risks.filter((r) => /danger|high/i.test(r.level)).map((r) => r.name).slice(0, 2);
      blocks.push({ key: 'dev', icon: '🕵️', title: 'Дев и бандлы', w: 20, s: s, info: names.length ? names.join(', ') : (bad ? 'найдены риски' : 'критичных рисков нет') });
    }

    // 4. контракт (15)
    const mintAuth = rug.mintAuthority;
    const freezeAuth = rug.freezeAuthority;
    if (mintAuth !== undefined || freezeAuth !== undefined) {
      let s = 1;
      const notes = [];
      if (mintAuth) { s -= 0.5; notes.push('минт открыт'); }
      if (freezeAuth) { s -= 0.35; notes.push('заморозка'); }
      blocks.push({ key: 'contract', icon: '📄', title: 'Контракт', w: 15, s: clamp01(s), info: notes.length ? notes.join(', ') : 'полномочия отозваны' });
    }

    // 5. активность (10)
    if (vol24 > 0 || liq > 0) {
      const turnover = liq > 0 ? vol24 / liq : 0;
      let s;
      if (turnover < 0.2) s = 0.25; else if (turnover < 0.6) s = 0.55; else if (turnover < 2) s = 0.85; else if (turnover < 6) s = 1; else s = 0.6;
      blocks.push({ key: 'activity', icon: '📈', title: 'Активность', w: 10, s: clamp01(s), info: fmtUsd(vol24) + ' за 24ч' + (turnover ? ' · оборот ×' + turnover.toFixed(1) : '') });
    }

    // 6. возраст (10)
    const created = Number(pair && pair.pairCreatedAt) || 0;
    if (created > 0) {
      const hours = (Date.now() - created) / 36e5;
      let s;
      if (hours < 1) s = 0.15; else if (hours < 6) s = 0.35; else if (hours < 24) s = 0.6; else if (hours < 72) s = 0.8; else s = 1;
      const ageTxt = hours < 1 ? Math.round(hours * 60) + ' мин' : hours < 48 ? Math.round(hours) + ' ч' : Math.round(hours / 24) + ' дн';
      blocks.push({ key: 'age', icon: '⏳', title: 'Возраст', w: 10, s: s, info: 'пара живёт ' + ageTxt });
    }

    // 7. структура цены (5)
    const ch24 = Number(pair && pair.priceChange && pair.priceChange.h24);
    if (isFinite(ch24)) {
      let s = ch24 > -25 ? 0.8 : ch24 > -50 ? 0.5 : ch24 > -75 ? 0.25 : 0.1;
      if (ch24 > 400) s -= 0.3;
      blocks.push({ key: 'price', icon: '🎢', title: 'Цена за 24ч', w: 5, s: clamp01(s), info: pct(ch24) });
    }

    // 8. соцсети (5)
    const info = (pair && pair.info) || {};
    const socials = (info.socials || []).length + (info.websites || []).length;
    if (pair) {
      const s = socials >= 2 ? 1 : socials === 1 ? 0.6 : 0.15;
      blocks.push({ key: 'social', icon: '🔗', title: 'Ссылки', w: 5, s: s, info: socials ? socials + ' ссылок' : 'нет соцсетей' });
    }

    const totalW = blocks.reduce((a, b) => a + b.w, 0);
    const score = totalW ? Math.round(blocks.reduce((a, b) => a + b.s * b.w, 0) / totalW * 100) : 0;

    const worst = blocks.slice().sort((a, b) => a.s - b.s).filter((b) => b.s < 0.6).slice(0, 3);
    const reasons = (worst.length ? worst : blocks.slice().sort((a, b) => a.s - b.s).slice(0, 2)).map((b) => b.title + ': ' + b.info);

    return {
      score: score,
      blocks: blocks,
      reasons: reasons,
      token: {
        mint: raw.mint,
        symbol: (pair && pair.baseToken && pair.baseToken.symbol) || 'TOKEN',
        name: (pair && pair.baseToken && pair.baseToken.name) || '',
        image: (info.imageUrl) || '',
        price: Number(pair && pair.priceUsd) || 0,
        liq: liq, fdv: fdv, vol24: vol24, ch24: ch24,
        dex: (pair && pair.dexId) || '', url: (pair && pair.url) || ''
      },
      at: Date.now()
    };
  }

  /* ---------------- views ---------------- */
  function topBar(title, brandIcon) {
    return '<header class="top"><span class="brand">' + (brandIcon || '🦝') + '</span><h1>' + esc(title) + '</h1></header>';
  }

  function verdictOf(score) {
    if (score >= 70) return { cls: 'good', text: 'Выглядит чисто', mascot: '🦝' };
    if (score >= 40) return { cls: 'mid', text: 'Рискованно', mascot: '🤨' };
    return { cls: 'bad', text: 'Опасно', mascot: '😾' };
  }

  function ringHtml(score) {
    const r = 92, c = 2 * Math.PI * r;
    const off = c * (1 - score / 100);
    const v = verdictOf(score);
    const color = v.cls === 'good' ? 'var(--green)' : v.cls === 'mid' ? 'var(--yellow)' : 'var(--red)';
    return '<div class="score-wrap"><div class="ring" style="color:' + color + '">' +
      '<svg width="208" height="208" viewBox="0 0 208 208">' +
      '<circle class="track" cx="104" cy="104" r="' + r + '" fill="none" stroke-width="14"/>' +
      '<circle class="val" cx="104" cy="104" r="' + r + '" fill="none" stroke-width="14" stroke-dasharray="' + c + '" stroke-dashoffset="' + c + '" data-off="' + off + '"/>' +
      '</svg><div class="ring-mid"><b>' + score + '</b><span>из 100</span></div></div>' +
      '<div class="verdict ' + v.cls + '">' + v.mascot + ' ' + v.text + '</div></div>';
  }

  function scanView() {
    if (state.result) return resultView();
    return topBar('Проверка монеты') +
      '<div class="page">' +
      '<div class="card">' +
      '<h2>Вставь адрес монеты</h2>' +
      '<p class="small muted">Rakko проверит ликвидность, холдеров, дев-кошелёк, контракт и активность. Одна кнопка — оценка от 0 до 100.</p>' +
      '<div class="field"><input id="mint" placeholder="Адрес контракта (Solana)" autocomplete="off" spellcheck="false"><button class="paste" id="paste">Вставить</button></div>' +
      '<div style="height:12px"></div>' +
      '<button class="btn primary" id="go">' + (state.busy ? 'Проверяю…' : 'Проверить') + '</button>' +
      (state.error ? '<p class="err" style="margin-top:10px">' + esc(state.error) + '</p>' : '') +
      '</div>' +
      '<div class="card">' +
      '<h2>Как читать оценку</h2>' +
      '<p class="small muted"><b>70–100</b> — чисто. <b>40–69</b> — рискованно. <b>0–39</b> — опасно. Оценка не гарантия: раг бывает и у чистых монет.</p>' +
      '</div></div>';
  }

  function resultView() {
    const r = state.result;
    const t = r.token;
    const blocks = r.blocks.map((b) => {
      const color = b.s >= 0.7 ? 'var(--green)' : b.s >= 0.4 ? 'var(--yellow)' : 'var(--red)';
      return '<div class="block" data-block="' + b.key + '">' +
        '<button class="block-head"><span class="chip" style="background:color-mix(in srgb,' + color + ' 14%, transparent);color:' + color + '">' + b.icon + '</span>' +
        '<span>' + esc(b.title) + '</span><span class="val" style="color:' + color + '">' + Math.round(b.s * 100) + '</span></button>' +
        '<div class="block-body"><div class="bar" style="color:' + color + '"><i style="width:' + Math.round(b.s * 100) + '%"></i></div>' + esc(b.info) + '</div></div>';
    }).join('');

    return topBar('Результат') +
      '<div class="page">' +
      '<div class="card">' + ringHtml(r.score) +
      '<div style="text-align:center;margin-top:6px"><b>' + esc(t.symbol || 'TOKEN') + '</b>' + (t.name ? ' <span class="muted small">' + esc(t.name) + '</span>' : '') + '</div>' +
      '<div class="row small muted" style="justify-content:center;margin-top:8px;gap:14px;display:flex">' +
      '<span>💰 ' + fmtUsd(t.price) + '</span><span>💧 ' + fmtUsd(t.liq) + '</span><span>📊 ' + fmtUsd(t.vol24) + '</span></div>' +
      '</div>' +
      '<div class="card"><h2>Почему такой балл</h2>' + r.reasons.map((x) => '<p class="small muted">• ' + esc(x) + '</p>').join('') + '</div>' +
      '<div class="blocks">' + blocks + '</div>' +
      '<div class="card"><div class="row">' +
      '<button class="btn primary" id="save">В список</button>' +
      (t.url ? '<button class="btn" id="open">DexScreener</button>' : '') +
      '</div><div style="height:8px"></div><button class="btn ghost" id="again">Проверить другую</button></div>' +
      '</div>';
  }

  function savedView() {
    if (!state.saved.length) {
      return topBar('Сохранённые') + '<div class="page"><div class="empty"><span class="m">🦝</span>Пока пусто.<br>Проверь монету и добавь её в список — Rakko будет хранить оценку.</div></div>';
    }
    const items = state.saved.map((s) => {
      const v = verdictOf(s.score);
      const color = v.cls === 'good' ? 'var(--green)' : v.cls === 'mid' ? 'var(--yellow)' : 'var(--red)';
      return '<button class="item" data-mint="' + esc(s.mint) + '">' +
        '<span class="ava">' + (s.image ? '<img src="' + esc(s.image) + '" alt="">' : '🪙') + '</span>' +
        '<span class="meta"><b>' + esc(s.symbol) + '</b><span>' + fmtUsd(s.liq) + ' ликвидность</span></span>' +
        '<span class="score" style="color:' + color + '">' + s.score + '</span></button>';
    }).join('');
    return topBar('Сохранённые') + '<div class="page"><div class="list">' + items + '</div>' +
      '<p class="tiny" style="text-align:center;margin-top:14px">Нажми на монету — проверим заново</p></div>';
  }

  function profileView() {
    const u = TG && TG.initDataUnsafe ? TG.initDataUnsafe.user : null;
    const name = u ? [u.first_name, u.last_name].filter(Boolean).join(' ') : 'Гость';
    const handle = u && u.username ? '@' + u.username : 'без username';
    const avatar = u && u.photo_url ? '<img src="' + esc(u.photo_url) + '" alt="">' : (name[0] || '🦝');
    return topBar('Профиль') + '<div class="page">' +
      '<div class="card"><div class="profile-head">' +
      '<span class="pfp">' + avatar + '</span>' +
      '<span><b>' + esc(name) + '</b><span>' + esc(handle) + '</span></span></div>' +
      '<div class="stats"><div class="stat"><b>' + state.stats.scans + '</b><span>проверок</span></div>' +
      '<div class="stat"><b>' + state.saved.length + '</b><span>в списке</span></div></div></div>' +
      '<div class="card">' +
      '<div class="set-row">Тема<span class="val" id="theme-val">' + (state.theme === 'auto' ? 'как в телефоне' : state.theme === 'dark' ? 'тёмная' : 'светлая') + '</span></div>' +
      '<button class="btn sm" id="theme" style="margin-top:12px">Сменить тему</button>' +
      '<div style="height:10px"></div>' +
      '<button class="btn danger sm" id="clear">Очистить список</button>' +
      '</div>' +
      '<div class="card"><p class="tiny">Rakko · версия 0.1 · данные: DexScreener, Rugcheck. Только чтение, без доступа к кошельку. Оценка — не гарантия.</p></div>' +
      '</div>';
  }

  /* ---------------- render ---------------- */
  function render() {
    applyTheme();
    if (!read(LS.onboard, false)) return renderOnboarding();
    if (state.tab === 'saved') el.innerHTML = savedView();
    else if (state.tab === 'profile') el.innerHTML = profileView();
    else el.innerHTML = scanView();
    bind();
    document.getElementById('dock').style.display = '';
    document.querySelectorAll('.dock-btn').forEach((b) => b.classList.toggle('on', b.dataset.tab === state.tab));
    const ring = $('.ring .val');
    if (ring) requestAnimationFrame(() => { ring.style.strokeDashoffset = ring.dataset.off; });
  }

  function renderOnboarding() {
    const slides = [
      { t: 'Что умеет Rakko', p: 'Одна кнопка — и ты видишь, стоит ли связываться с монетой. Без таблиц и 20 вкладок.', m: '🦝' },
      { t: 'Оценка от 0 до 100', p: 'Ликвидность, холдеры, дев-кошелёк, контракт, активность, возраст и ссылки — всё в одном балле.', m: '🔍' },
      { t: 'Список и контроль', p: 'Сохраняй монеты и перепроверяй их позже. Rakko всегда под рукой — внутри Telegram.', m: '⭐' }
    ];
    let i = 0;
    document.getElementById('dock').style.display = 'none';
    el.innerHTML = '<div class="onboard">' +
      '<div class="onboard-art"><div class="ob-ring"><span>' + slides[0].m + '</span></div></div>' +
      '<div class="onboard-body"><div class="ob-dots">' + slides.map((_, k) => '<i' + (k === 0 ? ' class="on"' : '') + '></i>').join('') + '</div>' +
      '<h1></h1><p></p></div>' +
      '<div class="onboard-foot"><button class="btn primary" id="ob-next">Дальше</button><button class="btn ghost" id="ob-skip">Пропустить</button></div></div>';
    const setSlide = () => {
      $('.onboard-body h1').textContent = slides[i].t;
      $('.onboard-body p').textContent = slides[i].p;
      $('.ob-ring span').textContent = slides[i].m;
      document.querySelectorAll('.ob-dots i').forEach((d, k) => d.classList.toggle('on', k === i));
      $('#ob-next').textContent = i === slides.length - 1 ? 'Начать' : 'Дальше';
    };
    const done = () => { write(LS.onboard, true); render(); };
    $('#ob-next').onclick = () => { haptic(); if (i < slides.length - 1) { i++; setSlide(); } else done(); };
    $('#ob-skip').onclick = done;
    setSlide();
  }

  function bind() {
    const go = $('#go');
    if (go) go.onclick = startScan;
    const paste = $('#paste');
    if (paste) paste.onclick = async () => {
      try {
        const text = await navigator.clipboard.readText();
        if (text) { $('#mint').value = text.trim(); haptic(); }
      } catch (e) { toast('Нет доступа к буферу — вставь вручную'); }
    };
    const mint = $('#mint');
    if (mint) {
      mint.addEventListener('keydown', (e) => { if (e.key === 'Enter') startScan(); });
      if (state.lastMint) mint.value = state.lastMint;
    }
    const save = $('#save');
    if (save) save.onclick = () => {
      const r = state.result; if (!r) return;
      const item = { mint: r.token.mint, symbol: r.token.symbol, image: r.token.image, liq: r.token.liq, score: r.score, at: r.at };
      state.saved = [item].concat(state.saved.filter((s) => s.mint !== item.mint)).slice(0, 50);
      write(LS.saved, state.saved);
      haptic('ok'); toast('Добавлено в список');
    };
    const open = $('#open');
    if (open) open.onclick = () => { const u = state.result && state.result.token.url; if (u) window.open(u, '_blank'); };
    const again = $('#again');
    if (again) again.onclick = () => { state.result = null; state.error = ''; render(); };
    document.querySelectorAll('.block-head').forEach((b) => b.onclick = () => b.parentElement.classList.toggle('open'));
    document.querySelectorAll('.item').forEach((it) => it.onclick = () => {
      const mintAddr = it.dataset.mint;
      state.tab = 'scan';
      state.lastMint = mintAddr;
      render();
      setTimeout(startScan, 60);
    });
    const theme = $('#theme');
    if (theme) theme.onclick = () => {
      state.theme = state.theme === 'auto' ? 'dark' : state.theme === 'dark' ? 'light' : 'auto';
      write(LS.theme, state.theme); render(); haptic();
    };
    const clear = $('#clear');
    if (clear) clear.onclick = () => { state.saved = []; write(LS.saved, []); render(); toast('Список очищен'); };
  }

  async function startScan() {
    const input = $('#mint');
    const mintAddr = (input && input.value || '').trim();
    if (!isAddress(mintAddr)) { state.error = 'Это не похоже на адрес Solana (32–44 символа)'; render(); haptic('err'); return; }
    state.busy = true; state.error = ''; state.lastMint = mintAddr;
    render();
    try {
      const raw = await loadToken(mintAddr);
      const pair = pickPair(raw.dex);
      if (!pair && !raw.rug) throw new Error('Монета не найдена');
      state.result = buildScore(raw);
      if (state.result.blocks.length < 3) state.error = 'Мало данных — оценка приблизительная';
      state.stats.scans = (state.stats.scans || 0) + 1;
      write(LS.stats, state.stats);
      haptic('ok');
    } catch (e) {
      state.error = 'Не удалось проверить: ' + (e && e.message ? e.message : 'ошибка сети');
      haptic('err');
    }
    state.busy = false;
    render();
  }

  /* ---------------- boot ---------------- */
  if (TG) {
    try {
      TG.ready();
      TG.expand();
      TG.setHeaderColor('#0b0b0d');
      TG.disableVerticalSwipes && TG.disableVerticalSwipes();
    } catch (e) {}
  }
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.dock-btn, .dock-scan');
    if (!btn) return;
    state.tab = btn.dataset.tab;
    if (state.tab === 'scan' && state.result) state.result = null;
    haptic();
    render();
  });
  render();
})();
