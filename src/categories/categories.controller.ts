import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import {
  CreateCategoryDto,
  QueryCategoryDto,
  UpdateCategoryDto,
} from './categories.dto';
import { Roles } from 'src/common/deorators/role.decorator';
import { Role } from '@prisma/client';
import { PermissionGuard } from 'src/common/guards/permisson.guard';
import { ResponseMessage } from 'src/common/deorators/apiResponse.decorator';

@Roles(Role.ADMIN)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}


  @UseGuards(PermissionGuard)
  @ResponseMessage('Category created successfully')
  @HttpCode(201)
  @Post()
  async createCategory(@Body() createCategoryDto: CreateCategoryDto) {
    return await this.categoriesService.createCategory(createCategoryDto);
  }

  @ResponseMessage('Categories retrieved successfully')
  @HttpCode(200)
  @Get()
  async getCategories(@Query() query: QueryCategoryDto) {
    return await this.categoriesService.getAllCategories(query);
  }

  @ResponseMessage('Category retrieved successfully')
  @HttpCode(200)
  @Get(':id')
  async getCategoryById(@Param('id', ParseUUIDPipe) id: string) {
    return await this.categoriesService.getCategoryById(id);
  }


  @UseGuards(PermissionGuard)
  @ResponseMessage('Category updated successfully')
  @HttpCode(200)
  @Patch(':id')
  async updateCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return await this.categoriesService.updateCategory(id, updateCategoryDto);
  }


  @UseGuards(PermissionGuard)
  @ResponseMessage('Category updated successfully')
  @HttpCode(200)
  @Put(':id')
  async editCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return await this.categoriesService.updateCategory(id, updateCategoryDto);
  }


  @UseGuards(PermissionGuard)
  @ResponseMessage('Category deleted successfully')
  @HttpCode(200)
  @Delete(':id')
  async deleteCategory(@Param('id', ParseUUIDPipe) id: string) {
    return await this.categoriesService.deleteCategory(id);
  }
}
