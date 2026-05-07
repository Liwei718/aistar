const ADMIN_API_BASE_URL = "http://localhost:3001";

const adminStatus = document.querySelector("#adminStatus");
const adminMetrics = document.querySelector("#adminMetrics");
const contentTypes = document.querySelector("#contentTypes");
const topContents = document.querySelector("#topContents");
const recentActions = document.querySelector("#recentActions");
const recentGames = document.querySelector("#recentGames");
const reviewQueue = document.querySelector("#reviewQueue");

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
    const response = await fetch(`${ADMIN_API_BASE_URL}/api/admin/dashboard`);
    if (!response.ok) throw new Error("dashboard_unavailable");
    const payload = await response.json();
    renderDashboard(payload.data || {});
    if (adminStatus) adminStatus.textContent = payload.mode === "demo" ? "Demo 数据" : "后端已连接";
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

loadAdminDashboard();
