(function () {
  'use strict';
  var G = window.GUIDE;
  var NS = 'http://www.w3.org/2000/svg';
  var NW = 116, NH = 84, TILE = 46, DEF = { NW: 116, NH: 84, TILE: 46 }; // กล่อง = ไอคอนสี (TILE) + ชื่อใต้ไอคอน แบบ architecture diagram ของ AWS

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
    return s('defs', {}, s('marker', { id: id, viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 6, markerHeight: 6, orient: 'auto-start-reverse' },
      s('path', { d: 'M0 0L10 5L0 10z', class: 'cv-arrow' })));
  }

  // จุดต่อเส้นบนขอบของกล่อง n ในทิศทางไปหา o: แนวนอนต่อที่ข้างไอคอน แนวตั้งต่อที่หัวไอคอน/ท้ายชื่อ
  function anchor(n, o) {
    var dx = o.x - n.x, dy = o.y - n.y, tileTop = n.y - NH / 2 + 4;
    if (Math.abs(dx) > Math.abs(dy) * 1.2) return { x: n.x + (dx > 0 ? 1 : -1) * (TILE / 2 + 4), y: tileTop + TILE / 2 };
    if (dy > 0) return { x: n.x, y: n.y + NH / 2 + 2 };
    return { x: n.x, y: tileTop - 3 };
  }

  function nodeEl(n, cls, dm) {
    var NW = dm ? dm.NW : DEF.NW, NH = dm ? dm.NH : DEF.NH, TILE = dm ? dm.TILE : DEF.TILE, big = !!dm;
    var st = G.awsStyle(n.label), tx = (NW - TILE) / 2, sc = TILE / 46;
    var label = n.label.length > 32 ? n.label.slice(0, 31) + '…' : n.label;
    // ชื่อยาวตัดเป็น 2 บรรทัดที่ช่องว่างใกล้กลาง และลดขนาดตัวอักษรถ้ายังยาว
    var lines = [label], maxC = Math.floor(NW / (big ? 7.6 : 7.2));
    if (label.length > maxC) {
      var mid = label.length / 2, cut = -1;
      for (var i = 0; i < label.length; i++) if (label[i] === ' ' && (cut < 0 || Math.abs(i - mid) < Math.abs(cut - mid))) cut = i;
      if (cut > 0) lines = [label.slice(0, cut), label.slice(cut + 1)];
    }
    var longest = Math.max.apply(null, lines.map(function (l) { return l.length; }));
    var text = s('text', { x: NW / 2, y: TILE + (big ? 22 : 18) });
    if (longest > maxC) text.setAttribute('style', big ? 'font-size:12px' : 'font-size:10.5px');
    lines.forEach(function (ln, k) {
      var span = s('tspan', { x: NW / 2, dy: k ? (big ? 15 : 13) : 0 });
      span.textContent = ln;
      text.appendChild(span);
    });
    var glyph = s('g', { transform: 'translate(' + (tx + (TILE - 24 * sc) / 2) + ',' + (4 + (TILE - 24 * sc) / 2) + ') scale(' + sc + ')', fill: 'none', stroke: '#fff', 'stroke-width': 1.9, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
    st.paths.forEach(function (d) { glyph.appendChild(s('path', { d: d })); });
    return s('g', { class: 'cv-node' + (big ? ' cv-big' : '') + (cls ? ' ' + cls : ''), 'data-id': n.id, transform: 'translate(' + (n.x - NW / 2) + ',' + (n.y - NH / 2) + ')' },
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

  /* ---- แผนภาพ flow แบบวาดอัตโนมัติ (static): เส้นมุมฉากโค้งมน + ป้ายแคปซูล + ไอคอนใหญ่ ----
     พื้นที่วาดโต้ตอบ (createCanvas) ใช้ขนาดและเส้นตรงแบบเดิม ไม่ผ่านโค้ดส่วนนี้ */
  function estW(str) { // ความกว้างโดยประมาณของข้อความ 12px (ไทยแคบกว่า latin)
    var w = 0;
    for (var i = 0; i < str.length; i++) { var c = str.charCodeAt(i); w += c === 32 ? 3.6 : (c >= 0x0E00 && c <= 0x0E7F) ? 5.6 : 6.7; }
    return w;
  }
  function roundedPath(pts, r) {
    var d = 'M' + pts[0][0] + ',' + pts[0][1];
    for (var i = 1; i < pts.length - 1; i++) {
      var p = pts[i - 1], c = pts[i], n = pts[i + 1];
      var l1 = Math.abs(c[0] - p[0]) + Math.abs(c[1] - p[1]), l2 = Math.abs(n[0] - c[0]) + Math.abs(n[1] - c[1]);
      var rr = Math.min(r, l1 / 2, l2 / 2);
      d += ' L' + (c[0] - Math.sign(c[0] - p[0]) * rr) + ',' + (c[1] - Math.sign(c[1] - p[1]) * rr) +
        ' Q' + c[0] + ',' + c[1] + ' ' + (c[0] + Math.sign(n[0] - c[0]) * rr) + ',' + (c[1] + Math.sign(n[1] - c[1]) * rr);
    }
    var last = pts[pts.length - 1];
    return d + ' L' + last[0] + ',' + last[1];
  }
  // เส้น + ป้ายแคปซูลกลางช่วงที่ยาวที่สุด (ป้ายขึ้นต้นด้วยเลขลำดับ → วงกลมเลขขั้น)
  function flowEdge(pts, label, marker, vertical, box) {
    var clean = [pts[0]];
    pts.slice(1).forEach(function (p) { var q = clean[clean.length - 1]; if (p[0] !== q[0] || p[1] !== q[1]) clean.push(p); });
    var g = s('g', {}, s('path', { d: roundedPath(clean, 8), class: 'cv-edge', 'marker-end': 'url(#' + marker + ')' }));
    if (label) {
      var m = /^(\d+)\s+(.+)$/.exec(label), num = m ? m[1] : null, txt = m ? m[2] : label;
      var tw = estW(txt), bw = num ? 22 : 0, pw = tw + 18 + bw;
      var inBox = function (i) { // แคปซูลที่กึ่งกลางช่วงเส้น i ไม่ล้นกรอบภาพ
        var mx = (clean[i][0] + clean[i + 1][0]) / 2, my = (clean[i][1] + clean[i + 1][1]) / 2;
        return mx - pw / 2 >= 2 && mx + pw / 2 <= box[0] - 2 && my - 11 >= 2 && my + 11 <= box[1] - 2;
      };
      var best = -1, bi = 0, bestAny = -1, ai = 0;
      for (var i = 0; i < clean.length - 1; i++) {
        var horiz = clean[i + 1][1] === clean[i][1];
        var len = Math.abs(clean[i + 1][0] - clean[i][0]) + Math.abs(clean[i + 1][1] - clean[i][1]);
        if (len >= bestAny) { bestAny = len; ai = i; }
        if (inBox(i) && len >= (horiz ? pw + 20 : 30) && len >= best) { best = len; bi = i; }
      }
      if (vertical) { // แนวตั้ง: วางป้ายบนช่วงเส้นตั้งสุดท้าย (เหนือกล่องปลายทาง ตำแหน่งไม่ซ้อนกัน) ถ้ายาวพอ
        for (var j = clean.length - 2; j >= 0; j--) {
          if (clean[j + 1][0] === clean[j][0] && Math.abs(clean[j + 1][1] - clean[j][1]) >= 26 && inBox(j)) { best = 1; bi = j; break; }
        }
      }
      if (best < 0) bi = ai;
      var cx = (clean[bi][0] + clean[bi + 1][0]) / 2, cy = (clean[bi][1] + clean[bi + 1][1]) / 2, x0 = cx - pw / 2;
      g.appendChild(s('rect', { class: 'cv-pill', x: x0, y: cy - 11, width: pw, height: 22, rx: 11 }));
      if (num) {
        g.appendChild(s('circle', { class: 'cv-badge', cx: x0 + 14, cy: cy, r: 8 }));
        var nt = s('text', { class: 'cv-badge-n', x: x0 + 14, y: cy + 4 });
        nt.textContent = num;
        g.appendChild(nt);
      }
      var t = s('text', { class: 'cv-label cv-label-pill', x: x0 + bw + 9 + tw / 2, y: cy + 4 });
      t.textContent = txt;
      g.appendChild(t);
    }
    return g;
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
    // จอแคบ: วางแนวตั้ง (ขั้นตอนไหลจากบนลงล่าง) และเมื่อแนวนอนใส่กรอบไม่พอดี (ย่อแล้วเล็กกว่า 90%) ก็วางแนวตั้งเช่นกัน
    var hostEl = document.querySelector('.rm-main') || document.getElementById('app') || document.body;
    var avail = (hostEl.clientWidth || window.innerWidth) - 120; // ความกว้างหน้า ลบ padding หน้า การ์ด กรอบแผนภาพ และกล่องเฉลย
    var d = { NW: 112, NH: 102, TILE: 56 };
    var wideW = colKeys.length * (d.NW + 76) + 20;
    var vertical = opts && opts.vertical != null ? opts.vertical : (window.innerWidth < 600 || wideW * 0.85 > avail);
    if (vertical) { d.NW = maxRows >= 3 ? 92 : 116; d.TILE = maxRows >= 3 ? 48 : 56; d.NH = d.TILE + 44; }
    var hasSkip = edges.some(function (e) { return layer[e.to] - layer[e.from] > 1; });
    var M = hasSkip ? (vertical ? 20 : 30) : 0; // เว้นขอบให้เส้นที่ข้ามชั้นอ้อมผ่านโดยไม่ทับกล่อง
    var pos = {}, W, H;
    if (vertical) {
      var gx = d.NW + (maxRows >= 3 ? 8 : 14), gy = d.NH + 82;
      W = Math.max(maxRows * gx + 20, 280) + M * 2; H = colKeys.length * gy + 20;
      colKeys.forEach(function (k, li) {
        var list = cols[k];
        list.forEach(function (n, ri) {
          pos[n.id] = { id: n.id, label: n.label, x: M + (W - 2 * M - list.length * gx) / 2 + gx / 2 + ri * gx, y: 10 + d.NH / 2 + li * gy };
        });
      });
    } else {
      var gapX = d.NW + 76, gapY = d.NH + 26;
      W = Math.max(600, colKeys.length * gapX + 20); H = maxRows * gapY + 20 + M * 2;
      colKeys.forEach(function (k, ci) {
        var list = cols[k];
        list.forEach(function (n, ri) {
          pos[n.id] = { id: n.id, label: n.label, x: 10 + d.NW / 2 + ci * gapX, y: M + (H - 2 * M - list.length * gapY) / 2 + gapY / 2 + ri * gapY };
        });
      });
    }
    function tileTop(n) { return n.y - d.NH / 2 + 4; }
    function tileCy(n) { return tileTop(n) + d.TILE / 2; }

    // จุดออก/เข้าของเส้นที่ชนกล่องเดียวกันเหลื่อมกัน (เรียงตามตำแหน่งปลายทาง ไม่ให้ตัดกันเอง)
    var valid = [], outE = {}, inE = {}, portOut = {}, portIn = {}, chan = {};
    edges.forEach(function (e, i) {
      if (!pos[e.from] || !pos[e.to]) return;
      valid.push(i);
      (outE[e.from] = outE[e.from] || []).push(i);
      (inE[e.to] = inE[e.to] || []).push(i);
    });
    function cross(id) { return vertical ? pos[id].x : pos[id].y; }
    function spread(map, other, store) {
      Object.keys(map).forEach(function (id) {
        var list = map[id].slice().sort(function (a, b) { return cross(edges[a][other]) - cross(edges[b][other]); });
        var step = Math.min(12, (d.TILE - 16) / Math.max(list.length, 1));
        list.forEach(function (ei, k) { store[ei] = (k - (list.length - 1) / 2) * step; });
      });
    }
    spread(outE, 'to', portOut); spread(inE, 'from', portIn);
    function ends(ei) {
      var e = edges[ei], a = pos[e.from], b = pos[e.to];
      if (vertical) return { sx: a.x + portOut[ei], sy: a.y + d.NH / 2 + 2, ex: b.x + portIn[ei], ey: tileTop(b) - 3 };
      return { sx: a.x + d.TILE / 2 + 4, sy: tileCy(a) + portOut[ei], ex: b.x - d.TILE / 2 - 4, ey: tileCy(b) + portIn[ei] };
    }
    // ช่องวิ่งของเส้นที่ข้ามชั้นเดียว: เส้นแนวตั้ง/แนวนอนกลางทางไม่ซ้อนกัน
    var groups = {};
    valid.forEach(function (ei) { var e = edges[ei]; if (layer[e.to] - layer[e.from] === 1) (groups[layer[e.from]] = groups[layer[e.from]] || []).push(ei); });
    Object.keys(groups).forEach(function (k) {
      var list = groups[k], n = list.length;
      var start = function (ei) { var p = ends(ei); return vertical ? p.sx : p.sy; };
      var goesFwd = function (ei) { var p = ends(ei); return (vertical ? p.ex - p.sx : p.ey - p.sy) > 0; };
      var dn = list.filter(goesFwd).sort(function (a, b) { return start(a) - start(b); });
      var up = list.filter(function (ei) { return !goesFwd(ei); }).sort(function (a, b) { return start(b) - start(a); });
      dn.concat(up).forEach(function (ei, j) { chan[ei] = 0.3 + 0.4 * (n - j - 0.5) / n; });
    });
    var skipCount = 0;
    function route(ei) {
      var e = edges[ei], p = ends(ei), diff = layer[e.to] - layer[e.from];
      if (diff <= 1) {
        if (vertical) {
          if (Math.abs(p.sx - p.ex) < 1) return [[p.sx, p.sy], [p.ex, p.ey]];
          var my = p.sy + (p.ey - p.sy) * chan[ei];
          return [[p.sx, p.sy], [p.sx, my], [p.ex, my], [p.ex, p.ey]];
        }
        if (Math.abs(p.sy - p.ey) < 1) return [[p.sx, p.sy], [p.ex, p.ey]];
        var mx = p.sx + (p.ex - p.sx) * chan[ei];
        return [[p.sx, p.sy], [mx, p.sy], [mx, p.ey], [p.ex, p.ey]];
      }
      var k = skipCount++; // เส้นที่ข้ามหลายชั้น: อ้อมออกนอกกลุ่มกล่อง
      if (vertical) {
        var left = (p.sx + p.ex) / 2 < W / 2, cx = left ? 8 + k * 6 : W - 8 - k * 6;
        return [[p.sx, p.sy], [p.sx, p.sy + 12], [cx, p.sy + 12], [cx, p.ey - 12], [p.ex, p.ey - 12], [p.ex, p.ey]];
      }
      var above = (p.sy + p.ey) / 2 < H / 2, cy = above ? 10 + k * 8 : H - 10 - k * 8;
      return [[p.sx, p.sy], [p.sx + 16 + k * 6, p.sy], [p.sx + 16 + k * 6, cy], [p.ex - 16 - k * 6, cy], [p.ex - 16 - k * 6, p.ey], [p.ex, p.ey]];
    }

    var marker = 'ar' + (++uid);
    var svg = s('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': 'แผนภาพเฉลย' }, arrowDefs(marker));
    svg.style.minWidth = Math.round(W * 0.76) + 'px'; // กันย่อจนตัวอักษรเล็กเกิน (จอแคบเลื่อนข้างได้ในกรอบ)
    svg.style.maxWidth = Math.round(W * 1.3) + 'px'; // กันแผนภาพเล็กขยายใหญ่เกิน
    svg.style.marginInline = 'auto';
    valid.forEach(function (ei) { svg.appendChild(flowEdge(route(ei), edges[ei].label, marker, vertical, [W, H])); });
    nodes.forEach(function (n) { svg.appendChild(nodeEl(pos[n.id], null, d)); });
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
