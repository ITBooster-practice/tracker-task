ALTER TABLE "Board" ADD COLUMN "description" TEXT;
ALTER TABLE "BoardColumn" ADD COLUMN "color" TEXT NOT NULL DEFAULT 'gray';

UPDATE "BoardColumn" SET "color" = CASE "key"
  WHEN 'TODO' THEN 'blue'
  WHEN 'IN_PROGRESS' THEN 'yellow'
  WHEN 'IN_REVIEW' THEN 'violet'
  WHEN 'DONE' THEN 'green'
  ELSE 'gray'
END;

ALTER TABLE "BoardColumn" ADD CONSTRAINT "BoardColumn_color_check"
  CHECK ("color" IN ('gray', 'blue', 'cyan', 'green', 'yellow', 'orange', 'red', 'violet'));
