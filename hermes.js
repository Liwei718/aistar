const HERMES_API_BASE_URL = "http://localhost:3001";
const hermesMessages = document.querySelector("#hermesMessages");
const hermesForm = document.querySelector("#hermesForm");
const hermesInput = document.querySelector("#hermesInput");
const hermesClear = document.querySelector("#hermesClear");
const hermesStatus = document.querySelector("#hermesStatus");
const hermesBaseUrl = document.querySelector("#hermesBaseUrl");
const hermesModel = document.querySelector("#hermesModel");
const hermesCheck = document.querySelector("#hermesCheck");

const messages = [
  {
    role: "system",
    content: "你是星火 AI 科学馆里的 Hermes，本机运行的 AI 学习助手。请用中文回答，面向中小学生和家长，表达清楚、耐心、具体。"
  }
];

function addMessage(role, content) {
  const node = document.createElement("article");
  node.className = `hermes-message ${role}`;
  node.innerHTML = `<strong>${role === "user" ? "你" : "Hermes"}</strong><p></p>`;
  node.querySelector("p").textContent = content;
  hermesMessages?.appendChild(node);
  hermesMessages?.scrollTo({ top: hermesMessages.scrollHeight, behavior: "smooth" });
  return node;
}

async function checkHermes() {
  if (hermesStatus) hermesStatus.textContent = "正在连接";

  try {
    const response = await fetch(`${HERMES_API_BASE_URL}/api/hermes/status`);
    const payload = await response.json();

    if (hermesBaseUrl) hermesBaseUrl.textContent = payload.base_url || "未配置";
    if (hermesModel) hermesModel.textContent = payload.model || "Hermes";
    if (hermesStatus) hermesStatus.textContent = payload.ok ? "已连接" : "未连接";
  } catch {
    if (hermesStatus) hermesStatus.textContent = "后端未启动";
  }
}

async function sendToHermes(text) {
  messages.push({ role: "user", content: text });
  addMessage("user", text);
  const pending = addMessage("assistant", "Hermes 正在思考...");

  const response = await fetch(`${HERMES_API_BASE_URL}/api/hermes/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: messages.slice(-18),
      temperature: 0.7
    })
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.message || "Hermes 暂时没有响应");
  }

  const answer = payload.data?.content || "Hermes 没有返回内容。";
  messages.push({ role: "assistant", content: answer });
  pending.querySelector("p").textContent = answer;
}

hermesForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const text = hermesInput?.value.trim();
  if (!text) return;

  hermesInput.value = "";

  try {
    await sendToHermes(text);
  } catch (error) {
    addMessage("assistant", error instanceof Error ? error.message : "Hermes 暂时不可用。");
  }
});

hermesClear?.addEventListener("click", () => {
  messages.splice(1);
  if (hermesMessages) {
    hermesMessages.innerHTML = "";
  }
  addMessage("assistant", "对话已清空。我们可以重新开始。");
});

hermesCheck?.addEventListener("click", checkHermes);
checkHermes();
