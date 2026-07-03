import { Module } from '@nestjs/common';
import { TargetPlansController } from './target-plans.controller';
import { TargetPlansService } from './target-plans.service';

@Module({
  controllers: [TargetPlansController],
  providers: [TargetPlansService],
  exports: [TargetPlansService],
})
export class TargetPlansModule {}
