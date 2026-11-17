/* Client Contact Log — the contact log on the card back
 * Each save reads the card's latest data first, applies one change (add / edit / delete / archive)
 * and writes it back, so a colleague's record added a moment earlier is not overwritten.
 * Trello reloads this iframe after every t.set on the card (including sets made by other Power-Ups),
 * so a half-typed record is kept in sessionStorage and restored after a reload.
 * "Logged by" is a label each person types once (kept in their own member/private plugin data). The
 * Power-Up does not read or store Trello profile data such as names, usernames or avatars.
 */
(function () {
  'use strict';
  var CCL = window.CCL, h = CCL.h, tr = CCL.tr;

  CCL.mountSection = function (t, root) {
    var log = CCL.normalize(null), cfg = CCL.cfg(null);
    var me = '', cardId = '', cardName = '';
    var canWrite = true, saving = false, err = '', info = '';
    var form = null;                // {id, t, c, d, x, w} while the form is open
    var showAll = false, panel = null, armedDelete = null;
    var archN = 0, archOk = false, copied = false;

    try {
      var ctx = t.getContext() || {};
      if (ctx.card) cardId = ctx.card;
      if (ctx.permissions && ctx.permissions.card && ctx.permissions.card !== 'write') canWrite = false;
    } catch (e) { /* if permissions are unavailable assume writable; a failed write shows an error */ }

    function resize() { try { t.sizeTo('#' + root.id); } catch (e) { /* demo mode */ } }

    /* ---------- draft kept across iframe reloads ---------- */
    function draftKey() { return 'ccl:draft:' + (cardId || 'card'); }
    function saveDraft() {
      try {
        if (form && (form.x || form.id)) window.sessionStorage.setItem(draftKey(), JSON.stringify(form));
        else window.sessionStorage.removeItem(draftKey());
      } catch (e) { /* storage can be blocked inside an iframe; the draft is then simply not kept */ }
    }
    function clearDraft() { try { window.sessionStorage.removeItem(draftKey()); } catch (e) { /* ignore */ } }
    function restoreDraft() {
      try {
        var raw = window.sessionStorage.getItem(draftKey());
        if (!raw) return;
        var d = JSON.parse(raw);
        if (!d || typeof d.x !== 'string' || !isFinite(+d.t)) return;
        if (d.id && !log.e.some(function (en) { return en.i === d.id; })) { clearDraft(); return; }
        form = { id: d.id || null, t: Math.floor(+d.t), c: String(d.c || 'w'), d: d.d ? 1 : 0, x: d.x.slice(0, CCL.TEXT_MAX),
          w: typeof d.w === 'string' ? d.w.slice(0, CCL.WHO_MAX) : me };
        info = tr('draft_restored');
      } catch (e) { /* ignore a damaged draft */ }
    }

    function load() {
      var soft = function (p) { return Promise.resolve(p).then(function (v) { return v; }, function () { return null; }); };
      return Promise.all([
        t.get('card', 'shared', CCL.KEY),
        t.get('board', 'shared', CCL.CFG_KEY),
        soft(t.get('member', 'private', CCL.WHO_KEY)),
        soft(t.card('id', 'name'))
      ]).then(function (r) {
        cfg = CCL.cfg(r[1]);
        if (!CCL.canSee(t)) { CCL.fill(root, [h('div', { class: 'note info', text: tr('no_access') })]); resize(); return; }
        if (saving) return;
        log = CCL.normalize(r[0]);
        me = typeof r[2] === 'string' ? r[2].slice(0, CCL.WHO_MAX) : '';
        if (r[3]) { cardId = r[3].id || cardId; cardName = r[3].name || ''; }
        if (!form && canWrite) restoreDraft();
        draw();
      }, function (e) {
        CCL.fill(root, [h('div', { class: 'note err', text: tr('err_read', CCL.errText(e)) })]); resize();
      });
    }

    /* ---------- one change, written against the latest stored data ---------- */
    function commit(change) {
      if (!canWrite || saving) return Promise.resolve(false);
      saving = true; err = ''; info = ''; draw();
      var fail = function (e) {
        saving = false;
        var msg = CCL.errText(e);
        err = /length|exceed|4096/i.test(msg) ? tr('err_full') : tr('err_save', msg);
        draw();
        return false;
      };
      return t.get('card', 'shared', CCL.KEY).then(function (raw) {
        var cur = CCL.normalize(raw);
        var problem = change(cur);
        if (problem) { saving = false; err = problem; log = cur; draw(); return false; }
        cur.rv = (cur.rv || 0) + 1;
        var payload = CCL.compact(cur);
        if (CCL.sizeOf(payload) > CCL.SIZE_LIMIT) { saving = false; err = tr('err_full'); draw(); return false; }
        return t.set('card', 'shared', CCL.KEY, payload).then(function () {
          saving = false; log = CCL.normalize(payload);
          return true;
        }, fail);
      }, fail);
    }

    // an error about the form goes away as soon as the form is changed
    function clearErr() {
      if (!err) return;
      err = '';
      var el = root.querySelector('.note.err');
      if (el) { el.remove(); resize(); }
    }

    function openForm(en) {
      var chans = CCL.channelList(cfg);
      form = en
        ? { id: en.i, t: en.t, c: en.c, d: en.d, x: en.x, w: en.w || '' }
        : { id: null, t: CCL.nowMin(), c: chans[0].k, d: 0, x: '', w: me };
      panel = null; armedDelete = null; err = ''; info = '';
      draw();
      var ta = root.querySelector('textarea.txt');
      if (ta) ta.focus();
    }
    function closeForm() { form = null; err = ''; info = ''; clearDraft(); draw(); }

    function submit() {
      if (!form || saving) return;
      var text = form.x.trim();
      if (!text) { err = tr('err_text'); draw(); return; }
      if (form.t === null || !isFinite(form.t)) { err = tr('err_when'); draw(); return; }
      if (form.t > CCL.nowMin() + 5) { err = tr('err_future'); draw(); return; }
      var f = { id: form.id, t: form.t, c: form.c, d: form.d, x: text.slice(0, CCL.TEXT_MAX), w: String(form.w || '').trim().slice(0, CCL.WHO_MAX) };
      // Remember the label for this person's next record (new records only; a failure here is harmless).
      var remember = Promise.resolve();
      if (!f.id && f.w !== me) {
        remember = Promise.resolve(f.w ? t.set('member', 'private', CCL.WHO_KEY, f.w) : t.remove('member', 'private', CCL.WHO_KEY))
          .then(function () { me = f.w; }, function () { /* the record is still saved */ });
      }
      remember.then(function () {
        // Trello may reload this iframe the moment the save lands, before the code below runs, so the
        // draft is dropped first and put back only if the save fails.
        clearDraft();
        return commit(function (cur) {
          if (f.id) return CCL.updateEntry(cur, f.id, f) ? null : tr('err_gone');
          CCL.addEntry(cur, f);
          return null;
        });
      }).then(function (ok) {
        if (!ok) { saveDraft(); return; }
        form = null; draw();
      });
    }

    function remove(id) {
      commit(function (cur) { return CCL.removeEntry(cur, id) ? null : tr('err_gone'); })
        .then(function (ok) { if (ok) { armedDelete = null; draw(); } });
    }

    /* ---------- form ---------- */
    function formEl() {
      var chans = CCL.channelList(cfg);
      if (!chans.some(function (c) { return c.k === form.c; })) chans.push({ k: form.c, n: CCL.chLabel(form.c) });

      var when = h('input', { type: 'datetime-local', value: form.t !== null ? CCL.toInput(form.t) : '', max: CCL.toInput(CCL.nowMin() + 5),
        onchange: function () { form.t = CCL.fromInput(when.value); saveDraft(); clearErr(); } });
      var ch = h('select', { onchange: function () { form.c = ch.value; saveDraft(); } }, chans.map(function (c) {
        var o = h('option', { value: c.k, text: c.n });
        if (c.k === form.c) o.selected = true;
        return o;
      }));
      var seg = h('div', { class: 'seg', role: 'group' }, [0, 1].map(function (d) {
        return h('button', { type: 'button', class: form.d === d ? 'on' : '', text: (d ? '→ ' : '← ') + CCL.dirLabel(d), onclick: function () {
          form.d = d; saveDraft();
          Array.prototype.forEach.call(seg.children, function (b, i) { b.className = i === d ? 'on' : ''; });
        } });
      }));
      var who = h('input', { type: 'text', class: 'who', maxlength: String(CCL.WHO_MAX), placeholder: tr('ph_who'), value: form.w || '',
        oninput: function () { form.w = who.value; saveDraft(); } });
      var counter = h('span', { class: 'muted small', text: tr('chars', form.x.length, CCL.TEXT_MAX) });
      var ta = h('textarea', { class: 'txt', maxlength: String(CCL.TEXT_MAX), placeholder: tr('ph_text'),
        oninput: function () { form.x = ta.value; counter.textContent = tr('chars', form.x.length, CCL.TEXT_MAX); saveDraft(); clearErr(); },
        onkeydown: function (ev) { if ((ev.ctrlKey || ev.metaKey) && ev.key === 'Enter') { ev.preventDefault(); submit(); } } });
      ta.value = form.x;

      return h('div', { class: 'form' }, [
        form.id ? h('div', { class: 'small muted', text: tr('editing') }) : null,
        h('div', { class: 'frow' }, [
          h('label', {}, [h('span', { text: tr('f_when') }), when]),
          h('label', {}, [h('span', { text: tr('f_ch') }), ch]),
          h('label', {}, [h('span', { text: tr('f_dir') }), seg]),
          h('label', {}, [h('span', { text: tr('f_who') }), who])
        ]),
        ta,
        h('div', { class: 'foot' }, [
          counter, h('span', { class: 'grow' }),
          h('button', { type: 'button', text: tr('cancel'), disabled: saving, onclick: closeForm }),
          h('button', { type: 'button', class: 'primary', text: saving ? tr('saving') : tr(form.id ? 'save_edit' : 'save'), disabled: saving, onclick: submit })
        ])
      ]);
    }

    /* ---------- one record ---------- */
    function entryEl(en) {
      var armed = armedDelete === en.i;
      var acts = canWrite ? h('span', { class: 'acts' }, [
        h('button', { type: 'button', class: 'icon', text: '✎', title: tr('edit'), disabled: saving, onclick: function () { openForm(en); } }),
        h('button', { type: 'button', class: armed ? 'danger' : 'icon', text: armed ? tr('del_confirm') : '✕', title: tr('del'), disabled: saving, onclick: function () {
          if (armed) remove(en.i); else { armedDelete = en.i; draw(); }
        } })
      ]) : null;
      return h('div', { class: 'entry' + (form && form.id === en.i ? ' editing' : '') }, [
        h('div', { class: 'meta' }, [
          h('span', { class: 'when', text: CCL.fmtDateTime(en.t) }),
          h('span', { class: 'pill ch', text: CCL.chLabel(en.c) }),
          h('span', { class: 'dir d' + en.d, text: (en.d ? '→ ' : '← ') + CCL.dirLabel(en.d) }),
          en.w ? h('span', { class: 'muted small who', text: tr('by', en.w) }) : null,
          h('span', { class: 'grow' }),
          acts
        ]),
        h('div', { class: 'body', text: en.x })
      ]);
    }

    /* ---------- export and archive panels ---------- */
    function textPanel(title, hint, entries, extra) {
      var area = h('textarea', { readonly: true, class: 'csv' });
      area.value = CCL.toText(cardName, entries);
      var copyBtn = h('button', { type: 'button', class: 'primary', text: copied ? tr('copied') : tr('copy'), onclick: function () {
        CCL.copyFrom(area, function () { copied = true; copyBtn.textContent = tr('copied'); });
      } });
      return h('div', { class: 'csvbox' }, [
        h('div', { class: 'ptitle', text: title }),
        h('div', { class: 'muted small', text: hint }),
        extra && extra.top ? extra.top : null,
        area,
        h('div', { class: 'foot' }, [
          extra && extra.left ? extra.left : null,
          h('span', { class: 'grow' }),
          h('button', { type: 'button', text: tr('close'), onclick: function () { panel = null; copied = false; archOk = false; draw(); } }),
          copyBtn,
          extra && extra.right ? extra.right : null
        ])
      ]);
    }

    function archivePanel() {
      var n = log.e.length;
      if (archN < 1 || archN > n) archN = Math.max(1, Math.ceil(n / 2));
      var oldest = log.e.slice(0, archN);
      var num = h('input', { type: 'number', min: '1', max: String(n), value: String(archN), style: 'width:70px', onchange: function () {
        var v = parseInt(num.value, 10);
        archN = isFinite(v) ? Math.min(n, Math.max(1, v)) : archN;
        archOk = false; copied = false; draw();
      } });
      var ok = h('input', { type: 'checkbox', onchange: function () { archOk = ok.checked; draw(); } });
      ok.checked = archOk;
      var ids = oldest.map(function (en) { return en.i; });
      return textPanel(tr('ar_title'), tr('ar_hint'), oldest, {
        top: h('div', { class: 'foot' }, [h('label', {}, [tr('ar_n') + ' ', num, ' ' + tr('ar_n_unit')])]),
        left: h('label', { class: 'check' }, [ok, ' ' + tr('ar_ok')]),
        right: h('button', { type: 'button', class: 'danger big', text: tr('ar_do', ids.length), disabled: !archOk || saving, onclick: function () {
          commit(function (cur) { CCL.archive(cur, ids); return null; }).then(function (done) {
            if (done) { panel = null; archOk = false; copied = false; draw(); }
          });
        } })
      });
    }

    /* ---------- whole section ---------- */
    function draw() {
      var active = document.activeElement;
      var hadFocus = !!(active && active.classList && active.classList.contains('txt'));
      var n = log.e.length, u = CCL.usage(log);
      var newestFirst = log.e.slice().reverse();
      var visible = showAll ? newestFirst : newestFirst.slice(0, CCL.PREVIEW);
      var kids = [];

      if (CCL.demo) kids.push(h('div', { class: 'demo-banner', text: tr('demo') }));
      if (!canWrite) kids.push(h('div', { class: 'note info', text: tr('read_only') }));

      if (canWrite) {
        if (form) kids.push(formEl());
        else kids.push(h('div', { class: 'foot top' }, [
          h('button', { type: 'button', class: 'primary', text: tr('add'), disabled: saving, onclick: function () { openForm(null); } })
        ]));
      }
      if (info) kids.push(h('div', { class: 'note info', text: info }));
      if (err) kids.push(h('div', { class: 'note err', text: err }));
      if (u.pct >= CCL.WARN_PCT && panel !== 'archive') {
        kids.push(h('div', { class: 'note warn' }, [
          tr('warn_space', u.pct) + ' ',
          canWrite && n ? h('a', { class: 'link', text: tr('archive'), onclick: function () { panel = 'archive'; archOk = false; copied = false; draw(); } }) : null
        ]));
      }

      if (panel === 'export') kids.push(textPanel(tr('ex_title'), tr('ex_hint'), log.e));
      if (panel === 'archive' && n) kids.push(archivePanel());

      if (!n) kids.push(h('div', { class: 'empty', text: tr('empty') }));
      else kids.push(h('div', { class: 'entries' }, visible.map(entryEl)));

      if (n || log.a) {
        var bar = h('span', { class: 'minibar', title: u.used + ' / ' + CCL.SIZE_LIMIT }, [
          h('i', { class: u.pct >= CCL.WARN_PCT ? 'w' : 'p', style: 'width:' + u.pct + '%' })
        ]);
        kids.push(h('div', { class: 'foot bottom' }, [
          h('span', { class: 'muted small', text: tr('count', n) }),
          n > CCL.PREVIEW ? h('a', { class: 'link small', text: showAll ? tr('show_less') : tr('show_all', n), onclick: function () { showAll = !showAll; draw(); } }) : null,
          h('span', { class: 'grow' }),
          bar,
          h('span', { class: 'muted small', text: tr('space', u.pct) + (n ? ' · ' + tr('space_room', u.room) : '') }),
          n ? h('button', { type: 'button', class: 'small', text: tr('export'), onclick: function () { panel = panel === 'export' ? null : 'export'; copied = false; draw(); } }) : null,
          canWrite && n ? h('button', { type: 'button', class: 'small', text: tr('archive'), onclick: function () { panel = panel === 'archive' ? null : 'archive'; archOk = false; copied = false; draw(); } }) : null
        ]));
        if (log.a) kids.push(h('div', { class: 'muted small arch', text: tr('archived', log.a, log.at ? CCL.fmtDate(log.at) : '') }));
      }

      CCL.fill(root, kids);
      if (hadFocus) {
        var ta = root.querySelector('textarea.txt');
        if (ta) { ta.focus(); try { ta.setSelectionRange(ta.value.length, ta.value.length); } catch (e) { /* ignore */ } }
      }
      resize();
    }

    return t.render(load);
  };
})();
