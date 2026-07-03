import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AchievementService } from './achievement.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AchievementService', () => {
  let service: AchievementService;
  let tx: { salesTargetLine: { update: jest.Mock }; salesActual: { aggregate: jest.Mock } };
  let prisma: {
    salesTargetPlan: { findUnique: jest.Mock; findMany: jest.Mock };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    tx = {
      salesTargetLine: { update: jest.fn() },
      salesActual: { aggregate: jest.fn() },
    };
    prisma = {
      salesTargetPlan: { findUnique: jest.fn(), findMany: jest.fn() },
      $transaction: jest.fn(async (callback: (tx: unknown) => Promise<unknown>) => callback(tx)),
    };

    const module = await Test.createTestingModule({
      providers: [AchievementService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(AchievementService);
  });

  it('throws NotFoundException for an unknown plan', async () => {
    prisma.salesTargetPlan.findUnique.mockResolvedValue(null);
    await expect(service.calculateForPlan('missing')).rejects.toThrow(NotFoundException);
  });

  it('marks a zero-target line as NoTargetSet without querying actuals', async () => {
    const plan = {
      id: 'p1',
      dimensionType: 'Store',
      lines: [{ id: 'l1', dimensionId: 'STR001', targetValue: 0, periodStart: new Date('2024-01-01'), periodEnd: new Date('2024-01-31') }],
    };
    prisma.salesTargetPlan.findUnique.mockResolvedValueOnce(plan).mockResolvedValueOnce(plan);

    await service.calculateForPlan('p1');

    expect(tx.salesActual.aggregate).not.toHaveBeenCalled();
    expect(tx.salesTargetLine.update).toHaveBeenCalledWith({
      where: { id: 'l1' },
      data: { actualValue: 0, achievementPct: 0, status: 'NoTargetSet' },
    });
  });

  it('marks a past period as Achieved when actual >= target', async () => {
    const pastLine = {
      id: 'l1',
      dimensionId: 'STR001',
      targetValue: 100,
      periodStart: new Date('2020-01-01'),
      periodEnd: new Date('2020-01-31'), // well in the past
    };
    const plan = { id: 'p1', dimensionType: 'Store', lines: [pastLine] };
    prisma.salesTargetPlan.findUnique.mockResolvedValueOnce(plan).mockResolvedValueOnce(plan);
    tx.salesActual.aggregate.mockResolvedValue({ _sum: { saleAmount: 150 } });

    await service.calculateForPlan('p1');

    expect(tx.salesTargetLine.update).toHaveBeenCalledWith({
      where: { id: 'l1' },
      data: { actualValue: 150, achievementPct: 150, status: 'Achieved' },
    });
  });

  it('marks a past period as Missed when actual < target', async () => {
    const pastLine = {
      id: 'l1',
      dimensionId: 'STR001',
      targetValue: 100,
      periodStart: new Date('2020-01-01'),
      periodEnd: new Date('2020-01-31'),
    };
    const plan = { id: 'p1', dimensionType: 'Store', lines: [pastLine] };
    prisma.salesTargetPlan.findUnique.mockResolvedValueOnce(plan).mockResolvedValueOnce(plan);
    tx.salesActual.aggregate.mockResolvedValue({ _sum: { saleAmount: 40 } });

    await service.calculateForPlan('p1');

    expect(tx.salesTargetLine.update).toHaveBeenCalledWith({
      where: { id: 'l1' },
      data: { actualValue: 40, achievementPct: 40, status: 'Missed' },
    });
  });

  it('marks an ongoing/future period as Pending regardless of actual', async () => {
    const futureLine = {
      id: 'l1',
      dimensionId: 'STR001',
      targetValue: 100,
      periodStart: new Date('2099-01-01'),
      periodEnd: new Date('2099-01-31'),
    };
    const plan = { id: 'p1', dimensionType: 'Store', lines: [futureLine] };
    prisma.salesTargetPlan.findUnique.mockResolvedValueOnce(plan).mockResolvedValueOnce(plan);
    tx.salesActual.aggregate.mockResolvedValue({ _sum: { saleAmount: 0 } });

    await service.calculateForPlan('p1');

    expect(tx.salesTargetLine.update).toHaveBeenCalledWith({
      where: { id: 'l1' },
      data: { actualValue: 0, achievementPct: 0, status: 'Pending' },
    });
  });

  it('treats a null actual-sum (no matching SalesActual rows) as zero', async () => {
    const pastLine = {
      id: 'l1',
      dimensionId: 'STR001',
      targetValue: 100,
      periodStart: new Date('2020-01-01'),
      periodEnd: new Date('2020-01-31'),
    };
    const plan = { id: 'p1', dimensionType: 'Store', lines: [pastLine] };
    prisma.salesTargetPlan.findUnique.mockResolvedValueOnce(plan).mockResolvedValueOnce(plan);
    tx.salesActual.aggregate.mockResolvedValue({ _sum: { saleAmount: null } });

    await service.calculateForPlan('p1');

    expect(tx.salesTargetLine.update).toHaveBeenCalledWith({
      where: { id: 'l1' },
      data: { actualValue: 0, achievementPct: 0, status: 'Missed' },
    });
  });
});
