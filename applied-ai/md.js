/* ตัวแปลง markdown ย่อสำหรับโจทย์และเฉลย (โค้ดบล็อก · `inline` · **ตัวหนา** · ตาราง · รายการ · ย่อหน้า)
 * ความปลอดภัย: ข้อความทุกส่วนถูก escape ก่อนแล้วค่อยครอบด้วยแท็กที่ตัวแปลงสร้างเอง
 * จึงใช้ผลลัพธ์กับ innerHTML ได้ (ทดสอบด้วย tools/test-applied-ai.mjs) */
(function (root) {
  'use strict';

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function bold(escaped) {
    return escaped.replace(/\*\*([^*\n]+?)\*\*/g, '<strong>$1</strong>');
  }

  // `code` ก่อน แล้วตัวหนาเฉพาะข้อความนอกโค้ด
  function inline(src) {
    var out = '', last = 0, m, re = /`([^`\n]+)`/g;
    while ((m = re.exec(src))) {
      out += bold(esc(src.slice(last, m.index))) + '<code>' + esc(m[1]) + '</code>';
      last = re.lastIndex;
    }
    return out + bold(esc(src.slice(last)));
  }

  var SEP_ROW = /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$/;
  var UL = /^\s*[-*]\s+(.*)$/;
  var OL = /^\s*\d+\.\s+(.*)$/;

  function cells(row) {
    // | ที่อยู่ในโค้ด `a | b` ไม่ใช่ตัวแบ่งช่อง
    var protectedRow = row.replace(/`[^`]*`/g, function (m) { return m.replace(/\|/g, '\u0001'); });
    protectedRow = protectedRow.trim().replace(/^\|/, '').replace(/\|$/, '');
    return protectedRow.split('|').map(function (c) { return c.replace(/\u0001/g, '|').trim(); });
  }

  function render(md) {
    var lines = String(md).replace(/\r\n?/g, '\n').split('\n');
    var html = [], i = 0;

    function isSpecial(idx) {
      var l = lines[idx];
      if (/^```/.test(l) || UL.test(l) || OL.test(l)) return true;
      return /^\s*\|/.test(l) && idx + 1 < lines.length && SEP_ROW.test(lines[idx + 1]);
    }

    while (i < lines.length) {
      var line = lines[i];
      if (!line.trim()) { i++; continue; }

      if (/^```/.test(line)) {
        var code = [];
        i++;
        while (i < lines.length && !/^```/.test(lines[i])) { code.push(lines[i]); i++; }
        i++; // ข้ามบรรทัดปิด (ถ้าไม่มีก็จบไฟล์)
        html.push('<pre><code>' + esc(code.join('\n')) + '</code></pre>');
        continue;
      }

      if (/^\s*\|/.test(line) && i + 1 < lines.length && SEP_ROW.test(lines[i + 1])) {
        var head = cells(line), rows = [];
        i += 2;
        while (i < lines.length && /^\s*\|/.test(lines[i])) { rows.push(cells(lines[i])); i++; }
        var t = '<div class="tbl-wrap"><table><thead><tr>' + head.map(function (c) { return '<th>' + inline(c) + '</th>'; }).join('') + '</tr></thead><tbody>';
        rows.forEach(function (r) {
          t += '<tr>' + r.map(function (c) { return '<td>' + inline(c) + '</td>'; }).join('') + '</tr>';
        });
        html.push(t + '</tbody></table></div>');
        continue;
      }

      if (UL.test(line) || OL.test(line)) {
        var ordered = OL.test(line) && !UL.test(line);
        var re = ordered ? OL : UL, items = [];
        while (i < lines.length && re.test(lines[i])) { items.push(lines[i].match(re)[1]); i++; }
        var tag = ordered ? 'ol' : 'ul';
        html.push('<' + tag + '>' + items.map(function (x) { return '<li>' + inline(x) + '</li>'; }).join('') + '</' + tag + '>');
        continue;
      }

      var para = [];
      while (i < lines.length && lines[i].trim() && !isSpecial(i)) { para.push(lines[i]); i++; }
      html.push('<p>' + para.map(function (l) { return inline(l.trim()); }).join('<br>') + '</p>');
    }
    return html.join('');
  }

  var api = { render: render, inline: inline, escape: esc };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.MiniMD = api;
})(typeof window !== 'undefined' ? window : globalThis);
