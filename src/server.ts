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
const adminTokenTtlHours = Number(process.env.ADMIN_TOKEN_TTL_HOURS ?? 12);
const adminSessions = new Map<string, {
  adminId: string;
  tokenHash: string;
  expiresAt: Date;
  lastSeenAt: Date;
}>();

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

const demoKnowledgeDetail = {
  ...demoKnowledgePoint,
  curriculum_concept: "力与运动",
  diagram_steps: ["观察物体速度方向", "找到引力或拉力方向", "判断速度与力如何共同改变运动"],
  common_misunderstandings: ["轨道稳定不是没有受力，而是持续受力并改变方向。"],
  examples: ["调节探测器推力，让它绕恒星稳定运动。"],
  ai_science_extension: "可以用 AI 或编程做一个简单模拟，观察速度变大或变小时轨道如何变化。",
  video: {
    title: "看懂速度和力如何形成轨道",
    url: "https://www.bilibili.com/",
    duration: "3 分钟",
    provider: "示例视频"
  },
  tasks: [
    "用一句话解释什么是稳定轨道。",
    "画出速度方向和引力方向。",
    "说出速度太小或太大时会发生什么。"
  ]
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

const demoProjectItems = [
  {
    id: "demo-project-orbit",
    rank_no: 1,
    category: "science",
    name: "Orbit Sim",
    repo_url: "https://github.com/example/orbit-sim",
    description: "一个用于理解轨道运动的开源模拟项目。",
    stars: 128,
    forks: 24,
    language: "TypeScript",
    license: "MIT",
    learning_value: "学习速度、引力、轨道稳定和简单数值模拟。",
    remix_ideas: "增加不同星球质量、轨道预测线和关卡编辑器。",
    reason: "主题和首页小游戏一致，适合边玩边改。"
  }
];

const demoAiBook = {
  id: "demo-ai-book-magic",
  title: "解锁 AI 魔法",
  subtitle: "和爸爸一起走进智能未来",
  slug: "ai-magic-with-dad",
  description: "适合亲子共读，用生活化问题理解人工智能、模型、提示词和未来能力。",
  cover_image_url: "./assets/ai-magic-cover.png",
  pdf_url: "./docs/解锁ai魔法-和爸爸一起走进智能未来.pdf",
  school_stage: "general",
  min_grade: 4,
  max_grade: 9,
  status: "published",
  sort_order: 1,
  metadata: {
    reading_minutes: 90,
    audience: "小学高年级到初中",
    theme: "AI 启蒙"
  },
  chapters: [
    {
      id: "demo-ai-chapter-1",
      chapter_no: 1,
      title: "先理解 AI 是什么",
      summary: "把 AI 看成一种会从大量例子里总结规律的工具。它不是魔法师，而是能帮我们观察、分类、生成和推理的智能伙伴。",
      key_points: ["模式识别", "数据", "智能工具"],
      sort_order: 1
    },
    {
      id: "demo-ai-chapter-2",
      chapter_no: 2,
      title: "学习怎么和 AI 对话",
      summary: "好问题会带来好答案。学习描述目标、补充背景、给出限制条件，是使用 AI 的第一项核心能力。",
      key_points: ["提示词", "背景信息", "限制条件"],
      sort_order: 2
    },
    {
      id: "demo-ai-chapter-3",
      chapter_no: 3,
      title: "练习判断 AI 的答案",
      summary: "AI 可能会答错，也可能遗漏信息。读者需要学会追问、核对来源、比较不同答案，并保留自己的判断。",
      key_points: ["追问", "核实", "独立判断"],
      sort_order: 3
    },
    {
      id: "demo-ai-chapter-4",
      chapter_no: 4,
      title: "把 AI 用到学习和创造里",
      summary: "可以让 AI 帮忙解释知识点、设计小游戏、整理读书笔记、生成创意草稿，但最后的理解和作品要由自己完成。",
      key_points: ["学习助手", "创造", "作品意识"],
      sort_order: 4
    }
  ],
  tasks: [
    {
      id: "demo-ai-task-1",
      chapter_id: null,
      task_type: "keyword",
      title: "写下 3 个关键词",
      description: "读完一节后，用自己的话写下 3 个关键词。",
      prompt: "这节里哪三个词最重要？为什么？",
      sort_order: 1
    },
    {
      id: "demo-ai-task-2",
      chapter_id: null,
      task_type: "prompt",
      title: "改写一个更清楚的问题",
      description: "向 AI 提一个更清楚的问题，再比较两次回答。",
      prompt: "把一个模糊问题改成有目标、有背景、有要求的问题。",
      sort_order: 2
    },
    {
      id: "demo-ai-task-3",
      chapter_id: null,
      task_type: "verify",
      title: "找出需要核实的地方",
      description: "找出一个 AI 回答里需要核实的地方。",
      prompt: "这段回答里哪句话需要查来源？",
      sort_order: 3
    },
    {
      id: "demo-ai-task-4",
      chapter_id: null,
      task_type: "card",
      title: "做成学习卡片",
      description: "把本章内容做成一张学习卡片。",
      prompt: "用一句话解释本章，再配一个生活例子。",
      sort_order: 4
    }
  ]
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

type HomeRecommendationCandidate = {
  id: string;
  content_type: string;
  title: string;
  subject: string | null;
  min_grade: number | null;
  max_grade: number | null;
  metadata: unknown;
  published_at: Date | null;
  created_at: Date;
  favorite_count?: bigint | number | null;
  tags?: Array<{ tag: { slug: string; name: string } }>;
};

function addSignal(signalMap: Map<string, number>, key: string | null | undefined, weight: number) {
  if (!key) return;
  signalMap.set(key, (signalMap.get(key) ?? 0) + weight);
}

function gradeMatchScore(grade: number | null | undefined, minGrade: number | null, maxGrade: number | null) {
  if (!grade) return 0.4;
  if ((minGrade === null || grade >= minGrade) && (maxGrade === null || grade <= maxGrade)) return 2;
  if (minGrade !== null && grade < minGrade) return Math.max(0, 1 - (minGrade - grade) * 0.35);
  if (maxGrade !== null && grade > maxGrade) return Math.max(0, 1 - (grade - maxGrade) * 0.35);
  return 0.4;
}

async function personalizedHomeRecommendations(
  user: { id: string; grade: number | null },
  candidates: HomeRecommendationCandidate[]
) {
  const [interests, favorites, actions] = await Promise.all([
    prisma.userInterest.findMany({
      where: { user_id: user.id },
      include: { tag: true }
    }),
    prisma.userFavorite.findMany({
      where: { user_id: user.id },
      take: 12,
      orderBy: { created_at: "desc" },
      include: {
        content: {
          include: { tags: { include: { tag: true } } }
        }
      }
    }),
    prisma.userContentAction.findMany({
      where: { user_id: user.id },
      take: 20,
      orderBy: { created_at: "desc" },
      include: {
        content: {
          include: { tags: { include: { tag: true } } }
        }
      }
    })
  ]);

  const signals = new Map<string, number>();

  for (const item of interests) {
    addSignal(signals, item.tag.slug, Number(item.weight) * 1.2);
  }

  for (const item of favorites) {
    addSignal(signals, item.content.subject, 1.2);
    addSignal(signals, categoryOf(metadataOf(item.content.metadata), undefined), 1);
    for (const tagItem of item.content.tags) addSignal(signals, tagItem.tag.slug, 1);
  }

  for (const item of actions) {
    addSignal(signals, item.content.subject, 0.7);
    addSignal(signals, categoryOf(metadataOf(item.content.metadata), undefined), 0.6);
    for (const tagItem of item.content.tags) addSignal(signals, tagItem.tag.slug, 0.55);
  }

  return candidates
    .map((item) => {
      const metadata = metadataOf(item.metadata);
      const tagSlugs = item.tags?.map((tagItem) => tagItem.tag.slug) ?? [];
      const category = categoryOf(metadata, item.subject || undefined);
      let score = gradeMatchScore(user.grade, item.min_grade, item.max_grade);

      score += signals.get(item.subject || "") ?? 0;
      score += signals.get(category) ?? 0;
      for (const slug of tagSlugs) score += signals.get(slug) ?? 0;

      const publishedAt = item.published_at || item.created_at;
      const ageDays = Math.max(0, (Date.now() - publishedAt.getTime()) / (24 * 60 * 60 * 1000));
      score += Math.max(0, 1.2 - ageDays * 0.03);
      score += Math.min(0.8, Number(item.favorite_count ?? 0) * 0.08);

      const reasons = [];
      if (user.grade && gradeMatchScore(user.grade, item.min_grade, item.max_grade) >= 2) reasons.push("年级匹配");
      if ((item.subject && signals.has(item.subject)) || signals.has(category) || tagSlugs.some((slug) => signals.has(slug))) reasons.push("贴合你的兴趣和浏览记录");
      if (ageDays < 14) reasons.push("近期更新");

      return {
        ...item,
        recommendation_score: Number(score.toFixed(3)),
        recommendation_reason: reasons.length ? reasons.join(" · ") : "适合继续探索"
      };
    })
    .sort((left, right) => right.recommendation_score - left.recommendation_score)
    .slice(0, 4);
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

function arrayOfStrings(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function knowledgeMetadata(point: { metadata?: unknown } | { plain_explanation?: string | null }) {
  if ("metadata" in point) return metadataOf(point.metadata);
  return {};
}

function knowledgePointSummary(point: {
  id: string;
  name: string;
  slug: string;
  school_stage: string;
  grade: number | null;
  subject: string;
  difficulty: string;
  curriculum_concept: string | null;
  plain_explanation: string | null;
  recommended_minutes: number | null;
  metadata?: unknown;
}) {
  const metadata = knowledgeMetadata(point);
  return {
    id: point.id,
    name: point.name,
    slug: point.slug,
    school_stage: point.school_stage,
    grade: point.grade,
    subject: point.subject,
    difficulty: point.difficulty,
    curriculum_concept: point.curriculum_concept,
    plain_explanation: point.plain_explanation,
    recommended_minutes: point.recommended_minutes,
    age_group: typeof metadata.age_group === "string" ? metadata.age_group : point.grade && point.grade <= 6 ? "age-10-12" : "age-12-13",
    textbook: typeof metadata.textbook === "string" ? metadata.textbook : point.subject === "math" ? "北师大版" : "人教社体系",
    video: metadata.video,
    href: `./knowledge.html?point=${point.slug}`
  };
}

function knowledgePointDetail(point: Parameters<typeof knowledgePointSummary>[0] & {
  diagram_steps: unknown;
  common_misunderstandings: unknown;
  examples: unknown;
  ai_science_extension: string | null;
}) {
  const metadata = knowledgeMetadata(point);
  return {
    ...knowledgePointSummary(point),
    diagram_steps: arrayOfStrings(point.diagram_steps),
    common_misunderstandings: arrayOfStrings(point.common_misunderstandings),
    examples: arrayOfStrings(point.examples),
    ai_science_extension: point.ai_science_extension,
    video: typeof metadata.video === "object" && metadata.video ? metadata.video : demoKnowledgeDetail.video,
    tasks: arrayOfStrings(metadata.tasks).length ? arrayOfStrings(metadata.tasks) : demoKnowledgeDetail.tasks
  };
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

function projectCategoryOf(project: { metadata: unknown; language: string | null; difficulty: string | null }) {
  const metadata = metadataOf(project.metadata);
  if (typeof metadata.category === "string") return metadata.category;
  if (project.difficulty === "easy") return "beginner";
  if (project.language?.toLowerCase().includes("python")) return "ai";
  return "science";
}

function projectItemFromRanking(item: {
  rank_no: number;
  reason: string | null;
  project: {
    id: string;
    name: string;
    slug: string;
    repo_url: string;
    description: string | null;
    readme_summary: string | null;
    stars: number | null;
    forks: number | null;
    language: string | null;
    license: string | null;
    difficulty: string | null;
    learning_value: string | null;
    recommend_reason: string | null;
    remix_ideas: string | null;
    metadata: unknown;
  };
}) {
  return {
    id: item.project.id,
    slug: item.project.slug,
    rank_no: item.rank_no,
    category: projectCategoryOf(item.project),
    name: item.project.name,
    repo_url: item.project.repo_url,
    description: item.project.readme_summary || item.project.description,
    stars: item.project.stars,
    forks: item.project.forks,
    language: item.project.language,
    license: item.project.license,
    difficulty: item.project.difficulty,
    learning_value: item.project.learning_value,
    remix_ideas: item.project.remix_ideas,
    reason: item.reason || item.project.recommend_reason
  };
}

function categoryLabelForScientist(category: string) {
  const labels: Record<string, string> = {
    physics: "物理学家",
    math: "数学家",
    ai: "AI 学家"
  };
  return labels[category] || "科学人物";
}

function scientistFromContent(item: {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  body: string;
  cover_image_url: string | null;
  subject: string | null;
  metadata: unknown;
}) {
  const metadata = metadataOf(item.metadata);
  const category = typeof metadata.category === "string" ? metadata.category : item.subject || "physics";
  const contributions = arrayOfStrings(metadata.contributions);
  const knowledge = arrayOfStrings(metadata.knowledge);

  return {
    id: item.id,
    slug: item.slug,
    name: typeof metadata.name === "string" ? metadata.name : item.title,
    title: item.title,
    category,
    category_label: categoryLabelForScientist(category),
    summary: item.summary,
    story: item.body,
    contribution_summary: typeof metadata.contribution_summary === "string" ? metadata.contribution_summary : contributions.join("、"),
    contributions,
    explanation: typeof metadata.explanation === "string" ? metadata.explanation : item.summary,
    knowledge,
    question: typeof metadata.question === "string" ? metadata.question : "这个人物的贡献和你正在学习的知识有什么关系？",
    inspiration: typeof metadata.inspiration === "string" ? metadata.inspiration : "用一个好问题开始探索，再用证据和方法慢慢接近答案。",
    avatar_text: typeof metadata.avatar_text === "string" ? metadata.avatar_text : item.title.slice(0, 1),
    photo_url: item.cover_image_url,
    rank: typeof metadata.rank === "number" ? metadata.rank : 999,
    photo_credit: typeof metadata.photo_credit === "string" ? metadata.photo_credit : "Wikimedia Commons",
    href: `./scientist-detail.html?id=${item.slug}`
  };
}

function aiBookSummary(book: {
  id: string;
  title: string;
  subtitle: string | null;
  slug: string;
  description: string | null;
  cover_image_url: string | null;
  pdf_url: string | null;
  school_stage: string | null;
  min_grade: number | null;
  max_grade: number | null;
  status: string;
  sort_order: number;
  metadata: unknown;
}) {
  return {
    id: book.id,
    title: book.title,
    subtitle: book.subtitle,
    slug: book.slug,
    description: book.description,
    cover_image_url: book.cover_image_url,
    pdf_url: book.pdf_url,
    school_stage: book.school_stage,
    min_grade: book.min_grade,
    max_grade: book.max_grade,
    status: book.status,
    sort_order: book.sort_order,
    metadata: metadataOf(book.metadata),
    href: `./ai-learning.html?book=${book.slug}`
  };
}

function aiBookDetail(book: Parameters<typeof aiBookSummary>[0] & {
  chapters?: Array<{
    id: string;
    chapter_no: number;
    title: string;
    summary: string | null;
    key_points: unknown;
    sort_order: number;
  }>;
  tasks?: Array<{
    id: string;
    chapter_id: string | null;
    task_type: string;
    title: string;
    description: string | null;
    prompt: string | null;
    sort_order: number;
  }>;
}) {
  return {
    ...aiBookSummary(book),
    chapters: book.chapters?.map((chapter) => ({
      ...chapter,
      key_points: Array.isArray(chapter.key_points) ? chapter.key_points : []
    })) ?? [],
    tasks: book.tasks ?? []
  };
}

function learningDateKey(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  })
    .formatToParts(date)
    .reduce<Record<string, string>>((result, part) => {
      result[part.type] = part.value;
      return result;
    }, {});

  return `${parts.year}-${parts.month}-${parts.day}`;
}

function addDays(date: Date, offset: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + offset);
  return next;
}

function calculateStreak(dateKeys: Set<string>) {
  const today = new Date();
  const todayKey = learningDateKey(today);
  const yesterdayKey = learningDateKey(addDays(today, -1));

  if (!dateKeys.has(todayKey) && !dateKeys.has(yesterdayKey)) {
    return 0;
  }

  let cursor = dateKeys.has(todayKey) ? today : addDays(today, -1);
  let streak = 0;

  while (dateKeys.has(learningDateKey(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
}

function calculateLongestStreak(dateKeys: Set<string>) {
  const sorted = [...dateKeys].sort();
  let longest = 0;
  let current = 0;
  let previous = "";

  for (const key of sorted) {
    if (!previous) {
      current = 1;
    } else {
      const previousDate = new Date(`${previous}T00:00:00+08:00`);
      const expected = learningDateKey(addDays(previousDate, 1));
      current = key === expected ? current + 1 : 1;
    }

    longest = Math.max(longest, current);
    previous = key;
  }

  return longest;
}

async function growthSummaryForUser(userId: string) {
  const [learningProgress, bookProgress, gameRecords, badges] = await Promise.all([
    prisma.learningProgress.findMany({
      where: { user_id: userId }
    }),
    prisma.userBookProgress.findMany({
      where: { user_id: userId }
    }),
    prisma.gameRecord.findMany({
      where: { user_id: userId }
    }),
    prisma.userBadge.findMany({
      where: { user_id: userId },
      include: { badge: true },
      orderBy: { earned_at: "desc" }
    })
  ]);

  const effectiveDates = new Set<string>();

  for (const item of learningProgress) {
    if (!["completed", "mastered"].includes(item.status)) continue;
    const date = item.last_activity_at || item.completed_at || item.created_at;
    effectiveDates.add(learningDateKey(date));
  }

  for (const item of bookProgress) {
    if (item.progress_percent <= 0) continue;
    const date = item.last_read_at || item.completed_at || item.created_at;
    effectiveDates.add(learningDateKey(date));
  }

  for (const item of gameRecords) {
    if (item.status !== "completed") continue;
    const date = item.completed_at || item.created_at;
    effectiveDates.add(learningDateKey(date));
  }

  const completedKnowledgeCount = learningProgress.filter((item) =>
    ["completed", "mastered"].includes(item.status)
  ).length;
  const masteredKnowledgeCount = learningProgress.filter((item) => item.status === "mastered").length;
  const completedGameCount = gameRecords.filter((item) => item.status === "completed").length;
  const completedBookCount = bookProgress.filter((item) => item.status === "completed").length;
  const totalLearningSeconds =
    gameRecords.reduce((total, item) => total + (item.duration_seconds || 0), 0) +
    bookProgress.reduce((total, item) => total + Math.max(0, item.progress_percent) * 30, 0);
  const totalXp =
    completedGameCount * 25 +
    completedKnowledgeCount * 40 +
    masteredKnowledgeCount * 60 +
    completedBookCount * 80 +
    badges.length * 20;
  const level = Math.max(1, Math.floor(totalXp / 120) + 1);
  const currentXp = totalXp % 120;

  return {
    learning_days: effectiveDates.size,
    streak_days: calculateStreak(effectiveDates),
    longest_streak_days: calculateLongestStreak(effectiveDates),
    badge_count: badges.length,
    completed_knowledge_count: completedKnowledgeCount,
    mastered_knowledge_points: masteredKnowledgeCount,
    completed_game_count: completedGameCount,
    completed_book_count: completedBookCount,
    total_learning_seconds: totalLearningSeconds,
    level,
    total_xp: totalXp,
    current_xp: currentXp,
    next_level_xp: 120,
    badges: badges.slice(0, 3).map((item) => ({
      name: item.badge.name,
      slug: item.badge.slug,
      description: item.badge.description,
      earned_at: item.earned_at
    }))
  };
}

async function awardBadge(userId: string, slug: string, badge: { name: string; description: string }, source: {
  source_type: string;
  source_id: string;
}) {
  const badgeRecord = await prisma.badge.upsert({
    where: { slug },
    update: {
      name: badge.name,
      description: badge.description,
      enabled: true
    },
    create: {
      slug,
      name: badge.name,
      description: badge.description,
      enabled: true,
      rule_config: { source: "auto_game_record" }
    }
  });

  await prisma.userBadge.upsert({
    where: {
      user_id_badge_id: {
        user_id: userId,
        badge_id: badgeRecord.id
      }
    },
    update: {},
    create: {
      user_id: userId,
      badge_id: badgeRecord.id,
      source_type: source.source_type,
      source_id: source.source_id
    }
  });
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

function adminExpiresAt() {
  return new Date(Date.now() + adminTokenTtlHours * 60 * 60 * 1000);
}

async function ensureDefaultAdmin() {
  const email = process.env.ADMIN_EMAIL ?? "admin@aistar.local";
  const password = process.env.ADMIN_PASSWORD ?? "admin123456";
  const name = process.env.ADMIN_NAME ?? "星火运营员";

  return prisma.adminUser.upsert({
    where: { email },
    update: {
      name,
      role: "owner",
      status: "active"
    },
    create: {
      email,
      password_hash: hashPassword(password),
      name,
      role: "owner",
      status: "active"
    }
  });
}

async function issueAdminSession(adminId: string) {
  const token = createToken();
  const now = new Date();
  adminSessions.set(hashToken(token), {
    adminId,
    tokenHash: hashToken(token),
    expiresAt: adminExpiresAt(),
    lastSeenAt: now
  });

  return token;
}

async function findCurrentAdmin(req: express.Request) {
  const token = getTokenFromHeader(req);
  if (!token) return null;

  const tokenHash = hashToken(token);
  const session = adminSessions.get(tokenHash);
  if (!session || session.expiresAt <= new Date()) {
    adminSessions.delete(tokenHash);
    return null;
  }

  const admin = await prisma.adminUser.findFirst({
    where: {
      id: session.adminId,
      status: "active"
    }
  });

  if (!admin) {
    adminSessions.delete(tokenHash);
    return null;
  }

  session.lastSeenAt = new Date();
  return admin;
}

async function requireAdmin(req: express.Request, res: express.Response) {
  const admin = await findCurrentAdmin(req);
  if (!admin) {
    res.status(401).json({ error: "admin_unauthorized", message: "需要管理员登录后访问运营后台" });
    return null;
  }

  return admin;
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
        <li><a href="/api/games/leaderboard">GET /api/games/leaderboard</a>：小游戏排行榜，需要数据库连接</li>
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
      { method: "GET", path: "/api/knowledge-points/:id", description: "知识点详情" },
      { method: "POST", path: "/api/knowledge-points/:id/progress", description: "保存当前用户知识点学习进度" },
      { method: "GET", path: "/api/games", description: "已发布小游戏列表" },
      { method: "GET", path: "/api/games/leaderboard", description: "小游戏排行榜，支持 game_slug 和 limit" },
      { method: "GET", path: "/api/home/summary", description: "首页运营位摘要" },
      { method: "GET", path: "/api/users/me/growth", description: "当前用户学习成长汇总" },
      { method: "GET", path: "/api/users/me/activity", description: "当前用户继续学习、最近学习和收藏" },
      { method: "POST", path: "/api/admin/auth/login", description: "管理员登录" },
      { method: "GET", path: "/api/admin/auth/me", description: "当前管理员信息" },
      { method: "POST", path: "/api/admin/auth/logout", description: "管理员退出" },
      { method: "GET", path: "/api/admin/dashboard", description: "运营后台首页看板数据" },
      { method: "GET", path: "/api/admin/contents", description: "后台内容列表" },
      { method: "PATCH", path: "/api/admin/contents/:id", description: "后台更新内容标题、摘要和状态" },
      { method: "POST", path: "/api/admin/review-tasks/:id/decision", description: "后台审核通过或退回任务" },
      { method: "GET", path: "/api/frontier/summary", description: "今日前沿首页摘要" },
      { method: "GET", path: "/api/frontier/items", description: "今日前沿完整列表" },
      { method: "GET", path: "/api/frontier/today-news", description: "今日前沿当天新闻" },
      { method: "GET", path: "/api/frontier/items/:id", description: "今日前沿详情" },
      { method: "GET", path: "/api/projects/rankings/current", description: "当前开源项目周榜" },
      { method: "GET", path: "/api/projects/rankings", description: "开源项目历史榜单" },
      { method: "GET", path: "/api/projects/:id", description: "开源项目详情" },
      { method: "GET", path: "/api/scientists", description: "科学人物列表" },
      { method: "GET", path: "/api/scientists/:id", description: "科学人物详情" },
      { method: "GET", path: "/api/ai/books", description: "AI 学习书籍列表" },
      { method: "GET", path: "/api/ai/books/:slug", description: "AI 学习书籍详情、章节和任务" },
      { method: "GET", path: "/api/ai/books/:slug/progress", description: "当前用户 AI 书籍阅读进度" },
      { method: "POST", path: "/api/ai/books/:slug/progress", description: "保存当前用户 AI 书籍阅读进度" },
      { method: "POST", path: "/api/contents/:id/favorite", description: "收藏内容" },
      { method: "DELETE", path: "/api/contents/:id/favorite", description: "取消收藏内容" },
      { method: "POST", path: "/api/contents/:id/actions", description: "记录内容点击、浏览等行为" },
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

app.post("/api/admin/auth/login", async (req, res, next) => {
  try {
    const body = z
      .object({
        email: z.string().email().max(255),
        password: z.string().min(6).max(64)
      })
      .parse(req.body);

    await ensureDefaultAdmin();
    const admin = await prisma.adminUser.findFirst({
      where: {
        email: body.email,
        status: "active"
      }
    });

    if (!admin?.password_hash) {
      res.status(401).json({ error: "invalid_credentials", message: "管理员账号或密码错误" });
      return;
    }

    const hashedInput = hashPassword(body.password);
    const sameLength = admin.password_hash.length === hashedInput.length;
    const passwordOk =
      sameLength && timingSafeEqual(Buffer.from(admin.password_hash), Buffer.from(hashedInput));

    if (!passwordOk) {
      res.status(401).json({ error: "invalid_credentials", message: "管理员账号或密码错误" });
      return;
    }

    await prisma.adminUser.update({
      where: { id: admin.id },
      data: { last_login_at: new Date() }
    });

    const token = await issueAdminSession(admin.id);
    res.json({
      data: {
        token,
        admin: {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: admin.role
        }
      }
    });
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      res.status(503).json({ error: "database_unavailable", message: "管理员登录需要数据库连接。" });
      return;
    }

    next(error);
  }
});

app.get("/api/admin/auth/me", async (req, res, next) => {
  try {
    const admin = await findCurrentAdmin(req);
    res.json({
      data: admin
        ? {
            id: admin.id,
            email: admin.email,
            name: admin.name,
            role: admin.role
          }
        : null
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/admin/auth/logout", async (req, res) => {
  const token = getTokenFromHeader(req);
  if (token) adminSessions.delete(hashToken(token));
  res.json({ ok: true });
});

app.get("/api/users/me/growth", async (req, res, next) => {
  try {
    const currentUser = await findCurrentUser(req);
    if (!currentUser) {
      res.status(401).json({ error: "unauthorized", message: "登录后才能查看成长数据" });
      return;
    }

    res.json(jsonSafe({ data: await growthSummaryForUser(currentUser.id) }));
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      res.status(503).json({ error: "database_unavailable", message: "读取成长数据需要数据库连接。" });
      return;
    }

    next(error);
  }
});

app.get("/api/users/me/activity", async (req, res, next) => {
  try {
    const currentUser = await findCurrentUser(req);
    if (!currentUser) {
      res.status(401).json({ error: "unauthorized", message: "登录后才能查看学习记录" });
      return;
    }

    const [knowledgeProgress, bookProgress, gameRecords, favorites, contentActions] = await Promise.all([
      prisma.learningProgress.findMany({
        where: { user_id: currentUser.id },
        orderBy: [{ last_activity_at: "desc" }, { updated_at: "desc" }],
        take: 8,
        include: { knowledge_point: true }
      }),
      prisma.userBookProgress.findMany({
        where: { user_id: currentUser.id },
        orderBy: [{ last_read_at: "desc" }, { updated_at: "desc" }],
        take: 8,
        include: { book: true, chapter: true }
      }),
      prisma.gameRecord.findMany({
        where: { user_id: currentUser.id, status: "completed" },
        orderBy: [{ completed_at: "desc" }, { created_at: "desc" }],
        take: 8,
        include: { game: true }
      }),
      prisma.userFavorite.findMany({
        where: { user_id: currentUser.id },
        orderBy: { created_at: "desc" },
        take: 6,
        include: { content: true }
      }),
      prisma.userContentAction.findMany({
        where: { user_id: currentUser.id },
        orderBy: { created_at: "desc" },
        take: 8,
        include: { content: true }
      })
    ]);

    const knowledgeItems = knowledgeProgress.map((item) => ({
      type: "knowledge",
      title: item.knowledge_point.name,
      summary: item.knowledge_point.plain_explanation,
      status: item.status,
      progress_percent: item.progress_percent,
      href: "./knowledge.html",
      occurred_at: item.last_activity_at || item.updated_at
    }));

    const bookItems = bookProgress.map((item) => ({
      type: "ai_book",
      title: item.book.title,
      summary: item.chapter?.title || item.book.subtitle || "继续阅读 AI 学习内容",
      status: item.status,
      progress_percent: item.progress_percent,
      href: "./ai-learning.html",
      occurred_at: item.last_read_at || item.updated_at
    }));

    const gameItems = gameRecords.map((item) => ({
      type: "game",
      title: item.game.name,
      summary: `成绩 ${item.score ?? 0}${item.max_score ? `/${item.max_score}` : ""}`,
      status: item.status,
      score: item.score,
      href: "./games.html",
      occurred_at: item.completed_at || item.created_at
    }));

    const actionItems = contentActions.map((item) => ({
      type: "content_action",
      title: item.content.title,
      summary: item.content.summary,
      action_type: item.action_type,
      href: contentHref(item.content.content_type),
      occurred_at: item.created_at
    }));

    const recent_learning = [...knowledgeItems, ...bookItems, ...gameItems, ...actionItems]
      .sort((left, right) => new Date(right.occurred_at).getTime() - new Date(left.occurred_at).getTime())
      .slice(0, 8);

    const continue_learning = [...knowledgeItems, ...bookItems]
      .filter((item) => !["completed", "mastered"].includes(String(item.status)) && Number(item.progress_percent || 0) < 100)
      .sort((left, right) => Number(right.progress_percent || 0) - Number(left.progress_percent || 0))
      .slice(0, 3);

    res.json(jsonSafe({
      data: {
        continue_learning,
        recent_learning,
        favorites: favorites.map((item) => ({
          id: item.content.id,
          title: item.content.title,
          summary: item.content.summary,
          content_type: item.content.content_type,
          href: contentHref(item.content.content_type),
          created_at: item.created_at
        }))
      }
    }));
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      res.status(503).json({ error: "database_unavailable", message: "读取学习记录需要数据库连接。" });
      return;
    }

    next(error);
  }
});

app.get("/api/home/summary", async (req, res, next) => {
  try {
    const currentUser = await findCurrentUser(req);

    const [frontierContents, recommendationCandidates, featuredGame, growth] = await Promise.all([
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
        take: 24,
        include: {
          tags: { include: { tag: true } }
        }
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
      currentUser ? growthSummaryForUser(currentUser.id) : Promise.resolve(null)
    ]);

    const recommendations = currentUser
      ? await personalizedHomeRecommendations(currentUser, recommendationCandidates)
      : recommendationCandidates.slice(0, 4);

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
        learning_summary: growth || demoHomeSummary.learning_summary
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

app.get("/api/admin/dashboard", async (req, res, next) => {
  try {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    const since7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [
      totalUsers,
      newUsers7d,
      publishedContents,
      knowledgePoints,
      completedProgress,
      gameCompletions,
      favorites,
      contentClicks,
      pendingReviews,
      generatedDrafts,
      contentTypeGroups,
      topContents,
      recentActions,
      recentGames,
      reviewQueue
    ] = await Promise.all([
      prisma.user.count({ where: { status: "active" } }),
      prisma.user.count({ where: { status: "active", created_at: { gte: since7Days } } }),
      prisma.content.count({ where: { status: "published", deleted_at: null } }),
      prisma.knowledgePoint.count({ where: { status: "published", deleted_at: null } }),
      prisma.learningProgress.count({ where: { status: { in: ["completed", "mastered"] } } }),
      prisma.gameRecord.count({ where: { status: "completed" } }),
      prisma.userFavorite.count(),
      prisma.userContentAction.count({ where: { action_type: "click" } }),
      prisma.reviewTask.count({ where: { status: "pending" } }),
      prisma.aiDraft.count({ where: { status: "generated" } }),
      prisma.content.groupBy({
        by: ["content_type"],
        where: { status: "published", deleted_at: null },
        _count: { _all: true },
        orderBy: { _count: { content_type: "desc" } }
      }),
      prisma.content.findMany({
        where: { status: "published", deleted_at: null },
        orderBy: [{ favorite_count: "desc" }, { view_count: "desc" }, { published_at: "desc" }],
        take: 6,
        select: {
          id: true,
          title: true,
          content_type: true,
          view_count: true,
          favorite_count: true,
          published_at: true
        }
      }),
      prisma.userContentAction.findMany({
        orderBy: { created_at: "desc" },
        take: 8,
        include: {
          user: { select: { nickname: true, grade: true } },
          content: { select: { title: true, content_type: true } }
        }
      }),
      prisma.gameRecord.findMany({
        where: { status: "completed" },
        orderBy: [{ completed_at: "desc" }, { created_at: "desc" }],
        take: 6,
        include: {
          user: { select: { nickname: true, grade: true } },
          game: { select: { name: true, slug: true } }
        }
      }),
      prisma.reviewTask.findMany({
        where: { status: "pending" },
        orderBy: [{ priority: "desc" }, { submitted_at: "asc" }],
        take: 6
      })
    ]);

    res.json(jsonSafe({
      data: {
        metrics: {
          total_users: totalUsers,
          new_users_7d: newUsers7d,
          published_contents: publishedContents,
          knowledge_points: knowledgePoints,
          completed_progress: completedProgress,
          game_completions: gameCompletions,
          favorites,
          content_clicks: contentClicks,
          pending_reviews: pendingReviews,
          generated_drafts: generatedDrafts
        },
        content_types: contentTypeGroups.map((item) => ({
          content_type: item.content_type,
          count: item._count._all
        })),
        top_contents: topContents,
        recent_actions: recentActions.map((item) => ({
          id: item.id,
          action_type: item.action_type,
          user: item.user,
          content: item.content,
          created_at: item.created_at
        })),
        recent_games: recentGames.map((item) => ({
          id: item.id,
          user: item.user,
          game: item.game,
          score: item.score,
          max_score: item.max_score,
          completed_at: item.completed_at || item.created_at
        })),
        review_queue: reviewQueue
      }
    }));
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      res.json({
        data: {
          metrics: {
            total_users: 0,
            new_users_7d: 0,
            published_contents: 0,
            knowledge_points: 0,
            completed_progress: 0,
            game_completions: 0,
            favorites: 0,
            content_clicks: 0,
            pending_reviews: 0,
            generated_drafts: 0
          },
          content_types: [],
          top_contents: [],
          recent_actions: [],
          recent_games: [],
          review_queue: []
        },
        mode: "demo",
        warning: "database_unavailable"
      });
      return;
    }

    next(error);
  }
});

app.get("/api/admin/contents", async (req, res, next) => {
  try {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    const query = listQuerySchema
      .extend({
        status: z.enum(["all", "draft", "pending_review", "published", "offline", "rejected"]).default("all"),
        content_type: z.string().optional()
      })
      .parse(req.query);

    const contents = await prisma.content.findMany({
      where: {
        deleted_at: null,
        ...(query.status === "all" ? {} : { status: query.status as never }),
        ...(query.content_type ? { content_type: query.content_type as never } : {})
      },
      orderBy: [{ updated_at: "desc" }, { created_at: "desc" }],
      take: query.limit,
      skip: query.offset,
      select: {
        id: true,
        content_type: true,
        title: true,
        summary: true,
        school_stage: true,
        min_grade: true,
        max_grade: true,
        subject: true,
        difficulty: true,
        status: true,
        published_at: true,
        view_count: true,
        favorite_count: true,
        updated_at: true,
        editor: {
          select: {
            name: true
          }
        }
      }
    });

    res.json(jsonSafe({ data: contents }));
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      res.status(503).json({ error: "database_unavailable", message: "读取后台内容列表需要数据库连接。" });
      return;
    }

    next(error);
  }
});

app.patch("/api/admin/contents/:id", async (req, res, next) => {
  try {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    const params = z.object({ id: z.string().uuid() }).parse(req.params);
    const body = z
      .object({
        title: z.string().min(2).max(200).optional(),
        summary: z.string().max(1000).nullable().optional(),
        status: z.enum(["draft", "pending_review", "published", "offline", "rejected"]).optional()
      })
      .parse(req.body);

    const content = await prisma.content.findFirst({
      where: {
        id: params.id,
        deleted_at: null
      }
    });

    if (!content) {
      res.status(404).json({ error: "not_found", message: "未找到内容" });
      return;
    }

    const updated = await prisma.content.update({
      where: { id: params.id },
      data: {
        ...(body.title !== undefined ? { title: body.title } : {}),
        ...(body.summary !== undefined ? { summary: body.summary } : {}),
        ...(body.status !== undefined
          ? {
              status: body.status as never,
              published_at: body.status === "published" && !content.published_at ? new Date() : content.published_at,
              offline_at: body.status === "offline" ? new Date() : content.offline_at
            }
          : {}),
        editor_id: admin.id
      }
    });

    res.json(jsonSafe({ data: updated }));
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      res.status(503).json({ error: "database_unavailable", message: "更新后台内容需要数据库连接。" });
      return;
    }

    next(error);
  }
});

app.post("/api/admin/review-tasks/:id/decision", async (req, res, next) => {
  try {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    const params = z.object({ id: z.string().uuid() }).parse(req.params);
    const body = z
      .object({
        decision: z.enum(["approve", "return", "reject"]),
        comment: z.string().max(1000).optional()
      })
      .parse(req.body);

    const task = await prisma.reviewTask.findUnique({
      where: { id: params.id }
    });

    if (!task) {
      res.status(404).json({ error: "not_found", message: "未找到审核任务" });
      return;
    }

    if (task.status !== "pending") {
      res.status(409).json({ error: "already_reviewed", message: "该任务已经处理过" });
      return;
    }

    const nextStatus = body.decision === "approve" ? "approved" : body.decision === "reject" ? "rejected" : "returned";
    const now = new Date();

    const [updatedTask] = await prisma.$transaction(async (tx) => {
      if (task.target_type === "content") {
        await tx.content.updateMany({
          where: {
            id: task.target_id,
            deleted_at: null
          },
          data: {
            status: body.decision === "approve" ? "published" : body.decision === "reject" ? "rejected" : "draft",
            published_at: body.decision === "approve" ? now : undefined,
            editor_id: admin.id
          }
        });
      }

      const reviewTask = await tx.reviewTask.update({
        where: { id: task.id },
        data: {
          status: nextStatus as never,
          reviewed_by_id: admin.id,
          reviewed_at: now,
          review_comment: body.comment || null
        }
      });

      return [reviewTask];
    });

    res.json(jsonSafe({ data: updatedTask }));
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      res.status(503).json({ error: "database_unavailable", message: "处理审核任务需要数据库连接。" });
      return;
    }

    next(error);
  }
});

app.post("/api/contents/:id/favorite", async (req, res, next) => {
  try {
    const currentUser = await findCurrentUser(req);
    if (!currentUser) {
      res.status(401).json({ error: "unauthorized", message: "登录后才能收藏内容" });
      return;
    }

    const params = z.object({ id: z.string().uuid() }).parse(req.params);
    const content = await prisma.content.findFirst({
      where: { id: params.id, status: "published", deleted_at: null }
    });

    if (!content) {
      res.status(404).json({ error: "not_found", message: "未找到可收藏内容" });
      return;
    }

    const favorite = await prisma.userFavorite.upsert({
      where: {
        user_id_content_id: {
          user_id: currentUser.id,
          content_id: content.id
        }
      },
      update: {},
      create: {
        user_id: currentUser.id,
        content_id: content.id
      }
    });

    res.status(201).json(jsonSafe({ data: favorite }));
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      res.status(503).json({ error: "database_unavailable", message: "收藏内容需要数据库连接。" });
      return;
    }

    next(error);
  }
});

app.delete("/api/contents/:id/favorite", async (req, res, next) => {
  try {
    const currentUser = await findCurrentUser(req);
    if (!currentUser) {
      res.status(401).json({ error: "unauthorized", message: "登录后才能取消收藏" });
      return;
    }

    const params = z.object({ id: z.string().uuid() }).parse(req.params);
    await prisma.userFavorite.deleteMany({
      where: {
        user_id: currentUser.id,
        content_id: params.id
      }
    });

    res.json({ ok: true });
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      res.status(503).json({ error: "database_unavailable", message: "取消收藏需要数据库连接。" });
      return;
    }

    next(error);
  }
});

app.post("/api/contents/:id/actions", async (req, res, next) => {
  try {
    const currentUser = await findCurrentUser(req);
    if (!currentUser) {
      res.status(401).json({ error: "unauthorized", message: "登录后才能记录学习行为" });
      return;
    }

    const params = z.object({ id: z.string().uuid() }).parse(req.params);
    const body = z
      .object({
        action_type: z.enum(["view", "click", "start", "complete", "share"]).default("click"),
        duration_seconds: z.number().int().min(0).optional(),
        metadata: z.unknown().optional()
      })
      .parse(req.body);

    const content = await prisma.content.findFirst({
      where: { id: params.id, status: "published", deleted_at: null }
    });

    if (!content) {
      res.status(404).json({ error: "not_found", message: "未找到内容" });
      return;
    }

    const action = await prisma.userContentAction.create({
      data: {
        user_id: currentUser.id,
        content_id: content.id,
        action_type: body.action_type,
        duration_seconds: body.duration_seconds,
        metadata: body.metadata ?? undefined
      }
    });

    res.status(201).json(jsonSafe({ data: action }));
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      res.status(503).json({ error: "database_unavailable", message: "记录行为需要数据库连接。" });
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

app.get("/api/projects/rankings/current", async (_req, res, next) => {
  try {
    const ranking = await prisma.projectRanking.findFirst({
      where: {
        enabled: true,
        ranking_type: "weekly_growth"
      },
      orderBy: { created_at: "desc" },
      include: {
        items: {
          orderBy: { rank_no: "asc" },
          include: { project: true }
        }
      }
    });

    res.json(jsonSafe({
      data: ranking
        ? {
            id: ranking.id,
            name: ranking.name,
            ranking_type: ranking.ranking_type,
            description: ranking.description,
            created_at: ranking.created_at,
            items: ranking.items.map(projectItemFromRanking)
          }
        : {
            id: "demo-project-ranking",
            name: "示例开源项目周榜",
            ranking_type: "weekly_growth",
            description: "数据库暂无榜单时展示的示例数据。",
            items: demoProjectItems
          },
      mode: ranking ? "live" : "demo"
    }));
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      res.json({
        data: {
          id: "demo-project-ranking",
          name: "示例开源项目周榜",
          ranking_type: "weekly_growth",
          description: "数据库不可用时展示的示例数据。",
          items: demoProjectItems
        },
        mode: "demo",
        warning: "database_unavailable"
      });
      return;
    }

    next(error);
  }
});

app.get("/api/projects/rankings", async (req, res, next) => {
  try {
    const query = listQuerySchema
      .extend({
        category: z.string().optional()
      })
      .parse(req.query);

    const rankings = await prisma.projectRanking.findMany({
      where: {
        enabled: true,
        ranking_type: "weekly_growth"
      },
      orderBy: { created_at: "desc" },
      take: query.limit,
      skip: query.offset,
      include: {
        items: {
          orderBy: { rank_no: "asc" },
          include: { project: true }
        }
      }
    });

    res.json(jsonSafe({
      data: rankings.map((ranking) => ({
        id: ranking.id,
        name: ranking.name,
        ranking_type: ranking.ranking_type,
        description: ranking.description,
        created_at: ranking.created_at,
        items: ranking.items
          .map(projectItemFromRanking)
          .filter((item) => !query.category || query.category === "all" || item.category === query.category)
      })),
      mode: rankings.length ? "live" : "demo"
    }));
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      res.json({ data: [], mode: "demo", warning: "database_unavailable" });
      return;
    }

    next(error);
  }
});

app.get("/api/projects/:id", async (req, res, next) => {
  try {
    const params = z.object({ id: z.string() }).parse(req.params);
    const project = await prisma.openSourceProject.findFirst({
      where: {
        OR: [
          z.string().uuid().safeParse(params.id).success ? { id: params.id } : undefined,
          { slug: params.id }
        ].filter(Boolean) as Array<{ id?: string; slug?: string }>,
        status: "published",
        deleted_at: null
      },
      include: {
        knowledge_points: { include: { knowledge_point: true } },
        ranking_items: { include: { ranking: true } }
      }
    });

    if (!project) {
      res.status(404).json({ error: "not_found", message: "未找到这个开源项目" });
      return;
    }

    res.json(jsonSafe({
      data: {
        ...project,
        category: projectCategoryOf(project),
        related_knowledge: project.knowledge_points.map((item) => item.knowledge_point.name),
        rankings: project.ranking_items.map((item) => ({
          ranking_id: item.ranking_id,
          ranking_name: item.ranking.name,
          rank_no: item.rank_no
        }))
      }
    }));
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      res.status(503).json({ error: "database_unavailable", message: "读取项目详情需要数据库连接。" });
      return;
    }

    next(error);
  }
});

app.get("/api/scientists", async (req, res, next) => {
  try {
    const query = listQuerySchema
      .extend({
        category: z.string().optional()
      })
      .parse(req.query);

    const contents = await prisma.content.findMany({
      where: {
        status: "published",
        deleted_at: null,
        content_type: "scientist"
      },
      orderBy: [{ created_at: "asc" }],
      take: query.limit,
      skip: query.offset
    });

    const data = contents
      .map(scientistFromContent)
      .filter((item) => !query.category || query.category === "all" || item.category === query.category)
      .sort((a, b) => a.rank - b.rank);

    res.json(jsonSafe({ data, mode: data.length ? "live" : "demo" }));
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      res.json({ data: [], mode: "demo", warning: "database_unavailable" });
      return;
    }

    next(error);
  }
});

app.get("/api/scientists/:id", async (req, res, next) => {
  try {
    const params = z.object({ id: z.string() }).parse(req.params);
    const content = await prisma.content.findFirst({
      where: {
        OR: [
          z.string().uuid().safeParse(params.id).success ? { id: params.id } : undefined,
          { slug: params.id }
        ].filter(Boolean) as Array<{ id?: string; slug?: string }>,
        status: "published",
        deleted_at: null,
        content_type: "scientist"
      }
    });

    if (!content) {
      res.status(404).json({ error: "not_found", message: "未找到这位科学人物" });
      return;
    }

    res.json(jsonSafe({ data: scientistFromContent(content), mode: "live" }));
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      res.status(503).json({ error: "database_unavailable", message: "读取科学人物详情需要数据库连接。" });
      return;
    }

    next(error);
  }
});

app.get("/api/ai/books", async (req, res, next) => {
  try {
    const query = listQuerySchema
      .extend({
        stage: z.string().optional(),
        grade: z.coerce.number().int().min(1).max(12).optional()
      })
      .parse(req.query);

    const books = await prisma.aiBook.findMany({
      where: {
        status: "published",
        deleted_at: null,
        school_stage: query.stage as never,
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
      orderBy: [{ sort_order: "asc" }, { created_at: "desc" }],
      take: query.limit,
      skip: query.offset
    });

    res.json(jsonSafe({
      data: books.length ? books.map(aiBookSummary) : [aiBookSummary(demoAiBook)],
      mode: books.length ? "live" : "demo"
    }));
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      res.json({ data: [aiBookSummary(demoAiBook)], mode: "demo", warning: "database_unavailable" });
      return;
    }

    next(error);
  }
});

app.get("/api/ai/books/:slug", async (req, res, next) => {
  try {
    const params = z.object({ slug: z.string() }).parse(req.params);
    const book = await prisma.aiBook.findFirst({
      where: {
        OR: [
          z.string().uuid().safeParse(params.slug).success ? { id: params.slug } : undefined,
          { slug: params.slug }
        ].filter(Boolean) as Array<{ id?: string; slug?: string }>,
        status: "published",
        deleted_at: null
      },
      include: {
        chapters: {
          where: { status: "published" },
          orderBy: [{ sort_order: "asc" }, { chapter_no: "asc" }]
        },
        tasks: {
          where: { status: "published" },
          orderBy: [{ sort_order: "asc" }, { created_at: "asc" }]
        }
      }
    });

    if (!book) {
      if (params.slug === demoAiBook.slug || params.slug === demoAiBook.id) {
        res.json({ data: aiBookDetail(demoAiBook), mode: "demo" });
        return;
      }

      res.status(404).json({ error: "not_found", message: "未找到这本 AI 学习书籍" });
      return;
    }

    res.json(jsonSafe({ data: aiBookDetail(book), mode: "live" }));
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      res.json({ data: aiBookDetail(demoAiBook), mode: "demo", warning: "database_unavailable" });
      return;
    }

    next(error);
  }
});

app.get("/api/ai/books/:slug/progress", async (req, res, next) => {
  try {
    const currentUser = await findCurrentUser(req);
    if (!currentUser) {
      res.status(401).json({ error: "unauthorized", message: "登录后才能读取阅读进度" });
      return;
    }

    const params = z.object({ slug: z.string() }).parse(req.params);
    const book = await prisma.aiBook.findFirst({
      where: {
        OR: [
          z.string().uuid().safeParse(params.slug).success ? { id: params.slug } : undefined,
          { slug: params.slug }
        ].filter(Boolean) as Array<{ id?: string; slug?: string }>,
        deleted_at: null
      }
    });

    if (!book) {
      res.status(404).json({ error: "not_found", message: "未找到这本 AI 学习书籍" });
      return;
    }

    const progress = await prisma.userBookProgress.findMany({
      where: {
        user_id: currentUser.id,
        book_id: book.id
      },
      orderBy: [{ updated_at: "desc" }]
    });

    res.json(jsonSafe({ data: progress }));
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      res.status(503).json({ error: "database_unavailable", message: "读取阅读进度需要数据库连接。" });
      return;
    }

    next(error);
  }
});

app.post("/api/ai/books/:slug/progress", async (req, res, next) => {
  try {
    const currentUser = await findCurrentUser(req);
    if (!currentUser) {
      res.status(401).json({ error: "unauthorized", message: "登录后才能保存阅读进度" });
      return;
    }

    const params = z.object({ slug: z.string() }).parse(req.params);
    const body = z
      .object({
        chapter_id: z.string().uuid().optional().nullable(),
        progress_percent: z.coerce.number().int().min(0).max(100),
        status: z.enum(["not_started", "reading", "completed"]).optional(),
        notes: z.string().max(2000).optional()
      })
      .parse(req.body);

    const book = await prisma.aiBook.findFirst({
      where: {
        OR: [
          z.string().uuid().safeParse(params.slug).success ? { id: params.slug } : undefined,
          { slug: params.slug }
        ].filter(Boolean) as Array<{ id?: string; slug?: string }>,
        deleted_at: null
      }
    });

    if (!book) {
      res.status(404).json({ error: "not_found", message: "未找到这本 AI 学习书籍" });
      return;
    }

    const status = body.status ?? (body.progress_percent >= 100 ? "completed" : "reading");
    const progressWhere = {
      user_id: currentUser.id,
      book_id: book.id,
      chapter_id: body.chapter_id ?? null
    };
    const existingProgress = await prisma.userBookProgress.findFirst({
      where: progressWhere
    });

    const progress = existingProgress
      ? await prisma.userBookProgress.update({
          where: { id: existingProgress.id },
          data: {
            progress_percent: body.progress_percent,
            status,
            notes: body.notes,
            last_read_at: new Date(),
            completed_at: status === "completed" ? new Date() : null
          }
        })
      : await prisma.userBookProgress.create({
          data: {
            user_id: currentUser.id,
            book_id: book.id,
            chapter_id: body.chapter_id ?? null,
            progress_percent: body.progress_percent,
            status,
            notes: body.notes,
            last_read_at: new Date(),
            completed_at: status === "completed" ? new Date() : undefined
          }
        });

    res.json(jsonSafe({ data: progress }));
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      res.status(503).json({
        error: "database_unavailable",
        message: "保存阅读进度需要先启动 PostgreSQL 并执行 Prisma 迁移。"
      });
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

    res.json(jsonSafe({
      data: knowledgePoints.length ? knowledgePoints.map(knowledgePointSummary) : [knowledgePointSummary(demoKnowledgeDetail)],
      mode: knowledgePoints.length ? "live" : "demo"
    }));
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      res.json({ data: [knowledgePointSummary(demoKnowledgeDetail)], mode: "demo", warning: "database_unavailable" });
      return;
    }

    next(error);
  }
});

app.get("/api/knowledge-points/:id", async (req, res, next) => {
  try {
    const params = z.object({ id: z.string() }).parse(req.params);
    const point = await prisma.knowledgePoint.findFirst({
      where: {
        OR: [
          z.string().uuid().safeParse(params.id).success ? { id: params.id } : undefined,
          { slug: params.id }
        ].filter(Boolean) as Array<{ id?: string; slug?: string }>,
        status: "published",
        deleted_at: null
      }
    });

    if (!point) {
      if (params.id === demoKnowledgeDetail.slug || params.id === demoKnowledgeDetail.id) {
        res.json({ data: demoKnowledgeDetail, mode: "demo" });
        return;
      }

      res.status(404).json({ error: "not_found", message: "未找到这个知识点" });
      return;
    }

    res.json(jsonSafe({ data: knowledgePointDetail(point), mode: "live" }));
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      res.json({ data: demoKnowledgeDetail, mode: "demo", warning: "database_unavailable" });
      return;
    }

    next(error);
  }
});

app.post("/api/knowledge-points/:id/progress", async (req, res, next) => {
  try {
    const currentUser = await findCurrentUser(req);
    if (!currentUser) {
      res.status(401).json({ error: "unauthorized", message: "登录后才能保存知识点进度" });
      return;
    }

    const params = z.object({ id: z.string() }).parse(req.params);
    const body = z
      .object({
        status: z.enum(["not_started", "learning", "completed", "mastered"]).default("completed"),
        progress_percent: z.coerce.number().int().min(0).max(100).default(100),
        mastery_score: z.coerce.number().min(0).max(100).optional()
      })
      .parse(req.body);

    const point = await prisma.knowledgePoint.findFirst({
      where: {
        OR: [
          z.string().uuid().safeParse(params.id).success ? { id: params.id } : undefined,
          { slug: params.id }
        ].filter(Boolean) as Array<{ id?: string; slug?: string }>,
        status: "published",
        deleted_at: null
      }
    });

    if (!point) {
      res.status(404).json({ error: "not_found", message: "未找到这个知识点" });
      return;
    }

    const now = new Date();
    const progress = await prisma.learningProgress.upsert({
      where: {
        user_id_knowledge_point_id: {
          user_id: currentUser.id,
          knowledge_point_id: point.id
        }
      },
      update: {
        status: body.status,
        progress_percent: body.progress_percent,
        mastery_score: body.mastery_score,
        last_activity_at: now,
        completed_at: ["completed", "mastered"].includes(body.status) ? now : null,
        source_type: "knowledge_point",
        source_id: point.id
      },
      create: {
        user_id: currentUser.id,
        knowledge_point_id: point.id,
        status: body.status,
        progress_percent: body.progress_percent,
        mastery_score: body.mastery_score,
        last_activity_at: now,
        completed_at: ["completed", "mastered"].includes(body.status) ? now : undefined,
        source_type: "knowledge_point",
        source_id: point.id
      }
    });

    if (body.status === "mastered") {
      await awardBadge(currentUser.id, "knowledge-master", {
        name: "知识点掌握者",
        description: "掌握了一个重点知识点。"
      }, {
        source_type: "knowledge_point",
        source_id: point.id
      });
    }

    res.json(jsonSafe({ data: progress }));
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      res.status(503).json({
        error: "database_unavailable",
        message: "保存知识点进度需要先启动 PostgreSQL 并执行 Prisma 迁移。"
      });
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

app.get("/api/games/leaderboard", async (req, res, next) => {
  try {
    const query = z
      .object({
        game_slug: z.string().max(180).optional(),
        limit: z.coerce.number().int().min(1).max(50).default(10)
      })
      .parse(req.query);

    const records = await prisma.gameRecord.findMany({
      where: {
        status: "completed",
        game: {
          status: "published",
          deleted_at: null,
          ...(query.game_slug ? { slug: query.game_slug } : {})
        }
      },
      orderBy: [
        { score: "desc" },
        { completed_at: "asc" },
        { created_at: "asc" }
      ],
      take: 300,
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            avatar_url: true,
            school_stage: true,
            grade: true
          }
        },
        game: {
          select: {
            id: true,
            name: true,
            slug: true,
            entry_url: true
          }
        }
      }
    });

    const bestByUserAndGame = new Map<string, (typeof records)[number]>();
    for (const record of records) {
      const key = `${record.game_id}:${record.user_id}`;
      const current = bestByUserAndGame.get(key);
      const recordDuration = record.duration_seconds ?? Number.MAX_SAFE_INTEGER;
      const currentDuration = current?.duration_seconds ?? Number.MAX_SAFE_INTEGER;
      const recordScore = record.score ?? 0;
      const currentScore = current?.score ?? 0;

      if (
        !current ||
        recordScore > currentScore ||
        (recordScore === currentScore && recordDuration < currentDuration)
      ) {
        bestByUserAndGame.set(key, record);
      }
    }

    const rankedRecords = Array.from(bestByUserAndGame.values())
      .sort((left, right) => {
        const scoreDiff = (right.score ?? 0) - (left.score ?? 0);
        if (scoreDiff !== 0) return scoreDiff;
        const durationDiff = (left.duration_seconds ?? Number.MAX_SAFE_INTEGER) - (right.duration_seconds ?? Number.MAX_SAFE_INTEGER);
        if (durationDiff !== 0) return durationDiff;
        return (left.completed_at?.getTime() ?? left.created_at.getTime()) - (right.completed_at?.getTime() ?? right.created_at.getTime());
      })
      .slice(0, query.limit)
      .map((record, index) => {
        const metadata = record.metadata && typeof record.metadata === "object" && !Array.isArray(record.metadata)
          ? record.metadata as Record<string, unknown>
          : {};

        return {
          rank: index + 1,
          id: record.id,
          game: record.game,
          player: {
            nickname: record.user.nickname,
            avatar_url: record.user.avatar_url,
            school_stage: record.user.school_stage,
            grade: record.user.grade
          },
          score: record.score,
          max_score: record.max_score,
          duration_seconds: record.duration_seconds,
          completed_at: record.completed_at,
          result: typeof metadata.result === "string" ? metadata.result : null
        };
      });

    res.json(jsonSafe({ data: rankedRecords }));
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      res.json({ data: [], mode: "demo", warning: "database_unavailable" });
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
        user_id: z.string().uuid().optional(),
        game_id: z.string().uuid().optional(),
        game_slug: z.string().max(180).optional(),
        level_id: z.string().uuid().optional(),
        score: z.number().int().optional(),
        max_score: z.number().int().optional(),
        status: z.enum(["started", "completed", "failed", "abandoned"]),
        duration_seconds: z.number().int().min(0).optional(),
        mistakes: z.unknown().optional(),
        metadata: z.unknown().optional()
      })
      .parse(req.body);

    const currentUser = await findCurrentUser(req);
    const userId = currentUser?.id || body.user_id;
    if (!userId) {
      res.status(401).json({ error: "unauthorized", message: "需要登录后再提交游戏记录" });
      return;
    }

    const game = body.game_id || body.game_slug
      ? await prisma.game.findFirst({
          where: {
            OR: [
              body.game_id ? { id: body.game_id } : undefined,
              body.game_slug ? { slug: body.game_slug } : undefined
            ].filter(Boolean) as Array<{ id?: string; slug?: string }>,
            deleted_at: null
          },
          include: {
            knowledge_points: { include: { knowledge_point: true } }
          }
        })
      : null;

    if (!game) {
      res.status(404).json({ error: "not_found", message: "未找到对应小游戏" });
      return;
    }

    const now = new Date();
    const record = await prisma.gameRecord.create({
      data: {
        user_id: userId,
        game_id: game.id,
        level_id: body.level_id,
        score: body.score,
        max_score: body.max_score,
        status: body.status,
        duration_seconds: body.duration_seconds,
        learned_knowledge_point_ids: game?.knowledge_points.map((item) => item.knowledge_point_id) || [],
        started_at: body.status === "started" ? now : undefined,
        completed_at: body.status === "completed" ? now : undefined,
        mistakes: body.mistakes ?? undefined,
        metadata: body.metadata ?? undefined
      }
    });

    if (body.status === "completed") {
      await awardBadge(userId, "first-game-complete", {
        name: "奥林匹克初体验",
        description: "第一次完成 Kevin's Olympic 游戏。"
      }, {
        source_type: "game_record",
        source_id: record.id
      });

      const completedCount = await prisma.gameRecord.count({
        where: {
          user_id: userId,
          status: "completed"
        }
      });

      if (completedCount >= 5) {
        await awardBadge(userId, "olympic-athlete", {
          name: "奥林匹克选手",
          description: "完成了多个 Kevin's Olympic 游戏。"
        }, {
          source_type: "game_record",
          source_id: record.id
        });
      }

      const resultText = typeof body.metadata === "object" && body.metadata && "result" in body.metadata
        ? String((body.metadata as Record<string, unknown>).result)
        : "";
      if (["win", "champion", "gold", "silver", "bronze"].includes(resultText)) {
        await awardBadge(userId, "olympic-medalist", {
          name: "奥林匹克奖牌",
          description: "在 Kevin's Olympic 中拿到了一次高光成绩。"
        }, {
          source_type: "game_record",
          source_id: record.id
        });
      }
    }

    if (game?.knowledge_points.length) {
      for (const item of game.knowledge_points) {
        await prisma.learningProgress.upsert({
          where: {
            user_id_knowledge_point_id: {
              user_id: userId,
              knowledge_point_id: item.knowledge_point_id
            }
          },
          update: {
            status: "completed",
            progress_percent: 100,
            last_activity_at: now,
            completed_at: now,
            source_type: "game_record",
            source_id: record.id
          },
          create: {
            user_id: userId,
            knowledge_point_id: item.knowledge_point_id,
            status: "completed",
            progress_percent: 100,
            last_activity_at: now,
            completed_at: now,
            source_type: "game_record",
            source_id: record.id
          }
        });
      }
    }

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
