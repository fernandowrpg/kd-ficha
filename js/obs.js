// Overlay da mesa para o OBS: mostra os protagonistas aceitos em tempo real.
// Lê salas/{id} e salas/{id}/painel (públicos para quem tem o código da mesa), sem login.
const P = new URLSearchParams(location.search);
const sala = (P.get('sala') || '').trim();
const layout = ['linha', 'coluna', 'compacto'].includes(P.get('layout')) ? P.get('layout') : 'linha';
const soJogador = P.get('jogador') || '';
const ocultar = new Set((P.get('ocultar') || '').split(',').map((x) => x.trim()).filter(Boolean));
const escala = Math.min(4, Math.max(0.25, parseFloat(P.get('escala')) || 1));

const root = document.getElementById('kd-overlay');
const html = document.documentElement;
html.dataset.tema = P.get('tema') === 'claro' ? 'claro' : 'escuro';
html.dataset.layout = layout;
if (P.get('fundo') === '1') html.classList.add('kd-fundo');
html.style.setProperty('--kd-escala', escala);
ocultar.forEach((x) => html.classList.add(`kd-sem-${x}`));

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const n = (v) => (Number.isFinite(+v) ? +v : 0);
function aviso(msg) {
  root.innerHTML = `<div class="kd-aviso">${esc(msg)}</div>`;
}

const cards = new Map(); // uid -> { el, ultimo }

function montar(uid) {
  const el = document.createElement('article');
  el.className = 'kd-card';
  el.dataset.uid = uid;
  el.innerHTML = `
    <header class="kd-head">
      <span class="kd-av"></span>
      <span class="kd-who"><span class="kd-nome"></span><span class="kd-jogador"></span></span>
      <span class="kd-aura"><small>Aura</small><b></b></span>
    </header>
    <div class="kd-body">
      <div class="kd-conceito"></div>
      <div class="kd-vigor"><span class="kd-fill"></span><span class="kd-txt"><small>Vigor</small><b></b></span></div>
      <div class="kd-feri"><small>Ferimentos</small><span class="kd-caixas"></span><b class="kd-derrotado">Derrotado</b></div>
      <div class="kd-stats">
        <span class="kd-stat" data-k="sinc"><small>Sinc.</small><b></b></span>
        <span class="kd-stat" data-k="nagen"><small>Nagen</small><b></b></span>
        <span class="kd-stat" data-k="acoes"><small>Ações</small><b></b></span>
        <span class="kd-stat" data-k="tensao"><small>Tensão</small><b></b></span>
      </div>
      <div class="kd-limiares"><span>Def <b data-k="defesa"></b></span><span>Prot <b data-k="protecao"></b></span><span>Canal <b data-k="canal"></b></span></div>
    </div>`;
  return el;
}

// Atualiza só o que mudou (a barra de Vigor anima e o cartão pisca ao perder Vigor).
function atualizar(item, r) {
  const el = item.el, q = (s) => el.querySelector(s);
  const ant = item.ultimo;
  const vmax = Math.max(0, n(r.vigorMax)), vig = Math.min(vmax, Math.max(0, n(r.vigor)));
  q('.kd-av').textContent = (String(r.nome || '?').trim()[0] || '?');
  q('.kd-nome').textContent = r.nome || 'Sem nome';
  q('.kd-jogador').textContent = r.jogador || '';
  q('.kd-aura b').textContent = n(r.aura);
  q('.kd-conceito').textContent = [r.conceito, r.estilo].filter(Boolean).join(' · ');
  q('.kd-fill').style.width = `${vmax ? (vig / vmax) * 100 : 0}%`;
  q('.kd-vigor b').textContent = `${vig}/${vmax}`;
  const feri = Array.isArray(r.feri) ? r.feri : [];
  q('.kd-caixas').innerHTML = feri.map((m) => `<i class="${m ? 'on' : ''}"></i>`).join('');
  el.classList.toggle('derrotado', !!r.derrotado);
  el.classList.toggle('ferido', feri.some(Boolean));
  q('[data-k="sinc"] b').textContent = n(r.sinc);
  q('[data-k="nagen"] b').textContent = `${n(r.nagen)}/${n(r.canal)}`;
  q('[data-k="nagen"]').classList.toggle('warn', n(r.nagen) > n(r.canal));
  q('[data-k="acoes"] b').textContent = `${n(r.acoes)}/${n(r.acoesMax)}`;
  q('[data-k="tensao"] b').textContent = n(r.tensao);
  q('b[data-k="defesa"]').textContent = n(r.defesa);
  q('b[data-k="protecao"]').textContent = n(r.protecao);
  q('b[data-k="canal"]').textContent = n(r.canal);
  if (ant && n(ant.vigor) !== vig) {
    const cls = vig < n(ant.vigor) ? 'kd-dano' : 'kd-cura';
    el.classList.remove('kd-dano', 'kd-cura');
    void el.offsetWidth; // reinicia a animação
    el.classList.add(cls);
  }
  item.ultimo = { ...r, vigor: vig };
}

function desenhar(lista) {
  const vis = lista
    .filter((r) => !soJogador || r.uid === soJogador)
    .sort((a, b) => String(a.nome || '').localeCompare(String(b.nome || '')));
  // Dados para quem quiser montar um overlay próprio com script.
  window.KD_MESA = { sala, jogadores: vis };
  window.dispatchEvent(new CustomEvent('kd-mesa', { detail: window.KD_MESA }));
  root.querySelector('.kd-aviso')?.remove();
  const vivos = new Set(vis.map((r) => r.uid));
  cards.forEach((item, uid) => { if (!vivos.has(uid)) { item.el.remove(); cards.delete(uid); } });
  vis.forEach((r, i) => {
    let item = cards.get(r.uid);
    if (!item) { item = { el: montar(r.uid), ultimo: null }; cards.set(r.uid, item); }
    atualizar(item, r);
    if (root.children[i] !== item.el) root.insertBefore(item.el, root.children[i] || null);
  });
  if (!vis.length && html.classList.contains('kd-fundo')) aviso('Aguardando jogadores na mesa…');
}

if (!/^[\w-]{6,64}$/.test(sala)) {
  aviso('Link do overlay sem o código da mesa. Copie o link pelo modo narrador do app.');
} else {
  import('./painel.js').then((m) => {
    m.ouvirSalaPublica(sala, (s) => {
      if (!s) { cards.forEach((x) => x.el.remove()); cards.clear(); aviso('Mesa não encontrada (pode ter sido excluída).'); }
      else document.title = `${s.nome} — Overlay Karyu Densetsu`;
    }, () => aviso('Sem acesso à mesa. Confira o link.'));
    m.ouvirPainel(sala, desenhar, () => aviso('Sem acesso aos jogadores da mesa.'));
  }).catch(() => aviso('Sem conexão com a nuvem. O overlay tenta de novo ao recarregar.'));
}
