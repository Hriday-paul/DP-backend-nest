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
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ServicesService } from './services.service';
import {
  CreateServiceDto,
  UpdateServiceDto,
} from './services.dto';
import { Roles } from 'src/common/deorators/role.decorator';
import { Role } from '@prisma/client';
import { PermissionGuard } from 'src/common/guards/permisson.guard';
import { ResponseMessage } from 'src/common/deorators/apiResponse.decorator';
import pick from 'src/common/shared/pick';
import { PaginateOptions } from 'src/common/helper/pagination.helper';
import { config } from 'src/common/constant';
import path from 'path';
import fs from 'fs-extra';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';

const TMP_DIR = path.join(process.cwd(), 'public', 'images');

@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) { }

  @Roles(Role.ADMIN)
  @UseGuards(PermissionGuard)
  @ResponseMessage('Service created successfully')
  @HttpCode(201)
  @Post()
  @UseInterceptors(FilesInterceptor('images', 5, {
    storage: diskStorage({
      destination: (req, file, cb) => {
        const dir = TMP_DIR;
        fs.ensureDirSync(dir);
        cb(null, dir);
      },
      filename: (req, file, cb) => {
        cb(null, `${`${Math.floor(100000 + Math.random() * 900000)}${Date.now()}`}-${file?.originalname}`);
      },
    }),
    limits: { 
      fileSize: 1024 * 1024 * 5,  // 5MB
      files: 5  // Maximum number of files
     },
    fileFilter: (_, file, cb) => {
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'), false);
      }
    },
  }))
  async uploadFile(@UploadedFiles() files: Express.Multer.File[], @Body() payload: CreateServiceDto, @Req() req: Request) {

    if (files) {
      payload.images = files.map(file => ({
        key: file.filename,
        url: `${config.serverDomain}/images/${file.filename}`,
      }));

    }

    await this.servicesService.createService(payload);
    return;
  }

  @ResponseMessage('Services retrieved successfully')
  @HttpCode(200)
  @Get()
  async getAllServices(@Query() query: Record<string, unknown>) {
    const filtered_query = pick(query, ["searchTerm", "category"])
    const options = pick(query, PaginateOptions);
    return await this.servicesService.getAllServices(filtered_query, options);
  }

  @ResponseMessage('Service retrieved successfully')
  @HttpCode(200)
  @Get(':id')
  async getServiceById(@Param('id') id: string) {
    return await this.servicesService.getServiceBySlug(id);
  }

  @Roles(Role.ADMIN)
  @UseGuards(PermissionGuard)
  @ResponseMessage('Service updated successfully')
  @HttpCode(200)
  @Patch(':id')
  async updateService(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateServiceDto: UpdateServiceDto,
  ) {
    return await this.servicesService.updateService(id, updateServiceDto);
  }

  @Roles(Role.ADMIN)
  @UseGuards(PermissionGuard)
  @ResponseMessage('Service updated successfully')
  @HttpCode(200)
  @Put(':id')
  async editService(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateServiceDto: UpdateServiceDto,
  ) {
    return await this.servicesService.updateService(id, updateServiceDto);
  }

  @Roles(Role.ADMIN)
  @UseGuards(PermissionGuard)
  @ResponseMessage('Service deleted successfully')
  @HttpCode(200)
  @Delete(':id')
  async deleteService(@Param('id', ParseUUIDPipe) id: string) {
    return await this.servicesService.deleteService(id);
  }
}
