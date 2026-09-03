(function () {
  'use strict';

  var DAY_START = toMin(CONFIG.dayStart);
  var DAY_END = toMin(CONFIG.dayEnd);
  var SPAN = DAY_END - DAY_START;
  var HOURS = Math.round(SPAN / 60);
  var THEME_KEY = 'rozvrh-theme';
  var THEME_COLOR = { light: '#f8fafc', dark: '#0f172a' };

  var activeDay = 0;
  var els = {};

  /* ---------------- pomocné funkcie ---------------- */

  function toMin(hhmm) {
    var p = hhmm.split(':');
    return (+p[0]) * 60 + (+p[1]);
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function fmt(min) { return pad(Math.floor(min / 60)) + ':' + pad(min % 60); }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function dateOnly(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function parseDate(s) {
    var p = s.split('-');
    return new Date(+p[0], +p[1] - 1, +p[2]);
  }
  function skDate(d) { return pad(d.getDate()) + '.' + pad(d.getMonth() + 1) + '.' + d.getFullYear(); }
  function minutesLabel(m) {
    if (m < 60) return m + ' min';
    var h = Math.floor(m / 60), r = m % 60;
    return r ? h + ' h ' + r + ' min' : h + ' h';
  }

  var SEM_START = parseDate(CONFIG.startDate);
  var SEM_END = parseDate(CONFIG.endDate);

  /* ---------------- príprava dát ---------------- */

  LESSONS.forEach(function (l, i) {
    l.id = i;
    l.s = toMin(l.start);
    l.e = toMin(l.end);
    l.dur = l.e - l.s;
    l.label = l.shortName || l.name;
  });

  var byDay = CONFIG.days.map(function (_, d) {
    return LESSONS.filter(function (l) { return l.day === d; })
      .sort(function (a, b) { return a.s - b.s || a.e - b.e; });
  });

  /* Rozloženie prekrývajúcich sa hodín: zhluk = súvislý blok prekryvov,
     v ňom sa hodiny umiestnia do najmenšieho počtu stĺpcov. */
  byDay.forEach(function (list) {
    var cluster = [], clusterEnd = -1;
    function flush() {
      if (!cluster.length) return;
      var colEnds = [];
      cluster.forEach(function (l) {
        var placed = false;
        for (var i = 0; i < colEnds.length; i++) {
          if (l.s >= colEnds[i]) { l.col = i; colEnds[i] = l.e; placed = true; break; }
        }
        if (!placed) { l.col = colEnds.length; colEnds.push(l.e); }
      });
      cluster.forEach(function (l) { l.cols = colEnds.length; });
      cluster = []; clusterEnd = -1;
    }
    list.forEach(function (l) {
      if (cluster.length && l.s >= clusterEnd) flush();
      cluster.push(l);
      clusterEnd = Math.max(clusterEnd, l.e);
    });
    flush();
  });

  /* ---------------- téma ---------------- */

  var mq = window.matchMedia('(prefers-color-scheme: dark)');

  function storedTheme() {
    try { return localStorage.getItem(THEME_KEY); } catch (e) { return null; }
  }
  function applyTheme(mode) {
    document.documentElement.setAttribute('data-theme', mode);
    var meta = document.getElementById('metaTheme');
    if (meta) meta.setAttribute('content', THEME_COLOR[mode]);
  }
  function initTheme() {
    applyTheme(storedTheme() || (mq.matches ? 'dark' : 'light'));
    var onChange = function () { if (!storedTheme()) applyTheme(mq.matches ? 'dark' : 'light'); };
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else if (mq.addListener) mq.addListener(onChange);
  }
  function toggleTheme() {
    var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* private mode */ }
  }

  /* ---------------- vykreslenie ---------------- */

  function todayIndex() {
    var d = new Date().getDay() - 1;
    return d >= 0 && d <= 4 ? d : -1;
  }

  function buildTabs() {
    els.tabs.textContent = '';
    var today = todayIndex();
    CONFIG.days.forEach(function (day, i) {
      var b = el('button', 'tab' + (i === today ? ' today' : ''));
      b.type = 'button';
      b.appendChild(el('span', 'tab-lg', day.full));
      b.appendChild(el('span', 'tab-sm', day.short));
      b.appendChild(el('span', 'cnt', String(byDay[i].length)));
      b.addEventListener('click', function () { setDay(i); });
      els.tabs.appendChild(b);
    });
  }

  function eventNode(l) {
    var n = el('button', 'ev ' + l.type + (l.dur < 60 ? ' short' : '') + (l.dur < 40 ? ' tiny' : ''));
    n.type = 'button';
    n.dataset.id = l.id;
    n.style.top = ((l.s - DAY_START) / SPAN * 100) + '%';
    n.style.height = (l.dur / SPAN * 100) + '%';
    n.style.left = 'calc(' + (l.col * 100 / l.cols) + '% + 4px)';
    n.style.width = 'calc(' + (100 / l.cols) + '% - 8px)';

    var head = el('div', 'eh');
    head.appendChild(el('span', 'code', l.code));
    head.appendChild(l.tag ? el('span', 'tag', l.tag) : el('span', 'pill ' + l.type, l.type === 'O' ? 'OPT' : l.type));
    n.appendChild(head);
    n.appendChild(el('div', 'name', l.label));
    n.appendChild(el('div', 'who', l.teacher));
    if (l.note) n.appendChild(el('div', 'note', l.note));

    var foot = el('div', 'foot');
    foot.appendChild(el('span', null, l.cols > 1 ? l.start : l.start + '–' + l.end));
    foot.appendChild(el('span', 'room', l.room));
    n.appendChild(foot);
    return n;
  }

  function buildGrid() {
    els.grid.textContent = '';
    var today = todayIndex();

    // 'on' drží stĺpec s časom viditeľný aj v jednodňovom (tablet/mobil) zobrazení
    var th = el('div', 'dh on');
    th.appendChild(el('small', null, 'Čas'));
    els.grid.appendChild(th);
    CONFIG.days.forEach(function (day, i) {
      els.grid.appendChild(el('div', 'dh' + (i === activeDay ? ' on' : '') + (i === today ? ' today' : ''), day.full));
    });

    var tc = el('div', 'timecol');
    for (var h = 0; h < HOURS; h++) tc.appendChild(el('div', 'ts', fmt(DAY_START + h * 60)));
    els.grid.appendChild(tc);

    CONFIG.days.forEach(function (_, d) {
      var col = el('div', 'col' + (d === activeDay ? ' on' : ''));
      col.id = 'col-' + d;
      for (var h = 1; h < HOURS; h++) {
        var line = el('div', 'hl');
        line.style.top = (h / HOURS * 100) + '%';
        col.appendChild(line);
      }
      byDay[d].forEach(function (l) { col.appendChild(eventNode(l)); });
      els.grid.appendChild(col);
    });
  }

  function agendaRow(l) {
    var n = el('button', 'arow ' + l.type);
    n.type = 'button';
    n.dataset.id = l.id;

    var t = el('div', 'atime');
    t.appendChild(el('b', null, l.start));
    t.appendChild(el('span', null, l.end));
    t.appendChild(el('i', null, minutesLabel(l.dur)));
    n.appendChild(t);

    var body = el('div', 'abody');
    var line = el('div', 'aline');
    line.appendChild(l.tag ? el('span', 'tag', l.tag) : el('span', 'pill ' + l.type, l.type === 'O' ? 'OPT' : l.type));
    line.appendChild(el('span', 'code', l.code));
    body.appendChild(line);
    body.appendChild(el('div', 'aname', l.label));

    var meta = el('div', 'ameta');
    meta.appendChild(el('span', 'achip aroom', l.room));
    meta.appendChild(el('span', 'achip', l.teacher));
    if (l.note) meta.appendChild(el('span', 'achip anote', l.note));
    body.appendChild(meta);

    n.appendChild(body);
    return n;
  }

  function buildAgenda() {
    els.agenda.textContent = '';
    CONFIG.days.forEach(function (day, d) {
      var wrap = el('div', 'aday' + (d === activeDay ? ' on' : ''));
      var head = el('div', 'ahead', day.full);
      head.appendChild(el('span', 'acount', byDay[d].length + (byDay[d].length === 1 ? ' hodina' : byDay[d].length < 5 ? ' hodiny' : ' hodín')));
      wrap.appendChild(head);
      if (!byDay[d].length) wrap.appendChild(el('div', 'aempty', 'Žiadne hodiny'));
      byDay[d].forEach(function (l) { wrap.appendChild(agendaRow(l)); });
      els.agenda.appendChild(wrap);
    });
  }

  function setDay(i) {
    activeDay = i;
    var tabs = els.tabs.children;
    for (var t = 0; t < tabs.length; t++) tabs[t].classList.toggle('active', t === i);
    var heads = els.grid.querySelectorAll('.dh');
    for (var h = 1; h < heads.length; h++) heads[h].classList.toggle('on', h - 1 === i);
    var cols = els.grid.querySelectorAll('.col');
    for (var c = 0; c < cols.length; c++) cols[c].classList.toggle('on', c === i);
    var days = els.agenda.children;
    for (var a = 0; a < days.length; a++) days[a].classList.toggle('on', a === i);
  }

  /* ---------------- aktuálny čas ---------------- */

  function inSemester(d) {
    var x = dateOnly(d);
    return x >= SEM_START && x <= SEM_END;
  }

  function findNowNext(now) {
    var res = { current: null, next: null, offset: 0, date: null };
    if (dateOnly(now) > SEM_END) return res;

    for (var off = 0; off < 8; off++) {
      var d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + off);
      var idx = d.getDay() - 1;
      if (idx < 0 || idx > 4 || !inSemester(d)) continue;

      var mins = off === 0 ? now.getHours() * 60 + now.getMinutes() : -1;
      var list = byDay[idx];

      if (off === 0) {
        for (var i = 0; i < list.length; i++) {
          if (list[i].s <= mins && mins < list[i].e) { res.current = list[i]; break; }
        }
      }
      for (var j = 0; j < list.length; j++) {
        if (list[j].s > mins) { res.next = list[j]; res.offset = off; res.date = d; break; }
      }
      if (res.next) break;
    }
    return res;
  }

  function updateBanner(now) {
    var b = els.banner;
    b.textContent = '';
    b.className = 'banner';
    b.appendChild(el('span', 'dot'));

    var text = el('span');
    var info = findNowNext(now);
    var today = dateOnly(now);
    var mins = now.getHours() * 60 + now.getMinutes();

    if (today < SEM_START) {
      var days = Math.round((SEM_START - today) / 86400000);
      text.appendChild(el('b', null, 'Semester začína ' + skDate(SEM_START)));
      text.appendChild(el('span', 'bmeta', ' · o ' + days + (days === 1 ? ' deň' : days < 5 ? ' dni' : ' dní')));
    } else if (today > SEM_END) {
      text.appendChild(el('b', null, 'Semester sa skončil'));
      text.appendChild(el('span', 'bmeta', ' · ' + skDate(SEM_END)));
    } else if (info.current) {
      b.classList.add('live');
      text.appendChild(el('b', null, 'Prebieha: ' + info.current.label));
      text.appendChild(el('span', 'bmeta', ' · ' + info.current.room + ' · končí o ' + info.current.end +
        ' (' + minutesLabel(info.current.e - mins) + ')'));
    } else if (info.next && info.offset === 0) {
      b.classList.add('soon');
      text.appendChild(el('b', null, 'O ' + minutesLabel(info.next.s - mins) + ': ' + info.next.label));
      text.appendChild(el('span', 'bmeta', ' · ' + info.next.start + ' · ' + info.next.room));
    } else if (info.next) {
      var dayName = CONFIG.days[info.next.day].full;
      text.appendChild(el('b', null, 'Najbližšie: ' + info.next.label));
      text.appendChild(el('span', 'bmeta', ' · ' + (info.offset === 1 ? 'zajtra' : dayName) +
        ' ' + info.next.start + ' · ' + info.next.room));
    } else {
      text.appendChild(el('b', null, 'Dnes už žiadne hodiny'));
    }

    b.appendChild(text);
    return info;
  }

  function updateHighlights(info) {
    var currentId = info.current ? String(info.current.id) : null;
    var nextId = info.next && info.offset === 0 ? String(info.next.id) : null;
    var nodes = document.querySelectorAll('[data-id]');
    for (var i = 0; i < nodes.length; i++) {
      var id = nodes[i].dataset.id;
      nodes[i].classList.toggle('is-now', id === currentId);
      nodes[i].classList.toggle('is-next', id === nextId);
    }
  }

  function updateNowLine(now) {
    var old = els.grid.querySelector('.now');
    if (old) old.remove();

    var d = todayIndex();
    if (d < 0 || !inSemester(now)) return;
    var mins = now.getHours() * 60 + now.getMinutes();
    if (mins < DAY_START || mins > DAY_END) return;

    var col = document.getElementById('col-' + d);
    if (!col) return;
    var line = el('div', 'now');
    line.style.top = ((mins - DAY_START) / SPAN * 100) + '%';
    line.appendChild(el('span', null, fmt(mins)));
    col.appendChild(line);
  }

  function tick() {
    var now = new Date();
    var info = updateBanner(now);
    updateHighlights(info);
    updateNowLine(now);
  }

  /* ---------------- modálne okno ---------------- */

  function openDetail(l) {
    document.getElementById('mCode').textContent = l.code;
    document.getElementById('mName').textContent = l.name;
    document.getElementById('mTime').textContent = l.start + ' – ' + l.end;
    document.getElementById('mDur').textContent = minutesLabel(l.dur);
    document.getElementById('mRoom').textContent = l.room;
    document.getElementById('mWho').textContent = l.teacher;
    document.getElementById('mType').textContent = l.typeLabel;
    document.getElementById('mNote').textContent = l.note || '';
    document.getElementById('mNoteRow').style.display = l.note ? 'flex' : 'none';
    document.getElementById('mDay').textContent = CONFIG.days[l.day].full;
    els.ovl.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeModal() {
    els.ovl.classList.remove('open');
    document.body.style.overflow = '';
  }
  function isModalOpen() { return els.ovl.classList.contains('open'); }

  /* ---------------- ovládanie ---------------- */

  function tabsVisible() { return els.tabs.offsetParent !== null; }

  function moveDay(delta) {
    var n = activeDay + delta;
    if (n < 0 || n > CONFIG.days.length - 1) return;
    setDay(n);
  }

  function bindSwipe(node) {
    var x0 = 0, y0 = 0, tracking = false;
    node.addEventListener('touchstart', function (e) {
      if (e.touches.length !== 1) { tracking = false; return; }
      x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; tracking = true;
    }, { passive: true });
    node.addEventListener('touchend', function (e) {
      if (!tracking || !tabsVisible() || isModalOpen()) return;
      tracking = false;
      var t = e.changedTouches[0];
      var dx = t.clientX - x0, dy = t.clientY - y0;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.8) moveDay(dx < 0 ? 1 : -1);
    }, { passive: true });
  }

  /* ---------------- štart ---------------- */

  function init() {
    els.tabs = document.getElementById('tabs');
    els.grid = document.getElementById('grid');
    els.agenda = document.getElementById('agenda');
    els.banner = document.getElementById('banner');
    els.ovl = document.getElementById('ovl');

    document.getElementById('semLabel').textContent = CONFIG.semester;
    document.getElementById('rangeLabel').textContent =
      CONFIG.frequency + ' · ' + skDate(SEM_START) + ' – ' + skDate(SEM_END);
    document.getElementById('mFreq').textContent = CONFIG.frequency + ' (od ' + skDate(SEM_START) + ')';
    document.getElementById('mRange').textContent = skDate(SEM_START) + ' – ' + skDate(SEM_END);

    buildTabs();
    buildGrid();
    buildAgenda();

    var t = todayIndex();
    setDay(t < 0 ? 0 : t);
    tick();
    setInterval(tick, 30000);

    document.getElementById('themeBtn').addEventListener('click', toggleTheme);
    els.ovl.addEventListener('click', closeModal);
    els.ovl.querySelector('.mc').addEventListener('click', function (e) { e.stopPropagation(); });
    document.getElementById('closeBtn').addEventListener('click', closeModal);

    document.addEventListener('click', function (e) {
      var target = e.target.closest ? e.target.closest('[data-id]') : null;
      if (target) openDetail(LESSONS[+target.dataset.id]);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { closeModal(); return; }
      if (isModalOpen() || !tabsVisible()) return;
      if (e.key === 'ArrowLeft') { moveDay(-1); e.preventDefault(); }
      if (e.key === 'ArrowRight') { moveDay(1); e.preventDefault(); }
    });

    bindSwipe(els.agenda);
    bindSwipe(document.querySelector('.card'));

    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) tick();
    });
  }

  initTheme();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
