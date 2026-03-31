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

// converte "08:00" em minutos (480)
function timeStrToMinutes(t) {
  if (!t) return null;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

// converte minutos em "08:00"
function minutesToTimeStr(mins) {
  const h = String(Math.floor(mins / 60)).padStart(2, "0");
  const m = String(mins % 60).padStart(2, "0");
  return `${h}:${m}`;
}

// retorna se duas faixas de horário se sobrepõem
function isTimeOverlap(startA, endA, startB, endB) {
  if (endA == null || endB == null) return false;
  return startA < endB && startB < endA;
}

// --------- LOCAL STORAGE (offline primeiro, depois Sheets) ---------

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

// --------- TAREFAS EM MEMÓRIA ---------

let tasks = loadFromStorage(STORAGE_KEYS.TASKS, []); // todas as tarefas
let exams = loadFromStorage(STORAGE_KEYS.EXAMS, []); // todas as provas/trabalhos

// Estrutura de task:
// {
//   id: string,
//   title: string,
//   date: "YYYY-MM-DD",
//   start: "HH:MM",
//   end: "HH:MM" | null,
//   category: "home" | "study" | "leisure" | "sport" | "other" | "class" | "exam",
//   priority: "low" | "medium" | "high",
//   notes: string,
//   done: boolean,
//   source: "user" | "auto:house" | "auto:tenis" | "auto:class" | "auto:exam"
// }

// Estrutura de exam:
// {
//   id: string,
//   subject: string,
//   type: "prova"|"trabalho"|...,
//   date: "YYYY-MM-DD",
//   time: "HH:MM" | null,
//   topics: string[],
//   weight: number | null,
//   notes: string
// }

// --------- ROTINA DOMÉSTICA PADRÃO ---------
// Aqui você pode ajustar como preferir. Coloquei um modelo bem objetivo.

const DEFAULT_HOUSE_ROUTINE = [
  {
    label: "Arrumar a cama",
    start: "07:00",
    end: "07:10",
  },
  {
    label: "Café da manhã",
    start: "07:10",
    end: "07:40",
  },
  {
    label: "Lavar a louça do café",
    start: "07:40",
    end: "07:55",
  },
  {
    label: "Varrer o chão (área principal)",
    start: "17:30",
    end: "17:50",
  },
  {
    label: "Organizar materiais de estudo do dia seguinte",
    start: "22:00",
    end: "22:15",
  },
];

// Você vai poder alterar/duplicar esses horários depois, mas isso já cria um padrão diário.

// --------- TÊNIS DE MESA (segunda, quarta, sexta das 08:00 às 11:00) ---------

const TENIS_DAYS = [1, 3, 5]; // 1 = segunda, 3 = quarta, 5 = sexta

const TENIS_CONFIG = {
  name: "Tênis de Mesa",
  start: "08:00",
  end: "11:00",
};

// --------- HORÁRIOS DE AULAS (com base no PDF enviado) ---------
// OBS: aqui é só a estrutura geral; a Parte 3 vai gerar as tasks automáticas.

const CLASSES_SCHEDULE = [
  // Segunda
  { dayIndex: 1, start: "15:20", end: "16:00", subject: "Anatomia Patológica Vet II", type: "teórica" },
  { dayIndex: 1, start: "16:00", end: "16:40", subject: "Anatomia Patológica Vet II", type: "teórica" },

  // Terça
  { dayIndex: 2, start: "13:30", end: "14:10", subject: "Clínica de Pequenos - Prática", type: "prática" },
  { dayIndex: 2, start: "14:10", end: "15:20", subject: "Clínica de Pequenos - Prática", type: "prática" },
  { dayIndex: 2, start: "15:20", end: "16:00", subject: "Clínica de Pequenos - Prática", type: "prática" },
  { dayIndex: 2, start: "16:00", end: "16:40", subject: "Clínica de Pequenos - Prática", type: "prática" },
  { dayIndex: 2, start: "18:40", end: "19:20", subject: "Clínica de Pequenos Animais", type: "teórica" },
  { dayIndex: 2, start: "19:20", end: "20:30", subject: "Clínica de Pequenos Animais", type: "teórica" },
  { dayIndex: 2, start: "20:30", end: "21:10", subject: "Diagnóstico por Imagem", type: "teórica" },
  { dayIndex: 2, start: "21:10", end: "21:50", subject: "Diagnóstico por Imagem", type: "teórica" },

  // Quarta
  { dayIndex: 3, start: "08:30", end: "09:10", subject: "Anestesiologia - Prática", type: "prática" },
  { dayIndex: 3, start: "09:10", end: "10:20", subject: "Anestesiologia - Prática", type: "prática" },
  { dayIndex: 3, start: "10:20", end: "11:00", subject: "Técnica Cirúrgica - Prática", type: "prática" },
  { dayIndex: 3, start: "11:00", end: "11:40", subject: "Técnica Cirúrgica - Prática", type: "prática" },
  { dayIndex: 3, start: "18:40", end: "19:20", subject: "Anatomia Patológica Vet II", type: "teórica" },
  { dayIndex: 3, start: "19:20", end: "20:30", subject: "Anatomia Patológica Vet II", type: "teórica" },
  { dayIndex: 3, start: "20:30", end: "21:10", subject: "Anestesiologia", type: "teórica" },
  { dayIndex: 3, start: "21:10", end: "21:50", subject: "Anestesiologia", type: "teórica" },

  // Quinta
  { dayIndex: 4, start: "10:20", end: "11:00", subject: "Técnica Cirúrgica - Prática", type: "prática" },
  { dayIndex: 4, start: "11:00", end: "11:40", subject: "Técnica Cirúrgica - Prática", type: "prática" },
  { dayIndex: 4, start: "18:40", end: "19:20", subject: "Clínica de Pequenos Animais", type: "teórica" },
  { dayIndex: 4, start: "19:20", end: "20:30", subject: "Clínica de Pequenos Animais", type: "teórica" },
  { dayIndex: 4, start: "20:30", end: "21:10", subject: "Clínica de Pequenos Animais", type: "teórica" },
  { dayIndex: 4, start: "21:10", end: "21:50", subject: "Clínica de Pequenos Animais", type: "teórica" },
];

// --------- FUNÇÕES PARA CRIAR IDs ---------

function uuid() {
  return "id-" + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

// --------- TAREFAS FIXAS (ROTINA + TÊNIS + AULAS) ---------

// gera tarefas de rotina da casa para um dia específico
function generateHouseTasksForDate(dateStr) {
  const tasksForDay = [];
  DEFAULT_HOUSE_ROUTINE.forEach((item) => {
    tasksForDay.push({
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
    });
  });
  return tasksForDay;
}

// gera tarefa de tênis de mesa se o dia for segunda, quarta ou sexta
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

// (As aulas automáticas virão na Parte 3 em classes.js)
