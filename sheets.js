// ===============================
// sheets.js — Esqueleto da integração com Google Sheets
// ===============================

// Quando você criar o Apps Script, coloque a URL aqui:
const SHEETS_API_URL = ""; 
// ex: "https://script.google.com/macros/s/AKfycbx.../exec"

async function syncWithSheets() {
  if (!SHEETS_API_URL) {
    throw new Error("URL do Apps Script ainda não configurada.");
  }

  // dados que queremos enviar para a planilha
  const payload = {
    tasks,
    exams,
  };

  const response = await fetch(SHEETS_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Erro HTTP na sincronização: " + response.status);
  }

  const data = await response.json();

  // Se quiser, podemos atualizar tasks/exams com o que vier da planilha:
  if (Array.isArray(data.tasks)) {
    tasks = data.tasks;
    saveToStorage(STORAGE_KEYS.TASKS, tasks);
  }
  if (Array.isArray(data.exams)) {
    exams = data.exams;
    saveToStorage(STORAGE_KEYS.EXAMS, exams);
  }
}
