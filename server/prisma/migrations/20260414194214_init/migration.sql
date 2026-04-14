-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "username" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_cache" (
    "external_id" VARCHAR(50) NOT NULL,
    "content_type" VARCHAR(20) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "poster_path" VARCHAR(255),
    "vote_average" DECIMAL(3,1),
    "release_year" INTEGER,
    "genres" JSONB NOT NULL,
    "cached_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "content_cache_pkey" PRIMARY KEY ("external_id")
);

-- CreateTable
CREATE TABLE "library_items" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "external_id" VARCHAR(50) NOT NULL,
    "content_type" VARCHAR(20) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "personal_rating" INTEGER,
    "notes" TEXT,
    "watched_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "library_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_preferences" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "external_id" VARCHAR(50) NOT NULL,
    "content_type" VARCHAR(20) NOT NULL,
    "dislike_reason" VARCHAR(50),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_content_type" ON "content_cache"("content_type");

-- CreateIndex
CREATE INDEX "idx_title" ON "content_cache"("title");

-- CreateIndex
CREATE INDEX "idx_genres" ON "content_cache" USING GIN ("genres");

-- CreateIndex
CREATE INDEX "idx_library_user_status" ON "library_items"("user_id", "status");

-- CreateIndex
CREATE INDEX "idx_library_user_type" ON "library_items"("user_id", "content_type");

-- CreateIndex
CREATE UNIQUE INDEX "library_items_user_id_external_id_key" ON "library_items"("user_id", "external_id");

-- CreateIndex
CREATE INDEX "idx_preferences_user" ON "user_preferences"("user_id");

-- AddForeignKey
ALTER TABLE "library_items" ADD CONSTRAINT "library_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library_items" ADD CONSTRAINT "library_items_external_id_fkey" FOREIGN KEY ("external_id") REFERENCES "content_cache"("external_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
