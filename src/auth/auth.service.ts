import { BadRequestException, ConflictException, ForbiddenException, GoneException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ChangePasswordDto, LoginDto, ResetPasswordDto } from './dto/auth.dto';
import { PrismaService } from 'src/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { SignOptions } from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { config } from 'src/common/constant';
import { OtpService } from 'src/otp/otp.service';
import moment from 'moment';
import fs from 'fs';
import path from 'path';
import { EmailService } from 'src/common/services/email.service';

@Injectable()
export class AuthService {
    constructor(private readonly prismaService: PrismaService, private readonly jwtService: JwtService, private readonly otpService: OtpService, private readonly emailService: EmailService) { }

    async loginUser(payload: LoginDto) {
        const user = await this.prismaService.user.findUnique({
            where: {
                email: payload.email,
                auth: {
                    role : {
                        not: Role.ADMIN
                    }
                }
            },
            include: {
                auth: true,
            }
        });

        if (!user) {
            throw new NotFoundException('User does not exist');
        }

        if (!user?.auth?.isActive) {
            throw new ForbiddenException('Your account is not active');
        }

        if (user?.auth?.isDeleted) {
            throw new GoneException('Your account is deleted');
        }

        if (!user?.auth?.isVerified) {
            throw new ForbiddenException('Your account is not verified');
        }

        // Handle verify password
        const passwordMatched = await bcrypt.compare(payload?.password, user?.auth?.password);

        if (!passwordMatched) {
            throw new ForbiddenException('Please check your credentials and try again');
        }

        //update last login time
        await this.prismaService.auth.update({
            where: { userId: user?.id },
            data: { last_loginAt: new Date() },
        })

        // Generate JWT access token
        const jwtPayload: { userId: string; role: Role } = {
            userId: user?.id,
            role: user?.auth?.role
        };


        const accessToken = await this.jwtService.signAsync(jwtPayload, { expiresIn: config?.accessExpiresIn as SignOptions['expiresIn'], secret: process.env.JWT_ACCESS_SECRET });

        const refreshToken = await this.jwtService.signAsync(jwtPayload, { expiresIn: config?.refreshExpiresIn as SignOptions['expiresIn'], secret: process.env.JWT_REFRESH_SECRET });

        return {
            accessToken,
            refreshToken,
            user
        };

    }

    async adminLogin(payload: LoginDto) {
        const user = await this.prismaService.user.findUnique({
            where: {
                email: payload.email,
                auth: {
                    role : Role.ADMIN
                }
            },
            include: {
                auth: true,
            }
        });

        if (!user) {
            throw new NotFoundException('Account does not exist');
        }

        if (!user?.auth?.isActive) {
            throw new ForbiddenException('Your account is not active');
        }

        if (user?.auth?.isDeleted) {
            throw new GoneException('Your account is deleted');
        }

        if (!user?.auth?.isVerified) {
            throw new ForbiddenException('Your account is not verified');
        }

        // Handle verify password
        const passwordMatched = await bcrypt.compare(payload?.password, user?.auth?.password);

        if (!passwordMatched) {
            throw new ForbiddenException('Please check your credentials and try again');
        }

        //update last login time
        await this.prismaService.auth.update({
            where: { userId: user?.id },
            data: { last_loginAt: new Date() },
        })

        // Generate JWT access token
        const jwtPayload: { userId: string; role: Role } = {
            userId: user?.id,
            role: user?.auth?.role
        };


        const accessToken = await this.jwtService.signAsync(jwtPayload, { expiresIn: config?.accessExpiresIn as SignOptions['expiresIn'], secret: process.env.JWT_ACCESS_SECRET });

        const refreshToken = await this.jwtService.signAsync(jwtPayload, { expiresIn: config?.refreshExpiresIn as SignOptions['expiresIn'], secret: process.env.JWT_REFRESH_SECRET });

        return {
            accessToken,
            refreshToken,
            user
        };

    }

    async forgotPassword(email: string) {
        const user = await this.prismaService.user.findFirst({ where: { email }, include: { auth: true } });

        if (!user) {
            throw new NotFoundException('Account does not exist');
        }

        const currentTime = new Date();
        const otp = this.otpService.generateOtp();
        const expiresAt = moment(currentTime).add(10, 'minute').toDate();

        //hash the otp code
        const hashedOtp = await bcrypt.hash(otp, 10);

        //create a new otp request
        const requestedOtp = await this.prismaService.otpRequest.create({
            data: {
                code: hashedOtp,
                expiredAt: expiresAt,
                createdAt: currentTime,
                isVerified: false,
                type: "FORGOT_PASSWORD",
                userId: user?.id
            }
        })

        const jwtPayload = {
            userId: user?.id,
            role: user?.auth?.role,
            requestId: requestedOtp?.id
        };

        const token = await this.jwtService.signAsync(jwtPayload);

        const otpEmailPath = path.join(
            process.cwd(),
            'public',
            'view',
            'forgot_pass_mail.html'
        );

        // pass the email sending task to the email queue to be processed by the worker
        await this.emailService.sendEmail({
            to: user?.email,
            subject: 'Your One Time OTP',
            html: fs
                .readFileSync(otpEmailPath, 'utf8')
                .replace('{{otp}}', otp)
                .replace('{{email}}', user?.email),
        });


        return { email, token };
    };

    // Reset password
    async resetPassword(token: string, payload: ResetPasswordDto) {
        let decode;

        if (!token) {
            throw new BadRequestException('Invalid request');
        }

        try {
            decode = this.jwtService.verify(token)
        } catch (err) {
            throw new UnauthorizedException(
                'Session has expired. Please try again',
            );
        }

        if (!decode?.requestId || !decode?.userId) {
            throw new ForbiddenException(
                'Invalid request',
            );
        }

        const user = await this.prismaService.user.findUnique({
            where: { id: decode?.userId }, select: {
                auth: true
            }
        })

        const OtpRequest = await this.prismaService.otpRequest.findFirst({ where: { id: decode?.requestId } });

        if (!user || !user?.auth) {
            throw new NotFoundException('Account does not exist');
        }
        if (!OtpRequest) {
            throw new NotFoundException('Request does not exist');
        }
        if (OtpRequest?.type !== "FORGOT_PASSWORD") {
            throw new ConflictException('Invalid request');
        }
        if (!OtpRequest?.isVerified) {
            throw new BadRequestException('OTP is not verified yet');
        }
        if (payload?.newPassword !== payload?.confirmPassword) {
            throw new BadRequestException('New password and confirm password do not match');
        }

        // creat encrypted password
        const hashedPassword = await bcrypt.hash(payload?.newPassword, 12);

        const result = await this.prismaService.user.update({
            where: { id: decode?.userId },
            data: {
                auth: {
                    update: {
                        password: hashedPassword,
                        passwordChangedAt: new Date(),
                    }
                }
            }
        });

        const emailPath = path.join(
            process.cwd(),
            'public',
            'view',
            'password_change.html'
        );

        await this.emailService.sendEmail({
            to: user?.auth?.email,
            subject: 'Your Password has been reseted',
            html: fs
                .readFileSync(emailPath, 'utf8')
        });

        return result;
    };

    //change password
    async changePassword(id: string, payload: ChangePasswordDto) {

        const user = await this.prismaService.user.findFirst({ where: { id }, include: { auth: true } });

        if (!user || !user?.auth) {
            throw new NotFoundException('Account does not exist');
        }

        const passwordMatched = await bcrypt.compare(payload?.oldPassword, user?.auth?.password!);

        if (!passwordMatched) {
            throw new BadRequestException('Old password does not match');
        }
        if (payload?.newPassword !== payload?.confirmPassword) {
            throw new BadRequestException('New password and confirm password do not match');
        }

        // creat encrypted password
        const hashedPassword = await bcrypt.hash(payload?.newPassword, 12);


        const result = await this.prismaService.user.update({
            where: { id },
            data: {
                auth: {
                    update: {
                        data: {
                            password: hashedPassword,
                            passwordChangedAt: new Date(),
                        }
                    }
                }
            }
        }
        );

        const emailPath = path.join(
            process.cwd(),
            'public',
            'view',
            'password_change.html'
        );

        await this.emailService.sendEmail({
            to: user?.auth?.email,
            subject: 'Your password has been reseted',
            html: fs
                .readFileSync(emailPath, 'utf8')
        });

        return result;
    };

    // Refresh token
    async refreshToken(token: string) {

        if (!token) {
            throw new BadRequestException('Invalid request');
        }

        let decode;

        try {
            decode = this.jwtService.verify(token, { secret: config.refreshSecret })
        } catch (err) {
            throw new ForbiddenException(
                'Session has expired. Please login again',
            );
        }

        if (!decode?.userId) {
            throw new ForbiddenException(
                'Invalid request',
            );
        }

        const user = await this.prismaService.user.findFirst({ where: { id: decode?.userId }, include: { auth: true } });

        if (!user || !user?.auth) {
            throw new NotFoundException('Account does not exist');
        }
        const isDeleted = user?.auth?.isDeleted;

        if (isDeleted) {
            throw new GoneException('This account is deleted');
        }

        const jwtPayload = {
            userId: user?.id,
            role: user.auth?.role,
        };

        const accessToken = this.jwtService.sign(
            jwtPayload,
            {
                secret: config.accessSecret,
                expiresIn: config.accessExpiresIn as SignOptions['expiresIn']
            }
        );

        const refreshToken = this.jwtService.sign(
            jwtPayload,
            {
                secret: config.refreshSecret,
                expiresIn: config.refreshExpiresIn as SignOptions['expiresIn']
            }
        );

        return {
            accessToken,
            refreshToken
        };
    };
}
