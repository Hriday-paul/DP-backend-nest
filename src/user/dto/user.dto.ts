import { Auth, Role } from "@prisma/client"
import { Exclude, Type } from "class-transformer"
import { IsArray, IsEmail, IsIn, IsMobilePhone, IsNotEmpty, IsStrongPassword, IsUUID, IsOptional, ArrayMinSize, ValidateIf, isBoolean, IsBoolean, IsDefined } from "class-validator"

export class CreateUserDto {
    @IsNotEmpty({ message: 'Name is required' })
    name!: string

    @IsNotEmpty({ message: 'Email is required' })
    @IsEmail({}, { message: 'Email is not valid' })
    email!: string

    // @ValidateIf((_, value) => value !== '')
    // @IsMobilePhone(undefined, {}, { message: 'Phone number is not valid' })
    phone!: string

    @IsOptional()
    address!: string

    @IsNotEmpty({ message: 'Password is required' })
    @IsStrongPassword({ minLength: 8, minUppercase: 1, minLowercase: 1, minNumbers: 1, minSymbols: 1 }, { message: 'Password is not strong enough. It should be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number and one symbol.' })
    password!: string

}

export class StatusUpdateDto {
    @IsDefined({ message: 'Status is required' })
    @IsBoolean({ message: 'Status must be a boolean value' })
    isActive!: boolean
}

export class UserEntity {

    constructor(partial: Partial<UserEntity>) {
        Object.assign(this, partial);
    }

    @Type(() => AuthEntity)
    auth!: AuthEntity | null
}


export class AuthEntity {

    constructor(partial: Partial<Auth>) {
        Object.assign(this, partial);
    }

    @Exclude()
    isVerified!: boolean;

    @Exclude()
    isDeleted!: boolean;

    @Exclude()
    isActive!: boolean;

    @Exclude()
    password!: string;

    @Exclude()
    id!: string;

    @Exclude()
    last_loginAt!: Date | null;

    @Exclude()
    passwordChangedAt!: Date | null;

    @Exclude()
    userId!: string;
}