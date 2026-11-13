/* Karyu Densetsu — Ficha
 * App estático (sem build). Estado salvo no localStorage do navegador.
 */
(() => {
  'use strict';

  const KD = window.KD;
  const TEC = window.KD_TECNICAS || [];
  const LS_KEY = 'kd-ficha-v1';

  // ---------- utilidades ----------
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => Math.random().toString(36).slice(2, 10);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const sum = (arr) => arr.reduce((a, b) => a + b, 0);
  const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
  const num = (v) => { const n = parseInt(v, 10); return Number.isFinite(n) ? n : 0; };
  // Dado justo: gerador criptográfico com amostragem por rejeição (sem viés de módulo).
  const d = (n) => {
    if (!window.crypto || !crypto.getRandomValues) return 1 + Math.floor(Math.random() * n);
    const buf = new Uint32Array(1), lim = Math.floor(0x100000000 / n) * n;
    do { crypto.getRandomValues(buf); } while (buf[0] >= lim);
    return 1 + (buf[0] % n);
  };

  const svg = (p, vb = '0 0 24 24') => `<svg viewBox="${vb}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  const I = {
    menu: svg('<path d="M4 6h16M4 12h16M4 18h16"/>'),
    minus: svg('<circle cx="12" cy="12" r="9"/><path d="M8 12h8"/>'),
    plus: svg('<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>'),
    check: svg('<path d="M5 12.5l4.5 4.5L19 7.5"/>', '0 0 24 24').replace('stroke-width="2"', 'stroke-width="3"'),
    chev: svg('<path d="M6 9l6 6 6-6"/>'),
    x: svg('<path d="M6 6l12 12M18 6L6 18"/>'),
    dice: svg('<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1.3" fill="currentColor"/><circle cx="16" cy="16" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/><circle cx="16" cy="8" r="1.3" fill="currentColor"/><circle cx="8" cy="16" r="1.3" fill="currentColor"/>'),
    add: svg('<path d="M12 5v14M5 12h14"/>'),
    copy: svg('<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>'),
    down: svg('<path d="M12 4v12M6 10l6 6 6-6M4 20h16"/>'),
    up: svg('<path d="M12 16V4M6 10l6-6 6 6M4 20h16"/>'),
    trash: svg('<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>'),
    sun: svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
    info: svg('<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>'),
    arrowUp: svg('<path d="M12 19V5M6 11l6-6 6 6"/>'),
    arrowDown: svg('<path d="M12 5v14M6 13l6 6 6-6"/>'),
    table: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  };

  // ---------- modelo ----------
  function blankChar() {
    const oc = {};
    KD.ocupacoes.forEach((o) => { oc[o.id] = { n: 0, esp: '' }; });
    return {
      id: uid(), v: 1,
      nome: '', conceito: '', aura: 1,
      atributos: { FOR: 1, RAZ: 1, AGI: 1, INS: 1, VON: 1, PRE: 1 },
      estilo: { nome: '', agarrao: 0, projetil: 0, golpe: 0, bloqueio: 0, combo: 0, esquiva: 0 },
      ocupacoes: oc,
      trunfos: [],
      caminho: { nome: '', eventos: [{ t: '', m: false }, { t: '', m: false }, { t: '', m: false }], rev: '', revM: false },
      lacos: [{ id: uid(), t: '', m: false }, { id: uid(), t: '', m: false }, { id: uid(), t: '', m: false }],
      tecnicas: [],
      bonus: { vigor: 0, canal: 0, defesa: 0, protecao: 0, ferimentos: 0 },
      estado: { vigor: null, feri: [], derrotado: false, sinc: 1, nagen: 0, acoes: 0, tensao: 2, karma: 0 },
      notas: '',
    };
  }

  function tecFromCatalog(name, extra = {}) {
    const t = TEC.find((x) => norm(x.n) === norm(name));
    return {
      id: uid(), nome: t ? t.n : name, custo: t ? t.c : '', tipos: t ? [...t.t] : [], elementos: t ? [...t.e] : [],
      req: t ? t.r : '', desc: t ? t.s : '', sinc: '', ougi: false, ougiTxt: '', upgrades: [], ...extra,
    };
  }
  function trunfoFromCatalog(name) {
    const t = KD.trunfos.find((x) => norm(x.nome) === norm(name));
    return { id: uid(), nome: t ? t.nome : name, req: t ? t.req : '', desc: t ? t.desc : '' };
  }

  function sampleChar() {
    const c = blankChar();
    c.nome = 'Sayaka Matsuoka';
    c.conceito = 'Delinquente violenta';
    c.atributos = { FOR: 5, RAZ: 1, AGI: 4, INS: 3, VON: 3, PRE: 2 };
    c.estilo = { nome: 'Street Fighting', agarrao: 0, projetil: 0, golpe: 3, bloqueio: 2, combo: 1, esquiva: 0 };
    c.ocupacoes.artista = { n: 3, esp: 'Música, Teatro' };
    c.ocupacoes.piloto = { n: 1, esp: '' };
    c.trunfos = [trunfoFromCatalog('Volta por Cima'), trunfoFromCatalog('Incansável')];
    const cam = KD.caminhos.find((x) => x.nome === 'Independência');
    c.caminho = { nome: cam.nome, eventos: cam.eventos.map((t) => ({ t, m: false })), rev: cam.rev, revM: false };
    c.lacos = [
      { id: uid(), t: 'Moto Tolwyn Taurus S1000 customizada', m: false },
      { id: uid(), t: 'Irmã mais nova', m: false },
      { id: uid(), t: 'RPGs de mesa', m: false },
    ];
    c.tecnicas = [
      tecFromCatalog('Aura de Batalha'),
      tecFromCatalog('Bloqueio Agressivo'),
      tecFromCatalog('Abre Alas'),
      tecFromCatalog('Dragão Nascente'),
      tecFromCatalog('Estrela Cadente', {
        ougi: true,
        sinc: 'Some sua Aura no dano.',
        ougiTxt: 'Você pode usar essa técnica como uma ação extra se acertou o oponente com Dragão Nascente primeiro.',
      }),
      tecFromCatalog('Palma Seca'),
    ];
    c.notas = 'Ficha de exemplo — toque em "Editar" para mudar tudo, ou crie uma nova ficha pelo menu.';
    return normalize(c);
  }

  // Garante todos os campos (fichas antigas ou importadas).
  function normalize(c) {
    const b = blankChar();
    const out = { ...b, ...c };
    out.atributos = { ...b.atributos, ...(c.atributos || {}) };
    out.estilo = { ...b.estilo, ...(c.estilo || {}) };
    out.ocupacoes = { ...b.ocupacoes };
    KD.ocupacoes.forEach((o) => { out.ocupacoes[o.id] = { ...b.ocupacoes[o.id], ...((c.ocupacoes || {})[o.id] || {}) }; });
    out.bonus = { ...b.bonus, ...(c.bonus || {}) };
    out.estado = { ...b.estado, ...(c.estado || {}) };
    out.caminho = { ...b.caminho, ...(c.caminho || {}) };
    if (!Array.isArray(out.caminho.eventos)) out.caminho.eventos = b.caminho.eventos;
    out.trunfos = (c.trunfos || []).map((t) => ({ id: t.id || uid(), nome: t.nome || '', req: t.req || '', desc: t.desc || '' }));
    out.lacos = (c.lacos || b.lacos).map((l) => ({ id: l.id || uid(), t: l.t || '', m: !!l.m }));
    out.tecnicas = (c.tecnicas || []).map((t) => ({ ...tecFromCatalog(''), nome: '', ...t, id: t.id || uid(), tipos: t.tipos || [], elementos: t.elementos || [], upgrades: t.upgrades || [] }));
    if (!out.id) out.id = uid();
    if (out.estado.vigor == null) out.estado.vigor = derived(out).vigorMax;
    return out;
  }

  // ---------- armazenamento ----------
  let store; // inicializado no fim do arquivo (depois das regras)
  function load() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (s && s.chars && s.order && s.order.length) {
          Object.keys(s.chars).forEach((k) => { s.chars[k] = normalize(s.chars[k]); });
          if (!s.chars[s.current]) s.current = s.order[0];
          s.mode = s.mode === 'edit' ? 'edit' : 'play';
          s.settings = { dice3d: true, diceSkin: 'karyu', ...(s.settings || {}) };
          return s;
        }
      }
    } catch (e) { /* armazenamento indisponível */ }
    const c = sampleChar();
    return { chars: { [c.id]: c }, order: [c.id], current: c.id, mode: 'play', settings: { dice3d: true, diceSkin: 'karyu' } };
  }
  let saveTimer = null;
  function save(now) {
    clearTimeout(saveTimer);
    const run = () => {
      try { localStorage.setItem(LS_KEY, JSON.stringify(store)); }
      catch (e) { toast('Não foi possível salvar neste navegador. Exporte a ficha pelo menu.'); }
    };
    if (now) run(); else saveTimer = setTimeout(run, 250);
  }
  const ch = () => store.chars[store.current];

  // estado efêmero da interface
  const ui = { open: {}, more: {}, modal: null, roll: null, pendingD10: 0, wake: null, catQuery: '', catTipo: null, catElem: null };

  // ---------- regras derivadas ----------
  function fx(c) {
    const out = {};
    c.trunfos.forEach((t) => {
      const def = KD.trunfos.find((x) => norm(x.nome) === norm(t.nome));
      if (def && def.fx) Object.entries(def.fx).forEach(([k, v]) => {
        if (k === 'attrMax' || k === 'estiloMax') out[k] = v; else out[k] = (out[k] || 0) + v;
      });
    });
    return out;
  }
  const hasTrunfo = (c, name) => c.trunfos.some((t) => norm(t.nome) === norm(name));
  const espCount = (s) => String(s || '').split(/[,;]/).map((x) => x.trim()).filter(Boolean).length;

  function derived(c) {
    const f = fx(c), a = c.atributos, e = c.estilo, b = c.bonus;
    const vigorMax = Math.max(0, c.aura + a.VON + a.FOR + (f.vigor || 0) + b.vigor);
    const canal = Math.max(0, c.aura + 2 + (f.canal || 0) + b.canal);
    const defesa = c.aura + a.AGI + Math.max(a.RAZ, a.INS) + e.esquiva + b.defesa;
    const protecao = c.aura + a.FOR + e.bloqueio + (f.protecao || 0) + b.protecao;
    const feriBoxes = clamp(1 + (f.ferimentos || 0) + b.ferimentos, 1, 12);
    const sincCena = Math.max(0, c.aura + (f.sinc || 0));
    const ocUsed = sum(KD.ocupacoes.map((o) => c.ocupacoes[o.id].n + (c.ocupacoes[o.id].n >= 2 ? espCount(c.ocupacoes[o.id].esp) : 0)));
    const nUpg = sum(c.tecnicas.map((t) => t.upgrades.length));
    return {
      f, vigorMax, canal, defesa, protecao, feriBoxes, sincCena, acoes: Math.max(0, c.aura),
      attrCap: f.attrMax || 5, estiloCap: f.estiloMax || 3,
      budget: {
        atributos: [sum(Object.values(a)), 18],
        ocupacoes: [Math.max(0, ocUsed - (f.esp || 0)), 6 + (f.ocupacoes || 0)],
        estilo: [sum(KD.estilo.map((s) => e[s.id])), 6 + (f.estilo || 0)],
        trunfos: [c.trunfos.length, 2],
        tecnicas: [c.tecnicas.length + nUpg, 6 + (f.tecnicas || 0)],
        lacos: [c.lacos.length, 3 + (f.lacos || 0)],
        ougi: [c.tecnicas.filter((t) => t.ougi).length, Math.max(0, 1 + (f.ougi || 0))],
      },
    };
  }

  function tecCost(t) {
    let c = typeof t.custo === 'number' ? t.custo : parseInt(t.custo, 10);
    if (!Number.isFinite(c)) return null;
    if (t.upgrades.includes('Ressonância')) c = Math.max(1, c - 1);
    return c;
  }

  // ---------- ações de estado ----------
  function ensureFeri(c) {
    const n = derived(c).feriBoxes;
    while (c.estado.feri.length < n) c.estado.feri.push(false);
    c.estado.feri.length = n;
  }
  function markWound(c) {
    ensureFeri(c);
    const i = c.estado.feri.indexOf(false);
    if (i >= 0) { c.estado.feri[i] = true; return 'ferido'; }
    c.estado.derrotado = true; return 'derrotado';
  }
  function loseVigor(c, n) {
    let res = null;
    for (let i = 0; i < n; i++) {
      if (c.estado.vigor > 0) c.estado.vigor--;
      else res = markWound(c);
    }
    return res;
  }
  // Gasta nagen na rodada; retorna o Vigor perdido por exceder o Limiar de Canalização.
  function spendNagen(c, amount) {
    const { canal, f } = derived(c);
    const before = c.estado.nagen, after = before + amount;
    let loss = Math.max(0, after - canal) - Math.max(0, before - canal);
    if (loss > 0 && f.jasq) loss += 1;
    c.estado.nagen = after;
    return { loss, wound: loss ? loseVigor(c, loss) : null };
  }

  // ---------- render ----------
  const app = $('#app');
  const modalRoot = $('#modal-root');

  function render() {
    const c = ch();
    ensureFeri(c);
    const D = derived(c);
    c.estado.vigor = clamp(c.estado.vigor, 0, D.vigorMax);
    document.body.classList.toggle('mode-edit', store.mode === 'edit');
    const focus = captureFocus();
    app.innerHTML = appbar() + `<main class="page">${sheet(c, D)}</main>` + dock(c, D);
    renderModal();
    restoreFocus(focus);
  }

  function captureFocus() {
    const el = document.activeElement;
    if (!el || !el.dataset || !el.dataset.bind) return null;
    return { bind: el.dataset.bind, s: el.selectionStart, e: el.selectionEnd };
  }
  function restoreFocus(f) {
    if (!f) return;
    const el = document.querySelector(`[data-bind="${CSS.escape(f.bind)}"]`);
    if (!el) return;
    el.focus({ preventScroll: true });
    try { if (f.s != null) el.setSelectionRange(f.s, f.e); } catch (e) { /* select */ }
  }

  function appbar() {
    const edit = store.mode === 'edit';
    return `<header class="appbar">
      <button class="icon-btn" data-act="open-menu" aria-label="Fichas e opções">${I.menu}</button>
      <div class="brand">Karyu <span>Densetsu</span></div>
      <div class="seg" role="group" aria-label="Modo">
        <button data-act="mode" data-v="play" aria-pressed="${!edit}">Jogar</button>
        <button data-act="mode" data-v="edit" aria-pressed="${edit}">Editar</button>
      </div>
    </header>`;
  }

  const isEdit = () => store.mode === 'edit';
  const chk = (on, act, attrs = '', label = '') =>
    `<button class="chk" role="checkbox" aria-checked="${!!on}" data-act="${act}" ${attrs} aria-label="${esc(label)}">${I.check}</button>`;
  // Versão visual (não interativa) para usar dentro de outro botão.
  const chkVis = (on) => `<span class="chk" aria-hidden="true" data-on="${!!on}" ${on ? 'aria-checked="true"' : ''}>${I.check}</span>`;
  const pill = ([u, m], label) => `<span class="pill-count ${u === m ? 'ok' : u > m ? 'over' : ''}">${label} ${u}/${m}</span>`;
  const miniStep = (act, attrs, val, min = -99, max = 99, label = '') =>
    `<span class="mini-stepper" role="group" aria-label="${esc(label)}"><button data-act="${act}" ${attrs} data-d="-1" ${val <= min ? 'disabled' : ''} aria-label="Diminuir">−</button><output>${val}</output><button data-act="${act}" ${attrs} data-d="1" ${val >= max ? 'disabled' : ''} aria-label="Aumentar">+</button></span>`;

  function sheet(c, D) {
    return `<div class="sheet">
      <div class="sheet-head">${secId(c, D)}${secVigor(c, D)}${secFeri(c, D)}</div>
      <div class="col col1">${isEdit() ? secBudget(D) : ''}${secLimiares(c, D)}${secAtributos(c, D)}${secEstilo(c, D)}${secOcupacoes(c, D)}</div>
      <div class="col col2">${secTrunfos(c, D)}${secCaminho(c)}${secLacos(c, D)}${secNotas(c)}</div>
      <div class="col col3">${secTecnicas(c, D)}</div>
    </div>`;
  }

  function secBudget(D) {
    const b = D.budget;
    return `<section class="section"><div class="section-head"><h2 class="h-section">Criação</h2></div>
      <p class="hint" style="margin:0">Pontos iniciais de um protagonista. Os limites mudam com alguns trunfos (aplicados automaticamente).</p>
      <div class="budget">${pill(b.atributos, 'Atributos')}${pill(b.ocupacoes, 'Ocupações')}${pill(b.estilo, 'Estilo')}${pill(b.trunfos, 'Trunfos')}${pill(b.tecnicas, 'Técnicas')}${pill(b.lacos, 'Laços')}${pill(b.ougi, 'Ougi')}</div>
    </section>`;
  }

  function secId(c) {
    if (isEdit()) {
      return `<section class="section sec-id">
        <div class="who stack">
          <label class="field"><span>Nome</span><input class="input name" data-bind="nome" value="${esc(c.nome)}" placeholder="Nome do protagonista" autocomplete="off"></label>
          <label class="field"><span>Conceito</span><input class="input" data-bind="conceito" value="${esc(c.conceito)}" placeholder="Ex.: Herdeira indecisa" autocomplete="off"></label>
        </div>
        <div class="aura-edit"><div class="aura-box"><small>Aura</small><b>${c.aura}</b></div>
          <div class="mini-step">${miniStep('step', 'data-path="aura"', c.aura, 0, 10, 'Aura')}</div></div>
      </section>`;
    }
    return `<section class="section sec-id">
      <div class="who"><h1 class="h1">${esc(c.nome) || 'Sem nome'}</h1><div class="concept">${esc(c.conceito)}</div></div>
      <div class="aura-box" title="Aura"><small>Aura</small><b>${c.aura}</b></div>
    </section>`;
  }

  function secVigor(c, D) {
    const v = c.estado.vigor, max = D.vigorMax;
    const pct = max ? (v / max) * 100 : 0;
    return `<section class="section sec-vigor" style="border-bottom:0;padding-bottom:4px">
      <div class="section-head"><h2 class="h-section">Vigor</h2></div>
      <div class="vigor" role="group" aria-label="Barra de Vigor">
        <div class="fill" style="width:${pct}%"></div>
        <div class="ctrl">
          <button class="circle-btn" data-act="vigor" data-d="-1" aria-label="Perder 1 de Vigor" ${v <= 0 ? 'style="opacity:.55"' : ''}>${I.minus}</button>
          <b>${v}/${max}</b>
          <button class="circle-btn" data-act="vigor" data-d="1" aria-label="Recuperar 1 de Vigor" ${v >= max ? 'disabled' : ''}>${I.plus}</button>
        </div>
      </div>
      ${isEdit() ? `<div class="kv vigor-note"><span>Máx. = Aura + Vontade + Força${D.f.vigor ? ` + ${D.f.vigor} (trunfos)` : ''} · bônus</span>${miniStep('step', 'data-path="bonus.vigor"', c.bonus.vigor, -20, 20, 'Bônus de Vigor')}</div>` : ''}
    </section>`;
  }

  function secFeri(c, D) {
    const marked = c.estado.feri.filter(Boolean).length;
    const status = c.estado.derrotado ? 'Derrotado' : marked ? 'Ferido' : '';
    return `<section class="section sec-feri">
      <div class="section-head"><h2 class="h-section red">Ferimentos</h2></div>
      <div class="feri">${c.estado.feri.map((m, i) => chk(m, 'feri', `data-i="${i}"`, `Caixa de ferimento ${i + 1}`)).join('')}
        ${status ? `<span class="feri-status">${status}</span>` : ''}</div>
      ${isEdit() ? `<div class="kv" style="margin-top:8px"><span>Caixas extras (avanços)${D.f.ferimentos ? ` · +${D.f.ferimentos} trunfos` : ''}</span>${miniStep('step', 'data-path="bonus.ferimentos"', c.bonus.ferimentos, 0, 10, 'Caixas extras')}</div>` : ''}
    </section>`;
  }

  function secLimiares(c, D) {
    const L = [
      ['Canalização', D.canal, 'Aura + 2', 'canal'],
      ['Defesa', D.defesa, 'Aura + Agilidade + maior(Razão, Instinto) + Esquiva', 'defesa'],
      ['Proteção', D.protecao, 'Aura + Força + Bloqueio', 'protecao'],
    ];
    const extra = (k) => (k === 'canal' && D.f.canal ? ` ${D.f.canal} (trunfos)` : k === 'protecao' && D.f.protecao ? ` + ${D.f.protecao} (trunfos)` : '');
    return `<section class="section">
      <div class="section-head"><h2 class="h-section">Limiares</h2></div>
      <div class="stack">${L.map(([n, v, f, k]) => `
        <div>
          <div class="limiar"><div class="bar">Limiar de<b>${n}</b></div><div class="diamond"><span>${v}</span></div></div>
          ${isEdit() ? `<div class="kv"><span class="formula">${f}${extra(k)} · bônus</span>${miniStep('step', `data-path="bonus.${k}"`, c.bonus[k], -10, 10, 'Bônus')}</div>` : ''}
        </div>`).join('')}</div>
    </section>`;
  }

  function secAtributos(c, D) {
    const order = ['FOR', 'RAZ', 'AGI', 'INS', 'VON', 'PRE'];
    const name = (id) => KD.atributos.find((a) => a.id === id).nome;
    return `<section class="section">
      <div class="section-head"><h2 class="h-section">Atributos</h2>${isEdit() ? pill(D.budget.atributos, '') : ''}</div>
      <div class="grid2">${order.map((id) => {
        const v = c.atributos[id];
        if (isEdit()) {
          return `<div class="attr"><span class="lbl"><b>${id}</b><small>${name(id)}</small></span>
            <span class="stepper"><button data-act="step" data-path="atributos.${id}" data-d="-1" ${v <= 1 ? 'disabled' : ''} aria-label="Diminuir ${name(id)}">−</button><span class="numbox">${v}</span><button data-act="step" data-path="atributos.${id}" data-d="1" ${v >= D.attrCap ? 'disabled' : ''} aria-label="Aumentar ${name(id)}">+</button></span></div>`;
        }
        return `<button class="attr" data-act="roll-attr" data-attr="${id}" aria-label="Rolar ${name(id)} (${v})"><span class="lbl"><b>${id}</b><small>${name(id)}</small></span><span class="numbox">${v}</span></button>`;
      }).join('')}</div>
    </section>`;
  }

  function secEstilo(c, D) {
    const e = c.estilo;
    const head = isEdit()
      ? `<div class="section-head"><h2 class="h-section">Estilo de Luta</h2>${pill(D.budget.estilo, '')}</div>
         <div class="split" style="margin-bottom:10px">
           <label class="field"><span>Nome do estilo</span><input class="input" data-bind="estilo.nome" value="${esc(e.nome)}" placeholder="Ex.: Street Fighting"></label>
           <label class="field"><span>Usar um exemplo</span><select class="select" data-act-change="estilo-modelo"><option value="">—</option>${KD.estilosExemplo.map((s, i) => `<option value="${i}">${esc(s.nome)}${s.secreto ? ' (secreto)' : ''}</option>`).join('')}</select></label>
         </div>`
      : `<div class="section-head"><h2 class="h-section">Estilo de Luta</h2><div class="marker-red">${esc(e.nome)}</div></div>`;
    return `<section class="section">${head}
      <div class="grid2">${KD.estilo.map((s) => {
        const v = e[s.id];
        if (isEdit()) {
          return `<div class="attr small"><span class="lbl">${s.nome}</span><span class="stepper"><button data-act="step" data-path="estilo.${s.id}" data-d="-1" ${v <= 0 ? 'disabled' : ''} aria-label="Diminuir ${s.nome}">−</button><span class="numbox">${v}</span><button data-act="step" data-path="estilo.${s.id}" data-d="1" ${v >= D.estiloCap ? 'disabled' : ''} aria-label="Aumentar ${s.nome}">+</button></span></div>`;
        }
        return `<button class="attr small" data-act="roll-estilo" data-id="${s.id}" aria-label="Rolar ${s.nome}"><span class="lbl">${s.nome}</span><span class="numbox">${v}</span></button>`;
      }).join('')}</div>
    </section>`;
  }

  function secOcupacoes(c, D) {
    if (isEdit()) {
      return `<section class="section">
        <div class="section-head"><h2 class="h-section">Ocupações</h2>${pill(D.budget.ocupacoes, '')}</div>
        <p class="hint" style="margin:-4px 0 10px">Nível 0–3 (${KD.niveisOcupacao.join(', ')}). Em Proficiente (2) você pode comprar uma especialização por 1 ponto; em Mestre, uma segunda. Separe por vírgula.</p>
        <div class="stack">${KD.ocupacoes.map((o) => {
          const v = c.ocupacoes[o.id];
          return `<div>
            <div class="attr oc"><span class="lbl"><b>${o.nome}</b><small>${KD.niveisOcupacao[v.n]}</small></span>
              <span class="stepper"><button data-act="step" data-path="ocupacoes.${o.id}.n" data-d="-1" ${v.n <= 0 ? 'disabled' : ''} aria-label="Diminuir ${o.nome}">−</button><span class="numbox">${v.n}</span><button data-act="step" data-path="ocupacoes.${o.id}.n" data-d="1" ${v.n >= 3 ? 'disabled' : ''} aria-label="Aumentar ${o.nome}">+</button></span></div>
            ${v.n >= 2 ? `<input class="input" style="margin-top:6px;font-size:14px;padding:6px 10px" data-bind="oc:${o.id}:esp" data-rerender value="${esc(v.esp)}" placeholder="Especializações (ex.: Música, Teatro)">` : ''}
          </div>`;
        }).join('')}</div>
      </section>`;
    }
    const list = KD.ocupacoes.filter((o) => c.ocupacoes[o.id].n > 0);
    return `<section class="section">
      <div class="section-head"><h2 class="h-section">Ocupações</h2></div>
      <div class="stack">${list.length ? list.map((o) => {
        const v = c.ocupacoes[o.id];
        return `<button class="attr oc" data-act="roll-oc" data-id="${o.id}" aria-label="Rolar com ${o.nome}"><span class="lbl"><b>${o.nome}</b>${v.esp && v.n >= 2 ? `<small>Esp.: ${esc(v.esp)}</small>` : ''}</span><span class="numbox">${v.n}</span></button>`;
      }).join('') : '<div class="empty">Nenhuma ocupação. Use “Editar” para distribuir pontos.</div>'}</div>
    </section>`;
  }

  function secTrunfos(c, D) {
    const items = c.trunfos.map((t) => {
      if (isEdit()) {
        return `<div class="card"><div class="card-body stack">
          <div style="display:flex;gap:8px;align-items:center"><input class="inline-input h3" data-bind="trunfo:${t.id}:nome" data-rerender value="${esc(t.nome)}" placeholder="Nome do trunfo"><button class="x-btn" data-act="del-trunfo" data-id="${t.id}" aria-label="Remover trunfo">${I.trash}</button></div>
          <label class="field"><span>Requisito</span><input class="input" data-bind="trunfo:${t.id}:req" value="${esc(t.req)}" placeholder="—"></label>
          <label class="field"><span>Descrição</span><textarea class="textarea" data-bind="trunfo:${t.id}:desc" placeholder="O que o trunfo faz">${esc(t.desc)}</textarea></label>
        </div></div>`;
      }
      const long = (t.desc || '').length > 150;
      const open = ui.more[t.id];
      return `<div class="card"><div class="card-body">
          <div class="h3">${esc(t.nome)}</div>
          ${t.req ? `<div class="req">Requisito: <b>${esc(t.req)}</b></div>` : ''}
          <p class="desc ${long && !open ? 'clamp3' : ''}">${esc(t.desc)}</p>
        </div>${long ? `<button class="more" data-act="more" data-id="${t.id}">${open ? 'Ler menos...' : 'Ler mais...'}</button>` : ''}</div>`;
    }).join('');
    return `<section class="section">
      <div class="section-head"><h2 class="h-section">Trunfos</h2>${isEdit() ? pill(D.budget.trunfos, '') : ''}</div>
      <div class="stack">${items || (isEdit() ? '' : '<div class="empty">Nenhum trunfo.</div>')}
      ${isEdit() ? `<button class="add-btn" data-act="cat-trunfo">+ Adicionar trunfo</button>` : ''}</div>
    </section>`;
  }

  function secCaminho(c) {
    const cam = c.caminho;
    if (isEdit()) {
      return `<section class="section">
        <div class="section-head"><h2 class="h-section">Caminho</h2></div>
        <label class="field" style="margin-bottom:10px"><span>Escolher do livro</span><select class="select" data-act-change="caminho-modelo"><option value="">— personalizado —</option>${KD.caminhos.map((x, i) => `<option value="${i}" ${x.nome === cam.nome ? 'selected' : ''}>${esc(x.nome)}</option>`).join('')}</select></label>
        <div class="stack">
          <label class="field"><span>Nome</span><input class="input" data-bind="caminho.nome" value="${esc(cam.nome)}" placeholder="Ex.: Independência"></label>
          ${cam.eventos.map((e, i) => `<div class="row"><span class="t"><input class="inline-input" data-bind="evento:${i}" value="${esc(e.t)}" placeholder="Evento ${i + 1}"></span>${cam.eventos.length > 1 ? `<button class="x-btn" data-act="del-evento" data-i="${i}" aria-label="Remover evento">${I.x}</button>` : ''}</div>`).join('')}
          <button class="add-btn" data-act="add-evento">+ Evento</button>
          <div class="row dark"><span class="t"><small>Reviravolta</small><input class="inline-input" data-bind="caminho.rev" value="${esc(cam.rev)}" placeholder="O que encerra este caminho"></span></div>
        </div>
      </section>`;
    }
    return `<section class="section">
      <div class="section-head"><h2 class="h-section">Caminho</h2><div class="marker-red" ${cam.revM ? 'style="text-decoration:line-through"' : ''}>${esc(cam.nome)}</div></div>
      <div class="stack">
        ${cam.eventos.filter((e) => e.t).map((e) => {
          const i = cam.eventos.indexOf(e);
          return `<button class="row ${e.m ? 'on' : ''}" data-act="evento" data-i="${i}" role="checkbox" aria-checked="${e.m}"><span class="t">${esc(e.t)}</span>${chkVis(e.m)}</button>`;
        }).join('') || '<div class="empty">Escolha um caminho em “Editar”.</div>'}
        ${cam.rev ? `<button class="row dark ${cam.revM ? 'struck' : ''}" data-act="rev" aria-pressed="${cam.revM}"><span class="t"><small>Reviravolta${cam.revM ? ' — aconteceu!' : ''}</small><span>${esc(cam.rev)}</span></span></button>` : ''}
      </div>
    </section>`;
  }

  function secLacos(c, D) {
    return `<section class="section">
      <div class="section-head"><h2 class="h-section">Laços</h2>${isEdit() ? pill(D.budget.lacos, '') : '<span class="meta">desmarcar = +1 sinc.</span>'}</div>
      <div class="stack">
        ${c.lacos.map((l) => isEdit()
          ? `<div class="row"><span class="t"><input class="inline-input" data-bind="laco:${l.id}:t" value="${esc(l.t)}" placeholder="Pessoa, grupo, objeto ou ideal"></span><button class="x-btn" data-act="del-laco" data-id="${l.id}" aria-label="Remover laço">${I.x}</button></div>`
          : `<button class="row ${l.m ? 'on' : ''}" data-act="laco" data-id="${l.id}" role="checkbox" aria-checked="${l.m}"><span class="t">${esc(l.t) || '<em>(sem nome)</em>'}</span>${chkVis(l.m)}</button>`).join('')}
        ${isEdit() ? '<button class="add-btn" data-act="add-laco">+ Adicionar laço</button>' : ''}
      </div>
    </section>`;
  }

  function secNotas(c) {
    return `<section class="section">
      <div class="section-head"><h2 class="h-section">Karma & Notas</h2></div>
      <div class="kv" style="margin-bottom:8px"><span><b style="color:var(--text-primary)">Karma</b> — gaste em avanços e efeitos narrativos</span>${miniStep('step', 'data-path="estado.karma"', c.estado.karma, 0, 999, 'Karma')}</div>
      <textarea class="textarea" data-bind="notas" rows="4" placeholder="Equipamentos, avanços, aparência, história, anotações da sessão...">${esc(c.notas)}</textarea>
    </section>`;
  }

  function secTecnicas(c, D) {
    const n = c.tecnicas.length;
    return `<section class="section">
      <div class="section-head"><h2 class="h-section">Técnicas</h2>${isEdit() ? pill(D.budget.tecnicas, '') : `<span class="meta">${n} técnica${n === 1 ? '' : 's'}</span>`}</div>
      <div class="stack">${c.tecnicas.map((t, i) => tecCard(c, t, i)).join('') || (isEdit() ? '' : '<div class="empty">Nenhuma técnica.</div>')}
      ${isEdit() ? '<button class="add-btn" data-act="cat-tec">+ Adicionar técnica</button>' : ''}</div>
      ${isEdit() ? '<p class="hint" style="margin-top:10px">Cada upgrade conta como uma técnica. Marque o seu ougi (técnica de sucessão do estilo).</p>' : ''}
    </section>`;
  }

  function tags(t) {
    return [...t.tipos, ...t.elementos].map((x) => `<span class="tag">${esc(x)}</span>`).join('');
  }

  function tecCard(c, t, i) {
    const open = !!ui.open[t.id];
    const cost = tecCost(t);
    const head = `<button class="tec-head" data-act="tec-toggle" data-id="${t.id}" aria-expanded="${open}">
        <span class="nm"><span class="h3">${esc(t.nome) || 'Nova técnica'}</span>${t.ougi ? ' <span class="ougi">(Ougi)</span>' : ''}
          ${t.tipos.length || t.elementos.length ? `<div class="tags">${tags(t)}</div>` : ''}</span>
        <span class="cost" title="Custo em nagen">${cost ?? esc(t.custo) ?? ''}</span>
        <span class="chev">${I.chev}</span>
      </button>`;
    if (!open) return `<div class="tec">${head}</div>`;
    if (isEdit()) return `<div class="tec open">${head}<div class="tec-body stack">${tecEditor(c, t, i)}</div></div>`;
    const upg = t.upgrades.map((u) => {
      const def = KD.upgrades.find((x) => x.nome === u);
      return `<div class="upg-title">Upgrade / <span>${esc(u)}</span></div><p>${esc(def ? def.desc : '')}</p>`;
    }).join('');
    return `<div class="tec open">${head}<div class="tec-body">
      ${t.desc ? `<p>${esc(t.desc)}</p>` : ''}
      ${t.sinc ? `<div class="sub">Sincronização</div><p>${esc(t.sinc)}</p>` : ''}
      ${t.ougi ? `<div class="ougi-box"><b>Ougi</b>${esc(t.ougiTxt) || 'Esta é a técnica de sucessão do seu estilo. Veja o efeito de ougi no livro.'}</div>` : ''}
      ${upg}
      ${t.req ? `<div class="caption">Requisito: <b style="color:var(--text-primary)">${esc(t.req)}</b></div>` : ''}
      <div class="tec-actions"><button class="btn primary" data-act="use-tec" data-id="${t.id}">${I.dice} Usar técnica</button></div>
    </div></div>`;
  }

  function tecEditor(c, t, i) {
    const tg = (list, key) => list.map((x) => `<button class="tag tag-btn ${t[key].includes(x) ? '' : 'off'}" data-act="tec-tag" data-id="${t.id}" data-key="${key}" data-v="${esc(x)}" aria-pressed="${t[key].includes(x)}">${esc(x)}</button>`).join('');
    return `
      <div class="split">
        <label class="field" style="grid-column:1/-1"><span>Nome</span><input class="input" data-bind="tec:${t.id}:nome" data-rerender value="${esc(t.nome)}"></label>
        <label class="field"><span>Custo (nagen)</span><input class="input" data-bind="tec:${t.id}:custo" data-rerender value="${esc(t.custo)}" inputmode="numeric"></label>
        <label class="field"><span>Requisito</span><input class="input" data-bind="tec:${t.id}:req" value="${esc(t.req)}"></label>
      </div>
      <div><div class="group-label">Tipo</div><div class="tags">${tg(KD.tiposGolpe, 'tipos')}</div></div>
      <div><div class="group-label">Afinidade</div><div class="tags">${tg(KD.elementos, 'elementos')}</div></div>
      <label class="field"><span>Descrição</span><textarea class="textarea" data-bind="tec:${t.id}:desc">${esc(t.desc)}</textarea></label>
      <label class="field"><span>Efeito de sincronização</span><textarea class="textarea" data-bind="tec:${t.id}:sinc" rows="2" placeholder="Quando todo o custo é pago com sincronização">${esc(t.sinc)}</textarea></label>
      <label class="toggle">${chk(t.ougi, 'tec-ougi', `data-id="${t.id}"`, 'Ougi')} É o ougi do meu estilo</label>
      ${t.ougi ? `<label class="field"><span>Efeito de ougi</span><textarea class="textarea" data-bind="tec:${t.id}:ougiTxt" rows="2">${esc(t.ougiTxt)}</textarea></label>` : ''}
      <div><div class="group-label">Upgrades (cada um conta como 1 técnica)</div><div class="chips">${KD.upgrades.map((u) => `<button class="chip" data-act="tec-upg" data-id="${t.id}" data-v="${esc(u.nome)}" aria-pressed="${t.upgrades.includes(u.nome)}" title="${esc(u.desc)}">${esc(u.nome)}</button>`).join('')}</div></div>
      <div class="tec-actions">
        <button class="btn light sm" data-act="tec-move" data-id="${t.id}" data-d="-1" ${i === 0 ? 'disabled' : ''}>${I.arrowUp} Subir</button>
        <button class="btn light sm" data-act="tec-move" data-id="${t.id}" data-d="1" ${i === c.tecnicas.length - 1 ? 'disabled' : ''}>${I.arrowDown} Descer</button>
        <button class="btn ghost sm" data-act="del-tec" data-id="${t.id}" style="margin-left:auto">${I.trash} Remover</button>
      </div>`;
  }

  function dock(c, D) {
    if (isEdit()) {
      return `<nav class="dock"><div class="dock-inner"><button class="roll-btn" data-act="mode" data-v="play">${I.check} Pronto — voltar a jogar</button></div></nav>`;
    }
    const over = c.estado.nagen > D.canal;
    return `<nav class="dock" aria-label="Recursos da cena"><div class="dock-inner">
      <button class="stat" data-act="open-mesa"><small>Sinc.</small><b>${c.estado.sinc}</b></button>
      <button class="stat ${over ? 'warn' : ''}" data-act="open-mesa"><small>Nagen</small><b>${c.estado.nagen}<em>/${D.canal}</em></b></button>
      <button class="stat" data-act="open-mesa"><small>Ações</small><b>${c.estado.acoes}<em>/${D.acoes}</em></b></button>
      <button class="roll-btn" data-act="roll-free">${I.dice} Rolar</button>
    </div></nav>`;
  }

  // ---------- modais ----------
  function openModal(m) { ui.modal = m; renderModal(); }
  function closeModal() { ui.modal = null; ui.roll = null; renderModal(); }
  function renderModal() {
    const m = ui.modal;
    if (!m) { modalRoot.innerHTML = ''; document.body.style.overflow = ''; return; }
    document.body.style.overflow = 'hidden';
    const c = ch(), D = derived(c);
    const prevScroll = modalRoot.querySelector('.sheet-modal, .drawer')?.scrollTop || 0;
    let html = '';
    if (m.type === 'menu') html = menuDrawer();
    else if (m.type === 'mesa') html = mesaModal(c, D);
    else if (m.type === 'roll') html = rollModal(c, D);
    else if (m.type === 'cat-tec') html = catTecModal(c);
    else if (m.type === 'cat-trunfo') html = catTrunfoModal(c);
    else if (m.type === 'confirm') html = confirmModal(m);
    else if (m.type === 'about') html = aboutModal();
    modalRoot.innerHTML = html;
    const box = modalRoot.querySelector('.sheet-modal, .drawer');
    if (box && m.keepScroll) box.scrollTop = prevScroll;
    m.keepScroll = true;
  }
  const modalHead = (title) => `<div class="modal-head"><h2 class="h-section">${title}</h2><button class="icon-btn" data-act="close" aria-label="Fechar">${I.x}</button></div>`;

  function menuDrawer() {
    const items = store.order.map((id) => {
      const c = store.chars[id];
      return `<button class="char-item ${id === store.current ? 'cur' : ''}" data-act="pick-char" data-id="${id}">
        <span class="av">${esc((c.nome || '?').trim()[0] || '?')}</span>
        <span><div class="nm">${esc(c.nome) || 'Sem nome'}</div><div class="cc">${esc(c.conceito) || '—'}</div></span></button>`;
    }).join('');
    const wakeOk = 'wakeLock' in navigator;
    return `<div class="overlay side" data-act="overlay"><aside class="drawer" role="dialog" aria-label="Fichas">
      ${modalHead('Fichas')}
      <div>${items}</div>
      <div class="menu-list">
        <button class="menu-item" data-act="new-char">${I.add} Nova ficha em branco</button>
        <button class="menu-item" data-act="dup-char">${I.copy} Duplicar esta ficha</button>
        <button class="menu-item" data-act="export-char">${I.down} Exportar ficha (.json)</button>
        <button class="menu-item" data-act="import-char">${I.up} Importar ficha (.json)</button>
        <button class="menu-item" data-act="del-char">${I.trash} Excluir esta ficha</button>
        <div class="menu-sep"></div>
        ${wakeOk ? `<button class="menu-item" data-act="wake">${I.sun} ${ui.wake ? 'Tela sempre ligada: ativado' : 'Manter a tela ligada'}</button>` : ''}
        <button class="menu-item" data-act="about">${I.info} Sobre e como usar</button>
      </div>
      <input type="file" id="import-file" accept="application/json,.json" hidden>
    </aside></div>`;
  }

  function aboutModal() {
    return `<div class="overlay" data-act="overlay"><div class="sheet-modal" role="dialog" aria-label="Sobre">
      ${modalHead('Como usar')}
      <div class="modal-body body2" style="color:var(--text-primary)">
        <p style="margin:0"><b>Editar</b>: monte o protagonista — atributos, estilo, ocupações, trunfos, caminho, laços e técnicas. Os limiares e o Vigor são calculados automaticamente e o painel “Criação” mostra os pontos usados.</p>
        <p style="margin:0"><b>Jogar</b>: toque em um atributo, estilo ou ocupação para rolar. Toque na técnica para ver detalhes e em “Usar técnica” para gastar nagen e sincronização. A barra inferior mostra Sincronização, Nagen da rodada e Ações extras — toque nela para abrir a Mesa (nova rodada, nova cena, fim de sessão, poder das emoções).</p>
        <p style="margin:0"><b>Dados</b>: o app separa os dois maiores; toque em um dado para trocar a seleção. 6+ fora do total vira Sincronização, 1 fora do total vira Tensão. Nada muda na ficha até você tocar em “Aplicar”.</p>
        <p style="margin:0">Tudo fica salvo neste aparelho. Use “Exportar” para guardar um backup ou passar a ficha para outro celular. Funciona offline depois do primeiro acesso.</p>
        <p class="caption" style="margin:0">App de fã, não oficial. A Lenda do Dragão de Fogo: Karyu Densetsu © Nina Bichara, Thiago Rosa e Jambô Editora. Consulte o livro para as regras completas.</p>
      </div></div></div>`;
  }

  function confirmModal(m) {
    return `<div class="overlay" data-act="overlay"><div class="sheet-modal" role="alertdialog" aria-label="${esc(m.title)}">
      ${modalHead(esc(m.title))}
      <div class="modal-body body2" style="color:var(--text-primary)">${m.body}</div>
      <div class="modal-foot"><button class="btn light" data-act="close">Cancelar</button><button class="btn primary" data-act="confirm-ok">${esc(m.ok || 'Confirmar')}</button></div>
    </div></div>`;
  }

  function mesaModal(c, D) {
    const e = c.estado;
    const acoes = Array.from({ length: D.acoes }, (_, i) => chk(i < e.acoes, 'acao', `data-i="${i}"`, `Ação extra ${i + 1}`)).join('');
    return `<div class="overlay" data-act="overlay"><div class="sheet-modal" role="dialog" aria-label="Mesa">
      ${modalHead('Mesa')}
      <div class="modal-body">
        <div class="split">
          <div class="ctl"><span>Sincronização<small>d10 · ${D.sincCena}/cena</small></span>${miniStep('step', 'data-path="estado.sinc"', e.sinc, 0, 99)}</div>
          <div class="ctl"><span>Nagen na rodada<small>Limiar ${D.canal}</small></span>${miniStep('step', 'data-path="estado.nagen"', e.nagen, 0, 99)}</div>
          <div class="ctl"><span>Tensão<small>pilha do narrador</small></span>${miniStep('step', 'data-path="estado.tensao"', e.tensao, 0, 99)}</div>
          <div class="ctl"><span>Karma</span>${miniStep('step', 'data-path="estado.karma"', e.karma, 0, 999)}</div>
        </div>
        <div class="ctl"><span>Ações extras / reações<small>Aura ${c.aura} por rodada</small></span><span class="feri" style="gap:10px">${acoes || '<span class="hint">Aura 0</span>'}</span></div>
        ${e.nagen > D.canal ? `<div class="note bad">Você passou ${e.nagen - D.canal} do Limiar de Canalização nesta rodada.</div>` : ''}
        <div class="split">
          <button class="btn dark" data-act="nova-rodada">Nova rodada</button>
          <button class="btn primary" data-act="nova-cena">Nova cena</button>
        </div>
        <button class="btn light" data-act="fim-sessao">Fim da sessão (calcular karma)</button>

        <div><div class="group-label">Poder das emoções (1 dado de sinc.)</div>
          <div class="stack">${KD.emocoes.map((x) => `<div class="row" style="font-weight:400"><span class="t"><b>${x.nome}</b><br><span class="caption">${esc(x.desc)}</span></span>
            <button class="btn sm primary" data-act="emocao" data-v="${x.nome}" ${e.sinc < 1 ? 'disabled' : ''}>Usar</button></div>`).join('')}</div>
          ${e.sinc < 1 ? '<p class="hint">Sem sincronização? Desmarque um laço para ganhar 1 dado.</p>' : ''}
        </div>
        <div><div class="group-label">Splash (margem 5+ e descarte 1 sinc.)</div>
          <div class="stack">${KD.splash.map((x) => `<div class="note"><span><b>${x.nome}:</b> ${esc(x.desc)}</span></div>`).join('')}</div>
        </div>
      </div>
    </div></div>`;
  }

  // ----- rolagem -----
  function openRoll(opts = {}) {
    const c = ch();
    const r = {
      attr: 'AGI', bonus: null, extra: 0, adv: 0, sinc: 0, alvo: '', tecId: null, custo: 0, kiai: false, rolar: true,
      free: ui.pendingD10, result: null, ...opts,
    };
    if (r.tecId) {
      const t = c.tecnicas.find((x) => x.id === r.tecId);
      r.custo = tecCost(t) ?? 0;
      const attack = t.tipos.find((x) => ['Golpe', 'Combo', 'Agarrão', 'Projétil'].includes(x));
      const defense = t.tipos.find((x) => ['Esquiva', 'Bloqueio'].includes(x));
      const tipo = attack || defense;
      r.rolar = !!tipo;
      if (tipo) r.bonus = { kind: 'estilo', id: estiloId(tipo) };
      if (tipo === 'Bloqueio') r.attr = 'FOR';
      if (t.upgrades.includes('Precisão')) r.adv += 1;
    }
    ui.roll = r;
    openModal({ type: 'roll' });
    if (want3d()) getDiceBox().catch(() => {});
  }
  const estiloId = (nome) => (KD.estilo.find((s) => s.nome === nome) || {}).id;

  function bonusValue(c, b) {
    if (!b) return 0;
    if (b.kind === 'estilo') return c.estilo[b.id] || 0;
    if (b.kind === 'oc') return c.ocupacoes[b.id].n;
    if (b.kind === 'tensao') return c.estado.tensao;
    return 0;
  }
  function bonusLabel(b) {
    if (!b) return '';
    if (b.kind === 'estilo') return KD.estilo.find((s) => s.id === b.id).nome;
    if (b.kind === 'oc') return KD.ocupacoes.find((o) => o.id === b.id).nome;
    if (b.kind === 'tensao') return 'Tensão (Volta por Cima)';
    return '';
  }

  function rollPlan(c, r) {
    const base = c.atributos[r.attr] + r.adv;
    const extreme = base < 2;
    return { n6: Math.max(2, base), extreme, n10: r.sinc + r.free };
  }

  // ----- dados 3D (dice-box-threejs) -----
  // O resultado é sempre sorteado pelo gerador criptográfico acima; a biblioteca 3D só
  // anima os dados caindo exatamente nesses valores (notação "@" de resultado forçado).
  const dice3d = { box: null, loading: null, el: null, failed: false, sets: {} };
  // Skins no estilo do style guide: d6 = dados de atributo, d10 = sincronização.
  const SKINS = {
    karyu: { nome: 'Karyu', d6: { foreground: '#121212', background: '#FFFFFF', edge: '#121212' }, d10: { foreground: '#FFFFFF', background: '#A03422', edge: '#6E2920' } },
    aco: { nome: 'Aço', d6: { foreground: '#FFFFFF', background: '#121212', edge: '#3D3D3D' }, d10: { foreground: '#FFFFFF', background: '#CD3A29', edge: '#882F24' } },
    brasa: { nome: 'Brasa', d6: { foreground: '#FFFFFF', background: '#A03422', edge: '#6E2920' }, d10: { foreground: '#121212', background: '#EBAC86', edge: '#DB6134' } },
  };
  const skinId = () => (SKINS[store.settings.diceSkin] ? store.settings.diceSkin : 'karyu');
  async function colorSet(box, skin, type) {
    const key = `kd-${skin}-${type}`;
    if (!dice3d.sets[key]) {
      dice3d.sets[key] = await box.DiceColors.makeColorSet({ name: key, outline: 'none', texture: 'none', material: 'plastic', ...SKINS[skin][type] });
    }
    return dice3d.sets[key];
  }
  const reduceMotion = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const want3d = () => store.settings.dice3d !== false && !dice3d.failed && !reduceMotion();
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  function loadScript(src) {
    return new Promise((res, rej) => {
      const sc = document.createElement('script');
      sc.src = src; sc.onload = res; sc.onerror = () => rej(new Error('script'));
      document.head.appendChild(sc);
    });
  }
  function getDiceBox() {
    if (dice3d.box) return Promise.resolve(dice3d.box);
    if (!dice3d.loading) {
      dice3d.loading = (async () => {
        const el = document.createElement('div');
        el.className = 'dice3d';
        el.innerHTML = '<div class="dice3d-stage" id="dice3d-stage"></div><div class="dice3d-hint">toque para pular</div>';
        document.body.appendChild(el);
        dice3d.el = el;
        await loadScript('vendor/dice-box-threejs.umd.js');
        try { await document.fonts.load('40px "KD Dice"'); } catch (e) { /* usa a fonte padrão */ }
        const DiceBox = window['dice-box-threejs'];
        const box = new DiceBox('#dice3d-stage', {
          theme_customColorset: { name: 'kd-init', foreground: '#121212', background: '#FFFFFF', outline: 'none', texture: 'none', material: 'plastic' },
          color_spotlight: 0xffffff, sounds: false, shadows: true, light_intensity: 0.85, gravity_multiplier: 400, baseScale: 100, strength: 1.4,
        });
        await box.initialize();
        // Cada dado recebe as cores do seu tipo e os números na fonte do jogo.
        const F = box.DiceFactory;
        const create = F.create.bind(F);
        F.create = (type) => {
          const set = dice3d.sets[`kd-${skinId()}-${type === 'd10' ? 'd10' : 'd6'}`];
          if (set) F.applyColorSet(set);
          const def = F.get(type);
          if (def) def.font = "'KD Dice', 'Chakra Petch', sans-serif";
          return create(type);
        };
        dice3d.box = box;
        return box;
      })().catch((e) => { dice3d.failed = true; if (dice3d.el) dice3d.el.remove(); throw e; });
    }
    return dice3d.loading;
  }
  async function show3d(dice) {
    const box = await getDiceBox();
    await colorSet(box, skinId(), 'd6');
    await colorSet(box, skinId(), 'd10');
    const d6 = dice.filter((x) => x.t === 6).map((x) => x.v);
    const d10 = dice.filter((x) => x.t === 10).map((x) => x.v);
    const parts = [];
    if (d6.length) parts.push(`${d6.length}d6`);
    if (d10.length) parts.push(`${d10.length}d10`);
    const notation = `${parts.join('+')}@${[...d6, ...d10].join(',')}`;
    const el = dice3d.el;
    let skip;
    const skipped = new Promise((r) => { skip = r; });
    el.onclick = () => skip();
    el.classList.add('show');
    try {
      await Promise.race([box.roll(notation), skipped, wait(7000)]);
      await Promise.race([wait(900), skipped]);
    } finally {
      el.classList.remove('show');
      el.onclick = null;
      setTimeout(() => { try { box.clearDice(); } catch (e) { /* ok */ } }, 250);
    }
  }

  function doRoll() {
    const c = ch(), r = ui.roll;
    const p = rollPlan(c, r);
    const dice = [];
    for (let i = 0; i < p.n6; i++) dice.push({ v: d(6), t: 6 });
    for (let i = 0; i < p.n10; i++) dice.push({ v: d(10), t: 10 });
    const order = dice.map((x, i) => i).sort((a, b) => dice[b].v - dice[a].v || dice[a].t - dice[b].t);
    order.slice(0, 2).forEach((i) => { dice[i].sel = true; });
    const result = { dice, extreme: p.extreme, rolling: true };
    r.result = result;
    if (navigator.vibrate) navigator.vibrate(30);
    renderModal();
    const done = () => { result.rolling = false; if (ui.roll && ui.roll.result === result) renderModal(); };
    if (want3d()) {
      show3d(dice).catch(() => toast('Dados 3D indisponíveis neste aparelho — usando dados 2D.')).finally(done);
    } else setTimeout(done, 450);
  }

  function rollOutcome(c, r) {
    const D = derived(c);
    const res = r.result;
    const sel = res ? res.dice.filter((x) => x.sel) : [];
    const rest = res ? res.dice.filter((x) => !x.sel) : [];
    const bonus = bonusValue(c, r.bonus) + r.extra;
    const total = sum(sel.map((x) => x.v)) + bonus;
    const sincGain = rest.filter((x) => x.v >= 6).length;
    const lowTension = D.f.lucifer ? (x) => x.v <= 2 : (x) => x.v === 1;
    const tension = rest.filter(lowTension).length + (res && res.extreme ? 1 : 0);
    const alvo = r.alvo === '' ? null : num(r.alvo);
    const margin = alvo == null ? null : total - alvo;
    let tec = null;
    if (r.tecId) {
      const t = c.tecnicas.find((x) => x.id === r.tecId);
      const cost = Math.max(0, r.custo - (r.kiai ? 1 : 0));
      const usedSinc = r.sinc;
      const paid = Math.min(cost, usedSinc);
      const nagen = cost - paid;
      const after = c.estado.nagen + nagen;
      let loss = Math.max(0, after - D.canal) - Math.max(0, c.estado.nagen - D.canal);
      if (loss > 0 && D.f.jasq) loss += 1;
      const syncFx = cost > 0 && usedSinc >= 1 && paid >= cost && loss === 0;
      tec = { t, cost, paid, nagen, loss, syncFx, after };
    }
    return { sel, bonus, total, sincGain, tension, margin, alvo, tec, D };
  }

  function rollModal(c, D) {
    const r = ui.roll;
    const o = rollOutcome(c, r);
    const p = rollPlan(c, r);
    const t = o.tec && o.tec.t;
    const res = r.result;
    const attrChips = KD.atributos.map((a) => `<button class="chip" data-act="r-attr" data-v="${a.id}" aria-pressed="${r.attr === a.id}">${a.id} <b>${c.atributos[a.id]}</b></button>`).join('');
    const bonusOpts = [
      `<button class="chip" data-act="r-bonus" data-kind="" aria-pressed="${!r.bonus}">Nenhum</button>`,
      ...KD.estilo.map((s) => `<button class="chip" data-act="r-bonus" data-kind="estilo" data-id="${s.id}" aria-pressed="${r.bonus && r.bonus.kind === 'estilo' && r.bonus.id === s.id}">${s.nome} <b>+${c.estilo[s.id]}</b></button>`),
      ...KD.ocupacoes.filter((x) => c.ocupacoes[x.id].n > 0).map((x) => `<button class="chip" data-act="r-bonus" data-kind="oc" data-id="${x.id}" aria-pressed="${r.bonus && r.bonus.kind === 'oc' && r.bonus.id === x.id}">${x.nome} <b>+${c.ocupacoes[x.id].n}</b></button>`),
      ...(hasTrunfo(c, 'Volta por Cima') && c.estado.feri.some(Boolean) ? [`<button class="chip" data-act="r-bonus" data-kind="tensao" aria-pressed="${r.bonus && r.bonus.kind === 'tensao'}">Tensão <b>+${c.estado.tensao}</b></button>`] : []),
    ].join('');

    const setup = `
      ${t ? `<div class="tec"><div class="tec-head" style="cursor:default"><span class="nm"><span class="h3">${esc(t.nome)}</span>${t.ougi ? ' <span class="ougi">(Ougi)</span>' : ''}<div class="tags">${tags(t)}</div></span><span class="cost">${o.tec.cost}</span></div></div>
        <div class="split">
          <div class="ctl"><span>Custo base</span>${miniStep('r-num', 'data-k="custo"', r.custo, 0, 30)}</div>
          <div class="ctl"><label class="toggle">${chk(r.kiai, 'r-kiai', '', 'Kiai')} Kiai (−1)</label></div>
        </div>
        <label class="toggle">${chk(r.rolar, 'r-rolar', '', 'Rolar dados')} Rolar dados (ataque/defesa)</label>` : ''}
      ${r.rolar ? `
      <div><div class="group-label">Atributo</div><div class="chips">${attrChips}</div></div>
      <div><div class="group-label">Somar</div><div class="chips">${bonusOpts}</div></div>` : ''}
      <div class="split">
        ${r.rolar ? `<div class="ctl"><span>Vantagem<small>+/− dados</small></span>${miniStep('r-num', 'data-k="adv"', r.adv, -6, 6)}</div>` : ''}
        <div class="ctl"><span>Sincronização<small>${c.estado.sinc} disponível</small></span>${miniStep('r-num', 'data-k="sinc"', r.sinc, 0, c.estado.sinc)}</div>
        ${r.rolar ? `<div class="ctl"><span>Bônus extra</span>${miniStep('r-num', 'data-k="extra"', r.extra, -10, 20)}</div>
        <label class="ctl"><span>Limiar do alvo<small>opcional</small></span><input class="input" style="width:72px;text-align:center;padding:4px" inputmode="numeric" data-act-input="r-alvo" value="${esc(r.alvo)}" placeholder="—"></label>` : ''}
      </div>
      ${r.rolar ? `<div class="ctl" style="flex-wrap:wrap"><label class="toggle">${chk(store.settings.dice3d !== false && !dice3d.failed, 'dice3d', '', 'Dados 3D')} Dados 3D${dice3d.failed ? ' (indisponível)' : ''}</label>
        ${want3d() ? `<span class="chips">${Object.entries(SKINS).map(([k, v]) => `<button class="chip skin-chip" data-act="dice-skin" data-v="${k}" aria-pressed="${skinId() === k}" title="Skin ${v.nome}"><i style="background:${v.d6.background};border-color:${v.d6.edge}"></i><i style="background:${v.d10.background};border-color:${v.d10.edge};border-radius:50%"></i>${v.nome}</button>`).join('')}</span>` : ''}</div>` : ''}
      ${r.free ? `<div class="note good">Confiança: +${r.free} d10 grátis nesta jogada.</div>` : ''}
      ${r.rolar ? `<p class="caption" style="margin:0;text-align:center">Rola <b>${p.n6}d6</b>${p.n10 ? ` + <b>${p.n10}d10</b>` : ''}${o.bonus ? ` e soma <b>${o.bonus >= 0 ? '+' : ''}${o.bonus}</b>` : ''}${p.extreme ? ' · desvantagem extrema: rola 2 e a Tensão sobe 1' : ''}</p>` : ''}`;

    let result = '';
    if (res && res.rolling) {
      result = `<div class="dice">${res.dice.map((x) => `<span class="die ${x.t === 10 ? 'd10' : ''} rolling">${d(x.t)}</span>`).join('')}</div>
        <div class="verdict miss">Rolando...</div>`;
    } else if (res) {
      const notes = [];
      if (o.sincGain) notes.push(`<div class="note good">+${o.sincGain} dado${o.sincGain > 1 ? 's' : ''} de Sincronização (6+ fora do total).</div>`);
      if (o.tension) notes.push(`<div class="note bad">Tensão +${o.tension}${res.extreme ? ' (inclui desvantagem extrema)' : ''} — avise o narrador.</div>`);
      if (o.margin != null && o.margin >= 5) notes.push(`<div class="note good">Splash disponível! Margem ${o.margin}. Descarte 1 sinc. para Ataque Decisivo, Empecilho ou Ataque Total — ou ganhe 1 sinc.</div>`);
      result = `
        <div class="dice">${res.dice.map((x, i) => `<button class="die ${x.t === 10 ? 'd10' : ''} ${x.sel ? 'sel' : ''} ${x.v === 1 ? 'one' : ''} ${x.v >= 6 ? 'six' : ''} " data-act="r-die" data-i="${i}" aria-pressed="${!!x.sel}" aria-label="Dado ${x.v}">${x.v}</button>`).join('')}</div>
        <div class="total"><div class="big">${o.total}</div>
          <div class="calc">${o.sel.map((x) => x.v).join(' + ')}${r.bonus ? ` + ${bonusLabel(r.bonus)} ${bonusValue(c, r.bonus)}` : ''}${r.extra ? ` ${r.extra > 0 ? '+' : '−'} ${Math.abs(r.extra)}` : ''}</div>
          ${o.sel.length !== 2 ? '<div class="warn-text">Selecione exatamente 2 dados.</div>' : '<div class="hint">Toque nos dados para trocar quais entram no total.</div>'}</div>
        ${o.margin != null ? `<div class="verdict ${o.margin > 0 ? 'hit' : 'miss'}">${o.margin > 0 ? `Acertou! (+${o.margin})` : o.margin === 0 ? 'Empate — o alvo vence' : `Errou (${o.margin})`}</div>` : ''}
        <div class="notes">${notes.join('')}</div>`;
    }
    let tecNotes = '';
    if (o.tec) {
      const T = o.tec;
      tecNotes = `<div class="notes">
        <div class="note">Nagen: custo ${T.cost}${T.paid ? ` − ${T.paid} sinc.` : ''} = <b>${T.nagen}</b> · rodada ${c.estado.nagen} → ${T.after} / Limiar ${D.canal}</div>
        ${T.loss ? `<div class="note bad">Excede o Limiar de Canalização: perde ${T.loss} de Vigor.</div>` : ''}
        ${T.syncFx ? `<div class="note good"><span><b>Efeito de sincronização!</b> ${esc(T.t.sinc) || 'Veja o efeito na técnica.'}</span></div>` : (T.cost > 0 ? `<div class="hint">Pague todo o custo com sincronização (sem perder Vigor) para ativar o efeito de sincronização.</div>` : '')}
      </div>`;
    }
    const canApply = !r.rolar || (res && !res.rolling && o.sel.length === 2);
    return `<div class="overlay" data-act="overlay"><div class="sheet-modal" role="dialog" aria-label="Rolar dados">
      ${modalHead(t ? 'Usar técnica' : 'Rolar dados')}
      <div class="modal-body">${res && res.rolling ? result : res ? result + tecNotes + `<details><summary class="hint" style="cursor:pointer">Ajustar jogada</summary><div class="stack" style="margin-top:10px">${setup}</div></details>` : setup + tecNotes}</div>
      <div class="modal-foot">
        ${r.rolar ? `<button class="btn ${res ? 'light' : 'primary'}" data-act="r-roll">${I.dice} ${res ? 'Rolar de novo' : 'Rolar'}</button>` : ''}
        ${res || !r.rolar ? `<button class="btn primary" data-act="r-apply" ${canApply ? '' : 'disabled'}>Aplicar</button>` : ''}
      </div>
    </div></div>`;
  }

  function applyRoll() {
    const c = ch(), r = ui.roll;
    const o = rollOutcome(c, r);
    const msgs = [];
    c.estado.sinc = Math.max(0, c.estado.sinc - r.sinc) + (r.rolar ? o.sincGain : 0);
    if (r.free) ui.pendingD10 = 0;
    if (r.rolar && o.tension) { c.estado.tensao += o.tension; msgs.push(`Tensão +${o.tension}`); }
    if (r.rolar && o.sincGain) msgs.push(`+${o.sincGain} sinc.`);
    if (o.tec) {
      const s = spendNagen(c, o.tec.nagen);
      msgs.push(`${o.tec.t.nome}: ${o.tec.nagen} nagen`);
      if (s.loss) msgs.push(`−${s.loss} Vigor`);
      if (s.wound === 'ferido') msgs.push('Ferido!');
      if (s.wound === 'derrotado') msgs.push('Derrotado!');
    }
    save();
    closeModal();
    render();
    if (msgs.length) toast(msgs.join(' · '));
  }

  // ----- catálogos -----
  function catTecModal(c) {
    return `<div class="overlay" data-act="overlay"><div class="sheet-modal" role="dialog" aria-label="Adicionar técnica">
      ${modalHead('Adicionar técnica')}
      <div class="modal-body">
        <input class="input" type="search" placeholder="Buscar técnica..." data-act-input="cat-q" value="${esc(ui.catQuery)}" autocomplete="off">
        <div class="chips">${KD.tiposGolpe.map((x) => `<button class="chip" data-act="cat-tipo" data-v="${x}" aria-pressed="${ui.catTipo === x}">${x}</button>`).join('')}</div>
        <div class="chips">${KD.elementos.map((x) => `<button class="chip" data-act="cat-elem" data-v="${x}" aria-pressed="${ui.catElem === x}">${x}</button>`).join('')}
          <button class="chip" data-act="cat-elem" data-v="shintai" aria-pressed="${ui.catElem === 'shintai'}">Shintai</button>
          <button class="chip" data-act="cat-elem" data-v="ritual" aria-pressed="${ui.catElem === 'ritual'}">Ritual</button></div>
        <button class="btn dark" data-act="add-tec-custom">${I.add} Criar técnica personalizada</button>
        <div class="cat-list" id="cat-list">${catTecList(c)}</div>
      </div></div></div>`;
  }
  function catTecList(c) {
    const q = norm(ui.catQuery);
    const have = new Set(c.tecnicas.map((t) => norm(t.nome)));
    const list = TEC.filter((t) => (!q || norm(t.n + ' ' + t.s).includes(q))
      && (!ui.catTipo || t.t.includes(ui.catTipo))
      && (!ui.catElem || (ui.catElem === 'shintai' ? t.sh : ui.catElem === 'ritual' ? t.ri : t.e.includes(ui.catElem))));
    if (!list.length) return '<div class="empty">Nada encontrado.</div>';
    return list.map((t) => `<button class="cat-item ${have.has(norm(t.n)) ? 'has' : ''}" data-act="add-tec" data-n="${esc(t.n)}">
      <span style="flex:1;min-width:0"><div class="nm">${esc(t.n)}${have.has(norm(t.n)) ? ' ✓' : ''}</div><div class="s">${esc(t.s)}</div>
        ${t.r ? `<div class="s"><b>Req.:</b> ${esc(t.r)}</div>` : ''}
        ${t.t.length || t.e.length ? `<div class="tags">${[...t.t, ...t.e].map((x) => `<span class="tag">${esc(x)}</span>`).join('')}</div>` : ''}</span>
      <span class="c">${esc(t.c === '' ? '—' : t.c)}</span></button>`).join('');
  }
  function catTrunfoModal(c) {
    const have = new Set(c.trunfos.map((t) => norm(t.nome)));
    return `<div class="overlay" data-act="overlay"><div class="sheet-modal" role="dialog" aria-label="Adicionar trunfo">
      ${modalHead('Adicionar trunfo')}
      <div class="modal-body">
        <button class="btn dark" data-act="add-trunfo-custom">${I.add} Criar trunfo personalizado</button>
        <div class="cat-list">${KD.trunfos.map((t) => `<button class="cat-item ${have.has(norm(t.nome)) ? 'has' : ''}" data-act="add-trunfo" data-n="${esc(t.nome)}">
          <span><div class="nm">${esc(t.nome)}${have.has(norm(t.nome)) ? ' ✓' : ''}</div>${t.req ? `<div class="s"><b>Requisito:</b> ${esc(t.req)}</div>` : ''}<div class="s">${esc(t.desc)}</div></span></button>`).join('')}</div>
      </div></div></div>`;
  }

  // ---------- toast ----------
  let toastTimer = null;
  function toast(msg, undo) {
    const root = $('#toast-root');
    root.innerHTML = `<div class="toast" role="status"><span>${esc(msg)}</span>${undo ? '<button data-act="undo">Desfazer</button>' : ''}</div>`;
    ui.undo = undo || null;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { root.innerHTML = ''; ui.undo = null; }, undo ? 5000 : 2800);
  }
  $('#toast-root').addEventListener('click', (e) => {
    if (e.target.closest('[data-act="undo"]') && ui.undo) {
      ui.undo(); ui.undo = null; $('#toast-root').innerHTML = ''; save(); render();
    }
  });
  const snapshot = () => JSON.stringify(ch());
  const restoreFrom = (snap) => () => { const c = JSON.parse(snap); store.chars[c.id] = normalize(c); };

  // ---------- caminhos de dados ----------
  function getPath(o, path) { return path.split('.').reduce((a, k) => (a == null ? a : a[k]), o); }
  function setPath(o, path, v) {
    const ks = path.split('.'); const last = ks.pop();
    const t = ks.reduce((a, k) => a[k], o); t[last] = v;
  }
  function bindSet(key, value) {
    const c = ch();
    const [kind, id, field] = key.split(':');
    if (kind === 'trunfo') { const t = c.trunfos.find((x) => x.id === id); if (t) t[field] = value; }
    else if (kind === 'tec') {
      const t = c.tecnicas.find((x) => x.id === id);
      if (t) t[field] = field === 'custo' && /^\d+$/.test(value.trim()) ? parseInt(value, 10) : value;
    }
    else if (kind === 'laco') { const l = c.lacos.find((x) => x.id === id); if (l) l.t = value; }
    else if (kind === 'evento') { c.caminho.eventos[+id].t = value; }
    else if (kind === 'oc') { c.ocupacoes[id][field] = value; }
    else setPath(c, key, value);
  }

  // limites dos steppers
  function stepLimits(path, c, D) {
    if (path === 'aura') return [0, 10];
    if (path.startsWith('atributos.')) return [1, D.attrCap];
    if (path.startsWith('estilo.')) return [0, D.estiloCap];
    if (path.startsWith('ocupacoes.')) return [0, 3];
    if (path === 'estado.sinc' || path === 'estado.nagen' || path === 'estado.tensao' || path === 'estado.karma') return [0, 999];
    if (path === 'bonus.ferimentos') return [0, 10];
    return [-99, 99];
  }

  // ---------- eventos ----------
  document.addEventListener('click', (ev) => {
    const el = ev.target.closest('[data-act]');
    if (!el) return;
    const act = el.dataset.act;
    if (act === 'overlay' && ev.target !== el) return; // clique dentro do modal
    const c = ch();
    const D = derived(c);
    const id = el.dataset.id;
    const rerender = () => { save(); render(); };

    switch (act) {
      case 'overlay': case 'close': closeModal(); break;
      case 'mode':
        store.mode = el.dataset.v; save(); render();
        window.scrollTo({ top: 0 });
        break;
      case 'open-menu': openModal({ type: 'menu' }); break;
      case 'open-mesa': openModal({ type: 'mesa' }); break;
      case 'about': openModal({ type: 'about' }); break;

      case 'step': {
        const path = el.dataset.path;
        const [lo, hi] = stepLimits(path, c, D);
        const nv = clamp(num(getPath(c, path)) + num(el.dataset.d), lo, hi);
        setPath(c, path, nv);
        rerender();
        break;
      }
      case 'vigor': {
        const dlt = num(el.dataset.d);
        if (dlt < 0) {
          const snap = snapshot();
          const w = loseVigor(c, 1);
          if (w === 'ferido') toast('Vigor vazio — você ficou ferido!', restoreFrom(snap));
          if (w === 'derrotado') toast('Sem caixas de ferimento — derrotado!', restoreFrom(snap));
        } else c.estado.vigor = Math.min(D.vigorMax, c.estado.vigor + 1);
        rerender();
        break;
      }
      case 'feri': {
        const i = num(el.dataset.i);
        c.estado.feri[i] = !c.estado.feri[i];
        if (!c.estado.feri.some(Boolean)) c.estado.derrotado = false;
        rerender();
        break;
      }
      case 'evento': {
        const i = num(el.dataset.i);
        c.caminho.eventos[i].m = !c.caminho.eventos[i].m;
        rerender();
        break;
      }
      case 'rev': c.caminho.revM = !c.caminho.revM; rerender(); break;
      case 'laco': {
        const l = c.lacos.find((x) => x.id === id);
        if (!l) break;
        if (l.m) {
          const snap = snapshot();
          l.m = false; c.estado.sinc += 1;
          toast(`Laço invocado: +1 Sincronização (${l.t || 'laço'})`, restoreFrom(snap));
        } else l.m = true;
        rerender();
        break;
      }
      case 'more': ui.more[id] = !ui.more[id]; render(); break;
      case 'tec-toggle': ui.open[id] = !ui.open[id]; render(); break;

      // edição
      case 'add-evento': c.caminho.eventos.push({ t: '', m: false }); rerender(); break;
      case 'del-evento': c.caminho.eventos.splice(num(el.dataset.i), 1); rerender(); break;
      case 'add-laco': c.lacos.push({ id: uid(), t: '', m: false }); rerender(); setTimeout(() => { const ins = document.querySelectorAll('[data-bind^="laco:"]'); ins[ins.length - 1]?.focus(); }, 0); break;
      case 'del-laco': c.lacos = c.lacos.filter((x) => x.id !== id); rerender(); break;
      case 'del-trunfo': {
        const snap = snapshot();
        c.trunfos = c.trunfos.filter((x) => x.id !== id); rerender(); toast('Trunfo removido.', restoreFrom(snap));
        break;
      }
      case 'del-tec': {
        const snap = snapshot();
        c.tecnicas = c.tecnicas.filter((x) => x.id !== id); rerender(); toast('Técnica removida.', restoreFrom(snap));
        break;
      }
      case 'tec-move': {
        const i = c.tecnicas.findIndex((x) => x.id === id), j = i + num(el.dataset.d);
        if (j >= 0 && j < c.tecnicas.length) { const [t] = c.tecnicas.splice(i, 1); c.tecnicas.splice(j, 0, t); }
        rerender();
        break;
      }
      case 'tec-tag': {
        const t = c.tecnicas.find((x) => x.id === id), key = el.dataset.key, v = el.dataset.v;
        t[key] = t[key].includes(v) ? t[key].filter((x) => x !== v) : [...t[key], v];
        rerender();
        break;
      }
      case 'tec-upg': {
        const t = c.tecnicas.find((x) => x.id === id), v = el.dataset.v;
        t.upgrades = t.upgrades.includes(v) ? t.upgrades.filter((x) => x !== v) : [...t.upgrades, v];
        rerender();
        break;
      }
      case 'tec-ougi': { const t = c.tecnicas.find((x) => x.id === id); t.ougi = !t.ougi; rerender(); break; }
      case 'cat-tec': ui.catQuery = ''; ui.catTipo = null; ui.catElem = null; openModal({ type: 'cat-tec' }); break;
      case 'cat-tipo': ui.catTipo = ui.catTipo === el.dataset.v ? null : el.dataset.v; renderModal(); break;
      case 'cat-elem': ui.catElem = ui.catElem === el.dataset.v ? null : el.dataset.v; renderModal(); break;
      case 'add-tec': case 'add-tec-custom': {
        const t = act === 'add-tec' ? tecFromCatalog(el.dataset.n) : tecFromCatalog('', { nome: '' });
        c.tecnicas.push(t); ui.open[t.id] = true;
        closeModal(); rerender();
        toast(act === 'add-tec' ? `${t.nome} adicionada.` : 'Técnica criada — preencha os campos.');
        setTimeout(() => document.querySelector(`[data-bind="tec:${t.id}:nome"]`)?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 50);
        break;
      }
      case 'cat-trunfo': openModal({ type: 'cat-trunfo' }); break;
      case 'add-trunfo': case 'add-trunfo-custom': {
        const t = act === 'add-trunfo' ? trunfoFromCatalog(el.dataset.n) : { id: uid(), nome: '', req: '', desc: '' };
        c.trunfos.push(t);
        if (act === 'add-trunfo' && norm(t.nome) === 'incansavel') c.estado.vigor += 2;
        closeModal(); rerender();
        break;
      }

      // jogo
      case 'roll-free': openRoll(); break;
      case 'roll-attr': openRoll({ attr: el.dataset.attr }); break;
      case 'roll-estilo': {
        const sid = el.dataset.id;
        openRoll({ attr: sid === 'bloqueio' ? 'FOR' : 'AGI', bonus: { kind: 'estilo', id: sid } });
        break;
      }
      case 'roll-oc': openRoll({ attr: bestAttrFor(c), bonus: { kind: 'oc', id } }); break;
      case 'use-tec': openRoll({ tecId: id }); break;
      case 'acao': {
        const i = num(el.dataset.i);
        c.estado.acoes = i < c.estado.acoes ? i : i + 1;
        save(); render();
        break;
      }
      case 'nova-rodada': c.estado.nagen = 0; c.estado.acoes = 0; save(); closeModal(); render(); toast('Nova rodada: nagen e ações extras zerados.'); break;
      case 'nova-cena':
        openModal({
          type: 'confirm', title: 'Nova cena', ok: 'Começar cena',
          body: `<p style="margin:0">Vigor volta ao máximo (${D.vigorMax}), sincronização passa a <b>${D.sincCena}</b> (Aura${D.f.sinc ? ' e trunfos' : ''}), nagen e ações extras zeram.${D.f.jasq ? ' Jasq: perde 1 de Vigor.' : ''}</p><p class="hint">Ferimentos continuam marcados — remova com uma cena de recuperação, karma ou o poder da esperança.</p>`,
          onOk: () => {
            const e = c.estado;
            e.vigor = D.vigorMax; e.sinc = D.sincCena; e.nagen = 0; e.acoes = 0; e.derrotado = false;
            if (D.f.jasq) loseVigor(c, 1);
            ui.pendingD10 = 0;
            toast('Nova cena!');
          },
        });
        break;
      case 'fim-sessao': {
        const ev = c.caminho.eventos.filter((x) => x.m && x.t).length;
        const la = c.lacos.filter((x) => x.m).length;
        const rev = c.caminho.revM ? 2 : 0;
        const tot = ev + la + 1 + rev;
        openModal({
          type: 'confirm', title: 'Fim da sessão', ok: `Ganhar ${tot} karma`,
          body: `<div class="stack"><div class="kv"><span>Eventos do caminho marcados</span><b>${ev}</b></div><div class="kv"><span>Laços marcados</span><b>${la}</b></div>
            ${rev ? '<div class="kv"><span>Reviravolta (escolha um novo caminho)</span><b>2</b></div>' : ''}
            <div class="kv"><span>Participação na sessão</span><b>1</b></div><div class="kv" style="border-top:1px solid var(--steel-100);padding-top:8px"><span><b>Total</b></span><b>${tot}</b></div>
            <p class="hint" style="margin:0">As marcas de caminho e laços serão limpas e a Tensão volta a 2. Karma de aprendizado, tensão voluntária ou do leitor você ajusta na Mesa.</p></div>`,
          onOk: () => {
            c.estado.karma += tot;
            c.caminho.eventos.forEach((x) => { x.m = false; });
            c.lacos.forEach((x) => { x.m = false; });
            if (c.caminho.revM) { c.caminho.revM = false; toast(`+${tot} karma. Escolha um novo caminho em Editar!`); }
            else toast(`+${tot} karma!`);
            c.estado.tensao = 2;
          },
        });
        break;
      }
      case 'emocao': {
        const v = el.dataset.v;
        if (c.estado.sinc < 1) break;
        const snap = snapshot();
        c.estado.sinc -= 1;
        if (v === 'Esperança') {
          c.estado.feri = c.estado.feri.map(() => false); c.estado.derrotado = false; c.estado.vigor = D.vigorMax;
          toast('Esperança: ferimentos removidos e Vigor cheio!', restoreFrom(snap));
        } else if (v === 'Confiança') {
          ui.pendingD10 += 2; toast('Confiança: +2 d10 na próxima jogada.', restoreFrom(snap));
        } else toast(`${v} invocado(a)!`, restoreFrom(snap));
        save(); render();
        break;
      }
      case 'confirm-ok': {
        const m = ui.modal; closeModal(); if (m && m.onOk) m.onOk(); save(); render();
        break;
      }

      // rolagem
      case 'r-attr': ui.roll.attr = el.dataset.v; renderModal(); break;
      case 'r-bonus': ui.roll.bonus = el.dataset.kind ? { kind: el.dataset.kind, id: el.dataset.id } : null; renderModal(); break;
      case 'r-num': {
        const k = el.dataset.k, r = ui.roll;
        const lim = { custo: [0, 30], adv: [-6, 6], sinc: [0, c.estado.sinc], extra: [-10, 20] }[k];
        r[k] = clamp(r[k] + num(el.dataset.d), lim[0], lim[1]);
        renderModal();
        break;
      }
      case 'r-kiai': ui.roll.kiai = !ui.roll.kiai; renderModal(); break;
      case 'r-rolar': ui.roll.rolar = !ui.roll.rolar; ui.roll.result = null; renderModal(); break;
      case 'r-roll': if (!(ui.roll.result && ui.roll.result.rolling)) doRoll(); break;
      case 'dice-skin': store.settings.diceSkin = el.dataset.v; save(); renderModal(); break;
      case 'dice3d': store.settings.dice3d = store.settings.dice3d === false; save(); renderModal(); if (want3d()) getDiceBox().catch(() => {}); break;
      case 'r-die': {
        const res = ui.roll.result; if (!res || res.rolling) break;
        const dd = res.dice[num(el.dataset.i)];
        if (dd.sel) dd.sel = false;
        else {
          const sel = res.dice.filter((x) => x.sel);
          if (sel.length >= 2) { const lowest = sel.sort((a, b) => a.v - b.v)[0]; lowest.sel = false; }
          dd.sel = true;
        }
        renderModal();
        break;
      }
      case 'r-apply': applyRoll(); break;

      // fichas
      case 'pick-char': store.current = id; save(); closeModal(); render(); window.scrollTo({ top: 0 }); break;
      case 'new-char': {
        const n = normalize(blankChar());
        store.chars[n.id] = n; store.order.push(n.id); store.current = n.id; store.mode = 'edit';
        save(true); closeModal(); render(); window.scrollTo({ top: 0 });
        toast('Nova ficha criada. Comece pelo nome!');
        break;
      }
      case 'dup-char': {
        const n = normalize({ ...JSON.parse(JSON.stringify(c)), id: uid(), nome: `${c.nome || 'Ficha'} (cópia)` });
        store.chars[n.id] = n; store.order.push(n.id); store.current = n.id;
        save(true); closeModal(); render(); toast('Ficha duplicada.');
        break;
      }
      case 'export-char': exportChar(c); break;
      case 'import-char': $('#import-file')?.click(); break;
      case 'del-char':
        openModal({
          type: 'confirm', title: 'Excluir ficha', ok: 'Excluir',
          body: `<p style="margin:0">Excluir <b>${esc(c.nome) || 'esta ficha'}</b> deste aparelho? Exporte antes se quiser guardar uma cópia.</p>`,
          onOk: () => {
            delete store.chars[c.id];
            store.order = store.order.filter((x) => x !== c.id);
            if (!store.order.length) { const n = normalize(blankChar()); store.chars[n.id] = n; store.order.push(n.id); }
            store.current = store.order[0];
            save(true); toast('Ficha excluída.');
          },
        });
        break;
      case 'wake': toggleWake(); break;
      default: break;
    }
  });

  function bestAttrFor(c) {
    return Object.entries(c.atributos).sort((a, b) => b[1] - a[1])[0][0];
  }

  document.addEventListener('input', (ev) => {
    const el = ev.target;
    if (el.dataset.bind) { bindSet(el.dataset.bind, el.value); save(); return; }
    const a = el.dataset.actInput;
    if (a === 'r-alvo') { ui.roll.alvo = el.value.replace(/[^\d-]/g, ''); updateRollPreview(); }
    if (a === 'cat-q') { ui.catQuery = el.value; const l = $('#cat-list'); if (l) l.innerHTML = catTecList(ch()); }
  });
  // Atualiza o modal de rolagem sem perder o foco do campo "Limiar do alvo".
  function updateRollPreview() {
    if (!ui.roll || !ui.roll.result) return;
    renderModal();
    const inp = modalRoot.querySelector('[data-act-input="r-alvo"]');
    if (inp) { inp.focus(); const v = inp.value.length; inp.setSelectionRange(v, v); }
  }
  document.addEventListener('change', (ev) => {
    const el = ev.target;
    const c = ch();
    if (el.dataset.bind && el.hasAttribute('data-rerender')) { render(); return; }
    const a = el.dataset.actChange;
    if (a === 'estilo-modelo' && el.value !== '') {
      const s = KD.estilosExemplo[+el.value];
      c.estilo = { ...c.estilo, ...s.v, nome: s.nome };
      save(); render();
      toast(`Estilo ${s.nome} aplicado. Ougi sugerido: ${s.ougi}.`);
    }
    if (a === 'caminho-modelo') {
      if (el.value === '') return;
      const x = KD.caminhos[+el.value];
      c.caminho = { nome: x.nome, eventos: x.eventos.map((t) => ({ t, m: false })), rev: x.rev, revM: false };
      save(); render();
    }
    if (el.id === 'import-file' && el.files && el.files[0]) importChar(el.files[0]);
  });
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && ui.modal) closeModal();
  });

  // ---------- importar / exportar ----------
  function exportChar(c) {
    const data = JSON.stringify({ app: 'karyu-densetsu-ficha', version: 1, ficha: c }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const name = `${(c.nome || 'ficha').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'ficha'}.json`;
    const file = typeof File === 'function' ? new File([blob], name, { type: 'application/json' }) : null;
    if (file && navigator.canShare && navigator.canShare({ files: [file] }) && /Android|iPhone|iPad/i.test(navigator.userAgent)) {
      navigator.share({ files: [file], title: c.nome || 'Ficha' }).catch(() => download(blob, name));
    } else download(blob, name);
  }
  function download(blob, name) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    toast('Ficha exportada.');
  }
  function importChar(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        const raw = data.ficha || data;
        if (!raw || typeof raw !== 'object' || !raw.atributos) throw new Error('formato');
        const n = normalize({ ...raw, id: uid() });
        store.chars[n.id] = n; store.order.push(n.id); store.current = n.id;
        save(true); closeModal(); render(); toast(`${n.nome || 'Ficha'} importada.`);
      } catch (e) { toast('Arquivo inválido — use um .json exportado por este app.'); }
    };
    reader.readAsText(file);
  }

  // ---------- tela ligada ----------
  async function toggleWake() {
    try {
      if (ui.wake) { await ui.wake.release(); ui.wake = null; toast('A tela pode apagar normalmente.'); }
      else {
        ui.wake = await navigator.wakeLock.request('screen');
        ui.wake.addEventListener('release', () => { if (ui.wake && ui.wake.released) ui.wake = null; });
        toast('A tela vai ficar ligada enquanto o app estiver aberto.');
      }
    } catch (e) { toast('Não foi possível manter a tela ligada neste navegador.'); }
    renderModal();
  }
  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'visible' && ui.wake && ui.wake.released) {
      try { ui.wake = await navigator.wakeLock.request('screen'); } catch (e) { ui.wake = null; }
    }
  });

  // ---------- início ----------
  store = load();
  render();
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
})();
