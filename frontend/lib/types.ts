export type DimensionType = 'Product' | 'Store' | 'Salesman' | 'BusinessUnit' | 'Region';
export type PeriodType = 'Weekly' | 'Monthly' | 'Quarterly';
export type PlanStatus = 'Draft' | 'Active';
export type LineStatus = 'Achieved' | 'Missed' | 'Pending' | 'NoTargetSet';

export const DIMENSION_TYPES: DimensionType[] = ['Product', 'Store', 'Salesman', 'BusinessUnit', 'Region'];
export const PERIOD_TYPES: PeriodType[] = ['Weekly', 'Monthly', 'Quarterly'];
export const PLAN_STATUSES: PlanStatus[] = ['Draft', 'Active'];
export const LINE_STATUSES: LineStatus[] = ['Achieved', 'Missed', 'Pending', 'NoTargetSet'];

export interface TargetPlan {
  id: string;
  name: string;
  dimensionType: DimensionType;
  periodType: PeriodType;
  startDate: string;
  endDate: string;
  status: PlanStatus;
  createdAt: string;
  updatedAt: string;
  _count?: { lines: number };
}

export interface TargetLine {
  id: string;
  planId: string;
  periodLabel: string;
  periodStart: string;
  periodEnd: string;
  dimensionId: string;
  dimensionName: string;
  targetValue: number;
  actualValue: number;
  achievementPct: number;
  status: LineStatus;
}

export interface PlanSummary {
  totalTarget: number;
  totalActual: number;
  overallAchievementPct: number;
  lineCount: number;
  countsByStatus: Record<LineStatus, number>;
}

export interface TargetPlanDetail extends TargetPlan {
  lines: TargetLine[];
  summary: PlanSummary;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface SalesActual {
  id: string;
  dimensionType: DimensionType;
  dimensionId: string;
  dimensionName: string;
  saleDate: string;
  saleAmount: number;
  createdAt: string;
}

export interface ApiError {
  message: string | string[];
  error: string;
  statusCode: number;
}
