/* Client Contact Log — board settings (Power-Up gear → Settings) */
(function () {
  'use strict';
  var CCL = window.CCL, h = CCL.h, tr = CCL.tr;
  var BOARD_LIMIT = 7900; // Trello allows 8192 characters at board scope

  CCL.mountSettings = function (t, root) {
    var cfg, lists = [], extraText = '', msg = null;

    function resize() { try { t.sizeTo('#' + root.id); } catch (e) { /* demo mode */ } }

    function draw() {
      CCL.useCfg(cfg);

      var lang = h('select', { style: 'max-width:280px', onchange: function () { cfg.lang = lang.value; draw(); } },
        [['auto', tr('s_lang_auto')], ['en', 'English'], ['zh', '简体中文']].map(function (o) {
          var el = h('option', { value: o[0], text: o[1] });
          if (cfg.lang === o[0]) el.selected = true;
          return el;
        }));
      var stale = h('input', { type: 'number', min: '0', max: '3650', value: String(cfg.stale), style: 'width:90px',
        oninput: function () { var v = parseInt(stale.value, 10); if (isFinite(v) && v >= 0) cfg.stale = v; } });

      var chBoxes = CCL.BUILTIN.map(function (k) {
        var box = h('input', { type: 'checkbox', onchange: function () {
          cfg.off = cfg.off.filter(function (x) { return x !== k; });
          if (!box.checked) cfg.off.push(k);
        } });
        box.checked = cfg.off.indexOf(k) < 0;
        return h('label', { class: 'check' }, [box, ' ' + tr('ch_' + k)]);
      });
      var extra = h('textarea', { class: 'short', oninput: function () { extraText = extra.value; } });
      extra.value = extraText;

      var listBoxes = lists.map(function (l) {
        var box = h('input', { type: 'checkbox', onchange: function () {
          cfg.xl = cfg.xl.filter(function (x) { return x !== l.id; });
          if (box.checked) cfg.xl.push(l.id);
        } });
        box.checked = cfg.xl.indexOf(l.id) >= 0;
        return h('label', { class: 'check block' }, [box, ' ' + l.name]);
      });

      CCL.fill(root, [
        CCL.demo ? h('div', { class: 'demo-banner', text: tr('demo') }) : null,
        h('div', { class: 'field' }, [h('label', { text: tr('s_lang') }), lang]),
        h('div', { class: 'field' }, [h('label', { text: tr('s_stale') }), stale, h('span', { class: 'muted', text: ' ' + tr('s_days') })]),
        h('div', { class: 'field' }, [h('label', { text: tr('s_ch') }), h('div', { class: 'checks' }, chBoxes),
          h('div', { class: 'muted small', style: 'margin:8px 0 4px', text: tr('s_ch_extra') }), extra]),
        lists.length ? h('div', { class: 'field' }, [h('label', { text: tr('s_xl') }), h('div', { class: 'listbox' }, listBoxes)]) : null,
        msg ? h('div', { class: 'note ' + msg.kind, text: msg.text }) : null,
        h('div', { class: 'foot' }, [
          h('span', { class: 'muted small' }, [
            tr('about', CCL.VERSION) + ' ',
            h('a', { class: 'link', href: './privacy', target: '_blank', rel: 'noopener', text: tr('privacy') }), ' · ',
            h('a', { class: 'link', href: './support', target: '_blank', rel: 'noopener', text: tr('support') })
          ]),
          h('span', { class: 'grow' }),
          h('button', { type: 'button', class: 'primary', text: tr('save_settings'), onclick: save })
        ])
      ]);
      resize();
    }

    function save() {
      var known = {};
      lists.forEach(function (l) { known[l.id] = true; });
      var out = {
        lang: cfg.lang, stale: cfg.stale, off: cfg.off.slice(),
        ch: CCL.cleanChannels(extraText.split(/\r?\n/)),
        xl: cfg.xl.filter(function (id) { return !lists.length || known[id]; })   // drop lists that no longer exist
      };
      if (JSON.stringify(out).length > BOARD_LIMIT) { msg = { kind: 'err', text: tr('e_size') }; draw(); return; }
      t.set('board', 'shared', CCL.CFG_KEY, out).then(function () {
        msg = { kind: 'info', text: tr('saved') }; cfg = CCL.cfg(out); extraText = cfg.ch.join('\n'); draw();
        return t.closePopup();
      }, function (e) {
        msg = { kind: 'err', text: tr('err_save', CCL.errText(e)) }; draw();
      });
    }

    return Promise.all([
      t.get('board', 'shared', CCL.CFG_KEY),
      Promise.resolve(t.lists('id', 'name')).then(function (v) { return v || []; }, function () { return []; })
    ]).then(function (r) {
      cfg = CCL.cfg(r[0]);
      lists = r[1];
      extraText = cfg.ch.join('\n');
      draw();
    });
  };
})();
