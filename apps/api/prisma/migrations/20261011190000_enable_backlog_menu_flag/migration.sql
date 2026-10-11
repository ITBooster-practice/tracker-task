BEGIN;

-- Сериализуем выпуск с изменениями флагов через API.
SELECT "id" FROM "FeatureFlagsRevision" WHERE "id" = 'global' FOR UPDATE;

DO $$
BEGIN
 IF EXISTS (SELECT 1 FROM "FeatureFlag" WHERE "key" = 'backlog' AND "archivedAt" IS NOT NULL) THEN
  RAISE EXCEPTION 'Ключ backlog зарезервирован архивом. Выпуск не может восстановить этот флаг.';
 END IF;
END $$;

-- Создаём выключенный флаг, сохраняя состояние существующей записи.
WITH flag AS (
 INSERT INTO "FeatureFlag" ("id", "key", "title", "enabled", "createdById", "updatedAt")
 VALUES (gen_random_uuid()::text, 'backlog', 'Бэклог', false, 'bootstrap', CURRENT_TIMESTAMP)
 ON CONFLICT ("key") DO NOTHING
 RETURNING *
),
revision AS (
 UPDATE "FeatureFlagsRevision" SET "version" = "version" + 1
 WHERE "id" = 'global' AND EXISTS (SELECT 1 FROM flag)
 RETURNING "version"
)
INSERT INTO "FeatureFlagAudit" ("id", "flagId", "actorId", "action", "before", "after", "version")
SELECT gen_random_uuid()::text, flag."id", 'bootstrap', 'CREATE',
 NULL, to_jsonb(flag), revision."version"
FROM flag CROSS JOIN revision;

COMMIT;
