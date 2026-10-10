-- Additive migration: existing users, teams, projects and tasks are preserved.
CREATE TABLE "FeatureFlag" (
 "id" TEXT NOT NULL,
 "key" TEXT NOT NULL,
 "title" TEXT NOT NULL,
 "enabled" BOOLEAN NOT NULL DEFAULT false,
 "description" TEXT,
 "createdById" TEXT NOT NULL,
 "expiresAt" TIMESTAMP(3),
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL,
 "archivedAt" TIMESTAMP(3),
 CONSTRAINT "FeatureFlag_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "FeatureFlag_key_key" ON "FeatureFlag"("key");
CREATE TABLE "FeatureFlagsRevision" (
 "id" TEXT NOT NULL DEFAULT 'global',
 "version" INTEGER NOT NULL DEFAULT 0,
 CONSTRAINT "FeatureFlagsRevision_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "FeatureFlagAudit" (
 "id" TEXT NOT NULL,
 "flagId" TEXT NOT NULL,
 "actorId" TEXT NOT NULL,
 "action" TEXT NOT NULL,
 "before" JSONB,
 "after" JSONB,
 "version" INTEGER NOT NULL,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "FeatureFlagAudit_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "FeatureFlagAudit_flagId_createdAt_idx" ON "FeatureFlagAudit"("flagId", "createdAt");
ALTER TABLE "FeatureFlagAudit" ADD CONSTRAINT "FeatureFlagAudit_flagId_fkey" FOREIGN KEY ("flagId") REFERENCES "FeatureFlag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
INSERT INTO "FeatureFlagsRevision" ("id", "version") VALUES ('global', 0);
-- Initial state matches the existing Docker/stage build defaults. No seed/reset.
INSERT INTO "FeatureFlag" ("id", "key", "title", "enabled", "createdById", "updatedAt") VALUES
 (gen_random_uuid()::text, 'projects', 'Проекты', true, 'bootstrap', CURRENT_TIMESTAMP),
 (gen_random_uuid()::text, 'tasks', 'Задачи', true, 'bootstrap', CURRENT_TIMESTAMP),
 (gen_random_uuid()::text, 'boards', 'Доски', true, 'bootstrap', CURRENT_TIMESTAMP),
 (gen_random_uuid()::text, 'team-settings', 'Настройки команды', true, 'bootstrap', CURRENT_TIMESTAMP);
