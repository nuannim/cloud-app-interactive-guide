(function () {
  'use strict';
  var G = window.GUIDE, h = G.h;

  function qById(id) {
    var qs = (G.predict && G.predict.questions) || [];
    for (var i = 0; i < qs.length; i++) if (qs[i].id === id) return qs[i];
    return null;
  }

  function badges(q) {
    return h('span', { class: 'row' },
      h('span', { class: 'badge like-' + (q.likelihood === 'สูง' ? 'high' : 'mid') }, 'โอกาสออก: ' + q.likelihood),
      h('span', { class: 'badge' }, q.depth),
      h('span', { class: 'badge' }, q.modules.join(' + ')),
      G.supplementBadge(q));
  }

  function buildAIPrompt(q, answer) {
    var lines = [
      'ช่วยตรวจคำตอบข้อสอบ AWS (ข้อเขียน) ของฉัน ให้คะแนนเต็ม 10 บอกว่าส่วนไหนถูก ส่วนไหนขาด และควรเพิ่มอะไร ตอบเป็นภาษาไทย',
      '', '## โจทย์', q.prompt, '', '## เกณฑ์ที่ควรมีในคำตอบ'
    ];
    q.rubric.forEach(function (r) { lines.push('- ' + r); });
    lines.push('', '## คำตอบของฉัน', answer.trim() || '(ยังไม่ได้เขียน)');
    return lines.join('\n');
  }

  /* การ์ดข้อสอบ 1 ข้อ: โจทย์ + ช่องเขียน + hint ทีละขั้น + แนวตอบ + คัดลอกให้ AI ตรวจ */
  function questionCard(q, no) {
    var card = h('div', { class: 'card predict-q' });
    card.appendChild(h('div', { class: 'row' }, h('strong', {}, no ? 'ข้อ ' + no : q.id), badges(q)));
    card.appendChild(h('div', { class: 'prompt', style: 'margin-top:10px', html: q.prompt }));

    var ta = h('textarea', { 'aria-label': 'คำตอบของคุณ', placeholder: 'พิมพ์คำตอบ...' });
    ta.value = G.store.draft(q.id);
    ta.addEventListener('input', function () { G.store.draft(q.id, ta.value); });
    card.appendChild(ta);

    var used = 0;
    var hintList = h('div', { class: 'hint-list' });
    var hintBtn = h('button', { class: 'btn', type: 'button' });
    function hintLabel() { return used >= q.hints.length ? 'เปิด hint ครบแล้ว' : 'ขอ hint (ใช้แล้ว ' + used + '/' + q.hints.length + ')'; }
    hintBtn.textContent = hintLabel();
    hintBtn.addEventListener('click', function () {
      if (used >= q.hints.length) return;
      var titles = ['คำสำคัญในโจทย์', 'service / feature ที่เกี่ยว', 'โครงคำตอบ'];
      hintList.appendChild(h('div', { class: 'hint-step' },
        h('span', { class: 'hint-no' }, 'Hint ' + (used + 1) + ' · ' + titles[used]),
        h('div', { html: q.hints[used] })));
      used++;
      hintBtn.textContent = hintLabel();
      if (used >= q.hints.length) hintBtn.disabled = true;
    });

    var copyMsg = h('span', { class: 'small muted' });
    var manual = h('textarea', { readonly: true, 'aria-label': 'ข้อความสำหรับคัดลอก', style: 'display:none;margin-top:10px;min-height:120px' });
    var copyBtn = h('button', { class: 'btn', type: 'button', onclick: function () {
      var text = buildAIPrompt(q, ta.value);
      G.copyText(text, function (ok) {
        copyMsg.textContent = ok ? 'คัดลอกแล้ว นำไปวางในแอป Claude ได้เลย' : 'คัดลอกอัตโนมัติไม่ได้ เลือกข้อความด้านล่างแล้วคัดลอกเอง';
        manual.style.display = ok ? 'none' : 'block';
        if (!ok) { manual.value = text; manual.focus(); manual.select(); }
      });
    } }, 'คัดลอกให้ AI ตรวจ');

    var revealBtn = h('button', { class: 'btn primary', type: 'button' }, 'ดูแนวตอบ');
    var out = h('div', { class: 'reveal' });
    revealBtn.addEventListener('click', function () {
      revealBtn.remove();
      out.appendChild(h('p', { class: 'small muted' }, 'ทำไมเก็งข้อนี้: ' + q.why));
      out.appendChild(h('div', { class: 'answer-box' }, h('h3', {}, 'ตัวอย่างคำตอบ'), h('div', { class: 'prompt', html: q.modelAnswer })));
      var list = h('div', { class: 'answer-box' }, h('h3', {}, 'ตรวจกับเกณฑ์ (ติ๊กข้อที่คุณตอบได้)'));
      var ticked = 0, scoreEl = h('p', { class: 'small muted' }, 'ตอบได้: 0/' + q.rubric.length);
      q.rubric.forEach(function (r) {
        var cb = h('input', { type: 'checkbox' });
        cb.addEventListener('change', function () {
          ticked += cb.checked ? 1 : -1;
          scoreEl.textContent = 'ตอบได้: ' + ticked + '/' + q.rubric.length;
        });
        list.appendChild(h('label', { class: 'check' }, cb, h('span', {}, r)));
      });
      list.appendChild(scoreEl);
      out.appendChild(list);
      (q.topics || []).forEach(function (t) {
        var m = G.modules[t.module], n = m && m.notes && m.notes[t.index];
        if (!n) return;
        out.appendChild(h('p', { class: 'topic' }, h('span', { class: 'lead' }, 'เรื่องที่เกี่ยวข้อง: '),
          h('a', { href: '#/notes/' + t.module + '?s=' + t.index, target: '_blank', rel: 'noopener' }, t.module + ' ' + m.title + ' › ' + n.heading),
          h('span', { class: 'small muted' }, ' (เปิดแท็บใหม่)')));
      });
      out.appendChild(h('p', { class: 'small muted' }, 'อ้างอิง: ' + q.source.join(', ')));
      setTimeout(function () { G.reveal(out, 'start'); }, 0);
    });

    card.appendChild(h('div', { class: 'row', style: 'margin-top:14px' }, hintBtn, revealBtn, copyBtn, copyMsg));
    card.appendChild(manual);
    card.appendChild(hintList);
    card.appendChild(out);
    return card;
  }

  function intro() {
    return h('p', { class: 'muted' },
      'เก็งจากน้ำหนักเนื้อหาในสไลด์ + แนวอาจารย์ที่เน้นการใช้งานจริง ไม่ใช่ข้อสอบจริง · ข้อสอบจริงคาดว่าเป็นข้อเขียน 5 ข้อ ใช้ hint ได้เมื่อนึกไม่ออก');
  }

  function home(root) {
    var P = G.predict;
    root.appendChild(h('h1', {}, 'เก็งข้อสอบข้อเขียน'));
    root.appendChild(intro());
    if (!P) { root.appendChild(h('div', { class: 'card' }, 'ยังไม่มีข้อมูลข้อเก็ง')); return; }

    root.appendChild(h('h2', {}, 'ชุดซ้อม 5 ข้อ (เหมือนข้อสอบจริง)'));
    P.sets.forEach(function (s) {
      var qs = s.questions.map(qById).filter(Boolean);
      var mods = [];
      qs.forEach(function (q) { q.modules.forEach(function (m) { if (mods.indexOf(m) < 0) mods.push(m); }); });
      mods.sort();
      var deep = qs.filter(function (q) { return q.depth === 'ลึก'; }).length;
      root.appendChild(h('a', { class: 'card link', href: '#/predict/set/' + s.id },
        h('strong', {}, s.title),
        h('p', { class: 'small muted' }, qs.length + ' ข้อ · ข้อลึก ' + deep + ' · ครอบ ' + mods.join(', '))));
    });

    root.appendChild(h('h2', {}, 'คลังข้อเก็งทั้งหมด (' + P.questions.length + ' ข้อ)'));
    root.appendChild(h('p', { class: 'small muted' }, 'ข้อที่ครอบหลายโมดูลจะแสดงซ้ำใต้ทุกโมดูลที่เกี่ยวข้อง'));
    G.order.forEach(function (mid) {
      var qs = P.questions.filter(function (q) { return q.modules.indexOf(mid) >= 0; });
      if (!qs.length) return;
      var box = h('div', { class: 'card' }, h('strong', {}, mid + ' ' + G.modules[mid].title));
      qs.forEach(function (q) {
        box.appendChild(h('a', { class: 'modrow', href: '#/predict/q/' + q.id },
          h('span', {}, G.cut(q.prompt.replace(/<[^>]+>/g, ' '), 90)), badges(q)));
      });
      root.appendChild(box);
    });
  }

  function set(root, id) {
    var P = G.predict, s = P && P.sets.filter(function (x) { return x.id === id; })[0];
    root.appendChild(h('p', { class: 'small' }, h('a', { href: '#/predict' }, '← เก็งข้อสอบ')));
    if (!s) { root.appendChild(h('div', { class: 'card' }, 'ไม่พบชุดนี้')); return; }
    root.appendChild(h('h1', {}, s.title));
    var sec = 0, timerEl = h('span', { class: 'timer' }, '00:00');
    var tick = setInterval(function () {
      sec++;
      timerEl.textContent = ('0' + Math.floor(sec / 60)).slice(-2) + ':' + ('0' + (sec % 60)).slice(-2);
    }, 1000);
    G.cleanups.push(function () { clearInterval(tick); });
    root.appendChild(h('div', { class: 'row sticky-timer' }, 'เวลาที่ใช้ ', timerEl));
    s.questions.forEach(function (qid, i) {
      var q = qById(qid);
      if (q) root.appendChild(questionCard(q, i + 1));
    });
  }

  function single(root, id) {
    var q = qById(id);
    root.appendChild(h('p', { class: 'small' }, h('a', { href: '#/predict' }, '← เก็งข้อสอบ')));
    if (!q) { root.appendChild(h('div', { class: 'card' }, 'ไม่พบข้อนี้')); return; }
    root.appendChild(questionCard(q, 0));
  }

  G.views.predict = function (root, parts) {
    if (parts[1] === 'set') set(root, parts[2]);
    else if (parts[1] === 'q') single(root, parts[2]);
    else home(root);
  };
})();
