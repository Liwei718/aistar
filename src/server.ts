import cors from "cors";
import "dotenv/config";
import express from "express";
import { execFile } from "node:child_process";
import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import helmet from "helmet";
import { z } from "zod";
import { prisma } from "./db.js";

const execFileAsync = promisify(execFile);
const app = express();
const port = Number(process.env.PORT ?? 3001);
const hermesBaseUrl = process.env.HERMES_API_BASE_URL ?? "http://localhost:11434";
const hermesModel = process.env.HERMES_MODEL ?? "hermes3";
const hermesApiFormat = process.env.HERMES_API_FORMAT ?? "auto";
const hermesCliPath = process.env.HERMES_CLI_PATH ?? "/Users/martinxu/.local/bin/hermes";
const allowedOrigins = process.env.FRONTEND_ORIGIN?.split(",").map((origin) => origin.trim()) ?? [
  "http://localhost:3000",
  "http://localhost:3002",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3002"
];

app.use(helmet());
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true
  })
);
app.use(express.json({ limit: "1mb" }));

const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0)
});

const hermesMessageSchema = z.object({
  role: z.enum(["system", "user", "assistant"]),
  content: z.string().min(1).max(12000)
});

const hermesChatSchema = z.object({
  messages: z.array(hermesMessageSchema).min(1).max(40),
  model: z.string().min(1).max(120).optional(),
  temperature: z.number().min(0).max(2).optional()
});

const demoContent = {
  id: "demo-content-orbit",
  content_type: "knowledge_article",
  title: "用小游戏理解稳定轨道",
  slug: "orbit-game-learning",
  summary: "通过调节推力，观察速度和引力如何共同决定轨道。",
  body: "当探测器速度太小，会被恒星拉回；速度太大，会飞离轨道。合适的速度会让它形成稳定轨道。",
  school_stage: "middle",
  min_grade: 7,
  max_grade: 9,
  subject: "physics",
  difficulty: "normal",
  status: "published",
  published_at: new Date().toISOString(),
  tags: [{ tag: { name: "物理", slug: "physics" } }],
  knowledge_points: [{ knowledge_point: { name: "稳定轨道", slug: "stable-orbit" } }]
};

const demoKnowledgePoint = {
  id: "demo-knowledge-stable-orbit",
  name: "稳定轨道",
  slug: "stable-orbit",
  school_stage: "middle",
  grade: 8,
  subject: "physics",
  difficulty: "normal",
  plain_explanation: "稳定轨道来自速度方向和引力之间的持续平衡。",
  recommended_minutes: 12,
  status: "published"
};

const demoGame = {
  id: "demo-game-pingpong",
  name: "乒乓球冠军赛",
  slug: "table-tennis-championship",
  description: "移动球拍、抓住反弹节奏，连续击败挑战者。",
  game_type: "sports",
  school_stage: "middle",
  min_grade: 4,
  max_grade: 9,
  subject: "science",
  difficulty: "normal",
  entry_url: "/kevin-olympic-games/pingpong/index.html",
  status: "published",
  levels: [{ level_no: 1, name: "挑战者赛", difficulty: "easy" }],
  knowledge_points: [{ knowledge_point: demoKnowledgePoint }]
};

const demoFrontierItems = [
  {
    id: "demo-frontier-ai",
    category: "ai",
    title: "多模态模型正在学习同时理解文字、图片和声音",
    summary: "AI 不只是读文字，还能把图片、声音和文字放在一起判断。它像一个会看图、听课、做笔记的学习助手，但仍需要我们验证来源。",
    related_knowledge: "信息与信息处理",
    grade_band: "小学高年级到初中",
    why_it_matters: "它能帮助学生理解 AI 如何处理不同形式的信息，也提醒我们不要盲信模型输出。",
    source_name: "示例来源",
    source_url: "https://example.com/ai-frontier",
    published_at: new Date().toISOString(),
    href: "./frontier.html"
  },
  {
    id: "demo-frontier-robot",
    category: "robotics",
    title: "仿生机器人用鱼类动作提升水下稳定性",
    summary: "研究者模仿鱼尾摆动，让机器人在复杂水流中更灵活地转向，和科学课里的力与运动有关。",
    related_knowledge: "力与运动",
    grade_band: "小学高年级到初中",
    why_it_matters: "仿生设计能把生物观察变成工程方案，适合连接科学探究和机器人学习。",
    source_name: "示例来源",
    source_url: "https://example.com/robotics-frontier",
    published_at: new Date().toISOString(),
    href: "./frontier.html"
  },
  {
    id: "demo-frontier-space",
    category: "space",
    title: "新观测数据帮助理解早期星系形成",
    summary: "望远镜看到的古老光线，能帮助我们理解宇宙早期发生了什么，也让光年和宇宙年龄变得更具体。",
    related_knowledge: "宇宙与天体",
    grade_band: "初中以上",
    why_it_matters: "太空观测能把课本里的光年、星系和宇宙演化变成真实问题。",
    source_name: "示例来源",
    source_url: "https://example.com/space-frontier",
    published_at: new Date().toISOString(),
    href: "./frontier.html"
  }
];

const demoHomeSummary = {
  hero_book: {
    title: "解锁 AI 魔法",
    subtitle: "和爸爸一起走进智能未来",
    href: "./ai-learning.html"
  },
  featured_game: demoGame,
  frontier_summary: demoFrontierItems,
  project_summary: [
    {
      id: "demo-project-ai",
      title: "本周开源项目",
      summary: "精选适合学生试玩、Fork 和改造的真实工程。",
      href: "./projects.html"
    }
  ],
  recommendation_cards: [demoContent, demoGame, demoKnowledgePoint],
  learning_summary: {
    learning_days: 0,
    streak_days: 0,
    mastered_knowledge_points: 0,
    badges: []
  }
};

function isDatabaseConnectionError(error: unknown) {
  return error instanceof Error && /Can't reach database server|ECONNREFUSED|P1001|connect/i.test(error.message);
}

function jsonSafe<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_key, currentValue) =>
      typeof currentValue === "bigint" ? currentValue.toString() : currentValue
    )
  );
}

function hashPassword(password: string) {
  return createHash("sha256").update(password).digest("hex");
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function createToken() {
  return randomUUID();
}

function sessionExpiresAt() {
  const days = Number(process.env.SESSION_TTL_DAYS ?? 30);
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

function clientIp(req: express.Request) {
  return req.ip?.replace(/^::ffff:/, "") || undefined;
}

function normalizeHomeRecommendation(item: Record<string, unknown>, href: string) {
  return {
    ...item,
    href
  };
}

function contentHref(contentType: string) {
  const hrefs: Record<string, string> = {
    frontier_news: "./frontier.html",
    open_source_intro: "./projects.html",
    knowledge_article: "./knowledge.html",
    ai_problem: "./ai-learning.html",
    scientist: "./scientists.html",
    game_intro: "./games.html",
    learning_path_node: "./knowledge.html"
  };

  return hrefs[contentType] ?? "./index.html#recommend";
}

function metadataOf(value: unknown) {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

function categoryOf(metadata: Record<string, unknown>, fallback = "ai") {
  return typeof metadata.category === "string" ? metadata.category : fallback;
}

function gradeBandOf(metadata: Record<string, unknown>) {
  return typeof metadata.grade_band === "string" ? metadata.grade_band : "小学高年级到初中";
}

function whyItMattersOf(metadata: Record<string, unknown>) {
  return typeof metadata.why_it_matters === "string" ? metadata.why_it_matters : "这条前沿内容可以帮助你把课内知识和真实世界的新变化联系起来。";
}

function frontierItemFromContent(item: {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  body?: string;
  subject: string | null;
  source_name: string | null;
  source_url: string | null;
  published_at: Date | null;
  metadata: unknown;
  knowledge_points?: Array<{ knowledge_point: { name: string } }>;
}) {
  const metadata = metadataOf(item.metadata);

  return {
    id: item.id,
    slug: item.slug,
    category: categoryOf(metadata, item.subject || "ai"),
    title: item.title,
    summary: item.summary,
    body: item.body,
    related_knowledge: item.knowledge_points?.[0]?.knowledge_point.name || metadata.related_knowledge || "科学素养",
    grade_band: gradeBandOf(metadata),
    why_it_matters: whyItMattersOf(metadata),
    source_name: item.source_name,
    source_url: item.source_url,
    published_at: item.published_at,
    href: "./frontier.html"
  };
}

function normalizeHermesBaseUrl() {
  return hermesBaseUrl.replace(/\/$/, "");
}

function hermesHeaders() {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (process.env.HERMES_API_KEY) {
    headers.Authorization = `Bearer ${process.env.HERMES_API_KEY}`;
  }
  return headers;
}

async function fetchHermes(path: string, init: RequestInit = {}) {
  const timeout = Number(process.env.HERMES_TIMEOUT_MS ?? 60000);
  return fetch(`${normalizeHermesBaseUrl()}${path}`, {
    ...init,
    headers: {
      ...hermesHeaders(),
      ...(init.headers ?? {})
    },
    signal: AbortSignal.timeout(timeout)
  });
}

async function callOllamaHermes(body: z.infer<typeof hermesChatSchema>) {
  const response = await fetchHermes("/api/chat", {
    method: "POST",
    body: JSON.stringify({
      model: body.model ?? hermesModel,
      messages: body.messages,
      stream: false,
      options: {
        temperature: body.temperature ?? 0.7
      }
    })
  });

  if (!response.ok) {
    throw new Error(`ollama_hermes_error:${response.status}`);
  }

  const payload = await response.json() as { message?: { content?: string } };
  return payload.message?.content ?? "";
}

async function callOpenAiCompatibleHermes(body: z.infer<typeof hermesChatSchema>) {
  const response = await fetchHermes("/v1/chat/completions", {
    method: "POST",
    body: JSON.stringify({
      model: body.model ?? hermesModel,
      messages: body.messages,
      temperature: body.temperature ?? 0.7,
      stream: false
    })
  });

  if (!response.ok) {
    throw new Error(`openai_hermes_error:${response.status}`);
  }

  const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  return payload.choices?.[0]?.message?.content ?? "";
}

function cliPromptFromMessages(messages: z.infer<typeof hermesChatSchema>["messages"]) {
  return messages
    .filter((message) => message.role !== "system")
    .map((message) => `${message.role === "user" ? "用户" : "Hermes"}：${message.content}`)
    .join("\n\n");
}

async function callCliHermes(body: z.infer<typeof hermesChatSchema>) {
  const prompt = cliPromptFromMessages(body.messages);
  const timeout = Number(process.env.HERMES_TIMEOUT_MS ?? 120000);
  const { stdout } = await execFileAsync(
    hermesCliPath,
    ["chat", "-Q", "-q", prompt],
    {
      cwd: process.cwd(),
      timeout,
      maxBuffer: 1024 * 1024 * 4,
      env: {
        ...process.env,
        HERMES_ACCEPT_HOOKS: "1"
      }
    }
  );

  return stdout
    .replace(/^.*Normalized model.*\n?/gm, "")
    .replace(/^session_id:\s*\S+\s*/gm, "")
    .trim();
}

async function callHermes(body: z.infer<typeof hermesChatSchema>) {
  if (hermesApiFormat === "cli") return callCliHermes(body);
  if (hermesApiFormat === "ollama") return callOllamaHermes(body);
  if (hermesApiFormat === "openai") return callOpenAiCompatibleHermes(body);

  try {
    return await callOllamaHermes(body);
  } catch {
    return callOpenAiCompatibleHermes(body);
  }
}

function getTokenFromHeader(req: express.Request) {
  const header = req.header("authorization");

  if (!header?.startsWith("Bearer ")) return null;
  return header.slice(7);
}

async function findCurrentUser(req: express.Request) {
  const token = getTokenFromHeader(req);
  if (!token) return null;

  const session = await prisma.userSession.findUnique({
    where: { token_hash: hashToken(token) },
    include: { user: true }
  });

  if (!session || session.revoked_at || session.expires_at <= new Date()) return null;

  await prisma.userSession.update({
    where: { token_hash: session.token_hash },
    data: { last_seen_at: new Date() }
  });

  return session.user;
}

async function issueSession(req: express.Request, userId: string) {
  const token = createToken();

  await prisma.userSession.create({
    data: {
      token_hash: hashToken(token),
      user_id: userId,
      user_agent: req.header("user-agent"),
      ip: clientIp(req),
      expires_at: sessionExpiresAt()
    }
  });

  return token;
}

async function revokeSession(req: express.Request) {
  const token = getTokenFromHeader(req);
  if (!token) return;

  await prisma.userSession.updateMany({
    where: {
      token_hash: hashToken(token),
      revoked_at: null
    },
    data: { revoked_at: new Date() }
  });
}

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "aistar-backend" });
});

app.get("/", (_req, res) => {
  res.type("html").send(`<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>星火 AI 科学馆后端</title>
    <style>
      body {
        margin: 0;
        font-family: Inter, "PingFang SC", "Microsoft YaHei", Arial, sans-serif;
        color: #132047;
        background: #f6f9ff;
      }
      main {
        width: min(880px, calc(100% - 40px));
        margin: 56px auto;
        padding: 32px;
        border: 1px solid #dce7fb;
        border-radius: 8px;
        background: #fff;
        box-shadow: 0 16px 44px rgba(34, 83, 161, 0.12);
      }
      h1 {
        margin: 0 0 8px;
        font-size: 28px;
      }
      p {
        margin: 0 0 24px;
        color: #5b6680;
      }
      a {
        color: #2457ff;
        font-weight: 700;
      }
      code {
        padding: 3px 6px;
        border-radius: 6px;
        background: #eef4ff;
      }
      li {
        margin: 10px 0;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>星火 AI 科学馆后端已运行</h1>
      <p>服务地址：<code>http://localhost:${port}</code></p>
      <ul>
        <li><a href="/health">GET /health</a>：健康检查</li>
        <li><a href="/api">GET /api</a>：API 索引</li>
        <li><a href="/api/contents">GET /api/contents</a>：已发布内容列表，需要数据库连接</li>
        <li><a href="/api/knowledge-points">GET /api/knowledge-points</a>：知识点列表，需要数据库连接</li>
        <li><a href="/api/games">GET /api/games</a>：小游戏列表，需要数据库连接</li>
      </ul>
    </main>
  </body>
</html>`);
});

app.get("/api", (_req, res) => {
  res.json({
    service: "aistar-backend",
    status: "running",
    note: "数据库未启动时，只读接口会返回 demo 数据，真实数据请先配置 PostgreSQL 并执行迁移。",
    endpoints: [
      { method: "GET", path: "/health", description: "健康检查" },
      { method: "GET", path: "/api/contents", description: "已发布内容列表" },
      { method: "GET", path: "/api/knowledge-points", description: "已发布知识点列表" },
      { method: "GET", path: "/api/games", description: "已发布小游戏列表" },
      { method: "GET", path: "/api/home/summary", description: "首页运营位摘要" },
      { method: "GET", path: "/api/frontier/summary", description: "今日前沿首页摘要" },
      { method: "GET", path: "/api/frontier/items", description: "今日前沿完整列表" },
      { method: "GET", path: "/api/frontier/today-news", description: "今日前沿当天新闻" },
      { method: "GET", path: "/api/frontier/items/:id", description: "今日前沿详情" },
      { method: "POST", path: "/api/contact-messages", description: "提交联系留言" },
      { method: "POST", path: "/api/game-records", description: "写入用户游戏记录" },
      { method: "GET", path: "/api/recommendations/:userId", description: "获取用户推荐结果" }
    ]
  });
});

app.get("/api/auth/me", async (req, res, next) => {
  try {
    const user = await findCurrentUser(req);
    if (!user) {
      res.json({ data: null });
      return;
    }

    res.json({
      data: jsonSafe({
        id: user.id,
        email: user.email,
        phone: user.phone,
        nickname: user.nickname,
        avatar_url: user.avatar_url,
        school_stage: user.school_stage,
        grade: user.grade,
        gender: user.gender,
        learning_preference: user.learning_preference,
        status: user.status,
        last_login_at: user.last_login_at,
        created_at: user.created_at,
        updated_at: user.updated_at
      })
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/register", async (req, res, next) => {
  try {
    const body = z
      .object({
        nickname: z.string().min(2).max(80),
        email: z.string().email().optional().or(z.literal("")).transform((value) => value || undefined),
        phone: z.string().min(6).max(32).optional().or(z.literal("")).transform((value) => value || undefined),
        password: z.string().min(6).max(64),
        school_stage: z.enum(["primary", "middle", "high"]).optional().or(z.literal("")).transform((value) => value || undefined),
        grade: z.coerce.number().int().min(1).max(12).optional().or(z.literal("")).transform((value) => value === "" ? undefined : value)
      })
      .parse(req.body);

    if (!body.email && !body.phone) {
      res.status(400).json({ error: "validation_error", message: "邮箱或手机号至少填写一个" });
      return;
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          body.email ? { email: body.email } : undefined,
          body.phone ? { phone: body.phone } : undefined
        ].filter(Boolean) as Array<{ email?: string; phone?: string }>
      }
    });

    if (existingUser) {
      res.status(409).json({ error: "user_exists", message: "账号已存在" });
      return;
    }

    const user = await prisma.user.create({
      data: {
        email: body.email,
        phone: body.phone,
        password_hash: hashPassword(body.password),
        nickname: body.nickname,
        school_stage: body.school_stage as never,
        grade: body.grade as number | undefined,
        status: "active"
      }
    });

    const token = await issueSession(req, user.id);

    res.status(201).json({
      data: jsonSafe({
        token,
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          nickname: user.nickname,
          avatar_url: user.avatar_url,
          school_stage: user.school_stage,
          grade: user.grade
        }
      })
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/login", async (req, res, next) => {
  try {
    const body = z
      .object({
        account: z.string().min(3).max(255),
        password: z.string().min(6).max(64)
      })
      .parse(req.body);

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: body.account }, { phone: body.account }]
      }
    });

    if (!user?.password_hash) {
      res.status(401).json({ error: "invalid_credentials", message: "账号或密码错误" });
      return;
    }

    const hashedInput = hashPassword(body.password);
    const sameLength = user.password_hash.length === hashedInput.length;
    const passwordOk =
      sameLength && timingSafeEqual(Buffer.from(user.password_hash), Buffer.from(hashedInput));

    if (!passwordOk) {
      res.status(401).json({ error: "invalid_credentials", message: "账号或密码错误" });
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { last_login_at: new Date() }
    });

    const token = await issueSession(req, user.id);

    res.json({
      data: jsonSafe({
        token,
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          nickname: user.nickname,
          avatar_url: user.avatar_url,
          school_stage: user.school_stage,
          grade: user.grade
        }
      })
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/logout", async (req, res) => {
  await revokeSession(req);
  res.json({ ok: true });
});

app.get("/api/home/summary", async (req, res, next) => {
  try {
    const currentUser = await findCurrentUser(req);

    const [frontierContents, recommendations, featuredGame, learningProgress, badges] = await Promise.all([
      prisma.content.findMany({
        where: {
          status: "published",
          deleted_at: null,
          content_type: "frontier_news"
        },
        orderBy: [{ published_at: "desc" }, { created_at: "desc" }],
        take: 3,
        include: {
          knowledge_points: { include: { knowledge_point: true } }
        }
      }),
      prisma.content.findMany({
        where: {
          status: "published",
          deleted_at: null
        },
        orderBy: [{ published_at: "desc" }, { created_at: "desc" }],
        take: 4
      }),
      prisma.game.findFirst({
        where: {
          status: "published",
          deleted_at: null,
          slug: "table-tennis-championship"
        },
        include: {
          levels: { orderBy: { level_no: "asc" } },
          knowledge_points: { include: { knowledge_point: true } }
        }
      }),
      currentUser
        ? prisma.learningProgress.findMany({
            where: { user_id: currentUser.id }
          })
        : Promise.resolve([]),
      currentUser
        ? prisma.userBadge.findMany({
            where: { user_id: currentUser.id },
            include: { badge: true }
          })
        : Promise.resolve([])
    ]);

    const masteredCount = learningProgress.filter((item) => item.status === "completed").length;
    const activeDays = new Set(
      learningProgress
        .map((item) => item.last_activity_at || item.completed_at || item.created_at)
        .filter(Boolean)
        .map((date) => date.toISOString().slice(0, 10))
    );

    const frontierSummary = frontierContents.length
      ? frontierContents.map((item) => ({
          id: item.id,
          category: categoryOf(metadataOf(item.metadata), item.subject || "ai"),
          title: item.title,
          summary: item.summary,
          related_knowledge: item.knowledge_points[0]?.knowledge_point.name,
          href: "./frontier.html"
        }))
      : demoFrontierItems;

    res.json(jsonSafe({
      data: {
        ...demoHomeSummary,
        featured_game: featuredGame ?? demoGame,
        frontier_summary: frontierSummary,
        recommendation_cards: recommendations.length
          ? recommendations.map((item) => normalizeHomeRecommendation(item, contentHref(item.content_type)))
          : demoHomeSummary.recommendation_cards,
        learning_summary: {
          learning_days: activeDays.size,
          streak_days: activeDays.size ? 1 : 0,
          mastered_knowledge_points: masteredCount,
          badges: badges.map((item) => ({
            name: item.badge.name,
            slug: item.badge.slug,
            earned_at: item.earned_at
          }))
        }
      }
    }));
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      res.json({ data: demoHomeSummary, mode: "demo", warning: "database_unavailable" });
      return;
    }

    next(error);
  }
});

app.post("/api/contact-messages", async (req, res, next) => {
  try {
    const body = z
      .object({
        name: z.string().max(120).optional().or(z.literal("")).transform((value) => value || undefined),
        contact: z.string().min(3).max(255),
        message: z.string().min(5).max(2000),
        source: z.string().max(64).optional()
      })
      .parse(req.body);

    const contactMessage = await prisma.contactMessage.create({
      data: {
        name: body.name,
        contact: body.contact,
        message: body.message,
        source: body.source ?? "contact_page",
        ip: clientIp(req),
        user_agent: req.header("user-agent")
      }
    });

    res.status(201).json(jsonSafe({ data: contactMessage }));
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      res.status(503).json({
        error: "database_unavailable",
        message: "留言保存需要先启动 PostgreSQL 并执行 Prisma 迁移。"
      });
      return;
    }

    next(error);
  }
});

app.get("/api/frontier/summary", async (_req, res, next) => {
  try {
    const items = await prisma.content.findMany({
      where: {
        status: "published",
        deleted_at: null,
        content_type: "frontier_news"
      },
      orderBy: [{ published_at: "desc" }, { created_at: "desc" }],
      take: 3,
      include: {
        knowledge_points: { include: { knowledge_point: true } }
      }
    });

    res.json(jsonSafe({
      data: items.length ? items.map(frontierItemFromContent) : demoFrontierItems,
      mode: items.length ? "live" : "demo"
    }));
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      res.json({ data: demoFrontierItems, mode: "demo", warning: "database_unavailable" });
      return;
    }

    next(error);
  }
});

app.get("/api/frontier/items", async (req, res, next) => {
  try {
    const query = listQuerySchema
      .extend({
        category: z.string().optional(),
        grade: z.coerce.number().int().min(1).max(12).optional()
      })
      .parse(req.query);

    const items = await prisma.content.findMany({
      where: {
        status: "published",
        deleted_at: null,
        content_type: "frontier_news",
        ...(query.grade
          ? {
              OR: [
                { min_grade: null },
                { min_grade: { lte: query.grade } }
              ],
              AND: [
                {
                  OR: [
                    { max_grade: null },
                    { max_grade: { gte: query.grade } }
                  ]
                }
              ]
            }
          : {})
      },
      orderBy: [{ published_at: "desc" }, { created_at: "desc" }],
      take: query.limit,
      skip: query.offset,
      include: {
        knowledge_points: { include: { knowledge_point: true } }
      }
    });

    const data = items
      .map(frontierItemFromContent)
      .filter((item) => !query.category || query.category === "all" || item.category === query.category);

    res.json(jsonSafe({
      data: data.length ? data : demoFrontierItems.filter((item) => !query.category || query.category === "all" || item.category === query.category),
      mode: data.length ? "live" : "demo"
    }));
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      res.json({ data: demoFrontierItems, mode: "demo", warning: "database_unavailable" });
      return;
    }

    next(error);
  }
});

app.get("/api/frontier/today-news", async (_req, res, next) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const items = await prisma.content.findMany({
      where: {
        status: "published",
        deleted_at: null,
        content_type: "frontier_news",
        published_at: { gte: startOfToday }
      },
      orderBy: [{ published_at: "desc" }, { created_at: "desc" }],
      take: 6,
      include: {
        knowledge_points: { include: { knowledge_point: true } }
      }
    });

    res.json(jsonSafe({
      data: items.length ? items.map(frontierItemFromContent) : demoFrontierItems,
      mode: items.length ? "live" : "demo"
    }));
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      res.json({ data: demoFrontierItems, mode: "demo", warning: "database_unavailable" });
      return;
    }

    next(error);
  }
});

app.get("/api/frontier/items/:id", async (req, res, next) => {
  try {
    const params = z.object({ id: z.string() }).parse(req.params);
    const item = await prisma.content.findFirst({
      where: {
        OR: [
          z.string().uuid().safeParse(params.id).success ? { id: params.id } : undefined,
          { slug: params.id }
        ].filter(Boolean) as Array<{ id?: string; slug?: string }>,
        status: "published",
        deleted_at: null,
        content_type: "frontier_news"
      },
      include: {
        knowledge_points: { include: { knowledge_point: true } }
      }
    });

    if (!item) {
      res.status(404).json({ error: "not_found", message: "未找到这条前沿内容" });
      return;
    }

    res.json(jsonSafe({ data: frontierItemFromContent(item) }));
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      res.status(503).json({ error: "database_unavailable", message: "读取详情需要数据库连接。" });
      return;
    }

    next(error);
  }
});

app.get("/api/contents", async (req, res, next) => {
  try {
    const query = listQuerySchema
      .extend({
        type: z.string().optional(),
        subject: z.string().optional()
      })
      .parse(req.query);

    const contents = await prisma.content.findMany({
      where: {
        status: "published",
        deleted_at: null,
        content_type: query.type as never,
        subject: query.subject as never
      },
      orderBy: [{ published_at: "desc" }, { created_at: "desc" }],
      take: query.limit,
      skip: query.offset,
      include: {
        tags: { include: { tag: true } },
        knowledge_points: { include: { knowledge_point: true } }
      }
    });

    res.json(jsonSafe({ data: contents }));
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      res.json({ data: [demoContent], mode: "demo", warning: "database_unavailable" });
      return;
    }

    next(error);
  }
});

app.get("/api/knowledge-points", async (req, res, next) => {
  try {
    const query = listQuerySchema
      .extend({
        stage: z.string().optional(),
        subject: z.string().optional(),
        grade: z.coerce.number().int().min(1).max(12).optional()
      })
      .parse(req.query);

    const knowledgePoints = await prisma.knowledgePoint.findMany({
      where: {
        status: "published",
        deleted_at: null,
        school_stage: query.stage as never,
        subject: query.subject as never,
        grade: query.grade
      },
      orderBy: [{ grade: "asc" }, { created_at: "desc" }],
      take: query.limit,
      skip: query.offset
    });

    res.json(jsonSafe({ data: knowledgePoints }));
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      res.json({ data: [demoKnowledgePoint], mode: "demo", warning: "database_unavailable" });
      return;
    }

    next(error);
  }
});

app.get("/api/games", async (req, res, next) => {
  try {
    const query = listQuerySchema
      .extend({
        subject: z.string().optional()
      })
      .parse(req.query);

    const games = await prisma.game.findMany({
      where: {
        status: "published",
        deleted_at: null,
        subject: query.subject as never
      },
      orderBy: { created_at: "desc" },
      take: query.limit,
      skip: query.offset,
      include: {
        levels: { orderBy: { level_no: "asc" } },
        knowledge_points: { include: { knowledge_point: true } }
      }
    });

    res.json(jsonSafe({ data: games }));
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      res.json({ data: [demoGame], mode: "demo", warning: "database_unavailable" });
      return;
    }

    next(error);
  }
});

app.get("/api/hermes/status", async (_req, res) => {
  try {
    if (hermesApiFormat === "cli") {
      res.json({
        ok: true,
        base_url: hermesCliPath,
        model: hermesModel,
        format: hermesApiFormat
      });
      return;
    }

    let response: Response;

    if (hermesApiFormat === "openai") {
      response = await fetchHermes("/v1/models", { method: "GET" });
    } else {
      response = await fetchHermes("/api/tags", { method: "GET" });
    }

    res.json({
      ok: response.ok,
      base_url: normalizeHermesBaseUrl(),
      model: hermesModel,
      format: hermesApiFormat
    });
  } catch (error) {
    res.status(503).json({
      ok: false,
      base_url: normalizeHermesBaseUrl(),
      model: hermesModel,
      format: hermesApiFormat,
      message: error instanceof Error ? error.message : "Hermes 服务暂时不可用"
    });
  }
});

app.post("/api/hermes/chat", async (req, res) => {
  try {
    const body = hermesChatSchema.parse(req.body);
    const answer = await callHermes(body);

    res.json({
      data: {
        role: "assistant",
        content: answer || "Hermes 没有返回内容。"
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "invalid_request", details: error.flatten() });
      return;
    }

    res.status(502).json({
      error: "hermes_unavailable",
      message: "无法连接本机 Hermes。请确认 Hermes 服务已启动，并检查 HERMES_API_BASE_URL / HERMES_MODEL 配置。",
      details: error instanceof Error ? error.message : "unknown_error"
    });
  }
});

app.post("/api/game-records", async (req, res, next) => {
  try {
    const body = z
      .object({
        user_id: z.string().uuid(),
        game_id: z.string().uuid(),
        level_id: z.string().uuid().optional(),
        score: z.number().int().optional(),
        max_score: z.number().int().optional(),
        status: z.enum(["started", "completed", "failed", "abandoned"]),
        duration_seconds: z.number().int().min(0).optional(),
        mistakes: z.unknown().optional(),
        metadata: z.unknown().optional()
      })
      .parse(req.body);

    const now = new Date();
    const record = await prisma.gameRecord.create({
      data: {
        ...body,
        started_at: body.status === "started" ? now : undefined,
        completed_at: body.status === "completed" ? now : undefined,
        mistakes: body.mistakes ?? undefined,
        metadata: body.metadata ?? undefined
      }
    });

    res.status(201).json(jsonSafe({ data: record }));
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      res.status(503).json({
        error: "database_unavailable",
        message: "写入游戏记录需要先启动 PostgreSQL 并执行 Prisma 迁移。"
      });
      return;
    }

    next(error);
  }
});

app.get("/api/recommendations/:userId", async (req, res, next) => {
  try {
    const params = z.object({ userId: z.string().uuid() }).parse(req.params);
    const query = listQuerySchema
      .extend({
        scene: z.string().default("home")
      })
      .parse(req.query);

    const recommendations = await prisma.recommendation.findMany({
      where: {
        user_id: params.userId,
        scene: query.scene as never
      },
      orderBy: [{ rank_no: "asc" }, { score: "desc" }, { created_at: "desc" }],
      take: query.limit,
      skip: query.offset
    });

    res.json(jsonSafe({ data: recommendations }));
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      const scene = typeof req.query.scene === "string" ? req.query.scene : "home";

      res.json({
        data: [
          {
            id: "demo-recommendation-orbit",
            scene,
            target_type: "content",
            target_id: demoContent.id,
            score: 0.92,
            reason: "匹配你的年级、物理兴趣和太空主题。",
            rank_no: 1
          }
        ],
        mode: "demo",
        warning: "database_unavailable"
      });
      return;
    }

    next(error);
  }
});

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (error instanceof z.ZodError) {
    res.status(400).json({ error: "invalid_request", details: error.flatten() });
    return;
  }

  console.error(error);
  res.status(500).json({ error: "internal_error" });
});

app.listen(port, () => {
  console.log(`Aistar backend listening on http://localhost:${port}`);
});
