import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSalesActualDto } from './dto/create-sales-actual.dto';
import { QuerySalesActualDto } from './dto/query-sales-actual.dto';

@Injectable()
export class SalesActualService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateSalesActualDto) {
    return this.prisma.salesActual.create({
      data: { ...dto, saleDate: new Date(dto.saleDate) },
    });
  }

  async findAll(query: QuerySalesActualDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 50;
    const where: Prisma.SalesActualWhereInput = {
      dimensionType: query.dimensionType,
      dimensionId: query.dimensionId,
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.salesActual.findMany({
        where,
        orderBy: { saleDate: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.salesActual.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }
}
