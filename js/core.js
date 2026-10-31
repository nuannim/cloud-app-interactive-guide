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

  // Knowledge Check: เพิ่มเป็นโจทย์ type 'kc' ของโมดูลนั้น (เรียกจาก data/kc.js หลังไฟล์โมดูล)
  G.registerKC = function (mid, kc) {
    var m = G.modules[mid];
    if (!m) return;
    m.questions = m.questions || [];
    kc.questions.forEach(function (q) { m.questions.push(Object.assign({ type: 'kc', format: 'choice' }, q)); });
    m.kc = { summary: kc.summary, remember: kc.remember };
  };

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
  var mem = { results: {}, drafts: {}, read: {}, days: {}, plan: null };
  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      // ล้างข้อมูลไซต์ระหว่างเปิดหน้า = เริ่มใหม่จริง (ไม่ใช้ค่าเก่าที่ค้างในหน่วยความจำ)
      mem = raw ? JSON.parse(raw) : { results: {}, drafts: {}, read: {}, days: {}, plan: null };
    } catch (e) { /* localStorage ใช้ไม่ได้ (เช่น private mode): ใช้ค่าในหน่วยความจำต่อ */ }
    mem.results = mem.results || {};
    mem.drafts = mem.drafts || {};
    mem.read = mem.read || {};  // โมดูลที่กด "อ่านจบแล้ว"
    mem.days = mem.days || {};  // วันที่ -> จำนวนข้อที่ทำ (ใช้นับสตรีก)
    return mem;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch (e) { /* ignore */ } }
  function dayKey(d) {
    d = d || new Date();
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  }
  G.dayKey = dayKey;
  // แจ้งส่วนอื่น (เช่น sidebar แผนสอบ) ว่าความคืบหน้าเปลี่ยน
  function progressChanged() {
    try { document.dispatchEvent(new CustomEvent('aws-progress')); } catch (e) { /* ignore */ }
  }

  G.store = {
    results: function () { return load().results; },
    record: function (id, ok) {
      var s = load();
      var r = s.results[id] || { right: 0, wrong: 0 };
      if (ok) r.right++; else r.wrong++;
      r.last = !!ok;
      s.results[id] = r;
      var k = dayKey();
      s.days[k] = (s.days[k] || 0) + 1;
      save();
      progressChanged();
    },
    // แผนเตรียมสอบ {days, start}
    plan: function () { return load().plan; },
    setPlan: function (days) { var s = load(); s.plan = { days: days, start: dayKey() }; save(); },
    markRead: function (mid, on) { var s = load(); if (on === false) delete s.read[mid]; else s.read[mid] = dayKey(); s.days[dayKey()] = (s.days[dayKey()] || 0) + 1; save(); progressChanged(); },
    isRead: function (mid) { return !!load().read[mid]; },
    // XP: ตอบถูก 10 ตอบผิด 4 (ผิดแล้วได้ทบทวน ก็ยังนับว่าได้ฝึก)
    xp: function () {
      var r = load().results, n = 0;
      Object.keys(r).forEach(function (id) { n += r[id].right * 10 + r[id].wrong * 4; });
      return n;
    },
    // สตรีก: จำนวนวันติดกันที่มีการฝึก (ถ้าวันนี้ยังไม่ได้ฝึก นับต่อจากเมื่อวานได้)
    streak: function () {
      var days = load().days, d = new Date(), n = 0;
      if (!days[dayKey(d)]) d.setDate(d.getDate() - 1);
      while (days[dayKey(d)]) { n++; d.setDate(d.getDate() - 1); }
      return n;
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
    reset: function () { mem = { results: {}, drafts: {}, read: {}, days: {}, plan: null }; save(); }
  };

  /* ---------- ไอคอน SVG วาดเอง (เส้นหนาเท่ากันทุกตัว ใช้ currentColor) ---------- */
  var ICONS = {
    read: ['M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2V5z', 'M4 19a2 2 0 0 1 2-2h12'],
    kc: ['M9 4h6v3H9z', 'M7 5H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-1', 'M8.5 14l2.5 2.5 4.5-4.5'],
    detail: ['M4 7h10', 'M18 7h2', 'M4 17h2', 'M10 17h10', 'M14 5v4', 'M6 15v4'],
    scenario: ['M6 21V4', 'M6 5h11l-2 4 2 4H6'],
    design: ['M5 5h5v5H5z', 'M14 5h5v5h-5z', 'M9.5 16h5v5h-5z', 'M10 7.5h4', 'M7.5 10v3.5h9V10', 'M12 13.5V16'],
    checkpoint: ['M8 4h8v5a4 4 0 0 1-8 0V4z', 'M8 6H5a3 3 0 0 0 3 4', 'M16 6h3a3 3 0 0 1-3 4', 'M12 13v4', 'M9 20h6', 'M10 17h4'],
    check: ['M5 12.5l4.5 4.5L19 7.5'],
    chevron: ['M15 6l-6 6 6 6'],
    menu: ['M4 7h16', 'M4 12h16', 'M4 17h16']
  };
  var FILLED = {
    star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z',
    flame: 'M12 3c1 3.5 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5 0 2 1 3 2 3 0-3-1-5 1-8.5z',
    bolt: 'M13 3L5 13h6l-1 8 8-10h-6z'
  };
  G.icon = function (name, size) {
    var NS = 'http://www.w3.org/2000/svg', svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('width', size || 24); svg.setAttribute('height', size || 24);
    svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('focusable', 'false');
    if (FILLED[name]) {
      var f = document.createElementNS(NS, 'path'); f.setAttribute('d', FILLED[name]); f.setAttribute('fill', 'currentColor');
      svg.appendChild(f);
    } else {
      svg.setAttribute('fill', 'none'); svg.setAttribute('stroke', 'currentColor'); svg.setAttribute('stroke-width', '2');
      svg.setAttribute('stroke-linecap', 'round'); svg.setAttribute('stroke-linejoin', 'round');
      (ICONS[name] || ICONS.check).forEach(function (d) { var p = document.createElementNS(NS, 'path'); p.setAttribute('d', d); svg.appendChild(p); });
    }
    return svg;
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

  G.counts = function (mid) {
    var m = G.modules[mid], q = m.questions || [];
    return {
      scenario: q.filter(function (x) { return x.type === 'scenario'; }).length,
      design: q.filter(function (x) { return x.type === 'design'; }).length,
      kc: q.filter(function (x) { return x.type === 'kc'; }).length,
      detail: (m.optionGroups || []).reduce(function (n, g) { return n + (g.challenges || []).length; }, 0),
      limits: (m.limits || []).length
    };
  };

  G.updateBadge = function () {
    var el = document.getElementById('wrong-count');
    if (!el) return;
    var n = G.store.wrongIds().length;
    el.textContent = n;
    el.hidden = n === 0;
  };

  // บนมือถือ เฉลยมักอยู่ใต้ขอบจอ เลื่อนให้เห็นหลังตอบ
  G.reveal = function (el, block) {
    if (el && el.scrollIntoView) el.scrollIntoView({ block: block || 'nearest' });
  };

  /* ---------- topic lookup: ข้อนี้มาจากหัวข้อสรุปไหน ---------- */
  var topicCache = {};
  function words(s) { return String(s).toLowerCase().match(/[a-z][a-z0-9.+@-]{2,}/g) || []; }
  function plain(html) { return String(html).replace(/<[^>]+>/g, ' '); }
  function itemText(e) {
    var i = e.item;
    if (e.kind === 'question') return i.prompt + ' ' + (i.choices || []).filter(function (c) { return c.correct; }).map(function (c) { return c.text; }).join(' ') + ' ' + (i.explain || '');
    if (e.kind === 'challenge') return i.requirement + ' ' + i.answer + ' ' + i.why;
    return i.service + ' ' + i.name + ' ' + i.display;
  }

  G.topicFor = function (id) {
    if (topicCache[id] !== undefined) return topicCache[id];
    var e = G.index[id], res = null;
    if (e) {
      var notes = G.modules[e.module].notes || [], i;
      if (e.item.topic != null && notes[e.item.topic]) res = { module: e.module, index: e.item.topic };
      for (i = 0; !res && i < notes.length; i++) if ((notes[i].refs || []).indexOf(id) >= 0) res = { module: e.module, index: i };
      for (i = 0; !res && e.group && i < notes.length; i++) if ((notes[i].refs || []).indexOf(e.group.id) >= 0) res = { module: e.module, index: i };
      if (!res) { // สำรอง: นับคำภาษาอังกฤษที่ซ้ำกับเนื้อหาของแต่ละหัวข้อ
        var mine = words(itemText(e)), best = 0;
        notes.forEach(function (n, k) {
          var pool = words(n.heading + ' ' + plain(n.body)), score = 0;
          mine.forEach(function (w) { if (pool.indexOf(w) >= 0) score++; });
          if (score > best) { best = score; res = { module: e.module, index: k }; }
        });
      }
      if (res) res.heading = notes[res.index].heading;
    }
    topicCache[id] = res;
    return res;
  };

  // ลิงก์เปิดแท็บใหม่ไปหัวข้อสรุปที่เกี่ยวข้อง (ความคืบหน้าอยู่ใน localStorage ร่วมกัน จึงไม่หาย)
  G.topicLink = function (id, wrong) {
    var t = G.topicFor(id);
    if (!t) return G.h('span');
    return G.h('p', { class: 'topic' + (wrong ? ' wrong' : '') },
      G.h('span', { class: 'lead' }, wrong ? 'ยังตอบไม่ได้? ลองกลับไปอ่านเรื่อง ' : 'เรื่องที่เกี่ยวข้อง: '),
      G.h('a', { href: '#/notes/' + t.module + '?s=' + t.index, target: '_blank', rel: 'noopener' }, t.module + ' ' + G.modules[t.module].title + ' › ' + t.heading),
      G.h('span', { class: 'small muted' }, ' (เปิดแท็บใหม่)'));
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
    // โหมด roadmap: หน้าที่เปิดด้วย ?rm=<คีย์บทเรียน> ถูกห่อด้วย sidebar แผนสอบ (พับได้) เพื่อให้รู้ว่าอยู่ตรงไหนของแผน
    var host = root, inSession = !!(r.query.rm && name !== 'roadmap' && G.roadmap && G.roadmap.hasKey(r.query.rm));
    root.classList.toggle('has-rm', inSession);
    if (inSession) {
      var shell = G.h('div', { class: 'rm-shell' });
      host = G.h('div', { class: 'rm-main' });
      G.roadmap.mountSidebar(shell, r.query.rm);
      shell.appendChild(host);
      root.appendChild(shell);
    }
    try { view(host, r.parts, r.query); }
    catch (err) {
      host.appendChild(G.h('div', { class: 'card' }, G.h('h2', {}, 'เกิดข้อผิดพลาด'), G.h('pre', {}, String(err && err.stack || err))));
    }
    G.updateBadge();
    window.scrollTo(0, 0);
  }

  G.start = function () {
    buildIndex();
    window.addEventListener('hashchange', route);
    route();
  };

  /* ---------- home ---------- */
  /* หน้าแรก = ศูนย์รวมการฝึก จัดตามแบบข้อสอบ 3 แบบ (Scenario / Detail / Design) */
  G.views.home = function (root) {
    var h = G.h, tot = { scenario: 0, design: 0, detail: 0, kc: 0 };
    G.order.forEach(function (mid) {
      var c = G.counts(mid);
      tot.scenario += c.scenario; tot.design += c.design; tot.detail += c.detail; tot.kc += c.kc;
    });

    function moduleLinks(label, key, hrefFor) {
      var row = h('div', { class: 'row picker' }, h('span', { class: 'small muted' }, label));
      G.order.forEach(function (mid) {
        var n = G.counts(mid)[key];
        if (n) row.appendChild(h('a', { class: 'chip', href: hrefFor(mid) }, mid + ' · ' + n));
      });
      return row;
    }

    function section(id, title, desc, actions, picker) {
      return h('section', { class: 'practice', 'aria-labelledby': id },
        h('h2', { id: id }, title),
        h('p', { class: 'muted' }, desc),
        h('div', { class: 'row' }, actions),
        picker);
    }

    var wrong = G.store.wrongIds().length;
    root.appendChild(h('h1', {}, 'ฝึกตามแบบข้อสอบ'));
    var nxt = G.roadmap && G.roadmap.next();
    root.appendChild(h('div', { class: 'row', style: 'margin:4px 0 8px' },
      G.roadmap && G.store.plan()
        ? (nxt ? h('a', { class: 'btn primary', href: '#/roadmap' }, 'ต่อแผนสอบ: ' + (nxt.mid ? nxt.mid + ' ' : '') + nxt.title) : h('a', { class: 'btn', href: '#/roadmap' }, 'ดูแผนสอบ (ครบแล้ว)'))
        : h('a', { class: 'btn primary', href: '#/roadmap' }, 'ตั้งแผนเตรียมสอบ'),
      h('a', { class: 'btn', href: '#/drill/run?n=10' }, 'สุ่ม 10 ข้อ ทุกประเภท'),
      wrong ? h('a', { class: 'btn', href: '#/mistakes' }, 'ทบทวนข้อที่เคยผิด (' + wrong + ')') : null));

    root.appendChild(section('p-scenario', 'Scenario (' + tot.scenario + ' ข้อ)',
      'อ่านสถานการณ์ของธุรกิจ แล้วเลือกหรือเขียนว่าควรใช้ service ไหน เพราะอะไร',
      [h('a', { class: 'btn', href: '#/drill/run?t=scenario&n=10' }, 'สุ่ม 10 ข้อ'),
        h('a', { class: 'btn', href: '#/drill/run?t=scenario&n=all' }, 'ทำทั้งหมด')],
      moduleLinks('เลือกโมดูล', 'scenario', function (mid) { return '#/drill/run?t=scenario&m=' + mid + '&n=all'; })));

    root.appendChild(section('p-detail', 'Detail (' + tot.detail + ' ข้อ)',
      'โจทย์สั้น ๆ ที่ต้องโยงไปยังรายละเอียดของ service เช่น โหมด ตัวเลือก หรือค่าลิมิต',
      [h('a', { class: 'btn', href: '#/lab/options' }, 'เลือก Option'),
        h('a', { class: 'btn', href: '#/lab/limits' }, 'ชนลิมิต'),
        h('a', { class: 'btn', href: '#/lab/guess' }, 'เดาตัวเลข')]));

    root.appendChild(section('p-design', 'Design — วาด diagram (' + tot.design + ' ข้อ)',
      'โจทย์ยาว เกี่ยวกับหลาย service ตอบด้วยข้อความคู่กับแผนภาพ มีที่วาดและดูแผนภาพเฉลยได้',
      [h('a', { class: 'btn', href: '#/drill/run?t=design&n=all' }, 'ฝึกวาดทั้งหมด'),
        h('a', { class: 'btn', href: '#/drill/run?t=design&n=1' }, 'สุ่ม 1 ข้อ')],
      moduleLinks('เลือกโมดูล', 'design', function (mid) { return '#/drill/run?t=design&m=' + mid + '&n=all'; })));

    if (tot.kc) {
      root.appendChild(section('p-kc', 'Knowledge Check (' + tot.kc + ' ข้อ)',
        'ข้อสอบฝึกของ AWS Academy ตัวเลือก 4 ข้อ มีเฉลยและเหตุผลภาษาไทย ใกล้รูปแบบข้อสอบจริง',
        [h('a', { class: 'btn', href: '#/drill/run?t=kc&n=10' }, 'สุ่ม 10 ข้อ'),
          h('a', { class: 'btn', href: '#/drill/run?t=kc&n=all' }, 'ทำทั้งหมด')],
        moduleLinks('เลือกโมดูล', 'kc', function (mid) { return '#/drill/run?t=kc&m=' + mid + '&n=all'; })));
    }

    root.appendChild(h('h2', { style: 'margin-top:28px' }, 'สรุปรายโมดูล'));
    var list = h('div', { class: 'modlist' });
    G.order.forEach(function (mid) {
      var m = G.modules[mid], p = G.progress(mid), c = G.counts(mid);
      var pct = p.total ? Math.round((p.done / p.total) * 100) : 0;
      list.appendChild(h('a', { class: 'modrow', href: '#/notes/' + mid },
        h('span', { class: 'modname' }, mid + ' ' + m.title),
        h('span', { class: 'small muted modsum' }, m.summary),
        h('span', { class: 'small muted modmeta' }, c.scenario + ' scenario · ' + c.design + ' design · ' + c.detail + ' detail · ' + c.kc + ' KC · ทำแล้ว ' + p.done + '/' + p.total),
        h('span', { class: 'bar' }, h('i', { style: 'width:' + pct + '%' }))));
    });
    root.appendChild(list);

    root.appendChild(h('p', { class: 'small muted', style: 'margin-top:24px' },
      'ความคืบหน้าเก็บไว้ในเครื่องนี้เท่านั้น ',
      h('button', {
        class: 'btn small', type: 'button', onclick: function () {
          if (confirm('ล้างความคืบหน้าทั้งหมดในเครื่องนี้?')) { G.store.reset(); route(); }
        }
      }, 'ล้างความคืบหน้า')));
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
