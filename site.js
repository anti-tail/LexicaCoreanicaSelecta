/* Lexica Coreanica — 中期・近世朝鮮語の静的検索（データは data/ の JSON） */
(() => {
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const esc = s => (s ?? '').toString().replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // 表示の言語：<html lang="en"> の英語版（export_site.py --lang en）では英語の表示と英語訳（data/en/）
  const LANG = (document.documentElement.lang || 'ja').startsWith('en') ? 'en' : 'ja';
  const TX = {
    ja: {
      vname: { LMK15: '15 世紀', LMK16: '16 世紀', OLD: '옛말', EMK17: '17 世紀', EMK18: '18 世紀', EMK19: '19 世紀' },
      nItems: n => `${n} 項目`, top300: '（上位 300）', searched: how => `　${how}探しました`,
      how: { yale: 'Yale で', tr: '日本語訳で', both: 'Yale と英語訳で', era: '形（時代ごとの綴りの揺れを吸収）と見出しで', syl: '形（音節の組み方を吸収）と見出しで', exact: '形（表記どおり）と見出しで' },
      none: '見つかりません．綴りを短くするか，時代の絞り込みや照合のしかたを変えてください．',
      forms: '時代ごとの形', thForms: ['時代', '形', 'Yale（参考）', '声調'], cites: '用例', thCites: ['時代', '年', '出典', '用例'],
      source: tr => `出典：우리말샘（国立国語院）の歴史情報${tr ? '，日本語訳は 한국어기초사전' : ''}．CC BY-SA 2.0 KR．`, openOD: '우리말샘 で開く',
      mapAria: '方言形の分布', outside: '（地図の外）', dial: '方言形', dialN: (g, r) => `${g} 形・${r} 地域`,
      dialNote: '우리말샘 で同じ現代語に結ばれた方言項目の形．地域は 우리말샘 の地域区分（道単位）で，点はその代表地点．凡例を選ぶとその形だけを強調します．地図：Natural Earth を簡略化．',
      sep: '，', trBtn: '訳', trAria: '日本語訳', look: '引く', looking: '引いています…', asOld: f => `中期・近世の形 <span class="hangul">${f}</span> として`,
      asModern: '現代語として（한국어기초사전）', trNone: '見つかりませんでした．語尾を外した形に直して「引く」を押してください．', searchThis: 'この語で検索',
      naver: q => `<a href="https://ja.dict.naver.com/#/search?query=${encodeURIComponent(q)}" target="_blank" rel="noopener">NAVER 韓日辞典で開く</a>`,
      meta: (m) => `${m.entries.toLocaleString()} 項目・${m.forms.toLocaleString()} 形・${m.citations.toLocaleString()} 用例（${m.built} 作成）`,
      loadErr: 'データを読み込めませんでした．ページをウェブサーバー経由で開いてください（file:// では読めません）．',
      light: '明るい表示にする', dark: '暗い表示にする',
      report: '誤りを報告', reportTip: '訳や形の対応付けの誤りを GitHub の Issue で知らせる（GitHub のアカウントが要ります）',
      fixed: '訂正済み', fixedTip: '協力者による訂正（corrections/translations.tsv）', hidden: '訂正で除外', origTr: '元の訳',
      // 方言の検索
      rn: { HG: '咸鏡', HB: '咸北', HN: '咸南', PA: '平安', PB: '平北', PN: '平南', HH: '黄海', KW: '江原', KG: '京畿', CC: '忠清', CB: '忠北', CN: '忠南',
        GS: '慶尚', GB: '慶北', GN: '慶南', JL: '全羅', JB: '全北', JN: '全南', JJ: '済州', 'CN-JIL': '吉林', 'CN-LIA': '遼寧', 'CN-HEI': '黒龍江', CA: '中央アジア' },
      rgGroup: { CN: '中国', CA: '中央アジア' }, rgWhole: n => `${n}（道の区別なし）`,
      dHow: { form: '方言形で', std: '現代語の見出しと語釈で', auto: '方言形と現代語の見出しで', tr: '日本語訳で', en: '英語訳で', browse: '地域で' },
      dNone: '見つかりません．地域を広げるか，綴りを短くしてください．', dStart: n => `${n} 語群．語を入れるか，地域を選んでください．`,
      dItems: n => `${n} 語群`, dRegions: n => (n ? `${n} 地域` : 'すべての地域'), more: n => `さらに表示（残り ${n}）`,
      dLoose: '標準語に結ばれていない方言項目', dLooseTip: '우리말샘 で現代語の項目に結ばれていない方言項目．語釈と品詞が同じものをまとめています．',
      byRegion: '地域ごとの形', thByRegion: ['地域', '形'], toHist: '中期・近世の形を見る', toDial: 'この意味の方言をすべて見る（方言の検索）',
      sameTr: '同じ訳を持つ別の語群', sameGloss: '語釈の同じ語群', dSource: tr => `出典：우리말샘（国立国語院）の方言項目${tr ? '，日本語訳は 한국어기초사전' : ''}．CC BY-SA 2.0 KR．`,
      pickTitle: '地図で地域を選ぶ', pickNote: '道を押すと選び，もう一度押すと外します．点は地図の枠の外の地域や道全体の記録です．語を入れずに地域だけ選ぶと，その地域の方言形を一覧にします．',
      pickN: (g, f) => `${g} 語群・${f} 形`, dUsage: '使い方', dDial: '方言形', dMeta: d => `方言 ${d.groups.toLocaleString()} 語群・${d.forms.toLocaleString()} 形`,
      dPlaceholder: '정지　부엌　台所', dTips: [
        ['方言形で引く：', ['정지', '가매', '새미']],
        ['現代語の見出しで，その意味の方言形を見る：', ['부엌', '가위', '부추']],
        ['日本語訳で引く：', ['台所', 'はさみ', 'とうもろこし']],
      ],
    },
    en: {
      vname: { LMK15: '15th c.', LMK16: '16th c.', OLD: 'Old (undated)', EMK17: '17th c.', EMK18: '18th c.', EMK19: '19th c.' },
      nItems: n => `${n} entr${n === '1' ? 'y' : 'ies'}`, top300: ' (top 300)', searched: how => ` — matched ${how}`,
      how: { yale: 'by Yale', tr: 'by English translation', both: 'by English translation and Yale', era: 'by form (allowing each century’s spelling variation) and headword', syl: 'by form (ignoring syllable division) and headword', exact: 'by form (exact spelling) and headword' },
      none: 'Nothing found. Try a shorter spelling, more centuries, or another matching mode.',
      forms: 'Forms by period', thForms: ['Period', 'Form', 'Yale (ref.)', 'Tone'], cites: 'Citations', thCites: ['Period', 'Year', 'Source', 'Citation'],
      source: tr => `Sources: historical data of 우리말샘 (National Institute of Korean Language)${tr ? '; English from 한국어기초사전' : ''}. CC BY-SA 2.0 KR. `, openOD: 'Open in 우리말샘',
      mapAria: 'Distribution of dialect forms', outside: ' (off the map)', dial: 'Dialect forms', dialN: (g, r) => `${g} form${g === 1 ? '' : 's'} · ${r} region${r === 1 ? '' : 's'}`,
      dialNote: 'Forms of dialect entries linked to the same modern word in 우리말샘. Regions follow 우리말샘 (provinces); each dot is a representative point. Select a legend item to highlight that form. Map: simplified Natural Earth.',
      sep: ', ', trBtn: 'EN', trAria: 'English translation', look: 'Look up', looking: 'Looking up…', asOld: f => `As the Middle/Early Modern form <span class="hangul">${f}</span>`,
      asModern: 'As modern Korean (한국어기초사전)', trNone: 'Nothing found. Remove the ending and press “Look up”.', searchThis: 'Search this word',
      naver: q => `<a href="https://en.dict.naver.com/#/search?query=${encodeURIComponent(q)}" target="_blank" rel="noopener">Open in NAVER Korean–English Dictionary</a>`,
      meta: (m) => `${m.entries.toLocaleString()} entries · ${m.forms.toLocaleString()} forms · ${m.citations.toLocaleString()} citations (built ${m.built})`,
      loadErr: 'Could not load the data. Open the page through a web server (file:// does not work).',
      light: 'Light theme', dark: 'Dark theme',
      report: 'Report an error', reportTip: 'Report a wrong translation or form assignment as a GitHub Issue (needs a GitHub account)',
      fixed: 'corrected', fixedTip: 'Corrected by a collaborator (corrections/translations.tsv)', hidden: 'removed by correction', origTr: 'original',
      rn: { HG: 'Hamgyeong', HB: 'N. Hamgyeong', HN: 'S. Hamgyeong', PA: 'Pyeongan', PB: 'N. Pyeongan', PN: 'S. Pyeongan', HH: 'Hwanghae', KW: 'Gangwon', KG: 'Gyeonggi', CC: 'Chungcheong', CB: 'N. Chungcheong', CN: 'S. Chungcheong',
        GS: 'Gyeongsang', GB: 'N. Gyeongsang', GN: 'S. Gyeongsang', JL: 'Jeolla', JB: 'N. Jeolla', JN: 'S. Jeolla', JJ: 'Jeju', 'CN-JIL': 'Jilin', 'CN-LIA': 'Liaoning', 'CN-HEI': 'Heilongjiang', CA: 'Central Asia' },
      rgGroup: { CN: 'China', CA: 'Central Asia' }, rgWhole: n => `${n} (province not specified)`,
      dHow: { form: 'by dialect form', std: 'by modern headword and definition', auto: 'by dialect form and modern headword', tr: 'by Japanese translation', en: 'by English translation', browse: 'by region' },
      dNone: 'Nothing found. Try more regions or a shorter spelling.', dStart: n => `${n} word groups. Type a word or choose regions.`,
      dItems: n => `${n} word group${n === '1' ? '' : 's'}`, dRegions: n => (n ? `${n} region${n > 1 ? 's' : ''}` : 'All regions'), more: n => `Show more (${n} left)`,
      dLoose: 'Dialect entry not linked to a standard word', dLooseTip: 'Dialect entries of 우리말샘 not linked to a modern entry, grouped when their definition and part of speech are the same.',
      byRegion: 'Forms by region', thByRegion: ['Region', 'Forms'], toHist: 'See Middle/Early Modern forms', toDial: 'See all dialect forms of this meaning (dialect search)',
      sameTr: 'Other word groups with the same translation', sameGloss: 'Word groups with the same definition', dSource: tr => `Sources: dialect entries of 우리말샘 (National Institute of Korean Language)${tr ? '; English from 한국어기초사전' : ''}. CC BY-SA 2.0 KR. `,
      pickTitle: 'Choose regions on the map', pickNote: 'Click a province to select it, again to remove it. Dots are regions off the map or records for a whole province. Choosing regions without a word lists the dialect forms of those regions.',
      pickN: (g, f) => `${g} word groups · ${f} forms`, dUsage: 'How to use', dDial: 'Dialect forms', dMeta: d => `Dialects: ${d.groups.toLocaleString()} word groups · ${d.forms.toLocaleString()} forms`,
      dPlaceholder: '정지　부엌　kitchen', dTips: [
        ['By dialect form: ', ['정지', '가매', '새미']],
        ['By modern headword, to see its dialect forms: ', ['부엌', '가위', '부추']],
        ['By English: ', ['kitchen', 'scissors', 'corn']],
      ],
    },
  }[LANG];
  const VNAME = TX.vname;
  TX.hPlaceholder = document.querySelector('#q')?.placeholder || '';
  // 英語版は en/ にあり，データは 1 つ上（<meta name="lexica-base" content="../">）．一覧の行の訳は日本語 3 番目，英語 9 番目
  const BASE = document.querySelector('meta[name="lexica-base"]')?.content || '';
  const REPO = document.querySelector('meta[name="lexica-repo"]')?.content || 'https://github.com/anti-tail/LexicaCoreanicaSelecta';
  const TRI = LANG === 'en' ? 9 : 3, TRSEP = LANG === 'en' ? '; ' : '；';
  const VCLS = { LMK15: 'L', LMK16: 'L', OLD: 'O', EMK17: 'E', EMK18: 'E', EMK19: 'E' };
  const vtag = v => `<span class="tag v-${VCLS[v] || ''}">${esc(VNAME[v] || v)}</span>`;
  const HIST = ['LMK15', 'LMK16', 'OLD', 'EMK17', 'EMK18', 'EMK19'];              // data の世紀番号（0–5）
  const ERA = [15, 16, 0, 17, 18, 19];                                             // 世紀番号 → 照合規則（0 = OLD：全世紀で試す）
  let INDEX = [], META = {}, SHARDS = {}, current = null;

  // ---------- 表記の正規化：NFD，傍点を除く，互換字母を結合字母に（ㅁㆍㅿㆍㅁ → ᄆᆞᅀᆞᆷ）
  const CHO = { 'ㄱ': 0x1100, 'ㄲ': 0x1101, 'ㄴ': 0x1102, 'ㄷ': 0x1103, 'ㄸ': 0x1104, 'ㄹ': 0x1105, 'ㅁ': 0x1106, 'ㅂ': 0x1107, 'ㅃ': 0x1108, 'ㅅ': 0x1109, 'ㅆ': 0x110A, 'ㅇ': 0x110B, 'ㅈ': 0x110C, 'ㅉ': 0x110D, 'ㅊ': 0x110E, 'ㅋ': 0x110F, 'ㅌ': 0x1110, 'ㅍ': 0x1111, 'ㅎ': 0x1112,
    'ㅿ': 0x1140, 'ㆁ': 0x114C, 'ㅸ': 0x112B, 'ㆆ': 0x1159, 'ㅄ': 0x1121, 'ㅴ': 0x1122, 'ㅵ': 0x1123, 'ㅳ': 0x1120, 'ㅶ': 0x1127, 'ㅷ': 0x1129, 'ㅺ': 0x112D, 'ㅻ': 0x112E, 'ㅼ': 0x112F, 'ㅽ': 0x1132, 'ㅾ': 0x1136, 'ㆀ': 0x1147, 'ㆅ': 0x1158, 'ㅹ': 0x112C };
  const JONG = { 'ㄱ': 0x11A8, 'ㄲ': 0x11A9, 'ㄳ': 0x11AA, 'ㄴ': 0x11AB, 'ㄵ': 0x11AC, 'ㄶ': 0x11AD, 'ㄷ': 0x11AE, 'ㄹ': 0x11AF, 'ㄺ': 0x11B0, 'ㄻ': 0x11B1, 'ㄼ': 0x11B2, 'ㄽ': 0x11B3, 'ㄾ': 0x11B4, 'ㄿ': 0x11B5, 'ㅀ': 0x11B6, 'ㅁ': 0x11B7, 'ㅂ': 0x11B8, 'ㅄ': 0x11B9, 'ㅅ': 0x11BA, 'ㅆ': 0x11BB, 'ㅇ': 0x11BC, 'ㅈ': 0x11BD, 'ㅊ': 0x11BE, 'ㅋ': 0x11BF, 'ㅌ': 0x11C0, 'ㅍ': 0x11C1, 'ㅎ': 0x11C2,
    'ㅿ': 0x11EB, 'ㆁ': 0x11F0, 'ㅸ': 0x11E6, 'ㆆ': 0x11F9 };
  const VOW = { 'ㆍ': 0x119E, 'ㆎ': 0x11A1 };
  'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ'.split('').forEach((c, i) => { VOW[c] = 0x1161 + i; });
  const J2C = {}; Object.keys(JONG).forEach(k => { if (CHO[k] !== undefined) J2C[String.fromCharCode(JONG[k])] = CHO[k]; });
  const isVowel = ch => ch && (VOW[ch] !== undefined || (ch >= 'ᅠ' && ch <= 'ᆧ') || (ch >= 'ힰ' && ch <= 'ퟆ'));
  const isLeadOrVowelEnd = ch => ch && ((ch >= 'ᅠ' && ch <= 'ᇿ') || (ch >= 'ힰ' && ch <= '퟿') || VOW[ch] !== undefined);
  function normalize(s) { return compose((s || '').replace(/[\u302E\u302F\u00B7]/g, '').replace(/\s+/g, '')); }
  function compose(s) {
    const a = [...(s || '').normalize('NFD')];
    let out = '';
    for (let i = 0; i < a.length; i++) {
      const ch = a[i], next = a[i + 1], prev = out.slice(-1);
      if (VOW[ch] !== undefined || (ch >= '\u1160' && ch <= '\u11A7')) {
        // 母音の前の終声は次の音節の初声に移す（ᄆᆞᇫ + ㆍ → ᄆᆞᅀᆞ）
        if (J2C[prev] !== undefined) out = out.slice(0, -1) + String.fromCharCode(J2C[prev]);
        out += VOW[ch] !== undefined ? String.fromCharCode(VOW[ch]) : ch;
      }
      else if (CHO[ch] !== undefined || JONG[ch] !== undefined) {
        if (isVowel(next) && CHO[ch] !== undefined) out += String.fromCharCode(CHO[ch]);
        else if (isLeadOrVowelEnd(prev) && JONG[ch] !== undefined) out += String.fromCharCode(JONG[ch]);
        else out += String.fromCharCode(CHO[ch] ?? JONG[ch]);
      } else out += ch;
    }
    return out;
  }

  // ---------- 検索
  // 形の照合は 3 通り（#mode）：
  //   era   時代ごと：形の世紀の規則で問いと形を揃える（hkey.js．音節の組み方と，その世紀に合流した字母・綴りを吸収）
  //   syl   音節の組み方だけ：連綴・分綴・重綴と零の ㅇ だけを吸収
  //   exact 表記どおり：傍点だけを除いた字母列の部分一致
  const sel = () => new Set($$('.stages input:checked').map(i => +i.value));
  const mode = () => $('#mode').value;
  const SYLKEY = new Map();
  const sylKey = f => { let k = SYLKEY.get(f); if (k === undefined) SYLKEY.set(f, k = HKey.key(f, 0)); return k; };
  // index の行の形を [世紀番号, 字母列, 照合キー（OLD は 5 つ）] に（初回だけ）
  function rowForms(row) {
    if (row._f) return row._f;
    const ks = (row[8] || '').split('|');
    return (row._f = (row[4] ? row[4].split('|') : []).map((x, i) => [+x[0], x.slice(1), (ks[i] || '').split(',')]));
  }
  function queryKeys(q) {
    return { q, k0: HKey.key(q, 0), era: Object.fromEntries(HKey.ERAS.map(e => [e, HKey.key(q, e)])) };
  }
  const cmp = (f, q, a, b, c) => !q ? 0 : f === q ? a : f.startsWith(q) ? b : f.includes(q) ? c : 0;
  // 形と問いのキーの組（照合のしかたと形の世紀による．OLD は 15–19 世紀の 5 組）
  function pairs([vi, f, ks], Q, m) {
    if (m === 'exact') return [[f, Q.q]];
    if (m === 'syl') return [[sylKey(f), Q.k0]];
    return ERA[vi] ? [[ks[0], Q.era[ERA[vi]]]] : HKey.ERAS.map((e, i) => [ks[i], Q.era[e]]);
  }
  // 問いが「形＋助詞・語尾」のとき（사ᄅᆞᄆᆞᆯ → 사ᄅᆞᆷ）：形のキーが問いのキーの頭に一致する長さ（3 分節以上）
  function stemLen(f, Q, m) {
    let L = 0;
    for (const [fk, qk] of pairs(f, Q, m)) if (fk && qk && fk.length < qk.length && fk.length >= 3 && qk.startsWith(fk)) L = Math.max(L, fk.length / qk.length);
    return L;
  }
  // 1 つの形と問いの一致度（0 は不一致）
  function formScore(f, Q, m) {
    let s = cmp(f[1], Q.q, 6, 4, 2.2);                 // 表記どおりの一致は常に上位
    for (const [fk, qk] of pairs(f, Q, m)) s = Math.max(s, cmp(fk, qk, 5, 3.5, 2));
    const L = stemLen(f, Q, m);
    return L ? Math.max(s, 2.5 + L) : s;
  }
  function score(row, q, kind, st, Q) {
    const [, hw, , , , yale, stages, gl] = row, ja = row[TRI] || '';
    let s = 0;
    if (kind === 'yale' || kind === 'tr' || kind === 'both') {
      if (![...stages].some(c => st.has(+c))) return 0;
      if (kind !== 'tr') {
        for (const y of yale.split('|')) { if (!y) continue; if (y === q) s = Math.max(s, 4); else if (y.startsWith(q)) s = Math.max(s, 3); else if (y.includes(q)) s = Math.max(s, 1.5); }
      }
      if (kind === 'tr' && ja.includes(q)) s = ja.startsWith(q) ? 3 : 2;
      if (kind === 'both' && ja) s = Math.max(s, enScore(ja, q));
      return s;
    }
    const m = mode();
    for (const f of rowForms(row)) if (st.has(f[0])) s = Math.max(s, formScore(f, Q, m));
    if (![...stages].some(c => st.has(+c))) return s;
    const h = hw.normalize('NFD');
    if (h === q) s = Math.max(s, 4.5); else if (h.startsWith(q)) s = Math.max(s, 2.5); else if (h.includes(q)) s = Math.max(s, 1.2);
    if (!s && gl && gl.normalize('NFD').includes(q)) s = 0.5;
    return s;
  }
  // 英語訳の一致度：訳語のどれかと完全一致（to を除いて）> 語の単位で一致 > 前方一致．訳語は '; ' 区切り
  const EN_RE = new Map();
  function enScore(tr, q) {
    let re = EN_RE.get(q);
    if (!re) { re = new RegExp(`(^|[^a-z])${q.replace(/^(to|a|an|the) /, '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[^a-z])`); EN_RE.set(q, re); }
    const t = tr.toLowerCase(), qc = q.replace(/^(to|a|an|the) /, '');
    let s = 0;
    for (const item of t.split(/\s*[;,]\s*/)) {
      const w = item.replace(/^(to|a|an|the) /, '').replace(/\s*\(.*?\)\s*/g, ' ').trim();
      if (w === qc || item === q) return 4.2;
      if (re.test(item)) s = Math.max(s, item.split(' ').length <= 3 ? 3.2 : 2.4);
      else if (w.startsWith(q)) s = Math.max(s, 1.6);
    }
    return s;
  }
  let lastQ = null;
  // 一覧の行（検索結果とブックマークで共通）．m：今の問いに当たった形（先に並べる）
  function rowHtml(r, st, m) {
    const fs = rowForms(r);
    const shown = [...new Set((m && m.length ? m : fs.filter(f => st.has(f[0]))).concat(fs).map(f => f[1].normalize('NFC')))].slice(0, 4);
    return `<li class="item" data-id="${r[0]}" tabindex="0" aria-selected="${r[0] === current}">
        <div class="item-head"><span class="item-hw">${esc(r[1])}</span>${r[2] ? `<span class="faint">「${r[2]}」</span>` : ''}<span class="item-old">${shown.map(esc).join('　')}</span>${Study && Study.isOn(bmKey(r[1], r[2])) ? '<span class="item-bm" aria-hidden="true">★</span>' : ''}</div>
        ${r[TRI] ? `<div class="item-ja">${esc(r[TRI])}</div>` : ''}${r[7] ? `<div class="item-gl">${esc(r[7])}</div>` : ''}</li>`;
  }
  // 一覧の行を開く．ブックマークの一覧では歴史形の項目と方言の語群が混じるので，行の data-kind で開き方を分ける
  async function openRow(li) {
    const id = +li.dataset.id, k = li.dataset.kind || (TAB === 'd' ? 'd' : 'h');
    if (k !== TAB) { await setTab(k, false); hashKey = ''; }
    if (k === 'd') dopen(id); else open(id);
    $$('#results .item[data-id]').forEach(x => x.setAttribute('aria-selected', x === li));
  }
  const bindRows = () => $$('#results .item[data-id]').forEach(li => { li.onclick = () => openRow(li); li.onkeydown = e => { if (e.key === 'Enter') openRow(li); }; });
  let listMode = 'search', bmTag = '';
  function search(raw) {
    listMode = 'search'; bmButton();
    if (TAB === 'd') return dsearch(raw);
    const q0 = (raw || '').trim();
    lastQ = null;
    if (!q0) { $('#results').innerHTML = ''; $('#info').textContent = TX.nItems(INDEX.length.toLocaleString()); return; }
    let kind = 'hangul', q;
    // 英語版：ラテン文字は Yale と英語訳の両方で引く（mozom も heart も）
    if (/^[a-zA-Z.\-' ]+$/.test(q0)) { kind = LANG === 'en' ? 'both' : 'yale'; q = q0.toLowerCase().replace(/\s+/g, ' '); }
    else if (LANG === 'ja' && /[぀-ヿ㐀-鿿]/.test(q0) && !/[ᄀ-ᇿ가-힣㄰-㆏]/.test(q0)) { kind = 'tr'; q = q0; }
    else q = normalize(q0);
    const st = sel(), Q = kind === 'hangul' ? (lastQ = queryKeys(q)) : null;
    const hits = [];
    for (const row of INDEX) {
      const s = score(row, q, kind, st, Q);
      if (s) hits.push([s, row]);
    }
    hits.sort((a, b) => b[0] - a[0] || a[1][1].length - b[1][1].length || a[1][2] - b[1][2]);
    const how = kind === 'hangul' ? TX.how[mode()] : TX.how[kind];
    $('#info').textContent = hits.length ? `${TX.nItems(hits.length.toLocaleString())}${hits.length > 300 ? TX.top300 : ''}${TX.searched(how)}` : TX.none;
    $('#results').innerHTML = hits.slice(0, 300).map(([, r]) => rowHtml(r, st, Q && rowForms(r).filter(f => st.has(f[0]) && formScore(f, Q, mode()) > 0))).join('');
    bindRows();
    if (hits.length && !current) open(hits[0][1][0], true);
    else if (current) open(current, true);
  }

  // ---------- ブックマークと復習（lexica-study.js．記録は閲覧者のブラウザにだけ置く）
  // 項目の目印は 見出し＋語義番号（項目番号は lexica.db を作り直すと変わりうるので使わない）
  const bmKey = (hw, sn) => `${(hw || '').normalize('NFC')}|${sn || 0}`;
  // 方言の語群は d: を付ける．標準語に結ばれていない語群（印 2）は 最初の形＋語釈 で
  const dKey = r => (r[8] & 2 ? `d:~${(dForms(r)[0]?.[0] || '').normalize('NFC')}|${(r[6] || '').slice(0, 40)}` : `d:${bmKey(r[1], r[2])}`);
  const isD = key => key.startsWith('d:');
  let DKEY = null;
  function resolveD(key, id) {
    if (!DIAL) return id;
    const r = DIAL.byId.get(id);
    if (r && dKey(r) === key) return id;
    if (!DKEY) { DKEY = new Map(); for (const x of DIAL.rows) { const k = dKey(x); if (!DKEY.has(k)) DKEY.set(k, x[0]); } }
    return DKEY.get(key) ?? null;
  }
  let Study = null, ROW = null;
  const rowById = id => { if (!ROW) { ROW = new Map(); for (const r of INDEX) ROW.set(r[0], r); } return ROW.get(id); };
  let ROWKEY = null;
  function resolveKey(key, snap, id) {
    if (isD(key)) return resolveD(key, id);
    const r = rowById(id);
    if (r && bmKey(r[1], r[2]) === key) return id;
    if (!ROWKEY) { ROWKEY = new Map(); for (const x of INDEX) { const k = bmKey(x[1], x[2]); if (!ROWKEY.has(k)) ROWKEY.set(k, x[0]); } }
    return ROWKEY.get(key) ?? null;
  }
  // カードに出す形：訂正で外した形を除き，時代順
  function cardForms(e) {
    const order = Object.keys(VNAME);
    return e.f.filter(f => !isHidden(e.id, f[1])).sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]) || (a[5] || 0) - (b[5] || 0));
  }
  const CX = {
    ja: { dirF: '中期・近世の形 → 訳', dirR: '訳 → 中期・近世の形', dirDF: '方言形 → 意味', dirDR: '意味 → 方言形', kindH: '中期・近世の形', kindD: '方言', std: '標準語', loose: '標準語に結ばれていない方言項目', dsrc: '우리말샘（国立国語院）の方言項目，訳は 한국어기초사전．CC BY-SA 2.0 KR', modern: '現代語', noTr: '（訳なし）', hint: '現代語の見出しを見る', src: '우리말샘（国立国語院）の歴史情報，訳は 한국어기초사전．CC BY-SA 2.0 KR' },
    en: { dirF: 'Middle/Early Modern form → meaning', dirR: 'Meaning → Middle/Early Modern form', dirDF: 'Dialect form → meaning', dirDR: 'Meaning → dialect forms', kindH: 'Middle/Early Modern Korean', kindD: 'Dialects', std: 'Standard Korean', loose: 'Dialect entry not linked to a standard word', dsrc: '우리말샘 (National Institute of Korean Language), dialect entries; English from 한국어기초사전. CC BY-SA 2.0 KR', modern: 'Modern Korean', noTr: '(no translation)', hint: 'Show the modern headword', src: '우리말샘 (National Institute of Korean Language), historical data; English from 한국어기초사전. CC BY-SA 2.0 KR' },
  }[LANG];
  function snapshot(e) {
    const fs = cardForms(e), o = e._orig || { ja: e.ja, en: e.en };
    return { hw: e.hw, sn: e.sn || 0, pos: e.pos || '', f: fs.slice(0, 6).map(f => [f[0], f[1], f[2]]), ja: (o.ja || []).slice(0, 4), en: (o.en || []).slice(0, 6), gl: (e.gl || '').slice(0, 120) };
  }
  // 項目（なければ保存した写し）をカードの材料にそろえる
  function material(e, snap) {
    if (e) { const fs = cardForms(e); return { hw: e.hw, sn: e.sn, pos: e.pos, f: fs, tr: e.ja, gl: e.gl, c: e.c[0] || null }; }
    return { hw: snap.hw, sn: snap.sn, pos: snap.pos, f: snap.f, tr: snap[LANG] || [], gl: snap.gl, c: null };
  }
  const trLine = m => (m.tr.length ? m.tr.slice(0, 4).map(esc).join(LANG === 'en' ? ' / ' : '　／　') : `<span class="faint">${CX.noTr}</span>${m.gl ? `<div class="entry-gl">${esc(m.gl)}</div>` : ''}`);
  const modernLine = m => `<span class="hangul">${esc(m.hw)}</span>${m.sn ? `<small class="faint">「${m.sn}」</small>` : ''}`;
  function cardBack(m, withTr = true) {
    const forms = m.f.length ? `<table class="ls-forms"><tbody>${m.f.slice(0, 8).map(f => `<tr><td>${vtag(f[0])}</td><td class="hangul">${esc(f[1])}</td><td class="ipa">${esc(f[2] || '')}</td></tr>`).join('')}</tbody></table>` : '';
    const cite = m.c ? `<div class="card-cite"><span class="faint">${esc(m.c[3] || m.c[2] || '')}</span>　<span class="hangul">${ctx(m.c[4]) || esc(m.c[1])}</span></div>` : '';
    return `${withTr ? `<div class="card-tr">${trLine(m)}</div>` : ''}<div class="card-modern">${CX.modern}　${modernLine(m)}${m.pos ? ` <span class="tag">${esc(m.pos)}</span>` : ''}</div>${forms}${cite}`;
  }
  function makeCard(e, dir, snap) {
    const m = material(e, snap), f0 = m.f[0];
    if (dir === 'f') {
      const front = f0 ? `<div class="card-old hangul">${esc(f0[1])}</div><div>${vtag(f0[0])}${m.pos ? `<span class="tag">${esc(m.pos)}</span>` : ''}</div>` : modernLine(m);
      return { front, back: cardBack(m) };
    }
    const front = `<div class="card-q">${trLine(m)}</div><div>${m.pos ? `<span class="tag">${esc(m.pos)}</span>` : ''}</div>
      <details class="card-hint"><summary>${CX.hint}</summary>${modernLine(m)}</details>`;
    const back = (f0 ? `<div class="card-old hangul">${esc(f0[1])}</div><div class="card-period">${vtag(f0[0])}</div>` : '') + cardBack(m, false);
    return { front, back };
  }
  function ankiCard(e, snap) {
    const m = material(e, snap), f0 = m.f[0], period = f0 ? VNAME[f0[0]] || f0[0] : '';
    const front = f0 ? `<div style="font-size:2em">${esc(f0[1])}</div><div style="font-size:.8em">${esc(period)}</div>` : esc(m.hw);
    const back = `<div style="font-weight:600">${m.tr.slice(0, 4).map(esc).join(' / ') || esc(m.gl || '')}</div><div style="font-size:.85em">${CX.modern}: ${esc(m.hw)}${m.sn ? ' 「' + m.sn + '」' : ''}${m.pos ? ' (' + esc(m.pos) + ')' : ''}</div>`;
    const detail = m.f.map(f => `${esc(VNAME[f[0]] || f[0])} ${esc(f[1])}${f[2] ? ' <i>' + esc(f[2]) + '</i>' : ''}`).join('<br>') +
      (m.c ? `<br><br>${esc(m.c[3] || '')} ${esc((m.c[4] || m.c[1] || '').replace(/[{}]/g, ''))}` : '') + `<br><br><small>${esc(CX.src)}</small>`;
    return [front, back, detail];
  }
  // ---- 方言の語群のカード．e = { kind: 'd', id, r }（r は data/d/index.json の行）
  const dEntry = r => ({ kind: 'd', id: r[0], r });
  const regNames = codes => codes.slice(0, 6).map(rname).join(TX.sep) + (codes.length > 6 ? '…' : '');
  function dMaterial(e, snap) {
    if (e && e.r) {
      const r = e.r, fs = dForms(r).map(f => [f[0], f[1]]).sort((a, b) => b[1].length - a[1].length);
      return { loose: !!(r[8] & 2), hw: r[1], sn: r[2], pos: r[3], tr: r[DTR] ? r[DTR].split(DTRSEP).filter(Boolean) : [], gl: r[6], f: fs };
    }
    return { loose: snap.loose, hw: snap.hw, sn: snap.sn, pos: snap.pos, tr: snap[LANG] || [], gl: snap.gl, f: snap.f || [] };
  }
  function dSnapshot(e) {
    const r = e.r, m = dMaterial(e);
    return { kind: 'd', loose: m.loose, hw: r[1], sn: r[2] || 0, pos: r[3] || '', ja: (r[4] || '').split('；').filter(Boolean).slice(0, 4), en: (r[5] || '').split('; ').filter(Boolean).slice(0, 6), gl: (r[6] || '').slice(0, 120), f: m.f.slice(0, 10) };
  }
  const stdLine = m => (m.loose ? `<span class="tag">${esc(CX.loose)}</span>` : `${CX.std}　<span class="hangul">${esc(m.hw)}</span>${m.sn ? `<small class="faint">「${m.sn}」</small>` : ''}`);
  const dFormsList = m => `<table class="ls-forms"><tbody>${m.f.slice(0, 10).map(f => `<tr><td class="hangul">${esc(f[0])}</td><td class="faint">${esc(regNames(f[1]))}</td></tr>`).join('')}</tbody></table>${m.f.length > 10 ? `<div class="faint" style="text-align:center">+${m.f.length - 10}</div>` : ''}`;
  function dCard(e, dir, snap) {
    const m = dMaterial(e, snap), f0 = m.f[0];
    const meaning = `<div class="card-tr">${trLine(m)}</div><div class="card-modern">${stdLine(m)}${m.pos ? ` <span class="tag">${esc(m.pos)}</span>` : ''}</div>`;
    if (dir === 'df') {
      const front = f0 ? `<div class="card-old hangul">${esc(f0[0])}</div><div class="card-period faint">${esc(regNames(f0[1]))}</div>` : meaning;
      return { front, back: meaning + dFormsList(m) };
    }
    const front = `<div class="card-q">${trLine(m)}</div><div class="card-modern">${stdLine(m)}${m.pos ? ` <span class="tag">${esc(m.pos)}</span>` : ''}</div>`;
    return { front, back: dFormsList(m) };
  }
  function dAnki(e, snap) {
    const m = dMaterial(e, snap), f0 = m.f[0];
    const front = f0 ? `<div style="font-size:2em">${esc(f0[0])}</div><div style="font-size:.8em">${esc(regNames(f0[1]))}</div>` : esc(m.hw);
    const back = `<div style="font-weight:600">${m.tr.slice(0, 4).map(esc).join(' / ') || esc(m.gl || '')}</div><div style="font-size:.85em">${m.loose ? esc(CX.loose) : `${CX.std}: ${esc(m.hw)}${m.sn ? ' 「' + m.sn + '」' : ''}`}${m.pos ? ' (' + esc(m.pos) + ')' : ''}</div>`;
    const detail = m.f.map(f => `${esc(f[0])} <span style="font-size:.85em">${esc(f[1].map(rname).join(TX.sep))}</span>`).join('<br>') + `<br><br><small>${esc(CX.dsrc)}</small>`;
    return [front, back, detail];
  }
  // 結果欄の上：「ブックマーク」で一覧を切り替える
  function bmButton() {
    const b = $('#bm-list'); if (!b || !Study) return;
    b.hidden = false;
    b.textContent = listMode === 'bm' ? Study.text.backToResults : Study.text.bookmarks(Study.count());
  }
  let bmKind = '';
  async function showBookmarks() {
    listMode = 'bm'; bmButton();
    const st = sel(), tags = Study.allTags(), all = Study.bookmarks();
    if (all.some(b => b.kind === 'd')) await loadDial();
    if (listMode !== 'bm') return;
    const kinds = [['h', CX.kindH], ['d', CX.kindD]].filter(([k]) => all.some(b => b.kind === k));
    if (bmTag && !tags.includes(bmTag)) bmTag = '';
    if (bmKind && !kinds.some(([k]) => k === bmKind)) bmKind = '';
    const list = Study.bookmarks({ kind: bmKind, tag: bmTag });
    $('#info').textContent = Study.text.bookmarks(Study.count());
    const chip = (attr, v, label, on) => `<button type="button" class="ls-chip" ${attr}="${esc(v)}" aria-pressed="${on}">${esc(label)}</button>`;
    const bar = kinds.length > 1 || tags.length ? `<li class="ls-listbar" aria-label="${esc(Study.text.tagFilter)}">${chip('data-kind', '', Study.text.all, !bmKind && !bmTag)}` +
      (kinds.length > 1 ? kinds.map(([k, l]) => chip('data-kind', k, l, k === bmKind)).join('') : '') + tags.map(t => chip('data-tag', t, t, t === bmTag)).join('') + '</li>' : '';
    const lost = b => `<li class="item"><div class="item-head"><span class="item-hw">${esc(b.snap.hw || (b.snap.f || [])[0]?.[0] || '')}</span>${b.snap.sn ? `<span class="faint">「${b.snap.sn}」</span>` : ''}</div><div class="item-gl">${esc(Study.text.lost)}</div></li>`;
    $('#results').innerHTML = bar + (list.length ? list.map(b => {
      if (b.kind === 'd') { const r = b.id != null && DIAL && DIAL.byId.get(b.id); return r ? dRowHtml(r, dForms(r)) : lost(b); }
      const r = b.id != null && rowById(b.id);
      return r ? rowHtml(r, st, null).replace('<li class="item"', '<li class="item" data-kind="h"') : lost(b);
    }).join('') : `<li class="empty">${esc(Study.text.empty)}</li>`);
    $$('#results .ls-chip').forEach(c => {
      c.onclick = () => { if (c.hasAttribute('data-tag')) { bmTag = bmTag === c.dataset.tag ? '' : c.dataset.tag; } else { bmKind = c.dataset.kind; if (!bmKind) bmTag = ''; } showBookmarks(); };
    });
    bindRows();
  }
  let openedEntry = null;   // 右の欄に開いている項目（歴史形の項目，または dEntry）
  function refreshBar() {
    const bar = $('#detail .ls-bar'); if (!bar || !openedEntry) return;
    bar.outerHTML = Study.bar(openedEntry); Study.bindBar($('#detail'), openedEntry);
  }
  function markRows() {
    $$('#results .item[data-id]').forEach(li => {
      const id = +li.dataset.id, d = (li.dataset.kind || TAB) === 'd';
      const r = d ? DIAL && DIAL.byId.get(id) : rowById(id);
      const on = r && Study.isOn(d ? dKey(r) : bmKey(r[1], r[2])), s = li.querySelector('.item-bm');
      if (on && !s) li.querySelector('.item-head').insertAdjacentHTML('beforeend', '<span class="item-bm" aria-hidden="true">★</span>');
      else if (!on && s) s.remove();
    });
  }
  function setupStudy() {
    if (!window.LexicaStudy) return;
    Study = window.LexicaStudy.init({
      site: 'coreanica-selecta', lang: LANG, ankiTag: 'LexicaCoreanicaSelecta',
      kinds: [{ id: 'h', label: CX.kindH, anki: LANG === 'en' ? 'MiddleKorean' : '中期・近世' }, { id: 'd', label: CX.kindD, anki: LANG === 'en' ? 'dialect' : '方言' }],
      dirs: [{ id: 'f', kind: 'h', label: CX.dirF }, { id: 'r', kind: 'h', label: CX.dirR }, { id: 'df', kind: 'd', label: CX.dirDF }, { id: 'dr', kind: 'd', label: CX.dirDR }],
      adapter: {
        kind: key => (isD(key) ? 'd' : 'h'),
        key: e => (e.kind === 'd' ? dKey(e.r) : bmKey(e.hw, e.sn)),
        snapshot: e => (e.kind === 'd' ? dSnapshot(e) : snapshot(e)),
        resolve: resolveKey,
        load: async (id, key) => {
          if (!isD(key)) return loadEntry(id);
          await loadDial(); DKEY = null;
          const r = DIAL.byId.get(resolveD(key, id));
          return r ? dEntry(r) : null;
        },
        card: (e, dir, snap, key) => (isD(key) ? dCard(e, dir, snap) : makeCard(e, dir, snap)),
        anki: (e, snap, key) => (isD(key) ? dAnki(e, snap) : ankiCard(e, snap)),
        url: (id, key) => `${location.href.split('#')[0]}#${isD(key) ? 't=d&' : ''}id=${id}`,
        changed: external => {
          if (listMode === 'bm') showBookmarks(); else { bmButton(); markRows(); }
          if (external) refreshBar();   // 別のタブでの変更や読み込み
        },
      },
    });
    Study.mountButton($('#study'));
    $('#bm-list').onclick = () => { if (listMode === 'bm') search($('#q').value); else showBookmarks(); };
    bmButton();
    // 方言のブックマークがあれば，語群の表を先に読んでおく（番号の付け直しと一覧の表示に使う）
    if (Study.bookmarks({ kind: 'd' }).length) loadDial().then(() => { DKEY = null; if (listMode === 'bm') showBookmarks(); });
  }

  // ---------- 訳と形の対応付けの訂正（corrections/translations.tsv．協力者が公開用リポジトリで直す．書式は CONTRIBUTING.md）
  //   id  lang  op  value  issue  by  note
  //   op = set（訳を value に置き換える．複数は | 区切り）／ add（訳を足す）／ remove（訳を外す）／ hide-form（形 value をこの項目から外す．lang は -）
  const CORR = new Map();
  const nfc = s => (s || '').normalize('NFC').replace(/[\u302E\u302F]/g, '').trim();
  function loadCorrections(text) {
    for (const line of (text || '').split(/\r?\n/)) {
      if (!line.trim() || line.startsWith('#') || line.startsWith('id\t')) continue;
      const [id, lang, op, value = '', issue = ''] = line.split('\t');
      if (!/^\d+$/.test(id) || !op) continue;
      const c = CORR.get(+id) || { tr: { ja: [], en: [] }, hide: new Set(), issues: new Set() };
      if (op === 'hide-form') c.hide.add(nfc(value));
      else if (c.tr[lang] && ['set', 'add', 'remove'].includes(op)) c.tr[lang].push([op, value.split('|').map(x => x.trim()).filter(Boolean)]);
      else continue;
      if (issue.trim()) c.issues.add(issue.trim().replace(/^#/, ''));
      CORR.set(+id, c);
    }
    if (!CORR.size) return;
    // 一覧の行（検索に使う）にも当てる：訳の列と，外した形
    for (const row of INDEX) {
      const c = CORR.get(row[0]); if (!c) continue;
      if (c.tr[LANG].length) row[TRI] = applyTr(row[0], (row[TRI] || '').split(TRSEP).filter(Boolean)).slice(0, LANG === 'en' ? 6 : 1).join(TRSEP);
      if (c.hide.size && row[4]) {
        const fs = row[4].split('|'), ks = (row[8] || '').split('|'), keep = fs.map(x => !c.hide.has(nfc(x.slice(1))));
        row[4] = fs.filter((_, i) => keep[i]).join('|'); row[8] = ks.filter((_, i) => keep[i]).join('|'); delete row._f;
      }
    }
  }
  function applyTr(id, list) {
    const c = CORR.get(id); let out = list.slice();
    if (!c) return out;
    for (const [op, vals] of c.tr[LANG]) {
      if (op === 'set') out = vals.slice();
      else if (op === 'add') vals.forEach(v => { if (!out.includes(v)) out.push(v); });
      else if (op === 'remove') out = out.filter(x => !vals.includes(x));
    }
    return out;
  }
  const isHidden = (id, form) => !!CORR.get(id)?.hide.has(nfc(form));
  function fixedNote(id, e) {
    const c = CORR.get(id); if (!c || (!c.tr[LANG].length && !c.hide.size)) return '';
    const iss = [...c.issues].map(n => `<a href="${REPO}/issues/${encodeURIComponent(n)}" target="_blank" rel="noopener">#${esc(n)}</a>`).join(' ');
    const orig = c.tr[LANG].length && e.tr0.join() !== e.ja.join() ? ` <span class="faint">${TX.origTr}: ${esc(e.tr0.join(TRSEP) || '—')}</span>` : '';
    return `<div class="faint" style="font-size:12px"><span class="tag fixed" title="${esc(TX.fixedTip)}">${TX.fixed}</span>${iss}${orig}</div>`;
  }
  // 「誤りを報告」：GitHub の Issue の書式（.github/ISSUE_TEMPLATE/correction.yml）に項目の情報を入れて開く
  function reportUrl(e, forms) {
    const p = new URLSearchParams({
      template: 'correction.yml', title: `[${e.id}] ${e.hw}${e.sn ? '「' + e.sn + '」' : ''}`,
      entry_id: String(e.id), headword: `${e.hw}${e.sn ? ' 「' + e.sn + '」' : ''}`, lang: LANG,
      current: `${LANG}: ${e.ja.join(TRSEP) || '—'}\n${LANG === 'en' ? 'ja' : 'en'}: ${(e.other || []).join(LANG === 'en' ? '；' : '; ') || '—'}\nforms: ${[...new Set(forms.map(f => f[1].normalize("NFC")))].join(" ")}`,
      page: location.href.split('#')[0] + `#id=${e.id}`,
    });
    return `${REPO}/issues/new?${p}`;
  }

  // ---------- 項目
  async function shard(n) {
    if (!SHARDS[n]) SHARDS[n] = fetch(`${BASE}data/e/${String(n).padStart(2, '0')}.json`).then(r => r.json());
    return SHARDS[n];
  }
  // 項目の形が今の問いに当たるか（当たった形の行に印を付ける）
  function hitForm(f) {
    if (!lastQ) return false;
    const vi = HIST.indexOf(f[0]), plain = f[1].normalize('NFD').replace(/[\u302E\u302F]/g, '');
    const ks = ERA[vi] ? [HKey.key(plain, ERA[vi])] : HKey.ERAS.map(e => HKey.key(plain, e));
    return formScore([vi, plain, ks], lastQ, mode()) > 0;
  }
  const ctx = s => esc(s).replace(/\{([^}]*)\}/g, '<mark>$1</mark>');
  // 項目を引き，訳の訂正を当てる（e.ja は表示の言語の訳．英語版では英語）
  async function loadEntry(id) {
    const e = (await shard(id % (META.shards || 64)))[id];
    if (e) { e._orig ??= { ja: e.ja || [], en: e.en || [] }; e.tr0 = e._orig[LANG]; e.other = e._orig[LANG === 'en' ? 'ja' : 'en']; e.ja = applyTr(id, e.tr0); }
    return e;
  }
  async function open(id, keepHash) {
    if (TAB === 'd') return dopen(id, keepHash);
    current = id;
    $$('#results .item').forEach(li => li.setAttribute('aria-selected', +li.dataset.id === id));
    if (!keepHash) setHash();
    const e = await loadEntry(id);
    if (e && e.d && !MAP) await loadMap();
    if (!e || current !== id) return;
    const order = Object.keys(VNAME);
    const forms = e.f.slice().sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]) || (a[5] || 0) - (b[5] || 0));
    let h = `<div class="entry"><div class="entry-hw">${esc(e.hw)}${e.sn ? `<small>「${e.sn}」</small>` : ''}</div>
      <div>${[e.pos, e.wt].filter(Boolean).map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>
      ${Study ? Study.bar(e) : ''}
      ${e.ja.length ? `<div class="entry-ja">${e.ja.map(esc).join(LANG === 'en' ? ' / ' : '　／　')}</div>` : ''}${fixedNote(id, e)}
      ${e.gl ? `<div class="entry-gl">${esc(e.gl)}</div>` : ''}`;
    const th = a => `<thead><tr>${a.map(x => `<th>${x}</th>`).join('')}</tr></thead>`;
    if (forms.length) h += `<h3>${TX.forms}<span class="n">${forms.length}</span></h3><table>${th(TX.thForms)}<tbody>` +
      forms.map(f => { const hid = isHidden(id, f[1]); return `<tr${hid ? ' class="hidden-form"' : hitForm(f) ? ' class="hit"' : ''}><td>${vtag(f[0])}</td><td class="hangul">${esc(f[1])}</td><td class="ipa">${esc(f[2])}</td><td class="faint">${hid ? `<span class="tag fixed" title="${esc(TX.fixedTip)}">${TX.hidden}</span>` : esc(f[4])}</td></tr>`; }).join('') + '</tbody></table>';
    if (e.d && e.d.length && MAP) h += dialectMap(e.d) + `<p class="dmap-more"><a href="#t=d&id=${id}">${TX.toDial}</a></p>`;
    if (e.c.length) h += `<h3>${TX.cites}<span class="n">${e.c.length}</span></h3><table>${th(TX.thCites)}<tbody>` +
      e.c.map(c => `<tr><td>${vtag(c[0])}</td><td class="num">${esc(c[2] ?? '')}</td><td class="num">${esc(c[3])}</td><td class="ctx">${ctx(c[4]) || `<span class="hangul">${esc(c[1])}</span>`}</td></tr>`).join('') + '</tbody></table>';
    h += `<p class="faint" style="font-size:12px;margin-top:18px">${TX.source(e.ja.length)}<a href="https://opendict.korean.go.kr/search/searchResult?query=${encodeURIComponent(e.hw)}" rel="noopener" target="_blank">${TX.openOD}</a>　<a class="report" href="${reportUrl(e, forms)}" target="_blank" rel="noopener" title="${esc(TX.reportTip)}">${TX.report}</a></p></div>`;
    $('#detail').innerHTML = h;
    if (Study) { openedEntry = e; Study.bindBar($('#detail'), e); }
    $('#detail').scrollTop = 0;
    $$('#detail .dleg li').forEach(li => { li.onclick = () => focusGroup(li); li.onkeydown = ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); focusGroup(li); } }; });
  }


  // ---------- 方言地図：우리말샘 の方言形（項目と意味の錨が同じ方言項目の形）を，地域ごとに記号で示す小さな SVG 地図
  let MAP = null;
  const loadMap = () => (MAP ? Promise.resolve(MAP) : fetch(BASE + 'data/map.json').then(r => r.json()).then(m => (MAP = m)).catch(() => null));
  const PAL = ['#2B4C8C', '#B2452F', '#3F7A63', '#B8862B', '#7A4A8C', '#2F7F8F', '#8A5A3B', '#B4577A'];
  const SHAPES = ['circle', 'square', 'triangle', 'diamond', 'tri-down', 'hexagon', 'star', 'cross'];
  const TOP = 8;
  function mark(i, x, y, size) {
    // 形 i の記号（中心 x, y）．TOP 以降は灰色の小さな点
    if (i >= TOP) return `<circle cx="${x}" cy="${y}" r="2.6" class="dm-other"/>`;
    const h = size / 2, c = PAL[i], f = (a, b) => `${(x - h + a).toFixed(1)},${(y - h + b).toFixed(1)}`;
    const P = {
      circle: `<circle cx="${x}" cy="${y}" r="${h - 1}"/>`,
      square: `<rect x="${x - h + 1.5}" y="${y - h + 1.5}" width="${size - 3}" height="${size - 3}"/>`,
      triangle: `<polygon points="${f(h, 0.5)} ${f(size - 0.5, size - 1)} ${f(0.5, size - 1)}"/>`,
      'tri-down': `<polygon points="${f(0.5, 1)} ${f(size - 0.5, 1)} ${f(h, size - 0.5)}"/>`,
      diamond: `<polygon points="${f(h, 0)} ${f(size, h)} ${f(h, size)} ${f(0, h)}"/>`,
      hexagon: `<polygon points="${[0, 1, 2, 3, 4, 5].map(k => f(h + (h - 0.8) * Math.cos(Math.PI / 3 * k), h + (h - 0.8) * Math.sin(Math.PI / 3 * k))).join(' ')}"/>`,
      star: `<polygon points="${[...Array(10)].map((_, k) => { const r = k % 2 ? h * 0.45 : h; const a = Math.PI / 5 * k - Math.PI / 2; return f(h + r * Math.cos(a), h + r * Math.sin(a)); }).join(' ')}"/>`,
      cross: `<path d="M${f(h - 2, 0)}h4v${h - 2}h${h - 2}v4h-${h - 2}v${h - 2}h-4v-${h - 2}h-${h - 2}v-4h${h - 2}z"/>`,
    };
    return `<g fill="${c}" stroke="var(--surface)" stroke-width="1">${P[SHAPES[i]]}</g>`;
  }
  const legendMark = i => `<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">${mark(i, 7, 7, 13)}</svg>`;
  // 地域の名前（画面の言語で．韓国語の名前は title に）
  const rname = c => TX.rn[c] || (MAP && MAP.regions[c] ? MAP.regions[c][0] : c);
  function dialectMap(d, hit) {
    const R = MAP.regions;
    const byForm = new Map();
    d.forEach(([code, form]) => { const k = form.normalize('NFC'); if (!byForm.has(k)) byForm.set(k, []); byForm.get(k).push(code); });
    const ord = Object.keys(R), byOrd = (a, b) => (ord.indexOf(a) + 1 || 99) - (ord.indexOf(b) + 1 || 99);
    byForm.forEach(v => v.sort(byOrd));
    const groups = [...byForm.entries()].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));
    // 地域 → その地域に出る形（番号）
    const at = {};
    groups.forEach(([, codes], gi) => codes.forEach(c => (at[c] ??= []).push(gi)));
    const lit = new Set();
    Object.keys(at).forEach(c => { lit.add(c); Object.entries(R).forEach(([k, r]) => { if (r[1] === c) lit.add(k); }); });
    let svg = `<svg class="dmap-svg" viewBox="0 0 ${MAP.w} ${MAP.h}" role="img" aria-label="${TX.mapAria}">
      <rect width="${MAP.w}" height="${MAP.h}" class="dm-sea"/>`;
    MAP.shapes.forEach(([kind, code, path]) => { svg += `<path d="${path}" class="${kind === 'land' ? 'dm-land' : lit.has(code) ? 'dm-prov dm-lit' : 'dm-prov'}"/>`; });
    const outside = [];
    Object.entries(at).forEach(([code, gis]) => {
      const r = R[code];
      if (!r || r[2] == null) { outside.push(code); return; }
      const n = gis.length, cols = Math.min(n, 4), step = 11;
      gis.forEach((gi, k) => {
        const row = Math.floor(k / cols), col = k % cols, inRow = Math.min(cols, n - row * cols);
        const x = r[2] + (col - (inRow - 1) / 2) * step, y = r[3] + (row - (Math.ceil(n / cols) - 1) / 2) * step;
        svg += `<g class="dm-mark" data-g="${gi}"><title>${esc(groups[gi][0])}　${esc(rname(code))}</title>${mark(gi, +x.toFixed(1), +y.toFixed(1), 11)}</g>`;
      });
    });
    svg += '</svg>';
    const leg = groups.map(([form, codes], gi) => `<li data-g="${gi}" tabindex="0"${hit && hit.has(form) ? ' class="hit"' : ''}><span class="dl-sym">${gi < TOP ? legendMark(gi) : '<svg width="14" height="14" aria-hidden="true"><circle cx="7" cy="7" r="2.6" class="dm-other"/></svg>'}</span><span class="hangul dl-form">${esc(form)}</span><span class="dl-reg">${codes.map(c => `<span title="${esc(R[c] ? R[c][0] : c)}">${esc(rname(c))}</span>`).join(TX.sep)}${codes.some(c => outside.includes(c)) ? `<span class="faint">${TX.outside}</span>` : ''}</span></li>`).join('');
    return `<h3>${TX.dial}<span class="n">${TX.dialN(groups.length, Object.keys(at).length)}</span></h3>
      <div class="dmap">${svg}<ul class="dleg">${leg}</ul></div>
      <p class="faint dmap-note">${TX.dialNote}</p>`;
  }
  function focusGroup(li) {
    const box = li.closest('.dmap'), g = li.dataset.g, on = li.getAttribute('aria-pressed') !== 'true';
    box.querySelectorAll('.dleg li').forEach(x => x.setAttribute('aria-pressed', on && x === li ? 'true' : 'false'));
    box.querySelectorAll('.dm-mark').forEach(m => m.classList.toggle('dim', on && m.dataset.g !== g));
  }

  // ---------- 方言の検索（data/d/index.json．우리말샘 の方言項目を，同じ現代語に結ばれたものごとに「語群」にまとめたもの）
  //   行 = [番号, 見出し, 語義番号, 品詞, 日本語訳, 英語訳, 語釈, 形（形:地域の文字|…）, 印（1 歴史形あり，2 錨なし）]
  //   形・意味（訳・現代語の見出し・語釈）で引き，地域（地図で選ぶ）で絞る．語群を開くと同じ意味の方言形がすべて並ぶ．
  const DL = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let TAB = 'h', DIAL = null, DIALP = null, dcur = null, dShown = 300, dHits = [], picking = false;   // picking：右の欄に地域の地図を出したまま
  const RSEL = new Set();                                   // 選んだ地域（空 = すべて）
  const DTR = LANG === 'en' ? 5 : 4, DTRSEP = LANG === 'en' ? '; ' : '；';
  function loadDial() {
    if (!DIALP) DIALP = Promise.all([fetch(BASE + 'data/d/index.json').then(r => r.json()), loadMap()]).then(([d]) => {
      d.byId = new Map(d.rows.map(r => [r[0], r]));
      // 訂正（corrections/translations.tsv）の訳は語群にも当てる（番号は歴史形の項目と共通）
      for (const r of d.rows) if (CORR.get(r[0])?.tr[LANG].length) r[DTR] = applyTr(r[0], (r[DTR] || '').split(DTRSEP).filter(Boolean)).join(DTRSEP);
      return (DIAL = d);
    });
    return DIALP;
  }
  // 行の形 → [[形, [地域コード…], 字母列（NFD）], …]（初回だけ）
  function dForms(r) {
    if (r._f) return r._f;
    return (r._f = (r[7] ? r[7].split('|') : []).map(x => {
      const i = x.lastIndexOf(':'), f = x.slice(0, i);
      return [f, [...x.slice(i + 1)].map(c => DIAL.regions[DL.indexOf(c)]), f.normalize('NFD')];
    }));
  }
  const parentOf = c => (MAP.regions[c] || [])[1] || '';
  const childrenOf = c => Object.keys(MAP.regions).filter(k => MAP.regions[k][1] === c);
  // 地域のまとまり（チップ）：道（下位の道を含む），中国，中央アジア
  function regionGroups() {
    const out = [], R = MAP.regions;
    for (const c of Object.keys(R)) {
      if (R[c][1]) continue;
      if (c.startsWith('CN-')) { let g = out.find(x => x[0] === 'CN'); if (!g) out.push(g = ['CN', TX.rgGroup.CN, []]); g[2].push(c); continue; }
      out.push([c, c === 'CA' ? TX.rgGroup.CA : rname(c), [c, ...childrenOf(c)]]);
    }
    return out;
  }
  // 地域の条件：選んだ地域（下位の道を選んだら，道の区別の無い記録（경상 など）も数える）
  const drm = () => $('#drm').value;
  function regionTest() {
    if (!RSEL.size) return null;
    const eff = new Set(RSEL);
    for (const c of RSEL) { const p = parentOf(c); if (p) eff.add(p); }
    // 「すべてに出る」の単位：子を選んだ親は単位にしない（親の記録は子の単位で数える）
    const units = [...RSEL].filter(c => !childrenOf(c).some(k => RSEL.has(k))).map(c => [c, parentOf(c)]);
    const m = drm();
    if (m === 'only') return regs => regs.length && regs.every(c => eff.has(c));
    if (m === 'all') return regs => units.every(([c, p]) => regs.includes(c) || (p && regs.includes(p)));
    return regs => regs.some(c => eff.has(c));
  }
  const dmode = () => $('#dmode').value, dtarget = () => $('#dtarget').value;
  function dScoreForm(f, q, Q, m) {
    if (m === 'exact') return cmp(f[2], q, 5, 3.5, 2);
    return Math.max(cmp(f[2], q, 5.2, 3.6, 2.1), cmp(sylKey(f[2]), Q.k0, 5, 3.5, 2));
  }
  async function dsearch(raw) {
    await loadDial();
    if (TAB !== 'd') return;
    const q0 = (raw || '').trim(), test = regionTest();
    let kind = 'browse', q = '';
    if (q0) {
      if (/^[a-zA-Z.\-' ]+$/.test(q0)) { kind = 'en'; q = q0.toLowerCase().replace(/\s+/g, ' '); }
      else if (/[぀-ヿ㐀-鿿]/.test(q0) && !/[ᄀ-ᇿ가-힣㄰-㆏]/.test(q0)) { kind = 'tr'; q = q0; }
      else { q = normalize(q0); kind = dtarget(); }
    }
    syncPicker();
    if (kind === 'browse' && !test) { dHits = []; renderDList(TX.dStart(DIAL.rows.length.toLocaleString())); if (!dcur) dEmpty(); return; }
    const Q = { k0: HKey.key(q, 0) }, m = dmode(), hits = [];
    for (const r of DIAL.rows) {
      const fs = dForms(r), ok = test ? fs.filter(f => test(f[1])) : fs;
      if (!ok.length) continue;
      let s = 0, hitF = [];
      if (kind === 'browse') { s = 1; hitF = ok; }
      else if (kind === 'form' || kind === 'auto') {
        for (const f of ok) { const x = dScoreForm(f, q, Q, m); if (x) { hitF.push(f); s = Math.max(s, x); } }
      }
      if ((kind === 'std' || kind === 'auto') && !(r[8] & 2)) {
        const h = r[1].normalize('NFD');
        if (h === q) s = Math.max(s, 5.5); else if (h.startsWith(q)) s = Math.max(s, 2.4); else if (h.includes(q)) s = Math.max(s, 1.1);
      }
      if ((kind === 'std' || (kind === 'auto' && !s)) && r[6] && r[6].normalize('NFD').includes(q)) s = Math.max(s, 0.5);
      if (kind === 'tr' && r[4] && r[4].includes(q)) s = r[4].startsWith(q) ? 3 : 2;
      if (kind === 'en' && r[5]) s = enScore(r[5], q);
      if (s) hits.push([s, r, hitF.length ? hitF : ok]);
    }
    // 同点なら方言形の多い語群（よく記録された語）を先に
    if (kind !== 'browse') hits.sort((a, b) => b[0] - a[0] || dForms(b[1]).length - dForms(a[1]).length || a[1][1].length - b[1][1].length || a[1][2] - b[1][2]);
    dHits = hits; dShown = 300;
    const how = TX.dHow[kind] + (test ? `（${TX.dRegions(RSEL.size)}）` : '');
    renderDList(hits.length ? `${TX.dItems(hits.length.toLocaleString())}${TX.searched(how)}` : TX.dNone);
    if (dcur) dopen(dcur, true);
    else if (hits.length && !picking) dopen(hits[0][1][0], true);
    else dEmpty();
  }
  function renderDList(info) {
    $('#info').textContent = info;
    listMode = 'search'; bmButton();
    const li = dHits.slice(0, dShown).map(([, r, fs]) => dRowHtml(r, fs)).join('');
    const left = dHits.length - dShown;
    $('#results').innerHTML = li + (left > 0 ? `<li class="more"><button type="button" class="link-btn" id="dmore">${TX.more(left.toLocaleString())}</button></li>` : '');
    $$('#results .item').forEach(x => { x.onclick = () => dopen(+x.dataset.id); x.onkeydown = e => { if (e.key === 'Enter') dopen(+x.dataset.id); }; });
    const mb = $('#dmore'); if (mb) mb.onclick = () => { dShown += 300; renderDList($('#info').textContent); };
  }
  // 語群の一覧の行（fs：先に並べる形）
  function dRowHtml(r, fs) {
      const loose = r[8] & 2;
      const shown = fs.slice(0, 5).map(f => `<span class="dform"><span class="hangul">${esc(f[0])}</span><span class="rg">${f[1].slice(0, 4).map(rname).map(esc).join('・')}${f[1].length > 4 ? '…' : ''}</span></span>`).join('');
      const rest = fs.length > 5 ? `<span class="faint">+${fs.length - 5}</span>` : '';
      return `<li class="item" data-id="${r[0]}" data-kind="d" tabindex="0" aria-selected="${r[0] === dcur}">
        <div class="item-head"><span class="item-hw">${esc(loose ? dForms(r)[0][0] : r[1])}</span>${r[2] ? `<span class="faint">「${r[2]}」</span>` : ''}${loose ? `<span class="tag" title="${esc(TX.dLooseTip)}">${TX.dLoose}</span>` : ''}${Study && Study.isOn(dKey(r)) ? '<span class="item-bm" aria-hidden="true">★</span>' : ''}</div>
        ${r[DTR] ? `<div class="item-ja">${esc(r[DTR])}</div>` : r[6] ? `<div class="item-gl">${esc(r[6])}</div>` : ''}
        <div class="item-dforms">${shown}${rest}</div></li>`;
  }
  async function dopen(id, keepHash) {
    await loadDial();
    if (!keepHash) picking = false;
    const r = DIAL.byId.get(id);
    dcur = r ? id : null;
    $$('#results .item').forEach(li => li.setAttribute('aria-selected', +li.dataset.id === id));
    if (!keepHash) setHash();
    if (!r) { dEmpty(); return; }
    const loose = r[8] & 2, fs = dForms(r), test = regionTest();
    const hit = new Set((dHits.find(h => h[1] === r)?.[2] || (test ? fs.filter(f => test(f[1])) : [])).map(f => f[0]));
    if (hit.size === fs.length) hit.clear();
    const tr = r[DTR] ? r[DTR].split(DTRSEP) : [];
    let h = `<div class="entry"><div class="entry-hw">${esc(loose ? fs[0][0] : r[1])}${r[2] ? `<small>「${r[2]}」</small>` : ''}</div>
      <div>${r[3] ? `<span class="tag">${esc(r[3])}</span>` : ''}${loose ? `<span class="tag" title="${esc(TX.dLooseTip)}">${TX.dLoose}</span>` : ''}</div>
      ${Study ? Study.bar(dEntry(r)) : ''}
      ${tr.length ? `<div class="entry-ja">${tr.map(esc).join(LANG === 'en' ? ' / ' : '　／　')}</div>` : ''}${fixedNote(id, { tr0: tr, ja: tr })}
      ${r[6] ? `<div class="entry-gl">${esc(r[6])}</div>` : ''}
      ${r[8] & 1 ? `<p class="dmap-more"><a href="#t=h&id=${id}">${TX.toHist}</a></p>` : ''}`;
    // 地図と凡例（同じ意味の方言形すべて．今の条件に当たる形に印）
    const d = []; fs.forEach(f => f[1].forEach(c => d.push([c, f[0]])));
    h += dialectMap(d, hit).replace(TX.dial, TX.dDial);
    // 地域ごとの形
    const ord = Object.keys(MAP.regions), at = {};
    fs.forEach(f => f[1].forEach(c => (at[c] ??= []).push(f[0])));
    h += `<h3>${TX.byRegion}</h3><table><thead><tr><th>${TX.thByRegion[0]}</th><th>${TX.thByRegion[1]}</th></tr></thead><tbody>` +
      Object.keys(at).sort((a, b) => ord.indexOf(a) - ord.indexOf(b)).map(c => `<tr${RSEL.size && (RSEL.has(c) || [...RSEL].some(x => parentOf(x) === c)) ? ' class="hit"' : ''}><td class="rgcell" title="${esc(MAP.regions[c]?.[0] || c)}">${esc(rname(c))}</td><td class="hangul">${at[c].map(f => `<a href="#t=d&q=${encodeURIComponent(f)}&dt=form" class="${hit.has(f) ? 'hitf' : ''}">${esc(f)}</a>`).join('　')}</td></tr>`).join('') + '</tbody></table>';
    // 同じ訳・同じ語釈の別の語群（意味の近い語の方言を辿る）
    const rel = [];
    if (tr.length) {
      const t0 = tr[0];
      for (const x of DIAL.rows) if (x !== r && x[DTR] && x[DTR].split(DTRSEP).includes(t0)) rel.push(x);
      if (rel.length) h += `<h3>${TX.sameTr}<span class="n">${esc(t0)}</span></h3>`;
    } else if (r[6]) {
      for (const x of DIAL.rows) if (x !== r && x[6] === r[6]) rel.push(x);
      if (rel.length) h += `<h3>${TX.sameGloss}</h3>`;
    }
    if (rel.length) h += `<ul class="rel">${rel.slice(0, 16).map(x => `<li><a href="#t=d&id=${x[0]}" class="hangul">${esc(x[8] & 2 ? dForms(x)[0][0] : x[1])}</a>${x[2] ? `<span class="faint">「${x[2]}」</span>` : ''} <span class="hangul faint">${dForms(x).slice(0, 4).map(f => esc(f[0])).join('　')}</span></li>`).join('')}</ul>`;
    const od = q => `https://opendict.korean.go.kr/search/searchResult?query=${encodeURIComponent(q)}`;
    h += `<p class="faint" style="font-size:12px;margin-top:18px">${TX.dSource(tr.length)}<a href="${od(loose ? fs[0][0] : r[1])}" rel="noopener" target="_blank">${TX.openOD}</a>${loose ? '' : `　<a class="report" href="${reportUrl({ id, hw: r[1], sn: r[2], ja: tr, other: (r[LANG === 'en' ? 4 : 5] || '').split(LANG === 'en' ? '；' : '; ').filter(Boolean) }, fs.map(f => [null, f[0]]))}" target="_blank" rel="noopener" title="${esc(TX.reportTip)}">${TX.report}</a>`}</p></div>`;
    $('#detail').innerHTML = h;
    if (Study) { openedEntry = dEntry(r); Study.bindBar($('#detail'), openedEntry); }
    $('#detail').scrollTop = 0;
    $$('#detail .dleg li').forEach(li => { li.onclick = () => focusGroup(li); li.onkeydown = ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); focusGroup(li); } }; });
  }
  // 地域を地図で選ぶ（語群を開いていないときの右の欄）
  function dEmpty() {
    dcur = null; picking = true;
    const counts = {};
    for (const r of DIAL.rows) { const seen = new Set(); dForms(r).forEach(f => f[1].forEach(c => { counts[c] ??= [0, 0]; counts[c][1]++; if (!seen.has(c)) { seen.add(c); counts[c][0]++; } })); }
    const R = MAP.regions;
    let svg = `<svg class="pick-svg" viewBox="0 0 ${MAP.w} ${MAP.h}" role="group" aria-label="${TX.pickTitle}"><rect width="${MAP.w}" height="${MAP.h}" class="dm-sea"/>`;
    MAP.shapes.forEach(([kind, code, path]) => {
      svg += kind === 'land' ? `<path d="${path}" class="dm-land"/>` : `<path d="${path}" class="pk-prov" data-code="${code}" tabindex="-1"><title>${esc(rname(code))}（${esc(R[code]?.[0] || code)}）　${TX.pickN(...(counts[code] || [0, 0]).map(n => n.toLocaleString()))}</title></path>`;
    });
    // 道全体の記録（경상 など）と，枠内の中国の地域は点で
    Object.entries(R).forEach(([c, [ko, , x, y]]) => {
      if (x == null || MAP.shapes.some(s => s[1] === c)) return;
      const whole = childrenOf(c).length > 0;
      svg += `<g class="pk-pt" data-code="${c}" tabindex="0" role="button"><title>${esc(whole ? TX.rgWhole(rname(c)) : rname(c))}（${esc(ko)}）　${TX.pickN(...(counts[c] || [0, 0]).map(n => n.toLocaleString()))}</title><circle cx="${x}" cy="${y}" r="7"/><text x="${x}" y="${y + (whole ? 17 : -10)}" text-anchor="middle">${esc(rname(c))}</text></g>`;
    });
    svg += '</svg>';
    const off = Object.entries(R).filter(([, r]) => r[2] == null).map(([c, [ko]]) => `<button type="button" class="chip" data-code="${c}" title="${esc(ko)}">${esc(rname(c))}</button>`).join('');
    const tips = TX.dTips.map(([lab, ws]) => `<li>${lab}${ws.map(w => `<a class="${/[a-z]/.test(w) ? '' : 'hangul'}" href="#t=d&q=${encodeURIComponent(w)}">${esc(w)}</a>`).join(TX.sep)}</li>`).join('');
    $('#detail').innerHTML = `<div class="entry"><h3 style="margin-top:0">${TX.pickTitle}</h3><div class="pick">${svg}<div class="pick-side"><div class="chips">${off}</div><p class="faint dmap-note">${TX.pickNote}</p>
      <h3>${TX.dUsage}</h3><ul class="tips">${tips}</ul><p class="faint dmap-note">${TX.dSource(true)}</p></div></div></div>`;
    $$('#detail [data-code]').forEach(el => {
      const go = () => { toggleRegion(el.dataset.code); };
      el.addEventListener('click', go);
      el.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); go(); } });
    });
    syncPicker();
  }
  function toggleRegion(c) { RSEL.has(c) ? RSEL.delete(c) : RSEL.add(c); dcur = null; dsearch($('#q').value).then(setHash); }
  function syncPicker() {
    $$('[data-code]').forEach(el => el.classList.toggle('on', RSEL.has(el.dataset.code)));
    $$('#rchips .chip[data-group]').forEach(b => {
      const cs = b.dataset.group.split(','), n = cs.filter(c => RSEL.has(c)).length;
      b.classList.toggle('on', n === cs.length); b.classList.toggle('part', n > 0 && n < cs.length);
      b.setAttribute('aria-pressed', n === cs.length ? 'true' : n ? 'mixed' : 'false');
    });
    $('#rclear').hidden = !RSEL.size;
    $('#rinfo').textContent = TX.dRegions(RSEL.size);
  }
  function buildChips() {
    $('#rchips').innerHTML = regionGroups().map(([k, name, cs]) => `<button type="button" class="chip" data-group="${cs.join(',')}" title="${esc(cs.map(c => MAP.regions[c]?.[0] || c).join('・'))}">${esc(name)}</button>`).join('');
    $$('#rchips .chip').forEach(b => b.addEventListener('click', () => {
      const cs = b.dataset.group.split(','), all = cs.every(c => RSEL.has(c));
      cs.forEach(c => (all ? RSEL.delete(c) : RSEL.add(c)));
      dcur = null; dsearch($('#q').value).then(setHash);
    }));
  }
  // タブ（歴史形／方言）
  async function setTab(t, run = true) {
    TAB = t === 'd' ? 'd' : 'h';
    document.body.dataset.tab = TAB;
    $$('.tabs [data-tab]').forEach(b => b.setAttribute('aria-selected', b.dataset.tab === TAB));
    $('#q').placeholder = TAB === 'd' ? TX.dPlaceholder : TX.hPlaceholder;
    if (TAB === 'd') { await loadDial(); if (!$('#rchips').children.length) buildChips(); }
    if (run) { if (TAB === 'd') await dsearch($('#q').value); else search($('#q').value); }
  }

  // ---------- 訳：ページ上の語を選ぶと「訳」ボタン．中期・近世の形としての項目と，現代語としての日本語訳（한국어기초사전）を引く
  const SB = 0xAC00, JONGS = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
  const split = ch => { const o = ch.codePointAt(0) - SB; return o >= 0 && o < 11172 ? [Math.floor(o / 588), Math.floor((o % 588) / 28), o % 28] : null; };
  const join = (l, v, t) => String.fromCharCode(SB + (l * 21 + v) * 28 + t);
  const withJong = (ch, j) => { const p = split(ch); return p ? join(p[0], p[1], JONGS.indexOf(j)) : ch; };
  const PART = ' 이라는 이라고 이라도 이라면 에서는 에게서 으로서 으로써 으로는 에서도 에게는 까지는 부터는 처럼 보다 에서 에게 한테 께서 으로 까지 부터 마저 조차 이나 이며 이고 이랑 하고 이 가 은 는 을 를 의 에 와 과 도 만 로 나 며 고 랑 께 서'.trim().split(' ').sort((a, b) => b.length - a.length);
  const ENDS = '었었다 았었다 겠다 었다 았다 였다 습니다 는다 어서 아서 여서 으면 으며 으니 으나 으려 거나 지만 도록 는데 은데 던 고 며 면 니 게 지 기 음 은 는 을 어 아 여 다'.split(' ').sort((a, b) => b.length - a.length);
  function sylRules(x) {
    const p = x ? split(x.slice(-1)) : null; if (!p) return [];
    const [l, v, t] = p, base = join(l, v, 0), jong = JONGS[t], out = [], pre = x.slice(0, -1);
    if (['ㄴ', 'ㄹ', 'ㅁ', 'ㅂ'].includes(jong)) out.push(pre + base, pre + withJong(base, 'ㄹ'));
    if (jong === 'ㅆ') out.push(pre + base);
    if (base === '해' && (jong === '' || jong === 'ㅆ')) out.push(pre + '하');
    if (base === '하' && jong === 'ㄴ') out.push(pre + '하');
    if ((base === '워' || base === '우') && x.length > 1 && ['', 'ㄴ', 'ㄹ', 'ㅁ'].includes(jong)) out.push(x.slice(0, -2) + withJong(x.slice(-2, -1), 'ㅂ'));
    if (base === '와' && x.length > 1) out.push(pre + '오');
    return out;
  }
  function candidates(text) {
    const m = (text || '').normalize('NFC').match(/[가-힣]+/g); if (!m) return [];
    const w = m.sort((a, b) => b.length - a.length)[0];
    let out = [w];
    const nouns = PART.filter(p => w.endsWith(p) && w.length > p.length).map(p => w.slice(0, -p.length));
    ['이었다', '이다', '인', '임', '이며', '이고', '이나', '이어서', '였다', '이므로'].forEach(c => { if (w.endsWith(c) && w.length > c.length) nouns.push(w.slice(0, -c.length)); });
    let stems = ENDS.filter(e => w.endsWith(e) && w.length > e.length).map(e => w.slice(0, -e.length));
    [w, ...stems].forEach(x => { stems = stems.concat(sylRules(x)); });
    out = [w, ...stems.map(x => x + '다'), ...nouns, ...stems];
    return [...new Set(out.filter(Boolean))].slice(0, 24);
  }
  const JA = {};
  const jaShard = n => (JA[n] ??= fetch(`${BASE}data/${LANG}/${String(n).padStart(2, '0')}.json`).then(r => r.json()).catch(() => ({})));
  async function jaLookup(cands) {
    const shards = [...new Set(cands.map(c => c.codePointAt(0) % (META.tr_shards || META.ja_shards || 32)))];
    const loaded = await Promise.all(shards.map(jaShard));
    const dict = Object.assign({}, ...loaded), hits = [];
    cands.forEach(c => (dict[c] || []).forEach(x => hits.push([c, ...x])));
    return hits.slice(0, 12);
  }
  function oldForms(word) {
    // 用例の語は助詞・語尾が付いていることがあるので，形のキーが語のキーの頭に一致するもの（いちばん長いもの）を探す
    const w = (word.split(/[\s,.;:!?()「」（）]+/).find(t => /[ᄀ-ᇿ가-힣ꥠ-꥿ힰ-퟿ㄱ-ㆎ]/.test(t)) || '');
    const q = normalize(w), Q = queryKeys(q);
    let best = 0, form = '';
    const rows = [];
    for (const r of INDEX) {
      let L = 0, hit = '';
      for (const f of rowForms(r)) {
        const l = pairs(f, Q, 'era').some(([fk, qk]) => fk && fk === qk) || f[1] === q ? 1 : stemLen(f, Q, 'era');
        if (l > L) { L = l; hit = f[1]; }
      }
      if (!L || L < best) continue;
      if (L > best) { best = L; rows.length = 0; form = hit; }
      rows.push(r);
    }
    return { form: form.normalize('NFC'), rows: rows.slice(0, 6) };
  }
  let tbtn = null, tpop = null;
  const dropBtn = () => { tbtn?.remove(); tbtn = null; }, dropPop = () => { tpop?.remove(); tpop = null; };
  document.addEventListener('pointerup', e => {
    if (e.target.closest?.('.tr-pop, .tr-btn, input, button, .palette')) return;
    setTimeout(() => {
      const sel = getSelection(), t = sel ? sel.toString().trim() : '';
      dropBtn();
      if (!t || t.length > 30 || !/[ᄀ-ᇿ가-힣ꥠ-꥿ힰ-퟿]/.test(t) || !sel.rangeCount) return;
      const r = sel.getRangeAt(0).getBoundingClientRect();
      tbtn = Object.assign(document.createElement('button'), { type: 'button', className: 'tr-btn', textContent: TX.trBtn });
      tbtn.style.left = Math.min(scrollX + r.right + 6, scrollX + innerWidth - 60) + 'px';
      tbtn.style.top = (scrollY + r.top - 4) + 'px';
      tbtn.addEventListener('mousedown', ev => ev.preventDefault());
      tbtn.addEventListener('click', () => { const at = { x: scrollX + r.left, y: scrollY + r.bottom + 8 }; dropBtn(); openPop(t, at); });
      document.body.appendChild(tbtn);
    }, 0);
  });
  document.addEventListener('mousedown', e => { if (tpop && !e.target.closest?.('.tr-pop')) dropPop(); if (tbtn && !e.target.closest?.('.tr-btn')) dropBtn(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { dropBtn(); dropPop(); } });
  function openPop(word, at) {
    dropPop();
    tpop = document.createElement('div'); tpop.className = 'tr-pop'; tpop.setAttribute('role', 'dialog'); tpop.setAttribute('aria-label', TX.trAria);
    tpop.style.left = Math.max(scrollX + 8, Math.min(at.x, scrollX + innerWidth - 432)) + 'px'; tpop.style.top = at.y + 'px';
    tpop.innerHTML = `<form class="tr-head"><input value="${esc(word)}" aria-label="${TX.look}"><button type="submit">${TX.look}</button></form><div class="tr-body"></div><div class="tr-foot"></div>`;
    document.body.appendChild(tpop);
    const inp = tpop.querySelector('input');
    tpop.querySelector('form').addEventListener('submit', e => { e.preventDefault(); runTr(compose(inp.value).normalize('NFC')); });
    runTr(word);
  }
  async function runTr(word) {
    const body = tpop.querySelector('.tr-body'), foot = tpop.querySelector('.tr-foot');
    body.innerHTML = `<div class="loading">${TX.looking}</div>`;
    const old = oldForms(word), cands = candidates(word), ja = cands.length ? await jaLookup(cands) : [];
    let h = '';
    if (old.rows.length) {
      h += `<div class="tr-sec">${TX.asOld(esc(old.form))}</div>` + old.rows.map(r =>
        `<div class="tr-hit"><a href="#" class="tr-hw" data-open="${r[0]}">${esc(r[1])}</a>${r[2] ? `<span class="faint">「${r[2]}」</span>` : ''}${r[TRI] ? `<div class="tr-ja">${esc(r[TRI])}</div>` : ''}<div class="tr-ko">${esc(r[7] || '')}</div></div>`).join('');
    }
    if (ja.length) {
      h += `<div class="tr-sec">${TX.asModern}</div>` + ja.map(([hw, pos, sn, jl, jd, ko]) =>
        `<div class="tr-hit"><span class="tr-hw">${esc(hw)}</span> <span class="tag">${esc(pos || '')}</span>${sn ? `<span class="faint">「${sn}」</span>` : ''}<div class="tr-ja">${esc(jl)}</div>${jd ? `<div class="tr-def">${esc(jd)}</div>` : ''}<div class="tr-ko">${esc(ko || '')}</div></div>`).join('');
    }
    body.innerHTML = h || `<div class="tr-hit tr-def">${TX.trNone}</div>`;
    const key = old.form || cands[0] || word;
    foot.innerHTML = `<a href="#q=${encodeURIComponent(key)}">${TX.searchThis}</a>${TX.naver(cands[0] || word)}`;
    body.querySelectorAll('[data-open]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); dropPop(); open(+a.dataset.open); }));
  }

  // ---------- 状態（URL の # に検索語と項目を残す）
  //   t=d 方言の検索（無ければ歴史形），q 検索語，id 項目・語群，r 地域（コードの , 区切り），rm 地域の条件，dt 方言で引く対象
  function setHash() {
    const p = new URLSearchParams();
    if (TAB === 'd') p.set('t', 'd');
    if ($('#q').value.trim()) p.set('q', $('#q').value.trim());
    const id = TAB === 'd' ? dcur : current;
    if (id) p.set('id', id);
    if (TAB === 'd') {
      if (RSEL.size) p.set('r', [...RSEL].join(','));
      if (RSEL.size && drm() !== 'any') p.set('rm', drm());
      if (dtarget() !== 'auto') p.set('dt', dtarget());
    }
    history.replaceState(null, '', '#' + p.toString());
  }
  let hashKey = '';
  async function fromHash() {
    const p = new URLSearchParams(location.hash.slice(1)), t = p.get('t') === 'd' ? 'd' : 'h', id = +p.get('id') || null;
    $('#q').value = p.get('q') || '';
    if (t === 'd') {
      RSEL.clear(); (p.get('r') || '').split(',').filter(Boolean).forEach(c => RSEL.add(c));
      if (p.get('rm') && $(`#drm option[value="${p.get('rm')}"]`)) $('#drm').value = p.get('rm'); else $('#drm').value = 'any';
      $('#dtarget').value = $(`#dtarget option[value="${p.get('dt')}"]`) ? p.get('dt') : 'auto';
      dcur = id;
    } else current = id;
    hashKey = [t, p.get('q') || '', p.get('r') || '', p.get('rm') || '', p.get('dt') || ''].join('\u0001');
    await setTab(t);
    if (id) open(id, true);
  }
  // # が変わったら（リンクや「戻る」，報告の URL の #id= など）：タブ・検索語・地域が変わったら引き直し，項目番号だけ変わったら開く
  window.addEventListener('hashchange', () => {
    const p = new URLSearchParams(location.hash.slice(1)), id = +p.get('id') || null, t = p.get('t') === 'd' ? 'd' : 'h';
    const key = [t, p.get('q') || '', p.get('r') || '', p.get('rm') || '', p.get('dt') || ''].join('\u0001');
    if (key !== hashKey && (p.has('q') || p.has('r') || t !== TAB || !id)) { fromHash(); return; }
    if (id && id !== (TAB === 'd' ? dcur : current)) open(id, true);
  });
  $$('.tabs [data-tab]').forEach(b => b.addEventListener('click', async () => {
    if (b.dataset.tab === TAB) return;
    await setTab(b.dataset.tab);
    setHash(); hashKey = '';
  }));
  ['#drm', '#dtarget', '#dmode'].forEach(sel => $(sel).addEventListener('change', () => { dcur = null; dsearch($('#q').value).then(setHash); }));
  $('#rclear').addEventListener('click', () => { RSEL.clear(); dcur = null; dsearch($('#q').value).then(setHash); });
  $('#rpick').addEventListener('click', () => { picking = true; dcur = null; $$('#results .item').forEach(li => li.setAttribute('aria-selected', 'false')); dEmpty(); setHash(); });
  $('#f').addEventListener('submit', async e => { e.preventDefault(); current = null; dcur = null; picking = false; await search($('#q').value); setHash(); });
  $$('.stages input').forEach(i => i.addEventListener('change', () => search($('#q').value)));
  $('#mode').addEventListener('change', () => { try { localStorage.setItem('lexica.mode', mode()); } catch (_) { /* なし */ } search($('#q').value); });
  try { const m = localStorage.getItem('lexica.mode'); if (m && $(`#mode option[value="${m}"]`)) $('#mode').value = m; } catch (_) { /* なし */ }
  // 字母のボタン：入力欄のカーソル位置を覚えておき，そこに入れてから音節にまとめる
  const qi = $('#q');
  let caret = null;
  const remember = () => { caret = [qi.selectionStart, qi.selectionEnd]; };
  ['keyup', 'click', 'select', 'input', 'compositionend', 'blur'].forEach(ev => qi.addEventListener(ev, remember));
  function insertJamo(ch) {
    // ハングルキーボード（hangulkbd.js）があれば，その組み立て（겹모음・겹받침も）で入れる
    if (window.HKbd) { if (caret) qi.setSelectionRange(caret[0], caret[1]); window.HKbd.type(ch, qi); remember(); return; }
    const v = qi.value, [a, b] = caret || [v.length, v.length];
    const head = compose(v.slice(0, a) + ch).normalize('NFC'), tail = v.slice(b);
    qi.value = head + tail;
    caret = [head.length, head.length];
    qi.focus({ preventScroll: true });
    qi.setSelectionRange(head.length, head.length);
  }
  $$('.palette button').forEach(b => b.addEventListener('click', () => insertJamo(b.dataset.ins)));
  qi.addEventListener('blur', () => { const v = compose(qi.value).normalize('NFC'); if (v !== qi.value) qi.value = v; });

  // 表示
  try { const t = localStorage.getItem('lexica.theme'); if (t) document.documentElement.dataset.theme = t; } catch (_) { /* なし */ }
  const isDark = () => document.documentElement.dataset.theme === 'dark' || (!document.documentElement.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches);
  const lab = () => { $('#theme').textContent = isDark() ? TX.light : TX.dark; };
  lab();
  $('#theme').onclick = () => { document.documentElement.dataset.theme = isDark() ? 'light' : 'dark'; try { localStorage.setItem('lexica.theme', document.documentElement.dataset.theme); } catch (_) { /* なし */ } lab(); };
  const top = $('.top'); const setTop = () => document.documentElement.style.setProperty('--top-h', top.offsetHeight + 'px');
  setTop(); new ResizeObserver(setTop).observe(top);

  Promise.all([fetch(BASE + 'data/meta.json').then(r => r.json()), fetch(BASE + 'data/index.json').then(r => r.json()), fetch(BASE + 'data/jamo.json').then(r => r.json()),
    fetch(BASE + 'corrections/translations.tsv', { cache: 'no-cache' }).then(r => (r.ok ? r.text() : '')).catch(() => '')]).then(([m, idx, jamo, corr]) => {
    META = m; INDEX = idx; HKey.init(jamo);
    loadCorrections(corr);
    setupStudy();
    $('#meta').textContent = TX.meta(m) + (m.dialect ? (LANG === 'en' ? ' · ' : '・') + TX.dMeta(m.dialect) : '');
    fromHash();
  }).catch(() => { $('#info').textContent = TX.loadErr; });
})();
