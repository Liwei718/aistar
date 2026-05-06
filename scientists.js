const API_BASE_URL = "http://localhost:3001";
const scientistFilterButtons = document.querySelectorAll("[data-scientist-filter]");
const scientistGrid = document.querySelector(".scientist-grid");
let activeScientistFilter = "all";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function fetchJson(path) {
  const response = await fetch(`${API_BASE_URL}${path}`);
  if (!response.ok) throw new Error(`API ${path} returned ${response.status}`);
  return response.json();
}

function renderScientistCard(scientist, index) {
  const leadClass = index === 0 ? "lead" : "";
  const contribution = scientist.contribution_summary || scientist.contributions?.join("、") || "重要科学贡献";
  const knowledge = scientist.knowledge?.join("、") || "科学素养";

  return `<a class="scientist-card ${leadClass}" href="${escapeHtml(scientist.href)}" data-scientist-category="${escapeHtml(scientist.category)}">
    <div class="scientist-card-head">
      <div class="scientist-avatar">
        <b aria-hidden="true">${escapeHtml(scientist.avatar_text || scientist.name?.slice(0, 1) || "科")}</b>
        ${scientist.photo_url ? `<img src="${escapeHtml(scientist.photo_url)}" alt="${escapeHtml(scientist.name)}头像" loading="lazy" onerror="this.hidden=true" />` : ""}
      </div>
      <span>${escapeHtml(scientist.category_label)}</span>
    </div>
    <h2>${escapeHtml(index === 0 ? scientist.title : scientist.name)}</h2>
    <p>${escapeHtml(scientist.summary || scientist.story || "")}</p>
    ${index === 0 ? `<dl>
      <div><dt>核心贡献</dt><dd>${escapeHtml(contribution)}</dd></div>
      <div><dt>关联知识</dt><dd>${escapeHtml(knowledge)}</dd></div>
    </dl>` : `<small>关联知识：${escapeHtml(knowledge)}</small>`}
  </a>`;
}

function applyScientistFilter(filter) {
  activeScientistFilter = filter;
  document.querySelectorAll("[data-scientist-category]").forEach((card) => {
    const shouldShow = filter === "all" || card.dataset.scientistCategory === filter;
    card.classList.toggle("is-hidden", !shouldShow);
  });
}

async function loadScientists() {
  try {
    const payload = await fetchJson("/api/scientists?limit=40");
    const scientists = payload.data || [];
    if (!scientists.length || !scientistGrid) return;

    scientistGrid.innerHTML = scientists.map(renderScientistCard).join("");
    applyScientistFilter(activeScientistFilter);
  } catch (error) {
    console.warn("Scientist data failed, using static fallback.", error);
  }
}

scientistFilterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.scientistFilter || "all";
    scientistFilterButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    applyScientistFilter(filter);
  });
});

loadScientists();
