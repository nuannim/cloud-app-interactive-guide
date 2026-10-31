/* Mindmap ของแต่ละโมดูล สร้างอัตโนมัติจากข้อมูลที่ตรวจแล้ว: หัวข้อสรุป -> คำสำคัญ (ตัวหนา), ลิมิต, ตัวเลือกของกลุ่ม */
(function () {
  'use strict';
  var G = window.GUIDE, h = G.h;
  var NS = 'http://www.w3.org/2000/svg';
  // สีสาขา (เข้มพอให้ตัวอักษรขาวอ่านออก)
  var COLORS = ['#C25E00', '#5E7F0F', '#6B3FD6', '#A61DB0', '#C4106A', '#C42B3E', '#2F3BAE', '#0B6B73'];
  var FONT = "'Google Sans','Noto Sans Thai Looped','Sarabun','Segoe UI',system-ui,sans-serif";
  var MAX_LEAVES = 7;

  function clip(s, n) { s = String(s).replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1) + '…' : s; }
  function plainText(html) { return String(html).replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim(); }

  function boldTerms(body, heading, tag) {
    var out = [], seen = {}, re = new RegExp('<' + (tag || 'strong') + '>([\\s\\S]*?)<\\/' + (tag || 'strong') + '>', 'g'), m;
    while ((m = re.exec(body))) {
      var t = plainText(m[1]).replace(/[:：]\s*$/, '');
      var key = t.toLowerCase();
      if (t.length < 2 || t.length > 44 || seen[key] || key === heading.toLowerCase()) continue;
      if (/^[\d.,–\-+ ]+[A-Za-zก-๙%]{0,8}$/.test(t)) continue; // ตัวเลขลอย ๆ ไม่มีบริบท (ลิมิตมีใบของตัวเอง)
      seen[key] = 1; out.push(t);
    }
    return out;
  }

  // สร้างต้นไม้ของโมดูล: {title, branches:[{label, color, leaves:[{text, full}]}]}
  function buildTree(mid) {
    var m = G.modules[mid];
    var branches = (m.notes || []).map(function (n, i) {
      var leaves = boldTerms(n.body, n.heading).slice(0, 5).map(function (t) { return { text: clip(t, 40), full: t }; });
      var refs = n.refs || [];
      // ลิมิตที่เกี่ยวข้อง
      refs.forEach(function (id) {
        var e = G.index[id];
        if (!e || e.kind !== 'limit' || leaves.length >= MAX_LEAVES) return;
        var short = String(e.item.display).split(' (')[0];
        leaves.push({ text: clip(e.item.name + ': ' + short, 54), full: e.item.name + ': ' + e.item.display });
      });
      // หัวข้อที่ไม่มีคำตัวหนา: ใช้คำที่เป็น code หรือชื่อกล่องในแผนภาพของหัวข้อนั้น
      if (!leaves.length) boldTerms(n.body, n.heading, 'code').slice(0, 5).forEach(function (t) { leaves.push({ text: clip(t, 30), full: t }); });
      if (!leaves.length && n.diagram) n.diagram.flow.nodes.slice(0, 6).forEach(function (nd) { leaves.push({ text: clip(nd.label, 30), full: nd.label }); });
      // ถ้ายังไม่มี ใช้ตัวเลือกของกลุ่มที่อ้างถึง
      if (!leaves.length) {
        refs.forEach(function (id) {
          var e = G.index[id];
          var g = null;
          (m.optionGroups || []).forEach(function (og) { if (og.id === id) g = og; });
          if (g) g.options.forEach(function (o) { if (leaves.length < 6) leaves.push({ text: clip(o.name, 30), full: o.name }); });
          else if (e && e.kind === 'limit' && leaves.length < MAX_LEAVES) leaves.push({ text: clip(e.item.name, 30), full: e.item.name });
        });
      }
      // ใบน้อยเกินไป: เสริมด้วยท่อนแรก ๆ ของเนื้อหาเพื่อให้มีบริบท
      if (leaves.length < 2) {
        plainText(n.body).split(/[.;:—]|\s\(|\n/).map(function (c) { return c.trim(); }).filter(function (c) { return c.length >= 8; })
          .slice(0, 3 - leaves.length).forEach(function (c) { leaves.push({ text: clip(c, 44), full: c }); });
      }
      return { label: clip(n.heading.replace(/\s*\([^)]*\)\s*/g, ' ').trim(), 46), full: n.heading, color: COLORS[i % COLORS.length], leaves: leaves.slice(0, MAX_LEAVES), index: i };
    });
    return { title: mid + ' ' + m.title, branches: branches };
  }

  function el(tag, attrs, text) {
    var e = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    if (text != null) e.textContent = text;
    return e;
  }

  function curve(x1, y1, x2, y2, color) {
    var dx = Math.max(24, (x2 - x1) / 2);
    return el('path', { d: 'M' + x1 + ',' + y1 + 'C' + (x1 + dx) + ',' + y1 + ' ' + (x2 - dx) + ',' + y2 + ' ' + x2 + ',' + y2, fill: 'none', stroke: color, 'stroke-width': 2.2, 'stroke-linecap': 'round' });
  }

  // ตัดข้อความเป็นไม่เกิน 2 บรรทัดตามช่องว่าง (ไทยที่ไม่มีช่องว่างจะถูกตัดตามความยาว)
  function wrap(label, maxC) {
    if (label.length <= maxC) return [label];
    var lines = [''];
    label.split(' ').forEach(function (w) {
      var cur = lines[lines.length - 1], joined = (cur + ' ' + w).trim();
      if (joined.length <= maxC) lines[lines.length - 1] = joined;
      else if (lines.length < 2) lines.push(w);
      else lines[1] = (lines[1] + ' ' + w).trim();
    });
    return lines.map(function (l) { return l.length > maxC + 2 ? l.slice(0, maxC + 1) + '…' : l; });
  }

  function box(x, y, w, hgt, fill, stroke, label, tcolor, weight, size, full) {
    var g = el('g', {}), lines = wrap(label, Math.floor((w - 16) / (size * 0.6)));
    g.appendChild(el('title', {}, full || label));
    g.appendChild(el('rect', { x: x, y: y, width: w, height: hgt, rx: 9, fill: fill, stroke: stroke || 'none', 'stroke-width': stroke ? 1.6 : 0 }));
    var lh = size * 1.25, t = el('text', { x: x + w / 2, y: y + hgt / 2 - (lines.length - 1) * lh / 2, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: tcolor, 'font-family': FONT, 'font-size': size, 'font-weight': weight });
    lines.forEach(function (ln, k) {
      var s = el('tspan', { x: x + w / 2, dy: k ? lh : 0 });
      s.textContent = ln;
      t.appendChild(s);
    });
    g.appendChild(t);
    return g;
  }

  // วาดเป็น SVG (ใช้ attribute ล้วน ไม่พึ่ง CSS เพื่อให้ส่งออกเป็นรูปได้)
  function renderSvg(tree) {
    var ROOT_W = 190, ROOT_H = 76, BR_W = 184, BR_H = 50, LEAF_W = 214, LEAF_H = 30, GAP_X1 = 54, GAP_X2 = 40, PAD = 18, LEAF_GAP = 7, BLOCK_GAP = 22;
    // ใบที่ข้อความยาวเกินหนึ่งบรรทัดสูงขึ้นเป็น 44 (ใช้สูตรตัดบรรทัดเดียวกับ box())
    function leafH(lf) { return wrap(lf.text, Math.floor((LEAF_W - 16) / 7.5)).length > 1 ? 44 : LEAF_H; }
    function stackH(b) { return b.leaves.reduce(function (n, lf) { return n + leafH(lf); }, 0) + Math.max(0, b.leaves.length - 1) * LEAF_GAP; }
    var blocks = tree.branches.map(function (b) { return Math.max(BR_H, stackH(b)); });
    var totalH = blocks.reduce(function (n, v) { return n + v; }, 0) + BLOCK_GAP * (blocks.length - 1) + PAD * 2;
    var W = PAD + ROOT_W + GAP_X1 + BR_W + GAP_X2 + LEAF_W + PAD;
    var svg = el('svg', { xmlns: NS, viewBox: '0 0 ' + W + ' ' + totalH, width: W, height: totalH, role: 'img', 'aria-label': 'Mindmap ' + tree.title });
    svg.appendChild(el('rect', { x: 0, y: 0, width: W, height: totalH, fill: '#ffffff' }));
    var rootX = PAD, rootY = totalH / 2, brX = PAD + ROOT_W + GAP_X1, leafX = brX + BR_W + GAP_X2;
    var y = PAD, edges = el('g', {}), nodes = el('g', {});
    tree.branches.forEach(function (b, i) {
      var bh = blocks[i], cy = y + bh / 2;
      edges.appendChild(curve(rootX + ROOT_W, rootY, brX, cy, b.color));
      nodes.appendChild(box(brX, cy - BR_H / 2, BR_W, BR_H, b.color, null, b.label, '#ffffff', 700, 13.5, b.full));
      var ly = cy - stackH(b) / 2;
      b.leaves.forEach(function (lf) {
        var lhh = leafH(lf), lcy = ly + lhh / 2;
        edges.appendChild(curve(brX + BR_W, cy, leafX, lcy, b.color));
        nodes.appendChild(box(leafX, ly, LEAF_W, lhh, '#ffffff', b.color, lf.text, '#1f2937', 500, 12.5, lf.full));
        ly += lhh + LEAF_GAP;
      });
      y += bh + BLOCK_GAP;
    });
    svg.appendChild(edges);
    svg.appendChild(box(rootX, rootY - ROOT_H / 2, ROOT_W, ROOT_H, '#232F3E', null, clip(tree.title.replace(/\s*\([^)]*\)\s*/g, ' ').trim(), 40), '#ffffff', 700, 14, tree.title));
    svg.appendChild(nodes);
    return svg;
  }

  // บันทึกเป็นรูป PNG (เปิดดูในแกลเลอรีมือถือได้) ผ่าน canvas
  function savePng(svg, name, onDone) {
    var xml = new XMLSerializer().serializeToString(svg);
    var img = new Image(), scale = 2;
    img.onload = function () {
      var c = document.createElement('canvas');
      c.width = svg.viewBox.baseVal.width * scale; c.height = svg.viewBox.baseVal.height * scale;
      var ctx = c.getContext('2d');
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0, c.width, c.height);
      c.toBlob(function (blob) {
        if (!blob) { onDone(false); return; }
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob); a.download = name + '.png';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
        onDone(true);
      }, 'image/png');
    };
    img.onerror = function () { onDone(false); };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml);
  }

  function outline(tree) {
    var root = h('div', { class: 'mm-outline' });
    tree.branches.forEach(function (b) {
      var ul = h('ul', {}, b.leaves.map(function (lf) { return h('li', { title: lf.full }, lf.full); }));
      root.appendChild(h('details', { class: 'mm-branch', open: true },
        h('summary', {}, h('span', { class: 'mm-dot', style: 'background:' + b.color }), b.full), ul));
    });
    return root;
  }

  G.views.mindmap = function (root, parts) {
    var mid = parts[1];
    if (!mid || !G.modules[mid]) {
      root.appendChild(h('h1', {}, 'Mindmap'));
      root.appendChild(h('p', { class: 'muted' }, 'ภาพรวมของแต่ละโมดูลในหน้าเดียว สร้างจากหัวข้อสรุป คำสำคัญ และลิมิตที่ตรวจกับสไลด์แล้ว บันทึกเป็นรูปไว้เปิดในมือถือได้'));
      var list = h('div', { class: 'modlist' });
      G.order.forEach(function (m) {
        list.appendChild(h('a', { class: 'modrow', href: '#/mindmap/' + m },
          h('span', { class: 'modname' }, m + ' ' + G.modules[m].title), h('span', { class: 'small muted modsum' }, G.modules[m].summary)));
      });
      root.appendChild(list);
      return;
    }

    var tree = buildTree(mid);
    root.appendChild(h('p', { class: 'small' }, h('a', { href: '#/mindmap' }, '← ทุกโมดูล'), ' · ', h('a', { href: '#/notes/' + mid }, 'อ่านสรุปเต็ม')));
    root.appendChild(h('h1', {}, 'Mindmap ' + tree.title));
    var svg = renderSvg(tree), msg = h('span', { class: 'small muted', role: 'status' });
    root.appendChild(h('div', { class: 'row', style: 'margin:8px 0 14px' },
      h('button', {
        class: 'btn primary', type: 'button', onclick: function () {
          msg.textContent = 'กำลังสร้างรูป...';
          savePng(svg, 'mindmap-' + mid, function (ok) { msg.textContent = ok ? 'บันทึกรูปแล้ว (ดูในโฟลเดอร์ดาวน์โหลดหรือแกลเลอรี)' : 'บันทึกรูปไม่สำเร็จ ลองใช้เบราว์เซอร์อื่น'; });
        }
      }, 'บันทึกเป็นรูป PNG'), msg));
    root.appendChild(h('div', { class: 'mm-svg-wrap' }, svg));
    root.appendChild(outline(tree));

    var i = G.order.indexOf(mid), prev = G.order[i - 1], next = G.order[i + 1];
    root.appendChild(h('div', { class: 'row spread', style: 'margin-top:20px' },
      prev ? h('a', { class: 'btn', href: '#/mindmap/' + prev }, '← ' + prev) : h('span'),
      next ? h('a', { class: 'btn', href: '#/mindmap/' + next }, next + ' →') : h('span')));
  };
})();
