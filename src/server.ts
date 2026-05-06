import cors from "cors";
import "dotenv/config";
import express from "express";
import { execFile } from "node:child_process";
import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import helmet from "helmet";
import { z } from "zod";
import { prisma, sessionStore } from "./db.js";

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

function createToken() {
  return randomUUID();
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

  const session = sessionStore.get(token);
  if (!session) return null;

  return prisma.user.findUnique({ where: { id: session.userId } });
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

    const token = createToken();
    sessionStore.set(token, { userId: user.id, createdAt: new Date() });

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

    const token = createToken();
    sessionStore.set(token, { userId: user.id, createdAt: new Date() });

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

app.post("/api/auth/logout", (req, res) => {
  const header = req.header("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (token) sessionStore.delete(token);
  res.json({ ok: true });
});

app.post("/api/auth/register", async (req, res, next) => {
  try {
    const body = z
      .object({
        nickname: z.string().min(2).max(80),
        email: z.string().email().optional(),
        phone: z.string().min(6).max(32).optional(),
        password: z.string().min(6).max(64),
        school_stage: z.enum(["primary", "middle", "high"]).optional(),
        grade: z.number().int().min(1).max(12).optional()
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
        school_stage: body.school_stage,
        grade: body.grade,
        status: "active"
      }
    });

    const token = createToken();
    sessionStore.set(token, { userId: user.id, createdAt: new Date() });

    res.status(201).json({
      data: jsonSafe({
        token,
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          nickname: user.nickname,
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

    if (!user || !user.password_hash) {
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

    const token = createToken();
    sessionStore.set(token, { userId: user.id, createdAt: new Date() });

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
  const token = getTokenFromHeader(req);

  if (token) {
    sessionStore.delete(token);
  }

  res.json({ ok: true });
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
