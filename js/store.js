// Dados do app: uma única fonte compartilhada pelo lado do personal e do aluno.
// Fica salva no navegador (localStorage) e sincroniza entre abas abertas.

const KEY = 'app-personal:v1';

export const LIB = [
  { id: 'agach', nome: 'Agachamento livre', grupo: 'Pernas', carga: 40, dica: 'Joelhos alinhados com a ponta dos pés.' },
  { id: 'leg', nome: 'Leg press 45°', grupo: 'Pernas', carga: 120, dica: 'Desça até 90° sem tirar o quadril do banco.' },
  { id: 'ext', nome: 'Cadeira extensora', grupo: 'Pernas', carga: 35, dica: 'Suba em 1 segundo e desça em 3.' },
  { id: 'pant', nome: 'Panturrilha em pé', grupo: 'Pernas', carga: 0, dica: 'Amplitude completa, sem pressa.' },
  { id: 'stiff', nome: 'Stiff com halteres', grupo: 'Posterior', carga: 28, dica: 'Joelhos levemente dobrados e coluna reta.' },
  { id: 'flex', nome: 'Mesa flexora', grupo: 'Posterior', carga: 30, dica: 'Quadril colado no banco o tempo todo.' },
  { id: 'pelv', nome: 'Elevação pélvica', grupo: 'Glúteos', carga: 60, dica: 'Segure 1 segundo lá em cima.' },
  { id: 'abdu', nome: 'Cadeira abdutora', grupo: 'Glúteos', carga: 40, dica: 'Tronco levemente à frente.' },
  { id: 'supino', nome: 'Supino reto', grupo: 'Peito', carga: 30, dica: 'Desça a barra até o peito, cotovelos a 45°.' },
  { id: 'cruci', nome: 'Crucifixo com halteres', grupo: 'Peito', carga: 20, dica: 'Cotovelos levemente dobrados.' },
  { id: 'puxada', nome: 'Puxada frontal', grupo: 'Costas', carga: 35, dica: 'Puxe até o queixo e aperte as escápulas.' },
  { id: 'remada', nome: 'Remada baixa', grupo: 'Costas', carga: 30, dica: 'Peito aberto, puxe com os cotovelos.' },
  { id: 'desenv', nome: 'Desenvolvimento', grupo: 'Ombros', carga: 12, dica: 'Não arqueie a lombar ao subir.' },
  { id: 'lateral', nome: 'Elevação lateral', grupo: 'Ombros', carga: 8, dica: 'Pare na altura dos ombros.' },
  { id: 'rosca', nome: 'Rosca direta', grupo: 'Braços', carga: 10, dica: 'Sem balançar o tronco.' },
  { id: 'triceps', nome: 'Tríceps na polia', grupo: 'Braços', carga: 15, dica: 'Cotovelos colados ao corpo.' },
  { id: 'prancha', nome: 'Prancha', grupo: 'Core', carga: 0, seg: true, dica: 'Quadril alinhado, abdômen firme.' },
  { id: 'abd', nome: 'Abdominal infra', grupo: 'Core', carga: 0, dica: 'Suba as pernas sem embalo.' }
];
export const GRUPOS = ['Todos', 'Pernas', 'Posterior', 'Glúteos', 'Peito', 'Costas', 'Ombros', 'Braços', 'Core'];
export const NOME_FICHA = { A: 'Superiores', B: 'Inferiores', C: 'Core e braços' };
export const DIAS = [
  { n: 'Seg', d: '26' }, { n: 'Ter', d: '27' }, { n: 'Qua', d: '28' },
  { n: 'Qui', d: '29' }, { n: 'Sex', d: '30' }, { n: 'Sáb', d: '31' }
];
export const HORAS = ['06:00', '07:00', '08:00', '09:00', '10:30', '12:00', '17:00', '18:00', '19:00', '20:00'];
export const HOJE = 1;
export const EU = 'juliana'; // aluno logado no lado do aluno (demonstração)

export const lib = id => LIB.find(l => l.id === id) || LIB[0];
export const uid = () => Math.random().toString(36).slice(2, 10);

const MODELO = {
  A: ['supino', 'cruci', 'puxada', 'remada', 'desenv', 'triceps'],
  B: ['agach', 'leg', 'ext', 'stiff', 'pelv', 'pant'],
  C: ['prancha', 'abd', 'lateral', 'rosca']
};
export const padraoSR = obj => obj === 'Ganhar massa' ? [4, 10] : obj === 'Emagrecer' ? [3, 15] : [3, 12];

function montar(obj, extra = {}) {
  const [s, r] = padraoSR(obj);
  const f = {};
  for (const k of Object.keys(MODELO)) {
    f[k] = MODELO[k].map(ref => ({ uid: uid(), ref, series: s, reps: ref === 'prancha' ? 40 : r, carga: extra[ref] ?? lib(ref).carga }));
  }
  return f;
}

const MESES = ['2026-05-02', '2026-06-02', '2026-07-02', '2026-08-02', '2026-09-02', '2026-10-02'];
function evolucao(peso0, passo) {
  return MESES.map((d, i) => ({ d, peso: +(peso0 - passo * i).toFixed(1), cintura: +(peso0 - 0 - passo * 0.8 * i).toFixed(1), gordura: +(29.5 - 0.7 * i).toFixed(1) }));
}

function seed() {
  const alunos = [
    { id: 'juliana', nome: 'Juliana Costa', obj: 'Emagrecer', ultimo: 'Ontem', freq: 92, pag: 'ok', venc: '10/11', nov: 'aberta', desde: 'maio de 2026', obs: 'Dor leve no joelho direito. Evitar impacto.' },
    { id: 'rafael', nome: 'Rafael Lima', obj: 'Ganhar massa', ultimo: 'Hoje', freq: 85, pag: 'ok', venc: '05/11', nov: 'aberta', desde: 'março de 2026', obs: 'Carga do agachamento parada há 4 semanas.' },
    { id: 'bruno', nome: 'Bruno Teixeira', obj: 'Condicionamento', ultimo: 'Há 3 dias', freq: 64, pag: 'atraso', venc: '20/10', nov: 'aberta', desde: 'julho de 2026', obs: 'Prefere treinos curtos, até 45 min.' },
    { id: 'lucas', nome: 'Lucas Prado', obj: 'Ganhar massa', ultimo: 'Há 9 dias', freq: 31, pag: 'ok', venc: '15/11', nov: 'aberta', desde: 'agosto de 2026', obs: 'Sumiu depois de uma viagem.' },
    { id: 'fernanda', nome: 'Fernanda Reis', obj: 'Saúde e postura', ultimo: 'Há 2 dias', freq: 70, pag: 'atraso', venc: '20/10', nov: 'aberta', desde: 'junho de 2026', obs: 'Trabalha sentada. Foco em postura e lombar.' },
    { id: 'marina', nome: 'Marina Souza', obj: 'Definição', ultimo: 'Hoje', freq: 88, pag: 'ok', venc: '08/11', nov: 'aberta', desde: 'fevereiro de 2026', obs: 'Ficha atual há 6 semanas.' },
    { id: 'pedro', nome: 'Pedro Alves', obj: 'Emagrecer', ultimo: 'Há 4 dias', freq: 58, pag: 'ok', venc: '12/11', nov: 'aberta', desde: 'setembro de 2026', obs: 'Avaliação física marcada para hoje.' },
    { id: 'carla', nome: 'Carla Bento', obj: 'Ganhar massa', ultimo: 'Ontem', freq: 80, pag: 'ok', venc: '18/11', nov: 'aberta', desde: 'abril de 2026', obs: 'Quer aumentar o volume de glúteos.' }
  ];
  const fichas = {};
  for (const a of alunos) fichas[a.id] = montar(a.obj, a.id === 'rafael' ? { agach: 60 } : {});
  fichas.juliana.B = [
    ['agach', 4, 10, 40], ['leg', 4, 12, 120], ['ext', 3, 15, 35], ['stiff', 3, 12, 28], ['pelv', 4, 12, 60], ['pant', 3, 20, 0]
  ].map(([ref, series, reps, carga]) => ({ uid: uid(), ref, series, reps, carga }));
  const medidas = {
    juliana: [78, 76.8, 75.9, 74.6, 73.5, 72.4].map((peso, i) => ({ d: MESES[i], peso, cintura: [78, 77.2, 76.5, 75.8, 74.9, 74][i], gordura: [29.5, 28.8, 28.1, 27.4, 26.7, 26][i] }))
  };
  const base = { rafael: 82, bruno: 90, lucas: 74, fernanda: 66, marina: 61, pedro: 96, carla: 58 };
  for (const [id, p] of Object.entries(base)) medidas[id] = evolucao(p, 0.4);
  const agora = Date.now();
  return {
    v: 1,
    alunos, fichas, medidas,
    agenda: {
      0: { '07:00': 'marina', '09:00': 'juliana', '18:00': 'bruno' },
      1: { '07:00': 'marina', '08:00': 'rafael', '09:00': 'juliana', '10:30': 'pedro', '18:00': 'carla' },
      2: { '07:00': 'fernanda', '08:00': 'rafael', '19:00': 'lucas' },
      3: { '07:00': 'marina', '09:00': 'juliana', '18:00': 'carla' },
      4: { '08:00': 'rafael', '17:00': 'pedro', '18:00': 'bruno' },
      5: { '09:00': 'fernanda', '10:30': 'juliana' }
    },
    presenca: { '1-07:00': true, '1-08:00': true },
    feitos: {},
    msgs: {
      juliana: [
        { de: 'p', txt: 'Bom dia, Juliana! Hoje é treino B. Te espero às 9h.', t: agora - 9e6 },
        { de: 'a', txt: 'Bom dia! Estarei aí.', t: agora - 8.2e6 },
        { de: 'p', txt: 'Lembra de avisar se o joelho incomodar, combinado?', t: agora - 8.1e6 }
      ]
    },
    lidas: { p: { juliana: 3 }, a: 3 },
    sessoes: [],
    eventos: [
      { tipo: 'treino', aluno: 'marina', txt: 'Marina concluiu o Treino A', t: agora - 7.2e6 },
      { tipo: 'treino', aluno: 'rafael', txt: 'Rafael concluiu o Treino C', t: agora - 3.6e6 }
    ],
    sequencia: 12
  };
}

let state = load();
const subs = new Set();

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s && s.v === 1) return s;
  } catch { /* dados corrompidos ou bloqueados: recomeça */ }
  return seed();
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* navegador sem armazenamento */ }
}

export const get = () => state;
export const subscribe = fn => subs.add(fn);

// Toda mudança passa por aqui: copia, altera, registra o evento e avisa as telas.
export function update(fn, evento) {
  const next = structuredClone(state);
  fn(next);
  if (evento) next.eventos = [{ ...evento, t: Date.now() }, ...next.eventos].slice(0, 40);
  state = next;
  save();
  subs.forEach(f => f());
}

export function reset() {
  state = seed();
  save();
  subs.forEach(f => f());
}

// Outra aba mudou os dados (ex.: aluno numa aba, personal na outra): atualiza na hora.
window.addEventListener('storage', e => {
  if (e.key !== KEY || !e.newValue) return;
  try { state = JSON.parse(e.newValue); subs.forEach(f => f(true)); } catch { /* ignora */ }
});

export const aluno = id => state.alunos.find(a => a.id === id);
export const primeiro = id => (aluno(id)?.nome || '').split(' ')[0];
export const iniciais = nome => nome.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
