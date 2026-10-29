/* Theme picker + holiday themes. Loaded blocking in <head> so the right palette is set before first paint.
   Preview without waiting for the date:  ?holiday=halloween   or   ?theme=terminal  (neither is saved). */
(function () {
  var d = document.documentElement;
  var KEY = 'jf-theme', HKEY = 'jf-holiday';
  var THEMES = [
    { id: 'auto', label: 'Auto', base: 1 }, { id: 'light', label: 'Light', base: 1, mode: 'light' }, { id: 'dark', label: 'Dark', base: 1, mode: 'dark' },
    { id: 'sunset', label: 'Sunset', mode: 'dark' }, { id: 'terminal', label: 'Terminal', mode: 'dark' }, { id: 'synthwave', label: 'Synthwave', mode: 'dark' },
    { id: 'blueprint', label: 'Blueprint', mode: 'dark' },
    { id: 'gameboy', label: 'Game Boy', mode: 'light', font: 'https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@500;700&display=swap' },
    { id: 'bubblegum', label: 'Bubblegum', mode: 'light' }, { id: 'ocean', label: 'Ocean', mode: 'dark' }, { id: 'sepia', label: 'Sepia', mode: 'light' },
    { id: 'contrast', label: 'High contrast', mode: 'dark' }
  ];
  var BY = {}; THEMES.forEach(function (t) { BY[t.id] = t; });

  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function put(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }

  /* ---- holidays ---- */
  function md(t) { return (t.getMonth() + 1) * 100 + t.getDate(); }
  function span(a, b) { return function (t) { var x = md(t); return a <= b ? x >= a && x <= b : x >= a || x <= b; }; }
  function day(t, y, m, dd) { return new Date(y, m, dd).setHours(0, 0, 0, 0) - new Date(t.getFullYear(), t.getMonth(), t.getDate()).getTime(); }
  function easter(y) {
    var a = y % 19, b = Math.floor(y / 100), c = y % 100, dd = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25),
        g = Math.floor((b - f + 1) / 3), h = (19 * a + b - dd - g + 15) % 30, i = Math.floor(c / 4), k = c % 4,
        l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451), n = h + l - 7 * m + 114;
    return [Math.floor(n / 31) - 1, (n % 31) + 1];
  }
  /* Intl knows the Hebrew and Chinese calendars, so those dates stay right every year */
  function cal(t, ca, opts) {
    try { return new Intl.DateTimeFormat('en-u-ca-' + ca + '-nu-latn', opts).formatToParts(t); } catch (e) { return []; }
  }
  function part(ps, type) { for (var i = 0; i < ps.length; i++) if (ps[i].type === type) return ps[i].value; return ''; }
  function lunar(t) {
    function on(x) { var p = cal(x, 'chinese', { month: 'numeric', day: 'numeric' }); return [part(p, 'month'), parseInt(part(p, 'day'), 10)]; }
    var n = on(t), nx = on(new Date(t.getFullYear(), t.getMonth(), t.getDate() + 1));
    return (n[0] === '1' && n[1] <= 5) || (nx[0] === '1' && nx[1] === 1);
  }
  function hanukkah(t) {
    var p = cal(t, 'hebrew', { month: 'long', day: 'numeric' }), m = part(p, 'month'), n = parseInt(part(p, 'day'), 10);
    return (m === 'Kislev' && n >= 24) || (m === 'Tevet' && n <= 2);
  }
  var DIWALI = { 2026: [10, 8], 2027: [9, 29], 2028: [9, 17] };   /* [month index, day]; extend as dates are published */
  var HOLIDAYS = [
    { id: 'christmas', name: 'Merry Christmas', fx: ['❄️', '🎄', '⭐'], is: span(1218, 1226) },
    { id: 'diwali', name: 'Happy Diwali', fx: ['🪔', '✨'], rise: 1, is: function (t) {
        var v = DIWALI[t.getFullYear()]; if (!v) return false; var x = day(t, t.getFullYear(), v[0], v[1]) / 864e5; return x >= -2 && x <= 2; } },
    { id: 'halloween', name: 'Happy Halloween', fx: ['🎃', '🦇', '👻'], is: span(1024, 1031) },
    { id: 'thanksgiving', name: 'Happy Thanksgiving', fx: ['🍂', '🍁', '🦃'], is: function (t) {
        var first = new Date(t.getFullYear(), 10, 1), th = 1 + ((4 - first.getDay() + 7) % 7) + 21, x = day(t, t.getFullYear(), 10, th) / 864e5;
        return x >= -1 && x <= 3; } },
    { id: 'hanukkah', name: 'Happy Hanukkah', fx: ['🕎', '✨'], is: hanukkah },
    { id: 'newyear', name: 'Happy New Year', fx: ['🎉', '✨', '🥂'], is: span(1231, 102) },
    { id: 'lunar', name: 'Happy Lunar New Year', fx: ['🧧', '🏮'], is: lunar },
    { id: 'valentine', name: 'Happy Valentine’s Day', fx: ['💕', '❤️'], rise: 1, is: span(212, 214) },
    { id: 'pi', name: 'Happy Pi Day', fx: ['π', '🥧'], is: span(314, 314) },
    { id: 'stpatrick', name: 'Happy St. Patrick’s Day', fx: ['🍀'], is: span(315, 317) },
    { id: 'easter', name: 'Happy Easter', fx: ['🐣', '🌷', '🥚'], is: function (t) {
        var e = easter(t.getFullYear()), x = day(t, t.getFullYear(), e[0], e[1]) / 864e5; return x >= -1 && x <= 2; } },
    { id: 'earth', name: 'Happy Earth Day', fx: ['🌍', '🌱'], is: span(422, 422) },
    { id: 'maythe4', name: 'May the Fourth be with you', fx: ['⭐', '✨'], is: span(504, 504) },
    { id: 'july4', name: 'Happy Fourth of July', fx: ['🎆', '✨'], rise: 1, is: span(702, 704) }
  ];
  var HBY = {}; HOLIDAYS.forEach(function (h) { HBY[h.id] = h; });

  var q = new URLSearchParams(location.search);
  function today() {
    var f = q.get('holiday'); if (f && HBY[f]) return HBY[f];
    var now = new Date();
    for (var i = 0; i < HOLIDAYS.length; i++) { try { if (HOLIDAYS[i].is(now)) return HOLIDAYS[i]; } catch (e) {} }
    return null;
  }

  /* ---- state ---- */
  var saved = get(KEY), preview = q.get('theme');
  var theme = BY[preview] ? preview : (BY[saved] ? saved : 'auto');
  var holidayOn = get(HKEY) !== 'off';
  var holiday = today();
  var mq = window.matchMedia ? matchMedia('(prefers-color-scheme: dark)') : { matches: false };
  var fxEl, panel, btn, hbox, hnote;

  function apply(animate) {
    var t = BY[theme], mode = theme === 'auto' ? (mq.matches ? 'dark' : 'light') : t.mode;
    if (animate) { d.classList.add('theme-anim'); setTimeout(function () { d.classList.remove('theme-anim'); }, 350); }
    if (theme === 'auto') d.removeAttribute('data-theme'); else d.setAttribute('data-theme', theme);
    d.setAttribute('data-mode', mode);
    var h = holiday && holidayOn && t.base ? holiday : null;
    if (h) d.setAttribute('data-holiday', h.id); else d.removeAttribute('data-holiday');
    if (t.font && !document.getElementById('jf-font-' + theme)) {
      var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = t.font; l.id = 'jf-font-' + theme; document.head.appendChild(l);
    }
    if (document.body) { fx(h); sync(); }
  }

  function fx(h) {
    if (fxEl) { fxEl.remove(); fxEl = null; }
    if (!h || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) return;
    fxEl = document.createElement('div'); fxEl.className = 'hfx' + (h.rise ? ' rise' : ''); fxEl.setAttribute('aria-hidden', 'true');
    var n = innerWidth < 600 ? 9 : 14;
    for (var i = 0; i < n; i++) {
      var s = document.createElement('span');
      s.textContent = h.fx[i % h.fx.length];
      s.style.cssText = '--x:' + Math.round(Math.random() * 96) + 'vw;--s:' + (14 + Math.round(Math.random() * 14)) + 'px;--t:' + (11 + Math.random() * 10).toFixed(1) +
        's;--dl:-' + (Math.random() * 20).toFixed(1) + 's;--dx:' + Math.round(Math.random() * 120 - 60) + 'px;--r:' + Math.round(Math.random() * 540 - 270) + 'deg';
      fxEl.appendChild(s);
    }
    document.body.appendChild(fxEl);
  }

  function sync() {
    var meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) { meta = document.createElement('meta'); meta.name = 'theme-color'; document.head.appendChild(meta); }
    var bg = getComputedStyle(d).getPropertyValue('--bg').trim(); if (bg) meta.content = bg;
    if (!panel) return;
    [].forEach.call(panel.querySelectorAll('.ts-opt'), function (b) { b.setAttribute('aria-pressed', String(b.dataset.id === theme)); });
    hbox.checked = holidayOn;
    var onNow = holiday && holidayOn && BY[theme].base;
    hnote.textContent = !holiday ? 'Changes the accent color around Halloween, Christmas and more.'
      : onNow ? holiday.name + '! Showing today’s theme.'
      : holidayOn ? 'It’s ' + holiday.name.replace('Happy ', '').replace('Merry ', '') + ', but holiday colors only tint Auto, Light and Dark.'
      : 'Holiday themes are off.';
  }

  function choose(id) { theme = id; put(KEY, id === 'auto' ? null : id); apply(true); }

  /* ---- picker UI ---- */
  function build() {
    var host = document.querySelector('.nav-r') || document.querySelector('.top ul') || document.querySelector('.top .wrap, .topbar .wrap');
    if (!host) return;
    var wrap = document.createElement('div'); wrap.className = 'theme-switch';
    function opt(t) {
      var sw = t.id === 'auto' ? '<span class="sw sw-auto"><i></i><i></i></span>'
        : '<span class="sw" data-t="' + t.id + '"></span>';
      return '<button type="button" class="ts-opt" data-id="' + t.id + '" aria-pressed="false">' + sw + '<span>' + t.label + '</span></button>';
    }
    var base = THEMES.filter(function (t) { return t.base; }), fun = THEMES.filter(function (t) { return !t.base && t.id !== 'contrast'; });
    wrap.innerHTML =
      '<button type="button" class="ts-btn" aria-label="Change theme" aria-expanded="false" aria-haspopup="true" title="Theme">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor" stroke="none"/></svg></button>' +
      '<div class="ts-panel" role="group" aria-label="Theme" hidden>' +
        '<p class="ts-h">Mode</p><div class="ts-grid">' + base.map(opt).join('') + '</div>' +
        '<p class="ts-h">Fun themes</p><div class="ts-grid">' + fun.map(opt).join('') + '</div>' +
        '<p class="ts-h">Accessibility</p><div class="ts-grid">' + opt(BY.contrast) + '</div>' +
        '<label class="ts-hol"><input type="checkbox"><span>Holiday themes<small></small></span></label>' +
      '</div>';
    if (host.tagName === 'UL') { var li = document.createElement('li'); li.className = 'ts-li'; li.appendChild(wrap); host.appendChild(li); }
    else host.appendChild(wrap);
    btn = wrap.querySelector('.ts-btn'); panel = wrap.querySelector('.ts-panel');
    hbox = panel.querySelector('input'); hnote = panel.querySelector('small');

    function open(v) {
      panel.hidden = !v; btn.setAttribute('aria-expanded', String(v));
      if (v) { var p = panel.querySelector('[aria-pressed="true"]'); if (p) p.focus(); }
    }
    btn.addEventListener('click', function () { open(panel.hidden); });
    panel.addEventListener('click', function (e) { var b = e.target.closest('.ts-opt'); if (b) choose(b.dataset.id); });
    hbox.addEventListener('change', function () { holidayOn = hbox.checked; put(HKEY, holidayOn ? null : 'off'); apply(true); });
    document.addEventListener('click', function (e) { if (!panel.hidden && !wrap.contains(e.target)) open(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.hidden) { open(false); btn.focus(); } });
    sync();
  }

  apply(false);
  if (mq.addEventListener) mq.addEventListener('change', function () { if (theme === 'auto') apply(false); });
  document.addEventListener('DOMContentLoaded', function () { build(); apply(false); });
})();
