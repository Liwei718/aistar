# 星火 AI 科学馆后台需求说明书

## 1. 项目目标

星火 AI 科学馆后台用于支撑青少年 AI、科学与中小学知识学习网站的内容更新、用户学习、小游戏记录和个性化推荐。

后台的核心目标：

- 自动获取 AI、机器人、太空、开源项目等前沿内容。
- 将自动获取内容转为可审核、可编辑、可发布的内容草稿。
- 管理中小学知识点、AI 学习内容、科学人物和小游戏。
- 保存用户学习进度、小游戏成绩、收藏、徽章和推荐结果。
- 通过规则推荐为不同年级、兴趣和学习进度的用户提供个性化内容。

## 2. 后台核心板块

### 2.1 内容中心 CMS

内容中心统一管理网站所有可发布内容。

管理对象包括：

- 今日前沿新闻
- 开源项目介绍
- 中小学知识点拆解
- AI 学习
- 科学人物文章
- 小游戏说明
- 联系留言
- 学习路径与任务卡

每条内容应支持：

- 标题
- 摘要
- 正文
- 封面图
- 内容类型
- 年级阶段
- 学科
- 难度
- 兴趣标签
- 关联知识点
- 关联小游戏
- 来源链接
- 作者或编辑
- 发布状态
- 发布时间

内容状态：

- 草稿
- 待审核
- 已发布
- 已下架

### 2.2 新闻自动获取任务

系统需要定时抓取可信来源的前沿内容，并进入审核队列。第一版要求每 2 小时执行一次抓取任务，优先覆盖 AI、机器人、太空探索和开源项目四类内容。

支持来源：

- 官方 AI 公司博客
- 研究机构发布页
- RSS 信息源
- GitHub Trending
- Hugging Face
- arXiv
- 科技媒体

前沿分类：

| 分类 | 展示名称 | 典型来源 | 展示重点 |
| --- | --- | --- | --- |
| `ai` | AI 前沿 | OpenAI、Google DeepMind、Anthropic、Meta AI、Hugging Face、arXiv AI 论文 | 大模型、智能体、多模态、AI 安全、端侧 AI |
| `robotics` | 机器人前沿 | Boston Dynamics、MIT CSAIL、Stanford、IEEE Spectrum Robotics | 仿生机器人、工业机器人、机器人学习、传感器 |
| `space` | 太空前沿 | NASA、ESA、SpaceX、JWST、天文台新闻 | 探测器、望远镜、火箭、行星、宇宙观测 |
| `opensource` | 开源项目 | GitHub Trending、Hugging Face Spaces、Papers with Code | 可试玩、可 Fork、适合学生改造的项目 |

自动任务流程：

```text
每 2 小时定时触发
  ↓
读取新闻源
  ↓
抓取标题、链接、摘要、发布时间、来源
  ↓
去重与基础过滤
  ↓
AI 生成青少年版摘要、课内知识关联、标签
  ↓
生成审核任务
  ↓
管理员修改 / 通过
  ↓
发布到今日前沿
```

抓取内容不得直接发布，必须经过审核。

#### 2.2.1 青少年摘要生成要求

AI 生成的摘要不是普通新闻摘要，而是面向中小学生的“看得懂、能联系课内知识”的解释。

每条前沿内容需要生成：

- 一句话标题：尽量避免生僻术语。
- 青少年版摘要：80-160 字，用类比解释核心变化。
- 分类：AI 前沿、机器人前沿、太空前沿或开源项目。
- 关联课内知识：例如信息处理、力与运动、宇宙与天体、算法与编程。
- 适合年级：小学高年级、初中、高中或通用。
- 关键词标签：用于筛选和推荐。
- 为什么重要：1-2 句话说明和学生学习的关系。
- 风险提示：如果是 AI 生成内容，需要提示可能存在不确定性，等待人工审核。

摘要风格：

- 用中小学生能理解的词汇。
- 先讲“发生了什么”，再讲“和你学的什么知识有关”。
- 不堆论文术语，不直接复制原文。
- 保留原始来源链接，方便审核员追溯。

#### 2.2.2 首页展示与完整列表

首页的“今日前沿”只展示 3 条精选摘要，属于总览入口，不承担完整新闻列表功能。点击顶部导航“今日前沿”或首页“更多前沿”后，进入独立的今日前沿页面，由该页面承载分类筛选、完整列表和详情入口。

首页摘要选择规则：

- 每个主分类优先展示 1 条，避免全部都是 AI 新闻。
- 优先选择已审核、发布时间最近、适合用户年级的内容。
- 如果用户已登录，优先匹配兴趣标签和学习进度。
- 如果某分类当天没有新内容，可以展示最近 3 天的高质量内容。

独立“今日前沿”页面或专区需要分类展示：

- 全部
- AI 前沿
- 机器人
- 太空
- 开源项目
- 当天新闻

接口建议：

```text
GET /api/frontier/summary
GET /api/frontier/items?category=ai&limit=20&offset=0
GET /api/frontier/today-news?age_group=bridge&grade=6
```

`GET /api/frontier/summary` 用于首页 3 条摘要卡片。

`GET /api/frontier/items` 用于完整今日前沿专区，支持分类、分页和年级过滤。

`GET /api/frontier/today-news` 用于今日前沿页面的当天新闻区块，返回当天已审核、已转写成青少年摘要的新闻。

### 2.3 AI 学习

AI 学习是独立页面，放在顶部导航“首页”之后，替代原“AI 难题”板块。该页面用于承载 AI 启蒙书籍、网页版导读、PDF 在线阅读、章节学习任务和后续书籍书架。

首批上线书籍：

- 《解锁 AI 魔法 - 和爸爸一起走进智能未来》

页面需要包括：

- 书籍列表 / 书架：展示已上线书籍，并为后续书籍预留位置。
- 书籍导读：将书籍内容整理成适合中小学生阅读的学习路径、关键词和任务。
- 在线阅读：支持直接打开或嵌入 PDF 原文。
- 阅读任务：每本书可配置阅读任务、思考题、学习卡片和完成记录。
- 后续扩展：支持多本书、章节目录、阅读进度、收藏、徽章和推荐。

后端建议新增或复用内容表支持：

- `ai_books`：AI 学习书籍。
- `ai_book_chapters`：书籍章节。
- `ai_book_tasks`：章节任务与思考题。
- `user_book_progress`：用户阅读进度。

第一版前端可先用静态页面接入 PDF 和导读内容，后续再接后台内容管理。

### 2.4 Hermes 对话

Hermes 对话是网站新增独立板块，用于连接用户电脑本机部署的 Hermes 模型，提供站内聊天沟通能力。

第一版采用后端代理方式：

- 前端页面：`hermes.html`。
- 后端检测接口：`GET /api/hermes/status`。
- 后端对话接口：`POST /api/hermes/chat`。
- 后端通过 `.env` 配置本机 Hermes 地址、模型名和接口格式。

环境变量：

- `HERMES_API_BASE_URL`：本机 Hermes 服务地址，默认 `http://localhost:11434`。
- `HERMES_MODEL`：模型名称，默认 `hermes3`。
- `HERMES_API_FORMAT`：接口格式，支持 `cli`、`auto`、`ollama`、`openai`。
- `HERMES_CLI_PATH`：Hermes CLI 路径，`cli` 模式下使用。
- `HERMES_API_KEY`：可选，如果本机服务启用了鉴权则填写。

前端页面需要展示：

- 服务地址、模型名和连接状态。
- 对话消息列表。
- 输入框、发送按钮、清空按钮。
- 连接失败时给出明确提示，指导用户启动本机 Hermes 服务。

### 2.5 开源项目雷达

开源项目雷达用于发现和管理适合青少年学习、试玩和改造的开源项目。首页只展示“本周开源项目”摘要入口，点击后进入独立开源项目页面。完整页面展示本周 GitHub 星星数量增长最快的 10 个项目，并支持查询历史榜单。

第一版要求：

- 每周自动从 GitHub 获取星星数量增长最快的 10 个项目。
- 每个项目必须保存名称、仓库地址、功能介绍、Stars、Forks、主要语言和 License。
- 通过 AI 生成中小学生能看懂的项目功能介绍、学习价值和适合改造方向。
- 每周榜单需要持久化保存，历史项目和历史榜单都可以查询。
- 抓取结果进入审核队列，审核后在前台展示。

自动获取信息包括：

- 项目名称
- 项目简介
- GitHub / Hugging Face 链接
- Stars
- Forks
- 编程语言
- 更新时间
- README 摘要
- License

人工编辑信息包括：

- 适合年级
- 学习难度
- 能学到什么
- 推荐理由
- 适合如何改造
- 关联学科
- 关联小游戏或任务

榜单类型：

- 本周星标增长最快
- 本周值得 Fork
- 适合初学者
- AI 小工具
- 小游戏项目
- 物理模拟项目
- 数学可视化项目

自动任务流程：

```text
每周定时触发
  ↓
调用 GitHub Search / Trending 数据源
  ↓
拉取候选项目基础信息、README、Stars、Forks、语言、License
  ↓
计算本周 star_growth = 本周 Stars - 上周 Stars
  ↓
选出增长最快的 10 个项目
  ↓
AI 生成项目功能介绍、学习价值、适合年级、改造建议
  ↓
生成开源项目审核任务
  ↓
管理员审核 / 编辑
  ↓
发布到开源项目雷达，并保存本周历史榜单
```

接口建议：

```text
GET /api/projects/weekly-top?limit=10
GET /api/projects/rankings?week=2026-W18
GET /api/projects/:slug
```

`GET /api/projects/weekly-top` 用于开源项目页面展示本周增长最快 Top 10。

`GET /api/projects/rankings` 用于历史榜单查询，需要支持周次、分类和分页。

### 2.5 中小学知识库

知识库按年龄段、学习阶段、年级、学科、教材版本和重点知识板块组织。首页只保留推荐入口，点击“中小学知识”后进入独立知识库页面。

第一版重点整理深圳小学六年级和初中一年级内容：

- 地区：深圳。
- 年龄段：10-12 岁、小升初衔接、12-13 岁。
- 年级：小学六年级、初中一年级。
- 数学教材：北师大版。
- 科学教材：人教社体系；如果学校实际使用人教鄂教版或其他深圳常用版本，后台需要支持教材版本校准。
- 展示方式：按重点知识板块呈现，不直接堆教材章节。

页面结构要求：

- 首层按年龄段展示。
- 第二层按学科展示。
- 第三层按重点知识板块展示。
- 第四层进入知识点详情。

学习阶段：

- 小学
- 初中
- 高中

年龄段划分：

| 年龄段 | 对应年级 | 展示重点 |
| --- | --- | --- |
| 10-12 岁 | 小学五至六年级，第一版重点小六 | 用直观图形、生活问题和实验观察建立概念 |
| 小升初衔接 | 小六下至初一上 | 从具体算术、观察实验过渡到符号表达、变量和科学探究 |
| 12-13 岁 | 初中一年级 | 强化抽象表达、逻辑推理、实验设计和数据解释 |

学科：

- 数学
- 物理
- 化学
- 生物
- 信息科技
- 语文逻辑表达
- 英语科技阅读

每个知识点包含：

- 知识点名称
- 所属年级
- 年龄段
- 所属学科
- 地区
- 教材版本
- 重点知识板块
- 难度
- 课内概念
- 易懂解释
- 图解步骤
- 常见误区
- 例题或任务
- 关联 AI / 科学延伸
- 关联小游戏
- 推荐学习时长

知识库页面应当至少包含：

- 年龄段切换条。
- 年级与学科筛选。
- 教材版本标签。
- 重点知识板块卡片。
- 当天视频推荐。
- 知识点详情入口。
- 与小游戏、人物、前沿内容的关联入口。

当天视频：

- 视频可以来自自建视频、B 站 / YouTube 等外部链接，或后续自动生成的短讲解视频。
- 每条视频都必须关联至少一个知识点或重点知识板块。
- 知识库页面优先展示适合当前年龄段、年级和兴趣的 3 条视频。
- 视频卡片应展示标题、时长、适合年级、关联知识点、来源和是否已审核。
- 新闻统一放到“今日前沿”页面展示，知识库只保留关联入口。

第一版重点知识板块：

| 年龄段 | 年级 | 学科 | 教材版本 | 重点知识板块 |
| --- | --- | --- | --- | --- |
| 10-12 岁 / 小升初衔接 | 小学六年级 | 数学 | 北师大版 | 圆、分数混合运算、观察物体、百分数、数据处理、比、百分数应用 |
| 10-12 岁 / 小升初衔接 | 小学六年级 | 科学 | 人教社体系 | 物质变化、能量、电与磁、生命与环境、地球与宇宙、科学探究 |
| 小升初衔接 / 12-13 岁 | 初中一年级 | 数学 | 北师大版 | 丰富的图形世界、有理数及其运算、整式及其加减、一元一次方程、数据收集与整理 |
| 小升初衔接 / 12-13 岁 | 初中一年级 | 科学 | 人教社体系 | 科学探究方法、显微观察、生命系统、物质性质、能量基础、地球系统 |

知识库页面接口建议：

```text
GET /api/knowledge-map?region=shenzhen&age_group=bridge&grades=6,7&subjects=math,science
GET /api/knowledge-points?grade=6&subject=math&textbook=beishida
GET /api/knowledge-points/:slug
GET /api/knowledge-videos?age_group=bridge&grade=6
```

`GET /api/knowledge-map` 用于独立知识库页面按板块展示。

`GET /api/knowledge-points` 用于某个年级、学科、教材版本下的知识点列表。

`GET /api/knowledge-points/:slug` 用于知识点详情页，返回课内概念、图解、误区、例题、关联内容和推荐学习时长。

`GET /api/knowledge-videos` 用于知识库页面的“今日视频”区块，返回适合该年龄段的知识讲解视频。

### 2.5 小游戏与学习进度

后台需要管理小游戏、关卡、知识点关联和用户游戏记录。

奥林匹克小游戏独立成页，不堆叠在首页主视觉区。游戏系列命名为 `Kevin's Olympic Games`，进入“奥林匹克小游戏”页面后需要呈现轻量运动会风格。首页右侧只保留一个主推游戏，区域标题统一展示为 `Kevin's Olympic Games`，副标题显示当前主推游戏名称；完整小游戏列表进入“奥林匹克小游戏”页面。小游戏页面桌面端采用横向双列布局，同时展示两个小游戏；移动端自动折叠为单列，保证操作按钮和游戏画面不拥挤。

小游戏信息包括：

- 游戏名称
- 游戏简介
- 游戏类型
- 适合年级
- 难度
- 关联知识点
- 关联学科
- 游戏入口
- 封面图
- 状态

第一版前端小游戏：

- `Kevin's Olympic - Football Championship`：足球 5v5 对抗，训练空间观察、传球决策和射门时机。
- `Kevin's Olympic - Goalkeeper Challenge`：守门员挑战，训练反应速度、方向预判和移动控制。
- `Kevin's Olympic - Penalty Shootout`：点球大战，训练瞄准、力度控制、概率判断和心理博弈。
- `Kevin's Olympic - Table Tennis Championship`：乒乓球冠军赛，训练反应、节奏、角度预判和连续操作。
- `Kevin's Olympic - Swimming Race`：游泳竞速，训练节奏控制、体力分配和持续专注。

游戏记录包括：

- 用户
- 游戏
- 关卡
- 分数
- 完成状态
- 完成时间
- 错误点
- 学到的知识点

小游戏数据用于：

- 学习地图进度
- 个性化推荐
- 徽章发放
- 后台统计

### 2.6 用户系统

用户系统支持登录、个人资料和学习数据管理。

用户资料包括：

- 昵称
- 年级或学习阶段
- 兴趣方向
- 可选性别
- 学习偏好
- 创建时间
- 最近登录时间

性别仅作为可选偏好，不作为内容访问限制依据。

用户数据包括：

- 浏览历史
- 收藏内容
- 学习进度
- 游戏成绩
- 徽章
- 推荐记录

### 2.7 个性化推荐系统

第一版使用规则推荐，不做复杂机器学习推荐。

推荐依据：

- 年级
- 学科
- 兴趣标签
- 最近浏览内容
- 收藏内容
- 游戏进度
- 知识点掌握情况

推荐内容类型：

- 今日推荐知识点
- 推荐小游戏
- 推荐科学人物
- 推荐开源项目
- 推荐前沿新闻
- 推荐学习路径节点

推荐原则：

- 优先匹配年级难度。
- 优先推荐用户感兴趣的方向。
- 结合最近行为推荐下一步。
- 不因性别限制任何知识内容。
- 女性用户可以看到更多多元榜样内容，但所有用户都可访问全部内容。

### 2.8 科学人物馆

科学人物馆独立成页，不放在首页主体内容中。首页只保留“科学人物馆”入口和推荐摘要卡片。

第一版人物分类：

- 物理学家：讲解力、运动、能量、光、电磁、宇宙等相关人物。
- 数学家：讲解几何、代数、数论、统计、数学建模等相关人物。
- AI 学家：讲解计算机科学、算法、人工智能、机器学习、深度学习等相关人物。

每个人物内容包括：

- 人物姓名。
- 人物头像：`portrait_url`，用于科学人物馆卡片和详情页展示；第一版可使用 Wikimedia Commons 等公开授权图片，接入内容库后替换为正式审核图片。
- 头像来源信息：`portrait_source_url`、`portrait_author`、`portrait_license`，用于版权追踪和页面来源说明。
- 人物分类：物理、数学、AI。
- 青少年版人物故事。
- 核心贡献。
- 关联课内知识。
- 关键问题：他 / 她当时想解决什么问题。
- 学习启发：学生可以从这个人物身上学到什么方法。
- 推荐年级。
- 相关内容、小游戏或知识点链接。

交互要求：

- 科学人物列表页每个人物以卡片展示，整张卡片可点击。
- 点击人物卡片进入人物详情页，详情页展示“他 / 她是谁、主要贡献、贡献讲解、关联知识、思考问题、学习启发”。
- 第一版前端可用静态内容渲染，后端接入后由 `GET /api/scientists/:slug` 返回详情数据。

接口建议：

```text
GET /api/scientists?category=physics
GET /api/scientists/:slug
```

第一版静态示例人物：

| 分类 | 人物 | 展示重点 |
| --- | --- | --- |
| 物理学家 | 牛顿 | 力与运动、万有引力、数学建模 |
| 物理学家 | 爱因斯坦 | 光、速度、时空、宇宙观测 |
| 物理学家 | 居里夫人 | 放射性、物质结构、实验精神 |
| 数学家 | 欧几里得 | 几何、公理、逻辑证明 |
| 数学家 | 高斯 | 数论、统计、函数思想 |
| 数学家 | 华罗庚 | 数学应用、优化、建模 |
| AI 学家 | 图灵 | 算法、计算、机器能否思考 |
| AI 学家 | 麦卡锡 | 人工智能、符号推理、问题求解 |
| AI 学家 | 辛顿 | 神经网络、深度学习、模式识别 |

### 2.9 联系我与留言反馈

“联系我”独立成页，不放在首页主体内容中。页面用于收集家长、老师和学生的反馈、合作意向、内容建议和问题报告。

页面展示邮箱：`kevin_time_space@163.com`。

第一版前端字段：

- 称呼：`name`，可选。
- 联系方式：`contact`，必填，支持邮箱、手机号或微信。
- 留言内容：`message`，必填。
- 来源页面：`source_path`，默认记录当前页面路径。
- 当前用户：`user_id`，登录后可关联用户。

处理要求：

- 未接入后端前，前端只显示本地确认提示。
- 接入后端后，留言保存为待处理状态，后台可标记“待跟进、已回复、已关闭”。
- 管理员回复前不得在公开页面展示联系方式和留言原文。

接口建议：

```text
POST /api/contact-messages
GET /api/admin/contact-messages?status=pending
PATCH /api/admin/contact-messages/:id
```

### 2.10 AI 内容加工模块

AI 模块用于辅助编辑，不直接自动发布。

AI 可生成：

- 青少年版新闻摘要
- 课内知识关联
- 内容标签
- 难题拆解步骤
- 常见误区
- 小游戏后的知识总结
- 开源项目学习价值说明

所有 AI 生成内容必须进入审核队列。

## 3. 后台管理功能

后台管理端应包含以下菜单：

- 内容管理
- 新闻抓取管理
- 开源项目管理
- 知识库管理
- 小游戏管理
- 用户管理
- 审核队列
- 推荐规则管理
- 数据统计
- 系统配置

### 3.1 审核队列

审核队列用于处理自动抓取和 AI 生成内容。

审核操作：

- 查看原始来源
- 查看 AI 生成草稿
- 编辑标题、摘要、正文、标签
- 通过并发布
- 退回修改
- 删除
- 标记为不适合青少年

### 3.2 新闻源管理

新闻源管理用于维护自动抓取来源。

新闻源字段：

- 名称
- 类型
- URL
- 抓取频率
- 是否启用
- 默认标签
- 可信等级
- 最近抓取时间
- 最近抓取结果

### 3.3 数据统计

统计指标包括：

- 内容发布数量
- 自动抓取数量
- 审核通过率
- 用户活跃数
- 游戏游玩次数
- 知识点完成率
- 热门内容
- 热门小游戏
- 推荐点击率

## 4. 推荐技术架构

第一版推荐架构：

- 前端：Next.js
- 后端 API：Next.js API Routes 或独立 Node.js 服务
- 数据库：PostgreSQL
- ORM：Prisma
- 定时任务：Cron
- 队列：Redis + BullMQ
- 后台管理：自建 Admin
- AI 内容加工：OpenAI API 或其他模型 API
- 文件资源：本地存储或对象存储

## 5. 核心数据表

建议数据表：

- `users`：用户
- `contents`：统一内容表
- `content_tags`：内容标签
- `knowledge_points`：知识点
- `games`：小游戏
- `game_levels`：游戏关卡
- `game_records`：用户游戏记录
- `learning_progress`：学习进度
- `news_sources`：新闻来源
- `news_items`：抓取新闻
- `open_source_projects`：开源项目
- `review_tasks`：审核任务
- `recommendations`：推荐结果
- `badges`：徽章
- `user_badges`：用户徽章

## 6. MVP 范围

第一阶段优先实现：

- 用户登录与个人资料
- 内容中心 CMS
- 新闻自动抓取
- AI 内容加工草稿
- 审核队列
- 开源项目雷达
- 中小学知识库基础管理
- 小游戏信息管理
- 游戏记录保存
- 规则推荐

暂不实现：

- 完整社区
- 私信
- 开放评论
- 复杂机器学习推荐
- 自动无审核发布

## 7. 验收标准

后台第一版完成后应满足：

- 管理员可以创建、编辑、审核和发布内容。
- 系统可以定时抓取新闻源，并生成待审核草稿。
- 抓取内容可以去重，避免重复进入审核队列。
- AI 可以生成青少年版摘要、标签和课内知识关联。
- 管理员可以管理开源项目、知识点和小游戏。
- 用户登录后可以保存学习进度、游戏成绩和收藏。
- 推荐系统可以根据年级、兴趣和学习记录返回内容。
- 性别为可选字段，不会限制用户访问任何内容。
- 所有自动抓取和 AI 生成内容发布前必须审核。

## 8. 数据库详细设计

### 8.1 设计原则

数据库第一版采用 PostgreSQL，ORM 采用 Prisma。设计目标是先支撑 MVP，同时保留后续扩展空间。

核心原则：

- 使用统一内容表承载新闻、文章、实验、学习路径节点等可发布内容。
- 使用关系表管理标签、知识点、小游戏、开源项目之间的多对多关系。
- 自动抓取原始数据、AI 生成草稿、人工审核结果分开保存，保证可追溯。
- 用户行为数据按事件和结果拆分，既支持学习进度，也支持后台统计和推荐。
- 所有重要业务表保留 `created_at`、`updated_at`，需要软删除的表增加 `deleted_at`。
- 对外展示内容只读取 `published` 状态数据，后台可读取完整状态。
- 性别只作为可选资料字段，不参与权限、内容过滤和访问限制。

### 8.2 通用字段与枚举

通用字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | UUID | 主键，默认自动生成 |
| `created_at` | timestamptz | 创建时间 |
| `updated_at` | timestamptz | 更新时间 |
| `deleted_at` | timestamptz nullable | 软删除时间 |

建议枚举：

| 枚举 | 可选值 | 说明 |
| --- | --- | --- |
| `content_type` | `frontier_news`, `open_source_intro`, `knowledge_article`, `ai_problem`, `scientist`, `experiment`, `game_intro`, `learning_path_node` | 内容类型 |
| `publish_status` | `draft`, `pending_review`, `published`, `offline`, `rejected` | 发布或审核状态 |
| `school_stage` | `primary`, `middle`, `high`, `general` | 学习阶段 |
| `subject` | `math`, `physics`, `chemistry`, `biology`, `information_tech`, `chinese_logic`, `english_tech_reading`, `science`, `ai`, `general` | 学科 |
| `difficulty` | `easy`, `normal`, `hard`, `advanced` | 难度 |
| `source_type` | `official_blog`, `research_org`, `rss`, `github_trending`, `hugging_face`, `arxiv`, `tech_media`, `manual` | 新闻源类型 |
| `review_status` | `pending`, `approved`, `returned`, `deleted`, `unsuitable` | 审核任务状态 |
| `recommendation_scene` | `home`, `knowledge`, `game`, `project`, `after_game`, `learning_path` | 推荐场景 |
| `game_record_status` | `started`, `completed`, `failed`, `abandoned` | 游戏记录状态 |

### 8.3 用户与权限

#### 8.3.1 `users` 用户表

保存前台用户账号与基础资料。

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| `id` | UUID | PK | 用户 ID |
| `email` | varchar(255) nullable | unique | 邮箱登录时使用 |
| `phone` | varchar(32) nullable | unique | 手机登录时使用 |
| `password_hash` | varchar(255) nullable |  | 密码哈希，第三方登录用户可为空 |
| `nickname` | varchar(80) | not null | 昵称 |
| `avatar_url` | text nullable |  | 头像 |
| `school_stage` | enum nullable | index | 学习阶段 |
| `grade` | smallint nullable | index | 年级，建议 1-12 |
| `gender` | varchar(32) nullable |  | 可选资料，不作为访问限制依据 |
| `learning_preference` | jsonb nullable |  | 学习偏好，如图解、游戏、短文 |
| `status` | varchar(32) | index | `active`, `disabled` |
| `last_login_at` | timestamptz nullable |  | 最近登录时间 |
| `created_at` | timestamptz |  | 创建时间 |
| `updated_at` | timestamptz |  | 更新时间 |

索引：

- `unique(email)`，忽略空值。
- `unique(phone)`，忽略空值。
- `idx_users_stage_grade(school_stage, grade)`。

#### 8.3.2 `admin_users` 管理员表

保存后台管理员账号。

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| `id` | UUID | PK | 管理员 ID |
| `email` | varchar(255) | unique | 登录邮箱 |
| `password_hash` | varchar(255) | not null | 密码哈希 |
| `name` | varchar(80) | not null | 姓名 |
| `role` | varchar(32) | index | `super_admin`, `editor`, `reviewer`, `operator` |
| `status` | varchar(32) | index | `active`, `disabled` |
| `last_login_at` | timestamptz nullable |  | 最近登录时间 |
| `created_at` | timestamptz |  | 创建时间 |
| `updated_at` | timestamptz |  | 更新时间 |

### 8.4 标签与分类

#### 8.4.1 `tags` 标签表

统一管理兴趣标签、主题标签和系统标签。

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| `id` | UUID | PK | 标签 ID |
| `name` | varchar(60) | not null | 标签名 |
| `slug` | varchar(80) | unique | URL 和程序使用标识 |
| `tag_type` | varchar(32) | index | `interest`, `topic`, `system`, `source` |
| `description` | text nullable |  | 标签说明 |
| `created_at` | timestamptz |  | 创建时间 |
| `updated_at` | timestamptz |  | 更新时间 |

#### 8.4.2 `user_interests` 用户兴趣表

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| `user_id` | UUID | FK users | 用户 |
| `tag_id` | UUID | FK tags | 兴趣标签 |
| `weight` | numeric(5,2) | default 1 | 兴趣权重 |
| `created_at` | timestamptz |  | 创建时间 |

主键与索引：

- `primary key(user_id, tag_id)`。
- `idx_user_interests_tag(tag_id)`。

### 8.5 内容中心 CMS

#### 8.5.1 `contents` 统一内容表

管理所有可发布内容。

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| `id` | UUID | PK | 内容 ID |
| `content_type` | enum | index | 内容类型 |
| `title` | varchar(200) | not null | 标题 |
| `slug` | varchar(240) | unique | URL 标识 |
| `summary` | text nullable |  | 摘要 |
| `body` | text | not null | 正文，Markdown 或富文本 JSON 字符串 |
| `cover_image_url` | text nullable |  | 封面图 |
| `school_stage` | enum nullable | index | 适合阶段 |
| `min_grade` | smallint nullable | index | 最低适合年级 |
| `max_grade` | smallint nullable | index | 最高适合年级 |
| `subject` | enum nullable | index | 学科 |
| `difficulty` | enum nullable | index | 难度 |
| `source_url` | text nullable |  | 来源链接 |
| `source_name` | varchar(120) nullable |  | 来源名称 |
| `author_id` | UUID nullable | FK admin_users | 创建编辑 |
| `editor_id` | UUID nullable | FK admin_users | 最近编辑 |
| `status` | enum | index | 发布状态 |
| `published_at` | timestamptz nullable | index | 发布时间 |
| `offline_at` | timestamptz nullable |  | 下架时间 |
| `view_count` | bigint | default 0 | 浏览数，可异步更新 |
| `favorite_count` | bigint | default 0 | 收藏数，可异步更新 |
| `metadata` | jsonb nullable |  | 扩展字段 |
| `created_at` | timestamptz |  | 创建时间 |
| `updated_at` | timestamptz |  | 更新时间 |
| `deleted_at` | timestamptz nullable | index | 软删除时间 |

索引：

- `idx_contents_public(status, published_at desc)`：前台内容列表。
- `idx_contents_type_status(content_type, status, published_at desc)`：按类型列表。
- `idx_contents_grade(min_grade, max_grade)`：年级匹配。
- `idx_contents_subject_difficulty(subject, difficulty)`：知识内容筛选。
- `idx_contents_search`：建议后续使用 PostgreSQL full text search 或外接搜索服务。

#### 8.5.2 `content_tags` 内容标签关系表

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| `content_id` | UUID | FK contents | 内容 |
| `tag_id` | UUID | FK tags | 标签 |
| `created_at` | timestamptz |  | 创建时间 |

主键：

- `primary key(content_id, tag_id)`。

#### 8.5.3 `content_knowledge_points` 内容知识点关系表

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| `content_id` | UUID | FK contents | 内容 |
| `knowledge_point_id` | UUID | FK knowledge_points | 知识点 |
| `relation_type` | varchar(32) | default `related` | `primary`, `related`, `extension` |
| `created_at` | timestamptz |  | 创建时间 |

主键：

- `primary key(content_id, knowledge_point_id)`。

### 8.6 新闻抓取与 AI 草稿

#### 8.6.1 `news_sources` 新闻源表

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| `id` | UUID | PK | 来源 ID |
| `name` | varchar(120) | not null | 来源名称 |
| `source_type` | enum | index | 来源类型 |
| `url` | text | not null | 抓取 URL |
| `fetch_interval_minutes` | integer | default 1440 | 抓取频率 |
| `enabled` | boolean | default true | 是否启用 |
| `default_tag_ids` | UUID[] nullable |  | 默认标签，Prisma 可改为关系表 |
| `trust_level` | smallint | default 3 | 可信等级，1-5 |
| `last_fetched_at` | timestamptz nullable |  | 最近抓取时间 |
| `last_fetch_status` | varchar(32) nullable |  | 最近抓取状态 |
| `last_fetch_message` | text nullable |  | 最近抓取信息 |
| `created_at` | timestamptz |  | 创建时间 |
| `updated_at` | timestamptz |  | 更新时间 |

#### 8.6.2 `news_items` 抓取新闻表

保存抓取到的原始新闻，避免重复抓取和重复审核。

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| `id` | UUID | PK | 新闻 ID |
| `source_id` | UUID | FK news_sources | 来源 |
| `source_url` | text | not null | 原文链接 |
| `source_url_hash` | varchar(64) | unique | 链接哈希，用于去重 |
| `title` | varchar(300) | not null | 原始标题 |
| `summary` | text nullable |  | 原始摘要 |
| `raw_content` | text nullable |  | 原始正文或抓取片段 |
| `author` | varchar(120) nullable |  | 原作者 |
| `published_at` | timestamptz nullable | index | 原文发布时间 |
| `fetched_at` | timestamptz | index | 抓取时间 |
| `language` | varchar(16) nullable |  | 语言 |
| `status` | varchar(32) | index | `new`, `processed`, `ignored`, `duplicate`, `error` |
| `content_id` | UUID nullable | FK contents | 通过审核后生成的内容 |
| `metadata` | jsonb nullable |  | 抓取扩展数据 |
| `created_at` | timestamptz |  | 创建时间 |
| `updated_at` | timestamptz |  | 更新时间 |

#### 8.6.3 `ai_drafts` AI 草稿表

保存 AI 内容加工结果，必须经过审核才能发布。

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| `id` | UUID | PK | 草稿 ID |
| `news_item_id` | UUID nullable | FK news_items | 来源新闻 |
| `source_content_id` | UUID nullable | FK contents | 来源内容 |
| `draft_type` | varchar(64) | index | `youth_summary`, `knowledge_linking`, `tagging`, `problem_breakdown`, `game_summary`, `project_value` |
| `title` | varchar(200) nullable |  | AI 生成标题 |
| `summary` | text nullable |  | AI 生成摘要 |
| `body` | text nullable |  | AI 生成正文 |
| `suggested_tags` | jsonb nullable |  | 建议标签 |
| `suggested_knowledge_points` | jsonb nullable |  | 建议知识点 |
| `model_name` | varchar(120) nullable |  | 使用模型 |
| `prompt_version` | varchar(64) nullable |  | 提示词版本 |
| `status` | varchar(32) | index | `generated`, `reviewing`, `accepted`, `rejected` |
| `created_at` | timestamptz |  | 创建时间 |
| `updated_at` | timestamptz |  | 更新时间 |

### 8.7 审核队列

#### 8.7.1 `review_tasks` 审核任务表

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| `id` | UUID | PK | 审核任务 ID |
| `target_type` | varchar(32) | index | `content`, `news_item`, `ai_draft`, `project` |
| `target_id` | UUID | index | 被审核对象 ID |
| `title` | varchar(200) | not null | 审核任务标题 |
| `status` | enum | index | 审核状态 |
| `priority` | smallint | default 0 | 优先级 |
| `assignee_id` | UUID nullable | FK admin_users | 审核人 |
| `submitted_by_id` | UUID nullable | FK admin_users | 提交人 |
| `reviewed_by_id` | UUID nullable | FK admin_users | 最终审核人 |
| `review_comment` | text nullable |  | 审核意见 |
| `submitted_at` | timestamptz |  | 提交时间 |
| `reviewed_at` | timestamptz nullable |  | 审核时间 |
| `created_at` | timestamptz |  | 创建时间 |
| `updated_at` | timestamptz |  | 更新时间 |

索引：

- `idx_review_tasks_status_priority(status, priority desc, submitted_at)`。
- `idx_review_tasks_target(target_type, target_id)`。

#### 8.7.2 `audit_logs` 操作审计表

保存后台关键操作，便于追溯。

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| `id` | UUID | PK | 日志 ID |
| `actor_type` | varchar(32) | index | `admin`, `user`, `system` |
| `actor_id` | UUID nullable | index | 操作者 ID |
| `action` | varchar(80) | index | 操作名，如 `content.publish` |
| `target_type` | varchar(64) | index | 对象类型 |
| `target_id` | UUID nullable | index | 对象 ID |
| `before_data` | jsonb nullable |  | 变更前关键字段 |
| `after_data` | jsonb nullable |  | 变更后关键字段 |
| `ip` | inet nullable |  | IP |
| `user_agent` | text nullable |  | User-Agent |
| `created_at` | timestamptz | index | 操作时间 |

### 8.8 知识库

#### 8.8.1 `knowledge_points` 知识点表

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| `id` | UUID | PK | 知识点 ID |
| `name` | varchar(120) | not null | 名称 |
| `slug` | varchar(160) | unique | URL 标识 |
| `region` | varchar(80) nullable | index | 地区，如 `shenzhen` |
| `textbook_version` | varchar(120) nullable | index | 教材版本，如 `beishida_math`, `pep_science` |
| `knowledge_block` | varchar(160) nullable | index | 重点知识板块 |
| `school_stage` | enum | index | 学习阶段 |
| `grade` | smallint nullable | index | 年级 |
| `subject` | enum | index | 学科 |
| `difficulty` | enum | index | 难度 |
| `curriculum_concept` | text nullable |  | 课内概念 |
| `plain_explanation` | text nullable |  | 易懂解释 |
| `diagram_steps` | jsonb nullable |  | 图解步骤 |
| `common_misunderstandings` | jsonb nullable |  | 常见误区 |
| `examples` | jsonb nullable |  | 例题或任务 |
| `ai_science_extension` | text nullable |  | AI / 科学延伸 |
| `recommended_minutes` | integer nullable |  | 推荐学习时长 |
| `status` | enum | index | 草稿、待审核、已发布、下架 |
| `created_by_id` | UUID nullable | FK admin_users | 创建人 |
| `created_at` | timestamptz |  | 创建时间 |
| `updated_at` | timestamptz |  | 更新时间 |
| `deleted_at` | timestamptz nullable | index | 软删除时间 |

索引：

- `idx_knowledge_stage_grade_subject(school_stage, grade, subject)`。
- `idx_knowledge_status(status)`。

#### 8.8.2 `knowledge_relations` 知识点关系表

用于前置知识、后续知识、相似知识、延伸知识。

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| `from_knowledge_point_id` | UUID | FK knowledge_points | 起点知识点 |
| `to_knowledge_point_id` | UUID | FK knowledge_points | 目标知识点 |
| `relation_type` | varchar(32) | index | `prerequisite`, `next`, `similar`, `extension` |
| `created_at` | timestamptz |  | 创建时间 |

主键：

- `primary key(from_knowledge_point_id, to_knowledge_point_id, relation_type)`。

### 8.9 小游戏

#### 8.9.1 `games` 小游戏表

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| `id` | UUID | PK | 游戏 ID |
| `name` | varchar(120) | not null | 游戏名称 |
| `slug` | varchar(160) | unique | URL 标识 |
| `description` | text nullable |  | 游戏简介 |
| `game_type` | varchar(64) | index | 类型，如 `quiz`, `simulation`, `puzzle`, `coding` |
| `school_stage` | enum nullable | index | 适合阶段 |
| `min_grade` | smallint nullable | index | 最低适合年级 |
| `max_grade` | smallint nullable | index | 最高适合年级 |
| `subject` | enum nullable | index | 关联学科 |
| `difficulty` | enum nullable | index | 难度 |
| `entry_url` | text | not null | 游戏入口 |
| `cover_image_url` | text nullable |  | 封面图 |
| `status` | enum | index | 发布状态 |
| `created_at` | timestamptz |  | 创建时间 |
| `updated_at` | timestamptz |  | 更新时间 |
| `deleted_at` | timestamptz nullable | index | 软删除时间 |

#### 8.9.2 `game_levels` 游戏关卡表

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| `id` | UUID | PK | 关卡 ID |
| `game_id` | UUID | FK games | 游戏 |
| `level_no` | integer | not null | 关卡序号 |
| `name` | varchar(120) | not null | 关卡名称 |
| `description` | text nullable |  | 关卡说明 |
| `difficulty` | enum nullable |  | 难度 |
| `config` | jsonb nullable |  | 关卡配置 |
| `created_at` | timestamptz |  | 创建时间 |
| `updated_at` | timestamptz |  | 更新时间 |

约束：

- `unique(game_id, level_no)`。

#### 8.9.3 `game_knowledge_points` 游戏知识点关系表

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| `game_id` | UUID | FK games | 游戏 |
| `knowledge_point_id` | UUID | FK knowledge_points | 知识点 |
| `created_at` | timestamptz |  | 创建时间 |

主键：

- `primary key(game_id, knowledge_point_id)`。

#### 8.9.4 `game_records` 用户游戏记录表

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| `id` | UUID | PK | 记录 ID |
| `user_id` | UUID | FK users | 用户 |
| `game_id` | UUID | FK games | 游戏 |
| `level_id` | UUID nullable | FK game_levels | 关卡 |
| `score` | integer nullable | index | 分数 |
| `max_score` | integer nullable |  | 满分 |
| `status` | enum | index | 完成状态 |
| `started_at` | timestamptz nullable |  | 开始时间 |
| `completed_at` | timestamptz nullable | index | 完成时间 |
| `duration_seconds` | integer nullable |  | 用时 |
| `mistakes` | jsonb nullable |  | 错误点 |
| `learned_knowledge_point_ids` | UUID[] nullable |  | 学到的知识点 |
| `metadata` | jsonb nullable |  | 游戏侧扩展数据 |
| `created_at` | timestamptz |  | 创建时间 |

索引：

- `idx_game_records_user_time(user_id, completed_at desc)`。
- `idx_game_records_game_time(game_id, completed_at desc)`。
- `idx_game_records_user_game(user_id, game_id)`。

### 8.10 学习进度、收藏与徽章

#### 8.10.1 `learning_progress` 学习进度表

按用户和知识点记录掌握情况。

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| `id` | UUID | PK | 进度 ID |
| `user_id` | UUID | FK users | 用户 |
| `knowledge_point_id` | UUID | FK knowledge_points | 知识点 |
| `status` | varchar(32) | index | `not_started`, `learning`, `completed`, `mastered` |
| `progress_percent` | smallint | default 0 | 0-100 |
| `mastery_score` | numeric(5,2) nullable |  | 掌握度 |
| `last_activity_at` | timestamptz nullable | index | 最近学习时间 |
| `completed_at` | timestamptz nullable |  | 完成时间 |
| `source_type` | varchar(32) nullable |  | 来源，如内容、游戏、任务 |
| `source_id` | UUID nullable |  | 来源 ID |
| `created_at` | timestamptz |  | 创建时间 |
| `updated_at` | timestamptz |  | 更新时间 |

约束：

- `unique(user_id, knowledge_point_id)`。

#### 8.10.2 `user_content_actions` 用户内容行为表

记录浏览、收藏、点赞等行为。

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| `id` | UUID | PK | 行为 ID |
| `user_id` | UUID | FK users | 用户 |
| `content_id` | UUID | FK contents | 内容 |
| `action_type` | varchar(32) | index | `view`, `favorite`, `unfavorite`, `like`, `share`, `click` |
| `duration_seconds` | integer nullable |  | 浏览时长 |
| `metadata` | jsonb nullable |  | 扩展数据 |
| `created_at` | timestamptz | index | 行为时间 |

索引：

- `idx_user_content_actions_user_time(user_id, created_at desc)`。
- `idx_user_content_actions_content_type(content_id, action_type)`。

#### 8.10.3 `user_favorites` 用户收藏表

用于快速查询收藏列表，行为流水仍写入 `user_content_actions`。

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| `user_id` | UUID | FK users | 用户 |
| `content_id` | UUID | FK contents | 内容 |
| `created_at` | timestamptz |  | 收藏时间 |

主键：

- `primary key(user_id, content_id)`。

#### 8.10.4 `badges` 徽章表

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| `id` | UUID | PK | 徽章 ID |
| `name` | varchar(120) | not null | 徽章名称 |
| `slug` | varchar(160) | unique | 徽章标识 |
| `description` | text nullable |  | 徽章说明 |
| `icon_url` | text nullable |  | 图标 |
| `rule_config` | jsonb nullable |  | 发放规则 |
| `enabled` | boolean | default true | 是否启用 |
| `created_at` | timestamptz |  | 创建时间 |
| `updated_at` | timestamptz |  | 更新时间 |

#### 8.10.5 `user_badges` 用户徽章表

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| `user_id` | UUID | FK users | 用户 |
| `badge_id` | UUID | FK badges | 徽章 |
| `earned_at` | timestamptz |  | 获得时间 |
| `source_type` | varchar(32) nullable |  | 触发来源 |
| `source_id` | UUID nullable |  | 来源 ID |

主键：

- `primary key(user_id, badge_id)`。

### 8.11 开源项目雷达

#### 8.11.1 `open_source_projects` 开源项目表

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| `id` | UUID | PK | 项目 ID |
| `name` | varchar(160) | not null | 项目名 |
| `slug` | varchar(180) | unique | URL 标识 |
| `repo_url` | text | not null | GitHub / Hugging Face 链接 |
| `repo_url_hash` | varchar(64) | unique | 链接哈希 |
| `homepage_url` | text nullable |  | 官网 |
| `description` | text nullable |  | 原始简介 |
| `readme_summary` | text nullable |  | README 摘要 |
| `stars` | integer nullable | index | Stars |
| `forks` | integer nullable |  | Forks |
| `weekly_star_growth` | integer nullable | index | 最近一周 Stars 增长量 |
| `language` | varchar(80) nullable | index | 主要语言 |
| `license` | varchar(120) nullable |  | License |
| `repo_updated_at` | timestamptz nullable | index | 仓库更新时间 |
| `school_stage` | enum nullable | index | 适合阶段 |
| `min_grade` | smallint nullable |  | 最低年级 |
| `max_grade` | smallint nullable |  | 最高年级 |
| `difficulty` | enum nullable | index | 学习难度 |
| `learning_value` | text nullable |  | 能学到什么 |
| `recommend_reason` | text nullable |  | 推荐理由 |
| `remix_ideas` | text nullable |  | 改造建议 |
| `status` | enum | index | 发布状态 |
| `metadata` | jsonb nullable |  | 额外抓取数据 |
| `created_at` | timestamptz |  | 创建时间 |
| `updated_at` | timestamptz |  | 更新时间 |
| `deleted_at` | timestamptz nullable | index | 软删除时间 |

#### 8.11.2 `project_tags` 项目标签关系表

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| `project_id` | UUID | FK open_source_projects | 项目 |
| `tag_id` | UUID | FK tags | 标签 |
| `created_at` | timestamptz |  | 创建时间 |

主键：

- `primary key(project_id, tag_id)`。

#### 8.11.3 `project_knowledge_points` 项目知识点关系表

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| `project_id` | UUID | FK open_source_projects | 项目 |
| `knowledge_point_id` | UUID | FK knowledge_points | 知识点 |
| `created_at` | timestamptz |  | 创建时间 |

主键：

- `primary key(project_id, knowledge_point_id)`。

#### 8.11.4 `project_rankings` 项目榜单表

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| `id` | UUID | PK | 榜单 ID |
| `name` | varchar(120) | not null | 榜单名称 |
| `ranking_type` | varchar(64) | index | `weekly_fork`, `beginner`, `ai_tool`, `game_project`, `physics_simulation`, `math_visualization` |
| `description` | text nullable |  | 榜单说明 |
| `ranking_week` | varchar(16) nullable | index | 榜单周次，如 `2026-W18` |
| `snapshot_date` | date nullable | index | 榜单快照日期 |
| `enabled` | boolean | default true | 是否启用 |
| `created_at` | timestamptz |  | 创建时间 |
| `updated_at` | timestamptz |  | 更新时间 |

#### 8.11.5 `project_ranking_items` 项目榜单明细表

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| `ranking_id` | UUID | FK project_rankings | 榜单 |
| `project_id` | UUID | FK open_source_projects | 项目 |
| `rank_no` | integer | not null | 排名 |
| `stars_at_snapshot` | integer nullable |  | 入榜时 Stars |
| `star_growth` | integer nullable |  | 本榜单周期 Stars 增长 |
| `reason` | text nullable |  | 入榜理由 |
| `created_at` | timestamptz |  | 创建时间 |

主键与约束：

- `primary key(ranking_id, project_id)`。
- `unique(ranking_id, rank_no)`。

#### 8.11.6 `project_star_snapshots` 项目 Stars 快照表

用于计算每周 Stars 增长，并支持历史趋势查询。

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| `project_id` | UUID | FK open_source_projects | 项目 |
| `snapshot_date` | date | index | 快照日期 |
| `stars` | integer | not null | 当日 Stars |
| `forks` | integer nullable |  | 当日 Forks |
| `open_issues` | integer nullable |  | 当日 Issues |
| `metadata` | jsonb nullable |  | GitHub 返回的扩展信息 |
| `created_at` | timestamptz |  | 创建时间 |

主键：

- `primary key(project_id, snapshot_date)`。

计算规则：

```text
weekly_star_growth =
  current_snapshot.stars - snapshot_from_7_days_ago.stars
```

如果项目是本周首次发现，没有 7 天前快照，可用发现时 Stars 作为基线，并在榜单中标记为新项目。

### 8.12 推荐系统

#### 8.12.1 `recommendation_rules` 推荐规则表

规则推荐第一版使用后台可配置规则。

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| `id` | UUID | PK | 规则 ID |
| `name` | varchar(120) | not null | 规则名称 |
| `scene` | enum | index | 推荐场景 |
| `target_type` | varchar(32) | index | `content`, `game`, `project`, `knowledge_point` |
| `conditions` | jsonb | not null | 匹配条件，如年级、标签、学科 |
| `strategy` | jsonb | not null | 排序与权重，如新鲜度、热度、难度 |
| `priority` | integer | default 0 | 优先级 |
| `enabled` | boolean | default true | 是否启用 |
| `start_at` | timestamptz nullable |  | 生效时间 |
| `end_at` | timestamptz nullable |  | 失效时间 |
| `created_at` | timestamptz |  | 创建时间 |
| `updated_at` | timestamptz |  | 更新时间 |

#### 8.12.2 `recommendations` 推荐结果表

保存推荐结果和曝光、点击情况，用于统计和调优。

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| `id` | UUID | PK | 推荐 ID |
| `user_id` | UUID | FK users | 用户 |
| `scene` | enum | index | 推荐场景 |
| `target_type` | varchar(32) | index | 推荐对象类型 |
| `target_id` | UUID | index | 推荐对象 ID |
| `rule_id` | UUID nullable | FK recommendation_rules | 命中的规则 |
| `score` | numeric(8,4) nullable | index | 推荐分 |
| `reason` | text nullable |  | 推荐理由 |
| `rank_no` | integer nullable |  | 排名 |
| `shown_at` | timestamptz nullable | index | 曝光时间 |
| `clicked_at` | timestamptz nullable | index | 点击时间 |
| `dismissed_at` | timestamptz nullable |  | 不感兴趣时间 |
| `created_at` | timestamptz | index | 创建时间 |

索引：

- `idx_recommendations_user_scene_time(user_id, scene, created_at desc)`。
- `idx_recommendations_target(target_type, target_id)`。

### 8.13 定时任务与队列记录

#### 8.13.1 `job_runs` 任务执行记录表

记录 Cron、抓取、AI 加工、统计聚合等后台任务。

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| `id` | UUID | PK | 任务执行 ID |
| `job_name` | varchar(120) | index | 任务名 |
| `job_type` | varchar(64) | index | `fetch_news`, `process_ai`, `sync_project`, `aggregate_stats`, `recommendation` |
| `status` | varchar(32) | index | `running`, `success`, `failed`, `cancelled` |
| `started_at` | timestamptz | index | 开始时间 |
| `finished_at` | timestamptz nullable |  | 结束时间 |
| `duration_ms` | integer nullable |  | 耗时 |
| `success_count` | integer | default 0 | 成功数量 |
| `failure_count` | integer | default 0 | 失败数量 |
| `message` | text nullable |  | 执行摘要 |
| `metadata` | jsonb nullable |  | 扩展信息 |
| `created_at` | timestamptz |  | 创建时间 |

### 8.14 数据统计

#### 8.14.1 `daily_stats` 每日统计表

用于后台仪表盘，避免实时聚合压力过大。

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| `id` | UUID | PK | 统计 ID |
| `stat_date` | date | index | 统计日期 |
| `metric_key` | varchar(120) | index | 指标名，如 `published_content_count` |
| `metric_value` | numeric(18,4) | not null | 指标值 |
| `dimension_type` | varchar(64) nullable | index | 维度类型，如 `content_type`, `game_id` |
| `dimension_value` | varchar(120) nullable | index | 维度值 |
| `metadata` | jsonb nullable |  | 扩展数据 |
| `created_at` | timestamptz |  | 创建时间 |

约束：

- `unique(stat_date, metric_key, dimension_type, dimension_value)`。

### 8.15 表关系摘要

核心关系：

- 一个用户可以有多个兴趣标签、学习进度、游戏记录、收藏、徽章和推荐结果。
- 一个内容可以关联多个标签、知识点和审核任务。
- 一个新闻源可以抓取多条新闻，一条新闻可以生成一个或多个 AI 草稿。
- 一个 AI 草稿必须进入审核任务，通过后才可以创建或更新正式内容。
- 一个知识点可以关联多个内容、小游戏、开源项目，也可以通过知识点关系表连接前置和后续知识。
- 一个小游戏包含多个关卡，并通过游戏记录沉淀用户学习结果。
- 一个开源项目可以进入多个榜单，也可以关联标签和知识点。
- 推荐结果通过 `target_type + target_id` 指向内容、小游戏、开源项目或知识点。

### 8.16 MVP 建表优先级

第一批必须建表：

- `users`
- `admin_users`
- `tags`
- `user_interests`
- `contents`
- `content_tags`
- `knowledge_points`
- `content_knowledge_points`
- `news_sources`
- `news_items`
- `ai_drafts`
- `review_tasks`
- `open_source_projects`
- `games`
- `game_levels`
- `game_knowledge_points`
- `game_records`
- `learning_progress`
- `user_content_actions`
- `user_favorites`
- `recommendation_rules`
- `recommendations`

第二批可延后：

- `knowledge_relations`
- `badges`
- `user_badges`
- `project_tags`
- `project_knowledge_points`
- `project_rankings`
- `project_ranking_items`
- `audit_logs`
- `job_runs`
- `daily_stats`

### 8.17 Prisma 落地建议

Prisma Schema 建议：

- 枚举使用 Prisma `enum` 定义，字段名保持小写蛇形映射到数据库。
- 数据库表名使用复数蛇形命名，通过 `@@map("table_name")` 映射。
- JSON 字段使用 `Json` 类型，对结构稳定的数据后续再拆表。
- UUID 使用 `@default(uuid())`。
- 时间字段使用 `DateTime @db.Timestamptz`。
- 高频列表查询字段都需要加 `@@index`。
- 多对多关系优先显式建关系表，便于增加关系类型和排序字段。

迁移顺序建议：

1. 先创建枚举、用户、管理员、标签。
2. 再创建内容、知识点、游戏、项目等主体表。
3. 再创建关系表。
4. 再创建抓取、AI 草稿、审核和推荐表。
5. 最后创建统计、审计和任务执行记录表。

## 9. 学习成长指标体系

首页展示的“学习天数、徽章总数、知识点掌握、连续学习”不是静态数字，而是用户学习成长体系的核心指标。该体系用于激励学习、驱动推荐、触发徽章、展示学习地图，并为后台统计提供基础数据。

### 9.1 指标定义

首页四个核心指标：

| 指标 | 字段建议 | 展示示例 | 定义 |
| --- | --- | --- | --- |
| 学习天数 | `learning_days` | `28 天` | 用户发生有效学习行为的自然日数量，按用户本地时区去重 |
| 徽章总数 | `badge_count` | `16 枚` | 用户已获得且未撤销的徽章数量 |
| 知识点掌握 | `mastery_percent` | `72%` | 已掌握知识点数量 / 适合用户年级和学习阶段的目标知识点数量 |
| 连续学习 | `streak_days` | `7 天` | 用户从最近一个有效学习日向前连续学习的天数 |

有效学习行为包括：

- 浏览知识内容达到最短有效时长。
- 完成一篇知识文章。
- 完成小游戏关卡。
- 完成 AI 难题拆解后的复盘任务。
- 收藏内容不单独计入有效学习，但可作为推荐信号。
- 登录本身不计入有效学习，避免刷登录天数。

第一版建议有效学习阈值：

| 行为 | 有效条件 |
| --- | --- |
| 内容浏览 | 单篇内容停留时间不少于 30 秒 |
| 内容完成 | 用户点击完成，或阅读进度达到 80% |
| 游戏完成 | `game_records.status = completed` |
| 关卡完成 | 有明确关卡完成记录 |
| 知识点完成 | `learning_progress.status` 达到 `completed` 或 `mastered` |

### 9.2 学习事件模型

为了避免从多个业务表临时拼指标，需要增加统一学习事件流水表。

#### 9.2.1 `learning_events` 学习事件表

记录所有会影响成长指标的用户学习行为。

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| `id` | UUID | PK | 事件 ID |
| `user_id` | UUID | FK users, index | 用户 |
| `event_type` | varchar(64) | index | `content_view`, `content_complete`, `game_start`, `game_complete`, `level_complete`, `knowledge_complete`, `ai_review_complete` |
| `target_type` | varchar(64) | index | `content`, `game`, `game_level`, `knowledge_point`, `ai_task` |
| `target_id` | UUID nullable | index | 目标对象 ID |
| `knowledge_point_id` | UUID nullable | FK knowledge_points, index | 关联知识点 |
| `subject` | enum nullable | index | 学科 |
| `duration_seconds` | integer nullable |  | 学习时长 |
| `score` | integer nullable |  | 游戏或任务分数 |
| `is_effective` | boolean | default false, index | 是否计入有效学习 |
| `event_date` | date | index | 用户本地日期，用于日统计 |
| `metadata` | jsonb nullable |  | 扩展信息 |
| `created_at` | timestamptz | index | 事件发生时间 |

索引：

- `idx_learning_events_user_date(user_id, event_date)`。
- `idx_learning_events_user_effective(user_id, is_effective, event_date)`。
- `idx_learning_events_target(target_type, target_id)`。

写入原则：

- 前端不直接决定 `is_effective`，只上报行为和时长；后端按规则判定。
- 游戏完成、知识点完成这类强事件可以直接判定为有效。
- 内容浏览需要后端根据 `duration_seconds` 和内容状态判定。
- 同一用户同一内容同一天多次浏览，只能贡献 1 个学习日，但可以累计学习时长。

### 9.3 用户成长汇总表

首页不应该实时扫描所有事件，需使用汇总表支撑快速读取。

#### 9.3.1 `user_growth_stats` 用户成长汇总表

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| `user_id` | UUID | PK, FK users | 用户 |
| `learning_days` | integer | default 0 | 有效学习天数 |
| `streak_days` | integer | default 0 | 当前连续学习天数 |
| `longest_streak_days` | integer | default 0 | 历史最长连续学习天数 |
| `badge_count` | integer | default 0 | 已获得徽章数 |
| `completed_knowledge_count` | integer | default 0 | 已完成知识点数 |
| `mastered_knowledge_count` | integer | default 0 | 已掌握知识点数 |
| `target_knowledge_count` | integer | default 0 | 当前阶段目标知识点数 |
| `mastery_percent` | numeric(5,2) | default 0 | 知识点掌握百分比 |
| `total_learning_seconds` | integer | default 0 | 累计有效学习时长 |
| `last_learning_date` | date nullable | index | 最近有效学习日期 |
| `last_calculated_at` | timestamptz |  | 最近计算时间 |
| `created_at` | timestamptz |  | 创建时间 |
| `updated_at` | timestamptz |  | 更新时间 |

更新方式：

- 用户登录首页时读取该表，不实时重算。
- 学习事件写入后可异步触发增量更新。
- 每日凌晨跑一次全量校准任务，修正漏算和跨时区问题。

### 9.4 每日学习快照

为了展示学习日历、连续学习明细和后台统计，需要按天沉淀快照。

#### 9.4.1 `user_daily_learning_stats` 用户每日学习统计表

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| `user_id` | UUID | FK users | 用户 |
| `stat_date` | date | index | 统计日期 |
| `effective_event_count` | integer | default 0 | 有效学习事件数 |
| `content_complete_count` | integer | default 0 | 完成内容数 |
| `game_complete_count` | integer | default 0 | 完成游戏或关卡数 |
| `knowledge_complete_count` | integer | default 0 | 完成知识点数 |
| `learning_seconds` | integer | default 0 | 当日有效学习时长 |
| `subjects` | jsonb nullable |  | 当日涉及学科 |
| `is_learning_day` | boolean | default false | 是否计入学习日 |
| `created_at` | timestamptz |  | 创建时间 |
| `updated_at` | timestamptz |  | 更新时间 |

主键：

- `primary key(user_id, stat_date)`。

### 9.5 四个指标计算规则

#### 9.5.1 学习天数

计算口径：

```text
learning_days = count(distinct event_date)
where learning_events.user_id = 当前用户
and learning_events.is_effective = true
```

约束：

- 同一天多个有效学习事件只算 1 天。
- 用户本地时区按个人设置；未设置时第一版使用服务器时区或中国时区。
- 补录事件允许影响历史学习天数，但需要重新计算连续学习。

#### 9.5.2 连续学习天数

计算口径：

```text
从 last_learning_date 开始向前查找连续 is_learning_day = true 的日期数量
```

规则：

- 如果今天有有效学习，连续天数从今天开始算。
- 如果今天没有，但昨天有有效学习，连续天数仍保留昨天为终点。
- 如果最近有效学习日早于昨天，则当前连续学习为 0。
- 补录历史事件后需要重新计算连续天数。

示例：

| 日期 | 是否学习 | 当前连续学习 |
| --- | --- | --- |
| 5 月 1 日 | 是 | 1 |
| 5 月 2 日 | 是 | 2 |
| 5 月 3 日 | 否 | 2，若当天展示可保留到日终 |
| 5 月 4 日 | 否 | 0 |
| 5 月 5 日 | 是 | 1 |

#### 9.5.3 徽章总数

计算口径：

```text
badge_count = count(user_badges)
where user_badges.user_id = 当前用户
and user_badges.revoked_at is null
```

第一版如果不做撤销，可直接统计 `user_badges`。

建议扩展 `user_badges`：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `revoked_at` | timestamptz nullable | 徽章撤销时间 |
| `progress_value` | numeric nullable | 进度型徽章当前值 |
| `metadata` | jsonb nullable | 触发上下文 |

#### 9.5.4 知识点掌握

计算口径：

```text
mastery_percent =
  mastered_knowledge_count / target_knowledge_count * 100
```

目标知识点范围：

- 匹配用户 `school_stage` 和 `grade` 的知识点。
- 状态为 `published`。
- 后台可配置是否包含低年级前置知识。

知识点状态定义：

| 状态 | 说明 | 是否计入完成 | 是否计入掌握 |
| --- | --- | --- | --- |
| `not_started` | 未开始 | 否 | 否 |
| `learning` | 学习中 | 否 | 否 |
| `completed` | 已完成学习任务 | 是 | 否 |
| `mastered` | 多次练习或测验达到掌握标准 | 是 | 是 |

掌握标准第一版：

- 完成关联内容或小游戏后，知识点可到 `completed`。
- 同一知识点完成 2 次不同形式练习，或最近一次测验分数不少于 80%，可到 `mastered`。
- 后台可以人工调整用户单个知识点状态。

### 9.6 徽章体系

徽章用于把学习行为变成可见成就。第一版采用规则触发，不做复杂成就引擎。

徽章类型：

| 类型 | 示例 | 触发条件 |
| --- | --- | --- |
| 连续学习 | 坚持之星 | 连续学习 3 / 7 / 14 / 30 天 |
| 学习天数 | 长期探索者 | 累计学习 7 / 30 / 100 天 |
| 学科掌握 | 物理新星 | 某学科掌握 5 / 20 / 50 个知识点 |
| 游戏挑战 | 轨道工程师 | 完成某小游戏全部关卡 |
| AI 思维 | 幻觉侦探 | 完成 AI 错误识别任务 |
| 开源实践 | 小小 Forker | 收藏或完成开源项目任务 |
| 多元榜样 | 科学人物探索者 | 阅读科学人物文章达到数量要求 |

#### 9.6.1 徽章规则配置

`badges.rule_config` 示例：

```json
{
  "trigger": "streak_days",
  "operator": ">=",
  "value": 7,
  "title": "坚持之星",
  "repeatable": false
}
```

规则执行时机：

- 学习事件写入后检查相关徽章。
- 每日统计任务完成后检查连续学习和累计学习徽章。
- 管理员可以手动补发或撤销徽章。

### 9.7 数据流

```text
用户学习 / 游戏 / 完成任务
  ↓
后端写入 learning_events
  ↓
更新 learning_progress / game_records / user_content_actions
  ↓
异步更新 user_daily_learning_stats
  ↓
刷新 user_growth_stats
  ↓
检查徽章规则，写入 user_badges
  ↓
首页读取 /api/users/me/growth
```

首页接口建议：

```text
GET /api/users/me/growth
```

返回示例：

```json
{
  "learning_days": 28,
  "badge_count": 16,
  "mastery_percent": 72,
  "streak_days": 7,
  "longest_streak_days": 14,
  "completed_knowledge_count": 36,
  "mastered_knowledge_count": 28,
  "target_knowledge_count": 39
}
```

### 9.8 后台管理需求

后台需要增加“成长体系管理”入口。

功能：

- 查看用户成长指标。
- 查看用户每日学习日历。
- 查看学习事件流水。
- 管理徽章定义和徽章规则。
- 手动补发、撤销徽章。
- 手动修正知识点掌握状态。
- 重新计算某个用户的成长统计。
- 查看异常行为，例如短时间大量刷事件。

### 9.9 防刷与异常处理

防刷规则：

- 登录不计入学习天数。
- 内容浏览必须达到最短有效时长。
- 同一内容同一天重复浏览只贡献一次有效学习事件。
- 同一小游戏关卡重复完成可更新最高分，但不重复刷学习天数。
- 单日有效学习时长设置合理上限，超过后标记异常，不直接计入徽章。
- 前端上报的时长只作参考，关键完成事件以后端状态为准。

异常处理：

- 如果学习事件写入成功但汇总失败，任务队列重试。
- 如果汇总表与事件流水不一致，以事件流水为准重新计算。
- 如果徽章重复触发，依靠 `unique(user_id, badge_id)` 防止重复发放。

### 9.10 MVP 实现优先级

第一阶段必须实现：

- `learning_events`
- `user_daily_learning_stats`
- `user_growth_stats`
- 首页成长指标接口
- 学习天数、连续学习、知识点掌握、徽章总数计算
- 连续学习 3 / 7 天徽章
- 累计学习 7 天徽章

第二阶段实现：

- 徽章进度展示。
- 学习日历。
- 后台手动补发和撤销徽章。
- 异常行为检测。
- 按学科展示掌握率。

### 9.11 对现有数据库设计的补充

需要新增表：

- `learning_events`：学习事件流水。
- `user_growth_stats`：用户成长汇总。
- `user_daily_learning_stats`：用户每日学习快照。

需要调整表：

- `user_badges` 增加 `revoked_at`、`progress_value`、`metadata`。
- `learning_progress` 保持用户与知识点维度的掌握状态，作为知识点掌握率计算来源。
- `daily_stats` 继续服务后台全站统计，不替代用户个人成长统计。

MVP 建表优先级中，`badges` 和 `user_badges` 应从第二批提前到第一批，因为首页已经展示徽章总数。

## 10. 个人资料卡数据来源

个人资料卡展示用户的基础资料、成长等级、经验值、徽章标签、兴趣和学习偏好。该卡片不占用首页主体区域，而是放在右上角用户按钮的悬浮浮窗中：鼠标移入或键盘聚焦用户按钮时弹出。卡片不能写死，需要由注册资料、学习行为、成长统计和推荐画像共同生成。

### 10.1 卡片字段拆解

| 展示内容 | 示例 | 数据来源 | 获取方式 |
| --- | --- | --- | --- |
| 头像 | 圆形头像 / “少” | `users.avatar_url` 或昵称首字 | 用户上传头像优先；无头像时取昵称首字 |
| 问候语 | `你好，星火少年！` | `users.nickname` | 登录后读取当前用户资料 |
| 等级 | `Lv.12` | `user_growth_stats.level` | 根据累计经验值计算或直接读取汇总表 |
| 经验值进度 | `870 / 1500 经验值` | `user_growth_stats.current_xp`, `user_growth_stats.next_level_xp` | 学习事件累积经验，汇总表返回 |
| 经验进度条 | 约 58% | `current_xp / next_level_xp` | 前端按接口返回值计算宽度 |
| 徽章标签 | `探索者`、`逻辑达人`、`坚持之星` | `user_badges` + `badges` | 取最近获得或后台标记为首页展示的 3 个徽章 |
| 年级 | `初二` | `users.grade` | 注册时填写，可在个人资料中修改 |
| 兴趣 | `物理 · AI · 太空 · 游戏` | `user_interests` + `tags` | 用户选择 + 行为推断，按权重排序 |
| 学习风格 | `视觉型 · 逻辑型` | `user_learning_profile` 或 `users.learning_preference` | 注册问卷 + 行为分析生成 |
| 个性化说明 | `基于年级、兴趣与学习进度...` | 规则生成 | 根据年级、兴趣、学习进度动态拼接 |

### 10.2 用户基础资料来源

用户基础资料来自 `users` 表。

使用字段：

| 字段 | 说明 |
| --- | --- |
| `nickname` | 昵称，用于问候语 |
| `avatar_url` | 用户头像 |
| `school_stage` | 学习阶段 |
| `grade` | 年级 |
| `gender` | 可选资料，只作为偏好，不作为访问限制 |
| `learning_preference` | 用户主动选择的学习偏好 |

年级展示转换：

| `grade` | 展示 |
| --- | --- |
| 1-6 | 小一至小六 |
| 7 | 初一 |
| 8 | 初二 |
| 9 | 初三 |
| 10 | 高一 |
| 11 | 高二 |
| 12 | 高三 |

### 10.3 等级与经验值体系

等级和经验值由学习行为产生。第一版使用规则经验值，不做复杂积分系统。

经验值来源：

| 行为 | 建议经验值 | 说明 |
| --- | --- | --- |
| 完成知识内容 | +20 XP | 内容状态达到完成 |
| 完成小游戏关卡 | +30 XP | `game_records.status = completed` |
| 掌握知识点 | +50 XP | `learning_progress.status = mastered` |
| 连续学习每日奖励 | +10 XP | 每日最多一次 |
| 完成 AI 难题复盘 | +25 XP | 后续 AI 模块接入 |
| 阅读科学人物文章 | +15 XP | 内容完成后发放 |

等级计算：

```text
level = floor(sqrt(total_xp / 10)) + 1
```

下一等级所需经验：

```text
next_level_total_xp = ((level) ^ 2) * 10
current_level_total_xp = ((level - 1) ^ 2) * 10
current_xp = total_xp - current_level_total_xp
next_level_xp = next_level_total_xp - current_level_total_xp
```

示例：

```json
{
  "level": 12,
  "total_xp": 2080,
  "current_xp": 870,
  "next_level_xp": 1500
}
```

> 注：具体公式可以在后台配置。首页展示只依赖接口返回的 `level`、`current_xp` 和 `next_level_xp`。

### 10.4 资料卡徽章获取

首页最多展示 3 个徽章标签。

排序规则：

1. 优先展示用户手动置顶徽章。
2. 其次展示最近获得的高等级徽章。
3. 再展示与当前推荐内容相关的徽章。
4. 不足 3 个时展示系统默认成长标签。

默认成长标签：

| 标签 | 触发条件 |
| --- | --- |
| 探索者 | 注册后默认展示 |
| 逻辑达人 | 完成任意 AI / 数学 / 推理类任务 |
| 坚持之星 | 连续学习不少于 3 天 |

建议扩展 `user_badges`：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `pinned` | boolean | 是否置顶展示 |
| `display_order` | integer nullable | 置顶排序 |

### 10.5 兴趣来源

兴趣来自两类数据：

- 用户主动选择的兴趣。
- 系统根据行为推断的兴趣。

主动选择：

- 注册后引导选择兴趣标签。
- 修改个人资料时可调整。
- 写入 `user_interests`，初始权重为 `1.0`。

行为推断：

| 行为 | 权重变化 |
| --- | --- |
| 浏览某标签内容达到有效时长 | 对应标签 +0.1 |
| 收藏某标签内容 | 对应标签 +0.3 |
| 完成某标签小游戏 | 对应标签 +0.5 |
| 连续多次跳过某标签推荐 | 对应标签 -0.2 |

首页展示：

```text
取 user_interests 中权重最高的 4 个 interest 标签
```

示例：

```json
["物理", "AI", "太空", "游戏"]
```

### 10.6 学习风格来源

学习风格是系统画像，不应只让用户手填。第一版可结合注册问卷和学习行为生成。

学习风格标签：

| 标签 | 判定依据 |
| --- | --- |
| 视觉型 | 更常完成图解、动画、实验类内容 |
| 逻辑型 | 更常完成推理、数学、AI 难题拆解 |
| 游戏型 | 小游戏完成率高 |
| 阅读型 | 长文内容完成率高 |
| 实践型 | 开源项目、实验任务参与多 |

建议新增表：

#### 10.6.1 `user_learning_profiles` 用户学习画像表

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| `user_id` | UUID | PK, FK users | 用户 |
| `style_tags` | jsonb |  | 学习风格标签，如 `["visual", "logical"]` |
| `strong_subjects` | jsonb nullable |  | 优势学科 |
| `weak_subjects` | jsonb nullable |  | 需要加强的学科 |
| `preferred_content_types` | jsonb nullable |  | 偏好内容类型 |
| `updated_reason` | text nullable |  | 最近一次更新原因 |
| `created_at` | timestamptz |  | 创建时间 |
| `updated_at` | timestamptz |  | 更新时间 |

更新规则：

- 注册问卷生成初始画像。
- 每日统计任务根据最近 14 天行为更新画像。
- 用户也可以在个人资料中手动调整偏好。

### 10.7 个性化说明生成

个性化说明不是固定文案，应由规则生成。

模板：

```text
基于{年级}、{兴趣列表}与{学习进度}，为你推荐适合的知识、小游戏和科学探索内容。
```

如果用户填写了性别：

- 性别只作为可选偏好。
- 不限制任何内容访问。
- 可以用于增加多元榜样内容曝光。
- 前端说明应避免暗示访问限制。

### 10.8 个人资料卡接口

建议新增接口：

```text
GET /api/users/me/profile-card
```

认证：

- 需要登录。
- 通过 Authorization Bearer token 或后续 Cookie Session 获取当前用户。

返回示例：

```json
{
  "user": {
    "id": "user_id",
    "nickname": "星火少年",
    "avatar_url": null,
    "school_stage": "middle",
    "grade": 8,
    "grade_label": "初二"
  },
  "growth": {
    "level": 12,
    "total_xp": 2080,
    "current_xp": 870,
    "next_level_xp": 1500,
    "learning_days": 28,
    "streak_days": 7,
    "mastery_percent": 72,
    "badge_count": 16
  },
  "badges": [
    { "name": "探索者", "slug": "explorer" },
    { "name": "逻辑达人", "slug": "logic_master" },
    { "name": "坚持之星", "slug": "streak_star" }
  ],
  "interests": ["物理", "AI", "太空", "游戏"],
  "learning_styles": ["视觉型", "逻辑型"],
  "personalization_text": "基于初二、物理 / AI / 太空兴趣与学习进度，为你推荐适合的内容。"
}
```

### 10.9 未登录状态

未登录时资料卡不应该伪装成真实用户数据。

展示建议：

- 昵称：`你好，星火少年！`
- 等级：不显示或显示 `Lv.1`
- 经验值：显示引导态，例如 `登录后记录学习成长`
- 徽章：展示示例徽章但标记为引导态。
- 年级、兴趣、学习风格：展示“登录后生成”或使用轻量示例。

未登录接口行为：

- `GET /api/users/me/profile-card` 返回 401。
- 前端使用默认引导态。

### 10.10 数据获取流程

```text
页面加载
  ↓
检查登录态
  ↓
未登录：右上角显示登录按钮，浮窗显示默认引导资料卡
  ↓
已登录：请求 /api/users/me/profile-card
  ↓
后端聚合 users + user_growth_stats + user_badges + user_interests + user_learning_profiles
  ↓
返回资料卡结构
  ↓
前端在右上角用户按钮浮窗中渲染头像、昵称、等级、经验、徽章、年级、兴趣、学习风格
```

### 10.11 字段获取与生成策略

个人资料卡和成长指标要采用“事件采集 + 汇总读取”的方式获取，不能让前端自己拼假数据，也不能每次打开首页都实时扫描大量明细表。

#### 10.11.1 获取链路

```text
注册 / 登录
  ↓
创建 users 基础资料
  ↓
用户浏览、完成内容、玩游戏、掌握知识点
  ↓
后端统一写入 learning_events
  ↓
同步或异步更新 learning_progress、user_daily_learning_stats、user_growth_stats
  ↓
徽章规则检查，写入 user_badges
  ↓
首页调用 /api/users/me/profile-card
  ↓
后端聚合并返回资料卡数据
```

#### 10.11.2 字段获取明细

| 页面字段 | 直接来源 | 生成方式 | 触发时机 |
| --- | --- | --- | --- |
| 昵称 | `users.nickname` | 注册填写，个人资料可修改 | 注册 / 修改资料 |
| 头像 | `users.avatar_url` | 用户上传；为空时前端用昵称首字兜底 | 上传头像 / 页面渲染 |
| 年级 | `users.grade` + `users.school_stage` | 注册填写，后端转换为“小五 / 初二 / 高一” | 注册 / 修改资料 |
| 兴趣 | `user_interests` + `tags` | 注册选择初始兴趣；行为持续调整权重 | 注册 / 有效行为后 |
| 学习风格 | `user_learning_profiles.style_tags` | 注册问卷生成初始值；近 14 天行为校准 | 注册 / 每日任务 |
| 学习天数 | `user_growth_stats.learning_days` | 按 `learning_events.is_effective = true` 的日期去重统计 | 有效学习事件后 |
| 连续学习 | `user_growth_stats.streak_days` | 从最近有效学习日向前查连续日期 | 有效学习事件后 / 每日任务 |
| 知识点掌握 | `user_growth_stats.mastery_percent` | `mastered_knowledge_count / target_knowledge_count` | 学习进度变化后 |
| 徽章总数 | `user_growth_stats.badge_count` | 统计未撤销的 `user_badges` | 徽章发放 / 撤销后 |
| 首页徽章标签 | `user_badges` + `badges` | 置顶优先，其次最近获得，再用默认成长标签兜底 | 页面请求时排序 |
| 等级 | `user_growth_stats.level` | 根据 `total_xp` 计算并沉淀 | XP 变化后 |
| 经验值 | `user_growth_stats.total_xp/current_xp/next_level_xp` | 学习事件按规则发 XP，再计算当前等级进度 | 有效学习事件后 |
| 个性化说明 | 聚合字段 | 根据年级、兴趣、掌握率和推荐场景生成一句说明 | 页面请求时生成 |

#### 10.11.3 前端如何上报

前端只上报用户行为，不直接告诉后端“今天学习了”“获得徽章了”。

建议第一版提供统一事件接口：

```text
POST /api/users/me/learning-events
```

请求示例：

```json
{
  "event_type": "content_complete",
  "target_type": "content",
  "target_id": "content_id",
  "duration_seconds": 96,
  "progress_percent": 92
}
```

后端处理规则：

- 校验用户是否登录。
- 校验目标内容、小游戏或知识点是否存在且可访问。
- 根据事件类型和阈值判定 `is_effective`。
- 自动补全 `event_date`、`subject`、`knowledge_point_id` 等字段。
- 写入 `learning_events`。
- 更新当天 `user_daily_learning_stats`。
- 刷新用户 `user_growth_stats`。
- 检查徽章规则。

#### 10.11.4 哪些行为会产生有效数据

| 用户行为 | 前端事件 | 后端写入 | 影响字段 |
| --- | --- | --- | --- |
| 阅读内容超过 30 秒 | `content_view` | `learning_events`，有效 | 学习天数、兴趣权重、学习风格 |
| 阅读进度达到 80% | `content_complete` | `learning_events` + `user_content_actions` | 学习天数、XP、兴趣、推荐 |
| 完成小游戏关卡 | `level_complete` | `game_records` + `learning_events` | 学习天数、XP、徽章、知识点进度 |
| 完成知识点任务 | `knowledge_complete` | `learning_progress` + `learning_events` | 知识点掌握、XP、徽章 |
| 掌握知识点 | `knowledge_mastered` | `learning_progress.status = mastered` | 掌握率、XP、学科徽章 |
| 收藏内容 | `favorite_content` | `user_favorites` | 推荐、兴趣权重，不单独计入学习天数 |
| 登录 | 无学习事件 | 更新 `users.last_login_at` | 不计入学习天数 |

#### 10.11.5 后端如何聚合资料卡

`GET /api/users/me/profile-card` 的后端逻辑：

1. 通过登录 token 找到当前用户。
2. 读取 `users`，得到昵称、头像、年级和学习阶段。
3. 读取或创建 `user_growth_stats`，没有统计时返回 0 值和 Lv.1。
4. 读取 `user_interests` 里权重最高的 4 个兴趣标签。
5. 读取 `user_learning_profiles`，没有画像时根据用户兴趣给出默认学习风格。
6. 读取 `user_badges` 和 `badges`，按置顶、等级、获得时间排序，最多返回 3 个。
7. 拼接 `grade_label` 和 `personalization_text`。
8. 返回稳定结构，前端只负责渲染。

#### 10.11.6 首次注册用户如何显示

新用户没有学习事件时，后端不返回空白卡片，而返回可解释的初始状态：

```json
{
  "growth": {
    "level": 1,
    "total_xp": 0,
    "current_xp": 0,
    "next_level_xp": 10,
    "learning_days": 0,
    "streak_days": 0,
    "mastery_percent": 0,
    "badge_count": 0
  },
  "badges": [
    { "name": "探索者", "slug": "explorer", "is_default": true }
  ]
}
```

当用户完成第一条有效学习事件后，系统开始生成真实学习天数、XP 和徽章。

### 10.12 MVP 优先级

第一阶段：

- 从 `users` 获取昵称、头像、年级。
- 从 `user_interests` 获取兴趣。
- 从 `user_growth_stats` 获取等级、经验和成长指标。
- 从 `user_badges` 获取首页展示徽章。
- 提供 `/api/users/me/profile-card`。

第二阶段：

- 增加 `user_learning_profiles`。
- 根据行为自动更新学习风格。
- 支持用户置顶徽章。
- 支持个性化说明模板配置。
