// ===============================
// data.js
// Dados base, horários fixos e utilitários
// ===============================

// --------- CONSTANTES DE BASE ---------
const DAYS = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];

const STORAGE_KEYS = {
  TASKS: "naira_tasks",
  EXAMS: "naira_exams",
  STUDY_METHOD: "naira_study_method",
};

// --------- FUNÇÕES UTILITÁRIAS DE DATA/HORA ---------

function toDateOnly(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDateBR(date) {
  const d = new Date(date);
  return d.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
  });
}

function formatTimeHM(date) {
  return new Date(date).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function timeStrToMinutes(t) {
  if (!t) return null;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTimeStr(mins) {
  const h = String(Math.floor(mins / 60)).padStart(2, "0");
  const m = String(mins % 60).padStart(2, "0");
  return `${h}:${m}`;
}

function isTimeOverlap(startA, endA, startB, endB) {
  if (endA == null || endB == null) return false;
  return startA < endB && startB < endA;
}

// --------- LOCAL STORAGE ---------

function loadFromStorage(key, defaultValue) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch (e) {
    console.error("Erro ao ler do localStorage", key, e);
    return defaultValue;
  }
}

function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error("Erro ao salvar no localStorage", key, e);
  }
}

// --------- ARRAYS EM MEMÓRIA ---------

let tasks = loadFromStorage(STORAGE_KEYS.TASKS, []);
let exams = loadFromStorage(STORAGE_KEYS.EXAMS, []);

// Estrutura de task:
// {
//   id, title, date, start, end, category, priority, notes, done, source
// }

// Estrutura de exam:
// { id, subject, type, date, time, topics, weight, notes }

// --------- ROTINA DOMÉSTICA ---------
// Mais detalhes, distribuídos pela semana. As tarefas diárias são sempre geradas.
// As semanais entram só em dias específicos.

const DAILY_HOUSE_ROUTINE = [
  {
    label: "Arrumar a cama",
    start: "07:00",
    end: "07:10",
  },
  {
    label: "Higiene pessoal / se arrumar",
    start: "07:10",
    end: "07:25",
  },
  {
    label: "Café da manhã",
    start: "07:25",
    end: "07:45",
  },
  {
    label: "Lavar a louça do café",
    start: "07:45",
    end: "08:00",
  },
  {
    label: "Organizar escrivaninha / espaço de estudo",
    start: "13:00",
    end: "13:10",
  },
  {
    label: "Organizar materiais de estudo do dia seguinte",
    start: "22:00",
    end: "22:15",
  },
];

// Tarefas semanais (dia-da-semana específico)
const WEEKLY_HOUSE_ROUTINE = [
  // Segunda
  {
    weekday: 1,
    label: "Lavar roupas (claras/coloridas)",
    start: "17:00",
    end: "18:00",
  },
  {
    weekday: 1,
    label: "Dobrar/guardar roupas limpas",
    start: "21:15",
    end: "21:35",
  },
  // Terça
  {
    weekday: 2,
    label: "Limpar banheiro (pia, vaso, piso)",
    start: "11:00",
    end: "11:40",
  },
  // Quarta
  {
    weekday: 3,
    label: "Passar pano nos principais cômodos",
    start: "17:30",
    end: "18:00",
  },
  // Quinta
  {
    weekday: 4,
    label: "Lavar roupas (escura/toalhas)",
    start: "09:00",
    end: "10:00",
  },
  {
    weekday: 4,
    label: "Trocar roupa de cama",
    start: "10:00",
    end: "10:20",
  },
  // Sexta
  {
    weekday: 5,
    label: "Organização geral da casa (30 min concentrados)",
    start: "17:00",
    end: "17:30",
  },
  // Sábado
  {
    weekday: 6,
    label: "Varrer e organizar casa (faxininha leve)",
    start: "09:00",
    end: "09:40",
  },
];

// --------- TÊNIS DE MESA ---------

const TENIS_DAYS = [1, 3, 5]; // segunda, quarta, sexta
const TENIS_CONFIG = {
  name: "Tênis de Mesa",
  start: "08:00",
  end: "11:00",
};

// --------- HORÁRIOS DE AULA (do PDF) ---------
// dayIndex: 1=segunda, 2=terça, 3=quarta, 4=quinta, 5=sexta

const CLASSES_SCHEDULE = [
  // SEGUNDA
  { dayIndex: 1, start: "15:20", end: "16:00", subject: "Anatomia Patológica Vet II", type: "teórica" },
  { dayIndex: 1, start: "16:00", end: "16:40", subject: "Anatomia Patológica Vet II", type: "teórica" },

  // TERÇA
  { dayIndex: 2, start: "13:30", end: "14:10", subject: "Clínica de Pequenos - Prática", type: "prática" },
  { dayIndex: 2, start: "14:10", end: "15:20", subject: "Clínica de Pequenos - Prática", type: "prática" },
  { dayIndex: 2, start: "15:20", end: "16:00", subject: "Clínica de Pequenos - Prática", type: "prática" },
  { dayIndex: 2, start: "16:00", end: "16:40", subject: "Clínica de Pequenos - Prática", type: "prática" },

  { dayIndex: 2, start: "18:40", end: "19:20", subject: "Clínica de Pequenos Animais", type: "teórica" },
  { dayIndex: 2, start: "19:20", end: "20:30", subject: "Clínica de Pequenos Animais", type: "teórica" },

  { dayIndex: 2, start: "20:30", end: "21:10", subject: "Diagnóstico por Imagem", type: "teórica" },
  { dayIndex: 2, start: "21:10", end: "21:50", subject: "Diagnóstico por Imagem", type: "teórica" },

  // QUARTA
  { dayIndex: 3, start: "08:30", end: "09:10", subject: "Anestesiologia - Prática", type: "prática" },
  { dayIndex: 3, start: "09:10", end: "10:20", subject: "Anestesiologia - Prática", type: "prática" },

  { dayIndex: 3, start: "10:20", end: "11:00", subject: "Técnica Cirúrgica - Prática", type: "prática" },
  { dayIndex: 3, start: "11:00", end: "11:40", subject: "Técnica Cirúrgica - Prática", type: "prática" },

  { dayIndex: 3, start: "18:40", end: "19:20", subject: "Anatomia Patológica Vet II", type: "teórica" },
  { dayIndex: 3, start: "19:20", end: "20:30", subject: "Anatomia Patológica Vet II", type: "teórica" },

  { dayIndex: 3, start: "20:30", end: "21:10", subject: "Anestesiologia", type: "teórica" },
  { dayIndex: 3, start: "21:10", end: "21:50", subject: "Anestesiologia", type: "teórica" },

  // QUINTA
  { dayIndex: 4, start: "10:20", end: "11:00", subject: "Técnica Cirúrgica - Prática", type: "prática" },
  { dayIndex: 4, start: "11:00", end: "11:40", subject: "Técnica Cirúrgica - Prática", type: "prática" },

  { dayIndex: 4, start: "18:40", end: "19:20", subject: "Clínica de Pequenos Animais", type: "teórica" },
  { dayIndex: 4, start: "19:20", end: "20:30", subject: "Clínica de Pequenos Animais", type: "teórica" },
  { dayIndex: 4, start: "20:30", end: "21:10", subject: "Clínica de Pequenos Animais", type: "teórica" },
  { dayIndex: 4, start: "21:10", end: "21:50", subject: "Clínica de Pequenos Animais", type: "teórica" },

  // (Sexta não tem aula no horário, só tênis de mesa e o que você acrescentar)
];

// --------- GERADOR DE ID ---------

function uuid() {
  return "id-" + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

// --------- TAREFAS FIXAS (ROTINA + TÊNIS + AULAS) ---------

// tarefas diárias da casa
function generateDailyHouseTasks(dateStr) {
  return DAILY_HOUSE_ROUTINE.map((item) => ({
    id: uuid(),
    title: item.label,
    date: dateStr,
    start: item.start,
    end: item.end,
    category: "home",
    priority: "low",
    notes: "",
    done: false,
    source: "auto:house",
  }));
}

// tarefas semanais da casa
function generateWeeklyHouseTasks(dateStr) {
  const d = new Date(dateStr);
  const weekday = d.getDay(); // 0=domingo...6=sábado

  return WEEKLY_HOUSE_ROUTINE
    .filter((item) => item.weekday === weekday)
    .map((item) => ({
      id: uuid(),
      title: item.label,
      date: dateStr,
      start: item.start,
      end: item.end,
      category: "home",
      priority: "medium",
      notes: "",
      done: false,
      source: "auto:house",
    }));
}

// tarefas de tênis
function generateTenisForDate(dateStr) {
  const d = new Date(dateStr);
  const dayIndex = d.getDay();
  if (!TENIS_DAYS.includes(dayIndex)) return [];
  return [
    {
      id: uuid(),
      title: TENIS_CONFIG.name,
      date: dateStr,
      start: TENIS_CONFIG.start,
      end: TENIS_CONFIG.end,
      category: "sport",
      priority: "medium",
      notes: "Treino fixo segunda, quarta e sexta",
      done: false,
      source: "auto:tenis",
    },
  ];
}

// As aulas automáticas são geradas em classes.js (Parte 3)
