// ===============================
// exams.js — Provas, Trabalhos e Plano de Estudos
// ===============================

// ── MODAL DE PROVA ────────────────────────────────────────────

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

let editingExamId = null;

// ── TOPICS (conteúdos da prova) ────────────────────────────────

function getTopicInputs() {
  return Array.from(document.querySelectorAll(".exam-topic-input"))
    .map(i => i.value.trim())
    .filter(Boolean);
}

function addTopicRow(value = "") {
  const row = document.createElement("div");
  row.className = "topic-row";

  const input = document.createElement("input");
  input.type = "text";
  input.className = "exam-topic-input";
  input.placeholder = "Ex: Fármacos anestésicos inalatórios";
  input.value = value;

  const btnAdd = document.createElement("button");
  btnAdd.className = "btn-add-topic";
  btnAdd.textContent = "+";
  btnAdd.type = "button";
  btnAdd.addEventListener("click", () => addTopicRow());

  const btnRem = document.createElement("button");
  btnRem.className = "btn-add-topic";
  btnRem.textContent = "−";
  btnRem.type = "button";
  btnRem.style.background = "rgba(248,113,113,.12)";
  btnRem.style.color = "#f87171";
  btnRem.addEventListener("click", () => {
    if (topicsContainer.querySelectorAll(".topic-row").length > 1) row.remove();
  });

  row.appendChild(input);
  row.appendChild(btnAdd);
  row.appendChild(btnRem);
  topicsContainer.appendChild(row);
}

// botão "+" inicial
document.querySelector(".btn-add-topic")?.addEventListener("click", () => addTopicRow());

// ── ABRIR / FECHAR MODAL ──────────────────────────────────────

function openExamModal(examId = null) {
  editingExamId = examId;

  // limpa
  topicsContainer.innerHTML = "";
  addTopicRow();
  inputExamSubject.value = "";
  inputExamType.value = "prova";
  inputExamDate.value = "";
  inputExamTime.value = "";
  inputExamWeight.value = "";
  inputExamNotes.value = "";
  document.getElementById("modalExamTitle").textContent =
    examId ? "Editar Avaliação" : "Cadastrar Prova / Trabalho";

  if (examId) {
    const ex = exams.find(e => e.id === examId);
    if (ex) {
      inputExamSubject.value = ex.subject;
      inputExamType.value    = ex.type;
      inputExamDate.value    = ex.date;
      inputExamTime.value    = ex.time || "";
      inputExamWeight.value  = ex.weight || "";
      inputExamNotes.value   = ex.notes || "";
      topicsContainer.innerHTML = "";
      (ex.topics || [""]).forEach(t => addTopicRow(t));
    }
  }

  modalExamOverlay.classList.add("open");
}

function closeExamModal() {
  modalExamOverlay.classList.remove("open");
}

modalExamClose.addEventListener("click",  closeExamModal);
btnExamCancel.addEventListener("click",   closeExamModal);

// ── SALVAR PROVA ──────────────────────────────────────────────

btnExamSave.addEventListener("click", () => {
  const subject = inputExamSubject.value;
  const date    = inputExamDate.value;
  const type    = inputExamType.value;

  if (!subject || !date) {
    showToast("Preencha ao menos a disciplina e a data.", "warning");
    return;
  }

  const topics = getTopicInputs();

  if (editingExamId) {
    const idx = exams.findIndex(e => e.id === editingExamId);
    if (idx >= 0) {
      exams[idx] = {
        ...exams[idx],
        subject, type, date,
        time:   inputExamTime.value   || null,
        weight: parseFloat(inputExamWeight.value) || null,
        notes:  inputExamNotes.value.trim(),
        topics,
      };
    }
  } else {
    exams.push({
      id: uuid(),
      subject, type, date,
      time:   inputExamTime.value   || null,
      weight: parseFloat(inputExamWeight.value) || null,
      notes:  inputExamNotes.value.trim(),
      topics,
    });
  }

  saveToStorage(STORAGE_KEYS.EXAMS, exams);

  // remove blocos de estudo automáticos antigos e regenera
  tasks = tasks.filter(t => t.source !== "auto:study");
  generateStudyBlocksForAllExams();
  saveToStorage(STORAGE_KEYS.TASKS, tasks);

  closeExamModal();
  showToast("Avaliação salva e plano de estudos atualizado!", "success");
  renderExamsView();
});

// ── URGÊNCIA ─────────────────────────────────────────────────

function examUrgency(exam) {
  const d = daysUntil(exam.date);
  if (d < 0)  return "past";
  if (d <= 3) return "urgent";
  if (d <= 7) return "soon";
  return "ok";
}

function urgencyLabel(u) {
  return {
    urgent:"🔴 Urgente",
    soon:  "🟡 Em breve",
    ok:    "🟢 Tranquilo",
    past:  "✅ Realizado",
  }[u] || "🟢";
}

// ── TELA DE PROVAS ────────────────────────────────────────────

function renderExamsView() {
  sectionExams.innerHTML = "";

  const header = document.createElement("div");
  header.className = "section-header";
  header.innerHTML = `
    <div>
      <h1>Provas & Trabalhos</h1>
      <p>Cadastre suas avaliações e os conteúdos — o plano de estudo é gerado automaticamente.</p>
    </div>
  `;

  const btnNew = document.createElement("button");
  btnNew.className = "btn-add-task";
  btnNew.textContent = "+ Nova Avaliação";
  btnNew.addEventListener("click", () => openExamModal());
  header.appendChild(btnNew);
  sectionExams.appendChild(header);

  const upcoming = exams
    .filter(e => daysUntil(e.date) >= 0)
    .sort((a,b) => new Date(a.date)-new Date(b.date));

  const past = exams
    .filter(e => daysUntil(e.date) < 0)
    .sort((a,b) => new Date(b.date)-new Date(a.date));

  if (!exams.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.innerHTML = `
      <div class="empty-icon">📝</div>
      <p>Nenhuma avaliação cadastrada ainda.<br>
      Clique em "+ Nova Avaliação" para começar.</p>
    `;
    sectionExams.appendChild(empty);
    return;
  }

  // ── PRÓXIMAS ──
  if (upcoming.length) {
    const card = document.createElement("div");
    card.className = "card";
    const t = document.createElement("div");
    t.className = "card-title";
    t.textContent = "Próximas avaliações";
    card.appendChild(t);
    upcoming.forEach(ex => card.appendChild(buildExamCard(ex)));
    sectionExams.appendChild(card);
  }

  // ── REALIZADAS ──
  if (past.length) {
    const card2 = document.createElement("div");
    card2.className = "card";
    const t2 = document.createElement("div");
    t2.className = "card-title";
    t2.textContent = "Avaliações realizadas";
    card2.appendChild(t2);
    past.forEach(ex => card2.appendChild(buildExamCard(ex)));
    sectionExams.appendChild(card2);
  }
}

function buildExamCard(ex) {
  const urgency = examUrgency(ex);
  const dias    = daysUntil(ex.date);

  const card = document.createElement("div");
  card.className = `exam-card ${urgency === "urgent" ? "urgent" : urgency === "soon" ? "soon" : "ok"}`;

  const icon = document.createElement("div");
  icon.className = "exam-icon";
  icon.textContent = {
    prova:"📝", trabalho:"📋", seminario:"🎤", pratica:"🔬"
  }[ex.type] || "📝";

  const info = document.createElement("div");
  info.className = "exam-info";

  const title = document.createElement("div");
  title.className = "exam-title";
  title.textContent = ex.subject;

  const meta = document.createElement("div");
  meta.className = "exam-meta";

  const dateStr = new Date(ex.date + "T12:00:00").toLocaleDateString("pt-BR",{
    weekday:"short", day:"2-digit", month:"2-digit"
  });
  const diasText = dias === 0 ? "Hoje!" : dias === 1 ? "Amanhã!" : `Em ${dias} dias`;

  meta.innerHTML = `
    <span>${dateStr} · ${ex.time || "--:--"}</span>
    <span>${urgencyLabel(urgency)}</span>
    <span style="color:#7c6af7">${diasText}</span>
    ${ex.weight ? `<span>Nota: ${ex.weight}</span>` : ""}
  `;

  // tópicos / conteúdos
  const topicsEl = document.createElement("div");
  topicsEl.className = "exam-topics";
  if (ex.topics && ex.topics.length) {
    ex.topics.forEach(tp => {
      const tag = document.createElement("span");
      tag.className = "topic-tag";
      tag.textContent = tp;
      topicsEl.appendChild(tag);
    });
  } else {
    const tip = document.createElement("span");
    tip.style.cssText = "font-size:.75rem;color:#4b5563";
    tip.textContent = "Nenhum conteúdo cadastrado — edite para adicionar.";
    topicsEl.appendChild(tip);
  }

  info.appendChild(title);
  info.appendChild(meta);
  info.appendChild(topicsEl);

  const actions = document.createElement("div");
  actions.className = "exam-actions";

  const btnEdit = document.createElement("button");
  btnEdit.className = "btn-icon";
  btnEdit.title = "Editar";
  btnEdit.textContent = "✎";
  btnEdit.addEventListener("click", () => openExamModal(ex.id));

  const btnDel = document.createElement("button");
  btnDel.className = "btn-icon danger";
  btnDel.title = "Excluir";
  btnDel.textContent = "🗑";
  btnDel.addEventListener("click", () => {
    if (confirm("Excluir esta avaliação e seus blocos de estudo?")) {
      exams = exams.filter(e => e.id !== ex.id);
      tasks = tasks.filter(t => t.source !== `auto:study:${ex.id}`);
      saveToStorage(STORAGE_KEYS.EXAMS, exams);
      saveToStorage(STORAGE_KEYS.TASKS, tasks);
      showToast("Avaliação removida.", "info");
      renderExamsView();
    }
  });

  actions.appendChild(btnEdit);
  actions.appendChild(btnDel);

  card.appendChild(icon);
  card.appendChild(info);
  card.appendChild(actions);
  return card;
}

// ── GERADOR DE BLOCOS DE ESTUDO ───────────────────────────────
// Para cada prova cadastrada, distribui blocos de estudo
// nos dias anteriores, respeitando horários livres.
// Se há duas provas próximas, alterna por dia entre as matérias.

function generateStudyBlocksForAllExams() {
  // Remove blocos antigos
  tasks = tasks.filter(t => !t.source.startsWith("auto:study"));

  const upcoming = exams
    .filter(e => daysUntil(e.date) >= 0)
    .sort((a,b) => new Date(a.date)-new Date(b.date));

  if (!upcoming.length) return;

  // Para cada prova, define janela de estudo (até 7 dias antes ou desde hoje)
  upcoming.forEach(ex => {
    const examDate   = toDateOnly(new Date(ex.date));
    const today      = toDateOnly(new Date());
    const daysLeft   = daysUntil(ex.date);
    const studyDays  = Math.max(1, Math.min(daysLeft, 7));

    for (let i = 0; i < studyDays; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dateStr = d.toISOString().slice(0,10);
      const weekday = d.getDay();

      // slots disponíveis para este dia
      const slotsForDay = (STUDY_SLOTS_BY_DAY[weekday] || []);

      // se há duas provas, alterna: prova A nos dias pares, B nos ímpares
      const examIdx = upcoming.indexOf(ex);
      if (upcoming.length >= 2 && examIdx % 2 !== i % 2) continue;

      // verifica ocupação existente e pega o primeiro slot livre
      slotsForDay.forEach(slot => {
        const clash = tasks.some(t =>
          t.date === dateStr &&
          isTimeOverlap(t.start, t.end, slot.start, slot.end)
        );
        if (!clash) {
          // distribui tópicos da prova pelos blocos
          const topicCount = (ex.topics || []).length;
          const topicIdx   = i % (topicCount || 1);
          const topic      = topicCount ? ex.topics[topicIdx] : "Revisão geral";

          tasks.push({
            id: uuid(),
            title: `Estudo · ${ex.subject}`,
            date: dateStr,
            start: slot.start,
            end: slot.end,
            category: "study",
            priority: daysLeft <= 3 ? "high" : "medium",
            notes: `Conteúdo: ${topic}\nMétodo sugerido: Pomodoro 25min · pausa 5min · repita`,
            done: false,
            source: `auto:study:${ex.id}`,
          });
        }
      });
    }
  });
}

// ── TELA DE PLANO DE ESTUDOS ──────────────────────────────────

function renderStudyView() {
  sectionStudy.innerHTML = "";

  const header = document.createElement("div");
  header.className = "section-header";
  header.innerHTML = `
    <div>
      <h1>Plano de Estudos</h1>
      <p>Gerado automaticamente com base nas suas avaliações cadastradas.</p>
    </div>
  `;
  sectionStudy.appendChild(header);

  const studyTasks = tasks
    .filter(t => t.source.startsWith("auto:study") && daysUntil(t.date) >= 0)
    .sort((a,b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return timeStrToMinutes(a.start) - timeStrToMinutes(b.start);
    });

  if (!studyTasks.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.innerHTML = `
      <div class="empty-icon">📚</div>
      <p>Nenhuma prova cadastrada ainda.<br>
      Vá em <strong>Provas & Trabalhos</strong> e adicione sua primeira avaliação.</p>
    `;
    sectionStudy.appendChild(empty);
    return;
  }

  // agrupa por data
  const byDate = {};
  studyTasks.forEach(t => {
    if (!byDate[t.date]) byDate[t.date] = [];
    byDate[t.date].push(t);
  });

  Object.entries(byDate).forEach(([dateStr, dayTasks]) => {
    const card = document.createElement("div");
    card.className = "card";

    const dateLabel = new Date(dateStr + "T12:00:00").toLocaleDateString("pt-BR",{
      weekday:"long", day:"2-digit", month:"2-digit"
    });

    const cardTitle = document.createElement("div");
    cardTitle.className = "card-title";
    cardTitle.textContent = dateLabel;
    card.appendChild(cardTitle);

    dayTasks.forEach(t => {
      const row = document.createElement("div");
      row.className = "study-day";

      const timeEl = document.createElement("div");
      timeEl.className = "study-day-label";
      timeEl.textContent = `${t.start} – ${t.end}`;

      const content = document.createElement("div");
      content.className = "study-day-content";

      const titleEl = document.createElement("span");
      titleEl.textContent = t.title;

      const methodSpan = document.createElement("span");
      methodSpan.className = "study-day-method";
      methodSpan.textContent = "Pomodoro 25+5";

      const notesEl = document.createElement("div");
      notesEl.style.cssText = "font-size:.75rem;color:#64748b;margin-top:3px";
      notesEl.textContent = t.notes.split("\n")[0]; // só a linha do conteúdo

      const chk = document.createElement("input");
      chk.type = "checkbox";
      chk.checked = t.done;
      chk.style.cssText = "margin-left:auto;accent-color:#7c6af7;width:16px;height:16px;cursor:pointer";
      chk.addEventListener("change", () => {
        t.done = chk.checked;
        saveToStorage(STORAGE_KEYS.TASKS, tasks);
        showToast(chk.checked ? "Bloco concluído! 🎉" : "Marcado como pendente.", chk.checked ? "success":"info");
      });

      content.appendChild(titleEl);
      content.appendChild(methodSpan);
      content.appendChild(notesEl);

      row.appendChild(timeEl);
      row.appendChild(content);
      row.appendChild(chk);
      card.appendChild(row);
    });

    sectionStudy.appendChild(card);
  });

  // dica TDAH
  const tipCard = document.createElement("div");
  tipCard.className = "card";
  tipCard.innerHTML = `
    <div class="card-title">⚡ Dica TDAH</div>
    <p style="font-size:.84rem;color:#9ca3af;line-height:1.6">
      Os blocos de estudo foram montados com <strong>40 minutos máximo</strong> cada — duração ideal
      para manter o foco com TDAH. Se perceber que sua mente dispersou antes, tudo bem:
      anote o ponto onde parou, faça uma pausa de 5 min e volte.
      Na aba <strong>Métodos TDAH</strong> você encontra o timer Pomodoro integrado.
    </p>
  `;
  sectionStudy.appendChild(tipCard);
}
