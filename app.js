const powerRange = document.querySelector("#powerRange");
const powerValue = document.querySelector("#powerValue");
const startGame = document.querySelector("#startGame");
const gameFeedback = document.querySelector("#gameFeedback");
const spaceStage = document.querySelector(".space-stage");
const orbitBar = document.querySelector("#orbitBar");
const orbitText = document.querySelector("#orbitText");
const energyText = document.querySelector("#energyText");
const filterButtons = document.querySelectorAll(".filter-chips button");
const recommendCards = document.querySelector("#knowledge-list");
const recommendTitle = document.querySelector("#recommend-title");
const authEntry = document.querySelector("#authEntry");
const authModal = document.querySelector("#authModal");
const authClose = document.querySelector("#authClose");
const switchToRegister = document.querySelector("#switchToRegister");
const switchToLogin = document.querySelector("#switchToLogin");
const loginForm = document.querySelector("#loginForm");
const registerForm = document.querySelector("#registerForm");
const authMessage = document.querySelector("#authMessage");
const profileAvatar = document.querySelector("#profileAvatar");
const profileGreeting = document.querySelector("#profileGreeting");
const profileGrade = document.querySelector("#profileGrade");
const profileInterests = document.querySelector("#profileInterests");
const profileStyles = document.querySelector("#profileStyles");
const profilePersonalization = document.querySelector("#profilePersonalization");
const profileLevel = document.querySelector("#profileLevel");
const profileXpBar = document.querySelector("#profileXpBar");
const profileXpText = document.querySelector("#profileXpText");
const contactForm = document.querySelector("#contactForm");
const contactMessage = document.querySelector("#contactMessage");
const activityList = document.querySelector("#activityList");
const pongCanvas = document.querySelector("#pongCanvas");
const pongStart = document.querySelector("#pongStart");
const pongReset = document.querySelector("#pongReset");
const pongPlayerScore = document.querySelector("#pongPlayerScore");
const pongAiScore = document.querySelector("#pongAiScore");
const pongHint = document.querySelector("#pongHint");
const penaltyField = document.querySelector("#penaltyField");
const penaltyBall = document.querySelector("#penaltyBall");
const keeper = document.querySelector("#keeper");
const penaltyGoals = document.querySelector("#penaltyGoals");
const penaltyShots = document.querySelector("#penaltyShots");
const penaltyHint = document.querySelector("#penaltyHint");
const penaltyReset = document.querySelector("#penaltyReset");
const shotButtons = document.querySelectorAll("[data-shot]");
let lessonCards = document.querySelectorAll(".lesson-card");
let latestLearningSummary = null;

const API_BASE_URL = "http://localhost:3001";
const AUTH_TOKEN_KEY = "aistar_auth_token";
const AUTH_USER_KEY = "aistar_auth_user";

const feedbackByPower = {
  low: "推力偏小：探测器会被恒星拉回去。试着增加一点速度。",
  stable: "轨道稳定：推力与引力接近平衡，适合收集能量点。",
  high: "推力偏大：探测器可能飞离轨道。真实航天也需要精确计算。"
};

const cardClasses = ["blue-card", "purple-card", "amber-card", "sky-card"];

function subjectLabel(subject) {
  const labels = {
    math: "数学",
    physics: "物理",
    chemistry: "化学",
    biology: "生物",
    information_tech: "信息科技",
    chinese_logic: "语文逻辑",
    english_tech_reading: "科技英语",
    science: "科学",
    ai: "AI 思维",
    general: "综合"
  };

  return labels[subject] || "推荐";
}

function difficultyText(difficulty) {
  const labels = {
    easy: "难度 ★☆☆☆☆",
    normal: "难度 ★★☆☆☆",
    hard: "难度 ★★★☆☆",
    advanced: "难度 ★★★★☆"
  };

  return labels[difficulty] || "适合继续探索";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function fetchJson(path) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: authHeaders()
  });

  if (!response.ok) {
    throw new Error(`API ${path} returned ${response.status}`);
  }

  return response.json();
}

function authHeaders(extra = {}) {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  return token ? { ...extra, Authorization: `Bearer ${token}` } : extra;
}

function setAuthMessage(message, type = "") {
  if (!authMessage) return;
  authMessage.className = `auth-message ${type}`;
  authMessage.textContent = message;
}

function openAuthModal(mode = "login") {
  if (!authModal) return;
  authModal.classList.add("open");
  authModal.setAttribute("aria-hidden", "false");
  switchAuthMode(mode);
}

function closeAuthModal() {
  if (!authModal) return;
  authModal.classList.remove("open");
  authModal.setAttribute("aria-hidden", "true");
}

function switchAuthMode(mode) {
  const isLogin = mode === "login";
  loginForm?.classList.toggle("hidden", !isLogin);
  registerForm?.classList.toggle("hidden", isLogin);
  const title = document.querySelector("#authTitle");
  if (title) {
    title.textContent = isLogin ? "登录星火科学馆" : "注册星火科学馆";
  }
  setAuthMessage("");
}

function saveAuth(user, token) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

function clearAuth() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
}

function getSavedAuthUser() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_USER_KEY) || "null");
  } catch {
    return null;
  }
}

function gradeLabel(grade) {
  const gradeNumber = Number(grade);
  const labels = {
    1: "小一",
    2: "小二",
    3: "小三",
    4: "小四",
    5: "小五",
    6: "小六",
    7: "初一",
    8: "初二",
    9: "初三",
    10: "高一",
    11: "高二",
    12: "高三"
  };

  return labels[gradeNumber] || "未设置";
}

function updateProfilePopover(user = null) {
  const nickname = user?.nickname || "星火少年";
  const firstChar = nickname.slice(0, 1) || "少";
  const summary = latestLearningSummary || {};
  const learned = Number(summary.mastered_knowledge_points || 0);
  const days = Number(summary.learning_days || 0);
  const streak = Number(summary.streak_days || 0);
  const badgeCount = Number(summary.badge_count || summary.badges?.length || 0);
  const level = Number(summary.level || Math.max(1, Math.floor((learned + days) / 3) + 1));
  const currentXp = Number(summary.current_xp || 0);
  const nextLevelXp = Number(summary.next_level_xp || 100);
  const xp = nextLevelXp ? Math.min(100, Math.round((currentXp / nextLevelXp) * 100)) : 0;

  if (profileAvatar) profileAvatar.textContent = firstChar;
  if (profileGreeting) profileGreeting.textContent = `你好，${nickname}！`;
  if (profileLevel) profileLevel.textContent = user ? `Lv.${level}` : "Lv.0";
  if (profileXpBar) profileXpBar.style.width = `${user ? Math.max(8, xp) : 0}%`;
  if (profileXpText) profileXpText.textContent = user
    ? `${learned} 个知识点 · ${badgeCount} 枚徽章 · 连续 ${streak} 天 · 累计 ${days} 天`
    : "登录后生成学习天数、徽章和知识点记录";
  if (profileGrade) profileGrade.textContent = user?.grade ? gradeLabel(user.grade) : "登录后生成";
  if (profileInterests) profileInterests.textContent = "物理 · AI · 太空 · 游戏";
  if (profileStyles) profileStyles.textContent = "视觉型 · 逻辑型";
  if (profilePersonalization) {
    profilePersonalization.textContent = user
      ? "基于注册年级、兴趣与学习进度生成，后续会持续更新标签"
      : "登录后根据注册资料和学习行为生成";
  }
}

function renderLoggedOut() {
  if (authEntry) authEntry.innerHTML = `<span class="icon-user"></span>登录`;
  updateProfilePopover(null);
}

function renderLoggedIn(user) {
  const nickname = user?.nickname || "星火少年";
  const firstChar = escapeHtml(nickname.slice(0, 1) || "少");
  if (authEntry) authEntry.innerHTML = `<span class="user-initial">${firstChar}</span><span class="auth-name">${escapeHtml(nickname)}</span><span class="auth-caret">退出</span>`;
  updateProfilePopover(user);
}

function setBackendStatus(status, message) {
  let badge = document.querySelector(".backend-status");

  if (!badge && recommendTitle) {
    badge = document.createElement("span");
    badge.className = "backend-status";
    recommendTitle.insertAdjacentElement("afterend", badge);
  }

  if (!badge) return;

  badge.className = `backend-status ${status}`;
  badge.textContent = message;
}

function renderRecommendationCards(items) {
  if (!recommendCards || !items.length) return;

  recommendCards.innerHTML = items
    .slice(0, 4)
    .map((item, index) => {
      const title = escapeHtml(item.title || item.name || "推荐内容");
      const summary = escapeHtml(item.summary || item.description || item.plain_explanation || "继续探索这个主题。");
      const subject = escapeHtml(subjectLabel(item.subject) || item.category || "推荐");
      const difficulty = escapeHtml(difficultyText(item.difficulty));
      const cardClass = cardClasses[index % cardClasses.length];
      const href = escapeHtml(item.href || "./knowledge.html");
      const contentId = item.id ? ` data-content-id="${escapeHtml(item.id)}"` : "";

      return `<article class="lesson-card ${cardClass}"${contentId}>
        <div>
          <span>${subject}</span>
          <h3>${title}</h3>
          <p>${summary}</p>
        </div>
        <div class="card-visual ${index % 2 === 0 ? "chart-visual" : "laptop-visual"}"></div>
        <footer>
          <small>${difficulty}</small>
          <span class="card-actions">
            ${item.id ? '<button class="favorite-card" type="button" aria-label="收藏内容">收藏</button>' : ""}
            <a class="card-button" href="${href}">去查看</a>
          </span>
        </footer>
      </article>`;
    })
    .join("");

  lessonCards = document.querySelectorAll(".lesson-card");
}

async function recordContentAction(contentId, actionType = "click") {
  if (!contentId || !localStorage.getItem(AUTH_TOKEN_KEY)) return;

  try {
    await fetch(`${API_BASE_URL}/api/contents/${contentId}/actions`, {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ action_type: actionType })
    });
  } catch (error) {
    console.warn("Content action record failed.", error);
  }
}

async function favoriteContent(contentId, button) {
  if (!contentId) return;

  if (!localStorage.getItem(AUTH_TOKEN_KEY)) {
    openAuthModal("login");
    return;
  }

  try {
    button.disabled = true;
    const response = await fetch(`${API_BASE_URL}/api/contents/${contentId}/favorite`, {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" })
    });
    if (!response.ok) throw new Error("favorite_failed");
    button.textContent = "已收藏";
    await refreshUserActivity();
  } catch (error) {
    console.warn("Favorite failed.", error);
    button.textContent = "重试";
  } finally {
    button.disabled = false;
  }
}

function activityTypeLabel(type) {
  const labels = {
    knowledge: "知识",
    ai_book: "AI",
    game: "游戏",
    content_action: "浏览"
  };

  return labels[type] || "学习";
}

function formatActivityDate(value) {
  if (!value) return "刚刚";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "刚刚";
  return date.toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" });
}

function renderActivitySummary(activity) {
  if (!activityList) return;

  const continueItems = activity?.continue_learning || [];
  const recentItems = activity?.recent_learning || [];
  const favorites = activity?.favorites || [];
  const items = [...continueItems, ...recentItems].slice(0, 4);

  if (!items.length && !favorites.length) {
    activityList.innerHTML = `<article class="activity-item">
      <span>AI</span>
      <div>
        <h3>还没有学习记录</h3>
        <p>读一章 AI 学习、完成一个知识点或玩一局小游戏后，这里会自动更新。</p>
      </div>
    </article>`;
    return;
  }

  activityList.innerHTML = items.map((item) => {
    const progress = Number(item.progress_percent || 0);
    const progressText = progress ? ` · ${progress}%` : "";
    const href = escapeHtml(item.href || "./knowledge.html");

    return `<a class="activity-item" href="${href}">
      <span>${escapeHtml(activityTypeLabel(item.type))}</span>
      <div>
        <h3>${escapeHtml(item.title || "继续学习")}</h3>
        <p>${escapeHtml(item.summary || "继续探索这个内容。")}</p>
        <small>${formatActivityDate(item.occurred_at)}${progressText}</small>
      </div>
    </a>`;
  }).join("");
}

function updateFeaturedGame(game) {
  const gameTitle = document.querySelector("#game-title");
  const gameSubtitle = document.querySelector(".olympic-hero-game .game-topbar small");
  const mission = document.querySelector(".mission");

  if (gameTitle) {
    gameTitle.textContent = "Kevin's Olympic Games";
  }

  if (gameSubtitle) {
    gameSubtitle.textContent = "乒乓球冠军赛";
  }

  if (mission && game?.description) {
    mission.textContent = `任务：${game.description}`;
  }
}

async function connectBackend() {
  try {
    const [health, homeSummary] = await Promise.all([
      fetchJson("/health"),
      fetchJson("/api/home/summary")
    ]);

    const data = homeSummary.data || {};
    latestLearningSummary = data.learning_summary || null;

    renderRecommendationCards(data.recommendation_cards || []);
    renderFrontierSummary(data.frontier_summary || []);
    updateFeaturedGame(data.featured_game);
    updateProfilePopover(getSavedAuthUser());

    const mode = homeSummary.mode === "demo" ? "demo" : "live";
    setBackendStatus(mode, mode === "demo" ? "后端已连接 · Demo 数据" : `后端已连接 · ${health.service}`);
  } catch (error) {
    console.warn("Backend connection failed, using static fallback.", error);
    setBackendStatus("offline", "后端未连接 · 静态内容");
  }
}

function renderFrontierSummary(items) {
  const newsRow = document.querySelector(".frontier-box .news-row");
  if (!newsRow || !items.length) return;

  const classes = ["ai-news", "robot-news", "space-news"];
  newsRow.innerHTML = items
    .slice(0, 3)
    .map((item, index) => `<article class="news-card ${classes[index % classes.length]}">
      <span>${escapeHtml(frontierCategoryLabel(item.category))}</span>
      <h3>${escapeHtml(item.title || "今日前沿")}</h3>
      <p>关联课内知识：${escapeHtml(item.related_knowledge || "科学素养")}</p>
    </article>`)
    .join("");
}

function frontierCategoryLabel(category) {
  const labels = {
    ai: "AI 前沿",
    robotics: "机器人",
    robot: "机器人",
    space: "太空",
    opensource: "开源项目",
    science: "科学"
  };

  return labels[category] || "今日前沿";
}

async function refreshCurrentUser() {
  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    headers: authHeaders()
  });

  const payload = await response.json();
  if (payload.data) {
    renderLoggedIn(payload.data);
    return;
  }

  const savedUser = getSavedAuthUser();
  if (savedUser) {
    renderLoggedIn(savedUser);
    return;
  }

  renderLoggedOut();
}

async function refreshGrowthSummary() {
  if (!localStorage.getItem(AUTH_TOKEN_KEY)) return;

  try {
    const payload = await fetchJson("/api/users/me/growth");
    latestLearningSummary = payload.data || latestLearningSummary;
    updateProfilePopover(getSavedAuthUser());
  } catch (error) {
    console.warn("Growth summary refresh failed.", error);
  }
}

async function refreshUserActivity() {
  if (!localStorage.getItem(AUTH_TOKEN_KEY)) {
    renderActivitySummary(null);
    return;
  }

  try {
    const payload = await fetchJson("/api/users/me/activity");
    renderActivitySummary(payload.data || null);
  } catch (error) {
    console.warn("Activity refresh failed.", error);
  }
}

async function handleLogin(event) {
  event.preventDefault();
  const formData = new FormData(loginForm);
  const payload = {
    account: String(formData.get("account") || "").trim(),
    password: String(formData.get("password") || "")
  };

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "登录失败");

    saveAuth(result.data.user, result.data.token);
    renderLoggedIn(result.data.user);
    await refreshGrowthSummary();
    await refreshUserActivity();
    setAuthMessage("登录成功", "success");
    closeAuthModal();
  } catch (error) {
    setAuthMessage(error.message || "登录失败", "error");
  }
}

async function handleRegister(event) {
  event.preventDefault();
  const formData = new FormData(registerForm);
  const grade = String(formData.get("grade") || "");
  const payload = {
    nickname: String(formData.get("nickname") || "").trim(),
    email: String(formData.get("email") || "").trim(),
    phone: String(formData.get("phone") || "").trim(),
    password: String(formData.get("password") || ""),
    school_stage: String(formData.get("school_stage") || ""),
    grade: grade ? Number(grade) : undefined
  };

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "注册失败");

    saveAuth(result.data.user, result.data.token);
    renderLoggedIn(result.data.user);
    await refreshGrowthSummary();
    await refreshUserActivity();
    setAuthMessage("注册成功", "success");
    closeAuthModal();
  } catch (error) {
    setAuthMessage(error.message || "注册失败", "error");
  }
}

async function logout() {
  try {
    await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" })
    });
  } finally {
    clearAuth();
    renderLoggedOut();
    renderActivitySummary(null);
  }
}

function updateOrbitPreview(power) {
  if (!powerValue || !orbitText || !orbitBar || !energyText) return;
  const stability = Math.max(34, 100 - Math.abs(power - 6) * 14);
  const energy = power >= 4 && power <= 7 ? "3/3" : "2/3";
  powerValue.textContent = power;
  orbitText.textContent = `${stability}%`;
  orbitBar.style.width = `${stability}%`;
  energyText.textContent = energy;
}

function setupPongGame() {
  if (!pongCanvas) return;

  const context = pongCanvas.getContext("2d");
  if (!context) return;

  const state = {
    running: false,
    playerScore: 0,
    aiScore: 0,
    playerY: 118,
    aiY: 118,
    ballX: 280,
    ballY: 150,
    ballSpeedX: 4,
    ballSpeedY: 2.4,
    keys: new Set()
  };
  const paddleWidth = 10;
  const paddleHeight = 64;
  const ballSize = 10;

  const syncScore = () => {
    if (pongPlayerScore) pongPlayerScore.textContent = String(state.playerScore);
    if (pongAiScore) pongAiScore.textContent = String(state.aiScore);
  };

  const resetBall = (direction = 1) => {
    state.ballX = pongCanvas.width / 2;
    state.ballY = pongCanvas.height / 2;
    state.ballSpeedX = 4 * direction;
    state.ballSpeedY = (Math.random() > 0.5 ? 1 : -1) * 2.4;
  };

  const drawCourt = () => {
    context.clearRect(0, 0, pongCanvas.width, pongCanvas.height);
    context.fillStyle = "#071327";
    context.fillRect(0, 0, pongCanvas.width, pongCanvas.height);
    context.strokeStyle = "rgba(255, 255, 255, 0.22)";
    context.setLineDash([8, 10]);
    context.beginPath();
    context.moveTo(pongCanvas.width / 2, 18);
    context.lineTo(pongCanvas.width / 2, pongCanvas.height - 18);
    context.stroke();
    context.setLineDash([]);
  };

  function draw() {
    drawCourt();
    context.fillStyle = "#62d5ff";
    context.fillRect(22, state.playerY, paddleWidth, paddleHeight);
    context.fillStyle = "#ffd25a";
    context.fillRect(pongCanvas.width - 32, state.aiY, paddleWidth, paddleHeight);
    context.fillStyle = "#ffffff";
    context.beginPath();
    context.arc(state.ballX, state.ballY, ballSize, 0, Math.PI * 2);
    context.fill();
  }

  const resetGame = () => {
    state.running = false;
    state.playerScore = 0;
    state.aiScore = 0;
    state.playerY = 118;
    state.aiY = 118;
    resetBall(Math.random() > 0.5 ? 1 : -1);
    if (pongStart) pongStart.textContent = "开始";
    if (pongHint) pongHint.textContent = "移动鼠标或使用 ↑ ↓ 控制左侧球拍，先到 5 分获胜。";
    syncScore();
    draw();
  };

  const finishIfNeeded = () => {
    if (state.playerScore < 5 && state.aiScore < 5) return;
    state.running = false;
    if (pongStart) pongStart.textContent = "再来一局";
    if (pongHint) {
      pongHint.textContent = state.playerScore > state.aiScore
        ? "你赢了！反应很稳。"
        : "电脑赢了，试着提前预判球的方向。";
    }
  };

  const update = () => {
    if (state.keys.has("ArrowUp")) state.playerY -= 6;
    if (state.keys.has("ArrowDown")) state.playerY += 6;
    state.playerY = Math.max(12, Math.min(pongCanvas.height - paddleHeight - 12, state.playerY));

    const aiTarget = state.ballY - paddleHeight / 2;
    state.aiY += (aiTarget - state.aiY) * 0.075;
    state.aiY = Math.max(12, Math.min(pongCanvas.height - paddleHeight - 12, state.aiY));

    state.ballX += state.ballSpeedX;
    state.ballY += state.ballSpeedY;

    if (state.ballY <= ballSize || state.ballY >= pongCanvas.height - ballSize) {
      state.ballSpeedY *= -1;
    }

    const hitsPlayer =
      state.ballX - ballSize <= 32 &&
      state.ballY >= state.playerY &&
      state.ballY <= state.playerY + paddleHeight;
    const hitsAi =
      state.ballX + ballSize >= pongCanvas.width - 32 &&
      state.ballY >= state.aiY &&
      state.ballY <= state.aiY + paddleHeight;

    if (hitsPlayer) {
      state.ballSpeedX = Math.abs(state.ballSpeedX) + 0.18;
      state.ballSpeedY += (state.ballY - (state.playerY + paddleHeight / 2)) * 0.055;
    }

    if (hitsAi) {
      state.ballSpeedX = -Math.abs(state.ballSpeedX) - 0.14;
      state.ballSpeedY += (state.ballY - (state.aiY + paddleHeight / 2)) * 0.04;
    }

    if (state.ballX < -20) {
      state.aiScore += 1;
      syncScore();
      resetBall(1);
    }

    if (state.ballX > pongCanvas.width + 20) {
      state.playerScore += 1;
      syncScore();
      resetBall(-1);
    }

    finishIfNeeded();
  };

  const loop = () => {
    if (state.running) update();
    draw();
    requestAnimationFrame(loop);
  };

  pongCanvas.addEventListener("mousemove", (event) => {
    const rect = pongCanvas.getBoundingClientRect();
    const ratio = pongCanvas.height / rect.height;
    state.playerY = (event.clientY - rect.top) * ratio - paddleHeight / 2;
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      state.keys.add(event.key);
    }
  });

  window.addEventListener("keyup", (event) => {
    state.keys.delete(event.key);
  });

  pongStart?.addEventListener("click", () => {
    if (state.playerScore >= 5 || state.aiScore >= 5) resetGame();
    state.running = !state.running;
    pongStart.textContent = state.running ? "暂停" : "继续";
    if (pongHint) pongHint.textContent = state.running ? "盯住球的反弹角度，提前移动球拍。" : "已暂停。";
  });

  pongReset?.addEventListener("click", resetGame);
  resetGame();
  requestAnimationFrame(loop);
}

function setupPenaltyGame() {
  if (!penaltyField || !penaltyBall || !keeper) return;

  const state = {
    goals: 0,
    shotsLeft: 5,
    locked: false
  };
  const zones = ["left", "center", "right"];
  const labels = {
    left: "左路",
    center: "中路",
    right: "右路"
  };

  const syncPenaltyScore = () => {
    if (penaltyGoals) penaltyGoals.textContent = String(state.goals);
    if (penaltyShots) penaltyShots.textContent = String(state.shotsLeft);
  };

  const resetPenalty = () => {
    state.goals = 0;
    state.shotsLeft = 5;
    state.locked = false;
    keeper.dataset.save = "center";
    penaltyBall.dataset.shot = "";
    penaltyField.dataset.result = "";
    if (penaltyHint) penaltyHint.textContent = "选择方向射门，守门员会随机扑救。5 球看你能进几个。";
    shotButtons.forEach((button) => {
      button.disabled = false;
    });
    syncPenaltyScore();
  };

  const shootPenalty = (shot) => {
    if (state.locked || state.shotsLeft <= 0) return;
    state.locked = true;
    const save = zones[Math.floor(Math.random() * zones.length)];
    const scored = shot !== save;

    keeper.dataset.save = save;
    penaltyBall.dataset.shot = shot;
    penaltyField.dataset.result = scored ? "goal" : "saved";

    state.shotsLeft -= 1;
    if (scored) state.goals += 1;
    syncPenaltyScore();

    if (penaltyHint) {
      penaltyHint.textContent = scored
        ? `进球！你射向${labels[shot]}，守门员扑向${labels[save]}。`
        : `被扑出。你射向${labels[shot]}，守门员也猜中了${labels[save]}。`;
    }

    window.setTimeout(() => {
      if (state.shotsLeft <= 0) {
        if (penaltyHint) penaltyHint.textContent = `挑战结束：5 球进 ${state.goals} 球。`;
        shotButtons.forEach((button) => {
          button.disabled = true;
        });
      } else {
        state.locked = false;
        penaltyBall.dataset.shot = "";
        penaltyField.dataset.result = "";
      }
    }, 850);
  };

  shotButtons.forEach((button) => {
    button.addEventListener("click", () => shootPenalty(button.dataset.shot || "center"));
  });
  penaltyReset?.addEventListener("click", resetPenalty);
  resetPenalty();
}

powerRange?.addEventListener("input", () => {
  updateOrbitPreview(Number(powerRange.value));
});

authEntry?.addEventListener("click", async () => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (token) {
    await logout();
    return;
  }

  openAuthModal("login");
});

authClose?.addEventListener("click", closeAuthModal);
authModal?.addEventListener("click", (event) => {
  if (event.target === authModal) closeAuthModal();
});
switchToRegister?.addEventListener("click", () => switchAuthMode("register"));
switchToLogin?.addEventListener("click", () => switchAuthMode("login"));
loginForm?.addEventListener("submit", handleLogin);
registerForm?.addEventListener("submit", handleRegister);
recommendCards?.addEventListener("click", (event) => {
  const favoriteButton = event.target.closest(".favorite-card");
  if (favoriteButton) {
    const card = favoriteButton.closest(".lesson-card");
    favoriteContent(card?.dataset.contentId, favoriteButton);
    return;
  }

  const link = event.target.closest(".card-button");
  if (link) {
    const card = link.closest(".lesson-card");
    recordContentAction(card?.dataset.contentId, "click");
  }
});
contactForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!contactMessage) return;

  const formData = new FormData(contactForm);
  const name = String(formData.get("name") || "").trim();
  const contact = String(formData.get("contact") || "").trim();
  const message = String(formData.get("message") || "").trim();

  if (!contact || !message) {
    contactMessage.textContent = "请至少留下联系方式和想说的话。";
    contactMessage.className = "contact-message error";
    return;
  }

  submitContactMessage({ name, contact, message });
});

async function submitContactMessage(payload) {
  if (!contactMessage || !contactForm) return;

  try {
    contactMessage.textContent = "正在发送留言...";
    contactMessage.className = "contact-message";

    const response = await fetch(`${API_BASE_URL}/api/contact-messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await response.json();

    if (!response.ok) throw new Error(result.message || "留言保存失败");

    contactMessage.textContent = `${payload.name || "朋友"}，留言已保存，我会尽快查看。`;
    contactMessage.className = "contact-message success";
    contactForm.reset();
  } catch (error) {
    contactMessage.textContent = error.message || "留言发送失败，请先通过邮箱联系我。";
    contactMessage.className = "contact-message error";
  }
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    filterButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");

    lessonCards.forEach((card, index) => {
      card.animate(
        [
          { transform: "translateY(8px)", opacity: 0.65 },
          { transform: "translateY(0)", opacity: 1 }
        ],
        {
          duration: 240 + index * 45,
          easing: "ease-out"
        }
      );
    });
  });
});

updateOrbitPreview(Number(powerRange?.value || 6));
setupPongGame();
setupPenaltyGame();
connectBackend();
refreshCurrentUser();
refreshUserActivity();
