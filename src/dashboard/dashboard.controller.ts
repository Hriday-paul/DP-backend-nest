import { Controller, Get, HttpCode, Query, Req, Res, UseGuards } from '@nestjs/common';
import { Roles } from 'src/common/deorators/role.decorator';
import { DashboardService } from './dashboard.service';
import { PermissionGuard } from 'src/common/guards/permisson.guard';
import { ResponseMessage } from 'src/common/deorators/apiResponse.decorator';

@Roles("ADMIN", "MANAGER")
@Controller('dashboard')
export class DashboardController {

    constructor(private readonly dashboardService: DashboardService) { }

    @Roles("MEMBER")
    @UseGuards(PermissionGuard)
    @ResponseMessage('Stats retrieved successfully')
    @HttpCode(200)
    @Get('stats')
    async getStats(@Req() req: Request) {
        const user = req['user'];
        return await this.dashboardService.statsData(user);
    }

    @Roles("MEMBER")
    @UseGuards(PermissionGuard)
    @ResponseMessage('Document upload chart retrieved successfully')
    @HttpCode(200)
    @Get('document-chart')
    async documentUploadChart(@Query('JoinYear') JoinYear: string | undefined, @Req() req: Request) {
        const user = req['user'];
        return await this.dashboardService.documentUploadChart(JoinYear, user);
    }

    @Roles("MEMBER")
    @UseGuards(PermissionGuard)
    @ResponseMessage('Recent uploaded documents retrieved successfully')
    @HttpCode(200)
    @Get('recent-documents')
    async recentUploadedDocuments(@Req() req: Request) {
        const user = req['user'];
        return await this.dashboardService.recentUploadedDocuments(user);
    }

}
