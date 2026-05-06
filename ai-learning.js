const API_BASE_URL = "http://localhost:3001";
const AUTH_TOKEN_KEY = "aistar_auth_token";

const shelf = document.querySelector("#bookShelf");
const intro = document.querySelector("#aiLearningIntro");
const bookCover = document.querySelector("#bookCover");
const bookDescription = document.querySelector("#bookDescription");
const chapterGrid = document.querySelector("#chapterGrid");
const bookTasks = document.querySelector("#bookTasks");
const readerTitle = document.querySelector("#reader-title");
const readerOpenLink = document.querySelector("#readerOpenLink");
const readerFrame = document.querySelector("#bookReaderFrame");
const readingProgressText = document.querySelector("#readingProgressText");
const readingProgressBar = document.querySelector("#readingProgressBar");
const markReadingProgress = document.querySelector("#markReadingProgress");
const progressHint = document.querySelector("#progressHint");

let books = [];
let activeBook = null;
let activeProgress = [];

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

  if (!response.ok) {
    throw new Error(`API ${path} returned ${response.status}`);
  }

  return response.json();
}

function bookGradeLabel(book) {
  const stageLabels = {
    primary: "小学",
    middle: "初中",
    high: "高中",
    general: "通用"
  };

  const stage = stageLabels[book.school_stage] || "通用";
  const range = [book.min_grade, book.max_grade].filter(Boolean).join(" - ");
  return range ? `${stage} · ${range} 年级` : stage;
}

function renderShelf(items) {
  if (!shelf) return;

  const placeholdersNeeded = Math.max(0, 3 - items.length);
  const bookCards = items.map((book, index) => `
    <article class="book-card ${index === 0 ? "featured is-active" : ""}" data-book-card data-book-slug="${escapeHtml(book.slug)}">
      <span>${index === 0 ? "已上线" : "预留书位"}</span>
      <h2>${escapeHtml(book.title)}</h2>
      <p>${escapeHtml(book.subtitle || "待完善")}</p>
      <small>${escapeHtml(book.description || "后续会继续扩展更多书籍。")}</small>
      <a href="#book-reader">查看内容</a>
    </article>
  `);

  const placeholders = Array.from({ length: placeholdersNeeded }, (_, index) => `
    <article class="book-card placeholder">
      <span>预留书位</span>
      <h2>新书 ${index + 1}</h2>
      <p>待加入</p>
    </article>
  `);

  shelf.innerHTML = [...bookCards, ...placeholders].join("");
  shelf.querySelectorAll("[data-book-card]").forEach((card) => {
    card.addEventListener("click", () => {
      const slug = card.dataset.bookSlug;
      const book = books.find((item) => item.slug === slug);
      if (book) renderBook(book);
    });
  });
}

function renderChapters(book) {
  if (!chapterGrid) return;

  chapterGrid.innerHTML = (book.chapters || [])
    .map((chapter) => `
      <section>
        <h3>${escapeHtml(chapter.chapter_no)}. ${escapeHtml(chapter.title)}</h3>
        <p>${escapeHtml(chapter.summary || "")}</p>
      </section>
    `)
    .join("");
}

function renderTasks(book) {
  if (!bookTasks) return;

  bookTasks.innerHTML = (book.tasks || [])
    .map((task) => `
      <li>
        <strong>${escapeHtml(task.title)}</strong>
        <div>${escapeHtml(task.description || "")}</div>
      </li>
    `)
    .join("");
}

async function loadProgress(book) {
  if (!book) return;

  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (!token) {
    activeProgress = [];
    if (readingProgressText) readingProgressText.textContent = "未登录";
    if (readingProgressBar) readingProgressBar.style.width = "0%";
    if (progressHint) progressHint.textContent = "登录后可保存阅读进度。";
    if (markReadingProgress) markReadingProgress.disabled = false;
    return;
  }

  try {
    const payload = await fetchJson(`/api/ai/books/${encodeURIComponent(book.slug)}/progress`);
    activeProgress = payload.data || [];
    const latest = activeProgress[0];
    const percent = latest?.progress_percent || 0;
    if (readingProgressText) readingProgressText.textContent = `${percent}%`;
    if (readingProgressBar) readingProgressBar.style.width = `${percent}%`;
    if (progressHint) progressHint.textContent = latest?.status === "completed" ? "已完成本书阅读。" : "继续往下读可以更新进度。";
    if (markReadingProgress) markReadingProgress.disabled = percent >= 100;
  } catch (error) {
    console.warn("load ai progress failed", error);
  }
}

async function saveProgress(book, nextPercent) {
  if (!book) return;

  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (!token) {
    if (progressHint) progressHint.textContent = "请先登录，再保存阅读进度。";
    return;
  }

  const chapterId = book.chapters?.[0]?.id || null;
  const status = nextPercent >= 100 ? "completed" : "reading";
  const payload = await fetchJson(`/api/ai/books/${encodeURIComponent(book.slug)}/progress`, {
    method: "POST",
    body: JSON.stringify({
      chapter_id: chapterId,
      progress_percent: nextPercent,
      status
    })
  });

  const saved = payload.data;
  if (readingProgressText) readingProgressText.textContent = `${saved.progress_percent}%`;
  if (readingProgressBar) readingProgressBar.style.width = `${saved.progress_percent}%`;
  if (progressHint) progressHint.textContent = saved.status === "completed" ? "已完成本书阅读。" : "进度已更新。";
  if (markReadingProgress) markReadingProgress.disabled = saved.progress_percent >= 100;
}

function renderBook(book) {
  if (!book) return;

  activeBook = book;
  const currentBookSlug = book.slug;

  document.querySelectorAll("[data-book-card]").forEach((card) => {
    card.classList.toggle("is-active", card.dataset.bookSlug === currentBookSlug);
  });

  if (intro) intro.textContent = `${book.title} · ${bookGradeLabel(book)}`;
  if (bookCover) {
    bookCover.src = book.cover_image_url || "./assets/ai-magic-cover.png";
    bookCover.alt = `${book.title}封面`;
  }
  if (bookDescription) bookDescription.textContent = book.description || "";
  if (readerTitle) readerTitle.textContent = `${book.title}${book.subtitle ? ` - ${book.subtitle}` : ""}`;
  if (readerOpenLink && book.pdf_url) readerOpenLink.href = book.pdf_url;
  if (readerFrame && book.pdf_url) readerFrame.src = `${book.pdf_url}#view=FitH`;

  renderChapters(book);
  renderTasks(book);
  void loadProgress(book);
}

async function loadBooks() {
  try {
    const payload = await fetchJson("/api/ai/books?limit=10");
    books = payload.data || [];
    if (!books.length) {
      return;
    }

    renderShelf(books);
    const requestedSlug = new URLSearchParams(window.location.search).get("book");
    renderBook(books.find((book) => book.slug === requestedSlug) || books[0]);
  } catch (error) {
    console.warn("AI learning data failed, using static fallback.", error);
    books = [];
    if (progressHint) progressHint.textContent = "当前展示的是静态内容。";
  }
}

markReadingProgress?.addEventListener("click", async () => {
  if (!activeBook) return;
  const current = activeProgress[0]?.progress_percent || 0;
  const nextPercent = Math.min(100, current + 25);
  try {
    await saveProgress(activeBook, nextPercent);
    await loadProgress(activeBook);
  } catch (error) {
    console.warn("save ai progress failed", error);
    if (progressHint) progressHint.textContent = "保存失败，请确认已登录并检查后端连接。";
  }
});

loadBooks();
