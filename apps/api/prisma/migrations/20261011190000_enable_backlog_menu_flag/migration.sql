BEGIN;

-- Сериализуем выпуск с изменениями флагов через API.
SELECT "id" FROM "FeatureFlagsRevision" WHERE "id" = 'global' FOR UPDATE;

DO $$
BEGIN
 IF EXISTS (SELECT 1 FROM "FeatureFlag" WHERE "key" = 'backlog' AND "archivedAt" IS NOT NULL) THEN
  RAISE EXCEPTION 'Ключ backlog зарезервирован архивом. Выпуск не может восстановить этот флаг.';
 END IF;
END $$;

-- Существующий пункт меню остаётся видимым после подключения флага.
WITH previous AS (
 SELECT * FROM "FeatureFlag" WHERE "key" = 'backlog'
),
revision AS (
 UPDATE "FeatureFlagsRevision" SET "version" = "version" + 1 WHERE "id" = 'global' RETURNING "version"
),
flag AS (
 INSERT INTO "FeatureFlag" ("id", "key", "title", "enabled", "createdById", "updatedAt")
 VALUES (gen_random_uuid()::text, 'backlog', 'Бэклог', true, 'bootstrap', CURRENT_TIMESTAMP)
 ON CONFLICT ("key") DO UPDATE SET "enabled" = true, "updatedAt" = CURRENT_TIMESTAMP
 RETURNING *
)
INSERT INTO "FeatureFlagAudit" ("id", "flagId", "actorId", "action", "before", "after", "version")
SELECT gen_random_uuid()::text, flag."id", 'bootstrap',
 CASE WHEN EXISTS (SELECT 1 FROM previous) THEN 'UPDATE' ELSE 'CREATE' END,
 (SELECT to_jsonb(previous) FROM previous), to_jsonb(flag), revision."version"
FROM flag CROSS JOIN revision;

COMMIT;
