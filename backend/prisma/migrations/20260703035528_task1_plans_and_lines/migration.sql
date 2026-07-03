-- CreateEnum
CREATE TYPE "DimensionType" AS ENUM ('Product', 'Store', 'Salesman', 'BusinessUnit', 'Region');

-- CreateEnum
CREATE TYPE "PeriodType" AS ENUM ('Weekly', 'Monthly', 'Quarterly');

-- CreateEnum
CREATE TYPE "PlanStatus" AS ENUM ('Draft', 'Active');

-- CreateEnum
CREATE TYPE "LineStatus" AS ENUM ('Achieved', 'Missed', 'Pending', 'NoTargetSet');

-- CreateTable
CREATE TABLE "SalesTargetPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dimensionType" "DimensionType" NOT NULL,
    "periodType" "PeriodType" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "PlanStatus" NOT NULL DEFAULT 'Draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesTargetPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesTargetLine" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "periodLabel" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "dimensionId" TEXT NOT NULL,
    "dimensionName" TEXT NOT NULL,
    "targetValue" DOUBLE PRECISION NOT NULL,
    "actualValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "achievementPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "LineStatus" NOT NULL DEFAULT 'Pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesTargetLine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SalesTargetPlan_status_idx" ON "SalesTargetPlan"("status");

-- CreateIndex
CREATE INDEX "SalesTargetPlan_dimensionType_idx" ON "SalesTargetPlan"("dimensionType");

-- CreateIndex
CREATE UNIQUE INDEX "SalesTargetPlan_name_dimensionType_startDate_endDate_key" ON "SalesTargetPlan"("name", "dimensionType", "startDate", "endDate");

-- CreateIndex
CREATE INDEX "SalesTargetLine_planId_idx" ON "SalesTargetLine"("planId");

-- CreateIndex
CREATE INDEX "SalesTargetLine_status_idx" ON "SalesTargetLine"("status");

-- CreateIndex
CREATE UNIQUE INDEX "SalesTargetLine_planId_dimensionId_periodLabel_key" ON "SalesTargetLine"("planId", "dimensionId", "periodLabel");

-- AddForeignKey
ALTER TABLE "SalesTargetLine" ADD CONSTRAINT "SalesTargetLine_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SalesTargetPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
