/* Client Contact Log — shared logic (data shape, dates, capacity, badges, export, demo data)
 * Where data lives (nothing is sent anywhere else):
 *   card   t.set('card',  'shared', 'log', {...})   the contact records of each card
 *   board  t.set('board', 'shared', 'cfg', {...})   language, stale-contact days, channels, muted lists
 * Trello limit: 4096 characters of serialized data per card (scope/visibility pair), so each card
 * holds a few dozen records. Old records are exported and removed with "Archive old records".
 */
(function (root) {
  'use strict';

  var CCL = {
    VERSION: '1.1.0', KEY: 'log', CFG_KEY: 'cfg',
    HARD_LIMIT: 4096,   // Trello's limit for card/shared
    SIZE_LIMIT: 4000,   // what this Power-Up allows itself, leaving a margin
    WARN_PCT: 85, TEXT_MAX: 600, PREVIEW: 5,
    BUILTIN: ['w', 'p', 'e', 'm', 's', 'o']
  };
  var STR = root.CCL_STR || (typeof require === 'function' ? require('./i18n.js') : { en: {}, zh: {} });

  /* ---------- language ---------- */
  CCL.lang = 'en';
  CCL.detectLang = function () {
    var l = String(root.locale || (root.navigator && root.navigator.language) || 'en').toLowerCase();
    return l.indexOf('zh') === 0 ? 'zh' : 'en';
  };
  CCL.useCfg = function (cfg) {
    CCL.lang = cfg && (cfg.lang === 'en' || cfg.lang === 'zh') ? cfg.lang : CCL.detectLang();
    return cfg;
  };
  // tr('key', a, b): looks up the string in the current language, falls back to English.
  CCL.tr = function (key) {
    var args = arguments;
    var table = STR[CCL.lang] || STR.en;
    var s;
    if (args[1] === 1 && table[key + '_1'] !== undefined) s = table[key + '_1'];
    else s = table[key];
    if (s === undefined) s = STR.en[key];
    if (s === undefined) return key;
    return s.replace(/\{(\d)\}/g, function (m, i) {
      var v = args[+i + 1];
      return v === undefined || v === null ? '' : String(v);
    });
  };

  /* ---------- time (stored as whole minutes since 1970-01-01 UTC, shown in the browser's time zone) ---------- */
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  CCL.nowMin = function () { return Math.floor(Date.now() / 60000); };
  // value for <input type="datetime-local">
  CCL.toInput = function (min) {
    var d = new Date(min * 60000);
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  };
  CCL.fromInput = function (s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(s || '');
    if (!m) return null;
    var d = new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
    var v = Math.floor(d.getTime() / 60000);
    return isFinite(v) && v > 0 ? v : null;
  };
  CCL.isoDate = function (min) {
    var d = new Date(min * 60000);
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  };
  CCL.isoTime = function (min) {
    var d = new Date(min * 60000);
    return pad(d.getHours()) + ':' + pad(d.getMinutes());
  };
  CCL.fmtDate = function (min) {
    var d = new Date(min * 60000);
    try {
      var loc = (root.navigator && root.navigator.language) || undefined;
      return new Intl.DateTimeFormat(loc, { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
    } catch (e) {
      return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear();
    }
  };
  CCL.fmtDateTime = function (min) { return CCL.fmtDate(min) + ' ' + CCL.isoTime(min); };
  // whole calendar days between two moments, in the browser's time zone
  CCL.daysSince = function (min, nowMin) {
    var a = new Date(min * 60000), b = new Date((nowMin === undefined ? CCL.nowMin() : nowMin) * 60000);
    var a0 = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
    var b0 = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();
    return Math.round((b0 - a0) / 86400000);
  };

  /* ---------- data shape ----------
   * stored   {v, rv, m:[names], e:[[id, t, ch, dir, who, text], …], a?, at?}
   *   rv   revision counter, bumped on every save
   *   m    names of the people who logged records; an entry's `who` is an index into it (-1 = unknown)
   *   t    minutes since epoch            ch   built-in code (w p e m s o) or a custom channel name
   *   dir  0 client contacted us · 1 we contacted the client
   *   a    number of records archived and removed from the card     at  time of the newest archived record
   * in memory {v, rv, a, at, e:[{i, t, c, d, w, x}]}   (w is the name itself), sorted oldest first
   */
  CCL.newId = function () { return Math.random().toString(36).slice(2, 6); };
  function byTime(a, b) { return a.t - b.t; }
  CCL.normalize = function (raw) {
    var out = { v: 1, rv: 0, a: 0, at: 0, e: [] };
    if (!raw || typeof raw !== 'object') return out;
    if (typeof raw.rv === 'number' && raw.rv > 0) out.rv = Math.floor(raw.rv);
    if (typeof raw.a === 'number' && raw.a > 0) out.a = Math.floor(raw.a);
    if (typeof raw.at === 'number' && raw.at > 0) out.at = Math.floor(raw.at);
    var names = Array.isArray(raw.m) ? raw.m.map(function (n) { return String(n); }) : [];
    var seen = {};
    (Array.isArray(raw.e) ? raw.e : []).forEach(function (r) {
      if (!Array.isArray(r)) return;
      var t = +r[1];
      if (!isFinite(t) || t <= 0) return;
      var id = String(r[0] || CCL.newId());
      while (seen[id]) id = CCL.newId();
      seen[id] = true;
      out.e.push({
        i: id, t: Math.floor(t),
        c: typeof r[2] === 'string' && r[2] ? r[2] : 'o',
        d: r[3] === 1 ? 1 : 0,
        w: typeof r[4] === 'number' && names[r[4]] !== undefined ? names[r[4]] : '',
        x: String(r[5] === undefined || r[5] === null ? '' : r[5])
      });
    });
    out.e.sort(byTime);
    return out;
  };
  CCL.compact = function (log) {
    var names = [], idx = {};
    var e = (log.e || []).slice().sort(byTime).map(function (en) {
      var w = -1;
      if (en.w) {
        if (idx[en.w] === undefined) { idx[en.w] = names.length; names.push(en.w); }
        w = idx[en.w];
      }
      return [en.i, en.t, en.c, en.d ? 1 : 0, w, String(en.x || '').trim()];
    });
    var out = { v: 1, rv: log.rv || 0, m: names, e: e };
    if (log.a > 0) { out.a = log.a; if (log.at > 0) out.at = log.at; }
    return out;
  };
  // characters this payload costs against Trello's limit, counting the {"log":…} wrapper
  CCL.sizeOf = function (payload) { return JSON.stringify(payload).length + CCL.KEY.length + 5; };

  CCL.usage = function (log) {
    var payload = CCL.compact(log);
    var used = CCL.sizeOf(payload), n = payload.e.length;
    var avg = n ? Math.ceil(JSON.stringify(payload.e).length / n) : 110;
    var left = Math.max(0, CCL.SIZE_LIMIT - used);
    return { used: used, pct: Math.min(100, Math.round(used / CCL.SIZE_LIMIT * 100)), room: Math.floor(left / Math.max(avg, 40)), n: n };
  };
  CCL.summary = function (log, nowMin) {
    var n = log.e.length, last = n ? log.e[n - 1] : null;
    return { n: n, total: n + (log.a || 0), last: last, days: last ? Math.max(0, CCL.daysSince(last.t, nowMin)) : null };
  };

  /* ---------- changes ---------- */
  CCL.addEntry = function (log, en) {
    log.e.push({ i: CCL.newId(), t: en.t, c: en.c || 'o', d: en.d ? 1 : 0, w: en.w || '', x: String(en.x || '').trim() });
    log.e.sort(byTime);
    return log;
  };
  CCL.updateEntry = function (log, id, en) {
    for (var k = 0; k < log.e.length; k++) {
      if (log.e[k].i === id) {
        log.e[k].t = en.t; log.e[k].c = en.c || 'o'; log.e[k].d = en.d ? 1 : 0; log.e[k].x = String(en.x || '').trim();
        log.e.sort(byTime);
        return true;
      }
    }
    return false;
  };
  CCL.removeEntry = function (log, id) {
    var before = log.e.length;
    log.e = log.e.filter(function (en) { return en.i !== id; });
    return log.e.length !== before;
  };
  // removes the oldest entries whose ids are given, and remembers how many were archived
  CCL.archive = function (log, ids) {
    var want = {}, removed = [];
    ids.forEach(function (id) { want[id] = true; });
    log.e = log.e.filter(function (en) {
      if (want[en.i]) { removed.push(en); return false; }
      return true;
    });
    if (removed.length) {
      log.a = (log.a || 0) + removed.length;
      var newest = removed[removed.length - 1].t;
      if (!log.at || newest > log.at) log.at = newest;
    }
    return removed;
  };

  /* ---------- channels and direction ---------- */
  CCL.isBuiltin = function (c) { return CCL.BUILTIN.indexOf(c) >= 0; };
  CCL.chLabel = function (c) { return CCL.isBuiltin(c) ? CCL.tr('ch_' + c) : String(c); };
  CCL.dirLabel = function (d) { return CCL.tr(d ? 'dir1' : 'dir0'); };
  CCL.channelList = function (cfg) {
    var out = [];
    CCL.BUILTIN.forEach(function (k) { if ((cfg.off || []).indexOf(k) < 0) out.push({ k: k, n: CCL.tr('ch_' + k) }); });
    (cfg.ch || []).forEach(function (n) { out.push({ k: n, n: n }); });
    if (!out.length) out.push({ k: 'o', n: CCL.tr('ch_o') });
    return out;
  };

  /* ---------- board settings ---------- */
  CCL.defaultCfg = function () { return { lang: 'auto', stale: 30, off: [], ch: [], xl: [] }; };
  CCL.cfg = function (raw) {
    var out = CCL.defaultCfg();
    if (raw && typeof raw === 'object') {
      if (raw.lang === 'en' || raw.lang === 'zh') out.lang = raw.lang;
      var st = parseInt(raw.stale, 10);
      if (isFinite(st) && st >= 0 && st <= 3650) out.stale = st;
      if (Array.isArray(raw.off)) out.off = raw.off.filter(CCL.isBuiltin);
      if (Array.isArray(raw.ch)) out.ch = CCL.cleanChannels(raw.ch);
      if (Array.isArray(raw.xl)) out.xl = raw.xl.map(String);
    }
    CCL.useCfg(out);
    return out;
  };
  // custom channel names: trimmed, unique, never one of the built-in single-letter codes
  CCL.cleanChannels = function (list) {
    var seen = {}, out = [];
    (list || []).forEach(function (n) {
      n = String(n || '').trim().slice(0, 20);
      if (!n || CCL.isBuiltin(n) || seen[n]) return;
      seen[n] = true;
      out.push(n);
    });
    return out.slice(0, 12);
  };
  CCL.isStale = function (days, cfg, listId) {
    if (days === null || !cfg.stale) return false;
    if (listId && (cfg.xl || []).indexOf(listId) >= 0) return false;
    return days >= cfg.stale;
  };

  /* ---------- badges ---------- */
  CCL.badges = function (raw, cfg, listId, nowMin) {
    if (!raw) return [];
    var s = CCL.summary(CCL.normalize(raw), nowMin);
    if (!s.n) return [];
    var badge = { text: s.days === 0 ? CCL.tr('bd_today') : CCL.tr('bd_days', s.days) };
    if (CCL.isStale(s.days, cfg, listId)) badge.color = 'red';
    return [badge];
  };
  CCL.detailBadges = function (raw, cfg, listId, nowMin) {
    if (!raw) return [];
    var log = CCL.normalize(raw), s = CCL.summary(log, nowMin);
    if (!s.n) return [];
    var last = { title: CCL.tr('db_last'), text: CCL.tr('db_last_v', CCL.fmtDate(s.last.t), CCL.chLabel(s.last.c)) };
    if (CCL.isStale(s.days, cfg, listId)) last.color = 'red';
    var out = [last, { title: CCL.tr('db_count'), text: CCL.tr('db_count_v', s.total) }];
    var u = CCL.usage(log);
    if (u.pct >= CCL.WARN_PCT) out.push({ title: CCL.tr('db_space'), text: u.pct + '%', color: 'orange' });
    return out;
  };

  /* ---------- export ---------- */
  function oneLine(s) { return String(s || '').replace(/\s*\r?\n\s*/g, ' / '); }
  CCL.toText = function (cardName, entries) {
    var lines = [CCL.tr('tx_head', cardName || ''), CCL.tr('tx_exported', CCL.isoDate(CCL.nowMin()) + ' ' + CCL.isoTime(CCL.nowMin())), CCL.tr('tx_cols')];
    entries.slice().sort(byTime).forEach(function (en) {
      lines.push([CCL.isoDate(en.t) + ' ' + CCL.isoTime(en.t), CCL.chLabel(en.c), CCL.dirLabel(en.d), en.w || '-', oneLine(en.x)].join(' | '));
    });
    return lines.join('\n');
  };
  function csvCell(v) {
    var s = String(v === undefined || v === null ? '' : v);
    if (/^[=+\-@]/.test(s)) s = "'" + s;           // stop spreadsheet apps treating text as a formula
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }
  // rows: [{card:{name}, list, log}]
  CCL.toCsv = function (rows) {
    var lines = [CCL.tr('csv_head')];
    rows.forEach(function (x) {
      if (!x.log) return;
      x.log.e.forEach(function (en) {
        lines.push([x.card.name, x.list, CCL.isoDate(en.t), CCL.isoTime(en.t), CCL.chLabel(en.c), CCL.dirLabel(en.d), en.w || '', oneLine(en.x)].map(csvCell).join(','));
      });
    });
    return lines.join('\n');
  };
  CCL.copyFrom = function (area, done) {
    area.focus(); area.select();
    try {
      if (root.navigator && root.navigator.clipboard && root.navigator.clipboard.writeText) {
        root.navigator.clipboard.writeText(area.value).then(done, function () { if (document.execCommand('copy')) done(); });
      } else if (document.execCommand('copy')) done();
    } catch (e) { /* the text stays selected so it can be copied by hand */ }
  };

  /* ---------- who may see contact records ----------
   * Records are shown only to signed-in members who can edit the board. This is a display rule,
   * not a security boundary: Trello "shared" plugin data is readable by anyone who can read the board.
   */
  CCL.canSee = function (t) {
    try {
      if (typeof t.isMemberSignedIn === 'function' && !t.isMemberSignedIn()) return false;
      var p = (t.getContext() || {}).permissions;
      if (p && p.board && p.board !== 'write') return false;
    } catch (e) { /* if the context is unavailable, fall through and show */ }
    return true;
  };

  /* ---------- tiny DOM helpers (textContent only, never HTML strings) ---------- */
  CCL.h = function (tag, attrs, kids) {
    var el = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v === null || v === undefined || v === false) return;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), v);
      else if (k === 'value') el.value = v;
      else if (v === true) el.setAttribute(k, '');
      else el.setAttribute(k, v);
    });
    (kids || []).forEach(function (c) {
      if (c === null || c === undefined || c === false) return;
      el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return el;
  };
  CCL.fill = function (el, kids) {
    el.replaceChildren.apply(el, (kids || []).filter(function (k) { return k !== null && k !== undefined && k !== false; }));
    return el;
  };
  CCL.applyTheme = function (t) {
    try {
      var ctx = t.getContext ? t.getContext() : null;
      var set = function (theme) { document.documentElement.setAttribute('data-theme', theme === 'dark' ? 'dark' : 'light'); };
      if (ctx && ctx.initialTheme) set(ctx.initialTheme);
      if (typeof t.subscribeToThemeChanges === 'function') t.subscribeToThemeChanges(set);
    } catch (e) { /* stay on the light theme if the theme API is unavailable */ }
  };
  CCL.errText = function (err) { return err && err.message ? err.message : CCL.tr('err_unknown'); };

  /* ---------- Trello vs demo environment ---------- */
  CCL.inTrello = function () {
    return !!(root.TrelloPowerUp && root.location && root.location.hash && root.location.hash.length > 1);
  };
  CCL.getT = function () {
    if (CCL.inTrello()) return root.TrelloPowerUp.iframe();
    CCL.demo = true;
    return CCL.mockT();
  };

  // Fictional demo data, used only when a page is opened outside Trello.
  var mock = null;
  CCL.mockT = function () {
    if (mock) return mock;
    var now = CCL.nowMin(), D = 1440;
    var zh = CCL.detectLang() === 'zh';
    var N = zh
      ? { l1: '进行中', l2: '已递交', l3: '已结案', c: '示例客户 ', me: '演示用户', other: '同事甲',
          x1: '客户问补料清单，已把清单发过去。', x2: '电话确认体检预约时间，客户说下周三去。', x3: '客户发来无犯罪记录扫描件，已收到。',
          x4: '告知客户申请已递交，等待审理。', x5: '客户问审理进度，回复目前仍在排队。', x6: '结案面谈，交还原件。' }
      : { l1: 'In progress', l2: 'Lodged', l3: 'Finished', c: 'Sample Client ', me: 'Demo User', other: 'Colleague A',
          x1: 'Client asked for the document checklist; sent it.', x2: 'Confirmed the medical appointment by phone; client is going next Wednesday.', x3: 'Client sent the police check scan; received.',
          x4: 'Told the client the application has been lodged.', x5: 'Client asked about progress; replied it is still in the queue.', x6: 'Closing meeting; returned originals.' };
    var store = {
      board: {},
      lists: [{ id: 'l1', name: N.l1 }, { id: 'l2', name: N.l2 }, { id: 'l3', name: N.l3 }],
      cards: [
        { id: 'c1', name: N.c + 'A', idList: 'l1' },
        { id: 'c2', name: N.c + 'B', idList: 'l2' },
        { id: 'c3', name: N.c + 'C', idList: 'l3' },
        { id: 'c4', name: N.c + 'D', idList: 'l1' }
      ],
      log: {
        c1: { v: 1, rv: 3, m: [N.me, N.other], e: [
          ['a1', now - 9 * D - 200, 'w', 0, 0, N.x1],
          ['a2', now - 6 * D - 90, 'p', 1, 1, N.x2],
          ['a3', now - 1 * D - 30, 'e', 0, 0, N.x3]
        ] },
        c2: { v: 1, rv: 2, m: [N.me], a: 4, at: now - 80 * D, e: [
          ['b1', now - 52 * D, 'e', 1, 0, N.x4],
          ['b2', now - 41 * D, 'w', 0, 0, N.x5]
        ] },
        c3: { v: 1, rv: 1, m: [N.other], e: [['d1', now - 120 * D, 'm', 1, 0, N.x6]] }
      }
    };
    var renderers = [];
    var fire = function () { renderers.forEach(function (fn) { setTimeout(fn, 0); }); };
    var cardId = function (scope) { return scope === 'card' ? 'c1' : scope; };
    var clone = function (v) { return JSON.parse(JSON.stringify(v)); };
    mock = {
      _store: store,
      get: function (scope, vis, key, def) {
        var v = scope === 'board' ? store.board[key] : (store[key] || {})[cardId(scope)];
        return Promise.resolve(v === undefined ? def : clone(v));
      },
      set: function (scope, vis, key, value) {
        if (scope !== 'board' && JSON.stringify(value).length + key.length + 5 > CCL.HARD_LIMIT) {
          return Promise.reject(new Error('PluginData length of 4096 characters exceeded.'));
        }
        if (scope === 'board') store.board[key] = clone(value);
        else { store[key] = store[key] || {}; store[key][cardId(scope)] = clone(value); }
        fire();
        return Promise.resolve();
      },
      remove: function (scope, vis, key) {
        if (scope === 'board') delete store.board[key];
        else if (store[key]) delete store[key][cardId(scope)];
        fire();
        return Promise.resolve();
      },
      render: function (fn) { renderers.push(fn); return fn(); },
      cards: function () { return Promise.resolve(store.cards.slice()); },
      lists: function () { return Promise.resolve(store.lists.slice()); },
      card: function () { return Promise.resolve(clone(store.cards[0])); },
      member: function () { return Promise.resolve({ id: 'm1', fullName: N.me }); },
      getContext: function () { return { card: 'c1', permissions: { card: 'write', board: 'write' } }; },
      isMemberSignedIn: function () { return true; },
      sizeTo: function () { return Promise.resolve(); },
      showCard: function () { return Promise.resolve(); },
      closePopup: function () { return Promise.resolve(); },
      closeModal: function () { return Promise.resolve(); }
    };
    return mock;
  };

  root.CCL = CCL;
  if (typeof module !== 'undefined' && module.exports) module.exports = CCL;
})(typeof window !== 'undefined' ? window : globalThis);
