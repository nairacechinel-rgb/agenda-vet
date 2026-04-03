// ================================================
// app.js — Controle geral, navegação e dashboard
// ================================================

// ── REFERÊNCIAS DO DOM ───────────────────────────────────────

const sectionDashboard = document.getElementById("section-dashboard");
const sectionWeek      = document.getElementById("section-week");
const sectionClasses   = document.getElementById("section-classes");
const sectionExams     = document.getElementById("section-exams");
const sectionStudy     = document.getElementById("section-study");
const sectionTasks     = document.getElementById("section-tasks");
const sectionTdah      = document.getElementById("section-tdah");
const sectionSettings  = document.getElementById("section-settings");

const topbarTitle    = document.getElementById("topbarTitle");
const btnAddTask     = document.getElementById("btnAddTask");
const btnSync        = document.getElementById("btnSync");
const toastContainer = document.getElementById("toastContainer");

// Modal tarefa
const modalTaskOverlay = document.getElementById("modalTaskOverlay");
const modalTaskClose   = document.getElementById("modalTaskClose");
const btnTaskCancel    = document.getElementById("btnTaskCancel");
const btnTaskSave      = document.getElementById("btnTaskSave");
const inputTaskTitle   = document.getElementById("inputTaskTitle");
const inputTaskDate    = document.getElementById("inputTaskDate");
const inputTaskStart   = document.getElementById("inputTaskStart");
const inputTaskEnd     = document.getElementById("inputTaskEnd");
const inputTaskCategory= document.getElementById("inputTaskCategory");
const inputTaskPriority= document.getElementById("inputTaskPriority");
const inputTaskNotes   = document.getElementById("inputTaskNotes");
const modalTaskTitle   = document.getElementById("modalTaskTitle");

// Modal prova
const modalExamOverlay = document.getElementById("modalExamOverlay");
const modalExamClose   = document.getElementById("modalExamClose");
const btnExamCancel    = document.getElementById("btnExamCancel");
const btnExamSave      = document.getElementById("btnExamSave");
const inputExamSubject = document.getElementById("examSubject");
const inputExamType    = document.getElementById("examType");
const inputExamDate    = document.getElementById("examDate");
const inputExamTime    = document.getElementById("examTime");
const inputExamWeight  = document.getElementById("examWeight");
const inputExamNotes   = document.getElementById("examNotes");
const topicsContainer  = document.getElementById("examTopicsContainer");
const modalExamTitle   = document.getElementById("modalExamTitle");

// ── ESTADO GLOBAL ────────────────────────────────────────────

// Sempre trabalhar com Date sem horário (zerado)
let currentDateView = toDateOnly(new Date());
let editingTaskId   = null;
let editingExamId   = null;

// ── TOAST ────────────────────────────────────────────────────

function showToast(msg, type = "info") {
  const t = document.createElement("div");
  t.className = `toast ${type}`;
  t.textContent = msg;
  toastContainer.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

// ── NAVEGAÇÃO ENTRE SEÇÕES ──────────────────────────────────

document.querySelectorAll(".nav-item").forEach(item => {
  item.addEventListener("click", e => {
    e.preventDefault();
    setActiveSection(item.dataset.section);
  });
});

function setActiveSection(key) {
  document.querySelectorAll(".nav-item").forEach(n =>
    n.classList.toggle("active", n.dataset.section === key)
  );
  document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));

  const map = {
    dashboard: sectionDashboard,
    week:      sectionWeek,
    classes:   sectionClasses,
    exams:     sectionExams,
    study:     sectionStudy,
    tasks:     sectionTasks,
    tdah:      sectionTdah,
    settings:  sectionSettings,
  };
  const titles = {
    dashboard: "Hoje",
    week:      "Semana",
    classes:   "Aulas",
    exams:     "Provas & Trabalhos",
    study:     "Plano de Estudos",
    tasks:     "Tarefas",
    tdah:      "Métodos TDAH",
    settings:  "Configurações",
  };

  if (map[key]) {
    map[key].classList.add("active");
    topbarTitle.textContent = titles[key] || "";
  }

  switch (key) {
    case "dashboard": renderDashboard();   break;
    case "week":      renderWeekView();    break;
    case "classes":   renderClassesView(); break;
    case "exams":     renderExamsView();   break;
    case "study":     renderStudyView();   break;
    case "tasks":     renderTasksView();   break;
    case "tdah":      renderTdahView();    break;
    case "settings":  renderSettingsView();break;
  }
}

function refreshCurrentView() {
  const active = document.querySelector(".nav-item.active");
  if (active) setActiveSection(active.dataset.section);
}

// ── GERAR TAREFAS AUTOMÁTICAS DE UM DIA ─────────────────────

function ensureAutoTasksForDate(dateStr) {
  const hasHouse = tasks.some(t => t.date === dateStr && t.source === "auto:house");
  if (!hasHouse) {
    tasks = tasks.concat(
      generateDailyHouseTasks(dateStr),
      generateWeeklyHouseTasks(dateStr),
    );
  }

  const hasLeisure = tasks.some(t => t.date === dateStr && t.source === "auto:leisure");
  if (!hasLeisure) {
    tasks = tasks.concat(generateLeisureForDate(dateStr));
  }

  const hasTenis = tasks.some(t => t.date === dateStr && t.source === "auto:tenis");
  if (!hasTenis) {
    tasks = tasks.concat(generateTenisForDate(dateStr));
  }

  const hasClass = tasks.some(t => t.date === dateStr && t.source === "auto:class");
  if (!hasClass) {
    tasks = tasks.concat(generateClassTasksForDate(dateStr));
  }

  saveToStorage(STORAGE_KEYS.TASKS, tasks);
}

// ── DASHBOARD: ABA HOJE ──────────────────────────────────────

function renderDashboard() {
  sectionDashboard.innerHTML = "";

  const dateStr = localDateStr(currentDateView);
  ensureAutoTasksForDate(dateStr);

  const header = document.createElement("div");
  header.className = "section-header";

  const info = document.createElement("div");
  const isToday = dateStr === localDateStr(new Date());
  const dist    = daysUntil(dateStr);
  let sub;
  if (isToday) sub = "Hoje";
  else if (dist > 0) sub = `Em ${dist} dia${dist > 1 ? "s" : ""}`;
  else if (dist < 0) sub = `Há ${Math.abs(dist)} dia${Math.abs(dist) > 1 ? "s" : ""}`;
  else sub = "";

  info.innerHTML = `
    <h1>${formatDateBR(dateStr)}</h1>
    <p>${sub}</p>
  `;

  const nav = document.createElement("div");
  nav.className = "day-nav";

  const btnPrev = document.createElement("button");
  btnPrev.className = "btn-day-nav";
  btnPrev.textContent = "< Anterior";
  btnPrev.addEventListener("click", () => {
    currentDateView.setDate(currentDateView.getDate() - 1);
    renderDashboard();
  });

  const btnToday = document.createElement("button");
  btnToday.className = "btn-today";
  btnToday.textContent = "Hoje";
  btnToday.addEventListener("click", () => {
    currentDateView = toDateOnly(new Date());
    renderDashboard();
  });

  const btnNext = document.createElement("button");
  btnNext.className = "btn-day-nav";
  btnNext.textContent = "Próximo >";
  btnNext.addEventListener("click", () => {
    currentDateView.setDate(currentDateView.getDate() + 1);
    renderDashboard();
  });

  nav.appendChild(btnPrev);
  nav.appendChild(btnToday);
  nav.appendChild(btnNext);

  header.appendChild(info);
  header.appendChild(nav);
  sectionDashboard.appendChild(header);

  const dayTasks = tasks
    .filter(t => t.date === dateStr)
    .sort((a, b) =>
      timeStrToMinutes(a.start || "00:00") - timeStrToMinutes(b.start || "00:00")
    );

  if (!dayTasks.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.innerHTML = `
      <div class="empty-icon">📭</div>
      <p>Nenhuma tarefa cadastrada para este dia.</p>
    `;
    sectionDashboard.appendChild(empty);
    return;
  }

  // Agrupa por categoria
  const groups = {
    class:   { label:"🏫 Aulas",      list:[] },
    sport:   { label:"🏓 Esporte",    list:[] },
    exam:    { label:"📝 Provas",     list:[] },
    study:   { label:"📚 Estudo",     list:[] },
    home:    { label:"🏠 Casa",       list:[] },
    leisure: { label:"🎮 Lazer",      list:[] },
    other:   { label:"📌 Outros",     list:[] },
  };
  dayTasks.forEach(t => {
    (groups[t.category] || groups.other).list.push(t);
  });

  Object.values(groups).forEach(g => {
    if (!g.list.length) return;

    const card = document.createElement("div");
    card.className = "card";
    const title = document.createElement("div");
    title.className = "card-title";
    title.textContent = g.label;
    card.appendChild(title);

    g.list.forEach(t => {
      const row = document.createElement("div");
      row.className = "task-row";

      const time = document.createElement("span");
      time.className = "task-time";
      time.textContent = t.start
        ? (t.end ? `${t.start} – ${t.end}` : t.start)
        : "--:--";

      const name = document.createElement("span");
      name.className = "task-title" + (t.done ? " done" : "");
      name.textContent = t.title;

      const check = document.createElement("input");
      check.type = "checkbox";
      check.className = "task-check";
      check.checked = t.done;
      check.addEventListener("change", () => {
        t.done = check.checked;
        saveToStorage(STORAGE_KEYS.TASKS, tasks);
        name.className = "task-title" + (t.done ? " done" : "");
      });

      row.appendChild(time);
      row.appendChild(name);
      row.appendChild(check);
      card.appendChild(row);
    });

    sectionDashboard.appendChild(card);
  });
}

// ── ABA SEMANA (VISÃO SIMPLIFICADA E FUNCIONAL) ──────────────

function renderWeekView() {
  sectionWeek.innerHTML = "";

  const header = document.createElement("div");
  header.className = "section-header";
  header.innerHTML = `
    <div>
      <h1>Semana</h1>
      <p>Visão de segunda a sexta com aulas, casa, estudo, tênis e lazer.</p>
    </div>
  `;
  sectionWeek.appendChild(header);

  const nav = document.createElement("div");
  nav.className = "day-nav";

  const btnPrev = document.createElement("button");
  btnPrev.className = "btn-day-nav";
  btnPrev.textContent = "< Semana anterior";
  btnPrev.addEventListener("click", () => {
    currentDateView.setDate(currentDateView.getDate() - 7);
    renderWeekView();
  });

  const btnThis = document.createElement("button");
  btnThis.className = "btn-today";
  btnThis.textContent = "Esta semana";
  btnThis.addEventListener("click", () => {
    currentDateView = toDateOnly(new Date());
    renderWeekView();
  });

  const btnNext = document.createElement("button");
  btnNext.className = "btn-day-nav";
  btnNext.textContent = "Próxima semana >";
  btnNext.addEventListener("click", () => {
    currentDateView.setDate(currentDateView.getDate() + 7);
    renderWeekView();
  });

  nav.appendChild(btnPrev);
  nav.appendChild(btnThis);
  nav.appendChild(btnNext);
  sectionWeek.appendChild(nav);

  // Segunda-feira da semana atual
  const base = toDateOnly(new Date(currentDateView));
  const diff = (base.getDay() + 6) % 7;
  base.setDate(base.getDate() - diff);

  const weekDates = [];
  for (let i = 0; i < 5; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    const ds = localDateStr(d);
    ensureAutoTasksForDate(ds);
    weekDates.push({ date: d, dateStr: ds });
  }

  const periodLabel = document.createElement("div");
  periodLabel.style.cssText = "font-size:.82rem;color:#64748b;margin-bottom:14px;";
  const s = weekDates[0].date.toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"});
  const e = weekDates[4].date.toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit",year:"numeric"});
  periodLabel.textContent = `${s} – ${e}`;
  sectionWeek.appendChild(periodLabel);

  const card = document.createElement("div");
  card.className = "card";

  const grid = document.createElement("div");
  grid.className = "week-grid";

  const todayStr = localDateStr(new Date());
  const dayLabels = ["Seg","Ter","Qua","Qui","Sex"];

  // Cabeçalho da grade
  const corner = document.createElement("div");
  corner.className = "week-header";
  corner.textContent = "Hora";
  grid.appendChild(corner);

  weekDates.forEach(({ date, dateStr }, i) => {
    const h = document.createElement("div");
    h.className = "week-header" + (dateStr === todayStr ? " today" : "");
    h.innerHTML = `
      <div>${dayLabels[i]}</div>
      <div style="font-size:.7rem;margin-top:2px">
        ${date.toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"})}
      </div>
    `;
    grid.appendChild(h);
  });

  // Linhas 07:00–22:00
  for (let m = 7 * 60; m <= 22 * 60; m += 60) {
    const timeCell = document.createElement("div");
    timeCell.className = "week-time";
    timeCell.textContent = minutesToTimeStr(m);
    grid.appendChild(timeCell);

    weekDates.forEach(({ dateStr }) => {
      const cell = document.createElement("div");
      cell.className = "week-cell";

      tasks
        .filter(t =>
          t.date === dateStr &&
          t.start &&
          timeStrToMinutes(t.start) >= m &&
          timeStrToMinutes(t.start) < m + 60
        )
        .forEach(t => {
          const ev = document.createElement("div");
          const cls = {
            home:"ev-home",
            study:"ev-study",
            sport:"ev-sport",
            leisure:"ev-leisure",
            class:"ev-class",
            exam:"ev-exam",
          }[t.category] || "ev-study";

          ev.className = "week-event " + cls;
          ev.textContent = t.title.length > 20
            ? t.title.slice(0, 18) + "…"
            : t.title;
          ev.title = `${t.title}\n${t.start}${t.end ? " – " + t.end : ""}`;

          ev.addEventListener("click", () => {
            currentDateView = toDateOnly(dateFromStr(dateStr));
            setActiveSection("dashboard");
          });

          cell.appendChild(ev);
        });

      grid.appendChild(cell);
    });
  }

  card.appendChild(grid);
  sectionWeek.appendChild(card);
}

// ── MODAL DE TAREFA (CRIAR SIMPLES) ──────────────────────────

function openTaskModal() {
  editingTaskId = null;
  modalTaskTitle.textContent = "Nova Tarefa";

  inputTaskTitle.value    = "";
  inputTaskDate.value     = localDateStr(currentDateView);
  inputTaskStart.value    = "";
  inputTaskEnd.value      = "";
  inputTaskCategory.value = "study";
  inputTaskPriority.value = "medium";
  inputTaskNotes.value    = "";

  modalTaskOverlay.classList.add("open");
}

function closeTaskModal() {
  modalTaskOverlay.classList.remove("open");
}

btnAddTask.addEventListener("click", openTaskModal);
modalTaskClose.addEventListener("click", closeTaskModal);
btnTaskCancel.addEventListener("click", closeTaskModal);

btnTaskSave.addEventListener("click", () => {
  const title = inputTaskTitle.value.trim();
  const date  = inputTaskDate.value;
  const start = inputTaskStart.value || null;
  const end   = inputTaskEnd.value   || null;
  const category = inputTaskCategory.value;
  const priority = inputTaskPriority.value;
  const notes    = inputTaskNotes.value.trim();

  if (!title || !date) {
    showToast("Preencha pelo menos o nome e a data.", "warning");
    return;
  }

  const task = {
    id: editingTaskId || uuid(),
    title, date, start, end,
    category, priority, notes,
    done:false,
    source:"user",
  };

  if (editingTaskId) {
    const idx = tasks.findIndex(t => t.id === editingTaskId);
    if (idx >= 0) tasks[idx] = task;
  } else {
    tasks.push(task);
  }

  saveToStorage(STORAGE_KEYS.TASKS, tasks);
  closeTaskModal();
  showToast("Tarefa salva!", "success");
  refreshCurrentView();
});

// ── MODAL DE PROVA (apenas esqueleto aqui, detalhes em exams.js) ───

modalExamClose.addEventListener("click", () => {
  modalExamOverlay.classList.remove("open");
});
btnExamCancel.addEventListener("click", () => {
  modalExamOverlay.classList.remove("open");
});

// ── BOTÃO SYNC COM SHEETS ────────────────────────────────────

btnSync.addEventListener("click", async () => {
  try {
    btnSync.disabled = true;
    btnSync.innerHTML = "<span>⏳</span> Sincronizando...";
    await syncWithSheets();
    showToast("Sincronização concluída.", "success");
  } catch (e) {
    console.error(e);
    showToast("Erro ao sincronizar: " + e.message, "error");
  } finally {
    btnSync.disabled = false;
    btnSync.innerHTML = "<span>☁</span> Sincronizar Sheets";
  }
});

// ── ABA CONFIGURAÇÕES (SIMPLES) ──────────────────────────────

function renderSettingsView() {
  sectionSettings.innerHTML = "";

  const header = document.createElement("div");
  header.className = "section-header";
  header.innerHTML = `
    <div>
      <h1>Configurações</h1>
      <p>Integração com Google Sheets e backup de dados.</p>
    </div>
  `;
  sectionSettings.appendChild(header);

  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = `
    <div class="card-title">ℹ Sobre a Agenda</div>
    <p style="font-size:.84rem;color:#9ca3af;line-height:1.7">
      Agenda personalizada para Naira (Medicina Veterinária), com:
      rotina da casa, aulas, treinos de tênis de mesa, estudo guiado
      por provas e métodos adaptados para TDAH.
    </p>
  `;
  sectionSettings.appendChild(card);
}

// ── INICIALIZAÇÃO ────────────────────────────────────────────

window.addEventListener("load", () => {
  // Garante que hoje tenha tarefas geradas (casa, aulas, etc.)
  ensureAutoTasksForDate(localDateStr(currentDateView));
  setActiveSection("dashboard");
});
