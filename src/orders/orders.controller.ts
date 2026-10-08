import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import {
  PlaceOrderDto,
  QueryOrderDto,
  UpdateOrderStatusDto,
  UpdatePaymentStatusDto,
} from './orders.dto';
import { Roles } from 'src/common/deorators/role.decorator';
import { Role } from '@prisma/client';
import { PermissionGuard } from 'src/common/guards/permisson.guard';
import { ResponseMessage } from 'src/common/deorators/apiResponse.decorator';
import pick from 'src/common/shared/pick';
import { PaginateOptions } from 'src/common/helper/pagination.helper';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Roles(Role.MEMBER)
  @UseGuards(PermissionGuard)
  @ResponseMessage('Order placed successfully')
  @HttpCode(201)
  @Post()
  async placeOrder(@Body() placeOrderDto: PlaceOrderDto, @Req() req: Request) {
    const currentUser = req['user'];
    return await this.ordersService.placeOrder(placeOrderDto, currentUser);
  }

  @Roles(Role.ADMIN)
  @UseGuards(PermissionGuard)
  @ResponseMessage('Orders retrieved successfully')
  @HttpCode(200)
  @Get()
  async getAllOrders(@Query() query: Record<string, unknown>) {
    const filtered_query = pick(query, ["searchTerm", "status", "paymentStatus"]);
    const options = pick(query, PaginateOptions);
    return await this.ordersService.getAllOrders(filtered_query, options);
  }

  @Roles(Role.MEMBER)
  @UseGuards(PermissionGuard)
  @ResponseMessage('My Orders retrieved successfully')
  @HttpCode(200)
  @Get("my-orders")
  async getMyOrders(@Query() query: Record<string, unknown>, req: Request) {
    const filtered_query = pick(query, ["searchTerm", "status", "paymentStatus"]);
    const options = pick(query, PaginateOptions);
    const userId = req['user'].id;
    return await this.ordersService.myorders(userId, filtered_query, options);
  }

  @Roles(Role.ADMIN)
  @UseGuards(PermissionGuard)
  @ResponseMessage('Payment status updated successfully')
  @HttpCode(200)
  @Patch(':id/payment-status')
  async updatePaymentStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePaymentStatusDto: UpdatePaymentStatusDto,
  ) {
    return await this.ordersService.updatePaymentStatus(
      id,
      updatePaymentStatusDto,
    );
  }

  @Roles(Role.ADMIN, Role.MANAGER)
  @UseGuards(PermissionGuard)
  @ResponseMessage('Order status updated successfully')
  @HttpCode(200)
  @Patch(':id/order-status')
  async updateOrderStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
  ) {
    return await this.ordersService.updateOrderStatus(id, updateOrderStatusDto);
  }
}
