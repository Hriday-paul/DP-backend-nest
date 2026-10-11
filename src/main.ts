import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter, ResponseInterceptor } from './common/interceptors/response.interceptor';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useStaticAssets(join(process.cwd(), 'public', "images"), { prefix: '/images/', });

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: ["https://asifzonebd.com", "https://www.asifzonebd.com", "https://admin.asifzonebd.com", "https://www.admin.asifzonebd.com"],
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    exceptionFactory: (errors) => {

      const formattedErrors = {};

      errors.forEach((error) => {
        const field = error.property;

        formattedErrors[field] = Object.values(error.constraints || []);
      });

      return new BadRequestException({
        message: 'Validation failed',
        errors: formattedErrors,
        statusCode: 400,
        error: 'Bad Request',
      });
    },
  }));

  app.useGlobalInterceptors(
    new ResponseInterceptor(app.get(Reflector)),
  );

  app.useGlobalFilters(
    new AllExceptionsFilter(),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
