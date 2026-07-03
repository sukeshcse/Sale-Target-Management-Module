import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LineStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AchievementService {
  private readonly logger = new Logger(AchievementService.name);

  constructor(private readonly prisma: PrismaService) {}

  async calculateForPlan(planId: string) {
    const plan = await this.prisma.salesTargetPlan.findUnique({ where: { id: planId }, include: { lines: true } });
    if (!plan) {
      throw new NotFoundException(`Target plan ${planId} not found`);
    }

    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      for (const line of plan.lines) {
        if (line.targetValue === 0) {
          await tx.salesTargetLine.update({
            where: { id: line.id },
            data: { actualValue: 0, achievementPct: 0, status: 'NoTargetSet' },
          });
          continue;
        }

        const aggregate = await tx.salesActual.aggregate({
          _sum: { saleAmount: true },
          where: {
            dimensionType: plan.dimensionType,
            dimensionId: line.dimensionId,
            saleDate: { gte: line.periodStart, lte: line.periodEnd },
          },
        });
        const actualValue = aggregate._sum.saleAmount ?? 0;
        const achievementPct = (actualValue / line.targetValue) * 100;

        let status: LineStatus;
        if (line.periodEnd.getTime() < now.getTime()) {
          status = achievementPct >= 100 ? 'Achieved' : 'Missed';
        } else {
          status = 'Pending';
        }

        await tx.salesTargetLine.update({ where: { id: line.id }, data: { actualValue, achievementPct, status } });
      }
    });

    return this.prisma.salesTargetPlan.findUnique({ where: { id: planId }, include: { lines: true } });
  }

  // Covers plans created for a partially-elapsed range (e.g. Jan-Jun activated in April):
  // the still-ongoing lines stay Pending until their period lapses, so re-run daily for all
  // Active plans to pick up newly-elapsed periods and any SalesActual data added since.
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async recalculateActivePlans() {
    const activePlans = await this.prisma.salesTargetPlan.findMany({ where: { status: 'Active' }, select: { id: true } });
    this.logger.log(`Recalculating achievement for ${activePlans.length} active plan(s)`);
    for (const plan of activePlans) {
      await this.calculateForPlan(plan.id);
    }
  }
}
