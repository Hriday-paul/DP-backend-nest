import { Body, ClassSerializerInterceptor, Controller, Headers, HttpCode, Patch, Post, SerializeOptions, UseInterceptors } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserService } from 'src/user/user.service';
import { ChangePasswordDto, LoginDto, RefreshTokenDto, ResendOtpDto, ResetPasswordDto, VerifyOtpDto, VerifyUserEntity } from './dto/auth.dto';
import { CreateUserDto } from 'src/user/dto/user.dto';
import { OtpService } from 'src/otp/otp.service';

@Controller('auth')
export class AuthController {

    constructor(private readonly authService: AuthService, private readonly userService: UserService, private readonly otpService: OtpService) { }

    @HttpCode(201)
    @Post('signup')
    async registerUser(@Body() body: CreateUserDto) {
        const user = await this.userService.addNewuser(body);
        const token = await this.otpService.resendOtp({ email: user?.email });
        return { user, token };
    }

    @Post('login')
    @UseInterceptors(ClassSerializerInterceptor)
    @SerializeOptions({ type: VerifyUserEntity })
    @HttpCode(200)
    async loginUser(@Body() body: LoginDto) {
        return await this.authService.loginUser(body);
    }

    @Post('admin/login')
    @UseInterceptors(ClassSerializerInterceptor)
    @SerializeOptions({ type: VerifyUserEntity })
    @HttpCode(200)
    async adminLogin(@Body() body: LoginDto) {
        return await this.authService.adminLogin(body);
    }

    @Post('forgot-password')
    @HttpCode(200)
    async forgotPassword(@Body() body: ResendOtpDto) {
        return await this.authService.forgotPassword(body.email);
    }

    @UseInterceptors(ClassSerializerInterceptor)
    @SerializeOptions({ type: VerifyUserEntity })
    @HttpCode(200)
    @Post("verify-otp")
    async verifyOtp(@Body() body: VerifyOtpDto, @Headers('token') authToken: string) {
        return await this.otpService.verifyOtp(authToken, body?.otp);
    }

    @Post("resend-otp")
    async resendOtp(@Body() body: ResendOtpDto) {
        return await this.otpService.resendOtp(body);
    }

    @Patch("reset-password")
    @HttpCode(200)
    async resetPassword(@Body() body: ResetPasswordDto, @Headers('token') authToken: string) {
        return await this.authService.resetPassword(authToken, body);
    }

    @Post("change-password")
    @HttpCode(200)
    async changePassword(@Body() body: ChangePasswordDto) {
        // return await this.authService.changePassword(userId, body);
    }

    @Post("refresh")
    @HttpCode(201)
    async refreshToken(@Body() body: RefreshTokenDto) {
        return await this.authService.refreshToken(body.refreshToken);
    }
}
