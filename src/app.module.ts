import { Module, RequestMethod } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';

import { NestModule, MiddlewareConsumer } from '@nestjs/common';
import { AuthMiddleware } from './common/middleware/auth.middleware';
import { DashboardModule } from './dashboard/dashboard.module';
import { NotificationModule } from './notification/notification.module';
import { CategoriesModule } from './categories/categories.module';
import { ServicesModule } from './services/services.module';


@Module({
  imports: [UserModule, AuthModule, ConfigModule.forRoot(), DashboardModule, NotificationModule, CategoriesModule, ServicesModule],
  controllers: [AppController],
  providers: [AppService],
})

export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .exclude(
        { path: 'categories', method: RequestMethod.GET },
        { path: 'categories/:id', method: RequestMethod.GET },
        { path: 'services', method: RequestMethod.GET },
        { path: 'services/:id', method: RequestMethod.GET },
      )
      .forRoutes(
        "users",
        { path: 'auth/change-password', method: RequestMethod.POST },
        "dashboard",
        "notifications",
        "categories",
        "services",
      )
  }
}
