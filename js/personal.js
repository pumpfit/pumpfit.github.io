// Lado do personal: Hoje, Alunos (ficha), Treinos (editor), Agenda e Financeiro.
import { get, update, LIB, GRUPOS, NOME_FICHA, DIAS, HORAS, HOJE, lib, uid, padraoSR, aluno, primeiro, iniciais } from './store.js';
import { html, raw, ic, ui, toast, fmt, ha, mesCurto, rotulo, grafico, bus, flap } from './ui.js';
import * as C from './cadastro.js';

const PAG = { ok: ['Em dia', 'ok'], atraso: ['Atrasada', 'warn'], pix: ['Pix enviado', 'info'] };
const freqCls = f => (f >= 80 ? '' : f >= 55 ? 'info' : 'warn');
const norm = t => String(t).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const naoLidas = (s, id) => {
  const m = s.msgs[id] || [];
  return m.length > (s.lidas.p[id] || 0) && m[m.length - 1]?.de === 'a';
};
const redraw = () => bus.render();

/* ---------- navegação ---------- */
export function nav(r) {
  const v = r.path[0] || 'hoje';
  const s = get();
  const msg = s.alunos.some(a => naoLidas(s, a.id));
  return [
    { href: '#/p/hoje', label: 'Hoje', icon: 'hoje', cur: v === 'hoje', dot: Object.values(s.mudou || {}).some(m => !m.visto) },
    { href: '#/p/alunos', label: 'Alunos', icon: 'alunos', cur: v === 'alunos' || v === 'aluno', dot: msg },
    { href: '#/p/treinos', label: 'Treinos', icon: 'peso', cur: v === 'treinos' },
    { href: '#/p/agenda', label: 'Agenda', icon: 'agenda', cur: v === 'agenda' },
    { href: '#/p/fin', label: 'Financeiro', icon: 'fin', cur: v === 'fin' },
    { href: '#/p/clientes', label: 'Possíveis clientes', icon: 'mais', cur: v === 'clientes', mobile: false },
    { href: '#/p/acessos', label: 'Acesso dos alunos', icon: 'enviar', cur: v === 'acessos', mobile: false }
  ];
}

export function aoEntrar(r) {
  if (r.path[0] === 'aluno' && r.path[1]) {
    const id = r.path[1];
    const s = get();
    if ((s.msgs[id] || []).length !== (s.lidas.p[id] || 0)) update(n => { n.lidas.p[id] = (n.msgs[id] || []).length; });
  }
  if (r.path[0] === 'treinos') ui.salvo = true;
  if (r.path[0] === 'clientes') C.aoEntrarClientes();
  if (r.path[0] === 'acessos') C.aoEntrarAcessos();
}

export function view(r) {
  const [v = 'hoje', a, b] = r.path;
  if (v === 'alunos') return alunosV();
  if (v === 'aluno') return fichaV(a);
  if (v === 'treinos') return editorV(a, b);
  if (v === 'agenda') return agendaV();
  if (v === 'fin') return finV();
  if (v === 'clientes') return C.clientesV({ anim: ui.anim });
  if (v === 'acessos') return C.acessosV({ anim: ui.anim });
  return hojeV();
}

/* ---------- dados derivados ---------- */
function aulasDoDia(s, d) {
  const lista = HORAS.filter(h => s.agenda[d]?.[h]).map(h => ({ h, id: s.agenda[d][h], feita: !!s.presenca[`${d}-${h}`] }));
  const prox = lista.find(x => !x.feita);
  lista.forEach(x => { x.prox = x === prox; });
  return lista;
}

function alertas(s) {
  const atras = s.alunos.filter(a => a.pag === 'atraso');
  const lucas = aluno('lucas');
  const out = [];
  for (const a of s.alunos) {
    if (naoLidas(s, a.id)) out.push({ k: 'msg-' + a.id, cor: 'var(--chg)', titulo: `${primeiro(a.id)} mandou mensagem`, detalhe: (s.msgs[a.id].at(-1).txt || '').slice(0, 60), btn: 'Responder', go: `#/p/aluno/${a.id}` });
  }
  out.push({ k: 'sumido', cor: 'var(--chg)', titulo: 'Lucas Prado sumiu há 9 dias', detalhe: 'Antes vinha 3x por semana', btn: 'Chamar no WhatsApp', feito: 'Mensagem enviada', ok: !!s.feitos.sumido || lucas?.ultimo === 'Hoje' });
  out.push({ k: 'pix', cor: 'var(--chg)', titulo: atras.length ? `${atras.length} mensalidades atrasadas` : 'Mensalidades atrasadas', detalhe: atras.length ? atras.map(a => primeiro(a.id)).join(' e ') + ' · venceu dia 20' : 'Cobranças enviadas', btn: 'Enviar Pix', feito: 'Pix enviado', ok: !atras.length, act: 'cobrarTodos' });
  out.push({ k: 'carga', cor: 'var(--tx3)', titulo: 'Carga parada há 4 semanas', detalhe: 'Rafael Lima · agachamento em 60 kg', btn: 'Ajustar treino', feito: 'Treino aberto', ok: !!s.feitos.carga, go: '#/p/treinos/rafael/B' });
  out.push({ k: 'ficha', cor: 'var(--tx3)', titulo: 'Treino de Marina vence sexta', detalhe: 'Ficha atual há 6 semanas', btn: 'Trocar ficha', feito: 'Ficha aberta', ok: !!s.feitos.ficha, go: '#/p/treinos/marina/A' });
  return out;
}

// Painel de partidas: aulas de hoje em ordem de horário; feitas descem para o fim, riscadas;
// o que o aluno mudou (remarcou, marcou, cancelou) acende em laranja até o personal tocar em "Visto".
function partidas(s) {
  const mud = s.mudou || {};
  const viva = x => { const m = mud[`${HOJE}-${x.h}`]; return m && !m.visto ? m : null; };
  const lista = aulasDoDia(s, HOJE).map(x => ({ ...x, chg: viva(x) }));
  for (const [k, m] of Object.entries(mud)) {
    const [d, h] = k.split('-');
    if (+d === HOJE && m.tipo === 'cancelou' && !m.visto && !s.agenda[d]?.[h]) lista.push({ h, id: m.id, chg: m, gone: true });
  }
  const ordem = x => (x.feita ? 1 : 0);
  return lista.sort((a, b) => ordem(a) - ordem(b) || a.h.localeCompare(b.h));
}
const SIT_CHG = m => m.tipo === 'remarcou' ? `Remarcou · era ${m.era}` : m.tipo === 'cancelou' ? 'Cancelou' : 'Marcou agora';
function situacao(x) {
  if (x.chg) return { cls: x.gone ? 'is-chg is-gone' : 'is-chg', txt: SIT_CHG(x.chg), st: 'chg-' + x.chg.tipo };
  if (x.feita) return { cls: 'is-done', txt: 'Feita', st: 'feita' };
  if (x.prox) return { cls: 'is-now', txt: 'Próxima', st: 'prox' };
  return { cls: '', txt: 'Confirmada', st: 'conf' };
}
const FICHA_HOJE = { 'Ganhar massa': 'A', Emagrecer: 'C', Definição: 'B', Condicionamento: 'A', 'Saúde e postura': 'B' };

const alertaHtml = al => html`<div class="row al" style="opacity:${al.ok ? 0.55 : 1};transition:opacity .3s">
  <span class="mark" style="color:${al.ok ? 'var(--line2)' : al.cor}"></span>
  <span class="grow"><span class="t">${al.titulo}</span><span class="s">${al.detalhe}</span></span>
  ${al.ok ? html`<span class="btn sm done">${ic('check', 16)}${al.feito}</span>`
    : html`<button type="button" class="btn sm" data-act="alerta" data-k="${al.k}" data-go="${al.go || ''}" data-sub="${al.act || ''}">${al.btn}</button>`}
</div>`;

const pill = a => html`<span class="pill ${PAG[a.pag][1]}">${PAG[a.pag][0]}</span>`;

/* ---------- Hoje ---------- */
function hojeV() {
  const s = get();
  const ag = aulasDoDia(s, HOJE);
  const prox = ag.find(x => x.prox);
  const al = alertas(s);
  const pend = al.filter(x => !x.ok).length;
  const emDia = s.alunos.filter(a => a.pag === 'ok').length;
  const total = s.alunos.length;
  const novidades = s.eventos.filter(e => e.de === 'a').slice(0, 5);
  const pt = partidas(s);
  const mudancas = pt.filter(x => x.chg).length;
  const feitas = ag.filter(x => x.feita).length;
  const nome = (C.conta()?.nome || '[Nome]').split(' ')[0];
  return html`<div class="page ${ui.anim ? 'enter' : ''}">
    <header class="ph">
      <div><h1>Hoje</h1><p class="meta">Ter 27 out · Bom dia, ${nome}</p></div>
      <div class="ph-actions"><a class="btn" href="#/p/treinos">Montar treino</a><button type="button" class="btn p" data-act="novoAluno">${ic('mais', 18)}Novo aluno</button></div>
    </header>

    <section class="band" aria-label="Resumo do dia">
      <a href="#/p/alunos"><span class="lbl">Alunos ativos</span><span class="num">${flap('30', 'b-ativos')}</span><span class="small muted">Ver todos</span></a>
      <a href="#/p/agenda"><span class="lbl">Aulas hoje</span><span class="num">${flap(String(ag.length), 'b-aulas')}</span><span class="small muted">${feitas} feitas · ${prox ? 'próxima ' + prox.h : 'dia encerrado'}</span></a>
      <a href="#/p/fin"><span class="lbl">Em dia</span><span class="num">${flap(String(emDia), 'b-dia')}<small>/${total}</small></span><span class="small muted">mensalidades de outubro</span></a>
      <div class="${pend + mudancas ? 'chg' : ''}"><span class="lbl">Precisa de você</span><span class="num">${flap(String(pend + mudancas), 'b-precisa')}</span><span class="small muted">${mudancas ? `${mudancas} ${mudancas > 1 ? 'mudanças' : 'mudança'} na agenda · ` : ''}${pend} ${pend === 1 ? 'alerta' : 'alertas'}</span></div>
    </section>

    <div class="grid lg-21" style="gap:28px 36px">
      <section aria-labelledby="t-partidas">
        <div class="card-h"><h2 id="t-partidas">Partidas de hoje</h2><a class="btn sm" href="#/p/agenda">Semana</a></div>
        ${pt.length ? html`<table class="brd">
          <thead><tr><th scope="col">Hora</th><th scope="col">Aluno</th><th scope="col" class="fx">Ficha</th><th scope="col">Situação</th></tr></thead>
          <tbody>${pt.map(x => {
            const a = aluno(x.id);
            const sit = situacao(x);
            const k = FICHA_HOJE[a?.obj] || 'B';
            return html`<tr class="${sit.cls}" data-flip="${x.id}" data-st="${sit.st}">
              <td class="h">${flap(x.h, 'h-' + x.id)}</td>
              <td class="who"><a href="#/p/aluno/${x.id}">${a?.nome || 'Aluno'}</a><span>${a?.obj || ''}</span></td>
              <td class="fx">${k} · ${NOME_FICHA[k]}</td>
              <td class="st"><b>${sit.txt}</b>${x.chg ? html`<button type="button" class="btn sm" data-act="visto" data-k="${HOJE}-${x.h}">Visto</button>`
                : x.prox ? html`<button type="button" class="btn sm" data-act="presenca" data-dia="${HOJE}" data-hora="${x.h}">Presença</button>` : ''}</td>
            </tr>`;
          })}</tbody>
        </table>` : html`<p class="muted" style="padding:16px 0">Nenhuma aula marcada para hoje.</p>`}
      </section>

      <div class="page" style="gap:28px">
        <section aria-labelledby="t-precisa">
          <div class="card-h"><h2 id="t-precisa">Precisa de você</h2><span class="lbl">${pend} pendentes</span></div>
          <div class="list" style="border-top:1px solid var(--line2)">${al.map(alertaHtml)}</div>
        </section>
        <section aria-labelledby="t-novidades">
          <div class="card-h"><h2 id="t-novidades">Novidades dos alunos</h2><span class="lbl">ao vivo</span></div>
          ${novidades.length ? html`<div class="list" style="border-top:1px solid var(--line2)">${novidades.map(e => html`<a class="row" href="#/p/aluno/${e.aluno}"><span class="av">${iniciais(aluno(e.aluno)?.nome || '?')}</span><span class="grow"><span class="t">${e.txt}</span><span class="s mono">${ha(e.t)}</span></span></a>`)}</div>`
            : html`<p class="muted small">Quando um aluno treinar, registrar peso, pagar ou mandar mensagem, aparece aqui na hora.</p>`}
        </section>
      </div>
    </div>
  </div>`;
}

/* ---------- Alunos ---------- */
const FILTROS = ['Todos', 'Em dia', 'Atrasados', 'Baixa frequência'];
function alunosV() {
  const s = get();
  const q = norm(ui.busca.trim());
  const lista = s.alunos.filter(a => {
    if (q && !norm(a.nome + ' ' + a.obj).includes(q)) return false;
    if (ui.filtro === 'Em dia') return a.pag === 'ok';
    if (ui.filtro === 'Atrasados') return a.pag !== 'ok';
    if (ui.filtro === 'Baixa frequência') return a.freq < 60;
    return true;
  });
  return html`<div class="page ${ui.anim ? 'enter' : ''}">
    <header class="ph"><div><h1>Alunos</h1><p class="meta">30 ativos · amostra de 8</p></div><div class="ph-actions"><a class="btn" href="#/p/acessos">Acesso dos alunos</a><a class="btn" href="#/p/clientes">Possíveis clientes</a><button type="button" class="btn p" data-act="novoAluno">${ic('mais', 18)}Novo aluno</button></div></header>
    <label class="field">${ic('busca', 18)}<span class="sr">Buscar aluno</span><input id="busca-aluno" type="search" placeholder="Buscar por nome ou objetivo" value="${ui.busca}" data-in="busca" autocomplete="off"></label>
    <div class="chips" role="group" aria-label="Filtrar alunos">${FILTROS.map(f => html`<button type="button" class="chip" aria-pressed="${ui.filtro === f}" data-act="filtro" data-v="${f}">${f}</button>`)}</div>
    ${lista.length ? html`<div class="grid md-g2 lg-g2 ${ui.anim ? 'stagger' : ''}">${lista.map(a => html`<a class="card row" style="padding:14px 16px" href="#/p/aluno/${a.id}">
      <span class="av">${iniciais(a.nome)}</span>
      <span class="grow"><span class="t">${a.nome}${naoLidas(s, a.id) ? html` <span class="pill on" style="margin-left:6px">mensagem</span>` : ''}</span><span class="s">${a.obj} · último treino ${a.ultimo.toLowerCase()}</span>
        <span class="bar ${freqCls(a.freq)}" style="margin-top:8px"><i style="transform:scaleX(${(a.freq / 100).toFixed(2)})"></i></span></span>
      ${pill(a)}</a>`)}</div>` : html`<div class="card muted" style="text-align:center">Nenhum aluno encontrado.</div>`}
  </div>`;
}

/* ---------- Ficha do aluno ---------- */
function fichaV(id) {
  const s = get();
  const a = aluno(id);
  if (!a) return html`<div class="page"><h1>Aluno não encontrado</h1><a class="btn" href="#/p/alunos">Voltar</a></div>`;
  const med = s.medidas[id] || [];
  const ult = med.at(-1), pri = med[0];
  const dif = ult && pri ? ult.peso - pri.peso : 0;
  const sess = s.sessoes.filter(x => x.aluno === id).slice(-4).reverse();
  const msgs = (s.msgs[id] || []).slice(-6);
  return html`<div class="page ${ui.anim ? 'enter' : ''}">
    <a class="btn sm" href="#/p/alunos" style="align-self:flex-start">${ic('voltar', 16)}Alunos</a>
    <header class="ph">
      <div style="display:flex;align-items:center;gap:14px"><span class="av lg">${iniciais(a.nome)}</span><div><h1 style="font-size:clamp(24px,5vw,36px)">${a.nome}</h1><p class="muted">${a.obj} · desde ${a.desde}</p></div></div>
      <div class="ph-actions"><button type="button" class="btn" data-act="whats" data-id="${id}">WhatsApp</button><a class="btn" href="#/p/agenda">Agendar</a><a class="btn p" href="#/p/treinos/${id}/B">Editar treino</a></div>
    </header>

    <section class="grid g2 md-g4">
      <div class="tile"><span class="lbl">Frequência</span><span class="num">${a.freq}%</span><span class="bar ${freqCls(a.freq)}"><i style="transform:scaleX(${(a.freq / 100).toFixed(2)})"></i></span></div>
      <div class="tile"><span class="lbl">Último treino</span><span class="num" style="font-size:22px">${a.ultimo}</span></div>
      <div class="tile"><span class="lbl">Peso</span><span class="num tnum">${ult ? fmt(ult.peso) : '—'}<span class="muted" style="font-size:.5em"> kg</span></span><span class="small" style="color:var(--a-ink)">${dif ? (dif < 0 ? '−' : '+') + fmt(Math.abs(dif)) + ' kg desde ' + mesCurto(pri.d) : ''}</span></div>
      <div class="tile"><span class="lbl">Mensalidade</span>${pill(a)}<span class="small muted">Vence ${a.venc} · nov. ${a.nov === 'paga' ? 'paga' : 'em aberto'}</span></div>
    </section>

    ${a.pag !== 'ok' ? html`<div class="card" style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:space-between"><span><strong>Mensalidade ${a.pag === 'pix' ? 'cobrada por Pix' : 'atrasada'}</strong><span class="muted small" style="display:block">Venceu em ${a.venc}</span></span><span class="ph-actions">${a.pag === 'atraso' ? html`<button type="button" class="btn sm warn" data-act="cobrar" data-id="${id}">Cobrar por Pix</button>` : ''}<button type="button" class="btn sm" data-act="pagar" data-id="${id}">Marcar como pago</button></span></div>` : ''}

    <div class="grid lg-g2">
      <section class="card">
        <div class="card-h"><h2>Evolução do peso</h2><span class="small muted">${med.length} avaliações</span></div>
        ${grafico(med.slice(-7).map(m => ({ v: m.peso, l: rotulo(m.d) })), { label: `Peso de ${a.nome}` })}
        <form class="send" data-submit="medidaP" data-id="${id}" style="margin-top:12px">
          <label class="field" style="flex:1"><span class="sr">Novo peso em quilos</span><input id="peso-p" name="peso" type="number" inputmode="decimal" step="0.1" min="30" max="250" placeholder="Novo peso (kg)" required></label>
          <button class="btn p" type="submit">Registrar</button>
        </form>
      </section>
      <section class="card">
        <div class="card-h"><h2>Mensagens</h2><span class="small muted">no app</span></div>
        <div class="msgs">${msgs.length ? msgs.map(m => html`<div class="msg ${m.de === 'p' ? 'eu' : ''}">${m.txt}<time>${ha(m.t)}</time></div>`) : html`<p class="muted small">Nenhuma mensagem ainda.</p>`}</div>
        <form class="send" data-submit="msgP" data-id="${id}" style="margin-top:12px">
          <label class="field" style="flex:1"><span class="sr">Mensagem para ${a.nome}</span><input id="msg-p" name="txt" type="text" placeholder="Escrever para ${primeiro(id)}" autocomplete="off" required></label>
          <button class="btn p icon" type="submit" aria-label="Enviar mensagem">${ic('enviar', 18)}</button>
        </form>
      </section>
      <section class="card">
        <h2 style="margin-bottom:6px">Treinos</h2>
        <div class="list">${['A', 'B', 'C'].map(k => {
          const it = s.fichas[id][k];
          const grupos = [...new Set(it.map(e => lib(e.ref).grupo))].join(' · ');
          return html`<a class="row" href="#/p/treinos/${id}/${k}"><span class="av num">${k}</span><span class="grow"><span class="t">${NOME_FICHA[k]} · ${it.length} exercícios</span><span class="s">${grupos}</span></span><span class="small" style="color:var(--a-ink);font-weight:600">Editar</span></a>`;
        })}</div>
      </section>
      <section class="card">
        <h2 style="margin-bottom:6px">Treinos feitos no app</h2>
        ${sess.length ? html`<div class="list">${sess.map(x => html`<div class="row"><span class="av num">${x.letra}</span><span class="grow"><span class="t">Treino ${x.letra} · ${x.series} séries · ${fmt(x.volume)} kg</span><span class="s">${ha(x.t)}${x.nota ? ' · achou ' + x.nota.toLowerCase() : ''}${x.subiu ? ' · subiu carga em ' + x.subiu : ''}</span></span></div>`)}</div>`
          : html`<p class="muted small">Quando ${primeiro(id)} concluir um treino pelo app, o resumo aparece aqui.</p>`}
        <h2 style="margin:18px 0 6px">Observações</h2><p class="muted">${a.obs}</p>
      </section>
    </div>
  </div>`;
}

/* ---------- Editor de treino ---------- */
function editorV(id = 'juliana', letra = 'B') {
  const s = get();
  if (!aluno(id)) id = 'juliana';
  if (!NOME_FICHA[letra]) letra = 'B';
  const a = aluno(id);
  const ficha = s.fichas[id][letra];
  const naFicha = new Set(ficha.map(e => e.ref));
  const bq = norm(ui.bBusca.trim());
  const bib = LIB.filter(L => (ui.bGrupo === 'Todos' || L.grupo === ui.bGrupo) && (!bq || norm(L.nome).includes(bq)));
  const stp = (e, campo, rot, txt) => html`<div><div class="stp-lbl">${rot}</div><div class="stp">
    <button type="button" aria-label="Diminuir ${rot.toLowerCase()} de ${lib(e.ref).nome}" data-act="exAj" data-id="${id}" data-l="${letra}" data-u="${e.uid}" data-f="${campo}" data-dt="-1">${ic('menos', 16)}</button>
    <output>${txt}</output>
    <button type="button" aria-label="Aumentar ${rot.toLowerCase()} de ${lib(e.ref).nome}" data-act="exAj" data-id="${id}" data-l="${letra}" data-u="${e.uid}" data-f="${campo}" data-dt="1">${ic('mais', 16)}</button></div></div>`;
  return html`<div class="page ${ui.anim ? 'enter' : ''}">
    <header class="ph"><div><h1>${a.nome}</h1><p class="meta">Editor de treino · objetivo: ${a.obj}</p></div><a class="btn" href="#/p/aluno/${id}">Ver ficha</a></header>
    <div class="chips" role="group" aria-label="Escolher aluno">${s.alunos.map(x => html`<a class="chip" style="display:inline-flex;align-items:center" aria-pressed="${x.id === id}" href="#/p/treinos/${x.id}/${letra}">${primeiro(x.id)}</a>`)}</div>
    <div class="seg g3 grid" role="group" aria-label="Escolher ficha">${['A', 'B', 'C'].map(k => html`<a class="segbtn" aria-pressed="${k === letra}" href="#/p/treinos/${id}/${k}"><strong class="num" style="font-size:18px">Treino ${k}</strong><span class="muted small">${NOME_FICHA[k]} · ${s.fichas[id][k].length}</span></a>`)}</div>

    <div class="grid lg-21">
      <section class="page" aria-label="Exercícios do treino ${letra}">
        ${ficha.length ? html`<div class="page ${ui.anim ? 'stagger' : ''}" style="gap:10px">${ficha.map((e, i) => {
          const L = lib(e.ref);
          return html`<article class="card" style="padding:14px;display:flex;flex-direction:column;gap:12px">
            <div style="display:flex;align-items:center;gap:10px">
              <span class="av num" style="width:32px;height:32px;border-radius:10px;font-size:13px">${i + 1}</span>
              <div class="grow" style="flex:1;min-width:0"><strong>${L.nome}</strong><div class="small muted">${L.grupo}</div></div>
              <button type="button" class="icobtn" aria-label="Subir ${L.nome}" ${i === 0 ? raw('disabled') : ''} data-act="exMover" data-id="${id}" data-l="${letra}" data-u="${e.uid}" data-dir="-1">${ic('cima', 16)}</button>
              <button type="button" class="icobtn" aria-label="Descer ${L.nome}" ${i === ficha.length - 1 ? raw('disabled') : ''} data-act="exMover" data-id="${id}" data-l="${letra}" data-u="${e.uid}" data-dir="1">${ic('baixo', 16)}</button>
              <button type="button" class="icobtn" aria-label="Remover ${L.nome}" data-act="exDel" data-id="${id}" data-l="${letra}" data-u="${e.uid}">${ic('x', 16)}</button>
            </div>
            <div class="grid g3" style="gap:8px">${stp(e, 'series', 'Séries', e.series)}${stp(e, 'reps', L.seg ? 'Segundos' : 'Reps', e.reps)}${stp(e, 'carga', 'Carga', L.carga === 0 && e.carga === 0 ? 'Corpo' : e.carga + ' kg')}</div>
          </article>`;
        })}</div>` : html`<div class="card muted" style="text-align:center">Ficha vazia. Adicione exercícios.</div>`}
        <button type="button" class="btn block" style="border-style:dashed" data-act="abrirBiblio">${ic('mais', 18)}Adicionar exercício</button>
        <div class="savebar"><span class="small" style="font-weight:600;color:${ui.salvo ? 'var(--tx2)' : 'var(--warn-ink)'}">${ui.salvo ? 'Tudo enviado ao aluno' : 'Alterações salvas · avise o aluno'}</span><button type="button" class="btn p sm" data-act="salvarTreino" data-id="${id}" data-l="${letra}">Enviar ao aluno</button></div>
      </section>
      <aside class="card" style="display:none" data-desk-bib></aside>
    </div>

    ${ui.biblio ? html`<button type="button" class="veil" aria-label="Fechar biblioteca" data-act="fechar"></button>
    <div class="sheet" role="dialog" aria-modal="true" aria-label="Biblioteca de exercícios">
      <span class="grab"></span>
      <div class="card-h" style="margin:0"><h2>Biblioteca de exercícios</h2><button type="button" class="btn sm" data-act="fechar">Pronto</button></div>
      <label class="field">${ic('busca', 18)}<span class="sr">Buscar exercício</span><input id="busca-ex" type="search" placeholder="Buscar exercício" value="${ui.bBusca}" data-in="bBusca" autocomplete="off"></label>
      <div class="chips" role="group" aria-label="Grupo muscular">${GRUPOS.map(g => html`<button type="button" class="chip" aria-pressed="${ui.bGrupo === g}" data-act="bGrupo" data-v="${g}">${g}</button>`)}</div>
      <div class="list">${bib.map(L => html`<div class="row"><span class="grow"><span class="t">${L.nome}</span><span class="s">${L.grupo}</span></span>${naFicha.has(L.id) ? html`<span class="pill ok">Na ficha</span>` : html`<button type="button" class="btn sm" data-act="exAdd" data-id="${id}" data-l="${letra}" data-ref="${L.id}">${ic('mais', 16)}Adicionar</button>`}</div>`)}</div>
    </div>` : ''}
  </div>`;
}

/* ---------- Agenda ---------- */
function agendaV() {
  const s = get();
  const d = ui.dia;
  const info = ui.slot ? (() => {
    const [dd, h] = ui.slot.split('|');
    const id = s.agenda[dd]?.[h];
    return { d: +dd, h, id, feita: !!s.presenca[`${dd}-${h}`] };
  })() : null;
  return html`<div class="page ${ui.anim ? 'enter' : ''}">
    <header class="ph"><div><h1>Agenda</h1><p class="meta">Semana de 26 a 31 de outubro</p></div></header>
    <div class="days" role="group" aria-label="Dia da semana">${DIAS.map((x, i) => html`<button type="button" class="day" aria-pressed="${i === d}" data-act="dia" data-i="${i}"><span class="small" style="font-weight:600">${x.n}</span><span class="num">${x.d}</span><span class="small muted">${Object.keys(s.agenda[i] || {}).length}</span></button>`)}</div>
    <h2>${DIAS[d].n}, ${DIAS[d].d} de outubro${d === HOJE ? ' · hoje' : ''}</h2>
    <div class="page ${ui.anim ? 'stagger' : ''}" style="gap:8px">${HORAS.map(h => {
      const id = s.agenda[d]?.[h];
      const feita = !!s.presenca[`${d}-${h}`];
      const key = `${d}|${h}`;
      return html`<button type="button" class="slot ${id ? (feita ? 'feito' : 'ocup') : 'livre'}" aria-pressed="${ui.slot === key}" data-act="slot" data-k="${key}">
        <span class="time">${h}</span><span class="grow" style="flex:1;min-width:0"><strong style="display:block">${id ? aluno(id).nome : 'Horário livre'}</strong><span class="small muted">${id ? (feita ? 'Presença registrada' : aluno(id).obj) : 'Toque para agendar'}</span></span>${id && feita ? html`<span class="pill ok">${ic('check', 14)}</span>` : ''}</button>`;
    })}</div>
    ${info ? html`<button type="button" class="veil" aria-label="Fechar" data-act="fechar"></button>
    <div class="sheet" role="dialog" aria-modal="true" aria-label="Horário ${info.h}">
      <span class="grab"></span>
      <span class="lbl">${DIAS[info.d].n} ${DIAS[info.d].d} · ${info.h}</span>
      ${info.id ? html`<h2 class="num" style="font-size:24px;font-family:var(--fd)">${aluno(info.id).nome}</h2>
        ${info.d === HOJE && !info.feita ? html`<button type="button" class="btn p block" data-act="presenca" data-dia="${info.d}" data-hora="${info.h}">Marcar presença</button>` : ''}
        <a class="btn block" href="#/p/aluno/${info.id}">Abrir ficha do aluno</a>
        <button type="button" class="btn warn block" data-act="cancelarAula" data-dia="${info.d}" data-hora="${info.h}">Cancelar aula</button>`
      : html`<h2>Agendar quem neste horário?</h2><div style="display:flex;flex-wrap:wrap;gap:8px">${s.alunos.map(x => html`<button type="button" class="chip" data-act="agendarAula" data-dia="${info.d}" data-hora="${info.h}" data-id="${x.id}">${primeiro(x.id)}</button>`)}</div>`}
    </div>` : ''}
  </div>`;
}

/* ---------- Financeiro ---------- */
const FFIL = ['Todos', 'Em dia', 'Atrasadas', 'Pix enviado'];
function finV() {
  const s = get();
  const emDia = s.alunos.filter(a => a.pag === 'ok').length;
  const pend = s.alunos.length - emDia;
  const nov = s.alunos.filter(a => a.nov === 'paga').length;
  const lista = s.alunos.filter(a => ui.finFiltro === 'Em dia' ? a.pag === 'ok' : ui.finFiltro === 'Atrasadas' ? a.pag === 'atraso' : ui.finFiltro === 'Pix enviado' ? a.pag === 'pix' : true);
  return html`<div class="page ${ui.anim ? 'enter' : ''}">
    <header class="ph"><div><h1>Financeiro</h1><p class="meta">Outubro de 2026</p></div><button type="button" class="btn p" data-act="cobrarTodos">Cobrar atrasados</button></header>
    <section class="grid g2 md-g4">
      <div class="tile"><span class="lbl">Recebido</span><span class="num" style="font-size:24px">R$ [VALOR]</span></div>
      <div class="tile"><span class="lbl">Em dia</span><span class="num tnum">${emDia}<span class="muted" style="font-size:.55em">/${s.alunos.length}</span></span><span class="bar"><i style="transform:scaleX(${(emDia / s.alunos.length).toFixed(3)})"></i></span></div>
      <div class="tile alert"><span class="lbl">Pendentes</span><span class="num">${pend}</span></div>
      <div class="tile"><span class="lbl">Novembro pago</span><span class="num">${nov}</span><span class="small muted">adiantados pelo app</span></div>
    </section>
    <div class="chips" role="group" aria-label="Filtrar mensalidades">${FFIL.map(f => html`<button type="button" class="chip" aria-pressed="${ui.finFiltro === f}" data-act="finFiltro" data-v="${f}">${f}</button>`)}</div>
    <section class="card" style="padding-block:6px">
      ${lista.length ? html`<div class="list">${lista.map(a => html`<div class="row" style="flex-wrap:wrap">
        <a href="#/p/aluno/${a.id}" style="display:flex;align-items:center;gap:12px;flex:1 1 220px;min-width:0"><span class="av">${iniciais(a.nome)}</span><span class="grow"><span class="t">${a.nome}</span><span class="s">${a.pag === 'ok' ? 'Próxima em ' + a.venc : 'Venceu em ' + a.venc} · R$ [VALOR]</span></span></a>
        ${pill(a)}
        <span class="ph-actions">${a.pag === 'atraso' ? html`<button type="button" class="btn sm warn" data-act="cobrar" data-id="${a.id}">Cobrar Pix</button>` : ''}${a.pag !== 'ok' ? html`<button type="button" class="btn sm" data-act="pagar" data-id="${a.id}">Marcar pago</button>` : ''}</span>
      </div>`)}</div>` : html`<p class="muted" style="padding:16px 0;text-align:center">Nada neste filtro.</p>`}
    </section>
  </div>`;
}

/* ---------- ações ---------- */
const mexer = (d, fn) => {
  update(n => fn(n.fichas[d.id][d.l]));
  ui.salvo = false;
};
export const acts = {
  novoAluno: () => toast('Link de cadastro copiado. Envie no WhatsApp do novo aluno'),
  visto: d => update(n => { const m = (n.mudou ||= {})[d.k]; if (m) m.visto = true; }),
  whats: d => toast(`Conversa com ${primeiro(d.id)} aberta no WhatsApp`),
  busca: v => { ui.busca = v; redraw(); },
  filtro: d => { ui.filtro = d.v; redraw(); },
  finFiltro: d => { ui.finFiltro = d.v; redraw(); },
  alerta: d => {
    if (d.k.startsWith('msg-')) { location.hash = d.go; return; }
    if (d.sub === 'cobrarTodos') { acts.cobrarTodos(); return; }
    update(n => { n.feitos[d.k] = true; });
    if (d.k === 'sumido') toast('Mensagem enviada para o Lucas no WhatsApp');
    if (d.go) location.hash = d.go;
  },
  presenca: d => {
    const id = get().agenda[d.dia][d.hora];
    update(n => {
      n.presenca[`${d.dia}-${d.hora}`] = true;
      const a = n.alunos.find(x => x.id === id);
      if (a) a.ultimo = 'Hoje';
    });
    ui.slot = null;
    toast(`Presença de ${primeiro(id)} registrada`);
  },
  cobrar: d => { update(n => { n.alunos.find(a => a.id === d.id).pag = 'pix'; }); toast(`Cobrança por Pix enviada para ${primeiro(d.id)}`); },
  pagar: d => { update(n => { n.alunos.find(a => a.id === d.id).pag = 'ok'; }); toast(`Pagamento de ${primeiro(d.id)} registrado`); },
  cobrarTodos: () => {
    if (!get().alunos.some(a => a.pag === 'atraso')) { toast('Nenhuma mensalidade atrasada'); return; }
    update(n => { n.alunos.forEach(a => { if (a.pag === 'atraso') a.pag = 'pix'; }); n.feitos.pix = true; });
    toast('Cobrança por Pix enviada para os atrasados');
  },
  dia: d => { ui.dia = +d.i; ui.slot = null; redraw(); },
  slot: d => { ui.slot = ui.slot === d.k ? null : d.k; redraw(); },
  fechar: () => { ui.slot = null; ui.biblio = false; ui.remarcar = null; redraw(); },
  cancelarAula: d => {
    const id = get().agenda[d.dia][d.hora];
    update(n => { delete n.agenda[d.dia][d.hora]; });
    ui.slot = null;
    toast(`Aula de ${primeiro(id)} cancelada e aluno avisado`);
  },
  agendarAula: d => {
    update(n => { (n.agenda[d.dia] ||= {})[d.hora] = d.id; });
    ui.slot = null;
    toast(`Aula de ${primeiro(d.id)} marcada. Lembrete vai no WhatsApp`);
  },
  exAj: d => mexer(d, arr => {
    const e = arr.find(x => x.uid === d.u);
    if (!e) return;
    const dt = +d.dt;
    if (d.f === 'series') e.series = Math.min(8, Math.max(1, e.series + dt));
    if (d.f === 'reps') e.reps = Math.min(90, Math.max(1, e.reps + dt * (lib(e.ref).seg ? 5 : 1)));
    if (d.f === 'carga') e.carga = Math.max(0, e.carga + dt * (e.carga >= 50 ? 5 : 2));
  }),
  exMover: d => mexer(d, arr => {
    const i = arr.findIndex(x => x.uid === d.u), j = i + +d.dir;
    if (i < 0 || j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }),
  exDel: d => {
    const e = get().fichas[d.id][d.l].find(x => x.uid === d.u);
    mexer(d, arr => { const i = arr.findIndex(x => x.uid === d.u); if (i >= 0) arr.splice(i, 1); });
    if (e) toast(`${lib(e.ref).nome} removido da ficha`);
  },
  exAdd: d => {
    const a = aluno(d.id);
    const [sr, rp] = padraoSR(a.obj);
    const L = lib(d.ref);
    mexer(d, arr => arr.push({ uid: uid(), ref: d.ref, series: sr, reps: L.seg ? 40 : rp, carga: L.carga }));
    toast(`${L.nome} adicionado ao Treino ${d.l}`);
  },
  abrirBiblio: () => { ui.biblio = true; redraw(); },
  bGrupo: d => { ui.bGrupo = d.v; redraw(); },
  bBusca: v => { ui.bBusca = v; redraw(); },
  salvarTreino: d => {
    update(n => { const a = n.alunos.find(x => x.id === d.id); a.treinoNovo = d.l; }, { de: 'p', aluno: d.id, txt: `Treino ${d.l} de ${primeiro(d.id)} atualizado` });
    ui.salvo = true;
    toast(`Treino ${d.l} enviado para ${primeiro(d.id)}`);
  },
  msgP: (fd, form) => {
    const txt = String(fd.get('txt') || '').trim();
    if (!txt) return;
    const id = form.dataset.id;
    update(n => { (n.msgs[id] ||= []).push({ de: 'p', txt, t: Date.now() }); n.lidas.p[id] = n.msgs[id].length; });
  },
  medidaP: (fd, form) => {
    const peso = parseFloat(String(fd.get('peso')).replace(',', '.'));
    if (!(peso > 30 && peso < 250)) { toast('Informe um peso válido'); return; }
    const id = form.dataset.id;
    update(n => { const m = n.medidas[id] ||= []; const ult = m.at(-1) || {}; m.push({ d: '2026-10-27', peso, cintura: ult.cintura, gordura: ult.gordura }); });
    toast(`Peso de ${primeiro(id)} registrado: ${fmt(peso)} kg`);
  }
};
