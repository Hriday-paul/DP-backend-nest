import { Controller, Get, HttpCode, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { Roles } from 'src/common/deorators/role.decorator';
import { PermissionGuard } from 'src/common/guards/permisson.guard';
import { ResponseMessage } from 'src/common/deorators/apiResponse.decorator';
import pick from 'src/common/shared/pick';
import { PaginateOptions } from 'src/common/helper/pagination.helper';

@Roles("MANAGER", "ADMIN", "MEMBER")
@Controller('notifications')
export class NotificationController {
    constructor(private notificationService: NotificationService) { }

    @UseGuards(PermissionGuard)
    @ResponseMessage('Notifications retrieved successfully')
    @HttpCode(200)
    @Get()
    async getUsers(@Query() query: Record<string, unknown>, @Req() req: Request) {

        const options = pick(query, PaginateOptions);
        const data = await this.notificationService.notifications(options, req['user']);

        return data;
    }

    @UseGuards(PermissionGuard)
    @ResponseMessage('Unread notification count retrieved successfully')
    @HttpCode(200)
    @Get('unread-count')
    async getUnreadCount(@Req() req: Request) {
        const user = req['user'];
        const count = await this.notificationService.unReadCount(user);
        return count;
    }


    @UseGuards(PermissionGuard)
    @ResponseMessage('All notifications marked as read successfully')
    @HttpCode(200)
    @Put('make-read-all')
    async markAsReadAll(@Req() req: Request) {
        const user = req['user'];
        const result = await this.notificationService.markAsReadAll(user);
        return result;
    }


}
