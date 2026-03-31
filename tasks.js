// ===============================
// tasks.js — Tarefas, conflitos e visão semanal
// ===============================

// ---------- CONFLITOS ----------

function findConflicts(newTask) {
  return tasks.filter(t => {
    if (t.id === newTask.id) return false;
    if (t.date !== newTask.date) return false;
    if (!t.start || !t.end || !newTask.start || !newTask.end) return false;
    return isTimeOverlap(t.start, t.end, newTask.start, newTask.end);
  });
}

// ---------- MODAL DE CONFLITO ----------

const modalConflictOverlay = document.getElementById("modalConflictOverlay");
const conflictMessage       = document.getElementById("conflictMessage");
const btnConflictReplace    = document.getElementById("btnConflictReplace");
const btnConflictKeepBoth   = document.getElementById("btnConflictKeepBoth");
const btnConflictReschedule = document.getElementById("btnConflictReschedule");
const btnConflictCancel     = document.getElementById("btnConflictCancel");
const modalConflictClose    = document.getElementById("modalConflictClose");

let pendingTask      = null;
let conflictingTasks = [];

function openConflictModal(newTask, conflicts) {
  pendingTask      = newTask;
  conflictingTasks = conflicts;

  const names = conflicts
    .map(c => `"${c.title}" (${c.start}–${c.end})`)
    .join(", ");

  conflictMessage.innerHTML = `
    A tarefa <strong>"${newTask.title}"</strong> (${newTask.start}–${newTask.end})
    conflita com: <br>${names}.<br><br>
    Como você quer ajustar?
  `;

  modalConflictOverlay.classList.add("open");
}

function closeConflictModal() {
  modalConflictOverlay.classList.remove("open");
  pendingTask      = null;
  conflictingTasks = [];
}

modalConflictClose.addEventListener("click", closeConflictModal);
btnConflictCancel.addEventListener("click",  closeConflictModal);

btnConflictReplace.addEventListener("click", () => {
  conflictingTasks.forEach(c => {
    tasks = tasks.filter(t => t.id !== c.id);
  });
  tasks.push(pendingTask);
  saveToStorage(STORAGE_KEYS.TASKS, tasks);
  showToast("Atividade antiga substituída pela nova.", "success");
  closeConflictModal();
  refreshCurrentView();
});

btnConflictKeepBoth.addEventListener("click", () => {
  tasks.push(pendingTask);
  saveToStorage(STORAGE_KEYS.TASKS, tasks);
  showToast("Mantidas ambas as atividades (sobreposição).", "info");
  closeConflictModal();
  refreshCurrentView();
});

btnConflictReschedule.addEventListener("click", () => {
  closeConflictModal();
  modalTaskOverlay.classList.add("open");
  inputTaskName.value      = pendingTask.title;
  inputTaskDate.value      = pendingTask.date;
  inputTaskTimeStart.value = pendingTask.start;
  inputTaskTimeEnd.value   = pendingTask.end || "";
  inputTaskCategory.value  = pendingTask.category || "other";
  inputTaskPriority.value  = pendingTask.priority || "medium";
  inputTaskNotes.value     = pendingTask.notes || "";
  editingTaskId = pendingTask.id || null;
  showToast("Ajuste o horário e salve novamente.", "warning");
});

// ---------- SOBRESCREVE SALVAR TAREFA PARA CONFLITOS ----------

(function overrideTaskSave() {
  const oldBtn = document.getElementById("btnTaskSave");
  const newBtn = oldBtn.cloneNode(true);
  oldBtn.parentNode.replaceChild(newBtn, oldBtn);

  newBtn.addEventListener("click", () => {
    const title    = inputTaskName.value.trim();
    const date     = inputTaskDate.value;
    const start    = inputTaskTimeStart.value;
    const end      = inputTaskTimeEnd.value || null;
    const category = inputTaskCategory.value;
    const priority = inputTaskPriority.value;
    const notes    = inputTaskNotes.value.trim();

    if (!title || !date || !start) {
      showToast("Preencha nome, data e horário de início.", "warning");
      return;
    }

    const task = {
      id: editingTaskId || uuid(),
      title, date, start, end,
      category, priority, notes,
      done: false,
      source: "user",
    };

    // verifica conflito, mas ignora lazer automático
    const conflicts = findConflicts(task).filter(
      c => c.source !== "auto:leisure"
    );

    if (conflicts.length) {
      closeTaskModal();
      openConflictModal(task, conflicts);
      return;
    }

    // sem conflito, salva direto
    if (editingTaskId) {
      const idx = tasks.findIndex(t => t.id === editingTaskId);
      if (idx >= 0) tasks[idx] = { ...tasks[idx], ...task };
    } else {
      tasks.push(task);
    }

    saveToStorage(STORAGE_KEYS.TASKS, tasks);
    closeTaskModal();
    showToast("Tarefa salva!", "success");
    refreshCurrentView();
  });
})();

// ---------- ATUALIZA SEÇÃO ATIVA APÓS MUDANÇA ----------

function refreshCurrentView() {
  const active = document.querySelector(".nav-item.active");
  if (!active) return;
  setActiveSection(active.dataset.section);
}

// ---------- LISTA GERAL (ABA TAREFAS) ------------------------

function renderTasksView() {
  sectionTasks.innerHTML = "";

  const header = document.createElement("div");
  header.className = "section-header";
  header.innerHTML = `
    <div>
      <h1>Todas as Tarefas</h1>
      <p>Visão completa da sua rotina: casa, estudo, lazer, esporte, aulas e provas.</p>
    </div>
  `;
  const btnNew = document.createElement("button");
  btnNew.className = "btn-add-task";
  btnNew.textContent = "+ Nova Tarefa";
  btnNew.addEventListener("click", () => openTaskModal());
  header.appendChild(btnNew);
  sectionTasks.appendChild(header);

  const filterBar = document.createElement("div");
  filterBar.style.cssText = "display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px;";

  const filters = [
    { label: "Todas", value: "all" },
    { label: "Pendentes", value: "pending" },
    { label: "Concluídas", value: "done" },
    { label: "🏠 Casa", value: "home" },
    { label: "📚 Estudo", value: "study" },
    { label: "🏓 Esporte", value: "sport" },
    { label: "🎮 Lazer", value: "leisure" },
    { label: "🏫 Aulas", value: "class" },
  ];

  let activeFilter = "all";

  function renderFilterButtons() {
    filterBar.innerHTML = "";
    filters.forEach(f => {
      const btn = document.createElement("button");
      btn.textContent = f.label;
      btn.style.cssText = `
        padding:7px 14px;border-radius:99px;font-size:.8rem;
        font-weight:600;cursor:pointer;border:1px solid ${
          activeFilter === f.value ? "#7c6af7" : "#334155"
        };background:${activeFilter === f.value ? "rgba(124,106,247,.16)" : "transparent"};
        color:${activeFilter === f.value ? "#e5e7eb" : "#9ca3af"};
      `;
      btn.addEventListener("click", () => {
        activeFilter = f.value;
        renderFilterButtons();
        renderTaskList();
      });
      filterBar.appendChild(btn);
    });
  }

  sectionTasks.appendChild(filterBar);

  const listContainer = document.createElement("div");
  sectionTasks.appendChild(listContainer);

  function filterTasks() {
    let arr = [...tasks].sort((a,b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return timeStrToMinutes(a.start || "00:00") - timeStrToMinutes(b.start || "00:00");
    });

    if (activeFilter === "pending") arr = arr.filter(t => !t.done);
    else if (activeFilter === "done") arr = arr.filter(t => t.done);
    else if (["home","study","sport","leisure","class"].includes(activeFilter))
      arr = arr.filter(t => t.category === activeFilter);

    return arr;
  }

  function renderTaskList() {
    listContainer.innerHTML = "";

    const arr = filterTasks();
    if (!arr.length) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.innerHTML = `
        <div class="empty-icon">📂</div>
        <p>Nenhuma tarefa neste filtro.</p>
      `;
      listContainer.appendChild(empty);
      return;
    }

    const byDate = {};
    arr.forEach(t => {
      if (!byDate[t.date]) byDate[t.date] = [];
      byDate[t.date].push(t);
    });

    Object.entries(byDate).forEach(([dateStr, list]) => {
      const card = document.createElement("div");
      card.className = "card";

      const dLabel = new Date(dateStr + "T12:00:00").toLocaleDateString("pt-BR", {
        weekday:"long", day:"2-digit", month:"2-digit"
      });
      const title = document.createElement("div");
      title.className = "card-title";
      title.textContent = dLabel;
      card.appendChild(title);

      list.forEach(t => {
        const row = document.createElement("div");
        row.style.cssText = `
          display:flex;align-items:center;gap:10px;padding:6px 0;
          border-bottom:1px solid #1f2937;font-size:.86rem;
        `;

        const time = document.createElement("span");
        time.style.cssText = "min-width:80px;color:#9ca3af;font-size:.8rem";
        time.textContent = t.start ? (t.end ? `${t.start}–${t.end}` : t.start) : "--:--";

        const name = document.createElement("span");
        name.style.flex = "1";
        name.textContent = t.title;
        if (t.done) {
          name.style.textDecoration = "line-through";
          name.style.opacity = ".5";
        }

        const badge = document.createElement("span");
        badge.className = "badge " + ({
          home:"badge-orange",
          study:"badge-cyan",
          sport:"badge-green",
          leisure:"badge-yellow",
          class:"badge-accent"
        }[t.category] || "badge-accent");
        badge.textContent = {
          home:"Casa", study:"Estudo", sport:"Esporte",
          leisure:"Lazer", class:"Aula", exam:"Prova"
        }[t.category] || "Outro";

        const check = document.createElement("input");
        check.type = "checkbox";
        check.checked = t.done;
        check.style.cssText = "accent-color:#7c6af7;width:16px;height:16px;cursor:pointer";
        check.addEventListener("change", () => {
          t.done = check.checked;
          saveToStorage(STORAGE_KEYS.TASKS, tasks);
          renderTaskList();
        });

        row.appendChild(time);
        row.appendChild(name);
        row.appendChild(badge);
        row.appendChild(check);
        card.appendChild(row);
      });

      listContainer.appendChild(card);
    });
  }

  renderFilterButtons();
  renderTaskList();
}

// ---------- VISÃO SEMANAL (ABA WEEK) -------------------------

// ---------- VISÃO SEMANAL (ABA WEEK) -------------------------

function renderWeekView() {
  sectionWeek.innerHTML = "";

  const header = document.createElement("div");
  header.className = "section-header";
  header.innerHTML = `
    <div>
      <h1>Semana</h1>
      <p>Visão de segunda a sexta: casa, aulas, estudos, lazer, tênis de mesa.</p>
    </div>
  `;
  sectionWeek.appendChild(header);

  // Começa na segunda-feira da semana da data em visualização
  const base = toDateOnly(currentDateView);
  const dayIdx = base.getDay(); // 0=dom,1=seg
  const diffToMonday = (dayIdx + 6) % 7; // transforma domingo em 6, seg em 0
  base.setDate(base.getDate() - diffToMonday);

  // Antes de montar, garantimos que os dias da semana tenham tarefas auto-geradas
  const weekDates = [];
  for (let i = 0; i < 5; i++) { // segunda a sexta
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    ensureAutoTasksForDate(dateStr);
    weekDates.push({ date: d, dateStr });
  }

  const card = document.createElement("div");
  card.className = "card";

  const title = document.createElement("div");
  title.className = "card-title";
  const weekStartLabel = weekDates[0].date.toLocaleDateString("pt-BR", { day:"2-digit", month:"2-digit" });
  const weekEndLabel   = weekDates[4].date.toLocaleDateString("pt-BR", { day:"2-digit", month:"2-digit" });
  title.textContent = `Semana ${weekStartLabel} – ${weekEndLabel}`;
  card.appendChild(title);

  const grid = document.createElement("div");
  grid.className = "week-grid";

  // cabeçalho das colunas
  const colLabels = ["Hora","Seg","Ter","Qua","Qui","Sex"];
  colLabels.forEach((lab, idx) => {
    const h = document.createElement("div");
    h.className = "week-header";
    h.textContent = lab;

    if (idx > 0) {
      const d = weekDates[idx-1].date;
      const today = toDateOnly(new Date());
      if (d.getTime() === today.getTime()) {
        h.classList.add("today");
      }
    }
    grid.appendChild(h);
  });

  // janela de horários (07:00 às 22:00, de hora em hora)
  const startMinutes = 7 * 60;
  const endMinutes   = 22 * 60;

  for (let m = startMinutes; m <= endMinutes; m += 60) {
    // coluna de hora
    const timeCell = document.createElement("div");
    timeCell.className = "week-time";
    timeCell.textContent = minutesToTimeStr(m);
    grid.appendChild(timeCell);

    // colunas de cada dia
    for (let i = 0; i < 5; i++) {
      const { dateStr } = weekDates[i];
      const cell = document.createElement("div");
      cell.className = "week-cell";

      const slotTasks = tasks.filter(t =>
        t.date === dateStr &&
        t.start &&
        timeStrToMinutes(t.start) >= m &&
        timeStrToMinutes(t.start) <  m + 60
      );

      slotTasks.forEach(t => {
        const ev = document.createElement("div");
        const cls = {
          home:    "ev-home",
          study:   "ev-study",
          sport:   "ev-sport",
          leisure: "ev-leisure",
          class:   "ev-class",
          exam:    "ev-exam",
        }[t.category] || "ev-study";

        ev.className = "week-event " + cls;
        ev.textContent = t.title;
        cell.appendChild(ev);
      });

      grid.appendChild(cell);
    }
  }

  card.appendChild(grid);
  sectionWeek.appendChild(card);

  // Dica breve
  const tip = document.createElement("div");
  tip.className = "card";
  tip.innerHTML = `
    <div class="card-title">Como usar a visão semanal</div>
    <p style="font-size:.84rem;color:#9ca3af;line-height:1.6">
      Use esta visão para perceber onde estão os <strong>dias mais carregados</strong> e onde sobram janelas.
      Se sentir que um dia está muito cheio (especialmente com aula + estudo + casa),
      considere mover alguns blocos de estudo para a sexta ou fim de semana, que tendem a ser mais flexíveis.
    </p>
  `;
  sectionWeek.appendChild(tip);
}
