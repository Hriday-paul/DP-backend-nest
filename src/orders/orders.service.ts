import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { OrderStatus, PaymentStatus, Prisma, Role } from '@prisma/client';
import {
  PlaceOrderDto,
  QueryOrderDto,
  UpdateOrderStatusDto,
  UpdatePaymentStatusDto,
} from './orders.dto';
import { paginationHelper, TPaginationOptions } from 'src/common/helper/pagination.helper';

@Injectable()
export class OrdersService {
  constructor(private readonly prismaService: PrismaService) { }

  async placeOrder(
    payload: PlaceOrderDto,
    currentUser: { id: string; role: Role },
  ) {
    // 1. Verify service exists and is not deleted
    const service = await this.prismaService.serivce.findFirst({
      where: {
        id: payload.serviceId,
        isDeleted: false,
      },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    // 2. Verify variant exists, is not deleted, and belongs to the service
    const variant = await this.prismaService.variant.findFirst({
      where: {
        id: payload.variantId,
        serviceId: payload.serviceId,
        isDeleted: false,
      },
    });

    if (!variant) {
      throw new BadRequestException(
        'Selected variant does not exist or does not belong to this service',
      );
    }

    const orderAmount = payload.amount ?? variant.final_price;

    // 3. Atomically create payment, order, and notification in transaction
    const newOrder = await this.prismaService.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          amount: orderAmount,
          paymentMethod: payload.paymentMethod,
          accountNumber: payload.accountNumber.trim(),
          transactionId: payload.transactionId.trim(),
          userId: currentUser.id,
          status: PaymentStatus.PENDING,
        },
      });

      const order = await tx.order.create({
        data: {
          userId: currentUser.id,
          serviceId: payload.serviceId,
          variantId: payload.variantId,
          paymentId: payment.id,
          customerName: payload.customerName.trim(),
          customerEmail: payload.customerEmail.trim(),
          customerWhatsapp: payload.customerWhatsapp.trim(),
          customerNote: payload.customerNote?.trim(),
          status: OrderStatus.PENDING,
        },
        include: {
          service: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
          variant: {
            select: {
              id: true,
              timeLine: true,
              final_price: true,
              accountType: true,
            },
          },
          payment: true,
        },
      });

      await tx.notification.create({
        data: {
          receiverId: currentUser.id,
          title: 'Order Placed Successfully',
          message: `Your order for ${service.title} (${variant.timeLine}) has been placed and is currently pending verification.`,
        },
      });

      return order;
    });

    return newOrder;
  }

  async getAllOrders(
    query: QueryOrderDto,
    options: TPaginationOptions) {
    const { limit, skip, sortBy, sortOrder, page } = paginationHelper.calculatePagination(options);

    const andConditions: Prisma.OrderWhereInput[] = [];

    if (query.status) {
      andConditions.push({ status: query.status });
    }

    if (query.paymentStatus) {
      andConditions.push({ payment: { status: query.paymentStatus } });
    }

    if (query.searchTerm) {
      const term = query.searchTerm.trim();
      andConditions.push({
        OR: [
          { customerName: { contains: term, mode: 'insensitive' } },
          { customerEmail: { contains: term, mode: 'insensitive' } },
          { customerWhatsapp: { contains: term, mode: 'insensitive' } },
          { service: { title: { contains: term, mode: 'insensitive' } } },
          { payment: { transactionId: { contains: term, mode: 'insensitive' } } },
          { payment: { accountNumber: { contains: term, mode: 'insensitive' } } },
        ],
      });
    }

    const whereConditions: Prisma.OrderWhereInput =
      andConditions.length > 0 ? { AND: andConditions } : {};

    const [data, total] = await Promise.all([
      this.prismaService.order.findMany({
        where: whereConditions,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          service: {
            select: {
              id: true,
              title: true,
              slug: true,
              images: {
                select: {
                  key: true,
                  url: true,
                  id: true
                }
              }
            },
          },
          variant: {
            select: {
              id: true,
              timeLine: true,
              base_price: true,
              discount: true,
              final_price: true,
              accountType: true,
            },
          },
          payment: true,
        },
      }),
      this.prismaService.order.count({
        where: whereConditions,
      }),
    ]);

    return {
      meta: paginationHelper.generatePaginationMeta({
        page,
        limit,
        total,
      }),
      data,
    };
  }

  async myorders(userId: string, query: QueryOrderDto, options: TPaginationOptions) {
    const { limit, skip, sortBy, sortOrder, page } = paginationHelper.calculatePagination(options);

    const { searchTerm, status, paymentStatus } = query;

    const andConditions: Prisma.OrderWhereInput[] = [
      { userId },
    ];

    if (status) {
      andConditions.push({ status: status });
    }

    if (paymentStatus) {
      andConditions.push({ payment: { status: paymentStatus } });
    }

    if (searchTerm) {
      const term = searchTerm.trim();
      andConditions.push({
        OR: [
          { customerName: { contains: term, mode: 'insensitive' } },
          { customerEmail: { contains: term, mode: 'insensitive' } },
          { customerWhatsapp: { contains: term, mode: 'insensitive' } },
          { service: { title: { contains: term, mode: 'insensitive' } } },
          { payment: { transactionId: { contains: term, mode: 'insensitive' } } },
          { payment: { accountNumber: { contains: term, mode: 'insensitive' } } },
        ],
      });
    }

    const whereConditions: Prisma.OrderWhereInput =
      andConditions.length > 0 ? { AND: andConditions } : {};

    const [data, total] = await Promise.all([
      this.prismaService.order.findMany({
        where: whereConditions,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          service: {
            select: {
              id: true,
              title: true,
              slug: true,
              images: {
                select: {
                  key: true,
                  url: true,
                  id: true
                }
              }
            },
          },
          variant: {
            select: {
              id: true,
              timeLine: true,
              base_price: true,
              discount: true,
              final_price: true,
              accountType: true,
            },
          },
          payment: true,
        },
      }),
      this.prismaService.order.count({
        where: whereConditions,
      }),
    ]);

    return {
      meta: paginationHelper.generatePaginationMeta({
        page,
        limit,
        total,
      }),
      data,
    };

  }

  async updatePaymentStatus(
    orderId: string,
    payload: UpdatePaymentStatusDto,
  ) {
    const order = await this.prismaService.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const updatedPayment = await this.prismaService.payment.update({
      where: { id: order.paymentId },
      data: {
        status: payload.status,
        lastActionAt: new Date(),
      },
    });

    await this.prismaService.notification.create({
      data: {
        receiverId: order.userId,
        title: 'Payment Status Updated',
        message: `The payment status for your order has been updated to ${payload.status}.`,
      },
    });

    return {
      ...order,
      payment: updatedPayment,
    };
  }

  async updateOrderStatus(
    orderId: string,
    payload: UpdateOrderStatusDto,
  ) {
    const order = await this.prismaService.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const updatedOrder = await this.prismaService.order.update({
      where: { id: orderId },
      data: {
        status: payload.status,
      },
      include: {
        service: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        variant: {
          select: {
            id: true,
            timeLine: true,
            final_price: true,
            accountType: true,
          },
        },
        payment: true,
      },
    });

    await this.prismaService.notification.create({
      data: {
        receiverId: order.userId,
        title: 'Order Status Updated',
        message: `Your order status has been updated to ${payload.status}.`,
      },
    });

    return updatedOrder;
  }
}
