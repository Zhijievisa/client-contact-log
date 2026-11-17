/* Client Contact Log — starts a page. Kept in its own file so that the pages carry no inline script
 * and can run under a Content Security Policy without 'unsafe-inline'.
 * Usage: <script src="./boot.js" data-mount="mountSection"></script>
 */
(function () {
  'use strict';
  var script = document.currentScript;
  var mount = script && script.getAttribute('data-mount');
  var CCL = window.CCL;
  if (!CCL || !mount || typeof CCL[mount] !== 'function') return;
  var t = CCL.getT();
  CCL.applyTheme(t);
  CCL[mount](t, document.getElementById('ccl-root'));
})();
