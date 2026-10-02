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


@Module({
  imports: [UserModule, AuthModule, ConfigModule.forRoot(), DashboardModule, NotificationModule],
  controllers: [AppController],
  providers: [AppService],
})

export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .exclude({ path: 'documents/upload/progress', method: RequestMethod.ALL },
        { path: 'documents/download/:token', method: RequestMethod.GET },
      )
      .forRoutes(
        "users",
        { path: 'auth/change-password', method: RequestMethod.POST },
        "dashboard",
        "notifications"
      )
  }
}
