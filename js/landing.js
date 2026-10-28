// Página de entrada do Pump: motion design guiado pelo toque e pelo mouse.
// Tudo anima só "transform" e "opacity" (ou atributos de SVG), num único laço de quadros
// que só roda com a página visível e desliga para quem pede menos movimento.
import { html, raw, ic } from './ui.js';

const PALAVRAS = ['Seus', 'alunos,', 'treinos', 'e', 'mensalidades', 'no', 'mesmo', 'lugar.'];
const RECURSOS = [
  ['peso', 'Treinos que o aluno segue', 'Ficha com vídeo, carga e descanso. Cada série marcada no celular chega para você na hora.'],
  ['evo', 'Evolução à vista', 'Peso, medidas e cargas viram gráfico. Você vê quem progride e quem precisa de ajuste.'],
  ['sino', 'Alertas que seguram aluno', 'Sumiu há 7 dias? Carga parada? O Pump avisa antes de você perder o aluno.'],
  ['pix', 'Mensalidade sem constrangimento', 'Cobrança por Pix e lembrete automático para quem atrasou.']
];
const PASSOS = [
  ['1', 'Monte o treino', 'Escolha exercícios da biblioteca, ajuste séries e carga.'],
  ['2', 'O aluno treina', 'Ele segue a ficha no celular, com vídeo e cronômetro.'],
  ['3', 'Você acompanha', 'Resultado, peso e mensagens chegam ao vivo.']
];

export function view({ marca, ui }) {
  const pal = PALAVRAS.map((p, i) => html`<span class="w"><span style="--i:${i}">${p}</span></span> `);
  return html`<div class="lp">
    <div class="lp-progress" aria-hidden="true"><i></i></div>
    <header class="lp-nav">
      ${marca}
      <nav aria-label="Seções"><a href="#recursos" data-scroll>Recursos</a><a href="#como" data-scroll>Como funciona</a></nav>
      <a class="btn sm mag" href="#/p/hoje"><span>Entrar</span></a>
    </header>

    <section class="lp-hero">
      <div class="lp-glow" aria-hidden="true"></div>
      <div class="lp-copy">
        <span class="pill ok lp-in" style="--d:0">Treino em ritmo.</span>
        <h1 class="lp-title" aria-label="${PALAVRAS.join(' ')}"><span aria-hidden="true">${pal}</span></h1>
        <p class="lp-sub lp-in" style="--d:6">Monte treinos, acompanhe a evolução e receba por Pix. O aluno treina pelo celular e você vê tudo na hora.</p>
        <div class="lp-ctas lp-in" style="--d:7">
          <a class="btn p lg mag" href="#/p/hoje"><span>Entrar como personal</span>${ic('seta', 18)}</a>
          <a class="btn lg mag" href="#/a/inicio"><span>Entrar como aluno</span></a>
        </div>
        <a class="lp-in lp-link" style="--d:8" href="#/cadastro">Sou personal e quero criar minha conta →</a>
      </div>

      <div class="lp-stage lp-in" style="--d:4" aria-hidden="true">
        <div class="lp-phone">
          <div class="ph-top"><span class="ph-eyebrow">Treino B · Inferiores</span><strong>Leg press 45°</strong></div>
          <div class="ph-rows">
            ${[1, 2, 3, 4].map(n => html`<div class="ph-row" style="--n:${n}"><span>${n}</span><span>${n > 2 ? '130' : '120'} kg</span><span>${n > 2 ? 10 : 12}</span><b class="ph-ck">${ic('check', 12)}</b></div>`)}
          </div>
          <div class="ph-rest"><svg viewBox="0 0 44 44"><circle cx="22" cy="22" r="18"/><circle class="ph-ring" cx="22" cy="22" r="18"/></svg><span><small>Descanso</small><b>0:45</b></span></div>
          <div class="ph-btn">Concluir série</div>
        </div>
        <div class="lp-float f1"><span class="ping" style="color:var(--a-ink)"></span><span><b>Juliana registrou 72,1 kg</b><small>agora</small></span></div>
        <div class="lp-float f2"><span class="ping" style="color:var(--warn)"></span><span><b>Lucas sumiu há 9 dias</b><small>Chamar no WhatsApp</small></span></div>
      </div>
    </section>

    <section class="lp-beat" aria-label="Pulso interativo: passe o dedo ou o mouse">
      <svg viewBox="0 0 1200 200" preserveAspectRatio="none" aria-hidden="true"><path class="beat-shadow"/><path class="beat"/></svg>
      <p class="lp-hint">Passe o dedo ou toque na linha</p>
    </section>

    <div class="marquee" aria-hidden="true"><div class="track">${[0, 1].map(() => html`<span>Treinos</span><i></i><span>Agenda</span><i></i><span>Evolução</span><i></i><span>Pix</span><i></i><span>Alertas</span><i></i><span>Chat</span><i></i>`)}</div></div>

    <section class="lp-sec" id="recursos">
      <div class="lp-head rv"><span class="lbl">Recursos</span><h2>Tudo que o personal precisa, nada que atrapalha</h2></div>
      <div class="lp-feats">${RECURSOS.map(([i, t, d], k) => html`<article class="lp-card spot rv" style="--d:${k}"><span class="lp-ic">${ic(i, 22)}</span><h3>${t}</h3><p>${d}</p></article>`)}</div>
    </section>

    <section class="lp-stats" aria-label="Números do exemplo">
      <div class="rv"><b class="count" data-to="5.6" data-dec="1" data-pre="−" data-suf=" kg">0</b><span>perdidos pela aluna do exemplo em 6 meses</span></div>
      <div class="rv" style="--d:1"><b class="count" data-to="24" data-suf=" séries">0</b><span>registradas num único treino, ao vivo</span></div>
      <div class="rv" style="--d:2"><b class="count" data-to="1" data-pre="&lt; " data-suf=" s">0</b><span>para o personal ver o que o aluno fez</span></div>
    </section>

    <section class="lp-sec" id="como">
      <div class="lp-head rv"><span class="lbl">Como funciona</span><h2>Três passos, um ritmo</h2></div>
      <div class="lp-steps rv">
        <svg class="lp-steps-line" viewBox="0 0 1000 40" preserveAspectRatio="none" aria-hidden="true"><path d="M0 20H420l16-14 22 28 22-28 16 14H1000"/></svg>
        ${PASSOS.map(([n, t, d], k) => html`<div class="lp-step" style="--d:${k + 1}"><span class="lp-num">${n}</span><h3>${t}</h3><p>${d}</p></div>`)}
      </div>
    </section>

    <section class="lp-cta rv">
      <h2>Comece agora. Sem instalar nada.</h2>
      <p>Abra o personal numa aba e o aluno em outra: o que um faz, o outro vê na hora.</p>
      <div class="lp-ctas"><a class="btn p lg mag" href="#/cadastro"><span>Criar conta de treinador</span>${ic('seta', 18)}</a><a class="btn lg mag" href="#/p/hoje"><span>Ver demonstração</span></a></div>
    </section>

    <footer class="foot"><span>Pump · demonstração local: os dados ficam só neste navegador.</span><button type="button" class="btn sm" data-act="resetar">Restaurar dados de exemplo</button></footer>
  </div>`;
}

const lerp = (a, b, t) => a + (b - a) * t;

// Liga todos os movimentos. Devolve uma função que desliga tudo (chamada antes de redesenhar).
export function mount(root) {
  const lp = root.querySelector('.lp');
  if (!lp) return () => {};
  const calmo = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fora = [];
  const on = (el, ev, fn, opt) => { el.addEventListener(ev, fn, opt); fora.push(() => el.removeEventListener(ev, fn, opt)); };

  requestAnimationFrame(() => lp.classList.add('ready'));
  setTimeout(() => lp.classList.add('ready'), 60);

  // Revelar ao rolar + contadores.
  const contar = el => {
    const to = parseFloat(el.dataset.to), dec = +(el.dataset.dec || 0), pre = el.dataset.pre || '', suf = el.dataset.suf || '';
    const fmt = v => pre + v.toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suf;
    if (calmo) { el.textContent = fmt(to); return; }
    const t0 = performance.now();
    const passo = t => {
      const k = Math.min(1, (t - t0) / 1300), e = 1 - Math.pow(1 - k, 4);
      el.textContent = fmt(to * e);
      if (k < 1) requestAnimationFrame(passo);
    };
    requestAnimationFrame(passo);
  };
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in');
    e.target.querySelectorAll?.('.count').forEach(contar);
    io.unobserve(e.target);
  }), { threshold: 0.2, rootMargin: '0px 0px -8% 0px' });
  lp.querySelectorAll('.rv').forEach(el => io.observe(el));
  fora.push(() => io.disconnect());

  // Rolagem suave para as seções + barra de progresso.
  lp.querySelectorAll('[data-scroll]').forEach(a => on(a, 'click', e => {
    e.preventDefault();
    lp.querySelector(a.getAttribute('href'))?.scrollIntoView({ behavior: calmo ? 'auto' : 'smooth' });
  }));
  const barra = lp.querySelector('.lp-progress i');
  const rolou = () => {
    const h = document.documentElement.scrollHeight - innerHeight;
    barra.style.transform = `scaleX(${h > 0 ? (scrollY / h).toFixed(4) : 0})`;
    lp.classList.toggle('scrolled', scrollY > 12);
  };
  on(window, 'scroll', rolou, { passive: true });
  rolou();

  // Luz do cartão segue o dedo/mouse.
  lp.querySelectorAll('.spot').forEach(c => on(c, 'pointermove', e => {
    const r = c.getBoundingClientRect();
    c.style.setProperty('--x', `${e.clientX - r.left}px`);
    c.style.setProperty('--y', `${e.clientY - r.top}px`);
  }));

  if (calmo) return () => fora.forEach(f => f());

  // Botões magnéticos (só com mouse; no toque, um leve afundar via CSS).
  lp.querySelectorAll('.mag').forEach(b => {
    on(b, 'pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      const r = b.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / r.width, dy = (e.clientY - (r.top + r.height / 2)) / r.height;
      b.style.transform = `translate(${(dx * 10).toFixed(1)}px, ${(dy * 8).toFixed(1)}px)`;
      b.firstElementChild && (b.firstElementChild.style.transform = `translate(${(dx * 4).toFixed(1)}px, ${(dy * 3).toFixed(1)}px)`);
    });
    on(b, 'pointerleave', () => { b.style.transform = ''; b.firstElementChild && (b.firstElementChild.style.transform = ''); });
  });

  // Estado compartilhado pelo laço de quadros.
  const hero = lp.querySelector('.lp-hero');
  const glow = lp.querySelector('.lp-glow');
  const phone = lp.querySelector('.lp-phone');
  const stage = lp.querySelector('.lp-stage');
  const beatSec = lp.querySelector('.lp-beat');
  const beat = lp.querySelector('.beat');
  const sombra = lp.querySelector('.beat-shadow');
  const st = {
    gx: 0.7, gy: 0.3, tgx: 0.7, tgy: 0.3,          // luz do topo
    rx: 0, ry: 0, trx: 0, try: 0,                  // inclinação do celular
    bx: 600, tbx: 600, amp: 34, ativo: false, ultimo: 0, vel: 0, t: 0
  };

  on(hero, 'pointermove', e => {
    const r = hero.getBoundingClientRect();
    st.tgx = (e.clientX - r.left) / r.width; st.tgy = (e.clientY - r.top) / r.height;
    const s = stage.getBoundingClientRect();
    st.try = ((e.clientX - (s.left + s.width / 2)) / s.width) * 16;
    st.trx = -((e.clientY - (s.top + s.height / 2)) / s.height) * 12;
  }, { passive: true });
  on(hero, 'pointerleave', () => { st.trx = 0; st.try = 0; });

  // Giroscópio do celular inclina o mockup (quando o aparelho permite sem pedir).
  on(window, 'deviceorientation', e => {
    if (e.gamma == null) return;
    st.try = Math.max(-14, Math.min(14, e.gamma * 0.5));
    st.trx = Math.max(-10, Math.min(10, (e.beta - 45) * -0.3));
  }, { passive: true });

  // Pulso interativo: o pico segue o dedo, a velocidade aumenta a batida, o toque dispara um batimento.
  const posBeat = e => {
    const r = beatSec.getBoundingClientRect();
    return ((e.clientX - r.left) / r.width) * 1200;
  };
  on(beatSec, 'pointermove', e => {
    const x = posBeat(e);
    st.vel = Math.min(80, Math.abs(x - st.tbx));
    st.tbx = x; st.ativo = true; st.ultimo = performance.now();
  }, { passive: true });
  on(beatSec, 'pointerdown', e => {
    st.tbx = st.bx = posBeat(e); st.amp = 96; st.ativo = true; st.ultimo = performance.now();
    beatSec.classList.remove('hit'); void beatSec.offsetWidth; beatSec.classList.add('hit');
    if (e.isTrusted && navigator.userActivation?.hasBeenActive) navigator.vibrate?.(12);
  });

  const caminho = (x, a) => {
    const y = 100;
    return `M0 ${y}H${(x - 62).toFixed(1)}L${(x - 40).toFixed(1)} ${(y - a * 0.35).toFixed(1)}L${(x - 16).toFixed(1)} ${(y + a).toFixed(1)}L${(x + 10).toFixed(1)} ${(y - a).toFixed(1)}L${(x + 32).toFixed(1)} ${(y + a * 0.3).toFixed(1)}L${(x + 52).toFixed(1)} ${y}H1200`;
  };

  let visivel = { hero: true, beat: false };
  const io2 = new IntersectionObserver(es => es.forEach(e => { visivel[e.target === hero ? 'hero' : 'beat'] = e.isIntersecting; if (e.isIntersecting) acordar(); }), { threshold: 0 });
  io2.observe(hero); io2.observe(beatSec);
  fora.push(() => io2.disconnect());

  let raf = 0;
  const quadro = t => {
    raf = 0;
    st.t = t / 1000;
    if (visivel.hero) {
      st.gx = lerp(st.gx, st.tgx, 0.08); st.gy = lerp(st.gy, st.tgy, 0.08);
      glow.style.transform = `translate3d(${(st.gx * 100 - 50).toFixed(2)}%, ${(st.gy * 100 - 50).toFixed(2)}%, 0)`;
      st.rx = lerp(st.rx, st.trx, 0.1); st.ry = lerp(st.ry, st.try, 0.1);
      phone.style.transform = `rotateX(${st.rx.toFixed(2)}deg) rotateY(${st.ry.toFixed(2)}deg)`;
    }
    if (visivel.beat) {
      const parado = performance.now() - st.ultimo > 1600;
      if (parado) { st.ativo = false; st.tbx = 600 + Math.sin(st.t * 0.6) * 420; }
      st.bx = lerp(st.bx, st.tbx, st.ativo ? 0.22 : 0.04);
      const alvo = 30 + st.vel * 0.8 + Math.max(0, Math.sin(st.t * 5.2)) * 10;
      st.amp = lerp(st.amp, alvo, 0.12);
      st.vel *= 0.9;
      const d = caminho(st.bx, st.amp);
      beat.setAttribute('d', d);
      sombra.setAttribute('d', d);
    }
    if (visivel.hero || visivel.beat) raf = requestAnimationFrame(quadro);
  };
  const acordar = () => { if (!raf && !document.hidden) raf = requestAnimationFrame(quadro); };
  on(document, 'visibilitychange', acordar);
  acordar();
  beat.setAttribute('d', caminho(600, 34)); sombra.setAttribute('d', caminho(600, 34));
  fora.push(() => cancelAnimationFrame(raf));

  return () => fora.forEach(f => f());
}
