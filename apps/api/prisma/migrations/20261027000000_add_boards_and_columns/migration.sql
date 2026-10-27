BEGIN;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "boardColumnId" TEXT;

-- CreateTable
CREATE TABLE "Board" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Board_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BoardColumn" (
    "id" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BoardColumn_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Board_projectId_name_key" ON "Board"("projectId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Board_id_projectId_key" ON "Board"("id", "projectId");

-- CreateIndex
CREATE UNIQUE INDEX "BoardColumn_boardId_key_key" ON "BoardColumn"("boardId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "BoardColumn_boardId_position_key" ON "BoardColumn"("boardId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "BoardColumn_id_projectId_key" ON "BoardColumn"("id", "projectId");

-- CreateIndex
CREATE INDEX "Task_boardColumnId_position_idx" ON "Task"("boardColumnId", "position");

-- AddForeignKey
ALTER TABLE "Board" ADD CONSTRAINT "Board_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardColumn" ADD CONSTRAINT "BoardColumn_boardId_projectId_fkey" FOREIGN KEY ("boardId", "projectId") REFERENCES "Board"("id", "projectId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_boardColumnId_projectId_fkey" FOREIGN KEY ("boardColumnId", "projectId") REFERENCES "BoardColumn"("id", "projectId") ON DELETE NO ACTION ON UPDATE CASCADE;

COMMIT;
