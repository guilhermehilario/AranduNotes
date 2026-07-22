-- AlterTable
ALTER TABLE "Leaf" ADD COLUMN "deletedAt" DATETIME;

-- AlterTable
ALTER TABLE "Notebook" ADD COLUMN "deletedAt" DATETIME;

-- CreateTable
CREATE TABLE "EditHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "leafId" TEXT,
    "notebookId" TEXT,
    "action" TEXT NOT NULL,
    "fieldName" TEXT,
    "oldValue" TEXT,
    "newValue" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EditHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EditHistory_leafId_fkey" FOREIGN KEY ("leafId") REFERENCES "Leaf" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EditHistory_notebookId_fkey" FOREIGN KEY ("notebookId") REFERENCES "Notebook" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
