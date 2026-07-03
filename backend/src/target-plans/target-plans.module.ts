import { Module } from '@nestjs/common';
import { TargetPlansController } from './target-plans.controller';
import { TargetPlansService } from './target-plans.service';
import { AchievementModule } from '../achievement/achievement.module';

@Module({
  imports: [AchievementModule],
  controllers: [TargetPlansController],
  providers: [TargetPlansService],
  exports: [TargetPlansService],
})
export class TargetPlansModule {}
