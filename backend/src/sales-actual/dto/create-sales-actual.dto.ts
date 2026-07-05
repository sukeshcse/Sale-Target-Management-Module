import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNotEmpty, IsNumber, Min, MaxLength } from 'class-validator';
import { DimensionType } from '@prisma/client';

export class CreateSalesActualDto {
  @ApiProperty({ enum: DimensionType, example: DimensionType.Store })
  @IsEnum(DimensionType)
  dimensionType: DimensionType;

  @ApiProperty({ example: 'STR001', description: 'Must match the DimensionCode used on the target line to be picked up by achievement calculation' })
  @IsNotEmpty()
  @MaxLength(50)
  dimensionId: string;

  @ApiProperty({ example: 'Store North' })
  @IsNotEmpty()
  @MaxLength(200)
  dimensionName: string;

  @ApiProperty({ example: '2024-02-10' })
  @IsDateString()
  saleDate: string;

  @ApiProperty({ example: 25000 })
  @IsNumber()
  @Min(0)
  saleAmount: number;
}
