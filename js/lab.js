(function () {
  'use strict';
  var G = window.GUIDE, h = G.h;

  function tabs(active) {
    var row = h('div', { class: 'tabs' });
    [['limits', 'ชนลิมิต'], ['options', 'เลือก Option'], ['guess', 'เดาตัวเลข']].forEach(function (t) {
      row.appendChild(h('a', { class: 'chip' + (active === t[0] ? ' on' : ''), href: '#/lab/' + t[0], style: 'text-decoration:none' }, t[1]));
    });
    return row;
  }

  function pickModules(query, rerun) {
    var sel = {};
    var chosen = query.m ? query.m.split(',') : G.order;
    G.order.forEach(function (m) { sel[m] = chosen.indexOf(m) >= 0; });
    return { sel: sel, el: G.moduleChips(sel, function () { rerun(Object.keys(sel).filter(function (k) { return sel[k]; })); }) };
  }

  /* ---------- limits simulator ---------- */
  function limitsTab(root, query) {
    root.appendChild(h('p', { class: 'muted' }, 'ลองตั้งค่าให้เกินดู แล้วดูว่า AWS ตอบกลับยังไง และต้องแก้ด้วยอะไร'));
    var list = h('div');
    var mods = pickModules(query, function (chosen) { draw(chosen); });
    root.appendChild(mods.el);
    root.appendChild(list);

    function draw(chosen) {
      list.innerHTML = '';
      var items = G.all('limit').filter(function (e) { return e.item.sim && chosen.indexOf(e.module) >= 0; });
      if (!items.length) list.appendChild(h('p', { class: 'muted', style: 'margin-top:14px' }, 'ไม่มีลิมิตที่ลองได้ในโมดูลที่เลือก'));
      items.forEach(function (e) { list.appendChild(limitCard(e, query.id === e.item.id)); });
    }
    draw(query.m ? query.m.split(',') : G.order);
  }

  function limitCard(e, focus) {
    var l = e.item, s = l.sim;
    var input = h('input', { type: 'number', min: 0, step: s.step || 1, 'aria-label': l.name });
    var range = h('input', { type: 'range', min: s.min || 0, max: s.sliderMax || (s.limitAt * 2), step: s.step || 1, 'aria-label': l.name + ' (slider)' });
    var status = h('div', { class: 'sim-status', 'aria-live': 'polite' });
    var start = s.start != null ? s.start : s.min || 0;

    function update(v) {
      input.value = v; range.value = v;
      status.className = 'sim-status';
      status.innerHTML = '';
      if (v > s.limitAt) {
        status.classList.add('bad');
        status.appendChild(h('strong', {}, '✗ ' + s.overMsg));
        status.appendChild(h('span', { class: 'fix' }, 'ทางแก้: ' + s.fix));
      } else if (s.lowAt != null && v < s.lowAt) {
        status.classList.add('bad');
        status.appendChild(h('strong', {}, '✗ ' + (s.underMsg || 'ต่ำกว่าค่าต่ำสุดที่อนุญาต')));
        if (s.fix) status.appendChild(h('span', { class: 'fix' }, 'ทางแก้: ' + s.fix));
      } else {
        status.classList.add('ok');
        status.textContent = '✓ ใช้ได้ ลองเพิ่มให้เกินดู';
      }
    }
    input.addEventListener('input', function () { update(Number(input.value) || 0); });
    range.addEventListener('input', function () { update(Number(range.value)); });
    update(start);

    var card = h('div', { class: 'card' },
      h('div', { class: 'row spread' }, h('h3', { style: 'margin:0' }, l.service + ' · ' + l.name), h('span', { class: 'row' }, G.supplementBadge(l), h('span', { class: 'badge' }, e.module))),
      h('div', { class: 'row', style: 'margin:10px 0' },
        h('div', { style: 'width:150px' }, input), h('span', {}, s.unit)),
      range, status,
      h('details', { style: 'margin-top:10px' }, h('summary', { class: 'small muted', style: 'cursor:pointer' }, 'เฉลยลิมิต'),
        h('p', {}, l.display), h('p', { class: 'small muted' }, 'อ้างอิง notes ' + l.source), G.topicLink(l.id, false)));
    if (focus) { card.style.borderColor = 'var(--accent)'; setTimeout(function () { card.scrollIntoView({ block: 'center' }); }, 0); }
    return card;
  }

  /* ---------- option picker ---------- */
  function optionsTab(root, query) {
    var groups = [];
    G.order.forEach(function (m) { (G.modules[m].optionGroups || []).forEach(function (g) { groups.push({ module: m, group: g }); }); });

    if (!query.g && !query.ids && !query.m) {
      root.appendChild(h('p', { class: 'muted' }, 'ได้โจทย์ความต้องการสั้น ๆ แล้วเลือกว่าต้องใช้ตัวเลือก (option / โหมด / class) ไหน'));
      var grid = h('div', { class: 'grid' });
      groups.forEach(function (e) {
        grid.appendChild(h('a', { class: 'card link', href: '#/lab/options?g=' + e.group.id },
          h('div', { class: 'small muted' }, e.module + ' · ' + e.group.service),
          h('h3', {}, e.group.title),
          h('div', { class: 'small muted' }, (e.group.challenges || []).length + ' โจทย์ · ' + e.group.options.length + ' ตัวเลือก')));
      });
      root.appendChild(grid);
      return;
    }

    // ทำทีละกลุ่ม (?g=) หรือรวมหลายกลุ่มต่อกัน: ทั้งโมดูล (?m=M07) หรือชุดข้อที่ระบุ (?ids=a,b,c) ใช้กับด่านใน Roadmap
    var queue, title;
    if (query.g) {
      var entry = groups.filter(function (e) { return e.group.id === query.g; })[0];
      if (!entry) { root.appendChild(h('div', { class: 'card' }, 'ไม่พบกลุ่มนี้ ', h('a', { href: '#/lab/options' }, 'กลับ'))); return; }
      queue = (entry.group.challenges || []).map(function (c) { return { c: c, g: entry.group }; });
      if (query.id) queue = queue.filter(function (x) { return x.c.id === query.id; });
      title = entry.group.service + ' · ' + entry.group.title;
    } else {
      var want = query.ids ? query.ids.split(',') : null;
      queue = G.all('challenge').filter(function (e) { return want ? want.indexOf(e.item.id) >= 0 : e.module === query.m; })
        .map(function (e) { return { c: e.item, g: e.group }; });
      title = 'Detail · เลือก Option' + (query.m ? ' ' + query.m : '');
    }
    queue = G.shuffle(queue);
    var i = 0, box = h('div');
    root.appendChild(h('p', { class: 'small' }, h('a', { href: query.g ? '#/lab/options' : '#/' }, query.g ? '← กลุ่มอื่น' : '← กลับ')));
    root.appendChild(h('h2', {}, title));
    root.appendChild(box);

    function show() {
      box.innerHTML = '';
      if (i >= queue.length) {
        box.appendChild(h('div', { class: 'card' }, h('p', {}, 'จบชุดนี้แล้ว'),
          h('div', { class: 'row' },
            h('button', { class: 'btn primary', type: 'button', onclick: function () { i = 0; queue = G.shuffle(queue); show(); } }, 'ทำซ้ำ'),
            h('a', { class: 'btn', href: query.g ? '#/lab/options' : '#/roadmap' }, query.g ? 'เลือกกลุ่มอื่น' : 'กลับไปแผนสอบ'))));
        return;
      }
      var c = queue[i].c, g = queue[i].g, locked = false;
      var card = h('div', { class: 'card' },
        h('div', { class: 'row spread small muted' }, h('span', {}, 'ข้อ ' + (i + 1) + '/' + queue.length), G.supplementBadge(c)),
        h('div', { class: 'prompt', style: 'margin:8px 0 14px' }, c.requirement));
      G.shuffle(g.options).forEach(function (o) {
        var b = h('button', { class: 'choice', type: 'button' }, h('span', { class: 'txt' }, o.name));
        b.addEventListener('click', function () {
          if (locked) return;
          locked = true;
          var ok = o.name === c.answer;
          G.store.record(c.id, ok);
          Array.prototype.forEach.call(card.querySelectorAll('.choice'), function (x) {
            x.disabled = true;
            var name = x.querySelector('.txt').textContent;
            if (name === c.answer) x.classList.add('right');
            else if (x === b) x.classList.add('wrong');
          });
          card.appendChild(h('div', { class: 'result ' + (ok ? 'ok' : 'bad') }, ok ? 'ถูกต้อง' : 'คำตอบที่ถูกคือ ' + c.answer));
          card.appendChild(h('div', { class: 'answer-box' }, h('h3', {}, 'ทำไม'), h('p', {}, c.why), c.source ? h('p', { class: 'small muted' }, 'อ้างอิง notes ' + c.source) : null));
          card.appendChild(G.topicLink(c.id, !ok));
          card.appendChild(compareTable(g));
          card.appendChild(h('p', {}, h('button', { class: 'btn primary', type: 'button', onclick: function () { i++; show(); } }, i + 1 < queue.length ? 'ข้อต่อไป' : 'จบ')));
        });
        card.appendChild(b);
      });
      box.appendChild(card);
    }
    show();
  }

  function compareTable(g) {
    var rows = g.options.map(function (o) {
      return h('tr', {}, h('td', {}, h('strong', {}, o.name)), h('td', {}, o.traits), h('td', {}, o.when), h('td', {}, o.tradeoff || '–'));
    });
    return h('div', { class: 'table-wrap' }, h('table', {},
      h('thead', {}, h('tr', {}, h('th', {}, 'ตัวเลือก'), h('th', {}, 'ลักษณะ'), h('th', {}, 'เลือกเมื่อ'), h('th', {}, 'ข้อแลกเปลี่ยน'))),
      h('tbody', {}, rows)));
  }

  /* ---------- guess the number ---------- */
  function norm(s) { return String(s).toLowerCase().replace(/[\s,]/g, ''); }
  function accepted(l, input) {
    var n = norm(input);
    if (!n) return false;
    return (l.accept || []).some(function (a) { return norm(a) === n; });
  }

  function guessTab(root, query) {
    root.appendChild(h('p', { class: 'muted' }, 'ถามค่าลิมิต พิมพ์ตอบ (ใส่หน่วยหรือไม่ใส่ก็ได้ เช่น 15 หรือ 15 นาที)'));
    var box = h('div');
    var queue = [], i = 0;
    var mods = pickModules(query, function (chosen) { start(chosen); });
    root.appendChild(mods.el);
    root.appendChild(box);

    function start(chosen) {
      queue = G.shuffle(G.all('limit').filter(function (e) { return chosen.indexOf(e.module) >= 0 && e.item.accept && e.item.accept.length; }));
      i = 0;
      show();
    }

    function show() {
      box.innerHTML = '';
      if (!queue.length) { box.appendChild(h('p', { class: 'muted', style: 'margin-top:14px' }, 'ไม่มีลิมิตที่ถามได้ในโมดูลที่เลือก')); return; }
      if (i >= queue.length) {
        box.appendChild(h('div', { class: 'card', style: 'margin-top:14px' }, h('p', {}, 'ครบแล้ว'),
          h('button', { class: 'btn primary', type: 'button', onclick: function () { start(Object.keys(mods.sel).filter(function (k) { return mods.sel[k]; })); } }, 'เริ่มใหม่')));
        return;
      }
      var e = queue[i], l = e.item, locked = false;
      var input = h('input', { type: 'text', 'aria-label': 'คำตอบ', autocomplete: 'off', inputmode: 'text' });
      var out = h('div');
      var card = h('div', { class: 'card', style: 'margin-top:14px' },
        h('div', { class: 'row spread small muted' }, h('span', {}, 'ข้อ ' + (i + 1) + '/' + queue.length + ' · ' + e.module), G.supplementBadge(l)),
        h('h3', { style: 'margin:8px 0' }, l.service + ' — ' + l.name + ' คือเท่าไร?'),
        input, out);
      function check() {
        if (locked) return;
        locked = true;
        var ok = accepted(l, input.value);
        G.store.record(l.id, ok);
        out.appendChild(h('div', { class: 'result ' + (ok ? 'ok' : 'bad') }, ok ? 'ถูกต้อง' : 'ยังไม่ถูก'));
        out.appendChild(h('div', { class: 'answer-box' }, h('p', {}, 'เฉลย: ' + l.display), h('p', { class: 'small muted' }, 'อ้างอิง notes ' + l.source)));
        out.appendChild(G.topicLink(l.id, !ok));
        out.appendChild(h('p', {}, h('button', { class: 'btn primary', type: 'button', onclick: function () { i++; show(); } }, 'ข้อต่อไป')));
        checkBtn.remove();
      }
      var checkBtn = h('button', { class: 'btn primary', type: 'button', style: 'margin-top:10px', onclick: check }, 'ตรวจ');
      input.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') check(); });
      card.insertBefore(checkBtn, out);
      box.appendChild(card);
      input.focus();
    }
    start(query.m ? query.m.split(',') : G.order);
  }

  G.views.lab = function (root, parts, query) {
    var tab = parts[1] || 'limits';
    root.appendChild(h('h1', {}, 'Details Lab'));
    root.appendChild(tabs(tab));
    if (tab === 'options') optionsTab(root, query);
    else if (tab === 'guess') guessTab(root, query);
    else limitsTab(root, query);
  };
})();
