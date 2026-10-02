import { Body, ClassSerializerInterceptor, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Query, Req, SerializeOptions, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { UserService } from './user.service';
import { Roles } from 'src/common/deorators/role.decorator';
import { Role } from '@prisma/client';
import { PermissionGuard } from 'src/common/guards/permisson.guard';
import { CreateUserDto, UserEntity } from './dto/user.dto';
import { ResponseMessage } from 'src/common/deorators/apiResponse.decorator';
import pick from 'src/common/shared/pick';
import { PaginateOptions } from 'src/common/helper/pagination.helper';
import path from 'path';
import fs from 'fs-extra';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { config } from 'src/common/constant';

const CHUNK_SIZE_LIMIT = 5 * 1024 * 1024 + 100 * 1024; // 5MB + 100KB buffer

const TMP_DIR = path.join(process.cwd(), 'public', 'images');

@Controller('users')
@Roles(Role.ADMIN)
export class UserController {

    constructor(private readonly userService: UserService) { }

    @UseGuards(PermissionGuard)
    @ResponseMessage('Users retrieved successfully')
    @HttpCode(200)
    @Get()
    async getUsers(@Query() query: Record<string, unknown>) {
        const filtered_query = pick(query, ["searchTerm", "role"])
        const options = pick(query, PaginateOptions);
        const data = await this.userService.allUsers(filtered_query, options);

        return data;
    }

    @Roles(Role.MEMBER, Role.MANAGER)
    @UseGuards(PermissionGuard)
    @UseInterceptors(ClassSerializerInterceptor)
    @SerializeOptions({ type: UserEntity })
    @HttpCode(200)
    @ResponseMessage('Profile retrieved successfully')
    @Get('my-profile')
    async getMyProfile(@Req() req: Request) {
        const userID = req['user'].id;
        const user = await this.userService.getUserDetails(userID);
        return user
    }

    @UseGuards(PermissionGuard)
    @ResponseMessage('User invited successfully')
    @HttpCode(201)
    @Post()
    async inviteUser(@Body() inviteUserDto: CreateUserDto, @Req() req: Request) {

        const user = req['user'];

        const data = await this.userService.addNewuser(inviteUserDto, user);

        return data;
    }

    @UseGuards(PermissionGuard)
    @UseInterceptors(ClassSerializerInterceptor)
    @SerializeOptions({ type: UserEntity })
    @HttpCode(200)
    @Get(':id')
    async getUserDetails(@Param('id', ParseUUIDPipe) userID: string): Promise<UserEntity | null> {
        const user = await this.userService.getUserDetails(userID);
        return user
    }

    @UseGuards(PermissionGuard)
    @ResponseMessage('User deleted successfully')
    @HttpCode(200)
    @Delete(':id')
    async dltUser(@Param('id', ParseUUIDPipe) userID: string) {
        await this.userService.dltUser(userID);
    }

    @UseGuards(PermissionGuard)
    @ResponseMessage('File uploading initiated successfully')
    @HttpCode(200)
    @Patch("update-my-profile")
    @UseInterceptors(FileInterceptor('picture', {
        storage: diskStorage({
            destination: (req, file, cb) => {
                const dir = TMP_DIR;
                fs.ensureDirSync(dir);
                cb(null, dir);
            },
            filename: (req, file, cb) => {
                cb(null, `${`${Math.floor(100000 + Math.random() * 900000)}${Date.now()}`}-${file?.originalname}`);
            },
        }),
        limits: { fileSize: CHUNK_SIZE_LIMIT },
        fileFilter: (_, file, cb) => {
            const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

            if (allowedTypes.includes(file.mimetype)) {
                cb(null, true);
            } else {
                cb(new Error('Only image files are allowed'), false);
            }
        },
    }))
    async uploadChunk(@UploadedFile() file: Express.Multer.File, @Body() payload: any, @Req() req: Request) {
        const userID = req['user'].id;

        payload = JSON.parse(payload?.data || '{}');

        if (file) {
            payload.picture = {
                upsert: {
                    update: {
                        key: file.filename,
                        url: `${config.serverDomain}/images/${file.filename}`,
                    },   // update existing picture
                    create: {
                        key: file.filename,
                        url: `${config.serverDomain}/images/${file.filename}`,
                    },    // create new picture if not exists
                }
            };
        }

        const user = await this.userService.updateMyProfile(payload, userID);
        return user;
    }
}
