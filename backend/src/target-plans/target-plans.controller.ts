import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { TargetPlansService } from './target-plans.service';
import { CreateTargetPlanDto } from './dto/create-target-plan.dto';
import { UpdateTargetPlanDto } from './dto/update-target-plan.dto';
import { QueryTargetPlansDto } from './dto/query-target-plans.dto';

@ApiTags('target-plans')
@Controller('target-plans')
export class TargetPlansController {
  constructor(private readonly targetPlansService: TargetPlansService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new sales target plan in Draft status' })
  create(@Body() dto: CreateTargetPlanDto) {
    return this.targetPlansService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List target plans with optional filters' })
  findAll(@Query() query: QueryTargetPlansDto) {
    return this.targetPlansService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a plan with all target lines and achievement summary' })
  findOne(@Param('id') id: string) {
    return this.targetPlansService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Edit a Draft plan (date range locked once lines are attached)' })
  update(@Param('id') id: string, @Body() dto: UpdateTargetPlanDto) {
    return this.targetPlansService.update(id, dto);
  }

  @Patch(':id/activate')
  @ApiOperation({ summary: 'Activate a Draft plan (requires at least one target line)' })
  activate(@Param('id') id: string) {
    return this.targetPlansService.activate(id);
  }
}
