/* Client Contact Log — iframe connector (loaded by index.html, runs only in Trello's hidden iframe) */
(function () {
  'use strict';
  var CCL = window.CCL, tr = CCL.tr;
  var BASE = window.location.href.split('#')[0].split('?')[0].replace(/[^\/]*$/, '');
  var ICON_GRAY = BASE + 'icon.svg';
  var ICON_WHITE = BASE + 'icon-white.svg';

  // Reads the board settings first so labels come out in the board's language.
  function withCfg(t) {
    return t.get('board', 'shared', CCL.CFG_KEY).then(function (raw) { return CCL.cfg(raw); });
  }

  function openOverview(t) {
    return t.modal({ url: './overview', title: tr('ov_title'), height: 640, fullscreen: false });
  }

  // Known issue TRELLO-1820: with a card open, the 'card' scope inside card-badges can resolve to the
  // wrong card, so badges always read data by the card ID taken from the context.
  function logOfContextCard(t) {
    var ctx = t.getContext() || {};
    return t.get(ctx.card || 'card', 'shared', CCL.KEY);
  }
  // The card's list decides whether a stale card is flagged; if it cannot be read, the card is still flagged.
  function listOfCard(t) {
    return Promise.resolve(t.card('idList')).then(function (c) { return c && c.idList ? c.idList : ''; }, function () { return ''; });
  }

  window.TrelloPowerUp.initialize({
    'card-badges': function (t) {
      if (!CCL.canSee(t)) return [];
      return Promise.all([logOfContextCard(t), withCfg(t), listOfCard(t)]).then(function (r) {
        return CCL.badges(r[0], r[1], r[2]).map(function (b) { b.icon = ICON_GRAY; return b; });
      });
    },

    'card-detail-badges': function (t) {
      if (!CCL.canSee(t)) return [];
      return Promise.all([logOfContextCard(t), withCfg(t), listOfCard(t)]).then(function (r) {
        return CCL.detailBadges(r[0], r[1], r[2]);
      });
    },

    // Shown on every card so a first record can be added without an extra click.
    'card-back-section': function (t) {
      if (!CCL.canSee(t)) return null;
      return withCfg(t).then(function () {
        return {
          title: tr('sec_title'),
          icon: ICON_GRAY,
          content: { type: 'iframe', url: t.signUrl('./section'), height: 96 }
        };
      });
    },

    'board-buttons': function (t) {
      if (!CCL.canSee(t)) return [];
      return withCfg(t).then(function () {
        return [{ icon: { dark: ICON_WHITE, light: ICON_GRAY }, text: tr('btn_ov'), callback: openOverview }];
      });
    },

    // Shown once, right after someone enables the Power-Up on a board.
    'on-enable': function (t) {
      return withCfg(t).then(function () {
        return t.modal({ url: './welcome', title: tr('wel_title'), height: 470, fullscreen: false });
      });
    },

    'show-settings': function (t) {
      return withCfg(t).then(function () {
        return t.popup({ title: tr('set_title'), url: './settings', height: 520 });
      });
    }
  });
})();
