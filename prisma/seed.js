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

  await prisma.game.updateMany({
    where: { slug: "gravity-orbit-challenge" },
    data: { status: "offline" }
  });

  const game = await prisma.game.upsert({
    where: { slug: "table-tennis-championship" },
    update: {
      name: "乒乓球冠军赛",
      description: "移动球拍、抓住反弹节奏，连续击败挑战者。",
      game_type: "sports",
      school_stage: "middle",
      min_grade: 4,
      max_grade: 9,
      subject: "science",
      difficulty: "normal",
      entry_url: "/kevin-olympic-games/pingpong/index.html",
      status: "published"
    },
    create: {
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
      status: "published"
    }
  });

  await prisma.gameLevel.upsert({
    where: { game_id_level_no: { game_id: game.id, level_no: 1 } },
    update: { name: "挑战者赛" },
    create: {
      game_id: game.id,
      level_no: 1,
      name: "挑战者赛",
      description: "移动球拍接住来球，观察节奏并连续得分。",
      difficulty: "easy",
      config: { targetHits: 10, medal: "bronze" }
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

  await prisma.openSourceProject.upsert({
    where: { repo_url_hash: sha256("https://github.com/example/orbit-sim") },
    update: {
      status: "published",
      stars: 128
    },
    create: {
      name: "Orbit Sim",
      slug: "orbit-sim",
      repo_url: "https://github.com/example/orbit-sim",
      repo_url_hash: sha256("https://github.com/example/orbit-sim"),
      description: "一个用于理解轨道运动的开源模拟项目。",
      readme_summary: "适合学习基础物理模拟、Canvas 动画和参数调节。",
      stars: 128,
      forks: 24,
      language: "TypeScript",
      license: "MIT",
      school_stage: "middle",
      min_grade: 7,
      max_grade: 9,
      difficulty: "normal",
      learning_value: "学习速度、引力、轨道稳定和简单数值模拟。",
      recommend_reason: "主题和首页小游戏一致，适合边玩边改。",
      remix_ideas: "增加不同星球质量、轨道预测线和关卡编辑器。",
      status: "published"
    }
  });

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
