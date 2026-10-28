BEGIN;

CREATE TYPE "TaskType" AS ENUM ('EPIC', 'STORY', 'BUG', 'TECH_DEBT', 'TASK');

ALTER TABLE "Task" ADD COLUMN "type" "TaskType" NOT NULL DEFAULT 'TASK';

CREATE INDEX "Task_projectId_type_idx" ON "Task"("projectId", "type");
CREATE INDEX "Task_projectId_createdAt_id_idx" ON "Task"("projectId", "createdAt", "id");

COMMIT;
