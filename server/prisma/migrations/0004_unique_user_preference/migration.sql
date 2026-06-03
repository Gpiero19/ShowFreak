-- CreateIndex
CREATE UNIQUE INDEX "idx_preferences_unique" ON "user_preferences"("user_id", "external_id", "content_type");

