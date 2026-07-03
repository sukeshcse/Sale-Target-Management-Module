import { ApiProperty } from '@nestjs/swagger';

export class RowError {
  @ApiProperty({ description: '1-indexed spreadsheet row number (header is row 1, so data starts at row 2)' })
  row: number;

  @ApiProperty({ type: [String] })
  errors: string[];
}

export class ImportResultDto {
  @ApiProperty({ enum: ['Success', 'Failed'] })
  status: 'Success' | 'Failed';

  @ApiProperty()
  totalRows: number;

  @ApiProperty()
  importedRows: number;

  @ApiProperty()
  failedRows: number;

  @ApiProperty({ type: [RowError] })
  errors: RowError[];
}
