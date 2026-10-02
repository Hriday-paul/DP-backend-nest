import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserModule } from 'src/user/user.module';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './auth.constant';
import { PrismaService } from 'src/prisma.service';
import { OtpService } from 'src/otp/otp.service';
import { EmailService } from 'src/common/services/email.service';

@Module({
  providers: [AuthService, PrismaService, OtpService, EmailService],
  imports: [UserModule, JwtModule.register({
    global: true,
    secret: jwtConstants.auth_secret,
    signOptions: { expiresIn: '10m' },
  }),],
  controllers: [AuthController]
})
export class AuthModule { }
