-- CreateTable
CREATE TABLE "NotebookShareScope" (
    "id" TEXT NOT NULL,
    "shareId" TEXT NOT NULL,
    "leafId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NotebookShareScope_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NotebookShareScope_shareId_leafId_key" ON "NotebookShareScope"("shareId", "leafId");

-- CreateIndex
CREATE INDEX "NotebookShareScope_shareId_idx" ON "NotebookShareScope"("shareId");

-- CreateIndex
CREATE INDEX "NotebookShareScope_leafId_idx" ON "NotebookShareScope"("leafId");

-- AddForeignKey
ALTER TABLE "NotebookShareScope" ADD CONSTRAINT "NotebookShareScope_shareId_fkey" FOREIGN KEY ("shareId") REFERENCES "Share"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotebookShareScope" ADD CONSTRAINT "NotebookShareScope_leafId_fkey" FOREIGN KEY ("leafId") REFERENCES "Leaf"("id") ON DELETE CASCADE ON UPDATE CASCADE;
