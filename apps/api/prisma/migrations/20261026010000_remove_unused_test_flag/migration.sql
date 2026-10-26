BEGIN;

SELECT "id" FROM "FeatureFlagsRevision" WHERE "id" = 'global' FOR UPDATE;

-- Удаляем только оставшуюся тестовую запись, не подключённую к приложению.
WITH removed AS (
 DELETE FROM "FeatureFlag" WHERE "key" = 'test-flag'
 RETURNING "id"
)
UPDATE "FeatureFlagsRevision" SET "version" = "version" + 1
WHERE "id" = 'global' AND EXISTS (SELECT 1 FROM removed);

COMMIT;
