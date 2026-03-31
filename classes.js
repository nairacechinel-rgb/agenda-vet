// ===============================
// classes.js
// Geração automática das aulas e visão de horários
// ===============================

// Cria tarefas de aula para uma data específica, com base em CLASSES_SCHEDULE
function generateClassTasksForDate(dateStr) {
  const d = new Date(dateStr);
  const dayIndex = d.getDay(); // 1=segunda ...

  const classesToday = CLASSES_SCHEDULE.filter((c) => c.dayIndex === dayIndex);

  return classesToday.map((c) => ({
    id: uuid(),
    title: c.subject,
    date: dateStr,
    start: c.start,
    end: c.end,
    category: "class",
    priority: "medium",
    notes: c.type === "prática" ? "Aula prática" : "Aula teórica",
    done: false,
    source: "auto:class",
  }));
}

// ------------- VISUALIZAÇÃO DE AULAS NA ABA "AULAS" -------------

function renderClassesView() {
  sectionClasses.innerHTML = "";

  const header = document.createElement("div");
  header.className = "section-header";
  header.innerHTML = `
    <div>
      <h1>Agenda de Aulas</h1>
      <p>Horários fixos da 7ª fase de Medicina Veterinária.</p>
    </div>
  `;
  sectionClasses.appendChild(header);

  const card = document.createElement("div");
  card.className = "card";

  const title = document.createElement("div");
  title.className = "card-title";
  title.textContent = "Semana padrão de aulas";
  card.appendChild(title);

  // Montar uma grade por dia da semana, com as aulas daquele dia
  const daysMap = {
    1: "Segunda-feira",
    2: "Terça-feira",
    3: "Quarta-feira",
    4: "Quinta-feira",
    5: "Sexta-feira",
  };

  Object.entries(daysMap).forEach(([idx, label]) => {
    const dayIndex = Number(idx);
    const list = CLASSES_SCHEDULE.filter((c) => c.dayIndex === dayIndex)
      .sort((a, b) => timeStrToMinutes(a.start) - timeStrToMinutes(b.start));

    const dayBlock = document.createElement("div");
    dayBlock.style.marginBottom = "18px";

    const dayHeader = document.createElement("div");
    dayHeader.style.display = "flex";
    dayHeader.style.alignItems = "center";
    dayHeader.style.justifyContent = "space-between";
    dayHeader.style.marginBottom = "6px";

    const labelEl = document.createElement("div");
    labelEl.style.fontWeight = "600";
    labelEl.style.fontSize = "0.9rem";
    labelEl.textContent = label;

    const badge = document.createElement("span");
    badge.className = "badge badge-accent";
    badge.textContent = list.length ? `${list.length} blocos de aula` : "Sem aulas";

    dayHeader.appendChild(labelEl);
    dayHeader.appendChild(badge);
    dayBlock.appendChild(dayHeader);

    if (!list.length) {
      const p = document.createElement("p");
      p.style.fontSize = "0.8rem";
      p.style.color = "#64748b";
      p.textContent = "Nenhuma aula neste dia.";
      dayBlock.appendChild(p);
    } else {
      list.forEach((c) => {
        const line = document.createElement("div");
        line.style.display = "flex";
        line.style.alignItems = "center";
        line.style.fontSize = "0.82rem";
        line.style.marginBottom = "4px";

        const timeSpan = document.createElement("span");
        timeSpan.style.minWidth = "90px";
        timeSpan.style.color = "#9ca3af";
        timeSpan.textContent = `${c.start} - ${c.end}`;

        const subjectSpan = document.createElement("span");
        subjectSpan.textContent = c.subject;

        const typeSpan = document.createElement("span");
        typeSpan.className = "badge " + (c.type === "prática" ? "badge-cyan" : "badge-accent");
        typeSpan.style.marginLeft = "8px";
        typeSpan.textContent = c.type === "prática" ? "Prática" : "Teórica";

        line.appendChild(timeSpan);
        line.appendChild(subjectSpan);
        line.appendChild(typeSpan);

        dayBlock.appendChild(line);
      });
    }

    const divider = document.createElement("hr");
    divider.style.border = "none";
    divider.style.borderTop = "1px solid #1f2937";
    divider.style.marginTop = "10px";

    card.appendChild(dayBlock);
    if (dayIndex !== 5) card.appendChild(divider);
  });

  sectionClasses.appendChild(card);

  // Pequeno aviso
  const info = document.createElement("div");
  info.className = "card";
  info.innerHTML = `
    <div class="card-title">Integração com sua rotina</div>
    <p style="font-size:0.84rem;color:#9ca3af;line-height:1.5">
      Esses horários são usados automaticamente para montar sua linha do tempo diária.
      Ou seja, quando você olhar o dia, verá casa, tênis de mesa, aulas e estudos juntos,
      em uma visão única, para reduzir a sobrecarga de planejamento (o que ajuda muito no TDAH).
    </p>
  `;
  sectionClasses.appendChild(info);
}
