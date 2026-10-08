import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AccountType, VariantBadge } from '@prisma/client';

export class ServiceImageDto {
  @IsNotEmpty({ message: 'Image URL is required' })
  @IsString({ message: 'Image URL must be a string' })
  url!: string;

  @IsNotEmpty({ message: 'Image key is required' })
  @IsString({ message: 'Image key must be a string' })
  key!: string;
}

export class CreateVariantDto {
  @IsNotEmpty({ message: 'Timeline is required' })
  @IsString({ message: 'Timeline must be a string' })
  timeLine!: string;

  @IsNotEmpty({ message: 'Base price is required' })
  @IsNumber({}, { message: 'Base price must be a number' })
  @Min(0, { message: 'Base price cannot be negative' })
  base_price!: number;

  @IsOptional()
  @IsNumber({}, { message: 'Discount must be a number' })
  @Min(0, { message: 'Discount cannot be negative' })
  discount?: number;

  @IsNotEmpty({ message: 'Final price is required' })
  @IsNumber({}, { message: 'Final price must be a number' })
  @Min(0, { message: 'Final price cannot be negative' })
  final_price!: number;

  @IsOptional()
  @IsArray({ message: 'Badges must be an array' })
  @IsEnum(VariantBadge, { each: true, message: 'Invalid variant badge' })
  badges?: VariantBadge[];

  @IsOptional()
  @IsString({ message: 'Note must be a string' })
  note?: string;

  @IsNotEmpty({ message: 'Account type is required' })
  @IsEnum(AccountType, { message: 'Account type must be SHARED or PERSONAL' })
  accountType!: AccountType;
}

export class CreateServiceDto {
  @IsNotEmpty({ message: 'Title is required' })
  @IsString({ message: 'Title must be a string' })
  title!: string;

  @IsNotEmpty({ message: 'Description is required' })
  @IsString({ message: 'Description must be a string' })
  description!: string;

  @IsOptional()
  @IsString({ message: 'Note must be a string' })
  note?: string;

  @IsNotEmpty({ message: 'Category is required' })
  @IsUUID(undefined, { message: 'Category ID must be a valid UUID' })
  categoryId!: string;

  @IsOptional()
  @IsArray({ message: 'Images must be an array' })
  @ArrayMinSize(1, { message: 'At least one image is required' })
  @ValidateNested({ each: true })
  @Type(() => ServiceImageDto)
  images?: ServiceImageDto[];

  @IsOptional()
  @IsArray({ message: 'Variants must be an array' })
  @ArrayMinSize(1, { message: 'At least one variant is required' })
  @ValidateNested({ each: true })
  @Type(() => CreateVariantDto)
  variants?: CreateVariantDto[];
}

export class UpdateServiceDto {
  @IsOptional()
  @IsString({ message: 'Title must be a string' })
  @IsNotEmpty({ message: 'Title cannot be empty' })
  title?: string;

  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  @IsNotEmpty({ message: 'Description cannot be empty' })
  description?: string;

  @IsOptional()
  @IsString({ message: 'Note must be a string' })
  note?: string;

  @IsOptional()
  @IsUUID(undefined, { message: 'Category ID must be a valid UUID' })
  categoryId?: string;

  @IsOptional()
  @IsArray({ message: 'Images must be an array' })
  @ValidateNested({ each: true })
  @Type(() => ServiceImageDto)
  images?: ServiceImageDto[];

  @IsOptional()
  @IsArray({ message: 'Variants must be an array' })
  @ValidateNested({ each: true })
  @Type(() => CreateVariantDto)
  variants?: CreateVariantDto[];
}

