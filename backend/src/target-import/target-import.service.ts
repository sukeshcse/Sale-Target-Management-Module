import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Workbook } from 'exceljs';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { getPeriodBounds, isPeriodWithinRange } from '../common/utils/period.util';

const REQUIRED_COLUMNS = ['Period', 'DimensionCode', 'DimensionName', 'TargetValue'] as const;
const DIMENSION_CODE_PATTERN = /^[A-Za-z0-9_-]+$/;

interface ParsedRow {
  row: number;
  period: string;
  dimensionCode: string;
  dimensionName: string;
  targetValue: number;
}

export interface RowError {
  row: number;
  errors: string[];
}

export interface ImportRunResult {
  status: 'Success' | 'Failed';
  totalRows: number;
  importedRows: number;
  failedRows: number;
  errors: RowError[];
}

function cellToString(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object' && 'text' in (value as Record<string, unknown>)) {
    return String((value as { text: unknown }).text).trim();
  }
  return String(value).trim();
}

function parseTargetValue(value: unknown): number | null {
  if (typeof value === 'number') return value;
  const str = cellToString(value).replace(/,/g, '');
  if (str === '') return null;
  const num = Number(str);
  return Number.isFinite(num) ? num : null;
}

@Injectable()
export class TargetImportService {
  constructor(private readonly prisma: PrismaService) {}

  async importFile(planId: string, fileName: string, buffer: Buffer): Promise<ImportRunResult> {
    const plan = await this.prisma.salesTargetPlan.findUnique({ where: { id: planId } });
    if (!plan) {
      throw new NotFoundException(`Target plan ${planId} not found`);
    }

    const workbook = new Workbook();
    try {
      await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
    } catch {
      throw new BadRequestException('Could not parse file as XLSX');
    }

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      throw new BadRequestException('Workbook has no worksheets');
    }

    const headerRow = worksheet.getRow(1);
    const columnIndex: Record<string, number> = {};
    headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      columnIndex[cellToString(cell.value)] = colNumber;
    });
    const missingColumns = REQUIRED_COLUMNS.filter((col) => !columnIndex[col]);
    if (missingColumns.length > 0) {
      throw new BadRequestException(`Missing required column(s): ${missingColumns.join(', ')}`);
    }

    const rowErrors: RowError[] = [];
    const parsedRows: ParsedRow[] = [];
    const seenKeys = new Map<string, number>(); // "dimensionCode|period" -> first row number

    const totalRows = worksheet.rowCount - 1;
    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
      const row = worksheet.getRow(rowNumber);
      if (row.cellCount === 0) continue;

      const errors: string[] = [];
      const period = cellToString(row.getCell(columnIndex.Period).value);
      const dimensionCode = cellToString(row.getCell(columnIndex.DimensionCode).value);
      const dimensionName = cellToString(row.getCell(columnIndex.DimensionName).value);
      const targetValueRaw = row.getCell(columnIndex.TargetValue).value;
      const targetValue = parseTargetValue(targetValueRaw);

      if (!period) errors.push('Period is required');
      if (!dimensionCode) errors.push('DimensionCode is required');
      else if (!DIMENSION_CODE_PATTERN.test(dimensionCode)) errors.push(`DimensionCode "${dimensionCode}" has an invalid format`);
      if (!dimensionName) errors.push('DimensionName is required');
      if (targetValue === null) errors.push('TargetValue is required and must be numeric');
      else if (targetValue < 0) errors.push('TargetValue must not be negative');

      let periodBounds: ReturnType<typeof getPeriodBounds> = null;
      if (period) {
        periodBounds = getPeriodBounds(plan.periodType, period);
        if (!periodBounds) {
          errors.push(`Period "${period}" is not a valid ${plan.periodType} period label`);
        } else if (!isPeriodWithinRange(periodBounds.start, periodBounds.end, plan.startDate, plan.endDate)) {
          errors.push(`Period "${period}" falls outside the plan's date range`);
        }
      }

      if (dimensionCode && period) {
        const key = `${dimensionCode}|${period}`;
        const firstRow = seenKeys.get(key);
        if (firstRow) {
          errors.push(`Duplicate row for DimensionCode "${dimensionCode}" + Period "${period}" (first seen at row ${firstRow})`);
        } else {
          seenKeys.set(key, rowNumber);
        }
      }

      if (errors.length > 0) {
        rowErrors.push({ row: rowNumber, errors });
      } else {
        parsedRows.push({ row: rowNumber, period, dimensionCode, dimensionName, targetValue: targetValue as number });
      }
    }

    if (rowErrors.length > 0) {
      await this.prisma.targetImportLog.create({
        data: {
          planId,
          fileName,
          status: 'Failed',
          totalRows,
          importedRows: 0,
          failedRows: rowErrors.length,
          errors: rowErrors as unknown as Prisma.InputJsonValue,
        },
      });
      return {
        status: 'Failed' as const,
        totalRows,
        importedRows: 0,
        failedRows: rowErrors.length,
        errors: rowErrors,
      };
    }

    await this.prisma.$transaction(async (tx) => {
      for (const parsed of parsedRows) {
        const bounds = getPeriodBounds(plan.periodType, parsed.period)!;
        await tx.salesTargetLine.upsert({
          where: {
            planId_dimensionId_periodLabel: {
              planId,
              dimensionId: parsed.dimensionCode,
              periodLabel: parsed.period,
            },
          },
          create: {
            planId,
            dimensionId: parsed.dimensionCode,
            dimensionName: parsed.dimensionName,
            periodLabel: parsed.period,
            periodStart: bounds.start,
            periodEnd: bounds.end,
            targetValue: parsed.targetValue,
          },
          update: {
            dimensionName: parsed.dimensionName,
            targetValue: parsed.targetValue,
          },
        });
      }

      await tx.targetImportLog.create({
        data: {
          planId,
          fileName,
          status: 'Success',
          totalRows,
          importedRows: parsedRows.length,
          failedRows: 0,
          errors: [],
        },
      });
    });

    return {
      status: 'Success' as const,
      totalRows,
      importedRows: parsedRows.length,
      failedRows: 0,
      errors: [],
    };
  }
}
