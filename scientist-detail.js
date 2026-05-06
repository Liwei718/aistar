const API_BASE_URL = "http://localhost:3001";

const fallbackScientist = {
  name: "牛顿",
  category_label: "物理学家",
  avatar_text: "牛",
  photo_url: "https://commons.wikimedia.org/wiki/Special:FilePath/Portrait_of_Sir_Isaac_Newton%2C_1689.jpg?width=360",
  summary: "他把自然界的运动变成可以计算、可以预测的规律。",
  story: "牛顿把地面上的运动、天上的月亮和行星，都放进同一套数学规律里。",
  contributions: ["提出经典力学三大运动定律", "建立万有引力理论", "推动微积分和光学研究的发展"],
  explanation: "可以把牛顿的贡献理解成：他给自然界写了一套运动说明书。",
  knowledge: ["力与运动", "万有引力", "速度和加速度", "函数图像"],
  question: "为什么苹果会下落，月亮却没有直接掉到地球上？",
  inspiration: "遇到复杂现象时，可以先找共同规律，再用数学语言把规律表达清楚。"
};

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

const setText = (id, value) => {
  const node = document.getElementById(id);
  if (node) node.textContent = value || "";
};

const renderList = (id, items) => {
  const list = document.getElementById(id);
  if (!list) return;
  list.innerHTML = (items || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("");
};

function renderScientist(profile) {
  document.title = `${profile.name} · 科学人物讲解`;

  const photo = document.getElementById("detail-photo");
  if (photo) {
    photo.className = "scientist-detail-photo scientist-avatar";
    photo.innerHTML = `
      <b aria-hidden="true">${escapeHtml(profile.avatar_text || profile.name?.slice(0, 1) || "科")}</b>
      ${profile.photo_url ? `<img src="${escapeHtml(profile.photo_url)}" alt="${escapeHtml(profile.name)}头像" loading="lazy" onerror="this.hidden=true" />` : ""}
    `;
  }

  setText("detail-category", profile.category_label || "科学人物");
  setText("detail-name", profile.name);
  setText("detail-summary", profile.summary);
  setText("detail-story", profile.story);
  setText("detail-explanation", profile.explanation);
  setText("detail-question", profile.question);
  setText("detail-inspiration", profile.inspiration);
  renderList("detail-contributions", profile.contributions);
  renderList("detail-knowledge", profile.knowledge);
}

async function loadScientist() {
  const params = new URLSearchParams(window.location.search);
  const scientistId = params.get("id") || "newton";

  try {
    const payload = await fetchJson(`/api/scientists/${encodeURIComponent(scientistId)}`);
    renderScientist(payload.data);
  } catch (error) {
    console.warn("Scientist detail failed, using fallback.", error);
    renderScientist(fallbackScientist);
  }
}

loadScientist();
