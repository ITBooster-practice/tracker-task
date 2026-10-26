BEGIN;

-- Применять после остановки старой версии API: она использует удаляемые поля и аудит.
SELECT "id" FROM "FeatureFlagsRevision" WHERE "id" = 'global' FOR UPDATE;

-- Архивные записи не должны включиться после удаления признака архива.
UPDATE "FeatureFlag"
SET "enabled" = false, "updatedAt" = CURRENT_TIMESTAMP
WHERE "archivedAt" IS NOT NULL;

DROP TABLE "FeatureFlagAudit";
ALTER TABLE "FeatureFlag"
 DROP COLUMN "title",
 DROP COLUMN "description",
 DROP COLUMN "createdById",
 DROP COLUMN "expiresAt",
 DROP COLUMN "createdAt",
 DROP COLUMN "archivedAt";

-- Обновляем ETag и уведомляем клиентов через существующую сверку версии.
UPDATE "FeatureFlagsRevision" SET "version" = "version" + 1 WHERE "id" = 'global';

COMMIT;
