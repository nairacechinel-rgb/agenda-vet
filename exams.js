// ================================================
// exams.js — Provas, trabalhos e plano de estudos
// ================================================

// ── TOPICS INPUT (lista de conteúdos) ────────────────────────

function renderTopicsInputs(topics = []) {
  topicsContainer.innerHTML = "";

  const list = topics.length ? topics : [""];
  list.forEach((t, idx) => {
    addTopicInputRow(t, idx === list.length - 1);
  });
}

function addTopicInputRow(value = "", focus = false) {
  const row = document.createElement("div");
  row.className = "topic-row";

  const input = document.createElement("input");
  input.type = "text";
  input.className = "exam-topic-input";
  input.value = value;
  input.placeholder = "Ex: Farmacologia inalatória";

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "btn-add-topic";
  btn.textContent = "+";
  btn.addEventListener("click", () => {
    addTopicInputRow("", true);
  });

  row.appendChild(input);
  row.appendChild(btn);
  topicsContainer.appendChild(row);

  if (focus) input.focus();
}

function getTopicsFromInputs() {
  const inputs = topicsContainer.querySelectorAll(".exam-topic-input");
  const arr = [];
  inputs.forEach(i => {
    const v = i.value.trim();
    if (v) arr.push(v);
  });
  return arr;
}

// ── MODAL DE AVALIAÇÃO ───────────────────────────────────────

function openExamModal(exam = null) {
  editingExamId = exam ? exam.id : null;

  if (exam) {
    modalExamTitle.textContent = "Editar Avaliação";
    inputExamSubject.value = exam.subject || "";
    inputExamType.value    = exam.type || "prova";
    inputExamDate.value    = exam.date || "";
    inputExamTime.value    = exam.time || "";
    inputExamWeight.value  = exam.weight != null ? exam.weight : "";
    inputExamNotes.value   = exam.notes || "";
    renderTopicsInputs(exam.topics || []);
  } else {
    modalExamTitle.textContent = "Nova Avaliação";
    inputExamSubject.value = "";
    inputExamType.value    = "prova";
    inputExamDate.value    = "";
    inputExamTime.value    = "";
    inputExamWeight.value  = "";
    inputExamNotes.value   = "";
    renderTopicsInputs([]);
  }

  modalExamOverlay.classList.add("open");
}

btnExamSave.addEventListener("click", () => {
  const subject = inputExamSubject.value.trim();
  const type    = inputExamType.value;
  const date    = inputExamDate.value;
  const time    = inputExamTime.value;
  const weight  = inputExamWeight.value ? Number(inputExamWeight.value) : null;
  const notes   = inputExamNotes.value.trim();
  const topics  = getTopicsFromInputs();

  if (!subject || !date) {
    showToast("Disciplina e data são obrigatórias.", "warning");
    return;
  }

  const exam = {
    id: editingExamId || uuid(),
    subject, type, date, time, weight, notes, topics,
  };

  if (editingExamId) {
    const idx = exams.findIndex(e => e.id === editingExamId);
    if (idx >= 0) exams[idx] = exam;
  } else {
    exams.push(exam);
  }

  saveToStorage(STORAGE_KEYS.EXAMS, exams);
  modalExamOverlay.classList.remove("open");
  showToast("Avaliação salva!", "success");
  renderExamsView();
});

// ── RENDER ABA EXAMS ─────────────────────────────────────────

function renderExamsView() {
  sectionExams.innerHTML = "";

  const header = document.createElement("div");
  header.className = "section-header";
  header.innerHTML = `
    <div>
      <h1>Provas & Trabalhos</h1>
      <p>Cadastre avaliações e gere um plano de estudo automático.</p>
    </div>
  `;
  sectionExams.appendChild(header);

  const card = document.createElement("div");
  card.className = "card";

  const topRow = document.createElement("div");
  topRow.style.cssText = "display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;";

  const title = document.createElement("div");
  title.className = "card-title";
  title.textContent = "Avaliações cadastradas";

  const btnNew = document.createElement("button");
  btnNew.className = "btn-save";
  btnNew.textContent = "+ Nova avaliação";
  btnNew.addEventListener("click", () => openExamModal(null));

  topRow.appendChild(title);
  topRow.appendChild(btnNew);
  card.appendChild(topRow);

  const upcoming = exams
    .slice()
    .sort((a, b) => dateFromStr(a.date) - dateFromStr(b.date));

  if (!upcoming.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.innerHTML = `
      <div class="empty-icon">📝</div>
      <p>Nenhuma avaliação cadastrada.</p>
      <p style="margin-top:6px;font-size:.82rem;color:#9ca3af">
        Clique em <strong>"Nova avaliação"</strong> para adicionar prova, trabalho ou seminário.
      </p>
    `;
    card.appendChild(empty);
  } else {
    upcoming.forEach(ex => {
      const row = document.createElement("div");
      row.className = "exam-card";

      const icon = document.createElement("div");
      icon.className = "exam-icon";
      icon.textContent = ex.type === "trabalho" ? "📋"
        : ex.type === "seminario" ? "🎤"
        : ex.type === "pratica" ? "🔬"
        : "📝";

      const info = document.createElement("div");
      info.className = "exam-info";

      const titleEl = document.createElement("div");
      titleEl.className = "exam-title";
      titleEl.textContent = ex.subject;
      info.appendChild(titleEl);

      const meta = document.createElement("div");
      meta.className = "exam-meta";

      const d = document.createElement("span");
      d.textContent = formatDateBR(ex.date);

      const t = document.createElement("span");
      t.textContent = ex.time ? `às ${ex.time}` : "Horário a definir";

      const typeSpan = document.createElement("span");
      typeSpan.textContent = ex.type === "trabalho" ? "Trabalho"
        : ex.type === "seminario" ? "Seminário"
        : ex.type === "pratica" ? "Avaliação prática"
        : "Prova";

      if (ex.weight != null) {
        const w = document.createElement("span");
        w.textContent = `Peso: ${ex.weight}`;
        meta.appendChild(w);
      }

      meta.appendChild(d);
      meta.appendChild(t);
      meta.appendChild(typeSpan);
      info.appendChild(meta);

      if (ex.topics && ex.topics.length) {
        const topicsRow = document.createElement("div");
        topicsRow.className = "exam-topics";
        ex.topics.forEach(tp => {
          const tag = document.createElement("span");
          tag.className = "topic-tag";
          tag.textContent = tp;
          topicsRow.appendChild(tag);
        });
        info.appendChild(topicsRow);
      }

      if (ex.notes) {
        const notesEl = document.createElement("p");
        notesEl.style.cssText = "font-size:.8rem;color:#9ca3af;margin-top:5px;";
        notesEl.textContent = ex.notes;
        info.appendChild(notesEl);
      }

      const actions = document.createElement("div");
      actions.className = "exam-actions";

      const btnEdit = document.createElement("button");
      btnEdit.className = "btn-icon";
      btnEdit.textContent = "Editar";
      btnEdit.addEventListener("click", () => openExamModal(ex));

      const btnDel = document.createElement("button");
      btnDel.className = "btn-icon danger";
      btnDel.textContent = "Excluir";
      btnDel.addEventListener("click", () => {
        if (confirm("Excluir esta avaliação?")) {
          exams = exams.filter(e => e.id !== ex.id);
          saveToStorage(STORAGE_KEYS.EXAMS, exams);
          renderExamsView();
        }
      });

      actions.appendChild(btnEdit);
      actions.appendChild(btnDel);

      row.appendChild(icon);
      row.appendChild(info);
      row.appendChild(actions);

      card.appendChild(row);
    });
  }

  sectionExams.appendChild(card);

  // Card de plano de estudo (simples)
  const planCard = document.createElement("div");
  planCard.className = "card";
  planCard.innerHTML = `
    <div class="card-title">Plano de estudos (resumo)</div>
    <p style="font-size:.84rem;color:#9ca3af;line-height:1.6">
      O plano de estudos será construído a partir das avaliações cadastradas,
      usando os blocos de estudo do <strong>STUDY_SLOTS_BY_DAY</strong>.
      Nesta versão, o detalhamento completo ainda não está implementado,
      mas as provas já podem ser cadastradas, visualizadas e editadas.
    </p>
  `;
  sectionExams.appendChild(planCard);
}

function renderStudyView() {
  // Nesta versão, apenas um placeholder simpático
  sectionStudy.innerHTML = "";

  const header = document.createElement("div");
  header.className = "section-header";
  header.innerHTML = `
    <div>
      <h1>Plano de Estudos</h1>
      <p>Organização dos conteúdos por dias da semana, a partir das provas.</p>
    </div>
  `;
  sectionStudy.appendChild(header);

  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = `
    <div class="card-title">Em construção</div>
    <p style="font-size:.84rem;color:#9ca3af;line-height:1.6">
      Aqui você verá um mapa de estudos distribuído pelos dias,
      levando em conta as suas provas e trabalhos.
      Por enquanto, use a aba <strong>Provas & Trabalhos</strong>
      para registrar todas as avaliações e suas datas.
    </p>
  `;
  sectionStudy.appendChild(card);
}
