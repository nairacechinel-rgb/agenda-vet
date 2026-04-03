// ================================================
// data.js — Dados base, rotinas e utilitários
// ================================================

const STORAGE_KEYS = {
  TASKS: "naira_tasks",
  EXAMS: "naira_exams",
};

// ── UTILIDADES DE DATA/HORA ─────────────────────

function toDateOnly(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function localDateStr(dateObj) {
  const d = toDateOnly(dateObj);
  const yyyy = d.getFullYear();
  const mm   = String(d.getMonth() + 1).padStart(2, "0");
  const dd   = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function dateFromStr(str) {
  return new Date(str + "T12:00:00");
}

function formatDateBR(dateStr) {
  return dateFromStr(dateStr).toLocaleDateString("pt-BR", {
    weekday: "long",
    day:     "2-digit",
    month:   "2-digit",
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

function isTimeOverlap(startA, endA, startB, endB) {
  if (!endA || !endB) return false;
  return timeStrToMinutes(startA) < timeStrToMinutes(endB) &&
         timeStrToMinutes(startB) < timeStrToMinutes(endA);
}

function uuid() {
  return "id-" + Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
}

function daysUntil(dateStr) {
  const now  = toDateOnly(new Date());
  const then = toDateOnly(dateFromStr(dateStr));
  return Math.round((then - now) / 86400000);
}

// ── LOCAL STORAGE ───────────────────────────────

function loadFromStorage(key, def) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : def;
  } catch (e) { return def; }
}

function saveToStorage(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
}

// ── ARRAYS GLOBAIS ─────────────────────────────

let tasks = loadFromStorage(STORAGE_KEYS.TASKS, []);
let exams = loadFromStorage(STORAGE_KEYS.EXAMS, []);

// ── ROTINA DE CASA ─────────────────────────────

const DAILY_HOUSE = [
  { label:"Arrumar a cama",                           start:"07:00", end:"07:10" },
  { label:"Higiene pessoal / se arrumar",              start:"07:10", end:"07:30" },
  { label:"Café da manhã",                             start:"07:30", end:"07:50" },
  { label:"Lavar a louça do café",                     start:"07:50", end:"08:00" },
  { label:"Organizar escrivaninha / espaço de estudo", start:"13:00", end:"13:10" },
  { label:"Organizar materiais para o dia seguinte",   start:"22:00", end:"22:15" },
];

const WEEKLY_HOUSE = [
  { weekday:1, label:"Separar e lavar roupas (claras)",            start:"11:15", end:"11:45" },
  { weekday:1, label:"Dobrar e guardar roupas limpas",             start:"21:15", end:"21:35" },
  { weekday:2, label:"Limpar banheiro",                            start:"11:00", end:"11:40" },
  { weekday:2, label:"Estender roupas da máquina",                 start:"11:40", end:"12:00" },
  { weekday:3, label:"Passar pano no chão",                        start:"17:30", end:"18:00" },
  { weekday:4, label:"Lavar roupas escuras / toalhas",             start:"09:00", end:"09:20" },
  { weekday:4, label:"Trocar roupa de cama",                       start:"09:20", end:"09:40" },
  { weekday:5, label:"Organização geral rápida da casa",           start:"17:30", end:"18:00" },
  { weekday:6, label:"Varrer / aspirar toda a casa",               start:"09:00", end:"09:40" },
  { weekday:6, label:"Limpar cozinha (fogão, bancada, geladeira)", start:"09:40", end:"10:10" },
  { weekday:0, label:"Planejamento semanal (revisar agenda)",      start:"19:00", end:"19:30" },
];

const WEEKLY_LEISURE = [
  { weekday:6, label:"Tempo livre / lazer", start:"15:00", end:"17:00" },
  { weekday:0, label:"Tempo livre / lazer", start:"14:00", end:"16:30" },
];

// Tênis de mesa: seg, qua, sex (8–11)
const TENIS_DAYS   = [1,3,5];
const TENIS_CONFIG = { label:"Tênis de Mesa", start:"08:00", end:"11:00" };

// ── HORÁRIO DE AULAS (HORRIO.pdf) ─────────────
// dayIndex: 1=seg, 2=ter, 3=qua, 4=qui, 5=sex

const CLASSES_SCHEDULE = [

  // SEGUNDA
  { dayIndex:1, start:"15:20", end:"16:00", subject:"Anatomia Patológica II",      type:"teórica" },
  { dayIndex:1, start:"16:00", end:"16:40", subject:"Anatomia Patológica II",      type:"teórica" },
  { dayIndex:1, start:"18:40", end:"19:20", subject:"Clínica de Pequenos Animais", type:"teórica" },
  { dayIndex:1, start:"19:20", end:"20:30", subject:"Clínica de Pequenos Animais", type:"teórica" },

  // TERÇA
  { dayIndex:2, start:"13:30", end:"14:10", subject:"Clínica de Pequenos - Prática", type:"prática" },
  { dayIndex:2, start:"18:40", end:"19:20", subject:"Anatomia Patológica Vet II",    type:"teórica" },
  { dayIndex:2, start:"19:20", end:"20:30", subject:"Anatomia Patológica Vet II",    type:"teórica" },
  { dayIndex:2, start:"20:30", end:"21:10", subject:"Diagnóstico por Imagem",        type:"teórica" },
  { dayIndex:2, start:"21:10", end:"21:50", subject:"Diagnóstico por Imagem",        type:"teórica" },

  // QUARTA
  { dayIndex:3, start:"14:10", end:"15:20", subject:"Clínica de Pequenos - Prática", type:"prática" },
  { dayIndex:3, start:"15:20", end:"16:00", subject:"Clínica de Pequenos - Prática", type:"prática" },
  { dayIndex:3, start:"16:00", end:"16:40", subject:"Clínica de Pequenos - Prática", type:"prática" },
  { dayIndex:3, start:"20:30", end:"21:10", subject:"Anestesiologia",                type:"teórica" },
  { dayIndex:3, start:"21:10", end:"21:50", subject:"Anestesiologia",                type:"teórica" },

  // QUINTA
  { dayIndex:4, start:"08:30", end:"09:10", subject:"Anestesiologia - Prática",      type:"prática" },
  { dayIndex:4, start:"09:10", end:"10:20", subject:"Anestesiologia - Prática",      type:"prática" },
  { dayIndex:4, start:"10:20", end:"11:00", subject:"Técnica Cirúrgica - Prática",   type:"prática" },
  { dayIndex:4, start:"11:00", end:"11:40", subject:"Técnica Cirúrgica - Prática",   type:"prática" },
  { dayIndex:4, start:"15:20", end:"16:00", subject:"Técnica Cirúrgica",             type:"teórica" },
  { dayIndex:4, start:"16:00", end:"16:40", subject:"Técnica Cirúrgica",             type:"teórica" },
  { dayIndex:4, start:"19:20", end:"20:30", subject:"Clínica de Pequenos Animais",   type:"teórica" },
  { dayIndex:4, start:"20:30", end:"21:10", subject:"Clínica de Pequenos Animais",   type:"teórica" },
  { dayIndex:4, start:"21:10", end:"21:50", subject:"Clínica de Pequenos Animais",   type:"teórica" },

  // SEXTA: vazio
];

// ── SLOTS DE ESTUDO ───────────────────────────

const STUDY_SLOTS_BY_DAY = {
  1:[{start:"11:15",end:"11:55"},{start:"13:10",end:"13:50"},{start:"14:00",end:"14:40"}],
  2:[{start:"09:00",end:"09:40"},{start:"09:45",end:"10:25"},{start:"11:00",end:"11:40"}],
  3:[{start:"11:15",end:"11:55"},{start:"17:30",end:"18:10"}],
  4:[{start:"12:00",end:"12:40"},{start:"13:00",end:"13:40"}],
  5:[{start:"11:15",end:"11:55"},{start:"13:00",end:"13:40"},{start:"14:00",end:"14:40"},{start:"15:00",end:"15:40"}],
  6:[{start:"11:00",end:"11:40"},{start:"13:00",end:"13:40"}],
  0:[{start:"10:00",end:"10:40"}],
};

// ── GERADORES DE TAREFAS ──────────────────────

function generateDailyHouseTasks(dateStr) {
  return DAILY_HOUSE.map(i => ({
    id: uuid(), title:i.label, date:dateStr,
    start:i.start, end:i.end, category:"home",
    priority:"low", notes:"", done:false, source:"auto:house",
  }));
}

function generateWeeklyHouseTasks(dateStr) {
  const w = dateFromStr(dateStr).getDay();
  return WEEKLY_HOUSE.filter(i => i.weekday === w).map(i => ({
    id: uuid(), title:i.label, date:dateStr,
    start:i.start, end:i.end, category:"home",
    priority:"medium", notes:"", done:false, source:"auto:house",
  }));
}

function generateLeisureForDate(dateStr) {
  const w = dateFromStr(dateStr).getDay();
  return WEEKLY_LEISURE.filter(i => i.weekday === w).map(i => ({
    id: uuid(), title:i.label, date:dateStr,
    start:i.start, end:i.end, category:"leisure",
    priority:"low", notes:"", done:false, source:"auto:leisure",
  }));
}

function generateTenisForDate(dateStr) {
  const w = dateFromStr(dateStr).getDay();
  if (!TENIS_DAYS.includes(w)) return [];
  return [{
    id: uuid(), title:TENIS_CONFIG.label,
    date:dateStr, start:TENIS_CONFIG.start, end:TENIS_CONFIG.end,
    category:"sport", priority:"medium",
    notes:"Treino fixo", done:false, source:"auto:tenis",
  }];
}

function generateClassTasksForDate(dateStr) {
  const w = dateFromStr(dateStr).getDay();
  return CLASSES_SCHEDULE.filter(c => c.dayIndex === w).map(c => ({
    id: uuid(),
    title: c.subject,
    date: dateStr,
    start: c.start,
    end:   c.end,
    category:"class",
    priority:"high",
    notes: c.type === "prática" ? "Aula prática" : "Aula teórica",
    done:false,
    source:"auto:class",
  }));
}
