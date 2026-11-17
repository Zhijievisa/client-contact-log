/* Client Contact Log — board-level overview (modal opened from the board button) */
(function () {
  'use strict';
  var CCL = window.CCL, h = CCL.h, tr = CCL.tr;

  CCL.mountOverview = function (t, root) {
    var showCsv = false, copied = false, incMuted = false, rows = [], cfg = CCL.cfg(null);

    function load() {
      return Promise.all([
        t.cards('id', 'name', 'idList'), t.lists('id', 'name'), t.get('board', 'shared', CCL.CFG_KEY)
      ]).then(function (r) {
        cfg = CCL.cfg(r[2]);
        if (!CCL.canSee(t)) { rows = []; CCL.fill(root, [h('div', { class: 'note info', text: tr('no_access') })]); return null; }
        var cards = r[0] || [], lists = {};
        (r[1] || []).forEach(function (l) { lists[l.id] = l.name; });
        return Promise.all(cards.map(function (c) {
          var row = { card: c, list: lists[c.idList] || '', listId: c.idList || '', log: null };
          return t.get(c.id, 'shared', CCL.KEY).then(function (raw) {
            if (raw) row.log = CCL.normalize(raw);
            return row;
          }, function () { return row; });
        }));
      }).then(function (res) { if (res) { rows = res; draw(); } }, function (e) {
        CCL.fill(root, [h('div', { class: 'note err', text: tr('err_read', CCL.errText(e)) })]);
      });
    }

    function cardLink(card) {
      return h('a', { class: 'link', text: card.name, title: tr('open_card'), onclick: function () {
        Promise.resolve(t.showCard(card.id)).then(function () { return t.closeModal(); }, function () { /* ignore */ });
      } });
    }

    function csvPanel(withLog) {
      var area = h('textarea', { readonly: true, class: 'csv' });
      area.value = CCL.toCsv(withLog);
      var copyBtn = h('button', { type: 'button', class: 'primary', text: copied ? tr('copied') : tr('copy'), onclick: function () {
        CCL.copyFrom(area, function () { copied = true; copyBtn.textContent = tr('copied'); });
      } });
      return h('div', { class: 'csvbox' }, [
        h('div', { class: 'muted small', text: tr('export_hint') }),
        area,
        h('div', { class: 'foot' }, [h('span', { class: 'grow' }), h('button', { type: 'button', text: tr('close'), onclick: function () { showCsv = false; copied = false; draw(); } }), copyBtn])
      ]);
    }

    function draw() {
      var now = CCL.nowMin(), weekAgo = now - 7 * 1440;
      var withLog = rows.filter(function (x) { return x.log && x.log.e.length; });
      var stale = 0, week = 0, weekCards = 0, full = 0;

      withLog.forEach(function (x) {
        x.sum = CCL.summary(x.log, now);
        x.use = CCL.usage(x.log);
        x.muted = (cfg.xl || []).indexOf(x.listId) >= 0;
        x.stale = CCL.isStale(x.sum.days, cfg, x.listId);
        if (x.stale) stale++;
        if (x.use.pct >= CCL.WARN_PCT) full++;
        var recent = x.log.e.filter(function (en) { return en.t >= weekAgo; }).length;
        if (recent) { week += recent; weekCards++; }
      });

      var tile = function (cls, k, v, sub) {
        return h('div', { class: 'tile' + cls }, [h('div', { class: 'k', text: k }), h('div', { class: 'v', text: String(v) }), h('div', { class: 'sub', text: sub })]);
      };
      var tiles = h('div', { class: 'tiles' }, [
        tile(stale > 0 ? ' late' : '', cfg.stale ? tr('t_stale', cfg.stale) : tr('t_stale_off'), cfg.stale ? stale : '–', tr('t_stale_sub')),
        tile('', tr('t_week'), week, tr('t_week_sub', weekCards)),
        tile('', tr('t_cards'), withLog.length, tr('t_cards_sub', rows.length - withLog.length)),
        tile(full > 0 ? ' hot' : '', tr('t_full'), full, tr('t_full_sub'))
      ]);

      var shown = withLog.filter(function (x) { return incMuted || !x.muted; })
        .sort(function (a, b) { return b.sum.days - a.sum.days || a.card.name.localeCompare(b.card.name); });
      var anyMuted = withLog.some(function (x) { return x.muted; });

      var table;
      if (!withLog.length) {
        table = h('div', { class: 'empty', text: tr('none_rows') });
      } else {
        table = h('table', {}, [
          h('thead', {}, [h('tr', {}, [
            h('th', { text: tr('c_card') }), h('th', { text: tr('c_list') }), h('th', { text: tr('c_last') }),
            h('th', { class: 'num', text: tr('c_days') }), h('th', { class: 'num', text: tr('c_n') }), h('th', { text: tr('c_space') })
          ])]),
          h('tbody', {}, shown.map(function (x) {
            var last = x.sum.last;
            return h('tr', { class: x.muted ? 'mutedrow' : '' }, [
              h('td', {}, [cardLink(x.card)]),
              h('td', { class: 'muted', text: x.list }),
              h('td', {}, [
                CCL.fmtDate(last.t) + ' ',
                h('span', { class: 'pill ch', text: CCL.chLabel(last.c) }),
                h('div', { class: 'hint', text: (last.d ? '→ ' : '← ') + CCL.dirLabel(last.d) })
              ]),
              h('td', { class: 'num' }, [h('span', { class: x.stale ? 'pill late' : '', text: x.sum.days === 0 ? tr('today') : String(x.sum.days) })]),
              h('td', { class: 'num', text: x.log.a ? x.sum.n + ' + ' + x.log.a : String(x.sum.n) }),
              h('td', {}, [
                h('span', { class: 'minibar' }, [h('i', { class: x.use.pct >= CCL.WARN_PCT ? 'w' : 'p', style: 'width:' + x.use.pct + '%' })]),
                h('span', { class: 'muted small', text: ' ' + x.use.pct + '%' })
              ])
            ]);
          }))
        ]);
      }

      var mutedBox = h('input', { type: 'checkbox', onchange: function () { incMuted = mutedBox.checked; draw(); } });
      mutedBox.checked = incMuted;

      CCL.fill(root, [
        CCL.demo ? h('div', { class: 'demo-banner', text: tr('demo') }) : null,
        tiles,
        h('div', { class: 'h2row' }, [
          h('h2', { text: tr('ov_h') }),
          h('div', { class: 'foot' }, [
            anyMuted ? h('label', { class: 'check' }, [mutedBox, ' ' + tr('ov_muted')]) : null,
            withLog.length ? h('button', { type: 'button', text: tr('export_csv'), onclick: function () { showCsv = !showCsv; copied = false; draw(); } }) : null
          ])
        ]),
        showCsv ? csvPanel(withLog) : null,
        table
      ]);
    }

    return t.render(load);
  };
})();
