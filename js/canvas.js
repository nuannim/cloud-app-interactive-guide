(function () {
  'use strict';
  var G = window.GUIDE;
  var NS = 'http://www.w3.org/2000/svg';
  var NW = 132, NH = 44;

  function s(tag, attrs) {
    var e = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    for (var i = 2; i < arguments.length; i++) if (arguments[i]) e.appendChild(arguments[i]);
    return e;
  }

  var uid = 0;
  function arrowDefs(id) {
    return s('defs', {}, s('marker', { id: id, viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 8, markerHeight: 8, orient: 'auto-start-reverse' },
      s('path', { d: 'M0 0L10 5L0 10z', class: 'cv-arrow' })));
  }

  // point on the border of node rect c in the direction of point o
  function borderPoint(c, o) {
    var dx = o.x - c.x, dy = o.y - c.y;
    if (!dx && !dy) return { x: c.x, y: c.y };
    var t = Math.min((NW / 2) / (Math.abs(dx) || 1e-9), (NH / 2) / (Math.abs(dy) || 1e-9));
    return { x: c.x + dx * t, y: c.y + dy * t };
  }

  function nodeEl(n, cls) {
    var label = n.label.length > 22 ? n.label.slice(0, 21) + '…' : n.label;
    return s('g', { class: 'cv-node' + (cls ? ' ' + cls : ''), 'data-id': n.id, transform: 'translate(' + (n.x - NW / 2) + ',' + (n.y - NH / 2) + ')' },
      s('rect', { width: NW, height: NH, rx: 8 }),
      Object.assign(s('text', { x: NW / 2, y: NH / 2 }), { textContent: label }));
  }

  function edgeEls(a, b, label, marker, selected) {
    var p1 = borderPoint(a, b), p2 = borderPoint(b, a);
    var d = 'M' + p1.x + ',' + p1.y + 'L' + p2.x + ',' + p2.y;
    var els = [s('path', { d: d, class: 'cv-edge' + (selected ? ' sel' : ''), 'marker-end': 'url(#' + marker + ')' })];
    if (label) {
      els.push(Object.assign(s('text', { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 - 6, class: 'cv-label' }), { textContent: label }));
    }
    return { els: els, d: d };
  }

  /* Static, auto-laid-out rendering of a reference flow ({nodes, edges}). */
  G.renderFlow = function (flow) {
    var nodes = flow.nodes, edges = flow.edges || [];
    var layer = {};
    nodes.forEach(function (n) { layer[n.id] = 0; });
    for (var pass = 0; pass < nodes.length; pass++) {
      var changed = false;
      edges.forEach(function (e) {
        if (layer[e.from] < nodes.length - 1 && layer[e.to] < layer[e.from] + 1) { layer[e.to] = layer[e.from] + 1; changed = true; }
      });
      if (!changed) break;
    }
    var cols = {};
    nodes.forEach(function (n) { (cols[layer[n.id]] = cols[layer[n.id]] || []).push(n); });
    var colKeys = Object.keys(cols).map(Number).sort(function (a, b) { return a - b; });
    var maxRows = Math.max.apply(null, colKeys.map(function (k) { return cols[k].length; }));
    var gapX = NW + 70, gapY = NH + 40;
    var W = Math.max(600, colKeys.length * gapX + 20), H = maxRows * gapY + 20;
    var pos = {};
    colKeys.forEach(function (k, ci) {
      var list = cols[k];
      list.forEach(function (n, ri) {
        pos[n.id] = { id: n.id, label: n.label, x: 10 + NW / 2 + ci * gapX, y: (H - list.length * gapY) / 2 + gapY / 2 + ri * gapY };
      });
    });
    var marker = 'ar' + (++uid);
    var svg = s('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': 'แผนภาพเฉลย' }, arrowDefs(marker));
    svg.style.minWidth = W + 'px'; // จอแคบ: เลื่อนแนวนอนแทนการย่อจนอ่านไม่ออก
    edges.forEach(function (e) {
      if (!pos[e.from] || !pos[e.to]) return;
      edgeEls(pos[e.from], pos[e.to], e.label, marker).els.forEach(function (el) { svg.appendChild(el); });
    });
    nodes.forEach(function (n) { svg.appendChild(nodeEl(pos[n.id])); });
    return G.h('div', { class: 'canvas-wrap flow-wrap' }, svg);
  };

  G.flowToText = function (flow) {
    var byId = {};
    flow.nodes.forEach(function (n) { byId[n.id] = n.label; });
    return (flow.edges || []).map(function (e, i) {
      return (i + 1) + '. ' + byId[e.from] + ' → ' + byId[e.to] + (e.label ? ' (' + e.label + ')' : '');
    }).join('\n');
  };

  /* Interactive drawing canvas. opts.palette: array of service labels. */
  G.createCanvas = function (opts) {
    var h = G.h;
    // จอแคบ: ใช้ viewBox เล็กลงเพื่อให้ตัวอักษรในกล่องอ่านออก และวางกล่องใหม่เป็น 2 คอลัมน์
    var narrow = window.innerWidth < 600;
    var W = narrow ? 420 : 800, H = narrow ? 560 : 460;
    var st = { nodes: [], edges: [], tool: 'move', sel: null, from: null, nid: 1, eid: 1 };
    var marker = 'ar' + (++uid);
    var svg = s('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'application', 'aria-label': 'พื้นที่วาดแผนภาพ' });
    var hint = h('p', { class: 'cv-hint' });
    var labelRow = h('div', { class: 'row', style: 'margin-top:8px;display:none' });
    var labelInput = h('input', { type: 'text', placeholder: 'ข้อความบนเส้น เช่น 1 หรือ invoke', 'aria-label': 'ข้อความบนเส้น' });
    labelRow.appendChild(labelInput);
    var drag = null;

    function nodeById(id) { for (var i = 0; i < st.nodes.length; i++) if (st.nodes[i].id === id) return st.nodes[i]; return null; }

    function updateHint() {
      hint.textContent = st.tool === 'connect'
        ? (st.from ? 'แตะ service ปลายทางเพื่อต่อเส้น' : 'แตะ service ต้นทาง แล้วแตะปลายทาง')
        : 'ลากเพื่อย้าย แตะเพื่อเลือก (เลือกแล้วกด "ลบที่เลือก" ได้)';
      var e = st.sel && st.sel.type === 'edge' ? st.edges.filter(function (x) { return x.id === st.sel.id; })[0] : null;
      labelRow.style.display = e ? 'flex' : 'none';
      if (e && document.activeElement !== labelInput) labelInput.value = e.label || '';
    }

    function render() {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      svg.appendChild(arrowDefs(marker));
      st.edges.forEach(function (e) {
        var a = nodeById(e.from), b = nodeById(e.to);
        if (!a || !b) return;
        var sel = st.sel && st.sel.type === 'edge' && st.sel.id === e.id;
        var r = edgeEls(a, b, e.label, marker, sel);
        r.els.forEach(function (el) { svg.appendChild(el); });
        var hit = s('path', { d: r.d, class: 'cv-hit', 'data-eid': e.id });
        svg.appendChild(hit);
      });
      st.nodes.forEach(function (n) {
        var cls = '';
        if (st.sel && st.sel.type === 'node' && st.sel.id === n.id) cls = 'sel';
        if (st.from === n.id) cls = 'from';
        svg.appendChild(nodeEl(n, cls));
      });
      updateHint();
    }

    function toSvg(ev) {
      var pt = svg.createSVGPoint();
      pt.x = ev.clientX; pt.y = ev.clientY;
      var p = pt.matrixTransform(svg.getScreenCTM().inverse());
      return { x: p.x, y: p.y };
    }

    function tapNode(id) {
      if (st.tool === 'connect') {
        if (!st.from) st.from = id;
        else if (st.from !== id) {
          var dup = st.edges.some(function (e) { return e.from === st.from && e.to === id; });
          if (!dup) { var e = { id: st.eid++, from: st.from, to: id, label: '' }; st.edges.push(e); st.sel = { type: 'edge', id: e.id }; }
          st.from = null;
        } else st.from = null;
      } else st.sel = { type: 'node', id: id };
      render();
    }

    svg.addEventListener('pointerdown', function (ev) {
      var hitEl = ev.target.closest ? ev.target.closest('.cv-node, .cv-hit') : null;
      if (!hitEl) { st.sel = null; st.from = null; render(); return; }
      if (hitEl.classList.contains('cv-hit')) {
        st.sel = { type: 'edge', id: Number(hitEl.getAttribute('data-eid')) };
        st.from = null; render(); labelInput.focus(); return;
      }
      var n = nodeById(Number(hitEl.getAttribute('data-id')));
      var p = toSvg(ev);
      drag = { id: n.id, dx: p.x - n.x, dy: p.y - n.y, sx: ev.clientX, sy: ev.clientY, moved: false };
      try { svg.setPointerCapture(ev.pointerId); } catch (e) { /* ignore */ }
    });
    svg.addEventListener('pointermove', function (ev) {
      if (!drag) return;
      if (!drag.moved && Math.abs(ev.clientX - drag.sx) + Math.abs(ev.clientY - drag.sy) < 6) return;
      drag.moved = true;
      var n = nodeById(drag.id), p = toSvg(ev);
      n.x = Math.max(NW / 2, Math.min(W - NW / 2, p.x - drag.dx));
      n.y = Math.max(NH / 2, Math.min(H - NH / 2, p.y - drag.dy));
      render();
    });
    function endDrag() {
      if (!drag) return;
      var d = drag; drag = null;
      if (!d.moved) tapNode(d.id);
    }
    svg.addEventListener('pointerup', endDrag);
    svg.addEventListener('pointercancel', function () { drag = null; });

    labelInput.addEventListener('input', function () {
      if (!st.sel || st.sel.type !== 'edge') return;
      st.edges.forEach(function (e) { if (e.id === st.sel.id) e.label = labelInput.value; });
      render();
    });

    function addNode(label) {
      label = String(label || '').trim();
      if (!label) return;
      var i = st.nodes.length;
      var cols = narrow ? 2 : 5, stepX = narrow ? 200 : 155, x0 = narrow ? 100 : 90, stepY = narrow ? 80 : 90;
      st.nodes.push({ id: st.nid++, label: label, x: x0 + (i % cols) * stepX, y: 50 + Math.floor(i / cols) * stepY });
      render();
    }

    function setTool(t) {
      st.tool = t; st.from = null;
      btnMove.classList.toggle('on', t === 'move');
      btnConnect.classList.toggle('on', t === 'connect');
      render();
    }

    var btnMove = h('button', { class: 'chip on', type: 'button', onclick: function () { setTool('move'); } }, 'ย้าย / เลือก');
    var btnConnect = h('button', { class: 'chip', type: 'button', onclick: function () { setTool('connect'); } }, 'ต่อเส้น');
    var btnDel = h('button', {
      class: 'chip', type: 'button', onclick: function () {
        if (!st.sel) return;
        if (st.sel.type === 'node') {
          st.nodes = st.nodes.filter(function (n) { return n.id !== st.sel.id; });
          st.edges = st.edges.filter(function (e) { return e.from !== st.sel.id && e.to !== st.sel.id; });
        } else st.edges = st.edges.filter(function (e) { return e.id !== st.sel.id; });
        st.sel = null; render();
      }
    }, 'ลบที่เลือก');
    var btnClear = h('button', {
      class: 'chip', type: 'button', onclick: function () {
        if (st.nodes.length && !confirm('ล้างแผนภาพทั้งหมด?')) return;
        st.nodes = []; st.edges = []; st.sel = null; st.from = null; render();
      }
    }, 'ล้างทั้งหมด');

    var palette = h('div', { class: 'palette' });
    (opts.palette || []).forEach(function (label) {
      palette.appendChild(h('button', { class: 'chip', type: 'button', onclick: function () { addNode(label); } }, '+ ' + label));
    });
    var custom = h('input', { type: 'text', placeholder: 'เพิ่ม service เอง', 'aria-label': 'ชื่อ service ที่จะเพิ่มเอง' });
    custom.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { addNode(custom.value); custom.value = ''; } });
    var customRow = h('div', { class: 'row' }, h('div', { style: 'flex:1;min-width:160px' }, custom),
      h('button', { class: 'btn small', type: 'button', onclick: function () { addNode(custom.value); custom.value = ''; } }, 'เพิ่ม'));

    var root = h('div', { class: 'canvas-wrap' },
      h('div', { class: 'row' }, btnMove, btnConnect, btnDel, btnClear),
      palette, customRow,
      h('div', { style: 'margin-top:10px' }, svg),
      hint, labelRow);
    render();

    return {
      el: root,
      isEmpty: function () { return st.nodes.length === 0; },
      toText: function () {
        if (!st.nodes.length) return '(ไม่ได้วาดแผนภาพ)';
        var byId = {};
        st.nodes.forEach(function (n) { byId[n.id] = n.label; });
        var lines = ['Service ที่วาด: ' + st.nodes.map(function (n) { return n.label; }).join(', ')];
        st.edges.forEach(function (e, i) { lines.push((i + 1) + '. ' + byId[e.from] + ' → ' + byId[e.to] + (e.label ? ' (' + e.label + ')' : '')); });
        return lines.join('\n');
      }
    };
  };
})();
