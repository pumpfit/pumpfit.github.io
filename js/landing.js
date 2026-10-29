// Página de entrada do Pump: o painel de partidas do dia do personal, ao vivo.
// O único movimento é o do painel: a linha que muda desliza até o novo lugar (transform)
// e a situação vira como uma placa. Só roda com o painel visível; quem pede menos movimento vê o painel parado.
import { html, ic } from './ui.js';

const RECURSOS = [
  ['peso', 'Treinos que o aluno segue', 'Ficha com vídeo, carga e descanso. Cada série marcada no celular chega para você na hora.'],
  ['evo', 'Evolução à vista', 'Peso, medidas e cargas viram gráfico. Você vê quem progride e quem precisa de ajuste.'],
  ['sino', 'Alertas que seguram aluno', 'Sumiu há 7 dias? Carga parada? O Pump avisa antes de você perder o aluno.'],
  ['pix', 'Mensalidade sem constrangimento', 'Cobrança por Pix e lembrete automático para quem atrasou.']
];
const PASSOS = [
  ['Monte o treino', 'Escolha exercícios da biblioteca, ajuste séries e carga.'],
  ['O aluno treina', 'Ele segue a ficha no celular, com vídeo e cronômetro.'],
  ['Você acompanha', 'Resultado, peso, remarcações e mensagens chegam ao vivo.']
];

// Alunos do exemplo e os quadros da demonstração (cada quadro é o painel inteiro, já em ordem).
const ALUNOS = {
  marina: ['Marina Souza', 'Definição', 'B · Inferiores'],
  carla: ['Carla Bento', 'Ganhar massa', 'A · Superiores'],
  juliana: ['Juliana Costa', 'Emagrecer', 'C · Core e braços'],
  pedro: ['Pedro Alves', 'Emagrecer', 'C · Core e braços']
};
const QUADROS = [
  [['juliana', '09:00', 'prox'], ['pedro', '10:30', 'conf'], ['carla', '18:00', 'chg'], ['marina', '07:00', 'feita']],
  [['pedro', '10:30', 'prox'], ['carla', '18:00', 'chg'], ['marina', '07:00', 'feita'], ['juliana', '09:00', 'feita']],
  [['pedro', '10:30', 'prox'], ['carla', '18:00', 'conf'], ['marina', '07:00', 'feita'], ['juliana', '09:00', 'feita']],
  [['carla', '08:00', 'prox'], ['juliana', '09:00', 'conf'], ['pedro', '10:30', 'conf'], ['marina', '07:00', 'feita']]
];
const SIT = {
  prox: ['is-now', 'Próxima', 'Presença'],
  conf: ['', 'Confirmada', ''],
  chg: ['is-chg', 'Remarcou · era 08:00', 'Visto'],
  feita: ['is-done', 'Feita', '']
};

const linha = ([id, h, st]) => {
  const [nome, obj, ficha] = ALUNOS[id];
  const [cls, txt, btn] = SIT[st];
  return html`<tr class="${cls}" data-id="${id}" data-st="${st}">
    <td class="h">${h}</td>
    <td class="who"><a tabindex="-1">${nome}</a><span>${obj}</span></td>
    <td class="fx">${ficha}</td>
    <td class="st"><b>${txt}</b>${btn ? html`<span class="btn sm">${btn}</span>` : ''}</td>
  </tr>`;
};

export function view({ marca }) {
  return html`<div class="lp">
    <header class="lp-nav">
      ${marca}
      <nav aria-label="Seções"><a href="#recursos" data-scroll>Recursos</a><a href="#como" data-scroll>Como funciona</a></nav>
      <a class="btn sm" href="#/p/hoje">Entrar</a>
    </header>

    <section class="lp-hero">
      <div class="lp-copy lp-in">
        <h1 class="lp-title">Seus alunos, treinos e mensalidades no mesmo lugar.</h1>
        <p class="lp-sub">Monte treinos, acompanhe a evolução e receba por Pix. O aluno treina pelo celular, remarca pelo app, e você vê tudo na hora, em ordem de horário.</p>
        <div class="lp-ctas">
          <a class="btn p lg" href="#/p/hoje">Entrar como personal${ic('seta', 18)}</a>
          <a class="btn lg" href="#/a/inicio">Entrar como aluno</a>
        </div>
        <a class="lp-link" href="#/cadastro">Sou personal e quero criar minha conta${ic('seta', 16)}</a>
      </div>

      <figure class="lp-board lp-in" style="--d:2" aria-label="Exemplo: o painel de partidas de um dia de personal">
        <figcaption class="lp-board-h"><strong>Partidas de hoje</strong><span class="mono">Ter 27 out · exemplo</span></figcaption>
        <table class="brd" aria-hidden="true">
          <thead><tr><th>Hora</th><th>Aluno</th><th class="fx">Ficha</th><th>Situação</th></tr></thead>
          <tbody>${QUADROS[0].map(linha)}</tbody>
        </table>
        <p class="lp-board-f"><span class="mark" style="color:var(--chg)"></span>O que o aluno muda acende em laranja até você tocar em Visto.</p>
      </figure>
    </section>

    <section class="lp-sec" id="recursos">
      <div class="lp-head rv"><h2>Tudo que o personal precisa, nada que atrapalha</h2></div>
      <div class="lp-feats">${RECURSOS.map(([i, t, d], k) => html`<article class="lp-feat rv" style="--d:${k}"><span class="lp-ic">${ic(i, 22)}</span><h3>${t}</h3><p>${d}</p></article>`)}</div>
    </section>

    <section class="lp-sec" id="como">
      <div class="lp-head rv"><h2>Três passos, do treino ao resultado</h2></div>
      <ol class="lp-pass rv">${PASSOS.map(([t, d], k) => html`<li><span class="lbl">Passo ${k + 1} de 3</span><h3>${t}</h3><p>${d}</p></li>`)}</ol>
    </section>

    <section class="lp-cta rv">
      <h2>Comece agora. Sem instalar nada.</h2>
      <p>Abra o personal numa aba e o aluno em outra: o que um faz, o outro vê na hora.</p>
      <div class="lp-ctas"><a class="btn p lg" href="#/cadastro">Criar conta de treinador${ic('seta', 18)}</a><a class="btn lg" href="#/p/hoje">Ver demonstração</a></div>
    </section>

    <footer class="foot"><span>Pump · demonstração local: os dados ficam só neste navegador.</span><button type="button" class="btn sm" data-act="resetar">Restaurar dados de exemplo</button></footer>
  </div>`;
}

// Liga os movimentos. Devolve uma função que desliga tudo (chamada antes de redesenhar).
export function mount(root) {
  const lp = root.querySelector('.lp');
  if (!lp) return () => {};
  const calmo = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fora = [];
  const on = (el, ev, fn, opt) => { el.addEventListener(ev, fn, opt); fora.push(() => el.removeEventListener(ev, fn, opt)); };

  requestAnimationFrame(() => lp.classList.add('ready'));
  setTimeout(() => lp.classList.add('ready'), 60);

  // Revelar ao rolar.
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in');
    io.unobserve(e.target);
  }), { threshold: 0.2, rootMargin: '0px 0px -8% 0px' });
  lp.querySelectorAll('.rv').forEach(el => io.observe(el));
  fora.push(() => io.disconnect());

  // Rolagem suave para as seções; barra de cima ganha borda ao rolar.
  lp.querySelectorAll('[data-scroll]').forEach(a => on(a, 'click', e => {
    e.preventDefault();
    lp.querySelector(a.getAttribute('href'))?.scrollIntoView({ behavior: calmo ? 'auto' : 'smooth' });
  }));
  const rolou = () => lp.classList.toggle('scrolled', scrollY > 12);
  on(window, 'scroll', rolou, { passive: true });
  rolou();

  if (calmo) return () => fora.forEach(f => f());

  // Painel ao vivo: troca de quadro a cada poucos segundos, só com o painel visível e sem o mouse em cima.
  const board = lp.querySelector('.lp-board');
  const corpo = board.querySelector('tbody');
  let i = 0, timer = 0, visivel = false, parado = false;
  const aplicar = q => {
    const antes = new Map([...corpo.rows].map(r => [r.dataset.id, { y: r.getBoundingClientRect().top, st: r.dataset.st }]));
    corpo.innerHTML = q.map(linha).map(x => x.__raw).join('');
    [...corpo.rows].forEach(r => {
      const a = antes.get(r.dataset.id);
      if (!a) return;
      if (a.st !== r.dataset.st) r.querySelector('.st b')?.classList.add('flap');
      const dy = a.y - r.getBoundingClientRect().top;
      if (dy) r.animate([{ transform: `translateY(${dy}px)` }, { transform: 'none' }], { duration: 520, easing: 'cubic-bezier(.2,.8,.2,1)' });
    });
  };
  const passo = () => {
    timer = 0;
    if (!visivel || parado || document.hidden) return;
    i = (i + 1) % QUADROS.length;
    aplicar(QUADROS[i]);
    timer = setTimeout(passo, i === 0 ? 3600 : 2600);
  };
  const acordar = () => { if (!timer && visivel && !parado && !document.hidden) timer = setTimeout(passo, 2200); };
  const io2 = new IntersectionObserver(es => { visivel = es[0].isIntersecting; acordar(); }, { threshold: 0.4 });
  io2.observe(board);
  on(board, 'pointerenter', () => { parado = true; });
  on(board, 'pointerleave', () => { parado = false; acordar(); });
  on(document, 'visibilitychange', acordar);
  fora.push(() => { io2.disconnect(); clearTimeout(timer); });

  return () => fora.forEach(f => f());
}
