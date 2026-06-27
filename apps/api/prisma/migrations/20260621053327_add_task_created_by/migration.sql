/*
  Warnings:

  - Added the required column `createdById` to the `Task` table via a backfill step.

*/
-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "createdById" TEXT;

-- Backfill existing tasks from the project creator.
UPDATE "Task" AS task
SET "createdById" = project."createdById"
FROM "Project" AS project
WHERE task."projectId" = project."id"
  AND task."createdById" IS NULL;

ALTER TABLE "Task" ALTER COLUMN "createdById" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
