import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { DimensionType, PeriodType } from '@prisma/client';

export class CreateTargetPlanDto {
  @ApiProperty({ example: 'Q1 2024 - Store-wise Target' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @ApiProperty({ enum: DimensionType, example: DimensionType.Store })
  @IsEnum(DimensionType)
  dimensionType: DimensionType;

  @ApiProperty({ enum: PeriodType, example: PeriodType.Monthly })
  @IsEnum(PeriodType)
  periodType: PeriodType;

  @ApiProperty({ example: '2024-01-01' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2024-03-31' })
  @IsDateString()
  endDate: string;
}
