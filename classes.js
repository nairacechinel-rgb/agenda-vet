// ===============================
// classes.js — Aulas automáticas + tela de aulas
// ===============================

// ── agrupa horários contíguos da mesma disciplina em um único bloco ──
function mergeClassBlocks(list) {
  if (!list.length) return [];
  const sorted = [...list].sort((a,b) =>
    timeStrToMinutes(a.start) - timeStrToMinutes(b.start));
  const merged = [];
  let current = { ...sorted[0] };
  for (let i = 1; i < sorted.length; i++) {
    const c = sorted[i];
    // mesmo subject E horário colado (end do atual === start do próximo)
    if (c.subject === current.subject && c.start === current.end) {
      current.end = c.end; // estende o bloco
    } else {
      merged.push(current);
      current = { ...c };
    }
  }
  merged.push(current);
  return merged;
}

// ── gera tasks de aula para uma data ──
function generateClassTasksForDate(dateStr) {
  const dayIndex = new Date(dateStr).getDay();
  const list = CLASSES_SCHEDULE.filter(c => c.dayIndex === dayIndex);
  const merged = mergeClassBlocks(list);

  return merged.map(c => ({
    id: uuid(),
    title: c.type === "prática" ? `${c.subject} · Prática` : c.subject,
    date: dateStr,
    start: c.start,
    end: c.end,
    category: "class",
    priority: "high",
    notes: c.type === "prática"
      ? "Aula prática — leve jaleco/material"
      : "Aula teórica — revisar depois",
    done: false,
    source: "auto:class",
  }));
}

// ── tela de aulas ─────────────────────────────────────────────
function renderClassesView() {
  sectionClasses.innerHTML = "";

  // cabeçalho
  const header = document.createElement("div");
  header.className = "section-header";
  header.innerHTML = `
    <div>
      <h1>Agenda de Aulas</h1>
      <p>7ª fase — Medicina Veterinária · Horários fixos do semestre</p>
    </div>
  `;
  sectionClasses.appendChild(header);

  const DAYS_LABEL = {
    1:"Segunda-feira", 2:"Terça-feira", 3:"Quarta-feira",
    4:"Quinta-feira",  5:"Sexta-feira",
  };

  // cores por disciplina
  const SUBJECT_COLOR = {
    "Anatomia Patológica Vet II":  "badge-orange",
    "Clínica de Pequenos Animais": "badge-accent",
    "Diagnóstico por Imagem":      "badge-cyan",
    "Anestesiologia":              "badge-green",
    "Técnica Cirúrgica":           "badge-yellow",
  };

  // ícone prática x teórica
  function typeIcon(t) {
    return t === "prática" ? "🔬" : "📖";
  }

  // para cada dia da semana
  [1,2,3,4,5].forEach(dayIdx => {
    const dayList = CLASSES_SCHEDULE
      .filter(c => c.dayIndex === dayIdx)
      .sort((a,b) => timeStrToMinutes(a.start) - timeStrToMinutes(b.start));

    const merged = mergeClassBlocks(dayList);

    const card = document.createElement("div");
    card.className = "card";

    // título do card
    const cardTitle = document.createElement("div");
    cardTitle.className = "card-title";

    // verifica se hoje é esse dia
    const todayIdx = new Date().getDay();
    const isToday  = todayIdx === dayIdx;
    cardTitle.innerHTML = `
      ${DAYS_LABEL[dayIdx]}
      ${isToday ? '<span class="badge badge-green" style="margin-left:8px">Hoje</span>' : ""}
    `;
    card.appendChild(cardTitle);

    if (!merged.length) {
      const p = document.createElement("p");
      p.style.cssText = "font-size:.82rem;color:#64748b";
      p.textContent = "Sem aulas registradas neste dia.";
      card.appendChild(p);
    } else {
      merged.forEach(c => {
        const line = document.createElement("div");
        line.style.cssText = `
          display:flex;align-items:center;gap:10px;
          padding:9px 0;border-bottom:1px solid #1f2937;
          font-size:.86rem;flex-wrap:wrap;
        `;

        const time = document.createElement("span");
        time.style.cssText = "min-width:115px;color:#9ca3af;font-size:.8rem;font-variant-numeric:tabular-nums";
        time.textContent = `${c.start} – ${c.end}`;

        // duração em minutos
        const dur = timeStrToMinutes(c.end) - timeStrToMinutes(c.start);
        const durSpan = document.createElement("span");
        durSpan.style.cssText = "font-size:.72rem;color:#4b5563";
        durSpan.textContent = `(${dur} min)`;

        const icon = document.createElement("span");
        icon.textContent = typeIcon(c.type);

        const subj = document.createElement("span");
        subj.style.flex = "1";
        subj.textContent = c.subject;

        const typeBadge = document.createElement("span");
        const colorClass = SUBJECT_COLOR[c.subject] || "badge-accent";
        typeBadge.className = `badge ${colorClass}`;
        typeBadge.textContent = c.type;

        line.appendChild(time);
        line.appendChild(durSpan);
        line.appendChild(icon);
        line.appendChild(subj);
        line.appendChild(typeBadge);
        card.appendChild(line);
      });
    }

    sectionClasses.appendChild(card);
  });

  // resumo de carga horária por disciplina
  const summaryCard = document.createElement("div");
  summaryCard.className = "card";
  const summaryTitle = document.createElement("div");
  summaryTitle.className = "card-title";
  summaryTitle.textContent = "Carga horária semanal por disciplina";
  summaryCard.appendChild(summaryTitle);

  const totals = {};
  CLASSES_SCHEDULE.forEach(c => {
    const dur = timeStrToMinutes(c.end) - timeStrToMinutes(c.start);
    totals[c.subject] = (totals[c.subject] || 0) + dur;
  });

  Object.entries(totals).sort((a,b)=>b[1]-a[1]).forEach(([subj, mins]) => {
    const h = Math.floor(mins/60);
    const m = mins%60;
    const row = document.createElement("div");
    row.style.cssText = `
      display:flex;justify-content:space-between;align-items:center;
      padding:8px 0;border-bottom:1px solid #1f2937;font-size:.85rem;
    `;
    row.innerHTML = `
      <span>${subj}</span>
      <span class="badge ${SUBJECT_COLOR[subj]||'badge-accent'}">${h}h${m>0?` ${m}min`:""}/sem</span>
    `;
    summaryCard.appendChild(row);
  });

  sectionClasses.appendChild(summaryCard);
}
