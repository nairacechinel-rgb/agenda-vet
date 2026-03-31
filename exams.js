// ===============================
// exams.js — Provas, Trabalhos e Plano de Estudos
// ===============================

// Referências de elementos do modal
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

// ------------- TÓPICOS (CONTEÚDOS) ----------------------------

function resetTopicsContainer() {
  topicsContainer.innerHTML = "";
  addTopicRow();
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
  btnAdd.type = "button";
  btnAdd.className = "btn-add-topic";
  btnAdd.textContent = "+";
  btnAdd.addEventListener("click", () => addTopicRow());

  const btnRem = document.createElement("button");
  btnRem.type = "button";
  btnRem.className = "btn-add-topic";
  btnRem.textContent = "−";
  btnRem.style.background = "rgba(248,113,113,.12)";
  btnRem.style.color = "#f87171";
  btnRem.addEventListener("click", () => {
    if (topicsContainer.querySelectorAll(".topic-row").length > 1) {
      row.remove();
    }
  });

  row.appendChild(input);
  row.appendChild(btnAdd);
  row.appendChild(btnRem);
  topicsContainer.appendChild(row);
}

function getTopicValues() {
  return Array.from(document.querySelectorAll(".exam-topic-input"))
    .map(i => i.value.trim())
    .filter(Boolean);
}

// ------------- MODAL DE PROVA / TRABALHO -----------------------

function openExamModal(examId = null) {
  editingExamId = examId;

  resetTopicsContainer();
  inputExamSubject.value = "";
  inputExamType.value    = "prova";
  inputExamDate.value    = "";
  inputExamTime.value    = "";
  inputExamWeight.value  = "";
  inputExamNotes.value   = "";
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
      if (ex.topics && ex.topics.length) {
        ex.topics.forEach(t => addTopicRow(t));
      } else {
        addTopicRow();
      }
    }
  }

  modalExamOverlay.classList.add("open");
}

function closeExamModal() {
  modalExamOverlay.classList.remove("open");
}

modalExamClose.addEventListener("click",  closeExamModal);
btnExamCancel.addEventListener("click",   closeExamModal);

// ------------- SALVAR AVALIAÇÃO -------------------------------

btnExamSave.addEventListener("click", () => {
  const subject = inputExamSubject.value;
  const date    = inputExamDate.value;

  if (!subject || !date) {
    showToast("Preencha, pelo menos, disciplina e data da avaliação.", "warning");
    return;
  }

  const exam = {
    id:       editingExamId || uuid(),
    subject,
    type:     inputExamType.value,
    date,
    time:     inputExamTime.value || null,
    weight:   inputExamWeight.value ? parseFloat(inputExamWeight.value) : null,
    notes:    inputExamNotes.value.trim(),
    topics:   getTopicValues(),
  };

  if (editingExamId) {
    const idx = exams.findIndex(e => e.id === editingExamId);
    if (idx >= 0) {
      exams[idx] = exam;
    }
  } else {
    exams.push(exam);
  }

  saveToStorage(STORAGE_KEYS.EXAMS, exams);

  // Regenera blocos de estudo automáticos
  tasks = tasks.filter(t => !t.source.startsWith("auto:study"));
  generateStudyBlocksForAllExams();
  saveToStorage(STORAGE_KEYS.TASKS, tasks);

  closeExamModal();
  showToast("Avaliação salva e plano de estudos atualizado!", "success");
  renderExamsView();
});

// ------------- URGÊNCIA / LABELS ------------------------------

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

// ------------- LISTA DE AVALIAÇÕES ----------------------------

function buildExamCard(ex) {
  const urgency = examUrgency(ex);
  const days    = daysUntil(ex.date);

  const card = document.createElement("div");
  card.className = `exam-card ${
    urgency === "urgent" ? "urgent" :
    urgency === "soon"   ? "soon"   : "ok"
  }`;

  const icon = document.createElement("div");
  icon.className = "exam-icon";
  icon.textContent = {
    prova:"📝", trabalho:"📋", seminario:"🎤", pratica:"🔬",
  }[ex.type] || "📝";

  const info = document.createElement("div");
  info.className = "exam-info";

  const title = document.createElement("div");
  title.className = "exam-title";
  title.textContent = ex.subject;

  const meta = document.createElement("div");
  meta.className = "exam-meta";

  const dateStr = new Date(ex.date + "T12:00:00").toLocaleDateString("pt-BR", {
    weekday:"short", day:"2-digit", month:"2-digit",
  });
  const daysText = days < 0
    ? "Já passou"
    : days === 0 ? "Hoje!"
    : days === 1 ? "Amanhã!"
    : `Em ${days} dias`;

  meta.innerHTML = `
    <span>${dateStr} · ${ex.time || "--:--"}</span>
    <span>${urgencyLabel(urgency)}</span>
    <span style="color:#7c6af7">${daysText}</span>
    ${ex.weight ? `<span>Nota: ${ex.weight}</span>` : ""}
  `;

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
    tip.style.cssText = "font-size:.75rem;color:#64748b";
    tip.textContent = "Adicione os conteúdos para montar um plano de estudo mais específico.";
    topicsEl.appendChild(tip);
  }

  info.appendChild(title);
  info.appendChild(meta);
  info.appendChild(topicsEl);

  const actions = document.createElement("div");
  actions.className = "exam-actions";

  const btnEdit = document.createElement("button");
  btnEdit.className = "btn-icon";
  btnEdit.textContent = "✎";
  btnEdit.title = "Editar";
  btnEdit.addEventListener("click", () => openExamModal(ex.id));

  const btnDelete = document.createElement("button");
  btnDelete.className = "btn-icon danger";
  btnDelete.textContent = "🗑";
  btnDelete.title = "Excluir";
  btnDelete.addEventListener("click", () => {
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
  actions.appendChild(btnDelete);

  card.appendChild(icon);
  card.appendChild(info);
  card.appendChild(actions);

  return card;
}

function renderExamsView() {
  sectionExams.innerHTML = "";

  const header = document.createElement("div");
  header.className = "section-header";
  header.innerHTML = `
    <div>
      <h1>Provas & Trabalhos</h1>
      <p>Cadastre avaliações, conteúdos e deixe o sistema organizar os estudos.</p>
    </div>
  `;
  const btnNew = document.createElement("button");
  btnNew.className = "btn-add-task";
  btnNew.textContent = "+ Nova Avaliação";
  btnNew.addEventListener("click", () => openExamModal());
  header.appendChild(btnNew);
  sectionExams.appendChild(header);

  if (!exams.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.innerHTML = `
      <div class="empty-icon">📝</div>
      <p>Nenhuma avaliação cadastrada ainda.</p>
    `;
    sectionExams.appendChild(empty);
    return;
  }

  const upcoming = exams
    .filter(e => daysUntil(e.date) >= 0)
    .sort((a,b) => new Date(a.date) - new Date(b.date));
  const past = exams
    .filter(e => daysUntil(e.date) < 0)
    .sort((a,b) => new Date(b.date) - new Date(a.date));

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

  if (past.length) {
    const card2 = document.createElement("div");
    card2.className = "card";
    const t2 = document.createElement("div");
    t2.className = "card-title";
    t2.textContent = "Avaliações já realizadas";
    card2.appendChild(t2);
    past.forEach(ex => card2.appendChild(buildExamCard(ex)));
    sectionExams.appendChild(card2);
  }
}

// ------------- BLOCOS DE ESTUDO AUTOMÁTICOS -------------------
// Usa STUDY_SLOTS_BY_DAY (em data.js)

function generateStudyBlocksForAllExams() {
  tasks = tasks.filter(t => !t.source.startsWith("auto:study"));

  const upcoming = exams
    .filter(e => daysUntil(e.date) >= 0)
    .sort((a,b) => new Date(a.date) - new Date(b.date));

  if (!upcoming.length) return;

  upcoming.forEach((ex, idx) => {
    const examDate = toDateOnly(new Date(ex.date));
    const today    = toDateOnly(new Date());
    const daysLeft = daysUntil(ex.date);
    const studySpan = Math.max(1, Math.min(daysLeft, 7)); // até 7 dias antes

    for (let offset = 0; offset < studySpan; offset++) {
      const d = new Date(today);
      d.setDate(today.getDate() + offset);
      const dateStr = d.toISOString().slice(0,10);
      const weekday = d.getDay();

      // Alternância se houver duas provas próximas:
      if (upcoming.length >= 2) {
        // ex: prova 0 pega offsets pares, prova 1 offsets ímpares
        if (offset % upcoming.length !== idx % upcoming.length) continue;
      }

      const slots = STUDY_SLOTS_BY_DAY[weekday] || [];
      slots.forEach(slot => {
        const conflict = tasks.some(t =>
          t.date === dateStr &&
          isTimeOverlap(t.start, t.end, slot.start, slot.end)
        );
        if (!conflict) {
          const topics = ex.topics || [];
          const topic  = topics.length
            ? topics[(offset) % topics.length]
            : "Revisão geral";

          tasks.push({
            id: uuid(),
            title: `Estudo · ${ex.subject}`,
            date: dateStr,
            start: slot.start,
            end:   slot.end,
            category: "study",
            priority: daysLeft <= 3 ? "high" : "medium",
            notes: `Conteúdo: ${topic}\nSugestão: 2 ciclos Pomodoro (25min foco / 5min pausa).`,
            done: false,
            source: `auto:study:${ex.id}`,
          });
        }
      });
    }
  });
}

// ------------- TELA DE PLANO DE ESTUDOS -----------------------

function renderStudyView() {
  sectionStudy.innerHTML = "";

  const header = document.createElement("div");
  header.className = "section-header";
  header.innerHTML = `
    <div>
      <h1>Plano de Estudos</h1>
      <p>Organizado automaticamente a partir das suas provas e trabalhos.</p>
    </div>
  `;
  sectionStudy.appendChild(header);

  const studyTasks = tasks
    .filter(t => t.source.startsWith("auto:study"))
    .sort((a,b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return timeStrToMinutes(a.start) - timeStrToMinutes(b.start);
    });

  if (!studyTasks.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.innerHTML = `
      <div class="empty-icon">📚</div>
      <p>Nenhum bloco de estudo criado ainda.<br>
      Vá em <strong>Provas & Trabalhos</strong> e cadastre uma avaliação.</p>
    `;
    sectionStudy.appendChild(empty);
    return;
  }

  const grouped = {};
  studyTasks.forEach(t => {
    if (!grouped[t.date]) grouped[t.date] = [];
    grouped[t.date].push(t);
  });

  Object.entries(grouped).forEach(([dateStr, list]) => {
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
      row.className = "study-day";

      const time = document.createElement("div");
      time.className = "study-day-label";
      time.textContent = `${t.start} – ${t.end}`;

      const content = document.createElement("div");
      content.className = "study-day-content";

      const main = document.createElement("div");
      main.textContent = t.title;

      const method = document.createElement("span");
      method.className = "study-day-method";
      method.textContent = "Pomodoro 25+5";

      const note = document.createElement("div");
      note.style.cssText = "font-size:.75rem;color:#64748b;margin-top:3px";
      note.textContent = t.notes.split("\n")[0]; // primeira linha: conteúdo

      const check = document.createElement("input");
      check.type = "checkbox";
      check.checked = t.done;
      check.style.cssText = "margin-left:auto;accent-color:#7c6af7;width:16px;height:16px;cursor:pointer";
      check.addEventListener("change", () => {
        t.done = check.checked;
        saveToStorage(STORAGE_KEYS.TASKS, tasks);
        showToast(check.checked ? "Bloco concluído!" : "Bloco marcado como pendente.", check.checked ? "success" : "info");
      });

      content.appendChild(main);
      content.appendChild(method);
      content.appendChild(note);

      row.appendChild(time);
      row.appendChild(content);
      row.appendChild(check);
      card.appendChild(row);
    });

    sectionStudy.appendChild(card);
  });
}
