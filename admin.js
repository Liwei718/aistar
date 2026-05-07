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
const adminContentList = document.querySelector("#adminContentList");
const adminContentMessage = document.querySelector("#adminContentMessage");
const contentStatusFilter = document.querySelector("#contentStatusFilter");
const reloadContents = document.querySelector("#reloadContents");
const adminJobGrid = document.querySelector("#adminJobGrid");
const adminJobRuns = document.querySelector("#adminJobRuns");
const reloadJobs = document.querySelector("#reloadJobs");

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

function statusLabel(status) {
  const labels = {
    draft: "草稿",
    pending_review: "待审核",
    published: "已发布",
    offline: "已下线",
    rejected: "已拒绝"
  };

  return labels[status] || status || "未知";
}

function jobStatusLabel(status) {
  const labels = {
    running: "运行中",
    success: "成功",
    failed: "失败"
  };

  return labels[status] || status || "未运行";
}

function setAdminContentMessage(message, type = "") {
  if (!adminContentMessage) return;
  adminContentMessage.className = `admin-content-message ${type}`;
  adminContentMessage.textContent = message;
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
    <div class="admin-list-row admin-review-row" data-review-id="${escapeAdminHtml(item.id)}">
      <div>
        <b>${escapeAdminHtml(item.title)}</b>
        <small>${escapeAdminHtml(item.target_type)} · ${formatAdminDate(item.submitted_at)}</small>
      </div>
      <span>P${formatNumber(item.priority)}</span>
      <div class="admin-review-actions">
        <button type="button" data-review-decision="approve">通过</button>
        <button type="button" data-review-decision="return">退回</button>
      </div>
    </div>
  `);
}

function renderAdminContents(items) {
  if (!adminContentList) return;

  if (!items.length) {
    adminContentList.innerHTML = '<div class="admin-empty">暂无内容。</div>';
    return;
  }

  adminContentList.innerHTML = items.map((item) => `
    <form class="admin-content-row" data-content-id="${escapeAdminHtml(item.id)}">
      <div class="admin-content-meta">
        <b>${escapeAdminHtml(contentTypeLabel(item.content_type))}</b>
        <span>${escapeAdminHtml(statusLabel(item.status))}</span>
        <small>${formatNumber(item.favorite_count)} 收藏 · ${formatNumber(item.view_count)} 浏览</small>
      </div>
      <label>
        <span>标题</span>
        <input name="title" value="${escapeAdminHtml(item.title)}" maxlength="200" required />
      </label>
      <label>
        <span>摘要</span>
        <textarea name="summary" rows="2" maxlength="1000">${escapeAdminHtml(item.summary || "")}</textarea>
      </label>
      <label>
        <span>状态</span>
        <select name="status">
          ${["draft", "pending_review", "published", "offline", "rejected"].map((status) => `
            <option value="${status}" ${item.status === status ? "selected" : ""}>${statusLabel(status)}</option>
          `).join("")}
        </select>
      </label>
      <button type="submit">保存</button>
    </form>
  `).join("");
}

async function loadAdminContents() {
  if (!adminContentList) return;

  try {
    const status = contentStatusFilter?.value || "all";
    adminContentList.innerHTML = '<div class="admin-empty">正在读取内容...</div>';
    const response = await fetch(`${ADMIN_API_BASE_URL}/api/admin/contents?status=${encodeURIComponent(status)}&limit=20`, {
      headers: adminAuthHeaders()
    });
    if (response.status === 401) {
      showAdminLogin();
      return;
    }
    if (!response.ok) throw new Error("contents_unavailable");
    const payload = await response.json();
    renderAdminContents(payload.data || []);
  } catch (error) {
    console.warn("Admin contents failed.", error);
    adminContentList.innerHTML = '<div class="admin-empty">内容列表读取失败，请确认后端已启动。</div>';
  }
}

async function updateAdminContent(form) {
  const contentId = form.dataset.contentId;
  if (!contentId) return;

  const formData = new FormData(form);
  const payload = {
    title: String(formData.get("title") || "").trim(),
    summary: String(formData.get("summary") || "").trim(),
    status: String(formData.get("status") || "")
  };

  try {
    setAdminContentMessage("正在保存内容...");
    const response = await fetch(`${ADMIN_API_BASE_URL}/api/admin/contents/${contentId}`, {
      method: "PATCH",
      headers: adminAuthHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "保存失败");
    setAdminContentMessage("内容已保存。", "success");
    await Promise.all([loadAdminContents(), loadAdminDashboard()]);
  } catch (error) {
    setAdminContentMessage(error.message || "保存失败", "error");
  }
}

function renderAdminJobs(payload) {
  if (adminJobGrid) {
    const jobs = payload?.jobs || [];
    adminJobGrid.innerHTML = jobs.length
      ? jobs.map((job) => `
        <article class="admin-job-card">
          <div>
            <b>${escapeAdminHtml(job.title)}</b>
            <p>${escapeAdminHtml(job.description)}</p>
            <small>${escapeAdminHtml(job.cadence)} · ${escapeAdminHtml(jobStatusLabel(job.last_run?.status))}</small>
          </div>
          <button type="button" data-job-run="${escapeAdminHtml(job.job_name)}">运行</button>
        </article>
      `).join("")
      : '<div class="admin-empty">暂无自动化任务。</div>';
  }

  if (adminJobRuns) {
    const runs = payload?.recent_runs || [];
    renderList(adminJobRuns, runs, "暂无运行记录", (run) => `
      <div class="admin-list-row">
        <div>
          <b>${escapeAdminHtml(run.job_name)}</b>
          <small>${formatAdminDate(run.started_at)} · ${escapeAdminHtml(run.message || "无消息")}</small>
        </div>
        <span>${escapeAdminHtml(jobStatusLabel(run.status))}</span>
      </div>
    `);
  }
}

async function loadAdminJobs() {
  if (!adminJobGrid && !adminJobRuns) return;

  try {
    if (adminJobGrid) adminJobGrid.innerHTML = '<div class="admin-empty">正在读取任务...</div>';
    const response = await fetch(`${ADMIN_API_BASE_URL}/api/admin/jobs`, {
      headers: adminAuthHeaders()
    });
    if (response.status === 401) {
      showAdminLogin();
      return;
    }
    if (!response.ok) throw new Error("jobs_unavailable");
    const payload = await response.json();
    renderAdminJobs(payload.data || {});
  } catch (error) {
    console.warn("Admin jobs failed.", error);
    if (adminJobGrid) adminJobGrid.innerHTML = '<div class="admin-empty">任务读取失败，请确认后端已启动。</div>';
  }
}

async function runAdminJob(jobName) {
  if (!jobName) return;

  try {
    if (adminStatus) adminStatus.textContent = "正在运行后台任务";
    const response = await fetch(`${ADMIN_API_BASE_URL}/api/admin/jobs/${encodeURIComponent(jobName)}/run`, {
      method: "POST",
      headers: adminAuthHeaders({ "Content-Type": "application/json" })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "任务运行失败");
    await Promise.all([loadAdminJobs(), loadAdminDashboard()]);
  } catch (error) {
    if (adminStatus) adminStatus.textContent = error.message || "任务运行失败";
  }
}

async function decideReviewTask(reviewId, decision) {
  if (!reviewId || !decision) return;

  try {
    if (adminStatus) adminStatus.textContent = "正在处理审核任务";
    const response = await fetch(`${ADMIN_API_BASE_URL}/api/admin/review-tasks/${reviewId}/decision`, {
      method: "POST",
      headers: adminAuthHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({
        decision,
        comment: decision === "approve" ? "后台审核通过" : "后台退回修改"
      })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "审核处理失败");
    await Promise.all([loadAdminDashboard(), loadAdminContents(), loadAdminJobs()]);
  } catch (error) {
    if (adminStatus) adminStatus.textContent = error.message || "审核处理失败";
  }
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
    await Promise.all([loadAdminDashboard(), loadAdminContents(), loadAdminJobs()]);
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
    await Promise.all([loadAdminDashboard(), loadAdminContents()]);
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

adminContentList?.addEventListener("submit", (event) => {
  event.preventDefault();
  updateAdminContent(event.target);
});

reviewQueue?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-review-decision]");
  if (!button) return;
  const row = button.closest("[data-review-id]");
  decideReviewTask(row?.dataset.reviewId, button.dataset.reviewDecision);
});

contentStatusFilter?.addEventListener("change", loadAdminContents);
reloadContents?.addEventListener("click", loadAdminContents);
reloadJobs?.addEventListener("click", loadAdminJobs);
adminJobGrid?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-job-run]");
  if (!button) return;
  runAdminJob(button.dataset.jobRun);
});

refreshAdmin();
