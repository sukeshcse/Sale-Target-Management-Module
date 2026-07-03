import { Module } from '@nestjs/common';
import { TargetImportController } from './target-import.controller';
import { TargetImportService } from './target-import.service';

@Module({
  controllers: [TargetImportController],
  providers: [TargetImportService],
})
export class TargetImportModule {}
