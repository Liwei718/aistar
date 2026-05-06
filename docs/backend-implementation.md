# 星火 AI 科学馆后端实现说明

## 当前实现内容

本阶段已完成后端基础骨架：

- Node.js + Express API 服务。
- Prisma + PostgreSQL 数据模型。
- 完整 `prisma/schema.prisma`，覆盖用户、内容、知识库、小游戏、新闻抓取、AI 草稿、审核、开源项目、推荐、统计和审计。
- 示例 seed 数据，便于本地联调。
- 基础查询 API 和游戏记录写入 API。

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
| POST | `/api/game-records` | 写入用户游戏记录 |
| GET | `/api/recommendations/:userId` | 获取用户推荐结果 |

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
