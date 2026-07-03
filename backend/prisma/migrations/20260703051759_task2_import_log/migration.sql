-- CreateEnum
CREATE TYPE "ImportStatus" AS ENUM ('Success', 'Failed');

-- CreateTable
CREATE TABLE "TargetImportLog" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "status" "ImportStatus" NOT NULL,
    "totalRows" INTEGER NOT NULL,
    "importedRows" INTEGER NOT NULL,
    "failedRows" INTEGER NOT NULL,
    "errors" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TargetImportLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TargetImportLog_planId_idx" ON "TargetImportLog"("planId");

-- AddForeignKey
ALTER TABLE "TargetImportLog" ADD CONSTRAINT "TargetImportLog_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SalesTargetPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
