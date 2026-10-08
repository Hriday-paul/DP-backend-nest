import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCategoryDto {
  @IsNotEmpty({ message: 'Category name is required' })
  @IsString({ message: 'Category name must be a string' })
  name!: string;

  @IsOptional()
  @IsString({ message: 'Category description must be a string' })
  description?: string;
}

export class UpdateCategoryDto {
  @IsOptional()
  @IsString({ message: 'Category name must be a string' })
  @IsNotEmpty({ message: 'Category name cannot be empty' })
  name?: string;

  @IsOptional()
  @IsString({ message: 'Category description must be a string' })
  description?: string;
}

export class QueryCategoryDto {
  @IsOptional()
  @IsString({ message: 'Search term must be a string' })
  searchTerm?: string;
}

