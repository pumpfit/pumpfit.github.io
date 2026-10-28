// Lado do aluno (Juliana): Início, Treino guiado, Evolução, Agenda, Pagamento e Chat.
import { get, update, NOME_FICHA, DIAS, HORAS, HOJE, EU, lib, aluno } from './store.js';
import { html, raw, ic, ui, toast, fmt, ha, rotulo, grafico, bus } from './ui.js';

const redraw = () => bus.render();
const DIA_FICHA = { A: 'Quinta', B: 'Hoje', C: 'Sábado' };
const naoLidas = s => {
  const m = s.msgs[EU] || [];
  return m.length > (s.lidas.a || 0) && m.at(-1)?.de === 'p';
};

export function nav(r) {
  const v = r.path[0] || 'inicio';
  return [
    { href: '#/a/inicio', label: 'Início', icon: 'casa', cur: v === 'inicio' },
    { href: '#/a/treino', label: 'Treino', icon: 'peso', cur: v === 'treino' },
    { href: '#/a/evolucao', label: 'Evolução', icon: 'evo', cur: v === 'evolucao' },
    { href: '#/a/agenda', label: 'Agenda', icon: 'agenda', cur: v === 'agenda' },
    { href: '#/a/pag', label: 'Pagamentos', icon: 'fin', cur: v === 'pag', mobile: false },
    { href: '#/a/chat', label: 'Chat', icon: 'chat', cur: v === 'chat', dot: naoLidas(get()) }
  ];
}

export function aoEntrar(r) {
  const s = get();
  if (r.path[0] === 'chat' && (s.msgs[EU] || []).length !== s.lidas.a) update(n => { n.lidas.a = (n.msgs[EU] || []).length; });
  if (r.path[0] === 'treino' && aluno(EU)?.treinoNovo) update(n => { delete n.alunos.find(a => a.id === EU).treinoNovo; });
}

export function view(r) {
  const v = r.path[0] || 'inicio';
  if (v === 'treino') return treinoV();
  if (v === 'evolucao') return evolucaoV();
  if (v === 'agenda') return agendaV();
  if (v === 'pag') return pagV();
  if (v === 'chat') return chatV();
  return inicioV();
}

const minhasAulas = s => {
  const out = [];
  for (let d = HOJE; d < DIAS.length; d++) for (const h of HORAS) if (s.agenda[d]?.[h] === EU) out.push({ d, h, feita: !!s.presenca[`${d}-${h}`] });
  return out;
};
const ficha = (s, k) => (s.fichas[EU][k] || []).map(e => ({ ...e, L: lib(e.ref) }));
const resumoEx = e => `${e.series} × ${e.reps}${e.L.seg ? ' s' : ''}${e.carga ? ' · ' + e.carga + ' kg' : ''}`;

/* ---------- Início ---------- */
function inicioV() {
  const s = get();
  const me = aluno(EU);
  const aulas = minhasAulas(s).filter(a => !a.feita);
  const prox = aulas[0];
  const med = s.medidas[EU] || [];
  const dif = med.length > 1 ? med.at(-1).peso - med[0].peso : 0;
  const f = ficha(s, 'B');
  return html`<div class="page ${ui.anim ? 'enter' : ''}">
    <header class="ph"><div><p class="eyebrow">Terça, 27 de outubro</p><h1>Olá, Juliana</h1></div><span class="pill warn" style="gap:6px;font-size:13px;padding:6px 12px">${ic('fogo', 16)}${s.sequencia} dias seguidos</span></header>
    ${me.treinoNovo ? html`<a class="card row" href="#/a/treino" style="padding:12px 16px;border-color:var(--a-line)"><span class="ping" style="color:var(--a-ink)"></span><span class="grow"><span class="t">Seu personal atualizou o Treino ${me.treinoNovo}</span><span class="s">Toque para ver o que mudou</span></span>${ic('seta', 18)}</a>` : ''}
    <section class="hero" aria-label="Treino de hoje">
      <span class="lbl">Treino de hoje · 9h com o personal</span>
      <div><strong class="num" style="font-size:26px;display:block">Treino B · ${NOME_FICHA.B}</strong><span style="opacity:.75">${f.length} exercícios · cerca de ${f.length * 8} min</span></div>
      <div class="grid g2"><button type="button" class="btn" data-act="comecar" data-l="B">Começar treino</button><a class="btn out" href="#/a/treino">Ver exercícios</a></div>
    </section>
    <section class="grid g2 md-g4 ${ui.anim ? 'stagger' : ''}">
      <a class="tile" href="#/a/agenda"><span class="lbl">Próxima aula</span><span class="num" style="font-size:20px">${prox ? `${DIAS[prox.d].n} ${prox.h}` : 'Nenhuma'}</span><span class="small muted">Remarcar ou cancelar</span></a>
      <a class="tile" href="#/a/pag"><span class="lbl">Mensalidade</span><span class="num" style="font-size:20px">${me.nov === 'paga' ? 'Paga' : 'Vence 10/11'}</span><span class="small muted">${me.nov === 'paga' ? 'Novembro em dia' : 'Pagar com Pix'}</span></a>
      <a class="tile" href="#/a/evolucao"><span class="lbl">Peso</span><span class="num tnum" style="font-size:22px">${med.length ? fmt(med.at(-1).peso) + ' kg' : '—'}</span><span class="small" style="color:var(--a-ink);font-weight:600">${dif ? (dif < 0 ? '−' : '+') + fmt(Math.abs(dif)) + ' kg' : 'Registrar'}</span></a>
      <a class="tile" href="#/a/chat"><span class="lbl">Personal</span><span class="num" style="font-size:20px">Mensagens</span><span class="small ${naoLidas(s) ? '' : 'muted'}" style="${naoLidas(s) ? 'color:var(--a-ink);font-weight:600' : ''}">${naoLidas(s) ? 'Nova mensagem' : 'Dúvidas e ajustes'}</span></a>
    </section>
  </div>`;
}

/* ---------- Treino ---------- */
function treinoV() {
  if (ui.tr?.fim) return fimV();
  if (ui.tr) return treinandoV();
  const s = get();
  const k = ui.aFicha;
  const f = ficha(s, k);
  return html`<div class="page ${ui.anim ? 'enter' : ''}">
    <header class="ph"><div><p class="eyebrow">Montado pelo seu personal</p><h1>Meu treino</h1></div><button type="button" class="btn" data-act="pedirAjuste">Pedir ajuste</button></header>
    <div class="seg g3 grid" role="group" aria-label="Escolher treino">${['A', 'B', 'C'].map(x => html`<button type="button" class="segbtn" aria-pressed="${x === k}" data-act="aFicha" data-v="${x}"><strong class="num" style="font-size:18px">Treino ${x}</strong><span class="muted small">${DIA_FICHA[x]}</span></button>`)}</div>
    <div class="grid lg-21">
      <section class="card" style="padding-block:6px" aria-label="Exercícios">
        <div class="list">${f.map((e, i) => {
          const ab = ui.aberto === i;
          return html`<div><button type="button" class="row" aria-expanded="${ab}" data-act="abrirEx" data-i="${i}">
            <span class="av num" style="width:32px;height:32px;border-radius:10px;font-size:13px">${i + 1}</span>
            <span class="grow"><span class="t">${e.L.nome}</span><span class="s">${resumoEx(e)}</span></span>
            <span style="transform:rotate(${ab ? 180 : 0}deg);transition:transform .25s">${ic('baixo', 18)}</span></button>
            ${ab ? html`<div class="enter" style="display:flex;gap:12px;align-items:center;padding:4px 0 16px 44px">
              <button type="button" class="video" style="width:96px;aspect-ratio:1;border-radius:16px" data-act="video" data-n="${e.L.nome}" aria-label="Ver vídeo de ${e.L.nome}"><span class="play" style="width:40px;height:40px">${ic('play', 16)}</span></button>
              <p class="small" style="color:var(--tx)"><strong>Dica do personal:</strong> ${e.L.dica}</p></div>` : ''}</div>`;
        })}</div>
      </section>
      <aside class="card page" style="gap:12px">
        <span class="lbl">${DIA_FICHA[k]}</span>
        <h2 class="num" style="font-size:24px;font-family:var(--fd)">Treino ${k} · ${NOME_FICHA[k]}</h2>
        <p class="muted">${f.length} exercícios · cerca de ${f.length * 8} min. Você marca cada série e ajusta a carga que usou; o personal recebe o resumo.</p>
        <button type="button" class="btn p lg block" data-act="comecar" data-l="${k}">Começar treino</button>
      </aside>
    </div>
  </div>`;
}

function treinandoV() {
  const s = get();
  const t = ui.tr;
  const f = ficha(s, t.l);
  const e = f[t.ex];
  if (!e) { ui.tr = null; return treinoV(); }
  const feito = t.serie >= e.series;
  const ultimo = t.ex >= f.length - 1;
  const prox = f[t.ex + 1];
  const cargaTxt = c => (e.L.carga === 0 && c === 0 ? 'Corpo' : c + ' kg');
  const series = Array.from({ length: e.series }, (_, i) => {
    const r = t.reg.find(x => x.ex === t.ex && x.serie === i);
    const atual = i === t.serie;
    return html`<div class="serie ${r ? 'feita' : atual ? 'atual' : ''}"><span>${i + 1}</span><span>${cargaTxt(r ? r.carga : atual ? t.carga : e.carga)}</span><span>${r ? r.reps : atual ? t.reps : e.reps}${e.L.seg ? ' s' : ''}</span><span class="ck ${r ? 'on' : ''}" aria-label="${r ? 'Série feita' : 'Série pendente'}">${r ? ic('check', 16) : ''}</span></div>`;
  });
  const frac = t.resto > 0 ? (t.resto / t.total).toFixed(3) : 0;
  return html`<div class="page ${ui.anim ? 'enter' : ''}" style="max-width:760px">
    <header style="display:flex;align-items:center;gap:12px">
      <button type="button" class="icobtn" aria-label="Sair do treino" data-act="sairTreino">${ic('voltar', 18)}</button>
      <div style="flex:1"><span class="lbl">Treino ${t.l} · ${NOME_FICHA[t.l]}</span><div class="num" style="font-size:17px">Exercício ${t.ex + 1} de ${f.length}</div></div>
    </header>
    <div class="prog" style="grid-template-columns:repeat(${f.length},minmax(0,1fr))" role="progressbar" aria-label="Progresso do treino" aria-valuemin="0" aria-valuemax="${f.length}" aria-valuenow="${t.ex}">${f.map((x, i) => html`<i><b style="transform:scaleX(${i < t.ex ? 1 : i === t.ex ? Math.min(1, t.serie / e.series).toFixed(3) : 0})"></b></i>`)}</div>
    <button type="button" class="video" data-act="video" data-n="${e.L.nome}" aria-label="Ver vídeo de ${e.L.nome}"><span class="play">${ic('play', 22)}</span><span class="tag">Vídeo do seu personal</span></button>
    <div><h1 style="font-size:clamp(24px,5vw,32px)">${e.L.nome}</h1><p class="muted small" style="margin-top:4px">Dica: ${e.L.dica}</p></div>
    <div class="page" style="gap:6px"><div class="serie" style="border:0;padding-block:0" aria-hidden="true"><span class="lbl">Série</span><span class="lbl">Carga</span><span class="lbl">${e.L.seg ? 'Tempo' : 'Reps'}</span><span></span></div>${series}</div>
    ${!feito ? html`<div class="grid g2" style="gap:8px">
        <div><div class="stp-lbl">Carga desta série</div><div class="stp"><button type="button" aria-label="Menos carga" data-act="trAj" data-f="carga" data-dt="-1">${ic('menos', 16)}</button><output>${cargaTxt(t.carga)}</output><button type="button" aria-label="Mais carga" data-act="trAj" data-f="carga" data-dt="1">${ic('mais', 16)}</button></div></div>
        <div><div class="stp-lbl">${e.L.seg ? 'Segundos' : 'Repetições'}</div><div class="stp"><button type="button" aria-label="Menos repetições" data-act="trAj" data-f="reps" data-dt="-1">${ic('menos', 16)}</button><output>${t.reps}</output><button type="button" aria-label="Mais repetições" data-act="trAj" data-f="reps" data-dt="1">${ic('mais', 16)}</button></div></div>
      </div>
      <div style="display:flex;gap:8px">
        <button type="button" class="rest ${t.resto > 0 ? '' : 'pronto'}" data-act="pularDescanso" aria-label="Pular descanso"><span class="lbl" style="font-size:10px">${t.resto > 0 ? 'Descanso' : 'Descansou'}</span><span class="num tnum" id="resto-txt">${t.resto > 0 ? relogio(t.resto) : 'Pronto'}</span><span class="bar"><i id="resto-bar" style="transform:scaleX(${frac})"></i></span></button>
        <button type="button" class="btn p lg" style="flex:1" data-act="concluirSerie">Concluir série ${t.serie + 1}</button>
      </div>`
    : html`<div class="page enter" style="gap:8px"><div class="ok-box"><span class="ck on">${ic('check', 16)}</span>${e.L.nome} concluído</div>
      <button type="button" class="btn p lg block" data-act="proximoEx">${ultimo ? 'Finalizar treino' : 'Próximo: ' + prox.L.nome}</button></div>`}
    <p class="small muted" style="text-align:center">${prox ? 'A seguir: ' + prox.L.nome : 'Último exercício do treino'}</p>
  </div>`;
}

function fimV() {
  const t = ui.tr;
  const vol = t.reg.reduce((a, r) => a + (r.carga || 0) * r.reps, 0);
  const subiu = t.subiu || 0;
  return html`<div class="page enter" style="max-width:560px;margin:24px auto 0;text-align:center;align-items:center">
    <span class="av lg" style="width:80px;height:80px">${ic('check', 36)}</span>
    <h1>Treino concluído!</h1>
    <div class="grid g3" style="width:100%">
      <div class="tile" style="min-height:0"><span class="lbl">Séries</span><span class="num" style="font-size:22px">${t.reg.length}</span></div>
      <div class="tile" style="min-height:0"><span class="lbl">Volume</span><span class="num" style="font-size:22px">${fmt(vol)}</span><span class="small muted">kg</span></div>
      <div class="tile" style="min-height:0"><span class="lbl">Sequência</span><span class="num" style="font-size:22px">${get().sequencia + 1}</span><span class="small muted">dias</span></div>
    </div>
    <p style="color:var(--a-ink);font-weight:600">${subiu ? `Você subiu a carga em ${subiu} ${subiu > 1 ? 'exercícios' : 'exercício'}` : 'Mesmas cargas da ficha'}</p>
    <h2>Como foi o treino?</h2>
    <div class="chips" style="justify-content:center;margin:0">${['Leve', 'Na medida', 'Pesado'].map(n => html`<button type="button" class="chip" aria-pressed="${ui.nota === n}" data-act="nota" data-v="${n}">${n}</button>`)}</div>
    <button type="button" class="btn p lg block" data-act="enviarResumo">Enviar resumo ao personal</button>
  </div>`;
}

const relogio = r => `${Math.floor(r / 60)}:${String(r % 60).padStart(2, '0')}`;

/* ---------- Evolução ---------- */
const METRICAS = { peso: ['Peso', 'kg'], cintura: ['Cintura', 'cm'], gordura: ['Gordura', '%'] };
function evolucaoV() {
  const s = get();
  const med = (s.medidas[EU] || []).filter(m => m[ui.metrica] != null);
  const pts = med.slice(-ui.periodo);
  const [nome, un] = METRICAS[ui.metrica];
  const atual = pts.at(-1)?.[ui.metrica];
  const dif = pts.length > 1 ? atual - pts[0][ui.metrica] : 0;
  return html`<div class="page ${ui.anim ? 'enter' : ''}">
    <header class="ph"><div><p class="eyebrow">Última avaliação: ${med.length ? rotulo(med.at(-1).d) : '—'}</p><h1>Evolução</h1></div><button type="button" class="btn" data-act="foto">Foto de progresso</button></header>
    <div class="chips" role="group" aria-label="Medida">${Object.entries(METRICAS).map(([k, [n]]) => html`<button type="button" class="chip" aria-pressed="${ui.metrica === k}" data-act="metrica" data-v="${k}">${n}</button>`)}${[3, 6].map(p => html`<button type="button" class="chip" aria-pressed="${ui.periodo === p}" data-act="periodo" data-v="${p}">${p} medições</button>`)}</div>
    <div class="grid lg-21">
      <section class="card">
        <div class="card-h" style="align-items:flex-end"><div><span class="lbl">${nome}</span><div class="num tnum" style="font-size:36px">${atual != null ? fmt(atual) + ' ' + un : '—'}</div></div><span style="color:var(--a-ink);font-weight:600" class="small">${dif ? (dif < 0 ? '−' : '+') + fmt(Math.abs(dif)) + ' ' + un + ' no período' : ''}</span></div>
        ${grafico(pts.map(m => ({ v: m[ui.metrica], l: rotulo(m.d) })), { label: `${nome} ao longo do tempo` })}
      </section>
      <section class="card page" style="gap:12px">
        <h2>Registrar peso de hoje</h2>
        <p class="muted small">O personal vê na hora, na sua ficha.</p>
        <form class="send" data-submit="medidaA">
          <label class="field" style="flex:1"><span class="sr">Peso em quilos</span><input id="peso-a" name="peso" type="number" inputmode="decimal" step="0.1" min="30" max="250" placeholder="Ex.: 72,1" required></label>
          <button class="btn p" type="submit">Salvar</button>
        </form>
      </section>
    </div>
  </div>`;
}

/* ---------- Agenda ---------- */
function agendaV() {
  const s = get();
  const aulas = minhasAulas(s);
  const livres = [];
  for (let d = HOJE + 1; d < DIAS.length; d++) for (const h of HORAS) if (!s.agenda[d]?.[h]) livres.push({ d, h });
  return html`<div class="page ${ui.anim ? 'enter' : ''}" style="max-width:820px">
    <header class="ph"><div><p class="eyebrow">Lembrete no WhatsApp 1h antes</p><h1>Minhas aulas</h1></div><button type="button" class="btn p" data-act="remarcar" data-k="nova">${ic('mais', 18)}Agendar aula</button></header>
    ${aulas.length ? html`<div class="page ${ui.anim ? 'stagger' : ''}" style="gap:10px">${aulas.map(a => html`<article class="card" style="padding:14px 16px;display:flex;flex-direction:column;gap:12px">
      <div style="display:flex;align-items:center;gap:14px"><div style="text-align:center;width:48px"><span class="lbl">${DIAS[a.d].n}</span><div class="num" style="font-size:24px">${DIAS[a.d].d}</div></div>
        <div style="flex:1"><strong>${a.h} · com o personal</strong><div class="small muted">${a.feita ? 'Presença registrada' : a.d === HOJE ? 'Hoje · confirmada' : 'Confirmada'}</div></div>${a.feita ? html`<span class="pill ok">Feita</span>` : ''}</div>
      ${a.feita ? '' : html`<div class="grid g2" style="gap:8px"><button type="button" class="btn sm" data-act="remarcar" data-k="${a.d}|${a.h}">Remarcar</button><button type="button" class="btn sm warn" data-act="cancelarMinha" data-dia="${a.d}" data-hora="${a.h}">Cancelar</button></div>`}
    </article>`)}</div>` : html`<div class="card muted" style="text-align:center">Nenhuma aula marcada nesta semana.</div>`}
    ${ui.remarcar != null ? html`<button type="button" class="veil" aria-label="Fechar" data-act="fechar"></button>
      <div class="sheet" role="dialog" aria-modal="true" aria-label="Escolher horário">
        <span class="grab"></span>
        <h2>${ui.remarcar === 'nova' ? 'Escolha um horário para a nova aula' : 'Escolha o novo horário'}</h2>
        <div style="display:flex;flex-wrap:wrap;gap:8px">${livres.slice(0, 18).map(l => html`<button type="button" class="chip" data-act="pegarHorario" data-dia="${l.d}" data-hora="${l.h}">${DIAS[l.d].n} ${DIAS[l.d].d} · ${l.h}</button>`)}</div>
        <button type="button" class="btn" data-act="fechar">Fechar</button>
      </div>` : ''}
  </div>`;
}

/* ---------- Pagamento ---------- */
function pagV() {
  const me = aluno(EU);
  const paga = me.nov === 'paga';
  return html`<div class="page ${ui.anim ? 'enter' : ''}" style="max-width:720px">
    <a class="btn sm" href="#/a/inicio" style="align-self:flex-start">${ic('voltar', 16)}Início</a>
    <header class="ph"><div><p class="eyebrow">Plano mensal</p><h1>Pagamento</h1></div></header>
    <section class="card page" style="gap:14px">
      <div class="card-h" style="margin:0;align-items:flex-start"><div><span class="lbl">Mensalidade de novembro</span><div class="num" style="font-size:32px;margin-top:4px">R$ [VALOR]</div><span class="muted small">${paga ? 'Paga · obrigado!' : 'Vence em 10 de novembro'}</span></div>${paga ? html`<span class="pill ok">${ic('check', 14)} Paga</span>` : ''}</div>
      ${paga ? '' : ui.pixAberto ? html`<div class="enter page" style="gap:12px">
          <div class="lbl">Pix copia e cola</div>
          <div class="field" style="font-family:var(--fd);font-size:14px;color:var(--tx2)">[CÓDIGO PIX DO PERSONAL]</div>
          <div class="grid g2"><button type="button" class="btn" data-act="copiarPix">Copiar código</button><button type="button" class="btn p" data-act="jaPaguei">Já paguei</button></div>
          <p class="small muted">Na versão real, o pagamento é confirmado sozinho pelo banco.</p>
        </div>` : html`<button type="button" class="btn p lg block" data-act="abrirPix">${ic('pix', 18)}Pagar com Pix</button>`}
    </section>
    <section class="card"><h2 style="margin-bottom:6px">Histórico</h2><div class="list">${[['Outubro', '08/10'], ['Setembro', '09/09'], ['Agosto', '10/08']].map(([m, d]) => html`<div class="row"><span class="grow"><span class="t">${m}</span></span><span class="small muted">Pago em ${d}</span></div>`)}</div></section>
  </div>`;
}

/* ---------- Chat ---------- */
const RAPIDAS = ['Posso trocar o horário de quinta?', 'Senti dor no joelho', 'Quero ajustar um exercício'];
function chatV() {
  const s = get();
  const msgs = s.msgs[EU] || [];
  return html`<div class="page ${ui.anim ? 'enter' : ''}" style="max-width:760px">
    <header style="display:flex;align-items:center;gap:12px"><span class="av" style="background:var(--a);color:var(--on-a)">PT</span><div><h1 style="font-size:24px">[Nome do personal]</h1><p class="small muted">Responde em até 1 hora</p></div></header>
    <section class="msgs" aria-live="polite" aria-label="Conversa">${msgs.map(m => html`<div class="msg ${m.de === 'a' ? 'eu' : ''}">${m.txt}<time>${ha(m.t)}</time></div>`)}</section>
    <div class="chips" role="group" aria-label="Respostas rápidas">${RAPIDAS.map(t => html`<button type="button" class="chip" data-act="rapida" data-t="${t}">${t}</button>`)}</div>
    <form class="send" data-submit="msgA">
      <label class="field" style="flex:1"><span class="sr">Mensagem</span><input id="msg-a" name="txt" type="text" placeholder="Escreva uma mensagem" value="${ui.texto}" data-in="texto" autocomplete="off" required></label>
      <button class="btn p icon" type="submit" aria-label="Enviar mensagem">${ic('enviar', 18)}</button>
    </form>
  </div>`;
}

/* ---------- descanso: atualiza só o relógio (sem redesenhar a tela) ---------- */
let timer = null;
function descanso(seg) {
  clearInterval(timer);
  ui.tr.resto = seg; ui.tr.total = seg;
  timer = setInterval(() => {
    const t = ui.tr;
    if (!t) { clearInterval(timer); return; }
    t.resto -= 1;
    if (t.resto <= 0) { t.resto = 0; clearInterval(timer); redraw(); return; }
    const txt = document.getElementById('resto-txt');
    const bar = document.getElementById('resto-bar');
    if (txt) txt.textContent = relogio(t.resto);
    if (bar) bar.style.transform = `scaleX(${(t.resto / t.total).toFixed(3)})`;
  }, 1000);
}
export function depoisDeRender() {
  const box = document.querySelector('.msgs[aria-label="Conversa"]');
  if (box) box.lastElementChild?.scrollIntoView({ block: 'nearest' });
}

const enviarMsg = txt => {
  const t = String(txt || '').trim();
  if (!t) return;
  update(n => { (n.msgs[EU] ||= []).push({ de: 'a', txt: t, t: Date.now() }); n.lidas.a = n.msgs[EU].length; }, { de: 'a', aluno: EU, txt: `Juliana: "${t.slice(0, 48)}"` });
  ui.texto = '';
};

export const acts = {
  aFicha: d => { ui.aFicha = d.v; ui.aberto = null; redraw(); },
  abrirEx: d => { ui.aberto = ui.aberto === +d.i ? null : +d.i; redraw(); },
  video: d => toast(`Vídeo de ${d.n}`),
  pedirAjuste: () => { ui.texto = `Quero ajustar um exercício do Treino ${ui.aFicha}: `; location.hash = '#/a/chat'; },
  comecar: d => {
    const e = ficha(get(), d.l)[0];
    if (!e) { toast('Este treino está vazio'); return; }
    ui.tr = { l: d.l, ex: 0, serie: 0, carga: e.carga, reps: e.reps, reg: [], resto: 0, total: 45, subiu: 0 };
    ui.nota = null;
    if (location.hash !== '#/a/treino') location.hash = '#/a/treino'; else redraw();
  },
  trAj: d => {
    const t = ui.tr; const e = ficha(get(), t.l)[t.ex];
    if (d.f === 'carga') t.carga = Math.max(0, t.carga + +d.dt * (t.carga >= 50 ? 5 : 1));
    if (d.f === 'reps') t.reps = Math.max(1, t.reps + +d.dt * (e.L.seg ? 5 : 1));
    redraw();
  },
  concluirSerie: () => {
    const t = ui.tr; const e = ficha(get(), t.l)[t.ex];
    t.reg.push({ ex: t.ex, serie: t.serie, carga: t.carga, reps: t.reps });
    t.serie += 1;
    if (t.serie < e.series) descanso(45); else { clearInterval(timer); t.resto = 0; if (t.reg.some(r => r.ex === t.ex && r.carga > e.carga)) t.subiu += 1; }
    redraw();
  },
  pularDescanso: () => { clearInterval(timer); if (ui.tr) ui.tr.resto = 0; redraw(); },
  proximoEx: () => {
    const t = ui.tr; const f = ficha(get(), t.l);
    clearInterval(timer);
    if (t.ex >= f.length - 1) { t.fim = true; redraw(); return; }
    t.ex += 1; t.serie = 0; t.resto = 0; t.carga = f[t.ex].carga; t.reps = f[t.ex].reps;
    redraw();
  },
  sairTreino: () => { clearInterval(timer); ui.tr = null; redraw(); },
  nota: d => { ui.nota = d.v; redraw(); },
  enviarResumo: () => {
    const t = ui.tr;
    const vol = t.reg.reduce((a, r) => a + (r.carga || 0) * r.reps, 0);
    update(n => {
      n.sessoes.push({ aluno: EU, letra: t.l, series: t.reg.length, volume: vol, subiu: t.subiu, nota: ui.nota, t: Date.now() });
      n.sequencia += 1;
      const me = n.alunos.find(a => a.id === EU); me.ultimo = 'Hoje';
    }, { de: 'a', aluno: EU, txt: `Juliana concluiu o Treino ${t.l} (${t.reg.length} séries${ui.nota ? ', achou ' + ui.nota.toLowerCase() : ''})` });
    ui.tr = null; ui.nota = null;
    toast('Resumo enviado ao personal');
    location.hash = '#/a/inicio';
  },
  metrica: d => { ui.metrica = d.v; redraw(); },
  periodo: d => { ui.periodo = +d.v; redraw(); },
  foto: () => toast('Câmera aberta para a foto de progresso'),
  medidaA: fd => {
    const peso = parseFloat(String(fd.get('peso')).replace(',', '.'));
    if (!(peso > 30 && peso < 250)) { toast('Informe um peso válido'); return; }
    update(n => { const m = n.medidas[EU] ||= []; const ult = m.at(-1) || {}; m.push({ d: '2026-10-27', peso, cintura: ult.cintura, gordura: ult.gordura }); }, { de: 'a', aluno: EU, txt: `Juliana registrou ${fmt(peso)} kg` });
    ui.metrica = 'peso';
    toast(`Peso registrado: ${fmt(peso)} kg. O personal já está vendo`);
  },
  remarcar: d => { ui.remarcar = d.k; redraw(); },
  pegarHorario: d => {
    const alvo = ui.remarcar;
    update(n => {
      if (alvo && alvo !== 'nova') { const [od, oh] = alvo.split('|'); delete n.agenda[od][oh]; }
      (n.agenda[d.dia] ||= {})[d.hora] = EU;
    }, { de: 'a', aluno: EU, txt: `Juliana ${alvo === 'nova' ? 'marcou aula' : 'remarcou para'} ${DIAS[d.dia].n} às ${d.hora}` });
    ui.remarcar = null;
    toast(`Aula ${alvo === 'nova' ? 'marcada' : 'remarcada'} para ${DIAS[d.dia].n} às ${d.hora}`);
  },
  cancelarMinha: d => {
    update(n => { delete n.agenda[d.dia][d.hora]; }, { de: 'a', aluno: EU, txt: `Juliana cancelou a aula de ${DIAS[d.dia].n} às ${d.hora}` });
    toast('Aula cancelada. O personal foi avisado');
  },
  abrirPix: () => { ui.pixAberto = true; redraw(); },
  copiarPix: () => toast('Código Pix copiado'),
  jaPaguei: () => {
    update(n => { n.alunos.find(a => a.id === EU).nov = 'paga'; }, { de: 'a', aluno: EU, txt: 'Juliana pagou novembro por Pix' });
    ui.pixAberto = false;
    toast('Pagamento enviado. O personal recebe a confirmação');
  },
  texto: v => { ui.texto = v; },
  rapida: d => enviarMsg(d.t),
  msgA: fd => enviarMsg(fd.get('txt'))
};
