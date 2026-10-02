import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class DashboardService {

    constructor(private readonly prismaService: PrismaService) { }

    async statsData(user: { id: string, role: Role }) {
        const totalUsers = user?.role == Role.MEMBER ? 0 : await this.prismaService.user.count();
        const totalDocuments = await this.prismaService.document.count({
            where: {
                ...(user.role === Role.ADMIN) ? {} :
                    {
                        user: {
                            departmentGroups: {
                                some: {
                                    department: {
                                        departmentGroups: {
                                            some: {
                                                userId: user.id,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    }
            }
        });
        const totalDepartments = (user?.role == Role.MEMBER || user?.role == Role.MANAGER) ? 0 : await this.prismaService.department.count();

        return {
            totalUsers,
            totalDocuments,
            totalDepartments
        };
    }

    async recentUploadedDocuments(user: { id: string, role: Role }) {
        const documents = await this.prismaService.document.findMany({
            where: {
                //if not admin, can see assigned departments all users documents history only
                ...(user.role === Role.ADMIN) ? {} :
                    {
                        user: {
                            departmentGroups: {
                                some: {
                                    department: {
                                        departmentGroups: {
                                            some: {
                                                userId: user.id,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 8,
            include: {
                user: {
                    include: {
                        picture: true
                    }
                }
            }
        });
        return documents;
    }

    async documentUploadChart(JoinYear: string | undefined, user: { id: string, role: Role }) {
        let year = new Date().getFullYear();

        if (JoinYear) {
            year = Number(JoinYear);
        }

        // Step 1: Fetch all users of that year
        const documents = await this.prismaService.document.findMany({
            where: {
                createdAt: {
                    gte: new Date(`${year}-01-01T00:00:00.000Z`),
                    lt: new Date(`${year + 1}-01-01T00:00:00.000Z`),
                },
                //if not admin, can see assigned departments all users documents history only
                ...(user.role === Role.ADMIN) ? {} :
                    {
                        user: {
                            departmentGroups: {
                                some: {
                                    department: {
                                        departmentGroups: {
                                            some: {
                                                userId: user.id,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    }
            },
            select: { createdAt: true },
        });

        // Step 2: Create 12 months array
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        const monthsDocumentCount = monthNames.map((month) => ({
            month,
            count: 0,
        }));

        // Step 3: Loop and count documents per month
        documents.forEach((u) => {
            const monthIndex = u.createdAt.getMonth();
            monthsDocumentCount[monthIndex].count += 1;
        });

        return monthsDocumentCount;
    };

}
