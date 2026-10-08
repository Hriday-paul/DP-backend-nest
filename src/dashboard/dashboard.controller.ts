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
        return await this.dashboardService.statsData();
    }

    @Roles("MEMBER")
    @UseGuards(PermissionGuard)
    @ResponseMessage('Earning chart retrieved successfully')
    @HttpCode(200)
    @Get('earning-chart')
    async documentUploadChart(@Query('JoinYear') JoinYear: string | undefined) {
        return await this.dashboardService.earningChart(JoinYear);
    }

    @Roles("MEMBER")
    @UseGuards(PermissionGuard)
    @ResponseMessage('User chart retrieved successfully')
    @HttpCode(200)
    @Get('user-chart')
    async recentUploadedDocuments(@Query('JoinYear') JoinYear: string | undefined) {
        return await this.dashboardService.userChart(JoinYear);
    }

}
