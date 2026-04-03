// ===============================
// app.js
// Controle principal da interface
// ===============================

let currentDateView = toDateOnly(new Date()); // dia que está sendo visualizado

// elementos globais
const sidebar = document.getElementById("sidebar");
const sidebarToggle = document.getElementById("sidebarToggle");
const btnMenuMobile = document.getElementById("btnMenuMobile");
const mainContent = document.getElementById("mainContent");
const navItems = document.querySelectorAll(".nav-item");
const topbarTitle = document.getElementById("topbarTitle");
const currentDateLabel = document.getElementById("currentDate");
const btnAddTask = document.getElementById("btnAddTask");

// seções
const sectionDashboard = document.getElementById("section-dashboard");
const sectionWeek = document.getElementById("section-week");
const sectionClasses = document.getElementById("section-classes");
const sectionExams = document.getElementById("section-exams");
const sectionStudy = document.getElementById("section-study");
const sectionTasks = document.getElementById("section-tasks");
const sectionTdah = document.getElementById("section-tdah");
const sectionSettings = document.getElementById("section-settings");

// modal tarefa
const modalTaskOverlay = document.getElementById("modalTaskOverlay");
const modalTaskClose = document.getElementById("modalTaskClose");
const btnTaskCancel = document.getElementById("btnTaskCancel");
const btnTaskSave = document.getElementById("btnTaskSave");

// inputs do modal tarefa
const inputTaskName = document.getElementById("taskName");
const inputTaskDate = document.getElementById("taskDate");      
const inputTaskTimeStart = document.getElementById("taskTimeStart");
const inputTaskTimeEnd = document.getElementById("taskTimeEnd");
const inputTaskCategory = document.getElementById("taskCategory");
const inputTaskPriority = document.getElementById("taskPriority");
const inputTaskNotes = document.getElementById("taskNotes");

// toast
const toastEl = document.getElementById("toast");

// ── BOTÃO DE SINCRONIZAÇÃO ────────────────────────────────────
btnSync.addEventListener("click", async () => {
  if (!SHEETS_API_URL) {
    showToast("Configure a URL do Apps Script em sheets.js antes de sincronizar.", "warning");
    renderSettingsView();
    setActiveSection("settings");
    return;
  }

  btnSync.disabled = true;
  btnSync.innerHTML = "<span>⏳</span> Sincronizando...";

  try {
    await syncWithSheets();
    showToast("Sincronizado com Google Sheets!", "success");
    refreshCurrentView();
  } catch (e) {
    console.error(e);
    showToast("Erro: " + e.message, "error");
  } finally {
    btnSync.disabled = false;
    btnSync.innerHTML = "<span>☁</span> Sincronizar Sheets";
  }
});
// estado de modal
let editingTaskId = null;

// ===============================
// TOAST
// ===============================
function showToast(message, type = "info") {
  toastEl.textContent = message;
  toastEl.className = "toast " + type + " show";
  setTimeout(() => {
    toastEl.classList.remove("show");
  }, 3000);
}

// ===============================
// SIDEBAR / NAVEGAÇÃO
// ===============================

sidebarToggle.addEventListener("click", () => {
  sidebar.classList.toggle("collapsed");
  mainContent.classList.toggle("expanded");
});

btnMenuMobile.addEventListener("click", () => {
  sidebar.classList.toggle("open");
});

// troca de seção
navItems.forEach((item) => {
  item.addEventListener("click", (e) => {
    e.preventDefault();
    const sectionKey = item.dataset.section;
    setActiveSection(sectionKey);
  });
});

function setActiveSection(sectionKey) {
  document.querySelectorAll(".nav-item").forEach(item => {
    item.classList.toggle("active", item.dataset.section === sectionKey);
  });

  document.querySelectorAll(".section").forEach(sec => sec.classList.remove("active"));

  switch (sectionKey) {
    case "dashboard":
      sectionDashboard.classList.add("active");
      topbarTitle.textContent = "Hoje";
      renderDashboard();
      break;

    case "week":
      sectionWeek.classList.add("active");
      topbarTitle.textContent = "Semana";
      renderWeekView(); // ← PRECISA chamar essa função
      break;

    case "classes":
      sectionClasses.classList.add("active");
      topbarTitle.textContent = "Aulas";
      renderClassesView();
      break;

    case "exams":
      sectionExams.classList.add("active");
      topbarTitle.textContent = "Provas & Trabalhos";
      renderExamsView();
      break;

    case "study":
      sectionStudy.classList.add("active");
      topbarTitle.textContent = "Plano de Estudos";
      renderStudyView();
      break;

    case "tasks":
      sectionTasks.classList.add("active");
      topbarTitle.textContent = "Tarefas";
      renderTasksView();
      break;

    case "tdah":
      sectionTdah.classList.add("active");
      topbarTitle.textContent = "Métodos TDAH";
      renderTdahView();
      break;

    case "settings":
      sectionSettings.classList.add("active");
      topbarTitle.textContent = "Configurações";
      renderSettingsView();
      break;
  }
}

// ===============================
// MODAL TAREFA
// ===============================

function openTaskModal(dateStr = null, startTime = null) {
  modalTaskOverlay.classList.add("open");

  // define data e hora padrão com base no dia em visualização ou no clique
  const d = dateStr || currentDateView.toISOString().slice(0, 10);
  inputTaskDate.value = d;
  inputTaskTimeStart.value = startTime || "";
  inputTaskTimeEnd.value = "";
  inputTaskName.value = "";
  inputTaskCategory.value = "other";
  inputTaskPriority.value = "medium";
  inputTaskNotes.value = "";
  editingTaskId = null;
}

function closeTaskModal() {
  modalTaskOverlay.classList.remove("open");
}

btnAddTask.addEventListener("click", () => openTaskModal());
modalTaskClose.addEventListener("click", closeTaskModal);
btnTaskCancel.addEventListener("click", closeTaskModal);

btnTaskSave.addEventListener("click", () => {
  const title = inputTaskName.value.trim();
  const date = inputTaskDate.value;
  const start = inputTaskTimeStart.value;
  const end = inputTaskTimeEnd.value || null;
  const category = inputTaskCategory.value;
  const priority = inputTaskPriority.value;
  const notes = inputTaskNotes.value.trim();

  if (!title || !date || !start) {
    showToast("Preencha pelo menos nome, data e horário de início.", "warning");
    return;
  }

  if (editingTaskId) {
    const taskIndex = tasks.findIndex((t) => t.id === editingTaskId);
    if (taskIndex >= 0) {
      tasks[taskIndex] = {
        ...tasks[taskIndex],
        title,
        date,
        start,
        end,
        category,
        priority,
        notes,
        source: tasks[taskIndex].source || "user",
      };
    }
  } else {
    tasks.push({
      id: uuid(),
      title,
      date,
      start,
      end,
      category,
      priority,
      notes,
      done: false,
      source: "user",
    });
  }

  saveToStorage(STORAGE_KEYS.TASKS, tasks);
  closeTaskModal();
  showToast("Tarefa salva!", "success");
  // se estiver no dashboard, re-renderiza
  renderDashboard();
});

// ===============================
// DASHBOARD (HOJE / DIA SELECIONADO)
// ===============================
function ensureAutoTasksForDate(dateStr) {

  // ── 1. ROTINA DOMÉSTICA (diária + semanal) ──────────────────
  const hasHouse = tasks.some(t =>
    t.date === dateStr && t.source === "auto:house"
  );
  if (!hasHouse) {
    const daily  = generateDailyHouseTasks(dateStr);
    const weekly = generateWeeklyHouseTasks(dateStr);
    tasks = tasks.concat(daily, weekly);
  }

  // ── 2. LAZER (fins de semana) ───────────────────────────────
  const hasLeisure = tasks.some(t =>
    t.date === dateStr && t.source === "auto:leisure"
  );
  if (!hasLeisure) {
    const leisure = generateLeisureForDate(dateStr);
    tasks = tasks.concat(leisure);
  }

  // ── 3. TÊNIS DE MESA ────────────────────────────────────────
  const hasTenis = tasks.some(t =>
    t.date === dateStr && t.source === "auto:tenis"
  );
  if (!hasTenis) {
    const tenis = generateTenisForDate(dateStr);
    tasks = tasks.concat(tenis);
  }

  // ── 4. AULAS ────────────────────────────────────────────────
  const hasClass = tasks.some(t =>
    t.date === dateStr && t.source === "auto:class"
  );
  if (!hasClass && typeof generateClassTasksForDate === "function") {
    const cls = generateClassTasksForDate(dateStr);
    tasks = tasks.concat(cls);
  }

  // ── 5. BLOCOS DE ESTUDO (gerados pelo exams.js) ─────────────
  // Os blocos de estudo já ficam no array `tasks` com source "auto:study:..."
  // e são gerados/atualizados sempre que uma prova é salva ou excluída.
  // Aqui só garantimos que o exams.js já rodou na inicialização.

  // ── SALVA TUDO ───────────────────────────────────────────────
  saveToStorage(STORAGE_KEYS.TASKS, tasks);
}

function getTasksForDate(dateObj) {
  const dateStr = dateObj.toISOString().slice(0, 10);
  ensureAutoTasksForDate(dateStr);
  return tasks
    .filter((t) => t.date === dateStr)
    .sort((a, b) => {
      const sa = timeStrToMinutes(a.start || "00:00");
      const sb = timeStrToMinutes(b.start || "00:00");
      return sa - sb;
    });
}

// navegação do dia no dashboard
function renderDayNavigator() {
  const dateStr = currentDateView.toISOString().slice(0, 10);
  const container = document.createElement("div");
  container.className = "day-nav";

  const btnPrev = document.createElement("button");
  btnPrev.className = "btn-day-nav";
  btnPrev.textContent = "< Dia anterior";
  btnPrev.addEventListener("click", () => {
    currentDateView.setDate(currentDateView.getDate() - 1);
    renderDashboard();
  });

  const btnNext = document.createElement("button");
  btnNext.className = "btn-day-nav";
  btnNext.textContent = "Próximo dia >";
  btnNext.addEventListener("click", () => {
    currentDateView.setDate(currentDateView.getDate() + 1);
    renderDashboard();
  });

  const mid = document.createElement("div");
  mid.className = "day-nav-date";
  mid.textContent = formatDateBR(dateStr);

  const btnToday = document.createElement("button");
  btnToday.className = "btn-today";
  btnToday.textContent = "Hoje";
  btnToday.addEventListener("click", () => {
    currentDateView = toDateOnly(new Date());
    renderDashboard();
  });

  container.appendChild(btnPrev);
  container.appendChild(mid);
  container.appendChild(btnNext);
  container.appendChild(btnToday);
  return container;
}

// círculo de progresso de tarefas concluídas
function renderProgressCircle(total, done) {
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  const offset = circumference - (percent / 100) * circumference;

  const wrapper = document.createElement("div");
  wrapper.className = "progress-row";

  const circle = document.createElement("div");
  circle.className = "progress-circle";
  circle.innerHTML = `
    <svg width="68" height="68">
      <circle class="track" cx="34" cy="34" r="${radius}"></circle>
      <circle class="fill" cx="34" cy="34" r="${radius}"
        stroke-dasharray="${circumference}"
        stroke-dashoffset="${offset}"></circle>
    </svg>
    <div class="progress-label">${percent}%</div>
  `;

  const info = document.createElement("div");
  info.className = "progress-info";
  info.innerHTML = `
    <strong>${done}/${total} atividades concluídas</strong>
    <span>Marque como "feito" conforme for realizando. Isso ajuda o cérebro (TDAH) a visualizar progresso concreto.</span>
  `;

  wrapper.appendChild(circle);
  wrapper.appendChild(info);
  return wrapper;
}

// timeline do dia
function renderTimeline(tasksToday) {
  const container = document.createElement("div");
  container.className = "timeline";

  if (tasksToday.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.innerHTML = `
      <div class="empty-icon">🧩</div>
      <p>Sem tarefas para este dia. Você pode adicionar algo manualmente clicando em "Nova Tarefa".</p>
    `;
    container.appendChild(empty);
    return container;
  }

  tasksToday.forEach((task) => {
    const row = document.createElement("div");
    row.className = "timeline-item";

    const timeLabel = document.createElement("div");
    timeLabel.className = "time-label";
    timeLabel.textContent = task.start || "--:--";

    const block = document.createElement("div");
    const typeClass = `type-${task.category || "other"}`;
    block.className = `time-block ${typeClass} ${task.done ? "done" : ""}`;

    const name = document.createElement("div");
    name.className = "block-name";
    name.textContent = task.title;

    const meta = document.createElement("div");
    meta.className = "block-meta";

    const timeText = task.end
      ? `${task.start} - ${task.end}`
      : `${task.start}`;
    const catLabel = {
      home: "Tarefa de casa",
      study: "Estudo",
      leisure: "Lazer",
      sport: "Esporte",
      class: "Aula",
      exam: "Prova/Trabalho",
      other: "Outro",
    }[task.category || "other"];

    meta.textContent = `${timeText} · ${catLabel}`;

    if (task.source && task.source.startsWith("auto:")) {
      const spanAuto = document.createElement("span");
      spanAuto.textContent = " · automático";
      spanAuto.style.color = "#64748b";
      meta.appendChild(spanAuto);
    }

    const actions = document.createElement("div");
    actions.className = "block-actions";

    const btnDone = document.createElement("button");
    btnDone.className = "btn-done";
    btnDone.title = "Marcar como feito";
    btnDone.textContent = "✓";
    btnDone.addEventListener("click", () => {
      task.done = !task.done;
      saveToStorage(STORAGE_KEYS.TASKS, tasks);
      renderDashboard();
    });

    const btnEdit = document.createElement("button");
    btnEdit.className = "btn-edit-block";
    btnEdit.title = "Editar tarefa";
    btnEdit.textContent = "✎";
    btnEdit.addEventListener("click", () => {
      editingTaskId = task.id;
      modalTaskOverlay.classList.add("open");
      inputTaskName.value = task.title;
      inputTaskDate.value = task.date;
      inputTaskTimeStart.value = task.start || "";
      inputTaskTimeEnd.value = task.end || "";
      inputTaskCategory.value = task.category || "other";
      inputTaskPriority.value = task.priority || "medium";
      inputTaskNotes.value = task.notes || "";
    });

    const btnDel = document.createElement("button");
    btnDel.className = "btn-del-block";
    btnDel.title = "Excluir tarefa";
    btnDel.textContent = "🗑";
    btnDel.addEventListener("click", () => {
      if (confirm("Tem certeza que deseja excluir esta tarefa?")) {
        tasks = tasks.filter((t) => t.id !== task.id);
        saveToStorage(STORAGE_KEYS.TASKS, tasks);
        renderDashboard();
      }
    });

    actions.appendChild(btnDone);
    actions.appendChild(btnEdit);
    actions.appendChild(btnDel);

    block.appendChild(name);
    block.appendChild(meta);
    block.appendChild(actions);

    row.appendChild(timeLabel);
    row.appendChild(block);

    container.appendChild(row);
  });

  return container;
}

// cartão de estatísticas gerais do dia
function renderStatsRow(tasksToday) {
  const row = document.createElement("div");
  row.className = "stats-row";

  const total = tasksToday.length;
  const done = tasksToday.filter((t) => t.done).length;
  const homeCount = tasksToday.filter((t) => t.category === "home").length;
  const studyCount = tasksToday.filter((t) => t.category === "study").length;

  const card1 = document.createElement("div");
  card1.className = "stat-card";
  card1.innerHTML = `<div class="stat-number">${total}</div><div class="stat-label">Atividades do dia</div>`;

  const card2 = document.createElement("div");
  card2.className = "stat-card";
  card2.innerHTML = `<div class="stat-number">${done}</div><div class="stat-label">Concluídas</div>`;

  const card3 = document.createElement("div");
  card3.className = "stat-card";
  card3.innerHTML = `<div class="stat-number">${homeCount}</div><div class="stat-label">De casa</div>`;

  const card4 = document.createElement("div");
  card4.className = "stat-card";
  card4.innerHTML = `<div class="stat-number">${studyCount}</div><div class="stat-label">Blocos de estudo</div>`;

  row.appendChild(card1);
  row.appendChild(card2);
  row.appendChild(card3);
  row.appendChild(card4);

  return row;
}

// render principal do dashboard
function renderDashboard() {
  const dateStr = currentDateView.toISOString().slice(0, 10);
  currentDateLabel.textContent = formatDateBR(dateStr);

  // limpa seção
  sectionDashboard.innerHTML = "";

  // nav do dia
  sectionDashboard.appendChild(renderDayNavigator());

  // tarefas do dia
  const tasksToday = getTasksForDate(currentDateView);

  // card de progresso
  const cardProgress = document.createElement("div");
  cardProgress.className = "card";
  const title = document.createElement("div");
  title.className = "card-title";
  title.innerHTML = "Resumo do dia";
  cardProgress.appendChild(title);
  cardProgress.appendChild(
    renderProgressCircle(tasksToday.length, tasksToday.filter((t) => t.done).length)
  );

  sectionDashboard.appendChild(cardProgress);

  // stats
  sectionDashboard.appendChild(renderStatsRow(tasksToday));

  // timeline
  const cardTimeline = document.createElement("div");
  cardTimeline.className = "card";
  const title2 = document.createElement("div");
  title2.className = "card-title";
  title2.textContent = "Linha do tempo do dia";
  cardTimeline.appendChild(title2);
  cardTimeline.appendChild(renderTimeline(tasksToday));
  sectionDashboard.appendChild(cardTimeline);
}

// ===============================
// PLACEHOLDERS PARA OUTRAS TELAS
// (vou implementar nas próximas partes)
// ===============================
function renderWeekView() {
  sectionWeek.innerHTML = "<p style='color:#94a3b8'>Visão semanal será implementada na próxima parte.</p>";
}
function renderTasksView() {
  sectionTasks.innerHTML = "<p style='color:#94a3b8'>Lista completa de tarefas será implementada na próxima parte.</p>";
}
function renderSettingsView() {
  sectionSettings.innerHTML = "";

  const header = document.createElement("div");
  header.className = "section-header";
  header.innerHTML = `
    <div>
      <h1>Configurações</h1>
      <p>Integração com Google Sheets e preferências gerais.</p>
    </div>
  `;
  sectionSettings.appendChild(header);

  // ── CARD: Google Sheets ───────────────────────────────────
  const sheetsCard = document.createElement("div");
  sheetsCard.className = "card";

  const sheetsTitle = document.createElement("div");
  sheetsTitle.className = "card-title";
  sheetsTitle.textContent = "☁ Integração com Google Sheets";
  sheetsCard.appendChild(sheetsTitle);

  const desc = document.createElement("p");
  desc.style.cssText = "font-size:.84rem;color:#9ca3af;line-height:1.6;margin-bottom:16px";
  desc.innerHTML = `
    Cole abaixo a URL gerada pelo seu Apps Script.<br>
    Ao salvar, o botão <strong>"Sincronizar Sheets"</strong> na barra lateral passará a funcionar.
  `;
  sheetsCard.appendChild(desc);

  const urlLabel = document.createElement("label");
  urlLabel.style.cssText = "font-size:.82rem;color:#94a3b8;display:block;margin-bottom:6px";
  urlLabel.textContent = "URL do Apps Script";

  const urlInput = document.createElement("input");
  urlInput.type = "text";
  urlInput.placeholder = "https://script.google.com/macros/s/.../exec";
  urlInput.style.marginBottom = "12px";

  // carrega URL salva (se houver)
  const savedUrl = localStorage.getItem("naira_sheets_url") || "";
  urlInput.value = savedUrl;

  // status
  const statusEl = document.createElement("div");
  statusEl.style.cssText = "font-size:.8rem;margin-bottom:14px;";
  statusEl.textContent = savedUrl
    ? "✅ URL configurada."
    : "⚠️ Nenhuma URL configurada ainda.";
  statusEl.style.color = savedUrl ? "#4ade80" : "#facc15";

  const btnRow = document.createElement("div");
  btnRow.style.cssText = "display:flex;gap:10px;flex-wrap:wrap;";

  const btnSaveUrl = document.createElement("button");
  btnSaveUrl.className = "btn-save";
  btnSaveUrl.textContent = "Salvar URL";
  btnSaveUrl.addEventListener("click", () => {
    const url = urlInput.value.trim();
    if (!url.startsWith("https://script.google.com")) {
      showToast("URL inválida. Deve começar com https://script.google.com", "error");
      return;
    }
    localStorage.setItem("naira_sheets_url", url);
    // atualiza a variável global em sheets.js
    window.SHEETS_API_URL_DYNAMIC = url;
    statusEl.textContent = "✅ URL salva com sucesso!";
    statusEl.style.color = "#4ade80";
    showToast("URL do Apps Script salva!", "success");
  });

  const btnTestSync = document.createElement("button");
  btnTestSync.className = "btn-cancel";
  btnTestSync.textContent = "Testar conexão";
  btnTestSync.addEventListener("click", async () => {
    btnTestSync.textContent = "Testando...";
    btnTestSync.disabled = true;
    try {
      await syncWithSheets();
      showToast("Conexão funcionando!", "success");
      statusEl.textContent = "✅ Conexão testada com sucesso.";
      statusEl.style.color = "#4ade80";
    } catch (e) {
      showToast("Falha: " + e.message, "error");
      statusEl.textContent = "❌ Falha na conexão: " + e.message;
      statusEl.style.color = "#f87171";
    } finally {
      btnTestSync.textContent = "Testar conexão";
      btnTestSync.disabled = false;
    }
  });

  const btnClearUrl = document.createElement("button");
  btnClearUrl.className = "btn-cancel";
  btnClearUrl.style.color = "#f87171";
  btnClearUrl.textContent = "Remover URL";
  btnClearUrl.addEventListener("click", () => {
    localStorage.removeItem("naira_sheets_url");
    urlInput.value = "";
    window.SHEETS_API_URL_DYNAMIC = "";
    statusEl.textContent = "⚠️ URL removida.";
    statusEl.style.color = "#facc15";
    showToast("URL removida.", "info");
  });

  btnRow.appendChild(btnSaveUrl);
  btnRow.appendChild(btnTestSync);
  btnRow.appendChild(btnClearUrl);

  sheetsCard.appendChild(urlLabel);
  sheetsCard.appendChild(urlInput);
  sheetsCard.appendChild(statusEl);
  sheetsCard.appendChild(btnRow);
  sectionSettings.appendChild(sheetsCard);

  // ── CARD: Dados locais ────────────────────────────────────
  const dataCard = document.createElement("div");
  dataCard.className = "card";

  const dataTitle = document.createElement("div");
  dataTitle.className = "card-title";
  dataTitle.textContent = "🗄 Dados locais";
  dataCard.appendChild(dataTitle);

  const dataDesc = document.createElement("p");
  dataDesc.style.cssText = "font-size:.84rem;color:#9ca3af;line-height:1.6;margin-bottom:14px";
  dataDesc.innerHTML = `
    Seus dados ficam salvos no navegador (localStorage).
    Use as opções abaixo para exportar um backup ou limpar tudo.
  `;
  dataCard.appendChild(dataDesc);

  const dataRow = document.createElement("div");
  dataRow.style.cssText = "display:flex;gap:10px;flex-wrap:wrap;";

  const btnExport = document.createElement("button");
  btnExport.className = "btn-save";
  btnExport.textContent = "📥 Exportar backup (JSON)";
  btnExport.addEventListener("click", () => {
    const backup = {
      tasks,
      exams,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob(
      [JSON.stringify(backup, null, 2)],
      { type: "application/json" }
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `agenda-naira-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    showToast("Backup exportado!", "success");
  });

  const btnImport = document.createElement("button");
  btnImport.className = "btn-cancel";
  btnImport.textContent = "📤 Importar backup (JSON)";
  btnImport.addEventListener("click", () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.addEventListener("change", e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        try {
          const data = JSON.parse(ev.target.result);
          if (data.tasks) {
            tasks = data.tasks;
            saveToStorage(STORAGE_KEYS.TASKS, tasks);
          }
          if (data.exams) {
            exams = data.exams;
            saveToStorage(STORAGE_KEYS.EXAMS, exams);
          }
          showToast("Backup importado com sucesso!", "success");
          refreshCurrentView();
        } catch {
          showToast("Arquivo inválido.", "error");
        }
      };
      reader.readAsText(file);
    });
    input.click();
  });

  const btnClearAll = document.createElement("button");
  btnClearAll.className = "btn-cancel";
  btnClearAll.style.color = "#f87171";
  btnClearAll.textContent = "🗑 Limpar todos os dados";
  btnClearAll.addEventListener("click", () => {
    if (confirm("Tem certeza? Isso apaga TODAS as tarefas e avaliações salvas localmente.")) {
      localStorage.clear();
      tasks = [];
      exams = [];
      showToast("Dados limpos. A agenda vai recriar a rotina automaticamente.", "info");
      refreshCurrentView();
    }
  });

  dataRow.appendChild(btnExport);
  dataRow.appendChild(btnImport);
  dataRow.appendChild(btnClearAll);
  dataCard.appendChild(dataRow);
  sectionSettings.appendChild(dataCard);

  // ── CARD: Sobre ───────────────────────────────────────────
  const aboutCard = document.createElement("div");
  aboutCard.className = "card";
  aboutCard.innerHTML = `
    <div class="card-title">ℹ Sobre esta agenda</div>
    <p style="font-size:.84rem;color:#9ca3af;line-height:1.7">
      Desenvolvida para <strong>Naira</strong> — acadêmica de Medicina Veterinária, 7ª fase.<br>
      Integra rotina doméstica, aulas, tênis de mesa, blocos de estudo adaptativos e métodos TDAH.<br><br>
      <strong>Versão:</strong> 1.0<br>
      <strong>Armazenamento:</strong> Local (navegador) + Google Sheets (opcional)<br>
      <strong>Hospedagem:</strong> GitHub Pages
    </p>
  `;
  sectionSettings.appendChild(aboutCard);
}

// ===============================
// SYNC BUTTON (Sheets virá na Parte 6)
// ===============================
btnSync.addEventListener("click", () => {
  showToast("Integração com Google Sheets será configurada mais adiante.", "info");
});

// ===============================
// INICIALIZAÇÃO
// ===============================

document.addEventListener("DOMContentLoaded", () => {
  // data atual na topbar
  const now = new Date();
  currentDateLabel.textContent = formatDateBR(now);
  // Gera blocos de estudo ao iniciar (se tiver provas cadastradas)
generateStudyBlocksForAllExams();
  // render inicial
  setActiveSection("dashboard");
});
