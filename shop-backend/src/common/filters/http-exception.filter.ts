import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
} from "@nestjs/common";

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
    catch(exception: HttpException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const status = ctx.getResponse().getStatus();
        const exceptionResponse = exception.getResponse() as {
            message: string | string[];
        };

        response.status(status).json({
            success: false,
            statusCode: status,
            message: exceptionResponse["message"] ?? exception.message,
        });
    }
}
