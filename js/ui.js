// Utilidades de interface: montagem segura de HTML, ícones, avisos e formatação.

export const raw = s => ({ __raw: String(s) });
const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = s => String(s).replace(/[&<>"']/g, c => ESC[c]);
const part = v => (v == null || v === false ? '' : v.__raw !== undefined ? v.__raw : esc(v));

// html`...` escapa tudo que vem de dados; listas e trechos html`` aninhados entram como estão.
export function html(strings, ...vals) {
  let out = '';
  strings.forEach((s, i) => {
    out += s;
    if (i < vals.length) {
      const v = vals[i];
      out += Array.isArray(v) ? v.map(part).join('') : part(v);
    }
  });
  return raw(out);
}

const P = {
  hoje: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
  alunos: '<circle cx="9" cy="8" r="4"/><path d="M2 21c0-4 3-6 7-6s7 2 7 6M17 11a3 3 0 1 0 0-6M22 21c0-3-2-5-4-5.5"/>',
  peso: '<path d="M6 7v10M18 7v10M3 10v4M21 10v4M6 12h12"/>',
  agenda: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  fin: '<rect x="2" y="6" width="20" height="13" rx="3"/><path d="M2 10h20M6 15h4"/>',
  casa: '<path d="M3 11 12 4l9 7v9H3z"/>',
  evo: '<path d="m3 17 6-6 4 4 8-8M15 7h6v6"/>',
  chat: '<path d="M4 5h16v11H8l-4 4z"/>',
  busca: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  mais: '<path d="M12 5v14M5 12h14"/>',
  menos: '<path d="M5 12h14"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  cima: '<path d="m6 15 6-6 6 6"/>',
  baixo: '<path d="m6 9 6 6 6-6"/>',
  voltar: '<path d="M15 6l-6 6 6 6"/>',
  seta: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  check: '<path d="m5 12 5 5 9-10"/>',
  play: '<path d="M8 5v14l11-7z" fill="currentColor" stroke="none"/>',
  fogo: '<path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-3 2-4 2-7 2 1 3 3 3 3z"/>',
  sol: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5"/>',
  lua: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  sair: '<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h11"/>',
  pix: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3h-3zM20 14v7h-6"/>',
  sino: '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 21h4"/>',
  enviar: '<path d="M4 12 20 4l-6 16-3-7z"/>'
};
export const ic = (n, s = 20) => raw(`<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n] || ''}</svg>`);

// Aviso curto no rodapé da tela.
let tt;
export function toast(msg) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.innerHTML = `<span class="toast-ic">${ic('check', 14).__raw}</span><span>${esc(msg)}</span>`;
  el.classList.remove('show');
  void el.offsetWidth;
  el.classList.add('show');
  clearTimeout(tt);
  tt = setTimeout(() => el.classList.remove('show'), 2800);
}

export const fmt = n => Number(n).toLocaleString('pt-BR', { maximumFractionDigits: 1 });
export const mesCurto = d => ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'][Number(d.slice(5, 7)) - 1];
// Rótulo do gráfico: avaliações mensais mostram o mês; registros avulsos mostram dia/mês.
export const rotulo = d => (d.slice(8) === '02' ? mesCurto(d) : `${d.slice(8)}/${d.slice(5, 7)}`);
export function ha(t) {
  const m = Math.round((Date.now() - t) / 60000);
  if (m < 1) return 'agora';
  if (m < 60) return `há ${m} min`;
  const h = Math.round(m / 60);
  return h < 24 ? `há ${h} h` : `há ${Math.round(h / 24)} d`;
}

// Gráfico de linha leve (SVG puro) para evolução de medidas.
export function grafico(pontos, { h = 200, label = 'Gráfico' } = {}) {
  if (!pontos.length) return html`<p class="muted">Sem medidas ainda.</p>`;
  const W = 640, pad = 28;
  const vs = pontos.map(p => p.v), mn = Math.min(...vs), mx = Math.max(...vs);
  const x = i => pontos.length === 1 ? W / 2 : pad + i * ((W - pad * 2) / (pontos.length - 1));
  const y = v => mx === mn ? h / 2 : 20 + (mx - v) * ((h - 56) / (mx - mn));
  const linha = pontos.map((p, i) => `${x(i).toFixed(1)},${y(p.v).toFixed(1)}`).join(' ');
  const pts = pontos.map((p, i) => `<circle cx="${x(i).toFixed(1)}" cy="${y(p.v).toFixed(1)}" r="${i === pontos.length - 1 ? 6 : 4}" class="${i === pontos.length - 1 ? 'pt-last' : 'pt'}"/>`).join('');
  const lbl = pontos.map((p, i) => `<text x="${x(i).toFixed(1)}" y="${h - 6}" text-anchor="middle">${esc(p.l)}</text>`).join('');
  return raw(`<svg class="chart" viewBox="0 0 ${W} ${h}" role="img" aria-label="${esc(label)}"><g class="grid-l"><line x1="0" x2="${W}" y1="20" y2="20"/><line x1="0" x2="${W}" y1="${(h - 36) / 2 + 10}" y2="${(h - 36) / 2 + 10}"/><line x1="0" x2="${W}" y1="${h - 36}" y2="${h - 36}"/></g><polyline class="draw" points="${linha}"/>${pts}<g class="lbl">${lbl}</g></svg>`);
}

// Pedido de redesenho da tela (o app.js liga isto ao agendador).
export const bus = { render: () => {} };

// Ui de sessão (não salva): telas abertas, filtros, treino em andamento.
export const ui = {
  busca: '', filtro: 'Todos', finFiltro: 'Todos', dia: 1, slot: null,
  biblio: false, bBusca: '', bGrupo: 'Todos', salvo: true,
  aFicha: 'B', aberto: null, tr: null, nota: null, metrica: 'peso', periodo: 6,
  remarcar: null, pixAberto: false, texto: '', textoP: ''
};
