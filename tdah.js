// ===============================
// Métodos TDAH + Pomodoro
// ===============================

let pomoInterval = null;
let pomoSeconds  = 25 * 60; // 25 minutos foco
let pomoMode     = "focus"; // "focus" ou "break"
let pomoRunning  = false;

function formatPomoTime(sec) {
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
      <h1>Métodos de Estudo (TDAH)</h1>
      <p>Pomodoro adaptado, ciclos curtos e estratégias anti-distração.</p>
    </div>
  `;
  sectionTdah.appendChild(header);

  // ---------- Pomodoro ----------
  const pomoCard = document.createElement("div");
  pomoCard.className = "pomodoro-widget";

  const title = document.createElement("div");
  title.className = "card-title";
  title.textContent = "Timer Pomodoro";

  const timeEl = document.createElement("div");
  timeEl.id = "pomoTime";
  timeEl.className = "pomodoro-time";
  timeEl.textContent = formatPomoTime(pomoSeconds);

  const label = document.createElement("div");
  label.id = "pomoLabel";
  label.className = "pomodoro-label";
  label.textContent = "Foco (25 min)";

  const controls = document.createElement("div");
  controls.className = "pomodoro-controls";

  const btnStart = document.createElement("button");
  btnStart.className = "btn-pomo start";
  btnStart.textContent = "Iniciar";

  const btnPause = document.createElement("button");
  btnPause.className = "btn-pomo pause";
  btnPause.textContent = "Pausar";

  const btnReset = document.createElement("button");
  btnReset.className = "btn-pomo reset";
  btnReset.textContent = "Resetar";

  controls.appendChild(btnStart);
  controls.appendChild(btnPause);
  controls.appendChild(btnReset);

  pomoCard.appendChild(title);
  pomoCard.appendChild(timeEl);
  pomoCard.appendChild(label);
  pomoCard.appendChild(controls);
  sectionTdah.appendChild(pomoCard);

  function updatePomoUI() {
    document.getElementById("pomoTime").textContent = formatPomoTime(pomoSeconds);
    const lbl = document.getElementById("pomoLabel");
    lbl.textContent = pomoMode === "focus"
      ? "Foco (25 min) — escolha uma tarefa específica."
      : "Pausa (5 min) — levante, tome água, respire.";
  }

  function startPomo() {
    if (pomoRunning) return;
    pomoRunning = true;
    pomoInterval = setInterval(() => {
      pomoSeconds--;
      if (pomoSeconds <= 0) {
        // alterna modo
        if (pomoMode === "focus") {
          pomoMode = "break";
          pomoSeconds = 5 * 60; // pausa
          showToast("Tempo de foco terminou. Pausa de 5 minutos!", "info");
        } else {
          pomoMode = "focus";
          pomoSeconds = 25 * 60;
          showToast("Pausa terminou. Volte para o foco!", "info");
        }
      }
      updatePomoUI();
    }, 1000);
  }

  function pausePomo() {
    if (pomoInterval) clearInterval(pomoInterval);
    pomoInterval = null;
    pomoRunning  = false;
  }

  function resetPomo() {
    pausePomo();
    pomoMode    = "focus";
    pomoSeconds = 25 * 60;
    updatePomoUI();
  }

  btnStart.addEventListener("click", startPomo);
  btnPause.addEventListener("click", pausePomo);
  btnReset.addEventListener("click", resetPomo);

  updatePomoUI();

  // ---------- Cartões de método ----------
  const methodsCard = document.createElement("div");
  methodsCard.className = "card";
  const mTitle = document.createElement("div");
  mTitle.className = "card-title";
  mTitle.textContent = "Estratégias que costumam funcionar bem em TDAH";
  methodsCard.appendChild(mTitle);

  const methods = [
    {
      icon: "⏱️",
      title: "Pomodoro adaptado (25+5)",
      text:  "25 minutos de foco intenso em UMA tarefa + 5 minutos de pausa. Depois de 4 ciclos, faça uma pausa maior (15–20 min). Use para blocos de leitura e resumo.",
    },
    {
      icon: "🧩",
      title: "Quebra em micro-tarefas",
      text:  "Pegue um conteúdo grande (ex: 'Anestesiologia — anestésicos inalatórios') e quebre em micro-tarefas: 'ler artigo X', 'fazer 5 questões', 'reler resumos'. Isso conversa bem com a agenda e reduz paralisia por tamanho.",
    },
    {
      icon: "🔁",
      title: "Alternância de disciplinas",
      text:  "Quando tiver duas provas próximas, alterne os blocos: um ciclo para a prova A, outro para a prova B. O planner já alterna os blocos automaticamente quando detecta duas avaliações próximas.",
    },
    {
      icon: "📵",
      title: "Barreiras visuais para distrações",
      text:  "Durante o foco: notificações desligadas, celular longe ou em outro cômodo, aba de rede social fechada, só material de estudo à vista. Quanto menos estímulo, menos desvio de atenção.",
    },
  ];

  methods.forEach(m => {
    const card = document.createElement("div");
    card.className = "method-card";
    const icon = document.createElement("div");
    icon.className = "method-icon";
    icon.textContent = m.icon;

    const info = document.createElement("div");
    info.className = "method-info";
    const h3 = document.createElement("h3");
    h3.textContent = m.title;
    const p = document.createElement("p");
    p.textContent = m.text;

    info.appendChild(h3);
    info.appendChild(p);
    card.appendChild(icon);
    card.appendChild(info);
    methodsCard.appendChild(card);
  });

  sectionTdah.appendChild(methodsCard);
}
