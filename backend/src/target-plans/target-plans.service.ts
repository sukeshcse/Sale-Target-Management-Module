import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LineStatus, Prisma } from '@prisma/client';
import { endOfUtcDay, validatePeriodTypeSpan } from '../common/utils/period.util';
import { CreateTargetPlanDto } from './dto/create-target-plan.dto';
import { UpdateTargetPlanDto } from './dto/update-target-plan.dto';
import { QueryTargetPlansDto } from './dto/query-target-plans.dto';
import { AchievementService } from '../achievement/achievement.service';

const ALL_LINE_STATUSES: LineStatus[] = ['Achieved', 'Missed', 'Pending', 'NoTargetSet'];

@Injectable()
export class TargetPlansService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly achievementService: AchievementService,
  ) {}

  async create(dto: CreateTargetPlanDto) {
    const startDate = new Date(dto.startDate);
    const endDate = endOfUtcDay(new Date(dto.endDate));

    if (startDate.getTime() >= endDate.getTime()) {
      throw new BadRequestException('startDate must be before endDate');
    }

    const spanError = validatePeriodTypeSpan(dto.periodType, startDate, endDate);
    if (spanError) {
      throw new BadRequestException(spanError);
    }

    const existing = await this.prisma.salesTargetPlan.findFirst({
      where: { name: dto.name, dimensionType: dto.dimensionType, startDate, endDate },
    });
    if (existing) {
      throw new ConflictException(
        'A plan with this name already exists for this dimensionType and date range',
      );
    }

    return this.prisma.salesTargetPlan.create({
      data: {
        name: dto.name,
        dimensionType: dto.dimensionType,
        periodType: dto.periodType,
        startDate,
        endDate,
      },
    });
  }

  async findAll(query: QueryTargetPlansDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const where: Prisma.SalesTargetPlanWhereInput = {
      status: query.status,
      dimensionType: query.dimensionType,
      periodType: query.periodType,
    };
    if (query.fromDate) where.startDate = { gte: new Date(query.fromDate) };
    if (query.toDate) where.endDate = { ...(where.endDate as object), lte: endOfUtcDay(new Date(query.toDate)) };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.salesTargetPlan.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { _count: { select: { lines: true } } },
      }),
      this.prisma.salesTargetPlan.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async findOne(id: string) {
    const plan = await this.prisma.salesTargetPlan.findUnique({
      where: { id },
      include: { lines: { orderBy: [{ periodStart: 'asc' }, { dimensionName: 'asc' }] } },
    });
    if (!plan) {
      throw new NotFoundException(`Target plan ${id} not found`);
    }

    const totalTarget = plan.lines.reduce((sum, line) => sum + line.targetValue, 0);
    const totalActual = plan.lines.reduce((sum, line) => sum + line.actualValue, 0);
    const countsByStatus = ALL_LINE_STATUSES.reduce(
      (acc, status) => ({ ...acc, [status]: plan.lines.filter((l) => l.status === status).length }),
      {} as Record<LineStatus, number>,
    );

    return {
      ...plan,
      summary: {
        totalTarget,
        totalActual,
        overallAchievementPct: totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0,
        lineCount: plan.lines.length,
        countsByStatus,
      },
    };
  }

  async update(id: string, dto: UpdateTargetPlanDto) {
    const plan = await this.getPlanOrThrow(id);
    if (plan.status !== 'Draft') {
      throw new BadRequestException('Only Draft plans can be edited');
    }

    const wantsDateChange = dto.startDate !== undefined || dto.endDate !== undefined;
    if (wantsDateChange) {
      const lineCount = await this.prisma.salesTargetLine.count({ where: { planId: id } });
      if (lineCount > 0) {
        throw new BadRequestException('Draft plans cannot have their date range edited once lines are attached');
      }
    }

    const startDate = dto.startDate ? new Date(dto.startDate) : plan.startDate;
    const endDate = dto.endDate ? endOfUtcDay(new Date(dto.endDate)) : plan.endDate;
    const periodType = dto.periodType ?? plan.periodType;

    if (startDate.getTime() >= endDate.getTime()) {
      throw new BadRequestException('startDate must be before endDate');
    }
    const spanError = validatePeriodTypeSpan(periodType, startDate, endDate);
    if (spanError) {
      throw new BadRequestException(spanError);
    }

    return this.prisma.salesTargetPlan.update({
      where: { id },
      data: {
        name: dto.name,
        dimensionType: dto.dimensionType,
        periodType: dto.periodType,
        startDate: dto.startDate ? startDate : undefined,
        endDate: dto.endDate ? endDate : undefined,
      },
    });
  }

  async activate(id: string) {
    const plan = await this.getPlanOrThrow(id);
    if (plan.status !== 'Draft') {
      throw new BadRequestException('Only Draft plans can be activated');
    }

    const lineCount = await this.prisma.salesTargetLine.count({ where: { planId: id } });
    if (lineCount === 0) {
      throw new BadRequestException('Cannot activate a plan with no target lines');
    }

    await this.prisma.salesTargetPlan.update({ where: { id }, data: { status: 'Active' } });
    // Spec: achievement must be computed immediately on activation, not just left for the nightly cron.
    return this.achievementService.calculateForPlan(id);
  }

  async getPlanOrThrow(id: string) {
    const plan = await this.prisma.salesTargetPlan.findUnique({ where: { id } });
    if (!plan) {
      throw new NotFoundException(`Target plan ${id} not found`);
    }
    return plan;
  }
}
