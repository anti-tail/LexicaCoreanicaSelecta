/* lexica-study.js — Lexica シリーズ共通：ブックマークと復習カード
   ・記録は閲覧者のブラウザ（localStorage）にだけ置く．サーバーは要らない（GitHub Pages の静的サイトで動く）．
   ・端末を移るときは JSON で書き出し・読み込み（読み込みは今の記録と合わせる）．Anki 用には TSV で書き出す．
   ・復習の間隔は FSRS-5（Anki の既定と同じ方式．パラメータは既定値）で決める．日付は朝 4 時で切り替わる．
   ・サイトごとに LexicaStudy.init({ site, lang, adapter, ... }) を呼ぶ．adapter は項目の引き方とカードの中身を受け持つ：
       key(e)                 → 項目の安定した目印（DB を作り直しても変わらないもの．例：見出し＋語義番号）
       snapshot(e)            → 保存しておく項目の写し（番号が変わって引けなくなったときの表示と TSV に使う）
       resolve(key, snap, id) → 今のデータでの項目番号（引けなければ null）
       load(id)               → Promise<項目>
       card(e, dir, snap)     → { front, back }（HTML．e が null のときは snap から作る）
       anki(e, snap)          → [表の HTML, 裏の HTML, 詳細の HTML]（Anki の「基本（裏表反転カード付き）」に入る 2 欄＋詳細）
       url(id)                → 項目を開く URL
       changed(external)      → ブックマークが変わったとき（一覧や印を描き直す．external：別のタブや読み込みでの変更）
     dirs: [{ id: 'f', label: '…' }, …]：カードの向き（1 項目につき向きごとに 1 枚）
   ・同じ項目の別の向きのカードは，同じ日には出さない（Anki の「兄弟カードの延期」と同じ）． */
(() => {
  'use strict';
  const MIN = 60000, HOUR = 3600000, DAY = 86400000, ROLLOVER = 4 * HOUR;

  // ---------- FSRS-5
  const W = [0.40255, 1.18385, 3.173, 15.69105, 7.1949, 0.5345, 1.4604, 0.0046, 1.54575, 0.1192, 1.01925,
    1.9395, 0.11, 0.29605, 2.2698, 0.2315, 2.9898, 0.51655, 0.6621];
  const DECAY = -0.5, FACTOR = 19 / 81;
  const clampD = d => Math.min(10, Math.max(1, d));
  const initD = g => clampD(W[4] - Math.exp(W[5] * (g - 1)) + 1);
  const retrievability = (t, s) => Math.pow(1 + FACTOR * t / s, DECAY);
  const nextD = (d, g) => clampD(W[7] * initD(4) + (1 - W[7]) * (d + (-W[6] * (g - 3)) * (10 - d) / 9));
  const recallS = (d, s, r, g) => s * (1 + Math.exp(W[8]) * (11 - d) * Math.pow(s, -W[9]) * (Math.exp(W[10] * (1 - r)) - 1)
    * (g === 2 ? W[15] : 1) * (g === 4 ? W[16] : 1));
  const forgetS = (d, s, r) => Math.min(s, W[11] * Math.pow(d, -W[12]) * (Math.pow(s + 1, W[13]) - 1) * Math.exp(W[14] * (1 - r)));
  const shortS = (s, g) => s * Math.exp(W[17] * (g - 3 + W[18]));
  const interval = (s, ret) => Math.min(36500, Math.max(1, Math.round(s / FACTOR * (Math.pow(ret, 1 / DECAY) - 1))));
  const LEARN = [1 * MIN, 10 * MIN], RELEARN = [10 * MIN];

  // 日付（朝 4 時で切り替わる）：ms → 日の番号，日の番号 → その日の始まりの ms
  const tz = ms => new Date(ms).getTimezoneOffset() * MIN;
  const dayOf = ms => Math.floor((ms - tz(ms) - ROLLOVER) / DAY);
  const dayStart = n => { const ms = n * DAY + ROLLOVER; return ms + tz(ms); };
  const dateKey = n => new Date(n * DAY).toISOString().slice(0, 10);

  // カード c（状態 st：0 新規，1 学習中，2 復習，3 再学習）を評価 g（1 もう一度，2 難しい，3 正解，4 簡単）で更新した結果
  function step(c, g, now, ret) {
    const n = { ...c, reps: (c.reps || 0) + 1, last: now };
    if (!c.st) { n.D = initD(g); n.S = W[g - 1]; }
    else {
      const t = dayOf(now) - dayOf(c.last || now);
      if (t < 1) n.S = Math.max(0.01, shortS(c.S, g));
      else { const r = retrievability(t, c.S); n.S = g === 1 ? forgetS(c.D, c.S, r) : recallS(c.D, c.S, r, g); }
      n.D = nextD(c.D, g);
    }
    let days = 0;                                   // 復習に回るなら間隔（日），学習中なら 0
    const grad = () => { n.st = 2; n.step = 0; days = interval(n.S, ret); };
    const learn = (steps, i) => { n.step = i; n.due = now + steps[Math.min(i, steps.length - 1)]; };
    if (c.st === 0 || c.st === 1) {
      n.st = 1;
      const i = c.st ? c.step || 0 : 0;
      if (g === 1) learn(LEARN, 0);
      else if (g === 2) { n.step = i; n.due = now + (i === 0 ? (LEARN[0] + LEARN[1]) / 2 : LEARN[i]); }
      else if (g === 3) { if (i + 1 < LEARN.length) learn(LEARN, i + 1); else grad(); }
      else grad();
    } else if (c.st === 3) {
      if (g === 1) learn(RELEARN, 0);
      else if (g === 2) { n.step = 0; n.due = now + RELEARN[0] * 1.5; }
      else grad();
    } else {
      if (g === 1) { n.st = 3; n.lapses = (c.lapses || 0) + 1; learn(RELEARN, 0); }
      else grad();
    }
    return { card: n, days };
  }
  // 4 つの評価の結果を並べる（復習に回る間隔は 難しい ≦ 正解 < 簡単 に整える）
  function preview(c, now, ret) {
    const r = [1, 2, 3, 4].map(g => step(c, g, now, ret));
    if (c.st === 2) {
      if (r[1].days) r[1].days = Math.min(r[1].days, r[2].days);
      r[2].days = Math.max(r[2].days, (r[1].days || 0) + 1);
    }
    if (r[2].days) r[3].days = Math.max(r[3].days, r[2].days + 1);
    else if (r[3].days) r[3].days = Math.max(r[3].days, 1);
    r.forEach(x => { if (x.days) x.card.due = dayStart(dayOf(now) + x.days); x.wait = x.days ? x.days * DAY : x.card.due - now; });
    return r;
  }

  // ---------- 表示の言葉
  const TEXT = {
    ja: {
      star: 'ブックマーク', starred: 'ブックマーク済み', starTip: 'この項目をブックマークし，復習のカードにする', unstarTip: 'ブックマークを外す（復習の記録は残ります）',
      tags: 'タグ', addTag: 'タグを足す', removeTag: t => `タグ「${t}」を外す`,
      open: '復習', title: 'ブックマークと復習', close: '閉じる',
      summary: (b, n) => `ブックマーク ${b} 語・カード ${n} 枚`,
      today: (nw, lr, rv) => `今日：新しいカード ${nw}・学習中 ${lr}・復習 ${rv}`,
      scope: '範囲', all: 'すべて', start: '復習を始める', nothing: '今日の分は終わりました．',
      nextAt: t => `次のカードは ${t}．`, empty: 'まだブックマークがありません．項目の見出しの横の「ブックマーク」を押すと，その項目が復習のカードになります．',
      settings: '設定', perDay: '1 日に新しく出すカード', dirs: 'カードの向き', retention: '覚えている確率の目標',
      retentionNote: '高くするほど復習の間隔が短く，回数が多くなります．ふつうは 90%．',
      data: '記録の保存', dataNote: '記録はこのブラウザにだけ保存されています．別の端末やブラウザに移すときや，控えを取るときは書き出してください．',
      exportJson: '書き出す（JSON）', importJson: '読み込む', exportAnki: 'Anki 用に書き出す（TSV）',
      ankiNote: 'Anki の「ファイル → 読み込む」で読み込み，ノートタイプは「基本（裏表反転カード付き）」を選んでください．1 列目が表，2 列目が裏，3 列目（詳細）は使わない場合「なし」にします．古いハングルを正しく表示するには，Anki を使う端末に Noto Serif CJK KR などの書体が要ります．',
      imported: (b, c) => `読み込みました（ブックマーク ${b} 語，カード ${c} 枚を加えるか更新）．`, importErr: '読み込めませんでした．このサイトから書き出した JSON を選んでください．',
      show: '答えを見る', again: 'もう一度', hard: '難しい', good: '正解', easy: '簡単', undo: '取り消す', back: '戻る', openEntry: '項目を開く',
      left: (nw, lr, rv) => `残り　新しいカード ${nw}・学習中 ${lr}・復習 ${rv}`, keys: 'スペースで答え，1–4 で評価，Z で取り消し',
      lost: '今のデータでは見つかりません（保存した写しを表示しています）', storeErr: 'このブラウザでは記録を保存できません（プライベートモードなど）．',
      soon: '今日はもう新しいカードはありません．学習中のカードがまもなく出ます．',
      ivl: ms => ms < HOUR ? `${Math.max(1, Math.round(ms / MIN))} 分` : ms < DAY ? `${Math.round(ms / HOUR)} 時間` : ms < 30 * DAY ? `${Math.round(ms / DAY)} 日` : ms < 365 * DAY ? `${(ms / DAY / 30).toFixed(1)} か月` : `${(ms / DAY / 365).toFixed(1)} 年`,
      time: ms => new Date(ms).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      bookmarks: n => `ブックマーク ${n}`, backToResults: '検索結果に戻る', tagFilter: 'タグで絞る',
    },
    en: {
      star: 'Bookmark', starred: 'Bookmarked', starTip: 'Bookmark this entry and add it to your review cards', unstarTip: 'Remove the bookmark (your review history is kept)',
      tags: 'Tags', addTag: 'Add a tag', removeTag: t => `Remove the tag “${t}”`,
      open: 'Review', title: 'Bookmarks and review', close: 'Close',
      summary: (b, n) => `${b} bookmarked entr${b === 1 ? 'y' : 'ies'} · ${n} card${n === 1 ? '' : 's'}`,
      today: (nw, lr, rv) => `Today: ${nw} new · ${lr} learning · ${rv} to review`,
      scope: 'Cards from', all: 'All bookmarks', start: 'Start review', nothing: 'You are done for today.',
      nextAt: t => `Next card: ${t}.`, empty: 'No bookmarks yet. Press “Bookmark” next to an entry’s headword to turn it into review cards.',
      settings: 'Settings', perDay: 'New cards per day', dirs: 'Card directions', retention: 'Target recall',
      retentionNote: 'A higher target means shorter intervals and more reviews. 90% is usual.',
      data: 'Your data', dataNote: 'Your bookmarks and review history are stored only in this browser. Export them to move to another device or browser, or to keep a backup.',
      exportJson: 'Export (JSON)', importJson: 'Import', exportAnki: 'Export for Anki (TSV)',
      ankiNote: 'In Anki, use File → Import and choose the note type “Basic (and reversed card)”. Column 1 is the front, column 2 the back; map column 3 (details) to “Nothing” if you do not need it. Old Hangul needs a font such as Noto Serif CJK KR on the device running Anki.',
      imported: (b, c) => `Imported (${b} bookmarks and ${c} cards added or updated).`, importErr: 'Could not import. Choose a JSON file exported from this site.',
      show: 'Show answer', again: 'Again', hard: 'Hard', good: 'Good', easy: 'Easy', undo: 'Undo', back: 'Back', openEntry: 'Open entry',
      left: (nw, lr, rv) => `Left: ${nw} new · ${lr} learning · ${rv} review`, keys: 'Space shows the answer, 1–4 rate, Z undoes',
      lost: 'Not found in the current data (showing the saved copy)', storeErr: 'This browser cannot store your data (private mode?).',
      soon: 'No more new cards today. Cards you are learning will come back shortly.',
      ivl: ms => ms < HOUR ? `${Math.max(1, Math.round(ms / MIN))}m` : ms < DAY ? `${Math.round(ms / HOUR)}h` : ms < 30 * DAY ? `${Math.round(ms / DAY)}d` : ms < 365 * DAY ? `${(ms / DAY / 30).toFixed(1)}mo` : `${(ms / DAY / 365).toFixed(1)}y`,
      time: ms => new Date(ms).toLocaleString('en-GB', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      bookmarks: n => `Bookmarks ${n}`, backToResults: 'Back to results', tagFilter: 'Filter by tag',
    },
  };

  const esc = s => (s ?? '').toString().replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const CSS = `
.ls-star { display: inline-flex; align-items: center; gap: 4px; height: 26px; padding: 0 10px; border: 1px solid var(--rule-strong, #bbb); border-radius: 13px; background: var(--surface, #fff); color: var(--muted, #555); font: inherit; font-size: 12.5px; cursor: pointer; vertical-align: middle; }
.ls-star:hover { border-color: var(--indigo, #2B4C8C); color: var(--indigo, #2B4C8C); }
.ls-star[aria-pressed="true"] { background: var(--ochre, #F0DC95); color: var(--ochre-ink, #6E5612); border-color: transparent; }
.ls-star .ls-ic { font-size: 14px; line-height: 1; }
.ls-bar { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin: 8px 0 2px; }
.ls-tags { display: inline-flex; flex-wrap: wrap; gap: 4px; align-items: center; }
.ls-tag { display: inline-flex; align-items: center; gap: 2px; height: 22px; padding: 0 4px 0 8px; border-radius: 11px; background: var(--indigo-soft, #E3E9F5); color: var(--indigo, #2B4C8C); font-size: 12px; }
.ls-tag button { border: 0; background: none; color: inherit; cursor: pointer; font-size: 13px; padding: 0 4px; line-height: 1; }
.ls-tag-in { height: 24px; width: 9em; padding: 0 8px; border: 1px dashed var(--rule-strong, #bbb); border-radius: 12px; background: transparent; color: var(--ink, #111); font: inherit; font-size: 12px; }
.ls-tag-in:focus { outline: none; border-style: solid; border-color: var(--indigo, #2B4C8C); }
.ls-open .ls-n { display: inline-block; min-width: 18px; height: 16px; line-height: 16px; padding: 0 5px; margin-left: 4px; border-radius: 8px; background: var(--indigo, #2B4C8C); color: var(--surface, #fff); font-size: 11px; text-align: center; }
.ls-open .ls-n:empty { display: none; }
.ls-dlg { width: min(680px, calc(100vw - 24px)); max-height: calc(100vh - 40px); padding: 0; border: 1px solid var(--rule-strong, #bbb); border-radius: 10px; background: var(--surface, #fff); color: var(--ink, #111); box-shadow: 0 24px 60px -20px rgba(0,0,0,.45); }
.ls-dlg::backdrop { background: rgba(20, 26, 32, .45); }
.ls-head { display: flex; justify-content: space-between; align-items: center; padding: 12px 18px; border-bottom: 1px solid var(--rule, #ddd); position: sticky; top: 0; background: var(--surface, #fff); z-index: 1; }
.ls-head h2 { margin: 0; font-size: 15px; }
.ls-x { border: 0; background: none; font-size: 22px; line-height: 1; color: var(--muted, #555); cursor: pointer; padding: 0 4px; }
.ls-body { padding: 16px 18px 20px; }
.ls-body h4 { margin: 20px 0 8px; font-size: 13px; color: var(--muted, #555); font-weight: 600; }
.ls-row { display: flex; flex-wrap: wrap; gap: 8px 14px; align-items: center; margin: 6px 0; }
.ls-row label { display: inline-flex; gap: 6px; align-items: center; }
.ls-note { font-size: 12px; color: var(--faint, #888); margin: 4px 0; }
.ls-big { font-size: 13.5px; }
.ls-btn { height: 34px; padding: 0 14px; border: 1px solid var(--rule-strong, #bbb); border-radius: 4px; background: var(--surface, #fff); color: var(--ink, #111); font: inherit; font-size: 13px; cursor: pointer; }
.ls-btn:hover { border-color: var(--indigo, #2B4C8C); color: var(--indigo, #2B4C8C); }
.ls-btn.pri { background: var(--indigo, #2B4C8C); border-color: var(--indigo, #2B4C8C); color: var(--surface, #fff); font-weight: 600; }
.ls-btn.pri:hover { color: var(--surface, #fff); filter: brightness(1.08); }
.ls-btn:disabled { opacity: .45; cursor: default; }
.ls-in { height: 30px; padding: 0 8px; border: 1px solid var(--rule-strong, #bbb); border-radius: 4px; background: var(--surface, #fff); color: var(--ink, #111); font: inherit; font-size: 13px; }
.ls-in[type="number"] { width: 5.5em; }
.ls-msg { font-size: 12.5px; color: var(--celadon, #4F806B); margin: 6px 0; min-height: 1em; }
.ls-msg.err { color: #B2452F; }
.ls-card { min-height: 160px; padding: 18px; border: 1px solid var(--rule, #ddd); border-radius: 8px; background: var(--surface-2, #f6f6f6); }
.ls-front { text-align: center; padding: 18px 0 8px; }
.ls-answer { border-top: 1px dashed var(--rule-strong, #bbb); margin-top: 14px; padding-top: 12px; }
.ls-rates { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 14px; }
.ls-rates button { height: 50px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1px; border: 1px solid var(--rule-strong, #bbb); border-radius: 6px; background: var(--surface, #fff); color: var(--ink, #111); font: inherit; font-size: 13.5px; font-weight: 600; cursor: pointer; }
.ls-rates button small { font-weight: 400; font-size: 11.5px; color: var(--muted, #555); }
.ls-rates button[data-g="1"] { color: #B2452F; } .ls-rates button[data-g="4"] { color: var(--celadon, #4F806B); }
.ls-rates button:hover { border-color: var(--indigo, #2B4C8C); }
.ls-showrow { display: flex; justify-content: center; margin-top: 14px; }
.ls-showrow .ls-btn { min-width: 50%; height: 44px; }
.ls-foot { display: flex; justify-content: space-between; gap: 10px; flex-wrap: wrap; align-items: center; margin-top: 12px; font-size: 12px; color: var(--faint, #888); }
.ls-foot .ls-links { display: flex; gap: 12px; align-items: center; }
.ls-link { border: 0; background: none; padding: 0; color: var(--indigo, #2B4C8C); font: inherit; cursor: pointer; }
.ls-link:disabled { color: var(--faint, #888); cursor: default; }
.ls-lost { font-size: 12px; color: #B2452F; margin-bottom: 6px; }
.ls-listbar { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; padding: 8px 14px; border-bottom: 1px solid var(--rule, #ddd); font-size: 12.5px; }
.ls-listbar .ls-chip { height: 24px; padding: 0 10px; border: 1px solid var(--rule, #ddd); border-radius: 12px; background: var(--surface, #fff); color: var(--muted, #555); font: inherit; font-size: 12px; cursor: pointer; }
.ls-listbar .ls-chip[aria-pressed="true"] { background: var(--indigo-soft, #E3E9F5); color: var(--indigo, #2B4C8C); border-color: transparent; }
@media (max-width: 560px) { .ls-rates { grid-template-columns: repeat(2, 1fr); } }
`;

  function init(opt) {
    const T = { ...TEXT[opt.lang === 'en' ? 'en' : 'ja'], ...(opt.text || {}) };
    const A = opt.adapter, DIRS = opt.dirs || [{ id: 'f', label: 'front → back' }];
    const KEY = `lexica.study.v1.${opt.site}`;
    const fresh = () => ({ v: 1, site: opt.site, bm: {}, cards: {}, conf: { perDay: 20, dirs: Object.fromEntries(DIRS.map(d => [d.id, true])), ret: 0.9, scope: '' }, days: {} });
    let S = fresh(), storeOk = true;
    const load = () => {
      try { const t = localStorage.getItem(KEY); S = t ? { ...fresh(), ...JSON.parse(t) } : fresh(); S.conf = { ...fresh().conf, ...S.conf }; }
      catch (_) { storeOk = false; }
    };
    const save = () => {
      try { localStorage.setItem(KEY, JSON.stringify(S)); storeOk = true; } catch (_) { storeOk = false; }
    };
    load();

    // ---------- ブックマーク
    const isOn = k => !!S.bm[k];
    function toggle(e) {
      const k = A.key(e);
      if (S.bm[k]) delete S.bm[k];
      else {
        S.bm[k] = { id: e.id, t: Date.now(), tags: [], snap: A.snapshot(e) };
        for (const d of DIRS) { const ck = `${k}#${d.id}`; if (!S.cards[ck]) S.cards[ck] = { k, d: d.id, st: 0, reps: 0, lapses: 0 }; }
      }
      save(); changed();
      return !!S.bm[k];
    }
    function setTags(k, tags) { if (!S.bm[k]) return; S.bm[k].tags = [...new Set(tags.map(t => t.trim()).filter(Boolean))]; save(); changed(); }
    const allTags = () => [...new Set(Object.values(S.bm).flatMap(b => b.tags || []))].sort();
    // 保存したブックマークを今のデータの項目番号に結び直す（DB を作り直して番号が変わっても追える）
    const idOf = k => { const b = S.bm[k]; if (!b) return null; const id = A.resolve(k, b.snap, b.id); if (id != null && id !== b.id) { b.id = id; save(); } return id; };
    function bookmarks(tag) {
      return Object.entries(S.bm).filter(([, b]) => !tag || (b.tags || []).includes(tag))
        .sort((a, b) => b[1].t - a[1].t).map(([k, b]) => ({ key: k, id: idOf(k), snap: b.snap, tags: b.tags || [], t: b.t }));
    }

    // 項目の見出しの横に置く：ブックマークのボタンとタグ
    function bar(e) {
      const k = A.key(e), on = isOn(k);
      const tags = on ? (S.bm[k].tags || []) : [];
      return `<div class="ls-bar" data-ls-key="${esc(k)}"><button type="button" class="ls-star" aria-pressed="${on}" title="${esc(on ? T.unstarTip : T.starTip)}"><span class="ls-ic" aria-hidden="true">${on ? '★' : '☆'}</span>${esc(on ? T.starred : T.star)}</button>` +
        (on ? `<span class="ls-tags">${tags.map(t => `<span class="ls-tag">${esc(t)}<button type="button" data-rm="${esc(t)}" aria-label="${esc(T.removeTag(t))}">×</button></span>`).join('')}` +
          `<input class="ls-tag-in" list="ls-taglist" placeholder="${esc(T.addTag)}" aria-label="${esc(T.addTag)}"></span>` : '') + '</div>';
    }
    function bindBar(root, e) {
      const el = root.querySelector('.ls-bar'); if (!el) return;
      const k = A.key(e), redraw = () => { el.outerHTML = bar(e); bindBar(root, e); };
      el.querySelector('.ls-star').onclick = () => { toggle(e); redraw(); const s = root.querySelector('.ls-star'); s && s.focus(); };
      el.querySelectorAll('[data-rm]').forEach(b => { b.onclick = () => { setTags(k, (S.bm[k].tags || []).filter(t => t !== b.dataset.rm)); redraw(); }; });
      const inp = el.querySelector('.ls-tag-in');
      if (inp) inp.onkeydown = ev => {
        if (ev.key === 'Enter' && !ev.isComposing && inp.value.trim()) {
          ev.preventDefault(); setTags(k, (S.bm[k].tags || []).concat(inp.value.split(/[,，、]/))); redraw();
          const i2 = root.querySelector('.ls-tag-in'); i2 && i2.focus();
        }
      };
      taglist();
    }
    function taglist() {
      let dl = document.getElementById('ls-taglist');
      if (!dl) { dl = document.createElement('datalist'); dl.id = 'ls-taglist'; document.body.appendChild(dl); }
      dl.innerHTML = allTags().map(t => `<option value="${esc(t)}">`).join('');
    }

    // ---------- 復習の順番
    const today = () => dayOf(Date.now());
    const dayRec = () => (S.days[dateKey(today())] ??= { n: 0, r: 0 });
    const inScope = c => { const b = S.bm[c.k]; return b && S.conf.dirs[c.d] && (!S.conf.scope || (b.tags || []).includes(S.conf.scope)); };
    // 同じ項目の別の向きのカードを今日すでに出したか
    const siblingToday = c => DIRS.some(d => d.id !== c.d && (S.cards[`${c.k}#${d.id}`]?.last ?? -Infinity) >= dayStart(today()));
    function queue(now = Date.now()) {
      const learn = [], review = [], fresh = [];
      for (const [ck, c] of Object.entries(S.cards)) {
        if (!inScope(c)) continue;
        if (c.st === 1 || c.st === 3) learn.push(ck);
        else if (c.st === 2 && c.due <= now && !siblingToday(c)) review.push(ck);
        else if (!c.st && !siblingToday(c)) fresh.push(ck);
      }
      const byDue = (a, b) => S.cards[a].due - S.cards[b].due;
      learn.sort(byDue); review.sort(byDue);
      // 新しいカード：ブックマークした順．同じ項目の 2 方向は同じ日に出さないので，項目ごとに 1 枚
      const seen = new Set(), room = Math.max(0, S.conf.perDay - dayRec().n);
      const fr = fresh.sort((a, b) => (S.bm[S.cards[a].k].t - S.bm[S.cards[b].k].t) || DIRS.findIndex(d => d.id === S.cards[a].d) - DIRS.findIndex(d => d.id === S.cards[b].d))
        .filter(ck => { const k = S.cards[ck].k; if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, room);
      const learnNow = learn.filter(ck => S.cards[ck].due <= now);
      return { learn, learnNow, review, fresh: fr };
    }
    function nextCard(now = Date.now()) {
      const q = queue(now);
      if (q.learnNow.length) return q.learnNow[0];
      if (q.review.length) return q.review[0];
      if (q.fresh.length) return q.fresh[0];
      // ほかに何もなければ，20 分以内に戻ってくる学習中のカードを先に出す（Anki と同じ）
      if (q.learn.length && S.cards[q.learn[0]].due <= now + 20 * MIN) return q.learn[0];
      return null;
    }
    const counts = () => { const q = queue(); return { nw: q.fresh.length, lr: q.learnNow.length, rv: q.review.length, later: q.learn.filter(ck => S.cards[ck].due > Date.now()).map(ck => S.cards[ck].due) }; };

    // ---------- 画面：上の「復習」ボタン
    const style = document.createElement('style'); style.textContent = CSS; document.head.appendChild(style);
    let btn = null;
    function mountButton(el) {
      btn = el; btn.classList.add('ls-open'); btn.innerHTML = `${esc(T.open)}<span class="ls-n"></span>`; btn.title = T.title;
      btn.onclick = () => openDialog(); badge();
    }
    function badge() { if (!btn) return; const c = counts(); const n = c.nw + c.lr + c.rv; btn.querySelector('.ls-n').textContent = n ? String(n) : ''; }
    setInterval(badge, MIN);

    // ---------- 画面：ダイアログ
    const dlg = document.createElement('dialog'); dlg.className = 'ls-dlg'; document.body.appendChild(dlg);
    dlg.addEventListener('close', () => { view = null; badge(); });
    let view = null, cur = null, shown = false, undoStack = [], msg = '';
    function openDialog() { view = 'home'; render(); if (!dlg.open) dlg.showModal(); }
    const head = () => `<div class="ls-head"><h2>${esc(T.title)}</h2><button type="button" class="ls-x" aria-label="${esc(T.close)}" data-act="close">×</button></div>`;
    function render() {
      if (view === 'review') return renderReview();
      const c = counts(), nb = Object.keys(S.bm).length, nc = Object.values(S.cards).filter(x => S.bm[x.k] && S.conf.dirs[x.d]).length, tags = allTags();
      const nextT = c.later.length ? Math.min(...c.later) : null;
      dlg.innerHTML = head() + `<div class="ls-body">
        ${storeOk ? '' : `<p class="ls-msg err">${esc(T.storeErr)}</p>`}
        ${nb ? `<p class="ls-big">${esc(T.summary(nb, nc))}<br>${esc(T.today(c.nw, c.lr, c.rv))}</p>` : `<p class="ls-big">${esc(T.empty)}</p>`}
        ${tags.length ? `<div class="ls-row"><label>${esc(T.scope)} <select class="ls-in" data-k="scope"><option value="">${esc(T.all)}</option>${tags.map(t => `<option${t === S.conf.scope ? ' selected' : ''}>${esc(t)}</option>`).join('')}</select></label></div>` : ''}
        <div class="ls-row"><button type="button" class="ls-btn pri" data-act="start"${nextCard() ? '' : ' disabled'}>${esc(T.start)}</button>
          ${nb && !nextCard() ? `<span class="ls-note">${esc(T.nothing)}${nextT ? ' ' + esc(T.nextAt(T.time(nextT))) : ''}</span>` : ''}</div>
        <h4>${esc(T.settings)}</h4>
        <div class="ls-row"><label>${esc(T.perDay)} <input class="ls-in" type="number" min="0" max="999" data-k="perDay" value="${S.conf.perDay}"></label></div>
        <div class="ls-row"><span>${esc(T.dirs)}</span>${DIRS.map(d => `<label><input type="checkbox" data-dir="${esc(d.id)}"${S.conf.dirs[d.id] ? ' checked' : ''}> ${d.label}</label>`).join('')}</div>
        <div class="ls-row"><label>${esc(T.retention)} <input class="ls-in" type="number" min="70" max="99" data-k="ret" value="${Math.round(S.conf.ret * 100)}"> %</label></div>
        <p class="ls-note">${esc(T.retentionNote)}</p>
        <h4>${esc(T.data)}</h4>
        <p class="ls-note">${esc(T.dataNote)}</p>
        <div class="ls-row"><button type="button" class="ls-btn" data-act="export">${esc(T.exportJson)}</button><button type="button" class="ls-btn" data-act="import">${esc(T.importJson)}</button>
          <button type="button" class="ls-btn" data-act="anki"${nb ? '' : ' disabled'}>${esc(T.exportAnki)}</button><input type="file" accept=".json,application/json" hidden></div>
        <p class="ls-msg${msg.startsWith('!') ? ' err' : ''}">${esc(msg.replace(/^!/, ''))}</p>
        <p class="ls-note">${esc(T.ankiNote)}</p></div>`;
      msg = '';
      dlg.querySelector('[data-k="scope"]')?.addEventListener('change', ev => { S.conf.scope = ev.target.value; save(); render(); badge(); });
      dlg.querySelector('[data-k="perDay"]').addEventListener('change', ev => { S.conf.perDay = Math.max(0, Math.min(999, +ev.target.value || 0)); save(); render(); badge(); });
      dlg.querySelector('[data-k="ret"]').addEventListener('change', ev => { S.conf.ret = Math.max(0.7, Math.min(0.99, (+ev.target.value || 90) / 100)); save(); render(); });
      dlg.querySelectorAll('[data-dir]').forEach(cb => cb.addEventListener('change', () => { S.conf.dirs[cb.dataset.dir] = cb.checked; save(); render(); badge(); }));
      const file = dlg.querySelector('input[type=file]');
      file.addEventListener('change', () => { const f = file.files[0]; if (f) f.text().then(importJson).catch(() => { msg = '!' + T.importErr; render(); }); });
      dlg.querySelectorAll('[data-act]').forEach(b => b.addEventListener('click', () => act(b.dataset.act)));
    }
    function act(a) {
      if (a === 'close') dlg.close();
      else if (a === 'start') { view = 'review'; undoStack = []; pick(); render(); }
      else if (a === 'home') { view = 'home'; render(); }
      else if (a === 'export') download(`lexica-${opt.site}-${dateKey(today())}.json`, JSON.stringify({ ...S, exported: new Date().toISOString() }, null, 1), 'application/json');
      else if (a === 'import') dlg.querySelector('input[type=file]').click();
      else if (a === 'anki') exportAnki();
      else if (a === 'show') { shown = true; renderReview(); }
      else if (a === 'undo') undo();
    }
    function download(name, text, type) {
      const url = URL.createObjectURL(new Blob([text], { type }));
      const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    }
    // 読み込み：今の記録と合わせる（ブックマークは両方を残し，カードは最後に復習した日が新しいほう）
    function importJson(text) {
      let d; try { d = JSON.parse(text); } catch (_) { d = null; }
      if (!d || typeof d !== 'object' || !d.bm || !d.cards || (d.site && d.site !== opt.site)) { msg = '!' + T.importErr; render(); return; }
      let nb = 0, nc = 0;
      for (const [k, b] of Object.entries(d.bm)) {
        const mine = S.bm[k];
        if (!mine) { S.bm[k] = b; nb++; } else { const tags = [...new Set([...(mine.tags || []), ...(b.tags || [])])]; if (tags.length !== (mine.tags || []).length) nb++; mine.tags = tags; mine.t = Math.min(mine.t, b.t); }
      }
      for (const [ck, c] of Object.entries(d.cards)) { const mine = S.cards[ck]; if (!mine || (c.last || 0) > (mine.last || 0)) { S.cards[ck] = c; nc++; } }
      for (const [dk, r] of Object.entries(d.days || {})) { const m = S.days[dk]; S.days[dk] = m ? { n: Math.max(m.n, r.n), r: Math.max(m.r, r.r) } : r; }
      save(); changed(true); msg = T.imported(nb, nc); render(); badge();
    }
    async function exportAnki() {
      const q = v => `"${String(v ?? '').replace(/[\t\r\n]+/g, ' ').replace(/"/g, '""')}"`;
      const rows = [];
      for (const b of bookmarks(S.conf.scope)) {
        let e = null; try { if (b.id != null) e = await A.load(b.id); } catch (_) { e = null; }
        const [front, back, detail] = A.anki(e, b.snap);
        rows.push([front, back, detail, [opt.ankiTag || `Lexica_${opt.site}`].concat(b.tags.map(t => t.replace(/\s+/g, '_'))).join(' ')].map(q).join('\t'));
      }
      download(`lexica-${opt.site}-anki-${dateKey(today())}.txt`, `#separator:tab\n#html:true\n#tags column:4\n` + rows.join('\n') + '\n', 'text/tab-separated-values');
    }

    // ---------- 復習の画面
    function pick() { cur = nextCard(); shown = false; }
    async function renderReview() {
      const c = counts();
      if (!cur) {
        const nextT = c.later.length ? Math.min(...c.later) : null;
        dlg.innerHTML = head() + `<div class="ls-body"><div class="ls-card"><div class="ls-front"><p class="ls-big">${esc(T.nothing)}</p>${nextT ? `<p class="ls-note">${esc(T.nextAt(T.time(nextT)))}</p>` : ''}</div></div>
          <div class="ls-foot"><span></span><span class="ls-links"><button type="button" class="ls-link" data-act="undo"${undoStack.length ? '' : ' disabled'}>${esc(T.undo)}</button><button type="button" class="ls-link" data-act="home">${esc(T.back)}</button></span></div></div>`;
        dlg.querySelectorAll('[data-act]').forEach(b => b.addEventListener('click', () => act(b.dataset.act)));
        return;
      }
      const card = S.cards[cur], b = S.bm[card.k], id = idOf(card.k), mine = cur;
      let e = null; try { if (id != null) e = await A.load(id); } catch (_) { e = null; }
      if (mine !== cur || view !== 'review') return;
      const { front, back } = A.card(e, card.d, b.snap);
      const pv = preview(card, Date.now(), S.conf.ret);
      const names = [T.again, T.hard, T.good, T.easy];
      dlg.innerHTML = head() + `<div class="ls-body">
        <div class="ls-note">${esc(T.left(c.nw, c.lr, c.rv))}</div>
        <div class="ls-card">${e ? '' : `<div class="ls-lost">${esc(T.lost)}</div>`}<div class="ls-front">${front}</div>${shown ? `<div class="ls-answer">${back}</div>` : ''}</div>
        ${shown ? `<div class="ls-rates">${pv.map((p, i) => `<button type="button" data-g="${i + 1}">${esc(names[i])}<small>${esc(T.ivl(p.wait))}</small></button>`).join('')}</div>`
          : `<div class="ls-showrow"><button type="button" class="ls-btn pri" data-act="show">${esc(T.show)}</button></div>`}
        <div class="ls-foot"><span>${esc(T.keys)}</span><span class="ls-links">${id != null && A.url ? `<a href="${esc(A.url(id))}" target="_blank" rel="noopener">${esc(T.openEntry)}</a>` : ''}
          <button type="button" class="ls-link" data-act="undo"${undoStack.length ? '' : ' disabled'}>${esc(T.undo)}</button><button type="button" class="ls-link" data-act="home">${esc(T.back)}</button></span></div></div>`;
      dlg.querySelectorAll('[data-act]').forEach(x => x.addEventListener('click', () => act(x.dataset.act)));
      dlg.querySelectorAll('.ls-rates button').forEach(x => x.addEventListener('click', () => rate(+x.dataset.g)));
      (dlg.querySelector('.ls-showrow .ls-btn') || dlg.querySelector('.ls-rates button[data-g="3"]'))?.focus({ preventScroll: true });
    }
    function rate(g) {
      if (!cur || !shown) return;
      const c = S.cards[cur], now = Date.now(), rec = dayRec();
      undoStack.push({ ck: cur, card: { ...c }, rec: { ...rec } });
      if (undoStack.length > 50) undoStack.shift();
      S.cards[cur] = preview(c, now, S.conf.ret)[g - 1].card;
      if (!c.st) rec.n++; else rec.r++;
      save(); pick(); renderReview(); badge();
    }
    function undo() {
      const u = undoStack.pop(); if (!u) return;
      S.cards[u.ck] = u.card; S.days[dateKey(today())] = u.rec; save();
      view = 'review'; cur = u.ck; shown = false; renderReview(); badge();
    }
    dlg.addEventListener('keydown', ev => {
      if (view !== 'review' || ev.target.matches('input, select, textarea') || ev.ctrlKey && ev.key !== 'z' || ev.metaKey || ev.altKey) return;
      if ((ev.key === ' ' || ev.key === 'Enter') && cur && !shown) { ev.preventDefault(); act('show'); }
      else if (/^[1-4]$/.test(ev.key) && shown) { ev.preventDefault(); rate(+ev.key); }
      else if (ev.key === 'z' || ev.key === 'Z') { ev.preventDefault(); undo(); }
    });

    // 別のタブでの変更を取り込む
    window.addEventListener('storage', ev => { if (ev.key === KEY) { load(); changed(true); if (view === 'home') render(); } });
    function changed(external) { badge(); taglist(); try { A.changed && A.changed(!!external); } catch (_) { /* なし */ } }

    return { bar, bindBar, mountButton, open: openDialog, bookmarks, allTags, isOn, count: () => Object.keys(S.bm).length, text: T, _state: () => S, _preview: preview };
  }

  window.LexicaStudy = { init, _fsrs: { step, preview, interval, dayOf, dayStart } };
})();
