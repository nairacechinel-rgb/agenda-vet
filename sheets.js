// ===============================
// sheets.js — Integração com Google Sheets (versão final)
// ===============================

// Retorna a URL correta: prioriza o que foi salvo nas configurações,
// depois o que estiver hardcoded abaixo.
function getSheetsUrl() {
  return localStorage.getItem("naira_sheets_url") || "";
}

async function syncWithSheets() {
  const url = getSheetsUrl();
  if (!url) {
    throw new Error("URL do Apps Script não configurada. Vá em Configurações e cole a URL.");
  }

  const payload = {
    action: "sync",
    tasks:  tasks,
    exams:  exams,
  };

  const response = await fetch(url, {
    method:  "POST",
    headers: { "Content-Type": "text/plain" },
    body:    JSON.stringify(payload),
  });

  if (!response.ok) throw new Error("Erro HTTP " + response.status);

  const data = await response.json();
  if (data.status !== "ok") throw new Error(data.message || "Erro na sincronização.");

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

async function pushToSheets() {
  const url = getSheetsUrl();
  if (!url) throw new Error("URL não configurada.");

  const response = await fetch(url, {
    method:  "POST",
    headers: { "Content-Type": "text/plain" },
    body:    JSON.stringify({ action:"push", tasks, exams }),
  });

  if (!response.ok) throw new Error("Erro HTTP " + response.status);
  return await response.json();
}

async function pullFromSheets() {
  const url = getSheetsUrl();
  if (!url) throw new Error("URL não configurada.");

  const response = await fetch(url + "?action=pull");
  if (!response.ok) throw new Error("Erro HTTP " + response.status);

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
