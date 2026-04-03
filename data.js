// ===============================
// data.js — Dados base, rotinas e utilitários
// ===============================

const DAYS = ["domingo","segunda","terça","quarta","quinta","sexta","sábado"];

const STORAGE_KEYS = {
  TASKS:        "naira_tasks",
  EXAMS:        "naira_exams",
  STUDY_METHOD: "naira_study_method",
  DONE_DATES:   "naira_done_dates",
};

// ─── UTILITÁRIOS DE DATA / HORA ──────────────────────────────

function getTasksForDate(date) {
  const d = toDateOnly(date);
  const dateStr = d.toISOString().slice(0,10);
  ensureAutoTasksForDate(dateStr);
  return tasks
    .filter(t => t.date === dateStr)
    .sort(...);
}

function formatDateBR(date) {
  return new Date(date).toLocaleDateString("pt-BR", {
    weekday: "long", day: "2-digit", month: "2-digit", year: "numeric",
  });
}

function timeStrToMinutes(t) {
  if (!t) return 0;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTimeStr(mins) {
  const h = String(Math.floor(mins / 60)).padStart(2, "0");
  const m = String(mins % 60).padStart(2, "0");
  return `${h}:${m}`;
}

// retorna true se dois intervalos se sobrepõem
function isTimeOverlap(startA, endA, startB, endB) {
  if (!endA || !endB) return false;
  return timeStrToMinutes(startA) < timeStrToMinutes(endB) &&
         timeStrToMinutes(startB) < timeStrToMinutes(endA);
}

function uuid() {
  return "id-" + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

// quantos dias faltam entre hoje e uma data
function daysUntil(dateStr) {
  const now  = toDateOnly(new Date());
  const then = toDateOnly(new Date(dateStr));
  return Math.round((then - now) / 86400000);
}

// ─── LOCAL STORAGE ────────────────────────────────────────────

function loadFromStorage(key, defaultValue) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch (e) { return defaultValue; }
}

function saveToStorage(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
}

// ─── ARRAYS GLOBAIS ───────────────────────────────────────────

let tasks = loadFromStorage(STORAGE_KEYS.TASKS, []);
let exams = loadFromStorage(STORAGE_KEYS.EXAMS, []);

// ─── ROTINA DOMÉSTICA DIÁRIA ──────────────────────────────────
// aparece todos os dias

const DAILY_HOUSE = [
  { label: "Arrumar a cama",                          start: "07:00", end: "07:10" },
  { label: "Higiene pessoal / se arrumar",             start: "07:10", end: "07:30" },
  { label: "Café da manhã",                            start: "07:30", end: "07:50" },
  { label: "Lavar a louça do café",                    start: "07:50", end: "08:00" },
  { label: "Organizar escrivaninha / espaço de estudo",start: "13:00", end: "13:10" },
  { label: "Organizar materiais p/ o dia seguinte",    start: "22:00", end: "22:15" },
];

// ─── ROTINA DOMÉSTICA SEMANAL ─────────────────────────────────
// weekday: 0=dom, 1=seg, 2=ter, 3=qua, 4=qui, 5=sex, 6=sáb

const WEEKLY_HOUSE = [
  // Segunda
  { weekday:1, label:"Separar e pôr roupas para lavar (máquina)",start:"11:15",end:"11:30" },
  { weekday:1, label:"Dobrar/guardar roupas limpas da semana passada",start:"21:15",end:"21:35" },
  // Terça
  { weekday:2, label:"Limpar banheiro (pia, vaso, piso, espelho)",start:"11:00",end:"11:40" },
  { weekday:2, label:"Estender / passar roupa da máquina",        start:"11:40",end:"12:00" },
  // Quarta
  { weekday:3, label:"Passar pano nos principais cômodos",        start:"17:30",end:"18:00" },
  // Quinta
  { weekday:4, label:"Lavar roupas escuras / toalhas",            start:"09:00",end:"09:15" },
  { weekday:4, label:"Trocar roupa de cama",                      start:"09:15",end:"09:35" },
  // Sexta
  { weekday:5, label:"Organização geral rápida da casa (30 min)", start:"17:30",end:"18:00" },
  // Sábado
  { weekday:6, label:"Varrer / aspirar toda a casa",              start:"09:00",end:"09:40" },
  { weekday:6, label:"Limpeza de cozinha (fogão, bancada, geladeira)", start:"09:40",end:"10:10" },
  // Domingo
  { weekday:0, label:"Planejamento semanal (revisar agenda da semana)", start:"19:00",end:"19:30" },
];

// ─── LAZER (sugestões fixas) ──────────────────────────────────
// leve, para garantir que não some da agenda

const WEEKLY_LEISURE = [
  { weekday:6, label:"Tempo livre / lazer / descanso", start:"15:00",end:"17:00" },
  { weekday:0, label:"Tempo livre / lazer / descanso", start:"14:00",end:"16:30" },
];

// ─── TÊNIS DE MESA ────────────────────────────────────────────

const TENIS_DAYS   = [1, 3, 5]; // seg, qua, sex
const TENIS_CONFIG = { name:"Tênis de Mesa", start:"08:00", end:"11:00" };

// ─── HORÁRIO DE AULAS (PDF CONFIRMADO) ───────────────────────
// dayIndex: 1=seg, 2=ter, 3=qua, 4=qui, 5=sex
// ─── HORÁRIO DE AULAS (PDF CONFIRMADO) ───────────────────────
// dayIndex: 1=segunda, 2=terça, 3=quarta, 4=quinta, 5=sexta

// dayIndex: 1=segunda, 2=terça, 3=quarta, 4=quinta, 5=sexta
const CLASSES_SCHEDULE = [

  // SEGUNDA
  { dayIndex:1, start:"15:20", end:"16:00", subject:"Anatomia Patológica II", type:"teórica" },
  { dayIndex:1, start:"16:00", end:"16:40", subject:"Anatomia Patológica II", type:"teórica" },

  // TERÇA (noite)
  { dayIndex:2, start:"18:40", end:"19:20", subject:"Clínica de Pequenos Animais", type:"teórica" },
  { dayIndex:2, start:"19:20", end:"20:30", subject:"Clínica de Pequenos Animais", type:"teórica" },
  { dayIndex:2, start:"20:30", end:"21:10", subject:"Diagnóstico por Imagem",      type:"teórica" },
  { dayIndex:2, start:"21:10", end:"21:50", subject:"Diagnóstico por Imagem",      type:"teórica" },

  // QUARTA (prática de CP à tarde + teóricas à noite)
  { dayIndex:3, start:"13:30", end:"14:10", subject:"Clínica de Pequenos Animais",  type:"prática" },
  { dayIndex:3, start:"14:10", end:"15:20", subject:"Clínica de Pequenos Animais",  type:"prática" },
  { dayIndex:3, start:"15:20", end:"16:00", subject:"Clínica de Pequenos Animais",  type:"prática" },
  { dayIndex:3, start:"16:00", end:"16:40", subject:"Clínica de Pequenos Animais",  type:"prática" },

  { dayIndex:3, start:"18:40", end:"19:20", subject:"Anatomia Patológica Vet II",   type:"teórica" },
  { dayIndex:3, start:"19:20", end:"20:30", subject:"Anatomia Patológica Vet II",   type:"teórica" },
  { dayIndex:3, start:"20:30", end:"21:10", subject:"Anestesiologia",               type:"teórica" },
  { dayIndex:3, start:"21:10", end:"21:50", subject:"Anestesiologia",               type:"teórica" },

  // QUINTA (prática manhã + TC tarde + CP teórica à noite)
  { dayIndex:4, start:"08:30", end:"09:10", subject:"Anestesiologia",               type:"prática" },
  { dayIndex:4, start:"09:10", end:"10:20", subject:"Anestesiologia",               type:"prática" },
  { dayIndex:4, start:"10:20", end:"11:00", subject:"Técnica Cirúrgica",            type:"prática" },
  { dayIndex:4, start:"11:00", end:"11:40", subject:"Técnica Cirúrgica",            type:"prática" },

  { dayIndex:4, start:"15:20", end:"16:00", subject:"Técnica Cirúrgica",            type:"teórica" },
  { dayIndex:4, start:"16:00", end:"16:40", subject:"Técnica Cirúrgica",            type:"teórica" },

  { dayIndex:4, start:"19:20", end:"20:30", subject:"Clínica de Pequenos Animais",  type:"teórica" },
  { dayIndex:4, start:"20:30", end:"21:10", subject:"Clínica de Pequenos Animais",  type:"teórica" },
  { dayIndex:4, start:"21:10", end:"21:50", subject:"Clínica de Pequenos Animais",  type:"teórica" },

  // SEXTA: sem aulas fixas
];

// ─── BLOCOS DE ESTUDO PADRÃO ──────────────────────────────────
// São sugeridos automaticamente quando há prova/trabalho próximo.
// Distribuídos em blocos curtos (25-40 min) conforme TDAH.
// O algoritmo de exams.js vai preencher "subject" dinamicamente.

const STUDY_SLOTS_BY_DAY = {
  // Segunda — tarde livre antes da aula 15:20, noite livre
  1: [
    { start:"11:15", end:"11:50", label:"Bloco de estudo manhã (Método Pomodoro)" },
    { start:"13:10", end:"13:50", label:"Bloco de estudo tarde A"                 },
    { start:"13:50", end:"14:30", label:"Bloco de estudo tarde B"                 },
    { start:"21:00", end:"21:40", label:"Revisão rápida noite"                    },
  ],
  // Terça — aulas da tarde e noite; manhã livre
  2: [
    { start:"09:00", end:"09:40", label:"Bloco de estudo manhã A"  },
    { start:"09:45", end:"10:25", label:"Bloco de estudo manhã B"  },
    { start:"11:00", end:"11:40", label:"Bloco de estudo manhã C"  },
  ],
  // Quarta — prática de manhã, aulas à noite; tarde livre
  3: [
    { start:"12:30", end:"13:10", label:"Bloco de estudo tarde A"  },
    { start:"13:10", end:"13:50", label:"Bloco de estudo tarde B"  },
    { start:"17:30", end:"18:10", label:"Bloco de estudo tarde C"  },
  ],
  // Quinta — prática manhã/tarde, teórica noite; janela entre tarde e noite
  4: [
    { start:"12:00", end:"12:40", label:"Bloco de estudo tarde A"  },
    { start:"13:10", end:"13:50", label:"Bloco de estudo tarde B"  },
    { start:"16:50", end:"17:30", label:"Bloco de estudo pré-aula" },
  ],
  // Sexta — dia mais livre (tênis de manhã); tarde e noite disponíveis
  5: [
    { start:"12:00", end:"12:40", label:"Bloco de estudo tarde A"  },
    { start:"13:00", end:"13:40", label:"Bloco de estudo tarde B"  },
    { start:"14:00", end:"14:40", label:"Bloco de estudo tarde C"  },
    { start:"19:00", end:"19:40", label:"Bloco de estudo noite"    },
  ],
  // Sábado — mais leve, blocos curtos
  6: [
    { start:"11:00", end:"11:40", label:"Bloco de estudo manhã A"  },
    { start:"13:00", end:"13:40", label:"Bloco de estudo tarde A"  },
  ],
  // Domingo — revisão geral, muito curto
  0: [
    { start:"10:00", end:"10:40", label:"Revisão semanal leve"     },
  ],
};

// ─── GERADORES DE TAREFAS FIXAS ──────────────────────────────

function generateDailyHouseTasks(dateStr) {
  return DAILY_HOUSE.map(item => ({
    id: uuid(), title: item.label,
    date: dateStr, start: item.start, end: item.end,
    category: "home", priority: "low",
    notes: "", done: false, source: "auto:house",
  }));
}

function generateWeeklyHouseTasks(dateStr) {
  const weekday = new Date(dateStr).getDay();
  return WEEKLY_HOUSE
    .filter(i => i.weekday === weekday)
    .map(item => ({
      id: uuid(), title: item.label,
      date: dateStr, start: item.start, end: item.end,
      category: "home", priority: "medium",
      notes: "", done: false, source: "auto:house",
    }));
}

function generateLeisureForDate(dateStr) {
  const weekday = new Date(dateStr).getDay();
  return WEEKLY_LEISURE
    .filter(i => i.weekday === weekday)
    .map(item => ({
      id: uuid(), title: item.label,
      date: dateStr, start: item.start, end: item.end,
      category: "leisure", priority: "low",
      notes: "Momento de descanso — não pule!", done: false, source: "auto:leisure",
    }));
}

function generateTenisForDate(dateStr) {
  const dayIndex = new Date(dateStr).getDay();
  if (!TENIS_DAYS.includes(dayIndex)) return [];
  return [{
    id: uuid(), title: TENIS_CONFIG.name,
    date: dateStr, start: TENIS_CONFIG.start, end: TENIS_CONFIG.end,
    category: "sport", priority: "medium",
    notes: "Treino fixo — segunda, quarta e sexta",
    done: false, source: "auto:tenis",
  }];
}
