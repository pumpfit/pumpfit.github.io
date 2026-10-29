// Entrada do app: rotas, layout (menu lateral no computador, abas no celular), eventos e tema.
import { subscribe, reset, get } from './store.js';
import { html, raw, ic, ui, toast, bus, virarLetreiros } from './ui.js';
import * as P from './personal.js';
import * as A from './aluno.js';
import * as L from './landing.js';
import * as C from './cadastro.js';

const app = document.getElementById('app');
const TEMA = 'app-personal:tema';

function aplicarTema(t) {
  document.documentElement.dataset.theme = t;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#FFC400');
}
let tema;
try { tema = localStorage.getItem(TEMA); } catch { /* sem armazenamento */ }
aplicarTema(tema || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'));

const acts = {
  ...P.acts,
  ...A.acts,
  ...C.acts,
  tema() {
    const t = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    aplicarTema(t);
    try { localStorage.setItem(TEMA, t); } catch { /* ignora */ }
    agendar();
  },
  resetar() {
    if (!confirm('Voltar todos os dados para o exemplo inicial?')) return;
    reset();
    toast('Dados de exemplo restaurados');
  }
};

const rota = () => {
  const [role = '', ...path] = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  return { role, path };
};

// Marca Pump (ver brand/index.html): código PMP de painel de partidas + quadrado laranja de "mudou".
const SIMBOLO = '<svg class="logo" viewBox="0 0 512 512" aria-hidden="true"><rect width="512" height="512" fill="#101215"/><g fill="none" stroke="#F2F2EE" stroke-width="40" stroke-linecap="square" transform="translate(-15 0)"><path d="M96 331V181H146Q186 181 186 221Q186 261 146 261H96"/><path d="M226 331V181L266 251L306 181V331"/><path d="M356 331V181H406Q446 181 446 221Q446 261 406 261H356"/></g><rect x="392" y="80" width="44" height="44" fill="#FF4D1F"/></svg>';
const LOGOTIPO = '<span class="wordmark">Pump</span>';
const marca = html`<a class="brand" href="#/" aria-label="Pump, página inicial">${raw(SIMBOLO)}${raw(LOGOTIPO)}</a>`;

function layout(role, itens, conteudo) {
  const quem = role === 'p' ? 'Personal · ' + (C.conta()?.nome || '[Nome do personal]') : 'Aluno · ' + (C.alunoConta()?.nome || 'Juliana Costa (exemplo)');
  const escuro = document.documentElement.dataset.theme !== 'light';
  const temaBtn = (cls) => html`<button type="button" class="${cls}" data-act="tema" aria-label="${escuro ? 'Usar tema claro' : 'Usar tema escuro'}">${ic(escuro ? 'sol' : 'lua', 18)}${cls.includes('icon') ? '' : (escuro ? 'Tema claro' : 'Tema escuro')}</button>`;
  const link = (i, cls = '') => html`<a href="${i.href}" class="${cls}" ${i.cur ? raw('aria-current="page"') : ''}>${ic(i.icon, 22)}<span>${i.label}</span>${i.dot ? html`<span class="dot" aria-label="Novidade"></span>` : ''}</a>`;
  return html`<div class="shell">
    <aside class="side" aria-label="Menu principal">
      ${marca}
      <nav class="nav">${itens.map(i => link(i))}</nav>
      <div class="side-foot">
        <span class="small muted">${quem}</span>
        ${temaBtn('btn sm')}
        <a class="btn sm" href="#/">${ic('sair', 16)}Trocar perfil</a>
      </div>
    </aside>
    <main class="main" id="conteudo">
      <div class="topbar">${marca}<span class="ph-actions">${temaBtn('btn icon sm')}<a class="btn icon sm" href="#/" aria-label="Trocar perfil">${ic('sair', 18)}</a></span></div>
      ${conteudo}
    </main>
    <nav class="tabs" aria-label="Navegação">${itens.filter(i => i.mobile !== false).map(i => link(i, 'tab'))}</nav>
  </div>`;
}

const landing = () => L.view({ marca, ui });

let desmontar = null;
let ultimo = null;
function render() {
  const r = rota();
  const chave = location.hash;
  const mudou = chave !== ultimo;
  ui.anim = mudou;
  if (mudou) {
    ui.slot = null; ui.biblio = false; ui.remarcar = null;
    if (r.role === 'p') P.aoEntrar?.(r);
    if (r.role === 'a') A.aoEntrar?.(r);
    if (r.role === 'convite') C.aoEntrarConvite(r.path[0]);
  }
  const ativo = document.activeElement;
  const foco = ativo?.id || null;
  const sel = foco && typeof ativo.selectionStart === 'number' ? [ativo.selectionStart, ativo.selectionEnd] : null;

  const out = r.role === 'p' ? layout('p', P.nav(r), P.view(r))
    : r.role === 'a' ? layout('a', A.nav(r), A.view(r))
    : r.role === 'cadastro' ? C.cadastroV({ marca, anim: mudou })
    : r.role === 'entrar' ? C.entrarV({ marca, anim: mudou })
    : r.role === 'convite' ? C.conviteV({ marca, anim: mudou })
    : landing();
  // Painel de partidas: guarda onde cada linha estava para ela deslizar até o novo lugar.
  const antes = new Map();
  if (!mudou) app.querySelectorAll('[data-flip]').forEach(el => antes.set(el.dataset.flip, { y: el.getBoundingClientRect().top, st: el.dataset.st }));
  const letreiros = new Map([...app.querySelectorAll('.sf[data-sf]')].map(el => [el.dataset.sf, el.dataset.v || '']));
  desmontar?.(); desmontar = null;
  app.innerHTML = out.__raw;
  if (!r.role) desmontar = L.mount(app);
  if (antes.size) reordenar(antes);
  virarLetreiros(app, letreiros, mudou);

  if (mudou) {
    ultimo = chave;
    window.scrollTo(0, 0);
    const h1 = app.querySelector('h1');
    document.title = (h1 && r.role ? h1.textContent.trim() + ' · ' : '') + 'Pump';
  }
  if (foco) {
    const el = document.getElementById(foco);
    if (el) {
      el.focus({ preventScroll: true });
      if (sel && el.setSelectionRange) try { el.setSelectionRange(sel[0], sel[1]); } catch { /* campo sem seleção */ }
    }
  }
  A.depoisDeRender?.();
}

const calmo = matchMedia('(prefers-reduced-motion: reduce)');
function reordenar(antes) {
  app.querySelectorAll('[data-flip]').forEach(el => {
    const a = antes.get(el.dataset.flip);
    if (!a) return;
    const st = el.querySelector('.st b');
    if (a.st !== el.dataset.st && st) st.classList.add('flap');
    const dy = a.y - el.getBoundingClientRect().top;
    if (!dy || calmo.matches || !el.animate) return;
    el.animate([{ transform: `translateY(${dy}px)` }, { transform: 'none' }], { duration: 460, easing: 'cubic-bezier(.2,.8,.2,1)' });
  });
}

let pendente = false;
function agendar() {
  if (pendente) return;
  pendente = true;
  // Junta todas as mudanças do mesmo clique num único redesenho (funciona até com a aba em segundo plano).
  queueMicrotask(() => { pendente = false; render(); });
}
bus.render = agendar;
subscribe(agendar);
window.addEventListener('hashchange', agendar);

app.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el || !app.contains(el)) return;
  const f = acts[el.dataset.act];
  if (!f) return;
  e.preventDefault();
  f(el.dataset, el, e);
});
app.addEventListener('input', e => {
  const el = e.target.closest('[data-in]');
  if (el) acts[el.dataset.in]?.(el.value, el);
});
app.addEventListener('submit', e => {
  const el = e.target.closest('form[data-submit]');
  if (!el) return;
  e.preventDefault();
  acts[el.dataset.submit]?.(new FormData(el), el);
});
// Treino em tela cheia: deslizar para cima passa ao próximo exercício quando o atual terminou.
let toque = null;
app.addEventListener('touchstart', e => {
  const el = e.target.closest('[data-swipe]');
  toque = el && !e.target.closest('button, input') ? { y: e.touches[0].clientY, el } : null;
}, { passive: true });
app.addEventListener('touchend', e => {
  if (!toque) return;
  const dy = e.changedTouches[0].clientY - toque.y;
  const { el } = toque;
  toque = null;
  if (dy < -70 && el.dataset.pode === '1') acts[el.dataset.swipe]?.(el.dataset, el, e);
}, { passive: true });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && (ui.slot || ui.biblio || ui.remarcar != null)) {
    ui.slot = null; ui.biblio = false; ui.remarcar = null;
    agendar();
  }
});

render();
C.conferirConta();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => { /* sem modo offline */ }));
}
window.__app = { get };
