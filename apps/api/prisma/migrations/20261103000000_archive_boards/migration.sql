ALTER TABLE "Board" ADD COLUMN "archivedAt" TIMESTAMP(3);

CREATE INDEX "Board_projectId_archivedAt_idx" ON "Board"("projectId", "archivedAt");
