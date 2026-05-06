-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('frontier_news', 'open_source_intro', 'knowledge_article', 'ai_problem', 'scientist', 'experiment', 'game_intro', 'learning_path_node');

-- CreateEnum
CREATE TYPE "PublishStatus" AS ENUM ('draft', 'pending_review', 'published', 'offline', 'rejected');

-- CreateEnum
CREATE TYPE "SchoolStage" AS ENUM ('primary', 'middle', 'high', 'general');

-- CreateEnum
CREATE TYPE "Subject" AS ENUM ('math', 'physics', 'chemistry', 'biology', 'information_tech', 'chinese_logic', 'english_tech_reading', 'science', 'ai', 'general');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('easy', 'normal', 'hard', 'advanced');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('official_blog', 'research_org', 'rss', 'github_trending', 'hugging_face', 'arxiv', 'tech_media', 'manual');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('pending', 'approved', 'returned', 'deleted', 'unsuitable');

-- CreateEnum
CREATE TYPE "RecommendationScene" AS ENUM ('home', 'knowledge', 'game', 'project', 'after_game', 'learning_path');

-- CreateEnum
CREATE TYPE "GameRecordStatus" AS ENUM ('started', 'completed', 'failed', 'abandoned');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255),
    "phone" VARCHAR(32),
    "password_hash" VARCHAR(255),
    "nickname" VARCHAR(80) NOT NULL,
    "avatar_url" TEXT,
    "school_stage" "SchoolStage",
    "grade" SMALLINT,
    "gender" VARCHAR(32),
    "learning_preference" JSONB,
    "status" VARCHAR(32) NOT NULL DEFAULT 'active',
    "last_login_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "role" VARCHAR(32) NOT NULL,
    "status" VARCHAR(32) NOT NULL DEFAULT 'active',
    "last_login_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" UUID NOT NULL,
    "name" VARCHAR(60) NOT NULL,
    "slug" VARCHAR(80) NOT NULL,
    "tag_type" VARCHAR(32) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_interests" (
    "user_id" UUID NOT NULL,
    "tag_id" UUID NOT NULL,
    "weight" DECIMAL(5,2) NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_interests_pkey" PRIMARY KEY ("user_id","tag_id")
);

-- CreateTable
CREATE TABLE "contents" (
    "id" UUID NOT NULL,
    "content_type" "ContentType" NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "slug" VARCHAR(240) NOT NULL,
    "summary" TEXT,
    "body" TEXT NOT NULL,
    "cover_image_url" TEXT,
    "school_stage" "SchoolStage",
    "min_grade" SMALLINT,
    "max_grade" SMALLINT,
    "subject" "Subject",
    "difficulty" "Difficulty",
    "source_url" TEXT,
    "source_name" VARCHAR(120),
    "author_id" UUID,
    "editor_id" UUID,
    "status" "PublishStatus" NOT NULL DEFAULT 'draft',
    "published_at" TIMESTAMPTZ(6),
    "offline_at" TIMESTAMPTZ(6),
    "view_count" BIGINT NOT NULL DEFAULT 0,
    "favorite_count" BIGINT NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "contents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_tags" (
    "content_id" UUID NOT NULL,
    "tag_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_tags_pkey" PRIMARY KEY ("content_id","tag_id")
);

-- CreateTable
CREATE TABLE "content_knowledge_points" (
    "content_id" UUID NOT NULL,
    "knowledge_point_id" UUID NOT NULL,
    "relation_type" VARCHAR(32) NOT NULL DEFAULT 'related',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_knowledge_points_pkey" PRIMARY KEY ("content_id","knowledge_point_id")
);

-- CreateTable
CREATE TABLE "news_sources" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "source_type" "SourceType" NOT NULL,
    "url" TEXT NOT NULL,
    "fetch_interval_minutes" INTEGER NOT NULL DEFAULT 1440,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "default_tag_ids" UUID[],
    "trust_level" SMALLINT NOT NULL DEFAULT 3,
    "last_fetched_at" TIMESTAMPTZ(6),
    "last_fetch_status" VARCHAR(32),
    "last_fetch_message" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "news_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "news_items" (
    "id" UUID NOT NULL,
    "source_id" UUID NOT NULL,
    "source_url" TEXT NOT NULL,
    "source_url_hash" VARCHAR(64) NOT NULL,
    "title" VARCHAR(300) NOT NULL,
    "summary" TEXT,
    "raw_content" TEXT,
    "author" VARCHAR(120),
    "published_at" TIMESTAMPTZ(6),
    "fetched_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "language" VARCHAR(16),
    "status" VARCHAR(32) NOT NULL DEFAULT 'new',
    "content_id" UUID,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "news_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_drafts" (
    "id" UUID NOT NULL,
    "news_item_id" UUID,
    "source_content_id" UUID,
    "draft_type" VARCHAR(64) NOT NULL,
    "title" VARCHAR(200),
    "summary" TEXT,
    "body" TEXT,
    "suggested_tags" JSONB,
    "suggested_knowledge_points" JSONB,
    "model_name" VARCHAR(120),
    "prompt_version" VARCHAR(64),
    "status" VARCHAR(32) NOT NULL DEFAULT 'generated',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ai_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_tasks" (
    "id" UUID NOT NULL,
    "target_type" VARCHAR(32) NOT NULL,
    "target_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "status" "ReviewStatus" NOT NULL DEFAULT 'pending',
    "priority" SMALLINT NOT NULL DEFAULT 0,
    "assignee_id" UUID,
    "submitted_by_id" UUID,
    "reviewed_by_id" UUID,
    "review_comment" TEXT,
    "submitted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "review_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "actor_type" VARCHAR(32) NOT NULL,
    "actor_id" UUID,
    "action" VARCHAR(80) NOT NULL,
    "target_type" VARCHAR(64) NOT NULL,
    "target_id" UUID,
    "before_data" JSONB,
    "after_data" JSONB,
    "ip" INET,
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_points" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "slug" VARCHAR(160) NOT NULL,
    "school_stage" "SchoolStage" NOT NULL,
    "grade" SMALLINT,
    "subject" "Subject" NOT NULL,
    "difficulty" "Difficulty" NOT NULL,
    "curriculum_concept" TEXT,
    "plain_explanation" TEXT,
    "diagram_steps" JSONB,
    "common_misunderstandings" JSONB,
    "examples" JSONB,
    "ai_science_extension" TEXT,
    "recommended_minutes" INTEGER,
    "status" "PublishStatus" NOT NULL DEFAULT 'draft',
    "created_by_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "knowledge_points_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_relations" (
    "from_knowledge_point_id" UUID NOT NULL,
    "to_knowledge_point_id" UUID NOT NULL,
    "relation_type" VARCHAR(32) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_relations_pkey" PRIMARY KEY ("from_knowledge_point_id","to_knowledge_point_id","relation_type")
);

-- CreateTable
CREATE TABLE "games" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "slug" VARCHAR(160) NOT NULL,
    "description" TEXT,
    "game_type" VARCHAR(64) NOT NULL,
    "school_stage" "SchoolStage",
    "min_grade" SMALLINT,
    "max_grade" SMALLINT,
    "subject" "Subject",
    "difficulty" "Difficulty",
    "entry_url" TEXT NOT NULL,
    "cover_image_url" TEXT,
    "status" "PublishStatus" NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "games_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_levels" (
    "id" UUID NOT NULL,
    "game_id" UUID NOT NULL,
    "level_no" INTEGER NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "difficulty" "Difficulty",
    "config" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "game_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_knowledge_points" (
    "game_id" UUID NOT NULL,
    "knowledge_point_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "game_knowledge_points_pkey" PRIMARY KEY ("game_id","knowledge_point_id")
);

-- CreateTable
CREATE TABLE "game_records" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "game_id" UUID NOT NULL,
    "level_id" UUID,
    "score" INTEGER,
    "max_score" INTEGER,
    "status" "GameRecordStatus" NOT NULL,
    "started_at" TIMESTAMPTZ(6),
    "completed_at" TIMESTAMPTZ(6),
    "duration_seconds" INTEGER,
    "mistakes" JSONB,
    "learned_knowledge_point_ids" UUID[],
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "game_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_progress" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "knowledge_point_id" UUID NOT NULL,
    "status" VARCHAR(32) NOT NULL DEFAULT 'not_started',
    "progress_percent" SMALLINT NOT NULL DEFAULT 0,
    "mastery_score" DECIMAL(5,2),
    "last_activity_at" TIMESTAMPTZ(6),
    "completed_at" TIMESTAMPTZ(6),
    "source_type" VARCHAR(32),
    "source_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "learning_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_content_actions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "content_id" UUID NOT NULL,
    "action_type" VARCHAR(32) NOT NULL,
    "duration_seconds" INTEGER,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_content_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_favorites" (
    "user_id" UUID NOT NULL,
    "content_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_favorites_pkey" PRIMARY KEY ("user_id","content_id")
);

-- CreateTable
CREATE TABLE "badges" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "slug" VARCHAR(160) NOT NULL,
    "description" TEXT,
    "icon_url" TEXT,
    "rule_config" JSONB,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_badges" (
    "user_id" UUID NOT NULL,
    "badge_id" UUID NOT NULL,
    "earned_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source_type" VARCHAR(32),
    "source_id" UUID,

    CONSTRAINT "user_badges_pkey" PRIMARY KEY ("user_id","badge_id")
);

-- CreateTable
CREATE TABLE "open_source_projects" (
    "id" UUID NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "slug" VARCHAR(180) NOT NULL,
    "repo_url" TEXT NOT NULL,
    "repo_url_hash" VARCHAR(64) NOT NULL,
    "homepage_url" TEXT,
    "description" TEXT,
    "readme_summary" TEXT,
    "stars" INTEGER,
    "forks" INTEGER,
    "language" VARCHAR(80),
    "license" VARCHAR(120),
    "repo_updated_at" TIMESTAMPTZ(6),
    "school_stage" "SchoolStage",
    "min_grade" SMALLINT,
    "max_grade" SMALLINT,
    "difficulty" "Difficulty",
    "learning_value" TEXT,
    "recommend_reason" TEXT,
    "remix_ideas" TEXT,
    "status" "PublishStatus" NOT NULL DEFAULT 'draft',
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "open_source_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_tags" (
    "project_id" UUID NOT NULL,
    "tag_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_tags_pkey" PRIMARY KEY ("project_id","tag_id")
);

-- CreateTable
CREATE TABLE "project_knowledge_points" (
    "project_id" UUID NOT NULL,
    "knowledge_point_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_knowledge_points_pkey" PRIMARY KEY ("project_id","knowledge_point_id")
);

-- CreateTable
CREATE TABLE "project_rankings" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "ranking_type" VARCHAR(64) NOT NULL,
    "description" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "project_rankings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_ranking_items" (
    "ranking_id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "rank_no" INTEGER NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_ranking_items_pkey" PRIMARY KEY ("ranking_id","project_id")
);

-- CreateTable
CREATE TABLE "recommendation_rules" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "scene" "RecommendationScene" NOT NULL,
    "target_type" VARCHAR(32) NOT NULL,
    "conditions" JSONB NOT NULL,
    "strategy" JSONB NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "start_at" TIMESTAMPTZ(6),
    "end_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "recommendation_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recommendations" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "scene" "RecommendationScene" NOT NULL,
    "target_type" VARCHAR(32) NOT NULL,
    "target_id" UUID NOT NULL,
    "rule_id" UUID,
    "score" DECIMAL(8,4),
    "reason" TEXT,
    "rank_no" INTEGER,
    "shown_at" TIMESTAMPTZ(6),
    "clicked_at" TIMESTAMPTZ(6),
    "dismissed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_runs" (
    "id" UUID NOT NULL,
    "job_name" VARCHAR(120) NOT NULL,
    "job_type" VARCHAR(64) NOT NULL,
    "status" VARCHAR(32) NOT NULL,
    "started_at" TIMESTAMPTZ(6) NOT NULL,
    "finished_at" TIMESTAMPTZ(6),
    "duration_ms" INTEGER,
    "success_count" INTEGER NOT NULL DEFAULT 0,
    "failure_count" INTEGER NOT NULL DEFAULT 0,
    "message" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_stats" (
    "id" UUID NOT NULL,
    "stat_date" DATE NOT NULL,
    "metric_key" VARCHAR(120) NOT NULL,
    "metric_value" DECIMAL(18,4) NOT NULL,
    "dimension_type" VARCHAR(64),
    "dimension_value" VARCHAR(120),
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_stats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_school_stage_grade_idx" ON "users"("school_stage", "grade");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users"("email");

-- CreateIndex
CREATE INDEX "admin_users_role_idx" ON "admin_users"("role");

-- CreateIndex
CREATE INDEX "admin_users_status_idx" ON "admin_users"("status");

-- CreateIndex
CREATE UNIQUE INDEX "tags_slug_key" ON "tags"("slug");

-- CreateIndex
CREATE INDEX "tags_tag_type_idx" ON "tags"("tag_type");

-- CreateIndex
CREATE INDEX "user_interests_tag_id_idx" ON "user_interests"("tag_id");

-- CreateIndex
CREATE UNIQUE INDEX "contents_slug_key" ON "contents"("slug");

-- CreateIndex
CREATE INDEX "contents_status_published_at_idx" ON "contents"("status", "published_at");

-- CreateIndex
CREATE INDEX "contents_content_type_status_published_at_idx" ON "contents"("content_type", "status", "published_at");

-- CreateIndex
CREATE INDEX "contents_min_grade_max_grade_idx" ON "contents"("min_grade", "max_grade");

-- CreateIndex
CREATE INDEX "contents_subject_difficulty_idx" ON "contents"("subject", "difficulty");

-- CreateIndex
CREATE INDEX "contents_deleted_at_idx" ON "contents"("deleted_at");

-- CreateIndex
CREATE INDEX "content_tags_tag_id_idx" ON "content_tags"("tag_id");

-- CreateIndex
CREATE INDEX "content_knowledge_points_knowledge_point_id_idx" ON "content_knowledge_points"("knowledge_point_id");

-- CreateIndex
CREATE INDEX "news_sources_source_type_idx" ON "news_sources"("source_type");

-- CreateIndex
CREATE INDEX "news_sources_enabled_idx" ON "news_sources"("enabled");

-- CreateIndex
CREATE UNIQUE INDEX "news_items_source_url_hash_key" ON "news_items"("source_url_hash");

-- CreateIndex
CREATE INDEX "news_items_published_at_idx" ON "news_items"("published_at");

-- CreateIndex
CREATE INDEX "news_items_fetched_at_idx" ON "news_items"("fetched_at");

-- CreateIndex
CREATE INDEX "news_items_status_idx" ON "news_items"("status");

-- CreateIndex
CREATE INDEX "ai_drafts_draft_type_idx" ON "ai_drafts"("draft_type");

-- CreateIndex
CREATE INDEX "ai_drafts_status_idx" ON "ai_drafts"("status");

-- CreateIndex
CREATE INDEX "review_tasks_status_priority_submitted_at_idx" ON "review_tasks"("status", "priority", "submitted_at");

-- CreateIndex
CREATE INDEX "review_tasks_target_type_target_id_idx" ON "review_tasks"("target_type", "target_id");

-- CreateIndex
CREATE INDEX "audit_logs_actor_type_idx" ON "audit_logs"("actor_type");

-- CreateIndex
CREATE INDEX "audit_logs_actor_id_idx" ON "audit_logs"("actor_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_target_type_idx" ON "audit_logs"("target_type");

-- CreateIndex
CREATE INDEX "audit_logs_target_id_idx" ON "audit_logs"("target_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "knowledge_points_slug_key" ON "knowledge_points"("slug");

-- CreateIndex
CREATE INDEX "knowledge_points_school_stage_grade_subject_idx" ON "knowledge_points"("school_stage", "grade", "subject");

-- CreateIndex
CREATE INDEX "knowledge_points_status_idx" ON "knowledge_points"("status");

-- CreateIndex
CREATE INDEX "knowledge_points_deleted_at_idx" ON "knowledge_points"("deleted_at");

-- CreateIndex
CREATE INDEX "knowledge_relations_relation_type_idx" ON "knowledge_relations"("relation_type");

-- CreateIndex
CREATE UNIQUE INDEX "games_slug_key" ON "games"("slug");

-- CreateIndex
CREATE INDEX "games_game_type_idx" ON "games"("game_type");

-- CreateIndex
CREATE INDEX "games_school_stage_idx" ON "games"("school_stage");

-- CreateIndex
CREATE INDEX "games_min_grade_idx" ON "games"("min_grade");

-- CreateIndex
CREATE INDEX "games_max_grade_idx" ON "games"("max_grade");

-- CreateIndex
CREATE INDEX "games_subject_idx" ON "games"("subject");

-- CreateIndex
CREATE INDEX "games_difficulty_idx" ON "games"("difficulty");

-- CreateIndex
CREATE INDEX "games_status_idx" ON "games"("status");

-- CreateIndex
CREATE INDEX "games_deleted_at_idx" ON "games"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "game_levels_game_id_level_no_key" ON "game_levels"("game_id", "level_no");

-- CreateIndex
CREATE INDEX "game_knowledge_points_knowledge_point_id_idx" ON "game_knowledge_points"("knowledge_point_id");

-- CreateIndex
CREATE INDEX "game_records_score_idx" ON "game_records"("score");

-- CreateIndex
CREATE INDEX "game_records_status_idx" ON "game_records"("status");

-- CreateIndex
CREATE INDEX "game_records_completed_at_idx" ON "game_records"("completed_at");

-- CreateIndex
CREATE INDEX "game_records_user_id_completed_at_idx" ON "game_records"("user_id", "completed_at");

-- CreateIndex
CREATE INDEX "game_records_game_id_completed_at_idx" ON "game_records"("game_id", "completed_at");

-- CreateIndex
CREATE INDEX "game_records_user_id_game_id_idx" ON "game_records"("user_id", "game_id");

-- CreateIndex
CREATE INDEX "learning_progress_status_idx" ON "learning_progress"("status");

-- CreateIndex
CREATE INDEX "learning_progress_last_activity_at_idx" ON "learning_progress"("last_activity_at");

-- CreateIndex
CREATE UNIQUE INDEX "learning_progress_user_id_knowledge_point_id_key" ON "learning_progress"("user_id", "knowledge_point_id");

-- CreateIndex
CREATE INDEX "user_content_actions_action_type_idx" ON "user_content_actions"("action_type");

-- CreateIndex
CREATE INDEX "user_content_actions_created_at_idx" ON "user_content_actions"("created_at");

-- CreateIndex
CREATE INDEX "user_content_actions_user_id_created_at_idx" ON "user_content_actions"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "user_content_actions_content_id_action_type_idx" ON "user_content_actions"("content_id", "action_type");

-- CreateIndex
CREATE INDEX "user_favorites_content_id_idx" ON "user_favorites"("content_id");

-- CreateIndex
CREATE UNIQUE INDEX "badges_slug_key" ON "badges"("slug");

-- CreateIndex
CREATE INDEX "user_badges_badge_id_idx" ON "user_badges"("badge_id");

-- CreateIndex
CREATE UNIQUE INDEX "open_source_projects_slug_key" ON "open_source_projects"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "open_source_projects_repo_url_hash_key" ON "open_source_projects"("repo_url_hash");

-- CreateIndex
CREATE INDEX "open_source_projects_stars_idx" ON "open_source_projects"("stars");

-- CreateIndex
CREATE INDEX "open_source_projects_language_idx" ON "open_source_projects"("language");

-- CreateIndex
CREATE INDEX "open_source_projects_repo_updated_at_idx" ON "open_source_projects"("repo_updated_at");

-- CreateIndex
CREATE INDEX "open_source_projects_school_stage_idx" ON "open_source_projects"("school_stage");

-- CreateIndex
CREATE INDEX "open_source_projects_difficulty_idx" ON "open_source_projects"("difficulty");

-- CreateIndex
CREATE INDEX "open_source_projects_status_idx" ON "open_source_projects"("status");

-- CreateIndex
CREATE INDEX "open_source_projects_deleted_at_idx" ON "open_source_projects"("deleted_at");

-- CreateIndex
CREATE INDEX "project_tags_tag_id_idx" ON "project_tags"("tag_id");

-- CreateIndex
CREATE INDEX "project_knowledge_points_knowledge_point_id_idx" ON "project_knowledge_points"("knowledge_point_id");

-- CreateIndex
CREATE INDEX "project_rankings_ranking_type_idx" ON "project_rankings"("ranking_type");

-- CreateIndex
CREATE UNIQUE INDEX "project_ranking_items_ranking_id_rank_no_key" ON "project_ranking_items"("ranking_id", "rank_no");

-- CreateIndex
CREATE INDEX "recommendation_rules_scene_idx" ON "recommendation_rules"("scene");

-- CreateIndex
CREATE INDEX "recommendation_rules_target_type_idx" ON "recommendation_rules"("target_type");

-- CreateIndex
CREATE INDEX "recommendations_scene_idx" ON "recommendations"("scene");

-- CreateIndex
CREATE INDEX "recommendations_target_type_idx" ON "recommendations"("target_type");

-- CreateIndex
CREATE INDEX "recommendations_target_id_idx" ON "recommendations"("target_id");

-- CreateIndex
CREATE INDEX "recommendations_score_idx" ON "recommendations"("score");

-- CreateIndex
CREATE INDEX "recommendations_shown_at_idx" ON "recommendations"("shown_at");

-- CreateIndex
CREATE INDEX "recommendations_clicked_at_idx" ON "recommendations"("clicked_at");

-- CreateIndex
CREATE INDEX "recommendations_created_at_idx" ON "recommendations"("created_at");

-- CreateIndex
CREATE INDEX "recommendations_user_id_scene_created_at_idx" ON "recommendations"("user_id", "scene", "created_at");

-- CreateIndex
CREATE INDEX "recommendations_target_type_target_id_idx" ON "recommendations"("target_type", "target_id");

-- CreateIndex
CREATE INDEX "job_runs_job_name_idx" ON "job_runs"("job_name");

-- CreateIndex
CREATE INDEX "job_runs_job_type_idx" ON "job_runs"("job_type");

-- CreateIndex
CREATE INDEX "job_runs_status_idx" ON "job_runs"("status");

-- CreateIndex
CREATE INDEX "job_runs_started_at_idx" ON "job_runs"("started_at");

-- CreateIndex
CREATE INDEX "daily_stats_stat_date_idx" ON "daily_stats"("stat_date");

-- CreateIndex
CREATE INDEX "daily_stats_metric_key_idx" ON "daily_stats"("metric_key");

-- CreateIndex
CREATE INDEX "daily_stats_dimension_type_idx" ON "daily_stats"("dimension_type");

-- CreateIndex
CREATE INDEX "daily_stats_dimension_value_idx" ON "daily_stats"("dimension_value");

-- CreateIndex
CREATE UNIQUE INDEX "daily_stats_stat_date_metric_key_dimension_type_dimension_v_key" ON "daily_stats"("stat_date", "metric_key", "dimension_type", "dimension_value");

-- AddForeignKey
ALTER TABLE "user_interests" ADD CONSTRAINT "user_interests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_interests" ADD CONSTRAINT "user_interests_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contents" ADD CONSTRAINT "contents_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contents" ADD CONSTRAINT "contents_editor_id_fkey" FOREIGN KEY ("editor_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_tags" ADD CONSTRAINT "content_tags_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_tags" ADD CONSTRAINT "content_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_knowledge_points" ADD CONSTRAINT "content_knowledge_points_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_knowledge_points" ADD CONSTRAINT "content_knowledge_points_knowledge_point_id_fkey" FOREIGN KEY ("knowledge_point_id") REFERENCES "knowledge_points"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "news_items" ADD CONSTRAINT "news_items_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "news_sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "news_items" ADD CONSTRAINT "news_items_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "contents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_drafts" ADD CONSTRAINT "ai_drafts_news_item_id_fkey" FOREIGN KEY ("news_item_id") REFERENCES "news_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_drafts" ADD CONSTRAINT "ai_drafts_source_content_id_fkey" FOREIGN KEY ("source_content_id") REFERENCES "contents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_tasks" ADD CONSTRAINT "review_tasks_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_tasks" ADD CONSTRAINT "review_tasks_submitted_by_id_fkey" FOREIGN KEY ("submitted_by_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_tasks" ADD CONSTRAINT "review_tasks_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_points" ADD CONSTRAINT "knowledge_points_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_relations" ADD CONSTRAINT "knowledge_relations_from_knowledge_point_id_fkey" FOREIGN KEY ("from_knowledge_point_id") REFERENCES "knowledge_points"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_relations" ADD CONSTRAINT "knowledge_relations_to_knowledge_point_id_fkey" FOREIGN KEY ("to_knowledge_point_id") REFERENCES "knowledge_points"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_levels" ADD CONSTRAINT "game_levels_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_knowledge_points" ADD CONSTRAINT "game_knowledge_points_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_knowledge_points" ADD CONSTRAINT "game_knowledge_points_knowledge_point_id_fkey" FOREIGN KEY ("knowledge_point_id") REFERENCES "knowledge_points"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_records" ADD CONSTRAINT "game_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_records" ADD CONSTRAINT "game_records_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_records" ADD CONSTRAINT "game_records_level_id_fkey" FOREIGN KEY ("level_id") REFERENCES "game_levels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_progress" ADD CONSTRAINT "learning_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_progress" ADD CONSTRAINT "learning_progress_knowledge_point_id_fkey" FOREIGN KEY ("knowledge_point_id") REFERENCES "knowledge_points"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_content_actions" ADD CONSTRAINT "user_content_actions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_content_actions" ADD CONSTRAINT "user_content_actions_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_favorites" ADD CONSTRAINT "user_favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_favorites" ADD CONSTRAINT "user_favorites_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_badge_id_fkey" FOREIGN KEY ("badge_id") REFERENCES "badges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_tags" ADD CONSTRAINT "project_tags_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "open_source_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_tags" ADD CONSTRAINT "project_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_knowledge_points" ADD CONSTRAINT "project_knowledge_points_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "open_source_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_knowledge_points" ADD CONSTRAINT "project_knowledge_points_knowledge_point_id_fkey" FOREIGN KEY ("knowledge_point_id") REFERENCES "knowledge_points"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_ranking_items" ADD CONSTRAINT "project_ranking_items_ranking_id_fkey" FOREIGN KEY ("ranking_id") REFERENCES "project_rankings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_ranking_items" ADD CONSTRAINT "project_ranking_items_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "open_source_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "recommendation_rules"("id") ON DELETE SET NULL ON UPDATE CASCADE;
