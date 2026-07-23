/* Sterith Workout — application logic */
(function () {
  'use strict';
  var S = window.SterithStore;

  // ---------------------------------------------------------------- state ----
  var state = {
    tab: 'log',
    session: S.getDraft(),      // active workout being logged (or null)
    libFilter: 'all',           // exercise-library category filter
    picker: { open: false, selected: {}, forSession: false },
    trackMetric: 'bodyweight',   // 'bodyweight' | 'ex:<exercise name>'
    trackPeriod: 'month',        // week | month | 3month | all | range
    trackRange: null,            // {from, to} epoch ms for custom range
    _sessionTimer: null
  };

  var view = document.getElementById('view');
  var sheetSlot = document.getElementById('sheet-slot');
  var toastSlot = document.getElementById('toast-slot');

  // ---------------------------------------------------------------- icons ----
  var I = {
    log:'<path d="M12 8v4l3 2"/><circle cx="12" cy="12" r="9"/>',
    routine:'<path d="M6.5 6.5l-2 2m0-2l2 2M17.5 17.5l2-2m0 2l-2-2"/><rect x="8" y="4" width="8" height="4" rx="1"/><rect x="8" y="16" width="8" height="4" rx="1"/><path d="M12 8v8"/>',
    stats:'<path d="M5 20V10M12 20V4M19 20v-7"/>',
    profile:'<circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6"/>',
    plus:'<path d="M12 5v14M5 12h14"/>',
    up:'<path d="M6 15l6-6 6 6"/>',
    down:'<path d="M6 9l6 6 6-6"/>',
    swap:'<path d="M7 4v13m0-13L4 7m3-3l3 3M17 20V7m0 13l-3-3m3 3l3-3"/>',
    chev:'<path d="M9 6l6 6-6 6"/>',
    chevRight:'<path d="M9 6l6 6-6 6"/>',
    close:'<path d="M6 6l12 12M18 6L6 18"/>',
    clock:'<circle cx="12" cy="12" r="9"/><path d="M12 8v4l3 2"/>',
    check:'<path d="M5 12l5 5L20 6"/>',
    trash:'<path d="M4 7h16M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2M6 7l1 13h10l1-13"/>',
    scale:'<path d="M12 3v3M6 6h12l3 9a4 4 0 01-8 0l3-9M6 6l-3 9a4 4 0 008 0"/>',
    dumbbell:'<path d="M4 9v6M2 11v2M20 9v6M22 11v2M7 12h10"/><rect x="6" y="8" width="2" height="8" rx="1"/><rect x="16" y="8" width="2" height="8" rx="1"/>',
    settings:'<circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 00-.1-1l2-1.5-2-3.5-2.4 1a7 7 0 00-1.7-1L14.5 2h-5l-.3 2.5a7 7 0 00-1.7 1l-2.4-1-2 3.5L3.1 11a7 7 0 000 2l-2 1.5 2 3.5 2.4-1a7 7 0 001.7 1l.3 2.5h5l.3-2.5a7 7 0 001.7-1l2.4 1 2-3.5-2-1.5c.1-.3.1-.7.1-1z"/>',
    download:'<path d="M12 4v10m0 0l-4-4m4 4l4-4M5 19h14"/>',
    note:'<path d="M5 4h11l3 3v13H5z"/><path d="M9 9h6M9 13h6M9 17h3"/>',
    play:'<path d="M7 5l12 7-12 7z"/>',
    back:'<path d="M15 6l-6 6 6 6"/>',
    mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
    lock:'<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/>',
    eye:'<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z"/><circle cx="12" cy="12" r="3"/>',
    eyeoff:'<path d="M4 4l16 16"/><path d="M9.9 5.2A9.6 9.6 0 0112 5c6.5 0 10 6 10 6a17 17 0 01-3 3.6M6 6.6A17 17 0 002 11s3.5 6 10 6a9.6 9.6 0 003.2-.5"/>',
    logout:'<path d="M15 12H4M8 8l-4 4 4 4"/><path d="M11 4h7a2 2 0 012 2v12a2 2 0 01-2 2h-7"/>',
    chat:'<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>',
    phone:'<path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z"/>',
    camera:'<path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 011 1v9a1 1 0 01-1 1H4a1 1 0 01-1-1V9a1 1 0 011-1z"/><circle cx="12" cy="13" r="3.2"/>',
    checkin:'<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>'
  };
  function svg(name, w) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"' +
      (w ? ' width="' + w + '" height="' + w + '"' : '') + '>' + I[name] + '</svg>';
  }

  // ---------------------------------------------------------------- utils ----
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]; }); }
  function unit() { return S.getSettings().unit; }
  var LB_PER_KG = 2.2046226218;
  function convW(val, from, to) {
    if (from === to || val == null || val === '') return val;
    var n = parseFloat(val); if (isNaN(n)) return val;
    return from === 'kg' ? n * LB_PER_KG : n / LB_PER_KG;
  }
  function round1(n) { return Math.round(n * 10) / 10; }

  // Body measurements captured in a check-in (all in cm) — each is trackable.
  var MEASUREMENTS = [
    { key: 'neck', label: 'Leher' },
    { key: 'shoulders', label: 'Bahu' },
    { key: 'chest', label: 'Dada' },
    { key: 'arms', label: 'Lengan (biceps)' },
    { key: 'forearm', label: 'Lengan bawah' },
    { key: 'waist', label: 'Pinggang' },
    { key: 'abs', label: 'Perut' },
    { key: 'hips', label: 'Pinggul' },
    { key: 'quad', label: 'Paha' },
    { key: 'calf', label: 'Betis' }
  ];
  function measLabel(key) { var m = MEASUREMENTS.find(function (x) { return x.key === key; }); return m ? m.label : key; }

  var DOW = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
  var MON = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  function dateParts(ts) { var d = new Date(ts); return { dow: DOW[d.getDay()], dnum: d.getDate(), mon: MON[d.getMonth()] }; }
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function clockStr(ts) { var d = new Date(ts); return pad(d.getHours()) + ':' + pad(d.getMinutes()); }
  function dayKey(ts) { var d = new Date(ts); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function durationStr(sec) {
    if (sec == null) return '';
    var m = Math.round(sec / 60);
    if (m < 60) return m + ' min';
    return Math.floor(m / 60) + 'h ' + (m % 60) + 'm';
  }
  function mmss(sec) { sec = Math.floor(sec || 0); return pad(Math.floor(sec / 60)) + ':' + pad(sec % 60); }
  function fullDate(ts) { var d = new Date(ts); return DOW[d.getDay()][0] + DOW[d.getDay()].slice(1).toLowerCase() + ' · ' + d.getDate() + ' ' + MON[d.getMonth()][0] + MON[d.getMonth()].slice(1).toLowerCase() + ' ' + d.getFullYear(); }
  function shortDate(ts) { var d = new Date(ts); return d.getDate() + ' ' + MON[d.getMonth()][0] + MON[d.getMonth()].slice(1).toLowerCase(); }

  function toast(msg) {
    toastSlot.innerHTML = '<div class="toast">' + esc(msg) + '</div>';
    clearTimeout(toast._t); toast._t = setTimeout(function () { toastSlot.innerHTML = ''; }, 1900);
  }

  // ----------------------------------------------------------- action bus ----
  var actions = {};
  function on(name, fn) { actions[name] = fn; }
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-act]');
    if (!t) return;
    var fn = actions[t.dataset.act];
    if (fn) { e.preventDefault(); fn(t, e); }
  });
  document.addEventListener('change', function (e) {
    var el = e.target;
    if (el.id === 'track-metric') { state.trackMetric = el.value; render(); }
  });

  // ================================================================ RENDER ===
  var _renderKey = null;
  function render() {
    // key identifies the "view" — only reset scroll when the view actually changes,
    // so in-place updates (e.g. changing the Tracker period) keep your scroll spot.
    var key = (state.session && state.tab === 'log') ? 'session' : state.tab;
    var sameView = key === _renderKey;
    var prevScroll = window.scrollY;

    if (state.session && state.tab === 'log') { view.innerHTML = topbar('Workout', 'IN PROGRESS · ' + (state.session.name || 'Session')) + renderSession(); startSessionTimer(); }
    else {
      stopSessionTimer();
      if (state.tab === 'log') view.innerHTML = topbar('Log', logEyebrow()) + renderLog();
      else if (state.tab === 'routines') view.innerHTML = topbar('Routines', 'YOUR SPLITS') + renderRoutines();
      else if (state.tab === 'stats') view.innerHTML = topbar('Statistics', 'YOUR NUMBERS') + renderStats();
      else if (state.tab === 'profile') view.innerHTML = topbar('Profile', 'STERITH ATHLETE') + renderProfile();
    }
    updateNav();
    updateFab();
    _renderKey = key;
    window.scrollTo(0, sameView ? prevScroll : 0);
  }

  function topbar(title, eyebrow) {
    var actionsHtml = '';
    if (state.session && state.tab === 'log') {
      actionsHtml = '<button class="iconbtn" data-act="discard-session" title="Discard">' + svg('trash') + '</button>';
    }
    return '<div class="topbar"><div><div class="eyebrow">' + esc(eyebrow) + '</div><h1>' + esc(title) + '</h1></div>' +
      '<div class="actions">' + actionsHtml + '</div></div>';
  }

  function logEyebrow() {
    var logs = S.getLogs();
    return logs.length ? logs.length + (logs.length === 1 ? ' SESSION LOGGED' : ' SESSIONS LOGGED') : 'START YOUR FIRST WORKOUT';
  }

  // ---------------------------------------------------------------- LOG ------
  function renderLog() {
    var logs = S.getLogs().slice().sort(function (a, b) { return b.startedAt - a.startedAt; });
    if (!logs.length) {
      return '<div class="screen"><div class="empty"><div class="glyph">' + svg('dumbbell', 44) + '</div>' +
        '<h3>No workouts yet</h3><p>Tap the + button to log your first session. Pick from a routine or build it on the fly.</p></div></div>';
    }
    // group by day
    var groups = {}, order = [];
    logs.forEach(function (l) { var k = dayKey(l.startedAt); if (!groups[k]) { groups[k] = []; order.push(k); } groups[k].push(l); });
    var html = '<div class="screen">';
    order.forEach(function (k) {
      groups[k].forEach(function (l) {
        var p = dateParts(l.startedAt);
        html += '<div class="day-row"><div class="day-date"><div class="dow">' + p.dow + '</div>' +
          '<span class="dnum num">' + p.dnum + '</span><div class="mon">' + p.mon + '</div></div>' +
          '<div class="session-card" data-act="open-log" data-id="' + l.id + '">' +
          '<div class="sc-head"><h3>' + esc(l.name || 'Workout') + '</h3><span class="dur num">' + durationStr(l.durationSec) + '</span></div>' +
          '<div class="sc-time num">' + clockStr(l.startedAt) + (l.finishedAt ? ' – ' + clockStr(l.finishedAt) : '') + '</div>' +
          '<ul>' + l.exercises.map(function (ex) {
            return '<li><span class="sets num">' + ex.sets.length + '×</span><span>' + esc(ex.name) + '</span></li>';
          }).join('') + '</ul></div></div>';
      });
    });
    html += '</div>';
    return html;
  }

  on('open-log', function (t) { openLogDetail(t.dataset.id); });

  // ------------------------------------------------------------ ROUTINES -----
  function renderRoutines() {
    var routines = S.getRoutines();
    if (!routines.length) {
      return '<div class="screen"><div class="empty"><div class="glyph">' + svg('routine', 44) + '</div>' +
        '<h3>No routines yet</h3><p>Create a routine like "Push Day" and pre-load its exercises so logging is one tap.</p>' +
        '<div class="spacer"></div><button class="btn btn-primary" data-act="new-routine">Create routine <span class="arrow">&rarr;</span></button></div></div>';
    }
    var html = '<div class="screen"><div class="list">';
    routines.forEach(function (r) {
      html += '<div class="row tap" data-act="open-routine" data-id="' + r.id + '">' +
        '<div class="avatar num">' + esc((r.name || '?').slice(0, 2)) + '</div>' +
        '<div class="grow"><div class="rtitle">' + esc(r.name) + '</div>' +
        '<div class="rmeta">' + r.exercises.length + ' exercise' + (r.exercises.length === 1 ? '' : 's') + '</div></div>' +
        '<button class="btn btn-primary" style="padding:9px 13px" data-act="start-from-routine" data-id="' + r.id + '">Start</button>' +
        '</div>';
    });
    html += '</div></div>';
    return html;
  }

  // --------------------------------------------------------------- STATS -----
  function renderStats() {
    var logs = S.getLogs();
    var u = unit();
    var totalWorkouts = logs.length;
    var totalSets = 0, totalVol = 0, totalReps = 0;
    logs.forEach(function (l) {
      l.exercises.forEach(function (ex) {
        ex.sets.forEach(function (st) {
          if (st.weight !== '' && st.reps !== '' && st.weight != null && st.reps != null) {
            var w = convW(parseFloat(st.weight), l.unit || u, u);
            totalVol += w * parseFloat(st.reps);
            totalReps += parseFloat(st.reps);
          }
          totalSets++;
        });
      });
    });
    // this week
    var now = Date.now(), weekAgo = now - 7 * 864e5;
    var thisWeek = logs.filter(function (l) { return l.startedAt >= weekAgo; }).length;

    // 8-week bar chart of workout counts
    var weeks = [];
    for (var i = 7; i >= 0; i--) {
      var start = now - (i + 1) * 7 * 864e5, end = now - i * 7 * 864e5;
      var c = logs.filter(function (l) { return l.startedAt >= start && l.startedAt < end; }).length;
      weeks.push({ c: c, label: i === 0 ? 'NOW' : i + 'w' });
    }
    var maxC = Math.max(1, Math.max.apply(null, weeks.map(function (w) { return w.c; })));

    // weight trend
    var weight = S.getWeight().slice().sort(function (a, b) { return a.ts - b.ts; });

    var html = '<div class="screen">';
    // dark KPI strip
    html += '<div class="darkstrip">' +
      '<div class="ds-item"><div class="dl">Workouts</div><div class="dv num">' + totalWorkouts + '</div></div>' +
      '<div class="div"></div>' +
      '<div class="ds-item"><div class="dl">This week</div><div class="dv num gold">' + thisWeek + '</div></div>' +
      '<div class="div"></div>' +
      '<div class="ds-item"><div class="dl">Total sets</div><div class="dv num">' + totalSets + '</div></div>' +
      '</div>';

    // frequency bars
    html += '<div class="card"><div class="section-label" style="margin:0 0 4px">Workouts · last 8 weeks</div>' +
      '<div class="bars">' + weeks.map(function (w) {
        var h = Math.round((w.c / maxC) * 100);
        return '<div class="bar-col"><div class="bval num">' + (w.c || '') + '</div>' +
          '<div class="bar' + (w.label === 'NOW' ? ' gold' : '') + '" style="height:' + h + '%"></div>' +
          '<div class="blabel">' + w.label + '</div></div>';
      }).join('') + '</div></div>';

    // progress tracker (bodyweight or any exercise, over a chosen timeframe)
    html += renderTracker();

    // personal records
    var prs = computePRs(logs, u);
    if (prs.length) {
      html += '<div class="card tight"><div class="card-head"><span class="eyebrow">Personal Records</span><span class="eyebrow" style="color:var(--muted2);letter-spacing:.04em">otomatis</span></div>';
      html += '<div style="padding:10px 16px 4px"><div class="muted-line" style="margin:0 0 4px;font-size:11.5px">Terisi sendiri dari set terberatmu tiap latihan — tak perlu diisi manual.</div></div>';
      html += '<div style="padding:2px 16px 10px">';
      prs.slice(0, 8).forEach(function (pr) {
        html += '<div class="wt-row"><div><div class="rtitle" style="font-size:13.5px">' + esc(pr.name) + '</div>' +
          '<div class="wt-date">' + fullDate(pr.ts) + '</div></div>' +
          '<div class="wt-val num">' + round1(pr.weight) + '<span class="u"> ' + u + ' × ' + pr.reps + '</span></div></div>';
      });
      html += '</div></div>';
    }

    html += '</div>';
    return html;
  }

  function kpi(label, val, u, sub) {
    return '<div class="kpi"><div class="klabel">' + label + '</div>' +
      '<div class="kval num">' + val + (u ? '<span class="kunit"> ' + u + '</span>' : '') + '</div>' +
      '<div class="ksub">' + sub + '</div></div>';
  }
  function fmtBig(n) {
    n = Math.round(n);
    if (n >= 1000) return (Math.round(n / 100) / 10).toString().replace(/\.0$/, '') + 'k';
    return '' + n;
  }
  function computePRs(logs, u) {
    var best = {};
    logs.forEach(function (l) {
      l.exercises.forEach(function (ex) {
        ex.sets.forEach(function (st) {
          if (st.weight === '' || st.weight == null || st.reps === '' || st.reps == null) return;
          var w = convW(parseFloat(st.weight), l.unit || u, u);
          if (isNaN(w)) return;
          if (!best[ex.name] || w > best[ex.name].weight) best[ex.name] = { name: ex.name, weight: w, reps: st.reps, ts: l.startedAt };
        });
      });
    });
    return Object.keys(best).map(function (k) { return best[k]; }).sort(function (a, b) { return b.weight - a.weight; });
  }
  function lineChart(vals) {
    var W = 320, H = 130, pad = 8;
    var min = Math.min.apply(null, vals), max = Math.max.apply(null, vals);
    if (max === min) { max += 1; min -= 1; }
    var n = vals.length;
    function x(i) { return pad + (i / (n - 1)) * (W - pad * 2); }
    function y(v) { return pad + (1 - (v - min) / (max - min)) * (H - pad * 2); }
    var line = vals.map(function (v, i) { return (i ? 'L' : 'M') + round1(x(i)) + ' ' + round1(y(v)); }).join(' ');
    var area = line + ' L' + x(n - 1) + ' ' + (H - pad) + ' L' + x(0) + ' ' + (H - pad) + ' Z';
    var dots = vals.map(function (v, i) { return '<circle class="lc-dot" cx="' + round1(x(i)) + '" cy="' + round1(y(v)) + '" r="2.5"/>'; }).join('');
    return '<svg class="linechart" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none">' +
      '<defs><linearGradient id="lcgrad" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#e7c987" stop-opacity=".35"/><stop offset="1" stop-color="#e7c987" stop-opacity="0"/></linearGradient></defs>' +
      '<path class="lc-area" d="' + area + '"/><path class="lc-line" d="' + line + '"/>' + dots + '</svg>';
  }

  function filterByPeriod(asc, period) {
    if (period === 'all') return asc;
    if (period === 'range' && state.trackRange) {
      return asc.filter(function (e) { return e.ts >= state.trackRange.from && e.ts <= state.trackRange.to; });
    }
    var days = period === 'week' ? 7 : period === '3month' ? 93 : 31; // default month
    var cut = Date.now() - days * 864e5;
    return asc.filter(function (e) { return e.ts >= cut; });
  }
  // Names of exercises that appear in the logs (for the tracker picker).
  function trackedExercises() {
    var seen = {}, order = [];
    S.getLogs().forEach(function (l) {
      l.exercises.forEach(function (e) { if (!seen[e.name]) { seen[e.name] = 1; order.push(e.name); } });
    });
    return order.sort();
  }
  // Logged exercises grouped by their category, for the metric picker.
  function trackedByCat() {
    var map = {}, seen = {};
    S.getLogs().forEach(function (l) {
      l.exercises.forEach(function (e) {
        var cat = e.category || 'Lainnya', k = cat + '|' + e.name;
        if (!seen[k]) { seen[k] = 1; (map[cat] = map[cat] || []).push(e.name); }
      });
    });
    Object.keys(map).forEach(function (c) { map[c].sort(); });
    return map;
  }
  function metricLabelOf(metric) {
    if (metric === 'bodyweight') return 'Berat badan';
    if (metric === 'bodyfat') return 'Lemak tubuh';
    if (metric.indexOf('meas:') === 0) return measLabel(metric.slice(5));
    if (metric.indexOf('ex:') === 0) return metric.slice(3);
    return metric;
  }
  // Body-fat series from daily check-ins.
  function bodyfatSeries() {
    return S.getCheckins().filter(function (c) { return c.bodyfat != null && c.bodyfat !== ''; })
      .map(function (c) { return { ts: c.ts, bodyfat: parseFloat(c.bodyfat) }; })
      .sort(function (a, b) { return a.ts - b.ts; });
  }
  // Measurement keys that have at least one recorded value, in canonical order.
  function measurementKeysUsed() {
    var seen = {};
    S.getCheckins().forEach(function (c) { if (c.measurements) Object.keys(c.measurements).forEach(function (k) { seen[k] = 1; }); });
    return MEASUREMENTS.filter(function (m) { return seen[m.key]; });
  }
  function measurementSeries(key) {
    return S.getCheckins().filter(function (c) { return c.measurements && c.measurements[key] != null; })
      .map(function (c) { return { ts: c.ts, value: c.measurements[key] }; })
      .sort(function (a, b) { return a.ts - b.ts; });
  }
  // Per-session top set for one exercise: heaviest weight (converted) + its reps.
  function exerciseSeries(name) {
    var u = unit();
    var logs = S.getLogs().slice().sort(function (a, b) { return a.startedAt - b.startedAt; });
    var out = [];
    logs.forEach(function (l) {
      var ex = l.exercises.find(function (e) { return e.name === name; });
      if (!ex) return;
      var best = null;
      ex.sets.forEach(function (s) {
        if (s.weight === '' || s.weight == null) return;
        var w = convW(parseFloat(s.weight), l.unit || u, u);
        if (isNaN(w)) return;
        if (!best || w > best.weight) best = { weight: w, reps: parseFloat(s.reps) || 0 };
      });
      if (best) out.push({ ts: l.startedAt, weight: round1(best.weight), reps: best.reps });
    });
    return out;
  }
  // A titled mini line chart with latest value + min/max + date axis.
  function metricChart(pts, valueKey, unitLabel, title) {
    var vals = pts.map(function (p) { return p[valueKey]; });
    var min = Math.min.apply(null, vals), max = Math.max.apply(null, vals);
    return '<div class="wt-chart">' +
      '<div class="wt-chart-top"><div><div class="wt-chart-lbl">' + title + ' · terkini</div>' +
      '<div class="wt-chart-val num">' + round1(vals[vals.length - 1]) + '<span class="u"> ' + unitLabel + '</span></div></div>' +
      '<div class="wt-chart-mm">Min <span class="num">' + round1(min) + '</span> · Max <span class="num">' + round1(max) + '</span></div></div>' +
      lineChart(vals) +
      '<div class="wt-axis"><span>' + shortDate(pts[0].ts) + '</span><span>' + pts.length + ' sesi</span><span>' + shortDate(pts[pts.length - 1].ts) + '</span></div>' +
      '</div>';
  }

  // ------------------------------------------------------------- TRACKER -----
  function renderTracker() {
    var u = unit();
    var metric = state.trackMetric;
    var period = state.trackPeriod;
    var exNames = trackedExercises();

    // metric picker — body metrics are always listed (so every measurable is
    // discoverable/trackable); exercises appear once you've logged them.
    var opts = '<optgroup label="Tubuh"><option value="bodyweight"' + (metric === 'bodyweight' ? ' selected' : '') + '>Berat badan</option>' +
      '<option value="bodyfat"' + (metric === 'bodyfat' ? ' selected' : '') + '>Lemak tubuh</option></optgroup>';
    opts += '<optgroup label="Ukuran tubuh (lingkar)">' + MEASUREMENTS.map(function (m) {
      return '<option value="meas:' + m.key + '"' + (metric === 'meas:' + m.key ? ' selected' : '') + '>' + esc(m.label) + '</option>';
    }).join('') + '</optgroup>';
    if (exNames.length) {
      opts += '<optgroup label="Latihan">' + exNames.map(function (n) {
        return '<option value="ex:' + esc(n) + '"' + (metric === 'ex:' + n ? ' selected' : '') + '>' + esc(n) + '</option>';
      }).join('') + '</optgroup>';
    }

    var periodChips = [['week', 'Minggu'], ['month', 'Bulan'], ['3month', '3 Bulan'], ['all', 'Semua']]
      .map(function (x) { return '<button class="chip' + (period === x[0] ? ' active' : '') + '" data-act="track-period" data-p="' + x[0] + '">' + x[1] + '</button>'; }).join('') +
      '<button class="chip' + (period === 'range' ? ' active' : '') + '" data-act="track-range-open">' + (period === 'range' && state.trackRange ? shortDate(state.trackRange.from) + '–' + shortDate(state.trackRange.to) : 'Rentang…') + '</button>';

    // chart area (top)
    var chart = '';
    if (metric === 'bodyweight') {
      var asc = S.getWeight().slice().sort(function (a, b) { return a.ts - b.ts; });
      var pts = filterByPeriod(asc, period).map(function (e) { return { ts: e.ts, weight: round1(convW(parseFloat(e.value), e.unit, u)) }; });
      chart = pts.length >= 2
        ? metricChart(pts, 'weight', u, 'Berat badan')
        : emptyChartMsg(asc.length, 'Tambah check-in dengan berat di tab Profile.');
    } else if (metric === 'bodyfat') {
      var bf = filterByPeriod(bodyfatSeries(), period);
      chart = bf.length >= 2
        ? metricChart(bf, 'bodyfat', '%', 'Lemak tubuh')
        : emptyChartMsg(bodyfatSeries().length, 'Catat lemak tubuh di check-in minimal 2 kali.');
    } else if (metric.indexOf('meas:') === 0) {
      var mkey = metric.slice(5);
      var ms = filterByPeriod(measurementSeries(mkey), period);
      chart = ms.length >= 2
        ? metricChart(ms, 'value', 'cm', measLabel(mkey))
        : emptyChartMsg(measurementSeries(mkey).length, 'Catat ukuran ' + measLabel(mkey).toLowerCase() + ' di check-in minimal 2 kali.');
    } else {
      var name = metric.slice(3);
      var series = filterByPeriod(exerciseSeries(name), period);
      if (series.length >= 2) {
        chart = metricChart(series, 'weight', u, 'Berat (' + esc(name) + ')') +
          '<div class="spacer"></div>' + metricChart(series, 'reps', 'reps', 'Reps');
      } else {
        chart = emptyChartMsg(exerciseSeries(name).length, 'Catat latihan ini minimal 2 sesi untuk melihat tren.');
      }
    }

    return '<div class="card" id="tracker-card"><div class="section-label" style="margin:0 0 8px">Tracker</div>' +
      '<div class="tracker-chart" style="min-height:230px">' + chart + '</div>' +
      '<div class="chips" style="padding:12px 0 4px">' + periodChips + '</div>' +
      '<div class="field" style="margin-top:4px"><label>Lacak</label>' +
      '<button class="metric-btn" data-act="open-metric" style="width:100%;height:48px;border:1px solid var(--border);border-radius:13px;padding:0 14px;background:var(--card);color:var(--ink);font:500 15px/1 \'Hanken Grotesk\';display:flex;align-items:center;justify-content:space-between;gap:10px;cursor:pointer;text-align:left">' +
      '<span>' + esc(metricLabelOf(metric)) + '</span>' +
      '<span style="color:var(--gold);background:var(--ink);width:24px;height:24px;border-radius:7px;display:grid;place-items:center;flex-shrink:0"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg></span>' +
      '</button></div>' +
      '</div>';
  }
  function emptyChartMsg(has, hint) {
    return '<div class="muted-line" style="padding:14px 0">' + (has ? 'Belum cukup data di periode ini — pilih periode lebih panjang.' : hint) + '</div>';
  }
  // Re-render only the tracker card (metric/period changes) so the page doesn't
  // rebuild/scroll-jump. The chart area keeps a fixed min-height so switching
  // metrics doesn't resize the page. Falls back to a full render if not on stats.
  function updateTracker() {
    var el = document.getElementById('tracker-card');
    if (el) { el.outerHTML = renderTracker(); } else { render(); }
  }

  // ------------------------------------------------------------- PROFILE -----
  function renderProfile() {
    var p = S.getProfile();
    var u = unit();
    var weight = S.getWeight().slice().sort(function (a, b) { return b.ts - a.ts; });
    var latest = weight[0];
    var initials = (p.name || 'S A').split(' ').map(function (w) { return w[0]; }).slice(0, 2).join('').toUpperCase() || 'SA';

    var html = '<div class="screen">';
    html += '<div class="profile-hero"><div class="pavatar num">' + esc(initials) + '</div>' +
      '<div><div class="pname">' + esc(p.name || 'Your name') + '</div>' +
      '<div class="pmeta">' + [
        p.gender ? esc(p.gender) : null,
        p.height ? '<span class="num">' + esc(p.height) + '</span> ' + esc(p.heightUnit || 'cm') : null,
        latest ? '<span class="num">' + round1(convW(parseFloat(latest.value), latest.unit, u)) + '</span> ' + u : null
      ].filter(Boolean).join(' · ') + '</div></div></div>';

    // daily check-in (weight, body fat, notes, photos) — charts live in Tracker
    var checkins = S.getCheckins().slice().sort(function (a, b) { return b.ts - a.ts; });
    html += '<div class="section-label">Daily check-in</div>';
    html += '<div class="card tight"><div class="card-head"><span class="eyebrow">Weight · body fat · foto</span>' +
      '<button class="link" data-act="add-checkin">+ Check-in</button></div>';
    html += '<div style="padding:6px 16px 12px">';
    if (!checkins.length) {
      html += '<div class="muted-line" style="padding:8px 0 12px">Belum ada check-in. Tap "+ Check-in" untuk catat berat, lemak tubuh, foto progres, dan catatan harianmu. Grafiknya muncul di Statistik → Tracker.</div>';
    } else {
      checkins.slice(0, 15).forEach(function (c, idx) {
        var val = convW(parseFloat(c.weight), c.weightUnit || u, u);
        var prev = checkins[idx + 1];
        var deltaHtml = '';
        if (prev && prev.weight != null && prev.weight !== '') {
          var pv = convW(parseFloat(prev.weight), prev.weightUnit || u, u);
          var d = round1(val - pv);
          var cls = d > 0 ? 'up' : (d < 0 ? 'down' : 'flat');
          deltaHtml = '<span class="wt-delta ' + cls + ' num">' + (d > 0 ? '+' : '') + d + '</span>';
        }
        var meta = [fullDate(c.ts)];
        if (c.bodyfat != null && c.bodyfat !== '') meta.push('<span class="num">' + c.bodyfat + '</span>% lemak');
        var mc = c.measurements ? Object.keys(c.measurements).length : 0;
        if (mc) meta.push('<span class="num">' + mc + '</span> ukuran');
        if (c.photos && c.photos.length) meta.push('<span class="num">' + c.photos.length + '</span> foto');
        html += '<div class="wt-row tap" data-act="open-checkin" data-id="' + c.id + '">' +
          '<div class="grow" style="min-width:0"><div class="wt-date">' + meta.join(' · ') + '</div>' +
          (c.notes ? '<div class="ci-note-snip">' + esc(c.notes) + '</div>' : '') + '</div>' +
          '<div style="display:flex;align-items:center;gap:10px">' + deltaHtml +
          (c.weight != null && c.weight !== '' ? '<span class="wt-val num">' + round1(val) + '<span class="u"> ' + u + '</span></span>' : '') +
          '<span class="chev" style="color:var(--hint)">' + svg('chevRight', 18) + '</span></div></div>';
      });
    }
    html += '</div></div>';

    // menu
    html += '<div class="section-label">Manage</div><div class="menu-list">';
    html += menuItem('profile', 'edit-profile', 'Personal details', 'Name, height, gender, address');
    html += menuItem('dumbbell', 'open-library', 'Exercise library', 'Categories & exercises, add your own');
    html += menuItem('settings', 'open-settings', 'Units & data', (u === 'kg' ? 'Kilograms' : 'Pounds') + ' · export / import');
    var acc = getAuth();
    html += menuItem('chat', 'open-feedback', 'Feedback & suggestions', 'Tell the Sterith team what you think');
    html += menuItem('logout', 'logout', 'Sign out', acc ? acc.email : 'End this session');
    html += '</div>';

    html += '<div class="brand-lockup"><img src="assets/logo-dark.png" alt="Sterith Health"></div>';
    html += '<div class="muted-line" style="text-align:center;margin-top:2px;font-size:11.5px">Sterith Workout · data stays on this device</div>';
    html += '</div>';
    return html;
  }
  function menuItem(icon, act, title, sub) {
    return '<div class="menu-item" data-act="' + act + '"><div class="mi-ic">' + svg(icon) + '</div>' +
      '<div><div class="mi-title">' + esc(title) + '</div><div class="mi-sub">' + esc(sub) + '</div></div>' +
      '<span class="chev">' + svg('chevRight', 18) + '</span></div>';
  }

  // ============================================================ SESSION ======
  // Find the most recent past performance of an exercise (for the "silhouette").
  function lastPerformance(name) {
    var logs = S.getLogs().slice().sort(function (a, b) { return b.startedAt - a.startedAt; });
    for (var i = 0; i < logs.length; i++) {
      var ex = logs[i].exercises.find(function (e) { return e.name === name; });
      if (ex && ex.sets && ex.sets.length) {
        return { ts: logs[i].startedAt, unit: logs[i].unit || unit(), sets: ex.sets.map(function (s) { return { weight: s.weight, reps: s.reps }; }) };
      }
    }
    return null;
  }
  // Placeholder (ghost) values for a given set index, from last performance.
  function ghostFor(lp, si) {
    if (!lp || !lp.sets.length) return { w: '0', r: '0' };
    var s = lp.sets[si] || lp.sets[lp.sets.length - 1];
    var w = s.weight;
    if (w !== '' && w != null && lp.unit && lp.unit !== unit()) w = round1(convW(parseFloat(w), lp.unit, unit()));
    return { w: (w === '' || w == null) ? '0' : String(w), r: (s.reps === '' || s.reps == null) ? '0' : String(s.reps) };
  }
  // Build a session exercise, pre-sizing its set count to match last time.
  function sessionExercise(e) {
    var lp = lastPerformance(e.name);
    var n = lp && lp.sets.length ? lp.sets.length : 1;
    var sets = []; for (var i = 0; i < n; i++) sets.push(blankSet());
    return { id: S.uid(), exId: e.exId || null, name: e.name, category: e.category, categoryType: e.categoryType || 'strength', note: '', sets: sets };
  }
  function newSession(name, exercises) {
    return {
      id: S.uid(), startedAt: Date.now(), name: name || 'Workout',
      unit: unit(),
      exercises: (exercises || []).map(sessionExercise)
    };
  }
  function blankSet(type) { return { weight: '', reps: '', done: false }; }
  function saveSession() { S.saveDraft(state.session); }

  function renderSession() {
    var s = state.session;
    var html = '<div class="screen">';
    html += '<div class="session-timer"><div><div class="st-label">Elapsed</div>' +
      '<div class="st-time num" id="sess-clock">' + mmss((Date.now() - s.startedAt) / 1000) + '</div>' +
      '<div class="st-sub">' + s.exercises.length + ' exercise' + (s.exercises.length === 1 ? '' : 's') + ' · started ' + clockStr(s.startedAt) + '</div></div>' +
      '<button class="finish" data-act="finish-session">Finish</button></div>';

    // editable name
    html += '<div class="field"><input class="input" data-act="noop" id="sess-name" value="' + esc(s.name) + '" placeholder="Workout name" oninput="0"></div>';

    s.exercises.forEach(function (ex, ei) {
      var lp = lastPerformance(ex.name);
      var lastEi = s.exercises.length - 1;
      html += '<div class="ex-block">' +
        '<div class="exb-head"><div><div class="name">' + esc(ex.name) + '</div>' +
        '<div class="cat">' + esc(ex.category || '') + (lp ? ' · <span style="color:var(--muted2)">terakhir ' + shortDate(lp.ts) + '</span>' : '') + '</div></div>' +
        '<div class="ex-tools">' +
        '<button class="kebab" data-act="move-ex-up" data-ei="' + ei + '"' + (ei === 0 ? ' disabled' : '') + ' aria-label="Naikkan">' + svg('up', 18) + '</button>' +
        '<button class="kebab" data-act="move-ex-down" data-ei="' + ei + '"' + (ei === lastEi ? ' disabled' : '') + ' aria-label="Turunkan">' + svg('down', 18) + '</button>' +
        '<button class="kebab" data-act="replace-exercise" data-ei="' + ei + '" aria-label="Ganti">' + svg('swap', 18) + '</button>' +
        '<button class="kebab" data-act="rm-exercise" data-ei="' + ei + '" aria-label="Hapus">' + svg('trash', 18) + '</button>' +
        '</div></div>';
      html += '<div class="set-table"><div class="set-head"><span>Set</span><span>' + (unit()) + '</span><span>Reps</span><span></span></div>';
      ex.sets.forEach(function (st, si) {
        var g = ghostFor(lp, si);
        html += '<div class="set-line">' +
          '<div class="setno num">' + (si + 1) + '</div>' +
          '<input class="num" inputmode="decimal" data-act="noop" data-set="weight" data-ei="' + ei + '" data-si="' + si + '" value="' + esc(st.weight) + '" placeholder="' + esc(g.w) + '">' +
          '<input class="num" inputmode="numeric" data-act="noop" data-set="reps" data-ei="' + ei + '" data-si="' + si + '" value="' + esc(st.reps) + '" placeholder="' + esc(g.r) + '">' +
          '<button class="done' + (st.done ? ' on' : '') + '" data-act="toggle-set" data-ei="' + ei + '" data-si="' + si + '">' + svg('check', 16) + '</button>' +
          '</div>';
      });
      html += '</div>';
      html += '<div class="exb-foot"><button data-act="add-set" data-ei="' + ei + '">+ Add set</button>' +
        '<button data-act="rm-set" data-ei="' + ei + '">&minus; Remove set</button></div>';
      html += '<div class="ex-note"><textarea data-act="noop" data-note="' + ei + '" placeholder="Notes — how did this feel?">' + esc(ex.note) + '</textarea></div>';
      html += '</div>';
    });

    html += '<div class="spacer"></div><button class="btn btn-secondary btn-block btn-lg" data-act="add-exercise-session">' + svg('plus', 18) + ' Add exercise</button>';
    html += '<div class="spacer"></div><div class="spacer"></div></div>';
    return html;
  }

  // session input handling (delegated)
  view.addEventListener('input', function (e) {
    var el = e.target;
    if (!state.session) {
      return;
    }
    if (el.id === 'sess-name') { state.session.name = el.value; saveSession(); return; }
    if (el.dataset.set) {
      var ex = state.session.exercises[+el.dataset.ei];
      ex.sets[+el.dataset.si][el.dataset.set] = el.value;
      saveSession();
    } else if (el.dataset.note != null) {
      state.session.exercises[+el.dataset.note].note = el.value;
      saveSession();
    }
  });

  on('add-set', function (t) {
    var ex = state.session.exercises[+t.dataset.ei];
    var last = ex.sets[ex.sets.length - 1] || {};
    ex.sets.push({ weight: last.weight || '', reps: last.reps || '', done: false });
    saveSession(); render();
  });
  on('rm-set', function (t) {
    var ex = state.session.exercises[+t.dataset.ei];
    if (ex.sets.length > 1) { ex.sets.pop(); saveSession(); render(); }
  });
  on('toggle-set', function (t) {
    var st = state.session.exercises[+t.dataset.ei].sets[+t.dataset.si];
    st.done = !st.done; saveSession();
    t.classList.toggle('on', st.done);
  });
  on('rm-exercise', function (t) {
    if (!confirm('Remove this exercise from the workout?')) return;
    state.session.exercises.splice(+t.dataset.ei, 1); saveSession(); render();
  });
  function moveExercise(ei, dir) {
    var arr = state.session.exercises, j = ei + dir;
    if (j < 0 || j >= arr.length) return;
    var tmp = arr[ei]; arr[ei] = arr[j]; arr[j] = tmp;
    saveSession(); render();
  }
  on('move-ex-up', function (t) { moveExercise(+t.dataset.ei, -1); });
  on('move-ex-down', function (t) { moveExercise(+t.dataset.ei, 1); });
  on('replace-exercise', function (t) {
    var ei = +t.dataset.ei;
    openPicker(true, function (chosen) {
      var e = chosen[0];
      if (e) {
        var repl = sessionExercise(e);
        var old = state.session.exercises[ei];
        // keep however many set rows the user had already built
        if (old && old.sets && old.sets.length > repl.sets.length) {
          while (repl.sets.length < old.sets.length) repl.sets.push(blankSet());
        }
        state.session.exercises[ei] = repl;
        saveSession();
      }
      closeSheet(); render();
    }, { single: true, title: 'Ganti latihan', confirmLabel: 'Ganti' });
  });
  on('add-exercise-session', function () { openPicker(true); });
  on('discard-session', function () {
    if (!confirm('Discard this workout? Nothing will be saved.')) return;
    state.session = null; S.clearDraft(); render();
  });
  on('finish-session', function () {
    var s = state.session;
    // drop fully-empty exercises/sets
    s.exercises.forEach(function (ex) {
      ex.sets = ex.sets.filter(function (st) { return st.weight !== '' || st.reps !== '' || st.done; });
      if (!ex.sets.length) ex.sets = [blankSet()];
    });
    var hasData = s.exercises.some(function (ex) { return ex.sets.some(function (st) { return st.weight !== '' || st.reps !== ''; }); });
    if (!hasData && !confirm('No sets recorded. Save this workout anyway?')) return;
    s.finishedAt = Date.now();
    s.durationSec = Math.round((s.finishedAt - s.startedAt) / 1000);
    var logs = S.getLogs(); logs.push(s); S.saveLogs(logs);
    state.session = null; S.clearDraft();
    state.tab = 'log'; render();
    toast('Workout saved');
  });

  function startSessionTimer() {
    stopSessionTimer();
    state._sessionTimer = setInterval(function () {
      if (!state.session) return stopSessionTimer();
      var el = document.getElementById('sess-clock');
      if (el) el.textContent = mmss((Date.now() - state.session.startedAt) / 1000);
    }, 1000);
  }
  function stopSessionTimer() { if (state._sessionTimer) { clearInterval(state._sessionTimer); state._sessionTimer = null; } }

  // ---- start flows ----
  on('start-empty', function () { closeSheet(); state.session = newSession('Workout', []); saveSession(); state.tab = 'log'; render(); openPicker(true); });
  on('start-from-routine', function (t) {
    var r = S.getRoutines().find(function (x) { return x.id === t.dataset.id; });
    if (!r) return;
    closeSheet();
    state.session = newSession(r.name, r.exercises.map(function (e) { return { exId: e.exId, name: e.name, category: e.category, categoryType: e.categoryType }; }));
    saveSession(); state.tab = 'log'; render();
  });

  // FAB
  function updateFab() {
    var slot = document.getElementById('fab-slot');
    if (state.session && state.tab === 'log') { slot.innerHTML = ''; return; }
    if (state.tab === 'log') slot.innerHTML = '<button class="fab" data-act="fab-log" title="New workout">' + svg('plus', 26) + '</button>';
    else if (state.tab === 'routines') slot.innerHTML = '<button class="fab" data-act="new-routine" title="New routine">' + svg('plus', 26) + '</button>';
    else slot.innerHTML = '';
  }
  on('fab-log', function () {
    var routines = S.getRoutines();
    var html = '<div class="sheet-head"><div><div class="eyebrow">New session</div><h2>Start a workout</h2></div>' +
      '<button class="close" data-act="close-sheet">' + svg('close') + '</button></div>' +
      '<div class="sheet-body">' +
      '<button class="btn btn-primary btn-block btn-lg" data-act="start-empty">' + svg('play', 18) + ' Empty workout</button>';
    if (routines.length) {
      html += '<div class="section-label" style="margin-top:20px">From a routine</div><div class="list" style="margin-top:10px">';
      routines.forEach(function (r) {
        html += '<div class="row tap" data-act="start-from-routine" data-id="' + r.id + '" style="cursor:pointer">' +
          '<div class="avatar num">' + esc((r.name || '?').slice(0, 2)) + '</div>' +
          '<div class="grow"><div class="rtitle">' + esc(r.name) + '</div><div class="rmeta">' + r.exercises.length + ' exercises</div></div>' +
          '<span class="chev" style="color:var(--hint)">' + svg('chevRight', 18) + '</span></div>';
      });
      html += '</div>';
    } else {
      html += '<div class="muted-line" style="margin-top:16px">Tip: create routines in the Routines tab to start faster next time.</div>';
    }
    html += '</div>';
    openSheet(html);
  });

  // ============================================================ SHEETS =======
  function openSheet(inner, center) {
    sheetSlot.innerHTML = '<div class="backdrop" data-act="backdrop"><div class="sheet' + (center ? ' center' : '') + '">' + inner + '</div></div>';
  }
  function closeSheet() { sheetSlot.innerHTML = ''; }
  on('close-sheet', closeSheet);
  on('backdrop', function (t, e) { if (e.target.classList.contains('backdrop')) closeSheet(); });
  on('noop', function () {});

  // ---- Exercise picker (choose exercises for session or routine) ----
  function openPicker(forSession, onDone, opts) {
    opts = opts || {};
    state.picker = { open: true, selected: {}, forSession: forSession, filter: 'all', search: '', onDone: onDone,
      single: !!opts.single, title: opts.title, confirmLabel: opts.confirmLabel };
    renderPicker();
  }
  // Just the filtered/searched rows — split out so category + search can swap ONLY
  // this list in place (no full-sheet rebuild = no flash/scroll jump).
  function pickRowsHTML(lib, pk) {
    var rows = '';
    lib.forEach(function (cat) {
      if (pk.filter !== 'all' && pk.filter !== cat.id) return;
      cat.exercises.forEach(function (ex) {
        if (pk.search && ex.name.toLowerCase().indexOf(pk.search.toLowerCase()) === -1) return;
        var sel = !!pk.selected[ex.id];
        rows += '<div class="pick' + (sel ? ' sel' : '') + '" data-act="pick-toggle" data-id="' + ex.id + '" data-name="' + esc(ex.name) + '" data-cat="' + esc(cat.name) + '" data-type="' + esc(cat.type) + '">' +
          '<div class="pcheck">' + svg('check', 15) + '</div>' +
          '<div class="pname">' + esc(ex.name) + '</div><div class="pcat">' + esc(cat.name) + '</div></div>';
      });
    });
    if (!rows) rows = '<div class="muted-line" style="padding:20px 0;text-align:center">No exercises found.</div>';
    return rows;
  }
  function renderPicker() {
    var lib = S.getLibrary();
    var pk = state.picker;
    var cats = [{ id: 'all', name: 'All' }].concat(lib.map(function (c) { return { id: c.id, name: c.name }; }));
    var chips = cats.map(function (c) {
      return '<button class="chip' + (pk.filter === c.id ? ' active' : '') + '" data-act="pick-filter" data-id="' + c.id + '">' + esc(c.name) + '</button>';
    }).join('');
    var rows = '<div id="pick-list">' + pickRowsHTML(lib, pk) + '</div>';

    var count = Object.keys(pk.selected).length;
    var confirmLabel = pk.confirmLabel
      ? esc(pk.confirmLabel)
      : 'Add ' + (count ? count + ' ' : '') + 'exercise' + (count === 1 ? '' : 's');
    var html = '<div class="sheet-head"><div><div class="eyebrow">Exercise library</div><h2>' + esc(pk.title || 'Add exercises') + '</h2></div>' +
      '<button class="close" data-act="close-picker">' + svg('close') + '</button></div>' +
      '<div class="sheet-body">' +
      '<input class="input" id="pick-search" placeholder="Search exercises…" data-act="noop" value="' + esc(pk.search) + '">' +
      '<div class="chips">' + chips + '</div>' +
      rows +
      '<div class="spacer"></div><button class="btn btn-gold btn-block" data-act="quick-add-exercise">' + svg('plus', 16) + ' New exercise / category</button>' +
      '</div>' +
      '<div class="sheet-foot"><button class="btn btn-secondary" data-act="close-picker">Cancel</button>' +
      '<button class="btn btn-primary" data-act="pick-confirm">' + confirmLabel + ' <span class="arrow">&rarr;</span></button></div>';
    openSheet(html);
    var si = document.getElementById('pick-search');
    if (si) si.addEventListener('input', function () { state.picker.search = si.value; refreshPickerRows(); });
  }
  function refreshPickerRows() {
    // Swap ONLY the list, so the search input keeps focus and the sheet doesn't jump.
    var listEl = document.getElementById('pick-list');
    if (!listEl) { renderPicker(); return; }
    listEl.innerHTML = pickRowsHTML(S.getLibrary(), state.picker);
  }
  // ---- Metric picker (Statistics → Tracker "Lacak") — on-brand sheet ----
  function openMetricPicker() {
    var cat = 'body';
    if (state.trackMetric.indexOf('ex:') === 0) {
      var nm = state.trackMetric.slice(3), byc = trackedByCat();
      Object.keys(byc).forEach(function (c) { if (byc[c].indexOf(nm) !== -1) cat = c; });
    }
    state.mpick = { cat: cat };
    renderMetricPicker();
  }
  // Rows for one picker category (Body Stat lists body metrics + all measurements).
  function mpickRowsHtml(cur) {
    var byc = trackedByCat();
    function row(value, name, sub) {
      var sel = state.trackMetric === value;
      return '<div class="pick' + (sel ? ' sel' : '') + '" data-act="mpick-choose" data-value="' + esc(value) + '">' +
        '<div class="pcheck">' + svg('check', 15) + '</div>' +
        '<div class="pname">' + esc(name) + '</div><div class="pcat">' + esc(sub) + '</div></div>';
    }
    var rows = '';
    if (cur === 'body') {
      rows += row('bodyweight', 'Berat badan', 'Tubuh');
      rows += row('bodyfat', 'Lemak tubuh', 'Tubuh');
      MEASUREMENTS.forEach(function (m) { rows += row('meas:' + m.key, m.label, 'Ukuran'); });
    } else {
      (byc[cur] || []).forEach(function (nm) { rows += row('ex:' + nm, nm, cur); });
    }
    if (!rows) rows = '<div class="muted-line" style="padding:20px 0;text-align:center">Belum ada data. Catat latihan dulu.</div>';
    return rows;
  }
  // Height (px) of the tallest category, so switching categories never resizes.
  function mpickRowsMinHeight() {
    var byc = trackedByCat();
    var maxRows = 2 + MEASUREMENTS.length;   // Body Stat is normally the tallest
    Object.keys(byc).forEach(function (c) { if ((byc[c] || []).length > maxRows) maxRows = (byc[c] || []).length; });
    return maxRows * 49;   // ~49px per .pick row
  }
  function renderMetricPicker() {
    var byc = trackedByCat();
    var exCats = Object.keys(byc).sort();
    var cur = state.mpick.cat;
    var cats = [{ id: 'body', name: 'Body Stat' }].concat(exCats.map(function (c) { return { id: c, name: c }; }));
    var chips = cats.map(function (c) {
      return '<button class="chip' + (cur === c.id ? ' active' : '') + '" data-act="mpick-cat" data-id="' + esc(c.id) + '">' + esc(c.name) + '</button>';
    }).join('');
    var html = '<div class="sheet-head"><div><div class="eyebrow">Statistik · Tracker</div><h2>Pilih yang dilacak</h2></div>' +
      '<button class="close" data-act="close-sheet">' + svg('close') + '</button></div>' +
      '<div class="sheet-body"><div class="chips">' + chips + '</div>' +
      '<div id="mpick-rows" style="min-height:' + mpickRowsMinHeight() + 'px">' + mpickRowsHtml(cur) + '</div></div>';
    openSheet(html);
  }
  on('open-metric', function () { openMetricPicker(); });
  // Switch category in place — swap only the rows + active chip, no sheet re-open.
  on('mpick-cat', function (t) {
    state.mpick.cat = t.dataset.id;
    var rowsEl = document.getElementById('mpick-rows');
    if (!rowsEl) { renderMetricPicker(); return; }
    rowsEl.innerHTML = mpickRowsHtml(state.mpick.cat);
    var chips = document.querySelectorAll('[data-act="mpick-cat"]');
    for (var i = 0; i < chips.length; i++) chips[i].classList.toggle('active', chips[i].dataset.id === state.mpick.cat);
  });
  on('mpick-choose', function (t) { state.trackMetric = t.dataset.value; closeSheet(); updateTracker(); });

  on('close-picker', function () { state.picker.open = false; closeSheet(); });
  on('pick-filter', function (t) {
    var filter = t.dataset.id;
    if (filter === state.picker.filter) return;
    state.picker.filter = filter;
    var listEl = document.getElementById('pick-list');
    if (!listEl) { renderPicker(); return; }
    var chipEls = sheetSlot.querySelectorAll('.chips .chip[data-act="pick-filter"]');
    for (var i = 0; i < chipEls.length; i++) chipEls[i].classList.toggle('active', chipEls[i].dataset.id === filter);
    listEl.innerHTML = pickRowsHTML(S.getLibrary(), state.picker);
    listEl.style.transition = 'none'; listEl.style.opacity = '0'; listEl.style.transform = 'translateY(4px)';
    void listEl.offsetHeight;   // reflow so the fade-in animates
    listEl.style.transition = 'opacity .18s ease, transform .18s ease'; listEl.style.opacity = '1'; listEl.style.transform = 'none';
  });
  on('pick-toggle', function (t) {
    var id = t.dataset.id, pk = state.picker;
    var wasSel = !!pk.selected[id];
    if (pk.single) {
      // single-select (replace): only one exercise at a time
      pk.selected = {};
      var rows = sheetSlot.querySelectorAll('.pick.sel');
      for (var i = 0; i < rows.length; i++) rows[i].classList.remove('sel');
      if (!wasSel) { pk.selected[id] = { exId: id, name: t.dataset.name, category: t.dataset.cat, categoryType: t.dataset.type }; t.classList.add('sel'); }
    } else {
      if (wasSel) delete pk.selected[id];
      else pk.selected[id] = { exId: id, name: t.dataset.name, category: t.dataset.cat, categoryType: t.dataset.type };
      t.classList.toggle('sel');
    }
    // update footer count without full rerender (keep custom label for single mode)
    var btn = sheetSlot.querySelector('[data-act="pick-confirm"]');
    var count = Object.keys(pk.selected).length;
    if (btn && !pk.confirmLabel) btn.innerHTML = 'Add ' + (count ? count + ' ' : '') + 'exercise' + (count === 1 ? '' : 's') + ' <span class="arrow">&rarr;</span>';
  });
  on('pick-confirm', function () {
    var pk = state.picker;
    var chosen = Object.keys(pk.selected).map(function (k) { return pk.selected[k]; });
    if (!chosen.length) { toast('Select at least one exercise'); return; }
    state.picker.open = false;
    if (pk.onDone) {
      // onDone is responsible for rendering the next sheet (e.g. routine editor)
      pk.onDone(chosen);
      return;
    }
    if (state.session) {
      chosen.forEach(function (e) { state.session.exercises.push(sessionExercise(e)); });
      saveSession();
    }
    closeSheet();
    if (state.session) render();
  });
  on('quick-add-exercise', function () { openAddExercise(function () { renderPicker(); }); });

  // ---- Add / edit exercise & category ----
  function openAddExercise(after) {
    var lib = S.getLibrary();
    var opts = lib.map(function (c) { return '<option value="' + c.id + '">' + esc(c.name) + '</option>'; }).join('');
    var html = '<div class="sheet-head"><div><div class="eyebrow">Library</div><h2>New exercise</h2></div>' +
      '<button class="close" data-act="close-sheet">' + svg('close') + '</button></div>' +
      '<div class="sheet-body">' +
      '<div class="field"><label>Exercise name</label><input class="input" id="nx-name" placeholder="e.g. Incline Dumbbell Press" data-act="noop"></div>' +
      '<div class="field"><label>Category</label><select class="select" id="nx-cat">' + opts + '<option value="__new">+ New category…</option></select></div>' +
      '<div class="field hidden" id="nx-newcat-wrap"><label>New category name</label><input class="input" id="nx-newcat" placeholder="e.g. Forearms" data-act="noop"></div>' +
      '</div>' +
      '<div class="sheet-foot"><button class="btn btn-secondary" data-act="close-sheet">Cancel</button>' +
      '<button class="btn btn-primary" data-act="save-new-exercise">Save exercise <span class="arrow">&rarr;</span></button></div>';
    openSheet(html);
    state._afterAddExercise = after;
    var sel = document.getElementById('nx-cat');
    sel.addEventListener('change', function () {
      document.getElementById('nx-newcat-wrap').classList.toggle('hidden', sel.value !== '__new');
    });
  }
  on('save-new-exercise', function () {
    var name = document.getElementById('nx-name').value.trim();
    if (!name) { toast('Enter an exercise name'); return; }
    var catSel = document.getElementById('nx-cat').value;
    var lib = S.getLibrary();
    var cat;
    if (catSel === '__new') {
      var cn = document.getElementById('nx-newcat').value.trim();
      if (!cn) { toast('Enter a category name'); return; }
      cat = { id: S.uid(), name: cn, builtin: false, type: 'strength', exercises: [] };
      lib.push(cat);
    } else {
      cat = lib.find(function (c) { return c.id === catSel; });
    }
    cat.exercises.push({ id: S.uid(), name: name, builtin: false });
    S.saveLibrary(lib);
    closeSheet();
    toast('Added ' + name);
    if (state._afterAddExercise) { var f = state._afterAddExercise; state._afterAddExercise = null; f(); }
    else render();
  });

  // ---- Library manager ----
  on('open-library', function () { renderLibraryManager(); });
  // Just the filtered exercise rows — split out so switching categories can swap
  // ONLY this list (see 'lib-filter'), instead of rebuilding the whole sheet.
  function libListHTML(lib, filter) {
    var body = '';
    lib.forEach(function (cat) {
      if (filter !== 'all' && filter !== cat.id) return;
      body += '<div class="card-head" style="border-radius:12px;margin-top:14px;border:1px solid var(--border)"><span class="eyebrow">' + esc(cat.name) + ' · ' + cat.exercises.length + '</span>' +
        (cat.builtin ? '' : '<button class="link" style="color:var(--danger)" data-act="del-category" data-id="' + cat.id + '">Delete category</button>') + '</div>';
      cat.exercises.forEach(function (ex) {
        body += '<div class="row" style="margin-bottom:8px"><div class="grow"><div class="rtitle" style="font-size:13.5px">' + esc(ex.name) + '</div>' +
          (ex.builtin ? '' : '<div class="rmeta">custom</div>') + '</div>' +
          '<button class="del" data-act="del-exercise" data-cat="' + cat.id + '" data-id="' + ex.id + '">' + svg('trash', 16) + '</button></div>';
      });
    });
    return body;
  }
  function renderLibraryManager(filter) {
    var lib = S.getLibrary();
    filter = filter || state.libFilter;
    state.libFilter = filter;
    var chips = [{ id: 'all', name: 'All' }].concat(lib.map(function (c) { return { id: c.id, name: c.name }; }))
      .map(function (c) { return '<button class="chip' + (filter === c.id ? ' active' : '') + '" data-act="lib-filter" data-id="' + c.id + '">' + esc(c.name) + '</button>'; }).join('');
    var html = '<div class="sheet-head"><div><div class="eyebrow">Manage</div><h2>Exercise library</h2></div>' +
      '<button class="close" data-act="close-sheet">' + svg('close') + '</button></div>' +
      '<div class="sheet-body"><div class="chips">' + chips + '</div>' +
      '<div id="lib-list">' + libListHTML(lib, filter) + '</div>' +
      '<div class="spacer"></div><button class="btn btn-gold btn-block" data-act="lib-add">' + svg('plus', 16) + ' Add exercise / category</button>' +
      '<div class="spacer"></div></div>';
    openSheet(html);
  }
  // Switch category in place — swap only the list + toggle the active chip, then
  // fade the new list in. No full-sheet rebuild, so there's no flash or scroll jump.
  on('lib-filter', function (t) {
    var filter = t.dataset.id;
    if (filter === state.libFilter) return;
    state.libFilter = filter;
    var listEl = document.getElementById('lib-list');
    if (!listEl) { renderLibraryManager(filter); return; }
    var chipEls = sheetSlot.querySelectorAll('.chips .chip[data-act="lib-filter"]');
    for (var i = 0; i < chipEls.length; i++) chipEls[i].classList.toggle('active', chipEls[i].dataset.id === filter);
    listEl.innerHTML = libListHTML(S.getLibrary(), filter);
    listEl.style.transition = 'none';
    listEl.style.opacity = '0';
    listEl.style.transform = 'translateY(4px)';
    void listEl.offsetHeight;   // reflow so the fade-in actually animates
    listEl.style.transition = 'opacity .18s ease, transform .18s ease';
    listEl.style.opacity = '1';
    listEl.style.transform = 'none';
  });
  on('lib-add', function () { openAddExercise(function () { renderLibraryManager(); }); });
  on('del-exercise', function (t) {
    var lib = S.getLibrary();
    var cat = lib.find(function (c) { return c.id === t.dataset.cat; });
    cat.exercises = cat.exercises.filter(function (e) { return e.id !== t.dataset.id; });
    S.saveLibrary(lib); renderLibraryManager();
  });
  on('del-category', function (t) {
    if (!confirm('Delete this category and all its custom exercises?')) return;
    var lib = S.getLibrary().filter(function (c) { return c.id !== t.dataset.id; });
    S.saveLibrary(lib); renderLibraryManager('all');
  });

  // ---- Routine editor ----
  on('new-routine', function () { openRoutineEditor(null); });
  on('open-routine', function (t) { openRoutineEditor(t.dataset.id); });
  var _routineDraft = null;
  function openRoutineEditor(id) {
    var routines = S.getRoutines();
    if (id) { var r = routines.find(function (x) { return x.id === id; }); _routineDraft = JSON.parse(JSON.stringify(r)); }
    else _routineDraft = { id: S.uid(), name: '', exercises: [] };
    renderRoutineEditor();
  }
  function renderRoutineEditor() {
    var r = _routineDraft;
    var lastI = r.exercises.length - 1;
    var exHtml = r.exercises.length ? r.exercises.map(function (e, i) {
      return '<div class="row" style="margin-bottom:8px"><div class="grow"><div class="rtitle" style="font-size:13.5px">' + esc(e.name) + '</div>' +
        '<div class="rmeta">' + esc(e.category || '') + '</div></div>' +
        '<div class="ex-tools">' +
        '<button class="kebab" data-act="rt-up" data-i="' + i + '"' + (i === 0 ? ' disabled' : '') + ' aria-label="Naikkan">' + svg('up', 16) + '</button>' +
        '<button class="kebab" data-act="rt-down" data-i="' + i + '"' + (i === lastI ? ' disabled' : '') + ' aria-label="Turunkan">' + svg('down', 16) + '</button>' +
        '<button class="kebab" data-act="rt-replace" data-i="' + i + '" aria-label="Ganti">' + svg('swap', 16) + '</button>' +
        '<button class="del" data-act="rt-rm" data-i="' + i + '" aria-label="Hapus">' + svg('trash', 16) + '</button>' +
        '</div></div>';
    }).join('') : '<div class="muted-line" style="padding:6px 0 12px">No exercises added yet.</div>';

    var existing = S.getRoutines().some(function (x) { return x.id === r.id; });
    var html = '<div class="sheet-head"><div><div class="eyebrow">Routine</div><h2>' + (existing ? 'Edit routine' : 'New routine') + '</h2></div>' +
      '<button class="close" data-act="close-sheet">' + svg('close') + '</button></div>' +
      '<div class="sheet-body">' +
      '<div class="field"><label>Routine name</label><input class="input" id="rt-name" placeholder="e.g. Push Day, Legs" value="' + esc(r.name) + '" data-act="noop"></div>' +
      '<div class="section-label" style="margin-top:18px">Exercises</div>' + exHtml +
      '<button class="btn btn-gold btn-block" data-act="rt-add">' + svg('plus', 16) + ' Add exercises</button>' +
      '</div>' +
      '<div class="sheet-foot">' +
      (existing ? '<button class="btn btn-danger" data-act="rt-delete">Delete</button>' : '<button class="btn btn-secondary" data-act="close-sheet">Cancel</button>') +
      '<button class="btn btn-primary" data-act="rt-save">Save routine <span class="arrow">&rarr;</span></button></div>';
    openSheet(html);
    var nm = document.getElementById('rt-name');
    if (nm) nm.addEventListener('input', function () { _routineDraft.name = nm.value; });
  }
  on('rt-add', function () {
    // preserve current name
    var nm = document.getElementById('rt-name'); if (nm) _routineDraft.name = nm.value;
    openPicker(false, function (chosen) {
      chosen.forEach(function (e) { _routineDraft.exercises.push({ exId: e.exId, name: e.name, category: e.category, categoryType: e.categoryType }); });
      renderRoutineEditor();
    });
  });
  on('rt-rm', function (t) { _routineDraft.exercises.splice(+t.dataset.i, 1); renderRoutineEditor(); });
  function rtMove(i, dir) {
    var nm = document.getElementById('rt-name'); if (nm) _routineDraft.name = nm.value;
    var arr = _routineDraft.exercises, j = i + dir;
    if (j < 0 || j >= arr.length) return;
    var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    renderRoutineEditor();
  }
  on('rt-up', function (t) { rtMove(+t.dataset.i, -1); });
  on('rt-down', function (t) { rtMove(+t.dataset.i, 1); });
  on('rt-replace', function (t) {
    var i = +t.dataset.i;
    var nm = document.getElementById('rt-name'); if (nm) _routineDraft.name = nm.value;
    openPicker(false, function (chosen) {
      var e = chosen[0];
      if (e) _routineDraft.exercises[i] = { exId: e.exId, name: e.name, category: e.category, categoryType: e.categoryType };
      renderRoutineEditor();
    }, { single: true, title: 'Ganti latihan', confirmLabel: 'Ganti' });
  });
  on('rt-save', function () {
    var nm = document.getElementById('rt-name'); if (nm) _routineDraft.name = nm.value;
    if (!_routineDraft.name.trim()) { toast('Enter a routine name'); return; }
    if (!_routineDraft.exercises.length) { toast('Add at least one exercise'); return; }
    var routines = S.getRoutines();
    var idx = routines.findIndex(function (x) { return x.id === _routineDraft.id; });
    if (idx >= 0) routines[idx] = _routineDraft; else routines.push(_routineDraft);
    S.saveRoutines(routines); closeSheet(); render(); toast('Routine saved');
  });
  on('rt-delete', function () {
    if (!confirm('Delete this routine?')) return;
    S.saveRoutines(S.getRoutines().filter(function (x) { return x.id !== _routineDraft.id; }));
    closeSheet(); render(); toast('Routine deleted');
  });

  // ---- Weight entry ----
  on('add-weight', function () {
    var u = unit();
    var now = new Date();
    var html = '<div class="sheet-head"><div><div class="eyebrow">Weight tracker</div><h2>Log bodyweight</h2></div>' +
      '<button class="close" data-act="close-sheet">' + svg('close') + '</button></div>' +
      '<div class="sheet-body">' +
      '<div class="field"><label>Weight (' + u + ')</label><input class="input num" id="wt-val" inputmode="decimal" placeholder="0.0" data-act="noop"></div>' +
      '<div class="row-fields"><div class="field"><label>Date</label><input class="input" id="wt-date" type="date" value="' + now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate()) + '" data-act="noop"></div>' +
      '<div class="field"><label>Time</label><input class="input" id="wt-time" type="time" value="' + pad(now.getHours()) + ':' + pad(now.getMinutes()) + '" data-act="noop"></div></div>' +
      '</div>' +
      '<div class="sheet-foot"><button class="btn btn-secondary" data-act="close-sheet">Cancel</button>' +
      '<button class="btn btn-primary" data-act="save-weight">Save <span class="arrow">&rarr;</span></button></div>';
    openSheet(html, true);
    setTimeout(function () { var el = document.getElementById('wt-val'); if (el) el.focus(); }, 60);
  });
  on('save-weight', function () {
    var val = parseFloat(document.getElementById('wt-val').value);
    if (isNaN(val) || val <= 0) { toast('Enter a valid weight'); return; }
    var dt = document.getElementById('wt-date').value, tm = document.getElementById('wt-time').value;
    var ts = dt ? new Date(dt + 'T' + (tm || '12:00')).getTime() : Date.now();
    var w = S.getWeight(); w.push({ id: S.uid(), value: val, unit: unit(), ts: ts });
    S.saveWeight(w); closeSheet(); render(); toast('Weight logged');
  });
  on('del-weight', function (t) {
    S.saveWeight(S.getWeight().filter(function (w) { return w.id !== t.dataset.id; }));
    render();
  });

  // ---- Daily check-in (weight, body fat, notes, photos) ----
  var _ciPhotos = [];
  function resizeImage(file, cb) {
    var url = URL.createObjectURL(file);
    var img = new Image();
    img.onload = function () {
      var max = 900, scale = Math.min(1, max / Math.max(img.width, img.height));
      var w = Math.round(img.width * scale), h = Math.round(img.height * scale);
      var c = document.createElement('canvas'); c.width = w; c.height = h;
      c.getContext('2d').drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      try { cb(c.toDataURL('image/jpeg', 0.72)); } catch (e) { cb(null); }
    };
    img.onerror = function () { URL.revokeObjectURL(url); cb(null); };
    img.src = url;
  }
  function renderCiPhotos() {
    var box = document.getElementById('ci-photos');
    if (!box) return;
    box.innerHTML = _ciPhotos.map(function (src, i) {
      return '<div class="ci-thumb"><img src="' + src + '"><button data-act="ci-rm-photo" data-i="' + i + '">' + svg('close', 14) + '</button></div>';
    }).join('') +
      '<label class="ci-addphoto">' + svg('camera', 22) + '<span>Tambah</span><input type="file" id="ci-file" accept="image/*" multiple style="display:none"></label>';
    var fi = document.getElementById('ci-file');
    if (fi) fi.addEventListener('change', function (e) {
      var files = Array.prototype.slice.call(e.target.files);
      var pending = files.length;
      files.forEach(function (f) {
        resizeImage(f, function (data) { if (data) _ciPhotos.push(data); if (--pending === 0) renderCiPhotos(); });
      });
    });
  }
  on('ci-rm-photo', function (t) { _ciPhotos.splice(+t.dataset.i, 1); renderCiPhotos(); });
  on('add-checkin', function () {
    _ciPhotos = [];
    var u = unit();
    var now = new Date();
    var html = '<div class="sheet-head"><div><div class="eyebrow">Daily check-in</div><h2>Check-in harian</h2></div>' +
      '<button class="close" data-act="close-sheet">' + svg('close') + '</button></div>' +
      '<div class="sheet-body">' +
      '<div class="row-fields"><div class="field"><label>Berat (' + u + ')</label><input class="input num" id="ci-weight" inputmode="decimal" placeholder="0.0" data-act="noop"></div>' +
      '<div class="field"><label>Lemak tubuh (%)</label><input class="input num" id="ci-bodyfat" inputmode="decimal" placeholder="opsional" data-act="noop"></div></div>' +
      '<div class="row-fields"><div class="field"><label>Tanggal</label><input class="input" id="ci-date" type="date" value="' + now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate()) + '" data-act="noop"></div>' +
      '<div class="field"><label>Jam</label><input class="input" id="ci-time" type="time" value="' + pad(now.getHours()) + ':' + pad(now.getMinutes()) + '" data-act="noop"></div></div>' +
      '<div class="section-label" style="margin:16px 0 0">Ukuran tubuh (cm) · opsional</div>' +
      '<div class="meas-grid">' + MEASUREMENTS.map(function (m) {
        return '<div class="meas-cell"><label>' + m.label + '</label><input class="input num" id="meas-' + m.key + '" inputmode="decimal" placeholder="—" data-act="noop"></div>';
      }).join('') + '</div>' +
      '<div class="field"><label>Foto progres</label><div class="ci-photos" id="ci-photos"></div></div>' +
      '<div class="field"><label>Catatan</label><textarea class="input" id="ci-notes" placeholder="Bagaimana perasaanmu hari ini? Energi, tidur, makan…" data-act="noop"></textarea></div>' +
      '</div>' +
      '<div class="sheet-foot"><button class="btn btn-secondary" data-act="close-sheet">Batal</button>' +
      '<button class="btn btn-primary" data-act="save-checkin">Simpan check-in <span class="arrow">&rarr;</span></button></div>';
    openSheet(html);
    renderCiPhotos();
    setTimeout(function () { var el = document.getElementById('ci-weight'); if (el) el.focus(); }, 60);
  });
  on('save-checkin', function () {
    var wRaw = document.getElementById('ci-weight').value;
    var bfRaw = document.getElementById('ci-bodyfat').value;
    var notes = document.getElementById('ci-notes').value.trim();
    var weight = parseFloat(wRaw);
    var bodyfat = bfRaw === '' ? null : parseFloat(bfRaw);
    var measurements = {};
    MEASUREMENTS.forEach(function (m) {
      var el = document.getElementById('meas-' + m.key); if (!el) return;
      var v = el.value; if (v === '') return;
      var n = parseFloat(v); if (!isNaN(n) && n > 0) measurements[m.key] = round1(n);
    });
    var hasMeas = Object.keys(measurements).length > 0;
    if (isNaN(weight) && bodyfat == null && !notes && !_ciPhotos.length && !hasMeas) return toast('Isi minimal satu hal');
    if (wRaw !== '' && (isNaN(weight) || weight <= 0)) return toast('Berat tidak valid');
    if (bfRaw !== '' && (isNaN(bodyfat) || bodyfat < 0 || bodyfat > 70)) return toast('Lemak tubuh tidak valid');
    var dt = document.getElementById('ci-date').value, tm = document.getElementById('ci-time').value;
    var ts = dt ? new Date(dt + 'T' + (tm || '12:00')).getTime() : Date.now();
    var u = unit();
    var checkin = { id: S.uid(), ts: ts, weight: isNaN(weight) ? null : weight, weightUnit: u, bodyfat: bodyfat, measurements: measurements, notes: notes, photos: _ciPhotos.slice(), weightId: null };
    // auto-feed the weight tracker: a check-in weight also becomes a weight entry
    if (!isNaN(weight)) {
      var wid = S.uid(); checkin.weightId = wid;
      var w = S.getWeight(); w.push({ id: wid, value: weight, unit: u, ts: ts }); S.saveWeight(w);
    }
    var cs = S.getCheckins(); cs.push(checkin); S.saveCheckins(cs);
    _ciPhotos = [];
    closeSheet(); render(); toast('Check-in tersimpan');
  });
  on('open-checkin', function (t) {
    var c = S.getCheckins().find(function (x) { return x.id === t.dataset.id; });
    if (!c) return;
    var u = unit();
    var rows = '';
    if (c.weight != null && c.weight !== '') rows += ciStat('Berat', round1(convW(parseFloat(c.weight), c.weightUnit || u, u)) + ' ' + u);
    if (c.bodyfat != null && c.bodyfat !== '') rows += ciStat('Lemak tubuh', c.bodyfat + ' %');
    var photos = (c.photos || []).map(function (src, i) {
      return '<div class="ci-thumb big"><img src="' + src + '" data-act="open-photo" data-id="' + c.id + '" data-i="' + i + '"></div>';
    }).join('');
    var measKeys = c.measurements ? Object.keys(c.measurements) : [];
    var measHtml = '';
    if (measKeys.length) {
      measHtml = '<div class="section-label" style="margin-top:16px">Ukuran tubuh</div><div class="meas-view">' +
        MEASUREMENTS.filter(function (m) { return c.measurements[m.key] != null; }).map(function (m) {
          return '<div class="meas-row"><span class="ml">' + m.label + '</span><span class="mv num">' + c.measurements[m.key] + '<span class="u"> cm</span></span></div>';
        }).join('') + '</div>';
    }
    var html = '<div class="sheet-head"><div><div class="eyebrow">' + fullDate(c.ts) + ' · ' + clockStr(c.ts) + '</div><h2>Check-in</h2></div>' +
      '<button class="close" data-act="close-sheet">' + svg('close') + '</button></div>' +
      '<div class="sheet-body">' +
      (rows ? '<div class="darkstrip" style="margin-top:6px">' + rows + '</div>' : '') +
      measHtml +
      (photos ? '<div class="section-label" style="margin-top:16px">Foto progres</div><div class="ci-grid">' + photos + '</div>' : '') +
      (c.notes ? '<div class="section-label" style="margin-top:16px">Catatan</div><div class="card" style="margin-top:10px"><div style="font:500 13.5px/1.55 \'Hanken Grotesk\';color:var(--body)">' + esc(c.notes) + '</div></div>' : '') +
      '<div class="spacer"></div><button class="btn btn-danger btn-block" data-act="del-checkin" data-id="' + c.id + '">Hapus check-in</button>' +
      '<div class="spacer"></div></div>';
    openSheet(html);
  });
  function ciStat(label, val) {
    return '<div class="ds-item"><div class="dl">' + label + '</div><div class="dv num">' + val + '</div></div>';
  }
  on('del-checkin', function (t) {
    if (!confirm('Hapus check-in ini? Foto dan catatannya akan hilang.')) return;
    var c = S.getCheckins().find(function (x) { return x.id === t.dataset.id; });
    if (c && c.weightId) S.saveWeight(S.getWeight().filter(function (w) { return w.id !== c.weightId; }));
    S.saveCheckins(S.getCheckins().filter(function (x) { return x.id !== t.dataset.id; }));
    closeSheet(); render(); toast('Check-in dihapus');
  });
  on('open-photo', function (t) {
    var c = S.getCheckins().find(function (x) { return x.id === t.dataset.id; });
    if (!c || !c.photos) return;
    var src = c.photos[+t.dataset.i];
    sheetSlot.insertAdjacentHTML('beforeend', '<div class="backdrop" data-act="close-lightbox" style="z-index:70;background:rgba(10,14,20,.85);align-items:center"><img class="lightbox-img" src="' + src + '"></div>');
  });
  on('close-lightbox', function () { var lb = sheetSlot.querySelector('[data-act=close-lightbox]'); if (lb) lb.remove(); });
  on('track-period', function (t) { state.trackPeriod = t.dataset.p; updateTracker(); });
  on('track-range-open', function () {
    var now = new Date();
    var monthAgo = new Date(now.getTime() - 30 * 864e5);
    function dv(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
    var from = state.trackRange ? new Date(state.trackRange.from) : monthAgo;
    var to = state.trackRange ? new Date(state.trackRange.to) : now;
    var html = '<div class="sheet-head"><div><div class="eyebrow">Tracker</div><h2>Pilih rentang tanggal</h2></div>' +
      '<button class="close" data-act="close-sheet">' + svg('close') + '</button></div>' +
      '<div class="sheet-body">' +
      '<div class="row-fields"><div class="field"><label>Dari</label><input class="input" id="wr-from" type="date" value="' + dv(from) + '" data-act="noop"></div>' +
      '<div class="field"><label>Sampai</label><input class="input" id="wr-to" type="date" value="' + dv(to) + '" data-act="noop"></div></div>' +
      '</div>' +
      '<div class="sheet-foot"><button class="btn btn-secondary" data-act="close-sheet">Batal</button>' +
      '<button class="btn btn-primary" data-act="track-range-apply">Terapkan <span class="arrow">&rarr;</span></button></div>';
    openSheet(html, true);
  });
  on('track-range-apply', function () {
    var f = document.getElementById('wr-from').value, t = document.getElementById('wr-to').value;
    if (!f || !t) return toast('Pilih kedua tanggal');
    var from = new Date(f + 'T00:00:00').getTime(), to = new Date(t + 'T23:59:59').getTime();
    if (from > to) { var tmp = from; from = to; to = tmp; }
    state.trackRange = { from: from, to: to };
    state.trackPeriod = 'range';
    closeSheet(); updateTracker();
  });

  // ---- Profile edit ----
  on('edit-profile', function () {
    var p = S.getProfile();
    var genders = ['Male', 'Female', 'Other'];
    var html = '<div class="sheet-head"><div><div class="eyebrow">Profile</div><h2>Personal details</h2></div>' +
      '<button class="close" data-act="close-sheet">' + svg('close') + '</button></div>' +
      '<div class="sheet-body">' +
      '<div class="field"><label>Name</label><input class="input" id="pf-name" value="' + esc(p.name) + '" placeholder="Your name" data-act="noop"></div>' +
      '<div class="field"><label>WhatsApp number</label><input class="input" id="pf-wa" type="tel" inputmode="tel" value="' + esc(p.whatsapp || '') + '" placeholder="08xx-xxxx-xxxx" data-act="noop"></div>' +
      '<div class="field"><label>Gender</label><div class="seg" id="pf-gender">' +
      genders.map(function (g) { return '<button data-act="pf-gender" data-g="' + g + '" class="' + (p.gender === g ? 'active' : '') + '">' + g + '</button>'; }).join('') + '</div></div>' +
      '<div class="row-fields"><div class="field"><label>Height</label><input class="input num" id="pf-height" inputmode="decimal" value="' + esc(p.height) + '" placeholder="0" data-act="noop"></div>' +
      '<div class="field"><label>Unit</label><div class="seg" id="pf-hunit">' +
      ['cm', 'ft'].map(function (x) { return '<button data-act="pf-hunit" data-u="' + x + '" class="' + ((p.heightUnit || 'cm') === x ? 'active' : '') + '">' + x + '</button>'; }).join('') + '</div></div></div>' +
      '<div class="field"><label>Address</label><textarea class="input" id="pf-address" placeholder="Optional" data-act="noop">' + esc(p.address) + '</textarea></div>' +
      '</div>' +
      '<div class="sheet-foot"><button class="btn btn-secondary" data-act="close-sheet">Cancel</button>' +
      '<button class="btn btn-primary" data-act="save-profile">Save <span class="arrow">&rarr;</span></button></div>';
    openSheet(html);
    _pfTmp = { gender: p.gender, heightUnit: p.heightUnit || 'cm' };
  });
  var _pfTmp = {};
  on('pf-gender', function (t) { _pfTmp.gender = t.dataset.g; t.parentNode.querySelectorAll('button').forEach(function (b) { b.classList.remove('active'); }); t.classList.add('active'); });
  on('pf-hunit', function (t) { _pfTmp.heightUnit = t.dataset.u; t.parentNode.querySelectorAll('button').forEach(function (b) { b.classList.remove('active'); }); t.classList.add('active'); });
  on('save-profile', function () {
    S.saveProfile({
      name: document.getElementById('pf-name').value.trim(),
      whatsapp: document.getElementById('pf-wa').value.trim(),
      gender: _pfTmp.gender || '',
      height: document.getElementById('pf-height').value.trim(),
      heightUnit: _pfTmp.heightUnit || 'cm',
      address: document.getElementById('pf-address').value.trim()
    });
    closeSheet(); render(); toast('Profile saved');
  });

  // ---- Feedback & suggestions ----
  // Goes to the shared `feedback` table → Master Office "Layanan" inbox, tagged
  // app='health'. The email comes from the signed-in account — no retyping.
  on('open-feedback', function () {
    var acc = getAuth();
    var who = acc && acc.email ? acc.email : '';
    var html = '<div class="sheet-head"><div><div class="eyebrow">Sterith Health</div><h2>Feedback &amp; suggestions</h2></div>' +
      '<button class="close" data-act="close-sheet">' + svg('close') + '</button></div>' +
      '<div class="sheet-body">' +
      '<p class="muted-line" style="margin:0 0 14px;line-height:1.6">Got an idea, or something not working? Tell us — the team reads every message.</p>' +
      (who ? '<div class="field"><label>Sending as</label><input class="input" value="' + esc(who) + '" readonly data-act="noop"></div>' : '') +
      '<div class="field"><label>Type</label><div class="seg" id="fb-kind">' +
      [['feedback', 'Suggestion'], ['complain', 'Problem']].map(function (x) {
        return '<button data-act="fb-kind" data-k="' + x[0] + '" class="' + (x[0] === 'feedback' ? 'active' : '') + '">' + x[1] + '</button>';
      }).join('') + '</div></div>' +
      '<div class="field"><label>Your message</label><textarea class="input" id="fb-msg" rows="6" placeholder="Write your feedback…" data-act="noop"></textarea></div>' +
      '</div>' +
      '<div class="sheet-foot"><button class="btn btn-secondary" data-act="close-sheet">Cancel</button>' +
      '<button class="btn btn-primary" data-act="send-feedback">Send <span class="arrow">&rarr;</span></button></div>';
    openSheet(html);
    _fbKind = 'feedback';
  });
  var _fbKind = 'feedback';
  on('fb-kind', function (t) {
    _fbKind = t.dataset.k;
    t.parentNode.querySelectorAll('button').forEach(function (b) { b.classList.remove('active'); });
    t.classList.add('active');
  });
  on('send-feedback', function (t) {
    var el = document.getElementById('fb-msg');
    var msg = el ? el.value.trim() : '';
    if (!msg) { toast('Write a message first'); return; }
    var acc = getAuth();
    var email = acc && acc.email ? acc.email : '';
    if (!sb || !email) { toast('Sign in to send feedback'); return; }
    t.disabled = true; t.textContent = 'Sending…';
    sb.from('feedback').insert({
      type: _fbKind, email: email, message: msg, status: 'pending', app: 'health'
    }).then(function (r) {
      if (r && r.error) { t.disabled = false; t.innerHTML = 'Send <span class="arrow">&rarr;</span>'; toast('Failed to send. Try again.'); return; }
      closeSheet(); toast('Thank you — feedback sent');
    });
  });

  // ---- Settings ----
  on('open-settings', function () {
    var st = S.getSettings();
    var html = '<div class="sheet-head"><div><div class="eyebrow">Settings</div><h2>Units & data</h2></div>' +
      '<button class="close" data-act="close-sheet">' + svg('close') + '</button></div>' +
      '<div class="sheet-body">' +
      '<div class="field"><label>Weight unit (lifts & bodyweight)</label><div class="seg" id="set-unit">' +
      ['kg', 'lbs'].map(function (x) { return '<button data-act="set-unit" data-u="' + x + '" class="' + (st.unit === x ? 'active' : '') + '">' + x + '</button>'; }).join('') + '</div>' +
      '<div class="muted-line">Existing entries are converted for display automatically.</div></div>' +
      '<div class="section-label" style="margin-top:20px">Data</div>' +
      '<button class="btn btn-secondary btn-block" style="margin-top:12px" data-act="export-data">' + svg('download', 16) + ' Export all data (JSON)</button>' +
      '<label class="btn btn-secondary btn-block" style="margin-top:10px;cursor:pointer">' + svg('note', 16) + ' Import data<input type="file" id="import-file" accept="application/json" style="display:none"></label>' +
      '<button class="btn btn-danger btn-block" style="margin-top:18px" data-act="reset-data">Reset all data</button>' +
      '</div>' +
      '<div class="sheet-foot"><button class="btn btn-primary btn-block" data-act="close-sheet">Done</button></div>';
    openSheet(html);
    var fi = document.getElementById('import-file');
    if (fi) fi.addEventListener('change', function (e) { importFile(e.target.files[0]); });
  });
  on('set-unit', function (t) {
    var st = S.getSettings(); st.unit = t.dataset.u; S.saveSettings(st);
    t.parentNode.querySelectorAll('button').forEach(function (b) { b.classList.remove('active'); }); t.classList.add('active');
    toast('Unit set to ' + t.dataset.u);
  });
  on('export-data', function () {
    var data = JSON.stringify(S.exportAll(), null, 2);
    var blob = new Blob([data], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'sterith-workout-' + dayKey(Date.now()) + '.json';
    a.click(); URL.revokeObjectURL(a.href);
    toast('Data exported');
  });
  function importFile(file) {
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try { S.importAll(JSON.parse(reader.result)); closeSheet(); state.session = S.getDraft(); render(); toast('Data imported'); }
      catch (e) { toast('Import failed — invalid file'); }
    };
    reader.readAsText(file);
  }
  on('reset-data', function () {
    if (!confirm('Erase ALL workouts, routines, weight logs and profile? This cannot be undone.')) return;
    ['sterith_library', 'sterith_routines', 'sterith_logs', 'sterith_weight', 'sterith_checkins', 'sterith_profile', 'sterith_settings', 'sterith_session_draft']
      .forEach(function (k) { localStorage.removeItem(k); });
    state.session = null; closeSheet(); state.tab = 'profile'; render(); toast('All data reset');
  });

  // ---- Log detail ----
  function openLogDetail(id) {
    var l = S.getLogs().find(function (x) { return x.id === id; });
    if (!l) return;
    var lu = l.unit || unit();
    var body = l.exercises.map(function (ex) {
      var sets = ex.sets.map(function (st, i) {
        var parts = [];
        if (st.weight !== '' && st.weight != null) parts.push('<span class="num">' + esc(st.weight) + '</span> ' + lu);
        if (st.reps !== '' && st.reps != null) parts.push('<span class="num">' + esc(st.reps) + '</span> reps');
        return '<div class="set-line" style="grid-template-columns:26px 1fr;border-top:1px solid var(--divider)"><div class="setno num">' + (i + 1) + '</div>' +
          '<div style="font:500 13.5px/1.3 \'Hanken Grotesk\';color:var(--body);text-align:left">' + (parts.join(' · ') || '—') + '</div></div>';
      }).join('');
      return '<div class="ex-block"><div class="exb-head"><div><div class="name">' + esc(ex.name) + '</div>' +
        '<div class="cat">' + esc(ex.category || '') + '</div></div></div>' +
        '<div class="set-table">' + sets + '</div>' +
        (ex.note ? '<div class="ex-note" style="padding:10px 14px"><div style="font:500 12.5px/1.5 \'Hanken Grotesk\';color:var(--muted)">' + esc(ex.note) + '</div></div>' : '') +
        '</div>';
    }).join('');
    var html = '<div class="sheet-head"><div><div class="eyebrow">' + fullDate(l.startedAt) + '</div><h2>' + esc(l.name || 'Workout') + '</h2></div>' +
      '<button class="close" data-act="close-sheet">' + svg('close') + '</button></div>' +
      '<div class="sheet-body">' +
      '<div class="darkstrip" style="margin-top:6px"><div class="ds-item"><div class="dl">Start</div><div class="dv num">' + clockStr(l.startedAt) + '</div></div>' +
      '<div class="div"></div><div class="ds-item"><div class="dl">Finish</div><div class="dv num gold">' + (l.finishedAt ? clockStr(l.finishedAt) : '—') + '</div></div>' +
      '<div class="div"></div><div class="ds-item"><div class="dl">Duration</div><div class="dv num">' + (durationStr(l.durationSec) || '—') + '</div></div></div>' +
      body +
      '<div class="spacer"></div><button class="btn btn-secondary btn-block" data-act="repeat-log" data-id="' + l.id + '">Repeat this workout</button>' +
      '<button class="btn btn-danger btn-block" style="margin-top:10px" data-act="del-log" data-id="' + l.id + '">Delete workout</button>' +
      '<div class="spacer"></div></div>';
    openSheet(html);
  }
  on('del-log', function (t) {
    if (!confirm('Delete this workout log?')) return;
    S.saveLogs(S.getLogs().filter(function (x) { return x.id !== t.dataset.id; }));
    closeSheet(); render(); toast('Workout deleted');
  });
  on('repeat-log', function (t) {
    var l = S.getLogs().find(function (x) { return x.id === t.dataset.id; });
    if (!l) return;
    state.session = newSession(l.name, l.exercises.map(function (e) { return { exId: e.exId, name: e.name, category: e.category, categoryType: e.categoryType }; }));
    saveSession(); closeSheet(); state.tab = 'log'; render();
  });

  // ============================================================ NAV ==========
  var NAV = [
    { id: 'log', label: 'Log', icon: 'log' },
    { id: 'routines', label: 'Routines', icon: 'dumbbell' },
    { id: 'stats', label: 'Statistics', icon: 'stats' },
    { id: 'profile', label: 'Profile', icon: 'profile' }
  ];
  function buildNav() {
    document.getElementById('bottomnav').innerHTML = NAV.map(function (n) {
      return '<button data-act="nav" data-tab="' + n.id + '"><span class="navpill">' + svg(n.icon, 22) + '</span><span>' + n.label + '</span></button>';
    }).join('');
  }
  function updateNav() {
    var btns = document.querySelectorAll('#bottomnav button');
    btns.forEach(function (b) { b.classList.toggle('active', b.dataset.tab === state.tab); });
  }
  on('nav', function (t) { state.tab = t.dataset.tab; render(); });

  // ============================================================ AUTH =========
  // Local-only account gate (no server). Credentials live on this device so the
  // profile is protected and the app feels like a real product on shared phones.
  function getAuth() { try { return JSON.parse(localStorage.getItem('sterith_auth')) || null; } catch (e) { return null; } }
  function isAuthed() { return localStorage.getItem('sterith_authed') === '1'; }
  function setAuthed(v) { if (v) localStorage.setItem('sterith_authed', '1'); else localStorage.removeItem('sterith_authed'); }
  function validEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }

  // ---- Cloud (Supabase) sync -------------------------------------------------
  // Whole app state (SterithStore.exportAll) is stored per-user in health_state.
  // Pull on login, debounced-push on every change. localStorage stays the offline
  // cache. Demo mode is local-only (no cloud).
  var sb = null;
  try {
    if (window.supabase && window.STERITH_SUPABASE) {
      sb = window.supabase.createClient(window.STERITH_SUPABASE.url, window.STERITH_SUPABASE.anon, { auth: { persistSession: true, autoRefreshToken: true } });
    }
  } catch (e) { sb = null; }

  // New accounts start at the Sterith website form (portfolio + Sterith Health tab),
  // which posts to Master Office (request → payment → set-password link). Not in-app
  // signup. "Daftar" sends them there.
  var DAFTAR_URL = 'https://sterith.com/form.html?daftar=health';
  var AUTH_BASE = 'https://masteroffice.sterith.com';

  // New per-app auth: verify the Health password via Master Office, then redeem the
  // returned magic-link token for a Supabase session. Falls back to the old Supabase
  // password (migration) so existing users who haven't set a Health password still work.
  function appAuthLogin(email, pass) {
    if (!sb) return Promise.reject(new Error('no-conn'));
    return fetch(AUTH_BASE + '/api/app-auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, app: 'health', password: pass })
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) { return { status: r.status, j: j }; });
    }).then(function (res) {
      // Locked out (too many attempts) — surface the message, don't fall back.
      if (res.status === 429) { var e = new Error((res.j && res.j.error) || 'Terlalu banyak percobaan. Coba lagi nanti.'); e.locked = true; throw e; }
      if (res.status === 200 && res.j && res.j.token_hash) {
        return sb.auth.verifyOtp({ type: 'magiclink', token_hash: res.j.token_hash }).then(function (v) {
          if (v.error) throw v.error; return true;
        });
      }
      // No Health password set yet → try the legacy Supabase password.
      return sb.auth.signInWithPassword({ email: email, password: pass }).then(function (s) {
        if (s.error) throw s.error; return true;
      });
    });
  }

  // A set-password link (from Confirm Payment in Master Office) lands here with an
  // invite/recovery token — detect it so boot shows the "Atur Kata Sandi" screen.
  var _setpassFlow = (function () {
    try {
      var h = new URLSearchParams((location.hash || '').replace(/^#/, ''));
      var q = new URLSearchParams(location.search || '');
      var type = h.get('type') || q.get('type');
      return type === 'recovery' || type === 'invite' || h.has('access_token') || q.has('token_hash') || q.has('code');
    } catch (e) { return false; }
  })();
  // New per-app setup link from Master Office: ?setup_token=… → "Buat Kata Sandi".
  var _appSetupToken = (function () {
    try { return new URLSearchParams(location.search || '').get('setup_token') || ''; }
    catch (e) { return ''; }
  })();

  function isDemo() { return localStorage.getItem('sterith_demo') === '1'; }
  function setDemo(v) { if (v) localStorage.setItem('sterith_demo', '1'); else localStorage.removeItem('sterith_demo'); }

  var _pushTimer = null;
  function cloudPush() {
    if (!sb) return;
    clearTimeout(_pushTimer);
    _pushTimer = setTimeout(function () { cloudPushNow(); }, 1200);
  }
  function cloudPushNow() {
    if (!sb) return Promise.resolve();
    return sb.auth.getUser().then(function (r) {
      var user = r && r.data && r.data.user;
      if (!user) return;
      return sb.from('health_state').upsert(
        { user_id: user.id, data: S.exportAll(), updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      );
    }).catch(function () {});
  }
  function cloudLoad() {
    if (!sb) return Promise.resolve();
    return sb.auth.getUser().then(function (r) {
      var user = r && r.data && r.data.user;
      if (!user) return;
      return sb.from('health_state').select('data').eq('user_id', user.id).maybeSingle().then(function (res) {
        var row = res && res.data;
        if (row && row.data && Object.keys(row.data).length) {
          try { S.importAll(row.data); } catch (e) {}
        } else {
          return cloudPushNow(); // first login — migrate local data up
        }
      });
    }).catch(function () {});
  }
  if (S.setSyncHandler) S.setSyncHandler(cloudPush);

  // Per-app access: same email may span apps, but each app still requires its own
  // payment/confirmation. User must be SUBSCRIBED to 'health' (tenants.apps) — RLS
  // returns only their own tenant row.
  function hasHealthAccess() {
    if (!sb) return Promise.resolve(false);
    return sb.auth.getUser().then(function (r) {
      var user = r && r.data && r.data.user;
      if (!user) return false;
      return sb.from('tenants').select('apps').then(function (res) {
        var rows = res && res.data;
        var apps = rows && rows[0] && rows[0].apps;
        return Array.isArray(apps) && apps.indexOf('health') !== -1;
      });
    }).catch(function () { return false; });
  }
  // ── Single-device session ────────────────────────────────────────────────
  // One account = one active device. Logging in on a new device writes a fresh
  // session token to health_state.session_token; any other device notices the
  // mismatch (on load, tab focus, or a periodic check) and signs itself out.
  function newSessTok() {
    try { return crypto.randomUUID ? crypto.randomUUID() : (Date.now() + '-' + Math.random().toString(36).slice(2)); }
    catch (e) { return Date.now() + '-' + Math.random().toString(36).slice(2); }
  }
  function getLocalSessTok() { try { return localStorage.getItem('sterith_sess_tok') || ''; } catch (e) { return ''; } }
  function setLocalSessTok(t) { try { if (t) localStorage.setItem('sterith_sess_tok', t); else localStorage.removeItem('sterith_sess_tok'); } catch (e) {} }

  // Claim this device as the active one (on explicit login / signup / set-password).
  function claimSession() {
    if (!sb) return Promise.resolve();
    var tok = newSessTok();
    setLocalSessTok(tok);
    return sb.auth.getUser().then(function (r) {
      var user = r && r.data && r.data.user; if (!user) return;
      return sb.from('health_state').upsert({ user_id: user.id, session_token: tok }, { onConflict: 'user_id' });
    }).catch(function () {});
  }
  // Returns Promise<boolean> — false means this device was kicked (other device or
  // suspended). Also detects suspension from Master Office so an open session logs out.
  function verifySession() {
    if (!sb || isDemo() || !isAuthed()) return Promise.resolve(true);
    return sb.auth.getUser().then(function (r) {
      var user = r && r.data && r.data.user; if (!user) return true;
      return Promise.all([
        sb.from('health_state').select('session_token').eq('user_id', user.id).maybeSingle(),
        sb.from('tenants').select('status, suspended_apps')   // RLS returns only their own tenant row
      ]).then(function (arr) {
        var srv = arr[0] && arr[0].data && arr[0].data.session_token;
        var rows = arr[1] && arr[1].data;
        var t = rows && rows[0];
        var suspended = t && Array.isArray(t.suspended_apps) && t.suspended_apps.indexOf('health') !== -1;
        if (suspended || (t && t.status === 'churn')) { kickSuspended(); return false; }
        if (srv && srv !== getLocalSessTok()) { kickOtherDevice(); return false; }
        return true;
      });
    }).catch(function () { return true; });
  }
  function _kick(msg) {
    stopSessionWatch();
    setLocalSessTok('');
    setAuthed(false);
    if (sb) sb.auth.signOut();
    renderAuth('login');
    toast(msg);
  }
  function kickOtherDevice() { _kick('Akun masuk di perangkat lain — Anda keluar dari perangkat ini.'); }
  function kickSuspended() { _kick('Akses ditangguhkan. Hubungi Sterith.'); }
  var _sessWatch = null;
  function _onSessVis() { if (document.visibilityState === 'visible') verifySession(); }
  function startSessionWatch() {
    if (_sessWatch || isDemo()) return;
    _sessWatch = setInterval(function () { verifySession(); }, 45000);
    document.addEventListener('visibilitychange', _onSessVis);
  }
  function stopSessionWatch() {
    if (_sessWatch) { clearInterval(_sessWatch); _sessWatch = null; }
    document.removeEventListener('visibilitychange', _onSessVis);
  }

  // Enter the app only if the user has Health access; otherwise sign out + gate.
  // claim=true → this device becomes the active one; false → verify it still is.
  function enterIfAccess(claim) {
    return hasHealthAccess().then(function (ok) {
      if (!ok) { if (sb) sb.auth.signOut(); setAuthed(false); renderAuth('noaccess'); return; }
      setDemo(false); setAuthed(true);
      var pre = claim ? claimSession().then(function () { return true; }) : verifySession();
      return pre.then(function (proceed) {
        if (proceed === false) return;   // superseded by another device
        return cloudLoad().then(function () { enterApp(); startSessionWatch(); });
      });
    });
  }

  var _lastName = '';
  function showAuth() { renderAuth('login'); }

  function authShell(inner, cls) {
    var el = document.getElementById('auth') || document.createElement('div');
    el.id = 'auth';
    el.className = cls || '';
    el.innerHTML = '<div class="auth-wrap"><div class="auth-box">' +
      '<div class="auth-topbar"><span class="auth-st"><i></i>Sesi Aman</span><span class="auth-vr">v1.0</span></div>' +
      '<div class="auth-brand"><img src="assets/logo-dark.png" alt="Sterith Health"></div>' +
      '<div class="auth-divider"><span>Workout · Bodybuilding</span></div>' + inner + '</div></div>';
    if (!el.parentNode) document.body.appendChild(el);
    el.scrollTop = 0;
  }

  function renderAuth(mode) {
    if (mode === 'thankyou') return renderThankYou();
    if (mode === 'register') return renderRegister();
    if (mode === 'appsetup') return renderAppSetup();
    if (mode === 'setpass') return renderSetPass();
    if (mode === 'forgot') return renderForgot();
    if (mode === 'noaccess') return renderNoAccess();
    // ---- Login (default) ----
    var acc = getAuth();
    authShell(
      '<div class="auth-eyebrow">Akun · Masuk</div>' +
      '<h1 class="auth-title">Selamat datang</h1>' +
      '<p class="auth-sub">Masuk untuk membuka log, rutin, dan statistik latihanmu.</p>' +
      '<div class="auth-card">' +
      '<div class="field"><label>Email</label><div class="auth-input"><span class="ai-ic">' + svg('mail', 18) + '</span>' +
      '<input class="input" id="au-email" type="email" inputmode="email" placeholder="nama@email.com" autocomplete="email" value="' + esc(acc ? acc.email : '') + '"></div></div>' +
      '<div class="field"><label>Kata sandi</label><div class="auth-input"><span class="ai-ic">' + svg('lock', 18) + '</span>' +
      '<input class="input" id="au-pass" type="password" placeholder="Kata sandi" autocomplete="current-password">' +
      '<button class="ai-eye" data-act="au-eye" data-for="au-pass">' + svg('eye', 18) + '</button></div></div>' +
      '<button class="btn btn-primary btn-block btn-lg" style="margin-top:18px" data-act="au-login">Masuk <span class="arrow">&rarr;</span></button>' +
      '<div style="text-align:center;margin-top:12px"><button data-act="au-to-forgot" style="background:none;border:none;color:#8f897a;font-size:12.5px;cursor:pointer;font-family:inherit;text-decoration:underline;text-underline-offset:2px">Lupa kata sandi?</button></div>' +
      '<div class="auth-toggle">Belum ada akun? <button data-act="au-to-register">Daftar</button></div>' +
      '</div>' +
      '<div class="auth-or"><span>atau</span></div>' +
      '<button class="btn btn-gold btn-block btn-lg" data-act="au-demo">' + svg('play', 18) + ' Coba demo</button>' +
      '<div class="auth-secure"><span><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> Terenkripsi · Data aman</span><span>© 2026 STERITH</span></div>',
      'auth-login'
    );
  }

  function renderNoAccess() {
    authShell(
      '<div class="auth-eyebrow">Akses · Sterith Health</div>' +
      '<h1 class="auth-title">Belum berlangganan</h1>' +
      '<p class="auth-sub">Akun Anda belum punya akses ke Sterith Health. Ajukan dulu — tim kami konfirmasi pembayaran, lalu Anda masuk dengan akun yang sama.</p>' +
      '<div class="auth-card">' +
      '<button class="btn btn-primary btn-block btn-lg" data-act="au-to-register">Ajukan Sterith Health <span class="arrow">&rarr;</span></button>' +
      '<div class="auth-toggle">Bukan Anda? <button data-act="au-to-login">Masuk akun lain</button></div>' +
      '</div>',
      'auth-noaccess'
    );
  }

  function renderForgot() {
    authShell(
      '<div class="auth-eyebrow">Akun · Lupa Sandi</div>' +
      '<h1 class="auth-title">Atur ulang kata sandi</h1>' +
      '<p class="auth-sub">Masukkan email akun Anda. Kami kirim tautan untuk membuat kata sandi baru.</p>' +
      '<div class="auth-card">' +
      '<div class="field"><label>Email</label><div class="auth-input"><span class="ai-ic">' + svg('mail', 18) + '</span>' +
      '<input class="input" id="au-email" type="email" inputmode="email" placeholder="nama@email.com" autocomplete="email"></div></div>' +
      '<button class="btn btn-primary btn-block btn-lg" style="margin-top:18px" data-act="au-forgot">Kirim Tautan Reset <span class="arrow">&rarr;</span></button>' +
      '<div class="auth-toggle">Ingat kata sandi? <button data-act="au-to-login">Masuk</button></div>' +
      '</div>',
      'auth-forgot'
    );
  }

  function renderRegister() {
    authShell(
      '<div class="auth-eyebrow">Akun · Daftar</div>' +
      '<h1 class="auth-title">Buat akun</h1>' +
      '<p class="auth-sub">Lengkapi data dirimu untuk mulai berlatih bersama Sterith.</p>' +
      '<div class="auth-card">' +
      '<div class="field"><label>Nama lengkap</label><div class="auth-input"><span class="ai-ic">' + svg('profile', 18) + '</span>' +
      '<input class="input" id="au-name" placeholder="Nama kamu" autocomplete="name"></div></div>' +
      '<div class="field"><label>Nomor WhatsApp</label><div class="auth-input"><span class="ai-ic">' + svg('phone', 18) + '</span>' +
      '<input class="input" id="au-wa" type="tel" inputmode="tel" placeholder="08xx-xxxx-xxxx" autocomplete="tel"></div></div>' +
      '<div class="field"><label>Alamat</label><textarea class="input" id="au-address" placeholder="Alamat lengkap" rows="2"></textarea></div>' +
      '<div class="field"><label>Email</label><div class="auth-input"><span class="ai-ic">' + svg('mail', 18) + '</span>' +
      '<input class="input" id="au-email" type="email" inputmode="email" placeholder="nama@email.com" autocomplete="email"></div></div>' +
      '<div class="field"><label>Kata sandi</label><div class="auth-input"><span class="ai-ic">' + svg('lock', 18) + '</span>' +
      '<input class="input" id="au-pass" type="password" placeholder="Minimal 8 karakter" autocomplete="new-password">' +
      '<button class="ai-eye" data-act="au-eye" data-for="au-pass">' + svg('eye', 18) + '</button></div></div>' +
      '<div class="field"><label>Ulangi kata sandi</label><div class="auth-input"><span class="ai-ic">' + svg('lock', 18) + '</span>' +
      '<input class="input" id="au-pass2" type="password" placeholder="Ketik ulang kata sandi" autocomplete="new-password">' +
      '<button class="ai-eye" data-act="au-eye" data-for="au-pass2">' + svg('eye', 18) + '</button></div></div>' +
      '<button class="btn btn-primary btn-block btn-lg" style="margin-top:18px" data-act="au-register">Daftar <span class="arrow">&rarr;</span></button>' +
      '<div class="auth-toggle">Sudah punya akun? <button data-act="au-to-login">Masuk</button></div>' +
      '</div>' +
      '<div class="auth-foot">Data tersimpan di perangkat ini · Sterith Health</div>',
      'auth-register'
    );
  }

  function renderSetPass() {
    authShell(
      '<div class="auth-eyebrow">Akun · Atur Kata Sandi</div>' +
      '<h1 class="auth-title">Buat kata sandi</h1>' +
      '<p class="auth-sub">Buat kata sandi untuk akun di bawah, lalu Anda langsung bisa memakai aplikasi.</p>' +
      '<div class="auth-card">' +
      '<div class="field"><label>Email</label><div class="auth-input" style="opacity:0.7">' +
      '<span class="ai-ic">' + svg('mail', 18) + '</span>' +
      '<input class="input" id="au-email" type="email" value="memuat…" readonly disabled tabindex="-1" style="pointer-events:none;background:transparent"></div></div>' +
      '<div class="field"><label>Kata sandi</label><div class="auth-input"><span class="ai-ic">' + svg('lock', 18) + '</span>' +
      '<input class="input" id="au-pass" type="password" placeholder="Minimal 8 karakter" autocomplete="new-password">' +
      '<button class="ai-eye" data-act="au-eye" data-for="au-pass">' + svg('eye', 18) + '</button></div></div>' +
      '<div class="field"><label>Ulangi kata sandi</label><div class="auth-input"><span class="ai-ic">' + svg('lock', 18) + '</span>' +
      '<input class="input" id="au-pass2" type="password" placeholder="Ketik ulang kata sandi" autocomplete="new-password">' +
      '<button class="ai-eye" data-act="au-eye" data-for="au-pass2">' + svg('eye', 18) + '</button></div></div>' +
      '<button class="btn btn-primary btn-block btn-lg" style="margin-top:18px" data-act="au-setpass">Aktifkan Akun <span class="arrow">&rarr;</span></button>' +
      '</div>',
      'auth-setpass'
    );
    // Fill the (read-only) email from the invited session.
    if (sb) sb.auth.getUser().then(function (r) {
      var el = document.getElementById('au-email');
      var u = r && r.data && r.data.user;
      if (el && u && u.email) el.value = u.email;
    });
  }

  // New per-app "Buat Kata Sandi" screen (from a ?setup_token link). Sets THIS app's
  // own password via Master Office, then logs in.
  function renderAppSetup() {
    authShell(
      '<div class="auth-eyebrow">Sterith Health · Kata Sandi</div>' +
      '<h1 class="auth-title">Buat kata sandi Health</h1>' +
      '<p class="auth-sub">Buat kata sandi khusus untuk Sterith Health. Boleh sama atau beda dengan aplikasi Sterith Anda yang lain.</p>' +
      '<div class="auth-card">' +
      '<div class="field"><label>Email Akun</label><div class="auth-input" style="opacity:0.7">' +
      '<span class="ai-ic">' + svg('mail', 18) + '</span>' +
      '<input class="input" id="au-email" type="email" value="memuat…" readonly disabled tabindex="-1" style="pointer-events:none;background:transparent"></div></div>' +
      '<div class="field"><label>Kata sandi</label><div class="auth-input"><span class="ai-ic">' + svg('lock', 18) + '</span>' +
      '<input class="input" id="au-pass" type="password" placeholder="Minimal 8 karakter" autocomplete="new-password">' +
      '<button class="ai-eye" data-act="au-eye" data-for="au-pass">' + svg('eye', 18) + '</button></div></div>' +
      '<div class="field"><label>Ulangi kata sandi</label><div class="auth-input"><span class="ai-ic">' + svg('lock', 18) + '</span>' +
      '<input class="input" id="au-pass2" type="password" placeholder="Ketik ulang kata sandi" autocomplete="new-password">' +
      '<button class="ai-eye" data-act="au-eye" data-for="au-pass2">' + svg('eye', 18) + '</button></div></div>' +
      '<button class="btn btn-primary btn-block btn-lg" style="margin-top:18px" data-act="au-appsetup">Buat Kata Sandi <span class="arrow">&rarr;</span></button>' +
      '</div>',
      'auth-setpass'
    );
    // Show the registered email the setup link is for.
    fetch(AUTH_BASE + '/api/app-auth/setup?token=' + encodeURIComponent(_appSetupToken))
      .then(function (r) { return r.json().catch(function () { return {}; }); })
      .then(function (j) { var el = document.getElementById('au-email'); if (el) el.value = (j && j.email) || ''; })
      .catch(function () {});
  }
  // Success screen after setting the Health password (mirrors POS).
  var _setupEmail = '';
  function renderAppSetupDone(email) {
    _setupEmail = email || '';
    authShell(
      '<div class="ty"><div class="ty-check">' + svg('check', 40) + '</div>' +
      '<div class="auth-eyebrow" style="text-align:center">Berhasil · Kata Sandi Dibuat</div>' +
      '<h1 class="auth-title" style="text-align:center">Kata sandi Anda telah dibuat.</h1>' +
      '<p class="auth-sub" style="text-align:center;margin:0 auto">Silakan masuk ke Sterith Health dengan kata sandi baru Anda.</p>' +
      '<button class="btn btn-primary btn-block btn-lg" style="margin-top:26px" data-act="au-setup-login">Login ke Health <span class="arrow">&rarr;</span></button>' +
      '</div>',
      'auth-thankyou'
    );
  }
  on('au-setup-login', function () {
    renderAuth('login');
    var el = document.getElementById('au-email'); if (el && _setupEmail) el.value = _setupEmail;
  });
  on('au-appsetup', function () {
    var p1 = document.getElementById('au-pass').value;
    var p2 = document.getElementById('au-pass2').value;
    if (p1.length < 8) return toast('Kata sandi minimal 8 karakter');
    if (p1 !== p2) return toast('Kata sandi tidak cocok');
    if (!_appSetupToken) return toast('Tautan tidak valid.');
    var btn = document.querySelector('[data-act="au-appsetup"]');
    if (btn) { btn.disabled = true; btn.textContent = 'Menyimpan…'; }
    fetch(AUTH_BASE + '/api/app-auth/setup', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: _appSetupToken, password: p1 })
    }).then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { status: r.status, j: j }; }); })
      .then(function (res) {
        if (res.status !== 200 || !res.j || !res.j.ok) { throw new Error((res.j && res.j.error) || 'Gagal'); }
        try { history.replaceState(null, '', location.pathname); } catch (e) {}
        // Success screen with a tick, then they log in to confirm it works.
        renderAppSetupDone(res.j.email);
      })
      .catch(function (err) {
        if (btn) { btn.disabled = false; btn.innerHTML = 'Buat Kata Sandi <span class="arrow">&rarr;</span>'; }
        toast((err && err.message) || 'Gagal menyimpan');
      });
  });

  function renderThankYou() {
    authShell(
      '<div class="ty"><div class="ty-check">' + svg('check', 40) + '</div>' +
      '<div class="auth-eyebrow" style="text-align:center">Akun · Berhasil</div>' +
      '<h1 class="auth-title" style="text-align:center">Terima kasih!</h1>' +
      '<p class="auth-sub" style="text-align:center;margin:0 auto">Akun kamu sudah dibuat' + (_lastName ? ', <strong>' + esc(_lastName) + '</strong>' : '') + '. Selamat berlatih bersama Sterith.</p>' +
      '<button class="btn btn-primary btn-block btn-lg" style="margin-top:26px" data-act="au-enter">Masuk ke aplikasi <span class="arrow">&rarr;</span></button>' +
      '</div>',
      'auth-thankyou'
    );
  }

  on('au-eye', function (t) {
    var inp = document.getElementById(t.dataset.for);
    if (!inp) return;
    var show = inp.type === 'password';
    inp.type = show ? 'text' : 'password';
    t.innerHTML = svg(show ? 'eyeoff' : 'eye', 18);
  });
  on('au-to-register', function () { window.location.href = DAFTAR_URL; });
  on('au-to-login', function () { renderAuth('login'); });
  on('au-to-forgot', function () { renderAuth('forgot'); });
  on('au-forgot', function () {
    var email = document.getElementById('au-email').value.trim();
    if (!validEmail(email)) return toast('Email tidak valid');
    if (!sb) return toast('Tidak ada koneksi. Coba lagi.');
    var btn = document.querySelector('[data-act="au-forgot"]');
    if (btn) { btn.disabled = true; btn.textContent = 'Mengirim…'; }
    // Issue a fresh Health setup link (resets the Health password specifically).
    fetch(AUTH_BASE + '/api/app-auth/forgot', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, app: 'health' })
    }).then(function () {
        toast('Jika email terdaftar, tautan buat kata sandi baru sudah dikirim. Cek inbox / spam.');
        renderAuth('login');
      })
      .catch(function () {
        if (btn) { btn.disabled = false; btn.innerHTML = 'Kirim Tautan Reset <span class="arrow">&rarr;</span>'; }
        toast('Gagal mengirim. Coba lagi.');
      });
  });
  on('au-register', function () {
    var name = (document.getElementById('au-name').value || '').trim();
    var wa = (document.getElementById('au-wa').value || '').trim();
    var address = (document.getElementById('au-address').value || '').trim();
    var email = document.getElementById('au-email').value.trim();
    var pass = document.getElementById('au-pass').value;
    var pass2 = document.getElementById('au-pass2').value;
    if (!name) return toast('Isi nama kamu');
    if (!validEmail(email)) return toast('Email tidak valid');
    if (pass.length < 8) return toast('Kata sandi minimal 8 karakter');
    if (pass !== pass2) return toast('Kata sandi tidak cocok');
    if (!sb) return toast('Tidak ada koneksi. Coba lagi.');
    var btn = document.querySelector('[data-act="au-register"]');
    if (btn) { btn.disabled = true; btn.textContent = 'Mendaftar…'; }
    sb.auth.signUp({ email: email, password: pass, options: { data: { name: name, wa_number: wa, address: address } } })
      .then(function (res) {
        if (res.error) throw res.error;
        setDemo(false); setAuthed(true);
        var p = S.getProfile(); p.name = name; p.address = address; p.whatsapp = wa; S.saveProfile(p);
        _lastName = name;
        return claimSession().then(function () { return cloudPushNow(); }).then(function () { renderAuth('thankyou'); });
      })
      .catch(function (err) {
        if (btn) { btn.disabled = false; btn.innerHTML = 'Daftar <span class="arrow">&rarr;</span>'; }
        var m = (err && err.message) || '';
        toast(/registered|already/i.test(m) ? 'Email sudah terdaftar. Silakan masuk.' : (m || 'Gagal mendaftar'));
      });
  });
  on('au-setpass', function () {
    var p1 = document.getElementById('au-pass').value;
    var p2 = document.getElementById('au-pass2').value;
    if (p1.length < 8) return toast('Kata sandi minimal 8 karakter');
    if (p1 !== p2) return toast('Kata sandi tidak cocok');
    if (!sb) return toast('Tidak ada koneksi. Coba lagi.');
    var btn = document.querySelector('[data-act="au-setpass"]');
    if (btn) { btn.disabled = true; btn.textContent = 'Menyimpan…'; }
    sb.auth.updateUser({ password: p1 })
      .then(function (res) {
        if (res.error) throw res.error;
        try { history.replaceState(null, '', location.pathname); } catch (e) {}
        toast('Kata sandi tersimpan!');
        return enterIfAccess(true);   // just granted Health; claim this device
      })
      .catch(function (err) {
        if (btn) { btn.disabled = false; btn.innerHTML = 'Aktifkan Akun <span class="arrow">&rarr;</span>'; }
        var m = (err && err.message) || '';
        toast(/expired|invalid|token/i.test(m) ? 'Tautan sudah kadaluarsa. Minta tautan baru.' : (m || 'Gagal menyimpan'));
      });
  });
  on('au-enter', function () { enterApp(); });
  on('au-login', function () {
    var email = document.getElementById('au-email').value.trim();
    var pass = document.getElementById('au-pass').value;
    if (!validEmail(email)) return toast('Email tidak valid');
    if (!sb) return toast('Tidak ada koneksi. Coba lagi.');
    var btn = document.querySelector('[data-act="au-login"]');
    if (btn) { btn.disabled = true; btn.textContent = 'Masuk…'; }
    appAuthLogin(email, pass)
      .then(function () {
        return enterIfAccess(true);   // must be subscribed to Health; claim this device
      })
      .catch(function (err) {
        if (btn) { btn.disabled = false; btn.innerHTML = 'Masuk <span class="arrow">&rarr;</span>'; }
        toast(err && err.locked ? err.message : 'Email atau kata sandi salah');
      });
  });
  on('au-demo', function () {
    seedDemo();
    setDemo(true); setAuthed(true);
    enterApp();
    toast('Mode demo aktif');
  });
  on('logout', function () {
    if (!confirm('Keluar dari akun Anda?')) return;
    closeSheet();
    if (state.session) { state.session = null; } // don't leave an in-progress session behind the gate
    stopSessionWatch(); setLocalSessTok('');
    setAuthed(false); setDemo(false);
    var done = function () { showAuth(); };
    if (sb) { sb.auth.signOut().then(done, done); } else { done(); }
  });
  function enterApp() {
    var el = document.getElementById('auth');
    if (el && el.parentNode) el.parentNode.removeChild(el);
    state.session = S.getDraft();
    state.tab = 'log';
    render();
    startSessionWatch();   // enforce single-device (no-op in demo)
  }

  // ---- Demo data seeding (lets a customer explore a filled-in app instantly) ----
  function seedDemo() {
    S.getLibrary(); // ensure library seeded
    S.saveProfile({ name: 'Andi Pratama', address: 'Jl. Melati No. 12, Bandung', whatsapp: '0812-3456-7890', height: '176', heightUnit: 'cm', gender: 'Male' });
    S.saveSettings({ unit: 'kg' });
    localStorage.setItem('sterith_auth', JSON.stringify({ email: 'demo@sterith.app', pass: 'demo1234', name: 'Andi Pratama' }));

    function set(w, r) { return { weight: String(w), reps: String(r), done: true }; }
    function ex(name, cat, sets) { return { id: S.uid(), exId: null, name: name, category: cat, categoryType: 'strength', note: '', sets: sets }; }
    function log(daysAgo, hour, name, dur, exs) {
      var d = new Date(); d.setDate(d.getDate() - daysAgo); d.setHours(hour, 0, 0, 0);
      var st = d.getTime();
      return { id: S.uid(), startedAt: st, unit: 'kg', name: name, exercises: exs, finishedAt: st + dur * 60000, durationSec: dur * 60 };
    }
    function push(b) { return [
      ex('Barbell Bench Press', 'Chest', [set(55 + b, 10), set(65 + b, 8), set(70 + b, 6, 50)]),
      ex('Incline Dumbbell Press', 'Chest', [set(22 + b, 10), set(24 + b, 8)]),
      ex('Machine Shoulder Press', 'Shoulder', [set(38 + b, 12), set(43 + b, 10)]),
      ex('Lateral Raises', 'Shoulder', [set(9, 15), set(11, 12)]),
      ex('Cable Overhead Tri Extension', 'Arms', [set(22 + b, 12), set(27 + b, 10)])
    ]; }
    function pull(b) { return [
      ex('Deadlift', 'Back', [set(90 + b * 2, 5), set(100 + b * 2, 4), set(110 + b * 2, 3, 40)]),
      ex('Lat Pulldown', 'Back', [set(50 + b, 12), set(55 + b, 10)]),
      ex('Seated Cable Row', 'Back', [set(45 + b, 12), set(50 + b, 10)]),
      ex('Barbell Curl', 'Arms', [set(25 + b, 12), set(30 + b, 10)]),
      ex('Hammer Curl', 'Arms', [set(12 + b, 12), set(14 + b, 10)])
    ]; }
    function legs(b) { return [
      ex('Barbell Squat', 'Leg', [set(70 + b * 2, 8), set(80 + b * 2, 6), set(90 + b * 2, 5, 55)]),
      ex('Leg Press', 'Leg', [set(120 + b * 3, 12), set(140 + b * 3, 10)]),
      ex('Leg Curl', 'Leg', [set(35 + b, 12), set(40 + b, 10)]),
      ex('Calf Raises', 'Leg', [set(60 + b, 15), set(70 + b, 15)])
    ]; }

    // Full training history: 3×/week (Mon push, Wed pull, Fri legs) from
    // early January to today, with weights climbing gradually over time.
    var now = new Date();
    function dayLog(dateObj, hour, name, dur, exs) {
      var d = new Date(dateObj); d.setHours(hour, 0, 0, 0);
      var st = d.getTime();
      return { id: S.uid(), startedAt: st, unit: 'kg', name: name, exercises: exs, finishedAt: st + dur * 60000, durationSec: dur * 60 };
    }
    var logs = [];
    var monday = new Date(now.getFullYear(), 0, 5, 18, 0, 0); // first Monday of the year
    var week = 0;
    while (monday <= now) {
      var b = Math.min(12, Math.floor(week / 2)); // progressive overload
      var mon = new Date(monday);
      var wed = new Date(monday); wed.setDate(wed.getDate() + 2);
      var fri = new Date(monday); fri.setDate(fri.getDate() + 4);
      if (mon <= now) logs.push(dayLog(mon, 18, 'Push Day', 56 + (week % 4), push(b)));
      if (wed <= now) logs.push(dayLog(wed, 19, 'Pull Day', 54 + (week % 3), pull(b)));
      if (fri <= now) logs.push(dayLog(fri, 18, 'Leg Day', 44 + (week % 4), legs(b)));
      monday.setDate(monday.getDate() + 7); week++;
    }
    if (logs.length) {
      logs.sort(function (a, b2) { return a.startedAt - b2.startedAt; });
      logs[0].exercises[0].note = 'Hari pertama program. Mulai pelan, fokus teknik.';
      logs[logs.length - 1].exercises[0].note = 'Kuat hari ini, bisa naik lagi minggu depan.';
    }
    S.saveLogs(logs);

    S.saveRoutines([
      { id: S.uid(), name: 'Push Day', exercises: [
        { exId: null, name: 'Barbell Bench Press', category: 'Chest', categoryType: 'strength' },
        { exId: null, name: 'Incline Dumbbell Press', category: 'Chest', categoryType: 'strength' },
        { exId: null, name: 'Machine Shoulder Press', category: 'Shoulder', categoryType: 'strength' },
        { exId: null, name: 'Lateral Raises', category: 'Shoulder', categoryType: 'strength' },
        { exId: null, name: 'Cable Overhead Tri Extension', category: 'Arms', categoryType: 'strength' }
      ]},
      { id: S.uid(), name: 'Pull Day', exercises: [
        { exId: null, name: 'Deadlift', category: 'Back', categoryType: 'strength' },
        { exId: null, name: 'Lat Pulldown', category: 'Back', categoryType: 'strength' },
        { exId: null, name: 'Seated Cable Row', category: 'Back', categoryType: 'strength' },
        { exId: null, name: 'Barbell Curl', category: 'Arms', categoryType: 'strength' },
        { exId: null, name: 'Hammer Curl', category: 'Arms', categoryType: 'strength' }
      ]},
      { id: S.uid(), name: 'Leg Day', exercises: [
        { exId: null, name: 'Barbell Squat', category: 'Leg', categoryType: 'strength' },
        { exId: null, name: 'Leg Press', category: 'Leg', categoryType: 'strength' },
        { exId: null, name: 'Leg Curl', category: 'Leg', categoryType: 'strength' },
        { exId: null, name: 'Calf Raises', category: 'Leg', categoryType: 'strength' }
      ]}
    ]);

    // Weekly Sunday check-ins from January to today: weight trending down,
    // body fat dropping; each check-in also feeds the weight tracker.
    var weights = [], checkins = [];
    var sunday = new Date(now.getFullYear(), 0, 4, 7, 0, 0); // first Sunday of the year
    var cw = 0;
    while (sunday <= now) {
      var wt = Math.round((88 - cw * 0.24) * 10) / 10;
      var bf = Math.round((24.5 - cw * 0.2) * 10) / 10;
      var ts = new Date(sunday).getTime();
      var wid = S.uid();
      weights.push({ id: wid, value: wt, unit: 'kg', ts: ts });
      checkins.push({
        id: S.uid(), ts: ts, weight: wt, weightUnit: 'kg', bodyfat: bf,
        measurements: {
          chest: round1(100 + cw * 0.12),
          arms: round1(36 + cw * 0.06),
          forearm: round1(29 + cw * 0.03),
          waist: round1(88 - cw * 0.18),
          abs: round1(90 - cw * 0.2),
          quad: round1(58 + cw * 0.08),
          calf: round1(38 + cw * 0.03)
        },
        notes: cw === 0 ? 'Mulai program, target turun 6kg.' : '',
        photos: [], weightId: wid
      });
      sunday.setDate(sunday.getDate() + 7); cw++;
    }
    if (checkins.length) checkins[checkins.length - 1].notes = 'Progres mantap, badan makin kering.';
    S.saveWeight(weights);
    S.saveCheckins(checkins);
  }

  // ============================================================ BOOT =========
  buildNav();
  render();
  // Decide the gate from the real Supabase session (async). The launch splash
  // covers this brief check. Demo mode is local-only.
  // Demo never auto-resumes — it's only entered by tapping "Coba demo" in-session.
  setDemo(false);
  // Auto-enter demo when opened with ?demo=true (e.g. the website preview iframe).
  // Same activation as tapping "Coba demo" — local-only, never touches cloud auth.
  if (/[?&]demo=(1|true)\b/i.test(location.search)) {
    seedDemo();
    setDemo(true); setAuthed(true);
    enterApp();
  } else if (sb && _appSetupToken) {
    // New per-app setup link — set Health's own password.
    renderAuth('appsetup');
  } else if (sb && _setpassFlow) {
    // Arrived via a set-password link. The clean token_hash link (sterith.com, no
    // supabase) needs an explicit verifyOtp to establish the session; the older
    // implicit #access_token link settles on its own.
    var _q = new URLSearchParams(location.search || '');
    var _th = _q.get('token_hash');
    if (_th) {
      var _ty = _q.get('type') || 'invite';
      sb.auth.verifyOtp({ type: _ty, token_hash: _th })
        .then(function () { renderAuth('setpass'); })
        .catch(function () { renderAuth('setpass'); });
    } else {
      setTimeout(function () { renderAuth('setpass'); }, 250);
    }
  } else if (sb) {
    sb.auth.getSession().then(function (res) {
      var session = res && res.data && res.data.session;
      if (session) { enterIfAccess(); }
      else { showAuth(); }
    }).catch(function () { showAuth(); });
  } else {
    showAuth();
  }

  // fade out launch splash once the app is up
  (function () {
    var sp = document.getElementById('splash');
    if (!sp) return;
    setTimeout(function () { sp.classList.add('gone'); }, 1050);
    setTimeout(function () { if (sp.parentNode) sp.parentNode.removeChild(sp); }, 1550);
  })();

  // service worker + "update available" prompt
  if ('serviceWorker' in navigator) {
    var _swRefreshing = false;
    // When the (newly activated) worker takes control, reload to show new code.
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (_swRefreshing) return; _swRefreshing = true; window.location.reload();
    });

    // Bottom banner: "Versi baru tersedia · Perbarui". Tapping it activates the
    // waiting worker (SKIP_WAITING) → controllerchange → reload.
    function showUpdatePrompt(reg) {
      if (document.getElementById('sw-update-bar')) return;
      var bar = document.createElement('div');
      bar.id = 'sw-update-bar';
      bar.setAttribute('style', 'position:fixed;left:12px;right:12px;bottom:calc(14px + env(safe-area-inset-bottom));z-index:100000;max-width:440px;margin:0 auto;background:#0D1117;color:#F2EDE3;border:1px solid rgba(201,165,95,.45);border-radius:14px;padding:12px 12px 12px 16px;display:flex;align-items:center;gap:10px;box-shadow:0 14px 44px rgba(0,0,0,.45);font-family:"Hanken Grotesk",system-ui,sans-serif;animation:swUp .28s ease both');
      bar.innerHTML =
        '<span style="flex:1;font-size:13.5px;font-weight:500">Versi baru tersedia</span>' +
        '<button id="sw-update-btn" style="background:#C9A55F;color:#0D1117;border:0;border-radius:9px;padding:9px 16px;font:600 13px/1 \'Hanken Grotesk\',system-ui;cursor:pointer">Perbarui</button>' +
        '<button id="sw-update-x" aria-label="Tutup" style="background:transparent;color:rgba(242,237,227,.55);border:0;font-size:20px;line-height:1;cursor:pointer;padding:2px 6px">&times;</button>';
      if (!document.getElementById('sw-up-style')) {
        var st = document.createElement('style'); st.id = 'sw-up-style';
        st.textContent = '@keyframes swUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}';
        document.head.appendChild(st);
      }
      document.body.appendChild(bar);
      document.getElementById('sw-update-btn').onclick = function () {
        this.textContent = 'Memperbarui…'; this.disabled = true;
        if (reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        else window.location.reload();
      };
      document.getElementById('sw-update-x').onclick = function () { bar.remove(); };
    }

    window.addEventListener('load', function () {
      navigator.serviceWorker.register('./sw.js').then(function (reg) {
        // An update may already be waiting from a previous check.
        if (reg.waiting && navigator.serviceWorker.controller) showUpdatePrompt(reg);
        // A new worker started installing → prompt once it's installed & waiting.
        reg.addEventListener('updatefound', function () {
          var nw = reg.installing;
          if (!nw) return;
          nw.addEventListener('statechange', function () {
            if (nw.state === 'installed' && navigator.serviceWorker.controller) showUpdatePrompt(reg);
          });
        });
        reg.update();
        // Re-check whenever the app is brought back to the foreground.
        document.addEventListener('visibilitychange', function () {
          if (document.visibilityState === 'visible') reg.update();
        });
      }).catch(function () {});
    });
  }
})();
