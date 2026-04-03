// ================================================
// sheets.js — Integração básica com Google Sheets
// ================================================

// Nesta versão, só um esqueleto. Você ainda precisa criar
// o Apps Script e preencher a URL.

function getSheetsUrl() {
  // Se quiser deixar hardcoded, coloque a URL aqui:
  // return "https://script.google.com/macros/s/XXXXX/exec";
  // Por padrão, volta string vazia (sem integração ativa).
  return "";
}

async function syncWithSheets() {
  const url = getSheetsUrl();
  if (!url) {
    throw new Error("URL do Apps Script não configurada.");
  }

  const payload = {
    action: "sync",
    tasks,
    exams,
  };

  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    throw new Error("Erro HTTP " + resp.status);
  }

  const data = await resp.json();
  if (data.tasks) {
    tasks = data.tasks;
    saveToStorage(STORAGE_KEYS.TASKS, tasks);
  }
  if (data.exams) {
    exams = data.exams;
    saveToStorage(STORAGE_KEYS.EXAMS, exams);
  }

  return data;
}
