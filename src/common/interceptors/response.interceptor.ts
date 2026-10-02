import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, map } from 'rxjs';
import { RESPONSE_MESSAGE } from '../deorators/apiResponse.decorator';
import { Response } from 'express';


@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, any> {
    constructor(private readonly reflector: Reflector) { }

    intercept(
        context: ExecutionContext,
        next: CallHandler,
    ): Observable<any> {
        const message = this.reflector.getAllAndOverride<string>(
            RESPONSE_MESSAGE,
            [context.getHandler(),
            context.getClass()]
        );

        return next.handle().pipe(
            map((data) => {
                return {
                    success: true,
                    message: message || 'Success',
                    data,
                };
            }),
        );
    }
}

type ExceptionResponse = {
    message?: string | string[];
    errors?: { [key: string]: string[] };
};


@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();

        const status =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;

        const exceptionResponse =
            exception instanceof HttpException
                ? exception.getResponse() as ExceptionResponse
                : null;

        let message: string | string[] = 'Internal Server Error';
        const errors: { [key: string]: string[] } = {};

        if (
            exceptionResponse &&
            typeof exceptionResponse === 'object' &&
            'message' in exceptionResponse
        ) {
            message = exceptionResponse.message as string | string[];

            if ('errors' in exceptionResponse) {
                const exceptionErrors = exceptionResponse.errors as { [key: string]: string[] };
                Object.assign(errors, exceptionErrors);
            }

        }

        //log full error to console for debugging
        console.log(exception);

        response.status(status).json({
            success: false,
            message,
            errors: Object.keys(errors).length > 0 ? errors : undefined,
            error: {
                statusCode: status,
                code:
                    exception instanceof HttpException
                        ? exception.name
                        : 'INTERNAL_SERVER_ERROR',
            },
        });
    }
}