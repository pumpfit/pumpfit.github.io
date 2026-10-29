// Cadastro do treinador e possíveis clientes, gravados no banco de dados (SQLite) pela API /api.
import { html, raw, ic, toast, bus } from './ui.js';
import { apiLocal } from './local.js';

const redraw = () => bus.render();

// A sessão fica num cookie que o JavaScript não lê; aqui guardamos só os dados públicos da conta, na memória.
let sessao = null;
export const conta = () => (sessao && sessao.tipo !== 'aluno' ? sessao : null);   // personal logado
export const alunoConta = () => (sessao && sessao.tipo === 'aluno' ? sessao : null); // aluno logado
const salvarConta = c => { sessao = c; };
try { localStorage.removeItem('pump:conta'); } catch { /* versão antiga guardava aqui */ }

async function apiServidor(metodo, url, corpo) {
  const r = await fetch(url, {
    method: metodo,
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: corpo ? JSON.stringify(corpo) : undefined
  });
  const dados = r.status === 204 ? null : await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error('api'), { status: r.status, dados });
  return dados;
}

// Ao abrir o app, pergunta ao servidor se há uma sessão ativa.
// Sem servidor (ex.: link público no GitHub Pages), a conta passa a ser guardada neste aparelho (local.js).
let semServidor = false, checagem = null;
export const modoLocal = () => semServidor;
export function conferirConta() {
  return checagem ||= (async () => {
    try { const t = await apiServidor('GET', '/api/sessao'); salvarConta(t && t.id ? t : null); }
    catch (e) {
      salvarConta(null);
      if (!e.status || e.status === 404 || e.status === 405) {
        semServidor = true;
        try { const t = await apiLocal('GET', '/api/sessao'); salvarConta(t && t.id ? t : null); } catch { /* sem conta */ }
      }
    }
    redraw();
  })();
}
async function api(metodo, url, corpo) {
  await conferirConta();
  return semServidor ? apiLocal(metodo, url, corpo) : apiServidor(metodo, url, corpo);
}
const avisoLocal = () => semServidor ? html`<p class="small muted aviso-local">Link público: sua conta fica guardada só neste aparelho, com a senha protegida. Para usar em vários aparelhos, falta ligar o servidor.</p>` : '';
/* ---------- máscaras (formatam enquanto digita, sem redesenhar a tela) ---------- */
const dig = v => v.replace(/\D/g, '');
const mTel = v => { const d = dig(v).slice(0, 11); return d.length <= 2 ? d.replace(/^(\d{0,2})/, d ? '($1' : '') : d.length <= 6 ? `(${d.slice(0, 2)}) ${d.slice(2)}` : d.length <= 10 ? `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}` : `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`; };
const mCpf = v => { const d = dig(v).slice(0, 11); return d.replace(/^(\d{3})(\d)/, '$1.$2').replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d{1,2})$/, '.$1-$2'); };
function cpfOk(c) {
  c = dig(c);
  if (c.length !== 11 || /^(\d)\1+$/.test(c)) return false;
  for (const n of [9, 10]) {
    let s = 0; for (let i = 0; i < n; i++) s += +c[i] * (n + 1 - i);
    if ((s * 10) % 11 % 10 !== +c[n]) return false;
  }
  return true;
}

// Medidor de força da senha (a regra final é conferida de novo no servidor).
function forcaSenha(v) {
  if (!v || v.length < 8) return { nivel: v ? 1 : 0, texto: 'Curta demais: use pelo menos 8 caracteres.', erro: 'A senha precisa ter pelo menos 8 caracteres.' };
  if (!/[A-Za-zÀ-ÿ]/.test(v) || !/\d/.test(v)) return { nivel: 1, texto: 'Misture letras e números.', erro: 'Use letras e números na senha.' };
  let n = 2;
  if (v.length >= 12) n++;
  if (/[A-Z]/.test(v) && /[a-z]/.test(v) && /[^A-Za-z0-9]/.test(v)) n++;
  return { nivel: Math.min(4, n), texto: ['', '', 'Razoável', 'Boa', 'Forte'][Math.min(4, n)] };
}

/* ---------- estado da tela ---------- */
const st = { form: {}, erros: {}, lform: {}, lerros: {}, ver: false, enviando: false, clientes: null, carregando: false, falha: false, filtro: 'todos', novo: false, cform: {}, cerros: {} };
const STATUS = { interessado: ['Interessado', ''], experimental: ['Aula experimental', 'info'], aluno: ['Virou aluno', 'ok'], desistiu: ['Desistiu', 'warn'] };
const OBJETIVOS = ['Emagrecer', 'Ganhar massa', 'Condicionamento', 'Saúde e postura', 'Definição', 'Outro'];

const campo = ({ id, nome, rotulo, tipo = 'text', valor = '', erro, extra = '', dica = '' }) => html`<div class="fld">
  <label for="${id}">${rotulo}</label>
  <input id="${id}" name="${nome}" type="${tipo}" value="${valor}" ${raw(extra)} ${erro ? raw(`aria-invalid="true" aria-describedby="${id}-e"`) : ''}>
  ${erro ? html`<p class="fld-e" id="${id}-e">${erro}</p>` : dica ? html`<p class="fld-d">${dica}</p>` : ''}
</div>`;

/* ---------- Cadastro do treinador ---------- */
export function cadastroV({ marca, anim }) {
  const c = conta();
  const f = st.form, e = st.erros;
  return html`<div class="cad">
    <header class="lp-nav">${marca}<a class="btn sm" href="#/">Voltar</a></header>
    <main class="cad-main ${anim ? 'enter' : ''}">
      <div class="cad-intro">
        <span class="pill ok" style="align-self:flex-start">Conta de treinador</span>
        <h1>Crie sua conta no Pump</h1>
        <p class="muted">Seus dados ficam no banco de dados do Pump. O CPF é usado só para identificar você e aparece sempre mascarado.</p>
        ${avisoLocal()}
      </div>
      ${c ? html`<section class="card cad-card">
          <h2>Você já tem cadastro</h2>
          <dl class="cad-dl"><dt>Nome</dt><dd>${c.nome}</dd><dt>E-mail</dt><dd>${c.email}</dd><dt>Telefone</dt><dd>${c.telefone || '—'}</dd><dt>CPF</dt><dd>${c.cpf || '—'}</dd></dl>
          <div class="ph-actions"><a class="btn p" href="#/p/clientes">Ir para meus clientes</a><button type="button" class="btn" data-act="sairConta">Sair</button></div>
        </section>`
      : html`<form class="card cad-card" data-submit="cadastrar" novalidate>
          ${campo({ id: 'c-nome', nome: 'nome', rotulo: 'Nome completo', valor: f.nome, erro: e.nome, extra: 'autocomplete="name" required' })}
          ${campo({ id: 'c-email', nome: 'email', rotulo: 'E-mail', tipo: 'email', valor: f.email, erro: e.email, extra: 'autocomplete="email" inputmode="email" required' })}
          ${campo({ id: 'c-tel', nome: 'telefone', rotulo: 'Telefone (WhatsApp)', tipo: 'tel', valor: f.telefone, erro: e.telefone, extra: 'autocomplete="tel-national" inputmode="tel" data-in="mTel" placeholder="(11) 98765-4321" required' })}
          ${campo({ id: 'c-cpf', nome: 'cpf', rotulo: 'CPF', valor: f.cpf, erro: e.cpf, extra: 'autocomplete="off" inputmode="numeric" data-in="mCpf" placeholder="000.000.000-00" required', dica: 'Conferimos se o número é válido antes de salvar.' })}
          <div class="fld"><label for="c-senha">Senha</label>
            <div class="pw"><input id="c-senha" name="senha" type="${st.ver ? 'text' : 'password'}" autocomplete="new-password" minlength="8" maxlength="128" data-in="forca" required ${e.senha ? raw('aria-invalid="true" aria-describedby="c-senha-e"') : raw('aria-describedby="c-forca"')}><button type="button" class="pw-ver" data-act="verSenha" aria-label="${st.ver ? 'Esconder senha' : 'Mostrar senha'}">${st.ver ? 'Esconder' : 'Mostrar'}</button></div>
            <div class="forca" id="c-forca" aria-live="polite"><i></i><i></i><i></i><i></i><span>Mínimo 8 caracteres, com letras e números.</span></div>
            ${e.senha ? html`<p class="fld-e" id="c-senha-e">${e.senha}</p>` : ''}
          </div>
          ${campo({ id: 'c-conf', nome: 'confirmacao', rotulo: 'Confirmar senha', tipo: st.ver ? 'text' : 'password', erro: e.confirmacao, extra: 'autocomplete="new-password" maxlength="128" required' })}
          <p class="fld-d">Sua senha nunca é guardada: o banco guarda só uma impressão embaralhada dela, impossível de reverter.</p>
          <label class="chk"><input type="checkbox" name="aceite" ${f.aceite ? raw('checked') : ''} ${e.aceite ? raw('aria-invalid="true"') : ''}><span>Li e aceito os termos de uso e a política de privacidade do Pump.</span></label>
          ${e.aceite ? html`<p class="fld-e">${e.aceite}</p>` : ''}
          ${e.geral ? html`<p class="fld-e" role="alert">${e.geral}</p>` : ''}
          <button class="btn p lg block" type="submit" ${st.enviando ? raw('disabled') : ''}>${st.enviando ? 'Salvando…' : 'Criar minha conta'}</button>
          <p class="small muted" style="text-align:center">Já tem conta? <a class="lp-link" href="#/entrar">Entrar</a></p>
        </form>`}
    </main>
  </div>`;
}

/* ---------- Entrar ---------- */
export function entrarV({ marca, anim }) {
  const f = st.lform, e = st.lerros, aluno = st.tipoLogin === 'aluno';
  return html`<div class="cad">
    <header class="lp-nav">${marca}<a class="btn sm" href="#/">Voltar</a></header>
    <main class="cad-main ${anim ? 'enter' : ''}">
      <div class="cad-intro"><h1>Entrar no Pump</h1><p class="muted">${aluno ? 'Use o e-mail e a senha que você criou pelo convite do seu personal.' : 'Use o e-mail e a senha da sua conta de treinador.'}</p>${avisoLocal()}</div>
      ${sessao ? html`<section class="card cad-card"><h2>Você já está conectado</h2><p class="muted">${sessao.nome} · ${sessao.tipo === 'aluno' ? 'aluno' : 'personal'}</p><div class="ph-actions"><a class="btn p" href="${sessao.tipo === 'aluno' ? '#/a/inicio' : '#/p/clientes'}">Continuar</a><button type="button" class="btn" data-act="sairConta">Sair</button></div></section>`
      : html`<div class="seg grid g2" role="group" aria-label="Tipo de conta">
          <button type="button" class="segbtn" aria-pressed="${!aluno}" data-act="tipoLogin" data-v="treinador"><strong>Sou personal</strong><span class="muted small">Conta de treinador</span></button>
          <button type="button" class="segbtn" aria-pressed="${aluno}" data-act="tipoLogin" data-v="aluno"><strong>Sou aluno</strong><span class="muted small">Acesso por convite</span></button>
        </div>
        <form class="card cad-card" data-submit="entrar" novalidate>
        ${campo({ id: 'l-email', nome: 'email', rotulo: 'E-mail', tipo: 'email', valor: f.email, extra: 'autocomplete="username" inputmode="email" required' })}
        <div class="fld"><label for="l-senha">Senha</label><div class="pw"><input id="l-senha" name="senha" type="${st.ver ? 'text' : 'password'}" autocomplete="current-password" maxlength="128" required><button type="button" class="pw-ver" data-act="verSenha" aria-label="${st.ver ? 'Esconder senha' : 'Mostrar senha'}">${st.ver ? 'Esconder' : 'Mostrar'}</button></div></div>
        ${e.geral ? html`<p class="fld-e" role="alert">${e.geral}</p>` : ''}
        <button class="btn p lg block" type="submit" ${st.enviando ? raw('disabled') : ''}>${st.enviando ? 'Entrando…' : 'Entrar'}</button>
        <p class="small muted" style="text-align:center">${aluno ? 'Ainda não tem acesso? Peça o link de convite ao seu personal.' : raw('Ainda não tem conta? <a class="lp-link" href="#/cadastro">Criar conta</a>')}</p>
      </form>`}
    </main>
  </div>`;
}

/* ---------- Convite do aluno: criar a senha ---------- */
const cv = { token: null, dados: null, erro: null, carregando: false, erros: {}, aceite: false };
export function aoEntrarConvite(token) {
  if (cv.token === token) return;
  Object.assign(cv, { token, dados: null, erro: null, erros: {}, aceite: false, carregando: true });
  api('GET', `/api/convite/${encodeURIComponent(token)}`)
    .then(d => { cv.dados = d; })
    .catch(e => { cv.erro = e.status === 404 && e.dados?.erro ? e.dados.erro : 'Não foi possível abrir o convite.' })
    .finally(() => { cv.carregando = false; redraw(); });
}
export function conviteV({ marca, anim }) {
  const e = cv.erros;
  return html`<div class="cad">
    <header class="lp-nav">${marca}<a class="btn sm" href="#/">Início</a></header>
    <main class="cad-main ${anim ? 'enter' : ''}">
      ${cv.carregando ? html`<div class="card muted">Abrindo seu convite…</div>`
      : cv.erro ? html`<div class="cad-intro"><h1>Convite indisponível</h1><p class="muted">${cv.erro} Peça um link novo ao seu personal.</p><a class="btn" href="#/entrar" style="align-self:flex-start">Já tenho senha</a></div>`
      : cv.dados ? html`<div class="cad-intro">
          <span class="pill ok" style="align-self:flex-start">Convite do seu personal</span>
          <h1>Olá, ${cv.dados.nome.split(' ')[0]}!</h1>
          <p class="muted">${cv.dados.treinador} convidou você para treinar com o Pump. Crie sua senha para entrar.</p>
        </div>
        <form class="card cad-card" data-submit="aceitarConvite" novalidate>
          <div class="fld"><label>E-mail</label><input value="${cv.dados.email}" disabled autocomplete="username"></div>
          <div class="fld"><label for="v-senha">Crie sua senha</label>
            <div class="pw"><input id="v-senha" name="senha" type="${st.ver ? 'text' : 'password'}" autocomplete="new-password" minlength="8" maxlength="128" data-in="forca" required ${e.senha ? raw('aria-invalid="true"') : ''}><button type="button" class="pw-ver" data-act="verSenha" aria-label="${st.ver ? 'Esconder senha' : 'Mostrar senha'}">${st.ver ? 'Esconder' : 'Mostrar'}</button></div>
            <div class="forca" aria-live="polite"><i></i><i></i><i></i><i></i><span>Mínimo 8 caracteres, com letras e números.</span></div>
            ${e.senha ? html`<p class="fld-e">${e.senha}</p>` : ''}
          </div>
          ${campo({ id: 'v-conf', nome: 'confirmacao', rotulo: 'Confirmar senha', tipo: st.ver ? 'text' : 'password', erro: e.confirmacao, extra: 'autocomplete="new-password" maxlength="128" required' })}
          <p class="fld-d">Sua senha nunca é guardada: o banco guarda só uma impressão embaralhada dela, impossível de reverter.</p>
          <label class="chk"><input type="checkbox" name="aceite" ${cv.aceite ? raw('checked') : ''}><span>Li e aceito os termos de uso e a política de privacidade do Pump, inclusive o uso dos meus dados de treino e saúde pelo meu personal.</span></label>
          ${e.aceite ? html`<p class="fld-e">${e.aceite}</p>` : ''}
          ${e.geral ? html`<p class="fld-e" role="alert">${e.geral}</p>` : ''}
          <button class="btn p lg block" type="submit" ${st.enviando ? raw('disabled') : ''}>${st.enviando ? 'Criando…' : 'Criar senha e entrar'}</button>
        </form>` : ''}
    </main>
  </div>`;
}

/* ---------- Acesso dos alunos (o personal convida) ---------- */
const ac = { lista: null, carregando: false, falha: false, form: {}, erros: {}, novo: false, link: null };
const linkConvite = token => `${location.origin}${location.pathname}#/convite/${token}`;
export function aoEntrarAcessos() { ac.lista = null; ac.link = null; carregarAcessos(); }
async function carregarAcessos() {
  await conferirConta();
  if (!conta() || ac.carregando) return;
  ac.carregando = true; redraw();
  try { ac.lista = await api('GET', '/api/alunos'); ac.falha = false; } catch { ac.falha = true; }
  ac.carregando = false; redraw();
}
export function acessosV({ anim }) {
  const c = conta();
  if (!c) return html`<div class="page ${anim ? 'enter' : ''}"><header class="ph"><div><h1>Acesso dos alunos</h1><p class="meta">Banco de dados</p></div></header>
    <section class="card"><h2>Entre na sua conta de personal</h2><p class="muted" style="margin:6px 0 14px">Só você convida e vê os seus alunos.</p><div class="ph-actions"><a class="btn p" href="#/entrar">Entrar</a><a class="btn" href="#/cadastro">Criar conta</a></div></section></div>`;
  const lista = ac.lista || [], f = ac.form, e = ac.erros;
  const ativos = lista.filter(a => a.ativo).length;
  return html`<div class="page ${anim ? 'enter' : ''}">
    <header class="ph"><div><h1>Acesso dos alunos</h1><p class="meta">${c.nome} · ${ativos} ativos · ${lista.length - ativos} convites pendentes</p></div>
      <button type="button" class="btn p" data-act="novoAcesso" aria-expanded="${ac.novo}">${ic(ac.novo ? 'x' : 'mais', 18)}${ac.novo ? 'Fechar' : 'Convidar aluno'}</button></header>
    <p class="muted" style="max-width:640px">Cadastre o aluno e envie o link pelo WhatsApp. Ele abre, cria a própria senha e passa a entrar no app. O link vale 7 dias e funciona uma vez só.</p>
    ${semServidor ? html`<p class="small muted aviso-local">Link público: o convite só abre neste mesmo aparelho, porque os dados ficam guardados aqui. Para o aluno abrir no celular dele, falta ligar o servidor.</p>` : ''}

    ${ac.link ? html`<section class="card enter" style="border-color:var(--a-line);display:flex;flex-direction:column;gap:12px">
      <h2>Convite de ${ac.link.nome} pronto</h2>
      <div class="field" style="font-size:13px;overflow-wrap:anywhere;color:var(--tx)">${ac.link.url}</div>
      <div class="ph-actions"><button type="button" class="btn p" data-act="copiarLink">Copiar link</button><a class="btn" target="_blank" rel="noopener" href="https://wa.me/${ac.link.whats}?text=${encodeURIComponent(`Olá, ${ac.link.nome.split(' ')[0]}! Seu acesso ao Pump está pronto. Crie sua senha neste link: ${ac.link.url}`)}">Enviar no WhatsApp</a></div>
      <p class="small muted">Por segurança, este link aparece só agora. Se perder, gere um novo.</p>
    </section>` : ''}

    ${ac.novo ? html`<form class="card cad-card enter" data-submit="salvarAcesso" novalidate style="max-width:none">
      <div class="grid md-g3">
        ${campo({ id: 'a-nome', nome: 'nome', rotulo: 'Nome do aluno', valor: f.nome, erro: e.nome, extra: 'autocomplete="off" required' })}
        ${campo({ id: 'a-email', nome: 'email', rotulo: 'E-mail do aluno', tipo: 'email', valor: f.email, erro: e.email, extra: 'inputmode="email" autocomplete="off" required' })}
        ${campo({ id: 'a-tel', nome: 'telefone', rotulo: 'Telefone (WhatsApp)', tipo: 'tel', valor: f.telefone, erro: e.telefone, extra: 'inputmode="tel" data-in="mTel" placeholder="(11) 98765-4321" required' })}
      </div>
      ${e.geral ? html`<p class="fld-e" role="alert">${e.geral}</p>` : ''}
      <button class="btn p" type="submit" style="align-self:flex-start" ${st.enviando ? raw('disabled') : ''}>${st.enviando ? 'Gerando…' : 'Gerar link de convite'}</button>
    </form>` : ''}

    ${ac.carregando && !ac.lista ? html`<div class="card muted">Carregando do banco…</div>`
      : ac.falha ? html`<div class="card muted">Não foi possível falar com o banco. O servidor está ligado?</div>`
      : !lista.length ? html`<div class="card muted" style="text-align:center">Nenhum aluno convidado ainda. Toque em "Convidar aluno".</div>`
      : html`<div class="grid lg-g2">${lista.map(a => html`<article class="card" style="display:flex;flex-direction:column;gap:12px;padding:16px">
          <div style="display:flex;align-items:center;gap:12px"><span class="av">${a.nome.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()}</span>
            <div style="flex:1;min-width:0"><strong>${a.nome}</strong><div class="small muted">${a.email} · ${a.telefone}</div></div>
            <span class="pill ${a.ativo ? 'ok' : 'warn'}">${a.ativo ? 'Ativo no app' : 'Convite pendente'}</span></div>
          <div class="ph-actions">${a.ativo ? '' : html`<button type="button" class="btn sm" data-act="novoLink" data-id="${a.id}">Gerar novo link</button>`}<button type="button" class="btn sm warn" data-act="excluirAcesso" data-id="${a.id}" data-n="${a.nome}">Remover acesso</button></div>
        </article>`)}</div>`}
  </div>`;
}

/* ---------- Possíveis clientes ---------- */
export function aoEntrarClientes() {
  st.clientes = null; st.falha = false;
  carregar();
}
async function carregar() {
  await conferirConta();
  if (!conta() || st.carregando) return;
  st.carregando = true; redraw();
  try { st.clientes = await api('GET', '/api/clientes'); st.falha = false; }
  catch (e) { st.falha = true; if (e.status === 401) salvarConta(null); }
  st.carregando = false; redraw();
}

export function clientesV({ anim }) {
  const c = conta();
  if (!c) return html`<div class="page ${anim ? 'enter' : ''}"><header class="ph"><div><h1>Possíveis clientes</h1><p class="meta">Banco de dados</p></div></header>
    <section class="card"><h2>Entre na sua conta</h2><p class="muted" style="margin:6px 0 14px">Os possíveis clientes ficam ligados ao seu cadastro e só você vê.</p><div class="ph-actions"><a class="btn p" href="#/entrar">Entrar</a><a class="btn" href="#/cadastro">Criar conta</a></div></section></div>`;
  const lista = st.clientes || [];
  const cont = s => lista.filter(x => x.status === s).length;
  const vis = st.filtro === 'todos' ? lista : lista.filter(x => x.status === st.filtro);
  const f = st.cform, e = st.cerros;
  return html`<div class="page ${anim ? 'enter' : ''}">
    <header class="ph"><div><h1>Possíveis clientes</h1><p class="meta">Banco de dados · ${c.nome} · <button type="button" class="lp-link" style="font-size:inherit" data-act="sairConta">Sair</button></p>${avisoLocal()}</div>
      <button type="button" class="btn p" data-act="novoCliente" aria-expanded="${st.novo}">${ic(st.novo ? 'x' : 'mais', 18)}${st.novo ? 'Fechar' : 'Novo cliente'}</button></header>

    ${st.novo ? html`<form class="card cad-card enter" data-submit="salvarCliente" novalidate style="max-width:none">
      <div class="grid md-g2">
        ${campo({ id: 'n-nome', nome: 'nome', rotulo: 'Nome', valor: f.nome, erro: e.nome, extra: 'autocomplete="off" required' })}
        ${campo({ id: 'n-tel', nome: 'telefone', rotulo: 'Telefone (WhatsApp)', tipo: 'tel', valor: f.telefone, erro: e.telefone, extra: 'inputmode="tel" data-in="mTel" placeholder="(11) 98765-4321" required' })}
        ${campo({ id: 'n-email', nome: 'email', rotulo: 'E-mail (opcional)', tipo: 'email', valor: f.email, erro: e.email, extra: 'inputmode="email" autocomplete="off"' })}
        ${campo({ id: 'n-cpf', nome: 'cpf', rotulo: 'CPF (opcional)', valor: f.cpf, erro: e.cpf, extra: 'inputmode="numeric" data-in="mCpf" autocomplete="off" placeholder="000.000.000-00"' })}
        <div class="fld"><label for="n-obj">Objetivo</label><select id="n-obj" name="objetivo"><option value="">Não informado</option>${OBJETIVOS.map(o => html`<option ${f.objetivo === o ? raw('selected') : ''}>${o}</option>`)}</select></div>
        <div class="fld"><label for="n-obs">Observação</label><input id="n-obs" name="observacao" value="${f.observacao || ''}" maxlength="500" placeholder="Ex.: veio pelo Instagram"></div>
      </div>
      ${e.geral ? html`<p class="fld-e" role="alert">${e.geral}</p>` : ''}
      <button class="btn p" type="submit" style="align-self:flex-start" ${st.enviando ? raw('disabled') : ''}>${st.enviando ? 'Salvando…' : 'Salvar no banco'}</button>
    </form>` : ''}

    <section class="grid g2 md-g4">
      ${Object.entries(STATUS).map(([k, [n]]) => html`<button type="button" class="tile" data-act="filtroCliente" data-v="${st.filtro === k ? 'todos' : k}" aria-pressed="${st.filtro === k}" style="${st.filtro === k ? 'border-color:var(--a-line)' : ''}"><span class="lbl">${n}</span><span class="num">${cont(k)}</span></button>`)}
    </section>

    ${st.carregando && !st.clientes ? html`<div class="card muted">Carregando do banco…</div>`
      : st.falha ? html`<div class="card"><p class="muted">Não foi possível falar com o banco. O servidor está ligado?</p><button type="button" class="btn sm" data-act="recarregarClientes" style="margin-top:10px">Tentar de novo</button></div>`
      : !vis.length ? html`<div class="card muted" style="text-align:center">${lista.length ? 'Ninguém nesta situação.' : 'Nenhum possível cliente ainda. Toque em "Novo cliente".'}</div>`
      : html`<div class="grid lg-g2">${vis.map(x => html`<article class="card" style="display:flex;flex-direction:column;gap:12px;padding:16px">
          <div style="display:flex;align-items:center;gap:12px"><span class="av">${x.nome.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()}</span>
            <div style="flex:1;min-width:0"><strong>${x.nome}</strong><div class="small muted">${x.telefone}${x.objetivo ? ' · ' + x.objetivo : ''}</div>${x.observacao ? html`<div class="small muted">${x.observacao}</div>` : ''}</div>
            <span class="pill ${STATUS[x.status][1]}">${STATUS[x.status][0]}</span></div>
          <div class="chips" role="group" aria-label="Situação de ${x.nome}" style="margin:0;padding:0">${Object.entries(STATUS).map(([k, [n]]) => html`<button type="button" class="chip" style="min-height:34px;font-size:13px" aria-pressed="${x.status === k}" data-act="statusCliente" data-id="${x.id}" data-v="${k}">${n}</button>`)}</div>
          <div class="ph-actions">${x.status === 'aluno' ? html`<button type="button" class="btn sm" data-act="darAcesso" data-id="${x.id}">Dar acesso ao app</button>` : ''}<a class="btn sm" href="https://wa.me/${x.whats}" target="_blank" rel="noopener">WhatsApp</a><button type="button" class="btn sm warn" data-act="excluirCliente" data-id="${x.id}" data-n="${x.nome}">Excluir</button></div>
        </article>`)}</div>`}
  </div>`;
}

/* ---------- ações ---------- */
export const acts = {
  mTel: (v, el) => { const n = mTel(v); if (n !== el.value) el.value = n; },
  mCpf: (v, el) => { const n = mCpf(v); if (n !== el.value) el.value = n; },
  cadastrar: async (fd) => {
    const d = { nome: String(fd.get('nome') || '').trim(), email: String(fd.get('email') || '').trim(), telefone: String(fd.get('telefone') || ''), cpf: String(fd.get('cpf') || ''), aceite: fd.get('aceite') === 'on', senha: String(fd.get('senha') || ''), confirmacao: String(fd.get('confirmacao') || '') };
    st.form = { nome: d.nome, email: d.email, telefone: d.telefone, cpf: d.cpf, aceite: d.aceite }; // a senha nunca volta para a tela
    const e = {};
    if (d.nome.split(/\s+/).length < 2) e.nome = 'Informe nome e sobrenome.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email)) e.email = 'E-mail inválido.';
    if (![10, 11].includes(dig(d.telefone).length)) e.telefone = 'Telefone com DDD, ex.: (11) 98765-4321.';
    if (!cpfOk(d.cpf)) e.cpf = 'CPF inválido. Confira os números.';
    const fs = forcaSenha(d.senha);
    if (fs.erro) e.senha = fs.erro;
    else if (d.senha !== d.confirmacao) e.confirmacao = 'As senhas não são iguais.';
    if (!d.aceite) e.aceite = 'É preciso aceitar os termos e a política de privacidade.';
    st.erros = e;
    if (Object.keys(e).length) { redraw(); setTimeout(() => document.querySelector('[aria-invalid="true"]')?.focus(), 0); return; }
    st.enviando = true; redraw();
    try {
      const t = await api('POST', '/api/treinadores', d);
      salvarConta(t);
      st.form = {}; st.erros = {}; st.ver = false;
      toast(`Conta criada. Bem-vindo, ${t.nome.split(' ')[0]}!`);
      location.hash = '#/p/clientes';
    } catch (err) {
      st.erros = err.dados?.erros || { geral: err.dados?.erro || 'Não foi possível salvar. O servidor está ligado?' };
    }
    st.enviando = false; redraw();
  },
  sairConta: async () => {
    try { await api('DELETE', '/api/sessao'); } catch { /* sessão já tinha acabado */ }
    salvarConta(null); st.clientes = null; ac.lista = null; ac.link = null;
    toast('Você saiu da conta');
    if (location.hash.startsWith('#/p/') || location.hash.startsWith('#/a/')) location.hash = '#/entrar'; else redraw();
  },
  tipoLogin: d => { st.tipoLogin = d.v; st.lerros = {}; redraw(); },
  aceitarConvite: async (fd) => {
    const d = { senha: String(fd.get('senha') || ''), confirmacao: String(fd.get('confirmacao') || ''), aceite: fd.get('aceite') === 'on' };
    cv.aceite = d.aceite;
    const e = {}, fs = forcaSenha(d.senha);
    if (fs.erro) e.senha = fs.erro; else if (d.senha !== d.confirmacao) e.confirmacao = 'As senhas não são iguais.';
    if (!d.aceite) e.aceite = 'É preciso aceitar os termos e a política de privacidade.';
    cv.erros = e;
    if (Object.keys(e).length) { redraw(); return; }
    st.enviando = true; redraw();
    try {
      salvarConta(await api('POST', `/api/convite/${encodeURIComponent(cv.token)}`, d));
      cv.token = null; st.ver = false;
      toast(`Conta criada. Bom treino, ${sessao.nome.split(' ')[0]}!`);
      location.hash = '#/a/inicio';
    } catch (err) {
      cv.erros = err.dados?.erros || { geral: err.dados?.erro || 'Não foi possível criar a senha.' };
    }
    st.enviando = false; redraw();
  },
  novoAcesso: () => { ac.novo = !ac.novo; ac.erros = {}; redraw(); },
  darAcesso: d => {
    const x = (st.clientes || []).find(c => String(c.id) === d.id);
    if (x) ac.form = { nome: x.nome, email: x.email || '', telefone: x.telefone };
    ac.novo = true; ac.link = null;
    location.hash = '#/p/acessos';
  },
  salvarAcesso: async (fd) => {
    const d = Object.fromEntries(['nome', 'email', 'telefone'].map(k => [k, String(fd.get(k) || '').trim()]));
    ac.form = d;
    const e = {};
    if (d.nome.length < 2) e.nome = 'Informe o nome.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email)) e.email = 'E-mail inválido.';
    if (![10, 11].includes(dig(d.telefone).length)) e.telefone = 'Telefone com DDD.';
    ac.erros = e;
    if (Object.keys(e).length) { redraw(); return; }
    st.enviando = true; redraw();
    try {
      const a = await api('POST', '/api/alunos', d);
      ac.link = { nome: a.nome, whats: a.whats, url: linkConvite(a.convite) };
      ac.lista = [{ ...a, convite: undefined }, ...(ac.lista || [])];
      ac.form = {}; ac.novo = false;
      toast('Convite criado. Envie o link ao aluno');
    } catch (err) {
      ac.erros = err.dados?.erros || { geral: err.dados?.erro || 'Não foi possível criar o convite.' };
    }
    st.enviando = false; redraw();
  },
  novoLink: async d => {
    try {
      const a = await api('POST', `/api/alunos/${d.id}/convite`);
      ac.link = { nome: a.nome, whats: a.whats, url: linkConvite(a.convite) };
      toast('Novo link gerado. O anterior deixou de valer'); redraw();
      scrollTo({ top: 0, behavior: 'smooth' });
    } catch { toast('Não foi possível gerar o link'); }
  },
  copiarLink: async () => {
    try { await navigator.clipboard.writeText(ac.link.url); toast('Link copiado'); }
    catch { toast('Selecione o link e copie manualmente'); }
  },
  excluirAcesso: async d => {
    if (!confirm(`Remover o acesso de ${d.n}? Ele não vai mais conseguir entrar no app.`)) return;
    try { await api('DELETE', `/api/alunos/${d.id}`); ac.lista = ac.lista.filter(a => String(a.id) !== d.id); toast('Acesso removido'); redraw(); }
    catch { toast('Não foi possível remover'); }
  },
  verSenha: () => { st.ver = !st.ver; redraw(); },
  forca: (v, el) => {
    const r = forcaSenha(v), box = el.closest('.fld')?.querySelector('.forca');
    if (!box) return;
    box.dataset.n = String(r.nivel);
    box.querySelector('span').textContent = v ? r.texto : 'Mínimo 8 caracteres, com letras e números.';
  },
  entrar: async (fd) => {
    const d = { email: String(fd.get('email') || '').trim(), senha: String(fd.get('senha') || ''), tipo: st.tipoLogin === 'aluno' ? 'aluno' : 'treinador' };
    st.lform = { email: d.email };
    if (!d.email || !d.senha) { st.lerros = { geral: 'Informe e-mail e senha.' }; redraw(); return; }
    st.enviando = true; st.lerros = {}; redraw();
    try {
      salvarConta(await api('POST', '/api/sessao', d));
      st.lform = {}; st.ver = false;
      toast(`Olá, ${sessao.nome.split(' ')[0]}!`);
      location.hash = sessao.tipo === 'aluno' ? '#/a/inicio' : '#/p/clientes';
    } catch (err) {
      st.lerros = { geral: err.dados?.erro || err.dados?.erros?.geral || 'Não foi possível entrar.' };
    }
    st.enviando = false; redraw();
  },
  novoCliente: () => { st.novo = !st.novo; st.cerros = {}; redraw(); },
  filtroCliente: d => { st.filtro = d.v; redraw(); },
  recarregarClientes: () => carregar(),
  salvarCliente: async (fd) => {
    const d = Object.fromEntries(['nome', 'telefone', 'email', 'cpf', 'objetivo', 'observacao'].map(k => [k, String(fd.get(k) || '').trim()]));
    st.cform = d;
    const e = {};
    if (d.nome.length < 2) e.nome = 'Informe o nome.';
    if (![10, 11].includes(dig(d.telefone).length)) e.telefone = 'Telefone com DDD.';
    if (d.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email)) e.email = 'E-mail inválido.';
    if (d.cpf && !cpfOk(d.cpf)) e.cpf = 'CPF inválido.';
    st.cerros = e;
    if (Object.keys(e).length) { redraw(); return; }
    st.enviando = true; redraw();
    try {
      const novo = await api('POST', '/api/clientes', d);
      st.clientes = [novo, ...(st.clientes || [])];
      st.cform = {}; st.novo = false;
      toast(`${novo.nome} salvo no banco`);
    } catch (err) {
      st.cerros = err.dados?.erros || { geral: err.dados?.erro || 'Não foi possível salvar.' };
    }
    st.enviando = false; redraw();
  },
  statusCliente: async d => {
    try {
      const at = await api('PATCH', `/api/clientes/${d.id}`, { status: d.v });
      st.clientes = st.clientes.map(x => (x.id === at.id ? at : x));
      redraw();
      if (d.v === 'aluno') toast(`${at.nome.split(' ')[0]} virou aluno!`);
    } catch { toast('Não foi possível atualizar'); }
  },
  excluirCliente: async d => {
    if (!confirm(`Excluir ${d.n} do banco? Isso não pode ser desfeito.`)) return;
    try { await api('DELETE', `/api/clientes/${d.id}`); st.clientes = st.clientes.filter(x => String(x.id) !== d.id); toast('Cliente excluído'); redraw(); }
    catch { toast('Não foi possível excluir'); }
  }
};
