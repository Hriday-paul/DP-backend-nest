import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { Prisma } from '@prisma/client';
import {
  CreateCategoryDto,
  QueryCategoryDto,
  UpdateCategoryDto,
} from './categories.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prismaService: PrismaService) { }

  async createCategory(payload: CreateCategoryDto) {
    const name = payload.name.trim();

    //check the category is already exist or not
    const isExist = await this.prismaService.category.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
        isDeleted: false,
      },
    });

    if (isExist) {
      throw new ConflictException('Category with this name already exists');
    }

    await this.prismaService.category.create({
      data: {
        name,
        description: payload.description?.trim(),
      }
    });

    return
  }

  async getAllCategories(query?: QueryCategoryDto) {
    const where: Prisma.CategoryWhereInput = {
      isDeleted: false,
    };

    if (query?.searchTerm) {
      const term = query.searchTerm.trim();
      where.OR = [
        { name: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
      ];
    }

    const result = await this.prismaService.category.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return result;
  }

  async getCategoryById(id: string) {
    const category = await this.prismaService.category.findFirst({
      where: {
        id,
        isDeleted: false,
      },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async updateCategory(id: string, payload: UpdateCategoryDto) {
    const category = await this.prismaService.category.findFirst({
      where: {
        id,
        isDeleted: false,
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const dataToUpdate: Prisma.CategoryUpdateInput = {};

    if (payload.name !== undefined) {
      const trimmedName = payload.name.trim();
      if (!trimmedName) {
        throw new BadRequestException('Category name cannot be empty');
      }

      const duplicate = await this.prismaService.category.findFirst({
        where: {
          name: { equals: trimmedName, mode: 'insensitive' },
          isDeleted: false,
          id: { not: id },
        },
      });

      if (duplicate) {
        throw new ConflictException('Category with this name already exists');
      }

      dataToUpdate.name = trimmedName;
    }

    if (payload.description !== undefined) {
      dataToUpdate.description = payload.description?.trim();
    }

    if (Object.keys(dataToUpdate).length === 0) {
      throw new BadRequestException('No valid fields provided for update');
    }

    return await this.prismaService.category.update({
      where: { id },
      data: dataToUpdate,
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async deleteCategory(id: string) {
    const category = await this.prismaService.category.findFirst({
      where: {
        id,
        isDeleted: false,
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const activeServicesCount = await this.prismaService.serivce.count({
      where: {
        categoryId: id,
        isDeleted: false,
      },
    });

    if (activeServicesCount > 0) {
      throw new BadRequestException(
        'Cannot delete category with associated active services. Please delete or reassign them first.',
      );
    }

    await this.prismaService.category.update({
      where: { id },
      data: { isDeleted: true },
    });

    return;
  }
}
