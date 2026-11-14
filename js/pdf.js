/* Karyu Densetsu — exportador da ficha em PDF.
 * Carregado sob demanda (junto com vendor/jspdf.umd.min.js) quando o usuário escolhe
 * "Exportar ficha (.pdf)". Recebe a ficha e os valores derivados já calculados pelo app.
 */
(() => {
  'use strict';

  // Cores do style guide (Fiery Soul / Steel Soul).
  const C = {
    ink: [18, 18, 18], text2: [79, 79, 79], muted: [136, 136, 136], line: [209, 209, 209],
    light: [231, 231, 231], paper: [255, 255, 255],
    red: [160, 52, 34], red5: [219, 97, 52], redBg: [243, 205, 181], redBg2: [253, 245, 239],
  };

  // As fontes padrão do PDF (Helvetica) usam WinAnsi: troca o que ela não desenha.
  const WIN = '€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ';
  const clean = (s) => String(s ?? '')
    .replace(/[−‐‑‒]/g, '-').replace(/[   ]/g, ' ')
    .replace(/[^\n\x20-\x7E¡-ÿ]/g, (ch) => (WIN.includes(ch) ? ch : '?'));

  function build(c, D, KD, opts) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
    const PW = 210, PH = 297, M = 14, FOOT = 12;
    const BOTTOM = PH - M - FOOT;
    const title = clean(c.nome) || 'Sem nome';
    doc.setProperties({ title: `${title} — Karyu Densetsu`, subject: 'Ficha de personagem', creator: 'Karyu Densetsu — Ficha' });

    // Cursor de escrita: x/largura da coluna atual; ao virar a página volta para largura total.
    const F = { x: M, w: PW - 2 * M, y: M };
    const fill = (rgb) => doc.setFillColor(...rgb);
    const stroke = (rgb) => doc.setDrawColor(...rgb);
    const color = (rgb) => doc.setTextColor(...rgb);
    const font = (style, size) => { doc.setFont('helvetica', style); doc.setFontSize(size); };
    const lh = (size) => size * 0.3528 * 1.25; // altura de linha em mm
    const newPage = () => { doc.addPage(); F.x = M; F.w = PW - 2 * M; F.y = M; };
    const need = (h) => { if (F.y + h > BOTTOM) newPage(); };

    // Parágrafo com quebra de linha e de página.
    function para(text, { size = 9, style = 'normal', rgb = C.ink, indent = 0, gap = 1.2 } = {}) {
      const t = clean(text).trim();
      if (!t) return;
      font(style, size); color(rgb);
      const lines = doc.splitTextToSize(t, F.w - indent);
      const h = lh(size);
      lines.forEach((ln) => {
        need(h);
        doc.text(ln, F.x + indent, F.y + h * 0.78);
        F.y += h;
      });
      F.y += gap;
    }
    // Altura que um parágrafo vai ocupar (para manter blocos inteiros na mesma página).
    function paraH(text, { size = 9, style = 'normal', indent = 0, gap = 1.2 } = {}) {
      const t = clean(text).trim();
      if (!t) return 0;
      font(style, size);
      return doc.splitTextToSize(t, F.w - indent).length * lh(size) + gap;
    }
    // Título de seção: caixa-alta em vermelho com linha embaixo.
    function heading(text, right) {
      need(12);
      F.y += 2;
      font('bold', 11); color(C.red);
      doc.text(clean(text).toUpperCase(), F.x, F.y + 4);
      if (right) { font('normal', 8.5); color(C.text2); doc.text(clean(right), F.x + F.w, F.y + 4, { align: 'right' }); }
      stroke(C.red5); doc.setLineWidth(0.5); doc.line(F.x, F.y + 6, F.x + F.w, F.y + 6);
      F.y += 9;
    }
    // Linha "rótulo .... valor" com caixinha do número.
    function statRow(label, sub, value) {
      const h = 7;
      need(h + 1);
      fill(C.redBg2); doc.rect(F.x, F.y, F.w, h, 'F');
      font('bold', 9.5); color(C.ink); doc.text(clean(label), F.x + 2, F.y + 4.8);
      if (sub) { const lw = doc.getTextWidth(clean(label)); font('normal', 8); color(C.text2); doc.text(clean(sub), F.x + 4 + lw, F.y + 4.8); }
      fill(C.ink); doc.rect(F.x + F.w - 9, F.y, 9, h, 'F');
      font('bold', 10.5); color(C.paper); doc.text(String(value), F.x + F.w - 4.5, F.y + 5, { align: 'center' });
      F.y += h + 1.2;
    }
    function checkbox(x, y, on, size = 3.6) {
      stroke(C.ink); doc.setLineWidth(0.35); doc.rect(x, y, size, size, on ? 'FD' : 'S');
      if (on) {
        fill(C.red); doc.rect(x, y, size, size, 'F');
        stroke(C.paper); doc.setLineWidth(0.6);
        doc.lines([[size * 0.25, size * 0.25], [size * 0.45, -size * 0.55]], x + size * 0.18, y + size * 0.5);
      }
    }
    // Item de lista com caixa de marcação.
    function checkItem(text, on, { dark = false } = {}) {
      const t = clean(text).trim() || '(sem nome)';
      font(dark ? 'bold' : 'normal', 9);
      const lines = doc.splitTextToSize(t, F.w - 10);
      const h = Math.max(6.5, lines.length * lh(9) + 2.6);
      need(h + 1);
      fill(dark ? C.ink : C.light); doc.rect(F.x, F.y, F.w, h, 'F');
      color(dark ? C.paper : C.ink);
      lines.forEach((ln, i) => doc.text(ln, F.x + 2, F.y + 4.4 + i * lh(9)));
      if (!dark) checkbox(F.x + F.w - 5.6, F.y + (h - 3.6) / 2, on);
      if (dark && on) { stroke(C.red5); doc.setLineWidth(0.6); doc.line(F.x + 2, F.y + h / 2, F.x + F.w - 2, F.y + h / 2); }
      F.y += h + 1.2;
    }

    // ---------- cabeçalho ----------
    const headH = 26;
    fill(C.ink); doc.rect(0, 0, PW, headH + M - 4, 'F');
    fill(C.red); doc.rect(0, headH + M - 4, PW, 1.2, 'F');
    font('bold', 8); color(C.red5);
    doc.text('KARYU DENSETSU  ·  FICHA DE PROTAGONISTA', M, M + 1);
    // Nome: diminui a fonte até caber; se ainda não couber, corta com reticências.
    const nameW = PW - 2 * M - 30;
    let ns = 22;
    font('bold', ns);
    while (ns > 13 && doc.getTextWidth(title) > nameW) font('bold', --ns);
    let shown = title;
    while (shown.length > 1 && doc.getTextWidth(shown) > nameW) shown = shown.slice(0, -2) + '…';
    color(C.paper); doc.text(shown, M, M + 11);
    if (c.conceito) { font('normal', 11); color(C.redBg); doc.text(doc.splitTextToSize(clean(c.conceito), PW - 2 * M - 30)[0], M, M + 18); }
    // Aura
    fill(C.red); doc.rect(PW - M - 22, M - 3, 22, 24, 'F');
    font('bold', 7.5); color(C.redBg); doc.text('AURA', PW - M - 11, M + 2.5, { align: 'center' });
    font('bold', 22); color(C.paper); doc.text(String(c.aura), PW - M - 11, M + 15, { align: 'center' });
    F.y = headH + M + 2;

    // ---------- faixa de números (Vigor, ferimentos, limiares) ----------
    const marked = c.estado.feri.filter(Boolean).length;
    const tiles = [
      ['VIGOR', `${c.estado.vigor}/${D.vigorMax}`],
      ['CANALIZAÇÃO', D.canal],
      ['DEFESA', D.defesa],
      ['PROTEÇÃO', D.protecao],
      ['SINC. POR CENA', D.sincCena],
    ];
    const gap = 3, tw = (PW - 2 * M - gap * (tiles.length - 1)) / tiles.length;
    tiles.forEach(([lab, val], i) => {
      const x = M + i * (tw + gap);
      fill(C.redBg2); stroke(C.red5); doc.setLineWidth(0.4); doc.rect(x, F.y, tw, 15, 'FD');
      font('bold', 7); color(C.red); doc.text(clean(lab), x + tw / 2, F.y + 4.5, { align: 'center' });
      font('bold', 15); color(C.ink); doc.text(String(val), x + tw / 2, F.y + 12, { align: 'center' });
    });
    F.y += 18;
    // Ferimentos
    font('bold', 9); color(C.red); doc.text('FERIMENTOS', M, F.y + 3.3);
    c.estado.feri.forEach((on, i) => checkbox(M + 26 + i * 6, F.y + 0.4, on, 4));
    const st = c.estado.derrotado ? 'Derrotado' : marked ? 'Ferido' : '';
    if (st) { font('bold', 9); color(C.red); doc.text(st.toUpperCase(), M + 26 + c.estado.feri.length * 6 + 2, F.y + 3.3); }
    font('normal', 8.5); color(C.text2);
    doc.text(clean(`Karma ${c.estado.karma}   ·   Ações extras ${D.acoes}`), PW - M, F.y + 3.3, { align: 'right' });
    F.y += 8;

    // ---------- duas colunas ----------
    const top = F.y, colGap = 6, colW = (PW - 2 * M - colGap) / 2;
    const page0 = doc.getNumberOfPages();

    // Coluna esquerda: atributos, estilo, ocupações.
    F.x = M; F.w = colW;
    heading('Atributos');
    ['FOR', 'RAZ', 'AGI', 'INS', 'VON', 'PRE'].forEach((id) => {
      statRow(id, KD.atributos.find((a) => a.id === id).nome, c.atributos[id]);
    });
    heading('Estilo de luta', c.estilo.nome);
    KD.estilo.forEach((s) => statRow(s.nome, '', c.estilo[s.id]));
    heading('Ocupações');
    const ocs = KD.ocupacoes.filter((o) => c.ocupacoes[o.id].n > 0);
    if (!ocs.length) para('Nenhuma ocupação.', { rgb: C.muted });
    ocs.forEach((o) => {
      const v = c.ocupacoes[o.id];
      statRow(o.nome, KD.niveisOcupacao[v.n], v.n);
      if (v.n >= 2 && v.esp) para(`Especializações: ${v.esp}`, { size: 8, rgb: C.text2, indent: 2, gap: 1 });
    });
    const leftEnd = { page: doc.getNumberOfPages(), y: F.y };

    // Coluna direita: trunfos, caminho, laços.
    doc.setPage(page0);
    F.x = M + colW + colGap; F.w = colW; F.y = top;
    heading('Trunfos');
    if (!c.trunfos.length) para('Nenhum trunfo.', { rgb: C.muted });
    c.trunfos.forEach((t) => {
      need(Math.min(paraH(t.nome || 'Trunfo', { size: 10, style: 'bold', gap: 0.4 }) + paraH(t.req ? `Requisito: ${t.req}` : '', { size: 8, gap: 0.6 }) + paraH(t.desc, { size: 8.5, gap: 2.4 }), BOTTOM - M));
      para(t.nome || 'Trunfo', { size: 10, style: 'bold', gap: 0.4 });
      if (t.req) para(`Requisito: ${t.req}`, { size: 8, rgb: C.text2, gap: 0.6 });
      para(t.desc, { size: 8.5, gap: 2.4 });
    });
    const cam = c.caminho;
    heading('Caminho', cam.nome);
    const evs = cam.eventos.filter((e) => e.t);
    if (!evs.length && !cam.rev) para('Sem caminho definido.', { rgb: C.muted });
    evs.forEach((e) => checkItem(e.t, e.m));
    if (cam.rev) checkItem(`Reviravolta: ${cam.rev}${cam.revM ? ' (aconteceu)' : ''}`, cam.revM, { dark: true });
    heading('Laços');
    if (!c.lacos.length) para('Nenhum laço.', { rgb: C.muted });
    c.lacos.forEach((l) => checkItem(l.t, l.m));
    const rightEnd = { page: doc.getNumberOfPages(), y: F.y };

    // Continua abaixo da coluna que terminou mais embaixo.
    const end = leftEnd.page > rightEnd.page ? leftEnd
      : rightEnd.page > leftEnd.page ? rightEnd
        : { page: leftEnd.page, y: Math.max(leftEnd.y, rightEnd.y) };
    doc.setPage(end.page);
    F.x = M; F.w = PW - 2 * M; F.y = end.y + 2;

    // ---------- técnicas ----------
    const n = c.tecnicas.length;
    heading('Técnicas', `${n} técnica${n === 1 ? '' : 's'}`);
    if (!n) para('Nenhuma técnica.', { rgb: C.muted });
    // Cada técnica vira uma lista de parágrafos; o bloco todo fica na mesma página quando cabe.
    const tecParts = (t) => {
      const P = [], lbl = (x) => P.push([x, { size: 8, style: 'bold', rgb: C.red, gap: 0.2 }]), body = (x) => P.push([x, { size: 9, gap: 1 }]);
      const tg = [...t.tipos, ...t.elementos];
      if (tg.length) P.push([tg.join('  ·  '), { size: 8, style: 'bold', rgb: C.red, gap: 0.8 }]);
      body(t.desc);
      if (t.sinc) { lbl('Sincronização'); body(t.sinc); }
      if (t.ougi) { lbl('Ougi'); body(t.ougiTxt || 'Técnica de sucessão do estilo.'); }
      t.upgrades.forEach((u) => {
        const def = KD.upgrades.find((x) => x.nome === u);
        lbl(`Upgrade / ${u}`);
        if (def) body(def.desc);
      });
      if (t.req) P.push([`Requisito: ${t.req}`, { size: 8, rgb: C.text2, gap: 1 }]);
      return P;
    };
    c.tecnicas.forEach((t) => {
      const cost = opts.tecCost(t);
      const costTxt = cost ?? (t.custo === '' ? '—' : t.custo);
      const parts = tecParts(t);
      const blockH = 9 + parts.reduce((a, [x, o]) => a + paraH(x, o), 0);
      need(Math.min(blockH, BOTTOM - M));
      // Faixa do nome
      fill(C.ink); doc.rect(F.x, F.y, F.w, 7.5, 'F');
      font('bold', 10.5); color(C.paper);
      const nm = clean(t.nome || 'Técnica');
      doc.text(nm, F.x + 2, F.y + 5.2);
      if (t.ougi) { const w = doc.getTextWidth(nm); font('bold', 8.5); color(C.red5); doc.text('(OUGI)', F.x + 4 + w, F.y + 5.2); }
      fill(C.red); doc.rect(F.x + F.w - 24, F.y, 24, 7.5, 'F');
      font('bold', 8.5); color(C.paper); doc.text(clean(`Nagen ${costTxt}`), F.x + F.w - 12, F.y + 5.1, { align: 'center' });
      F.y += 9;
      parts.forEach(([x, o]) => para(x, o));
      F.y += 2.5;
    });

    // ---------- notas ----------
    if (String(c.notas || '').trim()) {
      heading('Notas');
      String(c.notas).split(/\n/).forEach((ln) => (ln.trim() ? para(ln, { size: 9, gap: 0.6 }) : (F.y += 2)));
    }

    // ---------- rodapé ----------
    const pages = doc.getNumberOfPages();
    for (let p = 1; p <= pages; p++) {
      doc.setPage(p);
      stroke(C.line); doc.setLineWidth(0.3); doc.line(M, PH - M - 4, PW - M, PH - M - 4);
      font('normal', 7.5); color(C.muted);
      doc.text(clean(`${title} · Karyu Densetsu — Ficha (app de fã, não oficial)`), M, PH - M);
      doc.text(`${p}/${pages}`, PW - M, PH - M, { align: 'right' });
    }
    return doc;
  }

  window.KD_PDF = { build, clean };
})();
