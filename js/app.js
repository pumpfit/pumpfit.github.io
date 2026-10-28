// Entrada do app: rotas, layout (menu lateral no computador, abas no celular), eventos e tema.
import { subscribe, reset, get } from './store.js';
import { html, raw, ic, ui, toast, bus } from './ui.js';
import * as P from './personal.js';
import * as A from './aluno.js';
import * as L from './landing.js';
import * as C from './cadastro.js';

const app = document.getElementById('app');
const TEMA = 'app-personal:tema';

function aplicarTema(t) {
  document.documentElement.dataset.theme = t;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', t === 'light' ? '#F5F5F2' : '#0B0B0C');
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

// Marca Pump (ver brand/index.html): símbolo de batimento + logotipo PUMP pesado e inclinado.
const SIMBOLO = '<svg class="logo" viewBox="0 0 512 512" aria-hidden="true"><rect class="logo-bg" width="512" height="512" rx="112"/><path d="M84 280H178L210 224L250 344L300 132L346 308L372 280H428" transform="translate(256 256) skewX(-12) translate(-256 -256)" fill="none" stroke="#D4FF3A" stroke-width="44" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const LOGOTIPO = '<svg class="wordmark" viewBox="0 0 800 200" aria-hidden="true"><g transform="translate(46 0) skewX(-12)" fill="currentColor"><path fill-rule="evenodd" d="M0 0H112Q160 0 160 48V84Q160 132 112 132H56V200H0Z M56 46H104V86H56Z"/><path fill="#D4FF3A" d="M56 46H104V86H56Z"/><path transform="translate(184 0)" d="M0 0H56V140Q56 150 66 150H94Q104 150 104 140V0H160V148Q160 200 108 200H52Q0 200 0 148Z"/><path transform="translate(368 0)" d="M0 200V0H60L100 70L140 0H200V200H146V96L114 150H86L54 96V200Z"/><path fill-rule="evenodd" transform="translate(592 0)" d="M0 0H112Q160 0 160 48V84Q160 132 112 132H56V200H0Z M56 46H104V86H56Z"/></g></svg>';
const PULSO = '<svg class="pulse" viewBox="0 0 1100 56" preserveAspectRatio="none" aria-hidden="true"><path d="M0 28H430l18-22 26 44 26-44 18 22H1100"/></svg>';
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
  desmontar?.(); desmontar = null;
  app.innerHTML = out.__raw;
  if (!r.role) desmontar = L.mount(app);

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
