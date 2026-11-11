import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { config } from 'src/common/constant';
import path from 'path';
import fs from 'fs-extra';
import { UpdateBannerOrderDto } from './banners.dto';

const IMAGE_DIR = path.join(process.cwd(), 'public', 'images');

@Injectable()
export class BannersService {
  constructor(private readonly prismaService: PrismaService) {}

  async createBanner(file: Express.Multer.File | undefined) {
    if (!file) {
      throw new BadRequestException('Banner image is required');
    }

    try {
      return await this.prismaService.banner.create({
        data: {
          key: file.filename,
          url: `${config.serverDomain}/images/${file.filename}`,
        },
      });
    } catch (err) {
      await fs.remove(path.join(IMAGE_DIR, file.filename)).catch(() => { });
      throw err;
    }
  }

  async getAllBanners() {
    return await this.prismaService.banner.findMany({
      orderBy: { order: 'asc' },
    });
  }

  async updateOrder(id: string, payload: UpdateBannerOrderDto) {
    const banner = await this.prismaService.banner.findUnique({ where: { id } });
    if (!banner) {
      throw new NotFoundException('Banner not found');
    }

    return await this.prismaService.banner.update({
      where: { id },
      data: { order: payload.order },
    });
  }

  async deleteBanner(id: string) {
    const banner = await this.prismaService.banner.findUnique({ where: { id } });
    if (!banner) {
      throw new NotFoundException('Banner not found');
    }

    await this.prismaService.banner.delete({ where: { id } });
    await fs.remove(path.join(IMAGE_DIR, path.basename(banner.key))).catch(() => { });

    return;
  }
}
