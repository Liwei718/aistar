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
