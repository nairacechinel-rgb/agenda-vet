function renderWeekView() {
  sectionWeek.innerHTML = "";

  // Cabeçalho
  const header = document.createElement("div");
  header.className = "section-header";
  header.innerHTML = `
    <div>
      <h1>Semana</h1>
      <p>Visão de segunda a sexta.</p>
    </div>
  `;
  sectionWeek.appendChild(header);

  // Determina a segunda-feira da semana da data em visualização
  const base = toDateOnly(new Date(currentDateView));
  const diffToMonday = (base.getDay() + 6) % 7; // 0=domingo,1=segunda...
  base.setDate(base.getDate() - diffToMonday);

  // Garante tarefas automáticas para cada dia (seg–sex)
  const weekDates = [];
  for (let i = 0; i < 5; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    ensureAutoTasksForDate(dateStr);
    weekDates.push({ date: d, dateStr });
  }

  // Card + grid
  const card = document.createElement("div");
  card.className = "card";

  const title = document.createElement("div");
  title.className = "card-title";
  title.textContent = "Semana";
  card.appendChild(title);

  const grid = document.createElement("div");
  grid.className = "week-grid";

  // Linha de cabeçalho (Hora | Seg | Ter | Qua | Qui | Sex)
  const headerCell = document.createElement("div");
  headerCell.className = "week-header";
  headerCell.textContent = "Hora";
  grid.appendChild(headerCell);

  const dayNames = ["Seg", "Ter", "Qua", "Qui", "Sex"];
  const today = toDateOnly(new Date());

  dayNames.forEach((label, i) => {
    const d = weekDates[i].date;
    const h = document.createElement("div");
    h.className = "week-header";
    h.innerHTML = `
      <div>${label}</div>
      <div style="font-size:.7rem;margin-top:2px">
        ${d.toLocaleDateString("pt-BR", { day:"2-digit", month:"2-digit" })}
      </div>
    `;
    if (d.getTime() === today.getTime()) {
      h.classList.add("today");
    }
    grid.appendChild(h);
  });

  // Linhas de horário (07:00–22:00)
  const START_MIN = 7 * 60;
  const END_MIN   = 22 * 60;

  for (let m = START_MIN; m <= END_MIN; m += 60) {
    // Coluna de horário
    const timeCell = document.createElement("div");
    timeCell.className = "week-time";
    timeCell.textContent = minutesToTimeStr(m);
    grid.appendChild(timeCell);

    // 5 colunas (seg–sex)
    for (let i = 0; i < 5; i++) {
      const { dateStr } = weekDates[i];
      const cell = document.createElement("div");
      cell.className = "week-cell";

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

        ev.className = "week-event " + evClass;
        ev.textContent = t.title.length > 18 ? t.title.slice(0, 16) + "…" : t.title;
        ev.title = `${t.title}\n${t.start}${t.end ? " – " + t.end : ""}`;

        cell.appendChild(ev);
      });

      grid.appendChild(cell);
    }
  }

  card.appendChild(grid);
  sectionWeek.appendChild(card);
}
