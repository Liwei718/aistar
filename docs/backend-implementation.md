# 星火 AI 科学馆后端实现说明

## 当前实现内容

本阶段已完成后端基础骨架：

- Node.js + Express API 服务。
- Prisma + PostgreSQL 数据模型。
- 完整 `prisma/schema.prisma`，覆盖用户、内容、知识库、小游戏、新闻抓取、AI 草稿、审核、开源项目、推荐、统计和审计。
- 示例 seed 数据，便于本地联调。
- 基础查询 API 和游戏记录写入 API。
- 首页运营摘要 API：用于首页固定运营位、主推游戏、今日前沿摘要和用户学习概览。
- 数据库持久化登录会话：用户登录 token 不再只保存在进程内存中，服务重启后可继续识别有效 session。
- 联系留言保存：联系我页面表单已接入后端，留言写入数据库。
- 今日前沿动态化第一版：前沿页面已从后端读取摘要、列表、当天新闻和详情数据。
- 开源项目雷达动态化第一版：项目页已从后端读取当前周榜、历史榜单和项目详情数据。
- AI 学习动态化第一版：AI 学习页已从后端读取书籍、章节、阅读任务，并支持登录用户保存阅读进度。
- 奥林匹克小游戏成绩记录第一版：小游戏完成后可写入成绩，触发学习天数、知识点完成和徽章。
- 奥林匹克小游戏排行榜第一版：每个游戏可读取 Top 10 成绩，同一用户同一游戏只展示最好成绩。
- 中小学知识库动态化第一版：知识点列表、详情、视频、任务和学习进度已接入后端。
- 科学人物动态化第一版：科学人物列表和详情已从后端 `contents` 表读取。
- 学习活动闭环第一版：首页继续学习区可读取最近学习、继续学习和收藏；内容推荐卡支持收藏和点击行为记录。
- 首页个性化推荐第一版：推荐卡按年级、兴趣、收藏、点击行为和新鲜度做轻量排序，并返回推荐理由。

## 本地启动

1. 安装依赖：

```bash
npm install
```

2. 创建环境变量：

```bash
cp .env.example .env
```

3. 修改 `.env` 中的 `DATABASE_URL`，指向本地 PostgreSQL 数据库。

4. 生成 Prisma Client：

```bash
npm run db:generate
```

5. 执行迁移：

```bash
npm run db:migrate
```

6. 写入示例数据：

```bash
npm run db:seed
```

7. 启动后端服务：

```bash
npm run dev
```

默认服务地址：

```text
http://localhost:3001
```

## 已提供 API

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/health` | 健康检查 |
| GET | `/api/contents` | 已发布内容列表 |
| GET | `/api/knowledge-points` | 已发布知识点列表 |
| GET | `/api/knowledge-points/:id` | 知识点详情，支持 ID 或 slug，返回图解步骤、视频和任务 |
| POST | `/api/knowledge-points/:id/progress` | 保存当前登录用户的知识点进度 |
| GET | `/api/games` | 已发布小游戏列表 |
| GET | `/api/games/leaderboard` | 小游戏排行榜，支持 `game_slug` 和 `limit` |
| GET | `/api/home/summary` | 首页运营位摘要，包括主推游戏、今日前沿、推荐卡片和学习概览 |
| POST | `/api/contact-messages` | 保存联系留言 |
| GET | `/api/users/me/activity` | 当前登录用户的继续学习、最近学习和收藏内容 |
| POST | `/api/contents/:id/favorite` | 收藏内容 |
| DELETE | `/api/contents/:id/favorite` | 取消收藏内容 |
| POST | `/api/contents/:id/actions` | 记录内容点击、浏览、开始学习等行为 |
| GET | `/api/frontier/summary` | 今日前沿首页摘要 |
| GET | `/api/frontier/items` | 今日前沿完整列表，支持 `category`、`grade`、分页 |
| GET | `/api/frontier/today-news` | 今日前沿当天新闻 |
| GET | `/api/frontier/items/:id` | 今日前沿详情，支持内容 ID 或 slug |
| GET | `/api/projects/rankings/current` | 当前开源项目周榜 |
| GET | `/api/projects/rankings` | 开源项目历史榜单，支持 `category` 和分页 |
| GET | `/api/projects/:id` | 开源项目详情，支持项目 ID 或 slug |
| GET | `/api/scientists` | 科学人物列表，支持 `category` 分类 |
| GET | `/api/scientists/:id` | 科学人物详情，支持人物 ID 或 slug |
| GET | `/api/ai/books` | AI 学习书籍列表，支持年级过滤和分页 |
| GET | `/api/ai/books/:slug` | AI 学习书籍详情，包含章节导读和阅读任务 |
| GET | `/api/ai/books/:slug/progress` | 当前登录用户的书籍阅读进度 |
| POST | `/api/ai/books/:slug/progress` | 保存当前登录用户的书籍阅读进度 |
| GET | `/api/users/me/growth` | 当前登录用户成长汇总，包括学习天数、连续学习、徽章和 XP |
| POST | `/api/game-records` | 写入用户游戏记录，支持 `game_id` 或 `game_slug` |
| GET | `/api/recommendations/:userId` | 获取用户推荐结果 |

## 本阶段 P0 优化

按照 `docs/product-operations-review.md` 的 P0 建议，本阶段已完成：

- 修复后端重复注册、登录、退出路由。
- 新增 `user_sessions` 表，登录 token 以哈希形式持久化保存，退出时标记撤销。
- 新增 `contact_messages` 表，联系我页面留言可写入数据库。
- 新增 `/api/home/summary`，首页从单纯拼接多个列表，升级为可控运营摘要接口。
- 前端统一静态资源版本号为 `20260507a`，减少缓存造成的旧页面问题。

## 本阶段 P1 优化

按照 `docs/product-operations-review.md` 的 P1 建议，本阶段已开始打通今日前沿动态化：

- 新增 `/api/frontier/summary`、`/api/frontier/items`、`/api/frontier/today-news`、`/api/frontier/items/:id`。
- 今日前沿数据复用 `contents` 表，`content_type=frontier_news`，分类、适合年级、为什么重要等运营字段放入 `metadata`。
- `frontier.html` 保留静态兜底内容，但页面加载后会由 `frontier.js` 自动替换为后端数据。
- `prisma/seed.js` 新增 3 条前沿示例内容，覆盖 AI、机器人、太空三个分类。

开源项目雷达动态化：

- 新增 `/api/projects/rankings/current`、`/api/projects/rankings`、`/api/projects/:id`。
- 项目榜单复用 `open_source_projects`、`project_rankings`、`project_ranking_items`。
- `projects.html` 保留静态兜底内容，但页面加载后会由 `projects.js` 自动替换为后端周榜。
- `prisma/seed.js` 新增开源项目周榜和 5 个项目示例，覆盖 AI、小游戏、科学模拟和初学者分类。

AI 学习动态化：

- 新增 `ai_books`、`ai_book_chapters`、`ai_book_tasks`、`user_book_progress` 四张表。
- 新增 `/api/ai/books`、`/api/ai/books/:slug`、`/api/ai/books/:slug/progress`。
- `ai-learning.html` 保留静态兜底内容，但页面加载后会由 `ai-learning.js` 自动替换为后端书籍、章节、任务和阅读器数据。
- 登录用户可在 AI 学习页保存阅读进度，后续可接入学习天数、连续学习、徽章和推荐体系。
- `prisma/seed.js` 新增《解锁 AI 魔法 - 和爸爸一起走进智能未来》示例书籍、4 个章节导读、4 个阅读任务和 1 条示例阅读进度。

小游戏成绩和成长体系：

- 新增 `/api/users/me/growth`，聚合知识点进度、AI 书籍进度、小游戏成绩和徽章。
- `/api/game-records` 支持登录用户通过 `game_slug` 上报成绩，后端自动识别用户并关联游戏。
- 新增 `/api/games/leaderboard`，支持按 `game_slug` 读取排行榜；排行榜只返回昵称、头像、年级和成绩，不暴露邮箱、手机号等隐私信息。
- 5 个 Kevin's Olympic 游戏页面接入 `kevin-olympic-games/olympic-tracker.js`，比赛结束时上报成绩。
- 后端在小游戏完成后写入 `game_records`，同时更新关联知识点的 `learning_progress`。
- 第一版徽章规则已接入：首次完成小游戏获得“奥林匹克初体验”，高光成绩获得“奥林匹克奖牌”，累计完成多个游戏获得“奥林匹克选手”。
- `games.html` 新增 Kevin's Olympic 排行榜区域，支持足球、守门、点球、乒乓、游泳五个项目切换。
- `prisma/seed.js` 已补齐足球冠军赛、守门员挑战、点球大战、乒乓球冠军赛、游泳竞速 5 个小游戏记录。

中小学知识库动态化：

- `knowledge.html` 从静态卡片升级为动态知识点列表，支持按年龄段、年级和学科筛选。
- 新增知识点详情面板，展示教材版本、建议学习时间、图解步骤、常见误区、视频入口和学习任务。
- 新增 `/api/knowledge-points/:id` 和 `/api/knowledge-points/:id/progress`。
- `knowledge_points.metadata` 增加视频、教材版本、年龄段和任务配置。
- 登录用户完成知识点后写入 `learning_progress`，并可触发“知识点掌握者”徽章。
- `prisma/seed.js` 新增小六数学、小六科学、初一数学、初一科学示例知识点。

科学人物动态化：

- 新增 `/api/scientists` 和 `/api/scientists/:id`。
- 科学人物复用 `contents` 表，`content_type=scientist`，人物分类、排序、贡献、关联知识、照片和讲解字段放在 `metadata`。
- `scientists.html` 页面加载后由 `scientists.js` 从后端渲染人物列表，并保留静态兜底。
- `scientist-detail.html` 页面加载后由 `scientist-detail.js` 从后端渲染人物故事、贡献、讲解、关联知识、思考题和学习启发。
- `prisma/seed.js` 新增牛顿、爱因斯坦、玛丽·居里、欧几里得、高斯、华罗庚、图灵、麦卡锡、辛顿 9 位人物示例。

学习活动闭环：

- 新增 `/api/users/me/activity`，聚合知识点进度、AI 书籍进度、小游戏成绩、内容点击行为和收藏内容。
- 新增 `/api/contents/:id/favorite` 收藏、取消收藏接口，写入 `user_favorites`。
- 新增 `/api/contents/:id/actions` 行为记录接口，写入 `user_content_actions`，为后续推荐和运营看板提供数据。
- 首页新增“继续学习”区域，登录用户可看到最近学习、继续学习和收藏后的活动反馈。
- 首页推荐卡新增“收藏”按钮和点击行为记录；未登录用户点击收藏会引导登录。

首页个性化推荐：

- `/api/home/summary` 从最新内容列表升级为候选池排序，登录用户会结合注册年级、兴趣标签、收藏、点击行为、内容标签和发布时间生成推荐分。
- 推荐卡返回 `recommendation_score` 和 `recommendation_reason`，前端用推荐理由替代原来的简单难度提示。
- 未登录用户仍展示最新发布内容，保持静态兜底体验。

本地数据库说明：

如果本地数据库已有初始表，但没有 `_prisma_migrations` 记录，需要先执行：

```bash
npx prisma migrate resolve --applied 20260501143000_init
```

然后再执行：

```bash
npx prisma migrate deploy
```

## 校验命令

```bash
npm run typecheck
npm run build
npx prisma validate
```

如果还没有创建 `.env`，可以临时指定数据库地址：

```bash
env 'DATABASE_URL=postgresql://postgres:postgres@localhost:5432/aistar?schema=public' npx prisma validate
```
