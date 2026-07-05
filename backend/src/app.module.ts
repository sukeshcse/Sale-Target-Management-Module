import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { TargetPlansModule } from './target-plans/target-plans.module';
import { TargetImportModule } from './target-import/target-import.module';
import { AchievementModule } from './achievement/achievement.module';
import { SalesActualModule } from './sales-actual/sales-actual.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    TargetPlansModule,
    TargetImportModule,
    AchievementModule,
    SalesActualModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
