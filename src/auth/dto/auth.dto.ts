import { Type } from "class-transformer";
import { IsEmail, IsString } from "class-validator";
import { UserEntity } from "src/user/dto/user.dto";

export class LoginDto {
    @IsEmail()
    email!: string;

    @IsString()
    password!: string;
}

export class VerifyOtpDto {
    @IsString()
    otp!: string;
}

export class ResendOtpDto {
    @IsEmail()
    email!: string;
}

export class ResetPasswordDto {
    @IsString()
    newPassword!: string;

    @IsString()
    confirmPassword!: string;
}

export class ChangePasswordDto {
    @IsString()
    oldPassword!: string;

    @IsString()
    newPassword!: string;

    @IsString()
    confirmPassword!: string;
}

export class RefreshTokenDto {
    @IsString()
    refreshToken!: string;
}

export class VerifyUserEntity {

    constructor(partial: Partial<UserEntity>) {
        Object.assign(this, partial);
    }

    @Type(() => UserEntity)
    user!: UserEntity | null
}