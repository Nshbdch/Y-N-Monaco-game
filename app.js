const ADMIN_PASSWORD = "Quentibus2000";
const STORAGE_KEY = "yn-cosmic-jackpot-prizes-v1";
const PLAYER_STORAGE_KEY = "yn-cosmic-jackpot-players-v1";
const WINNERS_STORAGE_KEY = "yn-cosmic-jackpot-winners-v1";
const PRIZE_PRESET_VERSION_KEY = "yn-cosmic-jackpot-prize-preset-version";
const PRIZE_PRESET_VERSION = "event-monaco-v1";
const MAX_PLAYER_CREDITS = 3;
const WIN_OVERLAY_DURATION_MS = 10000;
const TERMINAL_TRANSITION_DURATION_MS = 1800;
const MIN_TERMINAL_WIDTH_PX = 320;
const MIN_TERMINAL_HEIGHT_PX = 280;
const WIN_AUDIO_FILE = "win-entry.mp3";
const LOSE_AUDIO_FILE = "lose-entry.mp3";
const BACKGROUND_AUDIO_FILE = "musique-fond.mp3";
const LEVER_AUDIO_FILE = "son-machine.mp3";
const FALLBACK_SYMBOLS = [
  { name: "ALIEN", icon: "👽" },
  { name: "ASTRO", icon: "👨‍🚀" },
  { name: "NOVA", icon: "💥" },
  { name: "UFO", icon: "🛸" },
  { name: "PYRAMID", icon: "🔺" },
  { name: "COMET", icon: "☄️" },
  { name: "ORBIT", icon: "🪐" },
  { name: "NEON", icon: "✨" },
  { name: "VOID", icon: "🌌" },
  { name: "QUASAR", icon: "🌟" },
];
const EVENT_PRIZE_PRESET = [
  { name: "AUDIT GEO / HUBBLE", rate: 1.04, quantity: 4 },
  { name: "AUDIT CRO", rate: 0.52, quantity: 2 },
  { name: "AUDIT SEA/SMA", rate: 0.52, quantity: 2 },
  { name: "AUDIT TRACKING", rate: 0.52, quantity: 2 },
  { name: "INVITATION JUIN", rate: 51.95, quantity: 200 },
  { name: "ATELIERS IA", rate: 12.99, quantity: 50 },
  { name: "STICKERS", rate: 25.97, quantity: 100 },
  { name: "CASQUETTE", rate: 5.19, quantity: 20 },
  { name: "SWEAT", rate: 1.3, quantity: 5 },
];

const dom = {
  accessScreen: document.getElementById("accessScreen"),
  adminScreen: document.getElementById("adminScreen"),
  gameScreen: document.getElementById("gameScreen"),
  terminalScreen: document.getElementById("terminalScreen"),
  participantEntry: document.getElementById("participantEntry"),
  adminEntry: document.getElementById("adminEntry"),
  participantLoginForm: document.getElementById("participantLoginForm"),
  participantEmail: document.getElementById("participantEmail"),
  participantLoginError: document.getElementById("participantLoginError"),
  adminLoginForm: document.getElementById("adminLoginForm"),
  adminPassword: document.getElementById("adminPassword"),
  adminLoginError: document.getElementById("adminLoginError"),
  prizeForm: document.getElementById("prizeForm"),
  prizeName: document.getElementById("prizeName"),
  prizeRate: document.getElementById("prizeRate"),
  prizeQuantity: document.getElementById("prizeQuantity"),
  prizeTableBody: document.getElementById("prizeTableBody"),
  winnerTableBody: document.getElementById("winnerTableBody"),
  exportWinnersBtn: document.getElementById("exportWinnersBtn"),
  clearWinnersBtn: document.getElementById("clearWinnersBtn"),
  adminStats: document.getElementById("adminStats"),
  reels: document.getElementById("reels"),
  slotMachine: document.getElementById("slotMachine"),
  lever: document.getElementById("lever"),
  statusBanner: document.getElementById("statusBanner"),
  livesHearts: document.getElementById("livesHearts"),
  resultOverlay: document.getElementById("resultOverlay"),
  resultText: document.getElementById("resultText"),
  confettiLayer: document.getElementById("confettiLayer"),
  alarmFlash: document.getElementById("alarmFlash"),
  terminalBody: document.getElementById("terminalBody"),
  terminalBackToHome: document.getElementById("terminalBackToHome"),
  quickAdminBtn: document.getElementById("quickAdminBtn"),
  backToHomeFromAdmin: document.getElementById("backToHomeFromAdmin"),
  backToHomeFromGame: document.getElementById("backToHomeFromGame"),
};

let spinning = false;
let prizePool = loadPrizes();
let participantRegistry = loadParticipants();
let winnerLog = loadWinners();
let currentParticipantEmail = "";
let winAudio;
let winAudioCutTimer;
let loseAudio;
let leverAudio;
let backgroundAudio;
let backgroundAudioStarted = false;
let backgroundSuspendCount = 0;
let shouldResumeBackgroundAfterSuspend = false;
let loseAudioResumeTimer;
let actionSfxPrimed = false;
let meteorTimer;
let lastGameScreenRect = null;
const meteorPresets = [
  { sizeMin: 150, sizeMax: 240, speedMin: 17500, speedMax: 24500, maxCount: 1, count: 0, zIndex: 1 },
  { sizeMin: 95, sizeMax: 150, speedMin: 20500, speedMax: 28750, maxCount: 2, count: 0, zIndex: 0 },
  { sizeMin: 55, sizeMax: 95, speedMin: 23750, speedMax: 32500, maxCount: 2, count: 0, zIndex: 0 },
];
const METEOR_FORWARD_OFFSET_DEG = 145;

function normalizePrizeName(name) {
  return name.trim().replace(/\s+/g, " ").toUpperCase();
}

function loadPrizes() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [
      { name: "AUDIT GEO / HUBBLE", rate: 1.04, quantity: 4 },
      { name: "AUDIT CRO", rate: 0.52, quantity: 2 },
      { name: "AUDIT SEA/SMA", rate: 0.52, quantity: 2 },
      { name: "AUDIT TRACKING", rate: 0.52, quantity: 2 },
      { name: "INVITATION JUIN", rate: 51.95, quantity: 200 },
      { name: "ATELIERS IA", rate: 12.99, quantity: 50 },
      { name: "STICKERS", rate: 25.97, quantity: 100 },
      { name: "CASQUETTE", rate: 5.19, quantity: 20 },
      { name: "SWEAT", rate: 1.3, quantity: 5 },
    ];
  }

  try {
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) {
      return [];
    }

    return data
      .map((item) => ({
        name: normalizePrizeName(String(item.name || "")),
        rate: Number(item.rate),
        quantity:
          Number.isFinite(Number(item.quantity)) && Number(item.quantity) >= 0
            ? Math.floor(Number(item.quantity))
            : 100,
      }))
      .filter(
        (item) =>
          item.name &&
          Number.isFinite(item.rate) &&
          item.rate >= 0 &&
          item.rate <= 100 &&
          Number.isFinite(item.quantity) &&
          item.quantity >= 0,
      );
  } catch {
    return [];
  }
}

function loadWinners() {
  const raw = localStorage.getItem(WINNERS_STORAGE_KEY);
  if (!raw) return [];

  try {
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];

    return data
      .map((item) => ({
        email: normalizeEmail(String(item.email || "")),
        prize: normalizePrizeName(String(item.prize || "")),
        at: String(item.at || ""),
      }))
      .filter((item) => item.email && item.prize && item.at);
  } catch {
    return [];
  }
}

function saveWinners() {
  localStorage.setItem(WINNERS_STORAGE_KEY, JSON.stringify(winnerLog));
}

function registerWinner(email, prizeName) {
  winnerLog.push({
    email: normalizeEmail(email),
    prize: normalizePrizeName(prizeName),
    at: new Date().toISOString(),
  });
  saveWinners();
}

function clearWinners() {
  winnerLog = [];
  saveWinners();
}

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function loadParticipants() {
  const raw = localStorage.getItem(PLAYER_STORAGE_KEY);
  if (!raw) return {};

  try {
    const data = JSON.parse(raw);
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return {};
    }
    return data;
  } catch {
    return {};
  }
}

function saveParticipants() {
  localStorage.setItem(PLAYER_STORAGE_KEY, JSON.stringify(participantRegistry));
}

function getParticipantState(email) {
  const entry = participantRegistry[email];
  if (!entry || typeof entry !== "object") {
    return { email, playsUsed: 0, playedAt: null, result: null, prize: null };
  }
  const playsUsed = Number.isFinite(entry.playsUsed) ? Math.max(0, Math.floor(entry.playsUsed)) : 0;
  return {
    email,
    playsUsed,
    playedAt: entry.playedAt || null,
    result: entry.result || null,
    prize: entry.prize || null,
  };
}

function getRemainingCredits(email) {
  const { playsUsed } = getParticipantState(email);
  return Math.max(0, MAX_PLAYER_CREDITS - playsUsed);
}

function hasRemainingCredits(email) {
  return getRemainingCredits(email) > 0;
}

function consumeParticipantCredit(email, isWin, prizeName) {
  const state = getParticipantState(email);
  const nextPlaysUsed = Math.min(MAX_PLAYER_CREDITS, state.playsUsed + 1);
  participantRegistry[email] = {
    email,
    playsUsed: nextPlaysUsed,
    playedAt: new Date().toISOString(),
    result: isWin ? "win" : "lose",
    prize: isWin ? prizeName : null,
  };
  saveParticipants();
  return Math.max(0, MAX_PLAYER_CREDITS - nextPlaysUsed);
}

function savePrizes() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prizePool));
}

function seedAdminPrizesIfNeeded() {
  const appliedVersion = localStorage.getItem(PRIZE_PRESET_VERSION_KEY);
  if (appliedVersion === PRIZE_PRESET_VERSION) {
    return;
  }

  prizePool = EVENT_PRIZE_PRESET.map((item) => ({
    name: normalizePrizeName(item.name),
    rate: Number(item.rate),
    quantity: Math.max(0, Math.floor(Number(item.quantity))),
  }));
  savePrizes();
  localStorage.setItem(PRIZE_PRESET_VERSION_KEY, PRIZE_PRESET_VERSION);
}

function totalWinRate() {
  return prizePool.reduce((sum, p) => sum + p.rate, 0);
}

function getWonCountForPrize(prizeName) {
  return winnerLog.reduce((acc, row) => (row.prize === prizeName ? acc + 1 : acc), 0);
}

function renderPrizes() {
  dom.prizeTableBody.innerHTML = "";

  if (prizePool.length === 0) {
    const row = document.createElement("tr");
    row.innerHTML = '<td colspan="4">Aucun lot configuré</td>';
    dom.prizeTableBody.appendChild(row);
  }

  prizePool.forEach((prize) => {
    const row = document.createElement("tr");
    const lotCell = document.createElement("td");
    lotCell.textContent = `${getIconForLabel(prize.name)} ${prize.name}`;

    const rateCell = document.createElement("td");
    rateCell.textContent = `${prize.rate.toFixed(1)}%`;

    const stockCell = document.createElement("td");
    stockCell.textContent = `${prize.quantity} restants (${getWonCountForPrize(prize.name)} gagnés)`;

    const actionCell = document.createElement("td");
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.dataset.delete = prize.name;
    deleteButton.textContent = "Supprimer";
    actionCell.appendChild(deleteButton);

    row.append(lotCell, rateCell, stockCell, actionCell);
    dom.prizeTableBody.appendChild(row);
  });

  const total = totalWinRate();
  const state = total > 100 ? "depasse 100%" : "OK";
  const availableCount = prizePool.filter((p) => p.quantity > 0).length;
  dom.adminStats.textContent = `Total winrate: ${total.toFixed(1)}% (${state}) | Lots dispo: ${availableCount}/${prizePool.length} | Gagnants: ${winnerLog.length}`;
}

function renderWinners() {
  if (!dom.winnerTableBody) return;
  dom.winnerTableBody.innerHTML = "";

  if (winnerLog.length === 0) {
    const row = document.createElement("tr");
    row.innerHTML = '<td colspan="3">Aucun gagnant pour le moment</td>';
    dom.winnerTableBody.appendChild(row);
    return;
  }

  const sorted = [...winnerLog].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  sorted.forEach((win) => {
    const row = document.createElement("tr");
    const emailCell = document.createElement("td");
    emailCell.textContent = win.email;
    const prizeCell = document.createElement("td");
    prizeCell.textContent = `${getIconForLabel(win.prize)} ${win.prize}`;
    const dateCell = document.createElement("td");
    dateCell.textContent = new Date(win.at).toLocaleString("fr-FR");
    row.append(emailCell, prizeCell, dateCell);
    dom.winnerTableBody.appendChild(row);
  });
}

function exportWinnersCsv() {
  const headers = ["Email", "Lot gagne", "Date ISO", "Date locale FR"];
  const rows = winnerLog.map((win) => [
    win.email,
    win.prize,
    win.at,
    new Date(win.at).toLocaleString("fr-FR"),
  ]);

  const escapeCsv = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const csv = [headers, ...rows].map((row) => row.map(escapeCsv).join(";")).join("\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  a.href = url;
  a.download = `gagnants-yuri-neil-${stamp}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function getEffectivePrizePool() {
  const available = prizePool.filter((p) => p.quantity > 0);
  if (available.length === 0) return [];

  const unavailableRate = prizePool
    .filter((p) => p.quantity <= 0)
    .reduce((sum, p) => sum + p.rate, 0);
  const redistributedRate = unavailableRate / available.length;

  return available.map((p) => ({
    name: p.name,
    rate: p.rate + redistributedRate,
    quantity: p.quantity,
  }));
}

function consumePrizeStock(prizeName) {
  const prize = prizePool.find((p) => p.name === prizeName);
  if (!prize || prize.quantity <= 0) {
    return false;
  }
  prize.quantity -= 1;
  savePrizes();
  return true;
}

function setScreen(screen) {
  [dom.accessScreen, dom.adminScreen, dom.gameScreen, dom.terminalScreen].forEach((el) => {
    el.classList.remove("active");
    el.classList.add("hidden");
  });

  screen.classList.remove("hidden");
  screen.classList.add("active");
  document.body.classList.toggle("game-only", screen === dom.gameScreen || screen === dom.terminalScreen);
}

function createReels() {
  dom.reels.innerHTML = "";
  for (let i = 0; i < 3; i += 1) {
    const reel = document.createElement("div");
    reel.className = "reel";
    setReelContent(reel, FALLBACK_SYMBOLS[i].name);
    dom.reels.appendChild(reel);
  }
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getIconForLabel(label) {
  const text = label.toUpperCase();
  if (text.includes("GEO") || text.includes("HUBBLE")) return "🛰️";
  if (text.includes("CRO")) return "📈";
  if (text.includes("SEA") || text.includes("SMA")) return "📣";
  if (text.includes("TRACKING")) return "🧭";
  if (text.includes("INVITATION")) return "🎟️";
  if (text.includes("ATELIER") || text.includes("IA")) return "🤖";
  if (text.includes("STICKER")) return "🏷️";
  if (text.includes("CASQUETTE")) return "🧢";
  if (text.includes("SWEAT")) return "👕";
  if (text.includes("ALIEN")) return "👽";
  if (text.includes("ASTRO")) return "👨‍🚀";
  if (text.includes("UFO")) return "🛸";
  if (text.includes("CASQUE")) return "🪖";
  if (text.includes("PASS")) return "🎫";
  if (text.includes("GALAX")) return "🌌";
  if (text.includes("NOVA")) return "💥";
  if (text.includes("NEON")) return "✨";
  if (text.includes("COMET")) return "☄️";
  if (text.includes("ORBIT")) return "🪐";
  if (text.includes("PYRAMID")) return "🔺";
  if (text.includes("VOID")) return "🕳️";
  if (text.includes("QUASAR")) return "🌟";
  return "🛰️";
}

function setReelContent(reel, label) {
  reel.textContent = "";
  reel.style.setProperty("--reel-bg", `url("${createReelArtwork(label)}")`);
  const icon = document.createElement("span");
  icon.className = "reel-icon";
  icon.textContent = getIconForLabel(label);

  const text = document.createElement("span");
  text.className = "reel-label";
  text.textContent = label;

  reel.append(icon, text);
}

function createReelArtwork(label) {
  const code = Array.from(label).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const h1 = 262 + (code % 26);
  const h2 = 285 + ((code * 3) % 28);
  const h3 = 304 + ((code * 5) % 22);
  const cx = 16 + (code % 55);
  const cy = 10 + ((code * 2) % 35);
  const glowX = 58 + ((code * 7) % 35);
  const glowY = 14 + ((code * 3) % 36);
  const hillA = 132 + (code % 14);
  const hillB = 148 + ((code * 2) % 14);
  const starShift = code % 24;
  const svg = `
    <svg xmlns='http://www.w3.org/2000/svg' width='240' height='180' viewBox='0 0 240 180'>
      <defs>
        <linearGradient id='g1' x1='0%' y1='0%' x2='100%' y2='100%'>
          <stop offset='0%' stop-color='hsl(${h1}, 78%, 46%)' stop-opacity='0.98'/>
          <stop offset='52%' stop-color='hsl(${h2}, 82%, 40%)' stop-opacity='0.97'/>
          <stop offset='100%' stop-color='hsl(${h3}, 86%, 50%)' stop-opacity='0.98'/>
        </linearGradient>
        <radialGradient id='g2' cx='${glowX}%' cy='${glowY}%' r='76%'>
          <stop offset='0%' stop-color='#ff7bd2' stop-opacity='0.48'/>
          <stop offset='100%' stop-color='#ffffff' stop-opacity='0'/>
        </radialGradient>
        <radialGradient id='g3' cx='${cx}%' cy='${cy}%' r='62%'>
          <stop offset='0%' stop-color='#f3bcff' stop-opacity='0.35'/>
          <stop offset='100%' stop-color='#f3bcff' stop-opacity='0'/>
        </radialGradient>
      </defs>
      <rect width='240' height='180' fill='url(#g1)'/>
      <rect width='240' height='180' fill='url(#g2)'/>
      <rect width='240' height='180' fill='url(#g3)'/>
      <rect x='0' y='0' width='240' height='180' fill='url(#g2)' opacity='0.3'/>
      <circle cx='40' cy='38' r='2' fill='#ffffff' fill-opacity='0.8'/>
      <circle cx='95' cy='22' r='1.6' fill='#ffffff' fill-opacity='0.8'/>
      <circle cx='${194 + (starShift % 8)}' cy='44' r='2' fill='#ffd6ff' fill-opacity='0.8'/>
      <circle cx='176' cy='130' r='1.7' fill='#ffffff' fill-opacity='0.85'/>
      <circle cx='56' cy='132' r='${18 + (starShift % 14)}' fill='#ffffff' fill-opacity='0.14'/>
      <circle cx='186' cy='112' r='${26 + (starShift % 10)}' fill='#ffd6ff' fill-opacity='0.13'/>
      <circle cx='132' cy='150' r='42' fill='#ffe3ff' fill-opacity='0.11'/>
      <path d='M0 ${hillA} C44 122 82 142 118 154 C160 168 196 146 240 160 L240 180 L0 180 Z' fill='#fff' fill-opacity='0.17'/>
      <path d='M0 ${hillB} C52 148 92 164 138 170 C176 176 205 162 240 172 L240 180 L0 180 Z' fill='#ff8ed7' fill-opacity='0.16'/>
    </svg>
  `;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function showResultOverlay(message, type) {
  positionResultOverlay();
  if (type === "win") {
    const prizeName = normalizePrizeName(String(message || ""));
    const prizeEmoji = getIconForLabel(prizeName);
    dom.resultText.innerHTML =
      `<span class="win-title">YOU WIN</span>` +
      `<span class="win-prize">${prizeEmoji} ${prizeName}</span>`;
  } else {
    dom.resultText.textContent = message;
  }
  dom.resultOverlay.className = `result-overlay show ${type}`;
}

function hideResultOverlay() {
  dom.resultOverlay.className = "result-overlay";
  dom.resultText.textContent = "";
  dom.confettiLayer.innerHTML = "";
}

function positionResultOverlay() {
  if (!dom.resultOverlay) {
    return;
  }

  const target = dom.reels || dom.slotMachine;
  if (!target) {
    return;
  }

  const rect = target.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  dom.resultOverlay.style.setProperty("--overlay-center-x", `${centerX}px`);
  dom.resultOverlay.style.setProperty("--overlay-center-y", `${centerY}px`);
  dom.resultOverlay.style.setProperty("--overlay-width", `${Math.max(260, rect.width)}px`);
  dom.resultOverlay.style.setProperty("--overlay-height", `${Math.max(180, rect.height)}px`);
}

function initWinAudio() {
  if (winAudio) return;
  winAudio = new Audio(WIN_AUDIO_FILE);
  winAudio.preload = "auto";
  winAudio.volume = 0.6;
}

function playWinAudio() {
  if (!winAudio) {
    initWinAudio();
  }
  if (!winAudio) return;

  if (winAudioCutTimer) {
    clearTimeout(winAudioCutTimer);
    winAudioCutTimer = undefined;
    resumeBackgroundAudio();
  }

  suspendBackgroundAudio();
  winAudio.currentTime = 0;
  winAudio.play().catch(() => {});
  winAudioCutTimer = setTimeout(() => {
    winAudio.pause();
    winAudio.currentTime = 0;
    winAudioCutTimer = undefined;
    resumeBackgroundAudio();
  }, 7000);
}

function initLoseAudio() {
  if (loseAudio) return;
  loseAudio = new Audio(LOSE_AUDIO_FILE);
  loseAudio.preload = "auto";
  loseAudio.volume = 1;
}

function playLoseAudio() {
  if (!loseAudio) {
    initLoseAudio();
  }
  if (!loseAudio) return;

  if (leverAudio) {
    leverAudio.pause();
    leverAudio.currentTime = 0;
  }
  if (winAudio) {
    winAudio.pause();
    winAudio.currentTime = 0;
  }
  if (winAudioCutTimer) {
    clearTimeout(winAudioCutTimer);
    winAudioCutTimer = undefined;
  }

  suspendBackgroundAudio();
  if (loseAudioResumeTimer) {
    clearTimeout(loseAudioResumeTimer);
    loseAudioResumeTimer = undefined;
  }
  loseAudio.onended = () => {
    loseAudio.onended = null;
    if (loseAudioResumeTimer) {
      clearTimeout(loseAudioResumeTimer);
      loseAudioResumeTimer = undefined;
    }
    resumeBackgroundAudio();
  };

  loseAudio.muted = false;
  loseAudio.volume = 1;
  loseAudio.currentTime = 0;
  loseAudio.play().catch(() => {
    loseAudio.onended = null;
    resumeBackgroundAudio();
  });
  loseAudioResumeTimer = setTimeout(() => {
    loseAudioResumeTimer = undefined;
    loseAudio.onended = null;
    resumeBackgroundAudio();
  }, 8000);
}

function initLeverAudio() {
  if (leverAudio) return;
  leverAudio = new Audio(LEVER_AUDIO_FILE);
  leverAudio.preload = "auto";
  leverAudio.volume = 0.45;
}

function playLeverAudio() {
  if (!leverAudio) {
    initLeverAudio();
  }
  if (!leverAudio) return;
  leverAudio.currentTime = 0;
  leverAudio.play().catch(() => {});
}

function primeAudioElement(audio) {
  if (!audio || audio._primed) return;
  const previousMuted = audio.muted;
  const previousVolume = audio.volume;

  audio.muted = true;
  audio.volume = 0;
  audio.currentTime = 0;
  audio.play()
    .then(() => {
      audio.pause();
      audio.currentTime = 0;
      audio.muted = previousMuted;
      audio.volume = previousVolume;
      audio._primed = true;
    })
    .catch(() => {
      audio.muted = previousMuted;
      audio.volume = previousVolume;
    });
}

function primeActionSfx() {
  if (actionSfxPrimed) return;
  actionSfxPrimed = true;
  initLeverAudio();
  initLoseAudio();
  primeAudioElement(leverAudio);
  primeAudioElement(loseAudio);
}

function initBackgroundAudio() {
  if (backgroundAudio) return;
  backgroundAudio = new Audio(BACKGROUND_AUDIO_FILE);
  backgroundAudio.preload = "auto";
  backgroundAudio.loop = true;
  backgroundAudio.volume = 0.08;
}

function startBackgroundAudioOnce() {
  if (backgroundAudioStarted) return;
  backgroundAudioStarted = true;
  primeActionSfx();
  initBackgroundAudio();
  if (!backgroundAudio) return;
  backgroundAudio.play().catch(() => {
    backgroundAudioStarted = false;
  });
}

function suspendBackgroundAudio() {
  if (!backgroundAudio) {
    initBackgroundAudio();
  }
  if (!backgroundAudio) return;

  if (backgroundSuspendCount === 0) {
    shouldResumeBackgroundAfterSuspend = !backgroundAudio.paused;
  }
  backgroundSuspendCount += 1;
  backgroundAudio.pause();
}

function resumeBackgroundAudio() {
  if (backgroundSuspendCount > 0) {
    backgroundSuspendCount -= 1;
  }

  if (backgroundSuspendCount !== 0) {
    return;
  }
  if (!shouldResumeBackgroundAfterSuspend) {
    return;
  }
  if (!backgroundAudio) {
    return;
  }

  backgroundAudio.play().catch(() => {});
}

function pickMeteorPreset() {
  const available = meteorPresets.filter((preset) => preset.count < preset.maxCount);
  if (available.length === 0) return null;
  return available[Math.floor(Math.random() * available.length)];
}

function spawnMeteor() {
  const layer = document.querySelector(".meteor-layer");
  if (!layer) return;

  const preset = pickMeteorPreset();
  if (!preset) return;
  preset.count += 1;

  const meteor = document.createElement("span");
  meteor.className = "meteor";
  meteor.style.zIndex = String(2 + preset.zIndex);

  const size = preset.sizeMin + Math.random() * (preset.sizeMax - preset.sizeMin);
  meteor.style.width = `${size}px`;
  meteor.style.height = `${size * 0.42}px`;

  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // Start from random offscreen edge and move linearly across the viewport.
  const startEdge = Math.floor(Math.random() * 4);
  let startX = 0;
  let startY = 0;
  let endX = 0;
  let endY = 0;
  if (startEdge === 0) {
    startX = -size * 1.8;
    startY = Math.random() * vh;
    endX = vw + size * 1.8;
    endY = startY + (-0.35 + Math.random() * 0.7) * vh;
  } else if (startEdge === 1) {
    startX = vw + size * 1.8;
    startY = Math.random() * vh;
    endX = -size * 1.8;
    endY = startY + (-0.35 + Math.random() * 0.7) * vh;
  } else if (startEdge === 2) {
    startX = Math.random() * vw;
    startY = -size * 1.8;
    endX = startX + (-0.65 + Math.random() * 1.3) * vw;
    endY = vh + size * 1.8;
  } else {
    startX = Math.random() * vw;
    startY = vh + size * 1.8;
    endX = startX + (-0.65 + Math.random() * 1.3) * vw;
    endY = -size * 1.8;
  }

  const duration = preset.speedMin + Math.random() * (preset.speedMax - preset.speedMin);
  const velocityX = endX - startX;
  const velocityY = endY - startY;
  const velocityAngle = (Math.atan2(velocityY, velocityX) * 180) / Math.PI;
  // Align meteor head with travel direction.
  const visualAngle = velocityAngle - METEOR_FORWARD_OFFSET_DEG;
  const midX = startX + velocityX * 0.12;
  const midY = startY + velocityY * 0.12;
  const lateX = startX + velocityX * 0.9;
  const lateY = startY + velocityY * 0.9;

  layer.appendChild(meteor);
  const anim = meteor.animate(
    [
      {
        opacity: 0.92,
        transform: `translate3d(${startX}px, ${startY}px, 0) rotate(${visualAngle}deg)`,
      },
      {
        opacity: 0.92,
        transform: `translate3d(${midX}px, ${midY}px, 0) rotate(${visualAngle}deg)`,
      },
      {
        opacity: 0.9,
        transform: `translate3d(${lateX}px, ${lateY}px, 0) rotate(${visualAngle}deg)`,
      },
      {
        opacity: 0.88,
        transform: `translate3d(${endX}px, ${endY}px, 0) rotate(${visualAngle}deg)`,
      },
    ],
    { duration, easing: "linear" },
  );

  anim.onfinish = () => {
    meteor.remove();
    preset.count = Math.max(0, preset.count - 1);
  };
}

function scheduleMeteors() {
  spawnMeteor();
  // Constant flow with slight randomness to avoid visible batches.
  const next = 520 + Math.random() * 320;
  meteorTimer = window.setTimeout(scheduleMeteors, next);
}

function startMeteorShower() {
  if (meteorTimer) return;
  meteorTimer = window.setTimeout(scheduleMeteors, 420);
}

function triggerRealExplosions() {
  dom.confettiLayer.innerHTML = "";
  const center = getOverlayMessageCenter();
  // First blast starts behind the win message.
  spawnRealExplosion(center.left, center.top, 3.2, true);

  // Then 4 corner blasts from the machine corners, one every 700ms.
  const machineRect = (dom.slotMachine || dom.reels)?.getBoundingClientRect();
  const cornerBursts = machineRect
    ? [
        { left: `${machineRect.left + machineRect.width * 0.08}px`, top: `${machineRect.top + machineRect.height * 0.08}px` },
        { left: `${machineRect.right - machineRect.width * 0.08}px`, top: `${machineRect.top + machineRect.height * 0.08}px` },
        { left: `${machineRect.left + machineRect.width * 0.08}px`, top: `${machineRect.bottom - machineRect.height * 0.08}px` },
        { left: `${machineRect.right - machineRect.width * 0.08}px`, top: `${machineRect.bottom - machineRect.height * 0.08}px` },
      ]
    : [
        { left: "8%", top: "8%" },
        { left: "92%", top: "8%" },
        { left: "8%", top: "92%" },
        { left: "92%", top: "92%" },
      ];

  cornerBursts.forEach((corner, index) => {
    setTimeout(() => {
      spawnRealExplosion(corner.left, corner.top, 1.45, true);
    }, 700 * (index + 1));
  });
}

function spawnRealExplosion(left, top, power = 1, fullscreenSpread = false) {
  const firePalette = ["#ffe66b", "#ffd034", "#ff9b2f", "#ff5e1f", "#e73b12", "#bf240d"];
  const sparkCount = Math.round(140 * power);
  const viewportRadius = Math.hypot(window.innerWidth, window.innerHeight);
  const sparkRadius = fullscreenSpread ? viewportRadius * 0.78 : 280 * power;

  for (let i = 0; i < sparkCount; i += 1) {
    const spark = document.createElement("span");
    spark.className = "pixel-spark";
    spark.style.left = left;
    spark.style.top = top;
    spark.style.width = `${1 + Math.random() * 3}px`;
    spark.style.height = spark.style.width;
    spark.style.animationDuration = `${0.85 + Math.random() * 1.15}s`;
    spark.style.animationDelay = `${Math.random() * 0.12}s`;
    const sparkColor = firePalette[Math.floor(Math.random() * firePalette.length)];
    spark.style.backgroundColor = sparkColor;
    spark.style.color = sparkColor;

    const angle = Math.random() * Math.PI * 2;
    const distance = 55 + Math.random() * sparkRadius;
    spark.style.setProperty("--burst-x", `${Math.cos(angle) * distance}px`);
    spark.style.setProperty("--burst-y", `${Math.sin(angle) * distance}px`);
    dom.confettiLayer.appendChild(spark);
  }
}

function spawnPrizeEmojiConfetti(prizeName) {
  const emoji = getIconForLabel(prizeName);
  const count = 48;

  for (let i = 0; i < count; i += 1) {
    const confetti = document.createElement("span");
    confetti.className = "emoji-confetti";
    confetti.textContent = emoji;
    confetti.style.left = `${4 + Math.random() * 92}%`;
    confetti.style.top = `${-8 - Math.random() * 20}%`;
    confetti.style.setProperty("--fall-x", `${(-22 + Math.random() * 44).toFixed(1)}px`);
    confetti.style.animationDuration = `${2.2 + Math.random() * 2.2}s`;
    confetti.style.animationDelay = `${Math.random() * 0.35}s`;
    confetti.style.fontSize = `${1.1 + Math.random() * 0.9}rem`;
    dom.confettiLayer.appendChild(confetti);
  }
}

function getOverlayMessageCenter() {
  const messageRect = dom.resultText?.getBoundingClientRect();
  if (messageRect && messageRect.width > 0 && messageRect.height > 0) {
    return {
      left: `${messageRect.left + messageRect.width / 2}px`,
      top: `${messageRect.top + messageRect.height / 2}px`,
    };
  }

  return {
    left: getComputedStyle(dom.resultOverlay).getPropertyValue("--overlay-center-x").trim() || "50%",
    top: getComputedStyle(dom.resultOverlay).getPropertyValue("--overlay-center-y").trim() || "50%",
  };
}

function renderLivesHearts(remainingCredits) {
  if (!dom.livesHearts) return;
  dom.livesHearts.textContent = "";

  for (let i = 0; i < MAX_PLAYER_CREDITS; i += 1) {
    const heart = document.createElement("span");
    heart.className = `pixel-heart ${i < remainingCredits ? "full" : "empty"}`;
    heart.textContent = "♥";
    dom.livesHearts.appendChild(heart);
  }
}

function resetParticipantSession() {
  currentParticipantEmail = "";
  if (dom.participantLoginForm) {
    dom.participantLoginForm.classList.remove("hidden");
  }
  dom.participantLoginError.textContent = "";
  dom.participantEmail.value = "";
  renderLivesHearts(MAX_PLAYER_CREDITS);
}

function isAdminAccessUrl() {
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  const params = new URLSearchParams(window.location.search);
  return path.endsWith("/admin") || hash === "#admin" || params.get("admin") === "1";
}

function applyAccessModeFromUrl() {
  const adminMode = isAdminAccessUrl();
  if (adminMode) {
    dom.participantLoginForm.classList.add("hidden");
    dom.adminLoginForm.classList.remove("hidden");
    dom.adminLoginError.textContent = "";
    dom.adminPassword.value = "";
    dom.adminPassword.focus();
  } else {
    dom.participantLoginForm.classList.remove("hidden");
    dom.adminLoginForm.classList.add("hidden");
    dom.participantLoginError.textContent = "";
    dom.participantEmail.focus();
  }
}

function openAdminLogin() {
  hideResultOverlay();
  setScreen(dom.accessScreen);
  dom.participantLoginForm.classList.add("hidden");
  dom.adminLoginForm.classList.remove("hidden");
  dom.adminLoginError.textContent = "";
  dom.adminPassword.value = "";
  dom.adminPassword.focus();
}

function prepareWinTerminal(prizeName) {
  const icon = getIconForLabel(prizeName);
  const lines = [
    "> BOOT SEQUENCE ... OK",
    "> TERMINAL LINK ... STABLE",
    `> SIGNAL: BRAVO COMMANDER ${currentParticipantEmail.toUpperCase()}`,
    `> >>> LOT GAGNE: ${icon} ${prizeName} <<<`,
    "> TRANSMISSION ENVOYEE AU COMMANDANT",
    "> STATUT: EN ATTENTE DE CONFIRMATION",
    "> VOUS RECEVREZ BIENTOT LES DETAILS DE VOTRE GAIN",
  ];
  dom.terminalBody.textContent = lines.join("\n");
}

function syncTerminalToGamePosition() {
  if (!dom.gameScreen || !dom.terminalScreen) return;
  const rect = dom.gameScreen.getBoundingClientRect();
  const isValidRect = rect.width >= 120 && rect.height >= 120;

  if (isValidRect) {
    lastGameScreenRect = {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    };
  }

  const source = isValidRect ? rect : lastGameScreenRect;
  if (!source) {
    return;
  }

  const safeWidth = Math.max(MIN_TERMINAL_WIDTH_PX, source.width);
  const safeHeight = Math.max(MIN_TERMINAL_HEIGHT_PX, source.height);
  dom.terminalScreen.style.setProperty("--terminal-left", `${source.left}px`);
  dom.terminalScreen.style.setProperty("--terminal-top", `${source.top}px`);
  dom.terminalScreen.style.setProperty("--terminal-width", `${safeWidth}px`);
  dom.terminalScreen.style.setProperty("--terminal-height", `${safeHeight}px`);
}

function transitionToTerminalScreen() {
  if (!dom.gameScreen || !dom.terminalScreen) {
    setScreen(dom.terminalScreen);
    return;
  }

  // Mobile-first behavior: avoid fixed-position anchoring that can break responsive layout.
  if (window.matchMedia("(max-width: 700px)").matches) {
    dom.gameScreen.classList.remove("game-transition-out");
    dom.terminalScreen.classList.remove("terminal-transition-in", "is-visible");
    setScreen(dom.terminalScreen);
    return;
  }

  syncTerminalToGamePosition();
  dom.terminalScreen.classList.remove("hidden");
  dom.terminalScreen.classList.add("terminal-transition-in");
  dom.gameScreen.classList.add("game-transition-out");

  requestAnimationFrame(() => {
    dom.terminalScreen.classList.add("is-visible");
  });

  setTimeout(() => {
    dom.gameScreen.classList.remove("game-transition-out");
    dom.terminalScreen.classList.remove("terminal-transition-in", "is-visible");
    setScreen(dom.terminalScreen);
  }, TERMINAL_TRANSITION_DURATION_MS + 40);
}

function triggerWinCelebration(prizeName) {
  showResultOverlay(prizeName, "win");
  document.body.classList.add("win-explosion");
  playWinAudio();
  spawnPrizeEmojiConfetti(prizeName);
  triggerRealExplosions();
  setTimeout(() => {
    document.body.classList.remove("win-explosion");
    hideResultOverlay();
    prepareWinTerminal(prizeName);
    transitionToTerminalScreen();
  }, WIN_OVERLAY_DURATION_MS);
}

function triggerLoseAlarm() {
  playLoseAudio();
  showResultOverlay("PERDU", "lose");
  dom.alarmFlash.classList.add("active");
  setTimeout(() => dom.alarmFlash.classList.remove("active"), 360);
  setTimeout(hideResultOverlay, 5200);
}

function triggerNoCreditsAlarm() {
  playLoseAudio();
  showResultOverlay("VOUS N'AVEZ PLUS DE CREDIT", "lose");
  dom.alarmFlash.classList.add("active");
  setTimeout(() => dom.alarmFlash.classList.remove("active"), 360);
}

function weightedWin(prizes) {
  const total = prizes.reduce((acc, p) => acc + p.rate, 0);
  const roll = Math.random() * 100;

  if (roll >= total || total <= 0) {
    return null;
  }

  let cursor = 0;
  for (const prize of prizes) {
    cursor += prize.rate;
    if (roll < cursor) {
      return prize;
    }
  }
  return null;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runReelSpin(reel, symbolPool, finalLabel, rounds) {
  reel.classList.add("spinning");

  for (let i = 0; i < rounds; i += 1) {
    setReelContent(reel, pickRandom(symbolPool));
    await sleep(44 + i * 4.8);
  }

  reel.classList.remove("spinning");
  setReelContent(reel, finalLabel);
}

async function spinMachine() {
  if (spinning) {
    return;
  }

  if (!currentParticipantEmail) {
    dom.statusBanner.className = "status-banner lose";
    dom.statusBanner.textContent = "Renseigne ton email pour jouer";
    return;
  }

  if (!hasRemainingCredits(currentParticipantEmail)) {
    dom.statusBanner.className = "status-banner lose";
    dom.statusBanner.textContent = "Vous n'avez plus de credit";
    triggerNoCreditsAlarm();
    return;
  }

  spinning = true;
  hideResultOverlay();
  dom.lever.classList.add("pulled");
  dom.statusBanner.className = "status-banner";
  dom.statusBanner.textContent = "Transmission en cours...";
  dom.slotMachine.classList.remove("win-burst", "lose-burst");

  const reels = [...dom.reels.querySelectorAll(".reel")];
  reels.forEach((reel) => reel.classList.remove("win-hit"));

  const baseSymbols = FALLBACK_SYMBOLS.map((s) => s.name);
  const effectivePool = getEffectivePrizePool();
  const prizeSymbols = effectivePool.map((p) => p.name);
  const spinSymbols = [...new Set([...baseSymbols, ...prizeSymbols])];
  const finalSymbols = prizeSymbols.length > 0 ? prizeSymbols : baseSymbols;

  const forcedWinPrize = weightedWin(effectivePool);
  let outcome = [];

  if (forcedWinPrize) {
    outcome = [forcedWinPrize.name, forcedWinPrize.name, forcedWinPrize.name];
  } else {
    outcome = [pickRandom(finalSymbols), pickRandom(finalSymbols), pickRandom(finalSymbols)];
    if (outcome[0] === outcome[1] && outcome[1] === outcome[2]) {
      const alternatives = finalSymbols.filter((s) => s !== outcome[2]);
      outcome[2] = alternatives.length > 0 ? pickRandom(alternatives) : `${outcome[2]} X`;
    }
  }

  await Promise.all([
    runReelSpin(reels[0], spinSymbols, outcome[0], 14),
    runReelSpin(reels[1], spinSymbols, outcome[1], 21),
    runReelSpin(reels[2], spinSymbols, outcome[2], 28),
  ]);

  const isWin = outcome[0] === outcome[1] && outcome[1] === outcome[2];
  let resolvedWin = isWin;
  let stockAvailable = true;
  if (resolvedWin) {
    stockAvailable = consumePrizeStock(outcome[0]);
    if (!stockAvailable) {
      resolvedWin = false;
    }
  }

  const remainingCredits = consumeParticipantCredit(
    currentParticipantEmail,
    resolvedWin,
    resolvedWin ? outcome[0] : null,
  );
  renderLivesHearts(remainingCredits);

  if (resolvedWin) {
    registerWinner(currentParticipantEmail, outcome[0]);
    renderPrizes();
    renderWinners();
    reels.forEach((reel) => reel.classList.add("win-hit"));
    dom.statusBanner.textContent = `GAGNÉ - ${outcome[0]}`;
    dom.statusBanner.className = "status-banner win";
    dom.slotMachine.classList.add("win-burst");
    triggerWinCelebration(outcome[0]);
  } else {
    if (isWin && !stockAvailable) {
      dom.statusBanner.textContent = "PERDU - Lot indisponible";
    } else {
      dom.statusBanner.textContent =
        remainingCredits === 0 ? "Vous n'avez plus de credit" : "PERDU - Retente ta chance";
    }
    dom.statusBanner.className = "status-banner lose";
    dom.slotMachine.classList.add("lose-burst");
    if (remainingCredits === 0) {
      triggerNoCreditsAlarm();
    } else {
      triggerLoseAlarm();
    }
  }

  setTimeout(() => {
    dom.lever.classList.remove("pulled");
    dom.slotMachine.classList.remove("win-burst", "lose-burst");
    reels.forEach((reel) => reel.classList.remove("win-hit"));
  }, 860);
  spinning = false;
}

function setupEvents() {
  // Fallback for browsers that block autoplay at app launch.
  document.addEventListener("pointerdown", startBackgroundAudioOnce, { once: true });
  document.addEventListener("keydown", startBackgroundAudioOnce, { once: true });

  dom.participantLoginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const email = normalizeEmail(dom.participantEmail.value);

    if (!isValidEmail(email)) {
      dom.participantLoginError.textContent = "Email invalide";
      return;
    }

    const remainingCredits = getRemainingCredits(email);
    if (remainingCredits <= 0) {
      dom.participantLoginError.textContent = "Cet email n'a plus de credit.";
      return;
    }

    currentParticipantEmail = email;
    dom.participantLoginError.textContent = "";
    hideResultOverlay();
    startBackgroundAudioOnce();
    setScreen(dom.gameScreen);
    renderLivesHearts(remainingCredits);
    dom.statusBanner.className = "status-banner";
    dom.statusBanner.textContent = "Tire le levier pour lancer la machine";
  });

  dom.adminLoginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (dom.adminPassword.value === ADMIN_PASSWORD) {
      dom.adminLoginError.textContent = "";
      dom.adminPassword.value = "";
      setScreen(dom.adminScreen);
      return;
    }
    dom.adminLoginError.textContent = "Mot de passe incorrect";
  });

  if (dom.quickAdminBtn) {
    dom.quickAdminBtn.addEventListener("click", () => {
      openAdminLogin();
    });
  }

  dom.prizeForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = normalizePrizeName(dom.prizeName.value);
    const rate = Number(dom.prizeRate.value);
    const quantity = Math.floor(Number(dom.prizeQuantity.value));

    if (!name || !Number.isFinite(rate) || rate < 0 || rate > 100 || !Number.isFinite(quantity) || quantity < 0) {
      return;
    }

    const existing = prizePool.find((p) => p.name === name);
    if (existing) {
      existing.rate = rate;
      existing.quantity = quantity;
    } else {
      prizePool.push({ name, rate, quantity });
    }

    savePrizes();
    renderPrizes();
    renderWinners();
    dom.prizeForm.reset();
    dom.prizeName.focus();
  });

  dom.prizeTableBody.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const name = target.dataset.delete;
    if (!name) {
      return;
    }

    prizePool = prizePool.filter((p) => p.name !== name);
    savePrizes();
    renderPrizes();
    renderWinners();
  });

  dom.lever.addEventListener("click", () => {
    playLeverAudio();
    spinMachine();
  });

  if (dom.exportWinnersBtn) {
    dom.exportWinnersBtn.addEventListener("click", () => {
      exportWinnersCsv();
    });
  }

  if (dom.clearWinnersBtn) {
    dom.clearWinnersBtn.addEventListener("click", () => {
      const ok = window.confirm(
        "Confirmer la suppression de toute la base des gagnants ? Cette action est irreversible.",
      );
      if (!ok) return;
      clearWinners();
      renderPrizes();
      renderWinners();
    });
  }

  dom.backToHomeFromAdmin.addEventListener("click", () => {
    hideResultOverlay();
    dom.adminLoginForm.classList.add("hidden");
    resetParticipantSession();
    setScreen(dom.accessScreen);
    applyAccessModeFromUrl();
  });

  if (dom.backToHomeFromGame) {
    dom.backToHomeFromGame.addEventListener("click", () => {
      hideResultOverlay();
      dom.adminLoginForm.classList.add("hidden");
      resetParticipantSession();
      setScreen(dom.accessScreen);
      applyAccessModeFromUrl();
    });
  }

  if (dom.terminalBackToHome) {
    dom.terminalBackToHome.addEventListener("click", () => {
      resetParticipantSession();
      setScreen(dom.accessScreen);
      applyAccessModeFromUrl();
    });
  }
}

function init() {
  seedAdminPrizesIfNeeded();
  createReels();
  renderPrizes();
  renderWinners();
  renderLivesHearts(MAX_PLAYER_CREDITS);
  startBackgroundAudioOnce();
  setupEvents();
  applyAccessModeFromUrl();
  positionResultOverlay();
  window.addEventListener("resize", positionResultOverlay);
  window.addEventListener("resize", () => {
    if (dom.terminalScreen.classList.contains("terminal-transition-in")) {
      syncTerminalToGamePosition();
    }
  });
  startMeteorShower();
}

init();
