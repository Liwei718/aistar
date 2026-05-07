const ADMIN_API_BASE_URL = "http://localhost:3001";
const ADMIN_TOKEN_KEY = "aistar_admin_token";
const ADMIN_USER_KEY = "aistar_admin_user";

const adminStatus = document.querySelector("#adminStatus");
const adminMetrics = document.querySelector("#adminMetrics");
const contentTypes = document.querySelector("#contentTypes");
const topContents = document.querySelector("#topContents");
const recentActions = document.querySelector("#recentActions");
const recentGames = document.querySelector("#recentGames");
const reviewQueue = document.querySelector("#reviewQueue");
const adminLoginCard = document.querySelector("#adminLoginCard");
const adminDashboard = document.querySelector("#adminDashboard");
const adminLoginForm = document.querySelector("#adminLoginForm");
const adminLoginMessage = document.querySelector("#adminLoginMessage");
const adminLogout = document.querySelector("#adminLogout");

function adminAuthHeaders(extra = {}) {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY);
  return token ? { ...extra, Authorization: `Bearer ${token}` } : extra;
}

function setAdminLoginMessage(message, type = "") {
  if (!adminLoginMessage) return;
  adminLoginMessage.className = `admin-login-message ${type}`;
  adminLoginMessage.textContent = message;
}

function showAdminLogin() {
  adminLoginCard?.classList.remove("hidden");
  adminDashboard?.classList.add("hidden");
  adminLogout?.classList.add("hidden");
}

function showAdminDashboard(admin) {
  adminLoginCard?.classList.add("hidden");
  adminDashboard?.classList.remove("hidden");
  adminLogout?.classList.remove("hidden");
  if (adminStatus) adminStatus.textContent = admin?.name ? `${admin.name} 已登录` : "管理员已登录";
}

function escapeAdminHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatNumber(value) {
  return new Intl.NumberFormat("zh-CN").format(Number(value || 0));
}

function formatAdminDate(value) {
  if (!value) return "暂无时间";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "暂无时间";
  return date.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function contentTypeLabel(type) {
  const labels = {
    frontier_news: "今日前沿",
    knowledge_article: "知识文章",
    ai_problem: "AI 学习",
    scientist: "科学人物",
    open_source_intro: "开源项目",
    game_intro: "小游戏",
    learning_path_node: "学习路径"
  };

  return labels[type] || type || "内容";
}

function renderMetricCards(metrics) {
  if (!adminMetrics) return;

  const cards = [
    ["活跃用户", metrics.total_users],
    ["7 日新增", metrics.new_users_7d],
    ["发布内容", metrics.published_contents],
    ["知识点", metrics.knowledge_points],
    ["完成学习", metrics.completed_progress],
    ["游戏完成", metrics.game_completions],
    ["收藏", metrics.favorites],
    ["推荐点击", metrics.content_clicks],
    ["待审核", metrics.pending_reviews],
    ["AI 草稿", metrics.generated_drafts]
  ];

  adminMetrics.innerHTML = cards.map(([label, value]) => `
    <article class="admin-metric-card">
      <span>${escapeAdminHtml(label)}</span>
      <strong>${formatNumber(value)}</strong>
    </article>
  `).join("");
}

function renderList(target, items, emptyText, renderItem) {
  if (!target) return;
  target.innerHTML = items.length
    ? items.map(renderItem).join("")
    : `<div class="admin-empty">${escapeAdminHtml(emptyText)}</div>`;
}

function renderDashboard(data) {
  renderMetricCards(data.metrics || {});

  renderList(contentTypes, data.content_types || [], "暂无内容结构数据", (item) => `
    <div class="admin-list-row">
      <b>${escapeAdminHtml(contentTypeLabel(item.content_type))}</b>
      <span>${formatNumber(item.count)} 条</span>
    </div>
  `);

  renderList(topContents, data.top_contents || [], "暂无热门内容", (item) => `
    <div class="admin-list-row">
      <div>
        <b>${escapeAdminHtml(item.title)}</b>
        <small>${escapeAdminHtml(contentTypeLabel(item.content_type))}</small>
      </div>
      <span>${formatNumber(item.favorite_count)} / ${formatNumber(item.view_count)}</span>
    </div>
  `);

  renderList(recentActions, data.recent_actions || [], "暂无最近点击", (item) => `
    <div class="admin-list-row">
      <div>
        <b>${escapeAdminHtml(item.content?.title || "内容")}</b>
        <small>${escapeAdminHtml(item.user?.nickname || "用户")} · ${formatAdminDate(item.created_at)}</small>
      </div>
      <span>${escapeAdminHtml(item.action_type)}</span>
    </div>
  `);

  renderList(recentGames, data.recent_games || [], "暂无小游戏成绩", (item) => `
    <div class="admin-list-row">
      <div>
        <b>${escapeAdminHtml(item.game?.name || "小游戏")}</b>
        <small>${escapeAdminHtml(item.user?.nickname || "用户")} · ${formatAdminDate(item.completed_at)}</small>
      </div>
      <span>${formatNumber(item.score)}${item.max_score ? `/${formatNumber(item.max_score)}` : ""}</span>
    </div>
  `);

  renderList(reviewQueue, data.review_queue || [], "暂无待审核任务", (item) => `
    <div class="admin-list-row">
      <div>
        <b>${escapeAdminHtml(item.title)}</b>
        <small>${escapeAdminHtml(item.target_type)} · ${formatAdminDate(item.submitted_at)}</small>
      </div>
      <span>P${formatNumber(item.priority)}</span>
    </div>
  `);
}

async function loadAdminDashboard() {
  try {
    const response = await fetch(`${ADMIN_API_BASE_URL}/api/admin/dashboard`, {
      headers: adminAuthHeaders()
    });
    if (response.status === 401) {
      localStorage.removeItem(ADMIN_TOKEN_KEY);
      localStorage.removeItem(ADMIN_USER_KEY);
      showAdminLogin();
      return;
    }
    if (!response.ok) throw new Error("dashboard_unavailable");
    const payload = await response.json();
    renderDashboard(payload.data || {});
    if (adminStatus) {
      const admin = JSON.parse(localStorage.getItem(ADMIN_USER_KEY) || "null");
      adminStatus.textContent = payload.mode === "demo" ? "Demo 数据" : `${admin?.name || "管理员"} 已登录`;
    }
  } catch (error) {
    console.warn("Admin dashboard failed.", error);
    if (adminStatus) adminStatus.textContent = "后端未连接";
    renderDashboard({
      metrics: {},
      content_types: [],
      top_contents: [],
      recent_actions: [],
      recent_games: [],
      review_queue: []
    });
  }
}

async function refreshAdmin() {
  if (!localStorage.getItem(ADMIN_TOKEN_KEY)) {
    showAdminLogin();
    return;
  }

  try {
    const response = await fetch(`${ADMIN_API_BASE_URL}/api/admin/auth/me`, {
      headers: adminAuthHeaders()
    });
    const payload = await response.json();
    if (!payload.data) {
      showAdminLogin();
      return;
    }

    localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(payload.data));
    showAdminDashboard(payload.data);
    await loadAdminDashboard();
  } catch (error) {
    console.warn("Admin auth refresh failed.", error);
    showAdminLogin();
  }
}

adminLoginForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(adminLoginForm);
  const payload = {
    email: String(formData.get("email") || "").trim(),
    password: String(formData.get("password") || "")
  };

  try {
    setAdminLoginMessage("正在登录后台...");
    const response = await fetch(`${ADMIN_API_BASE_URL}/api/admin/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "登录失败");

    localStorage.setItem(ADMIN_TOKEN_KEY, result.data.token);
    localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(result.data.admin));
    showAdminDashboard(result.data.admin);
    setAdminLoginMessage("登录成功", "success");
    await loadAdminDashboard();
  } catch (error) {
    setAdminLoginMessage(error.message || "登录失败", "error");
  }
});

adminLogout?.addEventListener("click", async () => {
  try {
    await fetch(`${ADMIN_API_BASE_URL}/api/admin/auth/logout`, {
      method: "POST",
      headers: adminAuthHeaders()
    });
  } finally {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_USER_KEY);
    showAdminLogin();
  }
});

refreshAdmin();
