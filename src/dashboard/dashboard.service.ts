import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class DashboardService {

    constructor(private readonly prismaService: PrismaService) { }

    async statsData() {

        const totalUsers = await this.prismaService.user.count();

        const totalEarnings = await this.prismaService.payment.aggregate({
            _sum : {
                amount: true
            },
            where: {
                status: "PAID"
            }
        });

        return {
            totalUsers,
            totalEarnings: totalEarnings._sum.amount || 0
        };
    }

    async earningChart (JoinYear: string | undefined) {

        let year = new Date().getFullYear();
        if (JoinYear) {
            year = Number(JoinYear);
        }
        const result = await this.prismaService.payment.groupBy({
            by: ["createdAt"],
            where: {
                createdAt: {
                    gte: new Date(`${year}-01-01T00:00:00.000Z`), // Start of the year
                    lt: new Date(`${year + 1}-01-01T00:00:00.000Z`), // Start of the next year
                },
                status : "PAID"
            },
            _sum: {
                amount: true,
            },
        });

        // Step 2: Aggregate data by months
        const monthNames = [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December",
        ];

        // Initialize monthly revenue array
        const monthsPaymentCount = Array.from({ length: 12 }, (_, i) => ({
            month: monthNames[i],
            revenue: 0,
        }));

        // Populate monthly revenue array
        result.forEach((entry) => {
            const monthIndex = new Date(entry.createdAt).getMonth(); // Extract month index
            const revenue = entry._sum.amount || 0; // Get the revenue for the month
            monthsPaymentCount[monthIndex].revenue += revenue;
        });

        // Step 4: Return the populated monthsUserCount array
        return monthsPaymentCount;


    }

    async userChart(JoinYear: string | undefined) {
        let year = new Date().getFullYear();

        if (JoinYear) {
            year = Number(JoinYear);
        }

        // Step 1: Fetch all users of that year
        const users = await this.prismaService.user.findMany({
            where: {
                isDeleted: false,
                createdAt: {
                    gte: new Date(`${year}-01-01T00:00:00.000Z`),
                    lt: new Date(`${year + 1}-01-01T00:00:00.000Z`),
                },
                auth: {
                    // Exclude admin users
                    role: {
                        not: "ADMIN",
                    },
                },
            },
            select: { createdAt: true },
        });

        // Step 2: Create 12 months array
        const monthNames = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December",
        ];

        const monthsUserCount = monthNames.map((month) => ({
            month,
            userCount: 0,
        }));

        // Step 3: Loop and count users per month
        users.forEach((u) => {
            const monthIndex = u.createdAt.getMonth();
            monthsUserCount[monthIndex].userCount += 1;
        });

        return monthsUserCount;
    };

}
