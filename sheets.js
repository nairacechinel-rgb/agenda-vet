// ===============================
// sheets.js — Integração com Google Sheets
// ===============================

// Cole aqui a URL que o Apps Script vai te gerar
// Exemplo: "https://script.google.com/macros/s/AKfycbx.../exec"
const SHEETS_API_URL = "";

// ── SINCRONIZAR (enviar + receber) ────────────────────────────
async function syncWithSheets() {
  if (!SHEETS_API_URL) {
    throw new Error("URL do Apps Script não configurada. Vá em sheets.js e preencha SHEETS_API_URL.");
  }

  const payload = {
    action: "sync",
    tasks:  tasks,
    exams:  exams,
  };

  const response = await fetch(SHEETS_API_URL, {
    method:  "POST",
    headers: { "Content-Type": "text/plain" },
    body:    JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Erro HTTP " + response.status);
  }

  const data = await response.json();

  if (data.status !== "ok") {
    throw new Error(data.message || "Erro desconhecido na sincronização.");
  }

  // Atualiza os dados locais com o que veio da planilha
  if (Array.isArray(data.tasks)) {
    tasks = data.tasks;
    saveToStorage(STORAGE_KEYS.TASKS, tasks);
  }
  if (Array.isArray(data.exams)) {
    exams = data.exams;
    saveToStorage(STORAGE_KEYS.EXAMS, exams);
  }

  return data;
}

// ── APENAS ENVIAR (backup) ────────────────────────────────────
async function pushToSheets() {
  if (!SHEETS_API_URL) {
    throw new Error("URL do Apps Script não configurada.");
  }

  const payload = {
    action: "push",
    tasks:  tasks,
    exams:  exams,
  };

  const response = await fetch(SHEETS_API_URL, {
    method:  "POST",
    headers: { "Content-Type": "text/plain" },
    body:    JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Erro HTTP " + response.status);
  }

  return await response.json();
}

// ── APENAS RECEBER (restaurar da planilha) ────────────────────
async function pullFromSheets() {
  if (!SHEETS_API_URL) {
    throw new Error("URL do Apps Script não configurada.");
  }

  const url = SHEETS_API_URL + "?action=pull";
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Erro HTTP " + response.status);
  }

  const data = await response.json();

  if (Array.isArray(data.tasks)) {
    tasks = data.tasks;
    saveToStorage(STORAGE_KEYS.TASKS, tasks);
  }
  if (Array.isArray(data.exams)) {
    exams = data.exams;
    saveToStorage(STORAGE_KEYS.EXAMS, exams);
  }

  return data;
}
