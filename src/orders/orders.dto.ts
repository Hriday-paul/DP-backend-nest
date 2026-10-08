import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { OrderStatus, PaymentMethod, PaymentStatus } from '@prisma/client';

export class PlaceOrderDto {
  @IsNotEmpty({ message: 'Service ID is required' })
  @IsUUID(undefined, { message: 'Service ID must be a valid UUID' })
  serviceId!: string;

  @IsNotEmpty({ message: 'Variant ID is required' })
  @IsUUID(undefined, { message: 'Variant ID must be a valid UUID' })
  variantId!: string;

  @IsNotEmpty({ message: 'Customer name is required' })
  @IsString({ message: 'Customer name must be a string' })
  customerName!: string;

  @IsNotEmpty({ message: 'Customer email is required' })
  @IsEmail({}, { message: 'Customer email must be valid' })
  customerEmail!: string;

  @IsNotEmpty({ message: 'Customer WhatsApp number is required' })
  @IsString({ message: 'Customer WhatsApp number must be a string' })
  customerWhatsapp!: string;

  @IsOptional()
  @IsString({ message: 'Customer note must be a string' })
  customerNote?: string;

  @IsNotEmpty({ message: 'Payment method is required' })
  @IsEnum(PaymentMethod, { message: 'Invalid payment method' })
  paymentMethod!: PaymentMethod;

  @IsNotEmpty({ message: 'Account number is required' })
  @IsString({ message: 'Account number must be a string' })
  accountNumber!: string;

  @IsNotEmpty({ message: 'Transaction ID is required' })
  @IsString({ message: 'Transaction ID must be a string' })
  transactionId!: string;

  @IsOptional()
  @IsNumber({}, { message: 'Amount must be a number' })
  @Min(0, { message: 'Amount cannot be negative' })
  amount?: number;
}

export class QueryOrderDto {
  @IsOptional()
  @IsString({ message: 'Search term must be a string' })
  searchTerm?: string;

  @IsOptional()
  @IsEnum(OrderStatus, { message: 'Invalid order status' })
  status?: OrderStatus;

  @IsOptional()
  @IsEnum(PaymentStatus, { message: 'Invalid payment status' })
  paymentStatus?: PaymentStatus;

  @IsOptional()
  @IsUUID(undefined, { message: 'Service ID must be a valid UUID' })
  serviceId?: string;

  @IsOptional()
  @IsUUID(undefined, { message: 'User ID must be a valid UUID' })
  userId?: string;

  @IsOptional()
  page?: number | string;

  @IsOptional()
  limit?: number | string;

  @IsOptional()
  @IsString({ message: 'Sort by must be a string' })
  sortBy?: string;

  @IsOptional()
  @IsString({ message: 'Sort order must be a string' })
  sortOrder?: string;
}

export class UpdatePaymentStatusDto {
  @IsNotEmpty({ message: 'Payment status is required' })
  @IsEnum(PaymentStatus, { message: 'Invalid payment status' })
  status!: PaymentStatus;
}

export class UpdateOrderStatusDto {
  @IsNotEmpty({ message: 'Order status is required' })
  @IsEnum(OrderStatus, { message: 'Invalid order status' })
  status!: OrderStatus;
}

