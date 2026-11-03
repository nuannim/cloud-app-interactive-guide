/* Roadmap แผนเตรียมสอบ: เส้นทางเดียว คั่นเป็นโมดูล M07 -> M13 (ไม่ล็อกด่าน) สร้างจากเนื้อหาที่มีอยู่ทั้งหมด */
(function () {
  'use strict';
  var G = window.GUIDE, h = G.h;

  var MIN = { read: 8, kc: 10, detail: 8, scenario: 12, design: 15 };
  var KIND_INFO = {
    read: { icon: 'read', text: 'อ่านสรุปของโมดูล (มี diagram) แล้วกด "อ่านจบแล้ว" ท้ายหน้า' },
    kc: { icon: 'kc', text: 'ข้อสอบฝึก Knowledge Check ของ AWS Academy มีเฉลยและเหตุผล' },
    detail: { icon: 'detail', text: 'โจทย์สั้น ๆ เลือก Option / โหมด ให้ตรงกับความต้องการ' },
    scenario: { icon: 'scenario', text: 'อ่านสถานการณ์ แล้วเลือกหรือเขียนว่าควรใช้ service ไหน' },
    design: { icon: 'design', text: 'โจทย์ยาวหลาย service วาด diagram พร้อมอธิบาย' },
    checkpoint: { icon: 'checkpoint', text: 'ด่านรวม ทบทวนสิ่งที่เรียนมา' }
  };

  function moduleLessons(mid) {
    var m = G.modules[mid], qs = m.questions || [], L = [];
    function ids(type) { return qs.filter(function (q) { return q.type === type; }).map(function (q) { return q.id; }); }
    L.push({ kind: 'read', mid: mid, title: 'อ่านสรุป ' + m.title, href: '#/notes/' + mid, min: MIN.read });
    var kc = ids('kc');
    if (kc.length) L.push({ kind: 'kc', mid: mid, title: 'Knowledge Check', ids: kc, href: '#/drill/run?t=kc&m=' + mid + '&n=all', min: MIN.kc });
    var det = [];
    (m.optionGroups || []).forEach(function (g) { (g.challenges || []).forEach(function (c) { det.push(c.id); }); });
    det = det.slice(0, 10);
    if (det.length) L.push({ kind: 'detail', mid: mid, title: 'Detail: เลือก Option', ids: det, href: '#/lab/options?ids=' + det.join(','), min: MIN.detail });
    var sc = ids('scenario');
    if (sc.length) L.push({ kind: 'scenario', mid: mid, title: 'Scenario', ids: sc, href: '#/drill/run?t=scenario&m=' + mid + '&n=all', min: MIN.scenario });
    var ds = ids('design');
    if (ds.length) L.push({ kind: 'design', mid: mid, title: 'Design: วาด diagram', ids: ds, href: '#/drill/run?t=design&m=' + mid + '&n=all', min: MIN.design });
    L.forEach(function (l) { l.key = mid + ':' + l.kind; });
    return L;
  }

  // ข้อที่ตายตัวสำหรับด่านรวม: เลือกจากท้ายรายการ KC และต้น Scenario ของโมดูลที่เกี่ยวข้อง
  function checkpointIds(mids, perModule) {
    var out = [];
    mids.forEach(function (mid) {
      var qs = G.modules[mid].questions || [];
      var kc = qs.filter(function (q) { return q.type === 'kc'; }), sc = qs.filter(function (q) { return q.type === 'scenario'; });
      var pick = kc.slice(-perModule).concat(sc.slice(0, 1));
      pick.forEach(function (q) { out.push(q.id); });
    });
    return out;
  }

  // หนึ่ง section ต่อหนึ่งโมดูล: ด่านครบทุกชนิด + ด่านรวมท้ายโมดูล (โมดูลสุดท้ายเป็น "ซ้อมใหญ่" ครอบทุกโมดูล)
  function buildPlan() {
    var last = G.order[G.order.length - 1];
    return G.order.map(function (mid) {
      var ls = moduleLessons(mid), isLast = mid === last;
      var ids = isLast ? checkpointIds(G.order, 1) : checkpointIds([mid], 2);
      var uniq = ids.filter(function (id, k) { return ids.indexOf(id) === k; });
      ls.push({
        kind: 'checkpoint', key: isLast ? 'cp-final' : 'cp-' + mid, title: isLast ? 'ซ้อมใหญ่ ก่อนสอบ' : 'ด่านรวม ' + mid, ids: uniq,
        href: '#/drill/run?ids=' + uniq.join(','), min: Math.max(5, Math.round(uniq.length * 1.2))
      });
      return { mid: mid, title: G.modules[mid].title, lessons: ls, min: ls.reduce(function (n, l) { return n + l.min; }, 0) };
    });
  }

  function doneIn(sec) { return sec.lessons.filter(function (l) { return lessonState(l).done; }).length; }

  function lessonState(l) {
    if (l.kind === 'read') { var rd = G.store.isRead(l.mid); return { done: rd, att: rd ? 1 : 0, total: 1, stars: 0 }; }
    var res = G.store.results(), att = 0, right = 0;
    l.ids.forEach(function (id) { var r = res[id]; if (r) { att++; if (r.last) right++; } });
    var done = l.ids.length > 0 && att === l.ids.length, acc = att ? right / att : 0;
    return { done: done, att: att, total: l.ids.length, stars: !done ? 0 : acc >= 0.9 ? 3 : acc >= 0.7 ? 2 : 1 };
  }

  function nextLesson(days) {
    for (var i = 0; i < days.length; i++) for (var j = 0; j < days[i].lessons.length; j++) {
      if (!lessonState(days[i].lessons[j]).done) return { day: days[i], lesson: days[i].lessons[j] };
    }
    return null;
  }

  // ลิงก์บทเรียนต่อท้าย ?rm=<คีย์> เพื่อให้หน้าปลายทางแสดง sidebar แผนสอบ
  function withRm(href, key) { return href + (href.indexOf('?') >= 0 ? '&' : '?') + 'rm=' + encodeURIComponent(key); }
  function flat(secs) {
    var out = [];
    secs.forEach(function (s) { s.lessons.forEach(function (l) { out.push({ sec: s, lesson: l }); }); });
    return out;
  }

  // ให้หน้าอื่นถามได้ว่าด่านถัดไปคืออะไร / มี sidebar ไหม
  G.roadmap = {
    next: function () {
      var secs = buildPlan(), n = nextLesson(secs);
      return n && {
        title: n.lesson.title, href: withRm(n.lesson.href, n.lesson.key), mid: n.lesson.mid,
        started: secs.some(function (s) { return doneIn(s) > 0; })
      };
    },
    hasKey: function (key) {
      return flat(buildPlan()).some(function (x) { return x.lesson.key === key; });
    },
    // ด่านที่ยังไม่เสร็จถัดจากด่านนี้ (วนกลับไปหาจากต้นแผนถ้าไม่มีข้างหน้า)
    nextAfter: function (key) {
      var all = flat(buildPlan()), i = -1, pick = null, k;
      all.forEach(function (x, idx) { if (x.lesson.key === key) i = idx; });
      for (k = i + 1; k < all.length && !pick; k++) if (!lessonState(all[k].lesson).done) pick = all[k];
      for (k = 0; k < all.length && !pick; k++) if (all[k].lesson.key !== key && !lessonState(all[k].lesson).done) pick = all[k];
      return pick && { title: (pick.lesson.mid ? pick.lesson.mid + ' ' : '') + pick.lesson.title, href: withRm(pick.lesson.href, pick.lesson.key) };
    },
    // sidebar ซ้ายของโหมด roadmap: พับได้ (จำค่า) จอแคบเป็น drawer เปิดจากปุ่มลอย "แผน" อัปเดตสถานะสดเมื่อตอบข้อ
    mountSidebar: function (shell, activeKey) {
      var SIDE_KEY = 'aws-guide:rm-side', collapsed = false, dayOpen = {};
      try { collapsed = localStorage.getItem(SIDE_KEY) === '1'; } catch (e) { /* ignore */ }
      shell.classList.toggle('collapsed', collapsed);
      var body = h('div', { class: 'rm-side-body', id: 'rm-side-body' });
      var colBtn = h('button', { class: 'rm-collapse', type: 'button', 'aria-expanded': String(!collapsed), 'aria-controls': 'rm-side-body', 'aria-label': 'พับหรือขยายรายการแผนสอบ' }, G.icon('chevron', 18));
      var aside = h('aside', { class: 'rm-side', id: 'rm-side', 'aria-label': 'แผนสอบ', tabindex: '-1' },
        h('div', { class: 'rm-side-head' }, h('strong', { class: 'rm-side-title' }, 'แผนสอบ'), colBtn), body);
      var scrim = h('div', { class: 'rm-scrim' });
      var fab = h('button', { class: 'rm-fab btn', type: 'button', 'aria-label': 'เปิดรายการแผนสอบ' }, G.icon('menu', 18), 'แผน');
      function closeDrawer() { shell.classList.remove('drawer-open'); }
      function setCollapsed(v) {
        collapsed = v; shell.classList.toggle('collapsed', v); colBtn.setAttribute('aria-expanded', String(!v));
        try { localStorage.setItem(SIDE_KEY, v ? '1' : '0'); } catch (e) { /* ignore */ }
      }
      colBtn.addEventListener('click', function () { if (window.matchMedia('(max-width: 899px)').matches) closeDrawer(); else setCollapsed(!collapsed); });
      fab.addEventListener('click', function () { shell.classList.add('drawer-open'); aside.focus(); });
      scrim.addEventListener('click', closeDrawer);
      function onKey(ev) { if (ev.key === 'Escape') closeDrawer(); }
      document.addEventListener('keydown', onKey);

      function paint() {
        body.innerHTML = '';
        var secs = buildPlan(), total = 0, done = 0, firstOpen = -1;
        secs.forEach(function (s, si) {
          total += s.lessons.length; done += doneIn(s);
          if (firstOpen < 0 && doneIn(s) < s.lessons.length) firstOpen = si;
        });
        body.appendChild(h('div', { class: 'small muted' }, 'ทำแล้ว ' + done + '/' + total + ' ด่าน'));
        body.appendChild(h('div', { class: 'bar', style: 'margin:6px 0 10px' }, h('i', { style: 'width:' + Math.round(done / total * 100) + '%' })));
        secs.forEach(function (sec, di) {
          var hasCur = sec.lessons.some(function (l) { return l.key === activeKey; });
          var list = h('ol', { class: 'rm-list' });
          sec.lessons.forEach(function (l) {
            var st = lessonState(l), cur = l.key === activeKey;
            list.appendChild(h('li', {}, h('a', {
              class: 'rm-link' + (cur ? ' current' : '') + (st.done ? ' done' : ''), href: withRm(l.href, l.key), 'aria-current': cur ? 'step' : null
            }, h('span', { class: 'rm-ico' }, G.icon(st.done ? 'check' : KIND_INFO[l.kind].icon, 16)),
              h('span', { class: 'rm-name' }, (l.mid ? l.mid + ' ' : '') + l.title),
              !st.done && st.att && l.kind !== 'read' ? h('span', { class: 'small muted' }, st.att + '/' + st.total) : null)));
          });
          var det = h('details', { class: 'rm-day-side', open: (dayOpen[di] !== undefined ? dayOpen[di] : (hasCur || di === firstOpen)) ? true : null },
            h('summary', {}, sec.mid + ' ' + sec.title, h('span', { class: 'rm-count' }, doneIn(sec) + '/' + sec.lessons.length)), list);
          det.addEventListener('toggle', function () { dayOpen[di] = det.open; });
          body.appendChild(det);
        });
        body.appendChild(h('p', { class: 'small', style: 'margin-top:10px' }, h('a', { href: '#/roadmap' }, 'ดูแผนทั้งหมด')));
      }
      paint();
      document.addEventListener('aws-progress', paint);
      G.cleanups.push(function () { document.removeEventListener('aws-progress', paint); document.removeEventListener('keydown', onKey); });
      shell.appendChild(aside); shell.appendChild(scrim); shell.appendChild(fab);
      setTimeout(function () { var cur = aside.querySelector('.current'); if (cur && cur.scrollIntoView) cur.scrollIntoView({ block: 'nearest' }); }, 0);
    }
  };

  function stat(icon, value, label) {
    return h('div', { class: 'rm-stat' }, G.icon(icon, 20), h('span', {}, String(value)), h('span', { class: 'small' }, label));
  }

  G.views.roadmap = function (root) {
    var secs = buildPlan();
    var nxt = nextLesson(secs);
    var allLessons = secs.reduce(function (n, s) { return n + s.lessons.length; }, 0);
    var doneCount = secs.reduce(function (n, s) { return n + doneIn(s); }, 0);

    root.appendChild(h('h1', {}, 'แผนเตรียมสอบ'));
    root.appendChild(h('p', { class: 'muted' }, 'ไล่ตามโมดูล M07 → M13 ครบทุกแบบ ไม่ล็อกด่าน กดข้ามไปทำด่านไหนก่อนก็ได้ ความคืบหน้าบันทึกในเครื่องนี้'));

    root.appendChild(h('div', { class: 'rm-stats' },
      stat('flame', G.store.streak(), 'วันติดกัน'), stat('bolt', G.store.xp(), 'XP')));
    root.appendChild(h('div', { class: 'bar', style: 'margin:0 0 6px' }, h('i', { style: 'width:' + Math.round(doneCount / allLessons * 100) + '%' })));
    root.appendChild(h('p', { class: 'small muted' }, 'ทำแล้ว ' + doneCount + ' จาก ' + allLessons + ' ด่าน'));

    if (nxt) root.appendChild(h('p', {}, h('a', { class: 'btn primary', href: withRm(nxt.lesson.href, nxt.lesson.key) }, 'ไปด่านถัดไป: ' + (nxt.lesson.mid ? nxt.lesson.mid + ' ' : '') + nxt.lesson.title)));
    else {
      root.appendChild(h('div', { class: 'result ok' }, 'ครบทุกด่านในแผนแล้ว ลองทบทวนข้อที่ผิดอีกรอบ'));
      root.appendChild(h('p', {}, h('a', { class: 'btn', href: '#/mistakes' }, 'ดูข้อที่ผิด')));
    }

    var openPanel = null, nextNode = null;
    secs.forEach(function (sec, di) {
      var banner = h('div', { class: 'rm-banner' },
        h('h2', {}, sec.mid + ' ' + sec.title),
        h('span', { class: 'small muted' }, 'ประมาณ ' + sec.min + ' นาที · ทำแล้ว ' + doneIn(sec) + '/' + sec.lessons.length + ' ด่าน'));
      var ol = h('ol', { class: 'rm-path' });
      sec.lessons.forEach(function (l, li) {
        var st = lessonState(l), isNext = nxt && nxt.lesson === l;
        var cls = 'rm-node' + (st.done ? ' done' : isNext ? ' next' : '') + (l.kind === 'checkpoint' ? ' checkpoint' : '');
        var panelId = 'rm-panel-' + di + '-' + li;
        var node = h('button', { class: cls, type: 'button', 'aria-expanded': 'false', 'aria-controls': panelId, 'aria-label': (l.mid ? l.mid + ' ' : '') + l.title + (st.done ? ' (ทำแล้ว)' : '') },
          G.icon(st.done ? 'check' : KIND_INFO[l.kind].icon, 30));
        var stars = st.done && l.kind !== 'read' ? h('div', { class: 'rm-stars', 'aria-label': st.stars + ' ดาว' },
          [1, 2, 3].map(function (n) { var s = G.icon('star', 16); s.setAttribute('class', n <= st.stars ? 'on' : 'off'); return s; })) : null;
        var panel = h('div', { class: 'rm-panel', id: panelId, hidden: true });
        var btnText = st.done ? 'ทำซ้ำ' : st.att ? 'ทำต่อ' : l.kind === 'read' ? 'เปิดอ่าน' : 'เริ่ม';
        panel.appendChild(h('h3', {}, (l.mid ? l.mid + ' ' : '') + l.title));
        panel.appendChild(h('p', { class: 'small muted' }, KIND_INFO[l.kind].text));
        panel.appendChild(h('p', { class: 'small' }, l.kind === 'read' ? '~' + l.min + ' นาที · ' + (st.done ? 'อ่านจบแล้ว' : 'ยังไม่อ่านจบ')
          : l.ids.length + ' ข้อ · ทำแล้ว ' + st.att + '/' + st.total + ' · ~' + l.min + ' นาที'));
        panel.appendChild(h('a', { class: 'btn primary', href: withRm(l.href, l.key) }, btnText));
        node.addEventListener('click', function () {
          var willOpen = panel.hidden;
          if (openPanel) { openPanel.panel.hidden = true; openPanel.node.setAttribute('aria-expanded', 'false'); openPanel = null; }
          if (willOpen) { panel.hidden = false; node.setAttribute('aria-expanded', 'true'); openPanel = { panel: panel, node: node }; }
        });
        if (isNext) nextNode = node;
        ol.appendChild(h('li', { class: 'rm-item pos' + (li % 4) },
          node, h('div', { class: 'rm-label' }, h('strong', {}, (l.mid ? l.mid + ' ' : '') + l.title)), stars, panel));
      });
      root.appendChild(h('section', { class: 'rm-day', id: 'rm-' + sec.mid, 'aria-label': sec.mid + ' ' + sec.title }, banner, ol));
    });

    // สารบัญลอยขวาแบบ Notion (js/toc.js): ข้ามไปที่โมดูลที่ต้องการ
    G.mountToc(secs.map(function (s) { return { id: 'rm-' + s.mid, title: s.mid + ' ' + s.title }; }));

    // เลื่อนไปที่ด่านถัดไปให้เห็นทันที
    if (nextNode) setTimeout(function () { nextNode.scrollIntoView({ block: 'center' }); }, 0);
  };
})();
