// Modo sem servidor (link público): faz o mesmo papel da API /api, guardando tudo neste aparelho (localStorage).
// A senha nunca é guardada: só uma impressão PBKDF2 com sal, impossível de reverter. O CPF fica só mascarado.
const CHAVE = 'pump:banco-local';
const novo = () => ({ seq: 1, treinadores: [], clientes: [], alunos: [], convites: [], sessao: null });
let b;
try { b = JSON.parse(localStorage.getItem(CHAVE)) || novo(); } catch { b = novo(); }
const gravar = () => { try { localStorage.setItem(CHAVE, JSON.stringify(b)); } catch { /* aba privada: vale até fechar */ } };
const id = () => b.seq++;

const falha = (status, dados) => { throw Object.assign(new Error('api'), { status, dados }); };
const invalido = erros => falha(422, { erros });
const dig = v => String(v || '').replace(/\D/g, '');
const txt = (v, n) => String(v || '').trim().replace(/\s+/g, ' ').slice(0, n);
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const fmtTel = t => t.length === 11 ? `(${t.slice(0, 2)}) ${t.slice(2, 7)}-${t.slice(7)}` : `(${t.slice(0, 2)}) ${t.slice(2, 6)}-${t.slice(6)}`;
const agora = () => new Date().toISOString().slice(0, 19).replace('T', ' ');
const DIA = 864e5, SESSAO = 7 * DIA, CONVITE = 7 * DIA;

const enc = new TextEncoder();
const hex = buf => [...new Uint8Array(buf)].map(x => x.toString(16).padStart(2, '0')).join('');
const sorteio = n => hex(crypto.getRandomValues(new Uint8Array(n)));
const sha = async s => hex(await crypto.subtle.digest('SHA-256', enc.encode(s)));
async function gerarHash(senha, sal = sorteio(16)) {
  const k = await crypto.subtle.importKey('raw', enc.encode(senha), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode(sal), iterations: 210000 }, k, 256);
  return `pbkdf2$210000$${sal}$${hex(bits)}`;
}
const conferir = async (senha, h) => !!h && (await gerarHash(senha, h.split('$')[2])) === h;

function cpfOk(c) {
  if (c.length !== 11 || /^(\d)\1+$/.test(c)) return false;
  for (const n of [9, 10]) {
    let s = 0;
    for (let i = 0; i < n; i++) s += +c[i] * (n + 1 - i);
    if ((s * 10 % 11) % 10 !== +c[n]) return false;
  }
  return true;
}
const mascara = c => (c ? `***.***.${c.slice(6, 9)}-${c.slice(9)}` : null);
function regraSenha(s, email, conf) {
  if (!s || s.length < 8) return { senha: 'A senha precisa ter pelo menos 8 caracteres.' };
  if (!/[A-Za-zÀ-ÿ]/.test(s) || !/\d/.test(s)) return { senha: 'Use letras e números na senha.' };
  if (email && s.toLowerCase().includes(email.split('@')[0].toLowerCase())) return { senha: 'Não use o seu e-mail na senha.' };
  if (s !== conf) return { confirmacao: 'As senhas não são iguais.' };
  return {};
}

const pubT = t => ({ id: t.id, tipo: 'treinador', nome: t.nome, email: t.email, telefone: fmtTel(t.telefone), cpf: t.cpf, criado_em: t.criado_em });
const pubC = c => ({ ...c, treinador_id: undefined, telefone: fmtTel(c.telefone), whats: '55' + c.telefone });
const pubA = (a, comTreinador) => ({ id: a.id, tipo: 'aluno', nome: a.nome, email: a.email, telefone: fmtTel(a.telefone), whats: '55' + a.telefone,
  ativo: !!a.senha_hash, ativado_em: a.ativado_em, criado_em: a.criado_em, ...(comTreinador ? { treinador: b.treinadores.find(t => t.id === a.treinador_id)?.nome } : {}) });

function quem() {
  const s = b.sessao;
  if (!s || s.expira < Date.now()) { b.sessao = null; return {}; }
  return s.tipo === 'aluno' ? { aluno: b.alunos.find(a => a.id === s.id) } : { treinador: b.treinadores.find(t => t.id === s.id) };
}
async function novoConvite(a) {
  const token = sorteio(24);
  b.convites = b.convites.filter(c => c.aluno_id !== a.id && c.expira > Date.now());
  b.convites.push({ hash: await sha(token), aluno_id: a.id, expira: Date.now() + CONVITE });
  return token;
}
async function conviteValido(token) {
  const h = await sha(token), c = b.convites.find(x => x.hash === h && x.expira > Date.now());
  const a = c && b.alunos.find(x => x.id === c.aluno_id && !x.senha_hash);
  return a ? { c, a } : null;
}
function pessoa(d, cpfObrigatorio) {
  const e = {}, p = { nome: txt(d.nome, 120), email: txt(d.email, 160).toLowerCase() || null, telefone: dig(d.telefone), cpf: dig(d.cpf) || null };
  if (cpfObrigatorio && p.nome.split(' ').length < 2) e.nome = 'Informe nome e sobrenome.'; else if (p.nome.length < 2) e.nome = 'Informe o nome.';
  if (cpfObrigatorio && !p.email) e.email = 'Informe o e-mail.'; else if (p.email && !EMAIL.test(p.email)) e.email = 'E-mail inválido.';
  if (![10, 11].includes(p.telefone.length)) e.telefone = 'Telefone com DDD, ex.: (11) 98765-4321.';
  if (cpfObrigatorio && !p.cpf) e.cpf = 'Informe o CPF.'; else if (p.cpf && !cpfOk(p.cpf)) e.cpf = 'CPF inválido.';
  return [e, p];
}

async function rota(m, url, d) {
  const sai = (dados) => { gravar(); return JSON.parse(JSON.stringify(dados ?? null)); };
  const q = quem();

  if (url === '/api/sessao' && m === 'GET') return sai(q.treinador ? pubT(q.treinador) : q.aluno ? pubA(q.aluno, true) : {});
  if (url === '/api/sessao' && m === 'DELETE') { b.sessao = null; return sai({}); }
  if (url === '/api/sessao' && m === 'POST') {
    const aluno = d.tipo === 'aluno', email = txt(d.email, 160).toLowerCase();
    const r = (aluno ? b.alunos : b.treinadores).find(x => x.email === email);
    if (!(await conferir(String(d.senha || ''), r?.senha_hash))) invalido({ geral: 'E-mail ou senha incorretos.' });
    b.sessao = { tipo: aluno ? 'aluno' : 'treinador', id: r.id, expira: Date.now() + SESSAO };
    return sai(aluno ? pubA(r, true) : pubT(r));
  }
  if (url === '/api/treinadores' && m === 'POST') {
    const [e, p] = pessoa(d, true);
    Object.assign(e, regraSenha(d.senha, p.email, d.confirmacao));
    if (d.aceite !== true) e.aceite = 'É preciso aceitar os termos e a política de privacidade.';
    if (Object.keys(e).length) invalido(e);
    if (b.treinadores.some(t => t.email === p.email)) invalido({ email: 'Já existe um cadastro com este e-mail.' });
    const cpf_hash = await sha('cpf:' + p.cpf);
    if (b.treinadores.some(t => t.cpf_hash === cpf_hash)) invalido({ cpf: 'Já existe um cadastro com este CPF.' });
    const t = { id: id(), nome: p.nome, email: p.email, telefone: p.telefone, cpf: mascara(p.cpf), cpf_hash, senha_hash: await gerarHash(d.senha), aceite_lgpd: agora(), criado_em: agora() };
    b.treinadores.push(t);
    b.sessao = { tipo: 'treinador', id: t.id, expira: Date.now() + SESSAO };
    return sai(pubT(t));
  }
  const cv = url.match(/^\/api\/convite\/([A-Za-z0-9_-]{16,64})$/);
  if (cv) {
    const v = await conviteValido(cv[1]);
    if (!v) falha(404, { erro: 'Convite inválido, vencido ou já usado.' });
    if (m === 'GET') return sai({ nome: v.a.nome, email: v.a.email, treinador: b.treinadores.find(t => t.id === v.a.treinador_id)?.nome });
    const e = regraSenha(d.senha, v.a.email, d.confirmacao);
    if (d.aceite !== true) e.aceite = 'É preciso aceitar os termos e a política de privacidade.';
    if (Object.keys(e).length) invalido(e);
    Object.assign(v.a, { senha_hash: await gerarHash(d.senha), aceite_lgpd: agora(), ativado_em: agora() });
    b.convites = b.convites.filter(c => c !== v.c);
    b.sessao = { tipo: 'aluno', id: v.a.id, expira: Date.now() + SESSAO };
    return sai(pubA(v.a, true));
  }

  const t = q.treinador;
  if (!t) falha(401, { erro: 'Entre na sua conta.' });
  if (url === '/api/conta' && m === 'DELETE') {
    const meus = new Set(b.alunos.filter(a => a.treinador_id === t.id).map(a => a.id));
    b.treinadores = b.treinadores.filter(x => x !== t);
    b.clientes = b.clientes.filter(c => c.treinador_id !== t.id);
    b.alunos = b.alunos.filter(a => !meus.has(a.id));
    b.convites = b.convites.filter(c => !meus.has(c.aluno_id));
    b.sessao = null;
    return sai({});
  }
  if (url === '/api/clientes' && m === 'GET') return sai(b.clientes.filter(c => c.treinador_id === t.id).reverse().map(pubC));
  if (url === '/api/clientes' && m === 'POST') {
    const [e, p] = pessoa(d, false);
    if (Object.keys(e).length) invalido(e);
    if (b.clientes.some(c => c.treinador_id === t.id && c.telefone === p.telefone)) invalido({ telefone: 'Você já tem um cliente com este telefone.' });
    const c = { id: id(), treinador_id: t.id, ...p, cpf: mascara(p.cpf), objetivo: txt(d.objetivo, 80) || null, status: d.status || 'interessado', observacao: txt(d.observacao, 500) || null, criado_em: agora() };
    b.clientes.push(c);
    return sai(pubC(c));
  }
  const cl = url.match(/^\/api\/clientes\/(\d+)$/);
  if (cl) {
    const c = b.clientes.find(x => x.id === +cl[1] && x.treinador_id === t.id) || falha(404, { erro: 'Não encontrado.' });
    if (m === 'PATCH') {
      if (!['interessado', 'experimental', 'aluno', 'desistiu'].includes(d.status)) invalido({ status: 'Situação inválida.' });
      c.status = d.status;
      return sai(pubC(c));
    }
    if (m === 'DELETE') { b.clientes = b.clientes.filter(x => x !== c); return sai(null); }
  }
  if (url === '/api/alunos' && m === 'GET') return sai(b.alunos.filter(a => a.treinador_id === t.id).reverse().map(a => pubA(a)));
  if (url === '/api/alunos' && m === 'POST') {
    const [e, p] = pessoa(d, false);
    if (!p.email) e.email = 'Informe o e-mail.';
    if (Object.keys(e).length) invalido(e);
    if (b.alunos.some(a => a.email === p.email)) invalido({ email: 'Já existe um aluno com este e-mail.' });
    const a = { id: id(), treinador_id: t.id, nome: p.nome, email: p.email, telefone: p.telefone, senha_hash: null, aceite_lgpd: null, criado_em: agora(), ativado_em: null };
    b.alunos.push(a);
    return sai({ ...pubA(a), convite: await novoConvite(a) });
  }
  const al = url.match(/^\/api\/alunos\/(\d+)(\/convite)?$/);
  if (al) {
    const a = b.alunos.find(x => x.id === +al[1] && x.treinador_id === t.id) || falha(404, { erro: 'Não encontrado.' });
    if (al[2] && m === 'POST') {
      if (a.senha_hash) invalido({ geral: 'Este aluno já ativou a conta.' });
      return sai({ ...pubA(a), convite: await novoConvite(a) });
    }
    if (!al[2] && m === 'DELETE') {
      b.alunos = b.alunos.filter(x => x !== a);
      b.convites = b.convites.filter(c => c.aluno_id !== a.id);
      if (b.sessao?.tipo === 'aluno' && b.sessao.id === a.id) b.sessao = null;
      return sai(null);
    }
  }
  falha(404, { erro: 'Rota não encontrada.' });
}

export async function apiLocal(metodo, url, corpo) {
  if (!crypto?.subtle) falha(503, { erro: 'Abra o app por um endereço seguro (https) para usar a conta.' });
  try { b = JSON.parse(localStorage.getItem(CHAVE)) || b; } catch { /* segue com o da memória */ } // outra aba pode ter mudado
  return rota(metodo, url, corpo || {});
}
