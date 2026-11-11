import { Module } from '@nestjs/common';
import { BannersController } from './banners.controller';
import { BannersService } from './banners.service';
import { PrismaService } from 'src/prisma.service';

@Module({
  controllers: [BannersController],
  providers: [BannersService, PrismaService],
})
export class BannersModule {}
