BEGIN;

CREATE UNIQUE INDEX "BoardColumn_boardId_title_key" ON "BoardColumn"("boardId", "title");

COMMIT;
