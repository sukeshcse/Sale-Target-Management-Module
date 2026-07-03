// Seeds SalesActual history (2024) plus one ready-to-activate demo plan, so retroactive
// achievement can be exercised immediately via Swagger/UI without any manual setup.
// Run with: npx prisma db seed
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const PLAN_NAME = 'Q1 2024 - Store-wise Target';
const PLAN_START = new Date('2024-01-01T00:00:00.000Z');
const PLAN_END = new Date('2024-03-31T23:59:59.999Z');

// Deliberately mixed against the target values in samples/target-import-sample.xlsx so the
// demo plan shows a realistic spread of Achieved/Missed lines once activated:
//   STR001 targets: Jan 150,000 / Feb 175,000 / Mar 160,000
//   STR002 targets: Jan 120,000 / Feb 130,000 / Mar 140,000
const SALES_ACTUALS = [
  // STR001 - Store North: Jan 160,000 (Achieved) / Feb 150,000 (Missed) / Mar 165,000 (Achieved)
  { dimensionId: 'STR001', dimensionName: 'Store North', saleDate: '2024-01-10', saleAmount: 90_000 },
  { dimensionId: 'STR001', dimensionName: 'Store North', saleDate: '2024-01-25', saleAmount: 70_000 },
  { dimensionId: 'STR001', dimensionName: 'Store North', saleDate: '2024-02-14', saleAmount: 150_000 },
  { dimensionId: 'STR001', dimensionName: 'Store North', saleDate: '2024-03-05', saleAmount: 100_000 },
  { dimensionId: 'STR001', dimensionName: 'Store North', saleDate: '2024-03-28', saleAmount: 65_000 },
  // STR002 - Store South: Jan 100,000 (Missed) / Feb 135,000 (Achieved) / Mar 130,000 (Missed)
  { dimensionId: 'STR002', dimensionName: 'Store South', saleDate: '2024-01-12', saleAmount: 100_000 },
  { dimensionId: 'STR002', dimensionName: 'Store South', saleDate: '2024-02-08', saleAmount: 80_000 },
  { dimensionId: 'STR002', dimensionName: 'Store South', saleDate: '2024-02-20', saleAmount: 55_000 },
  { dimensionId: 'STR002', dimensionName: 'Store South', saleDate: '2024-03-15', saleAmount: 130_000 },
];

const TARGET_LINES = [
  { periodLabel: '2024-Jan', periodStart: '2024-01-01T00:00:00.000Z', periodEnd: '2024-01-31T23:59:59.999Z', dimensionId: 'STR001', dimensionName: 'Store North', targetValue: 150_000 },
  { periodLabel: '2024-Feb', periodStart: '2024-02-01T00:00:00.000Z', periodEnd: '2024-02-29T23:59:59.999Z', dimensionId: 'STR001', dimensionName: 'Store North', targetValue: 175_000 },
  { periodLabel: '2024-Mar', periodStart: '2024-03-01T00:00:00.000Z', periodEnd: '2024-03-31T23:59:59.999Z', dimensionId: 'STR001', dimensionName: 'Store North', targetValue: 160_000 },
  { periodLabel: '2024-Jan', periodStart: '2024-01-01T00:00:00.000Z', periodEnd: '2024-01-31T23:59:59.999Z', dimensionId: 'STR002', dimensionName: 'Store South', targetValue: 120_000 },
  { periodLabel: '2024-Feb', periodStart: '2024-02-01T00:00:00.000Z', periodEnd: '2024-02-29T23:59:59.999Z', dimensionId: 'STR002', dimensionName: 'Store South', targetValue: 130_000 },
  { periodLabel: '2024-Mar', periodStart: '2024-03-01T00:00:00.000Z', periodEnd: '2024-03-31T23:59:59.999Z', dimensionId: 'STR002', dimensionName: 'Store South', targetValue: 140_000 },
];

async function main() {
  console.log('Seeding SalesActual history...');
  await prisma.salesActual.deleteMany({ where: { dimensionId: { in: ['STR001', 'STR002'] } } });
  await prisma.salesActual.createMany({
    data: SALES_ACTUALS.map((row) => ({
      dimensionType: 'Store' as const,
      dimensionId: row.dimensionId,
      dimensionName: row.dimensionName,
      saleDate: new Date(row.saleDate),
      saleAmount: row.saleAmount,
    })),
  });

  console.log('Seeding demo plan...');
  const plan = await prisma.salesTargetPlan.upsert({
    where: {
      name_dimensionType_startDate_endDate: {
        name: PLAN_NAME,
        dimensionType: 'Store',
        startDate: PLAN_START,
        endDate: PLAN_END,
      },
    },
    create: { name: PLAN_NAME, dimensionType: 'Store', periodType: 'Monthly', startDate: PLAN_START, endDate: PLAN_END },
    update: {},
  });

  for (const line of TARGET_LINES) {
    await prisma.salesTargetLine.upsert({
      where: { planId_dimensionId_periodLabel: { planId: plan.id, dimensionId: line.dimensionId, periodLabel: line.periodLabel } },
      create: {
        planId: plan.id,
        periodLabel: line.periodLabel,
        periodStart: new Date(line.periodStart),
        periodEnd: new Date(line.periodEnd),
        dimensionId: line.dimensionId,
        dimensionName: line.dimensionName,
        targetValue: line.targetValue,
      },
      update: { targetValue: line.targetValue },
    });
  }

  console.log(`Seeded plan "${plan.name}" (${plan.id}, ${plan.status}) with ${TARGET_LINES.length} lines.`);
  console.log('Activate it (or POST /calculate-achievement) to see retroactive achievement computed against the seeded SalesActual data.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
