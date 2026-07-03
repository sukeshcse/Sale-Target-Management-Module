import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { TargetPlansModule } from './target-plans/target-plans.module';
import { TargetImportModule } from './target-import/target-import.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, TargetPlansModule, TargetImportModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
