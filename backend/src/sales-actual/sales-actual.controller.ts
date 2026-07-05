import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SalesActualService } from './sales-actual.service';
import { CreateSalesActualDto } from './dto/create-sales-actual.dto';
import { QuerySalesActualDto } from './dto/query-sales-actual.dto';

@ApiTags('sales-actuals')
@Controller('sales-actuals')
export class SalesActualController {
  constructor(private readonly salesActualService: SalesActualService) {}

  @Post()
  @ApiOperation({
    summary: 'Record a historical sale',
    description:
      "Historical sales data is normally assumed to already exist (e.g. synced from a POS/ERP system) — this endpoint exists so sales data can be entered through the API/UI instead of directly in the database, to make achievement calculation easy to demo.",
  })
  create(@Body() dto: CreateSalesActualDto) {
    return this.salesActualService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List historical sales, optionally filtered by dimension' })
  findAll(@Query() query: QuerySalesActualDto) {
    return this.salesActualService.findAll(query);
  }
}
