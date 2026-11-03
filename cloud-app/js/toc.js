/* สารบัญลอยชิดขอบขวาแบบ Notion ใช้ซ้ำได้: G.mountToc([{ id, title }]) — id = id ขององค์ประกอบในหน้า
   ปกติเป็นขีดสั้น ๆ ชี้เมาส์แล้วกางเป็นรายการ จอแคบใช้ปุ่มมุมขวาล่าง · ตรรกะเดียวกับส่วนสารบัญของ js/notes.js
   ใช้คลาส .toc-* ใน css/style.css · ล้างเองเมื่อเปลี่ยนหน้าผ่าน G.cleanups */
(function () {
  'use strict';
  var G = window.GUIDE, h = G.h;

  G.mountToc = function (items) {
    if (!items || items.length < 2) return;
    var rail, panel, links = {}, forced = null, cur = null;

    var list = h('ul', { class: 'toc-list' });
    items.forEach(function (t) {
      var a = h('a', { href: '#', title: t.title, onclick: function (ev) {
        ev.preventDefault();
        var el = document.getElementById(t.id);
        if (el) el.scrollIntoView({ block: 'start' });
        forced = t.id; // หัวข้อท้ายหน้าที่สั้นจนเลื่อนไม่ถึงขอบบน ยังต้องเน้นตามที่กด จนกว่าผู้ใช้จะเลื่อนเอง
        paint(t.id);
        rail.classList.remove('open');
      } }, h('span', { class: 'toc-tick', 'aria-hidden': 'true' }), h('span', { class: 'toc-title' }, t.title));
      links[t.id] = a;
      list.appendChild(h('li', {}, a));
    });
    var openBtn = h('button', {
      class: 'toc-open', type: 'button', 'aria-label': 'สารบัญ', 'aria-expanded': 'false',
      onclick: function () {
        var on = rail.classList.toggle('open');
        openBtn.setAttribute('aria-expanded', on ? 'true' : 'false');
      }
    }, 'สารบัญ');
    panel = h('div', { class: 'toc-panel' }, list);
    rail = h('nav', { class: 'toc-rail', 'aria-label': 'หัวข้อในหน้านี้' }, openBtn, panel);
    document.body.appendChild(rail);

    // เน้นหัวข้อที่กำลังอ่าน = หัวข้อสุดท้ายที่ขอบบนผ่านเส้นอ้างอิงใต้ topbar แล้ว (เลื่อนสุดหน้า = หัวข้อสุดท้าย)
    function paint(id) {
      if (id === cur) return;
      cur = id;
      Object.keys(links).forEach(function (k) { links[k].classList.toggle('active', k === id); });
      var a = links[id]; // เลื่อนรายการในแผงให้หัวข้อที่เน้นอยู่ในมุมมอง (แผงเลื่อนได้เมื่อรายการยาว)
      if (a && panel.scrollHeight > panel.clientHeight) {
        if (a.offsetTop < panel.scrollTop) panel.scrollTop = a.offsetTop;
        else if (a.offsetTop + a.offsetHeight > panel.scrollTop + panel.clientHeight) panel.scrollTop = a.offsetTop + a.offsetHeight - panel.clientHeight;
      }
    }
    function compute() {
      var now = items[0].id;
      items.forEach(function (t) { var el = document.getElementById(t.id); if (el && el.getBoundingClientRect().top <= 120) now = t.id; });
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) now = items[items.length - 1].id;
      paint(forced || now);
    }

    var onDocClick = function (ev) { if (!rail.contains(ev.target)) rail.classList.remove('open'); };
    var onScroll = function () { compute(); }; // งานเบา (วัดตำแหน่งไม่กี่หัวข้อ) คำนวณตรงเลย ไม่ต้องรอ requestAnimationFrame
    var onUserScroll = function () { if (forced) { forced = null; compute(); } };
    var userEvents = ['wheel', 'touchmove', 'keydown', 'pointerdown'];
    document.addEventListener('click', onDocClick);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    userEvents.forEach(function (ev) { window.addEventListener(ev, onUserScroll, { passive: true }); });
    G.cleanups.push(function () {
      document.removeEventListener('click', onDocClick);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      userEvents.forEach(function (ev) { window.removeEventListener(ev, onUserScroll); });
      rail.remove();
    });
    setTimeout(compute, 0);
  };
})();
