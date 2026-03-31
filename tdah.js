// ===============================
// tdah.js — Timer Pomodoro + Métodos de estudo TDAH
// ===============================

// variáveis do timer (fora da função para não resetar ao trocar de aba)
let pomoInterval = null;
let pomoSeconds  = 25 * 60;
let pomoMode     = "focus";
let pomoRunning  = false;

function formatPomoTime(sec) {
  const m = String(Math.floor(sec / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");
  return `${m}:${s}`;
}

function renderTdahView() {
  sectionTdah.innerHTML = "";

  // ── CABEÇALHO ──────────────────────────────────────────────
  const header = document.createElement("div");
  header.className = "section-header";
  header.innerHTML = `
    <div>
      <h1>Métodos de Estudo · TDAH</h1>
      <p>Timer Pomodoro integrado + estratégias de foco para TDAH.</p>
    </div>
  `;
  sectionTdah.appendChild(header);

  // ── POMODORO WIDGET ────────────────────────────────────────
  const pomoCard = document.createElement("div");
  pomoCard.className = "pomodoro-widget";

  const pomoTitle = document.createElement("div");
  pomoTitle.className = "card-title";
  pomoTitle.textContent = "⏱️ Timer Pomodoro";

  const timeDisplay = document.createElement("div");
  timeDisplay.id = "pomoTime";
  timeDisplay.className = "pomodoro-time";
  timeDisplay.textContent = formatPomoTime(pomoSeconds);

  const modeLabel = document.createElement("div");
  modeLabel.id = "pomoLabel";
  modeLabel.className = "pomodoro-label";
  modeLabel.textContent = "Foco (25 min) — escolha uma tarefa específica.";

  // barra de progresso do ciclo
  const progressBar = document.createElement("div");
  progressBar.className = "method-timer-bar";
  progressBar.style.margin = "0 0 18px 0";
  const progressFill = document.createElement("div");
  progressFill.id = "pomoProgress";
  progressFill.className = "method-timer-fill";
  progressFill.style.width = "0%";
  progressBar.appendChild(progressFill);

  // seletor de duração
  const configRow = document.createElement("div");
  configRow.style.cssText = `
    display:flex;gap:10px;justify-content:center;
    margin-bottom:16px;flex-wrap:wrap;
  `;

  const presets = [
    { label: "15 min", focus: 15, breakT: 3  },
    { label: "25 min", focus: 25, breakT: 5  },
    { label: "45 min", focus: 45, breakT: 10 },
  ];

  let selectedPreset = presets[1]; // padrão 25+5

  presets.forEach(p => {
    const btn = document.createElement("button");
    btn.textContent = p.label;
    btn.style.cssText = `
      padding:6px 14px;border-radius:99px;font-size:.78rem;
      font-weight:600;cursor:pointer;border:1px solid;
      border-color:${p === selectedPreset ? "#7c6af7" : "#334155"};
      background:${p === selectedPreset ? "rgba(124,106,247,.16)" : "transparent"};
      color:${p === selectedPreset ? "#e5e7eb" : "#9ca3af"};
      transition:all .2s;
    `;
    btn.dataset.preset = p.label;

    btn.addEventListener("click", () => {
      if (pomoRunning) {
        showToast("Pause o timer antes de trocar o tempo.", "warning");
        return;
      }
      selectedPreset = p;
      pomoMode    = "focus";
      pomoSeconds = p.focus * 60;

      // atualiza visual dos botões de preset
      configRow.querySelectorAll("button").forEach(b => {
        const active = b.dataset.preset === p.label;
        b.style.borderColor  = active ? "#7c6af7" : "#334155";
        b.style.background   = active ? "rgba(124,106,247,.16)" : "transparent";
        b.style.color        = active ? "#e5e7eb" : "#9ca3af";
      });

      updatePomoUI();
      showToast(`Timer ajustado para ${p.focus} min foco + ${p.breakT} min pausa.`, "info");
    });

    configRow.appendChild(btn);
  });

  // controles
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

  // ciclos concluídos
  const cycleCount = document.createElement("div");
  cycleCount.style.cssText = "font-size:.78rem;color:#64748b;margin-top:12px;text-align:center";
  cycleCount.id = "pomoCycles";
  cycleCount.textContent = "Ciclos de foco concluídos hoje: 0";

  let focusCycles = 0;

  // monta o card
  pomoCard.appendChild(pomoTitle);
  pomoCard.appendChild(timeDisplay);
  pomoCard.appendChild(modeLabel);
  pomoCard.appendChild(progressBar);
  pomoCard.appendChild(configRow);
  pomoCard.appendChild(controls);
  pomoCard.appendChild(cycleCount);

  sectionTdah.appendChild(pomoCard);

  // ── FUNÇÕES DO TIMER ────────────────────────────────────────

  function updatePomoUI() {
    const el = document.getElementById("pomoTime");
    const lb = document.getElementById("pomoLabel");
    const pg = document.getElementById("pomoProgress");
    const cy = document.getElementById("pomoCycles");

    if (el) el.textContent = formatPomoTime(pomoSeconds);
    if (lb) {
      lb.textContent = pomoMode === "focus"
        ? `Foco (${selectedPreset.focus} min) — escolha UMA tarefa e vá fundo.`
        : `Pausa (${selectedPreset.breakT} min) — levante, tome água, respire.`;
      lb.style.color = pomoMode === "focus" ? "#a99bf9" : "#4ade80";
    }
    if (pg) {
      const total = pomoMode === "focus"
        ? selectedPreset.focus * 60
        : selectedPreset.breakT * 60;
      const pct = ((total - pomoSeconds) / total) * 100;
      pg.style.width = pct + "%";
      pg.style.background = pomoMode === "focus"
        ? "linear-gradient(90deg, #7c6af7, #22d3ee)"
        : "linear-gradient(90deg, #4ade80, #22d3ee)";
    }
    if (cy) cy.textContent = `Ciclos de foco concluídos: ${focusCycles}`;
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
          focusCycles++;
          pomoMode    = "break";
          pomoSeconds = selectedPreset.breakT * 60;
          showToast(`Foco concluído! Pausa de ${selectedPreset.breakT} min. 🎉`, "success");

          // depois de 4 ciclos, pausa longa
          if (focusCycles % 4 === 0) {
            clearInterval(pomoInterval);
            pomoRunning = false;
            pomoSeconds = 20 * 60;
            showToast("4 ciclos completos! Você merece uma pausa longa de 20 min. 💪", "info");
          }
        } else {
          pomoMode    = "focus";
          pomoSeconds = selectedPreset.focus * 60;
          showToast("Pausa terminou. Bora focar de novo!", "info");
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
    pomoSeconds = selectedPreset.focus * 60;
    updatePomoUI();
    showToast("Timer resetado.", "info");
  }

  btnStart.addEventListener("click", startPomo);
  btnPause.addEventListener("click", pausePomo);
  btnReset.addEventListener("click", resetPomo);

  updatePomoUI();

  // ── MÉTODOS DE ESTUDO ───────────────────────────────────────
  const methodsCard = document.createElement("div");
  methodsCard.className = "card";

  const mTitle = document.createElement("div");
  mTitle.className = "card-title";
  mTitle.textContent = "Estratégias testadas para TDAH";
  methodsCard.appendChild(mTitle);

  const methods = [
    {
      icon: "⏱️",
      title: "Pomodoro adaptado",
      badge: "badge-accent",
      badgeText: "Recomendado",
      text: `25 min de foco em UMA tarefa + 5 min de pausa. 
Após 4 ciclos, 20 min de descanso. 
Para Medicina Veterinária, use assim:
• 1º ciclo: ler o material
• 2º ciclo: fazer resumo
• 3º ciclo: resolver questões
• 4º ciclo: revisar erros`,
    },
    {
      icon: "🧩",
      title: "Chunking (divisão em pedaços)",
      badge: "badge-cyan",
      badgeText: "Anti-paralisia",
      text: `Conteúdo grande = dificulta o início (paralisia por tarefa).
Solução: quebre em micro-passos.

Exemplo — Anestesiologia:
→ "Estudar Anestesiologia" vira:
• Ler páginas 1–5 sobre anestésicos inalatórios
• Fazer um mapa dos fármacos
• Resolver 5 questões sobre o tema
• Revisar anotações da aula prática`,
    },
    {
      icon: "🔁",
      title: "Alternância entre matérias",
      badge: "badge-green",
      badgeText: "2 provas próximas",
      text: `Quando há duas provas próximas:
• Ciclo 1 → Matéria A
• Pausa 5 min
• Ciclo 2 → Matéria B
• Pausa 5 min
• Repete

O planner já faz isso automaticamente quando você 
cadastra duas provas com datas próximas.`,
    },
    {
      icon: "📵",
      title: "Ambiente anti-distração",
      badge: "badge-yellow",
      badgeText: "Essencial",
      text: `Durante o bloco de foco:
• Celular no modo avião ou em outro cômodo
• Notificações do computador desligadas
• Só o material de estudo aberto na tela
• Fone com música instrumental (sem letra)
• Avise as pessoas ao redor que está em foco

O cérebro com TDAH responde bem a ambiente previsível.`,
    },
    {
      icon: "✍️",
      title: "Escrita ativa (sem copiar passivamente)",
      badge: "badge-orange",
      badgeText: "Retenção",
      text: `Em vez de só ler ou copiar:
• Leia um trecho → feche o material → escreva com suas palavras
• Faça perguntas sobre o conteúdo e responda
• Crie histórias ou analogias para lembrar

Para Clínica de Pequenos Animais, por exemplo:
→ "Como eu explicaria esse protocolo para um colega?"`,
    },
  ];

  methods.forEach(m => {
    const card = document.createElement("div");
    card.className = "method-card";
    card.style.flexDirection = "column";

    const topRow = document.createElement("div");
    topRow.style.cssText = "display:flex;align-items:center;gap:12px;margin-bottom:10px";

    const icon = document.createElement("div");
    icon.className = "method-icon";
    icon.textContent = m.icon;

    const titleRow = document.createElement("div");
    titleRow.style.flex = "1";

    const h3 = document.createElement("h3");
    h3.textContent = m.title;

    const badge = document.createElement("span");
    badge.className = `badge ${m.badge}`;
    badge.style.marginLeft = "8px";
    badge.textContent = m.badgeText;

    titleRow.appendChild(h3);
    titleRow.appendChild(badge);
    topRow.appendChild(icon);
    topRow.appendChild(titleRow);

    const p = document.createElement("pre");
    p.style.cssText = `
      font-size:.82rem;color:#9ca3af;line-height:1.7;
      white-space:pre-wrap;font-family:inherit;margin:0;
    `;
    p.textContent = m.text;

    card.appendChild(topRow);
    card.appendChild(p);
    methodsCard.appendChild(card);
  });

  sectionTdah.appendChild(methodsCard);

  // ── DICA DE ROTINA ──────────────────────────────────────────
  const tipCard = document.createElement("div");
  tipCard.className = "card";
  tipCard.innerHTML = `
    <div class="card-title">💡 Dica para manter a consistência</div>
    <p style="font-size:.84rem;color:#9ca3af;line-height:1.7">
      O maior desafio do TDAH não é aprender — é <strong>começar</strong>.
      Use a regra dos 2 minutos: se uma tarefa leva menos de 2 minutos, faça agora.
      Para as maiores, diga só: <em>"Vou ler apenas uma página."</em>
      Na maioria das vezes, você vai continuar depois de começar.
      <br><br>
      O planner já organizou sua rotina de casa, aulas e estudo de forma
      que você não precise decidir o que fazer — só olhar e executar.
      <strong>Decisão tomada antes = menos energia gasta na hora H.</strong>
    </p>
  `;
  sectionTdah.appendChild(tipCard);
}
