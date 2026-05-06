const API_BASE_URL = "http://localhost:3001";
const AUTH_TOKEN_KEY = "aistar_auth_token";

const knowledgeFilterButtons = document.querySelectorAll("[data-knowledge-filter]");
const stageButtons = document.querySelectorAll(".knowledge-stage-bar button");
const knowledgeMap = document.querySelector("#knowledge-map");
const detailMeta = document.querySelector("#knowledgeDetailMeta");
const detailTitle = document.querySelector("#knowledgeDetailTitle");
const detailSummary = document.querySelector("#knowledgeDetailSummary");
const detailTextbook = document.querySelector("#knowledgeTextbook");
const detailMinutes = document.querySelector("#knowledgeMinutes");
const detailDifficulty = document.querySelector("#knowledgeDifficulty");
const detailSteps = document.querySelector("#knowledgeSteps");
const detailTasks = document.querySelector("#knowledgeTasks");
const detailMistakes = document.querySelector("#knowledgeMisunderstandings");
const completeButton = document.querySelector("#completeKnowledge");
const progressHint = document.querySelector("#knowledgeProgressHint");
const videoTitle = document.querySelector("#knowledgeVideoTitle");
const videoText = document.querySelector("#knowledgeVideoText");
const videoList = document.querySelector("#knowledgeVideoList");
const videoLink = document.querySelector("#knowledgeVideoLink");

let knowledgeItems = [];
let activeKnowledge = null;
let activeFilter = "all";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function authHeaders(extra = {}) {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  return token ? { ...extra, Authorization: `Bearer ${token}` } : extra;
}

async function fetchJson(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      ...authHeaders()
    }
  });

  if (!response.ok) throw new Error(`API ${path} returned ${response.status}`);
  return response.json();
}

function subjectLabel(subject) {
  const labels = {
    math: "数学",
    science: "科学",
    physics: "物理",
    ai: "AI",
    general: "综合"
  };
  return labels[subject] || "知识";
}

function stageLabel(stage, grade) {
  if (stage === "primary") return `小学${grade || ""}年级`;
  if (stage === "middle") return `初中${grade === 7 ? "一年级" : `${grade || ""}年级`}`;
  return "通用";
}

function difficultyLabel(difficulty) {
  const labels = {
    easy: "入门",
    normal: "基础重点",
    hard: "进阶",
    advanced: "挑战"
  };
  return labels[difficulty] || "基础重点";
}

function gradeFilter(point) {
  if (point.grade === 6) return "g6";
  if (point.grade === 7) return "g7";
  return "bridge";
}

function ageFilter(point) {
  return point.age_group || (point.grade && point.grade <= 6 ? "age-10-12" : "age-12-13");
}

function renderKnowledgeCards(items) {
  if (!knowledgeMap || !items.length) return;

  knowledgeMap.innerHTML = items
    .map((item, index) => {
      const isLead = index === 0 || item.grade !== items[index - 1]?.grade;
      return `<article class="knowledge-block ${isLead ? "lead" : ""}" data-knowledge-card data-slug="${escapeHtml(item.slug)}" data-age="${escapeHtml(ageFilter(item))} age-bridge" data-grade="${escapeHtml(gradeFilter(item))}" data-subject="${escapeHtml(item.subject)}">
        <span>${escapeHtml(stageLabel(item.school_stage, item.grade))} · ${escapeHtml(subjectLabel(item.subject))} · ${escapeHtml(item.textbook)}</span>
        <h2>${escapeHtml(item.name)}</h2>
        <p>${escapeHtml(item.plain_explanation || item.curriculum_concept || "点击查看详情、视频和任务。")}</p>
        <small>${escapeHtml(difficultyLabel(item.difficulty))} · ${escapeHtml(item.recommended_minutes || 12)} 分钟</small>
      </article>`;
    })
    .join("");

  knowledgeMap.querySelectorAll("[data-knowledge-card]").forEach((card) => {
    card.addEventListener("click", () => {
      loadKnowledgeDetail(card.dataset.slug || "");
    });
  });

  applyKnowledgeFilter(activeFilter);
}

function renderList(target, values, fallback) {
  if (!target) return;
  const items = values?.length ? values : [fallback];
  target.innerHTML = items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
}

function renderVideo(detail) {
  const video = detail.video || {};
  if (videoTitle) videoTitle.textContent = video.title || `${detail.name} 讲解视频`;
  if (videoText) {
    videoText.textContent = `${detail.name} · ${video.duration || "约 3 分钟"}。先看直观讲解，再完成下面的任务。`;
  }
  if (videoLink) {
    videoLink.href = video.url || "./knowledge.html";
    videoLink.textContent = video.url ? "打开视频 →" : "暂无视频 →";
  }
  if (videoList) {
    renderList(videoList, [
      `教材：${detail.textbook || "待补充"}`,
      `主题：${detail.curriculum_concept || detail.name}`,
      `任务：${detail.tasks?.[0] || "完成一个小练习"}`
    ], "暂无视频任务");
  }
}

function renderDetail(detail) {
  activeKnowledge = detail;
  if (detailMeta) detailMeta.textContent = `${stageLabel(detail.school_stage, detail.grade)} · ${subjectLabel(detail.subject)}`;
  if (detailTitle) detailTitle.textContent = detail.name;
  if (detailSummary) detailSummary.textContent = detail.plain_explanation || "这个知识点还在整理中。";
  if (detailTextbook) detailTextbook.textContent = detail.textbook || "待补充";
  if (detailMinutes) detailMinutes.textContent = `${detail.recommended_minutes || 12} 分钟`;
  if (detailDifficulty) detailDifficulty.textContent = difficultyLabel(detail.difficulty);
  renderList(detailSteps, detail.diagram_steps, "先读解释，再做任务。");
  renderList(detailTasks, detail.tasks, "用自己的话复述这个知识点。");
  renderList(detailMistakes, detail.common_misunderstandings, "暂无常见误区。");
  renderVideo(detail);
  if (completeButton) completeButton.disabled = false;
  if (progressHint) progressHint.textContent = localStorage.getItem(AUTH_TOKEN_KEY)
    ? "完成学习后可以保存进度。"
    : "登录后可保存知识点进度。";

  document.querySelectorAll("[data-knowledge-card]").forEach((card) => {
    card.classList.toggle("is-active", card.dataset.slug === detail.slug);
  });
}

async function loadKnowledgeDetail(slug) {
  if (!slug) return;

  try {
    const payload = await fetchJson(`/api/knowledge-points/${encodeURIComponent(slug)}`);
    renderDetail(payload.data);
  } catch (error) {
    console.warn("Knowledge detail failed.", error);
  }
}

function applyKnowledgeFilter(filter) {
  activeFilter = filter;
  const blocks = document.querySelectorAll(".knowledge-block");
  blocks.forEach((block) => {
    const ageGroups = (block.dataset.age || "").split(" ");
    const shouldShow =
      filter === "all" ||
      ageGroups.includes(filter) ||
      block.dataset.grade === filter ||
      block.dataset.subject === filter;
    block.classList.toggle("is-hidden", !shouldShow);
  });
}

async function completeKnowledge() {
  if (!activeKnowledge) return;
  if (!localStorage.getItem(AUTH_TOKEN_KEY)) {
    if (progressHint) progressHint.textContent = "请先登录，再保存学习进度。";
    return;
  }

  try {
    const payload = await fetchJson(`/api/knowledge-points/${encodeURIComponent(activeKnowledge.slug)}/progress`, {
      method: "POST",
      body: JSON.stringify({
        status: "mastered",
        progress_percent: 100,
        mastery_score: 90
      })
    });
    if (progressHint) {
      progressHint.textContent = payload.data?.status === "mastered"
        ? "已保存：这个知识点已掌握。"
        : "学习进度已保存。";
    }
  } catch (error) {
    console.warn("Knowledge progress failed.", error);
    if (progressHint) progressHint.textContent = "保存失败，请确认已登录并检查后端连接。";
  }
}

async function loadKnowledge() {
  try {
    const payload = await fetchJson("/api/knowledge-points?limit=40");
    knowledgeItems = payload.data || [];
    renderKnowledgeCards(knowledgeItems);
    const requestedSlug = new URLSearchParams(window.location.search).get("point");
    const first = knowledgeItems.find((item) => item.slug === requestedSlug) || knowledgeItems[0];
    if (first) await loadKnowledgeDetail(first.slug);
  } catch (error) {
    console.warn("Knowledge data failed, using static fallback.", error);
  }
}

knowledgeFilterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.knowledgeFilter || "all";
    knowledgeFilterButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    applyKnowledgeFilter(filter);
  });
});

stageButtons.forEach((button) => {
  button.addEventListener("click", () => {
    stageButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
  });
});

completeButton?.addEventListener("click", completeKnowledge);

loadKnowledge();
