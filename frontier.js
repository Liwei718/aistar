const API_BASE_URL = "http://localhost:3001";
const frontierFilterButtons = document.querySelectorAll("[data-frontier-filter]");
const frontierLead = document.querySelector(".frontier-lead");
const frontierList = document.querySelector(".frontier-list");
const todayNewsGrid = document.querySelector(".frontier-news-grid");

let frontierItems = [];

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function categoryLabel(category) {
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

async function fetchJson(path) {
  const response = await fetch(`${API_BASE_URL}${path}`);
  if (!response.ok) throw new Error(`API ${path} returned ${response.status}`);
  return response.json();
}

function renderTodayNews(items) {
  if (!todayNewsGrid || !items.length) return;

  todayNewsGrid.innerHTML = items
    .slice(0, 3)
    .map((item) => `<article>
      <span>${escapeHtml(categoryLabel(item.category))}</span>
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.summary || item.why_it_matters || "今天值得关注的新变化。")}</p>
    </article>`)
    .join("");
}

function renderLead(item) {
  if (!frontierLead || !item) return;

  frontierLead.dataset.frontierCategory = item.category;
  frontierLead.innerHTML = `<span>${escapeHtml(categoryLabel(item.category))} · 青少年摘要</span>
    <h2>${escapeHtml(item.title)}</h2>
    <p>${escapeHtml(item.summary || item.body || "")}</p>
    <dl>
      <div><dt>关联知识</dt><dd>${escapeHtml(item.related_knowledge || "科学素养")}</dd></div>
      <div><dt>适合年级</dt><dd>${escapeHtml(item.grade_band || "小学高年级到初中")}</dd></div>
      <div><dt>来源</dt><dd>${item.source_url ? `<a href="${escapeHtml(item.source_url)}" target="_blank" rel="noreferrer">${escapeHtml(item.source_name || "查看原文")}</a>` : escapeHtml(item.source_name || "人工审核后发布")}</dd></div>
    </dl>`;
}

function renderFrontierList(items) {
  if (!frontierList) return;

  frontierList.innerHTML = items
    .slice(1)
    .map((item) => `<article class="frontier-item" data-frontier-category="${escapeHtml(item.category)}">
      <span>${escapeHtml(categoryLabel(item.category))}</span>
      <h2>${escapeHtml(item.title)}</h2>
      <p>${escapeHtml(item.summary || "继续探索这条前沿消息。")}</p>
      <small>关联课内知识：${escapeHtml(item.related_knowledge || "科学素养")}</small>
    </article>`)
    .join("");
}

function applyFrontierFilter(filter) {
  const items = document.querySelectorAll("[data-frontier-category]");
  items.forEach((item) => {
    const shouldShow = filter === "all" || item.dataset.frontierCategory === filter;
    item.classList.toggle("is-hidden", !shouldShow);
  });
}

async function loadFrontier() {
  try {
    const [itemsPayload, todayPayload] = await Promise.all([
      fetchJson("/api/frontier/items?limit=20"),
      fetchJson("/api/frontier/today-news")
    ]);

    frontierItems = itemsPayload.data || [];
    if (!frontierItems.length) return;

    renderLead(frontierItems[0]);
    renderFrontierList(frontierItems);
    renderTodayNews(todayPayload.data || frontierItems);

    const activeFilter = document.querySelector("[data-frontier-filter].active")?.dataset.frontierFilter || "all";
    applyFrontierFilter(activeFilter);
  } catch (error) {
    console.warn("Frontier data failed, using static fallback.", error);
  }
}

frontierFilterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.frontierFilter || "all";
    frontierFilterButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    applyFrontierFilter(filter);
  });
});

loadFrontier();
