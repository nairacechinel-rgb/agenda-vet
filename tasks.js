// ================================================
// tasks.js — Lista geral de tarefas
// ================================================

function renderTasksView() {
  sectionTasks.innerHTML = "";

  const header = document.createElement("div");
  header.className = "section-header";
  header.innerHTML = `
    <div>
      <h1>Tarefas</h1>
      <p>Lista geral das tarefas (casa, estudos, aulas, lazer, tênis).</p>
    </div>
  `;
  sectionTasks.appendChild(header);

  const dateStrToday = localDateStr(new Date());

  const card = document.createElement("div");
  card.className = "card";

  const title = document.createElement("div");
  title.className = "card-title";
  title.textContent = "Todas as tarefas (ordenadas por data e horário)";
  card.appendChild(title);

  const all = tasks
    .slice()
    .sort((a, b) => {
      if (a.date === b.date) {
        return timeStrToMinutes(a.start || "00:00") - timeStrToMinutes(b.start || "00:00");
      }
      return dateFromStr(a.date) - dateFromStr(b.date);
    });

  if (!all.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.innerHTML = `
      <div class="empty-icon">📋</div>
      <p>Nenhuma tarefa cadastrada ainda.</p>
    `;
    card.appendChild(empty);
  } else {
    let currentDay = null;

    all.forEach(t => {
      if (t.date !== currentDay) {
        currentDay = t.date;
        const dayLabel = document.createElement("div");
        dayLabel.style.cssText = "margin-top:10px;margin-bottom:4px;font-weight:700;font-size:.9rem;color:#e5e7eb;";
        dayLabel.textContent = formatDateBR(currentDay);
        card.appendChild(dayLabel);
      }

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

      const cat = document.createElement("span");
      cat.className = "badge badge-cyan";
      cat.textContent = ({
        home:"Casa", study:"Estudo", sport:"Esporte",
        leisure:"Lazer", class:"Aula", exam:"Prova",
      }[t.category] || "Outro");

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
      row.appendChild(cat);
      row.appendChild(check);

      card.appendChild(row);
    });
  }

  sectionTasks.appendChild(card);
}
