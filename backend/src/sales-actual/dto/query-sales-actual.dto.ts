import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { DimensionType } from '@prisma/client';

export class QuerySalesActualDto {
  @ApiPropertyOptional({ enum: DimensionType })
  @IsOptional()
  @IsEnum(DimensionType)
  dimensionType?: DimensionType;

  @ApiPropertyOptional({ description: 'Exact DimensionCode match' })
  @IsOptional()
  dimensionId?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number = 50;
}
