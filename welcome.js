/* Client Contact Log — welcome / getting-started modal (opened by the on-enable capability) */
(function () {
  'use strict';
  var CCL = window.CCL, h = CCL.h, tr = CCL.tr;

  CCL.mountWelcome = function (t, root) {
    return t.get('board', 'shared', CCL.CFG_KEY).then(function (raw) {
      CCL.cfg(raw);
      CCL.fill(root, [
        h('p', { class: 'lead', text: tr('wel_intro') }),
        h('ol', { class: 'steps' }, [
          h('li', { text: tr('wel_1') }),
          h('li', { text: tr('wel_2') }),
          h('li', { text: tr('wel_3') })
        ]),
        h('div', { class: 'note info', text: tr('wel_limit') }),
        h('div', { class: 'note info', text: tr('wel_set') }),
        h('div', { class: 'note info', text: tr('wel_data') }),
        h('div', { class: 'foot' }, [
          h('span', { class: 'muted small' }, [
            h('a', { class: 'link', href: './support.html', target: '_blank', rel: 'noopener', text: tr('support') }), ' · ',
            h('a', { class: 'link', href: './privacy.html', target: '_blank', rel: 'noopener', text: tr('privacy') })
          ]),
          h('span', { class: 'grow' }),
          h('button', { type: 'button', class: 'primary', text: tr('wel_ok'), onclick: function () { t.closeModal(); } })
        ])
      ]);
    });
  };
})();
