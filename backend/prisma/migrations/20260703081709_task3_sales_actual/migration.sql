-- CreateTable
CREATE TABLE "SalesActual" (
    "id" TEXT NOT NULL,
    "dimensionType" "DimensionType" NOT NULL,
    "dimensionId" TEXT NOT NULL,
    "dimensionName" TEXT NOT NULL,
    "saleDate" TIMESTAMP(3) NOT NULL,
    "saleAmount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalesActual_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SalesActual_dimensionType_dimensionId_saleDate_idx" ON "SalesActual"("dimensionType", "dimensionId", "saleDate");
