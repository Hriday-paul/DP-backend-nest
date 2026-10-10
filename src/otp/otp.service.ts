import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import moment from 'moment';
import { PrismaService } from 'src/prisma.service';
import * as bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';
import { EmailService } from 'src/common/services/email.service';
import { config } from 'src/common/constant';
import { SignOptions } from 'jsonwebtoken';

@Injectable()
export class OtpService {

    constructor(private readonly prismaService: PrismaService, private readonly jwtService: JwtService, private readonly emailService: EmailService) { }

    async resendOtp({ email }: { email: string }) {
        const user = await this.prismaService.user.findFirst({ where: { email }, include: { auth: true } })

        if (!user) {
            throw new NotFoundException('Account does not exist');
        }

        const otp = this.generateOtp();
        const expiresAt = moment().add(10, 'minute').toDate();

        const hashedOtp = await bcrypt.hash(otp, 10);

        //create a new otp request
        const requestedOtp = await this.prismaService.otpRequest.create({
            data: {
                code: hashedOtp,
                expiredAt: expiresAt,
                createdAt: new Date(),
                isVerified: false,
                type: "REGISTER",
                userId: user?.id
            }
        })

        const jwtPayload = {
            userId: user?.id,
            role: user?.auth?.role,
            requestId: requestedOtp?.id
        };

        const auth_token = this.jwtService.sign(jwtPayload);

        const otpEmailPath = path.join(
            process.cwd(),
            'public',
            'view',
            'otp_mail.html'
        );

        if (user) {
            await this.emailService.sendEmail({
                to: user?.email,
                subject: 'Your One Time OTP',
                html: fs
                    .readFileSync(otpEmailPath, 'utf8')
                    .replace('{{otp}}', otp)
                    .replace('{{email}}', user?.email),
            });
        }

        return {token : auth_token};
    };

    async verifyOtp(token: string, otp: string) {

        if (!token) {
            throw new BadRequestException('Invalid request');
        }

        let decode;

        try {
            decode = this.jwtService.verify(
                token,
            )
        } catch (err) {
            throw new ForbiddenException(
                'Session has expired. Please try to submit OTP within 3 minute',
            );
        }

        if (!decode?.requestId || !decode?.userId) {
            throw new ForbiddenException(
                'Invalid request',
            );
        }

        const user = await this.prismaService.user.findFirst({ where: { id: decode?.userId }, include: { auth: true } });

        const OtpRequest = await this.prismaService.otpRequest.findFirst({ where: { id: decode?.requestId } });

        if (!user || !user?.auth) {
            throw new NotFoundException('User not found');
        }

        if (!OtpRequest) {
            throw new NotFoundException('Request does not exist');
        }
        if (OtpRequest?.isVerified) {
            throw new ConflictException('Otp already verified');
        }
        if (OtpRequest?.type == "REGISTER" && user?.auth?.isVerified) {
            throw new ConflictException('Account already verified');
        }

        if (new Date() > OtpRequest?.expiredAt) {
            throw new ForbiddenException(
                'OTP has expired. Please try to submit OTP within 10 minute',
            );
        }

        const otpMatched = await bcrypt.compare(otp, OtpRequest?.code);

        if (!otpMatched) {
            throw new BadRequestException('OTP did not match');
        }

        await this.prismaService.$transaction(async (tx) => {
            await tx.otpRequest.update({
                where: { id: OtpRequest?.id },
                data: {
                    isVerified: true,
                    verifiedAt: new Date(),
                },
            });

            if (OtpRequest?.type === "REGISTER") {
                await tx.auth.update({
                    where: { id: user?.auth?.id },
                    data: {
                        isVerified: true,
                    },
                });
            }
        });

        const jwtPayload = {
            role: user?.auth?.role,
            userId: user?.id,
            requestId: OtpRequest?.id
        };

        const reset_token = await this.jwtService.signAsync(jwtPayload);

        const access_token = await this.jwtService.signAsync(jwtPayload, {
            secret: config.accessSecret,
            expiresIn: config?.accessExpiresIn as SignOptions['expiresIn']
        });

        return { user: user, accessToken: access_token, resetToken : OtpRequest?.type === "FORGOT_PASSWORD" ? reset_token : undefined };
    };

    generateOtp() {
        const otp = Math.floor(100000 + Math.random() * 900000); // Generate a random 6-digit number
        return otp.toString(); // Convert to string and return
    };


}
