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
const topbarTitle      = document.getElementById("topbarTitle");
const btnAddTask       = document.getElementById("btnAddTask");
const btnSync          = document.getElementById("btnSync");
const toastContainer   = document.getElementById("toastContainer");

// ── ESTADO GLOBAL ────────────────────────────────────────────

// Usa localDateStr para evitar problema de fuso horário
let currentDateView = toDateOnly(new Date());

// ── TOAST ────────────────────────────────────────────────────

function showToast(msg, type = "info") {
  const t = document.createElement("div");
  t.className = `toast ${type}`;
  t.textContent = msg;
  toastContainer.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

// ── NAVEGAÇÃO ────────────────────────────────────────────────

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
  document.querySelectorAll(".section").forEach(s =>
    s.classList.remove("active")
  );

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
    case "dashboard": renderDashboard();    break;
    case "week":      renderWeekView();     break;
    case "classes":   renderClassesView();  break;
    case "exams":     renderExamsView();    break;
    case "study":     renderStudyView();    break;
    case "tasks":     renderTasksView();    break;
    case "tdah":      renderTdahView();     break;
    case "settings":  renderSettingsView(); break;
  }
}

function refreshCurrentView() {
  const active = document.querySelector(".nav-item.active");
  if (active) setActiveSection(active.dataset.section);
}

// ── GERAR TAREFAS AUTOMÁTICAS PARA UM DIA ────────────────────

function ensureAutoTasksForDate(dateStr) {
  const hasHouse = tasks.some(t => t.date === dateStr && t.source === "auto:house");
  if (!hasHouse) {
    tasks = tasks.concat(
      generateDailyHouseTasks(dateStr),
      generateWeeklyHouseTasks(dateStr)
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

// ── DASHBOARD (ABA HOJE) ─────────────────────────────────────

function renderDashboard() {
  sectionDashboard.innerHTML = "";

  const dateStr = localDateStr(currentDateView);

  ensureAutoTasksForDate(dateStr);

  // Cabeçalho com data e navegação
  const header = document.createElement("div");
  header.className = "section-header";

  const dateInfo = document.createElement("div");
  const isToday = dateStr === localDateStr(new Date());
  dateInfo.innerHTML = `
    <h1>${formatDateBR(dateStr)}</h1>
    <p>${isToday ? "Hoje" : daysUntil(dateStr) > 0
        ? `Em ${daysUntil(dateStr)} dias`
        : `Há ${Math.abs(daysUntil(dateStr))} dias`}
    </p>
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

  const btnTodayBtn = document.createElement("button");
  btnTodayBtn.className = "btn-today";
  btnTodayBtn.textContent = "Hoje";
  btnTodayBtn.addEventListener("click", () => {
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
  nav.appendChild(btnTodayBtn);
  nav.appendChild(btnNext);

  header.appendChild(dateInfo);
  header.appendChild(nav);
  sectionDashboard.appendChild(header);

  // Tarefas do dia ordenadas por horário
  const dayTasks = tasks
    .filter(t => t.date === dateStr)
    .sort((a, b) =>
      timeStrToMinutes(a.start || "00:00") - timeStrToMinutes(b.start || "00:00")
    );

  if (!dayTasks.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.innerHTML = `<div class="empty-icon">📭</div><p>Nenhuma tarefa para este dia.</p>`;
    sectionDashboard.appendChild(empty);
    return;
  }

  // Agrupa por categoria
  const groups = {
    class:   { label:"🏫 Aulas",      tasks:[] },
    sport:   { label:"🏓 Esporte",    tasks:[] },
    study:   { label:"📚 Estudo",     tasks:[] },
    home:    { label:"🏠 Casa",       tasks:[] },
    leisure: { label:"🎮 Lazer",      tasks:[] },
    exam:    { label:"📝 Provas",     tasks:[] },
    other:   { label:"📌 Outros",     tasks:[] },
  };

  dayTasks.forEach(t => {
    const g = groups[t.category] || groups.other;
    g.tasks.push(t);
  });

  Object.values(groups).forEach(group => {
    if (!group.tasks.length) return;

    const card = document.createElement("div");
    card.className = "card";

    const title = document.createElement("div");
    title.className = "card-title";
    title.textContent = group.label;
    card.appendChild(title);

    group.tasks.forEach(t => {
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
        name.className = "task-title" + (t.done ? " done" : "");
        saveToStorage(STORAGE_KEYS.TASKS, tasks);
        showToast(t.done ? "Concluída! ✅" : "Marcada como pendente.", t.done ? "success" : "info");
      });

      row.appendChild(time);
      row.appendChild(name);
      row.appendChild(check);
      card.appendChild(row);
    });

    sectionDashboard.appendChild(card);
  });
}

// ── ABA SEMANA ───────────────────────────────────────────────

function renderWeekView() {
  sectionWeek.innerHTML = "";

  const header = document.createElement("div");
  header.className = "section-header";
  header.innerHTML = `
    <div>
      <h1>Semana</h1>
      <p>Segunda a sexta: aulas, casa, estudo, tênis e lazer.</p>
    </div>
  `;
  sectionWeek.appendChild(header);

  // Navegação entre semanas
  const nav = document.createElement("div");
  nav.className = "day-nav";

  const btnPrev = document.createElement("button");
  btnPrev.className = "btn-day-nav";
  btnPrev.textContent = "< Semana anterior";
  btnPrev.addEventListener("click", () => {
    currentDateView.setDate(currentDateView.getDate() - 7);
    renderWeekView();
  });

  const btnCur = document.createElement("button");
  btnCur.className = "btn-today";
  btnCur.textContent = "Esta semana";
  btnCur.addEventListener("click", () => {
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
  nav.appendChild(btnCur);
  nav.appendChild(btnNext);
  sectionWeek.appendChild(nav);

  // Calcula segunda-feira da semana
  const base = toDateOnly(new Date(currentDateView));
  const diff = (base.getDay() + 6) % 7;
  base.setDate(base.getDate() - diff);

  // Gera os 5 dias (seg–sex) e garante tarefas
  const weekDates = [];
  for (let i = 0; i < 5; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    const ds = localDateStr(d);
    ensureAutoTasksForDate(ds);
    weekDates.push({ date: d, dateStr: ds });
  }

  // Período
  const periodLabel = document.createElement("div");
  periodLabel.style.cssText = "font-size:.82rem;color:var(--text3);margin-bottom:14px;";
  const s = weekDates[0].date.toLocaleDateString("pt-BR", { day:"2-digit", month:"2-digit" });
  const e = weekDates[4].date.toLocaleDateString("pt-BR", { day:"2-digit", month:"2-digit", year:"numeric" });
  periodLabel.textContent = `${s} – ${e}`;
  sectionWeek.appendChild(periodLabel);

  // Card com grade
  const card = document.createElement("div");
  card.className = "card";
  card.style.overflowX = "auto";

  const grid = document.createElement("div");
  grid.className = "week-grid";

  // Cabeçalho da grade
  const todayStr = localDateStr(new Date());

  const cornerCell = document.createElement("div");
  cornerCell.className = "week-header";
  cornerCell.textContent = "Hora";
  grid.appendChild(cornerCell);

  weekDates.forEach(({ date, dateStr }) => {
    const h = document.createElement("div");
    h.className = "week-header" + (dateStr === todayStr ? " today" : "");
    h.innerHTML = `
      <div>${["Seg","Ter","Qua","Qui","Sex"][weekDates.indexOf({date,dateStr})] ||
        date.toLocaleDateString("pt-BR",{weekday:"short"})}</div>
      <div style="font-size:.7rem;margin-top:2px">
        ${date.toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"})}
      </div>
    `;
    grid.appendChild(h);
  });

  // Corrige os labels dos dias (precisa de índice)
  const dayLabels = ["Seg","Ter","Qua","Qui","Sex"];
  // Remove os headers errados e recria corretamente
  grid.innerHTML = "";

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

  // Linhas de horário 07:00–22:00
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
            home:"ev-home", study:"ev-study", sport:"ev-sport",
            leisure:"ev-leisure", class:"ev-class", exam:"ev-exam",
          }[t.category] || "ev-study";
          ev.className = "week-event " + cls;
          ev.textContent = t.title.length > 20
            ? t.title.slice(0,18) + "…"
            : t.title;
          ev.title = `${t.title}\n${t.start}${t.end ? " – " + t.end : ""}`;
          ev.addEventListener("click", () => {
            currentDateView = toDateOnly(dateFromStr(dateStr));
            setActiveSection("dashboard");
          });
          cell.appendChild(ev);
        });

      grid.appendChild(cell);

