import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateSupportDto {
  @Transform(trim)
  @IsNotEmpty({ message: 'Name is required' })
  @IsString({ message: 'Name must be a string' })
  @MaxLength(100, { message: 'Name cannot exceed 100 characters' })
  name!: string;

  @Transform(trim)
  @IsNotEmpty({ message: 'Phone is required' })
  @IsString({ message: 'Phone must be a string' })
  @MaxLength(20, { message: 'Phone cannot exceed 20 characters' })
  phone!: string;

  @Transform(({ value }) =>
    typeof value === 'string' && value.trim() === '' ? undefined : trim({ value }),
  )
  @IsOptional()
  @IsEmail({}, { message: 'Email must be valid' })
  email?: string;

  @Transform(trim)
  @IsNotEmpty({ message: 'Subject is required' })
  @IsString({ message: 'Subject must be a string' })
  @MaxLength(200, { message: 'Subject cannot exceed 200 characters' })
  subject!: string;

  @Transform(trim)
  @IsOptional()
  @IsString({ message: 'Details must be a string' })
  @MaxLength(5000, { message: 'Details cannot exceed 5000 characters' })
  details?: string;
}

export class QuerySupportDto {
  @IsOptional()
  @IsString({ message: 'Search term must be a string' })
  searchTerm?: string;
}
