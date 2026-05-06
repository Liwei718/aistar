import "dotenv/config";
import { createHash } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function main() {
  const tags = await Promise.all(
    [
      { name: "AI", slug: "ai", tag_type: "interest" },
      { name: "物理", slug: "physics", tag_type: "interest" },
      { name: "太空", slug: "space", tag_type: "interest" },
      { name: "小游戏", slug: "games", tag_type: "topic" }
    ].map((tag) =>
      prisma.tag.upsert({
        where: { slug: tag.slug },
        update: tag,
        create: tag
      })
    )
  );

  const user = await prisma.user.upsert({
    where: { email: "student@example.com" },
    update: {
      nickname: "星火少年",
      school_stage: "middle",
      grade: 8,
      learning_preference: { style: ["visual", "game"], pace: "normal" }
    },
    create: {
      email: "student@example.com",
      nickname: "星火少年",
      school_stage: "middle",
      grade: 8,
      learning_preference: { style: ["visual", "game"], pace: "normal" }
    }
  });

  for (let i = 0; i < 3; i++) {
    await prisma.userInterest.upsert({
      where: { user_id_tag_id: { user_id: user.id, tag_id: tags[i].id } },
      update: { weight: 1 + i * 0.2 },
      create: { user_id: user.id, tag_id: tags[i].id, weight: 1 + i * 0.2 }
    });
  }

  const knowledgePoint = await prisma.knowledgePoint.upsert({
    where: { slug: "stable-orbit" },
    update: {
      status: "published",
      plain_explanation: "稳定轨道来自速度方向和引力之间的持续平衡。"
    },
    create: {
      name: "稳定轨道",
      slug: "stable-orbit",
      school_stage: "middle",
      grade: 8,
      subject: "physics",
      difficulty: "normal",
      curriculum_concept: "力与运动",
      plain_explanation: "稳定轨道来自速度方向和引力之间的持续平衡。",
      diagram_steps: [
        "物体具有向前的速度",
        "引力持续改变速度方向",
        "速度大小合适时形成稳定轨道"
      ],
      common_misunderstandings: ["轨道不是没有引力，而是一直在受到引力。"],
      examples: ["调节探测器推力，让它绕恒星稳定运动。"],
      ai_science_extension: "航天器轨道规划会使用大量计算和仿真。",
      recommended_minutes: 12,
      status: "published"
    }
  });

  const content = await prisma.content.upsert({
    where: { slug: "orbit-game-learning" },
    update: {
      status: "published",
      published_at: new Date()
    },
    create: {
      content_type: "knowledge_article",
      title: "用小游戏理解稳定轨道",
      slug: "orbit-game-learning",
      summary: "通过调节推力，观察速度和引力如何共同决定轨道。",
      body: "当探测器速度太小，会被恒星拉回；速度太大，会飞离轨道。合适的速度会让它不断下落又不断错过恒星，形成稳定轨道。",
      school_stage: "middle",
      min_grade: 7,
      max_grade: 9,
      subject: "physics",
      difficulty: "normal",
      status: "published",
      published_at: new Date()
    }
  });

  await prisma.contentTag.upsert({
    where: { content_id_tag_id: { content_id: content.id, tag_id: tags[1].id } },
    update: {},
    create: { content_id: content.id, tag_id: tags[1].id }
  });

  await prisma.contentKnowledgePoint.upsert({
    where: {
      content_id_knowledge_point_id: {
        content_id: content.id,
        knowledge_point_id: knowledgePoint.id
      }
    },
    update: { relation_type: "primary" },
    create: {
      content_id: content.id,
      knowledge_point_id: knowledgePoint.id,
      relation_type: "primary"
    }
  });

  const knowledgeSeeds = [
    {
      name: "圆的周长和面积",
      slug: "grade6-circle-perimeter-area",
      school_stage: "primary",
      grade: 6,
      subject: "math",
      difficulty: "normal",
      curriculum_concept: "圆",
      plain_explanation: "圆可以用半径和直径描述大小，周长表示绕圆一圈的长度，面积表示圆内部占据的平面大小。",
      diagram_steps: ["找到圆心、半径和直径", "用直径理解周长公式", "把圆近似剪拼成长方形理解面积"],
      common_misunderstandings: ["半径和直径容易混用。", "周长和面积单位不同，不能直接比较。"],
      examples: ["计算操场圆形花坛的围栏长度。", "估算圆形桌布需要多少布料。"],
      ai_science_extension: "可以让 AI 帮你生成不同半径的圆，并比较周长和面积增长速度。",
      recommended_minutes: 15,
      metadata: {
        age_group: "age-10-12",
        textbook: "北师大版六年级数学",
        video: { title: "圆为什么能剪拼出面积公式", url: "https://www.bilibili.com/", duration: "3 分钟", provider: "示例视频" },
        tasks: ["说出半径和直径的关系。", "计算半径 3cm 的圆周长。", "解释圆面积公式从哪里来。"]
      }
    },
    {
      name: "百分数与生活应用",
      slug: "grade6-percent-application",
      school_stage: "primary",
      grade: 6,
      subject: "math",
      difficulty: "normal",
      curriculum_concept: "百分数",
      plain_explanation: "百分数表示一个量是另一个量的百分之几，常用来描述折扣、增长率、命中率和完成率。",
      diagram_steps: ["找单位 1", "把百分数转化成分数或小数", "根据题意列式计算"],
      common_misunderstandings: ["不知道谁是单位 1。", "把增加百分之几和增加到百分之几混淆。"],
      examples: ["商品八折后的价格。", "班级投篮命中率。"],
      ai_science_extension: "可以把新闻里的百分比数据做成图表，训练数据解读能力。",
      recommended_minutes: 14,
      metadata: {
        age_group: "age-10-12",
        textbook: "北师大版六年级数学",
        video: { title: "折扣和增长率怎么理解", url: "https://www.bilibili.com/", duration: "2 分钟", provider: "示例视频" },
        tasks: ["找出一道题里的单位 1。", "计算 120 元打八折后的价格。", "用一句话解释增长率。"]
      }
    },
    {
      name: "科学探究与变量控制",
      slug: "grade6-science-control-variable",
      school_stage: "primary",
      grade: 6,
      subject: "science",
      difficulty: "easy",
      curriculum_concept: "科学探究",
      plain_explanation: "做实验时一次只改变一个条件，其他条件保持相同，才能判断这个条件是否真的影响结果。",
      diagram_steps: ["提出问题", "确定要改变的变量", "保持其他条件相同", "记录并比较结果"],
      common_misunderstandings: ["一次改变太多条件，导致不知道哪个条件起作用。"],
      examples: ["比较不同光照对植物生长的影响。"],
      ai_science_extension: "可以让 AI 帮你检查实验设计里有没有没有控制好的变量。",
      recommended_minutes: 12,
      metadata: {
        age_group: "age-10-12",
        textbook: "人教社科学体系",
        video: { title: "什么叫控制变量", url: "https://www.bilibili.com/", duration: "2 分钟", provider: "示例视频" },
        tasks: ["写出一个实验问题。", "指出实验中的自变量和因变量。", "说出至少两个需要保持不变的条件。"]
      }
    },
    {
      name: "有理数与数轴",
      slug: "grade7-rational-number-line",
      school_stage: "middle",
      grade: 7,
      subject: "math",
      difficulty: "normal",
      curriculum_concept: "有理数",
      plain_explanation: "有理数包括正数、负数和 0。数轴可以把数的位置、大小、相反数和绝对值直观表示出来。",
      diagram_steps: ["画出 0 点", "确定正方向和单位长度", "标出正数和负数", "比较离 0 的距离"],
      common_misunderstandings: ["负数越靠左越小。", "绝对值表示到 0 的距离，不带正负方向。"],
      examples: ["用海拔、温度和收支理解正负数。"],
      ai_science_extension: "可以让 AI 生成生活中的正负数例子，并在数轴上标出来。",
      recommended_minutes: 15,
      metadata: {
        age_group: "age-12-13",
        textbook: "北师大版七年级数学",
        video: { title: "负数为什么在 0 的左边", url: "https://www.bilibili.com/", duration: "3 分钟", provider: "示例视频" },
        tasks: ["在数轴上标出 -3、0、2。", "说出 -5 的相反数。", "解释绝对值的意义。"]
      }
    },
    {
      name: "一元一次方程",
      slug: "grade7-linear-equation",
      school_stage: "middle",
      grade: 7,
      subject: "math",
      difficulty: "normal",
      curriculum_concept: "方程思想",
      plain_explanation: "一元一次方程用一个未知数表示问题中的数量关系，解方程就是找到让等式成立的数。",
      diagram_steps: ["设未知数", "根据等量关系列方程", "用等式性质变形", "检验答案是否符合题意"],
      common_misunderstandings: ["移项时忘记变号。", "只会算式，不会从文字题找等量关系。"],
      examples: ["用方程解决买票、路程和年龄问题。"],
      ai_science_extension: "可以让 AI 把应用题拆成等量关系，再自己列方程验证。",
      recommended_minutes: 18,
      metadata: {
        age_group: "age-12-13",
        textbook: "北师大版七年级数学",
        video: { title: "怎样从应用题列出方程", url: "https://www.bilibili.com/", duration: "4 分钟", provider: "示例视频" },
        tasks: ["写出一个未知数 x 表示什么。", "找出题目里的等量关系。", "解一个简单一元一次方程。"]
      }
    },
    {
      name: "显微观察与生命结构",
      slug: "grade7-science-microscope-life",
      school_stage: "middle",
      grade: 7,
      subject: "science",
      difficulty: "normal",
      curriculum_concept: "生命系统",
      plain_explanation: "显微镜帮助我们看到肉眼看不见的细胞结构。生命体可以从细胞、组织、器官到系统逐层理解。",
      diagram_steps: ["认识显微镜结构", "低倍镜找到目标", "调节焦距看清细胞", "记录观察结果"],
      common_misunderstandings: ["显微镜倍率越高越容易找目标，其实通常先用低倍镜。"],
      examples: ["观察洋葱表皮细胞。"],
      ai_science_extension: "可以用 AI 对照显微图片，练习标注细胞壁、细胞核等结构。",
      recommended_minutes: 16,
      metadata: {
        age_group: "age-12-13",
        textbook: "人教社科学体系",
        video: { title: "第一次使用显微镜", url: "https://www.bilibili.com/", duration: "3 分钟", provider: "示例视频" },
        tasks: ["说出显微镜的两个主要部件。", "解释为什么先用低倍镜。", "画出观察到的细胞结构。"]
      }
    }
  ];

  for (const item of knowledgeSeeds) {
    await prisma.knowledgePoint.upsert({
      where: { slug: item.slug },
      update: {
        name: item.name,
        school_stage: item.school_stage,
        grade: item.grade,
        subject: item.subject,
        difficulty: item.difficulty,
        curriculum_concept: item.curriculum_concept,
        plain_explanation: item.plain_explanation,
        diagram_steps: item.diagram_steps,
        common_misunderstandings: item.common_misunderstandings,
        examples: item.examples,
        ai_science_extension: item.ai_science_extension,
        recommended_minutes: item.recommended_minutes,
        metadata: item.metadata,
        status: "published"
      },
      create: {
        name: item.name,
        slug: item.slug,
        school_stage: item.school_stage,
        grade: item.grade,
        subject: item.subject,
        difficulty: item.difficulty,
        curriculum_concept: item.curriculum_concept,
        plain_explanation: item.plain_explanation,
        diagram_steps: item.diagram_steps,
        common_misunderstandings: item.common_misunderstandings,
        examples: item.examples,
        ai_science_extension: item.ai_science_extension,
        recommended_minutes: item.recommended_minutes,
        metadata: item.metadata,
        status: "published"
      }
    });
  }

  const frontierSeeds = [
    {
      slug: "frontier-multimodal-ai",
      title: "多模态模型正在学习同时理解文字、图片和声音",
      summary: "AI 不只是读文字，还能把图片、声音和文字放在一起判断。它像一个会看图、听课、做笔记的学习助手，但仍需要我们验证来源。",
      body: "多模态模型把文字、图像、声音等信息一起处理。对中小学生来说，可以先把它理解为一个会同时看图、听声音、读文字的工具。它很有用，但仍然可能犯错，所以学习 AI 时也要学习如何检查来源、比较证据和判断答案是否可靠。",
      subject: "ai",
      source_name: "OpenAI Blog",
      source_url: "https://openai.com/news/",
      metadata: {
        category: "ai",
        grade_band: "小学高年级到初中",
        related_knowledge: "信息与信息处理",
        why_it_matters: "它能帮助学生理解 AI 如何处理不同形式的信息，也提醒我们不要盲信模型输出。"
      }
    },
    {
      slug: "frontier-bionic-robot-fish",
      title: "仿生机器人用鱼类动作提升水下稳定性",
      summary: "研究者模仿鱼尾摆动，让机器人在复杂水流中更灵活地转向，和科学课里的力与运动有关。",
      body: "仿生机器人会从动物身上学习运动方式。比如模仿鱼尾摆动，可以让水下机器人更稳定地前进和转弯。这类研究把生物观察、力与运动、材料设计和控制算法联系在一起，很适合用来理解科学探究如何变成工程方案。",
      subject: "science",
      source_name: "MIT CSAIL",
      source_url: "https://www.csail.mit.edu/news",
      metadata: {
        category: "robotics",
        grade_band: "小学高年级到初中",
        related_knowledge: "力与运动",
        why_it_matters: "仿生设计能把生物观察变成工程方案，适合连接科学探究和机器人学习。"
      }
    },
    {
      slug: "frontier-early-galaxy-observation",
      title: "新观测数据帮助理解早期星系形成",
      summary: "望远镜看到的古老光线，能帮助我们理解宇宙早期发生了什么，也让光年和宇宙年龄变得更具体。",
      body: "天文望远镜接收到的遥远星光，可能来自很久以前的宇宙。科学家通过分析这些光，推测早期星系如何形成。学生可以把这条新闻和光年、宇宙、星系、望远镜观测等知识联系起来理解。",
      subject: "science",
      source_name: "NASA Science",
      source_url: "https://science.nasa.gov/",
      metadata: {
        category: "space",
        grade_band: "初中以上",
        related_knowledge: "宇宙与天体",
        why_it_matters: "太空观测能把课本里的光年、星系和宇宙演化变成真实问题。"
      }
    }
  ];

  for (const item of frontierSeeds) {
    const frontierContent = await prisma.content.upsert({
      where: { slug: item.slug },
      update: {
        title: item.title,
        summary: item.summary,
        body: item.body,
        subject: item.subject,
        source_name: item.source_name,
        source_url: item.source_url,
        metadata: item.metadata,
        status: "published",
        published_at: new Date()
      },
      create: {
        content_type: "frontier_news",
        title: item.title,
        slug: item.slug,
        summary: item.summary,
        body: item.body,
        school_stage: "general",
        min_grade: 5,
        max_grade: 9,
        subject: item.subject,
        difficulty: "normal",
        source_name: item.source_name,
        source_url: item.source_url,
        metadata: item.metadata,
        status: "published",
        published_at: new Date()
      }
    });

    await prisma.contentKnowledgePoint.upsert({
      where: {
        content_id_knowledge_point_id: {
          content_id: frontierContent.id,
          knowledge_point_id: knowledgePoint.id
        }
      },
      update: { relation_type: "related" },
      create: {
        content_id: frontierContent.id,
        knowledge_point_id: knowledgePoint.id,
        relation_type: "related"
      }
    });
  }

  const aiBook = await prisma.aiBook.upsert({
    where: { slug: "ai-magic-with-dad" },
    update: {
      title: "解锁 AI 魔法",
      subtitle: "和爸爸一起走进智能未来",
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
      }
    },
    create: {
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
      }
    }
  });

  const aiChapters = [
    {
      chapter_no: 1,
      title: "先理解 AI 是什么",
      summary: "把 AI 看成一种会从大量例子里总结规律的工具。它不是魔法师，而是能帮我们观察、分类、生成和推理的智能伙伴。",
      key_points: ["模式识别", "数据", "智能工具"]
    },
    {
      chapter_no: 2,
      title: "学习怎么和 AI 对话",
      summary: "好问题会带来好答案。学习描述目标、补充背景、给出限制条件，是使用 AI 的第一项核心能力。",
      key_points: ["提示词", "背景信息", "限制条件"]
    },
    {
      chapter_no: 3,
      title: "练习判断 AI 的答案",
      summary: "AI 可能会答错，也可能遗漏信息。读者需要学会追问、核对来源、比较不同答案，并保留自己的判断。",
      key_points: ["追问", "核实", "独立判断"]
    },
    {
      chapter_no: 4,
      title: "把 AI 用到学习和创造里",
      summary: "可以让 AI 帮忙解释知识点、设计小游戏、整理读书笔记、生成创意草稿，但最后的理解和作品要由自己完成。",
      key_points: ["学习助手", "创造", "作品意识"]
    }
  ];

  for (const chapter of aiChapters) {
    await prisma.aiBookChapter.upsert({
      where: {
        book_id_chapter_no: {
          book_id: aiBook.id,
          chapter_no: chapter.chapter_no
        }
      },
      update: {
        title: chapter.title,
        summary: chapter.summary,
        key_points: chapter.key_points,
        status: "published",
        sort_order: chapter.chapter_no
      },
      create: {
        book_id: aiBook.id,
        chapter_no: chapter.chapter_no,
        title: chapter.title,
        summary: chapter.summary,
        key_points: chapter.key_points,
        status: "published",
        sort_order: chapter.chapter_no
      }
    });
  }

  const firstChapter = await prisma.aiBookChapter.findFirst({
    where: { book_id: aiBook.id, chapter_no: 1 }
  });

  const aiTasks = [
    {
      task_type: "keyword",
      title: "写下 3 个关键词",
      description: "读完一节后，用自己的话写下 3 个关键词。",
      prompt: "这节里哪三个词最重要？为什么？"
    },
    {
      task_type: "prompt",
      title: "改写一个更清楚的问题",
      description: "向 AI 提一个更清楚的问题，再比较两次回答。",
      prompt: "把一个模糊问题改成有目标、有背景、有要求的问题。"
    },
    {
      task_type: "verify",
      title: "找出需要核实的地方",
      description: "找出一个 AI 回答里需要核实的地方。",
      prompt: "这段回答里哪句话需要查来源？"
    },
    {
      task_type: "card",
      title: "做成学习卡片",
      description: "把本章内容做成一张学习卡片。",
      prompt: "用一句话解释本章，再配一个生活例子。"
    }
  ];

  for (const [index, task] of aiTasks.entries()) {
    await prisma.aiBookTask.upsert({
      where: {
        id: `00000000-0000-0000-0000-00000000040${index + 1}`
      },
      update: {
        book_id: aiBook.id,
        chapter_id: firstChapter?.id ?? null,
        task_type: task.task_type,
        title: task.title,
        description: task.description,
        prompt: task.prompt,
        status: "published",
        sort_order: index + 1
      },
      create: {
        id: `00000000-0000-0000-0000-00000000040${index + 1}`,
        book_id: aiBook.id,
        chapter_id: firstChapter?.id ?? null,
        task_type: task.task_type,
        title: task.title,
        description: task.description,
        prompt: task.prompt,
        status: "published",
        sort_order: index + 1
      }
    });
  }

  await prisma.userBookProgress.upsert({
    where: {
      user_id_book_id_chapter_id: {
        user_id: user.id,
        book_id: aiBook.id,
        chapter_id: firstChapter?.id ?? null
      }
    },
    update: {
      progress_percent: 25,
      status: "reading",
      last_read_at: new Date()
    },
    create: {
      user_id: user.id,
      book_id: aiBook.id,
      chapter_id: firstChapter?.id ?? null,
      progress_percent: 25,
      status: "reading",
      last_read_at: new Date()
    }
  });

  await prisma.game.updateMany({
    where: { slug: "gravity-orbit-challenge" },
    data: { status: "offline" }
  });

  const gameSeeds = [
    {
      name: "足球冠军赛",
      slug: "football-championship",
      description: "5v5 对抗，带球、传球、射门，赢下整场比赛。",
      entry_url: "/kevin-olympic-games/football-match/index.html",
      level_name: "冠军赛"
    },
    {
      name: "守门员挑战",
      slug: "goalkeeper-challenge",
      description: "判断射门方向，移动和起跳，把球扑出去。",
      entry_url: "/kevin-olympic-games/goalkeeper/index.html",
      level_name: "扑救挑战"
    },
    {
      name: "点球大战",
      slug: "penalty-shootout",
      description: "瞄准、蓄力、射门，和对手轮流决胜。",
      entry_url: "/kevin-olympic-games/penalty-shootout/index.html",
      level_name: "罚球点"
    },
    {
      name: "乒乓球冠军赛",
      slug: "table-tennis-championship",
      description: "移动球拍、抓住反弹节奏，连续击败挑战者。",
      entry_url: "/kevin-olympic-games/pingpong/index.html",
      level_name: "挑战者赛"
    },
    {
      name: "游泳竞速",
      slug: "swimming-race",
      description: "掌握节奏和体力，在泳道里冲向终点。",
      entry_url: "/kevin-olympic-games/swimming/index.html",
      level_name: "泳道竞速"
    }
  ];

  let featuredGame = null;
  for (const item of gameSeeds) {
    const game = await prisma.game.upsert({
      where: { slug: item.slug },
      update: {
        name: item.name,
        description: item.description,
        game_type: "sports",
        school_stage: "middle",
        min_grade: 4,
        max_grade: 9,
        subject: "science",
        difficulty: "normal",
        entry_url: item.entry_url,
        status: "published"
      },
      create: {
        name: item.name,
        slug: item.slug,
        description: item.description,
        game_type: "sports",
        school_stage: "middle",
        min_grade: 4,
        max_grade: 9,
        subject: "science",
        difficulty: "normal",
        entry_url: item.entry_url,
        status: "published"
      }
    });

    if (item.slug === "table-tennis-championship") {
      featuredGame = game;
    }

    await prisma.gameLevel.upsert({
      where: { game_id_level_no: { game_id: game.id, level_no: 1 } },
      update: {
        name: item.level_name,
        description: item.description,
        difficulty: "easy",
        config: { medal: "bronze" }
      },
      create: {
        game_id: game.id,
        level_no: 1,
        name: item.level_name,
        description: item.description,
        difficulty: "easy",
        config: { medal: "bronze" }
      }
    });

    await prisma.gameKnowledgePoint.upsert({
      where: {
        game_id_knowledge_point_id: {
          game_id: game.id,
          knowledge_point_id: knowledgePoint.id
        }
      },
      update: {},
      create: { game_id: game.id, knowledge_point_id: knowledgePoint.id }
    });
  }

  const rule = await prisma.recommendationRule.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {
      enabled: true,
      conditions: { grade: [7, 8, 9], interests: ["physics", "space"] },
      strategy: { freshness: 0.3, difficultyMatch: 0.4, interestMatch: 0.3 }
    },
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "初中物理兴趣推荐",
      scene: "home",
      target_type: "content",
      conditions: { grade: [7, 8, 9], interests: ["physics", "space"] },
      strategy: { freshness: 0.3, difficultyMatch: 0.4, interestMatch: 0.3 },
      priority: 10
    }
  });

  await prisma.recommendation.upsert({
    where: { id: "00000000-0000-0000-0000-000000000201" },
    update: {
      user_id: user.id,
      scene: "home",
      target_type: "content",
      target_id: content.id,
      rule_id: rule.id,
      score: 0.92,
      reason: "匹配你的年级、物理兴趣和太空主题。",
      rank_no: 1
    },
    create: {
      id: "00000000-0000-0000-0000-000000000201",
      user_id: user.id,
      scene: "home",
      target_type: "content",
      target_id: content.id,
      rule_id: rule.id,
      score: 0.92,
      reason: "匹配你的年级、物理兴趣和太空主题。",
      rank_no: 1
    }
  });

  await prisma.newsSource.upsert({
    where: { id: "00000000-0000-0000-0000-000000000101" },
    update: {
      enabled: true,
      last_fetch_status: "seeded"
    },
    create: {
      id: "00000000-0000-0000-0000-000000000101",
      name: "NASA Science",
      source_type: "rss",
      url: "https://science.nasa.gov/feed/",
      default_tag_ids: [tags[2].id],
      trust_level: 5,
      last_fetch_status: "seeded"
    }
  });

  const projectSeeds = [
    {
      name: "Orbit Sim",
      slug: "orbit-sim",
      repo_url: "https://github.com/example/orbit-sim",
      description: "一个用于理解轨道运动的开源模拟项目。",
      readme_summary: "适合学习基础物理模拟、Canvas 动画和参数调节。",
      stars: 128,
      forks: 24,
      language: "TypeScript",
      license: "MIT",
      category: "science",
      learning_value: "学习速度、引力、轨道稳定和简单数值模拟。",
      recommend_reason: "主题和首页小游戏一致，适合边玩边改。",
      remix_ideas: "增加不同星球质量、轨道预测线和关卡编辑器。"
    },
    {
      name: "Mini Agent Studio",
      slug: "mini-agent-studio",
      repo_url: "https://github.com/example/mini-agent-studio",
      description: "用简单流程搭建 AI 小助手。",
      readme_summary: "适合理解提示词、工具调用和任务拆解。",
      stars: 14200,
      forks: 980,
      language: "Python",
      license: "Apache-2.0",
      category: "ai",
      learning_value: "学习 AI 助手如何拆解任务和调用工具。",
      recommend_reason: "适合做自己的学习助手原型。",
      remix_ideas: "改造成数学题解释助手或科学人物问答助手。"
    },
    {
      name: "Physics Playground",
      slug: "physics-playground",
      repo_url: "https://github.com/example/physics-playground",
      description: "浏览器里的物理小游戏模板。",
      readme_summary: "可以改造成力学、碰撞和能量守恒实验。",
      stars: 11900,
      forks: 720,
      language: "JavaScript",
      license: "MIT",
      category: "game",
      learning_value: "学习碰撞检测、速度、加速度和能量变化。",
      recommend_reason: "适合和奥林匹克小游戏联动。",
      remix_ideas: "增加关卡、计分和知识点提示。"
    },
    {
      name: "Learn Python by Building",
      slug: "learn-python-by-building",
      repo_url: "https://github.com/example/learn-python-by-building",
      description: "通过小项目学习 Python。",
      readme_summary: "适合从变量、函数和文件读写开始入门。",
      stars: 8700,
      forks: 640,
      language: "Python",
      license: "MIT",
      category: "beginner",
      learning_value: "用项目方式理解编程基础概念。",
      recommend_reason: "适合零基础学生从做中学。",
      remix_ideas: "增加中文任务卡和自动检查脚本。"
    },
    {
      name: "Math Graph Lab",
      slug: "math-graph-lab",
      repo_url: "https://github.com/example/math-graph-lab",
      description: "把函数、几何和统计图形画出来。",
      readme_summary: "适合做课内数学知识的互动展示。",
      stars: 6400,
      forks: 390,
      language: "TypeScript",
      license: "MIT",
      category: "science",
      learning_value: "学习函数图像、数据可视化和交互设计。",
      recommend_reason: "适合连接数学知识库。",
      remix_ideas: "增加北师大版六年级和初一知识点模板。"
    }
  ];

  const ranking = await prisma.projectRanking.upsert({
    where: { id: "00000000-0000-0000-0000-000000000301" },
    update: {
      name: "2026 第 18 周开源项目增长榜",
      description: "每周保存一次，展示适合学生试玩和改造的开源项目。",
      enabled: true
    },
    create: {
      id: "00000000-0000-0000-0000-000000000301",
      name: "2026 第 18 周开源项目增长榜",
      ranking_type: "weekly_growth",
      description: "每周保存一次，展示适合学生试玩和改造的开源项目。",
      enabled: true
    }
  });

  for (const [index, item] of projectSeeds.entries()) {
    const project = await prisma.openSourceProject.upsert({
      where: { repo_url_hash: sha256(item.repo_url) },
      update: {
        name: item.name,
        description: item.description,
        readme_summary: item.readme_summary,
        stars: item.stars,
        forks: item.forks,
        language: item.language,
        license: item.license,
        learning_value: item.learning_value,
        recommend_reason: item.recommend_reason,
        remix_ideas: item.remix_ideas,
        metadata: { category: item.category, weekly_star_growth: item.stars },
        status: "published"
      },
      create: {
        name: item.name,
        slug: item.slug,
        repo_url: item.repo_url,
        repo_url_hash: sha256(item.repo_url),
        description: item.description,
        readme_summary: item.readme_summary,
        stars: item.stars,
        forks: item.forks,
        language: item.language,
        license: item.license,
        school_stage: "middle",
        min_grade: 6,
        max_grade: 9,
        difficulty: item.category === "beginner" ? "easy" : "normal",
        learning_value: item.learning_value,
        recommend_reason: item.recommend_reason,
        remix_ideas: item.remix_ideas,
        metadata: { category: item.category, weekly_star_growth: item.stars },
        status: "published"
      }
    });

    await prisma.projectRankingItem.upsert({
      where: {
        ranking_id_project_id: {
          ranking_id: ranking.id,
          project_id: project.id
        }
      },
      update: {
        rank_no: index + 1,
        reason: item.recommend_reason
      },
      create: {
        ranking_id: ranking.id,
        project_id: project.id,
        rank_no: index + 1,
        reason: item.recommend_reason
      }
    });

    await prisma.projectKnowledgePoint.upsert({
      where: {
        project_id_knowledge_point_id: {
          project_id: project.id,
          knowledge_point_id: knowledgePoint.id
        }
      },
      update: {},
      create: {
        project_id: project.id,
        knowledge_point_id: knowledgePoint.id
      }
    });
  }

  console.log("Seed data created.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
