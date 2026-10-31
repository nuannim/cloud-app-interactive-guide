(function () {
  'use strict';
  var G = window.GUIDE, h = G.h;

  // markdown แบบย่อในข้อความสรุป: `code` และ **ตัวหนา** (escape ก่อนเสมอ)
  function inline(s) {
    return G.esc(s).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  }

  function practiceLinks(mid) {
    var c = G.counts(mid), row = h('div', { class: 'row', style: 'margin:4px 0 20px' });
    if (c.scenario) row.appendChild(h('a', { class: 'btn primary', href: '#/drill/run?t=scenario&m=' + mid + '&n=all' }, 'Scenario (' + c.scenario + ')'));
    if (c.design) row.appendChild(h('a', { class: 'btn primary', href: '#/drill/run?t=design&m=' + mid + '&n=all' }, 'Design · วาด diagram (' + c.design + ')'));
    if (c.kc) row.appendChild(h('a', { class: 'btn primary', href: '#/drill/run?t=kc&m=' + mid + '&n=all' }, 'Knowledge Check (' + c.kc + ')'));
    row.appendChild(h('a', { class: 'btn', href: '#/lab/limits?m=' + mid }, 'ชนลิมิต'));
    row.appendChild(h('a', { class: 'btn', href: '#/lab/guess?m=' + mid }, 'เดาตัวเลข'));
    return row;
  }

  function diagramFigure(d) {
    return h('figure', { class: 'diagram' },
      h('figcaption', {}, h('strong', {}, d.title), d.caption ? h('span', { class: 'muted' }, ' — ' + d.caption) : null),
      G.renderFlow(d.flow));
  }

  G.views.notes = function (root, parts, query) {
    var mid = parts[1];
    if (!mid || !G.modules[mid]) {
      root.appendChild(h('h1', {}, 'สรุปเนื้อหา'));
      root.appendChild(h('p', { class: 'muted' }, 'สรุปที่เขียนใหม่เป็นภาษาของเราเอง มี diagram ประกอบ และลิงก์ไปยังโจทย์ที่เกี่ยวข้อง'));
      var list = h('div', { class: 'modlist' });
      G.order.forEach(function (m) {
        var nd = (G.modules[m].notes || []).filter(function (n) { return n.diagram; }).length;
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
    root.appendChild(practiceLinks(mid));

    var sections = m.notes || [];
    if (sections.length > 2) {
      var toc = h('nav', { class: 'row toc', 'aria-label': 'หัวข้อในหน้านี้' });
      sections.forEach(function (n, i) {
        toc.appendChild(h('button', {
          class: 'chip', type: 'button', onclick: function () {
            var el = document.getElementById('sec-' + i);
            if (el) el.scrollIntoView({ block: 'start' });
          }
        }, n.heading));
      });
      root.appendChild(toc);
    }

    sections.forEach(function (n, i) {
      var card = h('section', { class: 'card notes-body', id: 'sec-' + i },
        h('h2', {}, n.heading), h('div', { html: n.body }));
      if (n.diagram) card.appendChild(diagramFigure(n.diagram));
      if (n.refs && n.refs.length) {
        var chips = h('div', { class: 'row', style: 'margin-top:8px' });
        n.refs.forEach(function (id) {
          if (!G.index[id]) return;
          chips.appendChild(h('a', { class: 'chip', href: G.linkFor(id) }, G.labelFor(id)));
        });
        card.appendChild(h('div', { class: 'small muted', style: 'margin-top:12px' }, 'ฝึกเรื่องนี้'));
        card.appendChild(chips);
      }
      root.appendChild(card);
    });

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
    root.appendChild(h('p', { style: 'margin:18px 0' }, readBtn));

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
