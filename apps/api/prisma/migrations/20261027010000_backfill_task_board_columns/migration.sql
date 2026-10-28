BEGIN;

-- Prevent writes between the backfill and the NOT NULL constraint.
-- Stop old API instances before deploying: they cannot write the required column.
LOCK TABLE "Project", "Board", "BoardColumn", "Task" IN SHARE ROW EXCLUSIVE MODE;

DO $$
DECLARE
    project_id TEXT;
    board_id TEXT;
    board_name TEXT;
    name_suffix INTEGER;
    column_spec RECORD;
    next_position INTEGER;
BEGIN
    IF EXISTS (
        SELECT 1 FROM "Board" WHERE "isDefault"
        GROUP BY "projectId" HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION 'Multiple default boards in a project; resolve before migrating';
    END IF;

    FOR project_id IN SELECT "id" FROM "Project" ORDER BY "id" LOOP
        SELECT "id" INTO board_id FROM "Board"
        WHERE "projectId" = project_id AND "isDefault";

        IF board_id IS NULL THEN
            board_id := gen_random_uuid()::text;
            board_name := 'Основная доска';
            name_suffix := 0;
            WHILE EXISTS (
                SELECT 1 FROM "Board" WHERE "projectId" = project_id AND "name" = board_name
            ) LOOP
                name_suffix := name_suffix + 1;
                board_name := 'Основная доска (' || name_suffix || ')';
            END LOOP;

            INSERT INTO "Board" ("id", "projectId", "name", "isDefault", "updatedAt")
            VALUES (board_id, project_id, board_name, true, CURRENT_TIMESTAMP);
        END IF;

        FOR column_spec IN SELECT * FROM (VALUES
            ('TODO', 'К выполнению'),
            ('IN_PROGRESS', 'В работе'),
            ('IN_REVIEW', 'На проверке'),
            ('DONE', 'Готово')
        ) AS statuses(key, title) LOOP
            IF EXISTS (
                SELECT 1 FROM "BoardColumn"
                WHERE "boardId" = board_id AND "key" = column_spec.key AND NOT "isSystem"
            ) THEN
                RAISE EXCEPTION 'Reserved status key % in a custom column on board %', column_spec.key, board_id;
            END IF;

            IF NOT EXISTS (
                SELECT 1 FROM "BoardColumn" WHERE "boardId" = board_id AND "key" = column_spec.key
            ) THEN
                SELECT COALESCE(MAX("position") + 1, 0) INTO next_position
                FROM "BoardColumn" WHERE "boardId" = board_id;

                INSERT INTO "BoardColumn"
                    ("id", "boardId", "projectId", "key", "title", "position", "isSystem", "updatedAt")
                VALUES
                    (gen_random_uuid()::text, board_id, project_id, column_spec.key,
                     column_spec.title, next_position, true, CURRENT_TIMESTAMP);
            END IF;
        END LOOP;
    END LOOP;
END $$;

-- Keep all legacy fields, including ordering and timestamps, unchanged.
UPDATE "Task" AS task
SET "boardColumnId" = column_row."id"
FROM "BoardColumn" AS column_row
JOIN "Board" AS board ON board."id" = column_row."boardId"
WHERE task."boardColumnId" IS NULL
  AND board."isDefault"
  AND column_row."isSystem"
  AND task."projectId" = column_row."projectId"
  AND task."status"::text = column_row."key";

ALTER TABLE "Task" ALTER COLUMN "boardColumnId" SET NOT NULL;

COMMIT;
