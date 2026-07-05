import { Module } from '@nestjs/common';
import { SalesActualController } from './sales-actual.controller';
import { SalesActualService } from './sales-actual.service';

@Module({
  controllers: [SalesActualController],
  providers: [SalesActualService],
})
export class SalesActualModule {}
