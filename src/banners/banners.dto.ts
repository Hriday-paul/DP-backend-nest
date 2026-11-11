import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, Min } from 'class-validator';

export class UpdateBannerOrderDto {
  @IsNotEmpty({ message: 'Order is required' })
  @Type(() => Number)
  @IsInt({ message: 'Order must be an integer' })
  @Min(0, { message: 'Order cannot be negative' })
  order!: number;
}
