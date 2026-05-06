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
| GET | `/api/games` | 已发布小游戏列表 |
| GET | `/api/home/summary` | 首页运营位摘要，包括主推游戏、今日前沿、推荐卡片和学习概览 |
| POST | `/api/contact-messages` | 保存联系留言 |
| GET | `/api/frontier/summary` | 今日前沿首页摘要 |
| GET | `/api/frontier/items` | 今日前沿完整列表，支持 `category`、`grade`、分页 |
| GET | `/api/frontier/today-news` | 今日前沿当天新闻 |
| GET | `/api/frontier/items/:id` | 今日前沿详情，支持内容 ID 或 slug |
| GET | `/api/projects/rankings/current` | 当前开源项目周榜 |
| GET | `/api/projects/rankings` | 开源项目历史榜单，支持 `category` 和分页 |
| GET | `/api/projects/:id` | 开源项目详情，支持项目 ID 或 slug |
| POST | `/api/game-records` | 写入用户游戏记录 |
| GET | `/api/recommendations/:userId` | 获取用户推荐结果 |

## 本阶段 P0 优化

按照 `docs/product-operations-review.md` 的 P0 建议，本阶段已完成：

- 修复后端重复注册、登录、退出路由。
- 新增 `user_sessions` 表，登录 token 以哈希形式持久化保存，退出时标记撤销。
- 新增 `contact_messages` 表，联系我页面留言可写入数据库。
- 新增 `/api/home/summary`，首页从单纯拼接多个列表，升级为可控运营摘要接口。
- 前端统一静态资源版本号为 `20260506d`，减少缓存造成的旧页面问题。

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
