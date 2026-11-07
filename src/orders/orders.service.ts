import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { OrderStatus, Prisma, Role } from '@prisma/client';
import {
  PlaceOrderDto,
  QueryOrderDto,
  UpdateOrderStatusDto,
} from './orders.dto';
import { paginationHelper, TPaginationOptions } from 'src/common/helper/pagination.helper';

@Injectable()
export class OrdersService {
  constructor(private readonly prismaService: PrismaService) { }

  async placeOrder(
    payload: PlaceOrderDto,
    currentUser: { id: string; role: Role },
  ) {

    const services = await this.prismaService.serivce.findMany({
      where: {
        id: { in: payload.services.map((item) => item.serviceId) },
        isDeleted: false,
      },
      include: {
        variants: true
      }
    });


    //check if all services exist
    if (services.length !== payload.services.length) {
      throw new NotFoundException('Service not found');
    }

    // 2. Verify variant exists, is not deleted, and belongs to the service
    const serviceVariantMap = new Map<string, Prisma.VariantGetPayload<{}>[]>();
    services.forEach((service) => {
      serviceVariantMap.set(service.id, service.variants);
    });

    for (const item of payload.services) {
      const variants = serviceVariantMap.get(item.serviceId);
      if (!variants) {
        throw new NotFoundException(`Service with ID ${item.serviceId} not found`);
      }

      const variant = variants.find((v) => v.id === item.varientId);
      if (!variant) {
        throw new NotFoundException(`Variant with ID ${item.varientId} not found for service ${item.serviceId}`);
      }

    }

    const orderAmount = payload.services.reduce((total, item) => {
      const service = services.find((s) => s.id === item.serviceId);
      const variant = service?.variants.find((v) => v.id === item.varientId);

      if (!service || !variant) {
        throw new NotFoundException(`Service or variant not found for service ID ${item.serviceId} and variant ID ${item.varientId}`);
      }

      return total + variant.final_price * item.quantity;
    }, 0);

    // 3. Atomically create payment, order, and notification in transaction
    const newOrder = await this.prismaService.$transaction(async (tx) => {

      const order = await tx.order.create({
        data: {
          userId: currentUser.id,

          paymentMethod: payload.paymentMethod,
          accountNumber: payload.accountNumber.trim(),
          transactionId: payload.transactionId.trim(),

          price: orderAmount,
          items: {
            createMany: {
              data: payload.services.map((item) => ({
                serviceId: item.serviceId,
                variantId: item.varientId,
                quantity: item.quantity,
                unitPrice: 0,
                totalPrice: 0
              }))
            }
          },
          customerName: payload.customerName.trim(),
          customerEmail: payload.customerEmail.trim(),
          customerWhatsapp: payload.customerWhatsapp.trim(),
          customerNote: payload.customerNote?.trim(),
          status: OrderStatus.PENDING,
        },
        include: {

          items: {
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
            }
          }

        },
      });

      await tx.notification.create({
        data: {
          receiverId: currentUser.id,
          title: 'Order Placed Successfully',
          message: `Your order for has been placed and is currently pending verification.`,
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

    if (query.searchTerm) {
      const term = query.searchTerm.trim();
      andConditions.push({
        OR: [
          { customerName: { contains: term, mode: 'insensitive' } },
          { customerEmail: { contains: term, mode: 'insensitive' } },
          { customerWhatsapp: { contains: term, mode: 'insensitive' } },
          // { service: { title: { contains: term, mode: 'insensitive' } } },
          { accountNumber: { contains: term, mode: 'insensitive' } }
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

          items: {
            include: {
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
            }
          }

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

    const { searchTerm, status } = query;

    const andConditions: Prisma.OrderWhereInput[] = [
      { userId },
    ];

    if (status) {
      andConditions.push({ status: status });
    }

    if (searchTerm) {
      const term = searchTerm.trim();
      andConditions.push({
        OR: [
          { customerName: { contains: term, mode: 'insensitive' } },
          { customerEmail: { contains: term, mode: 'insensitive' } },
          { customerWhatsapp: { contains: term, mode: 'insensitive' } },
          // { service: { title: { contains: term, mode: 'insensitive' } } },
          { accountNumber: { contains: term, mode: 'insensitive' } }
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
          items: {
            include: {
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
            }
          }
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
