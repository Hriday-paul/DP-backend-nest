import { Module } from '@nestjs/common';
import { SupportsController } from './supports.controller';
import { SupportsService } from './supports.service';
import { PrismaService } from 'src/prisma.service';

@Module({
  controllers: [SupportsController],
  providers: [SupportsService, PrismaService],
})
export class SupportsModule {}
