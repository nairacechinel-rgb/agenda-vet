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

// ===============================
// renderWeekView — Visão semanal completa
// ===============================

function renderWeekView() {
  sectionWeek.innerHTML = "";

  // ── CABEÇALHO ─────────────────────────────────────────────
  const header = document.createElement("div");
  header.className = "section-header";
  header.innerHTML = `
    <div>
      <h1>Semana</h1>
      <p>Segunda a sexta: aulas, casa, estudo, tênis e lazer.</p>
    </div>
  `;
  sectionWeek.appendChild(header);

  // ── NAVEGAÇÃO ENTRE SEMANAS ───────────────────────────────
  const navRow = document.createElement("div");
  navRow.className = "day-nav";

  const btnPrev = document.createElement("button");
  btnPrev.className = "btn-day-nav";
  btnPrev.textContent = "< Semana anterior";
  btnPrev.addEventListener("click", () => {
    currentDateView.setDate(currentDateView.getDate() - 7);
    renderWeekView();
  });

  const btnNext = document.createElement("button");
  btnNext.className = "btn-day-nav";
  btnNext.textContent = "Próxima semana >";
  btnNext.addEventListener("click", () => {
    currentDateView.setDate(currentDateView.getDate() + 7);
    renderWeekView();
  });

  const btnCurrent = document.createElement("button");
  btnCurrent.className = "btn-today";
  btnCurrent.textContent = "Esta semana";
  btnCurrent.addEventListener("click", () => {
    currentDateView = toDateOnly(new Date());
    renderWeekView();
  });

  navRow.appendChild(btnPrev);
  navRow.appendChild(btnCurrent);
  navRow.appendChild(btnNext);
  sectionWeek.appendChild(navRow);

  // ── CALCULAR SEGUNDA-FEIRA DA SEMANA ──────────────────────
  const base = toDateOnly(new Date(currentDateView));
  const diffToMonday = (base.getDay() + 6) % 7;
  base.setDate(base.getDate() - diffToMonday);

  // ── GERAR OS 5 DIAS (SEG–SEX) ─────────────────────────────
  const weekDates = [];
  for (let i = 0; i < 5; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    ensureAutoTasksForDate(dateStr);
    weekDates.push({ date: d, dateStr });
  }

  // ── PERÍODO EXIBIDO ───────────────────────────────────────
  const periodLabel = document.createElement("div");
  periodLabel.style.cssText = "font-size:.82rem;color:#64748b;margin-bottom:14px;";
  const labelStart = weekDates[0].date.toLocaleDateString("pt-BR", { day:"2-digit", month:"2-digit" });
  const labelEnd   = weekDates[4].date.toLocaleDateString("pt-BR", { day:"2-digit", month:"2-digit", year:"numeric" });
  periodLabel.textContent = `${labelStart} – ${labelEnd}`;
  sectionWeek.appendChild(periodLabel);

  // ── LEGENDA DE CORES ──────────────────────────────────────
  const legend = document.createElement("div");
  legend.style.cssText = "display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px;";

  const legendItems = [
    { cls:"ev-class",   label:"Aula"    },
    { cls:"ev-home",    label:"Casa"    },
    { cls:"ev-study",   label:"Estudo"  },
    { cls:"ev-sport",   label:"Esporte" },
    { cls:"ev-leisure", label:"Lazer"   },
    { cls:"ev-exam",    label:"Prova"   },
  ];

  legendItems.forEach(item => {
    const chip = document.createElement("div");
    chip.className = `week-event ${item.cls}`;
    chip.style.cssText = "font-size:.72rem;padding:3px 10px;border-radius:99px;";
    chip.textContent = item.label;
    legend.appendChild(chip);
  });

  sectionWeek.appendChild(legend);

  // ── CARD DA GRADE ─────────────────────────────────────────
  const card = document.createElement("div");
  card.className = "card";
  card.style.overflowX = "auto";

  // ── GRADE (CSS GRID) ──────────────────────────────────────
  const grid = document.createElement("div");
  grid.className = "week-grid";

  // LINHA 1: cabeçalho (Hora | Seg | Ter | Qua | Qui | Sex)
  const dayNames = ["Seg", "Ter", "Qua", "Qui", "Sex"];
  const today = toDateOnly(new Date());

  // célula vazia do canto
  const cornerCell = document.createElement("div");
  cornerCell.className = "week-header";
  cornerCell.textContent = "Hora";
  grid.appendChild(cornerCell);

  dayNames.forEach((name, i) => {
    const h = document.createElement("div");
    h.className = "week-header";

    const dayDate = weekDates[i].date;
    const isToday = dayDate.getTime() === today.getTime();

    const dayNum = dayDate.toLocaleDateString("pt-BR", { day:"2-digit", month:"2-digit" });

    h.innerHTML = `<div>${name}</div><div style="font-size:.7rem;font-weight:400;margin-top:2px">${dayNum}</div>`;

    if (isToday) {
      h.classList.add("today");
    }

    grid.appendChild(h);
  });

  // LINHAS DE HORÁRIO: 07:00 até 22:00 de hora em hora
  const START_MIN = 7 * 60;
  const END_MIN   = 22 * 60;

  for (let m = START_MIN; m <= END_MIN; m += 60) {
    // célula de hora
    const timeCell = document.createElement("div");
    timeCell.className = "week-time";
    timeCell.textContent = minutesToTimeStr(m);
    grid.appendChild(timeCell);

    // células dos 5 dias
    for (let col = 0; col < 5; col++) {
      const { dateStr } = weekDates[col];
      const cell = document.createElement("div");
      cell.className = "week-cell";

      // tarefas que começam dentro deste bloco de 1 hora
      const slotTasks = tasks.filter(t => {
        if (t.date !== dateStr) return false;
        if (!t.start) return false;
        const tMin = timeStrToMinutes(t.start);
        return tMin >= m && tMin < m + 60;
      });

      slotTasks.forEach(t => {
        const ev = document.createElement("div");

        const evClass = {
          home:    "ev-home",
          study:   "ev-study",
          sport:   "ev-sport",
          leisure: "ev-leisure",
          class:   "ev-class",
          exam:    "ev-exam",
        }[t.category] || "ev-study";

        ev.className = `week-event ${evClass}`;

        // nome curto para caber na célula
        const shortTitle = t.title.length > 22
          ? t.title.slice(0, 20) + "…"
          : t.title;

        ev.textContent = shortTitle;
        ev.title = `${t.title}\n${t.start}${t.end ? " – " + t.end : ""}`;

        // click no evento abre o dashboard naquele dia
        ev.style.cursor = "pointer";
        ev.addEventListener("click", () => {
          currentDateView = toDateOnly(new Date(dateStr));
          setActiveSection("dashboard");
        });

        cell.appendChild(ev);
      });

      grid.appendChild(cell);
    }
  }

  card.appendChild(grid);
  sectionWeek.appendChild(card);

  // ── RESUMO POR DIA ────────────────────────────────────────
  const summaryCard = document.createElement("div");
  summaryCard.className = "card";

  const summaryTitle = document.createElement("div");
  summaryTitle.className = "card-title";
  summaryTitle.textContent = "Resumo da semana";
  summaryCard.appendChild(summaryTitle);

  weekDates.forEach(({ date, dateStr }) => {
    const dayTasks = tasks.filter(t => t.date === dateStr);
    const done     = dayTasks.filter(t => t.done).length;
    const total    = dayTasks.length;
    const pct      = total > 0 ? Math.round((done / total) * 100) : 0;

    const isToday  = date.getTime() === today.getTime();

    const row = document.createElement("div");
    row.style.cssText = `
      display:flex;align-items:center;gap:12px;
      padding:9px 0;border-bottom:1px solid #1f2937;
    `;

    const dayLabel = document.createElement("div");
    dayLabel.style.cssText = "min-width:130px;font-size:.85rem;";
    dayLabel.innerHTML = `
      ${date.toLocaleDateString("pt-BR", { weekday:"short", day:"2-digit", month:"2-digit" })}
      ${isToday ? '<span class="badge badge-green" style="margin-left:6px">Hoje</span>' : ""}
    `;

    const barWrapper = document.createElement("div");
    barWrapper.style.cssText = "flex:1;background:#1f2937;border-radius:99px;height:8px;overflow:hidden;";

    const barFill = document.createElement("div");
    barFill.style.cssText = `
      height:100%;border-radius:99px;width:${pct}%;
      background:linear-gradient(90deg,#7c6af7,#22d3ee);
      transition:width .6s ease;
    `;

    barWrapper.appendChild(barFill);

    const countLabel = document.createElement("div");
    countLabel.style.cssText = "font-size:.78rem;color:#9ca3af;min-width:70px;text-align:right;";
    countLabel.textContent = `${done}/${total} (${pct}%)`;

    row.appendChild(dayLabel);
    row.appendChild(barWrapper);
    row.appendChild(countLabel);
    summaryCard.appendChild(row);
  });

  sectionWeek.appendChild(summaryCard);

  // ── DICA ─────────────────────────────────────────────────
  const tipCard = document.createElement("div");
  tipCard.className = "card";
  tipCard.innerHTML = `
    <div class="card-title">💡 Como usar a visão semanal</div>
    <p style="font-size:.84rem;color:#9ca3af;line-height:1.6">
      Clique em qualquer evento da grade para ir direto ao dia correspondente.
      Use a barra de progresso abaixo para identificar dias sobrecarregados
      e considere mover blocos de estudo para a <strong>sexta-feira</strong>
      ou <strong>fim de semana</strong>, que costumam ter mais espaço na sua grade.
    </p>
  `;
  sectionWeek.appendChild(tipCard);
}
