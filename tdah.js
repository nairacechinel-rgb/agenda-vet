// ================================================
// tdah.js — Métodos de estudo + Pomodoro
// ================================================

let pomoInterval = null;
let pomoSeconds  = 25 * 60;
let pomoMode     = "focus"; // focus | break
let pomoRunning  = false;
let pomoPreset   = { focus:25, breakT:5 };
let pomoCycles   = 0;

function formatPomo(sec) {
  const m = String(Math.floor(sec / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");
  return `${m}:${s}`;
}

function renderTdahView() {
  sectionTdah.innerHTML = "";

  const header = document.createElement("div");
  header.className = "section-header";
  header.innerHTML = `
    <div>
      <h1>Métodos TDAH</h1>
      <p>Timer Pomodoro e estratégias para foco com TDAH.</p>
    </div>
  `;
  sectionTdah.appendChild(header);

  // POMODORO
  const pomoCard = document.createElement("div");
  pomoCard.className = "pomodoro-widget";

  const title = document.createElement("div");
  title.className = "card-title";
  title.textContent = "⏱ Timer Pomodoro adaptado";

  const timeEl = document.createElement("div");
  timeEl.id = "pomoTime";
  timeEl.className = "pomodoro-time";
  timeEl.textContent = formatPomo(pomoSeconds);

  const label = document.createElement("div");
  label.id = "pomoLabel";
  label.className = "pomodoro-label";
  label.textContent = "Foco (25 min) — escolha uma tarefa específica.";

  const controls = document.createElement("div");
  controls.className = "pomodoro-controls";

  const btnStart = document.createElement("button");
  btnStart.className = "btn-pomo start";
  btnStart.textContent = "▶ Iniciar";

  const btnPause = document.createElement("button");
  btnPause.className = "btn-pomo pause";
  btnPause.textContent = "⏸ Pausar";

  const btnReset = document.createElement("button");
  btnReset.className = "btn-pomo reset";
  btnReset.textContent = "↺ Resetar";

  controls.appendChild(btnStart);
  controls.appendChild(btnPause);
  controls.appendChild(btnReset);

  const cyclesEl = document.createElement("div");
  cyclesEl.id = "pomoCycles";
  cyclesEl.style.cssText = "font-size:.8rem;color:#9ca3af;margin-top:10px;";
  cyclesEl.textContent = "Ciclos de foco concluídos: 0";

  pomoCard.appendChild(title);
  pomoCard.appendChild(timeEl);
  pomoCard.appendChild(label);
  pomoCard.appendChild(controls);
  pomoCard.appendChild(cyclesEl);

  sectionTdah.appendChild(pomoCard);

  function updatePomoUI() {
    timeEl.textContent = formatPomo(pomoSeconds);
    label.textContent = pomoMode === "focus"
      ? `Foco (${pomoPreset.focus} min) — escolha UMA tarefa e vá fundo.`
      : `Pausa (${pomoPreset.breakT} min) — levante, tome água, respire.`;
    label.style.color = pomoMode === "focus" ? "#a99bf9" : "#4ade80";
    cyclesEl.textContent = `Ciclos de foco concluídos: ${pomoCycles}`;
  }

  function startPomo() {
    if (pomoRunning) return;
    pomoRunning = true;
    btnStart.textContent = "▶ Rodando...";
    btnStart.style.opacity = ".6";

    pomoInterval = setInterval(() => {
      pomoSeconds--;
      updatePomoUI();
      if (pomoSeconds <= 0) {
        if (pomoMode === "focus") {
          pomoCycles++;
          pomoMode = "break";
          pomoSeconds = pomoPreset.breakT * 60;
          showToast("Foco concluído! Hora de uma pausa curta.", "success");
        } else {
          pomoMode = "focus";
          pomoSeconds = pomoPreset.focus * 60;
          showToast("Pausa concluída. Bora focar de novo!", "info");
        }
        updatePomoUI();
      }
    }, 1000);
  }

  function pausePomo() {
    if (pomoInterval) clearInterval(pomoInterval);
    pomoInterval = null;
    pomoRunning  = false;
    btnStart.textContent = "▶ Iniciar";
    btnStart.style.opacity = "1";
  }

  function resetPomo() {
    pausePomo();
    pomoMode    = "focus";
    pomoSeconds = pomoPreset.focus * 60;
    updatePomoUI();
    showToast("Timer resetado.", "info");
  }

  btnStart.addEventListener("click", startPomo);
  btnPause.addEventListener("click", pausePomo);
  btnReset.addEventListener("click", resetPomo);
  updatePomoUI();

  // MÉTODOS DE ESTUDO
  const methodsCard = document.createElement("div");
  methodsCard.className = "card";

  const mTitle = document.createElement("div");
  mTitle.className = "card-title";
  mTitle.textContent = "Estratégias de estudo para TDAH";
  methodsCard.appendChild(mTitle);

  const list = document.createElement("div");

  const methods = [
    {
      icon: "⏱",
      title: "Pomodoro adaptado",
      badge: "Recomendado",
      text: `25 min de foco em UMA tarefa + 5 min de pausa.
Após 4 ciclos, faça uma pausa maior (15–20 min).
Use para:
• Ler resumo de aula
• Fazer mapa mental
• Resolver questões`,
    },
    {
      icon: "🧩",
      title: "Chunking (quebrar tarefas)",
      badge: "Anti-paralisia",
      text: `Conteúdo grande vira vários passos pequenos.
Exemplo: "Estudar Anestesiologia" vira:
• Ler 4 páginas de farmacologia
• Fazer 5 flashcards
• Resolver 3 questões anteriores`,
    },
    {
      icon: "📵",
      title: "Ambiente anti-distração",
      badge: "Essencial",
      text: `Durante o bloco de foco:
• Celular fora do alcance ou modo avião
• Somente abas essenciais abertas
• Música sem letra (se for usar música)
• Avisar família/colegas que está estudando`,
    },
  ];

  methods.forEach(m => {
    const row = document.createElement("div");
    row.className = "method-card";

    const icon = document.createElement("div");
    icon.className = "method-icon";
    icon.textContent = m.icon;

    const info = document.createElement("div");
    info.className = "method-info";

    const h3 = document.createElement("h3");
    h3.textContent = m.title;

    const badge = document.createElement("span");
    badge.className = "badge badge-accent";
    badge.style.marginLeft = "6px";
    badge.textContent = m.badge;

    const titleRow = document.createElement("div");
    titleRow.style.display = "flex";
    titleRow.style.alignItems = "center";
    titleRow.appendChild(h3);
    titleRow.appendChild(badge);

    const p = document.createElement("p");
    p.textContent = m.text;

    info.appendChild(titleRow);
    info.appendChild(p);

    row.appendChild(icon);
    row.appendChild(info);
    list.appendChild(row);
  });

  methodsCard.appendChild(list);
  sectionTdah.appendChild(methodsCard);
}
