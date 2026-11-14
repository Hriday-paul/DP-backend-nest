import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import {
  paginationHelper,
  TPaginationOptions,
} from 'src/common/helper/pagination.helper';
import { CreateSupportDto, QuerySupportDto } from './supports.dto';

const SORTABLE_FIELDS = ['createdAt', 'name', 'subject', 'email', 'phone'];

@Injectable()
export class SupportsService {
  constructor(private readonly prismaService: PrismaService) {}

  async createSupport(payload: CreateSupportDto) {
    return await this.prismaService.support.create({
      data: {
        name: payload.name,
        phone: payload.phone,
        email: payload.email || null,
        subject: payload.subject,
        details: payload.details || null,
      },
    });
  }

  async getAllSupports(query: QuerySupportDto, options: TPaginationOptions) {
    const { limit, skip, sortBy, sortOrder, page } =
      paginationHelper.calculatePagination(options);

    const where: Prisma.SupportWhereInput = {};

    if (query?.searchTerm?.trim()) {
      const term = query.searchTerm.trim();
      where.OR = [
        { name: { contains: term, mode: 'insensitive' } },
        { phone: { contains: term, mode: 'insensitive' } },
        { email: { contains: term, mode: 'insensitive' } },
        { subject: { contains: term, mode: 'insensitive' } },
        { details: { contains: term, mode: 'insensitive' } },
      ];
    }

    const orderField = SORTABLE_FIELDS.includes(sortBy) ? sortBy : 'createdAt';
    const orderDir: Prisma.SortOrder = sortOrder === 'asc' ? 'asc' : 'desc';

    const [data, total] = await Promise.all([
      this.prismaService.support.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [orderField]: orderDir },
      }),
      this.prismaService.support.count({ where }),
    ]);

    return {
      meta: paginationHelper.generatePaginationMeta({ page, limit, total }),
      data,
    };
  }

  async deleteSupport(id: string) {
    const support = await this.prismaService.support.findUnique({
      where: { id },
    });

    if (!support) {
      throw new NotFoundException('Support message not found');
    }

    await this.prismaService.support.delete({ where: { id } });

    return;
  }
}
