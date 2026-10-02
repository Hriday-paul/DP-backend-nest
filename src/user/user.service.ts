import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/user.dto';
import { PrismaService } from 'src/prisma.service';
import * as bcrypt from 'bcrypt';
import { Prisma, Role, User } from '@prisma/client';
import { paginationHelper, TPaginationOptions } from 'src/common/helper/pagination.helper';

@Injectable()
export class UserService {

    constructor(private readonly prismaService: PrismaService) { }

    async addNewuser(payload: CreateUserDto, req_user: { id: string, role: string }) {
        const { phone, password, name, email, address, role, departments } = payload

        let isExist = await this.prismaService.user.findFirst({ where: { email }, include: { auth: true } });

        //check user is exist or not
        if (isExist && isExist?.auth?.isVerified) {
            throw new ConflictException(
                'Account already exists with this email',
            );
        }

        // creat encrypted password
        const hashedPassword = await bcrypt.hash(password, 15);

        const user = await this.prismaService.user.upsert({
            where: { email },
            update: {
                name, email,
                departmentGroups: {
                    deleteMany: {},
                    create: departments ? departments?.map((departmentId) => ({ departmentId })) : [],
                },
                auth: {
                    upsert: {
                        update: { password: hashedPassword, role, isVerified: true },
                        create: { password: hashedPassword, email, role, isVerified: true }
                    }
                }
            },
            create: {
                phone,
                name,
                email,
                address,
                departmentGroups: {
                    create: departments ? departments?.map((departmentId) => ({ departmentId })) : [],
                },
                auth: {
                    create: {
                        email,
                        password: hashedPassword,
                        role,
                        isVerified: true
                    }
                }
            },
            include: {
                auth: {
                    select: {
                        email: true,
                        role: true,
                    }
                }
            }
        });

        //create a notification for the new user
        await this.prismaService.notification.create({
            data: {
                title: 'New User Invitation',
                message: `A new user has been invited: ${user?.name}`,
                receiverId: req_user?.id,
            },
        });

        if (!user) {
            throw new InternalServerErrorException('User creation failed');
        }

        return user;
    }

    async allUsers(query: Record<string, unknown>, options: TPaginationOptions) {

        const AndConditions: Prisma.UserWhereInput[] = [{
            isDeleted: false,
            auth: { role: { not: Role.ADMIN } }
        }];

        const { limit, skip, sortBy, sortOrder, page } = paginationHelper.calculatePagination(options);

        const { searchTerm, role } = query;

        if (searchTerm) {
            AndConditions.push({
                OR: [
                    {
                        name: {
                            contains: searchTerm as string,
                            mode: "insensitive",
                        },
                    },
                    {
                        email: {
                            contains: searchTerm as string,
                            mode: "insensitive",
                        },
                    },
                    {
                        phone: {
                            contains: searchTerm as string,
                            mode: "insensitive",
                        },
                    }
                ],
            });
        }

        if (role) {
            AndConditions.push({
                auth: {
                    role
                }
            });
        }

        const whereConditions: Prisma.UserWhereInput = AndConditions.length > 0 ? { AND: AndConditions } : {};

        const result = await this.prismaService.user.findMany({
            where: whereConditions,
            skip,
            take: limit,
            orderBy: {
                [sortBy]: sortOrder,
            },
            include: {
                auth: { select: { isActive: true } },
                picture: true,
                departmentGroups: {
                    include: {
                        department: true
                    }
                }
            },
        })

        const total = await this.prismaService.user.count({
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

    async getUserDetails(userID: string) {
        const user = await this.prismaService.user.findUnique({
            where: { id: userID },
            include: {
                auth: true,
                picture: {
                    select: {
                        url: true,
                    }
                }
            }
        });

        return user;
    }

    async dltUser(userID: string) {
        const user = await this.prismaService.user.findUnique({ where: { id: userID } });
        if (!user) {
            throw new NotFoundException("User does not exist");
        }
        await this.prismaService.user.delete({ where: { id: userID } });
        return;

    }

    async updateMyProfile(payload: Partial<User & { picture: {} }>, userId: string) {

        const { name, fcmToken, phone, address, company, profession, countries, picture } = payload

        const updateFields = { name, fcmToken, phone, address, company, profession, countries, picture };

        // Remove undefined or null fields to prevent overwriting existing values with null
        Object.keys(updateFields).forEach((key) => {
            if (updateFields[key as keyof User] === undefined || updateFields[key as keyof User] === null) {
                delete updateFields[key as keyof User];
            }
        });

        // check updated field found or not
        if (Object.keys(updateFields).length === 0) {
            throw new BadRequestException('No valid fields provided for update');
        }

        const result = await this.prismaService.user.update({
            where: { id: userId },
            data: updateFields
        })

        return result
    }

}
