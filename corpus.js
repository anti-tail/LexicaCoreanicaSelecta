/* corpus.js — Lexica Coreanica Selecta の「用例」ページ（corpus.html，en/corpus.html）．
   우리말샘 の歴史情報に引かれた用例（CC BY-SA 2.0 KR）を，文の単位で全文検索する．
   データは data/u/cites.json（tools/export_citations.py）．照合キーは hkey.js（= lexica/searchkey.py）．
   行：[本文, 見出しの位置, 出典, 刊年, 変種の番号, 世紀, 照合キー, [[項目 id, 形]…], 文献の略号] */
(() => {
  const EN = (document.documentElement.lang || 'ja').startsWith('en');
  const BASE = EN ? '../' : '';
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => (s ?? '').toString().replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const TX = EN ? {
    loading: 'Loading the citations…', ready: n => `${n.toLocaleString()} citation sentences`, hits: (n, d) => `${n.toLocaleString()} sentences · ${d} sources`,
    none: 'No matches.', tryEra: ' Try “absorb period spellings”.', prev: 'Prev', next: 'Next', entry: 'entry', cent: c => `${c}th c.`,
    byCent: 'By century', byDoc: 'By source (most frequent)', words: 'Matched word forms', wordsNote: 'Click a form to search for it exactly.',
    badRe: 'Invalid regular expression: ', tsv: 'TSV', light: 'Light theme', dark: 'Dark theme', noQ: 'Type a word to search.',
  } : {
    loading: '用例を読み込んでいます…', ready: n => `用例 ${n.toLocaleString()} 文`, hits: (n, d) => `${n.toLocaleString()} 文 · ${d} 文献`,
    none: '見つかりません．', tryEra: '「時代ごとの綴りの揺れを吸収」でも引いてみてください．', prev: '前へ', next: '次へ', entry: '項目', cent: c => `${c} 世紀`,
    byCent: '世紀', byDoc: '文献（多い順）', words: '一致した語節', wordsNote: '押すとその語節を表記どおりに引きます．',
    badRe: '正規表現の誤り：', tsv: 'TSV', light: '明るい表示にする', dark: '暗い表示にする', noQ: '語を入れて引いてください．',
  };
  const SEP = /[\s　.,;:!?·「」『』()\[\]{}<>"'“”‘’。、■□○●◯…\-]/;
  const TOKEN = /[^\s　.,;:!?·「」『』()\[\]{}<>"'“”‘’。、■□○●◯…\-]+/g;
  const HANGUL = /[ᄀ-ᇿꥠ-꥿ힰ-퟿가-힣]/;
  const TONES = /[〮〯]/g;
  const PAGE = 100;
  let D = null, KEYS = null, hits = [], offset = 0;
  const S = { q: '', m: 'era', c: new Set([15, 16, 17, 18, 19]), doc: '' };

  const nfc = s => (s || '').normalize('NFC');
  const plain = s => nfc(s).replace(TONES, '');

  // ---- 照合
  function toks(text) {   // [[start, end, 語節]]（ハングルを含む語節）
    const out = [];
    for (const m of text.matchAll(TOKEN)) if (HANGUL.test(m[0])) out.push([m.index, m.index + m[0].length, m[0]]);
    return out;
  }
  const KC = [new WeakMap(), new WeakMap()];   // 行ごとの語節キー（世紀 0 と，用例の世紀）
  function keyToks(text, era) {   // export_citations.py の照合キーと同じ語節の並び（キーが空の語節は除く）
    return toks(text).map(([s, e, w]) => [s, e, HKey.key(w, era)]).filter(t => t[2]);
  }
  function rowKeys(r, era) {
    const c = KC[era ? 1 : 0];
    let kt = c.get(r);
    if (!kt) c.set(r, kt = keyToks(r[0].replace(TONES, ''), era));
    return kt;
  }
  function seqMatch(keys, qks, head, tail) {   // 続く語節がそれぞれ問いの語を含む位置の [始め, 終わり]（語節の番号）
    const out = [], n = qks.length;
    for (let a = 0; a + n <= keys.length; a++) {
      let ok = true;
      for (let i = 0; i < n && ok; i++) {
        const k = keys[a + i], q = qks[i];
        if (i === 0 && head) ok = (n > 1 || !tail) ? k.startsWith(q) : k === q;
        else if (i === n - 1 && tail) ok = k.endsWith(q);
        else ok = k.includes(q);
      }
      if (ok) out.push([a, a + n - 1]);
    }
    return out;
  }
  function bounded(s, i, j, head, tail) {
    return (!head || i === 0 || SEP.test(s[i - 1])) && (!tail || j === s.length || SEP.test(s[j]));
  }
  function matcher() {
    let q = nfc(S.q).trim();
    if (!q) return null;
    if (S.m === 're') {
      let rx; try { rx = new RegExp(plain(q), 'gu'); } catch (e) { return { error: TX.badRe + e.message }; }
      return r => { const out = []; for (const m of r[0].replace(TONES, '').matchAll(rx)) if (m[0]) out.push([m.index, m.index + m[0].length]); return out; };
    }
    const head = q.startsWith('^'), tail = q.endsWith('$');
    q = q.replace(/^\^|\$$/g, '').trim();
    if (S.m === 'exact') {
      const nd = plain(q);
      return r => { const t = r[0].replace(TONES, ''), out = []; let i = t.indexOf(nd); while (i >= 0) { if (bounded(t, i, i + nd.length, head, tail)) out.push([i, i + nd.length]); i = t.indexOf(nd, i + 1); } return out; };
    }
    // syl：音節の組み方だけ（世紀 0 の規則）．era：用例の世紀の規則
    const words = q.split(/\s+/).filter(Boolean);
    const qk = {}; for (const e of [0, 15, 16, 17, 18, 19]) qk[e] = words.map(w => HKey.key(w, e)).filter(Boolean);
    return r => {
      const era = S.m === 'era' ? r[5] : 0;
      const qks = qk[era];
      if (!qks.length) return [];
      if (S.m === 'era') {   // 書き出しのキーで先に絞る
        const longest = qks.reduce((a, b) => (b.length > a.length ? b : a));
        if (!r[6].includes(longest)) return [];
      }
      const kt = rowKeys(r, era);
      return seqMatch(kt.map(t => t[2]), qks, head, tail).map(([a, b]) => [kt[a][0], kt[b][1]]);
    };
  }
  // 傍点を外した本文の位置 → 本文の位置
  function unTone(text, spans) {
    if (!/[〮〯]/.test(text)) return spans;
    const map = []; [...text].forEach((c, i) => { if (!/[〮〯]/.test(c)) map.push(i); }); map.push(text.length);
    return spans.map(([a, b]) => [map[a], map[b - 1] + 1]);
  }

  function run() {
    saveHash();
    const f = matcher();
    if (!f) { hits = []; render(TX.noQ); return; }
    if (f.error) { hits = []; render(f.error); return; }
    const doc = S.doc.trim();
    hits = [];
    for (const r of D.t) {
      if (!S.c.has(r[5])) continue;
      if (doc && !r[8].includes(doc) && !r[2].includes(doc)) continue;
      const sp = f(r);
      if (sp.length) hits.push([r, unTone(r[0], sp)]);
    }
    offset = 0;
    render();
  }

  function marked(text, spans, marks) {
    // spans（検索の一致）は <mark>，marks（우리말샘 で見出しの形とされた部分）は下線
    const ev = [];
    spans.forEach(([a, b]) => { ev.push([a, 1, '<mark>'], [b, -1, '</mark>']); });
    for (let i = 0; i < marks.length; i += 2) ev.push([marks[i], 2, '<u>'], [marks[i + 1], -2, '</u>']);
    ev.sort((x, y) => x[0] - y[0] || x[1] - y[1]);
    let out = '', i = 0;
    for (const [p, , tag] of ev) { if (p > i) { out += esc(text.slice(i, p)); i = p; } out += tag; }
    return out + esc(text.slice(i));
  }

  // 項目へのリンク．同じ形が複数の項目（同音語・語義）にあるときは，2 つめから番号で
  function entryLinks(es) {
    const by = new Map();
    es.forEach(([id, f]) => { const k = f.normalize('NFC'); if (!by.has(k)) by.set(k, []); if (!by.get(k).includes(id)) by.get(k).push(id); });
    return [...by].map(([f, ids]) => `<span><a href="index.html#id=${ids[0]}" class="hangul" title="${TX.entry}">${esc(f)}</a>${ids.length > 1 ? `<sup>${ids.slice(1).map((id, i) => `<a href="index.html#id=${id}" title="${TX.entry} ${i + 2}">${i + 2}</a>`).join(',')}</sup>` : ''}</span>`).join(' ');
  }

  function render(msg) {
    const docs = new Map(), cents = new Map(), words = new Map();
    hits.forEach(([r, sp]) => {
      docs.set(r[8], (docs.get(r[8]) || 0) + 1); cents.set(r[5], (cents.get(r[5]) || 0) + 1);
      sp.forEach(([a, b]) => { const t = r[0]; while (a > 0 && !SEP.test(t[a - 1])) a--; while (b < t.length && !SEP.test(t[b])) b++; const w = plain(t.slice(a, b)); words.set(w, (words.get(w) || 0) + 1); });
    });
    $('#info').textContent = msg ? '' : TX.hits(hits.length, docs.size);
    $('#tsv').hidden = !hits.length;
    if (msg || !hits.length) {
      $('#results').innerHTML = `<li class="empty">${esc(msg || TX.none + (S.m !== 'era' ? TX.tryEra : ''))}</li>`;
      $('#side').innerHTML = '';
      return;
    }
    const page = hits.slice(offset, offset + PAGE);
    const pages = Math.ceil(hits.length / PAGE), cur = offset / PAGE + 1;
    $('#results').innerHTML = page.map(([r, sp]) => `<li class="cite">
        <div class="cite-meta"><span class="cite-loc">${esc(r[2])}</span>${entryLinks(r[7])}</div>
        <div class="cite-text hangul">${marked(r[0], sp, r[1])}</div></li>`).join('') +
      (pages > 1 ? `<li class="more"><button class="link-btn" data-go="-1" ${offset ? '' : 'disabled'}>${TX.prev}</button> ${cur} / ${pages} <button class="link-btn" data-go="1" ${cur < pages ? '' : 'disabled'}>${TX.next}</button></li>` : '');
    $$('#results [data-go]').forEach(b => b.onclick = () => { offset += +b.dataset.go * PAGE; render(); $('#results').parentNode.scrollTop = 0; });
    const cm = Math.max(...cents.values()), dm = Math.max(...docs.values());
    const bar = (lab, n, m, attr) => `<div class="cbar" ${attr}><span>${esc(lab)}</span><span class="b" style="width:${(n / m * 100).toFixed(1)}%"></span><span class="n">${n}</span></div>`;
    $('#side').innerHTML = `<h3>${TX.byCent}</h3>${[...cents].sort((a, b) => a[0] - b[0]).map(([c, n]) => bar(TX.cent(c), n, cm, '')).join('')}
      <h3>${TX.byDoc}</h3>${[...docs].sort((a, b) => b[1] - a[1]).slice(0, 40).map(([d, n]) => bar(d, n, dm, `data-doc="${esc(d)}"`)).join('')}
      <h3>${TX.words}</h3><p class="faint">${TX.wordsNote}</p><table class="wtab"><tbody>${[...words].sort((a, b) => b[1] - a[1]).slice(0, 200).map(([w, n]) => `<tr data-w="${esc(w)}"><td class="hangul">${esc(w)}</td><td class="n">${n}</td></tr>`).join('')}</tbody></table>`;
    $$('#side [data-doc]').forEach(el => el.onclick = () => { S.doc = el.dataset.doc; $('#doc').value = S.doc; run(); });
    $$('#side tr[data-w]').forEach(tr => tr.onclick = () => { $('#q').value = '^' + tr.dataset.w + '$'; S.m = 'exact'; $('#mode').value = 'exact'; S.q = $('#q').value; run(); });
  }

  function tsv() {
    const lines = [['year', 'source', 'locus', 'match', 'text', 'entries'].join('\t')];
    hits.forEach(([r, sp]) => lines.push([r[3] || '', r[8], r[2], sp.map(([a, b]) => r[0].slice(a, b)).join(' | '), r[0], r[7].map(e => `${e[1]}#${e[0]}`).join(' ')].join('\t')));
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([lines.join('\n') + '\n'], { type: 'text/tab-separated-values' }));
    a.download = 'citations.tsv'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  function saveHash() {
    const p = new URLSearchParams();
    if (S.q) p.set('q', S.q);
    if (S.m !== 'era') p.set('m', S.m);
    if (S.c.size !== 5) p.set('c', [...S.c].join(','));
    if (S.doc) p.set('d', S.doc);
    history.replaceState(null, '', p.toString() ? '#' + p : location.pathname);
  }
  function loadHash() {
    const p = new URLSearchParams(location.hash.slice(1));
    S.q = p.get('q') || ''; S.m = p.get('m') || 'era'; S.doc = p.get('d') || '';
    if (p.get('c')) { S.c = new Set(p.get('c').split(',').map(Number)); }
    $('#q').value = S.q; $('#mode').value = S.m; $('#doc').value = S.doc;
    $$('#cents input').forEach(i => { i.checked = S.c.has(+i.value); });
  }

  // ---- 画面
  try { const t = localStorage.getItem('lexica.theme'); if (t) document.documentElement.dataset.theme = t; } catch (_) { /* なし */ }
  const isDark = () => document.documentElement.dataset.theme === 'dark' || (!document.documentElement.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches);
  const lab = () => { $('#theme').textContent = isDark() ? TX.light : TX.dark; };
  lab();
  $('#theme').onclick = () => { document.documentElement.dataset.theme = isDark() ? 'light' : 'dark'; try { localStorage.setItem('lexica.theme', document.documentElement.dataset.theme); } catch (_) { /* なし */ } lab(); };
  $('#f').addEventListener('submit', e => { e.preventDefault(); S.q = $('#q').value.trim(); run(); });
  $('#mode').addEventListener('change', () => { S.m = $('#mode').value; if (S.q) run(); });
  $('#doc').addEventListener('change', () => { S.doc = $('#doc').value.trim(); if (S.q) run(); });
  $$('#cents input').forEach(i => i.addEventListener('change', () => { S.c = new Set($$('#cents input:checked').map(x => +x.value)); if (S.q) run(); }));
  $('#tsv').addEventListener('click', tsv);
  $$('[data-try]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); const [q, m] = a.dataset.try.split('|'); $('#q').value = q; $('#mode').value = m; S.q = q; S.m = m; run(); }));
  window.addEventListener('hashchange', () => { loadHash(); if (S.q) run(); });

  $('#info').textContent = TX.loading;
  Promise.all([fetch(BASE + 'data/jamo.json').then(r => r.json()), fetch(BASE + 'data/u/cites.json').then(r => r.json())]).then(([jamo, cites]) => {
    HKey.init(jamo);
    D = cites;
    $('#info').textContent = TX.ready(D.t.length);
    $('#doclist').innerHTML = [...new Set(D.t.map(r => r[8]))].sort().map(d => `<option value="${esc(d)}">`).join('');
    loadHash();
    if (S.q) run();
  }).catch(e => { $('#info').textContent = String(e); });
})();
