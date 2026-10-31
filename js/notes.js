(function () {
  'use strict';
  var G = window.GUIDE, h = G.h;

  G.views.notes = function (root, parts) {
    var mid = parts[1];
    if (!mid || !G.modules[mid]) {
      root.appendChild(h('h1', {}, 'สรุปเนื้อหา'));
      root.appendChild(h('p', { class: 'muted' }, 'สรุปที่เขียนใหม่เป็นภาษาของเราเอง แต่ละหัวข้อลิงก์ไปยังโจทย์และลิมิตที่เกี่ยวข้อง'));
      var grid = h('div', { class: 'grid' });
      G.order.forEach(function (m) {
        grid.appendChild(h('a', { class: 'card link', href: '#/notes/' + m },
          h('div', { class: 'small muted' }, m), h('h3', {}, G.modules[m].title), h('div', { class: 'small muted' }, G.modules[m].summary)));
      });
      root.appendChild(grid);
      return;
    }

    var m = G.modules[mid];
    root.appendChild(h('p', {}, h('a', { href: '#/notes' }, '← ทุกโมดูล')));
    root.appendChild(h('h1', {}, mid + ' ' + m.title));
    root.appendChild(h('p', { class: 'muted' }, m.summary));
    root.appendChild(h('div', { class: 'row', style: 'margin-bottom:16px' },
      h('a', { class: 'btn primary', href: '#/drill/run?m=' + mid + '&n=all' }, 'ทำโจทย์โมดูลนี้'),
      h('a', { class: 'btn', href: '#/lab/limits?m=' + mid }, 'ลองชนลิมิต'),
      h('a', { class: 'btn', href: '#/lab/guess?m=' + mid }, 'เดาตัวเลข')));

    (m.notes || []).forEach(function (n) {
      var card = h('div', { class: 'card notes-body' }, h('h2', {}, n.heading), h('div', { html: n.body }));
      if (n.refs && n.refs.length) {
        var chips = h('div', { class: 'row', style: 'margin-top:8px' });
        n.refs.forEach(function (id) {
          if (!G.index[id]) return;
          chips.appendChild(h('a', { class: 'chip', href: G.linkFor(id), style: 'text-decoration:none' }, G.labelFor(id)));
        });
        card.appendChild(h('div', { class: 'small muted', style: 'margin-top:10px' }, 'ฝึกเรื่องนี้'));
        card.appendChild(chips);
      }
      root.appendChild(card);
    });

    var i = G.order.indexOf(mid), prev = G.order[i - 1], next = G.order[i + 1];
    root.appendChild(h('div', { class: 'row spread' },
      prev ? h('a', { class: 'btn', href: '#/notes/' + prev }, '← ' + prev) : h('span'),
      next ? h('a', { class: 'btn', href: '#/notes/' + next }, next + ' →') : h('span')));
  };
})();
