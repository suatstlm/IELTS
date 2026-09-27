/* IELTS Study Tracker — a single-page app for working through the books section by section. */
(function () {
  'use strict';

  const BOOKS = window.BOOKS;
  const STORE_KEY = 'ielts-tracker-v1';
  const LEGACY_STORE_KEY = 'ielts-takip-v1'; // earlier (Turkish) version of the app
  const $ = (sel, root = document) => root.querySelector(sel);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const DAY = 86400000;
  const LOCALE = 'en-GB';

  // ------------------------------------------------------------------ state
  const defaults = () => ({ done: {}, notes: {}, ans: {}, exam: '', theme: '', zoom: 900, dz: 1, split: false, last: null, closedBooks: {}, skill: 'all' });
  const GAPS = window.GAPS || {};
  let S = load();
  function load() {
    try {
      let raw = localStorage.getItem(STORE_KEY);
      if (!raw) {
        // Carry progress over from the old storage key
        raw = localStorage.getItem(LEGACY_STORE_KEY);
        if (raw) localStorage.setItem(STORE_KEY, raw);
      }
      return raw ? normalize(JSON.parse(raw)) : defaults();
    } catch (e) { return defaults(); }
  }
  function normalize(st) {
    const out = Object.assign(defaults(), st);
    if ('dwide' in st && !('split' in st)) out.split = !!st.dwide;
    delete out.dwide;
    return out;
  }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); } catch (e) { toast('Could not save: browser storage may be disabled.'); }
  }

  // ------------------------------------------------------------------ index
  const bookById = Object.fromEntries(BOOKS.map((b) => [b.id, b]));
  const items = []; // every section that can be ticked off
  const secIndex = {}; // secId -> {book, unit, sec}
  BOOKS.forEach((book) => book.units.forEach((unit) => {
    unit.book = book;
    unit.items = unit.sections.filter((s) => !s.group);
    unit.sections.forEach((sec) => { secIndex[sec.id] = { book, unit, sec }; });
    unit.items.forEach((sec) => items.push({ book, unit, sec }));
  }));

  // Study order: alternate between the units of the two books
  const studyOrder = (() => {
    const g = bookById.grammar.units, v = bookById.vocabulary.units, out = [];
    for (let i = 0; i < Math.max(g.length, v.length); i++) {
      if (g[i]) g[i].items.forEach((sec) => out.push({ book: g[i].book, unit: g[i], sec }));
      if (v[i]) v[i].items.forEach((sec) => out.push({ book: v[i].book, unit: v[i], sec }));
    }
    return out;
  })();

  const isDone = (id) => !!S.done[id];
  const unitDone = (u) => u.items.filter((s) => isDone(s.id)).length;
  const bookStats = (b) => {
    let total = 0, done = 0;
    b.units.forEach((u) => { total += u.items.length; done += unitDone(u); });
    return { total, done, pct: total ? Math.round((done / total) * 100) : 0 };
  };

  function pageList(book, from, to) {
    const out = [];
    if (typeof from === 'number' && typeof to === 'number') {
      for (let p = from; p <= to; p++) out.push({ label: p, pdf: book.toPdf(p) });
    } else {
      const romans = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x', 'xi', 'xii'];
      for (let p = book.toPdf(from); p <= book.toPdf(to); p++) out.push({ label: romans[p - 2] || p, pdf: p });
    }
    return out;
  }
  const imgSrc = (book, pdf) => `${book.imgDir}/${String(pdf).padStart(3, '0')}.jpg`;

  function setDone(id, val) {
    if (val) S.done[id] = Date.now(); else delete S.done[id];
    save();
    refreshProgress();
  }

  // ------------------------------------------------------------------ theme
  function applyTheme() {
    if (S.theme) document.documentElement.setAttribute('data-theme', S.theme);
    else document.documentElement.removeAttribute('data-theme');
  }
  $('#themeBtn').addEventListener('click', () => {
    const dark = S.theme ? S.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    S.theme = dark ? 'light' : 'dark';
    save(); applyTheme();
  });

  // ------------------------------------------------------------------ toast
  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
  }

  // ------------------------------------------------------------------ sidebar
  const SKILLS = [['all', 'All'], ['Listening', 'Listening'], ['Reading', 'Reading'], ['Writing', 'Writing'], ['Speaking', 'Speaking']];
  function renderChips() {
    $('#skillChips').innerHTML = SKILLS.map(([k, l]) => `<button class="chip ${S.skill === k ? 'on' : ''}" data-skill="${k}">${l}</button>`).join('');
  }
  $('#skillChips').addEventListener('click', (e) => {
    const b = e.target.closest('[data-skill]'); if (!b) return;
    S.skill = b.dataset.skill; save(); renderChips(); renderTree();
  });
  $('#search').addEventListener('input', () => renderTree());

  function secVisible(sec, q, unitMatch) {
    if (S.skill !== 'all' && !(sec.skill || '').includes(S.skill)) return false;
    if (!q) return true;
    return unitMatch || sec.title.toLowerCase().includes(q);
  }

  function renderTree() {
    const q = $('#search').value.trim().toLowerCase();
    const filtering = !!q || S.skill !== 'all';
    const cur = route();
    let html = '';
    BOOKS.forEach((book) => {
      const st = bookStats(book);
      const closed = S.closedBooks[book.id] && !filtering;
      html += `<section class="book ${book.id} ${closed ? 'collapsed' : ''}">
        <div class="book-head" data-book="${book.id}">
          <span class="book-dot"></span><span class="book-name">${esc(book.title)}</span>
          <span class="book-pct">${st.done}/${st.total}</span><span class="muted">${closed ? '▸' : '▾'}</span>
        </div><div class="units">`;
      book.units.forEach((unit) => {
        const unitMatch = !!q && `${unit.label} ${unit.title} ${unit.subtitle}`.toLowerCase().includes(q);
        const secs = unit.sections.filter((s) => (s.group ? S.skill === 'all' && (!q || unitMatch) : secVisible(s, q, unitMatch)));
        if (filtering && !secs.some((s) => !s.group)) return;
        const d = unitDone(unit), n = unit.items.length;
        const active = cur.unit === unit.id;
        const open = active || filtering;
        const no = unit.no != null ? unit.no : unit.isTest ? 'T' : '•';
        html += `<div class="unit ${active ? 'active' : ''} ${open ? 'open' : ''} ${d === n ? 'complete' : ''}">
          <a class="unit-head" href="#/b/${book.id}/${unit.id}">
            <span class="unit-no">${d === n ? '✓' : no}</span>
            <span class="unit-title">${esc(unit.title)}</span>
            <span class="unit-count">${d}/${n}</span>
          </a><div class="secs">`;
        secs.forEach((s) => {
          if (s.group) { html += `<div class="sec group" data-sec="${s.id}"><span class="label">${esc(s.title)}</span><span class="pg">p.${s.page}</span></div>`; return; }
          const done = isDone(s.id);
          html += `<div class="sec ${s.sub ? 'sub' : ''} ${done ? 'done' : ''} ${cur.sec === s.id ? 'current' : ''}" data-sec="${s.id}">
            <input type="checkbox" class="check" data-check="${s.id}" ${done ? 'checked' : ''} aria-label="Done">
            <span class="label">${esc(s.title)}</span>${secAudio(unit, s.id).length ? '<span class="aud" title="Has an audio recording">🎧</span>' : ''}<span class="pg">p.${s.page}</span></div>`;
        });
        if (open && !filtering) {
          if (unit.key) html += `<span class="extra-link" data-extra="key" data-unit="${unit.id}">🔑 Answer key</span>`;
          if (unit.script) html += `<span class="extra-link" data-extra="script" data-unit="${unit.id}">📄 Recording script</span>`;
        }
        html += `</div></div>`;
      });
      if (!filtering) {
        book.extras.forEach((x, i) => { html += `<span class="extra-link" data-bookextra="${book.id}:${i}">📄 ${esc(x.title)}</span>`; });
      }
      html += `</div></section>`;
    });
    $('#tree').innerHTML = html || '<p class="muted" style="padding:12px">No matching topics.</p>';
    const curEl = $('#tree .sec.current') || $('#tree .unit.active');
    if (curEl && !filtering) curEl.scrollIntoView({ block: 'nearest' });
  }

  $('#tree').addEventListener('click', (e) => {
    const chk = e.target.closest('[data-check]');
    if (chk) { e.stopPropagation(); setDone(chk.dataset.check, chk.checked); return; }
    const bh = e.target.closest('[data-book]');
    if (bh) { S.closedBooks[bh.dataset.book] = !S.closedBooks[bh.dataset.book]; save(); renderTree(); return; }
    const ex = e.target.closest('[data-extra]');
    if (ex) { openUnitExtra(ex.dataset.unit, ex.dataset.extra); return; }
    const bx = e.target.closest('[data-bookextra]');
    if (bx) {
      const [bid, i] = bx.dataset.bookextra.split(':'); const book = bookById[bid]; const x = book.extras[+i];
      openPagesDrawer(book, x.from, x.to, book.title, x.title); return;
    }
    const sec = e.target.closest('[data-sec]');
    if (sec) { const { book, unit } = secIndex[sec.dataset.sec]; go(`#/b/${book.id}/${unit.id}/${sec.dataset.sec}`); }
  });

  // ------------------------------------------------------------------ router
  function route() {
    const h = location.hash.replace(/^#\/?/, '');
    const parts = h.split('/');
    if (parts[0] === 'b' && bookById[parts[1]]) return { view: 'unit', book: parts[1], unit: parts[2], sec: parts[3] || null };
    if (parts[0] === 'notes') return { view: 'notes' };
    return { view: 'home' };
  }
  function go(hash) { if (location.hash === hash) onRoute(); else location.hash = hash; }

  let view = { key: null };
  function onRoute() {
    document.body.classList.remove('menu-open');
    const r = route();
    if (r.view === 'unit') {
      const book = bookById[r.book];
      const unit = book.units.find((u) => u.id === r.unit);
      if (!unit) { location.hash = '#/'; return; }
      const key = book.id + '/' + unit.id;
      if (view.key !== key) renderUnit(book, unit);
      if (r.sec) scrollToSection(r.sec); else window.scrollTo(0, 0);
      S.last = { book: book.id, unit: unit.id, sec: r.sec }; save();
    } else {
      view = { key: r.view };
      if (r.view === 'notes') renderNotes(); else renderHome();
      window.scrollTo(0, 0);
    }
    renderTree();
  }
  window.addEventListener('hashchange', onRoute);

  // ------------------------------------------------------------------ home
  function nextUndone(list = studyOrder) { return list.find((x) => !isDone(x.sec.id)); }
  const secHref = (x) => `#/b/${x.book.id}/${x.unit.id}/${x.sec.id}`;
  const unitName = (u) => (u.no != null ? `Unit ${u.no}` : u.title);
  const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

  function renderHome() {
    const all = { total: items.length, done: items.filter((x) => isDone(x.sec.id)).length };
    const cont = S.last && secIndex[S.last.sec] ? { ...secIndex[S.last.sec] } : null;
    const next = nextUndone();
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const doneToday = Object.values(S.done).filter((t) => t >= today.getTime()).length;

    // Exam plan
    const remaining = all.total - all.done;
    let perDay = 5, daysLeft = null;
    if (S.exam) {
      const ex = new Date(S.exam + 'T00:00:00');
      daysLeft = Math.round((ex - today) / DAY);
      perDay = daysLeft > 0 ? Math.ceil(remaining / daysLeft) : remaining;
    }
    const todays = [];
    const target = Math.max(perDay - doneToday, 0);
    for (const x of studyOrder) { if (todays.length >= target) break; if (!isDone(x.sec.id)) todays.push(x); }
    const doneTodayItems = items.filter((x) => (S.done[x.sec.id] || 0) >= today.getTime());
    const plan = `
      <div class="plan-row">
        <label>Exam date<br><input type="date" id="examDate" value="${esc(S.exam)}"></label>
        <div class="stat"><b>${daysLeft == null ? '—' : daysLeft < 0 ? 'passed' : daysLeft}</b><span>days left</span></div>
        <div class="stat"><b>${remaining}</b><span>sections left</span></div>
        <div class="stat"><b>${perDay}</b><span>sections / day ${S.exam ? '' : '(default)'}</span></div>
        <div class="stat"><b>${doneToday}</b><span>done today</span></div>
      </div>
      <ul class="today-list">
        ${doneTodayItems.map((x) => todayLi(x)).join('')}
        ${todays.map((x) => todayLi(x)).join('')}
        ${!todays.length && !doneTodayItems.length ? '<li class="muted">Nothing left for today 🎉</li>' : ''}
      </ul>`;

    // Last 14 days
    const days = [];
    for (let i = 13; i >= 0; i--) {
      const d0 = today.getTime() - i * DAY, d1 = d0 + DAY;
      days.push({ d: new Date(d0), n: Object.values(S.done).filter((t) => t >= d0 && t < d1).length });
    }
    const max = Math.max(1, ...days.map((d) => d.n));
    const activity = days.map((d) => `<div class="col" title="${d.d.toLocaleDateString(LOCALE)}: ${plural(d.n, 'section')}">
      <span class="n">${d.n || ''}</span><div class="b ${d.n ? '' : 'zero'}" style="height:${(d.n / max) * 70}%"></div>
      <span class="d">${d.d.toLocaleDateString(LOCALE, { weekday: 'narrow' })}</span></div>`).join('');

    const bookCards = BOOKS.map((b) => {
      const st = bookStats(b);
      const nx = nextUndone(items.filter((x) => x.book === b));
      return `<div class="card book-card ${b.id}">
        <div class="row"><div><h2 style="margin:0">${esc(b.title)}</h2><div class="sub">${esc(b.authors)}</div></div>
        <div class="big">${st.pct}%</div></div>
        <div class="bar ${b.id[0]}"><span style="width:${st.pct}%"></span></div>
        <div class="sub" style="margin-top:6px">${st.done} / ${st.total} sections completed</div>
        <div class="next-up">${nx ? `<div class="what"><span class="muted">Up next</span><b>${esc(unitName(nx.unit))} · ${esc(nx.sec.title)}</b></div>
          <a class="btn" href="${secHref(nx)}">Open →</a>` : '<b>Book finished! 🎉</b>'}</div>
      </div>`;
    }).join('');

    const grids = BOOKS.map((b) => `<div class="card"><h2>${esc(b.title)} — units</h2><div class="unit-grid">
      ${b.units.map((u) => {
        const d = unitDone(u), n = u.items.length, pct = Math.round((d / n) * 100);
        return `<a class="tile ${d === n ? 'complete' : ''}" href="#/b/${b.id}/${u.id}">
          <span class="k">${esc(u.label)} ${d === n ? '✓' : ''}</span><span class="t">${esc(u.title)}</span>
          <div class="bar ${b.id[0]}"><span style="width:${pct}%"></span></div></a>`;
      }).join('')}</div></div>`).join('');

    $('#main').innerHTML = `<div class="home">
      <h1>Study dashboard</h1>
      <p class="muted" style="margin:0 0 20px">The two books have <b>${all.total}</b> sections in total; you have finished <b>${all.done}</b>.
        ${cont ? ` You left off at: <a href="${secHref(cont)}"><b>${esc(cont.book.short)} · ${esc(unitName(cont.unit))} · ${esc(cont.sec.title)}</b></a>` : ''}</p>
      <div class="grid two" style="margin-bottom:16px">${bookCards}</div>
      <div class="grid two" style="margin-bottom:16px">
        <div class="card"><h2>📅 Today's plan</h2>${plan}
          ${next ? `<div style="margin-top:14px"><a class="btn primary" href="${secHref(next)}">▶ Continue with the next section</a></div>` : ''}</div>
        <div class="card"><h2>📈 Last 14 days</h2><div class="activity">${activity}</div>
          <p class="muted" style="font-size:13px;margin:12px 0 0">The plan alternates between the units of the two books: Grammar Unit 1 → Vocabulary Unit 1 → Grammar Unit 2 …
          Enter your exam date and the daily target is worked out from the sections you have left.</p></div>
      </div>
      <div class="grid">${grids}</div>
    </div>`;
    $('#examDate').addEventListener('change', (e) => { S.exam = e.target.value; save(); renderHome(); });
    $('#main').querySelectorAll('.today-list [data-check]').forEach((c) => c.addEventListener('change', () => { setDone(c.dataset.check, c.checked); renderHome(); }));
  }
  function todayLi(x) {
    const d = isDone(x.sec.id);
    return `<li><input type="checkbox" class="check" data-check="${x.sec.id}" ${d ? 'checked' : ''}>
      <span class="tag ${x.book.id}">${x.book.short}</span>
      <a href="${secHref(x)}" style="${d ? 'color:var(--muted);text-decoration:line-through' : ''}">${esc(unitName(x.unit))} · ${esc(x.sec.title)}</a>
      <span class="muted" style="font-size:12px">p.${x.sec.page}</span></li>`;
  }

  // ------------------------------------------------------------------ unit view
  let curPageIdx = 0, pinnedSec = null, scrollRaf = 0;

  function renderUnit(book, unit) {
    view = { key: book.id + '/' + unit.id, book, unit, pages: pageList(book, unit.start, unit.end) };
    const units = book.units, i = units.indexOf(unit);
    const prev = units[i - 1], next = units[i + 1];
    const marks = {};
    unit.sections.forEach((s) => { (marks[String(s.page)] = marks[String(s.page)] || []).push(s); });

    const pagesHtml = view.pages.map((p, idx) => `<figure class="page" id="pg-${idx}" data-idx="${idx}" data-label="${p.label}">
        <div class="marks">${(marks[String(p.label)] || []).filter((s) => !s.group).map((s) => `<span class="mark ${isDone(s.id) ? 'done' : ''}" data-goto="${s.id}" title="${esc(s.title)}">${esc(s.title)}</span>`).join('')}</div>
        <div class="sheet" data-key="${book.id}:${p.pdf}">
          <img src="${imgSrc(book, p.pdf)}" loading="${idx < 2 ? 'eager' : 'lazy'}" alt="${esc(book.short)} page ${p.label}">
          <div class="layer"></div>
        </div>
        <figcaption>p. ${p.label}</figcaption></figure>`).join('');

    $('#main').innerHTML = `<div class="unit-view">
      <div class="unit-header">
        <div class="crumb"><span class="tag ${book.id}">${esc(book.short)}</span><span>${esc(unit.label)}</span><span>·</span><span>pp. ${unit.start}–${unit.end}</span></div>
        <h1>${esc(unit.title)}</h1><div class="subtitle">${esc(unit.subtitle)}</div>
        <div class="unit-actions">
          ${unit.key ? '<button class="btn" data-act="key">🔑 Answer key</button>' : ''}
          ${unit.audio && unit.audio.length ? '<button class="btn listen" data-act="listen">🎧 Listen</button>' : ''}
          ${unit.script ? '<button class="btn" data-act="script">📄 Recording script</button>' : ''}
          <button class="btn" data-act="note">📝 Note ${S.notes[unit.id] ? '•' : ''}</button>
          <button class="btn ghost" data-act="clear" title="Delete the answers you typed in this unit">🧹 Clear answers</button>
          <span class="spacer"></span>
          <span class="zoom">Size <button class="icon-btn" data-act="zout" aria-label="Smaller">−</button><button class="icon-btn" data-act="zin" aria-label="Larger">+</button></span>
        </div>
        <div class="unit-progress"><div class="bar ${book.id[0]}"><span id="uBar"></span></div><span id="uTxt"></span></div>
      </div>
      <div class="sec-strip"><div class="sec-strip-inner" id="strip"></div>
        <div class="edit-hint">✏️ Edit mode: click an empty spot on the page → add a box · <b>×</b> on a box → delete it ·
          <button class="linkish" data-act="restore">restore deleted auto boxes</button> · <button class="linkish" data-act="edit">done</button></div></div>
      <div class="pages ${book.id}-pages ${editing ? 'editing' : ''}" id="pages">${pagesHtml}</div>
      <div class="unit-foot">
        ${prev ? `<a class="btn" href="#/b/${book.id}/${prev.id}">← ${esc(prev.label)}: ${esc(prev.title)}</a>` : '<span></span>'}
        ${next ? `<a class="btn" href="#/b/${book.id}/${next.id}">${esc(next.label)}: ${esc(next.title)} →</a>` : '<span></span>'}
      </div>
    </div>
    <div class="dock" id="dock"></div>
    <button class="fab" id="editBtn" data-act="edit" title="Click an empty spot to add a box, × to delete one">✏️ Edit boxes</button>`;
    curPageIdx = 0; pinnedSec = null;
    document.querySelectorAll('#pages .sheet').forEach(buildLayer);
    setEditing(editing);
    updateUnitUI();
  }

  // ------------------------------------------------------------------ answer boxes
  // S.ans["<book>:<pdfPage>"] = { v: {boxId: text}, del: [autoBoxIndex], add: [{id,x,y,w}] }
  let editing = false, saveTimer = 0;
  const BOX_H = 0.021; // box height as a fraction of the page height
  const pageAns = (key, create) => S.ans[key] || (create ? (S.ans[key] = { v: {}, del: [], add: [] }) : { v: {}, del: [], add: [] });
  const saveSoon = () => { clearTimeout(saveTimer); saveTimer = setTimeout(save, 300); };

  function buildLayer(sheet) {
    const key = sheet.dataset.key;
    const [bid, pdf] = key.split(':');
    const a = pageAns(key);
    const boxes = [];
    ((GAPS[bid] || {})[pdf] || []).forEach((g, i) => { if (!a.del.includes(i)) boxes.push({ id: 'g' + i, x: g[0], y: g[1], w: g[2] }); });
    (a.add || []).forEach((c) => boxes.push({ ...c, custom: true }));
    // Tab order: top to bottom, left to right
    boxes.sort((p, q) => (Math.abs(p.y - q.y) > 0.008 ? p.y - q.y : p.x - q.x));
    sheet.querySelector('.layer').innerHTML = boxes.map((b) => {
      const v = a.v[b.id] || '';
      return `<span class="box ${b.custom ? 'custom' : ''} ${v ? 'filled' : ''}" style="left:${b.x * 100}%;top:${(b.y - BOX_H) * 100}%;width:${Math.max(b.w, 0.03) * 100}%">
        <input data-id="${b.id}" value="${esc(v)}" spellcheck="false" autocomplete="off" aria-label="Answer"><button class="x" data-del="${b.id}" tabindex="-1" title="Delete box">×</button></span>`;
    }).join('');
    sheet.querySelectorAll('.box input').forEach(fitBox);
  }
  function fitBox(inp) {
    const box = inp.parentElement;
    box.style.minWidth = '';
    if (inp.scrollWidth > inp.clientWidth) box.style.minWidth = inp.scrollWidth + 10 + 'px';
  }
  function setEditing(on) {
    editing = on;
    const pages = $('#pages'); if (!pages) return;
    pages.classList.toggle('editing', on);
    document.querySelector('.unit-view').classList.toggle('editing', on);
    const b = $('#editBtn'); if (b) { b.classList.toggle('on', on); b.textContent = on ? '✓ Finish editing' : '✏️ Edit boxes'; }
  }

  document.addEventListener('input', (e) => {
    const inp = e.target.closest('.sheet .box input'); if (!inp) return;
    const key = inp.closest('.sheet').dataset.key;
    const a = pageAns(key, true);
    if (inp.value) a.v[inp.dataset.id] = inp.value; else delete a.v[inp.dataset.id];
    inp.parentElement.classList.toggle('filled', !!inp.value);
    fitBox(inp);
    saveSoon();
  });
  document.addEventListener('keydown', (e) => {
    const inp = e.target.closest && e.target.closest('.sheet .box input');
    if (!inp || (e.key !== 'Enter' && e.key !== 'ArrowDown' && e.key !== 'ArrowUp')) return;
    e.preventDefault();
    const all = [...document.querySelectorAll('#pages .box input')];
    const next = all[all.indexOf(inp) + (e.key === 'ArrowUp' ? -1 : 1)];
    if (next) { next.focus(); next.scrollIntoView({ block: 'nearest' }); }
  });

  $('#main').addEventListener('click', (e) => {
    const del = e.target.closest('[data-del]');
    if (del) {
      const sheet = del.closest('.sheet'), key = sheet.dataset.key, id = del.dataset.del, a = pageAns(key, true);
      delete a.v[id];
      if (id[0] === 'g') a.del.push(+id.slice(1)); else a.add = a.add.filter((c) => c.id !== id);
      save(); buildLayer(sheet); return;
    }
    // In edit mode, clicking an empty spot adds a new box
    const layer = e.target.classList && e.target.classList.contains('layer') ? e.target : null;
    if (layer && editing) {
      const r = layer.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      const sheet = layer.closest('.sheet'), a = pageAns(sheet.dataset.key, true);
      const id = 'c' + Date.now().toString(36);
      a.add.push({ id, x: Math.max(0, x - 0.01), y: Math.min(1, y + BOX_H / 2), w: 0.12 });
      save(); buildLayer(sheet);
      const inp = sheet.querySelector(`input[data-id="${id}"]`); if (inp) inp.focus();
    }
  });

  function secPageIdx(sec) { return view.pages.findIndex((p) => String(p.label) === String(sec.page)); }

  function currentSection() {
    const { unit } = view;
    if (pinnedSec) return pinnedSec;
    const cands = unit.items.map((s) => ({ s, i: secPageIdx(s) })).filter((x) => x.i <= curPageIdx);
    if (!cands.length) return unit.items[0];
    const top = Math.max(...cands.map((x) => x.i));
    const onTop = cands.filter((x) => x.i === top).map((x) => x.s);
    return onTop.find((s) => !isDone(s.id)) || onTop[onTop.length - 1];
  }

  function updateUnitUI() {
    if (!view.unit) return;
    const { unit, book } = view;
    const cur = currentSection();
    const d = unitDone(unit), n = unit.items.length;
    $('#uBar').style.width = (d / n) * 100 + '%';
    $('#uTxt').textContent = `${d}/${n} sections`;
    $('#strip').innerHTML = unit.items.map((s) => `<button class="pill ${isDone(s.id) ? 'done' : ''} ${cur === s ? 'current' : ''}" data-goto="${s.id}">
      <span class="dot"></span>${esc(s.title)}</button>`).join('');
    const curPill = $('#strip .pill.current');
    if (curPill) curPill.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    document.querySelectorAll('#pages .mark').forEach((m) => m.classList.toggle('done', isDone(m.dataset.goto)));

    const idx = unit.items.indexOf(cur);
    const nextSec = unit.items[idx + 1];
    const nextUnit = book.units[book.units.indexOf(unit) + 1];
    const done = isDone(cur.id);
    const nextLabel = nextSec ? 'next section' : nextUnit ? 'next unit' : null;
    $('#dock').innerHTML = `<div class="now"><small>Now · p.${cur.page}</small><b>${esc(cur.title)}</b></div>
      ${secAudio(unit, cur.id).length ? `<button class="btn listen" data-act="listen" data-sec="${cur.id}" title="Play this section's recording">🎧</button>` : ''}
      ${done
        ? `<button class="btn" data-act="undo" title="Untick">↺</button>${nextLabel ? `<button class="btn primary" data-act="next">${nextLabel} →</button>` : ''}`
        : `<button class="btn ok" data-act="complete">✓ Done${nextLabel ? ', ' + nextLabel : ''}</button>`}`;
    $('#dock').dataset.sec = cur.id;
    // "Now" highlight in the sidebar
    document.querySelectorAll('#tree .sec.current').forEach((el) => el.classList.remove('current'));
    const t = document.querySelector(`#tree .sec[data-sec="${cur.id}"]`);
    if (t) t.classList.add('current');
    if (S.last && S.last.unit === unit.id && S.last.sec !== cur.id) { S.last.sec = cur.id; save(); }
  }

  function scrollToSection(secId) {
    const sec = secIndex[secId] && secIndex[secId].sec;
    if (!sec || !view.pages) return;
    const idx = secPageIdx(sec);
    const el = document.getElementById('pg-' + idx);
    if (!el) return;
    pinnedSec = sec.group ? null : sec;
    curPageIdx = idx;
    el.scrollIntoView({ block: 'start' });
    updateUnitUI();
  }

  function gotoNext() {
    const { unit, book } = view;
    const cur = currentSection();
    const nextSec = unit.items[unit.items.indexOf(cur) + 1];
    if (nextSec) { history.replaceState(null, '', `#/b/${book.id}/${unit.id}/${nextSec.id}`); scrollToSection(nextSec.id); renderTree(); return; }
    const nextUnit = book.units[book.units.indexOf(unit) + 1];
    if (nextUnit) go(`#/b/${book.id}/${nextUnit.id}`);
  }

  window.addEventListener('scroll', () => {
    if (!view.unit || scrollRaf) return;
    scrollRaf = requestAnimationFrame(() => {
      scrollRaf = 0;
      const line = window.innerHeight * 0.35;
      let idx = 0;
      document.querySelectorAll('#pages .page').forEach((f) => { if (f.getBoundingClientRect().top <= line) idx = +f.dataset.idx; });
      if (idx !== curPageIdx) {
        curPageIdx = idx;
        if (pinnedSec && secPageIdx(pinnedSec) !== idx) pinnedSec = null;
        updateUnitUI();
      }
    });
  }, { passive: true });

  $('#main').addEventListener('click', (e) => {
    const g = e.target.closest('[data-goto]');
    if (g && view.unit) { history.replaceState(null, '', `#/b/${view.book.id}/${view.unit.id}/${g.dataset.goto}`); scrollToSection(g.dataset.goto); return; }
    const a = e.target.closest('[data-act]'); if (!a || !view.unit) return;
    const act = a.dataset.act;
    if (act === 'key' || act === 'script') openUnitExtra(view.unit.id, act);
    else if (act === 'note') openNoteDrawer(view.unit);
    else if (act === 'edit') { setEditing(!editing); if (editing) toast('Click an empty spot → add a box, × → delete'); }
    else if (act === 'restore' || act === 'clear') {
      const keys = view.pages.map((p) => `${view.book.id}:${p.pdf}`);
      if (act === 'clear' && !confirm('All the answers you typed in this unit will be deleted. Are you sure?')) return;
      keys.forEach((k) => { if (!S.ans[k]) return; if (act === 'clear') S.ans[k].v = {}; else S.ans[k].del = []; });
      save(); document.querySelectorAll('#pages .sheet').forEach(buildLayer);
      toast(act === 'clear' ? 'Answers cleared.' : 'Deleted boxes restored.');
    }
    else if (act === 'zin' || act === 'zout') {
      S.zoom = Math.min(1500, Math.max(500, S.zoom + (act === 'zin' ? 100 : -100))); save(); applyZoom();
      const el = document.getElementById('pg-' + curPageIdx); if (el) el.scrollIntoView({ block: 'start' });
    } else if (act === 'complete') {
      const id = $('#dock').dataset.sec; setDone(id, true); toast('✓ ' + secIndex[id].sec.title); gotoNext();
    } else if (act === 'undo') { setDone($('#dock').dataset.sec, false); }
    else if (act === 'next') gotoNext();
    else if (act === 'listen') openPlayer(view.unit, a.dataset.sec);
  });

  function applyZoom() { document.documentElement.style.setProperty('--page-w', S.zoom + 'px'); }

  // ------------------------------------------------------------------ audio player (SoundCloud)
  const secAudio = (unit, secId) => (unit.audio || []).filter((a) => a.sec === secId);
  let playing = null; // { unit, idx }

  function openPlayer(unit, secId) {
    const list = unit.audio || [];
    if (!list.length) return;
    let idx = secId ? list.findIndex((a) => a.sec === secId) : 0;
    if (idx < 0) idx = 0;
    playTrack(unit, idx);
  }
  function playTrack(unit, idx) {
    const a = unit.audio[idx];
    playing = { unit, idx };
    const secTitle = (secIndex[a.sec] && secIndex[a.sec].sec.title) || '';
    $('#playerInfo').innerHTML = `<b>${esc(unit.label)} · ${esc(a.label)}</b><small>${esc(secTitle)}</small>`;
    $('#playerChips').innerHTML = unit.audio.map((x, i) =>
      `<button class="chip ${i === idx ? 'on' : ''}" data-track="${i}" title="${esc(secIndex[x.sec] ? secIndex[x.sec].sec.title : '')}">${esc(x.label.replace('Recording ', ''))}</button>`).join('');
    const src = 'https://w.soundcloud.com/player/?url=' + encodeURIComponent('https://api.soundcloud.com/tracks/' + a.id) +
      '&auto_play=true&color=%23ca8a04&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false&visual=false&show_artwork=false';
    $('#playerFrame').innerHTML = `<iframe title="${esc(a.label)}" allow="autoplay" src="${src}"></iframe>`;
    $('#player').hidden = false;
    document.body.classList.add('playing');
  }
  function closePlayer() {
    $('#playerFrame').innerHTML = '';
    $('#player').hidden = true;
    document.body.classList.remove('playing');
    playing = null;
  }
  $('#playerChips').addEventListener('click', (e) => {
    const c = e.target.closest('[data-track]');
    if (c && playing) playTrack(playing.unit, +c.dataset.track);
  });
  $('#playerClose').addEventListener('click', closePlayer);

  // ------------------------------------------------------------------ drawer
  function openDrawer(kicker, title, html) {
    $('#drawerKicker').textContent = kicker;
    $('#drawerTitle').textContent = title;
    $('#drawerBody').innerHTML = html;
    $('#drawerBody').scrollTop = 0;
    $('#drawer').classList.add('open');
    $('#drawer').setAttribute('aria-hidden', 'false');
    document.body.classList.add('docked');
    document.body.classList.toggle('split', !!S.split);
  }
  function closeDrawer() {
    $('#drawer').classList.remove('open');
    $('#drawer').setAttribute('aria-hidden', 'true');
    document.body.classList.remove('docked', 'split');
  }
  $('#drawerClose').addEventListener('click', closeDrawer);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDrawer(); });

  // Drawer zoom: pages are drawn at dz times the drawer width
  const DZ_STEPS = [0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3];
  function applyDrawerZoom(keepView) {
    const body = $('#drawerBody');
    const fx = body.scrollWidth ? (body.scrollLeft + body.clientWidth / 2) / body.scrollWidth : 0.5;
    const fy = body.scrollHeight ? (body.scrollTop + body.clientHeight / 2) / body.scrollHeight : 0;
    body.style.setProperty('--dz', S.dz);
    $('#dzVal').textContent = Math.round(S.dz * 100) + '%';
    // Split screen: the menu is hidden, book on the left and drawer on the right, half each
    document.body.classList.toggle('split', !!S.split && $('#drawer').classList.contains('open'));
    $('#dzSplit').classList.toggle('on', !!S.split);
    if (keepView) {
      body.scrollLeft = fx * body.scrollWidth - body.clientWidth / 2;
      body.scrollTop = fy * body.scrollHeight - body.clientHeight / 2;
    }
  }
  function stepZoom(dir) {
    const i = DZ_STEPS.findIndex((z) => z >= S.dz - 0.001);
    const next = DZ_STEPS[Math.min(DZ_STEPS.length - 1, Math.max(0, (i < 0 ? 1 : i) + dir))];
    if (next === S.dz) return;
    S.dz = next; save(); applyDrawerZoom(true);
  }
  $('#dzIn').addEventListener('click', () => stepZoom(1));
  $('#dzOut').addEventListener('click', () => stepZoom(-1));
  $('#dzVal').addEventListener('click', () => { S.dz = 1; save(); applyDrawerZoom(true); });
  $('#dzSplit').addEventListener('click', () => { S.split = !S.split; save(); applyDrawerZoom(true); });
  $('#drawerBody').addEventListener('wheel', (e) => {
    if (!e.ctrlKey || $('#drawer').dataset.mode !== 'pages') return;
    e.preventDefault();
    stepZoom(e.deltaY < 0 ? 1 : -1);
  }, { passive: false });

  function openPagesDrawer(book, from, to, kicker, title) {
    $('#drawer').dataset.mode = 'pages';
    const html = `<div class="pages ${book.id}-pages">${pageList(book, from, to).map((p) => `<figure class="page">
      <img src="${imgSrc(book, p.pdf)}" loading="lazy" alt="page ${p.label}"><figcaption>p. ${p.label}</figcaption></figure>`).join('')}</div>`;
    openDrawer(kicker, title, html);
  }
  function openUnitExtra(unitId, kind) {
    const { unit } = Object.values(secIndex).find((x) => x.unit.id === unitId);
    const r = kind === 'key' ? unit.key : unit.script;
    if (!r) return;
    openPagesDrawer(unit.book, r.from, r.to, `${unit.book.short} · ${unit.label}`,
      (kind === 'key' ? 'Answer key' : 'Recording script') + ` (${r.to !== r.from ? `pp. ${r.from}–${r.to}` : `p. ${r.from}`})`);
    const hint = document.createElement('p');
    hint.className = 'muted'; hint.style.cssText = 'font-size:12px;margin:0 0 10px';
    hint.textContent = kind === 'key'
      ? "This unit's answers start on the first page; neighbouring units' answers may share the same page."
      : 'Read the recording script only after you have answered the questions.';
    $('#drawerBody').prepend(hint);
  }
  function openNoteDrawer(unit) {
    $('#drawer').dataset.mode = 'note';
    openDrawer(`${unit.book.short} · ${unit.label}`, 'My notes: ' + unit.title,
      `<p class="muted" style="font-size:13px;margin:0 0 10px">Rules, new words, mistakes… Everything you type is saved automatically.</p>
       <textarea id="noteArea" placeholder="Your notes for this unit…"></textarea>`);
    const ta = $('#noteArea');
    ta.value = S.notes[unit.id] || '';
    ta.addEventListener('input', () => {
      if (ta.value.trim()) S.notes[unit.id] = ta.value; else delete S.notes[unit.id];
      save();
    });
    ta.focus();
  }

  // ------------------------------------------------------------------ notes page
  function renderNotes() {
    const cards = [];
    BOOKS.forEach((b) => b.units.forEach((u) => {
      if (!S.notes[u.id]) return;
      cards.push(`<div class="card note-card"><div class="crumb"><span class="tag ${b.id}">${esc(b.short)}</span>${esc(u.label)}</div>
        <h3><a href="#/b/${b.id}/${u.id}">${esc(u.title)}</a></h3><pre>${esc(S.notes[u.id])}</pre>
        <div style="margin-top:10px"><button class="btn" data-note="${u.id}">Edit</button></div></div>`);
    }));
    $('#main').innerHTML = `<div class="home"><h1>My notes</h1>
      <p class="muted">Inside a unit, use the <b>📝 Note</b> button to add a note. All your notes are collected here.</p>
      <div class="grid two">${cards.join('') || '<div class="card muted">No notes yet.</div>'}</div></div>`;
    $('#main').querySelectorAll('[data-note]').forEach((btn) => btn.addEventListener('click', () => {
      const x = Object.values(secIndex).find((y) => y.unit.id === btn.dataset.note);
      openNoteDrawer(x.unit);
    }));
  }

  // ------------------------------------------------------------------ progress refresh
  function refreshProgress() {
    const done = items.filter((x) => isDone(x.sec.id)).length;
    const pct = Math.round((done / items.length) * 100);
    $('#topBar').style.width = pct + '%';
    $('#topPct').textContent = pct + '%';
    renderTree();
    if (view.unit) updateUnitUI();
  }

  // ------------------------------------------------------------------ backup
  $('#backupBtn').addEventListener('click', () => $('#backupDlg').showModal());
  $('#exportBtn').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify({ app: 'ielts-tracker', version: 1, exported: new Date().toISOString(), state: S }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `ielts-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
  $('#importFile').addEventListener('change', async (e) => {
    const f = e.target.files[0]; if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      const st = data.state || data;
      if (!st || typeof st.done !== 'object') throw new Error('format');
      S = normalize(st); save();
      toast('Backup restored.'); $('#backupDlg').close(); applyTheme(); applyZoom(); applyDrawerZoom(); view.key = null; onRoute(); refreshProgress();
    } catch (err) { toast('Could not read the file: not a valid backup.'); }
    e.target.value = '';
  });
  $('#resetBtn').addEventListener('click', () => {
    if (!confirm('All progress and notes will be deleted. Are you sure?')) return;
    S = defaults(); save(); $('#backupDlg').close(); applyTheme(); applyZoom(); applyDrawerZoom(); view.key = null; onRoute(); refreshProgress();
  });

  // ------------------------------------------------------------------ mobile menu
  $('#menuBtn').addEventListener('click', () => document.body.classList.toggle('menu-open'));
  $('#scrim').addEventListener('click', () => document.body.classList.remove('menu-open'));

  // ------------------------------------------------------------------ init
  applyTheme(); applyZoom(); applyDrawerZoom(); renderChips();
  onRoute(); refreshProgress();
})();
