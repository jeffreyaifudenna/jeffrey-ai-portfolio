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
    { id: 'arcade', label: 'Quest', mode: 'dark', hidden: 1, font: 'https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@500;700&display=swap' }
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
      tog.addEventListener('click', function () { choose(d.getAttribute('data-mode') === 'dark' ? 'light' : 'dark'); });
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
      var base = THEMES.filter(function (t) { return t.base; }), fun = THEMES.filter(function (t) { return !t.base && t.id !== 'contrast'; });   /* includes Quest; its tile stays hidden until unlocked */
      wrap.innerHTML =
        '<button type="button" class="ts-link" aria-expanded="false">themes</button>' +
        '<div class="ts-panel" role="group" aria-label="Themes" hidden>' +
          '<p class="ts-h">Mode</p><div class="ts-grid">' + base.map(opt).join('') + '</div>' +
          '<p class="ts-h">Fun themes</p><div class="ts-grid">' + fun.map(opt).join('') + '</div>' +
          '<p class="ts-h">Accessibility</p><div class="ts-grid">' + opt(BY.contrast) + '</div>' +
          '<button type="button" class="ts-konami" aria-label="Enter the Konami code" title="Enter the Konami code">' + PAD_ICON + '</button>' +
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
      panel.addEventListener('click', function (e) {
        var b = e.target.closest('.ts-opt'); if (b) choose(b.dataset.id);
        var k = e.target.closest('.ts-konami'); if (k) { open(false); padOpen(btn); }
      });
      hbox.addEventListener('change', function () { holidayOn = hbox.checked; put(HKEY, holidayOn ? null : 'off'); apply(true); });
      document.addEventListener('click', function (e) { if (!panel.hidden && !wrap.contains(e.target)) open(false); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.hidden) { open(false); btn.focus(); } });
    }
    sync();
  }

  /* ---- easter egg: a footer button opens an on-screen NES-style pad; the Konami code unlocks the Quest theme ---- */
  var CODE = ['up', 'up', 'down', 'down', 'left', 'right', 'left', 'right', 'b', 'a'];
  function unlock() {
    var first = !unlocked; unlocked = true; put(UKEY, '1');
    var tile = panel && panel.querySelector('[data-id="arcade"]'); if (tile) tile.hidden = false;
    choose('arcade');
    burst(); banner(first ? 'MISSION UNLOCKED' : 'QUEST MODE'); jingle();
    toast(first ? 'Konami code! The Quest theme now lives in the themes picker.' : 'Quest theme: on.');
  }
  function toast(msg) {
    var old = document.querySelector('.ts-toast'); if (old) old.remove();
    var el = document.createElement('div'); el.className = 'ts-toast'; el.setAttribute('role', 'status'); el.textContent = msg;
    document.body.appendChild(el); setTimeout(function () { el.remove(); }, 4300);
  }

  /* pixel sprites: '.' is empty, other characters index into the sprite's own palette */
  var SPR = {
    coin: { c: { x: '#8a5a00', Y: '#ffd23f', o: '#fff3a0', s: '#e0a000' },
      p: ['..xxxx..', '.xYYYYx.', 'xYooYYsx', 'xYoYYYsx', 'xYYYYYsx', 'xYYYYssx', '.xssssx.', '..xxxx..'] },
    star: { c: { y: '#ffe600', w: '#fff9b0', k: '#b38600' },
      p: ['....y....', '....y....', '...ywy...', 'yyyywyyyy', '.yyyyyyk.', '..yyyyk..', '..yykyk..', '.yk...yk.', '.k.....k.'] },
    potion: { c: { b: '#8a5a2b', g: '#cfe9ff', p: '#d83cf0', P: '#f5a0ff' },
      p: ['...bb...', '...bb...', '...gg...', '..gggg..', '.gppppg.', 'gpPPpppg', 'gppppppg', '.gppppg.', '..gggg..'] },
    shield: { c: { k: '#c79a1a', b: '#3b6fe0', r: '#d83a3a' },
      p: ['kkkkkkkk', 'kbbrrbbk', 'kbbrrbbk', 'krrrrrrk', 'krrrrrrk', '.kbrrbk.', '..kbbk..', '...kk...'] },
    key: { c: { y: '#f0b429' },
      p: ['.yyy....', 'y...y...', 'y...y...', '.yyy....', '..y.....', '..yy....', '..y.....', '..yy....'] },
    ruby: { c: { c: '#ff4d6d', w: '#ffc2cc', C: '#a31d3a' },
      p: ['..cccc..', '.cwcccc.', 'cwccccCC', 'ccccccCC', '.cccCCC.', '..cCCC..', '...CC...', '....C...'] },
    rocket: { c: { r: '#ff4d4d', w: '#e8eef7', B: '#3aa8ff', f: '#ff9a2e', y: '#ffe066' },
      p: ['...r...', '..rrr..', '..www..', '..wBw..', '..www..', 'rwwwwwr', 'rr.w.rr', '...f...', '..fyf..'] },
    planet: { c: { p: '#8c6bff', P: '#c2aeff', d: '#5a3fc0', r: '#ffd166' },
      p: ['..ppppp..', '.pPppppp.', 'ppPpppppp', 'rrrrrrrrr', 'ppppppddp', '.pppppdp.', '..ppppp..'] },
    ufo: { c: { g: '#8ff0ff', G: '#d9fbff', s: '#aab4c8', S: '#ffe066', l: '#7a859b' },
      p: ['...ggg...', '..gGggg..', '.sssssss.', 'sSsSsSsSs', '.sssssss.', '..l...l..'] }
  };
  function sprite(name) {
    var sp = SPR[name], h = sp.p.length, w = sp.p[0].length, r = '';
    for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) { var ch = sp.p[y].charAt(x); if (ch !== '.') r += '<rect x="' + x + '" y="' + y + '" width="1" height="1" fill="' + sp.c[ch] + '"/>'; }
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" shape-rendering="crispEdges" aria-hidden="true">' + r + '</svg>';
  }
  function burst() {   /* one-off rain of coins and power-ups, separate from the holiday emoji */
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var mix = ['coin', 'rocket', 'potion', 'star', 'coin', 'planet', 'shield', 'ufo', 'key', 'ruby'];
    var el = document.createElement('div'); el.className = 'hfx px'; el.setAttribute('aria-hidden', 'true');
    for (var i = 0; i < 30; i++) {
      var n = mix[i % mix.length], sp = document.createElement('span'); sp.className = n === 'coin' ? 'spr spin' : 'spr'; sp.innerHTML = sprite(n);
      sp.style.cssText = '--x:' + Math.round(Math.random() * 94) + 'vw;--s:' + (26 + Math.round(Math.random() * 18)) + 'px;--t:' + (2.4 + Math.random() * 1.6).toFixed(1) +
        's;--dx:' + Math.round(Math.random() * 120 - 60) + 'px;--r:' + Math.round(Math.random() * 120 - 60) + 'deg';
      sp.style.animationIterationCount = '1'; sp.style.animationDelay = (Math.random() * 1.1).toFixed(2) + 's'; sp.style.opacity = '1';
      el.appendChild(sp);
    }
    document.body.appendChild(el); setTimeout(function () { el.remove(); }, 5500);
  }
  function banner(sub) {
    var el = document.createElement('div'); el.className = 'lvl'; el.setAttribute('aria-hidden', 'true');
    el.innerHTML = '<b>QUEST COMPLETE</b><b class="lu">LEVEL UP!</b><span>' + sub + '</span>'; document.body.appendChild(el); setTimeout(function () { el.remove(); }, 3200);
  }

  /* a short square-wave "power-up" arpeggio, only ever played right after the visitor enters the code themselves */
  var actx;
  function prepAudio() {
    try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); if (actx.state === 'suspended') actx.resume(); } catch (e) {}
  }
  function jingle() {
    if (!actx) return;
    try {
      var t0 = actx.currentTime + 0.02, notes = [392, 466.16, 587.33, 784, 587.33, 784, 932.33];
      notes.forEach(function (f, i) {
        var o = actx.createOscillator(), g = actx.createGain(), t = t0 + i * 0.075, last = i === notes.length - 1, len = last ? 0.32 : 0.07;
        o.type = 'square'; o.frequency.setValueAtTime(f, t);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.05, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
        o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t + len + 0.02);
      });
      var w = actx.createOscillator(), wg = actx.createGain(), ws = t0 + notes.length * 0.075 + 0.02;   /* rising warp, the "space" half */
      w.type = 'triangle'; w.frequency.setValueAtTime(300, ws); w.frequency.exponentialRampToValueAtTime(1900, ws + 0.3);
      wg.gain.setValueAtTime(0.0001, ws); wg.gain.exponentialRampToValueAtTime(0.05, ws + 0.03); wg.gain.exponentialRampToValueAtTime(0.0001, ws + 0.34);
      w.connect(wg); wg.connect(actx.destination); w.start(ws); w.stop(ws + 0.36);
    } catch (e) {}
  }
  var PAD_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true"><path d="M6.5 6h11a4.5 4.5 0 0 1 4.4 3.6l1 5A3.3 3.3 0 0 1 17.3 17L14.8 14h-5.6L6.7 17A3.3 3.3 0 0 1 1.1 14.6l1-5A4.5 4.5 0 0 1 6.5 6Z"/><path d="M7 8.5v4M5 10.5h4"/><circle cx="15.6" cy="11.6" r="1.15" fill="currentColor" stroke="none"/><circle cx="18.4" cy="9.8" r="1.15" fill="currentColor" stroke="none"/><path d="M11 8.3h.01M13 8.3h.01" stroke-width="2"/></svg>';
  var padEl, padOpener, padPos = 0;

  /* keep Tab inside an open dialog; shared with the page's own dialogs as window.jfTrapTab */
  function trapTab(box, e) {
    if (e.key !== 'Tab') return;
    var f = [].filter.call(box.querySelectorAll('button,a[href],input,select,textarea,video[controls],[tabindex]:not([tabindex="-1"])'),
      function (x) { return !x.disabled && !x.hidden && x.getClientRects().length; });
    if (!f.length) return;
    var i = f.indexOf(document.activeElement);
    e.preventDefault(); f[(i < 0 ? 0 : i + (e.shiftKey ? f.length - 1 : 1)) % f.length].focus();
  }
  window.jfTrapTab = trapTab;

  function padHTML() {
    var b = function (cls, k, label) { return '<button type="button" class="' + cls + '" data-k="' + k + '" aria-label="' + label + '">' + (cls.indexOf('dp') === 0 ? '<i></i>' : '') + '</button>'; };
    var dots = ''; for (var i = 0; i < CODE.length; i++) dots += '<i></i>';
    return '<div class="nes-card" role="dialog" aria-modal="true" aria-labelledby="nes-h">' +
      '<button type="button" class="nes-x" aria-label="Close">×</button>' +
      '<h2 id="nes-h">Enter the code</h2><p>Use the buttons below, or your keyboard’s arrow keys, B and A.</p>' +
      '<div class="nes"><div class="nes-panel"></div><div class="nes-mid"></div><div class="nes-well nes-well-b"></div><div class="nes-well nes-well-a"></div>' +
        b('dp dp-u', 'up', 'Up') + b('dp dp-d', 'down', 'Down') + b('dp dp-l', 'left', 'Left') + b('dp dp-r', 'right', 'Right') + '<span class="dp-c"></span>' +
        '<button type="button" class="nes-ss nes-sel" data-k="select" aria-label="Select"></button><button type="button" class="nes-ss nes-start" data-k="start" aria-label="Start"></button>' +
        '<span class="nes-lab" style="left:39cqw">SELECT</span><span class="nes-lab" style="left:52cqw">START</span>' +
        b('nes-ab nes-b', 'b', 'B') + b('nes-ab nes-a', 'a', 'A') +
        '<span class="nes-lab" style="left:70cqw">B</span><span class="nes-lab" style="left:86cqw">A</span>' +
        '<span class="nes-logo">Jeffrey</span></div>' +
      '<div class="nes-dots" aria-hidden="true">' + dots + '</div>' +
      '<p class="nes-status" role="status" aria-live="polite">0 of ' + CODE.length + '</p>' +
      '<button type="button" class="nes-hint">Need a hint?</button><p class="nes-code" hidden>↑ ↑ ↓ ↓ ← → ← → B A</p></div>';
  }

  function padSet(n, bad) {
    padPos = n;
    var dots = padEl.querySelectorAll('.nes-dots i');
    for (var i = 0; i < dots.length; i++) dots[i].className = i < n ? 'on' : '';
    padEl.querySelector('.nes-status').textContent = bad ? 'Not quite. Start over.' : n + ' of ' + CODE.length;
    if (bad) { var pad = padEl.querySelector('.nes'); pad.classList.remove('bad'); void pad.offsetWidth; pad.classList.add('bad'); }
  }

  function padPress(k) {
    prepAudio();   /* a tap is the user gesture browsers require before any sound */
    var el = padEl.querySelector('[data-k="' + k + '"]');
    if (el) { el.classList.add('on'); setTimeout(function () { el.classList.remove('on'); }, 140); }
    if (k === CODE[padPos]) {
      if (padPos + 1 === CODE.length) { padSet(CODE.length); setTimeout(function () { padClose(false); unlock(); }, 450); }
      else padSet(padPos + 1);
    } else padSet(k === CODE[0] ? 1 : 0, k !== CODE[0]);
  }

  function padClose(restoreFocus) {
    if (!padEl || padEl.hidden) return;
    padEl.hidden = true; document.documentElement.style.overflow = '';
    if (restoreFocus !== false && padOpener) padOpener.focus();
  }

  function padOpen(opener) {
    padOpener = opener;
    if (!padEl) {
      padEl = document.createElement('div'); padEl.className = 'nes-modal'; padEl.innerHTML = padHTML(); document.body.appendChild(padEl);
      padEl.addEventListener('click', function (e) {
        if (e.target === padEl || e.target.closest('.nes-x')) return padClose();
        var k = e.target.closest('[data-k]'); if (k) padPress(k.dataset.k);
        if (e.target.closest('.nes-hint')) { padEl.querySelector('.nes-code').hidden = false; e.target.closest('.nes-hint').hidden = true; }
      });
      padEl.addEventListener('keydown', function (e) {
        var map = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', b: 'b', a: 'a', B: 'b', A: 'a' };
        if (e.key === 'Escape') { e.preventDefault(); return padClose(); }
        if (map[e.key] && !e.metaKey && !e.ctrlKey && !e.altKey) { e.preventDefault(); return padPress(map[e.key]); }
        trapTab(padEl, e);
      });
    }
    padSet(0); padEl.hidden = false; document.documentElement.style.overflow = 'hidden';
    padEl.querySelector('.nes-x').focus({ preventScroll: true });
  }

  apply(false);
  var onScheme = function () { if (theme === 'auto') apply(false); };
  if (mq.addEventListener) mq.addEventListener('change', onScheme); else if (mq.addListener) mq.addListener(onScheme);   /* Safari < 14 */
  document.addEventListener('DOMContentLoaded', function () { build(); apply(false); });
})();
