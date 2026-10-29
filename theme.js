/* Theme picker + holiday themes. Loaded blocking in <head> so the right palette is set before first paint.
   Preview without waiting for the date:  ?holiday=halloween   or   ?theme=terminal  (neither is saved). */
(function () {
  var d = document.documentElement;
  var KEY = 'jf-theme', HKEY = 'jf-holiday', UKEY = 'jf-arcade';
  var THEMES = [
    { id: 'auto', label: 'Auto', base: 1 }, { id: 'light', label: 'Light', base: 1, mode: 'light' }, { id: 'dark', label: 'Dark', base: 1, mode: 'dark' },
    { id: 'sunset', label: 'Sunset', mode: 'dark' }, { id: 'terminal', label: 'Terminal', mode: 'dark' }, { id: 'synthwave', label: 'Synthwave', mode: 'dark' },
    { id: 'blueprint', label: 'Blueprint', mode: 'dark' },
    { id: 'gameboy', label: 'Game Boy', mode: 'light', font: 'https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@500;700&display=swap' },
    { id: 'bubblegum', label: 'Bubblegum', mode: 'light' }, { id: 'ocean', label: 'Ocean', mode: 'dark' }, { id: 'sepia', label: 'Sepia', mode: 'light' },
    { id: 'contrast', label: 'High contrast', mode: 'dark' },
    { id: 'arcade', label: 'Arcade', mode: 'dark', hidden: 1, font: 'https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@500;700&display=swap' }
  ];
  var BY = {}; THEMES.forEach(function (t) { BY[t.id] = t; });

  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function put(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }

  /* ---- holidays: each one shows on its actual day only (local date) ---- */
  function md(t) { return (t.getMonth() + 1) * 100 + t.getDate(); }
  function on(m, dd) { return function (t) { return md(t) === m * 100 + dd; }; }
  function table(tbl) { return function (t) { var v = tbl[t.getFullYear()]; return !!v && t.getMonth() === v[0] && t.getDate() === v[1]; }; }
  function easter(y) {
    var a = y % 19, b = Math.floor(y / 100), c = y % 100, dd = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25),
        g = Math.floor((b - f + 1) / 3), h = (19 * a + b - dd - g + 15) % 30, i = Math.floor(c / 4), k = c % 4,
        l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451), n = h + l - 7 * m + 114;
    return [Math.floor(n / 31) - 1, (n % 31) + 1];
  }
  /* the Hebrew calendar is exact arithmetic, so Intl gives Hanukkah's first day (25 Kislev) correctly every year */
  function hanukkah(t) {
    try {
      var ps = new Intl.DateTimeFormat('en-u-ca-hebrew-nu-latn', { month: 'long', day: 'numeric', timeZone: 'UTC' })
        .formatToParts(new Date(Date.UTC(t.getFullYear(), t.getMonth(), t.getDate(), 12))), m = '', n = 0;
      ps.forEach(function (p) { if (p.type === 'month') m = p.value; if (p.type === 'day') n = parseInt(p.value, 10); });
      return m === 'Kislev' && n === 25;
    } catch (e) { return false; }
  }
  /* [month index, day]. Intl's Chinese calendar can be a day off near midnight, so these are tables; add a year now and then. */
  var DIWALI = { 2026: [10, 8], 2027: [9, 29], 2028: [9, 17] };
  var LUNAR = { 2027: [1, 6], 2028: [0, 26], 2029: [1, 13], 2030: [1, 3] };
  var HOLIDAYS = [
    { id: 'christmas', name: 'Merry Christmas', fx: ['❄️', '🎄', '⭐'], is: on(12, 25) },
    { id: 'diwali', name: 'Happy Diwali', fx: ['🪔', '✨'], rise: 1, is: table(DIWALI) },
    { id: 'halloween', name: 'Happy Halloween', fx: ['🎃', '🦇', '👻'], is: on(10, 31) },
    { id: 'thanksgiving', name: 'Happy Thanksgiving', fx: ['🍂', '🍁', '🦃'], is: function (t) {
        var first = new Date(t.getFullYear(), 10, 1).getDay(); return t.getMonth() === 10 && t.getDate() === 1 + ((4 - first + 7) % 7) + 21; } },
    { id: 'hanukkah', name: 'Happy Hanukkah', fx: ['🕎', '✨'], is: hanukkah },
    { id: 'newyear', name: 'Happy New Year', fx: ['🎉', '✨', '🥂'], is: on(1, 1) },
    { id: 'lunar', name: 'Happy Lunar New Year', fx: ['🧧', '🏮'], is: table(LUNAR) },
    { id: 'valentine', name: 'Happy Valentine’s Day', fx: ['💕', '❤️'], rise: 1, is: on(2, 14) },
    { id: 'pi', name: 'Happy Pi Day', fx: ['π', '🥧'], is: on(3, 14) },
    { id: 'stpatrick', name: 'Happy St. Patrick’s Day', fx: ['🍀'], is: on(3, 17) },
    { id: 'easter', name: 'Happy Easter', fx: ['🐣', '🌷', '🥚'], is: function (t) {
        var e = easter(t.getFullYear()); return t.getMonth() === e[0] && t.getDate() === e[1]; } },
    { id: 'earth', name: 'Happy Earth Day', fx: ['🌍', '🌱'], is: on(4, 22) },
    { id: 'maythe4', name: 'May the Fourth be with you', fx: ['⭐', '✨'], is: on(5, 4) },
    { id: 'pride', name: 'Happy Pride', fx: ['🌈', '💖', '✨'], is: on(6, 28) },
    { id: 'july4', name: 'Happy Fourth of July', fx: ['🎆', '✨'], rise: 1, is: on(7, 4) }
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
  var unlocked = get(UKEY) === '1';
  var theme = BY[preview] ? preview : (BY[saved] && (!BY[saved].hidden || unlocked) ? saved : 'auto');
  var holidayOn = get(HKEY) !== 'off' || !!HBY[q.get('holiday')];   /* a ?holiday= preview shows even if opted out */
  var holiday = today();
  var mq = window.matchMedia ? matchMedia('(prefers-color-scheme: dark)') : { matches: false };
  var fxEl, panel, btn, hbox, hnote, tog;

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

  var SUN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/></svg>';
  var MOON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/></svg>';

  function sync() {
    var meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) { meta = document.createElement('meta'); meta.name = 'theme-color'; document.head.appendChild(meta); }
    var bg = getComputedStyle(d).getPropertyValue('--bg').trim(); if (bg) meta.content = bg;
    var icon = document.querySelector('link[rel~="icon"]');
    if (icon) {   /* the tab icon is the cairn in the current theme's stones and accent */
      var cs = getComputedStyle(d), c = function (n) { return cs.getPropertyValue(n).trim(); };
      if (c('--stone2') && c('--accent')) icon.href = 'data:image/svg+xml,' + encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><ellipse cx='32' cy='54' rx='24' ry='8' fill='" +
        c('--stone2') + "'/><ellipse cx='30' cy='40' rx='17' ry='7' fill='" + c('--stone1') + "'/><ellipse cx='33' cy='28' rx='11' ry='6' fill='" + c('--stone3') +
        "'/><ellipse cx='32' cy='17' rx='7' ry='5' fill='" + c('--accent') + "'/></svg>");
    }
    if (tog) {
      var dark = d.getAttribute('data-mode') === 'dark', msg = dark ? 'Switch to light mode' : 'Switch to dark mode';
      tog.innerHTML = dark ? SUN : MOON; tog.setAttribute('aria-label', msg); tog.title = msg;
    }
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

  /* ---- UI: a light/dark button in the nav, and a "themes" picker in the footer ---- */
  function build() {
    var nav = document.querySelector('.nav-r') || document.querySelector('.top ul') || document.querySelector('.top .wrap, .topbar .wrap');
    if (nav) {
      tog = document.createElement('button'); tog.type = 'button'; tog.className = 'ts-btn';
      tog.addEventListener('click', function () { tapSecret(); choose(d.getAttribute('data-mode') === 'dark' ? 'light' : 'dark'); });
      if (nav.tagName === 'UL') { var li = document.createElement('li'); li.className = 'ts-li'; li.appendChild(tog); nav.appendChild(li); }
      else nav.appendChild(tog);
    }

    var foot = document.querySelector('footer .wrap'); foot = foot && foot.lastElementChild;
    if (foot) {
      var wrap = document.createElement('span'); wrap.className = 'theme-switch';
      var opt = function (t) {
        var sw = t.id === 'auto' ? '<span class="sw sw-auto"><i></i><i></i></span>' : '<span class="sw" data-t="' + t.id + '"></span>';
        return '<button type="button" class="ts-opt" data-id="' + t.id + '" aria-pressed="false"' + (t.hidden && !unlocked ? ' hidden' : '') + '>' + sw + '<span>' + t.label + '</span></button>';
      };
      var base = THEMES.filter(function (t) { return t.base; }), fun = THEMES.filter(function (t) { return !t.base && t.id !== 'contrast'; });   /* includes Arcade; its tile stays hidden until unlocked */
      wrap.innerHTML =
        '<button type="button" class="ts-link" aria-expanded="false" aria-haspopup="true">themes</button>' +
        '<div class="ts-panel" role="group" aria-label="Themes" hidden>' +
          '<p class="ts-h">Mode</p><div class="ts-grid">' + base.map(opt).join('') + '</div>' +
          '<p class="ts-h">Fun themes</p><div class="ts-grid">' + fun.map(opt).join('') + '</div>' +
          '<p class="ts-h">Accessibility</p><div class="ts-grid">' + opt(BY.contrast) + '</div>' +
          '<label class="ts-hol"><input type="checkbox"><span>Holiday themes<small></small></span></label>' +
        '</div>';
      foot.appendChild(document.createTextNode(' · ')); foot.appendChild(wrap);
      btn = wrap.querySelector('.ts-link'); panel = wrap.querySelector('.ts-panel');
      hbox = panel.querySelector('input'); hnote = panel.querySelector('small');

      var open = function (v) {
        panel.hidden = !v; btn.setAttribute('aria-expanded', String(v)); panel.style.transform = '';
        if (!v) return;
        var r = panel.getBoundingClientRect(), shift = 0;   /* keep the panel on screen wherever the footer link sits */
        if (r.left < 8) shift = 8 - r.left; else if (r.right > innerWidth - 8) shift = innerWidth - 8 - r.right;
        if (shift) panel.style.transform = 'translateX(' + Math.round(shift) + 'px)';
        var p = panel.querySelector('[aria-pressed="true"]'); if (p) p.focus({ preventScroll: true });
      };
      btn.addEventListener('click', function () { open(panel.hidden); });
      panel.addEventListener('click', function (e) { var b = e.target.closest('.ts-opt'); if (b) choose(b.dataset.id); });
      hbox.addEventListener('change', function () { holidayOn = hbox.checked; put(HKEY, holidayOn ? null : 'off'); apply(true); });
      document.addEventListener('click', function (e) { if (!panel.hidden && !wrap.contains(e.target)) open(false); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.hidden) { open(false); btn.focus(); } });
    }
    sync();
  }

  /* ---- easter egg: ↑ ↑ ↓ ↓ ← → ← → B A (or five quick taps on the light/dark button) unlocks Arcade ---- */
  var CODE = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'], pos = 0, taps = [];
  function unlock() {
    var first = !unlocked; unlocked = true; put(UKEY, '1');
    var tile = panel && panel.querySelector('[data-id="arcade"]'); if (tile) tile.hidden = false;
    choose('arcade');
    burst(['👾', '🕹️', '🍒', '⭐', '👻']);
    toast(first ? 'Konami code! Arcade theme unlocked. It now lives in the themes picker.' : 'Arcade mode: on.');
  }
  function toast(msg) {
    var old = document.querySelector('.ts-toast'); if (old) old.remove();
    var el = document.createElement('div'); el.className = 'ts-toast'; el.setAttribute('role', 'status'); el.textContent = msg;
    document.body.appendChild(el); setTimeout(function () { el.remove(); }, 4300);
  }
  function burst(emoji) {   /* one-off shower, separate from the holiday one */
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var el = document.createElement('div'); el.className = 'hfx'; el.setAttribute('aria-hidden', 'true');
    for (var i = 0; i < 36; i++) {
      var s = document.createElement('span'); s.textContent = emoji[i % emoji.length];
      s.style.cssText = '--x:' + Math.round(Math.random() * 96) + 'vw;--s:' + (18 + Math.round(Math.random() * 18)) + 'px;--t:' + (3 + Math.random() * 3).toFixed(1) +
        's;--dl:-' + (Math.random() * 1).toFixed(1) + 's;--dx:' + Math.round(Math.random() * 160 - 80) + 'px;--r:' + Math.round(Math.random() * 540 - 270) + 'deg';
      s.style.animationIterationCount = '1'; s.style.animationDelay = (Math.random() * 1.2).toFixed(2) + 's'; s.style.opacity = '.95';
      el.appendChild(s);
    }
    document.body.appendChild(el); setTimeout(function () { el.remove(); }, 7500);
  }
  function tapSecret() {
    var now = Date.now(); taps.push(now); taps = taps.filter(function (t) { return now - t < 2000; });
    if (taps.length >= 5) { taps = []; setTimeout(unlock, 0); }
  }
  document.addEventListener('keydown', function (e) {
    var el = e.target, tag = el && el.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (el && el.isContentEditable) || e.metaKey || e.ctrlKey || e.altKey) return;
    var k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (k === CODE[pos]) { if (++pos === CODE.length) { pos = 0; unlock(); } } else pos = k === CODE[0] ? 1 : 0;
  });

  apply(false);
  if (mq.addEventListener) mq.addEventListener('change', function () { if (theme === 'auto') apply(false); });
  document.addEventListener('DOMContentLoaded', function () { build(); apply(false); });
})();
