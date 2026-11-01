CREATE TABLE "TaskLabel" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    CONSTRAINT "TaskLabel_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TaskLabelAssignment" (
    "taskId" TEXT NOT NULL,
    "labelId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    CONSTRAINT "TaskLabelAssignment_pkey" PRIMARY KEY ("taskId", "labelId")
);

CREATE UNIQUE INDEX "Task_id_projectId_key" ON "Task"("id", "projectId");
CREATE UNIQUE INDEX "TaskLabel_projectId_key_key" ON "TaskLabel"("projectId", "key");
CREATE UNIQUE INDEX "TaskLabel_id_projectId_key" ON "TaskLabel"("id", "projectId");
CREATE INDEX "TaskLabelAssignment_labelId_projectId_idx" ON "TaskLabelAssignment"("labelId", "projectId");

ALTER TABLE "TaskLabel" ADD CONSTRAINT "TaskLabel_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TaskLabelAssignment" ADD CONSTRAINT "TaskLabelAssignment_taskId_projectId_fkey"
    FOREIGN KEY ("taskId", "projectId") REFERENCES "Task"("id", "projectId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TaskLabelAssignment" ADD CONSTRAINT "TaskLabelAssignment_labelId_projectId_fkey"
    FOREIGN KEY ("labelId", "projectId") REFERENCES "TaskLabel"("id", "projectId") ON DELETE CASCADE ON UPDATE CASCADE;
