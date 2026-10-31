(function () {
  'use strict';
  var G = window.GUIDE, h = G.h;
  var LETTERS = 'ABCDEFGHIJ';
  var TYPE_NAME = { scenario: 'Scenario', design: 'Design · วาด diagram', kc: 'Knowledge Check' };

  /* ---------- setup screen ---------- */
  function setup(root) {
    var selMods = {}, selTypes = { scenario: true, design: true, kc: true };
    G.order.forEach(function (m) { selMods[m] = true; });
    var count = '10';

    root.appendChild(h('h1', {}, 'โจทย์ฝึก'));
    root.appendChild(h('p', { class: 'muted' }, 'เลือกโมดูลและประเภท แล้วตอบทีละข้อ ข้อที่ผิดจะถูกบันทึกไว้ให้ทบทวน'));

    root.appendChild(h('h3', {}, 'โมดูล'));
    root.appendChild(G.moduleChips(selMods));

    root.appendChild(h('h3', { style: 'margin-top:16px' }, 'ประเภท'));
    var typeRow = h('div', { class: 'row' });
    Object.keys(TYPE_NAME).forEach(function (t) {
      var chip = h('button', { class: 'chip on', type: 'button' }, TYPE_NAME[t]);
      chip.addEventListener('click', function () { selTypes[t] = !selTypes[t]; chip.classList.toggle('on', selTypes[t]); });
      typeRow.appendChild(chip);
    });
    root.appendChild(typeRow);

    root.appendChild(h('h3', { style: 'margin-top:16px' }, 'จำนวนข้อ'));
    var sel = h('select', { 'aria-label': 'จำนวนข้อ', style: 'max-width:200px' },
      h('option', { value: '5' }, '5 ข้อ'), h('option', { value: '10', selected: true }, '10 ข้อ'),
      h('option', { value: '20' }, '20 ข้อ'), h('option', { value: 'all' }, 'ทั้งหมด'));
    sel.addEventListener('change', function () { count = sel.value; });
    root.appendChild(sel);

    root.appendChild(h('p', { style: 'margin-top:20px' }, h('button', {
      class: 'btn primary', type: 'button', onclick: function () {
        var m = Object.keys(selMods).filter(function (k) { return selMods[k]; });
        var t = Object.keys(selTypes).filter(function (k) { return selTypes[k]; });
        if (!m.length || !t.length) { alert('เลือกอย่างน้อย 1 โมดูลและ 1 ประเภท'); return; }
        location.hash = '#/drill/run?m=' + m.join(',') + '&t=' + t.join(',') + '&n=' + count;
      }
    }, 'เริ่มทำโจทย์')));
  }

  /* ---------- building the queue ---------- */
  function buildQueue(q) {
    var all = G.all('question');
    if (q.id) return all.filter(function (e) { return e.item.id === q.id; });
    if (q.ids) { // ชุดข้อที่ระบุ (ด่านใน Roadmap)
      var want = q.ids.split(',');
      return G.shuffle(all.filter(function (e) { return want.indexOf(e.item.id) >= 0; }));
    }
    if (q.mistakes) {
      var wrong = G.store.wrongIds();
      return G.shuffle(all.filter(function (e) { return wrong.indexOf(e.item.id) >= 0; }));
    }
    var mods = q.m ? q.m.split(',') : null, types = q.t ? q.t.split(',') : null;
    var list = all.filter(function (e) {
      return (!mods || mods.indexOf(e.module) >= 0) && (!types || types.indexOf(e.item.type) >= 0);
    });
    list = G.shuffle(list);
    var n = q.n && q.n !== 'all' ? parseInt(q.n, 10) : list.length;
    return list.slice(0, n);
  }

  /* ---------- run ---------- */
  function run(root, query) {
    var queue = buildQueue(query), i = 0, right = 0;
    if (!queue.length) {
      root.appendChild(h('div', { class: 'card' }, 'ไม่พบโจทย์ตามที่เลือก ', h('a', { href: '#/drill' }, 'กลับไปเลือกใหม่')));
      return;
    }
    var box = h('div');
    root.appendChild(h('p', { class: 'small' }, h('a', {
      href: '#/', onclick: function (ev) {
        if (history.length > 1) { ev.preventDefault(); history.back(); }
      }
    }, '← ออกจากชุดนี้')));
    root.appendChild(box);

    function next() { i++; show(); }

    function summary() {
      box.innerHTML = '';
      var nx = query.rm && G.roadmap && G.roadmap.nextAfter(query.rm); // โหมด roadmap: ไปด่านถัดไป
      box.appendChild(h('div', { class: 'card' },
        h('h2', {}, 'จบชุดนี้'),
        h('p', {}, 'ทำถูก ' + right + ' จาก ' + queue.length + ' ข้อ'),
        h('div', { class: 'row' },
          nx ? h('a', { class: 'btn primary', href: nx.href }, 'ด่านถัดไป: ' + nx.title) : null,
          h('a', { class: 'btn' + (nx ? '' : ' primary'), href: '#/drill' }, 'เลือกชุดใหม่'),
          h('a', { class: 'btn', href: '#/mistakes' }, 'ดูข้อที่ผิด'))));
    }

    function show() {
      if (i >= queue.length) { summary(); return; }
      var e = queue[i], q = e.item;
      box.innerHTML = '';
      var head = h('div', { class: 'row spread small muted', style: 'margin-bottom:8px' },
        h('span', {}, 'ข้อ ' + (i + 1) + '/' + queue.length + ' · ' + e.module + ' · ' + TYPE_NAME[q.type]),
        h('span', { class: 'row' }, G.supplementBadge(q), q.source ? h('span', { class: 'badge' }, (q.type === 'kc' ? '' : 'notes ') + q.source) : null));
      var prompt = h('div', { class: 'prompt', html: G.esc(q.prompt) });
      var body = h('div', { style: 'margin-top:14px' });
      var progress = h('div', { class: 'bar', style: 'margin:0 0 12px' }, h('i', { style: 'width:' + Math.round((i / queue.length) * 100) + '%' }));
      var code = q.code ? h('pre', { class: 'q-code' }, q.code) : null;
      var card = h('div', { class: 'card' }, head, progress, prompt, code, body);
      box.appendChild(card);

      function done(ok) {
        G.store.record(q.id, ok);
        if (ok) right++;
        if (!q.en) prompt.innerHTML = G.highlight(q.prompt, q.keywords);
      }
      var nextBtn = function () {
        return h('p', { style: 'margin-top:14px' }, h('button', { class: 'btn primary', type: 'button', onclick: next },
          i + 1 < queue.length ? 'ข้อต่อไป' : 'ดูสรุป'));
      };

      if (q.format === 'choice') choiceUI(q, body, done, nextBtn, q.en ? function (apply) { langSwitch(q, prompt, head, apply); } : null);
      else writtenUI(q, body, done, nextBtn);
    }
    show();
  }

  // ปุ่ม ไทย | EN ที่หัวการ์ด: เริ่มที่ไทยทุกข้อ สลับได้ทั้งก่อนและหลังตอบ
  function langSwitch(q, prompt, head, apply) {
    var btns = {};
    function set(l) {
      prompt.textContent = l === 'en' ? q.en.prompt : q.prompt;
      if (l === 'en') prompt.setAttribute('lang', 'en'); else prompt.removeAttribute('lang');
      Object.keys(btns).forEach(function (k) { btns[k].classList.toggle('on', k === l); btns[k].setAttribute('aria-pressed', k === l ? 'true' : 'false'); });
      apply(l);
    }
    var box = h('span', { class: 'lang-switch', role: 'group', 'aria-label': 'ภาษาของโจทย์' });
    [['th', 'ไทย'], ['en', 'EN']].forEach(function (p) {
      btns[p[0]] = h('button', { class: 'chip', type: 'button', onclick: function () { set(p[0]); } }, p[1]);
      box.appendChild(btns[p[0]]);
    });
    head.parentNode.insertBefore(box, head.nextSibling);
    set('th');
  }

  /* ---------- choice ---------- */
  function choiceUI(q, body, done, nextBtn, onLang) {
    // โจทย์ KC คงลำดับ A–D ตามต้นฉบับ เพราะเหตุผลอ้างตัวอักษรของตัวเลือก
    var choices = q.type === 'kc' ? q.choices.slice() : G.shuffle(q.choices);
    var need = choices.filter(function (c) { return c.correct; }).length;
    var multi = need > 1, picked = {}, locked = false, btns = [];

    if (multi) body.appendChild(h('p', { class: 'small muted' }, 'เลือก ' + need + ' ข้อ'));
    choices.forEach(function (c, idx) {
      var b = h('button', { class: 'choice', type: 'button' },
        h('span', { class: 'letter' }, LETTERS[idx]), h('span', { class: 'txt' }, h('span', { class: 'ctext' }, c.text)));
      b.addEventListener('click', function () {
        if (locked) return;
        if (multi) { picked[idx] = !picked[idx]; b.classList.toggle('sel', !!picked[idx]); }
        else { picked[idx] = true; finish(); }
      });
      btns.push(b);
      body.appendChild(b);
    });

    // สลับภาษาโจทย์/ตัวเลือก (เฉพาะข้อที่มีต้นฉบับอังกฤษ) ไม่แตะข้อความ ✓/✗ ที่แนบหลังตอบ
    if (onLang) onLang(function (l) {
      choices.forEach(function (c, idx) {
        var t = btns[idx].querySelector('.ctext');
        t.textContent = l === 'en' ? q.en.choices[q.choices.indexOf(c)] : c.text;
        if (l === 'en') t.setAttribute('lang', 'en'); else t.removeAttribute('lang');
      });
    });

    var checkBtn = multi ? h('button', { class: 'btn primary', type: 'button', onclick: finish }, 'ตรวจคำตอบ') : null;
    if (checkBtn) body.appendChild(checkBtn);

    function finish() {
      if (locked) return;
      locked = true;
      var ok = true;
      choices.forEach(function (c, idx) {
        var chosen = !!picked[idx], b = btns[idx];
        b.disabled = true;
        b.classList.remove('sel');
        if (c.correct) b.classList.add('right');
        else if (chosen) b.classList.add('wrong');
        if (c.correct !== chosen) ok = false;
        var tag = c.correct ? (chosen ? '✓ ถูก' : '→ ข้อนี้ถูก แต่คุณไม่ได้เลือก') : (chosen ? '✗ ผิด' : '');
        var note = tag + (tag && c.why ? ' — ' : '') + (c.why || '');
        if (note) b.querySelector('.txt').appendChild(h('span', { class: 'why' }, note));
      });
      if (checkBtn) checkBtn.remove();
      var res = h('div', { class: 'result ' + (ok ? 'ok' : 'bad'), role: 'status' }, ok ? 'ถูกต้อง' : 'ยังไม่ถูก ดูเหตุผลแต่ละข้อด้านบน');
      body.appendChild(res);
      done(ok);
      if (q.explain) body.appendChild(h('div', { class: 'answer-box' }, h('h3', {}, 'เหตุผล'), h('p', {}, q.explain)));
      body.appendChild(G.topicLink(q.id, !ok));
      body.appendChild(nextBtn());
      G.reveal(res);
    }
  }

  /* ---------- written / design ---------- */
  function buildAIPrompt(q, answer, diagramText) {
    var lines = [
      'ช่วยตรวจคำตอบข้อสอบ AWS (ข้อเขียน) ของฉัน ให้คะแนนเต็ม 10 บอกว่าส่วนไหนถูก ส่วนไหนขาด และควรเพิ่มอะไร ตอบเป็นภาษาไทย',
      '',
      '## โจทย์', q.prompt, '',
      '## เกณฑ์ที่ควรมีในคำตอบ'
    ];
    q.rubric.forEach(function (r) { lines.push('- ' + r); });
    lines.push('', '## คำตอบของฉัน', answer.trim() || '(ยังไม่ได้เขียน)');
    if (diagramText) lines.push('', '## แผนภาพที่ฉันวาด (อธิบายเป็นข้อความ)', diagramText);
    return lines.join('\n');
  }

  function writtenUI(q, body, done, nextBtn) {
    var isDesign = q.type === 'design';
    var ta = h('textarea', { 'aria-label': 'คำตอบของคุณ', placeholder: 'พิมพ์คำตอบ...' });
    ta.value = G.store.draft(q.id);
    ta.addEventListener('input', function () { G.store.draft(q.id, ta.value); });
    body.appendChild(ta);

    var cv = null;
    if (isDesign) {
      var labels = q.flow.nodes.map(function (n) { return n.label; }).concat(q.flow.distractors || []);
      cv = G.createCanvas({ palette: G.shuffle(labels) });
      body.appendChild(h('h3', { style: 'margin-top:16px' }, 'วาดแผนภาพ'));
      body.appendChild(cv.el);
    }

    var sec = 0, timerEl = h('span', { class: 'timer' }, '00:00');
    var tick = setInterval(function () {
      sec++;
      timerEl.textContent = ('0' + Math.floor(sec / 60)).slice(-2) + ':' + ('0' + (sec % 60)).slice(-2);
    }, 1000);
    G.cleanups.push(function () { clearInterval(tick); });

    var copyMsg = h('span', { class: 'small muted' });
    var manual = h('textarea', { readonly: true, 'aria-label': 'ข้อความสำหรับคัดลอก', style: 'display:none;margin-top:10px;min-height:120px' });
    var copyBtn = h('button', {
      class: 'btn', type: 'button', onclick: function () {
        var text = buildAIPrompt(q, ta.value, cv ? cv.toText() : '');
        G.copyText(text, function (ok) {
          copyMsg.textContent = ok ? 'คัดลอกแล้ว นำไปวางในแอป Claude ได้เลย' : 'คัดลอกอัตโนมัติไม่ได้ เลือกข้อความด้านล่างแล้วคัดลอกเอง';
          manual.style.display = ok ? 'none' : 'block';
          if (!ok) { manual.value = text; manual.focus(); manual.select(); }
        });
      }
    }, 'คัดลอกให้ AI ตรวจ');
    var revealBtn = h('button', { class: 'btn primary', type: 'button', onclick: reveal }, 'ดูเฉลย');
    body.appendChild(h('div', { class: 'row', style: 'margin-top:14px' }, revealBtn, copyBtn, timerEl, copyMsg));
    body.appendChild(manual);

    function reveal() {
      clearInterval(tick);
      revealBtn.remove();
      var out = h('div', { class: 'reveal' });
      setTimeout(function () { G.reveal(out, 'start'); }, 0);
      if (isDesign) {
        out.appendChild(h('div', { class: 'answer-box' }, h('h3', {}, 'แผนภาพเฉลย'), G.renderFlow(q.flow),
          h('p', { class: 'small muted', style: 'margin-top:8px;white-space:pre-wrap' }, G.flowToText(q.flow))));
      }
      out.appendChild(h('div', { class: 'answer-box' }, h('h3', {}, 'ตัวอย่างคำตอบ'), h('div', { class: 'prompt', html: G.esc(q.modelAnswer) })));
      var topicEl = G.topicLink(q.id, false);
      out.appendChild(topicEl);

      var ticked = 0, saved = false;
      var scoreEl = h('p', { class: 'small muted' }, 'ติ๊กข้อที่คำตอบของคุณมี: 0/' + q.rubric.length);
      var list = h('div', { class: 'answer-box' }, h('h3', {}, 'ตรวจกับเกณฑ์ (ติ๊กข้อที่คุณตอบได้)'));
      q.rubric.forEach(function (r) {
        var cb = h('input', { type: 'checkbox' });
        cb.addEventListener('change', function () {
          if (saved) return;
          ticked += cb.checked ? 1 : -1;
          scoreEl.textContent = 'ติ๊กข้อที่คำตอบของคุณมี: ' + ticked + '/' + q.rubric.length;
        });
        list.appendChild(h('label', { class: 'check' }, cb, h('span', {}, r)));
      });
      list.appendChild(scoreEl);
      out.appendChild(list);

      var saveBtn = h('button', {
        class: 'btn primary', type: 'button', onclick: function () {
          saved = true; saveBtn.remove();
          var ok = ticked / q.rubric.length >= 0.7;
          done(ok);
          var lead = topicEl.querySelector('.lead');
          if (!ok && lead) { topicEl.classList.add('wrong'); lead.textContent = 'ยังตอบไม่ได้? ลองกลับไปอ่านเรื่อง '; }
          out.appendChild(h('div', { class: 'result ' + (ok ? 'ok' : 'bad') },
            ok ? 'ผ่าน (ตอบได้ ' + ticked + '/' + q.rubric.length + ')' : 'ยังไม่ผ่าน (ตอบได้ ' + ticked + '/' + q.rubric.length + ') ข้อนี้จะถูกเก็บไว้ในข้อที่ผิด'));
          out.appendChild(nextBtn());
        }
      }, 'บันทึกผล');
      out.appendChild(saveBtn);
      body.appendChild(out);
    }
  }

  G.views.drill = function (root, parts, query) {
    if (parts[1] === 'run') run(root, query); else setup(root);
  };
})();
