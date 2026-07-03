import { Controller, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AchievementService } from './achievement.service';

@ApiTags('achievement')
@Controller('target-plans/:id/calculate-achievement')
export class AchievementController {
  constructor(private readonly achievementService: AchievementService) {}

  @Post()
  @ApiOperation({ summary: "Recalculate a plan's target lines against SalesActual data" })
  calculate(@Param('id') planId: string) {
    return this.achievementService.calculateForPlan(planId);
  }
}
