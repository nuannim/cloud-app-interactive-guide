(function () {
  'use strict';
  var G = window.GUIDE;
  var NS = 'http://www.w3.org/2000/svg';
  var NW = 116, NH = 84, TILE = 46; // กล่อง = ไอคอนสี (TILE) + ชื่อใต้ไอคอน แบบ architecture diagram ของ AWS

  /* สีตามหมวดบริการ (โทนใกล้ผังของ AWS) เลือกจากคำใน label รูปทรงในไอคอนวาดเองทั้งหมด ไม่ใช้โลโก้จริง
     ลำดับสำคัญ: ตัวที่ตรงก่อนชนะ แก้/เพิ่มหมวดได้ที่ตารางนี้ที่เดียว */
  var CATS = [
    ['user', '#4B5563', /^(mobile app|user|browser|client|developer|customer|caller|viewer)/i, ['M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M4 21c0-4 3.6-6 8-6s8 2 8 6']],
    ['compute', '#ED7100', /lambda|ec2|fargate|ecs|eks|beanstalk|container|function|worker|instance|auto scaling|\bapp\b/i, ['M8 8h8v8H8z', 'M10 4v4M14 4v4M10 16v4M14 16v4M4 10h4M4 14h4M16 10h4M16 14h4']],
    ['security', '#DD344C', /cognito|iam|sts|role|policy|waf|kms|jwt|token|credential|certificate|acm|secret/i, ['M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z', 'M9.5 12l2 2 3.5-4']],
    ['integration', '#E7157B', /sqs|sns|queue|topic|step functions|state machine|eventbridge|kinesis|firehose|dlq|dead-letter|publisher|subscriber|ordering|event source|state\b/i, ['M5 8h12M14 5l3 3-3 3M19 16H7M10 13l-3 3 3 3']],
    ['database', '#C925D1', /dynamo|rds|aurora|database|\bdb\b|elasticache|redis|memcached|cache|table/i, ['M5 6c0-1.4 3.1-2.5 7-2.5S19 4.6 19 6s-3.1 2.5-7 2.5S5 7.4 5 6z', 'M5 6v12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V6', 'M5 12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5']],
    ['storage', '#7AA116', /\bs3\b|bucket|efs|ebs|ecr|repository|registry|glacier|amazon s3/i, ['M5 7c0-1.7 3.1-3 7-3s7 1.3 7 3-3.1 3-7 3-7-1.3-7-3z', 'M5 7l1.6 11c.2 1.2 2.7 2 5.4 2s5.2-.8 5.4-2L19 7']],
    ['network', '#8C4FFF', /api gateway|cloudfront|route ?53|elb|load balancer|edge|vpc|cname|cdn|endpoint|viewer request/i, ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z', 'M3 12h18', 'M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18']],
    ['devtools', '#3B48CC', /codepipeline|codebuild|codedeploy|codecommit|cloudformation|\bsam\b|pipeline|template|stack|dockerfile|docker|image|sdk|cli/i, ['M8 8l-4 4 4 4M16 8l4 4-4 4M13.5 6l-3 12']],
    ['mgmt', '#E7157B', /cloudwatch|cloudtrail|x-ray|logs?\b|monitor/i, ['M5 20V10M12 20V4M19 20v-7']]
  ];
  var GENERIC = ['generic', '#5A6B7B', null, ['M6 6h12v12H6z']];
  G.awsStyle = function (label) {
    for (var i = 0; i < CATS.length; i++) if (CATS[i][2].test(label)) return { key: CATS[i][0], color: CATS[i][1], paths: CATS[i][3] };
    return { key: GENERIC[0], color: GENERIC[1], paths: GENERIC[3] };
  };

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

  // จุดต่อเส้นบนขอบของกล่อง n ในทิศทางไปหา o: แนวนอนต่อที่ข้างไอคอน แนวตั้งต่อที่หัวไอคอน/ท้ายชื่อ
  function anchor(n, o) {
    var dx = o.x - n.x, dy = o.y - n.y, tileTop = n.y - NH / 2 + 4;
    if (Math.abs(dx) > Math.abs(dy) * 1.2) return { x: n.x + (dx > 0 ? 1 : -1) * (TILE / 2 + 4), y: tileTop + TILE / 2 };
    if (dy > 0) return { x: n.x, y: n.y + NH / 2 + 2 };
    return { x: n.x, y: tileTop - 3 };
  }

  function nodeEl(n, cls) {
    var st = G.awsStyle(n.label), tx = (NW - TILE) / 2;
    var label = n.label.length > 32 ? n.label.slice(0, 31) + '…' : n.label;
    // ชื่อยาวตัดเป็น 2 บรรทัดที่ช่องว่างใกล้กลาง และลดขนาดตัวอักษรถ้ายังยาว
    var lines = [label], maxC = Math.floor(NW / 7.2);
    if (label.length > maxC) {
      var mid = label.length / 2, cut = -1;
      for (var i = 0; i < label.length; i++) if (label[i] === ' ' && (cut < 0 || Math.abs(i - mid) < Math.abs(cut - mid))) cut = i;
      if (cut > 0) lines = [label.slice(0, cut), label.slice(cut + 1)];
    }
    var longest = Math.max.apply(null, lines.map(function (l) { return l.length; }));
    var text = s('text', { x: NW / 2, y: TILE + 18 });
    if (longest > maxC) text.setAttribute('style', 'font-size:10.5px');
    lines.forEach(function (ln, k) {
      var span = s('tspan', { x: NW / 2, dy: k ? 13 : 0 });
      span.textContent = ln;
      text.appendChild(span);
    });
    var glyph = s('g', { transform: 'translate(' + (tx + (TILE - 24) / 2) + ',' + (4 + (TILE - 24) / 2) + ')', fill: 'none', stroke: '#fff', 'stroke-width': 1.9, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
    st.paths.forEach(function (d) { glyph.appendChild(s('path', { d: d })); });
    return s('g', { class: 'cv-node' + (cls ? ' ' + cls : ''), 'data-id': n.id, transform: 'translate(' + (n.x - NW / 2) + ',' + (n.y - NH / 2) + ')' },
      s('rect', { class: 'cv-area', width: NW, height: NH, rx: 8 }),
      s('rect', { class: 'cv-tile', x: tx, y: 4, width: TILE, height: TILE, rx: 9, fill: st.color }),
      glyph, text);
  }

  function edgeEls(a, b, label, marker, selected) {
    var p1 = anchor(a, b), p2 = anchor(b, a);
    var d = 'M' + p1.x + ',' + p1.y + 'L' + p2.x + ',' + p2.y;
    var els = [s('path', { d: d, class: 'cv-edge' + (selected ? ' sel' : ''), 'marker-end': 'url(#' + marker + ')' })];
    if (label) {
      // ป้ายยาวตัดเป็น 2 บรรทัด (ตัดที่ช่องว่างใกล้กลางข้อความ) กันทับกล่อง
      var lines = [label], mid = label.length / 2, cut = -1;
      if (label.length > 12) {
        for (var i = 0; i < label.length; i++) if (label[i] === ' ' && (cut < 0 || Math.abs(i - mid) < Math.abs(cut - mid))) cut = i;
        if (cut > 0) lines = [label.slice(0, cut), label.slice(cut + 1)];
      }
      var t = s('text', { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 - 6 - (lines.length - 1) * 13, class: 'cv-label' });
      lines.forEach(function (ln, k) {
        var span = s('tspan', { x: (p1.x + p2.x) / 2, dy: k ? 13 : 0 });
        span.textContent = ln;
        t.appendChild(span);
      });
      els.push(t);
    }
    return { els: els, d: d };
  }

  /* Static, auto-laid-out rendering of a reference flow ({nodes, edges}). */
  G.renderFlow = function (flow, opts) {
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
    // จอแคบ: วางแนวตั้ง (ขั้นตอนไหลจากบนลงล่าง) เพื่อให้ตัวอักษรอ่านออกโดยไม่ต้องเลื่อนข้าง
    // และเมื่อแนวนอนใส่กรอบไม่พอดี (ย่อแล้วเล็กกว่า 80%) ก็วางแนวตั้งเช่นกัน
    var hostEl = document.querySelector('.rm-main') || document.getElementById('app') || document.body;
    // พื้นที่ใช้ได้จริง = ความกว้างหน้า ลบ padding ของหน้า การ์ด กรอบแผนภาพ และกล่องเฉลย (~120px)
    var avail = (hostEl.clientWidth || window.innerWidth) - 120;
    var wideW = colKeys.length * (NW + 80) + 20;
    var vertical = opts && opts.vertical != null ? opts.vertical : (window.innerWidth < 600 || wideW * 0.8 > avail);
    var W, H, pos = {}, prevNW = NW;
    if (vertical && maxRows >= 3) NW = 104; // ชั้นละ 3 กล่อง: ใช้กล่องแคบลงให้ย่อน้อยกว่า
    if (vertical) {
      var gx = NW + (NW < 116 ? 12 : 22), gy = NH + 40;
      W = Math.max(maxRows * gx + 20, 300); H = colKeys.length * gy + 20;
      colKeys.forEach(function (k, li) {
        var list = cols[k];
        list.forEach(function (n, ri) {
          pos[n.id] = { id: n.id, label: n.label, x: (W - list.length * gx) / 2 + gx / 2 + ri * gx, y: 10 + NH / 2 + li * gy };
        });
      });
    } else {
      var gapX = NW + 80, gapY = NH + 24;
      W = Math.max(600, colKeys.length * gapX + 20); H = maxRows * gapY + 20;
      colKeys.forEach(function (k, ci) {
        var list = cols[k];
        list.forEach(function (n, ri) {
          pos[n.id] = { id: n.id, label: n.label, x: 10 + NW / 2 + ci * gapX, y: (H - list.length * gapY) / 2 + gapY / 2 + ri * gapY };
        });
      });
    }
    var marker = 'ar' + (++uid);
    var svg = s('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': 'แผนภาพเฉลย' }, arrowDefs(marker));
    svg.style.minWidth = Math.round(Math.min(W, vertical ? 240 : W * 0.8)) + 'px'; // กันย่อจนอ่านไม่ออก
    svg.style.maxWidth = Math.round(W * 1.3) + 'px'; // กันแผนภาพเล็กขยายใหญ่เกิน
    svg.style.marginInline = 'auto';
    edges.forEach(function (e) {
      if (!pos[e.from] || !pos[e.to]) return;
      edgeEls(pos[e.from], pos[e.to], e.label, marker).els.forEach(function (el) { svg.appendChild(el); });
    });
    nodes.forEach(function (n) { svg.appendChild(nodeEl(pos[n.id])); });
    var wrap = G.h('div', { class: 'canvas-wrap flow-wrap' }, svg);
    NW = prevNW;
    return wrap;
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
      var cols = narrow ? 2 : 5, stepX = narrow ? 190 : 150, x0 = narrow ? 105 : 90, stepY = 100;
      st.nodes.push({ id: st.nid++, label: label, x: x0 + (i % cols) * stepX, y: NH / 2 + 8 + Math.floor(i / cols) * stepY });
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
      palette.appendChild(h('button', { class: 'chip', type: 'button', onclick: function () { addNode(label); } },
        h('span', { class: 'dot', style: 'background:' + G.awsStyle(label).color }), '+ ' + label));
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
