import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { Prisma, Role } from '@prisma/client';
import { paginationHelper, TPaginationOptions } from 'src/common/helper/pagination.helper';

@Injectable()
export class NotificationService {
    constructor(
        private prismaService: PrismaService
    ) { }

    async notifications(options: TPaginationOptions, user: { id: string, role: Role }) {

        const AndConditions: Prisma.NotificationWhereInput[] = [{ receiverId: user?.id }];

        const { limit, skip, sortBy, sortOrder, page } = paginationHelper.calculatePagination(options);


        const whereConditions: Prisma.NotificationWhereInput = AndConditions.length > 0 ? { AND: AndConditions } : {};

        const result = await this.prismaService.notification.findMany({
            where: whereConditions,
            skip,
            take: limit,
            orderBy: {
                [sortBy]: sortOrder,
            }
        })

        const total = await this.prismaService.notification.count({
            where: whereConditions,
        });

        return {
            meta: {
                total,
                page,
                limit,
            },
            data: result,
        };
    }

    async unReadCount(user: { id: string, role: Role }) {
        const count = await this.prismaService.notification.count({
            where: {
                receiverId: user?.id,
                isRead: false,
            },
        });

        return count;
    }

    async markAsReadAll(user: { id: string, role: Role }) {
        const result = await this.prismaService.notification.updateMany({
            where: {
                receiverId: user?.id,
                isRead: false,
            },
            data: {
                isRead: true,
            },
        });

        return result;
    }
}
