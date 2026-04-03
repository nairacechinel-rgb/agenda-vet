// ================================================
// classes.js — Visão de aulas (horário semanal)
// ================================================

function groupClassesByDay() {
  const byDay = { 1: [], 2: [], 3: [], 4: [], 5: [] }; // seg–sex

  CLASSES_SCHEDULE.forEach(c => {
    byDay[c.dayIndex].push(c);
  });

  // ordena por horário
  Object.keys(byDay).forEach(d => {
    byDay[d].sort((a, b) => timeStrToMinutes(a.start) - timeStrToMinutes(b.start));
  });

  return byDay;
}

function renderClassesView() {
  sectionClasses.innerHTML = "";

  const header = document.createElement("div");
  header.className = "section-header";
  header.innerHTML = `
    <div>
      <h1>Aulas</h1>
      <p>Seu horário fixo da faculdade, exatamente como no quadro oficial.</p>
    </div>
  `;
  sectionClasses.appendChild(header);

  const daysLabels = {
    1: "Segunda-feira",
    2: "Terça-feira",
    3: "Quarta-feira",
    4: "Quinta-feira",
    5: "Sexta-feira",
  };

  const byDay = groupClassesByDay();

  // card geral com tabela
  const card = document.createElement("div");
  card.className = "card";

  const title = document.createElement("div");
  title.className = "card-title";
  title.textContent = "Grade semanal de aulas";
  card.appendChild(title);

  Object.keys(byDay).forEach(key => {
    const dayIndex = Number(key);
    const list = byDay[dayIndex];
    if (!list.length) return;

    const dayTitle = document.createElement("div");
    dayTitle.style.cssText = "margin-top:8px;margin-bottom:4px;font-weight:700;color:#e5e7eb;";
    dayTitle.textContent = daysLabels[dayIndex];
    card.appendChild(dayTitle);

    list.forEach(c => {
      const row = document.createElement("div");
      row.className = "task-row";

      const time = document.createElement("span");
      time.className = "task-time";
      time.textContent = `${c.start} – ${c.end}`;

      const name = document.createElement("span");
      name.className = "task-title";
      name.textContent = c.subject;

      const type = document.createElement("span");
      type.className = "badge " + (c.type === "prática" ? "badge-green" : "badge-accent");
      type.textContent = c.type === "prática" ? "Prática" : "Teórica";

      row.appendChild(time);
      row.appendChild(name);
      row.appendChild(type);
      card.appendChild(row);
    });
  });

  sectionClasses.appendChild(card);

  const tip = document.createElement("div");
  tip.className = "card";
  tip.innerHTML = `
    <div class="card-title">💡 Como usar</div>
    <p style="font-size:.84rem;color:#9ca3af;line-height:1.6">
      Esta aba mostra apenas as aulas fixas. A rotina de casa, estudo, tênis e lazer
      é gerada automaticamente nas abas <strong>Hoje</strong> e <strong>Semana</strong>.
    </p>
  `;
  sectionClasses.appendChild(tip);
}
