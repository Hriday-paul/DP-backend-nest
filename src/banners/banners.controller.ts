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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import path from 'path';
import fs from 'fs-extra';
import { Role } from '@prisma/client';
import { BannersService } from './banners.service';
import { UpdateBannerOrderDto } from './banners.dto';
import { Roles } from 'src/common/deorators/role.decorator';
import { PermissionGuard } from 'src/common/guards/permisson.guard';
import { ResponseMessage } from 'src/common/deorators/apiResponse.decorator';

const TMP_DIR = path.join(process.cwd(), 'public', 'images');

@Controller('banners')
@Roles(Role.ADMIN)
export class BannersController {
  constructor(private readonly bannersService: BannersService) { }

  @UseGuards(PermissionGuard)
  @ResponseMessage('Banner uploaded successfully')
  @HttpCode(201)
  @Post()
  @UseInterceptors(FileInterceptor('image', {
    storage: diskStorage({
      destination: (req, file, cb) => {
        fs.ensureDirSync(TMP_DIR);
        cb(null, TMP_DIR);
      },
      filename: (req, file, cb) => {
        cb(null, `${Math.floor(100000 + Math.random() * 900000)}${Date.now()}-${path.basename(file.originalname)}`);
      },
    }),
    limits: { fileSize: 1024 * 1024 * 5 }, // 5MB
    fileFilter: (_, file, cb) => {
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'), false);
      }
    },
  }))
  async uploadBanner(@UploadedFile() file: Express.Multer.File) {
    return await this.bannersService.createBanner(file);
  }

  @ResponseMessage('Banners retrieved successfully')
  @HttpCode(200)
  @Get()
  async getAllBanners() {
    return await this.bannersService.getAllBanners();
  }

  @UseGuards(PermissionGuard)
  @ResponseMessage('Banner order updated successfully')
  @HttpCode(200)
  @Patch(':id/order')
  async updateOrder(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateBannerOrderDto,
  ) {
    return await this.bannersService.updateOrder(id, body);
  }

  @UseGuards(PermissionGuard)
  @ResponseMessage('Banner deleted successfully')
  @HttpCode(200)
  @Delete(':id')
  async deleteBanner(@Param('id', ParseUUIDPipe) id: string) {
    return await this.bannersService.deleteBanner(id);
  }
}
