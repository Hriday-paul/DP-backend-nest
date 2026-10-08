import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { AccountType, Prisma } from '@prisma/client';
import {
  CreateServiceDto,
  UpdateServiceDto,
} from './services.dto';
import { paginationHelper, TPaginationOptions } from 'src/common/helper/pagination.helper';
import slugify from 'slugify';

@Injectable()
export class ServicesService {
  constructor(private readonly prismaService: PrismaService) { }

  generateSlug(text: string) {
    return slugify(text, {
      lower: true,
      strict: true,
      trim: true,
    });
  };

  async createService(payload: CreateServiceDto) {

    const {variants, images, categoryId, title, description, note} = payload;

    // 1. Verify category exists and is active
    const category = await this.prismaService.category.findFirst({
      where: {
        id: categoryId,
        isDeleted: false,
      },
    });

    if (!category) {
      throw new NotFoundException('Category does not exist');
    }

    // 3. Generate or validate slug
    const slug = this.generateSlug(title);

    const varientsSort = variants?.sort((a, b) => a.final_price - b.final_price);

    const maxVariantPrice = varientsSort?.[varientsSort.length - 1]?.final_price ?? 0;
    const minVariantPrice = varientsSort?.[0]?.final_price ?? 0;

    // 4. Create service
    const newService = await this.prismaService.serivce.create({
      data: {
        title: title.trim(),
        slug,
        description: description.trim(),
        note: note?.trim(),
        minPrice: minVariantPrice,
        maxPrice: maxVariantPrice,
        categoryId: categoryId,
        images: images?.length
          ? {
            create: images.map((img) => ({
              url: img.url,
              key: img.key,
            })),
          }
          : undefined,
        variants: variants?.length
          ? {
            create: variants.map((v) => ({
              timeLine: v.timeLine,
              base_price: v.base_price,
              discount: v.discount ?? 0,
              final_price: v.final_price,
              badges: v.badges || [],
              note: v.note,
              accountType: v.accountType || AccountType.PERSONAL,
            })),
          }
          : undefined,
      }
    });

    return newService;
  }

  async getAllServices(query: Record<string, unknown>, options: TPaginationOptions) {
    const { limit, skip, sortBy, sortOrder, page } = paginationHelper.calculatePagination(options);

    const { searchTerm, category } = query;

    const andConditions: Prisma.SerivceWhereInput[] = [{ isDeleted: false }];

    if (category) {
      andConditions.push({
        category: {
          name: { contains: category as string, mode: 'insensitive' },
        }
      });
    }

    if (searchTerm) {
      andConditions.push({
        OR: [
          { title: { contains: searchTerm as string, mode: 'insensitive' } },
          { description: { contains: searchTerm as string, mode: 'insensitive' } },
        ],
      });
    }

    const whereConditions: Prisma.SerivceWhereInput = {
      AND: andConditions,
    };

    const [data, total] = await Promise.all([
      this.prismaService.serivce.findMany({
        where: whereConditions,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
          images: {
            select: {
              id: true,
              url: true,
              key: true,
            },
          },
          variants: {
            where: { isDeleted: false },
            select: {
              id: true,
              timeLine: true,
              base_price: true,
              discount: true,
              final_price: true,
              badges: true,
              note: true,
              accountType: true,
            },
          },
        },
      }),
      this.prismaService.serivce.count({
        where: whereConditions,
      }),
    ]);

    return {
      meta: paginationHelper.generatePaginationMeta({
        page,
        limit,
        total,
      }),
      data,
    };
  }

  async getServiceBySlug(slug: string) {

    const where: Prisma.SerivceWhereInput = {
      isDeleted: false,
      slug: slug,
    };

    const service = await this.prismaService.serivce.findFirst({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        images: {
          select: {
            id: true,
            url: true,
            key: true,
          },
        },
        variants: {
          where: { isDeleted: false },
          select: {
            id: true,
            timeLine: true,
            base_price: true,
            discount: true,
            final_price: true,
            badges: true,
            note: true,
            accountType: true,
          },
        },
      },
    });

    if (!service) {
      throw new NotFoundException('Service not available');
    }

    return service;
  }

  async updateService(id: string, payload: UpdateServiceDto) {

    const { title, description, note, categoryId, images, variants } = payload;

    const service = await this.prismaService.serivce.findFirst({
      where: {
        id,
        isDeleted: false,
      },
    });

    if (!service) {
      throw new NotFoundException('Service not available');
    }

    if (categoryId) {
      const category = await this.prismaService.category.findFirst({
        where: {
          id: categoryId,
          isDeleted: false,
        },
      });

      if (!category) {
        throw new NotFoundException('Category not found');
      }
    }

    const dataToUpdate: Prisma.SerivceUpdateInput = {};

    if (payload.title !== undefined) dataToUpdate.title = payload.title.trim();
    if (payload.description !== undefined)
      dataToUpdate.description = payload.description.trim();
    if (payload.note !== undefined) dataToUpdate.note = payload.note?.trim();
    if (payload.categoryId !== undefined) {
      dataToUpdate.category = { connect: { id: payload.categoryId } };
    }

    if (payload.images !== undefined) {
      dataToUpdate.images = {
        deleteMany: {},
        create: payload.images.map((img) => ({
          url: img.url,
          key: img.key,
        })),
      };
    }

    if (payload.variants !== undefined) {
      dataToUpdate.variants = {
        deleteMany: {},
        create: payload.variants.map((v) => ({
          timeLine: v.timeLine,
          base_price: v.base_price,
          discount: v.discount ?? 0,
          final_price: v.final_price,
          badges: v.badges || [],
          note: v.note,
          accountType: v.accountType || AccountType.PERSONAL,
        })),
      };
    }

    if (Object.keys(dataToUpdate).length === 0) {
      throw new BadRequestException('No valid fields provided for update');
    }

    const updatedService = await this.prismaService.serivce.update({
      where: { id },
      data: dataToUpdate,
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        images: {
          select: {
            id: true,
            url: true,
            key: true,
          },
        },
        variants: {
          where: { isDeleted: false },
          select: {
            id: true,
            timeLine: true,
            base_price: true,
            discount: true,
            final_price: true,
            badges: true,
            note: true,
            accountType: true,
          },
        },
      },
    });

    return updatedService;
  }

  async deleteService(id: string) {
    const service = await this.prismaService.serivce.findFirst({
      where: {
        id,
        isDeleted: false,
      },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    await this.prismaService.$transaction([
      this.prismaService.serivce.update({
        where: { id },
        data: { isDeleted: true },
      }),
      this.prismaService.variant.updateMany({
        where: { isDeleted: false, serviceId: id },
        data: { isDeleted: true },
      }),
    ]);

    return;
  }
}
