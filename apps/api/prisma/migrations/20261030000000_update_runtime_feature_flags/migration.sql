BEGIN;

SELECT "id" FROM "FeatureFlagsRevision" WHERE "id" = 'global' FOR UPDATE;

-- Keep the remaining release flags and their states unchanged.
INSERT INTO "FeatureFlag" ("id", "key", "enabled", "updatedAt")
VALUES
 ('feature-ai-assistant', 'ai-assistant', false, CURRENT_TIMESTAMP),
 ('feature-notifications', 'notifications', false, CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;

DELETE FROM "FeatureFlag" WHERE "key" IN ('projects', 'team-settings');

UPDATE "FeatureFlagsRevision" SET "version" = "version" + 1 WHERE "id" = 'global';

COMMIT;
