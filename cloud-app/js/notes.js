(function () {
  'use strict';
  var G = window.GUIDE, h = G.h;

  // markdown แบบย่อในข้อความสรุป: `code` และ **ตัวหนา** (escape ก่อนเสมอ)
  function inline(s) {
    return G.esc(s).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  }

  function practiceLinks(mid) {
    var c = G.counts(mid), row = h('div', { class: 'row', style: 'margin:4px 0 20px' });
    if (c.scenario) row.appendChild(h('a', { class: 'btn', href: '#/drill/run?t=scenario&m=' + mid + '&n=all' }, 'Scenario (' + c.scenario + ')'));
    if (c.design) row.appendChild(h('a', { class: 'btn', href: '#/drill/run?t=design&m=' + mid + '&n=all' }, 'Design · วาด diagram (' + c.design + ')'));
    if (c.kc) row.appendChild(h('a', { class: 'btn', href: '#/drill/run?t=kc&m=' + mid + '&n=all' }, 'Knowledge Check (' + c.kc + ')'));
    row.appendChild(h('a', { class: 'btn', href: '#/lab/limits?m=' + mid }, 'ชนลิมิต'));
    row.appendChild(h('a', { class: 'btn', href: '#/lab/guess?m=' + mid }, 'เดาตัวเลข'));
    return row;
  }

  function diagramsOf(n) { return n.diagrams || (n.diagram ? [n.diagram] : []); }

  function diagramFigure(d) {
    var cap = h('figcaption', {}, h('strong', {}, d.title), d.caption ? h('span', { class: 'muted' }, ' — ' + d.caption) : null,
      d.supplement ? h('span', { class: 'badge warn', style: 'margin-left:8px' }, 'นอก notes') : null);
    if (d.svgId) {
      // แผนภาพวาดมือด้วย skill diagram-design ฝังเป็นสตริงใน data/diagrams.js (ข้อมูลของเราเอง ไม่ใช่ข้อมูลภายนอก)
      var wrap = h('div', { class: 'svg-wrap', html: (G.svgDiagrams && G.svgDiagrams[d.svgId]) || '' });
      return h('figure', { class: 'diagram svg-fig' }, cap, wrap, h('p', { class: 'svg-hint small muted' }, 'เลื่อนดูซ้าย–ขวาได้'));
    }
    return h('figure', { class: 'diagram' }, cap, G.renderFlow(d.flow));
  }

  G.views.notes = function (root, parts, query) {
    var mid = parts[1];
    if (!mid || !G.modules[mid]) {
      root.appendChild(h('h1', {}, 'สรุปเนื้อหา'));
      root.appendChild(h('p', { class: 'muted' }, 'สรุปที่เขียนใหม่เป็นภาษาของเราเอง มี diagram ประกอบ และลิงก์ไปยังโจทย์ที่เกี่ยวข้อง'));
      root.appendChild(h('p', { class: 'small' }, h('a', { href: '#/mindmap' }, 'ดู Mindmap ของทุกโมดูล')));
      var list = h('div', { class: 'modlist' });
      G.order.forEach(function (m) {
        var nd = (G.modules[m].notes || []).reduce(function (c, n) { return c + diagramsOf(n).length; }, 0);
        list.appendChild(h('a', { class: 'modrow', href: '#/notes/' + m },
          h('span', { class: 'modname' }, m + ' ' + G.modules[m].title),
          h('span', { class: 'small muted modsum' }, G.modules[m].summary),
          h('span', { class: 'small muted modmeta' }, nd ? nd + ' diagram' : '')));
      });
      root.appendChild(list);
      return;
    }

    var m = G.modules[mid];
    root.appendChild(h('p', { class: 'small' }, h('a', { href: '#/notes' }, '← ทุกโมดูล')));
    root.appendChild(h('h1', {}, mid + ' ' + m.title));
    root.appendChild(h('p', { class: 'muted' }, m.summary));
    var sections = m.notes || [];
    // โมดูลที่มีฉบับย่อ (n.brief) มีปุ่ม เนื้อหาเต็ม | เนื้อหาย่อ ที่สลับทั้งหน้า จำค่าที่เลือกไว้ในเบราว์เซอร์
    var hasBrief = sections.some(function (n) { return n.brief; }), mode = 'full', sectionsBox = null, modeToggle = null, modeLabel = null;
    try { if (hasBrief && localStorage.getItem('aws-notes-mode') === 'brief') mode = 'brief'; } catch (e) { /* ignore */ }
    if (hasBrief) {
      // สวิตช์เปิด/ปิด: ป้ายบอกโหมดปัจจุบัน ปุ่มเลื่อนไปขวาเมื่อเป็นเนื้อหาย่อ
      modeLabel = h('span', { class: 'mode-label' });
      modeToggle = h('button', {
        class: 'mode-toggle', type: 'button', role: 'switch', 'aria-label': 'สลับเนื้อหาเต็ม / เนื้อหาย่อ',
        onclick: function () { setMode(mode === 'full' ? 'brief' : 'full'); }
      }, modeLabel, h('span', { class: 'switch-track', 'aria-hidden': 'true' }, h('span', { class: 'switch-knob' })));
    }
    // แถวเดียวกัน: ลิงก์ Mindmap ชิดซ้าย สวิตช์ชิดขวา
    root.appendChild(h('div', { class: 'row spread mode-row' },
      h('a', { class: 'small', href: '#/mindmap/' + mid }, 'ดู Mindmap ของโมดูลนี้'), modeToggle || h('span')));
    root.appendChild(practiceLinks(mid));

    sectionsBox = h('div', { class: 'notes-sections' });
    root.appendChild(sectionsBox);

    // สารบัญลอยชิดขอบขวาของจอ (แบบ Notion): ปกติเป็นขีดสั้น ๆ ชี้เมาส์แล้วกางเป็นรายการ จอแคบใช้ปุ่มมุมขวาล่าง
    var tocItems = sections.map(function (n, i) { return { id: 'sec-' + i, title: n.heading }; });
    if (m.kc && (m.kc.remember || []).length) tocItems.push({ id: 'sec-kc', title: 'จำไว้จาก Knowledge Check' });
    var tocRail = null, tocPanel = null, tocLinks = {}, tocForced = null, tocCur = null;
    if (tocItems.length > 2) {
      var tocList = h('ul', { class: 'toc-list' });
      tocItems.forEach(function (t) {
        var a = h('a', { href: '#', title: t.title, onclick: function (ev) {
          ev.preventDefault();
          var el = document.getElementById(t.id);
          if (el) el.scrollIntoView({ block: 'start' });
          tocForced = t.id; // หัวข้อท้ายหน้าที่สั้นจนเลื่อนไม่ถึงขอบบน ยังต้องเน้นตามที่กด จนกว่าผู้ใช้จะเลื่อนเอง
          paintActive(t.id);
          tocRail.classList.remove('open');
        } }, h('span', { class: 'toc-tick', 'aria-hidden': 'true' }), h('span', { class: 'toc-title' }, t.title));
        tocLinks[t.id] = a;
        tocList.appendChild(h('li', {}, a));
      });
      var tocOpen = h('button', {
        class: 'toc-open', type: 'button', 'aria-label': 'สารบัญ', 'aria-expanded': 'false',
        onclick: function () {
          var on = tocRail.classList.toggle('open');
          tocOpen.setAttribute('aria-expanded', on ? 'true' : 'false');
        }
      }, 'สารบัญ');
      tocPanel = h('div', { class: 'toc-panel' }, tocList);
      tocRail = h('nav', { class: 'toc-rail', 'aria-label': 'หัวข้อในหน้านี้' }, tocOpen, tocPanel);
      document.body.appendChild(tocRail);
      var onDocClick = function (ev) { if (tocRail && !tocRail.contains(ev.target)) tocRail.classList.remove('open'); };
      var onScroll = function () { computeActive(); }; // งานเบา (วัดตำแหน่งไม่กี่หัวข้อ) คำนวณตรงเลย ไม่ต้องรอ requestAnimationFrame
      var onUserScroll = function () { if (tocForced) { tocForced = null; computeActive(); } };
      document.addEventListener('click', onDocClick);
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll);
      ['wheel', 'touchmove', 'keydown', 'pointerdown'].forEach(function (ev) { window.addEventListener(ev, onUserScroll, { passive: true }); });
      G.cleanups.push(function () {
        document.removeEventListener('click', onDocClick);
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onScroll);
        ['wheel', 'touchmove', 'keydown', 'pointerdown'].forEach(function (ev) { window.removeEventListener(ev, onUserScroll); });
        if (tocRail) tocRail.remove();
      });
    }
    // เน้นหัวข้อที่กำลังอ่าน = หัวข้อสุดท้ายที่ขอบบนผ่านเส้นอ้างอิงใต้ topbar แล้ว (เลื่อนสุดหน้า = หัวข้อสุดท้าย)
    function paintActive(cur) {
      if (!tocRail || cur === tocCur) return;
      tocCur = cur;
      Object.keys(tocLinks).forEach(function (k) { tocLinks[k].classList.toggle('active', k === cur); });
      var a = tocLinks[cur]; // เลื่อนรายการในแผงให้หัวข้อที่เน้นอยู่ในมุมมอง (แผงเลื่อนได้เมื่อรายการยาว)
      if (a && tocPanel.scrollHeight > tocPanel.clientHeight) {
        if (a.offsetTop < tocPanel.scrollTop) tocPanel.scrollTop = a.offsetTop;
        else if (a.offsetTop + a.offsetHeight > tocPanel.scrollTop + tocPanel.clientHeight) tocPanel.scrollTop = a.offsetTop + a.offsetHeight - tocPanel.clientHeight;
      }
    }
    function computeActive() {
      if (!tocRail) return;
      var cur = tocItems[0].id;
      tocItems.forEach(function (t) { var el = document.getElementById(t.id); if (el && el.getBoundingClientRect().top <= 120) cur = t.id; });
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) cur = tocItems[tocItems.length - 1].id;
      paintActive(tocForced || cur);
    }
    function watchActive() { computeActive(); }

    function paintSections() {
      sectionsBox.textContent = '';
      sections.forEach(paintSection);
    }
    function paintSection(n, i) {
      var bodyEl = h('div', { html: mode === 'brief' && n.brief ? n.brief : n.body });
      var card = h('section', { class: 'card notes-body', id: 'sec-' + i }, h('h2', {}, n.heading), bodyEl);
      // ภาพที่มีช่องวางใน body (<div class="fig-slot" data-i="N">) ไปอยู่ตรงนั้น (ท้ายหัวข้อย่อยของมัน) ที่เหลือเรียงท้ายหัวข้อเหมือนเดิม
      var figs = diagramsOf(n), placed = {};
      Array.prototype.forEach.call(bodyEl.querySelectorAll('.fig-slot'), function (slot) {
        var k = Number(slot.getAttribute('data-i'));
        if (figs[k] && !placed[k]) { placed[k] = true; slot.replaceWith(diagramFigure(figs[k])); } else slot.remove();
      });
      figs.forEach(function (d, k) { if (!placed[k]) card.appendChild(diagramFigure(d)); });
      if (n.refs && n.refs.length) {
        var chips = h('div', { class: 'row', style: 'margin-top:8px' });
        n.refs.forEach(function (id) {
          if (!G.index[id]) return;
          chips.appendChild(h('a', { class: 'chip', href: G.linkFor(id) }, G.labelFor(id)));
        });
        card.appendChild(h('div', { class: 'small muted', style: 'margin-top:12px' }, 'ฝึกเรื่องนี้'));
        card.appendChild(chips);
      }
      sectionsBox.appendChild(card);
    }
    function setMode(next) {
      var anchor = 0, top = Infinity, anchorTop = 0;
      sections.forEach(function (n, i) { // หัวข้อที่อยู่ใกล้ขอบบนจอที่สุด: หลังสลับให้มันอยู่ตำแหน่งเดิมบนจอ (ไม่เด้ง)
        var el = document.getElementById('sec-' + i);
        if (el) { var t = el.getBoundingClientRect().top, d = Math.abs(t); if (d < top) { top = d; anchor = i; anchorTop = t; } }
      });
      mode = next;
      try { localStorage.setItem('aws-notes-mode', mode); } catch (e) { /* ignore */ }
      paintSections();
      paintMode();
      var el = document.getElementById('sec-' + anchor);
      if (el) { var delta = el.getBoundingClientRect().top - anchorTop; if (delta) window.scrollBy(0, delta); }
      watchActive();
    }
    function paintMode() {
      if (!modeToggle) return;
      modeToggle.classList.toggle('on', mode === 'brief');
      modeToggle.setAttribute('aria-checked', mode === 'brief' ? 'true' : 'false');
      modeLabel.textContent = mode === 'brief' ? 'เนื้อหาย่อ' : 'เนื้อหาเต็ม';
    }
    paintSections();
    paintMode();

    // สรุป "จำไว้" จาก Knowledge Check ของบทนี้
    if (m.kc && (m.kc.remember || []).length) {
      var kcCard = h('section', { class: 'card notes-body', id: 'sec-kc' }, h('h2', {}, 'จำไว้จาก Knowledge Check'));
      m.kc.remember.forEach(function (b) {
        if (b.type === 'table') {
          kcCard.appendChild(h('div', { class: 'table-wrap' }, h('table', {},
            h('thead', {}, h('tr', {}, b.head.map(function (c) { return h('th', { html: inline(c) }); }))),
            h('tbody', {}, b.rows.map(function (r) { return h('tr', {}, r.map(function (c) { return h('td', { html: inline(c) }); })); })))));
        } else {
          kcCard.appendChild(h('ul', {}, b.items.map(function (t) { return h('li', { html: inline(t) }); })));
        }
      });
      if (m.kc.summary && m.kc.summary.thinking) kcCard.appendChild(h('p', { class: 'muted' }, 'วิธีคิด: ' + m.kc.summary.thinking));
      root.appendChild(kcCard);
    }
    watchActive();

    // ปุ่ม "อ่านจบแล้ว" (นับเป็นด่านอ่านสรุปใน Roadmap)
    var readBtn = h('button', { type: 'button', class: 'btn' });
    function paintRead() {
      var on = G.store.isRead(mid);
      readBtn.className = 'btn' + (on ? '' : ' primary');
      readBtn.textContent = on ? 'อ่านจบแล้ว (แตะเพื่อยกเลิก)' : 'อ่านจบโมดูลนี้แล้ว';
      readBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    }
    readBtn.addEventListener('click', function () { G.store.markRead(mid, !G.store.isRead(mid)); paintRead(); });
    paintRead();
    var nxLesson = query && query.rm && G.roadmap && G.roadmap.nextAfter(query.rm); // โหมด roadmap: ไปด่านถัดไป
    root.appendChild(h('div', { class: 'row', style: 'margin:18px 0' }, readBtn,
      nxLesson ? h('a', { class: 'btn', href: nxLesson.href }, 'ด่านถัดไป: ' + nxLesson.title) : null));

    // มาจากลิงก์ในเฉลย (?s=ลำดับหัวข้อ): เลื่อนไปที่หัวข้อนั้นและเน้นให้เห็น
    if (query && query.s != null) {
      setTimeout(function () {
        var el = document.getElementById('sec-' + query.s);
        if (!el) return;
        el.classList.add('flash');
        el.scrollIntoView({ block: 'start' });
      }, 0);
    }

    var i = G.order.indexOf(mid), prev = G.order[i - 1], next = G.order[i + 1];
    root.appendChild(h('div', { class: 'row spread' },
      prev ? h('a', { class: 'btn', href: '#/notes/' + prev }, '← ' + prev) : h('span'),
      next ? h('a', { class: 'btn', href: '#/notes/' + next }, next + ' →') : h('span')));
  };
})();
