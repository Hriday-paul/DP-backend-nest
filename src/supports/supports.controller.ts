import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { SupportsService } from './supports.service';
import { CreateSupportDto } from './supports.dto';
import { Roles } from 'src/common/deorators/role.decorator';
import { PermissionGuard } from 'src/common/guards/permisson.guard';
import { ResponseMessage } from 'src/common/deorators/apiResponse.decorator';
import pick from 'src/common/shared/pick';
import { PaginateOptions } from 'src/common/helper/pagination.helper';

@Controller('supports')
export class SupportsController {
  constructor(private readonly supportsService: SupportsService) {}

  // Public: anyone can submit a support / contact message
  @ResponseMessage('Your message has been sent successfully')
  @HttpCode(201)
  @Post()
  async createSupport(@Body() createSupportDto: CreateSupportDto) {
    return await this.supportsService.createSupport(createSupportDto);
  }

  @Roles(Role.ADMIN)
  @UseGuards(PermissionGuard)
  @ResponseMessage('Support messages retrieved successfully')
  @HttpCode(200)
  @Get()
  async getAllSupports(@Query() query: Record<string, unknown>) {
    const filtered_query = pick(query, ['searchTerm']);
    const options = pick(query, PaginateOptions);
    return await this.supportsService.getAllSupports(filtered_query, options);
  }

  @Roles(Role.ADMIN)
  @UseGuards(PermissionGuard)
  @ResponseMessage('Support message deleted successfully')
  @HttpCode(200)
  @Delete(':id')
  async deleteSupport(@Param('id', ParseUUIDPipe) id: string) {
    return await this.supportsService.deleteSupport(id);
  }
}
