(function () {
  'use strict';

  var KEY = 'aws-guide:v1';
  var G = (window.GUIDE = { modules: {}, order: [], views: {}, index: {}, cleanups: [] });

  /* ---------- registry ---------- */
  G.register = function (m) {
    G.modules[m.module] = m;
    if (G.order.indexOf(m.module) < 0) G.order.push(m.module);
    G.order.sort();
  };

  function buildIndex() {
    G.index = {};
    G.order.forEach(function (mid) {
      var m = G.modules[mid];
      (m.questions || []).forEach(function (q) { G.index[q.id] = { kind: 'question', module: mid, item: q }; });
      (m.limits || []).forEach(function (l) { G.index[l.id] = { kind: 'limit', module: mid, item: l }; });
      (m.optionGroups || []).forEach(function (g) {
        (g.challenges || []).forEach(function (c) { G.index[c.id] = { kind: 'challenge', module: mid, item: c, group: g }; });
      });
    });
  }

  G.all = function (kind) {
    var out = [];
    Object.keys(G.index).forEach(function (id) { if (G.index[id].kind === kind) out.push(G.index[id]); });
    return out;
  };

  G.linkFor = function (id) {
    var e = G.index[id];
    if (!e) return '#/';
    if (e.kind === 'question') return '#/drill/run?id=' + id;
    if (e.kind === 'limit') return '#/lab/limits?id=' + id;
    return '#/lab/options?g=' + e.group.id + '&id=' + id;
  };

  G.labelFor = function (id) {
    var e = G.index[id];
    if (!e) return id;
    if (e.kind === 'question') return cut(e.item.prompt, 44);
    if (e.kind === 'limit') return e.item.service + ' · ' + e.item.name;
    return cut(e.item.requirement, 44);
  };

  /* ---------- DOM helpers ---------- */
  function add(e, c) {
    if (c == null || c === false) return;
    if (Array.isArray(c)) { c.forEach(function (x) { add(e, x); }); return; }
    e.appendChild(c.nodeType ? c : document.createTextNode(String(c)));
  }
  G.h = function (tag, attrs) {
    var e = document.createElement(tag);
    attrs = attrs || {};
    Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v == null || v === false) return;
      if (k === 'class') e.className = v;
      else if (k === 'html') e.innerHTML = v;
      else if (k === 'value') e.value = v;
      else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), v);
      else e.setAttribute(k, v === true ? '' : v);
    });
    for (var i = 2; i < arguments.length; i++) add(e, arguments[i]);
    return e;
  };

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  G.esc = esc;

  function cut(s, n) { s = String(s).replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1) + '…' : s; }
  G.cut = cut;

  G.shuffle = function (arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  };

  G.highlight = function (text, keywords) {
    var html = esc(text);
    (keywords || []).forEach(function (k) {
      var re = new RegExp(esc(k).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      html = html.replace(re, function (m) { return '<mark>' + m + '</mark>'; });
    });
    return html;
  };

  G.copyText = function (text, onDone) {
    function fallback() {
      var ta = G.h('textarea', { readonly: true, style: 'position:fixed;left:-9999px;top:0' });
      ta.value = text;
      document.body.appendChild(ta);
      ta.focus(); ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      onDone(ok);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { onDone(true); }, fallback);
    } else fallback();
  };

  /* ---------- storage (localStorage, in-memory fallback) ---------- */
  var mem = { results: {}, drafts: {} };
  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) mem = JSON.parse(raw);
    } catch (e) { /* use mem */ }
    mem.results = mem.results || {};
    mem.drafts = mem.drafts || {};
    return mem;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch (e) { /* ignore */ } }

  G.store = {
    results: function () { return load().results; },
    record: function (id, ok) {
      var s = load();
      var r = s.results[id] || { right: 0, wrong: 0 };
      if (ok) r.right++; else r.wrong++;
      r.last = !!ok;
      s.results[id] = r;
      save();
    },
    wrongIds: function () {
      var r = G.store.results();
      return Object.keys(r).filter(function (id) { return r[id].last === false && G.index[id]; });
    },
    draft: function (id, text) {
      var s = load();
      if (text === undefined) return s.drafts[id] || '';
      s.drafts[id] = text;
      save();
    },
    reset: function () { mem = { results: {}, drafts: {} }; save(); }
  };

  /* ---------- shared UI pieces ---------- */
  G.moduleChips = function (selected, onChange) {
    var wrap = G.h('div', { class: 'row' });
    G.order.forEach(function (mid) {
      var chip = G.h('button', { class: 'chip' + (selected[mid] ? ' on' : ''), type: 'button' }, mid + ' ' + G.modules[mid].title);
      chip.addEventListener('click', function () {
        selected[mid] = !selected[mid];
        chip.classList.toggle('on', !!selected[mid]);
        if (onChange) onChange();
      });
      wrap.appendChild(chip);
    });
    return wrap;
  };

  G.supplementBadge = function (item) {
    return item.supplement ? G.h('span', { class: 'badge warn', title: 'เนื้อหาเติมจากนอกสไลด์' }, 'นอก notes') : null;
  };

  G.progress = function (mid) {
    var m = G.modules[mid], res = G.store.results();
    var ids = [];
    (m.questions || []).forEach(function (q) { ids.push(q.id); });
    (m.limits || []).forEach(function (l) { ids.push(l.id); });
    (m.optionGroups || []).forEach(function (g) { (g.challenges || []).forEach(function (c) { ids.push(c.id); }); });
    var done = ids.filter(function (id) { return res[id]; }).length;
    return { done: done, total: ids.length };
  };

  /* ---------- router ---------- */
  function parseHash() {
    var raw = (location.hash || '#/').slice(1);
    var qi = raw.indexOf('?');
    var path = qi < 0 ? raw : raw.slice(0, qi);
    var query = {};
    if (qi >= 0) {
      raw.slice(qi + 1).split('&').forEach(function (kv) {
        if (!kv) return;
        var p = kv.split('=');
        query[decodeURIComponent(p[0])] = decodeURIComponent(p.slice(1).join('=') || '');
      });
    }
    var parts = path.split('/').filter(Boolean);
    return { parts: parts, query: query };
  }

  function route() {
    G.cleanups.forEach(function (fn) { try { fn(); } catch (e) { /* ignore */ } });
    G.cleanups = [];
    var r = parseHash();
    var name = r.parts[0] || 'home';
    var view = G.views[name] || G.views.home;
    var root = document.getElementById('app');
    root.innerHTML = '';
    var links = document.querySelectorAll('#nav a');
    for (var i = 0; i < links.length; i++) links[i].classList.toggle('active', links[i].getAttribute('data-route') === name);
    try { view(root, r.parts, r.query); }
    catch (err) {
      root.appendChild(G.h('div', { class: 'card' }, G.h('h2', {}, 'เกิดข้อผิดพลาด'), G.h('pre', {}, String(err && err.stack || err))));
    }
    window.scrollTo(0, 0);
  }

  G.start = function () {
    buildIndex();
    window.addEventListener('hashchange', route);
    route();
  };

  /* ---------- home ---------- */
  G.views.home = function (root) {
    var h = G.h;
    root.appendChild(h('h1', {}, 'AWS Exam Trainer'));
    root.appendChild(h('p', { class: 'muted' }, 'ฝึกสำหรับสอบปลายภาค M07–M13 ลงมือตอบเอง ชนลิมิตเอง วาด flow เอง'));

    var wrong = G.store.wrongIds().length;
    root.appendChild(h('div', { class: 'row', style: 'margin:14px 0 20px' },
      h('a', { class: 'btn primary', href: '#/drill/run?n=10' }, 'สุ่มโจทย์ 10 ข้อ'),
      h('a', { class: 'btn', href: '#/mistakes' }, 'ข้อที่เคยผิด (' + wrong + ')')
    ));

    var grid = h('div', { class: 'grid' });
    G.order.forEach(function (mid) {
      var m = G.modules[mid], p = G.progress(mid);
      var pct = p.total ? Math.round((p.done / p.total) * 100) : 0;
      grid.appendChild(h('a', { class: 'card link', href: '#/notes/' + mid },
        h('div', { class: 'small muted' }, mid),
        h('h3', {}, m.title),
        h('div', { class: 'small muted' }, m.summary),
        h('div', { class: 'bar' }, h('i', { style: 'width:' + pct + '%' })),
        h('div', { class: 'small muted', style: 'margin-top:4px' }, 'ทำแล้ว ' + p.done + '/' + p.total)
      ));
    });
    root.appendChild(grid);

    root.appendChild(h('p', { class: 'small muted', style: 'margin-top:20px' },
      'ความคืบหน้าเก็บไว้ในเครื่องนี้เท่านั้น ',
      h('button', {
        class: 'btn small', type: 'button', onclick: function () {
          if (confirm('ล้างความคืบหน้าทั้งหมดในเครื่องนี้?')) { G.store.reset(); route(); }
        }
      }, 'ล้างความคืบหน้า')
    ));
  };

  /* ---------- mistakes ---------- */
  G.views.mistakes = function (root) {
    var h = G.h;
    root.appendChild(h('h1', {}, 'ข้อที่เคยผิด'));
    var ids = G.store.wrongIds();
    if (!ids.length) {
      root.appendChild(h('div', { class: 'card muted' }, 'ยังไม่มีข้อที่ผิด ไปลองทำโจทย์ได้เลย'));
      return;
    }
    var qs = ids.filter(function (id) { return G.index[id].kind === 'question'; });
    if (qs.length) root.appendChild(h('p', {}, h('a', { class: 'btn primary', href: '#/drill/run?mistakes=1' }, 'ฝึกโจทย์ที่ผิดซ้ำ (' + qs.length + ' ข้อ)')));
    var kindName = { question: 'โจทย์', limit: 'ลิมิต', challenge: 'เลือก Option' };
    ids.forEach(function (id) {
      var e = G.index[id];
      root.appendChild(h('a', { class: 'card link', href: G.linkFor(id) },
        h('div', { class: 'small muted' }, e.module + ' · ' + kindName[e.kind]),
        h('div', {}, G.labelFor(id))));
    });
  };
})();
