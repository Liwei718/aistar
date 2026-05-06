const GAMES_API_BASE_URL = "http://localhost:3001";

const leaderboardTabs = document.querySelectorAll("[data-game-slug]");
const leaderboardTable = document.querySelector("#leaderboardTable");
const leaderboardStatus = document.querySelector("#leaderboardStatus");

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatGameDuration(seconds) {
  if (!Number.isFinite(seconds)) return "未记录";
  if (seconds < 60) return `${seconds} 秒`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes} 分 ${remainingSeconds} 秒`;
}

function formatCompletedAt(value) {
  if (!value) return "刚刚";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "刚刚";
  return date.toLocaleDateString("zh-CN", {
    month: "2-digit",
    day: "2-digit"
  });
}

function resultLabel(result) {
  const labels = {
    champion: "冠军",
    gold: "金牌",
    silver: "银牌",
    bronze: "铜牌",
    win: "胜利",
    lose: "挑战中"
  };

  return labels[result] || "完成";
}

function renderLeaderboard(records) {
  if (!leaderboardTable) return;

  if (!records.length) {
    leaderboardTable.innerHTML = '<div class="leaderboard-empty">这个项目还没有成绩。登录后完成一局，就能成为第一名。</div>';
    return;
  }

  leaderboardTable.innerHTML = records.map((record) => {
    const scoreText = record.max_score ? `${record.score ?? 0}/${record.max_score}` : `${record.score ?? 0}`;
    const nickname = record.player?.nickname || "星火同学";
    const avatarUrl = record.player?.avatar_url;
    const avatar = record.player?.avatar_url
      ? `<img src="${escapeHtml(avatarUrl)}" alt="" />`
      : `<span>${escapeHtml(nickname.slice(0, 1))}</span>`;

    return `
      <article class="leaderboard-row">
        <strong>${record.rank}</strong>
        <div class="leaderboard-player">
          ${avatar}
          <div>
            <b>${escapeHtml(nickname)}</b>
            <small>${record.player?.grade ? `${record.player.grade} 年级` : "Kevin's Olympic 选手"}</small>
          </div>
        </div>
        <div class="leaderboard-score">
          <b>${scoreText}</b>
          <small>${resultLabel(record.result)}</small>
        </div>
        <time>${formatGameDuration(record.duration_seconds)} · ${formatCompletedAt(record.completed_at)}</time>
      </article>
    `;
  }).join("");
}

async function loadLeaderboard(gameSlug) {
  if (!leaderboardTable || !leaderboardStatus) return;
  if (!gameSlug) return;

  leaderboardStatus.textContent = "读取最新成绩中";
  leaderboardTable.innerHTML = '<div class="leaderboard-empty">排行榜正在更新...</div>';

  try {
    const response = await fetch(`${GAMES_API_BASE_URL}/api/games/leaderboard?game_slug=${encodeURIComponent(gameSlug)}&limit=10`);
    if (!response.ok) throw new Error("leaderboard_unavailable");
    const payload = await response.json();
    const records = Array.isArray(payload.data) ? payload.data : [];
    renderLeaderboard(records);
    leaderboardStatus.textContent = records.length ? `已收录 ${records.length} 个成绩` : "等待第一位选手";
  } catch (_error) {
    leaderboardStatus.textContent = "后端未连接";
    leaderboardTable.innerHTML = '<div class="leaderboard-empty">暂时读取不到排行榜。请确认后端服务 http://localhost:3001 已启动。</div>';
  }
}

leaderboardTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    leaderboardTabs.forEach((item) => item.classList.remove("active"));
    tab.classList.add("active");
    loadLeaderboard(tab.dataset.gameSlug);
  });
});

const initialLeaderboardTab = document.querySelector("[data-game-slug].active") || leaderboardTabs[0];
if (initialLeaderboardTab) {
  loadLeaderboard(initialLeaderboardTab.dataset.gameSlug);
}
