CREATE TABLE "ai_books" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" VARCHAR(160) NOT NULL,
    "subtitle" VARCHAR(200),
    "slug" VARCHAR(180) NOT NULL,
    "description" TEXT,
    "cover_image_url" TEXT,
    "pdf_url" TEXT,
    "school_stage" "SchoolStage",
    "min_grade" SMALLINT,
    "max_grade" SMALLINT,
    "status" "PublishStatus" NOT NULL DEFAULT 'draft',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "ai_books_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ai_book_chapters" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "book_id" UUID NOT NULL,
    "chapter_no" INTEGER NOT NULL,
    "title" VARCHAR(180) NOT NULL,
    "summary" TEXT,
    "key_points" JSONB,
    "status" "PublishStatus" NOT NULL DEFAULT 'draft',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ai_book_chapters_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ai_book_tasks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "book_id" UUID NOT NULL,
    "chapter_id" UUID,
    "task_type" VARCHAR(64) NOT NULL,
    "title" VARCHAR(180) NOT NULL,
    "description" TEXT,
    "prompt" TEXT,
    "status" "PublishStatus" NOT NULL DEFAULT 'draft',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ai_book_tasks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "user_book_progress" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "book_id" UUID NOT NULL,
    "chapter_id" UUID,
    "progress_percent" SMALLINT NOT NULL DEFAULT 0,
    "status" VARCHAR(32) NOT NULL DEFAULT 'not_started',
    "last_read_at" TIMESTAMPTZ(6),
    "completed_at" TIMESTAMPTZ(6),
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "user_book_progress_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ai_books_slug_key" ON "ai_books"("slug");
CREATE INDEX "ai_books_status_sort_order_idx" ON "ai_books"("status", "sort_order");
CREATE INDEX "ai_books_school_stage_min_grade_max_grade_idx" ON "ai_books"("school_stage", "min_grade", "max_grade");
CREATE INDEX "ai_books_deleted_at_idx" ON "ai_books"("deleted_at");
CREATE UNIQUE INDEX "ai_book_chapters_book_id_chapter_no_key" ON "ai_book_chapters"("book_id", "chapter_no");
CREATE INDEX "ai_book_chapters_book_id_status_sort_order_idx" ON "ai_book_chapters"("book_id", "status", "sort_order");
CREATE INDEX "ai_book_tasks_book_id_status_sort_order_idx" ON "ai_book_tasks"("book_id", "status", "sort_order");
CREATE INDEX "ai_book_tasks_chapter_id_idx" ON "ai_book_tasks"("chapter_id");
CREATE UNIQUE INDEX "user_book_progress_user_id_book_id_chapter_id_key" ON "user_book_progress"("user_id", "book_id", "chapter_id");
CREATE INDEX "user_book_progress_user_id_status_idx" ON "user_book_progress"("user_id", "status");
CREATE INDEX "user_book_progress_book_id_idx" ON "user_book_progress"("book_id");
CREATE INDEX "user_book_progress_last_read_at_idx" ON "user_book_progress"("last_read_at");

ALTER TABLE "ai_book_chapters" ADD CONSTRAINT "ai_book_chapters_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "ai_books"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ai_book_tasks" ADD CONSTRAINT "ai_book_tasks_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "ai_books"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ai_book_tasks" ADD CONSTRAINT "ai_book_tasks_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "ai_book_chapters"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "user_book_progress" ADD CONSTRAINT "user_book_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_book_progress" ADD CONSTRAINT "user_book_progress_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "ai_books"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_book_progress" ADD CONSTRAINT "user_book_progress_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "ai_book_chapters"("id") ON DELETE SET NULL ON UPDATE CASCADE;
