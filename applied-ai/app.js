/* ข้อสอบเก็ง Applied AI for IT: หน้าเว็บ static ล้วน ไม่มีเซิร์ฟเวอร์
 * คะแนนและคำตอบเก็บใน localStorage ของ browser เท่านั้น ไม่ส่งไปที่ไหน
 * เส้นทาง (hash):  #/  หน้าแรก · #/run/<idx>  ทำข้อ · #/result  สรุปรอบ · #/q/<n>  ทบทวนข้อเดียว */
(function () {
  'use strict';

  var D = window.APPLIED_QUIZ, MD = window.MiniMD;
  var app = document.getElementById('app');
  var live = document.getElementById('live');
  var pill = document.getElementById('score-pill');
  if (!D || !MD) { app.textContent = 'โหลดข้อมูลข้อสอบไม่สำเร็จ ลองรีเฟรชหน้า'; return; }

  var Q = D.questions, byN = {}, SECS = D.sections, LET = ['ก', 'ข', 'ค', 'ง', 'จ'];
  Q.forEach(function (q) { byN[q.n] = q; });
  var secById = {};
  SECS.forEach(function (s) { secById[s.id] = s; });

  /* ---------- เก็บข้อมูล (ถ้า localStorage ใช้ไม่ได้ ยังทำต่อได้แต่ไม่จำ) ---------- */
  var KEY = 'applied-ai-quiz:v1';
  var storageOk = true;
  function fresh() { return { answers: {}, session: null, mode: 'practice' }; }
  function isObj(x) { return x !== null && typeof x === 'object' && !Array.isArray(x); }
  // ข้อมูลใน localStorage อาจเสียหรือมาจากเวอร์ชันเก่า: ตรวจรูปร่างทุกค่า เก็บเฉพาะที่ใช้ได้ ที่เหลือทิ้ง
  // ok คำนวณใหม่จากเฉลยปัจจุบันเสมอ (ถ้าแก้เฉลยแล้ว build ใหม่ คะแนนเก่าในเครื่องจะไม่ผิดตาม)
  function sanitize(s) {
    var out = fresh();
    if (!isObj(s)) return out;
    if (s.mode === 'exam' || s.mode === 'practice') out.mode = s.mode;
    if (isObj(s.answers)) {
      Object.keys(s.answers).forEach(function (k) {
        var n = Number(k), r = s.answers[k];
        if (byN[n] && isObj(r) && LET.indexOf(r.c) >= 0) out.answers[n] = { c: r.c, ok: r.c === byN[n].answer, t: Number(r.t) || 0 };
      });
    }
    var ss = s.session;
    if (isObj(ss) && (ss.mode === 'exam' || ss.mode === 'practice') && Array.isArray(ss.queue) && ss.queue.length &&
        ss.queue.every(function (n) { return typeof n === 'number' && byN[n]; })) {
      var inQ = {}, picks = {}, revealed = {};
      ss.queue.forEach(function (n) { inQ[n] = true; });
      if (isObj(ss.picks)) Object.keys(ss.picks).forEach(function (k) { if (inQ[k] && LET.indexOf(ss.picks[k]) >= 0) picks[k] = ss.picks[k]; });
      if (isObj(ss.revealed)) Object.keys(ss.revealed).forEach(function (k) { if (inQ[k] && ss.revealed[k]) revealed[k] = true; });
      var idx = Math.floor(Number(ss.idx));
      if (!(idx >= 0)) idx = 0; // NaN หรือติดลบ
      out.session = {
        label: typeof ss.label === 'string' ? ss.label : 'ทำต่อ', mode: ss.mode, queue: ss.queue.slice(),
        idx: Math.min(idx, ss.queue.length - 1), picks: picks, revealed: revealed, done: ss.done === true
      };
    }
    return out;
  }
  function load() {
    var raw = null;
    try { raw = window.localStorage.getItem(KEY); } catch (e) { storageOk = false; return fresh(); }
    if (!raw) return fresh();
    try { return sanitize(JSON.parse(raw)); } catch (e) { return fresh(); } // JSON เสีย: เริ่มใหม่ (storage ปกติ ไม่ใช่ถูกบล็อก)
  }
  var state = load();
  function save() {
    try { window.localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { storageOk = false; }
  }
  try { window.localStorage.setItem(KEY + ':probe', '1'); window.localStorage.removeItem(KEY + ':probe'); } catch (e) { storageOk = false; }

  /* ---------- ตัวช่วยสร้าง DOM ---------- */
  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      var v = attrs[k];
      if (v === false || v == null) return;
      if (k === 'html') n.innerHTML = v; // ใช้กับผลของ MiniMD เท่านั้น (escape แล้ว)
      else if (k === 'text') n.textContent = v;
      else if (k.slice(0, 2) === 'on') n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v === true ? '' : v);
    });
    (kids || []).forEach(function (c) { if (c != null) n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return n;
  }
  function go(hash) { if (location.hash === hash) route(); else location.hash = hash; }
  function say(msg) { live.textContent = ''; setTimeout(function () { live.textContent = msg; }, 30); }
  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }

  function stats(list) {
    var a = 0, c = 0;
    list.forEach(function (q) { var r = state.answers[q.n]; if (r) { a++; if (r.ok) c++; } });
    return { a: a, c: c, n: list.length };
  }
  function updatePill() {
    var s = stats(Q);
    pill.hidden = s.a === 0;
    pill.textContent = 'ถูก ' + s.c + ' จาก ' + s.a + ' ข้อที่ตอบ';
  }
  function bar(pct, cls) { return el('div', { class: 'bar' + (cls ? ' ' + cls : ''), role: 'img', 'aria-label': Math.round(pct) + ' เปอร์เซ็นต์' }, [el('i', { style: 'width:' + Math.max(0, Math.min(100, pct)) + '%' })]); }

  /* ---------- เริ่มรอบทำข้อสอบ ---------- */
  function start(label, nums, mode) {
    if (!nums.length) return;
    state.session = { label: label, mode: mode, queue: nums, idx: 0, picks: {}, revealed: {}, done: false };
    save();
    go('#/run/0');
  }

  /* ---------- หน้าแรก ---------- */
  function viewHome() {
    var all = stats(Q), wrong = Q.filter(function (q) { return state.answers[q.n] && !state.answers[q.n].ok; });
    var todo = Q.filter(function (q) { return !state.answers[q.n]; });
    var root = el('div');

    root.appendChild(el('h1', { text: 'Applied AI for IT: ข้อสอบเก็ง' }));
    root.appendChild(el('p', { class: 'muted', text: Q.length + ' ข้อ ปรนัย 5 ตัวเลือก ก–จ ครอบคลุม Streamlit, caching, session state, Supabase, deployment และ AI-assisted development' }));

    var sum = el('div', { class: 'card' });
    sum.appendChild(el('div', { class: 'row between' }, [
      el('p', { class: 'big', text: all.a ? all.c + ' / ' + all.a : 'ยังไม่ได้ทำ' }),
      el('span', { class: 'muted', text: all.a ? 'ตอบแล้ว ' + all.a + ' จาก ' + all.n + ' ข้อ' : 'เลือกชุดข้างล่างเพื่อเริ่ม' })
    ]));
    sum.appendChild(bar(all.a ? (100 * all.c) / all.n : 0));
    if (all.a) {
      sum.appendChild(el('p', { class: 'muted', style: 'margin:8px 0 0', text: 'แถบเขียวคือสัดส่วนข้อที่ตอบถูกจากทั้งหมด ' + all.n + ' ข้อ' }));
    }
    root.appendChild(sum);

    // โหมด
    var modeBox = el('div', { class: 'card' });
    modeBox.appendChild(el('h3', { text: 'โหมดทำข้อสอบ' }));
    var seg = el('div', { class: 'seg', role: 'group', 'aria-label': 'โหมดทำข้อสอบ' });
    [['practice', 'โหมดฝึก'], ['exam', 'โหมดสอบจำลอง']].forEach(function (m) {
      seg.appendChild(el('button', {
        type: 'button', 'aria-pressed': String(state.mode === m[0]), onclick: function () { state.mode = m[0]; save(); route(); }
      }, [m[1]]));
    });
    modeBox.appendChild(seg);
    modeBox.appendChild(el('p', { class: 'muted', style: 'margin:10px 0 0', text: state.mode === 'practice'
      ? 'กดตอบแล้วเห็นถูกผิดและเฉลยทันที เหมาะกับการเรียนรู้ทีละข้อ'
      : 'ทำให้ครบก่อน ยังไม่บอกถูกผิด แล้วกดส่งเพื่อดูคะแนนและเฉลยทั้งหมด เหมือนข้อสอบจริง' }));
    root.appendChild(modeBox);

    // ทางลัด
    var quick = el('div', { class: 'card' });
    quick.appendChild(el('h3', { text: 'ทำเร็ว ๆ' }));
    var qrow = el('div', { class: 'row' });
    qrow.appendChild(el('button', { class: 'btn primary', type: 'button', onclick: function () { start('ทั้งหมด ' + Q.length + ' ข้อ', Q.map(function (q) { return q.n; }), state.mode); } }, ['ทำทั้ง ' + Q.length + ' ข้อ']));
    qrow.appendChild(el('button', { class: 'btn', type: 'button', onclick: function () { start('สุ่ม 20 ข้อ', shuffle(Q.map(function (q) { return q.n; })).slice(0, 20), state.mode); } }, ['สุ่ม 20 ข้อ']));
    qrow.appendChild(el('button', { class: 'btn', type: 'button', 'aria-disabled': String(!todo.length), onclick: function () {
      if (todo.length) start('ข้อที่ยังไม่ได้ทำ', todo.map(function (q) { return q.n; }), state.mode);
    } }, ['ข้อที่ยังไม่ได้ทำ (' + todo.length + ')']));
    qrow.appendChild(el('button', { class: 'btn', type: 'button', 'aria-disabled': String(!wrong.length), onclick: function () {
      if (wrong.length) start('ทำซ้ำข้อที่ผิด', wrong.map(function (q) { return q.n; }), state.mode);
    } }, ['ทำซ้ำข้อที่ผิด (' + wrong.length + ')']));
    quick.appendChild(qrow);
    root.appendChild(quick);

    // ส่วนต่าง ๆ
    root.appendChild(el('h2', { text: 'เลือกชุด', style: 'margin-top:20px' }));
    var grid = el('div', { class: 'sections' });
    SECS.forEach(function (sec) {
      var list = Q.filter(function (q) { return q.section === sec.id; }), st = stats(list);
      var card = el('div', { class: 'card sec' });
      card.appendChild(el('h3', { text: sec.title }));
      card.appendChild(el('div', { class: 'stat', text: sec.sub }));
      card.appendChild(bar(st.a ? (100 * st.c) / st.n : 0));
      card.appendChild(el('div', { class: 'stat', text: list.length + ' ข้อ' + (st.a ? ' · ตอบแล้ว ' + st.a + ' · ถูก ' + st.c : '') }));
      card.appendChild(el('button', { class: 'btn', type: 'button', onclick: function () { start(sec.title, list.map(function (q) { return q.n; }), state.mode); } }, ['ทำชุดนี้']));
      grid.appendChild(card);
    });
    root.appendChild(grid);

    // หมายเหตุ
    var note = el('div', { class: 'card' });
    note.appendChild(el('h3', { text: 'ก่อนเริ่ม' }));
    var ul = el('ul');
    [
      'ข้อสอบเก็งที่จัดทำขึ้นเอง ไม่ใช่ข้อสอบของอาจารย์ ข้อ 1–10 (ชุดของจริง) เรียบเรียงจาก quiz 2 และ quiz 3 ที่เคยทำ คำถามกับคำตอบถูกตรงกับของจริง แต่ตัวเลือกอาจต่างจากต้นฉบับเล็กน้อย',
      'ชุดยาก (ข้อ 78–107) ตั้งใจให้ยากกว่า quiz จริง เพราะอาจารย์บอกว่า mock ยากกว่า แต่ไม่ทราบระดับที่แน่ชัด',
      'ข้อที่ติดป้าย "นอกสไลด์" ตอบจากความรู้ทั่วไป ไม่ได้มาจากสไลด์',
      'คะแนนและคำตอบเก็บใน browser เครื่องนี้เท่านั้น ไม่ส่งไปที่ไหน ล้างได้ด้านล่าง'
    ].forEach(function (t) { ul.appendChild(el('li', { text: t })); });
    note.appendChild(ul);
    if (!storageOk) note.appendChild(el('p', { class: 'notice', text: 'browser นี้ไม่อนุญาตให้จำคะแนน (อาจเป็นโหมดส่วนตัว) คะแนนจะหายเมื่อปิดหรือรีเฟรชหน้า' }));
    note.appendChild(el('button', { class: 'btn small danger', type: 'button', onclick: function () {
      if (!all.a || window.confirm('ล้างคะแนนและคำตอบทั้งหมดในเครื่องนี้ใช่ไหม')) { state.answers = {}; state.session = null; save(); route(); say('ล้างคะแนนแล้ว'); }
    } }, ['ล้างคะแนนทั้งหมด']));
    root.appendChild(note);
    return root;
  }

  /* ---------- การ์ดโจทย์ (ใช้ร่วมกันทั้งทำข้อ/ทบทวน) ---------- */
  function tagChip(t) {
    var cls = t === 'ยาก' ? 'tag hard' : t === 'ไล่โค้ด' || t === 'หาบั๊ก' ? 'tag code' : t === 'นอกสไลด์' ? 'tag out' : 'tag';
    return el('span', { class: cls, text: t });
  }
  // o: { picked, locked, reveal, onPick }
  function questionCard(q, o) {
    var card = el('section', { class: 'card', 'aria-labelledby': 'qtitle' });
    var head = el('div', { class: 'qhead' }, [el('h2', { id: 'qtitle', tabindex: '-1', text: 'ข้อ ' + q.n })]);
    q.tags.forEach(function (t) { head.appendChild(tagChip(t)); });
    head.appendChild(el('span', { class: 'tag', text: q.group || secById[q.section].title }));
    card.appendChild(head);
    card.appendChild(el('div', { class: 'stem', html: MD.render(q.stem) }));

    var list = el('div', { role: 'group', 'aria-label': 'ตัวเลือก' });
    q.options.forEach(function (text, i) {
      var cls = 'opt', isCorrect = LET[i] === q.answer, isPicked = o.picked === LET[i];
      if (o.reveal && isCorrect) cls += ' ok';
      else if (o.reveal && isPicked) cls += ' bad';
      else if (!o.reveal && isPicked) cls += ' sel';
      if (o.locked) cls += ' locked';
      var label = 'ตัวเลือก ' + LET[i] + (o.reveal && isCorrect ? ' คำตอบที่ถูก' : '') + (o.reveal && isPicked && !isCorrect ? ' ที่คุณเลือก ผิด' : '');
      list.appendChild(el('button', {
        type: 'button', class: cls, 'data-i': i, 'aria-label': label, 'aria-pressed': String(isPicked), 'aria-disabled': String(!!o.locked),
        onclick: function () { if (!o.locked && o.onPick) o.onPick(LET[i]); }
      }, [el('span', { class: 'letter', text: LET[i] }), el('span', { class: 'txt', html: MD.inline(text) })]));
    });
    card.appendChild(list);

    if (o.reveal) {
      if (o.picked) {
        var ok = o.picked === q.answer;
        card.appendChild(el('p', { id: 'verdict', tabindex: '-1', class: 'verdict ' + (ok ? 'ok' : 'bad'), text: ok ? '✓ ถูกต้อง' : '✗ ผิด คุณตอบ ' + o.picked + ' คำตอบที่ถูกคือ ' + q.answer }));
      } else {
        card.appendChild(el('p', { id: 'verdict', tabindex: '-1', class: 'verdict', text: 'คำตอบที่ถูกคือ ' + q.answer + ' (ดูเฉลยโดยไม่ตอบ ไม่นับคะแนน)' }));
      }
      var ex = el('div', { class: 'expl' }, [el('h3', { text: 'เฉลย' }), el('div', { html: MD.render(q.explanation) })]);
      if (q.topics.length) ex.appendChild(el('p', { class: 'topics', text: 'หัวข้อที่ควรทบทวน: ' + q.topics.join(' · ') }));
      card.appendChild(ex);
    }
    return card;
  }

  /* ---------- ทำข้อ ---------- */
  var ctx = null; // ตัวรับคีย์ลัดของหน้าปัจจุบัน

  function navGrid(s, idx, jump) {
    var g = el('nav', { class: 'nav-grid', 'aria-label': 'เลขข้อในชุดนี้' });
    s.queue.forEach(function (n, i) {
      var cls = 'nb', pick = s.picks[n], q = byN[n];
      if (s.mode === 'exam' && !s.done) { if (pick) cls += ' picked'; }
      else if (pick) cls += pick === q.answer ? ' ok' : ' bad';
      else if (s.revealed[n]) cls += ' seen';
      if (i === idx) cls += ' cur';
      g.appendChild(el('button', { type: 'button', class: cls, 'aria-label': 'ไปข้อ ' + n + (pick ? ' ตอบแล้ว' : ''), 'aria-current': i === idx ? 'step' : false, onclick: function () { jump(i); } }, [String(n)]));
    });
    return g;
  }

  function viewRun(idx) {
    var s = state.session;
    if (!s) { go('#/'); return el('div'); }
    idx = Math.max(0, Math.min(s.queue.length - 1, idx || 0));
    s.idx = idx; save();
    var q = byN[s.queue[idx]], exam = s.mode === 'exam';
    if (!q) { state.session = null; save(); go('#/'); return el('div'); }
    var root = el('div'), slot = el('div'), navSlot = el('div');

    var finished = exam && s.done; // สอบจำลองที่ส่งแล้ว: ล็อกและเปิดเฉลย
    function opts() {
      var picked = s.picks[q.n];
      if (exam) return { picked: picked, locked: finished, reveal: finished, onPick: pick };
      return { picked: picked, locked: !!picked, reveal: !!picked || !!s.revealed[q.n], onPick: pick };
    }
    function paint() {
      slot.innerHTML = ''; navSlot.innerHTML = '';
      navSlot.appendChild(navGrid(s, idx, function (i) { go('#/run/' + i); }));
      slot.appendChild(questionCard(q, opts()));
      if (!exam && !s.picks[q.n] && !s.revealed[q.n]) {
        slot.appendChild(el('p', {}, [el('button', { class: 'btn small', type: 'button', onclick: function () { s.revealed[q.n] = true; save(); paint(); say('คำตอบที่ถูกคือ ' + q.answer); focusAfterPick(); } }, ['ดูเฉลยโดยไม่ตอบ'])]));
      }
    }
    // paint สร้างปุ่มใหม่ทั้งหมด จึงคืนโฟกัสให้คนใช้คีย์บอร์ด ไม่ให้หลุดไปต้นหน้า
    function focusAfterPick() {
      var t = document.getElementById('verdict') || slot.querySelector('.opt.sel');
      if (t) t.focus({ preventScroll: true });
    }
    function pick(c) {
      if (LET.indexOf(c) < 0) return;
      if (exam ? finished : s.picks[q.n]) return; // ล็อกแล้ว: กันการเรียกซ้ำจากปุ่มเก่าที่ค้างจากการวาดใหม่
      s.picks[q.n] = c;
      if (!exam) {
        state.answers[q.n] = { c: c, ok: c === q.answer, t: Date.now() };
        updatePill();
        say(c === q.answer ? 'ถูกต้อง' : 'ผิด คำตอบที่ถูกคือ ' + q.answer);
      } else say('เลือก ' + c);
      save(); paint(); focusAfterPick();
    }

    root.appendChild(el('div', { class: 'run-head' }, [
      el('a', { href: '#/' }, ['← หน้าแรก']),
      el('span', { class: 'muted', text: s.label + ' · ข้อที่ ' + (idx + 1) + ' จาก ' + s.queue.length + (exam ? ' · โหมดสอบจำลอง' : '') })
    ]));
    root.appendChild(navSlot);
    root.appendChild(slot);

    var last = idx === s.queue.length - 1;
    var nav = el('div', { class: 'qnav' });
    nav.appendChild(el('button', { class: 'btn', type: 'button', 'aria-disabled': String(idx === 0), onclick: function () { if (idx > 0) go('#/run/' + (idx - 1)); } }, ['← ก่อนหน้า']));
    var right = el('div', { class: 'row' });
    if (exam && !finished) right.appendChild(el('button', { class: 'btn' + (last ? ' primary' : ''), type: 'button', onclick: submitExam }, ['ส่งคำตอบ']));
    else right.appendChild(el('button', { class: 'btn' + (last ? ' primary' : ''), type: 'button', onclick: function () { s.done = true; save(); go('#/result'); } }, [exam ? 'ดูสรุปคะแนน' : 'จบรอบและดูสรุป']));
    right.appendChild(el('button', { class: 'btn' + (last ? '' : ' primary'), type: 'button', 'aria-disabled': String(last), onclick: function () { if (!last) go('#/run/' + (idx + 1)); } }, ['ถัดไป →']));
    nav.appendChild(right);
    root.appendChild(nav);

    ctx = {
      pick: function (i) { if (i >= 0 && i < 5 && !opts().locked) pick(LET[i]); },
      step: function (d) { var n = idx + d; if (n >= 0 && n < s.queue.length) go('#/run/' + n); }
    };
    paint();
    return root;
  }

  function submitExam() {
    var s = state.session;
    var blank = s.queue.filter(function (n) { return !s.picks[n]; }).length;
    if (blank && !window.confirm('ยังไม่ได้ตอบ ' + blank + ' ข้อ ส่งคำตอบเลยไหม')) return;
    s.queue.forEach(function (n) {
      var c = s.picks[n];
      if (c) state.answers[n] = { c: c, ok: c === byN[n].answer, t: Date.now() };
    });
    s.done = true; save(); updatePill();
    go('#/result');
  }

  /* ---------- สรุปรอบ ---------- */
  function viewResult() {
    var s = state.session;
    if (!s) { go('#/'); return el('div'); }
    if (s.mode === 'exam' && !s.done) { go('#/run/' + (s.idx || 0)); return el('div'); } // ยังไม่ส่งสอบ: กลับไปทำต่อ
    var root = el('div');
    var rows = s.queue.map(function (n) { var c = s.picks[n]; return { n: n, c: c, ok: !!c && c === byN[n].answer }; });
    var right = rows.filter(function (r) { return r.ok; }).length;
    var wrong = rows.filter(function (r) { return r.c && !r.ok; });
    var blank = rows.filter(function (r) { return !r.c; });
    var pct = rows.length ? (100 * right) / rows.length : 0;

    root.appendChild(el('h1', { text: 'สรุป: ' + s.label }));
    var top = el('div', { class: 'card' }, [
      el('p', { class: 'big', text: right + ' / ' + rows.length + ' (' + Math.round(pct) + '%)' }),
      bar(pct),
      el('p', { class: 'muted', style: 'margin:8px 0 0', text: 'ถูก ' + right + ' · ผิด ' + wrong.length + ' · ยังไม่ได้ตอบ ' + blank.length })
    ]);
    root.appendChild(top);

    // รายส่วน
    var table = el('table', { class: 'res-table' });
    table.appendChild(el('thead', {}, [el('tr', {}, ['ส่วน', 'ถูก', 'ข้อ'].map(function (h) { return el('th', { text: h }); }))]));
    var tb = el('tbody');
    SECS.forEach(function (sec) {
      var rs = rows.filter(function (r) { return byN[r.n].section === sec.id; });
      if (!rs.length) return;
      tb.appendChild(el('tr', {}, [el('td', { text: sec.title }), el('td', { text: rs.filter(function (r) { return r.ok; }).length + '' }), el('td', { text: rs.length + '' })]));
    });
    table.appendChild(tb);
    root.appendChild(el('div', { class: 'card' }, [el('h3', { text: 'แยกตามส่วน' }), el('div', { class: 'tbl-wrap' }, [table])]));

    function linkList(title, list) {
      if (!list.length) return null;
      var wrap = el('div', { class: 'wrong-list' });
      list.forEach(function (r) { wrap.appendChild(el('a', { class: 'btn small', href: '#/q/' + r.n }, ['ข้อ ' + r.n])); });
      return el('div', { class: 'card' }, [el('h3', { text: title }), el('p', { class: 'muted', text: 'กดเพื่อดูเฉลย' }), wrap]);
    }
    var w = linkList('ข้อที่ผิด (' + wrong.length + ')', wrong); if (w) root.appendChild(w);
    var b = linkList('ข้อที่ยังไม่ได้ตอบ (' + blank.length + ')', blank); if (b) root.appendChild(b);
    if (!wrong.length && !blank.length) root.appendChild(el('p', { class: 'notice', text: 'ถูกครบทุกข้อในชุดนี้' }));

    var act = el('div', { class: 'row' });
    var redo = wrong.concat(blank).map(function (r) { return r.n; });
    if (redo.length) act.appendChild(el('button', { class: 'btn primary', type: 'button', onclick: function () { start('ทำซ้ำข้อที่ผิด', redo, s.mode); } }, ['ทำซ้ำข้อที่ผิด/ยังไม่ตอบ']));
    act.appendChild(el('button', { class: 'btn', type: 'button', onclick: function () { start(s.label, s.queue.slice(), s.mode); } }, ['ทำชุดนี้อีกรอบ']));
    act.appendChild(el('a', { class: 'btn', href: '#/' }, ['หน้าแรก']));
    root.appendChild(act);
    ctx = null;
    return root;
  }

  /* ---------- ทบทวนข้อเดียว ---------- */
  function viewReview(n) {
    var q = byN[n];
    if (!q) { go('#/'); return el('div'); }
    var rec = state.answers[q.n];
    var root = el('div');
    var back = state.session && state.session.done ? el('a', { href: '#/result' }, ['← กลับสรุป']) : el('a', { href: '#/' }, ['← หน้าแรก']);
    root.appendChild(el('div', { class: 'run-head' }, [
      back,
      el('span', { class: 'muted', text: 'ทบทวน · ' + (rec ? 'คุณตอบ ' + rec.c : 'ยังไม่ได้ตอบข้อนี้') })
    ]));
    root.appendChild(questionCard(q, { picked: rec ? rec.c : null, locked: true, reveal: true }));
    var nav = el('div', { class: 'qnav' });
    nav.appendChild(el('a', { class: 'btn', href: '#/q/' + Math.max(1, q.n - 1), 'aria-disabled': String(q.n === 1) }, ['← ข้อก่อน']));
    nav.appendChild(el('a', { class: 'btn', href: '#/q/' + Math.min(Q.length, q.n + 1), 'aria-disabled': String(q.n === Q.length) }, ['ข้อถัดไป →']));
    root.appendChild(nav);
    ctx = { pick: function () {}, step: function (d) { var t = q.n + d; if (t >= 1 && t <= Q.length) go('#/q/' + t); } };
    return root;
  }

  /* ---------- เส้นทาง ---------- */
  function route() {
    var parts = location.hash.replace(/^#\/?/, '').split('/');
    var view;
    ctx = null;
    if (parts[0] === 'run') view = viewRun(parseInt(parts[1], 10) || 0);
    else if (parts[0] === 'result') view = viewResult();
    else if (parts[0] === 'q') view = viewReview(parseInt(parts[1], 10));
    else view = viewHome();
    app.innerHTML = '';
    app.appendChild(view);
    updatePill();
    if (parts[0] === 'run') {
      var t = document.getElementById('qtitle');
      if (t) { window.scrollTo(0, 0); t.focus({ preventScroll: true }); }
    } else { window.scrollTo(0, 0); }
  }

  document.addEventListener('keydown', function (e) {
    if (!ctx || e.ctrlKey || e.metaKey || e.altKey) return;
    var tag = (e.target && e.target.tagName) || '';
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(tag)) return;
    if (/^[1-5]$/.test(e.key)) { ctx.pick(Number(e.key) - 1); e.preventDefault(); }
    else if (e.key === 'ArrowRight') { ctx.step(1); e.preventDefault(); }
    else if (e.key === 'ArrowLeft') { ctx.step(-1); e.preventDefault(); }
  });
  window.addEventListener('hashchange', route);
  route();
})();
