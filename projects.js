const API_BASE_URL = "http://localhost:3001";
const projectFilterButtons = document.querySelectorAll("[data-project-filter]");
const projectTopList = document.querySelector(".project-top-list");
const historyForm = document.querySelector(".history-form");

let currentProjectItems = [];

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
    ai: "AI 工具",
    game: "小游戏",
    science: "科学模拟",
    beginner: "适合初学者"
  };

  return labels[category] || "开源项目";
}

function compactNumber(value) {
  const number = Number(value || 0);
  if (number >= 10000) return `${(number / 1000).toFixed(1)}k`;
  if (number >= 1000) return `${(number / 1000).toFixed(1)}k`;
  return String(number);
}

async function fetchJson(path) {
  const response = await fetch(`${API_BASE_URL}${path}`);
  if (!response.ok) throw new Error(`API ${path} returned ${response.status}`);
  return response.json();
}

function renderProjects(items) {
  if (!projectTopList || !items.length) return;

  currentProjectItems = items;
  projectTopList.innerHTML = items
    .map((item, index) => `<article class="project-card ${index === 0 ? "lead" : ""}" data-project-category="${escapeHtml(item.category)}">
      <strong>${String(item.rank_no || index + 1).padStart(2, "0")}</strong>
      <span>${escapeHtml(categoryLabel(item.category))} · ${compactNumber(item.stars)} Stars</span>
      <h2>${escapeHtml(item.name)}</h2>
      <p>${escapeHtml(item.description || item.learning_value || "适合继续探索的开源项目。")}</p>
      <dl>
        <div><dt>主要语言</dt><dd>${escapeHtml(item.language || "未标注")}</dd></div>
        <div><dt>适合改造</dt><dd>${escapeHtml(item.remix_ideas || item.reason || "从 README 和示例任务开始改造。")}</dd></div>
      </dl>
      <a class="project-repo-link" href="${escapeHtml(item.repo_url)}" target="_blank" rel="noreferrer">查看仓库</a>
    </article>`)
    .join("");
}

function applyProjectFilter(filter) {
  const cards = document.querySelectorAll("[data-project-category]");
  cards.forEach((card) => {
    const shouldShow = filter === "all" || card.dataset.projectCategory === filter;
    card.classList.toggle("is-hidden", !shouldShow);
  });
}

function renderHistoryOptions(rankings) {
  if (!historyForm || !rankings.length) return;
  const weekSelect = historyForm.querySelector("select[name='ranking']");
  if (!weekSelect) return;

  weekSelect.innerHTML = rankings
    .map((ranking) => `<option value="${escapeHtml(ranking.id)}">${escapeHtml(ranking.name)}</option>`)
    .join("");
}

async function loadProjects() {
  try {
    const [currentPayload, historyPayload] = await Promise.all([
      fetchJson("/api/projects/rankings/current"),
      fetchJson("/api/projects/rankings?limit=12")
    ]);

    renderProjects(currentPayload.data?.items || []);
    renderHistoryOptions(historyPayload.data || []);

    const activeFilter = document.querySelector("[data-project-filter].active")?.dataset.projectFilter || "all";
    applyProjectFilter(activeFilter);
  } catch (error) {
    console.warn("Project ranking data failed, using static fallback.", error);
  }
}

projectFilterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.projectFilter || "all";
    projectFilterButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    applyProjectFilter(filter);
  });
});

historyForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(historyForm);
  const category = String(formData.get("category") || "all");
  const payload = await fetchJson(`/api/projects/rankings?category=${encodeURIComponent(category)}&limit=1`);
  const ranking = payload.data?.[0];
  if (ranking?.items?.length) {
    renderProjects(ranking.items);
    applyProjectFilter(category);
  }
});

loadProjects();
